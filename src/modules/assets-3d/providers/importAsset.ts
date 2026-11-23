import { sanitizeHttpUrl } from '../../resource-hub/utils';
import {
  detectModelFormatFromName,
  formatBytes,
  ModelFormat
} from '../types';
import { resolveSmithsonianSvxGlb } from './smithsonian3dProvider';
import {
  isSupportedModelFormat,
  LARGE_ASSET_WARNING_BYTES,
  MAX_DIRECT_IMPORT_BYTES,
  sniffFormatFromBytes
} from './utils';

export interface Resolved3DUrl {
  fetchUrl: string;
  hintFileName?: string;
  hintFormat?: ModelFormat;
}

export async function resolveWebsiteUrlToDirect3D(
  inputUrl: string,
  signal?: AbortSignal
): Promise<Resolved3DUrl> {
  const urlObj = new URL(inputUrl);
  const host = urlObj.hostname.toLowerCase();

  // 1. Sketchfab webpage cannot be downloaded cross-origin without user OAuth
  if (host.includes('sketchfab.com')) {
    throw new Error(
      'Sketchfab requires downloading while signed in. Open the Sketchfab model page, click Download (.GLB or .ZIP archive), then drop that downloaded file into "Upload Local File".'
    );
  }

  // 2. NIH 3D webpage -> no public unauthenticated download API
  if (host === '3d.nih.gov') {
    throw new Error(
      'NIH 3D model pages bundle files behind dynamic downloads. Download the .STL / .GLB / .ZIP from 3d.nih.gov and upload it locally via "Upload Local File".'
    );
  }

  // 3. Wikimedia Commons File: page -> resolve real upload.wikimedia.org binary
  if (host.includes('commons.wikimedia.org') && urlObj.pathname.includes('/wiki/File:')) {
    const fileTitle = decodeURIComponent(urlObj.pathname.split('/wiki/')[1]);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      fileTitle
    )}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
    const res = await fetch(apiUrl, { signal });
    if (!res.ok) throw new Error('Unable to resolve Wikimedia Commons File URL.');
    const json = await res.json();
    const page = Object.values(json?.query?.pages || {})[0] as {
      imageinfo?: Array<{ url?: string }>;
    };
    const rawUrl = page?.imageinfo?.[0]?.url;
    if (!rawUrl) {
      throw new Error('Could not locate raw 3D file URL on this Wikimedia Commons page.');
    }
    return { fetchUrl: rawUrl, hintFileName: fileTitle.replace(/^File:/i, '') };
  }

  // 4. GitHub /blob/ URL -> raw.githubusercontent.com
  if (host === 'github.com' && urlObj.pathname.includes('/blob/')) {
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const blobIdx = parts.indexOf('blob');
    if (blobIdx >= 2 && parts.length > blobIdx + 2) {
      const owner = parts[0];
      const repo = parts[1];
      const rest = parts.slice(blobIdx + 1).join('/');
      return {
        fetchUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`
      };
    }
  }

  // 5. PubChem compound webpage -> direct 3D SDF conformer (do not rewrite /rest/pug/ API URLs)
  if (
    host.includes('pubchem.ncbi.nlm.nih.gov') &&
    urlObj.pathname.startsWith('/compound/')
  ) {
    const slug = decodeURIComponent(urlObj.pathname.slice('/compound/'.length).split('/')[0]);
    if (slug) {
      const isCid = /^\d+$/.test(slug);
      const endpoint = isCid ? `cid/${slug}` : `name/${encodeURIComponent(slug)}`;
      return {
        fetchUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${endpoint}/SDF?record_type=3d`,
        hintFileName: `${slug}.sdf`,
        hintFormat: 'sdf'
      };
    }
  }

  // 6. RCSB PDB structure webpage -> direct .pdb download
  if (host.includes('rcsb.org') && urlObj.pathname.includes('/structure/')) {
    const pdbId = urlObj.pathname.split('/structure/')[1].split('/')[0].trim().toUpperCase();
    if (/^[A-Z0-9]{4}$/.test(pdbId)) {
      return {
        fetchUrl: `https://files.rcsb.org/download/${pdbId}.pdb`,
        hintFileName: `${pdbId}.pdb`,
        hintFormat: 'pdb'
      };
    }
  }

  // 7. Smithsonian 3D object URL or .svx.json -> resolve GLB derivative via 3d-api.si.edu
  if (host.includes('3d.si.edu') || inputUrl.endsWith('.svx.json')) {
    const pkgMatch = inputUrl.match(/3d_package:[a-zA-Z0-9-]+/);
    const svxUrl = inputUrl.endsWith('.svx.json')
      ? inputUrl
      : pkgMatch
      ? `https://3d-api.si.edu/content/document/${pkgMatch[0]}/scene.svx.json`
      : null;
    if (svxUrl) {
      const resolved = await resolveSmithsonianSvxGlb(svxUrl, signal);
      if (resolved?.glbUrl) {
        return { fetchUrl: resolved.glbUrl, hintFormat: 'glb' };
      }
    }
  }

  return { fetchUrl: inputUrl };
}

