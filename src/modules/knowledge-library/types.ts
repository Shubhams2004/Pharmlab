export type DocumentCategory = 'textbook' | 'manual' | 'notes' | 'research';

export type BookDepartmentTag =
  | 'all'
  | 'anatomy'
  | 'general_pharmacy'
  | 'inorganic'
  | 'pharmacognosy'
  | 'psychology'
  | 'python';

export const BOOK_DEPARTMENT_LABELS: Record<BookDepartmentTag, string> = {
  all: 'All Subjects / General',
  anatomy: 'Anatomy & Physiology (BP104T)',
  general_pharmacy: 'Pharmaceutics (BP102T)',
  inorganic: 'Inorganic Chemistry (BP106T)',
  pharmacognosy: 'Pharmacognosy (BP105T)',
  psychology: 'Psychology & Comm. (BP103T)',
  python: 'Python & PK Data (BP101T)'
};

export type ExtractionStatus = 'ready' | 'partial' | 'no-text';

export interface LibraryBookMeta {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  uploadedAt: number;
  lastOpenedAt: number | null;
  lastReadPage: number;
  hasSearchableText: boolean;
  searchablePagesCount: number;
  isScannedOrEmpty: boolean;
  extractionStatus: ExtractionStatus;
  category: DocumentCategory;
  department?: BookDepartmentTag;
}

export interface BookPageText {
  bookId: string;
  pageNumber: number;
  text: string;
}

export interface BookBookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  label: string;
  excerpt: string;
  createdAt: number;
}

export type HighlightColor = 'amber' | 'emerald' | 'blue' | 'rose';

export interface BookHighlightNote {
  id: string;
  bookId: string;
  pageNumber: number;
  quote: string;
  note: string;
  color: HighlightColor;
  createdAt: number;
}

export interface SearchMatch {
  id: string;
  bookId: string;
  pageNumber: number;
  score: number;
  matchCountOnPage: number;
  matchedTerm: string;
  beforeContext: string;
  matchedText: string;
  afterContext: string;
}

export interface CrossBookSearchResult {
  book: LibraryBookMeta;
  matches: SearchMatch[];
}

export interface ProcessingProgress {
  stage: 'reading' | 'parsing' | 'extracting' | 'saving';
  currentPage: number;
  totalPages: number;
  percent: number;
  message: string;
}

export interface StorageSummary {
  usageBytes: number | null;
  quotaBytes: number | null;
}
