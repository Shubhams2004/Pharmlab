import {
  Asset3DAvailabilityFilter,
  Asset3DCategory,
  Asset3DDiscoverySort,
  Discovered3DCandidate,
  Provider3DId
} from '../types';
import { humanAtlasProvider } from './humanAtlasProvider';
import { pubchem3dProvider } from './pubchem3dProvider';
import { rcsbPdbProvider } from './rcsbPdbProvider';
import { sketchfabProvider } from './sketchfabProvider';
import { smithsonian3dProvider } from './smithsonian3dProvider';
import { Asset3DProviderAdapter } from './types';
import { wikimedia3dProvider } from './wikimedia3dProvider';

const LIVE_PROVIDERS: Asset3DProviderAdapter[] = [
  humanAtlasProvider,
  pubchem3dProvider,
  rcsbPdbProvider,
  wikimedia3dProvider,
  smithsonian3dProvider,
  sketchfabProvider
];

export interface Discover3DOptions {
  query: string;
  providerFilter?: 'all' | Provider3DId;
  categoryFilter?: 'all' | Asset3DCategory;
  availabilityFilter?: Asset3DAvailabilityFilter;
  sortBy?: Asset3DDiscoverySort;
  signal?: AbortSignal;
}

export interface Discover3DResponse {
  candidates: Discovered3DCandidate[];
  warnings: string[];
  rawCount: number;
}

function policyRank(c: Discovered3DCandidate): number {
  if (c.downloadPolicy === 'direct_cors' && c.directFileUrl) return 2;
  if (c.downloadPolicy === 'portal_login_required') return 1;
  return 0;
}

export function sortAndFilterDiscovered3D(
  items: Discovered3DCandidate[],
  opts: {
    categoryFilter?: 'all' | Asset3DCategory;
    availabilityFilter?: Asset3DAvailabilityFilter;
    sortBy?: Asset3DDiscoverySort;
  }
): Discovered3DCandidate[] {
  const { categoryFilter = 'all', availabilityFilter = 'all', sortBy = 'recommended' } = opts;

  const filtered = items.filter((item) => {
    if (categoryFilter !== 'all' && item.suggestedCategory !== categoryFilter) {
      return false;
    }
    if (availabilityFilter === 'direct_cors') {
      return item.downloadPolicy === 'direct_cors' && Boolean(item.directFileUrl);
    }
    if (availabilityFilter === 'portal') {
      return item.downloadPolicy !== 'direct_cors' || !item.directFileUrl;
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'size_asc') {
      const sa = a.byteSize ?? Number.MAX_SAFE_INTEGER;
      const sb = b.byteSize ?? Number.MAX_SAFE_INTEGER;
      if (sa !== sb) return sa - sb;
      return policyRank(b) - policyRank(a);
    }
    if (sortBy === 'poly_desc') {
      const pa = a.faceCount ?? a.vertexCount ?? -1;
      const pb = b.faceCount ?? b.vertexCount ?? -1;
      if (pa !== pb) return pb - pa;
      return policyRank(b) - policyRank(a);
    }
    if (sortBy === 'relevance') {
      const ra = a.relevanceScore ?? 0;
      const rb = b.relevanceScore ?? 0;
      if (rb !== ra) return rb - ra;
      return policyRank(b) - policyRank(a);
    }
    // 'recommended': direct CORS importable first, then relevance score
    const prDiff = policyRank(b) - policyRank(a);
    if (prDiff !== 0) return prDiff;
    return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
  });

  return sorted;
}

export async function discoverScientific3DAssets(
  queryOrOptions: string | Discover3DOptions,
  legacyProviderFilter: 'all' | Provider3DId = 'all',
  legacySignal?: AbortSignal
): Promise<Discover3DResponse> {
  const opts: Discover3DOptions =
    typeof queryOrOptions === 'string'
      ? {
          query: queryOrOptions,
          providerFilter: legacyProviderFilter,
          signal: legacySignal
        }
      : queryOrOptions;

  const clean = opts.query.trim();
  if (clean.length < 2) {
    return { candidates: [], warnings: [], rawCount: 0 };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      candidates: [],
      rawCount: 0,
      warnings: [
        'Offline mode detected. Connect to the internet to query Human Reference Atlas, PubChem 3D, RCSB PDB, Wikimedia Commons, Smithsonian, and Sketchfab.'
      ]
    };
  }

  const providerFilter = opts.providerFilter || 'all';
  const activeAdapters = LIVE_PROVIDERS.filter(
    (adapter) => providerFilter === 'all' || adapter.meta.id === providerFilter
  );

  const settled = await Promise.all(
    activeAdapters.map(async (adapter) => {
      try {
        return await adapter.search({
          query: clean,
          category: opts.categoryFilter,
          signal: opts.signal
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
        return {
          candidates: [] as Discovered3DCandidate[],
          warning: `${adapter.meta.shortName}: ${
            err instanceof Error ? err.message : 'Request failed.'
          }`
        };
      }
    })
  );

  const warnings: string[] = [];
  const rawCombined: Discovered3DCandidate[] = [];
  const seenIds = new Set<string>();

  for (const res of settled) {
    if (res.warning) warnings.push(res.warning);
    for (const c of res.candidates) {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id);
        rawCombined.push(c);
      }
    }
  }

  const finalCandidates = sortAndFilterDiscovered3D(rawCombined, {
    categoryFilter: opts.categoryFilter,
    availabilityFilter: opts.availabilityFilter,
    sortBy: opts.sortBy
  });

  return {
    candidates: finalCandidates,
    warnings,
    rawCount: rawCombined.length
  };
}
