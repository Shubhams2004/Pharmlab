import React, { useEffect, useMemo, useState } from 'react';
import { Box, Check, Link2, Loader2, Search, X } from 'lucide-react';
import {
  addSyllabusAssociation,
  getAll3DAssets,
  getCustom3DCategories
} from './asset3dDb';
import {
  Asset3DItem,
  BPharmDepartmentId,
  Custom3DCategory,
  formatBytes,
  get3DCategoryLabel,
  SyllabusAssociation
} from './types';

interface Asset3DLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinked: (updated: Asset3DItem) => void;
  departmentId: BPharmDepartmentId;
  course?: string;
  subjectCode?: string;
  subjectTitle?: string;
  unitNo?: string;
  topicId?: string;
  topicTitle?: string;
  experimentId?: string;
  experimentTitle?: string;
  structureId?: string;
  structureName?: string;
  linkedAssetIds?: string[];
}

export default function Asset3DLibraryPickerModal({
  isOpen,
  onClose,
  onLinked,
  departmentId,
  course = 'B.Pharm',
  subjectCode,
  subjectTitle,
  unitNo,
  topicId,
  topicTitle,
  experimentId,
  experimentTitle,
  structureId,
  structureName,
  linkedAssetIds = []
}: Asset3DLibraryPickerModalProps) {
  const [allAssets, setAllAssets] = useState<Asset3DItem[]>([]);
  const [customCats, setCustomCats] = useState<Custom3DCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setCustomCats(getCustom3DCategories());
    getAll3DAssets()
      .then((list) => setAllAssets(list))
      .catch(() => setAllAssets([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allAssets;
    return allAssets.filter((a) => {
      const hay = `${a.name} ${a.description} ${a.creator} ${a.tags.join(' ')} ${get3DCategoryLabel(
        a.category,
        customCats
      )}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allAssets, customCats, query]);

  if (!isOpen) return null;

  const targetLabel = structureName || topicTitle || experimentTitle || subjectTitle || 'this module';

  const handleLinkAsset = async (asset: Asset3DItem) => {
    setLinkingId(asset.id);
    try {
      const assoc: SyllabusAssociation = {
        id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        course,
        departmentId,
        subjectCode,
        subjectTitle,
        unitNo,
        topicId,
        topicTitle,
        experimentId,
        experimentTitle,
        structureId,
        structureName
      };
      const updated = await addSyllabusAssociation(asset.id, assoc);
      if (updated) {
        onLinked(updated);
        onClose();
      }
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Link existing 3D model from library"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[86dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Reuse Existing 3D Asset · Zero Binary Duplication
            </p>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              Link Stored 3D Model to {targetLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close library picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your stored 3D Asset Library by name, category, or tag..."
              className="w-full min-h-[40px] pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading 3D Asset Library...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center space-y-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <Box className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {allAssets.length === 0
                  ? 'Your 3D Asset Library has no saved models yet.'
                  : 'No library models matched your search.'}
              </p>
              <p>Use Discover 3D or Attach GLB / STL to add models first.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const alreadyLinked = linkedAssetIds.includes(item.id);
              const busy = linkingId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.thumbnailDataUrl || item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailDataUrl || item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Box className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                        {get3DCategoryLabel(item.category, customCats)} · {item.format.toUpperCase()}
                        {item.byteSize ? ` · ${formatBytes(item.byteSize)}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={alreadyLinked || busy}
                    onClick={() => void handleLinkAsset(item)}
                    className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                      alreadyLinked
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : alreadyLinked ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    <span>{alreadyLinked ? 'Linked' : 'Link Model'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
