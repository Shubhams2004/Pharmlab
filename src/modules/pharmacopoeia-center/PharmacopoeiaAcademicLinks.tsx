import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, FlaskConical, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getAllSyllabi } from '../study-mode/studyDb';
import { SyllabusProfile, SyllabusTopicNode } from '../study-mode/types';
import { CURATED_ACADEMIC_LINKS, PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import {
  DEPARTMENT_LABELS,
  PharmacopoeiaAcademicLink,
  PharmacopoeiaDepartmentKey,
  PharmacopoeiaDirectoryEntry
} from './types';

interface PharmacopoeiaAcademicLinksProps {
  entry?: PharmacopoeiaDirectoryEntry;
  userAcademicLinks: PharmacopoeiaAcademicLink[];
  onAddAcademicLink: (link: PharmacopoeiaAcademicLink) => Promise<void>;
  onDeleteAcademicLink: (linkId: string) => Promise<void>;
}

export default function PharmacopoeiaAcademicLinks({
  entry,
  userAcademicLinks,
  onAddAcademicLink,
  onDeleteAcademicLink
}: PharmacopoeiaAcademicLinksProps) {
  const { openStudyMode, navigateToModule } = useLibraryNavigation();

  const [syllabi, setSyllabi] = useState<SyllabusProfile[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<PharmacopoeiaDepartmentKey | 'all'>('all');
  const [adding, setAdding] = useState(false);

  const [formEntryId, setFormEntryId] = useState(entry?.id || 'pc_ip');
  const [formDept, setFormDept] = useState<PharmacopoeiaDepartmentKey>(
    entry?.relevantDepartments[0] || 'pharmaceutical_analysis'
  );
  const [formTopicId, setFormTopicId] = useState('');
  const [formCustomTopic, setFormCustomTopic] = useState('');
  const [formSubjectCode, setFormSubjectCode] = useState('BP102T');
  const [formRationale, setFormRationale] = useState('');

  useEffect(() => {
    if (entry?.id) setFormEntryId(entry.id);
    if (entry?.relevantDepartments[0]) setFormDept(entry.relevantDepartments[0]);
  }, [entry]);

  useEffect(() => {
    let cancelled = false;
    getAllSyllabi()
      .then((loaded) => {
        if (!cancelled) setSyllabi(loaded);
      })
      .catch(() => {
        // ignore if study DB fails
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const syllabusTopics = useMemo<SyllabusTopicNode[]>(() => {
    const all: SyllabusTopicNode[] = [];
    for (const s of syllabi) {
      for (const subj of s.subjects) {
        for (const u of subj.units) {
          for (const t of u.topics) {
            all.push(t);
          }
        }
      }
    }
    return all;
  }, [syllabi]);

  const combinedLinks = useMemo(() => {
    const base = [...userAcademicLinks, ...CURATED_ACADEMIC_LINKS];
    return base.filter((link) => {
      if (entry && link.entryId !== entry.id) return false;
      if (selectedDeptFilter !== 'all' && link.departmentKey !== selectedDeptFilter) return false;
      return true;
    });
  }, [userAcademicLinks, entry, selectedDeptFilter]);

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedTopic = syllabusTopics.find((t) => t.id === formTopicId);
    const topicTitle = matchedTopic?.title || formCustomTopic.trim();
    if (!topicTitle) return;

    await onAddAcademicLink({
      id: `acad_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entryId: entry?.id || formEntryId,
      departmentKey: formDept,
      syllabusId: matchedTopic?.syllabusId,
      subjectCode: matchedTopic?.subjectCode || formSubjectCode.trim() || 'B.Pharm',
      subjectTitle: matchedTopic?.subjectTitle || DEPARTMENT_LABELS[formDept],
      unitTitle: matchedTopic ? `${matchedTopic.unitNo} — ${matchedTopic.unitTitle}` : undefined,
      topicId: matchedTopic?.id,
      topicTitle,
      rationale:
        formRationale.trim() ||
        'User-connected academic syllabus association for pharmacopoeial study.',
      isUserAdded: true,
      createdAt: Date.now()
    });

    setFormTopicId('');
    setFormCustomTopic('');
    setFormRationale('');
    setAdding(false);
  };

  const handleOpenInStudyMode = (link: PharmacopoeiaAcademicLink) => {
    const matchedById = link.topicId
      ? syllabusTopics.find((t) => t.id === link.topicId)
      : syllabusTopics.find(
          (t) =>
            t.subjectCode.toLowerCase().includes(link.subjectCode.split('/')[0].trim().toLowerCase()) ||
            t.title.toLowerCase().includes(link.topicTitle.toLowerCase())
        );

    openStudyMode({
      syllabusId: link.syllabusId || matchedById?.syllabusId || null,
      subjectCode: matchedById?.subjectCode || link.subjectCode.split('/')[0].trim(),
      topicId: matchedById?.id || link.topicId || null
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {entry
                ? `Curriculum & Syllabus Integration (${entry.abbreviation})`
                : 'Academic & Syllabus Integration'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct alignment with PharmaLab Study Mode syllabi, B.Pharm units, and laboratory practicals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value as PharmacopoeiaDepartmentKey | 'all')}
            aria-label="Filter academic links by department"
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Pharmaceutical Subjects</option>
            {(Object.keys(DEPARTMENT_LABELS) as PharmacopoeiaDepartmentKey[]).map((key) => (
              <option key={key} value={key}>
                {DEPARTMENT_LABELS[key]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setAdding((prev) => !prev)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Topic</span>
          </button>
        </div>
      </div>

      {adding && (
        <form
          onSubmit={handleSaveLink}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!entry && (
              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pharmacopoeia / Reference</span>
                <select
                  value={formEntryId}
                  onChange={(e) => setFormEntryId(e.target.value)}
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  {PHARMACOPOEIA_DIRECTORY.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fullName} ({item.abbreviation})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Pharmaceutical Subject</span>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value as PharmacopoeiaDepartmentKey)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                {(Object.keys(DEPARTMENT_LABELS) as PharmacopoeiaDepartmentKey[]).map((key) => (
                  <option key={key} value={key}>
                    {DEPARTMENT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Existing Study Mode Topic (Optional)
              </span>
              <select
                value={formTopicId}
                onChange={(e) => setFormTopicId(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Enter custom topic below</option>
                {syllabusTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.subjectCode} · {t.title}
                  </option>
                ))}
              </select>
            </label>

            {!formTopicId && (
              <>
                <label className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Subject Code</span>
                  <input
                    type="text"
                    value={formSubjectCode}
                    onChange={(e) => setFormSubjectCode(e.target.value)}
                    placeholder="e.g., BP102T, BP201T, QA"
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
                <label className="space-y-1 text-xs sm:col-span-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Syllabus Topic Title</span>
                  <input
                    type="text"
                    required
                    value={formCustomTopic}
                    onChange={(e) => setFormCustomTopic(e.target.value)}
                    placeholder="e.g., Tablet Dissolution Apparatus & Media Specifications"
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
              </>
            )}

            <label className="space-y-1 text-xs sm:col-span-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Academic Context Note</span>
              <input
                type="text"
                value={formRationale}
                onChange={(e) => setFormRationale(e.target.value)}
                placeholder="How this pharmacopoeia connects to lectures, assays, or quality standards..."
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[36px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Save Academic Link
            </button>
          </div>
        </form>
      )}

      {combinedLinks.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          No academic topic links match the current filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
          {combinedLinks.map((link) => {
            const linkedEntry = PHARMACOPOEIA_DIRECTORY.find((e) => e.id === link.entryId);
            return (
              <div
                key={link.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {linkedEntry && (
                      <>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {linkedEntry.abbreviation}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {DEPARTMENT_LABELS[link.departmentKey]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{link.subjectCode}</span>
                    {link.unitTitle && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{link.unitTitle}</span>
                      </>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white">{link.topicTitle}</p>
                  {link.subtopicTitle && (
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Subtopic: {link.subtopicTitle}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {link.rationale}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenInStudyMode(link)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Open in Study Mode</span>
                  </button>

                  {link.experimentModuleId && (
                    <button
                      type="button"
                      onClick={() => navigateToModule(link.experimentModuleId!)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Open Practical</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {link.isUserAdded && (
                    <button
                      type="button"
                      onClick={() => onDeleteAcademicLink(link.id)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label="Remove academic link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
