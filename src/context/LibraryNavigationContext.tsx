import React, { createContext, useContext } from 'react';
import { ReferenceNavSection } from '../modules/reference-center/types';
import { AcademicContextRef, ResourceHubTab, ResourceType } from '../modules/resource-hub/types';
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
  tab?: 'repository' | 'discover' | null;
  openUpload?: boolean;
  nonce: number;
}

export interface ResourceJumpTarget {
  query?: string | null;
  tab?: ResourceHubTab | null;
  resourceType?: ResourceType | null;
  context?: AcademicContextRef | null;
  nonce: number;
}

export interface ReferenceJumpTarget {
  section?: ReferenceNavSection | null;
  referenceId?: string | null;
  query?: string | null;
  nonce: number;
}

interface LibraryNavigationContextValue {
  openKnowledgeLibrary: (opts?: Omit<KnowledgeJumpTarget, 'nonce'>) => void;
  openVisualLibrary: (opts?: Omit<VisualJumpTarget, 'nonce'>) => void;
  openResourceHub: (opts?: Omit<ResourceJumpTarget, 'nonce'>) => void;
  openReferenceCenter: (opts?: Omit<ReferenceJumpTarget, 'nonce'>) => void;
  navigateToModule: (
    moduleId: string,
    tab?: string | null,
    opts?: { structureId?: string | null }
  ) => void;
  setWorkspaceSection: (sectionLabel: string | null, detailLabel?: string | null) => void;
  recordActivity: (item: Omit<RecentStudyItem, 'timestamp'>) => void;
  preferences: StudyPreferences;
  openSettings: () => void;
}

const noop = () => {};

export const LibraryNavigationContext = createContext<LibraryNavigationContextValue>({
  openKnowledgeLibrary: noop,
  openVisualLibrary: noop,
  openResourceHub: noop,
  openReferenceCenter: noop,
  navigateToModule: noop,
  setWorkspaceSection: noop,
  recordActivity: noop,
  preferences: DEFAULT_STUDY_PREFERENCES,
  openSettings: noop
});

export function useLibraryNavigation() {
  return useContext(LibraryNavigationContext);
}
