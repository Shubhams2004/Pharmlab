import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crop,
  Eye,
  FileText,
  Highlighter,
  Images,
  Info,
  Loader2,
  Maximize,
  Maximize2,
  Minimize2,
  Moon,
  Search,
  StickyNote,
  Sun,
  Trash2,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import {
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
  DepartmentId,
  VisualCategory
} from '../visual-library/types';
import { saveCroppedTextbookDiagram } from '../visual-library/visualDb';
import {
  addBookNote,
  addBookmark,
  getBookFile,
  getBookNotes,
  getBookPages,
  getBookmarks,
  removeBookNote,
  removeBookmark,
  updateBookMeta,
  updateBookReadingProgress
} from './libraryDb';
import { classifyPdfError, pdfjsLib } from './pdfWorker';
import { PHARMACEUTICAL_SUGGESTIONS, searchBookPages } from './searchEngine';
import {
  BOOK_DEPARTMENT_LABELS,
  BookBookmark,
  BookDepartmentTag,
  BookHighlightNote,
  BookPageText,
  HighlightColor,
  LibraryBookMeta,
  SearchMatch
} from './types';

interface PdfReaderProps {
  book: LibraryBookMeta;
  onBack: () => void;
  onBookProgressChange: (bookId: string, pageNumber: number) => void;
  onBookMetaChange?: (updated: LibraryBookMeta) => void;
  initialPage?: number | null;
  initialSearchQuery?: string | null;
  jumpNonce?: number;
}

type SidePanelTab = 'search' | 'bookmarks' | 'notes' | 'info';

interface CropRectNormalized {
  x: number;
  y: number;
  w: number;
  h: number;
}

const HIGHLIGHT_STYLES: Record<HighlightColor, { bg: string; chip: string; label: string }> = {
  amber: {
    bg: 'rgba(251, 191, 36, 0.42)',
    chip: 'bg-amber-400',
    label: 'Amber'
  },
  emerald: {
    bg: 'rgba(52, 211, 153, 0.36)',
    chip: 'bg-emerald-400',
    label: 'Emerald'
  },
  blue: {
    bg: 'rgba(56, 189, 248, 0.38)',
    chip: 'bg-sky-400',
    label: 'Cyan'
  },
  rose: {
    bg: 'rgba(251, 113, 133, 0.36)',
    chip: 'bg-rose-400',
    label: 'Rose'
  }
};

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

