import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Moon,
  Search,
  Sun,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlertTriangle
} from 'lucide-react';
import {
  addBookmark,
  getBookFile,
  getBookPages,
  getBookmarks,
  removeBookmark,
  updateBookReadingProgress
} from './libraryDb';
import { classifyPdfError, pdfjsLib } from './pdfWorker';
import { PHARMACEUTICAL_SUGGESTIONS, searchBookPages } from './searchEngine';
import { BookBookmark, BookPageText, LibraryBookMeta, SearchMatch } from './types';

interface PdfReaderProps {
  book: LibraryBookMeta;
  onBack: () => void;
  onBookProgressChange: (bookId: string, pageNumber: number) => void;
}

type SidePanelTab = 'search' | 'bookmarks' | 'info';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

function applyTextLayerHighlights(container: HTMLElement, query: string): void {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;

  const terms = trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return;

  const escaped = terms
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const matcher = new RegExp(`(${escaped})`, 'gi');

  const spans = Array.from(container.querySelectorAll('span'));
  let firstMark: HTMLElement | null = null;

  for (const span of spans) {
    const raw = span.textContent || '';
    if (!raw) continue;
    matcher.lastIndex = 0;
    if (!matcher.test(raw)) continue;

    matcher.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = matcher.exec(raw)) !== null) {
      if (match.index > lastIdx) {
        frag.appendChild(document.createTextNode(raw.slice(lastIdx, match.index)));
      }
      const mark = document.createElement('mark');
      mark.className = 'pdf-search-hit';
      mark.textContent = match[0];
      frag.appendChild(mark);
      if (!firstMark) firstMark = mark;
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < raw.length) {
      frag.appendChild(document.createTextNode(raw.slice(lastIdx)));
    }

    span.textContent = '';
    span.appendChild(frag);
  }

  if (firstMark) {
    firstMark.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }
}

