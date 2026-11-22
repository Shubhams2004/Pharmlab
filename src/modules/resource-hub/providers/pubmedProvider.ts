import {
  PublicationDateWindow,
  ResourceSortMode,
  ResourceType,
  ScientificResourceItem
} from '../types';
import { createTimeoutSignal, extractYear, sanitizeHttpUrl, stripMarkup } from '../utils';
import { inferDepartmentsFromText, inferVisualCategoryFromText } from './europePmcProvider';
import { fetchNcbiJson, fetchNcbiText } from './ncbiQueue';

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12'
};

function parsePubmedXml(xmlText: string, query: string): ScientificResourceItem[] {
  if (typeof DOMParser === 'undefined') {
    return parsePubmedXmlFallback(xmlText, query);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const articles = Array.from(doc.querySelectorAll('PubmedArticle'));

  return articles
    .map((article, idx): ScientificResourceItem | null => {
      const pmid = article.querySelector('MedlineCitation > PMID')?.textContent?.trim() || '';
      const rawTitle = article.querySelector('Article > ArticleTitle')?.textContent || '';
      const title = stripMarkup(rawTitle).replace(/\.$/, '');
      if (!title || !pmid) return null;

      const abstractParts = Array.from(
        article.querySelectorAll('Article > Abstract > AbstractText')
      ).map((el) => {
        const label = el.getAttribute('Label');
        const txt = stripMarkup(el.textContent || '');
        return label ? `${label}: ${txt}` : txt;
      });
      const abstractText = abstractParts.filter(Boolean).join(' ');

      const journal =
        article.querySelector('Article > Journal > Title')?.textContent?.trim() ||
        article.querySelector('Article > Journal > ISOAbbreviation')?.textContent?.trim() ||
        'PubMed Indexed Journal';

      const yearText =
        article.querySelector('Article > Journal > JournalIssue > PubDate > Year')?.textContent?.trim() ||
        article.querySelector('Article > Journal > JournalIssue > PubDate > MedlineDate')?.textContent?.trim() ||
        '';
      const monthRaw =
        article.querySelector('Article > Journal > JournalIssue > PubDate > Month')?.textContent?.trim() || '';
      const dayText =
        article.querySelector('Article > Journal > JournalIssue > PubDate > Day')?.textContent?.trim() || '';

      const year = extractYear(yearText);
      const monthNorm = MONTH_MAP[monthRaw.toLowerCase().slice(0, 3)] || (/^\d{1,2}$/.test(monthRaw) ? monthRaw.padStart(2, '0') : '');
      const publicationDate = year
        ? [String(year), monthNorm, dayText ? dayText.padStart(2, '0') : ''].filter(Boolean).join('-')
        : yearText || 'Date unlisted';

      const authors = Array.from(article.querySelectorAll('Article > AuthorList > Author')).map((a) => {
        const last = a.querySelector('LastName')?.textContent?.trim();
        const initials = a.querySelector('Initials')?.textContent?.trim();
        const collective = a.querySelector('CollectiveName')?.textContent?.trim();
        if (last) return initials ? `${last} ${initials}` : last;
        return collective || '';
      }).filter(Boolean);

      const pubTypes = Array.from(
        article.querySelectorAll('Article > PublicationTypeList > PublicationType')
      ).map((el) => (el.textContent || '').toLowerCase());
      const isReview = pubTypes.some((t) => t.includes('review'));
      const resourceType: ResourceType = isReview ? 'review_article' : 'research_paper';

      const idNodes = Array.from(article.querySelectorAll('PubmedData > ArticleIdList > ArticleId'));
      let doi: string | undefined;
      let pmcid: string | undefined;
      for (const node of idNodes) {
        const type = node.getAttribute('IdType');
        const val = node.textContent?.trim();
        if (type === 'doi' && val) doi = val;
        if (type === 'pmc' && val) pmcid = val;
      }

      const sourceUrl = sanitizeHttpUrl(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`) || 'https://pubmed.ncbi.nlm.nih.gov/';
      const pdfUrl = pmcid ? sanitizeHttpUrl(`https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/pdf/`) || undefined : undefined;
      const isOpenAccess = Boolean(pmcid);
      const combinedText = `${title} ${abstractText} ${journal}`;

      return {
        id: `pubmed_${pmid}`,
        providerId: 'pubmed',
        providerName: 'PubMed (NCBI)',
        title,
        resourceType,
        authors,
        journalOrPublisher: journal,
        publicationDate,
        year,
        summary:
          abstractText.slice(0, 260) + (abstractText.length > 260 ? '…' : '') ||
          `Indexed in MEDLINE / PubMed (${journal}).`,
        abstractText: abstractText || undefined,
        sourceUrl,
        pdfUrl,
        license: pmcid
          ? 'Open Access in PubMed Central (Verify article license)'
          : 'MEDLINE Abstract & Citation Record',
        isOpenAccess,
        isPermissiveLicense: isOpenAccess,
        licenseWarning: isOpenAccess
          ? undefined
          : 'Abstract is freely accessible; full text depends on publisher subscription.',
        accessType: pmcid ? 'open_access_web' : 'abstract_only',
        canDirectImportVisual: false,
        canAttemptDirectPdfImport: Boolean(pdfUrl),
        identifiers: { pmid, pmcid, doi },
        topics: [query],
        suggestedCategory: inferVisualCategoryFromText(combinedText),
        suggestedDepartments: inferDepartmentsFromText(combinedText),
        relevanceScore: Math.max(10, 96 - idx * 6 + (isOpenAccess ? 10 : 0))
      };
    })
    .filter((item): item is ScientificResourceItem => Boolean(item));
}

function parsePubmedXmlFallback(xmlText: string, query: string): ScientificResourceItem[] {
  const blocks = xmlText.split(/<PubmedArticle>/g).slice(1);
  return blocks
    .map((block, idx): ScientificResourceItem | null => {
      const pmid = block.match(/<PMID[^>]*>([^<]+)<\/PMID>/)?.[1]?.trim() || '';
      const rawTitle = block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1] || '';
      const title = stripMarkup(rawTitle).replace(/\.$/, '');
      if (!pmid || !title) return null;

      const abstractMatches = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g))
        .map((m) => stripMarkup(m[1]))
        .filter(Boolean);
      const abstractText = abstractMatches.join(' ');
      const journal = stripMarkup(block.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] || 'PubMed Journal');
      const yearStr = block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] || '';
      const year = extractYear(yearStr);
      const pmcid = block.match(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/)?.[1]?.trim();
      const doi = block.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1]?.trim();
      const isReview = /<PublicationType[^>]*>[^<]*Review[^<]*<\/PublicationType>/i.test(block);
      const combinedText = `${title} ${abstractText} ${journal}`;

      return {
        id: `pubmed_${pmid}`,
        providerId: 'pubmed',
        providerName: 'PubMed (NCBI)',
        title,
        resourceType: isReview ? 'review_article' : 'research_paper',
        authors: [],
        journalOrPublisher: journal,
        publicationDate: yearStr || 'Date unlisted',
        year,
        summary: abstractText.slice(0, 260) || `PubMed record PMID ${pmid}`,
        abstractText: abstractText || undefined,
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        pdfUrl: pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/pdf/` : undefined,
        license: pmcid ? 'Open Access in PubMed Central' : 'MEDLINE Abstract & Citation',
        isOpenAccess: Boolean(pmcid),
        isPermissiveLicense: Boolean(pmcid),
        accessType: pmcid ? 'open_access_web' : 'abstract_only',
        canDirectImportVisual: false,
        canAttemptDirectPdfImport: Boolean(pmcid),
        identifiers: { pmid, pmcid, doi },
        topics: [query],
        suggestedCategory: inferVisualCategoryFromText(combinedText),
        suggestedDepartments: inferDepartmentsFromText(combinedText),
        relevanceScore: Math.max(10, 94 - idx * 6)
      };
    })
    .filter((item): item is ScientificResourceItem => Boolean(item));
}

export async function searchPubMed(
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
    db: 'pubmed',
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

    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: idList.join(','),
      retmode: 'xml'
    });
    const xmlText = await fetchNcbiText(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${fetchParams.toString()}`,
      signal
    );
    return parsePubmedXml(xmlText, cleanQuery);
  } finally {
    cleanup();
  }
}
