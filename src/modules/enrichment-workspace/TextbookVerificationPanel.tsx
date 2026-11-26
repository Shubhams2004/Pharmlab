import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  GitCompareArrows,
  Info,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getAllBooks } from '../knowledge-library/libraryDb';
import { LibraryBookMeta } from '../knowledge-library/types';
import { saveTopicVerification } from '../study-mode/studyDb';
import {
  ClaimVerificationStatus,
  ScientificClaimRecord,
  SyllabusSubjectNode,
  SyllabusTopicNode,
  TextbookEvidenceLink,
  TopicEnrichmentRecord,
  TopicVerificationRecord
} from '../study-mode/types';
import {
  buildTopicCrossTextbookComparisons,
  CLAIM_STATUS_META,
  extractClaimsForTopic,
  hitToEvidenceLink,
  recalculateClaimStatus,
  summarizeTopicVerification,
  verifyTopicClaimsAgainstTextbooks
} from './claimVerificationEngine';
import { SectionAssessmentState } from './sectionCatalog';
import { SOURCE_PRIORITY_META } from './sourcePolicy';
import {
  assessBooksReadiness,
  searchTextbooksForQuery,
  TextbookSearchHit
} from './textbookSearchEngine';

interface TextbookVerificationPanelProps {
  syllabusId: string;
  subject: SyllabusSubjectNode;
  topic: SyllabusTopicNode;
  sectionStates: SectionAssessmentState[];
  enrichmentRecord?: TopicEnrichmentRecord | null;
  verificationRecord?: TopicVerificationRecord | null;
  onVerificationSaved: (record: TopicVerificationRecord) => void;
  onJumpToSection?: (sectionKey: ScientificClaimRecord['sectionKey']) => void;
}

const STATUS_TONE_CLASSES: Record<
  'emerald' | 'teal' | 'amber' | 'rose' | 'slate',
  string
> = {
  emerald: 'text-emerald-700 dark:text-emerald-400',
  teal: 'text-teal-700 dark:text-teal-400',
  amber: 'text-amber-700 dark:text-amber-400',
  rose: 'text-rose-700 dark:text-rose-400',
  slate: 'text-slate-600 dark:text-slate-400'
};

