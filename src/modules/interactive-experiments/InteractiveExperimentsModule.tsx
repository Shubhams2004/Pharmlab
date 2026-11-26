import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  Compass,
  FastForward,
  FlaskConical,
  GraduationCap,
  Info,
  Microscope,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Save,
  Scale,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  StepForward,
  Table2,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { formatRelativeTime } from '../../utils/studyWorkspace';
import Experiment3DStage from './Experiment3DStage';
import { INTERACTIVE_EXPERIMENTS, getExperimentById } from './experiments';
import {
  deleteExperimentRun,
  getAllSavedRuns,
  getRunsForExperiment,
  saveExperimentRun,
  updateExperimentRun
} from './experimentDb';
import LabNotebookPanel from './LabNotebookPanel';
import ProcessVisualizer from './ProcessVisualizer';
import SimulationChart from './SimulationChart';
import SimulationDataTable from './SimulationDataTable';
import {
  advanceSimulationStep,
  formatMetricValue,
  formatParameterReadout,
  initializeSimulation,
  runSimulationToCompletion
} from './simulationRunner';
import {
  EXPERIMENT_DEPARTMENT_LABELS,
  ExperimentDepartmentId,
  ExperimentWorkflowStageId,
  FIDELITY_LABELS,
  ParameterValue,
  SavedExperimentRun,
  SimulationSnapshot
} from './types';

export interface InteractiveExperimentsJumpTarget {
  experimentId?: string | null;
  stage?: ExperimentWorkflowStageId | null;
  department?: ExperimentDepartmentId | null;
  nonce: number;
}

interface InteractiveExperimentsModuleProps {
  jumpTarget?: InteractiveExperimentsJumpTarget;
}

const WORKFLOW_STAGES: Array<{
  id: ExperimentWorkflowStageId;
  label: string;
  shortLabel: string;
}> = [
  { id: 'intro', label: '1. Intro & Principle', shortLabel: 'Intro' },
  { id: 'apparatus', label: '2. Apparatus & 3D', shortLabel: 'Apparatus & 3D' },
  { id: 'simulate', label: '3. Interactive Simulation', shortLabel: 'Simulate' },
  { id: 'observe', label: '4. Data & Observations', shortLabel: 'Observe & Data' },
  { id: 'compare', label: '5. Compare Runs', shortLabel: 'Compare' },
  { id: 'conclusion', label: '6. Fidelity & Conclusion', shortLabel: 'Conclusion' }
];

