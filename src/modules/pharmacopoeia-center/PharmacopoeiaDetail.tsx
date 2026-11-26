import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CalendarClock,
  ExternalLink,
  FileText,
  GitCompare,
  Layers,
  NotebookPen,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { LibraryBookMeta } from '../knowledge-library/types';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import OfficialSourceViewer from './OfficialSourceViewer';
import PharmacopoeiaAcademicLinks from './PharmacopoeiaAcademicLinks';
import {
  ANALYTICAL_TEST_FACETS,
  STANDARD_CATEGORY_FACETS
} from './pharmacopoeiaCatalog';
import {
  CLASSIFICATION_LABELS,
  DEPARTMENT_LABELS,
  EditionAmendmentRecord,
  PharmacopoeiaAcademicLink,
  PharmacopoeiaDirectoryEntry,
  PharmacopoeiaUserStore
} from './types';

interface PharmacopoeiaDetailProps {
  entry: PharmacopoeiaDirectoryEntry;
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
  onBack: () => void;
  onToggleBookmark: (entryId: string) => Promise<void>;
  onSaveNote: (entryId: string, note: string) => Promise<void>;
  onMarkSourceChecked: (entryId: string, url: string) => Promise<void>;
  onAddEditionRecord: (record: EditionAmendmentRecord) => Promise<void>;
  onDeleteEditionRecord: (recordId: string) => Promise<void>;
  onAddAcademicLink: (link: PharmacopoeiaAcademicLink) => Promise<void>;
  onDeleteAcademicLink: (linkId: string) => Promise<void>;
  onAddToCompare: (entryId: string) => void;
}

