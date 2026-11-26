import {
  ClaimVerificationStatus,
  CrossTextbookComparison,
  EnrichmentSectionKey,
  ScientificClaimRecord,
  SyllabusTopicNode,
  TextbookEvidenceLink,
  TopicEnrichmentRecord,
  TopicVerificationRecord
} from '../study-mode/types';
import { SectionAssessmentState } from './sectionCatalog';
import { canLowPriorityOverrideTextbook } from './sourcePolicy';
import {
  assessBooksReadiness,
  extractSignificantTerms,
  normalizeScientificText,
  PreloadedLibraryData,
  searchTextbooksForQuery,
  TextbookSearchHit
} from './textbookSearchEngine';

export interface ClaimStatusDescriptor {
  status: ClaimVerificationStatus;
  label: string;
  shortLabel: string;
  tone: 'emerald' | 'teal' | 'amber' | 'rose' | 'slate';
  description: string;
}

export const CLAIM_STATUS_META: Record<ClaimVerificationStatus, ClaimStatusDescriptor> = {
  multiple_textbooks_supported: {
    status: 'multiple_textbooks_supported',
    label: 'Multiple Textbooks Supported',
    shortLabel: 'Multi-Textbook',
    tone: 'emerald',
    description:
      'Corroborated by passages across two or more authoritative textbooks or reference books.'
  },
  textbook_supported: {
    status: 'textbook_supported',
    label: 'Textbook Supported',
    shortLabel: 'Textbook Supported',
    tone: 'teal',
    description:
      'Supported by a matching passage with exact page reference in an uploaded or linked textbook.'
  },
  partially_supported: {
    status: 'partially_supported',
    label: 'Partially Supported',
    shortLabel: 'Partial Support',
    tone: 'amber',
    description:
      'Related textbook concepts or OCR excerpts found, but specific details or complete coverage require closer review.'
  },
  conflicting_evidence: {
    status: 'conflicting_evidence',
    label: 'Conflicting Textbook Evidence',
    shortLabel: 'Conflicting Evidence',
    tone: 'rose',
    description:
      'Retrieved textbook passages show a potential quantitative, polarity, or factual disagreement requiring review.'
  },
  unsupported_by_books: {
    status: 'unsupported_by_books',
    label: 'Unsupported by Available Books',
    shortLabel: 'Not in Available Books',
    tone: 'slate',
    description:
      'No matching passage was found in currently indexed textbooks. Absence of a book match does not mean the claim is scientifically false.'
  },
  requires_manual_verification: {
    status: 'requires_manual_verification',
    label: 'Requires Manual Verification',
    shortLabel: 'Needs Manual Check',
    tone: 'amber',
    description:
      'Contains pharmacopoeial limits, quantitative values, or flagged points requiring direct verification in an official reference book.'
  },
  not_yet_checked: {
    status: 'not_yet_checked',
    label: 'Not Yet Checked',
    shortLabel: 'Not Checked',
    tone: 'slate',
    description:
      'Verification against the PDF Knowledge Library has not been executed yet for this claim.'
  }
};

function hashClaimSignature(sectionKey: string, text: string): string {
  const norm = normalizeScientificText(text).slice(0, 120);
  let hash = 2166136261;
  const full = `${sectionKey}::${norm}`;
  for (let i = 0; i < full.length; i += 1) {
    hash ^= full.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `clm_${sectionKey}_${(hash >>> 0).toString(36)}`;
}

function isBoilerplateLine(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (lower.length < 24) return true;
  if (
    lower.startsWith('hierarchy placement:') ||
    lower.startsWith('subtopic scope:') ||
    lower.startsWith('visual study focus:') ||
    lower.startsWith('bench alignment:') ||
    lower.startsWith('authoritative reference list compiled')
  ) {
    return true;
  }
  return false;
}

function splitProseIntoClaims(prose: string): string[] {
  if (!prose.trim()) return [];
  // Protect decimals (e.g. 7.4) and common abbreviations (e.g., i.e., Fig., Dr.)
  const protectedText = prose
    .replace(/\b(e\.g\.|i\.e\.|viz\.|etc\.|Fig\.|No\.|Vol\.|Ed\.)/gi, (m) =>
      m.replace(/\./g, '§DOT§')
    )
    .replace(/(\d)\.(\d)/g, '$1§DOT§$2');

  const rawSentences = protectedText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/§DOT§/g, '.').trim())
    .filter((s) => !isBoilerplateLine(s));

  return rawSentences.slice(0, 12);
}

