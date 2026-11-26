import { ExperimentDefinition, ParameterValue, SimulationSnapshot } from '../types';

function computeDissolutionState(
  massDissolvedMg: number,
  tMin: number,
  params: Record<string, ParameterValue>
) {
  const doseMg = Math.max(10, Number(params.doseMg) || 500);
  const solubilityMgMl = Math.max(0.05, Number(params.solubilityMgMl) || 1.2);
  const volumeMl = Math.max(100, Number(params.volumeMl) || 900);
  const rpm = Math.max(25, Number(params.rpm) || 50);
  const surfaceAreaCm2 = Math.max(0.2, Number(params.surfaceAreaCm2) || 2.8);
  const tempC = Math.max(20, Math.min(45, Number(params.tempC) || 37));
  const lagMin = Math.max(0, Number(params.lagMin) || 2);
  const enforceSink = Boolean(params.enforceSink);

  // Reference USP II diffusion coefficient scaled gently by Stokes-Einstein temperature relation (T / eta)
  const tempKelvin = tempC + 273.15;
  const refKelvin = 37 + 273.15;
  const diffusivityScale = Math.pow(tempKelvin / refKelvin, 1.8);
  const dEffectiveCm2Min = 0.00042 * diffusivityScale; // ~7e-6 cm2/s * 60

  // Boundary layer thickness scales inversely with sqrt(RPM) per Levich-style agitation correlation
  const boundaryLayerCm = 0.0045 * Math.sqrt(50 / rpm);

  const clampedDissolved = Math.min(doseMg, Math.max(0, massDissolvedMg));
  const remainingFraction = Math.max(0, 1 - clampedDissolved / doseMg);
  const effectiveArea = surfaceAreaCm2 * Math.pow(remainingFraction, 2 / 3);
  const concentrationMgMl = clampedDissolved / volumeMl;

  // Driving concentration gradient (mg/cm3 == mg/mL)
  const effectiveConcentration = enforceSink ? 0 : concentrationMgMl;
  const drivingGradient = Math.max(0, solubilityMgMl - effectiveConcentration);

  const rateMgPerMin =
    tMin < lagMin || remainingFraction <= 1e-6
      ? 0
      : (dEffectiveCm2Min * effectiveArea / boundaryLayerCm) * drivingGradient;

  const pctDissolved = (clampedDissolved / doseMg) * 100;
  const sinkRatio = solubilityMgMl > 0 ? concentrationMgMl / solubilityMgMl : 0;

  return {
    doseMg,
    solubilityMgMl,
    volumeMl,
    rpm,
    tempC,
    lagMin,
    clampedDissolved,
    remainingMg: Math.max(0, doseMg - clampedDissolved),
    pctDissolved,
    concentrationMgL: concentrationMgMl * 1000,
    rateMgPerMin,
    sinkRatio,
    effectiveArea
  };
}

function buildDissolutionWarnings(
  pctDissolved: number,
  sinkRatio: number,
  enforceSink: boolean,
  simTime: number
) {
  const warnings: SimulationSnapshot['warnings'] = [];
  if (!enforceSink && sinkRatio >= 0.333) {
    warnings.push({
      severity: 'warning',
      code: 'NON_SINK_CONDITION',
      message: `Sink condition violated (C/Cs = ${(sinkRatio * 100).toFixed(1)}% >= 33.3%). Dissolution slows as medium approaches saturation.`
    });
  }
  if (simTime >= 45 && pctDissolved < 80) {
    warnings.push({
      severity: 'info',
      code: 'USP_Q_NOT_MET_AT_45',
      message: `At ${simTime.toFixed(1)} min, % dissolved (${pctDissolved.toFixed(1)}%) is below typical USP immediate-release Q = 80% threshold.`
    });
  }
  return warnings;
}

