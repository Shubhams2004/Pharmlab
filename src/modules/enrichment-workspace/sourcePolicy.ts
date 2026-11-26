import { LibraryBookMeta } from '../knowledge-library/types';
import { ReferenceItem } from '../reference-center/types';
import {
  AcquiredTopicResource,
  EnrichmentSourceAttachment,
  SourcePriorityTier,
  TextbookEvidenceLink
} from '../study-mode/types';

export interface SourcePriorityDescriptor {
  tier: SourcePriorityTier;
  label: string;
  shortLabel: string;
  ruleNote: string;
}

export const SOURCE_PRIORITY_META: Record<SourcePriorityTier, SourcePriorityDescriptor> = {
  1: {
    tier: 1,
    label: 'Priority 1 · Textbooks & Reference Books',
    shortLabel: 'Priority 1 · Textbook / Pharmacopoeia',
    ruleNote:
      'Primary evidence: user-uploaded academic textbooks, PDF reference books, pharmacopoeias, and official syllabus standards.'
  },
  2: {
    tier: 2,
    label: 'Priority 2 · Academic Literature & Monographs',
    shortLabel: 'Priority 2 · Academic Literature',
    ruleNote:
      'Secondary academic evidence: established reference monographs, book chapters, NCBI Bookshelf, OpenStax, and built-in catalogs.'
  },
  3: {
    tier: 3,
    label: 'Priority 3 · Peer-Reviewed Research Papers',
    shortLabel: 'Priority 3 · Peer-Reviewed Paper',
    ruleNote:
      'Supplementary scholarly literature from PubMed, PMC, and Europe PMC. Supports recent context without overriding core textbooks.'
  },
  4: {
    tier: 4,
    label: 'Priority 4 · Supplementary Online Resources',
    shortLabel: 'Priority 4 · Supplementary Web',
    ruleNote:
      'Background orientation only (open encyclopedias and general educational websites). Never overrides textbook-based scientific information.'
  }
};

export function classifyBookPriority(
  book: Pick<LibraryBookMeta, 'category' | 'title'>,
  linkedRef?: ReferenceItem
): SourcePriorityTier {
  if (linkedRef) {
    if (
      linkedRef.collectionType === 'pharmacopoeia' ||
      linkedRef.collectionType === 'textbook' ||
      linkedRef.collectionType === 'official_resource'
    ) {
      return 1;
    }
    if (linkedRef.collectionType === 'manual' || linkedRef.collectionType === 'journal') {
      return book.category === 'research' ? 3 : 2;
    }
  }
  if (book.category === 'textbook' || book.category === 'manual') {
    return 1;
  }
  if (book.category === 'notes') {
    return 2;
  }
  return 3;
}

export function classifyReferencePriority(ref: ReferenceItem): SourcePriorityTier {
  if (
    ref.collectionType === 'pharmacopoeia' ||
    ref.collectionType === 'textbook' ||
    ref.collectionType === 'official_resource'
  ) {
    return 1;
  }
  if (ref.collectionType === 'manual' || ref.collectionType === 'atlas') {
    return 2;
  }
  if (ref.collectionType === 'journal') {
    return 3;
  }
  return 2;
}

export function classifyAcquiredResourcePriority(
  res: Pick<
    AcquiredTopicResource,
    'verificationStatus' | 'resourceKind' | 'providerId' | 'sourceName'
  >
): SourcePriorityTier {
  const provider = (res.providerId || '').toLowerCase();
  const sourceLower = (res.sourceName || '').toLowerCase();

  if (
    res.verificationStatus === 'official_standard' ||
    res.resourceKind === 'official_syllabus' ||
    provider === 'local_pdf' ||
    sourceLower.includes('pharmacopoeia') ||
    sourceLower.includes('uploaded textbook')
  ) {
    return 1;
  }

  if (
    res.verificationStatus === 'open_textbook' ||
    res.resourceKind === 'textbook_excerpt' ||
    provider === 'ncbi_bookshelf' ||
    provider === 'openstax' ||
    provider === 'pubchem' ||
    provider === 'anatomy_catalog'
  ) {
    return 2;
  }

  if (
    res.verificationStatus === 'peer_reviewed' ||
    res.resourceKind === 'research_paper' ||
    provider === 'pubmed' ||
    provider === 'pmc' ||
    provider === 'europepmc' ||
    provider === 'crossref' ||
    provider === 'openalex'
  ) {
    return 3;
  }

  return 4;
}

export function classifyAttachmentPriority(
  att: Pick<
    EnrichmentSourceAttachment,
    'priorityTier' | 'sourceKind' | 'itemId' | 'subtitle' | 'title' | 'verified'
  >,
  books: LibraryBookMeta[] = [],
  refs: ReferenceItem[] = []
): SourcePriorityTier {
  if (att.priorityTier) return att.priorityTier;

  if (att.sourceKind === 'knowledge_pdf') {
    const book = books.find((b) => b.id === att.itemId);
    if (book) {
      const linkedRef = refs.find((r) => r.linkedBookId === book.id);
      return classifyBookPriority(book, linkedRef);
    }
    return 1;
  }

  if (att.sourceKind === 'reference_center') {
    const ref = refs.find((r) => r.id === att.itemId);
    if (ref) return classifyReferencePriority(ref);
    return 1;
  }

  if (att.sourceKind === 'manual_citation') {
    const text = `${att.title} ${att.subtitle || ''}`.toLowerCase();
    if (/wikipedia|blog|web/i.test(text)) return 4;
    return 1;
  }

  if (
    att.sourceKind === 'anatomy_catalog' ||
    att.sourceKind === 'experiment' ||
    att.sourceKind === 'simulation' ||
    att.sourceKind === 'visual_library' ||
    att.sourceKind === 'asset_3d'
  ) {
    return 2;
  }

  // resource_hub
  const sub = `${att.subtitle || ''} ${att.url || ''}`.toLowerCase();
  if (sub.includes('ncbi bookshelf') || sub.includes('openstax')) return 2;
  if (sub.includes('pubmed') || sub.includes('europe pmc') || sub.includes('pmc')) return 3;
  if (sub.includes('wikipedia') || !att.verified) return 4;
  return 3;
}

export function sortSourcesByPriority<T>(
  items: T[],
  getTier: (item: T) => SourcePriorityTier,
  getSecondaryScore?: (item: T) => number
): T[] {
  return [...items].sort((a, b) => {
    const tierDiff = getTier(a) - getTier(b);
    if (tierDiff !== 0) return tierDiff;
    if (getSecondaryScore) {
      return getSecondaryScore(b) - getSecondaryScore(a);
    }
    return 0;
  });
}

/**
 * Policy guard: Low-priority online sources (Priority 3–4) cannot silently
 * override Priority 1–2 textbook/academic evidence.
 */
export function canLowPriorityOverrideTextbook(
  existingLinks: TextbookEvidenceLink[],
  candidateTier: SourcePriorityTier
): boolean {
  const hasTextbookOrAcademic = existingLinks.some((l) => l.priorityTier <= 2);
  if (hasTextbookOrAcademic && candidateTier >= 3) {
    return false;
  }
  return true;
}