export function extractClaimsForTopic(opts: {
  topic: SyllabusTopicNode;
  enrichmentRecord?: TopicEnrichmentRecord | null;
  sectionStates: SectionAssessmentState[];
  existingVerification?: TopicVerificationRecord | null;
}): ScientificClaimRecord[] {
  const { topic, enrichmentRecord, sectionStates, existingVerification } = opts;
  const existingById = new Map<string, ScientificClaimRecord>();
  const existingByNorm = new Map<string, ScientificClaimRecord>();

  for (const prev of existingVerification?.claims || []) {
    existingById.set(prev.id, prev);
    existingByNorm.set(`${prev.sectionKey}::${normalizeScientificText(prev.claimText)}`, prev);
  }

  const claims: ScientificClaimRecord[] = [];
  const seenNorm = new Set<string>();

  const pushClaim = (
    sectionKey: EnrichmentSectionKey,
    rawText: string,
    sourceOrigin: ScientificClaimRecord['sourceOrigin']
  ) => {
    const clean = rawText.replace(/\s+/g, ' ').trim();
    if (isBoilerplateLine(clean)) return;
    const normKey = `${sectionKey}::${normalizeScientificText(clean)}`;
    if (seenNorm.has(normKey)) return;
    seenNorm.add(normKey);

    const id = hashClaimSignature(sectionKey, clean);
    const prev = existingById.get(id) || existingByNorm.get(normKey);

    claims.push({
      id: prev?.id || id,
      topicId: topic.id,
      sectionKey,
      claimText: clean,
      sourceOrigin,
      status: prev?.status || 'not_yet_checked',
      evidenceLinks: prev?.evidenceLinks || [],
      manualNotes: prev?.manualNotes || '',
      contradictionNotes: prev?.contradictionNotes,
      reviewedByUser: prev?.reviewedByUser || false,
      reviewedAt: prev?.reviewedAt,
      updatedAt: prev?.updatedAt || Date.now()
    });
  };

  for (const state of sectionStates) {
    if (!state.applicable) continue;
    const secKey = state.blueprint.key;
    if (secKey === 'references' || secKey === 'learning_objectives') continue;

    const approved = enrichmentRecord?.approvedSections?.[secKey];
    const draft = enrichmentRecord?.drafts?.[secKey];

    if (approved) {
      for (const s of splitProseIntoClaims(approved.prose)) {
        pushClaim(secKey, s, 'approved_enrichment');
      }
      for (const b of approved.bullets || []) {
        pushClaim(secKey, b, 'approved_enrichment');
      }
      for (const f of approved.formulas || []) {
        pushClaim(secKey, `Formula / Quantitative Relation: ${f}`, 'approved_enrichment');
      }
    } else if (draft) {
      for (const s of splitProseIntoClaims(draft.prose)) {
        pushClaim(secKey, s, 'draft_enrichment');
      }
      for (const b of draft.bullets || []) {
        pushClaim(secKey, b, 'draft_enrichment');
      }
      for (const f of draft.formulas || []) {
        pushClaim(secKey, `Formula / Quantitative Relation: ${f}`, 'draft_enrichment');
      }
    } else {
      for (const prose of state.existingProse) {
        for (const s of splitProseIntoClaims(prose)) {
          pushClaim(secKey, s, 'baseline_catalog');
        }
      }
      for (const b of state.existingBullets) {
        pushClaim(secKey, b, 'baseline_catalog');
      }
    }
  }

  return claims.slice(0, 60);
}

interface NumericUnitToken {
  value: number;
  unit: string;
  raw: string;
}

