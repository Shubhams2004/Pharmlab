import { sanitizeHttpUrl } from '../../resource-hub/utils';
import { Discovered3DCandidate, formatBytes, ModelFormat } from '../types';
import { PROVIDER_3D_BY_ID } from './registry';
import { Asset3DProviderAdapter, ProviderSearchParams, ProviderSearchResult } from './types';
import { computeQueryRelevance, inferScientificCategoryAndDept, stripHtml } from './utils';

export async function searchSketchfabPublic(
  params: ProviderSearchParams
): Promise<ProviderSearchResult> {
  const { query, limit = 10, signal } = params;
  const clean = query.trim();
  const url = `https://api.sketchfab.com/v3/search?type=models&downloadable=true&q=${encodeURIComponent(
    clean
  )}&count=${Math.min(Math.max(limit, 1), 24)}`;

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
      embedUrl?: string;
      publishedAt?: string;
      likeCount?: number;
      vertexCount?: number;
      faceCount?: number;
      user?: { displayName?: string; profileUrl?: string };
      license?: { label?: string; fullName?: string; slug?: string };
      archives?: {
        glb?: { size?: number };
        gltf?: { size?: number };
        source?: { size?: number };
      };
      thumbnails?: { images?: Array<{ url?: string; width?: number }> };
      categories?: Array<{ name?: string }>;
      tags?: Array<{ name?: string }>;
    }) => {
      const images = Array.isArray(m.thumbnails?.images) ? m.thumbnails!.images! : [];
      const sortedImgs = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
      const pickedThumb =
        sortedImgs.find((img) => (img.width || 0) >= 380)?.url ||
        sortedImgs[sortedImgs.length - 1]?.url;

      const creator = m.user?.displayName || 'Sketchfab Creator';
      const license = m.license?.label || m.license?.fullName || 'Check Sketchfab License';
      const glbSize = m.archives?.glb?.size;
      const gltfSize = m.archives?.gltf?.size;
      const sourceSize = m.archives?.source?.size;
      const estimatedSize = glbSize || gltfSize || sourceSize;
      const pickedFormat: ModelFormat = glbSize ? 'glb' : gltfSize ? 'zip' : 'glb';

      const title = m.name || 'Untitled 3D Model';
      const descText =
        stripHtml(m.description)?.slice(0, 240) ||
        'Downloadable 3D model indexed in Sketchfab Public Catalog.';
      const tagNames = (m.tags || []).map((t) => t.name || '').filter(Boolean);
      const catNames = (m.categories || []).map((c) => c.name || '').filter(Boolean);
      const inferred = inferScientificCategoryAndDept(
        `${title} ${descText} ${tagNames.join(' ')} ${catNames.join(' ')}`
      );

      const embedCandidate = sanitizeHttpUrl(
        m.embedUrl || `https://sketchfab.com/models/${m.uid}/embed`
      );

      return {
        id: `skfb_${m.uid}`,
        providerId: 'sketchfab_public',
        providerName: 'Sketchfab Public 3D',
        title,
        description: descText,
        previewUrl: sanitizeHttpUrl(pickedThumb) || undefined,
        previewEmbedUrl: embedCandidate || undefined,
        creator,
        creatorUrl: sanitizeHttpUrl(m.user?.profileUrl) || undefined,
        sourceUrl:
          sanitizeHttpUrl(m.viewerUrl) || `https://sketchfab.com/3d-models/${m.uid}`,
        format: pickedFormat,
        byteSize: typeof estimatedSize === 'number' ? estimatedSize : undefined,
        license,
        attribution: `${creator} via Sketchfab (${license})`,
        usageRestrictions:
          'Sketchfab download API requires authenticated OAuth (HTTP 401 anonymously). Preview the live interactive embed here, then click "Open on Sketchfab" (free sign-in) to download .GLB or .ZIP and upload into PharmaLab.',
        downloadPolicy: 'portal_login_required',
        downloadNotice: `Interactive preview available · Download requires Sketchfab sign-in${
          estimatedSize ? ` (${pickedFormat.toUpperCase()} ~${formatBytes(estimatedSize)})` : ''
        }.`,
        suggestedCategory: inferred.category,
        suggestedDepartment: inferred.department,
        vertexCount: typeof m.vertexCount === 'number' ? m.vertexCount : undefined,
        faceCount: typeof m.faceCount === 'number' ? m.faceCount : undefined,
        popularityScore: typeof m.likeCount === 'number' ? m.likeCount : undefined,
        relevanceScore: computeQueryRelevance(clean, [
          { text: title, weight: 4 },
          { text: descText, weight: 1.5 },
          { text: tagNames.join(' '), weight: 2 }
        ]),
        publishedAt: m.publishedAt,
        tags: tagNames.slice(0, 5)
      };
    }
  );

  return { candidates };
}

export const sketchfabProvider: Asset3DProviderAdapter = {
  meta: PROVIDER_3D_BY_ID.sketchfab_public,
  search: searchSketchfabPublic
};
