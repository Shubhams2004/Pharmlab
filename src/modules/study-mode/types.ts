import { DepartmentId } from '../visual-library/types';
import { BookDepartmentTag } from '../knowledge-library/types';

export type SyllabusVerificationStatus =
  | 'official_syllabus'
  | 'university_specific'
  | 'imported_syllabus'
  | 'unverified_syllabus';

export type ResourceVerificationBadge =
  | 'official_standard'
  | 'peer_reviewed'
  | 'open_textbook'
  | 'encyclopedic_open'
  | 'local_user'
  | 'unverified';

export type LearningDomainMode =
  | 'anatomy_physiology'
  | 'chemistry_analysis'
  | 'pharmaceutics'
  | 'pharmacognosy'
  | 'psychology_comm'
  | 'computing_pk'
  | 'general';

export type StudySectionKey =
  | 'overview'
  | 'definition'
  | 'introduction'
  | 'fundamentals'
  | 'classification'
  | 'anatomical_structure'
  | 'structure'
  | 'components'
  | 'functions'
  | 'physiology'
  | 'mechanism'
  | 'explanation'
  | 'examples'
  | 'applications'
  | 'clinical_significance'
  | 'pharmaceutical_relevance'
  | 'advantages_limitations'
  | 'important_concepts'
  | 'exam_essentials'
  | 'summary'
  | 'references';

export interface SyllabusSubtopicNode {
  id: string;
  title: string;
  summary?: string;
  keywords: string[];
  linkedStructureId?: string;
  linkedSubtopicId?: string;
}

export interface SyllabusTopicNode {
  id: string;
  syllabusId: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  unitId: string;
  unitNo: string;
  unitTitle: string;
  title: string;
  summary: string;
  lecturesLabel?: string;
  domainMode: LearningDomainMode;
  departmentId: DepartmentId | 'python';
  bookDepartment: BookDepartmentTag;
  keywords: string[];
  subtopics: SyllabusSubtopicNode[];
  linkedEngineTopicId?: string;
  linkedStructureIds?: string[];
  linkedLabTab?: string;
  recommendedSections: StudySectionKey[];
}

export interface SyllabusUnitNode {
  id: string;
  unitNo: string;
  title: string;
  lecturesLabel?: string;
  topics: SyllabusTopicNode[];
}

export interface SyllabusSubjectNode {
  id: string;
  code: string;
  title: string;
  courseType?: string;
  credits?: string;
  hoursLabel?: string;
  departmentId: DepartmentId | 'python';
  bookDepartment: BookDepartmentTag;
  objectives: string[];
  outcomes: Array<{ no: number; statement: string }>;
  references: string[];
  units: SyllabusUnitNode[];
}

export interface SyllabusProfile {
  id: string;
  course: string; // e.g. 'B.Pharm'
  degree: string; // e.g. 'Bachelor of Pharmacy'
  semester: string; // e.g. 'Semester I'
  university: string; // e.g. 'Pharmacy Council of India (PCI)'
  title: string;
  verificationStatus: SyllabusVerificationStatus;
  sourceName: string;
  sourceUrl?: string;
  accessDate: string;
  isSystemOfficial?: boolean;
  subjects: SyllabusSubjectNode[];
  createdAt: number;
  updatedAt: number;
}

export interface AcquiredTopicResource {
  id: string;
  topicId: string;
  title: string;
  providerId: string;
  sourceName: string;
  sourceUrl: string;
  pdfUrl?: string;
  imageUrl?: string;
  authors?: string;
  publisherOrJournal?: string;
  publicationDate?: string;
  license: string;
  accessDate: string;
  verificationStatus: ResourceVerificationBadge;
  resourceKind:
    | 'textbook_chapter'
    | 'research_paper'
    | 'review_article'
    | 'open_reference'
    | 'diagram'
    | 'pharmacopoeia_ref'
    | 'local_pdf_match';
  excerpt?: string;
  suggestedSection?: StudySectionKey;
  linkedBookId?: string;
  linkedPageNumber?: number;
  linkedVisualId?: string;
  savedAt: number;
}

