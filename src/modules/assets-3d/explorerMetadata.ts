import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import { DEPARTMENT_WORKSPACES } from '../../types/academicArchitecture';
import { AnatomicalStructureEntity } from '../../types/academicEngine';
import { SyllabusProfile, SyllabusSubjectNode, SyllabusTopicNode } from '../study-mode/types';
import {
  Analyzed3DComponent,
  Asset3DAnnotation,
  Asset3DCategory,
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  Custom3DCategory,
  EXPERIMENT_ROLE_LABELS,
  get3DCategoryLabel,
  ModelFormat
} from './types';
import { getRelatedExperimentsForAsset } from './experimentCatalog';

export type ScientificDomainKind =
  | 'anatomy_organ'
  | 'cell_microbe'
  | 'molecule_chemistry'
  | 'pharma_equipment'
  | 'industrial_machinery'
  | 'biotech_medical'
  | 'medicinal_botanical'
  | 'general_scientific';

export interface ExplorationDomainProfile {
  kind: ScientificDomainKind;
  domainTitle: string;
  explorationFocus: string;
  recommendedModes: Array<'solid' | 'wireframe' | 'xray'>;
  studyTips: string[];
  supportsCpkLegend: boolean;
}

export interface ModelCapabilitiesSummary {
  componentCount: number;
  hasLoadedGeometry: boolean;
  hasSelectableComponents: boolean;
  supportsMultiSelect: boolean;
  supportsIsolation: boolean;
  supportsHierarchyTree: boolean;
  supportsClipping: boolean;
  supportsWireframe: boolean;
  supportsXray: boolean;
  supportsMeasurement: boolean;
  supportsAnnotations: boolean;
  namedComponentCount: number;
  unnamedComponentCount: number;
  hasNamedStructures: boolean;
  isSingleUnifiedMesh: boolean;
  isUnnamedMultiMesh: boolean;
  isMolecularParsed: boolean;
  isHighPoly: boolean;
  unitLabel: string;
  isCalibrated: boolean;
  unitCalibrationNote: string;
  unavailableReasons: {
    multiSelect?: string;
    isolation?: string;
    hierarchy?: string;
    labels?: string;
    clipping?: string;
    measurement?: string;
  };
  statusLabel: string;
  honestNotice: string;
}

export interface StructureInspectionReport {
  displayName: string;
  rawNodeName: string;
  hasMeaningfulName: boolean;
  parentName?: string;
  materialName?: string;
  vertexCount: number;
  triangleCount: number;
  localCenter: [number, number, number];
  verifiedRole?: string;
  verifiedSourceLabel?: string;
  scientificNotes: string[];
  clinicalNotes: string[];
  pharmaceuticalNotes: string[];
  matchingPins: Asset3DAnnotation[];
  isMetadataEmpty: boolean;
}

export interface ResolvedAcademicLinkItem {
  id: string;
  course: string;
  departmentLabel: string;
  departmentWorkspaceId?: string;
  subjectCode?: string;
  subjectTitle?: string;
  unitId?: string;
  unitNo?: string;
  unitTitle?: string;
  topicId?: string;
  topicTitle?: string;
  topicSummary?: string;
  subtopicId?: string;
  subtopicTitle?: string;
  learningObjective?: string;
  experimentId?: string;
  experimentTitle?: string;
  experimentTab?: string;
  experimentRole?: string;
  stepId?: string;
  stepTitle?: string;
  setupNote?: string;
  focusComponentName?: string;
  structureId?: string;
  structureName?: string;
  syllabusId?: string;
}

export interface ResolvedAcademicContext {
  links: ResolvedAcademicLinkItem[];
  subjectObjectives: string[];
  subjectOutcomes: Array<{ no: number; statement: string }>;
  academicReferences: string[];
  matchedTopics: Array<{
    syllabusId: string;
    subjectCode: string;
    subjectTitle: string;
    unitNo: string;
    topic: SyllabusTopicNode;
  }>;
  matchedAnatomyEntities: AnatomicalStructureEntity[];
  relatedExperiments: Array<{
    id: string;
    code: string;
    title: string;
    moduleId: string;
    tab: string;
    departmentLabel: string;
    roleLabel?: string;
    stepTitle?: string;
    setupNote?: string;
    focusComponentName?: string;
  }>;
}

