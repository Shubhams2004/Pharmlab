import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  RefreshCcw,
  RotateCcw,
  XCircle
} from 'lucide-react';
import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import { ANATOMY_CATEGORIES } from '../../data/academicEngineRegistry';
import { resolveAcademicContextForVisual } from '../visual-library/academicRegistry';
import { InteractiveAnnotation } from '../visual-library/academicTypes';
import { VisualMediaItem } from '../visual-library/types';
import { getAllVisuals, resolveVisualImageSrc } from '../visual-library/visualDb';
import { AnatomicalCategoryId, AnatomicalStructureEntity, AnatomyPracticeStats } from '../../types/academicEngine';
import {
  getAnatomyPracticeStats,
  getCategoryLabel,
  getStructuresByCategory,
  recordAnatomyPracticeAttempt,
  resetAnatomyPracticeStats
} from '../../utils/academicEngineUtils';

type PracticeMode = 'concept' | 'visual_pin';

interface AnatomyIdentificationPracticeProps {
  initialCategory?: AnatomicalCategoryId | 'all';
  onOpenStructureDetail?: (structureId: string) => void;
}

interface PracticeQuestion {
  id: string;
  mode: PracticeMode;
  categoryKey: string;
  categoryLabel: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceLabel: string;
  structureId?: string;
  visual?: VisualMediaItem;
  targetAnnotation?: InteractiveAnnotation;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildVisualPinQuestion(
  plates: Array<{ visual: VisualMediaItem; annotations: InteractiveAnnotation[]; categoryKey: string }>
): PracticeQuestion | null {
  if (plates.length === 0) return null;
  const plate = plates[Math.floor(Math.random() * plates.length)];
  if (plate.annotations.length < 2) return null;

  const target = plate.annotations[Math.floor(Math.random() * plate.annotations.length)];
  const distractors = shuffleArray(
    plate.annotations.filter((a) => a.id !== target.id)
  )
    .slice(0, 3)
    .map((a) => a.label);

  const rawOptions = shuffleArray([target.label, ...distractors]);
  const correctIndex = rawOptions.indexOf(target.label);

  return {
    id: `vpin_${plate.visual.id}_${target.id}_${Date.now()}`,
    mode: 'visual_pin',
    categoryKey: plate.categoryKey,
    categoryLabel:
      plate.categoryKey === 'all'
        ? 'Verified Visual Plate'
        : getCategoryLabel(plate.categoryKey as AnatomicalCategoryId),
    prompt: `Identify the highlighted anatomical structure (?) on "${plate.visual.title}".`,
    options: rawOptions,
    correctIndex,
    explanation: `${target.label}: ${target.definition} Role: ${target.functionRole}`,
    sourceLabel: target.sourceNote || plate.visual.sourceName,
    visual: plate.visual,
    targetAnnotation: target
  };
}

function buildConceptQuestion(
  categoryFilter: AnatomicalCategoryId | 'all',
  excludeStructureId?: string
): PracticeQuestion | null {
  const pool = getStructuresByCategory(categoryFilter);
  if (pool.length < 2) return null;

  const candidates = pool.filter((s) => s.id !== excludeStructureId);
  const target: AnatomicalStructureEntity =
    (candidates.length > 0 ? candidates : pool)[
      Math.floor(Math.random() * (candidates.length > 0 ? candidates.length : pool.length))
    ];

  // Pick a verified non-empty prompt clue without revealing the structure's exact name
  const clueCandidates: string[] = [];
  if (target.definition) clueCandidates.push(target.definition);
  if (target.overview) clueCandidates.push(target.overview);
  if (target.anatomicalLocation) clueCandidates.push(`Location: ${target.anatomicalLocation}`);
  if (target.functions && target.functions.length > 0) {
    clueCandidates.push(`Primary Function: ${target.functions[0]}`);
  }

  const rawClue = clueCandidates[0] || target.searchKeywords.join(', ');
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const genericWords = new Set([
    'right',
    'left',
    'tissue',
    'tissues',
    'gland',
    'glands',
    'system',
    'tract',
    'organ',
    'organs',
    'muscle',
    'cavity',
    'valves',
    'valve',
    'nodes',
    'node',
    'marrow'
  ]);
  const tokensToMask = new Set<string>();
  const cleanName = target.name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (cleanName.length >= 4) tokensToMask.add(cleanName);
  for (const alt of target.alternateNames) {
    if (alt.trim().length >= 4) tokensToMask.add(alt.trim());
  }
  for (const token of cleanName.split(/[\s,/()-]+/)) {
    const cleanTok = token.trim();
    if (cleanTok.length >= 4 && !genericWords.has(cleanTok.toLowerCase())) {
      tokensToMask.add(cleanTok);
    }
  }
  if (target.scientificName) {
    for (const token of target.scientificName.split(/[\s,/()-]+/)) {
      const cleanTok = token.trim();
      if (cleanTok.length >= 5 && !genericWords.has(cleanTok.toLowerCase())) {
        tokensToMask.add(cleanTok);
      }
    }
  }

  let maskedClue = rawClue;
  const sortedTokens = Array.from(tokensToMask).sort((a, b) => b.length - a.length);
  for (const tok of sortedTokens) {
    maskedClue = maskedClue.replace(new RegExp(`\\b${escapeRegex(tok)}\\b`, 'gi'), '[this structure]');
  }

  // Prefer distractors from same category when possible, falling back to full 60-catalog
  const distractorPool = pool.length >= 4 ? pool : ANATOMY_CATALOG;
  const distractors = shuffleArray(distractorPool.filter((s) => s.id !== target.id))
    .slice(0, 3)
    .map((s) => s.name);

  const options = shuffleArray([target.name, ...distractors]);
  const correctIndex = options.indexOf(target.name);

  return {
    id: `concept_${target.id}_${Date.now()}`,
    mode: 'concept',
    categoryKey: target.primaryCategory,
    categoryLabel: getCategoryLabel(target.primaryCategory),
    prompt: `Which anatomical structure matches this curriculum description?\n“${maskedClue}”`,
    options,
    correctIndex,
    explanation: `#${target.catalogNumber} ${target.name}${target.scientificName ? ` (${target.scientificName})` : ''}: ${target.overview || target.definition || ''}`,
    sourceLabel: `Catalog #${target.catalogNumber} · ${getCategoryLabel(target.primaryCategory)}`,
    structureId: target.id
  };
}

export default function AnatomyIdentificationPractice({
  initialCategory = 'all',
  onOpenStructureDetail
}: AnatomyIdentificationPracticeProps) {
  const [mode, setMode] = useState<PracticeMode>('concept');
  const [categoryFilter, setCategoryFilter] = useState<AnatomicalCategoryId | 'all'>(initialCategory);
  const [visuals, setVisuals] = useState<VisualMediaItem[]>([]);
  const [visualSrc, setVisualSrc] = useState<string | null>(null);

  const [stats, setStats] = useState<AnatomyPracticeStats>(() => getAnatomyPracticeStats());
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    let cancelled = false;
    getAllVisuals()
      .then((loaded) => {
        if (!cancelled) setVisuals(loaded);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Verified calibrated visual plates (strictly >= 2 verified anatomical pins; never unlabeled plates)
  const verifiedPlates = useMemo(() => {
    const list: Array<{
      visual: VisualMediaItem;
      annotations: InteractiveAnnotation[];
      categoryKey: string;
    }> = [];

    for (const visual of visuals) {
      if (visual.academicDomain !== 'anatomy' && visual.category !== 'anatomy') continue;
      const ctx = resolveAcademicContextForVisual(visual);
      if (ctx.annotations.length < 2) continue;
      let catKey = 'all';
      if (visual.id === 'builtin_heart_anatomy') catKey = 'cardiovascular';
      else if (visual.id === 'builtin_nephron_anatomy') catKey = 'urinary';
      else if (visual.id === 'builtin_eukaryotic_cell') catKey = 'all';

      if (categoryFilter === 'all' || categoryFilter === catKey) {
        list.push({ visual, annotations: ctx.annotations, categoryKey: catKey });
      }
    }
    return list;
  }, [visuals, categoryFilter]);

  const generateNext = (nextMode: PracticeMode, nextCategory: AnatomicalCategoryId | 'all') => {
    setSelectedOption(null);
    if (nextMode === 'visual_pin') {
      const platesForCat = verifiedPlates.filter(
        (p) => nextCategory === 'all' || p.categoryKey === nextCategory
      );
      setQuestion(buildVisualPinQuestion(platesForCat));
    } else {
      setQuestion(buildConceptQuestion(nextCategory, question?.structureId));
    }
  };

  useEffect(() => {
    generateNext(mode, categoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, categoryFilter, visuals.length]);

  useEffect(() => {
    let cancelled = false;
    if (!question?.visual) {
      setVisualSrc(null);
      return;
    }
    resolveVisualImageSrc(question.visual)
      .then((src) => {
        if (!cancelled) setVisualSrc(src);
      })
      .catch(() => {
        if (!cancelled) setVisualSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [question?.visual]);

  const handleChooseOption = (idx: number) => {
    if (selectedOption !== null || !question) return;
    setSelectedOption(idx);
    const isCorrect = idx === question.correctIndex;
    setSessionCount((c) => c + 1);
    if (isCorrect) setSessionCorrect((c) => c + 1);
    const updated = recordAnatomyPracticeAttempt(
      question.categoryKey,
      isCorrect,
      question.structureId || question.targetAnnotation?.id
    );
    setStats(updated);
  };

  const handleResetSession = () => {
    setSessionCount(0);
    setSessionCorrect(0);
    generateNext(mode, categoryFilter);
  };

  const handleResetAllStats = () => {
    setStats(resetAnatomyPracticeStats());
    setSessionCount(0);
    setSessionCorrect(0);
  };

  const accuracyPct =
    stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Mode & Category Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Anatomy Identification Practice</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Practice identifying anatomical structures across the 60-entry catalog or calibrated visual plates. Progress saves locally.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode('concept')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
                mode === 'concept'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Structure &amp; Function</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('visual_pin')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
                mode === 'visual_pin'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Visual Pin Quiz</span>
            </button>
          </div>
        </div>

        {/* Category Filter + Local Score Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <label htmlFor="practice-category-select" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              System Focus:
            </label>
            <select
              id="practice-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AnatomicalCategoryId | 'all')}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Anatomical Systems (60)</option>
              {ANATOMY_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm tabular-nums">
            <span className="text-slate-600 dark:text-slate-400">
              Session:{' '}
              <strong className="text-slate-900 dark:text-white">
                {sessionCorrect}/{sessionCount}
              </strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Saved Total:{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {stats.totalCorrect}/{stats.totalAttempts}
              </strong>
              {stats.totalAttempts > 0 ? ` (${accuracyPct}%)` : ''}
            </span>
            <button
              type="button"
              onClick={handleResetSession}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Restart Session</span>
            </button>
            {stats.totalAttempts > 0 && (
              <button
                type="button"
                onClick={handleResetAllStats}
                className="text-xs font-semibold text-slate-500 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Stats</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Card */}
      {question ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {question.mode === 'visual_pin' ? 'Calibrated Visual Pin Quiz' : 'Catalog Concept Identification'} · {question.categoryLabel}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">{question.sourceLabel}</span>
          </div>

          {question.mode === 'visual_pin' && question.visual && question.targetAnnotation && (
            <div className="relative mx-auto max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden">
              {visualSrc ? (
                <div className="relative w-full">
                  <img
                    src={visualSrc}
                    alt={question.visual.title}
                    className="w-full h-auto block select-none"
                  />
                  {/* Target pin marker — reveals label only after answer */}
                  <div
                    style={{
                      left: `${question.targetAnnotation.xPercent}%`,
                      top: `${question.targetAnnotation.yPercent}%`
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm shadow-lg ring-4 ${
                        selectedOption === null
                          ? 'bg-amber-500 text-slate-950 ring-amber-400/50'
                          : 'bg-emerald-500 text-slate-950 ring-emerald-400/50'
                      }`}
                    >
                      {selectedOption === null ? (
                        <HelpCircle className="w-5 h-5" />
                      ) : (
                        question.targetAnnotation.shortCode || '✓'
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading visual plate...
                </div>
              )}
            </div>
          )}

          <p className="text-base font-semibold text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
            {question.prompt}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((opt, idx) => {
              const answered = selectedOption !== null;
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;

              let btnStyle =
                'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500/60';
              if (answered) {
                if (isCorrect) {
                  btnStyle =
                    'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                } else if (isSelected) {
                  btnStyle =
                    'bg-rose-50 dark:bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-200';
                } else {
                  btnStyle =
                    'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500';
                }
              }

              return (
                <button
                  key={`${question.id}_${idx}`}
                  type="button"
                  disabled={answered}
                  onClick={() => handleChooseOption(idx)}
                  className={`min-h-[48px] px-4 py-3 rounded-xl border text-left text-sm font-medium flex items-center justify-between gap-3 transition-colors ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {answered && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {answered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedOption === question.correctIndex
                  ? 'Correct Identification'
                  : `Incorrect — Correct Answer: ${question.options[question.correctIndex]}`}
              </p>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {question.explanation}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {question.structureId && onOpenStructureDetail ? (
                  <button
                    type="button"
                    onClick={() => onOpenStructureDetail(question.structureId!)}
                    className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Structure Reference Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => generateNext(mode, categoryFilter)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Calibrated Visual Plate for "{categoryFilter === 'all' ? 'All Systems' : getCategoryLabel(categoryFilter)}"
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Visual pin quizzes are restricted exclusively to anatomical diagrams with verified coordinate pins (currently Cardiovascular Heart, Urinary Nephron, and Cellular Ultrastructure—plus any custom diagram you annotate in the Visual Library).
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold"
            >
              Quiz All Calibrated Plates
            </button>
            <button
              type="button"
              onClick={() => setMode('concept')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Switch to Structure &amp; Function Quiz
            </button>
          </div>
        </div>
      )}

      {/* Local Category Accuracy Breakdown (when real attempts exist) */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Saved Local Accuracy by System
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.entries(stats.byCategory).map(([catKey, stat]) => {
              const pct = stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0;
              return (
                <div
                  key={catKey}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {getCategoryLabel(catKey as AnatomicalCategoryId)}
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                    {stat.correct}/{stat.attempts} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
