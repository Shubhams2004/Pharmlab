import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { LibraryBookMeta } from '../knowledge-library/types';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import {
  ANALYTICAL_TEST_FACETS,
  PHARMACOPOEIA_DIRECTORY,
  STANDARD_CATEGORY_FACETS
} from './pharmacopoeiaCatalog';
import { runUnifiedPharmacopoeiaSearch } from './searchEngine';
import {
  AnalyticalTestCategoryId,
  DEPARTMENT_LABELS,
  ORIGIN_LABELS,
  PharmacopoeiaDepartmentKey,
  PharmacopoeiaUserStore,
  SearchResultOrigin,
  StandardCategoryId,
  UnifiedPharmacopoeiaSearchResult
} from './types';

interface PharmacopoeiaSearchProps {
  initialQuery?: string;
  initialDepartment?: PharmacopoeiaDepartmentKey | 'all';
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
  onSelectEntry: (entryId: string) => void;
}

const SUGGESTED_QUERIES = [
  'Paracetamol',
  'Titrimetry',
  'Limit Tests',
  'Dissolution',
  'General Notices',
  'Chromatography',
  'Excipients',
  'Sterility',
  'Essential Medicines'
];

export default function PharmacopoeiaSearch({
  initialQuery = '',
  initialDepartment = 'all',
  userStore,
  books,
  referenceItems,
  referenceProfiles,
  onSelectEntry
}: PharmacopoeiaSearchProps) {
  const { openKnowledgeLibrary } = useLibraryNavigation();

  const [query, setQuery] = useState(initialQuery);
  const [originFilter, setOriginFilter] = useState<SearchResultOrigin | 'all'>('all');
  const [entryFilter, setEntryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<PharmacopoeiaDepartmentKey | 'all'>(
    initialDepartment
  );
  const [analyticalTestFilter, setAnalyticalTestFilter] = useState<AnalyticalTestCategoryId | 'all'>(
    'all'
  );
  const [standardCategoryFilter, setStandardCategoryFilter] = useState<StandardCategoryId | 'all'>(
    'all'
  );

  const [results, setResults] = useState<UnifiedPharmacopoeiaSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialDepartment) setDepartmentFilter(initialDepartment);
  }, [initialDepartment]);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      runUnifiedPharmacopoeiaSearch({
        query,
        originFilter,
        entryIdFilter: entryFilter,
        departmentFilter,
        analyticalTestFilter,
        standardCategoryFilter,
        userStore,
        books,
        referenceItems,
        referenceProfiles
      })
        .then((hits) => {
          if (!cancelled) {
            setResults(hits);
            setSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setSearching(false);
          }
        });
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    query,
    originFilter,
    entryFilter,
    departmentFilter,
    analyticalTestFilter,
    standardCategoryFilter,
    userStore,
    books,
    referenceItems,
    referenceProfiles
  ]);

  const countsByOrigin = results.reduce<Record<SearchResultOrigin, number>>(
    (acc, r) => {
      acc[r.origin] = (acc[r.origin] || 0) + 1;
      return acc;
    },
    {
      local_metadata: 0,
      imported_reference_file: 0,
      public_official_source: 0,
      external_official_portal: 0
    }
  );

  return (
    <div className="space-y-6">
      {/* Search Bar & Transparent Architecture Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Unified Pharmacopoeial &amp; Standards Search
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Search across PharmaLab directory metadata, analytical test categories, imported local PDFs, publicly accessible official portals (WHO Ph. Int., PMDA JP), and external official compendial portals. Every result explicitly states its origin.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drug names, monograph categories, assays, impurities, excipients, reagents, or pharmacopoeias..."
            className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Topic Queries */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            Quick topics:
          </span>
          {SUGGESTED_QUERIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => setQuery(sq)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Facet Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as SearchResultOrigin | 'all')}
            aria-label="Filter by result origin"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Result Origins</option>
            <option value="local_metadata">{ORIGIN_LABELS.local_metadata}</option>
            <option value="imported_reference_file">{ORIGIN_LABELS.imported_reference_file}</option>
            <option value="public_official_source">{ORIGIN_LABELS.public_official_source}</option>
            <option value="external_official_portal">{ORIGIN_LABELS.external_official_portal}</option>
          </select>

          <select
            value={entryFilter}
            onChange={(e) => setEntryFilter(e.target.value)}
            aria-label="Filter by pharmacopoeia"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Pharmacopoeias &amp; Refs</option>
            {PHARMACOPOEIA_DIRECTORY.map((e) => (
              <option key={e.id} value={e.id}>
                {e.abbreviation} — {e.fullName}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value as PharmacopoeiaDepartmentKey | 'all')
            }
            aria-label="Filter by pharmaceutical subject"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Subjects</option>
            {(Object.keys(DEPARTMENT_LABELS) as PharmacopoeiaDepartmentKey[]).map((key) => (
              <option key={key} value={key}>
                {DEPARTMENT_LABELS[key]}
              </option>
            ))}
          </select>

          <select
            value={analyticalTestFilter}
            onChange={(e) =>
              setAnalyticalTestFilter(e.target.value as AnalyticalTestCategoryId | 'all')
            }
            aria-label="Filter by analytical test category"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Analytical Tests</option>
            {ANALYTICAL_TEST_FACETS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>

          <select
            value={standardCategoryFilter}
            onChange={(e) =>
              setStandardCategoryFilter(e.target.value as StandardCategoryId | 'all')
            }
            aria-label="Filter by standard category"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Standard Categories</option>
            {STANDARD_CATEGORY_FACETS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Origin Breakdown Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {(
          [
            'local_metadata',
            'imported_reference_file',
            'public_official_source',
            'external_official_portal'
          ] as SearchResultOrigin[]
        ).map((origin) => (
          <button
            key={origin}
            type="button"
            onClick={() => setOriginFilter((prev) => (prev === origin ? 'all' : origin))}
            className={`p-3.5 text-left transition-colors ${
              originFilter === origin
                ? 'bg-emerald-500/10'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {ORIGIN_LABELS[origin]}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {countsByOrigin[origin]}
            </p>
          </button>
        ))}
      </section>

      {/* Search Results */}
      {searching ? (
        <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Searching local metadata, imported PDFs, and official directory portals...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No matching results under the selected filters.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clear filters or query an official portal directly for proprietary monograph texts.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
          {results.map((hit) => {
            const safeUrl = sanitizeHttpUrl(hit.externalUrl);
            const originColor =
              hit.origin === 'public_official_source'
                ? 'text-emerald-700 dark:text-emerald-400'
                : hit.origin === 'imported_reference_file'
                ? 'text-blue-700 dark:text-blue-400'
                : hit.origin === 'external_official_portal'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-300';

            const OriginIcon =
              hit.origin === 'imported_reference_file'
                ? FileText
                : hit.origin === 'public_official_source'
                ? ShieldCheck
                : Globe;

            return (
              <article key={hit.id} className="p-4 sm:p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${originColor}`}>
                    <OriginIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{hit.originLabel}</span>
                  </span>
                  {hit.entryAbbreviation && (
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {hit.entryAbbreviation}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{hit.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{hit.subtitle}</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {hit.snippet}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {hit.entryId && (
                    <button
                      type="button"
                      onClick={() => onSelectEntry(hit.entryId!)}
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Open Entry</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {hit.bookId && (
                    <button
                      type="button"
                      onClick={() =>
                        openKnowledgeLibrary({
                          bookId: hit.bookId!,
                          pageNumber: hit.pageNumber || 1,
                          searchQuery: query
                        })
                      }
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Open Local PDF Page {hit.pageNumber || 1}</span>
                    </button>
                  )}

                  {safeUrl && (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Official Portal</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
