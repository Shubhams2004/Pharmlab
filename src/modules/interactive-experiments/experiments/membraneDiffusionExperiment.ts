import { ExperimentDefinition, ParameterValue, SimulationSnapshot } from '../types';

/**
 * Computes exact Crank/Fick series solution for cumulative solute permeated Q(t) across
 * a planar homogeneous membrane of thickness h (cm) from constant donor Cd into sink receptor.
 */
export function evaluateFickMembranePermeation(
  tMin: number,
  params: Record<string, ParameterValue>
): {
  fluxJssUgCm2Hr: number;
  permeabilityCmHr: number;
  lagTimeMin: number;
  cumulativePermeatedMg: number;
  receptorConcMgL: number;
  pctDosePermeated: number;
} {
  const donorConcMgMl = Math.max(0.5, Number(params.donorConcMgMl) || 10);
  const thicknessUm = Math.max(20, Number(params.thicknessUm) || 150);
  const diffusivityE6 = Math.max(0.2, Number(params.diffusivityE6Cm2S) || 2.0); // x1e-6 cm2/s
  const partitionKp = Math.max(0.1, Number(params.partitionKp) || 1.5);
  const areaCm2 = Math.max(0.5, Number(params.areaCm2) || 2.0);
  const donorVolMl = Math.max(1, Number(params.donorVolMl) || 5.0);
  const receptorVolMl = Math.max(5, Number(params.receptorVolMl) || 20.0);

  const hCm = thicknessUm * 1e-4;
  const dCm2PerSec = diffusivityE6 * 1e-6;
  const dCm2PerMin = dCm2PerSec * 60;
  const tSec = tMin * 60;

  const permeabilityCmSec = (dCm2PerSec * partitionKp) / hCm;
  const permeabilityCmHr = permeabilityCmSec * 3600;
  const fluxJssMgCm2Hr = permeabilityCmHr * donorConcMgMl;
  const fluxJssUgCm2Hr = fluxJssMgCm2Hr * 1000;

  const lagTimeSec = (hCm * hCm) / (6 * dCm2PerSec);
  const lagTimeMin = lagTimeSec / 60;

  // Fourier series transient term: sum_{n=1..8} ((-1)^n / n^2) * exp(-D * n^2 * pi^2 * t / h^2)
  let transientSum = 0;
  for (let n = 1; n <= 8; n++) {
    const sign = n % 2 === 0 ? 1 : -1;
    const exponent = -(dCm2PerMin * n * n * Math.PI * Math.PI * tMin) / (hCm * hCm);
    transientSum += (sign / (n * n)) * Math.exp(Math.max(-60, exponent));
  }

  // Q(t) per unit (A * Cd * Kp * h) -> physical units: mg
  const preFactor = areaCm2 * donorConcMgMl * partitionKp * hCm;
  const dimlessTime = (dCm2PerMin * tMin) / (hCm * hCm);
  const rawPermeatedMg = Math.max(0, preFactor * (dimlessTime - 1 / 6 - (2 / (Math.PI * Math.PI)) * transientSum));

  const maxDonorMassMg = donorConcMgMl * donorVolMl;
  const cumulativePermeatedMg = Math.min(maxDonorMassMg, rawPermeatedMg);
  const receptorConcMgL = (cumulativePermeatedMg / receptorVolMl) * 1000;
  const pctDosePermeated = (cumulativePermeatedMg / maxDonorMassMg) * 100;

  return {
    fluxJssUgCm2Hr,
    permeabilityCmHr,
    lagTimeMin,
    cumulativePermeatedMg,
    receptorConcMgL,
    pctDosePermeated
  };
}

function buildDiffusionWarnings(
  lagTimeMin: number,
  pctPermeated: number
): SimulationSnapshot['warnings'] {
  const warnings: SimulationSnapshot['warnings'] = [];
  if (lagTimeMin > 45) {
    warnings.push({
      severity: 'info',
      code: 'LONG_LAG_TIME',
      message: `Predicted lag time (${lagTimeMin.toFixed(1)} min) exceeds 45 min due to thick membrane or low diffusivity; steady-state flux establishes slowly.`
    });
  }
  if (pctPermeated >= 30) {
    warnings.push({
      severity: 'warning',
      code: 'DONOR_DEPLETION_APPROX',
      message: `Over ${pctPermeated.toFixed(1)}% of donor mass has permeated; constant-donor infinite-dose approximation becomes less accurate above ~25% depletion.`
    });
  }
  return warnings;
}

