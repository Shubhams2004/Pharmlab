import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Edit3,
  ExternalLink,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  Link2,
  Loader2,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { findStructureForVisual, getCategoryLabel } from '../../utils/academicEngineUtils';
import { getAllBooks, searchAllBooks } from '../knowledge-library/libraryDb';
import { CrossBookSearchResult, LibraryBookMeta } from '../knowledge-library/types';
import {
  ACADEMIC_SUBJECTS,
  findCandidateSubjectsForVisual
} from './academicRegistry';
import {
  ACADEMIC_DOMAIN_LABELS,
  AcademicDomain,
  AcademicTabId,
  InteractiveAnnotation,
  ResolvedAcademicContext,
  UserAcademicEnrichment
} from './academicTypes';
import VisualThumbnail from './VisualThumbnail';
import {
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
  DepartmentId,
  VisualCategory,
  VisualMediaItem
} from './types';
import { updateVisualMetadata } from './visualDb';

interface AcademicInfoPanelProps {
  item: VisualMediaItem;
  context: ResolvedAcademicContext;
  allVisuals: VisualMediaItem[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (ann: InteractiveAnnotation | null) => void;
  pinPlacementMode: boolean;
  onTogglePinPlacement: () => void;
  onDeleteUserAnnotation: (annotationId: string) => void;
  onSelectVisual: (item: VisualMediaItem) => void;
  onUpdated?: (updated: VisualMediaItem) => void;
  onDeleteVisual?: (id: string) => Promise<void> | void;
  onCloseViewer: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return 'Bundled Plate';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AcademicInfoPanel({
  item,
  context,
  allVisuals,
  selectedAnnotationId,
  onSelectAnnotation,
  pinPlacementMode,
  onTogglePinPlacement,
  onDeleteUserAnnotation,
  onSelectVisual,
  onUpdated,
  onDeleteVisual,
  onCloseViewer
}: AcademicInfoPanelProps) {
  const { openKnowledgeLibrary, navigateToModule } = useLibraryNavigation();

  const [activeTab, setActiveTab] = useState<AcademicTabId>('overview');
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});

  // PDF Knowledge Library live page matching
  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [bookMatches, setBookMatches] = useState<CrossBookSearchResult[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);

  // Edit modes: Image Metadata OR Academic Enrichment
  const [mode, setMode] = useState<'view' | 'edit-meta' | 'enrich-academic'>('view');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Image metadata fields
  const [editTitle, setEditTitle] = useState(item.title);
  const [editCaption, setEditCaption] = useState(item.caption);
  const [editDescription, setEditDescription] = useState(item.description);
  const [editCategory, setEditCategory] = useState<VisualCategory>(item.category);
  const [editDepartments, setEditDepartments] = useState<DepartmentId[]>(item.departments);
  const [editExperiments, setEditExperiments] = useState(item.experiments.join(', '));
  const [editEquipment, setEditEquipment] = useState(item.equipment.join(', '));
  const [editTags, setEditTags] = useState(item.tags.join(', '));

  // Academic enrichment fields
  const [enrichDomain, setEnrichDomain] = useState<AcademicDomain>(context.domain);
  const [enrichSciName, setEnrichSciName] = useState(
    item.academicData?.scientificOrChemicalName || context.identification.scientificOrChemicalName || ''
  );
  const [enrichDef, setEnrichDef] = useState(item.academicData?.definition || '');
  const [enrichIntro, setEnrichIntro] = useState(item.academicData?.introduction || '');
  const [enrichClass, setEnrichClass] = useState(item.academicData?.classification || '');
  const [enrichLoc, setEnrichLoc] = useState(item.academicData?.locationOrOrigin || '');
  const [enrichStruct, setEnrichStruct] = useState(item.academicData?.structureSummary || '');
  const [enrichFunc, setEnrichFunc] = useState(item.academicData?.functionsText || '');
  const [enrichMech, setEnrichMech] = useState(item.academicData?.mechanismSummary || '');
  const [enrichClinical, setEnrichClinical] = useState(item.academicData?.clinicalSignificanceText || '');
  const [enrichPharma, setEnrichPharma] = useState(item.academicData?.pharmaceuticalSignificanceText || '');
  const [enrichExam, setEnrichExam] = useState(item.academicData?.examKeyPointsText || '');
  const [enrichRef, setEnrichRef] = useState(item.academicData?.referenceCitation || '');

