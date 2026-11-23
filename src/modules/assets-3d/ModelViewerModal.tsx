import React, { useEffect, useState } from 'react';
import {
  Box,
  ExternalLink,
  GraduationCap,
  Info,
  Loader2,
  MapPin,
  ShieldCheck,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import Universal3DViewer from './Universal3DViewer';
import {
  add3DAssetAnnotation,
  delete3DAsset,
  get3DModelObjectUrl,
  mark3DAssetOpened,
  remove3DAssetAnnotation,
  save3DAssetThumbnail,
  update3DAssetMeta
} from './asset3dDb';
import {
  Asset3DAnnotation,
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  CATEGORY_3D_LABELS,
  formatBytes,
  IMPORT_STATUS_3D_LABELS
} from './types';

interface ModelViewerModalProps {
  asset: Asset3DItem | null;
  onClose: () => void;
  onAssetUpdated?: (updated: Asset3DItem) => void;
  onAssetDeleted?: (id: string) => void;
}

export default function ModelViewerModal({
  asset,
  onClose,
  onAssetUpdated,
  onAssetDeleted
}: ModelViewerModalProps) {
  const [liveAsset, setLiveAsset] = useState<Asset3DItem | null>(asset);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [resolvingUrl, setResolvingUrl] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLiveAsset(asset);
    setConfirmDelete(false);
  }, [asset]);

  useEffect(() => {
    if (!asset) {
      setModelUrl(null);
      setResolveError(null);
      return;
    }

    let cancelled = false;
    let revokeFn: (() => void) | null = null;
    setResolvingUrl(true);
    setResolveError(null);

    void mark3DAssetOpened(asset.id).then((opened) => {
      if (!cancelled && opened) {
        setLiveAsset(opened);
        onAssetUpdated?.(opened);
      }
    });

    (async () => {
      try {
        if (asset.hasBinaryBlob) {
          const obj = await get3DModelObjectUrl(asset.id);
          if (cancelled) {
            obj?.revoke();
            return;
          }
          if (obj) {
            revokeFn = obj.revoke;
            setModelUrl(obj.url);
            setResolvingUrl(false);
            return;
          }
        }
        const safeExt = sanitizeHttpUrl(asset.externalFileUrl);
        if (safeExt) {
          setModelUrl(safeExt);
          setResolvingUrl(false);
          return;
        }
        setResolveError(
          'No local binary model or direct 3D file URL is stored for this asset. Open its source page or re-upload the GLB/STL file.'
        );
      } catch (err) {
        if (!cancelled) {
          setResolveError(
            err instanceof Error ? err.message : 'Unable to load 3D binary from IndexedDB.'
          );
        }
      } finally {
        if (!cancelled) setResolvingUrl(false);
      }
    })();

    return () => {
      cancelled = true;
      revokeFn?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  if (!liveAsset) return null;

  const safeSourceUrl = sanitizeHttpUrl(liveAsset.sourceUrl);

  const handleAddAnnotation = async (ann: Asset3DAnnotation) => {
    const updated = await add3DAssetAnnotation(liveAsset.id, ann);
    if (updated) {
      setLiveAsset(updated);
      onAssetUpdated?.(updated);
    }
  };

  const handleRemoveAnnotation = async (annId: string) => {
    const updated = await remove3DAssetAnnotation(liveAsset.id, annId);
    if (updated) {
      setLiveAsset(updated);
      onAssetUpdated?.(updated);
    }
  };

  const handleThumbnailCaptured = async (dataUrl: string) => {
    const updated = await save3DAssetThumbnail(liveAsset.id, dataUrl);
    if (updated) {
      setLiveAsset(updated);
      onAssetUpdated?.(updated);
    }
  };

  const handleModelAnalyzed = async (stats: {
    componentCount: number;
    vertexCount: number;
    triangleCount: number;
  }) => {
    if (
      liveAsset.componentCount === stats.componentCount &&
      liveAsset.vertexCount === stats.vertexCount &&
      liveAsset.triangleCount === stats.triangleCount
    ) {
      return;
    }
    const updated = await update3DAssetMeta(liveAsset.id, stats);
    if (updated) {
      setLiveAsset(updated);
      onAssetUpdated?.(updated);
    }
  };

  const handleDelete = async () => {
    await delete3DAsset(liveAsset.id);
    onAssetDeleted?.(liveAsset.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-0 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect 3D model: ${liveAsset.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[92dvh] bg-white dark:bg-slate-900 border-0 sm:border sm:border-slate-200 sm:dark:border-slate-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {CATEGORY_3D_LABELS[liveAsset.category]} · {liveAsset.format.toUpperCase()} ·{' '}
              {IMPORT_STATUS_3D_LABELS[liveAsset.importStatus]}
              {liveAsset.byteSize ? ` · ${formatBytes(liveAsset.byteSize)}` : ''}
            </p>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white line-clamp-2 sm:truncate leading-snug">
              {liveAsset.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {safeSourceUrl && (
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Original Source</span>
                <span className="sm:hidden">Source</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close 3D inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewer + Metadata Body */}
        <div className="flex-1 min-h-0 p-3 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto">
          {resolvingUrl ? (
            <div className="h-[54dvh] min-h-[320px] sm:h-[580px] rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-300">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-sm font-medium">Loading 3D binary from IndexedDB...</span>
            </div>
          ) : resolveError ? (
            <div className="h-[320px] rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-center p-6 text-slate-300">
              <Box className="w-8 h-8 text-amber-400" />
              <p className="text-sm font-bold text-white">No Stored 3D Binary Available</p>
              <p className="text-xs max-w-md leading-relaxed">{resolveError}</p>
            </div>
          ) : (
            <Universal3DViewer
              asset={liveAsset}
              modelUrl={modelUrl}
              modelFormat={liveAsset.format}
              annotations={liveAsset.annotations}
              onAddAnnotation={handleAddAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
              onThumbnailCaptured={handleThumbnailCaptured}
              onModelAnalyzed={handleModelAnalyzed}
            />
          )}

          {/* Metadata, Attribution, Syllabus Associations & Saved Pins */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            <div className="lg:col-span-7 space-y-4">
              {liveAsset.description && (
                <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Scientific Description</span>
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {liveAsset.description}
                  </p>
                </section>
              )}

              <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Provenance, Creator &amp; License</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Creator:</strong>{' '}
                    {liveAsset.creator}
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Source:</strong>{' '}
                    {liveAsset.sourceName}
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">License:</strong>{' '}
                    {liveAsset.license}
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Attribution:</strong>{' '}
                    {liveAsset.attribution}
                  </p>
                </div>
                {liveAsset.usageRestrictions && (
                  <p className="text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    {liveAsset.usageRestrictions}
                  </p>
                )}
              </section>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Departments &amp; Syllabus Links</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {liveAsset.departments.map((d) => BPHARM_DEPARTMENT_LABELS[d]).join(' · ')}
                </p>
                {liveAsset.syllabusLinks.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {liveAsset.syllabusLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {link.course}
                          {link.subjectCode ? ` · ${link.subjectCode}` : ''}
                          {link.unitNo ? ` · ${link.unitNo}` : ''}
                        </p>
                        {(link.topicTitle || link.structureName || link.experimentTitle) && (
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                            {[link.topicTitle, link.structureName, link.experimentTitle]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    Not yet pinned to a specific syllabus topic or experiment.
                  </p>
                )}

                {liveAsset.tags.length > 0 && (
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                    <Tag className="w-3 h-3 shrink-0" />
                    <span>{liveAsset.tags.join(' · ')}</span>
                  </p>
                )}
              </section>

              {liveAsset.annotations.length > 0 && (
                <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Saved 3D Pins ({liveAsset.annotations.length})</span>
                  </h3>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {liveAsset.annotations.map((ann, i) => (
                      <div
                        key={ann.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {i + 1}. {ann.label}
                          </p>
                          {ann.note && (
                            <p className="text-slate-500 dark:text-slate-400">{ann.note}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnnotation(ann.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          aria-label={`Remove pin ${ann.label}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="flex items-center justify-end">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from 3D Library</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
