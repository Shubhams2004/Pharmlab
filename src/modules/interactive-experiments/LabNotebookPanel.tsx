import React, { useMemo, useState } from 'react';
import {
  Check,
  Download,
  FileJson,
  NotebookPen,
  Pin,
  Save,
  Trash2
} from 'lucide-react';
import { ResponsiveTableWrapper } from '../../components/WorkspacePrimitives';
import { formatRelativeTime } from '../../utils/studyWorkspace';
import SimulationChart from './SimulationChart';
import {
  buildRunExportJson,
  computeRunComparisonRows,
  downsampleSeries,
  formatMetricValue
} from './simulationRunner';
import {
  ExperimentDefinition,
  ParameterValue,
  SavedExperimentRun,
  SimulationSnapshot
} from './types';

interface LabNotebookPanelProps {
  experiment: ExperimentDefinition;
  currentParams: Record<string, ParameterValue>;
  currentSnapshot: SimulationSnapshot;
  linkedAssetIds: string[];
  savedRuns: SavedExperimentRun[];
  observationsDraft: string;
  conclusionDraft: string;
  notesDraft: string;
  onChangeObservations: (val: string) => void;
  onChangeConclusion: (val: string) => void;
  onChangeNotes: (val: string) => void;
  onSaveCurrentRun: (runLabel: string) => Promise<void>;
  onToggleCompareRun: (runId: string) => Promise<void>;
  onLoadRunParams: (run: SavedExperimentRun) => void;
  onDeleteRun: (runId: string) => Promise<void>;
  mode: 'observe' | 'compare' | 'conclusion';
}

