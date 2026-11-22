import { createTimeoutSignal, sanitizeHttpUrl, stripMarkup } from '../resource-hub/utils';
import { ResearchDiscoveryCandidate } from './types';

export type DiscoverySourceFilter = 'all' | 'Europe PMC' | 'Crossref' | 'OpenAlex';

export interface ResearchDiscoveryResponse {
  candidates: ResearchDiscoveryCandidate[];
  errors: Array<{ source: string; message: string }>;
  queriedSources: string[];
}

function reconstructOpenAlexAbstract(
  invertedIndex?: Record<string, number[]> | null
): string | undefined {
  if (!invertedIndex || typeof invertedIndex !== 'object') return undefined;
  const words: string[] = [];
  for (const [token, positions] of Object.entries(invertedIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) {
      if (typeof pos === 'number' && pos >= 0 && pos < 2500) {
        words[pos] = token;
      }
    }
  }
  const text = words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return text || undefined;
}

async function searchEuropePmc(
  query: string,
  signal?: AbortSignal
): Promise<ResearchDiscoveryCandidate[]> {
  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(signal, 11000);
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
      query
    )}&format=json&resultType=core&pageSize=12`;
    const res = await fetch(url, { signal: timeoutSignal });
    if (!res.ok) throw new Error(`Europe PMC returned HTTP ${res.status}`);
    const json = await res.json();
    const list: Array<Record<string, unknown>> = json?.resultList?.result || [];

    return list
      .map((row): ResearchDiscoveryCandidate | null => {
        const title = stripMarkup(String(row.title || ''));
        if (!title) return null;
        const pmid = row.pmid ? String(row.pmid) : undefined;
        const pmcid = row.pmcid ? String(row.pmcid) : undefined;
        const doi = row.doi ? String(row.doi) : undefined;
        const isOa = row.isOpenAccess === 'Y' || Boolean(pmcid);

        const fullUrls =
          ((row.fullTextUrlList as { fullTextUrl?: Array<Record<string, unknown>> } | undefined)
            ?.fullTextUrl || []) as Array<{
            url?: string;
            documentStyle?: string;
            availabilityCode?: string;
          }>;

        const pdfEntry = fullUrls.find(
          (u) =>
            u.documentStyle?.toLowerCase() === 'pdf' &&
            (u.availabilityCode === 'OA' || isOa)
        );
        const oaPdfUrl = sanitizeHttpUrl(pdfEntry?.url) || undefined;

        const fallbackUrl =
          (pmcid ? `https://europepmc.org/article/PMC/${encodeURIComponent(pmcid)}` : null) ||
          (doi ? `https://doi.org/${encodeURIComponent(doi)}` : null) ||
          (pmid ? `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid)}/` : null) ||
          sanitizeHttpUrl(fullUrls[0]?.url) ||
          'https://europepmc.org';

        const cleanAbstract = stripMarkup(row.abstractText ? String(row.abstractText) : '');

        return {
          id: `epmc_${pmcid || pmid || doi || title.slice(0, 24)}`,
          source: 'Europe PMC',
          title,
          authors: row.authorString ? String(row.authorString) : 'Authors listed at Europe PMC',
          journal: row.journalTitle
            ? String(row.journalTitle)
            : row.bookOrReportDetails
              ? 'Book / Report'
              : 'Europe PMC Indexed Journal',
          publicationYear: row.pubYear ? String(row.pubYear) : '',
          doi,
          pmid,
          pmcid,
          abstract: cleanAbstract || undefined,
          externalUrl: fallbackUrl,
          oaPdfUrl,
          isOpenAccess: isOa,
          licenseInfo: isOa
            ? 'Open Access record (Europe PMC) — verify publisher license before redistribution.'
            : 'Subscription or publisher-hosted full text (metadata & abstract via Europe PMC).'
        };
      })
      .filter((x): x is ResearchDiscoveryCandidate => x !== null);
  } finally {
    cleanup();
  }
}

