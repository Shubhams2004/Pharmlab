export type ModelFormat =
  | 'glb'
  | 'gltf'
  | 'stl'
  | 'obj'
  | 'ply'
  | 'zip'
  | 'pdb'
  | 'sdf'
  | 'mol';

export type Predefined3DCategory =
  | 'anatomy'
  | 'organ'
  | 'microorganism'
  | 'molecule'
  | 'chemistry'
  | 'pharma_equipment'
  | 'apparatus'
  | 'instrument'
  | 'pharma_manufacturing'
  | 'industrial_machinery'
  | 'biotechnology'
  | 'medical_device'
  | 'medicinal_plant'
  | 'formulation'
  | 'other';

export type Asset3DCategory = Predefined3DCategory | (string & {});

export interface Custom3DCategory {
  id: string;
  label: string;
  createdAt: number;
}

export type BPharmDepartmentId =
  | 'anatomy'
  | 'pharmaceutics'
  | 'pharmaceutical_chemistry'
  | 'pharmaceutical_analysis'
  | 'pharmacology'
  | 'pharmacognosy'
  | 'microbiology'
  | 'biotechnology'
  | 'industrial_pharmacy'
  | 'quality_assurance'
  | 'research'
  | 'clinical_pharmacy';

export type Asset3DImportStatus =
  | 'imported_binary'
  | 'user_uploaded'
  | 'linked_url'
  | 'external_reference';

export type Asset3DAvailabilityStatus =
  | 'offline_ready'
  | 'shared_binary'
  | 'remote_url'
  | 'metadata_only';

export type Asset3DLibrarySort =
  | 'import_desc'
  | 'import_asc'
  | 'name_asc'
  | 'name_desc'
  | 'category_asc'
  | 'size_desc'
  | 'size_asc'
  | 'recent_viewed';

export type Asset3DLibraryCollection =
  | 'all'
  | 'favorites'
  | 'recent_imported'
  | 'recent_viewed';

export interface SyllabusAssociation {
  id: string;
  course: string;
  departmentId: BPharmDepartmentId;
  syllabusId?: string;
  subjectCode?: string;
  subjectTitle?: string;
  unitId?: string;
  unitNo?: string;
  unitTitle?: string;
  topicId?: string;
  topicTitle?: string;
  subtopicId?: string;
  subtopicTitle?: string;
  learningObjective?: string;
  experimentId?: string;
  experimentTitle?: string;
  structureId?: string;
  structureName?: string;
}

export interface Asset3DAnnotation {
  id: string;
  label: string;
  note?: string;
  componentName?: string;
  position: [number, number, number];
  createdAt: number;
}

