import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  Globe,
  GraduationCap,
  Layers,
  Link2,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
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
import Asset3DUploadModal, { Asset3DInitialContext } from './Asset3DUploadModal';
import ModelViewerModal from './ModelViewerModal';
import {
  addSyllabusAssociation,
  delete3DAsset,
  getAll3DAssets,
  removeSyllabusAssociation,
  save3DAssetWithFile
} from './asset3dDb';
import {
  discoverScientific3DAssets,
  fetchRemote3DBinary,
  PROVIDER_3D_REGISTRY
} from './discoveryProviders';
import {
  ALL_3D_CATEGORIES,
  ALL_BPHARM_DEPARTMENTS,
  Asset3DCategory,
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  CATEGORY_3D_LABELS,
  Discovered3DCandidate,
  formatBytes,
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

const DISCOVER_SUGGESTIONS = [
  'heart',
  'aspirin',
  'kidney',
  'hemoglobin',
  'paracetamol',
  'skull',
  'liver',
  'insulin'
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

  // Library filters
  const [libSearch, setLibSearch] = useState('');
  const [libCategory, setLibCategory] = useState<'all' | Asset3DCategory>('all');
  const [libDept, setLibDept] = useState<'all' | BPharmDepartmentId>('all');

  // Discovery state
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverProvider, setDiscoverProvider] = useState<'all' | Provider3DId>('all');
  const [discovering, setDiscovering] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [discovered, setDiscovered] = useState<Discovered3DCandidate[]>([]);
  const [discoverWarnings, setDiscoverWarnings] = useState<string[]>([]);
  const [importingCandId, setImportingCandId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Mapping state
  const [mapDept, setMapDept] = useState<BPharmDepartmentId>('anatomy');
  const [linkModalAsset, setLinkModalAsset] = useState<Asset3DItem | null>(null);
  const [linkSubjectCode, setLinkSubjectCode] = useState('');
  const [linkTopicId, setLinkTopicId] = useState('');
  const [linkSubtopic, setLinkSubtopic] = useState('');
  const [linkExperiment, setLinkExperiment] = useState('');

  // Viewer & Upload modals + Feedback notice
  const [viewerAsset, setViewerAsset] = useState<Asset3DItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitCtx, setUploadInitCtx] = useState<Asset3DInitialContext | undefined>(undefined);
  const [toast, setToast] = useState<{ type: 'info' | 'warning' | 'error'; msg: string } | null>(
    null
  );
  const handledNonceRef = useRef<number>(-1);

  const loadLibrary = useCallback(async () => {
    setLoadingAssets(true);
    try {
      const [list, syls] = await Promise.all([getAll3DAssets(), getAllSyllabi()]);
      setAssets(list);
      setSyllabi(syls);
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
        const res = await discoverScientific3DAssets(clean, provider, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setDiscovered(res.candidates);
        setDiscoverWarnings(res.warnings);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setDiscovered([]);
        setDiscoverWarnings([
          err instanceof Error ? err.message : 'Unable to query 3D repositories.'
        ]);
      } finally {
        if (!ctrl.signal.aborted) setDiscovering(false);
      }
    },
    [discoverProvider]
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
    recordActivity({
      key: `3d:${item.id}`,
      kind: 'model_3d',
      title: item.name,
      subtitle: `${item.format.toUpperCase()} · ${CATEGORY_3D_LABELS[item.category]}`,
      moduleId: 'assets_3d'
    });
    setViewerAsset(item);
  };

  const handleDirectCorsImport = async (cand: Discovered3DCandidate) => {
    if (!cand.directFileUrl) return;
    setImportingCandId(cand.id);
    setToast(null);
    try {
      const downloaded = await fetchRemote3DBinary(
        cand.directFileUrl,
        `${cand.title}.${cand.format || 'glb'}`,
        cand.format
      );
      const resolvedCategory =
        libCategory !== 'all' ? libCategory : cand.suggestedCategory || 'anatomy';
      const resolvedDept =
        libDept !== 'all' ? libDept : cand.suggestedDepartment || 'anatomy';

      const newItem: Asset3DItem = {
        id: `3d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: cand.title,
        description: cand.description,
        thumbnailUrl: cand.previewUrl,
        format: downloaded.format,
        fileName: downloaded.fileName,
        byteSize: downloaded.byteSize,
        category: resolvedCategory,
        departments: [resolvedDept],
        syllabusLinks: [],
        tags: cand.tags,
        sourceName: cand.providerName,
        sourceUrl: cand.sourceUrl,
        externalFileUrl: cand.directFileUrl,
        creator: cand.creator,
        attribution: cand.attribution,
        license: cand.license,
        usageRestrictions: cand.usageRestrictions,
        importStatus: 'imported_binary',
        hasBinaryBlob: true,
        annotations: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const saved = await save3DAssetWithFile(newItem, downloaded.buffer, downloaded.mimeType);
      setAssets((prev) => [saved, ...prev]);
      setToast({
        type: 'info',
        msg: `Imported "${saved.name}" (${saved.format.toUpperCase()} · ${formatBytes(
          saved.byteSize
        )}) into IndexedDB for offline 3D inspection.`
      });
      handleOpenViewer(saved);
    } catch (err) {
      setToast({
        type: 'warning',
        msg:
          err instanceof Error
            ? `${err.message} Use "Open Source" to download manually, then click "Upload Local 3D File".`
            : 'Direct CORS import blocked by source server. Download manually from source and upload locally.'
      });
    } finally {
      setImportingCandId(null);
    }
  };

  const filteredAssets = useMemo(() => {
    const q = libSearch.trim().toLowerCase();
    return assets.filter((a) => {
      if (libCategory !== 'all' && a.category !== libCategory) return false;
      if (libDept !== 'all' && !a.departments.includes(libDept)) return false;
      if (!q) return true;
      const hay = `${a.name} ${a.description} ${a.creator} ${a.tags.join(' ')} ${a.syllabusLinks
        .map((l) => `${l.subjectCode || ''} ${l.topicTitle || ''} ${l.experimentTitle || ''}`)
        .join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assets, libCategory, libDept, libSearch]);

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
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              PharmaLab P3.1 · WebGL PBR Viewer &amp; Syllabus-Mapped 3D Asset Repository
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Universal Scientific 3D Asset Engine
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Import and explore real GLB, glTF, ZIP bundles, STL, OBJ, PLY, PDB macromolecules, and SDF molecules across all 12 B.Pharm departments — with 1-click imports from NIH Human Reference Atlas, PubChem 3D, RCSB PDB, Wikimedia Commons, and Smithsonian.
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
          {/* Search & Filters */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  placeholder="Search stored 3D models by name, tag, creator, or syllabus topic..."
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  aria-label="Filter by 3D category"
                  value={libCategory}
                  onChange={(e) => setLibCategory(e.target.value as 'all' | Asset3DCategory)}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {ALL_3D_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_3D_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  aria-label="Filter by B.Pharm department"
                  value={libDept}
                  onChange={(e) => setLibDept(e.target.value as 'all' | BPharmDepartmentId)}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <option value="all">All 12 B.Pharm Departments</option>
                  {ALL_BPHARM_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {BPHARM_DEPARTMENT_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Showing {filteredAssets.length} of {assets.length} stored 3D assets · Offline storage used:{' '}
              {formatBytes(totalBytes)}
            </p>
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
                    : 'No 3D Models Matched Your Current Filters'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  PharmaLab renders only authentic 3D assets (never synthetic placeholder geometry). Discover open-access models from Wikimedia Commons, Sketchfab, or Smithsonian, or upload your own .glb / .gltf / .stl / .obj / .ply file.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2"
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAssets.map((item) => (
                <article
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm dark:shadow-none"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenViewer(item)}
                      className="w-full aspect-[16/10] bg-slate-950 border-b border-slate-200 dark:border-slate-800 relative group overflow-hidden flex items-center justify-center"
                    >
                      {item.thumbnailDataUrl || item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailDataUrl || item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                        />
                      ) : (
                        <div className="text-center space-y-1.5 text-slate-400">
                          <Box className="w-9 h-9 text-emerald-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-300">
                            {item.format.toUpperCase()} · Click to Inspect 3D
                          </p>
                        </div>
                      )}
                    </button>

                    <div className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {CATEGORY_3D_LABELS[item.category]}
                        </span>
                        <span> · </span>
                        <span>{item.format.toUpperCase()}</span>
                        {item.byteSize ? ` · ${formatBytes(item.byteSize)}` : ''}
                      </p>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {item.name}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.creator} · {item.license}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.departments.map((d) => BPHARM_DEPARTMENT_LABELS[d]).join(' · ')}
                        {item.syllabusLinks.length > 0
                          ? ` · ${item.syllabusLinks.length} syllabus link${
                              item.syllabusLinks.length === 1 ? '' : 's'
                            }`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLinkModalAsset(item);
                        setMapDept(item.departments[0] || 'anatomy');
                      }}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                    >
                      <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Link Topic</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await delete3DAsset(item.id);
                          setAssets((prev) => prev.filter((a) => a.id !== item.id));
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenViewer(item)}
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Inspect 3D
                      </button>
                    </div>
                  </div>
                </article>
              ))}
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
                Offline mode active. Live queries to Wikimedia Commons, Sketchfab, and Smithsonian require an internet connection, while your stored IndexedDB 3D assets remain available offline.
              </span>
            </div>
          )}

          {/* Discovery Search Panel */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void executeSearch(discoverQuery);
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  placeholder="Search anatomical organs, skull, microscope, molecule, plant, or machinery..."
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
                className="sm:w-56 min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
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

              <button
                type="submit"
                disabled={discovering || discoverQuery.trim().length < 2}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {discovering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search 3D Sources</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Try:
              </span>
              {DISCOVER_SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setDiscoverQuery(term);
                    void executeSearch(term);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Honest API & Access Policy Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              {PROVIDER_3D_REGISTRY.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{p.shortName}</span>
                    <a
                      href={
                        p.id === 'nih_3d_portal' && discoverQuery.trim()
                          ? `https://3d.nih.gov/discover?q=${encodeURIComponent(discoverQuery.trim())}`
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
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Search real 3D meshes by anatomical organ, drug molecule, protein/receptor, pharmaceutical apparatus, or medicinal plant. Direct CORS assets import in one click; Sketchfab &amp; portal `.ZIP`/`.GLB` downloads drop cleanly into Upload Local File.
              </p>
            </div>
          ) : discovered.length === 0 ? (
            <div className="py-10 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                No public 3D entries matched &ldquo;{discoverQuery}&rdquo;
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try anatomical or scientific terms (e.g. &ldquo;heart&rdquo;, &ldquo;aspirin&rdquo;, &ldquo;hemoglobin&rdquo;, &ldquo;kidney&rdquo;, &ldquo;skull&rdquo;) or search NIH 3D directly via the portal link above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discovered.map((cand) => {
                const safeSrc = sanitizeHttpUrl(cand.sourceUrl);
                const isDirect = cand.downloadPolicy === 'direct_cors' && Boolean(cand.directFileUrl);
                const importing = importingCandId === cand.id;
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
                        <div className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          <Box className="w-7 h-7 text-emerald-400" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                          {cand.providerName}
                          {cand.format ? ` · ${cand.format.toUpperCase()}` : ''}
                          {cand.byteSize ? ` · ${formatBytes(cand.byteSize)}` : ''}
                        </p>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {cand.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          Creator: {cand.creator} · {cand.license}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {cand.description}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-600 dark:text-emerald-400" />
                      {cand.downloadNotice}
                    </p>

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
                              ? 'Open on Sketchfab to Download'
                              : 'Open Original Source'}
                          </span>
                        </a>
                      )}

                      {isDirect ? (
                        <button
                          type="button"
                          disabled={importing}
                          onClick={() => void handleDirectCorsImport(cand)}
                          className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          {importing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{importing ? 'Importing...' : 'Import to 3D Library'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadInitCtx({
                              defaultTitle: cand.title,
                              departmentId: libDept !== 'all' ? libDept : 'anatomy'
                            });
                            setUploadOpen(true);
                          }}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Downloaded ZIP/GLB/STL</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
                            {item.format.toUpperCase()} · {CATEGORY_3D_LABELS[item.category]} ·{' '}
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

      <ModelViewerModal
        asset={viewerAsset}
        onClose={() => setViewerAsset(null)}
        onAssetUpdated={(updated) => {
          setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        }}
        onAssetDeleted={(id) => {
          setAssets((prev) => prev.filter((a) => a.id !== id));
        }}
      />

      <Asset3DUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSaved={(saved) => {
          setAssets((prev) => [saved, ...prev]);
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
