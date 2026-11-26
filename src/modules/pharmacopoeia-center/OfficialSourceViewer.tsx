import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Info,
  Lock,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import {
  ACCESS_TYPE_LABELS,
  OfficialSourceCheckRecord,
  PharmacopoeiaDirectoryEntry
} from './types';

interface OfficialSourceViewerProps {
  entry: PharmacopoeiaDirectoryEntry;
  sourceCheck?: OfficialSourceCheckRecord;
  onMarkChecked?: (entryId: string, url: string) => void;
  compact?: boolean;
}

export default function OfficialSourceViewer({
  entry,
  sourceCheck,
  onMarkChecked,
  compact = false
}: OfficialSourceViewerProps) {
  const [showEmbedNotice, setShowEmbedNotice] = useState(false);

  const safePrimaryUrl = sanitizeHttpUrl(entry.officialWebsite);
  const isPublic = entry.contentAccessType === 'public';
  const isRestricted = entry.contentAccessType === 'restricted';

  const AccessIcon = isPublic ? ShieldCheck : isRestricted ? ShieldAlert : Lock;
  const accessTone = isPublic
    ? 'text-emerald-700 dark:text-emerald-400'
    : isRestricted
    ? 'text-rose-700 dark:text-rose-400'
    : 'text-amber-700 dark:text-amber-400';

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">{entry.abbreviation}</span>
            <span aria-hidden="true">·</span>
            <span>{entry.countryOrRegion}</span>
            <span aria-hidden="true">·</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${accessTone}`}>
              <AccessIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{ACCESS_TYPE_LABELS[entry.contentAccessType]}</span>
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {entry.issuingOrganization}
          </h3>
        </div>

        {safePrimaryUrl && (
          <a
            href={safePrimaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onMarkChecked?.(entry.id, safePrimaryUrl)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Open Official Portal</span>
          </a>
        )}
      </div>

      {!compact && (
        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>{entry.onlineAccessibilityStatus}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Access Scope &amp; Limitations: </span>
            {entry.accessLimitations}
          </p>
        </div>
      )}

      {/* Official Links List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {entry.officialLinks.map((link) => {
          const safeLink = sanitizeHttpUrl(link.url);
          if (!safeLink) return null;
          return (
            <div
              key={link.id}
              className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </p>
                {link.note && !compact && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{link.note}</p>
                )}
              </div>

              <a
                href={safeLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onMarkChecked?.(entry.id, safeLink)}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Footer: Verified Check Timestamp & Direct Navigation Notice */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 tabular-nums">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {sourceCheck ? (
            <span>
              Last verified locally:{' '}
              <strong className="text-slate-700 dark:text-slate-200 font-medium">
                {new Date(sourceCheck.lastCheckedAt).toLocaleDateString()}
              </strong>
            </span>
          ) : (
            <span>Not checked in this browser yet</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onMarkChecked && safePrimaryUrl && (
            <button
              type="button"
              onClick={() => onMarkChecked(entry.id, safePrimaryUrl)}
              className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record Verification Today</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowEmbedNotice((prev) => !prev)}
            className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Why external tab?</span>
          </button>
        </div>
      </div>

      {showEmbedNotice && (
        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 leading-relaxed">
          Official pharmacopoeia and publisher portals (IPC, MHRA/BP, USP, EDQM, WHO, PMDA, ChP, Pharmaceutical Press) restrict iframe embedding via X-Frame-Options/CSP headers and copyright rules. Direct external navigation ensures authentic viewing without copying protected monograph text.
        </p>
      )}
    </article>
  );
}
