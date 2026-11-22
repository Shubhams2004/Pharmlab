export type DocumentCategory = 'textbook' | 'manual' | 'notes' | 'research';

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
