import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ExternalLink,
  GitCompare,
  Lock,
  Scale,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import {
  ACCESS_TYPE_LABELS,
  CLASSIFICATION_LABELS,
  ContentAccessType,
  DEPARTMENT_LABELS,
  PharmacopoeiaClassification,
  PharmacopoeiaDepartmentKey,
  PharmacopoeiaDirectoryEntry,
  PharmacopoeiaUserStore
} from './types';

interface PharmacopoeiaDirectoryProps {
  userStore: PharmacopoeiaUserStore;
  onSelectEntry: (entryId: string) => void;
  onToggleBookmark: (entryId: string) => Promise<void>;
  onAddToCompare: (entryId: string) => void;
}

export default function PharmacopoeiaDirectory({
  userStore,
  onSelectEntry,
  onToggleBookmark,
  onAddToCompare
}: PharmacopoeiaDirectoryProps) {
  const [classificationFilter, setClassificationFilter] = useState<
    PharmacopoeiaClassification | 'all'
  >('all');
  const [accessFilter, setAccessFilter] = useState<ContentAccessType | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<PharmacopoeiaDepartmentKey | 'all'>(
    'all'
  );

  const filteredEntries = useMemo(() => {
    return PHARMACOPOEIA_DIRECTORY.filter((entry) => {
      if (classificationFilter !== 'all' && entry.classification !== classificationFilter) {
        return false;
      }
      if (accessFilter !== 'all' && entry.contentAccessType !== accessFilter) {
        return false;
      }
      if (
        departmentFilter !== 'all' &&
        !entry.relevantDepartments.includes(departmentFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [classificationFilter, accessFilter, departmentFilter]);

  const primaryList = filteredEntries.filter(
    (e) => e.classification === 'primary_pharmacopoeia'
  );
  const internationalList = filteredEntries.filter(
    (e) => e.classification === 'international_pharmacopoeia'
  );
  const referenceBookList = filteredEntries.filter(
    (e) => e.classification === 'reference_book'
  );

  const renderEntryCard = (entry: PharmacopoeiaDirectoryEntry) => {
    const isBookmarked = userStore.bookmarkedIds.includes(entry.id);
    const safeUrl = sanitizeHttpUrl(entry.officialWebsite);
    const isPublic = entry.contentAccessType === 'public';
    const isRestricted = entry.contentAccessType === 'restricted';

    const AccessIcon = isPublic ? ShieldCheck : isRestricted ? ShieldAlert : Lock;
    const accessColor = isPublic
      ? 'text-emerald-700 dark:text-emerald-400'
      : isRestricted
      ? 'text-rose-700 dark:text-rose-400'
      : 'text-amber-700 dark:text-amber-400';

    return (
      <article
        key={entry.id}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-colors"
      >
        <div className="space-y-3">
          {/* Top Metadata Line (Zero-pill typography) */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {entry.abbreviation}
                </span>
                <span aria-hidden="true">·</span>
                <span>{entry.countryOrRegion}</span>
                <span aria-hidden="true">·</span>
                <span className={`inline-flex items-center gap-1 font-medium ${accessColor}`}>
                  <AccessIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{ACCESS_TYPE_LABELS[entry.contentAccessType]}</span>
                </span>
              </p>

              <button
                type="button"
                onClick={() => onSelectEntry(entry.id)}
                className="text-left group block w-full"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {entry.fullName}
                </h3>
              </button>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {entry.issuingOrganization}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleBookmark(entry.id)}
              className={`min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg border transition-colors shrink-0 ${
                isBookmarked
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600'
              }`}
              aria-label={isBookmarked ? `Remove bookmark for ${entry.abbreviation}` : `Bookmark ${entry.abbreviation}`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {entry.description}
          </p>

          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <p>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Scope: </span>
              {entry.scope}
            </p>
            <p>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Departments: </span>
              {entry.relevantDepartments.map((d) => DEPARTMENT_LABELS[d]).join(' · ')}
            </p>
          </div>
        </div>

        <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectEntry(entry.id)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <span>Inspect Reference</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onAddToCompare(entry.id)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Compare</span>
            </button>
          </div>

          {safeUrl && (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              <span>Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      {/* Directory Filter Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Pharmacopoeia &amp; Standards Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Statutory pharmacopoeias are organized separately from tertiary clinical drug reference works.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            Showing {filteredEntries.length} of {PHARMACOPOEIA_DIRECTORY.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={classificationFilter}
            onChange={(e) =>
              setClassificationFilter(e.target.value as PharmacopoeiaClassification | 'all')
            }
            aria-label="Filter by reference classification"
            className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Classifications</option>
            <option value="primary_pharmacopoeia">
              {CLASSIFICATION_LABELS.primary_pharmacopoeia}
            </option>
            <option value="international_pharmacopoeia">
              {CLASSIFICATION_LABELS.international_pharmacopoeia}
            </option>
            <option value="reference_book">
              {CLASSIFICATION_LABELS.reference_book}
            </option>
          </select>

          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as ContentAccessType | 'all')}
            aria-label="Filter by online access status"
            className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Access Statuses</option>
            <option value="public">{ACCESS_TYPE_LABELS.public}</option>
            <option value="subscription">{ACCESS_TYPE_LABELS.subscription}</option>
            <option value="licensed">{ACCESS_TYPE_LABELS.licensed}</option>
            <option value="restricted">{ACCESS_TYPE_LABELS.restricted}</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value as PharmacopoeiaDepartmentKey | 'all')
            }
            aria-label="Filter by pharmaceutical subject"
            className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Pharmaceutical Subjects</option>
            {(Object.keys(DEPARTMENT_LABELS) as PharmacopoeiaDepartmentKey[]).map((key) => (
              <option key={key} value={key}>
                {DEPARTMENT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {filteredEntries.length === 0 && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
          No pharmacopoeias or reference entries matched your current filters.
        </div>
      )}

      {primaryList.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Primary Pharmacopoeias</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {primaryList.length} compendia
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {primaryList.map(renderEntryCard)}
          </div>
        </section>
      )}

      {internationalList.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>International &amp; Additional Pharmacopoeias</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {internationalList.length} compendia
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {internationalList.map(renderEntryCard)}
          </div>
        </section>
      )}

      {referenceBookList.length > 0 && (
        <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Additional Pharmaceutical Reference (Non-Pharmacopoeia)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clinical and tertiary drug reference books provide therapeutic and formulation information, not statutory pharmacopoeial test specifications.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {referenceBookList.map(renderEntryCard)}
          </div>
        </section>
      )}
    </div>
  );
}
