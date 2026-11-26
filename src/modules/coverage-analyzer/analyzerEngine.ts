import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import {
  ENGINE_SUBTOPICS,
  ENGINE_TOPICS,
  TEXTBOOK_REFERENCES
} from '../../data/academicEngineRegistry';
import { SYLLABUS_COURSES } from '../../data/bpharmSem1Syllabus';
import { AnatomicalStructureEntity, AcademicSubtopic, AcademicTopic } from '../../types/academicEngine';
import { DEPARTMENT_WORKSPACES } from '../../types/academicArchitecture';
import { getAll3DAssets, matchCurriculumAssetsSync } from '../assets-3d/asset3dDb';
import { EXPERIMENT_CATALOG } from '../assets-3d/experimentCatalog';
import { getAsset3DAvailability, mapWorkspaceDeptToBPharmDept } from '../assets-3d/types';
import { INTERACTIVE_EXPERIMENTS } from '../interactive-experiments/experiments';
import { EXPERIMENT_DEPARTMENT_LABELS } from '../interactive-experiments/types';
import { getAllBooks } from '../knowledge-library/libraryDb';
import { getAllReferences } from '../reference-center/referenceDb';
import { loadResourceHubState } from '../resource-hub/resourceHubStorage';
import { CURATED_REFERENCE_QUESTIONS } from '../study-mode/examEngine';
import { summarizeTopicVerification } from '../enrichment-workspace/claimVerificationEngine';
import {
  getAllAcquiredResources,
  getAllQuestionPapers,
  getAllStoredQuestions,
  getAllSyllabi,
  getAllTopicEnrichments,
  getAllTopicProgress,
  getAllTopicVerifications,
  getAllTopicVerificationsSync
} from '../study-mode/studyDb';
import {
  OFFICIAL_BPHARM_SEM1_SYLLABUS_ID
} from '../study-mode/syllabusBridge';
import {
  AcquiredTopicResource,
  EnrichedSectionEntry,
  EnrichmentSectionKey,
  EnrichmentSourceAttachment,
  ExamQuestionItem,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusTopicNode
} from '../study-mode/types';
import { getAllVisuals } from '../visual-library/visualDb';
import { assessTopicApplicability } from './applicability';
import {
  AnalyzerRawInputs,
  AuditDataSourcesSummary,
  ComponentCheckKey,
  ComponentCheckStatus,
  CoverageAuditReport,
  CoverageStatus,
  CourseCoverageReport,
  GapActionRoute,
  GapCategory,
  GapSeverity,
  ResourceCheckKey,
  ResourceCoverageItem,
  SubjectCoverageReport,
  TopicComponentAudit,
  TopicCoverageReport,
  TopicGapItem,
  UnitCoverageReport
} from './types';

function normalizeTokenText(value?: string | null): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTopicMatchTokens(topic: SyllabusTopicNode, linkedAnatomy: AnatomicalStructureEntity[]): string[] {
  const stop = new Set([
    'unit', 'part', 'study', 'introduction', 'basic', 'basics', 'general',
    'methods', 'principles', 'system', 'systems', 'various', 'pharmacy',
    'pharmaceutical', 'including', 'related', 'practical', 'schedule', 'list'
  ]);
  const raw = [
    topic.title,
    ...topic.keywords,
    ...topic.subtopics.map((s) => s.title),
    ...linkedAnatomy.map((a) => `${a.name} ${a.scientificName || ''}`)
  ]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
  return Array.from(new Set(raw));
}

function countKeywordOverlap(text: string, tokens: string[]): number {
  if (!text || tokens.length === 0) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const tok of tokens) {
    if (lower.includes(tok)) hits += 1;
  }
  return hits;
}

function mapSubjectToModuleId(subjectCode: string, departmentId: string): string {
  const code = subjectCode.toUpperCase();
  if (code.startsWith('BP104') || code.startsWith('BP109') || departmentId === 'anatomy') return 'anatomy';
  if (code.startsWith('BP106') || code.startsWith('BP111') || departmentId === 'inorganic') return 'inorganic';
  if (code.startsWith('BP102') || code.startsWith('BP107') || departmentId === 'general_pharmacy') {
    return 'general_pharmacy';
  }
  if (code.startsWith('BP105') || code.startsWith('BP110') || departmentId === 'pharmacognosy') {
    return 'pharmacognosy';
  }
  if (code.startsWith('BP103') || code.startsWith('BP108') || departmentId === 'psychology') {
    return 'psychology';
  }
  if (code.startsWith('BP101') || departmentId === 'python') return 'python';
  return 'general_pharmacy';
}

function isSubstantiveVerifiedResource(res: AcquiredTopicResource): boolean {
  return (
    res.verificationStatus === 'official_syllabus' ||
    res.verificationStatus === 'textbook' ||
    res.verificationStatus === 'open_textbook' ||
    res.verificationStatus === 'peer_reviewed'
  );
}

function makeActionRoute(
  label: string,
  destinationLabel: string,
  targetModule: GapActionRoute['targetModule'],
  params?: GapActionRoute['params']
): GapActionRoute {
  return { label, destinationLabel, targetModule, params };
}

function buildTopicPrimaryActions(
  topic: SyllabusTopicNode,
  linkedAnatomy: AnatomicalStructureEntity[],
  matchedExperimentId?: string,
  matchedSimId?: string
): GapActionRoute[] {
  const deptModule = mapSubjectToModuleId(topic.subjectCode, topic.departmentId);
  const actions: GapActionRoute[] = [
    makeActionRoute('Enrich Topic', 'Enrichment Workspace', 'enrichment_workspace', {
      syllabusId: topic.syllabusId,
      subjectCode: topic.subjectCode,
      topicId: topic.id
    }),
    makeActionRoute('Open in Study Mode', 'Study Mode', 'study_mode', {
      syllabusId: topic.syllabusId,
      subjectCode: topic.subjectCode,
      topicId: topic.id,
      view: 'study'
    }),
    makeActionRoute('Add References', 'Reference Center', 'reference_center', {
      query: topic.keywords[0] || topic.title.slice(0, 32)
    }),
    makeActionRoute('Discover Open Sources', 'Resource Hub', 'resource_hub', {
      query: topic.keywords.slice(0, 3).join(' ') || topic.title.slice(0, 36)
    }),
    makeActionRoute('Visual Plates', 'Visual Library', 'visual_library', {
      department: topic.departmentId === 'python' ? undefined : topic.departmentId,
      query: topic.keywords[0] || topic.title.slice(0, 30)
    })
  ];

  if (topic.domainMode !== 'psychology_comm' && topic.domainMode !== 'computing_pk') {
    actions.push(
      makeActionRoute('3D Asset Engine', '3D Library', 'assets_3d', {
        department: mapWorkspaceDeptToBPharmDept(topic.departmentId),
        query: linkedAnatomy[0]?.name || topic.keywords[0] || topic.title.slice(0, 28)
      })
    );
  }

  if (matchedSimId) {
    actions.push(
      makeActionRoute('Open Interactive Sim', 'Interactive Sims', 'interactive_experiments', {
        experimentId: matchedSimId
      })
    );
  } else {
    actions.push(
      makeActionRoute('Open Practical Lab', 'Department Lab', 'department_lab', {
        department: deptModule,
        tab: topic.linkedLabTab || undefined,
        structureId: linkedAnatomy[0]?.id,
        experimentId: matchedExperimentId
      })
    );
  }

  actions.push(
    makeActionRoute('Exam Prep & PYQs', 'Exam Prep', 'study_mode', {
      syllabusId: topic.syllabusId,
      subjectCode: topic.subjectCode,
      topicId: topic.id,
      view: 'exam'
    })
  );

  return actions;
}

