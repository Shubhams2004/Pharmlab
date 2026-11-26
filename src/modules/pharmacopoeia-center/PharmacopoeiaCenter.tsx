import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CalendarClock,
  ExternalLink,
  GitCompare,
  Globe,
  LayoutDashboard,
  Loader2,
  Microscope,
  Scale,
  Search
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getAllBooks } from '../knowledge-library/libraryDb';
import { LibraryBookMeta } from '../knowledge-library/types';
import { getAllPharmacopoeiaProfiles, getAllReferences } from '../reference-center/referenceDb';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import AnalyticalLearningView from './AnalyticalLearningView';
import { SUBSTANCE_KNOWLEDGE_BASE } from './knowledgeIndex';
import OfficialSourceViewer from './OfficialSourceViewer';
import PharmacopoeiaAcademicLinks from './PharmacopoeiaAcademicLinks';
import PharmacopoeiaBookmarks from './PharmacopoeiaBookmarks';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import PharmacopoeiaComparison from './PharmacopoeiaComparison';
import PharmacopoeiaDashboard from './PharmacopoeiaDashboard';
import {
  DEFAULT_PHARMACOPOEIA_USER_STORE,
  deleteAcademicLinkInStore,
  deleteCollectionInStore,
  deleteCustomLinkInStore,
  deleteEditionRecordInStore,
  loadPharmacopoeiaUserStore,
  recordAccessInStore,
  recordSearchInStore,
  recordSourceCheckInStore,
  savePharmacopoeiaUserStore,
  toggleBookmarkInStore,
  toggleEntryInCollectionStore,
  upsertAcademicLinkInStore,
  upsertCollectionInStore,
  upsertCustomLinkInStore,
  upsertEditionRecordInStore
} from './pharmacopoeiaDb';
import PharmacopoeiaDetail from './PharmacopoeiaDetail';
import PharmacopoeiaDirectory from './PharmacopoeiaDirectory';
import PharmacopoeiaSearch from './PharmacopoeiaSearch';
import SubstanceKnowledgeWorkspace from './SubstanceKnowledgeWorkspace';
import {
  EditionAmendmentRecord,
  PharmacopoeiaAcademicLink,
  PharmacopoeiaCenterJumpTarget,
  PharmacopoeiaDepartmentKey,
  PharmacopoeiaStudyCollection,
  PharmacopoeiaUserStore,
  PharmacopoeiaWorkspaceTab,
  UserSavedLink
} from './types';

interface PharmacopoeiaCenterProps {
  jumpTarget?: PharmacopoeiaCenterJumpTarget;
}

const NAV_TABS: Array<{
  id: PharmacopoeiaWorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Knowledge Workspace', icon: LayoutDashboard },
  { id: 'search', label: 'Unified Search', icon: Search },
  { id: 'analytical_lab', label: 'Analytical Learning', icon: Microscope },
  { id: 'compare', label: 'Compare Compendia', icon: GitCompare },
  { id: 'directory', label: 'Directory', icon: Scale },
  { id: 'official_sources', label: 'Official Sources', icon: Globe },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { id: 'editions', label: 'Editions & Syllabus', icon: CalendarClock }
];

