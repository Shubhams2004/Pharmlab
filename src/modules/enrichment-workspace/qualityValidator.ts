import {
  ContentQualityCheckItem,
  ContentQualityReport,
  EnrichmentComparisonTable,
  EnrichmentDepthLevel,
  EnrichmentProvenance,
  EnrichmentQuestionEntry,
  EnrichmentSourceAttachment,
  SyllabusSubjectNode,
  SyllabusTopicNode
} from '../study-mode/types';
import { EnrichmentSectionBlueprint } from './sectionCatalog';

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'among', 'analysis', 'basic', 'basics', 'between',
  'clinical', 'concepts', 'course', 'detailed', 'drug', 'drugs', 'during',
  'effects', 'essential', 'examples', 'explanation', 'following', 'forms',
  'general', 'important', 'including', 'introduction', 'methods', 'overview',
  'pharmaceutical', 'pharmacy', 'principles', 'process', 'properties', 'related',
  'relevance', 'roles', 'section', 'semester', 'should', 'study', 'system',
  'systems', 'their', 'these', 'through', 'topic', 'types', 'under', 'unit',
  'using', 'various', 'which', 'within', 'without'
]);

export function normalizeSentence(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTopicTokens(topic: SyllabusTopicNode, subject: SyllabusSubjectNode): string[] {
  const raw = [
    topic.title,
    topic.unitTitle,
    subject.title,
    ...topic.keywords,
    ...topic.subtopics.map((st) => `${st.title} ${st.summary || ''}`)
  ]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  return Array.from(new Set(raw));
}

function extractSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 18);
}

