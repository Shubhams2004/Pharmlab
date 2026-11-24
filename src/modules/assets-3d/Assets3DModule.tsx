import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  FolderPlus,
  Globe,
  GraduationCap,
  HardDrive,
  Info,
  Layers,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  WifiOff,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { DEPARTMENT_WORKSPACES } from '../../types/academicArchitecture';
import { getAllSyllabi } from '../study-mode/studyDb';
import { SyllabusProfile } from '../study-mode/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import Asset3DDeleteModal from './Asset3DDeleteModal';
import Asset3DDetailsModal from './Asset3DDetailsModal';
import Asset3DEditModal from './Asset3DEditModal';
import Asset3DUploadModal, { Asset3DInitialContext } from './Asset3DUploadModal';
import ModelViewerModal from './ModelViewerModal';
import {
  addSyllabusAssociation,
  duplicate3DAssetReference,
  get3DStorageReport,
  getAll3DAssets,
  getCustom3DCategories,
  getMerged3DCategoryOptions,
  removeSyllabusAssociation,
  saveCustom3DCategory,
  toggle3DAssetFavorite
} from './asset3dDb';
import Asset3DImportModal from './Asset3DImportModal';
import {
  discoverScientific3DAssets,
  PROVIDER_3D_REGISTRY,
  sortAndFilterDiscovered3D
} from './discoveryProviders';
import {
  ALL_BPHARM_DEPARTMENTS,
  Asset3DAvailabilityFilter,
  Asset3DCategory,
  Asset3DDiscoverySort,
  Asset3DItem,
  Asset3DLibraryCollection,
  Asset3DLibrarySort,
  Asset3DStorageReport,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  Custom3DCategory,
  Discovered3DCandidate,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability,
  IMPORT_STATUS_3D_LABELS,
  Provider3DId,
  SyllabusAssociation
} from './types';

export interface Assets3DJumpTarget {
  tab?: 'library' | 'discover' | 'mapping' | null;
  query?: string | null;
  department?: BPharmDepartmentId | null;
  assetId?: string | null;
  openUpload?: boolean;
  nonce: number;
}

interface Assets3DModuleProps {
  jumpTarget?: Assets3DJumpTarget;
}

const DISCOVER_DOMAIN_PRESETS: Array<{
  label: string;
  query: string;
  category: 'all' | Asset3DCategory;
}> = [
  { label: 'Anatomical Heart', query: 'heart', category: 'all' },
  { label: 'Kidney & Renal', query: 'kidney', category: 'all' },
  { label: 'Cells & Organelles', query: 'eukaryotic cell', category: 'all' },
  { label: 'Aspirin (Molecule)', query: 'aspirin', category: 'all' },
  { label: 'Insulin Receptor', query: 'insulin', category: 'all' },
  { label: 'Medicinal Plants', query: 'medicinal plant', category: 'all' },
  { label: 'Microorganisms', query: 'bacteria', category: 'all' },
  { label: 'Pharma Apparatus', query: 'soxhlet distillation', category: 'all' },
  { label: 'Lab Instruments', query: 'microscope', category: 'all' },
  { label: 'Tablet Press', query: 'tablet press', category: 'all' },
  { label: 'Medical Devices', query: 'heart valve', category: 'all' }
];

