import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  Bookmark,
  Box,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  FlaskConical,
  Focus,
  Globe,
  GraduationCap,
  Grid3X3,
  Info,
  Layers,
  Link2,
  Loader2,
  MapPin,
  Maximize,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Ruler,
  Scan,
  Scissors,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Star,
  Sun,
  Tag,
  Trash2,
  Upload,
  Wrench,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { getAllSyllabi } from '../study-mode/studyDb';
import { SyllabusProfile } from '../study-mode/types';
import Universal3DViewer, {
  DEFAULT_SECTIONING_STATE,
  DEFAULT_VIEWER_SETTINGS,
  Universal3DViewerHandle,
  ViewerLoadingState
} from './Universal3DViewer';
import {
  add3DAssetAnnotation,
  add3DMeasurement,
  add3DSavedView,
  addSyllabusAssociationSafe,
  clear3DMeasurements,
  get3DModelObjectUrl,
  getAll3DAssets,
  getCustom3DCategories,
  getRelated3DModels,
  mark3DAssetOpened,
  remove3DAssetAnnotation,
  remove3DMeasurement,
  remove3DSavedView,
  removeSyllabusAssociation,
  save3DAssetThumbnail,
  save3DScaleCalibration,
  toggle3DAssetFavorite,
  toggle3DMeasurementVisible,
  update3DAssetAnnotation,
  update3DAssetMeta
} from './asset3dDb';
import {
  analyzeModelCapabilities,
  buildGuidedIdentificationSteps,
  computeExplorerToolAvailability,
  computeModelScaleInfo,
  CPK_ELEMENT_LEGEND,
  formatMeasuredDistance,
  getExplorationProfile,
  inspectStructureComponent,
  isSupported3DFormat,
  resolveAssetAcademicContext
} from './explorerMetadata';
import {
  ALL_BPHARM_DEPARTMENTS,
  Analyzed3DComponent,
  Asset3DAnnotation,
  Asset3DItem,
  Asset3DMeasurement,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  CameraViewPreset,
  ClippingAxisKey,
  Custom3DCategory,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability,
  InteractionToolMode,
  ModelScaleCalibration,
  RenderVisualizationMode,
  SavedCameraView,
  SectioningState,
  SyllabusAssociation,
  ViewerRenderSettings
} from './types';

export interface AcademicExplorerJumpTarget {
  assetId?: string | null;
  subjectCode?: string | null;
  topicId?: string | null;
  structureName?: string | null;
  nonce: number;
}

interface Academic3DExplorerModuleProps {
  jumpTarget?: AcademicExplorerJumpTarget;
  onExitExplorer?: () => void;
  returnLabel?: string;
}

