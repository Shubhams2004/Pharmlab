import { getAllBooks, getBookNotes, getBookPages, getBookmarks } from '../knowledge-library/libraryDb';
import { searchBookPages } from '../knowledge-library/searchEngine';
import { PHARMACOPOEIA_SECTIONS } from './seedCatalog';
import {
  COLLECTION_TYPE_LABELS,
  PharmacopoeiaProfileMeta,
  ReferenceCollectionType,
  ReferenceItem,
  UnifiedSearchHit
} from './types';

function computeFieldScore(item: ReferenceItem, rawQuery: string, tokens: string[]): {
  score: number;
  snippet: string;
  matchedTerm: string;
} | null {
  const q = rawQuery.toLowerCase().trim();
  const titleL = item.title.toLowerCase();
  const shortL = (item.shortTitle || '').toLowerCase();
  const authorsL = (item.authors || '').toLowerCase();
  const subjectL = item.subject.toLowerCase();
  const authL = (item.issuingAuthority || '').toLowerCase();
  const subCatL = (item.subCategory || '').toLowerCase();
  const docTypeL = (item.documentType || '').toLowerCase();
  const descL = item.description.toLowerCase();
  const absL = (item.abstract || '').toLowerCase();
  const notesL = (item.personalNotes || '').toLowerCase();
  const tagsL = item.tags.join(' ').toLowerCase();
  const chaptersL = (item.chapterNotes || []).join(' ').toLowerCase();
  const connL = item.academicConnections.map((c) => c.label).join(' ').toLowerCase();
  const idsL = [item.doi, item.pmid, item.pmcid, item.isbn].filter(Boolean).join(' ').toLowerCase();

  const haystack = [
    titleL,
    shortL,
    authorsL,
    subjectL,
    authL,
    subCatL,
    docTypeL,
    descL,
    absL,
    notesL,
    tagsL,
    chaptersL,
    connL,
    idsL
  ].join(' \n ');

  const phraseMatched = haystack.includes(q);
  const allTokensMatched = tokens.length > 0 && tokens.every((t) => haystack.includes(t));

  if (!phraseMatched && !allTokensMatched) {
    return null;
  }

  let score = phraseMatched ? 80 : 45;
  if (titleL.includes(q) || shortL === q) score += 60;
  if (authorsL.includes(q)) score += 35;
  if (tagsL.includes(q) || subjectL.includes(q)) score += 30;
  if (connL.includes(q)) score += 28;
  if (chaptersL.includes(q)) score += 26;
  if (absL.includes(q) || descL.includes(q)) score += 22;
  if (notesL.includes(q)) score += 20;
  if (idsL.includes(q)) score += 45;

  // Build transparent, real snippet from whichever field matched
  let snippet = item.description;
  const matchedChapter = (item.chapterNotes || []).find((c) =>
    tokens.some((t) => c.toLowerCase().includes(t))
  );
  const matchedConn = item.academicConnections.find((c) =>
    tokens.some((t) => c.label.toLowerCase().includes(t))
  );

  if (matchedConn) {
    snippet = `Linked topic: ${matchedConn.label}`;
  } else if (matchedChapter) {
    snippet = `Chapter note: ${matchedChapter}`;
  } else if (item.personalNotes && tokens.some((t) => notesL.includes(t))) {
    snippet = `Personal note: ${item.personalNotes}`;
  } else if (item.abstract && tokens.some((t) => absL.includes(t))) {
    const idx = absL.indexOf(q) >= 0 ? absL.indexOf(q) : absL.indexOf(tokens[0]);
    const start = Math.max(0, idx - 60);
    snippet = `${start > 0 ? '…' : ''}${item.abstract.slice(start, start + 220)}${
      start + 220 < item.abstract.length ? '…' : ''
    }`;
  }

  return { score, snippet, matchedTerm: rawQuery };
}

export interface UnifiedSearchOptions {
  collectionFilter?: ReferenceCollectionType | 'all';
  includePdfContent?: boolean;
  maxPdfHitsPerBook?: number;
}