function analyzeSingleTopic(
  topic: SyllabusTopicNode,
  subject: SyllabusSubjectNode,
  syllabus: SyllabusProfile,
  inputs: AnalyzerRawInputs,
  assetIdSet: Set<string>
): TopicCoverageReport {
  const applicability = assessTopicApplicability(topic, subject);
  const deptModule = mapSubjectToModuleId(topic.subjectCode, topic.departmentId);

  // 1. Collect linked academic sources for this topic
  const structureIds = new Set<string>(topic.linkedStructureIds || []);
  topic.subtopics.forEach((st) => {
    if (st.linkedStructureId) structureIds.add(st.linkedStructureId);
  });
  const linkedAnatomy = ANATOMY_CATALOG.filter((a) => structureIds.has(a.id));

  const engineTopic: AcademicTopic | undefined = topic.linkedEngineTopicId
    ? ENGINE_TOPICS[topic.linkedEngineTopicId]
    : undefined;

  const engineSubtopicIds = new Set<string>();
  if (engineTopic) {
    engineTopic.subtopicIds.forEach((id) => engineSubtopicIds.add(id));
  }
  topic.subtopics.forEach((st) => {
    if (st.linkedSubtopicId) engineSubtopicIds.add(st.linkedSubtopicId);
  });
  const linkedEngineSubtopics: AcademicSubtopic[] = Array.from(engineSubtopicIds)
    .map((id) => ENGINE_SUBTOPICS[id])
    .filter(Boolean);

  const topicAcquired = inputs.acquiredResources.filter((r) => r.topicId === topic.id);
  const verifiedAcquired = topicAcquired.filter(isSubstantiveVerifiedResource);
  const unverifiedOrEncyclopedicAcquired = topicAcquired.filter(
    (r) => !isSubstantiveVerifiedResource(r)
  );

  const progress = inputs.topicProgress[topic.id];
  const tokens = buildTopicMatchTokens(topic, linkedAnatomy);

  // Measure real verified academic prose volume (exclude repetitive boilerplate titles)
  const subtopicSummaryText = topic.subtopics
    .map((s) => (s.summary && s.summary !== s.title ? s.summary : ''))
    .join(' ')
    .trim();
  const anatomyTextChars = linkedAnatomy.reduce(
    (sum, a) =>
      sum +
      (a.overview?.length || 0) +
      (a.definition?.length || 0) +
      (a.structure?.length || 0) +
      (a.physiology?.length || 0) +
      (a.components || []).map((c) => c.role).join(' ').length +
      (a.functions || []).join(' ').length +
      (a.clinicalSignificance || []).join(' ').length +
      (a.pharmaceuticalRelevance || []).join(' ').length +
      (a.examEssentials || []).join(' ').length,
    0
  );
  const engineSubChars = linkedEngineSubtopics.reduce(
    (sum, s) =>
      sum +
      (s.summary?.length || 0) +
      (s.anatomyNotes?.length || 0) +
      (s.structureNotes?.length || 0) +
      (s.physiologyNotes?.length || 0) +
      (s.functions || []).join(' ').length,
    0
  );
  const verifiedAcquiredChars = verifiedAcquired.reduce(
    (sum, r) => sum + (r.excerpt?.trim().length || 0),
    0
  );
  const summaryCleanChars =
    topic.summary && normalizeTokenText(topic.summary) !== normalizeTokenText(topic.title)
      ? topic.summary.trim().length
      : 0;

  const enrichmentRecord = inputs.topicEnrichments?.[topic.id];
  const approvedEntries = enrichmentRecord
    ? (Object.values(enrichmentRecord.approvedSections || {}).filter(Boolean) as EnrichedSectionEntry[])
    : [];
  const enrichedAttachments: EnrichmentSourceAttachment[] = approvedEntries.flatMap(
    (entry) => entry.attachments || []
  );

  const enrichedEntryLength = (entry?: EnrichedSectionEntry): number => {
    if (!entry) return 0;
    const tableChars = entry.comparisonTable
      ? (entry.comparisonTable.caption || '').trim().length +
        entry.comparisonTable.headers.join(' ').trim().length +
        entry.comparisonTable.rows.map((r) => r.join(' ')).join(' ').trim().length
      : 0;
    return (
      entry.prose.trim().length +
      entry.bullets.join(' ').trim().length +
      entry.formulas.join(' ').trim().length +
      tableChars +
      entry.importantQuestions.map((q) => `${q.prompt} ${q.answerGuidance}`).join(' ').trim().length
    );
  };

  const hasEnrichedContent = (keys: EnrichmentSectionKey[]): {
    present: boolean;
    verified: boolean;
    needsReview: boolean;
    entries: EnrichedSectionEntry[];
    totalChars: number;
  } => {
    const entries = keys
      .map((k) => enrichmentRecord?.approvedSections?.[k])
      .filter((e): e is EnrichedSectionEntry => Boolean(e) && enrichedEntryLength(e) >= 35);
    const totalChars = entries.reduce((sum, e) => sum + enrichedEntryLength(e), 0);
    const anyNeedsVerify = entries.some((e) => e.provenance === 'needs_verification');
    const anyVerified = entries.some(
      (e) =>
        e.provenance === 'reference_supported' ||
        e.provenance === 'ai_verified' ||
        e.attachments.some((a) => a.verified)
    );
    return {
      present: entries.length > 0,
      verified: anyVerified && !anyNeedsVerify,
      needsReview: anyNeedsVerify,
      entries,
      totalChars
    };
  };

  const approvedVerifiedEnrichmentChars = approvedEntries
    .filter((e) => e.provenance !== 'needs_verification')
    .reduce((sum, e) => sum + enrichedEntryLength(e), 0);

  const verifiedContentChars =
    summaryCleanChars +
    subtopicSummaryText.length +
    anatomyTextChars +
    engineSubChars +
    verifiedAcquiredChars +
    approvedVerifiedEnrichmentChars;

  // 2. Gather connected learning resources cleanly across existing PharmaLab modules
  const officialCourse = SYLLABUS_COURSES.find(
    (c) => c.courseCode.toUpperCase() === subject.code.toUpperCase()
  );

  // 2a. Textbooks (syllabus refs, ENGINE textbook refs, local PDF library, acquired textbook chapters)
  const syllabusRefs = subject.references || [];
  const engineRefIds = new Set<string>(engineTopic?.textbookRefIds || []);
  linkedAnatomy.forEach((a) => a.textbookRefIds.forEach((id) => engineRefIds.add(id)));
  linkedEngineSubtopics.forEach((s) => s.textbookRefIds.forEach((id) => engineRefIds.add(id)));
  const matchedEngineTextbooks = Array.from(engineRefIds)
    .map((id) => TEXTBOOK_REFERENCES[id])
    .filter(Boolean);

  const matchedLocalBooks = inputs.books.filter(
    (b) =>
      b.department === topic.bookDepartment ||
      countKeywordOverlap(`${b.title} ${b.author || ''}`, tokens) >= 1
  );
  const acquiredTextbooks = topicAcquired.filter((r) => r.resourceKind === 'textbook_chapter');

  const textbookItems = [
    ...matchedEngineTextbooks.map((tb) => ({
      id: tb.id,
      title: `${tb.title} (${tb.edition})`,
      source: tb.authors
    })),
    ...matchedLocalBooks.map((b) => ({
      id: b.id,
      title: b.title,
      source: `Local PDF (${b.pageCount} pp.)`
    })),
    ...acquiredTextbooks.map((r) => ({
      id: r.id,
      title: r.title,
      source: r.sourceName
    })),
    ...syllabusRefs.slice(0, 3).map((refText, idx) => ({
      id: `sylref_${subject.code}_${idx}`,
      title: refText,
      source: 'Syllabus Bibliography'
    }))
  ];

  // 2b. Verified external/official sources (Reference Center + Resource Hub + peer-reviewed/open-textbook acquired)
  const matchedReferenceCenter = inputs.references.filter((ref) => {
    const connections = ref.academicConnections || [];
    const directTopicOrDept = connections.some(
      (c) =>
        c.topicId === topic.id ||
        (c.departmentId &&
          normalizeTokenText(c.departmentId) === normalizeTokenText(topic.bookDepartment))
    );
    const connText = connections
      .map((c) => `${c.label || ''} ${c.departmentId || ''} ${c.notes || ''}`)
      .join(' ');
    const hay = `${ref.subject || ''} ${ref.title || ''} ${ref.shortTitle || ''} ${(ref.tags || []).join(' ')} ${connText}`.toLowerCase();
    const codeMatch = (ref.subject || '').toUpperCase().includes(topic.subjectCode.toUpperCase());
    const overlap = countKeywordOverlap(hay, tokens);
    return (directTopicOrDept && overlap >= 1) || (codeMatch && overlap >= 1) || overlap >= 2;
  });

  const matchedHubSaved = inputs.resourceHubSaved.filter((saved) => {
    if (saved.linkedContexts.some((c) => c.topicId === topic.id || c.subjectCode === topic.subjectCode)) {
      return true;
    }
    return countKeywordOverlap(`${saved.title} ${saved.summary || ''}`, tokens) >= 2;
  });

  const enrichedVerifiedSourceAtts = enrichedAttachments.filter(
    (a) =>
      a.sourceKind === 'reference_center' ||
      a.sourceKind === 'resource_hub' ||
      a.sourceKind === 'manual_citation'
  );
  const enrichedBookAtts = enrichedAttachments.filter((a) => a.sourceKind === 'knowledge_pdf');
  const enrichedVisualAtts = enrichedAttachments.filter((a) => a.sourceKind === 'visual_library');
  const enriched3DAtts = enrichedAttachments.filter((a) => a.sourceKind === 'asset_3d');
  const enrichedExpAtts = enrichedAttachments.filter((a) => a.sourceKind === 'experiment');
  const enrichedSimAtts = enrichedAttachments.filter((a) => a.sourceKind === 'simulation');

  const textbookItemsExtended = [
    ...textbookItems,
    ...enrichedBookAtts.map((a) => ({
      id: a.itemId,
      title: a.title,
      source: a.subtitle || 'Enrichment Attached PDF'
    }))
  ];

  const verifiedExternalItems = [
    ...matchedReferenceCenter.map((r) => ({
      id: r.id,
      title: r.shortTitle || r.title,
      source: 'Reference Center'
    })),
    ...verifiedAcquired.map((r) => ({
      id: r.id,
      title: r.title,
      source: r.sourceName
    })),
    ...matchedHubSaved.map((r) => ({
      id: r.id,
      title: r.title,
      source: `${r.providerName} (Saved)`
    })),
    ...enrichedVerifiedSourceAtts.map((a) => ({
      id: a.itemId,
      title: a.title,
      source: a.subtitle || 'Enrichment Attached Reference'
    }))
  ];

  // 2c. Scientific Visuals (Images, Diagrams, Microscopy)
  const matchedVisuals = inputs.visuals.filter((v) => {
    const depts = v.departments || [];
    const deptMatch =
      depts.includes(topic.departmentId as never) ||
      depts.some((d) => normalizeTokenText(d) === normalizeTokenText(deptModule));
    if (!deptMatch && topic.departmentId !== 'python') return false;
    const visualHay = `${v.title} ${v.caption || ''} ${(v.topics || []).join(' ')} ${(v.tags || []).join(' ')} ${(v.experiments || []).join(' ')}`.toLowerCase();
    const unitMatch = (v.experiments || []).some(
      (e) => normalizeTokenText(e) === normalizeTokenText(topic.unitNo)
    );
    const overlap = countKeywordOverlap(visualHay, tokens);
    return overlap >= 1 || (unitMatch && depts.includes(topic.departmentId as never));
  });

  const acquiredDiagrams = topicAcquired.filter((r) => r.resourceKind === 'diagram');
  const diagramVisuals = [
    ...matchedVisuals
      .filter((v) => v.mimeType?.includes('svg') || v.annotations?.length || v.category === 'anatomy' || v.category === 'pharmacology' || v.category === 'apparatus' || v.category === 'mechanism')
      .map((v) => ({ id: v.id, title: v.title, source: v.sourceName })),
    ...acquiredDiagrams.map((d) => ({ id: d.id, title: d.title, source: d.sourceName })),
    ...enrichedVisualAtts.map((a) => ({
      id: a.itemId,
      title: a.title,
      source: a.subtitle || 'Enrichment Attached Visual'
    }))
  ];

  const imageVisuals = matchedVisuals
    .filter((v) => !v.mimeType?.includes('svg') || v.category === 'anatomy' || v.category === 'botany' || v.category === 'histology' || v.category === 'microscopy')
    .map((v) => ({ id: v.id, title: v.title, source: v.sourceName }));

  const microscopyVisuals = matchedVisuals
    .filter((v) => {
      const hay = `${v.category} ${v.academicDomain || ''} ${v.title} ${(v.tags || []).join(' ')} ${(v.topics || []).join(' ')}`.toLowerCase();
      return (
        v.category === 'microscopy' ||
        v.category === 'histology' ||
        /\b(microscop|histolog|hematology|smear|neubauer|powder|stomata|tricome|botan|tissue|cell)\b/.test(hay)
      );
    })
    .map((v) => ({ id: v.id, title: v.title, source: v.sourceName }));

  // 2d. 3D Models (Real IndexedDB 3D assets + Curriculum matcher)
  const assetMatchRes = matchCurriculumAssetsSync(inputs.assets3d, {
    subjectCode: topic.subjectCode,
    unitId: topic.unitId,
    unitNo: topic.unitNo,
    topicId: topic.id,
    topicTitle: topic.title,
    structureIds: Array.from(structureIds),
    query: `${topic.title} ${topic.keywords.slice(0, 4).join(' ')}`
  });
  const directAndContextual3D = [
    ...assetMatchRes.directLinks,
    ...assetMatchRes.verifiedContextualMatches
  ];
  const brokenShared3DAssets = directAndContextual3D
    .map((m) => m.asset)
    .filter((a) => a.binaryRefAssetId && !assetIdSet.has(a.binaryRefAssetId));

  const matched3DItems = Array.from(
    new Map(
      [
        ...directAndContextual3D.map((m) => [
          m.asset.id,
          {
            id: m.asset.id,
            title: m.asset.name,
            source: getAsset3DAvailability(m.asset).label
          }
        ]),
        ...enriched3DAtts.map((a) => [
          a.itemId,
          {
            id: a.itemId,
            title: a.title,
            source: a.subtitle || 'Enrichment Attached 3D Asset'
          }
        ])
      ] as Array<[string, { id: string; title: string; source: string }]>
    ).values()
  );

  // 2e. Experiments & Interactive Simulations
  const matchedCatalogExperiments = Object.values(EXPERIMENT_CATALOG).filter((exp) => {
    const subjMatch = exp.subjectCode.toUpperCase() === topic.subjectCode.toUpperCase() ||
      (topic.subjectCode === 'BP104T' && exp.subjectCode === 'BP109P') ||
      (topic.subjectCode === 'BP106T' && exp.subjectCode === 'BP111P') ||
      (topic.subjectCode === 'BP102T' && exp.subjectCode === 'BP107P') ||
      (topic.subjectCode === 'BP105T' && exp.subjectCode === 'BP110P');
    if (!subjMatch) return false;
    const expHay = `${exp.title} ${exp.setupSummary || ''} ${exp.defaultSearchQuery} ${exp.steps.map((s) => s.title).join(' ')}`.toLowerCase();
    return countKeywordOverlap(expHay, tokens) >= 1 || subject.courseType.toLowerCase().includes('practical');
  });

  const deptMeta = DEPARTMENT_WORKSPACES[deptModule];
  const matchedWorkspaceExperiments = (deptMeta?.experiments || []).filter((exp) => {
    const expHay = `${exp.title} ${exp.code}`.toLowerCase();
    return (
      countKeywordOverlap(expHay, tokens) >= 1 ||
      (topic.linkedLabTab && exp.tab === topic.linkedLabTab) ||
      subject.courseType.toLowerCase().includes('practical')
    );
  });

  const matchedSimulations = INTERACTIVE_EXPERIMENTS.filter((sim) => {
    const ctx = sim.academicContext;
    const deptLabel = EXPERIMENT_DEPARTMENT_LABELS[sim.department] || sim.department;
    const hay = `${sim.title} ${sim.shortTitle} ${sim.description} ${sim.scientificPrinciple} ${deptLabel} ${ctx.subjectCode} ${ctx.unit} ${ctx.topic} ${ctx.subtopic}`.toLowerCase();
    const subjectHit =
      ctx.subjectCode.toUpperCase().includes(topic.subjectCode.toUpperCase()) ||
      (ctx.studyModeSubjectCode || '').toUpperCase() === topic.subjectCode.toUpperCase();
    const overlap = countKeywordOverlap(hay, tokens);
    return (subjectHit && overlap >= 1) || overlap >= 2;
  });

  const experimentItems = [
    ...matchedCatalogExperiments.map((e) => ({
      id: e.id,
      title: `${e.code}: ${e.title}`,
      source: 'Practical Bench Catalog'
    })),
    ...matchedWorkspaceExperiments.map((e) => ({
      id: e.id,
      title: `${e.code}: ${e.title}`,
      source: `${deptMeta?.shortLabel || 'Lab'} Workspace`
    })),
    ...enrichedExpAtts.map((a) => ({
      id: a.itemId,
      title: a.title,
      source: a.subtitle || 'Enrichment Attached Practical'
    }))
  ];
  const dedupExperiments = Array.from(new Map(experimentItems.map((e) => [e.id, e])).values());

  const simulationItems = Array.from(
    new Map(
      [
        ...matchedSimulations.map((s) => ({
          id: s.id,
          title: s.title,
          source: `Interactive Sim (${EXPERIMENT_DEPARTMENT_LABELS[s.department] || s.department})`
        })),
        ...enrichedSimAtts.map((a) => ({
          id: a.itemId,
          title: a.title,
          source: a.subtitle || 'Enrichment Attached Sim'
        }))
      ].map((item) => [item.id, item])
    ).values()
  );

  // 2f. Assessments (MCQs / Practice Questions + PYQs)
  const enrichedQuestionsList: ExamQuestionItem[] = (
    enrichmentRecord?.approvedSections?.important_questions?.importantQuestions || []
  ).map((q) => ({
    id: q.id,
    subjectCode: topic.subjectCode,
    unitNo: topic.unitNo,
    topicId: topic.id,
    topicTitle: topic.title,
    category: q.category,
    sourceType: 'reference_based',
    prompt: q.prompt,
    answerGuidance: q.answerGuidance,
    marks: q.marks,
    sourceAttribution: 'P4.2.1 Content Enrichment',
    createdAt: enrichmentRecord?.approvedSections?.important_questions?.updatedAt || Date.now()
  }));

  const allQuestions: ExamQuestionItem[] = [
    ...CURATED_REFERENCE_QUESTIONS,
    ...inputs.storedQuestions,
    ...enrichedQuestionsList
  ];
  const matchedQuestions = Array.from(
    new Map(
      allQuestions
        .filter((q) => {
          if (q.topicId === topic.id) return true;
          const subjMatch =
            q.subjectCode.toUpperCase() === topic.subjectCode.toUpperCase() ||
            (topic.subjectCode === 'BP109P' && q.subjectCode.toUpperCase() === 'BP104T') ||
            (topic.subjectCode === 'BP111P' && q.subjectCode.toUpperCase() === 'BP106T') ||
            (topic.subjectCode === 'BP107P' && q.subjectCode.toUpperCase() === 'BP102T') ||
            (topic.subjectCode === 'BP110P' && q.subjectCode.toUpperCase() === 'BP105T') ||
            (topic.subjectCode === 'BP108P' && q.subjectCode.toUpperCase() === 'BP103T');
          if (!subjMatch) return false;
          const sameUnit =
            q.unitNo && normalizeTokenText(q.unitNo) === normalizeTokenText(topic.unitNo);
          const overlap = countKeywordOverlap(`${q.topicTitle || ''} ${q.prompt}`, tokens);
          return (
            (sameUnit && overlap >= 1) ||
            overlap >= 2 ||
            (q.topicTitle && normalizeTokenText(q.topicTitle) === normalizeTokenText(topic.title))
          );
        })
        .map((q) => [q.id, q])
    ).values()
  );

  const mcqOrPracticeItems = matchedQuestions.map((q) => ({
    id: q.id,
    title: q.prompt.slice(0, 72) + (q.prompt.length > 72 ? '…' : ''),
    source: q.category.toUpperCase()
  }));

  const pyqQuestions = matchedQuestions.filter(
    (q) =>
      q.sourceType === 'actual_previous_year' ||
      q.sourceType === 'repeated_across_papers'
  );
  const matchedPapers = inputs.questionPapers.filter(
    (p) => p.subjectCode.toUpperCase() === topic.subjectCode.toUpperCase()
  );
  const pyqItems = [
    ...pyqQuestions.map((q) => ({
      id: q.id,
      title: q.prompt.slice(0, 72) + (q.prompt.length > 72 ? '…' : ''),
      source: q.sourceAttribution || 'Imported PYQ'
    })),
    ...(pyqQuestions.length === 0
      ? matchedPapers.map((p) => ({
          id: p.id,
          title: `${p.examYear || 'Imported'} Question Paper (${p.questionCount} Qs)`,
          source: p.sourceName
        }))
      : [])
  ];

  // 3. Build Verification Warnings (Honest distinction between checked structure & academic review)
  const verificationReasons: string[] = [];
  if (
    syllabus.verificationStatus === 'imported_syllabus' ||
    syllabus.verificationStatus === 'unverified_syllabus'
  ) {
    verificationReasons.push(
      `Imported/user-created syllabus profile (${syllabus.verificationStatus.replace('_', ' ')}) — verify topic scope against university regulation.`
    );
  }
  if (unverifiedOrEncyclopedicAcquired.length > 0 && verifiedAcquired.length === 0 && linkedAnatomy.length === 0 && linkedEngineSubtopics.length === 0) {
    verificationReasons.push(
      'External acquired excerpts rely on encyclopedic/open summaries without textbook or peer-reviewed confirmation.'
    );
  }
  if (brokenShared3DAssets.length > 0) {
    verificationReasons.push(
      `${brokenShared3DAssets.length} linked 3D asset(s) reference a missing shared binary owner in IndexedDB.`
    );
  }
  const needsVerificationEnrichments = approvedEntries.filter(
    (e) => e.provenance === 'needs_verification'
  );
  const unreferencedUserEnrichments = approvedEntries.filter(
    (e) =>
      e.provenance === 'user_written' &&
      (e.attachments?.length || 0) === 0 &&
      verifiedExternalItems.length === 0 &&
      matchedEngineTextbooks.length === 0 &&
      matchedLocalBooks.length === 0
  );
  if (needsVerificationEnrichments.length > 0) {
    verificationReasons.push(
      `${needsVerificationEnrichments.length} enriched section(s) marked "Needs Verification" (${needsVerificationEnrichments
        .map((e) => e.label)
        .join(', ')}).`
    );
  } else if (unreferencedUserEnrichments.length > 0) {
    verificationReasons.push(
      `${unreferencedUserEnrichments.length} user-authored section(s) lack attached textbook/reference backing.`
    );
  }

  const verificationRecord =
    inputs.topicVerifications?.[topic.id] || getAllTopicVerificationsSync()[topic.id];
  const verificationSummary = verificationRecord
    ? summarizeTopicVerification(verificationRecord)
    : undefined;
  if (verificationSummary && verificationSummary.conflictingCount > 0) {
    verificationReasons.push(
      `Textbook verification flagged ${verificationSummary.conflictingCount} claim(s) with conflicting textbook evidence.`
    );
  }
  if (verificationSummary && verificationSummary.requiresManualCount > 0) {
    verificationReasons.push(
      `${verificationSummary.requiresManualCount} scientific claim(s) marked as requiring manual textbook verification.`
    );
  }

  // 4. Evaluate 16 Academic Component Completeness Checks
  const hasRichAnatomy = linkedAnatomy.length > 0;
  const hasEngineSub = linkedEngineSubtopics.length > 0;
  const hasSubstantiveSubtopics =
    topic.subtopics.length >= 2 && subtopicSummaryText.length >= 160;
  const hasWorkspaceTopicMatch = (deptMeta?.topics || []).some(
    (wt) =>
      normalizeTokenText(wt.unit) === normalizeTokenText(topic.unitNo) ||
      countKeywordOverlap(`${wt.title} ${wt.summary} ${wt.keyConcepts.join(' ')}`, tokens) >= 2
  );

  const sectionMatched = (key: string) =>
    verifiedAcquired.filter((r) => r.suggestedSection === key && (r.excerpt?.length || 0) >= 60);

  const checkComponent = (
    key: ComponentCheckKey,
    label: string,
    evaluator: () => { status: ComponentCheckStatus; evidence: string; verificationNote?: string }
  ): TopicComponentAudit => {
    const app = applicability.components[key];
    if (!app.applicable) {
      return {
        key,
        label,
        status: 'not_applicable',
        applicable: false,
        applicabilityReason: app.reason,
        evidence: 'Not applicable to this topic domain.'
      };
    }
    const evaluated = evaluator();
    return {
      key,
      label,
      status: evaluated.status,
      applicable: true,
      applicabilityReason: app.reason,
      evidence: evaluated.evidence,
      verificationNote: evaluated.verificationNote
    };
  };

  const componentChecks: TopicComponentAudit[] = [
    checkComponent('topic_overview', 'Topic Overview', () => {
      const enr = hasEnrichedContent(['overview']);
      if (enr.needsReview) {
        return {
          status: 'needs_review',
          evidence: 'Enriched Topic Overview marked Needs Verification.'
        };
      }
      if (hasRichAnatomy || hasEngineSub || sectionMatched('overview').length > 0 || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: enr.present
            ? `Backed by verified Enrichment Overview (${enr.totalChars} chars).`
            : `Backed by ${
                hasRichAnatomy
                  ? `${linkedAnatomy.length} Anatomy Catalog entity`
                  : hasEngineSub
                  ? `${linkedEngineSubtopics.length} Engine Subtopic`
                  : 'verified acquired overview'
              }.`
        };
      }
      if (enr.present || summaryCleanChars >= 120 || hasWorkspaceTopicMatch) {
        return {
          status: 'partial',
          evidence: enr.present
            ? 'User-written overview saved; attach a verified textbook or Reference Center source.'
            : `Concise syllabus summary only (${summaryCleanChars} chars) without full conceptual overview.`
        };
      }
      return { status: 'missing', evidence: 'No meaningful topic overview beyond heading.' };
    }),

    checkComponent('definitions', 'Definitions', () => {
      const enr = hasEnrichedContent(['definition']);
      const anatDef = linkedAnatomy.some((a) => Boolean(a.definition && a.definition.length > 35));
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Definition marked Needs Verification.' };
      }
      if (anatDef || sectionMatched('definition').length > 0 || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: 'Formal scientific definitions present in catalog/verified enrichment.'
        };
      }
      if (enr.present || subtopicSummaryText.includes(':') || hasEngineSub) {
        return {
          status: 'partial',
          evidence: enr.present
            ? 'Definition drafted by user; attach textbook reference for verification.'
            : 'Key terms embedded in subtopic list, lacking standalone formal definition block.'
        };
      }
      return { status: 'missing', evidence: 'No dedicated definitions section detected.' };
    }),

    checkComponent('core_concepts', 'Core Concepts', () => {
      const enr = hasEnrichedContent(['core_concepts', 'classification_types']);
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Core Concepts marked Needs Verification.' };
      }
      if (
        (enr.present && enr.verified) ||
        (topic.subtopics.length >= 3 && (hasRichAnatomy || hasEngineSub || subtopicSummaryText.length >= 220))
      ) {
        return {
          status: 'present',
          evidence: enr.present
            ? `Core concepts & classification enriched (${enr.totalChars} chars) with verified backing.`
            : `${topic.subtopics.length} syllabus subtopics (${subtopicSummaryText.length} chars) + structured concepts.`
        };
      }
      if (enr.present || topic.subtopics.length >= 1 || hasWorkspaceTopicMatch) {
        return {
          status: 'partial',
          evidence: enr.present
            ? 'Core concepts enriched; attach verified textbook/reference source.'
            : `${topic.subtopics.length} subtopic item(s) listed; structured concept depth is thin.`
        };
      }
      return {
        status: 'missing',
        evidence: 'Topic has 0 decomposed subtopics and no linked workspace concept notes.'
      };
    }),

    checkComponent('detailed_explanation', 'Detailed Explanation', () => {
      const enr = hasEnrichedContent(['detailed_explanation', 'advantages_comparisons']);
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Detailed Explanation marked Needs Verification.' };
      }
      if (
        (enr.present && enr.verified && enr.totalChars >= 180) ||
        (verifiedContentChars >= 900 && (hasRichAnatomy || hasEngineSub || verifiedAcquired.length >= 2))
      ) {
        return {
          status: 'present',
          evidence: `${verifiedContentChars.toLocaleString()} verified academic chars across catalog/enrichment notes.`
        };
      }
      if (enr.present || verifiedContentChars >= 350 || hasSubstantiveSubtopics) {
        return {
          status: 'partial',
          evidence: `Moderate depth (${verifiedContentChars.toLocaleString()} chars); expand verified explanation or attach source.`
        };
      }
      return {
        status: 'missing',
        evidence: `Insufficient explanatory prose (${verifiedContentChars} chars — syllabus outline only).`
      };
    }),

    checkComponent('mechanism_process', 'Mechanism / Process', () => {
      const enr = hasEnrichedContent(['mechanism_process']);
      const hasPhys =
        linkedAnatomy.some((a) => (a.physiology?.length || 0) >= 60) ||
        linkedEngineSubtopics.some((s) => (s.physiologyNotes?.length || 0) >= 60);
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Mechanism / Process marked Needs Verification.' };
      }
      if (hasPhys || sectionMatched('mechanism').length > 0 || sectionMatched('physiology').length > 0 || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: 'Physiological/mechanistic workflow documented in linked modules or verified enrichment.'
        };
      }
      if (enr.present || matchedCatalogExperiments.length > 0 || matchedSimulations.length > 0) {
        return {
          status: 'partial',
          evidence: enr.present
            ? 'Mechanism text drafted; attach verified reference for full validation.'
            : 'Procedural workflow exists in Practical/Simulation module, missing inline theory mechanism notes.'
        };
      }
      return { status: 'missing', evidence: 'No mechanism or process explanation attached to this topic.' };
    }),

    checkComponent('structures_components', 'Structures / Components', () => {
      const enr = hasEnrichedContent(['components_structure']);
      const compCount = linkedAnatomy.reduce((s, a) => s + a.components.length, 0);
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Components & Structure marked Needs Verification.' };
      }
      if (compCount >= 2 || linkedEngineSubtopics.some((s) => (s.structureNotes?.length || 0) >= 60) || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: enr.present
            ? `Components & structural organization enriched (${enr.totalChars} chars).`
            : `${compCount || linkedEngineSubtopics.length} anatomical/structural components documented.`
        };
      }
      if (enr.present || linkedAnatomy.length > 0 || ((deptMeta?.equipment.length || 0) > 0 && topic.domainMode === 'chemistry_analysis')) {
        return {
          status: 'partial',
          evidence: 'Partial structure or apparatus cues exist without verified itemized component breakdown.'
        };
      }
      return { status: 'missing', evidence: 'No itemized structural or apparatus component breakdown found.' };
    }),

    checkComponent('formulas_calculations', 'Formulas & Calculations', () => {
      const enr = hasEnrichedContent(['formulas_numericals']);
      const hasQuantitativeLab =
        ((topic.subjectCode.startsWith('BP102') || topic.subjectCode.startsWith('BP107')) &&
          /\b(posology|alligation|isotonic|proof|calculation|dilution)\b/i.test(`${topic.title} ${subtopicSummaryText}`)) ||
        ((topic.subjectCode.startsWith('BP105') || topic.subjectCode.startsWith('BP110')) &&
          /\b(stomatal|vein|lycopodium|micrometry|ash|extractive)\b/i.test(`${topic.title} ${subtopicSummaryText}`)) ||
        ((topic.subjectCode.startsWith('BP106') || topic.subjectCode.startsWith('BP111')) &&
          /\b(limit test|assay|buffer|henderson|molarity|normality|titration)\b/i.test(`${topic.title} ${subtopicSummaryText}`)) ||
        topic.subjectCode.startsWith('BP101');
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Formulas section marked Needs Verification.' };
      }
      if ((enr.present && enr.verified) || (matchedSimulations.length > 0 && hasQuantitativeLab)) {
        return {
          status: 'present',
          evidence: enr.present
            ? `Formulas & worked numerical applications documented (${enr.entries[0]?.formulas.length || 0} equation(s)).`
            : `Interactive quantitative solver/simulator (${matchedSimulations.map((s) => s.title).join(', ')}) available.`
        };
      }
      if (
        enr.present ||
        hasQuantitativeLab ||
        matchedWorkspaceExperiments.some((w) => w.tab === 'posology_proof' || w.tab === 'alligation' || w.tab === 'leaf_constants' || w.tab === 'titration')
      ) {
        return {
          status: 'partial',
          evidence: enr.present
            ? 'Formulas drafted; attach textbook/pharmacopoeia verification.'
            : 'Dedicated calculator/assay exists in Department Lab, but topic Study Mode notes lack step-by-step worked formula sheet.'
        };
      }
      return { status: 'missing', evidence: 'Applicable formulas & worked calculation steps are missing.' };
    }),

    checkComponent('examples', 'Examples', () => {
      const enr = hasEnrichedContent(['examples_applications']);
      const hasEx = /\b(e\.g\.|for example|such as|including|tulsi|ashwagandha|aspirin|furosemide|barium|silver|aluminium|young|dilling)\b/i.test(
        `${subtopicSummaryText} ${linkedAnatomy.map((a) => a.pharmaceuticalRelevance.join(' ')).join(' ')}`
      );
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Examples section marked Needs Verification.' };
      }
      if ((enr.present && enr.verified) || (hasRichAnatomy && hasEx) || (hasEx && subtopicSummaryText.length >= 180)) {
        return { status: 'present', evidence: 'Concrete pharmaceutical/clinical examples documented.' };
      }
      if (enr.present || hasEx || matchedCatalogExperiments.length > 0) {
        return { status: 'partial', evidence: 'Brief inline examples listed; worked case/drug examples or reference support incomplete.' };
      }
      return { status: 'missing', evidence: 'No worked examples or representative agents documented.' };
    }),

    checkComponent('pharmaceutical_relevance', 'Pharmaceutical Relevance', () => {
      const enr = hasEnrichedContent(['pharmaceutical_relevance']);
      const anatPharm = linkedAnatomy.some((a) => a.pharmaceuticalRelevance.length > 0);
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Pharmaceutical Relevance marked Needs Verification.' };
      }
      if (anatPharm || sectionMatched('pharmaceutical_relevance').length > 0 || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: 'Explicit formulation, drug delivery, or pharmacopoeial relevance documented.'
        };
      }
      if (enr.present || (verifiedContentChars >= 220 && topic.domainMode !== 'general')) {
        return {
          status: 'partial',
          evidence: 'Syllabus context implies pharmacy relevance; attach verified reference or expand Pharmaceutics application.'
        };
      }
      return { status: 'missing', evidence: 'No explicit pharmaceutical relevance block found.' };
    }),

    checkComponent('clinical_relevance', 'Clinical Relevance', () => {
      const enr = hasEnrichedContent(['clinical_relevance']);
      const anatClin = linkedAnatomy.some((a) => a.clinicalSignificance.length > 0);
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Clinical Relevance marked Needs Verification.' };
      }
      if (anatClin || sectionMatched('clinical_significance').length > 0 || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: 'Pathophysiological / therapeutic clinical significance documented.'
        };
      }
      if (enr.present || (deptModule === 'psychology' && matchedWorkspaceExperiments.length > 0)) {
        return {
          status: 'partial',
          evidence: enr.present
            ? 'Clinical relevance drafted; attach reference backing.'
            : 'Clinical role-play scenarios exist in Lab; theory notes lack clinical case takeaways.'
        };
      }
      return { status: 'missing', evidence: 'Clinical relevance or patient-care significance not yet documented.' };
    }),

    checkComponent('learning_objectives', 'Learning Objectives', () => {
      const enr = hasEnrichedContent(['learning_objectives']);
      const objCount = officialCourse?.objectives?.length || subject.objectives?.length || 0;
      const coCount = officialCourse?.outcomes?.length || subject.outcomes?.length || 0;
      if ((objCount > 0 && coCount > 0) || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: enr.present
            ? 'Topic-specific learning objectives enriched alongside course outcomes.'
            : `Aligned with ${objCount} course objective(s) & ${coCount} CO statement(s).`
        };
      }
      if (enr.present || objCount > 0 || coCount > 0) {
        return {
          status: 'partial',
          evidence: 'Partial course objectives defined; add topic-level outcome mapping.'
        };
      }
      return {
        status: 'missing',
        evidence: 'No course learning objectives or outcomes defined in syllabus metadata.'
      };
    }),

    checkComponent('exam_essentials', 'Exam Essentials', () => {
      const enr = hasEnrichedContent(['exam_essentials']);
      const anatExam = linkedAnatomy.some((a) => a.examEssentials.length > 0);
      if (enr.needsReview) {
        return { status: 'needs_review', evidence: 'Enriched Exam Essentials marked Needs Verification.' };
      }
      if (anatExam || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: 'High-yield exam essentials & viva points verified and ready.'
        };
      }
      if (enr.present || matchedQuestions.length > 0) {
        return {
          status: 'partial',
          evidence: enr.present
            ? 'Exam essentials drafted; attach source verification.'
            : `${matchedQuestions.length} exam question(s) exist, but concise exam revision bullet sheet is missing.`
        };
      }
      return { status: 'missing', evidence: 'No high-yield exam essentials or viva revision points found.' };
    }),

    checkComponent('references', 'References', () => {
      const enr = hasEnrichedContent(['references']);
      if (
        matchedEngineTextbooks.length > 0 ||
        matchedReferenceCenter.length > 0 ||
        verifiedAcquired.length > 0 ||
        matchedLocalBooks.length > 0 ||
        enrichedVerifiedSourceAtts.length > 0 ||
        enrichedBookAtts.length > 0 ||
        (enr.present && enr.verified)
      ) {
        return {
          status: 'present',
          evidence: `${textbookItemsExtended.length} textbook/bibliography entry + ${verifiedExternalItems.length} verified reference(s).`
        };
      }
      if (enr.present || syllabusRefs.length > 0) {
        return {
          status: 'partial',
          evidence: `${syllabusRefs.length} subject bibliography entry only; attach topic-specific textbook/PDF or Reference Center source.`
        };
      }
      return { status: 'missing', evidence: 'No authoritative references linked to this topic.' };
    }),

    checkComponent('visual_resources', 'Visual Learning Resources', () => {
      const totalVis = new Set([...diagramVisuals, ...imageVisuals, ...microscopyVisuals].map((x) => x.id)).size;
      if (totalVis >= 2) {
        return { status: 'present', evidence: `${totalVis} visual plates/diagrams linked.` };
      }
      if (totalVis === 1 || hasEnrichedContent(['visual_connections']).present) {
        return { status: 'partial', evidence: '1 visual asset/description linked; additional annotated diagrams recommended.' };
      }
      return { status: 'missing', evidence: 'No annotated visual plates or diagrams linked to this topic.' };
    }),

    checkComponent('experiments_practical', 'Experiments / Practicals', () => {
      const enr = hasEnrichedContent(['practical_connections']);
      if (dedupExperiments.length > 0 || simulationItems.length > 0 || (enr.present && enr.verified)) {
        return {
          status: 'present',
          evidence: `${dedupExperiments.length} practical bench activity + ${simulationItems.length} interactive sim(s).`
        };
      }
      if (enr.present || topic.linkedLabTab) {
        return {
          status: 'partial',
          evidence: topic.linkedLabTab
            ? `Links to department tab "${topic.linkedLabTab}", without dedicated mapped practical protocol.`
            : 'Practical notes drafted; attach verified lab experiment or simulation.'
        };
      }
      return { status: 'missing', evidence: 'No practical experiment or simulation mapped.' };
    }),

    checkComponent('assessment_questions', 'Assessment Questions', () => {
      if (matchedQuestions.length >= 2) {
        return {
          status: 'present',
          evidence: `${matchedQuestions.length} practice/PYQ assessment question(s) mapped.`
        };
      }
      if (matchedQuestions.length === 1) {
        return {
          status: 'partial',
          evidence: 'Only 1 question mapped; add more MCQs and long/short-answer prompts.'
        };
      }
      return { status: 'missing', evidence: '0 topic-matched MCQs, numericals, or PYQ questions found.' };
    })
  ];

  // 5. Evaluate 10 Resource Coverage Checks
  const makeResourceCheck = (
    key: ResourceCheckKey,
    label: string,
    items: Array<{ id: string; title: string; source: string }>,
    partialCondition?: boolean,
    customMissingMsg?: string
  ): ResourceCoverageItem => {
    const app = applicability.resources[key];
    if (!app.applicable) {
      return {
        key,
        label,
        status: 'not_applicable',
        applicable: false,
        count: 0,
        applicabilityReason: app.reason,
        evidence: 'Not applicable to this subject/topic domain.',
        linkedItems: []
      };
    }
    if (items.length === 0) {
      return {
        key,
        label,
        status: 'missing',
        applicable: true,
        count: 0,
        applicabilityReason: app.reason,
        evidence: customMissingMsg || `No ${label.toLowerCase()} connected.`,
        linkedItems: []
      };
    }
    return {
      key,
      label,
      status: partialCondition ? 'partial' : 'present',
      applicable: true,
      count: items.length,
      applicabilityReason: app.reason,
      evidence: `${items.length} ${label.toLowerCase()} connected.`,
      linkedItems: items
    };
  };

  const resourceChecks: ResourceCoverageItem[] = [
    makeResourceCheck(
      'textbooks',
      'Textbooks & Syllabus Refs',
      textbookItemsExtended,
      matchedEngineTextbooks.length === 0 && matchedLocalBooks.length === 0 && acquiredTextbooks.length === 0 && enrichedBookAtts.length === 0 && syllabusRefs.length > 0,
      'No textbook or syllabus bibliography connected.'
    ),
    makeResourceCheck(
      'verified_sources',
      'Verified Open/Ref Sources',
      verifiedExternalItems,
      false,
      'No Reference Center monograph, peer-reviewed paper, or open textbook cached.'
    ),
    makeResourceCheck('diagrams', 'Diagrams & Plots', diagramVisuals),
    makeResourceCheck('images', 'Images & Atlas Plates', imageVisuals),
    makeResourceCheck('microscopy_visuals', 'Microscopy / Histology', microscopyVisuals),
    makeResourceCheck(
      'models_3d',
      '3D Models',
      matched3DItems,
      brokenShared3DAssets.length > 0,
      'No 3D anatomical or laboratory apparatus model linked for this topic.'
    ),
    makeResourceCheck('experiments', 'Practical Experiments', dedupExperiments),
    makeResourceCheck('interactive_simulations', 'Interactive Simulations', simulationItems),
    makeResourceCheck('mcqs', 'MCQs & Practice Qs', mcqOrPracticeItems, mcqOrPracticeItems.length === 1),
    makeResourceCheck('pyqs', 'Previous-Year Papers', pyqItems)
  ];

  // 6. Compute Honest Completeness & Resource Coverage Metrics
  const applicableComponents = componentChecks.filter((c) => c.applicable);
  const presentComponents = applicableComponents.filter((c) => c.status === 'present');
  const partialComponents = applicableComponents.filter((c) => c.status === 'partial');
  const missingComponents = applicableComponents.filter((c) => c.status === 'missing');

  // Strict scoring: present = 1.0, partial = 0.45, needs_review = 0.25, missing = 0
  const componentPoints = applicableComponents.reduce((sum, c) => {
    if (c.status === 'present') return sum + 1;
    if (c.status === 'partial') return sum + 0.45;
    if (c.status === 'needs_review') return sum + 0.25;
    return sum;
  }, 0);
  const completenessPct = applicableComponents.length
    ? Math.round((componentPoints / applicableComponents.length) * 100)
    : 0;

  const applicableResources = resourceChecks.filter((r) => r.applicable);
  const connectedResources = applicableResources.filter(
    (r) => r.status === 'present' || r.status === 'partial'
  );
  const resourcePoints = applicableResources.reduce((sum, r) => {
    if (r.status === 'present') return sum + 1;
    if (r.status === 'partial') return sum + 0.5;
    return sum;
  }, 0);
  const resourceCoveragePct = applicableResources.length
    ? Math.round((resourcePoints / applicableResources.length) * 100)
    : 0;

  // Anti-False-Positive Classification Guardrails
  const coreExplanationCheck = componentChecks.find((c) => c.key === 'detailed_explanation');
  const coreConceptsCheck = componentChecks.find((c) => c.key === 'core_concepts');

  let status: CoverageStatus;
  const statusReasons: string[] = [];

  if (
    verifiedContentChars < 200 &&
    topic.subtopics.length <= 1 &&
    !hasRichAnatomy &&
    !hasEngineSub &&
    verifiedAcquired.length === 0 &&
    approvedEntries.length === 0
  ) {
    status = 'missing_content';
    statusReasons.push(
      `Only ${verifiedContentChars} chars of verified explanation; no linked Anatomy Catalog, Engine Subtopic, or textbook excerpt.`
    );
  } else if (
    verifiedContentChars < 350 ||
    completenessPct < 35 ||
    (coreExplanationCheck?.status === 'missing' && coreConceptsCheck?.status !== 'present')
  ) {
    status = 'minimal_content';
    statusReasons.push(
      `Contains outline/short syllabus text (${verifiedContentChars} chars) with ${missingComponents.length} applicable academic components missing.`
    );
  } else if (verificationReasons.length > 0 && completenessPct >= 45) {
    status = 'needs_verification';
    statusReasons.push(...verificationReasons);
  } else if (
    completenessPct === 100 &&
    resourceCoveragePct >= 90 &&
    missingComponents.length === 0 &&
    verificationReasons.length === 0
  ) {
    status = 'complete';
    statusReasons.push(
      'All applicable academic components and core learning resources verified with substantive depth.'
    );
  } else if (
    completenessPct >= 70 &&
    (hasRichAnatomy || hasEngineSub || verifiedAcquired.length > 0 || approvedVerifiedEnrichmentChars >= 220 || verifiedContentChars >= 900) &&
    coreExplanationCheck?.status === 'present'
  ) {
    status = 'substantially_complete';
    statusReasons.push(
      `${presentComponents.length}/${applicableComponents.length} applicable components complete (${verifiedContentChars.toLocaleString()} chars); minor resource or assessment gaps remain.`
    );
  } else {
    status = 'partially_complete';
    statusReasons.push(
      `Baseline structure present (${completenessPct}% component score), but lacks deep multi-component explanation or required learning resources.`
    );
  }

  // 7. Identify Actionable Gaps + Priority Scoring
  const gaps: TopicGapItem[] = [];
  const quickActions = buildTopicPrimaryActions(
    topic,
    linkedAnatomy,
    matchedCatalogExperiments[0]?.id,
    matchedSimulations[0]?.id
  );
  const creditWeight = Math.max(1, subject.credits || 2);
  const isOfficial = Boolean(syllabus.isSystemOfficial);

  const pushGap = (
    category: GapCategory,
    severity: GapSeverity,
    basePriority: number,
    priorityReason: string,
    title: string,
    detail: string,
    suggestedAction: GapActionRoute,
    secondaryActions: GapActionRoute[] = []
  ) => {
    const score =
      basePriority +
      (isOfficial ? 12 : 0) +
      creditWeight * 3 +
      (severity === 'critical' ? 40 : severity === 'high' ? 25 : severity === 'medium' ? 12 : 0);
    gaps.push({
      id: `gap_${topic.id}_${category}`,
      courseId: syllabus.id,
      courseTitle: syllabus.title,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectTitle: subject.title,
      unitId: topic.unitId,
      unitNo: topic.unitNo,
      unitTitle: topic.unitTitle,
      topicId: topic.id,
      topicTitle: topic.title,
      category,
      severity,
      priorityScore: score,
      priorityReason,
      title,
      detail,
      suggestedAction,
      secondaryActions
    });
  };

  if (status === 'missing_content') {
    pushGap(
      'missing_content',
      'critical',
      45,
      `Core syllabus topic (${subject.code}, ${subject.credits} cr) has no substantive explanatory content.`,
      `Missing academic explanation for "${topic.title}"`,
      `Only ${verifiedContentChars} chars detected; no Anatomy Catalog, Academic Engine, or cached textbook explanations linked.`,
      quickActions[0],
      [quickActions[1], quickActions[2]]
    );
  } else if (status === 'minimal_content' || coreExplanationCheck?.status === 'missing') {
    pushGap(
      'weak_content',
      'high',
      38,
      `High-priority topic relies on short syllabus bullets (${verifiedContentChars} chars) without deep explanation.`,
      `Thin or incomplete academic notes in "${topic.title}"`,
      `${missingComponents.length} applicable components missing (${missingComponents
        .slice(0, 4)
        .map((c) => c.label)
        .join(', ')}).`,
      quickActions[0],
      [quickActions[2]]
    );
  } else if (coreExplanationCheck?.status === 'partial' || partialComponents.length >= 4) {
    pushGap(
      'weak_content',
      'medium',
      26,
      `Topic has baseline structure (${completenessPct}%) but needs deeper examples, mechanisms, or exam essentials.`,
      `Partial content depth (${completenessPct}%) in "${topic.title}"`,
      `Partial sections: ${partialComponents
        .slice(0, 4)
        .map((c) => c.label)
        .join(', ')}.`,
      quickActions[0],
      [quickActions[1]]
    );
  }

  if (topic.subtopics.length === 0 || (engineTopic && engineTopic.subtopicIds.length === 0)) {
    pushGap(
      'hierarchy_incomplete',
      topic.subtopics.length === 0 ? 'high' : 'medium',
      30,
      topic.subtopics.length === 0
        ? 'Syllabus topic lacks subtopic breakdown in Study Mode hierarchy.'
        : `Linked Academic Engine topic (${engineTopic?.id}) has subtopicIds: [].`,
      topic.subtopics.length === 0
        ? `No subtopics defined under "${topic.title}"`
        : `Linked Academic Engine topic missing structured subtopics`,
      topic.subtopics.length === 0
        ? 'Decompose this unit section into subtopics or attach verified chapter sub-headings.'
        : `Registry entry "${engineTopic?.title}" has 0 subtopics in academicEngineRegistry.`,
      quickActions[0],
      [makeActionRoute('Inspect Official Syllabus', 'Syllabus Viewer', 'syllabus')]
    );
  }

  if (verificationReasons.length > 0) {
    pushGap(
      'verification_issue',
      'high',
      32,
      'Source provenance or linked 3D binary integrity requires academic verification.',
      `Academic verification required for "${topic.title}"`,
      verificationReasons.join(' '),
      quickActions[0],
      [quickActions[1]]
    );
  }

  const refCheck = resourceChecks.find((r) => r.key === 'verified_sources');
  const tbCheck = resourceChecks.find((r) => r.key === 'textbooks');
  if (
    (refCheck?.applicable && refCheck.status === 'missing') ||
    (tbCheck?.applicable && tbCheck.status === 'missing')
  ) {
    pushGap(
      'missing_references',
      'medium',
      28,
      'Authoritative pharmacopoeial, textbook, or peer-reviewed references are unlinked.',
      `Missing verified textbook/monograph references`,
      refCheck?.evidence || tbCheck?.evidence || 'Link Reference Center entries or fetch OpenStax/NCBI chapters.',
      quickActions[1],
      [quickActions[2], makeActionRoute('Upload PDF Textbook', 'PDF Library', 'knowledge_library', { query: topic.title })]
    );
  }

  const diagCheck = resourceChecks.find((r) => r.key === 'diagrams');
  const imgCheck = resourceChecks.find((r) => r.key === 'images');
  if (
    (diagCheck?.applicable && diagCheck.status === 'missing') &&
    (!imgCheck?.applicable || imgCheck.status === 'missing')
  ) {
    pushGap(
      'missing_visuals',
      'medium',
      24,
      'Applicable visual diagrams or atlas plates are missing for visual comprehension.',
      `Missing scientific visuals & diagrams`,
      'No matching built-in or uploaded plates found in Visual Library for this topic.',
      quickActions[3],
      [quickActions[2]]
    );
  }

  const micCheck = resourceChecks.find((r) => r.key === 'microscopy_visuals');
  if (micCheck?.applicable && micCheck.status === 'missing') {
    pushGap(
      'missing_microscopy',
      'medium',
      24,
      'Histology, blood smear, or botanical microscopy plates apply directly to this topic.',
      `Missing microscopy / histology plates`,
      micCheck.evidence,
      quickActions[3],
      [
        makeActionRoute('Open Microscopy Bench', 'Department Lab', 'department_lab', {
          department: deptModule,
          tab: deptModule === 'pharmacognosy' ? 'morphology' : 'microscopy'
        })
      ]
    );
  }

  const model3dCheck = resourceChecks.find((r) => r.key === 'models_3d');
  if (model3dCheck?.applicable && model3dCheck.status === 'missing') {
    pushGap(
      'missing_3d',
      'medium',
      22,
      'Spatial 3D anatomical organ or pharmaceutical apparatus model applies.',
      `No 3D model linked in 3D Asset Library`,
      'Import or link a GLB/glTF/STL model in the 3D Asset Engine and associate it with this topic.',
      makeActionRoute('Link / Discover 3D Model', '3D Asset Engine', 'assets_3d', {
        department: mapWorkspaceDeptToBPharmDept(topic.departmentId),
        query: linkedAnatomy[0]?.name || topic.keywords[0] || topic.title.slice(0, 28)
      }),
      [makeActionRoute('Open 3D Explorer', 'Academic 3D Explorer', 'explorer_3d', { subjectCode: topic.subjectCode, topicId: topic.id })]
    );
  }

  const expCheck = resourceChecks.find((r) => r.key === 'experiments');
  if (expCheck?.applicable && expCheck.status === 'missing') {
    pushGap(
      'missing_experiments',
      'medium',
      20,
      'Curriculum practical or hands-on bench connection is unmapped.',
      `No laboratory practical linked`,
      expCheck.evidence,
      makeActionRoute('Open Department Lab', 'Department Lab', 'department_lab', {
        department: deptModule,
        tab: topic.linkedLabTab || undefined
      })
    );
  }

  const simCheck = resourceChecks.find((r) => r.key === 'interactive_simulations');
  if (simCheck?.applicable && simCheck.status === 'missing') {
    pushGap(
      'missing_simulations',
      'low',
      10,
      'Topic supports quantitative or dynamic simulation (optional virtual lab enhancement).',
      `No interactive simulation linked`,
      simCheck.evidence,
      makeActionRoute('Browse Simulations', 'Interactive Sims', 'interactive_experiments')
    );
  }

  const mcqCheck = resourceChecks.find((r) => r.key === 'mcqs');
  if (mcqCheck?.applicable && mcqCheck.status === 'missing') {
    pushGap(
      'missing_assessments',
      'medium',
      25,
      'Zero MCQs or structured exam questions mapped for formative assessment.',
      `Missing assessment questions & MCQs`,
      mcqCheck.evidence,
      makeActionRoute('Open Exam Prep', 'Exam Prep', 'study_mode', {
        syllabusId: topic.syllabusId,
        subjectCode: topic.subjectCode,
        topicId: topic.id,
        view: 'exam'
      })
    );
  } else {
    const pyqCheck = resourceChecks.find((r) => r.key === 'pyqs');
    if (pyqCheck?.applicable && pyqCheck.status === 'missing') {
      pushGap(
        'missing_pyq',
        'low',
        8,
        'Practice MCQs exist, but no imported Previous-Year Question (PYQ) papers are mapped yet.',
        `No imported PYQ paper alignment`,
        pyqCheck.evidence,
        makeActionRoute('Import Past Question Paper', 'Exam Prep', 'study_mode', {
          syllabusId: topic.syllabusId,
          subjectCode: topic.subjectCode,
          topicId: topic.id,
          view: 'exam'
        })
      );
    }
  }

  if (verificationSummary && verificationSummary.conflictingCount > 0) {
    pushGap(
      'verification_issue',
      'high',
      34,
      'Conflicting statements detected across textbook passages require academic review.',
      `Conflicting textbook evidence on ${verificationSummary.conflictingCount} claim(s)`,
      `Inspect flagged claims and resolve textbook passage differences in the Textbook Verification Workspace.`,
      makeActionRoute('Verify Against Textbooks', 'Enrichment Workspace', 'enrichment_workspace', {
        syllabusId: syllabus.id,
        subjectCode: subject.code,
        topicId: topic.id
      })
    );
  }

  const totalLinkedResourceItems = resourceChecks.reduce((sum, r) => sum + r.count, 0);

  return {
    id: topic.id,
    courseId: syllabus.id,
    subjectId: subject.id,
    subjectCode: subject.code,
    subjectTitle: subject.title,
    unitId: topic.unitId,
    unitNo: topic.unitNo,
    unitTitle: topic.unitTitle,
    title: topic.title,
    domainMode: topic.domainMode,
    departmentId: topic.departmentId,
    subtopicCount: topic.subtopics.length,
    subtopicsWithContentCount: topic.subtopics.filter(
      (s) => s.summary && s.summary.trim().length > s.title.trim().length + 25
    ).length,
    verifiedContentChars,
    completenessPct,
    resourceCoveragePct,
    status,
    statusReasons,
    needsVerification: verificationReasons.length > 0,
    verificationReasons,
    learnerProgressPct: progress?.readingProgressPct || 0,
    learnerCompleted: Boolean(progress?.completed),
    componentChecks,
    resourceChecks,
    applicableComponentsCount: applicableComponents.length,
    presentComponentsCount: presentComponents.length,
    partialComponentsCount: partialComponents.length,
    missingComponentsCount: missingComponents.length,
    applicableResourcesCount: applicableResources.length,
    connectedResourcesCount: connectedResources.length,
    totalLinkedResourceItems,
    gaps,
    subtopicsSummary: topic.subtopics.map((st) => ({
      id: st.id,
      title: st.title,
      summaryLength: st.summary?.length || 0,
      hasStructureLink: Boolean(st.linkedStructureId),
      hasEngineDetail: Boolean(st.linkedSubtopicId && ENGINE_SUBTOPICS[st.linkedSubtopicId])
    })),
    verificationSummary,
    quickActions
  };
}

