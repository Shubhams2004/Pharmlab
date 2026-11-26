import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  GitCompare,
  Save
} from 'lucide-react';
import { LibraryBookMeta } from '../knowledge-library/types';
import { ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import { buildPharmacopoeiaComparisonMatrix } from './searchEngine';
import { PharmacopoeiaUserStore } from './types';

interface PharmacopoeiaComparisonProps {
  selectedEntryIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  onSaveComparisonNote: (entryId: string, note: string) => Promise<void>;
  onSelectEntry: (entryId: string) => void;
}

export default function PharmacopoeiaComparison({
  selectedEntryIds,
  onChangeSelectedIds,
  userStore,
  books,
  referenceItems,
  onSaveComparisonNote,
  onSelectEntry
}: PharmacopoeiaComparisonProps) {
  const [focusQuery, setFocusQuery] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(
    () => ({ ...userStore.comparisonNotesByKey })
  );
  const [savedId, setSavedId] = useState<string | null>(null);

  const toggleSelect = (entryId: string) => {
    if (selectedEntryIds.includes(entryId)) {
      if (selectedEntryIds.length <= 1) return;
      onChangeSelectedIds(selectedEntryIds.filter((id) => id !== entryId));
    } else {
      onChangeSelectedIds([...selectedEntryIds, entryId]);
    }
  };

  const matrix = useMemo(
    () =>
      buildPharmacopoeiaComparisonMatrix({
        selectedEntryIds,
        focusQuery,
        userStore,
        books,
        referenceItems
      }),
    [selectedEntryIds, focusQuery, userStore, books, referenceItems]
  );

  const handleSaveNote = async (entryId: string) => {
    await onSaveComparisonNote(entryId, noteDrafts[entryId] || '');
    setSavedId(entryId);
    window.setTimeout(() => setSavedId(null), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Side-by-Side Pharmacopoeia Comparison Workspace</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select multiple pharmacopoeias (or Martindale for scope contrast) to compare reference availability, accessibility status, edition records, official portals, and your verified notes.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            {matrix.length} selected
          </span>
        </div>

        {/* Non-fabrication Integrity Notice */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Scientific Integrity Guarantee:</strong> This workspace compares verified availability, official portal links, edition metadata, and user-recorded notes only. It never fabricates assay tolerances, impurity limits, acceptance criteria, or unverified monograph differences. Always consult the official portal for binding specifications.
          </p>
        </div>

        {/* Selector Chips */}
        <div className="flex flex-wrap gap-2">
          {PHARMACOPOEIA_DIRECTORY.map((entry) => {
            const active = selectedEntryIds.includes(entry.id);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => toggleSelect(entry.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                }`}
              >
                {entry.abbreviation}
                {!entry.isPharmacopoeia ? ' (Ref. Book)' : ''}
              </button>
            );
          })}
        </div>

        {/* Topic / Drug / Category Scope Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
            Focus Drug / Monograph / Test Category:
          </label>
          <input
            type="text"
            value={focusQuery}
            onChange={(e) => setFocusQuery(e.target.value)}
            placeholder="e.g., dissolution, limit tests, excipients, crude drugs, paracetamol..."
            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
          />
        </div>
      </section>

      {/* Side-by-Side Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 w-44">
                Comparison Dimension
              </th>
              {matrix.map((cell) => (
                <th key={cell.entry.id} className="p-4 align-top">
                  <button
                    type="button"
                    onClick={() => onSelectEntry(cell.entry.id)}
                    className="text-left group"
                  >
                    <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {cell.entry.abbreviation}
                    </span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white group-hover:underline">
                      {cell.entry.fullName}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
            <tr>
              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                Classification
              </td>
              {matrix.map((cell) => (
                <td key={cell.entry.id} className="p-4 text-slate-600 dark:text-slate-300 align-top">
                  {cell.classificationLabel}
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                Issuing Authority &amp; Region
              </td>
              {matrix.map((cell) => (
                <td key={cell.entry.id} className="p-4 text-slate-600 dark:text-slate-300 align-top">
                  <span className="block font-medium text-slate-900 dark:text-white">
                    {cell.entry.countryOrRegion}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {cell.entry.issuingOrganization}
                  </span>
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                Online Access &amp; Availability
              </td>
              {matrix.map((cell) => (
                <td key={cell.entry.id} className="p-4 text-slate-600 dark:text-slate-300 align-top space-y-1">
                  <span className="block font-semibold text-slate-900 dark:text-white">
                    {cell.accessTypeLabel}
                  </span>
                  <span className="block text-xs leading-relaxed">{cell.availabilityStatus}</span>
                </td>
              ))}
            </tr>

            {focusQuery.trim().length >= 2 && (
              <tr>
                <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                  Scope Match for &ldquo;{focusQuery.trim()}&rdquo;
                </td>
                {matrix.map((cell) => (
                  <td key={cell.entry.id} className="p-4 align-top text-xs">
                    {cell.coversSelectedFocus ? (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Topic covered in directory scope metadata (verify exact monograph on official portal)
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        Not explicitly listed in local scope summary — check official portal directly
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            <tr>
              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                Verified / Recorded Edition Metadata
              </td>
              {matrix.map((cell) => (
                <td key={cell.entry.id} className="p-4 text-xs text-slate-600 dark:text-slate-300 align-top leading-relaxed">
                  {cell.editionMetadata}
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                Local Imported PDFs
              </td>
              {matrix.map((cell) => (
                <td key={cell.entry.id} className="p-4 text-xs text-slate-700 dark:text-slate-300 align-top tabular-nums">
                  {cell.linkedLocalPdfCount > 0
                    ? `${cell.linkedLocalPdfCount} PDF document(s) linked locally`
                    : 'No local PDF attached'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                Official Source Links
              </td>
              {matrix.map((cell) => {
                const portal = sanitizeHttpUrl(cell.officialPortalUrl);
                const notices = sanitizeHttpUrl(cell.officialNoticesUrl);
                return (
                  <td key={cell.entry.id} className="p-4 align-top space-y-1.5 text-xs">
                    {portal && (
                      <a
                        href={portal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {notices && notices !== portal && (
                      <a
                        href={notices}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-slate-600 dark:text-slate-300 hover:underline"
                      >
                        Updates &amp; Notices
                      </a>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="p-4 font-semibold text-slate-700 dark:text-slate-200 align-top">
                Your Comparison Notes
              </td>
              {matrix.map((cell) => (
                <td key={cell.entry.id} className="p-4 align-top space-y-2">
                  <textarea
                    rows={3}
                    value={noteDrafts[cell.entry.id] ?? cell.comparisonNote}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({ ...prev, [cell.entry.id]: e.target.value }))
                    }
                    placeholder={`Notes for comparing ${cell.entry.abbreviation}...`}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNote(cell.entry.id)}
                    className="min-h-[30px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    <span>{savedId === cell.entry.id ? 'Saved' : 'Save Note'}</span>
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
