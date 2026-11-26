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

export type PharmacopoeiaAvailabilityStatus =
  | 'official_locally_available'
  | 'imported_user_pdf'
  | 'publicly_accessible'
  | 'external_official_reference'
  | 'subscription_restricted'
  | 'unavailable';

export const AVAILABILITY_STATUS_LABELS: Record<PharmacopoeiaAvailabilityStatus, string> = {
  official_locally_available: 'Official content locally available',
  imported_user_pdf: 'Imported user-owned PDF',
  publicly_accessible: 'Publicly accessible content',
  external_official_reference: 'External official reference',
  subscription_restricted: 'Subscription-restricted reference',
  unavailable: 'Information unavailable'
};

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

export type KnowledgeEntityKind =
  | 'drug_substance'
  | 'excipient'
  | 'dosage_form'
  | 'analytical_test'
  | 'standard_concept'
  | 'crude_drug';

export const KNOWLEDGE_KIND_LABELS: Record<KnowledgeEntityKind, string> = {
  drug_substance: 'Drug / API',
  excipient: 'Excipient / Vehicle',
  dosage_form: 'Dosage Form / Preparation',
  analytical_test: 'Analytical Test / Assay',
  standard_concept: 'Quality Standard / Impurity Concept',
  crude_drug: 'Botanical / Crude Drug'
};

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
  recentSearches: string[];
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

export interface LabConnectionRef {
  label: string;
  kind: 'module' | 'experiment' | 'visual';
  moduleId?: string;
  tab?: string;
  experimentId?: string;
  visualId?: string;
  description: string;
}

export interface AcademicTopicLinkRef {
  subjectCode: string;
  subjectTitle: string;
  topicTitle: string;
  syllabusId?: string;
  topicId?: string;
}

export interface SubstanceWorkspaceRecord {
  id: string;
  name: string;
  kind: KnowledgeEntityKind;
  synonyms: string[];
  categoryLabel: string;
  dataSourceOrigin: string;
  overview: string;
  chemicalInfo?: {
    formula?: string;
    chemicalName?: string;
    functionalGroups?: string;
    physicalNotes?: string;
  };
  identification?: string[];
  assayInfo?: {
    methodName: string;
    titrantOrTechnique: string;
    indicator?: string;
    formulaNote?: string;
    educationalExplanation: string;
  };
  analyticalMethods?: string[];
  qualityControl?: string[];
  impurities?: string[];
  pharmaceuticalApplications?: string[];
  relevantPharmacopoeiaIds: string[];
  relatedTestIds?: string[];
  textbookKeywords: string[];
  academicLinks: AcademicTopicLinkRef[];
  labConnections: LabConnectionRef[];
}

export interface EducationalTestModule {
  id: string;
  testName: string;
  categoryId: AnalyticalTestCategoryId;
  aliases: string[];
  dataSourceOrigin: string;
  purpose: string;
  scientificPrinciple: string;
  whatItMeasures: string;
  chemicalOrPhysicalProcess: string;
  instrumentsAndApparatus: string[];
  educationalProcedure: string[];
  calculationSection?: {
    formulaLabel: string;
    formulaExpression: string;
    variablesNote: string;
    exampleSummary: string;
  };
  resultInterpretation: string;
  commonErrors: string[];
  linkedPharmacopoeiaIds: string[];
  textbookKeywords: string[];
  labConnections: LabConnectionRef[];
  academicLinks: AcademicTopicLinkRef[];
}

export interface TextbookPdfHit {
  id: string;
  bookId: string;
  bookTitle: string;
  authors?: string;
  department: string;
  pageNumber: number;
  snippet: string;
  isPharmacopoeiaLinked: boolean;
  linkedEntryAbbreviation?: string;
}

export interface SeededTextbookMatch {
  id: string;
  title: string;
  authors?: string;
  subject: string;
  collectionType: string;
  accessLabel: string;
  description: string;
  externalUrl?: string;
}

export interface AcademicTopicSearchHit {
  id: string;
  subjectCode: string;
  subjectTitle: string;
  topicTitle: string;
  summary: string;
  syllabusId?: string;
  topicId?: string;
  sourceLabel: string;
}

export interface UnifiedKnowledgeSearchResponse {
  query: string;
  textbookPdfHits: TextbookPdfHit[];
  seededTextbooks: SeededTextbookMatch[];
  substances: SubstanceWorkspaceRecord[];
  analyticalTests: EducationalTestModule[];
  academicTopics: AcademicTopicSearchHit[];
  pharmacopoeiaResults: UnifiedPharmacopoeiaSearchResult[];
  hasAnyImportedBooks: boolean;
  totalHits: number;
}

export type PharmacopoeiaWorkspaceTab =
  | 'dashboard'
  | 'search'
  | 'analytical_lab'
  | 'compare'
  | 'directory'
  | 'official_sources'
  | 'bookmarks'
  | 'editions';

export interface PharmacopoeiaCenterJumpTarget {
  tab?: PharmacopoeiaWorkspaceTab | null;
  entryId?: string | null;
  substanceId?: string | null;
  testId?: string | null;
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
