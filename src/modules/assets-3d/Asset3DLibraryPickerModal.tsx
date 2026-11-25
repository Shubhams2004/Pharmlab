import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Box,
  Check,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Search,
  X
} from 'lucide-react';
import {
  addSyllabusAssociationSafe,
  get3DModelObjectUrl,
  getAll3DAssets,
  getCustom3DCategories,
  isSameSyllabusAssociation
} from './asset3dDb';
import {
  Asset3DItem,
  BPharmDepartmentId,
  Custom3DCategory,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability,
  SyllabusAssociation
} from './types';
import Universal3DViewer from './Universal3DViewer';

type LinkGranularity = 'subtopic' | 'topic' | 'objective' | 'unit' | 'subject' | 'experiment' | 'structure';

interface Asset3DLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinked: (updated: Asset3DItem) => void;
  departmentId: BPharmDepartmentId;
  course?: string;
  syllabusId?: string;
  subjectCode?: string;
  subjectTitle?: string;
  unitId?: string;
  unitNo?: string;
  unitTitle?: string;
  topicId?: string;
  topicTitle?: string;
  subtopics?: string[];
  selectedSubtopic?: string;
  subjectObjectives?: string[];
  learningObjective?: string;
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
  syllabusId,
  subjectCode,
  subjectTitle,
  unitId,
  unitNo,
  unitTitle,
  topicId,
  topicTitle,
  subtopics = [],
  selectedSubtopic,
  subjectObjectives = [],
  learningObjective,
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
  const [notice, setNotice] = useState<string | null>(null);

  const defaultGranularity: LinkGranularity = selectedSubtopic
    ? 'subtopic'
    : structureId
    ? 'structure'
    : experimentId || experimentTitle
    ? 'experiment'
    : topicId || topicTitle
    ? 'topic'
    : unitNo || unitId
    ? 'unit'
    : 'subject';

  const [granularity, setGranularity] = useState<LinkGranularity>(defaultGranularity);
  const [chosenSubtopic, setChosenSubtopic] = useState<string>(selectedSubtopic || subtopics[0] || '');
  const [chosenObjective, setChosenObjective] = useState<string>(
    learningObjective || subjectObjectives[0] || ''
  );

  // Lazy single-slot 3D preview inside modal before linking
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);

  const clearPreview = useCallback(() => {
    if (revokeRef.current) {
      revokeRef.current();
      revokeRef.current = null;
    }
    setPreviewAssetId(null);
    setPreviewUrl(null);
    setPreviewError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearPreview();
      setNotice(null);
      return;
    }
    setGranularity(defaultGranularity);
    setChosenSubtopic(selectedSubtopic || subtopics[0] || '');
    setChosenObjective(learningObjective || subjectObjectives[0] || '');
    setLoading(true);
    setCustomCats(getCustom3DCategories());
    getAll3DAssets()
      .then((list) => setAllAssets(list))
      .catch(() => setAllAssets([]))
      .finally(() => setLoading(false));
  }, [
    isOpen,
    defaultGranularity,
    selectedSubtopic,
    subtopics,
    learningObjective,
    subjectObjectives,
    clearPreview
  ]);

  useEffect(() => {
    return () => clearPreview();
  }, [clearPreview]);

  const handleTogglePreview = async (item: Asset3DItem) => {
    if (previewAssetId === item.id) {
      clearPreview();
      return;
    }
    clearPreview();
    setPreviewAssetId(item.id);
    setPreviewLoading(true);
    setPreviewError(null);

    if (item.hasBinaryBlob) {
      try {
        const res = await get3DModelObjectUrl(item.id, item.binaryRefAssetId);
        if (!res) {
          setPreviewError('Stored 3D binary could not be loaded.');
        } else {
          revokeRef.current = res.revoke;
          setPreviewUrl(res.url);
        }
      } catch {
        setPreviewError('Unable to decode stored 3D binary.');
      } finally {
        setPreviewLoading(false);
      }
    } else if (item.externalFileUrl && /^https?:\/\//i.test(item.externalFileUrl)) {
      setPreviewUrl(item.externalFileUrl);
      setPreviewLoading(false);
    } else {
      setPreviewLoading(false);
      setPreviewError('Metadata-only asset without attached GLB/STL binary.');
    }
  };

  const buildCandidateAssociation = useCallback(
    (idPrefix = 'ctx'): SyllabusAssociation => {
      const base: SyllabusAssociation = {
        id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        course,
        departmentId,
        syllabusId,
        subjectCode,
        subjectTitle
      };
      if (granularity === 'subject') return base;
      if (granularity === 'unit') {
        return { ...base, unitId, unitNo, unitTitle };
      }
      if (granularity === 'topic') {
        return { ...base, unitId, unitNo, unitTitle, topicId, topicTitle };
      }
      if (granularity === 'subtopic') {
        return {
          ...base,
          unitId,
          unitNo,
          unitTitle,
          topicId,
          topicTitle,
          subtopicTitle: chosenSubtopic.trim() || undefined
        };
      }
      if (granularity === 'objective') {
        return {
          ...base,
          unitId,
          unitNo,
          unitTitle,
          topicId,
          topicTitle,
          learningObjective: chosenObjective.trim() || undefined
        };
      }
      if (granularity === 'experiment') {
        return {
          ...base,
          unitId,
          unitNo,
          unitTitle,
          topicId,
          topicTitle,
          experimentId,
          experimentTitle
        };
      }
      return {
        ...base,
        unitId,
        unitNo,
        unitTitle,
        topicId,
        topicTitle,
        structureId,
        structureName
      };
    },
    [
      course,
      departmentId,
      syllabusId,
      subjectCode,
      subjectTitle,
      granularity,
      unitId,
      unitNo,
      unitTitle,
      topicId,
      topicTitle,
      chosenSubtopic,
      chosenObjective,
      experimentId,
      experimentTitle,
      structureId,
      structureName
    ]
  );

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

  const targetLabel =
    structureName || topicTitle || experimentTitle || unitNo || subjectTitle || 'this module';

  const previewAsset = previewAssetId ? allAssets.find((a) => a.id === previewAssetId) || null : null;

  const handleLinkAsset = async (asset: Asset3DItem) => {
    setLinkingId(asset.id);
    setNotice(null);
    try {
      const assoc = buildCandidateAssociation('ctx');
      const res = await addSyllabusAssociationSafe(asset.id, assoc);
      if (res.duplicate) {
        setNotice(`"${asset.name}" is already linked at this exact curriculum target.`);
        return;
      }
      if (res.asset) {
        onLinked(res.asset);
        onClose();
      }
    } finally {
      setLinkingId(null);
    }
  };

  const granularityOptions: Array<{ id: LinkGranularity; label: string; enabled: boolean }> = [
    { id: 'subtopic', label: 'Subtopic', enabled: Boolean(topicId || topicTitle || subtopics.length > 0 || selectedSubtopic) },
    { id: 'topic', label: 'Topic', enabled: Boolean(topicId || topicTitle) },
    { id: 'objective', label: 'Objective', enabled: Boolean(subjectObjectives.length > 0 || learningObjective) },
    { id: 'unit', label: 'Unit', enabled: Boolean(unitNo || unitId) },
    { id: 'subject', label: 'Subject', enabled: Boolean(subjectCode) },
    { id: 'experiment', label: 'Experiment', enabled: Boolean(experimentId || experimentTitle) },
    { id: 'structure', label: 'Anatomy Structure', enabled: Boolean(structureId || structureName) }
  ].filter((o) => o.enabled);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Link existing 3D model from library"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
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

        {/* Target Granularity Selector + Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          {granularityOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Link Level:
                </span>
                {granularityOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGranularity(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                      granularity === opt.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {granularity === 'subtopic' && (
                <div>
                  {subtopics.length > 0 ? (
                    <select
                      aria-label="Choose subtopic to link"
                      value={chosenSubtopic}
                      onChange={(e) => setChosenSubtopic(e.target.value)}
                      className="w-full min-h-[36px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      {subtopics.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={chosenSubtopic}
                      onChange={(e) => setChosenSubtopic(e.target.value)}
                      placeholder="Specify subtopic name..."
                      className="w-full min-h-[36px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              )}

              {granularity === 'objective' && (
                <div>
                  {subjectObjectives.length > 0 ? (
                    <select
                      aria-label="Choose learning objective to link"
                      value={chosenObjective}
                      onChange={(e) => setChosenObjective(e.target.value)}
                      className="w-full min-h-[36px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      {subjectObjectives.map((obj) => (
                        <option key={obj} value={obj}>
                          {obj}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={chosenObjective}
                      onChange={(e) => setChosenObjective(e.target.value)}
                      placeholder="Specify learning objective..."
                      className="w-full min-h-[36px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              )}
            </div>
          )}

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

          {notice && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{notice}</span>
            </p>
          )}
        </div>

        {/* Optional Single-Slot Lazy Inline Preview */}
        {previewAsset && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2">
              <span className="font-semibold truncate">Preview: {previewAsset.name}</span>
              <button
                type="button"
                onClick={clearPreview}
                className="text-slate-400 hover:text-white inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Preview</span>
              </button>
            </div>
            {previewLoading ? (
              <div className="h-[180px] flex items-center justify-center gap-2 text-xs text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading 3D preview...</span>
              </div>
            ) : previewError || !previewUrl ? (
              <div className="h-[130px] flex items-center justify-center text-xs text-amber-300">
                {previewError || 'Preview unavailable.'}
              </div>
            ) : (
              <Universal3DViewer
                key={previewAsset.id}
                asset={previewAsset}
                modelUrl={previewUrl}
                modelFormat={previewAsset.format}
                hideBuiltInHeader
                hideBuiltInSidebars
                className="h-[200px]"
              />
            )}
          </div>
        )}

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
              const candidateAssoc = buildCandidateAssociation('chk');
              const semanticAlreadyLinked = (item.syllabusLinks || []).some((l) =>
                isSameSyllabusAssociation(l, candidateAssoc)
              );
              const alreadyLinked =
                semanticAlreadyLinked ||
                (granularity === defaultGranularity &&
                  granularity !== 'subtopic' &&
                  granularity !== 'objective' &&
                  linkedAssetIds.includes(item.id));
              const busy = linkingId === item.id;
              const canPreview = getAsset3DAvailability(item).canOpenViewer;
              const isPreviewing = previewAssetId === item.id;

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

                  <div className="flex items-center gap-1.5 shrink-0">
                    {canPreview && (
                      <button
                        type="button"
                        onClick={() => void handleTogglePreview(item)}
                        className={`min-h-[34px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 ${
                          isPreviewing
                            ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                        }`}
                        title="Preview 3D geometry before linking"
                      >
                        {isPreviewing ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span className="hidden sm:inline">Preview</span>
                      </button>
                    )}

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
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