export interface GuidedIdentificationStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  sourceKind: 'annotation_pin' | 'named_mesh';
  componentId?: string;
  pinId?: string;
  focusPoint: [number, number, number];
  verifiedRole?: string;
}

export const CPK_ELEMENT_LEGEND: Array<{ symbol: string; name: string; swatchClass: string }> = [
  { symbol: 'C', name: 'Carbon', swatchClass: 'bg-slate-700 text-white' },
  { symbol: 'H', name: 'Hydrogen', swatchClass: 'bg-slate-100 text-slate-900 border border-slate-300' },
  { symbol: 'O', name: 'Oxygen', swatchClass: 'bg-red-600 text-white' },
  { symbol: 'N', name: 'Nitrogen', swatchClass: 'bg-blue-600 text-white' },
  { symbol: 'S', name: 'Sulfur', swatchClass: 'bg-yellow-500 text-slate-950' },
  { symbol: 'P', name: 'Phosphorus', swatchClass: 'bg-orange-500 text-white' },
  { symbol: 'Cl/F', name: 'Halogens', swatchClass: 'bg-green-600 text-white' }
];

export const SUPPORTED_3D_FORMATS: ModelFormat[] = [
  'glb',
  'gltf',
  'zip',
  'obj',
  'stl',
  'ply',
  'pdb',
  'sdf',
  'mol'
];

export function isSupported3DFormat(fmt: string): fmt is ModelFormat {
  return SUPPORTED_3D_FORMATS.includes(fmt as ModelFormat);
}

