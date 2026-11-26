import React from 'react';
import {
  AlertTriangle,
  Box,
  Calendar,
  Compass,
  Copy,
  Edit3,
  ExternalLink,
  FileCode2,
  FlaskConical,
  GraduationCap,
  Link2,
  MapPin,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { getRelatedExperimentsForAsset } from './experimentCatalog';
import {
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  Custom3DCategory,
  formatBytes,
  get3DCategoryLabel,
  getAsset3DAvailability,
  IMPORT_STATUS_3D_LABELS,
  SyllabusAssociation
} from './types';

function deptToModuleId(dept: SyllabusAssociation['departmentId']): string {
  switch (dept as string) {
    case 'anatomy':
      return 'anatomy';
    case 'pharmaceutics':
    case 'industrial_pharmacy':
      return 'general_pharmacy';
    case 'pharmaceutical_chemistry':
    case 'pharmaceutical_analysis':
      return 'inorganic';
    case 'pharmacognosy':
      return 'pharmacognosy';
    case 'clinical_pharmacy':
      return 'psychology';
    case 'research':
    case 'biostatistics':
      return 'python';
    default:
      return 'study_mode';
  }
}

interface Asset3DDetailsModalProps {
  asset: Asset3DItem | null;
  customCategories?: Custom3DCategory[];
  onClose: () => void;
  onOpenViewer: (asset: Asset3DItem) => void;
  onToggleFavorite: (asset: Asset3DItem) => void;
  onEdit: (asset: Asset3DItem) => void;
  onDuplicateReference: (asset: Asset3DItem) => void;
  onLinkTopic: (asset: Asset3DItem) => void;
  onEditAssociation?: (asset: Asset3DItem, assoc: SyllabusAssociation) => void;
  onUnlinkAssociation?: (assetId: string, assocId: string) => void;
  onRequestDelete: (asset: Asset3DItem) => void;
}

function formatDateTime(ts?: number): string {
  if (!ts) return 'Not recorded';
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Unknown date';
  }
}

