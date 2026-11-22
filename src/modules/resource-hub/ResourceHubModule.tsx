import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  Images,
  Library,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  WifiOff,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { deleteBook, getAllBooks } from '../knowledge-library/libraryDb';
import { LibraryBookMeta } from '../knowledge-library/types';
import { DiscoverySourceFilter } from '../visual-library/openAccessDiscovery';
import { VisualMediaItem } from '../visual-library/types';
import { deleteVisual, getAllVisuals } from '../visual-library/visualDb';
import ResourceImportModal from './ResourceImportModal';
import { discoverScientificResources } from './providers/discoverResources';
import { PROVIDER_BY_ID, PROVIDER_REGISTRY } from './providers/registry';
import { searchVisualProviders } from './providers/visualProvidersAdapter';
import {
  addRecentSearchQuery,
  detectDuplicateResource,
  loadResourceHubState,
  removeSavedResourceRecord,
  setProviderEnabled,
  upsertSavedResourceRecord
} from './resourceHubStorage';
import {
  AcademicContextRef,
  ImportStatus,
  PublicationDateWindow,
  ResourceHubTab,
  ResourceProviderId,
  ResourceSortMode,
  ResourceType,
  SavedResourceRecord,
  ScientificResourceItem,
  VisualDiscoveryCategoryId
} from './types';
import {
  ALL_RESOURCE_TYPES,
  DISCOVER_SEARCH_SUGGESTIONS,
  formatAuthorsLine,
  RESOURCE_TYPE_LABELS,
  sanitizeHttpUrl,
  VISUAL_DISCOVERY_CATEGORIES
} from './utils';

export interface ResourceHubModuleProps {
  initialQuery?: string | null;
  initialTab?: ResourceHubTab | null;
  initialResourceType?: ResourceType | null;
  initialContext?: AcademicContextRef | null;
  navNonce?: number;
}

const IMPORT_STATUS_META: Record<
  ImportStatus,
  { label: string; toneClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  external: {
    label: 'External Source',
    toneClass: 'text-slate-600 dark:text-slate-400',
    icon: Globe
  },
  saved_reference: {
    label: 'Saved Reference',
    toneClass: 'text-sky-700 dark:text-sky-300',
    icon: Bookmark
  },
  pending_import: {
    label: 'Pending Import',
    toneClass: 'text-amber-700 dark:text-amber-300',
    icon: RefreshCw
  },
  imported: {
    label: 'Imported in PharmaLab',
    toneClass: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2
  },
  failed: {
    label: 'Import Failed',
    toneClass: 'text-rose-700 dark:text-rose-300',
    icon: AlertTriangle
  },
  unavailable: {
    label: 'Direct Fetch Restricted',
    toneClass: 'text-amber-700 dark:text-amber-300',
    icon: AlertTriangle
  }
};

