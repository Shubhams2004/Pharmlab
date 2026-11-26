import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Box,
  Compass,
  Eye,
  Focus,
  Globe,
  Images,
  Link2,
  Loader2,
  Maximize2,
  RotateCcw,
  Upload
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import {
  get3DModelObjectUrl,
  getAll3DAssets,
  getCustom3DCategories,
  save3DAssetThumbnail
} from '../assets-3d/asset3dDb';
import Asset3DLibraryPickerModal from '../assets-3d/Asset3DLibraryPickerModal';
import Asset3DUploadModal from '../assets-3d/Asset3DUploadModal';
import {
  Analyzed3DComponent,
  Asset3DItem,
  Custom3DCategory,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability,
  mapWorkspaceDeptToBPharmDept
} from '../assets-3d/types';
import Universal3DViewer, {
  DEFAULT_VIEWER_SETTINGS,
  Universal3DViewerHandle,
  ViewerRenderSettings
} from '../assets-3d/Universal3DViewer';
import { BUILT_IN_VISUALS } from '../visual-library/builtInVisuals';
import VisualThumbnail from '../visual-library/VisualThumbnail';
import { match3DAssetsForExperiment } from './experiments';
import { ExperimentDefinition } from './types';

interface Experiment3DStageProps {
  experiment: ExperimentDefinition;
  compact?: boolean;
  onLinkedAssetsChange?: (assetIds: string[]) => void;
}

