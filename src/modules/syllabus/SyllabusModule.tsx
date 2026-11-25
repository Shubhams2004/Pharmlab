import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Box,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  Table2,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import {
  SEMESTER_I_SCHEME,
  SYLLABUS_COURSES,
  SyllabusCourse
} from '../../data/bpharmSem1Syllabus';
import Academic3DContentPanel from '../assets-3d/Academic3DContentPanel';
import { getAll3DAssets, matchCurriculumAssetsSync } from '../assets-3d/asset3dDb';
import { Asset3DItem, BPharmDepartmentId } from '../assets-3d/types';
import { LearningDomainMode } from '../study-mode/types';
import {
  getAllBooks,
  getBookFile,
  saveBookPackage
} from '../knowledge-library/libraryDb';
import { processPdfFile } from '../knowledge-library/pdfExtractor';
import PdfReader from '../knowledge-library/PdfReader';
import { LibraryBookMeta } from '../knowledge-library/types';

const SYLLABUS_PDF_URL = '/syllabus/bpharm-sem1-syllabus.pdf';
const SYLLABUS_BOOK_TITLE = 'B.Pharm Semester I Syllabus (Official PDF)';
const SYLLABUS_POS_KEY = 'pharmlab_syllabus_pos_v1';

function getCourse3DMeta(courseCode: string): {
  departmentId: BPharmDepartmentId;
  learningDomainMode: LearningDomainMode;
  isAbstract: boolean;
} {
  const code = courseCode.toUpperCase();
  if (code.includes('104') || code.includes('110')) {
    return { departmentId: 'anatomy', learningDomainMode: 'anatomy_physiology', isAbstract: false };
  }
  if (code.includes('102') || code.includes('108')) {
    return { departmentId: 'general_pharmacy', learningDomainMode: 'pharmaceutics', isAbstract: false };
  }
  if (code.includes('106') || code.includes('111')) {
    return { departmentId: 'inorganic', learningDomainMode: 'chemistry_analysis', isAbstract: false };
  }
  if (code.includes('105') || code.includes('109')) {
    return { departmentId: 'pharmacognosy', learningDomainMode: 'pharmacognosy', isAbstract: false };
  }
  if (code.includes('103')) {
    return { departmentId: 'psychology', learningDomainMode: 'psychology_comm', isAbstract: true };
  }
  if (code.includes('101') || code.includes('107')) {
    return { departmentId: 'python', learningDomainMode: 'computing_pk', isAbstract: true };
  }
  return { departmentId: 'general_pharmacy', learningDomainMode: 'general', isAbstract: false };
}

function courseMatchesQuery(course: SyllabusCourse, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (
    course.courseCode.toLowerCase().includes(q) ||
    course.courseTitle.toLowerCase().includes(q) ||
    course.objectives.some((o) => o.toLowerCase().includes(q)) ||
    course.outcomes.some((o) => o.statement.toLowerCase().includes(q)) ||
    course.references.some((r) => r.toLowerCase().includes(q))
  ) {
    return true;
  }

  if (course.units) {
    for (const unit of course.units) {
      if (
        unit.unitNo.toLowerCase().includes(q) ||
        (unit.title && unit.title.toLowerCase().includes(q)) ||
        unit.sections.some(
          (s) =>
            (s.heading && s.heading.toLowerCase().includes(q)) ||
            (s.paragraphs && s.paragraphs.some((p) => p.toLowerCase().includes(q))) ||
            (s.bullets && s.bullets.some((b) => b.toLowerCase().includes(q)))
        )
      ) {
        return true;
      }
    }
  }

  if (course.practicalBlocks) {
    for (const block of course.practicalBlocks) {
      if (
        block.items?.some(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.subItems && item.subItems.some((s) => s.toLowerCase().includes(q)))
        )
      ) {
        return true;
      }
      if (block.notes?.some((n) => n.toLowerCase().includes(q))) {
        return true;
      }
    }
  }

  return false;
}

