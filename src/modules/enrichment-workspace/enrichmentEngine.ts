import { GapSeverity, TopicCoverageReport } from '../coverage-analyzer/types';
import {
  AcquiredTopicResource,
  ContentQualityReport,
  EnrichedSectionDraft,
  EnrichmentDepthLevel,
  EnrichmentOriginKind,
  EnrichmentSectionKey,
  ExamQuestionItem,
  LearningDomainMode,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusTopicNode
} from '../study-mode/types';
import {
  generateOptionalAiSectionDraft,
  OptionalAiConfig
} from './optionalAiService';
import {
  deduplicateLinesAgainstExisting,
  deduplicateProseAgainstExisting,
  validateEnrichmentQuality
} from './qualityValidator';
import { synthesizeLocalScientificDraft } from './scientificSynthesizer';
import {
  gapCategoryToEnrichmentSection,
  SectionAssessmentState
} from './sectionCatalog';
import { AttachableSourceCandidate } from './sourceAttachmentService';
import {
  PreloadedLibraryData,
  retrieveTextbookContextForTopic,
  TextbookSearchHit
} from './textbookSearchEngine';

export interface PrioritizedGapTarget {
  sectionKey: EnrichmentSectionKey;
  label: string;
  priorityRank: number;
  priorityTier: GapSeverity;
  status: SectionAssessmentState['status'];
  gapRationale: string;
  relatedP41Gaps: string[];
  recommendedDepth: EnrichmentDepthLevel;
}

export interface TopicEnrichmentPlan {
  hierarchyPath: string;
  topicId: string;
  subjectCode: string;
  domainMode: LearningDomainMode;
  applicableCount: number;
  incompleteCount: number;
  prioritizedGaps: PrioritizedGapTarget[];
  skippedNotApplicable: Array<{
    key: EnrichmentSectionKey;
    label: string;
    reason: string;
  }>;
}

export interface GeneratedEnrichmentResult {
  draft: EnrichedSectionDraft;
  qualityReport: ContentQualityReport;
  origin: EnrichmentOriginKind;
  modeUsed: 'local_engine' | 'optional_ai';
  generatorNote: string;
  warnings: string[];
  textbookHitsUsed: TextbookSearchHit[];
}

const CORE_SECTION_PRIORITY_WEIGHTS: Record<EnrichmentSectionKey, number> = {
  overview: 16,
  definition: 15,
  detailed_explanation: 14,
  mechanism_process: 13,
  core_concepts: 12,
  formulas_numericals: 12,
  pharmaceutical_relevance: 11,
  references: 11,
  examples_applications: 10,
  important_questions: 10,
  clinical_relevance: 9,
  classification_types: 8,
  components_structure: 8,
  advantages_comparisons: 7,
  practical_connections: 7,
  visual_connections: 6,
  exam_essentials: 6,
  learning_objectives: 4
};

const SEVERITY_WEIGHT: Record<GapSeverity, number> = {
  critical: 42,
  high: 30,
  medium: 18,
  low: 8
};

