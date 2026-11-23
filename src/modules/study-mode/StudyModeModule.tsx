import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react';
import {
  StudyModeJumpTarget,
  useLibraryNavigation
} from '../../context/LibraryNavigationContext';
import { CURATED_REFERENCE_QUESTIONS } from './examEngine';
import ExamPrepWorkspace from './ExamPrepWorkspace';
import {
  createEmptyTopicProgress,
  deleteSyllabusProfile,
  getActiveSyllabusId,
  getAllQuestionPapers,
  getAllStoredQuestions,
  getAllSyllabi,
  getAllTopicProgress,
  getLastStudiedTopicSummary,
  saveTopicStudyProgress,
  setActiveSyllabusId
} from './studyDb';
import SyllabusAcquisitionModal from './SyllabusAcquisitionModal';
import { OFFICIAL_BPHARM_SEM1_SYLLABUS_ID } from './syllabusBridge';
import TopicWorkspace from './TopicWorkspace';
import {
  ExamQuestionItem,
  ExamQuestionPaper,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusTopicNode,
  SyllabusVerificationStatus,
  TopicStudyProgress
} from './types';

interface StudyModeModuleProps {
  jumpTarget?: StudyModeJumpTarget;
}

const SYLLABUS_STATUS_TEXT: Record<SyllabusVerificationStatus, string> = {
  official_syllabus: 'Official Syllabus',
  university_specific: 'University-Specific Syllabus',
  imported_syllabus: 'Imported Syllabus',
  unverified_syllabus: 'Unverified Draft'
};

