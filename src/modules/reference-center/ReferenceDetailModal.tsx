import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  ExternalLink,
  FileText,
  FolderPlus,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Unlink,
  Upload,
  X
} from 'lucide-react';
import { LibraryBookMeta, ProcessingProgress } from '../knowledge-library/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { ACADEMIC_TOPIC_TREE, createTopicConnection, ENTITY_TYPE_LABELS } from './academicTopics';
import {
  ACCESS_STATUS_LABELS,
  AcademicConnection,
  AcademicEntityType,
  COLLECTION_TYPE_LABELS,
  CustomCollection,
  ReferenceCollectionType,
  ReferenceItem,
  STANDARD_CATEGORIES,
  TEXTBOOK_SUBJECTS
} from './types';

interface ReferenceDetailModalProps {
  isOpen: boolean;
  mode: 'view' | 'create';
  initialCollectionType?: ReferenceCollectionType;
  reference: ReferenceItem | null;
  allReferences: ReferenceItem[];
  books: LibraryBookMeta[];
  collections: CustomCollection[];
  initialTab?: 'details' | 'pdf' | 'topics';
  onClose: () => void;
  onCreateReference: (item: ReferenceItem) => Promise<ReferenceItem | null>;
  onUpdateReference: (id: string, patch: Partial<ReferenceItem>) => Promise<void>;
  onDeleteReference: (id: string) => Promise<void>;
  onToggleBookmark: (id: string) => Promise<void>;
  onToggleCollection: (refId: string, colId: string) => Promise<void>;
  onAddConnection: (refId: string, conn: AcademicConnection) => Promise<void>;
  onRemoveConnection: (refId: string, connId: string) => Promise<void>;
  onImportPdfForReference: (reference: ReferenceItem, file: File) => Promise<void>;
  onLinkExistingBook: (refId: string, bookId: string) => Promise<void>;
  onUnlinkBook: (refId: string) => Promise<void>;
  onOpenReader: (book: LibraryBookMeta, page?: number) => void;
  importingForId: string | null;
  importProgress: ProcessingProgress | null;
}

