import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FilePenLine,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Images,
  Info,
  Library,
  Loader2,
  NotebookPen,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  Trash2,
  XCircle
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import { ENGINE_SUBTOPICS, ENGINE_TOPICS } from '../../data/academicEngineRegistry';
import {
  ENRICHMENT_SECTION_BLUEPRINTS,
  PROVENANCE_LABELS
} from '../enrichment-workspace/sectionCatalog';
import { summarizeTopicVerification } from '../enrichment-workspace/claimVerificationEngine';
import {
  classifyAcquiredResourcePriority,
  SOURCE_PRIORITY_META
} from '../enrichment-workspace/sourcePolicy';
import { getAllReferences } from '../reference-center/referenceDb';
import { ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import ImageViewerModal from '../visual-library/ImageViewerModal';
import { VisualMediaItem } from '../visual-library/types';
import VisualThumbnail from '../visual-library/VisualThumbnail';
import Asset3DConnector from '../assets-3d/Asset3DConnector';
import { getAllVisuals } from '../visual-library/visualDb';
import {
  getBuiltInReferenceMatchesForTopic,
  runTopicContentAcquisition,
  TopicAcquisitionBundle
} from './contentAcquisition';
import {
  EXAM_CATEGORY_LABELS,
  EXAM_SOURCE_LABELS,
  getTopicExamEvidence,
  IMPORTANCE_LABEL_TEXT,
  matchQuestionsToTopic
} from './examEngine';
import {
  computeReadingProgress,
  createEmptyTopicProgress,
  createSavedConcept,
  getAcquiredResourcesForTopic,
  getTopicEnrichment,
  getTopicVerification,
  removeAcquiredResource,
  saveAcquiredResourcesForTopic,
  saveTopicStudyProgress
} from './studyDb';
import {
  AcquiredTopicResource,
  EnrichmentComparisonTable,
  EnrichmentDepthLevel,
  EnrichmentProvenance,
  EnrichmentQuestionEntry,
  EnrichmentSourceAttachment,
  ExamQuestionItem,
  ExamQuestionPaper,
  ResourceVerificationBadge,
  StudySectionKey,
  StudyWorkflowStep,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusTopicNode,
  TopicEnrichmentRecord,
  TopicStudyProgress,
  TopicVerificationRecord
} from './types';

interface TopicWorkspaceProps {
  syllabus: SyllabusProfile;
  subject: SyllabusSubjectNode;
  topic: SyllabusTopicNode;
  progress: TopicStudyProgress | undefined;
  onProgressUpdated: (next: TopicStudyProgress) => void;
  examQuestions: ExamQuestionItem[];
  examPapers: ExamQuestionPaper[];
  onOpenSubjectExamPrep: () => void;
  onAssets3DMutated?: () => void;
}

const SECTION_LABELS: Record<StudySectionKey, string> = {
  overview: 'Overview',
  definition: 'Definition',
  introduction: 'Introduction',
  fundamentals: 'Fundamentals',
  classification: 'Classification',
  anatomical_structure: 'Anatomical Structure',
  structure: 'Structural Organization',
  components: 'Key Components',
  functions: 'Functions',
  physiology: 'Physiology',
  mechanism: 'Mechanism & Pathway',
  explanation: 'Academic Explanation',
  examples: 'Examples',
  applications: 'Applications',
  clinical_significance: 'Clinical Significance',
  pharmaceutical_relevance: 'Pharmaceutical Relevance',
  advantages_limitations: 'Advantages & Limitations',
  important_concepts: 'Important Concepts',
  exam_essentials: 'Exam Essentials',
  summary: 'Summary',
  references: 'Verified References & Attribution'
};

const RESOURCE_BADGE_LABELS: Record<ResourceVerificationBadge, string> = {
  official_standard: 'Official Standard',
  peer_reviewed: 'Peer-Reviewed Literature',
  open_textbook: 'Open Textbook / Scientific Atlas',
  encyclopedic_open: 'Open Reference Summary (Verify with Textbook)',
  local_user: 'User-Added Reference',
  unverified: 'Unverified External Link'
};

function departmentIdToModuleId(deptId: SyllabusTopicNode['departmentId']): string {
  if (deptId === 'python') return 'python';
  if (deptId === 'general_pharmacy') return 'general_pharmacy';
  return deptId;
}

export default function TopicWorkspace({
  syllabus,
  subject,
  topic,
  progress,
  onProgressUpdated,
  examQuestions,
  examPapers,
  onOpenSubjectExamPrep,
  onAssets3DMutated
}: TopicWorkspaceProps) {
  const {
    openKnowledgeLibrary,
    openVisualLibrary,
    openResourceHub,
    openReferenceCenter,
    openAsset3DEngine,
    openEnrichmentWorkspace,
    navigateToModule
  } = useLibraryNavigation();

  const [activeTab, setActiveTab] = useState<'learn' | 'resources' | 'exam' | 'notes'>(() => {
    try {
      if (typeof sessionStorage === 'undefined') return 'learn';
      const raw = sessionStorage.getItem(`pharmlab_study_tab_${topic.id}`);
      if (raw === 'learn' || raw === 'resources' || raw === 'exam' || raw === 'notes') {
        return raw;
      }
    } catch {
      // ignore storage errors
    }
    return 'learn';
  });

  useEffect(() => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const saved = sessionStorage.getItem(`pharmlab_study_tab_${topic.id}`);
      if (saved === 'learn' || saved === 'resources' || saved === 'exam' || saved === 'notes') {
        setActiveTab(saved);
      } else {
        setActiveTab('learn');
      }
    } catch {
      setActiveTab('learn');
    }
  }, [topic.id]);

  const handleSetActiveTab = useCallback(
    (nextTab: 'learn' | 'resources' | 'exam' | 'notes') => {
      setActiveTab(nextTab);
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(`pharmlab_study_tab_${topic.id}`, nextTab);
        }
      } catch {
        // ignore storage errors
      }
    },
    [topic.id]
  );

  const subtopicTitles = useMemo(
    () => topic.subtopics.map((st) => st.title).filter(Boolean),
    [topic.subtopics]
  );
  const [acquiring, setAcquiring] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<StudyWorkflowStep[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [bundle, setBundle] = useState<TopicAcquisitionBundle>({
    acquiredResources: [],
    localPdfMatches: [],
    connectedVisualIds: [],
    connectedReferenceIds: [],
    warnings: []
  });

  const [allVisuals, setAllVisuals] = useState<VisualMediaItem[]>([]);
  const [allRefs, setAllRefs] = useState<ReferenceItem[]>([]);
  const [viewerVisual, setViewerVisual] = useState<VisualMediaItem | null>(null);
  const [enrichmentRecord, setEnrichmentRecord] = useState<TopicEnrichmentRecord | null>(null);
  const [verificationRecord, setVerificationRecord] = useState<TopicVerificationRecord | null>(null);

  // Manual source fallback state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualSourceName, setManualSourceName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualExcerpt, setManualExcerpt] = useState('');

  // Personal study tools state
  const currentProgress: TopicStudyProgress = useMemo(
    () =>
      progress ||
      createEmptyTopicProgress({
        topicId: topic.id,
        syllabusId: syllabus.id,
        subjectCode: subject.code,
        topicTitle: topic.title
      }),
    [progress, topic.id, syllabus.id, subject.code, topic.title]
  );

  const [notesDraft, setNotesDraft] = useState(currentProgress.personalNotes);
  const [notesSavedMsg, setNotesSavedMsg] = useState<string | null>(null);
  const [conceptTitle, setConceptTitle] = useState('');
  const [conceptNote, setConceptNote] = useState('');

  // Exam card interaction state
  const [mcqPicks, setMcqPicks] = useState<Record<string, number>>({});
  const [revealedAns, setRevealedAns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setNotesDraft(currentProgress.personalNotes);
    setNotesSavedMsg(null);
  }, [topic.id, currentProgress.personalNotes]);

  useEffect(() => {
    let cancelled = false;
    setEnrichmentRecord(null);
    setVerificationRecord(null);
    Promise.all([
      getAllVisuals(),
      getAllReferences(),
      getAcquiredResourcesForTopic(topic.id),
      getTopicEnrichment(topic.id),
      getTopicVerification(topic.id)
    ])
      .then(([vis, refs, storedRes, enrichment, verification]) => {
        if (cancelled) return;
        setAllVisuals(vis);
        setAllRefs(refs);
        setEnrichmentRecord(enrichment);
        setVerificationRecord(verification);
        const sortedRes = [...storedRes].sort(
          (a, b) =>
            classifyAcquiredResourcePriority(a) - classifyAcquiredResourcePriority(b) ||
            b.savedAt - a.savedAt
        );
        setBundle((prev) => ({ ...prev, acquiredResources: sortedRes }));
      })
      .catch(() => {
        // ignore storage loading issues
      });
    return () => {
      cancelled = true;
    };
  }, [topic.id]);

  // Automatic local + online content acquisition when opening a topic without cached sources
  const triggerAcquisition = useCallback(
    async (queryOverride?: string) => {
      const controller = new AbortController();
      setAcquiring(true);
      try {
        const res = await runTopicContentAcquisition(topic, {
          onWorkflowUpdate: (steps) => setWorkflowSteps(steps),
          signal: controller.signal,
          customSearchTerm: queryOverride
        });
        setBundle(res);
      } finally {
        setAcquiring(false);
      }
      return () => controller.abort();
    },
    [topic]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setCustomQuery('');
    setWorkflowSteps([]);

    getAcquiredResourcesForTopic(topic.id).then((existing) => {
      if (!active) return;
      if (existing.length > 0) {
        // Still run lightweight local connection sync if we already have cached external items,
        // or show cached immediately
        setBundle((prev) => ({ ...prev, acquiredResources: existing }));
      }
      // Run acquisition automatically in background so visuals, PDFs, references & open textbooks connect
      setAcquiring(true);
      runTopicContentAcquisition(topic, {
        onWorkflowUpdate: (steps) => {
          if (active) setWorkflowSteps(steps);
        },
        signal: controller.signal
      })
        .then((res) => {
          if (active) setBundle(res);
        })
        .catch(() => {
          // ignore abort
        })
        .finally(() => {
          if (active) setAcquiring(false);
        });
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [topic]);

  // Connected Anatomy Structures & Engine Subtopics
  const linkedStructures = useMemo(() => {
    const ids = new Set<string>(topic.linkedStructureIds || []);
    topic.subtopics.forEach((st) => {
      if (st.linkedStructureId) ids.add(st.linkedStructureId);
    });
    return ANATOMY_CATALOG.filter((s) => ids.has(s.id));
  }, [topic]);

  const linkedEngineTopic = topic.linkedEngineTopicId
    ? ENGINE_TOPICS[topic.linkedEngineTopicId]
    : undefined;

  const linkedEngineSubtopics = useMemo(() => {
    const out = new Set<string>(linkedEngineTopic?.subtopicIds || []);
    topic.subtopics.forEach((st) => {
      if (st.linkedSubtopicId) out.add(st.linkedSubtopicId);
    });
    return Array.from(out)
      .map((id) => ENGINE_SUBTOPICS[id])
      .filter(Boolean);
  }, [linkedEngineTopic, topic.subtopics]);

  const connectedVisuals = useMemo(() => {
    const ids = new Set<string>(bundle.connectedVisualIds);
    linkedStructures.forEach((s) => s.visualIds.forEach((vid) => ids.add(vid)));
    linkedEngineSubtopics.forEach((sub) => sub.visualIds.forEach((vid) => ids.add(vid)));
    return allVisuals.filter((v) => ids.has(v.id));
  }, [allVisuals, bundle.connectedVisualIds, linkedStructures, linkedEngineSubtopics]);

  const connectedReferences = useMemo(() => {
    const idSet = new Set(bundle.connectedReferenceIds);
    return allRefs.filter((r) => idSet.has(r.id));
  }, [allRefs, bundle.connectedReferenceIds]);

  const builtInTextbooks = useMemo(() => getBuiltInReferenceMatchesForTopic(topic), [topic]);

  const topicQuestions = useMemo(
    () => matchQuestionsToTopic(topic, examQuestions),
    [topic, examQuestions]
  );

  const examEvidence = useMemo(
    () => getTopicExamEvidence(topic, examQuestions, examPapers),
    [topic, examQuestions, examPapers]
  );

  // Adaptive Section Content Builder (Structured from Syllabus + Anatomy Catalog + Engine + Acquired Open Textbooks + P4.2.1 Enrichments)
  const adaptiveSections = useMemo(() => {
    const primaryStruct = linkedStructures[0];
    const primaryEngineSub = linkedEngineSubtopics[0];
    const openRefExcerpts = bundle.acquiredResources
      .filter((r) => Boolean(r.excerpt))
      .slice(0, 6);

    type SectionBlock = {
      heading?: string;
      body: string;
      sourceTag?: string;
      provenance?: EnrichmentProvenance;
    };

    type RenderedSection = {
      key: StudySectionKey;
      label: string;
      blocks: SectionBlock[];
      bullets: string[];
      formulas: string[];
      comparisonTables: EnrichmentComparisonTable[];
      enrichedQuestions: EnrichmentQuestionEntry[];
      attachments: EnrichmentSourceAttachment[];
      provenances: EnrichmentProvenance[];
      depths: EnrichmentDepthLevel[];
    };

    const sectionList: RenderedSection[] = topic.recommendedSections.map((key) => {
      const blocks: SectionBlock[] = [];
      const bullets: string[] = [];

      if (key === 'overview') {
        blocks.push({
          body: primaryStruct?.overview || primaryEngineSub?.summary || topic.summary,
          sourceTag: primaryStruct ? `Anatomy Catalog #${primaryStruct.catalogNumber}` : `${subject.code} Syllabus`
        });
        const wikiOrText = openRefExcerpts.find(
          (r) => r.suggestedSection === 'overview' || r.providerId === 'wikipedia' || r.providerId === 'openstax'
        );
        if (wikiOrText?.excerpt) {
          blocks.push({
            heading: wikiOrText.title,
            body: wikiOrText.excerpt,
            sourceTag: `${wikiOrText.sourceName} · ${RESOURCE_BADGE_LABELS[wikiOrText.verificationStatus]}`
          });
        }
      } else if (key === 'definition') {
        if (primaryStruct?.definition) {
          blocks.push({
            body: primaryStruct.definition,
            sourceTag: `Anatomy Catalog · ${primaryStruct.name}`
          });
        } else if (topic.subtopics[0]?.summary) {
          blocks.push({
            body: topic.subtopics[0].summary,
            sourceTag: `${subject.code} ${topic.unitNo}`
          });
        }
      } else if (key === 'introduction' || key === 'fundamentals') {
        if (subject.objectives.length > 0 && key === 'fundamentals') {
          subject.objectives.slice(0, 3).forEach((obj) => bullets.push(obj));
        }
        topic.subtopics.slice(0, 4).forEach((st) => {
          bullets.push(st.summary || st.title);
        });
      } else if (key === 'anatomical_structure' || key === 'structure') {
        if (primaryStruct?.anatomicalLocation) {
          blocks.push({
            heading: 'Anatomical Location',
            body: primaryStruct.anatomicalLocation,
            sourceTag: primaryStruct.name
          });
        }
        if (primaryStruct?.structure || primaryEngineSub?.structureNotes) {
          blocks.push({
            heading: 'Structural Organization',
            body: primaryStruct?.structure || primaryEngineSub?.structureNotes || '',
            sourceTag: primaryEngineSub ? 'Academic Engine' : primaryStruct?.name
          });
        }
      } else if (key === 'components') {
        if (primaryStruct?.components && primaryStruct.components.length > 0) {
          primaryStruct.components.forEach((c) => bullets.push(`${c.name}: ${c.role}`));
        } else {
          topic.subtopics.forEach((st) =>
            bullets.push(st.summary && st.summary !== st.title ? `${st.title} — ${st.summary}` : st.title)
          );
        }
      } else if (key === 'functions') {
        const fns = primaryStruct?.functions || primaryEngineSub?.functions || [];
        fns.forEach((fn) => bullets.push(fn));
      } else if (key === 'physiology') {
        if (primaryStruct?.physiology || primaryEngineSub?.physiologyNotes) {
          blocks.push({
            body: primaryStruct?.physiology || primaryEngineSub?.physiologyNotes || '',
            sourceTag: primaryStruct ? primaryStruct.name : 'Academic Engine'
          });
        }
      } else if (key === 'classification' || key === 'examples' || key === 'applications') {
        topic.subtopics.forEach((st) => {
          bullets.push(st.summary || st.title);
        });
      } else if (key === 'mechanism' || key === 'explanation') {
        if (primaryEngineSub?.anatomyNotes) {
          blocks.push({ body: primaryEngineSub.anatomyNotes, sourceTag: 'Academic Engine' });
        }
        if (primaryEngineSub?.physiologyNotes) {
          blocks.push({ body: primaryEngineSub.physiologyNotes, sourceTag: 'Academic Engine' });
        }
        openRefExcerpts
          .filter((r) => r.suggestedSection === key || r.resourceKind === 'textbook_chapter')
          .slice(0, 2)
          .forEach((r) => {
            if (r.excerpt) {
              blocks.push({
                heading: r.title,
                body: r.excerpt,
                sourceTag: `${r.sourceName} (${r.accessDate})`
              });
            }
          });
        if (blocks.length === 0 && topic.subtopics.length > 0) {
          topic.subtopics.forEach((st) => bullets.push(st.summary || st.title));
        }
      } else if (key === 'clinical_significance') {
        primaryStruct?.clinicalSignificance?.forEach((c) => bullets.push(c));
      } else if (key === 'pharmaceutical_relevance') {
        primaryStruct?.pharmaceuticalRelevance?.forEach((p) => bullets.push(p));
        if (bullets.length === 0 && subject.outcomes.length > 0) {
          subject.outcomes.slice(0, 3).forEach((co) => bullets.push(`CO${co.no}: ${co.statement}`));
        }
      } else if (key === 'important_concepts' || key === 'summary' || key === 'advantages_limitations') {
        if (topic.subtopics.length > 0) {
          topic.subtopics.slice(0, 6).forEach((st) => bullets.push(st.summary || st.title));
        } else {
          blocks.push({ body: topic.summary });
        }
      } else if (key === 'exam_essentials') {
        primaryStruct?.examEssentials?.forEach((ex) => bullets.push(ex));
        if (topicQuestions.length > 0) {
          bullets.push(
            `${topicQuestions.length} mapped exam question(s) available in the Topic Exam Prep tab (${examEvidence.labels
              .map((l) => IMPORTANCE_LABEL_TEXT[l])
              .join(', ') || 'Practice ready'}).`
          );
        }
      } else if (key === 'references') {
        subject.references.slice(0, 6).forEach((ref) => bullets.push(ref));
        builtInTextbooks.forEach((tb) =>
          bullets.push(`${tb.title} — ${tb.authors} (${tb.editionNote})`)
        );
      }

      return {
        key,
        label: SECTION_LABELS[key],
        blocks: blocks.filter((b) => b.body.trim().length > 0),
        bullets: Array.from(new Set(bullets.filter((b) => b.trim().length > 0))),
        formulas: [],
        comparisonTables: [],
        enrichedQuestions: [],
        attachments: [],
        provenances: [],
        depths: []
      };
    });

    // Additive non-destructive merge of approved P4.2.1 / P4.2.2 Enriched Sections
    if (enrichmentRecord?.approvedSections) {
      const sectionMap = new Map<StudySectionKey, RenderedSection>();
      sectionList.forEach((sec) => sectionMap.set(sec.key, sec));

      for (const blueprint of ENRICHMENT_SECTION_BLUEPRINTS) {
        const entry = enrichmentRecord.approvedSections[blueprint.key];
        if (!entry) continue;

        const targetKey = blueprint.studySectionKey;
        let targetSec = sectionMap.get(targetKey);
        if (!targetSec) {
          targetSec = {
            key: targetKey,
            label: SECTION_LABELS[targetKey] || entry.label,
            blocks: [],
            bullets: [],
            formulas: [],
            comparisonTables: [],
            enrichedQuestions: [],
            attachments: [],
            provenances: [],
            depths: []
          };
          sectionMap.set(targetKey, targetSec);
          sectionList.push(targetSec);
        }

        const provMeta = PROVENANCE_LABELS[entry.provenance];
        if (!targetSec.provenances.includes(entry.provenance)) {
          targetSec.provenances.push(entry.provenance);
        }
        if (entry.depth && !targetSec.depths.includes(entry.depth)) {
          targetSec.depths.push(entry.depth);
        }

        if (entry.prose.trim()) {
          targetSec.blocks.push({
            heading: entry.label !== targetSec.label ? entry.label : 'Enriched Academic Content',
            body: entry.prose.trim(),
            sourceTag:
              entry.attachments.length > 0
                ? `${provMeta.label} · ${entry.attachments.map((a) => a.title).slice(0, 2).join('; ')}`
                : provMeta.label,
            provenance: entry.provenance
          });
        }

        for (const bullet of entry.bullets) {
          const clean = bullet.trim();
          if (clean && !targetSec.bullets.includes(clean)) {
            targetSec.bullets.push(clean);
          }
        }

        for (const formula of entry.formulas || []) {
          const clean = formula.trim();
          if (clean && !targetSec.formulas.includes(clean)) {
            targetSec.formulas.push(clean);
          }
        }

        if (
          entry.comparisonTable &&
          entry.comparisonTable.headers.length >= 2 &&
          entry.comparisonTable.rows.length > 0
        ) {
          targetSec.comparisonTables.push(entry.comparisonTable);
        }

        for (const q of entry.importantQuestions || []) {
          if (!targetSec.enrichedQuestions.some((eq) => eq.id === q.id)) {
            targetSec.enrichedQuestions.push(q);
          }
        }

        for (const att of entry.attachments || []) {
          if (!targetSec.attachments.some((a) => a.id === att.id)) {
            targetSec.attachments.push(att);
          }
        }
      }
    }

    return sectionList;
  }, [
    topic,
    subject,
    linkedStructures,
    linkedEngineSubtopics,
    bundle.acquiredResources,
    topicQuestions.length,
    examEvidence.labels,
    builtInTextbooks,
    enrichmentRecord
  ]);

  const handleToggleSectionRead = async (secKey: StudySectionKey) => {
    const exists = currentProgress.sectionsVisited.includes(secKey);
    const nextVisited = exists
      ? currentProgress.sectionsVisited.filter((s) => s !== secKey)
      : [...currentProgress.sectionsVisited, secKey];
    const nextPct = computeReadingProgress(
      nextVisited,
      topic.recommendedSections.length,
      currentProgress.completed
    );
    const updated = await saveTopicStudyProgress({
      ...currentProgress,
      sectionsVisited: nextVisited,
      readingProgressPct: nextPct
    });
    onProgressUpdated(updated);
  };

  const handleToggleCompleted = async () => {
    const nextCompleted = !currentProgress.completed;
    const nextPct = computeReadingProgress(
      currentProgress.sectionsVisited,
      topic.recommendedSections.length,
      nextCompleted
    );
    const updated = await saveTopicStudyProgress({
      ...currentProgress,
      completed: nextCompleted,
      readingProgressPct: nextPct
    });
    onProgressUpdated(updated);
  };

  const handleToggleBookmark = async () => {
    const updated = await saveTopicStudyProgress({
      ...currentProgress,
      bookmarked: !currentProgress.bookmarked
    });
    onProgressUpdated(updated);
  };

  const handleSaveNotes = async () => {
    const updated = await saveTopicStudyProgress({
      ...currentProgress,
      personalNotes: notesDraft
    });
    onProgressUpdated(updated);
    setNotesSavedMsg('Saved locally');
  };

  const handleAddConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptTitle.trim() || !conceptNote.trim()) return;
    const concept = createSavedConcept(conceptTitle, conceptNote, `${subject.code} · ${topic.title}`);
    const updated = await saveTopicStudyProgress({
      ...currentProgress,
      savedConcepts: [concept, ...currentProgress.savedConcepts]
    });
    onProgressUpdated(updated);
    setConceptTitle('');
    setConceptNote('');
  };

  const handleDeleteConcept = async (conceptId: string) => {
    const updated = await saveTopicStudyProgress({
      ...currentProgress,
      savedConcepts: currentProgress.savedConcepts.filter((c) => c.id !== conceptId)
    });
    onProgressUpdated(updated);
  };

  const handleAddManualResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    const cleanUrl = sanitizeHttpUrl(manualUrl) || '#';
    const item: AcquiredTopicResource = {
      id: `acq_manual_${topic.id}_${Date.now()}`,
      topicId: topic.id,
      title: manualTitle.trim(),
      providerId: 'local_user',
      sourceName: manualSourceName.trim() || 'User-Provided Academic Reference',
      sourceUrl: cleanUrl,
      license: 'User-curated study link',
      accessDate: new Date().toISOString().slice(0, 10),
      verificationStatus: cleanUrl === '#' ? 'local_user' : 'unverified',
      resourceKind: 'open_reference',
      excerpt: manualExcerpt.trim() || undefined,
      suggestedSection: 'explanation',
      savedAt: Date.now()
    };
    await saveAcquiredResourcesForTopic([item]);
    setBundle((prev) => ({
      ...prev,
      acquiredResources: [item, ...prev.acquiredResources]
    }));
    setManualTitle('');
    setManualSourceName('');
    setManualUrl('');
    setManualExcerpt('');
    setShowManualForm(false);
  };

  const handleRemoveAcquired = async (id: string) => {
    await removeAcquiredResource(id);
    setBundle((prev) => ({
      ...prev,
      acquiredResources: prev.acquiredResources.filter((r) => r.id !== id)
    }));
  };

  const deptModuleId = departmentIdToModuleId(topic.departmentId);

  return (
    <div className="space-y-5">
      {/* Focused Topic Header */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {syllabus.course} · {syllabus.semester} · {subject.code} · {topic.unitNo}
              {topic.lecturesLabel ? ` · ${topic.lecturesLabel}` : ''}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {topic.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {syllabus.verificationStatus === 'official_syllabus'
                ? 'Official Syllabus Topic'
                : syllabus.verificationStatus === 'university_specific'
                ? `University Syllabus (${syllabus.university})`
                : syllabus.verificationStatus === 'imported_syllabus'
                ? 'Imported Syllabus Topic'
                : 'Unverified Syllabus Draft'}
              {' · '}
              Reading Progress: <strong className="tabular-nums">{currentProgress.readingProgressPct}%</strong>
              {examEvidence.labels.length > 0
                ? ` · ${examEvidence.labels
                    .slice(0, 2)
                    .map((l) => IMPORTANCE_LABEL_TEXT[l])
                    .join(' · ')}`
                : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${
                currentProgress.bookmarked
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${currentProgress.bookmarked ? 'fill-current' : ''}`} />
              <span>{currentProgress.bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleCompleted}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${
                currentProgress.completed
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentProgress.completed ? 'Completed' : 'Mark Complete'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openEnrichmentWorkspace({
                  syllabusId: syllabus.id,
                  subjectCode: subject.code,
                  topicId: topic.id,
                  returnTo: 'study_mode'
                })
              }
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <FilePenLine className="w-4 h-4" />
              <span>Enrich Topic</span>
            </button>

            {topic.linkedLabTab && (
              <button
                type="button"
                onClick={() =>
                  navigateToModule(
                    deptModuleId,
                    topic.linkedLabTab,
                    linkedStructures[0] ? { structureId: linkedStructures[0].id } : undefined
                  )
                }
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors"
              >
                <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Open Lab Bench</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-200 dark:border-slate-800">
          {[
            { id: 'learn', label: 'Structured Learning', icon: BookOpen },
            {
              id: 'resources',
              label: `Sources, Visuals & PDFs (${
                bundle.acquiredResources.length + connectedVisuals.length + bundle.localPdfMatches.length
              })`,
              icon: Globe
            },
            {
              id: 'exam',
              label: `Topic Exam Prep (${topicQuestions.length})`,
              icon: GraduationCap
            },
            {
              id: 'notes',
              label: `Notes & Concepts (${currentProgress.savedConcepts.length})`,
              icon: NotebookPen
            }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSetActiveTab(t.id as typeof activeTab)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === t.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 10-Step Content Acquisition Status Bar */}
      {(acquiring || workflowSteps.length > 0) && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              {acquiring ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                {acquiring
                  ? 'Acquiring legitimate academic sources & connecting libraries...'
                  : 'Academic Content Acquisition Workflow Complete'}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerAcquisition(customQuery.trim() || undefined);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Refine online search query..."
                className="min-h-[34px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={acquiring}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${acquiring ? 'animate-spin' : ''}`} />
                <span>Refresh Sources</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {workflowSteps.map((step, i) => (
              <div
                key={step.id}
                className={`p-2 rounded-lg border ${
                  step.status === 'done'
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-800 dark:text-slate-200'
                    : step.status === 'active'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <p className="font-semibold truncate">
                  {i + 1}. {step.label}
                </p>
                {step.detail && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {step.detail}
                  </p>
                )}
              </div>
            ))}
          </div>

          {bundle.warnings.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Source note: {bundle.warnings.join(' · ')}
            </p>
          )}
        </section>
      )}

      {/* TAB 1: STRUCTURED ADAPTIVE LEARNING */}
      {activeTab === 'learn' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 cols: Adaptive Sections */}
          <div className="lg:col-span-8 space-y-4">
            {adaptiveSections.map((sec) => {
              if (
                sec.blocks.length === 0 &&
                sec.bullets.length === 0 &&
                sec.formulas.length === 0 &&
                sec.comparisonTables.length === 0 &&
                sec.enrichedQuestions.length === 0
              ) {
                return null;
              }
              const isRead = currentProgress.sectionsVisited.includes(sec.key);
              return (
                <section
                  key={sec.key}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {sec.label}
                      </h2>
                      {(sec.provenances.length > 0 || sec.depths.length > 0) && (
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {sec.provenances
                            .map((prov) => PROVENANCE_LABELS[prov].label)
                            .join(' · ')}
                          {sec.depths.length > 0
                            ? ` · ${sec.depths
                                .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                                .join('/')} Depth`
                            : ''}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSectionRead(sec.key)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 transition-colors ${
                        isRead
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRead ? 'Read' : 'Mark Read'}</span>
                    </button>
                  </div>

                  {sec.blocks.map((blk, idx) => (
                    <div key={idx} className="space-y-1">
                      {blk.heading && (
                        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          {blk.heading}
                        </h3>
                      )}
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {blk.body}
                      </p>
                      {blk.sourceTag && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Source: {blk.sourceTag}
                        </p>
                      )}
                    </div>
                  ))}

                  {sec.bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {sec.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {sec.formulas.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Key Formulas &amp; Numericals
                      </p>
                      <div className="space-y-1.5">
                        {sec.formulas.map((f, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200"
                          >
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sec.comparisonTables.length > 0 && (
                    <div className="space-y-3 pt-1">
                      {sec.comparisonTables.map((tbl, tIdx) => (
                        <div key={tIdx} className="space-y-1.5">
                          {tbl.caption && (
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {tbl.caption}
                            </p>
                          )}
                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse">
                              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                                <tr>
                                  {tbl.headers.map((h, hIdx) => (
                                    <th
                                      key={hIdx}
                                      className="px-3 py-2 font-semibold border-b border-slate-200 dark:border-slate-800"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {tbl.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="text-slate-700 dark:text-slate-300">
                                    {tbl.headers.map((_, cIdx) => (
                                      <td key={cIdx} className="px-3 py-2 align-top">
                                        {row[cIdx] || '—'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.enrichedQuestions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Important Exam Questions
                      </p>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/70">
                        {sec.enrichedQuestions.map((q) => (
                          <div key={q.id} className="p-3 space-y-1">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              {q.prompt}
                              {q.marks ? (
                                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                                  ({q.marks} marks)
                                </span>
                              ) : null}
                            </p>
                            {q.answerGuidance && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {q.answerGuidance}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sec.attachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Attached Section Sources (Ordered by Priority)
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {[...sec.attachments]
                          .sort((a, b) => (a.priorityTier || 3) - (b.priorityTier || 3))
                          .map((att) => (
                            <li key={att.id} className="flex items-center justify-between gap-2">
                              <span className="truncate">
                                · {att.priorityTier ? `[P${att.priorityTier}] ` : ''}
                                {att.title}
                                {att.subtitle ? ` (${att.subtitle})` : ''}
                              </span>
                              {att.bookId && att.pageNumber && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openKnowledgeLibrary({
                                      bookId: att.bookId!,
                                      pageNumber: att.pageNumber!,
                                      searchQuery: topic.title
                                    })
                                  }
                                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline shrink-0"
                                >
                                  Open p.{att.pageNumber}
                                </button>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Right 4 cols: Inline Connected Visuals, Anatomy Structures & PDFs */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Connected Visuals */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Images className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Connected Visual Plates ({connectedVisuals.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => openVisualLibrary({ query: topic.title })}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Browse Atlas
                </button>
              </div>

              {connectedVisuals.length > 0 ? (
                <div className="space-y-2.5">
                  {connectedVisuals.slice(0, 3).map((vis) => (
                    <button
                      key={vis.id}
                      type="button"
                      onClick={() => setViewerVisual(vis)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden text-left group block"
                    >
                      <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-900 overflow-hidden">
                        <VisualThumbnail
                          item={vis}
                          className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                          {vis.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {vis.sourceName} · Inspect pins &amp; zoom
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No local diagram matched automatically. Open the Visual Library to attach or search Wikimedia plates.
                </p>
              )}
            </section>

            {/* Connected Anatomy Structures */}
            {linkedStructures.length > 0 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Linked Anatomy Explorer Entries
                </h3>
                <div className="space-y-2">
                  {linkedStructures.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        navigateToModule('anatomy', 'explorer', { structureId: st.id })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-2 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          #{st.catalogNumber} {st.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {st.scientificName || st.primaryCategory}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Connected PDF Knowledge Library & Reference Center */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Library className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>PDF &amp; Reference Links</span>
                </h3>
                <button
                  type="button"
                  onClick={() => openKnowledgeLibrary({ searchQuery: topic.title })}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Open PDFs
                </button>
              </div>

              {verificationRecord && verificationRecord.claims.length > 0 && (() => {
                const vs = summarizeTopicVerification(verificationRecord);
                const supported = vs.textbookSupportedCount + vs.multipleBooksCount;
                return (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Textbook Verification
                      </span>
                      <span
                        className={`font-bold tabular-nums ${
                          vs.conflictingCount > 0
                            ? 'text-rose-700 dark:text-rose-400'
                            : supported > 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {supported}/{vs.totalClaims} claims backed
                      </span>
                    </div>
                    {vs.conflictingCount > 0 && (
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        {vs.conflictingCount} claim(s) flagged for conflicting textbook evidence.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        openEnrichmentWorkspace({
                          syllabusId: syllabus.id,
                          subjectCode: subject.code,
                          topicId: topic.id,
                          returnTo: 'study_mode'
                        })
                      }
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      Inspect Claims &amp; Textbook Passages →
                    </button>
                  </div>
                );
              })()}

              {bundle.localPdfMatches.length > 0 ? (
                <div className="space-y-2">
                  {bundle.localPdfMatches.map((m, idx) => (
                    <button
                      key={`${m.bookId}_${m.pageNumber}_${idx}`}
                      type="button"
                      onClick={() =>
                        openKnowledgeLibrary({
                          bookId: m.bookId,
                          pageNumber: m.pageNumber,
                          searchQuery: m.matchedTerm
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left space-y-1"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.priorityTier ? `[P${m.priorityTier}] ` : ''}
                        {m.bookTitle} · Page {m.pageNumber}
                      </p>
                      {(m.chapterHeading || m.edition) && (
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                          {[m.chapterHeading, m.edition].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {m.snippet}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No uploaded PDF pages matched &ldquo;{topic.title}&rdquo;. Upload textbooks in Knowledge Library for page-level linking.
                </p>
              )}

              {connectedReferences.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Reference Center Matches</span>
                  </p>
                  {connectedReferences.slice(0, 4).map((ref) => (
                    <button
                      key={ref.id}
                      type="button"
                      onClick={() => openReferenceCenter({ referenceId: ref.id })}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/5 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 truncate block"
                    >
                      {ref.title}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <Asset3DConnector
              workspaceDepartment={topic.departmentId}
              syllabusId={syllabus.id}
              course={syllabus.course}
              subjectCode={subject.code}
              subjectTitle={subject.title}
              unitId={topic.unitId}
              unitNo={topic.unitNo}
              unitTitle={topic.unitTitle}
              topicId={topic.id}
              topicTitle={topic.title}
              subtopics={subtopicTitles}
              subjectObjectives={subject.objectives}
              learningDomainMode={topic.domainMode}
              linkedStructureIds={topic.linkedStructureIds}
              structureId={linkedStructures[0]?.id}
              structureName={linkedStructures[0]?.name}
              defaultSearchQuery={topic.title}
              defaultCategory={topic.departmentId === 'anatomy' ? 'anatomy' : 'other'}
              title="3D Scientific Models"
              subtitle={`GLB / glTF / STL assets linked to ${topic.title}`}
              onAssetsMutated={onAssets3DMutated}
            />
          </aside>
        </div>
      )}

      {/* TAB 2: ACQUIRED SOURCES, VERIFICATION & LIBRARIES */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Discovered Academic Sources &amp; Open References ({bundle.acquiredResources.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ordered strictly by Textbook-First Scientific Source Policy: Priority 1 (Textbooks &amp; Official Standards) → Priority 2 (Academic Monographs / OpenStax / NCBI Bookshelf) → Priority 3 (PubMed / PMC / Europe PMC) → Priority 4 (Supplementary Web / Wikipedia — never overrides textbooks).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openResourceHub({
                    query: topic.title,
                    context: {
                      id: `study_topic:${topic.id}`,
                      kind: 'topic',
                      label: `${subject.code} · ${topic.title}`,
                      departmentId: topic.departmentId === 'python' ? 'python' : topic.departmentId,
                      moduleId: deptModuleId
                    }
                  })
                }
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open in Resource Hub</span>
              </button>
              <button
                type="button"
                onClick={() => openAsset3DEngine({ tab: 'discover', query: topic.title })}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5"
              >
                <Box className="w-3.5 h-3.5 text-emerald-600" />
                <span>Discover 3D Models</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManualForm((v) => !v)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Manual Reference</span>
              </button>
            </div>
          </div>

          <Asset3DConnector
            workspaceDepartment={topic.departmentId}
            syllabusId={syllabus.id}
            course={syllabus.course}
            subjectCode={subject.code}
            subjectTitle={subject.title}
            unitId={topic.unitId}
            unitNo={topic.unitNo}
            unitTitle={topic.unitTitle}
            topicId={topic.id}
            topicTitle={topic.title}
            subtopics={subtopicTitles}
            subjectObjectives={subject.objectives}
            learningDomainMode={topic.domainMode}
            linkedStructureIds={topic.linkedStructureIds}
            structureId={linkedStructures[0]?.id}
            structureName={linkedStructures[0]?.name}
            defaultSearchQuery={topic.title}
            defaultCategory={topic.departmentId === 'anatomy' ? 'anatomy' : 'other'}
            title="Topic 3D Scientific Models"
            subtitle={`Attach or inspect interactive 3D models for ${subject.code} · ${topic.title}`}
            onAssetsMutated={onAssets3DMutated}
          />

          {showManualForm && (
            <form
              onSubmit={handleAddManualResource}
              className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add User-Provided Reference or External University Note
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Resource Title *"
                  className="min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={manualSourceName}
                  onChange={(e) => setManualSourceName(e.target.value)}
                  placeholder="Source / Textbook / Author"
                  className="min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://... (optional)"
                  className="min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <textarea
                value={manualExcerpt}
                onChange={(e) => setManualExcerpt(e.target.value)}
                rows={3}
                placeholder="Key excerpt or factual summary..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  Save Reference
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs text-slate-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {bundle.acquiredResources.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {acquiring
                  ? 'Querying OpenStax, NCBI Bookshelf, Europe PMC, PubMed & Wikimedia...'
                  : 'No external references stored for this topic yet.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click &ldquo;Refresh Sources&rdquo; with a focused keyword (e.g. &ldquo;Nephron&rdquo;) or add a manual reference above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...bundle.acquiredResources]
                .sort(
                  (a, b) =>
                    classifyAcquiredResourcePriority(a) - classifyAcquiredResourcePriority(b)
                )
                .map((res) => {
                const safeUrl = sanitizeHttpUrl(res.sourceUrl);
                const safePdf = sanitizeHttpUrl(res.pdfUrl);
                const tier = classifyAcquiredResourcePriority(res);
                return (
                  <article
                    key={res.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span
                            className={
                              tier <= 2
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : tier === 3
                                ? 'text-teal-700 dark:text-teal-400'
                                : 'text-amber-700 dark:text-amber-300'
                            }
                          >
                            {SOURCE_PRIORITY_META[tier].shortLabel} · {RESOURCE_BADGE_LABELS[res.verificationStatus]}
                          </span>
                          {' · '}
                          {res.sourceName}
                          {res.publicationDate ? ` · ${res.publicationDate}` : ''}
                          {` · Accessed ${res.accessDate}`}
                        </p>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {res.title}
                        </h3>
                        {(res.authors || res.publisherOrJournal) && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {[res.authors, res.publisherOrJournal].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAcquired(res.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 shrink-0"
                        aria-label="Remove acquired resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {res.excerpt && (
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4">
                        {res.excerpt}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        License: {res.license}
                      </span>
                      <div className="flex items-center gap-3">
                        {safePdf && (
                          <a
                            href={safePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Open PDF</span>
                          </a>
                        )}
                        {safeUrl && (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Verify Original Source</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOPIC EXAM PREP */}
      {activeTab === 'exam' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Topic Examination Evidence &amp; Questions
              </h2>
              <button
                type="button"
                onClick={onOpenSubjectExamPrep}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Open Full {subject.code} Exam Intelligence &amp; Paper Importer</span>
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 leading-relaxed ${
                examEvidence.analysisLimited
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{examEvidence.limitationReason}</span>
            </div>
          </div>

          {topicQuestions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                No questions mapped directly to &ldquo;{topic.title}&rdquo; yet.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Open Full {subject.code} Exam Intelligence above to browse all subject questions or import your university&apos;s previous-year question papers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topicQuestions.map((q) => {
                const picked = mcqPicks[q.id];
                const revealed = Boolean(revealedAns[q.id]);
                return (
                  <article
                    key={q.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {EXAM_CATEGORY_LABELS[q.category]}
                      </span>
                      {' · '}
                      <span>{EXAM_SOURCE_LABELS[q.sourceType]}</span>
                      {q.marks ? ` · ${q.marks} Marks` : ''}
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {q.prompt}
                    </h3>
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, idx) => {
                          const isPicked = picked === idx;
                          const isCorrect = q.correctOptionIndex === idx;
                          const show = typeof picked === 'number' && typeof q.correctOptionIndex === 'number';
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setMcqPicks((p) => ({ ...p, [q.id]: idx }))}
                              className={`min-h-[40px] px-3 py-2 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-2 ${
                                show && isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500 font-semibold text-emerald-900 dark:text-emerald-200'
                                  : show && isPicked && !isCorrect
                                  ? 'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>
                                {String.fromCharCode(65 + idx)}. {opt}
                              </span>
                              {show && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                              {show && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{q.sourceAttribution}</span>
                      <button
                        type="button"
                        onClick={() => setRevealedAns((p) => ({ ...p, [q.id]: !p[q.id] }))}
                        className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"
                      >
                        <span>{revealed ? 'Hide Answer' : 'Show Answer'}</span>
                        {revealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {revealed && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {q.answerGuidance}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PERSONAL NOTES & SAVED CONCEPTS */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Topic Notes Editor */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Topic Study Notes
              </h2>
              {notesSavedMsg && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {notesSavedMsg}
                </span>
              )}
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => {
                setNotesDraft(e.target.value);
                setNotesSavedMsg(null);
              }}
              rows={10}
              placeholder="Write exam formulas, mnemonics, textbook page citations, and clinical notes for this topic..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
            >
              Save Topic Notes Locally
            </button>
          </section>

          {/* Saved Key Concepts */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Saved Key Concepts &amp; Definitions ({currentProgress.savedConcepts.length})
            </h2>

            <form onSubmit={handleAddConcept} className="space-y-2.5">
              <input
                type="text"
                value={conceptTitle}
                onChange={(e) => setConceptTitle(e.target.value)}
                placeholder="Concept title (e.g. Glomerular Filtration Net Pressure)"
                className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              />
              <textarea
                value={conceptNote}
                onChange={(e) => setConceptNote(e.target.value)}
                rows={3}
                placeholder="Concise concept definition or formula..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Concept Card</span>
              </button>
            </form>

            {currentProgress.savedConcepts.length > 0 ? (
              <div className="space-y-2.5">
                {currentProgress.savedConcepts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</p>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {c.note}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteConcept(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 shrink-0"
                      aria-label="Delete saved concept"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save high-yield definitions or numerical formulas here for fast pre-exam revision.
              </p>
            )}
          </section>
        </div>
      )}

      {/* Inline Visual Viewer Modal */}
      {viewerVisual && (
        <ImageViewerModal
          item={viewerVisual}
          allVisuals={connectedVisuals.length > 0 ? connectedVisuals : allVisuals}
          onClose={() => setViewerVisual(null)}
          onSelectVisual={(next) => setViewerVisual(next)}
        />
      )}
    </div>
  );
}
