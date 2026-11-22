import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileUp,
  Images,
  Library,
  Loader2,
  Plus,
  ShieldCheck,
  X
} from 'lucide-react';
import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import {
  BookDepartmentTag,
  DocumentCategory,
  LibraryBookMeta,
  ProcessingProgress
} from '../knowledge-library/types';
import {
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
  DepartmentId,
  VisualCategory,
  VisualMediaItem
} from '../visual-library/types';
import {
  detectDuplicateResource,
  upsertSavedResourceRecord
} from './resourceHubStorage';
import {
  attemptRemotePdfImport,
  importLocalPdfForResource,
  importVisualResourceToLibrary
} from './resourceImporter';
import {
  AcademicContextRef,
  SavedResourceRecord,
  ScientificResourceItem
} from './types';
import { formatAuthorsLine, RESOURCE_TYPE_LABELS, sanitizeHttpUrl } from './utils';

interface ResourceImportModalProps {
  item: ScientificResourceItem | null;
  initialContexts?: AcademicContextRef[];
  existingBooks: LibraryBookMeta[];
  existingVisuals: VisualMediaItem[];
  savedRecords: SavedResourceRecord[];
  onClose: () => void;
  onCompleted: (result: {
    record: SavedResourceRecord;
    destination: 'visual_library' | 'knowledge_library' | 'reference_list';
    linkedBookId?: string;
    linkedVisualId?: string;
    message: string;
  }) => void;
  onOpenExistingBook?: (bookId: string) => void;
  onOpenExistingVisual?: (visualId: string) => void;
}

type ImportDestination = 'visual_library' | 'knowledge_library' | 'reference_list';

const ALL_DEPARTMENTS: DepartmentId[] = [
  'anatomy',
  'inorganic',
  'general_pharmacy',
  'pharmacognosy',
  'psychology',
  'python'
];

const PDF_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  textbook: 'Textbook',
  manual: 'Lab Manual',
  notes: 'Lecture Notes',
  research: 'Research Paper'
};