export function getExplorationProfile(
  asset: Asset3DItem,
  customCategories: Custom3DCategory[] = []
): ExplorationDomainProfile {
  const cat: Asset3DCategory = asset.category;
  const catLabel = get3DCategoryLabel(cat, customCategories);
  const isMolFmt = asset.format === 'pdb' || asset.format === 'sdf' || asset.format === 'mol';

  if (isMolFmt || cat === 'molecule' || cat === 'chemistry') {
    return {
      kind: 'molecule_chemistry',
      domainTitle: catLabel,
      explorationFocus: 'Spatial conformation, functional group geometry & atom-bond orientation',
      recommendedModes: ['solid', 'xray', 'wireframe'],
      studyTips: [
        'Orbit around chiral centers and planar ring systems to evaluate steric orientation.',
        'Use Front/Top/Side camera presets to inspect bond angles and molecular symmetry.',
        isMolFmt
          ? 'Atoms follow standard CPK element coloring (C gray, O red, N blue, S yellow).'
          : 'Toggle X-Ray or Wireframe when inspecting crowded macromolecular pockets.'
      ],
      supportsCpkLegend: isMolFmt
    };
  }

  if (cat === 'anatomy' || cat === 'organ') {
    return {
      kind: 'anatomy_organ',
      domainTitle: catLabel,
      explorationFocus: 'Regional topography, internal chambers/layers & anatomical relations',
      recommendedModes: ['solid', 'xray', 'wireframe'],
      studyTips: [
        'Use X-Ray mode to see through outer walls or capsules and inspect internal structures.',
        'Select multi-part anatomical meshes to isolate specific chambers, lobes, or vessels.',
        'Use Anterior (Front), Posterior (Back), Lateral, and Superior (Top) camera views for standard anatomical orientation.'
      ],
      supportsCpkLegend: false
    };
  }

  if (cat === 'microorganism') {
    return {
      kind: 'cell_microbe',
      domainTitle: catLabel,
      explorationFocus: 'Ultrastructural organelles, cell envelope & surface appendages',
      recommendedModes: ['solid', 'xray', 'wireframe'],
      studyTips: [
        'Switch to X-Ray mode to inspect internal organelles inside outer membrane shells.',
        'Pin 3D study notes directly onto organelles, flagella, or capsids for exam revision.'
      ],
      supportsCpkLegend: false
    };
  }

  if (cat === 'pharma_equipment' || cat === 'apparatus' || cat === 'instrument') {
    return {
      kind: 'pharma_equipment',
      domainTitle: catLabel,
      explorationFocus: 'Functional assembly, fluid/vapor flow path & calibration geometry',
      recommendedModes: ['solid', 'xray', 'wireframe'],
      studyTips: [
        'Inspect Orthographic-style Front, Side, and Top presets to understand apparatus alignment.',
        'Hide outer housing parts or switch to X-Ray to trace internal chambers, coils, or optical paths.'
      ],
      supportsCpkLegend: false
    };
  }

  if (cat === 'pharma_manufacturing' || cat === 'industrial_machinery') {
    return {
      kind: 'industrial_machinery',
      domainTitle: catLabel,
      explorationFocus: 'Mechanical sub-assemblies, feed/compression zones & unit operation layout',
      recommendedModes: ['solid', 'wireframe', 'xray'],
      studyTips: [
        'Isolate individual mechanical assemblies (hoppers, turrets, chambers) when available in multi-mesh GLB files.',
        'Use X-Ray view to check clearance and internal tooling paths inside opaque casings.'
      ],
      supportsCpkLegend: false
    };
  }

  if (cat === 'biotechnology' || cat === 'medical_device') {
    return {
      kind: 'biotech_medical',
      domainTitle: catLabel,
      explorationFocus: 'Device interface, structural sub-assemblies & bioprocess geometry',
      recommendedModes: ['solid', 'xray', 'wireframe'],
      studyTips: [
        'Compare Solid and X-Ray views to review external housing alongside internal components.',
        'Link saved models to Study Mode topics or practical labs to keep clinical context connected.'
      ],
      supportsCpkLegend: false
    };
  }

  if (cat === 'medicinal_plant') {
    return {
      kind: 'medicinal_botanical',
      domainTitle: catLabel,
      explorationFocus: 'Botanical morphology, leaf/flower arrangement & diagnostic macroscopic traits',
      recommendedModes: ['solid', 'wireframe', 'xray'],
      studyTips: [
        'Rotate to Top and Side views to examine phyllotaxy, venation, and floral morphology.',
        'Pin morphological markers for pharmacognosy identification notes.'
      ],
      supportsCpkLegend: false
    };
  }

  return {
    kind: 'general_scientific',
    domainTitle: catLabel,
    explorationFocus: '3D morphology, structural proportion & scientific inspection',
    recommendedModes: ['solid', 'xray', 'wireframe'],
    studyTips: [
      'Use Camera Presets and X-Ray / Wireframe modes to inspect geometry from all angles.',
      'Select meshes or place 3D study pins to record verified academic notes.'
    ],
    supportsCpkLegend: false
  };
}

