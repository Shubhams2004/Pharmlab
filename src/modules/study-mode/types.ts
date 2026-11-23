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
