import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { ResponsiveTableWrapper } from '../../components/WorkspacePrimitives';
import { buildSeriesCsv } from './simulationRunner';
import { ExperimentDefinition, ParameterValue, SimulationSnapshot } from './types';

interface SimulationDataTableProps {
  experiment: ExperimentDefinition;
  snapshot: SimulationSnapshot;
  params: Record<string, ParameterValue>;
}

export default function SimulationDataTable({
  experiment,
  snapshot,
  params
}: SimulationDataTableProps) {
  const seriesList = experiment.simulation.series;
  const primaryPts = snapshot.seriesHistory[seriesList[0]?.id] || [];

  // Show most recent 40 rows (downsampled uniformly if > 40 points)
  const displayRows = useMemo(() => {
    if (primaryPts.length <= 40) {
      return primaryPts.map((pt, idx) => ({ idx, pt }));
    }
    const stride = Math.ceil(primaryPts.length / 40);
    const out: Array<{ idx: number; pt: { x: number; y: number } }> = [];
    for (let i = 0; i < primaryPts.length; i += stride) {
      out.push({ idx: i, pt: primaryPts[i] });
    }
    const lastIdx = primaryPts.length - 1;
    if (out[out.length - 1]?.idx !== lastIdx) {
      out.push({ idx: lastIdx, pt: primaryPts[lastIdx] });
    }
    return out;
  }, [primaryPts]);

  const handleDownloadCsv = () => {
    const csv = buildSeriesCsv(experiment, snapshot, params);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          Showing {displayRows.length} sampled records out of {primaryPts.length} simulation steps.
        </p>
        <button
          type="button"
          onClick={handleDownloadCsv}
          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Export Data CSV</span>
        </button>
      </div>

      <ResponsiveTableWrapper className="max-h-80 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Step</th>
              <th className="px-3 py-2.5 font-semibold">
                {experiment.simulation.xAxisLabel} ({experiment.simulation.xAxisUnit})
              </th>
              {seriesList.map((s) => (
                <th key={s.id} className="px-3 py-2.5 font-semibold">
                  {s.label} {s.unit ? `(${s.unit})` : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 font-mono tabular-nums">
            {displayRows.map(({ idx, pt }) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{idx}</td>
                <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                  {pt.x.toFixed(2)}
                </td>
                {seriesList.map((s) => {
                  const val = snapshot.seriesHistory[s.id]?.[idx]?.y;
                  return (
                    <td key={s.id} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {val !== undefined && Number.isFinite(val) ? val.toFixed(3) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTableWrapper>
    </div>
  );
}
