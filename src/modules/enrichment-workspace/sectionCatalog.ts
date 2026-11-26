import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import {
  ENGINE_SUBTOPICS,
  ENGINE_TOPICS,
  TEXTBOOK_REFERENCES
} from '../../data/academicEngineRegistry';
import { assessTopicApplicability } from '../coverage-analyzer/applicability';
import { ComponentCheckKey, TopicCoverageReport } from '../coverage-analyzer/types';
import {
  AcquiredTopicResource,
  EnrichedSectionEntry,
  EnrichmentProvenance,
  EnrichmentSectionKey,
  ExamQuestionItem,
  StudySectionKey,
  SyllabusSubjectNode,
  SyllabusTopicNode,
  TopicEnrichmentRecord
} from '../study-mode/types';

export interface EnrichmentSectionBlueprint {
  key: EnrichmentSectionKey;
  label: string;
  shortLabel: string;
  description: string;
  authoringPrompt: string;
  componentCheckKey: ComponentCheckKey;
  studySectionKey: StudySectionKey;
  supportsFormulas?: boolean;
  supportsQuestions?: boolean;
}

export const ENRICHMENT_SECTION_BLUEPRINTS: EnrichmentSectionBlueprint[] = [
  {
    key: 'learning_objectives',
    label: 'Learning Objectives',
    shortLabel: 'Objectives',
    description: 'Competency targets, Bloom-level action verbs, and syllabus outcome alignment.',
    authoringPrompt:
      'List measurable learning objectives aligned with the PCI B.Pharm syllabus unit and course outcomes.',
    componentCheckKey: 'learning_objectives',
    studySectionKey: 'fundamentals'
  },
  {
    key: 'definition',
    label: 'Definition',
    shortLabel: 'Definition',
    description: 'Formal, unambiguous scientific/pharmacopoeial definition of core entities or terms.',
    authoringPrompt:
      'Write concise textbook-accurate formal definitions for the primary concept(s) and key terms.',
    componentCheckKey: 'definitions',
    studySectionKey: 'definition'
  },
  {
    key: 'overview',
    label: 'Introduction and Overview',
    shortLabel: 'Overview',
    description: 'Conceptual scope, biological or pharmaceutical context, and unit roadmap.',
    authoringPrompt:
      'Provide a cohesive multi-sentence introduction situating this topic within pharmaceutical sciences.',
    componentCheckKey: 'topic_overview',
    studySectionKey: 'overview'
  },
  {
    key: 'core_concepts',
    label: 'Core Concepts',
    shortLabel: 'Core Concepts',
    description: 'Foundational principles, subtopic pillars, and conceptual relationships.',
    authoringPrompt:
      'Break down the essential principles and subtopics students must master before detailed mechanisms.',
    componentCheckKey: 'core_concepts',
    studySectionKey: 'important_concepts'
  },
  {
    key: 'detailed_explanation',
    label: 'Detailed Explanation',
    shortLabel: 'Explanation',
    description: 'In-depth academic prose progressing from foundational concepts to applied mastery.',
    authoringPrompt:
      'Develop a clear, structured academic explanation covering every syllabus subtopic without fluff.',
    componentCheckKey: 'detailed_explanation',
    studySectionKey: 'explanation'
  },
  {
    key: 'mechanism_process',
    label: 'Mechanism / Process',
    shortLabel: 'Mechanism',
    description: 'Physiological pathway, chemical reaction mechanism, assay sequence, or computational workflow.',
    authoringPrompt:
      'Detail step-by-step pathways, reaction steps, physiological control loops, or analytical procedures.',
    componentCheckKey: 'mechanism_process',
    studySectionKey: 'mechanism'
  },
  {
    key: 'classification_types',
    label: 'Classification / Types',
    shortLabel: 'Classification',
    description: 'Taxonomic classes, pharmacopoeial grades, dosage-form categories, or drug classes.',
    authoringPrompt:
      'Organize classes, subtypes, or categories clearly with defining criteria and representative examples.',
    componentCheckKey: 'core_concepts',
    studySectionKey: 'classification'
  },
  {
    key: 'components_structure',
    label: 'Components and Structure',
    shortLabel: 'Structure',
    description: 'Anatomical layers, histological features, apparatus parts, excipients, or data schema.',
    authoringPrompt:
      'Itemize each anatomical, chemical, structural, or instrument component alongside its specific role.',
    componentCheckKey: 'structures_components',
    studySectionKey: 'components'
  },
  {
    key: 'examples_applications',
    label: 'Examples and Applications',
    shortLabel: 'Examples',
    description: 'Representative drugs, crude drugs, chemical reagents, formulations, or worked use cases.',
    authoringPrompt:
      'Include concrete official examples (IP/BP drugs, plants, clinical scenarios, or code patterns).',
    componentCheckKey: 'examples',
    studySectionKey: 'examples'
  },
  {
    key: 'pharmaceutical_relevance',
    label: 'Pharmaceutical Relevance',
    shortLabel: 'Pharma Relevance',
    description: 'Formulation impact, bioavailability, stability, quality control, and pharmacopoeial role.',
    authoringPrompt:
      'Explain how this topic directly governs drug formulation, stability, compounding, or QC testing.',
    componentCheckKey: 'pharmaceutical_relevance',
    studySectionKey: 'pharmaceutical_relevance'
  },
  {
    key: 'clinical_relevance',
    label: 'Clinical Relevance',
    shortLabel: 'Clinical Relevance',
    description: 'Pathophysiological disorders, therapeutic rationale, toxicities, and patient counseling.',
    authoringPrompt:
      'Document clinical implications, therapeutic monitoring, adverse effects, or patient-care significance.',
    componentCheckKey: 'clinical_relevance',
    studySectionKey: 'clinical_significance'
  },
  {
    key: 'advantages_comparisons',
    label: 'Advantages, Limitations and Comparisons',
    shortLabel: 'Comparisons',
    description: 'Trade-offs, method comparisons, selection criteria, and contraindications.',
    authoringPrompt:
      'Compare competing methods, excipients, dosage forms, or analytical techniques with clear pros and cons.',
    componentCheckKey: 'detailed_explanation',
    studySectionKey: 'advantages_limitations'
  },
  {
    key: 'formulas_numericals',
    label: 'Formulas and Numerical Applications',
    shortLabel: 'Formulas',
    description: 'Governing equations, units, assay equivalence factors, and step-by-step worked numericals.',
    authoringPrompt:
      'State exact equations with variable definitions/units and include at least one worked numerical example.',
    componentCheckKey: 'formulas_calculations',
    studySectionKey: 'explanation',
    supportsFormulas: true
  },
  {
    key: 'exam_essentials',
    label: 'Exam Essentials',
    shortLabel: 'Exam Essentials',
    description: 'High-yield revision bullets, viva points, common distractors, and key constants.',
    authoringPrompt:
      'Summarize high-yield facts, critical constants, and distinction points frequently tested in exams/viva.',
    componentCheckKey: 'exam_essentials',
    studySectionKey: 'exam_essentials'
  },
  {
    key: 'important_questions',
    label: 'Important Questions',
    shortLabel: 'Questions',
    description: 'University-style MCQs, short answers (2/5 marks), long essays (10 marks), and viva prompts.',
    authoringPrompt:
      'Author well-structured exam questions with accurate answer guidance (can be saved to Exam Prep).',
    componentCheckKey: 'assessment_questions',
    studySectionKey: 'exam_essentials',
    supportsQuestions: true
  },
  {
    key: 'practical_connections',
    label: 'Practical / Laboratory Connections',
    shortLabel: 'Practicals',
    description: 'Hands-on lab procedures, apparatus setup, safety precautions, and simulation alignment.',
    authoringPrompt:
      'Connect theory to specific PharmaLab practical experiments, apparatus handling, and bench observations.',
    componentCheckKey: 'experiments_practical',
    studySectionKey: 'applications'
  },
  {
    key: 'visual_connections',
    label: 'Visual Learning Connections',
    shortLabel: 'Visuals',
    description: 'Annotated diagrams, microscopy plates, plots, and 3D anatomical/apparatus models.',
    authoringPrompt:
      'Describe key visual landmarks and attach matching Visual Library plates or 3D models.',
    componentCheckKey: 'visual_resources',
    studySectionKey: 'structure'
  },
  {
    key: 'references',
    label: 'References',
    shortLabel: 'References',
    description: 'Verified textbooks, pharmacopoeial monographs (IP/BP/USP), and open-access literature.',
    authoringPrompt:
      'Attach real PharmaLab Reference Center, PDF Library, or verified open-textbook citations (never fabricate DOIs).',
    componentCheckKey: 'references',
    studySectionKey: 'references'
  }
];

