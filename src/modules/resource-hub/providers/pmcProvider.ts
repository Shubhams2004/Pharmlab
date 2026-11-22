import {
  PublicationDateWindow,
  ResourceSortMode,
  ScientificResourceItem
} from '../types';
import { createTimeoutSignal, extractYear, sanitizeHttpUrl, stripMarkup } from '../utils';
import { inferDepartmentsFromText, inferVisualCategoryFromText } from './europePmcProvider';
import { fetchNcbiJson } from './ncbiQueue';

interface PmcSummaryRecord {
  uid: string;
  title?: string;
  pubdate?: string;
  epubdate?: string;
  sortdate?: string;
  fulljournalname?: string;
  source?: string;
  authors?: Array<{ name?: string }>;
  articleids?: Array<{ idtype?: string; value?: string }>;
}

export async function searchPmc(
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
    db: 'pmc',
    term: cleanQuery,
    retmax: String(opts.limit ?? 8),
    retmode: 'json'
  });

  if (opts.sortMode === 'date_desc') {
    params.set('sort', 'pub+date');
  }

  const currentYear = new Date().getFullYear();
  if (opts.dateWindow && opts.dateWindow !== 'all') {
    const yearsBack = opts.dateWindow === '1y' ? 1 : opts.dateWindow === '5y' ? 5 : 10;
    params.set('datetype', 'pdat');
    params.set('mindate', `${currentYear - yearsBack}/01/01`);
    params.set('maxdate', `${currentYear + 1}/12/31`);
  }

  const { signal, cleanup } = createTimeoutSignal(opts.signal, 15000);
  try {
    const searchJson = await fetchNcbiJson<{ esearchresult?: { idlist?: string[] } }>(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params.toString()}`,
      signal
    );
    const idList: string[] = searchJson?.esearchresult?.idlist || [];
    if (idList.length === 0) return [];

    const summaryParams = new URLSearchParams({
      db: 'pmc',
      id: idList.join(','),
      retmode: 'json'
    });
    const summaryJson = await fetchNcbiJson<{ result?: Record<string, PmcSummaryRecord> }>(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams.toString()}`,
      signal
    );
    const resultMap = summaryJson?.result || {};

    return idList
      .map((uid, idx): ScientificResourceItem | null => {
        const rec = resultMap[uid];
        if (!rec || !rec.title) return null;
        const title = stripMarkup(rec.title).replace(/\.$/, '');
        if (!title) return null;

        const articleIds = rec.articleids || [];
        const pmcid =
          articleIds.find((a) => a.idtype === 'pmcid')?.value || `PMC${uid.replace(/^PMC/i, '')}`;
        const pmid = articleIds.find((a) => a.idtype === 'pmid')?.value;
        const doi = articleIds.find((a) => a.idtype === 'doi')?.value;

        const journal = rec.fulljournalname || rec.source || 'PubMed Central';
        const authors = (rec.authors || []).map((a) => a.name || '').filter(Boolean);
        const pubDate = rec.epubdate || rec.pubdate || 'Date unlisted';
        const year = extractYear(rec.sortdate || pubDate);
        const isReview = /\breview\b/i.test(title);
        const combinedText = `${title} ${journal}`;

        const sourceUrl =
          sanitizeHttpUrl(`https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`) ||
          'https://pmc.ncbi.nlm.nih.gov/';
        const pdfUrl =
          sanitizeHttpUrl(`https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/pdf/`) || undefined;

        return {
          id: `pmc_${pmcid}`,
          providerId: 'pmc',
          providerName: 'PubMed Central (PMC)',
          title,
          resourceType: isReview ? 'review_article' : 'research_paper',
          authors,
          journalOrPublisher: journal,
          publicationDate: pubDate,
          year,
          summary: `Full-text open-access biomedical article archived in PubMed Central (${pmcid} · ${journal}).`,
          sourceUrl,
          pdfUrl,
          license: 'PubMed Central Open Access Archive',
          isOpenAccess: true,
          isPermissiveLicense: true,
          accessType: 'open_access_pdf',
          canDirectImportVisual: false,
          canAttemptDirectPdfImport: Boolean(pdfUrl),
          identifiers: { pmcid, pmid, doi },
          topics: [cleanQuery],
          suggestedCategory: inferVisualCategoryFromText(combinedText),
          suggestedDepartments: inferDepartmentsFromText(combinedText),
          relevanceScore: Math.max(10, 92 - idx * 6)
        };
      })
      .filter((item): item is ScientificResourceItem => Boolean(item));
  } finally {
    cleanup();
  }
}
