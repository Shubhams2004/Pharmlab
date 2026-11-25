import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  Layers,
  Link2,
  Loader2,
  Maximize2,
  Sparkles,
  Unlink,
  Upload
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import { LearningDomainMode } from '../study-mode/types';
import {
  get3DModelObjectUrl,
  getAll3DAssets,
  getCustom3DCategories,
  getRelated3DModels,
  matchCurriculumAssetsSync,
  removeSyllabusAssociation
} from './asset3dDb';
import Asset3DLibraryPickerModal from './Asset3DLibraryPickerModal';
import Asset3DUploadModal, { Asset3DInitialContext } from './Asset3DUploadModal';
import ModelViewerModal from './ModelViewerModal';
import {
  Asset3DCategory,
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  Custom3DCategory,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability,
  mapWorkspaceDeptToBPharmDept
} from './types';
import Universal3DViewer from './Universal3DViewer';

export interface Academic3DContentPanelProps {
  workspaceDepartment?: string;
  departmentId?: BPharmDepartmentId;
  syllabusId?: string;
  course?: string;
  subjectCode?: string;
  subjectTitle?: string;
  unitId?: string;
  unitNo?: string;
  unitTitle?: string;
  topicId?: string;
  topicTitle?: string;
  subtopics?: string[];
  selectedSubtopic?: string | null;
  learningObjective?: string;
  subjectObjectives?: string[];
  learningDomainMode?: LearningDomainMode;
  linkedStructureIds?: string[];
  experimentId?: string;
  experimentTitle?: string;
  structureId?: string;
  structureName?: string;
  defaultSearchQuery?: string;
  defaultCategory?: Asset3DCategory;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  preloadedAssets?: Asset3DItem[];
  onAssetsMutated?: () => void;
}