export const ENRICHMENT_BLUEPRINT_MAP: Record<EnrichmentSectionKey, EnrichmentSectionBlueprint> =
  ENRICHMENT_SECTION_BLUEPRINTS.reduce(
    (acc, bp) => {
      acc[bp.key] = bp;
      return acc;
    },
    {} as Record<EnrichmentSectionKey, EnrichmentSectionBlueprint>
  );

export const PROVENANCE_LABELS: Record<
  EnrichmentProvenance,
  { label: string; toneClass: string; description: string }
> = {
  reference_supported: {
    label: 'Reference-Supported',
    toneClass: 'text-emerald-700 dark:text-emerald-400',
    description: 'Backed by attached textbook, pharmacopoeia, or verified academic citation.'
  },
  ai_verified: {
    label: 'Verified Enrichment',
    toneClass: 'text-teal-700 dark:text-teal-400',
    description: 'AI-assisted draft thoroughly reviewed, edited, and verified with sources by user.'
  },
  user_written: {
    label: 'User-Written',
    toneClass: 'text-amber-700 dark:text-amber-400',
    description: 'Authored directly by learner/faculty; attach authoritative references for full verification.'
  },
  needs_verification: {
    label: 'Needs Verification',
    toneClass: 'text-sky-700 dark:text-sky-400',
    description: 'Flagged for textbook/reference verification before treating as complete.'
  }
};