function checkSubjectHierarchyIntegrity(
  subject: SyllabusSubjectNode,
  syllabus: SyllabusProfile
): string[] {
  const issues: string[] = [];
  if (subject.units.length === 0) {
    issues.push(`${subject.code}: Subject has 0 syllabus units defined.`);
  }
  if ((subject.objectives?.length || 0) === 0) {
    issues.push(`${subject.code}: Missing course objectives list.`);
  }
  if ((subject.references?.length || 0) === 0) {
    issues.push(`${subject.code}: Missing syllabus textbook reference bibliography.`);
  }

  for (const u of subject.units) {
    if (u.topics.length === 0) {
      issues.push(`${subject.code} ${u.unitNo}: Unit contains 0 topics.`);
    }
    for (const t of u.topics) {
      if (t.subtopics.length === 0) {
        issues.push(`${subject.code} ${u.unitNo} · ${t.title}: No subtopics defined.`);
      }
    }
  }

  // Verify against official B.Pharm Sem I syllabus structure when auditing the official profile
  if (syllabus.id === OFFICIAL_BPHARM_SEM1_SYLLABUS_ID) {
    const officialCourse = SYLLABUS_COURSES.find(
      (c) => c.courseCode.toUpperCase() === subject.code.toUpperCase()
    );
    if (!officialCourse) {
      issues.push(`${subject.code}: Subject not found in SYLLABUS_COURSES official PDF catalog.`);
    } else if (officialCourse.kind === 'theory' && officialCourse.units) {
      for (const officialUnit of officialCourse.units) {
        const expectedUnitNo = `Unit ${officialUnit.unitNo}`;
        const matchedUnit = subject.units.find((u) => u.unitNo === expectedUnitNo);
        if (!matchedUnit) {
          issues.push(`${subject.code}: Missing official syllabus ${expectedUnitNo}.`);
        }
      }
    } else if (officialCourse.kind === 'practical' && officialCourse.practicalBlocks) {
      const expectedItemsCount = officialCourse.practicalBlocks.reduce(
        (sum, b) => sum + (b.items?.length || 0),
        0
      );
      const actualSubtopicsCount = subject.units.reduce(
        (sum, u) => sum + u.topics.reduce((s, t) => s + t.subtopics.length, 0),
        0
      );
      if (actualSubtopicsCount < expectedItemsCount) {
        issues.push(
          `${subject.code}: Practical schedule lists ${actualSubtopicsCount}/${expectedItemsCount} official practical items.`
        );
      }
    }
  }

  return issues;
}