export default function Asset3DDetailsModal({
  asset,
  customCategories = [],
  onClose,
  onOpenViewer,
  onToggleFavorite,
  onEdit,
  onDuplicateReference,
  onLinkTopic,
  onEditAssociation,
  onUnlinkAssociation,
  onRequestDelete
}: Asset3DDetailsModalProps) {
  const { openAcademicExplorer, openStudyMode, navigateToModule } = useLibraryNavigation();
  if (!asset) return null;

  const availability = getAsset3DAvailability(asset);
  const safeSourceUrl = sanitizeHttpUrl(asset.sourceUrl);
  const categoryLabel = get3DCategoryLabel(asset.category, customCategories);

  const uniqueSubjects = Array.from(
    new Set(
      asset.syllabusLinks
        .map((l) =>
          l.subjectCode && l.subjectTitle
            ? `${l.subjectCode} · ${l.subjectTitle}`
            : l.subjectCode || l.subjectTitle
        )
        .filter((v): v is string => Boolean(v))
    )
  );

  const relatedExperiments = getRelatedExperimentsForAsset(asset);

  const anatomyStructures = Array.from(
    new Set(
      asset.syllabusLinks
        .map((l) => l.structureName)
        .filter((v): v is string => Boolean(v))
    )
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Asset details: ${asset.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="text-emerald-700 dark:text-emerald-400">{categoryLabel}</span>
              <span> · {asset.format.toUpperCase()} · </span>
              <span
                className={
                  availability.canOpenViewer
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-amber-700 dark:text-amber-400'
                }
              >
                {availability.label}
              </span>
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {asset.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(asset)}
              className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl border transition-colors ${
                asset.isFavorite
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500'
              }`}
              aria-label={asset.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={asset.isFavorite ? 'Favorited' : 'Favorite'}
            >
              <Star className={`w-4 h-4 ${asset.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close asset details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Preview + Primary Action Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-5 space-y-3">
              <div className="aspect-[16/11] rounded-xl bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                {asset.thumbnailDataUrl || asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailDataUrl || asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-1.5 text-slate-400">
                    <Box className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">
                      {asset.format.toUpperCase()} Scientific Model
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Thumbnail captures automatically on first 3D inspection
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!availability.canOpenViewer}
                  onClick={() => {
                    onClose();
                    openAcademicExplorer({ assetId: asset.id });
                  }}
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>
                    {availability.canOpenViewer
                      ? 'Open in Academic 3D Explorer'
                      : 'No Local Binary or Direct 3D URL'}
                  </span>
                </button>

                {availability.canOpenViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenViewer(asset);
                    }}
                    className="w-full min-h-[38px] px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <Box className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Quick Inspect in Modal Viewer</span>
                  </button>
                )}
              </div>

              {!availability.canOpenViewer && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    This record currently holds metadata only without an attached GLB/STL file. Open its source page or upload a local file in the library.
                  </span>
                </div>
              )}
            </div>

            <div className="md:col-span-7 space-y-4">
              {/* Scientific Description */}
              <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Scientific Description
                </h3>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {asset.description || 'No scientific description recorded yet.'}
                </p>
              </section>

              {/* File & Technical Info */}
              <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>File Info &amp; Telemetry</span>
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600 dark:text-slate-400 tabular-nums">
                  <div>
                    <span className="block text-[11px] text-slate-400">File Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
                      {asset.fileName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Format &amp; Size</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {asset.format.toUpperCase()} · {formatBytes(asset.byteSize)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Import Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDateTime(asset.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Last Viewed</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {asset.lastOpenedAt ? formatDateTime(asset.lastOpenedAt) : 'Not viewed yet'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Storage Status</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {IMPORT_STATUS_3D_LABELS[asset.importStatus]}
                      {asset.binaryRefAssetId ? ' (Shared Binary Ref)' : ''}
                    </span>
                  </div>
                  {(asset.componentCount || asset.triangleCount || asset.vertexCount) && (
                    <div>
                      <span className="block text-[11px] text-slate-400">Mesh Geometry</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {[
                          asset.componentCount ? `${asset.componentCount} parts` : null,
                          asset.triangleCount
                            ? `${asset.triangleCount.toLocaleString()} tris`
                            : null,
                          asset.vertexCount ? `${asset.vertexCount.toLocaleString()} verts` : null
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Provenance, Licensing & Curriculum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Source &amp; Licensing</span>
                </h3>
                {safeSourceUrl && (
                  <a
                    href={safeSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <dl className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                    Provider / Source:{' '}
                  </dt>
                  <dd className="inline">{asset.sourceName}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                    Creator / Author:{' '}
                  </dt>
                  <dd className="inline">{asset.creator}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                    License:{' '}
                  </dt>
                  <dd className="inline">{asset.license}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-slate-800 dark:text-slate-200">
                    Attribution:{' '}
                  </dt>
                  <dd className="inline">{asset.attribution}</dd>
                </div>
              </dl>

              {asset.usageRestrictions && (
                <p className="text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  {asset.usageRestrictions}
                </p>
              )}

              {asset.tags.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {asset.tags.join(' · ')}
                  </span>
                </div>
              )}
            </section>

            {/* Usage References: Subjects, Syllabus Topics, Anatomy & Experiments */}
            <section className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Curriculum &amp; Module Usage ({asset.syllabusLinks.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onLinkTopic(asset)}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" />
                  <span>Add Link</span>
                </button>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Departments
                </p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {asset.departments.map((d) => BPHARM_DEPARTMENT_LABELS[d]).join(' · ')}
                </p>
              </div>

              {uniqueSubjects.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Related Subjects
                  </p>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                    {uniqueSubjects.join(' · ')}
                  </p>
                </div>
              )}

              {relatedExperiments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 text-emerald-600" />
                    <span>Related Practical Experiments</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {relatedExperiments.map((exp) => (
                      <button
                        key={`${exp.moduleId}:${exp.id}:${exp.stepTitle || ''}`}
                        type="button"
                        onClick={() => {
                          onClose();
                          navigateToModule(exp.moduleId, exp.tab);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left text-[11px] font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5"
                      >
                        <span className="text-emerald-700 dark:text-emerald-400">{exp.code}</span>
                        <span>{exp.title}</span>
                        {exp.stepTitle && (
                          <span className="text-slate-500 dark:text-slate-400">· {exp.stepTitle}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {anatomyStructures.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Anatomy Explorer Structures
                  </p>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                    {anatomyStructures.join(' · ')}
                  </p>
                </div>
              )}

              {asset.syllabusLinks.length > 0 ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pt-1">
                  {asset.syllabusLinks.map((lnk) => {
                    const labelText =
                      [
                        lnk.subjectCode,
                        lnk.unitNo,
                        lnk.unitTitle,
                        lnk.topicTitle,
                        lnk.subtopicTitle
                      ]
                        .filter(Boolean)
                        .join(' · ') ||
                      lnk.experimentTitle ||
                      lnk.structureName ||
                      BPHARM_DEPARTMENT_LABELS[lnk.departmentId];

                    const handleJump = () => {
                      onClose();
                      if (lnk.structureId) {
                        navigateToModule('anatomy', 'explorer', {
                          structureId: lnk.structureId
                        });
                        return;
                      }
                      if (lnk.experimentTab || lnk.experimentId || lnk.experimentTitle) {
                        const mod = deptToModuleId(lnk.departmentId);
                        if (mod !== 'study_mode') {
                          navigateToModule(mod, lnk.experimentTab || null);
                          return;
                        }
                      }
                      if (lnk.topicId || lnk.subjectCode) {
                        openStudyMode({
                          syllabusId: lnk.syllabusId ?? null,
                          subjectCode: lnk.subjectCode ?? null,
                          topicId: lnk.topicId ?? null,
                          view: 'study'
                        });
                        return;
                      }
                      navigateToModule(deptToModuleId(lnk.departmentId));
                    };

                    return (
                      <div
                        key={lnk.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <button
                          type="button"
                          onClick={handleJump}
                          className="min-w-0 flex-1 text-left hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                          title="Open linked curriculum context"
                        >
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {labelText}
                          </p>
                          {(lnk.learningObjective || lnk.experimentTitle) && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {lnk.learningObjective || lnk.experimentTitle}
                            </p>
                          )}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          {onEditAssociation && (
                            <button
                              type="button"
                              onClick={() => onEditAssociation(asset, lnk)}
                              className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                              aria-label="Edit curriculum link"
                              title="Edit curriculum link"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onUnlinkAssociation && (
                            <button
                              type="button"
                              onClick={() => onUnlinkAssociation(asset.id, lnk.id)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                              aria-label="Unlink association"
                              title="Remove link (keeps 3D asset in library)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  Not yet linked to a specific syllabus topic or lab experiment. Use &ldquo;Add Link&rdquo; to reuse this asset across Study Mode, Anatomy Explorer, or Labs without copying the binary.
                </p>
              )}

              {asset.annotations.length > 0 && (
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {asset.annotations.length} interactive 3D annotation pin
                    {asset.annotations.length === 1 ? '' : 's'} saved
                  </span>
                </p>
              )}
            </section>
          </div>
        </div>

        {/* Footer Management Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Edit / Rename</span>
            </button>
            <button
              type="button"
              onClick={() => onDuplicateReference(asset)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              title="Create an independent metadata copy that shares the stored 3D file without duplicating IndexedDB bytes"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Duplicate Reference</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRequestDelete(asset)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Asset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