export type ExamQuestionCategory =
  | 'mcq'
  | 'short_answer'
  | 'long_answer'
  | 'definition'
  | 'comparison'
  | 'mechanism'
  | 'diagram_based'
  | 'numerical'
  | 'practical_viva';

export type ExamQuestionSourceType =
  | 'actual_previous_year'
  | 'repeated_across_papers'
  | 'reference_based'
  | 'practice_question';

export interface ExamQuestionItem {
  id: string;
  subjectCode: string;
  unitNo?: string;
  topicId?: string;
  topicTitle: string;
  category: ExamQuestionCategory;
  sourceType: ExamQuestionSourceType;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  answerGuidance: string;
  marks?: number;
  paperId?: string;
  university?: string;
  examYear?: string;
  repeatedPaperRefs?: string[]; // Paper titles/years when observed in >=2 imported verified papers
  sourceAttribution: string;
  sourceUrl?: string;
  createdAt: number;
}

export interface ExamQuestionPaper {
  id: string;
  title: string;
  university: string;
  courseCode: string;
  semester: string;
  examSession: string; // e.g., 'Winter 2024'
  isVerifiedOfficialPaper: boolean;
  sourceName: string;
  sourceUrl?: string;
  accessDate: string;
  totalMarks?: number;
  parsedQuestionCount: number;
  rawTextExcerpt?: string;
  importedAt: number;
}

export type TopicImportanceLabel =
  | 'frequently_asked'
  | 'repeated_in_previous_papers'
  | 'syllabus_priority'
  | 'conceptually_important'
  | 'practice_recommended';

export interface TopicExamEvidence {
  topicId: string;
  verifiedPaperAppearanceCount: number;
  totalVerifiedPaperQuestions: number;
  repeatedQuestionsCount: number;
  marksTotalObserved: number | null;
  questionFormatsObserved: ExamQuestionCategory[];
  labels: TopicImportanceLabel[];
  analysisLimited: boolean;
  limitationReason: string;
}

export interface SavedConceptNote {
  id: string;
  title: string;
  note: string;
  sourceLabel?: string;
  createdAt: number;
}

export interface TopicStudyProgress {
  topicId: string;
  syllabusId: string;
  subjectCode: string;
  topicTitle: string;
  completed: boolean;
  bookmarked: boolean;
  readingProgressPct: number;
  sectionsVisited: StudySectionKey[];
  personalNotes: string;
  savedConcepts: SavedConceptNote[];
  lastStudiedAt: number;
}

export interface StudyWorkflowStep {
  id:
    | 'discover'
    | 'identify_syllabus'
    | 'extract_topics'
    | 'search_sources'
    | 'collect_references'
    | 'organize_content'
    | 'connect_media'
    | 'prepare_material'
    | 'connect_exam'
    | 'ready';
  label: string;
  status: 'pending' | 'active' | 'done' | 'warning';
  detail?: string;
}

export interface OnlineSyllabusCandidate {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  pdfUrl?: string;
  publisherOrUniversity: string;
  year?: string;
  summary: string;
  verificationHint: SyllabusVerificationStatus;
  licenseInfo: string;
  corsReadablePreview: boolean;
}

export type EnrichmentSectionKey =
  | 'learning_objectives'
  | 'definition'
  | 'overview'
  | 'core_concepts'
  | 'detailed_explanation'
  | 'mechanism_process'
  | 'classification_types'
  | 'components_structure'
  | 'examples_applications'
  | 'pharmaceutical_relevance'
  | 'clinical_relevance'
  | 'advantages_comparisons'
  | 'formulas_numericals'
  | 'exam_essentials'
  | 'important_questions'
  | 'practical_connections'
  | 'visual_connections'
  | 'references';

export type EnrichmentProvenance =
  | 'reference_supported'
  | 'user_written'
  | 'ai_verified'
  | 'needs_verification';