export function analyzeTopicForEnrichment(opts: {
  syllabus: SyllabusProfile;
  subject: SyllabusSubjectNode;
  topic: SyllabusTopicNode;
  sectionStates: SectionAssessmentState[];
  coverageReport?: TopicCoverageReport | null;
}): TopicEnrichmentPlan {
  const { syllabus, subject, topic, sectionStates, coverageReport } = opts;

  const subtopicsCount = topic.subtopics.length;
  const hierarchyPath = `${syllabus.course} → ${subject.code} (${subject.title}) → ${topic.unitNo}: ${topic.unitTitle} → ${topic.title} (${subtopicsCount} subtopic${
    subtopicsCount === 1 ? '' : 's'
  })`;

  const gapsBySection = new Map<EnrichmentSectionKey, { maxSeverity: GapSeverity; messages: string[] }>();

  const bumpGap = (key: EnrichmentSectionKey, severity: GapSeverity, message: string) => {
    const existing = gapsBySection.get(key);
    if (!existing) {
      gapsBySection.set(key, { maxSeverity: severity, messages: [message] });
      return;
    }
    const nextSev =
      SEVERITY_WEIGHT[severity] > SEVERITY_WEIGHT[existing.maxSeverity]
        ? severity
        : existing.maxSeverity;
    if (!existing.messages.includes(message)) {
      existing.messages.push(message);
    }
    gapsBySection.set(key, { maxSeverity: nextSev, messages: existing.messages });
  };

  for (const gap of coverageReport?.gaps || []) {
    const mappedKey = gapCategoryToEnrichmentSection(gap.category);
    bumpGap(mappedKey, gap.severity, gap.description || gap.title);
  }

  for (const comp of coverageReport?.componentChecks || []) {
    if (!comp.applicable || comp.status === 'present') continue;
    const matchSec = sectionStates.find(
      (s) => s.applicable && s.blueprint.componentCheckKey === comp.key
    );
    if (matchSec) {
      const sev: GapSeverity =
        comp.status === 'needs_review'
          ? 'critical'
          : comp.status === 'missing'
          ? 'high'
          : 'medium';
      bumpGap(matchSec.blueprint.key, sev, comp.evidence);
    }
  }

  const skippedNotApplicable = sectionStates
    .filter((s) => !s.applicable)
    .map((s) => ({
      key: s.blueprint.key,
      label: s.blueprint.label,
      reason: s.applicabilityReason
    }));

  const applicableStates = sectionStates.filter((s) => s.applicable);
  const incompleteStates = applicableStates.filter(
    (s) => s.status === 'missing' || s.status === 'partial' || s.status === 'needs_verification'
  );

  const scored = incompleteStates.map((st) => {
    const secKey = st.blueprint.key;
    const gapInfo = gapsBySection.get(secKey);
    const statusWeight =
      st.status === 'needs_verification' ? 32 : st.status === 'missing' ? 24 : 12;
    const severityWeight = gapInfo ? SEVERITY_WEIGHT[gapInfo.maxSeverity] : 8;
    const baseWeight = CORE_SECTION_PRIORITY_WEIGHTS[secKey] || 5;
    const score = statusWeight + severityWeight + baseWeight;

    const priorityTier: GapSeverity =
      st.status === 'needs_verification' || (gapInfo?.maxSeverity === 'critical')
        ? 'critical'
        : score >= 60 || st.status === 'missing'
        ? 'high'
        : score >= 40
        ? 'medium'
        : 'low';

    const rationale =
      gapInfo && gapInfo.messages.length > 0
        ? gapInfo.messages[0]
        : st.status === 'missing'
        ? `No baseline or enriched content exists yet for ${st.blueprint.label} in ${topic.title}.`
        : st.status === 'needs_verification'
        ? `${st.blueprint.label} is flagged for reference verification.`
        : `${st.blueprint.label} has partial baseline coverage (${st.existingProse.length + st.existingBullets.length} items) and needs structured B.Pharm depth.`;

    const recommendedDepth: EnrichmentDepthLevel =
      st.status === 'missing' && (secKey === 'overview' || secKey === 'definition')
        ? 'standard'
        : secKey === 'mechanism_process' || secKey === 'formulas_numericals' || secKey === 'advantages_comparisons'
        ? 'standard'
        : 'standard';

    return {
      score,
      target: {
        sectionKey: secKey,
        label: st.blueprint.label,
        priorityRank: 0,
        priorityTier,
        status: st.status,
        gapRationale: rationale,
        relatedP41Gaps: gapInfo?.messages || [],
        recommendedDepth
      } satisfies PrioritizedGapTarget
    };
  });

  scored.sort((a, b) => b.score - a.score || a.target.label.localeCompare(b.target.label));

  const prioritizedGaps = scored.map((item, idx) => ({
    ...item.target,
    priorityRank: idx + 1
  }));

  return {
    hierarchyPath,
    topicId: topic.id,
    subjectCode: subject.code,
    domainMode: topic.domainMode,
    applicableCount: applicableStates.length,
    incompleteCount: incompleteStates.length,
    prioritizedGaps,
    skippedNotApplicable
  };
}