export default function PharmacopoeiaCenter({ jumpTarget }: PharmacopoeiaCenterProps) {
  const { setWorkspaceSection, recordActivity } = useLibraryNavigation();

  const [activeTab, setActiveTab] = useState<PharmacopoeiaWorkspaceTab>('dashboard');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedSubstanceId, setSelectedSubstanceId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([
    'pc_ip',
    'pc_bp',
    'pc_usp_nf',
    'pc_ph_eur'
  ]);
  const [searchSeedQuery, setSearchSeedQuery] = useState('');
  const [searchSeedDepartment, setSearchSeedDepartment] = useState<
    PharmacopoeiaDepartmentKey | 'all'
  >('all');

  const [loading, setLoading] = useState(true);
  const [userStore, setUserStore] = useState<PharmacopoeiaUserStore>(
    DEFAULT_PHARMACOPOEIA_USER_STORE
  );
  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [referenceProfiles, setReferenceProfiles] = useState<PharmacopoeiaProfileMeta[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadPharmacopoeiaUserStore(),
      getAllBooks().catch(() => []),
      getAllReferences().catch(() => []),
      getAllPharmacopoeiaProfiles().catch(() => [])
    ])
      .then(([loadedStore, loadedBooks, loadedRefs, loadedProfiles]) => {
        if (cancelled) return;
        setUserStore(loadedStore);
        setBooks(loadedBooks);
        setReferenceItems(loadedRefs);
        setReferenceProfiles(loadedProfiles);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle jump target navigation
  useEffect(() => {
    if (!jumpTarget || jumpTarget.nonce === 0) return;
    if (jumpTarget.substanceId) {
      setSelectedSubstanceId(jumpTarget.substanceId);
      setSelectedEntryId(null);
      setSelectedTestId(null);
    } else if (jumpTarget.testId) {
      setSelectedTestId(jumpTarget.testId);
      setSelectedSubstanceId(null);
      setSelectedEntryId(null);
      setActiveTab('analytical_lab');
    } else if (jumpTarget.entryId) {
      setSelectedEntryId(jumpTarget.entryId);
      setSelectedSubstanceId(null);
      setSelectedTestId(null);
    } else if (jumpTarget.tab) {
      setSelectedEntryId(null);
      setSelectedSubstanceId(null);
      setSelectedTestId(null);
      setActiveTab(jumpTarget.tab);
    }

    if (jumpTarget.query) {
      setSearchSeedQuery(jumpTarget.query);
      if (!jumpTarget.entryId && !jumpTarget.substanceId && !jumpTarget.testId) {
        setSelectedEntryId(null);
        setSelectedSubstanceId(null);
        setActiveTab('search');
      }
    }
    if (jumpTarget.department) {
      setSearchSeedDepartment(jumpTarget.department);
      if (!jumpTarget.entryId && !jumpTarget.tab && !jumpTarget.substanceId) {
        setSelectedEntryId(null);
        setSelectedSubstanceId(null);
        setActiveTab('search');
      }
    }
  }, [jumpTarget]);

  const selectedEntry = useMemo(
    () => PHARMACOPOEIA_DIRECTORY.find((e) => e.id === selectedEntryId) || null,
    [selectedEntryId]
  );

  const selectedSubstance = useMemo(
    () => SUBSTANCE_KNOWLEDGE_BASE.find((s) => s.id === selectedSubstanceId) || null,
    [selectedSubstanceId]
  );

  // Sync breadcrumbs with DashboardLayout
  useEffect(() => {
    if (selectedSubstance) {
      setWorkspaceSection('Pharmaceutical Knowledge Workspace', selectedSubstance.name);
    } else if (selectedEntry) {
      setWorkspaceSection('Pharmaceutical Knowledge Workspace', selectedEntry.abbreviation);
    } else {
      const tabLabel = NAV_TABS.find((t) => t.id === activeTab)?.label || 'Knowledge Workspace';
      setWorkspaceSection('Pharmaceutical Knowledge Workspace', tabLabel);
    }
  }, [selectedSubstance, selectedEntry, activeTab, setWorkspaceSection]);

  const persistStore = useCallback(async (next: PharmacopoeiaUserStore) => {
    setUserStore(next);
    await savePharmacopoeiaUserStore(next);
  }, []);

  const handleSelectEntry = useCallback(
    async (entryId: string) => {
      setSelectedSubstanceId(null);
      setSelectedTestId(null);
      setSelectedEntryId(entryId);
      const entry = PHARMACOPOEIA_DIRECTORY.find((e) => e.id === entryId);
      if (entry) {
        recordActivity({
          key: `pharmacopoeia_${entry.id}`,
          kind: 'reference',
          moduleId: 'pharmacopoeia_center',
          title: `${entry.abbreviation} · ${entry.fullName}`,
          subtitle: entry.issuingOrganization
        });
      }
      const next = recordAccessInStore(userStore, entryId);
      await persistStore(next);
    },
    [userStore, persistStore, recordActivity]
  );

  const handleSelectSubstance = useCallback(
    (substanceId: string) => {
      setSelectedEntryId(null);
      setSelectedTestId(null);
      setSelectedSubstanceId(substanceId);
      const sub = SUBSTANCE_KNOWLEDGE_BASE.find((s) => s.id === substanceId);
      if (sub) {
        recordActivity({
          key: `pharma_sub_${sub.id}`,
          kind: 'reference',
          moduleId: 'pharmacopoeia_center',
          title: sub.name,
          subtitle: sub.categoryLabel
        });
      }
    },
    [recordActivity]
  );

  const handleSelectAnalyticalTest = useCallback((testId: string) => {
    setSelectedEntryId(null);
    setSelectedSubstanceId(null);
    setSelectedTestId(testId);
    setActiveTab('analytical_lab');
  }, []);

  const handleRecordSearch = useCallback(
    async (q: string) => {
      const next = recordSearchInStore(userStore, q);
      if (next !== userStore) {
        await persistStore(next);
      }
    },
    [userStore, persistStore]
  );

  const handleToggleBookmark = useCallback(
    async (entryId: string) => {
      const next = toggleBookmarkInStore(userStore, entryId);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleSaveNote = useCallback(
    async (entryId: string, note: string) => {
      const next: PharmacopoeiaUserStore = {
        ...userStore,
        notesByEntryId: {
          ...userStore.notesByEntryId,
          [entryId]: note
        }
      };
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleSaveComparisonNote = useCallback(
    async (entryId: string, note: string) => {
      const next: PharmacopoeiaUserStore = {
        ...userStore,
        comparisonNotesByKey: {
          ...userStore.comparisonNotesByKey,
          [entryId]: note
        }
      };
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleMarkSourceChecked = useCallback(
    async (entryId: string, url: string) => {
      const next = recordSourceCheckInStore(userStore, {
        entryId,
        lastCheckedAt: Date.now(),
        checkedUrl: url
      });
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleAddEditionRecord = useCallback(
    async (record: EditionAmendmentRecord) => {
      const next = upsertEditionRecordInStore(userStore, record);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleDeleteEditionRecord = useCallback(
    async (recordId: string) => {
      const next = deleteEditionRecordInStore(userStore, recordId);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleAddCustomLink = useCallback(
    async (link: UserSavedLink) => {
      const next = upsertCustomLinkInStore(userStore, link);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleDeleteCustomLink = useCallback(
    async (linkId: string) => {
      const next = deleteCustomLinkInStore(userStore, linkId);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleCreateCollection = useCallback(
    async (col: PharmacopoeiaStudyCollection) => {
      const next = upsertCollectionInStore(userStore, col);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleToggleEntryInCollection = useCallback(
    async (collectionId: string, entryId: string) => {
      const next = toggleEntryInCollectionStore(userStore, collectionId, entryId);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleDeleteCollection = useCallback(
    async (collectionId: string) => {
      const next = deleteCollectionInStore(userStore, collectionId);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleAddAcademicLink = useCallback(
    async (link: PharmacopoeiaAcademicLink) => {
      const next = upsertAcademicLinkInStore(userStore, link);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleDeleteAcademicLink = useCallback(
    async (linkId: string) => {
      const next = deleteAcademicLinkInStore(userStore, linkId);
      await persistStore(next);
    },
    [userStore, persistStore]
  );

  const handleAddToCompare = useCallback((entryId: string) => {
    setCompareIds((prev) => (prev.includes(entryId) ? prev : [...prev, entryId]));
    setSelectedEntryId(null);
    setSelectedSubstanceId(null);
    setActiveTab('compare');
  }, []);

  const handleQuickSearch = useCallback(
    (query: string, department: PharmacopoeiaDepartmentKey | 'all' = 'all') => {
      setSearchSeedQuery(query);
      setSearchSeedDepartment(department);
      setSelectedEntryId(null);
      setSelectedSubstanceId(null);
      setActiveTab('search');
    },
    []
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Top Sub-Navigation Workspace Header */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pharmaceutical Knowledge &amp; Pharmacopoeia Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Drug &amp; excipient knowledge, textbook-first PDF retrieval, practical analytical learning, Study Mode links &amp; pharmacopoeia standards
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            {SUBSTANCE_KNOWLEDGE_BASE.length} Knowledge Topics · {books.length} Local PDF(s) · 7 Pharmacopoeias
          </span>
        </div>

        <nav
          aria-label="Pharmaceutical Knowledge Workspace sections"
          className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
        >
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = !selectedEntry && !selectedSubstance && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedEntryId(null);
                  setSelectedSubstanceId(null);
                  if (tab.id !== 'analytical_lab') setSelectedTestId(null);
                  setActiveTab(tab.id);
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading Pharmaceutical Knowledge Workspace...</span>
        </div>
      ) : selectedSubstance ? (
        <SubstanceKnowledgeWorkspace
          substance={selectedSubstance}
          books={books}
          referenceItems={referenceItems}
          referenceProfiles={referenceProfiles}
          onBack={() => setSelectedSubstanceId(null)}
          onOpenPharmacopoeiaEntry={handleSelectEntry}
          onOpenAnalyticalTest={handleSelectAnalyticalTest}
        />
      ) : selectedEntry ? (
        <PharmacopoeiaDetail
          entry={selectedEntry}
          userStore={userStore}
          books={books}
          referenceItems={referenceItems}
          referenceProfiles={referenceProfiles}
          onBack={() => setSelectedEntryId(null)}
          onToggleBookmark={handleToggleBookmark}
          onSaveNote={handleSaveNote}
          onMarkSourceChecked={handleMarkSourceChecked}
          onAddEditionRecord={handleAddEditionRecord}
          onDeleteEditionRecord={handleDeleteEditionRecord}
          onAddAcademicLink={handleAddAcademicLink}
          onDeleteAcademicLink={handleDeleteAcademicLink}
          onAddToCompare={handleAddToCompare}
        />
      ) : activeTab === 'dashboard' ? (
        <PharmacopoeiaDashboard
          userStore={userStore}
          books={books}
          referenceItems={referenceItems}
          referenceProfiles={referenceProfiles}
          onNavigateTab={(tab) => {
            setSelectedEntryId(null);
            setSelectedSubstanceId(null);
            setActiveTab(tab);
          }}
          onSelectEntry={handleSelectEntry}
          onSelectSubstance={handleSelectSubstance}
          onSelectAnalyticalTest={handleSelectAnalyticalTest}
          onQuickSearch={handleQuickSearch}
          onRecordSearch={handleRecordSearch}
        />
      ) : activeTab === 'search' ? (
        <PharmacopoeiaSearch
          initialQuery={searchSeedQuery}
          initialDepartment={searchSeedDepartment}
          userStore={userStore}
          books={books}
          referenceItems={referenceItems}
          referenceProfiles={referenceProfiles}
          onSelectEntry={handleSelectEntry}
          onSelectSubstance={handleSelectSubstance}
          onSelectAnalyticalTest={handleSelectAnalyticalTest}
          onRecordSearch={handleRecordSearch}
        />
      ) : activeTab === 'analytical_lab' ? (
        <AnalyticalLearningView
          selectedTestId={selectedTestId}
          onSelectTestId={setSelectedTestId}
          books={books}
          onOpenPharmacopoeiaEntry={handleSelectEntry}
        />
      ) : activeTab === 'compare' ? (
        <PharmacopoeiaComparison
          selectedEntryIds={compareIds}
          onChangeSelectedIds={setCompareIds}
          userStore={userStore}
          books={books}
          referenceItems={referenceItems}
          referenceProfiles={referenceProfiles}
          onSaveComparisonNote={handleSaveComparisonNote}
          onSelectEntry={handleSelectEntry}
          onSelectSubstance={handleSelectSubstance}
        />
      ) : activeTab === 'directory' ? (
        <PharmacopoeiaDirectory
          userStore={userStore}
          onSelectEntry={handleSelectEntry}
          onToggleBookmark={handleToggleBookmark}
          onAddToCompare={handleAddToCompare}
        />
      ) : activeTab === 'official_sources' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Official Source Portals &amp; Access Transparency
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Direct verified external links to authoritative pharmacopoeia commissions and publishers, with explicit public vs subscription access notices.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PHARMACOPOEIA_DIRECTORY.map((entry) => (
              <OfficialSourceViewer
                key={entry.id}
                entry={entry}
                sourceCheck={userStore.sourceChecks[entry.id]}
                onMarkChecked={handleMarkSourceChecked}
              />
            ))}
          </div>
        </div>
      ) : activeTab === 'bookmarks' ? (
        <PharmacopoeiaBookmarks
          userStore={userStore}
          onSelectEntry={handleSelectEntry}
          onToggleBookmark={handleToggleBookmark}
          onAddCustomLink={handleAddCustomLink}
          onDeleteCustomLink={handleDeleteCustomLink}
          onCreateCollection={handleCreateCollection}
          onToggleEntryInCollection={handleToggleEntryInCollection}
          onDeleteCollection={handleDeleteCollection}
        />
      ) : (
        /* EDITIONS, AMENDMENTS & ACADEMIC LINKS OVERVIEW */
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Edition, Supplement &amp; Official Notice Registry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Baseline publication cycles and direct links to official commission notices. Open any entry to record verified editions, addenda, or supplements locally.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {PHARMACOPOEIA_DIRECTORY.map((entry) => {
                const count = userStore.editionRecords.filter((r) => r.entryId === entry.id).length;
                const safeNotices = sanitizeHttpUrl(entry.officialNoticesUrl);
                return (
                  <div
                    key={entry.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {entry.abbreviation}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {entry.fullName}
                        </span>
                        {count > 0 && (
                          <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                            · {count} user record(s)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {entry.verifiedEditionSummary}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectEntry(entry.id)}
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                      >
                        Manage Logs
                      </button>
                      {safeNotices && (
                        <a
                          href={safeNotices}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <span>Notices</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <PharmacopoeiaAcademicLinks
              userAcademicLinks={userStore.academicLinks}
              onAddAcademicLink={handleAddAcademicLink}
              onDeleteAcademicLink={handleDeleteAcademicLink}
            />
          </section>
        </div>
      )}
    </div>
  );
}