export default function PdfReader({
  book,
  onBack,
  onBookProgressChange
}: PdfReaderProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pagesText, setPagesText] = useState<BookPageText[]>([]);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderingPage, setRenderingPage] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(() =>
    Math.max(1, Math.min(book.lastReadPage || 1, book.pageCount || 1))
  );
  const [pageInput, setPageInput] = useState<string>(
    String(Math.max(1, Math.min(book.lastReadPage || 1, book.pageCount || 1)))
  );

  const [fitWidth, setFitWidth] = useState(true);
  const [manualScale, setManualScale] = useState(1.15);
  const [effectiveScale, setEffectiveScale] = useState(1.15);
  const [containerWidth, setContainerWidth] = useState(820);

  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<SidePanelTab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHighlight, setActiveHighlight] = useState('');
  const [bookmarkLabel, setBookmarkLabel] = useState('');

  const [darkPaper, setDarkPaper] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const readerRootRef = useRef<HTMLDivElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);

  const totalPages = pdfDoc?.numPages || book.pageCount || 1;

  // Load PDF binary, indexed page text, and bookmarks from IndexedDB
  useEffect(() => {
    let cancelled = false;
    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;

    async function loadBookAssets() {
      setLoadingDoc(true);
      setDocError(null);
      setRenderError(null);

      try {
        const [buffer, storedPages, storedBookmarks] = await Promise.all([
          getBookFile(book.id),
          getBookPages(book.id),
          getBookmarks(book.id)
        ]);

        if (cancelled) return;

        if (!buffer) {
          throw new Error(
            'The PDF file data could not be found in local storage. Please re-upload this book.'
          );
        }

        const task = pdfjsLib.getDocument({
          data: new Uint8Array(buffer.slice(0)),
          verbosity: pdfjsLib.VerbosityLevel.ERRORS
        });

        loadedDoc = await task.promise;
        if (cancelled) {
          await loadedDoc.destroy();
          return;
        }

        setPdfDoc(loadedDoc);
        setPagesText(storedPages);
        setBookmarks(storedBookmarks);

        const initialPage = Math.max(
          1,
          Math.min(book.lastReadPage || 1, loadedDoc.numPages)
        );
        setCurrentPage(initialPage);
        setPageInput(String(initialPage));
      } catch (err) {
        if (!cancelled) {
          setDocError(classifyPdfError(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingDoc(false);
        }
      }
    }

    loadBookAssets();

    return () => {
      cancelled = true;
      if (loadedDoc) {
        loadedDoc.destroy().catch(() => {});
      }
    };
  }, [book.id]);

  // Close drawer automatically on small viewports initially so page fills screen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setPanelOpen(false);
    }
  }, []);

  // Measure viewport stage width for responsive Fit-to-Width zoom
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const next = el.clientWidth;
      if (next > 0) setContainerWidth(next);
    };
    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateWidth());
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [panelOpen, isFullscreen]);

  // Sync native fullscreen change events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Render active PDF page onto HiDPI canvas + selectable TextLayer
  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;
    let textLayerInstance: pdfjsLib.TextLayer | null = null;
    let activePageProxy: pdfjsLib.PDFPageProxy | null = null;

    async function renderCurrentPage() {
      const canvas = canvasRef.current;
      const textLayerDiv = textLayerRef.current;
      if (!canvas || !textLayerDiv || !pdfDoc) return;

      setRenderingPage(true);
      setRenderError(null);

      try {
        const page = await pdfDoc.getPage(currentPage);
        activePageProxy = page;
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const horizontalPadding = window.innerWidth < 640 ? 24 : 56;
        const availableWidth = Math.max(260, containerWidth - horizontalPadding);
        const computedScale = fitWidth
          ? Math.max(0.45, Math.min(2.4, availableWidth / baseViewport.width))
          : manualScale;

        setEffectiveScale(computedScale);

        const viewport = page.getViewport({ scale: computedScale });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2.5);

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Unable to acquire 2D canvas context to render PDF page.');
        }

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          transform,
          canvas
        });

        await renderTask.promise;
        if (cancelled) return;

        // Render PDF.js TextLayer for text selection & search highlights
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;
        textLayerDiv.style.setProperty('--total-scale-factor', String(viewport.scale));
        textLayerDiv.style.setProperty('--scale-round-x', '1px');
        textLayerDiv.style.setProperty('--scale-round-y', '1px');

        const textContent = await page.getTextContent();
        if (cancelled) return;

        textLayerInstance = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport
        });

        await textLayerInstance.render();
        if (cancelled) return;

        if (activeHighlight.trim().length >= 2) {
          applyTextLayerHighlights(textLayerDiv, activeHighlight);
        }
      } catch (err) {
        if (cancelled) return;
        const record = err as { name?: string };
        if (record?.name === 'RenderingCancelledException') return;
        setRenderError(classifyPdfError(err));
      } finally {
        if (activePageProxy) {
          try {
            activePageProxy.cleanup();
          } catch {
            // ignore cleanup errors
          }
        }
        if (!cancelled) {
          setRenderingPage(false);
        }
      }
    }

    renderCurrentPage();

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
      if (textLayerInstance) {
        try {
          textLayerInstance.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, fitWidth, manualScale, containerWidth, activeHighlight]);

  // Persist reading position in IndexedDB
  useEffect(() => {
    if (!pdfDoc) return;
    setPageInput(String(currentPage));
    onBookProgressChange(book.id, currentPage);
    updateBookReadingProgress(book.id, currentPage).catch(() => {});
  }, [book.id, currentPage, pdfDoc, onBookProgressChange]);

  const goToPage = useCallback(
    (target: number, highlightTerm?: string) => {
      const clamped = Math.max(1, Math.min(totalPages, Math.round(target)));
      setCurrentPage(clamped);
      setPageInput(String(clamped));
      if (typeof highlightTerm === 'string') {
        setActiveHighlight(highlightTerm);
      }
      stageContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages]
  );

  // Keyboard navigation (Left/Right arrows when not typing)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPage, totalPages, goToPage, isFullscreen]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleZoomIn = () => {
    const next = Math.min(2.5, Number(((fitWidth ? effectiveScale : manualScale) + 0.15).toFixed(2)));
    setFitWidth(false);
    setManualScale(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(0.5, Number(((fitWidth ? effectiveScale : manualScale) - 0.15).toFixed(2)));
    setFitWidth(false);
    setManualScale(next);
  };

  const handleToggleFullscreen = async () => {
    const root = readerRootRef.current;
    if (!root) return;

    if (!isFullscreen) {
      if (root.requestFullscreen) {
        try {
          await root.requestFullscreen();
          setIsFullscreen(true);
          return;
        } catch {
          // Fallback to fixed viewport mode if iframe blocks native Fullscreen API
        }
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }
      setIsFullscreen(false);
    }
  };

  // Search results memoized across pre-extracted IndexedDB pages
  const searchResults: SearchMatch[] = useMemo(() => {
    if (!book.hasSearchableText || searchQuery.trim().length < 2) return [];
    return searchBookPages(pagesText, searchQuery);
  }, [book.hasSearchableText, pagesText, searchQuery]);

  const currentPageBookmark = useMemo(
    () => bookmarks.find((bm) => bm.pageNumber === currentPage) || null,
    [bookmarks, currentPage]
  );

  const handleToggleBookmarkCurrentPage = async () => {
    if (currentPageBookmark) {
      await removeBookmark(currentPageBookmark.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== currentPageBookmark.id));
      return;
    }

    const pageRecord = pagesText.find((p) => p.pageNumber === currentPage);
    const rawExcerpt = pageRecord?.text
      ? pageRecord.text.replace(/\s+/g, ' ').trim().slice(0, 140)
      : 'Bookmarked PDF page';

    const newBookmark: BookBookmark = {
      id: `${book.id}_bm_${currentPage}_${Date.now()}`,
      bookId: book.id,
      pageNumber: currentPage,
      label: bookmarkLabel.trim() || `Page ${currentPage}`,
      excerpt: rawExcerpt,
      createdAt: Date.now()
    };

    await addBookmark(newBookmark);
    setBookmarks((prev) =>
      [...prev, newBookmark].sort(
        (a, b) => a.pageNumber - b.pageNumber || a.createdAt - b.createdAt
      )
    );
    setBookmarkLabel('');
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    await removeBookmark(bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  const progressPercent = Math.round((currentPage / totalPages) * 100);

  return (
    <div
      ref={readerRootRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950'
          : 'flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden shadow-sm h-[calc(100vh-8.5rem)] min-h-[560px]'
      }
    >
      {/* Document Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Library</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[280px] lg:max-w-[360px]">
              {book.title}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
              Page {currentPage} of {totalPages} · {progressPercent}% read
            </p>
          </div>
        </div>

        {/* Center: Page Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loadingDoc}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputSubmit}
              aria-label="Current page number"
              className="w-12 h-9 text-center text-xs sm:text-sm font-medium tabular-nums rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
              / {totalPages}
            </span>
          </form>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || loadingDoc}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom, Bookmark, Dark Paper, Panel, Fullscreen */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={loadingDoc}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300 min-w-[44px] text-center">
              {Math.round(effectiveScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={loadingDoc}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setFitWidth((prev) => !prev)}
              className={`h-8 px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                fitWidth
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
              title="Fit PDF page to reader width"
            >
              Fit Width
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleBookmarkCurrentPage}
            disabled={loadingDoc}
            className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentPageBookmark
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            aria-label={currentPageBookmark ? 'Remove bookmark for this page' : 'Bookmark current page'}
            title={currentPageBookmark ? 'Remove page bookmark' : 'Bookmark this page'}
          >
            {currentPageBookmark ? (
              <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            <span className="hidden xl:inline">
              {currentPageBookmark ? 'Bookmarked' : 'Bookmark'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDarkPaper((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              darkPaper
                ? 'bg-slate-800 border-slate-700 text-emerald-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title="Toggle reader night contrast mode"
            aria-label="Toggle reader night contrast mode"
          >
            {darkPaper ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden xl:inline">{darkPaper ? 'Day Paper' : 'Night Paper'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPanelOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              panelOpen
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            aria-label="Toggle search and bookmarks panel"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Search &amp; Notes</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shrink-0"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen reading mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Thin Reading Progress Bar */}
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 shrink-0">
        <div
          className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Split Reader Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* PDF Page Canvas Viewport */}
        <div
          ref={stageContainerRef}
          className={`flex-1 overflow-auto p-3 sm:p-6 flex flex-col items-center transition-colors ${
            darkPaper
              ? 'bg-slate-950'
              : 'bg-slate-200/75 dark:bg-slate-950'
          }`}
        >
          {/* Mobile Zoom Row */}
          <div className="sm:hidden w-full flex items-center justify-between gap-2 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-md text-slate-700 dark:text-slate-300"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300 min-w-[40px] text-center">
                {Math.round(effectiveScale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-md text-slate-700 dark:text-slate-300"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFitWidth((prev) => !prev)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                fitWidth
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Maximize className="w-3 h-3" />
                Fit Width
              </span>
            </button>
          </div>

          {loadingDoc ? (
            <div className="my-auto flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Loading PDF document from local library...
              </p>
            </div>
          ) : docError ? (
            <div className="my-auto max-w-md bg-white dark:bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unable to Open Document
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{docError}</p>
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                Return to Library
              </button>
            </div>
          ) : renderError ? (
            <div className="my-auto max-w-md bg-white dark:bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
              <AlertTriangle className="w-7 h-7 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Page {currentPage} failed to render
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{renderError}</p>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              {activeHighlight.trim().length >= 2 && (
                <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-xs text-amber-800 dark:text-amber-200">
                  <span>
                    Highlighting matches for <strong>"{activeHighlight}"</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveHighlight('')}
                    className="p-0.5 rounded hover:bg-amber-500/20"
                    aria-label="Clear highlight"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div
                className="relative shadow-lg border border-slate-300/80 dark:border-slate-700/80 bg-white select-text"
                style={
                  darkPaper
                    ? { filter: 'invert(0.89) hue-rotate(180deg) contrast(0.95)' }
                    : undefined
                }
              >
                <canvas ref={canvasRef} className="block" />
                <div ref={textLayerRef} className="pdf-text-layer" />

                {renderingPage && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/30 flex items-center justify-center pointer-events-none z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search, Passage Extraction & Bookmarks Side Panel */}
        {panelOpen && (
          <aside
            aria-label="Book search and bookmarks panel"
            className="w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 absolute inset-y-0 right-0 lg:static z-20 shadow-xl lg:shadow-none"
          >
            {/* Panel Tabs */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex-1">
                {[
                  { id: 'search', label: 'Search', icon: Search },
                  { id: 'bookmarks', label: `Bookmarks (${bookmarks.length})`, icon: Bookmark },
                  { id: 'info', label: 'Info', icon: Info }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = panelTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPanelTab(tab.id as SidePanelTab)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-none'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close side panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {panelTab === 'search' && (
                <>
                  {!book.hasSearchableText ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Searchable Text Unavailable</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        This PDF appears to be a scanned document or image-only file without embedded text. Full-book search is unavailable for scanned pages, though you can read, zoom, and bookmark pages normally.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search entire book (e.g. pharmacokinetics)..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                setActiveHighlight('');
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              aria-label="Clear book search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {searchQuery.trim().length > 0 && (
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            <span>
                              {searchResults.length === 0
                                ? 'No matching passages found'
                                : `${searchResults.length} relevant ${
                                    searchResults.length === 1 ? 'passage' : 'passages'
                                  } ranked`}
                            </span>
                            {activeHighlight && (
                              <button
                                type="button"
                                onClick={() => setActiveHighlight('')}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                              >
                                Clear highlight
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {searchQuery.trim().length < 2 ? (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Quick Pharmaceutical Concept Queries
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {PHARMACEUTICAL_SUGGESTIONS.map((term) => (
                              <button
                                key={term}
                                type="button"
                                onClick={() => setSearchQuery(term)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                            Searches across all {book.searchablePagesCount} indexed pages locally in your browser.
                          </p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-3">
                          {searchResults.map((match) => (
                            <div
                              key={match.id}
                              className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                                currentPage === match.pageNumber
                                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/40'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                  Page {match.pageNumber}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                  {match.matchCountOnPage}{' '}
                                  {match.matchCountOnPage === 1 ? 'hit' : 'hits'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                                <span>{match.beforeContext}</span>
                                <mark className="bg-amber-300/60 dark:bg-amber-500/35 text-slate-900 dark:text-amber-100 px-1 rounded font-semibold">
                                  {match.matchedText}
                                </mark>
                                <span>{match.afterContext}</span>
                              </p>

                              <button
                                type="button"
                                onClick={() => {
                                  goToPage(match.pageNumber, searchQuery);
                                  if (window.innerWidth < 1024) {
                                    setPanelOpen(false);
                                  }
                                }}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Open Page {match.pageNumber}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center space-y-1.5">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            No matches for "{searchQuery}"
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Try checking spelling or searching a shorter scientific root term.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {panelTab === 'bookmarks' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Bookmark Current Page (Page {currentPage})
                    </label>
                    <input
                      type="text"
                      value={bookmarkLabel}
                      onChange={(e) => setBookmarkLabel(e.target.value)}
                      placeholder="Optional note (e.g. First-pass metabolism)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleToggleBookmarkCurrentPage}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      {currentPageBookmark ? (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Page {currentPage} Bookmark</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Save Bookmark</span>
                        </>
                      )}
                    </button>
                  </div>

                  {bookmarks.length === 0 ? (
                    <div className="py-8 text-center space-y-1.5">
                      <Bookmark className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        No bookmarks yet
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Save important chapters, tables, or formulas to jump back anytime.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {bookmarks.map((bm) => (
                        <div
                          key={bm.id}
                          className={`p-3 rounded-xl border space-y-2 ${
                            bm.pageNumber === currentPage
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                goToPage(bm.pageNumber);
                                if (window.innerWidth < 1024) setPanelOpen(false);
                              }}
                              className="text-left min-w-0 flex-1 group"
                            >
                              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                Page {bm.pageNumber}
                              </div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                {bm.label}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBookmark(bm.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                              aria-label={`Delete bookmark on page ${bm.pageNumber}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {bm.excerpt && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {bm.excerpt}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {panelTab === 'info' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{book.title}</span>
                    </div>

                    <dl className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Original File</dt>
                        <dd className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[190px]">
                          {book.fileName}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">File Size</dt>
                        <dd className="text-slate-900 dark:text-slate-200 font-medium tabular-nums">
                          {formatBytes(book.fileSize)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Total Pages</dt>
                        <dd className="text-slate-900 dark:text-slate-200 font-medium tabular-nums">
                          {totalPages}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Search Index</dt>
                        <dd className="text-slate-900 dark:text-slate-200 font-medium tabular-nums">
                          {book.hasSearchableText
                            ? `${book.searchablePagesCount} / ${totalPages} pages`
                            : 'No embedded text'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Uploaded</dt>
                        <dd className="text-slate-900 dark:text-slate-200 font-medium tabular-nums">
                          {formatDate(book.uploadedAt)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Reading Progress</dt>
                        <dd className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                          Page {currentPage} of {totalPages} ({progressPercent}%)
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
