import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { LibraryBookMeta } from '../knowledge-library/types';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { runUnifiedKnowledgeSearch } from './knowledgeIndex';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import {
  DEPARTMENT_LABELS,
  KNOWLEDGE_KIND_LABELS,
  ORIGIN_LABELS,
  PharmacopoeiaDepartmentKey,
  PharmacopoeiaUserStore,
  SearchResultOrigin,
  UnifiedKnowledgeSearchResponse
} from './types';

interface PharmacopoeiaSearchProps {
  initialQuery?: string;
  initialDepartment?: PharmacopoeiaDepartmentKey | 'all';
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
  onSelectEntry: (entryId: string) => void;
  onSelectSubstance: (substanceId: string) => void;
  onSelectAnalyticalTest: (testId: string) => void;
  onRecordSearch?: (query: string) => void;
}

const SUGGESTED_QUERIES = [
  'Paracetamol',
  'Acetaminophen',
  'Aspirin',
  'Ferrous Sulphate',
  'Calcium Gluconate',
  'Bentonite',
  'Limit Test',
  'Arsenic Gutzeit',
  'Dissolution',
  'Sterility'
];

export default function PharmacopoeiaSearch({
  initialQuery = '',
  initialDepartment = 'all',
  userStore,
  books,
  referenceItems,
  referenceProfiles,
  onSelectEntry,
  onSelectSubstance,
  onSelectAnalyticalTest,
  onRecordSearch
}: PharmacopoeiaSearchProps) {
  const {
    openKnowledgeLibrary,
    openStudyMode,
    openReferenceCenter,
    openInteractiveExperiments,
    navigateToModule
  } = useLibraryNavigation();

  const [query, setQuery] = useState(initialQuery);
  const [originFilter, setOriginFilter] = useState<SearchResultOrigin | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<PharmacopoeiaDepartmentKey | 'all'>(
    initialDepartment
  );
  const [knowledgeRes, setKnowledgeRes] = useState<UnifiedKnowledgeSearchResponse | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialDepartment) setDepartmentFilter(initialDepartment);
  }, [initialDepartment]);

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      runUnifiedKnowledgeSearch({
        query,
        books,
        referenceItems,
        referenceProfiles,
        userStore
      })
        .then((res) => {
          if (!cancelled) {
            setKnowledgeRes(res);
            setSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setKnowledgeRes(null);
            setSearching(false);
          }
        });
    }, 90);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, userStore, books, referenceItems, referenceProfiles]);

  const filteredPortals = (knowledgeRes?.pharmacopoeiaResults || []).filter((hit) => {
    if (originFilter !== 'all' && hit.origin !== originFilter) return false;
    if (departmentFilter !== 'all' && hit.entryId) {
      const entry = PHARMACOPOEIA_DIRECTORY.find((e) => e.id === hit.entryId);
      if (entry && !entry.relevantDepartments.includes(departmentFilter)) return false;
    }
    return true;
  });

  const pdfHits = knowledgeRes?.textbookPdfHits || [];
  const seededTextbooks = knowledgeRes?.seededTextbooks || [];
  const substances = knowledgeRes?.substances || [];
  const analyticalTests = knowledgeRes?.analyticalTests || [];
  const academicTopics = knowledgeRes?.academicTopics || [];

  return (
    <div className="space-y-6">
      {/* Unified Search Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Unified Pharmaceutical Knowledge Search
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Textbook-first search across imported PDFs, reference textbooks, drugs &amp; synonyms, excipients, dosage forms, analytical tests, Study Mode topics, and pharmacopoeial portals. Every result explicitly states its origin.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onRecordSearch && query.trim().length >= 2) onRecordSearch(query.trim());
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drug names, synonyms (Acetaminophen, FeSO4), excipients, assays, impurities, or pharmacopoeias..."
            className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            Suggestions:
          </span>
          {SUGGESTED_QUERIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => {
                setQuery(sq);
                if (onRecordSearch) onRecordSearch(sq);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
            >
              {sq}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as SearchResultOrigin | 'all')}
            aria-label="Filter compendial results by origin"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Compendial Origins</option>
            <option value="local_metadata">{ORIGIN_LABELS.local_metadata}</option>
            <option value="imported_reference_file">{ORIGIN_LABELS.imported_reference_file}</option>
            <option value="public_official_source">{ORIGIN_LABELS.public_official_source}</option>
            <option value="external_official_portal">{ORIGIN_LABELS.external_official_portal}</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value as PharmacopoeiaDepartmentKey | 'all')
            }
            aria-label="Filter by pharmaceutical subject"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Pharmaceutical Subjects</option>
            {(Object.keys(DEPARTMENT_LABELS) as PharmacopoeiaDepartmentKey[]).map((key) => (
              <option key={key} value={key}>
                {DEPARTMENT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {searching ? (
        <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Searching imported textbook PDFs, drug workspaces, analytical tests &amp; pharmacopoeias...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: TEXTBOOK & IMPORTED PDF EVIDENCE (FIRST) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>1. Textbook &amp; Imported PDF Evidence</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {pdfHits.length} local PDF match(es) · {seededTextbooks.length} textbook ref(s)
              </span>
            </div>

            {pdfHits.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {pdfHits.map((hit) => (
                  <div
                    key={hit.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {hit.bookTitle} ·{' '}
                        <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                          Page {hit.pageNumber}
                        </span>
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          {' '}
                          · Imported PDF Library
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
                          searchQuery: query.trim() || undefined
                        })
                      }
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open Page {hit.pageNumber} in PDF Library</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                {books.length === 0
                  ? 'No local textbook PDFs are currently imported in the PDF Knowledge Library. Curriculum textbooks from the Reference Center are listed below.'
                  : `No exact page hits found for "${query.trim()}" in your ${books.length} imported PDF(s).`}
              </p>
            )}

            {seededTextbooks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seededTextbooks.map((tb) => (
                  <div
                    key={tb.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                        {tb.subject} · {tb.accessLabel}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tb.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openReferenceCenter({ referenceId: tb.id })}
                      className="min-h-[32px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                    >
                      Open Reference
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: DRUGS, SUBSTANCES, EXCIPIENTS & DOSAGE FORMS */}
          {substances.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Drugs, Substances, Excipients &amp; Dosage Forms ({substances.length})
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  PharmaLab Knowledge Layer
                </span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {substances.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        {KNOWLEDGE_KIND_LABELS[sub.kind]} · {sub.dataSourceOrigin}
                      </p>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {sub.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {sub.overview}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSubstance(sub.id)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <span>Open Drug Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: ANALYTICAL TESTS & STUDY MODE */}
          {(analyticalTests.length > 0 || academicTopics.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {analyticalTests.length > 0 && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>3. Analytical Tests &amp; Practical Labs ({analyticalTests.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {analyticalTests.map((test) => (
                      <div
                        key={test.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {test.dataSourceOrigin}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {test.testName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectAnalyticalTest(test.id)}
                            className="min-h-[32px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                          >
                            Open Guide
                          </button>
                          {test.labConnections[0] && (
                            <button
                              type="button"
                              onClick={() => {
                                const c = test.labConnections[0];
                                if (c.kind === 'experiment' && c.experimentId) {
                                  openInteractiveExperiments({ experimentId: c.experimentId, stage: 'simulate' });
                                } else if (c.kind === 'module' && c.moduleId) {
                                  navigateToModule(c.moduleId, c.tab || null);
                                }
                              }}
                              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                            >
                              Lab
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {academicTopics.length > 0 && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>4. Syllabus &amp; Study Mode Topics ({academicTopics.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {academicTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {topic.subjectCode} · {topic.sourceLabel}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {topic.topicTitle}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                            {topic.summary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openStudyMode({
                              syllabusId: topic.syllabusId,
                              subjectCode: topic.subjectCode.split('/')[0].trim()
                            })
                          }
                          className="min-h-[32px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
                        >
                          Study Mode
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* SECTION 5: PHARMACOPOEIA DIRECTORY & OFFICIAL PORTALS */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                5. Pharmacopoeial Compendia &amp; Official Portals ({filteredPortals.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Origin-tagged portals
              </span>
            </div>

            {filteredPortals.length === 0 ? (
              <p className="p-5 text-xs text-slate-500 dark:text-slate-400">
                No pharmacopoeia portal entries match the selected origin/subject filter.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredPortals.map((hit) => {
                  const safeUrl = sanitizeHttpUrl(hit.externalUrl);
                  const OriginIcon =
                    hit.origin === 'imported_reference_file'
                      ? FileText
                      : hit.origin === 'public_official_source'
                      ? ShieldCheck
                      : Globe;
                  return (
                    <article key={hit.id} className="p-4 sm:p-5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                          <OriginIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{hit.originLabel}</span>
                        </span>
                        {hit.entryAbbreviation && (
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {hit.entryAbbreviation}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {hit.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {hit.snippet}
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {hit.entryId && (
                          <button
                            type="button"
                            onClick={() => onSelectEntry(hit.entryId!)}
                            className="min-h-[32px] px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <span>Compendium Info</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {safeUrl && (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[32px] px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
