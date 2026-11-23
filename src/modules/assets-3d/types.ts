export type ModelFormat = 'glb' | 'gltf' | 'stl' | 'obj' | 'ply';

export type Asset3DCategory =
  | 'anatomy'
  | 'organ'
  | 'molecule'
  | 'apparatus'
  | 'medicinal_plant'
  | 'microorganism'
  | 'instrument'
  | 'industrial_machinery'
  | 'formulation'
  | 'other';

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

export interface SyllabusAssociation {
  id: string;
  course: string;
  departmentId: BPharmDepartmentId;
  subjectCode?: string;
  subjectTitle?: string;
  unitNo?: string;
  topicId?: string;
  topicTitle?: string;
  subtopicId?: string;
  subtopicTitle?: string;
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

export type Provider3DId =
  | 'wikimedia_3d'
  | 'sketchfab_public'
  | 'smithsonian_3d'
  | 'nih_3d_portal';

export type DownloadPolicy =
  | 'direct_cors'
  | 'portal_login_required'
  | 'portal_browse_only';

export interface Discovered3DCandidate {
  id: string;
  providerId: Provider3DId;
  providerName: string;
  title: string;
  description: string;
  previewUrl?: string;
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
  vertexCount?: number;
  faceCount?: number;
  tags: string[];
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
  wireframe: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  backgroundMode: 'slate_dark' | 'clinical_light';
}

export const CATEGORY_3D_LABELS: Record<Asset3DCategory, string> = {
  anatomy: 'Anatomical Structure',
  organ: 'Organ & System',
  molecule: 'Molecule & Chemical Structure',
  apparatus: 'Laboratory Apparatus',
  medicinal_plant: 'Medicinal Plant & Botanical',
  microorganism: 'Microorganism & Cell',
  instrument: 'Analytical Instrument',
  industrial_machinery: 'Industrial Pharma Machinery',
  formulation: 'Dosage Form & Formulation',
  other: 'Other Scientific Model'
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

export const ALL_3D_CATEGORIES: Asset3DCategory[] = Object.keys(
  CATEGORY_3D_LABELS
) as Asset3DCategory[];

export const IMPORT_STATUS_3D_LABELS: Record<Asset3DImportStatus, string> = {
  imported_binary: 'Imported (Offline Binary)',
  user_uploaded: 'User Uploaded (Offline)',
  linked_url: 'External Model URL',
  external_reference: 'External Repository Record'
};

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
  return null;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
