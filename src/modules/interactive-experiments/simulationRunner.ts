import {
  ExperimentDefinition,
  ExperimentParameterSpec,
  ParameterValue,
  SavedExperimentRun,
  SimulationMetricSpec,
  SimulationSeriesPoint,
  SimulationSnapshot,
  SimulationWarning
} from './types';

export interface ParameterValidationResult {
  sanitized: Record<string, ParameterValue>;
  warnings: SimulationWarning[];
  adjustedKeys: string[];
}

export function getDefaultParameters(experiment: ExperimentDefinition): Record<string, ParameterValue> {
  const result: Record<string, ParameterValue> = {};
  for (const spec of experiment.parameters) {
    result[spec.key] = spec.defaultValue;
  }
  return result;
}

export function validateAndClampParameters(
  experiment: ExperimentDefinition,
  rawParams: Record<string, unknown>
): ParameterValidationResult {
  const sanitized: Record<string, ParameterValue> = {};
  const warnings: SimulationWarning[] = [];
  const adjustedKeys: string[] = [];

  for (const spec of experiment.parameters) {
    const raw = rawParams[spec.key];
    if (spec.type === 'number') {
      const parsed = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(parsed)) {
        sanitized[spec.key] = spec.defaultValue;
        adjustedKeys.push(spec.key);
        warnings.push({
          severity: 'warning',
          code: `INVALID_${spec.key.toUpperCase()}`,
          message: `${spec.label} received a non-numeric value and was reset to ${String(spec.defaultValue)} ${spec.unit}.`
        });
        continue;
      }
      const min = typeof spec.min === 'number' ? spec.min : -Infinity;
      const max = typeof spec.max === 'number' ? spec.max : Infinity;
      let clamped = Math.min(max, Math.max(min, parsed));
      if (typeof spec.precision === 'number' && spec.precision >= 0) {
        const factor = Math.pow(10, spec.precision);
        clamped = Math.round(clamped * factor) / factor;
      }
      if (clamped !== parsed) {
        adjustedKeys.push(spec.key);
        warnings.push({
          severity: 'info',
          code: `CLAMPED_${spec.key.toUpperCase()}`,
          message: `${spec.label} clamped to valid range [${min}, ${max}] ${spec.unit}.`
        });
      }
      sanitized[spec.key] = clamped;
    } else if (spec.type === 'boolean') {
      sanitized[spec.key] = typeof raw === 'boolean' ? raw : Boolean(spec.defaultValue);
    } else if (spec.type === 'select') {
      const options = spec.options || [];
      const match = options.find((opt) => String(opt.value) === String(raw));
      if (match) {
        sanitized[spec.key] = match.value;
      } else {
        sanitized[spec.key] = spec.defaultValue;
        if (raw !== undefined) {
          adjustedKeys.push(spec.key);
        }
      }
    }
  }

  return { sanitized, warnings, adjustedKeys };
}

export function initializeSimulation(
  experiment: ExperimentDefinition,
  rawParams?: Record<string, unknown>
): { params: Record<string, ParameterValue>; snapshot: SimulationSnapshot; validationWarnings: SimulationWarning[] } {
  const merged = {
    ...getDefaultParameters(experiment),
    ...(rawParams || {})
  };
  const { sanitized, warnings } = validateAndClampParameters(experiment, merged);
  const snapshot = experiment.simulation.init(sanitized);
  return {
    params: sanitized,
    snapshot: {
      ...snapshot,
      warnings: [...warnings, ...snapshot.warnings]
    },
    validationWarnings: warnings
  };
}

export function advanceSimulationStep(
  experiment: ExperimentDefinition,
  snapshot: SimulationSnapshot,
  params: Record<string, ParameterValue>,
  steps = 1
): SimulationSnapshot {
  let current = snapshot;
  const count = Math.max(1, Math.min(500, Math.floor(steps)));
  for (let i = 0; i < count; i++) {
    if (current.completed) break;
    current = experiment.simulation.step(current, params);
  }
  return current;
}

export function runSimulationToCompletion(
  experiment: ExperimentDefinition,
  rawParams?: Record<string, unknown>,
  maxSafetyIterations = 2500
): { params: Record<string, ParameterValue>; snapshot: SimulationSnapshot } {
  const { params, snapshot: initial, validationWarnings } = initializeSimulation(
    experiment,
    rawParams
  );
  let current = initial;
  let guard = 0;
  while (!current.completed && guard < maxSafetyIterations) {
    current = experiment.simulation.step(current, params);
    guard += 1;
  }
  return {
    params,
    snapshot: {
      ...current,
      warnings: [...validationWarnings, ...current.warnings.filter((w) => !validationWarnings.some((vw) => vw.code === w.code))]
    }
  };
}

