import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  ExternalLink,
  Eye,
  FileText,
  FolderPlus,
  Link2,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlink,
  Upload
} from 'lucide-react';
import { getBookNotes, getBookPages, getBookmarks } from '../knowledge-library/libraryDb';
import { searchBookPages } from '../knowledge-library/searchEngine';
import {
  BookBookmark,
  BookHighlightNote,
  BookPageText,
  LibraryBookMeta,
  ProcessingProgress,
  SearchMatch
} from '../knowledge-library/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { PHARMACOPOEIA_SECTIONS } from './seedCatalog';
import {
  ACCESS_STATUS_LABELS,
  CustomCollection,
  PharmacopoeiaProfileMeta,
  PharmacopoeiaSectionKey,
  PharmacopoeiaSectionLink,
  ReferenceItem
} from './types';

interface PharmacopoeiaWorkspaceProps {
  reference: ReferenceItem;
  profile: PharmacopoeiaProfileMeta;
  books: LibraryBookMeta[];
  collections: CustomCollection[];
  onBack: () => void;
  onOpenReader: (book: LibraryBookMeta, page?: number, searchQuery?: string) => void;
  onImportPdfForReference: (reference: ReferenceItem, file: File) => Promise<void>;
  onLinkExistingBook: (referenceId: string, bookId: string) => Promise<void>;
  onUnlinkBook: (referenceId: string) => Promise<void>;
  onUpdateReference: (id: string, patch: Partial<ReferenceItem>) => Promise<void>;
  onToggleBookmark: (id: string) => Promise<void>;
  onToggleCollection: (referenceId: string, collectionId: string) => Promise<void>;
  onAddSectionLink: (referenceId: string, link: PharmacopoeiaSectionLink) => Promise<void>;
  onRemoveSectionLink: (referenceId: string, linkId: string) => Promise<void>;
  onOpenConnectionsEditor: (reference: ReferenceItem) => void;
  importingForId: string | null;
  importProgress: ProcessingProgress | null;
}