export default function TextbookVerificationPanel({
  syllabusId,
  subject,
  topic,
  sectionStates,
  enrichmentRecord,
  verificationRecord,
  onVerificationSaved,
  onJumpToSection
}: TextbookVerificationPanelProps) {
  const nav = useLibraryNavigation();

  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ClaimVerificationStatus>('all');
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);

  // Per-claim textbook search drawer
  const [manualQuery, setManualQuery] = useState('');
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [searchResults, setSearchResults] = useState<TextbookSearchHit[] | null>(null);
  const [searchExpandedTerms, setSearchExpandedTerms] = useState<string[]>([]);

  // Working notes state for selected claim
  const [noteDraft, setNoteDraft] = useState('');
  const [contradictionDraft, setContradictionDraft] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    getAllBooks()
      .then(setBooks)
      .catch(() => setBooks([]));
  }, [topic.id]);

  const readiness = useMemo(() => assessBooksReadiness(books), [books]);

  // Combine persisted claims with any newly authored/edited sections not yet verified
  const currentClaims = useMemo(() => {
    return extractClaimsForTopic({
      topic,
      enrichmentRecord,
      sectionStates,
      existingVerification: verificationRecord
    });
  }, [topic, enrichmentRecord, sectionStates, verificationRecord]);

  const filteredClaims = useMemo(() => {
    if (statusFilter === 'all') return currentClaims;
    return currentClaims.filter((c) => c.status === statusFilter);
  }, [currentClaims, statusFilter]);

  useEffect(() => {
    if (
      filteredClaims.length > 0 &&
      !filteredClaims.some((c) => c.id === selectedClaimId)
    ) {
      setSelectedClaimId(filteredClaims[0].id);
    } else if (filteredClaims.length === 0) {
      setSelectedClaimId('');
    }
  }, [filteredClaims, selectedClaimId]);

  const activeClaim = useMemo(
    () => filteredClaims.find((c) => c.id === selectedClaimId) || null,
    [filteredClaims, selectedClaimId]
  );

  useEffect(() => {
    if (activeClaim) {
      setNoteDraft(activeClaim.manualNotes || '');
      setContradictionDraft(activeClaim.contradictionNotes || '');
      setManualQuery(activeClaim.claimText.slice(0, 72));
      setSearchResults(null);
    } else {
      setNoteDraft('');
      setContradictionDraft('');
      setSearchResults(null);
    }
  }, [activeClaim?.id]);

  const summary = useMemo(
    () =>
      summarizeTopicVerification({
        topicId: topic.id,
        syllabusId,
        subjectCode: subject.code,
        topicTitle: topic.title,
        claims: currentClaims,
        lastVerifiedAt: verificationRecord?.lastVerifiedAt || 0,
        bookSnapshotIds: books.map((b) => b.id),
        searchableBooksCount: readiness.searchableBooksCount,
        unsearchableBooksCount: readiness.unsearchableBooksCount,
        limitationNotices: readiness.limitationNotices,
        updatedAt: verificationRecord?.updatedAt || Date.now()
      }),
    [
      topic.id,
      topic.title,
      syllabusId,
      subject.code,
      currentClaims,
      verificationRecord,
      books,
      readiness
    ]
  );

  const crossBookComparisons = useMemo(
    () => buildTopicCrossTextbookComparisons(currentClaims),
    [currentClaims]
  );

  const persistUpdatedClaims = useCallback(
    async (nextClaims: ScientificClaimRecord[], notice?: string) => {
      const latestBooks = await getAllBooks().catch(() => books);
      const latestReadiness = assessBooksReadiness(latestBooks);
      const record: TopicVerificationRecord = {
        topicId: topic.id,
        syllabusId,
        subjectCode: subject.code,
        topicTitle: topic.title,
        claims: nextClaims,
        lastVerifiedAt: verificationRecord?.lastVerifiedAt || Date.now(),
        bookSnapshotIds: latestBooks.map((b) => b.id),
        searchableBooksCount: latestReadiness.searchableBooksCount,
        unsearchableBooksCount: latestReadiness.unsearchableBooksCount,
        limitationNotices: latestReadiness.limitationNotices,
        updatedAt: Date.now()
      };
      const saved = await saveTopicVerification(record);
      onVerificationSaved(saved);
      if (notice) {
        setSaveNotice(notice);
        setTimeout(() => setSaveNotice(null), 3500);
      }
    },
    [
      books,
      topic.id,
      topic.title,
      syllabusId,
      subject.code,
      verificationRecord?.lastVerifiedAt,
      onVerificationSaved
    ]
  );

  const handleRunVerification = async () => {
    setVerifying(true);
    setSaveNotice(null);
    try {
      const freshBooks = await getAllBooks().catch(() => []);
      setBooks(freshBooks);
      const result = await verifyTopicClaimsAgainstTextbooks({
        topic,
        syllabusId,
        enrichmentRecord,
        sectionStates,
        existingVerification: verificationRecord
      });
      const saved = await saveTopicVerification(result);
      onVerificationSaved(saved);
      setSaveNotice(
        `Verified ${saved.claims.length} claim(s) against ${saved.searchableBooksCount} searchable textbook PDF(s).`
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleSearchTextbooks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = manualQuery.trim() || activeClaim?.claimText || topic.title;
    setSearchingBooks(true);
    try {
      const bundle = await searchTextbooksForQuery({
        query: q,
        extraKeywords: topic.keywords,
        preferredDepartment: topic.bookDepartment,
        limitPerBook: 3,
        maxTotalHits: 12
      });
      setSearchResults(bundle.hits);
      setSearchExpandedTerms(bundle.expandedTerms.slice(0, 8));
    } finally {
      setSearchingBooks(false);
    }
  };

  const handleLinkHitToClaim = async (
    hit: TextbookSearchHit,
    stance: TextbookEvidenceLink['stance']
  ) => {
    if (!activeClaim) return;
    const newLink = hitToEvidenceLink(activeClaim.id, hit, 'user_linked', stance);
    const deduped = activeClaim.evidenceLinks.filter(
      (l) => !(l.bookId === newLink.bookId && l.pageNumber === newLink.pageNumber)
    );
    const nextLinks = [newLink, ...deduped];
    const updatedClaim: ScientificClaimRecord = {
      ...activeClaim,
      evidenceLinks: nextLinks,
      status: recalculateClaimStatus(
        { ...activeClaim, evidenceLinks: nextLinks },
        readiness.searchableBooksCount
      ),
      updatedAt: Date.now()
    };
    const nextClaims = currentClaims.map((c) => (c.id === activeClaim.id ? updatedClaim : c));
    await persistUpdatedClaims(
      nextClaims,
      `Linked ${hit.bookTitle} (Page ${hit.pageNumber}) as "${stance}".`
    );
  };

  const handleUnlinkEvidence = async (evidenceId: string) => {
    if (!activeClaim) return;
    const nextLinks = activeClaim.evidenceLinks.filter((l) => l.id !== evidenceId);
    const updatedClaim: ScientificClaimRecord = {
      ...activeClaim,
      evidenceLinks: nextLinks,
      status: recalculateClaimStatus(
        { ...activeClaim, evidenceLinks: nextLinks },
        readiness.searchableBooksCount
      ),
      updatedAt: Date.now()
    };
    const nextClaims = currentClaims.map((c) => (c.id === activeClaim.id ? updatedClaim : c));
    await persistUpdatedClaims(nextClaims, 'Removed evidence link and recalculated status.');
  };

  const handleSaveManualReview = async (opts?: {
    overrideStatus?: ClaimVerificationStatus;
    toggleReviewed?: boolean;
  }) => {
    if (!activeClaim) return;
    const nextReviewed = opts?.toggleReviewed
      ? !activeClaim.reviewedByUser
      : activeClaim.reviewedByUser;
    const nextStatus =
      opts?.overrideStatus ||
      (contradictionDraft.trim()
        ? 'conflicting_evidence'
        : activeClaim.status);

    const updatedClaim: ScientificClaimRecord = {
      ...activeClaim,
      manualNotes: noteDraft.trim(),
      contradictionNotes: contradictionDraft.trim() || undefined,
      status: nextStatus,
      reviewedByUser: nextReviewed,
      reviewedAt: nextReviewed ? Date.now() : undefined,
      updatedAt: Date.now()
    };
    const nextClaims = currentClaims.map((c) => (c.id === activeClaim.id ? updatedClaim : c));
    await persistUpdatedClaims(nextClaims, 'Saved claim verification review.');
  };

  return (
    <div className="space-y-5">
      {/* Top Policy & Textbook Readiness Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>P4.2.3 Textbook-First Scientific Verification Engine</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Claim-to-Textbook Evidence Verification · {topic.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Scientific textbooks &amp; reference PDFs are checked first (Priority 1). Missing matches mean &ldquo;not found in available books&rdquo;, never falsehood.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPolicyDetails((v) => !v)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500/50"
            >
              {showPolicyDetails ? 'Hide Source Policy' : 'Source Priority Policy (1–4)'}
            </button>
            <button
              type="button"
              onClick={() => nav.openKnowledgeLibrary({ searchQuery: topic.title })}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 inline-flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Knowledge Library ({books.length} PDFs)</span>
            </button>
            <button
              type="button"
              onClick={() => void handleRunVerification()}
              disabled={verifying || currentClaims.length === 0}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              {verifying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>
                {verificationRecord?.lastVerifiedAt
                  ? 'Re-run Textbook Verification'
                  : 'Verify Claims Against Textbooks'}
              </span>
            </button>
          </div>
        </div>

        {/* 4-Tier Source Priority Policy Reference */}
        {showPolicyDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            {([1, 2, 3, 4] as const).map((tier) => {
              const meta = SOURCE_PRIORITY_META[tier];
              return (
                <div
                  key={tier}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white">{meta.label}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {meta.ruleNote}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* PDF Extraction & Limitation Notices */}
        {readiness.limitationNotices.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>PDF Library Coverage &amp; Extraction Limitations</span>
            </div>
            {readiness.limitationNotices.map((notice, idx) => (
              <p key={idx} className="leading-relaxed">
                · {notice}
              </p>
            ))}
          </div>
        )}

        {saveNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveNotice}</span>
          </div>
        )}

        {/* Verification Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs tabular-nums">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-2.5 rounded-xl border text-left transition-colors ${
              statusFilter === 'all'
                ? 'bg-emerald-500/10 border-emerald-500/45'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Extracted Claims</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{summary.totalClaims}</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('multiple_textbooks_supported')}
            className={`p-2.5 rounded-xl border text-left transition-colors ${
              statusFilter === 'multiple_textbooks_supported'
                ? 'bg-emerald-500/10 border-emerald-500/45'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-Book</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              {summary.multipleBooksCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('textbook_supported')}
            className={`p-2.5 rounded-xl border text-left transition-colors ${
              statusFilter === 'textbook_supported'
                ? 'bg-emerald-500/10 border-emerald-500/45'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Textbook Supported</p>
            <p className="text-base font-bold text-teal-700 dark:text-teal-400">
              {summary.textbookSupportedCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('partially_supported')}
            className={`p-2.5 rounded-xl border text-left transition-colors ${
              statusFilter === 'partially_supported'
                ? 'bg-amber-500/10 border-amber-500/45'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Partial Support</p>
            <p className="text-base font-bold text-amber-700 dark:text-amber-400">
              {summary.partiallySupportedCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('conflicting_evidence')}
            className={`p-2.5 rounded-xl border text-left transition-colors ${
              statusFilter === 'conflicting_evidence'
                ? 'bg-rose-500/10 border-rose-500/45'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Conflicts</p>
            <p className="text-base font-bold text-rose-700 dark:text-rose-400">
              {summary.conflictingCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('unsupported_by_books')}
            className={`p-2.5 rounded-xl border text-left transition-colors ${
              statusFilter === 'unsupported_by_books'
                ? 'bg-slate-500/15 border-slate-400'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Not in Books</p>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              {summary.unsupportedByBooksCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('requires_manual_verification')}
            className={`p-2.5 rounded-xl border text-left transition-colors ${
              statusFilter === 'requires_manual_verification'
                ? 'bg-amber-500/10 border-amber-500/45'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Manual / Reviewed</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {summary.requiresManualCount} / {summary.reviewedCount}
            </p>
          </button>
        </div>
      </section>

      {/* Main Verification Split: Claim List (5 cols) + Claim Evidence Workbench (7 cols) */}
      {currentClaims.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No scientific claims extracted for &ldquo;{topic.title}&rdquo; yet.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Author or generate section drafts in &ldquo;Author &amp; Enrich&rdquo; first, then return here to verify claims against PDF textbooks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Rail: Extracted Scientific Claims */}
          <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 lg:max-h-[760px] lg:overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Extracted Claims ({filteredClaims.length})
              </h3>
              <select
                aria-label="Filter claims by verification status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | ClaimVerificationStatus)
                }
                className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                {(Object.keys(CLAIM_STATUS_META) as ClaimVerificationStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {CLAIM_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {filteredClaims.map((claim, idx) => {
                const meta = CLAIM_STATUS_META[claim.status];
                const isSelected = claim.id === activeClaim?.id;
                return (
                  <button
                    key={claim.id}
                    type="button"
                    onClick={() => setSelectedClaimId(claim.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors space-y-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className={`font-bold ${STATUS_TONE_CLASSES[meta.tone]}`}>
                        {meta.shortLabel}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        #{idx + 1} · {claim.sectionKey.replace(/_/g, ' ')}
                        {claim.evidenceLinks.length > 0
                          ? ` · ${claim.evidenceLinks.length} book match`
                          : ''}
                        {claim.reviewedByUser ? ' · Reviewed' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed line-clamp-3">
                      {claim.claimText}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Panel: Side-by-Side Claim vs Textbook Passage & Manual Search */}
          <div className="lg:col-span-7 space-y-4">
            {activeClaim ? (
              <>
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`font-bold ${
                            STATUS_TONE_CLASSES[CLAIM_STATUS_META[activeClaim.status].tone]
                          }`}
                        >
                          {CLAIM_STATUS_META[activeClaim.status].label}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 dark:text-slate-400 capitalize">
                          {activeClaim.sectionKey.replace(/_/g, ' ')} ({activeClaim.sourceOrigin.replace(/_/g, ' ')})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {CLAIM_STATUS_META[activeClaim.status].description}
                      </p>
                    </div>

                    {onJumpToSection && (
                      <button
                        type="button"
                        onClick={() => onJumpToSection(activeClaim.sectionKey)}
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                      >
                        Edit Section Content →
                      </button>
                    )}
                  </div>

                  {/* Side-by-Side: Claim vs Primary Textbook Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Academic Claim Under Verification
                      </p>
                      <p className="text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed">
                        {activeClaim.claimText}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Top Linked Textbook Passage
                      </p>
                      {activeClaim.evidenceLinks.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {activeClaim.evidenceLinks[0].bookTitle}
                            {activeClaim.evidenceLinks[0].pageNumber
                              ? ` · Page ${activeClaim.evidenceLinks[0].pageNumber}`
                              : ''}
                          </p>
                          {activeClaim.evidenceLinks[0].chapterHeading && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Chapter/Heading: {activeClaim.evidenceLinks[0].chapterHeading}
                            </p>
                          )}
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {activeClaim.evidenceLinks[0].passageExcerpt}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          No matching passage linked yet. Search uploaded PDF textbooks below to inspect and attach page-level evidence manually.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* All Linked Evidence Passages with Exact PDF Open & Quality Indicators */}
                  {activeClaim.evidenceLinks.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Linked Textbook Evidence ({activeClaim.evidenceLinks.length})
                      </h4>

                      {activeClaim.evidenceLinks.map((ev) => (
                        <article
                          key={ev.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {ev.bookTitle}
                                {ev.edition ? ` · ${ev.edition}` : ''}
                                {ev.authors ? ` · ${ev.authors}` : ''}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                Priority {ev.priorityTier} ·{' '}
                                {ev.pageNumber ? `PDF Page ${ev.pageNumber}` : 'Catalog-level'}
                                {ev.chapterHeading ? ` · ${ev.chapterHeading}` : ''}
                                {` · Stance: ${ev.stance}`}
                                {` · ${ev.linkedBy === 'user_linked' ? 'User-linked' : 'Auto-matched'}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {ev.pageNumber && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    nav.openKnowledgeLibrary({
                                      bookId: ev.bookId,
                                      pageNumber: ev.pageNumber || 1,
                                      searchQuery: ev.matchedTerm || topic.title
                                    })
                                  }
                                  className="min-h-[30px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open PDF Page {ev.pageNumber}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => void handleUnlinkEvidence(ev.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                                aria-label="Unlink textbook evidence"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {ev.contextBefore ? `${ev.contextBefore} ` : ''}
                            <strong className="font-semibold text-slate-900 dark:text-white">
                              {ev.passageExcerpt}
                            </strong>
                            {ev.contextAfter ? ` ${ev.contextAfter}` : ''}
                          </p>

                          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                            <p className="font-medium text-slate-600 dark:text-slate-300">
                              Evidence Quality Indicators: {ev.relevanceIndicators.indicatorsSummary}
                            </p>
                            <p className="inline-flex items-start gap-1 text-[10px]">
                              <Info className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{ev.relevanceIndicators.notCertaintyDisclaimer}</span>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {/* Manual Review, Contradiction Flag & Notes */}
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Manual Verification Notes
                        </label>
                        <textarea
                          rows={2}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Record edition notes, page observations, or verification rationale..."
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Contradiction / Discrepancy Note (Optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={contradictionDraft}
                          onChange={(e) => setContradictionDraft(e.target.value)}
                          placeholder="Flag if textbooks disagree on values, tolerances, or nomenclature..."
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveManualReview({ toggleReviewed: true })}
                        className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border ${
                          activeClaim.reviewedByUser
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500/50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {activeClaim.reviewedByUser ? 'Reviewed ✓' : 'Mark Claim Reviewed'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleSaveManualReview({
                            overrideStatus: 'requires_manual_verification'
                          })
                        }
                        className="min-h-[34px] px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs font-semibold text-amber-800 dark:text-amber-300"
                      >
                        Flag Requires Manual Check
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleSaveManualReview({ overrideStatus: 'conflicting_evidence' })
                        }
                        className="min-h-[34px] px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs font-semibold text-rose-800 dark:text-rose-300"
                      >
                        Flag Contradiction
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleSaveManualReview()}
                        className="min-h-[34px] px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                </section>

                {/* Manual Textbook Passage Search Drawer */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileSearch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Search Uploaded PDF Textbooks for Supporting Passages</span>
                    </h4>
                  </div>

                  <form onSubmit={handleSearchTextbooks} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={manualQuery}
                        onChange={(e) => setManualQuery(e.target.value)}
                        placeholder="Search by scientific term, drug, formula (e.g. pKa, Henderson), or concept..."
                        className="w-full min-h-[38px] pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searchingBooks}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {searchingBooks ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Search Textbooks</span>
                    </button>
                  </form>

                  {searchExpandedTerms.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Expanded terms checked: {searchExpandedTerms.join(', ')}
                    </p>
                  )}

                  {searchResults !== null && (
                    <div className="space-y-2 pt-1">
                      {searchResults.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No passages matched &ldquo;{manualQuery}&rdquo; in searchable PDFs.
                        </p>
                      ) : (
                        searchResults.map((hit) => (
                          <div
                            key={hit.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {hit.bookTitle} · Page {hit.pageNumber}
                                </span>
                                {hit.chapterHeading && (
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {' · '}
                                    {hit.chapterHeading}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                Priority {hit.priorityTier} · Overlap{' '}
                                {hit.qualityBreakdown.conceptualMatchScore}%
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {hit.passageExcerpt}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleLinkHitToClaim(hit, 'supports')}
                                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <Link2 className="w-3 h-3" />
                                <span>Link as Supports</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleLinkHitToClaim(hit, 'partial')}
                                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[11px] font-semibold"
                              >
                                Link as Partial
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleLinkHitToClaim(hit, 'contradicts')}
                                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-800 dark:text-rose-300 text-[11px] font-semibold"
                              >
                                Flag Conflicting
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  nav.openKnowledgeLibrary({
                                    bookId: hit.bookId,
                                    pageNumber: hit.pageNumber,
                                    searchQuery: hit.primaryMatchedTerm
                                  })
                                }
                                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open PDF Page</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Select a claim from the left list or clear your status filter to inspect evidence.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cross-Textbook Comparison Panel */}
      {crossBookComparisons.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompareArrows className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cross-Textbook Evidence Comparison ({crossBookComparisons.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compares matched passages across distinct textbooks — distinguishing shared consensus and additional depth from genuine terminology, classification, edition, or conflicting-value differences.
            </p>
          </div>

          <div className="space-y-3">
            {crossBookComparisons.map((comp, idx) => (
              <article
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {comp.claimOrTopicLabel}
                  </p>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                    {comp.booksComparedCount} Books Compared ({comp.bookTitles.join(' · ')})
                  </span>
                </div>

                {comp.agreedConcepts.length > 0 && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Commonly Agreed Concepts:</strong> {comp.agreedConcepts.join(', ')}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {comp.additionalPerspectives.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {p.bookTitle} {p.pageNumber ? `· p. ${p.pageNumber}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {p.note}
                      </p>
                    </div>
                  ))}
                </div>

                {comp.terminologyDifferences.length > 0 && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Terminology Differences:</strong>{' '}
                    {comp.terminologyDifferences.join('; ')}
                  </p>
                )}

                {comp.classificationDifferences.length > 0 && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Classification Framing:</strong>{' '}
                    {comp.classificationDifferences.join('; ')}
                  </p>
                )}

                {comp.editionDifferences.length > 0 && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Edition Context:</strong> {comp.editionDifferences.join('; ')}
                  </p>
                )}

                {comp.conflictingStatements.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 space-y-1">
                    <p className="font-bold">Conflicting Statements Detected:</p>
                    {comp.conflictingStatements.map((c, cIdx) => (
                      <p key={cIdx}>{c.summary}</p>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{comp.note}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