function extractNumericUnits(text: string): NumericUnitToken[] {
  const regex =
    /\b(\d+(?:\.\d+)?)\s*(mg\/kg|mg|mcg|ug|g|ml|l|ppm|%|mmhg|days|hours|min|minutes|seconds|°c|c|k|meq\/l|mmol\/l|ph|m|n)\b/gi;
  const out: NumericUnitToken[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const val = Number(m[1]);
    if (!Number.isFinite(val)) continue;
    out.push({
      value: val,
      unit: m[2].toLowerCase(),
      raw: m[0]
    });
  }

  // Also detect "pH <number>"
  const phRegex = /\bph\s*(?:of|is|=|:)?\s*(\d+(?:\.\d+)?)\b/gi;
  while ((m = phRegex.exec(text)) !== null) {
    const val = Number(m[1]);
    if (!Number.isFinite(val)) continue;
    out.push({ value: val, unit: 'ph_value', raw: m[0] });
  }

  return out;
}

function detectPotentialConflict(claimText: string, passageText: string, sharedTermsCount: number): {
  conflicting: boolean;
  reason?: string;
} {
  if (sharedTermsCount < 2) return { conflicting: false };

  // 1. Numeric disagreement on the same unit when sharing core subject terms
  const claimNums = extractNumericUnits(claimText);
  const passageNums = extractNumericUnits(passageText);
  for (const cn of claimNums) {
    for (const pn of passageNums) {
      if (cn.unit === pn.unit) {
        const diff = Math.abs(cn.value - pn.value);
        const rel = cn.value > 0 ? diff / cn.value : diff;
        if (diff > 0.01 && rel >= 0.15) {
          return {
            conflicting: true,
            reason: `Quantitative mismatch on unit "${cn.unit}": claim cites ${cn.raw} whereas passage cites ${pn.raw}.`
          };
        }
      }
    }
  }

  // 2. Explicit negation polarity mismatch on core subject terms
  const negPattern = /\b(does not|do not|cannot|never|not indicated|contraindicated|absent|no effect)\b/i;
  const claimNeg = negPattern.test(claimText);
  const passageNeg = negPattern.test(passageText);
  if (claimNeg !== passageNeg && sharedTermsCount >= 3) {
    // Only trigger if explicit affirmative/negative clinical or mechanistic assertion collides
    const strongVerb = /\b(causes|inhibits|activates|produces|contains|soluble|precipitates|treats|indicates)\b/i;
    if (strongVerb.test(claimText) && strongVerb.test(passageText)) {
      return {
        conflicting: true,
        reason: 'Polarity divergence detected (affirmative vs negative statement) across matching terms; inspect both statements.'
      };
    }
  }

  return { conflicting: false };
}

function detectInterBookConflict(links: TextbookEvidenceLink[]): string | undefined {
  if (links.length < 2) return undefined;
  for (let i = 0; i < links.length; i += 1) {
    for (let j = i + 1; j < links.length; j += 1) {
      if (links[i].bookId === links[j].bookId) continue;
      const aTerms = extractSignificantTerms(links[i].passageExcerpt, 8).map((t) => t.toLowerCase());
      const bLower = links[j].passageExcerpt.toLowerCase();
      const shared = aTerms.filter((t) => bLower.includes(t)).length;
      const check = detectPotentialConflict(
        links[i].passageExcerpt,
        links[j].passageExcerpt,
        shared
      );
      if (check.conflicting) {
        return `Between ${links[i].bookTitle} (p.${links[i].pageNumber ?? '?'}) and ${links[j].bookTitle} (p.${links[j].pageNumber ?? '?'}): ${check.reason}`;
      }
    }
  }
  return undefined;
}

function evaluateHitAgainstClaim(
  claimText: string,
  hit: TextbookSearchHit
): {
  stance: TextbookEvidenceLink['stance'];
  overlapRatio: number;
  conflictReason?: string;
} {
  const claimTerms = extractSignificantTerms(claimText, 10).map((t) => t.toLowerCase());
  const passageLower = `${hit.contextBefore} ${hit.passageExcerpt} ${hit.contextAfter}`.toLowerCase();

  let shared = 0;
  for (const t of claimTerms) {
    if (passageLower.includes(t)) shared += 1;
  }

  const overlapRatio = claimTerms.length > 0 ? shared / claimTerms.length : 0;
  const conflict = detectPotentialConflict(claimText, hit.passageExcerpt, shared);

  if (conflict.conflicting) {
    return {
      stance: 'contradicts',
      overlapRatio,
      conflictReason: conflict.reason
    };
  }

  if (
    hit.extractionQuality !== 'unsearchable' &&
    hit.qualityBreakdown.contextSufficient &&
    (overlapRatio >= 0.45 || (hit.qualityBreakdown.exactTermMatch && shared >= 2))
  ) {
    return { stance: 'supports', overlapRatio };
  }

  if (shared >= 2 || overlapRatio >= 0.25) {
    return { stance: 'partial', overlapRatio };
  }

  return { stance: 'contextual', overlapRatio };
}