export default function Academic3DContentPanel({
  workspaceDepartment,
  departmentId,
  syllabusId,
  course = 'B.Pharm',
  subjectCode,
  subjectTitle,
  unitId,
  unitNo,
  unitTitle,
  topicId,
  topicTitle,
  subtopics = [],
  selectedSubtopic = null,
  learningObjective,
  subjectObjectives = [],
  learningDomainMode,
  linkedStructureIds = [],
  experimentId,
  experimentTitle,
  structureId,
  structureName,
  defaultSearchQuery,
  defaultCategory = 'anatomy',
  title = '3D Scientific Models & Apparatus',
  subtitle,
  compact = false,
  preloadedAssets,
  onAssetsMutated
}: Academic3DContentPanelProps) {
  const { openAsset3DEngine, openAcademicExplorer } = useLibraryNavigation();

  const resolvedDept: BPharmDepartmentId =
    departmentId || mapWorkspaceDeptToBPharmDept(workspaceDepartment);

  const [allAssets, setAllAssets] = useState<Asset3DItem[]>(preloadedAssets || []);
  const [customCategories, setCustomCategories] = useState<Custom3DCategory[]>([]);
  const [loading, setLoading] = useState(!preloadedAssets);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeSubtopicFilter, setActiveSubtopicFilter] = useState<string>('all');
  const [inlinePreviewOpen, setInlinePreviewOpen] = useState(false);
  const [inlinePreviewUrl, setInlinePreviewUrl] = useState<string | null>(null);
  const [inlinePreviewLoading, setInlinePreviewLoading] = useState(false);
  const [inlinePreviewError, setInlinePreviewError] = useState<string | null>(null);
  const [modalViewerAsset, setModalViewerAsset] = useState<Asset3DItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [nonSpatialExpanded, setNonSpatialExpanded] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const objectUrlRevokeRef = useRef<(() => void) | null>(null);

  const cleanupPreviewUrl = useCallback(() => {
    if (objectUrlRevokeRef.current) {
      objectUrlRevokeRef.current();
      objectUrlRevokeRef.current = null;
    }
    setInlinePreviewUrl(null);
    setInlinePreviewError(null);
  }, []);

  const refreshAssets = useCallback(async () => {
    setLoading(true);
    setCustomCategories(getCustom3DCategories());
    try {
      const list = await getAll3DAssets();
      setAllAssets(list);
    } catch {
      setAllAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (preloadedAssets) {
      setAllAssets(preloadedAssets);
      setCustomCategories(getCustom3DCategories());
      setLoading(false);
    } else {
      void refreshAssets();
    }
  }, [preloadedAssets, refreshAssets]);

  // Reset inline preview & filter when switching topic / unit / structure
  useEffect(() => {
    setActiveSubtopicFilter(selectedSubtopic || 'all');
    setInlinePreviewOpen(false);
    cleanupPreviewUrl();
    setStatusNotice(null);
  }, [subjectCode, unitNo, topicId, experimentId, structureId, selectedSubtopic, cleanupPreviewUrl]);

  useEffect(() => {
    return () => {
      cleanupPreviewUrl();
    };
  }, [cleanupPreviewUrl]);

  const { directLinks, verifiedContextualMatches } = useMemo(() => {
    return matchCurriculumAssetsSync(allAssets, {
      course,
      departmentId: resolvedDept,
      syllabusId,
      subjectCode,
      subjectTitle,
      unitId,
      unitNo,
      unitTitle,
      topicId,
      topicTitle,
      learningObjective,
      experimentId,
      experimentTitle,
      structureId,
      linkedStructureIds
    });
  }, [
    allAssets,
    course,
    resolvedDept,
    syllabusId,
    subjectCode,
    subjectTitle,
    unitId,
    unitNo,
    unitTitle,
    topicId,
    topicTitle,
    learningObjective,
    experimentId,
    experimentTitle,
    structureId,
    linkedStructureIds
  ]);

  const combinedMatches = useMemo(() => {
    const all = [...directLinks, ...verifiedContextualMatches];
    if (activeSubtopicFilter === 'all') return all;
    const needle = activeSubtopicFilter.trim().toLowerCase();
    return all.filter((m) =>
      m.matchedSubtopics.some((s) => s.trim().toLowerCase() === needle) ||
      m.asset.syllabusLinks.some(
        (l) => l.subtopicTitle && l.subtopicTitle.trim().toLowerCase() === needle
      )
    );
  }, [directLinks, verifiedContextualMatches, activeSubtopicFilter]);

  const subtopicOptions = useMemo(() => {
    const set = new Set<string>();
    subtopics.forEach((s) => {
      if (s.trim()) set.add(s.trim());
    });
    directLinks.forEach((m) => m.matchedSubtopics.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [subtopics, directLinks]);

  const activeMatch = useMemo(() => {
    if (combinedMatches.length === 0) return null;
    if (selectedAssetId) {
      const hit = combinedMatches.find((m) => m.asset.id === selectedAssetId);
      if (hit) return hit;
    }
    return combinedMatches[0];
  }, [combinedMatches, selectedAssetId]);

  const selectedAsset = activeMatch?.asset || null;

  const relatedModels = useMemo(() => {
    if (!selectedAsset) return [];
    const currentIds = new Set(combinedMatches.map((m) => m.asset.id));
    return getRelated3DModels(selectedAsset, allAssets, 4).filter(
      (r) => !currentIds.has(r.asset.id)
    );
  }, [selectedAsset, allAssets, combinedMatches]);

  const matchedAnatomyHints = useMemo(() => {
    if (!selectedAsset) return [];
    const ids = new Set<string>(linkedStructureIds);
    selectedAsset.syllabusLinks.forEach((l) => {
      if (l.structureId) ids.add(l.structureId);
    });
    return ANATOMY_CATALOG.filter((e) => ids.has(e.id));
  }, [selectedAsset, linkedStructureIds]);

  // Load binary or remote URL ONLY when user explicitly opens inline preview
  useEffect(() => {
    if (!inlinePreviewOpen || !selectedAsset) {
      cleanupPreviewUrl();
      return;
    }

    let cancelled = false;
    cleanupPreviewUrl();
    setInlinePreviewLoading(true);
    setInlinePreviewError(null);

    if (selectedAsset.hasBinaryBlob) {
      get3DModelObjectUrl(selectedAsset.id, selectedAsset.binaryRefAssetId)
        .then((res) => {
          if (cancelled) {
            res?.revoke();
            return;
          }
          if (!res) {
            setInlinePreviewError('Stored 3D binary could not be loaded from IndexedDB.');
          } else {
            objectUrlRevokeRef.current = res.revoke;
            setInlinePreviewUrl(res.url);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setInlinePreviewError('Unable to decode stored 3D file for preview.');
          }
        })
        .finally(() => {
          if (!cancelled) setInlinePreviewLoading(false);
        });
    } else if (
      selectedAsset.externalFileUrl &&
      /^https?:\/\//i.test(selectedAsset.externalFileUrl)
    ) {
      setInlinePreviewUrl(selectedAsset.externalFileUrl);
      setInlinePreviewLoading(false);
    } else {
      setInlinePreviewLoading(false);
      setInlinePreviewError('Metadata-only asset: attach a GLB/STL file to preview in 3D.');
    }

    return () => {
      cancelled = true;
    };
  }, [inlinePreviewOpen, selectedAsset, cleanupPreviewUrl]);

  const handleUnlink = async (assetId: string, linkIds: string[]) => {
    if (linkIds.length === 0) return;
    setUnlinkingId(assetId);
    try {
      for (const linkId of linkIds) {
        await removeSyllabusAssociation(assetId, linkId);
      }
      setInlinePreviewOpen(false);
      cleanupPreviewUrl();
      await refreshAssets();
      onAssetsMutated?.();
      setStatusNotice('Unlinked from this curriculum context (3D model kept in Library).');
    } finally {
      setUnlinkingId(null);
    }
  };

  const initialUploadContext: Asset3DInitialContext = {
    departmentId: resolvedDept,
    course,
    subjectCode,
    subjectTitle,
    unitNo,
    topicId,
    topicTitle,
    experimentId,
    experimentTitle,
    structureId,
    structureName,
    defaultTitle: structureName || topicTitle || experimentTitle || subjectTitle || '',
    defaultCategory
  };

  const discoverQuery =
    defaultSearchQuery ||
    structureName ||
    topicTitle ||
    experimentTitle ||
    subjectTitle ||
    'pharmacy scientific 3d';

  const isNonSpatialDomain =
    learningDomainMode === 'computing_pk' || learningDomainMode === 'psychology_comm';

  // Do not force 3D onto non-spatial/abstract topics unless models are explicitly linked
  if (isNonSpatialDomain && directLinks.length === 0 && verifiedContextualMatches.length === 0 && !nonSpatialExpanded) {
    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>3D models are optional for this theoretical/computational topic.</span>
        </span>
        <button
          type="button"
          onClick={() => setNonSpatialExpanded(true)}
          className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          <Link2 className="w-3 h-3" />
          <span>Link a 3D Model Anyway</span>
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label={title}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl ${
        compact ? 'p-3.5 space-y-3' : 'p-4 sm:p-5 space-y-3.5'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {title} ({combinedMatches.length})
            </span>
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Link from Library</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openAsset3DEngine({
                tab: 'discover',
                query: discoverQuery,
                department: resolvedDept
              })
            }
            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Discover 3D</span>
          </button>

          {!compact && (
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Attach 3D</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtopic Filter Pills (only when topic has subtopics or subtopic links) */}
      {subtopicOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubtopicFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
              activeSubtopicFilter === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            All ({directLinks.length + verifiedContextualMatches.length})
          </button>
          {subtopicOptions.map((subLabel) => {
            const count = [...directLinks, ...verifiedContextualMatches].filter((m) =>
              m.matchedSubtopics.some((s) => s.toLowerCase() === subLabel.toLowerCase()) ||
              m.asset.syllabusLinks.some(
                (l) => l.subtopicTitle && l.subtopicTitle.toLowerCase() === subLabel.toLowerCase()
              )
            ).length;
            const active = activeSubtopicFilter.toLowerCase() === subLabel.toLowerCase();
            return (
              <button
                key={subLabel}
                type="button"
                onClick={() => setActiveSubtopicFilter(active ? 'all' : subLabel)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors max-w-[240px] truncate ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                }`}
                title={subLabel}
              >
                {subLabel}
                {count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      )}

      {statusNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{statusNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-[11px] font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Body Content */}
      {loading ? (
        <div className="h-16 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-500 gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          <span>Checking linked curriculum 3D assets...</span>
        </div>
      ) : combinedMatches.length === 0 ? (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>
            {activeSubtopicFilter !== 'all' ? (
              <>
                No 3D model is linked specifically to subtopic{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeSubtopicFilter}
                </strong>{' '}
                yet.
              </>
            ) : (
              <>
                No 3D model is linked to{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {structureName || topicTitle || experimentTitle || unitNo || subjectTitle || 'this topic'}
                </strong>{' '}
                yet. Link a stored model or discover open-source assets.
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() =>
              openAsset3DEngine({
                tab: 'library',
                department: resolvedDept
              })
            }
            className="text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap inline-flex items-center gap-0.5 hover:underline"
          >
            <span>Open 3D Library</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Multi-Model Selector Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {combinedMatches.map((match) => {
              const item = match.asset;
              const isSelected = selectedAsset?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (selectedAssetId !== item.id) {
                      setInlinePreviewOpen(false);
                      cleanupPreviewUrl();
                    }
                    setSelectedAssetId(item.id);
                  }}
                  className={`group p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
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
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.format.toUpperCase()} · {get3DCategoryLabel(item.category, customCategories)}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                      {match.matchSource === 'direct_link'
                        ? match.matchReasons[0] || 'Directly Linked'
                        : match.matchReasons[0] || 'Verified Structure Match'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Model Academic Inspector Card */}
          {selectedAsset && activeMatch && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        activeMatch.matchSource === 'direct_link'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {activeMatch.matchSource === 'direct_link'
                        ? 'Linked Curriculum Model'
                        : 'Verified Syllabus Context'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {selectedAsset.format.toUpperCase()}
                      {selectedAsset.byteSize ? ` · ${formatBytes(selectedAsset.byteSize)}` : ''}
                      {selectedAsset.license ? ` · ${selectedAsset.license}` : ''}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedAsset.name}
                  </h4>
                  {selectedAsset.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {selectedAsset.description}
                    </p>
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {getAsset3DAvailability(selectedAsset).canOpenViewer && (
                    <button
                      type="button"
                      onClick={() => setInlinePreviewOpen((v) => !v)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        inlinePreviewOpen
                          ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      {inlinePreviewOpen ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide Preview</span>
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Interactive Preview</span>
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}

                  {getAsset3DAvailability(selectedAsset).canOpenViewer && (
                    <button
                      type="button"
                      onClick={() => setModalViewerAsset(selectedAsset)}
                      className="min-h-[34px] min-w-[34px] px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center"
                      title="Quick inspect in modal viewer"
                      aria-label="Quick inspect in modal viewer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      openAcademicExplorer({
                        assetId: selectedAsset.id,
                        subjectCode,
                        topicId,
                        structureName
                      })
                    }
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Open in 3D Explorer</span>
                  </button>

                  {activeMatch.matchSource === 'direct_link' &&
                    activeMatch.matchingLinkIds.length > 0 && (
                      <button
                        type="button"
                        disabled={unlinkingId === selectedAsset.id}
                        onClick={() =>
                          void handleUnlink(selectedAsset.id, activeMatch.matchingLinkIds)
                        }
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1"
                        title="Remove curriculum link only (model binary remains in 3D Library)"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Unlink</span>
                      </button>
                    )}
                </div>
              </div>

              {/* Match Reasons & Academic Context Tags */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {activeMatch.matchReasons.map((reason) => (
                  <span
                    key={reason}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1"
                  >
                    <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{reason}</span>
                  </span>
                ))}
                {selectedAsset.annotations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{selectedAsset.annotations.length} study pin(s)</span>
                  </span>
                )}
              </div>

              {/* Verified Anatomy / Topic Component Notes when available */}
              {matchedAnatomyHints.length > 0 && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      Syllabus Structural Reference: {matchedAnatomyHints[0].name} (
                      {matchedAnatomyHints[0].system})
                    </span>
                  </p>
                  {matchedAnatomyHints[0].components.length > 0 && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Key inspectable components:{' '}
                      {matchedAnatomyHints[0].components
                        .slice(0, 4)
                        .map((c) => c.name)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {/* Lazy Embedded Interactive 3D Viewport (ONLY mounts when user clicks Interactive Preview) */}
              {inlinePreviewOpen && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                  {inlinePreviewLoading ? (
                    <div className="h-[240px] flex items-center justify-center gap-2 text-xs text-slate-300">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Loading 3D geometry from local library...</span>
                    </div>
                  ) : inlinePreviewError || !inlinePreviewUrl ? (
                    <div className="h-[180px] p-4 flex flex-col items-center justify-center text-center gap-2 text-xs text-amber-300">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <p>{inlinePreviewError || 'Preview unavailable for this file.'}</p>
                    </div>
                  ) : (
                    <Universal3DViewer
                      key={`${selectedAsset.id}_${inlinePreviewUrl}`}
                      asset={selectedAsset}
                      modelUrl={inlinePreviewUrl}
                      modelFormat={selectedAsset.format}
                      annotations={selectedAsset.annotations}
                      hideBuiltInHeader
                      hideBuiltInSidebars
                      className="h-[260px] sm:h-[310px]"
                    />
                  )}
                </div>
              )}

              {/* Verified Related Models Strip */}
              {relatedModels.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Related 3D Models in Library</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {relatedModels.map((rel) => (
                      <button
                        key={rel.asset.id}
                        type="button"
                        onClick={() =>
                          openAcademicExplorer({
                            assetId: rel.asset.id,
                            subjectCode,
                            topicId,
                            structureName
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                        title={rel.reasons.join(' · ')}
                      >
                        <Box className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold truncate max-w-[160px]">
                          {rel.asset.name}
                        </span>
                        <span className="text-slate-400 truncate max-w-[140px]">
                          · {rel.primaryReason}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ModelViewerModal
        asset={modalViewerAsset}
        onClose={() => setModalViewerAsset(null)}
        onAssetUpdated={(updated) => {
          setAllAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          onAssetsMutated?.();
        }}
        onAssetDeleted={(id) => {
          setAllAssets((prev) => prev.filter((a) => a.id !== id));
          onAssetsMutated?.();
        }}
      />

      <Asset3DLibraryPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onLinked={() => {
          void refreshAssets();
          onAssetsMutated?.();
          setStatusNotice('Linked 3D model to this curriculum context without duplicating files.');
        }}
        departmentId={resolvedDept}
        course={course}
        syllabusId={syllabusId}
        subjectCode={subjectCode}
        subjectTitle={subjectTitle}
        unitId={unitId}
        unitNo={unitNo}
        unitTitle={unitTitle}
        topicId={topicId}
        topicTitle={topicTitle}
        subtopics={subtopics}
        selectedSubtopic={activeSubtopicFilter !== 'all' ? activeSubtopicFilter : selectedSubtopic || undefined}
        subjectObjectives={subjectObjectives}
        learningObjective={learningObjective}
        experimentId={experimentId}
        experimentTitle={experimentTitle}
        structureId={structureId}
        structureName={structureName}
        linkedAssetIds={directLinks.map((m) => m.asset.id)}
      />

      <Asset3DUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSaved={() => {
          void refreshAssets();
          onAssetsMutated?.();
        }}
        initialContext={initialUploadContext}
      />
    </section>
  );
}
