import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Loader2,
  Plus,
  Trash2,
  Upload,
  XCircle
} from 'lucide-react';
import {
  computeExamIntelligence,
  detectRepeatedQuestionsAcrossPapers,
  EXAM_CATEGORY_LABELS,
  EXAM_SOURCE_LABELS,
  parseQuestionPaperText
} from './examEngine';
import {
  deleteQuestionPaperAndQuestions,
  saveExamQuestions,
  saveQuestionPaper
} from './studyDb';
import { extractTextFromPdfFile } from './syllabusParser';
import {
  ExamQuestionCategory,
  ExamQuestionItem,
  ExamQuestionPaper,
  ExamQuestionSourceType,
  SyllabusProfile
} from './types';

interface ExamPrepWorkspaceProps {
  syllabus: SyllabusProfile;
  initialSubjectCode?: string;
  papers: ExamQuestionPaper[];
  questions: ExamQuestionItem[];
  onRefreshExamData: () => Promise<void>;
}

const ALL_CATEGORIES: ExamQuestionCategory[] = [
  'mcq',
  'short_answer',
  'long_answer',
  'definition',
  'comparison',
  'mechanism',
  'diagram_based',
  'numerical',
  'practical_viva'
];

export default function ExamPrepWorkspace({
  syllabus,
  initialSubjectCode,
  papers,
  questions,
  onRefreshExamData
}: ExamPrepWorkspaceProps) {
  const [subjectCode, setSubjectCode] = useState<string>(
    initialSubjectCode || syllabus.subjects[0]?.code || 'BP104T'
  );
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ExamQuestionCategory>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | ExamQuestionSourceType>('ALL');

  const [showImportPanel, setShowImportPanel] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [university, setUniversity] = useState(syllabus.university || 'University Examination');
  const [examSession, setExamSession] = useState('Winter 2024');
  const [paperCourseCode, setPaperCourseCode] = useState(subjectCode);
  const [isVerifiedOfficialPaper, setIsVerifiedOfficialPaper] = useState(true);
  const [rawPaperText, setRawPaperText] = useState('');
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewPaperId, setPreviewPaperId] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<ExamQuestionItem[]>([]);
  const [savingPaper, setSavingPaper] = useState(false);

  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [mcqSelections, setMcqSelections] = useState<Record<string, number>>({});

  const activeSubject = useMemo(
    () => syllabus.subjects.find((s) => s.code === subjectCode) || syllabus.subjects[0],
    [syllabus.subjects, subjectCode]
  );

  const report = useMemo(
    () => computeExamIntelligence(subjectCode, questions, papers),
    [subjectCode, questions, papers]
  );

  const subjectPapers = useMemo(
    () => papers.filter((p) => p.courseCode.toUpperCase() === subjectCode.toUpperCase()),
    [papers, subjectCode]
  );

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.subjectCode.toUpperCase() !== subjectCode.toUpperCase()) return false;
      if (unitFilter !== 'ALL' && (q.unitNo || 'General') !== unitFilter) return false;
      if (categoryFilter !== 'ALL' && q.category !== categoryFilter) return false;
      if (sourceFilter !== 'ALL' && q.sourceType !== sourceFilter) return false;
      return true;
    });
  }, [questions, subjectCode, unitFilter, categoryFilter, sourceFilter]);

  const handlePaperPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractingPdf(true);
    setParseError(null);
    try {
      const { text } = await extractTextFromPdfFile(file);
      if (!text.trim()) {
        setParseError(
          'No extractable text layer found in this PDF. Paste the question paper text below.'
        );
        return;
      }
      setRawPaperText(text);
      if (!paperTitle.trim()) {
        setPaperTitle(file.name.replace(/\.pdf$/i, ''));
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Unable to read question paper PDF.');
    } finally {
      setExtractingPdf(false);
    }
  };

  const handlePreviewPaper = () => {
    setParseError(null);
    if (!rawPaperText.trim()) {
      setParseError('Upload a question paper PDF or paste question lines first.');
      return;
    }
    const newPaperId = `paper_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const parsed = parseQuestionPaperText(rawPaperText, {
      paperId: newPaperId,
      paperTitle: paperTitle.trim() || `${paperCourseCode} Question Paper`,
      subjectCode: paperCourseCode,
      university: university.trim() || 'University Examination',
      examSession: examSession.trim() || 'Session Unknown',
      isVerifiedOfficialPaper,
      syllabusSubjects: syllabus.subjects
    });
    if (parsed.length === 0) {
      setParseError(
        'Could not detect numbered questions. Ensure questions begin with Q1., 1., Q.1, etc.'
      );
      return;
    }
    setPreviewPaperId(newPaperId);
    setPreviewQuestions(parsed);
  };

  const handleSavePaper = async () => {
    if (!previewPaperId || previewQuestions.length === 0) return;
    setSavingPaper(true);
    try {
      const titleFinal = paperTitle.trim() || `${paperCourseCode} ${examSession} Paper`;
      const uniFinal = university.trim() || 'University Examination';
      const refLabel = `${uniFinal} (${examSession.trim()})`;

      const { processedIncoming, updatedExisting } = detectRepeatedQuestionsAcrossPapers(
        previewQuestions,
        questions,
        refLabel
      );

      const totalMarksSum = processedIncoming.reduce((acc, q) => acc + (q.marks || 0), 0);

      const paperRecord: ExamQuestionPaper = {
        id: previewPaperId,
        title: titleFinal,
        university: uniFinal,
        courseCode: paperCourseCode,
        semester: syllabus.semester,
        examSession: examSession.trim() || 'Unknown',
        isVerifiedOfficialPaper,
        sourceName: isVerifiedOfficialPaper ? uniFinal : 'User Practice Sheet',
        accessDate: new Date().toISOString().slice(0, 10),
        totalMarks: totalMarksSum > 0 ? totalMarksSum : undefined,
        parsedQuestionCount: processedIncoming.length,
        rawTextExcerpt: rawPaperText.slice(0, 400),
        importedAt: Date.now()
      };

      await saveQuestionPaper(paperRecord);
      await saveExamQuestions([...processedIncoming, ...updatedExisting]);
      await onRefreshExamData();

      setSubjectCode(paperCourseCode);
      setPreviewPaperId(null);
      setPreviewQuestions([]);
      setRawPaperText('');
      setPaperTitle('');
      setShowImportPanel(false);
    } finally {
      setSavingPaper(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    await deleteQuestionPaperAndQuestions(paperId);
    await onRefreshExamData();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Exam Prep &amp; Question Paper Intelligence
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              All 9 question formats with strict distinction between verified previous-year university papers, repeated cross-paper items, reference-based questions, and practice items.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPaperCourseCode(subjectCode);
              setShowImportPanel((v) => !v);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showImportPanel ? 'Hide Paper Importer' : 'Import Question Paper (PDF / Text)'}</span>
          </button>
        </div>

        {/* Subject Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {syllabus.subjects.map((subj) => (
            <button
              key={subj.id}
              type="button"
              onClick={() => {
                setSubjectCode(subj.code);
                setUnitFilter('ALL');
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                subjectCode === subj.code
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {subj.code} · {subj.title.slice(0, 28)}
              {subj.title.length > 28 ? '…' : ''}
            </button>
          ))}
        </div>
      </section>

      {/* Import Question Paper Drawer */}
      {showImportPanel && (
        <section className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Import University Question Paper or Practice Sheet
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Parsed questions are mapped to syllabus units and compared against existing verified papers to identify real cross-paper repeats.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course Code
              </label>
              <select
                value={paperCourseCode}
                onChange={(e) => setPaperCourseCode(e.target.value)}
                className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              >
                {syllabus.subjects.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} — {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                University / Institution
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam Session / Year
              </label>
              <input
                type="text"
                value={examSession}
                onChange={(e) => setExamSession(e.target.value)}
                placeholder="e.g. Winter 2024"
                className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paper Title
              </label>
              <input
                type="text"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                placeholder="e.g. BP104T End Semester"
                className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isVerifiedOfficialPaper}
              onChange={(e) => setIsVerifiedOfficialPaper(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              <strong>Verified Actual Previous-Year University Examination Paper</strong> — check only if this document is an authentic past exam paper. Uncheck to classify as a Practice Question Sheet.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <label className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer inline-flex items-center gap-2">
              {extractingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{extractingPdf ? 'Extracting PDF...' : 'Upload Question Paper PDF'}</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePaperPdfUpload}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handlePreviewPaper}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Preview Extracted Questions</span>
            </button>
          </div>

          {parseError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          <textarea
            value={rawPaperText}
            onChange={(e) => setRawPaperText(e.target.value)}
            rows={5}
            placeholder="Paste university exam paper questions (e.g., Q1. Define GFR and explain Starling forces in the nephron. (5M)&#10;Q2. Differentiate between active transport and facilitated diffusion. (5M))..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white font-mono"
          />

          {previewQuestions.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Preview: {previewQuestions.length} question(s) detected (
                  {isVerifiedOfficialPaper ? 'Actual Previous-Year' : 'Practice Sheet'})
                </p>
                <button
                  type="button"
                  onClick={handleSavePaper}
                  disabled={savingPaper}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold"
                >
                  {savingPaper ? 'Saving...' : 'Save Paper & Update Exam Intelligence'}
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                {previewQuestions.map((pq) => (
                  <div key={pq.id} className="py-2 text-xs space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-white">{pq.prompt}</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {EXAM_CATEGORY_LABELS[pq.category]} · {pq.unitNo || 'Unmapped Unit'}
                      {pq.marks ? ` · ${pq.marks} Marks` : ''} · {pq.topicTitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Evidence-Based Exam Intelligence Panel */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{subjectCode} Exam Intelligence (Evidence-Based)</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {report.verifiedPaperCount} verified paper(s) · {report.verifiedQuestionCount} verified exam Qs ·{' '}
            {report.repeatedClustersCount} repeated across papers
          </span>
        </div>

        {/* Honest Limitation / Scope Banner */}
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed ${
            report.hasSufficientEvidenceForPatterns
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
          }`}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{report.limitationBanner}</span>
        </div>

        {/* Unit-Wise & Marks Distribution Table */}
        {report.unitDistribution.length > 0 && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <th className="py-2.5 px-3.5 font-semibold">Syllabus Unit</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Available Qs</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Verified Paper Qs</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Repeated Qs</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Observed Marks Sum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                {report.unitDistribution.map((u) => (
                  <tr key={u.unitNo} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                      {u.unitNo}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-700 dark:text-slate-300">
                      {u.totalQuestions}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-700 dark:text-slate-300">
                      {u.verifiedPaperQuestions}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-700 dark:text-slate-300">
                      {u.repeatedQuestions}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-700 dark:text-slate-300">
                      {u.observedMarksSum !== null ? `${u.observedMarksSum} M` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Imported Papers List */}
        {subjectPapers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Imported {subjectCode} Question Papers ({subjectPapers.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {subjectPapers.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {p.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {p.university} · {p.examSession} · {p.parsedQuestionCount} Qs ·{' '}
                      {p.isVerifiedOfficialPaper ? 'Verified Paper' : 'Practice Sheet'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePaper(p.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shrink-0"
                    aria-label={`Delete imported paper ${p.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Filters & Question List */}
      <section className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Filter by Unit
              </label>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              >
                <option value="ALL">All Units ({activeSubject?.units.length || 0})</option>
                {activeSubject?.units.map((u) => (
                  <option key={u.id} value={u.unitNo}>
                    {u.unitNo} — {u.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Filter by Source Verification
              </label>
              <select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value as 'ALL' | ExamQuestionSourceType)
                }
                className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              >
                <option value="ALL">All Sources</option>
                {(Object.keys(EXAM_SOURCE_LABELS) as ExamQuestionSourceType[]).map((st) => (
                  <option key={st} value={st}>
                    {EXAM_SOURCE_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
                categoryFilter === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
              }`}
            >
              All 9 Formats
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                }`}
              >
                {EXAM_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              No questions matched this filter combination for {subjectCode}.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try resetting filters to &ldquo;All 9 Formats&rdquo; or import a university question paper above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const revealed = Boolean(revealedAnswers[q.id]);
              const pickedIdx = mcqSelections[q.id];
              return (
                <article
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {EXAM_CATEGORY_LABELS[q.category]}
                    </span>
                    <span> · </span>
                    <span
                      className={
                        q.sourceType === 'actual_previous_year' ||
                        q.sourceType === 'repeated_across_papers'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-slate-600 dark:text-slate-300'
                      }
                    >
                      {EXAM_SOURCE_LABELS[q.sourceType]}
                    </span>
                    {q.marks ? ` · ${q.marks} Marks` : ''}
                    {q.unitNo ? ` · ${q.unitNo}` : ''}
                  </p>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {q.prompt}
                  </h4>

                  {q.repeatedPaperRefs && q.repeatedPaperRefs.length >= 2 && (
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Observed across {q.repeatedPaperRefs.length} verified papers:{' '}
                      {q.repeatedPaperRefs.join(', ')}
                    </p>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, idx) => {
                        const isPicked = pickedIdx === idx;
                        const isCorrect = q.correctOptionIndex === idx;
                        const showFeedback = typeof pickedIdx === 'number' && typeof q.correctOptionIndex === 'number';
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setMcqSelections((prev) => ({ ...prev, [q.id]: idx }))
                            }
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors ${
                              showFeedback && isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                                : showFeedback && isPicked && !isCorrect
                                ? 'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200'
                                : isPicked
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-900 dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + idx)}. {opt}
                            </span>
                            {showFeedback && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {showFeedback && isPicked && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {q.sourceAttribution}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"
                    >
                      <span>{revealed ? 'Hide Solution Guidance' : 'Show Solution Guidance'}</span>
                      {revealed ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {revealed && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {q.answerGuidance}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
