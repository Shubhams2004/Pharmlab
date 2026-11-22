import { DepartmentId, VisualCategory } from '../../visual-library/types';
import {
  PublicationDateWindow,
  ResourceProviderId,
  ResourceSortMode,
  ResourceType,
  ScientificResourceItem
} from '../types';
import { createTimeoutSignal, extractYear, sanitizeHttpUrl, stripMarkup } from '../utils';

export function inferDepartmentsFromText(text: string): DepartmentId[] {
  const lower = text.toLowerCase();
  const depts = new Set<DepartmentId>();

  if (
    /anatomy|histolog|nephron|kidney|cardiac|heart|neuron|brain|muscle|bone|lung|liver|stomach|intestine|physiology|blood|erythrocyte/.test(
      lower
    )
  ) {
    depts.add('anatomy');
  }
  if (/pharmacognosy|plant|herb|stoma|trichome|alkaloid|glycoside|botan|crude drug|turmeric|withania/.test(lower)) {
    depts.add('pharmacognosy');
  }
  if (/titration|inorganic|arsenic|limit test|buffer|isotonic|chelat|assay|oxide|sulfate|acid|base/.test(lower)) {
    depts.add('inorganic');
  }
  if (/dosage|tablet|capsule|emulsion|suspension|ointment|suppository|pharmacokinetics|drug|cox|receptor|pharmacology/.test(lower)) {
    depts.add('general_pharmacy');
  }
  if (/psychology|communication|counseling|adherence|empathy|cbt|behavior|mental/.test(lower)) {
    depts.add('psychology');
  }
  if (/python|pandas|algorithm|bioinformatics|computational|data analysis/.test(lower)) {
    depts.add('python');
  }

  if (depts.size === 0) {
    depts.add('anatomy');
    depts.add('general_pharmacy');
  }

  return Array.from(depts);
}

export function inferVisualCategoryFromText(text: string): VisualCategory {
  const lower = text.toLowerCase();
  if (/microscop|stoma|histolog|smear|stained/.test(lower)) return 'microscopy';
  if (/plant|herb|botan|leaf|flower|root/.test(lower)) return 'botany';
  if (/burette|flask|apparatus|beaker|instrument|microscope/.test(lower)) return 'apparatus';
  if (/chemical|molecule|acid|ester|formula|compound/.test(lower)) return 'chemistry';
  if (/anatomy|organ|heart|kidney|brain|bone|cell|muscle/.test(lower)) return 'anatomy';
  return 'clinical';
}

interface EuropePmcHit {
  id?: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  journalInfo?: { journal?: { title?: string } };
  pubYear?: string;
  firstPublicationDate?: string;
  abstractText?: string;
  isOpenAccess?: string;
  pubTypeList?: { pubType?: string[] };
  fullTextUrlList?: {
    fullTextUrl?: Array<{
      availability?: string;
      availabilityCode?: string;
      documentStyle?: string;
      site?: string;
      url?: string;
    }>;
  };
}

