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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  FlaskConical,
  Focus,
  FolderTree,
  Globe,
  GraduationCap,
  Grid3X3,
  Info,
  Layers,
  Link2,
  List,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
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
  createDefaultSectioningState,
  DEFAULT_VIEWER_SETTINGS,
  Universal3DViewerHandle,
  ViewerLoadingState
} from './Universal3DViewer';
import {
  add3DAssetAnnotation,
  add3DAssetSavedView,
  addSyllabusAssociationSafe,
  get3DModelObjectUrl,
  getAll3DAssets,
  getCustom3DCategories,
  getRelated3DModels,
  mark3DAssetOpened,
  remove3DAssetAnnotation,
  remove3DAssetSavedView,
  removeSyllabusAssociation,
  save3DAssetThumbnail,
  toggle3DAssetFavorite,
  update3DAssetAnnotation,
  update3DAssetMeta
} from './asset3dDb';
import {
  analyzeModelCapabilities,
  buildGuidedIdentificationSteps,
  CPK_ELEMENT_LEGEND,
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
  Asset3DSavedView,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  CameraViewPreset,
  CoordinateSample,
  Custom3DCategory,
  DistanceMeasurement,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability,
  RenderVisualizationMode,
  SceneHierarchyNode,
  SectionPlaneAxis,
  SectioningState,
  SyllabusAssociation,
  ViewerInteractionTool,
  ViewerRenderSettings
} from './types';
import { getApparatusProfile, getExperimentById } from './experimentCatalog';

export interface AcademicExplorerJumpTarget {
  assetId?: string | null;
  subjectCode?: string | null;
  topicId?: string | null;
  structureName?: string | null;
  experimentId?: string | null;
  experimentTitle?: string | null;
  experimentTab?: string | null;
  stepId?: string | null;
  stepTitle?: string | null;
  focusComponentName?: string | null;
  returnTab?: string | null;
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
  const {
    openAsset3DEngine,
    openStudyMode,
    navigateToModule,
    recordActivity
  } = useLibraryNavigation();

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

  // Explorer Workbench UI Panels
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [rightTab, setRightTab] = useState<'inspect' | 'tools' | 'academic' | 'info'>('inspect');
  const [lightingPopoverOpen, setLightingPopoverOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  // Interactive 3D Inspection & P3.6 Tool State
  const [renderSettings, setRenderSettings] =
    useState<ViewerRenderSettings>(DEFAULT_VIEWER_SETTINGS);
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraViewPreset>('reset');
  const [components, setComponents] = useState<Analyzed3DComponent[]>([]);
  const [hierarchyTree, setHierarchyTree] = useState<SceneHierarchyNode[]>([]);
  const [hierarchyViewMode, setHierarchyViewMode] = useState<'tree' | 'flat'>('tree');
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set());
  const [componentSearch, setComponentSearch] = useState('');
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [isolatedComponentIds, setIsolatedComponentIds] = useState<string[]>([]);
  const selectedComponentId = selectedComponentIds[0] ?? null;