export default function Academic3DExplorerModule({
  jumpTarget,
  onExitExplorer,
  returnLabel = '3D Library'
}: Academic3DExplorerModuleProps) {
  const { openAsset3DEngine, openStudyMode, navigateToModule, recordActivity } =
    useLibraryNavigation();

  const workspaceRootRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Universal3DViewerHandle | null>(null);

  const [assets, setAssets] = useState<Asset3DItem[]>([]);
  const [customCategories, setCustomCategories] = useState<Custom3DCategory[]>([]);
  const [syllabi, setSyllabi] = useState<SyllabusProfile[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [resolvingBinary, setResolvingBinary] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState<ViewerLoadingState>({
    status: 'idle',
    percent: 0
  });
  const [isSoftwareGl, setIsSoftwareGl] = useState(false);

  // Explorer Workbench UI Panels & Presentation Mode
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [rightTab, setRightTab] = useState<'inspect' | 'tools' | 'academic' | 'info'>('inspect');
  const [lightingPopoverOpen, setLightingPopoverOpen] = useState(false);
  const [sectionPopoverOpen, setSectionPopoverOpen] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interactive 3D Inspection & P3.6 Tools State
  const [renderSettings, setRenderSettings] =
    useState<ViewerRenderSettings>(DEFAULT_VIEWER_SETTINGS);
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraViewPreset>('reset');
  const [interactionMode, setInteractionMode] = useState<InteractionToolMode>('inspect');
  const [sectioning, setSectioning] = useState<SectioningState>(DEFAULT_SECTIONING_STATE);

  const [components, setComponents] = useState<Analyzed3DComponent[]>([]);
  const [componentSearch, setComponentSearch] = useState('');
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [isolatedComponentIds, setIsolatedComponentIds] = useState<string[]>([]);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<[number, number, number] | undefined>(undefined);

  // Annotation Editing State
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [editPinLabel, setEditPinLabel] = useState('');
  const [editPinNote, setEditPinNote] = useState('');

  // Measurement & Coordinate Probe State
  const [hasPendingMeasurePoint, setHasPendingMeasurePoint] = useState(false);
  const [hoveredCoord, setHoveredCoord] = useState<{
    rawPoint: [number, number, number];
    componentName?: string;
  } | null>(null);
  const [clickedCoord, setClickedCoord] = useState<{
    rawPoint: [number, number, number];
    componentName?: string;
  } | null>(null);
  const [calibUnitSymbol, setCalibUnitSymbol] = useState<'mm' | 'cm' | 'm' | 'µm'>('mm');
  const [calibFactor, setCalibFactor] = useState('1');

  // Saved Camera View Draft
  const [newViewName, setNewViewName] = useState('');

  // Guided Identification Tour State
  const [guidedIndex, setGuidedIndex] = useState<number | null>(null);

  // Inline Curriculum Linker inside Academic Tab
  const [showInlineLinker, setShowInlineLinker] = useState(false);
  const [quickLinkDept, setQuickLinkDept] = useState<BPharmDepartmentId>('anatomy');
  const [quickLinkSubject, setQuickLinkSubject] = useState('');
  const [quickLinkTopicId, setQuickLinkTopicId] = useState('');
  const [quickLinkSubtopic, setQuickLinkSubtopic] = useState('');
  const [quickLinkNotice, setQuickLinkNotice] = useState<string | null>(null);

  const handledNonceRef = useRef<number>(-1);
  const selectedComponentId = selectedComponentIds[0] ?? null;

  const loadData = useCallback(async () => {
    setLoadingLibrary(true);
    setCustomCategories(getCustom3DCategories());
    try {
      const [assetList, sylList] = await Promise.all([getAll3DAssets(), getAllSyllabi()]);
      setAssets(assetList);
      setSyllabi(sylList);
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Select asset based on deep link or best compatible library item
  useEffect(() => {
    if (loadingLibrary) return;

    if (jumpTarget && jumpTarget.nonce > 0 && handledNonceRef.current !== jumpTarget.nonce) {
      handledNonceRef.current = jumpTarget.nonce;
      if (jumpTarget.assetId) {
        const hit = assets.find((a) => a.id === jumpTarget.assetId);
        if (hit) {
          setSelectedAssetId(hit.id);
          return;
        }
      }
      if (jumpTarget.topicId || jumpTarget.subjectCode || jumpTarget.structureName) {
        const match = assets.find((a) =>
          a.syllabusLinks.some(
            (l) =>
              (jumpTarget.topicId && l.topicId === jumpTarget.topicId) ||
              (jumpTarget.subjectCode &&
                l.subjectCode?.toLowerCase() === jumpTarget.subjectCode.toLowerCase()) ||
              (jumpTarget.structureName &&
                l.structureName?.toLowerCase().includes(jumpTarget.structureName.toLowerCase()))
          )
        );
        if (match) {
          setSelectedAssetId(match.id);
          return;
        }
      }
    }

    if (selectedAssetId && assets.some((a) => a.id === selectedAssetId)) return;
    if (assets.length === 0) {
      setSelectedAssetId(null);
      return;
    }

    const compatible = assets
      .filter((a) => getAsset3DAvailability(a).canOpenViewer && isSupported3DFormat(a.format))
      .sort((a, b) => (b.lastOpenedAt || b.updatedAt) - (a.lastOpenedAt || a.updatedAt));

    setSelectedAssetId((compatible[0] || assets[0]).id);
  }, [assets, loadingLibrary, jumpTarget, selectedAssetId]);

  const activeAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) || null,
    [assets, selectedAssetId]
  );

  // Sync calibration inputs & reset transient per-model tool state when switching asset
  useEffect(() => {
    setComponents([]);
    setSelectedComponentIds([]);
    setIsolatedComponentIds([]);
    setActivePinId(null);
    setEditingPinId(null);
    setInteractionMode('inspect');
    setSectioning(DEFAULT_SECTIONING_STATE);
    setHoveredCoord(null);
    setClickedCoord(null);
    setHasPendingMeasurePoint(false);
    setGuidedIndex(null);
    setComponentSearch('');
    setDimensions(undefined);

    if (!activeAsset) {
      setModelUrl(null);
      setResolveError(null);
      return;
    }

    if (
      activeAsset.scaleCalibration &&
      activeAsset.scaleCalibration.source === 'user_calibrated'
    ) {
      const sym = activeAsset.scaleCalibration.unitSymbol;
      if (sym === 'mm' || sym === 'cm' || sym === 'm' || sym === 'µm') {
        setCalibUnitSymbol(sym);
      }
      setCalibFactor(String(activeAsset.scaleCalibration.unitsPerModelUnit || 1));
    } else {
      setCalibUnitSymbol('mm');
      setCalibFactor('1');
    }

    let cancelled = false;
    let revokeFn: (() => void) | null = null;
    setResolvingBinary(true);
    setResolveError(null);
    setModelUrl(null);

    if (!isSupported3DFormat(activeAsset.format)) {
      setResolvingBinary(false);
      setResolveError(
        `Format ".${String(
          activeAsset.format
        ).toUpperCase()}" is not supported by the Academic 3D Explorer. Supported scientific formats: GLB, glTF, ZIP bundles, OBJ, STL, PLY, PDB, SDF, and MOL.`
      );
      return;
    }

    void mark3DAssetOpened(activeAsset.id).then((opened) => {
      if (!cancelled && opened) {
        setAssets((prev) => prev.map((a) => (a.id === opened.id ? opened : a)));
      }
    });

    recordActivity({
      key: `3d:${activeAsset.id}`,
      kind: 'model_3d',
      title: activeAsset.name,
      subtitle: `${activeAsset.format.toUpperCase()} · Academic 3D Explorer`,
      moduleId: 'explorer_3d',
      asset3dId: activeAsset.id
    });

    (async () => {
      try {
        if (activeAsset.hasBinaryBlob) {
          const obj = await get3DModelObjectUrl(activeAsset.id, activeAsset.binaryRefAssetId);
          if (cancelled) {
            obj?.revoke();
            return;
          }
          if (obj) {
            revokeFn = obj.revoke;
            setModelUrl(obj.url);
            setResolvingBinary(false);
            return;
          }
        }
        const safeExt = sanitizeHttpUrl(activeAsset.externalFileUrl);
        if (safeExt) {
          setModelUrl(safeExt);
          setResolvingBinary(false);
          return;
        }
        setResolveError(
          'This library record holds metadata only without an attached local 3D binary or direct file URL.'
        );
      } catch (err) {
        if (!cancelled) {
          setResolveError(
            err instanceof Error ? err.message : 'Unable to load 3D model binary from IndexedDB.'
          );
        }
      } finally {
        if (!cancelled) setResolvingBinary(false);
      }
    })();

    return () => {
      cancelled = true;
      revokeFn?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAsset?.id]);

  // Derived exploration domain profile, capabilities, scale, academic context & tool availability
  const domainProfile = useMemo(
    () => (activeAsset ? getExplorationProfile(activeAsset, customCategories) : null),
    [activeAsset, customCategories]
  );

  const capabilities = useMemo(
    () => (activeAsset ? analyzeModelCapabilities(activeAsset, components) : null),
    [activeAsset, components]
  );

  const scaleInfo = useMemo(
    () => (activeAsset ? computeModelScaleInfo(activeAsset) : null),
    [activeAsset]
  );

  const toolAvailability = useMemo(
    () =>
      computeExplorerToolAvailability({
        asset: activeAsset,
        loadingStatus: viewerLoading.status,
        capabilities,
        components,
        isSoftwareGl
      }),
    [activeAsset, viewerLoading.status, capabilities, components, isSoftwareGl]
  );

  const academicContext = useMemo(
    () => (activeAsset ? resolveAssetAcademicContext(activeAsset, syllabi) : null),
    [activeAsset, syllabi]
  );

  const relatedModels = useMemo(
    () => (activeAsset ? getRelated3DModels(activeAsset, assets, 6) : []),
    [activeAsset, assets]
  );

  const quickSubjects = useMemo(
    () =>
      syllabi.flatMap((syl) =>
        syl.subjects.map((sub) => ({ syllabusId: syl.id, course: syl.course, subject: sub }))
      ),
    [syllabi]
  );

  const quickTopics = useMemo(() => {
    const hit = quickSubjects.find((s) => s.subject.code === quickLinkSubject);
    if (!hit) return [];
    return hit.subject.units.flatMap((u) =>
      u.topics.map((t) => ({ unitId: u.id, unitNo: u.unitNo, unitTitle: u.title, topic: t }))
    );
  }, [quickSubjects, quickLinkSubject]);

  const selectedQuickTopic = useMemo(
    () => quickTopics.find((t) => t.topic.id === quickLinkTopicId) || null,
    [quickTopics, quickLinkTopicId]
  );

  useEffect(() => {
    if (activeAsset) {
      setQuickLinkDept(activeAsset.departments[0] || 'anatomy');
      setShowInlineLinker(false);
      setQuickLinkNotice(null);
    }
  }, [activeAsset?.id]);

  const handleSaveQuickLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) return;
    const subMatch = quickSubjects.find((s) => s.subject.code === quickLinkSubject);
    const topMatch = selectedQuickTopic;
    const assoc: SyllabusAssociation = {
      id: `assoc_${Date.now()}`,
      course: subMatch?.course || 'B.Pharm',
      syllabusId: subMatch?.syllabusId,
      departmentId: quickLinkDept,
      subjectCode: subMatch?.subject.code,
      subjectTitle: subMatch?.subject.title,
      unitId: topMatch?.unitId,
      unitNo: topMatch?.unitNo,
      unitTitle: topMatch?.unitTitle,
      topicId: topMatch?.topic.id,
      topicTitle: topMatch?.topic.title,
      subtopicTitle: quickLinkSubtopic.trim() || undefined
    };
    const res = await addSyllabusAssociationSafe(activeAsset.id, assoc);
    if (res.duplicate) {
      setQuickLinkNotice('Already linked to that curriculum target.');
      return;
    }
    if (res.asset) {
      setAssets((prev) => prev.map((a) => (a.id === res.asset!.id ? res.asset! : a)));
      setQuickLinkNotice('Linked to syllabus topic.');
      setShowInlineLinker(false);
      setQuickLinkSubtopic('');
    }
  };

  const handleUnlinkFromExplorer = async (assocId: string) => {
    if (!activeAsset) return;
    const updated = await removeSyllabusAssociation(activeAsset.id, assocId);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const selectedComponent = useMemo(
    () => components.find((c) => c.id === selectedComponentId) || null,
    [components, selectedComponentId]
  );

  const selectedInspection = useMemo(() => {
    if (!selectedComponent || !activeAsset || !academicContext) return null;
    return inspectStructureComponent(
      selectedComponent,
      activeAsset,
      academicContext.matchedAnatomyEntities
    );
  }, [selectedComponent, activeAsset, academicContext]);

  const guidedSteps = useMemo(() => {
    if (!activeAsset || !academicContext) return [];
    return buildGuidedIdentificationSteps(
      activeAsset,
      components,
      academicContext.matchedAnatomyEntities
    );
  }, [activeAsset, components, academicContext]);

  const activeGuidedStep =
    guidedIndex !== null && guidedSteps[guidedIndex] ? guidedSteps[guidedIndex] : null;

  const filteredComponents = useMemo(() => {
    const q = componentSearch.trim().toLowerCase();
    if (!q) return components;
    return components.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.rawNodeName.toLowerCase().includes(q) ||
        (c.parentName && c.parentName.toLowerCase().includes(q)) ||
        (c.ancestorNames && c.ancestorNames.some((anc) => anc.toLowerCase().includes(q)))
    );
  }, [components, componentSearch]);

  const hierarchyGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      parentLabel: string | null;
      items: Analyzed3DComponent[];
    }> = [];
    const byKey = new Map<string, { key: string; parentLabel: string | null; items: Analyzed3DComponent[] }>();
    for (const c of filteredComponents) {
      const parentLabel = c.parentName || null;
      const key = parentLabel || '__root__';
      let bucket = byKey.get(key);
      if (!bucket) {
        bucket = { key, parentLabel, items: [] };
        byKey.set(key, bucket);
        groups.push(bucket);
      }
      bucket.items.push(c);
    }
    return groups;
  }, [filteredComponents]);

  const anyComponentHidden = useMemo(
    () => isolatedComponentIds.length > 0 || components.some((c) => !c.visible),
    [components, isolatedComponentIds]
  );

  const anySectionActive =
    sectioning.x.enabled || sectioning.y.enabled || sectioning.z.enabled;

  const isHeavyMesh = Boolean(
    activeAsset?.triangleCount && activeAsset.triangleCount > 250_000
  );

  const jumpToGuidedStep = useCallback(
    (idx: number) => {
      const step = guidedSteps[idx];
      if (!step) return;
      setGuidedIndex(idx);
      if (step.componentId) {
        setSelectedComponentIds([step.componentId]);
        viewerRef.current?.focusComponent(step.componentId);
      } else {
        setSelectedComponentIds([]);
        viewerRef.current?.focusPoint(step.focusPoint);
      }
      if (step.pinId) {
        setActivePinId(step.pinId);
      } else {
        setActivePinId(null);
      }
      setRightTab('inspect');
    },
    [guidedSteps]
  );

  // Sync fullscreen document state
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleWorkspaceFullscreen = async () => {
    const el = workspaceRootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        setIsFullscreen((v) => !v);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore exit failure
      }
      setIsFullscreen(false);
    }
  };

  // Asset mutation handlers (sync cleanly with IndexedDB + state)
  const handleToggleFavorite = async () => {
    if (!activeAsset) return;
    const updated = await toggle3DAssetFavorite(activeAsset.id);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleAddAnnotation = async (ann: Asset3DAnnotation) => {
    if (!activeAsset) return;
    const updated = await add3DAssetAnnotation(activeAsset.id, ann);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setActivePinId(ann.id);
    }
  };

  const handleSavePinEdit = async (e: React.FormEvent, pinId: string) => {
    e.preventDefault();
    if (!activeAsset || !editPinLabel.trim()) return;
    const updated = await update3DAssetAnnotation(activeAsset.id, pinId, {
      label: editPinLabel.trim(),
      note: editPinNote.trim() || undefined
    });
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditingPinId(null);
    }
  };

  const handleRemoveAnnotation = async (pinId: string) => {
    if (!activeAsset) return;
    const updated = await remove3DAssetAnnotation(activeAsset.id, pinId);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (activePinId === pinId) setActivePinId(null);
      if (editingPinId === pinId) setEditingPinId(null);
    }
  };

  const handleAddMeasurement = async (measurement: Asset3DMeasurement) => {
    if (!activeAsset) return;
    const updated = await add3DMeasurement(activeAsset.id, measurement);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleToggleMeasurementVisible = async (measurementId: string) => {
    if (!activeAsset) return;
    const updated = await toggle3DMeasurementVisible(activeAsset.id, measurementId);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleRemoveMeasurement = async (measurementId: string) => {
    if (!activeAsset) return;
    const updated = await remove3DMeasurement(activeAsset.id, measurementId);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleClearMeasurements = async () => {
    if (!activeAsset) return;
    const updated = await clear3DMeasurements(activeAsset.id);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleSaveScaleCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) return;
    const factorNum = Number(calibFactor);
    if (!Number.isFinite(factorNum) || factorNum <= 0) return;
    const cal: ModelScaleCalibration = {
      unitLabel: `Calibrated (${calibUnitSymbol})`,
      unitSymbol: calibUnitSymbol,
      unitsPerModelUnit: factorNum,
      source: 'user_calibrated',
      note: `User-calibrated 1 model unit = ${factorNum} ${calibUnitSymbol}`
    };
    const updated = await save3DScaleCalibration(activeAsset.id, cal);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleResetScaleCalibration = async () => {
    if (!activeAsset) return;
    const updated = await save3DScaleCalibration(activeAsset.id, undefined);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setCalibFactor('1');
    }
  };

  const handleSaveCurrentCameraView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset || !newViewName.trim()) return;
    const camState = viewerRef.current?.getCameraState();
    if (!camState) return;
    const view: SavedCameraView = {
      id: `view_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: newViewName.trim(),
      position: camState.position,
      target: camState.target,
      createdAt: Date.now()
    };
    const updated = await add3DSavedView(activeAsset.id, view);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setNewViewName('');
    }
  };

  const handleDeleteSavedView = async (viewId: string) => {
    if (!activeAsset) return;
    const updated = await remove3DSavedView(activeAsset.id, viewId);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleThumbnailCaptured = async (dataUrl: string) => {
    if (!activeAsset) return;
    const updated = await save3DAssetThumbnail(activeAsset.id, dataUrl);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleModelAnalyzed = useCallback(
    async (stats: {
      componentCount: number;
      vertexCount: number;
      triangleCount: number;
      dimensions?: [number, number, number];
    }) => {
      setDimensions(stats.dimensions);
      if (!activeAsset) return;
      if (
        activeAsset.componentCount === stats.componentCount &&
        activeAsset.vertexCount === stats.vertexCount &&
        activeAsset.triangleCount === stats.triangleCount
      ) {
        return;
      }
      const updated = await update3DAssetMeta(activeAsset.id, {
        componentCount: stats.componentCount,
        vertexCount: stats.vertexCount,
        triangleCount: stats.triangleCount
      });
      if (updated) {
        setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      }
    },
    [activeAsset]
  );

  const handleCameraPresetClick = (preset: CameraViewPreset) => {
    setActiveCameraPreset(preset);
    viewerRef.current?.setCameraPreset(preset);
  };

  const setVisualizationMode = useCallback((mode: RenderVisualizationMode) => {
    setRenderSettings((s) => ({
      ...s,
      renderMode: mode,
      wireframe: mode === 'wireframe'
    }));
  }, []);

  const resetExplorationState = useCallback(() => {
    setSectioning(DEFAULT_SECTIONING_STATE);
    setRenderSettings(DEFAULT_VIEWER_SETTINGS);
    setInteractionMode('inspect');
    setSelectedComponentIds([]);
    setIsolatedComponentIds([]);
    viewerRef.current?.restoreAllComponents();
    viewerRef.current?.setCameraPreset('reset');
    setActiveCameraPreset('reset');
    setActivePinId(null);
    setGuidedIndex(null);
  }, []);

  const updateAxisSection = (
    axis: ClippingAxisKey,
    patch: Partial<SectioningState['x']>
  ) => {
    setSectioning((prev) => ({
      ...prev,
      [axis]: { ...prev[axis], ...patch }
    }));
  };

  // Keyboard shortcuts for scientific workbench
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'r') {
        e.preventDefault();
        setActiveCameraPreset('reset');
        viewerRef.current?.setCameraPreset('reset');
      } else if (key === 'f') {
        e.preventDefault();
        if (selectedComponentIds.length > 0) viewerRef.current?.focusSelection();
        else viewerRef.current?.fitToViewport();
      } else if (key === 'h') {
        e.preventDefault();
        setControlsHidden((v) => !v);
      } else if (key === 'l') {
        if (capabilities?.hasNamedStructures) {
          e.preventDefault();
          setRenderSettings((s) => ({ ...s, showLabels: !s.showLabels }));
        }
      } else if (key === '1') {
        setVisualizationMode('solid');
      } else if (key === '2') {
        setVisualizationMode('wireframe');
      } else if (key === '3') {
        setVisualizationMode('xray');
      } else if (e.key === 'Escape') {
        if (interactionMode !== 'inspect') {
          setInteractionMode('inspect');
        } else if (controlsHidden) {
          setControlsHidden(false);
        } else if (sectionPopoverOpen) {
          setSectionPopoverOpen(false);
        } else if (lightingPopoverOpen) {
          setLightingPopoverOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    capabilities?.hasNamedStructures,
    controlsHidden,
    interactionMode,
    lightingPopoverOpen,
    sectionPopoverOpen,
    selectedComponentIds.length,
    setVisualizationMode
  ]);

  const safeSourceUrl = activeAsset ? sanitizeHttpUrl(activeAsset.sourceUrl) : null;
  const activeAvailability = activeAsset ? getAsset3DAvailability(activeAsset) : null;
  const savedViews = activeAsset?.savedViews || [];
  const measurements = activeAsset?.measurements || [];

  return (
    <div
      ref={workspaceRootRef}
      className="h-[100dvh] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden"
    >
      {/* Top Academic Explorer Navigation Bar */}
      {!controlsHidden && (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                if (onExitExplorer) onExitExplorer();
                else openAsset3DEngine({ tab: 'library' });
              }}
              className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 shrink-0"
              title={`Return to ${returnLabel}`}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{returnLabel}</span>
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                Academic 3D Explorer
                {activeAsset
                  ? ` · ${get3DCategoryLabel(
                      activeAsset.category,
                      customCategories
                    )} · ${activeAsset.format.toUpperCase()}`
                  : ''}
              </p>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {activeAsset ? activeAsset.name : 'Select a Scientific 3D Model'}
              </h1>
            </div>
          </div>

          {/* Library Switcher & Presentation Utilities */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {assets.length > 0 && (
              <select
                aria-label="Switch 3D model from library"
                value={selectedAssetId || ''}
                onChange={(e) => setSelectedAssetId(e.target.value || null)}
                className="max-w-[160px] sm:max-w-[230px] min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              >
                {assets.map((item) => {
                  const avail = getAsset3DAvailability(item);
                  return (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.format.toUpperCase()}
                      {!avail.canOpenViewer ? ' · Metadata only' : ''})
                    </option>
                  );
                })}
              </select>
            )}

            {activeAsset && (
              <>
                <button
                  type="button"
                  onClick={() => void handleToggleFavorite()}
                  className={`min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-xl border transition-colors ${
                    activeAsset.isFavorite
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500'
                  }`}
                  aria-label={
                    activeAsset.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                  }
                >
                  <Star className={`w-4 h-4 ${activeAsset.isFavorite ? 'fill-current' : ''}`} />
                </button>

                {viewerLoading.status === 'ready' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void viewerRef.current?.captureScreenshotPng(activeAsset.name)}
                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                      title="Download high-resolution PNG screenshot of current 3D view"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden lg:inline">PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void viewerRef.current?.captureThumbnail()}
                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                      title="Save current 3D view as library preview thumbnail"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden md:inline">Snapshot</span>
                    </button>
                  </>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setControlsHidden(true)}
              className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
              title="Clean presentation mode — hide UI chrome (Shortcut: H)"
            >
              <Maximize className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xl:inline">Present</span>
            </button>

            <button
              type="button"
              onClick={handleToggleWorkspaceFullscreen}
              className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen workspace'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Empty Library State */}
      {loadingLibrary ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading PharmaLab 3D Asset Library...</span>
        </div>
      ) : !activeAsset ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <Box className="w-11 h-11 text-emerald-400 mx-auto" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-extrabold text-white">
                No 3D Models in Your Library Yet
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Academic 3D Explorer renders authentic models from your PharmaLab 3D Asset Library. Discover open-access models (organs, molecules, apparatus, industrial machinery) or upload a local GLB, glTF, ZIP, STL, OBJ, PDB, or SDF file.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => openAsset3DEngine({ tab: 'discover' })}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                <span>Discover Scientific 3D</span>
              </button>
              <button
                type="button"
                onClick={() => openAsset3DEngine({ tab: 'library', openUpload: true })}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload Local 3D Model</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main 3-Zone Responsive Exploration Workbench */
        <div className="relative flex-1 min-h-0 flex overflow-hidden">
          {/* LEFT PANEL: Structure Hierarchy, Multi-Select, Isolation & Guided Tour */}
          {!controlsHidden && leftPanelOpen && (
            <aside className="absolute inset-y-0 left-0 z-30 w-80 max-w-[88vw] lg:static lg:w-72 xl:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none">
              <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Structures &amp; Hierarchy ({components.length})
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  {anyComponentHidden && (
                    <button
                      type="button"
                      onClick={() => viewerRef.current?.restoreAllComponents()}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                    >
                      Restore All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLeftPanelOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    aria-label="Collapse structures panel"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5">
                {/* Honest Capabilities Notice */}
                {capabilities && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {capabilities.statusLabel}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {capabilities.honestNotice}
                    </p>
                  </div>
                )}

                {/* Guided Identification Tour Controls */}
                <section className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Guided Identification</span>
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                      {guidedSteps.length} step{guidedSteps.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {guidedSteps.length > 0 ? (
                    <div className="space-y-2">
                      {guidedIndex === null ? (
                        <button
                          type="button"
                          onClick={() => jumpToGuidedStep(0)}
                          className="w-full min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Guided Tour ({guidedSteps.length})</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            disabled={guidedIndex <= 0}
                            onClick={() => jumpToGuidedStep(guidedIndex - 1)}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {guidedIndex + 1} / {guidedSteps.length}
                          </span>
                          <button
                            type="button"
                            disabled={guidedIndex >= guidedSteps.length - 1}
                            onClick={() => jumpToGuidedStep(guidedIndex + 1)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuidedIndex(null)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                            title="Stop guided tour"
                            aria-label="Stop guided tour"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <p className="leading-relaxed">
                        Guided tour activates automatically when a model includes named sub-structures or user-saved 3D pins.
                      </p>
                      <button
                        type="button"
                        onClick={() => setInteractionMode('pin')}
                        className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Pin First Structure Note</span>
                      </button>
                    </div>
                  )}
                </section>

                {/* Multi-Select & Node Hierarchy List */}
                {components.length > 1 && (
                  <section className="space-y-2">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        <span>
                          Selected: {selectedComponentIds.length} / {components.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => viewerRef.current?.selectAllComponents()}
                            className="text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            All
                          </button>
                          <span className="text-slate-400">·</span>
                          <button
                            type="button"
                            onClick={() => viewerRef.current?.deselectAllComponents()}
                            disabled={selectedComponentIds.length === 0}
                            className="text-slate-500 dark:text-slate-400 hover:underline disabled:opacity-40"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          disabled={selectedComponentIds.length === 0}
                          onClick={() =>
                            viewerRef.current?.isolateComponents(selectedComponentIds)
                          }
                          className="py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-semibold"
                        >
                          Isolate
                        </button>
                        <button
                          type="button"
                          disabled={selectedComponentIds.length === 0}
                          onClick={() =>
                            viewerRef.current?.hideComponents(selectedComponentIds)
                          }
                          className="py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
                        >
                          Hide
                        </button>
                        <button
                          type="button"
                          disabled={selectedComponentIds.length === 0}
                          onClick={() => viewerRef.current?.focusSelection()}
                          className="py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
                        >
                          Focus
                        </button>
                      </div>
                    </div>

                    {components.length > 5 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={componentSearch}
                          onChange={(e) => setComponentSearch(e.target.value)}
                          placeholder="Filter mesh or parent nodes..."
                          className="w-full min-h-[34px] pl-8 pr-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {hierarchyGroups.map((grp) => (
                        <div key={grp.key} className="space-y-1">
                          {grp.parentLabel && (
                            <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/70 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                              <span className="truncate" title={grp.parentLabel}>
                                ↳ {grp.parentLabel} ({grp.items.length})
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  viewerRef.current?.isolateComponents(
                                    grp.items.map((item) => item.id)
                                  )
                                }
                                className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                              >
                                Isolate Group
                              </button>
                            </div>
                          )}

                          {grp.items.map((c) => {
                            const isSel = selectedComponentIds.includes(c.id);
                            const isIso = isolatedComponentIds.includes(c.id);
                            const indentPx = grp.parentLabel
                              ? Math.min(18, Math.max(8, (c.depth || 1) * 8))
                              : 0;
                            return (
                              <div
                                key={c.id}
                                style={indentPx ? { marginLeft: `${indentPx}px` } : undefined}
                                className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-xl border text-xs transition-colors ${
                                  isSel
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={() =>
                                    setSelectedComponentIds((prev) =>
                                      prev.includes(c.id)
                                        ? prev.filter((id) => id !== c.id)
                                        : [...prev, c.id]
                                    )
                                  }
                                  aria-label={`Select ${c.name}`}
                                  className="accent-emerald-600 shrink-0"
                                />

                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
                                      setSelectedComponentIds((prev) =>
                                        prev.includes(c.id)
                                          ? prev.filter((id) => id !== c.id)
                                          : [...prev, c.id]
                                      );
                                    } else {
                                      const nextIds =
                                        isSel && selectedComponentIds.length === 1 ? [] : [c.id];
                                      setSelectedComponentIds(nextIds);
                                      if (nextIds.length > 0) {
                                        viewerRef.current?.focusComponent(c.id);
                                        setRightTab('inspect');
                                      }
                                    }
                                  }}
                                  className="min-w-0 flex-1 text-left"
                                  title={c.name}
                                >
                                  <span className="block truncate">{c.name}</span>
                                  <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                                    {c.triangleCount.toLocaleString()} tris
                                    {!c.hasMeaningfulName ? ' · Unnamed node' : ''}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    viewerRef.current?.isolateComponent(isIso ? null : c.id)
                                  }
                                  className={`p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 ${
                                    isIso
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-400'
                                  }`}
                                  title={isIso ? 'Restore entire model' : 'Isolate structure'}
                                  aria-label={`Isolate ${c.name}`}
                                >
                                  <Focus className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => viewerRef.current?.toggleComponentVisible(c.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                  title={c.visible ? 'Hide structure' : 'Show structure'}
                                  aria-label={c.visible ? `Hide ${c.name}` : `Show ${c.name}`}
                                >
                                  {c.visible ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </aside>
          )}

          {/* CENTER STAGE: Grouped Scientific Toolbar + Full Immersive WebGL Viewport */}
          <main className="flex-1 min-w-0 flex flex-col bg-slate-100 dark:bg-slate-950 relative">
            {/* Solid Control Bar above Canvas (never overlays WebGL with backdrop-blur) */}
            {!controlsHidden && (
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  {!leftPanelOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setLeftPanelOpen(true);
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          setRightPanelOpen(false);
                        }
                      }}
                      className="min-h-[30px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <PanelLeftOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Parts ({components.length})</span>
                    </button>
                  )}

                  {anyComponentHidden && (
                    <button
                      type="button"
                      onClick={() => viewerRef.current?.restoreAllComponents()}
                      className="min-h-[30px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                      title="Restore all hidden or isolated parts"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Restore All</span>
                    </button>
                  )}

                  {/* Interaction Tool Mode Group */}
                  <div
                    className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                    role="group"
                    aria-label="Interaction tool mode"
                  >
                    {(
                      [
                        { id: 'inspect', label: 'Inspect', icon: Focus, title: 'Select & inspect structures (Shift/Ctrl-click multi-select)' },
                        { id: 'measure', label: 'Measure', icon: Ruler, title: 'Click two points on model to measure distance' },
                        { id: 'coord', label: 'Coords', icon: Crosshair, title: 'Probe 3D coordinates (X, Y, Z) on model surface' },
                        { id: 'pin', label: 'Pin Note', icon: MapPin, title: 'Click surface to add persistent 3D study pin' }
                      ] as const
                    ).map((tool) => {
                      const Icon = tool.icon;
                      const active = interactionMode === tool.id;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          title={tool.title}
                          onClick={() => setInteractionMode(tool.id)}
                          className={`min-h-[26px] px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                            active
                              ? tool.id === 'pin'
                                ? 'bg-amber-600 text-white'
                                : tool.id === 'measure' || tool.id === 'coord'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="hidden xl:inline">{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Visualization Mode Switcher: Solid / Wireframe / X-Ray */}
                  <div
                    className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                    role="group"
                    aria-label="3D exploration mode"
                  >
                    {(
                      [
                        { id: 'solid', label: 'Solid', icon: Box, title: 'Solid shaded view (1)' },
                        { id: 'wireframe', label: 'Wire', icon: Grid3X3, title: 'Wireframe topology view (2)' },
                        { id: 'xray', label: 'X-Ray', icon: Scan, title: 'Translucent X-Ray view (3)' }
                      ] as const
                    ).map((mode) => {
                      const Icon = mode.icon;
                      const active = renderSettings.renderMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          title={mode.title}
                          onClick={() => setVisualizationMode(mode.id)}
                          className={`min-h-[26px] px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sectioning Cutaway Popover Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setSectionPopoverOpen((v) => !v);
                      setLightingPopoverOpen(false);
                    }}
                    title="Cross-section clipping planes (X, Y, Z)"
                    className={`min-h-[30px] px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border ${
                      sectionPopoverOpen || anySectionActive
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Section</span>
                  </button>

                  {/* Camera Framing & Presets */}
                  <div
                    className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                    role="group"
                    aria-label="Camera orientation presets"
                  >
                    <button
                      type="button"
                      onClick={() => handleCameraPresetClick('reset')}
                      title="Reset camera framing (Shortcut: R)"
                      className="min-h-[26px] px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden md:inline">Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        selectedComponentIds.length > 0
                          ? viewerRef.current?.focusSelection()
                          : viewerRef.current?.fitToViewport()
                      }
                      title="Fit model or selection to viewport (Shortcut: F)"
                      className="min-h-[26px] px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                    >
                      <Focus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Fit</span>
                    </button>
                    {(
                      [
                        { id: 'front', label: 'F' },
                        { id: 'back', label: 'B' },
                        { id: 'left', label: 'L' },
                        { id: 'right', label: 'R' },
                        { id: 'top', label: 'T' },
                        { id: 'bottom', label: 'Bm' }
                      ] as Array<{ id: CameraViewPreset; label: string }>
                    ).map((preset) => {
                      const active = activeCameraPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          title={`Camera preset: ${preset.id}`}
                          onClick={() => handleCameraPresetClick(preset.id)}
                          className={`min-h-[26px] px-1.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Utility Strip: Auto-Rotate, Labels, Pins, Scene, Tools/Context */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5">
                    <button
                      type="button"
                      disabled={isSoftwareGl}
                      onClick={() =>
                        setRenderSettings((s) => ({ ...s, autoRotate: !s.autoRotate }))
                      }
                      title={
                        isSoftwareGl
                          ? 'Auto-rotate disabled on Software WebGL for smooth responsiveness'
                          : 'Toggle continuous turntable auto-rotation'
                      }
                      className={`min-h-[26px] px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed ${
                        renderSettings.autoRotate && !isSoftwareGl
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <RotateCw className="w-3 h-3" />
                      <span className="hidden xl:inline">Orbit</span>
                    </button>
                    {renderSettings.autoRotate && !isSoftwareGl && (
                      <select
                        aria-label="Auto-rotation speed"
                        value={renderSettings.autoRotateSpeed ?? 1.5}
                        onChange={(e) =>
                          setRenderSettings((s) => ({
                            ...s,
                            autoRotateSpeed: Number(e.target.value)
                          }))
                        }
                        className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-200 px-1 outline-none"
                      >
                        <option value={0.6}>0.5×</option>
                        <option value={1.5}>1×</option>
                        <option value={3.0}>2×</option>
                        <option value={5.5}>4×</option>
                      </select>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!capabilities?.hasNamedStructures}
                    onClick={() =>
                      setRenderSettings((s) => ({ ...s, showLabels: !s.showLabels }))
                    }
                    className={`min-h-[30px] px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border disabled:opacity-45 disabled:cursor-not-allowed ${
                      renderSettings.showLabels && capabilities?.hasNamedStructures
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    title={
                      capabilities?.hasNamedStructures
                        ? 'Toggle projected 3D node labels (Shortcut: L)'
                        : 'No named sub-structures in this 3D file (labels never fabricated)'
                    }
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Labels</span>
                  </button>

                  {activeAsset.annotations.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setRenderSettings((s) => ({
                          ...s,
                          showAnnotations: s.showAnnotations === false
                        }))
                      }
                      title="Toggle 3D surface annotation pins"
                      className={`min-h-[30px] px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border ${
                        renderSettings.showAnnotations !== false
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                          : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{activeAsset.annotations.length}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setLightingPopoverOpen((v) => !v);
                      setSectionPopoverOpen(false);
                    }}
                    title="Scene lighting, highlight, grid & axes"
                    className={`min-h-[30px] px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border ${
                      lightingPopoverOpen
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Scene</span>
                  </button>

                  {!rightPanelOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setRightPanelOpen(true);
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          setLeftPanelOpen(false);
                        }
                      }}
                      className="min-h-[30px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <PanelRightOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Tools</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Viewport Container */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              {resolvingBinary ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300 p-6">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                  <p className="text-sm font-semibold">
                    Preparing scientific 3D binary ({activeAsset.format.toUpperCase()})...
                  </p>
                </div>
              ) : resolveError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6 max-w-lg mx-auto">
                  <AlertTriangle className="w-10 h-10 text-amber-400" />
                  <div className="space-y-1.5">
                    <h2 className="text-base font-bold text-white">
                      3D Geometry Unavailable for Interactive Rendering
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {resolveError}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {safeSourceUrl && (
                      <a
                        href={safeSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Source Repository</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openAsset3DEngine({ tab: 'library', openUpload: true })}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload GLB / STL / PDB</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Universal3DViewer
                  ref={viewerRef}
                  asset={activeAsset}
                  modelUrl={modelUrl}
                  modelFormat={activeAsset.format}
                  annotations={activeAsset.annotations}
                  onAddAnnotation={handleAddAnnotation}
                  onRemoveAnnotation={handleRemoveAnnotation}
                  onThumbnailCaptured={handleThumbnailCaptured}
                  onModelAnalyzed={handleModelAnalyzed}
                  hideBuiltInHeader
                  hideBuiltInSidebars
                  className="flex-1 min-h-0 border-0 rounded-none"
                  selectedComponentId={selectedComponentId}
                  selectedComponentIds={selectedComponentIds}
                  onSelectComponents={setSelectedComponentIds}
                  isolatedComponentIds={isolatedComponentIds}
                  onIsolateComponentsChange={setIsolatedComponentIds}
                  renderSettings={renderSettings}
                  onRenderSettingsChange={setRenderSettings}
                  onLoadingStateChange={setViewerLoading}
                  onComponentsChange={setComponents}
                  activePinId={activePinId}
                  onActivePinChange={setActivePinId}
                  interactionMode={interactionMode}
                  onInteractionModeChange={setInteractionMode}
                  sectioning={sectioning}
                  measurements={measurements}
                  scaleCalibration={scaleInfo || undefined}
                  onAddMeasurement={handleAddMeasurement}
                  onPendingMeasureChange={setHasPendingMeasurePoint}
                  onHoverCoordinate={setHoveredCoord}
                  onClickCoordinate={setClickedCoord}
                  onSoftwareGlDetected={setIsSoftwareGl}
                  fullscreenTargetRef={workspaceRootRef}
                />
              )}

              {/* Active Interactive Tool Status Banner (Solid dark badge, no backdrop-blur) */}
              {!controlsHidden &&
                (interactionMode !== 'inspect' || anySectionActive) &&
                viewerLoading.status === 'ready' && (
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
                    {interactionMode === 'measure' && (
                      <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/60 text-xs text-slate-100 shadow-lg inline-flex items-center gap-2">
                        <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {hasPendingMeasurePoint
                            ? 'Click Point B on model surface to complete distance'
                            : 'Measure Mode: Click Point A on model surface'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setInteractionMode('inspect')}
                          className="text-slate-400 hover:text-white font-semibold"
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {interactionMode === 'coord' && (
                      <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/60 text-xs text-slate-100 shadow-lg inline-flex items-center gap-2 tabular-nums">
                        <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {(hoveredCoord || clickedCoord)
                            ? `XYZ: (${(hoveredCoord || clickedCoord)!.rawPoint[0]}, ${(hoveredCoord || clickedCoord)!.rawPoint[1]}, ${(hoveredCoord || clickedCoord)!.rawPoint[2]})${
                                (hoveredCoord || clickedCoord)!.componentName
                                  ? ` · ${(hoveredCoord || clickedCoord)!.componentName}`
                                  : ''
                              }`
                            : isHeavyMesh
                            ? 'Click surface to probe XYZ coordinate'
                            : 'Hover or click surface to read XYZ coordinate'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setInteractionMode('inspect')}
                          className="text-slate-400 hover:text-white font-semibold"
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {interactionMode === 'pin' && (
                      <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/60 text-xs text-slate-100 shadow-lg inline-flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pin Mode: Click model surface to attach study annotation</span>
                        <button
                          type="button"
                          onClick={() => setInteractionMode('inspect')}
                          className="text-slate-400 hover:text-white font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {anySectionActive && (
                      <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/60 text-xs text-slate-100 shadow-lg inline-flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Sectioning:{' '}
                          {(['x', 'y', 'z'] as const)
                            .filter((ax) => sectioning[ax].enabled)
                            .map((ax) => ax.toUpperCase())
                            .join(' + ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSectioning(DEFAULT_SECTIONING_STATE)}
                          className="text-emerald-400 hover:underline font-semibold"
                        >
                          Reset Cut
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {/* Quick Sectioning & Cutaway Popover */}
              {!controlsHidden && sectionPopoverOpen && (
                <div className="absolute top-3 right-3 z-20 w-80 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sectioning &amp; Cutaway Planes</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSectionPopoverOpen(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close sectioning popover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {(['x', 'y', 'z'] as ClippingAxisKey[]).map((ax) => {
                    const cfg = sectioning[ax];
                    return (
                      <div
                        key={ax}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 font-semibold text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cfg.enabled}
                              onChange={(e) =>
                                updateAxisSection(ax, { enabled: e.target.checked })
                              }
                              className="accent-emerald-500"
                            />
                            <span>
                              {ax.toUpperCase()}-Axis Plane{' '}
                              {ax === 'y' ? '(Horizontal)' : '(Vertical)'}
                            </span>
                          </label>
                          {cfg.enabled && (
                            <button
                              type="button"
                              onClick={() =>
                                updateAxisSection(ax, { inverted: !cfg.inverted })
                              }
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-emerald-300"
                            >
                              {cfg.inverted ? 'Flipped' : 'Flip Cut'}
                            </button>
                          )}
                        </div>

                        {cfg.enabled && (
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Cut Position</span>
                                <span className="tabular-nums">
                                  {Math.round(cfg.position * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={-1}
                                max={1}
                                step={0.02}
                                value={cfg.position}
                                onChange={(e) =>
                                  updateAxisSection(ax, {
                                    position: Number(e.target.value)
                                  })
                                }
                                className="w-full accent-emerald-500"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Plane Tilt</span>
                                <span className="tabular-nums">{cfg.tiltDeg}°</span>
                              </div>
                              <input
                                type="range"
                                min={-45}
                                max={45}
                                step={1}
                                value={cfg.tiltDeg}
                                onChange={(e) =>
                                  updateAxisSection(ax, {
                                    tiltDeg: Number(e.target.value)
                                  })
                                }
                                className="w-full accent-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectioning.showPlanes}
                        onChange={(e) =>
                          setSectioning((prev) => ({
                            ...prev,
                            showPlanes: e.target.checked
                          }))
                        }
                        className="accent-emerald-500"
                      />
                      <span>Show Plane Frames</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSectioning(DEFAULT_SECTIONING_STATE)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                    >
                      Reset Cut
                    </button>
                  </div>
                </div>
              )}

              {/* Lighting & Scene Settings Popover */}
              {!controlsHidden && lightingPopoverOpen && (
                <div className="absolute top-3 right-3 z-20 w-72 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Lighting &amp; Scene Options</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setLightingPopoverOpen(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close scene controls"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 block">Environment Lighting</label>
                    <select
                      value={renderSettings.environmentPreset}
                      onChange={(e) =>
                        setRenderSettings((s) => ({
                          ...s,
                          environmentPreset: e.target
                            .value as ViewerRenderSettings['environmentPreset']
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    >
                      <option value="studio">Neutral Studio (Balanced PBR)</option>
                      <option value="clinical_bright">Clinical Bright Lab</option>
                      <option value="contrast_dark">High Contrast Inspection</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setRenderSettings((s) => ({ ...s, backgroundMode: 'slate_dark' }))
                      }
                      className={`py-1.5 rounded-lg font-semibold border ${
                        renderSettings.backgroundMode === 'slate_dark'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      Dark Slate
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRenderSettings((s) => ({ ...s, backgroundMode: 'clinical_light' }))
                      }
                      className={`py-1.5 rounded-lg font-semibold border ${
                        renderSettings.backgroundMode === 'clinical_light'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      Clinical Light
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Key Light</span>
                      <span className="tabular-nums">
                        {renderSettings.keyLightIntensity.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={4.5}
                      step={0.1}
                      value={renderSettings.keyLightIntensity}
                      onChange={(e) =>
                        setRenderSettings((s) => ({
                          ...s,
                          keyLightIntensity: Number(e.target.value)
                        }))
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Ambient Fill</span>
                      <span className="tabular-nums">
                        {renderSettings.ambientIntensity.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={2.0}
                      step={0.1}
                      value={renderSettings.ambientIntensity}
                      onChange={(e) =>
                        setRenderSettings((s) => ({
                          ...s,
                          ambientIntensity: Number(e.target.value)
                        }))
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={renderSettings.showGrid}
                          onChange={(e) =>
                            setRenderSettings((s) => ({ ...s, showGrid: e.target.checked }))
                          }
                          className="accent-emerald-500"
                        />
                        <span>Reference Grid</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={renderSettings.showAxes}
                          onChange={(e) =>
                            setRenderSettings((s) => ({ ...s, showAxes: e.target.checked }))
                          }
                          className="accent-emerald-500"
                        />
                        <span>XYZ Axes</span>
                      </label>
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={renderSettings.highlightSelection !== false}
                        onChange={(e) =>
                          setRenderSettings((s) => ({
                            ...s,
                            highlightSelection: e.target.checked
                          }))
                        }
                        className="accent-emerald-500"
                      />
                      <span>Highlight Selected Parts</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Guided Identification Floating Popover Card */}
              {!controlsHidden && activeGuidedStep && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md p-3.5 rounded-xl bg-slate-900 border border-emerald-500/60 shadow-2xl space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-emerald-400 tabular-nums">
                        Guided Identification · Step {activeGuidedStep.stepNumber} of{' '}
                        {guidedSteps.length}
                      </p>
                      <h3 className="text-sm font-bold text-white truncate">
                        {activeGuidedStep.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {activeGuidedStep.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuidedIndex(null)}
                      className="text-slate-400 hover:text-white p-0.5"
                      aria-label="Close guided tour card"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {activeGuidedStep.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={guidedIndex === 0}
                      onClick={() => jumpToGuidedStep((guidedIndex ?? 1) - 1)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-200 font-semibold inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={guidedIndex === guidedSteps.length - 1}
                      onClick={() => jumpToGuidedStep((guidedIndex ?? 0) + 1)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold inline-flex items-center gap-1"
                    >
                      <span>Next Structure</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Clean Presentation Restore Trigger when UI chrome is hidden */}
              {controlsHidden && (
                <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setControlsHidden(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs font-semibold text-white shadow-xl inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Show Controls (H)</span>
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT PANEL: Structure Inspection, Interactive Tools, Academic Context & Asset Provenance */}
          {!controlsHidden && rightPanelOpen && (
            <aside className="absolute inset-y-0 right-0 z-30 w-96 max-w-[92vw] lg:static lg:w-80 xl:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none">
              <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <div
                  role="tablist"
                  aria-label="Explorer context panels"
                  className="flex items-center gap-1 flex-wrap"
                >
                  {(
                    [
                      { id: 'inspect', label: 'Inspect', icon: Focus },
                      { id: 'tools', label: 'Tools', icon: Wrench },
                      { id: 'academic', label: 'Academic', icon: GraduationCap },
                      { id: 'info', label: 'Info', icon: Info }
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = rightTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => setRightTab(tab.id)}
                        className={`min-h-[30px] px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setRightPanelOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white shrink-0"
                  aria-label="Collapse context panel"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs">
                {/* ---------- TAB 1: STRUCTURE INSPECTION & PINS ---------- */}
                {rightTab === 'inspect' && (
                  <>
                    {/* Multi-Selection Batch Card when 2+ parts selected */}
                    {selectedComponentIds.length > 1 && (
                      <section className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{selectedComponentIds.length} Structures Selected</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedComponentIds([])}
                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => viewerRef.current?.focusSelection()}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold"
                          >
                            Focus Selection
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              viewerRef.current?.isolateComponents(selectedComponentIds)
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                          >
                            Isolate Group
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              viewerRef.current?.hideComponents(selectedComponentIds)
                            }
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold"
                          >
                            Hide Selected
                          </button>
                        </div>
                      </section>
                    )}

                    {/* Selected Structure Card */}
                    {selectedComponent && selectedInspection ? (
                      <section className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              {selectedInspection.ancestorNames?.length
                                ? selectedInspection.ancestorNames.join(' › ')
                                : 'Selected Mesh Structure'}
                            </p>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white break-words">
                              {selectedInspection.displayName}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                              {selectedInspection.triangleCount.toLocaleString()} tris ·{' '}
                              {selectedInspection.vertexCount.toLocaleString()} verts
                              {selectedInspection.materialName
                                ? ` · Material: ${selectedInspection.materialName}`
                                : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedComponentIds([])}
                            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-0.5"
                            aria-label="Clear selected structure"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => viewerRef.current?.focusComponent(selectedComponent.id)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                          >
                            <Focus className="w-3 h-3 text-emerald-600" />
                            <span>Focus</span>
                          </button>
                          {components.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                viewerRef.current?.isolateComponent(
                                  isolatedComponentIds.includes(selectedComponent.id)
                                    ? null
                                    : selectedComponent.id
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                            >
                              {isolatedComponentIds.includes(selectedComponent.id)
                                ? 'Restore All'
                                : 'Isolate'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              viewerRef.current?.toggleComponentVisible(selectedComponent.id)
                            }
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                          >
                            {selectedComponent.visible ? 'Hide' : 'Show'}
                          </button>
                        </div>

                        {selectedInspection.verifiedRole ? (
                          <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              Verified Structure Info ({selectedInspection.verifiedSourceLabel})
                            </p>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                              {selectedInspection.verifiedRole}
                            </p>
                            {selectedInspection.pharmaceuticalNotes.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  Pharmaceutical Relevance
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {selectedInspection.pharmaceuticalNotes[0]}
                                </p>
                              </div>
                            )}
                            {selectedInspection.clinicalNotes.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  Clinical Significance
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {selectedInspection.clinicalNotes[0]}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {selectedInspection.hasMeaningfulName
                                ? 'No Linked Per-Node Academic Note Yet'
                                : 'Unnamed Mesh Node'}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                              {selectedInspection.hasMeaningfulName
                                ? `Node identifier "${selectedInspection.rawNodeName}" was read directly from the 3D file. No verified per-node academic description is attached yet—pin a 3D study note or check the Academic tab for whole-model syllabus notes.`
                                : `This 3D node did not carry a descriptive label inside the source file (${selectedInspection.rawNodeName}). PharmaLab does not invent fake labels. You can inspect its geometry or attach a verified 3D pin note.`}
                            </p>
                            <button
                              type="button"
                              onClick={() => setInteractionMode('pin')}
                              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Pin Study Note on Model</span>
                            </button>
                          </div>
                        )}

                        {selectedInspection.matchingPins.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                              Pinned Region Notes ({selectedInspection.matchingPins.length})
                            </p>
                            {selectedInspection.matchingPins.map((p) => (
                              <div
                                key={p.id}
                                className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-500/30"
                              >
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {p.label}
                                </p>
                                {p.note && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                    {p.note}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {academicContext && academicContext.matchedTopics.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Associated Academic Topics
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {academicContext.matchedTopics.slice(0, 3).map((mt) => (
                                <button
                                  key={mt.topic.id}
                                  type="button"
                                  onClick={() =>
                                    openStudyMode({
                                      syllabusId: mt.syllabusId,
                                      subjectCode: mt.subjectCode,
                                      topicId: mt.topic.id,
                                      view: 'study'
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span className="truncate max-w-[180px]">{mt.topic.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    ) : (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {components.length > 1
                            ? 'Click Any Part to Inspect Structure'
                            : 'Whole-Model Scientific Inspection'}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {components.length > 1
                            ? 'Select meshes in the 3D viewport (Shift/Ctrl+click to multi-select) or use the Structures panel to isolate, hide, or inspect node metadata.'
                            : activeAsset.description ||
                              'Use Solid, Wireframe, X-Ray, Sectioning, Measurement, and camera presets to inspect this unified 3D specimen.'}
                        </p>
                      </section>
                    )}

                    {/* Domain-Adaptive Exploration Guide */}
                    {domainProfile && (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          {domainProfile.supportsCpkLegend ? (
                            <Atom className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>{domainProfile.domainTitle} Inspection Guide</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong className="text-slate-800 dark:text-slate-200">Focus: </strong>
                          {domainProfile.explorationFocus}
                        </p>

                        {domainProfile.supportsCpkLegend && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Standard CPK Element Coloring
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {CPK_ELEMENT_LEGEND.map((el) => (
                                <span
                                  key={el.symbol}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
                                >
                                  <span
                                    className={`w-4 h-4 rounded text-[10px] font-bold inline-flex items-center justify-center ${el.swatchClass}`}
                                  >
                                    {el.symbol}
                                  </span>
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {el.name}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc pl-4">
                          {domainProfile.studyTips.map((tip, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Saved 3D Pins List with Visibility Toggle & In-Place Editing */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>3D Annotation Pins ({activeAsset.annotations.length})</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          {activeAsset.annotations.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setRenderSettings((s) => ({
                                  ...s,
                                  showAnnotations: s.showAnnotations === false
                                }))
                              }
                              className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              title={
                                renderSettings.showAnnotations === false
                                  ? 'Show 3D pins in viewport'
                                  : 'Hide 3D pins in viewport'
                              }
                            >
                              {renderSettings.showAnnotations === false ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setInteractionMode(
                                interactionMode === 'pin' ? 'inspect' : 'pin'
                              )
                            }
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            {interactionMode === 'pin' ? 'Cancel Pin' : '+ Add Pin'}
                          </button>
                        </div>
                      </div>

                      {activeAsset.annotations.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          No pins saved on this model yet. Enable &ldquo;Pin Note&rdquo; and click any point on the 3D surface to annotate key features.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeAsset.annotations.map((ann, idx) => {
                            const isEditing = editingPinId === ann.id;
                            return (
                              <div
                                key={ann.id}
                                className={`p-2 rounded-lg border transition-colors ${
                                  activePinId === ann.id
                                    ? 'bg-amber-500/10 border-amber-500/50'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {isEditing ? (
                                  <form
                                    onSubmit={(e) => void handleSavePinEdit(e, ann.id)}
                                    className="space-y-1.5"
                                  >
                                    <input
                                      type="text"
                                      required
                                      value={editPinLabel}
                                      onChange={(e) => setEditPinLabel(e.target.value)}
                                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                                      placeholder="Annotation title"
                                    />
                                    <textarea
                                      rows={2}
                                      value={editPinNote}
                                      onChange={(e) => setEditPinNote(e.target.value)}
                                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                                      placeholder="Academic or clinical note..."
                                    />
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setEditingPinId(null)}
                                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Save</span>
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="flex items-start justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActivePinId(ann.id);
                                        viewerRef.current?.focusPoint(ann.position);
                                      }}
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {idx + 1}. {ann.label}
                                      </p>
                                      {ann.componentName && (
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                                          Part: {ann.componentName}
                                        </p>
                                      )}
                                      {ann.note && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                          {ann.note}
                                        </p>
                                      )}
                                    </button>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingPinId(ann.id);
                                          setEditPinLabel(ann.label);
                                          setEditPinNote(ann.note || '');
                                        }}
                                        className="p-1 text-slate-400 hover:text-emerald-600"
                                        aria-label={`Edit pin ${ann.label}`}
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleRemoveAnnotation(ann.id)}
                                        className="p-1 text-slate-400 hover:text-rose-500"
                                        aria-label={`Delete pin ${ann.label}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </>
                )}

                {/* ---------- TAB 2: P3.6 INTERACTIVE MODEL TOOLS ---------- */}
                {rightTab === 'tools' && (
                  <>
                    {/* Sectioning & Cutaway */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Sectioning &amp; Cutaway</span>
                        </h3>
                        {anySectionActive && (
                          <button
                            type="button"
                            onClick={() => setSectioning(DEFAULT_SECTIONING_STATE)}
                            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            Reset Cut
                          </button>
                        )}
                      </div>

                      {(['x', 'y', 'z'] as ClippingAxisKey[]).map((ax) => {
                        const cfg = sectioning[ax];
                        return (
                          <div
                            key={ax}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={cfg.enabled}
                                  onChange={(e) =>
                                    updateAxisSection(ax, { enabled: e.target.checked })
                                  }
                                  className="accent-emerald-600"
                                />
                                <span>
                                  {ax.toUpperCase()} Axis{' '}
                                  {ax === 'y' ? '(Horizontal)' : '(Vertical)'}
                                </span>
                              </label>
                              {cfg.enabled && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAxisSection(ax, { inverted: !cfg.inverted })
                                  }
                                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                                >
                                  {cfg.inverted ? 'Flipped' : 'Flip'}
                                </button>
                              )}
                            </div>

                            {cfg.enabled && (
                              <div className="space-y-1.5">
                                <div>
                                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>Position</span>
                                    <span className="tabular-nums">
                                      {Math.round(cfg.position * 100)}%
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={-1}
                                    max={1}
                                    step={0.02}
                                    value={cfg.position}
                                    onChange={(e) =>
                                      updateAxisSection(ax, {
                                        position: Number(e.target.value)
                                      })
                                    }
                                    className="w-full accent-emerald-600"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>Tilt Angle</span>
                                    <span className="tabular-nums">{cfg.tiltDeg}°</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={-45}
                                    max={45}
                                    step={1}
                                    value={cfg.tiltDeg}
                                    onChange={(e) =>
                                      updateAxisSection(ax, {
                                        tiltDeg: Number(e.target.value)
                                      })
                                    }
                                    className="w-full accent-emerald-600"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <label className="flex items-center justify-between text-slate-600 dark:text-slate-300 cursor-pointer pt-0.5">
                        <span>Show Clipping Plane Frames</span>
                        <input
                          type="checkbox"
                          checked={sectioning.showPlanes}
                          onChange={(e) =>
                            setSectioning((prev) => ({
                              ...prev,
                              showPlanes: e.target.checked
                            }))
                          }
                          className="accent-emerald-600"
                        />
                      </label>
                    </section>

                    {/* Measurement & Coordinate Inspection */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Distance &amp; Coordinates</span>
                        </h3>
                        {measurements.length > 0 && (
                          <button
                            type="button"
                            onClick={() => void handleClearMeasurements()}
                            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setInteractionMode(
                              interactionMode === 'measure' ? 'inspect' : 'measure'
                            )
                          }
                          className={`py-1.5 px-2 rounded-lg font-semibold inline-flex items-center justify-center gap-1 ${
                            interactionMode === 'measure'
                              ? 'bg-cyan-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>
                            {interactionMode === 'measure' ? 'Stop Measure' : 'Measure'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setInteractionMode(
                              interactionMode === 'coord' ? 'inspect' : 'coord'
                            )
                          }
                          className={`py-1.5 px-2 rounded-lg font-semibold inline-flex items-center justify-center gap-1 ${
                            interactionMode === 'coord'
                              ? 'bg-cyan-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>
                            {interactionMode === 'coord' ? 'Stop Probe' : 'Probe XYZ'}
                          </span>
                        </button>
                      </div>

                      {/* Honest Unit Calibration */}
                      {scaleInfo && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              Unit: {scaleInfo.unitLabel}
                            </p>
                            {scaleInfo.source === 'user_calibrated' && (
                              <button
                                type="button"
                                onClick={() => void handleResetScaleCalibration()}
                                className="text-[11px] text-slate-500 hover:text-rose-500"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          {scaleInfo.note && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              {scaleInfo.note}
                            </p>
                          )}
                          <form
                            onSubmit={handleSaveScaleCalibration}
                            className="flex items-center gap-1.5 pt-0.5"
                          >
                            <span className="text-[11px] text-slate-500 shrink-0">1 unit =</span>
                            <input
                              type="number"
                              min="0.0001"
                              step="any"
                              value={calibFactor}
                              onChange={(e) => setCalibFactor(e.target.value)}
                              className="w-20 px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] tabular-nums text-slate-900 dark:text-white"
                            />
                            <select
                              value={calibUnitSymbol}
                              onChange={(e) =>
                                setCalibUnitSymbol(
                                  e.target.value as 'mm' | 'cm' | 'm' | 'µm'
                                )
                              }
                              className="px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-900 dark:text-white"
                            >
                              <option value="mm">mm</option>
                              <option value="cm">cm</option>
                              <option value="m">m</option>
                              <option value="µm">µm</option>
                            </select>
                            <button
                              type="submit"
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold"
                            >
                              Set
                            </button>
                          </form>
                        </div>
                      )}

                      {(hoveredCoord || clickedCoord) && (
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[11px] tabular-nums space-y-0.5">
                          <p className="font-bold text-cyan-800 dark:text-cyan-300">
                            Coordinate Readout
                          </p>
                          <p className="text-slate-700 dark:text-slate-200">
                            X: {(hoveredCoord || clickedCoord)!.rawPoint[0]} · Y:{' '}
                            {(hoveredCoord || clickedCoord)!.rawPoint[1]} · Z:{' '}
                            {(hoveredCoord || clickedCoord)!.rawPoint[2]}
                          </p>
                          {(hoveredCoord || clickedCoord)!.componentName && (
                            <p className="text-slate-500 dark:text-slate-400 truncate">
                              Structure: {(hoveredCoord || clickedCoord)!.componentName}
                            </p>
                          )}
                        </div>
                      )}

                      {measurements.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400">
                          No distance measurements recorded. Click &ldquo;Measure&rdquo; and select Point A then Point B on the model.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {measurements.map((m, idx) => {
                            const fmt = scaleInfo
                              ? formatMeasuredDistance(m.modelUnitDistance, scaleInfo)
                              : { formatted: `${m.modelUnitDistance} units` };
                            return (
                              <div
                                key={m.id}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                              >
                                <button
                                  type="button"
                                  onClick={() => viewerRef.current?.focusPoint(m.pointA)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="font-bold text-slate-900 dark:text-white tabular-nums">
                                    #{idx + 1} · {fmt.formatted}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                                    Raw Δ: {m.modelUnitDistance.toFixed(3)} model units
                                  </p>
                                </button>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => void handleToggleMeasurementVisible(m.id)}
                                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                    aria-label="Toggle measurement visibility"
                                  >
                                    {m.visible ? (
                                      <Eye className="w-3.5 h-3.5" />
                                    ) : (
                                      <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleRemoveMeasurement(m.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500"
                                    aria-label="Remove measurement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {/* Saved Camera Views & Exploration State */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Saved Camera Views ({savedViews.length})</span>
                        </h3>
                        <button
                          type="button"
                          onClick={resetExplorationState}
                          className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600"
                        >
                          Reset All Tools
                        </button>
                      </div>

                      <form onSubmit={handleSaveCurrentCameraView} className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={newViewName}
                          onChange={(e) => setNewViewName(e.target.value)}
                          placeholder="View name (e.g. Anterior Valve)"
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          disabled={viewerLoading.status !== 'ready'}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white font-semibold shrink-0"
                        >
                          Save
                        </button>
                      </form>

                      {savedViews.length > 0 && (
                        <div className="space-y-1">
                          {savedViews.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  viewerRef.current?.setCameraViewState(v.position, v.target)
                                }
                                className="min-w-0 flex-1 text-left font-semibold text-slate-800 dark:text-slate-200 truncate hover:text-emerald-600"
                              >
                                {v.name}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteSavedView(v.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                                aria-label={`Delete saved view ${v.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Honest Tool Availability Matrix */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Model Tool Compatibility</span>
                      </h3>
                      <div className="space-y-1.5">
                        {Object.values(toolAvailability).map((cap) => (
                          <div
                            key={cap.label}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {cap.label}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  cap.category === 'fully_functional'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : cap.category === 'model_dependent' && cap.supported
                                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {cap.supported ? 'Active' : 'Unavailable'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              {cap.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* ---------- TAB 3: ACADEMIC CONTEXT ---------- */}
                {rightTab === 'academic' && academicContext && (
                  <>
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Curriculum &amp; Syllabus Links</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowInlineLinker((v) => !v)}
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{showInlineLinker ? 'Close' : 'Link Topic'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openAsset3DEngine({ tab: 'mapping' })}
                            className="text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold"
                          >
                            Manage
                          </button>
                        </div>
                      </div>

                      {showInlineLinker && (
                        <form
                          onSubmit={handleSaveQuickLink}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/40 space-y-2"
                        >
                          <select
                            value={quickLinkDept}
                            onChange={(e) => setQuickLinkDept(e.target.value as BPharmDepartmentId)}
                            className="w-full min-h-[32px] px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-900 dark:text-white"
                          >
                            {ALL_BPHARM_DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>
                                {BPHARM_DEPARTMENT_LABELS[d]}
                              </option>
                            ))}
                          </select>
                          <select
                            value={quickLinkSubject}
                            onChange={(e) => {
                              setQuickLinkSubject(e.target.value);
                              setQuickLinkTopicId('');
                            }}
                            className="w-full min-h-[32px] px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-900 dark:text-white"
                          >
                            <option value="">Subject (Optional)</option>
                            {quickSubjects.map((s) => (
                              <option key={s.subject.code} value={s.subject.code}>
                                {s.subject.code} · {s.subject.title}
                              </option>
                            ))}
                          </select>
                          <select
                            value={quickLinkTopicId}
                            onChange={(e) => setQuickLinkTopicId(e.target.value)}
                            disabled={quickTopics.length === 0}
                            className="w-full min-h-[32px] px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-900 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Unit / Topic (Optional)</option>
                            {quickTopics.map((t) => (
                              <option key={t.topic.id} value={t.topic.id}>
                                {t.unitNo} · {t.topic.title}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={quickLinkSubtopic}
                            onChange={(e) => setQuickLinkSubtopic(e.target.value)}
                            placeholder="Subtopic (Optional)"
                            className="w-full min-h-[32px] px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-900 dark:text-white"
                          />
                          {quickLinkNotice && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-300">
                              {quickLinkNotice}
                            </p>
                          )}
                          <button
                            type="submit"
                            className="w-full min-h-[32px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Save Syllabus Link</span>
                          </button>
                        </form>
                      )}

                      <p className="text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-800 dark:text-slate-200">Departments: </strong>
                        {activeAsset.departments.map((d) => BPHARM_DEPARTMENT_LABELS[d]).join(' · ')}
                      </p>

                      {academicContext.links.length === 0 ? (
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            This asset is not linked to a specific B.Pharm syllabus unit or topic yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowInlineLinker(true)}
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            + Link to Syllabus Topic →
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {academicContext.links.map((lnk) => (
                            <div
                              key={lnk.id}
                              className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {[lnk.course, lnk.subjectCode, lnk.unitNo, lnk.unitTitle]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => void handleUnlinkFromExplorer(lnk.id)}
                                  className="text-slate-400 hover:text-rose-500 shrink-0"
                                  aria-label="Unlink from syllabus"
                                  title="Unlink from syllabus (keeps 3D asset)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {lnk.subjectTitle && (
                                <p className="text-slate-700 dark:text-slate-300 font-medium">
                                  {lnk.subjectTitle}
                                </p>
                              )}
                              {(lnk.topicTitle ||
                                lnk.subtopicTitle ||
                                lnk.structureName ||
                                lnk.experimentTitle) && (
                                <p className="text-slate-600 dark:text-slate-400">
                                  {[
                                    lnk.topicTitle,
                                    lnk.subtopicTitle,
                                    lnk.structureName,
                                    lnk.experimentTitle
                                  ]
                                    .filter(Boolean)
                                    .join(' → ')}
                                </p>
                              )}
                              {lnk.learningObjective && (
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                  Objective: {lnk.learningObjective}
                                </p>
                              )}
                              {lnk.topicSummary && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                  {lnk.topicSummary}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(lnk.topicId || lnk.subjectCode) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openStudyMode({
                                        syllabusId: lnk.syllabusId ?? null,
                                        subjectCode: lnk.subjectCode ?? null,
                                        topicId: lnk.topicId ?? null,
                                        view: 'study'
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>Open in Study Mode</span>
                                  </button>
                                )}
                                {lnk.structureId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigateToModule('anatomy', 'explorer', {
                                        structureId: lnk.structureId
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                                  >
                                    Anatomy Explorer
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {relatedModels.length > 0 && (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Related 3D Models ({relatedModels.length})</span>
                        </h3>
                        <div className="space-y-1.5">
                          {relatedModels.map((rel) => (
                            <button
                              key={rel.asset.id}
                              type="button"
                              onClick={() => setSelectedAssetId(rel.asset.id)}
                              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {rel.asset.name}
                                </p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                                  {rel.reasons[0]} · {rel.asset.format.toUpperCase()}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {academicContext.subjectObjectives.length > 0 && (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Syllabus Learning Objectives
                        </h3>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc pl-4">
                          {academicContext.subjectObjectives.slice(0, 5).map((obj, i) => (
                            <li key={i} className="leading-relaxed">
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {academicContext.matchedAnatomyEntities.map((ent) => (
                      <section
                        key={ent.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {ent.name}
                            {ent.scientificName ? ` (${ent.scientificName})` : ''}
                          </h3>
                          <button
                            type="button"
                            onClick={() =>
                              navigateToModule('anatomy', 'explorer', { structureId: ent.id })
                            }
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            Full Profile →
                          </button>
                        </div>
                        {ent.overview && (
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {ent.overview}
                          </p>
                        )}
                        {ent.pharmaceuticalRelevance?.[0] && (
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="text-slate-800 dark:text-slate-200">
                              Pharmaceutical Relevance:{' '}
                            </strong>
                            {ent.pharmaceuticalRelevance[0]}
                          </p>
                        )}
                      </section>
                    ))}

                    {academicContext.relatedExperiments.length > 0 && (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Related Department Practicals</span>
                        </h3>
                        <div className="space-y-1.5">
                          {academicContext.relatedExperiments.map((exp) => (
                            <button
                              key={`${exp.moduleId}_${exp.id}`}
                              type="button"
                              onClick={() => navigateToModule(exp.moduleId, exp.tab)}
                              className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {exp.code} · {exp.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {exp.departmentLabel} Lab
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {academicContext.academicReferences.length > 0 && (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Academic References
                        </h3>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc pl-4">
                          {academicContext.academicReferences.slice(0, 6).map((refText, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {refText}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </>
                )}

                {/* ---------- TAB 4: ASSET METADATA & PROVENANCE ---------- */}
                {rightTab === 'info' && (
                  <>
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Scientific Asset Overview
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {activeAsset.description || 'No description recorded for this 3D asset.'}
                      </p>
                      {activeAsset.tags.length > 0 && (
                        <p className="text-slate-500 dark:text-slate-400 pt-1">
                          Tags: {activeAsset.tags.join(' · ')}
                        </p>
                      )}
                    </section>

                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 tabular-nums">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Model Format &amp; Geometry</span>
                      </h3>
                      <dl className="space-y-1 text-slate-600 dark:text-slate-400">
                        <div>
                          <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                            File Name:{' '}
                          </dt>
                          <dd className="inline break-all">{activeAsset.fileName}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                            Format &amp; Size:{' '}
                          </dt>
                          <dd className="inline">
                            {activeAsset.format.toUpperCase()} · {formatBytes(activeAsset.byteSize)}
                          </dd>
                        </div>
                        {activeAvailability && (
                          <div>
                            <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                              Availability:{' '}
                            </dt>
                            <dd className="inline">{activeAvailability.label}</dd>
                          </div>
                        )}
                        {(activeAsset.triangleCount || activeAsset.vertexCount) && (
                          <div>
                            <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                              Mesh Count:{' '}
                            </dt>
                            <dd className="inline">
                              {components.length || activeAsset.componentCount || 1} part(s) ·{' '}
                              {activeAsset.triangleCount?.toLocaleString() || '—'} tris ·{' '}
                              {activeAsset.vertexCount?.toLocaleString() || '—'} verts
                            </dd>
                          </div>
                        )}
                        {dimensions && (
                          <div>
                            <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                              Raw Bounding Box:{' '}
                            </dt>
                            <dd className="inline">
                              {dimensions[0]} × {dimensions[1]} × {dimensions[2]} units
                            </dd>
                          </div>
                        )}
                      </dl>
                    </section>

                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Source &amp; License</span>
                        </h3>
                        {safeSourceUrl && (
                          <a
                            href={safeSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Original</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <dl className="space-y-1 text-slate-600 dark:text-slate-400">
                        <div>
                          <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                            Source:{' '}
                          </dt>
                          <dd className="inline">{activeAsset.sourceName}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                            Creator:{' '}
                          </dt>
                          <dd className="inline">{activeAsset.creator}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                            License:{' '}
                          </dt>
                          <dd className="inline">{activeAsset.license}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                            Attribution:{' '}
                          </dt>
                          <dd className="inline">{activeAsset.attribution}</dd>
                        </div>
                      </dl>
                      {activeAsset.usageRestrictions && (
                        <p className="text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                          {activeAsset.usageRestrictions}
                        </p>
                      )}
                    </section>
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