export interface Remote3DPreflightResult {
  reachable: boolean;
  resolvedUrl: string;
  byteSize?: number;
  contentType?: string;
  format?: ModelFormat;
  tooLarge: boolean;
  largeWarning: boolean;
  note: string;
}

/**
 * Safely checks remote 3D URL availability, format & Content-Length where supported.
 * Note: Servers such as RCSB PDB return HTTP 403 on HEAD while permitting CORS GET;
 * those are treated gracefully as "verify on download" rather than false failures.
 */
export async function preflightRemote3DAsset(
  url: string,
  knownByteSize?: number,
  knownFormat?: ModelFormat,
  signal?: AbortSignal
): Promise<Remote3DPreflightResult> {
  const safe = sanitizeHttpUrl(url);
  if (!safe) {
    return {
      reachable: false,
      resolvedUrl: url,
      tooLarge: false,
      largeWarning: false,
      note: 'Invalid URL protocol. Only http/https URLs are permitted.'
    };
  }

  let resolvedUrl = safe;
  let hintFmt = knownFormat;
  try {
    const resolved = await resolveWebsiteUrlToDirect3D(safe, signal);
    resolvedUrl = resolved.fetchUrl;
    hintFmt = resolved.hintFormat || detectModelFormatFromName(resolvedUrl) || knownFormat;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    return {
      reachable: false,
      resolvedUrl: safe,
      format: knownFormat,
      tooLarge: false,
      largeWarning: false,
      note: err instanceof Error ? err.message : 'Unable to resolve 3D file URL.'
    };
  }

  if (hintFmt && !isSupportedModelFormat(hintFmt)) {
    return {
      reachable: false,
      resolvedUrl,
      format: hintFmt,
      tooLarge: false,
      largeWarning: false,
      note: `Unsupported format ".${hintFmt}". Supported formats: GLB, glTF, ZIP, STL, OBJ, PLY, PDB, SDF, MOL.`
    };
  }

  let byteSize = knownByteSize;
  let contentType: string | undefined;

  try {
    const head = await fetch(resolvedUrl, { method: 'HEAD', signal });
    if (head.ok) {
      const cl = head.headers.get('content-length');
      if (cl && /^\d+$/.test(cl)) byteSize = Number(cl);
      contentType = (head.headers.get('content-type') || '').toLowerCase() || undefined;
      if (contentType && contentType.includes('text/html')) {
        return {
          reachable: false,
          resolvedUrl,
          byteSize,
          contentType,
          format: hintFmt,
          tooLarge: false,
          largeWarning: false,
          note: 'Target URL resolved to an HTML webpage instead of a 3D binary asset.'
        };
      }
    } else if (head.status === 404 || head.status === 410) {
      return {
        reachable: false,
        resolvedUrl,
        byteSize,
        format: hintFmt,
        tooLarge: false,
        largeWarning: false,
        note: `Remote 3D record unavailable (HTTP ${head.status}). For PubChem compounds, this compound may not have a 3D conformer.`
      };
    }
    // Note: HTTP 403 / 405 on HEAD is ignored (e.g. RCSB PDB permits GET but returns 403 for HEAD)
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    // Ignore CORS preflight errors on HEAD; full GET handles real error reporting
  }

  const tooLarge = Boolean(byteSize && byteSize > MAX_DIRECT_IMPORT_BYTES);
  const largeWarning = Boolean(byteSize && byteSize > LARGE_ASSET_WARNING_BYTES && !tooLarge);

  return {
    reachable: !tooLarge,
    resolvedUrl,
    byteSize,
    contentType,
    format: hintFmt,
    tooLarge,
    largeWarning,
    note: tooLarge
      ? `File size (${formatBytes(byteSize)}) exceeds the ${formatBytes(
          MAX_DIRECT_IMPORT_BYTES
        )} IndexedDB browser safety limit.`
      : largeWarning
      ? `Verified ${formatBytes(byteSize)} · Large 3D mesh (may take several seconds on mobile).`
      : byteSize
      ? `Verified ${formatBytes(byteSize)} · Ready for preview & offline IndexedDB import.`
      : 'Format compatible · Ready for preview & offline IndexedDB import (size verified during download).'
  };
}

export interface FetchRemote3DOptions {
  url: string;
  fallbackFileName?: string;
  expectedFormat?: ModelFormat;
  signal?: AbortSignal;
  onProgress?: (info: { loadedBytes: number; totalBytes?: number; percent?: number }) => void;
}

export interface Fetched3DBinary {
  buffer: ArrayBuffer;
  format: ModelFormat;
  fileName: string;
  byteSize: number;
  mimeType: string;
}

