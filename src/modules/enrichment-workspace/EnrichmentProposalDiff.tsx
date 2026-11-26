import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  RotateCcw,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import {
  EnrichedSectionEntry,
  EnrichmentProvenance,
  EnrichmentQuestionEntry,
  EnrichmentSourceAttachment
} from '../study-mode/types';
import { PROVENANCE_LABELS } from './sectionCatalog';

interface EnrichmentProposalDiffProps {
  sectionLabel: string;
  existingProse: string[];
  existingBullets: string[];
  previouslyApproved?: EnrichedSectionEntry;
  proposedProse: string;
  proposedBullets: string[];
  proposedFormulas: string[];
  proposedQuestions: EnrichmentQuestionEntry[];
  proposedProvenance: EnrichmentProvenance;
  proposedAttachments: EnrichmentSourceAttachment[];
  isAiDraft: boolean;
  onAcceptAndMerge: () => void;
  onModifyInEditor: () => void;
  onRejectProposal: () => void;
  onUndoLastMerge?: () => void;
}

export default function EnrichmentProposalDiff({
  sectionLabel,
  existingProse,
  existingBullets,
  previouslyApproved,
  proposedProse,
  proposedBullets,
  proposedFormulas,
  proposedQuestions,
  proposedProvenance,
  proposedAttachments,
  isAiDraft,
  onAcceptAndMerge,
  onModifyInEditor,
  onRejectProposal,
  onUndoLastMerge
}: EnrichmentProposalDiffProps) {
  const provMeta = PROVENANCE_LABELS[proposedProvenance];
  const hasExisting =
    existingProse.length > 0 ||
    existingBullets.length > 0 ||
    Boolean(previouslyApproved && (previouslyApproved.prose || previouslyApproved.bullets.length > 0));

  return (
    <section
      aria-label={`Review proposed enrichment for ${sectionLabel}`}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review Before Merge · Non-Destructive Additive Preview
          </p>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Compare Existing vs Proposed: {sectionLabel}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`font-semibold ${provMeta.toneClass}`}>{provMeta.label}</span>
          {isAiDraft && (
            <span className="text-amber-700 dark:text-amber-300 font-semibold">
              · AI-Assisted Draft (Review Required)
            </span>
          )}
        </div>
      </div>

      {isAiDraft && (
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/25 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            This proposal includes AI-drafted text. Verify every scientific statement, dosage/limit value, and mechanism against attached textbooks or pharmacopoeias before accepting.
          </span>
        </div>
      )}

      {proposedProvenance === 'reference_supported' && proposedAttachments.length === 0 && (
        <div className="px-5 py-3 bg-sky-500/10 border-b border-sky-500/25 flex items-start gap-2 text-xs text-sky-900 dark:text-sky-200">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
          <span>
            No section-level source attachment is linked yet. Attach a Reference Center monograph, PDF textbook, or verified open source—or switch provenance to User-Written / Needs Verification.
          </span>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Left: Existing Content (Preserved) */}
        <div className="p-5 space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Existing Academic Content (Preserved)
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Read-only baseline
            </span>
          </div>

          {!hasExisting ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              No existing content detected in Study Mode / Anatomy Catalog / Academic Engine for this section yet. Accepting will establish the baseline enrichment.
            </p>
          ) : (
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {existingProse.map((p, idx) => (
                <p key={`ep_${idx}`} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
              {existingBullets.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {existingBullets.slice(0, 8).map((b, idx) => (
                    <li key={`eb_${idx}`}>{b}</li>
                  ))}
                  {existingBullets.length > 8 && (
                    <li className="text-slate-500">+{existingBullets.length - 8} more items</li>
                  )}
                </ul>
              )}
              {previouslyApproved && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Previously Approved Enrichment ({new Date(previouslyApproved.updatedAt).toLocaleDateString()})
                  </p>
                  {previouslyApproved.prose && (
                    <p className="text-xs whitespace-pre-line">{previouslyApproved.prose}</p>
                  )}
                  {previouslyApproved.bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-xs">
                      {previouslyApproved.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Proposed Enrichment */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Proposed Additive Enrichment
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {proposedProse.trim().length} chars · {proposedBullets.length} points
            </span>
          </div>

          {proposedProse.trim() ? (
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {proposedProse.trim()}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">No prose paragraph entered.</p>
          )}

          {proposedBullets.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              {proposedBullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          )}

          {proposedFormulas.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Formulas &amp; Worked Calculations
              </p>
              {proposedFormulas.map((f, idx) => (
                <p key={idx} className="font-mono text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                  {f}
                </p>
              ))}
            </div>
          )}

          {proposedQuestions.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Important Questions ({proposedQuestions.length})
              </p>
              {proposedQuestions.map((q) => (
                <div key={q.id} className="text-xs space-y-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    [{q.category.toUpperCase()}{q.marks ? ` · ${q.marks}M` : ''}] {q.prompt}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">{q.answerGuidance}</p>
                </div>
              ))}
            </div>
          )}

          {proposedAttachments.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Attached Sources ({proposedAttachments.length})
              </p>
              <ul className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                {proposedAttachments.map((att) => (
                  <li key={att.id}>
                    · {att.title} {att.subtitle ? `(${att.subtitle})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Review Actions */}
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAcceptAndMerge}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept &amp; Merge</span>
          </button>

          <button
            type="button"
            onClick={onModifyInEditor}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Edit3 className="w-4 h-4" />
            <span>Modify in Editor</span>
          </button>

          <button
            type="button"
            onClick={onRejectProposal}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-500/50 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Proposal</span>
          </button>
        </div>

        {previouslyApproved?.previousSnapshot && onUndoLastMerge && (
          <button
            type="button"
            onClick={onUndoLastMerge}
            className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Last Merge</span>
          </button>
        )}
      </div>
    </section>
  );
}