export function analyzeModelCapabilities(
  asset: Asset3DItem,
  components: Analyzed3DComponent[],
  triangleCountOverride?: number
): ModelCapabilitiesSummary {
  const isMolecularParsed =
    asset.format === 'pdb' || asset.format === 'sdf' || asset.format === 'mol';
  const componentCount = components.length;
  const totalTriangles =
    triangleCountOverride ??
    components.reduce((sum, c) => sum + (c.triangleCount || 0), 0);
  const isHighPoly = totalTriangles > 250_000;
  const unitLabel = isMolecularParsed ? 'Å (coordinate units)' : 'model units';
  const isCalibrated = false;
  const unitCalibrationNote = isMolecularParsed
    ? 'Atomic coordinates in PDB/SDF/MOL files represent unnormalized structural Ångström coordinates; distances reflect raw file coordinate deltas.'
    : 'This 3D asset carries no real-world physical scale calibration metadata. Distances and coordinates are reported strictly in uncalibrated model units (not mm/cm).';

  if (componentCount === 0) {
    return {
      componentCount: 0,
      hasLoadedGeometry: false,
      hasSelectableComponents: false,
      supportsMultiSelect: false,
      supportsIsolation: false,
      supportsHierarchyTree: false,
      supportsClipping: false,
      supportsWireframe: false,
      supportsXray: false,
      supportsMeasurement: false,
      supportsAnnotations: false,
      namedComponentCount: 0,
      unnamedComponentCount: 0,
      hasNamedStructures: false,
      isSingleUnifiedMesh: false,
      isUnnamedMultiMesh: false,
      isMolecularParsed,
      isHighPoly: false,
      unitLabel,
      isCalibrated,
      unitCalibrationNote,
      unavailableReasons: {
        multiSelect: 'Waiting for 3D geometry to finish loading.',
        isolation: 'Waiting for 3D geometry to finish loading.',
        hierarchy: 'Waiting for 3D geometry to finish loading.',
        labels: 'Waiting for 3D geometry to finish loading.',
        clipping: 'Waiting for 3D geometry to finish loading.',
        measurement: 'Waiting for 3D geometry to finish loading.'
      },
      statusLabel: 'Awaiting Loaded Geometry',
      honestNotice:
        'Interactive inspection, sectioning, and measurement tools activate once the 3D geometry finishes loading in the viewport.'
    };
  }

  if (componentCount === 1) {
    const only = components[0];
    return {
      componentCount: 1,
      hasLoadedGeometry: true,
      hasSelectableComponents: false,
      supportsMultiSelect: false,
      supportsIsolation: false,
      supportsHierarchyTree: false,
      supportsClipping: true,
      supportsWireframe: true,
      supportsXray: true,
      supportsMeasurement: true,
      supportsAnnotations: true,
      namedComponentCount: only.hasMeaningfulName ? 1 : 0,
      unnamedComponentCount: only.hasMeaningfulName ? 0 : 1,
      hasNamedStructures: only.hasMeaningfulName,
      isSingleUnifiedMesh: true,
      isUnnamedMultiMesh: false,
      isMolecularParsed,
      isHighPoly,
      unitLabel,
      isCalibrated,
      unitCalibrationNote,
      unavailableReasons: {
        multiSelect: 'Disabled: this file contains only one unified mesh.',
        isolation: 'Disabled: isolation requires at least 2 distinct meshes.',
        hierarchy: 'Single unified mesh—no sub-part hierarchy exists inside this file.',
        labels: only.hasMeaningfulName
          ? undefined
          : 'Disabled: this unified mesh carries no named internal sub-structures.'
      },
      statusLabel: 'Single Unified Mesh',
      honestNotice:
        'This 3D file contains one unified mesh rather than separate sub-parts. Camera controls, sectioning planes, wireframe/X-Ray, measurements, and custom 3D notes work across the surface; multi-part isolation is disabled.'
    };
  }

  const namedCount = components.filter((c) => c.hasMeaningfulName).length;
  const unnamedCount = componentCount - namedCount;

  if (namedCount === 0) {
    return {
      componentCount,
      hasLoadedGeometry: true,
      hasSelectableComponents: true,
      supportsMultiSelect: true,
      supportsIsolation: true,
      supportsHierarchyTree: true,
      supportsClipping: true,
      supportsWireframe: true,
      supportsXray: true,
      supportsMeasurement: true,
      supportsAnnotations: true,
      namedComponentCount: 0,
      unnamedComponentCount: unnamedCount,
      hasNamedStructures: false,
      isSingleUnifiedMesh: false,
      isUnnamedMultiMesh: true,
      isMolecularParsed,
      isHighPoly,
      unitLabel,
      isCalibrated,
      unitCalibrationNote,
      unavailableReasons: {
        labels:
          'Disabled: the source file did not include descriptive node names (no labels are fabricated).'
      },
      statusLabel: `${componentCount} Unnamed Sub-Meshes`,
      honestNotice:
        'This file contains multiple selectable meshes (multi-select, hide, isolate, hierarchy, sectioning, and measurement are enabled), but the file itself lacked descriptive node names. Generic mesh indices are shown honestly without inventing scientific names.'
    };
  }

  return {
    componentCount,
    hasLoadedGeometry: true,
    hasSelectableComponents: true,
    supportsMultiSelect: true,
    supportsIsolation: true,
    supportsHierarchyTree: true,
    supportsClipping: true,
    supportsWireframe: true,
    supportsXray: true,
    supportsMeasurement: true,
    supportsAnnotations: true,
    namedComponentCount: namedCount,
    unnamedComponentCount: unnamedCount,
    hasNamedStructures: true,
    isSingleUnifiedMesh: false,
    isUnnamedMultiMesh: false,
    isMolecularParsed,
    isHighPoly,
    unitLabel,
    isCalibrated,
    unitCalibrationNote,
    unavailableReasons: {},
    statusLabel: `${componentCount} Selectable Structures (${namedCount} named)`,
    honestNotice:
      unnamedCount > 0
        ? `${namedCount} parts carry original node names from the 3D file and ${unnamedCount} use generic node indices.`
        : `All ${namedCount} parts carry identifiable node names from the 3D model.`
  };
}

