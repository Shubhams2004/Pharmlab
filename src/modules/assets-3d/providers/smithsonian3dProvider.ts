import { sanitizeHttpUrl } from '../../resource-hub/utils';
import { detectModelFormatFromName, Discovered3DCandidate, formatBytes } from '../types';
import { PROVIDER_3D_BY_ID } from './registry';
import { Asset3DProviderAdapter, ProviderSearchParams, ProviderSearchResult } from './types';
import {
  computeQueryRelevance,
  inferScientificCategoryAndDept,
  MAX_DIRECT_IMPORT_BYTES
} from './utils';

export async function resolveSmithsonianSvxGlb(
  svxUrl: string,
  signal?: AbortSignal
): Promise<{ glbUrl: string; byteSize?: number } | undefined> {
  try {
    const res = await fetch(svxUrl, { signal });
    if (!res.ok) return undefined;
    const svx = await res.json();
    const derivatives: Array<{
      usage?: string;
      quality?: string;
      assets?: Array<{ uri?: string; type?: string }>;
    }> = svx?.models?.[0]?.derivatives || [];

    const preferredQualities = ['Medium', 'Low', 'Thumb', 'High'];
    let pickedUrl: string | undefined;
    for (const q of preferredQualities) {
      const deriv = derivatives.find((d) => d.quality === q || d.usage === 'Web3D');
      const asset = deriv?.assets?.find((a) => /\.glb(\?|$)/i.test(a.uri || ''));
      if (asset?.uri) {
        pickedUrl = new URL(asset.uri, svxUrl).toString();
        break;
      }
    }
    if (!pickedUrl) {
      for (const deriv of derivatives) {
        const asset = deriv.assets?.find((a) => /\.glb(\?|$)/i.test(a.uri || ''));
        if (asset?.uri) {
          pickedUrl = new URL(asset.uri, svxUrl).toString();
          break;
        }
      }
    }
    if (!pickedUrl) return undefined;

    let byteSize: number | undefined;
    try {
      const head = await fetch(pickedUrl, { method: 'HEAD', signal });
      const cl = head.headers.get('content-length');
      if (head.ok && cl && /^\d+$/.test(cl)) {
        byteSize = Number(cl);
      }
    } catch {
      // Ignore HEAD failures; download stream still enforces max size
    }
    return { glbUrl: pickedUrl, byteSize };
  } catch {
    return undefined;
  }
}

export async function searchSmithsonian3D(
  params: ProviderSearchParams
): Promise<ProviderSearchResult> {
  const { query, limit = 10, signal } = params;
  const clean = query.trim();
  const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(
    clean
  )}&fq=${encodeURIComponent('online_media_type:"3D models"')}&rows=12&api_key=DEMO_KEY`;

  const res = await fetch(url, { signal });
  if (res.status === 429) {
    return {
      candidates: [],
      warning:
        'Smithsonian Open Access DEMO_KEY rate limit temporarily reached. Other 3D repositories remain active, or paste a 3d.si.edu package/SVX URL into Upload -> Fetch URL.'
    };
  }
  if (!res.ok) {
    throw new Error(`Smithsonian Open Access API returned HTTP ${res.status}.`);
  }

  const data = await res.json();
  const rows = Array.isArray(data?.response?.rows) ? data.response.rows : [];

  const candidates = await Promise.all(
    rows.slice(0, limit).map(
      async (row: {
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
                idsId?: string;
                resources?: Array<{ label?: string; url?: string }>;
              }>;
            };
          };
          freetext?: {
            notes?: Array<{ label?: string; content?: string }>;
          };
        };
      }) => {
        const desc = row.content?.descriptiveNonRepeating || {};
        const mediaList = desc.online_media?.media || [];
        const firstThumb = mediaList.find((m) => m.thumbnail)?.thumbnail;

        let glbUrl: string | undefined;
        let byteSize: number | undefined;
        for (const m of mediaList) {
          const resHit = (m.resources || []).find((r) =>
            /\.(glb|gltf|stl|obj)(\?|$)/i.test(r.url || '')
          );
          if (resHit?.url) {
            glbUrl = sanitizeHttpUrl(resHit.url) || undefined;
            break;
          }
          const contentStr = m.content || '';
          if (contentStr.includes('3d_package:')) {
            const pkgMatch = contentStr.match(/3d_package:[a-zA-Z0-9-]+/);
            if (pkgMatch) {
              const resolved = await resolveSmithsonianSvxGlb(
                `https://3d-api.si.edu/content/document/${pkgMatch[0]}/scene.svx.json`,
                signal
              );
              if (resolved) {
                glbUrl = resolved.glbUrl;
                byteSize = resolved.byteSize;
                break;
              }
            }
          }
        }

        const sourceName = desc.data_source || `Smithsonian (${row.unitCode || 'SI'})`;
        const recordUrl =
          sanitizeHttpUrl(desc.record_link) ||
          `https://3d.si.edu/search?query=${encodeURIComponent(row.title || clean)}`;
        const format = glbUrl ? detectModelFormatFromName(glbUrl) || 'glb' : undefined;
        const tooLarge = Boolean(byteSize && byteSize > MAX_DIRECT_IMPORT_BYTES);
        const directOk = Boolean(glbUrl && !tooLarge);
        const notes = (row.content?.freetext?.notes || [])
          .map((n) => n.content)
          .filter(Boolean)
          .slice(0, 2)
          .join(' ');
        const title = row.title || 'Smithsonian 3D Specimen';
        const description = notes
          ? `${notes.slice(0, 200)} · Digitized CC0 specimen from ${sourceName}.`
          : `Digitized CC0 museum/scientific specimen from ${sourceName}.`;
        const inferred = inferScientificCategoryAndDept(`${title} ${description}`, 'other', 'research');

        return {
          id: `si3d_${row.id}`,
          providerId: 'smithsonian_3d' as const,
          providerName: 'Smithsonian Open Access 3D',
          title,
          description,
          previewUrl: sanitizeHttpUrl(firstThumb) || undefined,
          creator: sourceName,
          sourceUrl: recordUrl,
          directFileUrl: directOk ? glbUrl : undefined,
          format,
          byteSize,
          license: 'CC0 1.0 Public Domain Dedication',
          attribution: `${sourceName} · Smithsonian Open Access (CC0)`,
          usageRestrictions:
            'Smithsonian CC0 items allow unrestricted educational and scientific reuse.',
          downloadPolicy: directOk ? ('direct_cors' as const) : ('portal_browse_only' as const),
          downloadNotice: tooLarge
            ? `GLB size (${formatBytes(byteSize)}) exceeds the ${formatBytes(
                MAX_DIRECT_IMPORT_BYTES
              )} browser limit. Download manually from Smithsonian.`
            : directOk
            ? `1-click direct GLB import via Smithsonian Voyager CDN${
                byteSize ? ` (${formatBytes(byteSize)})` : ''
              }.`
            : 'This Smithsonian record does not expose an automated GLB asset URL in search metadata; inspect on Smithsonian 3D and upload downloaded GLB/ZIP here.',
          suggestedCategory: inferred.category,
          suggestedDepartment: inferred.department,
          relevanceScore: computeQueryRelevance(clean, [
            { text: title, weight: 4 },
            { text: description, weight: 1.5 }
          ]),
          tags: ['Smithsonian CC0', row.unitCode || 'Collection'].filter(Boolean)
        } satisfies Discovered3DCandidate;
      }
    )
  );

  return { candidates };
}

export const smithsonian3dProvider: Asset3DProviderAdapter = {
  meta: PROVIDER_3D_BY_ID.smithsonian_3d,
  search: searchSmithsonian3D
};
