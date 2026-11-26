import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  EyeOff,
  Focus,
  Layers,
  Link2,
  Loader2,
  Maximize2,
  Microscope,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Unlink,
  Wrench
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { DepartmentId } from '../visual-library/types';
import {
  get3DModelObjectUrl,
  getAll3DAssets,
  removeSyllabusAssociation
} from './asset3dDb';
import Asset3DLibraryPickerModal from './Asset3DLibraryPickerModal';
import Asset3DUploadModal from './Asset3DUploadModal';
import {
  ApparatusExplorationProfile,
  APPARATUS_PROFILES,
  Experiment3DMatch,
  ExperimentCatalogEntry,
  ExperimentStepSpec,
  getApparatusProfile,
  getExperimentById,
  getExperimentForWorkspace,
  matchExperimentAssetsSync,
  resolveApparatusForExperiment
} from './experimentCatalog';
import ModelViewerModal from './ModelViewerModal';
import {
  Analyzed3DComponent,
  Asset3DItem,
  BPharmDepartmentId,
  EXPERIMENT_ROLE_LABELS,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability
} from './types';
import Universal3DViewer, { Universal3DViewerHandle } from './Universal3DViewer';

export interface Experiment3DPanelProps {
  department: DepartmentId | BPharmDepartmentId;
  experimentId?: string;
  experimentTitle?: string;
  experimentTab?: string;
  subjectCode?: string;
  unitNo?: string;
  topicTitle?: string;
  activeStepId?: string;
  activeStepTitle?: string;
  experimentSteps?: ExperimentStepSpec[];
  defaultSearchQuery?: string;
  compact?: boolean;
  title?: string;
}

function mapDeptToBPharm(dept: DepartmentId | BPharmDepartmentId): BPharmDepartmentId {
  switch (dept) {
    case 'anatomy':
      return 'anatomy';
    case 'general_pharmacy':
      return 'pharmaceutics';
    case 'inorganic':
      return 'pharmaceutical_chemistry';
    case 'pharmacognosy':
      return 'pharmacognosy';
    case 'psychology':
      return 'clinical_pharmacy';
    case 'python':
    case 'pandas':
      return 'research';
    default:
      return dept as BPharmDepartmentId;
  }
}

