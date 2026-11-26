import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  FileCheck2,
  History,
  KeyRound,
  Layers,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table2,
  Trash2,
  Wand2,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { runSyllabusCoverageAudit } from '../coverage-analyzer/analyzerEngine';
import {
  compareAuditSnapshots,
  createSnapshotFromCourseReport,
  loadAuditSnapshots,
  saveAuditSnapshot
} from '../coverage-analyzer/auditHistoryStorage';
import { CoverageAuditReport, TopicCoverageReport } from '../coverage-analyzer/types';
import { CoverageStatusInline, MetricBar } from '../coverage-analyzer/uiHelpers';
import { CURATED_REFERENCE_QUESTIONS, matchQuestionsToTopic } from '../study-mode/examEngine';
import {
  getAcquiredResourcesForTopic,
  getAllStoredQuestions,
  getAllSyllabi,
  getAllTopicEnrichments,
  getAllTopicVerifications,
  saveExamQuestions,
  saveTopicEnrichment
} from '../study-mode/studyDb';
import { OFFICIAL_BPHARM_SEM1_SYLLABUS_ID } from '../study-mode/syllabusBridge';
import {
  AcquiredTopicResource,
  EnrichedSectionDraft,
  EnrichedSectionEntry,
  EnrichmentComparisonTable,
  EnrichmentDepthLevel,
  EnrichmentHistoryEntry,
  EnrichmentOriginKind,
  EnrichmentProvenance,
  EnrichmentQuestionEntry,
  EnrichmentSectionKey,
  EnrichmentSourceAttachment,
  ExamQuestionCategory,
  ExamQuestionItem,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusTopicNode,
  TopicEnrichmentRecord,
  TopicVerificationRecord
} from '../study-mode/types';
import {
  analyzeTopicForEnrichment,
  generateBatchSectionDrafts,
  generateSectionEnrichmentDraft
} from './enrichmentEngine';
import EnrichmentProposalDiff from './EnrichmentProposalDiff';
import { summarizeTopicVerification } from './claimVerificationEngine';
import {
  clearOptionalAiKey,
  isOptionalAiReady,
  loadOptionalAiConfig,
  OptionalAiConfig,
  OptionalAiProvider,
  saveOptionalAiConfig
} from './optionalAiService';
import { validateEnrichmentQuality } from './qualityValidator';
import {
  assessEnrichmentSections,
  PROVENANCE_LABELS,
  SectionAssessmentState
} from './sectionCatalog';
import {
  AttachableSourceCandidate,
  candidateToAttachment,
  loadAttachableSourcesForTopic
} from './sourceAttachmentService';
import TextbookVerificationPanel from './TextbookVerificationPanel';

export interface EnrichmentWorkspaceJumpTarget {
  syllabusId?: string | null;
  subjectCode?: string | null;
  topicId?: string | null;
  sectionKey?: EnrichmentSectionKey | null;
  returnTo?: 'coverage_analyzer' | 'study_mode' | 'dashboard' | null;
  nonce: number;
}

interface EnrichmentWorkspaceModuleProps {
  jumpTarget?: EnrichmentWorkspaceJumpTarget;
}

function createEmptyRecord(topic: SyllabusTopicNode, syllabusId: string): TopicEnrichmentRecord {
  const now = Date.now();
  return {
    topicId: topic.id,
    syllabusId,
    subjectCode: topic.subjectCode,
    topicTitle: topic.title,
    approvedSections: {},
    drafts: {},
    history: [],
    createdAt: now,
    updatedAt: now
  };
}