export async function generateSectionEnrichmentDraft(opts: {
  syllabus: SyllabusProfile;
  subject: SyllabusSubjectNode;
  topic: SyllabusTopicNode;
  sectionState: SectionAssessmentState;
  depth: EnrichmentDepthLevel;
  mode: 'local_engine' | 'optional_ai';
  aiConfig?: OptionalAiConfig;
  attachCandidates: AttachableSourceCandidate[];
  acquiredResources: AcquiredTopicResource[];
  topicQuestions: ExamQuestionItem[];
  gapReason?: string;
  textbookHits?: TextbookSearchHit[];
  preloadedLibrary?: PreloadedLibraryData;
}): Promise<GeneratedEnrichmentResult> {
  const {
    syllabus,
    subject,
    topic,
    sectionState,
    depth,
    mode,
    aiConfig,
    attachCandidates,
    acquiredResources,
    topicQuestions,
    gapReason,
    preloadedLibrary
  } = opts;

  const existingTexts = [...sectionState.existingProse, ...sectionState.existingBullets];
  const secKey = sectionState.blueprint.key;

  // P4.2.3 Textbook-First Retrieval before drafting
  const textbookBundle = opts.textbookHits
    ? null
    : await retrieveTextbookContextForTopic(topic, preloadedLibrary).catch(() => null);
  const textbookHits = opts.textbookHits || textbookBundle?.hits || [];

  if (mode === 'optional_ai') {
    if (!aiConfig) {
      throw new Error('Optional AI configuration missing.');
    }
    const aiResult = await generateOptionalAiSectionDraft({
      config: aiConfig,
      topic,
      subject,
      section: sectionState.blueprint,
      existingContentSummary: existingTexts.join('\n'),
      depth,
      gapReason,
      textbookContext: textbookHits
    });

    const dedupedProse = deduplicateProseAgainstExisting(aiResult.prose, existingTexts);
    const dedupedBullets = deduplicateLinesAgainstExisting(aiResult.bullets, existingTexts);
    const origin: EnrichmentOriginKind = 'ai_draft';

    const bookAttachments = textbookHits.slice(0, 2).map((h) => ({
      id: `att_pdf_${h.bookId}_p${h.pageNumber}`,
      sourceKind: 'knowledge_pdf' as const,
      itemId: h.bookId,
      bookId: h.bookId,
      pageNumber: h.pageNumber,
      chapterHeading: h.chapterHeading,
      priorityTier: h.priorityTier,
      title: `${h.bookTitle} (p. ${h.pageNumber})`,
      subtitle: `PDF Textbook · Page ${h.pageNumber}${h.authors ? ` · ${h.authors}` : ''}`,
      verified: h.extractionQuality !== 'unsearchable',
      attachedAt: Date.now()
    }));

    const draft: EnrichedSectionDraft = {
      sectionKey: secKey,
      prose: dedupedProse || aiResult.prose,
      bullets: dedupedBullets.length > 0 ? dedupedBullets : aiResult.bullets,
      formulas: aiResult.formulas,
      comparisonTable: aiResult.comparisonTable,
      importantQuestions: [],
      isAiDraft: true,
      provenance: 'needs_verification',
      depth,
      origin,
      gapRationale: gapReason,
      attachments: bookAttachments,
      updatedAt: Date.now()
    };

    const qualityReport = validateEnrichmentQuality({
      topic,
      subject,
      blueprint: sectionState.blueprint,
      depth,
      prose: draft.prose,
      bullets: draft.bullets,
      formulas: draft.formulas,
      comparisonTable: draft.comparisonTable,
      importantQuestions: draft.importantQuestions,
      provenance: draft.provenance,
      attachments: draft.attachments,
      existingProse: sectionState.existingProse,
      existingBullets: sectionState.existingBullets
    });

    return {
      draft,
      qualityReport,
      origin,
      modeUsed: 'optional_ai',
      generatorNote: `Generated via optional BYOK AI (${aiResult.modelUsed}) at ${depth} depth${
        textbookHits.length > 0 ? ` grounded with ${textbookHits.length} textbook excerpt(s)` : ''
      }. Review claims in Textbook Verification before merging.`,
      warnings: aiResult.warnings,
      textbookHitsUsed: textbookHits
    };
  }

  // Deterministic Offline Scientific Content Synthesizer (grounded in textbookHits)
  const localPayload = synthesizeLocalScientificDraft({
    syllabus,
    subject,
    topic,
    sectionState,
    depth,
    attachCandidates,
    acquiredResources,
    topicQuestions,
    textbookHits
  });

  const hasVerifiedAttachments = localPayload.suggestedAttachments.some((a) => a.verified);
  const origin: EnrichmentOriginKind = hasVerifiedAttachments
    ? 'source_supported'
    : 'needs_verification';

  // Keep unreviewed draft provenance as 'needs_verification' until user reviews & accepts,
  // ensuring P4.1 completeness never auto-inflates from unreviewed generated drafts.
  const draft: EnrichedSectionDraft = {
    sectionKey: secKey,
    prose: localPayload.prose,
    bullets: localPayload.bullets,
    formulas: localPayload.formulas,
    comparisonTable: localPayload.comparisonTable,
    importantQuestions: localPayload.importantQuestions,
    isAiDraft: false,
    provenance: 'needs_verification',
    depth,
    origin,
    gapRationale: gapReason,
    attachments: localPayload.suggestedAttachments,
    updatedAt: Date.now()
  };

  const qualityReport = validateEnrichmentQuality({
    topic,
    subject,
    blueprint: sectionState.blueprint,
    depth,
    prose: draft.prose,
    bullets: draft.bullets,
    formulas: draft.formulas,
    comparisonTable: draft.comparisonTable,
    importantQuestions: draft.importantQuestions,
    provenance: draft.provenance,
    attachments: draft.attachments,
    existingProse: sectionState.existingProse,
    existingBullets: sectionState.existingBullets
  });

  return {
    draft,
    qualityReport,
    origin,
    modeUsed: 'local_engine',
    generatorNote: localPayload.sourceSupportNote,
    warnings:
      textbookHits.length > 0
        ? [
            `Grounded with ${textbookHits.length} textbook passage(s) from Knowledge Library. Run Claim Verification before final acceptance.`
          ]
        : hasVerifiedAttachments
        ? [
            'Draft synthesized from PharmaLab curriculum context and matched sources. Upload PDF textbooks or inspect claims in Textbook Verification before merging.'
          ]
        : [
            'No verified section-specific textbook passage matched automatically; marked Needs Verification until you attach a textbook, PDF, or Reference Center source.'
          ],
    textbookHitsUsed: textbookHits
  };
}