function normalizeMatchText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchAnatomyEntitiesForAsset(asset: Asset3DItem): AnatomicalStructureEntity[] {
  const matchedMap = new Map<string, AnatomicalStructureEntity>();

  for (const link of asset.syllabusLinks) {
    if (link.structureId) {
      const hit = ANATOMY_CATALOG.find((item) => item.id === link.structureId);
      if (hit) matchedMap.set(hit.id, hit);
    }
    if (link.structureName) {
      const norm = normalizeMatchText(link.structureName);
      const hit = ANATOMY_CATALOG.find(
        (item) =>
          normalizeMatchText(item.name) === norm ||
          item.alternateNames.some((alt) => normalizeMatchText(alt) === norm)
      );
      if (hit) matchedMap.set(hit.id, hit);
    }
  }

  return Array.from(matchedMap.values());
}

export function inspectStructureComponent(
  component: Analyzed3DComponent,
  asset: Asset3DItem,
  matchedAnatomy: AnatomicalStructureEntity[]
): StructureInspectionReport {
  const matchingPins = (asset.annotations || []).filter((pin) => {
    if (pin.componentName && normalizeMatchText(pin.componentName) === normalizeMatchText(component.name)) {
      return true;
    }
    const dx = pin.position[0] - component.localCenter[0];
    const dy = pin.position[1] - component.localCenter[1];
    const dz = pin.position[2] - component.localCenter[2];
    return Math.hypot(dx, dy, dz) < 0.35;
  });

  let verifiedRole: string | undefined;
  let verifiedSourceLabel: string | undefined;
  const scientificNotes: string[] = [];
  const clinicalNotes: string[] = [];
  const pharmaceuticalNotes: string[] = [];

  if (component.hasMeaningfulName && matchedAnatomy.length > 0) {
    const normComp = normalizeMatchText(component.name);
    const compTokens = normComp.split(' ').filter((t) => t.length >= 3);

    for (const entity of matchedAnatomy) {
      for (const compMeta of entity.components || []) {
        const normMetaName = normalizeMatchText(compMeta.name);
        const directOverlap =
          normMetaName.includes(normComp) ||
          normComp.includes(normMetaName) ||
          compTokens.some((tok) => normMetaName.includes(tok));

        if (directOverlap) {
          verifiedRole = compMeta.role;
          verifiedSourceLabel = `${entity.name} (${entity.scientificName || 'Anatomy Explorer'}) · ${compMeta.name}`;
          if (entity.physiology) scientificNotes.push(entity.physiology);
          if (entity.clinicalSignificance?.length) {
            clinicalNotes.push(...entity.clinicalSignificance);
          }
          if (entity.pharmaceuticalRelevance?.length) {
            pharmaceuticalNotes.push(...entity.pharmaceuticalRelevance);
          }
          break;
        }
      }
      if (verifiedRole) break;
    }
  }

  const isMetadataEmpty =
    !component.hasMeaningfulName && !verifiedRole && matchingPins.length === 0;

  return {
    displayName: component.name,
    rawNodeName: component.rawNodeName,
    hasMeaningfulName: component.hasMeaningfulName,
    parentName: component.parentName,
    materialName: component.materialName,
    vertexCount: component.vertexCount,
    triangleCount: component.triangleCount,
    localCenter: component.localCenter,
    verifiedRole,
    verifiedSourceLabel,
    scientificNotes: Array.from(new Set(scientificNotes)),
    clinicalNotes: Array.from(new Set(clinicalNotes)),
    pharmaceuticalNotes: Array.from(new Set(pharmaceuticalNotes)),
    matchingPins,
    isMetadataEmpty
  };
}