export function formatMetricValue(
  spec: SimulationMetricSpec,
  value: number | string | undefined
): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return '—';
  const precision = typeof spec.precision === 'number' ? spec.precision : 2;
  return value.toFixed(precision);
}

export function formatParameterReadout(
  spec: ExperimentParameterSpec,
  value: ParameterValue
): string {
  if (spec.type === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (spec.type === 'select') {
    const opt = spec.options?.find((o) => String(o.value) === String(value));
    return opt ? opt.label : String(value);
  }
  if (typeof value === 'number') {
    const precision = typeof spec.precision === 'number' ? spec.precision : 2;
    return `${Number.isInteger(value) && precision === 0 ? value : Number(value.toFixed(precision))} ${spec.unit}`.trim();
  }
  return `${String(value)} ${spec.unit}`.trim();
}

export function downsampleSeries(
  points: SimulationSeriesPoint[],
  maxPoints = 320
): SimulationSeriesPoint[] {
  if (points.length <= maxPoints) return points;
  const stride = Math.ceil(points.length / maxPoints);
  const out: SimulationSeriesPoint[] = [];
  for (let i = 0; i < points.length; i += stride) {
    out.push(points[i]);
  }
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) {
    out.push(last);
  }
  return out;
}

export function buildSeriesCsv(
  experiment: ExperimentDefinition,
  snapshot: SimulationSnapshot,
  params: Record<string, ParameterValue>
): string {
  const lines: string[] = [];
  lines.push(`# Experiment: ${experiment.title} (${experiment.code})`);
  lines.push(`# Fidelity: ${experiment.fidelity.label}`);
  lines.push(`# Time Horizon: ${snapshot.simTime.toFixed(3)} ${snapshot.timeUnit}`);
  for (const spec of experiment.parameters) {
    lines.push(`# Param ${spec.label}: ${formatParameterReadout(spec, params[spec.key] ?? spec.defaultValue)}`);
  }
  const seriesList = experiment.simulation.series;
  const primarySeries = snapshot.seriesHistory[seriesList[0]?.id] || [];
  const headerCols = [
    `${experiment.simulation.xAxisLabel} (${experiment.simulation.xAxisUnit})`,
    ...seriesList.map((s) => `${s.label} (${s.unit})`)
  ];
  lines.push(headerCols.map(escapeCsvCell).join(','));

  for (let i = 0; i < primarySeries.length; i++) {
    const xVal = primarySeries[i].x;
    const row = [
      xVal.toFixed(4),
      ...seriesList.map((s) => {
        const pt = snapshot.seriesHistory[s.id]?.[i];
        return pt && Number.isFinite(pt.y) ? pt.y.toFixed(5) : '';
      })
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  return lines.join('\n');
}

function escapeCsvCell(raw: string): string {
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildRunExportJson(
  experiment: ExperimentDefinition,
  run: SavedExperimentRun
): string {
  return JSON.stringify(
    {
      schema: 'pharmlab.experiment_run.v1',
      exportedAt: new Date().toISOString(),
      experiment: {
        id: experiment.id,
        code: experiment.code,
        title: experiment.title,
        department: experiment.department,
        fidelity: experiment.fidelity.level,
        academicContext: experiment.academicContext
      },
      run
    },
    null,
    2
  );
}

export function computeRunComparisonRows(
  experiment: ExperimentDefinition,
  runs: SavedExperimentRun[]
): {
  parameterRows: Array<{
    key: string;
    label: string;
    unit: string;
    values: string[];
    varies: boolean;
  }>;
  metricRows: Array<{
    key: string;
    label: string;
    unit: string;
    formattedValues: string[];
    numericValues: Array<number | null>;
    deltaFromFirst: Array<number | null>;
  }>;
} {
  const parameterRows = experiment.parameters.map((spec) => {
    const values = runs.map((r) =>
      formatParameterReadout(spec, r.parameters[spec.key] ?? spec.defaultValue)
    );
    const varies = new Set(values).size > 1;
    return {
      key: spec.key,
      label: spec.label,
      unit: spec.unit,
      values,
      varies
    };
  });

  const metricRows = experiment.simulation.metrics.map((m) => {
    const formattedValues = runs.map((r) => formatMetricValue(m, r.metrics[m.key]));
    const numericValues = runs.map((r) => {
      const v = r.metrics[m.key];
      return typeof v === 'number' && Number.isFinite(v) ? v : null;
    });
    const base = numericValues[0];
    const deltaFromFirst = numericValues.map((val, idx) => {
      if (idx === 0 || base === null || val === null) return null;
      return val - base;
    });
    return {
      key: m.key,
      label: m.label,
      unit: m.unit,
      formattedValues,
      numericValues,
      deltaFromFirst
    };
  });

  return { parameterRows, metricRows };
}