function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeSentence(a).split(' ').filter((w) => w.length >= 3));
  const wordsB = new Set(normalizeSentence(b).split(' ').filter((w) => w.length >= 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection += 1;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function deduplicateLinesAgainstExisting(
  candidateLines: string[],
  existingTexts: string[],
  threshold = 0.72
): string[] {
  const normalizedExisting = existingTexts.map((t) => normalizeSentence(t)).filter(Boolean);
  const kept: string[] = [];
  for (const line of candidateLines) {
    const clean = line.trim();
    if (!clean) continue;
    const norm = normalizeSentence(clean);
    if (!norm) continue;
    const isDupExisting = normalizedExisting.some(
      (ex) => ex === norm || (norm.length >= 24 && ex.includes(norm)) || jaccardSimilarity(norm, ex) >= threshold
    );
    const isDupSelf = kept.some((prev) => jaccardSimilarity(prev, clean) >= 0.82);
    if (!isDupExisting && !isDupSelf) {
      kept.push(clean);
    }
  }
  return kept;
}

export function deduplicateProseAgainstExisting(
  prose: string,
  existingTexts: string[],
  threshold = 0.78
): string {
  const paragraphs = prose
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const existingSentences = existingTexts.flatMap((t) => extractSentences(t));

  const cleanedParagraphs = paragraphs
    .map((para) => {
      const sentences = extractSentences(para);
      if (sentences.length === 0) return para;
      const unique = sentences.filter((sent) => {
        const norm = normalizeSentence(sent);
        return !existingSentences.some(
          (ex) =>
            normalizeSentence(ex) === norm || jaccardSimilarity(sent, ex) >= threshold
        );
      });
      return unique.join(' ');
    })
    .filter((p) => p.trim().length > 0);

  return cleanedParagraphs.join('\n\n').trim();
}

export interface ValidateEnrichmentQualityInput {
  topic: SyllabusTopicNode;
  subject: SyllabusSubjectNode;
  blueprint: EnrichmentSectionBlueprint;
  depth: EnrichmentDepthLevel;
  prose: string;
  bullets: string[];
  formulas: string[];
  comparisonTable?: EnrichmentComparisonTable;
  importantQuestions: EnrichmentQuestionEntry[];
  provenance: EnrichmentProvenance;
  attachments: EnrichmentSourceAttachment[];
  existingProse: string[];
  existingBullets: string[];
}

export function validateEnrichmentQuality(
  input: ValidateEnrichmentQualityInput
): ContentQualityReport {
  const {
    topic,
    subject,
    blueprint,
    depth,
    prose,
    bullets,
    formulas,
    comparisonTable,
    importantQuestions,
    provenance,
    attachments,
    existingProse,
    existingBullets
  } = input;

  const tableText = comparisonTable
    ? `${comparisonTable.caption || ''} ${comparisonTable.headers.join(' ')} ${comparisonTable.rows
        .map((r) => r.join(' '))
        .join(' ')}`
    : '';
  const questionText = importantQuestions
    .map((q) => `${q.prompt} ${q.answerGuidance}`)
    .join(' ');
  const combinedText = `${prose}\n${bullets.join('\n')}\n${formulas.join('\n')}\n${tableText}\n${questionText}`.trim();
  const lower = combinedText.toLowerCase();
  const proseChars = prose.trim().length;
  const totalContentChars = combinedText.length;

  const checks: ContentQualityCheckItem[] = [];

  // 1. Scientific Relevance
  const tokens = buildTopicTokens(topic, subject);
  const matchedTokens = tokens.filter((t) => lower.includes(t));
  const relevanceRatio = tokens.length > 0 ? matchedTokens.length / Math.min(tokens.length, 6) : 1;
  checks.push({
    key: 'scientific_relevance',
    label: 'Topic & Subject Relevance',
    status:
      totalContentChars < 20
        ? 'attention_needed'
        : matchedTokens.length >= 2 || relevanceRatio >= 0.4
        ? 'pass'
        : 'warning',
    finding:
      totalContentChars < 20
        ? 'Insufficient content entered to evaluate topic alignment.'
        : `Matches ${matchedTokens.length} core topic/subtopic term(s) for ${subject.code}.`,
    suggestion:
      matchedTokens.length < 2
        ? `Explicitly connect explanation to "${topic.title}" and its syllabus subtopics.`
        : undefined
  });

  // 2. Section Completeness
  let sectionCompleteStatus: ContentQualityCheckItem['status'] = 'pass';
  let sectionCompleteMsg = `${blueprint.label} contains structured content matching section expectations.`;
  let sectionCompleteHint: string | undefined;

  if (blueprint.key === 'formulas_numericals') {
    if (formulas.length === 0 && !/[=×÷/]/.test(combinedText)) {
      sectionCompleteStatus = 'attention_needed';
      sectionCompleteMsg = 'No explicit equations or worked calculation steps detected.';
      sectionCompleteHint = 'Add at least one formula with variable definitions and a worked numerical.';
    }
  } else if (blueprint.key === 'important_questions') {
    if (importantQuestions.length === 0 && bullets.length < 2) {
      sectionCompleteStatus = 'attention_needed';
      sectionCompleteMsg = 'No structured assessment or viva questions authored yet.';
      sectionCompleteHint = 'Add exam/viva prompts with concise answer guidance.';
    }
  } else if (blueprint.key === 'advantages_comparisons') {
    const hasTable = Boolean(comparisonTable && comparisonTable.rows.length >= 2);
    if (!hasTable && bullets.length < 2 && proseChars < 80) {
      sectionCompleteStatus = 'warning';
      sectionCompleteMsg = 'Comparison section benefits from parallel pros/cons points or a comparison table.';
      sectionCompleteHint = 'Add contrasting bullets or populate the comparison table rows.';
    }
  } else if (blueprint.key === 'definition') {
    if (proseChars < 45 && bullets.length === 0) {
      sectionCompleteStatus = 'attention_needed';
      sectionCompleteMsg = 'Formal definition is missing or too brief.';
      sectionCompleteHint = 'Provide a clear, unambiguous scientific/pharmacopoeial definition.';
    }
  } else if (proseChars < 50 && bullets.length < 2) {
    sectionCompleteStatus = 'attention_needed';
    sectionCompleteMsg = 'Section needs fuller prose or structured points.';
    sectionCompleteHint = `Expand ${blueprint.label.toLowerCase()} so learners have actionable coverage.`;
  }

  checks.push({
    key: 'section_completeness',
    label: 'Section Completeness',
    status: sectionCompleteStatus,
    finding: sectionCompleteMsg,
    suggestion: sectionCompleteHint
  });

  // 3. Explanation Depth vs Selected Target Depth
  const depthTargets: Record<EnrichmentDepthLevel, { minChars: number; minPoints: number; label: string }> = {
    foundation: { minChars: 90, minPoints: 2, label: 'Foundation' },
    standard: { minChars: 200, minPoints: 3, label: 'Standard (B.Pharm)' },
    advanced: { minChars: 340, minPoints: 4, label: 'Advanced' }
  };
  const target = depthTargets[depth];
  const pointTotal = bullets.length + formulas.length + importantQuestions.length + (comparisonTable?.rows.length || 0);
  const meetsDepth = totalContentChars >= target.minChars && pointTotal >= Math.max(1, target.minPoints - 1);
  checks.push({
    key: 'explanation_depth',
    label: `Depth Calibration (${target.label})`,
    status:
      totalContentChars < 40
        ? 'attention_needed'
        : meetsDepth
        ? 'pass'
        : 'warning',
    finding: `${totalContentChars} chars and ${pointTotal} structured element(s) against ${target.label} target (≥${target.minChars} chars).`,
    suggestion: meetsDepth
      ? undefined
      : `Add deeper ${depth === 'advanced' ? 'mechanistic, analytical tolerance, or clinical detail' : 'explanatory detail or examples'} for ${target.label} level.`
  });

  // 4. Terminology Consistency
  const hasPlaceholderMarker = /\[(verify|todo|tbd|insert|check)[^\]]*\]/i.test(combinedText);
  const informalWords = /\b(stuff|things|basically|kinda|sort of|etc\.\s*etc\.)\b/i.test(combinedText);
  checks.push({
    key: 'terminology_consistency',
    label: 'Terminology & Editorial Clarity',
    status: hasPlaceholderMarker ? 'warning' : informalWords ? 'warning' : 'pass',
    finding: hasPlaceholderMarker
      ? 'Contains [VERIFY] placeholder marker requiring confirmation against textbook/pharmacopoeia.'
      : informalWords
      ? 'Contains informal phrasing; replace with precise pharmaceutical terminology.'
      : 'Uses consistent university-grade academic terminology without unresolved placeholders.',
    suggestion: hasPlaceholderMarker
      ? 'Confirm bracketed placeholders against an official textbook or pharmacopoeia before final merge.'
      : undefined
  });

  // 5. Duplicate Content Check against Existing Baseline
  const existingSentences = [...existingProse, ...existingBullets].flatMap((t) =>
    extractSentences(t).concat(t.length >= 15 ? [t] : [])
  );
  const candidateSentences = [...extractSentences(prose), ...bullets];
  let duplicateHits = 0;
  for (const cand of candidateSentences) {
    if (existingSentences.some((ex) => jaccardSimilarity(cand, ex) >= 0.72)) {
      duplicateHits += 1;
    }
  }
  const dupRatio = candidateSentences.length > 0 ? duplicateHits / candidateSentences.length : 0;
  checks.push({
    key: 'duplicate_content',
    label: 'Non-Duplication Check',
    status: dupRatio >= 0.35 ? 'warning' : 'pass',
    finding:
      duplicateHits > 0
        ? `${duplicateHits} of ${candidateSentences.length} sentence(s)/point(s) closely resemble existing topic content.`
        : 'Adds net-new explanatory content without repeating existing catalog/syllabus lines.',
    suggestion:
      dupRatio >= 0.35
        ? 'Trim repeated baseline phrases and focus on missing details.'
        : undefined
  });

  // 6. Unsupported Claims / Citation Fabrication Guard
  const looksLikeSpecificCitation =
    /\b(doi:\s*10\.\d+|isbn\s*[:\d-]+|et al\.|journal of|pp?\.\s*\d{2,4}|\b10\.\d{4}\/\S+)/i.test(
      combinedText
    );
  const absoluteClaim = /\b(100%\s*(effective|cure|safe)|zero side effects|always cures|never fails)\b/i.test(
    combinedText
  );
  const verifiedAttachmentsCount = attachments.filter((a) => a.verified).length;
  let claimStatus: ContentQualityCheckItem['status'] = 'pass';
  let claimFinding = 'No fabricated citations or absolute unsupported therapeutic claims detected.';
  let claimSuggestion: string | undefined;

  if (absoluteClaim) {
    claimStatus = 'attention_needed';
    claimFinding = 'Contains absolute therapeutic/efficacy phrasing ("100%", "always", "never fails").';
    claimSuggestion = 'Qualify biological/pharmaceutical statements accurately with physiological bounds or conditions.';
  } else if (looksLikeSpecificCitation && verifiedAttachmentsCount === 0) {
    claimStatus = 'warning';
    claimFinding = 'Inline citation markers (et al./DOI/page numbers) appear without an attached PharmaLab source.';
    claimSuggestion = 'Attach the real monograph, PDF textbook, or Resource Hub record in Provenance & Sources.';
  }
  checks.push({
    key: 'unsupported_claims',
    label: 'Claim & Citation Safeguard',
    status: claimStatus,
    finding: claimFinding,
    suggestion: claimSuggestion
  });

  // 7. Missing Formulas, Units, or Quantitative Explanations
  const needsFormulaCheck =
    blueprint.key === 'formulas_numericals' ||
    /\b(titration|assay|limit test|buffer|ph|posology|alligation|isotonic|pharmacokinetic|clearance|half-life|concentration|molarity|normality|stomatal|swelling|ash|cardiac output|gfr)\b/.test(
      `${topic.title} ${topic.summary}`.toLowerCase()
    );
  const hasFormulaSyntax =
    formulas.length > 0 ||
    (/[=]/.test(combinedText) &&
      /\b(mg|ml|g|kg|l|mol|m|n|%|ppm|ph|meq|mmhg|bpm|min|hr|h|years|months|k|c)\b/i.test(
        combinedText
      ));
  checks.push({
    key: 'formulas_units',
    label: 'Formulas & Units Check',
    status:
      blueprint.key === 'formulas_numericals' && !hasFormulaSyntax
        ? 'attention_needed'
        : needsFormulaCheck && !hasFormulaSyntax && blueprint.key === 'detailed_explanation'
        ? 'warning'
        : 'pass',
    finding: hasFormulaSyntax
      ? 'Quantitative relationship(s) and SI/pharmaceutical units detected.'
      : needsFormulaCheck
      ? 'Quantitative topic context detected without explicit units/equations in this section.'
      : 'No mandatory mathematical equation required for this section.',
    suggestion:
      needsFormulaCheck && !hasFormulaSyntax
        ? 'Specify governing equation(s), variable symbols, and units (e.g., mg, mL, mol/L, ppm).'
        : undefined
  });

  // 8. Pharmaceutical Relevance
  const pharmaCue = /\b(drug|dosage|formulation|tablet|capsule|syrup|solution|pharmacopoe|ip|bp|usp|bioavailability|stability|excipient|therapeutic|toxicity|clinical|patient|assay|purity|limit|steril|antacid|buffer|crude|alkaloid|glycoside|pharmac|python|data)\b/i.test(
    combinedText
  );
  checks.push({
    key: 'pharmaceutical_relevance',
    label: 'Pharmaceutical Context',
    status: pharmaCue ? 'pass' : 'warning',
    finding: pharmaCue
      ? 'Connects concepts clearly to pharmaceutical sciences / B.Pharm practice.'
      : 'Limited explicit pharmaceutical or clinical framing detected.',
    suggestion: pharmaCue
      ? undefined
      : 'State how this concept applies to formulation, drug action, analysis, or patient care.'
  });

  // 9. Source Attribution
  let sourceStatus: ContentQualityCheckItem['status'] = 'pass';
  let sourceFinding = `${attachments.length} verified source attachment(s) linked (${provenance.replace('_', ' ')}).`;
  let sourceSuggestion: string | undefined;

  if (provenance === 'needs_verification') {
    sourceStatus = 'attention_needed';
    sourceFinding = 'Marked "Needs Verification" — Coverage Analyzer will flag this section for review.';
    sourceSuggestion = 'Verify content against a textbook/pharmacopoeia and attach sources before finalizing.';
  } else if (attachments.length === 0) {
    sourceStatus = 'warning';
    sourceFinding = 'No PharmaLab Reference Center, PDF Library, Visual, or Resource Hub source attached yet.';
    sourceSuggestion = 'Attach at least one verified PharmaLab source below to upgrade provenance to Reference-Supported.';
  }
  checks.push({
    key: 'source_attribution',
    label: 'Source Attribution',
    status: sourceStatus,
    finding: sourceFinding,
    suggestion: sourceSuggestion
  });

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const attentionCount = checks.filter((c) => c.status === 'attention_needed').length;

  return {
    checkedAt: Date.now(),
    depth,
    checks,
    passCount,
    warningCount,
    attentionCount,
    disclaimer:
      'Heuristic quality indicators assist editorial review and do not constitute scientific or peer-reviewed verification.'
  };
}
