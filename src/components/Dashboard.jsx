import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Beaker,
  BookOpen,
  Box,
  Clock,
  Code,
  Compass,
  FilePenLine,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Images,
  Library,
  MapPin,
  MessageSquareHeart,
  Microscope,
  Play,
  Scale,
  Search,
  Terminal,
  TestTube,
  Wrench,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../context/LibraryNavigationContext';
import { getAllBooks, searchAllBooks } from '../modules/knowledge-library/libraryDb';
import { getLastStudiedTopicSummary } from '../modules/study-mode/studyDb';
import { getAllVisuals } from '../modules/visual-library/visualDb';
import { CORE_DEPARTMENT_CARDS, DEPARTMENT_WORKSPACES } from '../types/academicArchitecture';
import { searchAcademicEngine } from '../utils/academicEngineUtils';
import { formatRelativeTime } from '../utils/studyWorkspace';
import { QUICK_INDEX } from './CommandPalette';

const MODULE_ICONS = {
  anatomy: { icon: Activity, accent: 'text-amber-600 dark:text-amber-400' },
  inorganic: { icon: TestTube, accent: 'text-cyan-700 dark:text-cyan-400' },
  general_pharmacy: { icon: FlaskConical, accent: 'text-emerald-600 dark:text-emerald-400' },
  pharmacognosy: { icon: Microscope, accent: 'text-purple-700 dark:text-purple-400' },
  psychology: { icon: MessageSquareHeart, accent: 'text-rose-600 dark:text-rose-400' },
  python: { icon: Code, accent: 'text-blue-600 dark:text-blue-400' }
};

