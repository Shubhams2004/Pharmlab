import { BookPageText, SearchMatch } from './types';

export const PHARMACEUTICAL_SUGGESTIONS = [
  'Pharmacokinetics',
  'Bioavailability',
  'Cardiovascular physiology',
  'Drug metabolism',
  'Pharmaceutical formulations',
  'Anatomy',
  'Pathophysiology',
  'Chemical nomenclature'
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeForSearch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u2010-\u2015-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function snapLeftToWordBoundary(text: string, start: number): number {
  if (start <= 0) return 0;
  let idx = start;
  while (idx > 0 && idx > start - 20 && !/\s/.test(text[idx - 1])) {
    idx--;
  }
  return idx;
}

function snapRightToWordBoundary(text: string, end: number): number {
  if (end >= text.length) return text.length;
  let idx = end;
  while (idx < text.length && idx < end + 20 && !/\s/.test(text[idx])) {
    idx++;
  }
  return idx;
}

function buildPassageFromOffset(
  pageText: string,
  matchIndex: number,
  matchLength: number
): { beforeContext: string; matchedText: string; afterContext: string } {
  const beforeWindow = 105;
  const afterWindow = 145;

  const rawStart = Math.max(0, matchIndex - beforeWindow);
  const rawEnd = Math.min(pageText.length, matchIndex + matchLength + afterWindow);

  const start = rawStart > 0 ? snapLeftToWordBoundary(pageText, rawStart) : 0;
  const end = rawEnd < pageText.length ? snapRightToWordBoundary(pageText, rawEnd) : pageText.length;

  const beforePrefix = start > 0 ? '…' : '';
  const afterSuffix = end < pageText.length ? '…' : '';

  const beforeContext =
    beforePrefix + pageText.slice(start, matchIndex).replace(/\s+/g, ' ');
  const matchedText = pageText.slice(matchIndex, matchIndex + matchLength);
  const afterContext =
    pageText.slice(matchIndex + matchLength, end).replace(/\s+/g, ' ') + afterSuffix;

  return {
    beforeContext,
    matchedText,
    afterContext
  };
}

export function searchBookPages(
  pages: BookPageText[],
  rawQuery: string,
  maxResults = 120
): SearchMatch[] {
  const trimmed = rawQuery.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const lowerQuery = trimmed.toLowerCase();
  const normalizedQuery = normalizeForSearch(trimmed);
  const queryTokens = normalizedQuery
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  if (queryTokens.length === 0) return [];

  // Allow flexible whitespace / hyphen matching between phrase words
  const flexiblePhrasePattern = escapeRegExp(trimmed)
    .replace(/\\-/g, '[\\s\\u2010-\\u2015-]+')
    .replace(/\s+/g, '[\\s\\u2010-\\u2015-]+');
  const phraseRegex = new RegExp(flexiblePhrasePattern, 'gi');

  const tokenRegexes = queryTokens.map(
    (token) => new RegExp(escapeRegExp(token), 'gi')
  );

  const results: SearchMatch[] = [];

  for (const page of pages) {
    const text = page.text;
    if (!text) continue;

    const exactMatches: Array<{ index: number; length: number }> = [];
    phraseRegex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = phraseRegex.exec(text)) !== null) {
      exactMatches.push({ index: m.index, length: m[0].length });
      if (exactMatches.length >= 25) break;
    }

    if (exactMatches.length > 0) {
      // Exact phrase match found on this page — extract up to 2 distinct passages per page
      const firstMatch = exactMatches[0];
      const passage = buildPassageFromOffset(text, firstMatch.index, firstMatch.length);

      // Boost if match occurs near the top of the page (heading/section lead)
      const earlyBoost = firstMatch.index < 280 ? 15 : 0;
      // Boost for exact casing / scientific term match length
      const phraseBonus = queryTokens.length > 1 ? 45 : 25;
      const frequencyScore = Math.min(exactMatches.length, 10) * 12;
      const score = 100 + phraseBonus + frequencyScore + earlyBoost;

      results.push({
        id: `${page.bookId}_p${page.pageNumber}_0`,
        bookId: page.bookId,
        pageNumber: page.pageNumber,
        score,
        matchCountOnPage: exactMatches.length,
        matchedTerm: trimmed,
        ...passage
      });

      // If another match appears well past the first passage on the same page, include a 2nd excerpt
      const secondDistinct = exactMatches.find(
        (candidate) => candidate.index - firstMatch.index > 320
      );
      if (secondDistinct) {
        const secondPassage = buildPassageFromOffset(
          text,
          secondDistinct.index,
          secondDistinct.length
        );
        results.push({
          id: `${page.bookId}_p${page.pageNumber}_1`,
          bookId: page.bookId,
          pageNumber: page.pageNumber,
          score: score - 8,
          matchCountOnPage: exactMatches.length,
          matchedTerm: trimmed,
          ...secondPassage
        });
      }
      continue;
    }

    // Multi-word fallback: check if all tokens appear on the page (e.g. "cardiovascular" and "physiology" near each other)
    if (queryTokens.length > 1) {
      let matchedTokens = 0;
      let totalTokenHits = 0;
      let bestOffset = -1;
      let bestLength = 0;

      const tokenOffsets: Array<{ token: string; index: number; length: number }> = [];

      for (const regex of tokenRegexes) {
        regex.lastIndex = 0;
        const first = regex.exec(text);
        if (first) {
          matchedTokens += 1;
          tokenOffsets.push({
            token: first[0],
            index: first.index,
            length: first[0].length
          });
          totalTokenHits += 1;
          while (regex.exec(text) !== null && totalTokenHits < 20) {
            totalTokenHits += 1;
          }
        }
      }

      if (matchedTokens === queryTokens.length) {
        // Find closest cluster between first two tokens
        tokenOffsets.sort((a, b) => a.index - b.index);
        bestOffset = tokenOffsets[0].index;
        bestLength = tokenOffsets[0].length;
        const span =
          tokenOffsets[tokenOffsets.length - 1].index - tokenOffsets[0].index;
        const proximityBonus = span < 220 ? 35 : span < 600 ? 18 : 5;

        const passage = buildPassageFromOffset(text, bestOffset, bestLength);
        results.push({
          id: `${page.bookId}_p${page.pageNumber}_multi`,
          bookId: page.bookId,
          pageNumber: page.pageNumber,
          score: 60 + proximityBonus + Math.min(totalTokenHits, 8) * 5,
          matchCountOnPage: totalTokenHits,
          matchedTerm: queryTokens.join(' '),
          ...passage
        });
      } else if (
        lowerQuery.length >= 4 &&
        matchedTokens >= Math.ceil(queryTokens.length * 0.6)
      ) {
        // Partial multi-term match ranked lower than full matches
        tokenOffsets.sort((a, b) => a.index - b.index);
        if (tokenOffsets.length > 0) {
          const anchor = tokenOffsets[0];
          const passage = buildPassageFromOffset(text, anchor.index, anchor.length);
          results.push({
            id: `${page.bookId}_p${page.pageNumber}_partial`,
            bookId: page.bookId,
            pageNumber: page.pageNumber,
            score: 25 + matchedTokens * 8,
            matchCountOnPage: totalTokenHits,
            matchedTerm: anchor.token,
            ...passage
          });
        }
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.pageNumber - b.pageNumber)
    .slice(0, maxResults);
}