export default function PharmacopoeiaDetail({
  entry,
  userStore,
  books,
  referenceItems,
  referenceProfiles,
  onBack,
  onToggleBookmark,
  onSaveNote,
  onMarkSourceChecked,
  onAddEditionRecord,
  onDeleteEditionRecord,
  onAddAcademicLink,
  onDeleteAcademicLink,
  onAddToCompare
}: PharmacopoeiaDetailProps) {
  const { openKnowledgeLibrary, openReferenceCenter } = useLibraryNavigation();

  const [noteDraft, setNoteDraft] = useState(userStore.notesByEntryId[entry.id] || '');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Edition & Amendment entry form
  const [addingEdition, setAddingEdition] = useState(false);
  const [edKind, setEdKind] = useState<EditionAmendmentRecord['recordKind']>('edition');
  const [edTitle, setEdTitle] = useState('');
  const [edIdentifier, setEdIdentifier] = useState('');
  const [edDate, setEdDate] = useState('');
  const [edSourceUrl, setEdSourceUrl] = useState('');
  const [edNotes, setEdNotes] = useState('');

  useEffect(() => {
    setNoteDraft(userStore.notesByEntryId[entry.id] || '');
    setNoteSavedFeedback(false);
  }, [entry.id, userStore.notesByEntryId]);

  const isBookmarked = userStore.bookmarkedIds.includes(entry.id);
  const linkedRefItem = useMemo(
    () => referenceItems.find((r) => r.id === entry.linkedReferenceCenterId),
    [referenceItems, entry.linkedReferenceCenterId]
  );
  const linkedRefProfile = useMemo(
    () => referenceProfiles.find((p) => p.referenceId === entry.linkedReferenceCenterId),
    [referenceProfiles, entry.linkedReferenceCenterId]
  );

  const matchingBooks = useMemo(() => {
    return books.filter(
      (b) =>
        b.id === linkedRefItem?.linkedBookId ||
        b.title.toLowerCase().includes(entry.abbreviation.toLowerCase()) ||
        b.title.toLowerCase().includes(entry.fullName.toLowerCase())
    );
  }, [books, linkedRefItem, entry]);

  const entryEditions = useMemo(
    () => userStore.editionRecords.filter((r) => r.entryId === entry.id),
    [userStore.editionRecords, entry.id]
  );

  const customLinksForEntry = useMemo(
    () => userStore.customLinks.filter((l) => l.entryId === entry.id),
    [userStore.customLinks, entry.id]
  );

  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveNote(entry.id, noteDraft);
    setNoteSavedFeedback(true);
    window.setTimeout(() => setNoteSavedFeedback(false), 1800);
  };

  const handleAddEditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edTitle.trim() || !edIdentifier.trim()) return;
    await onAddEditionRecord({
      id: `ed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entryId: entry.id,
      recordKind: edKind,
      title: edTitle.trim(),
      identifier: edIdentifier.trim(),
      effectiveOrPublishedDate: edDate.trim() || undefined,
      sourceLabel: `User-recorded from ${entry.issuingOrganization}`,
      sourceUrl: sanitizeHttpUrl(edSourceUrl) || entry.officialNoticesUrl,
      notes: edNotes.trim(),
      isUserRecorded: true,
      createdAt: Date.now()
    });
    setEdTitle('');
    setEdIdentifier('');
    setEdDate('');
    setEdSourceUrl('');
    setEdNotes('');
    setAddingEdition(false);
  };

  const safeNoticesUrl = sanitizeHttpUrl(entry.officialNoticesUrl);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleBookmark(entry.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                isBookmarked
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAddToCompare(entry.id)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Compare Side-by-Side</span>
            </button>

            {entry.linkedReferenceCenterId && (
              <button
                type="button"
                onClick={() => openReferenceCenter({ referenceId: entry.linkedReferenceCenterId })}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open in Reference Center</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{CLASSIFICATION_LABELS[entry.classification]}</span>
            <span aria-hidden="true">·</span>
            <span>{entry.countryOrRegion}</span>
            <span aria-hidden="true">·</span>
            <span>{entry.abbreviation}</span>
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {entry.fullName}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
            {entry.description}
          </p>
        </div>

        {!entry.isPharmacopoeia && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <strong>Classification Notice:</strong> {entry.fullName} is categorized strictly as a{' '}
            <strong>Pharmaceutical Reference Book</strong> for clinical pharmacology and drug information—not a statutory pharmacopoeia establishing legal analytical test specifications.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Purpose &amp; Regulatory Role
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{entry.purpose}</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Compendial Scope &amp; Structure
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{entry.scope}</p>
          </div>
        </div>
      </div>

      {/* Official Source Integration */}
      <OfficialSourceViewer
        entry={entry}
        sourceCheck={userStore.sourceChecks[entry.id]}
        onMarkChecked={onMarkSourceChecked}
      />

      {/* Analytical Tests, Standard Categories & Local PDFs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Relevant Subjects, Tests &amp; Standard Categories</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Pharmaceutical Departments
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {entry.relevantDepartments.map((d) => DEPARTMENT_LABELS[d]).join(' · ')}
              </p>
            </div>

            {entry.analyticalTestCategories.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Analytical &amp; Quality Control Categories
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {entry.analyticalTestCategories
                    .map((id) => ANALYTICAL_TEST_FACETS.find((f) => f.id === id)?.title)
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            )}

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Specification Categories
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {entry.standardCategories
                  .map((id) => STANDARD_CATEGORY_FACETS.find((f) => f.id === id)?.title)
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Curriculum Highlights
              </p>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc pl-4">
                {entry.syllabusRelevance.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Local Imported PDFs & Reference Center Integration */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Local Imported PDFs &amp; Saved Links</span>
            </h3>
            <button
              type="button"
              onClick={() => openKnowledgeLibrary()}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Open PDF Library
            </button>
          </div>

          {matchingBooks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No local PDF files are currently linked to {entry.abbreviation}. If you hold an authorized institutional PDF copy, import it via Knowledge Library or Reference Center to enable offline full-text search.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {matchingBooks.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() =>
                    openKnowledgeLibrary({ bookId: book.id, pageNumber: book.lastReadPage || 1 })
                  }
                  className="w-full p-3 text-left hover:bg-white dark:hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {book.pageCount} pages · {book.hasSearchableText ? 'Full-text indexed' : 'PDF stored locally'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                    Open PDF
                  </span>
                </button>
              ))}
            </div>
          )}

          {linkedRefProfile && linkedRefProfile.sectionLinks.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Reference Center Section Links ({linkedRefProfile.sectionLinks.length})
              </p>
              <div className="space-y-1">
                {linkedRefProfile.sectionLinks.slice(0, 4).map((lnk) => (
                  <p key={lnk.id} className="text-xs text-slate-600 dark:text-slate-400">
                    • <span className="font-medium text-slate-800 dark:text-slate-200">{lnk.title}</span>
                    {lnk.note ? ` — ${lnk.note}` : ''}
                  </p>
                ))}
              </div>
            </div>
          )}

          {customLinksForEntry.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Your Saved Links ({customLinksForEntry.length})
              </p>
              <div className="space-y-1">
                {customLinksForEntry.map((lnk) => {
                  const safe = sanitizeHttpUrl(lnk.url);
                  if (!safe) return null;
                  return (
                    <a
                      key={lnk.id}
                      href={safe}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline py-1"
                    >
                      <span className="truncate">{lnk.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Edition & Amendment Tracking */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Edition, Supplement &amp; Amendment Tracking</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Displays verified baseline guidance, direct official notice links, and user-recorded edition/addendum logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {safeNoticesUrl && (
              <a
                href={safeNoticesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Official Notices Portal</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setAddingEdition((prev) => !prev)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Edition / Notice</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Verified Baseline Metadata
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {entry.verifiedEditionSummary}
          </p>
          <p className="text-slate-500 dark:text-slate-400">{entry.editionTrackingNote}</p>
        </div>

        {addingEdition && (
          <form
            onSubmit={handleAddEditionSubmit}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <select
                value={edKind}
                onChange={(e) => setEdKind(e.target.value as EditionAmendmentRecord['recordKind'])}
                aria-label="Record kind"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                <option value="edition">Edition</option>
                <option value="supplement">Supplement</option>
                <option value="amendment">Amendment</option>
                <option value="addendum">Addendum</option>
                <option value="official_notice">Official Notice / Erratum</option>
              </select>
              <input
                type="text"
                required
                value={edTitle}
                onChange={(e) => setEdTitle(e.target.value)}
                placeholder="Title (e.g., Addendum 2024)"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                required
                value={edIdentifier}
                onChange={(e) => setEdIdentifier(e.target.value)}
                placeholder="Identifier / Volume (e.g., 9th Ed.)"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={edDate}
                onChange={(e) => setEdDate(e.target.value)}
                placeholder="Observed effective/release date (optional)"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="url"
                value={edSourceUrl}
                onChange={(e) => setEdSourceUrl(e.target.value)}
                placeholder="Official notice URL (optional)"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:col-span-2"
              />
              <input
                type="text"
                value={edNotes}
                onChange={(e) => setEdNotes(e.target.value)}
                placeholder="Summary of verified scope or notice..."
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:col-span-3"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddingEdition(false)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[36px] px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Save Log Entry
              </button>
            </div>
          </form>
        )}

        {entryEditions.length > 0 && (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {entryEditions.map((rec) => {
              const safeUrl = sanitizeHttpUrl(rec.sourceUrl);
              return (
                <div key={rec.id} className="p-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                        {rec.recordKind.replace('_', ' ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {rec.identifier}
                      </span>
                      {rec.effectiveOrPublishedDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{rec.effectiveOrPublishedDate}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{rec.title}</p>
                    {rec.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">{rec.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {safeUrl && (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-900"
                        aria-label="Open source notice"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteEditionRecord(rec.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label="Delete recorded edition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Personal Study Notes */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Personal Study Notes ({entry.abbreviation})</span>
          </h3>
          {noteSavedFeedback && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Saved locally
            </span>
          )}
        </div>
        <form onSubmit={handleSaveNoteSubmit} className="space-y-3">
          <textarea
            rows={4}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={`Record personal notes, library edition shelf numbers, or practical cross-references for ${entry.abbreviation}...`}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Personal Note</span>
            </button>
          </div>
        </form>
      </section>

      {/* Academic & Syllabus Connections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <PharmacopoeiaAcademicLinks
          entry={entry}
          userAcademicLinks={userStore.academicLinks}
          onAddAcademicLink={onAddAcademicLink}
          onDeleteAcademicLink={onDeleteAcademicLink}
        />
      </div>
    </div>
  );
}
