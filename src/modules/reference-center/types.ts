import { BookDepartmentTag, LibraryBookMeta, SearchMatch } from '../knowledge-library/types';

export type ReferenceCollectionType =
  | 'pharmacopoeia'
  | 'textbook'
  | 'handbook'
  | 'standard'
  | 'research';

export type ReferenceNavSection =
  | 'overview'
  | 'pharmacopoeias'
  | 'textbooks'
  | 'handbooks'
  | 'standards'
  | 'research'
  | 'my_library';

export type AccessStatus =
  | 'imported_local'
  | 'open_access_portal'
  | 'licensed_external'
  | 'metadata_only';

export type AcademicEntityType =
  | 'department'
  | 'subject'
  | 'topic'
  | 'subtopic'
  | 'anatomy_structure'
  | 'experiment'
  | 'equipment'
  | 'chemical'
  | 'drug';

export interface AcademicConnection {
  id: string;
  entityType: AcademicEntityType;
  label: string;
  departmentId?: BookDepartmentTag | string;
  topicId?: string;
  notes?: string;
}

export interface ReferenceItem {
  id: string;
  collectionType: ReferenceCollectionType;
  title: string;
  shortTitle?: string;
  authors?: string;
  issuingAuthority?: string;
  edition?: string;
  publicationYear?: string;
  volumes?: string;
  subject: string;
  subCategory?: string; // e.g., Standard category or Handbook scope
  documentType?: string;
  description: string;
  abstract?: string;
  sourceName: string;
  accessStatus: AccessStatus;
  licenseInfo: string;
  externalUrl?: string;
  pdfUrl?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  isbn?: string;
  linkedBookId?: string; // Foreign key into libraryDb (zero duplicate PDF binary storage)
  chapterNotes?: string[]; // User-added or verified chapter headings (never fabricated)
  tags: string[];
  personalNotes?: string;
  bookmarked: boolean;
  customCollectionIds: string[];
  academicConnections: AcademicConnection[];
  linkedReferenceIds?: string[]; // e.g., research paper -> pharmacopoeia or textbook
  isSystemCatalog?: boolean;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
}

export type PharmacopoeiaSectionKey =
  | 'general_notices'
  | 'general_chapters'
  | 'monographs'
  | 'drug_substances'
  | 'pharmaceutical_preparations'
  | 'identification_tests'
  | 'assays'
  | 'impurity_testing'
  | 'specifications'
  | 'reagents'
  | 'reference_standards'
  | 'analytical_procedures';

export interface PharmacopoeiaSectionLink {
  id: string;
  sectionKey: PharmacopoeiaSectionKey;
  title: string;
  kind: 'pdf_page' | 'external_url' | 'educational_note';
  bookId?: string;
  pageNumber?: number;
  externalUrl?: string;
  note?: string;
  isOfficialStandard: boolean; // Explicit separation: false for educational explanations
  createdAt: number;
}

export interface PharmacopoeiaProfileMeta {
  referenceId: string; // matches ReferenceItem.id e.g., 'pharma_ip'
  code: 'IP' | 'BP' | 'USP-NF' | 'Ph. Eur.' | 'Ph. Int.';
  sectionLinks: PharmacopoeiaSectionLink[];
}

export interface CustomCollection {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  isDefault?: boolean;
}

export type StandardCategory =
  | 'WHO guidelines'
  | 'Regulatory guidance'
  | 'Drug safety'
  | 'Quality assurance'
  | 'Quality control'
  | 'Good Manufacturing Practices'
  | 'Good Laboratory Practices'
  | 'Good Clinical Practices'
  | 'Pharmaceutical manufacturing standards'
  | 'Validation guidelines'
  | 'Stability testing'
  | 'Analytical standards';

export const STANDARD_CATEGORIES: StandardCategory[] = [
  'WHO guidelines',
  'Regulatory guidance',
  'Drug safety',
  'Quality assurance',
  'Quality control',
  'Good Manufacturing Practices',
  'Good Laboratory Practices',
  'Good Clinical Practices',
  'Pharmaceutical manufacturing standards',
  'Validation guidelines',
  'Stability testing',
  'Analytical standards'
];

export const TEXTBOOK_SUBJECTS = [
  'Human Anatomy & Physiology',
  'Pharmaceutics',
  'Pharmacology',
  'Pharmaceutical Chemistry',
  'Pharmaceutical Analysis',
  'Pharmacognosy',
  'Pharmaceutical Microbiology',
  'Pharmaceutical Technology',
  'Healthcare Psychology & Communication',
  'Pharmaceutical Data Science & Python'
] as const;

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  imported_local: 'Imported Local PDF',
  open_access_portal: 'Open-Access Official Portal',
  licensed_external: 'Authorized / Publisher Access',
  metadata_only: 'Catalog Metadata Only'
};

export const COLLECTION_TYPE_LABELS: Record<ReferenceCollectionType, string> = {
  pharmacopoeia: 'Pharmacopoeia',
  textbook: 'Textbook',
  handbook: 'Handbook',
  standard: 'Standard & Guideline',
  research: 'Research & Publication'
};

export interface ResearchDiscoveryCandidate {
  id: string;
  source: 'Europe PMC' | 'Crossref' | 'OpenAlex';
  title: string;
  authors: string;
  journal: string;
  publicationYear: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  abstract?: string;
  externalUrl: string;
  oaPdfUrl?: string;
  isOpenAccess: boolean;
  licenseInfo: string;
}

export interface UnifiedSearchHit {
  id: string;
  kind: 'reference' | 'pdf_passage' | 'pdf_bookmark' | 'pdf_note' | 'pharmacopoeia_section';
  resourceTypeLabel: string;
  sourceLabel: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  matchedTerm: string;
  score: number;
  referenceId?: string;
  bookId?: string;
  book?: LibraryBookMeta;
  pageNumber?: number;
  externalUrl?: string;
  match?: SearchMatch;
}
