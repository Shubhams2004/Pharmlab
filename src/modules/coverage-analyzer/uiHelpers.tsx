import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  MinusCircle,
  ShieldAlert
} from 'lucide-react';
import {
  ComponentCheckStatus,
  CoverageStatus,
  GapCategory,
  GapSeverity
} from './types';

export const COVERAGE_STATUS_META: Record<
  CoverageStatus,
  { label: string; shortLabel: string; textClass: string; barClass: string }
> = {
  complete: {
    label: 'Complete',
    shortLabel: 'Complete',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    barClass: 'bg-emerald-600 dark:bg-emerald-500'
  },
  substantially_complete: {
    label: 'Substantially Complete',
    shortLabel: 'Substantial',
    textClass: 'text-teal-700 dark:text-teal-400',
    barClass: 'bg-teal-600 dark:bg-teal-500'
  },
  partially_complete: {
    label: 'Partially Complete',
    shortLabel: 'Partial',
    textClass: 'text-amber-700 dark:text-amber-400',
    barClass: 'bg-amber-500'
  },
  minimal_content: {
    label: 'Minimal Content',
    shortLabel: 'Minimal',
    textClass: 'text-orange-700 dark:text-orange-400',
    barClass: 'bg-orange-500'
  },
  missing_content: {
    label: 'Missing Content',
    shortLabel: 'Missing',
    textClass: 'text-rose-700 dark:text-rose-400',
    barClass: 'bg-rose-600 dark:bg-rose-500'
  },
  needs_verification: {
    label: 'Needs Verification',
    shortLabel: 'Verify',
    textClass: 'text-sky-700 dark:text-sky-400',
    barClass: 'bg-sky-600 dark:bg-sky-500'
  }
};

export const SEVERITY_META: Record<
  GapSeverity,
  { label: string; textClass: string }
> = {
  critical: {
    label: 'Critical',
    textClass: 'text-rose-700 dark:text-rose-400'
  },
  high: {
    label: 'High',
    textClass: 'text-orange-700 dark:text-orange-400'
  },
  medium: {
    label: 'Medium',
    textClass: 'text-amber-700 dark:text-amber-400'
  },
  low: {
    label: 'Low',
    textClass: 'text-slate-600 dark:text-slate-400'
  }
};

export const GAP_CATEGORY_LABELS: Record<GapCategory, string> = {
  missing_content: 'Missing Content',
  weak_content: 'Weak / Incomplete Content',
  missing_references: 'Missing References',
  missing_visuals: 'Missing Visuals / Diagrams',
  missing_microscopy: 'Missing Microscopy Plates',
  missing_3d: 'Missing 3D Models',
  missing_experiments: 'Missing Practicals',
  missing_simulations: 'Missing Simulations',
  missing_assessments: 'Missing Assessments / MCQs',
  missing_pyq: 'Missing PYQs',
  hierarchy_incomplete: 'Incomplete Hierarchy',
  verification_issue: 'Needs Verification'
};

export function CoverageStatusInline({ status }: { status: CoverageStatus }) {
  const meta = COVERAGE_STATUS_META[status];
  const Icon =
    status === 'complete' || status === 'substantially_complete'
      ? CheckCircle2
      : status === 'needs_verification'
      ? ShieldAlert
      : status === 'missing_content'
      ? AlertCircle
      : status === 'minimal_content'
      ? AlertTriangle
      : CircleDashed;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.textClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
}

export function SeverityInline({ severity }: { severity: GapSeverity }) {
  const meta = SEVERITY_META[severity];
  const Icon =
    severity === 'critical'
      ? AlertCircle
      : severity === 'high'
      ? AlertTriangle
      : CircleDashed;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.textClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
}

export function CheckStatusInline({ status }: { status: ComponentCheckStatus }) {
  if (status === 'present') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Present</span>
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <CircleDashed className="w-3.5 h-3.5 shrink-0" />
        <span>Partial</span>
      </span>
    );
  }
  if (status === 'not_applicable') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        <MinusCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Not Applicable</span>
      </span>
    );
  }
  if (status === 'needs_review') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-400">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>Needs Review</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>Missing</span>
    </span>
  );
}

export function MetricBar({
  pct,
  tone = 'emerald'
}: {
  pct: number;
  tone?: 'emerald' | 'sky' | 'amber' | 'rose';
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const fill =
    tone === 'rose'
      ? 'bg-rose-600 dark:bg-rose-500'
      : tone === 'amber'
      ? 'bg-amber-500'
      : tone === 'sky'
      ? 'bg-sky-600 dark:bg-sky-500'
      : 'bg-emerald-600 dark:bg-emerald-500';
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <div className={`h-full ${fill} transition-all duration-300`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