function mapBPharmDeptToWorkspaceId(dept: string): string | undefined {
  switch (dept) {
    case 'anatomy':
      return 'anatomy';
    case 'pharmaceutics':
    case 'industrial_pharmacy':
      return 'general_pharmacy';
    case 'pharmaceutical_chemistry':
    case 'pharmaceutical_analysis':
      return 'inorganic';
    case 'pharmacognosy':
      return 'pharmacognosy';
    case 'clinical_pharmacy':
      return 'psychology';
    default:
      return undefined;
  }
}

export function resolveAssetAcademicContext(
  asset: Asset3DItem,
  syllabi: SyllabusProfile[] = []
): ResolvedAcademicContext {
  const matchedAnatomyEntities = matchAnatomyEntitiesForAsset(asset);
  const subjectMap = new Map<string, { sylId: string; subject: SyllabusSubjectNode }>();
  const topicLookup = new Map<
    string,
    { syllabusId: string; subjectCode: string; subjectTitle: string; unitNo: string; topic: SyllabusTopicNode }
  >();

  for (const syl of syllabi) {
    for (const sub of syl.subjects) {
      subjectMap.set(sub.code.toLowerCase(), { sylId: syl.id, subject: sub });
      for (const unit of sub.units) {
        for (const topic of unit.topics) {
          topicLookup.set(topic.id, {
            syllabusId: syl.id,
            subjectCode: sub.code,
            subjectTitle: sub.title,
            unitNo: unit.unitNo,
            topic
          });
        }
      }
    }
  }

  const matchedTopicsMap = new Map<
    string,
    {
      syllabusId: string;
      subjectCode: string;
      subjectTitle: string;
      unitNo: string;
      topic: SyllabusTopicNode;
    }
  >();
  const objectivesSet = new Set<string>();
  const outcomesMap = new Map<number, { no: number; statement: string }>();
  const referencesSet = new Set<string>();
  const experimentsMap = new Map<
    string,
    ResolvedAcademicContext['relatedExperiments'][number]
  >();

  const links: ResolvedAcademicLinkItem[] = (asset.syllabusLinks || []).map((lnk) => {
    const subHit = lnk.subjectCode
      ? subjectMap.get(lnk.subjectCode.toLowerCase())
      : undefined;
    const topicHit = lnk.topicId ? topicLookup.get(lnk.topicId) : undefined;

    if (subHit) {
      subHit.subject.objectives.forEach((o) => objectivesSet.add(o));
      subHit.subject.outcomes.forEach((o) => outcomesMap.set(o.no, o));
      subHit.subject.references.forEach((r) => referencesSet.add(r));
    }

    if (topicHit) {
      matchedTopicsMap.set(topicHit.topic.id, topicHit);
    }

    const wsId = mapBPharmDeptToWorkspaceId(lnk.departmentId);

    return {
      id: lnk.id,
      course: lnk.course || 'B.Pharm',
      departmentLabel: BPHARM_DEPARTMENT_LABELS[lnk.departmentId] || lnk.departmentId,
      departmentWorkspaceId: wsId,
      subjectCode: lnk.subjectCode || topicHit?.subjectCode,
      subjectTitle: lnk.subjectTitle || subHit?.subject.title || topicHit?.subjectTitle,
      unitId: lnk.unitId,
      unitNo: lnk.unitNo || topicHit?.unitNo,
      unitTitle: lnk.unitTitle,
      topicId: lnk.topicId,
      topicTitle: lnk.topicTitle || topicHit?.topic.title,
      topicSummary: topicHit?.topic.summary,
      subtopicId: lnk.subtopicId,
      subtopicTitle: lnk.subtopicTitle,
      learningObjective: lnk.learningObjective,
      experimentId: lnk.experimentId,
      experimentTitle: lnk.experimentTitle,
      experimentTab: lnk.experimentTab || topicHit?.topic.linkedLabTab,
      experimentRole: lnk.experimentRole ? EXPERIMENT_ROLE_LABELS[lnk.experimentRole] : undefined,
      stepId: lnk.stepId,
      stepTitle: lnk.stepTitle,
      setupNote: lnk.setupNote,
      focusComponentName: lnk.focusComponentName,
      structureId: lnk.structureId,
      structureName: lnk.structureName,
      syllabusId: lnk.syllabusId || topicHit?.syllabusId || subHit?.sylId
    };
  });

  const catalogExperiments = getRelatedExperimentsForAsset(asset, syllabi);
  for (const exp of catalogExperiments) {
    experimentsMap.set(`${exp.moduleId}:${exp.id}:${exp.stepTitle || ''}`, {
      id: exp.id,
      code: exp.code,
      title: exp.title,
      moduleId: exp.moduleId,
      tab: exp.tab,
      departmentLabel: exp.departmentLabel,
      roleLabel: exp.roleLabel,
      stepTitle: exp.stepTitle,
      setupNote: exp.setupNote,
      focusComponentName: exp.focusComponentName
    });
  }

  return {
    links,
    subjectObjectives: Array.from(objectivesSet),
    subjectOutcomes: Array.from(outcomesMap.values()).sort((a, b) => a.no - b.no),
    academicReferences: Array.from(referencesSet),
    matchedTopics: Array.from(matchedTopicsMap.values()),
    matchedAnatomyEntities,
    relatedExperiments: Array.from(experimentsMap.values())
  };
}