async function searchCrossref(
  query: string,
  signal?: AbortSignal
): Promise<ResearchDiscoveryCandidate[]> {
  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(signal, 11000);
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(
      query
    )}&rows=10&select=DOI,title,author,container-title,published,abstract,URL,link,license`;
    const res = await fetch(url, { signal: timeoutSignal });
    if (!res.ok) throw new Error(`Crossref returned HTTP ${res.status}`);
    const json = await res.json();
    const items: Array<Record<string, unknown>> = json?.message?.items || [];

    return items
      .map((row): ResearchDiscoveryCandidate | null => {
        const rawTitles = Array.isArray(row.title) ? row.title : [];
        const title = stripMarkup(String(rawTitles[0] || ''));
        if (!title) return null;

        const doi = row.DOI ? String(row.DOI) : undefined;
        const authorArr = Array.isArray(row.author)
          ? (row.author as Array<{ given?: string; family?: string; name?: string }>)
          : [];
        const authors =
          authorArr
            .slice(0, 4)
            .map((a) => a.name || [a.given, a.family].filter(Boolean).join(' '))
            .filter(Boolean)
            .join(', ') + (authorArr.length > 4 ? ' et al.' : '');

        const containers = Array.isArray(row['container-title']) ? row['container-title'] : [];
        const journal = stripMarkup(String(containers[0] || 'Crossref Indexed Publication'));

        const published = row.published as { 'date-parts'?: number[][] } | undefined;
        const yearNum = published?.['date-parts']?.[0]?.[0];
        const publicationYear = yearNum ? String(yearNum) : '';

        const licenses = Array.isArray(row.license)
          ? (row.license as Array<{ URL?: string }>)
          : [];
        const ccLicense = licenses.find((l) =>
          (l.URL || '').toLowerCase().includes('creativecommons.org')
        );

        const links = Array.isArray(row.link)
          ? (row.link as Array<{ URL?: string; 'content-type'?: string }>)
          : [];
        const pdfLink = links.find((l) =>
          (l['content-type'] || '').toLowerCase().includes('pdf')
        );

        const externalUrl =
          sanitizeHttpUrl(row.URL ? String(row.URL) : undefined) ||
          (doi ? `https://doi.org/${encodeURIComponent(doi)}` : 'https://search.crossref.org');

        return {
          id: `crossref_${doi || title.slice(0, 24)}`,
          source: 'Crossref',
          title,
          authors: authors || 'Authors listed at publisher DOI',
          journal,
          publicationYear,
          doi,
          abstract: row.abstract ? stripMarkup(String(row.abstract)) : undefined,
          externalUrl,
          oaPdfUrl: ccLicense ? sanitizeHttpUrl(pdfLink?.URL) || undefined : undefined,
          isOpenAccess: Boolean(ccLicense),
          licenseInfo: ccLicense
            ? `Creative Commons license recorded (${ccLicense.URL})`
            : 'Publisher copyright — open via official DOI link or institutional access.'
        };
      })
      .filter((x): x is ResearchDiscoveryCandidate => x !== null);
  } finally {
    cleanup();
  }
}

async function searchOpenAlex(
  query: string,
  signal?: AbortSignal
): Promise<ResearchDiscoveryCandidate[]> {
  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(signal, 11000);
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(
      query
    )}&per-page=10`;
    const res = await fetch(url, { signal: timeoutSignal });
    if (!res.ok) throw new Error(`OpenAlex returned HTTP ${res.status}`);
    const json = await res.json();
    const results: Array<Record<string, unknown>> = json?.results || [];

    return results
      .map((row): ResearchDiscoveryCandidate | null => {
        const title = stripMarkup(String(row.title || ''));
        if (!title) return null;

        const rawDoi = row.doi ? String(row.doi) : '';
        const doi = rawDoi.replace(/^https?:\/\/doi\.org\//i, '').trim() || undefined;
        const publicationYear = row.publication_year ? String(row.publication_year) : '';

        const authorships = Array.isArray(row.authorships)
          ? (row.authorships as Array<{ author?: { display_name?: string } }>)
          : [];
        const authors =
          authorships
            .slice(0, 4)
            .map((a) => a.author?.display_name || '')
            .filter(Boolean)
            .join(', ') + (authorships.length > 4 ? ' et al.' : '');

        const primaryLoc = row.primary_location as {
          source?: { display_name?: string };
          landing_page_url?: string;
        } | null;
        const bestOa = row.best_oa_location as {
          pdf_url?: string;
          landing_page_url?: string;
          license?: string;
        } | null;
        const openAccess = row.open_access as { is_oa?: boolean; oa_url?: string } | null;

        const isOa = Boolean(openAccess?.is_oa || bestOa?.pdf_url);
        const oaPdfUrl = sanitizeHttpUrl(bestOa?.pdf_url) || undefined;
        const externalUrl =
          sanitizeHttpUrl(bestOa?.landing_page_url) ||
          sanitizeHttpUrl(primaryLoc?.landing_page_url) ||
          sanitizeHttpUrl(openAccess?.oa_url) ||
          (doi ? `https://doi.org/${encodeURIComponent(doi)}` : 'https://openalex.org');

        const abstract = reconstructOpenAlexAbstract(
          row.abstract_inverted_index as Record<string, number[]> | null | undefined
        );

        return {
          id: `openalex_${doi || String(row.id || title.slice(0, 24))}`,
          source: 'OpenAlex',
          title,
          authors: authors || 'Authors listed at OpenAlex',
          journal: primaryLoc?.source?.display_name || 'OpenAlex Indexed Source',
          publicationYear,
          doi,
          abstract,
          externalUrl,
          oaPdfUrl,
          isOpenAccess: isOa,
          licenseInfo: bestOa?.license
            ? `Open Access (${bestOa.license})`
            : isOa
              ? 'Open-access location indexed by OpenAlex'
              : 'Publisher-hosted publication — access via DOI or institution.'
        };
      })
      .filter((x): x is ResearchDiscoveryCandidate => x !== null);
  } finally {
    cleanup();
  }
}