export default function ReferenceDetailModal({
  isOpen,
  mode,
  initialCollectionType = 'textbook',
  reference,
  allReferences,
  books,
  collections,
  initialTab = 'details',
  onClose,
  onCreateReference,
  onUpdateReference,
  onDeleteReference,
  onToggleBookmark,
  onToggleCollection,
  onAddConnection,
  onRemoveConnection,
  onImportPdfForReference,
  onLinkExistingBook,
  onUnlinkBook,
  onOpenReader,
  importingForId,
  importProgress
}: ReferenceDetailModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'pdf' | 'topics'>(initialTab);

  // Editable fields
  const [collectionType, setCollectionType] = useState<ReferenceCollectionType>(initialCollectionType);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [edition, setEdition] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [subject, setSubject] = useState<string>(TEXTBOOK_SUBJECTS[0]);
  const [subCategory, setSubCategory] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [licenseInfo, setLicenseInfo] = useState('');
  const [doi, setDoi] = useState('');
  const [isbn, setIsbn] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [chapterInput, setChapterInput] = useState('');
  const [chapterNotes, setChapterNotes] = useState<string[]>([]);

  // Academic Connection Builder
  const [selectedTopicId, setSelectedTopicId] = useState(ACADEMIC_TOPIC_TREE[0].id);
  const [customEntityType, setCustomEntityType] = useState<AcademicEntityType>('drug');
  const [customEntityLabel, setCustomEntityLabel] = useState('');
  const [selectedLinkedRefId, setSelectedLinkedRefId] = useState('');

  // PDF attach dropdown
  const [selectedBookId, setSelectedBookId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setConfirmDelete(false);

    if (mode === 'create' || !reference) {
      setCollectionType(initialCollectionType);
      setTitle('');
      setAuthors('');
      setIssuingAuthority('');
      setEdition('');
      setPublicationYear('');
      setSubject(
        initialCollectionType === 'standard' ? 'Regulatory & Quality Standards' : TEXTBOOK_SUBJECTS[0]
      );
      setSubCategory(
        initialCollectionType === 'standard' ? STANDARD_CATEGORIES[0] : ''
      );
      setDocumentType(
        initialCollectionType === 'standard'
          ? 'Regulatory Guideline'
          : initialCollectionType === 'handbook'
            ? 'Reference Handbook'
            : 'Reference Textbook'
      );
      setDescription('');
      setExternalUrl('');
      setLicenseInfo('Personal / Authorized Reference Copy');
      setDoi('');
      setIsbn('');
      setTagsText('');
      setPersonalNotes('');
      setChapterNotes([]);
    } else {
      setCollectionType(reference.collectionType);
      setTitle(reference.title);
      setAuthors(reference.authors || '');
      setIssuingAuthority(reference.issuingAuthority || '');
      setEdition(reference.edition || '');
      setPublicationYear(reference.publicationYear || '');
      setSubject(reference.subject);
      setSubCategory(reference.subCategory || '');
      setDocumentType(reference.documentType || '');
      setDescription(reference.description);
      setExternalUrl(reference.externalUrl || '');
      setLicenseInfo(reference.licenseInfo);
      setDoi(reference.doi || '');
      setIsbn(reference.isbn || '');
      setTagsText(reference.tags.join(', '));
      setPersonalNotes(reference.personalNotes || '');
      setChapterNotes(reference.chapterNotes || []);
    }
  }, [isOpen, mode, reference, initialCollectionType, initialTab]);

  const linkedBook = useMemo(
    () => (reference?.linkedBookId ? books.find((b) => b.id === reference.linkedBookId) || null : null),
    [books, reference?.linkedBookId]
  );

  const linkableCrossRefs = useMemo(
    () =>
      allReferences.filter(
        (r) =>
          r.id !== reference?.id &&
          (r.collectionType === 'pharmacopoeia' ||
            r.collectionType === 'textbook' ||
            r.collectionType === 'standard')
      ),
    [allReferences, reference?.id]
  );

  if (!isOpen) return null;

  const safeUrl = sanitizeHttpUrl(reference?.externalUrl || externalUrl);
  const isImportingThis = reference ? importingForId === reference.id : false;

  const handleAddChapterHeading = () => {
    const clean = chapterInput.trim();
    if (!clean) return;
    if (!chapterNotes.includes(clean)) {
      setChapterNotes((prev) => [...prev, clean]);
    }
    setChapterInput('');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const parsedTags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (mode === 'create') {
        const cleanUrl = sanitizeHttpUrl(externalUrl) || undefined;
        const newRef: ReferenceItem = {
          id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          collectionType,
          title: title.trim(),
          authors: authors.trim() || undefined,
          issuingAuthority: issuingAuthority.trim() || undefined,
          edition: edition.trim() || undefined,
          publicationYear: publicationYear.trim() || undefined,
          subject: subject.trim() || 'Pharmaceutical Sciences',
          subCategory: subCategory.trim() || undefined,
          documentType: documentType.trim() || undefined,
          description:
            description.trim() || `${COLLECTION_TYPE_LABELS[collectionType]} added by user.`,
          sourceName: issuingAuthority.trim() || authors.trim() || 'User Library Entry',
          accessStatus: selectedBookId
            ? 'imported_local'
            : cleanUrl
              ? 'open_access_portal'
              : 'metadata_only',
          licenseInfo: licenseInfo.trim() || 'Verify copyright & access permissions at source.',
          externalUrl: cleanUrl,
          doi: doi.trim() || undefined,
          isbn: isbn.trim() || undefined,
          linkedBookId: selectedBookId || undefined,
          chapterNotes,
          tags: parsedTags,
          personalNotes: personalNotes.trim() || undefined,
          bookmarked: false,
          customCollectionIds: [],
          academicConnections: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastOpenedAt: null
        };
        await onCreateReference(newRef);
        onClose();
      } else if (reference) {
        await onUpdateReference(reference.id, {
          title: title.trim(),
          authors: authors.trim() || undefined,
          issuingAuthority: issuingAuthority.trim() || undefined,
          edition: edition.trim() || undefined,
          publicationYear: publicationYear.trim() || undefined,
          subject: subject.trim() || reference.subject,
          subCategory: subCategory.trim() || undefined,
          documentType: documentType.trim() || undefined,
          description: description.trim() || reference.description,
          externalUrl: sanitizeHttpUrl(externalUrl) || undefined,
          licenseInfo: licenseInfo.trim() || reference.licenseInfo,
          doi: doi.trim() || undefined,
          isbn: isbn.trim() || undefined,
          tags: parsedTags,
          personalNotes: personalNotes.trim() || undefined,
          chapterNotes
        });
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'create' ? 'Add Reference Resource' : reference?.title || 'Reference Details'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92dvh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {mode === 'create'
                ? `Add New ${COLLECTION_TYPE_LABELS[collectionType]}`
                : `${COLLECTION_TYPE_LABELS[reference!.collectionType]} · ${
                    ACCESS_STATUS_LABELS[reference!.accessStatus]
                  }`}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {mode === 'create' ? 'Register Reference Resource' : reference?.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {mode === 'view' && reference && (
              <button
                type="button"
                onClick={() => onToggleBookmark(reference.id)}
                className={`p-2 rounded-lg border transition-colors ${
                  reference.bookmarked
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                aria-label="Toggle bookmark"
              >
                {reference.bookmarked ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs in View Mode */}
        {mode === 'view' && reference && (
          <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto">
            {[
              { id: 'details', label: 'Metadata & Chapters', icon: FileText },
              { id: 'pdf', label: linkedBook ? 'Attached PDF (Linked)' : 'Attach PDF', icon: BookOpen },
              {
                id: 'topics',
                label: `Academic Topics (${reference.academicConnections.length})`,
                icon: Link2
              }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as 'details' | 'pdf' | 'topics')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {(mode === 'create' || activeTab === 'details') && (
            <form id="ref-detail-form" onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {mode === 'view' && reference?.abstract && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Publication Abstract
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {reference.abstract}
                  </p>
                  {(reference.doi || reference.pmid || reference.pmcid) && (
                    <p className="text-slate-500 dark:text-slate-400 tabular-nums pt-1">
                      {[
                        reference.doi ? `DOI: ${reference.doi}` : null,
                        reference.pmid ? `PMID: ${reference.pmid}` : null,
                        reference.pmcid ? `PMCID: ${reference.pmcid}` : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {mode === 'create' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Collection Type
                  </label>
                  <select
                    value={collectionType}
                    onChange={(e) =>
                      setCollectionType(e.target.value as ReferenceCollectionType)
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="textbook">Textbook</option>
                    <option value="handbook">Handbook</option>
                    <option value="standard">Standard &amp; Guideline</option>
                    <option value="research">Research &amp; Publication</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter full title of textbook, handbook, guideline, or article"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Author(s)
                  </label>
                  <input
                    type="text"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    placeholder="e.g. K. D. Tripathi"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issuing Authority / Publisher
                  </label>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    placeholder="e.g. WHO, ICH, Elsevier, Jaypee"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    list="ref-subjects-datalist"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <datalist id="ref-subjects-datalist">
                    {TEXTBOOK_SUBJECTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                {collectionType === 'standard' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Standard Category
                    </label>
                    <select
                      value={subCategory || STANDARD_CATEGORIES[0]}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      {STANDARD_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Edition / Document Type
                    </label>
                    <input
                      type="text"
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      placeholder="e.g. 8th Edition"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publication Year / Date
                  </label>
                  <input
                    type="text"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    placeholder="e.g. 2023"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    External Reference / Portal URL
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    DOI / ISBN (Optional)
                  </label>
                  <input
                    type="text"
                    value={doi || isbn}
                    onChange={(e) => {
                      if (collectionType === 'research') setDoi(e.target.value);
                      else setIsbn(e.target.value);
                    }}
                    placeholder={collectionType === 'research' ? '10.xxxx/...' : 'ISBN'}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="e.g. NSAIDs, Paracetamol, Mechanism"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Scope
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary or curricular scope..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  License / Access Information
                </label>
                <input
                  type="text"
                  value={licenseInfo}
                  onChange={(e) => setLicenseInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* User-added Chapter Index (Never fabricated) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Recorded Chapter Headings / Syllabus Index (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chapterInput}
                    onChange={(e) => setChapterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChapterHeading();
                      }
                    }}
                    placeholder="Add chapter title from your copy (e.g. Ch 14: NSAIDs & Antipyretics)"
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddChapterHeading}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                {chapterNotes.length > 0 && (
                  <ul className="space-y-1">
                    {chapterNotes.map((ch) => (
                      <li
                        key={ch}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        <span className="truncate">{ch}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setChapterNotes((prev) => prev.filter((item) => item !== ch))
                          }
                          className="text-slate-400 hover:text-rose-500"
                          aria-label="Remove chapter heading"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Study Notes
                </label>
                <textarea
                  rows={2}
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder="Exam takeaways, page cross-references, or practical notes..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {mode === 'create' && books.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link Existing Knowledge Library PDF (Optional, Zero Duplication)
                  </label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">None (Metadata / External Link Only)</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.pageCount} pages)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Collections Assignment (View mode) */}
              {mode === 'view' && reference && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Custom Collections
                  </span>
                  <div className="flex flex-wrap gap-1.5">
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
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {col.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          )}

          {mode === 'view' && reference && activeTab === 'pdf' && (
            <div className="space-y-4 text-xs">
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

              {isImportingThis && importProgress && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    <span>{importProgress.message}</span>
                    <span>{importProgress.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${importProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {linkedBook ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {linkedBook.title}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {linkedBook.fileName} · {linkedBook.pageCount} pages ·{' '}
                        {linkedBook.searchablePagesCount} searchable
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                        Reading progress: Page {linkedBook.lastReadPage || 1} of {linkedBook.pageCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenReader(linkedBook, linkedBook.lastReadPage || 1);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Open in PDF Reader</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUnlinkBook(reference.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Unlink PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      No Local PDF Attached Yet
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Import your personal authorized PDF copy (indexed locally via PDF.js without external upload) or link an already-uploaded PDF from Knowledge Library.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isImportingThis}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold"
                  >
                    {isImportingThis ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Upload &amp; Link PDF</span>
                  </button>

                  {books.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">Attach an existing Knowledge Library PDF...</option>
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} ({b.pageCount} pages)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedBookId}
                        onClick={async () => {
                          if (!selectedBookId) return;
                          await onLinkExistingBook(reference.id, selectedBookId);
                          setSelectedBookId('');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 disabled:opacity-40 text-white font-semibold whitespace-nowrap"
                      >
                        Attach Selected
                      </button>
                    </div>
                  )}
                </div>
              )}

              {safeUrl && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Official / External Reference Link
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 truncate">{safeUrl}</p>
                  </div>
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Source</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {mode === 'view' && reference && activeTab === 'topics' && (
            <div className="space-y-4 text-xs">
              {/* Connect Structured Academic Topic */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Connect to B.Pharm Curriculum Topic (Department → Subject → Topic → Subtopic)
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {ACADEMIC_TOPIC_TREE.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.departmentLabel} → {node.topic} → {node.subtopic}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const node = ACADEMIC_TOPIC_TREE.find((t) => t.id === selectedTopicId);
                      if (!node) return;
                      await onAddConnection(reference.id, createTopicConnection(node));
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link Topic</span>
                  </button>
                </div>
              </div>

              {/* Connect Specific Drug, Chemical, Anatomy Structure, Experiment, or Equipment */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Connect Drug, Chemical, Anatomy Structure, Experiment, or Equipment
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={customEntityType}
                    onChange={(e) => setCustomEntityType(e.target.value as AcademicEntityType)}
                    className="sm:w-44 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {(Object.keys(ENTITY_TYPE_LABELS) as AcademicEntityType[]).map((k) => (
                      <option key={k} value={k}>
                        {ENTITY_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customEntityLabel}
                    onChange={(e) => setCustomEntityLabel(e.target.value)}
                    placeholder="e.g. Paracetamol, Gutzeit Apparatus, BP111P Exp 1a"
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={!customEntityLabel.trim()}
                    onClick={async () => {
                      if (!customEntityLabel.trim()) return;
                      await onAddConnection(reference.id, {
                        id: `conn_custom_${Date.now()}`,
                        entityType: customEntityType,
                        label: customEntityLabel.trim()
                      });
                      setCustomEntityLabel('');
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 disabled:opacity-40 text-white font-semibold whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>
                </div>
              </div>

              {/* Link to Pharmacopoeia / Textbook Cross-Reference */}
              {reference.collectionType === 'research' && linkableCrossRefs.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Link Paper to Pharmacopoeia or Textbook
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedLinkedRefId}
                      onChange={(e) => setSelectedLinkedRefId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Select target pharmacopoeia, textbook, or standard...</option>
                      {linkableCrossRefs.map((r) => (
                        <option key={r.id} value={r.id}>
                          [{COLLECTION_TYPE_LABELS[r.collectionType]}] {r.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedLinkedRefId}
                      onClick={async () => {
                        if (!selectedLinkedRefId) return;
                        const existing = reference.linkedReferenceIds || [];
                        if (!existing.includes(selectedLinkedRefId)) {
                          await onUpdateReference(reference.id, {
                            linkedReferenceIds: [...existing, selectedLinkedRefId]
                          });
                        }
                        setSelectedLinkedRefId('');
                      }}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 disabled:opacity-40 text-white font-semibold whitespace-nowrap shrink-0"
                    >
                      Cross-Link
                    </button>
                  </div>
                  {(reference.linkedReferenceIds || []).length > 0 && (
                    <div className="space-y-1 pt-1">
                      {(reference.linkedReferenceIds || []).map((targetId) => {
                        const target = allReferences.find((r) => r.id === targetId);
                        if (!target) return null;
                        return (
                          <div
                            key={targetId}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          >
                            <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {COLLECTION_TYPE_LABELS[target.collectionType]}: {target.title}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateReference(reference.id, {
                                  linkedReferenceIds: (reference.linkedReferenceIds || []).filter(
                                    (id) => id !== targetId
                                  )
                                })
                              }
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Existing Connections List */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Connected Academic Entities ({reference.academicConnections.length})
                </p>
                {reference.academicConnections.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 py-2">
                    No topics, experiments, drugs, or apparatus linked yet.
                  </p>
                ) : (
                  reference.academicConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {ENTITY_TYPE_LABELS[conn.entityType]}
                        </p>
                        <p className="text-slate-900 dark:text-white font-medium truncate">
                          {conn.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveConnection(reference.id, conn.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        aria-label="Remove academic connection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {mode === 'view' && reference && reference.collectionType !== 'pharmacopoeia' ? (
            confirmDelete ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  Remove from Reference Center?
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteReference(reference.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Entry</span>
              </button>
            )
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Stored locally in browser IndexedDB
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              Close
            </button>
            {(mode === 'create' || activeTab === 'details') && (
              <button
                type="submit"
                form="ref-detail-form"
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : mode === 'create' ? 'Save Resource' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