export default function PharmacopoeiaWorkspace({
  reference,
  profile,
  books,
  collections,
  onBack,
  onOpenReader,
  onImportPdfForReference,
  onLinkExistingBook,
  onUnlinkBook,
  onUpdateReference,
  onToggleBookmark,
  onToggleCollection,
  onAddSectionLink,
  onRemoveSectionLink,
  onOpenConnectionsEditor,
  importingForId,
  importProgress
}: PharmacopoeiaWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editingMeta, setEditingMeta] = useState(false);
  const [editionDraft, setEditionDraft] = useState(reference.edition || '');
  const [yearDraft, setYearDraft] = useState(reference.publicationYear || '');
  const [volumesDraft, setVolumesDraft] = useState(reference.volumes || '');
  const [urlDraft, setUrlDraft] = useState(reference.externalUrl || '');

  const [selectedBookToAttach, setSelectedBookToAttach] = useState('');
  const [activeSection, setActiveSection] = useState<PharmacopoeiaSectionKey>('monographs');

  // Section Link composer
  const [addingLink, setAddingLink] = useState(false);
  const [linkKind, setLinkKind] = useState<'pdf_page' | 'external_url' | 'educational_note'>(
    'educational_note'
  );
  const [linkTitle, setLinkTitle] = useState('');
  const [linkPage, setLinkPage] = useState('1');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const [linkIsOfficial, setLinkIsOfficial] = useState(false);

  // Scoped search inside linked compendium PDF
  const [linkedPages, setLinkedPages] = useState<BookPageText[]>([]);
  const [linkedBookmarks, setLinkedBookmarks] = useState<BookBookmark[]>([]);
  const [linkedNotes, setLinkedNotes] = useState<BookHighlightNote[]>([]);
  const [pdfQuery, setPdfQuery] = useState('');

  const linkedBook = useMemo(
    () => books.find((b) => b.id === reference.linkedBookId) || null,
    [books, reference.linkedBookId]
  );

  useEffect(() => {
    setEditionDraft(reference.edition || '');
    setYearDraft(reference.publicationYear || '');
    setVolumesDraft(reference.volumes || '');
    setUrlDraft(reference.externalUrl || '');
  }, [reference]);

  useEffect(() => {
    let cancelled = false;
    if (!linkedBook) {
      setLinkedPages([]);
      setLinkedBookmarks([]);
      setLinkedNotes([]);
      return;
    }

    Promise.all([
      getBookPages(linkedBook.id),
      getBookmarks(linkedBook.id),
      getBookNotes(linkedBook.id)
    ])
      .then(([pages, bms, notes]) => {
        if (cancelled) return;
        setLinkedPages(pages);
        setLinkedBookmarks(bms);
        setLinkedNotes(notes);
      })
      .catch(() => {
        // ignore read error
      });

    return () => {
      cancelled = true;
    };
  }, [linkedBook?.id]);

  const pdfMatches: SearchMatch[] = useMemo(() => {
    if (!linkedBook?.hasSearchableText || pdfQuery.trim().length < 2) return [];
    return searchBookPages(linkedPages, pdfQuery, 12);
  }, [linkedBook?.hasSearchableText, linkedPages, pdfQuery]);

  const safeExternalUrl = sanitizeHttpUrl(reference.externalUrl);
  const isImportingThis = importingForId === reference.id;

  const activeSectionMeta = PHARMACOPOEIA_SECTIONS.find((s) => s.key === activeSection)!;
  const activeSectionLinks = profile.sectionLinks.filter((l) => l.sectionKey === activeSection);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateReference(reference.id, {
      edition: editionDraft.trim(),
      publicationYear: yearDraft.trim(),
      volumes: volumesDraft.trim(),
      externalUrl: urlDraft.trim() || undefined
    });
    setEditingMeta(false);
  };

  const handleCreateSectionLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim()) return;

    const newLink: PharmacopoeiaSectionLink = {
      id: `phlink_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sectionKey: activeSection,
      title: linkTitle.trim(),
      kind: linkKind,
      bookId: linkKind === 'pdf_page' && linkedBook ? linkedBook.id : undefined,
      pageNumber:
        linkKind === 'pdf_page' ? Math.max(1, parseInt(linkPage, 10) || 1) : undefined,
      externalUrl: linkKind === 'external_url' ? sanitizeHttpUrl(linkUrl) || undefined : undefined,
      note: linkNote.trim() || undefined,
      isOfficialStandard: linkKind === 'educational_note' ? false : linkIsOfficial,
      createdAt: Date.now()
    };

    await onAddSectionLink(reference.id, newLink);
    setLinkTitle('');
    setLinkNote('');
    setLinkUrl('');
    setAddingLink(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Return & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Pharmacopoeias</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleBookmark(reference.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              reference.bookmarked
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {reference.bookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            <span>{reference.bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenConnectionsEditor(reference)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Academic Topics ({reference.academicConnections.length})</span>
          </button>

          {safeExternalUrl && (
            <a
              href={safeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Official Portal</span>
            </a>
          )}
        </div>
      </div>

      {/* Mandatory Official Standard vs Educational Explanation Banner */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 sm:p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            Official Standards Verification Notice
          </p>
          <p>
            PharmaLab does not fabricate compendial monographs, impurity limits, or edition numbers. Official pharmacopoeial specifications apply strictly to your authorized imported copy or the publisher&apos;s official portal; educational topic links and personal notes are explicitly separated below.
          </p>
        </div>
      </div>

      {/* Resource Profile Overview */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Official Compendium Profile · {ACCESS_STATUS_LABELS[reference.accessStatus]}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {reference.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {reference.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditingMeta((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
          >
            {editingMeta ? 'Cancel Edit' : 'Record Edition / Volumes'}
          </button>
        </div>

        {editingMeta ? (
          <form
            onSubmit={handleSaveMeta}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Edition / Effective Version (Verified on your copy)
              </label>
              <input
                type="text"
                value={editionDraft}
                onChange={(e) => setEditionDraft(e.target.value)}
                placeholder="e.g. IP 2022 (Personal Institutional Copy)"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Publication Year
              </label>
              <input
                type="text"
                value={yearDraft}
                onChange={(e) => setYearDraft(e.target.value)}
                placeholder="e.g. 2022"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Available Volumes
              </label>
              <input
                type="text"
                value={volumesDraft}
                onChange={(e) => setVolumesDraft(e.target.value)}
                placeholder="e.g. Vol I–IV"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official / Institutional Access URL
              </label>
              <input
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Compendium Details</span>
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Publishing Authority</dt>
              <dd className="text-slate-900 dark:text-slate-100 font-semibold mt-0.5">
                {reference.issuingAuthority || reference.sourceName}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Edition &amp; Year</dt>
              <dd className="text-slate-900 dark:text-slate-100 font-semibold mt-0.5 tabular-nums">
                {reference.edition || 'Not specified'}
                {reference.publicationYear ? ` (${reference.publicationYear})` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Available Volumes</dt>
              <dd className="text-slate-900 dark:text-slate-100 font-semibold mt-0.5">
                {reference.volumes || 'Verify with your copy / portal'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Official Source</dt>
              <dd className="text-slate-900 dark:text-slate-100 font-semibold mt-0.5">
                {reference.sourceName}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500 dark:text-slate-400 font-medium">
                License &amp; Access Information
              </dt>
              <dd className="text-slate-700 dark:text-slate-300 mt-0.5">{reference.licenseInfo}</dd>
            </div>
          </dl>
        )}

        {/* Collections & Related Subjects */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium mr-1 inline-flex items-center gap-1">
              <FolderPlus className="w-3.5 h-3.5" />
              Collections:
            </span>
            {collections.map((col) => {
              const active = reference.customCollectionIds.includes(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onToggleCollection(reference.id, col.id)}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                    active
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  {col.name}
                </button>
              );
            })}
          </div>

          <span className="text-slate-500 dark:text-slate-400 tabular-nums">
            Bookmarks: {linkedBookmarks.length} PDF · Notes: {linkedNotes.length}
          </span>
        </div>
      </section>

      {/* Authorized Local PDF Workspace + Scoped Full-Book Search */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Authorized Local PDF &amp; Monograph Search</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Link an existing Knowledge Library PDF or import your authorized PDF copy (no duplicate storage).
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onImportPdfForReference(reference, f);
            }}
          />

          {!linkedBook && (
            <button
              type="button"
              disabled={isImportingThis}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              {isImportingThis ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isImportingThis ? 'Indexing PDF...' : 'Import Authorized PDF'}</span>
            </button>
          )}
        </div>

        {isImportingThis && importProgress && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
              <span>{importProgress.message}</span>
              <span>{importProgress.percent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${importProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {linkedBook ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {linkedBook.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {linkedBook.pageCount} pages · {linkedBook.searchablePagesCount} searchable · Last
                  read page {linkedBook.lastReadPage || 1}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenReader(linkedBook, linkedBook.lastReadPage || 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open in PDF Reader</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUnlinkBook(reference.id)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
                  title="Unlink PDF from this profile (keeps PDF in Knowledge Library)"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Unlink</span>
                </button>
              </div>
            </div>

            {linkedBook.hasSearchableText ? (
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={pdfQuery}
                    onChange={(e) => setPdfQuery(e.target.value)}
                    placeholder={`Search inside "${linkedBook.title}" (e.g. Paracetamol, assay, limit test, dissolution)...`}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {pdfQuery.trim().length >= 2 && (
                  <div className="space-y-2">
                    {pdfMatches.length > 0 ? (
                      pdfMatches.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              Page {m.pageNumber} · {m.matchCountOnPage}{' '}
                              {m.matchCountOnPage === 1 ? 'hit' : 'hits'}
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {m.beforeContext}
                              <mark className="bg-amber-300/60 dark:bg-amber-500/35 text-slate-900 dark:text-amber-100 px-0.5 rounded font-semibold">
                                {m.matchedText}
                              </mark>
                              {m.afterContext}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenReader(linkedBook, m.pageNumber, pdfQuery)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open p. {m.pageNumber}</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                        No matches found for &ldquo;{pdfQuery}&rdquo; in {linkedBook.searchablePagesCount}{' '}
                        indexed pages.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  This PDF is scanned/image-only without embedded text; open it to read, zoom, and bookmark pages manually.
                </span>
              </div>
            )}
          </div>
        ) : (
          books.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <select
                value={selectedBookToAttach}
                onChange={(e) => setSelectedBookToAttach(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="">Or attach an existing PDF from Knowledge Library...</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.pageCount} pages)
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedBookToAttach}
                onClick={async () => {
                  if (!selectedBookToAttach) return;
                  await onLinkExistingBook(reference.id, selectedBookToAttach);
                  setSelectedBookToAttach('');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Attach Existing PDF
              </button>
            </div>
          )
        )}
      </section>

      {/* Organized 12-Section Pharmacopoeia Workspace */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Compendial Workspace Structure (12 Sections)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Index official pages from your attached PDF or official portal alongside clearly separated educational notes.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            {profile.sectionLinks.length} saved entries
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Section Navigator */}
          <div className="lg:col-span-4 space-y-1">
            {PHARMACOPOEIA_SECTIONS.map((sec) => {
              const count = profile.sectionLinks.filter((l) => l.sectionKey === sec.key).length;
              const active = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveSection(sec.key)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${
                    active
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs sm:text-sm truncate">{sec.label}</span>
                  {count > 0 && (
                    <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Section Details */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {activeSectionMeta.label}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {activeSectionMeta.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddingLink((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section Entry</span>
              </button>
            </div>

            {addingLink && (
              <form
                onSubmit={handleCreateSectionLink}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Entry Type
                    </label>
                    <select
                      value={linkKind}
                      onChange={(e) =>
                        setLinkKind(
                          e.target.value as 'pdf_page' | 'external_url' | 'educational_note'
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="educational_note">Educational Study Note (Non-Official)</option>
                      <option value="pdf_page" disabled={!linkedBook}>
                        {linkedBook
                          ? 'Index Specific Page in Attached PDF'
                          : 'Index PDF Page (Attach PDF first)'}
                      </option>
                      <option value="external_url">Official Portal Section URL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Title / Chapter / Monograph Name
                    </label>
                    <input
                      type="text"
                      required
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="e.g. Paracetamol Tablets Monograph / General Notice 1.2"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {linkKind === 'pdf_page' && linkedBook && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      PDF Page Number (1–{linkedBook.pageCount})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={linkedBook.pageCount}
                      value={linkPage}
                      onChange={(e) => setLinkPage(e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white tabular-nums"
                    />
                  </div>
                )}

                {linkKind === 'external_url' && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Section URL (https://...)
                    </label>
                    <input
                      type="url"
                      required
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Context
                  </label>
                  <textarea
                    rows={2}
                    value={linkNote}
                    onChange={(e) => setLinkNote(e.target.value)}
                    placeholder="Record verified context or educational explanation..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {linkKind !== 'educational_note' && (
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkIsOfficial}
                      onChange={(e) => setLinkIsOfficial(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      Verified from official {reference.shortTitle || reference.title} source (uncheck if educational)
                    </span>
                  </label>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingLink(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            )}

            {activeSectionLinks.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  No entries recorded in {activeSectionMeta.label} yet.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {linkedBook
                    ? `Use "Add Section Entry" to index specific pages from "${linkedBook.title}", or add educational study notes.`
                    : 'Import your authorized PDF copy or link an official portal section to organize content under this heading.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeSectionLinks.map((entry) => {
                  const safeUrl = sanitizeHttpUrl(entry.externalUrl);
                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {entry.isOfficialStandard ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Official Standard Reference
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                              <BookOpen className="w-3.5 h-3.5" />
                              Educational Explanation (Non-Official)
                            </span>
                          )}
                          {entry.pageNumber && (
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                              · Page {entry.pageNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {entry.title}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {entry.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {entry.pageNumber && linkedBook && (
                          <button
                            type="button"
                            onClick={() => onOpenReader(linkedBook, entry.pageNumber)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open p. {entry.pageNumber}</span>
                          </button>
                        )}
                        {safeUrl && (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Portal</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveSectionLink(reference.id, entry.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          aria-label="Remove section entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
