import React, { createContext, useContext } from 'react';
import {
  DEFAULT_STUDY_PREFERENCES,
  RecentStudyItem,
  StudyPreferences
} from '../utils/studyWorkspace';

export interface KnowledgeJumpTarget {
  bookId?: string | null;
  pageNumber?: number | null;
  searchQuery?: string | null;
  nonce: number;
}

export interface VisualJumpTarget {
  department?: string | null;
  category?: string | null;
  query?: string | null;
  visualId?: string | null;
  annotationId?: string | null;
  nonce: number;
}

interface LibraryNavigationContextValue {
  openKnowledgeLibrary: (opts?: Omit<KnowledgeJumpTarget, 'nonce'>) => void;
  openVisualLibrary: (opts?: Omit<VisualJumpTarget, 'nonce'>) => void;
  navigateToModule: (moduleId: string, tab?: string | null) => void;
  setWorkspaceSection: (sectionLabel: string | null, detailLabel?: string | null) => void;
  recordActivity: (item: Omit<RecentStudyItem, 'timestamp'>) => void;
  preferences: StudyPreferences;
  openSettings: () => void;
}

const noop = () => {};

export const LibraryNavigationContext = createContext<LibraryNavigationContextValue>({
  openKnowledgeLibrary: noop,
  openVisualLibrary: noop,
  navigateToModule: noop,
  setWorkspaceSection: noop,
  recordActivity: noop,
  preferences: DEFAULT_STUDY_PREFERENCES,
  openSettings: noop
});

export function useLibraryNavigation() {
  return useContext(LibraryNavigationContext);
}
