import { DepartmentId, VisualMediaItem } from '../modules/visual-library/types';
import { InteractiveAnnotation } from '../modules/visual-library/academicTypes';
import { BookRecord } from '../modules/knowledge-library/types';

export type AnatomicalCategoryId =
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'endocrine'
  | 'lymphatic'
  | 'sensory'
  | 'musculoskeletal'
  | 'tissues';

export interface AnatomicalCategoryMeta {
  id: AnatomicalCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  topicId: string;
}

export interface EngineDepartment {
  id: string;
  moduleId: DepartmentId | 'python';
  code: string;
  title: string;
  shortLabel: string;
  overview: string;
  subjectIds: string[];
}

export interface EngineSubject {
  id: string;
  departmentId: string;
  title: string;
  description: string;
  topicIds: string[];
}

export interface EngineTopic {
  id: string;
  departmentId: string;
  subjectId: string;
  title: string;
  unitLabel: string;
  summary: string;
  categoryId?: AnatomicalCategoryId;
  subtopicIds: string[];
  linkedTab?: string;
}

export interface EngineSubtopic {
  id: string;
  departmentId: string;
  subjectId: string;
  topicId: string;
  structureId?: string;
  title: string;
  summary: string;
  anatomyNotes?: string;
  structureNotes?: string;
  physiologyNotes?: string;
  functions?: string[];
  visualIds: string[];
  textbookRefIds: string[];
  relatedTopicIds: string[];
  relatedStructureIds?: string[];
}

export interface TextbookReferenceEntity {
  id: string;
  title: string;
  authors: string;
  editionNote: string;
  scopeNote: string;
  departments: string[];
  topicKeywords: string[];
}

export interface AnatomicalComponentEntry {
  name: string;
  role: string;
}

export type AnatomyDiagramKey =
  | 'heart'
  | 'nephron'
  | 'cell'
  | 'skin'
  | 'skeleton'
  | 'senses'
  | 'microscope'
  | 'neuron';

export interface AnatomicalStructureEntity {
  id: string;
  catalogNumber: number;
  name: string;
  scientificName?: string;
  alternateNames: string[];
  primaryCategory: AnatomicalCategoryId;
  categories: AnatomicalCategoryId[];
  departmentIds: string[];
  subjectId: string;
  topicId: string;
  subtopicIds: string[];
  relatedStructureIds: string[];
  overview?: string;
  definition?: string;
  anatomicalLocation?: string;
  structure?: string;
  components?: AnatomicalComponentEntry[];
  functions?: string[];
  physiology?: string;
  clinicalSignificance?: string[];
  pharmaceuticalRelevance?: string[];
  examEssentials?: string[];
  visualIds: string[];
  anatomyDiagramKey?: AnatomyDiagramKey;
  textbookRefIds: string[];
  searchKeywords: string[];
}

export interface LocalTopicPdfLink {
  id: string;
  structureId: string;
  bookId: string;
  bookTitle: string;
  pageNumber?: number;
  note?: string;
  createdAt: number;
}

export interface RecentStructureEntry {
  structureId: string;
  timestamp: number;
}

export interface PracticeCategoryStat {
  attempts: number;
  correct: number;
}

export interface AnatomyPracticeStats {
  totalAttempts: number;
  totalCorrect: number;
  byCategory: Record<string, PracticeCategoryStat>;
  recentMissedIds: string[];
  lastPracticedAt: number | null;
}

export interface UnifiedEngineSearchHit<T = unknown> {
  id: string;
  kind:
    | 'department'
    | 'topic'
    | 'subtopic'
    | 'structure'
    | 'visual'
    | 'structure_pin'
    | 'equipment'
    | 'experiment'
    | 'book';
  typeLabel: string;
  title: string;
  subtitle: string;
  payload: T;
  score: number;
}

export interface UnifiedEngineSearchResults {
  departments: UnifiedEngineSearchHit<EngineDepartment>[];
  topics: UnifiedEngineSearchHit<EngineTopic>[];
  subtopics: UnifiedEngineSearchHit<EngineSubtopic>[];
  structures: UnifiedEngineSearchHit<AnatomicalStructureEntity>[];
  visuals: UnifiedEngineSearchHit<VisualMediaItem>[];
  structurePins: UnifiedEngineSearchHit<{
    visual: VisualMediaItem;
    annotation: InteractiveAnnotation;
  }>[];
  equipment: UnifiedEngineSearchHit<{
    id: string;
    name: string;
    purpose: string;
    visualId?: string;
    visualQuery?: string;
    departmentTitle: string;
  }>[];
  experiments: UnifiedEngineSearchHit<{
    id: string;
    code: string;
    title: string;
    moduleId: string;
    tab: string;
    departmentTitle: string;
  }>[];
  books: UnifiedEngineSearchHit<BookRecord>[];
}
