import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { unzipSync } from 'fflate';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { buildMacromoleculeGroupFromPdb, buildMolecularGroupFromSdf } from './molecularLoaders';
import {
  AlertTriangle,
  Box,
  Camera,
  Eye,
  EyeOff,
  Focus,
  Grid3X3,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  RotateCcw,
  Scan,
  SlidersHorizontal,
  Sun,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import {
  Analyzed3DComponent,
  Asset3DAnnotation,
  Asset3DItem,
  CameraViewPreset,
  ModelAnalysisSummary,
  ModelFormat,
  RenderVisualizationMode,
  ViewerRenderSettings
} from './types';

interface ComponentEntry {
  id: string;
  name: string;
  rawNodeName: string;
  parentName?: string;
  hasMeaningfulName: boolean;
  vertexCount: number;
  triangleCount: number;
  materialName?: string;
  mesh: THREE.Mesh;
  localCenter: THREE.Vector3;
  visible: boolean;
}

interface ProjectedLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  isSelected: boolean;
}

interface ProjectedPin {
  annotation: Asset3DAnnotation;
  x: number;
  y: number;
}

export interface ViewerLoadingState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  percent: number;
  errorMessage?: string;
}

export interface Universal3DViewerHandle {
  setCameraPreset: (preset: CameraViewPreset, immediate?: boolean) => void;
  focusComponent: (compId: string) => void;
  focusPoint: (localPoint: [number, number, number]) => void;
  toggleComponentVisible: (compId: string) => void;
  isolateComponent: (compId: string | null) => void;
  restoreAllComponents: () => void;
  selectComponent: (compId: string | null) => void;
  captureThumbnail: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

export interface Universal3DViewerProps {
  asset: Asset3DItem;
  modelUrl: string | null;
  modelFormat: ModelFormat;
  annotations?: Asset3DAnnotation[];
  onAddAnnotation?: (ann: Asset3DAnnotation) => void | Promise<void>;
  onRemoveAnnotation?: (id: string) => void | Promise<void>;
  onThumbnailCaptured?: (dataUrl: string) => void | Promise<void>;
  onModelAnalyzed?: (stats: ModelAnalysisSummary) => void;
  // P3.4 Explorer integration hooks (all optional; standalone modal mode stays automatic)
  hideBuiltInHeader?: boolean;
  hideBuiltInSidebars?: boolean;
  className?: string;
  selectedComponentId?: string | null;
  onSelectComponent?: (compId: string | null) => void;
  isolatedComponentId?: string | null;
  onIsolateChange?: (compId: string | null) => void;
  renderSettings?: ViewerRenderSettings;
  onRenderSettingsChange?: (next: ViewerRenderSettings) => void;
  onLoadingStateChange?: (state: ViewerLoadingState) => void;
  onComponentsChange?: (components: Analyzed3DComponent[]) => void;
  activePinId?: string | null;
  onActivePinChange?: (pinId: string | null) => void;
  pinMode?: boolean;
  onPinModeChange?: (active: boolean) => void;
  fullscreenTargetRef?: React.RefObject<HTMLElement | null>;
}

const GENERIC_NODE_NAME_REGEX =
  /^(?:component|object|node|mesh|group|scene|rootnode|root|part|submesh|primitive|geometry|untitled|default|stl[\s_-]*mesh|ply[\s_-]*mesh|model|polysurface|psphere|pcube|pcylinder|cube|sphere|cylinder|plane|cone|torus|icosphere|sketchfab_model|sketchfab_scene|gltf_scene)(?:[\s_.-]*\d+)*(?:\.\d+)?$/i;

export function isMeaningfulNodeName(rawName?: string | null): boolean {
  if (!rawName) return false;
  const trimmed = rawName.trim();
  if (trimmed.length < 2) return false;
  if (/^[\d\s_.-]+$/.test(trimmed)) return false;
  if (GENERIC_NODE_NAME_REGEX.test(trimmed)) return false;
  return true;
}

function detectSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|Software|Mesa/i.test(renderer);
  } catch {
    return false;
  }
}

function disposeObjectTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        for (const val of Object.values(mat)) {
          if (val && typeof val === 'object' && (val as THREE.Texture).isTexture) {
            (val as THREE.Texture).dispose();
          }
        }
        mat.dispose();
      });
    }
  });
}

function snapshotMaterialOriginals(mat: THREE.Material) {
  if (mat.userData.__origSnapshotted) return;
  mat.userData.__origSnapshotted = true;
  mat.userData.__origTransparent = mat.transparent;
  mat.userData.__origOpacity = mat.opacity;
  mat.userData.__origDepthWrite = mat.depthWrite;
  mat.userData.__origWireframe = 'wireframe' in mat ? Boolean((mat as THREE.MeshStandardMaterial).wireframe) : false;
  if ('emissive' in mat) {
    const std = mat as THREE.MeshStandardMaterial;
    mat.userData.__origEmissive = std.emissive.getHex();
    mat.userData.__origEmissiveIntensity = std.emissiveIntensity ?? 1;
  }
  if ('color' in mat && (mat as THREE.MeshBasicMaterial).color) {
    mat.userData.__origColorHex = (mat as THREE.MeshBasicMaterial).color.getHex();
  }
}

function getCameraOffsetForPreset(preset: CameraViewPreset, dist: number): THREE.Vector3 {
  const dir = new THREE.Vector3();
  switch (preset) {
    case 'front':
      dir.set(0, 0.06, 1);
      break;
    case 'back':
      dir.set(0, 0.06, -1);
      break;
    case 'left':
      dir.set(-1, 0.06, 0);
      break;
    case 'right':
      dir.set(1, 0.06, 0);
      break;
    case 'top':
      dir.set(0, 1, 0.08);
      break;
    case 'bottom':
      dir.set(0, -1, 0.08);
      break;
    case 'reset':
    default:
      dir.set(0.72, 0.45, 0.85);
      break;
  }
  return dir.normalize().multiplyScalar(dist);
}

export const DEFAULT_VIEWER_SETTINGS: ViewerRenderSettings = {
  environmentPreset: 'studio',
  keyLightIntensity: 2.2,
  ambientIntensity: 0.6,
  renderMode: 'solid',
  wireframe: false,
  showGrid: true,
  showAxes: false,
  showLabels: false,
  backgroundMode: 'slate_dark'
};