export async function generateBatchSectionDrafts(opts: {
  syllabus: SyllabusProfile;
  subject: SyllabusSubjectNode;
  topic: SyllabusTopicNode;
  sectionStates: SectionAssessmentState[];
  targetKeys: EnrichmentSectionKey[];
  depth: EnrichmentDepthLevel;
  attachCandidates: AttachableSourceCandidate[];
  acquiredResources: AcquiredTopicResource[];
  topicQuestions: ExamQuestionItem[];
  gapRationales?: Partial<Record<EnrichmentSectionKey, string>>;
  preloadedLibrary?: PreloadedLibraryData;
}): Promise<GeneratedEnrichmentResult[]> {
  const sharedBundle = await retrieveTextbookContextForTopic(
    opts.topic,
    opts.preloadedLibrary
  ).catch(() => null);
  const results: GeneratedEnrichmentResult[] = [];
  for (const key of opts.targetKeys) {
    const state = opts.sectionStates.find((s) => s.blueprint.key === key && s.applicable);
    if (!state) continue;
    const res = await generateSectionEnrichmentDraft({
      syllabus: opts.syllabus,
      subject: opts.subject,
      topic: opts.topic,
      sectionState: state,
      depth: opts.depth,
      mode: 'local_engine',
      attachCandidates: opts.attachCandidates,
      acquiredResources: opts.acquiredResources,
      topicQuestions: opts.topicQuestions,
      gapReason: opts.gapRationales?.[key],
      textbookHits: sharedBundle?.hits || []
    });
    results.push(res);
  }
  return results;
}