export interface SectionAssessmentState {
  blueprint: EnrichmentSectionBlueprint;
  applicable: boolean;
  applicabilityReason: string;
  existingProse: string[];
  existingBullets: string[];
  existingSourcesCount: number;
  approvedEntry?: EnrichedSectionEntry;
  hasUnsavedDraft: boolean;
  isAiDraftPending: boolean;
  status: 'complete' | 'partial' | 'missing' | 'needs_verification' | 'not_applicable';
  statusLabel: string;
}

export function componentKeyToDefaultEnrichmentSection(
  compKey?: ComponentCheckKey | null
): EnrichmentSectionKey {
  if (!compKey) return 'detailed_explanation';
  const hit = ENRICHMENT_SECTION_BLUEPRINTS.find((b) => b.componentCheckKey === compKey);
  return hit ? hit.key : 'detailed_explanation';
}

export function gapCategoryToEnrichmentSection(category?: string | null): EnrichmentSectionKey {
  switch (category) {
    case 'missing_content':
      return 'overview';
    case 'weak_content':
      return 'detailed_explanation';
    case 'missing_references':
      return 'references';
    case 'missing_visuals':
    case 'missing_microscopy':
    case 'missing_3d':
      return 'visual_connections';
    case 'missing_experiments':
    case 'missing_simulations':
      return 'practical_connections';
    case 'missing_assessments':
    case 'missing_pyq':
      return 'important_questions';
    case 'hierarchy_incomplete':
      return 'core_concepts';
    case 'verification_issue':
      return 'references';
    default:
      return 'detailed_explanation';
  }
}