export const membraneDiffusionExperiment: ExperimentDefinition = {
  id: 'exp_fick_diffusion_membrane',
  code: 'SIM-DF-06',
  title: 'Franz Diffusion Cell & Fickian Membrane Permeation',
  shortTitle: 'Fickian Membrane Permeation',
  department: 'industrial_pharmacy',
  difficulty: 'Intermediate',
  estimatedMinutes: 14,
  requires3D: false,
  visualizerKind: 'filtration_diffusion',
  description:
    'Quantify transdermal and polymeric membrane drug permeation in a Franz diffusion cell using Fick’s First and Second Laws, observing transient burst/lag-time buildup into steady-state flux Jss.',
  scientificPrinciple:
    'Before reaching linear steady-state transport Jss = (D·Kp/h)·Cd, diffusing drug molecules must saturate the membrane matrix over a characteristic lag time t_lag = h²/(6D). Increasing membrane thickness h increases lag time quadratically while inversely reducing steady-state flux.',
  objectives: [
    'Separate lag-time transient hydration/diffusion (h²/6D) from steady-state permeation slope Jss.',
    'Observe the quadratic impact of membrane thickness h on lag time vs. its linear inverse effect on flux.',
    'Optimize partition coefficient Kp and donor concentration Cd for transdermal delivery targets.'
  ],
  apparatus: [
    {
      name: 'Vertical Franz Diffusion Cell',
      specification: '2.0 cm² effective diffusion cross-section, donor cap + 20 mL receptor chamber',
      role: 'Holds synthetic cellulose/silicone membrane or excised skin barrier between compartments'
    },
    {
      name: 'PTFE Magnetic Stirrer & 32 °C Skin-Surface Water Jacket',
      specification: '600 rpm receptor mixing, 32.0 ± 0.5 °C',
      role: 'Maintains receptor homogeneity and sink gradient across underside of membrane'
    }
  ],
  asset3dBindings: [
    {
      slotId: 'diffusion_cell_or_molecule',
      roleLabel: 'Franz Cell / Membrane / Permeant Molecule (3D)',
      description: 'Inspect permeant molecule or pharmaceutical diffusion apparatus from your 3D library.',
      optional: true,
      categoryHints: ['pharma_equipment', 'molecule', 'apparatus'],
      departmentHints: ['pharmaceutics', 'industrial_pharmacy', 'biotechnology'],
      matchKeywords: ['diffusion', 'franz', 'membrane', 'patch', 'transdermal', 'molecule'],
      recommendedSubjectCode: 'BP102T',
      fallbackVisualId: 'builtin_aspirin_molecule'
    }
  ],
  safetyNotes: [
    'Eliminate air bubbles beneath the membrane in the receptor arm before starting sampling.',
    'Replace each withdrawn receptor aliquot with equal fresh thermostatted buffer.'
  ],
  procedureSteps: [
    'Configure membrane thickness h (µm), diffusivity D, partition coefficient Kp, and donor concentration Cd.',
    'Press Run over 240 min and observe how cumulative Q(t) curves upwards during t_lag before turning strictly linear.',
    'Extrapolate the linear steady-state asymptote backward to the x-axis intercept to verify t_lag = h²/(6D).'
  ],
  fidelity: {
    level: 'scientifically_based_calculation',
    label: 'Scientifically Based Calculation (Crank–Fick Series)',
    justification:
      'Evaluates the 8-term Fourier series solution of Fick’s Second Law for a planar barrier with constant donor concentration and sink receptor boundary conditions.',
    equations: [
      {
        title: 'Steady-State Flux & Permeability',
        formula: 'J_ss = (D · K_p / h) · C_donor ,   P_eff = D · K_p / h',
        variables: 'D = diffusivity (cm²/s), Kp = membrane/vehicle partition coeff, h = thickness (cm)'
      },
      {
        title: 'Time-Lag Relationship (Daynes–Barrer)',
        formula: 't_lag = h² / (6 · D)',
        variables: 'x-intercept of the steady-state cumulative permeation line'
      }
    ],
    assumptions: [
      'Infinite-dose donor concentration Cd and sink receptor (Cr ≪ Cd) with no stagnant boundary layer outside the membrane.',
      'Homogeneous isotropic barrier without active transporter saturation or skin metabolism.'
    ],
    limitations: [
      'Once cumulative permeated mass exceeds ~25% of initial donor mass, real finite-dose donor depletion would flatten flux sooner than modeled here.'
    ]
  },
  academicContext: {
    course: 'B.Pharm',
    subjectCode: 'BP102T / Physical Pharmaceutics',
    subjectTitle: 'Physical Pharmaceutics & Novel Drug Delivery',
    unit: 'Unit IV–V',
    topic: 'Diffusion, Membrane Permeation & Transdermal Delivery',
    subtopic: 'Fick’s Laws, Steady-State Flux Jss & Lag Time',
    workspaceModuleId: 'general_pharmacy',
    workspaceTab: 'theory',
    studyModeSubjectCode: 'BP102T',
    references: [
      'Sinko, P. J. — Martin’s Physical Pharmacy and Pharmaceutical Sciences (Diffusion Chapter)',
      'Crank, J. — The Mathematics of Diffusion (Plane Sheet Time-Lag Solution)',
      'OECD Test Guideline 428: Skin Absorption In Vitro Franz Diffusion Method'
    ]
  },
  parameters: [
    {
      key: 'donorConcMgMl',
      label: 'Donor Concentration (Cd)',
      symbol: 'Cd',
      unit: 'mg/mL',
      type: 'number',
      min: 1,
      max: 50,
      step: 1,
      precision: 1,
      defaultValue: 10.0,
      group: 'Formulation',
      description: 'Solute concentration in donor vehicle.'
    },
    {
      key: 'partitionKp',
      label: 'Partition Coefficient (Kp)',
      symbol: 'Kp',
      unit: '',
      type: 'number',
      min: 0.2,
      max: 8.0,
      step: 0.1,
      precision: 1,
      defaultValue: 1.5,
      group: 'Formulation',
      description: 'Membrane-to-vehicle equilibrium distribution coefficient.'
    },
    {
      key: 'thicknessUm',
      label: 'Membrane Thickness (h)',
      symbol: 'h',
      unit: 'µm',
      type: 'number',
      min: 40,
      max: 500,
      step: 10,
      precision: 0,
      defaultValue: 150,
      group: 'Barrier Membrane',
      description: 'Effective path length of membrane barrier.'
    },
    {
      key: 'diffusivityE6Cm2S',
      label: 'Diffusivity (D × 10⁻⁶)',
      symbol: 'D',
      unit: '×10⁻⁶ cm²/s',
      type: 'number',
      min: 0.2,
      max: 8.0,
      step: 0.2,
      precision: 1,
      defaultValue: 1.5,
      group: 'Barrier Membrane',
      description: 'Effective diffusion coefficient inside barrier.'
    },
    {
      key: 'areaCm2',
      label: 'Exposed Area (A)',
      symbol: 'A',
      unit: 'cm²',
      type: 'number',
      min: 0.5,
      max: 5.0,
      step: 0.25,
      precision: 2,
      defaultValue: 2.0,
      group: 'Franz Cell',
      description: 'Orifice area of Franz diffusion chamber.'
    },
    {
      key: 'donorVolMl',
      label: 'Donor Volume',
      symbol: 'Vd',
      unit: 'mL',
      type: 'number',
      min: 1,
      max: 15,
      step: 1,
      precision: 0,
      defaultValue: 5,
      group: 'Franz Cell',
      description: 'Loaded donor chamber volume.'
    },
    {
      key: 'receptorVolMl',
      label: 'Receptor Volume (Vr)',
      symbol: 'Vr',
      unit: 'mL',
      type: 'number',
      min: 10,
      max: 50,
      step: 5,
      precision: 0,
      defaultValue: 20,
      group: 'Franz Cell',
      description: 'Receptor chamber buffer volume.'
    }
  ],
  presets: [
    {
      id: 'standard_synthetic',
      label: 'Standard Cellulose Membrane (150 µm)',
      description: 'Moderate lag time (~2.5 min) with crisp steady-state permeation slope.',
      parameters: {
        donorConcMgMl: 10,
        partitionKp: 1.5,
        thicknessUm: 150,
        diffusivityE6Cm2S: 1.5,
        areaCm2: 2.0,
        donorVolMl: 5,
        receptorVolMl: 20
      }
    },
    {
      id: 'thick_stratum_barrier',
      label: 'Thick Low-D Polymeric Barrier (400 µm)',
      description: 'Demonstrates quadratic lag-time growth (~44 min) and suppressed flux.',
      parameters: {
        donorConcMgMl: 10,
        partitionKp: 1.2,
        thicknessUm: 400,
        diffusivityE6Cm2S: 0.1,
        areaCm2: 2.0,
        donorVolMl: 5,
        receptorVolMl: 20
      }
    }
  ],
  simulation: {
    mode: 'time_series',
    timeUnit: 'min',
    dt: 2,
    maxTime: 240,
    defaultSpeed: 1,
    xAxisLabel: 'Time',
    xAxisUnit: 'min',
    yAxisLabel: 'Cumulative Permeated Mass',
    yAxisUnit: 'mg',
    series: [
      {
        id: 'cumulative_mg',
        label: 'Cumulative Permeated Q(t)',
        unit: 'mg',
        colorHex: '#8b5cf6'
      }
    ],
    metrics: [
      { key: 'cumulativeMg', label: 'Cumulative Q(t)', unit: 'mg', precision: 2, highlightTone: 'nominal' },
      { key: 'fluxUgCm2Hr', label: 'Steady-State Flux Jss', unit: 'µg/cm²/h', precision: 1 },
      { key: 'lagTimeMin', label: 'Lag Time (t_lag)', unit: 'min', precision: 2 },
      { key: 'permeabilityCmHr', label: 'Permeability P_eff', unit: 'cm/h', precision: 4 },
      { key: 'receptorConcMgL', label: 'Receptor Conc.', unit: 'mg/L', precision: 1 },
      { key: 'pctPermeated', label: 'Donor Depleted', unit: '%', precision: 1 }
    ],
    init: (params) => {
      const f = evaluateFickMembranePermeation(0, params);
      return {
        stepIndex: 0,
        simTime: 0,
        timeUnit: 'min',
        completed: false,
        phaseLabel: 'Membrane Hydration / Lag Phase',
        state: {},
        metrics: {
          cumulativeMg: 0,
          fluxUgCm2Hr: f.fluxJssUgCm2Hr,
          lagTimeMin: f.lagTimeMin,
          permeabilityCmHr: f.permeabilityCmHr,
          receptorConcMgL: 0,
          pctPermeated: 0
        },
        seriesHistory: {
          cumulative_mg: [{ x: 0, y: 0 }]
        },
        visualState: {
          cumulativeMg: 0,
          pctPermeated: 0,
          thicknessUm: Number(params.thicknessUm) || 150,
          fluxUgCm2Hr: f.fluxJssUgCm2Hr,
          inLag: f.lagTimeMin > 1
        },
        warnings: buildDiffusionWarnings(f.lagTimeMin, 0),
        summaryInterpretation: `Predicted steady-state flux Jss = ${f.fluxJssUgCm2Hr.toFixed(1)} µg/cm²/h with lag time t_lag = ${f.lagTimeMin.toFixed(2)} min.`
      };
    },
    step: (snapshot, params, dtOverride) => {
      const dt = dtOverride ?? 2;
      const maxTime = 240;
      const nextTime = Math.min(maxTime, snapshot.simTime + dt);
      const f = evaluateFickMembranePermeation(nextTime, params);
      const phaseLabel =
        nextTime < f.lagTimeMin * 1.5
          ? 'Transient Lag Buildup'
          : 'Steady-State Fickian Flux';

      return {
        stepIndex: snapshot.stepIndex + 1,
        simTime: nextTime,
        timeUnit: 'min',
        completed: nextTime >= maxTime,
        phaseLabel,
        state: {},
        metrics: {
          cumulativeMg: f.cumulativePermeatedMg,
          fluxUgCm2Hr: f.fluxJssUgCm2Hr,
          lagTimeMin: f.lagTimeMin,
          permeabilityCmHr: f.permeabilityCmHr,
          receptorConcMgL: f.receptorConcMgL,
          pctPermeated: f.pctDosePermeated
        },
        seriesHistory: {
          cumulative_mg: [
            ...(snapshot.seriesHistory.cumulative_mg || []),
            { x: nextTime, y: f.cumulativePermeatedMg }
          ]
        },
        visualState: {
          cumulativeMg: f.cumulativePermeatedMg,
          pctPermeated: f.pctDosePermeated,
          thicknessUm: Number(params.thicknessUm) || 150,
          fluxUgCm2Hr: f.fluxJssUgCm2Hr,
          inLag: nextTime < f.lagTimeMin
        },
        warnings: buildDiffusionWarnings(f.lagTimeMin, f.pctDosePermeated),
        summaryInterpretation: `At ${nextTime.toFixed(0)} min: Q(t) = ${f.cumulativePermeatedMg.toFixed(2)} mg permeated (${f.pctDosePermeated.toFixed(1)}% of donor), receptor = ${f.receptorConcMgL.toFixed(1)} mg/L.`
      };
    }
  },
  observationPrompts: [
    'Double membrane thickness h from 150 µm to 300 µm and verify that Jss halves while t_lag quadruples.',
    'Record cumulative Q(t) at 60, 120, 180, and 240 min to confirm linear steady-state slope.'
  ],
  defaultConclusionTemplate:
    'Membrane permeation followed Fickian kinetics: steady-state flux scaled directly with D·Kp·Cd/h, while the initial transient delay scaled quadratically with barrier thickness (t_lag = h²/6D).'
};