function computeStatusFromLinks(opts: {
  claim: ScientificClaimRecord;
  links: TextbookEvidenceLink[];
  searchableBooksCount: number;
  interBookConflict?: string;
}): ClaimVerificationStatus {
  const { claim, links, searchableBooksCount, interBookConflict } = opts;

  if (interBookConflict || links.some((l) => l.stance === 'contradicts') || claim.contradictionNotes?.trim()) {
    return 'conflicting_evidence';
  }

  const supportingLinks = links.filter((l) => l.stance === 'supports' && l.priorityTier <= 2);
  const distinctSupportingBooks = new Set(supportingLinks.map((l) => l.bookId));

  if (distinctSupportingBooks.size >= 2) {
    return 'multiple_textbooks_supported';
  }
  if (distinctSupportingBooks.size === 1) {
    return 'textbook_supported';
  }

  const partialLinks = links.filter((l) => l.stance === 'partial' || l.stance === 'supports');
  if (partialLinks.length > 0) {
    // Critical numeric/pharmacopoeial claims with only weak/OCR matches flag manual check
    const hasCriticalLimits = /\b(\d+(?:\.\d+)?\s*(?:%|ppm|mg|ml|ph|°c)|limit|pharmacopoeia|dosage)\b/i.test(
      claim.claimText
    );
    if (hasCriticalLimits && partialLinks.every((l) => l.extractionQuality === 'ocr_text')) {
      return 'requires_manual_verification';
    }
    return 'partially_supported';
  }

  if (searchableBooksCount === 0) {
    return 'not_yet_checked';
  }

  const hasQuantitativeOrPharmacopoeial = /\b(limit test|pharmacopoeia|ip|bp|usp|\d+\s*(?:mg|ml|ppm|%))\b/i.test(
    claim.claimText
  );
  if (hasQuantitativeOrPharmacopoeial && claim.reviewedByUser === false && links.length === 0) {
    return 'unsupported_by_books';
  }

  return 'unsupported_by_books';
}

