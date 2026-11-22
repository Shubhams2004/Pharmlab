import type {
  AcademicDomain,
  InteractiveAnnotation,
  UserAcademicEnrichment
} from './academicTypes';

export type DepartmentId =
  | 'anatomy'
  | 'general_pharmacy'
  | 'inorganic'
  | 'pharmacognosy'
  | 'psychology'
  | 'python';

export type VisualCategory =
  | 'anatomy'
  | 'pharmacology'
  | 'microscopy'
  | 'apparatus'
  | 'botany'
  | 'chemistry'
  | 'microbiology'
  | 'formulation'
  | 'clinical';

export type VisualSourceType =
  | 'built-in'
  | 'upload'
  | 'textbook-crop'
  | 'open-access';

export interface VisualMediaItem {
  id: string;
  title: string;
  caption: string;
  description: string;
  category: VisualCategory;
  departments: DepartmentId[];
  topics: string[];
  experiments: string[];
  equipment: string[];
  tags: string[];
  sourceType: VisualSourceType;
  sourceName: string;
  sourceUrl?: string;
  creator?: string;
  license: string;
  attribution?: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSize: number;
  assetUrl?: string;
  remoteUrl?: string;
  linkedBookId?: string;
  linkedBookPage?: number;
  hasLocalBlob: boolean;
  createdAt: number;
  updatedAt: number;
  /** Link to a reusable AcademicSubjectResource in academicRegistry.ts */
  subjectId?: string;
  /** Optional explicit academic domain override */
  academicDomain?: AcademicDomain;
  /** User-supplied academic enrichment stored in IndexedDB */
  academicData?: UserAcademicEnrichment;
  /** User-added or enriched interactive pin annotations stored in IndexedDB */
  annotations?: InteractiveAnnotation[];
}

export interface OpenAccessCandidate {
  id: string;
  repository: 'Wikimedia Commons' | 'OpenStax (Wikimedia)' | 'PubChem (NIH)' | 'GBIF Botanical';
  title: string;
  description: string;
  previewUrl: string;
  fullUrl: string;
  sourceUrl: string;
  creator: string;
  license: string;
  licenseUrl?: string;
  attribution: string;
  isPermissiveLicense: boolean;
  licenseWarning?: string;
  mimeType: string;
  width?: number;
  height?: number;
  suggestedCategory: VisualCategory;
  suggestedDepartments: DepartmentId[];
}

export interface VisualContextFilter {
  department?: DepartmentId;
  topic?: string;
  experiment?: string;
  equipment?: string;
}

export const DEPARTMENT_LABELS: Record<DepartmentId, string> = {
  anatomy: 'Anatomy & Physiology (BP104T)',
  general_pharmacy: 'Pharmaceutics (BP102T)',
  inorganic: 'Inorganic Chemistry (BP106T)',
  pharmacognosy: 'Pharmacognosy (BP105T)',
  psychology: 'Psychology & Comm. (BP103T)',
  python: 'Python & PK Data (BP101T)'
};

export const CATEGORY_LABELS: Record<VisualCategory, string> = {
  anatomy: 'Anatomy',
  pharmacology: 'Pharmacology',
  microscopy: 'Microscopy & Histology',
  apparatus: 'Lab Equipment',
  botany: 'Botanical / Crude Drugs',
  chemistry: 'Chemistry & Structures',
  microbiology: 'Microbiology',
  formulation: 'Formulations',
  clinical: 'Clinical & Communication'
};