export type EnrichmentDepthLevel = 'foundation' | 'standard' | 'advanced';

export type EnrichmentOriginKind =
  | 'source_supported'
  | 'ai_draft'
  | 'user_written'
  | 'needs_verification';

export interface EnrichmentComparisonTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export type ContentQualityCheckKey =
  | 'scientific_relevance'
  | 'section_completeness'
  | 'explanation_depth'
  | 'terminology_consistency'
  | 'duplicate_content'
  | 'unsupported_claims'
  | 'formulas_units'
  | 'pharmaceutical_relevance'
  | 'source_attribution';

export type ContentQualityCheckStatus = 'pass' | 'warning' | 'attention_needed';

export interface ContentQualityCheckItem {
  key: ContentQualityCheckKey;
  label: string;
  status: ContentQualityCheckStatus;
  finding: string;
  suggestion?: string;
}

export interface ContentQualityReport {
  checkedAt: number;
  depth: EnrichmentDepthLevel;
  checks: ContentQualityCheckItem[];
  passCount: number;
  warningCount: number;
  attentionCount: number;
  disclaimer: string;
}

export type EnrichmentAttachmentKind =
  | 'reference_center'
  | 'resource_hub'
  | 'knowledge_pdf'
  | 'visual_library'
  | 'asset_3d'
  | 'experiment'
  | 'simulation'
  | 'anatomy_catalog'
  | 'manual_citation';

export interface EnrichmentSourceAttachment {
  id: string;
  sourceKind: EnrichmentAttachmentKind;
  itemId: string;
  title: string;
  subtitle?: string;
  url?: string;
  verified: boolean;
  attachedAt: number;
  priorityTier?: SourcePriorityTier;
  bookId?: string;
  pageNumber?: number;
  chapterHeading?: string;
}

export interface EnrichmentQuestionEntry {
  id: string;
  prompt: string;
  answerGuidance: string;
  category: ExamQuestionCategory;
  marks?: number;
}

export interface EnrichedSectionSnapshot {
  prose: string;
  bullets: string[];
  formulas: string[];
  comparisonTable?: EnrichmentComparisonTable;
  importantQuestions: EnrichmentQuestionEntry[];
  provenance: EnrichmentProvenance;
  depth?: EnrichmentDepthLevel;
  origin?: EnrichmentOriginKind;
  attachments: EnrichmentSourceAttachment[];
  savedAt: number;
}

export interface EnrichedSectionEntry {
  sectionKey: EnrichmentSectionKey;
  label: string;
  prose: string;
  bullets: string[];
  formulas: string[];
  comparisonTable?: EnrichmentComparisonTable;
  importantQuestions: EnrichmentQuestionEntry[];
  provenance: EnrichmentProvenance;
  depth?: EnrichmentDepthLevel;
  origin?: EnrichmentOriginKind;
  qualitySummary?: {
    passCount: number;
    warningCount: number;
    attentionCount: number;
  };
  gapRationale?: string;
  attachments: EnrichmentSourceAttachment[];
  wasAiAssisted: boolean;
  reviewedByUser: boolean;
  approvedAt: number;
  updatedAt: number;
  previousSnapshot?: EnrichedSectionSnapshot;
}

export interface EnrichedSectionDraft {
  sectionKey: EnrichmentSectionKey;
  prose: string;
  bullets: string[];
  formulas: string[];
  comparisonTable?: EnrichmentComparisonTable;
  importantQuestions: EnrichmentQuestionEntry[];
  isAiDraft: boolean;
  provenance: EnrichmentProvenance;
  depth?: EnrichmentDepthLevel;
  origin?: EnrichmentOriginKind;
  gapRationale?: string;
  attachments: EnrichmentSourceAttachment[];
  updatedAt: number;
}

export interface EnrichmentHistoryEntry {
  id: string;
  sectionKey: EnrichmentSectionKey;
  sectionLabel: string;
  action: 'accepted' | 'modified' | 'rejected' | 'undone' | 'draft_saved' | 'regenerated';
  provenance?: EnrichmentProvenance;
  depth?: EnrichmentDepthLevel;
  wasAiAssisted?: boolean;
  summary: string;
  timestamp: number;
}