function normalizeDedupKey(item: ResearchDiscoveryCandidate): string {
  if (item.doi) return `doi:${item.doi.toLowerCase().trim()}`;
  return `title:${item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`;
}

export async function discoverResearchPapers(
  rawQuery: string,
  sourceFilter: DiscoverySourceFilter = 'all',
  signal?: AbortSignal
): Promise<ResearchDiscoveryResponse> {
  const query = rawQuery.trim();
  if (query.length < 2) {
    return { candidates: [], errors: [], queriedSources: [] };
  }

  const tasks: Array<{
    name: 'Europe PMC' | 'Crossref' | 'OpenAlex';
    run: () => Promise<ResearchDiscoveryCandidate[]>;
  }> = [];

  if (sourceFilter === 'all' || sourceFilter === 'Europe PMC') {
    tasks.push({ name: 'Europe PMC', run: () => searchEuropePmc(query, signal) });
  }
  if (sourceFilter === 'all' || sourceFilter === 'Crossref') {
    tasks.push({ name: 'Crossref', run: () => searchCrossref(query, signal) });
  }
  if (sourceFilter === 'all' || sourceFilter === 'OpenAlex') {
    tasks.push({ name: 'OpenAlex', run: () => searchOpenAlex(query, signal) });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  const rawResults: ResearchDiscoveryCandidate[] = [];
  const errors: Array<{ source: string; message: string }> = [];

  settled.forEach((outcome, idx) => {
    const sourceName = tasks[idx].name;
    if (outcome.status === 'fulfilled') {
      rawResults.push(...outcome.value);
    } else {
      errors.push({
        source: sourceName,
        message: outcome.reason instanceof Error ? outcome.reason.message : 'Request failed'
      });
    }
  });

  // Deduplicate keeping the richest candidate (abstract + OA PDF preferred)
  const dedupMap = new Map<string, ResearchDiscoveryCandidate>();
  for (const cand of rawResults) {
    const key = normalizeDedupKey(cand);
    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, cand);
      continue;
    }

    const scoreCand = (c: ResearchDiscoveryCandidate) =>
      (c.abstract ? 3 : 0) + (c.oaPdfUrl ? 2 : 0) + (c.isOpenAccess ? 1 : 0) + (c.pmid ? 1 : 0);

    if (scoreCand(cand) > scoreCand(existing)) {
      dedupMap.set(key, {
        ...cand,
        abstract: cand.abstract || existing.abstract,
        oaPdfUrl: cand.oaPdfUrl || existing.oaPdfUrl,
        pmid: cand.pmid || existing.pmid,
        pmcid: cand.pmcid || existing.pmcid
      });
    } else {
      dedupMap.set(key, {
        ...existing,
        abstract: existing.abstract || cand.abstract,
        oaPdfUrl: existing.oaPdfUrl || cand.oaPdfUrl,
        pmid: existing.pmid || cand.pmid,
        pmcid: existing.pmcid || cand.pmcid
      });
    }
  }

  const candidates = Array.from(dedupMap.values()).sort(
    (a, b) =>
      (b.isOpenAccess ? 1 : 0) - (a.isOpenAccess ? 1 : 0) ||
      (b.abstract ? 1 : 0) - (a.abstract ? 1 : 0) ||
      Number(b.publicationYear || 0) - Number(a.publicationYear || 0)
  );

  return {
    candidates,
    errors,
    queriedSources: tasks.map((t) => t.name)
  };
}

export async function tryFetchOpenAccessPdf(
  oaPdfUrl: string,
  suggestedFileName: string
): Promise<File> {
  const safeUrl = sanitizeHttpUrl(oaPdfUrl);
  if (!safeUrl) {
    throw new Error('Invalid or missing open-access PDF URL.');
  }

  const { signal, cleanup } = createTimeoutSignal(undefined, 18000);
  try {
    const response = await fetch(safeUrl, { mode: 'cors', signal });
    if (!response.ok) {
      throw new Error(`Publisher server returned HTTP ${response.status}. Open the official OA link in your browser to download manually.`);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const buffer = await response.arrayBuffer();
    const header = new Uint8Array(buffer.slice(0, 5));
    const isPdfMagic =
      header[0] === 0x25 &&
      header[1] === 0x50 &&
      header[2] === 0x44 &&
      header[3] === 0x46; // %PDF

    if (!isPdfMagic && !contentType.includes('pdf')) {
      throw new Error(
        'The repository returned an HTML landing page rather than a direct PDF file. Open the official OA link and import the downloaded PDF manually.'
      );
    }

    const cleanName =
      suggestedFileName.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 72) ||
      'open_access_paper';
    const finalName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

    return new File([buffer], finalName, { type: 'application/pdf' });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        'Cross-origin download was blocked by the publisher server (CORS). Open the official Open-Access portal link to download the PDF, then import it locally.'
      );
    }
    throw err;
  } finally {
    cleanup();
  }
}
