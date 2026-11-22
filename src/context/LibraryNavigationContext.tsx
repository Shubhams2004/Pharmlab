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
  nonce: number;
}

interface LibraryNavigationContextValue {
  openKnowledgeLibrary: (opts?: Omit<KnowledgeJumpTarget, 'nonce'>) => void;
  openVisualLibrary: (opts?: Omit<VisualJumpTarget, 'nonce'>) => void;
}

const noop = () => {};

export const LibraryNavigationContext = createContext<LibraryNavigationContextValue>({
  openKnowledgeLibrary: noop,
  openVisualLibrary: noop
});

export function useLibraryNavigation() {
  return useContext(LibraryNavigationContext);
}