  // Reset tab & forms when item changes
  useEffect(() => {
    setMode('view');
    setConfirmDelete(false);
    setMcqAnswers({});
    setEditTitle(item.title);
    setEditCaption(item.caption);
    setEditDescription(item.description);
    setEditCategory(item.category);
    setEditDepartments(item.departments);
    setEditExperiments(item.experiments.join(', '));
    setEditEquipment(item.equipment.join(', '));
    setEditTags(item.tags.join(', '));

    setEnrichDomain(context.domain);
    setEnrichSciName(
      item.academicData?.scientificOrChemicalName || context.identification.scientificOrChemicalName || ''
    );
    setEnrichDef(item.academicData?.definition || '');
    setEnrichIntro(item.academicData?.introduction || '');
    setEnrichClass(item.academicData?.classification || '');
    setEnrichLoc(item.academicData?.locationOrOrigin || '');
    setEnrichStruct(item.academicData?.structureSummary || '');
    setEnrichFunc(item.academicData?.functionsText || '');
    setEnrichMech(item.academicData?.mechanismSummary || '');
    setEnrichClinical(item.academicData?.clinicalSignificanceText || '');
    setEnrichPharma(item.academicData?.pharmaceuticalSignificanceText || '');
    setEnrichExam(item.academicData?.examKeyPointsText || '');
    setEnrichRef(item.academicData?.referenceCitation || '');
  }, [item, context.domain, context.identification.scientificOrChemicalName]);

  // Ensure activeTab remains valid when switching subjects
  useEffect(() => {
    if (!context.availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab('overview');
    }
  }, [context.availableTabs, activeTab]);

  // Automatically switch to Structure tab if user selects an annotation pin while on Overview/References
  useEffect(() => {
    if (selectedAnnotationId && activeTab !== 'structure') {
      if (context.availableTabs.some((t) => t.id === 'structure')) {
        setActiveTab('structure');
      }
    }
  }, [selectedAnnotationId]);

