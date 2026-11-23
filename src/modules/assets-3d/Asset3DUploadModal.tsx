import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Box, Globe, Loader2, Upload, X } from 'lucide-react';
import { getAllSyllabi } from '../study-mode/studyDb';
import { SyllabusProfile } from '../study-mode/types';
import { save3DAssetWithFile } from './asset3dDb';
import { fetchRemote3DBinary } from './discoveryProviders';
import {
  ALL_3D_CATEGORIES,
  ALL_BPHARM_DEPARTMENTS,
  Asset3DCategory,
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  CATEGORY_3D_LABELS,
  detectModelFormatFromName,
  formatBytes,
  SyllabusAssociation
} from './types';

export interface Asset3DInitialContext {
  departmentId?: BPharmDepartmentId;
  course?: string;
  subjectCode?: string;
  subjectTitle?: string;
  unitNo?: string;
  topicId?: string;
  topicTitle?: string;
  subtopicId?: string;
  subtopicTitle?: string;
  experimentId?: string;
  experimentTitle?: string;
  structureId?: string;
  structureName?: string;
  defaultTitle?: string;
  defaultCategory?: Asset3DCategory;
}

interface Asset3DUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (item: Asset3DItem) => void;
  initialContext?: Asset3DInitialContext;
}

export default function Asset3DUploadModal({
  isOpen,
  onClose,
  onSaved,
  initialContext
}: Asset3DUploadModalProps) {
  const [sourceMode, setSourceMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Asset3DCategory>('anatomy');
  const [selectedDepts, setSelectedDepts] = useState<BPharmDepartmentId[]>(['anatomy']);
  const [creator, setCreator] = useState('');
  const [sourceName, setSourceName] = useState('Local / User Upload');
  const [sourceUrl, setSourceUrl] = useState('');
  const [license, setLicense] = useState('Educational Use / CC BY 4.0');
  const [attribution, setAttribution] = useState('');
  const [usageRestrictions, setUsageRestrictions] = useState(
    'Verify original author license terms before external redistribution.'
  );
  const [tagsText, setTagsText] = useState('');

  // Curriculum mapping fields
  const [syllabi, setSyllabi] = useState<SyllabusProfile[]>([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [manualSubtopic, setManualSubtopic] = useState('');
  const [manualExperiment, setManualExperiment] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getAllSyllabi()
      .then((list) => setSyllabi(list))
      .catch(() => setSyllabi([]));

    setSelectedFile(null);
    setRemoteUrl('');
    setErrorMsg(null);
    setName(initialContext?.defaultTitle || '');
    setDescription('');
    setCategory(initialContext?.defaultCategory || 'anatomy');
    setSelectedDepts([initialContext?.departmentId || 'anatomy']);
    setSelectedSubjectCode(initialContext?.subjectCode || '');
    setSelectedTopicId(initialContext?.topicId || '');
    setManualSubtopic(initialContext?.subtopicTitle || '');
    setManualExperiment(initialContext?.experimentTitle || '');
    setCreator('');
    setSourceName('Local / User Upload');
    setSourceUrl('');
    setAttribution('');
    setTagsText('');
  }, [isOpen, initialContext]);

  const allSubjects = useMemo(() => {
    return syllabi.flatMap((syl) =>
      syl.subjects.map((sub) => ({
        course: syl.course,
        subject: sub
      }))
    );
  }, [syllabi]);

  const activeSubjectTopics = useMemo(() => {
    const match = allSubjects.find((s) => s.subject.code === selectedSubjectCode);
    if (!match) return [];
    return match.subject.units.flatMap((u) =>
      u.topics.map((t) => ({
        unitNo: u.unitNo,
        topic: t
      }))
    );
  }, [allSubjects, selectedSubjectCode]);

  if (!isOpen) return null;

  const toggleDept = (dept: BPharmDepartmentId) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? (prev.length > 1 ? prev.filter((d) => d !== dept) : prev) : [...prev, dept]
    );
  };

  const handleFilePick = (file: File | null) => {
    setErrorMsg(null);
    if (!file) return;
    const fmt = detectModelFormatFromName(file.name);
    if (!fmt) {
      setErrorMsg(
        'Unsupported 3D format. Please select a .glb, .gltf, .stl, .obj, or .ply file.'
      );
      return;
    }
    setSelectedFile(file);
    if (!name.trim()) {
      setName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Please provide a model title.');
      return;
    }

    setSubmitting(true);
    try {
      let buffer: ArrayBuffer;
      let format = selectedFile ? detectModelFormatFromName(selectedFile.name) : null;
      let fileName = selectedFile?.name || 'model.glb';
      let byteSize = selectedFile?.size || 0;
      let mimeType = selectedFile?.type || 'model/gltf-binary';

      if (sourceMode === 'file') {
        if (!selectedFile || !format) {
          throw new Error('Select a valid .glb, .gltf, .stl, .obj, or .ply 3D model file.');
        }
        if (selectedFile.size > 45 * 1024 * 1024) {
          throw new Error(
            `File is ${formatBytes(selectedFile.size)}, exceeding the 45 MB IndexedDB storage limit.`
          );
        }
        buffer = await selectedFile.arrayBuffer();
      } else {
        if (!remoteUrl.trim()) {
          throw new Error('Enter a direct HTTPS URL to a .glb, .stl, .obj, or .ply file.');
        }
        const fetched = await fetchRemote3DBinary(remoteUrl.trim());
        buffer = fetched.buffer;
        format = fetched.format;
        fileName = fetched.fileName;
        byteSize = fetched.byteSize;
        mimeType = fetched.mimeType;
      }

      const syllabusLinks: SyllabusAssociation[] = [];
      const subMatch = allSubjects.find((s) => s.subject.code === selectedSubjectCode);
      const topMatch = activeSubjectTopics.find((t) => t.topic.id === selectedTopicId);

      if (
        subMatch ||
        topMatch ||
        initialContext?.structureId ||
        initialContext?.experimentId ||
        manualExperiment.trim()
      ) {
        syllabusLinks.push({
          id: `link_${Date.now()}`,
          course: subMatch?.course || initialContext?.course || 'B.Pharm',
          departmentId: selectedDepts[0] || 'anatomy',
          subjectCode: subMatch?.subject.code || initialContext?.subjectCode,
          subjectTitle: subMatch?.subject.title || initialContext?.subjectTitle,
          unitNo: topMatch?.unitNo || initialContext?.unitNo,
          topicId: topMatch?.topic.id || initialContext?.topicId,
          topicTitle: topMatch?.topic.title || initialContext?.topicTitle,
          subtopicId: initialContext?.subtopicId,
          subtopicTitle: manualSubtopic.trim() || initialContext?.subtopicTitle,
          experimentId: initialContext?.experimentId,
          experimentTitle: manualExperiment.trim() || initialContext?.experimentTitle,
          structureId: initialContext?.structureId,
          structureName: initialContext?.structureName
        });
      }

      const cleanCreator = creator.trim() || 'User Provided';
      const item: Asset3DItem = {
        id: `3d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim(),
        description:
          description.trim() ||
          `Imported ${format.toUpperCase()} 3D scientific asset (${formatBytes(byteSize)}).`,
        format,
        fileName,
        byteSize,
        category,
        departments: selectedDepts,
        syllabusLinks,
        tags: tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        sourceName:
          sourceMode === 'url'
            ? sourceName.trim() || 'Direct 3D URL Import'
            : sourceName.trim() || 'Local File Upload',
        sourceUrl: sourceUrl.trim() || (sourceMode === 'url' ? remoteUrl.trim() : undefined),
        externalFileUrl: sourceMode === 'url' ? remoteUrl.trim() : undefined,
        creator: cleanCreator,
        attribution: attribution.trim() || `${cleanCreator} (${license.trim() || 'Custom'})`,
        license: license.trim() || 'Unspecified',
        usageRestrictions: usageRestrictions.trim(),
        importStatus: sourceMode === 'url' ? 'imported_binary' : 'user_uploaded',
        hasBinaryBlob: true,
        annotations: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const saved = await save3DAssetWithFile(item, buffer, mimeType);
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save 3D asset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Upload or Import 3D Asset"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              PharmaLab 3D Asset Library · Offline IndexedDB Storage
            </p>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Import Scientific 3D Model (.glb, .gltf, .stl, .obj, .ply)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close upload modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Source Switch */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSourceMode('file')}
              className={`min-h-[38px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                sourceMode === 'file'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Local File</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('url')}
              className={`min-h-[38px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                sourceMode === 'url'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Fetch Direct 3D URL</span>
            </button>
          </div>

          {sourceMode === 'file' ? (
            <label className="block p-5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 bg-slate-50 dark:bg-slate-950 text-center cursor-pointer space-y-1.5">
              <Box className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedFile
                  ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
                  : 'Click to choose a .glb, .gltf, .stl, .obj, or .ply file'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                GLB (self-contained binary glTF) is recommended for full textures &amp; multi-part selection. Max 45 MB.
              </p>
              <input
                type="file"
                accept=".glb,.gltf,.stl,.obj,.ply"
                className="hidden"
                onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
              />
            </label>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Direct CORS-Enabled 3D File URL (.glb / .stl / .obj / .ply)
              </label>
              <input
                type="url"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder="https://upload.wikimedia.org/.../model.stl"
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Core Identity & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Model Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Human Heart Anatomy / Tablet Rotary Press"
                className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Scientific Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Asset3DCategory)}
                className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              >
                {ALL_3D_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_3D_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Academic notes, anatomical landmarks, or equipment purpose..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* 12 B.Pharm Departments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              B.Pharm Departments ({selectedDepts.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_BPHARM_DEPARTMENTS.map((dept) => {
                const active = selectedDepts.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {BPHARM_DEPARTMENT_LABELS[dept]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Syllabus & Experiment Association */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Syllabus &amp; Practical Experiment Association
            </p>
            {initialContext?.structureName && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                Pre-linked Structure: {initialContext.structureName}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={selectedSubjectCode}
                onChange={(e) => {
                  setSelectedSubjectCode(e.target.value);
                  setSelectedTopicId('');
                }}
                className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Select B.Pharm Subject (Optional)</option>
                {allSubjects.map((s) => (
                  <option key={s.subject.code} value={s.subject.code}>
                    {s.subject.code} · {s.subject.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={activeSubjectTopics.length === 0}
                className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="">Select Unit &amp; Topic (Optional)</option>
                {activeSubjectTopics.map((entry) => (
                  <option key={entry.topic.id} value={entry.topic.id}>
                    {entry.unitNo} · {entry.topic.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={manualSubtopic}
                onChange={(e) => setManualSubtopic(e.target.value)}
                placeholder="Subtopic (Optional)"
                className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />

              <input
                type="text"
                value={manualExperiment}
                onChange={(e) => setManualExperiment(e.target.value)}
                placeholder="Associated Lab Experiment (Optional)"
                className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Creator, Attribution & License */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder="Creator / Author"
              className="min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="License (e.g. CC BY 4.0 / CC0)"
              className="min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Original Source URL (Optional)"
              className="min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{submitting ? 'Saving 3D Asset...' : 'Save to 3D Asset Library'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