export default function Experiment3DPanel({
  department,
  experimentId,
  experimentTitle,
  experimentTab,
  subjectCode,
  unitNo,
  topicTitle,
  activeStepId,
  activeStepTitle,
  experimentSteps,
  defaultSearchQuery,
  compact = false,
  title
}: Experiment3DPanelProps) {
  const { openAcademicExplorer, openAsset3DEngine } = useLibraryNavigation();

  const bpharmDept = useMemo(() => mapDeptToBPharm(department), [department]);

  const catalogExp: ExperimentCatalogEntry | null = useMemo(() => {
    return (
      getExperimentById(experimentId) ||
      getExperimentForWorkspace(String(department), experimentTab) ||
      getExperimentById(experimentTitle)
    );
  }, [experimentId, department, experimentTab, experimentTitle]);

  const resolvedExpId = catalogExp?.id || experimentId;
  const resolvedExpTitle = catalogExp?.title || experimentTitle || topicTitle || 'Laboratory Practical';
  const resolvedExpTab = catalogExp?.tab || experimentTab;
  const resolvedSubjectCode = subjectCode || catalogExp?.subjectCode;
  const resolvedSteps = useMemo(
    () => (experimentSteps?.length ? experimentSteps : catalogExp?.steps || []),
    [experimentSteps, catalogExp]
  );

  const activeStepObj = useMemo(() => {
    if (!activeStepId && !activeStepTitle) return null;
    return (
      resolvedSteps.find(
        (s) =>
          (activeStepId && s.id === activeStepId) ||
          (activeStepTitle && s.title.toLowerCase() === activeStepTitle.toLowerCase())
      ) || null
    );
  }, [resolvedSteps, activeStepId, activeStepTitle]);

  const resolvedApparatus = useMemo(
    () => resolveApparatusForExperiment(catalogExp, activeStepId),
    [catalogExp, activeStepId]
  );
  const apparatusProfiles = resolvedApparatus.primaryApparatus;

  const [allAssets, setAllAssets] = useState<Asset3DItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [stepFocusOnly, setStepFocusOnly] = useState(false);

  // Lazy inline 3D preview state (decodes binary strictly on demand)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRevokeRef = useRef<(() => void) | null>(null);
  const viewerRef = useRef<Universal3DViewerHandle | null>(null);

  // Lightweight structure selection / isolation inside the inline preview
  const [components, setComponents] = useState<Analyzed3DComponent[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [isolatedCompIds, setIsolatedCompIds] = useState<string[]>([]);
  const pendingFocusKeywordRef = useRef<string | null>(null);

  // Expandable Apparatus & Setup details
  const [showSetupDetails, setShowSetupDetails] = useState(!compact);
  const [activeApparatusId, setActiveApparatusId] = useState<string | null>(null);

  // Modals (reused directly from Asset Library / Engine)
  const [modalAsset, setModalAsset] = useState<Asset3DItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const refreshAssets = useCallback(() => {
    let cancelled = false;
    setLoadingAssets(true);
    getAll3DAssets()
      .then((list) => {
        if (!cancelled) setAllAssets(list);
      })
      .catch(() => {
        if (!cancelled) setAllAssets([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssets(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return refreshAssets();
  }, [refreshAssets]);

  const allMatches: Experiment3DMatch[] = useMemo(() => {
    return matchExperimentAssetsSync(allAssets, {
      experimentId: resolvedExpId,
      experimentTitle: resolvedExpTitle,
      experimentTab: resolvedExpTab,
      stepId: activeStepObj?.id || activeStepId,
      stepTitle: activeStepObj?.title || activeStepTitle,
      subjectCode: resolvedSubjectCode,
      departmentId: bpharmDept,
      topicTitle,
      onlyActiveStep: false
    });
  }, [
    allAssets,
    resolvedExpId,
    resolvedExpTitle,
    resolvedExpTab,
    activeStepObj,
    activeStepId,
    activeStepTitle,
    resolvedSubjectCode,
    bpharmDept,
    topicTitle
  ]);

  const displayedMatches = useMemo(() => {
    if (!stepFocusOnly || (!activeStepObj && !activeStepId && !activeStepTitle)) {
      return allMatches;
    }
    const stepOnly = allMatches.filter((m) => m.matchScope === 'step_direct');
    return stepOnly.length > 0 ? stepOnly : allMatches;
  }, [allMatches, stepFocusOnly, activeStepObj, activeStepId, activeStepTitle]);

  const stepMatchCount = useMemo(
    () => allMatches.filter((m) => m.matchScope === 'step_direct').length,
    [allMatches]
  );

  // Keep selected asset valid as list or active step changes
  useEffect(() => {
    if (displayedMatches.length === 0) {
      setSelectedAssetId(null);
      return;
    }
    if (!selectedAssetId || !displayedMatches.some((m) => m.asset.id === selectedAssetId)) {
      setSelectedAssetId(displayedMatches[0].asset.id);
    }
  }, [displayedMatches, selectedAssetId]);

  // Keep selected apparatus profile synced cleanly
  useEffect(() => {
    if (apparatusProfiles.length === 0) {
      setActiveApparatusId(null);
      return;
    }
    if (!activeApparatusId || !apparatusProfiles.some((p) => p.id === activeApparatusId)) {
      setActiveApparatusId(apparatusProfiles[0].id);
    }
  }, [apparatusProfiles, activeApparatusId]);

  const activeMatch = useMemo(
    () => displayedMatches.find((m) => m.asset.id === selectedAssetId) || displayedMatches[0] || null,
    [displayedMatches, selectedAssetId]
  );

  const cleanupPreviewUrl = useCallback(() => {
    if (previewRevokeRef.current) {
      previewRevokeRef.current();
      previewRevokeRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewError(null);
    setComponents([]);
    setSelectedCompId(null);
    setIsolatedCompIds([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupPreviewUrl();
  }, [cleanupPreviewUrl]);

  // Lazy binary resolution only when previewOpen === true
  useEffect(() => {
    if (!previewOpen || !activeMatch) {
      cleanupPreviewUrl();
      return;
    }

    const asset = activeMatch.asset;
    if (!activeMatch.health.ok) {
      cleanupPreviewUrl();
      setPreviewError(activeMatch.health.issueMessage || '3D binary reference unavailable.');
      return;
    }

    let cancelled = false;
    cleanupPreviewUrl();
    setPreviewLoading(true);
    pendingFocusKeywordRef.current =
      activeMatch.focusComponentName || activeStepObj?.focusKeyword || null;

    if (asset.hasBinaryBlob) {
      get3DModelObjectUrl(asset.id, asset.binaryRefAssetId)
        .then((res) => {
          if (cancelled) {
            res?.revoke();
            return;
          }
          if (!res) {
            setPreviewError('Stored 3D binary could not be decoded.');
          } else {
            previewRevokeRef.current = res.revoke;
            setPreviewUrl(res.url);
          }
        })
        .catch(() => {
          if (!cancelled) setPreviewError('Unable to decode stored 3D binary.');
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    } else if (asset.externalFileUrl && /^https?:\/\//i.test(asset.externalFileUrl)) {
      setPreviewUrl(asset.externalFileUrl);
      setPreviewLoading(false);
    } else {
      setPreviewError('Metadata-only 3D entry without attached geometry.');
      setPreviewLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [previewOpen, activeMatch, activeStepObj, cleanupPreviewUrl]);

  const handleComponentsChange = useCallback((comps: Analyzed3DComponent[]) => {
    setComponents(comps);
    const pending = pendingFocusKeywordRef.current;
    if (pending && comps.length > 0) {
      const q = pending.trim().toLowerCase();
      const hit =
        comps.find((c) => c.name.toLowerCase() === q) ||
        comps.find((c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()));
      if (hit) {
        setSelectedCompId(hit.id);
        setTimeout(() => {
          viewerRef.current?.focusComponent(hit.id);
        }, 120);
      }
      pendingFocusKeywordRef.current = null;
    }
  }, []);

  const handleOpenInExplorer = useCallback(
    (asset?: Asset3DItem, focusKeyword?: string) => {
      const selectedComp = components.find((c) => c.id === selectedCompId);
      openAcademicExplorer({
        assetId: asset?.id || activeMatch?.asset.id || null,
        subjectCode: resolvedSubjectCode || null,
        experimentId: resolvedExpId || null,
        experimentTitle: resolvedExpTitle || null,
        experimentTab: resolvedExpTab || null,
        stepId: activeStepObj?.id || activeStepId || null,
        stepTitle: activeStepObj?.title || activeStepTitle || null,
        focusComponentName:
          focusKeyword || selectedComp?.name || activeMatch?.focusComponentName || null,
        returnTab: resolvedExpTab || null
      });
    },
    [
      openAcademicExplorer,
      activeMatch,
      components,
      selectedCompId,
      resolvedSubjectCode,
      resolvedExpId,
      resolvedExpTitle,
      resolvedExpTab,
      activeStepObj,
      activeStepId,
      activeStepTitle
    ]
  );

  const handleUnlinkMatch = async (match: Experiment3DMatch) => {
    setUnlinkingId(match.asset.id);
    try {
      for (const linkId of match.matchingLinkIds) {
        await removeSyllabusAssociation(match.asset.id, linkId);
      }
      if (activeMatch?.asset.id === match.asset.id) {
        setPreviewOpen(false);
      }
      refreshAssets();
    } finally {
      setUnlinkingId(null);
    }
  };

  const activeApparatus: ApparatusExplorationProfile | null = useMemo(() => {
    if (!apparatusProfiles.length) return null;
    return (
      apparatusProfiles.find((p) => p.id === activeApparatusId) ||
      getApparatusProfile(activeApparatusId) ||
      apparatusProfiles[0]
    );
  }, [apparatusProfiles, activeApparatusId]);

  const effectiveSearchQuery =
    defaultSearchQuery ||
    activeStepObj?.focusKeyword ||
    catalogExp?.defaultSearchQuery ||
    resolvedExpTitle;

  const selectedComp = useMemo(
    () => components.find((c) => c.id === selectedCompId) || null,
    [components, selectedCompId]
  );

  const canUnlinkActive = Boolean(
    activeMatch &&
      (activeMatch.matchScope === 'step_direct' || activeMatch.matchScope === 'experiment_direct') &&
      activeMatch.matchingLinkIds.length > 0
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Microscope className="w-3.5 h-3.5" />
              <span>Interactive Experiment 3D Apparatus &amp; Setup</span>
            </span>
            {catalogExp?.code && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                {catalogExp.code}
              </span>
            )}
            {(activeStepObj || activeStepTitle) && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                Active Step: {activeStepObj?.title || activeStepTitle}
              </span>
            )}
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
            {title || resolvedExpTitle}
          </h4>
          {activeStepObj?.contextualNote && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeStepObj.contextualNote}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {stepMatchCount > 0 && (activeStepObj || activeStepTitle) && (
            <button
              type="button"
              onClick={() => setStepFocusOnly((v) => !v)}
              className={`min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                stepFocusOnly
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
              }`}
              title="Filter 3D assets specifically linked to this step vs entire experiment"
            >
              {stepFocusOnly
                ? `Step Focus (${stepMatchCount})`
                : `All Experiment (${allMatches.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Link 3D Model</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Attach GLB</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openAsset3DEngine({
                tab: 'discover',
                query: effectiveSearchQuery,
                department: bpharmDept
              })
            }
            className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Discover</span>
          </button>
        </div>
      </div>

      {/* Linked Experiment 3D Assets */}
      {loadingAssets ? (
        <div className="py-5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Checking linked 3D apparatus &amp; specimens...</span>
        </div>
      ) : displayedMatches.length === 0 ? (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No 3D apparatus or setup models linked to {resolvedExpTitle} yet.
            </p>
            <p>
              Link an existing model from the central 3D Asset Library or attach a GLB/STL file for interactive 3D inspection during this practical.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              openAcademicExplorer({
                subjectCode: resolvedSubjectCode || null,
                experimentId: resolvedExpId || null,
                experimentTitle: resolvedExpTitle || null,
                experimentTab: resolvedExpTab || null,
                stepId: activeStepObj?.id || activeStepId || null,
                stepTitle: activeStepObj?.title || activeStepTitle || null,
                returnTab: resolvedExpTab || null
              })
            }
            className="min-h-[34px] px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open 3D Explorer</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Multi-Asset Selector Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {displayedMatches.map((match) => {
              const isSelected = activeMatch?.asset.id === match.asset.id;
              const avail = getAsset3DAvailability(match.asset);
              return (
                <button
                  key={match.asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(match.asset.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-500/5 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {match.asset.thumbnailDataUrl || match.asset.thumbnailUrl ? (
                      <img
                        src={match.asset.thumbnailDataUrl || match.asset.thumbnailUrl}
                        alt={match.asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Box className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate">
                        {match.roleLabel}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                          match.matchScope === 'step_direct'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : match.matchScope === 'experiment_direct'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                            : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {match.matchScope === 'step_direct'
                          ? 'Step Match'
                          : match.matchScope === 'experiment_direct'
                          ? 'Experiment'
                          : 'Subject'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {match.asset.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                      {get3DCategoryLabel(match.asset.category)} · {match.asset.format.toUpperCase()}
                      {match.asset.byteSize ? ` · ${formatBytes(match.asset.byteSize)}` : ''}
                      {!avail.canOpenViewer ? ' · Metadata only' : ''}
                    </p>
                    {!match.health.ok && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{match.health.statusLabel}</span>
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Model Action Bar + Setup Note */}
          {activeMatch && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {activeMatch.asset.name}
                    </span>
                    {activeMatch.matchedStepTitles.length > 0 && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        Step: {activeMatch.matchedStepTitles[0]}
                      </span>
                    )}
                    {activeMatch.focusComponentName && (
                      <span className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
                        Focus part: {activeMatch.focusComponentName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {activeMatch.setupNotes[0] ||
                      activeMatch.matchReasons[0] ||
                      activeMatch.asset.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={!activeMatch.health.ok}
                    onClick={() => setPreviewOpen((v) => !v)}
                    className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors disabled:opacity-50 ${
                      previewOpen
                        ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/40'
                    }`}
                  >
                    {previewOpen ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span>{previewOpen ? 'Hide 3D Preview' : 'Inspect 3D Preview'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!activeMatch.health.ok}
                    onClick={() => setModalAsset(activeMatch.asset)}
                    className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 disabled:opacity-50"
                    title="Open quick modal viewer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Quick Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenInExplorer(activeMatch.asset)}
                    className="min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Open in 3D Explorer</span>
                  </button>

                  {canUnlinkActive && (
                    <button
                      type="button"
                      disabled={unlinkingId === activeMatch.asset.id}
                      onClick={() => void handleUnlinkMatch(activeMatch)}
                      className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-500/40 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1"
                      title="Remove experiment link only (keeps 3D asset stored in central library)"
                      aria-label={`Unlink ${activeMatch.asset.name} from experiment`}
                    >
                      {unlinkingId === activeMatch.asset.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unlink className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Unlink</span>
                    </button>
                  )}
                </div>
              </div>

              {!activeMatch.health.ok && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{activeMatch.health.issueMessage}</span>
                </div>
              )}

              {/* Lazy Interactive 3D Canvas (decoded strictly when opened) */}
              {previewOpen && (
                <div className="space-y-2 pt-1">
                  {previewLoading ? (
                    <div className="h-[260px] rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-300">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Loading 3D geometry from offline library...</span>
                    </div>
                  ) : previewError || !previewUrl ? (
                    <div className="h-[160px] rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2 text-xs text-amber-300 px-4 text-center">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{previewError || '3D binary unavailable.'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                        <Universal3DViewer
                          ref={viewerRef}
                          key={activeMatch.asset.id}
                          asset={activeMatch.asset}
                          modelUrl={previewUrl}
                          modelFormat={activeMatch.asset.format}
                          hideBuiltInHeader
                          hideBuiltInSidebars
                          selectedComponentId={selectedCompId}
                          onSelectComponent={(id) => setSelectedCompId(id)}
                          selectedComponentIds={selectedCompId ? [selectedCompId] : []}
                          onSelectComponents={(ids) => setSelectedCompId(ids[0] || null)}
                          isolatedComponentIds={isolatedCompIds}
                          onIsolateComponentsChange={setIsolatedCompIds}
                          onComponentsChange={handleComponentsChange}
                          className={compact ? 'h-[250px]' : 'h-[320px]'}
                        />
                      </div>

                      {/* Quick Component Inspection Bar (when multi-mesh) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          {components.length > 1 ? (
                            <>
                              <select
                                aria-label="Inspect model structure or part"
                                value={selectedCompId || ''}
                                onChange={(e) => {
                                  const nextId = e.target.value || null;
                                  setSelectedCompId(nextId);
                                  if (nextId) viewerRef.current?.focusComponent(nextId);
                                }}
                                className="min-h-[32px] max-w-[240px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                              >
                                <option value="">
                                  Select Structure ({components.length} parts)...
                                </option>
                                {components.map((comp) => (
                                  <option key={comp.id} value={comp.id}>
                                    {comp.name}
                                  </option>
                                ))}
                              </select>

                              {selectedComp && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => viewerRef.current?.focusComponent(selectedComp.id)}
                                    className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                                  >
                                    <Focus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Focus</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      viewerRef.current?.isolateComponents([selectedComp.id]);
                                      setIsolatedCompIds([selectedComp.id]);
                                    }}
                                    className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                                  >
                                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Isolate</span>
                                  </button>
                                </>
                              )}

                              {isolatedCompIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    viewerRef.current?.restoreAllComponents();
                                    setIsolatedCompIds([]);
                                  }}
                                  className="min-h-[32px] px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                                >
                                  Show All Parts
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Drag to rotate · Scroll/pinch to zoom · Right-drag to pan
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => viewerRef.current?.fitToViewport()}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset View</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Setup Visualization & Apparatus Exploration Section */}
      {(catalogExp?.setupParts?.length ||
        catalogExp?.setupFlow?.length ||
        apparatusProfiles.length > 0 ||
        allMatches.length >= 2) && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Apparatus Exploration &amp; Experimental Setup
                {apparatusProfiles.length > 0 ? ` (${apparatusProfiles.length})` : ''}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowSetupDetails((v) => !v)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline"
            >
              <span>{showSetupDetails ? 'Collapse Details' : 'Explore Apparatus & Setup'}</span>
              {showSetupDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showSetupDetails && (
            <div className="space-y-3">
              {/* Experiment Setup Overview & Multi-Model Assembly Map */}
              {(catalogExp?.setupSummary ||
                catalogExp?.setupParts?.length ||
                catalogExp?.setupFlow?.length ||
                allMatches.length >= 2) && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Experiment Setup Overview</span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Visual structural arrangement reference only
                    </span>
                  </div>

                  {catalogExp?.setupSummary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {catalogExp.setupSummary}
                    </p>
                  )}

                  {catalogExp?.setupParts && catalogExp.setupParts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {catalogExp.setupParts.map((part) => {
                        const relatedModel = displayedMatches.find((m) => {
                          const app = part.apparatusId
                            ? APPARATUS_PROFILES[part.apparatusId]
                            : undefined;
                          const hay = `${m.asset.name} ${m.asset.tags.join(' ')}`.toLowerCase();
                          return (
                            m.matchedRoles.includes(part.role) ||
                            Boolean(app?.searchKeywords.some((k) => hay.includes(k)))
                          );
                        });
                        return (
                          <div
                            key={part.id}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                {EXPERIMENT_ROLE_LABELS[part.role]}
                              </span>
                              {relatedModel && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAssetId(relatedModel.asset.id);
                                    setPreviewOpen(true);
                                  }}
                                  className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                                >
                                  Inspect 3D
                                </button>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {part.label}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                              {part.connectionNote}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {catalogExp?.setupFlow && catalogExp.setupFlow.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-700 dark:text-slate-300">
                      {catalogExp.setupFlow.map((stage, idx) => (
                        <React.Fragment key={stage}>
                          <span className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
                            {idx + 1}. {stage}
                          </span>
                          {idx < catalogExp.setupFlow!.length - 1 && (
                            <span className="text-slate-400 font-bold">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {allMatches.length >= 2 && (
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Multi-model arrangement:
                      </span>
                      {allMatches.map((m) => (
                        <button
                          key={m.asset.id}
                          type="button"
                          onClick={() => setSelectedAssetId(m.asset.id)}
                          className="underline decoration-dotted hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {m.asset.name} ({m.roleLabel})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Apparatus & Equipment Exploration */}
              {apparatusProfiles.length > 0 && activeApparatus && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  {apparatusProfiles.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {apparatusProfiles.map((prof) => (
                        <button
                          key={prof.id}
                          type="button"
                          onClick={() => setActiveApparatusId(prof.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            activeApparatus.id === prof.id
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                          }`}
                        >
                          {prof.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {activeApparatus.categoryLabel}
                      </p>
                      <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {activeApparatus.name}
                      </h5>
                    </div>
                    {activeMatch && (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenInExplorer(
                            activeMatch.asset,
                            activeApparatus.relevantParts?.[0] || activeMatch.focusComponentName
                          )
                        }
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Inspect in 3D Explorer</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Purpose:{' '}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {activeApparatus.purpose}
                        </span>
                      </div>

                      {activeApparatus.principle && (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Principle of Operation:{' '}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {activeApparatus.principle}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Experimental Role:{' '}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {activeApparatus.experimentalRole}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {activeApparatus.mainComponents &&
                        activeApparatus.mainComponents.length > 0 && (
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Main Components
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                              {activeApparatus.mainComponents.map((comp) => (
                                <li key={comp}>{comp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {activeApparatus.relevantParts &&
                        activeApparatus.relevantParts.length > 0 && (
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Key Inspection Parts
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {activeApparatus.relevantParts.map((part) => (
                                <button
                                  key={part}
                                  type="button"
                                  onClick={() => {
                                    if (activeMatch) {
                                      handleOpenInExplorer(activeMatch.asset, part);
                                    } else {
                                      openAsset3DEngine({
                                        tab: 'discover',
                                        query: part,
                                        department: bpharmDept
                                      });
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {part}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {activeApparatus.safetyConsiderations &&
                    activeApparatus.safetyConsiderations.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-1">
                        <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Safety &amp; Handling Considerations</span>
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-xs text-amber-900/90 dark:text-amber-200/90">
                          {activeApparatus.safetyConsiderations.map((rule) => (
                            <li key={rule}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {activeApparatus.relatedApparatusIds &&
                    activeApparatus.relatedApparatusIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Related Apparatus:
                        </span>
                        {activeApparatus.relatedApparatusIds.map((relId) => {
                          const rel = APPARATUS_PROFILES[relId];
                          if (!rel) return null;
                          const inThisExp = apparatusProfiles.some((p) => p.id === rel.id);
                          return (
                            <button
                              key={rel.id}
                              type="button"
                              onClick={() => {
                                if (inThisExp) {
                                  setActiveApparatusId(rel.id);
                                } else {
                                  openAsset3DEngine({
                                    tab: 'library',
                                    query: rel.searchKeywords[0] || rel.name,
                                    department: bpharmDept
                                  });
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 font-semibold text-slate-700 dark:text-slate-300"
                            >
                              {rel.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reused Quick Modal & Library / Upload Modals */}
      <ModelViewerModal
        asset={modalAsset}
        onClose={() => setModalAsset(null)}
        onAssetUpdated={() => refreshAssets()}
        onAssetDeleted={() => {
          setModalAsset(null);
          refreshAssets();
        }}
      />

      <Asset3DLibraryPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onLinked={(updated) => {
          setSelectedAssetId(updated.id);
          refreshAssets();
        }}
        departmentId={bpharmDept}
        subjectCode={resolvedSubjectCode}
        unitNo={unitNo}
        topicTitle={topicTitle}
        experimentId={resolvedExpId}
        experimentTitle={resolvedExpTitle}
        experimentTab={resolvedExpTab}
        experimentSteps={resolvedSteps}
        selectedStepId={activeStepObj?.id || activeStepId}
        selectedStepTitle={activeStepObj?.title || activeStepTitle}
        defaultExperimentRole={
          apparatusProfiles.length > 0 ? 'apparatus' : bpharmDept === 'anatomy' ? 'anatomy' : 'specimen'
        }
        linkedAssetIds={allMatches
          .filter((m) => m.matchScope === 'experiment_direct' || m.matchScope === 'step_direct')
          .map((m) => m.asset.id)}
      />

      <Asset3DUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSaved={(saved) => {
          setSelectedAssetId(saved.id);
          refreshAssets();
        }}
        initialContext={{
          departmentId: bpharmDept,
          subjectCode: resolvedSubjectCode,
          unitNo,
          topicTitle,
          experimentId: resolvedExpId,
          experimentTitle: resolvedExpTitle,
          experimentTab: resolvedExpTab,
          experimentRole: apparatusProfiles.length > 0 ? 'apparatus' : 'reference',
          stepId: activeStepObj?.id || activeStepId,
          stepTitle: activeStepObj?.title || activeStepTitle,
          defaultCategory: apparatusProfiles.length > 0 ? 'apparatus' : 'other'
        }}
      />
    </div>
  );
}
