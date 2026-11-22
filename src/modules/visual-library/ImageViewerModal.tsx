import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Edit3,
  ExternalLink,
  ImageOff,
  Loader2,
  Maximize2,
  Minimize2,
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

function formatBytes(bytes: number): string {
  if (!bytes) return 'Bundled Plate';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
  const [loadError, setLoadError] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRootRef = useRef<HTMLDivElement | null>(null);

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
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, isFullscreen, onClose]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer: ${item.title}`}
    >
      <div
        ref={viewerRootRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl ${
          isFullscreen
            ? 'h-screen max-w-none rounded-none'
            : 'max-w-6xl h-[92vh] rounded-2xl'
        }`}
      >
        {/* Top Viewer Bar */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {CATEGORY_LABELS[item.category]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{item.sourceName}</span>
              {item.width && item.height && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {item.width} × {item.height} px
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {item.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200 min-w-[44px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                aria-label="Zoom in"
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
                title="Reset 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
              aria-label="Close image viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Viewport */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* High-Resolution Image Canvas */}
          <div
            className={`flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden relative select-none p-4 ${
              zoom > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''
            }`}
            onMouseDown={(e) => {
              if (zoom <= 1) return;
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
              setPan({
                x: dragStartRef.current.panX + (e.clientX - dragStartRef.current.x),
                y: dragStartRef.current.panY + (e.clientY - dragStartRef.current.y)
              });
            }}
            onMouseUp={() => {
              setDragging(false);
              dragStartRef.current = null;
            }}
            onMouseLeave={() => {
              setDragging(false);
              dragStartRef.current = null;
            }}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Loading high-resolution image...
                </span>
              </div>
            ) : loadError || !imgSrc ? (
              <div className="text-center space-y-2 p-6">
                <ImageOff className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Image could not be loaded
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify your connection if this item references a remote repository URL.
                </p>
              </div>
            ) : (
              <img
                src={imgSrc}
                alt={item.title}
                referrerPolicy="no-referrer"
                draggable={false}
                onError={() => setLoadError(true)}
                className="max-w-full max-h-full object-contain transition-transform duration-150"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                }}
              />
            )}
          </div>

          {/* Right Metadata, Licensing & Associations Panel */}
          <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-5 space-y-5 shrink-0 max-h-[42vh] lg:max-h-none">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Scientific Metadata &amp; License
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditing((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-500/40"
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
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold"
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
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
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
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
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
              </>
            )}
          </aside>
        </div>

        {/* Related Images Strip */}
        {relatedVisuals.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
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