export const dissolutionExperiment: ExperimentDefinition = {
  id: 'exp_dissolution_noyes_whitney',
  code: 'SIM-PH-01',
  title: 'Tablet Drug Dissolution & Noyes–Whitney Kinetics',
  shortTitle: 'USP II Dissolution Kinetics',
  department: 'pharmaceutics',
  difficulty: 'Intermediate',
  estimatedMinutes: 15,
  requires3D: false,
  visualizerKind: 'dissolution_vessel',
  description:
    'Simulate immediate- and slow-dissolving solid dosage form drug release in a USP Apparatus II (paddle) vessel using coupled Noyes–Whitney diffusion and Hixson–Crowell surface-area erosion.',
  scientificPrinciple:
    'Solid drug dissolution is governed by mass transfer across a hydrodynamic stagnant diffusion layer of thickness h surrounding disintegrating granules/tablet surfaces. Increasing agitation (RPM) thins h, while higher aqueous solubility (Cs) or surface area (S) accelerates mass flux until saturation or complete release occurs.',
  objectives: [
    'Quantify how paddle RPM, drug solubility (Cs), dose, and medium volume alter % drug dissolved over time.',
    'Compare sink vs. non-sink conditions (USP requires Cs × V ≥ 3 × Dose for true sink behavior).',
    'Evaluate USP immediate-release Q80 compliance at 30 min and 45 min across parameter changes.'
  ],
  apparatus: [
    {
      name: 'USP Apparatus II (Paddle) Dissolution Tester',
      specification: '900 mL round-bottom borosilicate vessel, stainless steel paddle at 25 ± 2 mm clearance',
      role: 'Maintains reproducible hydrodynamic shear and stagnant layer thickness h'
    },
    {
      name: 'Thermostatted Water Bath',
      specification: '37.0 ± 0.5 °C digital immersion circulator',
      role: 'Simulates physiological gastric/intestinal temperature affecting diffusivity D and solubility'
    },
    {
      name: 'Sampling Cannula & 0.45 µm Filter + UV-Vis Spectrophotometer',
      specification: '5 mL aliquot withdrawal with medium replacement',
      role: 'Quantifies dissolved drug concentration C(t) without undissolved particulate interference'
    }
  ],
  asset3dBindings: [
    {
      slotId: 'dissolution_apparatus',
      roleLabel: 'USP Dissolution Apparatus / Solid Dosage Form',
      description: 'Inspect solid dosage form or dissolution vessel geometry from your 3D Asset Library.',
      optional: true,
      categoryHints: ['pharma_equipment', 'formulation', 'instrument', 'apparatus'],
      departmentHints: ['pharmaceutics', 'industrial_pharmacy', 'quality_assurance'],
      matchKeywords: ['dissolution', 'tablet', 'capsule', 'paddle', 'apparatus', 'beaker', 'flask'],
      recommendedExperimentId: 'exp_dissolution_noyes_whitney',
      recommendedSubjectCode: 'BP102T',
      fallbackVisualId: 'builtin_chemistry_apparatus'
    }
  ],
  safetyNotes: [
    'Verify water bath temperature stabilization at 37.0 ± 0.5 °C before dropping tablets.',
    'Degassing the dissolution medium prevents micro-bubbles from artificially altering effective surface area.',
    'Ensure paddle shaft wobble remains within USP <711> tolerances (≤ 1.0 mm runout).'
  ],
  procedureSteps: [
    'Select a drug/formulation preset or configure Dose (M0), Solubility (Cs), Medium Volume (V), and Paddle Speed (RPM).',
    'Inspect whether USP sink criteria (3 × Dose ≤ Cs × V) are satisfied in the live warnings.',
    'Press Run to observe time-course dissolution (% Dissolved & Concentration), or Step minute-by-minute.',
    'Save a baseline run, modify RPM or Solubility (Cs), run again, and compare Q30 / t50% / t80% in the Compare tab.'
  ],
  fidelity: {
    level: 'scientifically_based_calculation',
    label: 'Scientifically Based Calculation (RK4 ODE)',
    justification:
      'Solves the Noyes–Whitney ordinary differential equation coupled with Hixson–Crowell spherical surface area decay using 4th-order Runge-Kutta integration per step.',
    equations: [
      {
        title: 'Modified Noyes–Whitney Equation',
        formula: 'dM/dt = (D · S(t) / h(RPM)) · (Cs − C(t))',
        variables: 'M = mass dissolved (mg), D = diffusivity (cm²/min), S(t) = effective surface area (cm²), h = boundary layer thickness (cm), Cs = saturation solubility (mg/mL), C(t) = M(t)/V'
      },
      {
        title: 'Hixson–Crowell Geometric Surface Coupling',
        formula: 'S(t) = S₀ · (1 − M(t) / M₀)^(2/3)',
        variables: 'S₀ = initial wetted surface area (cm²), M₀ = initial tablet dose (mg)'
      },
      {
        title: 'Hydrodynamic Boundary Layer Scaling',
        formula: 'h(RPM) = h₅₀ · √(50 / RPM)',
        variables: 'Levich boundary-layer scaling around 50 RPM reference condition'
      }
    ],
    assumptions: [
      'Assumes uniform spherical particle/tablet erosion after the disintegration lag time.',
      'Does not simulate tablet swelling gel layers (HPMC matrix) or pH-dependent precipitation during GI transit.',
      'Default diffusivity D assumes a representative small-molecule API (~200–400 Da) in dilute aqueous medium.'
    ],
    limitations: [
      'Solubility Cs is treated as user-specified at the chosen medium pH rather than computed automatically from pKa and Henderson–Hasselbalch.',
      'Sink-condition toggle forces C(t) ≈ 0 in the driving gradient to allow idealized sink vs. realistic non-sink comparison.'
    ]
  },
  academicContext: {
    course: 'B.Pharm',
    subjectCode: 'BP102T / BP107P',
    subjectTitle: 'Pharmaceutics & Biopharmaceutics Foundations',
    unit: 'Unit III–IV',
    topic: 'Solid Dosage Forms & Dissolution Mass Transfer',
    subtopic: 'Noyes–Whitney Kinetics, Sink Conditions & USP Apparatus II',
    workspaceModuleId: 'general_pharmacy',
    workspaceTab: 'theory',
    studyModeSubjectCode: 'BP102T',
    references: [
      'Indian Pharmacopoeia (IP) General Chapter: Dissolution Test for Tablets and Capsules',
      'USP <711> Dissolution & Sink Condition Specifications',
      'Aulton, M. E., & Taylor, K. M. G. — Aulton’s Pharmaceutics: Dissolution of Solids',
      'Noyes, A. A., & Whitney, W. R. (1897). J. Am. Chem. Soc., 19(12), 930–934'
    ]
  },
  parameters: [
    {
      key: 'doseMg',
      label: 'Tablet Dose (M₀)',
      symbol: 'M₀',
      unit: 'mg',
      type: 'number',
      min: 50,
      max: 1000,
      step: 25,
      precision: 0,
      defaultValue: 500,
      group: 'Dosage Form',
      description: 'Total active pharmaceutical ingredient mass in one tablet.',
      recommendedRange: '100–500 mg'
    },
    {
      key: 'solubilityMgMl',
      label: 'API Solubility (Cₛ)',
      symbol: 'Cₛ',
      unit: 'mg/mL',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.1,
      precision: 2,
      defaultValue: 1.8,
      group: 'Dosage Form',
      description: 'Equilibrium saturation solubility in the dissolution medium.',
      recommendedRange: '0.5–5.0 mg/mL'
    },
    {
      key: 'surfaceAreaCm2',
      label: 'Effective Wetted Area (S₀)',
      symbol: 'S₀',
      unit: 'cm²',
      type: 'number',
      min: 0.5,
      max: 8,
      step: 0.1,
      precision: 1,
      defaultValue: 2.8,
      group: 'Dosage Form',
      description: 'Exposed surface area after initial wetting/disintegration.'
    },
    {
      key: 'lagMin',
      label: 'Disintegration Lag (t_lag)',
      symbol: 't_lag',
      unit: 'min',
      type: 'number',
      min: 0,
      max: 15,
      step: 0.5,
      precision: 1,
      defaultValue: 2.0,
      group: 'Dosage Form',
      description: 'Delay before tablet coating/matrix ruptures and exposes active surface.'
    },
    {
      key: 'volumeMl',
      label: 'Vessel Volume (V)',
      symbol: 'V',
      unit: 'mL',
      type: 'select',
      options: [
        { value: 500, label: '500 mL (Standard Low Volume)' },
        { value: 900, label: '900 mL (Standard USP II)' },
        { value: 1000, label: '1000 mL (Extended Sink Volume)' }
      ],
      defaultValue: 900,
      group: 'Vessel & Medium',
      description: 'Dissolution medium volume inside the USP II vessel.'
    },
    {
      key: 'rpm',
      label: 'Paddle Speed',
      symbol: 'RPM',
      unit: 'rpm',
      type: 'number',
      min: 25,
      max: 150,
      step: 5,
      precision: 0,
      defaultValue: 50,
      group: 'Vessel & Medium',
      description: 'Rotational velocity of the USP II paddle.',
      recommendedRange: '50–75 rpm'
    },
    {
      key: 'tempC',
      label: 'Bath Temperature',
      symbol: 'T',
      unit: '°C',
      type: 'number',
      min: 25,
      max: 42,
      step: 0.5,
      precision: 1,
      defaultValue: 37.0,
      group: 'Vessel & Medium',
      description: 'Water bath temperature (physiological target 37.0 °C).'
    },
    {
      key: 'enforceSink',
      label: 'Idealized Infinite Sink (C ≈ 0)',
      symbol: 'Sink',
      unit: '',
      type: 'boolean',
      defaultValue: false,
      group: 'Model Mode',
      description: 'Disable back-pressure from dissolved C(t) to compare idealized sink vs. finite volume.'
    }
  ],
  presets: [
    {
      id: 'ir_standard',
      label: 'IR Tablet (500 mg, 50 rpm)',
      description: 'Balanced BCS Class I immediate-release profile passing USP Q80 within 30 min.',
      parameters: {
        doseMg: 500,
        solubilityMgMl: 2.2,
        surfaceAreaCm2: 3.0,
        lagMin: 2.0,
        volumeMl: 900,
        rpm: 50,
        tempC: 37.0,
        enforceSink: false
      }
    },
    {
      id: 'poor_bcs2',
      label: 'Poorly Soluble BCS II (Non-Sink)',
      description: 'Low Cs (0.4 mg/mL) causing non-sink plateau before 100% release in 900 mL.',
      parameters: {
        doseMg: 500,
        solubilityMgMl: 0.4,
        surfaceAreaCm2: 2.8,
        lagMin: 3.0,
        volumeMl: 900,
        rpm: 50,
        tempC: 37.0,
        enforceSink: false
      }
    },
    {
      id: 'high_rpm_micronized',
      label: 'Micronized High-Area (100 rpm)',
      description: 'Increased surface area S0 and paddle speed demonstrating rapid dissolution.',
      parameters: {
        doseMg: 250,
        solubilityMgMl: 2.0,
        surfaceAreaCm2: 5.5,
        lagMin: 1.0,
        volumeMl: 900,
        rpm: 100,
        tempC: 37.0,
        enforceSink: false
      }
    }
  ],
  simulation: {
    mode: 'time_series',
    timeUnit: 'min',
    dt: 0.5,
    maxTime: 60,
    defaultSpeed: 1,
    xAxisLabel: 'Time',
    xAxisUnit: 'min',
    yAxisLabel: 'Drug Dissolved',
    yAxisUnit: '%',
    yDomain: [0, 105],
    series: [
      {
        id: 'pct_dissolved',
        label: 'Cumulative % Dissolved',
        unit: '%',
        colorHex: '#10b981',
        referenceLines: [
          { value: 80, label: 'USP Q80 Target (80%)', colorHex: '#f59e0b' }
        ]
      },
      {
        id: 'sink_saturation_pct',
        label: 'Medium Saturation (C / Cₛ %)',
        unit: '%',
        colorHex: '#06b6d4'
      }
    ],
    metrics: [
      { key: 'pctDissolved', label: 'Dissolved (Q)', unit: '%', precision: 1, highlightTone: 'nominal' },
      { key: 'concentrationMgL', label: 'Medium Conc. C(t)', unit: 'mg/L', precision: 1 },
      { key: 'rateMgPerMin', label: 'Dissolution Rate', unit: 'mg/min', precision: 2 },
      { key: 'remainingMg', label: 'Undissolved Mass', unit: 'mg', precision: 1 },
      { key: 't50', label: 't₅₀% (Half-Release)', unit: 'min', precision: 1 },
      { key: 't80', label: 't₈₀% (Q80 Time)', unit: 'min', precision: 1 }
    ],
    init: (params) => {
      const s = computeDissolutionState(0, 0, params);
      const enforceSink = Boolean(params.enforceSink);
      return {
        stepIndex: 0,
        simTime: 0,
        timeUnit: 'min',
        completed: false,
        phaseLabel: s.lagMin > 0 ? 'Pre-Disintegration Lag' : 'Active Dissolution',
        state: {
          massDissolvedMg: 0,
          t50: -1,
          t80: -1
        },
        metrics: {
          pctDissolved: 0,
          concentrationMgL: 0,
          rateMgPerMin: s.rateMgPerMin,
          remainingMg: s.doseMg,
          t50: 'Pending',
          t80: 'Pending'
        },
        seriesHistory: {
          pct_dissolved: [{ x: 0, y: 0 }],
          sink_saturation_pct: [{ x: 0, y: 0 }]
        },
        visualState: {
          remainingFraction: 1,
          pctDissolved: 0,
          rpm: s.rpm,
          tempC: s.tempC,
          sinkRatio: 0,
          inLag: s.lagMin > 0
        },
        warnings: buildDissolutionWarnings(0, 0, enforceSink, 0),
        summaryInterpretation: `Dissolution vessel initialized at ${s.tempC.toFixed(1)} °C and ${s.rpm} RPM (${s.volumeMl} mL medium).`
      };
    },
    step: (snapshot, params, dtOverride) => {
      const dt = dtOverride ?? 0.5;
      const maxTime = 60;
      const nextTime = Math.min(maxTime, snapshot.simTime + dt);
      const actualDt = nextTime - snapshot.simTime;
      const prevMass = Number(snapshot.state.massDissolvedMg) || 0;
      const enforceSink = Boolean(params.enforceSink);

      // Sub-step RK4 integration for numerical stability across steep initial slopes
      const subSteps = 4;
      const hStep = actualDt / subSteps;
      let m = prevMass;
      let t = snapshot.simTime;

      for (let i = 0; i < subSteps; i++) {
        const k1 = computeDissolutionState(m, t, params).rateMgPerMin;
        const k2 = computeDissolutionState(m + 0.5 * hStep * k1, t + 0.5 * hStep, params).rateMgPerMin;
        const k3 = computeDissolutionState(m + 0.5 * hStep * k2, t + 0.5 * hStep, params).rateMgPerMin;
        const k4 = computeDissolutionState(m + hStep * k3, t + hStep, params).rateMgPerMin;
        m = m + (hStep / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        t += hStep;
      }

      const nextState = computeDissolutionState(m, nextTime, params);
      const prevT50 = Number(snapshot.state.t50);
      const prevT80 = Number(snapshot.state.t80);
      const t50 = prevT50 >= 0 ? prevT50 : nextState.pctDissolved >= 50 ? nextTime : -1;
      const t80 = prevT80 >= 0 ? prevT80 : nextState.pctDissolved >= 80 ? nextTime : -1;

      const completed = nextTime >= maxTime || nextState.pctDissolved >= 99.95;
      const phaseLabel =
        nextTime < nextState.lagMin
          ? 'Disintegration Lag'
          : nextState.pctDissolved >= 99.5
          ? 'Complete Dissolution'
          : !enforceSink && nextState.sinkRatio >= 0.85
          ? 'Saturation Plateau'
          : 'Noyes–Whitney Release';

      return {
        stepIndex: snapshot.stepIndex + 1,
        simTime: nextTime,
        timeUnit: 'min',
        completed,
        phaseLabel,
        state: {
          massDissolvedMg: nextState.clampedDissolved,
          t50,
          t80
        },
        metrics: {
          pctDissolved: nextState.pctDissolved,
          concentrationMgL: nextState.concentrationMgL,
          rateMgPerMin: nextState.rateMgPerMin,
          remainingMg: nextState.remainingMg,
          t50: t50 >= 0 ? t50 : 'Pending',
          t80: t80 >= 0 ? t80 : 'Pending'
        },
        seriesHistory: {
          pct_dissolved: [
            ...(snapshot.seriesHistory.pct_dissolved || []),
            { x: nextTime, y: nextState.pctDissolved }
          ],
          sink_saturation_pct: [
            ...(snapshot.seriesHistory.sink_saturation_pct || []),
            { x: nextTime, y: Math.min(100, nextState.sinkRatio * 100) }
          ]
        },
        visualState: {
          remainingFraction: nextState.remainingMg / nextState.doseMg,
          pctDissolved: nextState.pctDissolved,
          rpm: nextState.rpm,
          tempC: nextState.tempC,
          sinkRatio: nextState.sinkRatio,
          inLag: nextTime < nextState.lagMin
        },
        warnings: buildDissolutionWarnings(
          nextState.pctDissolved,
          nextState.sinkRatio,
          enforceSink,
          nextTime
        ),
        summaryInterpretation: `${nextState.pctDissolved.toFixed(1)}% of ${nextState.doseMg} mg dissolved at ${nextTime.toFixed(1)} min (rate ${nextState.rateMgPerMin.toFixed(2)} mg/min, medium saturation ${(nextState.sinkRatio * 100).toFixed(1)}%).`
      };
    }
  },
  observationPrompts: [
    'Record the % dissolved at 15 min, 30 min, and 45 min under 50 RPM vs. 100 RPM.',
    'Note how lowering API solubility (Cs) shifts the system into non-sink saturation.',
    'Identify whether your formulation meets the USP Q80 criterion within 45 min.'
  ],
  defaultConclusionTemplate:
    'Dissolution followed Noyes–Whitney kinetics coupled with shrinking surface area. Higher paddle speed (reduced boundary layer thickness h) and higher solubility Cs increased dM/dt and shortened t80%, whereas non-sink saturation limited complete release.'
};
