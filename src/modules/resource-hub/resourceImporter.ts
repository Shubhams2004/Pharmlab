import { saveBookPackage } from '../knowledge-library/libraryDb';
import { processPdfFile } from '../knowledge-library/pdfExtractor';
import { LibraryBookMeta, ProcessingProgress } from '../knowledge-library/types';
import { OpenAccessCandidate, VisualMediaItem } from '../visual-library/types';
import { importOpenAccessImage } from '../visual-library/visualDb';
import { upsertSavedResourceRecord } from './resourceHubStorage';
import {
  PdfImportOverrides,
  SavedResourceRecord,
  ScientificResourceItem,
  VisualImportOverrides
} from './types';
import { createTimeoutSignal, sanitizeHttpUrl } from './utils';

function buildSafePdfFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return `${slug || 'scientific_resource'}.pdf`;
}

function resourceToOpenAccessCandidate(item: ScientificResourceItem): OpenAccessCandidate {
  const fullUrl = item.imageUrl || item.previewUrl || item.sourceUrl;
  return {
    id: item.id,
    repository: item.providerName,
    title: item.title,
    description: item.summary || item.abstractText || item.title,
    previewUrl: item.previewUrl || fullUrl,
    fullUrl,
    sourceUrl: item.sourceUrl,
    creator: item.authors.join(', ') || item.providerName,
    license: item.license,
    licenseUrl: item.licenseUrl,
    attribution:
      item.attribution ||
      `${item.title} (${item.license}) via ${item.providerName}`,
    isPermissiveLicense: item.isPermissiveLicense,
    licenseWarning: item.licenseWarning,
    mimeType: item.mimeType || 'image/png',
    width: item.width,
    height: item.height,
    suggestedCategory: item.suggestedCategory,
    suggestedDepartments: item.suggestedDepartments
  };
}

export async function importVisualResourceToLibrary(
  item: ScientificResourceItem,
  overrides: VisualImportOverrides
): Promise<{ visual: VisualMediaItem; record: SavedResourceRecord }> {
  const candidate = resourceToOpenAccessCandidate(item);
  const contextLabels = overrides.contexts.map((c) => c.label);
  const combinedTopics = Array.from(new Set([...overrides.topics, ...contextLabels]));

  try {
    const visual = await importOpenAccessImage(candidate, {
      title: overrides.title?.trim() || item.title,
      category: overrides.category,
      departments: overrides.departments,
      topics: combinedTopics,
      tags: Array.from(new Set([item.providerName, ...combinedTopics])).slice(0, 8)
    });

    const { record } = upsertSavedResourceRecord(item, {
      status: 'imported',
      destination: 'visual_library',
      linkedVisualId: visual.id,
      contexts: overrides.contexts,
      topics: combinedTopics,
      importNote: overrides.note,
      lastError: undefined
    });

    return { visual, record };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to import visual into Visual Library.';
    upsertSavedResourceRecord(item, {
      status: 'failed',
      destination: 'visual_library',
      contexts: overrides.contexts,
      topics: combinedTopics,
      lastError: message
    });
    throw new Error(message);
  }
}

async function processPdfFileAndSave(
  file: File,
  item: ScientificResourceItem,
  overrides: PdfImportOverrides,
  onProgress: (p: ProcessingProgress) => void
): Promise<{ meta: LibraryBookMeta; record: SavedResourceRecord }> {
  const contextLabels = overrides.contexts.map((c) => c.label);
  const combinedTopics = Array.from(new Set([...overrides.topics, ...contextLabels]));

  const pkg = await processPdfFile(
    file,
    overrides.category,
    onProgress,
    overrides.department
  );

  const customTitle = overrides.title?.trim();
  const finalMeta: LibraryBookMeta = {
    ...pkg.meta,
    title: customTitle && customTitle.length > 2 ? customTitle : item.title || pkg.meta.title
  };

  await saveBookPackage(finalMeta, pkg.fileBuffer, pkg.pages);

  const { record } = upsertSavedResourceRecord(item, {
    status: 'imported',
    destination: 'knowledge_library',
    linkedBookId: finalMeta.id,
    contexts: overrides.contexts,
    topics: combinedTopics,
    importNote: overrides.note,
    lastError: undefined
  });

  return { meta: finalMeta, record };
}

export async function importLocalPdfForResource(
  file: File,
  item: ScientificResourceItem,
  overrides: PdfImportOverrides,
  onProgress: (p: ProcessingProgress) => void
): Promise<{ meta: LibraryBookMeta; record: SavedResourceRecord }> {
  try {
    return await processPdfFileAndSave(file, item, overrides, onProgress);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process PDF file.';
    upsertSavedResourceRecord(item, {
      status: 'failed',
      destination: 'knowledge_library',
      contexts: overrides.contexts,
      topics: overrides.topics,
      lastError: message
    });
    throw new Error(message);
  }
}

export async function attemptRemotePdfImport(
  item: ScientificResourceItem,
  overrides: PdfImportOverrides,
  onProgress: (p: ProcessingProgress) => void
): Promise<{ meta: LibraryBookMeta; record: SavedResourceRecord }> {
  const safeUrl = sanitizeHttpUrl(item.pdfUrl);
  if (!safeUrl) {
    const msg = 'No direct PDF URL is advertised by this repository record.';
    upsertSavedResourceRecord(item, {
      status: 'unavailable',
      destination: 'knowledge_library',
      contexts: overrides.contexts,
      topics: overrides.topics,
      lastError: msg
    });
    throw new Error(msg);
  }

  onProgress({
    stage: 'reading',
    currentPage: 0,
    totalPages: 0,
    percent: 2,
    message: `Connecting to ${item.providerName} PDF endpoint...`
  });

  const { signal, cleanup } = createTimeoutSignal(undefined, 20000);
  try {
    const res = await fetch(safeUrl, { mode: 'cors', signal });
    if (!res.ok) {
      throw new Error(
        `Remote PDF server returned HTTP ${res.status}. Open the official link in a new tab to download the PDF locally, then select it below to import.`
      );
    }

    const contentLength = Number(res.headers.get('content-length') || '0');
    if (contentLength > 65 * 1024 * 1024) {
      throw new Error(
        `Remote PDF is ${(contentLength / (1024 * 1024)).toFixed(0)} MB, which exceeds safe in-memory browser download limits. Download from the official link and upload manually.`
      );
    }

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const hasPdfMagic =
      bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46; // %PDF

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!hasPdfMagic && !ct.includes('application/pdf')) {
      throw new Error(
        'The remote server returned an HTML/verification page rather than raw PDF bytes (common on CDN-protected archives). Download the PDF via the official link, then select the downloaded file below.'
      );
    }

    const file = new File([buf], buildSafePdfFilename(overrides.title || item.title), {
      type: 'application/pdf'
    });
    return await processPdfFileAndSave(file, item, overrides, onProgress);
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : 'Download failed';
    const isCorsOrNetwork =
      err instanceof TypeError || /failed to fetch|cors|networkerror/i.test(rawMsg);
    const friendly = isCorsOrNetwork
      ? `${item.providerName}'s PDF host restricts direct cross-origin browser downloads (CORS policy). Open the official Open-Access PDF in a new tab to save it, then drop the PDF file below to import & index it locally.`
      : rawMsg;

    upsertSavedResourceRecord(item, {
      status: isCorsOrNetwork ? 'unavailable' : 'failed',
      destination: 'knowledge_library',
      contexts: overrides.contexts,
      topics: overrides.topics,
      lastError: friendly
    });
    throw new Error(friendly);
  } finally {
    cleanup();
  }
}