export default function ResourceHubModule({
  initialQuery,
  initialTab,
  initialResourceType,
  initialContext,
  navNonce = 0
}: ResourceHubModuleProps) {
  const {
    openKnowledgeLibrary,
    openVisualLibrary,
    navigateToModule,
    setWorkspaceSection
  } = useLibraryNavigation();

  const [activeTab, setActiveTab] = useState<ResourceHubTab>(initialTab || 'discover');
  const [hubState, setHubState] = useState(() => loadResourceHubState());
  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [visuals, setVisuals] = useState<VisualMediaItem[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [activeContext, setActiveContext] = useState<AcademicContextRef | null>(
    initialContext || null
  );

  // Discover state
  const [query, setQuery] = useState(initialQuery || '');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<'all' | ResourceProviderId>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | ResourceType>(
    initialResourceType || 'all'
  );
  const [dateWindow, setDateWindow] = useState<PublicationDateWindow>('all');
  const [sortMode, setSortMode] = useState<ResourceSortMode>('relevance');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<ScientificResourceItem[]>([]);
  const [searchWarnings, setSearchWarnings] = useState<string[]>([]);
  const [providerCounts, setProviderCounts] = useState<Partial<Record<ResourceProviderId, number>>>({});
  const [expandedAbstractIds, setExpandedAbstractIds] = useState<Record<string, boolean>>({});
  const activeSearchAbortRef = useRef<AbortController | null>(null);
  const handledNonceRef = useRef<number>(-1);

  // Visual Discovery state
  const [visualCategory, setVisualCategory] = useState<VisualDiscoveryCategoryId>('all');
  const [visualQuery, setVisualQuery] = useState('Human nephron anatomy');
  const [visualSource, setVisualSource] = useState<DiscoverySourceFilter>('all');
  const [visualSearching, setVisualSearching] = useState(false);
  const [visualResults, setVisualResults] = useState<ScientificResourceItem[]>([]);
  const [visualWarnings, setVisualWarnings] = useState<string[]>([]);
  const [visualPreviewItem, setVisualPreviewItem] = useState<ScientificResourceItem | null>(null);

  // Saved & Imported filter state
  const [savedSearch, setSavedSearch] = useState('');
  const [savedStatusFilter, setSavedStatusFilter] = useState<'all' | ImportStatus>('all');
  const [savedTypeFilter, setSavedTypeFilter] = useState<'all' | ResourceType>('all');

  // Review & Import modal + Notice
  const [importTarget, setImportTarget] = useState<ScientificResourceItem | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const refreshLocalLibraries = useCallback(async () => {
    try {
      const [loadedBooks, loadedVisuals] = await Promise.all([getAllBooks(), getAllVisuals()]);
      setBooks(loadedBooks);
      setVisuals(loadedVisuals);
    } catch {
      // ignore IndexedDB errors
    }
    setHubState(loadResourceHubState());
  }, []);

  useEffect(() => {
    refreshLocalLibraries();
  }, [refreshLocalLibraries]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const labelMap: Record<ResourceHubTab, string> = {
      discover: 'Discover',
      visuals: 'Visual Discovery',
      sources: 'Trusted Sources',
      saved: 'Saved & Imported'
    };
    setWorkspaceSection('Scientific Resource Hub', labelMap[activeTab]);
    return () => setWorkspaceSection(null);
  }, [activeTab, setWorkspaceSection]);

  const executeDiscoverSearch = useCallback(
    async (
      searchTerm: string,
      opts?: {
        source?: 'all' | ResourceProviderId;
        type?: 'all' | ResourceType;
        date?: PublicationDateWindow;
        sort?: ResourceSortMode;
      }
    ) => {
      const clean = searchTerm.trim();
      if (clean.length < 2) return;

      activeSearchAbortRef.current?.abort();
      const controller = new AbortController();
      activeSearchAbortRef.current = controller;

      const sourceFilter = opts?.source ?? selectedSourceFilter;
      const typeFilter = opts?.type ?? selectedTypeFilter;
      const dateFilter = opts?.date ?? dateWindow;
      const sort = opts?.sort ?? sortMode;

      const enabledProviders = (Object.keys(hubState.enabledProviders) as ResourceProviderId[]).filter(
        (id) => hubState.enabledProviders[id]
      );
      const providers =
        sourceFilter !== 'all'
          ? [sourceFilter]
          : enabledProviders.length > 0
            ? enabledProviders
            : undefined;

      setSearching(true);
      setHasSearched(true);
      setSearchWarnings([]);
      setHubState(addRecentSearchQuery(clean));

      try {
        const res = await discoverScientificResources(
          clean,
          {
            providers,
            resourceTypes: typeFilter !== 'all' ? [typeFilter] : undefined,
            dateWindow: dateFilter,
            sortMode: sort
          },
          controller.signal
        );
        if (controller.signal.aborted) return;
        setResults(res.items);
        setSearchWarnings(res.warnings);
        setProviderCounts(res.providerCounts);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setResults([]);
        setSearchWarnings([
          err instanceof Error ? err.message : 'Unable to reach scientific repositories.'
        ]);
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    },
    [dateWindow, hubState.enabledProviders, selectedSourceFilter, selectedTypeFilter, sortMode]
  );

  const executeVisualSearch = useCallback(
    async (term: string, sourceFilter: DiscoverySourceFilter = visualSource) => {
      const clean = term.trim();
      if (clean.length < 2) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setVisualWarnings(['Offline mode active. Connect to the internet to query Wikimedia Commons, OpenStax figures, PubChem, or GBIF.']);
        setVisualResults([]);
        return;
      }
      setVisualSearching(true);
      setVisualWarnings([]);
      try {
        const { items, warnings } = await searchVisualProviders(clean, sourceFilter);
        setVisualResults(items);
        setVisualWarnings(warnings);
      } catch (err) {
        setVisualWarnings([
          err instanceof Error ? err.message : 'Visual discovery failed.'
        ]);
      } finally {
        setVisualSearching(false);
      }
    },
    [visualSource]
  );

  useEffect(() => {
    if (handledNonceRef.current === navNonce) return;
    handledNonceRef.current = navNonce;

    if (initialTab) setActiveTab(initialTab);
    if (initialContext) setActiveContext(initialContext);
    if (initialResourceType) setSelectedTypeFilter(initialResourceType);

    const q = (initialQuery || '').trim();
    if (q.length >= 2) {
      if (initialTab === 'visuals') {
        setVisualQuery(q);
        void executeVisualSearch(q);
      } else {
        setQuery(q);
        void executeDiscoverSearch(q, {
          type: initialResourceType || 'all'
        });
      }
    }
  }, [
    executeDiscoverSearch,
    executeVisualSearch,
    initialContext,
    initialQuery,
    initialResourceType,
    initialTab,
    navNonce
  ]);

  const handleQuickSaveReference = (item: ScientificResourceItem) => {
    const initialContexts = activeContext ? [activeContext] : [];
    const { state } = upsertSavedResourceRecord(item, {
      status: 'saved_reference',
      destination: 'reference_list',
      contexts: initialContexts,
      topics: activeContext ? [activeContext.label, ...item.topics] : item.topics
    });
    setHubState(state);
    setToastNotice(`Saved "${item.title}" to Saved & Imported.`);
  };

  const handleDeleteSavedRecord = async (rec: SavedResourceRecord, alsoDeleteImportedAsset: boolean) => {
    if (alsoDeleteImportedAsset) {
      try {
        if (rec.linkedBookId) await deleteBook(rec.linkedBookId);
        if (rec.linkedVisualId) await deleteVisual(rec.linkedVisualId);
      } catch {
        // ignore missing item in IndexedDB
      }
    }
    setHubState(removeSavedResourceRecord(rec.id));
    await refreshLocalLibraries();
    setToastNotice(`Removed "${rec.resource.title}" from Resource Hub.`);
  };

  const filteredSavedRecords = useMemo(() => {
    const q = savedSearch.trim().toLowerCase();
    return hubState.savedRecords.filter((rec) => {
      if (savedStatusFilter !== 'all' && rec.status !== savedStatusFilter) return false;
      if (savedTypeFilter !== 'all' && rec.resource.resourceType !== savedTypeFilter) return false;
      if (!q) return true;
      const haystack = [
        rec.resource.title,
        rec.resource.providerName,
        rec.resource.journalOrPublisher,
        ...rec.linkedTopics,
        ...rec.linkedContexts.map((c) => c.label),
        rec.resource.authors.join(' ')
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [hubState.savedRecords, savedSearch, savedStatusFilter, savedTypeFilter]);

  const getResourceDisplayState = (item: ScientificResourceItem) => {
    const dup = detectDuplicateResource(item, books, visuals, hubState.savedRecords);
    if (dup.existingBookId || dup.existingVisualId) {
      return {
        status: 'imported' as ImportStatus,
        dup
      };
    }
    if (dup.savedRecord) {
      return {
        status: dup.savedRecord.status,
        dup
      };
    }
    return {
      status: 'external' as ImportStatus,
      dup
    };
  };

  const enabledProviderCount = useMemo(
    () => Object.values(hubState.enabledProviders).filter(Boolean).length,
    [hubState.enabledProviders]
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Hub Header */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Open-Access Biomedical &amp; Pharmaceutical Gateway · {enabledProviderCount} Active Sources
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Scientific Resource Hub
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Search peer-reviewed papers, open textbooks, reference chapters, and reusable scientific illustrations across trusted repositories, then organize and attach them directly to PharmaLab departments and anatomy structures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openVisualLibrary()}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Images className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Visual Library ({visuals.length})</span>
            </button>
            <button
              type="button"
              onClick={() => openKnowledgeLibrary()}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Library className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>PDF Library ({books.length})</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Scientific Resource Hub sections"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-200 dark:border-slate-800 pt-4"
        >
          {[
            { id: 'discover', label: 'Discover', icon: Search },
            { id: 'visuals', label: 'Visual Discovery', icon: Images },
            { id: 'sources', label: `Sources (${PROVIDER_REGISTRY.length})`, icon: Globe },
            { id: 'saved', label: `Saved & Imported (${hubState.savedRecords.length})`, icon: Bookmark }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id as ResourceHubTab)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Active Contextual Topic Banner */}
      {activeContext && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Contextual Discovery Active: <strong>{activeContext.label}</strong> — saved or imported resources can attach directly to this subject.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveContext(null)}
            className="text-xs font-semibold hover:underline inline-flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Context</span>
          </button>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Offline Mode Detected</p>
            <p className="text-xs mt-0.5">
              Live external discovery requires an active internet connection. Your Saved &amp; Imported resources, IndexedDB PDFs, and Visual Library remain available offline.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {toastNotice && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================= TAB 1: DISCOVER ======================= */}
      {activeTab === 'discover' && (
        <div className="space-y-5">
          {/* Search & Filter Controls */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeDiscoverSearch(query);
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search scientific topics, organs, drugs, mechanisms, or textbooks (e.g. 'glomerular filtration')..."
                  className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    aria-label="Clear query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searching || query.trim().length < 2}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search Repositories</span>
              </button>
            </form>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label htmlFor="rh-src-filter" className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  <span>Source</span>
                </label>
                <select
                  id="rh-src-filter"
                  value={selectedSourceFilter}
                  onChange={(e) => {
                    const next = e.target.value as 'all' | ResourceProviderId;
                    setSelectedSourceFilter(next);
                    if (hasSearched && query.trim().length >= 2) {
                      void executeDiscoverSearch(query, { source: next });
                    }
                  }}
                  className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <option value="all">All Enabled Sources ({enabledProviderCount})</option>
                  {PROVIDER_REGISTRY.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="rh-type-filter" className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  Resource Type
                </label>
                <select
                  id="rh-type-filter"
                  value={selectedTypeFilter}
                  onChange={(e) => {
                    const next = e.target.value as 'all' | ResourceType;
                    setSelectedTypeFilter(next);
                    if (hasSearched && query.trim().length >= 2) {
                      void executeDiscoverSearch(query, { type: next });
                    }
                  }}
                  className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <option value="all">All Resource Types</option>
                  {ALL_RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {RESOURCE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="rh-date-filter" className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  Publication Date
                </label>
                <select
                  id="rh-date-filter"
                  value={dateWindow}
                  onChange={(e) => {
                    const next = e.target.value as PublicationDateWindow;
                    setDateWindow(next);
                    if (hasSearched && query.trim().length >= 2) {
                      void executeDiscoverSearch(query, { date: next });
                    }
                  }}
                  className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <option value="all">Any Publication Date</option>
                  <option value="1y">Last 1 Year</option>
                  <option value="5y">Last 5 Years</option>
                  <option value="10y">Last 10 Years</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="rh-sort-filter" className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  Sort Order
                </label>
                <select
                  id="rh-sort-filter"
                  value={sortMode}
                  onChange={(e) => {
                    const next = e.target.value as ResourceSortMode;
                    setSortMode(next);
                    if (hasSearched && query.trim().length >= 2) {
                      void executeDiscoverSearch(query, { sort: next });
                    }
                  }}
                  className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date_desc">Publication Date (Newest)</option>
                </select>
              </div>
            </div>

            {/* Search Suggestions & Recent Queries */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Suggested:
              </span>
              {DISCOVER_SEARCH_SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    void executeDiscoverSearch(term);
                  }}
                  className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            {hubState.recentQueries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Recent:
                </span>
                {hubState.recentQueries.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      void executeDiscoverSearch(term);
                    }}
                    className="min-h-[30px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Partial / Provider Warnings */}
          {searchWarnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Partial Source Notice</span>
              </p>
              <ul className="list-disc pl-5 text-xs space-y-0.5">
                {searchWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Results Section */}
          {searching ? (
            <div className="py-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium">
                Querying Europe PMC, PubMed, PMC, NCBI Bookshelf, OpenStax &amp; Visual Archives...
              </p>
            </div>
          ) : !hasSearched ? (
            <div className="py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <Compass className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Search Open Scientific Literature &amp; Textbooks
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Enter any anatomical organ, drug class, physiological mechanism, or textbook title above — or click a suggested biomedical topic to query live repositories.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                No matching open resources found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Try broadening the publication date window, switching resource types to All, or using standard anatomical/pharmacological terminology.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 px-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  {results.length} resources retrieved across repositories
                </p>
                <p className="tabular-nums">
                  {Object.entries(providerCounts)
                    .filter(([, cnt]) => (cnt || 0) > 0)
                    .map(([pid, cnt]) => `${PROVIDER_BY_ID[pid as ResourceProviderId]?.shortName || pid}: ${cnt}`)
                    .join(' · ')}
                </p>
              </div>

              <div className="space-y-3.5">
                {results.map((item) => {
                  const { status, dup } = getResourceDisplayState(item);
                  const statusMeta = IMPORT_STATUS_META[status];
                  const StatusIcon = statusMeta.icon;
                  const safeUrl = sanitizeHttpUrl(item.sourceUrl);
                  const safePdf = sanitizeHttpUrl(item.pdfUrl);
                  const expanded = Boolean(expandedAbstractIds[item.id]);

                  return (
                    <article
                      key={item.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none"
                    >
                      {item.previewUrl && (
                        <div className="w-full sm:w-32 h-32 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={item.previewUrl}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <p className="font-semibold text-slate-600 dark:text-slate-400">
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {item.providerName}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>{RESOURCE_TYPE_LABELS[item.resourceType]}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="tabular-nums">{item.publicationDate}</span>
                          </p>

                          <span className={`inline-flex items-center gap-1 font-semibold ${statusMeta.toneClass}`}>
                            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{statusMeta.label}</span>
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatAuthorsLine(item.authors)} · {item.journalOrPublisher}
                          {item.identifiers.pmid ? ` · PMID ${item.identifiers.pmid}` : ''}
                          {item.identifiers.pmcid ? ` · ${item.identifiers.pmcid}` : ''}
                          {item.identifiers.doi ? ` · DOI ${item.identifiers.doi}` : ''}
                          {item.identifiers.nbkId ? ` · ${item.identifiers.nbkId}` : ''}
                        </p>

                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {expanded && item.abstractText ? item.abstractText : item.summary}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck
                                className={`w-3.5 h-3.5 ${
                                  item.isOpenAccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                }`}
                              />
                              <span>{item.license}</span>
                            </span>
                            {item.abstractText && item.abstractText.length > item.summary.length && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAbstractIds((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }))
                                }
                                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                              >
                                {expanded ? 'Show concise summary' : 'Read full abstract'}
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {safeUrl && (
                              <a
                                href={safeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Original</span>
                              </a>
                            )}

                            {safePdf && (
                              <a
                                href={safePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Official PDF</span>
                              </a>
                            )}

                            {status === 'external' && (
                              <button
                                type="button"
                                onClick={() => handleQuickSaveReference(item)}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Bookmark className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Save Reference</span>
                              </button>
                            )}

                            {dup.existingBookId ? (
                              <button
                                type="button"
                                onClick={() => openKnowledgeLibrary({ bookId: dup.existingBookId })}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Library className="w-3.5 h-3.5" />
                                <span>Open in PDF Library</span>
                              </button>
                            ) : dup.existingVisualId ? (
                              <button
                                type="button"
                                onClick={() => openVisualLibrary({ visualId: dup.existingVisualId })}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Images className="w-3.5 h-3.5" />
                                <span>Open in Visual Library</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setImportTarget(item)}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Review &amp; Import</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: VISUAL DISCOVERY ======================= */}
      {activeTab === 'visuals' && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Open-Access Visual &amp; Diagram Discovery
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Preview anatomical illustrations, stained histology slides, chemical formulas, and apparatus before importing into PharmaLab&rsquo;s Visual Library.
                </p>
              </div>
              <select
                aria-label="Visual discovery repository"
                value={visualSource}
                onChange={(e) => {
                  const next = e.target.value as DiscoverySourceFilter;
                  setVisualSource(next);
                  void executeVisualSearch(visualQuery, next);
                }}
                className="min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="all">All Visual Sources (Wikimedia, OpenStax, PubChem)</option>
                <option value="wikimedia">Wikimedia Commons</option>
                <option value="openstax">OpenStax Scientific Figures</option>
                <option value="pubchem">PubChem (NIH) 2D Structures</option>
                <option value="gbif">GBIF Medicinal Plants</option>
              </select>
            </div>

            {/* Category Bar (11 Required Visual Categories) */}
            <div className="flex flex-wrap gap-1.5">
              {VISUAL_DISCOVERY_CATEGORIES.map((cat) => {
                const active = visualCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setVisualCategory(cat.id);
                      setVisualQuery(cat.defaultQuery);
                      void executeVisualSearch(cat.defaultQuery);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeVisualSearch(visualQuery);
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={visualQuery}
                  onChange={(e) => setVisualQuery(e.target.value)}
                  placeholder="Search anatomical plates, histology, microscopy, compounds (e.g. 'nephron', 'aspirin')..."
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={visualSearching || visualQuery.trim().length < 2}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                {visualSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Images className="w-4 h-4" />}
                <span>Discover Visuals</span>
              </button>
            </form>
          </section>

          {visualWarnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              {visualWarnings.join(' · ')}
            </div>
          )}

          {visualSearching ? (
            <div className="py-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-sm">Fetching open-licensed images &amp; attribution metadata...</p>
            </div>
          ) : visualResults.length === 0 ? (
            <div className="py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <Images className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Choose any visual category above or enter a scientific subject to browse open-access images.
              </p>
              <button
                type="button"
                onClick={() => void executeVisualSearch(visualQuery)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Load Sample Visuals ({visualQuery})</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visualResults.map((item) => {
                const dup = detectDuplicateResource(item, books, visuals, hubState.savedRecords);
                return (
                  <article
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setVisualPreviewItem(item)}
                        className="w-full aspect-[4/3] bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden relative group block"
                      >
                        <img
                          src={item.previewUrl || item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-contain p-2 group-hover:scale-[1.02] transition-transform"
                        />
                        <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-slate-900/75 text-white text-xs font-medium inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </span>
                      </button>

                      <div className="p-4 space-y-2">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.providerName} · {item.license}
                        </p>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                        {item.licenseWarning && (
                          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{item.licenseWarning}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setVisualPreviewItem(item)}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      {dup.existingVisualId ? (
                        <button
                          type="button"
                          onClick={() => openVisualLibrary({ visualId: dup.existingVisualId })}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>In Visual Library</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setImportTarget(item)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Review &amp; Import</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: SOURCES REGISTRY ======================= */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Trusted Scientific &amp; Educational Source Registry
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Every enabled provider executes live public HTTPS queries directly from your browser without mandatory API keys, paywalls, or proxy servers. Toggle sources included in global Discover searches below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVIDER_REGISTRY.map((provider) => {
              const enabled = Boolean(hubState.enabledProviders[provider.id]);
              return (
                <article
                  key={provider.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {provider.baseDomain} · CORS Search Live
                        </p>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {provider.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHubState(setProviderEnabled(provider.id, !enabled))}
                        aria-pressed={enabled}
                        className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                          enabled
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {provider.description}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-300">Types: </strong>
                      {provider.supportedTypes.map((t) => RESOURCE_TYPE_LABELS[t]).join(' · ')}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong className="text-slate-800 dark:text-slate-200">Browser Import Behavior: </strong>
                      {provider.directBrowserPdfImportNote}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>No API key required</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('discover');
                        setSelectedSourceFilter(provider.id);
                        const sample = provider.id === 'pubchem' ? 'Aspirin' : 'Nephron';
                        setQuery(sample);
                        void executeDiscoverSearch(sample, { source: provider.id });
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Query {provider.shortName}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= TAB 4: SAVED & IMPORTED ======================= */}
      {activeTab === 'saved' && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Saved References &amp; Imported Resources
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Manage citations, imported PDFs, visual plates, and attached B.Pharm curriculum contexts.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                {hubState.savedRecords.length} tracked · {books.length} local PDFs · {visuals.length} visuals
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                placeholder="Search saved titles, sources, or linked structures..."
                className="min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
              <select
                aria-label="Filter saved status"
                value={savedStatusFilter}
                onChange={(e) => setSavedStatusFilter(e.target.value as 'all' | ImportStatus)}
                className="min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="imported">Imported in PharmaLab</option>
                <option value="saved_reference">Saved References</option>
                <option value="unavailable">Direct Fetch Restricted</option>
                <option value="failed">Import Failed</option>
              </select>
              <select
                aria-label="Filter saved resource type"
                value={savedTypeFilter}
                onChange={(e) => setSavedTypeFilter(e.target.value as 'all' | ResourceType)}
                className="min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="all">All Resource Types</option>
                {ALL_RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RESOURCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {filteredSavedRecords.length === 0 ? (
            <div className="py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <Bookmark className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {hubState.savedRecords.length === 0
                  ? 'No saved or imported scientific resources yet'
                  : 'No saved items match your current filter'}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Use Discover or Visual Discovery to find textbooks, articles, or illustrations, then save citations or import them locally.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Go to Discover</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSavedRecords.map((rec) => {
                const statusMeta = IMPORT_STATUS_META[rec.status] || IMPORT_STATUS_META.saved_reference;
                const StatusIcon = statusMeta.icon;
                const safeUrl = sanitizeHttpUrl(rec.resource.sourceUrl);
                const linkedBook = rec.linkedBookId
                  ? books.find((b) => b.id === rec.linkedBookId)
                  : undefined;
                const linkedVisual = rec.linkedVisualId
                  ? visuals.find((v) => v.id === rec.linkedVisualId)
                  : undefined;

                return (
                  <article
                    key={rec.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <p className="font-semibold text-slate-600 dark:text-slate-400">
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {rec.resource.providerName}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{RESOURCE_TYPE_LABELS[rec.resource.resourceType]}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{rec.resource.publicationDate}</span>
                      </p>

                      <span className={`inline-flex items-center gap-1 font-semibold ${statusMeta.toneClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {rec.resource.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatAuthorsLine(rec.resource.authors)} · {rec.resource.journalOrPublisher}
                    </p>

                    {rec.importNote && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                        Note: {rec.importNote}
                      </p>
                    )}

                    {rec.lastError && (
                      <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                        {rec.lastError}
                      </p>
                    )}

                    {/* Attached Academic Contexts */}
                    {(rec.linkedContexts.length > 0 || rec.linkedTopics.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Linked Topics:
                        </span>
                        {rec.linkedContexts.map((ctx) => (
                          <button
                            key={ctx.id}
                            type="button"
                            onClick={() => {
                              if (ctx.structureId) {
                                navigateToModule('anatomy', 'explorer', { structureId: ctx.structureId });
                              } else if (ctx.moduleId) {
                                navigateToModule(ctx.moduleId, ctx.tab || null);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold hover:underline"
                          >
                            {ctx.label}
                          </button>
                        ))}
                        {rec.linkedTopics
                          .filter((t) => !rec.linkedContexts.some((c) => c.label === t))
                          .map((t) => (
                            <span
                              key={t}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        {linkedBook && (
                          <button
                            type="button"
                            onClick={() => openKnowledgeLibrary({ bookId: linkedBook.id })}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <Library className="w-3.5 h-3.5" />
                            <span>Read in PDF Library</span>
                          </button>
                        )}
                        {linkedVisual && (
                          <button
                            type="button"
                            onClick={() => openVisualLibrary({ visualId: linkedVisual.id })}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <Images className="w-3.5 h-3.5" />
                            <span>Inspect in Visual Library</span>
                          </button>
                        )}
                        {safeUrl && (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Original Source</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setImportTarget(rec.resource)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Edit Links / Import</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {(linkedBook || linkedVisual) && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteSavedRecord(rec, true)}
                            className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Asset</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDeleteSavedRecord(rec, false)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Entry</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Visual Preview-Before-Import Modal */}
      {visualPreviewItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Visual preview before import"
          onClick={() => setVisualPreviewItem(null)}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {visualPreviewItem.providerName} · {visualPreviewItem.license}
                </p>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {visualPreviewItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVisualPreviewItem(null)}
                className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close visual preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 max-h-[55vh] flex items-center justify-center p-4 border-b border-slate-200 dark:border-slate-800">
              <img
                src={visualPreviewItem.imageUrl || visualPreviewItem.previewUrl}
                alt={visualPreviewItem.title}
                className="max-h-[48vh] max-w-full object-contain"
              />
            </div>

            <div className="p-5 space-y-3 text-xs sm:text-sm">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {visualPreviewItem.summary}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Attribution: {visualPreviewItem.attribution || formatAuthorsLine(visualPreviewItem.authors)}
                {visualPreviewItem.width && visualPreviewItem.height
                  ? ` · ${visualPreviewItem.width}×${visualPreviewItem.height} px`
                  : ''}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                {sanitizeHttpUrl(visualPreviewItem.sourceUrl) && (
                  <a
                    href={sanitizeHttpUrl(visualPreviewItem.sourceUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Source Page</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const target = visualPreviewItem;
                    setVisualPreviewItem(null);
                    setImportTarget(target);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Review &amp; Import to Visual Library</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Review Modal */}
      {importTarget && (
        <ResourceImportModal
          item={importTarget}
          initialContexts={activeContext ? [activeContext] : []}
          existingBooks={books}
          existingVisuals={visuals}
          savedRecords={hubState.savedRecords}
          onClose={() => setImportTarget(null)}
          onOpenExistingBook={(bookId) => {
            setImportTarget(null);
            openKnowledgeLibrary({ bookId });
          }}
          onOpenExistingVisual={(visualId) => {
            setImportTarget(null);
            openVisualLibrary({ visualId });
          }}
          onCompleted={async (res) => {
            setImportTarget(null);
            setToastNotice(res.message);
            await refreshLocalLibraries();
          }}
        />
      )}
    </div>
  );
}
