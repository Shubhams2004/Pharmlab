import { ScientificResourceItem } from '../types';
import { createTimeoutSignal, extractYear, sanitizeHttpUrl, stripMarkup } from '../utils';
import { inferDepartmentsFromText, inferVisualCategoryFromText } from './europePmcProvider';

interface OpenStaxCmsBook {
  id: number;
  title: string;
  meta?: {
    slug?: string;
    html_url?: string;
    search_description?: string;
  };
  description?: string;
  book_subjects?: Array<{ subject_name?: string }>;
  authors?: Array<{ name?: string }>;
  publish_date?: string;
  license_name?: string;
  license_url?: string;
  webview_rex_link?: string;
  webview_link?: string;
  pdf_url?: string;
  high_resolution_pdf_url?: string;
  cover_url?: string;
}

const OPENSTAX_SCIENCE_TOPICS: Record<string, string[]> = {
  'anatomy-and-physiology-2e': [
    'anatomy',
    'physiology',
    'organ',
    'tissue',
    'cell',
    'heart',
    'kidney',
    'nephron',
    'lung',
    'brain',
    'spinal',
    'liver',
    'stomach',
    'intestine',
    'muscle',
    'bone',
    'skeleton',
    'endocrine',
    'thyroid',
    'blood',
    'nervous',
    'urinary',
    'respiratory',
    'cardiovascular',
    'digestive',
    'bp104t'
  ],
  'biology-2e': [
    'cell',
    'genetics',
    'enzyme',
    'plant',
    'photosynthesis',
    'botany',
    'mitochondria',
    'histology',
    'evolution',
    'microorganism'
  ],
  microbiology: [
    'bacteria',
    'peptidoglycan',
    'gram',
    'virus',
    'fungi',
    'infection',
    'antibiotic',
    'sterilization',
    'immune',
    'microscopy',
    'pathogen'
  ],
  'chemistry-2e': [
    'chemistry',
    'inorganic',
    'acid',
    'base',
    'titration',
    'buffer',
    'equilibrium',
    'solution',
    'molarity',
    'stoichiometry',
    'isotopes',
    'periodic',
    'bp106t'
  ],
  'chemistry-atoms-first-2e': [
    'chemistry',
    'atomic',
    'bonding',
    'molecular',
    'thermodynamics',
    'acid',
    'base'
  ],
  'organic-chemistry': [
    'organic',
    'aspirin',
    'ester',
    'carboxylic',
    'amine',
    'alkaloid',
    'benzene',
    'synthesis',
    'functional group',
    'pharmacology'
  ],
  'psychology-2e': [
    'psychology',
    'communication',
    'cognition',
    'behavior',
    'memory',
    'stress',
    'mental health',
    'counseling',
    'bp103t'
  ],
  'introduction-to-python-programming': [
    'python',
    'pandas',
    'programming',
    'loop',
    'function',
    'data',
    'bp101t'
  ]
};

let cachedBooks: OpenStaxCmsBook[] | null = null;
let cachedAt = 0;

async function fetchOpenStaxCatalog(signal?: AbortSignal): Promise<OpenStaxCmsBook[]> {
  if (cachedBooks && Date.now() - cachedAt < 15 * 60 * 1000) {
    return cachedBooks;
  }

  const fields = [
    'title',
    'description',
    'book_subjects',
    'authors',
    'publish_date',
    'license_name',
    'license_url',
    'webview_rex_link',
    'webview_link',
    'pdf_url',
    'high_resolution_pdf_url',
    'cover_url'
  ].join(',');

  const { signal: timedSignal, cleanup } = createTimeoutSignal(signal, 12000);
  try {
    const res = await fetch(
      `https://openstax.org/apps/cms/api/v2/pages/?type=books.Book&fields=${encodeURIComponent(fields)}&limit=50`,
      { signal: timedSignal }
    );
    if (!res.ok) {
      throw new Error(`OpenStax CMS HTTP ${res.status}`);
    }
    const json = await res.json();
    const items = (json?.items || []) as OpenStaxCmsBook[];
    cachedBooks = items;
    cachedAt = Date.now();
    return items;
  } finally {
    cleanup();
  }
}

