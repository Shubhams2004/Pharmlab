import { getAllBooks, getBookPages } from '../knowledge-library/libraryDb';
import { BookPageText, LibraryBookMeta } from '../knowledge-library/types';
import { getAllReferences } from '../reference-center/referenceDb';
import { ReferenceItem } from '../reference-center/types';
import {
  EvidenceQualityBreakdown,
  SourcePriorityTier,
  SyllabusTopicNode
} from '../study-mode/types';
import { classifyBookPriority } from './sourcePolicy';

export interface TextbookSearchHit {
  id: string;
  bookId: string;
  referenceId?: string;
  bookTitle: string;
  authors?: string;
  edition?: string;
  isbn?: string;
  priorityTier: SourcePriorityTier;
  pageNumber: number;
  chapterHeading?: string;
  passageExcerpt: string;
  contextBefore: string;
  contextAfter: string;
  matchedTerms: string[];
  primaryMatchedTerm: string;
  extractionQuality: 'pdf_text' | 'ocr_text' | 'unsearchable';
  relevanceScore: number;
  qualityBreakdown: EvidenceQualityBreakdown;
}

export interface BookReadinessSummary {
  totalBooks: number;
  searchableBooksCount: number;
  partialBooksCount: number;
  unsearchableBooksCount: number;
  ocrBooksCount: number;
  limitationNotices: string[];
}

export interface TextbookRetrievalBundle {
  queryUsed: string;
  expandedTerms: string[];
  hits: TextbookSearchHit[];
  readiness: BookReadinessSummary;
}

export interface PreloadedLibraryData {
  books: LibraryBookMeta[];
  pagesByBookId: Record<string, BookPageText[]>;
  references?: ReferenceItem[];
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'which', 'their',
  'these', 'those', 'such', 'about', 'under', 'after', 'before', 'between',
  'within', 'during', 'study', 'introduction', 'basic', 'basics', 'general',
  'methods', 'principles', 'system', 'systems', 'various', 'pharmacy',
  'pharmaceutical', 'including', 'related', 'topic', 'unit', 'course', 'using',
  'used', 'based', 'role', 'effect', 'effects', 'properties', 'functions'
]);

const PHARMACY_SYNONYMS: Array<string[]> = [
  ['posology', 'dose calculation', 'pediatric dose', 'youngs rule', 'clarks rule', 'dillings rule', 'frieds rule'],
  ['isotonic', 'isotonicity', 'tonicity', 'freezing point depression', 'sodium chloride equivalent'],
  ['alligation', 'percentage strength', 'dilution', 'concentration calculation'],
  ['proof spirit', 'alcohol dilution', 'percentage v/v'],
  ['buffer', 'henderson hasselbalch', 'buffer capacity', 'pka', 'conjugate base', 'weak acid'],
  ['limit test', 'impurity', 'nessler cylinder', 'opalescence', 'turbidity', 'gutzeit apparatus'],
  ['chloride', 'silver nitrate', 'agcl', 'nitric acid'],
  ['sulphate', 'sulfate', 'barium chloride', 'baso4'],
  ['arsenic', 'arsine', 'ash3', 'mercuric chloride paper', 'stannous chloride'],
  ['iron', 'thioglycolic acid', 'ferrous', 'ferric', 'citric acid'],
  ['heavy metals', 'lead', 'hydrogen sulphide', 'h2s', 'thioacetamide'],
  ['anticoagulant', 'antacid', 'acid neutralizing capacity', 'sodium bicarbonate', 'aluminium hydroxide'],
  ['haematinic', 'hematinic', 'ferrous sulphate', 'ferrous fumarate', 'hemoglobin', 'haemoglobin'],
  ['nephron', 'glomerulus', 'bowmans capsule', 'loop of henle', 'proximal convoluted tubule', 'renal'],
  ['homeostasis', 'negative feedback', 'positive feedback', 'baroreceptor', 'thermoregulation'],
  ['action potential', 'depolarization', 'repolarization', 'sodium potassium pump', 'resting membrane potential'],
  ['erythropoiesis', 'erythrocyte', 'rbc', 'reticulocyte', 'hemoglobin'],
  ['cardiac cycle', 'systole', 'diastole', 'stroke volume', 'cardiac output', 'ecg'],
  ['stomatal index', 'stomata', 'epidermal cells', 'vein islet', 'palisade ratio', 'lycopodium'],
  ['alkaloid', 'dragendorff', 'mayer', 'wagner', 'hager', 'nitrogenous'],
  ['glycoside', 'aglycone', 'glycone', 'keller kiliani', 'borntrager'],
  ['tannin', 'polyphenol', 'goldbeater', 'ferric chloride', 'astringent'],
  ['adulteration', 'substitution', 'organoleptic', 'ash value', 'extractive value'],
  ['pharmacokinetics', 'absorption', 'distribution', 'metabolism', 'excretion', 'adme', 'half life', 'clearance', 'bioavailability'],
  ['monograph', 'indian pharmacopoeia', 'ip', 'british pharmacopoeia', 'usp', 'compendia']
];