export default function Experiment3DStage({
  experiment,
  compact = false,
  onLinkedAssetsChange
}: Experiment3DStageProps) {
  const { openAcademicExplorer, openAsset3DEngine, openVisualLibrary } = useLibraryNavigation();

  const [allAssets, setAllAssets] = useState<Asset3DItem[]>([]);
  const [customCategories, setCustomCategories] = useState<Custom3DCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [components, setComponents] = useState<Analyzed3DComponent[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [isolatedCompId, setIsolatedCompId] = useState<string | null>(null);
  const [renderSettings, setRenderSettings] = useState<ViewerRenderSettings>({
    ...DEFAULT_VIEWER_SETTINGS,
    showGrid: true,
    backgroundMode: 'slate_dark'
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const viewerRef = useRef<Universal3DViewerHandle | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);

  const primaryBinding = experiment.asset3dBindings[0];
  const mappedDept = mapWorkspaceDeptToBPharmDept(experiment.department);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setCustomCategories(getCustom3DCategories());
    try {
      const assets = await getAll3DAssets();
      setAllAssets(assets);
    } catch {
      setAllAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets, experiment.id]);

  const matchedEntries = useMemo(
    () => match3DAssetsForExperiment(experiment, allAssets),
    [experiment, allAssets]
  );

  useEffect(() => {
    onLinkedAssetsChange?.(matchedEntries.map((m) => m.asset.id));
  }, [matchedEntries, onLinkedAssetsChange]);

  useEffect(() => {
    if (matchedEntries.length === 0) {
      setSelectedAssetId(null);
      return;
    }
    if (!selectedAssetId || !matchedEntries.some((m) => m.asset.id === selectedAssetId)) {
      setSelectedAssetId(matchedEntries[0].asset.id);
    }
  }, [matchedEntries, selectedAssetId]);

  const activeEntry = useMemo(
    () => matchedEntries.find((m) => m.asset.id === selectedAssetId) || matchedEntries[0] || null,
    [matchedEntries, selectedAssetId]
  );

  const activeAsset = activeEntry?.asset || null;
  const activeAvailability = useMemo(
    () => (activeAsset ? getAsset3DAvailability(activeAsset) : null),
    [activeAsset]
  );

  const fallbackVisual = useMemo(() => {
    const visId = primaryBinding?.fallbackVisualId;
    return visId ? BUILT_IN_VISUALS.find((v) => v.id === visId) || null : null;
  }, [primaryBinding]);

  useEffect(() => {
    if (revokeRef.current) {
      revokeRef.current();
      revokeRef.current = null;
    }
    setModelUrl(null);
    setUrlError(null);
    setComponents([]);
    setSelectedCompId(null);
    setIsolatedCompId(null);

    if (!activeAsset || !activeAvailability?.canOpenViewer) {
      setUrlLoading(false);
      return;
    }

    let cancelled = false;
    setUrlLoading(true);
    (async () => {
      try {
        if (activeAsset.hasBinaryBlob) {
          const res = await get3DModelObjectUrl(activeAsset.id, activeAsset.binaryRefAssetId);
          if (cancelled) {
            res?.revoke();
            return;
          }
          if (res) {
            revokeRef.current = res.revoke;
            setModelUrl(res.url);
          } else {
            setUrlError('Binary 3D file could not be read from local IndexedDB storage.');
          }
        } else if (activeAsset.externalFileUrl) {
          setModelUrl(activeAsset.externalFileUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setUrlError(err instanceof Error ? err.message : 'Failed to load 3D model.');
        }
      } finally {
        if (!cancelled) setUrlLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (revokeRef.current) {
        revokeRef.current();
        revokeRef.current = null;
      }
    };
  }, [activeAsset?.id, activeAvailability?.canOpenViewer]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Integrated 3D Apparatus &amp; Scientific Models
          </p>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {primaryBinding?.roleLabel || 'Experiment 3D Apparatus'}
          </h3>
          {primaryBinding?.description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {primaryBinding.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Link from 3D Library</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Upload 3D Model</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openAsset3DEngine({
                tab: 'discover',
                query: primaryBinding?.matchKeywords[0] || experiment.shortTitle,
                department: mappedDept
              })
            }
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Discover 3D</span>
          </button>
        </div>
      </div>

      {/* Matched Asset Selector Strip when > 1 asset */}
      {matchedEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {matchedEntries.map((entry) => {
            const isSelected = entry.asset.id === activeAsset?.id;
            return (
              <button
                key={entry.asset.id}
                type="button"
                onClick={() => setSelectedAssetId(entry.asset.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                }`}
              >
                <Box className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[180px]">{entry.asset.name}</span>
                <span className="text-[11px] opacity-80 uppercase">{entry.asset.format}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="h-56 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Checking PharmaLab 3D Asset Library...</span>
        </div>
      ) : activeAsset && activeAvailability?.canOpenViewer ? (
        <div className="space-y-3">
          {/* Quick 3D Viewport Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['solid', 'wireframe', 'xray'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setRenderSettings((prev) => ({
                      ...prev,
                      renderMode: mode,
                      wireframe: mode === 'wireframe'
                    }))
                  }
                  className={`px-2.5 py-1.5 rounded-lg border font-medium capitalize transition-colors ${
                    renderSettings.renderMode === mode
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mode === 'xray' ? 'X-Ray' : mode}
                </button>
              ))}
              <button
                type="button"
                onClick={() => viewerRef.current?.fitToViewport()}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 inline-flex items-center gap-1"
              >
                <Focus className="w-3.5 h-3.5" />
                <span>Fit</span>
              </button>
              <button
                type="button"
                onClick={() => viewerRef.current?.restoreAllComponents()}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Parts</span>
              </button>
              <button
                type="button"
                onClick={() => void viewerRef.current?.toggleFullscreen()}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 inline-flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                openAcademicExplorer({
                  assetId: activeAsset.id,
                  subjectCode: experiment.academicContext.studyModeSubjectCode
                })
              }
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open in Academic 3D Explorer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div
              className={`${
                compact ? 'h-64' : 'h-[360px]'
              } lg:col-span-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 relative`}
            >
              {urlLoading ? (
                <div className="w-full h-full flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Loading 3D binary from IndexedDB...</span>
                </div>
              ) : urlError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-5 h-5" />
                  <span>{urlError}</span>
                </div>
              ) : modelUrl ? (
                <Universal3DViewer
                  ref={viewerRef}
                  asset={activeAsset}
                  modelUrl={modelUrl}
                  modelFormat={activeAsset.format}
                  annotations={activeAsset.annotations}
                  hideBuiltInHeader={true}
                  hideBuiltInSidebars={true}
                  renderSettings={renderSettings}
                  onRenderSettingsChange={setRenderSettings}
                  selectedComponentId={selectedCompId}
                  onSelectComponent={setSelectedCompId}
                  isolatedComponentId={isolatedCompId}
                  onIsolateChange={setIsolatedCompId}
                  onComponentsChange={setComponents}
                  onThumbnailCaptured={(dataUrl) => {
                    void save3DAssetThumbnail(activeAsset.id, dataUrl);
                  }}
                />
              ) : null}
            </div>

            <div className="lg:col-span-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 overflow-y-auto max-h-[360px]">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {activeAsset.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {get3DCategoryLabel(activeAsset.category, customCategories)} ·{' '}
                  {activeAsset.format.toUpperCase()} · {formatBytes(activeAsset.byteSize)}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {activeEntry?.reason}
                </p>
              </div>

              {components.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Structures / Meshes ({components.length})
                  </p>
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {components.slice(0, 24).map((comp) => (
                      <div
                        key={comp.id}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border text-xs ${
                          selectedCompId === comp.id
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCompId(comp.id);
                            viewerRef.current?.focusComponent(comp.id);
                          }}
                          className="truncate text-left flex-1 font-medium"
                        >
                          {comp.name}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setIsolatedCompId((prev) => (prev === comp.id ? null : comp.id))
                          }
                          className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0 inline-flex items-center gap-0.5"
                          title="Isolate structure"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isolatedCompId === comp.id ? 'All' : 'Iso'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {fallbackVisual && (
            <div className="md:col-span-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <VisualThumbnail
                item={fallbackVisual}
                className="w-full h-40"
                imgClassName="w-full h-full object-cover"
              />
            </div>
          )}
          <div className={`${fallbackVisual ? 'md:col-span-8' : 'md:col-span-12'} space-y-2.5`}>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {activeAsset
                ? `"${activeAsset.name}" is metadata-only (no local 3D binary stored yet)`
                : 'No 3D apparatus model currently linked in your local 3D Asset Library'}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This interactive simulation runs fully offline with its mathematical solver and 2D schematic canvas. To inspect a 3D GLB, glTF, STL, OBJ, or PDB apparatus model inside this experiment, link an existing asset, upload a local file, or import one from Scientific 3D Discovery.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {fallbackVisual && (
                <button
                  type="button"
                  onClick={() => openVisualLibrary({ visualId: fallbackVisual.id })}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <Images className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Inspect Annotated Plate ({fallbackVisual.title})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Add 3D Model (.glb / .stl / .pdb)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Asset3DLibraryPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onLinked={() => {
          setPickerOpen(false);
          void loadAssets();
        }}
        departmentId={mappedDept}
        course={experiment.academicContext.course}
        subjectCode={experiment.academicContext.studyModeSubjectCode || experiment.academicContext.subjectCode}
        subjectTitle={experiment.academicContext.subjectTitle}
        unitNo={experiment.academicContext.unit}
        topicTitle={experiment.academicContext.topic}
        experimentId={experiment.id}
        experimentTitle={experiment.title}
        linkedAssetIds={matchedEntries.map((m) => m.asset.id)}
      />

      <Asset3DUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSaved={() => {
          setUploadOpen(false);
          void loadAssets();
        }}
        initialContext={{
          departmentId: mappedDept,
          course: experiment.academicContext.course,
          subjectCode: experiment.academicContext.studyModeSubjectCode || experiment.academicContext.subjectCode,
          subjectTitle: experiment.academicContext.subjectTitle,
          unitNo: experiment.academicContext.unit,
          topicTitle: experiment.academicContext.topic,
          experimentId: experiment.id,
          experimentTitle: experiment.title,
          defaultCategory: primaryBinding?.categoryHints[0] || 'pharma_equipment',
          defaultTags: primaryBinding?.matchKeywords.slice(0, 4)
        }}
      />
    </div>
  );
}
