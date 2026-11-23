import { sanitizeHttpUrl } from '../resource-hub/utils';
import {
  detectModelFormatFromName,
  Discovered3DCandidate,
  formatBytes,
  ModelFormat,
  Provider3DId
} from './types';

export interface Provider3DMeta {
  id: Provider3DId;
  name: string;
  shortName: string;
  websiteUrl: string;
  policySummary: string;
  supportsLiveApi: boolean;
}

export const PROVIDER_3D_REGISTRY: Provider3DMeta[] = [
  {
    id: 'wikimedia_3d',
    name: 'Wikimedia Commons 3D Archive',
    shortName: 'Wikimedia 3D',
    websiteUrl: 'https://commons.wikimedia.org',
    policySummary:
      'CORS-open MediaWiki API. Real .stl / .glb / .obj / .ply files <= 35 MB can be imported directly into PharmaLab.',
    supportsLiveApi: true
  },
  {
    id: 'sketchfab_public',
    name: 'Sketchfab Public Downloadable 3D Search',
    shortName: 'Sketchfab',
    websiteUrl: 'https://sketchfab.com',
    policySummary:
      'Public v3 metadata & thumbnail search. Downloading GLB/glTF binaries requires free user sign-in on Sketchfab.',
    supportsLiveApi: true
  },
  {
    id: 'smithsonian_3d',
    name: 'Smithsonian Open Access 3D (CC0)',
    shortName: 'Smithsonian 3D',
    websiteUrl: 'https://3d.si.edu',
    policySummary:
      'CORS-open Open Access API (DEMO_KEY rate-limited). Links directly to Smithsonian CC0 3D collection records.',
    supportsLiveApi: true
  },
  {
    id: 'nih_3d_portal',
    name: 'NIH 3D Biomedical & Molecular Exchange',
    shortName: 'NIH 3D',
    websiteUrl: 'https://3d.nih.gov',
    policySummary:
      'Portal search link only (no public unauthenticated REST search API). Download STL/GLB from 3d.nih.gov and upload locally.',
    supportsLiveApi: false
  }
];

function stripHtml(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_DIRECT_IMPORT_BYTES = 35 * 1024 * 1024; // 35 MB safety cap for browser IndexedDB

async function searchWikimedia3D(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const clean = query.trim();
  const gsrsearch = `(intitle:stl OR intitle:glb OR intitle:gltf OR intitle:obj OR intitle:ply) ${clean}`;
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(gsrsearch)}` +
    `&gsrnamespace=6&gsrlimit=14&prop=imageinfo` +
    `&iiprop=url|mime|extmetadata|size|mediatype&format=json&origin=*`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Wikimedia Commons returned HTTP ${res.status}.`);
  }
  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

  const candidates: Discovered3DCandidate[] = [];
  for (const page of pages as Array<{
    pageid?: number;
    title?: string;
    imageinfo?: Array<{
      url?: string;
      descriptionurl?: string;
      size?: number;
      mime?: string;
      extmetadata?: Record<string, { value?: string }>;
    }>;
  }>) {
    const info = page.imageinfo?.[0];
    if (!info?.url) continue;
    const fileUrl = sanitizeHttpUrl(info.url.split('?')[0]) || info.url;
    const format = detectModelFormatFromName(fileUrl) || detectModelFormatFromName(page.title || '');
    if (!format) continue;

    const ext = info.extmetadata || {};
    const title = stripHtml(ext.ObjectName?.value) || (page.title || '').replace(/^File:/, '');
    const description =
      stripHtml(ext.ImageDescription?.value) || 'Open-access 3D scientific model on Wikimedia Commons.';
    const creator = stripHtml(ext.Artist?.value) || 'Wikimedia Commons Contributor';
    const license = stripHtml(ext.LicenseShortName?.value) || 'Check source page';
    const byteSize = typeof info.size === 'number' ? info.size : undefined;
    const tooLarge = Boolean(byteSize && byteSize > MAX_DIRECT_IMPORT_BYTES);
    const isMultiFileGltf = format === 'gltf';

    const directImportOk = !tooLarge && !isMultiFileGltf;

    candidates.push({
      id: `wiki3d_${page.pageid || title}`,
      providerId: 'wikimedia_3d',
      providerName: 'Wikimedia Commons 3D',
      title,
      description: description.slice(0, 260),
      creator,
      sourceUrl: sanitizeHttpUrl(info.descriptionurl) || 'https://commons.wikimedia.org',
      directFileUrl: directImportOk ? info.url : undefined,
      format,
      byteSize,
      license,
      attribution: `${creator} via Wikimedia Commons (${license})`,
      usageRestrictions:
        'Verify specific attribution and ShareAlike terms on the Wikimedia Commons file page before redistribution.',
      downloadPolicy: directImportOk ? 'direct_cors' : 'portal_browse_only',
      downloadNotice: isMultiFileGltf
        ? 'Split .gltf files often reference external .bin/textures; download archive from source or prefer self-contained .glb/.stl.'
        : tooLarge
        ? `File size (${formatBytes(byteSize)}) exceeds the 35 MB browser direct-import limit. Open source to inspect or download locally.`
        : `Direct CORS import supported (${format.toUpperCase()} · ${formatBytes(byteSize)}).`,
      tags: ['Wikimedia Commons', format.toUpperCase()]
    });
  }

  return { candidates };
}

