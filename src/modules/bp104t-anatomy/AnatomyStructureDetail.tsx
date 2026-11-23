import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookmarkPlus,
  ChevronRight,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Images,
  Layers,
  Library,
  Search,
  Trash2,
  Upload
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getAttachedResourcesForContext } from '../resource-hub/resourceHubStorage';
import { SavedResourceRecord } from '../resource-hub/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { getAllBooks, searchAllBooks } from '../knowledge-library/libraryDb';
import { BookRecord, BookSearchResult } from '../knowledge-library/types';
import ImageViewerModal from '../visual-library/ImageViewerModal';
import VisualThumbnail from '../visual-library/VisualThumbnail';
import { VisualMediaItem } from '../visual-library/types';
import Asset3DConnector from '../assets-3d/Asset3DConnector';
import { getAllVisuals } from '../visual-library/visualDb';
import {
  AnatomicalCategoryId,
  AnatomicalStructureEntity,
  AnatomyDiagramKey,
  LocalTopicPdfLink
} from '../../types/academicEngine';
import {
  getCategoryLabel,
  getCurriculumBreadcrumbsForStructure,
  getLocalTopicPdfLinks,
  getRelatedStructures,
  getSubtopicsForStructure,
  getTextbookRefsForStructure,
  getVisualsForStructure,
  removeLocalTopicPdfLink,
  saveLocalTopicPdfLink
} from '../../utils/academicEngineUtils';

interface AnatomyStructureDetailProps {
  structure: AnatomicalStructureEntity;
  onBackToDirectory: () => void;
  onSelectStructure: (structureId: string) => void;
  onFilterByCategory: (categoryId: AnatomicalCategoryId) => void;
  onOpenDiagramSchematic?: (diagramKey: AnatomyDiagramKey) => void;
  onStartPracticeForCategory?: (categoryId: AnatomicalCategoryId) => void;
}