export async function searchOpenStaxBooks(
  query: string,
  opts: { limit?: number; signal?: AbortSignal } = {}
): Promise<ScientificResourceItem[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  const catalog = await fetchOpenStaxCatalog(opts.signal);
  const terms = cleanQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  const scored: Array<{ book: OpenStaxCmsBook; score: number }> = [];

  for (const book of catalog) {
    const slug = (book.meta?.slug || '').toLowerCase();
    const titleLower = (book.title || '').toLowerCase();
    const descLower = stripMarkup(book.description || book.meta?.search_description || '').toLowerCase();
    const subjectNames = (book.book_subjects || [])
      .map((s) => (s.subject_name || '').toLowerCase())
      .join(' ');
    const curatedKeywords = (OPENSTAX_SCIENCE_TOPICS[slug] || []).join(' ');

    let score = 0;
    if (titleLower.includes(cleanQuery.toLowerCase())) score += 80;
    for (const term of terms) {
      if (titleLower.includes(term)) score += 35;
      if (descLower.includes(term)) score += 18;
      if (subjectNames.includes(term)) score += 12;
      if (curatedKeywords.includes(term)) score += 28;
    }

    if (score > 0) {
      scored.push({ book, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, opts.limit ?? 6).map(({ book, score }) => {
    const slug = book.meta?.slug || String(book.id);
    const description =
      stripMarkup(book.description || book.meta?.search_description || '') ||
      `Peer-reviewed open-access textbook published by OpenStax (${book.title}).`;
    const sourceUrl =
      sanitizeHttpUrl(book.webview_rex_link || book.webview_link || book.meta?.html_url) ||
      `https://openstax.org/details/books/${slug}`;
    const pdfUrl =
      sanitizeHttpUrl(book.pdf_url || book.high_resolution_pdf_url) || undefined;
    const previewUrl = sanitizeHttpUrl(book.cover_url) || undefined;
    const licenseUrl = sanitizeHttpUrl(book.license_url) || 'https://creativecommons.org/licenses/by/4.0/';
    const authors = (book.authors || []).map((a) => a.name || '').filter(Boolean);
    const year = extractYear(book.publish_date);
    const combinedText = `${book.title} ${description} ${slug}`;

    return {
      id: `openstax_book_${slug}`,
      providerId: 'openstax',
      providerName: 'OpenStax',
      title: book.title,
      resourceType: 'textbook',
      authors: authors.length > 0 ? authors : ['OpenStax Senior Contributing Authors'],
      journalOrPublisher: 'OpenStax · Rice University',
      publicationDate: book.publish_date || (year ? String(year) : 'Peer-reviewed Edition'),
      year,
      summary: description.slice(0, 260) + (description.length > 260 ? '…' : ''),
      abstractText: description,
      sourceUrl,
      pdfUrl,
      previewUrl,
      license: book.license_name || 'Creative Commons Attribution 4.0 (CC BY 4.0)',
      licenseUrl,
      attribution: `${book.title}, OpenStax (Rice University), ${book.license_name || 'CC BY 4.0'}`,
      isOpenAccess: true,
      isPermissiveLicense: true,
      accessType: pdfUrl ? 'open_access_pdf' : 'open_access_web',
      canDirectImportVisual: false,
      canAttemptDirectPdfImport: Boolean(pdfUrl),
      identifiers: { openStaxSlug: slug },
      topics: [cleanQuery],
      suggestedCategory: inferVisualCategoryFromText(combinedText),
      suggestedDepartments: inferDepartmentsFromText(combinedText),
      relevanceScore: Math.min(115, 70 + Math.round(score / 2))
    };
  });
}
