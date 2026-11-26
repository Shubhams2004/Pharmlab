import { Asset3DCategory, BPharmDepartmentId } from '../assets-3d/types';

export type SimulationFidelityLevel =
  | 'scientifically_based_calculation'
  | 'simplified_educational_simulation'
  | 'qualitative_visualization'
  | 'illustrative_animation';

export type ExperimentDepartmentId =
  | 'pharmaceutics'
  | 'pharmaceutical_analysis'
  | 'pharmaceutical_chemistry'
  | 'pharmacology'
  | 'anatomy'
  | 'microbiology'
  | 'biotechnology'
  | 'industrial_pharmacy';

export type ExperimentWorkflowStageId =
  | 'intro'
  | 'apparatus'
  | 'simulate'
  | 'observe'
  | 'compare'
  | 'conclusion';

export type ParameterValue = number | string | boolean;

export interface ParameterOption {
  value: string | number;
  label: string;
  note?: string;
}

export interface ExperimentParameterSpec {
  key: string;
  label: string;
  symbol?: string;
  unit: string;
  type: 'number' | 'select' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  options?: ParameterOption[];
  defaultValue: ParameterValue;
  group: string;
  description: string;
  recommendedRange?: string;
  visibleWhen?: (params: Record<string, ParameterValue>) => boolean;
}

export interface ExperimentApparatusItem {
  name: string;
  specification: string;
  role: string;
  safetyNote?: string;
}

export interface Experiment3DAssetBinding {
  slotId: string;
  roleLabel: string;
  description: string;
  optional: boolean;
  categoryHints: Asset3DCategory[];
  departmentHints: BPharmDepartmentId[];
  matchKeywords: string[];
  recommendedExperimentId?: string;
  recommendedSubjectCode?: string;
  fallbackVisualId?: string;
}

export interface ExperimentEquationSpec {
  title: string;
  formula: string;
  variables: string;
  notes?: string;
}

export interface ExperimentFidelitySpec {
  level: SimulationFidelityLevel;
  label: string;
  justification: string;
  equations: ExperimentEquationSpec[];
  assumptions: string[];
  limitations: string[];
}

export interface ExperimentAcademicContext {
  course: string;
  subjectCode: string;
  subjectTitle: string;
  unit: string;
  topic: string;
  subtopic: string;
  workspaceModuleId?: string;
  workspaceTab?: string;
  studyModeSubjectCode?: string;
  references: string[];
}

export interface SimulationSeriesSpec {
  id: string;
  label: string;
  unit: string;
  colorHex: string;
  yAxisSide?: 'left' | 'right';
  referenceLines?: Array<{
    value: number;
    label: string;
    colorHex: string;
  }>;
}

export interface SimulationMetricSpec {
  key: string;
  label: string;
  unit: string;
  precision?: number;
  highlightTone?: 'default' | 'nominal' | 'warning' | 'critical';
}

export interface SimulationSeriesPoint {
  x: number;
  y: number;
}

export interface SimulationWarning {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
}

export interface SimulationSnapshot {
  stepIndex: number;
  simTime: number;
  timeUnit: string;
  completed: boolean;
  phaseLabel: string;
  state: Record<string, ParameterValue>;
  metrics: Record<string, number | string>;
  seriesHistory: Record<string, SimulationSeriesPoint[]>;
  visualState: Record<string, ParameterValue>;
  warnings: SimulationWarning[];
  summaryInterpretation: string;
}

export type ExperimentVisualizerKind =
  | 'dissolution_vessel'
  | 'titration_burette'
  | 'pk_compartment'
  | 'cardiac_hemodynamics'
  | 'microbial_bioreactor'
  | 'filtration_diffusion';

export interface SimulationPreset {
  id: string;
  label: string;
  description: string;
  parameters: Record<string, ParameterValue>;
}

export interface SimulationEngineSpec {
  mode: 'time_series' | 'sweep_and_step';
  timeUnit: string;
  dt: number;
  maxTime: number;
  defaultSpeed: number;
  xAxisLabel: string;
  xAxisUnit: string;
  yAxisLabel: string;
  yAxisUnit: string;
  yDomain?: [number, number];
  series: SimulationSeriesSpec[];
  metrics: SimulationMetricSpec[];
  init: (params: Record<string, ParameterValue>) => SimulationSnapshot;
  step: (
    snapshot: SimulationSnapshot,
    params: Record<string, ParameterValue>,
    dtOverride?: number
  ) => SimulationSnapshot;
}

export interface ExperimentDefinition {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  department: ExperimentDepartmentId;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  requires3D: boolean;
  visualizerKind: ExperimentVisualizerKind;
  description: string;
  scientificPrinciple: string;
  objectives: string[];
  apparatus: ExperimentApparatusItem[];
  asset3dBindings: Experiment3DAssetBinding[];
  safetyNotes: string[];
  procedureSteps: string[];
  fidelity: ExperimentFidelitySpec;
  academicContext: ExperimentAcademicContext;
  parameters: ExperimentParameterSpec[];
  presets: SimulationPreset[];
  simulation: SimulationEngineSpec;
  observationPrompts: string[];
  defaultConclusionTemplate: string;
}

export interface SavedExperimentRun {
  id: string;
  experimentId: string;
  experimentTitle: string;
  runLabel: string;
  createdAt: number;
  updatedAt: number;
  parameters: Record<string, ParameterValue>;
  finalSimTime: number;
  timeUnit: string;
  metrics: Record<string, number | string>;
  seriesHistory: Record<string, SimulationSeriesPoint[]>;
  observations: string;
  conclusion: string;
  notes: string;
  linkedAssetIds: string[];
  pinnedForCompare: boolean;
}

export const EXPERIMENT_DEPARTMENT_LABELS: Record<ExperimentDepartmentId, string> = {
  pharmaceutics: 'Pharmaceutics',
  pharmaceutical_analysis: 'Pharmaceutical Analysis',
  pharmaceutical_chemistry: 'Pharmaceutical Chemistry',
  pharmacology: 'Pharmacology & PK',
  anatomy: 'Anatomy & Physiology',
  microbiology: 'Pharmaceutical Microbiology',
  biotechnology: 'Biotechnology',
  industrial_pharmacy: 'Industrial Pharmacy'
};

export const FIDELITY_LABELS: Record<
  SimulationFidelityLevel,
  { shortLabel: string; badgeText: string; toneClass: string }
> = {
  scientifically_based_calculation: {
    shortLabel: 'Quantitative Scientific Model',
    badgeText: 'Scientifically Based Calculation',
    toneClass: 'text-emerald-700 dark:text-emerald-400'
  },
  simplified_educational_simulation: {
    shortLabel: 'Educational Dynamic Model',
    badgeText: 'Simplified Educational Simulation',
    toneClass: 'text-cyan-700 dark:text-cyan-400'
  },
  qualitative_visualization: {
    shortLabel: 'Qualitative Visualizer',
    badgeText: 'Qualitative Visualization',
    toneClass: 'text-amber-700 dark:text-amber-400'
  },
  illustrative_animation: {
    shortLabel: 'Illustrative Animation',
    badgeText: 'Illustrative Animation',
    toneClass: 'text-slate-600 dark:text-slate-400'
  }
};