export default function InteractiveExperimentsModule({
  jumpTarget
}: InteractiveExperimentsModuleProps) {
  const {
    setWorkspaceSection,
    recordActivity,
    navigateToModule,
    openStudyMode
  } = useLibraryNavigation();

  const [selectedExpId, setSelectedExpId] = useState<string | null>(
    jumpTarget?.experimentId || null
  );
  const [stage, setStage] = useState<ExperimentWorkflowStageId>(
    jumpTarget?.stage || 'simulate'
  );
  const [deptFilter, setDeptFilter] = useState<ExperimentDepartmentId | 'all'>(
    jumpTarget?.department || 'all'
  );
  const [catalogSearch, setCatalogSearch] = useState('');

  // Run counts across all experiments for catalog overview
  const [allRuns, setAllRuns] = useState<SavedExperimentRun[]>([]);
  const [experimentRuns, setExperimentRuns] = useState<SavedExperimentRun[]>([]);

  const activeExperiment = useMemo(
    () => getExperimentById(selectedExpId),
    [selectedExpId]
  );

  const [params, setParams] = useState<Record<string, ParameterValue>>(() => {
    const first = getExperimentById(jumpTarget?.experimentId) || INTERACTIVE_EXPERIMENTS[0];
    return initializeSimulation(first).params;
  });
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => {
    const first = getExperimentById(jumpTarget?.experimentId) || INTERACTIVE_EXPERIMENTS[0];
    return initializeSimulation(first).snapshot;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [hiddenSeriesIds, setHiddenSeriesIds] = useState<string[]>([]);
  const [showInline3DInSim, setShowInline3DInSim] = useState(false);
  const [linkedAssetIds, setLinkedAssetIds] = useState<string[]>([]);
  const [observationsDraft, setObservationsDraft] = useState('');
  const [conclusionDraft, setConclusionDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [quickSaveNotice, setQuickSaveNotice] = useState<string | null>(null);

  const refreshAllRuns = useCallback(async () => {
    const runs = await getAllSavedRuns();
    setAllRuns(runs);
  }, []);

  const refreshExperimentRuns = useCallback(async (expId: string) => {
    const runs = await getRunsForExperiment(expId);
    setExperimentRuns(runs);
  }, []);

  useEffect(() => {
    void refreshAllRuns();
  }, [refreshAllRuns]);

  // Handle external navigation jumps
  useEffect(() => {
    if (!jumpTarget) return;
    if (jumpTarget.department) setDeptFilter(jumpTarget.department);
    if (jumpTarget.experimentId) {
      const targetExp = getExperimentById(jumpTarget.experimentId);
      if (targetExp) {
        setSelectedExpId(targetExp.id);
        setStage(jumpTarget.stage || 'simulate');
      }
    }
  }, [jumpTarget]);

  // Reinitialize state whenever active experiment changes
  useEffect(() => {
    setIsPlaying(false);
    setHiddenSeriesIds([]);
    setQuickSaveNotice(null);
    if (!activeExperiment) {
      setWorkspaceSection('Interactive Simulations', null);
      return;
    }

    const init = initializeSimulation(activeExperiment);
    setParams(init.params);
    setSnapshot(init.snapshot);
    setSpeedMultiplier(activeExperiment.simulation.defaultSpeed || 1);
    setObservationsDraft('');
    setConclusionDraft('');
    setNotesDraft('');
    setShowInline3DInSim(activeExperiment.requires3D);
    void refreshExperimentRuns(activeExperiment.id);

    setWorkspaceSection(activeExperiment.shortTitle, activeExperiment.code);
    recordActivity({
      key: `sim:${activeExperiment.id}`,
      kind: 'experiment',
      title: activeExperiment.shortTitle,
      subtitle: `${activeExperiment.code} · Interactive Simulation`,
      moduleId: 'interactive_experiments'
    });
  }, [activeExperiment, refreshExperimentRuns, recordActivity, setWorkspaceSection]);

  useEffect(() => {
    return () => setWorkspaceSection(null);
  }, [setWorkspaceSection]);

  // Continuous playback loop
  useEffect(() => {
    if (!isPlaying || !activeExperiment) return;
    if (snapshot.completed) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.max(45, Math.round(160 / speedMultiplier));
    const timer = window.setInterval(() => {
      setSnapshot((prev) => {
        if (prev.completed) {
          setIsPlaying(false);
          return prev;
        }
        return advanceSimulationStep(activeExperiment, prev, params, 1);
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, activeExperiment, params, speedMultiplier, snapshot.completed]);

  const handleOpenExperiment = (expId: string, initialStage: ExperimentWorkflowStageId = 'simulate') => {
    setSelectedExpId(expId);
    setStage(initialStage);
  };

  const handleParamChange = (key: string, nextValue: ParameterValue) => {
    if (!activeExperiment) return;
    setIsPlaying(false);
    const updatedRaw = { ...params, [key]: nextValue };
    const init = initializeSimulation(activeExperiment, updatedRaw);
    setParams(init.params);
    setSnapshot(init.snapshot);
    setQuickSaveNotice(null);
  };

  const handleApplyPreset = (presetParams: Record<string, ParameterValue>) => {
    if (!activeExperiment) return;
    setIsPlaying(false);
    const init = initializeSimulation(activeExperiment, presetParams);
    setParams(init.params);
    setSnapshot(init.snapshot);
    setQuickSaveNotice(null);
  };

  const handleReset = () => {
    if (!activeExperiment) return;
    setIsPlaying(false);
    const init = initializeSimulation(activeExperiment, params);
    setSnapshot(init.snapshot);
    setQuickSaveNotice(null);
  };

  const handleStep = (count = 1) => {
    if (!activeExperiment) return;
    setIsPlaying(false);
    setSnapshot((prev) => advanceSimulationStep(activeExperiment, prev, params, count));
  };

  const handleFastForward = () => {
    if (!activeExperiment) return;
    setIsPlaying(false);
    const completed = runSimulationToCompletion(activeExperiment, params);
    setParams(completed.params);
    setSnapshot(completed.snapshot);
  };

  const handleSaveRun = async (runLabel?: string) => {
    if (!activeExperiment) return;
    const label =
      runLabel?.trim() ||
      `${activeExperiment.shortTitle} · Run #${experimentRuns.length + 1}`;
    const newRun: SavedExperimentRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      experimentId: activeExperiment.id,
      experimentTitle: activeExperiment.title,
      runLabel: label,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parameters: { ...params },
      finalSimTime: snapshot.simTime,
      timeUnit: snapshot.timeUnit,
      metrics: { ...snapshot.metrics },
      seriesHistory: { ...snapshot.seriesHistory },
      observations: observationsDraft,
      conclusion: conclusionDraft,
      notes: notesDraft,
      linkedAssetIds,
      pinnedForCompare: experimentRuns.length < 3
    };
    await saveExperimentRun(newRun);
    await Promise.all([refreshExperimentRuns(activeExperiment.id), refreshAllRuns()]);
    setQuickSaveNotice(`Saved "${label}"`);
  };

  const handleToggleCompareRun = async (runId: string) => {
    if (!activeExperiment) return;
    const target = experimentRuns.find((r) => r.id === runId);
    if (!target) return;
    await updateExperimentRun(runId, { pinnedForCompare: !target.pinnedForCompare });
    await refreshExperimentRuns(activeExperiment.id);
  };

  const handleLoadRunParams = (run: SavedExperimentRun) => {
    if (!activeExperiment) return;
    setIsPlaying(false);
    const init = initializeSimulation(activeExperiment, run.parameters);
    setParams(init.params);
    setSnapshot(init.snapshot);
    setObservationsDraft(run.observations || '');
    setConclusionDraft(run.conclusion || '');
    setNotesDraft(run.notes || '');
    setStage('simulate');
  };

  const handleDeleteRun = async (runId: string) => {
    if (!activeExperiment) return;
    await deleteExperimentRun(runId);
    await Promise.all([refreshExperimentRuns(activeExperiment.id), refreshAllRuns()]);
  };

  const runCountsByExp = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of allRuns) {
      map[r.experimentId] = (map[r.experimentId] || 0) + 1;
    }
    return map;
  }, [allRuns]);

  const filteredExperiments = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return INTERACTIVE_EXPERIMENTS.filter((exp) => {
      const matchesDept = deptFilter === 'all' || exp.department === deptFilter;
      if (!matchesDept) return false;
      if (!q) return true;
      const hay = `${exp.code} ${exp.title} ${exp.description} ${exp.academicContext.subjectCode} ${exp.academicContext.topic} ${EXPERIMENT_DEPARTMENT_LABELS[exp.department]}`.toLowerCase();
      return hay.includes(q);
    });
  }, [deptFilter, catalogSearch]);

  // Parameter groups for the active experiment
  const parameterGroups = useMemo(() => {
    if (!activeExperiment) return [];
    const groups = new Map<string, typeof activeExperiment.parameters>();
    for (const spec of activeExperiment.parameters) {
      if (spec.visibleWhen && !spec.visibleWhen(params)) continue;
      const list = groups.get(spec.group) || [];
      list.push(spec);
      groups.set(spec.group, list);
    }
    return Array.from(groups.entries());
  }, [activeExperiment, params]);

  // =========================================================================
  // VIEW 1: EXPERIMENT HUB CATALOG
  // =========================================================================
  if (!activeExperiment) {
    return (
      <div className="space-y-6 pb-12">
        <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                P3.7 Universal Interactive Experiments &amp; Simulation Engine
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Interactive Scientific Simulations &amp; Virtual Lab Bench
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Explore quantitative pharmaceutical models with real equations, configurable parameters, 3D apparatus integration, live curves, CSV/JSON exports, and multi-run lab notebook comparisons.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0 text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3">
                <p className="text-slate-500 dark:text-slate-400">Simulation Modules</p>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {INTERACTIVE_EXPERIMENTS.length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3">
                <p className="text-slate-500 dark:text-slate-400">Saved Lab Runs</p>
                <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {allRuns.length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search experiments by topic, equation, or subject (e.g. Noyes-Whitney, Titration, PK, Heart, Autoclave)..."
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-2.5 top-2 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as ExperimentDepartmentId | 'all')}
              aria-label="Filter by department"
              className="min-h-[42px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Pharmaceutical Departments</option>
              {Object.entries(EXPERIMENT_DEPARTMENT_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Experiment Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredExperiments.map((exp) => {
            const fidelityMeta = FIDELITY_LABELS[exp.fidelity.level];
            const savedCount = runCountsByExp[exp.id] || 0;
            return (
              <article
                key={exp.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {exp.code} · {EXPERIMENT_DEPARTMENT_LABELS[exp.department]}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      ~{exp.estimatedMinutes} min · {exp.difficulty}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {exp.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {exp.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2">
                      <span className="text-slate-500 dark:text-slate-400 block">Model Fidelity</span>
                      <span className={`font-semibold ${fidelityMeta.toneClass}`}>
                        {fidelityMeta.shortLabel}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2">
                      <span className="text-slate-500 dark:text-slate-400 block">Syllabus Link</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {exp.academicContext.subjectCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{exp.requires3D ? '3D Recommended' : '3D Optional'}</span>
                    </span>
                    <span className="font-mono tabular-nums">
                      {savedCount} saved run{savedCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenExperiment(exp.id, 'intro')}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Guide
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenExperiment(exp.id, 'simulate')}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch Simulation</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Recent Saved Runs Across Experiments */}
        {allRuns.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Lab Notebook Entries
            </h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {allRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {run.runLabel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {run.experimentTitle} · Saved {formatRelativeTime(run.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenExperiment(run.experimentId, 'compare')}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1"
                  >
                    <span>Open Compare</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE INTERACTIVE EXPERIMENT WORKBENCH
  // =========================================================================
  const fidelityMeta = FIDELITY_LABELS[activeExperiment.fidelity.level];
  const progressRatio = Math.min(
    100,
    Math.round((snapshot.simTime / Math.max(1e-6, activeExperiment.simulation.maxTime)) * 100)
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Top Workbench Header & Stage Navigation */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedExpId(null);
                }}
                className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Experiments</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {activeExperiment.code}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-500 dark:text-slate-400">
                {EXPERIMENT_DEPARTMENT_LABELS[activeExperiment.department]}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className={`font-semibold ${fidelityMeta.toneClass}`}>
                {fidelityMeta.badgeText}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeExperiment.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeExperiment.academicContext.studyModeSubjectCode && (
              <button
                type="button"
                onClick={() =>
                  openStudyMode({
                    subjectCode: activeExperiment.academicContext.studyModeSubjectCode
                  })
                }
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Study {activeExperiment.academicContext.studyModeSubjectCode}</span>
              </button>
            )}
            {activeExperiment.academicContext.workspaceModuleId &&
              activeExperiment.academicContext.workspaceModuleId !== 'study_mode' && (
                <button
                  type="button"
                  onClick={() =>
                    navigateToModule(
                      activeExperiment.academicContext.workspaceModuleId!,
                      activeExperiment.academicContext.workspaceTab || null
                    )
                  }
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Department Practical</span>
                </button>
              )}
          </div>
        </div>

        {/* Guided Workflow Stage Tabs */}
        <nav
          aria-label="Experiment workflow stages"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-200 dark:border-slate-800 pt-3"
        >
          {WORKFLOW_STAGES.map((wf) => {
            const active = stage === wf.id;
            return (
              <button
                key={wf.id}
                type="button"
                onClick={() => setStage(wf.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {wf.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ================================================================= */}
      {/* STAGE 1: INTRO & SCIENTIFIC PRINCIPLE                             */}
      {/* ================================================================= */}
      {stage === 'intro' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Scientific Principle &amp; Aim
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeExperiment.scientificPrinciple}
              </p>
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Learning Objectives
                </p>
                <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                  {activeExperiment.objectives.map((obj) => (
                    <li key={obj}>{obj}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Guided Experimental Procedure
              </h2>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
                {activeExperiment.procedureSteps.map((step) => (
                  <li key={step} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStage('apparatus')}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Inspect Apparatus &amp; 3D Models</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStage('simulate')}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Proceed to Simulation Workbench</span>
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Syllabus &amp; Academic Mapping</span>
              </h3>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Course &amp; Subject</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {activeExperiment.academicContext.course} ·{' '}
                    {activeExperiment.academicContext.subjectCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Unit &amp; Topic</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {activeExperiment.academicContext.unit} —{' '}
                    {activeExperiment.academicContext.topic}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Subtopic</dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    {activeExperiment.academicContext.subtopic}
                  </dd>
                </div>
              </dl>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Pharmacopoeial &amp; Textbook References
                </p>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                  {activeExperiment.academicContext.references.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Laboratory Safety &amp; Model Notice</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                {activeExperiment.safetyNotes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STAGE 2: APPARATUS & 3D INTEGRATION                               */}
      {/* ================================================================= */}
      {stage === 'apparatus' && (
        <div className="space-y-5">
          <Experiment3DStage
            experiment={activeExperiment}
            onLinkedAssetsChange={setLinkedAssetIds}
          />

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Apparatus &amp; Instrumentation Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeExperiment.apparatus.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5"
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                    {item.specification}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.role}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ================================================================= */}
      {/* STAGE 3: INTERACTIVE SIMULATION SPLIT CONSOLE                     */}
      {/* ================================================================= */}
      {stage === 'simulate' && (
        <div className="space-y-4">
          {/* Top Telemetry & Playback Ribbon */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (snapshot.completed) {
                    handleReset();
                    setIsPlaying(true);
                  } else {
                    setIsPlaying((prev) => !prev);
                  }
                }}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{snapshot.completed ? 'Re-Run' : snapshot.stepIndex > 0 ? 'Resume' : 'Run Simulation'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={snapshot.completed}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                title="Advance 1 step"
              >
                <StepForward className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Step</span>
              </button>

              <button
                type="button"
                onClick={handleFastForward}
                disabled={snapshot.completed}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                title="Run simulation to end"
              >
                <FastForward className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Complete Run</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>

              <select
                aria-label="Simulation playback speed"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                className="min-h-[40px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value={0.5}>0.5× Speed</option>
                <option value={1}>1× Speed</option>
                <option value={2}>2× Speed</option>
                <option value={4}>4× Speed</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                <span className="text-slate-500 dark:text-slate-400">TIME: </span>
                <strong className="font-bold">
                  {snapshot.simTime.toFixed(2)} / {activeExperiment.simulation.maxTime}{' '}
                  {snapshot.timeUnit}
                </strong>
                <span className="text-slate-400 ml-1.5">({progressRatio}%)</span>
              </div>

              <button
                type="button"
                onClick={() => setShowInline3DInSim((v) => !v)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  showInline3DInSim
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>{showInline3DInSim ? 'Hide 3D Panel' : '3D Apparatus'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSaveRun()}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Run</span>
              </button>
            </div>
          </div>

          {quickSaveNotice && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{quickSaveNotice}</span>
              </span>
              <button
                type="button"
                onClick={() => setStage('compare')}
                className="font-semibold underline"
              >
                View in Compare Runs
              </button>
            </div>
          )}

          {/* Asymmetric Split Workspace: Left Control Deck + Right Visual/Data Stage */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* LEFT CONTROL & PARAMETER DECK */}
            <aside className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
              {/* Built-in Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Scientific Presets
                  </span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1.5">
                  {activeExperiment.presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.parameters)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors"
                    >
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">
                        {preset.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typed Parameter Controls */}
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                {parameterGroups.map(([groupName, specs]) => (
                  <div key={groupName} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {groupName}
                    </p>
                    {specs.map((spec) => {
                      const val = params[spec.key] ?? spec.defaultValue;
                      if (spec.type === 'select') {
                        return (
                          <div key={spec.key} className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {spec.label}
                            </label>
                            <select
                              value={String(val)}
                              onChange={(e) => {
                                const matchedOpt = spec.options?.find(
                                  (o) => String(o.value) === e.target.value
                                );
                                handleParamChange(
                                  spec.key,
                                  matchedOpt ? matchedOpt.value : e.target.value
                                );
                              }}
                              className="w-full min-h-[38px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                            >
                              {(spec.options || []).map((opt) => (
                                <option key={String(opt.value)} value={String(opt.value)}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {spec.description}
                            </p>
                          </div>
                        );
                      }

                      if (spec.type === 'boolean') {
                        return (
                          <label
                            key={spec.key}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) => handleParamChange(spec.key, e.target.checked)}
                              className="mt-0.5 accent-emerald-600 w-4 h-4 rounded"
                            />
                            <span className="space-y-0.5">
                              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {spec.label}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                {spec.description}
                              </span>
                            </span>
                          </label>
                        );
                      }

                      const numVal = Number(val);
                      return (
                        <div key={spec.key} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <label className="font-semibold text-slate-700 dark:text-slate-200">
                              {spec.label}
                            </label>
                            <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                              {formatParameterReadout(spec, numVal)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              aria-label={spec.label}
                              min={spec.min ?? 0}
                              max={spec.max ?? 100}
                              step={spec.step ?? 1}
                              value={numVal}
                              onChange={(e) => handleParamChange(spec.key, Number(e.target.value))}
                              className="flex-1 accent-emerald-600 cursor-pointer"
                            />
                            <input
                              type="number"
                              aria-label={`${spec.label} numeric value`}
                              min={spec.min}
                              max={spec.max}
                              step={spec.step}
                              value={numVal}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                if (Number.isFinite(parsed)) {
                                  handleParamChange(spec.key, parsed);
                                }
                              }}
                              className="w-20 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 text-xs font-mono tabular-nums text-slate-900 dark:text-white text-right focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {spec.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </aside>

            {/* RIGHT MAIN SIMULATION VISUALIZATION & TELEMETRY STAGE */}
            <div className="xl:col-span-8 space-y-5 min-w-0">
              {/* Live Phase & Warnings Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    ● PHASE: {snapshot.phaseLabel.toUpperCase()}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    STEP #{snapshot.stepIndex}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {snapshot.summaryInterpretation}
                </p>
                {snapshot.warnings.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {snapshot.warnings.map((w) => (
                      <div
                        key={w.code}
                        className={`px-3 py-2 rounded-xl border text-xs flex items-start gap-2 ${
                          w.severity === 'error'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                            : w.severity === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-Time Quantitative Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeExperiment.simulation.metrics.map((metric) => {
                  const val = snapshot.metrics[metric.key];
                  return (
                    <div
                      key={metric.key}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3"
                    >
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {metric.label}
                      </p>
                      <p className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white truncate">
                          {formatMetricValue(metric, val)}
                        </span>
                        {metric.unit && (
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                            {metric.unit}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Split Chart + Process Apparatus Visualizer */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-8 min-w-0">
                    <SimulationChart
                      series={activeExperiment.simulation.series}
                      seriesHistory={snapshot.seriesHistory}
                      xAxisLabel={activeExperiment.simulation.xAxisLabel}
                      xAxisUnit={activeExperiment.simulation.xAxisUnit}
                      yAxisLabel={activeExperiment.simulation.yAxisLabel}
                      yAxisUnit={activeExperiment.simulation.yAxisUnit}
                      xMax={activeExperiment.simulation.maxTime}
                      yDomain={activeExperiment.simulation.yDomain}
                      extraReferenceLines={
                        activeExperiment.id === 'exp_one_compartment_pk'
                          ? [
                              {
                                value: Number(params.mecMgL) || 4,
                                label: `MEC (${Number(params.mecMgL) || 4} mg/L)`,
                                colorHex: '#10b981'
                              },
                              {
                                value: Number(params.mtcMgL) || 18,
                                label: `MTC (${Number(params.mtcMgL) || 18} mg/L)`,
                                colorHex: '#ef4444'
                              }
                            ]
                          : []
                      }
                      hiddenSeriesIds={hiddenSeriesIds}
                      onToggleSeries={(id) =>
                        setHiddenSeriesIds((prev) =>
                          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                        )
                      }
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <ProcessVisualizer
                      kind={activeExperiment.visualizerKind}
                      snapshot={snapshot}
                      params={params}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Inline 3D Apparatus View */}
              {showInline3DInSim && (
                <Experiment3DStage
                  experiment={activeExperiment}
                  compact={true}
                  onLinkedAssetsChange={setLinkedAssetIds}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STAGE 4: DATA TABLE & OBSERVATION NOTEBOOK                        */}
      {/* ================================================================= */}
      {stage === 'observe' && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Table2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Recorded Time-Series &amp; Numerical Output Table
              </h2>
            </div>
            <SimulationDataTable
              experiment={activeExperiment}
              snapshot={snapshot}
              params={params}
            />
          </section>

          <LabNotebookPanel
            experiment={activeExperiment}
            currentParams={params}
            currentSnapshot={snapshot}
            linkedAssetIds={linkedAssetIds}
            savedRuns={experimentRuns}
            observationsDraft={observationsDraft}
            conclusionDraft={conclusionDraft}
            notesDraft={notesDraft}
            onChangeObservations={setObservationsDraft}
            onChangeConclusion={setConclusionDraft}
            onChangeNotes={setNotesDraft}
            onSaveCurrentRun={handleSaveRun}
            onToggleCompareRun={handleToggleCompareRun}
            onLoadRunParams={handleLoadRunParams}
            onDeleteRun={handleDeleteRun}
            mode="observe"
          />
        </div>
      )}

      {/* ================================================================= */}
      {/* STAGE 5: MULTI-RUN COMPARISON                                     */}
      {/* ================================================================= */}
      {stage === 'compare' && (
        <LabNotebookPanel
          experiment={activeExperiment}
          currentParams={params}
          currentSnapshot={snapshot}
          linkedAssetIds={linkedAssetIds}
          savedRuns={experimentRuns}
          observationsDraft={observationsDraft}
          conclusionDraft={conclusionDraft}
          notesDraft={notesDraft}
          onChangeObservations={setObservationsDraft}
          onChangeConclusion={setConclusionDraft}
          onChangeNotes={setNotesDraft}
          onSaveCurrentRun={handleSaveRun}
          onToggleCompareRun={handleToggleCompareRun}
          onLoadRunParams={handleLoadRunParams}
          onDeleteRun={handleDeleteRun}
          mode="compare"
        />
      )}

      {/* ================================================================= */}
      {/* STAGE 6: SCIENTIFIC FIDELITY, EQUATIONS, LIMITATIONS & CONCLUSION */}
      {/* ================================================================= */}
      {stage === 'conclusion' && (
        <div className="space-y-5">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Scientific Fidelity, Equations &amp; Model Boundaries
                  </h2>
                  <p className={`text-xs font-semibold ${fidelityMeta.toneClass}`}>
                    {activeExperiment.fidelity.label}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeExperiment.fidelity.justification}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeExperiment.fidelity.equations.map((eq) => (
                <div
                  key={eq.title}
                  className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5"
                >
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {eq.title}
                  </p>
                  <p className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-words">
                    {eq.formula}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{eq.variables}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Model Assumptions
                </p>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {activeExperiment.fidelity.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Known Limitations
                </p>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {activeExperiment.fidelity.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <LabNotebookPanel
            experiment={activeExperiment}
            currentParams={params}
            currentSnapshot={snapshot}
            linkedAssetIds={linkedAssetIds}
            savedRuns={experimentRuns}
            observationsDraft={observationsDraft}
            conclusionDraft={conclusionDraft}
            notesDraft={notesDraft}
            onChangeObservations={setObservationsDraft}
            onChangeConclusion={setConclusionDraft}
            onChangeNotes={setNotesDraft}
            onSaveCurrentRun={handleSaveRun}
            onToggleCompareRun={handleToggleCompareRun}
            onLoadRunParams={handleLoadRunParams}
            onDeleteRun={handleDeleteRun}
            mode="conclusion"
          />
        </div>
      )}
    </div>
  );
}
