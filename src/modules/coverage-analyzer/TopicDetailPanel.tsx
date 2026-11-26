import React, { useEffect } from 'react';
import { ArrowUpRight, FilePenLine, ShieldAlert, X } from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { componentKeyToDefaultEnrichmentSection } from '../enrichment-workspace/sectionCatalog';
import { dispatchGapAction } from './actionDispatcher';
import { TopicCoverageReport } from './types';
import {
  CheckStatusInline,
  CoverageStatusInline,
  MetricBar,
  SeverityInline
} from './uiHelpers';

interface TopicDetailPanelProps {
  topic: TopicCoverageReport | null;
  onClose: () => void;
}

export default function TopicDetailPanel({ topic, onClose }: TopicDetailPanelProps) {
  const nav = useLibraryNavigation();

  useEffect(() => {
    if (!topic) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [topic, onClose]);

  if (!topic) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Topic Audit Detail: ${topic.title}`}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {topic.subjectCode} · {topic.unitNo} · {topic.domainMode.replace(/_/g, ' ')} ·{' '}
              {topic.subtopicCount} subtopics · {topic.verifiedContentChars.toLocaleString()} verified
              chars
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {topic.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
              <CoverageStatusInline status={topic.status} />
              <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                Content Score: <strong className="text-slate-900 dark:text-slate-100">{topic.completenessPct}%</strong>
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                Resource Coverage:{' '}
                <strong className="text-slate-900 dark:text-slate-100">{topic.resourceCoveragePct}%</strong>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Learner Progress: {topic.learnerProgressPct}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                nav.openEnrichmentWorkspace({
                  syllabusId: topic.courseId,
                  subjectCode: topic.subjectCode,
                  topicId: topic.id,
                  returnTo: 'coverage_analyzer'
                });
              }}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <FilePenLine className="w-3.5 h-3.5" />
              <span>Enrich Topic Content</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
              aria-label="Close topic inspection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Rationale & Verification Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Classification Rationale
              </p>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {topic.statusReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              <div className="pt-1 space-y-1">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>Applicable Components Ready</span>
                  <span>
                    {topic.presentComponentsCount} present · {topic.partialComponentsCount} partial ·{' '}
                    {topic.missingComponentsCount} missing ({topic.applicableComponentsCount} applicable)
                  </span>
                </div>
                <MetricBar
                  pct={topic.completenessPct}
                  tone={
                    topic.completenessPct >= 75
                      ? 'emerald'
                      : topic.completenessPct >= 45
                      ? 'amber'
                      : 'rose'
                  }
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Direct Remediation Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {topic.quickActions.map((act) => (
                  <button
                    key={act.label}
                    type="button"
                    onClick={() => {
                      onClose();
                      dispatchGapAction(act, nav);
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>{act.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
              {topic.needsVerification && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2 text-xs text-sky-700 dark:text-sky-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{topic.verificationReasons.join(' ')}</span>
                </div>
              )}
              {topic.verificationSummary && topic.verificationSummary.totalClaims > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                  <strong>Textbook Claim Audit:</strong>{' '}
                  {topic.verificationSummary.multipleBooksCount +
                    topic.verificationSummary.textbookSupportedCount}
                  /{topic.verificationSummary.totalClaims} textbook-supported ·{' '}
                  {topic.verificationSummary.partiallySupportedCount} partial ·{' '}
                  {topic.verificationSummary.conflictingCount} conflicting ·{' '}
                  {topic.verificationSummary.reviewedCount} reviewed
                </div>
              )}
            </div>
          </div>

          {/* Open Gaps for This Topic */}
          {topic.gaps.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Identified Gaps ({topic.gaps.length})
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
                {topic.gaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityInline severity={gap.severity} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          · Priority {gap.priorityScore}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {gap.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{gap.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        dispatchGapAction(gap.suggestedAction, nav);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <span>{gap.suggestedAction.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Academic Components Matrix (16 Checks) */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Academic Component Completeness (Topic-Specific Applicability)
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
              {topic.componentChecks.map((check) => (
                <div
                  key={check.key}
                  className="px-3.5 py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start text-xs"
                >
                  <div className="sm:col-span-3 font-semibold text-slate-900 dark:text-slate-100">
                    {check.label}
                  </div>
                  <div className="sm:col-span-2">
                    <CheckStatusInline status={check.status} />
                  </div>
                  <div className="sm:col-span-7 text-slate-600 dark:text-slate-400 flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p>{check.status === 'not_applicable' ? check.applicabilityReason : check.evidence}</p>
                      {check.status !== 'not_applicable' && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-500">
                          Rule: {check.applicabilityReason}
                        </p>
                      )}
                    </div>
                    {(check.status === 'missing' || check.status === 'partial') && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          nav.openEnrichmentWorkspace({
                            syllabusId: topic.courseId,
                            subjectCode: topic.subjectCode,
                            topicId: topic.id,
                            sectionKey: componentKeyToDefaultEnrichmentSection(check.key),
                            returnTo: 'coverage_analyzer'
                          });
                        }}
                        className="min-h-[28px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0 transition-colors"
                      >
                        Enrich
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Resource Coverage Matrix (10 Checks) */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Connected Learning Resources ({topic.totalLinkedResourceItems} linked items)
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
              {topic.resourceChecks.map((res) => (
                <div
                  key={res.key}
                  className="px-3.5 py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start text-xs"
                >
                  <div className="sm:col-span-3 font-semibold text-slate-900 dark:text-slate-100">
                    {res.label}
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-2 tabular-nums">
                    <CheckStatusInline status={res.status} />
                    {res.applicable && (
                      <span className="text-slate-500 dark:text-slate-400">({res.count})</span>
                    )}
                  </div>
                  <div className="sm:col-span-6 text-slate-600 dark:text-slate-400 space-y-1">
                    <p>{res.applicable ? res.evidence : res.applicabilityReason}</p>
                    {res.linkedItems.length > 0 && (
                      <ul className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {res.linkedItems.slice(0, 4).map((item) => (
                          <li key={item.id} className="truncate">
                            · {item.title} ({item.source})
                          </li>
                        ))}
                        {res.linkedItems.length > 4 && (
                          <li className="text-slate-400">+{res.linkedItems.length - 4} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Subtopics Summary */}
          {topic.subtopicsSummary.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Subtopic Coverage ({topic.subtopicsSummary.length})
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
                {topic.subtopicsSummary.map((st) => (
                  <div
                    key={st.id}
                    className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {st.title}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {st.summaryLength} chars
                      {st.hasStructureLink ? ' · Anatomy linked' : ''}
                      {st.hasEngineDetail ? ' · Engine notes' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