export async function verifyTopicClaimsAgainstTextbooks(opts: {
  topic: SyllabusTopicNode;
  syllabusId: string;
  enrichmentRecord?: TopicEnrichmentRecord | null;
  sectionStates: SectionAssessmentState[];
  existingVerification?: TopicVerificationRecord | null;
  preloaded?: PreloadedLibraryData;
}): Promise<TopicVerificationRecord> {
  const { topic, syllabusId, enrichmentRecord, sectionStates, existingVerification, preloaded } = opts;

  const claims = extractClaimsForTopic({
    topic,
    enrichmentRecord,
    sectionStates,
    existingVerification
  });

  // Load books readiness once
  const books = preloaded
    ? preloaded.books
    : await import('../knowledge-library/libraryDb').then((m) => m.getAllBooks().catch(() => []));
  const readiness = assessBooksReadiness(books);

  const verifiedClaims: ScientificClaimRecord[] = [];
  const now = Date.now();

  for (const claim of claims) {
    const userLinked = claim.evidenceLinks.filter((l) => l.linkedBy === 'user_linked');

    if (readiness.searchableBooksCount === 0 && userLinked.length === 0) {
      verifiedClaims.push({
        ...claim,
        status: claim.contradictionNotes?.trim()
          ? 'conflicting_evidence'
          : claim.manualNotes.trim() && !claim.reviewedByUser
          ? 'requires_manual_verification'
          : 'not_yet_checked',
        updatedAt: now
      });
      continue;
    }

    const bundle = await searchTextbooksForQuery({
      query: claim.claimText,
      extraKeywords: topic.keywords,
      preferredDepartment: topic.bookDepartment,
      limitPerBook: 2,
      maxTotalHits: 6,
      preloaded
    });

    const autoLinks: TextbookEvidenceLink[] = [];
    for (const hit of bundle.hits) {
      const evaluation = evaluateHitAgainstClaim(claim.claimText, hit);
      if (evaluation.stance === 'contextual' && autoLinks.length >= 2) continue;
      if (evaluation.overlapRatio < 0.2 && !hit.qualityBreakdown.exactTermMatch) continue;

      // Avoid duplicating a user-linked book+page
      const duplicateUser = userLinked.some(
        (ul) => ul.bookId === hit.bookId && ul.pageNumber === hit.pageNumber
      );
      if (duplicateUser) continue;

      if (!canLowPriorityOverrideTextbook([...userLinked, ...autoLinks], hit.priorityTier)) {
        // Still allow supplementary visibility only if it doesn't override textbook stance
      }

      autoLinks.push({
        id: `ev_${claim.id}_${hit.bookId}_p${hit.pageNumber}`,
        claimId: claim.id,
        bookId: hit.bookId,
        referenceId: hit.referenceId,
        bookTitle: hit.bookTitle,
        authors: hit.authors,
        edition: hit.edition,
        isbn: hit.isbn,
        priorityTier: hit.priorityTier,
        chapterHeading: hit.chapterHeading,
        pageNumber: hit.pageNumber,
        passageExcerpt: hit.passageExcerpt,
        contextBefore: hit.contextBefore,
        contextAfter: hit.contextAfter,
        extractionQuality: hit.extractionQuality,
        stance: evaluation.stance,
        relevanceIndicators: hit.qualityBreakdown,
        linkedBy: 'auto_matched',
        matchedTerm: hit.primaryMatchedTerm,
        verifiedAt: now
      });
    }

    const mergedLinks = [...userLinked, ...autoLinks].sort(
      (a, b) =>
        a.priorityTier - b.priorityTier ||
        (a.linkedBy === 'user_linked' ? -1 : 1) - (b.linkedBy === 'user_linked' ? -1 : 1) ||
        b.relevanceIndicators.conceptualMatchScore - a.relevanceIndicators.conceptualMatchScore
    );

    const interBookConflict = detectInterBookConflict(mergedLinks);
    const conflictReasons = [
      ...(interBookConflict ? [interBookConflict] : []),
      ...mergedLinks
        .filter((l) => l.stance === 'contradicts')
        .map((l) => `${l.bookTitle} (p.${l.pageNumber ?? '?'}) shows potential mismatch with claim figures/polarity.`)
    ];

    const computedStatus = computeStatusFromLinks({
      claim,
      links: mergedLinks,
      searchableBooksCount: readiness.searchableBooksCount,
      interBookConflict
    });

    verifiedClaims.push({
      ...claim,
      status: computedStatus,
      evidenceLinks: mergedLinks,
      contradictionNotes:
        claim.contradictionNotes ||
        (conflictReasons.length > 0 ? conflictReasons.join(' | ') : undefined),
      updatedAt: now
    });
  }

  return {
    topicId: topic.id,
    syllabusId,
    subjectCode: topic.subjectCode,
    topicTitle: topic.title,
    claims: verifiedClaims,
    lastVerifiedAt: now,
    bookSnapshotIds: books.map((b) => b.id),
    searchableBooksCount: readiness.searchableBooksCount,
    unsearchableBooksCount: readiness.unsearchableBooksCount,
    limitationNotices: readiness.limitationNotices,
    updatedAt: now
  };
}

const TERMINOLOGY_PAIRS: Array<[string, string]> = [
  ['sulphate', 'sulfate'],
  ['sulphide', 'sulfide'],
  ['haemoglobin', 'hemoglobin'],
  ['haematinic', 'hematinic'],
  ['adrenaline', 'epinephrine'],
  ['noradrenaline', 'norepinephrine'],
  ['paracetamol', 'acetaminophen'],
  ['lignocaine', 'lidocaine'],
  ['oedema', 'edema'],
  ['oesophagus', 'esophagus'],
  ['erythrocyte', 'red blood cell'],
  ['leukocyte', 'white blood cell'],
  ['thrombocyte', 'platelet']
];

