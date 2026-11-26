import React, { createContext, useContext } from 'react';
import { BPharmDepartmentId } from '../modules/assets-3d/types';
import { PharmacopoeiaCenterJumpTarget } from '../modules/pharmacopoeia-center/types';
import { ReferenceNavSection } from '../modules/reference-center/types';
import { AcademicContextRef, ResourceHubTab, ResourceType } from '../modules/resource-hub/types';
import {
  DEFAULT_STUDY_PREFERENCES,
  RecentStudyItem,
  StudyPreferences
} from '../utils/studyWorkspace';
import type { CoverageAnalyzerJumpTarget } from '../modules/coverage-analyzer/CoverageAnalyzerModule';
import type { EnrichmentWorkspaceJumpTarget } from '../modules/enrichment-workspace/EnrichmentWorkspaceModule';

export type { CoverageAnalyzerJumpTarget, EnrichmentWorkspaceJumpTarget };

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

export interface StudyModeJumpTarget {
  syllabusId?: string | null;
  subjectCode?: string | null;
  topicId?: string | null;
  view?: 'study' | 'exam' | null;
  nonce: number;
}

export interface Asset3DJumpTarget {
  tab?: 'library' | 'discover' | 'mapping' | null;
  query?: string | null;
  department?: BPharmDepartmentId | null;
  assetId?: string | null;
  openUpload?: boolean;
  nonce: number;
}

export interface PythonStudioJumpTarget {
  scriptName?: string | null;
  scriptContent?: string | null;
  nonce: number;
}

export interface AcademicExplorerJumpTarget {
  assetId?: string | null;
  subjectCode?: string | null;
  topicId?: string | null;
  structureName?: string | null;
  experimentId?: string | null;
  experimentTitle?: string | null;
  experimentTab?: string | null;
  stepId?: string | null;
  stepTitle?: string | null;
  focusComponentName?: string | null;
  returnTab?: string | null;
  nonce: number;
}

export interface InteractiveExperimentsJumpTarget {
  experimentId?: string | null;
  stage?: 'intro' | 'apparatus' | 'simulate' | 'observe' | 'compare' | 'conclusion' | null;
  department?: 'pharmaceutics' | 'inorganic_analysis' | 'pharmacology_pk' | 'anatomy_phys' | 'microbiology' | 'biopharmaceutics' | null;
  nonce: number;
}

interface LibraryNavigationContextValue {
  openKnowledgeLibrary: (opts?: Omit<KnowledgeJumpTarget, 'nonce'>) => void;
  openVisualLibrary: (opts?: Omit<VisualJumpTarget, 'nonce'>) => void;
  openResourceHub: (opts?: Omit<ResourceJumpTarget, 'nonce'>) => void;
  openReferenceCenter: (opts?: Omit<ReferenceJumpTarget, 'nonce'>) => void;
  openPharmacopoeiaCenter: (opts?: Omit<PharmacopoeiaCenterJumpTarget, 'nonce'>) => void;
  openStudyMode: (opts?: Omit<StudyModeJumpTarget, 'nonce'>) => void;
  openAsset3DEngine: (opts?: Omit<Asset3DJumpTarget, 'nonce'>) => void;
  openAcademicExplorer: (opts?: Omit<AcademicExplorerJumpTarget, 'nonce'>) => void;
  openInteractiveExperiments: (opts?: Omit<InteractiveExperimentsJumpTarget, 'nonce'>) => void;
  openPythonStudio: (opts?: Omit<PythonStudioJumpTarget, 'nonce'>) => void;
  openCoverageAnalyzer: (opts?: Omit<CoverageAnalyzerJumpTarget, 'nonce'>) => void;
  openEnrichmentWorkspace: (opts?: Omit<EnrichmentWorkspaceJumpTarget, 'nonce'>) => void;
  navigateToModule: (
    moduleId: string,
    tab?: string | null,
    opts?: { structureId?: string | null }
  ) => void;
  setWorkspaceSection: (sectionLabel: string | null, detailLabel?: string | null) => void;
  recordActivity: (item: Omit<RecentStudyItem, 'timestamp'>) => void;
  preferences: StudyPreferences;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  resetTextSize: () => void;
  openSettings: () => void;
}

const noop = () => {};

export const LibraryNavigationContext = createContext<LibraryNavigationContextValue>({
  openKnowledgeLibrary: noop,
  openVisualLibrary: noop,
  openResourceHub: noop,
  openReferenceCenter: noop,
  openPharmacopoeiaCenter: noop,
  openStudyMode: noop,
  openAsset3DEngine: noop,
  openAcademicExplorer: noop,
  openInteractiveExperiments: noop,
  openPythonStudio: noop,
  openCoverageAnalyzer: noop,
  openEnrichmentWorkspace: noop,
  navigateToModule: noop,
  setWorkspaceSection: noop,
  recordActivity: noop,
  preferences: DEFAULT_STUDY_PREFERENCES,
  increaseTextSize: noop,
  decreaseTextSize: noop,
  resetTextSize: noop,
  openSettings: noop
});

export function useLibraryNavigation() {
  return useContext(LibraryNavigationContext);
}
