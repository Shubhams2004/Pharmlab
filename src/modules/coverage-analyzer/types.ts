import {
  AcquiredTopicResource,
  EnrichmentSectionKey,
  ExamQuestionItem,
  ExamQuestionPaper,
  LearningDomainMode,
  SyllabusProfile,
  TopicEnrichmentRecord,
  TopicStudyProgress
} from '../study-mode/types';
import { LibraryBookMeta } from '../knowledge-library/types';
import { VisualMediaItem } from '../visual-library/types';
import { ReferenceItem } from '../reference-center/types';
import { Asset3DItem } from '../assets-3d/types';
import { SavedScientificResource } from '../resource-hub/types';

export type CoverageStatus =
  | 'complete'
  | 'substantially_complete'
  | 'partially_complete'
  | 'minimal_content'
  | 'missing_content'
  | 'needs_verification';

export type ComponentCheckStatus =
  | 'present'
  | 'partial'
  | 'missing'
  | 'not_applicable'
  | 'needs_review';

export type ComponentCheckKey =
  | 'topic_overview'
  | 'definitions'
  | 'core_concepts'
  | 'detailed_explanation'
  | 'mechanism_process'
  | 'structures_components'
  | 'formulas_calculations'
  | 'examples'
  | 'pharmaceutical_relevance'
  | 'clinical_relevance'
  | 'learning_objectives'
  | 'exam_essentials'
  | 'references'
  | 'visual_resources'
  | 'experiments_practical'
  | 'assessment_questions';

export type ResourceCheckKey =
  | 'textbooks'
  | 'verified_sources'
  | 'images'
  | 'diagrams'
  | 'microscopy_visuals'
  | 'models_3d'
  | 'interactive_simulations'
  | 'experiments'
  | 'mcqs'
  | 'pyqs';

export type GapSeverity = 'critical' | 'high' | 'medium' | 'low';

export type GapCategory =
  | 'missing_content'
  | 'weak_content'
  | 'missing_references'
  | 'missing_visuals'
  | 'missing_microscopy'
  | 'missing_3d'
  | 'missing_experiments'
  | 'missing_simulations'
  | 'missing_assessments'
  | 'missing_pyq'
  | 'hierarchy_incomplete'
  | 'verification_issue';

export interface TopicComponentAudit {
  key: ComponentCheckKey;
  label: string;
  status: ComponentCheckStatus;
  applicable: boolean;
  applicabilityReason: string;
  evidence: string;
  verificationNote?: string;
}

export interface ResourceCoverageItem {
  key: ResourceCheckKey;
  label: string;
  status: ComponentCheckStatus;
  applicable: boolean;
  count: number;
  applicabilityReason: string;
  evidence: string;
  linkedItems: Array<{
    id: string;
    title: string;
    source: string;
  }>;
}

export type GapActionDestination =
  | 'study_mode'
  | 'enrichment_workspace'
  | 'reference_center'
  | 'resource_hub'
  | 'knowledge_library'
  | 'visual_library'
  | 'assets_3d'
  | 'explorer_3d'
  | 'interactive_experiments'
  | 'syllabus'
  | 'department_lab';

export interface GapActionRoute {
  label: string;
  destinationLabel: string;
  targetModule: GapActionDestination;
  params?: {
    syllabusId?: string;
    subjectCode?: string;
    topicId?: string;
    sectionKey?: EnrichmentSectionKey;
    view?: 'study' | 'exam';
    department?: string;
    category?: string;
    tab?: string;
    query?: string;
    structureId?: string;
    experimentId?: string;
    assetId?: string;
  };
}

export interface TopicGapItem {
  id: string;
  courseId: string;
  courseTitle: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  unitId: string;
  unitNo: string;
  unitTitle: string;
  topicId: string;
  topicTitle: string;
  category: GapCategory;
  severity: GapSeverity;
  priorityScore: number;
  priorityReason: string;
  title: string;
  detail: string;
  suggestedAction: GapActionRoute;
  secondaryActions: GapActionRoute[];
}

export interface TopicCoverageReport {
  id: string;
  courseId: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  unitId: string;
  unitNo: string;
  unitTitle: string;
  title: string;
  domainMode: LearningDomainMode;
  departmentId: string;
  subtopicCount: number;
  subtopicsWithContentCount: number;
  verifiedContentChars: number;
  completenessPct: number;
  resourceCoveragePct: number;
  status: CoverageStatus;
  statusReasons: string[];
  needsVerification: boolean;
  verificationReasons: string[];
  learnerProgressPct: number;
  learnerCompleted: boolean;
  componentChecks: TopicComponentAudit[];
  resourceChecks: ResourceCoverageItem[];
  applicableComponentsCount: number;
  presentComponentsCount: number;
  partialComponentsCount: number;
  missingComponentsCount: number;
  applicableResourcesCount: number;
  connectedResourcesCount: number;
  totalLinkedResourceItems: number;
  gaps: TopicGapItem[];
  subtopicsSummary: Array<{
    id: string;
    title: string;
    summaryLength: number;
    hasStructureLink: boolean;
    hasEngineDetail: boolean;
  }>;
  quickActions: GapActionRoute[];
}

