export type PharmacopoeiaClassification =
  | 'primary_pharmacopoeia'
  | 'international_pharmacopoeia'
  | 'reference_book';

export type ContentAccessType =
  | 'public'
  | 'subscription'
  | 'licensed'
  | 'restricted'
  | 'unknown';

export type SearchSupportType =
  | 'official_public_portal'
  | 'local_imported_pdf'
  | 'catalog_metadata_only';

export type PharmacopoeiaDepartmentKey =
  | 'pharmaceutical_analysis'
  | 'pharmaceutical_chemistry'
  | 'pharmaceutics'
  | 'industrial_pharmacy'
  | 'quality_assurance'
  | 'pharmacology'
  | 'pharmaceutical_microbiology'
  | 'pharmacognosy';

export type SearchResultOrigin =
  | 'local_metadata'
  | 'imported_reference_file'
  | 'public_official_source'
  | 'external_official_portal';

export type AnalyticalTestCategoryId =
  | 'assays_titrimetry'
  | 'limit_tests_impurities'
  | 'identification_spectroscopy'
  | 'dissolution_release'
  | 'disintegration_physical'
  | 'sterility_microbial'
  | 'chromatography_separation'
  | 'reagents_standards';

export type StandardCategoryId =
  | 'general_notices'
  | 'general_chapters'
  | 'drug_substances'
  | 'dosage_forms'
  | 'excipients'
  | 'impurities_elemental'
  | 'quality_guidance';

export interface OfficialAccessLink {
  id: string;
  label: string;
  url: string;
  kind: 'portal' | 'notices' | 'compendium' | 'documentation';
  note?: string;
}

export interface PharmacopoeiaDirectoryEntry {
  id: string;
  abbreviation: string;
  fullName: string;
  classification: PharmacopoeiaClassification;
  isPharmacopoeia: boolean;
  countryOrRegion: string;
  issuingOrganization: string;
  description: string;
  purpose: string;
  scope: string;
  officialWebsite: string;
  onlineAccessibilityStatus: string;
  contentAccessType: ContentAccessType;
  accessLimitations: string;
  searchSupport: SearchSupportType;
  relevantDepartments: PharmacopoeiaDepartmentKey[];
  syllabusRelevance: string[];
  officialLinks: OfficialAccessLink[];
  officialNoticesUrl: string;
  verifiedEditionSummary: string;
  editionTrackingNote: string;
  analyticalTestCategories: AnalyticalTestCategoryId[];
  standardCategories: StandardCategoryId[];
  searchableKeywords: string[];
  linkedReferenceCenterId?: string;
}

export interface AnalyticalTestFacet {
  id: AnalyticalTestCategoryId;
  title: string;
  summary: string;
  typicalMethods: string[];
  relevantDepartments: PharmacopoeiaDepartmentKey[];
  pharmacopoeiaIds: string[];
  recommendedSearchQuery: string;
}

export interface StandardCategoryFacet {
  id: StandardCategoryId;
  title: string;
  summary: string;
  examples: string[];
  pharmacopoeiaIds: string[];
  recommendedSearchQuery: string;
}

export interface EditionAmendmentRecord {
  id: string;
  entryId: string;
  recordKind: 'edition' | 'supplement' | 'amendment' | 'addendum' | 'official_notice';
  title: string;
  identifier: string;
  effectiveOrPublishedDate?: string;
  sourceLabel: string;
  sourceUrl?: string;
  notes: string;
  isUserRecorded: boolean;
  createdAt: number;
}

export interface UserSavedLink {
  id: string;
  entryId: string;
  title: string;
  url: string;
  category: 'monograph_portal' | 'amendment_notice' | 'study_guide' | 'institutional_access' | 'other';
  note?: string;
  createdAt: number;
}

export interface PharmacopoeiaStudyCollection {
  id: string;
  name: string;
  description: string;
  entryIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PharmacopoeiaAcademicLink {
  id: string;
  entryId: string;
  departmentKey: PharmacopoeiaDepartmentKey;
  syllabusId?: string;
  subjectCode: string;
  subjectTitle: string;
  unitTitle?: string;
  topicId?: string;
  topicTitle: string;
  subtopicTitle?: string;
  experimentModuleId?: string;
  experimentTitle?: string;
  rationale: string;
  isUserAdded: boolean;
  createdAt: number;
}

export interface OfficialSourceCheckRecord {
  entryId: string;
  lastCheckedAt: number;
  checkedUrl: string;
  note?: string;
}

export interface RecentlyAccessedEntry {
  entryId: string;
  accessedAt: number;
}

export interface PharmacopoeiaUserStore {
  bookmarkedIds: string[];
  recentlyAccessed: RecentlyAccessedEntry[];
  notesByEntryId: Record<string, string>;
  comparisonNotesByKey: Record<string, string>;
  customLinks: UserSavedLink[];
  collections: PharmacopoeiaStudyCollection[];
  editionRecords: EditionAmendmentRecord[];
  academicLinks: PharmacopoeiaAcademicLink[];
  sourceChecks: Record<string, OfficialSourceCheckRecord>;
}

export interface UnifiedPharmacopoeiaSearchResult {
  id: string;
  origin: SearchResultOrigin;
  originLabel: string;
  entryId?: string;
  entryAbbreviation?: string;
  title: string;
  subtitle: string;
  snippet: string;
  accessType: ContentAccessType;
  externalUrl?: string;
  bookId?: string;
  pageNumber?: number;
  matchedTopics?: string[];
  relevanceScore: number;
}

export type PharmacopoeiaWorkspaceTab =
  | 'dashboard'
  | 'directory'
  | 'search'
  | 'compare'
  | 'official_sources'
  | 'bookmarks'
  | 'editions';

export interface PharmacopoeiaCenterJumpTarget {
  tab?: PharmacopoeiaWorkspaceTab | null;
  entryId?: string | null;
  query?: string | null;
  department?: PharmacopoeiaDepartmentKey | null;
  nonce: number;
}

export const CLASSIFICATION_LABELS: Record<PharmacopoeiaClassification, string> = {
  primary_pharmacopoeia: 'Primary Pharmacopoeia',
  international_pharmacopoeia: 'International & Additional Pharmacopoeia',
  reference_book: 'Pharmaceutical Reference Book (Not a Pharmacopoeia)'
};

export const ACCESS_TYPE_LABELS: Record<ContentAccessType, string> = {
  public: 'Publicly Accessible Online',
  subscription: 'Subscription / Institutional License',
  licensed: 'Licensed / Registered Portal',
  restricted: 'Restricted / Regional Official Publication',
  unknown: 'Access Status Unverified'
};

export const DEPARTMENT_LABELS: Record<PharmacopoeiaDepartmentKey, string> = {
  pharmaceutical_analysis: 'Pharmaceutical Analysis',
  pharmaceutical_chemistry: 'Pharmaceutical Chemistry',
  pharmaceutics: 'Pharmaceutics',
  industrial_pharmacy: 'Industrial Pharmacy',
  quality_assurance: 'Quality Assurance',
  pharmacology: 'Pharmacology',
  pharmaceutical_microbiology: 'Pharmaceutical Microbiology',
  pharmacognosy: 'Pharmacognosy'
};

export const ORIGIN_LABELS: Record<SearchResultOrigin, string> = {
  local_metadata: 'Local PharmaLab metadata',
  imported_reference_file: 'Imported reference file',
  public_official_source: 'Publicly accessible official source',
  external_official_portal: 'External official portal'
};