export default function ResourceImportModal({
  item,
  initialContexts = [],
  existingBooks,
  existingVisuals,
  savedRecords,
  onClose,
  onCompleted,
  onOpenExistingBook,
  onOpenExistingVisual
}: ResourceImportModalProps) {
  const defaultDest: ImportDestination = item?.canDirectImportVisual
    ? 'visual_library'
    : item?.canAttemptDirectPdfImport
      ? 'knowledge_library'
      : 'reference_list';

  const [destination, setDestination] = useState<ImportDestination>(defaultDest);
  const [title, setTitle] = useState(item?.title || '');
  const [visualCategory, setVisualCategory] = useState<VisualCategory>(
    item?.suggestedCategory || 'anatomy'
  );
  const [pdfCategory, setPdfCategory] = useState<DocumentCategory>(
    item?.resourceType === 'textbook' ? 'textbook' : 'research'
  );
  const [departments, setDepartments] = useState<DepartmentId[]>(
    item?.suggestedDepartments?.length ? item.suggestedDepartments : ['anatomy']
  );

  const [contexts, setContexts] = useState<AcademicContextRef[]>(initialContexts);
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>(item?.topics || []);
  const [structureQuery, setStructureQuery] = useState('');
  const [importNote, setImportNote] = useState('');

  const [manualPdfFile, setManualPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const duplicateCheck = useMemo(() => {
    if (!item) return { isDuplicate: false };
    return detectDuplicateResource(item, existingBooks, existingVisuals, savedRecords);
  }, [item, existingBooks, existingVisuals, savedRecords]);

  const matchingStructures = useMemo(() => {
    const q = structureQuery.trim().toLowerCase();
    if (!q) return ANATOMY_CATALOG.slice(0, 6);
    return ANATOMY_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.catalogNumber) === q ||
        s.alternateNames.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [structureQuery]);

  if (!item) return null;

  const safeSourceUrl = sanitizeHttpUrl(item.sourceUrl);
  const safePdfUrl = sanitizeHttpUrl(item.pdfUrl);

  const toggleDepartment = (dept: DepartmentId) => {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const addTopic = () => {
    const clean = topicInput.trim();
    if (!clean) return;
    if (!topics.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTopics((prev) => [...prev, clean]);
    }
    setTopicInput('');
  };

  const toggleStructureContext = (structId: string, name: string, catalogNumber: number) => {
    const ctxId = `structure:${structId}`;
    setContexts((prev) => {
      if (prev.some((c) => c.id === ctxId)) {
        return prev.filter((c) => c.id !== ctxId);
      }
      return [
        ...prev,
        {
          id: ctxId,
          kind: 'structure',
          label: `#${catalogNumber} ${name}`,
          departmentId: 'anatomy',
          structureId: structId,
          moduleId: 'anatomy',
          tab: 'explorer'
        }
      ];
    });
  };

  const buildAllContexts = (): AcademicContextRef[] => {
    const deptContexts: AcademicContextRef[] = departments.map((dept) => ({
      id: `dept:${dept}`,
      kind: 'department',
      label: DEPARTMENT_LABELS[dept],
      departmentId: dept,
      moduleId: dept
    }));
    const mergedMap = new Map<string, AcademicContextRef>();
    for (const c of [...contexts, ...deptContexts]) {
      mergedMap.set(c.id, c);
    }
    return Array.from(mergedMap.values());
  };

  const handleConfirm = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    const allContexts = buildAllContexts();

    try {
      if (destination === 'visual_library') {
        const { visual, record } = await importVisualResourceToLibrary(item, {
          title: title.trim() || item.title,
          category: visualCategory,
          departments: departments.length > 0 ? departments : ['anatomy'],
          contexts: allContexts,
          topics,
          note: importNote.trim() || undefined
        });
        onCompleted({
          record,
          destination: 'visual_library',
          linkedVisualId: visual.id,
          message: `Imported "${visual.title}" into Scientific Visual Library.`
        });
        return;
      }

      if (destination === 'knowledge_library') {
        const deptTag: BookDepartmentTag = departments[0] || 'all';
        const overrides = {
          title: title.trim() || item.title,
          category: pdfCategory,
          department: deptTag,
          contexts: allContexts,
          topics,
          note: importNote.trim() || undefined
        };

        const result = manualPdfFile
          ? await importLocalPdfForResource(manualPdfFile, item, overrides, setProgress)
          : await attemptRemotePdfImport(item, overrides, setProgress);

        onCompleted({
          record: result.record,
          destination: 'knowledge_library',
          linkedBookId: result.meta.id,
          message: `Indexed "${result.meta.title}" (${result.meta.pageCount} pages) into PDF Knowledge Library.`
        });
        return;
      }

      const { record } = upsertSavedResourceRecord(item, {
        status: 'saved_reference',
        destination: 'reference_list',
        contexts: allContexts,
        topics: Array.from(new Set([...topics, ...allContexts.map((c) => c.label)])),
        importNote: importNote.trim() || undefined
      });

      onCompleted({
        record,
        destination: 'reference_list',
        message: `Saved "${item.title}" to your PharmaLab Reference Manager.`
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import operation could not complete.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Review and import scientific resource"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {item.providerName} · {RESOURCE_TYPE_LABELS[item.resourceType]}
              {item.publicationDate ? ` · ${item.publicationDate}` : ''}
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              Import &amp; Attach Resource Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatAuthorsLine(item.authors)} · {item.journalOrPublisher}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close import review"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning */}
        {duplicateCheck.isDuplicate && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Duplicate Detected</p>
                <p className="text-xs opacity-90">{duplicateCheck.reason}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {duplicateCheck.existingBookId && onOpenExistingBook && (
                <button
                  type="button"
                  onClick={() => onOpenExistingBook(duplicateCheck.existingBookId!)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Open Existing PDF
                </button>
              )}
              {duplicateCheck.existingVisualId && onOpenExistingVisual && (
                <button
                  type="button"
                  onClick={() => onOpenExistingVisual(duplicateCheck.existingVisualId!)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Open Existing Plate
                </button>
              )}
            </div>
          </div>
        )}

        {/* License & Preview Strip */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          {item.previewUrl && (
            <div className="w-full sm:w-32 h-28 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={item.previewUrl}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <ShieldCheck
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  item.isPermissiveLicense
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  License / Access: {item.license}
                </p>
                {item.licenseWarning && (
                  <p className="text-amber-700 dark:text-amber-300 mt-0.5">{item.licenseWarning}</p>
                )}
              </div>
            </div>
            {(item.identifiers.doi || item.identifiers.pmid || item.identifiers.pmcid || item.identifiers.nbkId) && (
              <p className="text-slate-500 dark:text-slate-400 tabular-nums">
                {[
                  item.identifiers.pmid ? `PMID ${item.identifiers.pmid}` : '',
                  item.identifiers.pmcid ? item.identifiers.pmcid : '',
                  item.identifiers.doi ? `DOI ${item.identifiers.doi}` : '',
                  item.identifiers.nbkId ? `Bookshelf ${item.identifiers.nbkId}` : ''
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              {safeSourceUrl && (
                <a
                  href={safeSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Original Source</span>
                </a>
              )}
              {safePdfUrl && (
                <a
                  href={safePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Official PDF Download</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Destination Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Import Destination in PharmaLab
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {item.canDirectImportVisual && (
              <button
                type="button"
                onClick={() => setDestination('visual_library')}
                className={`min-h-[48px] p-3 rounded-xl border text-left transition-colors ${
                  destination === 'visual_library'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Images className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Visual Library</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Store image locally in IndexedDB
                </p>
              </button>
            )}

            {!item.canDirectImportVisual && (
              <button
                type="button"
                onClick={() => setDestination('knowledge_library')}
                className={`min-h-[48px] p-3 rounded-xl border text-left transition-colors ${
                  destination === 'knowledge_library'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Library className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>PDF Knowledge Library</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {safePdfUrl ? 'Fetch OA PDF or upload local copy' : 'Upload local PDF copy'}
                </p>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDestination('reference_list')}
              className={`min-h-[48px] p-3 rounded-xl border text-left transition-colors ${
                destination === 'reference_list'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Saved Reference</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Save citation, summary &amp; topic links
              </p>
            </button>
          </div>
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="rh-import-title" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Resource Title in PharmaLab
            </label>
            <input
              id="rh-import-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {destination === 'visual_library' && (
            <div className="space-y-1.5">
              <label htmlFor="rh-vis-cat" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Visual Library Category
              </label>
              <select
                id="rh-vis-cat"
                value={visualCategory}
                onChange={(e) => setVisualCategory(e.target.value as VisualCategory)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {(Object.keys(CATEGORY_LABELS) as VisualCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {destination === 'knowledge_library' && (
            <div className="space-y-1.5">
              <label htmlFor="rh-pdf-cat" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                PDF Document Type
              </label>
              <select
                id="rh-pdf-cat"
                value={pdfCategory}
                onChange={(e) => setPdfCategory(e.target.value as DocumentCategory)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {(Object.keys(PDF_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {PDF_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Manual PDF Drop / CORS Guidance when importing to PDF Knowledge Library */}
        {destination === 'knowledge_library' && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  PDF File Source
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {manualPdfFile
                    ? `Selected local file: ${manualPdfFile.name} (${(manualPdfFile.size / (1024 * 1024)).toFixed(2)} MB)`
                    : safePdfUrl
                      ? 'Will attempt CORS PDF download from remote source, or select a PDF you downloaded from the official link.'
                      : 'No direct PDF stream URL exposed; download the PDF via the official source link and select it here.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setManualPdfFile(f);
                    setErrorMessage(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FileUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{manualPdfFile ? 'Change PDF' : 'Select Downloaded PDF'}</span>
                </button>
                {manualPdfFile && (
                  <button
                    type="button"
                    onClick={() => setManualPdfFile(null)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Academic Department & Anatomy Structure Linking */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Link to B.Pharm Departments
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DEPARTMENTS.map((dept) => {
                const active = departments.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDepartment(dept)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    {DEPARTMENT_LABELS[dept]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Attach to Anatomy Catalog Structures (#1–#60) or Custom Topics
            </label>
            <input
              type="text"
              value={structureQuery}
              onChange={(e) => setStructureQuery(e.target.value)}
              placeholder="Filter anatomy catalog (e.g., Heart, Kidney, Nephron, #11)..."
              className="w-full min-h-[38px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex flex-wrap gap-1.5">
              {matchingStructures.map((struct) => {
                const active = contexts.some((c) => c.id === `structure:${struct.id}`);
                return (
                  <button
                    key={struct.id}
                    type="button"
                    onClick={() => toggleStructureContext(struct.id, struct.name, struct.catalogNumber)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors tabular-nums ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    #{struct.catalogNumber} {struct.name}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTopic();
                  }
                }}
                placeholder="Add custom study topic tag (e.g., Nephron physiology)..."
                className="flex-1 min-h-[38px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addTopic}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Topic</span>
              </button>
            </div>

            {(contexts.length > 0 || topics.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Attached:</span>
                {contexts.map((ctx) => (
                  <button
                    key={ctx.id}
                    type="button"
                    onClick={() => setContexts((prev) => prev.filter((c) => c.id !== ctx.id))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium"
                    title="Click to detach"
                  >
                    <span>{ctx.label}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopics((prev) => prev.filter((x) => x !== t))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                    title="Click to remove topic"
                  >
                    <span>{t}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rh-import-note" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Study / Citation Note (Optional)
            </label>
            <input
              id="rh-import-note"
              type="text"
              value={importNote}
              onChange={(e) => setImportNote(e.target.value)}
              placeholder="e.g., Unit III Renal Physiology seminar reference..."
              className="w-full min-h-[38px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Live PDF Progress or Error Banner */}
        {progress && submitting && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
              <span>{progress.message}</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {destination === 'visual_library'
                ? 'Import to Visual Library'
                : destination === 'knowledge_library'
                  ? manualPdfFile
                    ? 'Index Selected PDF'
                    : 'Attempt PDF Import'
                  : 'Save Reference & Links'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