export function buildCrossTextbookComparisonForLinks(
  label: string,
  links: TextbookEvidenceLink[]
): CrossTextbookComparison | null {
  // Group best link per distinct book
  const byBook = new Map<string, TextbookEvidenceLink>();
  for (const link of links) {
    const existing = byBook.get(link.bookId);
    if (
      !existing ||
      link.relevanceIndicators.conceptualMatchScore > existing.relevanceIndicators.conceptualMatchScore
    ) {
      byBook.set(link.bookId, link);
    }
  }

  const distinct = Array.from(byBook.values());
  if (distinct.length < 2) return null;

  const bookTitles = distinct.map((l) => l.bookTitle);
  const termsPerBook = distinct.map((l) =>
    extractSignificantTerms(l.passageExcerpt, 12).map((t) => t.toLowerCase())
  );

  // Agreed concepts: terms appearing across >=2 distinct books
  const termBookFreq = new Map<string, number>();
  termsPerBook.forEach((terms) => {
    for (const t of new Set(terms)) {
      termBookFreq.set(t, (termBookFreq.get(t) || 0) + 1);
    }
  });
  const agreedConcepts = Array.from(termBookFreq.entries())
    .filter(([, count]) => count >= 2)
    .map(([term]) => term)
    .slice(0, 8);

  // Additional perspectives: unique distinctive concepts in each book
  const additionalPerspectives = distinct.map((link, idx) => {
    const uniqueTerms = termsPerBook[idx].filter((t) => (termBookFreq.get(t) || 0) === 1).slice(0, 4);
    const editionTag = link.edition ? ` (${link.edition})` : '';
    const note =
      uniqueTerms.length > 0
        ? `Adds focus on ${uniqueTerms.join(', ')}: "${link.passageExcerpt.slice(0, 140)}${
            link.passageExcerpt.length > 140 ? '...' : ''
          }"`
        : `Corroborates passage on page ${link.pageNumber ?? '?'}${editionTag}.`;
    return {
      bookTitle: `${link.bookTitle}${editionTag}`,
      pageNumber: link.pageNumber,
      chapterHeading: link.chapterHeading,
      note
    };
  });

  // Terminology differences genuinely present in passages
  const combinedTexts = distinct.map((l) => l.passageExcerpt.toLowerCase());
  const terminologyDifferences: string[] = [];
  for (const [a, b] of TERMINOLOGY_PAIRS) {
    const booksWithA = distinct.filter((_, i) => combinedTexts[i].includes(a)).map((l) => l.bookTitle);
    const booksWithB = distinct.filter((_, i) => combinedTexts[i].includes(b)).map((l) => l.bookTitle);
    if (booksWithA.length > 0 && booksWithB.length > 0 && booksWithA[0] !== booksWithB[0]) {
      terminologyDifferences.push(
        `"${a}" (${booksWithA[0]}) vs "${b}" (${booksWithB[0]})`
      );
    }
  }

  // Classification differences (only if classification headings/cues diverge)
  const classificationDifferences: string[] = [];
  const classPassages = distinct.filter((l) =>
    /\b(classified into|classification|types of|categories|subclasses)\b/i.test(l.passageExcerpt)
  );
  if (classPassages.length >= 2) {
    classificationDifferences.push(
      `Multiple books present classification framing (${classPassages
        .map((c) => `${c.bookTitle} p.${c.pageNumber ?? '?'}`)
        .join(' vs ')}); compare category boundaries directly.`
    );
  }

  // Real conflicts only
  const conflictingStatements: CrossTextbookComparison['conflictingStatements'] = [];
  const interConflict = detectInterBookConflict(distinct);
  if (interConflict || distinct.some((l) => l.stance === 'contradicts')) {
    conflictingStatements.push({
      summary:
        interConflict ||
        'Potential discrepancy detected between textbook passages; review exact figures/statements.',
      passages: distinct.map((l) => ({
        bookTitle: l.bookTitle,
        pageNumber: l.pageNumber,
        excerpt: l.passageExcerpt.slice(0, 180)
      }))
    });
  }

  // Edition differences ONLY when edition metadata is actually present and differs
  const editionsWithTitles = distinct
    .filter((l) => Boolean(l.edition?.trim()))
    .map((l) => ({ title: l.bookTitle, edition: l.edition!.trim(), page: l.pageNumber }));
  const uniqueEditions = new Set(editionsWithTitles.map((e) => e.edition.toLowerCase()));
  const editionDifferences: string[] = [];
  if (uniqueEditions.size >= 2) {
    editionDifferences.push(
      `Editions represented: ${editionsWithTitles
        .map((e) => `${e.title} [${e.edition}, p.${e.page ?? '?'}]`)
        .join(' vs ')}.`
    );
  }

  return {
    claimOrTopicLabel: label,
    booksComparedCount: distinct.length,
    bookTitles,
    agreedConcepts,
    additionalPerspectives,
    terminologyDifferences,
    classificationDifferences,
    conflictingStatements,
    editionDifferences,
    note:
      conflictingStatements.length > 0
        ? 'Potential conflict flagged based on differing quantitative values or polarity; verify original PDF pages.'
        : 'Books show complementary depth or terminology rather than scientific disagreement.'
  };
}

