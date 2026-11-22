import React, { createContext, useContext } from 'react';

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
}

const noop = () => {};

export const LibraryNavigationContext = createContext<LibraryNavigationContextValue>({
  openKnowledgeLibrary: noop,
  openVisualLibrary: noop,
  navigateToModule: noop
});

export function useLibraryNavigation() {
  return useContext(LibraryNavigationContext);
}