export interface UnitCoverageReport {
  id: string;
  subjectId: string;
  subjectCode: string;
  unitNo: string;
  title: string;
  lecturesLabel?: string;
  topicCount: number;
  subtopicCount: number;
  completenessPct: number;
  resourceCoveragePct: number;
  completeCount: number;
  substantiallyCompleteCount: number;
  partiallyCompleteCount: number;
  minimalContentCount: number;
  missingContentCount: number;
  needsVerificationCount: number;
  gapCount: number;
  criticalGapCount: number;
  highGapCount: number;
  topics: TopicCoverageReport[];
  priorityGaps: TopicGapItem[];
}

export interface SubjectCoverageReport {
  id: string;
  courseId: string;
  code: string;
  title: string;
  courseType: string;
  credits: number;
  departmentId: string;
  totalUnits: number;
  totalTopics: number;
  totalSubtopics: number;
  topicsWithAcademicContent: number;
  topicsWithIncompleteContent: number;
  topicsWithNoContent: number;
  topicsNeedingVerification: number;
  topicsWithReferences: number;
  topicsWithVisuals: number;
  topicsWith3DModels: number;
  topicsWithExperiments: number;
  topicsWithSimulations: number;
  topicsWithAssessments: number;
  topicsWithPyqs: number;
  applicableVisualTopicsCount: number;
  applicable3DTopicsCount: number;
  applicableExperimentTopicsCount: number;
  applicableSimulationTopicsCount: number;
  completenessPct: number;
  resourceCoveragePct: number;
  hierarchyIssues: string[];
  units: UnitCoverageReport[];
  gaps: TopicGapItem[];
  improvementChecklist: TopicGapItem[];
}

export interface CourseCoverageReport {
  syllabusId: string;
  courseLabel: string;
  semesterLabel: string;
  university: string;
  verificationStatus: SyllabusProfile['verificationStatus'];
  isSystemOfficial: boolean;
  totalSubjects: number;
  totalUnits: number;
  totalTopics: number;
  totalSubtopics: number;
  overallCompletenessPct: number;
  overallResourceCoveragePct: number;
  statusBreakdown: Record<CoverageStatus, number>;
  gapSeverityBreakdown: Record<GapSeverity, number>;
  resourceBreakdown: {
    referencesPct: number;
    visualsPct: number;
    models3dPct: number;
    experimentsPct: number;
    assessmentsPct: number;
  };
  subjects: SubjectCoverageReport[];
  allGaps: TopicGapItem[];
  priorityQueue: TopicGapItem[];
  hierarchyIssues: string[];
}

export interface AuditDataSourcesSummary {
  syllabiCount: number;
  anatomyCatalogCount: number;
  engineTopicsCount: number;
  engineSubtopicsCount: number;
  referenceCatalogCount: number;
  localBooksCount: number;
  visualsCount: number;
  assets3dCount: number;
  experimentsCatalogCount: number;
  interactiveSimsCount: number;
  curatedQuestionsCount: number;
  storedQuestionsCount: number;
  importedPapersCount: number;
  acquiredResourcesCount: number;
  resourceHubSavedCount: number;
}

export interface CoverageAuditReport {
  auditId: string;
  generatedAt: number;
  courses: CourseCoverageReport[];
  sources: AuditDataSourcesSummary;
}

export interface AnalyzerRawInputs {
  syllabi: SyllabusProfile[];
  acquiredResources: AcquiredTopicResource[];
  topicProgress: Record<string, TopicStudyProgress>;
  storedQuestions: ExamQuestionItem[];
  questionPapers: ExamQuestionPaper[];
  references: ReferenceItem[];
  books: LibraryBookMeta[];
  visuals: VisualMediaItem[];
  assets3d: Asset3DItem[];
  resourceHubSaved: SavedScientificResource[];
  topicEnrichments?: Record<string, TopicEnrichmentRecord>;
}

export interface TopicAuditFingerprint {
  topicId: string;
  subjectCode: string;
  title: string;
  status: CoverageStatus;
  completenessPct: number;
  resourceCoveragePct: number;
  linkedResourceItems: number;
  gapCount: number;
}

export interface CoverageAuditSnapshot {
  snapshotId: string;
  syllabusId: string;
  courseLabel: string;
  timestamp: number;
  totalSubjects: number;
  totalUnits: number;
  totalTopics: number;
  totalSubtopics: number;
  overallCompletenessPct: number;
  overallResourceCoveragePct: number;
  statusBreakdown: Record<CoverageStatus, number>;
  gapSeverityBreakdown: Record<GapSeverity, number>;
  totalLinkedResourceItems: number;
  subjectScores: Array<{
    code: string;
    title: string;
    completenessPct: number;
    resourceCoveragePct: number;
    gapCount: number;
  }>;
  topics: TopicAuditFingerprint[];
}

export interface AuditComparisonDiff {
  previousTimestamp: number;
  currentTimestamp: number;
  completenessDeltaPct: number;
  resourceCoverageDeltaPct: number;
  newlyLinkedResourcesCount: number;
  resolvedGapCountDelta: number;
  newlyCompletedTopics: Array<{
    topicId: string;
    subjectCode: string;
    title: string;
    previousStatus: CoverageStatus;
    currentStatus: CoverageStatus;
  }>;
  improvedTopics: Array<{
    topicId: string;
    subjectCode: string;
    title: string;
    previousPct: number;
    currentPct: number;
    deltaPct: number;
  }>;
  newlyIdentifiedGaps: Array<{
    topicId: string;
    subjectCode: string;
    title: string;
    previousGapCount: number;
    currentGapCount: number;
  }>;
}