export async function fetchRemote3DBinary(
  urlOrOpts: string | FetchRemote3DOptions,
  legacyFallback = 'model.glb',
  legacyFormat?: ModelFormat
): Promise<Fetched3DBinary> {
  const opts: FetchRemote3DOptions =
    typeof urlOrOpts === 'string'
      ? { url: urlOrOpts, fallbackFileName: legacyFallback, expectedFormat: legacyFormat }
      : urlOrOpts;

  const {
    url,
    fallbackFileName = 'model.glb',
    expectedFormat,
    signal,
    onProgress
  } = opts;

  const safe = sanitizeHttpUrl(url);
  if (!safe) {
    throw new Error('Invalid or unsupported URL protocol. Enter a valid https:// URL.');
  }

  const resolved = await resolveWebsiteUrlToDirect3D(safe, signal);

  let res: Response;
  try {
    res = await fetch(resolved.fetchUrl, { signal });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new Error(
      'Cross-origin download blocked (CORS) or server unreachable. Download the .GLB/.STL/.ZIP file from the source page and upload it locally.'
    );
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Remote 3D asset was not found (HTTP 404). Some compounds or entries do not provide a 3D file.'
      );
    }
    throw new Error(
      `Remote server responded with HTTP ${res.status}. Download the file manually and upload it locally.`
    );
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    throw new Error(
      'This webpage returned HTML instead of a 3D model file. Open the page, download the .GLB / .STL / .ZIP bundle, and upload it locally.'
    );
  }

  const clHeader = res.headers.get('content-length');
  const declaredTotal = clHeader && /^\d+$/.test(clHeader) ? Number(clHeader) : undefined;
  if (declaredTotal && declaredTotal > MAX_DIRECT_IMPORT_BYTES) {
    throw new Error(
      `File is ${formatBytes(declaredTotal)}, exceeding the ${formatBytes(
        MAX_DIRECT_IMPORT_BYTES
      )} browser IndexedDB limit.`
    );
  }

  let buffer: ArrayBuffer;
  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;

    try {
      while (true) {
        if (signal?.aborted) {
          await reader.cancel();
          throw new DOMException('Import aborted by user', 'AbortError');
        }
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.byteLength > 0) {
          loadedBytes += value.byteLength;
          if (loadedBytes > MAX_DIRECT_IMPORT_BYTES) {
            await reader.cancel();
            throw new Error(
              `Download stopped: asset exceeds the ${formatBytes(
                MAX_DIRECT_IMPORT_BYTES
              )} browser IndexedDB safety limit.`
            );
          }
          chunks.push(value);
          onProgress?.({
            loadedBytes,
            totalBytes: declaredTotal,
            percent: declaredTotal
              ? Math.min(99, Math.round((loadedBytes / declaredTotal) * 100))
              : undefined
          });
        }
      }
    } finally {
      reader.releaseLock();
    }

    const merged = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    buffer = merged.buffer;
  } else {
    buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_DIRECT_IMPORT_BYTES) {
      throw new Error(
        `File is ${formatBytes(buffer.byteLength)}, exceeding the ${formatBytes(
          MAX_DIRECT_IMPORT_BYTES
        )} browser IndexedDB limit.`
      );
    }
    onProgress?.({
      loadedBytes: buffer.byteLength,
      totalBytes: buffer.byteLength,
      percent: 100
    });
  }

  if (buffer.byteLength === 0) {
    throw new Error('Downloaded 3D file was empty (0 bytes).');
  }

  const disp = res.headers.get('content-disposition') || '';
  const dispMatch = disp.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
  const rawName =
    dispMatch?.[1]?.trim() ||
    resolved.hintFileName ||
    resolved.fetchUrl.split('?')[0].split('/').pop() ||
    fallbackFileName;

  let decodedName = rawName;
  try {
    decodedName = decodeURIComponent(rawName);
  } catch {
    decodedName = rawName;
  }

  const sniffed = sniffFormatFromBytes(buffer);
  const detected =
    sniffed ||
    detectModelFormatFromName(decodedName) ||
    resolved.hintFormat ||
    expectedFormat ||
    detectModelFormatFromName(fallbackFileName);

  if (!detected || !isSupportedModelFormat(detected)) {
    throw new Error(
      'Unable to confirm a supported 3D format (.glb, .gltf, .stl, .obj, .ply, .zip, .pdb, .sdf, .mol) from this URL.'
    );
  }

  const finalName = detectModelFormatFromName(decodedName)
    ? decodedName
    : `${decodedName.replace(/\.[^.]+$/, '') || 'model'}.${detected}`;

  return {
    buffer,
    format: detected,
    fileName: finalName,
    byteSize: buffer.byteLength,
    mimeType: contentType || 'application/octet-stream'
  };
}