const FORMULA_TOKEN_REGEX = /\b(pKa|pKb|pH|pOH|t1\/2|Vd|Ke|AUC|Cmax|Tmax|HLB|NaCl|AgCl|BaSO4|AsH3|H2S|FeSO4|Al\(OH\)3|NaHCO3|HCl|NaOH|KMnO4|CO2|O2)\b/gi;

export function normalizeScientificText(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9./+\-\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractSignificantTerms(text: string, maxTerms = 14): string[] {
  const formulaMatches = Array.from(
    new Set((text.match(FORMULA_TOKEN_REGEX) || []).map((f) => f.trim()))
  );

  const normalized = normalizeScientificText(text)
    .replace(/[/+\-.]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

  const combined = [...formulaMatches, ...normalized];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const t of combined) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(t);
    }
    if (unique.length >= maxTerms) break;
  }
  return unique;
}

export function expandScientificQueryTerms(query: string, extraKeywords: string[] = []): string[] {
  const baseTerms = extractSignificantTerms(`${query} ${extraKeywords.join(' ')}`, 12);
  const queryNorm = normalizeScientificText(`${query} ${extraKeywords.join(' ')}`);
  const expanded = new Set<string>(baseTerms.map((t) => t.toLowerCase()));

  // Include full clean phrase if concise
  const cleanPhrase = query.trim();
  if (cleanPhrase.length >= 4 && cleanPhrase.length <= 64) {
    expanded.add(cleanPhrase.toLowerCase());
  }

  for (const group of PHARMACY_SYNONYMS) {
    const hit = group.some(
      (syn) =>
        queryNorm.includes(syn) ||
        baseTerms.some((t) => syn.includes(t.toLowerCase()) && t.length >= 4)
    );
    if (hit) {
      for (const syn of group) {
        expanded.add(syn);
      }
    }
  }

  return Array.from(expanded).slice(0, 22);
}

/**
 * Inspects lines preceding a match on the page (or nearby prior pages) to detect
 * real chapter/section headings. Never fabricates chapter titles or numbers.
 */
export function detectChapterOrHeading(
  pageText: string,
  matchOffset: number,
  precedingPages: BookPageText[] = []
): string | undefined {
  const beforeSlice = pageText.slice(0, Math.max(0, matchOffset));
  const lines = beforeSlice
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const headingPatterns = [
    /^(chapter|unit|section|part)\s+([0-9]+|[ivxlcdm]+)\b[:.\-\s]*(.{0,90})/i,
    /^([0-9]+(?:\.[0-9]+){0,2})\s+([A-Z][A-Za-z0-9\s,\-()]{3,80})$/
  ];

  // Scan upwards from the match offset on the current page
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (line.length < 4 || line.length > 100) continue;
    for (const pat of headingPatterns) {
      if (pat.test(line)) {
        return line.slice(0, 96);
      }
    }
    // All-caps short textbook section header (e.g. "POSOLOGY", "LIMIT TEST FOR ARSENIC")
    if (
      line.length >= 5 &&
      line.length <= 72 &&
      line === line.toUpperCase() &&
      /[A-Z]{3}/.test(line) &&
      !/^\d+$/.test(line)
    ) {
      return line;
    }
  }

  // Fallback: check top lines of up to 2 preceding pages for Chapter/Unit markers
  for (let p = precedingPages.length - 1; p >= Math.max(0, precedingPages.length - 2); p -= 1) {
    const prevLines = precedingPages[p].text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 12);
    for (const line of prevLines) {
      if (/^(chapter|unit|section)\s+([0-9]+|[ivxlcdm]+)\b/i.test(line) && line.length <= 100) {
        return line.slice(0, 96);
      }
    }
  }

  return undefined;
}