export default function Dashboard({
  onSelectModule,
  onOpenPalette,
  onOpenGlossary,
  onOpenRecent,
  recentActivity = [],
  visitedModules = [],
  lastModule = 'anatomy'
}) {
  const {
    openKnowledgeLibrary,
    openVisualLibrary,
    openResourceHub,
    openReferenceCenter,
    openStudyMode,
    openAsset3DEngine,
    openAcademicExplorer,
    openInteractiveExperiments,
    openPythonStudio,
    openCoverageAnalyzer,
    openEnrichmentWorkspace
  } = useLibraryNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const lastStudyTopic = useMemo(() => getLastStudiedTopicSummary(), []);

  const [books, setBooks] = useState([]);
  const [visuals, setVisuals] = useState([]);
  const [pdfHits, setPdfHits] = useState([]);

  const departmentsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllBooks(), getAllVisuals()])
      .then(([loadedBooks, loadedVisuals]) => {
        if (cancelled) return;
        setBooks(loadedBooks);
        setVisuals(loadedVisuals);
      })
      .catch(() => {
        // ignore storage loading failures
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();
    if (q.length < 2 || books.every((b) => !b.hasSearchableText)) {
      setPdfHits([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchAllBooks(q, undefined, 2)
        .then((res) => {
          if (!cancelled) setPdfHits(res.slice(0, 3));
        })
        .catch(() => {
          if (!cancelled) setPdfHits([]);
        });
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, books]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CORE_DEPARTMENT_CARDS.filter((mod) => {
      const matchesCat = categoryFilter === 'all' || mod.category === categoryFilter;
      const matchesQuery =
        !q ||
        mod.title.toLowerCase().includes(q) ||
        mod.code.toLowerCase().includes(q) ||
        mod.overview.toLowerCase().includes(q) ||
        mod.topics.some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.keyConcepts.some((k) => k.toLowerCase().includes(q))
        );
      return matchesCat && matchesQuery;
    });
  }, [categoryFilter, searchQuery]);

  const directHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return QUICK_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.cat.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [searchQuery]);

  const engineHits = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return null;
    return searchAcademicEngine(q, { visuals, books });
  }, [searchQuery, visuals, books]);

  // Real Continue Learning book candidate (last opened or furthest along)
  const continueBook = useMemo(() => {
    if (books.length === 0) return null;
    const sorted = [...books].sort(
      (a, b) => (b.lastOpenedAt || b.uploadedAt || 0) - (a.lastOpenedAt || a.uploadedAt || 0)
    );
    return sorted[0];
  }, [books]);

  const totalIndexedPages = useMemo(
    () => books.reduce((sum, b) => sum + (b.pageCount || 0), 0),
    [books]
  );

  const lastMeta = DEPARTMENT_WORKSPACES[lastModule] || DEPARTMENT_WORKSPACES.anatomy;
  const recentItems = recentActivity.slice(0, 4);

  const scrollToDepartments = () => {
    departmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Workspace Header & Instant Omni-Search */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-sm dark:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              PCI B.Pharm Semester I · Academic Learning Workspace
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
              Study Bench, Practicals &amp; Reference Libraries
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Resume active departments, search textbooks and anatomical structures, or jump straight to interactive experiments and laboratory equipment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectModule(lastMeta.id)}
              className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume {lastMeta.code.split(' ')[0]}</span>
            </button>
            <button
              type="button"
              onClick={onOpenPalette}
              className="min-h-[44px] px-4 py-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Quick Index (⌘K)</span>
            </button>
          </div>
        </div>

        {/* Workspace Omni-Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments, experiments, structures ('glomerulus'), equipment, or uploaded PDFs..."
            className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {(directHits.length > 0 ||
            (engineHits &&
              (engineHits.structures.length > 0 ||
                engineHits.topics.length > 0 ||
                engineHits.subtopics.length > 0 ||
                engineHits.visuals.length > 0 ||
                engineHits.structurePins.length > 0)) ||
            pdfHits.length > 0) && (
            <div className="mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden shadow-lg">
              {engineHits?.structures.slice(0, 4).map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() =>
                    onSelectModule('anatomy', 'explorer', { structureId: hit.payload.id })
                  }
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {hit.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {hit.typeLabel} · {hit.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}

              {engineHits?.visuals.slice(0, 2).map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => openVisualLibrary({ visualId: hit.payload.id })}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Images className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {hit.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {hit.typeLabel} · {hit.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}

              {engineHits?.structurePins.slice(0, 2).map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() =>
                    openVisualLibrary({
                      visualId: hit.payload.visual.id,
                      annotationId: hit.payload.annotation.id
                    })
                  }
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {hit.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {hit.typeLabel} · {hit.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}

              {directHits.slice(0, 3).map((hit) => (
                <button
                  key={`${hit.module}-${hit.title}`}
                  type="button"
                  onClick={() =>
                    hit.experimentSimId
                      ? openInteractiveExperiments({ experimentId: hit.experimentSimId })
                      : hit.interactiveSims
                      ? openInteractiveExperiments()
                      : hit.referenceSection
                      ? openReferenceCenter({ section: hit.referenceSection })
                      : hit.visualId
                      ? openVisualLibrary({ visualId: hit.visualId })
                      : hit.category
                      ? openVisualLibrary({ category: hit.category })
                      : onSelectModule(hit.module, hit.tab)
                  }
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                      {hit.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {hit.cat} · {hit.sub}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}

              {pdfHits.map(({ book, matches }) => {
                const top = matches[0];
                return (
                  <button
                    key={`${book.id}_${top.pageNumber}`}
                    type="button"
                    onClick={() =>
                      openKnowledgeLibrary({
                        bookId: book.id,
                        pageNumber: top.pageNumber,
                        searchQuery
                      })
                    }
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {book.title} · Page {top.pageNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {top.beforeContext}
                          {top.matchedText}
                          {top.afterContext}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}

              {searchQuery.trim().length >= 2 && (
                <button
                  type="button"
                  onClick={() => openResourceHub({ query: searchQuery.trim() })}
                  className="w-full text-left px-4 py-3 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                        Search Scientific Resource Hub for &ldquo;{searchQuery.trim()}&rdquo;
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Query PubMed, Europe PMC, PMC, NCBI Bookshelf, OpenStax &amp; Wikimedia
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Continue Learning & Recently Accessed (100% Real Local Data Only) */}
      <section aria-label="Continue learning and recently accessed" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Continue Learning (Textbook + Last Active Lab) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Continue Learning
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saved locally
            </span>
          </div>

          <div className="space-y-3">
            {lastStudyTopic && (
              <button
                type="button"
                onClick={() =>
                  openStudyMode({
                    syllabusId: lastStudyTopic.syllabusId,
                    subjectCode: lastStudyTopic.subjectCode,
                    topicId: lastStudyTopic.topicId
                  })
                }
                className="w-full p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center justify-between gap-3 text-left transition-colors group"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Resume Study Mode · {lastStudyTopic.subjectCode || 'Syllabus'} ·{' '}
                    {lastStudyTopic.readingProgressPct}% read
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                    {lastStudyTopic.topicTitle}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
              </button>
            )}

            {/* Active Lab Module */}
            <button
              type="button"
              onClick={() => onSelectModule(lastMeta.id)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 text-left transition-colors group"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Last Opened Department · {lastMeta.code}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                  {lastMeta.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {lastMeta.practicalCountLabel}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </button>

            {/* Real PDF Book Progress if uploaded */}
            {continueBook ? (
              <button
                type="button"
                onClick={() =>
                  openKnowledgeLibrary({
                    bookId: continueBook.id,
                    pageNumber: continueBook.lastReadPage || 1
                  })
                }
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 text-left transition-colors group"
              >
                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Resume PDF Textbook</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                    {continueBook.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Page {continueBook.lastReadPage || 1} of {continueBook.pageCount} (
                    {Math.round(
                      ((continueBook.lastReadPage || 1) / Math.max(1, continueBook.pageCount)) * 100
                    )}
                    %)
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openKnowledgeLibrary()}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 flex items-center justify-between gap-3 text-left transition-colors group"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Add a Textbook or Lab Manual PDF
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Store PDFs locally for page-level search, highlights, and diagram capture.
                  </p>
                </div>
                <Library className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Recently Accessed */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recently Accessed</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {recentItems.length > 0 ? `${recentItems.length} recent` : 'Session log'}
            </span>
          </div>

          {recentItems.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {recentItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onOpenRecent(item)}
                  className="w-full min-h-[46px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Topics, interactive visual plates, equipment pages, and PDF chapters you open will appear here for one-tap return.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openVisualLibrary({ visualId: 'builtin_nephron_anatomy' })}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  Inspect Nephron Plate
                </button>
                <button
                  type="button"
                  onClick={() => onSelectModule('inorganic', 'titration')}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Open Volumetric Burette
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Real Learning Overview Strip */}
      <section
        aria-label="Real workspace overview"
        className="grid grid-cols-2 lg:grid-cols-4 border-y border-slate-200 dark:border-slate-800 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800"
      >
        {[
          {
            label: 'Semester I Subjects',
            value: '6 Departments',
            sub: 'BP101T to BP106T aligned'
          },
          {
            label: 'Workspaces Explored',
            value: `${visitedModules.length} / 7`,
            sub: 'Across labs & Python/Pandas'
          },
          {
            label: 'Saved PDF Textbooks',
            value: `${books.length}`,
            sub:
              books.length > 0
                ? `${totalIndexedPages.toLocaleString()} pages in IndexedDB`
                : 'Ready for local PDF upload'
          },
          {
            label: 'Scientific Visuals',
            value: `${visuals.length} Plates`,
            sub: 'Interactive pins & apparatus'
          }
        ].map((stat) => (
          <div key={stat.label} className="py-4 px-4 first:pl-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Dedicated Workspace Tools & Libraries Launcher */}
      <section aria-label="Workspace tools and reference libraries" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Tools, Studios &amp; Reference Libraries
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Quickly launch specialized study engines, scientific libraries, and interactive simulators.
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToDepartments}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Browse Departments</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            {
              label: 'Study Mode',
              sub: 'Syllabus & Exam Prep',
              icon: GraduationCap,
              action: () => openStudyMode()
            },
            {
              label: 'Anatomy Explorer',
              sub: '60 Validated Structures',
              icon: Activity,
              action: () => onSelectModule('anatomy', 'explorer')
            },
            {
              label: 'Python Studio',
              sub: 'Full-Screen IDE & Plots',
              icon: Terminal,
              action: () => openPythonStudio()
            },
            {
              label: 'Resource Hub',
              sub: 'Open-Access Research',
              icon: Globe,
              action: () => openResourceHub()
            },
            {
              label: 'PDF Library',
              sub: `${books.length} Local Books`,
              icon: Library,
              action: () => openKnowledgeLibrary()
            },
            {
              label: 'Visual Library',
              sub: `${visuals.length} Annotated Plates`,
              icon: Images,
              action: () => openVisualLibrary()
            },
            {
              label: '3D Asset Engine',
              sub: '3D Library & Discovery',
              icon: Box,
              action: () => openAsset3DEngine()
            },
            {
              label: '3D Explorer',
              sub: 'Interactive Scientific Workbench',
              icon: Compass,
              action: () => openAcademicExplorer()
            },
            {
              label: 'Interactive Sims',
              sub: '6 Scientific Simulators',
              icon: Beaker,
              action: () => openInteractiveExperiments()
            },
            {
              label: 'Reference Center',
              sub: 'Pharmacopoeias & Books',
              icon: Scale,
              action: () => openReferenceCenter({ section: 'overview' })
            },
            {
              label: 'Equipment',
              sub: 'Apparatus & Glassware',
              icon: Wrench,
              action: () => openVisualLibrary({ category: 'equipment' })
            },
            {
              label: 'Official Syllabus',
              sub: 'B.Pharm Sem I PDF',
              icon: FileText,
              action: () => onSelectModule('syllabus')
            },
            {
              label: 'Experiments',
              sub: 'Quick Practical Index',
              icon: FlaskConical,
              action: onOpenPalette
            },
            {
              label: 'Coverage Analyzer',
              sub: 'Syllabus & Gap Audit',
              icon: BarChart3,
              action: () => openCoverageAnalyzer()
            },
            {
              label: 'Content Enrichment',
              sub: 'P4.2.1 Topic Authoring',
              icon: FilePenLine,
              action: () => openEnrichmentWorkspace()
            },
            {
              label: 'Quick Glossary',
              sub: 'Pharmaceutical Terms',
              icon: BookOpen,
              action: onOpenGlossary
            }
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.label}
                type="button"
                onClick={tool.action}
                className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left flex items-center gap-3 transition-colors shadow-sm dark:shadow-none min-w-0"
              >
                <span className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate transition-colors">
                    {tool.label}
                  </span>
                  <span className="block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    {tool.sub}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Semester I Department Directory */}
      <section ref={departmentsRef} className="space-y-5 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Semester I Departments
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Open a subject workspace or jump straight into its practicals, diagrams, or syllabus theory.
            </p>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-full">
            {[
              { id: 'all', label: 'All' },
              { id: 'bio', label: 'Anatomy & Pharmacognosy' },
              { id: 'chem', label: 'Chemistry & Pharmaceutics' },
              { id: 'humanities', label: 'Psychology' },
              { id: 'data', label: 'Python & Data' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === f.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredModules.length > 0 ? (
            filteredModules.map((mod) => {
              const iconCfg = MODULE_ICONS[mod.id] || MODULE_ICONS.python;
              const Icon = iconCfg.icon;
              const explored = visitedModules.includes(mod.id);
              const quickTabs =
                mod.id === 'python'
                  ? [
                      { label: 'Python Studio IDE', moduleId: 'python_studio', tab: null },
                      { label: 'BP101T Units', moduleId: 'python', tab: 'unit1-2' },
                      { label: 'Pandas & PK Plots', moduleId: 'pandas', tab: null }
                    ]
                  : mod.tabs.slice(0, 3).map((t) => ({
                      label: t.label,
                      moduleId: mod.id,
                      tab: t.id
                    }));

              return (
                <article
                  key={mod.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-none transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0 truncate">
                        <span className={`font-semibold ${iconCfg.accent}`}>{mod.code}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{mod.practicalCountLabel}</span>
                      </p>
                      <Icon className={`w-5 h-5 shrink-0 ${iconCfg.accent}`} />
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectModule(mod.id)}
                      className="text-left group block w-full"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {mod.title}
                      </h3>
                    </button>

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {mod.overview}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {quickTabs.map((ql) => (
                        <button
                          key={ql.label}
                          type="button"
                          onClick={() => onSelectModule(ql.moduleId, ql.tab)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
                        >
                          {ql.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectModule(mod.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-sm font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                    >
                      <span>{explored ? 'Continue' : 'Open'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-slate-600 dark:text-slate-400 text-base">
                No department workspaces matched "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