async function searchSketchfabPublic(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const url = `https://api.sketchfab.com/v3/search?type=models&downloadable=true&q=${encodeURIComponent(
    query.trim()
  )}&count=12`;

  const res = await fetch(url, { signal });
  if (res.status === 429) {
    return {
      candidates: [],
      warning: 'Sketchfab public search rate limit reached. Wait a moment and retry.'
    };
  }
  if (!res.ok) {
    throw new Error(`Sketchfab API returned HTTP ${res.status}.`);
  }

  const data = await res.json();
  const rows = Array.isArray(data?.results) ? data.results : [];

  const candidates: Discovered3DCandidate[] = rows.map(
    (m: {
      uid: string;
      name?: string;
      description?: string;
      viewerUrl?: string;
      vertexCount?: number;
      faceCount?: number;
      user?: { displayName?: string; profileUrl?: string };
      license?: { label?: string; fullName?: string };
      thumbnails?: { images?: Array<{ url?: string; width?: number }> };
      tags?: Array<{ name?: string }>;
    }) => {
      const images = Array.isArray(m.thumbnails?.images) ? m.thumbnails!.images! : [];
      const sortedImgs = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
      const pickedThumb =
        sortedImgs.find((img) => (img.width || 0) >= 380)?.url ||
        sortedImgs[sortedImgs.length - 1]?.url;

      const creator = m.user?.displayName || 'Sketchfab Creator';
      const license = m.license?.label || m.license?.fullName || 'Sketchfab Download License';

      return {
        id: `skfb_${m.uid}`,
        providerId: 'sketchfab_public',
        providerName: 'Sketchfab Public 3D',
        title: m.name || 'Untitled 3D Model',
        description:
          stripHtml(m.description)?.slice(0, 240) ||
          'Downloadable 3D model indexed on Sketchfab.',
        previewUrl: sanitizeHttpUrl(pickedThumb),
        creator,
        creatorUrl: sanitizeHttpUrl(m.user?.profileUrl),
        sourceUrl: sanitizeHttpUrl(m.viewerUrl) || `https://sketchfab.com/3d-models/${m.uid}`,
        format: 'glb' as ModelFormat,
        license,
        attribution: `${creator} via Sketchfab (${license})`,
        usageRestrictions:
          'Automated glTF/GLB downloads via Sketchfab API require user OAuth sign-in. Download manually on Sketchfab and upload the .glb file into PharmaLab.',
        downloadPolicy: 'portal_login_required',
        downloadNotice:
          'Requires free Sketchfab sign-in on sketchfab.com to download the .glb / .gltf file; then upload locally into PharmaLab.',
        vertexCount: typeof m.vertexCount === 'number' ? m.vertexCount : undefined,
        faceCount: typeof m.faceCount === 'number' ? m.faceCount : undefined,
        tags: (m.tags || [])
          .map((t) => t.name || '')
          .filter(Boolean)
          .slice(0, 5)
      };
    }
  );

  return { candidates };
}

async function searchSmithsonian3D(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(
    query.trim()
  )}&fq=${encodeURIComponent('online_media_type:"3D models"')}&rows=10&api_key=DEMO_KEY`;

  const res = await fetch(url, { signal });
  if (res.status === 429) {
    return {
      candidates: [],
      warning:
        'Smithsonian Open Access DEMO_KEY rate limit temporarily reached. Try again later or browse 3d.si.edu directly.'
    };
  }
  if (!res.ok) {
    throw new Error(`Smithsonian Open Access API returned HTTP ${res.status}.`);
  }

  const data = await res.json();
  const rows = Array.isArray(data?.response?.rows) ? data.response.rows : [];

  const candidates: Discovered3DCandidate[] = rows.map(
    (row: {
      id: string;
      title?: string;
      unitCode?: string;
      content?: {
        descriptiveNonRepeating?: {
          data_source?: string;
          record_link?: string;
          online_media?: {
            media?: Array<{
              type?: string;
              thumbnail?: string;
              content?: string;
              usage?: { access?: string };
              resources?: Array<{ label?: string; url?: string }>;
            }>;
          };
        };
      };
    }) => {
      const desc = row.content?.descriptiveNonRepeating || {};
      const mediaList = desc.online_media?.media || [];
      const firstThumb = mediaList.find((m) => m.thumbnail)?.thumbnail;

      let glbUrl: string | undefined;
      for (const m of mediaList) {
        const resHit = (m.resources || []).find((r) =>
          /\.(glb|gltf|stl|obj)(\?|$)/i.test(r.url || '')
        );
        if (resHit?.url) {
          glbUrl = sanitizeHttpUrl(resHit.url);
          break;
        }
      }

      const sourceName = desc.data_source || `Smithsonian (${row.unitCode || 'SI'})`;
      const recordUrl =
        sanitizeHttpUrl(desc.record_link) ||
        `https://3d.si.edu/search?query=${encodeURIComponent(row.title || query)}`;
      const format = glbUrl ? detectModelFormatFromName(glbUrl) || 'glb' : undefined;

      return {
        id: `si3d_${row.id}`,
        providerId: 'smithsonian_3d',
        providerName: 'Smithsonian Open Access 3D',
        title: row.title || 'Smithsonian 3D Specimen',
        description: `Digitized specimen from ${sourceName}.`,
        previewUrl: sanitizeHttpUrl(firstThumb),
        creator: sourceName,
        sourceUrl: recordUrl,
        directFileUrl: glbUrl,
        format,
        license: 'CC0 1.0 Public Domain Dedication',
        attribution: `${sourceName} · Smithsonian Open Access (CC0)`,
        usageRestrictions:
          'Smithsonian CC0 items allow educational use without restriction; open the Smithsonian 3D Voyager page to download GLB/OBJ packages if not directly linked.',
        downloadPolicy: glbUrl ? 'direct_cors' : 'portal_browse_only',
        downloadNotice: glbUrl
          ? 'Direct GLB/3D resource URL returned by Smithsonian metadata.'
          : 'Open Smithsonian 3D record to download the GLB/OBJ bundle from 3d.si.edu, then import locally into PharmaLab.',
        tags: ['Smithsonian CC0', row.unitCode || 'Collection'].filter(Boolean)
      };
    }
  );

  return { candidates };
}

