import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FilePenLine,
  Filter,
  GitCompare,
  History,
  Info,
  Layers,
  ListChecks,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { gapCategoryToEnrichmentSection } from '../enrichment-workspace/sectionCatalog';
import { dispatchGapAction } from './actionDispatcher';
import { runSyllabusCoverageAudit } from './analyzerEngine';
import {
  clearAuditSnapshots,
  compareAuditSnapshots,
  createSnapshotFromCourseReport,
  loadAuditSnapshots,
  saveAuditSnapshot
} from './auditHistoryStorage';
import TopicDetailPanel from './TopicDetailPanel';
import {
  CoverageAuditReport,
  CoverageAuditSnapshot,
  CoverageStatus,
  GapCategory,
  GapSeverity,
  TopicCoverageReport
} from './types';
import {
  COVERAGE_STATUS_META,
  CoverageStatusInline,
  GAP_CATEGORY_LABELS,
  MetricBar,
  SeverityInline
} from './uiHelpers';

export type AnalyzerTabId = 'overview' | 'subjects' | 'gaps' | 'priority' | 'history';

export interface CoverageAnalyzerJumpTarget {
  subjectCode?: string | null;
  topicId?: string | null;
  tab?: AnalyzerTabId | null;
  nonce: number;
}

interface CoverageAnalyzerModuleProps {
  jumpTarget?: CoverageAnalyzerJumpTarget;
}

const ALL_STATUS_ORDER: CoverageStatus[] = [
  'complete',
  'substantially_complete',
  'partially_complete',
  'minimal_content',
  'missing_content',
  'needs_verification'
];

