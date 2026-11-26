import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  FileText,
  FlaskConical,
  Info,
  Microscope,
  Search,
  Wrench
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getBookPages } from '../knowledge-library/libraryDb';
import { searchBookPages } from '../knowledge-library/searchEngine';
import { LibraryBookMeta } from '../knowledge-library/types';
import { EDUCATIONAL_ANALYTICAL_TESTS } from './knowledgeIndex';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import {
  ANALYTICAL_TEST_FACETS
} from './pharmacopoeiaCatalog';
import {
  AnalyticalTestCategoryId,
  EducationalTestModule,
  LabConnectionRef,
  TextbookPdfHit
} from './types';

interface AnalyticalLearningViewProps {
  selectedTestId?: string | null;
  onSelectTestId: (testId: string | null) => void;
  books: LibraryBookMeta[];
  onOpenPharmacopoeiaEntry: (entryId: string) => void;
}

export default function AnalyticalLearningView({
  selectedTestId,
  onSelectTestId,
  books,
  onOpenPharmacopoeiaEntry
}: AnalyticalLearningViewProps) {
  const {
    openInteractiveExperiments,
    openVisualLibrary,
    openKnowledgeLibrary,
    openStudyMode,
    navigateToModule
  } = useLibraryNavigation();

  const [categoryFilter, setCategoryFilter] = useState<AnalyticalTestCategoryId | 'all'>('all');
  const [filterText, setFilterText] = useState('');
  const [pdfHits, setPdfHits] = useState<TextbookPdfHit[]>([]);

  // Educational Volumetric Assay Quick-Check Calculator state
  const [calcBuretteMl, setCalcBuretteMl] = useState(24.0);
  const [calcFactor, setCalcFactor] = useState(1.0);
  const [calcEqFactor, setCalcEqFactor] = useState(0.0278);
  const [calcSampleWtG, setCalcSampleWtG] = useState(0.67);

  const selectedTest: EducationalTestModule | null = useMemo(() => {
    if (!selectedTestId) return null;
    return EDUCATIONAL_ANALYTICAL_TESTS.find((t) => t.id === selectedTestId) || null;
  }, [selectedTestId]);

  const filteredTests = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return EDUCATIONAL_ANALYTICAL_TESTS.filter((t) => {
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;
      if (!q) return true;
      const hay = `${t.testName} ${t.aliases.join(' ')} ${t.purpose} ${t.scientificPrinciple}`.toLowerCase();
      return hay.includes(q);
    });
  }, [categoryFilter, filterText]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedTest || books.length === 0) {
      setPdfHits([]);
      return;
    }

    const terms = selectedTest.textbookKeywords.slice(0, 3);
    (async () => {
      const hits: TextbookPdfHit[] = [];
      for (const book of books) {
        if (!book.hasSearchableText) continue;
        try {
          const pages = await getBookPages(book.id);
          for (const term of terms) {
            const matches = searchBookPages(pages, term, 2);
            for (const m of matches) {
              if (!hits.some((h) => h.bookId === book.id && h.pageNumber === m.pageNumber)) {
                hits.push({
                  id: `test_pdf_${book.id}_${m.pageNumber}`,
                  bookId: book.id,
                  bookTitle: book.title,
                  department: book.department,
                  pageNumber: m.pageNumber,
                  snippet: `${m.beforeContext}${m.matchedText}${m.afterContext}`.trim(),
                  isPharmacopoeiaLinked: false
                });
              }
            }
          }
        } catch {
          // stay resilient offline
        }
      }
      if (!cancelled) setPdfHits(hits.slice(0, 6));
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTest, books]);

  const handleLaunchLab = (conn: LabConnectionRef) => {
    if (conn.kind === 'experiment' && conn.experimentId) {
      openInteractiveExperiments({ experimentId: conn.experimentId, stage: 'simulate' });
    } else if (conn.kind === 'visual' && conn.visualId) {
      openVisualLibrary({ visualId: conn.visualId });
    } else if (conn.kind === 'module' && conn.moduleId) {
      navigateToModule(conn.moduleId, conn.tab || null);
    }
  };

  const calculatedPurityPct =
    calcSampleWtG > 0 ? ((calcBuretteMl * calcFactor * calcEqFactor) / calcSampleWtG) * 100 : 0;

  if (selectedTest) {
    const linkedCompendia = selectedTest.linkedPharmacopoeiaIds
      .map((id) => PHARMACOPOEIA_DIRECTORY.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e));

    return (
      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelectTestId(null)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Analytical Tests</span>
            </button>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {selectedTest.dataSourceOrigin}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Practical Analytical Learning · Educational Explanation Layer
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {selectedTest.testName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Related terms: {selectedTest.aliases.join(' · ')}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Educational Guide:</strong> Explains scientific principle, apparatus, procedural steps, and error prevention from PharmaLab’s practical curriculum. Official monograph pass/fail acceptance thresholds must always be checked in the binding pharmacopoeia.
            </p>
          </div>
        </section>

        {/* Core Learning Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Purpose &amp; Scientific Principle
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Why the Test Is Performed
                </p>
                <p>{selectedTest.purpose}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Scientific Principle
                </p>
                <p>{selectedTest.scientificPrinciple}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  What It Measures
                </p>
                <p>{selectedTest.whatItMeasures}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Chemical / Physical Process
                </p>
                <p>{selectedTest.chemicalOrPhysicalProcess}</p>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Instruments &amp; Educational Procedure</span>
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Required Apparatus
                </p>
                <ul className="space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {selectedTest.instrumentsAndApparatus.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Curriculum Procedural Sequence
                </p>
                <ol className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedTest.educationalProcedure.map((step, idx) => (
                    <li key={idx} className="tabular-nums">
                      <strong>{idx + 1}.</strong> {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </div>

        {/* Calculations & Interpretation / Common Errors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {selectedTest.calculationSection && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedTest.calculationSection.formulaLabel}</span>
              </h3>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white">
                {selectedTest.calculationSection.formulaExpression}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedTest.calculationSection.variablesNote}
              </p>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed">
                {selectedTest.calculationSection.exampleSummary}
              </p>

              {selectedTest.categoryId === 'assays_titrimetry' && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Interactive Educational % Assay Check
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <label className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-400">Volume (mL)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={calcBuretteMl}
                        onChange={(e) => setCalcBuretteMl(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white tabular-nums"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-400">Titrant Factor</span>
                      <input
                        type="number"
                        step="0.01"
                        value={calcFactor}
                        onChange={(e) => setCalcFactor(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white tabular-nums"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-400">Eq. Factor (g/mL)</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={calcEqFactor}
                        onChange={(e) => setCalcEqFactor(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white tabular-nums"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-slate-500 dark:text-slate-400">Sample Wt (g)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={calcSampleWtG}
                        onChange={(e) => setCalcSampleWtG(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white tabular-nums"
                      />
                    </label>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    Computed Educational Purity:{' '}
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {calculatedPurityPct.toFixed(2)}%
                    </span>
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Result Interpretation &amp; Common Errors</span>
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Interpretation Guidance
                </p>
                <p>{selectedTest.resultInterpretation}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Frequent Practical Pitfalls
                </p>
                <ul className="space-y-1">
                  {selectedTest.commonErrors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Textbook PDFs, Lab Connections & Pharmacopoeias */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Related Virtual Labs, Study Mode &amp; Textbook Evidence</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedTest.labConnections.map((conn, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{conn.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{conn.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchLab(conn)}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Open Lab
                </button>
              </div>
            ))}

            {selectedTest.academicLinks.map((link, idx) => (
              <div
                key={`acad_${idx}`}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {link.subjectCode} · {link.subjectTitle}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {link.topicTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openStudyMode({
                      syllabusId: link.syllabusId || undefined,
                      subjectCode: link.subjectCode.split('/')[0].trim(),
                      topicId: link.topicId || undefined
                    })
                  }
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                >
                  Study Mode
                </button>
              </div>
            ))}
          </div>

          {pdfHits.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Matched Pages in Your Imported Textbook PDFs</span>
              </p>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {pdfHits.map((hit) => (
                  <div
                    key={hit.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {hit.bookTitle} · Page {hit.pageNumber}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        {hit.snippet}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openKnowledgeLibrary({
                          bookId: hit.bookId,
                          pageNumber: hit.pageNumber,
                          searchQuery: selectedTest.textbookKeywords[0]
                        })
                      }
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Open Page {hit.pageNumber}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Referenced Compendia:
            </span>
            {linkedCompendia.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpenPharmacopoeiaEntry(entry.id)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                {entry.abbreviation}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Microscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Practical Analytical Learning Workspace</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Structured educational guides for assays, limit tests, dissolution, sterility, and crude-drug QC — directly connected to PharmaLab’s interactive simulators and apparatus library.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter tests (e.g., cerimetry, Gutzeit, dissolution, EDTA, ash value)..."
              className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AnalyticalTestCategoryId | 'all')}
            aria-label="Filter analytical tests by category"
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Test Categories</option>
            {ANALYTICAL_TEST_FACETS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTests.map((test) => (
          <article
            key={test.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {test.dataSourceOrigin}
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {test.testName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {test.purpose}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apparatus: {test.instrumentsAndApparatus.slice(0, 2).join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onSelectTestId(test.id)}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Open Analytical Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {test.labConnections[0] && (
                <button
                  type="button"
                  onClick={() => handleLaunchLab(test.labConnections[0])}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                >
                  {test.labConnections[0].label}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
