import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Edit3,
  ExternalLink,
  ImageOff,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import VisualThumbnail from './VisualThumbnail';
import {
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
  DepartmentId,
  VisualCategory,
  VisualMediaItem
} from './types';
import { resolveVisualImageSrc, updateVisualMetadata } from './visualDb';

interface ImageViewerModalProps {
  item: VisualMediaItem | null;
  allVisuals: VisualMediaItem[];
  onClose: () => void;
  onSelectVisual: (item: VisualMediaItem) => void;
  onUpdated?: (updated: VisualMediaItem) => void;
  onDelete?: (id: string) => Promise<void> | void;
}

type StageBackdrop = 'auto' | 'dark' | 'light';

function formatBytes(bytes: number): string {
  if (!bytes) return 'Bundled Plate';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

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
  const maxX = Math.max(120, (w * (zoom - 1)) / 2 + 120);
  const maxY = Math.max(120, (h * (zoom - 1)) / 2 + 120);
  return {
    x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
    y: Math.max(-maxY, Math.min(maxY, nextPan.y))
  };
}

export default function ImageViewerModal({
  item,
  allVisuals,
  onClose,
  onSelectVisual,
  onUpdated,
  onDelete
}: ImageViewerModalProps) {
  const { openKnowledgeLibrary } = useLibraryNavigation();

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [backdrop, setBackdrop] = useState<StageBackdrop>('auto');

  const [infoOpen, setInfoOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const viewerRootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Touch pinch, drag, swipe & double-tap refs
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

  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<VisualCategory>('anatomy');
  const [editDepartments, setEditDepartments] = useState<DepartmentId[]>([]);
  const [editExperiments, setEditExperiments] = useState('');
  const [editEquipment, setEditEquipment] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    if (!item) return;

    let cancelled = false;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLoadError(false);
    setImgLoaded(false);
    setNaturalDims(null);
    setEditing(false);
    setConfirmDelete(false);

    setEditTitle(item.title);
    setEditCaption(item.caption);
    setEditDescription(item.description);
    setEditCategory(item.category);
    setEditDepartments(item.departments);
    setEditExperiments(item.experiments.join(', '));
    setEditEquipment(item.equipment.join(', '));
    setEditTags(item.tags.join(', '));

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
  }, [item, retryNonce]);

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
        if (isFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
        return;
      }

      if (typing || editing) return;

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
  }, [item, isFullscreen, onClose, editing, hasSiblings, stepSibling]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Non-passive wheel & multi-touch prevention on stage so zooming never scrolls background
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
    return allVisuals
      .filter(
        (candidate) =>
          candidate.id !== item.id &&
          (candidate.category === item.category ||
            candidate.departments.some((d) => item.departments.includes(d)))
      )
      .slice(0, 6);
  }, [item, allVisuals]);

  if (!item) return null;

  const toggleZoomAtPoint = (clientX: number, clientY: number) => {
    if (zoom > 1.15) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      setZoom(2.4);
      return;
    }
    const rect = stage.getBoundingClientRect();
    const offsetX = clientX - (rect.left + rect.width / 2);
    const offsetY = clientY - (rect.top + rect.height / 2);
    const targetZoom = 2.4;
    setZoom(targetZoom);
    setPan(
      clampPan(
        { x: -offsetX * 0.95, y: -offsetY * 0.95 },
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

      // Swipe Left / Right between images when fitted at 1x zoom
      if (
        touchPanSwipeRef.current.active &&
        zoom <= 1.05 &&
        hasSiblings &&
        dt < 450 &&
        Math.abs(dx) > 64 &&
        Math.abs(dx) > Math.abs(dy) * 1.8
      ) {
        touchPanSwipeRef.current.active = false;
        stepSibling(dx < 0 ? 1 : -1);
        return;
      }

      // Double-tap to zoom / reset
      if (!touchPanSwipeRef.current.moved) {
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

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const splitList = (val: string) =>
        val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      const updated = await updateVisualMetadata(item.id, {
        title: editTitle.trim() || item.title,
        caption: editCaption.trim(),
        description: editDescription.trim(),
        category: editCategory,
        departments: editDepartments,
        experiments: splitList(editExperiments),
        equipment: splitList(editEquipment),
        tags: splitList(editTags)
      });

      if (updated) {
        onUpdated?.(updated);
        onSelectVisual(updated);
      }
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleDept = (dept: DepartmentId) => {
    setEditDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const displayWidth = item.width || naturalDims?.w;
  const displayHeight = item.height || naturalDims?.h;

  const stageBgClass =
    backdrop === 'dark'
      ? 'bg-slate-950'
      : backdrop === 'light'
        ? 'bg-white'
        : 'bg-slate-100 dark:bg-slate-950';

  const metadataContent = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Scientific Metadata &amp; License
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-500/40"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editing ? 'Cancel' : 'Edit'}</span>
          </button>
          {item.sourceType !== 'built-in' && onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete((prev) => !prev)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
              aria-label="Delete image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close details sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {confirmDelete && onDelete && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
            Remove from Visual Library?
          </span>
          <button
            type="button"
            onClick={async () => {
              await onDelete(item.id);
              onClose();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
          >
            Confirm Delete
          </button>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSaveMetadata} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Caption
            </label>
            <input
              type="text"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Scientific Description
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as VisualCategory)}
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
              Associated Departments
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(DEPARTMENT_LABELS) as DepartmentId[]).map((dept) => {
                const active = editDepartments.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
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
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Experiments (comma-separated)
            </label>
            <input
              type="text"
              value={editExperiments}
              onChange={(e) => setEditExperiments(e.target.value)}
              placeholder="e.g. Exp 14, Exp 16a"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Equipment (comma-separated)
            </label>
            <input
              type="text"
              value={editEquipment}
              onChange={(e) => setEditEquipment(e.target.value)}
              placeholder="e.g. Compound Microscope, Burette"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={savingEdit}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            <Check className="w-4 h-4" />
            <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      ) : (
        <>
          {item.caption && (
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {item.caption}
            </p>
          )}

          {item.description && item.description !== item.caption && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.description}
            </p>
          )}

          {item.linkedBookId && item.linkedBookPage && (
            <button
              type="button"
              onClick={() => {
                openKnowledgeLibrary({
                  bookId: item.linkedBookId,
                  pageNumber: item.linkedBookPage
                });
                onClose();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Source Textbook (Page {item.linkedBookPage})</span>
            </button>
          )}

          <dl className="space-y-2.5 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Source</dt>
              <dd className="text-slate-900 dark:text-slate-200 font-medium text-right">
                {item.sourceName}
              </dd>
            </div>
            {item.creator && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Creator</dt>
                <dd className="text-slate-900 dark:text-slate-200 font-medium text-right">
                  {item.creator}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">License</dt>
              <dd className="text-emerald-700 dark:text-emerald-400 font-semibold text-right inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{item.license}</span>
              </dd>
            </div>
            {displayWidth && displayHeight && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Resolution</dt>
                <dd className="text-slate-900 dark:text-slate-200 font-medium tabular-nums text-right">
                  {displayWidth} × {displayHeight} px
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Storage</dt>
              <dd className="text-slate-900 dark:text-slate-200 font-medium tabular-nums text-right">
                {formatBytes(item.fileSize)}
              </dd>
            </div>
          </dl>

          {item.attribution && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                Attribution
              </span>
              {item.attribution}
            </div>
          )}

          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>View Original Repository Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {(item.departments.length > 0 ||
            item.experiments.length > 0 ||
            item.equipment.length > 0 ||
            item.tags.length > 0) && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              {item.departments.length > 0 && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                    Departments
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {item.departments.map((d) => DEPARTMENT_LABELS[d]).join(' · ')}
                  </p>
                </div>
              )}
              {item.experiments.length > 0 && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                    Associated Practicals
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {item.experiments.join(' · ')}
                  </p>
                </div>
              )}
              {item.equipment.length > 0 && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                    Equipment
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {item.equipment.join(' · ')}
                  </p>
                </div>
              )}
              {item.tags.length > 0 && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                    Tags
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    {item.tags.join(' · ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Related Scientific Visuals inside Mobile Sheet as well */}
          {relatedVisuals.length > 0 && (
            <div className="lg:hidden pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                Related Scientific Visuals
              </span>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {relatedVisuals.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectVisual(rel)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 text-left max-w-[210px]"
                  >
                    <VisualThumbnail
                      item={rel}
                      className="w-10 h-9 rounded-lg shrink-0"
                      imgClassName="w-full h-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {rel.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {CATEGORY_LABELS[rel.category]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer: ${item.title}`}
    >
      <div
        ref={viewerRootRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-white dark:bg-slate-900 border-0 sm:border sm:border-slate-200 sm:dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl ${
          isFullscreen
            ? 'h-[100dvh] max-w-none rounded-none'
            : 'max-w-6xl h-[100dvh] sm:h-[92dvh] rounded-none sm:rounded-2xl'
        }`}
      >
        {/* Top Viewer Bar */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                {CATEGORY_LABELS[item.category]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{item.sourceName}</span>
              {hasSiblings && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums shrink-0">
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
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {item.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Desktop Zoom Pill */}
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
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

            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                infoOpen
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              aria-label="Toggle scientific metadata and license panel"
              aria-expanded={infoOpen}
            >
              <Info className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">Details</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shrink-0"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shrink-0"
              aria-label="Close image viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Viewport */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
          {/* Image Stage Wrapper (overlays sit outside stageRef so touch prevention never blocks taps) */}
          <div className={`flex-1 relative overflow-hidden transition-colors ${stageBgClass}`}>
            {/* High-Resolution Image Canvas */}
            <div
              ref={stageRef}
              className={`w-full h-full flex items-center justify-center overflow-hidden relative select-none touch-none p-3 sm:p-5 ${
                zoom > 1.02 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
              }`}
              onDoubleClick={(e) => {
                if (loading || loadError) return;
                toggleZoomAtPoint(e.clientX, e.clientY);
              }}
              onMouseDown={(e) => {
                if (zoom <= 1.02) return;
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
                    Loading high-resolution image...
                  </span>
                </div>
              ) : loadError || !imgSrc ? (
                <div className="text-center space-y-3 p-6 max-w-sm">
                  <ImageOff className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Image could not be loaded
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify your connection if this item references a remote repository URL.
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
                <img
                  src={imgSrc}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  onLoad={(e) => {
                    setImgLoaded(true);
                    const imgEl = e.currentTarget;
                    if (imgEl.naturalWidth && imgEl.naturalHeight) {
                      setNaturalDims({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });
                    }
                  }}
                  onError={() => setLoadError(true)}
                  className={`max-w-full max-h-full object-contain transition-opacity duration-150 ${
                    imgLoaded ? 'opacity-100' : 'opacity-0'
                  } ${dragging || touchPinchRef.current.active ? '' : 'transition-transform duration-150'}`}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                  }}
                />
              )}
            </div>

            {/* Desktop Prev / Next Image Overlay Buttons */}
            {hasSiblings && (
              <>
                <button
                  type="button"
                  onClick={() => stepSibling(-1)}
                  className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500 shadow-md absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-colors"
                  aria-label="Previous image"
                  title="Previous image (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => stepSibling(1)}
                  className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500 shadow-md absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors"
                  aria-label="Next image"
                  title="Next image (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Floating Bottom Inspector Bar (Mobile Zoom/Pan/Browse + Backdrop Contrast) */}
            {!loading && !loadError && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg max-w-[95vw]">
                {hasSiblings && (
                  <button
                    type="button"
                    onClick={() => stepSibling(-1)}
                    className="sm:hidden w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  className="sm:hidden w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  className="sm:hidden px-2 h-9 inline-flex items-center justify-center rounded-xl text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100"
                  aria-label="Reset zoom to 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((z) => clampZoom(z + 0.35))}
                  className="sm:hidden w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCycleBackdrop}
                  className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
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
                    className="h-9 px-2.5 inline-flex items-center gap-1 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Fit</span>
                  </button>
                )}

                {hasSiblings && (
                  <button
                    type="button"
                    onClick={() => stepSibling(1)}
                    className="sm:hidden w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Metadata Panel (when infoOpen) */}
          {infoOpen && (
            <aside className="hidden lg:block w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-5 space-y-5 shrink-0">
              {metadataContent}
            </aside>
          )}

          {/* Mobile & Tablet Metadata Bottom Sheet Overlay (never crushes image canvas!) */}
          {infoOpen && (
            <>
              <div
                onClick={() => setInfoOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] z-20"
                aria-hidden="true"
              />
              <aside className="lg:hidden fixed inset-x-0 bottom-0 max-h-[76dvh] rounded-t-2xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto px-4 pb-6 pt-2 space-y-4 z-30 shadow-2xl">
                <div className="flex justify-center py-1">
                  <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
                {metadataContent}
              </aside>
            </>
          )}
        </div>

        {/* Desktop Related Images Strip */}
        {relatedVisuals.length > 0 && (
          <div className="hidden lg:block px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Related Scientific Visuals
              </span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {relatedVisuals.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectVisual(rel)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors shrink-0 text-left max-w-[240px]"
                >
                  <VisualThumbnail
                    item={rel}
                    className="w-12 h-10 rounded-lg shrink-0"
                    imgClassName="w-full h-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {rel.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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
