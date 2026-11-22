import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  Globe,
  Grid,
  ImagePlus,
  Layers,
  List,
  Loader2,
  MapPin,
  Microscope,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getAllBooks, searchAllBooks } from '../knowledge-library/libraryDb';
import { CrossBookSearchResult, LibraryBookMeta } from '../knowledge-library/types';
import ImageViewerModal from './ImageViewerModal';
import VisualThumbnail from './VisualThumbnail';
import { inferDomainFromCategory, resolveAcademicContextForVisual } from './academicRegistry';
import { runAcademicSearch } from './academicSearch';
import { ACADEMIC_DOMAIN_LABELS, AcademicDomain } from './academicTypes';
import {
  DISCOVERY_SUGGESTIONS,
  DiscoverySourceFilter,
  discoverOpenAccessImages
} from './openAccessDiscovery';
import {
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
  DepartmentId,
  OpenAccessCandidate,
  VisualCategory,
  VisualMediaItem
} from './types';
import {
  deleteVisual,
  getAllVisuals,
  importOpenAccessImage,
  saveUploadedImage
} from './visualDb';

interface VisualLibraryModuleProps {
  initialDepartment?: DepartmentId | 'all' | null;
  initialCategory?: VisualCategory | 'all' | null;
  initialQuery?: string | null;
  initialVisualId?: string | null;
  initialAnnotationId?: string | null;
  navNonce?: number;
}

type LibraryTab = 'repository' | 'discover';
type ViewMode = 'grid' | 'list';

const ACADEMIC_SEARCH_EXAMPLES = [
  'filtration of blood',
  'glomerulus',
  'loop diuretic',
  'arsenic limit test',
  'aspirin',
  'peptidoglycan'
];