export default function AnatomyStructureDetail({
  structure,
  onBackToDirectory,
  onSelectStructure,
  onFilterByCategory,
  onOpenDiagramSchematic,
  onStartPracticeForCategory
}: AnatomyStructureDetailProps) {
  const { openKnowledgeLibrary, openVisualLibrary, openResourceHub, openStudyMode } =
    useLibraryNavigation();

  const [allVisuals, setAllVisuals] = useState<VisualMediaItem[]>([]);
  const [viewerItem, setViewerItem] = useState<VisualMediaItem | null>(null);

  const [books, setBooks] = useState<BookRecord[]>([]);
  const [pdfMatches, setPdfMatches] = useState<BookSearchResult[]>([]);
  const [searchingPdfs, setSearchingPdfs] = useState(false);

  const [localPdfLinks, setLocalPdfLinks] = useState<LocalTopicPdfLink[]>(() =>
    getLocalTopicPdfLinks(structure.id)
  );
  const [attachedHubResources, setAttachedHubResources] = useState<SavedResourceRecord[]>(() =>
    getAttachedResourcesForContext({ structureId: structure.id })
  );
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinBookId, setPinBookId] = useState('');
  const [pinPage, setPinPage] = useState('');
  const [pinNote, setPinNote] = useState('');

  useEffect(() => {
    setLocalPdfLinks(getLocalTopicPdfLinks(structure.id));
    setAttachedHubResources(getAttachedResourcesForContext({ structureId: structure.id }));
    setShowPinForm(false);
    setPinPage('');
    setPinNote('');
  }, [structure.id]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllVisuals(), getAllBooks()])
      .then(([loadedVisuals, loadedBooks]) => {
        if (cancelled) return;
        setAllVisuals(loadedVisuals);
        setBooks(loadedBooks);
        if (loadedBooks.length > 0) {
          setPinBookId((prev) => prev || loadedBooks[0].id);
        }
      })
      .catch(() => {
        // ignore storage loading errors
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const searchableBooks = books.filter((b) => b.hasSearchableText);
    if (searchableBooks.length === 0) {
      setPdfMatches([]);
      setSearchingPdfs(false);
      return;
    }

    setSearchingPdfs(true);
    const cleanPrimary = structure.name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    const strippedDirectional = cleanPrimary.replace(/^(Right|Left)\s+/i, '').trim();
    const baseSingularMap: Record<string, string> = {
      Lungs: 'lung',
      Eyes: 'eye',
      Ears: 'ear',
      Teeth: 'tooth',
      Gums: 'gingiva',
      Tonsils: 'tonsil',
      Bronchi: 'bronchus',
      Tendons: 'tendon',
      Ligaments: 'ligament'
    };
    const candidates = Array.from(
      new Set(
        [
          cleanPrimary,
          strippedDirectional !== cleanPrimary ? strippedDirectional : '',
          baseSingularMap[cleanPrimary] || '',
          structure.alternateNames[0] || ''
        ].filter((t) => t.trim().length >= 3)
      )
    );

    (async () => {
      try {
        for (const term of candidates) {
          const deptHits = await searchAllBooks(term, 'anatomy', 3);
          if (cancelled) return;
          if (deptHits.length > 0) {
            setPdfMatches(deptHits);
            setSearchingPdfs(false);
            return;
          }
        }
        for (const term of candidates) {
          const globalHits = await searchAllBooks(term, undefined, 3);
          if (cancelled) return;
          if (globalHits.length > 0) {
            setPdfMatches(globalHits);
            setSearchingPdfs(false);
            return;
          }
        }
        if (!cancelled) {
          setPdfMatches([]);
          setSearchingPdfs(false);
        }
      } catch {
        if (!cancelled) {
          setPdfMatches([]);
          setSearchingPdfs(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [structure.id, structure.name, structure.alternateNames, books]);

  const hierarchy = useMemo(
    () => getCurriculumBreadcrumbsForStructure(structure),
    [structure]
  );

  const subtopics = useMemo(() => getSubtopicsForStructure(structure), [structure]);
  const relatedStructures = useMemo(() => getRelatedStructures(structure), [structure]);
  const textbookRefs = useMemo(() => getTextbookRefsForStructure(structure), [structure]);
  const linkedVisuals = useMemo(
    () => getVisualsForStructure(structure, allVisuals),
    [structure, allVisuals]
  );

  const handleSavePdfBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find((b) => b.id === pinBookId);
    if (!book) return;
    const parsedPage = pinPage.trim() ? Math.max(1, Math.min(book.pageCount, Number(pinPage) || 1)) : undefined;
    const updated = saveLocalTopicPdfLink({
      structureId: structure.id,
      bookId: book.id,
      bookTitle: book.title,
      pageNumber: parsedPage,
      note: pinNote.trim() || undefined
    });
    setLocalPdfLinks(updated);
    setPinPage('');
    setPinNote('');
    setShowPinForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Hierarchy Breadcrumb & Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Curriculum hierarchy" className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anatomy Explorer</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>{hierarchy.subject.title}</span>
          {hierarchy.topic && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => {
                  if (hierarchy.topic?.categoryId) {
                    onFilterByCategory(hierarchy.topic.categoryId);
                  }
                }}
                className="hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                {hierarchy.topic.title}
              </button>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
            #{structure.catalogNumber} {structure.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              openResourceHub({
                query: structure.scientificName
                  ? `${structure.name} ${structure.scientificName}`
                  : structure.name,
                context: {
                  id: `structure:${structure.id}`,
                  kind: 'structure',
                  label: `#${structure.catalogNumber} ${structure.name}`,
                  departmentId: 'anatomy',
                  structureId: structure.id,
                  moduleId: 'anatomy',
                  tab: 'explorer'
                }
              })
            }
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Globe className="w-4 h-4" />
            <span>Find Scientific Resources</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openStudyMode({
                subjectCode: 'BP104T',
                topicId:
                  structure.primaryCategory === 'urinary'
                    ? 'syllabus_official_bpharm_sem1_BP104T_engine_urinary_nephron'
                    : undefined
              })
            }
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Study Topic</span>
          </button>

          {onStartPracticeForCategory && (
            <button
              type="button"
              onClick={() => onStartPracticeForCategory(structure.primaryCategory)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Practice {getCategoryLabel(structure.primaryCategory)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Structure Header Summary Card */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              Catalog #{String(structure.catalogNumber).padStart(2, '0')}
              {structure.scientificName ? ` · ${structure.scientificName}` : ''}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {structure.name}
            </h2>
            {structure.alternateNames.length > 0 && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Also known as: {structure.alternateNames.join(' · ')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {structure.categories.map((catId) => (
              <button
                key={catId}
                type="button"
                onClick={() => onFilterByCategory(catId)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  catId === structure.primaryCategory
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                }`}
                title="Filter directory by this anatomical system"
              >
                {getCategoryLabel(catId)}
              </button>
            ))}
          </div>
        </div>

        {structure.overview && (
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800">
            {structure.overview}
          </p>
        )}
      </header>

      {/* Main Content Grid: Academic Information (Left 7 cols) + Visuals & PDFs (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Academic Sections Column */}
        <div className="lg:col-span-7 space-y-4">
          {structure.definition && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Definition</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {structure.definition}
              </p>
            </section>
          )}

          {structure.anatomicalLocation && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Anatomical Location</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {structure.anatomicalLocation}
              </p>
            </section>
          )}

          {structure.structure && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Structural Organization</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {structure.structure}
              </p>
            </section>
          )}

          {structure.components && structure.components.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Key Components &amp; Substructures</h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
                {structure.components.map((comp) => (
                  <div key={comp.name} className="p-3.5 space-y-1">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {comp.name}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {comp.role}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {structure.functions && structure.functions.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Functions</h3>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5 leading-relaxed">
                {structure.functions.map((fn) => (
                  <li key={fn}>{fn}</li>
                ))}
              </ul>
            </section>
          )}

          {structure.physiology && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Physiology</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {structure.physiology}
              </p>
            </section>
          )}

          {subtopics.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Linked Curriculum Subtopics</span>
              </h3>
              <div className="space-y-2.5">
                {subtopics.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.title}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {sub.summary}
                    </p>
                    {sub.relatedStructureIds && sub.relatedStructureIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {sub.relatedStructureIds
                          .filter((id) => id !== structure.id)
                          .map((relId) => (
                            <button
                              key={relId}
                              type="button"
                              onClick={() => onSelectStructure(relId)}
                              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mr-2"
                            >
                              <span>Inspect linked substructure</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {structure.clinicalSignificance && structure.clinicalSignificance.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clinical Significance</h3>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5 leading-relaxed">
                {structure.clinicalSignificance.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {structure.pharmaceuticalRelevance && structure.pharmaceuticalRelevance.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Pharmaceutical &amp; Pharmacokinetic Relevance
              </h3>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5 leading-relaxed">
                {structure.pharmaceuticalRelevance.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {structure.examEssentials && structure.examEssentials.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                B.Pharm Exam Essentials
              </h3>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5 leading-relaxed">
                {structure.examEssentials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {relatedStructures.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Related Structures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {relatedStructures.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectStructure(rel.id)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left flex items-center justify-between gap-2 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        #{rel.catalogNumber} · {getCategoryLabel(rel.primaryCategory)}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {rel.name}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Scientific Visuals + Interactive Schematic + PDF Knowledge Library */}
        <aside className="lg:col-span-5 space-y-5">
          {/* Scientific Visuals Connection */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Images className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Scientific Visuals</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {linkedVisuals.length} {linkedVisuals.length === 1 ? 'plate' : 'plates'}
              </span>
            </div>

            {linkedVisuals.length > 0 ? (
              <div className="space-y-3">
                {linkedVisuals.map((vis) => {
                  const isHeartPlate = vis.id === 'builtin_heart_anatomy';
                  const isNephronPlate = vis.id === 'builtin_nephron_anatomy';
                  return (
                    <div
                      key={vis.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setViewerItem(vis)}
                        className="w-full text-left group block"
                      >
                        <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                          <VisualThumbnail
                            item={vis}
                            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform"
                          />
                        </div>
                        <div className="p-3.5 space-y-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {vis.title}
                          </p>
                          {vis.caption && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {vis.caption}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {vis.sourceName} · Click for zoom, fullscreen &amp; structure pins
                          </p>
                        </div>
                      </button>

                      {isHeartPlate && (
                        <div className="px-3.5 pb-3.5">
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 leading-relaxed">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Illustration Accuracy Notice:</strong> The bundled raster figure contains minor printed label defects (&ldquo;Left Pulmonary Arterie&rdquo;, misplaced &ldquo;Inferior Vena Cava&rdquo; upper-left label, and duplicate &ldquo;Aortic Valve&rdquo; text). Verify landmarks using the interactive Pin Schematic below.
                            </span>
                          </div>
                        </div>
                      )}

                      {isNephronPlate && (
                        <div className="px-3.5 pb-3.5">
                          <div className="p-2.5 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong>Microscopic Scope Note:</strong> Depicts a single microscopic functional nephron (~1 million per kidney) rather than gross external kidney morphology.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  No bundled anatomical plate is currently linked to <strong>{structure.name}</strong>. You can upload a textbook diagram or search open-access repositories directly in the Visual Library.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openVisualLibrary({
                        department: 'anatomy',
                        category: 'anatomy',
                        query: structure.name,
                        tab: 'discover'
                      })
                    }
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Discover Open Images</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openVisualLibrary({
                        department: 'anatomy',
                        category: 'anatomy',
                        query: structure.name,
                        openUpload: true
                      })
                    }
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Visual</span>
                  </button>
                </div>
              </div>
            )}

            {structure.anatomyDiagramKey && onOpenDiagramSchematic && (
              <button
                type="button"
                onClick={() => onOpenDiagramSchematic(structure.anatomyDiagramKey!)}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between gap-2 transition-colors"
              >
                <span>Open Interactive Pin Schematic (BP104T)</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}
          </section>

          <Asset3DConnector
            departmentId="anatomy"
            subjectCode="BP104T"
            structureId={structure.id}
            structureName={structure.name}
            defaultSearchQuery={structure.name}
            defaultCategory="anatomy"
            title="3D Anatomical Models"
            subtitle={`Attach or inspect GLB / glTF / STL models for ${structure.name}`}
          />

          {/* Textbook References & Live IndexedDB PDF Knowledge Library */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Library className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Textbook &amp; PDF References</span>
              </h3>
              <button
                type="button"
                onClick={() => openKnowledgeLibrary({ searchQuery: structure.name })}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Open PDF Library
              </button>
            </div>

            {/* Live PDF Search Hits inside User's Uploaded Books */}
            {searchingPdfs ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Searching uploaded PDF textbooks for "{structure.name}"...
              </p>
            ) : pdfMatches.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Matches in Your IndexedDB PDFs
                </p>
                {pdfMatches.map(({ book, matches }) => {
                  const first = matches[0];
                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() =>
                        openKnowledgeLibrary({
                          bookId: book.id,
                          pageNumber: first.pageNumber,
                          searchQuery: structure.name
                        })
                      }
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left space-y-1 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {book.title}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                          Page {first.pageNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        …{first.beforeContext}
                        <strong className="text-slate-900 dark:text-white">{first.matchedText}</strong>
                        {first.afterContext}…
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : books.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  No automatic page hits for "{structure.name}" in uploaded PDFs. Open a saved book directly or pin a personal page reference:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {books.slice(0, 3).map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => openKnowledgeLibrary({ bookId: book.id, pageNumber: book.lastReadPage || 1 })}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate max-w-[180px]">{book.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Upload a PDF textbook (e.g., Tortora or Ross &amp; Wilson) in the Knowledge Library to unlock instant page-level jump links here.
                </p>
              </div>
            )}

            {/* User-Pinned Local Page Links */}
            {localPdfLinks.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Your Pinned Textbook Pages
                </p>
                {localPdfLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openKnowledgeLibrary({
                          bookId: link.bookId,
                          pageNumber: link.pageNumber || 1
                        })
                      }
                      className="min-w-0 text-left flex-1 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {link.bookTitle}
                        {link.pageNumber ? ` · Page ${link.pageNumber}` : ''}
                      </p>
                      {link.note && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {link.note}
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalPdfLinks(removeLocalTopicPdfLink(link.id, structure.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label="Remove pinned page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {books.length > 0 && (
              <div>
                {!showPinForm ? (
                  <button
                    type="button"
                    onClick={() => setShowPinForm(true)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1.5"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Pin a personal PDF page bookmark</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleSavePdfBookmark}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <select
                      value={pinBookId}
                      onChange={(e) => setPinBookId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    >
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b.pageCount} pp.)
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        min={1}
                        value={pinPage}
                        onChange={(e) => setPinPage(e.target.value)}
                        placeholder="Page #"
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={pinNote}
                        onChange={(e) => setPinNote(e.target.value)}
                        placeholder="Optional chapter note"
                        className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Save Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPinForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Verified Curriculum Textbook Bibliography (No fabricated page numbers) */}
            {textbookRefs.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Recommended Curriculum Textbooks</span>
                </p>
                <div className="space-y-2">
                  {textbookRefs.map((ref) => (
                    <div key={ref.id} className="text-xs space-y-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{ref.title}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {ref.authors} · {ref.editionNote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved / Imported External Resources Linked to This Structure */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Resource Hub Attachments ({attachedHubResources.length})</span>
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openResourceHub({
                      query: structure.name,
                      context: {
                        id: `structure:${structure.id}`,
                        kind: 'structure',
                        label: `#${structure.catalogNumber} ${structure.name}`,
                        departmentId: 'anatomy',
                        structureId: structure.id,
                        moduleId: 'anatomy',
                        tab: 'explorer'
                      }
                    })
                  }
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Discover More
                </button>
              </div>
              {attachedHubResources.length > 0 ? (
                <div className="space-y-2">
                  {attachedHubResources.map((rec) => {
                    const safeUrl = sanitizeHttpUrl(rec.resource.sourceUrl);
                    return (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {rec.resource.title}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="truncate">
                            {rec.resource.providerName} · {rec.resource.publicationDate}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {rec.linkedBookId && (
                              <button
                                type="button"
                                onClick={() => openKnowledgeLibrary({ bookId: rec.linkedBookId })}
                                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                              >
                                PDF
                              </button>
                            )}
                            {rec.linkedVisualId && (
                              <button
                                type="button"
                                onClick={() => openVisualLibrary({ visualId: rec.linkedVisualId })}
                                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                              >
                                Plate
                              </button>
                            )}
                            {safeUrl && (
                              <a
                                href={safeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Source</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No external articles or textbooks attached yet. Click &ldquo;Find Scientific Resources&rdquo; above to search PubMed, Europe PMC, OpenStax, and NCBI Bookshelf.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Interactive Image Viewer Modal */}
      {viewerItem && (
        <ImageViewerModal
          item={viewerItem}
          allVisuals={linkedVisuals}
          onClose={() => setViewerItem(null)}
          onSelectVisual={(next) => setViewerItem(next)}
          onUpdated={(updated) => {
            setAllVisuals((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
            setViewerItem(updated);
          }}
        />
      )}
    </div>
  );
}
