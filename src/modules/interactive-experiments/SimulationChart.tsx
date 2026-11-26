import React, { useMemo, useState } from 'react';
import {
  SavedExperimentRun,
  SimulationSeriesPoint,
  SimulationSeriesSpec
} from './types';

interface ComparisonTrace {
  run: SavedExperimentRun;
  colorHex: string;
}

interface SimulationChartProps {
  series: SimulationSeriesSpec[];
  seriesHistory: Record<string, SimulationSeriesPoint[]>;
  xAxisLabel: string;
  xAxisUnit: string;
  yAxisLabel: string;
  yAxisUnit: string;
  xMax: number;
  yDomain?: [number, number];
  extraReferenceLines?: Array<{ value: number; label: string; colorHex: string }>;
  comparisonRuns?: ComparisonTrace[];
  hiddenSeriesIds?: string[];
  onToggleSeries?: (seriesId: string) => void;
}

export default function SimulationChart({
  series,
  seriesHistory,
  xAxisLabel,
  xAxisUnit,
  yAxisLabel,
  yAxisUnit,
  xMax,
  yDomain,
  extraReferenceLines = [],
  comparisonRuns = [],
  hiddenSeriesIds = [],
  onToggleSeries
}: SimulationChartProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);

  const width = 760;
  const height = 310;
  const padLeft = 58;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 42;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const visibleSeries = useMemo(
    () => series.filter((s) => !hiddenSeriesIds.includes(s.id)),
    [series, hiddenSeriesIds]
  );

  const { yMin, yMax, effectiveXMax } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;
    let maxSeenX = xMax;

    for (const s of visibleSeries) {
      for (const pt of seriesHistory[s.id] || []) {
        if (Number.isFinite(pt.y)) {
          minVal = Math.min(minVal, pt.y);
          maxVal = Math.max(maxVal, pt.y);
        }
        if (Number.isFinite(pt.x)) {
          maxSeenX = Math.max(maxSeenX, pt.x);
        }
      }
      for (const ref of s.referenceLines || []) {
        minVal = Math.min(minVal, ref.value);
        maxVal = Math.max(maxVal, ref.value);
      }
    }

    for (const comp of comparisonRuns) {
      const primaryId = series[0]?.id;
      if (!primaryId) continue;
      for (const pt of comp.run.seriesHistory[primaryId] || []) {
        if (Number.isFinite(pt.y)) {
          minVal = Math.min(minVal, pt.y);
          maxVal = Math.max(maxVal, pt.y);
        }
      }
    }

    for (const ref of extraReferenceLines) {
      minVal = Math.min(minVal, ref.value);
      maxVal = Math.max(maxVal, ref.value);
    }

    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
      minVal = 0;
      maxVal = 100;
    }

    if (yDomain) {
      return {
        yMin: yDomain[0],
        yMax: Math.max(yDomain[1], maxVal * 1.04),
        effectiveXMax: Math.max(1e-6, maxSeenX)
      };
    }

    const span = Math.max(1e-3, maxVal - minVal);
    const computedMin = minVal >= 0 && minVal < span * 0.25 ? 0 : minVal - span * 0.08;
    const computedMax = maxVal + span * 0.12;
    return {
      yMin: computedMin,
      yMax: computedMax,
      effectiveXMax: Math.max(1e-6, maxSeenX)
    };
  }, [visibleSeries, seriesHistory, comparisonRuns, extraReferenceLines, xMax, yDomain, series]);

  const toX = (x: number) => padLeft + Math.min(1, Math.max(0, x / effectiveXMax)) * plotW;
  const toY = (y: number) => {
    const ratio = (y - yMin) / Math.max(1e-6, yMax - yMin);
    return padTop + (1 - Math.min(1.05, Math.max(-0.05, ratio))) * plotH;
  };

  const buildPath = (pts: SimulationSeriesPoint[]) => {
    if (!pts || pts.length === 0) return '';
    return pts
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${toX(pt.x).toFixed(2)},${toY(pt.y).toFixed(2)}`)
      .join(' ');
  };

  const xTicks = useMemo(() => {
    const count = 6;
    return Array.from({ length: count + 1 }, (_, i) => (effectiveXMax * i) / count);
  }, [effectiveXMax]);

  const yTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / count);
  }, [yMin, yMax]);

  const allRefLines = useMemo(() => {
    const out: Array<{ value: number; label: string; colorHex: string }> = [...extraReferenceLines];
    for (const s of visibleSeries) {
      for (const r of s.referenceLines || []) out.push(r);
    }
    return out;
  }, [visibleSeries, extraReferenceLines]);

  const hoveredReadout = useMemo(() => {
    if (hoverX === null) return null;
    const items: Array<{ label: string; colorHex: string; x: number; y: number; unit: string }> = [];
    for (const s of visibleSeries) {
      const pts = seriesHistory[s.id] || [];
      if (pts.length === 0) continue;
      let nearest = pts[0];
      let bestDist = Math.abs(pts[0].x - hoverX);
      for (const pt of pts) {
        const d = Math.abs(pt.x - hoverX);
        if (d < bestDist) {
          bestDist = d;
          nearest = pt;
        }
      }
      items.push({
        label: s.label,
        colorHex: s.colorHex,
        x: nearest.x,
        y: nearest.y,
        unit: s.unit
      });
    }
    return items.length > 0 ? items : null;
  }, [hoverX, visibleSeries, seriesHistory]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = (svgX - padLeft) / plotW;
    if (ratio < 0 || ratio > 1) {
      setHoverX(null);
      return;
    }
    setHoverX(ratio * effectiveXMax);
  };

  return (
    <div className="space-y-2.5">
      {/* Legend & Series Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {series.map((s) => {
            const hidden = hiddenSeriesIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggleSeries?.(s.id)}
                className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                  hidden
                    ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span
                  className="w-3 h-0.5 rounded-full inline-block"
                  style={{ backgroundColor: s.colorHex }}
                />
                <span>{s.label}</span>
              </button>
            );
          })}
          {comparisonRuns.map((c) => (
            <span
              key={c.run.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
            >
              <span
                className="w-3 h-0.5 inline-block border-t-2 border-dashed"
                style={{ borderColor: c.colorHex }}
              />
              <span className="truncate max-w-[160px]">{c.run.runLabel}</span>
            </span>
          ))}
        </div>

        {hoveredReadout && (
          <div className="font-mono tabular-nums text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
            x = {hoveredReadout[0].x.toFixed(2)} {xAxisUnit} ·{' '}
            {hoveredReadout.map((item, idx) => (
              <span key={item.label}>
                {idx > 0 ? ' | ' : ''}
                <span style={{ color: item.colorHex }} className="font-semibold">
                  {item.y.toFixed(2)} {item.unit}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Responsive SVG Plot */}
      <div className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 sm:p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverX(null)}
          role="img"
          aria-label={`${yAxisLabel} versus ${xAxisLabel} simulation chart`}
        >
          {/* Horizontal grid lines */}
          {yTicks.map((tick, idx) => {
            const yPos = toY(tick);
            return (
              <g key={`y-${idx}`}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={width - padRight}
                  y2={yPos}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                >
                  {Math.abs(tick) >= 100 || Number.isInteger(tick) ? tick.toFixed(0) : tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Vertical grid lines */}
          {xTicks.map((tick, idx) => {
            const xPos = toX(tick);
            return (
              <g key={`x-${idx}`}>
                <line
                  x1={xPos}
                  y1={padTop}
                  x2={xPos}
                  y2={height - padBottom}
                  className="stroke-slate-200/70 dark:stroke-slate-800/70"
                  strokeWidth={1}
                />
                <text
                  x={xPos}
                  y={height - padBottom + 16}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                >
                  {tick >= 10 || Number.isInteger(tick) ? tick.toFixed(0) : tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Threshold / Reference lines */}
          {allRefLines.map((ref) => {
            if (ref.value < yMin || ref.value > yMax) return null;
            const ry = toY(ref.value);
            return (
              <g key={`${ref.label}-${ref.value}`}>
                <line
                  x1={padLeft}
                  y1={ry}
                  x2={width - padRight}
                  y2={ry}
                  stroke={ref.colorHex}
                  strokeWidth={1.25}
                  strokeDasharray="5 4"
                />
                <text
                  x={width - padRight - 4}
                  y={ry - 4}
                  textAnchor="end"
                  fill={ref.colorHex}
                  className="text-[10px] font-mono font-semibold"
                >
                  {ref.label}
                </text>
              </g>
            );
          })}

          {/* Axes frame */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={height - padBottom}
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth={1.25}
          />
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth={1.25}
          />

          {/* Comparison Run Dashed Traces (Primary Series) */}
          {comparisonRuns.map((comp) => {
            const primaryId = series[0]?.id;
            if (!primaryId) return null;
            const pts = comp.run.seriesHistory[primaryId] || [];
            if (pts.length < 2) return null;
            return (
              <path
                key={comp.run.id}
                d={buildPath(pts)}
                fill="none"
                stroke={comp.colorHex}
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.8}
              />
            );
          })}

          {/* Active Simulation Traces */}
          {visibleSeries.map((s) => {
            const pts = seriesHistory[s.id] || [];
            if (pts.length === 0) return null;
            const lastPt = pts[pts.length - 1];
            return (
              <g key={s.id}>
                {pts.length >= 2 && (
                  <path
                    d={buildPath(pts)}
                    fill="none"
                    stroke={s.colorHex}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <circle
                  cx={toX(lastPt.x)}
                  cy={toY(lastPt.y)}
                  r={4}
                  fill={s.colorHex}
                  className="stroke-white dark:stroke-slate-950"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}

          {/* Interactive Crosshair */}
          {hoveredReadout && (
            <g>
              <line
                x1={toX(hoveredReadout[0].x)}
                y1={padTop}
                x2={toX(hoveredReadout[0].x)}
                y2={height - padBottom}
                className="stroke-slate-400 dark:stroke-slate-500"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {hoveredReadout.map((item) => (
                <circle
                  key={item.label}
                  cx={toX(item.x)}
                  cy={toY(item.y)}
                  r={4.5}
                  fill={item.colorHex}
                  className="stroke-white dark:stroke-slate-950"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padLeft + plotW / 2}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-600 dark:fill-slate-400 text-[11px] font-medium"
          >
            {xAxisLabel} ({xAxisUnit})
          </text>
          <text
            x={16}
            y={padTop + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${padTop + plotH / 2})`}
            className="fill-slate-600 dark:fill-slate-400 text-[11px] font-medium"
          >
            {yAxisLabel} ({yAxisUnit})
          </text>
        </svg>
      </div>
    </div>
  );
}
