import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Clock,
  ExternalLink,
  FlaskConical,
  GitCompare,
  GraduationCap,
  Layers,
  Lock,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  X
} from 'lucide-react';
import { LibraryBookMeta } from '../knowledge-library/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import {
  ANALYTICAL_TEST_FACETS,
  PHARMACOPOEIA_DIRECTORY,
  STANDARD_CATEGORY_FACETS
} from './pharmacopoeiaCatalog';
import {
  ACCESS_TYPE_LABELS,
  CLASSIFICATION_LABELS,
  DEPARTMENT_LABELS,
  PharmacopoeiaClassification,
  PharmacopoeiaDepartmentKey,
  PharmacopoeiaDirectoryEntry,
  PharmacopoeiaUserStore,
  PharmacopoeiaWorkspaceTab
} from './types';

interface PharmacopoeiaDashboardProps {
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  onNavigateTab: (tab: PharmacopoeiaWorkspaceTab) => void;
  onSelectEntry: (entryId: string) => void;
  onQuickSearch: (query: string, department?: PharmacopoeiaDepartmentKey | 'all') => void;
  onToggleBookmark?: (entryId: string) => Promise<void> | void;
  onAddToCompare?: (entryId: string) => void;
}

const MAJOR_QUICK_ACCESS_IDS = [
  'pc_ip',
  'pc_bp',
  'pc_usp_nf',
  'pc_ph_eur',
  'pc_who_int',
  'pc_jp',
  'pc_chp'
];

