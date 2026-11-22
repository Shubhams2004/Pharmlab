import {
  ResourceDiscoveryFilters,
  ResourceProviderId,
  ResourceType,
  ScientificResourceItem,
  UnifiedDiscoveryResult
} from '../types';
import { buildCanonicalResourceKey, matchesDateWindow } from '../utils';
import { searchEuropePmc } from './europePmcProvider';
import { searchNcbiBookshelf } from './ncbiBookshelfProvider';
import { searchOpenStaxBooks } from './openStaxProvider';
import { searchPmc } from './pmcProvider';
import { searchPubMed } from './pubmedProvider';
import { searchVisualProviders } from './visualProvidersAdapter';

const TEXT_VISUAL_TYPES = new Set<ResourceType>([
  'anatomical_diagram',
  'histology_image',
  'scientific_illustration'
]);

export async function discoverScientificResources(
  query: string,
  filters: ResourceDiscoveryFilters = {},
  signal?: AbortSignal
): Promise<UnifiedDiscoveryResult> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) {
    return { items: [], warnings: [], providerCounts: {}, offline: false };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      items: [],
      warnings: [
        'Your browser reports an offline network state. External scientific repositories cannot be queried until connectivity returns.'
      ],
      providerCounts: {},
      offline: true
    };
  }

  const enabled = new Set<ResourceProviderId>(
    filters.providers && filters.providers.length > 0
      ? filters.providers
      : ['europepmc', 'pubmed', 'pmc', 'ncbi_bookshelf', 'openstax', 'wikimedia', 'pubchem']
  );

  const selectedTypes = filters.resourceTypes || [];
  const wantsOnlyVisuals =
    selectedTypes.length > 0 && selectedTypes.every((t) => TEXT_VISUAL_TYPES.has(t));
  const wantsOnlyLiterature =
    selectedTypes.length > 0 && selectedTypes.every((t) => !TEXT_VISUAL_TYPES.has(t));

  const dateWindow = filters.dateWindow || 'all';
  const sortMode = filters.sortMode || 'relevance';

  const warnings: string[] = [];
  const providerCounts: Partial<Record<ResourceProviderId, number>> = {};
  const tasks: Array<Promise<ScientificResourceItem[]>> = [];

  if (!wantsOnlyVisuals) {
    if (enabled.has('europepmc')) {
      tasks.push(
        searchEuropePmc(cleanQuery, { dateWindow, sortMode, limit: 8, signal })
          .then((items) => {
            providerCounts.europepmc = items.length;
            return items;
          })
          .catch((e) => {
            if ((e as Error)?.name !== 'AbortError') {
              warnings.push(`Europe PMC: ${e instanceof Error ? e.message : 'search unavailable'}`);
            }
            return [];
          })
      );
    }

    if (enabled.has('pubmed')) {
      tasks.push(
        searchPubMed(cleanQuery, { dateWindow, sortMode, limit: 6, signal })
          .then((items) => {
            providerCounts.pubmed = items.length;
            return items;
          })
          .catch((e) => {
            if ((e as Error)?.name !== 'AbortError') {
              warnings.push(`PubMed: ${e instanceof Error ? e.message : 'search unavailable'}`);
            }
            return [];
          })
      );
    }

    if (enabled.has('pmc')) {
      tasks.push(
        searchPmc(cleanQuery, { dateWindow, sortMode, limit: 6, signal })
          .then((items) => {
            providerCounts.pmc = items.length;
            return items;
          })
          .catch((e) => {
            if ((e as Error)?.name !== 'AbortError') {
              warnings.push(`PubMed Central: ${e instanceof Error ? e.message : 'search unavailable'}`);
            }
            return [];
          })
      );
    }

    if (enabled.has('ncbi_bookshelf')) {
      tasks.push(
        searchNcbiBookshelf(cleanQuery, { dateWindow, sortMode, limit: 6, signal })
          .then((items) => {
            providerCounts.ncbi_bookshelf = items.length;
            return items;
          })
          .catch((e) => {
            if ((e as Error)?.name !== 'AbortError') {
              warnings.push(`NCBI Bookshelf: ${e instanceof Error ? e.message : 'search unavailable'}`);
            }
            return [];
          })
      );
    }

    if (enabled.has('openstax')) {
      tasks.push(
        searchOpenStaxBooks(cleanQuery, { limit: 4, signal })
          .then((items) => {
            providerCounts.openstax = items.length;
            return items;
          })
          .catch((e) => {
            if ((e as Error)?.name !== 'AbortError') {
              warnings.push(`OpenStax: ${e instanceof Error ? e.message : 'catalog unavailable'}`);
            }
            return [];
          })
      );
    }
  }

  // Visual providers (Wikimedia, PubChem, GBIF, OpenStax figures)
  const runVisual =
    !wantsOnlyLiterature &&
    (enabled.has('wikimedia') || enabled.has('pubchem') || enabled.has('gbif') || enabled.has('openstax'));

  if (runVisual) {
    tasks.push(
      (async () => {
        const subTasks: Array<Promise<{ items: ScientificResourceItem[]; warnings: string[] }>> = [];
        if (enabled.has('wikimedia')) {
          subTasks.push(searchVisualProviders(cleanQuery, 'wikimedia'));
        }
        if (enabled.has('openstax')) {
          subTasks.push(searchVisualProviders(cleanQuery, 'openstax'));
        }
        if (enabled.has('pubchem')) {
          subTasks.push(searchVisualProviders(cleanQuery, 'pubchem'));
        }
        if (enabled.has('gbif')) {
          subTasks.push(searchVisualProviders(cleanQuery, 'gbif'));
        }
        const results = await Promise.all(subTasks);
        const merged: ScientificResourceItem[] = [];
        for (const r of results) {
          warnings.push(...r.warnings);
          for (const item of r.items) {
            providerCounts[item.providerId] = (providerCounts[item.providerId] || 0) + 1;
            merged.push(item);
          }
        }
        return merged;
      })()
    );
  }

  const settled = await Promise.all(tasks);
  const seenKeys = new Set<string>();
  const combined: ScientificResourceItem[] = [];

  for (const list of settled) {
    for (const item of list) {
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.resourceType)) {
        continue;
      }
      if (dateWindow !== 'all' && !matchesDateWindow(item.year, dateWindow)) {
        continue;
      }
      const key = buildCanonicalResourceKey(item);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      combined.push(item);
    }
  }

  const finalCounts: Partial<Record<ResourceProviderId, number>> = {};
  for (const item of combined) {
    finalCounts[item.providerId] = (finalCounts[item.providerId] || 0) + 1;
  }

  combined.sort((a, b) => {
    if (sortMode === 'date_desc') {
      const ya = a.year || 0;
      const yb = b.year || 0;
      if (yb !== ya) return yb - ya;
      return b.publicationDate.localeCompare(a.publicationDate);
    }
    return b.relevanceScore - a.relevanceScore;
  });

  return {
    items: combined,
    warnings: Array.from(new Set(warnings)),
    providerCounts: finalCounts,
    offline: false
  };
}
