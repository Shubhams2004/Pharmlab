import { classifyPdfError, pdfjsLib } from './pdfWorker';
import {
  BookDepartmentTag,
  BookPageText,
  DocumentCategory,
  ExtractionStatus,
  LibraryBookMeta,
  ProcessingProgress
} from './types';

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function cleanDocumentTitle(rawTitle: string | undefined, fileName: string): string {
  if (rawTitle && rawTitle.trim().length > 2) {
    const trimmed = rawTitle.trim();
    if (!/^microsoft word|^untitled|^document\d*$/i.test(trimmed)) {
      return trimmed.slice(0, 140);
    }
  }
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePageText(items: Array<{ str?: string; hasEOL?: boolean }>): string {
  const parts: string[] = [];
  for (const item of items) {
    const text = item.str ?? '';
    if (text) {
      parts.push(text);
    }
    if (item.hasEOL) {
      parts.push('\n');
    } else if (text && !text.endsWith(' ')) {
      parts.push(' ');
    }
  }

  return parts
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export interface ExtractedPdfPackage {
  meta: LibraryBookMeta;
  fileBuffer: ArrayBuffer;
  pages: BookPageText[];
}

export async function processPdfFile(
  file: File,
  category: DocumentCategory,
  onProgress: (progress: ProcessingProgress) => void,
  department: BookDepartmentTag = 'all'
): Promise<ExtractedPdfPackage> {
  const isPdfExtension = /\.pdf$/i.test(file.name);
  const isPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';
  if (!isPdfExtension && !isPdfMime) {
    throw new Error('Unsupported file format. Please select a valid .pdf document.');
  }

  if (file.size === 0) {
    throw new Error('The selected PDF file is empty (0 bytes).');
  }

  onProgress({
    stage: 'reading',
    currentPage: 0,
    totalPages: 0,
    percent: 4,
    message: `Reading "${file.name}"...`
  });

  const fileBuffer = await file.arrayBuffer();

  // Pass a copy to PDF.js so worker transfer never detaches the ArrayBuffer saved to IndexedDB.
  const workerDataCopy = new Uint8Array(fileBuffer.slice(0));

  onProgress({
    stage: 'parsing',
    currentPage: 0,
    totalPages: 0,
    percent: 10,
    message: 'Parsing PDF structure and verifying pages...'
  });

  const loadingTask = pdfjsLib.getDocument({
    data: workerDataCopy,
    verbosity: pdfjsLib.VerbosityLevel.ERRORS
  });

  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

  try {
    pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    if (!totalPages || totalPages < 1) {
      throw new Error('This PDF contains zero readable pages.');
    }

    let metadataTitle: string | undefined;
    try {
      const metadata = await pdfDoc.getMetadata();
      const info = metadata?.info as { Title?: string } | undefined;
      metadataTitle = info?.Title;
    } catch {
      // ignore metadata read errors
    }

    const bookId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `book_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const pages: BookPageText[] = [];
    let searchablePagesCount = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      try {
        const textContent = await page.getTextContent();
        const extractedText = normalizePageText(
          textContent.items as Array<{ str?: string; hasEOL?: boolean }>
        );

        if (extractedText.replace(/\s+/g, '').length >= 12) {
          searchablePagesCount += 1;
        }

        pages.push({
          bookId,
          pageNumber: pageNum,
          text: extractedText
        });
      } finally {
        page.cleanup();
      }

      if (pageNum === 1 || pageNum === totalPages || pageNum % 5 === 0) {
        const pct = Math.min(92, 12 + Math.round((pageNum / totalPages) * 80));
        onProgress({
          stage: 'extracting',
          currentPage: pageNum,
          totalPages,
          percent: pct,
          message: `Indexing text: page ${pageNum} of ${totalPages}`
        });
        await yieldToMainThread();
      }
    }

    const hasSearchableText = searchablePagesCount > 0;
    const isScannedOrEmpty = !hasSearchableText;
    const extractionStatus: ExtractionStatus =
      searchablePagesCount === 0
        ? 'no-text'
        : searchablePagesCount < Math.max(1, Math.floor(totalPages * 0.25))
          ? 'partial'
          : 'ready';

    const meta: LibraryBookMeta = {
      id: bookId,
      title: cleanDocumentTitle(metadataTitle, file.name),
      fileName: file.name,
      fileSize: file.size,
      pageCount: totalPages,
      uploadedAt: Date.now(),
      lastOpenedAt: null,
      lastReadPage: 1,
      hasSearchableText,
      searchablePagesCount,
      isScannedOrEmpty,
      extractionStatus,
      category,
      department
    };

    onProgress({
      stage: 'saving',
      currentPage: totalPages,
      totalPages,
      percent: 96,
      message: 'Saving PDF and search index locally in IndexedDB...'
    });

    return {
      meta,
      fileBuffer,
      pages
    };
  } catch (err) {
    throw new Error(classifyPdfError(err));
  } finally {
    if (pdfDoc) {
      try {
        await pdfDoc.destroy();
      } catch {
        // ignore cleanup error
      }
    }
  }
}