export function assessBooksReadiness(books: LibraryBookMeta[]): BookReadinessSummary {
  const searchableBooks = books.filter((b) => b.hasSearchableText && !b.isScannedOrEmpty);
  const partialBooks = books.filter((b) => b.extractionStatus === 'partial');
  const unsearchableBooks = books.filter((b) => !b.hasSearchableText || b.isScannedOrEmpty);
  const ocrBooks = books.filter(
    (b) => b.textSourceKind === 'ocr_text' || b.textSourceKind === 'mixed'
  );

  const notices: string[] = [];
  if (books.length === 0) {
    notices.push(
      'No PDF textbooks or reference books are uploaded in Knowledge Library yet. Upload textbooks there for page-level scientific verification.'
    );
  } else {
    if (unsearchableBooks.length > 0) {
      notices.push(
        `${unsearchableBooks.length} uploaded PDF(s) (${unsearchableBooks
          .map((b) => b.title)
          .slice(0, 2)
          .join(', ')}${unsearchableBooks.length > 2 ? ', ...' : ''}) appear scanned or contain no selectable text layer and cannot be searched automatically.`
      );
    }
    if (partialBooks.length > 0) {
      notices.push(
        `${partialBooks.length} PDF(s) have partial text extraction (${partialBooks
          .map((b) => `${b.title}: ${b.searchablePagesCount}/${b.pageCount} pages`)
          .slice(0, 2)
          .join('; ')}); unindexed pages require manual visual inspection.`
      );
    }
    if (ocrBooks.length > 0) {
      notices.push(
        `${ocrBooks.length} PDF(s) rely on OCR-derived text; check chemical formulas, subscripts, and numeric limits directly on the PDF page.`
      );
    }
  }

  return {
    totalBooks: books.length,
    searchableBooksCount: searchableBooks.length,
    partialBooksCount: partialBooks.length,
    unsearchableBooksCount: unsearchableBooks.length,
    ocrBooksCount: ocrBooks.length,
    limitationNotices: notices
  };
}

function buildMetadataCompleteness(
  book: LibraryBookMeta,
  linkedRef?: ReferenceItem
): 'complete' | 'partial' | 'minimal' {
  const hasAuthor = Boolean(book.authors?.trim() || linkedRef?.authors?.trim());
  const hasEdition = Boolean(book.edition?.trim() || linkedRef?.edition?.trim());
  const hasIsbn = Boolean(book.isbn?.trim() || linkedRef?.isbn?.trim());
  const count = [hasAuthor, hasEdition, hasIsbn].filter(Boolean).length;
  if (count >= 2) return 'complete';
  if (count === 1 || book.category === 'textbook') return 'partial';
  return 'minimal';
}

