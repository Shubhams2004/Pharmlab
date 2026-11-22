import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { classifyPdfError, pdfjsLib } from './pdfWorker';
import { BookHighlightNote, HighlightColor } from './types';

export interface CropRectNormalized {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageSize {
  width: number;
  height: number;
}

export const HIGHLIGHT_STYLES: Record<
  HighlightColor,
  { bg: string; chip: string; label: string }
> = {
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

export function applyTextLayerHighlights(
  container: HTMLElement,
  query: string,
  pageNotes: BookHighlightNote[],
  scrollToFirstHit: boolean
): void {
  const spans = Array.from(container.querySelectorAll('span'));
  let firstMark: HTMLElement | null = null;

  for (const note of pageNotes) {
    const quote = note.quote.trim();
    if (quote.length < 3) continue;
    const snippet = quote.slice(0, 64).replace(/\s+/g, ' ');
    const tokens = snippet
      .split(/\s+/g)
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

  if (scrollToFirstHit && firstMark) {
    firstMark.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }
}

interface PdfPageViewProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: 0 | 90 | 180 | 270;
  baseSize: PageSize;
  shouldRender: boolean;
  isActivePage: boolean;
  darkPaper: boolean;
  panMode: boolean;
  cropMode: boolean;
  activeCropPage: number | null;
  cropRect: CropRectNormalized | null;
  activeHighlight: string;
  shouldScrollToHit: boolean;
  pageNotes: BookHighlightNote[];
  registerWrapperRef: (pageNumber: number, el: HTMLDivElement | null) => void;
  registerCanvasRef: (pageNumber: number, el: HTMLCanvasElement | null) => void;
  onMeasureBaseSize: (pageNumber: number, unrotatedSize: PageSize) => void;
  onStartCrop: (pageNumber: number, pos: { x: number; y: number }) => void;
  onMoveCrop: (pos: { x: number; y: number }) => void;
  onEndCrop: () => void;
}

export const PdfPageView = React.memo(function PdfPageView({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  baseSize,
  shouldRender,
  isActivePage,
  darkPaper,
  panMode,
  cropMode,
  activeCropPage,
  cropRect,
  activeHighlight,
  shouldScrollToHit,
  pageNotes,
  registerWrapperRef,
  registerCanvasRef,
  onMeasureBaseSize,
  onStartCrop,
  onMoveCrop,
  onEndCrop
}: PdfPageViewProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const cropDragActiveRef = useRef(false);
  const hasBitmapRef = useRef(false);

  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [hasBitmap, setHasBitmap] = useState(false);

  const isSwapped = rotation === 90 || rotation === 270;
  const displayWidth = Math.max(
    180,
    Math.floor((isSwapped ? baseSize.height : baseSize.width) * scale)
  );
  const displayHeight = Math.max(
    220,
    Math.floor((isSwapped ? baseSize.width : baseSize.height) * scale)
  );

  // Sync canvas ref for external crop extraction
  useEffect(() => {
    registerCanvasRef(pageNumber, canvasRef.current);
    return () => registerCanvasRef(pageNumber, null);
  }, [pageNumber, registerCanvasRef, shouldRender]);

  // Reset rendered bitmap ONLY when page is explicitly evicted from retention cache
  useEffect(() => {
    if (!shouldRender) {
      hasBitmapRef.current = false;
      setHasBitmap(false);
      setRendering(false);
      setRenderError(null);
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
      }
    }
  }, [shouldRender]);

  // Double-buffered HiDPI canvas + selectable TextLayer render:
  // Renders offscreen and atomically swaps into the visible canvas so zooming/moving never blanks out existing pages.
  useEffect(() => {
    if (!shouldRender || !pdfDoc) return;

    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;
    let textLayerInstance: pdfjsLib.TextLayer | null = null;
    let activePageProxy: pdfjsLib.PDFPageProxy | null = null;

    // Slight debounce ONLY when re-rendering an already visible page during rapid wheel/button zoom
    const debounceMs = hasBitmapRef.current ? 45 : 0;

    const timerId = window.setTimeout(async () => {
      if (cancelled) return;

      const visibleCanvas = canvasRef.current;
      const textLayerDiv = textLayerRef.current;
      if (!visibleCanvas || !textLayerDiv) return;

      setRendering(true);
      setRenderError(null);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        activePageProxy = page;
        if (cancelled) return;

        // Report natural unrotated page dimensions so mixed-size PDFs size accurately
        const unrotated = page.getViewport({ scale: 1, rotation: 0 });
        if (
          Math.abs(unrotated.width - baseSize.width) > 2 ||
          Math.abs(unrotated.height - baseSize.height) > 2
        ) {
          onMeasureBaseSize(pageNumber, {
            width: unrotated.width,
            height: unrotated.height
          });
        }

        const viewport = page.getViewport({ scale, rotation });
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const outputScale = Math.min(dpr, scale > 2 ? 1.5 : 2.25);

        const targetW = Math.max(1, Math.floor(viewport.width * outputScale));
        const targetH = Math.max(1, Math.floor(viewport.height * outputScale));

        // Render onto an offscreen canvas first so visible page stays intact during zoom
        const offscreen = document.createElement('canvas');
        offscreen.width = targetW;
        offscreen.height = targetH;
        const offCtx = offscreen.getContext('2d');
        if (!offCtx) {
          throw new Error('Unable to acquire 2D canvas context to render PDF page.');
        }

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        renderTask = page.render({
          canvasContext: offCtx,
          viewport,
          transform,
          canvas: offscreen
        });

        await renderTask.promise;
        if (cancelled) return;

        // Atomically swap completed crisp bitmap into the visible canvas
        visibleCanvas.width = targetW;
        visibleCanvas.height = targetH;
        const visibleCtx = visibleCanvas.getContext('2d');
        if (visibleCtx) {
          visibleCtx.drawImage(offscreen, 0, 0);
        }
        hasBitmapRef.current = true;
        setHasBitmap(true);

        // Update TextLayer alignment to match exact viewport
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

        applyTextLayerHighlights(textLayerDiv, activeHighlight, pageNotes, shouldScrollToHit);
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
            // ignore
          }
        }
        if (!cancelled) {
          setRendering(false);
        }
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
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
  }, [
    shouldRender,
    pdfDoc,
    pageNumber,
    scale,
    rotation,
    activeHighlight,
    pageNotes,
    shouldScrollToHit,
    baseSize.width,
    baseSize.height,
    onMeasureBaseSize
  ]);

  const getNormalizedPointerPos = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
  };

  const showCropBoxOnThisPage =
    cropMode && activeCropPage === pageNumber && cropRect && cropRect.w > 0.01 && cropRect.h > 0.01;

  return (
    <div
      ref={(el) => registerWrapperRef(pageNumber, el)}
      data-page-number={pageNumber}
      className="relative flex flex-col items-center shrink-0"
    >
      <div
        ref={frameRef}
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          ...(darkPaper && !cropMode
            ? { filter: 'invert(0.89) hue-rotate(180deg) contrast(0.95)' }
            : undefined)
        }}
        className={`relative bg-white shadow-[0_6px_28px_-6px_rgba(15,23,42,0.22)] dark:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.65)] border transition-shadow origin-top ${
          isActivePage
            ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
            : 'border-slate-300/90 dark:border-slate-700/80'
        } ${
          cropMode
            ? 'cursor-crosshair select-none touch-none'
            : panMode
              ? 'select-none'
              : 'select-text'
        }`}
        onPointerDown={(e) => {
          if (!cropMode) return;
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          cropDragActiveRef.current = true;
          onStartCrop(pageNumber, getNormalizedPointerPos(e));
        }}
        onPointerMove={(e) => {
          if (!cropMode || !cropDragActiveRef.current) return;
          e.preventDefault();
          e.stopPropagation();
          onMoveCrop(getNormalizedPointerPos(e));
        }}
        onPointerUp={(e) => {
          if (!cropMode) return;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          if (cropDragActiveRef.current) {
            cropDragActiveRef.current = false;
            onEndCrop();
          }
        }}
        onPointerCancel={() => {
          if (!cropMode) return;
          cropDragActiveRef.current = false;
          onEndCrop();
        }}
      >
        {shouldRender ? (
          <>
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div
              ref={textLayerRef}
              className={`pdf-text-layer ${cropMode || panMode ? 'pointer-events-none' : ''}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50/90 text-slate-400">
            <span className="text-xs font-medium tabular-nums px-2.5 py-1 rounded-md border border-slate-200 bg-white/80">
              Page {pageNumber}
            </span>
          </div>
        )}

        {cropMode && (
          <div className="absolute inset-0 bg-slate-950/15 pointer-events-none z-20">
            {showCropBoxOnThisPage && cropRect && (
              <div
                className="absolute border-2 border-emerald-500 bg-emerald-400/20 shadow-sm"
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

        {shouldRender && rendering && !hasBitmap && !renderError && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium tabular-nums">Rendering page {pageNumber}</span>
            </div>
          </div>
        )}

        {renderError && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center gap-2 z-20">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
            <p className="text-sm font-semibold text-slate-900">
              Page {pageNumber} failed to render
            </p>
            <p className="text-xs text-slate-600 max-w-xs">{renderError}</p>
          </div>
        )}
      </div>
    </div>
  );
});

interface PdfThumbnailTileProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  isCurrent: boolean;
  isBookmarked: boolean;
  hasNotes: boolean;
  rotation: 0 | 90 | 180 | 270;
  onSelect: (pageNumber: number) => void;
}

export const PdfThumbnailTile = React.memo(function PdfThumbnailTile({
  pdfDoc,
  pageNumber,
  isCurrent,
  isBookmarked,
  hasNotes,
  rotation,
  onSelect
}: PdfThumbnailTileProps) {
  const tileRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = tileRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !pdfDoc) return;
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;
    let activePage: pdfjsLib.PDFPageProxy | null = null;

    async function renderThumb() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        activePage = page;
        if (cancelled) return;

        const base = page.getViewport({ scale: 1, rotation });
        const targetWidth = 136;
        const scale = targetWidth / base.width;
        const viewport = page.getViewport({ scale, rotation });

        const offscreen = document.createElement('canvas');
        offscreen.width = Math.max(40, Math.floor(viewport.width));
        offscreen.height = Math.max(52, Math.floor(viewport.height));

        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          canvas: offscreen
        });
        await renderTask.promise;
        if (cancelled) return;

        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        const visibleCtx = canvas.getContext('2d');
        if (visibleCtx) {
          visibleCtx.drawImage(offscreen, 0, 0);
        }
        setLoaded(true);
      } catch {
        // ignore thumbnail cancellation errors
      } finally {
        if (activePage) {
          try {
            activePage.cleanup();
          } catch {
            // ignore
          }
        }
      }
    }

    renderThumb();

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [visible, pdfDoc, pageNumber, rotation]);

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={() => onSelect(pageNumber)}
      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
        isCurrent
          ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/40'
          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full object-contain transition-opacity ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!loaded && (
          <span className="absolute text-xs font-medium text-slate-400 tabular-nums">
            {pageNumber}
          </span>
        )}
        {(isBookmarked || hasNotes) && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
            {isBookmarked && (
              <span
                className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"
                title="Bookmarked"
              />
            )}
            {hasNotes && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                title="Has notes"
              />
            )}
          </div>
        )}
      </div>
      <span
        className={`text-xs tabular-nums font-medium ${
          isCurrent
            ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
            : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        Page {pageNumber}
      </span>
    </button>
  );
});
