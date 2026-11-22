import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Globe,
  HardDrive,
  Loader2,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import {
  KnowledgeJumpTarget,
  useLibraryNavigation
} from '../../context/LibraryNavigationContext';
import {
  deleteBook,
  getAllBooks,
  getStorageSummary,
  saveBookPackage
} from './libraryDb';
import { processPdfFile } from './pdfExtractor';
import PdfReader from './PdfReader';
import {
  BOOK_DEPARTMENT_LABELS,
  BookDepartmentTag,
  DocumentCategory,
  LibraryBookMeta,
  ProcessingProgress,
  StorageSummary
} from './types';

interface KnowledgeLibraryModuleProps {
  jumpTarget?: KnowledgeJumpTarget | null;
}

const CATEGORY_OPTIONS: Array<{ id: DocumentCategory; label: string }> = [
  { id: 'textbook', label: 'Textbook' },
  { id: 'manual', label: 'Lab Manual' },
  { id: 'notes', label: 'Lecture Notes' },
  { id: 'research', label: 'Research Paper' }
];

const CATEGORY_FILTER_TABS: Array<{ id: 'all' | DocumentCategory; label: string }> = [
  { id: 'all', label: 'All Books' },
  { id: 'textbook', label: 'Textbooks' },
  { id: 'manual', label: 'Lab Manuals' },
  { id: 'notes', label: 'Notes' },
  { id: 'research', label: 'Research' }
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

export default function KnowledgeLibraryModule({
  jumpTarget
}: KnowledgeLibraryModuleProps) {
  const { setWorkspaceSection, recordActivity, openResourceHub } = useLibraryNavigation();

  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageSummary>({
    usageBytes: null,
    quotaBytes: null
  });

  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [readerJump, setReaderJump] = useState<{
    pageNumber?: number | null;
    searchQuery?: string | null;
    nonce: number;
  }>({ nonce: 0 });

  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('textbook');
  const [uploadDepartment, setUploadDepartment] = useState<BookDepartmentTag>('all');
  const [processing, setProcessing] = useState<ProcessingProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DocumentCategory>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | BookDepartmentTag>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshLibrary = useCallback(async () => {
    try {
      const [loadedBooks, storageInfo] = await Promise.all([
        getAllBooks(),
        getStorageSummary()
      ]);
      setBooks(loadedBooks);
      setStorage(storageInfo);
      setLibraryError(null);
    } catch (err) {
      setLibraryError(
        err instanceof Error
          ? err.message
          : 'Failed to load local IndexedDB library.'
      );
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  // Handle cross-module deep links to a specific book/page/query
  useEffect(() => {
    if (!jumpTarget || !jumpTarget.nonce) return;
    if (jumpTarget.bookId) {
      setActiveBookId(jumpTarget.bookId);
      setReaderJump({
        pageNumber: jumpTarget.pageNumber,
        searchQuery: jumpTarget.searchQuery,
        nonce: jumpTarget.nonce
      });
    } else {
      setActiveBookId(null);
    }
  }, [jumpTarget]);

  const handleFilesSelected = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0 || processing) return;

      setUploadError(null);
      setUploadNotice(null);

      const files = Array.from(fileList);
      let importedCount = 0;

      for (const file of files) {
        try {
          const pkg = await processPdfFile(
            file,
            uploadCategory,
            (progress) => {
              setProcessing(progress);
            },
            uploadDepartment
          );

          await saveBookPackage(pkg.meta, pkg.fileBuffer, pkg.pages);
          importedCount += 1;

          setBooks((prev) => [pkg.meta, ...prev]);

          if (pkg.meta.isScannedOrEmpty) {
            setUploadNotice(
              `"${pkg.meta.title}" was saved, but it appears to be a scanned or image-only PDF without embedded text. Reading and bookmarks work normally; full-book text search is unavailable for this file.`
            );
          } else {
            setUploadNotice(
              `Indexed "${pkg.meta.title}" (${pkg.meta.searchablePagesCount} of ${pkg.meta.pageCount} pages searchable).`
            );
          }
        } catch (err) {
          setUploadError(
            err instanceof Error
              ? err.message
              : `Could not import "${file.name}".`
          );
          break;
        }
      }

      setProcessing(null);
      if (importedCount > 0) {
        const storageInfo = await getStorageSummary();
        setStorage(storageInfo);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processing, uploadCategory, uploadDepartment]
  );

  const handleConfirmDelete = async (bookId: string) => {
    setDeletingId(bookId);
    setLibraryError(null);
    try {
      await deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setPendingDeleteId(null);
      if (activeBookId === bookId) {
        setActiveBookId(null);
      }
      const storageInfo = await getStorageSummary();
      setStorage(storageInfo);
    } catch (err) {
      setLibraryError(
        err instanceof Error ? err.message : 'Failed to delete book from storage.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleBookProgressChange = useCallback(
    (bookId: string, pageNumber: number) => {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, lastReadPage: pageNumber, lastOpenedAt: Date.now() }
            : b
        )
      );
    },
    []
  );

  const handleBookMetaChange = useCallback((updated: LibraryBookMeta) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const activeBook = useMemo(
    () => books.find((b) => b.id === activeBookId) || null,
    [books, activeBookId]
  );

  const continueBooks = useMemo(() => {
    return [...books]
      .filter((b) => (b.lastReadPage || 1) > 1 || Boolean(b.lastOpenedAt))
      .sort((a, b) => (b.lastOpenedAt || b.uploadedAt) - (a.lastOpenedAt || a.uploadedAt))
      .slice(0, 3);
  }, [books]);

  useEffect(() => {
    if (!activeBook) {
      setWorkspaceSection(null, null);
    }
  }, [activeBook, setWorkspaceSection]);

  const openBookReader = useCallback(
    (book: LibraryBookMeta, jumpOpts?: { pageNumber?: number | null; searchQuery?: string | null; nonce?: number }) => {
      setReaderJump({
        pageNumber: jumpOpts?.pageNumber ?? null,
        searchQuery: jumpOpts?.searchQuery ?? null,
        nonce: jumpOpts?.nonce ?? 0
      });
      setActiveBookId(book.id);
      recordActivity({
        key: `book:${book.id}`,
        kind: 'book',
        title: book.title,
        subtitle: `Knowledge Library · Page ${jumpOpts?.pageNumber || book.lastReadPage || 1} of ${book.pageCount}`,
        moduleId: 'knowledge_library',
        bookId: book.id,
        pageNumber: jumpOpts?.pageNumber || book.lastReadPage || 1
      });
    },
    [recordActivity]
  );

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      const matchesCat =
        categoryFilter === 'all' || book.category === categoryFilter;
      const matchesDept =
        departmentFilter === 'all' ||
        (book.department || 'all') === departmentFilter;
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.fileName.toLowerCase().includes(q);
      return matchesCat && matchesDept && matchesQuery;
    });
  }, [books, searchQuery, categoryFilter, departmentFilter]);

  if (activeBook) {
    return (
      <PdfReader
        book={activeBook}
        onBack={() => setActiveBookId(null)}
        onBookProgressChange={handleBookProgressChange}
        onBookMetaChange={handleBookMetaChange}
        initialPage={readerJump.pageNumber}
        initialSearchQuery={readerJump.searchQuery}
        jumpNonce={readerJump.nonce}
      />
    );
  }

  return (
    <div
      className="space-y-8 pb-12"
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFilesSelected(e.dataTransfer.files);
      }}
    >
      {/* Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Offline Textbook &amp; Document Repository
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
            Knowledge Library
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Store pharmaceutical textbooks and manuals locally in IndexedDB with full-book search, notes, and direct diagram capture.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => openResourceHub({ resourceType: 'textbook', query: 'Anatomy and Physiology' })}
            className="min-h-[44px] sm:min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 text-sm font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Discover in Resource Hub</span>
          </button>

          <button
            type="button"
            onClick={() => setImportPanelOpen((prev) => !prev)}
            className={`min-h-[44px] sm:min-h-[40px] px-4 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              importPanelOpen
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{importPanelOpen ? 'Hide Import Options' : 'Import PDF'}</span>
          </button>
        </div>
      </section>

      {/* Collapsible Upload & Metadata Bar */}
      {(importPanelOpen || isDragging) && (
        <section className="bg-white dark:bg-slate-900 border border-emerald-500/35 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Pharmaceutical Textbook or Lab Manual
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose classification tags first, then select or drop PDF files.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Document type"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                disabled={Boolean(processing)}
                className="min-h-[42px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Subject department"
                value={uploadDepartment}
                onChange={(e) => setUploadDepartment(e.target.value as BookDepartmentTag)}
                disabled={Boolean(processing)}
                className="min-h-[42px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {(Object.keys(BOOK_DEPARTMENT_LABELS) as BookDepartmentTag[]).map((dept) => (
                  <option key={dept} value={dept}>
                    {BOOK_DEPARTMENT_LABELS[dept]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={Boolean(processing)}
                className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{processing ? 'Indexing PDF...' : 'Select PDF Files'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Processing Progress Banner */}
      {processing && (
        <div
          role="status"
          className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {processing.message}
              </span>
            </div>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
              {processing.percent}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
              style={{ width: `${processing.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error / Status Notices */}
      {(uploadError || libraryError) && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/35 rounded-2xl p-4 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-900 dark:text-rose-200">
              {uploadError || libraryError}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              setLibraryError(null);
            }}
            className="p-1 rounded-lg text-rose-700 dark:text-rose-300 hover:bg-rose-500/15 shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadNotice && !uploadError && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-800 dark:text-slate-200">{uploadNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadNotice(null)}
            className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-emerald-500/15 shrink-0"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search, Filter & Storage Summary */}
      <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library by book title or filename..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Clear library search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            {CATEGORY_FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by subject"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value as BookDepartmentTag)}
            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
          >
            {(Object.keys(BOOK_DEPARTMENT_LABELS) as BookDepartmentTag[]).map((dept) => (
              <option key={dept} value={dept}>
                {BOOK_DEPARTMENT_LABELS[dept]}
              </option>
            ))}
          </select>

          {storage.usageBytes !== null && (
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums px-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{formatBytes(storage.usageBytes)} used locally</span>
            </div>
          )}
        </div>
      </section>

      {/* Drag-and-Drop Overlay Hint */}
      {isDragging && (
        <div className="border-2 border-dashed border-emerald-500 bg-emerald-500/10 rounded-2xl p-10 text-center">
          <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
            Drop PDF files here to add them to your Knowledge Library
          </p>
        </div>
      )}

      {/* Continue Reading Strip */}
      {!loadingLibrary && continueBooks.length > 0 && (
        <section aria-label="Continue reading" className="space-y-3">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Continue Reading
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {continueBooks.map((book) => {
              const readPage = Math.max(1, Math.min(book.lastReadPage || 1, book.pageCount));
              const pct = Math.round((readPage / Math.max(1, book.pageCount)) * 100);
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => openBookReader(book)}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left space-y-2 transition-colors group"
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                    {book.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>
                      Page {readPage} / {book.pageCount}
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Books Grid / Empty State */}
      {loadingLibrary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6"
            />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div
          onClick={() => !processing && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !processing) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 bg-white dark:bg-slate-900/60 rounded-2xl p-10 sm:p-14 text-center space-y-4 cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Your Pharmaceutical Library is Empty
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Click or drag and drop a PDF textbook, lab manual, or research paper (such as Tortora Anatomy, Remington, or pharmacopoeia notes) to index its pages, take study notes, crop figures, and read offline.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">
            <Upload className="w-4 h-4" />
            <span>Select PDF Document</span>
          </span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">
            No uploaded books match your active filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setDepartmentFilter('all');
            }}
            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Reset library filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBooks.map((book) => {
            const readPage = Math.max(1, Math.min(book.lastReadPage || 1, book.pageCount));
            const pct = Math.round((readPage / book.pageCount) * 100);
            const categoryLabel =
              CATEGORY_OPTIONS.find((c) => c.id === book.category)?.label || 'Document';
            const deptLabel =
              book.department && book.department !== 'all'
                ? BOOK_DEPARTMENT_LABELS[book.department]
                : null;
            const isConfirmingDelete = pendingDeleteId === book.id;

            return (
              <article
                key={book.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-sm dark:shadow-none transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {categoryLabel}
                      {deptLabel ? ` · ${deptLabel.split(' (')[0]}` : ''}
                    </span>
                    <span className="tabular-nums">
                      {formatBytes(book.fileSize)} · {book.pageCount} pages · {formatDate(book.uploadedAt)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {book.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                        {book.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>
                        {readPage > 1
                          ? `Last read: Page ${readPage} of ${book.pageCount} (${pct}%)`
                          : `${book.pageCount} pages ready to read`}
                      </span>
                      <span
                        className={
                          book.hasSearchableText
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-amber-600 dark:text-amber-400 font-medium'
                        }
                      >
                        {book.hasSearchableText
                          ? `${book.searchablePagesCount} pages indexed`
                          : 'Scanned · No text'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  {isConfirmingDelete ? (
                    <div className="w-full flex items-center justify-between gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                      <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                        Delete this book, notes &amp; bookmarks?
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          disabled={deletingId === book.id}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(book.id)}
                          disabled={deletingId === book.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          {deletingId === book.id && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(book.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openBookReader(book)}
                        className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>{readPage > 1 ? 'Continue Reading' : 'Open Book'}</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