export default function StudyModeModule({ jumpTarget }: StudyModeModuleProps) {
  const { setWorkspaceSection, recordActivity } = useLibraryNavigation();

  const [syllabi, setSyllabi] = useState<SyllabusProfile[]>([]);
  const [activeSyllabusId, setActiveSylId] = useState<string>(getActiveSyllabusId());
  const [viewMode, setViewMode] = useState<'study' | 'exam'>('study');

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('BP104T');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    BP104T: true
  });

  const [progressMap, setProgressMap] = useState<Record<string, TopicStudyProgress>>({});
  const [papers, setPapers] = useState<ExamQuestionPaper[]>([]);
  const [storedQuestions, setStoredQuestions] = useState<ExamQuestionItem[]>([]);
  const [lastStudied, setLastStudied] = useState(() => getLastStudiedTopicSummary());

  const [outlineOpen, setOutlineOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [treeFilter, setTreeFilter] = useState('');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [acquireModalOpen, setAcquireModalOpen] = useState(false);

  const loadAllData = useCallback(async () => {
    const [loadedSyllabi, loadedProgress, loadedPapers, loadedQs] = await Promise.all([
      getAllSyllabi(),
      getAllTopicProgress(),
      getAllQuestionPapers(),
      getAllStoredQuestions()
    ]);
    setSyllabi(loadedSyllabi);
    setProgressMap(loadedProgress);
    setPapers(loadedPapers);
    setStoredQuestions(loadedQs);
    setLastStudied(getLastStudiedTopicSummary());
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const activeSyllabus = useMemo(
    () =>
      syllabi.find((s) => s.id === activeSyllabusId) ||
      syllabi.find((s) => s.id === OFFICIAL_BPHARM_SEM1_SYLLABUS_ID) ||
      syllabi[0],
    [syllabi, activeSyllabusId]
  );

  // Merge stored imported paper questions with strictly labeled reference-based/practice questions
  const allExamQuestions = useMemo(() => {
    const seen = new Set(storedQuestions.map((q) => q.id));
    const merged = [...storedQuestions];
    for (const cq of CURATED_REFERENCE_QUESTIONS) {
      if (!seen.has(cq.id)) merged.push(cq);
    }
    return merged;
  }, [storedQuestions]);

  // Apply external jumpTarget (from Dashboard Continue Learning, Official Syllabus, Anatomy Explorer, Command Palette)
  useEffect(() => {
    if (!activeSyllabus) return;

    if (jumpTarget?.nonce && jumpTarget.nonce > 0) {
      if (jumpTarget.syllabusId) {
        setActiveSylId(jumpTarget.syllabusId);
        setActiveSyllabusId(jumpTarget.syllabusId);
      }
      if (jumpTarget.view) {
        setViewMode(jumpTarget.view);
      }
      if (jumpTarget.subjectCode) {
        setSelectedSubjectCode(jumpTarget.subjectCode);
        setExpandedSubjects((prev) => ({ ...prev, [jumpTarget.subjectCode!]: true }));
      }
      if (jumpTarget.topicId) {
        setSelectedTopicId(jumpTarget.topicId);
        return;
      }
      if (jumpTarget.subjectCode) {
        const subj = activeSyllabus.subjects.find(
          (s) => s.code.toUpperCase() === jumpTarget.subjectCode?.toUpperCase()
        );
        const firstTopic = subj?.units[0]?.topics[0];
        if (firstTopic) {
          setSelectedTopicId(firstTopic.id);
          return;
        }
      }
    }

    // Default selection if none chosen yet
    if (!selectedTopicId) {
      const preferredSubject =
        activeSyllabus.subjects.find((s) => s.code === selectedSubjectCode) ||
        activeSyllabus.subjects[0];
      if (preferredSubject) {
        setSelectedSubjectCode(preferredSubject.code);
        setExpandedSubjects((prev) => ({ ...prev, [preferredSubject.code]: true }));
        const firstTopic = preferredSubject.units[0]?.topics[0];
        if (firstTopic) {
          setSelectedTopicId(firstTopic.id);
        }
      }
    }
  }, [activeSyllabus, jumpTarget, selectedSubjectCode, selectedTopicId]);

  const { activeSubject, activeTopic } = useMemo<{
    activeSubject: SyllabusSubjectNode | undefined;
    activeTopic: SyllabusTopicNode | undefined;
  }>(() => {
    if (!activeSyllabus) return { activeSubject: undefined, activeTopic: undefined };
    for (const s of activeSyllabus.subjects) {
      for (const u of s.units) {
        const found = u.topics.find((t) => t.id === selectedTopicId);
        if (found) return { activeSubject: s, activeTopic: found };
      }
    }
    const fallbackSubj = activeSyllabus.subjects[0];
    const fallbackTopic = fallbackSubj?.units[0]?.topics[0];
    return { activeSubject: fallbackSubj, activeTopic: fallbackTopic };
  }, [activeSyllabus, selectedTopicId]);

  useEffect(() => {
    if (!activeTopic || !activeSubject || !activeSyllabus) return;
    setWorkspaceSection(
      'Study Mode',
      viewMode === 'exam' ? `${activeSubject.code} Exam Prep` : `${activeSubject.code} · ${activeTopic.title}`
    );
    return () => setWorkspaceSection(null);
  }, [activeTopic, activeSubject, activeSyllabus, viewMode, setWorkspaceSection]);

  const handleSelectTopic = useCallback(
    async (subj: SyllabusSubjectNode, topic: SyllabusTopicNode) => {
      setSelectedSubjectCode(subj.code);
      setSelectedTopicId(topic.id);
      setViewMode('study');
      setMobileDrawerOpen(false);
      setExpandedSubjects((prev) => ({ ...prev, [subj.code]: true }));

      recordActivity({
        key: `study_topic:${topic.id}`,
        kind: 'study_topic',
        title: topic.title,
        subtitle: `${subj.code} · ${topic.unitNo}`,
        moduleId: 'study_mode',
        syllabusId: activeSyllabus?.id || OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        subjectCode: subj.code,
        topicId: topic.id
      });

      const existing =
        progressMap[topic.id] ||
        createEmptyTopicProgress({
          topicId: topic.id,
          syllabusId: activeSyllabus?.id || OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
          subjectCode: subj.code,
          topicTitle: topic.title
        });
      const updated = await saveTopicStudyProgress(existing);
      setProgressMap((prev) => ({ ...prev, [topic.id]: updated }));
      setLastStudied(getLastStudiedTopicSummary());
    },
    [activeSyllabus?.id, progressMap, recordActivity]
  );

  const handleSwitchSyllabus = (newId: string) => {
    setActiveSylId(newId);
    setActiveSyllabusId(newId);
    const syl = syllabi.find((s) => s.id === newId);
    const firstSubj = syl?.subjects[0];
    const firstTopic = firstSubj?.units[0]?.topics[0];
    if (firstSubj) {
      setSelectedSubjectCode(firstSubj.code);
      setExpandedSubjects({ [firstSubj.code]: true });
    }
    if (firstTopic) {
      setSelectedTopicId(firstTopic.id);
    }
  };

  const handleDeleteImportedSyllabus = async (id: string) => {
    await deleteSyllabusProfile(id);
    await loadAllData();
    if (activeSyllabusId === id) {
      handleSwitchSyllabus(OFFICIAL_BPHARM_SEM1_SYLLABUS_ID);
    }
  };

  const handleImportedSyllabus = async (profile: SyllabusProfile) => {
    await loadAllData();
    setActiveSylId(profile.id);
    setActiveSyllabusId(profile.id);
    const firstSubj = profile.subjects[0];
    const firstTopic = firstSubj?.units[0]?.topics[0];
    if (firstSubj) {
      setSelectedSubjectCode(firstSubj.code);
      setExpandedSubjects({ [firstSubj.code]: true });
    }
    if (firstTopic) setSelectedTopicId(firstTopic.id);
  };

  // Compute overall syllabus statistics
  const syllabusStats = useMemo(() => {
    if (!activeSyllabus) return { total: 0, completed: 0, bookmarked: 0 };
    let total = 0;
    let completed = 0;
    let bookmarked = 0;
    for (const s of activeSyllabus.subjects) {
      for (const u of s.units) {
        for (const t of u.topics) {
          total += 1;
          const p = progressMap[t.id];
          if (p?.completed) completed += 1;
          if (p?.bookmarked) bookmarked += 1;
        }
      }
    }
    return { total, completed, bookmarked };
  }, [activeSyllabus, progressMap]);

  if (!activeSyllabus) {
    return (
      <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Loading Study Mode &amp; Academic Syllabus...
      </div>
    );
  }

  const filterLower = treeFilter.trim().toLowerCase();

  const renderOutlineTree = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={treeFilter}
            onChange={(e) => setTreeFilter(e.target.value)}
            placeholder="Filter topics (e.g. Nephron, Limit Test)..."
            className="w-full min-h-[38px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="tabular-nums">
            {syllabusStats.completed}/{syllabusStats.total} done
          </span>
          <button
            type="button"
            onClick={() => setOnlyBookmarked((b) => !b)}
            className={`px-2 py-1 rounded-lg font-semibold inline-flex items-center gap-1 transition-colors ${
              onlyBookmarked
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                : 'hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-3 h-3 ${onlyBookmarked ? 'fill-current' : ''}`} />
            <span>Saved ({syllabusStats.bookmarked})</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {activeSyllabus.subjects.map((subj) => {
          const isExpanded = Boolean(expandedSubjects[subj.code]) || Boolean(filterLower);
          const matchingUnits = subj.units
            .map((u) => ({
              ...u,
              topics: u.topics.filter((t) => {
                const p = progressMap[t.id];
                if (onlyBookmarked && !p?.bookmarked) return false;
                if (!filterLower) return true;
                return (
                  t.title.toLowerCase().includes(filterLower) ||
                  subj.code.toLowerCase().includes(filterLower) ||
                  subj.title.toLowerCase().includes(filterLower) ||
                  u.title.toLowerCase().includes(filterLower) ||
                  t.keywords.some((k) => k.toLowerCase().includes(filterLower))
                );
              })
            }))
            .filter((u) => u.topics.length > 0);

          if ((filterLower || onlyBookmarked) && matchingUnits.length === 0) return null;

          return (
            <div
              key={subj.id}
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedSubjects((prev) => ({ ...prev, [subj.code]: !isExpanded }))
                }
                className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {subj.code}
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {subj.title}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {matchingUnits.map((unit) => (
                    <div key={unit.id} className="p-2 space-y-1">
                      <p className="px-2 pt-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                        {unit.unitNo} · {unit.title}
                      </p>
                      {unit.topics.map((topic) => {
                        const isSelected = activeTopic?.id === topic.id && viewMode === 'study';
                        const p = progressMap[topic.id];
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => handleSelectTopic(subj, topic)}
                            className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-start justify-between gap-2 transition-colors ${
                              isSelected
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                            }`}
                          >
                            <span className="leading-snug line-clamp-2">{topic.title}</span>
                            <span className="flex items-center gap-1 shrink-0 pt-0.5">
                              {p?.bookmarked && (
                                <Bookmark
                                  className={`w-3 h-3 fill-current ${
                                    isSelected ? 'text-amber-200' : 'text-amber-500'
                                  }`}
                                />
                              )}
                              {p?.completed && (
                                <CheckCircle2
                                  className={`w-3.5 h-3.5 ${
                                    isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Study Mode Top Control Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Menu className="w-4 h-4" />
              <span>Topics</span>
            </button>

            <button
              type="button"
              onClick={() => setOutlineOpen((o) => !o)}
              className="hidden lg:inline-flex min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold items-center gap-1.5"
              title="Toggle focused reading mode"
            >
              {outlineOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              <span>{outlineOpen ? 'Focus Mode' : 'Show Syllabus Tree'}</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <select
                value={activeSyllabus.id}
                onChange={(e) => handleSwitchSyllabus(e.target.value)}
                aria-label="Select active syllabus profile"
                className="min-h-[42px] max-w-[300px] sm:max-w-[380px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
              >
                {syllabi.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>

              {!activeSyllabus.isSystemOfficial && (
                <button
                  type="button"
                  onClick={() => handleDeleteImportedSyllabus(activeSyllabus.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600"
                  title="Delete imported syllabus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('study')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'study'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('exam')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'exam'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Exam Prep &amp; Intelligence</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAcquireModalOpen(true)}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Acquire / Import Syllabus</span>
            </button>
          </div>
        </div>

        {/* Unboxed Status Metadata & Quick Continue Learning */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <p>
            <strong className="text-emerald-700 dark:text-emerald-400">
              {SYLLABUS_STATUS_TEXT[activeSyllabus.verificationStatus]}
            </strong>
            {' · '}
            {activeSyllabus.university}
            {' · '}
            {activeSyllabus.course} ({activeSyllabus.semester})
          </p>

          {lastStudied && lastStudied.topicId !== activeTopic?.id && (
            <button
              type="button"
              onClick={() => {
                const subj = activeSyllabus.subjects.find(
                  (s) => s.code === lastStudied.subjectCode
                );
                const topic = subj?.units
                  .flatMap((u) => u.topics)
                  .find((t) => t.id === lastStudied.topicId);
                if (subj && topic) {
                  handleSelectTopic(subj, topic);
                }
              }}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Continue: {lastStudied.topicTitle}</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Split Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Desktop Collapsible Curriculum Outline */}
        {outlineOpen && (
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-6.5rem)] overflow-y-auto">
            {renderOutlineTree()}
          </aside>
        )}

        {/* Active Learning or Exam Intelligence Area */}
        <div className={outlineOpen ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'}>
          {viewMode === 'exam' ? (
            <ExamPrepWorkspace
              syllabus={activeSyllabus}
              initialSubjectCode={activeSubject?.code || selectedSubjectCode}
              papers={papers}
              questions={allExamQuestions}
              onRefreshExamData={loadAllData}
            />
          ) : activeTopic && activeSubject ? (
            <TopicWorkspace
              syllabus={activeSyllabus}
              subject={activeSubject}
              topic={activeTopic}
              progress={progressMap[activeTopic.id]}
              onProgressUpdated={(next) => {
                setProgressMap((prev) => ({ ...prev, [next.topicId]: next }));
                setLastStudied(getLastStudiedTopicSummary());
              }}
              examQuestions={allExamQuestions}
              examPapers={papers}
              onOpenSubjectExamPrep={() => setViewMode('exam')}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Select a topic from the curriculum outline to begin studying.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Topics Drawer */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Curriculum Topics
              </h2>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-500"
                aria-label="Close topic menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderOutlineTree()}
          </div>
        </div>
      )}

      {/* Syllabus Acquisition Modal */}
      <SyllabusAcquisitionModal
        isOpen={acquireModalOpen}
        onClose={() => setAcquireModalOpen(false)}
        onImported={handleImportedSyllabus}
      />
    </div>
  );
}