export interface Asset3DItem {
  id: string;
  name: string;
  description: string;
  thumbnailDataUrl?: string;
  thumbnailUrl?: string;
  format: ModelFormat;
  fileName: string;
  byteSize?: number;
  category: Asset3DCategory;
  departments: BPharmDepartmentId[];
  syllabusLinks: SyllabusAssociation[];
  tags: string[];
  sourceName: string;
  sourceUrl?: string;
  externalFileUrl?: string;
  creator: string;
  attribution: string;
  license: string;
  usageRestrictions: string;
  importStatus: Asset3DImportStatus;
  hasBinaryBlob: boolean;
  /** References another asset's binary key in IndexedDB so duplicated metadata shares the large 3D file without copying bytes */
  binaryRefAssetId?: string;
  isFavorite?: boolean;
  componentCount?: number;
  vertexCount?: number;
  triangleCount?: number;
  annotations: Asset3DAnnotation[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
}

export interface Asset3DBinaryRecord {
  assetId: string;
  fileName: string;
  format: ModelFormat;
  mimeType: string;
  byteSize: number;
  buffer: ArrayBuffer;
  savedAt: number;
}

export interface Asset3DStorageReport {
  totalAssets: number;
  storedBinaryCount: number;
  sharedReferenceCount: number;
  actualBinaryBytes: number;
  logicalBinaryBytes: number;
  metadataBytesEstimate: number;
  quotaBytes?: number;
  usageBytes?: number;
  maxSingleAssetBytes: number;
}

export interface Asset3DDeleteImpact {
  asset: Asset3DItem;
  syllabusLinks: SyllabusAssociation[];
  affectedSubjects: string[];
  affectedTopics: string[];
  affectedExperiments: string[];
  affectedStructures: string[];
  annotationCount: number;
  dependentAssetNames: string[];
  binaryBytesFreed: number;
  willTransferBinaryOwnership: boolean;
}

export type Provider3DId =
  | 'human_atlas_3d'
  | 'pubchem_3d'
  | 'rcsb_pdb'
  | 'wikimedia_3d'
  | 'smithsonian_3d'
  | 'sketchfab_public'
  | 'nih_3d_portal';

export type DownloadPolicy =
  | 'direct_cors'
  | 'portal_login_required'
  | 'portal_browse_only';

export type ProviderAuthRequirement =
  | 'none'
  | 'demo_key_rate_limited'
  | 'oauth_download'
  | 'portal_only';

export type ProviderCorsSupport = 'full_cors' | 'search_only_cors' | 'no_api';

export type Asset3DDiscoverySort =
  | 'recommended'
  | 'relevance'
  | 'title_asc'
  | 'size_asc'
  | 'poly_desc';

export type Asset3DAvailabilityFilter = 'all' | 'direct_cors' | 'portal';

export interface Discovered3DCandidate {
  id: string;
  providerId: Provider3DId;
  providerName: string;
  title: string;
  description: string;
  previewUrl?: string;
  previewEmbedUrl?: string;
  creator: string;
  creatorUrl?: string;
  sourceUrl: string;
  directFileUrl?: string;
  format?: ModelFormat;
  byteSize?: number;
  license: string;
  attribution: string;
  usageRestrictions: string;
  downloadPolicy: DownloadPolicy;
  downloadNotice: string;
  suggestedCategory?: Asset3DCategory;
  suggestedDepartment?: BPharmDepartmentId;
  vertexCount?: number;
  faceCount?: number;
  popularityScore?: number;
  relevanceScore?: number;
  publishedAt?: string;
  tags: string[];
}

export type RenderVisualizationMode = 'solid' | 'wireframe' | 'xray';

export type CameraViewPreset =
  | 'reset'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

export interface Analyzed3DComponent {
  id: string;
  name: string;
  rawNodeName: string;
  parentName?: string;
  hasMeaningfulName: boolean;
  visible: boolean;
  vertexCount: number;
  triangleCount: number;
  materialName?: string;
  localCenter: [number, number, number];
}

export interface ModelAnalysisSummary {
  componentCount: number;
  vertexCount: number;
  triangleCount: number;
  dimensions?: [number, number, number];
  components: Analyzed3DComponent[];
}

export interface ModelComponentNode {
  id: string;
  name: string;
  meshCount: number;
  visible: boolean;
  isolated: boolean;
  boundingCenter: [number, number, number];
}

export interface ViewerRenderSettings {
  environmentPreset: 'studio' | 'clinical_bright' | 'contrast_dark';
  keyLightIntensity: number;
  ambientIntensity: number;
  renderMode: RenderVisualizationMode;
  wireframe: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  backgroundMode: 'slate_dark' | 'clinical_light';
}

export const CATEGORY_3D_LABELS: Record<Predefined3DCategory, string> = {
  anatomy: 'Human Anatomy',
  organ: 'Organs & Tissues',
  microorganism: 'Cells & Microorganisms',
  molecule: 'Molecular Structures',
  chemistry: 'Chemistry',
  pharma_equipment: 'Pharmaceutical Equipment',
  apparatus: 'Lab Glassware & Apparatus',
  instrument: 'Laboratory Instruments',
  pharma_manufacturing: 'Pharmaceutical Manufacturing',
  industrial_machinery: 'Industrial Machinery',
  biotechnology: 'Biotechnology',
  medical_device: 'Medical Devices',
  medicinal_plant: 'Medicinal Plants & Botanicals',
  formulation: 'Dosage Forms & Formulations',
  other: 'Other Scientific Assets'
};

export const BPHARM_DEPARTMENT_LABELS: Record<BPharmDepartmentId, string> = {
  anatomy: 'Human Anatomy & Physiology',
  pharmaceutics: 'Pharmaceutics',
  pharmaceutical_chemistry: 'Pharmaceutical Chemistry',
  pharmaceutical_analysis: 'Pharmaceutical Analysis',
  pharmacology: 'Pharmacology',
  pharmacognosy: 'Pharmacognosy',
  microbiology: 'Pharmaceutical Microbiology',
  biotechnology: 'Pharmaceutical Biotechnology',
  industrial_pharmacy: 'Industrial Pharmacy',
  quality_assurance: 'Quality Assurance',
  research: 'Pharmaceutical Research',
  clinical_pharmacy: 'Clinical Pharmacy'
};

export const ALL_BPHARM_DEPARTMENTS: BPharmDepartmentId[] = Object.keys(
  BPHARM_DEPARTMENT_LABELS
) as BPharmDepartmentId[];

export const ALL_3D_CATEGORIES: Predefined3DCategory[] = Object.keys(
  CATEGORY_3D_LABELS
) as Predefined3DCategory[];

export const IMPORT_STATUS_3D_LABELS: Record<Asset3DImportStatus, string> = {
  imported_binary: 'Imported (Offline Binary)',
  user_uploaded: 'User Uploaded (Offline)',
  linked_url: 'External Model URL',
  external_reference: 'External Repository Record'
};

export function normalizeCustomCategoryId(label: string): string {
  const clean = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean ? `custom_${clean}` : `custom_${Date.now()}`;
}

export function get3DCategoryLabel(
  category: Asset3DCategory,
  customCategories: Custom3DCategory[] = []
): string {
  if (category in CATEGORY_3D_LABELS) {
    return CATEGORY_3D_LABELS[category as Predefined3DCategory];
  }
  const customHit = customCategories.find((c) => c.id === category || c.label === category);
  if (customHit) return customHit.label;
  return category
    .replace(/^custom_/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function getAsset3DAvailability(asset: Asset3DItem): {
  status: Asset3DAvailabilityStatus;
  label: string;
  canOpenViewer: boolean;
} {
  if (asset.hasBinaryBlob && asset.binaryRefAssetId) {
    return {
      status: 'shared_binary',
      label: 'Offline Ready (Shared 3D File)',
      canOpenViewer: true
    };
  }
  if (asset.hasBinaryBlob) {
    return {
      status: 'offline_ready',
      label: 'Offline Ready (IndexedDB)',
      canOpenViewer: true
    };
  }
  if (asset.externalFileUrl && /^https?:\/\//i.test(asset.externalFileUrl)) {
    return {
      status: 'remote_url',
      label: 'Remote 3D URL (Online)',
      canOpenViewer: true
    };
  }
  return {
    status: 'metadata_only',
    label: 'Metadata Only (No 3D Binary)',
    canOpenViewer: false
  };
}

export function mapWorkspaceDeptToBPharmDept(dept?: string | null): BPharmDepartmentId {
  switch (dept) {
    case 'anatomy':
      return 'anatomy';
    case 'general_pharmacy':
    case 'pharmaceutics':
      return 'pharmaceutics';
    case 'inorganic':
    case 'pharmaceutical_chemistry':
      return 'pharmaceutical_chemistry';
    case 'pharmaceutical_analysis':
      return 'pharmaceutical_analysis';
    case 'pharmacology':
      return 'pharmacology';
    case 'pharmacognosy':
      return 'pharmacognosy';
    case 'microbiology':
      return 'microbiology';
    case 'biotechnology':
      return 'biotechnology';
    case 'industrial_pharmacy':
      return 'industrial_pharmacy';
    case 'quality_assurance':
      return 'quality_assurance';
    case 'clinical_pharmacy':
    case 'psychology':
      return 'clinical_pharmacy';
    case 'python':
    case 'research':
    default:
      return 'research';
  }
}

export function detectModelFormatFromName(fileName: string): ModelFormat | null {
  const lower = fileName.trim().toLowerCase().split('?')[0].split('#')[0];
  if (lower.endsWith('.glb')) return 'glb';
  if (lower.endsWith('.gltf')) return 'gltf';
  if (lower.endsWith('.stl')) return 'stl';
  if (lower.endsWith('.obj')) return 'obj';
  if (lower.endsWith('.ply')) return 'ply';
  if (lower.endsWith('.zip')) return 'zip';
  if (lower.endsWith('.pdb') || lower.endsWith('.ent')) return 'pdb';
  if (lower.endsWith('.sdf')) return 'sdf';
  if (lower.endsWith('.mol')) return 'mol';
  return null;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