  const [interactionTool, setInteractionTool] = useState<ViewerInteractionTool>('select');
  const pinMode = interactionTool === 'pin';
  const setPinMode = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setInteractionTool((prevTool) => {
      const nextBool = typeof val === 'function' ? val(prevTool === 'pin') : val;
      return nextBool ? 'pin' : 'select';
    });
  }, []);

  const [sectioning, setSectioning] = useState<SectioningState>(createDefaultSectioningState);
  const [measurements, setMeasurements] = useState<DistanceMeasurement[]>([]);
  const [coordinateSample, setCoordinateSample] = useState<CoordinateSample | null>(null);
  const [analyzedTriCount, setAnalyzedTriCount] = useState<number | undefined>(undefined);

  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [editPinLabel, setEditPinLabel] = useState('');
  const [editPinNote, setEditPinNote] = useState('');
  const [newViewName, setNewViewName] = useState('');
  const [dimensions, setDimensions] = useState<[number, number, number] | undefined>(undefined);

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
  const pendingFocusNameRef = useRef<string | null>(null);

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
      pendingFocusNameRef.current =
        jumpTarget.focusComponentName || jumpTarget.structureName || null;

      if (jumpTarget.experimentId || jumpTarget.experimentTitle) {
        setRightTab(jumpTarget.focusComponentName ? 'inspect' : 'academic');
      }

      if (jumpTarget.assetId) {
        const hit = assets.find((a) => a.id === jumpTarget.assetId);
        if (hit) {
          setSelectedAssetId(hit.id);
          return;
        }
      }
      if (jumpTarget.experimentId || jumpTarget.experimentTitle || jumpTarget.stepId) {
        const qExpId = (jumpTarget.experimentId || '').toLowerCase();
        const qExpTitle = (jumpTarget.experimentTitle || '').toLowerCase();
        const qStepId = (jumpTarget.stepId || '').toLowerCase();
        const expStepMatch = assets.find((a) =>
          a.syllabusLinks.some(
            (l) =>
              ((qExpId && l.experimentId?.toLowerCase() === qExpId) ||
                (qExpTitle && l.experimentTitle?.toLowerCase().includes(qExpTitle))) &&
              (!qStepId || l.stepId?.toLowerCase() === qStepId)
          )
        );
        const expAnyMatch =
          expStepMatch ||
          assets.find((a) =>
            a.syllabusLinks.some(
              (l) =>
                (qExpId && l.experimentId?.toLowerCase() === qExpId) ||
                (qExpTitle && l.experimentTitle?.toLowerCase().includes(qExpTitle))
            )
          );
        if (expAnyMatch) {
          setSelectedAssetId(expAnyMatch.id);
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

    // Fallback: maintain current valid selection or pick best compatible asset
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

  useEffect(() => {
    const focusName = pendingFocusNameRef.current;
    if (!focusName || components.length === 0) return;
    const norm = focusName.trim().toLowerCase();
    const hit =
      components.find((c) => c.name.toLowerCase() === norm) ||
      components.find(
        (c) => c.name.toLowerCase().includes(norm) || norm.includes(c.name.toLowerCase())
      );
    if (hit) {
      setSelectedComponentIds([hit.id]);
      setTimeout(() => {
        viewerRef.current?.focusComponent(hit.id);
      }, 150);
    }
    pendingFocusNameRef.current = null;
  }, [components]);

  const activeAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) || null,
    [assets, selectedAssetId]
  );

  // Resolve active asset binary/URL cleanly
  useEffect(() => {
    setComponents([]);
    setHierarchyTree([]);
    setCollapsedGroupIds(new Set());
    setSelectedComponentIds([]);
    setIsolatedComponentIds([]);
    setActivePinId(null);
    setEditingPinId(null);
    setInteractionTool('select');
    setSectioning(createDefaultSectioningState());
    setMeasurements([]);
    setCoordinateSample(null);
    setAnalyzedTriCount(undefined);
    setGuidedIndex(null);
    setComponentSearch('');
    setDimensions(undefined);

    if (!activeAsset) {
      setModelUrl(null);
      setResolveError(null);
      return;
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

  // Derived exploration domain profile, capabilities & academic context
  const domainProfile = useMemo(
    () => (activeAsset ? getExplorationProfile(activeAsset, customCategories) : null),
    [activeAsset, customCategories]
  );

  const capabilities = useMemo(
    () => (activeAsset ? analyzeModelCapabilities(activeAsset, components, analyzedTriCount) : null),
    [activeAsset, components, analyzedTriCount]
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
    () =>
      selectedComponentIds.length === 1
        ? components.find((c) => c.id === selectedComponentIds[0]) || null
        : null,
    [components, selectedComponentIds]
  );

  const selectedComponentsList = useMemo(
    () => components.filter((c) => selectedComponentIds.includes(c.id)),
    [components, selectedComponentIds]
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
        (c.parentName && c.parentName.toLowerCase().includes(q))
    );
  }, [components, componentSearch]);

  const anyComponentHidden = useMemo(
    () => isolatedComponentIds.length > 0 || components.some((c) => !c.visible),
    [components, isolatedComponentIds]
  );

  const componentById = useMemo(() => {
    const map = new Map<string, Analyzed3DComponent>();
    components.forEach((c) => map.set(c.id, c));
    return map;
  }, [components]);

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

  // Sync fullscreen document state & Escape shortcut for Presentation / Tools
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const onKeyDown = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (ev.key === 'Escape') {
        if (presentationMode) setPresentationMode(false);
        else if (interactionTool !== 'select') setInteractionTool('select');
      } else if ((ev.key === 'h' || ev.key === 'H') && !ev.ctrlKey && !ev.metaKey) {
        setPresentationMode((p) => !p);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [presentationMode, interactionTool]);

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

  const handleUpdateAnnotation = async (
    pinId: string,
    patch: { label?: string; note?: string; visible?: boolean }
  ) => {
    if (!activeAsset) return;
    const updated = await update3DAssetAnnotation(activeAsset.id, pinId, patch);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
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

  const handleSaveCameraView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) return;
    const cam = viewerRef.current?.getCameraState();
    if (!cam) return;
    const label =
      newViewName.trim() || `View ${(activeAsset.savedViews?.length || 0) + 1}`;
    const view: Asset3DSavedView = {
      id: `view_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: label,
      position: cam.position,
      target: cam.target,
      createdAt: Date.now()
    };
    const updated = await add3DAssetSavedView(activeAsset.id, view);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setNewViewName('');
    }
  };

  const handleRemoveSavedView = async (viewId: string) => {
    if (!activeAsset) return;
    const updated = await remove3DAssetSavedView(activeAsset.id, viewId);
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
      setAnalyzedTriCount(stats.triangleCount);
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

  const setVisualizationMode = (mode: RenderVisualizationMode) => {
    setRenderSettings((s) => ({
      ...s,
      renderMode: mode,
      wireframe: mode === 'wireframe'
    }));
  };

  const toggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const updateSectionAxis = (
    axis: SectionPlaneAxis,
    patch: Partial<SectioningState['planes'][SectionPlaneAxis]>
  ) => {
    setSectioning((prev) => {
      const nextPlane = { ...prev.planes[axis], ...patch };
      const nextPlanes = { ...prev.planes, [axis]: nextPlane };
      const anyEnabled = nextPlanes.x.enabled || nextPlanes.y.enabled || nextPlanes.z.enabled;
      return {
        ...prev,
        active: patch.enabled === true ? true : anyEnabled ? prev.active : false,
        planes: nextPlanes
      };
    });
  };

  const safeSourceUrl = activeAsset ? sanitizeHttpUrl(activeAsset.sourceUrl) : null;
  const activeAvailability = activeAsset ? getAsset3DAvailability(activeAsset) : null;

  const renderHierarchyNode = (node: SceneHierarchyNode): React.ReactNode => {
    if (node.kind === 'mesh' && node.componentId) {
      const c = componentById.get(node.componentId);
      if (!c) return null;
      const isSel = selectedComponentIds.includes(c.id);
      const isIso = isolatedComponentIds.includes(c.id);
      return (
        <div
          key={node.id}
          style={{ paddingLeft: `${Math.min(node.depth, 4) * 10 + 8}px` }}
          className={`flex items-center justify-between gap-1 pr-2 py-1.5 rounded-xl border text-xs transition-colors ${
            isSel
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <button
            type="button"
            onClick={(ev) => {
              if (ev.shiftKey || interactionTool === 'multi_select') {
                setSelectedComponentIds((prev) =>
                  prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                );
              } else {
                const next = isSel && selectedComponentIds.length === 1 ? [] : [c.id];
                setSelectedComponentIds(next);
                if (next.length === 1) {
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

          {components.length > 1 && (
            <button
              type="button"
              onClick={() => viewerRef.current?.isolateComponent(isIso ? null : c.id)}
              className={`p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 ${
                isIso ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
              title={isIso ? 'Restore entire model' : 'Isolate structure'}
              aria-label={`Isolate ${c.name}`}
            >
              <Focus className="w-3.5 h-3.5" />
            </button>
          )}

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
    }

    const collapsed = collapsedGroupIds.has(node.id);
    const allSelected =
      node.meshIds.length > 0 && node.meshIds.every((id) => selectedComponentIds.includes(id));
    const allHidden =
      node.meshIds.length > 0 && node.meshIds.every((id) => componentById.get(id)?.visible === false);

    return (
      <div key={node.id} className="space-y-1">
        <div
          style={{ paddingLeft: `${Math.min(node.depth, 4) * 10 + 6}px` }}
          className={`flex items-center justify-between gap-1 pr-2 py-1.5 rounded-xl border text-xs transition-colors ${
            allSelected
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold'
              : 'bg-slate-100/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleGroupCollapsed(node.id)}
            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
            aria-label={collapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedComponentIds(allSelected ? [] : node.meshIds);
              if (!allSelected) viewerRef.current?.focusSelected();
            }}
            className="min-w-0 flex-1 text-left flex items-center gap-1.5"
            title={`${node.name} (${node.meshIds.length} meshes)`}
          >
            <span className="truncate font-semibold">{node.name}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
              ({node.meshIds.length})
            </span>
          </button>

          {components.length > 1 && (
            <button
              type="button"
              onClick={() => viewerRef.current?.isolateComponents(node.meshIds)}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              title="Isolate branch"
              aria-label={`Isolate group ${node.name}`}
            >
              <Focus className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => viewerRef.current?.setComponentsVisibility(node.meshIds, allHidden)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
            title={allHidden ? 'Show branch' : 'Hide branch'}
            aria-label={allHidden ? `Show ${node.name}` : `Hide ${node.name}`}
          >
            {allHidden ? (
              <EyeOff className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {!collapsed && node.children.length > 0 && (
          <div className="space-y-1">{node.children.map((child) => renderHierarchyNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={workspaceRootRef}
      className="h-[100dvh] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden"
    >
      {/* Top Academic Explorer Navigation Bar (hidden in Presentation Mode) */}
      {!presentationMode && (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                if (onExitExplorer) onExitExplorer();
                else openAsset3DEngine({ tab: 'library' });
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 shrink-0"
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
                {jumpTarget?.experimentTitle
                  ? ` · Lab: ${jumpTarget.experimentTitle}${jumpTarget.stepTitle ? ` (${jumpTarget.stepTitle})` : ''}`
                  : ''}
              </p>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {activeAsset ? activeAsset.name : 'Select a Scientific 3D Model'}
              </h1>
            </div>
          </div>

          {/* Library Switcher & Explorer Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
            {assets.length > 0 && (
              <select
                aria-label="Switch 3D model from library"
                value={selectedAssetId || ''}
                onChange={(e) => setSelectedAssetId(e.target.value || null)}
                className="max-w-[180px] sm:max-w-[260px] min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
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
                  className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl border transition-colors ${
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
                      onClick={() => viewerRef.current?.downloadScreenshot()}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                      title="Download PNG screenshot of current 3D viewport"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden md:inline">Screenshot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void viewerRef.current?.captureThumbnail()}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                      title="Save current 3D view as library preview thumbnail"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden lg:inline">Save Preview</span>
                    </button>
                  </>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleToggleWorkspaceFullscreen}
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen workspace'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
          {/* LEFT PANEL: Structure Hierarchy, Multi-Select, Visibility, Isolation & Guided Identification */}
          {leftPanelOpen && !presentationMode && (
            <aside className="absolute inset-y-0 left-0 z-30 w-80 max-w-[88vw] lg:static lg:w-72 xl:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none">
              <div className="px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Structures &amp; Parts ({components.length})
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

              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-4">
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

                {/* Bulk Multi-Selection & Isolation Controls */}
                <section className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Selection ({selectedComponentIds.length}/{components.length})
                    </span>
                    {hierarchyTree.length > 0 && components.length > 1 && (
                      <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => setHierarchyViewMode('tree')}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                            hierarchyViewMode === 'tree'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-500'
                          }`}
                          title="Scene hierarchy tree"
                        >
                          <FolderTree className="w-3 h-3" />
                          <span>Tree</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHierarchyViewMode('flat')}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                            hierarchyViewMode === 'flat'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-500'
                          }`}
                          title="Flat mesh list"
                        >
                          <List className="w-3 h-3" />
                          <span>List</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={!capabilities?.supportsMultiSelect}
                      onClick={() => viewerRef.current?.selectAllComponents()}
                      title={
                        capabilities?.supportsMultiSelect
                          ? 'Select all sub-structures'
                          : capabilities?.unavailableReasons.multiSelect
                      }
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      disabled={selectedComponentIds.length === 0}
                      onClick={() => viewerRef.current?.deselectAllComponents()}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      Deselect
                    </button>
                    <button
                      type="button"
                      disabled={selectedComponentIds.length === 0}
                      onClick={() => viewerRef.current?.focusSelected()}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      Focus
                    </button>
                    <button
                      type="button"
                      disabled={!capabilities?.supportsIsolation || selectedComponentIds.length === 0}
                      onClick={() => viewerRef.current?.isolateComponents(selectedComponentIds)}
                      title={
                        capabilities?.supportsIsolation
                          ? 'Isolate selected structures'
                          : capabilities?.unavailableReasons.isolation
                      }
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      Isolate
                    </button>
                    <button
                      type="button"
                      disabled={!capabilities?.supportsIsolation || selectedComponentIds.length === 0}
                      onClick={() =>
                        viewerRef.current?.setComponentsVisibility(selectedComponentIds, false)
                      }
                      title={
                        capabilities?.supportsIsolation
                          ? 'Hide selected structures'
                          : capabilities?.unavailableReasons.isolation
                      }
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      Hide
                    </button>
                  </div>
                </section>

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
                        onClick={() => setPinMode(true)}
                        className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Pin First Structure Note</span>
                      </button>
                    </div>
                  )}
                </section>

                {/* Component Selection Hierarchy Tree or Flat List */}
                {components.length > 1 && (
                  <section className="space-y-2">
                    {components.length > 5 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={componentSearch}
                          onChange={(e) => setComponentSearch(e.target.value)}
                          placeholder="Filter mesh nodes..."
                          className="w-full min-h-[34px] pl-8 pr-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {hierarchyViewMode === 'tree' &&
                    hierarchyTree.length > 0 &&
                    !componentSearch.trim() ? (
                      <div className="space-y-1">
                        {hierarchyTree.map((rootNode) => renderHierarchyNode(rootNode))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredComponents.map((c) => {
                          const isSel = selectedComponentIds.includes(c.id);
                          const isIso = isolatedComponentIds.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              className={`flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl border text-xs transition-colors ${
                                isSel
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={(ev) => {
                                  if (ev.shiftKey || interactionTool === 'multi_select') {
                                    setSelectedComponentIds((prev) =>
                                      prev.includes(c.id)
                                        ? prev.filter((id) => id !== c.id)
                                        : [...prev, c.id]
                                    );
                                  } else {
                                    const next =
                                      isSel && selectedComponentIds.length === 1 ? [] : [c.id];
                                    setSelectedComponentIds(next);
                                    if (next.length === 1) {
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
                    )}
                  </section>
                )}
              </div>
            </aside>
          )}

          {/* CENTER STAGE: Control Strip + Full Immersive WebGL Viewport */}
          <main className="flex-1 min-w-0 flex flex-col bg-slate-100 dark:bg-slate-950 relative">
            {/* Solid Control Bar above Canvas (never overlays WebGL with backdrop-blur) */}
            {!presentationMode && (
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-3.5 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
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
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <PanelLeftOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Structures ({components.length})</span>
                    </button>
                  )}

                  {anyComponentHidden && (
                    <button
                      type="button"
                      onClick={() => viewerRef.current?.restoreAllComponents()}
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                      title="Restore all hidden or isolated parts"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Restore All</span>
                    </button>
                  )}

                  {/* Interaction Mode Switcher: Select / Multi / Distance / Coords / Pin */}
                  <div
                    className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                    role="group"
                    aria-label="3D interaction tool"
                  >
                    <button
                      type="button"
                      onClick={() => setInteractionTool('select')}
                      className={`min-h-[28px] px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        interactionTool === 'select'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Single structure click selection & orbit"
                    >
                      <Focus className="w-3 h-3" />
                      <span className="hidden sm:inline">Select</span>
                    </button>

                    <button
                      type="button"
                      disabled={!capabilities?.supportsMultiSelect}
                      onClick={() =>
                        setInteractionTool((t) =>
                          t === 'multi_select' ? 'select' : 'multi_select'
                        )
                      }
                      className={`min-h-[28px] px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                        interactionTool === 'multi_select'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={
                        capabilities?.supportsMultiSelect
                          ? 'Multi-select components (or Shift+Click)'
                          : capabilities?.unavailableReasons.multiSelect ||
                            'Requires multi-mesh assembly'
                      }
                    >
                      <Layers className="w-3 h-3" />
                      <span className="hidden md:inline">Multi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setInteractionTool((t) =>
                          t === 'measure_distance' ? 'select' : 'measure_distance'
                        )
                      }
                      className={`min-h-[28px] px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        interactionTool === 'measure_distance'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Point-to-point distance measurement (model units)"
                    >
                      <Ruler className="w-3 h-3" />
                      <span className="hidden sm:inline">Measure</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setInteractionTool((t) =>
                          t === 'measure_coords' ? 'select' : 'measure_coords'
                        )
                      }
                      className={`min-h-[28px] px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        interactionTool === 'measure_coords'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Inspect 3D surface coordinates"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span className="hidden lg:inline">Coords</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setInteractionTool((t) => (t === 'pin' ? 'select' : 'pin'))
                      }
                      className={`min-h-[28px] px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        interactionTool === 'pin'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Pin 3D annotation marker on surface"
                    >
                      <MapPin className="w-3 h-3" />
                      <span className="hidden sm:inline">Pin</span>
                    </button>
                  </div>

                  {/* Visualization Mode Switcher: Solid / Wireframe / X-Ray */}
                  <div
                    className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                    role="group"
                    aria-label="3D exploration mode"
                  >
                    {(
                      [
                        { id: 'solid', label: 'Solid', icon: Box },
                        { id: 'wireframe', label: 'Wireframe', icon: Grid3X3 },
                        { id: 'xray', label: 'X-Ray', icon: Scan }
                      ] as const
                    ).map((mode) => {
                      const Icon = mode.icon;
                      const active = renderSettings.renderMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setVisualizationMode(mode.id)}
                          className={`min-h-[28px] px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Camera Angle Presets */}
                  <div
                    className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                    role="group"
                    aria-label="Camera orientation presets"
                  >
                    {(
                      [
                        { id: 'reset', label: 'Reset', icon: RotateCcw },
                        { id: 'fit', label: 'Fit' },
                        { id: 'iso', label: 'Iso' },
                        { id: 'front', label: 'Front' },
                        { id: 'back', label: 'Back' },
                        { id: 'left', label: 'Left' },
                        { id: 'right', label: 'Right' },
                        { id: 'top', label: 'Top' },
                        { id: 'bottom', label: 'Bottom' }
                      ] as Array<{ id: CameraViewPreset; label: string; icon?: typeof RotateCcw }>
                    ).map((preset) => {
                      const active =
                        activeCameraPreset === preset.id &&
                        preset.id !== 'reset' &&
                        preset.id !== 'fit';
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleCameraPresetClick(preset.id)}
                          className={`min-h-[28px] px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
                          }`}
                        >
                          {preset.icon && (
                            <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSectioning((prev) => ({ ...prev, active: !prev.active }));
                      setRightPanelOpen(true);
                      setRightTab('tools');
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border ${
                      sectioning.active
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Toggle real WebGL cutaway sectioning planes"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Section</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRenderSettings((s) => ({ ...s, autoRotate: !s.autoRotate }))
                    }
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border ${
                      renderSettings.autoRotate
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Toggle turntable auto-rotation"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Rotate</span>
                  </button>

                  <button
                    type="button"
                    disabled={!capabilities?.hasNamedStructures}
                    onClick={() =>
                      setRenderSettings((s) => ({ ...s, showLabels: !s.showLabels }))
                    }
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border disabled:opacity-45 disabled:cursor-not-allowed ${
                      renderSettings.showLabels && capabilities?.hasNamedStructures
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={
                      capabilities?.hasNamedStructures
                        ? 'Toggle projected 3D node labels'
                        : capabilities?.unavailableReasons.labels ||
                          'No named sub-structures in this 3D file'
                    }
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Labels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPresentationMode(true)}
                    className="min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    title="Clean presentation mode (Shortcut: H)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLightingPopoverOpen((v) => !v)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border ${
                      lightingPopoverOpen
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <PanelRightOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Tools &amp; Info</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Viewport Container */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              {presentationMode && (
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700 text-xs text-slate-100 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => viewerRef.current?.setCameraPreset('fit')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold"
                    title="Fit model"
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => viewerRef.current?.downloadScreenshot()}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold inline-flex items-center gap-1"
                    title="Download PNG screenshot"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresentationMode(false)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Exit Presentation (Esc)</span>
                  </button>
                </div>
              )}

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
                  selectedComponentIds={selectedComponentIds}
                  onSelectComponents={setSelectedComponentIds}
                  isolatedComponentIds={isolatedComponentIds}
                  onIsolateChangeMulti={setIsolatedComponentIds}
                  renderSettings={renderSettings}
                  onRenderSettingsChange={setRenderSettings}
                  onLoadingStateChange={setViewerLoading}
                  onComponentsChange={setComponents}
                  onHierarchyChange={setHierarchyTree}
                  activePinId={activePinId}
                  onActivePinChange={setActivePinId}
                  pinMode={pinMode}
                  onPinModeChange={setPinMode}
                  interactionTool={interactionTool}
                  onInteractionToolChange={setInteractionTool}
                  sectioning={sectioning}
                  onSectioningChange={setSectioning}
                  measurements={measurements}
                  onMeasurementsChange={setMeasurements}
                  onCoordinateSample={setCoordinateSample}
                  presentationMode={presentationMode}
                  fullscreenTargetRef={workspaceRootRef}
                />
              )}

              {/* Lighting & Scene Settings Popover */}
              {lightingPopoverOpen && (
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

                  <div className="flex items-center justify-between pt-1">
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
                </div>
              )}

              {/* Guided Identification Floating Popover Card */}
              {activeGuidedStep && (
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
            </div>
          </main>

          {/* RIGHT PANEL: Structure Inspection, Interactive Tools, Academic Context & Asset Provenance */}
          {rightPanelOpen && !presentationMode && (
            <aside className="absolute inset-y-0 right-0 z-30 w-96 max-w-[92vw] lg:static lg:w-80 xl:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none">
              <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <div
                  role="tablist"
                  aria-label="Explorer context panels"
                  className="flex items-center gap-1 overflow-x-auto"
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
                        className={`min-h-[32px] px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors shrink-0 ${
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
                {/* ---------- TAB 1: STRUCTURE INSPECTION & DOMAIN EXPLORATION ---------- */}
                {rightTab === 'inspect' && (
                  <>
                    {/* Multi-Structure Selection Summary */}
                    {selectedComponentIds.length > 1 ? (
                      <section className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              Multi-Structure Selection
                            </p>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {selectedComponentIds.length} Structures Selected
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                              {selectedComponentsList
                                .reduce((acc, c) => acc + c.triangleCount, 0)
                                .toLocaleString()}{' '}
                              combined tris
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedComponentIds([])}
                            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-0.5"
                            aria-label="Clear selection"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => viewerRef.current?.focusSelected()}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                          >
                            <Focus className="w-3 h-3 text-emerald-600" />
                            <span>Focus Group</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              viewerRef.current?.isolateComponents(selectedComponentIds)
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            Isolate Group
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              viewerRef.current?.setComponentsVisibility(selectedComponentIds, false)
                            }
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                          >
                            Hide Selected
                          </button>
                        </div>

                        <ul className="space-y-1 max-h-36 overflow-y-auto pt-1 border-t border-emerald-500/20 text-[11px] text-slate-700 dark:text-slate-300">
                          {selectedComponentsList.map((c) => (
                            <li key={c.id} className="truncate">
                              • {c.name}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : selectedComponent && selectedInspection ? (
                      <section className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              Selected Mesh Structure
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
                            {selectedComponent.boundsSize && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                Raw bounds: {selectedComponent.boundsSize.join(' × ')}{' '}
                                {capabilities?.unitLabel || 'model units'}
                              </p>
                            )}
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
                              onClick={() => setPinMode(true)}
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
                            ? 'Select a mesh in the 3D viewport or from the Structures panel to highlight, multi-select (Shift+Click), isolate, or inspect its node metadata.'
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

                    {/* Saved 3D Pins List with Visibility & Edit Support */}
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
                                  showAnnotations: s.showAnnotations === false ? true : false
                                }))
                              }
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              title="Toggle all 3D pin markers on viewport"
                            >
                              {renderSettings.showAnnotations === false ? 'Show Pins' : 'Hide Pins'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPinMode((v) => !v)}
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            {pinMode ? 'Cancel Pin' : '+ Add Pin'}
                          </button>
                        </div>
                      </div>

                      {activeAsset.annotations.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          No pins saved on this model yet. Enable &ldquo;Pin&rdquo; and click any point on the 3D surface to annotate key features.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeAsset.annotations.map((ann, idx) => {
                            const isEditing = editingPinId === ann.id;
                            const isHidden = ann.visible === false;
                            return (
                              <div
                                key={ann.id}
                                className={`p-2.5 rounded-lg border transition-colors ${
                                  activePinId === ann.id
                                    ? 'bg-amber-500/10 border-amber-500/50'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {isEditing ? (
                                  <form
                                    onSubmit={async (ev) => {
                                      ev.preventDefault();
                                      if (!editPinLabel.trim()) return;
                                      await handleUpdateAnnotation(ann.id, {
                                        label: editPinLabel.trim(),
                                        note: editPinNote.trim()
                                      });
                                      setEditingPinId(null);
                                    }}
                                    className="space-y-1.5"
                                  >
                                    <input
                                      type="text"
                                      required
                                      value={editPinLabel}
                                      onChange={(e) => setEditPinLabel(e.target.value)}
                                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                                      placeholder="Pin title"
                                    />
                                    <textarea
                                      rows={2}
                                      value={editPinNote}
                                      onChange={(e) => setEditPinNote(e.target.value)}
                                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                                      placeholder="Notes..."
                                    />
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setEditingPinId(null)}
                                        className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Save</span>
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="flex items-start justify-between gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActivePinId(ann.id);
                                        viewerRef.current?.focusPoint(ann.position);
                                      }}
                                      className={`min-w-0 flex-1 text-left ${
                                        isHidden ? 'opacity-50' : ''
                                      }`}
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
                                        onClick={() =>
                                          void handleUpdateAnnotation(ann.id, { visible: isHidden })
                                        }
                                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                        title={isHidden ? 'Show pin in 3D' : 'Hide pin in 3D'}
                                        aria-label={isHidden ? `Show ${ann.label}` : `Hide ${ann.label}`}
                                      >
                                        {isHidden ? (
                                          <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingPinId(ann.id);
                                          setEditPinLabel(ann.label);
                                          setEditPinNote(ann.note || '');
                                        }}
                                        className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                        title="Edit annotation"
                                        aria-label={`Edit ${ann.label}`}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
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
                    {/* 1. Sectioning & Cutaway (Real WebGL Clipping Planes) */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sectioning &amp; Cutaway</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => viewerRef.current?.resetSectioning()}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSectioning((prev) => ({ ...prev, active: !prev.active }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              sectioning.active
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {sectioning.active ? 'Active' : 'Enable'}
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Slices geometry with real WebGL clipping planes. Combine X, Y, and Z planes simultaneously to inspect interior structures.
                      </p>

                      <label className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                        <span>Show Section Plane Guides</span>
                        <input
                          type="checkbox"
                          checked={sectioning.showPlaneGuides}
                          onChange={(e) =>
                            setSectioning((prev) => ({
                              ...prev,
                              showPlaneGuides: e.target.checked
                            }))
                          }
                          className="accent-emerald-600"
                        />
                      </label>

                      <div className="space-y-2.5">
                        {(
                          [
                            {
                              axis: 'y' as const,
                              label: 'Horizontal Plane (Y)',
                              dot: 'bg-emerald-500'
                            },
                            {
                              axis: 'x' as const,
                              label: 'Sagittal Plane (X)',
                              dot: 'bg-rose-500'
                            },
                            {
                              axis: 'z' as const,
                              label: 'Coronal Plane (Z)',
                              dot: 'bg-sky-500'
                            }
                          ] as const
                        ).map(({ axis, label, dot }) => {
                          const plane = sectioning.planes[axis];
                          return (
                            <div
                              key={axis}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <label className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={plane.enabled}
                                    onChange={(e) =>
                                      updateSectionAxis(axis, { enabled: e.target.checked })
                                    }
                                    className="accent-emerald-600"
                                  />
                                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                                  <span>{label}</span>
                                </label>
                                {plane.enabled && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSectionAxis(axis, { inverted: !plane.inverted })
                                    }
                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                                  >
                                    {plane.inverted ? 'Inverted' : 'Flip Cut'}
                                  </button>
                                )}
                              </div>

                              {plane.enabled && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[11px] text-slate-500 tabular-nums">
                                      <span>Cut Position</span>
                                      <span>{Math.round(plane.offset * 100)}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={-1}
                                      max={1}
                                      step={0.02}
                                      value={plane.offset}
                                      onChange={(e) =>
                                        updateSectionAxis(axis, {
                                          offset: Number(e.target.value)
                                        })
                                      }
                                      className="w-full accent-emerald-600"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
                                        <span>Tilt X</span>
                                        <span>{plane.tiltXDeg}°</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={-60}
                                        max={60}
                                        step={2}
                                        value={plane.tiltXDeg}
                                        onChange={(e) =>
                                          updateSectionAxis(axis, {
                                            tiltXDeg: Number(e.target.value)
                                          })
                                        }
                                        className="w-full accent-emerald-600"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
                                        <span>Tilt Y</span>
                                        <span>{plane.tiltYDeg}°</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={-60}
                                        max={60}
                                        step={2}
                                        value={plane.tiltYDeg}
                                        onChange={(e) =>
                                          updateSectionAxis(axis, {
                                            tiltYDeg: Number(e.target.value)
                                          })
                                        }
                                        className="w-full accent-emerald-600"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* 2. Measurement & Coordinate Probe */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-sky-500" />
                          <span>Measurement &amp; Coordinates</span>
                        </h3>
                        {(measurements.length > 0 || coordinateSample) && (
                          <button
                            type="button"
                            onClick={() => viewerRef.current?.clearMeasurements()}
                            className="text-[11px] font-semibold text-rose-500 hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setInteractionTool((t) =>
                              t === 'measure_distance' ? 'select' : 'measure_distance'
                            )
                          }
                          className={`py-1.5 px-2 rounded-lg font-semibold border inline-flex items-center justify-center gap-1 ${
                            interactionTool === 'measure_distance'
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>Distance</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setInteractionTool((t) =>
                              t === 'measure_coords' ? 'select' : 'measure_coords'
                            )
                          }
                          className={`py-1.5 px-2 rounded-lg font-semibold border inline-flex items-center justify-center gap-1 ${
                            interactionTool === 'measure_coords'
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>Coordinates</span>
                        </button>
                      </div>

                      {capabilities && (
                        <p className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {capabilities.unitCalibrationNote}
                        </p>
                      )}

                      {coordinateSample && (
                        <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/40 space-y-1 tabular-nums text-[11px]">
                          <p className="font-bold text-sky-700 dark:text-sky-300">
                            Coordinate Probe ({coordinateSample.unitLabel})
                          </p>
                          {coordinateSample.componentName && (
                            <p className="text-slate-700 dark:text-slate-200 truncate">
                              Surface: {coordinateSample.componentName}
                            </p>
                          )}
                          <p className="text-slate-800 dark:text-slate-100">
                            Raw: ({coordinateSample.pointRaw.join(', ')})
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            Normalized: ({coordinateSample.pointLocal.join(', ')})
                          </p>
                        </div>
                      )}

                      {measurements.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Measurements ({measurements.length})
                          </p>
                          {measurements.map((m, idx) => (
                            <div
                              key={m.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2 tabular-nums"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  #{measurements.length - idx}: {m.distanceRaw.toFixed(3)}{' '}
                                  {m.unitLabel}
                                </p>
                                {(m.componentA || m.componentB) && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {m.componentA || 'Point A'} → {m.componentB || 'Point B'}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => viewerRef.current?.removeMeasurement(m.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                                aria-label="Delete measurement"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* 3. Visualization, Highlighting & Rotation Speed */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Rendering &amp; Motion Controls
                      </h3>

                      <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
                        <span>Highlight Selected Structures</span>
                        <input
                          type="checkbox"
                          checked={renderSettings.highlightSelected !== false}
                          onChange={(e) =>
                            setRenderSettings((s) => ({
                              ...s,
                              highlightSelected: e.target.checked
                            }))
                          }
                          className="accent-emerald-600"
                        />
                      </label>

                      <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
                        <span>Turntable Auto-Rotate</span>
                        <input
                          type="checkbox"
                          checked={Boolean(renderSettings.autoRotate)}
                          onChange={(e) =>
                            setRenderSettings((s) => ({ ...s, autoRotate: e.target.checked }))
                          }
                          className="accent-emerald-600"
                        />
                      </label>

                      {renderSettings.autoRotate && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 tabular-nums">
                            <span>Rotation Speed</span>
                            <span>{(renderSettings.autoRotateSpeed ?? 1.5).toFixed(1)}×</span>
                          </div>
                          <input
                            type="range"
                            min={0.5}
                            max={6}
                            step={0.5}
                            value={renderSettings.autoRotateSpeed ?? 1.5}
                            onChange={(e) =>
                              setRenderSettings((s) => ({
                                ...s,
                                autoRotateSpeed: Number(e.target.value)
                              }))
                            }
                            className="w-full accent-emerald-600"
                          />
                        </div>
                      )}
                    </section>

                    {/* 4. Saved Camera Views & Presentation */}
                    <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Saved Camera Views &amp; Presentation</span>
                      </h3>

                      <form onSubmit={handleSaveCameraView} className="flex gap-1.5">
                        <input
                          type="text"
                          value={newViewName}
                          onChange={(e) => setNewViewName(e.target.value)}
                          placeholder="Bookmark name (e.g. Anterior Valve)"
                          className="min-w-0 flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          disabled={viewerLoading.status !== 'ready'}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white text-xs font-semibold shrink-0"
                        >
                          Save
                        </button>
                      </form>

                      {(activeAsset.savedViews?.length || 0) > 0 && (
                        <div className="space-y-1">
                          {activeAsset.savedViews!.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  viewerRef.current?.applyCameraState(v.position, v.target)
                                }
                                className="min-w-0 flex-1 text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
                              >
                                {v.name}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleRemoveSavedView(v.id)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                                aria-label={`Delete view ${v.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => viewerRef.current?.downloadScreenshot()}
                          className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Export PNG</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresentationMode(true)}
                          className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Presentation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => viewerRef.current?.resetExploration()}
                          className="col-span-2 py-1.5 px-2.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Full Exploration State</span>
                        </button>
                      </div>
                    </section>

                    {/* 5. Honest Model Tool Compatibility Summary */}
                    {capabilities && (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          Tool Compatibility for This Asset
                        </h3>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                          <li>
                            <strong className="text-slate-800 dark:text-slate-200">
                              Camera, Modes, Sectioning, Measure &amp; Pins:
                            </strong>{' '}
                            {capabilities.hasLoadedGeometry
                              ? 'Full WebGL geometry support'
                              : 'Waiting for loaded mesh'}
                          </li>
                          <li>
                            <strong className="text-slate-800 dark:text-slate-200">
                              Multi-Select &amp; Isolation:
                            </strong>{' '}
                            {capabilities.supportsMultiSelect
                              ? `Available (${capabilities.componentCount} meshes)`
                              : capabilities.unavailableReasons.multiSelect}
                          </li>
                          <li>
                            <strong className="text-slate-800 dark:text-slate-200">
                              3D Part Labels:
                            </strong>{' '}
                            {capabilities.hasNamedStructures
                              ? `Available (${capabilities.namedComponentCount} named nodes)`
                              : capabilities.unavailableReasons.labels}
                          </li>
                          <li>
                            <strong className="text-slate-800 dark:text-slate-200">
                              Distance Units:
                            </strong>{' '}
                            {capabilities.isCalibrated
                              ? capabilities.unitLabel
                              : `${capabilities.unitLabel} (uncalibrated)`}
                          </li>
                        </ul>
                      </section>
                    )}
                  </>
                )}

                {/* ---------- TAB 2: ACADEMIC CONTEXT ---------- */}
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
                                lnk.experimentTitle ||
                                lnk.stepTitle) && (
                                <p className="text-slate-600 dark:text-slate-400">
                                  {[
                                    lnk.topicTitle,
                                    lnk.subtopicTitle,
                                    lnk.structureName,
                                    lnk.experimentTitle,
                                    lnk.stepTitle
                                  ]
                                    .filter(Boolean)
                                    .join(' → ')}
                                </p>
                              )}
                              {(lnk.experimentRole || lnk.focusComponentName || lnk.setupNote) && (
                                <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">
                                  {[
                                    lnk.experimentRole,
                                    lnk.focusComponentName ? `Focus: ${lnk.focusComponentName}` : null,
                                    lnk.setupNote
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
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

                    {/* Related Scientific 3D Models */}
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

                    {/* Learning Objectives */}
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

                    {/* Matched Anatomy Entities Clinical & Pharmaceutical Relevance */}
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

                    {/* Related Practical Experiments */}
                    {academicContext.relatedExperiments.length > 0 && (
                      <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Related Department Practicals</span>
                        </h3>
                        <div className="space-y-2">
                          {academicContext.relatedExperiments.map((exp, idx) => {
                            const catEntry = getExperimentById(exp.id);
                            const primaryApp = catEntry?.apparatusIds?.[0]
                              ? getApparatusProfile(catEntry.apparatusIds[0])
                              : null;
                            return (
                              <div
                                key={`${exp.moduleId}_${exp.id}_${idx}`}
                                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() => navigateToModule(exp.moduleId, exp.tab)}
                                  className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-slate-950/60 text-left flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {exp.code} · {exp.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {exp.departmentLabel} Lab
                                      {exp.roleLabel ? ` · ${exp.roleLabel}` : ''}
                                      {exp.stepTitle ? ` · Step: ${exp.stepTitle}` : ''}
                                    </p>
                                    {exp.setupNote && (
                                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                                        {exp.setupNote}
                                      </p>
                                    )}
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                </button>
                                {primaryApp && (
                                  <div className="px-2.5 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] space-y-0.5">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                                      Apparatus: {primaryApp.name}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 leading-snug">
                                      {primaryApp.purpose}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Academic References */}
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

                {/* ---------- TAB 3: ASSET METADATA & PROVENANCE ---------- */}
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