export default function SyllabusModule() {
  const { setWorkspaceSection, openStudyMode } = useLibraryNavigation();

  const savedPos = useMemo(() => {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      const raw = sessionStorage.getItem(SYLLABUS_POS_KEY);
      return raw ? (JSON.parse(raw) as { selectedCode?: string; searchQuery?: string }) : null;
    } catch {
      return null;
    }
  }, []);

  const [viewMode, setViewMode] = useState<'structured' | 'pdf'>('structured');
  const [selectedCode, setSelectedCode] = useState<string>(savedPos?.selectedCode || 'ALL');
  const [searchQuery, setSearchQuery] = useState(savedPos?.searchQuery || '');

  // P3.5 3D Asset links (metadata only until toggled open)
  const [assets3d, setAssets3d] = useState<Asset3DItem[]>([]);
  const [expandedCourse3D, setExpandedCourse3D] = useState<Record<string, boolean>>({});
  const [expandedUnit3D, setExpandedUnit3D] = useState<Record<string, boolean>>({});

  // Original PDF Viewer state
  const [syllabusBook, setSyllabusBook] = useState<LibraryBookMeta | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfPageJump, setPdfPageJump] = useState<number>(1);
  const [pdfJumpNonce, setPdfJumpNonce] = useState<number>(0);

  const courseRefs = useRef<Record<string, HTMLElement | null>>({});

  const refresh3DAssets = useCallback(async () => {
    try {
      const list = await getAll3DAssets();
      setAssets3d(list);
    } catch {
      // ignore IndexedDB error in SSR
    }
  }, []);

  useEffect(() => {
    void refresh3DAssets();
  }, [refresh3DAssets]);

  useEffect(() => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(SYLLABUS_POS_KEY, JSON.stringify({ selectedCode, searchQuery }));
    } catch {
      // ignore storage errors
    }
  }, [selectedCode, searchQuery]);

  useEffect(() => {
    setWorkspaceSection(
      'B.Pharm Syllabus',
      viewMode === 'pdf'
        ? 'Original PDF Viewer'
        : selectedCode === 'ALL'
        ? 'Semester I (BP101T–BP111P)'
        : selectedCode
    );
    return () => setWorkspaceSection(null);
  }, [setWorkspaceSection, viewMode, selectedCode]);

  const ensureSyllabusBook = useCallback(async (): Promise<LibraryBookMeta> => {
    const existingBooks = await getAllBooks();
    const existing = existingBooks.find(
      (b) => b.title === SYLLABUS_BOOK_TITLE || b.fileName === 'bpharm-sem1-syllabus.pdf'
    );
    if (existing) {
      const fileData = await getBookFile(existing.id);
      if (fileData) {
        return existing;
      }
    }

    setPdfProgress('Fetching official syllabus PDF...');
    const response = await fetch(SYLLABUS_PDF_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch syllabus PDF (HTTP ${response.status}).`);
    }
    const blob = await response.blob();
    const file = new File([blob], 'bpharm-sem1-syllabus.pdf', {
      type: 'application/pdf'
    });

    const pkg = await processPdfFile(
      file,
      'manual',
      (prog) => {
        setPdfProgress(prog.message);
      },
      'all'
    );

    const meta: LibraryBookMeta = {
      ...pkg.meta,
      title: SYLLABUS_BOOK_TITLE,
      department: 'all'
    };

    const pages = pkg.pages.map((p) => ({ ...p, bookId: meta.id }));
    await saveBookPackage(meta, pkg.fileBuffer, pages);
    return meta;
  }, []);

  const openOriginalPdfAtPage = useCallback(
    async (pageNumber: number) => {
      setViewMode('pdf');
      setPdfPageJump(pageNumber);
      setPdfJumpNonce((n) => n + 1);

      if (syllabusBook) return;

      setLoadingPdf(true);
      setPdfError(null);
      try {
        const book = await ensureSyllabusBook();
        setSyllabusBook(book);
      } catch (err) {
        setPdfError(
          err instanceof Error ? err.message : 'Unable to load the syllabus PDF viewer.'
        );
      } finally {
        setLoadingPdf(false);
        setPdfProgress(null);
      }
    },
    [ensureSyllabusBook, syllabusBook]
  );

  const filteredCourses = useMemo(() => {
    return SYLLABUS_COURSES.filter((course) => {
      const matchesCode = selectedCode === 'ALL' || course.courseCode === selectedCode;
      const matchesSearch = courseMatchesQuery(course, searchQuery);
      return matchesCode && matchesSearch;
    });
  }, [selectedCode, searchQuery]);

  const handleJumpToCourse = (courseCode: string) => {
    setSelectedCode('ALL');
    setSearchQuery('');
    window.setTimeout(() => {
      const el = courseRefs.current[courseCode];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 30);
  };

  if (viewMode === 'pdf') {
    if (loadingPdf || (!syllabusBook && !pdfError)) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[340px]">
          <Loader2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Opening B.Pharm Syllabus PDF
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pdfProgress || 'Preparing interactive PDF reader...'}
          </p>
        </div>
      );
    }

    if (pdfError || !syllabusBook) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold">Could not open PDF viewer</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {pdfError || 'Unknown error loading PDF.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode('structured')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
            >
              Back to Structured Syllabus
            </button>
            <a
              href={SYLLABUS_PDF_URL}
              download="BPharm_Semester_I_Syllabus.pdf"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>
      );
    }

    return (
      <PdfReader
        book={syllabusBook}
        initialPage={pdfPageJump}
        jumpNonce={pdfJumpNonce}
        onBack={() => setViewMode('structured')}
        onBookProgressChange={(_, page) => {
          setSyllabusBook((prev) => (prev ? { ...prev, lastReadPage: page } : prev));
        }}
        onBookMetaChange={(updated) => setSyllabusBook(updated)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {SEMESTER_I_SCHEME.documentHeader} · {SEMESTER_I_SCHEME.semesterTitle} (Pages 38–65)
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Official B.Pharm Semester I Syllabus
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Complete verbatim syllabus as published in the PDF across all 11 courses (BP101T–BP111P).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openOriginalPdfAtPage(1)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span>Open Original PDF</span>
            </button>

            <a
              href={SYLLABUS_PDF_URL}
              download="BPharm_Semester_I_Syllabus.pdf"
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* Search + Quick Filter Bar */}
        <div className="space-y-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exact syllabus topics, units, experiments, outcomes, or references (e.g. 'limit test', 'Pandas', 'Tulsi')..."
              className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Clear syllabus search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCode('ALL')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCode === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
              }`}
            >
              All Courses ({SYLLABUS_COURSES.length})
            </button>
            {SYLLABUS_COURSES.map((c) => (
              <button
                key={c.courseCode}
                type="button"
                onClick={() => setSelectedCode(c.courseCode)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  selectedCode === c.courseCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                }`}
              >
                {c.courseCode}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Semester I Overview Scheme Table (Page 38) */}
      {selectedCode === 'ALL' && !searchQuery.trim() && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {SEMESTER_I_SCHEME.semesterTitle} — Course Structure
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openOriginalPdfAtPage(SEMESTER_I_SCHEME.pdfPage)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>PDF Page {SEMESTER_I_SCHEME.docPage}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-amber-50 dark:bg-amber-500/10 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-amber-200">
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Course Code</th>
                  <th className="py-3 px-4 font-bold">Name of the course</th>
                  <th className="py-3 px-4 font-bold text-center whitespace-nowrap">
                    No. of hours per week (L/P)
                  </th>
                  <th className="py-3 px-4 font-bold text-center whitespace-nowrap">
                    Credit points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {SEMESTER_I_SCHEME.rows.map((row) => (
                  <tr
                    key={row.courseCode}
                    onClick={() => handleJumpToCourse(row.courseCode)}
                    className="hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {row.courseCode}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                      {row.courseName}
                    </td>
                    <td className="py-2.5 px-4 text-center tabular-nums text-slate-700 dark:text-slate-300">
                      {row.hoursPerWeek}
                    </td>
                    <td className="py-2.5 px-4 text-center tabular-nums text-slate-700 dark:text-slate-300">
                      {row.creditPoints}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="py-3 px-4" colSpan={2}>
                    Total
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">
                    {SEMESTER_I_SCHEME.totalHoursPerWeek}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">
                    {SEMESTER_I_SCHEME.totalCreditPoints}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Course Sections */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <BookOpen className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            No syllabus entries matched &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try clearing your search or switching back to All Courses.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCourses.map((course) => {
            const meta3d = getCourse3DMeta(course.courseCode);
            const course3dRes = matchCurriculumAssetsSync(assets3d, {
              departmentId: meta3d.departmentId,
              subjectCode: course.courseCode,
              course: 'B.Pharm',
              learningDomainMode: meta3d.learningDomainMode
            });
            const course3dCount =
              course3dRes.directLinks.length + course3dRes.verifiedContextualMatches.length;
            const course3dOpen = Boolean(expandedCourse3D[course.courseCode]);

            return (
              <article
                key={course.courseCode}
                ref={(el) => {
                  courseRefs.current[course.courseCode] = el;
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none scroll-mt-20"
              >
                {/* Top Course Banner */}
                <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-bold tracking-wide">
                        {course.courseCode}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {course.courseType} · {course.credit}{' '}
                        {course.credit === '1' ? 'Credit' : 'Credits'} · Max. Hours: {course.maxHours}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {course.courseTitle}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(!meta3d.isAbstract || course3dCount > 0) && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCourse3D((prev) => ({
                            ...prev,
                            [course.courseCode]: !course3dOpen
                          }))
                        }
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                          course3dOpen
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Box className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {course3dCount > 0 ? `3D Models (${course3dCount})` : 'Course 3D'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openStudyMode({ subjectCode: course.courseCode })}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Study in Study Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openOriginalPdfAtPage(course.pdfStartPage)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        PDF Pages {course.docPageStart}–{course.docPageEnd}
                      </span>
                    </button>
                  </div>
                </div>

                {course3dOpen && (
                  <div className="px-5 pt-4">
                    <Academic3DContentPanel
                      compact
                      departmentId={meta3d.departmentId}
                      course="B.Pharm"
                      subjectCode={course.courseCode}
                      subjectTitle={course.courseTitle}
                      subjectObjectives={course.objectives}
                      learningDomainMode={meta3d.learningDomainMode}
                      title={`${course.courseCode} Curriculum 3D Models`}
                      subtitle={course.courseTitle}
                      preloadedAssets={assets3d}
                      onAssetsMutated={() => void refresh3DAssets()}
                    />
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-6">
                {/* Course Metadata Grid Table (Matches PDF Header Table) */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-center border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-amber-50 dark:bg-amber-500/10 text-slate-800 dark:text-amber-200 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          Course Code
                        </th>
                        <th className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          Course Title
                        </th>
                        <th className="py-2 px-3 font-semibold">Course Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          {course.courseCode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                          {course.courseTitle}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {course.courseType}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full text-center border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-amber-50/70 dark:bg-amber-500/5 text-slate-800 dark:text-amber-200 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          Credit
                        </th>
                        <th className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          Hours Per Week (L-T-P)
                        </th>
                        <th className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          Max. Hours
                        </th>
                        <th className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          Maximum Marks
                        </th>
                        <th className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          SE
                        </th>
                        <th className="py-2 px-3 font-semibold">ESE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-slate-800 dark:text-slate-200 tabular-nums">
                        <td className="py-2.5 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          {course.credit}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          L: {course.hoursPerWeek.L} &nbsp;|&nbsp; T: {course.hoursPerWeek.T}{' '}
                          &nbsp;|&nbsp; P: {course.hoursPerWeek.P}
                        </td>
                        <td className="py-2.5 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          {course.maxHours}
                        </td>
                        <td className="py-2.5 px-3 font-semibold border-r border-slate-200 dark:border-slate-800">
                          {course.maximumMarks}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          {course.se}
                        </td>
                        <td className="py-2.5 px-3">{course.ese}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Course Objectives */}
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                    {course.objectivesHeading}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {course.objectivesIntro}
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {course.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ol>
                </section>

                {/* Course Outcomes (CO) */}
                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {course.outcomesHeading}
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-amber-50 dark:bg-amber-500/10 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-amber-200">
                          <th className="py-2.5 px-3.5 font-bold w-20 text-center border-r border-slate-200 dark:border-slate-800">
                            CO No.
                          </th>
                          <th className="py-2.5 px-4 font-bold">
                            Upon successful completion of this course, the students will be able to:
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {course.outcomes.map((co) => (
                          <tr key={co.coNo}>
                            <td className="py-2.5 px-3.5 text-center font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 tabular-nums">
                              {co.coNo}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                              {co.statement}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Detailed Syllabus */}
                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Detailed Syllabus:
                  </h3>

                  {course.kind === 'theory' && course.units ? (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-amber-50 dark:bg-amber-500/10 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-amber-200">
                            <th className="py-2.5 px-3.5 font-bold w-20 text-center border-r border-slate-200 dark:border-slate-800">
                              Unit No.
                            </th>
                            <th className="py-2.5 px-4 font-bold border-r border-slate-200 dark:border-slate-800">
                              Topics
                            </th>
                            <th className="py-2.5 px-3.5 font-bold w-28 text-center">
                              No. of Lectures
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 align-top">
                          {course.units.map((unit) => {
                            const unitKey = `${course.courseCode}_${unit.unitNo}`;
                            const unitMatch = matchCurriculumAssetsSync(assets3d, {
                              departmentId: meta3d.departmentId,
                              subjectCode: course.courseCode,
                              unitNo: unit.unitNo,
                              unitTitle: unit.title,
                              learningDomainMode: meta3d.learningDomainMode
                            });
                            const unitDirectCount = unitMatch.directLinks.length;
                            const unitOpen = Boolean(expandedUnit3D[unitKey]);

                            return (
                              <tr key={unit.unitNo}>
                                <td className="py-3.5 px-3.5 text-center font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                                  <div>{unit.unitNo}</div>
                                  {(!meta3d.isAbstract || unitDirectCount > 0) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedUnit3D((prev) => ({
                                          ...prev,
                                          [unitKey]: !unitOpen
                                        }))
                                      }
                                      className={`mt-2 px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                                        unitOpen
                                          ? 'bg-emerald-600 text-white'
                                          : unitDirectCount > 0
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                                      }`}
                                      title="Toggle unit 3D models"
                                    >
                                      <Box className="w-3 h-3" />
                                      <span>{unitDirectCount > 0 ? `3D (${unitDirectCount})` : '3D'}</span>
                                    </button>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-800 space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {unit.title && (
                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {unit.title}
                                    </p>
                                  )}
                                  {unit.sections.map((sec, sIdx) => (
                                    <div key={sIdx} className="space-y-1.5">
                                      {sec.heading && (
                                        <p className="font-bold text-slate-900 dark:text-white">
                                          {sec.heading}
                                        </p>
                                      )}
                                      {sec.paragraphs?.map((para, pIdx) => (
                                        <p key={pIdx}>{para}</p>
                                      ))}
                                      {sec.bullets && (
                                        <ul className="list-disc pl-5 space-y-1">
                                          {sec.bullets.map((b, bIdx) => (
                                            <li key={bIdx}>{b}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  ))}
                                  {unitOpen && (
                                    <div className="pt-2">
                                      <Academic3DContentPanel
                                        compact
                                        departmentId={meta3d.departmentId}
                                        course="B.Pharm"
                                        subjectCode={course.courseCode}
                                        subjectTitle={course.courseTitle}
                                        unitNo={unit.unitNo}
                                        unitTitle={unit.title}
                                        learningDomainMode={meta3d.learningDomainMode}
                                        title={`${course.courseCode} · ${unit.unitNo} 3D Models`}
                                        subtitle={unit.title || course.courseTitle}
                                        preloadedAssets={assets3d}
                                        onAssetsMutated={() => void refresh3DAssets()}
                                      />
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-3.5 text-center font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  {unit.lectures}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-slate-200 dark:border-slate-800 py-2.5 px-4 text-center font-bold text-sm text-slate-900 dark:text-amber-200">
                        {course.practicalHeading || 'List of practical'}
                      </div>
                      <div className="p-4 sm:p-5 space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {course.practicalSubtitle && (
                          <p className="text-center italic font-medium text-slate-800 dark:text-slate-200">
                            {course.practicalSubtitle}
                          </p>
                        )}
                        {course.practicalIntro && <p>{course.practicalIntro}</p>}
                        {course.practicalBlocks?.map((block, bIdx) => (
                          <div key={bIdx} className="space-y-3">
                            {block.items && (
                              <div className="space-y-2.5">
                                {block.items.map((item, iIdx) => (
                                  <div key={iIdx} className="space-y-1">
                                    <p className="text-slate-900 dark:text-white">
                                      {item.number && (
                                        <span className="font-bold mr-1.5">{item.number}</span>
                                      )}
                                      <span
                                        className={
                                          item.subItems || item.description
                                            ? 'font-bold'
                                            : 'font-normal text-slate-700 dark:text-slate-300'
                                        }
                                      >
                                        {item.title}
                                      </span>
                                    </p>
                                    {item.description && (
                                      <p className="pl-5 text-slate-700 dark:text-slate-300">
                                        {item.description}
                                      </p>
                                    )}
                                    {item.subItems && (
                                      <ul className="pl-5 space-y-0.5 text-slate-700 dark:text-slate-300">
                                        {item.subItems.map((sub, subIdx) => (
                                          <li key={subIdx}>{sub}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {block.notes && block.notes.length > 0 && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 italic space-y-0.5">
                                <p className="font-bold not-italic text-slate-900 dark:text-white">
                                  Note:
                                </p>
                                {block.notes.map((n, nIdx) => (
                                  <p key={nIdx}>{n}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Recommended References */}
                <section className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/60 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white italic">
                    {course.referencesHeading}
                  </h3>
                  <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                    {course.references.map((ref, rIdx) => (
                      <li key={rIdx}>{ref}</li>
                    ))}
                  </ol>
                </section>
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
