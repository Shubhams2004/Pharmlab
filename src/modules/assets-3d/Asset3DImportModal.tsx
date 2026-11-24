import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Upload,
  X
} from 'lucide-react';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { getAllSyllabi } from '../study-mode/studyDb';
import { SyllabusProfile } from '../study-mode/types';
import { Asset3DInitialContext } from './Asset3DUploadModal';
import Universal3DViewer from './Universal3DViewer';
import { save3DAssetWithFile, getCustom3DCategories, getMerged3DCategoryOptions } from './asset3dDb';
import {
  Fetched3DBinary,
  fetchRemote3DBinary,
  preflightRemote3DAsset,
  Remote3DPreflightResult,
  SAFE_AUTO_PREVIEW_BYTES
} from './discoveryProviders';
import {
  ALL_BPHARM_DEPARTMENTS,
  Asset3DCategory,
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  Discovered3DCandidate,
  formatBytes,
  SyllabusAssociation
} from './types';

interface Asset3DImportModalProps {
  candidate: Discovered3DCandidate | null;
  existingAssets: Asset3DItem[];
  defaultDepartment?: BPharmDepartmentId;
  onClose: () => void;
  onImported: (item: Asset3DItem) => void;
  onOpenExisting: (item: Asset3DItem) => void;
  onHandoffToUpload: (ctx: Asset3DInitialContext) => void;
}