export interface TopicEnrichmentRecord {
  topicId: string;
  syllabusId: string;
  subjectCode: string;
  topicTitle: string;
  approvedSections: Partial<Record<EnrichmentSectionKey, EnrichedSectionEntry>>;
  drafts: Partial<Record<EnrichmentSectionKey, EnrichedSectionDraft>>;
  history: EnrichmentHistoryEntry[];
  lastOpenedSection?: EnrichmentSectionKey;
  createdAt: number;
  updatedAt: number;
}

// P4.2.3: Textbook-First Scientific Verification Engine Types
export type SourcePriorityTier = 1 | 2 | 3 | 4;

export type ClaimVerificationStatus =
  | 'textbook_supported'
  | 'multiple_textbooks_supported'
  | 'partially_supported'
  | 'conflicting_evidence'
  | 'unsupported_by_books'
  | 'requires_manual_verification'
  | 'not_yet_checked';

export interface EvidenceQualityBreakdown {
  exactTermMatch: boolean;
  conceptualMatchScore: number; // 0..100 indicator of keyword/concept overlap — NOT certainty
  contextSufficient: boolean;
  sourcePriority: SourcePriorityTier;
  metadataCompleteness: 'complete' | 'partial' | 'minimal';
  pageAccuracy: 'exact_page' | 'catalog_level' | 'unindexed';
  extractionQuality: 'pdf_text' | 'ocr_text' | 'unsearchable';
  indicatorsSummary: string;
  notCertaintyDisclaimer: string;
}

export interface TextbookEvidenceLink {
  id: string;
  claimId: string;
  bookId: string;
  referenceId?: string;
  bookTitle: string;
  authors?: string;
  edition?: string;
  isbn?: string;
  priorityTier: SourcePriorityTier;
  chapterHeading?: string;
  pageNumber: number | null;
  passageExcerpt: string;
  contextBefore?: string;
  contextAfter?: string;
  extractionQuality: 'pdf_text' | 'ocr_text' | 'unsearchable';
  stance: 'supports' | 'partial' | 'contradicts' | 'contextual';
  relevanceIndicators: EvidenceQualityBreakdown;
  linkedBy: 'auto_matched' | 'user_linked';
  matchedTerm?: string;
  verifiedAt: number;
}

export interface ScientificClaimRecord {
  id: string;
  topicId: string;
  sectionKey: EnrichmentSectionKey;
  claimText: string;
  sourceOrigin: 'approved_enrichment' | 'draft_enrichment' | 'baseline_catalog';
  status: ClaimVerificationStatus;
  evidenceLinks: TextbookEvidenceLink[];
  manualNotes: string;
  contradictionNotes?: string;
  reviewedByUser: boolean;
  reviewedAt?: number;
  updatedAt: number;
}

export interface CrossTextbookComparison {
  claimOrTopicLabel: string;
  booksComparedCount: number;
  bookTitles: string[];
  agreedConcepts: string[];
  additionalPerspectives: Array<{
    bookTitle: string;
    pageNumber: number | null;
    chapterHeading?: string;
    note: string;
  }>;
  terminologyDifferences: string[];
  classificationDifferences: string[];
  conflictingStatements: Array<{
    summary: string;
    passages: Array<{
      bookTitle: string;
      pageNumber: number | null;
      excerpt: string;
    }>;
  }>;
  editionDifferences: string[];
  note: string;
}

export interface TopicVerificationRecord {
  topicId: string;
  syllabusId: string;
  subjectCode: string;
  topicTitle: string;
  claims: ScientificClaimRecord[];
  lastVerifiedAt: number;
  bookSnapshotIds: string[];
  searchableBooksCount: number;
  unsearchableBooksCount: number;
  limitationNotices: string[];
  updatedAt: number;
}