export default function Assets3DModule({ jumpTarget }: Assets3DModuleProps) {
  const { setWorkspaceSection, recordActivity } = useLibraryNavigation();

  const [activeTab, setActiveTab] = useState<'library' | 'discover' | 'mapping'>('library');
  const [assets, setAssets] = useState<Asset3DItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [syllabi, setSyllabi] = useState<SyllabusProfile[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Library filters, view & P3.3 management state
  const [libSearch, setLibSearch] = useState('');
  const [libCategory, setLibCategory] = useState<'all' | Asset3DCategory>('all');
  const [libDept, setLibDept] = useState<'all' | BPharmDepartmentId>('all');
  const [libSubject, setLibSubject] = useState<string>('all');
  const [libTag, setLibTag] = useState<string>('all');
  const [libSource, setLibSource] = useState<string>('all');
  const [libSort, setLibSort] = useState<Asset3DLibrarySort>('import_desc');
  const [libCollection, setLibCollection] = useState<Asset3DLibraryCollection>('all');
  const [libViewMode, setLibViewMode] = useState<'grid' | 'list'>('grid');
  const [customCategories, setCustomCategories] = useState<Custom3DCategory[]>([]);
  const [showNewCatBar, setShowNewCatBar] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [storageReport, setStorageReport] = useState<Asset3DStorageReport | null>(null);
  const [showStorageDetails, setShowStorageDetails] = useState(false);

  // Discovery state
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverProvider, setDiscoverProvider] = useState<'all' | Provider3DId>('all');
  const [discoverCategory, setDiscoverCategory] = useState<'all' | Asset3DCategory>('all');
  const [discoverAvailability, setDiscoverAvailability] =
    useState<Asset3DAvailabilityFilter>('all');
  const [discoverSort, setDiscoverSort] = useState<Asset3DDiscoverySort>('recommended');
  const [discovering, setDiscovering] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rawDiscovered, setRawDiscovered] = useState<Discovered3DCandidate[]>([]);
  const [discoverWarnings, setDiscoverWarnings] = useState<string[]>([]);
  const [importCandidate, setImportCandidate] = useState<Discovered3DCandidate | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Mapping state
  const [mapDept, setMapDept] = useState<BPharmDepartmentId>('anatomy');
  const [linkModalAsset, setLinkModalAsset] = useState<Asset3DItem | null>(null);
  const [linkSubjectCode, setLinkSubjectCode] = useState('');
  const [linkTopicId, setLinkTopicId] = useState('');
  const [linkSubtopic, setLinkSubtopic] = useState('');
  const [linkExperiment, setLinkExperiment] = useState('');

  // Viewer, Details, Edit, Delete, Upload modals + Feedback notice
  const [viewerAsset, setViewerAsset] = useState<Asset3DItem | null>(null);
  const [detailsAsset, setDetailsAsset] = useState<Asset3DItem | null>(null);
  const [editAsset, setEditAsset] = useState<Asset3DItem | null>(null);
  const [deleteTargetAsset, setDeleteTargetAsset] = useState<Asset3DItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitCtx, setUploadInitCtx] = useState<Asset3DInitialContext | undefined>(undefined);
  const [toast, setToast] = useState<{ type: 'info' | 'warning' | 'error'; msg: string } | null>(
    null
  );
  const handledNonceRef = useRef<number>(-1);

  const refreshStorageReport = useCallback(async () => {
    try {
      const report = await get3DStorageReport();
      setStorageReport(report);
    } catch {
      // ignore report failure
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    setLoadingAssets(true);
    setCustomCategories(getCustom3DCategories());
    try {
      const [list, syls, report] = await Promise.all([
        getAll3DAssets(),
        getAllSyllabi(),
        get3DStorageReport()
      ]);
      setAssets(list);
      setSyllabi(syls);
      setStorageReport(report);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const labelMap = {
      library: '3D Asset Library',
      discover: 'Discover Scientific 3D',
      mapping: 'Syllabus & Lab Mapping'
    };
    setWorkspaceSection('Universal 3D Asset Engine', labelMap[activeTab]);
    return () => setWorkspaceSection(null);
  }, [activeTab, setWorkspaceSection]);

  const executeSearch = useCallback(
    async (term: string, provider: 'all' | Provider3DId = discoverProvider) => {
      const clean = term.trim();
      if (clean.length < 2) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setDiscovering(true);
      setHasSearched(true);
      setDiscoverWarnings([]);

      try {
        const res = await discoverScientific3DAssets({
          query: clean,
          providerFilter: provider,
          categoryFilter: 'all',
          availabilityFilter: 'all',
          sortBy: 'recommended',
          signal: ctrl.signal
        });
        if (ctrl.signal.aborted) return;
        setRawDiscovered(res.candidates);
        setDiscoverWarnings(res.warnings);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setRawDiscovered([]);
        setDiscoverWarnings([
          err instanceof Error ? err.message : 'Unable to query 3D repositories.'
        ]);
      } finally {
        if (!ctrl.signal.aborted) setDiscovering(false);
      }
    },
    [discoverProvider]
  );

  const discovered = useMemo(
    () =>
      sortAndFilterDiscovered3D(rawDiscovered, {
        categoryFilter: discoverCategory,
        availabilityFilter: discoverAvailability,
        sortBy: discoverSort
      }),
    [rawDiscovered, discoverCategory, discoverAvailability, discoverSort]
  );

  // Handle deep-link navigation into 3D Engine
  useEffect(() => {
    if (!jumpTarget || jumpTarget.nonce === 0) return;
    if (jumpTarget.assetId && loadingAssets) return;
    if (handledNonceRef.current === jumpTarget.nonce) return;
    handledNonceRef.current = jumpTarget.nonce;

    if (jumpTarget.tab) setActiveTab(jumpTarget.tab);
    if (jumpTarget.department) {
      setLibDept(jumpTarget.department);
      setMapDept(jumpTarget.department);
    }
    if (jumpTarget.openUpload) {
      setUploadInitCtx(
        jumpTarget.department ? { departmentId: jumpTarget.department } : undefined
      );
      setUploadOpen(true);
    }
    if (jumpTarget.assetId) {
      const hit = assets.find((a) => a.id === jumpTarget.assetId);
      if (hit) setViewerAsset(hit);
    }
    const q = (jumpTarget.query || '').trim();
    if (q.length >= 2) {
      if (jumpTarget.tab === 'discover') {
        setDiscoverQuery(q);
        void executeSearch(q);
      } else {
        setLibSearch(q);
      }
    }
  }, [jumpTarget, assets, loadingAssets, executeSearch]);

  const handleOpenViewer = (item: Asset3DItem) => {
    const availability = getAsset3DAvailability(item);
    if (!availability.canOpenViewer) {
      setDetailsAsset(item);
      setToast({
        type: 'warning',
        msg: `"${item.name}" has no stored 3D binary or direct file URL. Opened details view instead.`
      });
      return;
    }
    recordActivity({
      key: `3d:${item.id}`,
      kind: 'model_3d',
      title: item.name,
      subtitle: `${item.format.toUpperCase()} · ${get3DCategoryLabel(
        item.category,
        customCategories
      )}`,
      moduleId: 'assets_3d'
    });
    setViewerAsset(item);
  };

  const handleToggleFavorite = async (item: Asset3DItem) => {
    const updated = await toggle3DAssetFavorite(item.id);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (detailsAsset?.id === updated.id) setDetailsAsset(updated);
      if (viewerAsset?.id === updated.id) setViewerAsset(updated);
    }
  };

  const handleDuplicateReference = async (item: Asset3DItem) => {
    const clone = await duplicate3DAssetReference(item.id);
    if (clone) {
      setAssets((prev) => [clone, ...prev]);
      void refreshStorageReport();
      setToast({
        type: 'info',
        msg: `Created metadata reference "${clone.name}" sharing the stored ${clone.format.toUpperCase()} binary (0 extra binary bytes used).`
      });
    }
  };

  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    try {
      const created = saveCustom3DCategory(newCatInput);
      const refreshed = getCustom3DCategories();
      setCustomCategories(refreshed);
      setLibCategory(created.id);
      setNewCatInput('');
      setShowNewCatBar(false);
      setToast({
        type: 'info',
        msg: `Category "${created.label}" added to your extensible 3D Asset Library.`
      });
    } catch (err) {
      setToast({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Unable to create custom category.'
      });
    }
  };

  const findExistingAssetForCandidate = useCallback(
    (cand: Discovered3DCandidate): Asset3DItem | undefined => {
      return assets.find(
        (a) =>
          (cand.directFileUrl && a.externalFileUrl === cand.directFileUrl) ||
          (cand.sourceUrl &&
            a.sourceUrl === cand.sourceUrl &&
            a.name.toLowerCase() === cand.title.toLowerCase())
      );
    },
    [assets]
  );

  const importedAssets = useMemo(
    () => assets.filter((a) => a.hasBinaryBlob || a.importStatus === 'imported_binary'),
    [assets]
  );

  const categoryOptions = useMemo(
    () => getMerged3DCategoryOptions(assets, customCategories),
    [assets, customCategories]
  );

  const availableSubjects = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) {
      for (const l of a.syllabusLinks) {
        if (l.subjectCode) {
          map.set(
            l.subjectCode,
            l.subjectTitle ? `${l.subjectCode} · ${l.subjectTitle}` : l.subjectCode
          );
        }
      }
    }
    return Array.from(map.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [assets]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) {
      for (const t of a.tags) {
        if (t.trim()) set.add(t.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [assets]);

  const availableSources = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) {
      if (a.sourceName?.trim()) set.add(a.sourceName.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [assets]);

  const collectionCounts = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      all: assets.length,
      favorites: assets.filter((a) => Boolean(a.isFavorite)).length,
      recent_imported: assets.filter((a) => a.createdAt >= thirtyDaysAgo).length,
      recent_viewed: assets.filter((a) => Boolean(a.lastOpenedAt)).length
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = libSearch.trim().toLowerCase();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const matching = assets.filter((a) => {
      if (libCollection === 'favorites' && !a.isFavorite) return false;
      if (libCollection === 'recent_imported' && a.createdAt < thirtyDaysAgo) return false;
      if (libCollection === 'recent_viewed' && !a.lastOpenedAt) return false;

      if (libCategory !== 'all' && a.category !== libCategory) return false;
      if (libDept !== 'all' && !a.departments.includes(libDept)) return false;
      if (
        libSubject !== 'all' &&
        !a.syllabusLinks.some((l) => l.subjectCode?.toLowerCase() === libSubject.toLowerCase())
      ) {
        return false;
      }
      if (
        libTag !== 'all' &&
        !a.tags.some((t) => t.trim().toLowerCase() === libTag.toLowerCase())
      ) {
        return false;
      }
      if (libSource !== 'all' && a.sourceName?.trim() !== libSource) return false;

      if (!q) return true;
      const catLabel = get3DCategoryLabel(a.category, customCategories);
      const hay = `${a.name} ${a.description} ${a.creator} ${a.sourceName} ${a.fileName} ${catLabel} ${a.tags.join(
        ' '
      )} ${a.syllabusLinks
        .map(
          (l) =>
            `${l.subjectCode || ''} ${l.subjectTitle || ''} ${l.unitNo || ''} ${
              l.topicTitle || ''
            } ${l.subtopicTitle || ''} ${l.experimentTitle || ''} ${l.structureName || ''}`
        )
        .join(' ')}`.toLowerCase();
      return hay.includes(q);
    });

    const sorted = [...matching];
    sorted.sort((a, b) => {
      switch (libSort) {
        case 'import_asc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'category_asc':
          return get3DCategoryLabel(a.category, customCategories).localeCompare(
            get3DCategoryLabel(b.category, customCategories)
          );
        case 'size_desc':
          return (b.byteSize || 0) - (a.byteSize || 0);
        case 'size_asc':
          return (a.byteSize || 0) - (b.byteSize || 0);
        case 'recent_viewed':
          return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
        case 'import_desc':
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

    return sorted;
  }, [
    assets,
    customCategories,
    libCategory,
    libCollection,
    libDept,
    libSearch,
    libSort,
    libSource,
    libSubject,
    libTag
  ]);

  const hasActiveLibraryFilters = Boolean(
    libSearch.trim() ||
      libCategory !== 'all' ||
      libDept !== 'all' ||
      libSubject !== 'all' ||
      libTag !== 'all' ||
      libSource !== 'all' ||
      libCollection !== 'all'
  );

  const resetLibraryFilters = () => {
    setLibSearch('');
    setLibCategory('all');
    setLibDept('all');
    setLibSubject('all');
    setLibTag('all');
    setLibSource('all');
    setLibCollection('all');
  };

  const allSyllabusSubjects = useMemo(
    () =>
      syllabi.flatMap((syl) =>
        syl.subjects.map((sub) => ({
          course: syl.course,
          subject: sub
        }))
      ),
    [syllabi]
  );

  const linkTopics = useMemo(() => {
    const hit = allSyllabusSubjects.find((s) => s.subject.code === linkSubjectCode);
    if (!hit) return [];
    return hit.subject.units.flatMap((u) =>
      u.topics.map((t) => ({ unitNo: u.unitNo, topic: t }))
    );
  }, [allSyllabusSubjects, linkSubjectCode]);

  const handleSaveSyllabusLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalAsset) return;
    const subMatch = allSyllabusSubjects.find((s) => s.subject.code === linkSubjectCode);
    const topMatch = linkTopics.find((t) => t.topic.id === linkTopicId);
    const assoc: SyllabusAssociation = {
      id: `assoc_${Date.now()}`,
      course: subMatch?.course || 'B.Pharm',
      departmentId: mapDept,
      subjectCode: subMatch?.subject.code,
      subjectTitle: subMatch?.subject.title,
      unitNo: topMatch?.unitNo,
      topicId: topMatch?.topic.id,
      topicTitle: topMatch?.topic.title,
      subtopicTitle: linkSubtopic.trim() || undefined,
      experimentTitle: linkExperiment.trim() || undefined
    };
    const updated = await addSyllabusAssociation(linkModalAsset.id, assoc);
    if (updated) {
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setToast({
        type: 'info',
        msg: `Linked "${updated.name}" to ${BPHARM_DEPARTMENT_LABELS[mapDept]}.`
      });
    }
    setLinkModalAsset(null);
    setLinkSubtopic('');
    setLinkExperiment('');
  };

  const totalBytes = useMemo(
    () => assets.reduce((sum, a) => sum + (a.byteSize || 0), 0),
    [assets]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              PharmaLab P3.1 – P3.3 · Universal 3D Viewer, Asset Discovery &amp; Central 3D Library
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Universal Scientific 3D Asset Engine &amp; Library
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Manage, categorize, search, favorite, and reuse authentic GLB, glTF, ZIP, STL, OBJ, PLY, PDB, and SDF models across all B.Pharm departments, subjects, topics, anatomy structures, and practical experiments without duplicating stored 3D binaries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setUploadInitCtx({
                  departmentId: libDept !== 'all' ? libDept : 'anatomy'
                });
                setUploadOpen(true);
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Local 3D File</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Universal 3D Engine views"
          className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-200 dark:border-slate-800"
        >
          {[
            { id: 'library', label: `3D Asset Library (${assets.length})`, icon: Box },
            { id: 'discover', label: 'Discover Scientific 3D', icon: Globe },
            { id: 'mapping', label: 'Syllabus & Lab Mapping', icon: GraduationCap }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 border transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            toast.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
              : toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            {toast.type === 'info' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toast.msg}</span>
          </span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notice">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================== TAB 1: 3D ASSET LIBRARY ==================== */}
      {activeTab === 'library' && (
        <div className="space-y-5">
          {/* Library Collection Switcher, Search, Filters, View Mode & Storage Telemetry */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Top Row: Quick Collections + Grid/List View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Asset library collections"
              >
                {[
                  { id: 'all', label: `All (${collectionCounts.all})` },
                  { id: 'favorites', label: `Favorites (${collectionCounts.favorites})`, icon: Star },
                  {
                    id: 'recent_imported',
                    label: `Recently Imported (${collectionCounts.recent_imported})`,
                    icon: Clock
                  },
                  {
                    id: 'recent_viewed',
                    label: `Recently Viewed (${collectionCounts.recent_viewed})`,
                    icon: Box
                  }
                ].map((col) => {
                  const active = libCollection === col.id;
                  const Icon = col.icon;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        const next = col.id as Asset3DLibraryCollection;
                        setLibCollection(next);
                        if (next === 'recent_viewed') setLibSort('recent_viewed');
                        else if (next === 'recent_imported') setLibSort('import_desc');
                      }}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors tabular-nums ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span>{col.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCatBar((v) => !v)}
                  className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>New Category</span>
                </button>

                <div
                  className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5"
                  role="group"
                  aria-label="Library layout mode"
                >
                  <button
                    type="button"
                    onClick={() => setLibViewMode('grid')}
                    className={`min-h-[30px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                      libViewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibViewMode('list')}
                    className={`min-h-[30px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                      libViewMode === 'list'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>
            </div>

            {showNewCatBar && (
              <form
                onSubmit={handleCreateCustomCategory}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 flex flex-wrap items-center gap-2"
              >
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="Create custom scientific category (e.g. Tablet Coating Equipment, Excipient Crystals)..."
                  className="flex-1 min-w-[220px] min-h-[36px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCatBar(false)}
                  className="min-h-[36px] px-2.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Search & Sort Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
              <div className="lg:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  placeholder="Search stored 3D assets by name, tag, creator, source, or syllabus topic..."
                  className="w-full min-h-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="lg:col-span-3">
                <select
                  aria-label="Filter by 3D category"
                  value={libCategory}
                  onChange={(e) => setLibCategory(e.target.value as 'all' | Asset3DCategory)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">All Scientific Categories ({categoryOptions.length})</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                      {c.isCustom ? ' (Custom)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <select
                  aria-label="Sort 3D assets"
                  value={libSort}
                  onChange={(e) => setLibSort(e.target.value as Asset3DLibrarySort)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="import_desc">Sort: Import Date (Newest)</option>
                  <option value="import_asc">Sort: Import Date (Oldest)</option>
                  <option value="name_asc">Sort: Name (A → Z)</option>
                  <option value="name_desc">Sort: Name (Z → A)</option>
                  <option value="category_asc">Sort: Category (A → Z)</option>
                  <option value="size_desc">Sort: File Size (Largest)</option>
                  <option value="size_asc">Sort: File Size (Smallest)</option>
                  <option value="recent_viewed">Sort: Recently Viewed</option>
                </select>
              </div>
            </div>

            {/* Secondary Filter Row: Department, Subject, Tag, Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <select
                aria-label="Filter by B.Pharm department"
                value={libDept}
                onChange={(e) => setLibDept(e.target.value as 'all' | BPharmDepartmentId)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">All 12 Departments</option>
                {ALL_BPHARM_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {BPHARM_DEPARTMENT_LABELS[d]}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by associated subject"
                value={libSubject}
                onChange={(e) => setLibSubject(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">
                  All Linked Subjects ({availableSubjects.length})
                </option>
                {availableSubjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by asset tag"
                value={libTag}
                onChange={(e) => setLibTag(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">All Tags ({availableTags.length})</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by source or provider"
                value={libSource}
                onChange={(e) => setLibSource(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">All Sources ({availableSources.length})</option>
                {availableSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary & Storage Telemetry Footer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Showing <strong className="text-slate-800 dark:text-slate-200">{filteredAssets.length}</strong> of{' '}
                  {assets.length} assets
                </span>
                {hasActiveLibraryFilters && (
                  <button
                    type="button"
                    onClick={resetLibraryFilters}
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowStorageDetails((v) => !v)}
                className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  IndexedDB Binaries: {formatBytes(storageReport?.actualBinaryBytes ?? totalBytes)}
                  {storageReport
                    ? ` (${storageReport.storedBinaryCount} file${
                        storageReport.storedBinaryCount === 1 ? '' : 's'
                      }${
                        storageReport.sharedReferenceCount > 0
                          ? `, ${storageReport.sharedReferenceCount} shared ref${
                              storageReport.sharedReferenceCount === 1 ? '' : 's'
                            }`
                          : ''
                      })`
                    : ''}
                </span>
              </button>
            </div>

            {showStorageDetails && storageReport && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                <div>
                  <span className="block text-[11px] text-slate-400">Binary Store (Deduplicated)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBytes(storageReport.actualBinaryBytes)} ({storageReport.storedBinaryCount} blobs)
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Metadata Store</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBytes(storageReport.metadataBytesEstimate)} ({storageReport.totalAssets} records)
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Shared Binary References</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {storageReport.sharedReferenceCount} lightweight links
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Browser Quota</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {storageReport.quotaBytes
                      ? `${formatBytes(storageReport.usageBytes)} / ${formatBytes(
                          storageReport.quotaBytes
                        )}`
                      : `Max ${formatBytes(storageReport.maxSingleAssetBytes)}/model`}
                  </span>
                </div>
              </div>
            )}
          </section>

          {loadingAssets ? (
            <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Loading IndexedDB 3D Asset Library...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 text-center space-y-4">
              <Box className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="space-y-1.5 max-w-xl mx-auto">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {assets.length === 0
                    ? 'Your Scientific 3D Asset Library is Empty'
                    : libCollection === 'favorites' && !libSearch && libCategory === 'all'
                    ? 'No Favorite 3D Models Yet'
                    : libCollection === 'recent_viewed' && !libSearch
                    ? 'No Recently Viewed 3D Models Yet'
                    : 'No 3D Models Matched Your Current Filters'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {assets.length === 0
                    ? 'PharmaLab stores only authentic 3D assets (never synthetic placeholder geometry). Discover open-access models from Wikimedia Commons, Sketchfab, Smithsonian, RCSB PDB, or PubChem, or upload your own .glb / .gltf / .zip / .stl / .pdb file.'
                    : libCollection === 'favorites'
                    ? 'Click the star icon on any 3D model card or inside the Universal 3D Viewer to pin quick-access favorites.'
                    : libCollection === 'recent_viewed'
                    ? 'Open any asset in the Universal 3D Viewer to track your recently inspected models here.'
                    : 'Try clearing search terms or switching category, department, subject, tag, or source filters.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {assets.length > 0 && hasActiveLibraryFilters && (
                  <button
                    type="button"
                    onClick={resetLibraryFilters}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Show All {assets.length} Assets</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${
                    assets.length === 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Discover Open 3D Sources</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Upload .GLB / .STL File</span>
                </button>
              </div>
            </div>
          ) : libViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAssets.map((item) => {
                const availability = getAsset3DAvailability(item);
                const catLabel = get3DCategoryLabel(item.category, customCategories);
                const importDateLabel = new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                return (
                  <article
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => handleOpenViewer(item)}
                          className="w-full aspect-[16/10] bg-slate-950 border-b border-slate-200 dark:border-slate-800 group overflow-hidden flex items-center justify-center"
                        >
                          {item.thumbnailDataUrl || item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailDataUrl || item.thumbnailUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                            />
                          ) : (
                            <div className="text-center space-y-1.5 text-slate-400 px-3">
                              <Box className="w-9 h-9 text-emerald-400 mx-auto" />
                              <p className="text-xs font-semibold text-slate-300">
                                {item.format.toUpperCase()} ·{' '}
                                {availability.canOpenViewer
                                  ? 'Click to Inspect 3D'
                                  : 'Metadata Only'}
                              </p>
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleFavorite(item)}
                          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                            item.isFavorite
                              ? 'bg-slate-950/80 border-amber-400/60 text-amber-400'
                              : 'bg-slate-950/65 border-slate-700/80 text-slate-300 hover:text-amber-400'
                          }`}
                          aria-label={
                            item.isFavorite
                              ? `Remove ${item.name} from favorites`
                              : `Favorite ${item.name}`
                          }
                        >
                          <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="p-4 space-y-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate tabular-nums">
                          <span className="text-emerald-700 dark:text-emerald-400">{catLabel}</span>
                          <span> · {item.format.toUpperCase()}</span>
                          {item.byteSize ? ` · ${formatBytes(item.byteSize)}` : ''}
                          <span> · {importDateLabel}</span>
                        </p>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {item.name}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.sourceName} · {item.creator} · {item.license}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                          {item.departments.map((d) => BPHARM_DEPARTMENT_LABELS[d]).join(' · ')}
                          {item.syllabusLinks.length > 0
                            ? ` · ${item.syllabusLinks.length} syllabus link${
                                item.syllabusLinks.length === 1 ? '' : 's'
                              }`
                            : ''}
                          {!availability.canOpenViewer ? ' · Binary unavailable' : ''}
                        </p>

                        {item.tags.length > 0 && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            Tags: {item.tags.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailsAsset(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="View asset details"
                          aria-label={`Details for ${item.name}`}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditAsset(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Rename or edit metadata"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLinkModalAsset(item);
                            setMapDept(item.departments[0] || 'anatomy');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Link to syllabus topic or lab"
                          aria-label={`Link ${item.name} to syllabus`}
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDuplicateReference(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Duplicate metadata reference (shares binary)"
                          aria-label={`Duplicate reference for ${item.name}`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetAsset(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                          title="Delete asset"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenViewer(item)}
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        {availability.canOpenViewer ? 'Inspect 3D' : 'Open Details'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* List View for scaling to hundreds of models */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              {filteredAssets.map((item) => {
                const availability = getAsset3DAvailability(item);
                const catLabel = get3DCategoryLabel(item.category, customCategories);
                const importDateLabel = new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-950/60 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleOpenViewer(item)}
                        className="w-16 h-12 rounded-xl bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center"
                        aria-label={`Inspect ${item.name}`}
                      >
                        {item.thumbnailDataUrl || item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailDataUrl || item.thumbnailUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Box className="w-5 h-5 text-emerald-400" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h3>
                          {item.isFavorite && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {catLabel}
                          </span>
                          <span> · {item.format.toUpperCase()}</span>
                          {item.byteSize ? ` · ${formatBytes(item.byteSize)}` : ''}
                          <span> · {importDateLabel}</span>
                          <span> · {item.sourceName}</span>
                          {item.syllabusLinks.length > 0
                            ? ` · ${item.syllabusLinks.length} syllabus link${
                                item.syllabusLinks.length === 1 ? '' : 's'
                              }`
                            : ''}
                          {!availability.canOpenViewer ? ' · Metadata only' : ''}
                        </p>
                        {item.tags.length > 0 && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {item.tags.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleToggleFavorite(item)}
                        className={`p-1.5 rounded-lg border ${
                          item.isFavorite
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500'
                        }`}
                        aria-label={`Favorite ${item.name}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailsAsset(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditAsset(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkModalAsset(item);
                          setMapDept(item.departments[0] || 'anatomy');
                        }}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600"
                        title="Link Topic"
                        aria-label={`Link ${item.name} to syllabus`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDuplicateReference(item)}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600"
                        title="Duplicate metadata reference"
                        aria-label={`Duplicate reference for ${item.name}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetAsset(item)}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600"
                        title="Delete asset"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenViewer(item)}
                        className="min-h-[32px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        {availability.canOpenViewer ? 'Inspect 3D' : 'Open'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: DISCOVER SCIENTIFIC 3D ==================== */}
      {activeTab === 'discover' && (
        <div className="space-y-5">
          {!isOnline && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Offline mode active. Live queries to open 3D repositories require an internet connection, while your stored IndexedDB 3D assets remain available below and in the Library.
              </span>
            </div>
          )}

          {/* Discovery Search, Category, Source & Sort Controls */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeSearch(discoverQuery);
              }}
              className="flex flex-col lg:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  placeholder="Search anatomical organs, cells, molecules, plants, microbes, apparatus, or medical devices..."
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <select
                aria-label="Filter 3D source repository"
                value={discoverProvider}
                onChange={(e) => {
                  const next = e.target.value as 'all' | Provider3DId;
                  setDiscoverProvider(next);
                  if (hasSearched && discoverQuery.trim().length >= 2) {
                    void executeSearch(discoverQuery, next);
                  }
                }}
                className="lg:w-52 min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="all">
                  All Live 3D APIs ({PROVIDER_3D_REGISTRY.filter((p) => p.supportsLiveApi).length})
                </option>
                {PROVIDER_3D_REGISTRY.filter((p) => p.supportsLiveApi).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.shortName}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={discovering || discoverQuery.trim().length < 2}
                  className="flex-1 lg:flex-initial min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {discovering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Search 3D Sources</span>
                </button>
                {discovering && (
                  <button
                    type="button"
                    onClick={() => {
                      abortRef.current?.abort();
                      setDiscovering(false);
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold"
                  >
                    Stop
                  </button>
                )}
              </div>
            </form>

            {/* Secondary Filters: Scientific Category, Import Availability & Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  aria-label="Filter discovery results by scientific category"
                  value={discoverCategory}
                  onChange={(e) =>
                    setDiscoverCategory(e.target.value as 'all' | Asset3DCategory)
                  }
                  className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">All Scientific Categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                aria-label="Filter discovery results by import availability"
                value={discoverAvailability}
                onChange={(e) =>
                  setDiscoverAvailability(e.target.value as Asset3DAvailabilityFilter)
                }
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">All Import Modes</option>
                <option value="direct_cors">1-Click Direct Import Only</option>
                <option value="portal">Portal Download + Upload</option>
              </select>

              <select
                aria-label="Sort discovered 3D assets"
                value={discoverSort}
                onChange={(e) => setDiscoverSort(e.target.value as Asset3DDiscoverySort)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="recommended">Sort: Importable &amp; Relevant</option>
                <option value="relevance">Sort: Query Relevance</option>
                <option value="title_asc">Sort: Title (A–Z)</option>
                <option value="size_asc">Sort: Smallest File First</option>
                <option value="poly_desc">Sort: Highest Geometry Detail</option>
              </select>
            </div>

            {/* Scientific Domain Quick-Search Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Scientific Domains:
              </span>
              {DISCOVER_DOMAIN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setDiscoverQuery(preset.query);
                    setDiscoverCategory(preset.category);
                    void executeSearch(preset.query);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Honest API, Auth & CORS Policy Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              {PROVIDER_3D_REGISTRY.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{p.shortName}</span>
                    <a
                      href={
                        p.id === 'nih_3d_portal' && discoverQuery.trim()
                          ? `https://3d.nih.gov/discover?q=${encodeURIComponent(
                              discoverQuery.trim()
                            )}`
                          : p.websiteUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {p.supportedFormats.map((f) => f.toUpperCase()).join(' · ')} ·{' '}
                    {p.authRequirement === 'none'
                      ? 'No Auth / CORS Open'
                      : p.authRequirement === 'demo_key_rate_limited'
                      ? 'DEMO_KEY Rate-Limited'
                      : p.authRequirement === 'oauth_download'
                      ? 'Search Open · Login to Download'
                      : 'External Portal Only'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {p.policySummary}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {discoverWarnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Repository Notices</span>
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {discoverWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {discovering ? (
            <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>
                Querying Human Reference Atlas, PubChem 3D, RCSB PDB, Wikimedia Commons, Smithsonian &amp; Sketchfab...
              </span>
            </div>
          ) : !hasSearched ? (
            <div className="py-10 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
              <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Search Public Scientific 3D Repositories
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Search real 3D meshes by anatomical organ, cell/tissue, drug molecule, enzyme/receptor, medicinal plant, microorganism, pharmaceutical apparatus, lab instrument, or medical device. Preview models and verify licenses before saving offline to IndexedDB.
              </p>
            </div>
          ) : discovered.length === 0 ? (
            <div className="py-10 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2.5">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {rawDiscovered.length > 0
                  ? `All ${rawDiscovered.length} results were filtered out by your Category or Import Mode filter`
                  : `No public 3D entries matched “${discoverQuery}”`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {rawDiscovered.length > 0
                  ? 'Reset Category or Import Mode to "All" to view all matching models.'
                  : 'Try scientific terminology (e.g. "heart", "aspirin", "hemoglobin", "kidney", "microscope", "bacteria") or browse NIH 3D directly.'}
              </p>
              {rawDiscovered.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscoverCategory('all');
                    setDiscoverAvailability('all');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Reset Discovery Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing {discovered.length} of {rawDiscovered.length} discovered 3D assets
                </span>
                <span>
                  Click &ldquo;Preview &amp; Import&rdquo; to inspect geometry, verify license &amp; size, and save offline.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discovered.map((cand) => {
                  const safeSrc = sanitizeHttpUrl(cand.sourceUrl);
                  const isDirect =
                    cand.downloadPolicy === 'direct_cors' && Boolean(cand.directFileUrl);
                  const alreadyImported = findExistingAssetForCandidate(cand);

                  return (
                    <article
                      key={cand.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="flex gap-3.5">
                        {cand.previewUrl ? (
                          <img
                            src={cand.previewUrl}
                            alt={cand.title}
                            loading="lazy"
                            className="w-24 h-24 rounded-xl bg-slate-950 object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-1 shrink-0">
                            <Box className="w-7 h-7 text-emerald-400" />
                            <span className="text-[10px] font-bold text-slate-300">
                              {(cand.format || '3D').toUpperCase()}
                            </span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                              {cand.providerName}
                              {cand.format ? ` · ${cand.format.toUpperCase()}` : ''}
                              {cand.byteSize ? ` · ${formatBytes(cand.byteSize)}` : ''}
                            </p>
                            {alreadyImported && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                                Imported ✓
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {cand.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {cand.creator} · {cand.license}
                            {cand.suggestedCategory
                              ? ` · ${get3DCategoryLabel(cand.suggestedCategory, customCategories)}`
                              : ''}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {cand.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <p className="leading-relaxed">
                          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-600 dark:text-emerald-400" />
                          {cand.downloadNotice}
                        </p>
                        <p className="truncate">Attribution: {cand.attribution}</p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        {safeSrc && (
                          <a
                            href={safeSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>
                              {cand.downloadPolicy === 'portal_login_required'
                                ? 'Open on Sketchfab'
                                : 'Source Page'}
                            </span>
                          </a>
                        )}

                        {alreadyImported ? (
                          <button
                            type="button"
                            onClick={() => handleOpenViewer(alreadyImported)}
                            className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <Box className="w-3.5 h-3.5" />
                            <span>Inspect Imported 3D</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setImportCandidate(cand)}
                            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                              isDirect
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isDirect ? (
                              <Download className="w-3.5 h-3.5" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isDirect ? 'Preview & Import' : 'Preview & Guided Import'}
                            </span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Imported Scientific Assets Shelf (reads directly from single IndexedDB library) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Imported Offline 3D Assets ({importedAssets.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All imported scientific models are stored once in IndexedDB with full provenance and immediately available across all B.Pharm departments.
                </p>
              </div>
              {importedAssets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Open Full 3D Library ({assets.length})
                </button>
              )}
            </div>

            {importedAssets.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No external 3D models imported yet. Search above and click &ldquo;Preview &amp; Import&rdquo; on any compatible asset to store it offline.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {importedAssets.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenViewer(item)}
                    className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center gap-3 text-left transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.thumbnailDataUrl || item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailDataUrl || item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Box className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.format.toUpperCase()}
                        {item.byteSize ? ` · ${formatBytes(item.byteSize)}` : ''} ·{' '}
                        {item.sourceName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================== TAB 3: SYLLABUS & LAB MAPPING ==================== */}
      {activeTab === 'mapping' && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  12 B.Pharm Departments &amp; Experiment 3D Directory
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Organize and verify how stored 3D assets map across B.Pharm subjects, syllabus units, topics, and practical apparatus.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALL_BPHARM_DEPARTMENTS.map((dept) => {
                const count = assets.filter((a) => a.departments.includes(dept)).length;
                const active = mapDept === dept;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setMapDept(dept)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {BPHARM_DEPARTMENT_LABELS[dept]} ({count})
                  </button>
                );
              })}
            </div>
          </section>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {BPHARM_DEPARTMENT_LABELS[mapDept]} · Linked 3D Assets
              </h3>
              <button
                type="button"
                onClick={() => {
                  setUploadInitCtx({ departmentId: mapDept });
                  setUploadOpen(true);
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Model for {BPHARM_DEPARTMENT_LABELS[mapDept]}</span>
              </button>
            </div>

            {assets.filter((a) => a.departments.includes(mapDept)).length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                No 3D models are currently assigned to {BPHARM_DEPARTMENT_LABELS[mapDept]}. Upload or discover a model and link it to any subject, unit, topic, or lab experiment.
              </p>
            ) : (
              <div className="space-y-3">
                {assets
                  .filter((a) => a.departments.includes(mapDept))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.format.toUpperCase()} · {get3DCategoryLabel(item.category, customCategories)} ·{' '}
                            {IMPORT_STATUS_3D_LABELS[item.importStatus]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLinkModalAsset(item)}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                          >
                            <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Add Syllabus Link</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenViewer(item)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          >
                            Inspect 3D
                          </button>
                        </div>
                      </div>

                      {item.syllabusLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.syllabusLinks.map((lnk) => (
                            <span
                              key={lnk.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <span>
                                {[
                                  lnk.subjectCode,
                                  lnk.unitNo,
                                  lnk.topicTitle,
                                  lnk.experimentTitle,
                                  lnk.structureName
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || lnk.course}
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = await removeSyllabusAssociation(item.id, lnk.id);
                                  if (updated) {
                                    setAssets((prev) =>
                                      prev.map((a) => (a.id === updated.id ? updated : a))
                                    );
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-500"
                                aria-label="Remove syllabus link"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Quick Reference to Built-in Lab Apparatus */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Department Apparatus Foundation Hooks</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.values(DEPARTMENT_WORKSPACES)
                  .flatMap((ws) =>
                    ws.equipment.map((eq) => ({
                      dept: ws.shortLabel,
                      code: ws.code,
                      eq
                    }))
                  )
                  .map(({ dept, code, eq }) => (
                    <div
                      key={eq.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">{eq.name}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {dept} · {code}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('discover');
                          setDiscoverQuery(eq.visualQuery || eq.name);
                          void executeSearch(eq.visualQuery || eq.name);
                        }}
                        className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        Discover 3D Model for Apparatus
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Asset to Syllabus Topic Modal */}
      {linkModalAsset && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLinkModalAsset(null)}
        >
          <form
            onSubmit={handleSaveSyllabusLink}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Link &ldquo;{linkModalAsset.name}&rdquo; to Syllabus
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalAsset(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <select
                value={mapDept}
                onChange={(e) => setMapDept(e.target.value as BPharmDepartmentId)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                {ALL_BPHARM_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {BPHARM_DEPARTMENT_LABELS[d]}
                  </option>
                ))}
              </select>

              <select
                value={linkSubjectCode}
                onChange={(e) => {
                  setLinkSubjectCode(e.target.value);
                  setLinkTopicId('');
                }}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select Subject (Optional)</option>
                {allSyllabusSubjects.map((s) => (
                  <option key={s.subject.code} value={s.subject.code}>
                    {s.subject.code} · {s.subject.title}
                  </option>
                ))}
              </select>

              <select
                value={linkTopicId}
                onChange={(e) => setLinkTopicId(e.target.value)}
                disabled={linkTopics.length === 0}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Select Unit &amp; Topic (Optional)</option>
                {linkTopics.map((t) => (
                  <option key={t.topic.id} value={t.topic.id}>
                    {t.unitNo} · {t.topic.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={linkSubtopic}
                onChange={(e) => setLinkSubtopic(e.target.value)}
                placeholder="Subtopic name (Optional)"
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />

              <input
                type="text"
                value={linkExperiment}
                onChange={(e) => setLinkExperiment(e.target.value)}
                placeholder="Associated Lab Experiment (e.g. Exp 1a: Gutzeit Arsenic Apparatus)"
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkModalAsset(null)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                Save Association
              </button>
            </div>
          </form>
        </div>
      )}

      <Asset3DImportModal
        candidate={importCandidate}
        existingAssets={assets}
        defaultDepartment={libDept !== 'all' ? libDept : undefined}
        onClose={() => setImportCandidate(null)}
        onImported={(saved) => {
          setAssets((prev) => [saved, ...prev]);
          void refreshStorageReport();
          setToast({
            type: 'info',
            msg: `Imported "${saved.name}" (${saved.format.toUpperCase()} · ${formatBytes(
              saved.byteSize
            )}) into IndexedDB with preserved attribution & license metadata.`
          });
          handleOpenViewer(saved);
        }}
        onOpenExisting={(existing) => handleOpenViewer(existing)}
        onHandoffToUpload={(ctx) => {
          setUploadInitCtx(ctx);
          setUploadOpen(true);
        }}
      />

      <ModelViewerModal
        asset={viewerAsset}
        onClose={() => setViewerAsset(null)}
        onAssetUpdated={(updated) => {
          setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          if (detailsAsset?.id === updated.id) setDetailsAsset(updated);
        }}
        onAssetDeleted={(id) => {
          setAssets((prev) => prev.filter((a) => a.id !== id));
          if (detailsAsset?.id === id) setDetailsAsset(null);
          void refreshStorageReport();
        }}
      />

      <Asset3DDetailsModal
        asset={detailsAsset}
        customCategories={customCategories}
        onClose={() => setDetailsAsset(null)}
        onOpenViewer={(item) => handleOpenViewer(item)}
        onToggleFavorite={(item) => void handleToggleFavorite(item)}
        onEdit={(item) => {
          setDetailsAsset(null);
          setEditAsset(item);
        }}
        onDuplicateReference={(item) => void handleDuplicateReference(item)}
        onLinkTopic={(item) => {
          setDetailsAsset(null);
          setLinkModalAsset(item);
          setMapDept(item.departments[0] || 'anatomy');
        }}
        onUnlinkAssociation={async (assetId, assocId) => {
          const updated = await removeSyllabusAssociation(assetId, assocId);
          if (updated) {
            setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setDetailsAsset(updated);
          }
        }}
        onRequestDelete={(item) => setDeleteTargetAsset(item)}
      />

      <Asset3DEditModal
        asset={editAsset}
        allAssets={assets}
        onClose={() => setEditAsset(null)}
        onUpdated={(updated) => {
          setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          if (detailsAsset?.id === updated.id) setDetailsAsset(updated);
          if (viewerAsset?.id === updated.id) setViewerAsset(updated);
          setToast({
            type: 'info',
            msg: `Updated metadata for "${updated.name}".`
          });
        }}
        onCategoriesChanged={(cats) => setCustomCategories(cats)}
      />

      <Asset3DDeleteModal
        asset={deleteTargetAsset}
        onClose={() => setDeleteTargetAsset(null)}
        onDeleted={(id) => {
          setAssets((prev) => prev.filter((a) => a.id !== id));
          if (detailsAsset?.id === id) setDetailsAsset(null);
          if (viewerAsset?.id === id) setViewerAsset(null);
          void refreshStorageReport();
          setToast({
            type: 'info',
            msg: 'Removed 3D asset and safely updated linked binary references.'
          });
        }}
      />

      <Asset3DUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSaved={(saved) => {
          setAssets((prev) => [saved, ...prev]);
          setCustomCategories(getCustom3DCategories());
          void refreshStorageReport();
          setToast({
            type: 'info',
            msg: `Saved "${saved.name}" (${saved.format.toUpperCase()}) to your 3D Asset Library.`
          });
          handleOpenViewer(saved);
        }}
        initialContext={uploadInitCtx}
      />
    </div>
  );
}
