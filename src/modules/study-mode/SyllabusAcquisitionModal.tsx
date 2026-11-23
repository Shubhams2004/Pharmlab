import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Search,
  Upload,
  X
} from 'lucide-react';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { saveSyllabusProfile } from './studyDb';
import {
  extractTextFromPdfFile,
  fetchWikiversityPreviewText,
  OFFICIAL_SYLLABUS_PORTALS,
  parseSyllabusTextToProfile,
  searchSyllabiOnline
} from './syllabusParser';
import {
  OnlineSyllabusCandidate,
  SyllabusProfile,
  SyllabusVerificationStatus
} from './types';

interface SyllabusAcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (profile: SyllabusProfile) => void;
}

const UNIVERSITY_OPTIONS = [
  'Pharmacy Council of India (PCI)',
  'Savitribai Phule Pune University (SPPU)',
  'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
  'Rajiv Gandhi University of Health Sciences (RGUHS)',
  'Gujarat Technological University (GTU)',
  'Mumbai University',
  'Custom / Other University'
];

const VERIFICATION_LABELS: Record<SyllabusVerificationStatus, string> = {
  official_syllabus: 'Official Syllabus (PCI / Statutory)',
  university_specific: 'University-Specific Syllabus',
  imported_syllabus: 'Imported Syllabus Document',
  unverified_syllabus: 'Unverified / Community Draft'
};

