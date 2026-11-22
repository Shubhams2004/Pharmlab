import {
  PublicationDateWindow,
  ResourceSortMode,
  ScientificResourceItem
} from '../types';
import { createTimeoutSignal, extractYear, sanitizeHttpUrl, stripMarkup } from '../utils';
import { inferDepartmentsFromText, inferVisualCategoryFromText } from './europePmcProvider';
import { fetchNcbiJson } from './ncbiQueue';

interface BookshelfSummaryRecord {
  uid: string;
  title?: string;
  pubdate?: string;
  accessionid?: string;
  bookaccessionid?: string;
  chapteraccessionid?: string;
  book?: string;
  rtype?: string;
  bookinfo?: string;
}

function extractTagText(xml: string, regex: RegExp): string {
  const m = xml.match(regex);
  return m?.[1] ? stripMarkup(m[1]) : '';
}

export async function searchNcbiBookshelf(
  query: string,
  opts: {
    dateWindow?: PublicationDateWindow;
    sortMode?: ResourceSortMode;
    limit?: number;
    signal?: AbortSignal;
  } = {}
): Promise<ScientificResourceItem[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  const params = new URLSearchParams({
    db: 'books',
    term: cleanQuery,
    retmax: String(opts.limit ?? 8),
    retmode: 'json'
  });

  const { signal, cleanup } = createTimeoutSignal(opts.signal, 15000);
  try {
    const searchJson = await fetchNcbiJson<{ esearchresult?: { idlist?: string[] } }>(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params.toString()}`,
      signal
    );
    const idList: string[] = searchJson?.esearchresult?.idlist || [];
    if (idList.length === 0) return [];

    const summaryParams = new URLSearchParams({
      db: 'books',
      id: idList.join(','),
      retmode: 'json'
    });
    const summaryJson = await fetchNcbiJson<{ result?: Record<string, BookshelfSummaryRecord> }>(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams.toString()}`,
      signal
    );
    const resultMap = summaryJson?.result || {};

    const seenNbk = new Set<string>();
    const items: ScientificResourceItem[] = [];

    idList.forEach((uid, idx) => {
      const rec = resultMap[uid];
      if (!rec || !rec.title) return;

      const nbkId = rec.chapteraccessionid || rec.accessionid || rec.bookaccessionid || '';
      if (!nbkId || seenNbk.has(nbkId)) return;
      seenNbk.add(nbkId);

      const bookinfo = rec.bookinfo || '';
      const parentBook =
        extractTagText(bookinfo, /<Parent[^>]*type="book"[^>]*><Title>([\s\S]*?)<\/Title>/i) ||
        extractTagText(bookinfo, /<ParentRecord><Title>([\s\S]*?)<\/Title>/i) ||
        'NCBI Bookshelf';
      const chapterTitle =
        extractTagText(bookinfo, /<Parent[^>]*type="chapter"[^>]*><Title>([\s\S]*?)<\/Title>/i) ||
        stripMarkup(rec.title);
      const pubStatement = extractTagText(
        bookinfo,
        /<PublicationStatement>([\s\S]*?)<\/PublicationStatement>/i
      );

      const sectionTitle = stripMarkup(rec.title);
      const displayTitle =
        chapterTitle && chapterTitle !== sectionTitle
          ? `${chapterTitle} — ${sectionTitle}`
          : sectionTitle;

      const year = extractYear(rec.pubdate || pubStatement);
      const sourceUrl =
        sanitizeHttpUrl(`https://www.ncbi.nlm.nih.gov/books/${nbkId}/`) ||
        'https://www.ncbi.nlm.nih.gov/books/';
      const combinedText = `${displayTitle} ${parentBook} ${pubStatement}`;

      items.push({
        id: `books_${nbkId}_${uid}`,
        providerId: 'ncbi_bookshelf',
        providerName: 'NCBI Bookshelf',
        title: displayTitle,
        resourceType: rec.rtype === 'book' ? 'textbook' : 'medical_reference',
        authors: pubStatement ? [pubStatement] : [],
        journalOrPublisher: parentBook.replace(/\.$/, ''),
        publicationDate: rec.pubdate ? rec.pubdate.slice(0, 10) : year ? String(year) : 'Updated online',
        year,
        summary: `Open-access biomedical reference chapter from ${parentBook.replace(/\.$/, '')} (${nbkId}).`,
        sourceUrl,
        license: 'NCBI Bookshelf Open Reference (Verify chapter copyright)',
        isOpenAccess: true,
        isPermissiveLicense: true,
        accessType: 'open_access_web',
        canDirectImportVisual: false,
        canAttemptDirectPdfImport: false,
        identifiers: { nbkId },
        topics: [cleanQuery],
        suggestedCategory: inferVisualCategoryFromText(combinedText),
        suggestedDepartments: inferDepartmentsFromText(combinedText),
        relevanceScore: Math.max(10, 90 - idx * 6)
      });
    });

    return items;
  } finally {
    cleanup();
  }
}