  // Search local Knowledge Library PDFs for matching textbook pages
  useEffect(() => {
    let cancelled = false;
    setSearchingBooks(true);
    getAllBooks()
      .then(async (loadedBooks) => {
        if (cancelled) return;
        setBooks(loadedBooks);
        const searchable = loadedBooks.filter((b) => b.hasSearchableText);
        if (searchable.length === 0 || context.textbookKeywords.length === 0) {
          setBookMatches([]);
          setSearchingBooks(false);
          return;
        }
        const primaryKeyword = context.textbookKeywords[0];
        if (!primaryKeyword || primaryKeyword.length < 2) {
          setBookMatches([]);
          setSearchingBooks(false);
          return;
        }
        const res = await searchAllBooks(primaryKeyword, undefined, 2);
        if (!cancelled) {
          setBookMatches(res);
          setSearchingBooks(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBookMatches([]);
          setSearchingBooks(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, context.textbookKeywords]);

  const candidateSubjects = useMemo(() => findCandidateSubjectsForVisual(item), [item]);
  const matchedCatalogStructure = useMemo(() => findStructureForVisual(item), [item]);

  const relatedVisuals = useMemo(() => {
    const relatedSubjIds = new Set(context.relatedSubjectIds || []);
    return allVisuals
      .filter((v) => {
        if (v.id === item.id) return false;
        if (v.subjectId && relatedSubjIds.has(v.subjectId)) return true;
        return (
          v.category === item.category ||
          v.departments.some((d) => item.departments.includes(d))
        );
      })
      .sort((a, b) => {
        const aDirect = a.subjectId && relatedSubjIds.has(a.subjectId) ? 1 : 0;
        const bDirect = b.subjectId && relatedSubjIds.has(b.subjectId) ? 1 : 0;
        return bDirect - aDirect;
      })
      .slice(0, 6);
  }, [allVisuals, item, context.relatedSubjectIds]);

  const selectedAnnotation = useMemo(
    () => context.annotations.find((a) => a.id === selectedAnnotationId) || null,
    [context.annotations, selectedAnnotationId]
  );

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const splitList = (val: string) =>
        val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      const updated = await updateVisualMetadata(item.id, {
        title: editTitle.trim() || item.title,
        caption: editCaption.trim(),
        description: editDescription.trim(),
        category: editCategory,
        departments: editDepartments,
        experiments: splitList(editExperiments),
        equipment: splitList(editEquipment),
        tags: splitList(editTags)
      });
      if (updated) {
        onUpdated?.(updated);
        onSelectVisual(updated);
      }
      setMode('view');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEnrichment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const academicData: UserAcademicEnrichment = {
        domain: enrichDomain,
        scientificOrChemicalName: enrichSciName.trim() || undefined,
        definition: enrichDef.trim() || undefined,
        introduction: enrichIntro.trim() || undefined,
        classification: enrichClass.trim() || undefined,
        locationOrOrigin: enrichLoc.trim() || undefined,
        structureSummary: enrichStruct.trim() || undefined,
        functionsText: enrichFunc.trim() || undefined,
        mechanismSummary: enrichMech.trim() || undefined,
        clinicalSignificanceText: enrichClinical.trim() || undefined,
        pharmaceuticalSignificanceText: enrichPharma.trim() || undefined,
        examKeyPointsText: enrichExam.trim() || undefined,
        referenceCitation: enrichRef.trim() || undefined,
        updatedAt: Date.now()
      };

      const updated = await updateVisualMetadata(item.id, {
        academicDomain: enrichDomain,
        academicData
      });
      if (updated) {
        onUpdated?.(updated);
        onSelectVisual(updated);
      }
      setMode('view');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkSubject = async (subjectId: string) => {
    const subj = ACADEMIC_SUBJECTS[subjectId];
    if (!subj) return;
    setSaving(true);
    try {
      const updated = await updateVisualMetadata(item.id, {
        subjectId: subj.id,
        academicDomain: subj.domain
      });
      if (updated) {
        onUpdated?.(updated);
        onSelectVisual(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkSubject = async () => {
    setSaving(true);
    try {
      const updated = await updateVisualMetadata(item.id, {
        subjectId: undefined
      });
      if (updated) {
        onUpdated?.(updated);
        onSelectVisual(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleDept = (dept: DepartmentId) => {
    setEditDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const provenanceBadge = useMemo(() => {
    switch (context.contentStatus) {
      case 'verified-curriculum':
        return {
          label: 'Verified Curriculum Resource',
          tone: 'text-emerald-700 dark:text-emerald-400',
          icon: ShieldCheck
        };
      case 'user-contributed':
        return {
          label: 'User Enriched Resource',
          tone: 'text-cyan-700 dark:text-cyan-400',
          icon: CheckCircle2
        };
      case 'partial-metadata':
        return {
          label: 'Partial Metadata Only',
          tone: 'text-amber-700 dark:text-amber-400',
          icon: AlertCircle
        };
      default:
        return {
          label: 'Unverified / Minimal Metadata',
          tone: 'text-amber-700 dark:text-amber-400',
          icon: AlertCircle
        };
    }
  }, [context.contentStatus]);

  const StatusIcon = provenanceBadge.icon;

  return (
    <div className="h-full min-h-0 overflow-y-auto lg:overflow-hidden lg:flex lg:flex-col">
      {/* Top Academic Header & Action Strip (scrolls away on mobile for full reading height; docked on desktop) */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5 lg:shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {ACADEMIC_DOMAIN_LABELS[context.domain]}
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className={`inline-flex items-center gap-1 font-medium ${provenanceBadge.tone}`}>
                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{provenanceBadge.label}</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {context.identification.primaryName}
            </h3>
            {context.identification.scientificOrChemicalName && (
              <p className="text-xs italic text-slate-600 dark:text-slate-400">
                {context.identification.scientificOrChemicalName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setMode((prev) => (prev === 'enrich-academic' ? 'view' : 'enrich-academic'))
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                mode === 'enrich-academic'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/40'
              }`}
              title="Add or enrich academic sections"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{mode === 'enrich-academic' ? 'Done' : 'Enrich'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode((prev) => (prev === 'edit-meta' ? 'view' : 'edit-meta'))}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                mode === 'edit-meta'
                  ? 'bg-slate-800 dark:bg-slate-700 border-slate-700 text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/40'
              }`}
              title="Edit visual title, tags, and departments"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Meta</span>
            </button>
            {item.sourceType !== 'built-in' && onDeleteVisual && (
              <button
                type="button"
                onClick={() => setConfirmDelete((prev) => !prev)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                aria-label="Delete visual"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {confirmDelete && onDeleteVisual && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
              Remove this visual from IndexedDB?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteVisual(item.id);
                  onCloseViewer();
                }}
                className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Context-Aware Tab Bar (sticky top on mobile scroll; docked on desktop) */}
      {mode === 'view' && (
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-2 lg:static lg:shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {context.availableTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'structure' && context.annotations.length > 0 && (
                    <span className="ml-1 opacity-80 tabular-nums">({context.annotations.length})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="lg:flex-1 lg:overflow-y-auto p-4 sm:p-5 space-y-5">
        {mode === 'edit-meta' ? (
          <form onSubmit={handleSaveMetadata} className="space-y-3 text-xs">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Edit Image Metadata &amp; Curriculum Tags
            </p>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Caption</label>
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as VisualCategory)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Associated Departments
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(DEPARTMENT_LABELS) as DepartmentId[]).map((dept) => {
                  const active = editDepartments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDept(dept)}
                      className={`px-2 py-1 rounded-md border text-xs font-medium ${
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
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Experiments (comma-separated)
              </label>
              <input
                type="text"
                value={editExperiments}
                onChange={(e) => setEditExperiments(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Equipment (comma-separated)
              </label>
              <input
                type="text"
                value={editEquipment}
                onChange={(e) => setEditEquipment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Metadata'}</span>
              </button>
            </div>
          </form>
        ) : mode === 'enrich-academic' ? (
          <form onSubmit={handleSaveEnrichment} className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Enrich Academic Information &amp; Annotations
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Add verified textbook notes or link this image to an existing PharmaLab Academic Subject. Leave unknown sections blank rather than guessing.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onTogglePinPlacement}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                    pinPlacementMode
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{pinPlacementMode ? 'Click Image to Place Pin...' : 'Add Interactive Pin on Image'}</span>
                </button>
              </div>
            </div>

            {/* Optional link to shared subject */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Link to Reusable Academic Subject (Optional)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={item.subjectId || ''}
                  onChange={(e) =>
                    e.target.value ? handleLinkSubject(e.target.value) : handleUnlinkSubject()
                  }
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">None (Standalone visual metadata)</option>
                  {Object.values(ACADEMIC_SUBJECTS).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.identification.primaryName} ({ACADEMIC_DOMAIN_LABELS[s.domain]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Subject Domain
                </label>
                <select
                  value={enrichDomain}
                  onChange={(e) => setEnrichDomain(e.target.value as AcademicDomain)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  {Object.entries(ACADEMIC_DOMAIN_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scientific / Chemical / Botanical Name
                </label>
                <input
                  type="text"
                  value={enrichSciName}
                  onChange={(e) => setEnrichSciName(e.target.value)}
                  placeholder="e.g. Ocimum tenuiflorum / C₉H₈O₄"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Definition</label>
              <textarea
                rows={2}
                value={enrichDef}
                onChange={(e) => setEnrichDef(e.target.value)}
                placeholder="Concise scientific definition..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Introduction &amp; Context</label>
              <textarea
                rows={2}
                value={enrichIntro}
                onChange={(e) => setEnrichIntro(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Classification</label>
                <input
                  type="text"
                  value={enrichClass}
                  onChange={(e) => setEnrichClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Location / Specimen Origin</label>
                <input
                  type="text"
                  value={enrichLoc}
                  onChange={(e) => setEnrichLoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Structure &amp; Components</label>
              <textarea
                rows={2}
                value={enrichStruct}
                onChange={(e) => setEnrichStruct(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Functions / Roles (one per line)
              </label>
              <textarea
                rows={2}
                value={enrichFunc}
                onChange={(e) => setEnrichFunc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mechanism of Action / Working Principle
              </label>
              <textarea
                rows={2}
                value={enrichMech}
                onChange={(e) => setEnrichMech(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Significance / Diseases (one per line)
              </label>
              <textarea
                rows={2}
                value={enrichClinical}
                onChange={(e) => setEnrichClinical(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pharmaceutical Significance / Applications (one per line)
              </label>
              <textarea
                rows={2}
                value={enrichPharma}
                onChange={(e) => setEnrichPharma(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Key Points for Exams (one per line)
              </label>
              <textarea
                rows={2}
                value={enrichExam}
                onChange={(e) => setEnrichExam(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Source / Textbook Citation
              </label>
              <input
                type="text"
                value={enrichRef}
                onChange={(e) => setEnrichRef(e.target.value)}
                placeholder="e.g. Tortora Ch. 26; IP 2022 Vol. I"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Academic Info'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW MODE — CONTEXT-AWARE TABBED ACADEMIC CONTENT */
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Candidate Subject Suggestion for unlinked uploads/open-access images */}
                {!item.subjectId && candidateSubjects.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Matching PharmaLab Academic Subject Found
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      Link this image to reuse verified B.Pharm study notes without duplicating content:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidateSubjects.map((cand) => (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => handleLinkSubject(cand.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Link: {cand.identification.primaryName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Honest Completeness / Missing Info Banner */}
                {context.completeness.missingSections.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-amber-800 dark:text-amber-200">
                        Academic Profile Completeness: {context.completeness.completenessPercent}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setMode('enrich-academic')}
                        className="text-emerald-700 dark:text-emerald-300 font-semibold hover:underline"
                      >
                        Enrich Sections
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>Missing sections (not fabricated):</strong>{' '}
                      {context.completeness.missingSections.join(' · ')}
                    </p>
                  </div>
                )}

                {/* Identification Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-[13px] sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Identification</span>
                    <span className="font-semibold text-slate-900 dark:text-white sm:text-right">
                      {context.identification.primaryName}
                    </span>
                  </div>
                  {context.identification.commonNames && context.identification.commonNames.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-3 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70 sm:border-t-0 sm:pt-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Common / Synonyms</span>
                      <span className="text-slate-800 dark:text-slate-200 sm:text-right">
                        {context.identification.commonNames.join(', ')}
                      </span>
                    </div>
                  )}
                  {context.identification.formulaOrIupac && (
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-3 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70 sm:border-t-0 sm:pt-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Formula / IUPAC</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 sm:text-right break-words">
                        {context.identification.formulaOrIupac}
                      </span>
                    </div>
                  )}
                  {context.identification.classification && (
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-3 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70 sm:border-t-0 sm:pt-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Classification</span>
                      <span className="text-slate-800 dark:text-slate-200 sm:text-right">
                        {context.identification.classification}
                      </span>
                    </div>
                  )}
                  {context.identification.taxonomyOrCode && (
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-3 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70 sm:border-t-0 sm:pt-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Curriculum Code</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 sm:text-right">
                        {context.identification.taxonomyOrCode}
                      </span>
                    </div>
                  )}
                </div>

                {context.definition && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Definition
                    </h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.definition}
                    </p>
                  </section>
                )}

                {context.introduction && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Introduction &amp; Context
                    </h4>
                    <p className="text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.introduction}
                    </p>
                  </section>
                )}

                {context.locationOrOrigin && (
                  <section className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {context.domain === 'anatomy' ? 'Anatomical Location' : 'Origin / Context'}
                    </h4>
                    <p className="text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.locationOrOrigin}
                    </p>
                  </section>
                )}

                {context.classificationDetails && context.classificationDetails.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Classification Breakdown
                    </h4>
                    <div className="space-y-2">
                      {context.classificationDetails.map((c) => (
                        <div
                          key={c.label}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                        >
                          <p className="font-bold text-slate-900 dark:text-white">{c.label}</p>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{c.detail}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {context.pharmacologyProfile?.drugClass && (
                  <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Drug Classification
                    </h4>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.pharmacologyProfile.drugClass}
                    </p>
                  </section>
                )}

                {context.histologyProfile?.tissueOrSpecimen && (
                  <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Specimen &amp; Tissue Identification
                    </h4>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.histologyProfile.tissueOrSpecimen}
                    </p>
                  </section>
                )}

                {/* Direct Textbook Page Link if cropped from PDF */}
                {item.linkedBookId && item.linkedBookPage && (
                  <button
                    type="button"
                    onClick={() => {
                      openKnowledgeLibrary({
                        bookId: item.linkedBookId,
                        pageNumber: item.linkedBookPage
                      });
                      onCloseViewer();
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open Source Textbook (Page {item.linkedBookPage})</span>
                  </button>
                )}
              </div>
            )}

            {/* STRUCTURE & INTERACTIVE COMPONENTS TAB */}
            {activeTab === 'structure' && (
              <div className="space-y-4">
                {context.annotations.length > 0 ? (
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Interactive Structures ({context.annotations.length})
                      </h4>
                      <button
                        type="button"
                        onClick={onTogglePinPlacement}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{pinPlacementMode ? 'Cancel Pin' : 'Add Pin'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {context.annotations.map((ann, idx) => {
                        const isSelected = selectedAnnotation?.id === ann.id;
                        return (
                          <button
                            key={ann.id}
                            type="button"
                            onClick={() => onSelectAnnotation(isSelected ? null : ann)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors text-left ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50'
                            }`}
                          >
                            <span className="font-mono text-xs opacity-80">
                              {ann.shortCode || idx + 1}.
                            </span>
                            <span>{ann.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnnotation ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-2.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {selectedAnnotation.label}
                            </p>
                            {selectedAnnotation.location && (
                              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                                Location: {selectedAnnotation.location}
                              </p>
                            )}
                          </div>
                          {selectedAnnotation.isUserAdded && (
                            <button
                              type="button"
                              onClick={() => onDeleteUserAnnotation(selectedAnnotation.id)}
                              className="p-1 text-rose-600 hover:bg-rose-500/10 rounded"
                              title="Remove custom annotation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                          <strong>Definition:</strong> {selectedAnnotation.definition}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong>Function / Role:</strong> {selectedAnnotation.functionRole}
                        </p>
                        {selectedAnnotation.physiologicalOrClinicalImportance && (
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong>Physiological &amp; Clinical Importance:</strong>{' '}
                            {selectedAnnotation.physiologicalOrClinicalImportance}
                          </p>
                        )}
                        {selectedAnnotation.sourceNote && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Source: {selectedAnnotation.sourceNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select any labeled structure above or click a marker on the image to highlight its region and inspect detailed notes.
                      </p>
                    )}
                  </section>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      No pre-mapped region pins on this image
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      PharmaLab does not fabricate interactive pins when exact coordinates are unknown. You can place custom pins manually to annotate structures for study.
                    </p>
                    <button
                      type="button"
                      onClick={onTogglePinPlacement}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{pinPlacementMode ? 'Cancel Pin Placement' : 'Place Custom Pin on Image'}</span>
                    </button>
                  </div>
                )}

                {context.structureSummary && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Structural Architecture
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.structureSummary}
                    </p>
                  </section>
                )}

                {context.equipmentProfile?.construction && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Equipment Construction
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.equipmentProfile.construction}
                    </p>
                  </section>
                )}

                {context.chemistryProfile && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Molecular Structure &amp; Functional Groups
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.chemistryProfile.molecularStructureSummary}
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {context.chemistryProfile.functionalGroups.map((fg) => (
                        <li
                          key={fg}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {fg}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.microbiologyProfile && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Morphology &amp; Cell Envelope Characteristics
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.microbiologyProfile.morphology}
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {context.microbiologyProfile.characteristics.map((ch) => (
                        <li
                          key={ch}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {ch}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.histologyProfile && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Histological Regions &amp; Characteristics
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {context.histologyProfile.structuralCharacteristics.map((itemText) => (
                        <li
                          key={itemText}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {itemText}
                        </li>
                      ))}
                    </ul>
                    {context.histologyProfile.importantRegions.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Key Regions Visible
                        </p>
                        {context.histologyProfile.importantRegions.map((reg) => (
                          <p key={reg} className="text-xs text-slate-700 dark:text-slate-300">
                            • {reg}
                          </p>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {context.components && context.components.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Parts &amp; Functions Summary
                    </h4>
                    <div className="space-y-2">
                      {context.components.map((comp) => (
                        <div
                          key={comp.name}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                        >
                          <p className="font-bold text-slate-900 dark:text-white">{comp.name}</p>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {comp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* FUNCTION TAB */}
            {activeTab === 'function' && (
              <div className="space-y-4">
                {context.physiologicalRole && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Physiological Role
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.physiologicalRole}
                    </p>
                  </section>
                )}

                {context.functions && context.functions.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Key Functions
                    </h4>
                    <ul className="space-y-2 text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300">
                      {context.functions.map((fn) => (
                        <li
                          key={fn}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {fn}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.pharmacologyProfile?.pharmacologicalEffects && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pharmacological Effects
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {context.pharmacologyProfile.pharmacologicalEffects.map((eff) => (
                        <li
                          key={eff}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {eff}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.chemistryProfile?.physicochemicalProperties && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Physicochemical Properties
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {context.chemistryProfile.physicochemicalProperties.map((prop) => (
                        <li
                          key={prop}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {prop}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.histologyProfile?.normalVsAbnormal && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Normal vs Abnormal Appearance
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">Authentic / Normal</p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {context.histologyProfile.normalVsAbnormal.normal}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <p className="font-bold text-amber-800 dark:text-amber-300">Adulterated / Abnormal</p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {context.histologyProfile.normalVsAbnormal.abnormal}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {context.associatedOrgansOrSystems && context.associatedOrgansOrSystems.length > 0 && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Associated Organs &amp; Systems
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {context.associatedOrgansOrSystems.map((sys) => (
                        <li key={sys}>• {sys}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {/* MECHANISM TAB */}
            {activeTab === 'mechanism' && (
              <div className="space-y-4">
                {context.equipmentProfile?.principle && (
                  <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Operating Principle
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.equipmentProfile.principle}
                    </p>
                  </section>
                )}

                {context.equipmentProfile?.workingMechanism && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Step-by-Step Working Mechanism
                    </h4>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {context.equipmentProfile.workingMechanism}
                    </div>
                  </section>
                )}

                {context.pharmacologyProfile?.mechanismOfAction && (
                  <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pharmacological Mechanism of Action
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.pharmacologyProfile.mechanismOfAction}
                    </p>
                  </section>
                )}

                {context.chemistryProfile?.reactionMechanism && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Synthesis &amp; Reaction Mechanism
                    </h4>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {context.chemistryProfile.reactionMechanism}
                    </div>
                  </section>
                )}

                {context.mechanism && (
                  <section className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {context.mechanism.title || 'Mechanism & Process'}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.mechanism.summary}
                    </p>
                    {context.mechanism.steps && context.mechanism.steps.length > 0 && (
                      <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {context.mechanism.steps.map((step) => (
                          <li
                            key={step}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                          >
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* CLINICAL TAB */}
            {activeTab === 'clinical' && (
              <div className="space-y-4">
                {context.clinicalSignificance && context.clinicalSignificance.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Clinical Significance
                    </h4>
                    <ul className="space-y-2 text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300">
                      {context.clinicalSignificance.map((cs) => (
                        <li
                          key={cs}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {cs}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.microbiologyProfile?.pathogenicity && (
                  <section className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Pathogenicity &amp; Endotoxin Virulence
                    </h4>
                    <p className="text-[13.5px] sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {context.microbiologyProfile.pathogenicity}
                    </p>
                  </section>
                )}

                {context.pharmacologyProfile?.adverseEffects && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Adverse Effects
                    </h4>
                    <ul className="space-y-1.5 text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300">
                      {context.pharmacologyProfile.adverseEffects.map((ae) => (
                        <li
                          key={ae}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {ae}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.pharmacologyProfile?.contraindications && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      Contraindications
                    </h4>
                    <ul className="space-y-1.5 text-[13.5px] sm:text-sm text-rose-900 dark:text-rose-200">
                      {context.pharmacologyProfile.contraindications.map((ci) => (
                        <li
                          key={ci}
                          className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 leading-relaxed"
                        >
                          {ci}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.associatedDiseases && context.associatedDiseases.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Associated Diseases &amp; Disorders
                    </h4>
                    <div className="space-y-2">
                      {context.associatedDiseases.map((dis) => (
                        <div
                          key={dis.name}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[13.5px] sm:text-sm space-y-1"
                        >
                          <p className="font-bold text-slate-900 dark:text-white">{dis.name}</p>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {dis.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* PHARMACEUTICAL TAB */}
            {activeTab === 'pharmaceutical' && (
              <div className="space-y-4">
                {context.pharmacologyProfile?.therapeuticUses && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Therapeutic Uses
                    </h4>
                    <ul className="space-y-1.5 text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300">
                      {context.pharmacologyProfile.therapeuticUses.map((use) => (
                        <li
                          key={use}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {use}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.pharmaceuticalSignificance && context.pharmaceuticalSignificance.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pharmaceutical Relevance
                    </h4>
                    <ul className="space-y-2 text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300">
                      {context.pharmaceuticalSignificance.map((ps) => (
                        <li
                          key={ps}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {ps}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.microbiologyProfile?.laboratorySignificance && (
                  <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Laboratory Significance
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.microbiologyProfile.laboratorySignificance}
                    </p>
                  </section>
                )}

                {context.applications && context.applications.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Laboratory &amp; Formulation Applications
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {context.applications.map((app) => (
                        <li
                          key={app}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {app}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.equipmentProfile && (
                  <>
                    <section className="grid grid-cols-1 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">Advantages</p>
                        {context.equipmentProfile.advantages.map((adv) => (
                          <p key={adv} className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            • {adv}
                          </p>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                        <p className="font-bold text-amber-800 dark:text-amber-300">Limitations</p>
                        {context.equipmentProfile.limitations.map((lim) => (
                          <p key={lim} className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            • {lim}
                          </p>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-1.5 text-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Maintenance &amp; Lab Safety
                      </h4>
                      {context.equipmentProfile.maintenanceAndSafety.map((safe) => (
                        <div
                          key={safe}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed"
                        >
                          {safe}
                        </div>
                      ))}
                    </section>
                  </>
                )}
              </div>
            )}

            {/* EXAM NOTES & SELF-CHECK MCQS TAB */}
            {activeTab === 'exam_notes' && (
              <div className="space-y-4">
                {context.importantCharacteristics && context.importantCharacteristics.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Important Quantitative Characteristics
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {context.importantCharacteristics.map((charItem) => (
                        <li
                          key={charItem}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 leading-relaxed"
                        >
                          {charItem}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.examKeyPoints && context.examKeyPoints.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>High-Yield B.Pharm Exam Points</span>
                    </h4>
                    <ul className="space-y-2 text-[13.5px] sm:text-sm text-slate-800 dark:text-slate-200">
                      {context.examKeyPoints.map((pt) => (
                        <li
                          key={pt}
                          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 leading-relaxed"
                        >
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {context.mcqs && context.mcqs.length > 0 && (
                  <section className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Concept Self-Check Assessment
                    </h4>
                    {context.mcqs.map((q, qIdx) => {
                      const chosen = mcqAnswers[q.id];
                      const answered = typeof chosen === 'number';
                      return (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
                        >
                          <p className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                            Q{qIdx + 1}. {q.question}
                          </p>
                          <div className="space-y-1.5">
                            {q.options.map((opt, idx) => {
                              const isChosen = chosen === idx;
                              const isCorrect = idx === q.correctIndex;
                              let cls =
                                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50';
                              if (answered) {
                                if (isCorrect) {
                                  cls =
                                    'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-200 font-semibold';
                                } else if (isChosen) {
                                  cls =
                                    'bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-200';
                                }
                              }
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setMcqAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${cls}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {answered && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-200 dark:border-slate-800">
                              <strong>Rationale:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </section>
                )}

                {context.relatedTopics && context.relatedTopics.length > 0 && (
                  <section className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Related Curriculum Topics
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {context.relatedTopics.join(' · ')}
                    </p>
                  </section>
                )}
              </div>
            )}

            {/* REFERENCES & CONNECTED RESOURCES TAB */}
            {activeTab === 'references' && (
              <div className="space-y-5">
                {/* Anatomy Explorer Structure Link */}
                {matchedCatalogStructure && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Anatomy Explorer Catalog Entry
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        navigateToModule('anatomy', 'explorer', {
                          structureId: matchedCatalogStructure.id
                        });
                        onCloseViewer();
                      }}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                          Catalog #{matchedCatalogStructure.catalogNumber} ·{' '}
                          {getCategoryLabel(matchedCatalogStructure.primaryCategory)}
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          Open {matchedCatalogStructure.name} in Anatomy Explorer
                        </p>
                        {matchedCatalogStructure.overview && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {matchedCatalogStructure.overview}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                    </button>
                  </section>
                )}

                {/* Connected PharmaLab Modules, Experiments & Case Studies */}
                {context.pharmaLabLinks.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Connected PharmaLab Learning Modules
                    </h4>
                    <div className="space-y-2">
                      {context.pharmaLabLinks.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => {
                            navigateToModule(link.moduleId, link.tab ?? null);
                            onCloseViewer();
                          }}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold capitalize">
                              <FlaskConical className="w-3 h-3 shrink-0" />
                              <span>{link.kind.replace('_', ' ')}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {link.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {link.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Live PDF Knowledge Library Textbook Page Connections */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      PDF Knowledge Library Connections
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        openKnowledgeLibrary({ searchQuery: context.textbookKeywords[0] || item.title });
                        onCloseViewer();
                      }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Open Library
                    </button>
                  </div>

                  {searchingBooks ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Checking uploaded PDF textbooks for matching pages...</span>
                    </div>
                  ) : books.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                      <p>
                        No PDF textbooks uploaded in Knowledge Library yet. Upload a textbook PDF to unlock direct page-level jumps for{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {context.identification.primaryName}
                        </strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          openKnowledgeLibrary();
                          onCloseViewer();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Upload Textbook PDF</span>
                      </button>
                    </div>
                  ) : bookMatches.length > 0 ? (
                    <div className="space-y-2">
                      {bookMatches.slice(0, 3).map(({ book, matches }) => {
                        const top = matches[0];
                        return (
                          <div
                            key={`${book.id}_${top.pageNumber}`}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                <FileText className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                                {book.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  openKnowledgeLibrary({
                                    bookId: book.id,
                                    pageNumber: top.pageNumber,
                                    searchQuery: context.textbookKeywords[0]
                                  });
                                  onCloseViewer();
                                }}
                                className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap hover:underline shrink-0"
                              >
                                Open Page {top.pageNumber}
                              </button>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {top.beforeContext}
                              <mark className="bg-amber-300/60 dark:bg-amber-500/35 px-0.5 rounded font-semibold">
                                {top.matchedText}
                              </mark>
                              {top.afterContext}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No exact page matches found in your {books.length} uploaded PDF{books.length === 1 ? '' : 's'} for "{context.textbookKeywords[0]}".
                    </p>
                  )}
                </section>

                {/* Related Equipment, Drugs & Diseases */}
                {(context.equipmentNames.length > 0 ||
                  context.drugNames.length > 0 ||
                  context.diseaseNames.length > 0) && (
                  <section className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    {context.equipmentNames.length > 0 && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Related Equipment</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {context.equipmentNames.join(' · ')}
                        </p>
                      </div>
                    )}
                    {context.drugNames.length > 0 && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Related Drugs &amp; Agents</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {context.drugNames.join(' · ')}
                        </p>
                      </div>
                    )}
                    {context.diseaseNames.length > 0 && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Related Pathologies</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {context.diseaseNames.join(' · ')}
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* Related Visuals (visible inside panel on mobile & desktop) */}
                {relatedVisuals.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Related Scientific Visuals
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {relatedVisuals.slice(0, 4).map((rel) => (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => onSelectVisual(rel)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
                        >
                          <VisualThumbnail
                            item={rel}
                            className="w-12 h-10 rounded-lg shrink-0"
                            imgClassName="w-full h-full object-contain p-0.5"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {rel.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {CATEGORY_LABELS[rel.category]}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Sources, Accuracy Notes & Technical Metadata */}
                <section className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Academic References &amp; Source Attribution
                  </h4>
                  {context.references.length > 0 ? (
                    <div className="space-y-2">
                      {context.references.map((ref, idx) => (
                        <div
                          key={`${ref.title}_${idx}`}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{ref.title}</span>
                            <span className="text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 shrink-0">
                              {ref.sourceType}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{ref.citation}</p>
                          {ref.reliabilityNote && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                              {ref.reliabilityNote}
                            </p>
                          )}
                          {ref.url && (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-0.5"
                            >
                              <span>Open External Record</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No external citations recorded yet.
                    </p>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Content Provenance &amp; Accuracy Note
                    </p>
                    <p>{context.accuracyNotes}</p>
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-x-3 gap-y-1 tabular-nums text-slate-500 dark:text-slate-400">
                      <span>License: {item.license}</span>
                      <span>· Storage: {formatBytes(item.fileSize)}</span>
                      {item.width && item.height && (
                        <span>· {item.width} × {item.height} px</span>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