export default function VisualLibraryModule({
  initialDepartment,
  initialCategory,
  initialQuery,
  initialVisualId,
  initialAnnotationId,
  navNonce
}: VisualLibraryModuleProps) {
  const { openKnowledgeLibrary, navigateToModule, setWorkspaceSection, recordActivity } =
    useLibraryNavigation();

  const [activeTab, setActiveTab] = useState<LibraryTab>('repository');
  const [visuals, setVisuals] = useState<VisualMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [categoryFilter, setCategoryFilter] = useState<'all' | VisualCategory>(
    initialCategory || 'all'
  );
  const [departmentFilter, setDepartmentFilter] = useState<'all' | DepartmentId>(
    initialDepartment || 'all'
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [viewerItem, setViewerItem] = useState<VisualMediaItem | null>(null);
  const [viewerAnnotationId, setViewerAnnotationId] = useState<string | null>(
    initialAnnotationId || null
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const handledJumpNonceRef = useRef<number | undefined>(undefined);

  // Live Knowledge Library PDF search integration for Academic Search
  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [pdfHits, setPdfHits] = useState<CrossBookSearchResult[]>([]);

  // Upload form modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadScientificName, setUploadScientificName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<VisualCategory>('anatomy');
  const [uploadDomain, setUploadDomain] = useState<AcademicDomain>('anatomy');
  const [uploadDepartments, setUploadDepartments] = useState<DepartmentId[]>(['anatomy']);
  const [uploadExperiments, setUploadExperiments] = useState('');
  const [uploadEquipment, setUploadEquipment] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadCreator, setUploadCreator] = useState('');
  const [uploadLicense, setUploadLicense] = useState('Personal Study / User Provided');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Online Discovery state
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverSource, setDiscoverSource] = useState<DiscoverySourceFilter>('all');
  const [discovering, setDiscovering] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<OpenAccessCandidate[]>([]);
  const [discoverWarnings, setDiscoverWarnings] = useState<string[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDepartmentFilter(initialDepartment || 'all');
    setCategoryFilter(initialCategory || 'all');
    if (typeof initialQuery === 'string') setSearchQuery(initialQuery);
    else if (navNonce) setSearchQuery('');
  }, [initialDepartment, initialCategory, initialQuery, navNonce]);

  const loadVisuals = useCallback(async () => {
    try {
      const [list, storedBooks] = await Promise.all([getAllVisuals(), getAllBooks()]);
      setVisuals(list);
      setBooks(storedBooks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Visual Library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisuals();
  }, [loadVisuals]);

  // Open specific visual + structure annotation when navigated from another module
  useEffect(() => {
    if (!initialVisualId || visuals.length === 0) return;
    if (handledJumpNonceRef.current === navNonce && viewerItem?.id === initialVisualId) return;
    const match = visuals.find((v) => v.id === initialVisualId);
    if (match) {
      handledJumpNonceRef.current = navNonce;
      setActiveTab('repository');
      setViewerAnnotationId(initialAnnotationId || null);
      setViewerItem(match);
    }
  }, [initialVisualId, initialAnnotationId, navNonce, visuals, viewerItem?.id]);

  // Live PDF textbook passage matching when searching
  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();
    if (q.length < 2 || books.every((b) => !b.hasSearchableText)) {
      setPdfHits([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchAllBooks(q, undefined, 2)
        .then((res) => {
          if (!cancelled) setPdfHits(res.slice(0, 4));
        })
        .catch(() => {
          if (!cancelled) setPdfHits([]);
        });
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, books]);

  const academicSearch = useMemo(
    () => runAcademicSearch(searchQuery, visuals),
    [searchQuery, visuals]
  );

  const filteredImageHits = useMemo(() => {
    return academicSearch.images.filter(({ item }) => {
      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesDept =
        departmentFilter === 'all' || item.departments.includes(departmentFilter);
      return matchesCat && matchesDept;
    });
  }, [academicSearch.images, categoryFilter, departmentFilter]);

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (activeTab === 'discover') {
      setWorkspaceSection('Open Discovery', viewerItem?.title ?? null);
    } else if (categoryFilter === 'equipment') {
      setWorkspaceSection('Equipment & Apparatus', viewerItem?.title ?? null);
    } else if (categoryFilter !== 'all') {
      setWorkspaceSection(CATEGORY_LABELS[categoryFilter], viewerItem?.title ?? null);
    } else {
      setWorkspaceSection(viewerItem ? viewerItem.title : null, null);
    }
  }, [activeTab, categoryFilter, viewerItem, setWorkspaceSection]);

  const openViewer = (item: VisualMediaItem, annotationId: string | null = null) => {
    setViewerAnnotationId(annotationId);
    setViewerItem(item);
    recordActivity({
      key: `visual:${item.id}`,
      kind: item.category === 'equipment' ? 'equipment' : 'visual',
      title: item.title,
      subtitle: `${CATEGORY_LABELS[item.category]} · Visual Library`,
      moduleId: 'visual_library',
      visualId: item.id
    });
  };

  const handleOpenUploadWithFile = (file: File) => {
    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    setUploadScientificName('');
    setUploadOpen(true);
    setError(null);
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setError(null);
    try {
      const splitList = (val: string) =>
        val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      const saved = await saveUploadedImage(uploadFile, {
        title: uploadTitle,
        caption: uploadCaption,
        description: uploadDescription,
        category: uploadCategory,
        academicDomain: uploadDomain,
        academicData: uploadScientificName.trim()
          ? {
              domain: uploadDomain,
              scientificOrChemicalName: uploadScientificName.trim(),
              updatedAt: Date.now()
            }
          : undefined,
        departments: uploadDepartments,
        topics: splitList(uploadTags),
        experiments: splitList(uploadExperiments),
        equipment: splitList(uploadEquipment),
        tags: splitList(uploadTags),
        creator: uploadCreator,
        license: uploadLicense
      });

      setVisuals((prev) => [saved, ...prev]);
      setNotice(
        `Saved "${saved.title}" to your Visual Library. Open it to enrich academic sections or place interactive study pins.`
      );
      setUploadOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadScientificName('');
      setUploadCaption('');
      setUploadDescription('');
      setUploadExperiments('');
      setUploadEquipment('');
      setUploadTags('');
      setUploadCreator('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteVisual(id);
    setVisuals((prev) => prev.filter((v) => v.id !== id));
    setPendingDeleteId(null);
  };

  const handleRunDiscovery = async (queryOverride?: string) => {
    const q = (queryOverride ?? discoverQuery).trim();
    if (q.length < 2) return;

    if (queryOverride) setDiscoverQuery(queryOverride);
    setDiscovering(true);
    setDiscoverWarnings([]);
    setError(null);

    try {
      const { candidates, warnings } = await discoverOpenAccessImages(q, discoverSource);
      setDiscoverResults(candidates);
      setDiscoverWarnings(warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image discovery request failed.');
    } finally {
      setDiscovering(false);
    }
  };

  const handleImportCandidate = async (candidate: OpenAccessCandidate) => {
    setImportingId(candidate.id);
    setError(null);
    try {
      const saved = await importOpenAccessImage(candidate);
      setVisuals((prev) => [saved, ...prev]);
      setImportedUrls((prev) => ({ ...prev, [candidate.fullUrl]: true }));
      setNotice(
        `Imported "${saved.title}" (${saved.license}) from ${saved.sourceName}. Click Inspect to link a subject or enrich its academic guide.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import open-access image.');
    } finally {
      setImportingId(null);
    }
  };

  const toggleUploadDept = (dept: DepartmentId) => {
    setUploadDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2 max-w-3xl">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Interactive Scientific Atlas &amp; Academic Visual Learning System
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
            Academic Visual Learning Library
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Explore interactive anatomical plates, pharmacology pathways, analytical apparatus, molecular structures, and microbiology envelopes with structured theory, clickable structures, exam self-checks, and direct textbook links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleOpenUploadWithFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'discover' ? 'repository' : 'discover')}
            className={`h-10 px-4 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'discover'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {activeTab === 'discover' ? 'Back to My Library' : 'Discover Open Images'}
            </span>
          </button>
        </div>
      </section>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('repository')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'repository'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-none'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Academic Visual Repository ({visuals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'discover'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-none'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Open-Access Repository Discovery
          </button>
        </div>
      </div>

      {/* Notices & Errors */}
      {error && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/35 rounded-2xl p-4 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-sm text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 text-rose-700 dark:text-rose-300"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {notice && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'repository' ? (
        <>
          {/* Academic Search & Filters */}
          <section className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-2xl">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by scientific name, function ('filtration of blood'), structure ('glomerulus'), drug, disease, or equipment..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value as 'all' | DepartmentId)}
                  aria-label="Filter by department"
                  className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Departments</option>
                  {(Object.keys(DEPARTMENT_LABELS) as DepartmentId[]).map((dept) => (
                    <option key={dept} value={dept}>
                      {DEPARTMENT_LABELS[dept]}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-none'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-none'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Academic Search Concept Starters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400 mr-1 whitespace-nowrap shrink-0">
                Quick concepts:
              </span>
              {ACADEMIC_SEARCH_EXAMPLES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchQuery(term)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                All Categories
              </button>
              {(Object.keys(CATEGORY_LABELS) as VisualCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </section>

          {/* Categorized Academic Search Breakdown (when searching) */}
          {isSearching &&
            (academicSearch.topics.length > 0 ||
              academicSearch.structures.length > 0 ||
              academicSearch.equipment.length > 0 ||
              academicSearch.resources.length > 0 ||
              pdfHits.length > 0) && (
              <section
                aria-label="Academic search breakdown"
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {/* Scientific Topics */}
                {academicSearch.topics.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Scientific Topics ({academicSearch.topics.length})</span>
                      </span>
                      <span className="text-xs font-normal text-slate-500">
                        Opens Academic Profile
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                      {academicSearch.topics.slice(0, 4).map(({ subject, linkedVisual, matchedOn }) => (
                        <button
                          key={subject.id}
                          type="button"
                          disabled={!linkedVisual}
                          onClick={() => linkedVisual && openViewer(linkedVisual)}
                          className="w-full py-2.5 first:pt-1 last:pb-1 text-left flex items-center justify-between gap-3 group disabled:opacity-50"
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {subject.identification.primaryName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {ACADEMIC_DOMAIN_LABELS[subject.domain]} · Matched: {matchedOn}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Structures & Components */}
                {academicSearch.structures.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          Structures &amp; Components ({academicSearch.structures.length})
                        </span>
                      </span>
                      <span className="text-xs font-normal text-slate-500">
                        Highlights exact pin
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                      {academicSearch.structures.slice(0, 5).map(({ annotation, visual }) => (
                        <button
                          key={`${visual.id}_${annotation.id}`}
                          type="button"
                          onClick={() => openViewer(visual, annotation.id)}
                          className="w-full py-2.5 first:pt-1 last:pb-1 text-left flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {annotation.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              In: {visual.title} · {annotation.functionRole}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {academicSearch.equipment.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        <Microscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Equipment ({academicSearch.equipment.length})</span>
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                      {academicSearch.equipment.slice(0, 4).map((eq) => (
                        <button
                          key={eq.name}
                          type="button"
                          onClick={() => openViewer(eq.visual)}
                          className="w-full py-2.5 first:pt-1 last:pb-1 text-left flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {eq.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {eq.visual.title}
                              {eq.experiments.length > 0 ? ` · ${eq.experiments.join(', ')}` : ''}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Academic Resources (Modules, Experiments & Uploaded Textbooks) */}
                {(academicSearch.resources.length > 0 || pdfHits.length > 0) && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          Related Academic Resources ({academicSearch.resources.length + pdfHits.length})
                        </span>
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                      {academicSearch.resources.slice(0, 4).map(({ link, sourceLabel }) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => navigateToModule(link.moduleId, link.tab)}
                          className="w-full py-2.5 first:pt-1 last:pb-1 text-left flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {link.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {link.kind.replace('_', ' ')} · Linked to {sourceLabel}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        </button>
                      ))}
                      {pdfHits.map(({ book, matches }) => {
                        const top = matches[0];
                        return (
                          <button
                            key={`${book.id}_${top.pageNumber}`}
                            type="button"
                            onClick={() =>
                              openKnowledgeLibrary({
                                bookId: book.id,
                                pageNumber: top.pageNumber,
                                searchQuery
                              })
                            }
                            className="w-full py-2.5 first:pt-1 last:pb-1 text-left flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate inline-flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">{book.title}</span>
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Knowledge Library PDF · Page {top.pageNumber}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Page {top.pageNumber}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

          {/* Image Results Header when Searching */}
          {isSearching && (
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Image Results ({filteredImageHits.length})</span>
              </span>
              {filteredImageHits.length > 0 && (
                <span>Ranked by academic relevance across structure, function &amp; clinical use</span>
              )}
            </div>
          )}

          {/* Grid or List View */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              ))}
            </div>
          ) : filteredImageHits.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                No scientific visuals match your active filters or query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setDepartmentFilter('all');
                }}
                className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Reset search &amp; filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImageHits.map(({ item, matchedReasons }) => {
                const isConfirming = pendingDeleteId === item.id;
                const ctx = resolveAcademicContextForVisual(item);
                const pinCount = ctx.annotations.length;
                return (
                  <article
                    key={item.id}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm dark:shadow-none transition-colors"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => openViewer(item)}
                        className="w-full aspect-[4/3] border-b border-slate-200 dark:border-slate-800 block overflow-hidden focus:outline-none"
                      >
                        <VisualThumbnail
                          item={item}
                          className="w-full h-full"
                          imgClassName="w-full h-full object-contain p-2 group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      </button>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                          <span className="truncate">{item.sourceName}</span>
                        </div>

                        <h2
                          onClick={() => openViewer(item)}
                          className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 cursor-pointer leading-snug line-clamp-2 transition-colors"
                        >
                          {item.title}
                        </h2>

                        {item.caption && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.caption}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums pt-0.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {ctx.completeness.completenessPercent}% Academic Guide
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span>
                            {pinCount > 0 ? `${pinCount} Interactive Pins` : 'Zoom & Pan'}
                          </span>
                          {matchedReasons.length > 0 && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Match: {matchedReasons.join(', ')}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      {isConfirming ? (
                        <div className="w-full flex items-center justify-between gap-2 text-xs">
                          <span className="text-rose-700 dark:text-rose-300 font-medium">
                            Delete image?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="px-2 py-1 rounded-md bg-rose-600 text-white font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {item.license}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.sourceType !== 'built-in' && (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10"
                                aria-label={`Delete ${item.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openViewer(item)}
                              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
                            >
                              Study Visual
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              {filteredImageHits.map(({ item, matchedReasons }) => {
                const ctx = resolveAcademicContextForVisual(item);
                const pinCount = ctx.annotations.length;
                return (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        type="button"
                        onClick={() => openViewer(item)}
                        className="w-24 aspect-[4/3] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0"
                      >
                        <VisualThumbnail
                          item={item}
                          className="w-full h-full"
                          imgClassName="w-full h-full object-contain p-1"
                        />
                      </button>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.sourceName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {ctx.completeness.completenessPercent}% Guide
                          </span>
                          {pinCount > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{pinCount} Pins</span>
                            </>
                          )}
                          {matchedReasons.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 dark:text-emerald-400">
                                {matchedReasons.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                        <h2
                          onClick={() => openViewer(item)}
                          className="text-sm sm:text-base font-bold text-slate-900 dark:text-white cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
                        >
                          {item.title}
                        </h2>
                        {item.caption && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                            {item.caption}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.sourceType !== 'built-in' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openViewer(item)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                      >
                        Open Learning Viewer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Open-Access Discovery Tab */
        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Search Open-Access Scientific Repositories
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Query Wikimedia Commons, OpenStax Biology/Anatomy (CC BY 4.0), PubChem NIH chemical structures (Public Domain), and GBIF botanical specimens. After importing, link the image to a PharmaLab subject or add custom study notes and pins.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunDiscovery();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  placeholder="Search anatomical plates, plant specimens, or chemical structures..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={discoverSource}
                onChange={(e) => setDiscoverSource(e.target.value as DiscoverySourceFilter)}
                aria-label="Select repository source"
                className="h-10 sm:h-auto px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Open Repositories</option>
                <option value="wikimedia">Wikimedia Commons</option>
                <option value="openstax">OpenStax Anatomy/Bio (CC BY)</option>
                <option value="pubchem">PubChem NIH (Structures)</option>
                <option value="gbif">GBIF (Botanical Specimens)</option>
              </select>

              <button
                type="submit"
                disabled={discovering || discoverQuery.trim().length < 2}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                {discovering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{discovering ? 'Searching...' : 'Search Repositories'}</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                Try:
              </span>
              {DISCOVERY_SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleRunDiscovery(term)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {discoverWarnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
              {discoverWarnings.join(' · ')}
            </div>
          )}

          {discovering ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Querying open-access scientific repositories...
              </p>
            </div>
          ) : discoverResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoverResults.map((cand) => {
                const isImported = Boolean(importedUrls[cand.fullUrl]);
                const isImporting = importingId === cand.id;
                return (
                  <article
                    key={cand.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm dark:shadow-none"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
                        <img
                          src={cand.previewUrl}
                          alt={cand.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {cand.repository}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              cand.isPermissiveLicense
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{cand.license}</span>
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                          {cand.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {cand.description}
                        </p>

                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                          <p className="truncate">
                            <strong>Creator:</strong> {cand.creator}
                          </p>
                          <p className="line-clamp-2">
                            <strong>Attribution:</strong> {cand.attribution}
                          </p>
                        </div>

                        {cand.licenseWarning && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
                            {cand.licenseWarning}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <a
                        href={cand.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleImportCandidate(cand)}
                        disabled={isImporting || isImported}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isImported
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
                        }`}
                      >
                        {isImporting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isImported ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isImported ? 'Imported' : isImporting ? 'Importing...' : 'Import to Library'}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
              <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                Discover Open-Access Scientific Visuals
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Enter an anatomical structure, medicinal plant species, laboratory apparatus, or chemical compound above to inspect openly licensed scientific imagery before importing locally.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Upload Image Modal */}
      {uploadOpen && uploadFile && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !uploading && setUploadOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Upload scientific image"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Scientific Image to Library
              </h2>
              <button
                type="button"
                onClick={() => !uploading && setUploadOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                aria-label="Close upload modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="space-y-3.5 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
                <span className="truncate font-medium">{uploadFile.name}</span>
                <span className="tabular-nums shrink-0">
                  {(uploadFile.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scientific / Chemical Name
                  </label>
                  <input
                    type="text"
                    value={uploadScientificName}
                    onChange={(e) => setUploadScientificName(e.target.value)}
                    placeholder="e.g. Senna alexandrina / Acetylsalicylic acid"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => {
                      const cat = e.target.value as VisualCategory;
                      setUploadCategory(cat);
                      setUploadDomain(inferDomainFromCategory(cat));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Domain
                  </label>
                  <select
                    value={uploadDomain}
                    onChange={(e) => setUploadDomain(e.target.value as AcademicDomain)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {Object.entries(ACADEMIC_DOMAIN_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Creator / Source
                </label>
                <input
                  type="text"
                  value={uploadCreator}
                  onChange={(e) => setUploadCreator(e.target.value)}
                  placeholder="e.g. Lab Photo / Tortora Fig 20.1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Concise scientific figure caption..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Detailed observations, staining method, magnification, or clinical context..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Associate with PharmaLab Departments
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(DEPARTMENT_LABELS) as DepartmentId[]).map((dept) => {
                    const active = uploadDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleUploadDept(dept)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                          active
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {DEPARTMENT_LABELS[dept].split(' (')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Experiments (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={uploadExperiments}
                    onChange={(e) => setUploadExperiments(e.target.value)}
                    placeholder="e.g. Exp 2, Exp 8"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Equipment (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={uploadEquipment}
                    onChange={(e) => setUploadEquipment(e.target.value)}
                    placeholder="e.g. Compound Microscope"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags &amp; Topics
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="e.g. heart, stomata, titration"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    License
                  </label>
                  <input
                    type="text"
                    value={uploadLicense}
                    onChange={(e) => setUploadLicense(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploading ? 'Saving...' : 'Save to Visual Library'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Res Academic Visual Learning Modal */}
      <ImageViewerModal
        item={viewerItem}
        allVisuals={visuals}
        initialAnnotationId={viewerAnnotationId}
        onClose={() => {
          setViewerItem(null);
          setViewerAnnotationId(null);
        }}
        onSelectVisual={(next) => {
          setViewerAnnotationId(null);
          setViewerItem(next);
        }}
        onUpdated={(updated) =>
          setVisuals((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
        }
        onDelete={handleDelete}
      />
    </div>
  );
}