function buildQualityBreakdown(opts: {
  exactTermMatch: boolean;
  conceptualMatchScore: number;
  passageLength: number;
  sourcePriority: SourcePriorityTier;
  metadataCompleteness: 'complete' | 'partial' | 'minimal';
  extractionQuality: 'pdf_text' | 'ocr_text' | 'unsearchable';
}): EvidenceQualityBreakdown {
  const contextSufficient = opts.passageLength >= 80;
  const parts: string[] = [
    opts.exactTermMatch ? 'Exact term match' : 'Conceptual term overlap',
    `Overlap indicator ${opts.conceptualMatchScore}%`,
    contextSufficient ? 'Adequate passage context' : 'Brief excerpt',
    `Priority ${opts.sourcePriority}`,
    opts.extractionQuality === 'pdf_text'
      ? 'Native PDF text'
      : opts.extractionQuality === 'ocr_text'
      ? 'OCR-derived text'
      : 'Unsearchable scan'
  ];

  return {
    exactTermMatch: opts.exactTermMatch,
    conceptualMatchScore: opts.conceptualMatchScore,
    contextSufficient,
    sourcePriority: opts.sourcePriority,
    metadataCompleteness: opts.metadataCompleteness,
    pageAccuracy: 'exact_page',
    extractionQuality: opts.extractionQuality,
    indicatorsSummary: parts.join(' · '),
    notCertaintyDisclaimer:
      'Evidence indicators reflect text overlap, passage context, and extraction quality — not absolute scientific certainty. Always inspect the PDF page for clinical or pharmacopoeial tolerances.'
  };
}

function extractPassageWindow(pageText: string, term: string): {
  offset: number;
  before: string;
  excerpt: string;
  after: string;
} {
  const cleanText = pageText.replace(/\s+/g, ' ').trim();
  const lower = cleanText.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx < 0) {
    const excerpt = cleanText.slice(0, 320);
    return { offset: 0, before: '', excerpt, after: cleanText.slice(320, 420) };
  }

  const start = Math.max(0, idx - 130);
  const end = Math.min(cleanText.length, idx + term.length + 210);
  const before = (start > 0 ? '...' : '') + cleanText.slice(Math.max(0, start - 50), start);
  const excerpt = cleanText.slice(start, end);
  const after = cleanText.slice(end, Math.min(cleanText.length, end + 60)) + (end < cleanText.length ? '...' : '');

  // Also approximate raw offset in pageText for heading detection
  const rawIdx = pageText.toLowerCase().indexOf(term.toLowerCase());
  return {
    offset: rawIdx >= 0 ? rawIdx : 0,
    before: before.trim(),
    excerpt: excerpt.trim(),
    after: after.trim()
  };
}