export function assessEnrichmentSections(opts: {
  topic: SyllabusTopicNode;
  subject: SyllabusSubjectNode;
  acquiredResources: AcquiredTopicResource[];
  topicQuestions: ExamQuestionItem[];
  coverageReport?: TopicCoverageReport | null;
  enrichmentRecord?: TopicEnrichmentRecord | null;
}): SectionAssessmentState[] {
  const {
    topic,
    subject,
    acquiredResources,
    topicQuestions,
    coverageReport,
    enrichmentRecord
  } = opts;

  const applicability = assessTopicApplicability(topic, subject);
  const hay = `${topic.subjectCode} ${topic.title} ${topic.summary} ${topic.keywords.join(' ')}`.toLowerCase();

  const structIds = new Set<string>(topic.linkedStructureIds || []);
  topic.subtopics.forEach((st) => {
    if (st.linkedStructureId) structIds.add(st.linkedStructureId);
  });
  const linkedAnatomy = ANATOMY_CATALOG.filter((a) => structIds.has(a.id));

  const engineSubIds = new Set<string>(
    (topic.linkedEngineTopicId && ENGINE_TOPICS[topic.linkedEngineTopicId]?.subtopicIds) || []
  );
  topic.subtopics.forEach((st) => {
    if (st.linkedSubtopicId) engineSubIds.add(st.linkedSubtopicId);
  });
  const linkedEngineSubs = Array.from(engineSubIds)
    .map((id) => ENGINE_SUBTOPICS[id])
    .filter(Boolean);

  const engineRefIds = new Set<string>(
    (topic.linkedEngineTopicId && ENGINE_TOPICS[topic.linkedEngineTopicId]?.textbookRefIds) || []
  );
  linkedAnatomy.forEach((a) => a.textbookRefIds.forEach((id) => engineRefIds.add(id)));
  linkedEngineSubs.forEach((s) => s.textbookRefIds.forEach((id) => engineRefIds.add(id)));
  const engineRefs = Array.from(engineRefIds)
    .map((id) => TEXTBOOK_REFERENCES[id])
    .filter(Boolean);

  const primaryStruct = linkedAnatomy[0];
  const primaryEngine = linkedEngineSubs[0];

  return ENRICHMENT_SECTION_BLUEPRINTS.map((blueprint) => {
    const compApp = applicability.components[blueprint.componentCheckKey];
    let applicable = compApp.applicable;
    let applicabilityReason = compApp.reason;

    if (blueprint.key === 'classification_types') {
      const hasClassificationCue =
        /\b(classif|types|categories|kinds|system|dosage form|hormone|tissue|bone|joint|receptor|buffer|antacid|cathartic|crude drug|preparation|operator|data type)\b/.test(
          hay
        ) || topic.recommendedSections.includes('classification');
      if (!hasClassificationCue && topic.domainMode === 'psychology_comm' && !/\b(stress|attitude|conflict|communication)\b/.test(hay)) {
        applicable = false;
        applicabilityReason = 'Topic does not center on a formal taxonomic classification.';
      }
    }

    if (blueprint.key === 'advantages_comparisons') {
      const hasComparisonCue =
        /\b(compar|vs|versus|advantage|disadvantage|limitation|merit|demerit|method|technique|dosage|route|system|approach|test|assay|dataframe|list|tuple|dict)\b/.test(
          hay
        ) || topic.recommendedSections.includes('advantages_limitations');
      if (!hasComparisonCue && topic.domainMode === 'anatomy_physiology') {
        applicable = false;
        applicabilityReason = 'Pure structural anatomy topic — pros/cons comparison optional.';
      }
    }

    const existingProse: string[] = [];
    const existingBullets: string[] = [];
    let existingSourcesCount = 0;

    switch (blueprint.key) {
      case 'learning_objectives':
        subject.objectives.forEach((o) => existingBullets.push(o));
        subject.outcomes.forEach((co) => existingBullets.push(`CO${co.no}: ${co.statement}`));
        break;
      case 'definition':
        if (primaryStruct?.definition) existingProse.push(primaryStruct.definition);
        acquiredResources
          .filter((r) => r.suggestedSection === 'definition' && r.excerpt)
          .forEach((r) => existingProse.push(r.excerpt!));
        break;
      case 'overview':
        if (primaryStruct?.overview) existingProse.push(primaryStruct.overview);
        else if (primaryEngine?.summary) existingProse.push(primaryEngine.summary);
        else if (topic.summary && topic.summary !== topic.title) existingProse.push(topic.summary);
        break;
      case 'core_concepts':
      case 'classification_types':
        topic.subtopics.forEach((st) =>
          existingBullets.push(
            st.summary && st.summary !== st.title ? `${st.title}: ${st.summary}` : st.title
          )
        );
        break;
      case 'detailed_explanation':
      case 'advantages_comparisons':
        if (primaryEngine?.anatomyNotes) existingProse.push(primaryEngine.anatomyNotes);
        acquiredResources
          .filter((r) => (r.suggestedSection === 'explanation' || r.resourceKind === 'textbook_chapter') && r.excerpt)
          .slice(0, 3)
          .forEach((r) => existingProse.push(`${r.title}: ${r.excerpt}`));
        break;
      case 'mechanism_process':
        if (primaryStruct?.physiology) existingProse.push(primaryStruct.physiology);
        if (primaryEngine?.physiologyNotes) existingProse.push(primaryEngine.physiologyNotes);
        break;
      case 'components_structure':
        if (primaryStruct?.structure) existingProse.push(primaryStruct.structure);
        if (primaryEngine?.structureNotes) existingProse.push(primaryEngine.structureNotes);
        primaryStruct?.components.forEach((c) => existingBullets.push(`${c.name}: ${c.role}`));
        break;
      case 'examples_applications':
        primaryStruct?.functions.forEach((f) => existingBullets.push(f));
        break;
      case 'pharmaceutical_relevance':
        primaryStruct?.pharmaceuticalRelevance.forEach((p) => existingBullets.push(p));
        break;
      case 'clinical_relevance':
        primaryStruct?.clinicalSignificance.forEach((c) => existingBullets.push(c));
        break;
      case 'formulas_numericals': {
        const compCheck = coverageReport?.componentChecks.find(
          (c) => c.key === 'formulas_calculations'
        );
        if (compCheck && compCheck.status === 'present') {
          existingProse.push(compCheck.evidence);
        }
        break;
      }
      case 'exam_essentials':
        primaryStruct?.examEssentials.forEach((e) => existingBullets.push(e));
        break;
      case 'important_questions':
        topicQuestions.slice(0, 6).forEach((q) => existingBullets.push(q.prompt));
        existingSourcesCount = topicQuestions.length;
        break;
      case 'practical_connections': {
        const expRes = coverageReport?.resourceChecks.find((r) => r.key === 'experiments');
        const simRes = coverageReport?.resourceChecks.find(
          (r) => r.key === 'interactive_simulations'
        );
        expRes?.linkedItems.forEach((item) => existingBullets.push(`${item.title} (${item.source})`));
        simRes?.linkedItems.forEach((item) => existingBullets.push(`${item.title} (${item.source})`));
        existingSourcesCount = (expRes?.count || 0) + (simRes?.count || 0);
        break;
      }
      case 'visual_connections': {
        const visKeys = ['diagrams', 'images', 'microscopy_visuals', 'models_3d'] as const;
        visKeys.forEach((vk) => {
          const rc = coverageReport?.resourceChecks.find((r) => r.key === vk);
          rc?.linkedItems.forEach((item) => existingBullets.push(`${item.title} (${item.source})`));
          existingSourcesCount += rc?.count || 0;
        });
        break;
      }
      case 'references':
        subject.references.forEach((ref) => existingBullets.push(ref));
        engineRefs.forEach((tb) =>
          existingBullets.push(`${tb.title} (${tb.edition}) — ${tb.authors}`)
        );
        acquiredResources.forEach((ar) =>
          existingBullets.push(`${ar.title} — ${ar.sourceName} (${ar.accessDate})`)
        );
        existingSourcesCount = subject.references.length + engineRefs.length + acquiredResources.length;
        break;
    }

    const approvedEntry = enrichmentRecord?.approvedSections?.[blueprint.key];
    const draft = enrichmentRecord?.drafts?.[blueprint.key];
    const hasUnsavedDraft = Boolean(
      draft &&
        (draft.prose.trim().length > 0 ||
          draft.bullets.length > 0 ||
          draft.formulas.length > 0 ||
          draft.importantQuestions.length > 0 ||
          draft.attachments.length > 0)
    );
    const isAiDraftPending = Boolean(hasUnsavedDraft && draft?.isAiDraft);

    const compAudit = coverageReport?.componentChecks.find(
      (c) => c.key === blueprint.componentCheckKey
    );

    let status: SectionAssessmentState['status'];
    let statusLabel: string;

    if (!applicable) {
      status = 'not_applicable';
      statusLabel = 'Not Applicable';
    } else if (approvedEntry?.provenance === 'needs_verification' || compAudit?.status === 'needs_review') {
      status = 'needs_verification';
      statusLabel = 'Needs Verification';
    } else if (compAudit?.status === 'present') {
      status = 'complete';
      statusLabel = approvedEntry ? 'Enriched & Ready' : 'Complete';
    } else if (
      approvedEntry &&
      (approvedEntry.prose.trim().length >= 40 ||
        approvedEntry.bullets.length >= 2 ||
        approvedEntry.formulas.length >= 1 ||
        approvedEntry.importantQuestions.length >= 1 ||
        approvedEntry.attachments.length >= 1)
    ) {
      status =
        approvedEntry.provenance === 'reference_supported' ||
        approvedEntry.provenance === 'ai_verified' ||
        approvedEntry.attachments.some((a) => a.verified)
          ? 'complete'
          : 'partial';
      statusLabel = status === 'complete' ? 'Enriched' : 'Needs Ref Support';
    } else if (
      compAudit?.status === 'partial' ||
      existingProse.join('').length >= 40 ||
      existingBullets.length >= 2
    ) {
      status = 'partial';
      statusLabel = 'Partial';
    } else {
      status = 'missing';
      statusLabel = 'Missing';
    }

    return {
      blueprint,
      applicable,
      applicabilityReason,
      existingProse,
      existingBullets,
      existingSourcesCount,
      approvedEntry,
      hasUnsavedDraft,
      isAiDraftPending,
      status,
      statusLabel
    };
  });
}
