import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  ExternalLink,
  FileText,
  FlaskConical,
  GitCompare,
  GraduationCap,
  Microscope,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { LibraryBookMeta } from '../knowledge-library/types';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import {
  computePharmacopoeiaAvailability,
  runUnifiedKnowledgeSearch
} from './knowledgeIndex';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import {
  KNOWLEDGE_KIND_LABELS,
  PharmacopoeiaUserStore,
  PharmacopoeiaWorkspaceTab,
  UnifiedKnowledgeSearchResponse
} from './types';

interface PharmacopoeiaDashboardProps {
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
  onNavigateTab: (tab: PharmacopoeiaWorkspaceTab) => void;
  onSelectEntry: (entryId: string) => void;
  onSelectSubstance: (substanceId: string) => void;
  onSelectAnalyticalTest: (testId: string) => void;
  onQuickSearch: (query: string) => void;
  onRecordSearch: (query: string) => void;
}

const SUGGESTED_SEARCHES = [
  'Paracetamol',
  'Aspirin',
  'Ferrous Sulphate',
  'Bentonite',
  'Arsenic Limit Test',
  'Dissolution',
  'Cerimetry',
  'EDTA',
  'ORS',
  'Sterility'
];

export default function PharmacopoeiaDashboard({
  userStore,
  books,
  referenceItems,
  referenceProfiles,
  onNavigateTab,
  onSelectEntry,
  onSelectSubstance,
  onSelectAnalyticalTest,
  onQuickSearch,
  onRecordSearch
}: PharmacopoeiaDashboardProps) {
  const { openKnowledgeLibrary, openStudyMode, openReferenceCenter, openInteractiveExperiments, navigateToModule } =
    useLibraryNavigation();

  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState<UnifiedKnowledgeSearchResponse | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      runUnifiedKnowledgeSearch({
        query,
        books,
        referenceItems,
        referenceProfiles,
        userStore
      })
        .then((res) => {
          if (!cancelled) {
            setSearchData(res);
            setSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchData(null);
            setSearching(false);
          }
        });
    }, 90);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, books, referenceItems, referenceProfiles, userStore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      onRecordSearch(trimmed);
      onQuickSearch(trimmed);
    }
  };

  const applySuggestion = (term: string) => {
    setQuery(term);
    onRecordSearch(term);
  };

  const hasActiveQuery = query.trim().length >= 2;
  const substances = searchData?.substances || [];
  const pdfHits = searchData?.textbookPdfHits || [];
  const seededTextbooks = searchData?.seededTextbooks || [];
  const analyticalTests = searchData?.analyticalTests || [];
  const academicTopics = searchData?.academicTopics || [];

  return (
    <div className="space-y-6">
      {/* Knowledge-First Unified Search Workspace */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Pharmaceutical Knowledge Workspace
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
              Search Drugs, Analytical Tests, Textbooks &amp; Pharmacopoeial Standards
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Retrieves PharmaLab substance workspaces, practical analytical guides, exact imported textbook PDF pages, Study Mode topics, and official compendial access status — fully offline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openStudyMode({})}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Study Mode</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('analytical_lab')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Microscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Analytical Learning</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('compare')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Compare IP/BP/USP/Ph. Eur.</span>
            </button>
          </div>
        </div>

        {/* Central Search Input */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search drugs, APIs, excipients, dosage forms, assays, impurities, or pharmacopoeias"
              placeholder="Search drug (Paracetamol, Aspirin), chemical (FeSO₄, NH₄Cl), excipient (Bentonite), assay, or impurity..."
              className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="min-h-[46px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            Full Search View
          </button>
        </form>

        {/* Search Suggestions & Recent Searches */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
              Try searching:
            </span>
            {SUGGESTED_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => applySuggestion(term)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                  query.toLowerCase() === term.toLowerCase()
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          {userStore.recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 mr-1">
                <Clock className="w-3 h-3" />
                <span>Recent:</span>
              </span>
              {userStore.recentSearches.slice(0, 6).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Graceful Zero-Hit State (No Fabricated Drug Records) */}
      {hasActiveQuery && !searching && searchData && searchData.totalHits === 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No local PharmaLab knowledge or imported PDF hits for &ldquo;{query.trim()}&rdquo;
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            PharmaLab never fabricates monograph specifications or placeholder drug cards. You can import a textbook PDF in the PDF Knowledge Library, browse educational analytical principles (titrimetry, limit tests, dissolution), or check official pharmacopoeial portals below.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => openKnowledgeLibrary({ searchQuery: query.trim() })}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              Open PDF Knowledge Library
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('analytical_lab')}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              Browse Analytical Learning Guides
            </button>
            <button
              type="button"
              onClick={() => onQuickSearch(query.trim())}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              View Official Compendial Portals
            </button>
          </div>
        </section>
      )}

      {/* 1. SUBSTANCE, DRUG, EXCIPIENT & DOSAGE FORM KNOWLEDGE */}
      {(substances.length > 0 || !hasActiveQuery) && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {hasActiveQuery
                  ? `Drug, Substance & Preparation Matches (${substances.length})`
                  : 'Drug, Excipient, Dosage Form & QC Knowledge Workspaces'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grounded in PharmaLab B.Pharm curriculum, practical compounding, volumetric assays, and apparatus modules.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {substances.length} topic(s)
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {substances.map((sub) => (
              <article
                key={sub.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-950/50 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {KNOWLEDGE_KIND_LABELS[sub.kind]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{sub.categoryLabel}</span>
                    {sub.chemicalInfo?.formula && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                          {sub.chemicalInfo.formula}
                        </span>
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasActiveQuery) onRecordSearch(query);
                      onSelectSubstance(sub.id);
                    }}
                    className="text-left group block"
                  >
                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sub.name}
                    </h4>
                  </button>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {sub.overview}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasActiveQuery) onRecordSearch(query);
                      onSelectSubstance(sub.id);
                    }}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {sub.labConnections[0] && (
                    <button
                      type="button"
                      onClick={() => {
                        const conn = sub.labConnections[0];
                        if (conn.kind === 'experiment' && conn.experimentId) {
                          openInteractiveExperiments({ experimentId: conn.experimentId, stage: 'simulate' });
                        } else if (conn.kind === 'module' && conn.moduleId) {
                          navigateToModule(conn.moduleId, conn.tab || null);
                        }
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                    >
                      {sub.labConnections[0].label}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 2. TEXTBOOK-FIRST RETRIEVAL & ANALYTICAL TESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Textbook & Imported PDF Evidence */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Textbook-First Matches</span>
            </h3>
            <button
              type="button"
              onClick={() => openKnowledgeLibrary({ searchQuery: query.trim() || undefined })}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              PDF Library
            </button>
          </div>

          {pdfHits.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {pdfHits.slice(0, 4).map((hit) => (
                <div
                  key={hit.id}
                  className="p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {hit.bookTitle} ·{' '}
                      <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                        Page {hit.pageNumber}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      {hit.snippet}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openKnowledgeLibrary({
                        bookId: hit.bookId,
                        pageNumber: hit.pageNumber,
                        searchQuery: query.trim() || undefined
                      })
                    }
                    className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Open Page</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {books.length === 0
                ? 'No local textbook PDFs imported yet. Standard curriculum textbooks and handbooks matched below can also be inspected in the Reference Center.'
                : `No exact local PDF page hits for "${query.trim()}" across your ${books.length} imported book(s). Relevant curriculum references shown below.`}
            </p>
          )}

          {seededTextbooks.length > 0 && (
            <div className="space-y-2">
              {seededTextbooks.slice(0, 3).map((tb) => (
                <div
                  key={tb.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                      {tb.subject} · {tb.accessLabel}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tb.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openReferenceCenter({ referenceId: tb.id })}
                    className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Analytical Tests & Practical Learning */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Analytical Tests &amp; Virtual Experiments</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('analytical_lab')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              All Analytical Guides
            </button>
          </div>

          <div className="space-y-2">
            {analyticalTests.slice(0, 4).map((test) => (
              <div
                key={test.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {test.testName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {test.whatItMeasures}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAnalyticalTest(test.id)}
                  className="min-h-[32px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Study Test
                </button>
              </div>
            ))}
          </div>

          {academicTopics.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Related Syllabus &amp; Academic Topics
              </p>
              {academicTopics.slice(0, 2).map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {topic.subjectCode} · {topic.topicTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openStudyMode({
                        syllabusId: topic.syllabusId,
                        subjectCode: topic.subjectCode.split('/')[0].trim()
                      })
                    }
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline whitespace-nowrap shrink-0"
                  >
                    Open in Study Mode →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 3. SECONDARY PHARMACOPOEIA ACCESS & DIRECTORY STRIP */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Available Pharmacopoeial References &amp; Access Status</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compendia directory with truthful local vs public vs subscription availability — Martindale kept strictly separate as a clinical drug reference book.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('directory')}
            className="min-h-[34px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
          >
            Open Full Compendia Directory
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PHARMACOPOEIA_DIRECTORY.map((entry) => {
            const avail = computePharmacopoeiaAvailability({
              entry,
              books,
              referenceItems,
              referenceProfiles
            });
            const isAccessible =
              avail.status === 'imported_user_pdf' ||
              avail.status === 'publicly_accessible' ||
              avail.status === 'official_locally_available';
            const safeUrl = sanitizeHttpUrl(entry.officialWebsite);

            return (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectEntry(entry.id)}
                      className="text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline text-left"
                    >
                      {entry.abbreviation}
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {entry.isPharmacopoeia ? entry.countryOrRegion.split('(')[0].trim() : 'Ref. Book'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {entry.fullName}
                  </p>
                  <p
                    className={`text-xs inline-flex items-center gap-1 font-medium ${
                      isAccessible
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {isAccessible ? (
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{avail.label}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectEntry(entry.id)}
                    className="font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600"
                  >
                    Details →
                  </button>
                  {safeUrl && (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
