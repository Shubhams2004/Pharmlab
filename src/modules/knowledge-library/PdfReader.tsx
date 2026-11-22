import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crop,
  Eye,
  FileText,
  Hand,
  Highlighter,
  Images,
  Info,
  LayoutGrid,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  Moon,
  MoreHorizontal,
  MousePointer,
  RotateCw,
  ScrollText,
  Search,
  Square,
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
import {
  CropRectNormalized,
  HIGHLIGHT_STYLES,
  PageSize,
  PdfPageView,
  PdfThumbnailTile
} from './PdfPageView';
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

type SidePanelTab = 'search' | 'thumbs' | 'toc' | 'bookmarks' | 'notes' | 'info';
type FitMode = 'width' | 'page' | 'manual';
type ViewMode = 'continuous' | 'single';
type InteractionMode = 'select' | 'pan';

interface PdfOutlineNode {
  title: string;
  dest?: string | unknown[] | null;
  items?: PdfOutlineNode[];
}

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5];

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

function getTouchDistance(t1: React.Touch | Touch, t2: React.Touch | Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
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
  const { openVisualLibrary, setWorkspaceSection, preferences } = useLibraryNavigation();

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [outlineItems, setOutlineItems] = useState<PdfOutlineNode[]>([]);
  const [resolvingTocKey, setResolvingTocKey] = useState<string | null>(null);
  const [pagesText, setPagesText] = useState<BookPageText[]>([]);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [notes, setNotes] = useState<BookHighlightNote[]>([]);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(() =>
    Math.max(1, Math.min(initialPage || book.lastReadPage || 1, book.pageCount || 1))
  );
  const [pageInput, setPageInput] = useState<string>(
    String(Math.max(1, Math.min(initialPage || book.lastReadPage || 1, book.pageCount || 1)))
  );

  // Full viewer modes: continuous scroll vs single page, select vs free hand-pan
  const [viewMode, setViewMode] = useState<ViewMode>('continuous');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select');
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingPan, setIsDraggingPan] = useState(false);

  // Zoom, Fit & Rotation
  const [fitMode, setFitMode] = useState<FitMode>(() => preferences.defaultPdfFit || 'width');
  const [manualScale, setManualScale] = useState(1.15);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [stageSize, setStageSize] = useState({ width: 820, height: 640 });
  const [pinchPreviewRatio, setPinchPreviewRatio] = useState(1);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);

  // Per-page dimensions + virtualization state
  const [defaultPageSize, setDefaultPageSize] = useState<PageSize>({ width: 612, height: 792 });
  const [pageSizes, setPageSizes] = useState<Record<number, PageSize>>({});
  const [visiblePages, setVisiblePages] = useState<Set<number>>(() => new Set([1]));

  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<SidePanelTab>('search');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [activeHighlight, setActiveHighlight] = useState(initialSearchQuery || '');
  const [searchScrollTargetPage, setSearchScrollTargetPage] = useState<number | null>(null);
  const [bookmarkLabel, setBookmarkLabel] = useState('');

  // Mobile overflow menu & floating text selection bar
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [selectedPageText, setSelectedPageText] = useState('');
  const [copiedSelection, setCopiedSelection] = useState(false);

  // Highlight & Note composer state
  const [noteQuote, setNoteQuote] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteColor, setNoteColor] = useState<HighlightColor>('amber');

  // Crop-to-Visual-Library state
  const [cropMode, setCropMode] = useState(false);
  const [activeCropPage, setActiveCropPage] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<CropRectNormalized | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [capturedPageNumber, setCapturedPageNumber] = useState<number>(1);
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
  const zoomMenuRef = useRef<HTMLDivElement | null>(null);
  const pageWrapperRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const onBookProgressChangeRef = useRef(onBookProgressChange);
  onBookProgressChangeRef.current = onBookProgressChange;

  // Scroll synchronization & jump guards
  const suppressScrollSyncUntilRef = useRef<number>(0);
  const pendingInitialScrollPageRef = useRef<number | null>(null);
  const wheelFocalAnchorRef = useRef<{
    ratioX: number;
    ratioY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Panning gesture state
  const panGestureRef = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0
  });

  // Touch gesture refs
  const pinchStateRef = useRef<{
    active: boolean;
    startDist: number;
    startScale: number;
    ratio: number;
  }>({ active: false, startDist: 0, startScale: 1, ratio: 1 });

  const swipeStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startTime: number;
  }>({ active: false, startX: 0, startY: 0, startTime: 0 });

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0
  });

  const totalPages = pdfDoc?.numPages || book.pageCount || 1;
  const effectivePanMode = !cropMode && (interactionMode === 'pan' || isSpacePressed);

  // Compute effective scale from fit mode, container stage dimensions, and current page aspect
  const activeBaseSize = pageSizes[currentPage] || defaultPageSize;
  const isSwappedRotation = rotation === 90 || rotation === 270;
  const rotatedBaseWidth = isSwappedRotation ? activeBaseSize.height : activeBaseSize.width;
  const rotatedBaseHeight = isSwappedRotation ? activeBaseSize.width : activeBaseSize.height;

  const effectiveScale = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const horizontalPadding = isMobile ? 16 : 48;
    const verticalPadding = isMobile ? 24 : 48;
    const availableWidth = Math.max(240, stageSize.width - horizontalPadding);
    const availableHeight = Math.max(240, stageSize.height - verticalPadding);

    if (fitMode === 'width') {
      return Math.max(0.35, Math.min(3.0, availableWidth / rotatedBaseWidth));
    }
    if (fitMode === 'page') {
      const widthRatio = availableWidth / rotatedBaseWidth;
      const heightRatio = availableHeight / rotatedBaseHeight;
      return Math.max(0.35, Math.min(3.0, Math.min(widthRatio, heightRatio)));
    }
    return manualScale;
  }, [fitMode, manualScale, rotatedBaseWidth, rotatedBaseHeight, stageSize.width, stageSize.height]);

  useEffect(() => {
    setWorkspaceSection(book.title, `Page ${currentPage} of ${totalPages}`);
  }, [book.title, currentPage, totalPages, setWorkspaceSection]);

  // Register refs per page for virtualization + cropping + programmatic scroll
  const registerWrapperRef = useCallback((pageNumber: number, el: HTMLDivElement | null) => {
    if (el) {
      pageWrapperRefs.current.set(pageNumber, el);
    } else {
      pageWrapperRefs.current.delete(pageNumber);
    }
  }, []);

  const registerCanvasRef = useCallback((pageNumber: number, el: HTMLCanvasElement | null) => {
    if (el) {
      pageCanvasRefs.current.set(pageNumber, el);
    } else {
      pageCanvasRefs.current.delete(pageNumber);
    }
  }, []);

  const handleMeasureBaseSize = useCallback((pageNumber: number, unrotatedSize: PageSize) => {
    setPageSizes((prev) => {
      const existing = prev[pageNumber];
      if (
        existing &&
        Math.abs(existing.width - unrotatedSize.width) < 2 &&
        Math.abs(existing.height - unrotatedSize.height) < 2
      ) {
        return prev;
      }
      return { ...prev, [pageNumber]: unrotatedSize };
    });
  }, []);

  // Scroll cleanly to a specific page frame inside stageContainerRef
  const scrollToPageFrame = useCallback(
    (targetPage: number, behavior: ScrollBehavior = 'auto') => {
      const stage = stageContainerRef.current;
      const wrapper = pageWrapperRefs.current.get(targetPage);
      if (!stage || !wrapper) return;

      suppressScrollSyncUntilRef.current =
        Date.now() + (behavior === 'smooth' ? 750 : 280);

      const stageRect = stage.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const topOffset = wrapperRect.top - stageRect.top + stage.scrollTop - 16;

      stage.scrollTo({
        top: Math.max(0, topOffset),
        behavior
      });
    },
    []
  );

  // Explicit user-initiated page jump (prev/next, input, TOC, search, bookmark, thumbnail, scrubber)
  const goToPage = useCallback(
    (target: number, highlightTerm?: string, fromSearchHit = false) => {
      const clamped = Math.max(1, Math.min(totalPages, Math.round(target)));
      const distance = Math.abs(clamped - currentPage);

      setCurrentPage(clamped);
      setPageInput(String(clamped));
      if (typeof highlightTerm === 'string') {
        setActiveHighlight(highlightTerm);
      }
      setSearchScrollTargetPage(fromSearchHit ? clamped : null);
      setCropMode(false);
      setActiveCropPage(null);
      setCropRect(null);
      setSelectedPageText('');

      if (viewMode === 'continuous') {
        requestAnimationFrame(() => {
          scrollToPageFrame(clamped, distance <= 2 ? 'smooth' : 'auto');
        });
      } else {
        stageContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [totalPages, currentPage, viewMode, scrollToPageFrame]
  );

  // Apply deep link updates when user navigates from a module ResourceConnector or ImageViewer
  useEffect(() => {
    if (jumpNonce === undefined) return;
    if (initialPage && initialPage >= 1) {
      const clamped = Math.max(1, Math.min(initialPage, totalPages));
      setCurrentPage(clamped);
      setPageInput(String(clamped));
      pendingInitialScrollPageRef.current = clamped;
    }
    if (typeof initialSearchQuery === 'string' && initialSearchQuery.trim()) {
      setSearchQuery(initialSearchQuery);
      setActiveHighlight(initialSearchQuery);
      setSearchScrollTargetPage(initialPage || currentPage);
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
      setPageSizes({});

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

        // Measure page 1 base size immediately so placeholder page frames don't jump
        try {
          const p1 = await loadedDoc.getPage(1);
          const vp1 = p1.getViewport({ scale: 1, rotation: 0 });
          if (!cancelled) {
            setDefaultPageSize({ width: vp1.width, height: vp1.height });
            setPageSizes({ 1: { width: vp1.width, height: vp1.height } });
          }
          p1.cleanup();
        } catch {
          // keep US Letter fallback size
        }

        if (cancelled) return;

        setPdfDoc(loadedDoc);
        setPagesText(storedPages);
        setBookmarks(storedBookmarks);
        setNotes(storedNotes);

        try {
          const rawOutline = await loadedDoc.getOutline();
          if (!cancelled) {
            setOutlineItems((rawOutline as PdfOutlineNode[] | null) || []);
          }
        } catch {
          if (!cancelled) setOutlineItems([]);
        }

        const startPage = Math.max(
          1,
          Math.min(initialPage || book.lastReadPage || 1, loadedDoc.numPages)
        );
        setCurrentPage(startPage);
        setPageInput(String(startPage));
        setVisiblePages(new Set([startPage]));
        if (startPage > 1) {
          pendingInitialScrollPageRef.current = startPage;
        }
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

  // Execute pending scroll once pages mount after initial open / deep link / mode toggle
  useEffect(() => {
    if (loadingDoc || !pdfDoc || viewMode !== 'continuous') return;
    const target = pendingInitialScrollPageRef.current;
    if (!target) return;

    const timer = window.setTimeout(() => {
      scrollToPageFrame(target, 'auto');
      pendingInitialScrollPageRef.current = null;
    }, 60);

    return () => window.clearTimeout(timer);
  }, [loadingDoc, pdfDoc, viewMode, scrollToPageFrame]);

  // Maintain cursor focal position after smooth Ctrl+Wheel zoom
  useEffect(() => {
    const anchor = wheelFocalAnchorRef.current;
    const stage = stageContainerRef.current;
    if (!anchor || !stage) return;

    wheelFocalAnchorRef.current = null;
    requestAnimationFrame(() => {
      const nextScrollLeft = anchor.ratioX * stage.scrollWidth - anchor.offsetX;
      const nextScrollTop = anchor.ratioY * stage.scrollHeight - anchor.offsetY;
      stage.scrollTo({
        left: Math.max(0, nextScrollLeft),
        top: Math.max(0, nextScrollTop),
        behavior: 'auto'
      });
    });
  }, [effectiveScale]);

  // Revoke crop preview object URL on unmount/change
  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  // Close drawer automatically on small/tablet viewports initially so page fills screen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && !initialSearchQuery) {
      setPanelOpen(false);
    }
  }, [initialSearchQuery]);

  // Close zoom preset popover on outside click
  useEffect(() => {
    if (!zoomMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setZoomMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [zoomMenuOpen]);

  // Measure viewport stage width & height for Fit Width / Fit Page zoom
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setStageSize((prev) =>
          Math.abs(prev.width - w) > 2 || Math.abs(prev.height - h) > 2
            ? { width: w, height: h }
            : prev
        );
      }
    };
    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [panelOpen, isFullscreen]);

  // Sync native fullscreen change events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Track text selection anywhere inside PDF stage TextLayers
  useEffect(() => {
    let timer: number | undefined;
    const onSelectionChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (cropMode || effectivePanMode) {
          setSelectedPageText('');
          return;
        }
        const sel = window.getSelection();
        const text = sel?.toString()?.replace(/\s+/g, ' ').trim() || '';
        const anchorNode = sel?.anchorNode;
        const anchorEl =
          anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement || null;
        const insideTextLayer = Boolean(
          anchorEl &&
            stageContainerRef.current?.contains(anchorEl) &&
            anchorEl.closest('.pdf-text-layer')
        );

        if (text.length >= 2 && insideTextLayer) {
          setSelectedPageText(text.slice(0, 400));
          setCopiedSelection(false);
        } else {
          setSelectedPageText('');
        }
      }, 120);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [cropMode, effectivePanMode]);

  // Virtualization observer: track visible pages in Continuous Scroll mode
  useEffect(() => {
    if (loadingDoc || !pdfDoc || viewMode !== 'continuous') return;
    const stage = stageContainerRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return;

    const currentlyVisible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          const rawNum = (entry.target as HTMLElement).dataset.pageNumber;
          const pageNum = rawNum ? parseInt(rawNum, 10) : NaN;
          if (Number.isNaN(pageNum)) continue;
          if (entry.isIntersecting) {
            if (!currentlyVisible.has(pageNum)) {
              currentlyVisible.add(pageNum);
              changed = true;
            }
          } else if (currentlyVisible.has(pageNum)) {
            currentlyVisible.delete(pageNum);
            changed = true;
          }
        }
        if (changed) {
          setVisiblePages(new Set(currentlyVisible));
        }
      },
      {
        root: stage,
        rootMargin: '420px 0px',
        threshold: [0, 0.05]
      }
    );

    pageWrapperRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loadingDoc, pdfDoc, viewMode, totalPages, effectiveScale, rotation]);

  // Update active currentPage based on free vertical scrolling in Continuous mode
  const handleStageScroll = useCallback(() => {
    if (viewMode !== 'continuous' || loadingDoc || !pdfDoc) return;
    if (Date.now() < suppressScrollSyncUntilRef.current) return;

    const stage = stageContainerRef.current;
    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();
    const focalY = stageRect.top + Math.min(stageRect.height * 0.38, 280);

    let bestPage = currentPage;
    let bestDistance = Number.POSITIVE_INFINITY;

    pageWrapperRefs.current.forEach((el, pageNum) => {
      const rect = el.getBoundingClientRect();
      // If focal line sits directly inside this page, distance = 0
      let dist = 0;
      if (focalY < rect.top) {
        dist = rect.top - focalY;
      } else if (focalY > rect.bottom) {
        dist = focalY - rect.bottom;
      }
      if (dist < bestDistance) {
        bestDistance = dist;
        bestPage = pageNum;
      }
    });

    if (bestPage !== currentPage) {
      setCurrentPage(bestPage);
      setPageInput(String(bestPage));
    }
  }, [viewMode, loadingDoc, pdfDoc, currentPage]);

  // Persist reading position in IndexedDB (debounced softly so rapid continuous scroll stays fast)
  useEffect(() => {
    if (!pdfDoc) return;
    setPageInput(String(currentPage));
    const timer = window.setTimeout(() => {
      onBookProgressChangeRef.current(book.id, currentPage);
      updateBookReadingProgress(book.id, currentPage).catch(() => {});
    }, 220);
    return () => window.clearTimeout(timer);
  }, [book.id, currentPage, pdfDoc]);

  // Ctrl/Cmd + Mouse Wheel smooth zoom around cursor focal point
  useEffect(() => {
    const stage = stageContainerRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const stageRect = stage.getBoundingClientRect();
      const offsetX = e.clientX - stageRect.left;
      const offsetY = e.clientY - stageRect.top;
      const ratioX =
        stage.scrollWidth > 0 ? (stage.scrollLeft + offsetX) / stage.scrollWidth : 0.5;
      const ratioY =
        stage.scrollHeight > 0 ? (stage.scrollTop + offsetY) / stage.scrollHeight : 0.5;

      const factor = Math.exp(-e.deltaY * 0.0022);
      const next = Math.max(
        0.35,
        Math.min(3.5, Number((effectiveScale * factor).toFixed(2)))
      );

      if (Math.abs(next - effectiveScale) >= 0.01) {
        wheelFocalAnchorRef.current = { ratioX, ratioY, offsetX, offsetY };
        setFitMode('manual');
        setManualScale(next);
      }
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [effectiveScale]);

  const handleOpenOutlineNode = useCallback(
    async (node: PdfOutlineNode, key: string) => {
      if (!pdfDoc || !node.dest) return;
      setResolvingTocKey(key);
      try {
        const destArray =
          typeof node.dest === 'string'
            ? await pdfDoc.getDestination(node.dest)
            : node.dest;
        if (Array.isArray(destArray) && destArray.length > 0 && destArray[0]) {
          const pageIndex = await pdfDoc.getPageIndex(
            destArray[0] as Parameters<pdfjsLib.PDFDocumentProxy['getPageIndex']>[0]
          );
          if (typeof pageIndex === 'number' && pageIndex >= 0) {
            goToPage(pageIndex + 1);
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setPanelOpen(false);
            }
          }
        }
      } catch {
        // Ignore unresolvable outline destinations
      } finally {
        setResolvingTocKey(null);
      }
    },
    [pdfDoc, goToPage]
  );

  // Keyboard shortcuts + Spacebar temporary pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space' && !e.repeat && !cropMode) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      if (e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if ((e.key === '+' || e.key === '=') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const next = Math.min(3.5, Number((effectiveScale + 0.15).toFixed(2)));
        setFitMode('manual');
        setManualScale(next);
      } else if (e.key === '-' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const next = Math.max(0.35, Number((effectiveScale - 0.15).toFixed(2)));
        setFitMode('manual');
        setManualScale(next);
      } else if (e.key === '0' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setFitMode('width');
      } else if ((e.key === 'h' || e.key === 'H') && !e.metaKey && !e.ctrlKey) {
        setInteractionMode((prev) => (prev === 'pan' ? 'select' : 'pan'));
      } else if (e.key === 'Escape') {
        if (zoomMenuOpen) {
          setZoomMenuOpen(false);
        } else if (isFullscreen && !document.fullscreenElement) {
          setIsFullscreen(false);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const onBlur = () => {
      setIsSpacePressed(false);
      setIsDraggingPan(false);
      panGestureRef.current.active = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [currentPage, totalPages, goToPage, isFullscreen, effectiveScale, cropMode, zoomMenuOpen]);

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
    const next = Math.min(3.5, Number((effectiveScale + 0.2).toFixed(2)));
    setFitMode('manual');
    setManualScale(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(0.35, Number((effectiveScale - 0.2).toFixed(2)));
    setFitMode('manual');
    setManualScale(next);
  };

  const handleSelectZoomPreset = (preset: 'width' | 'page' | number) => {
    if (preset === 'width' || preset === 'page') {
      setFitMode(preset);
    } else {
      setFitMode('manual');
      setManualScale(preset);
    }
    setZoomMenuOpen(false);
  };

  const handleCycleFitMode = () => {
    setFitMode((prev) => (prev === 'width' ? 'page' : 'width'));
  };

  const handleRotatePage = () => {
    setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
  };

  const handleToggleViewMode = () => {
    const nextMode: ViewMode = viewMode === 'continuous' ? 'single' : 'continuous';
    if (nextMode === 'continuous') {
      pendingInitialScrollPageRef.current = currentPage;
    }
    setViewMode(nextMode);
    setVisiblePages(new Set([currentPage]));
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

  // Free 2D Drag Panning via Pointer Events (Mouse left-drag in Pan mode, Space+drag, middle-mouse drag, or 1-finger touch in Pan mode)
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cropMode || loadingDoc) return;
    if ((e.target as HTMLElement | null)?.closest('button, a, input, select, textarea')) {
      return;
    }

    const isMiddleMouse = e.pointerType === 'mouse' && e.button === 1;
    const isPrimaryPan = effectivePanMode && (e.button === 0 || e.pointerType !== 'mouse');
    if (!isMiddleMouse && !isPrimaryPan) return;

    const stage = stageContainerRef.current;
    if (!stage) return;

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    panGestureRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: stage.scrollLeft,
      startScrollTop: stage.scrollTop
    };
    setIsDraggingPan(true);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const pan = panGestureRef.current;
    if (!pan.active || pan.pointerId !== e.pointerId) return;
    const stage = stageContainerRef.current;
    if (!stage) return;

    e.preventDefault();
    const dx = e.clientX - pan.startX;
    const dy = e.clientY - pan.startY;
    stage.scrollLeft = pan.startScrollLeft - dx;
    stage.scrollTop = pan.startScrollTop - dy;
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const pan = panGestureRef.current;
    if (!pan.active || pan.pointerId !== e.pointerId) return;
    pan.active = false;
    pan.pointerId = -1;
    setIsDraggingPan(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  // Non-passive touchmove listener on stage container so 2-finger pinch never fights browser zoom
  useEffect(() => {
    const stage = stageContainerRef.current;
    if (!stage) return;

    const onNativeTouchMove = (e: TouchEvent) => {
      if (cropMode) return;
      if (e.touches.length === 2 && pinchStateRef.current.active) {
        if (e.cancelable) e.preventDefault();
      }
    };

    stage.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    return () => stage.removeEventListener('touchmove', onNativeTouchMove);
  }, [cropMode]);

  const handleStageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (cropMode || loadingDoc) return;
    if ((e.target as HTMLElement | null)?.closest('button, a, input, select, textarea')) {
      swipeStateRef.current.active = false;
      return;
    }

    if (e.touches.length === 2) {
      swipeStateRef.current.active = false;
      panGestureRef.current.active = false;
      setIsDraggingPan(false);
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (dist > 10) {
        pinchStateRef.current = {
          active: true,
          startDist: dist,
          startScale: effectiveScale,
          ratio: 1
        };
      }
      return;
    }

    if (e.touches.length === 1 && viewMode === 'single' && !effectivePanMode) {
      const t = e.touches[0];
      swipeStateRef.current = {
        active: true,
        startX: t.clientX,
        startY: t.clientY,
        startTime: Date.now()
      };
    }
  };

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (cropMode || loadingDoc) return;

    if (e.touches.length === 2 && pinchStateRef.current.active) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (pinchStateRef.current.startDist > 0) {
        const rawRatio = dist / pinchStateRef.current.startDist;
        const clampedTargetScale = Math.max(
          0.35,
          Math.min(3.5, pinchStateRef.current.startScale * rawRatio)
        );
        const clampedRatio = clampedTargetScale / pinchStateRef.current.startScale;
        pinchStateRef.current.ratio = clampedRatio;
        setPinchPreviewRatio(clampedRatio);
      }
      return;
    }

    if (e.touches.length === 1 && swipeStateRef.current.active) {
      const dx = Math.abs(e.touches[0].clientX - swipeStateRef.current.startX);
      const dy = Math.abs(e.touches[0].clientY - swipeStateRef.current.startY);
      if (dy > dx && dy > 16) {
        swipeStateRef.current.active = false;
      }
    }
  };

  const handleStageTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pinchStateRef.current.active && e.touches.length < 2) {
      const finalScale = Math.max(
        0.35,
        Math.min(3.5, Number((pinchStateRef.current.startScale * pinchStateRef.current.ratio).toFixed(2)))
      );
      pinchStateRef.current.active = false;
      setPinchPreviewRatio(1);
      if (Math.abs(finalScale - effectiveScale) > 0.04) {
        setFitMode('manual');
        setManualScale(finalScale);
      }
      return;
    }

    if (!cropMode && e.changedTouches.length === 1 && e.touches.length === 0) {
      if ((e.target as HTMLElement | null)?.closest('button, a, input, select, textarea')) {
        swipeStateRef.current.active = false;
        return;
      }
      const t = e.changedTouches[0];
      const stage = stageContainerRef.current;
      const hasHorizontalScroll =
        stage ? stage.scrollWidth > stage.clientWidth + 6 : false;
      const hasSelection = (window.getSelection()?.toString()?.trim().length || 0) > 0;

      // Horizontal swipe page turn in Single Page mode when page fits horizontally
      if (
        viewMode === 'single' &&
        !effectivePanMode &&
        swipeStateRef.current.active &&
        !hasHorizontalScroll &&
        !hasSelection
      ) {
        const dx = t.clientX - swipeStateRef.current.startX;
        const dy = t.clientY - swipeStateRef.current.startY;
        const dt = Date.now() - swipeStateRef.current.startTime;

        if (dt < 450 && Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 2) {
          swipeStateRef.current.active = false;
          if (dx < 0 && currentPage < totalPages) {
            goToPage(currentPage + 1);
            return;
          }
          if (dx > 0 && currentPage > 1) {
            goToPage(currentPage - 1);
            return;
          }
        }
      }
      swipeStateRef.current.active = false;

      // Double-tap on mobile to zoom in / reset to Fit Width
      const now = Date.now();
      const dtTap = now - lastTapRef.current.time;
      const distTap = Math.hypot(
        t.clientX - lastTapRef.current.x,
        t.clientY - lastTapRef.current.y
      );
      if (dtTap > 40 && dtTap < 290 && distTap < 28 && !hasSelection && !effectivePanMode) {
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        if (fitMode === 'manual' && manualScale > 1.35) {
          setFitMode('width');
        } else {
          setFitMode('manual');
          setManualScale(Math.min(2.4, Number((effectiveScale * 1.55).toFixed(2))));
        }
      } else {
        lastTapRef.current = { time: now, x: t.clientX, y: t.clientY };
      }
    }
  };

  // Search results memoized across pre-extracted IndexedDB pages
  const searchResults: SearchMatch[] = useMemo(() => {
    if (!book.hasSearchableText || searchQuery.trim().length < 2) return [];
    return searchBookPages(pagesText, searchQuery);
  }, [book.hasSearchableText, pagesText, searchQuery]);

  // Unique pages matching active highlight for Next/Prev match stepping
  const matchingPagesOrdered = useMemo(() => {
    const unique: number[] = [];
    const seen = new Set<number>();
    const list =
      searchResults.length > 0
        ? searchResults
        : activeHighlight.trim().length >= 2 && book.hasSearchableText
          ? searchBookPages(pagesText, activeHighlight)
          : [];
    for (const m of list) {
      if (!seen.has(m.pageNumber)) {
        seen.add(m.pageNumber);
        unique.push(m.pageNumber);
      }
    }
    return unique.sort((a, b) => a - b);
  }, [searchResults, activeHighlight, book.hasSearchableText, pagesText]);

  const stepSearchMatchPage = (dir: -1 | 1) => {
    if (matchingPagesOrdered.length === 0) return;
    if (dir === 1) {
      const next = matchingPagesOrdered.find((p) => p > currentPage) ?? matchingPagesOrdered[0];
      goToPage(next, activeHighlight, true);
    } else {
      const prevCandidates = matchingPagesOrdered.filter((p) => p < currentPage);
      const prev =
        prevCandidates.length > 0
          ? prevCandidates[prevCandidates.length - 1]
          : matchingPagesOrdered[matchingPagesOrdered.length - 1];
      goToPage(prev, activeHighlight, true);
    }
  };

  // Group notes & bookmarks by page for fast O(1) lookup across rendered pages
  const notesByPage = useMemo(() => {
    const map = new Map<number, BookHighlightNote[]>();
    for (const n of notes) {
      const arr = map.get(n.pageNumber);
      if (arr) {
        arr.push(n);
      } else {
        map.set(n.pageNumber, [n]);
      }
    }
    return map;
  }, [notes]);

  const bookmarkedPageSet = useMemo(
    () => new Set(bookmarks.map((bm) => bm.pageNumber)),
    [bookmarks]
  );

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

  const handleCaptureSelectionForNote = (overrideText?: string) => {
    const selected =
      overrideText ||
      selectedPageText ||
      window.getSelection()?.toString()?.replace(/\s+/g, ' ').trim() ||
      '';
    if (selected) {
      setNoteQuote(selected.slice(0, 400));
    }
    setPanelTab('notes');
    setPanelOpen(true);
    setMobileToolsOpen(false);
  };

  const handleCopySelection = async () => {
    if (!selectedPageText) return;
    try {
      await navigator.clipboard.writeText(selectedPageText);
      setCopiedSelection(true);
      window.setTimeout(() => setCopiedSelection(false), 1800);
    } catch {
      // ignore clipboard restrictions
    }
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

  // Unified Pointer-based interactive crop extraction across visible pages
  const handleStartCrop = useCallback((pageNum: number, pos: { x: number; y: number }) => {
    setActiveCropPage(pageNum);
    setCropDragStart(pos);
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }, []);

  const handleMoveCrop = useCallback(
    (pos: { x: number; y: number }) => {
      if (!cropDragStart) return;
      setCropRect({
        x: Math.min(cropDragStart.x, pos.x),
        y: Math.min(cropDragStart.y, pos.y),
        w: Math.abs(pos.x - cropDragStart.x),
        h: Math.abs(pos.y - cropDragStart.y)
      });
    },
    [cropDragStart]
  );

  const handleEndCrop = useCallback(() => {
    setCropDragStart(null);
  }, []);

  const handleExportCropRegion = (rectOverride?: CropRectNormalized, pageOverride?: number) => {
    const targetPage = pageOverride || activeCropPage || currentPage;
    const canvas = pageCanvasRefs.current.get(targetPage);
    const region = rectOverride || cropRect;
    if (!canvas || canvas.width === 0 || !region || region.w < 0.02 || region.h < 0.02) {
      return;
    }

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
      setCapturedPageNumber(targetPage);
      setCropTitle(`${book.title} — Fig. (p. ${targetPage})`);
      setCropCaption(`Extracted diagram from ${book.title}, Page ${targetPage}`);
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
        pageNumber: capturedPageNumber
      });

      setCropNotice(`Saved "${saved.title}" to your Scientific Visual Library.`);
      setCropModalOpen(false);
      setCropMode(false);
      setActiveCropPage(null);
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

  const renderedPageNumbers = useMemo(() => {
    if (viewMode === 'single') {
      return [currentPage];
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [viewMode, currentPage, totalPages]);

  const shouldRenderPage = useCallback(
    (pageNumber: number) => {
      if (viewMode === 'single') return pageNumber === currentPage;
      if (Math.abs(pageNumber - currentPage) <= 2) return true;
      return visiblePages.has(pageNumber);
    },
    [viewMode, currentPage, visiblePages]
  );

  const progressPercent = Math.round((currentPage / totalPages) * 100);
  const EMPTY_NOTES: BookHighlightNote[] = useMemo(() => [], []);

  return (
    <div
      ref={readerRootRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 h-[100dvh] flex flex-col bg-slate-100 dark:bg-slate-950'
          : 'flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden shadow-sm h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-8.5rem)] min-h-[500px] sm:min-h-[560px]'
      }
    >
      {/* Top Document Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-3.5 py-2 flex items-center justify-between gap-2 shrink-0 relative z-30">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
            aria-label="Back to Knowledge Library"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Library</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px] xs:max-w-[190px] sm:max-w-[200px] lg:max-w-[250px]">
              {book.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
              Page {currentPage} of {totalPages} · {progressPercent}%
            </p>
          </div>
        </div>

        {/* Center: Desktop/Tablet Page Controls */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loadingDoc}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Previous page"
            title="Previous page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
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
            title="Next page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Interaction Tool, Scroll Mode, Zoom Presets, Actions & Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Select vs Free Hand Pan Tool (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center gap-0.5 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => {
                setCropMode(false);
                setInteractionMode('select');
              }}
              disabled={loadingDoc}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors ${
                interactionMode === 'select' && !cropMode
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Select & copy text (Press H to toggle Hand)"
              aria-label="Text selection tool"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCropMode(false);
                setInteractionMode('pan');
              }}
              disabled={loadingDoc}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors ${
                effectivePanMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Hand / Pan tool — drag PDF freely (Hold Space anytime)"
              aria-label="Hand pan tool"
            >
              <Hand className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Mode Toggle: Continuous Scroll vs Single Page */}
          <button
            type="button"
            onClick={handleToggleViewMode}
            disabled={loadingDoc}
            className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'continuous'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title={
              viewMode === 'continuous'
                ? 'Continuous vertical scroll active — click for Single Page view'
                : 'Single Page view active — click for Continuous Scroll'
            }
            aria-label="Toggle continuous scroll or single page view"
          >
            {viewMode === 'continuous' ? (
              <ScrollText className="w-4 h-4" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span className="hidden xl:inline">
              {viewMode === 'continuous' ? 'Continuous' : 'Single'}
            </span>
          </button>

          {/* Zoom Controls + Preset Menu (Desktop) */}
          <div
            ref={zoomMenuRef}
            className="hidden md:flex items-center gap-0.5 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950 relative"
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={loadingDoc}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Zoom out"
              title="Zoom out (- or Ctrl+Scroll)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomMenuOpen((prev) => !prev)}
              disabled={loadingDoc}
              className="h-8 px-1.5 inline-flex items-center gap-0.5 rounded-md text-xs font-medium tabular-nums text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors min-w-[54px] justify-center"
              title="Zoom presets"
              aria-label="Open zoom presets"
              aria-expanded={zoomMenuOpen}
            >
              <span>{Math.round(effectiveScale * 100)}%</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={loadingDoc}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Zoom in"
              title="Zoom in (+ or Ctrl+Scroll)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCycleFitMode}
              className={`h-8 px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                fitMode !== 'manual'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
              title="Toggle Fit Width / Fit Page (0)"
            >
              {fitMode === 'page' ? 'Fit Page' : 'Fit Width'}
            </button>

            {zoomMenuOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectZoomPreset('width')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-between ${
                    fitMode === 'width'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Fit Width</span>
                  {fitMode === 'width' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectZoomPreset('page')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-between ${
                    fitMode === 'page'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Fit Page</span>
                  {fitMode === 'page' && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                {ZOOM_PRESETS.map((preset) => {
                  const active = fitMode === 'manual' && Math.abs(manualScale - preset) < 0.03;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectZoomPreset(preset)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg tabular-nums flex items-center justify-between ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{Math.round(preset * 100)}%</span>
                      {active && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleRotatePage}
            disabled={loadingDoc}
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shrink-0"
            aria-label="Rotate pages 90 degrees"
            title="Rotate pages 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setCropMode((prev) => !prev);
              setActiveCropPage(null);
              setCropRect(null);
            }}
            disabled={loadingDoc}
            className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              cropMode
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title="Crop diagram from any page into Scientific Visual Library"
          >
            <Crop className="w-4 h-4" />
            <span className="hidden 2xl:inline">{cropMode ? 'Cancel Crop' : 'Capture Diagram'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCaptureSelectionForNote()}
            disabled={loadingDoc}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            title="Highlight text or add note on this page"
          >
            <Highlighter className="w-4 h-4" />
            <span className="hidden 2xl:inline">Highlight</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBookmarkCurrentPage}
            disabled={loadingDoc}
            className={`inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
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
            className={`hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
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
            onClick={() => {
              setMobileToolsOpen(false);
              setPanelOpen((prev) => !prev);
            }}
            className={`inline-flex items-center justify-center sm:justify-start gap-1.5 h-10 w-10 sm:w-auto sm:h-9 sm:px-2.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              panelOpen
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            aria-label="Toggle pages, search, bookmarks, and notes panel"
            title="Pages, Search, Contents, Marks & Notes"
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline">Panel</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shrink-0"
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
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{cropNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openVisualLibrary({ query: book.title })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold"
            >
              <Images className="w-3.5 h-3.5" />
              <span>Visual Library</span>
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
        <div className="bg-emerald-600 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <span>
            Drag over any figure on Page {activeCropPage || currentPage} to extract it to your Visual Library.
          </span>
          <div className="flex items-center gap-2">
            {cropRect && cropRect.w >= 0.02 && cropRect.h >= 0.02 && (
              <button
                type="button"
                onClick={() => handleExportCropRegion()}
                className="px-3 py-1.5 rounded-md bg-white text-emerald-700 font-semibold"
              >
                Extract Selection
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                handleExportCropRegion({ x: 0, y: 0, w: 1, h: 1 }, currentPage)
              }
              className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
            >
              Full Page {currentPage}
            </button>
            <button
              type="button"
              onClick={() => {
                setCropMode(false);
                setActiveCropPage(null);
                setCropRect(null);
              }}
              className="px-2.5 py-1.5 rounded-md bg-emerald-700/70 hover:bg-emerald-800 text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Split Reader Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* PDF Page Canvas Viewport Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden">
          <div
            ref={stageContainerRef}
            onScroll={handleStageScroll}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerUp}
            onTouchStart={handleStageTouchStart}
            onTouchMove={handleStageTouchMove}
            onTouchEnd={handleStageTouchEnd}
            className={`flex-1 overflow-auto p-2 sm:p-6 relative transition-colors ${
              darkPaper ? 'bg-slate-950' : 'bg-slate-200/80 dark:bg-slate-950'
            } ${
              effectivePanMode
                ? `${isDraggingPan ? 'cursor-grabbing' : 'cursor-grab'} select-none touch-none`
                : ''
            }`}
          >
            {/* Active Search Highlight Banner with Prev/Next Match Stepper */}
            {activeHighlight.trim().length >= 2 && !loadingDoc && !docError && (
              <div className="sticky top-1 left-0 right-0 z-20 mb-2.5 flex justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-500/40 shadow-sm text-xs text-amber-900 dark:text-amber-200 max-w-full">
                  <span className="truncate max-w-[160px] sm:max-w-xs">
                    Match: <strong>"{activeHighlight}"</strong>
                  </span>
                  {matchingPagesOrdered.length > 1 && (
                    <div className="flex items-center gap-0.5 pl-1 border-l border-amber-500/30">
                      <button
                        type="button"
                        onClick={() => stepSearchMatchPage(-1)}
                        className="p-1 rounded hover:bg-amber-500/20"
                        aria-label="Previous matching page"
                        title="Previous matching page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs tabular-nums px-0.5">
                        {Math.max(1, matchingPagesOrdered.indexOf(currentPage) + 1)}/
                        {matchingPagesOrdered.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => stepSearchMatchPage(1)}
                        className="p-1 rounded hover:bg-amber-500/20"
                        aria-label="Next matching page"
                        title="Next matching page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHighlight('');
                      setSearchScrollTargetPage(null);
                    }}
                    className="p-1 rounded hover:bg-amber-500/20 ml-0.5"
                    aria-label="Clear highlight"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Floating Selection Action Pill (Mobile & Desktop 1-tap Highlight / Copy) */}
            {selectedPageText && !cropMode && !effectivePanMode && (
              <div className="sticky top-11 left-0 right-0 z-20 mb-2 flex justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-lg border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCaptureSelectionForNote(selectedPageText)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold transition-colors"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>Highlight &amp; Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySelection}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-700 font-medium transition-colors"
                  >
                    {copiedSelection ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {loadingDoc ? (
              <div className="min-h-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Loading PDF document from local library...
                </p>
              </div>
            ) : docError ? (
              <div className="min-h-full flex items-center justify-center p-4">
                <div className="max-w-md bg-white dark:bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
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
              </div>
            ) : pdfDoc ? (
              <div
                className={`min-w-full w-max mx-auto flex flex-col items-center ${
                  viewMode === 'continuous'
                    ? 'gap-4 sm:gap-6 pb-14'
                    : 'min-h-full justify-center pb-10'
                }`}
              >
                {renderedPageNumbers.map((pageNum) => (
                  <PdfPageView
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    scale={effectiveScale}
                    rotation={rotation}
                    baseSize={pageSizes[pageNum] || defaultPageSize}
                    shouldRender={shouldRenderPage(pageNum)}
                    isActivePage={viewMode === 'continuous' && pageNum === currentPage}
                    darkPaper={darkPaper}
                    panMode={effectivePanMode}
                    cropMode={cropMode}
                    activeCropPage={activeCropPage}
                    cropRect={cropRect}
                    activeHighlight={activeHighlight}
                    shouldScrollToHit={searchScrollTargetPage === pageNum}
                    pageNotes={notesByPage.get(pageNum) || EMPTY_NOTES}
                    pinchPreviewRatio={pageNum === currentPage ? pinchPreviewRatio : 1}
                    registerWrapperRef={registerWrapperRef}
                    registerCanvasRef={registerCanvasRef}
                    onMeasureBaseSize={handleMeasureBaseSize}
                    onStartCrop={handleStartCrop}
                    onMoveCrop={handleMoveCrop}
                    onEndCrop={handleEndCrop}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Floating Desktop Bottom Reader HUD (Live page + quick controls) */}
          {!loadingDoc && !docError && (
            <div className="hidden sm:flex pointer-events-none absolute inset-x-0 bottom-3 justify-center z-20 px-4">
              <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white shadow-lg border border-slate-700/80 text-xs">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-md hover:bg-slate-700 disabled:opacity-35"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="tabular-nums font-medium px-1">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-md hover:bg-slate-700 disabled:opacity-35"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="h-3.5 w-px bg-slate-700" />
                <span className="tabular-nums text-slate-300">
                  {Math.round(effectiveScale * 100)}%
                </span>
                <span className="h-3.5 w-px bg-slate-700" />
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(false);
                    setInteractionMode((prev) => (prev === 'pan' ? 'select' : 'pan'));
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-colors ${
                    effectivePanMode
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Toggle Hand / Pan movement tool (H)"
                >
                  <Hand className="w-3 h-3" />
                  <span>{effectivePanMode ? 'Pan On' : 'Pan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelTab('thumbs');
                    setPanelOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                  title="Browse page thumbnails"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>Pages</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel (Bottom sheet on mobile, slide-over on tablet, docked on desktop) */}
        {panelOpen && (
          <>
            {/* Backdrop on mobile/tablet */}
            <div
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] z-20 lg:hidden"
              aria-hidden="true"
            />
            <aside
              aria-label="Book pages, search, bookmarks, and notes panel"
              className="fixed sm:absolute inset-x-0 bottom-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] max-h-[78dvh] sm:max-h-none rounded-t-2xl sm:rounded-none bg-white dark:bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 lg:static z-30 shadow-2xl lg:shadow-none"
            >
              {/* Mobile Sheet Handle */}
              <div className="sm:hidden pt-2 pb-0.5 flex justify-center shrink-0">
                <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>

              {/* Panel Tabs */}
              <div className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="grid grid-cols-6 gap-0.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex-1">
                  {[
                    { id: 'search', label: 'Search', icon: Search },
                    { id: 'thumbs', label: 'Pages', icon: LayoutGrid },
                    { id: 'toc', label: 'TOC', icon: List },
                    { id: 'bookmarks', label: `Marks`, count: bookmarks.length, icon: Bookmark },
                    { id: 'notes', label: `Notes`, count: notes.length, icon: StickyNote },
                    { id: 'info', label: 'Info', icon: Info }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = panelTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPanelTab(tab.id as SidePanelTab)}
                        className={`inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-1 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-none'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        title={tab.label}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {tab.label}
                          {typeof tab.count === 'number' && tab.count > 0 ? ` (${tab.count})` : ''}
                        </span>
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
                          This PDF appears to be a scanned document or image-only file without embedded text. Full-book search is unavailable for scanned pages, though you can read, zoom, pan, crop diagrams, and bookmark pages normally.
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
                                  setSearchScrollTargetPage(null);
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
                                  onClick={() => {
                                    setActiveHighlight('');
                                    setSearchScrollTargetPage(null);
                                  }}
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
                                    goToPage(match.pageNumber, searchQuery, true);
                                    if (window.innerWidth < 1024) {
                                      setPanelOpen(false);
                                    }
                                  }}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
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

                {panelTab === 'thumbs' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Page Thumbnails
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {totalPages} pages
                      </span>
                    </div>

                    {pdfDoc ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                          <PdfThumbnailTile
                            key={pageNum}
                            pdfDoc={pdfDoc}
                            pageNumber={pageNum}
                            isCurrent={pageNum === currentPage}
                            isBookmarked={bookmarkedPageSet.has(pageNum)}
                            hasNotes={notesByPage.has(pageNum)}
                            rotation={rotation}
                            onSelect={(selectedPage) => {
                              goToPage(selectedPage);
                              if (window.innerWidth < 1024) setPanelOpen(false);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                        Thumbnails become available as soon as the PDF finishes opening.
                      </p>
                    )}
                  </div>
                )}

                {panelTab === 'toc' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Embedded Table of Contents
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {outlineItems.length} sections
                      </span>
                    </div>

                    {outlineItems.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          No Embedded Outline Found
                        </p>
                        <p>
                          This PDF does not contain an embedded chapter outline. Use Page Thumbnails, Full-Book Search, or Bookmarks to jump directly to specific chapters and pages.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(() => {
                          const renderNodes = (nodes: PdfOutlineNode[], prefix: string, depth: number) =>
                            nodes.map((node, idx) => {
                              const nodeKey = `${prefix}_${idx}`;
                              const hasChildren = Array.isArray(node.items) && node.items.length > 0;
                              return (
                                <div key={nodeKey} className="space-y-0.5">
                                  <button
                                    type="button"
                                    disabled={!node.dest || resolvingTocKey === nodeKey}
                                    onClick={() => handleOpenOutlineNode(node, nodeKey)}
                                    style={{ paddingLeft: `${8 + Math.min(depth, 3) * 12}px` }}
                                    className="w-full py-2 pr-2.5 rounded-lg text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-60 flex items-center justify-between gap-2 transition-colors"
                                  >
                                    <span className="truncate font-medium">
                                      {node.title || 'Untitled Section'}
                                    </span>
                                    {resolvingTocKey === nodeKey && (
                                      <Loader2 className="w-3 h-3 animate-spin shrink-0 text-emerald-600" />
                                    )}
                                  </button>
                                  {hasChildren && renderNodes(node.items!, nodeKey, depth + 1)}
                                </div>
                              );
                            });
                          return renderNodes(outlineItems, 'toc', 0);
                        })()}
                      </div>
                    )}
                  </div>
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
                                onClick={() => {
                                  goToPage(bm.pageNumber);
                                  if (window.innerWidth < 1024) setPanelOpen(false);
                                }}
                                className="text-left text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                              >
                                Page {bm.pageNumber} · {bm.label}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBookmark(bm.id)}
                                className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
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
                          onClick={() => handleCaptureSelectionForNote()}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
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
                              className={`w-6 h-6 rounded-full ${HIGHLIGHT_STYLES[col].chip} border-2 transition-transform ${
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
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
                        >
                          Save Note
                        </button>
                      </div>
                    </form>

                    {notes.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        Select any text on a PDF page and tap Highlight to save passages and notes locally.
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
                                onClick={() => {
                                  goToPage(entry.pageNumber, entry.quote.slice(0, 40), true);
                                  if (window.innerWidth < 1024) setPanelOpen(false);
                                }}
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
                                className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
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
                          className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs"
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
          </>
        )}
      </div>

      {/* Persistent Mobile Thumb Dock (Hidden on sm+ where top bar has full controls) */}
      <div className="sm:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2.5 py-2 shrink-0 relative space-y-2">
        {/* Popover Tools Drawer on Mobile */}
        {mobileToolsOpen && (
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setCropMode(false);
                setInteractionMode((prev) => (prev === 'pan' ? 'select' : 'pan'));
                setMobileToolsOpen(false);
              }}
              disabled={loadingDoc}
              className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                interactionMode === 'pan'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Hand className="w-4 h-4" />
              <span>{interactionMode === 'pan' ? 'Pan Tool: On' : 'Free Pan Tool'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleToggleViewMode();
                setMobileToolsOpen(false);
              }}
              disabled={loadingDoc}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              {viewMode === 'continuous' ? (
                <ScrollText className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{viewMode === 'continuous' ? 'Continuous Scroll' : 'Single Page'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPanelTab('thumbs');
                setPanelOpen(true);
                setMobileToolsOpen(false);
              }}
              disabled={loadingDoc}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Page Thumbnails</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCropMode((prev) => !prev);
                setActiveCropPage(null);
                setCropRect(null);
                setMobileToolsOpen(false);
              }}
              disabled={loadingDoc}
              className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                cropMode
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Crop className="w-4 h-4" />
              <span>{cropMode ? 'Cancel Crop' : 'Capture Diagram'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCaptureSelectionForNote()}
              disabled={loadingDoc}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Highlighter className="w-4 h-4" />
              <span>Notes &amp; Highlights</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleRotatePage();
                setMobileToolsOpen(false);
              }}
              disabled={loadingDoc}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate 90° ({rotation}°)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDarkPaper((prev) => !prev);
                setMobileToolsOpen(false);
              }}
              className={`col-span-2 h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                darkPaper
                  ? 'bg-slate-800 border-slate-700 text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              {darkPaper ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{darkPaper ? 'Light Paper' : 'Night Paper Contrast'}</span>
            </button>
          </div>
        )}

        {/* Quick Page Scrubber when > 2 pages */}
        {totalPages > 2 && !loadingDoc && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(Number(e.target.value))}
              aria-label="Scrub through book pages"
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none accent-emerald-600 cursor-pointer"
            />
          </div>
        )}

        {/* Primary Thumb Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Page Nav */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || loadingDoc}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputSubmit}
                aria-label="Current page number"
                className="w-11 h-10 text-center text-xs font-semibold tabular-nums rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                /{totalPages}
              </span>
            </form>

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || loadingDoc}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Zoom & Fit */}
          <div className="flex items-center gap-0.5 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={loadingDoc}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCycleFitMode}
              disabled={loadingDoc}
              className={`h-9 px-2 rounded-lg text-xs font-semibold tabular-nums whitespace-nowrap ${
                fitMode !== 'manual'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
              title="Toggle Fit Width / Fit Page"
            >
              {fitMode === 'width'
                ? 'Fit W'
                : fitMode === 'page'
                  ? 'Fit P'
                  : `${Math.round(effectiveScale * 100)}%`}
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={loadingDoc}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Tools Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileToolsOpen((prev) => !prev)}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
              mobileToolsOpen || cropMode || interactionMode === 'pan'
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            aria-label="Reader tools menu"
            aria-expanded={mobileToolsOpen}
          >
            {mobileToolsOpen ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Save Cropped Textbook Diagram Modal */}
      {cropModalOpen && capturedPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => !savingCrop && setCropModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Save extracted textbook diagram"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 max-h-[90dvh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Import Textbook Diagram to Visual Library
              </h3>
              <button
                type="button"
                onClick={() => !savingCrop && setCropModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
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
                        className={`px-2 py-1 rounded-md border text-xs font-medium ${
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