export async function loadAnalyzerInputs(): Promise<AnalyzerRawInputs> {
  const resourceHubState = loadResourceHubState();
  const [
    syllabi,
    acquiredResources,
    topicProgress,
    storedQuestions,
    questionPapers,
    references,
    books,
    visuals,
    assets3d,
    topicEnrichments,
    topicVerifications
  ] = await Promise.all([
    getAllSyllabi(),
    getAllAcquiredResources(),
    getAllTopicProgress(),
    getAllStoredQuestions(),
    getAllQuestionPapers(),
    getAllReferences(),
    getAllBooks(),
    getAllVisuals(),
    getAll3DAssets(),
    getAllTopicEnrichments(),
    getAllTopicVerifications()
  ]);

  return {
    syllabi,
    acquiredResources,
    topicProgress,
    storedQuestions,
    questionPapers,
    references,
    books,
    visuals,
    assets3d,
    resourceHubSaved: resourceHubState.savedRecords || [],
    topicEnrichments,
    topicVerifications
  };
}

export function analyzeSyllabusCoverage(inputs: AnalyzerRawInputs): CoverageAuditReport {
  const assetIdSet = new Set(inputs.assets3d.map((a) => a.id));

  const courses: CourseCoverageReport[] = inputs.syllabi.map((syllabus) => {
    const courseHierarchyIssues: string[] = [];

    if (syllabus.id === OFFICIAL_BPHARM_SEM1_SYLLABUS_ID) {
      for (const officialCourse of SYLLABUS_COURSES) {
        if (!syllabus.subjects.some((s) => s.code === officialCourse.courseCode)) {
          courseHierarchyIssues.push(
            `Missing official B.Pharm Sem I course: ${officialCourse.courseCode} (${officialCourse.courseTitle}).`
          );
        }
      }
    }

    const subjects: SubjectCoverageReport[] = syllabus.subjects.map((subject) => {
      const subjectHierarchyIssues = checkSubjectHierarchyIntegrity(subject, syllabus);
      courseHierarchyIssues.push(...subjectHierarchyIssues);

      const units: UnitCoverageReport[] = subject.units.map((unit) => {
        const topicReports = unit.topics.map((topic) =>
          analyzeSingleTopic(topic, subject, syllabus, inputs, assetIdSet)
        );

        const topicCount = topicReports.length;
        const unitCompleteness = topicCount
          ? Math.round(topicReports.reduce((s, t) => s + t.completenessPct, 0) / topicCount)
          : 0;
        const unitResourcePct = topicCount
          ? Math.round(topicReports.reduce((s, t) => s + t.resourceCoveragePct, 0) / topicCount)
          : 0;

        const unitGaps = topicReports.flatMap((t) => t.gaps);

        return {
          id: unit.id,
          subjectId: subject.id,
          subjectCode: subject.code,
          unitNo: unit.unitNo,
          title: unit.title,
          lecturesLabel: unit.lecturesLabel,
          topicCount,
          subtopicCount: topicReports.reduce((s, t) => s + t.subtopicCount, 0),
          completenessPct: unitCompleteness,
          resourceCoveragePct: unitResourcePct,
          completeCount: topicReports.filter((t) => t.status === 'complete').length,
          substantiallyCompleteCount: topicReports.filter(
            (t) => t.status === 'substantially_complete'
          ).length,
          partiallyCompleteCount: topicReports.filter((t) => t.status === 'partially_complete')
            .length,
          minimalContentCount: topicReports.filter((t) => t.status === 'minimal_content').length,
          missingContentCount: topicReports.filter((t) => t.status === 'missing_content').length,
          needsVerificationCount: topicReports.filter((t) => t.status === 'needs_verification').length,
          gapCount: unitGaps.length,
          criticalGapCount: unitGaps.filter((g) => g.severity === 'critical').length,
          highGapCount: unitGaps.filter((g) => g.severity === 'high').length,
          topics: topicReports,
          priorityGaps: [...unitGaps].sort((a, b) => b.priorityScore - a.priorityScore)
        };
      });

      const allSubjectTopics = units.flatMap((u) => u.topics);
      const totalTopics = allSubjectTopics.length;
      const subjectGaps = units.flatMap((u) => u.priorityGaps);

      const hasResPresent = (t: TopicCoverageReport, key: ResourceCheckKey) => {
        const rc = t.resourceChecks.find((r) => r.key === key);
        return Boolean(rc && rc.applicable && (rc.status === 'present' || rc.status === 'partial'));
      };

      const isApplicableRes = (t: TopicCoverageReport, key: ResourceCheckKey) =>
        Boolean(t.resourceChecks.find((r) => r.key === key)?.applicable);

      const topicsWithAcademicContent = allSubjectTopics.filter(
        (t) => t.status === 'complete' || t.status === 'substantially_complete'
      ).length;
      const topicsWithNoContent = allSubjectTopics.filter(
        (t) => t.status === 'missing_content'
      ).length;
      const topicsWithIncompleteContent = totalTopics - topicsWithAcademicContent - topicsWithNoContent;

      const topicsWithVisuals = allSubjectTopics.filter(
        (t) =>
          hasResPresent(t, 'diagrams') ||
          hasResPresent(t, 'images') ||
          hasResPresent(t, 'microscopy_visuals')
      ).length;

      const applicableVisualTopicsCount = allSubjectTopics.filter(
        (t) =>
          isApplicableRes(t, 'diagrams') ||
          isApplicableRes(t, 'images') ||
          isApplicableRes(t, 'microscopy_visuals')
      ).length;

      const subjectCompleteness = totalTopics
        ? Math.round(allSubjectTopics.reduce((s, t) => s + t.completenessPct, 0) / totalTopics)
        : 0;
      const subjectResourcePct = totalTopics
        ? Math.round(allSubjectTopics.reduce((s, t) => s + t.resourceCoveragePct, 0) / totalTopics)
        : 0;

      const sortedSubjectGaps = [...subjectGaps].sort((a, b) => b.priorityScore - a.priorityScore);

      return {
        id: subject.id,
        courseId: syllabus.id,
        code: subject.code,
        title: subject.title,
        courseType: subject.courseType,
        credits: subject.credits,
        departmentId: subject.departmentId,
        totalUnits: units.length,
        totalTopics,
        totalSubtopics: allSubjectTopics.reduce((s, t) => s + t.subtopicCount, 0),
        topicsWithAcademicContent,
        topicsWithIncompleteContent,
        topicsWithNoContent,
        topicsNeedingVerification: allSubjectTopics.filter((t) => t.needsVerification).length,
        topicsWithReferences: allSubjectTopics.filter((t) => {
          const vs = t.resourceChecks.find((r) => r.key === 'verified_sources');
          const tb = t.resourceChecks.find((r) => r.key === 'textbooks');
          return (
            Boolean(vs && vs.applicable && vs.status === 'present') ||
            Boolean(tb && tb.applicable && tb.status === 'present')
          );
        }).length,
        topicsWithVisuals,
        topicsWith3DModels: allSubjectTopics.filter((t) => hasResPresent(t, 'models_3d')).length,
        topicsWithExperiments: allSubjectTopics.filter((t) => hasResPresent(t, 'experiments')).length,
        topicsWithSimulations: allSubjectTopics.filter((t) =>
          hasResPresent(t, 'interactive_simulations')
        ).length,
        topicsWithAssessments: allSubjectTopics.filter((t) => hasResPresent(t, 'mcqs')).length,
        topicsWithPyqs: allSubjectTopics.filter((t) => hasResPresent(t, 'pyqs')).length,
        applicableVisualTopicsCount,
        applicable3DTopicsCount: allSubjectTopics.filter((t) => isApplicableRes(t, 'models_3d'))
          .length,
        applicableExperimentTopicsCount: allSubjectTopics.filter((t) =>
          isApplicableRes(t, 'experiments')
        ).length,
        applicableSimulationTopicsCount: allSubjectTopics.filter((t) =>
          isApplicableRes(t, 'interactive_simulations')
        ).length,
        completenessPct: subjectCompleteness,
        resourceCoveragePct: subjectResourcePct,
        hierarchyIssues: subjectHierarchyIssues,
        units,
        gaps: sortedSubjectGaps,
        improvementChecklist: sortedSubjectGaps.slice(0, 12)
      };
    });

    const allTopics = subjects.flatMap((s) => s.units.flatMap((u) => u.topics));
    const totalTopics = allTopics.length;
    const allGaps = subjects
      .flatMap((s) => s.gaps)
      .sort((a, b) => b.priorityScore - a.priorityScore);

    const statusBreakdown: Record<CoverageStatus, number> = {
      complete: allTopics.filter((t) => t.status === 'complete').length,
      substantially_complete: allTopics.filter((t) => t.status === 'substantially_complete')
        .length,
      partially_complete: allTopics.filter((t) => t.status === 'partially_complete').length,
      minimal_content: allTopics.filter((t) => t.status === 'minimal_content').length,
      missing_content: allTopics.filter((t) => t.status === 'missing_content').length,
      needs_verification: allTopics.filter((t) => t.status === 'needs_verification').length
    };

    const gapSeverityBreakdown: Record<GapSeverity, number> = {
      critical: allGaps.filter((g) => g.severity === 'critical').length,
      high: allGaps.filter((g) => g.severity === 'high').length,
      medium: allGaps.filter((g) => g.severity === 'medium').length,
      low: allGaps.filter((g) => g.severity === 'low').length
    };

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 100);

    const totalVisualApplicable = subjects.reduce((s, x) => s + x.applicableVisualTopicsCount, 0);
    const totalVisualCovered = subjects.reduce((s, x) => s + x.topicsWithVisuals, 0);
    const total3DApplicable = subjects.reduce((s, x) => s + x.applicable3DTopicsCount, 0);
    const total3DCovered = subjects.reduce((s, x) => s + x.topicsWith3DModels, 0);
    const totalExpApplicable = subjects.reduce((s, x) => s + x.applicableExperimentTopicsCount, 0);
    const totalExpCovered = subjects.reduce((s, x) => s + x.topicsWithExperiments, 0);

    return {
      syllabusId: syllabus.id,
      courseLabel: syllabus.title,
      semesterLabel: `${syllabus.course} · ${syllabus.semester}`,
      university: syllabus.university,
      verificationStatus: syllabus.verificationStatus,
      isSystemOfficial: Boolean(syllabus.isSystemOfficial),
      totalSubjects: subjects.length,
      totalUnits: subjects.reduce((s, x) => s + x.totalUnits, 0),
      totalTopics,
      totalSubtopics: subjects.reduce((s, x) => s + x.totalSubtopics, 0),
      overallCompletenessPct: totalTopics
        ? Math.round(allTopics.reduce((s, t) => s + t.completenessPct, 0) / totalTopics)
        : 0,
      overallResourceCoveragePct: totalTopics
        ? Math.round(allTopics.reduce((s, t) => s + t.resourceCoveragePct, 0) / totalTopics)
        : 0,
      statusBreakdown,
      gapSeverityBreakdown,
      resourceBreakdown: {
        referencesPct: pct(
          subjects.reduce((s, x) => s + x.topicsWithReferences, 0),
          totalTopics
        ),
        visualsPct: pct(totalVisualCovered, totalVisualApplicable),
        models3dPct: pct(total3DCovered, total3DApplicable),
        experimentsPct: pct(totalExpCovered, totalExpApplicable),
        assessmentsPct: pct(
          subjects.reduce((s, x) => s + x.topicsWithAssessments, 0),
          totalTopics
        )
      },
      subjects,
      allGaps,
      priorityQueue: allGaps,
      hierarchyIssues: courseHierarchyIssues
    };
  });

  const sources: AuditDataSourcesSummary = {
    syllabiCount: inputs.syllabi.length,
    anatomyCatalogCount: ANATOMY_CATALOG.length,
    engineTopicsCount: Object.keys(ENGINE_TOPICS).length,
    engineSubtopicsCount: Object.keys(ENGINE_SUBTOPICS).length,
    referenceCatalogCount: inputs.references.length,
    localBooksCount: inputs.books.length,
    visualsCount: inputs.visuals.length,
    assets3dCount: inputs.assets3d.length,
    experimentsCatalogCount: Object.keys(EXPERIMENT_CATALOG).length,
    interactiveSimsCount: INTERACTIVE_EXPERIMENTS.length,
    curatedQuestionsCount: CURATED_REFERENCE_QUESTIONS.length,
    storedQuestionsCount: inputs.storedQuestions.length,
    importedPapersCount: inputs.questionPapers.length,
    acquiredResourcesCount: inputs.acquiredResources.length,
    resourceHubSavedCount: inputs.resourceHubSaved.length
  };

  return {
    auditId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    generatedAt: Date.now(),
    courses,
    sources
  };
}

export async function runSyllabusCoverageAudit(): Promise<CoverageAuditReport> {
  const inputs = await loadAnalyzerInputs();
  return analyzeSyllabusCoverage(inputs);
}
