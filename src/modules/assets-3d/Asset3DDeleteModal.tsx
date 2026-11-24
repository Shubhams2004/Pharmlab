import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, FlaskConical, Loader2, MapPin, ShieldAlert, Trash2, X } from 'lucide-react';
import { delete3DAsset, inspect3DAssetDeleteImpact } from './asset3dDb';
import { Asset3DDeleteImpact, Asset3DItem, formatBytes } from './types';

interface Asset3DDeleteModalProps {
  asset: Asset3DItem | null;
  onClose: () => void;
  onDeleted: (deletedId: string) => void;
}

export default function Asset3DDeleteModal({
  asset,
  onClose,
  onDeleted
}: Asset3DDeleteModalProps) {
  const [impact, setImpact] = useState<Asset3DDeleteImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) {
      setImpact(null);
      setErrorMsg(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    inspect3DAssetDeleteImpact(asset.id)
      .then((res) => {
        if (!cancelled) setImpact(res);
      })
      .catch(() => {
        if (!cancelled) setImpact(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [asset]);

  if (!asset) return null;

  const hasConnections = Boolean(
    impact &&
      (impact.syllabusLinks.length > 0 ||
        impact.annotationCount > 0 ||
        impact.dependentAssetNames.length > 0)
  );

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setErrorMsg(null);
    try {
      await delete3DAsset(asset.id);
      onDeleted(asset.id);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete 3D asset.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Confirm deletion of ${asset.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                Confirm 3D Asset Deletion
              </p>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                Delete &ldquo;{asset.name}&rdquo;?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
            aria-label="Cancel deletion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="py-6 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Checking linked topics, experiments, and shared binary references...</span>
            </div>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                This permanently removes this entry from your PharmaLab 3D Asset Library.
                {impact && impact.binaryBytesFreed > 0
                  ? ` ${formatBytes(impact.binaryBytesFreed)} of stored 3D binary data will be freed from IndexedDB.`
                  : impact && impact.dependentAssetNames.length > 0
                  ? ' Its underlying 3D file is shared with other library reference copies and will remain safely stored.'
                  : ''}
              </p>

              {hasConnections && impact && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
                  <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      Active Module Links Detected ({impact.syllabusLinks.length} syllabus/lab links
                      {impact.annotationCount > 0 ? ` · ${impact.annotationCount} 3D pins` : ''})
                    </span>
                  </p>

                  {impact.affectedSubjects.length > 0 && (
                    <div className="space-y-1 text-slate-700 dark:text-slate-200">
                      <p className="font-semibold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Linked Academic Subjects:</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 pl-5">
                        {impact.affectedSubjects.join(' · ')}
                      </p>
                    </div>
                  )}

                  {impact.affectedTopics.length > 0 && (
                    <div className="space-y-1 text-slate-700 dark:text-slate-200">
                      <p className="font-semibold">Linked Syllabus Units &amp; Topics:</p>
                      <p className="text-slate-600 dark:text-slate-300 pl-3">
                        {impact.affectedTopics.join(' · ')}
                      </p>
                    </div>
                  )}

                  {impact.affectedExperiments.length > 0 && (
                    <div className="space-y-1 text-slate-700 dark:text-slate-200">
                      <p className="font-semibold flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Linked Practical Experiments:</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 pl-5">
                        {impact.affectedExperiments.join(' · ')}
                      </p>
                    </div>
                  )}

                  {impact.affectedStructures.length > 0 && (
                    <div className="space-y-1 text-slate-700 dark:text-slate-200">
                      <p className="font-semibold">Anatomy Explorer Structures:</p>
                      <p className="text-slate-600 dark:text-slate-300 pl-3">
                        {impact.affectedStructures.join(' · ')}
                      </p>
                    </div>
                  )}

                  {impact.annotationCount > 0 && (
                    <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {impact.annotationCount} saved 3D spatial pin
                        {impact.annotationCount === 1 ? '' : 's'} on this entry will be removed.
                      </span>
                    </p>
                  )}

                  {impact.dependentAssetNames.length > 0 && (
                    <p className="text-emerald-800 dark:text-emerald-300 font-medium pt-1 border-t border-amber-500/20">
                      Safe binary preservation: {impact.dependentAssetNames.length} reference copy
                      {impact.dependentAssetNames.length === 1 ? '' : ' copies'} (
                      {impact.dependentAssetNames.slice(0, 3).join(', ')}
                      {impact.dependentAssetNames.length > 3 ? '…' : ''}) will keep working without losing the 3D geometry.
                    </p>
                  )}

                  <p className="text-slate-600 dark:text-slate-400">
                    All connected modules safely unlink missing IDs without crashing.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={loading || deleting}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