function formatTimeShort(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function EnrichmentWorkspaceModule({
  jumpTarget
}: EnrichmentWorkspaceModuleProps) {
  const nav = useLibraryNavigation();

  const [loading, setLoading] = useState(true);
  const [syllabi, setSyllabi] = useState<SyllabusProfile[]>([]);
  const [auditReport, setAuditReport] = useState<CoverageAuditReport | null>(null);
  const [enrichmentMap, setEnrichmentMap] = useState<Record<string, TopicEnrichmentRecord>>({});
  const [verificationMap, setVerificationMap] = useState<Record<string, TopicVerificationRecord>>({});
  const [storedQuestions, setStoredQuestions] = useState<ExamQuestionItem[]>([]);
  const [workspaceMode, setWorkspaceMode] = useState<'enrich' | 'verify'>('enrich');

  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>(
    OFFICIAL_BPHARM_SEM1_SYLLABUS_ID
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [activeSectionKey, setActiveSectionKey] = useState<EnrichmentSectionKey>('overview');
  const [returnTarget, setReturnTarget] = useState<'coverage_analyzer' | 'study_mode' | 'dashboard'>(
    'coverage_analyzer'
  );

  const [acquiredResources, setAcquiredResources] = useState<AcquiredTopicResource[]>([]);
  const [attachCandidates, setAttachCandidates] = useState<AttachableSourceCandidate[]>([]);

  // Section Checklist & UI Subviews
  const [sectionFilter, setSectionFilter] = useState<'all' | 'incomplete' | 'drafts'>('all');
  const [showNotApplicable, setShowNotApplicable] = useState(false);
  const [showExistingPreview, setShowExistingPreview] = useState(true);
  const [showReviewDiff, setShowReviewDiff] = useState(false);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [topicPickerSearch, setTopicPickerSearch] = useState('');
  const [showSourceDrawer, setShowSourceDrawer] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Custom citation quick-add inside source drawer
  const [manualCiteTitle, setManualCiteTitle] = useState('');
  const [manualCiteSubtitle, setManualCiteSubtitle] = useState('');

  // Working Editor State for the Active Section
  const [selectedDepth, setSelectedDepth] = useState<EnrichmentDepthLevel>('standard');
  const [proseDraft, setProseDraft] = useState('');
  const [bulletsText, setBulletsText] = useState('');
  const [formulasText, setFormulasText] = useState('');
  const [comparisonTableDraft, setComparisonTableDraft] = useState<
    EnrichmentComparisonTable | undefined
  >(undefined);
  const [questionsDraft, setQuestionsDraft] = useState<EnrichmentQuestionEntry[]>([]);
  const [provenanceDraft, setProvenanceDraft] = useState<EnrichmentProvenance>('reference_supported');
  const [originDraft, setOriginDraft] = useState<EnrichmentOriginKind>('user_written');
  const [gapRationaleDraft, setGapRationaleDraft] = useState<string | undefined>(undefined);
  const [attachmentsDraft, setAttachmentsDraft] = useState<EnrichmentSourceAttachment[]>([]);
  const [isAiDraftFlag, setIsAiDraftFlag] = useState(false);
  const [dirtySection, setDirtySection] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null);

  // P4.2.2 Gap-Prioritized Enrichment Engine UI State
  const [showGapPlan, setShowGapPlan] = useState(true);
  const [showAllGapTargets, setShowAllGapTargets] = useState(false);
  const [selectedGapKeys, setSelectedGapKeys] = useState<EnrichmentSectionKey[]>([]);
  const [generatingLocal, setGeneratingLocal] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [generatorNotice, setGeneratorNotice] = useState<{
    note: string;
    warnings: string[];
  } | null>(null);
  const [showQualityChecks, setShowQualityChecks] = useState(true);

  // Question builder temp fields
  const [newQPrompt, setNewQPrompt] = useState('');
  const [newQAnswer, setNewQAnswer] = useState('');
  const [newQCategory, setNewQCategory] = useState<ExamQuestionCategory>('short_answer');
  const [newQMarks, setNewQMarks] = useState<string>('5');

  // Optional BYOK AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<OptionalAiConfig>(() => loadOptionalAiConfig());
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Coverage Impact Banner after save/merge
  const [impactNotice, setImpactNotice] = useState<{
    topicTitle: string;
    prevPct: number;
    nextPct: number;
    prevStatus: string;
    nextStatus: string;
    gapsDelta: number;
    message: string;
  } | null>(null);

  // Initial Load
  const reloadCoreData = useCallback(async () => {
    const [loadedSyllabi, loadedEnrichments, loadedVerifications, loadedQs, audit] = await Promise.all([
      getAllSyllabi(),
      getAllTopicEnrichments(),
      getAllTopicVerifications(),
      getAllStoredQuestions(),
      runSyllabusCoverageAudit()
    ]);
    setSyllabi(loadedSyllabi);
    setEnrichmentMap(loadedEnrichments);
    setVerificationMap(loadedVerifications);
    setStoredQuestions(loadedQs);
    setAuditReport(audit);
    return { loadedSyllabi, loadedEnrichments, audit };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reloadCoreData()
      .then(({ loadedSyllabi, audit }) => {
        if (cancelled) return;
        if (!jumpTarget?.topicId && !selectedTopicId) {
          const course = audit.courses[0];
          const topPriorityGap = course?.priorityQueue?.[0];
          if (topPriorityGap) {
            setSelectedSyllabusId(course.syllabusId);
            setSelectedTopicId(topPriorityGap.topicId);
          } else {
            const firstTopic = loadedSyllabi[0]?.subjects[0]?.units[0]?.topics[0];
            if (firstTopic) setSelectedTopicId(firstTopic.id);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply external jumpTarget cleanly
  useEffect(() => {
    if (!jumpTarget || jumpTarget.nonce === 0 || syllabi.length === 0) return;
    if (jumpTarget.syllabusId) {
      setSelectedSyllabusId(jumpTarget.syllabusId);
    }
    if (jumpTarget.returnTo) {
      setReturnTarget(jumpTarget.returnTo);
    }
    if (jumpTarget.topicId) {
      setSelectedTopicId(jumpTarget.topicId);
      setImpactNotice(null);
      setShowReviewDiff(false);
    } else if (jumpTarget.subjectCode) {
      const syl =
        syllabi.find((s) => s.id === (jumpTarget.syllabusId || selectedSyllabusId)) || syllabi[0];
      const subj = syl?.subjects.find(
        (s) => s.code.toUpperCase() === jumpTarget.subjectCode?.toUpperCase()
      );
      const firstTopic = subj?.units[0]?.topics[0];
      if (firstTopic) setSelectedTopicId(firstTopic.id);
    }
    if (jumpTarget.sectionKey) {
      setActiveSectionKey(jumpTarget.sectionKey);
    }
  }, [jumpTarget, syllabi, selectedSyllabusId]);

  const activeSyllabus = useMemo(
    () =>
      syllabi.find((s) => s.id === selectedSyllabusId) ||
      syllabi.find((s) => s.id === OFFICIAL_BPHARM_SEM1_SYLLABUS_ID) ||
      syllabi[0],
    [syllabi, selectedSyllabusId]
  );

  const { activeSubject, activeTopic } = useMemo<{
    activeSubject: SyllabusSubjectNode | undefined;
    activeTopic: SyllabusTopicNode | undefined;
  }>(() => {
    if (!activeSyllabus) return { activeSubject: undefined, activeTopic: undefined };
    for (const s of activeSyllabus.subjects) {
      for (const u of s.units) {
        const hit = u.topics.find((t) => t.id === selectedTopicId);
        if (hit) return { activeSubject: s, activeTopic: hit };
      }
    }
    const fbSubj = activeSyllabus.subjects[0];
    const fbTopic = fbSubj?.units[0]?.topics[0];
    return { activeSubject: fbSubj, activeTopic: fbTopic };
  }, [activeSyllabus, selectedTopicId]);

  const activeCourseReport = useMemo(() => {
    if (!auditReport || !activeSyllabus) return null;
    return (
      auditReport.courses.find((c) => c.syllabusId === activeSyllabus.id) || auditReport.courses[0]
    );
  }, [auditReport, activeSyllabus]);

  const activeTopicReport: TopicCoverageReport | null = useMemo(() => {
    if (!activeCourseReport || !activeTopic) return null;
    for (const s of activeCourseReport.subjects) {
      for (const u of s.units) {
        const hit = u.topics.find((t) => t.id === activeTopic.id);
        if (hit) return hit;
      }
    }
    return null;
  }, [activeCourseReport, activeTopic]);

  // Update breadcrumb
  useEffect(() => {
    if (!activeTopic || !activeSubject) return;
    nav.setWorkspaceSection(
      'Academic Content Enrichment',
      `${activeSubject.code} · ${activeTopic.title}`
    );
    return () => nav.setWorkspaceSection(null);
  }, [activeTopic, activeSubject, nav]);

  // Load topic-level acquired resources & attachable PharmaLab sources when topic changes
  useEffect(() => {
    if (!activeTopic) return;
    let cancelled = false;
    Promise.all([
      getAcquiredResourcesForTopic(activeTopic.id).catch(() => []),
      loadAttachableSourcesForTopic(activeTopic).catch(() => [])
    ]).then(([acq, candidates]) => {
      if (cancelled) return;
      setAcquiredResources(acq);
      setAttachCandidates(candidates);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTopic]);

  const allQuestions = useMemo(() => {
    const seen = new Set(storedQuestions.map((q) => q.id));
    const merged = [...storedQuestions];
    for (const cq of CURATED_REFERENCE_QUESTIONS) {
      if (!seen.has(cq.id)) merged.push(cq);
    }
    return merged;
  }, [storedQuestions]);

  const topicQuestions = useMemo(
    () => (activeTopic ? matchQuestionsToTopic(activeTopic, allQuestions) : []),
    [activeTopic, allQuestions]
  );

  const activeRecord: TopicEnrichmentRecord | undefined = activeTopic
    ? enrichmentMap[activeTopic.id]
    : undefined;

  const sectionStates: SectionAssessmentState[] = useMemo(() => {
    if (!activeTopic || !activeSubject) return [];
    return assessEnrichmentSections({
      topic: activeTopic,
      subject: activeSubject,
      acquiredResources,
      topicQuestions,
      coverageReport: activeTopicReport,
      enrichmentRecord: activeRecord
    });
  }, [activeTopic, activeSubject, acquiredResources, topicQuestions, activeTopicReport, activeRecord]);

  // Ensure activeSectionKey points to an applicable section when switching topics
  useEffect(() => {
    if (sectionStates.length === 0) return;
    const current = sectionStates.find((s) => s.blueprint.key === activeSectionKey);
    if (!current || !current.applicable) {
      const firstIncomplete = sectionStates.find(
        (s) => s.applicable && (s.status === 'missing' || s.status === 'partial' || s.status === 'needs_verification')
      );
      const fallback = firstIncomplete || sectionStates.find((s) => s.applicable);
      if (fallback) setActiveSectionKey(fallback.blueprint.key);
    }
  }, [activeTopic?.id, sectionStates, activeSectionKey]);

  const activeSectionState = useMemo(
    () => sectionStates.find((s) => s.blueprint.key === activeSectionKey) || sectionStates[0],
    [sectionStates, activeSectionKey]
  );

  // P4.2.2 Topic-Aware Gap-Prioritized Enrichment Plan
  const enrichmentPlan = useMemo(() => {
    if (!activeSyllabus || !activeSubject || !activeTopic || sectionStates.length === 0) {
      return null;
    }
    return analyzeTopicForEnrichment({
      syllabus: activeSyllabus,
      subject: activeSubject,
      topic: activeTopic,
      sectionStates,
      coverageReport: activeTopicReport
    });
  }, [activeSyllabus, activeSubject, activeTopic, sectionStates, activeTopicReport]);

  // Seed default top-3 prioritized gaps whenever topic changes
  const lastPlanTopicRef = useRef<string>('');
  useEffect(() => {
    if (!enrichmentPlan || lastPlanTopicRef.current === enrichmentPlan.topicId) return;
    lastPlanTopicRef.current = enrichmentPlan.topicId;
    setSelectedGapKeys(enrichmentPlan.prioritizedGaps.slice(0, 3).map((g) => g.sectionKey));
    setGeneratorNotice(null);
  }, [enrichmentPlan]);

  // Hydrate editor fields when switching topic or section
  const hydratedKeyRef = useRef<string>('');
  useEffect(() => {
    if (!activeTopic || !activeSectionState) return;
    const key = `${activeTopic.id}::${activeSectionState.blueprint.key}`;
    if (hydratedKeyRef.current === key) return;
    hydratedKeyRef.current = key;

    const draft = activeRecord?.drafts?.[activeSectionState.blueprint.key];
    const approved = activeRecord?.approvedSections?.[activeSectionState.blueprint.key];

    if (draft) {
      setSelectedDepth(draft.depth || 'standard');
      setProseDraft(draft.prose);
      setBulletsText(draft.bullets.join('\n'));
      setFormulasText(draft.formulas.join('\n'));
      setComparisonTableDraft(draft.comparisonTable);
      setQuestionsDraft(draft.importantQuestions || []);
      setProvenanceDraft(draft.provenance);
      setOriginDraft(draft.origin || (draft.isAiDraft ? 'ai_draft' : 'user_written'));
      setGapRationaleDraft(draft.gapRationale);
      setAttachmentsDraft(draft.attachments || []);
      setIsAiDraftFlag(draft.isAiDraft);
      setAutosaveStatus(`Draft resumed (${formatTimeShort(draft.updatedAt)})`);
    } else if (approved) {
      setSelectedDepth(approved.depth || 'standard');
      setProseDraft(approved.prose);
      setBulletsText(approved.bullets.join('\n'));
      setFormulasText(approved.formulas.join('\n'));
      setComparisonTableDraft(approved.comparisonTable);
      setQuestionsDraft(approved.importantQuestions || []);
      setProvenanceDraft(approved.provenance);
      setOriginDraft(approved.origin || 'user_written');
      setGapRationaleDraft(approved.gapRationale);
      setAttachmentsDraft(approved.attachments || []);
      setIsAiDraftFlag(false);
      setAutosaveStatus(null);
    } else {
      setProseDraft('');
      setBulletsText('');
      setFormulasText('');
      setComparisonTableDraft(undefined);
      setQuestionsDraft([]);
      setProvenanceDraft('reference_supported');
      setOriginDraft('user_written');
      setGapRationaleDraft(undefined);
      setAttachmentsDraft([]);
      setIsAiDraftFlag(false);
      setAutosaveStatus(null);
    }
    setDirtySection(false);
    setShowReviewDiff(false);
    setAiError(null);
    setGeneratorNotice(null);
  }, [activeTopic, activeSectionState, activeRecord]);

  const parsedBullets = useMemo(
    () =>
      bulletsText
        .split('\n')
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean),
    [bulletsText]
  );

  const parsedFormulas = useMemo(
    () =>
      formulasText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [formulasText]
  );

  // Live 9-check Quality Validation Report for active section
  const liveQualityReport = useMemo(() => {
    if (!activeTopic || !activeSubject || !activeSectionState) return null;
    return validateEnrichmentQuality({
      topic: activeTopic,
      subject: activeSubject,
      blueprint: activeSectionState.blueprint,
      depth: selectedDepth,
      prose: proseDraft,
      bullets: parsedBullets,
      formulas: parsedFormulas,
      comparisonTable: comparisonTableDraft,
      importantQuestions: questionsDraft,
      provenance: provenanceDraft,
      attachments: attachmentsDraft,
      existingProse: activeSectionState.existingProse,
      existingBullets: activeSectionState.existingBullets
    });
  }, [
    activeTopic,
    activeSubject,
    activeSectionState,
    selectedDepth,
    proseDraft,
    parsedBullets,
    parsedFormulas,
    comparisonTableDraft,
    questionsDraft,
    provenanceDraft,
    attachmentsDraft
  ]);

  // Save draft helper
  const persistSectionDraft = useCallback(
    async (silent = false) => {
      if (!activeTopic || !activeSyllabus || !activeSectionState) return;
      const base =
        enrichmentMap[activeTopic.id] || createEmptyRecord(activeTopic, activeSyllabus.id);

      const secKey = activeSectionState.blueprint.key;
      const hasTable = Boolean(
        comparisonTableDraft &&
          comparisonTableDraft.headers.length >= 2 &&
          comparisonTableDraft.rows.length > 0
      );
      const hasContent =
        proseDraft.trim().length > 0 ||
        parsedBullets.length > 0 ||
        parsedFormulas.length > 0 ||
        hasTable ||
        questionsDraft.length > 0 ||
        attachmentsDraft.length > 0;

      const nextDrafts = { ...base.drafts };
      if (hasContent) {
        const draftObj: EnrichedSectionDraft = {
          sectionKey: secKey,
          prose: proseDraft,
          bullets: parsedBullets,
          formulas: parsedFormulas,
          comparisonTable: hasTable ? comparisonTableDraft : undefined,
          importantQuestions: questionsDraft,
          isAiDraft: isAiDraftFlag,
          provenance: provenanceDraft,
          depth: selectedDepth,
          origin: originDraft,
          gapRationale: gapRationaleDraft,
          attachments: attachmentsDraft,
          updatedAt: Date.now()
        };
        nextDrafts[secKey] = draftObj;
      } else {
        delete nextDrafts[secKey];
      }

      const nextHistory: EnrichmentHistoryEntry[] = silent
        ? base.history
        : [
            {
              id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              sectionKey: secKey,
              sectionLabel: activeSectionState.blueprint.label,
              action: 'draft_saved',
              depth: selectedDepth,
              summary: `Saved ${selectedDepth}-depth draft (${proseDraft.trim().length} chars, ${parsedBullets.length} points).`,
              timestamp: Date.now()
            },
            ...base.history
          ].slice(0, 40);

      const saved = await saveTopicEnrichment({
        ...base,
        lastOpenedSection: secKey,
        drafts: nextDrafts,
        history: nextHistory
      });
      setEnrichmentMap((prev) => ({ ...prev, [saved.topicId]: saved }));
      setDirtySection(false);
      setAutosaveStatus(
        hasContent ? `Draft saved (${formatTimeShort(saved.updatedAt)})` : 'Empty draft cleared'
      );
    },
    [
      activeTopic,
      activeSyllabus,
      activeSectionState,
      enrichmentMap,
      proseDraft,
      parsedBullets,
      parsedFormulas,
      comparisonTableDraft,
      questionsDraft,
      attachmentsDraft,
      isAiDraftFlag,
      provenanceDraft,
      selectedDepth,
      originDraft,
      gapRationaleDraft
    ]
  );

  // Debounced autosave while user types
  useEffect(() => {
    if (!dirtySection || !activeTopic) return;
    const timer = window.setTimeout(() => {
      void persistSectionDraft(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dirtySection, activeTopic, persistSectionDraft]);

  // Accept & Merge Proposal into approvedSections + recalculate P4.1 Coverage
  const handleAcceptAndMerge = async () => {
    if (!activeTopic || !activeSyllabus || !activeSectionState) return;
    const prevPct = activeTopicReport?.completenessPct || 0;
    const prevStatus = activeTopicReport?.status || 'missing_content';
    const prevGapsCount = activeTopicReport?.gaps.length || 0;

    const base = enrichmentMap[activeTopic.id] || createEmptyRecord(activeTopic, activeSyllabus.id);
    const secKey = activeSectionState.blueprint.key;
    const existingApproved = base.approvedSections[secKey];

    const finalProvenance: EnrichmentProvenance =
      isAiDraftFlag && provenanceDraft === 'reference_supported' && attachmentsDraft.length > 0
        ? 'ai_verified'
        : provenanceDraft;

    const finalOrigin: EnrichmentOriginKind =
      finalProvenance === 'needs_verification'
        ? 'needs_verification'
        : finalProvenance === 'reference_supported' || finalProvenance === 'ai_verified'
        ? attachmentsDraft.length > 0
          ? 'source_supported'
          : originDraft
        : isAiDraftFlag
        ? 'ai_draft'
        : 'user_written';

    const hasTable = Boolean(
      comparisonTableDraft &&
        comparisonTableDraft.headers.length >= 2 &&
        comparisonTableDraft.rows.length > 0
    );

    const nextEntry: EnrichedSectionEntry = {
      sectionKey: secKey,
      label: activeSectionState.blueprint.label,
      prose: proseDraft.trim(),
      bullets: parsedBullets,
      formulas: parsedFormulas,
      comparisonTable: hasTable ? comparisonTableDraft : undefined,
      importantQuestions: questionsDraft,
      provenance: finalProvenance,
      depth: selectedDepth,
      origin: finalOrigin,
      qualitySummary: liveQualityReport
        ? {
            passCount: liveQualityReport.passCount,
            warningCount: liveQualityReport.warningCount,
            attentionCount: liveQualityReport.attentionCount
          }
        : undefined,
      gapRationale: gapRationaleDraft,
      attachments: attachmentsDraft,
      wasAiAssisted: isAiDraftFlag || Boolean(existingApproved?.wasAiAssisted),
      reviewedByUser: true,
      approvedAt: existingApproved?.approvedAt || Date.now(),
      updatedAt: Date.now(),
      previousSnapshot: existingApproved
        ? {
            prose: existingApproved.prose,
            bullets: existingApproved.bullets,
            formulas: existingApproved.formulas,
            comparisonTable: existingApproved.comparisonTable,
            importantQuestions: existingApproved.importantQuestions,
            provenance: existingApproved.provenance,
            depth: existingApproved.depth,
            origin: existingApproved.origin,
            attachments: existingApproved.attachments,
            savedAt: existingApproved.updatedAt
          }
        : undefined
    };

    const nextDrafts = { ...base.drafts };
    delete nextDrafts[secKey];

    const historyEntry: EnrichmentHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sectionKey: secKey,
      sectionLabel: activeSectionState.blueprint.label,
      action: existingApproved ? 'modified' : 'accepted',
      provenance: finalProvenance,
      depth: selectedDepth,
      wasAiAssisted: isAiDraftFlag,
      summary: `${existingApproved ? 'Updated' : 'Accepted'} ${activeSectionState.blueprint.label} (${selectedDepth} depth · ${
        nextEntry.prose.length
      } chars, ${nextEntry.bullets.length} bullets, ${nextEntry.attachments.length} source(s)).`,
      timestamp: Date.now()
    };

    const saved = await saveTopicEnrichment({
      ...base,
      lastOpenedSection: secKey,
      approvedSections: {
        ...base.approvedSections,
        [secKey]: nextEntry
      },
      drafts: nextDrafts,
      history: [historyEntry, ...base.history].slice(0, 40)
    });

    // If Important Questions were authored, also persist them into Study Mode Exam Prep bank
    if (secKey === 'important_questions' && questionsDraft.length > 0) {
      const examItems: ExamQuestionItem[] = questionsDraft.map((q) => ({
        id: q.id,
        subjectCode: activeTopic.subjectCode,
        unitNo: activeTopic.unitNo,
        topicId: activeTopic.id,
        topicTitle: activeTopic.title,
        category: q.category,
        sourceType: 'reference_based',
        prompt: q.prompt,
        answerGuidance: q.answerGuidance,
        marks: q.marks,
        sourceAttribution: 'P4.2 Content Enrichment',
        createdAt: Date.now()
      }));
      await saveExamQuestions(examItems);
    }

    setEnrichmentMap((prev) => ({ ...prev, [saved.topicId]: saved }));
    setIsAiDraftFlag(false);
    setOriginDraft(finalOrigin);
    setDirtySection(false);
    setShowReviewDiff(false);
    setAutosaveStatus(`Approved & merged (${formatTimeShort(saved.updatedAt)})`);

    // Recalculate P4.1 Coverage immediately and store updated snapshot
    const nextAudit = await runSyllabusCoverageAudit();
    setAuditReport(nextAudit);
    const updatedCourse = nextAudit.courses.find((c) => c.syllabusId === activeSyllabus.id);
    if (updatedCourse) {
      const existingSnaps = loadAuditSnapshots().filter(
        (s) => s.syllabusId === updatedCourse.syllabusId
      );
      const latestSnap = createSnapshotFromCourseReport(updatedCourse, nextAudit.generatedAt);
      saveAuditSnapshot(latestSnap);
      if (existingSnaps.length > 0) {
        compareAuditSnapshots(existingSnaps[0], latestSnap);
      }

      const nextTopicReport = updatedCourse.subjects
        .flatMap((s) => s.units.flatMap((u) => u.topics))
        .find((t) => t.id === activeTopic.id);
      if (nextTopicReport) {
        setImpactNotice({
          topicTitle: activeTopic.title,
          prevPct,
          nextPct: nextTopicReport.completenessPct,
          prevStatus,
          nextStatus: nextTopicReport.status,
          gapsDelta: prevGapsCount - nextTopicReport.gaps.length,
          message:
            nextTopicReport.completenessPct > prevPct
              ? `Topic completeness increased from ${prevPct}% to ${nextTopicReport.completenessPct}%.`
              : `Approved enrichment saved (${nextTopicReport.completenessPct}% completeness).`
        });
      }
    }
  };

  const handleRejectProposal = async () => {
    if (!activeTopic || !activeSyllabus || !activeSectionState) return;
    const base = enrichmentMap[activeTopic.id];
    const secKey = activeSectionState.blueprint.key;

    if (base) {
      const nextDrafts = { ...base.drafts };
      delete nextDrafts[secKey];
      const historyEntry: EnrichmentHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sectionKey: secKey,
        sectionLabel: activeSectionState.blueprint.label,
        action: 'rejected',
        depth: selectedDepth,
        wasAiAssisted: isAiDraftFlag,
        summary: `Rejected unmerged proposal for ${activeSectionState.blueprint.label}. Existing content untouched.`,
        timestamp: Date.now()
      };
      const saved = await saveTopicEnrichment({
        ...base,
        drafts: nextDrafts,
        history: [historyEntry, ...base.history].slice(0, 40)
      });
      setEnrichmentMap((prev) => ({ ...prev, [saved.topicId]: saved }));
    }

    const approved = base?.approvedSections?.[secKey];
    setSelectedDepth(approved?.depth || 'standard');
    setProseDraft(approved?.prose || '');
    setBulletsText(approved?.bullets.join('\n') || '');
    setFormulasText(approved?.formulas.join('\n') || '');
    setComparisonTableDraft(approved?.comparisonTable);
    setQuestionsDraft(approved?.importantQuestions || []);
    setProvenanceDraft(approved?.provenance || 'reference_supported');
    setOriginDraft(approved?.origin || 'user_written');
    setGapRationaleDraft(approved?.gapRationale);
    setAttachmentsDraft(approved?.attachments || []);
    setIsAiDraftFlag(false);
    setDirtySection(false);
    setShowReviewDiff(false);
    setGeneratorNotice(null);
    setAutosaveStatus('Proposal discarded; baseline preserved');
  };

  const handleUndoLastMerge = async () => {
    if (!activeTopic || !activeSectionState) return;
    const base = enrichmentMap[activeTopic.id];
    const secKey = activeSectionState.blueprint.key;
    const currentApproved = base?.approvedSections?.[secKey];
    if (!base || !currentApproved?.previousSnapshot) return;

    const snap = currentApproved.previousSnapshot;
    const restored: EnrichedSectionEntry = {
      ...currentApproved,
      prose: snap.prose,
      bullets: snap.bullets,
      formulas: snap.formulas,
      comparisonTable: snap.comparisonTable,
      importantQuestions: snap.importantQuestions,
      provenance: snap.provenance,
      depth: snap.depth,
      origin: snap.origin,
      attachments: snap.attachments,
      updatedAt: Date.now(),
      previousSnapshot: undefined
    };

    const historyEntry: EnrichmentHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sectionKey: secKey,
      sectionLabel: activeSectionState.blueprint.label,
      action: 'undone',
      depth: snap.depth,
      summary: `Reverted ${activeSectionState.blueprint.label} to snapshot from ${formatTimeShort(
        snap.savedAt
      )}.`,
      timestamp: Date.now()
    };

    const saved = await saveTopicEnrichment({
      ...base,
      approvedSections: {
        ...base.approvedSections,
        [secKey]: restored
      },
      history: [historyEntry, ...base.history].slice(0, 40)
    });

    setEnrichmentMap((prev) => ({ ...prev, [saved.topicId]: saved }));
    setSelectedDepth(restored.depth || 'standard');
    setProseDraft(restored.prose);
    setBulletsText(restored.bullets.join('\n'));
    setFormulasText(restored.formulas.join('\n'));
    setComparisonTableDraft(restored.comparisonTable);
    setQuestionsDraft(restored.importantQuestions);
    setProvenanceDraft(restored.provenance);
    setOriginDraft(restored.origin || 'user_written');
    setAttachmentsDraft(restored.attachments);
    setShowReviewDiff(false);
    setAutosaveStatus('Restored previous approved version');

    const nextAudit = await runSyllabusCoverageAudit();
    setAuditReport(nextAudit);
  };

  // Offline Scientific Content Synthesizer (Works 100% locally with zero API key)
  const handleGenerateLocalDraft = async (
    targetSectionKey?: EnrichmentSectionKey,
    isRegenerate = false
  ) => {
    if (!activeSyllabus || !activeTopic || !activeSubject) return;
    const targetState = targetSectionKey
      ? sectionStates.find((s) => s.blueprint.key === targetSectionKey && s.applicable)
      : activeSectionState;
    if (!targetState) return;

    const gapMatch = enrichmentPlan?.prioritizedGaps.find(
      (g) => g.sectionKey === targetState.blueprint.key
    );

    setGeneratingLocal(true);
    setAiError(null);
    try {
      const result = await generateSectionEnrichmentDraft({
        syllabus: activeSyllabus,
        subject: activeSubject,
        topic: activeTopic,
        sectionState: targetState,
        depth: selectedDepth,
        mode: 'local_engine',
        attachCandidates,
        acquiredResources,
        topicQuestions,
        gapReason: gapMatch?.gapRationale
      });

      if (targetSectionKey && targetSectionKey !== activeSectionKey) {
        hydratedKeyRef.current = `${activeTopic.id}::${targetSectionKey}`;
        setActiveSectionKey(targetSectionKey);
      }

      setProseDraft(result.draft.prose);
      setBulletsText(result.draft.bullets.join('\n'));
      setFormulasText(result.draft.formulas.join('\n'));
      setComparisonTableDraft(result.draft.comparisonTable);
      if (result.draft.importantQuestions.length > 0) {
        setQuestionsDraft(result.draft.importantQuestions);
      }
      setAttachmentsDraft(result.draft.attachments);
      setProvenanceDraft(result.draft.provenance);
      setOriginDraft(result.origin);
      setGapRationaleDraft(gapMatch?.gapRationale);
      setIsAiDraftFlag(false);
      setGeneratorNotice({ note: result.generatorNote, warnings: result.warnings });
      setShowReviewDiff(true);

      const base =
        enrichmentMap[activeTopic.id] || createEmptyRecord(activeTopic, activeSyllabus.id);
      const historyEntry: EnrichmentHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sectionKey: targetState.blueprint.key,
        sectionLabel: targetState.blueprint.label,
        action: isRegenerate ? 'regenerated' : 'draft_saved',
        depth: selectedDepth,
        summary: `${isRegenerate ? 'Regenerated' : 'Generated'} ${selectedDepth}-depth scientific draft via PharmaLab Offline Engine (${result.draft.prose.length} chars, ${result.draft.bullets.length} points).`,
        timestamp: Date.now()
      };
      const saved = await saveTopicEnrichment({
        ...base,
        lastOpenedSection: targetState.blueprint.key,
        drafts: {
          ...base.drafts,
          [targetState.blueprint.key]: result.draft
        },
        history: [historyEntry, ...base.history].slice(0, 40)
      });
      setEnrichmentMap((prev) => ({ ...prev, [saved.topicId]: saved }));
      setDirtySection(false);
      setAutosaveStatus(
        `${isRegenerate ? 'Regenerated' : 'Synthesized'} ${selectedDepth} draft (${formatTimeShort(
          saved.updatedAt
        )})`
      );
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unable to synthesize scientific enrichment draft.'
      );
    } finally {
      setGeneratingLocal(false);
    }
  };

  // Batch Draft Selected Prioritized Gaps (Strictly drafts for review, never auto-merges)
  const handleGenerateBatchGapDrafts = async () => {
    if (!activeSyllabus || !activeSubject || !activeTopic || selectedGapKeys.length === 0) return;
    setGeneratingBatch(true);
    setAiError(null);
    try {
      const gapRationales: Partial<Record<EnrichmentSectionKey, string>> = {};
      enrichmentPlan?.prioritizedGaps.forEach((g) => {
        gapRationales[g.sectionKey] = g.gapRationale;
      });
      const results = await generateBatchSectionDrafts({
        syllabus: activeSyllabus,
        subject: activeSubject,
        topic: activeTopic,
        sectionStates,
        targetKeys: selectedGapKeys,
        depth: selectedDepth,
        attachCandidates,
        acquiredResources,
        topicQuestions,
        gapRationales
      });
      if (results.length === 0) return;

      const base =
        enrichmentMap[activeTopic.id] || createEmptyRecord(activeTopic, activeSyllabus.id);
      const nextDrafts = { ...base.drafts };
      results.forEach((res) => {
        nextDrafts[res.draft.sectionKey] = res.draft;
      });

      const firstRes = results[0];
      const historyEntry: EnrichmentHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sectionKey: firstRes.draft.sectionKey,
        sectionLabel: `${results.length} Gap Sections`,
        action: 'draft_saved',
        depth: selectedDepth,
        summary: `Generated ${results.length} ${selectedDepth}-depth gap draft(s) for user review (${results
          .map((r) => r.draft.sectionKey)
          .join(', ')}).`,
        timestamp: Date.now()
      };

      const saved = await saveTopicEnrichment({
        ...base,
        lastOpenedSection: firstRes.draft.sectionKey,
        drafts: nextDrafts,
        history: [historyEntry, ...base.history].slice(0, 40)
      });
      setEnrichmentMap((prev) => ({ ...prev, [saved.topicId]: saved }));

      // Open the top drafted section immediately in Review Diff
      hydratedKeyRef.current = `${activeTopic.id}::${firstRes.draft.sectionKey}`;
      setActiveSectionKey(firstRes.draft.sectionKey);
      setProseDraft(firstRes.draft.prose);
      setBulletsText(firstRes.draft.bullets.join('\n'));
      setFormulasText(firstRes.draft.formulas.join('\n'));
      setComparisonTableDraft(firstRes.draft.comparisonTable);
      if (firstRes.draft.importantQuestions.length > 0) {
        setQuestionsDraft(firstRes.draft.importantQuestions);
      }
      setAttachmentsDraft(firstRes.draft.attachments);
      setProvenanceDraft(firstRes.draft.provenance);
      setOriginDraft(firstRes.origin);
      setGapRationaleDraft(firstRes.draft.gapRationale);
      setIsAiDraftFlag(false);
      setDirtySection(false);
      setShowReviewDiff(true);
      setGeneratorNotice({
        note: `Created ${results.length} draft(s) at ${selectedDepth} depth. None were auto-merged—review and accept section by section.`,
        warnings: firstRes.warnings
      });
      setAutosaveStatus(`${results.length} gap draft(s) ready for review`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate gap drafts.');
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Optional AI Draft Generator (Client-Side BYOK Only)
  const handleGenerateAiDraft = async (isRegenerate = false) => {
    if (!activeSyllabus || !activeTopic || !activeSubject || !activeSectionState) return;
    if (!isOptionalAiReady(aiConfig)) {
      setAiModalOpen(true);
      return;
    }
    const gapMatch = enrichmentPlan?.prioritizedGaps.find(
      (g) => g.sectionKey === activeSectionState.blueprint.key
    );
    setAiGenerating(true);
    setAiError(null);
    try {
      const result = await generateSectionEnrichmentDraft({
        syllabus: activeSyllabus,
        subject: activeSubject,
        topic: activeTopic,
        sectionState: activeSectionState,
        depth: selectedDepth,
        mode: 'optional_ai',
        aiConfig,
        attachCandidates,
        acquiredResources,
        topicQuestions,
        gapReason: gapMatch?.gapRationale
      });
      if (result.draft.prose) setProseDraft(result.draft.prose);
      if (result.draft.bullets.length > 0) setBulletsText(result.draft.bullets.join('\n'));
      if (result.draft.formulas.length > 0) setFormulasText(result.draft.formulas.join('\n'));
      if (result.draft.comparisonTable) setComparisonTableDraft(result.draft.comparisonTable);
      setIsAiDraftFlag(true);
      setOriginDraft('ai_draft');
      setProvenanceDraft('needs_verification');
      setGapRationaleDraft(gapMatch?.gapRationale);
      setGeneratorNotice({ note: result.generatorNote, warnings: result.warnings });
      setDirtySection(true);
      setShowReviewDiff(true);

      if (isRegenerate) {
        const base =
          enrichmentMap[activeTopic.id] || createEmptyRecord(activeTopic, activeSyllabus.id);
        const historyEntry: EnrichmentHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sectionKey: activeSectionState.blueprint.key,
          sectionLabel: activeSectionState.blueprint.label,
          action: 'regenerated',
          depth: selectedDepth,
          wasAiAssisted: true,
          summary: `Regenerated optional BYOK AI draft for ${activeSectionState.blueprint.label} (${selectedDepth} depth).`,
          timestamp: Date.now()
        };
        const saved = await saveTopicEnrichment({
          ...base,
          drafts: { ...base.drafts, [activeSectionState.blueprint.key]: result.draft },
          history: [historyEntry, ...base.history].slice(0, 40)
        });
        setEnrichmentMap((prev) => ({ ...prev, [saved.topicId]: saved }));
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate optional AI draft.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleRegenerateActiveProposal = () => {
    if (isAiDraftFlag && isOptionalAiReady(aiConfig)) {
      void handleGenerateAiDraft(true);
    } else {
      void handleGenerateLocalDraft(undefined, true);
    }
  };

  // Incomplete Topics List & "Next Incomplete Topic"
  const incompleteTopicsList = useMemo(() => {
    if (!activeCourseReport) return [];
    const list: TopicCoverageReport[] = [];
    for (const s of activeCourseReport.subjects) {
      for (const u of s.units) {
        for (const t of u.topics) {
          if (t.status !== 'complete') list.push(t);
        }
      }
    }
    return list.sort((a, b) => a.completenessPct - b.completenessPct || b.gaps.length - a.gaps.length);
  }, [activeCourseReport]);

  const savedDraftTopics = useMemo(() => {
    return Object.values(enrichmentMap).filter(
      (rec) => Object.keys(rec.drafts || {}).length > 0
    );
  }, [enrichmentMap]);

  const handleNextIncompleteTopic = () => {
    if (incompleteTopicsList.length === 0) return;
    const idx = incompleteTopicsList.findIndex((t) => t.id === activeTopic?.id);
    const next =
      idx >= 0 && idx + 1 < incompleteTopicsList.length
        ? incompleteTopicsList[idx + 1]
        : incompleteTopicsList[0];
    if (next) {
      hydratedKeyRef.current = '';
      setSelectedTopicId(next.id);
      setImpactNotice(null);
      setShowReviewDiff(false);
    }
  };

  const applicableSections = useMemo(
    () => sectionStates.filter((s) => s.applicable),
    [sectionStates]
  );
  const readySectionsCount = useMemo(
    () => applicableSections.filter((s) => s.status === 'complete').length,
    [applicableSections]
  );
  const sectionReadinessPct = applicableSections.length
    ? Math.round((readySectionsCount / applicableSections.length) * 100)
    : 0;

  const visibleSections = useMemo(() => {
    const base = showNotApplicable ? sectionStates : applicableSections;
    if (sectionFilter === 'incomplete') {
      return base.filter(
        (s) =>
          s.status === 'missing' ||
          s.status === 'partial' ||
          s.status === 'needs_verification'
      );
    }
    if (sectionFilter === 'drafts') {
      return base.filter((s) => s.hasUnsavedDraft || Boolean(s.approvedEntry));
    }
    return base;
  }, [sectionStates, applicableSections, showNotApplicable, sectionFilter]);

  const filteredAttachCandidates = useMemo(() => {
    const q = sourceSearch.trim().toLowerCase();
    if (!q) return attachCandidates.slice(0, 24);
    return attachCandidates
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.sourceKind.toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [attachCandidates, sourceSearch]);

  const filteredPickerTopics = useMemo(() => {
    if (!activeCourseReport) return [];
    const q = topicPickerSearch.trim().toLowerCase();
    const all = activeCourseReport.subjects.flatMap((s) => s.units.flatMap((u) => u.topics));
    return all
      .filter((t) => {
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          t.subjectCode.toLowerCase().includes(q) ||
          t.unitNo.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.completenessPct - b.completenessPct);
  }, [activeCourseReport, topicPickerSearch]);

  const toggleAttachment = (candidate: AttachableSourceCandidate) => {
    const attId = `att_${candidate.sourceKind}_${candidate.itemId}`;
    setAttachmentsDraft((prev) => {
      const exists = prev.some((a) => a.id === attId);
      const next = exists
        ? prev.filter((a) => a.id !== attId)
        : [...prev, candidateToAttachment(candidate)];
      return next;
    });
    setDirtySection(true);
  };

  const handleAddManualCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCiteTitle.trim()) return;
    const att: EnrichmentSourceAttachment = {
      id: `att_manual_${Date.now()}`,
      sourceKind: 'manual_citation',
      itemId: `manual_${Date.now()}`,
      title: manualCiteTitle.trim(),
      subtitle: manualCiteSubtitle.trim() || 'Textbook / Pharmacopoeia Citation',
      verified: true,
      attachedAt: Date.now()
    };
    setAttachmentsDraft((prev) => [...prev, att]);
    setManualCiteTitle('');
    setManualCiteSubtitle('');
    setDirtySection(true);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQPrompt.trim() || !newQAnswer.trim()) return;
    const q: EnrichmentQuestionEntry = {
      id: `enr_q_${activeTopic?.id || 'topic'}_${Date.now()}`,
      prompt: newQPrompt.trim(),
      answerGuidance: newQAnswer.trim(),
      category: newQCategory,
      marks: Number(newQMarks) || undefined
    };
    setQuestionsDraft((prev) => [...prev, q]);
    setNewQPrompt('');
    setNewQAnswer('');
    setDirtySection(true);
  };

  if (loading && !activeTopic) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
        <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Loading Academic Content Enrichment Workspace...
        </p>
      </div>
    );
  }

  if (!activeTopic || !activeSubject || !activeSyllabus) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          No syllabus topic available for enrichment.
        </p>
        <button
          type="button"
          onClick={() => nav.openCoverageAnalyzer()}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
        >
          Open Coverage Analyzer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Top Distraction-Free Academic Workspace Header */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              P4.2.1 Content Enrichment · {activeSubject.code} ({activeSubject.title}) ·{' '}
              {activeTopic.unitNo} ·{' '}
              {activeSyllabus.verificationStatus === 'official_syllabus'
                ? 'Official PCI Syllabus'
                : activeSyllabus.university}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {activeTopic.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
              {activeTopicReport && <CoverageStatusInline status={activeTopicReport.status} />}
              <span className="text-slate-600 dark:text-slate-400">
                P4.1 Completeness:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {activeTopicReport?.completenessPct ?? 0}%
                </strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Section Readiness:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {readySectionsCount}/{applicableSections.length} ({sectionReadinessPct}%)
                </strong>
              </span>
              {autosaveStatus && (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  · {autosaveStatus}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                returnTarget === 'study_mode'
                  ? nav.openStudyMode({
                      syllabusId: activeSyllabus.id,
                      subjectCode: activeSubject.code,
                      topicId: activeTopic.id,
                      view: 'study'
                    })
                  : nav.openCoverageAnalyzer({
                      subjectCode: activeSubject.code,
                      topicId: activeTopic.id
                    })
              }
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {returnTarget === 'study_mode' ? 'Back to Study Mode' : 'Coverage Analyzer'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowTopicPicker(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Switch Topic ({incompleteTopicsList.length} incomplete)</span>
            </button>

            <button
              type="button"
              onClick={handleNextIncompleteTopic}
              disabled={incompleteTopicsList.length === 0}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 disabled:opacity-40 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Next Incomplete</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() =>
                nav.openStudyMode({
                  syllabusId: activeSyllabus.id,
                  subjectCode: activeSubject.code,
                  topicId: activeTopic.id,
                  view: 'study'
                })
              }
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview in Study Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Optional client-side AI drafting setup (not required)"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>{isOptionalAiReady(aiConfig) ? 'AI Assist: Ready' : 'Optional AI'}</span>
            </button>
          </div>
        </div>

        {/* Overall Topic Readiness Bar */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              <span>Enrichment Progress Across Applicable Topic Sections</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {readySectionsCount} of {applicableSections.length} sections ready
              </span>
            </div>
            <MetricBar
              pct={activeTopicReport?.completenessPct ?? sectionReadinessPct}
              tone={
                (activeTopicReport?.completenessPct ?? 0) >= 75
                  ? 'emerald'
                  : (activeTopicReport?.completenessPct ?? 0) >= 45
                  ? 'amber'
                  : 'rose'
              }
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2 text-xs">
            <div
              className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              role="tablist"
              aria-label="Workspace mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={workspaceMode === 'enrich'}
                onClick={() => setWorkspaceMode('enrich')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  workspaceMode === 'enrich'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Author &amp; Enrich
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={workspaceMode === 'verify'}
                onClick={() => setWorkspaceMode('verify')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                  workspaceMode === 'verify'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  Textbook Verification
                  {verificationMap[activeTopic.id]?.claims?.length
                    ? ` (${
                        summarizeTopicVerification(verificationMap[activeTopic.id]).textbookSupportedCount +
                        summarizeTopicVerification(verificationMap[activeTopic.id]).multipleBooksCount
                      }/${verificationMap[activeTopic.id].claims.length})`
                    : ''}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryDrawer((v) => !v)}
              className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 inline-flex items-center gap-1.5 font-medium"
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({activeRecord?.history.length || 0})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Unfinished Drafts Resume Strip */}
      {savedDraftTopics.some((d) => d.topicId !== activeTopic.id) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-amber-900 dark:text-amber-200">
            <strong>Unfinished Drafts Saved Locally:</strong>{' '}
            {savedDraftTopics
              .filter((d) => d.topicId !== activeTopic.id)
              .slice(0, 3)
              .map((d) => `${d.subjectCode} (${Object.keys(d.drafts).length} section draft)`)
              .join(' · ')}
          </div>
          <div className="flex flex-wrap gap-2">
            {savedDraftTopics
              .filter((d) => d.topicId !== activeTopic.id)
              .slice(0, 2)
              .map((d) => (
                <button
                  key={d.topicId}
                  type="button"
                  onClick={() => {
                    hydratedKeyRef.current = '';
                    setSelectedTopicId(d.topicId);
                    if (d.lastOpenedSection) setActiveSectionKey(d.lastOpenedSection);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/40 font-semibold text-amber-900 dark:text-amber-200 hover:border-emerald-500"
                >
                  Resume {d.topicTitle.slice(0, 28)}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Coverage Impact Notification Banner */}
      {impactNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 space-y-0.5">
              <p className="font-bold">
                P4.1 Coverage Recalculated · {impactNotice.prevPct}% → {impactNotice.nextPct}%
                {impactNotice.gapsDelta > 0
                  ? ` (${impactNotice.gapsDelta} gap${impactNotice.gapsDelta > 1 ? 's' : ''} resolved)`
                  : ''}
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                {impactNotice.message} Changes are now live in Study Mode and Coverage Analyzer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setImpactNotice(null)}
            className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
            aria-label="Dismiss coverage update banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* P4.2.3 Textbook-First Scientific Verification Mode */}
      {workspaceMode === 'verify' && (
        <TextbookVerificationPanel
          syllabusId={activeSyllabus.id}
          subject={activeSubject}
          topic={activeTopic}
          sectionStates={sectionStates}
          enrichmentRecord={activeRecord}
          verificationRecord={verificationMap[activeTopic.id] || null}
          onVerificationSaved={(saved) => {
            setVerificationMap((prev) => ({ ...prev, [saved.topicId]: saved }));
            void runSyllabusCoverageAudit().then(setAuditReport).catch(() => undefined);
          }}
          onJumpToSection={(secKey) => {
            setActiveSectionKey(secKey);
            setWorkspaceMode('enrich');
          }}
        />
      )}

      {/* P4.2.2 Scientific Enrichment Engine: Depth Control & Gap-Prioritized Plan */}
      {workspaceMode === 'enrich' && enrichmentPlan && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Scientific Content Enrichment Engine</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {enrichmentPlan.hierarchyPath}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div
                className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                role="group"
                aria-label="Enrichment content depth"
              >
                {(
                  [
                    { id: 'foundation', label: 'Foundation' },
                    { id: 'standard', label: 'Standard' },
                    { id: 'advanced', label: 'Advanced' }
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDepth(d.id);
                      setDirtySection(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      selectedDepth === d.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowGapPlan((v) => !v)}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1"
              >
                <span>
                  {enrichmentPlan.incompleteCount} Gap{enrichmentPlan.incompleteCount === 1 ? '' : 's'}
                </span>
                {showGapPlan ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {showGapPlan && (
            <div className="p-5 space-y-3">
              {enrichmentPlan.prioritizedGaps.length === 0 ? (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  All {enrichmentPlan.applicableCount} applicable academic sections have verified or complete coverage. Select any section below to refine further.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-slate-600 dark:text-slate-400">
                      Topic-aware priority queue from P4.1 Coverage Analyzer (skipped{' '}
                      {enrichmentPlan.skippedNotApplicable.length} non-applicable section
                      {enrichmentPlan.skippedNotApplicable.length === 1 ? '' : 's'}). Drafts never overwrite existing text until accepted.
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleGenerateBatchGapDrafts()}
                        disabled={generatingBatch || selectedGapKeys.length === 0}
                        className="min-h-[34px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {generatingBatch ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        <span>Draft Selected Gaps ({selectedGapKeys.length})</span>
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {(showAllGapTargets
                      ? enrichmentPlan.prioritizedGaps
                      : enrichmentPlan.prioritizedGaps.slice(0, 5)
                    ).map((gap) => {
                      const checked = selectedGapKeys.includes(gap.sectionKey);
                      const tierTone =
                        gap.priorityTier === 'critical'
                          ? 'text-rose-700 dark:text-rose-400'
                          : gap.priorityTier === 'high'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-600 dark:text-slate-400';

                      return (
                        <div
                          key={gap.sectionKey}
                          className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <label className="flex items-start gap-2.5 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedGapKeys((prev) =>
                                  prev.includes(gap.sectionKey)
                                    ? prev.filter((k) => k !== gap.sectionKey)
                                    : [...prev, gap.sectionKey]
                                )
                              }
                              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                <span className="tabular-nums text-slate-400 mr-1.5">
                                  #{gap.priorityRank}
                                </span>
                                {gap.label}
                                <span className={`ml-2 uppercase text-[11px] font-bold ${tierTone}`}>
                                  {gap.priorityTier}
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {gap.gapRationale}
                              </p>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={() => void handleGenerateLocalDraft(gap.sectionKey, false)}
                            disabled={generatingLocal}
                            className="self-start sm:self-center shrink-0 min-h-[30px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                          >
                            <Wand2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Draft</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {enrichmentPlan.prioritizedGaps.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllGapTargets((v) => !v)}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      {showAllGapTargets
                        ? 'Show top 5 priority gaps'
                        : `Show all ${enrichmentPlan.prioritizedGaps.length} prioritized gaps`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* Main Split Workspace: Left Checklist (4 cols) + Active Editor/Review (8 cols) */}
      {workspaceMode === 'enrich' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Rail: Dynamic Applicable Section Checklist */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Structured Sections ({applicableSections.length} applicable)
            </h2>
            <button
              type="button"
              onClick={() => setShowNotApplicable((v) => !v)}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {showNotApplicable ? 'Hide N/A' : 'Show N/A'}
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'incomplete', label: 'Needs Work' },
                { id: 'drafts', label: 'Enriched / Drafts' }
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSectionFilter(f.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  sectionFilter === f.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {visibleSections.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                No sections match this filter.
              </div>
            ) : (
              visibleSections.map((sec) => {
                const isSelected = activeSectionState?.blueprint.key === sec.blueprint.key;
                const statusColor =
                  sec.status === 'complete'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : sec.status === 'partial'
                    ? 'text-amber-700 dark:text-amber-400'
                    : sec.status === 'needs_verification'
                    ? 'text-sky-700 dark:text-sky-400'
                    : sec.status === 'not_applicable'
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-rose-700 dark:text-rose-400';

                return (
                  <button
                    key={sec.blueprint.key}
                    type="button"
                    disabled={!sec.applicable}
                    onClick={() => {
                      if (dirtySection) void persistSectionDraft(true);
                      hydratedKeyRef.current = '';
                      setActiveSectionKey(sec.blueprint.key);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left transition-colors flex items-start justify-between gap-2 ${
                      !sec.applicable
                        ? 'opacity-55 cursor-not-allowed bg-slate-50 dark:bg-slate-950/60'
                        : isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isSelected
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {sec.blueprint.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className={`font-semibold ${statusColor}`}>{sec.statusLabel}</span>
                        {sec.hasUnsavedDraft && (
                          <span className="text-amber-700 dark:text-amber-300">
                            {' '}
                            · {sec.isAiDraftPending ? 'AI Draft' : 'Draft'}
                          </span>
                        )}
                        {sec.approvedEntry && !sec.hasUnsavedDraft && (
                          <span> · {sec.approvedEntry.attachments.length} src</span>
                        )}
                        {!sec.applicable && ` · ${sec.applicabilityReason}`}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Main Editor & Review Surface */}
        <main className="lg:col-span-8 space-y-4">
          {activeSectionState && (
            <>
              {/* Existing Academic Content Preview (Read-Only Baseline) */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowExistingPreview((v) => !v)}
                  className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors"
                >
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Existing Academic Baseline · {activeSectionState.blueprint.label}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeSectionState.existingProse.length > 0 ||
                      activeSectionState.existingBullets.length > 0
                        ? `Preview Existing Content (${
                            activeSectionState.existingProse.length +
                            activeSectionState.existingBullets.length
                          } existing blocks/items)`
                        : 'No Existing Content in Study Mode / Catalog for This Section Yet'}
                    </p>
                  </div>
                  {showExistingPreview ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {showExistingPreview && (
                  <div className="px-5 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Applicability note: {activeSectionState.applicabilityReason}
                    </p>
                    {activeSectionState.existingProse.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                    {activeSectionState.existingBullets.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {activeSectionState.existingBullets.slice(0, 8).map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                        {activeSectionState.existingBullets.length > 8 && (
                          <li className="text-slate-500">
                            +{activeSectionState.existingBullets.length - 8} more items already in topic
                          </li>
                        )}
                      </ul>
                    )}
                    {activeSectionState.approvedEntry && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/25 space-y-1">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Active Approved Enrichment (
                          {PROVENANCE_LABELS[activeSectionState.approvedEntry.provenance].label})
                        </p>
                        {activeSectionState.approvedEntry.prose && (
                          <p className="text-xs whitespace-pre-line">
                            {activeSectionState.approvedEntry.prose}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Review / Comparison View (When User Clicks Review or Generated Draft) */}
              {showReviewDiff && (
                <EnrichmentProposalDiff
                  sectionLabel={activeSectionState.blueprint.label}
                  existingProse={activeSectionState.existingProse}
                  existingBullets={activeSectionState.existingBullets}
                  previouslyApproved={activeSectionState.approvedEntry}
                  proposedProse={proseDraft}
                  proposedBullets={parsedBullets}
                  proposedFormulas={parsedFormulas}
                  proposedComparisonTable={comparisonTableDraft}
                  proposedQuestions={questionsDraft}
                  proposedProvenance={provenanceDraft}
                  proposedDepth={selectedDepth}
                  proposedOrigin={originDraft}
                  proposedAttachments={attachmentsDraft}
                  qualityReport={liveQualityReport}
                  isAiDraft={isAiDraftFlag}
                  regenerating={generatingLocal || aiGenerating}
                  onAcceptAndMerge={handleAcceptAndMerge}
                  onModifyInEditor={() => setShowReviewDiff(false)}
                  onRejectProposal={handleRejectProposal}
                  onRegenerateProposal={handleRegenerateActiveProposal}
                  onUndoLastMerge={
                    activeSectionState.approvedEntry?.previousSnapshot
                      ? handleUndoLastMerge
                      : undefined
                  }
                />
              )}

              {/* Structured Enrichment Authoring Form */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Section Authoring · {selectedDepth.charAt(0).toUpperCase() + selectedDepth.slice(1)} Depth · Non-Destructive Additive Layer
                    </p>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {activeSectionState.blueprint.label}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {activeSectionState.blueprint.authoringPrompt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleGenerateLocalDraft(undefined, false)}
                      disabled={generatingLocal}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      {generatingLocal ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>Generate Scientific Draft</span>
                    </button>

                    {(proseDraft.trim().length > 0 || parsedBullets.length > 0) && (
                      <button
                        type="button"
                        onClick={handleRegenerateActiveProposal}
                        disabled={generatingLocal || aiGenerating}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            generatingLocal || aiGenerating ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Regenerate</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleGenerateAiDraft(false)}
                      disabled={aiGenerating}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      {aiGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span>
                        {isOptionalAiReady(aiConfig)
                          ? 'Draft with BYOK AI'
                          : 'AI Draft (Optional BYOK)'}
                      </span>
                    </button>
                  </div>
                </div>

                {generatorNotice && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {generatorNotice.note}
                    </p>
                    {generatorNotice.warnings.map((w, idx) => (
                      <p key={idx} className="text-[11px] text-slate-500 dark:text-slate-400">
                        · {w}
                      </p>
                    ))}
                  </div>
                )}

                {isAiDraftFlag && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      <strong>Unverified AI Draft:</strong> Edit freely, verify all facts against standard B.Pharm references, and attach sources below before approving.
                    </span>
                  </div>
                )}

                {aiError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
                    {aiError}
                  </div>
                )}

                {/* Academic Prose Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="enrich-prose"
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Structured Explanation / Academic Prose
                    </label>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {proseDraft.trim().length} chars
                    </span>
                  </div>
                  <textarea
                    id="enrich-prose"
                    value={proseDraft}
                    onChange={(e) => {
                      setProseDraft(e.target.value);
                      setDirtySection(true);
                    }}
                    rows={6}
                    placeholder={`Write textbook-accurate ${activeSectionState.blueprint.label.toLowerCase()} for ${activeTopic.title}...`}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Key Points / Bullets Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="enrich-bullets"
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Structured Key Points / Classifications / Steps (one per line)
                    </label>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {parsedBullets.length} points
                    </span>
                  </div>
                  <textarea
                    id="enrich-bullets"
                    value={bulletsText}
                    onChange={(e) => {
                      setBulletsText(e.target.value);
                      setDirtySection(true);
                    }}
                    rows={4}
                    placeholder="Enter one concise scientific point, step, or example per line..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Formulas & Worked Numericals (Shown when applicable / formulas_numericals) */}
                {activeSectionState.blueprint.supportsFormulas && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="enrich-formulas"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Equations, Units &amp; Worked Numerical Examples (one line per equation/step)
                    </label>
                    <textarea
                      id="enrich-formulas"
                      value={formulasText}
                      onChange={(e) => {
                        setFormulasText(e.target.value);
                        setDirtySection(true);
                      }}
                      rows={4}
                      placeholder="e.g., Young's Formula: Child Dose = [Age (yrs) / (Age + 12)] × Adult Dose&#10;Worked example: For a 6-year-old child and 500 mg adult dose → (6 / 18) × 500 = 166.7 mg"
                      className="w-full font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Important Questions Builder (Shown for important_questions) */}
                {activeSectionState.blueprint.supportsQuestions && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Structured Assessment &amp; Viva Questions ({questionsDraft.length})
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Syncs to Exam Prep on Merge
                      </span>
                    </div>

                    <form onSubmit={handleAddQuestion} className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={newQCategory}
                          onChange={(e) => setNewQCategory(e.target.value as ExamQuestionCategory)}
                          aria-label="Question format"
                          className="min-h-[38px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="short_answer">Short Answer</option>
                          <option value="long_answer">Long Essay</option>
                          <option value="definition">Definition</option>
                          <option value="mechanism">Mechanism</option>
                          <option value="numerical">Numerical</option>
                          <option value="practical_viva">Practical Viva</option>
                          <option value="comparison">Comparison</option>
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={newQMarks}
                          onChange={(e) => setNewQMarks(e.target.value)}
                          placeholder="Marks"
                          aria-label="Question marks"
                          className="min-h-[38px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="min-h-[38px] px-3 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Question</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newQPrompt}
                        onChange={(e) => setNewQPrompt(e.target.value)}
                        placeholder="Question prompt (e.g. Derive Henderson-Hasselbalch equation for acidic buffers)"
                        className="w-full min-h-[38px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                      <textarea
                        value={newQAnswer}
                        onChange={(e) => setNewQAnswer(e.target.value)}
                        rows={2}
                        placeholder="Concise model answer points / marking rubric..."
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </form>

                    {questionsDraft.length > 0 && (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                        {questionsDraft.map((q) => (
                          <div
                            key={q.id}
                            className="p-3 flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                [{q.category.replace('_', ' ')}
                                {q.marks ? ` · ${q.marks}M` : ''}] {q.prompt}
                              </p>
                              <p className="text-slate-600 dark:text-slate-400">{q.answerGuidance}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setQuestionsDraft((prev) => prev.filter((item) => item.id !== q.id));
                                setDirtySection(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 shrink-0"
                              aria-label="Remove question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Provenance & Attached Sources */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Provenance &amp; Source Attribution
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {PROVENANCE_LABELS[provenanceDraft].description}
                      </p>
                    </div>
                    <select
                      value={provenanceDraft}
                      onChange={(e) => {
                        setProvenanceDraft(e.target.value as EnrichmentProvenance);
                        setDirtySection(true);
                      }}
                      aria-label="Content verification provenance"
                      className="min-h-[36px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="reference_supported">Reference-Supported (Verified)</option>
                      <option value="ai_verified">Verified Enrichment (Reviewed)</option>
                      <option value="user_written">User-Written (Self-Authored)</option>
                      <option value="needs_verification">Needs Verification</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      Attached Section Sources ({attachmentsDraft.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSourceDrawer((v) => !v)}
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>
                        {showSourceDrawer
                          ? 'Hide PharmaLab Source Picker'
                          : 'Attach References, PDFs, Visuals or 3D'}
                      </span>
                    </button>
                  </div>

                  {attachmentsDraft.length > 0 && (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                      {attachmentsDraft.map((att) => (
                        <div
                          key={att.id}
                          className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {att.priorityTier ? `[P${att.priorityTier}] ` : ''}
                              {att.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {att.subtitle || att.sourceKind.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {att.bookId && att.pageNumber && (
                              <button
                                type="button"
                                onClick={() =>
                                  nav.openKnowledgeLibrary({
                                    bookId: att.bookId!,
                                    pageNumber: att.pageNumber!,
                                    searchQuery: activeTopic?.title
                                  })
                                }
                                className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold text-[11px]"
                              >
                                Open p.{att.pageNumber}
                              </button>
                            )}
                            {att.url && (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setAttachmentsDraft((prev) => prev.filter((a) => a.id !== att.id));
                                setDirtySection(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              aria-label="Detach source"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showSourceDrawer && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={sourceSearch}
                          onChange={(e) => setSourceSearch(e.target.value)}
                          placeholder="Search Reference Center, PDF Library, Resource Hub, Visuals, 3D Assets, Experiments..."
                          className="w-full min-h-[36px] pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                        {filteredAttachCandidates.map((cand) => {
                          const isAttached = attachmentsDraft.some(
                            (a) => a.id === `att_${cand.sourceKind}_${cand.itemId}`
                          );
                          return (
                            <button
                              key={cand.key}
                              type="button"
                              onClick={() => toggleAttachment(cand)}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs transition-colors ${
                                isAttached
                                  ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold truncate">
                                  <span className="text-slate-500 dark:text-slate-400 mr-1.5 tabular-nums">
                                    [P{cand.priorityTier}]
                                  </span>
                                  {cand.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {cand.subtitle}
                                </p>
                              </div>
                              <span className="font-semibold shrink-0 text-emerald-700 dark:text-emerald-400">
                                {isAttached ? 'Attached' : 'Attach'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Manual Textbook / Pharmacopoeia Citation Adder */}
                      <form
                        onSubmit={handleAddManualCitation}
                        className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2"
                      >
                        <input
                          type="text"
                          value={manualCiteTitle}
                          onChange={(e) => setManualCiteTitle(e.target.value)}
                          placeholder="Textbook / IP Monograph title (e.g. Ross & Wilson Anatomy Ch. 13)"
                          className="sm:col-span-5 min-h-[34px] px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={manualCiteSubtitle}
                          onChange={(e) => setManualCiteSubtitle(e.target.value)}
                          placeholder="Edition / Chapter / Pharmacopoeia ref"
                          className="sm:col-span-5 min-h-[34px] px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="sm:col-span-2 min-h-[34px] px-2.5 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Add Cite
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Comparison Table Editor / Preview (for comparison/classification sections or when populated) */}
                {(comparisonTableDraft ||
                  activeSectionState.blueprint.key === 'advantages_comparisons' ||
                  activeSectionState.blueprint.key === 'classification_types') && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        <Table2 className="w-3.5 h-3.5" />
                        <span>Structured Comparison Table</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!comparisonTableDraft ? (
                          <button
                            type="button"
                            onClick={() => {
                              setComparisonTableDraft({
                                caption: `Comparative Overview: ${activeTopic.title}`,
                                headers: ['Criterion', 'Option / Class A', 'Option / Class B'],
                                rows: [
                                  ['Mechanism / Basis', '', ''],
                                  ['Pharmaceutical Application', '', '']
                                ]
                              });
                              setDirtySection(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                          >
                            + Add Comparison Table
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setComparisonTableDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rows: [
                                          ...prev.rows,
                                          prev.headers.map(() => '')
                                        ]
                                      }
                                    : prev
                                );
                                setDirtySection(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                              + Row
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setComparisonTableDraft(undefined);
                                setDirtySection(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                            >
                              Remove Table
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {comparisonTableDraft && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={comparisonTableDraft.caption || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setComparisonTableDraft((prev) =>
                              prev ? { ...prev, caption: val } : prev
                            );
                            setDirtySection(true);
                          }}
                          placeholder="Table caption..."
                          className="w-full min-h-[34px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                          <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-950">
                              <tr>
                                {comparisonTableDraft.headers.map((h, cIdx) => (
                                  <th
                                    key={cIdx}
                                    className="p-1.5 border-b border-slate-200 dark:border-slate-800"
                                  >
                                    <input
                                      type="text"
                                      value={h}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setComparisonTableDraft((prev) => {
                                          if (!prev) return prev;
                                          const headers = [...prev.headers];
                                          headers[cIdx] = val;
                                          return { ...prev, headers };
                                        });
                                        setDirtySection(true);
                                      }}
                                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white"
                                    />
                                  </th>
                                ))}
                                <th className="w-8 border-b border-slate-200 dark:border-slate-800" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {comparisonTableDraft.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {comparisonTableDraft.headers.map((_, cIdx) => (
                                    <td key={cIdx} className="p-1.5">
                                      <input
                                        type="text"
                                        value={row[cIdx] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setComparisonTableDraft((prev) => {
                                            if (!prev) return prev;
                                            const rows = prev.rows.map((r, i) =>
                                              i === rIdx
                                                ? prev.headers.map((__, j) =>
                                                    j === cIdx ? val : r[j] || ''
                                                  )
                                                : r
                                            );
                                            return { ...prev, rows };
                                          });
                                          setDirtySection(true);
                                        }}
                                        className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setComparisonTableDraft((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                rows: prev.rows.filter((_, i) => i !== rIdx)
                                              }
                                            : prev
                                        );
                                        setDirtySection(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600"
                                      aria-label="Delete comparison row"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Live 9-Point Content Quality Validation Layer */}
                {liveQualityReport && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setShowQualityChecks((v) => !v)}
                      className="w-full flex flex-wrap items-center justify-between gap-2 text-left text-xs"
                    >
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <ListChecks className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Content Quality Validation (9 Editorial Checks)</span>
                      </span>
                      <span className="tabular-nums text-slate-600 dark:text-slate-400">
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {liveQualityReport.passCount} Pass
                        </strong>
                        {' · '}
                        <strong className="text-amber-700 dark:text-amber-400">
                          {liveQualityReport.warningCount} Warning
                        </strong>
                        {' · '}
                        <strong className="text-rose-700 dark:text-rose-400">
                          {liveQualityReport.attentionCount} Attention
                        </strong>
                      </span>
                    </button>

                    {showQualityChecks && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {liveQualityReport.checks.map((chk) => {
                            const statusStyle =
                              chk.status === 'pass'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : chk.status === 'warning'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-rose-700 dark:text-rose-400';
                            const statusLabel =
                              chk.status === 'pass'
                                ? 'Pass'
                                : chk.status === 'warning'
                                ? 'Warning'
                                : 'Attention Needed';
                            return (
                              <div
                                key={chk.key}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-0.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {chk.label}
                                  </span>
                                  <span className={`font-bold shrink-0 ${statusStyle}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                  {chk.finding}
                                </p>
                                {chk.suggestion && (
                                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                    Tip: {chk.suggestion}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {liveQualityReport.disclaimer}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void persistSectionDraft(false)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowReviewDiff(true)}
                      disabled={
                        !proseDraft.trim() &&
                        parsedBullets.length === 0 &&
                        parsedFormulas.length === 0 &&
                        !comparisonTableDraft &&
                        questionsDraft.length === 0 &&
                        attachmentsDraft.length === 0
                      }
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Review &amp; Merge Into Topic</span>
                    </button>
                  </div>

                  {activeSectionState.approvedEntry?.previousSnapshot && (
                    <button
                      type="button"
                      onClick={handleUndoLastMerge}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo Last Merge</span>
                    </button>
                  )}
                </div>
              </section>

              {/* Enrichment Audit History Drawer */}
              {showHistoryDrawer && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Topic Enrichment Audit History
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowHistoryDrawer(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  {activeRecord && activeRecord.history.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                      {activeRecord.history.map((item) => (
                        <div
                          key={item.id}
                          className="px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {item.sectionLabel} ·{' '}
                              <span className="capitalize text-emerald-700 dark:text-emerald-400">
                                {item.action.replace('_', ' ')}
                              </span>
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">{item.summary}</p>
                          </div>
                          <span className="text-slate-400 tabular-nums shrink-0">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No accepted, modified, rejected, or undone enrichment actions logged for this topic yet.
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
      )}

      {/* Topic Switcher Modal */}
      {showTopicPicker && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-12 overflow-y-auto"
          onClick={() => setShowTopicPicker(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Select syllabus topic to enrich"
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Select Syllabus Topic to Enrich
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sorted by lowest P4.1 completeness first so critical gaps appear on top.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopicPicker(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close topic picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={topicPickerSearch}
                  onChange={(e) => setTopicPickerSearch(e.target.value)}
                  placeholder="Search by subject code (BP106T), unit, or topic title..."
                  className="w-full min-h-[38px] pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPickerTopics.map((t) => {
                const hasDraft =
                  Object.keys(enrichmentMap[t.id]?.drafts || {}).length > 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      hydratedKeyRef.current = '';
                      setSelectedTopicId(t.id);
                      setImpactNotice(null);
                      setShowReviewDiff(false);
                      setShowTopicPicker(false);
                    }}
                    className="w-full px-5 py-3 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {t.subjectCode} · {t.unitNo}
                        {hasDraft ? ' · Has Saved Draft' : ''}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {t.title}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.completenessPct}%
                      </p>
                      <CoverageStatusInline status={t.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Optional Client-Side AI (BYOK) Configuration Modal */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAiModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Optional AI drafting configuration"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Optional AI Drafting (Client-Side BYOK)
              </h2>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close AI settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed">
                AI drafting is <strong>strictly optional</strong>. PharmaLab enrichment works 100% manually offline. If you supply a personal API key below, requests go directly from your browser and every draft stays marked unverified until reviewed.
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Provider
                </label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) =>
                    setAiConfig((c) => ({ ...c, provider: e.target.value as OptionalAiProvider }))
                  }
                  className="w-full min-h-[38px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="none">Disabled (Manual Authoring Only)</option>
                  <option value="gemini">Google Gemini REST (BYOK)</option>
                  <option value="openai_compatible">OpenAI-Compatible Endpoint (BYOK)</option>
                </select>
              </div>

              {aiConfig.provider !== 'none' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Browser-Local API Key (stored only in your browser localStorage)
                    </label>
                    <input
                      type="password"
                      value={aiConfig.apiKey}
                      onChange={(e) => setAiConfig((c) => ({ ...c, apiKey: e.target.value }))}
                      placeholder="Paste personal API key..."
                      className="w-full min-h-[38px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={aiConfig.model}
                      onChange={(e) => setAiConfig((c) => ({ ...c, model: e.target.value }))}
                      placeholder={
                        aiConfig.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'
                      }
                      className="w-full min-h-[38px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {aiConfig.provider === 'openai_compatible' && (
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Chat Completions Endpoint URL
                      </label>
                      <input
                        type="url"
                        value={aiConfig.endpointUrl}
                        onChange={(e) =>
                          setAiConfig((c) => ({ ...c, endpointUrl: e.target.value }))
                        }
                        className="w-full min-h-[38px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const cleared = clearOptionalAiKey();
                    setAiConfig(cleared);
                    setAiModalOpen(false);
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Clear Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const saved = saveOptionalAiConfig(aiConfig);
                    setAiConfig(saved);
                    setAiModalOpen(false);
                  }}
                  className="min-h-[36px] px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Save Local Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