export async function searchEuropePmc(
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

  const currentYear = new Date().getFullYear();
  let queryExpr = cleanQuery;
  if (opts.dateWindow === '1y') {
    queryExpr = `(${cleanQuery}) AND PUB_YEAR:[${currentYear - 1} TO ${currentYear + 1}]`;
  } else if (opts.dateWindow === '5y') {
    queryExpr = `(${cleanQuery}) AND PUB_YEAR:[${currentYear - 5} TO ${currentYear + 1}]`;
  } else if (opts.dateWindow === '10y') {
    queryExpr = `(${cleanQuery}) AND PUB_YEAR:[${currentYear - 10} TO ${currentYear + 1}]`;
  }

  const params = new URLSearchParams({
    query: queryExpr,
    resultType: 'core',
    pageSize: String(opts.limit ?? 10),
    format: 'json'
  });

  if (opts.sortMode === 'date_desc') {
    params.set('sort', 'P_PDATE_D desc');
  }

  const { signal, cleanup } = createTimeoutSignal(opts.signal, 12000);
  try {
    const res = await fetch(
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params.toString()}`,
      { signal }
    );
    if (!res.ok) {
      throw new Error(`Europe PMC HTTP ${res.status}`);
    }

    const json = await res.json();
    const hits = (json?.resultList?.result || []) as EuropePmcHit[];

    return hits
      .map((hit, idx): ScientificResourceItem | null => {
        const title = stripMarkup(hit.title);
        if (!title) return null;

        const abstractText = stripMarkup(hit.abstractText);
        const pubTypes = (hit.pubTypeList?.pubType || []).map((t) => t.toLowerCase());
        const isReview = pubTypes.some((t) => t.includes('review'));
        const resourceType: ResourceType = isReview ? 'review_article' : 'research_paper';

        const fullUrls = hit.fullTextUrlList?.fullTextUrl || [];
        const pdfEntry =
          fullUrls.find(
            (u) => u.documentStyle === 'pdf' && u.availabilityCode === 'OA' && sanitizeHttpUrl(u.url)
          ) ||
          fullUrls.find((u) => u.documentStyle === 'pdf' && sanitizeHttpUrl(u.url));

        const htmlEntry =
          fullUrls.find(
            (u) => u.documentStyle === 'html' && u.availabilityCode === 'OA' && sanitizeHttpUrl(u.url)
          ) || fullUrls.find((u) => sanitizeHttpUrl(u.url));

        const fallbackUrl = hit.pmcid
          ? `https://europepmc.org/article/PMC/${hit.pmcid.replace(/^PMC/i, '')}`
          : hit.pmid
            ? `https://europepmc.org/article/MED/${hit.pmid}`
            : hit.doi
              ? `https://doi.org/${hit.doi}`
              : 'https://europepmc.org/';

        const sourceUrl = sanitizeHttpUrl(htmlEntry?.url) || sanitizeHttpUrl(fallbackUrl) || 'https://europepmc.org/';
        const pdfUrl = sanitizeHttpUrl(pdfEntry?.url) || undefined;
        const isOpenAccess = hit.isOpenAccess === 'Y' || Boolean(hit.pmcid) || Boolean(pdfEntry?.availabilityCode === 'OA');

        const authors = hit.authorString
          ? hit.authorString
              .split(',')
              .map((s) => s.trim().replace(/\.$/, ''))
              .filter(Boolean)
          : [];
        const journal =
          hit.journalInfo?.journal?.title || hit.journalTitle || 'Europe PMC Indexed Journal';
        const year = extractYear(hit.pubYear || hit.firstPublicationDate);
        const publicationDate = hit.firstPublicationDate || hit.pubYear || 'Date unavailable';

        const combinedText = `${title} ${abstractText} ${journal}`;

        return {
          id: `europepmc_${hit.id || hit.pmid || hit.pmcid || idx}`,
          providerId: 'europepmc' as ResourceProviderId,
          providerName: 'Europe PMC',
          title,
          resourceType,
          authors,
          journalOrPublisher: journal,
          publicationDate,
          year,
          summary:
            abstractText.slice(0, 260) + (abstractText.length > 260 ? '…' : '') ||
            `${isReview ? 'Review article' : 'Research article'} indexed in Europe PMC (${journal}).`,
          abstractText: abstractText || undefined,
          sourceUrl,
          pdfUrl,
          license: isOpenAccess ? 'Open Access (Verify article license at publisher)' : 'Publisher Terms / Abstract Indexed',
          isOpenAccess,
          isPermissiveLicense: isOpenAccess,
          licenseWarning: isOpenAccess
            ? undefined
            : 'Full text may require publisher access; abstract and citation metadata are freely available.',
          accessType: pdfUrl ? 'open_access_pdf' : isOpenAccess ? 'open_access_web' : 'abstract_only',
          canDirectImportVisual: false,
          canAttemptDirectPdfImport: Boolean(pdfUrl),
          identifiers: {
            pmid: hit.pmid,
            pmcid: hit.pmcid,
            doi: hit.doi
          },
          topics: [cleanQuery],
          suggestedCategory: inferVisualCategoryFromText(combinedText),
          suggestedDepartments: inferDepartmentsFromText(combinedText),
          relevanceScore: Math.max(10, 100 - idx * 6 + (isOpenAccess ? 12 : 0))
        };
      })
      .filter((item): item is ScientificResourceItem => Boolean(item));
  } finally {
    cleanup();
  }
}
