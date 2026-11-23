import { sanitizeHttpUrl } from '../../resource-hub/utils';
import { detectModelFormatFromName, Discovered3DCandidate, formatBytes } from '../types';
import { PROVIDER_3D_BY_ID } from './registry';
import { Asset3DProviderAdapter, ProviderSearchParams, ProviderSearchResult } from './types';
import {
  computeQueryRelevance,
  inferScientificCategoryAndDept,
  MAX_DIRECT_IMPORT_BYTES,
  stripHtml
} from './utils';

async function queryWikimedia3D(
  gsrsearch: string,
  originalQuery: string,
  signal?: AbortSignal
): Promise<Discovered3DCandidate[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(gsrsearch)}` +
    `&gsrnamespace=6&gsrlimit=12&prop=imageinfo` +
    `&iiprop=url|mime|extmetadata|size|mediatype&iiurlwidth=360&format=json&origin=*`;

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
      thumburl?: string;
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
    const title =
      stripHtml(ext.ObjectName?.value) ||
      (page.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
    const description =
      stripHtml(ext.ImageDescription?.value) ||
      'Open-access 3D scientific model indexed on Wikimedia Commons.';
    const creator = stripHtml(ext.Artist?.value) || 'Wikimedia Commons Contributor';
    const license = stripHtml(ext.LicenseShortName?.value) || 'Check Wikimedia license page';
    const credit = stripHtml(ext.Credit?.value);
    const byteSize = typeof info.size === 'number' ? info.size : undefined;
    const tooLarge = Boolean(byteSize && byteSize > MAX_DIRECT_IMPORT_BYTES);
    const isMultiFileGltf = format === 'gltf';
    const directImportOk = !tooLarge && !isMultiFileGltf;

    const inferred = inferScientificCategoryAndDept(`${title} ${description} ${page.title || ''}`);
    const attribution = credit
      ? `${creator} · ${credit} (${license})`
      : `${creator} via Wikimedia Commons (${license})`;

    candidates.push({
      id: `wiki3d_${page.pageid || title}`,
      providerId: 'wikimedia_3d',
      providerName: 'Wikimedia Commons 3D',
      title,
      description: description.slice(0, 260),
      previewUrl: sanitizeHttpUrl(info.thumburl) || undefined,
      creator,
      sourceUrl: sanitizeHttpUrl(info.descriptionurl) || 'https://commons.wikimedia.org',
      directFileUrl: directImportOk ? info.url : undefined,
      format,
      byteSize,
      license,
      attribution,
      usageRestrictions:
        'Verify attribution and ShareAlike requirements on the Wikimedia Commons file page before redistribution.',
      downloadPolicy: directImportOk ? 'direct_cors' : 'portal_browse_only',
      downloadNotice: isMultiFileGltf
        ? 'Split .gltf files often reference external .bin/textures; download archive from Wikimedia and upload locally.'
        : tooLarge
        ? `File size (${formatBytes(byteSize)}) exceeds the ${formatBytes(
            MAX_DIRECT_IMPORT_BYTES
          )} browser IndexedDB import limit. Open source to download locally.`
        : `Direct CORS import supported (${format.toUpperCase()} · ${formatBytes(byteSize)}).`,
      suggestedCategory: inferred.category,
      suggestedDepartment: inferred.department,
      relevanceScore: computeQueryRelevance(originalQuery, [
        { text: title, weight: 4 },
        { text: description, weight: 1.5 },
        { text: page.title, weight: 2 }
      ]),
      tags: ['Wikimedia Commons', format.toUpperCase()]
    });
  }
  return candidates;
}

export async function searchWikimedia3D(
  params: ProviderSearchParams
): Promise<ProviderSearchResult> {
  const { query, limit = 12, signal } = params;
  const clean = query.trim();

  // Combine CirrusSearch filetype:3d and intitle:.stl queries for highest coverage
  const [ft3d, stlHits] = await Promise.all([
    queryWikimedia3D(`filetype:3d ${clean}`, clean, signal).catch(() => []),
    queryWikimedia3D(`intitle:.stl ${clean}`, clean, signal)
  ]);

  const seen = new Set<string>();
  const combined: Discovered3DCandidate[] = [];
  for (const item of [...stlHits, ...ft3d]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      combined.push(item);
    }
  }

  combined.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  return { candidates: combined.slice(0, limit) };
}

export const wikimedia3dProvider: Asset3DProviderAdapter = {
  meta: PROVIDER_3D_BY_ID.wikimedia_3d,
  search: searchWikimedia3D
};
