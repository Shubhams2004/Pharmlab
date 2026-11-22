import { DepartmentId, VisualCategory } from '../visual-library/types';
import { BookDepartmentTag, DocumentCategory } from '../knowledge-library/types';

export type ResourceHubTab = 'discover' | 'visuals' | 'sources' | 'saved';

export type ResourceProviderId =
  | 'europepmc'
  | 'pubmed'
  | 'pmc'
  | 'ncbi_bookshelf'
  | 'openstax'
  | 'wikimedia'
  | 'pubchem'
  | 'gbif';

export type ResourceType =
  | 'textbook'
  | 'research_paper'
  | 'review_article'
  | 'anatomical_diagram'
  | 'histology_image'
  | 'scientific_illustration'
  | 'medical_reference'
  | 'educational_material';

export type PublicationDateWindow = 'all' | '1y' | '5y' | '10y';
export type ResourceSortMode = 'relevance' | 'date_desc';

export type ImportStatus =
  | 'external'
  | 'saved_reference'
  | 'pending_import'
  | 'imported'
  | 'failed'
  | 'unavailable';

export type AccessType =
  | 'open_access_pdf'
  | 'open_access_web'
  | 'abstract_only'
  | 'open_image';

export type VisualDiscoveryCategoryId =
  | 'all'
  | 'human_anatomy'
  | 'organ_systems'
  | 'histology'
  | 'microscopy'
  | 'cells'
  | 'microorganisms'
  | 'pharmaceutical_sciences'
  | 'chemical_structures'
  | 'scientific_instruments'
  | 'pathology'
  | 'physiology';

export interface AcademicContextRef {
  id: string;
  kind: 'department' | 'structure' | 'topic' | 'experiment' | 'equipment';
  label: string;
  departmentId?: DepartmentId;
  structureId?: string;
  moduleId?: string;
  tab?: string;
}

export interface ScientificResourceIdentifiers {
  pmid?: string;
  pmcid?: string;
  doi?: string;
  nbkId?: string;
  isbn?: string;
  openStaxSlug?: string;
  wikimediaPageId?: string;
  pubchemCid?: string;
}

export interface ScientificResourceItem {
  id: string;
  providerId: ResourceProviderId;
  providerName: string;
  title: string;
  resourceType: ResourceType;
  authors: string[];
  journalOrPublisher: string;
  publicationDate: string;
  year: number | null;
  summary: string;
  abstractText?: string;
  sourceUrl: string;
  pdfUrl?: string;
  imageUrl?: string;
  previewUrl?: string;
  license: string;
  licenseUrl?: string;
  attribution?: string;
  isOpenAccess: boolean;
  isPermissiveLicense: boolean;
  licenseWarning?: string;
  accessType: AccessType;
  canDirectImportVisual: boolean;
  canAttemptDirectPdfImport: boolean;
  identifiers: ScientificResourceIdentifiers;
  topics: string[];
  suggestedCategory: VisualCategory;
  suggestedDepartments: DepartmentId[];
  mimeType?: string;
  width?: number;
  height?: number;
  relevanceScore: number;
}

export interface ProviderCapabilities {
  id: ResourceProviderId;
  name: string;
  shortName: string;
  description: string;
  baseDomain: string;
  supportedTypes: ResourceType[];
  corsSearchSupported: boolean;
  directBrowserPdfImportNote: string;
  defaultEnabled: boolean;
  requiresApiKey: boolean;
}

export interface SavedResourceRecord {
  id: string;
  resourceKey: string;
  resource: ScientificResourceItem;
  status: ImportStatus;
  destination?: 'visual_library' | 'knowledge_library' | 'reference_list';
  linkedBookId?: string;
  linkedVisualId?: string;
  linkedContexts: AcademicContextRef[];
  linkedTopics: string[];
  importNote?: string;
  lastError?: string;
  savedAt: number;
  updatedAt: number;
}

export interface ResourceDiscoveryFilters {
  providers?: ResourceProviderId[];
  resourceTypes?: ResourceType[];
  dateWindow?: PublicationDateWindow;
  sortMode?: ResourceSortMode;
}

export interface ProviderSearchResponse {
  providerId: ResourceProviderId;
  items: ScientificResourceItem[];
  warning?: string;
}

export interface UnifiedDiscoveryResult {
  items: ScientificResourceItem[];
  warnings: string[];
  providerCounts: Partial<Record<ResourceProviderId, number>>;
  offline: boolean;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  reason?: string;
  savedRecord?: SavedResourceRecord;
  existingBookId?: string;
  existingBookTitle?: string;
  existingVisualId?: string;
  existingVisualTitle?: string;
}

export interface PdfImportOverrides {
  title?: string;
  category: DocumentCategory;
  department: BookDepartmentTag;
  contexts: AcademicContextRef[];
  topics: string[];
  note?: string;
}

export interface VisualImportOverrides {
  title?: string;
  category: VisualCategory;
  departments: DepartmentId[];
  contexts: AcademicContextRef[];
  topics: string[];
  note?: string;
}