export async function discoverScientific3DAssets(
  query: string,
  providerFilter: 'all' | Provider3DId = 'all',
  signal?: AbortSignal
): Promise<{
  candidates: Discovered3DCandidate[];
  warnings: string[];
}> {
  const clean = query.trim();
  if (clean.length < 2) {
    return { candidates: [], warnings: [] };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      candidates: [],
      warnings: [
        'Offline mode detected. Connect to the internet to query Wikimedia Commons, Sketchfab, and Smithsonian 3D repositories.'
      ]
    };
  }

  const warnings: string[] = [];
  const tasks: Array<Promise<{ candidates: Discovered3DCandidate[]; warning?: string }>> = [];

  if (providerFilter === 'all' || providerFilter === 'wikimedia_3d') {
    tasks.push(
      searchWikimedia3D(clean, signal).catch((err) => ({
        candidates: [],
        warning: `Wikimedia 3D: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }
  if (providerFilter === 'all' || providerFilter === 'sketchfab_public') {
    tasks.push(
      searchSketchfabPublic(clean, signal).catch((err) => ({
        candidates: [],
        warning: `Sketchfab: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }
  if (providerFilter === 'all' || providerFilter === 'smithsonian_3d') {
    tasks.push(
      searchSmithsonian3D(clean, signal).catch((err) => ({
        candidates: [],
        warning: `Smithsonian 3D: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }

  const settled = await Promise.all(tasks);
  const combined: Discovered3DCandidate[] = [];
  for (const res of settled) {
    if (res.warning) warnings.push(res.warning);
    combined.push(...res.candidates);
  }

  // Sort direct-CORS-importable candidates first so students immediately see zero-friction assets
  combined.sort((a, b) => {
    const score = (c: Discovered3DCandidate) =>
      c.downloadPolicy === 'direct_cors' ? 2 : c.downloadPolicy === 'portal_login_required' ? 1 : 0;
    return score(b) - score(a);
  });

  return { candidates: combined, warnings };
}

export async function fetchRemote3DBinary(
  url: string,
  fallbackFileName = 'model.glb'
): Promise<{
  buffer: ArrayBuffer;
  format: ModelFormat;
  fileName: string;
  byteSize: number;
  mimeType: string;
}> {
  const safe = sanitizeHttpUrl(url);
  if (!safe) {
    throw new Error('Invalid or unsupported URL protocol. Use an https:// 3D asset link.');
  }

  const res = await fetch(safe);
  if (!res.ok) {
    throw new Error(`Remote server responded with HTTP ${res.status}. Download manually and upload locally.`);
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    throw new Error(
      'This URL returned an HTML webpage instead of a raw 3D file (.glb/.stl/.obj/.ply). Download the 3D file locally first, then upload it.'
    );
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Downloaded file was empty (0 bytes).');
  }
  if (buffer.byteLength > 45 * 1024 * 1024) {
    throw new Error(
      `File is ${formatBytes(buffer.byteLength)}, exceeding the 45 MB browser storage limit.`
    );
  }

  const urlPathName = safe.split('?')[0].split('/').pop() || fallbackFileName;
  const decodedName = decodeURIComponent(urlPathName);
  const detected =
    detectModelFormatFromName(decodedName) || detectModelFormatFromName(fallbackFileName);

  if (!detected) {
    throw new Error(
      'Unable to confirm a supported 3D format (.glb, .gltf, .stl, .obj, .ply) from this URL.'
    );
  }

  return {
    buffer,
    format: detected,
    fileName: decodedName,
    byteSize: buffer.byteLength,
    mimeType: contentType || 'application/octet-stream'
  };
}