const Universal3DViewer = forwardRef<Universal3DViewerHandle, Universal3DViewerProps>(
  function Universal3DViewer(
    {
      asset,
      modelUrl,
      modelFormat,
      annotations = [],
      onAddAnnotation,
      onRemoveAnnotation,
      onThumbnailCaptured,
      onModelAnalyzed,
      hideBuiltInHeader = false,
      hideBuiltInSidebars = false,
      className,
      selectedComponentId: controlledSelectedId,
      onSelectComponent,
      isolatedComponentId: controlledIsolatedId,
      onIsolateChange,
      renderSettings: controlledSettings,
      onRenderSettingsChange,
      onLoadingStateChange,
      onComponentsChange,
      activePinId: controlledActivePinId,
      onActivePinChange,
      pinMode: controlledPinMode,
      onPinModeChange,
      fullscreenTargetRef
    },
    ref
  ) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasHostRef = useRef<HTMLDivElement | null>(null);

    const [internalSettings, setInternalSettings] =
      useState<ViewerRenderSettings>(DEFAULT_VIEWER_SETTINGS);
    const settings = controlledSettings ?? internalSettings;

    const updateSettings = useCallback(
      (
        updater:
          | ViewerRenderSettings
          | ((prev: ViewerRenderSettings) => ViewerRenderSettings)
      ) => {
        if (onRenderSettingsChange) {
          const next = typeof updater === 'function' ? updater(settings) : updater;
          onRenderSettingsChange(next);
        } else {
          setInternalSettings(updater);
        }
      },
      [onRenderSettingsChange, settings]
    );

    const [showControlsDrawer, setShowControlsDrawer] = useState(false);
    const [showComponentsDrawer, setShowComponentsDrawer] = useState<boolean>(() =>
      typeof window !== 'undefined' ? window.innerWidth >= 768 : true
    );
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [internalPinMode, setInternalPinMode] = useState(false);
    const pinMode = controlledPinMode ?? internalPinMode;
    const setPinMode = useCallback(
      (val: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof val === 'function' ? val(pinMode) : val;
        if (onPinModeChange) onPinModeChange(next);
        else setInternalPinMode(next);
      },
      [onPinModeChange, pinMode]
    );

    const [pendingPinPos, setPendingPinPos] = useState<[number, number, number] | null>(null);
    const [pendingPinComp, setPendingPinComp] = useState<string | undefined>(undefined);
    const [pinLabelDraft, setPinLabelDraft] = useState('');
    const [pinNoteDraft, setPinNoteDraft] = useState('');

    const [internalActivePinId, setInternalActivePinId] = useState<string | null>(null);
    const activePinId = controlledActivePinId !== undefined ? controlledActivePinId : internalActivePinId;
    const setActivePinId = useCallback(
      (val: string | null) => {
        if (onActivePinChange) onActivePinChange(val);
        else setInternalActivePinId(val);
      },
      [onActivePinChange]
    );

    const [loadingState, setLoadingState] = useState<ViewerLoadingState>({
      status: 'idle',
      percent: 0
    });
    const [contextLost, setContextLost] = useState(false);
    const [softwareGlWarning, setSoftwareGlWarning] = useState(false);

    const [components, setComponents] = useState<Analyzed3DComponent[]>([]);

    const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
    const selectedComponentId =
      controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
    const setSelectedComponentId = useCallback(
      (val: string | null | ((prev: string | null) => string | null)) => {
        const next = typeof val === 'function' ? val(selectedComponentId) : val;
        if (onSelectComponent) onSelectComponent(next);
        else setInternalSelectedId(next);
      },
      [onSelectComponent, selectedComponentId]
    );

    const [internalIsolatedId, setInternalIsolatedId] = useState<string | null>(null);
    const isolatedComponentId =
      controlledIsolatedId !== undefined ? controlledIsolatedId : internalIsolatedId;
    const setIsolatedComponentId = useCallback(
      (val: string | null) => {
        if (onIsolateChange) onIsolateChange(val);
        else setInternalIsolatedId(val);
      },
      [onIsolateChange]
    );

    const [meshStats, setMeshStats] = useState<{
      vertices: number;
      triangles: number;
      components: number;
      dimensions: [number, number, number];
    } | null>(null);

    const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);
    const [projectedPins, setProjectedPins] = useState<ProjectedPin[]>([]);
    const [captureNotice, setCaptureNotice] = useState<string | null>(null);

    // Camera transition state for damped view presets & focus actions
    const cameraTransitionRef = useRef<{
      active: boolean;
      goalPos: THREE.Vector3;
      goalTarget: THREE.Vector3;
    }>({
      active: false,
      goalPos: new THREE.Vector3(3.2, 2.2, 3.8),
      goalTarget: new THREE.Vector3(0, 0, 0)
    });

    const engineRef = useRef<{
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
      keyLight: THREE.DirectionalLight;
      fillLight: THREE.DirectionalLight;
      hemiLight: THREE.HemisphereLight;
      gridHelper: THREE.GridHelper;
      axesHelper: THREE.AxesHelper;
      modelGroup: THREE.Group | null;
      componentEntries: ComponentEntry[];
      fitRadius: number;
      isSoftware: boolean;
      requestRender: () => void;
      renderNow: () => void;
    } | null>(null);

    const settingsRef = useRef(settings);
    settingsRef.current = settings;
    const annotationsRef = useRef(annotations);
    annotationsRef.current = annotations;
    const selectedIdRef = useRef(selectedComponentId);
    selectedIdRef.current = selectedComponentId;
    const isolatedIdRef = useRef(isolatedComponentId);
    isolatedIdRef.current = isolatedComponentId;
    const pinModeRef = useRef(pinMode);
    pinModeRef.current = pinMode;

    const onModelAnalyzedRef = useRef(onModelAnalyzed);
    onModelAnalyzedRef.current = onModelAnalyzed;
    const onLoadingStateChangeRef = useRef(onLoadingStateChange);
    onLoadingStateChangeRef.current = onLoadingStateChange;
    const onComponentsChangeRef = useRef(onComponentsChange);
    onComponentsChangeRef.current = onComponentsChange;

    const emitLoadingState = useCallback((next: ViewerLoadingState) => {
      setLoadingState(next);
      onLoadingStateChangeRef.current?.(next);
    }, []);

    // Project 3D component labels & user pins onto 2D viewport overlay
    const updateProjectedOverlays = useCallback(() => {
      const eng = engineRef.current;
      const host = canvasHostRef.current;
      if (!eng || !host || !eng.modelGroup) {
        setProjectedLabels([]);
        setProjectedPins([]);
        return;
      }

      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w <= 0 || h <= 0) return;

      eng.camera.updateMatrixWorld();
      const vec = new THREE.Vector3();

      if (settingsRef.current.showLabels && eng.componentEntries.length > 0) {
        const nextLabels: ProjectedLabel[] = [];
        const meaningful = eng.componentEntries.filter((e) => e.hasMeaningfulName);
        const sourceList = meaningful.slice(0, 24);
        for (const entry of sourceList) {
          if (!entry.mesh.visible) continue;
          vec.copy(entry.localCenter).applyMatrix4(eng.modelGroup.matrixWorld);
          vec.project(eng.camera);
          if (vec.z > 1) continue;
          const sx = (vec.x * 0.5 + 0.5) * w;
          const sy = (-vec.y * 0.5 + 0.5) * h;
          if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
          nextLabels.push({
            id: entry.id,
            text: entry.name,
            x: sx,
            y: sy,
            isSelected: selectedIdRef.current === entry.id
          });
        }
        setProjectedLabels(nextLabels);
      } else {
        setProjectedLabels([]);
      }

      if (annotationsRef.current.length > 0) {
        const nextPins: ProjectedPin[] = [];
        for (const ann of annotationsRef.current) {
          vec
            .set(ann.position[0], ann.position[1], ann.position[2])
            .applyMatrix4(eng.modelGroup.matrixWorld);
          vec.project(eng.camera);
          if (vec.z > 1) continue;
          const sx = (vec.x * 0.5 + 0.5) * w;
          const sy = (-vec.y * 0.5 + 0.5) * h;
          if (sx < -16 || sx > w + 16 || sy < -16 || sy > h + 16) continue;
          nextPins.push({ annotation: ann, x: sx, y: sy });
        }
        setProjectedPins(nextPins);
      } else {
        setProjectedPins([]);
      }
    }, []);

    // Initialize Three.js WebGL context once on mount
    useEffect(() => {
      const host = canvasHostRef.current;
      if (!host) return;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
      const gl = renderer.getContext();
      const isSoftware = detectSoftwareGl(gl);
      setSoftwareGlWarning(isSoftware);

      renderer.setPixelRatio(isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setSize(host.clientWidth || 640, host.clientHeight || 420);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';

      host.innerHTML = '';
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envTarget = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envTarget.texture;
      roomEnv.dispose();
      pmrem.dispose();

      const camera = new THREE.PerspectiveCamera(
        45,
        Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight),
        0.05,
        200
      );
      camera.position.set(3.2, 2.2, 3.8);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftware;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.35;
      controls.maxDistance = 40;
      controls.target.set(0, 0, 0);

      // Three-point scientific illumination
      const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x334155, 0.6);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(5, 8, 6);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xcbd5e1, 0.9);
      fillLight.position.set(-5, 3, -4);
      scene.add(fillLight);

      const gridHelper = new THREE.GridHelper(8, 16, 0x334155, 0x1e293b);
      gridHelper.position.y = -1.6;
      scene.add(gridHelper);

      const axesHelper = new THREE.AxesHelper(2.2);
      axesHelper.visible = false;
      scene.add(axesHelper);

      let rafId = 0;
      let renderRequested = false;
      let lastTickMs = performance.now();

      const renderNow = () => {
        renderer.render(scene, camera);
        updateProjectedOverlays();
      };

      const tick = (nowMs: number) => {
        rafId = 0;
        const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastTickMs) / 1000));
        lastTickMs = nowMs;

        let transitionMoving = false;
        const trans = cameraTransitionRef.current;
        if (trans.active) {
          if (isSoftware) {
            camera.position.copy(trans.goalPos);
            controls.target.copy(trans.goalTarget);
            trans.active = false;
          } else {
            camera.position.x = THREE.MathUtils.damp(camera.position.x, trans.goalPos.x, 8, dt);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, trans.goalPos.y, 8, dt);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, trans.goalPos.z, 8, dt);

            controls.target.x = THREE.MathUtils.damp(controls.target.x, trans.goalTarget.x, 8, dt);
            controls.target.y = THREE.MathUtils.damp(controls.target.y, trans.goalTarget.y, 8, dt);
            controls.target.z = THREE.MathUtils.damp(controls.target.z, trans.goalTarget.z, 8, dt);

            if (
              camera.position.distanceTo(trans.goalPos) < 0.008 &&
              controls.target.distanceTo(trans.goalTarget) < 0.008
            ) {
              camera.position.copy(trans.goalPos);
              controls.target.copy(trans.goalTarget);
              trans.active = false;
            } else {
              transitionMoving = true;
            }
          }
          controls.update();
        }

        const dampingMoving = !isSoftware && controls.enableDamping ? controls.update() : false;
        renderNow();

        if (transitionMoving || dampingMoving) {
          renderRequested = true;
          rafId = requestAnimationFrame(tick);
        } else {
          renderRequested = false;
        }
      };

      const requestRender = () => {
        if (renderRequested) return;
        renderRequested = true;
        lastTickMs = performance.now();
        rafId = requestAnimationFrame(tick);
      };

      const handleControlsStart = () => {
        // Never fight user drag/zoom with active camera preset transition
        cameraTransitionRef.current.active = false;
      };

      controls.addEventListener('change', requestRender);
      controls.addEventListener('start', handleControlsStart);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const handleContextRestored = () => {
        setContextLost(false);
        requestRender();
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      const resizeObserver = new ResizeObserver(() => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (w <= 0 || h <= 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      });
      resizeObserver.observe(host);

      engineRef.current = {
        renderer,
        scene,
        camera,
        controls,
        keyLight,
        fillLight,
        hemiLight,
        gridHelper,
        axesHelper,
        modelGroup: null,
        componentEntries: [],
        fitRadius: 2.2,
        isSoftware,
        requestRender,
        renderNow
      };

      requestRender();

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        controls.removeEventListener('change', requestRender);
        controls.removeEventListener('start', handleControlsStart);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
        if (engineRef.current?.modelGroup) {
          scene.remove(engineRef.current.modelGroup);
          disposeObjectTree(engineRef.current.modelGroup);
        }
        controls.dispose();
        envTarget.dispose();
        renderer.dispose();
        host.innerHTML = '';
        engineRef.current = null;
      };
    }, [updateProjectedOverlays]);

    // Apply Solid / Wireframe / X-Ray + component highlight consistently
    const applyMaterials = useCallback(() => {
      const eng = engineRef.current;
      if (!eng || !eng.modelGroup) return;

      const mode: RenderVisualizationMode =
        settingsRef.current.renderMode || (settingsRef.current.wireframe ? 'wireframe' : 'solid');
      const selId = selectedIdRef.current;
      const isoId = isolatedIdRef.current;
      const hasFocusInXray = Boolean(selId || isoId);

      for (const entry of eng.componentEntries) {
        const isSelected = entry.id === selId;
        const isFocused = isSelected || entry.id === isoId;
        const mats = Array.isArray(entry.mesh.material)
          ? entry.mesh.material
          : [entry.mesh.material];

        mats.forEach((mat) => {
          if (!mat) return;
          snapshotMaterialOriginals(mat);

          const origTransparent = Boolean(mat.userData.__origTransparent);
          const origOpacity =
            typeof mat.userData.__origOpacity === 'number' ? mat.userData.__origOpacity : 1;
          const origDepthWrite =
            typeof mat.userData.__origDepthWrite === 'boolean'
              ? mat.userData.__origDepthWrite
              : true;

          // Visualization Mode
          if ('wireframe' in mat) {
            (mat as THREE.MeshStandardMaterial).wireframe = mode === 'wireframe';
          }

          if (mode === 'xray') {
            if (hasFocusInXray && isFocused) {
              mat.transparent = origTransparent;
              mat.opacity = origOpacity;
              mat.depthWrite = origDepthWrite;
            } else {
              mat.transparent = true;
              mat.opacity = hasFocusInXray ? 0.16 : 0.28;
              mat.depthWrite = false;
            }
          } else {
            mat.transparent = origTransparent;
            mat.opacity = origOpacity;
            mat.depthWrite = origDepthWrite;
          }

          // Selection Emissive / Basic Tint Highlight
          if ('emissive' in mat) {
            const std = mat as THREE.MeshStandardMaterial;
            if (isSelected) {
              std.emissive.setHex(0x059669);
              std.emissiveIntensity = mode === 'xray' ? 0.65 : 0.45;
            } else if (mat.userData.__origEmissive !== undefined) {
              std.emissive.setHex(mat.userData.__origEmissive);
              std.emissiveIntensity = mat.userData.__origEmissiveIntensity ?? 1;
            }
          } else if ('color' in mat && mat.userData.__origColorHex !== undefined) {
            const basic = mat as THREE.MeshBasicMaterial;
            if (isSelected) {
              basic.color.setHex(0x10b981);
            } else {
              basic.color.setHex(mat.userData.__origColorHex);
            }
          }

          mat.needsUpdate = true;
        });
      }

      eng.requestRender();
    }, []);

    // Apply lighting, environment, grid/axes & render mode reactively
    useEffect(() => {
      const eng = engineRef.current;
      if (!eng) return;

      const bgHex = settings.backgroundMode === 'clinical_light' ? 0xf1f5f9 : 0x0f172a;
      eng.scene.background = new THREE.Color(bgHex);
      eng.gridHelper.visible = settings.showGrid;
      eng.axesHelper.visible = settings.showAxes;

      const presetMult =
        settings.environmentPreset === 'clinical_bright'
          ? 1.25
          : settings.environmentPreset === 'contrast_dark'
          ? 0.85
          : 1.0;

      eng.keyLight.intensity = settings.keyLightIntensity * presetMult;
      eng.fillLight.intensity = settings.environmentPreset === 'contrast_dark' ? 0.35 : 0.9;
      eng.hemiLight.intensity = settings.ambientIntensity * presetMult;

      applyMaterials();
      eng.requestRender();
    }, [settings, applyMaterials]);

    // Re-apply highlight/xray when selection or isolation changes
    useEffect(() => {
      applyMaterials();
    }, [selectedComponentId, isolatedComponentId, applyMaterials]);

    // Re-project overlays when annotations or active pin change
    useEffect(() => {
      engineRef.current?.requestRender();
    }, [annotations, activePinId, settings.showLabels]);

    const setCameraPreset = useCallback((preset: CameraViewPreset, immediate = false) => {
      const eng = engineRef.current;
      if (!eng) return;
      const dist = Math.max(2.6, eng.fitRadius * 2.15);
      const offset = getCameraOffsetForPreset(preset, dist);
      const goalTarget = new THREE.Vector3(0, 0, 0);

      if (immediate || eng.isSoftware) {
        cameraTransitionRef.current.active = false;
        eng.camera.position.copy(offset);
        eng.controls.target.copy(goalTarget);
        eng.controls.update();
      } else {
        cameraTransitionRef.current = {
          active: true,
          goalPos: offset,
          goalTarget
        };
      }
      eng.requestRender();
    }, []);

    const resetCamera = useCallback(() => {
      setCameraPreset('reset', false);
    }, [setCameraPreset]);

    const focusComponent = useCallback((compId: string) => {
      const eng = engineRef.current;
      if (!eng || !eng.modelGroup) return;
      const entry = eng.componentEntries.find((e) => e.id === compId);
      if (!entry) return;

      const box = new THREE.Box3().setFromObject(entry.mesh);
      const center = new THREE.Vector3();
      const sphere = new THREE.Sphere();
      box.getCenter(center);
      box.getBoundingSphere(sphere);

      const dir = eng.camera.position.clone().sub(eng.controls.target);
      if (dir.lengthSq() < 0.001) dir.set(0.72, 0.45, 0.85);
      dir.normalize();
      const dist = Math.max(1.2, Math.min(eng.fitRadius * 2.5, sphere.radius * 2.8));
      const goalPos = center.clone().addScaledVector(dir, dist);

      if (eng.isSoftware) {
        cameraTransitionRef.current.active = false;
        eng.controls.target.copy(center);
        eng.camera.position.copy(goalPos);
        eng.controls.update();
      } else {
        cameraTransitionRef.current = {
          active: true,
          goalPos,
          goalTarget: center
        };
      }
      eng.requestRender();
    }, []);

    const focusPoint = useCallback((localPoint: [number, number, number]) => {
      const eng = engineRef.current;
      if (!eng || !eng.modelGroup) return;
      const worldCenter = new THREE.Vector3(
        localPoint[0],
        localPoint[1],
        localPoint[2]
      ).applyMatrix4(eng.modelGroup.matrixWorld);

      const dir = eng.camera.position.clone().sub(eng.controls.target);
      if (dir.lengthSq() < 0.001) dir.set(0.72, 0.45, 0.85);
      dir.normalize();
      const dist = Math.max(1.6, eng.fitRadius * 1.45);
      const goalPos = worldCenter.clone().addScaledVector(dir, dist);

      if (eng.isSoftware) {
        cameraTransitionRef.current.active = false;
        eng.controls.target.copy(worldCenter);
        eng.camera.position.copy(goalPos);
        eng.controls.update();
      } else {
        cameraTransitionRef.current = {
          active: true,
          goalPos,
          goalTarget: worldCenter
        };
      }
      eng.requestRender();
    }, []);

    // Load real 3D model URL whenever asset/modelUrl changes
    useEffect(() => {
      const eng = engineRef.current;
      if (!eng) return;

      if (eng.modelGroup) {
        eng.scene.remove(eng.modelGroup);
        disposeObjectTree(eng.modelGroup);
        eng.modelGroup = null;
        eng.componentEntries = [];
      }
      setComponents([]);
      onComponentsChangeRef.current?.([]);
      setSelectedComponentId(null);
      setIsolatedComponentId(null);
      setMeshStats(null);

      if (!modelUrl) {
        emitLoadingState({
          status: 'error',
          percent: 0,
          errorMessage:
            'No binary 3D file or external model URL is available for this asset.'
        });
        eng.requestRender();
        return;
      }

      let cancelled = false;
      emitLoadingState({ status: 'loading', percent: 5 });

      const normalizeAndMount = (loadedRoot: THREE.Object3D, loadedFmt: ModelFormat) => {
        if (cancelled) {
          disposeObjectTree(loadedRoot);
          return;
        }

        const wrapper = new THREE.Group();
        wrapper.add(loadedRoot);

        loadedRoot.updateMatrixWorld(true);
        const rawBox = new THREE.Box3().setFromObject(loadedRoot);
        const rawSize = new THREE.Vector3();
        const rawCenter = new THREE.Vector3();
        rawBox.getSize(rawSize);
        rawBox.getCenter(rawCenter);

        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.0001);
        const scale = 3.2 / maxDim;
        loadedRoot.scale.multiplyScalar(scale);
        loadedRoot.position.sub(rawCenter.multiplyScalar(scale));
        wrapper.updateMatrixWorld(true);

        const normBox = new THREE.Box3().setFromObject(wrapper);
        const normSize = new THREE.Vector3();
        normBox.getSize(normSize);
        const sphere = new THREE.Sphere();
        normBox.getBoundingSphere(sphere);

        eng.gridHelper.position.y = normBox.min.y - 0.05;
        eng.fitRadius = Math.max(1.2, sphere.radius);

        const entries: ComponentEntry[] = [];
        let totalVertices = 0;
        let totalTriangles = 0;
        let partIdx = 1;
        const isMolecularFmt = loadedFmt === 'pdb' || loadedFmt === 'sdf' || loadedFmt === 'mol';
        const isSingleFormat = loadedFmt === 'stl' || loadedFmt === 'ply';

        wrapper.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.frustumCulled = true;

            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((m) => {
                const cloned = m.clone();
                snapshotMaterialOriginals(cloned);
                return cloned;
              });
            } else if (mesh.material) {
              const cloned = mesh.material.clone();
              snapshotMaterialOriginals(cloned);
              mesh.material = cloned;
            }

            const posAttr = mesh.geometry?.getAttribute('position');
            let meshVerts = 0;
            let meshTris = 0;
            if (posAttr) {
              const instCount = (mesh as THREE.InstancedMesh).isInstancedMesh
                ? (mesh as THREE.InstancedMesh).count
                : 1;
              meshVerts = Math.round(posAttr.count * instCount);
              meshTris = Math.round(
                (mesh.geometry.index ? mesh.geometry.index.count / 3 : posAttr.count / 3) *
                  instCount
              );
              totalVertices += meshVerts;
              totalTriangles += meshTris;
            }

            const meshBox = new THREE.Box3().setFromObject(mesh);
            const meshCenter = new THREE.Vector3();
            meshBox.getCenter(meshCenter);

            const directMeshName = mesh.name?.trim() || '';
            let ancestorName = '';
            let p: THREE.Object3D | null = mesh.parent;
            while (p && p !== wrapper) {
              if (p.name?.trim() && isMeaningfulNodeName(p.name)) {
                ancestorName = p.name.trim();
                break;
              }
              p = p.parent;
            }

            const meshNameMeaningful = !isSingleFormat && isMeaningfulNodeName(directMeshName);
            const ancestorMeaningful = !isSingleFormat && isMeaningfulNodeName(ancestorName);
            const hasMeaningfulName = isMolecularFmt
              ? true
              : meshNameMeaningful || ancestorMeaningful;

            const displayName = isSingleFormat
              ? `${asset.name || loadedFmt.toUpperCase()} (Unified Mesh)`
              : meshNameMeaningful
              ? directMeshName
              : ancestorMeaningful
              ? `${ancestorName} · Mesh ${partIdx}`
              : `Unnamed Mesh ${partIdx}`;

            const rawNodeName = directMeshName || ancestorName || `Unnamed Node #${partIdx}`;
            const firstMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const materialName = firstMat?.name?.trim() || undefined;
            partIdx += 1;

            entries.push({
              id: `comp_${entries.length}_${mesh.uuid.slice(0, 6)}`,
              name: displayName,
              rawNodeName,
              parentName: ancestorName || undefined,
              hasMeaningfulName,
              vertexCount: meshVerts,
              triangleCount: meshTris,
              materialName,
              mesh,
              localCenter: meshCenter,
              visible: true
            });
          }
        });

        eng.modelGroup = wrapper;
        eng.componentEntries = entries;
        eng.scene.add(wrapper);

        const analyzedList: Analyzed3DComponent[] = entries.map((e) => ({
          id: e.id,
          name: e.name,
          rawNodeName: e.rawNodeName,
          parentName: e.parentName,
          hasMeaningfulName: e.hasMeaningfulName,
          visible: e.visible,
          vertexCount: e.vertexCount,
          triangleCount: e.triangleCount,
          materialName: e.materialName,
          localCenter: [
            Number(e.localCenter.x.toFixed(4)),
            Number(e.localCenter.y.toFixed(4)),
            Number(e.localCenter.z.toFixed(4))
          ]
        }));

        setComponents(analyzedList);
        onComponentsChangeRef.current?.(analyzedList);

        const dimensions: [number, number, number] = [
          Number(rawSize.x.toFixed(2)),
          Number(rawSize.y.toFixed(2)),
          Number(rawSize.z.toFixed(2))
        ];
        const stats = {
          vertices: Math.round(totalVertices),
          triangles: Math.round(totalTriangles),
          components: entries.length,
          dimensions
        };
        setMeshStats(stats);
        onModelAnalyzedRef.current?.({
          componentCount: entries.length,
          vertexCount: stats.vertices,
          triangleCount: stats.triangles,
          dimensions,
          components: analyzedList
        });

        applyMaterials();
        setCameraPreset('reset', true);
        emitLoadingState({ status: 'ready', percent: 100 });
        eng.requestRender();
      };

      const handleLoadError = (err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
            ? err
            : 'Failed to parse 3D model file.';
        const helpfulMsg =
          modelFormat === 'gltf'
            ? `${msg} Tip: If this .gltf references external .bin or texture files, upload the complete .ZIP archive (or select all files together) in "Upload Local File".`
            : msg;
        emitLoadingState({
          status: 'error',
          percent: 0,
          errorMessage: helpfulMsg
        });
      };

      const onProgress = (evt: ProgressEvent) => {
        if (cancelled) return;
        if (evt.lengthComputable && evt.total > 0) {
          emitLoadingState({
            status: 'loading',
            percent: Math.min(96, Math.round((evt.loaded / evt.total) * 100))
          });
        }
      };

      const extraRevokeUrls: string[] = [];

      const loadFormatFromUrl = (
        targetUrl: string,
        fmt: ModelFormat,
        manager?: THREE.LoadingManager,
        mtlUrl?: string
      ) => {
        if (fmt === 'glb' || fmt === 'gltf') {
          const draco = new DRACOLoader();
          draco.setDecoderPath('./draco/');
          const loader = new GLTFLoader(manager);
          loader.setDRACOLoader(draco);
          loader.load(
            targetUrl,
            (gltf) => {
              draco.dispose();
              normalizeAndMount(gltf.scene, fmt);
            },
            onProgress,
            (err) => {
              draco.dispose();
              handleLoadError(err);
            }
          );
        } else if (fmt === 'stl') {
          const loader = new STLLoader(manager);
          loader.load(
            targetUrl,
            (geometry) => {
              geometry.computeVertexNormals();
              const hasColor = geometry.hasAttribute('color');
              const mat = new THREE.MeshStandardMaterial({
                color: hasColor ? 0xffffff : 0xcbd5e1,
                vertexColors: hasColor,
                roughness: 0.45,
                metalness: 0.12
              });
              const mesh = new THREE.Mesh(geometry, mat);
              mesh.name = '';
              normalizeAndMount(mesh, fmt);
            },
            onProgress,
            handleLoadError
          );
        } else if (fmt === 'obj') {
          const runObj = (materials?: MTLLoader.MaterialCreator) => {
            const loader = new OBJLoader(manager);
            if (materials) {
              materials.preload();
              loader.setMaterials(materials);
            }
            loader.load(
              targetUrl,
              (group) => {
                group.traverse((child) => {
                  if ((child as THREE.Mesh).isMesh) {
                    const m = child as THREE.Mesh;
                    if (!m.material) {
                      m.material = new THREE.MeshStandardMaterial({
                        color: 0xd1d5db,
                        roughness: 0.5,
                        metalness: 0.1
                      });
                    }
                  }
                });
                normalizeAndMount(group, fmt);
              },
              onProgress,
              handleLoadError
            );
          };

          if (mtlUrl) {
            const mtlLoader = new MTLLoader(manager);
            mtlLoader.load(
              mtlUrl,
              (mats) => runObj(mats),
              undefined,
              () => runObj()
            );
          } else {
            runObj();
          }
        } else if (fmt === 'ply') {
          const loader = new PLYLoader(manager);
          loader.load(
            targetUrl,
            (geometry) => {
              geometry.computeVertexNormals();
              const hasColor = geometry.hasAttribute('color');
              const mat = new THREE.MeshStandardMaterial({
                color: hasColor ? 0xffffff : 0xcbd5e1,
                vertexColors: hasColor,
                roughness: 0.45,
                metalness: 0.1
              });
              const mesh = new THREE.Mesh(geometry, mat);
              mesh.name = '';
              normalizeAndMount(mesh, fmt);
            },
            onProgress,
            handleLoadError
          );
        } else if (fmt === 'sdf' || fmt === 'mol') {
          fetch(targetUrl)
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.text();
            })
            .then((txt) => {
              const molGroup = buildMolecularGroupFromSdf(txt, asset.name || 'Molecule');
              normalizeAndMount(molGroup, fmt);
            })
            .catch(handleLoadError);
        } else if (fmt === 'pdb') {
          fetch(targetUrl)
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.text();
            })
            .then((txt) => {
              const pdbGroup = buildMacromoleculeGroupFromPdb(
                txt,
                asset.name || 'Protein Structure'
              );
              normalizeAndMount(pdbGroup, fmt);
            })
            .catch(handleLoadError);
        } else {
          handleLoadError(
            new Error(
              `Unsupported 3D file format ".${String(
                fmt
              ).toUpperCase()}". PharmaLab supports GLB, glTF, ZIP bundles, OBJ, STL, PLY, PDB, SDF, and MOL.`
            )
          );
        }
      };

      if (modelFormat === 'zip') {
        fetch(modelUrl)
          .then((r) => {
            if (!r.ok) throw new Error(`Unable to read ZIP bundle (HTTP ${r.status}).`);
            return r.arrayBuffer();
          })
          .then((buf) => {
            if (cancelled) return;
            const entries = unzipSync(new Uint8Array(buf));
            const urlMap = new Map<string, string>();
            const baseMap = new Map<string, string>();
            const createdBlobSet = new Set<string>([modelUrl]);
            const modelFiles: Array<{ path: string; fmt: ModelFormat }> = [];
            let mtlUrl: string | undefined;
            let mtlDir = '';

            const priority: Record<ModelFormat, number> = {
              glb: 10,
              gltf: 9,
              obj: 7,
              stl: 6,
              ply: 5,
              pdb: 4,
              sdf: 3,
              mol: 2,
              zip: 0
            };

            for (const [rawPath, bytes] of Object.entries(entries)) {
              if (rawPath.endsWith('/') || rawPath.startsWith('__MACOSX/')) continue;
              const normPath = rawPath.replace(/\\/g, '/').replace(/^\.?\//, '');
              const lower = normPath.toLowerCase();
              const baseName = lower.split('/').pop() || lower;
              const copy = new Uint8Array(bytes.byteLength);
              copy.set(bytes);
              const blobUrl = URL.createObjectURL(new Blob([copy.buffer]));
              extraRevokeUrls.push(blobUrl);
              createdBlobSet.add(blobUrl);
              urlMap.set(lower, blobUrl);
              if (!baseMap.has(baseName)) baseMap.set(baseName, blobUrl);

              if (lower.endsWith('.mtl') && !mtlUrl) {
                mtlUrl = blobUrl;
                mtlDir = lower.includes('/') ? lower.slice(0, lower.lastIndexOf('/') + 1) : '';
              }

              const extMap: Array<[string, ModelFormat]> = [
                ['.glb', 'glb'],
                ['.gltf', 'gltf'],
                ['.obj', 'obj'],
                ['.stl', 'stl'],
                ['.ply', 'ply'],
                ['.pdb', 'pdb'],
                ['.ent', 'pdb'],
                ['.sdf', 'sdf'],
                ['.mol', 'mol']
              ];
              for (const [ext, fmt] of extMap) {
                if (lower.endsWith(ext)) {
                  modelFiles.push({ path: normPath, fmt });
                  break;
                }
              }
            }

            if (modelFiles.length === 0) {
              throw new Error(
                'This ZIP archive does not contain a supported .glb, .gltf, .obj, .stl, .ply, .pdb, or .sdf 3D model.'
              );
            }

            modelFiles.sort((a, b) => priority[b.fmt] - priority[a.fmt]);
            const primary = modelFiles[0];
            const primaryBlobUrl = urlMap.get(primary.path.toLowerCase())!;
            const primaryDir = primary.path.includes('/')
              ? primary.path.slice(0, primary.path.lastIndexOf('/') + 1).toLowerCase()
              : '';

            const manager = new THREE.LoadingManager();
            manager.setURLModifier((reqUrl) => {
              if (
                createdBlobSet.has(reqUrl) ||
                reqUrl.startsWith('data:') ||
                reqUrl.includes('draco')
              ) {
                return reqUrl;
              }
              const withoutBlobOrigin = reqUrl.startsWith('blob:')
                ? reqUrl.replace(/^blob:(?:null|https?:\/\/[^/]+)\//i, '')
                : reqUrl;
              const cleanReq = decodeURIComponent(withoutBlobOrigin.split('?')[0].split('#')[0])
                .replace(/\\/g, '/')
                .replace(/^\.?\//, '')
                .toLowerCase();
              if (urlMap.has(cleanReq)) return urlMap.get(cleanReq)!;
              if (primaryDir && urlMap.has(primaryDir + cleanReq)) {
                return urlMap.get(primaryDir + cleanReq)!;
              }
              if (mtlDir && urlMap.has(mtlDir + cleanReq)) {
                return urlMap.get(mtlDir + cleanReq)!;
              }
              const reqBase = cleanReq.split('/').pop() || cleanReq;
              if (baseMap.has(reqBase)) return baseMap.get(reqBase)!;
              return reqUrl;
            });

            loadFormatFromUrl(primaryBlobUrl, primary.fmt, manager, mtlUrl);
          })
          .catch(handleLoadError);
      } else {
        loadFormatFromUrl(modelUrl, modelFormat);
      }

      return () => {
        cancelled = true;
        extraRevokeUrls.forEach((u) => URL.revokeObjectURL(u));
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelUrl, modelFormat, asset.id]);

    const handleToggleComponentVisible = useCallback((compId: string) => {
      const eng = engineRef.current;
      if (!eng) return;
      setIsolatedComponentId(null);
      setComponents((prev) => {
        const next = prev.map((c) => {
          if (c.id !== compId) return c;
          const nextVis = !c.visible;
          const entry = eng.componentEntries.find((e) => e.id === compId);
          if (entry) {
            entry.visible = nextVis;
            entry.mesh.visible = nextVis;
          }
          return { ...c, visible: nextVis };
        });
        onComponentsChangeRef.current?.(next);
        return next;
      });
      eng.requestRender();
    }, [setIsolatedComponentId]);

    const handleIsolateComponent = useCallback(
      (compId: string | null) => {
        const eng = engineRef.current;
        if (!eng) return;
        setIsolatedComponentId(compId);
        setComponents((prev) => {
          const next = prev.map((c) => {
            const nextVis = compId === null ? true : c.id === compId;
            const entry = eng.componentEntries.find((e) => e.id === c.id);
            if (entry) {
              entry.visible = nextVis;
              entry.mesh.visible = nextVis;
            }
            return { ...c, visible: nextVis };
          });
          onComponentsChangeRef.current?.(next);
          return next;
        });
        if (compId) setSelectedComponentId(compId);
        eng.requestRender();
      },
      [setIsolatedComponentId, setSelectedComponentId]
    );

    const restoreAllComponents = useCallback(() => {
      handleIsolateComponent(null);
    }, [handleIsolateComponent]);

    // Raycast click-to-select or click-to-pin 3D annotation
    const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

    const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerDownPosRef.current;
      pointerDownPosRef.current = null;
      if (!start) return;
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (dist > 6) return;

      const eng = engineRef.current;
      const host = canvasHostRef.current;
      if (!eng || !host || !eng.modelGroup) return;

      const rect = host.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, eng.camera);

      const visibleMeshes = eng.componentEntries
        .filter((entry) => entry.mesh.visible)
        .map((entry) => entry.mesh);

      const hits = raycaster.intersectObjects(visibleMeshes, false);
      if (hits.length === 0) {
        if (!pinModeRef.current) setSelectedComponentId(null);
        return;
      }

      const firstHit = hits[0];
      const matchedEntry = eng.componentEntries.find((entry) => entry.mesh === firstHit.object);

      if (pinModeRef.current && onAddAnnotation) {
        const localPt = firstHit.point.clone();
        eng.modelGroup.worldToLocal(localPt);
        setPendingPinPos([
          Number(localPt.x.toFixed(4)),
          Number(localPt.y.toFixed(4)),
          Number(localPt.z.toFixed(4))
        ]);
        setPendingPinComp(matchedEntry?.name);
        setPinLabelDraft(matchedEntry?.hasMeaningfulName ? matchedEntry.name : '');
        setPinNoteDraft('');
        return;
      }

      if (matchedEntry && eng.componentEntries.length > 1) {
        setSelectedComponentId((prev) => (prev === matchedEntry.id ? null : matchedEntry.id));
      }
    };

    const handleToggleFullscreen = useCallback(async () => {
      const el = fullscreenTargetRef?.current || wrapperRef.current;
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
          // ignore exit error
        }
        setIsFullscreen(false);
      }
    }, [fullscreenTargetRef]);

    useEffect(() => {
      const onFsChange = () => {
        setIsFullscreen(Boolean(document.fullscreenElement));
        engineRef.current?.requestRender();
      };
      document.addEventListener('fullscreenchange', onFsChange);
      return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const handleCaptureThumbnail = useCallback(async () => {
      const eng = engineRef.current;
      if (!eng || !onThumbnailCaptured) return;
      try {
        eng.renderNow();
        const dataUrl = eng.renderer.domElement.toDataURL('image/png');
        await onThumbnailCaptured(dataUrl);
        setCaptureNotice('Preview thumbnail saved to 3D Asset Library.');
        window.setTimeout(() => setCaptureNotice(null), 2600);
      } catch {
        setCaptureNotice('Unable to capture WebGL snapshot.');
      }
    }, [onThumbnailCaptured]);

    useImperativeHandle(
      ref,
      () => ({
        setCameraPreset,
        focusComponent,
        focusPoint,
        toggleComponentVisible: handleToggleComponentVisible,
        isolateComponent: handleIsolateComponent,
        restoreAllComponents,
        selectComponent: (compId) => setSelectedComponentId(compId),
        captureThumbnail: handleCaptureThumbnail,
        toggleFullscreen: handleToggleFullscreen
      }),
      [
        setCameraPreset,
        focusComponent,
        focusPoint,
        handleToggleComponentVisible,
        handleIsolateComponent,
        restoreAllComponents,
        setSelectedComponentId,
        handleCaptureThumbnail,
        handleToggleFullscreen
      ]
    );

    const handleConfirmPin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pendingPinPos || !pinLabelDraft.trim() || !onAddAnnotation) return;
      await onAddAnnotation({
        id: `ann3d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: pinLabelDraft.trim(),
        note: pinNoteDraft.trim() || undefined,
        componentName: pendingPinComp,
        position: pendingPinPos,
        createdAt: Date.now()
      });
      setPendingPinPos(null);
      setPinLabelDraft('');
      setPinNoteDraft('');
      setPinMode(false);
    };

    const selectedComp = useMemo(
      () => components.find((c) => c.id === selectedComponentId) || null,
      [components, selectedComponentId]
    );

    const isHeavyMesh = Boolean(meshStats && meshStats.triangles > 250_000);
    const activeRenderMode: RenderVisualizationMode =
      settings.renderMode || (settings.wireframe ? 'wireframe' : 'solid');

    return (
      <div
        ref={wrapperRef}
        className={`flex flex-col bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none'
            : className || 'rounded-xl sm:rounded-2xl h-[54dvh] min-h-[320px] sm:h-[580px]'
        }`}
      >
        {/* Optional Built-in Top Toolbar (hidden inside immersive Academic Explorer workspace) */}
        {!hideBuiltInHeader && (
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 overflow-x-auto sm:overflow-visible sm:flex-wrap">
            <div className="flex items-center gap-1.5 shrink-0 sm:flex-wrap">
              <button
                type="button"
                onClick={resetCamera}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                title="Reset camera framing"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Reset View</span>
              </button>

              <div
                className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                role="group"
                aria-label="3D rendering mode"
              >
                {(
                  [
                    { id: 'solid', label: 'Solid', icon: Box },
                    { id: 'wireframe', label: 'Wireframe', icon: Grid3X3 },
                    { id: 'xray', label: 'X-Ray', icon: Scan }
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const active = activeRenderMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        updateSettings((s) => ({
                          ...s,
                          renderMode: m.id,
                          wireframe: m.id === 'wireframe'
                        }))
                      }
                      className={`min-h-[28px] px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => updateSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors ${
                  settings.showGrid
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>

              <button
                type="button"
                disabled={!components.some((c) => c.hasMeaningfulName)}
                onClick={() => updateSettings((s) => ({ ...s, showLabels: !s.showLabels }))}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                  settings.showLabels
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
                title={
                  components.some((c) => c.hasMeaningfulName)
                    ? 'Toggle projected 3D node labels'
                    : 'This model contains no named structure nodes'
                }
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Part Labels</span>
              </button>

              {onAddAnnotation && (
                <button
                  type="button"
                  onClick={() => {
                    setPinMode((p) => !p);
                    setPendingPinPos(null);
                  }}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors ${
                    pinMode
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{pinMode ? 'Click Model to Pin' : 'Pin 3D Note'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 sm:flex-wrap">
              {onThumbnailCaptured && loadingState.status === 'ready' && (
                <button
                  type="button"
                  onClick={handleCaptureThumbnail}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 shrink-0"
                  title="Capture thumbnail preview"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Capture Preview</span>
                </button>
              )}

              {!hideBuiltInSidebars && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowComponentsDrawer((v) => {
                        const next = !v;
                        if (next && typeof window !== 'undefined' && window.innerWidth < 768) {
                          setShowControlsDrawer(false);
                        }
                        return next;
                      });
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border shrink-0 ${
                      showComponentsDrawer
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Parts ({components.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowControlsDrawer((v) => {
                        const next = !v;
                        if (next && typeof window !== 'undefined' && window.innerWidth < 768) {
                          setShowComponentsDrawer(false);
                        }
                        return next;
                      });
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border shrink-0 ${
                      showControlsDrawer
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Lighting</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 shrink-0"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Main Split Stage: WebGL Canvas + Optional Side Drawer */}
        <div className="relative flex-1 min-h-0 flex">
          {/* WebGL Canvas Container (zero backdrop-blur over WebGL) */}
          <div
            className="relative flex-1 min-w-0 h-full select-none"
            onPointerDown={handleCanvasPointerDown}
            onPointerUp={handleCanvasPointerUp}
          >
            <div ref={canvasHostRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Projected Component Labels Overlay */}
            {projectedLabels.map((lbl) => (
              <button
                key={lbl.id}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectedComponentId(lbl.id);
                }}
                style={{
                  left: `${lbl.x}px`,
                  top: `${lbl.y}px`,
                  transform: 'translate(-50%, -100%)'
                }}
                className={`absolute pointer-events-auto px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap shadow ${
                  lbl.isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-900/90 text-slate-100 border-slate-700'
                }`}
              >
                {lbl.text}
              </button>
            ))}

            {/* Projected User 3D Annotation Pins */}
            {projectedPins.map((pin, idx) => {
              const open = activePinId === pin.annotation.id;
              return (
                <div
                  key={pin.annotation.id}
                  style={{
                    left: `${pin.x}px`,
                    top: `${pin.y}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                  className="absolute pointer-events-auto z-10"
                >
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setActivePinId(open ? null : pin.annotation.id);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shadow inline-flex items-center gap-1 ${
                      open
                        ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300/60'
                        : 'bg-amber-500 text-slate-950 border-white'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span>{pin.annotation.label}</span>
                  </button>
                  {open && (
                    <div
                      onClick={(ev) => ev.stopPropagation()}
                      className="mt-1 w-60 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 shadow-xl space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold">{pin.annotation.label}</p>
                        {onRemoveAnnotation && (
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveAnnotation(pin.annotation.id);
                              setActivePinId(null);
                            }}
                            className="text-slate-400 hover:text-rose-400"
                            aria-label="Delete 3D pin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {pin.annotation.componentName && (
                        <p className="text-[11px] text-emerald-400">
                          Structure: {pin.annotation.componentName}
                        </p>
                      )}
                      {pin.annotation.note && (
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {pin.annotation.note}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading State */}
            {loadingState.status === 'loading' && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3 text-slate-200 p-6">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                <p className="text-sm font-semibold tabular-nums">
                  Loading 3D Asset ({modelFormat.toUpperCase()}) · {loadingState.percent}%
                </p>
              </div>
            )}

            {/* Error / WebGL Context Lost State */}
            {(loadingState.status === 'error' || contextLost) && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3 text-center p-6">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <p className="text-sm font-bold text-white">
                  {contextLost ? 'WebGL Graphics Context Interrupted' : 'Unable to Render 3D Model'}
                </p>
                <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                  {contextLost
                    ? 'Your browser reclaimed the WebGL context. Close heavy tabs or reload this viewer to restore rendering.'
                    : loadingState.errorMessage}
                </p>
              </div>
            )}

            {/* Bottom-left Telemetry Strip */}
            <div className="absolute left-3 bottom-3 right-3 flex flex-wrap items-end justify-between gap-2 pointer-events-none">
              <div className="space-y-1.5">
                {selectedComp && components.length > 1 && (
                  <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-emerald-500/60 text-xs text-white shadow">
                    <span className="font-semibold text-emerald-400">Selected:</span>
                    <span className="font-bold max-w-[200px] truncate">{selectedComp.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleIsolateComponent(
                          isolatedComponentId === selectedComp.id ? null : selectedComp.id
                        )
                      }
                      className="ml-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold"
                    >
                      {isolatedComponentId === selectedComp.id ? 'Restore All' : 'Isolate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentId(null)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Clear selected part"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {meshStats && (
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-200 tabular-nums whitespace-nowrap truncate max-w-[calc(100vw-48px)] sm:max-w-full">
                    {modelFormat.toUpperCase()} · {meshStats.components} mesh
                    {meshStats.components === 1 ? '' : 'es'} ·{' '}
                    {meshStats.triangles.toLocaleString()} tris ·{' '}
                    {meshStats.vertices.toLocaleString()} verts
                    {isHeavyMesh ? ' · High-poly' : ''}
                    {softwareGlWarning ? ' · Software WebGL' : ''}
                  </div>
                )}
              </div>

              {captureNotice && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow">
                  {captureNotice}
                </div>
              )}
            </div>

            {/* Pending 3D Pin Modal Form */}
            {pendingPinPos && (
              <form
                onSubmit={handleConfirmPin}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 left-3 z-20 w-72 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/60 shadow-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Pin 3D Structure Annotation
                  </p>
                  <button
                    type="button"
                    onClick={() => setPendingPinPos(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={pinLabelDraft}
                  onChange={(e) => setPinLabelDraft(e.target.value)}
                  placeholder="Structure or part label (e.g. Aortic Arch, Hopper)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                />
                <textarea
                  rows={2}
                  value={pinNoteDraft}
                  onChange={(e) => setPinNoteDraft(e.target.value)}
                  placeholder="Function, academic note, or clinical relevance..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Save 3D Pin
                </button>
              </form>
            )}
          </div>

          {/* Lighting & Rendering Controls Drawer (Standalone modal mode) */}
          {!hideBuiltInSidebars && showControlsDrawer && (
            <aside className="absolute inset-y-0 right-0 z-20 w-72 max-w-[85%] shadow-2xl md:shadow-none md:static md:w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 space-y-4 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Lighting &amp; Render</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowControlsDrawer(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label="Close lighting panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                  Camera Angle Presets
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['front', 'back', 'left', 'right', 'top', 'bottom'] as CameraViewPreset[]).map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCameraPreset(preset)}
                        className="py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-[11px] font-semibold text-slate-700 dark:text-slate-200 capitalize"
                      >
                        {preset}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                  Environment Preset
                </label>
                <select
                  value={settings.environmentPreset}
                  onChange={(e) =>
                    updateSettings((s) => ({
                      ...s,
                      environmentPreset: e.target.value as ViewerRenderSettings['environmentPreset']
                    }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="studio">Neutral Studio (Balanced PBR)</option>
                  <option value="clinical_bright">Clinical Bright Lab</option>
                  <option value="contrast_dark">High Contrast Inspection</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                  Viewport Backdrop
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateSettings((s) => ({ ...s, backgroundMode: 'slate_dark' }))}
                    className={`py-1.5 rounded-lg text-xs font-semibold border ${
                      settings.backgroundMode === 'slate_dark'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Dark Slate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings((s) => ({ ...s, backgroundMode: 'clinical_light' }))
                    }
                    className={`py-1.5 rounded-lg text-xs font-semibold border ${
                      settings.backgroundMode === 'clinical_light'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Clinical Light
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Key Light</span>
                  <span className="tabular-nums">{settings.keyLightIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={4.5}
                  step={0.1}
                  value={settings.keyLightIntensity}
                  onChange={(e) =>
                    updateSettings((s) => ({ ...s, keyLightIntensity: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Ambient Fill</span>
                  <span className="tabular-nums">{settings.ambientIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={settings.ambientIntensity}
                  onChange={(e) =>
                    updateSettings((s) => ({ ...s, ambientIntensity: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-600"
                />
              </div>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Show Coordinate Axes</span>
                <input
                  type="checkbox"
                  checked={settings.showAxes}
                  onChange={(e) => updateSettings((s) => ({ ...s, showAxes: e.target.checked }))}
                  className="accent-emerald-600"
                />
              </label>

              <button
                type="button"
                onClick={() => updateSettings(DEFAULT_VIEWER_SETTINGS)}
                className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Reset Render Settings
              </button>
            </aside>
          )}

          {/* Component Hierarchy & Isolation Drawer (Standalone modal mode) */}
          {!hideBuiltInSidebars && showComponentsDrawer && (
            <aside className="absolute inset-y-0 right-0 z-20 w-72 max-w-[85%] shadow-2xl md:shadow-none md:static md:w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-3.5 flex flex-col gap-3 overflow-hidden shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Model Parts ({components.length})</span>
                </h4>
                <div className="flex items-center gap-2">
                  {isolatedComponentId && (
                    <button
                      type="button"
                      onClick={() => handleIsolateComponent(null)}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Show All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowComponentsDrawer(false)}
                    className="md:hidden text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5"
                    aria-label="Close parts drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {components.length <= 1 ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {components[0]?.name || 'Unified Mesh'}
                  </p>
                  <p>
                    This asset contains a single unified mesh. Multi-part component hiding &amp; isolation become available automatically when a multi-mesh GLB/glTF assembly is loaded.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {components.map((c) => {
                    const isSel = selectedComponentId === c.id;
                    const isIso = isolatedComponentId === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                          isSel
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedComponentId(isSel ? null : c.id)}
                          className="min-w-0 flex-1 text-left truncate"
                          title={c.name}
                        >
                          {c.name}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleIsolateComponent(isIso ? null : c.id)}
                          className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
                            isIso ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                          title={isIso ? 'Show all parts' : 'Isolate this part'}
                          aria-label={`Isolate ${c.name}`}
                        >
                          <Focus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleComponentVisible(c.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          title={c.visible ? 'Hide part' : 'Show part'}
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

              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                Drag to orbit · Scroll to zoom · Right-drag to pan · Click mesh to select
              </p>
            </aside>
          )}
        </div>
      </div>
    );
  }
);

export default Universal3DViewer;