export function buildTopicCrossTextbookComparisons(
  claims: ScientificClaimRecord[]
): CrossTextbookComparison[] {
  const comparisons: CrossTextbookComparison[] = [];

  for (const claim of claims) {
    const comp = buildCrossTextbookComparisonForLinks(
      claim.claimText.slice(0, 96) + (claim.claimText.length > 96 ? '...' : ''),
      claim.evidenceLinks
    );
    if (comp) comparisons.push(comp);
  }

  // Also synthesize a topic-wide comparison if multiple books appear across separate claims
  if (comparisons.length === 0) {
    const allLinks = claims.flatMap((c) => c.evidenceLinks);
    const topicWide = buildCrossTextbookComparisonForLinks('Topic-Level Multi-Book Evidence', allLinks);
    if (topicWide) comparisons.push(topicWide);
  }

  return comparisons.slice(0, 8);
}

export function summarizeTopicVerification(
  record?: TopicVerificationRecord | null
): {
  totalClaims: number;
  textbookSupportedCount: number;
  multipleBooksCount: number;
  partiallySupportedCount: number;
  conflictingCount: number;
  unsupportedByBooksCount: number;
  requiresManualCount: number;
  reviewedCount: number;
} {
  const claims = record?.claims || [];
  return {
    totalClaims: claims.length,
    textbookSupportedCount: claims.filter((c) => c.status === 'textbook_supported').length,
    multipleBooksCount: claims.filter((c) => c.status === 'multiple_textbooks_supported').length,
    partiallySupportedCount: claims.filter((c) => c.status === 'partially_supported').length,
    conflictingCount: claims.filter((c) => c.status === 'conflicting_evidence').length,
    unsupportedByBooksCount: claims.filter((c) => c.status === 'unsupported_by_books').length,
    requiresManualCount: claims.filter((c) => c.status === 'requires_manual_verification').length,
    reviewedCount: claims.filter((c) => c.reviewedByUser).length
  };
}

export function hitToEvidenceLink(
  claimId: string,
  hit: TextbookSearchHit,
  linkedBy: 'auto_matched' | 'user_linked',
  stance: TextbookEvidenceLink['stance'] = 'supports'
): TextbookEvidenceLink {
  return {
    id: `ev_${claimId}_${hit.bookId}_p${hit.pageNumber}_${linkedBy}`,
    claimId,
    bookId: hit.bookId,
    referenceId: hit.referenceId,
    bookTitle: hit.bookTitle,
    authors: hit.authors,
    edition: hit.edition,
    isbn: hit.isbn,
    priorityTier: hit.priorityTier,
    chapterHeading: hit.chapterHeading,
    pageNumber: hit.pageNumber,
    passageExcerpt: hit.passageExcerpt,
    contextBefore: hit.contextBefore,
    contextAfter: hit.contextAfter,
    extractionQuality: hit.extractionQuality,
    stance,
    relevanceIndicators: hit.qualityBreakdown,
    linkedBy,
    matchedTerm: hit.primaryMatchedTerm,
    verifiedAt: Date.now()
  };
}

export function recalculateClaimStatus(
  claim: ScientificClaimRecord,
  searchableBooksCount: number
): ClaimVerificationStatus {
  const interConflict = detectInterBookConflict(claim.evidenceLinks);
  return computeStatusFromLinks({
    claim,
    links: claim.evidenceLinks,
    searchableBooksCount,
    interBookConflict: interConflict
  });
}