export function buildGuidedIdentificationSteps(
  asset: Asset3DItem,
  components: Analyzed3DComponent[],
  matchedAnatomy: AnatomicalStructureEntity[]
): GuidedIdentificationStep[] {
  const steps: GuidedIdentificationStep[] = [];
  const pins = asset.annotations || [];

  // 1. Prioritize user-authored verified 3D annotation pins first
  pins.forEach((pin) => {
    const matchedComp = pin.componentName
      ? components.find(
          (c) => normalizeMatchText(c.name) === normalizeMatchText(pin.componentName!)
        )
      : undefined;
    steps.push({
      id: `guide_pin_${pin.id}`,
      stepNumber: steps.length + 1,
      title: pin.label,
      subtitle: pin.componentName ? `Pinned on ${pin.componentName}` : 'Saved 3D Annotation Pin',
      description:
        pin.note?.trim() ||
        'Annotated region on this scientific 3D model. Inspect surrounding structures and orientation.',
      sourceKind: 'annotation_pin',
      pinId: pin.id,
      componentId: matchedComp?.id,
      focusPoint: pin.position
    });
  });

  // 2. Append authentically named sub-components not already covered by pins (only when multi-mesh & meaningful)
  if (components.length > 1) {
    const pinnedNames = new Set(
      pins.map((p) => (p.componentName ? normalizeMatchText(p.componentName) : ''))
    );

    const namedComps = components.filter(
      (c) => c.hasMeaningfulName && !pinnedNames.has(normalizeMatchText(c.name))
    );

    for (const comp of namedComps.slice(0, 20)) {
      const report = inspectStructureComponent(comp, asset, matchedAnatomy);
      steps.push({
        id: `guide_comp_${comp.id}`,
        stepNumber: steps.length + 1,
        title: comp.name,
        subtitle: report.verifiedSourceLabel || `3D Model Node (${comp.triangleCount.toLocaleString()} tris)`,
        description:
          report.verifiedRole ||
          `Identifiable 3D node "${comp.rawNodeName}" inside this multi-part model (${comp.vertexCount.toLocaleString()} vertices).`,
        sourceKind: 'named_mesh',
        componentId: comp.id,
        focusPoint: comp.localCenter,
        verifiedRole: report.verifiedRole
      });
    }
  }

  return steps;
}
