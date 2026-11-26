import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  FlaskConical,
  GraduationCap,
  Info,
  Microscope,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getBookPages } from '../knowledge-library/libraryDb';
import { searchBookPages } from '../knowledge-library/searchEngine';
import { LibraryBookMeta } from '../knowledge-library/types';
import { INITIAL_REFERENCE_CATALOG } from '../reference-center/seedCatalog';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import {
  computePharmacopoeiaAvailability,
  EDUCATIONAL_ANALYTICAL_TESTS
} from './knowledgeIndex';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import {
  KNOWLEDGE_KIND_LABELS,
  LabConnectionRef,
  SeededTextbookMatch,
  SubstanceWorkspaceRecord,
  TextbookPdfHit
} from './types';

interface SubstanceKnowledgeWorkspaceProps {
  substance: SubstanceWorkspaceRecord;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
  onBack: () => void;
  onOpenPharmacopoeiaEntry: (entryId: string) => void;
  onOpenAnalyticalTest: (testId: string) => void;
}

export default function SubstanceKnowledgeWorkspace({
  substance,
  books,
  referenceItems,
  referenceProfiles,
  onBack,
  onOpenPharmacopoeiaEntry,
  onOpenAnalyticalTest
}: SubstanceKnowledgeWorkspaceProps) {
  const {
    openKnowledgeLibrary,
    openStudyMode,
    openInteractiveExperiments,
    openVisualLibrary,
    openReferenceCenter,
    navigateToModule
  } = useLibraryNavigation();

  const [pdfHits, setPdfHits] = useState<TextbookPdfHit[]>([]);
  const [searchingPdfs, setSearchingPdfs] = useState(false);

  // Textbook-first live retrieval across local PDF Knowledge Library
  useEffect(() => {
    let cancelled = false;
    const terms = [substance.name.split('(')[0].trim(), ...substance.synonyms.slice(0, 2)].filter(
      (t) => t.length >= 3
    );

    if (books.length === 0 || terms.length === 0) {
      setPdfHits([]);
      return;
    }

    setSearchingPdfs(true);
    (async () => {
      const collected: TextbookPdfHit[] = [];
      for (const book of books) {
        if (!book.hasSearchableText) continue;
        try {
          const pages = await getBookPages(book.id);
          for (const term of terms) {
            const matches = searchBookPages(pages, term, 2);
            for (const m of matches) {
              const dup = collected.some(
                (c) => c.bookId === book.id && c.pageNumber === m.pageNumber
              );
              if (!dup) {
                collected.push({
                  id: `sub_pdf_${book.id}_${m.pageNumber}`,
                  bookId: book.id,
                  bookTitle: book.title,
                  authors: book.authors,
                  department: book.department,
                  pageNumber: m.pageNumber,
                  snippet: `${m.beforeContext}${m.matchedText}${m.afterContext}`.trim(),
                  isPharmacopoeiaLinked: false
                });
              }
            }
          }
        } catch {
          // keep resilient offline
        }
      }
      if (!cancelled) {
        setPdfHits(collected.slice(0, 8));
        setSearchingPdfs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [substance, books]);

  const matchingSeededTextbooks = useMemo<SeededTextbookMatch[]>(() => {
    const pool = referenceItems.length > 0 ? referenceItems : INITIAL_REFERENCE_CATALOG;
    const kws = substance.textbookKeywords.map((k) => k.toLowerCase());
    return pool
      .filter((item) => item.collectionType !== 'pharmacopoeia')
      .map((item) => {
        const hay = `${item.title} ${item.authors || ''} ${item.subject} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
        const hits = kws.filter((kw) => hay.includes(kw)).length;
        return { item, hits };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 4)
      .map(({ item }) => ({
        id: item.id,
        title: item.title,
        authors: item.authors,
        subject: item.subject,
        collectionType: item.collectionType,
        accessLabel:
          item.accessStatus === 'open_access_portal'
            ? 'Open Official Portal'
            : item.accessStatus === 'licensed_external'
            ? 'Publisher Subscription Reference'
            : 'Curriculum Textbook Reference',
        description: item.description,
        externalUrl: item.externalUrl
      }));
  }, [substance.textbookKeywords, referenceItems]);

  const relevantCompendia = useMemo(() => {
    return substance.relevantPharmacopoeiaIds
      .map((id) => PHARMACOPOEIA_DIRECTORY.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((entry) => ({
        entry,
        availability: computePharmacopoeiaAvailability({
          entry,
          books,
          referenceItems,
          referenceProfiles
        })
      }));
  }, [substance.relevantPharmacopoeiaIds, books, referenceItems, referenceProfiles]);

  const linkedTestModules = useMemo(() => {
    return (substance.relatedTestIds || [])
      .map((id) => EDUCATIONAL_ANALYTICAL_TESTS.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t));
  }, [substance.relatedTestIds]);

  const handleLaunchLab = (conn: LabConnectionRef) => {
    if (conn.kind === 'experiment' && conn.experimentId) {
      openInteractiveExperiments({ experimentId: conn.experimentId, stage: 'simulate' });
    } else if (conn.kind === 'visual' && conn.visualId) {
      openVisualLibrary({ visualId: conn.visualId });
    } else if (conn.kind === 'module' && conn.moduleId) {
      navigateToModule(conn.moduleId, conn.tab || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Integrity Framing */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Knowledge Workspace</span>
          </button>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Source: {substance.dataSourceOrigin}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {KNOWLEDGE_KIND_LABELS[substance.kind]} · {substance.categoryLabel}
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {substance.name}
          </h2>
          {substance.synonyms.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synonyms &amp; Identifiers: {substance.synonyms.join(' · ')}
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {substance.overview}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Educational Knowledge Layer vs. Official Standard:</strong> Summaries below come strictly from PharmaLab curriculum modules, lab simulations, and your imported textbooks. Official monograph acceptance limits, impurity thresholds, and legal test parameters must always be verified in the active pharmacopoeia portal or an imported official monograph PDF.
          </p>
        </div>
      </section>

      {/* Main Knowledge Sections — Only Applicable Sections Rendered */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {substance.chemicalInfo && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Chemical &amp; Pharmaceutical Information
            </h3>
            <dl className="space-y-2 text-xs sm:text-sm">
              {substance.chemicalInfo.chemicalName && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Chemical Name
                  </dt>
                  <dd className="text-slate-800 dark:text-slate-200">
                    {substance.chemicalInfo.chemicalName}
                  </dd>
                </div>
              )}
              {substance.chemicalInfo.formula && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Molecular Formula
                  </dt>
                  <dd className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {substance.chemicalInfo.formula}
                  </dd>
                </div>
              )}
              {substance.chemicalInfo.functionalGroups && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Key Functional Groups
                  </dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    {substance.chemicalInfo.functionalGroups}
                  </dd>
                </div>
              )}
              {substance.chemicalInfo.physicalNotes && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Physicochemical &amp; Stability Notes
                  </dt>
                  <dd className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {substance.chemicalInfo.physicalNotes}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {substance.assayInfo && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Assay (Educational Curriculum Basis)
              </h3>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Educational Explanation
              </span>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                {substance.assayInfo.methodName}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong className="text-slate-800 dark:text-slate-200">Titrant / Technique:</strong>{' '}
                {substance.assayInfo.titrantOrTechnique}
              </p>
              {substance.assayInfo.indicator && (
                <p className="text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-slate-200">Indicator:</strong>{' '}
                  {substance.assayInfo.indicator}
                </p>
              )}
              {substance.assayInfo.formulaNote && (
                <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                  {substance.assayInfo.formulaNote}
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {substance.assayInfo.educationalExplanation}
              </p>
            </div>
          </section>
        )}

        {substance.identification && substance.identification.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Identification Concepts
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {substance.identification.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </section>
        )}

        {substance.analyticalMethods && substance.analyticalMethods.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Analytical Methods &amp; Testing Principles
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {substance.analyticalMethods.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </section>
        )}

        {substance.qualityControl && substance.qualityControl.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Quality Control &amp; Formulation Evaluation
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {substance.qualityControl.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </section>
        )}

        {substance.impurities && substance.impurities.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Impurities &amp; Stability Considerations
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {substance.impurities.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </section>
        )}

        {substance.pharmaceuticalApplications && substance.pharmaceuticalApplications.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Pharmaceutical Applications &amp; Dosage Forms
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {substance.pharmaceuticalApplications.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Textbook-First Evidence Section (PDF Library Matches + Curriculum Textbooks) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Textbook-First References &amp; PDF Library Evidence</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Searches your local PDF Knowledge Library first, then lists relevant standard pharmaceutical textbooks.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              openKnowledgeLibrary({ searchQuery: substance.name.split('(')[0].trim() })
            }
            className="min-h-[34px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap"
          >
            Open PDF Knowledge Library
          </button>
        </div>

        {searchingPdfs ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scanning imported textbook PDFs...
          </p>
        ) : pdfHits.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {pdfHits.map((hit) => (
              <div
                key={hit.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {hit.bookTitle} ·{' '}
                    <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                      Page {hit.pageNumber}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {hit.snippet}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openKnowledgeLibrary({
                      bookId: hit.bookId,
                      pageNumber: hit.pageNumber,
                      searchQuery: substance.name.split('(')[0].trim()
                    })
                  }
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Page {hit.pageNumber}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            {books.length === 0
              ? 'No textbook PDFs are currently imported in the PDF Knowledge Library. Import your pharmacology, pharmaceutics, or analysis textbook PDFs to unlock exact page citations here.'
              : `No exact page matches for "${substance.name}" were found across your ${books.length} imported PDF(s).`}
          </div>
        )}

        {matchingSeededTextbooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchingSeededTextbooks.map((tb) => (
              <div
                key={tb.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {tb.subject} · {tb.accessLabel}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{tb.title}</p>
                {tb.authors && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{tb.authors}</p>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {tb.description}
                </p>
                <button
                  type="button"
                  onClick={() => openReferenceCenter({ referenceId: tb.id })}
                  className="pt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Inspect in Reference Center</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Practical Lab Connections, Related Analytical Tests & Study Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Practical &amp; Laboratory Connections</span>
          </h3>
          <div className="space-y-2.5">
            {substance.labConnections.map((conn, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{conn.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{conn.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchLab(conn)}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {linkedTestModules.map((test) => (
              <div
                key={test.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Analytical Learning Guide
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {test.testName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAnalyticalTest(test.id)}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Microscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Study Method</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Related Academic Topics (Study Mode)</span>
          </h3>
          <div className="space-y-2.5">
            {substance.academicLinks.map((link, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
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
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>Open in Study Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Pharmacopoeia Access Status Panel (Truthful Labeling — Never Pretending Restricted Texts Are Local) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Relevant Pharmacopoeias &amp; Monograph Access Status
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent status showing whether local user-owned PDFs, publicly accessible portals, or licensed/restricted official publications apply for {substance.name}.
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
          {relevantCompendia.map(({ entry, availability }) => {
            const safeUrl = sanitizeHttpUrl(entry.officialWebsite);
            const isLocalOrPublic =
              availability.status === 'imported_user_pdf' ||
              availability.status === 'publicly_accessible' ||
              availability.status === 'official_locally_available';
            const toneClass = isLocalOrPublic
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-amber-700 dark:text-amber-400';

            return (
              <div
                key={entry.id}
                className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {entry.abbreviation} — {entry.fullName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${toneClass}`}>
                      {isLocalOrPublic ? (
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{availability.label}</span>
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {availability.detail}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenPharmacopoeiaEntry(entry.id)}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    Compendium Details
                  </button>
                  {availability.linkedBook && (
                    <button
                      type="button"
                      onClick={() =>
                        openKnowledgeLibrary({
                          bookId: availability.linkedBook!.id,
                          searchQuery: substance.name.split('(')[0].trim()
                        })
                      }
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                    >
                      Search Imported PDF
                    </button>
                  )}
                  {safeUrl && (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Official Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