function applyTextLayerHighlights(
  container: HTMLElement,
  query: string,
  pageNotes: BookHighlightNote[]
): void {
  const spans = Array.from(container.querySelectorAll('span'));
  let firstMark: HTMLElement | null = null;

  // Apply saved user quote highlights for this page
  for (const note of pageNotes) {
    const quote = note.quote.trim();
    if (quote.length < 3) continue;
    const snippet = quote.slice(0, 64).replace(/\s+/g, ' ');
    const tokens = snippet
      .split(/\s+/)
      .filter((t) => t.length >= 3)
      .slice(0, 4);
    if (tokens.length === 0) continue;

    const pattern = new RegExp(
      `(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi'
    );

    for (const span of spans) {
      const raw = span.textContent || '';
      if (!raw) continue;
      pattern.lastIndex = 0;
      if (!pattern.test(raw)) continue;

      pattern.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let m: RegExpExecArray | null;

      while ((m = pattern.exec(raw)) !== null) {
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(raw.slice(lastIdx, m.index)));
        }
        const mark = document.createElement('mark');
        mark.style.backgroundColor = HIGHLIGHT_STYLES[note.color].bg;
        mark.style.color = 'transparent';
        mark.style.borderRadius = '2px';
        mark.textContent = m[0];
        frag.appendChild(mark);
        lastIdx = m.index + m[0].length;
      }

      if (lastIdx < raw.length) {
        frag.appendChild(document.createTextNode(raw.slice(lastIdx)));
      }

      span.textContent = '';
      span.appendChild(frag);
    }
  }

  // Apply active search query highlight on top
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

  const refreshedSpans = Array.from(container.querySelectorAll('span'));
  for (const span of refreshedSpans) {
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
  onBookProgressChange,
  onBookMetaChange,
  initialPage,
  initialSearchQuery,
  jumpNonce
}: PdfReaderProps) {
  const { openVisualLibrary } = useLibraryNavigation();

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pagesText, setPagesText] = useState<BookPageText[]>([]);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [notes, setNotes] = useState<BookHighlightNote[]>([]);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderingPage, setRenderingPage] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(() =>
    Math.max(1, Math.min(initialPage || book.lastReadPage || 1, book.pageCount || 1))
  );
  const [pageInput, setPageInput] = useState<string>(
    String(Math.max(1, Math.min(initialPage || book.lastReadPage || 1, book.pageCount || 1)))
  );

  const [fitWidth, setFitWidth] = useState(true);
  const [manualScale, setManualScale] = useState(1.15);
  const [effectiveScale, setEffectiveScale] = useState(1.15);
  const [containerWidth, setContainerWidth] = useState(820);

  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<SidePanelTab>('search');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [activeHighlight, setActiveHighlight] = useState(initialSearchQuery || '');
  const [bookmarkLabel, setBookmarkLabel] = useState('');

  // Highlight & Note composer state
  const [noteQuote, setNoteQuote] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteColor, setNoteColor] = useState<HighlightColor>('amber');

  // Crop-to-Visual-Library state
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRectNormalized | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [cropTitle, setCropTitle] = useState('');
  const [cropCaption, setCropCaption] = useState('');
  const [cropCategory, setCropCategory] = useState<VisualCategory>('anatomy');
  const [cropDepartments, setCropDepartments] = useState<DepartmentId[]>(() =>
    book.department && book.department !== 'all'
      ? [book.department as DepartmentId]
      : ['anatomy']
  );
  const [cropExperiments, setCropExperiments] = useState('');
  const [cropEquipment, setCropEquipment] = useState('');
  const [cropTags, setCropTags] = useState('');
  const [savingCrop, setSavingCrop] = useState(false);
  const [cropNotice, setCropNotice] = useState<string | null>(null);

  const [darkPaper, setDarkPaper] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const readerRootRef = useRef<HTMLDivElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const pageFrameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);

  const totalPages = pdfDoc?.numPages || book.pageCount || 1;

  // Apply deep link updates when user navigates from a module ResourceConnector or ImageViewer
  useEffect(() => {
    if (jumpNonce === undefined) return;
    if (initialPage && initialPage >= 1) {
      const clamped = Math.max(1, Math.min(initialPage, totalPages));
      setCurrentPage(clamped);
      setPageInput(String(clamped));
    }
    if (typeof initialSearchQuery === 'string' && initialSearchQuery.trim()) {
      setSearchQuery(initialSearchQuery);
      setActiveHighlight(initialSearchQuery);
      setPanelTab('search');
      setPanelOpen(true);
    }
  }, [jumpNonce, initialPage, initialSearchQuery, totalPages]);

  // Load PDF binary, indexed page text, bookmarks, and notes from IndexedDB
  useEffect(() => {
    let cancelled = false;
    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;

    async function loadBookAssets() {
      setLoadingDoc(true);
      setDocError(null);
      setRenderError(null);

      try {
        const [buffer, storedPages, storedBookmarks, storedNotes] = await Promise.all([
          getBookFile(book.id),
          getBookPages(book.id),
          getBookmarks(book.id),
          getBookNotes(book.id)
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
        setNotes(storedNotes);

        const startPage = Math.max(
          1,
          Math.min(initialPage || book.lastReadPage || 1, loadedDoc.numPages)
        );
        setCurrentPage(startPage);
        setPageInput(String(startPage));
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

  // Revoke crop preview object URL on unmount/change
  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  // Close drawer automatically on small viewports initially so page fills screen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && !initialSearchQuery) {
      setPanelOpen(false);
    }
  }, [initialSearchQuery]);

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

  const currentPageNotes = useMemo(
    () => notes.filter((n) => n.pageNumber === currentPage),
    [notes, currentPage]
  );

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

        applyTextLayerHighlights(textLayerDiv, activeHighlight, currentPageNotes);
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
  }, [pdfDoc, currentPage, fitWidth, manualScale, containerWidth, activeHighlight, currentPageNotes]);

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
      setCropMode(false);
      setCropRect(null);
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

  const handleCaptureSelectionForNote = () => {
    const selected = window.getSelection()?.toString()?.replace(/\s+/g, ' ').trim() || '';
    if (selected) {
      setNoteQuote(selected.slice(0, 400));
    }
    setPanelTab('notes');
    setPanelOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const quote = noteQuote.trim();
    const note = noteBody.trim();
    if (!quote && !note) return;

    const entry: BookHighlightNote = {
      id: `${book.id}_note_${currentPage}_${Date.now()}`,
      bookId: book.id,
      pageNumber: currentPage,
      quote,
      note,
      color: noteColor,
      createdAt: Date.now()
    };

    await addBookNote(entry);
    setNotes((prev) =>
      [...prev, entry].sort((a, b) => a.pageNumber - b.pageNumber || a.createdAt - b.createdAt)
    );
    setNoteQuote('');
    setNoteBody('');
  };

  const handleDeleteNote = async (noteId: string) => {
    await removeBookNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Interactive crop extraction from the PDF <canvas>
  const getNormalizedPointerPos = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = pageFrameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
  };

  const handleExportCropRegion = (rectOverride?: CropRectNormalized) => {
    const canvas = canvasRef.current;
    const region = rectOverride || cropRect;
    if (!canvas || !region || region.w < 0.02 || region.h < 0.02) return;

    const sx = Math.floor(region.x * canvas.width);
    const sy = Math.floor(region.y * canvas.height);
    const sw = Math.max(12, Math.floor(region.w * canvas.width));
    const sh = Math.max(12, Math.floor(region.h * canvas.height));

    const offscreen = document.createElement('canvas');
    offscreen.width = sw;
    offscreen.height = sh;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sw, sh);
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

    offscreen.toBlob((blob) => {
      if (!blob) return;
      if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
      const url = URL.createObjectURL(blob);
      setCapturedBlob(blob);
      setCapturedPreviewUrl(url);
      setCropTitle(`${book.title} — Fig. (p. ${currentPage})`);
      setCropCaption(`Extracted diagram from ${book.title}, Page ${currentPage}`);
      setCropModalOpen(true);
    }, 'image/png');
  };

  const handleConfirmSaveCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedBlob) return;
    setSavingCrop(true);
    try {
      const splitList = (val: string) =>
        val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      const saved = await saveCroppedTextbookDiagram(capturedBlob, {
        title: cropTitle,
        caption: cropCaption,
        description: cropCaption,
        category: cropCategory,
        departments: cropDepartments,
        topics: splitList(cropTags),
        experiments: splitList(cropExperiments),
        equipment: splitList(cropEquipment),
        tags: splitList(cropTags),
        bookTitle: book.title,
        bookId: book.id,
        pageNumber: currentPage
      });

      setCropNotice(`Saved "${saved.title}" to your Scientific Visual Library.`);
      setCropModalOpen(false);
      setCropMode(false);
      setCropRect(null);
      setCapturedBlob(null);
    } finally {
      setSavingCrop(false);
    }
  };

  const handleUpdateDepartment = async (nextDept: BookDepartmentTag) => {
    const updated = await updateBookMeta(book.id, { department: nextDept });
    if (updated && onBookMetaChange) {
      onBookMetaChange(updated);
    }
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
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[260px] lg:max-w-[320px]">
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

        {/* Right: Zoom, Crop Diagram, Note, Bookmark, Dark Paper, Panel, Fullscreen */}
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
            onClick={() => {
              setCropMode((prev) => !prev);
              setCropRect(null);
            }}
            disabled={loadingDoc}
            className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              cropMode
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title="Crop diagram from this page into Scientific Visual Library"
          >
            <Crop className="w-4 h-4" />
            <span className="hidden xl:inline">{cropMode ? 'Cancel Crop' : 'Capture Diagram'}</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureSelectionForNote}
            disabled={loadingDoc}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            title="Highlight text or add note on this page"
          >
            <Highlighter className="w-4 h-4" />
            <span className="hidden 2xl:inline">Highlight</span>
          </button>

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
          </button>

          <button
            type="button"
            onClick={() => setDarkPaper((prev) => !prev)}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
              darkPaper
                ? 'bg-slate-800 border-slate-700 text-emerald-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title="Toggle reader night contrast mode"
            aria-label="Toggle reader night contrast mode"
          >
            {darkPaper ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setPanelOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              panelOpen
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            aria-label="Toggle search, notes, and bookmarks panel"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Panel</span>
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

      {/* Capture Success Banner */}
      {cropNotice && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{cropNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openVisualLibrary({ query: book.title })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold"
            >
              <Images className="w-3.5 h-3.5" />
              <span>View in Visual Library</span>
            </button>
            <button
              type="button"
              onClick={() => setCropNotice(null)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              aria-label="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Crop Mode Instruction Bar */}
      {cropMode && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <span>
            Drag a box over any figure on Page {currentPage} to extract it into the Scientific Visual Library.
          </span>
          <div className="flex items-center gap-2">
            {cropRect && cropRect.w >= 0.02 && cropRect.h >= 0.02 && (
              <button
                type="button"
                onClick={() => handleExportCropRegion()}
                className="px-3 py-1 rounded-md bg-white text-emerald-700 font-semibold"
              >
                Extract Selection
              </button>
            )}
            <button
              type="button"
              onClick={() => handleExportCropRegion({ x: 0, y: 0, w: 1, h: 1 })}
              className="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
            >
              Capture Full Page
            </button>
            <button
              type="button"
              onClick={() => {
                setCropMode(false);
                setCropRect(null);
              }}
              className="px-2.5 py-1 rounded-md bg-emerald-700/70 hover:bg-emerald-800 text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Split Reader Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* PDF Page Canvas Viewport */}
        <div
          ref={stageContainerRef}
          className={`flex-1 overflow-auto p-3 sm:p-6 flex flex-col items-center transition-colors ${
            darkPaper ? 'bg-slate-950' : 'bg-slate-200/75 dark:bg-slate-950'
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
                ref={pageFrameRef}
                className={`relative shadow-lg border border-slate-300/80 dark:border-slate-700/80 bg-white ${
                  cropMode ? 'cursor-crosshair select-none' : 'select-text'
                }`}
                style={
                  darkPaper && !cropMode
                    ? { filter: 'invert(0.89) hue-rotate(180deg) contrast(0.95)' }
                    : undefined
                }
                onMouseDown={(e) => {
                  if (!cropMode) return;
                  const pos = getNormalizedPointerPos(e);
                  setCropDragStart(pos);
                  setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
                }}
                onMouseMove={(e) => {
                  if (!cropMode || !cropDragStart) return;
                  const pos = getNormalizedPointerPos(e);
                  setCropRect({
                    x: Math.min(cropDragStart.x, pos.x),
                    y: Math.min(cropDragStart.y, pos.y),
                    w: Math.abs(pos.x - cropDragStart.x),
                    h: Math.abs(pos.y - cropDragStart.y)
                  });
                }}
                onMouseUp={() => {
                  if (!cropMode) return;
                  setCropDragStart(null);
                }}
              >
                <canvas ref={canvasRef} className="block" />
                <div
                  ref={textLayerRef}
                  className={`pdf-text-layer ${cropMode ? 'pointer-events-none' : ''}`}
                />

                {cropMode && (
                  <div className="absolute inset-0 bg-slate-950/20 pointer-events-none z-20">
                    {cropRect && cropRect.w > 0.01 && cropRect.h > 0.01 && (
                      <div
                        className="absolute border-2 border-emerald-500 bg-emerald-400/15 shadow-sm"
                        style={{
                          left: `${cropRect.x * 100}%`,
                          top: `${cropRect.y * 100}%`,
                          width: `${cropRect.w * 100}%`,
                          height: `${cropRect.h * 100}%`
                        }}
                      />
                    )}
                  </div>
                )}

                {renderingPage && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/30 flex items-center justify-center pointer-events-none z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search, Bookmarks, Notes & Info Side Panel */}
        {panelOpen && (
          <aside
            aria-label="Book search, bookmarks, and notes panel"
            className="w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 absolute inset-y-0 right-0 lg:static z-20 shadow-xl lg:shadow-none"
          >
            {/* Panel Tabs */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex-1">
                {[
                  { id: 'search', label: 'Search', icon: Search },
                  { id: 'bookmarks', label: `Marks (${bookmarks.length})`, icon: Bookmark },
                  { id: 'notes', label: `Notes (${notes.length})`, icon: StickyNote },
                  { id: 'info', label: 'Info', icon: Info }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = panelTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPanelTab(tab.id as SidePanelTab)}
                      className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
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
                        This PDF appears to be a scanned document or image-only file without embedded text. Full-book search is unavailable for scanned pages, though you can read, zoom, crop diagrams, and bookmark pages normally.
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
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No bookmarks saved for this book yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {bookmarks.map((bm) => (
                        <div
                          key={bm.id}
                          className={`p-3 rounded-xl border transition-colors space-y-1.5 ${
                            bm.pageNumber === currentPage
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => goToPage(bm.pageNumber)}
                              className="text-left text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              Page {bm.pageNumber} · {bm.label}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBookmark(bm.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              aria-label={`Remove bookmark on page ${bm.pageNumber}`}
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

              {panelTab === 'notes' && (
                <div className="space-y-4">
                  <form
                    onSubmit={handleSaveNote}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Highlight &amp; Study Note (Page {currentPage})
                      </span>
                      <button
                        type="button"
                        onClick={handleCaptureSelectionForNote}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Pull PDF Selection
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={noteQuote}
                      onChange={(e) => setNoteQuote(e.target.value)}
                      placeholder="Select text on PDF page or paste a passage to highlight..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />

                    <textarea
                      rows={2}
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="Study note or clinical correlation..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        {(Object.keys(HIGHLIGHT_STYLES) as HighlightColor[]).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setNoteColor(col)}
                            aria-label={`Highlight color ${HIGHLIGHT_STYLES[col].label}`}
                            className={`w-5 h-5 rounded-full ${HIGHLIGHT_STYLES[col].chip} border-2 transition-transform ${
                              noteColor === col
                                ? 'border-slate-900 dark:border-white scale-110'
                                : 'border-transparent opacity-75'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={!noteQuote.trim() && !noteBody.trim()}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>

                  {notes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      Select any text on a PDF page and click Highlight to save passages and notes locally.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {notes.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-3 rounded-xl border space-y-1.5 ${
                            entry.pageNumber === currentPage
                              ? 'bg-emerald-500/5 border-emerald-500/40'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => goToPage(entry.pageNumber, entry.quote.slice(0, 40))}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_STYLES[entry.color].chip}`}
                              />
                              <span>Page {entry.pageNumber}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(entry.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              aria-label="Delete study note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {entry.quote && (
                            <p className="text-xs italic text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                              "{entry.quote}"
                            </p>
                          )}
                          {entry.note && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {entry.note}
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

                    <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <label className="block text-slate-500 dark:text-slate-400 font-medium">
                        Linked B.Pharm Subject
                      </label>
                      <select
                        value={book.department || 'all'}
                        onChange={(e) => handleUpdateDepartment(e.target.value as BookDepartmentTag)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                      >
                        {(Object.keys(BOOK_DEPARTMENT_LABELS) as BookDepartmentTag[]).map((k) => (
                          <option key={k} value={k}>
                            {BOOK_DEPARTMENT_LABELS[k]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <dl className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
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

      {/* Save Cropped Textbook Diagram Modal */}
      {cropModalOpen && capturedPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !savingCrop && setCropModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Save extracted textbook diagram"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Import Textbook Diagram to Visual Library
              </h3>
              <button
                type="button"
                onClick={() => !savingCrop && setCropModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2">
              <img
                src={capturedPreviewUrl}
                alt="Cropped textbook figure preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <form onSubmit={handleConfirmSaveCrop} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Figure Title
                </label>
                <input
                  type="text"
                  required
                  value={cropTitle}
                  onChange={(e) => setCropTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={cropCategory}
                    onChange={(e) => setCropCategory(e.target.value as VisualCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Associated Experiments
                  </label>
                  <input
                    type="text"
                    value={cropExperiments}
                    onChange={(e) => setCropExperiments(e.target.value)}
                    placeholder="e.g. Exp 14, Exp 8"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={cropCaption}
                  onChange={(e) => setCropCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Departments
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(DEPARTMENT_LABELS) as DepartmentId[]).map((dept) => {
                    const active = cropDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() =>
                          setCropDepartments((prev) =>
                            prev.includes(dept)
                              ? prev.filter((d) => d !== dept)
                              : [...prev, dept]
                          )
                        }
                        className={`px-2 py-1 rounded-md border text-[11px] font-medium ${
                          active
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {DEPARTMENT_LABELS[dept].split(' (')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Equipment
                  </label>
                  <input
                    type="text"
                    value={cropEquipment}
                    onChange={(e) => setCropEquipment(e.target.value)}
                    placeholder="e.g. Burette, ECG"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={cropTags}
                    onChange={(e) => setCropTags(e.target.value)}
                    placeholder="e.g. heart, valves"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCrop}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingCrop ? 'Saving...' : 'Save to Visual Library'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