export default function PharmacopoeiaDashboard({
  userStore,
  books,
  onNavigateTab,
  onSelectEntry,
  onQuickSearch,
  onToggleBookmark,
  onAddToCompare
}: PharmacopoeiaDashboardProps) {
  const [searchInput, setSearchInput] = useState('');
  const [directoryScope, setDirectoryScope] = useState<PharmacopoeiaClassification | 'all'>('all');

  const pharmacopoeiaCount = PHARMACOPOEIA_DIRECTORY.filter((e) => e.isPharmacopoeia).length;
  const publicPortalCount = PHARMACOPOEIA_DIRECTORY.filter(
    (e) => e.contentAccessType === 'public'
  ).length;
  const bookmarkedCount = userStore.bookmarkedIds.length;

  const recentEntries = userStore.recentlyAccessed
    .map((r) => PHARMACOPOEIA_DIRECTORY.find((e) => e.id === r.entryId))
    .filter((e): e is PharmacopoeiaDirectoryEntry => Boolean(e));

  const majorQuickEntries = useMemo(
    () =>
      MAJOR_QUICK_ACCESS_IDS.map((id) =>
        PHARMACOPOEIA_DIRECTORY.find((entry) => entry.id === id)
      ).filter((entry): entry is PharmacopoeiaDirectoryEntry => Boolean(entry)),
    []
  );

  const filteredDirectoryEntries = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return PHARMACOPOEIA_DIRECTORY.filter((entry) => {
      if (directoryScope !== 'all' && entry.classification !== directoryScope) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        entry.abbreviation,
        entry.fullName,
        entry.countryOrRegion,
        entry.issuingOrganization,
        entry.description,
        entry.scope,
        entry.searchableKeywords.join(' '),
        entry.relevantDepartments.map((d) => DEPARTMENT_LABELS[d]).join(' ')
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [searchInput, directoryScope]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(searchInput.trim() || 'Paracetamol');
  };

  return (
    <div className="space-y-6">
      {/* Unified Search Bar & Major Pharmacopoeia Quick-Access Controls */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Pharmacopoeia Reference Center
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
              Authoritative Compendia, Official Portals &amp; Academic Standards
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Filter the pharmacopoeia directory below, jump directly to major compendia (IP, BP, USP–NF, Ph. Eur., WHO Ph. Int., JP, ChP), or run unified search across local PDFs and official portals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('directory')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Scale className="w-4 h-4 shrink-0" />
              <span>Full Directory</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('compare')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Compare Compendia</span>
            </button>
          </div>
        </div>

        {/* Integrated Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search pharmacopoeias, monographs, analytical tests, or subjects"
              placeholder="Filter directory or search drugs, monographs, analytical tests, impurities, or reagents..."
              className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            Unified Search
          </button>
        </form>

        {/* Quick-Access Buttons for Major Pharmacopoeias */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Quick Access to Major Pharmacopoeias
            </p>
            <button
              type="button"
              onClick={() => onSelectEntry('pc_martindale')}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
            >
              Martindale (Drug Reference Book) →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {majorQuickEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectEntry(entry.id)}
                className="min-h-[54px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-left transition-colors group"
              >
                <span className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 whitespace-nowrap">
                  {entry.abbreviation}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {entry.countryOrRegion.split('(')[0].trim()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {[
          {
            label: 'Statutory Pharmacopoeias',
            value: `${pharmacopoeiaCount}`,
            sub: '4 Primary · 3 International',
            tab: 'directory' as PharmacopoeiaWorkspaceTab
          },
          {
            label: 'Public Official Portals',
            value: `${publicPortalCount}`,
            sub: 'WHO Ph. Int. & PMDA JP',
            tab: 'official_sources' as PharmacopoeiaWorkspaceTab
          },
          {
            label: 'Local PDFs Indexed',
            value: `${books.length}`,
            sub: 'Searchable via Unified Search',
            tab: 'search' as PharmacopoeiaWorkspaceTab
          },
          {
            label: 'Saved Bookmarks',
            value: `${bookmarkedCount}`,
            sub: `${userStore.collections.length} study collections`,
            tab: 'bookmarks' as PharmacopoeiaWorkspaceTab
          }
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => onNavigateTab(stat.tab)}
            className="p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.sub}</p>
          </button>
        ))}
      </section>

      {/* Integrated Directory List */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Pharmacopoeia &amp; Standards Directory List
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                {filteredDirectoryEntries.length}
              </span>{' '}
              of <span className="tabular-nums">{PHARMACOPOEIA_DIRECTORY.length}</span> official compendia and clinical drug references.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter directory list by classification"
            className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl max-w-full"
          >
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'primary_pharmacopoeia' as const, label: 'Primary' },
              { id: 'international_pharmacopoeia' as const, label: 'International' },
              { id: 'reference_book' as const, label: 'Reference Books' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDirectoryScope(tab.id)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  directoryScope === tab.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredDirectoryEntries.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No directory entries matched &ldquo;{searchInput}&rdquo;.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDirectoryScope('all');
                }}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Reset Directory Filter
              </button>
              {searchInput.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => onQuickSearch(searchInput.trim())}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Search PDFs &amp; Official Portals for &ldquo;{searchInput.trim()}&rdquo;
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredDirectoryEntries.map((entry) => {
              const safeUrl = sanitizeHttpUrl(entry.officialWebsite);
              const isBookmarked = userStore.bookmarkedIds.includes(entry.id);
              const isPublic = entry.contentAccessType === 'public';
              const isRestricted = entry.contentAccessType === 'restricted';
              const AccessIcon = isPublic ? ShieldCheck : isRestricted ? ShieldAlert : Lock;
              const accessTone = isPublic
                ? 'text-emerald-700 dark:text-emerald-400'
                : isRestricted
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-amber-700 dark:text-amber-400';

              return (
                <article
                  key={entry.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-950/60 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {entry.abbreviation}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{CLASSIFICATION_LABELS[entry.classification]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.countryOrRegion}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`inline-flex items-center gap-1 font-medium ${accessTone}`}>
                        <AccessIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{ACCESS_TYPE_LABELS[entry.contentAccessType]}</span>
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() => onSelectEntry(entry.id)}
                      className="text-left group block"
                    >
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {entry.fullName}
                      </h4>
                    </button>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {entry.issuingOrganization} — {entry.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectEntry(entry.id)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {safeUrl && (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {onAddToCompare && (
                      <button
                        type="button"
                        onClick={() => onAddToCompare(entry.id)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                        aria-label={`Compare ${entry.abbreviation}`}
                      >
                        <GitCompare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Compare</span>
                      </button>
                    )}

                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={() => onToggleBookmark(entry.id)}
                        className={`min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg border transition-colors ${
                          isBookmarked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600'
                        }`}
                        aria-label={
                          isBookmarked
                            ? `Remove bookmark for ${entry.abbreviation}`
                            : `Bookmark ${entry.abbreviation}`
                        }
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Recently Accessed & Subject / Test / Standard Quick Browsing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recently Accessed</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('bookmarks')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Bookmarks &amp; Collections
            </button>
          </div>

          {recentEntries.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              References you open from Quick Access or the Directory List will appear here for one-tap return.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {recentEntries.slice(0, 4).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectEntry(entry.id)}
                  className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {entry.fullName} ({entry.abbreviation})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {entry.issuingOrganization}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Browse by Pharmaceutical Subject</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('editions')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Syllabus Links
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {(Object.keys(DEPARTMENT_LABELS) as PharmacopoeiaDepartmentKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onQuickSearch('', key)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
              >
                <span className="truncate">{DEPARTMENT_LABELS[key]}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Analytical Tests & Specification Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Browse by Analytical Test</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ANALYTICAL_TEST_FACETS.slice(0, 6).map((facet) => (
              <button
                key={facet.id}
                type="button"
                onClick={() => onQuickSearch(facet.recommendedSearchQuery)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
              >
                <span className="truncate">{facet.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Browse by Specification Category</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {STANDARD_CATEGORY_FACETS.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onQuickSearch(cat.recommendedSearchQuery)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
              >
                <span className="truncate">{cat.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Martindale Distinction Notice */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">
              Martindale: The Complete Drug Reference (Non-Pharmacopoeia Reference Book)
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Included in its own reference-book classification for clinical drug monographs and global brand/formulation context — strictly separated from statutory quality-control pharmacopoeias.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectEntry('pc_martindale')}
          className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
        >
          Inspect Martindale Entry
        </button>
      </section>
    </div>
  );
}
