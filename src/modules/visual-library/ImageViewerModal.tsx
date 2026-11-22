import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Contrast,
  ImageOff,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  RotateCcw,
  Tag,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import AcademicInfoPanel from './AcademicInfoPanel';
import { resolveAcademicContextForVisual } from './academicRegistry';
import { ACADEMIC_DOMAIN_LABELS, InteractiveAnnotation } from './academicTypes';
import VisualThumbnail from './VisualThumbnail';
import { CATEGORY_LABELS, VisualMediaItem } from './types';
import { resolveVisualImageSrc, updateVisualMetadata } from './visualDb';

interface ImageViewerModalProps {
  item: VisualMediaItem | null;
  allVisuals: VisualMediaItem[];
  initialAnnotationId?: string | null;
  onClose: () => void;
  onSelectVisual: (item: VisualMediaItem) => void;
  onUpdated?: (updated: VisualMediaItem) => void;
  onDelete?: (id: string) => Promise<void> | void;
}

type StageBackdrop = 'auto' | 'dark' | 'light';

function getTouchDistance(t1: React.Touch | Touch, t2: React.Touch | Touch): number {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

function clampZoom(z: number): number {
  return Math.max(0.5, Math.min(5, Number(z.toFixed(2))));
}

function clampPan(
  nextPan: { x: number; y: number },
  zoom: number,
  stageEl: HTMLElement | null
): { x: number; y: number } {
  if (zoom <= 1.02) return { x: 0, y: 0 };
  const w = stageEl?.clientWidth || 600;
  const h = stageEl?.clientHeight || 500;
  const maxX = Math.max(140, (w * (zoom - 1)) / 2 + 140);
  const maxY = Math.max(140, (h * (zoom - 1)) / 2 + 140);
  return {
    x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
    y: Math.max(-maxY, Math.min(maxY, nextPan.y))
  };
}

export default function ImageViewerModal({
  item,
  allVisuals,
  initialAnnotationId,
  onClose,
  onSelectVisual,
  onUpdated,
  onDelete
}: ImageViewerModalProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);
  const [stageDims, setStageDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [backdrop, setBackdrop] = useState<StageBackdrop>('auto');

  const [infoOpen, setInfoOpen] = useState<boolean>(true);
  const [mobilePanelExpanded, setMobilePanelExpanded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(
    initialAnnotationId || null
  );
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [pinPlacementMode, setPinPlacementMode] = useState<boolean>(false);
  const [draftPinCoords, setDraftPinCoords] = useState<{ xPercent: number; yPercent: number } | null>(
    null
  );
  const [draftLabel, setDraftLabel] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftDefinition, setDraftDefinition] = useState('');
  const [draftFunction, setDraftFunction] = useState('');
  const [draftImportance, setDraftImportance] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const viewerRootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const touchPinchRef = useRef<{
    active: boolean;
    startDist: number;
    startZoom: number;
  }>({ active: false, startDist: 0, startZoom: 1 });

  const touchPanSwipeRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    startTime: number;
    moved: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
    startTime: 0,
    moved: false
  });

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0
  });

  const academicContext = useMemo(
    () => (item ? resolveAcademicContextForVisual(item) : null),
    [item]
  );

  // Measure stage dimensions so the image + annotation overlay share exact fitted pixel bounds
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !item) return;

    const measure = () => {
      const style = window.getComputedStyle(el);
      const padX = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0');
      const padY = parseFloat(style.paddingTop || '0') + parseFloat(style.paddingBottom || '0');
      setStageDims({
        w: Math.max(0, el.clientWidth - padX),
        h: Math.max(0, el.clientHeight - padY)
      });
    };

    measure();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    }
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [item, infoOpen, mobilePanelExpanded, isFullscreen]);

  useEffect(() => {
    if (!item) return;

    let cancelled = false;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLoadError(false);
    setImgLoaded(false);
    setNaturalDims(item.width && item.height ? { w: item.width, h: item.height } : null);
    setPinPlacementMode(false);
    setDraftPinCoords(null);
    setSelectedAnnotationId(initialAnnotationId || null);

    if (item.assetUrl) {
      setImgSrc(item.assetUrl);
      setLoading(false);
    } else {
      setLoading(true);
      resolveVisualImageSrc(item)
        .then((url) => {
          if (!cancelled) {
            setImgSrc(url);
            setLoading(false);
            if (!url) setLoadError(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoading(false);
            setLoadError(true);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.assetUrl, retryNonce, initialAnnotationId]);

  useEffect(() => {
    if (academicContext && academicContext.annotations.length > 0) {
      setShowLabels(true);
    }
  }, [item?.id, academicContext?.annotations.length]);

  const currentIndex = useMemo(() => {
    if (!item || allVisuals.length === 0) return -1;
    return allVisuals.findIndex((v) => v.id === item.id);
  }, [item, allVisuals]);

  const hasSiblings = allVisuals.length > 1 && currentIndex !== -1;

  const stepSibling = useCallback(
    (dir: -1 | 1) => {
      if (!hasSiblings) return;
      const nextIdx = (currentIndex + dir + allVisuals.length) % allVisuals.length;
      onSelectVisual(allVisuals[nextIdx]);
    },
    [hasSiblings, currentIndex, allVisuals, onSelectVisual]
  );

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';

      if (e.key === 'Escape') {
        if (draftPinCoords) {
          setDraftPinCoords(null);
        } else if (pinPlacementMode) {
          setPinPlacementMode(false);
        } else if (isFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
        return;
      }

      if (typing) return;

      if (e.key === 'ArrowLeft' && hasSiblings) {
        e.preventDefault();
        stepSibling(-1);
      } else if (e.key === 'ArrowRight' && hasSiblings) {
        e.preventDefault();
        stepSibling(1);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => clampZoom(z + 0.35));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => {
          const next = clampZoom(z - 0.35);
          if (next <= 1.02) setPan({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, isFullscreen, onClose, hasSiblings, stepSibling, draftPinCoords, pinPlacementMode]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !item) return;

    const onWheel = (e: WheelEvent) => {
      if (loading || loadError) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.22 : -0.22;
      setZoom((prevZoom) => {
        const nextZoom = clampZoom(prevZoom + delta);
        setPan((prevPan) => clampPan(prevPan, nextZoom, stage));
        return nextZoom;
      });
    };

    const onTouchMoveNative = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('touchmove', onTouchMoveNative);
    };
  }, [item, loading, loadError]);

  const relatedVisuals = useMemo(() => {
    if (!item) return [];
    const relatedIds = new Set(academicContext?.relatedSubjectIds || []);
    return allVisuals
      .filter((candidate) => {
        if (candidate.id === item.id) return false;
        if (candidate.subjectId && relatedIds.has(candidate.subjectId)) return true;
        return (
          candidate.category === item.category ||
          candidate.departments.some((d) => item.departments.includes(d))
        );
      })
      .slice(0, 6);
  }, [item, allVisuals, academicContext?.relatedSubjectIds]);

  const selectedAnnotation: InteractiveAnnotation | null = useMemo(() => {
    if (!academicContext || !selectedAnnotationId) return null;
    return academicContext.annotations.find((a) => a.id === selectedAnnotationId) || null;
  }, [academicContext, selectedAnnotationId]);

  const fittedBox = useMemo(() => {
    if (!naturalDims || naturalDims.w <= 0 || naturalDims.h <= 0 || stageDims.w <= 0 || stageDims.h <= 0) {
      return null;
    }
    const scale = Math.min(stageDims.w / naturalDims.w, stageDims.h / naturalDims.h);
    return {
      width: Math.max(80, Math.floor(naturalDims.w * scale)),
      height: Math.max(80, Math.floor(naturalDims.h * scale))
    };
  }, [naturalDims, stageDims]);

  if (!item || !academicContext) return null;

  const toggleZoomAtPoint = (clientX: number, clientY: number) => {
    if (pinPlacementMode) return;
    if (zoom > 1.15) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      setZoom(2.2);
      return;
    }
    const rect = stage.getBoundingClientRect();
    const offsetX = clientX - (rect.left + rect.width / 2);
    const offsetY = clientY - (rect.top + rect.height / 2);
    const targetZoom = 2.2;
    setZoom(targetZoom);
    setPan(
      clampPan(
        { x: -offsetX * 0.9, y: -offsetY * 0.9 },
        targetZoom,
        stage
      )
    );
  };

  const handleStageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (loading || loadError) return;

    if (e.touches.length === 2) {
      touchPanSwipeRef.current.active = false;
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (dist > 10) {
        touchPinchRef.current = {
          active: true,
          startDist: dist,
          startZoom: zoom
        };
      }
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchPanSwipeRef.current = {
        active: true,
        startX: t.clientX,
        startY: t.clientY,
        panX: pan.x,
        panY: pan.y,
        startTime: Date.now(),
        moved: false
      };
    }
  };

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (loading || loadError) return;

    if (e.touches.length === 2 && touchPinchRef.current.active) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (touchPinchRef.current.startDist > 0) {
        const nextZoom = clampZoom(
          touchPinchRef.current.startZoom * (dist / touchPinchRef.current.startDist)
        );
        setZoom(nextZoom);
        setPan((prevPan) => clampPan(prevPan, nextZoom, stageRef.current));
      }
      return;
    }

    if (e.touches.length === 1 && touchPanSwipeRef.current.active) {
      const t = e.touches[0];
      const dx = t.clientX - touchPanSwipeRef.current.startX;
      const dy = t.clientY - touchPanSwipeRef.current.startY;
      if (Math.hypot(dx, dy) > 6) {
        touchPanSwipeRef.current.moved = true;
      }
      if (zoom > 1.02) {
        setPan(
          clampPan(
            {
              x: touchPanSwipeRef.current.panX + dx,
              y: touchPanSwipeRef.current.panY + dy
            },
            zoom,
            stageRef.current
          )
        );
      }
    }
  };

  const handleStageTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchPinchRef.current.active && e.touches.length < 2) {
      touchPinchRef.current.active = false;
      if (zoom <= 1.02) setPan({ x: 0, y: 0 });
      return;
    }

    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchPanSwipeRef.current.startX;
      const dy = t.clientY - touchPanSwipeRef.current.startY;
      const dt = Date.now() - touchPanSwipeRef.current.startTime;

      if (
        touchPanSwipeRef.current.active &&
        zoom <= 1.05 &&
        hasSiblings &&
        dt < 450 &&
        Math.abs(dx) > 64 &&
        Math.abs(dx) > Math.abs(dy) * 1.8 &&
        !pinPlacementMode
      ) {
        touchPanSwipeRef.current.active = false;
        stepSibling(dx < 0 ? 1 : -1);
        return;
      }

      if (!touchPanSwipeRef.current.moved && !pinPlacementMode) {
        const now = Date.now();
        const dtTap = now - lastTapRef.current.time;
        const distTap = Math.hypot(
          t.clientX - lastTapRef.current.x,
          t.clientY - lastTapRef.current.y
        );
        if (dtTap > 40 && dtTap < 290 && distTap < 30) {
          lastTapRef.current = { time: 0, x: 0, y: 0 };
          toggleZoomAtPoint(t.clientX, t.clientY);
        } else {
          lastTapRef.current = { time: now, x: t.clientX, y: t.clientY };
        }
      }
      touchPanSwipeRef.current.active = false;
    }
  };

  const handleToggleFullscreen = async () => {
    const el = viewerRootRef.current;
    if (!el) return;
    if (!isFullscreen) {
      if (el.requestFullscreen) {
        try {
          await el.requestFullscreen();
          setIsFullscreen(true);
          return;
        } catch {
          // fallback inside iframe
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

  const handleCycleBackdrop = () => {
    setBackdrop((prev) => {
      if (prev === 'auto') return 'dark';
      if (prev === 'dark') return 'light';
      return 'auto';
    });
  };

  const handleImageClickForPin = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!pinPlacementMode || !imgRef.current) return;
    e.stopPropagation();
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPercent = Math.max(2, Math.min(98, Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))));
    const yPercent = Math.max(2, Math.min(98, Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1))));
    setDraftPinCoords({ xPercent, yPercent });
    setDraftLabel('');
    setDraftLocation('');
    setDraftDefinition('');
    setDraftFunction('');
    setDraftImportance('');
  };

  const handleSaveCustomPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftPinCoords || !draftLabel.trim()) return;
    setSavingPin(true);
    try {
      const existingUserPins = item.annotations || [];
      const newPin: InteractiveAnnotation = {
        id: `user_pin_${Date.now()}`,
        label: draftLabel.trim(),
        shortCode: String(academicContext.annotations.length + 1),
        xPercent: draftPinCoords.xPercent,
        yPercent: draftPinCoords.yPercent,
        definition: draftDefinition.trim() || `${draftLabel.trim()} (user-annotated structure).`,
        location: draftLocation.trim() || undefined,
        functionRole: draftFunction.trim() || 'User-recorded structure observation.',
        physiologicalOrClinicalImportance: draftImportance.trim() || undefined,
        isUserAdded: true
      };
      const updated = await updateVisualMetadata(item.id, {
        annotations: [...existingUserPins, newPin]
      });
      if (updated) {
        onUpdated?.(updated);
        onSelectVisual(updated);
        setSelectedAnnotationId(newPin.id);
      }
      setDraftPinCoords(null);
      setPinPlacementMode(false);
      setShowLabels(true);
    } finally {
      setSavingPin(false);
    }
  };

  const handleDeleteUserAnnotation = async (annotationId: string) => {
    const remaining = (item.annotations || []).filter((a) => a.id !== annotationId);
    const updated = await updateVisualMetadata(item.id, { annotations: remaining });
    if (updated) {
      onUpdated?.(updated);
      onSelectVisual(updated);
      if (selectedAnnotationId === annotationId) {
        setSelectedAnnotationId(null);
      }
    }
  };

  const handleSelectAnnotation = (ann: InteractiveAnnotation | null) => {
    setSelectedAnnotationId(ann ? ann.id : null);
    if (ann) setShowLabels(true);
  };

  const displayWidth = item.width || naturalDims?.w;
  const displayHeight = item.height || naturalDims?.h;
  const hasAnnotations = academicContext.annotations.length > 0;

  const stageBgClass =
    backdrop === 'dark'
      ? 'bg-slate-950'
      : backdrop === 'light'
        ? 'bg-white'
        : 'bg-slate-100 dark:bg-slate-950';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-0 sm:p-3 lg:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Academic visual viewer: ${item.title}`}
    >
      <div
        ref={viewerRootRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-white dark:bg-slate-900 border-0 sm:border sm:border-slate-200 sm:dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl ${
          isFullscreen
            ? 'h-[100dvh] max-w-none rounded-none'
            : 'max-w-[1440px] h-[100dvh] sm:h-[94dvh] rounded-none sm:rounded-2xl'
        }`}
      >
        {/* Top Viewer Bar */}
        <header className="px-3 sm:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0 bg-white dark:bg-slate-900">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                {ACADEMIC_DOMAIN_LABELS[academicContext.domain]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{CATEGORY_LABELS[item.category]}</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="hidden sm:inline truncate">{item.sourceName}</span>
              {hasSiblings && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums shrink-0 font-medium">
                    {currentIndex + 1}/{allVisuals.length}
                  </span>
                </>
              )}
              {displayWidth && displayHeight && (
                <span className="hidden md:inline tabular-nums shrink-0">
                  · {displayWidth} × {displayHeight} px
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {item.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Desktop Zoom Controls */}
            <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const next = clampZoom(zoom - 0.3);
                  setZoom(next);
                  setPan((p) => clampPan(p, next, stageRef.current));
                }}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                aria-label="Zoom out"
                title="Zoom out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200 min-w-[44px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z + 0.3))}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                aria-label="Zoom in"
                title="Zoom in (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                aria-label="Reset zoom"
                title="Reset 100% (0)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {hasAnnotations && (
              <button
                type="button"
                onClick={() => setShowLabels((s) => !s)}
                className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 ${
                  showLabels
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="Show or hide interactive anatomical/apparatus labels"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Labels ({academicContext.annotations.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 ${
                infoOpen
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              aria-label="Toggle academic information panel"
              aria-expanded={infoOpen}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">Academic Guide</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shrink-0"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shrink-0"
              aria-label="Close image viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Academic Split Viewport */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
          {/* Left/Top: Interactive Image Stage */}
          <div
            className={`relative overflow-hidden transition-colors flex flex-col ${stageBgClass} ${
              infoOpen
                ? mobilePanelExpanded
                  ? 'h-[26dvh] lg:h-auto lg:flex-1 shrink-0'
                  : 'h-[43dvh] sm:h-[46dvh] lg:h-auto lg:flex-1 shrink-0'
                : 'flex-1'
            }`}
          >
            {/* Pin Placement Mode Banner */}
            {pinPlacementMode && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 max-w-[92%]">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Click anywhere on the image to place a study pin
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPinPlacementMode(false);
                    setDraftPinCoords(null);
                  }}
                  className="ml-1 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* High-Resolution Interactive Canvas */}
            <div
              ref={stageRef}
              className={`w-full h-full flex items-center justify-center overflow-hidden relative select-none touch-none p-3 sm:p-5 ${
                pinPlacementMode
                  ? 'cursor-crosshair'
                  : zoom > 1.02
                    ? dragging
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                    : 'cursor-zoom-in'
              }`}
              onDoubleClick={(e) => {
                if (loading || loadError || pinPlacementMode) return;
                toggleZoomAtPoint(e.clientX, e.clientY);
              }}
              onMouseDown={(e) => {
                if (zoom <= 1.02 || pinPlacementMode) return;
                setDragging(true);
                dragStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  panX: pan.x,
                  panY: pan.y
                };
              }}
              onMouseMove={(e) => {
                if (!dragging || !dragStartRef.current) return;
                setPan(
                  clampPan(
                    {
                      x: dragStartRef.current.panX + (e.clientX - dragStartRef.current.x),
                      y: dragStartRef.current.panY + (e.clientY - dragStartRef.current.y)
                    },
                    zoom,
                    stageRef.current
                  )
                );
              }}
              onMouseUp={() => {
                setDragging(false);
                dragStartRef.current = null;
              }}
              onMouseLeave={() => {
                setDragging(false);
                dragStartRef.current = null;
              }}
              onTouchStart={handleStageTouchStart}
              onTouchMove={handleStageTouchMove}
              onTouchEnd={handleStageTouchEnd}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Loading high-resolution visual...
                  </span>
                </div>
              ) : loadError || !imgSrc ? (
                <div className="text-center space-y-3 p-6 max-w-sm">
                  <ImageOff className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Image could not be loaded
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify your network connection if this record links to an external repository.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRetryNonce((n) => n + 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Load</span>
                  </button>
                </div>
              ) : (
                <div
                  className={`relative shrink-0 flex items-center justify-center ${
                    dragging || touchPinchRef.current.active ? '' : 'transition-transform duration-150'
                  }`}
                  style={{
                    width: fittedBox ? `${fittedBox.width}px` : undefined,
                    height: fittedBox ? `${fittedBox.height}px` : undefined,
                    maxWidth: fittedBox ? undefined : '100%',
                    maxHeight: fittedBox ? undefined : '100%',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                  }}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onClick={handleImageClickForPin}
                    onLoad={(e) => {
                      setImgLoaded(true);
                      const imgEl = e.currentTarget;
                      if (imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
                        setNaturalDims({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });
                      }
                    }}
                    onError={() => setLoadError(true)}
                    className={`w-full h-full object-contain block transition-opacity duration-150 ${
                      imgLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Interactive Structure Pins & Region Highlight Overlay (exact same box as image) */}
                  {imgLoaded && showLabels && academicContext.annotations.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {selectedAnnotation?.regionBox && (
                        <div
                          className="absolute rounded-lg border-2 border-emerald-400 bg-emerald-400/15 shadow-[0_0_0_2px_rgba(15,23,42,0.35)] transition-all"
                          style={{
                            left: `${selectedAnnotation.regionBox.x}%`,
                            top: `${selectedAnnotation.regionBox.y}%`,
                            width: `${selectedAnnotation.regionBox.width}%`,
                            height: `${selectedAnnotation.regionBox.height}%`
                          }}
                        />
                      )}

                      {academicContext.annotations.map((ann, idx) => {
                        const isSelected = selectedAnnotationId === ann.id;
                        const badgeText = ann.shortCode || String(idx + 1);
                        return (
                          <button
                            key={ann.id}
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (pinPlacementMode) return;
                              handleSelectAnnotation(isSelected ? null : ann);
                            }}
                            style={{
                              left: `${ann.xPercent}%`,
                              top: `${ann.yPercent}%`,
                              transform: `translate(-50%, -50%) scale(${Math.max(0.65, 1 / Math.sqrt(Math.max(1, zoom)))})`
                            }}
                            className={`pointer-events-auto absolute group flex items-center justify-center rounded-full border-2 font-bold tabular-nums shadow-md transition-all focus:outline-none ${
                              isSelected
                                ? 'w-7 h-7 text-xs bg-emerald-500 border-white text-white ring-4 ring-emerald-400/40 z-20'
                                : ann.isUserAdded
                                  ? 'w-6 h-6 text-xs bg-amber-500 border-white text-white hover:scale-110 z-10'
                                  : 'w-6 h-6 text-xs bg-slate-900/90 border-emerald-400 text-white hover:bg-emerald-600 hover:border-white hover:scale-110 z-10'
                            }`}
                            title={ann.label}
                            aria-label={`Inspect structure ${badgeText}: ${ann.label}`}
                          >
                            {badgeText}
                            <span
                              className={`hidden sm:block pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap bg-slate-900/95 text-white border border-slate-700 shadow-lg transition-opacity ${
                                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              {ann.label}
                            </span>
                          </button>
                        );
                      })}

                      {draftPinCoords && (
                        <div
                          style={{
                            left: `${draftPinCoords.xPercent}%`,
                            top: `${draftPinCoords.yPercent}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          className="absolute w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg ring-4 ring-amber-400/40 z-30"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Structure Floating Callout Card */}
            {selectedAnnotation && !draftPinCoords && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute top-3 left-3 z-20 max-w-sm w-[calc(100%-24px)] sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/45 rounded-xl p-3 shadow-xl space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                      {selectedAnnotation.isUserAdded ? 'Custom Study Pin' : 'Interactive Structure'}
                      {selectedAnnotation.shortCode ? ` · #${selectedAnnotation.shortCode}` : ''}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedAnnotation.label}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAnnotationId(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white shrink-0"
                    aria-label="Clear selected structure"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedAnnotation.location && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">Location:</strong>{' '}
                    {selectedAnnotation.location}
                  </p>
                )}
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedAnnotation.definition}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-emerald-700 dark:text-emerald-400">Role:</strong>{' '}
                  {selectedAnnotation.functionRole}
                </p>
                {selectedAnnotation.physiologicalOrClinicalImportance && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/80 dark:border-slate-800 pt-1">
                    {selectedAnnotation.physiologicalOrClinicalImportance}
                  </p>
                )}
              </div>
            )}

            {/* Custom Pin Creation Form Overlay */}
            {draftPinCoords && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute inset-x-3 bottom-16 sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-auto z-30 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xl space-y-2.5 max-h-[75%] overflow-y-auto"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Add Study Annotation ({draftPinCoords.xPercent}%, {draftPinCoords.yPercent}%)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setDraftPinCoords(null)}
                    className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <form onSubmit={handleSaveCustomPin} className="space-y-2 text-xs">
                  <input
                    type="text"
                    required
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    placeholder="Structure or component name *"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={draftLocation}
                    onChange={(e) => setDraftLocation(e.target.value)}
                    placeholder="Anatomical / setup location"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    value={draftDefinition}
                    onChange={(e) => setDraftDefinition(e.target.value)}
                    placeholder="Definition / identification"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    value={draftFunction}
                    onChange={(e) => setDraftFunction(e.target.value)}
                    placeholder="Function or physiological role"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={draftImportance}
                    onChange={(e) => setDraftImportance(e.target.value)}
                    placeholder="Clinical or exam note (optional)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDraftPinCoords(null)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPin || !draftLabel.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingPin ? 'Saving...' : 'Save Pin'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Desktop Prev / Next Image Overlay Buttons */}
            {hasSiblings && (
              <>
                <button
                  type="button"
                  onClick={() => stepSibling(-1)}
                  className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500 shadow-md absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-colors"
                  aria-label="Previous image"
                  title="Previous image (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => stepSibling(1)}
                  className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500 shadow-md absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors"
                  aria-label="Next image"
                  title="Next image (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Floating Stage Control Dock */}
            {!loading && !loadError && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-2xl bg-white/92 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg max-w-[95%]">
                {hasSiblings && (
                  <button
                    type="button"
                    onClick={() => stepSibling(-1)}
                    className="sm:hidden w-8 h-8 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const next = clampZoom(zoom - 0.35);
                    setZoom(next);
                    setPan((p) => clampPan(p, next, stageRef.current));
                  }}
                  className="md:hidden w-8 h-8 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="md:hidden px-1.5 h-8 inline-flex items-center justify-center rounded-xl text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100"
                  aria-label="Reset zoom to 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((z) => clampZoom(z + 0.35))}
                  className="md:hidden w-8 h-8 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {hasAnnotations && (
                  <button
                    type="button"
                    onClick={() => setShowLabels((s) => !s)}
                    className={`sm:hidden h-8 px-2 inline-flex items-center gap-1 rounded-xl text-xs font-semibold ${
                      showLabels
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{academicContext.annotations.length}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPinPlacementMode((p) => !p);
                    setDraftPinCoords(null);
                  }}
                  className={`h-8 px-2.5 inline-flex items-center gap-1 rounded-xl text-xs font-medium whitespace-nowrap ${
                    pinPlacementMode
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Place a custom study annotation pin on this visual"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Add Pin</span>
                </button>

                <button
                  type="button"
                  onClick={handleCycleBackdrop}
                  className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                  title="Switch canvas backdrop (Auto / Dark / Light paper)"
                >
                  <Contrast className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="capitalize">{backdrop === 'auto' ? 'Canvas' : backdrop}</span>
                </button>

                {zoom > 1.02 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="h-8 px-2 inline-flex items-center gap-1 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Fit</span>
                  </button>
                )}

                {hasSiblings && (
                  <button
                    type="button"
                    onClick={() => stepSibling(1)}
                    className="sm:hidden w-8 h-8 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right (Desktop) / Below Image (Mobile): Structured Academic Information Panel */}
          {infoOpen && (
            <aside className="flex-1 lg:flex-initial lg:w-[440px] xl:w-[480px] min-h-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden shrink-0">
              {/* Mobile Docked Bar to Expand / Collapse Reading Height */}
              <div className="lg:hidden px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                  Academic Learning Information · {academicContext.completeness.completenessPercent}% Complete
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobilePanelExpanded((e) => !e)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {mobilePanelExpanded ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Show Image</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Expand</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoOpen(false)}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    aria-label="Hide academic panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <AcademicInfoPanel
                  item={item}
                  context={academicContext}
                  allVisuals={allVisuals}
                  selectedAnnotationId={selectedAnnotationId}
                  onSelectAnnotation={handleSelectAnnotation}
                  pinPlacementMode={pinPlacementMode}
                  onTogglePinPlacement={() => {
                    setPinPlacementMode((p) => !p);
                    setDraftPinCoords(null);
                  }}
                  onDeleteUserAnnotation={handleDeleteUserAnnotation}
                  onSelectVisual={onSelectVisual}
                  onUpdated={onUpdated}
                  onDeleteVisual={onDelete}
                  onCloseViewer={onClose}
                />
              </div>
            </aside>
          )}
        </div>

        {/* Desktop Related Visuals Strip */}
        {relatedVisuals.length > 0 && (
          <div className="hidden lg:block px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-3 overflow-x-auto pb-0.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                Related Visuals:
              </span>
              {relatedVisuals.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectVisual(rel)}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors shrink-0 text-left max-w-[230px]"
                >
                  <VisualThumbnail
                    item={rel}
                    className="w-10 h-8 rounded-lg shrink-0"
                    imgClassName="w-full h-full object-contain"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {rel.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {CATEGORY_LABELS[rel.category]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