const COMPARE_COLORS = ['#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function LabNotebookPanel({
  experiment,
  currentParams,
  currentSnapshot,
  savedRuns,
  observationsDraft,
  conclusionDraft,
  notesDraft,
  onChangeObservations,
  onChangeConclusion,
  onChangeNotes,
  onSaveCurrentRun,
  onToggleCompareRun,
  onLoadRunParams,
  onDeleteRun,
  mode
}: LabNotebookPanelProps) {
  const [runLabelInput, setRunLabelInput] = useState(
    `${experiment.shortTitle} · Run #${savedRuns.length + 1}`
  );
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const pinnedRuns = useMemo(
    () => savedRuns.filter((r) => r.pinnedForCompare).slice(0, 4),
    [savedRuns]
  );

  const comparisonRuns = useMemo(() => {
    if (pinnedRuns.length >= 2) return pinnedRuns;
    return savedRuns.slice(0, 3);
  }, [pinnedRuns, savedRuns]);

  const comparisonMatrix = useMemo(
    () =>
      comparisonRuns.length > 0
        ? computeRunComparisonRows(experiment, comparisonRuns)
        : null,
    [experiment, comparisonRuns]
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveNotice(null);
    try {
      const label =
        runLabelInput.trim() || `${experiment.shortTitle} · Run #${savedRuns.length + 1}`;
      await onSaveCurrentRun(label);
      setRunLabelInput(`${experiment.shortTitle} · Run #${savedRuns.length + 2}`);
      setSaveNotice(`Saved "${label}" to local Lab Notebook.`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = (run: SavedExperimentRun) => {
    const json = buildRunExportJson(experiment, {
      ...run,
      seriesHistory: Object.fromEntries(
        Object.entries(run.seriesHistory).map(([k, pts]) => [k, downsampleSeries(pts, 250)])
      )
    });
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment.id}_${run.id}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (mode === 'compare') {
    const primaryTraceOverlays = comparisonRuns.map((run, idx) => ({
      run,
      colorHex: COMPARE_COLORS[idx % COMPARE_COLORS.length]
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Multi-Run Curve &amp; Parameter Comparison
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Pin up to 4 saved runs below to overlay primary response curves and inspect parameter deltas side-by-side.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {comparisonRuns.length} run{comparisonRuns.length === 1 ? '' : 's'} in comparison
            </span>
          </div>

          {savedRuns.length === 0 ? (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No saved simulation runs yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Run the simulation under at least two different parameter settings and click &ldquo;Save Run to Notebook&rdquo; to compare trajectories and endpoints here.
              </p>
            </div>
          ) : (
            <>
              <SimulationChart
                series={[experiment.simulation.series[0]]}
                seriesHistory={{
                  [experiment.simulation.series[0].id]:
                    currentSnapshot.seriesHistory[experiment.simulation.series[0].id] || []
                }}
                xAxisLabel={experiment.simulation.xAxisLabel}
                xAxisUnit={experiment.simulation.xAxisUnit}
                yAxisLabel={experiment.simulation.yAxisLabel}
                yAxisUnit={experiment.simulation.yAxisUnit}
                xMax={experiment.simulation.maxTime}
                yDomain={experiment.simulation.yDomain}
                comparisonRuns={primaryTraceOverlays}
              />

              {comparisonMatrix && (
                <ResponsiveTableWrapper>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Variable / Outcome</th>
                        {comparisonRuns.map((run, idx) => (
                          <th key={run.id} className="px-3 py-2.5 font-semibold">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                              style={{
                                backgroundColor: COMPARE_COLORS[idx % COMPARE_COLORS.length]
                              }}
                            />
                            {run.runLabel}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 font-mono tabular-nums">
                      {comparisonMatrix.metricRows.map((row) => (
                        <tr key={row.key}>
                          <td className="px-3 py-2 font-sans font-semibold text-slate-800 dark:text-slate-200">
                            {row.label} {row.unit ? `(${row.unit})` : ''}
                          </td>
                          {row.formattedValues.map((val, idx) => {
                            const delta = row.deltaFromFirst[idx];
                            return (
                              <td key={idx} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                                <span>{val}</span>
                                {delta !== null && Math.abs(delta) > 1e-4 && (
                                  <span
                                    className={`ml-1.5 text-[11px] ${
                                      delta > 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                    }`}
                                  >
                                    ({delta > 0 ? '+' : ''}
                                    {delta.toFixed(2)})
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {comparisonMatrix.parameterRows
                        .filter((r) => r.varies)
                        .map((row) => (
                          <tr
                            key={`p-${row.key}`}
                            className="bg-slate-50/70 dark:bg-slate-900/40"
                          >
                            <td className="px-3 py-2 font-sans text-slate-600 dark:text-slate-400">
                              Param: {row.label}
                            </td>
                            {row.values.map((v, idx) => (
                              <td key={idx} className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {v}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </ResponsiveTableWrapper>
              )}
            </>
          )}
        </div>

        {/* Saved Runs Management List */}
        {savedRuns.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Saved Simulation Runs ({savedRuns.length})
            </h4>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {savedRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {run.runLabel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      Saved {formatRelativeTime(run.createdAt)} · t = {run.finalSimTime.toFixed(2)}{' '}
                      {run.timeUnit}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void onToggleCompareRun(run.id)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                        run.pinnedForCompare
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{run.pinnedForCompare ? 'Pinned' : 'Pin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadRunParams(run)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      Load Params
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportJson(run)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition-colors"
                      title="Export JSON record"
                    >
                      <FileJson className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void onDeleteRun(run.id)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors"
                      aria-label={`Delete ${run.runLabel}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <NotebookPen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'conclusion'
                ? 'Scientific Conclusion & Lab Record'
                : 'Laboratory Observation Notebook'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stored locally in IndexedDB with parameters, real-time metrics, and linked 3D assets.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {savedRuns.length} saved run{savedRuns.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Guided observation prompts */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Guided Observation Prompts
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
          {experiment.observationPrompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Experimental Observations
          </label>
          <textarea
            rows={5}
            value={observationsDraft}
            onChange={(e) => onChangeObservations(e.target.value)}
            placeholder="Record inflection points, lag times, curve shape changes, and threshold crossings..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scientific Conclusion
            </label>
            <button
              type="button"
              onClick={() => onChangeConclusion(experiment.defaultConclusionTemplate)}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Insert Model Template
            </button>
          </div>
          <textarea
            rows={5}
            value={conclusionDraft}
            onChange={(e) => onChangeConclusion(e.target.value)}
            placeholder="Summarize whether objectives and theoretical predictions matched your simulation outputs..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Additional Lab Notes / viva questions
        </label>
        <input
          type="text"
          value={notesDraft}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Optional experimental notes, deviation remarks, or syllabus cross-references..."
          className="w-full min-h-[42px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Save Run Bar */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          value={runLabelInput}
          onChange={(e) => setRunLabelInput(e.target.value)}
          placeholder="Label this run (e.g., 100 RPM Fast Dissolution)"
          className="flex-1 min-h-[42px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Run to Notebook'}</span>
        </button>
      </div>

      {saveNotice && (
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>{saveNotice}</span>
        </p>
      )}
    </div>
  );
}