export async function searchTextbooksForQuery(opts: {
  query: string;
  extraKeywords?: string[];
  preferredDepartment?: LibraryBookMeta['department'];
  limitPerBook?: number;
  maxTotalHits?: number;
  preloaded?: PreloadedLibraryData;
}): Promise<TextbookRetrievalBundle> {
  const {
    query,
    extraKeywords = [],
    preferredDepartment,
    limitPerBook = 3,
    maxTotalHits = 14,
    preloaded
  } = opts;

  const [books, references] = preloaded
    ? [preloaded.books, preloaded.references || []]
    : await Promise.all([
        getAllBooks().catch(() => [] as LibraryBookMeta[]),
        getAllReferences().catch(() => [] as ReferenceItem[])
      ]);

  const readiness = assessBooksReadiness(books);
  const expandedTerms = expandScientificQueryTerms(query, extraKeywords);
  const coreTerms = extractSignificantTerms(query, 8).map((t) => t.toLowerCase());
  const cleanQueryLower = query.trim().toLowerCase();

  if (expandedTerms.length === 0 || books.length === 0) {
    return {
      queryUsed: query,
      expandedTerms,
      hits: [],
      readiness
    };
  }

  const allHits: TextbookSearchHit[] = [];

  for (const book of books) {
    if (!book.hasSearchableText || book.isScannedOrEmpty) continue;

    const linkedRef = references.find((r) => r.linkedBookId === book.id);
    const priorityTier = classifyBookPriority(book, linkedRef);
    const metadataCompleteness = buildMetadataCompleteness(book, linkedRef);

    const pages = preloaded?.pagesByBookId
      ? preloaded.pagesByBookId[book.id] || []
      : await getBookPages(book.id).catch(() => [] as BookPageText[]);

    if (pages.length === 0) continue;

    const bookHits: TextbookSearchHit[] = [];

    for (let pIdx = 0; pIdx < pages.length; pIdx += 1) {
      const page = pages[pIdx];
      const text = page.text || '';
      if (text.trim().length < 25) continue;
      const lower = text.toLowerCase();

      const matchedTerms: string[] = [];
      let exactTermMatch = false;
      let score = 0;

      if (cleanQueryLower.length >= 4 && lower.includes(cleanQueryLower)) {
        exactTermMatch = true;
        matchedTerms.push(query.trim());
        score += 36;
      }

      for (const term of expandedTerms) {
        if (term.length < 3) continue;
        if (lower.includes(term)) {
          if (!matchedTerms.some((m) => m.toLowerCase() === term)) {
            matchedTerms.push(term);
          }
          const isCore = coreTerms.includes(term);
          if (isCore) exactTermMatch = true;
          score += isCore ? 14 : 7;
        }
      }

      if (matchedTerms.length === 0) continue;

      // Require either exact multi-word phrase or >=2 term hits (or 1 strong >=6 char core term)
      const hasStrongCore = matchedTerms.some((m) => m.length >= 6 && coreTerms.includes(m.toLowerCase()));
      if (!exactTermMatch && matchedTerms.length < 2 && !hasStrongCore) continue;

      if (preferredDepartment && book.department === preferredDepartment) {
        score += 6;
      }
      if (priorityTier === 1) {
        score += 8;
      }

      const primaryMatchedTerm =
        matchedTerms.find((m) => coreTerms.includes(m.toLowerCase())) || matchedTerms[0];
      const windowSlice = extractPassageWindow(text, primaryMatchedTerm);
      const chapterHeading = detectChapterOrHeading(
        text,
        windowSlice.offset,
        pages.slice(Math.max(0, pIdx - 2), pIdx)
      );

      const extractionQuality: 'pdf_text' | 'ocr_text' | 'unsearchable' =
        page.sourceKind === 'ocr_text' || book.textSourceKind === 'ocr_text'
          ? 'ocr_text'
          : 'pdf_text';

      const conceptualMatchScore = Math.min(
        98,
        Math.round(
          (matchedTerms.length / Math.max(2, Math.min(coreTerms.length + 2, 7))) * 72 +
            (exactTermMatch ? 24 : 0)
        )
      );

      const qualityBreakdown = buildQualityBreakdown({
        exactTermMatch,
        conceptualMatchScore,
        passageLength: windowSlice.excerpt.length,
        sourcePriority: priorityTier,
        metadataCompleteness,
        extractionQuality
      });

      bookHits.push({
        id: `tbhit_${book.id}_p${page.pageNumber}`,
        bookId: book.id,
        referenceId: linkedRef?.id,
        bookTitle: book.title,
        authors: book.authors || linkedRef?.authors,
        edition: book.edition || linkedRef?.edition,
        isbn: book.isbn || linkedRef?.isbn,
        priorityTier,
        pageNumber: page.pageNumber,
        chapterHeading,
        passageExcerpt: windowSlice.excerpt,
        contextBefore: windowSlice.before,
        contextAfter: windowSlice.after,
        matchedTerms,
        primaryMatchedTerm,
        extractionQuality,
        relevanceScore: score,
        qualityBreakdown
      });
    }

    bookHits.sort((a, b) => b.relevanceScore - a.relevanceScore || a.pageNumber - b.pageNumber);
    allHits.push(...bookHits.slice(0, limitPerBook));
  }

  allHits.sort(
    (a, b) =>
      a.priorityTier - b.priorityTier ||
      b.relevanceScore - a.relevanceScore ||
      a.bookTitle.localeCompare(b.bookTitle)
  );

  return {
    queryUsed: query,
    expandedTerms,
    hits: allHits.slice(0, maxTotalHits),
    readiness
  };
}

export async function retrieveTextbookContextForTopic(
  topic: SyllabusTopicNode,
  preloaded?: PreloadedLibraryData
): Promise<TextbookRetrievalBundle> {
  const query = `${topic.title} ${topic.subtopics.slice(0, 3).map((s) => s.title).join(' ')}`;
  return searchTextbooksForQuery({
    query,
    extraKeywords: topic.keywords,
    preferredDepartment: topic.bookDepartment,
    limitPerBook: 3,
    maxTotalHits: 12,
    preloaded
  });
}