export default function Asset3DImportModal({
  candidate,
  existingAssets,
  defaultDepartment,
  onClose,
  onImported,
  onOpenExisting,
  onHandoffToUpload
}: Asset3DImportModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Asset3DCategory>('anatomy');
  const [selectedDepts, setSelectedDepts] = useState<BPharmDepartmentId[]>(['anatomy']);

  // Syllabus linking
  const [syllabi, setSyllabi] = useState<SyllabusProfile[]>([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [manualExperiment, setManualExperiment] = useState('');

  // Preflight & Binary preview/download states
  const [preflight, setPreflight] = useState<Remote3DPreflightResult | null>(null);
  const [checkingPreflight, setCheckingPreflight] = useState(false);

  const [downloadState, setDownloadState] = useState<
    'idle' | 'downloading' | 'ready' | 'saving' | 'cancelled' | 'error'
  >('idle');
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState<number | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fetchedBinary, setFetchedBinary] = useState<Fetched3DBinary | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [showSketchfabEmbed, setShowSketchfabEmbed] = useState(false);

  const activeAbortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const existingMatch = useMemo(() => {
    if (!candidate) return null;
    return (
      existingAssets.find(
        (a) =>
          (candidate.directFileUrl && a.externalFileUrl === candidate.directFileUrl) ||
          (candidate.sourceUrl &&
            a.sourceUrl === candidate.sourceUrl &&
            a.name.toLowerCase() === candidate.title.toLowerCase())
      ) || null
    );
  }, [candidate, existingAssets]);

  const cleanupPreviewUrl = () => {
    if (previewUrlRef.current) {
      try {
        URL.revokeObjectURL(previewUrlRef.current);
      } catch {
        // ignore revoke error
      }
      previewUrlRef.current = null;
    }
    setPreviewObjectUrl(null);
  };

  useEffect(() => {
    activeAbortRef.current?.abort();
    activeAbortRef.current = null;
    cleanupPreviewUrl();
    setFetchedBinary(null);
    setPreflight(null);
    setDownloadState('idle');
    setProgressText('');
    setProgressPct(undefined);
    setErrorMsg(null);
    setShowSketchfabEmbed(false);

    if (!candidate) return;

    setTitle(candidate.title);
    setCategory(candidate.suggestedCategory || 'anatomy');
    setSelectedDepts([
      defaultDepartment || candidate.suggestedDepartment || 'anatomy'
    ]);
    setSelectedSubjectCode('');
    setSelectedTopicId('');
    setManualExperiment('');

    getAllSyllabi()
      .then((list) => setSyllabi(list))
      .catch(() => setSyllabi([]));

    if (candidate.downloadPolicy === 'direct_cors' && candidate.directFileUrl) {
      const ctrl = new AbortController();
      activeAbortRef.current = ctrl;
      setCheckingPreflight(true);
      preflightRemote3DAsset(
        candidate.directFileUrl,
        candidate.byteSize,
        candidate.format,
        ctrl.signal
      )
        .then((res) => {
          if (ctrl.signal.aborted) return;
          setPreflight(res);
          // Auto-load lightweight CORS 3D preview when known byte size <= 8 MB
          if (
            res.reachable &&
            res.byteSize &&
            res.byteSize <= SAFE_AUTO_PREVIEW_BYTES
          ) {
            void startDownloadForPreview(candidate, ctrl);
          }
        })
        .catch((err) => {
          if ((err as Error)?.name === 'AbortError') return;
          setPreflight({
            reachable: false,
            resolvedUrl: candidate.directFileUrl!,
            tooLarge: false,
            largeWarning: false,
            note: err instanceof Error ? err.message : 'Unable to verify remote asset availability.'
          });
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setCheckingPreflight(false);
        });
    }

    return () => {
      activeAbortRef.current?.abort();
      cleanupPreviewUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.id]);

  const startDownloadForPreview = async (
    target: Discovered3DCandidate,
    existingCtrl?: AbortController
  ): Promise<Fetched3DBinary | null> => {
    if (!target.directFileUrl) return null;
    if (!existingCtrl) {
      activeAbortRef.current?.abort();
    }
    const ctrl = existingCtrl || new AbortController();
    activeAbortRef.current = ctrl;

    cleanupPreviewUrl();
    setFetchedBinary(null);
    setErrorMsg(null);
    setDownloadState('downloading');
    setProgressPct(undefined);
    setProgressText('Connecting to open repository...');

    try {
      const downloaded = await fetchRemote3DBinary({
        url: target.directFileUrl,
        fallbackFileName: `${target.title}.${target.format || 'glb'}`,
        expectedFormat: target.format,
        signal: ctrl.signal,
        onProgress: ({ loadedBytes, totalBytes, percent }) => {
          setProgressPct(percent);
          setProgressText(
            percent !== undefined
              ? `Downloading ${percent}% (${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)})`
              : `Downloading ${formatBytes(loadedBytes)}...`
          );
        }
      });

      if (ctrl.signal.aborted) return null;

      const blob = new Blob([downloaded.buffer], {
        type: downloaded.mimeType || 'application/octet-stream'
      });
      const objUrl = URL.createObjectURL(blob);
      previewUrlRef.current = objUrl;
      setPreviewObjectUrl(objUrl);
      setFetchedBinary(downloaded);
      setDownloadState('ready');
      setProgressPct(100);
      setProgressText(
        `Verified ${downloaded.format.toUpperCase()} (${formatBytes(downloaded.byteSize)})`
      );
      return downloaded;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setDownloadState('cancelled');
        setProgressText('Download cancelled.');
        return null;
      }
      setDownloadState('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to fetch 3D file from remote source.'
      );
      return null;
    } finally {
      if (activeAbortRef.current === ctrl) {
        activeAbortRef.current = null;
      }
    }
  };

  const handleCancelActive = () => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
      activeAbortRef.current = null;
      setCheckingPreflight(false);
      setDownloadState('cancelled');
      setProgressText('Operation cancelled by user.');
    }
  };

  const allSubjects = useMemo(
    () =>
      syllabi.flatMap((syl) =>
        syl.subjects.map((sub) => ({
          course: syl.course,
          subject: sub
        }))
      ),
    [syllabi]
  );

  const activeTopics = useMemo(() => {
    const match = allSubjects.find((s) => s.subject.code === selectedSubjectCode);
    if (!match) return [];
    return match.subject.units.flatMap((u) =>
      u.topics.map((t) => ({ unitNo: u.unitNo, topic: t }))
    );
  }, [allSubjects, selectedSubjectCode]);

  const toggleDept = (dept: BPharmDepartmentId) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? (prev.length > 1 ? prev.filter((d) => d !== dept) : prev) : [...prev, dept]
    );
  };

  const handleConfirmImport = async () => {
    if (!candidate || !candidate.directFileUrl) return;
    if (!title.trim()) {
      setErrorMsg('Please enter an asset title before saving.');
      return;
    }

    let binary = fetchedBinary;
    if (!binary) {
      binary = await startDownloadForPreview(candidate);
      if (!binary) return;
    }

    setDownloadState('saving');
    setErrorMsg(null);
    try {
      const syllabusLinks: SyllabusAssociation[] = [];
      const subMatch = allSubjects.find((s) => s.subject.code === selectedSubjectCode);
      const topMatch = activeTopics.find((t) => t.topic.id === selectedTopicId);
      if (subMatch || topMatch || manualExperiment.trim()) {
        syllabusLinks.push({
          id: `link_${Date.now()}`,
          course: subMatch?.course || 'B.Pharm',
          departmentId: selectedDepts[0] || 'anatomy',
          subjectCode: subMatch?.subject.code,
          subjectTitle: subMatch?.subject.title,
          unitNo: topMatch?.unitNo,
          topicId: topMatch?.topic.id,
          topicTitle: topMatch?.topic.title,
          experimentTitle: manualExperiment.trim() || undefined
        });
      }

      const item: Asset3DItem = {
        id: `3d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: title.trim(),
        description: candidate.description,
        thumbnailUrl: candidate.previewUrl,
        format: binary.format,
        fileName: binary.fileName,
        byteSize: binary.byteSize,
        category,
        departments: selectedDepts,
        syllabusLinks,
        tags: candidate.tags,
        sourceName: candidate.providerName,
        sourceUrl: candidate.sourceUrl,
        externalFileUrl: candidate.directFileUrl,
        creator: candidate.creator,
        attribution: candidate.attribution,
        license: candidate.license,
        usageRestrictions: candidate.usageRestrictions,
        importStatus: 'imported_binary',
        hasBinaryBlob: true,
        vertexCount: candidate.vertexCount,
        triangleCount: candidate.faceCount,
        annotations: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const saved = await save3DAssetWithFile(item, binary.buffer, binary.mimeType);
      onImported(saved);
      onClose();
    } catch (err) {
      setDownloadState('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to persist 3D asset into IndexedDB.'
      );
    }
  };

  if (!candidate) return null;

  const safeSourceUrl = sanitizeHttpUrl(candidate.sourceUrl);
  const safeCreatorUrl = sanitizeHttpUrl(candidate.creatorUrl);
  const safeEmbedUrl = sanitizeHttpUrl(candidate.previewEmbedUrl);
  const isDirect = candidate.downloadPolicy === 'direct_cors' && Boolean(candidate.directFileUrl);
  const displaySize = fetchedBinary?.byteSize ?? preflight?.byteSize ?? candidate.byteSize;
  const displayFormat = fetchedBinary?.format ?? preflight?.format ?? candidate.format;

  const previewStubAsset: Asset3DItem = {
    id: `preview_${candidate.id}`,
    name: title || candidate.title,
    description: candidate.description,
    format: displayFormat || 'glb',
    fileName: fetchedBinary?.fileName || 'preview.glb',
    byteSize: displaySize,
    category,
    departments: selectedDepts,
    syllabusLinks: [],
    tags: candidate.tags,
    sourceName: candidate.providerName,
    sourceUrl: candidate.sourceUrl,
    creator: candidate.creator,
    attribution: candidate.attribution,
    license: candidate.license,
    usageRestrictions: candidate.usageRestrictions,
    importStatus: 'external_reference',
    hasBinaryBlob: false,
    annotations: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const triggerManualUploadHandoff = () => {
    onClose();
    onHandoffToUpload({
      defaultTitle: title.trim() || candidate.title,
      defaultCategory: category,
      departmentId: selectedDepts[0] || candidate.suggestedDepartment || 'anatomy',
      defaultDescription: candidate.description,
      defaultCreator: candidate.creator,
      defaultSourceName: candidate.providerName,
      defaultSourceUrl: candidate.sourceUrl,
      defaultLicense: candidate.license,
      defaultAttribution: candidate.attribution,
      defaultUsageRestrictions: candidate.usageRestrictions,
      defaultTags: candidate.tags
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-0 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect & Import 3D Asset: ${candidate.title}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[92dvh] bg-white dark:bg-slate-900 border-0 sm:border sm:border-slate-200 sm:dark:border-slate-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {candidate.providerName}
              {displayFormat ? ` · ${displayFormat.toUpperCase()}` : ''}
              {displaySize ? ` · ${formatBytes(displaySize)}` : ''} · {candidate.license}
            </p>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 sm:truncate">
              {candidate.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              handleCancelActive();
              onClose();
            }}
            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shrink-0"
            aria-label="Close import inspection modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Existing Duplicate Notice */}
          {existingMatch && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  This 3D model is already saved in your PharmaLab Asset Library as &ldquo;
                  {existingMatch.name}&rdquo;.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExisting(existingMatch);
                }}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Open in 3D Viewer
              </button>
            </div>
          )}

          {/* Pre-Import Interactive 3D Preview Stage */}
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Pre-Import Inspection &amp; 3D Preview</span>
              </h3>

              {isDirect && !previewObjectUrl && downloadState !== 'downloading' && !preflight?.tooLarge && (
                <button
                  type="button"
                  onClick={() => void startDownloadForPreview(candidate)}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Load Live 3D Preview</span>
                </button>
              )}

              {candidate.downloadPolicy === 'portal_login_required' && safeEmbedUrl && (
                <button
                  type="button"
                  onClick={() => setShowSketchfabEmbed((v) => !v)}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {showSketchfabEmbed ? 'Show Static Thumbnail' : 'Launch Sketchfab 3D Embed'}
                  </span>
                </button>
              )}
            </div>

            {previewObjectUrl && displayFormat ? (
              <div className="space-y-2">
                <Universal3DViewer
                  asset={previewStubAsset}
                  modelUrl={previewObjectUrl}
                  modelFormat={displayFormat}
                />
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Verified live 3D binary ({displayFormat.toUpperCase()} · {formatBytes(displaySize)}) ready — saving will store this downloaded binary offline without re-downloading.
                  </span>
                </p>
              </div>
            ) : showSketchfabEmbed && safeEmbedUrl ? (
              <div className="h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                <iframe
                  title={`Sketchfab 3D Preview: ${candidate.title}`}
                  src={safeEmbedUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col sm:flex-row items-center gap-5">
                {candidate.previewUrl ? (
                  <img
                    src={candidate.previewUrl}
                    alt={candidate.title}
                    className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl object-contain bg-slate-900 border border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-2 shrink-0 text-slate-400">
                    <Box className="w-10 h-10 text-emerald-400" />
                    <span className="text-xs font-semibold">
                      {(displayFormat || '3D').toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
                  <p className="text-sm font-bold text-white">{candidate.title}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {candidate.description}
                  </p>

                  {downloadState === 'downloading' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-emerald-300 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{progressText || 'Downloading 3D asset...'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelActive}
                          className="px-2.5 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${progressPct ?? 35}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {checkingPreflight && (
                    <p className="text-xs text-slate-400 inline-flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Checking remote format, availability &amp; file size...</span>
                    </p>
                  )}

                  {!checkingPreflight && preflight && downloadState === 'idle' && (
                    <p
                      className={`text-xs ${
                        preflight.tooLarge || !preflight.reachable
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {preflight.note}
                    </p>
                  )}

                  {downloadState === 'cancelled' && (
                    <p className="text-xs text-amber-300">
                      Download cancelled. You can restart the preview/import whenever ready.
                    </p>
                  )}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-200 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </span>
                {isDirect && !preflight?.tooLarge && (
                  <button
                    type="button"
                    onClick={() => void startDownloadForPreview(candidate)}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                  >
                    Retry Download
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Licensing, Attribution & Provenance Verification */}
          <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>License, Attribution &amp; Repository Policy Verification</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <p>
                <strong className="text-slate-900 dark:text-white">Source:</strong>{' '}
                {candidate.providerName}
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Creator:</strong>{' '}
                {safeCreatorUrl ? (
                  <a
                    href={safeCreatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {candidate.creator}
                  </a>
                ) : (
                  candidate.creator
                )}
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">License:</strong>{' '}
                {candidate.license}
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">Format &amp; Size:</strong>{' '}
                {(displayFormat || 'Unknown').toUpperCase()}
                {displaySize ? ` · ${formatBytes(displaySize)}` : ' · Size checked on fetch'}
                {candidate.vertexCount
                  ? ` · ${candidate.vertexCount.toLocaleString()} verts`
                  : ''}
              </p>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Required Attribution:</strong>{' '}
              {candidate.attribution}
            </p>
            <p className="text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              {candidate.usageRestrictions}
            </p>
          </section>

          {/* Academic Metadata & Syllabus Mapping before Saving */}
          <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>PharmaLab Integration &amp; Syllabus Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Asset Title in Library
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full min-h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Scientific Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Asset3DCategory)}
                  className="w-full min-h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  {getMerged3DCategoryOptions(existingAssets, getCustom3DCategories()).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                      {c.isCustom ? ' (Custom)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                B.Pharm Departments ({selectedDepts.length} selected)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_BPHARM_DEPARTMENTS.map((dept) => {
                  const active = selectedDepts.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDept(dept)}
                      className={`px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {BPHARM_DEPARTMENT_LABELS[dept]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <select
                aria-label="Assign B.Pharm Subject"
                value={selectedSubjectCode}
                onChange={(e) => {
                  setSelectedSubjectCode(e.target.value);
                  setSelectedTopicId('');
                }}
                className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Link B.Pharm Subject (Optional)</option>
                {allSubjects.map((s) => (
                  <option key={s.subject.code} value={s.subject.code}>
                    {s.subject.code} · {s.subject.title}
                  </option>
                ))}
              </select>

              <select
                aria-label="Assign Syllabus Unit and Topic"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={activeTopics.length === 0}
                className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Link Unit &amp; Topic (Optional)</option>
                {activeTopics.map((t) => (
                  <option key={t.topic.id} value={t.topic.id}>
                    {t.unitNo} · {t.topic.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={manualExperiment}
                onChange={(e) => setManualExperiment(e.target.value)}
                placeholder="Lab Experiment (Optional)"
                className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            {safeSourceUrl && (
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {candidate.downloadPolicy === 'portal_login_required'
                    ? 'Open on Sketchfab to Download'
                    : 'Open Source Page'}
                </span>
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {downloadState === 'downloading' ? (
              <button
                type="button"
                onClick={handleCancelActive}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold"
              >
                Cancel Import
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
              >
                Close
              </button>
            )}

            {isDirect && !preflight?.tooLarge ? (
              <button
                type="button"
                disabled={
                  downloadState === 'downloading' ||
                  downloadState === 'saving' ||
                  checkingPreflight ||
                  (preflight !== null && !preflight.reachable)
                }
                onClick={() => void handleConfirmImport()}
                className="min-h-[40px] px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                {downloadState === 'saving' || downloadState === 'downloading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {downloadState === 'saving'
                    ? 'Saving to IndexedDB...'
                    : fetchedBinary
                    ? 'Save Verified Model to Library'
                    : 'Download & Import to Library'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={triggerManualUploadHandoff}
                className="min-h-[40px] px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Downloaded .GLB / .ZIP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