export default function SyllabusAcquisitionModal({
  isOpen,
  onClose,
  onImported
}: SyllabusAcquisitionModalProps) {
  const [course, setCourse] = useState('B.Pharm');
  const [degree, setDegree] = useState('Bachelor of Pharmacy');
  const [semester, setSemester] = useState('Semester I');
  const [universityChoice, setUniversityChoice] = useState('Pharmacy Council of India (PCI)');
  const [customUniversity, setCustomUniversity] = useState('');
  const [subjectHint, setSubjectHint] = useState('');
  const [verificationStatus, setVerificationStatus] =
    useState<SyllabusVerificationStatus>('university_specific');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const [tab, setTab] = useState<'online' | 'manual'>('online');
  const [searching, setSearching] = useState(false);
  const [searchWarnings, setSearchWarnings] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<OnlineSyllabusCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState<string | null>(null);

  const [rawText, setRawText] = useState('');
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const [previewProfile, setPreviewProfile] = useState<SyllabusProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveUniversity =
    universityChoice === 'Custom / Other University'
      ? customUniversity.trim() || 'Custom University'
      : universityChoice;

  const handleOnlineSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setErrorMsg(null);
    setSearchWarnings([]);
    try {
      const res = await searchSyllabiOnline({
        course,
        semester,
        university: effectiveUniversity,
        subjectHint
      });
      setCandidates(res.candidates);
      setSearchWarnings(res.warnings);
      setHasSearched(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Online syllabus search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleLoadWikiversityCandidate = async (cand: OnlineSyllabusCandidate) => {
    setLoadingExtract(cand.id);
    setErrorMsg(null);
    try {
      const text = await fetchWikiversityPreviewText(cand.title);
      if (!text) {
        setErrorMsg('This Wikiversity page returned empty text. Open its link directly or import a PDF.');
        return;
      }
      setRawText(text);
      setSourceName(cand.sourceName);
      setSourceUrl(cand.sourceUrl);
      setVerificationStatus(cand.verificationHint);
      const parsed = parseSyllabusTextToProfile(text, {
        course,
        degree,
        semester,
        university: effectiveUniversity,
        title: `${cand.title} (${course} ${semester})`,
        verificationStatus: cand.verificationHint,
        sourceName: cand.sourceName,
        sourceUrl: cand.sourceUrl
      });
      setPreviewProfile(parsed);
      setTab('manual');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch Wikiversity preview.');
    } finally {
      setLoadingExtract(null);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractingPdf(true);
    setErrorMsg(null);
    setPdfNotice(null);
    try {
      const { text, pageCount } = await extractTextFromPdfFile(file);
      if (!text.trim()) {
        setErrorMsg(
          'No extractable text layer found in this PDF (scanned image PDFs cannot be parsed without OCR). Paste syllabus text manually below.'
        );
        return;
      }
      setRawText(text);
      setSourceName((prev) => prev || file.name);
      setPdfNotice(`Extracted text from ${pageCount} PDF page${pageCount === 1 ? '' : 's'} (${file.name}).`);
      const parsed = parseSyllabusTextToProfile(text, {
        course,
        degree,
        semester,
        university: effectiveUniversity,
        verificationStatus,
        sourceName: sourceName.trim() || file.name,
        sourceUrl: sourceUrl.trim() || undefined
      });
      setPreviewProfile(parsed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to read syllabus PDF.');
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleBuildPreview = () => {
    setErrorMsg(null);
    if (!rawText.trim()) {
      setErrorMsg('Upload a syllabus PDF or paste syllabus text first to preview the extracted hierarchy.');
      return;
    }
    const parsed = parseSyllabusTextToProfile(rawText, {
      course,
      degree,
      semester,
      university: effectiveUniversity,
      verificationStatus,
      sourceName: sourceName.trim() || 'User-Imported Syllabus Document',
      sourceUrl: sourceUrl.trim() || undefined
    });
    setPreviewProfile(parsed);
  };

  const handleConfirmImport = async () => {
    if (!previewProfile) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const saved = await saveSyllabusProfile(previewProfile);
      onImported(saved);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save imported syllabus.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Acquire and import syllabus"
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Acquire &amp; Map Curriculum Syllabus
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search open curriculum indexes, access official PCI/university portals, or preview and map any syllabus PDF into Course → Subject → Unit → Topic → Subtopic.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close syllabus acquisition dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Curriculum Context Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              >
                <option value="B.Pharm">B.Pharm</option>
                <option value="D.Pharm">D.Pharm</option>
                <option value="Pharm.D">Pharm.D</option>
                <option value="M.Pharm">M.Pharm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Degree
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester / Year
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              >
                {[
                  'Semester I',
                  'Semester II',
                  'Semester III',
                  'Semester IV',
                  'Semester V',
                  'Semester VI',
                  'Semester VII',
                  'Semester VIII'
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                University / Body
              </label>
              <select
                value={universityChoice}
                onChange={(e) => setUniversityChoice(e.target.value)}
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              >
                {UNIVERSITY_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {universityChoice === 'Custom / Other University' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom University Name
              </label>
              <input
                type="text"
                value={customUniversity}
                onChange={(e) => setCustomUniversity(e.target.value)}
                placeholder="e.g. Maharashtra University of Health Sciences (MUHS)"
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setTab('online')}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                tab === 'online'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>1. Online Syllabus Discovery &amp; Portals</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                tab === 'manual'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>2. Import PDF / Paste &amp; Preview</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'online' ? (
            <div className="space-y-5">
              <form onSubmit={handleOnlineSearch} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={subjectHint}
                  onChange={(e) => setSubjectHint(e.target.value)}
                  placeholder="Optional subject keyword (e.g. Pharmacology, Anatomy, PCI syllabus)..."
                  className="flex-1 min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search Online Indexes</span>
                </button>
              </form>

              {searchWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  {searchWarnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              )}

              {hasSearched && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Open-Index Curriculum Results ({candidates.length})
                  </p>
                  {candidates.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      No live results returned for that query. Use an Official University Portal below to download the PDF and import it in Tab 2.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      {candidates.map((cand) => {
                        const safeUrl = sanitizeHttpUrl(cand.sourceUrl);
                        return (
                          <div
                            key={cand.id}
                            className="p-3.5 bg-slate-50/70 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {cand.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {cand.sourceName} · {cand.publisherOrUniversity}
                                {cand.year ? ` · ${cand.year}` : ''} · {cand.licenseInfo}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                {cand.summary}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {cand.corsReadablePreview && (
                                <button
                                  type="button"
                                  onClick={() => handleLoadWikiversityCandidate(cand)}
                                  disabled={loadingExtract === cand.id}
                                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                                >
                                  {loadingExtract === cand.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                  )}
                                  <span>Preview &amp; Map</span>
                                </button>
                              )}
                              {safeUrl && (
                                <a
                                  href={safeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open Source</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Official University & PCI Portals */}
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Official Pharmacy Council &amp; University Syllabus Portals
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    External university websites do not allow automated browser scraping due to browser CORS policy. Open your official portal to download the syllabus PDF, then switch to Tab 2 to preview and map it.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {OFFICIAL_SYLLABUS_PORTALS.map((portal) => (
                    <a
                      key={portal.name}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors block space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {portal.name}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {portal.note}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Verification Classification
                  </label>
                  <select
                    value={verificationStatus}
                    onChange={(e) =>
                      setVerificationStatus(e.target.value as SyllabusVerificationStatus)
                    }
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs sm:text-sm text-slate-900 dark:text-white"
                  >
                    {(Object.keys(VERIFICATION_LABELS) as SyllabusVerificationStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {VERIFICATION_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Source Document Name
                  </label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g. SPPU 2024 Pattern B.Pharm PDF"
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Source URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer inline-flex items-center gap-2 transition-colors">
                  {extractingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span>{extractingPdf ? 'Extracting PDF Text...' : 'Upload Syllabus PDF'}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleBuildPreview}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Preview Extracted Structure</span>
                </button>
              </div>

              {pdfNotice && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {pdfNotice}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus Text (auto-populated from PDF or paste verbatim text)
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder="Paste syllabus text containing Course Codes (e.g., BP201T - Human Anatomy and Physiology II), Unit I / Unit II headings, and topics..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Interactive Preview Before Importing */}
              {previewProfile && (
                <div className="border border-emerald-500/40 bg-emerald-500/5 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Preview Before Importing · {VERIFICATION_LABELS[previewProfile.verificationStatus]}
                      </p>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {previewProfile.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {previewProfile.course} · {previewProfile.semester} · {previewProfile.university} ·{' '}
                        {previewProfile.subjects.length} subject(s) detected
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={saving}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Import into Study Mode</span>
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {previewProfile.subjects.map((subj) => (
                      <div
                        key={subj.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {subj.code} — {subj.title}
                        </p>
                        <div className="space-y-1 pl-2">
                          {subj.units.map((u) => (
                            <div key={u.id} className="text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {u.unitNo}: {u.title}
                              </span>
                              <span className="text-slate-400"> · </span>
                              <span>
                                {u.topics.length} topic(s),{' '}
                                {u.topics.reduce((n, t) => n + t.subtopics.length, 0)} subtopic(s)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            Official B.Pharm Semester I (PCI) remains intact alongside any university-specific syllabus you import.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