export async function runUnifiedReferenceSearch(
  rawQuery: string,
  references: ReferenceItem[],
  pharmaProfiles: PharmacopoeiaProfileMeta[],
  options: UnifiedSearchOptions = {}
): Promise<UnifiedSearchHit[]> {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) return [];

  const tokens = trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];

  const collectionFilter = options.collectionFilter || 'all';
  const includePdfContent = options.includePdfContent !== false;
  const maxPdfHitsPerBook = options.maxPdfHitsPerBook ?? 4;

  const hits: UnifiedSearchHit[] = [];

  const filteredRefs =
    collectionFilter === 'all'
      ? references
      : references.filter((r) => r.collectionType === collectionFilter);

  const refById = new Map(references.map((r) => [r.id, r]));
  const refByBookId = new Map<string, ReferenceItem>();
  for (const r of references) {
    if (r.linkedBookId) {
      refByBookId.set(r.linkedBookId, r);
    }
  }

  // 1. Search catalog & user-saved references (titles, authors, subjects, chapters, abstracts, notes, tags, topics)
  for (const ref of filteredRefs) {
    const matched = computeFieldScore(ref, trimmed, tokens);
    if (!matched) continue;

    hits.push({
      id: `ref_${ref.id}`,
      kind: 'reference',
      resourceTypeLabel: COLLECTION_TYPE_LABELS[ref.collectionType],
      sourceLabel: ref.sourceName,
      title: ref.title,
      subtitle: [ref.authors || ref.issuingAuthority, ref.subject].filter(Boolean).join(' · '),
      snippet: matched.snippet,
      matchedTerm: matched.matchedTerm,
      score: matched.score,
      referenceId: ref.id,
      bookId: ref.linkedBookId,
      externalUrl: ref.externalUrl
    });
  }

  // 2. Search Pharmacopoeia 12-section workspace links & user-annotated monographs
  if (collectionFilter === 'all' || collectionFilter === 'pharmacopoeia') {
    for (const profile of pharmaProfiles) {
      const parentRef = refById.get(profile.referenceId);
      if (!parentRef) continue;
      for (const link of profile.sectionLinks) {
        const hay = `${link.title} ${link.note || ''} ${link.sectionKey}`.toLowerCase();
        if (
          !hay.includes(trimmed.toLowerCase()) &&
          !tokens.every((t) => hay.includes(t))
        ) {
          continue;
        }
        const sectionMeta = PHARMACOPOEIA_SECTIONS.find((s) => s.key === link.sectionKey);
        hits.push({
          id: `phsec_${link.id}`,
          kind: 'pharmacopoeia_section',
          resourceTypeLabel: link.isOfficialStandard
            ? 'Pharmacopoeia Section'
            : 'Educational Note (Non-Official)',
          sourceLabel: `${parentRef.shortTitle || parentRef.title} · ${
            sectionMeta?.label || link.sectionKey
          }`,
          title: link.title,
          subtitle: sectionMeta?.label || link.sectionKey,
          snippet: link.note || (link.pageNumber ? `Linked PDF Page ${link.pageNumber}` : link.externalUrl),
          matchedTerm: trimmed,
          score: 96,
          referenceId: parentRef.id,
          bookId: link.bookId || parentRef.linkedBookId,
          pageNumber: link.pageNumber,
          externalUrl: link.externalUrl
        });
      }
    }
  }

  // 3. Search locally imported PDF pages, bookmarks, and study notes in libraryDb
  if (includePdfContent) {
    try {
      const books = await getAllBooks();
      for (const book of books) {
        const linkedRef = refByBookId.get(book.id);
        if (
          collectionFilter !== 'all' &&
          (!linkedRef || linkedRef.collectionType !== collectionFilter)
        ) {
          continue;
        }

        const sourceLabel = linkedRef
          ? `${COLLECTION_TYPE_LABELS[linkedRef.collectionType]} PDF (${linkedRef.shortTitle || linkedRef.title})`
          : 'Imported PDF (Knowledge Library)';

        // 3a. Indexed PDF page text
        if (book.hasSearchableText) {
          const pages = await getBookPages(book.id);
          const pageMatches = searchBookPages(pages, trimmed, maxPdfHitsPerBook);
          for (const m of pageMatches) {
            hits.push({
              id: `pdf_${m.id}`,
              kind: 'pdf_passage',
              resourceTypeLabel: 'PDF Page Passage',
              sourceLabel,
              title: `${linkedRef?.title || book.title} — Page ${m.pageNumber}`,
              subtitle: `${m.matchCountOnPage} ${m.matchCountOnPage === 1 ? 'hit' : 'hits'} on page ${m.pageNumber}`,
              snippet: `${m.beforeContext}${m.matchedText}${m.afterContext}`,
              matchedTerm: m.matchedTerm,
              score: 90 + m.score,
              referenceId: linkedRef?.id,
              bookId: book.id,
              book,
              pageNumber: m.pageNumber,
              match: m
            });
          }
        }

        // 3b. PDF Bookmarks
        const bookmarks = await getBookmarks(book.id);
        for (const bm of bookmarks) {
          const hay = `${bm.label} ${bm.excerpt}`.toLowerCase();
          if (hay.includes(trimmed.toLowerCase()) || tokens.every((t) => hay.includes(t))) {
            hits.push({
              id: `bm_${bm.id}`,
              kind: 'pdf_bookmark',
              resourceTypeLabel: 'PDF Bookmark',
              sourceLabel,
              title: `${book.title} — ${bm.label} (p. ${bm.pageNumber})`,
              subtitle: `Bookmarked page ${bm.pageNumber}`,
              snippet: bm.excerpt,
              matchedTerm: trimmed,
              score: 85,
              referenceId: linkedRef?.id,
              bookId: book.id,
              book,
              pageNumber: bm.pageNumber
            });
          }
        }

        // 3c. PDF Study Notes & Highlights
        const notes = await getBookNotes(book.id);
        for (const note of notes) {
          const hay = `${note.quote} ${note.note}`.toLowerCase();
          if (hay.includes(trimmed.toLowerCase()) || tokens.every((t) => hay.includes(t))) {
            hits.push({
              id: `note_${note.id}`,
              kind: 'pdf_note',
              resourceTypeLabel: 'PDF Highlight / Note',
              sourceLabel,
              title: `${book.title} — Highlight Note (p. ${note.pageNumber})`,
              subtitle: `Page ${note.pageNumber}`,
              snippet: [note.quote ? `"${note.quote}"` : '', note.note].filter(Boolean).join(' — '),
              matchedTerm: trimmed,
              score: 88,
              referenceId: linkedRef?.id,
              bookId: book.id,
              book,
              pageNumber: note.pageNumber
            });
          }
        }
      }
    } catch {
      // Ignore IndexedDB unavailability during static test environments
    }
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