export default function CoverageAnalyzerModule({ jumpTarget }: CoverageAnalyzerModuleProps) {
  const nav = useLibraryNavigation();

  const [report, setReport] = useState<CoverageAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AnalyzerTabId>('overview');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [expandedUnitIds, setExpandedUnitIds] = useState<Record<string, boolean>>({});
  const [inspectedTopic, setInspectedTopic] = useState<TopicCoverageReport | null>(null);

  // Gap Explorer Filters
  const [gapSubjectFilter, setGapSubjectFilter] = useState<string>('all');
  const [gapUnitFilter, setGapUnitFilter] = useState<string>('all');
  const [gapCategoryFilter, setGapCategoryFilter] = useState<GapCategory | 'all'>('all');
  const [gapSeverityFilter, setGapSeverityFilter] = useState<GapSeverity | 'all'>('all');
  const [gapSearch, setGapSearch] = useState<string>('');
  const [gapSort, setGapSort] = useState<'priority' | 'subject' | 'severity'>('priority');

  // Audit History State
  const [snapshots, setSnapshots] = useState<CoverageAuditSnapshot[]>(() => loadAuditSnapshots());
  const [compareBaselineId, setCompareBaselineId] = useState<string>('');
  const [compareTargetId, setCompareTargetId] = useState<string>('');

  useEffect(() => {
    nav.setWorkspaceSection('Syllabus Coverage & Content Gap Analyzer', activeTab.toUpperCase());
  }, [nav, activeTab]);

  const executeAudit = useCallback(async (saveSnapshotAfterRun: boolean) => {
    setError(null);
    if (saveSnapshotAfterRun) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const nextReport = await runSyllabusCoverageAudit();
      setReport(nextReport);

      const firstCourse = nextReport.courses[0];
      if (firstCourse) {
        setSelectedCourseId((prev) =>
          nextReport.courses.some((c) => c.syllabusId === prev) ? prev : firstCourse.syllabusId
        );
        if (saveSnapshotAfterRun || loadAuditSnapshots().length === 0) {
          const snap = createSnapshotFromCourseReport(firstCourse, nextReport.generatedAt);
          const updatedSnaps = saveAuditSnapshot(snap);
          setSnapshots(updatedSnaps);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to analyze local PharmaLab syllabus stores.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    executeAudit(false);
  }, [executeAudit]);

  const activeCourse = useMemo(() => {
    if (!report || report.courses.length === 0) return null;
    return (
      report.courses.find((c) => c.syllabusId === selectedCourseId) || report.courses[0]
    );
  }, [report, selectedCourseId]);

  // Apply external jumpTarget cleanly
  useEffect(() => {
    if (!jumpTarget || jumpTarget.nonce === 0 || !activeCourse) return;
    if (jumpTarget.tab) {
      setActiveTab(jumpTarget.tab);
    }
    if (jumpTarget.subjectCode) {
      setSelectedSubjectCode(jumpTarget.subjectCode);
      setGapSubjectFilter(jumpTarget.subjectCode);
    }
    if (jumpTarget.topicId) {
      const foundTopic = activeCourse.subjects
        .flatMap((s) => s.units.flatMap((u) => u.topics))
        .find((t) => t.id === jumpTarget.topicId);
      if (foundTopic) setInspectedTopic(foundTopic);
    }
  }, [jumpTarget, activeCourse]);

  // Default selected subject inside Subjects & Units tab
  const activeSubject = useMemo(() => {
    if (!activeCourse || activeCourse.subjects.length === 0) return null;
    return (
      activeCourse.subjects.find((s) => s.code === selectedSubjectCode) ||
      activeCourse.subjects[0]
    );
  }, [activeCourse, selectedSubjectCode]);

  // Keep snapshot selectors valid
  useEffect(() => {
    if (!activeCourse) return;
    const courseSnaps = snapshots.filter((s) => s.syllabusId === activeCourse.syllabusId);
    if (courseSnaps.length >= 2) {
      setCompareTargetId((prev) =>
        courseSnaps.some((s) => s.snapshotId === prev) ? prev : courseSnaps[0].snapshotId
      );
      setCompareBaselineId((prev) =>
        courseSnaps.some((s) => s.snapshotId === prev) ? prev : courseSnaps[1].snapshotId
      );
    } else if (courseSnaps.length === 1) {
      setCompareTargetId(courseSnaps[0].snapshotId);
      setCompareBaselineId(courseSnaps[0].snapshotId);
    }
  }, [snapshots, activeCourse]);

  // Auto-expand units with lowest completeness or gaps when switching subject
  useEffect(() => {
    if (!activeSubject) return;
    setExpandedUnitIds((prev) => {
      const hasAnyForSubj = activeSubject.units.some((u) => u.id in prev);
      if (hasAnyForSubj) return prev;
      const next = { ...prev };
      activeSubject.units.slice(0, 2).forEach((u) => {
        next[u.id] = true;
      });
      return next;
    });
  }, [activeSubject]);

  const availableUnitsForGapFilter = useMemo(() => {
    if (!activeCourse) return [];
    const targetSubjects =
      gapSubjectFilter === 'all'
        ? activeCourse.subjects
        : activeCourse.subjects.filter((s) => s.code === gapSubjectFilter);
    const unitNames = new Set<string>();
    targetSubjects.forEach((s) => s.units.forEach((u) => unitNames.add(u.unitNo)));
    return Array.from(unitNames);
  }, [activeCourse, gapSubjectFilter]);

  const filteredGaps = useMemo(() => {
    if (!activeCourse) return [];
    const q = gapSearch.trim().toLowerCase();
    const sevOrder: Record<GapSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    const hits = activeCourse.allGaps.filter((g) => {
      if (gapSubjectFilter !== 'all' && g.subjectCode !== gapSubjectFilter) return false;
      if (gapUnitFilter !== 'all' && g.unitNo !== gapUnitFilter) return false;
      if (gapCategoryFilter !== 'all' && g.category !== gapCategoryFilter) return false;
      if (gapSeverityFilter !== 'all' && g.severity !== gapSeverityFilter) return false;
      if (q) {
        const hay = `${g.subjectCode} ${g.subjectTitle} ${g.unitNo} ${g.topicTitle} ${g.title} ${g.detail}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (gapSort === 'subject') {
      return [...hits].sort(
        (a, b) => a.subjectCode.localeCompare(b.subjectCode) || b.priorityScore - a.priorityScore
      );
    }
    if (gapSort === 'severity') {
      return [...hits].sort(
        (a, b) =>
          sevOrder[b.severity] - sevOrder[a.severity] || b.priorityScore - a.priorityScore
      );
    }
    return [...hits].sort((a, b) => b.priorityScore - a.priorityScore);
  }, [
    activeCourse,
    gapSubjectFilter,
    gapUnitFilter,
    gapCategoryFilter,
    gapSeverityFilter,
    gapSearch,
    gapSort
  ]);

  const findTopicReport = useCallback(
    (topicId: string): TopicCoverageReport | null => {
      if (!activeCourse) return null;
      for (const s of activeCourse.subjects) {
        for (const u of s.units) {
          const hit = u.topics.find((t) => t.id === topicId);
          if (hit) return hit;
        }
      }
      return null;
    },
    [activeCourse]
  );

  const courseSnapshots = useMemo(() => {
    if (!activeCourse) return [];
    return snapshots.filter((s) => s.syllabusId === activeCourse.syllabusId);
  }, [snapshots, activeCourse]);

  const historyDiff = useMemo(() => {
    const base = courseSnapshots.find((s) => s.snapshotId === compareBaselineId);
    const target = courseSnapshots.find((s) => s.snapshotId === compareTargetId);
    if (!base || !target) return null;
    return compareAuditSnapshots(base, target);
  }, [courseSnapshots, compareBaselineId, compareTargetId]);

  const handleExportAuditJson = () => {
    if (!activeCourse || !report) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      auditId: report.auditId,
      sources: report.sources,
      course: activeCourse
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmlab-coverage-audit-${activeCourse.syllabusId.slice(0, 24)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveManualSnapshot = () => {
    if (!activeCourse) return;
    const snap = createSnapshotFromCourseReport(activeCourse, Date.now());
    const updated = saveAuditSnapshot(snap);
    setSnapshots(updated);
  };

  if (loading && !report) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
        <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Auditing PharmaLab Syllabus &amp; Learning Repositories...
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Inspecting Study Mode syllabi, Anatomy Catalog, Reference Center, Visual Library, 3D Assets, Practicals, and Exam Question banks.
        </p>
      </div>
    );
  }

  if (error || !report || !activeCourse) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
          {error || 'No syllabus profile available to analyze.'}
        </p>
        <button
          type="button"
          onClick={() => executeAudit(false)}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
        >
          Retry Audit
        </button>
      </div>
    );
  }

  const totalOpenGaps = activeCourse.allGaps.length;

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              P4.1 Academic Quality Intelligence · Audited{' '}
              {new Date(report.generatedAt).toLocaleString()} · {report.sources.syllabiCount}{' '}
              syllabus profile(s)
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Syllabus Coverage &amp; Content Gap Analyzer
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Live structural audit across official curriculum hierarchies, Study Mode notes, references, visuals, 3D models, practicals, and assessments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {report.courses.length > 1 && (
              <select
                value={activeCourse.syllabusId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedSubjectCode('');
                  setGapSubjectFilter('all');
                }}
                aria-label="Select syllabus profile to audit"
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[260px]"
              >
                {report.courses.map((c) => (
                  <option key={c.syllabusId} value={c.syllabusId}>
                    {c.courseLabel}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleExportAuditJson}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => executeAudit(true)}
              disabled={refreshing}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Auditing...' : 'Run Fresh Audit'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Bar */}
        <nav
          aria-label="Coverage Analyzer views"
          className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-200 dark:border-slate-800"
        >
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'subjects', label: `Subjects & Units (${activeCourse.totalSubjects})`, icon: Layers },
            { id: 'gaps', label: `Gap Explorer (${totalOpenGaps})`, icon: Filter },
            { id: 'priority', label: 'Priority Queue', icon: ListChecks },
            { id: 'history', label: `Audit History (${courseSnapshots.length})`, icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AnalyzerTabId)}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors tabular-nums ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Primary Metric Strip */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Syllabus Hierarchy
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {activeCourse.totalTopics}{' '}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  topics
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {activeCourse.totalSubjects} subjects · {activeCourse.totalUnits} units ·{' '}
                {activeCourse.totalSubtopics} subtopics
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Content Completeness
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {activeCourse.overallCompletenessPct}%
              </p>
              <MetricBar
                pct={activeCourse.overallCompletenessPct}
                tone={
                  activeCourse.overallCompletenessPct >= 70
                    ? 'emerald'
                    : activeCourse.overallCompletenessPct >= 45
                    ? 'amber'
                    : 'rose'
                }
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Connected Resources
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {activeCourse.overallResourceCoveragePct}%
              </p>
              <MetricBar pct={activeCourse.overallResourceCoveragePct} tone="sky" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Prioritized Gaps
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {totalOpenGaps}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                <span className="text-rose-700 dark:text-rose-400 font-semibold">
                  {activeCourse.gapSeverityBreakdown.critical} critical
                </span>{' '}
                ·{' '}
                <span className="text-orange-700 dark:text-orange-400 font-semibold">
                  {activeCourse.gapSeverityBreakdown.high} high
                </span>{' '}
                · {activeCourse.gapSeverityBreakdown.medium} med
              </p>
            </div>
          </section>

          {/* Classification Breakdown & Resource Coverage Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Quality Classifications */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Topic Content Quality Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Topic-specific applicability applied · placeholders excluded from Complete
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {ALL_STATUS_ORDER.map((st) => {
                  const meta = COVERAGE_STATUS_META[st];
                  const count = activeCourse.statusBreakdown[st] || 0;
                  const pct = activeCourse.totalTopics
                    ? Math.round((count / activeCourse.totalTopics) * 100)
                    : 0;
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className={`font-semibold ${meta.textClass}`}>{meta.label}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {count} / {activeCourse.totalTopics} topics ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${meta.barClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connected Resource Coverage */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Resource Coverage Across Applicable Topics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Measured strictly against applicable topics (e.g. Psychology/Python excluded from 3D)
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: 'References & Textbooks',
                    pct: activeCourse.resourceBreakdown.referencesPct,
                    filter: 'missing_references' as GapCategory
                  },
                  {
                    label: 'Scientific Visuals & Diagrams',
                    pct: activeCourse.resourceBreakdown.visualsPct,
                    filter: 'missing_visuals' as GapCategory
                  },
                  {
                    label: 'Linked 3D Models',
                    pct: activeCourse.resourceBreakdown.models3dPct,
                    filter: 'missing_3d' as GapCategory
                  },
                  {
                    label: 'Practical & Lab Connections',
                    pct: activeCourse.resourceBreakdown.experimentsPct,
                    filter: 'missing_experiments' as GapCategory
                  },
                  {
                    label: 'Assessment Questions & MCQs',
                    pct: activeCourse.resourceBreakdown.assessmentsPct,
                    filter: 'missing_assessments' as GapCategory
                  }
                ].map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <button
                        type="button"
                        onClick={() => {
                          setGapCategoryFilter(row.filter);
                          setActiveTab('gaps');
                        }}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                      >
                        {row.label} →
                      </button>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {row.pct}%
                      </span>
                    </div>
                    <MetricBar
                      pct={row.pct}
                      tone={row.pct >= 70 ? 'emerald' : row.pct >= 40 ? 'amber' : 'rose'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Subjects Ranked by Coverage */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Subject Coverage Matrix
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sorted by lowest content completeness first so gaps needing attention appear at the top.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('priority')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Open Priority Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4 font-semibold">Subject</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">Units / Topics</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">Content Ready</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">Incomplete / Missing</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">Refs</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">Visuals</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">3D</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">MCQs</th>
                    <th className="py-2.5 px-3 font-semibold text-right tabular-nums">Completeness</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {[...activeCourse.subjects]
                    .sort((a, b) => a.completenessPct - b.completenessPct)
                    .map((subj) => (
                      <tr
                        key={subj.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 min-w-[200px]">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {subj.code}{' '}
                            <span className="font-normal text-slate-500 dark:text-slate-400 text-xs">
                              ({subj.courseType}, {subj.credits} cr)
                            </span>
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[260px]">
                            {subj.title}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {subj.totalUnits} / {subj.totalTopics}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                          {subj.topicsWithAcademicContent}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          <span className="text-amber-700 dark:text-amber-400">
                            {subj.topicsWithIncompleteContent}
                          </span>
                          {' / '}
                          <span className="text-rose-700 dark:text-rose-400 font-semibold">
                            {subj.topicsWithNoContent}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {subj.topicsWithReferences}/{subj.totalTopics}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {subj.applicableVisualTopicsCount > 0
                            ? `${subj.topicsWithVisuals}/${subj.applicableVisualTopicsCount}`
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {subj.applicable3DTopicsCount > 0
                            ? `${subj.topicsWith3DModels}/${subj.applicable3DTopicsCount}`
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {subj.topicsWithAssessments}/{subj.totalTopics}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                          {subj.completenessPct}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubjectCode(subj.code);
                              setActiveTab('subjects');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
                          >
                            Breakdown
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Audited Sources & Methodology Notice */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Data Sources Inspected
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs tabular-nums">
                {[
                  { label: 'Anatomy Entities', val: report.sources.anatomyCatalogCount },
                  { label: 'Engine Topics / Subtopics', val: `${report.sources.engineTopicsCount} / ${report.sources.engineSubtopicsCount}` },
                  { label: 'Visual Atlas Plates', val: report.sources.visualsCount },
                  { label: 'Reference Center Items', val: report.sources.referenceCatalogCount },
                  { label: 'Local PDF Textbooks', val: report.sources.localBooksCount },
                  { label: '3D Assets (IndexedDB)', val: report.sources.assets3dCount },
                  { label: 'Lab Experiments', val: report.sources.experimentsCatalogCount },
                  { label: 'Interactive Sims', val: report.sources.interactiveSimsCount },
                  { label: 'MCQs & PYQs (Curated + DB)', val: report.sources.curatedQuestionsCount + report.sources.storedQuestionsCount }
                ].map((src) => (
                  <div
                    key={src.label}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <p className="text-slate-500 dark:text-slate-400">{src.label}</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{src.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <h2 className="text-sm font-bold">Audit Honesty &amp; Scope Boundaries</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This analyzer performs deterministic structural, hierarchy, depth, and resource-linkage checks against PharmaLab&apos;s live data without inventing syllabus content.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Topics backed only by unverified imports, open encyclopedic summaries, or broken 3D references are marked{' '}
                <strong className="text-sky-700 dark:text-sky-400">Needs Verification</strong>{' '}
                rather than Complete—automated checks do not replace faculty scientific review.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* ==================== SUBJECTS & UNITS TAB ==================== */}
      {activeTab === 'subjects' && activeSubject && (
        <div className="space-y-5">
          {/* Subject Selector Strip */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center gap-1.5 overflow-x-auto">
            {activeCourse.subjects.map((s) => {
              const isSelected = s.code === activeSubject.code;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSubjectCode(s.code)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors tabular-nums ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  {s.code} ({s.completenessPct}%)
                </button>
              );
            })}
          </div>

          {/* Subject Header & Breakdown Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {activeSubject.code} · {activeSubject.courseType} · {activeSubject.credits} Credits ·{' '}
                  {activeSubject.totalUnits} Units · {activeSubject.totalTopics} Topics ·{' '}
                  {activeSubject.totalSubtopics} Subtopics
                </p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeSubject.title}
                </h2>
              </div>

              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completeness</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {activeSubject.completenessPct}%
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Resources</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {activeSubject.resourceCoveragePct}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs tabular-nums">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Substantial / Ready</p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {activeSubject.topicsWithAcademicContent} / {activeSubject.totalTopics}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Incomplete</p>
                <p className="text-base font-bold text-amber-700 dark:text-amber-400">
                  {activeSubject.topicsWithIncompleteContent}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Missing Content</p>
                <p className="text-base font-bold text-rose-700 dark:text-rose-400">
                  {activeSubject.topicsWithNoContent}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">References</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {activeSubject.topicsWithReferences} / {activeSubject.totalTopics}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Visuals / 3D</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {activeSubject.applicableVisualTopicsCount > 0 ? activeSubject.topicsWithVisuals : 'N/A'} /{' '}
                  {activeSubject.applicable3DTopicsCount > 0 ? activeSubject.topicsWith3DModels : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Practicals / MCQs</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {activeSubject.topicsWithExperiments} / {activeSubject.topicsWithAssessments}
                </p>
              </div>
            </div>

            {activeSubject.hierarchyIssues.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Hierarchy &amp; Subtopic Structural Findings ({activeSubject.hierarchyIssues.length})</span>
                </p>
                <ul className="space-y-0.5 text-slate-600 dark:text-slate-400 pl-5 list-disc">
                  {activeSubject.hierarchyIssues.slice(0, 6).map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Unit-by-Unit Expandable Breakdown */}
          <div className="space-y-3">
            {activeSubject.units.map((unit) => {
              const isExpanded = Boolean(expandedUnitIds[unit.id]);
              return (
                <section
                  key={unit.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedUnitIds((prev) => ({ ...prev, [unit.id]: !prev[unit.id] }))
                    }
                    className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {unit.unitNo}
                          {unit.lecturesLabel ? ` · ${unit.lecturesLabel}` : ''} · {unit.topicCount}{' '}
                          topics · {unit.subtopicCount} subtopics
                        </p>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {unit.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums shrink-0 pl-6 sm:pl-0">
                      <span className="text-slate-700 dark:text-slate-300">
                        Content: <strong>{unit.completenessPct}%</strong>
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        Resources: <strong>{unit.resourceCoveragePct}%</strong>
                      </span>
                      <span
                        className={
                          unit.criticalGapCount > 0
                            ? 'text-rose-700 dark:text-rose-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {unit.gapCount} gap(s)
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                      {unit.topics.map((topic) => (
                        <div
                          key={topic.id}
                          className="px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-950/50 transition-colors"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <CoverageStatusInline status={topic.status} />
                              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                {topic.completenessPct}% content · {topic.resourceCoveragePct}%
                                resources · {topic.subtopicCount} subtopics · {topic.gaps.length}{' '}
                                gaps
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setInspectedTopic(topic)}
                              className="text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block"
                            >
                              {topic.title}
                            </button>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {topic.statusReasons[0]}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setInspectedTopic(topic)}
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                            >
                              Inspect Matrix
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                nav.openEnrichmentWorkspace({
                                  syllabusId: activeCourse.syllabusId,
                                  subjectCode: topic.subjectCode,
                                  topicId: topic.id,
                                  returnTo: 'coverage_analyzer'
                                })
                              }
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <FilePenLine className="w-3.5 h-3.5" />
                              <span>Enrich</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                nav.openStudyMode({
                                  syllabusId: activeCourse.syllabusId,
                                  subjectCode: topic.subjectCode,
                                  topicId: topic.id,
                                  view: 'study'
                                })
                              }
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 text-slate-800 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <span>Study Mode</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Subject Improvement Checklist */}
          {activeSubject.improvementChecklist.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeSubject.code} Improvement Checklist ({activeSubject.gaps.length} total gaps)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highest-priority structural, content, and resource actions for this subject.
                </p>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeSubject.improvementChecklist.map((gap) => (
                  <div
                    key={gap.id}
                    className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <SeverityInline severity={gap.severity} />
                        <span className="text-slate-500 dark:text-slate-400">
                          · {gap.unitNo} · {GAP_CATEGORY_LABELS[gap.category]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {gap.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{gap.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatchGapAction(gap.suggestedAction, nav)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <span>{gap.suggestedAction.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ==================== GAP EXPLORER TAB ==================== */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {/* Filters Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={gapSearch}
                onChange={(e) => setGapSearch(e.target.value)}
                placeholder="Search gap title, topic, resource..."
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={gapSubjectFilter}
              onChange={(e) => {
                setGapSubjectFilter(e.target.value);
                setGapUnitFilter('all');
              }}
              aria-label="Filter gaps by subject"
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Subjects ({activeCourse.totalSubjects})</option>
              {activeCourse.subjects.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.code} · {s.title.slice(0, 22)}
                </option>
              ))}
            </select>

            <select
              value={gapUnitFilter}
              onChange={(e) => setGapUnitFilter(e.target.value)}
              aria-label="Filter gaps by unit"
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Units</option>
              {availableUnitsForGapFilter.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              value={gapCategoryFilter}
              onChange={(e) => setGapCategoryFilter(e.target.value as GapCategory | 'all')}
              aria-label="Filter gaps by type"
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Gap Types</option>
              {(Object.keys(GAP_CATEGORY_LABELS) as GapCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {GAP_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                value={gapSeverityFilter}
                onChange={(e) => setGapSeverityFilter(e.target.value as GapSeverity | 'all')}
                aria-label="Filter gaps by severity"
                className="flex-1 min-h-[40px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={gapSort}
                onChange={(e) => setGapSort(e.target.value as 'priority' | 'subject' | 'severity')}
                aria-label="Sort gaps"
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
              >
                <option value="priority">Sort: Priority</option>
                <option value="severity">Sort: Severity</option>
                <option value="subject">Sort: Subject</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                Showing {filteredGaps.length} of {activeCourse.allGaps.length} identified gaps
              </p>
              {(gapSubjectFilter !== 'all' ||
                gapUnitFilter !== 'all' ||
                gapCategoryFilter !== 'all' ||
                gapSeverityFilter !== 'all' ||
                gapSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setGapSubjectFilter('all');
                    setGapUnitFilter('all');
                    setGapCategoryFilter('all');
                    setGapSeverityFilter('all');
                    setGapSearch('');
                  }}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            {filteredGaps.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-950/50 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs tabular-nums">
                        <SeverityInline severity={gap.severity} />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {gap.subjectCode} · {gap.unitNo}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          · {GAP_CATEGORY_LABELS[gap.category]} · Score {gap.priorityScore}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {gap.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {gap.detail} — <span className="text-slate-500">{gap.priorityReason}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const t = findTopicReport(gap.topicId);
                          if (t) setInspectedTopic(t);
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        Inspect Topic
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          nav.openEnrichmentWorkspace({
                            syllabusId: gap.courseId,
                            subjectCode: gap.subjectCode,
                            topicId: gap.topicId,
                            sectionKey: gapCategoryToEnrichmentSection(gap.category),
                            returnTo: 'coverage_analyzer'
                          })
                        }
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        <span>Enrich</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatchGapAction(gap.suggestedAction, nav)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>{gap.suggestedAction.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-1.5 px-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  No matching coverage gaps for these filters
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust subject, severity, or category filters to inspect remaining gaps.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== PRIORITY QUEUE TAB ==================== */}
      {activeTab === 'priority' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
            {(
              [
                { key: 'critical', label: 'Critical Priority', color: 'text-rose-700 dark:text-rose-400' },
                { key: 'high', label: 'High Priority', color: 'text-orange-700 dark:text-orange-400' },
                { key: 'medium', label: 'Medium Priority', color: 'text-amber-700 dark:text-amber-400' },
                { key: 'low', label: 'Low / Optional Enrichment', color: 'text-slate-600 dark:text-slate-400' }
              ] as const
            ).map((bucket) => (
              <button
                key={bucket.key}
                type="button"
                onClick={() => {
                  setGapSeverityFilter(bucket.key);
                  setActiveTab('gaps');
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-left transition-colors"
              >
                <p className={`text-xs font-semibold ${bucket.color}`}>{bucket.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {activeCourse.gapSeverityBreakdown[bucket.key]}
                </p>
              </button>
            ))}
          </div>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Ranked Remediation Queue (Top {Math.min(40, activeCourse.priorityQueue.length)} Actions)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weighted by official syllabus credit weight, missing core explanations, foundational hierarchy gaps, and required media/assessment dependencies.
              </p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeCourse.priorityQueue.slice(0, 40).map((gap, index) => (
                <div
                  key={gap.id}
                  className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums w-6 pt-0.5 shrink-0">
                      #{index + 1}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
                        <SeverityInline severity={gap.severity} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {gap.subjectCode} · {gap.unitNo}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          · {gap.topicTitle}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {gap.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Why ranked here: {gap.priorityReason}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pl-9 lg:pl-0">
                    <button
                      type="button"
                      onClick={() => {
                        const t = findTopicReport(gap.topicId);
                        if (t) setInspectedTopic(t);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        nav.openEnrichmentWorkspace({
                          syllabusId: gap.courseId,
                          subjectCode: gap.subjectCode,
                          topicId: gap.topicId,
                          sectionKey: gapCategoryToEnrichmentSection(gap.category),
                          returnTo: 'coverage_analyzer'
                        })
                      }
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <FilePenLine className="w-3.5 h-3.5" />
                      <span>Enrich</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchGapAction(gap.suggestedAction, nav)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>{gap.suggestedAction.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ==================== AUDIT HISTORY TAB ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Local Audit Snapshots &amp; Coverage Diffing
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare past snapshots stored in browser localStorage against new audits as you attach textbooks, visuals, 3D assets, and PYQs.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveManualSnapshot}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                Record Snapshot Now
              </button>
              {snapshots.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSnapshots(clearAuditSnapshots())}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          </div>

          {courseSnapshots.length >= 2 && historyDiff && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold">Snapshot Comparison</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={compareBaselineId}
                    onChange={(e) => setCompareBaselineId(e.target.value)}
                    aria-label="Baseline snapshot"
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {courseSnapshots.map((s) => (
                      <option key={s.snapshotId} value={s.snapshotId}>
                        Baseline: {new Date(s.timestamp).toLocaleString()} ({s.overallCompletenessPct}%)
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">vs</span>
                  <select
                    value={compareTargetId}
                    onChange={(e) => setCompareTargetId(e.target.value)}
                    aria-label="Target snapshot"
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {courseSnapshots.map((s) => (
                      <option key={s.snapshotId} value={s.snapshotId}>
                        Compare: {new Date(s.timestamp).toLocaleString()} ({s.overallCompletenessPct}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400">Content Completeness Delta</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {historyDiff.completenessDeltaPct > 0 ? '+' : ''}
                    {historyDiff.completenessDeltaPct}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400">Resource Coverage Delta</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {historyDiff.resourceCoverageDeltaPct > 0 ? '+' : ''}
                    {historyDiff.resourceCoverageDeltaPct}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400">Newly Linked Resources</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {historyDiff.newlyLinkedResourcesCount > 0 ? '+' : ''}
                    {historyDiff.newlyLinkedResourcesCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400">Gaps Resolved</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {historyDiff.resolvedGapCountDelta > 0 ? '+' : ''}
                    {historyDiff.resolvedGapCountDelta}
                  </p>
                </div>
              </div>

              {(historyDiff.newlyCompletedTopics.length > 0 ||
                historyDiff.improvedTopics.length > 0 ||
                historyDiff.newlyIdentifiedGaps.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Newly Completed Topics ({historyDiff.newlyCompletedTopics.length})
                    </p>
                    {historyDiff.newlyCompletedTopics.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400">None between these snapshots.</p>
                    ) : (
                      <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                        {historyDiff.newlyCompletedTopics.slice(0, 6).map((t) => (
                          <li key={t.topicId}>
                            {t.subjectCode} · {t.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-sky-700 dark:text-sky-400">
                      Improved Content / Links ({historyDiff.improvedTopics.length})
                    </p>
                    {historyDiff.improvedTopics.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400">None between these snapshots.</p>
                    ) : (
                      <ul className="space-y-1 text-slate-700 dark:text-slate-300 tabular-nums">
                        {historyDiff.improvedTopics.slice(0, 6).map((t) => (
                          <li key={t.topicId}>
                            {t.subjectCode} · {t.title} ({t.previousPct}% → {t.currentPct}%)
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-amber-700 dark:text-amber-400">
                      Newly Identified Gaps ({historyDiff.newlyIdentifiedGaps.length})
                    </p>
                    {historyDiff.newlyIdentifiedGaps.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400">None between these snapshots.</p>
                    ) : (
                      <ul className="space-y-1 text-slate-700 dark:text-slate-300 tabular-nums">
                        {historyDiff.newlyIdentifiedGaps.slice(0, 6).map((t) => (
                          <li key={t.topicId}>
                            {t.subjectCode} · {t.title} (+{t.currentGapCount - t.previousGapCount})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No topic-level differences detected between the two selected snapshots yet. Add resources, PDFs, 3D assets, or PYQs and click &quot;Run Fresh Audit&quot; to track changes.
                </p>
              )}
            </section>
          )}

          {/* Recorded Snapshots Table */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recorded Snapshots ({courseSnapshots.length})
              </h3>
            </div>
            {courseSnapshots.length === 0 ? (
              <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
                No snapshots saved yet. Click &quot;Record Snapshot Now&quot; or &quot;Run Fresh Audit&quot; above.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {courseSnapshots.map((snap) => (
                  <div
                    key={snap.snapshotId}
                    className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {new Date(snap.timestamp).toLocaleString()}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {snap.totalTopics} topics · {snap.totalLinkedResourceItems} linked resource items
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                      <span>
                        Completeness: <strong>{snap.overallCompletenessPct}%</strong>
                      </span>
                      <span>
                        Resources: <strong>{snap.overallResourceCoveragePct}%</strong>
                      </span>
                      <span>
                        Critical gaps:{' '}
                        <strong className="text-rose-700 dark:text-rose-400">
                          {snap.gapSeverityBreakdown.critical}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Topic Inspection Drawer / Modal */}
      <TopicDetailPanel topic={inspectedTopic} onClose={() => setInspectedTopic(null)} />
    </div>
  );
}
