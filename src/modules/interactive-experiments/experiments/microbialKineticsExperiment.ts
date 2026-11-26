import { ExperimentDefinition, ParameterValue, SimulationSnapshot } from '../types';

export function computeGrowthRates(
  log10N: number,
  substrateGL: number,
  tHr: number,
  params: Record<string, ParameterValue>
): {
  growthRatePerHr: number;
  tempFactor: number;
  phFactor: number;
  monodTerm: number;
  doublingTimeMin: number;
  carryingLog10: number;
} {
  const tempC = Math.max(10, Math.min(55, Number(params.tempC) || 37));
  const ph = Math.max(3, Math.min(10, Number(params.mediumPh) || 7.0));
  const muMax = Math.max(0.1, Math.min(2.5, Number(params.muMaxPerHr) || 1.2));
  const lagHr = Math.max(0, Math.min(6, Number(params.lagDurationHr) || 1.0));
  const carryingLog10 = Math.max(6, Math.min(11, Number(params.carryingCapLog10) || 9.5));

  // Asymmetric cardinal temperature response peaking at 37 °C (mesophilic bacteria, e.g. E. coli)
  const tempFactor =
    tempC > 48 || tempC < 10
      ? 0
      : Math.exp(-Math.pow((tempC - 37) / (tempC > 37 ? 5.5 : 11.0), 2));

  // Gaussian pH optimum centered at pH 7.0
  const phFactor = Math.exp(-Math.pow((ph - 7.0) / 1.4, 2));

  const ks = 0.25; // g/L Monod half-saturation constant
  const monodTerm = substrateGL > 0 ? substrateGL / (ks + substrateGL) : 0;

  // Smooth lag transition
  const lagGate = lagHr <= 0 ? 1 : 1 / (1 + Math.exp(-(tHr - lagHr) * 3.5));

  const effectiveMu = muMax * tempFactor * phFactor * monodTerm * lagGate;
  const logisticBrake = Math.max(0, 1 - Math.pow(10, log10N - carryingLog10));

  // d(log10 N)/dt = (mu / ln(10)) * (1 - N / K)
  const growthRatePerHr = effectiveMu * logisticBrake;
  const doublingTimeMin = effectiveMu > 0.01 ? (Math.LN2 / effectiveMu) * 60 : Infinity;

  return {
    growthRatePerHr,
    tempFactor,
    phFactor,
    monodTerm,
    doublingTimeMin,
    carryingLog10
  };
}

export function computeThermalDValue(tempC: number, d121Min: number, zTempC: number): number {
  return d121Min * Math.pow(10, (121.1 - tempC) / zTempC);
}

function buildMicrobialWarnings(
  mode: string,
  tempC: number,
  log10N: number,
  salLog: number
): SimulationSnapshot['warnings'] {
  const warnings: SimulationSnapshot['warnings'] = [];
  if (mode === 'growth' && tempC > 46) {
    warnings.push({
      severity: 'warning',
      code: 'THERMAL_INHIBITION',
      message: `Incubation at ${tempC.toFixed(1)} °C exceeds mesophilic thermal limit (~46 °C); enzymatic growth stalls.`
    });
  }
  if (mode === 'sterilization' && log10N > -6 && salLog >= 6) {
    warnings.push({
      severity: 'info',
      code: 'SAL_NOT_YET_ACHIEVED',
      message: 'Pharmacopoeial Sterility Assurance Level (10⁻⁶ CFU, log10 N ≤ −6) not yet achieved; continue exposure or raise steam temperature.'
    });
  }
  return warnings;
}

export const microbialKineticsExperiment: ExperimentDefinition = {
  id: 'exp_microbial_growth_sterilization',
  code: 'SIM-MB-05',
  title: 'Microbial Bioreactor Growth & Moist-Heat Sterilization (D-Value)',
  shortTitle: 'Microbial Growth & Autoclave D-Value',
  department: 'microbiology',
  difficulty: 'Intermediate',
  estimatedMinutes: 14,
  requires3D: false,
  visualizerKind: 'microbial_bioreactor',
  description:
    'Switch between (1) Monod + Logistic microbial fermentation growth (Lag, Log, Stationary phases) and (2) Pharmacopoeial moist-heat autoclave sterilization kinetics (D-value, z-value, F0, and Sterility Assurance Level).',
  scientificPrinciple:
    'Sub-lethal mesophilic bacterial growth follows substrate-limited Monod kinetics modulated by temperature and pH until carrying capacity limits division. Conversely, lethal moist-heat sterilization follows first-order thermal death where every D(T) minutes reduces viable spores by 90% (1 log10), governed by Bigelow’s thermal resistance z-value.',
  objectives: [
    'Distinguish Lag, Exponential (Log), and Stationary growth phases under changing nutrient S0, pH, and temperature.',
    'Calculate Decimal Reduction Time D(T) and lethal equivalent F0 during autoclave sterilization.',
    'Determine minimum cycle duration to reach Pharmacopoeial Sterility Assurance Level SAL ≤ 10⁻⁶.'
  ],
  apparatus: [
    {
      name: 'Benchtop Fermenter / Jacketed Bioreactor (Growth Mode)',
      specification: '1 L stirred vessel with pH probe, RTD temp sensor, and OD600 turbidity meter',
      role: 'Controls optimal growth environment and monitors biomass accumulation'
    },
    {
      name: 'Saturated Steam Autoclave (Sterilization Mode)',
      specification: '121.1 °C (15 psi / 103.4 kPa) pressurized chamber + Geobacillus stearothermophilus indicator',
      role: 'Validates log-reduction F0 and Sterility Assurance Level (SAL 10⁻⁶)'
    }
  ],
  asset3dBindings: [
    {
      slotId: 'microbe_or_bioreactor',
      roleLabel: 'Microorganism / Bioreactor Model (3D)',
      description: 'Inspect bacterial cell envelope / microorganism structures or bioreactor apparatus from the 3D Asset Library.',
      optional: true,
      categoryHints: ['microorganism', 'biotechnology', 'pharma_equipment'],
      departmentHints: ['microbiology', 'biotechnology', 'industrial_pharmacy'],
      matchKeywords: ['bacteria', 'cell', 'microbe', 'bioreactor', 'autoclave', 'fermenter'],
      recommendedSubjectCode: 'BP303T',
      fallbackVisualId: 'builtin_bacterial_cell_wall'
    }
  ],
  safetyNotes: [
    'Autoclave cycles require complete air evacuation before timing holding periods at 121.1 °C.',
    'Biological indicators (Geobacillus stearothermophilus spores) verify true steam penetration in load interiors.'
  ],
  procedureSteps: [
    'Select Fermentation Growth Kinetics or Moist-Heat Sterilization Mode.',
    'Adjust temperature, pH, substrate S0 (growth) or autoclave temperature & D121 (sterilization).',
    'Run the simulation and inspect real-time Log10 CFU/mL and Nutrient/F0 trajectories.',
    'Save two cycles (e.g., 115 °C vs 121.1 °C sterilization) and compare time-to-SAL in Compare.'
  ],
  fidelity: {
    level: 'scientifically_based_calculation',
    label: 'Scientifically Based Calculation (Monod–Logistic & Bigelow Death)',
    justification:
      'Growth mode integrates Monod substrate depletion + logistic saturation; sterilization mode applies exact Bigelow D(T) = D121·10^((121.1−T)/z) exponential log-reduction and F0 lethality.',
    equations: [
      {
        title: 'Monod–Logistic Growth',
        formula: 'dX/dt = μ_max · [S / (Ks + S)] · f(T) · f(pH) · X · (1 − X / X_max)',
        variables: 'X = viable count (CFU/mL), S = substrate (g/L), Ks = half-saturation constant'
      },
      {
        title: 'Bigelow Thermal Sterilization & F₀',
        formula: 'D(T) = D₁₂₁ · 10^((121.1 − T)/z),   log₁₀ N(t) = log₁₀ N₀ − t / D(T)',
        variables: 'D₁₂₁ = decimal reduction time at 121.1 °C (min), z = temp change for 10-fold D change (°C)'
      }
    ],
    assumptions: [
      'Uniform mixing and instantaneous thermal equilibrium (no cold-spot heat-transfer lag inside ampoules).',
      'Represents mesophilic bacterial culture (growth) and heat-resistant bacterial endospores (sterilization).'
    ],
    limitations: [
      'Does not simulate metabolic byproduct inhibition (e.g., lactic acid toxicity) independent of pH setting.',
      'Autoclave mode assumes steady holding temperature without heat-up/cool-down ramp integration.'
    ]
  },
  academicContext: {
    course: 'B.Pharm',
    subjectCode: 'BP303T / Industrial Sterile',
    subjectTitle: 'Pharmaceutical Microbiology & Sterilization',
    unit: 'Unit II–III',
    topic: 'Microbial Growth Curve & Moist-Heat Sterilization Validation',
    subtopic: 'Monod Kinetics, D-Value, z-Value, F0 & Sterility Assurance Level',
    workspaceModuleId: 'study_mode',
    studyModeSubjectCode: 'BP105T',
    references: [
      'Indian Pharmacopoeia (IP) — Methods of Sterilization & Biological Indicators',
      'Pelczar, M. J., Chan, E. C. S., & Krieg, N. R. — Microbiology (Growth Kinetics)',
      'PDA Technical Report No. 1 — Validation of Moist Heat Sterilization Processes'
    ]
  },
  parameters: [
    {
      key: 'processMode',
      label: 'Simulation Mode',
      symbol: 'Mode',
      unit: '',
      type: 'select',
      options: [
        { value: 'growth', label: 'Bioreactor Fermentation Growth (0–16 h)' },
        { value: 'sterilization', label: 'Autoclave Thermal Sterilization (0–30 min)' }
      ],
      defaultValue: 'growth',
      group: 'Process Mode',
      description: 'Choose microbial culture growth or moist-heat spore inactivation.'
    },
    {
      key: 'tempC',
      label: 'Incubation Temperature',
      symbol: 'T',
      unit: '°C',
      type: 'number',
      min: 15,
      max: 50,
      step: 1,
      precision: 1,
      defaultValue: 37,
      group: 'Environment',
      description: 'Bioreactor broth temperature.',
      visibleWhen: (p) => p.processMode === 'growth'
    },
    {
      key: 'mediumPh',
      label: 'Broth pH',
      symbol: 'pH',
      unit: '',
      type: 'number',
      min: 4.0,
      max: 9.0,
      step: 0.2,
      precision: 1,
      defaultValue: 7.0,
      group: 'Environment',
      description: 'Medium pH (mesophilic optimum ~7.0).',
      visibleWhen: (p) => p.processMode === 'growth'
    },
    {
      key: 'muMaxPerHr',
      label: 'Max Growth Rate (μ_max)',
      symbol: 'μ_max',
      unit: 'h⁻¹',
      type: 'number',
      min: 0.2,
      max: 2.0,
      step: 0.1,
      precision: 2,
      defaultValue: 1.2,
      group: 'Kinetics',
      description: 'Intrinsic maximum specific growth rate under optimal broth.',
      visibleWhen: (p) => p.processMode === 'growth'
    },
    {
      key: 'substrateInitialGL',
      label: 'Initial Glucose Substrate (S₀)',
      symbol: 'S₀',
      unit: 'g/L',
      type: 'number',
      min: 0.5,
      max: 15,
      step: 0.5,
      precision: 1,
      defaultValue: 5.0,
      group: 'Kinetics',
      description: 'Limiting carbon source concentration.',
      visibleWhen: (p) => p.processMode === 'growth'
    },
    {
      key: 'lagDurationHr',
      label: 'Lag Phase Duration',
      symbol: 't_lag',
      unit: 'h',
      type: 'number',
      min: 0,
      max: 5,
      step: 0.5,
      precision: 1,
      defaultValue: 1.5,
      group: 'Kinetics',
      description: 'Physiological adaptation window before exponential division.',
      visibleWhen: (p) => p.processMode === 'growth'
    },
    {
      key: 'initialLog10Cfu',
      label: 'Initial Bioburden (log₁₀ N₀)',
      symbol: 'log N₀',
      unit: 'log CFU/mL',
      type: 'number',
      min: 2,
      max: 8,
      step: 0.5,
      precision: 1,
      defaultValue: 5.0,
      group: 'Inoculum / Bioburden',
      description: 'Initial viable population exponent (e.g., 5 = 10⁵ CFU/mL).'
    },
    {
      key: 'carryingCapLog10',
      label: 'Carrying Capacity (log₁₀ K)',
      symbol: 'log K',
      unit: 'log CFU/mL',
      type: 'number',
      min: 7,
      max: 10.5,
      step: 0.5,
      precision: 1,
      defaultValue: 9.5,
      group: 'Inoculum / Bioburden',
      description: 'Maximum sustainable broth cell density.',
      visibleWhen: (p) => p.processMode === 'growth'
    },
    {
      key: 'autoclaveTempC',
      label: 'Sterilization Temperature',
      symbol: 'T_ster',
      unit: '°C',
      type: 'number',
      min: 110,
      max: 134,
      step: 0.5,
      precision: 1,
      defaultValue: 121.1,
      group: 'Autoclave Cycle',
      description: 'Holding chamber steam temperature (standard 121.1 °C).',
      visibleWhen: (p) => p.processMode === 'sterilization'
    },
    {
      key: 'd121Min',
      label: 'Spore D₁₂₁ Value',
      symbol: 'D₁₂₁',
      unit: 'min',
      type: 'number',
      min: 0.5,
      max: 4.0,
      step: 0.1,
      precision: 1,
      defaultValue: 1.5,
      group: 'Autoclave Cycle',
      description: 'Decimal reduction time at 121.1 °C (typical Geobacillus spore ~1.5 min).',
      visibleWhen: (p) => p.processMode === 'sterilization'
    },
    {
      key: 'zTempC',
      label: 'Thermal Resistance z-Value',
      symbol: 'z',
      unit: '°C',
      type: 'number',
      min: 6,
      max: 15,
      step: 0.5,
      precision: 1,
      defaultValue: 10.0,
      group: 'Autoclave Cycle',
      description: 'Temperature increase required for a 10-fold faster D-value.',
      visibleWhen: (p) => p.processMode === 'sterilization'
    }
  ],
  presets: [
    {
      id: 'optimal_fermentation',
      label: 'Optimal Mesophilic Growth (37 °C)',
      description: 'Classic sigmoidal lag → log → stationary growth curve reaching 10⁹.⁵ CFU/mL.',
      parameters: {
        processMode: 'growth',
        tempC: 37,
        mediumPh: 7.0,
        muMaxPerHr: 1.2,
        substrateInitialGL: 5.0,
        lagDurationHr: 1.5,
        initialLog10Cfu: 5.0,
        carryingCapLog10: 9.5
      }
    },
    {
      id: 'autoclave_121',
      label: 'Standard Autoclave (121.1 °C, D=1.5m)',
      description: 'Reaches SAL 10⁻⁶ from 10⁶ bioburden (12 log reduction) in 18 minutes.',
      parameters: {
        processMode: 'sterilization',
        initialLog10Cfu: 6.0,
        autoclaveTempC: 121.1,
        d121Min: 1.5,
        zTempC: 10.0
      }
    },
    {
      id: 'autoclave_115_insufficient',
      label: 'Low-Temp Cycle (115 °C — Sub-SAL)',
      description: 'Demonstrates 4× slower D(T) at 115 °C failing to hit SAL 10⁻⁶ within 20 min.',
      parameters: {
        processMode: 'sterilization',
        initialLog10Cfu: 6.0,
        autoclaveTempC: 115.0,
        d121Min: 1.5,
        zTempC: 10.0
      }
    }
  ],
  simulation: {
    mode: 'time_series',
    timeUnit: 'h / min',
    dt: 0.5,
    maxTime: 16,
    defaultSpeed: 1,
    xAxisLabel: 'Elapsed Process Time',
    xAxisUnit: 'h (growth) / min (autoclave)',
    yAxisLabel: 'Log₁₀ Viable Count',
    yAxisUnit: 'log₁₀ CFU/mL',
    yDomain: [-12, 11],
    series: [
      {
        id: 'log10_viable',
        label: 'log₁₀ Viable Count (CFU/mL)',
        unit: 'log₁₀ CFU/mL',
        colorHex: '#10b981',
        referenceLines: [{ value: -6, label: 'SAL Target (10⁻⁶)', colorHex: '#ef4444' }]
      },
      {
        id: 'secondary_trace',
        label: 'Substrate S (g/L) / F₀ (min)',
        unit: '',
        colorHex: '#f59e0b'
      }
    ],
    metrics: [
      { key: 'log10Viable', label: 'Viable Count (log₁₀)', unit: 'CFU/mL', precision: 2, highlightTone: 'nominal' },
      { key: 'specificRate', label: 'Rate μ / D(T)', unit: '', precision: 2 },
      { key: 'secondaryMetric', label: 'Substrate / F₀ Lethality', unit: '', precision: 2 },
      { key: 'doublingOrSal', label: 'Doubling Time / SAL', unit: '' },
      { key: 'phaseState', label: 'Process Phase', unit: '' }
    ],
    init: (params) => {
      const mode = String(params.processMode || 'growth');
      const log0 = Number(params.initialLog10Cfu) || 5.0;
      if (mode === 'sterilization') {
        const tSter = Number(params.autoclaveTempC) || 121.1;
        const d121 = Number(params.d121Min) || 1.5;
        const z = Number(params.zTempC) || 10;
        const dT = computeThermalDValue(tSter, d121, z);
        return {
          stepIndex: 0,
          simTime: 0,
          timeUnit: 'min',
          completed: false,
          phaseLabel: 'Cycle Start (Hold 0 min)',
          state: { log10N: log0, f0: 0 },
          metrics: {
            log10Viable: log0,
            specificRate: `${dT.toFixed(2)} min D(T)`,
            secondaryMetric: '0.00 min F₀',
            doublingOrSal: `10^${log0.toFixed(1)}`,
            phaseState: 'Active Bioburden Reduction'
          },
          seriesHistory: {
            log10_viable: [{ x: 0, y: log0 }],
            secondary_trace: [{ x: 0, y: 0 }]
          },
          visualState: {
            mode,
            log10N: log0,
            tempC: tSter,
            f0: 0,
            salAchieved: log0 <= -6
          },
          warnings: buildMicrobialWarnings(mode, tSter, log0, 0),
          summaryInterpretation: `Autoclave at ${tSter.toFixed(1)} °C has D(T) = ${dT.toFixed(2)} min. Need ${((log0 + 6) * dT).toFixed(1)} min to achieve SAL 10⁻⁶.`
        };
      }

      const s0 = Number(params.substrateInitialGL) || 5.0;
      const g = computeGrowthRates(log0, s0, 0, params);
      return {
        stepIndex: 0,
        simTime: 0,
        timeUnit: 'h',
        completed: false,
        phaseLabel: Number(params.lagDurationHr) > 0 ? 'Lag Phase' : 'Exponential Growth',
        state: { log10N: log0, substrateGL: s0 },
        metrics: {
          log10Viable: log0,
          specificRate: `${g.growthRatePerHr.toFixed(2)} h⁻¹`,
          secondaryMetric: `${s0.toFixed(2)} g/L`,
          doublingOrSal: Number.isFinite(g.doublingTimeMin) ? `${g.doublingTimeMin.toFixed(1)} min` : 'Stalled',
          phaseState: Number(params.lagDurationHr) > 0 ? 'Lag Phase' : 'Exponential Phase'
        },
        seriesHistory: {
          log10_viable: [{ x: 0, y: log0 }],
          secondary_trace: [{ x: 0, y: s0 }]
        },
        visualState: {
          mode,
          log10N: log0,
          substrateRatio: 1,
          tempC: Number(params.tempC) || 37,
          ph: Number(params.mediumPh) || 7
        },
        warnings: buildMicrobialWarnings(mode, Number(params.tempC) || 37, log0, 0),
        summaryInterpretation: `Inoculum initialized at 10^${log0.toFixed(1)} CFU/mL in ${s0.toFixed(1)} g/L glucose broth.`
      };
    },
    step: (snapshot, params, dtOverride) => {
      const mode = String(params.processMode || 'growth');
      if (mode === 'sterilization') {
        const dtMin = dtOverride ?? 1.0;
        const maxMin = 30;
        const nextT = Math.min(maxMin, snapshot.simTime + dtMin);
        const log0 = Number(params.initialLog10Cfu) || 6.0;
        const tSter = Number(params.autoclaveTempC) || 121.1;
        const d121 = Number(params.d121Min) || 1.5;
        const z = Number(params.zTempC) || 10;
        const dT = computeThermalDValue(tSter, d121, z);
        const log10N = Math.max(-12, log0 - nextT / dT);
        const f0 = nextT * Math.pow(10, (tSter - 121.1) / z);
        const salAchieved = log10N <= -6;
        const phaseState = salAchieved ? 'SAL ≤ 10⁻⁶ Achieved' : 'Thermal Inactivation';

        return {
          stepIndex: snapshot.stepIndex + 1,
          simTime: nextT,
          timeUnit: 'min',
          completed: nextT >= maxMin,
          phaseLabel: phaseState,
          state: { log10N, f0 },
          metrics: {
            log10Viable: log10N,
            specificRate: `${dT.toFixed(2)} min D(T)`,
            secondaryMetric: `${f0.toFixed(2)} min F₀`,
            doublingOrSal: log10N <= -6 ? `PASS (10^${log10N.toFixed(1)})` : `10^${log10N.toFixed(1)}`,
            phaseState
          },
          seriesHistory: {
            log10_viable: [...(snapshot.seriesHistory.log10_viable || []), { x: nextT, y: log10N }],
            secondary_trace: [...(snapshot.seriesHistory.secondary_trace || []), { x: nextT, y: Math.min(40, f0) }]
          },
          visualState: {
            mode,
            log10N,
            tempC: tSter,
            f0,
            salAchieved
          },
          warnings: buildMicrobialWarnings(mode, tSter, log10N, 6),
          summaryInterpretation: `At ${nextT.toFixed(1)} min (${tSter.toFixed(1)} °C): log10 N = ${log10N.toFixed(2)}, F0 = ${f0.toFixed(2)} min.`
        };
      }

      // Growth mode
      const dtHr = dtOverride ?? 0.5;
      const maxHr = 16;
      const nextHr = Math.min(maxHr, snapshot.simTime + dtHr);
      const actualDt = nextHr - snapshot.simTime;
      let logN = Number(snapshot.state.log10N) || 5.0;
      let sub = Number(snapshot.state.substrateGL) || 5.0;

      const subSteps = 4;
      const hStep = actualDt / subSteps;
      let curT = snapshot.simTime;
      const yieldFactor = 1e9; // cells/mL per g/L substrate consumed roughly
      for (let i = 0; i < subSteps; i++) {
        const g = computeGrowthRates(logN, sub, curT, params);
        const dLogN = g.growthRatePerHr / Math.LN10;
        const nNow = Math.pow(10, logN);
        const nNext = Math.pow(10, Math.min(g.carryingLog10, logN + dLogN * hStep));
        const deltaN = Math.max(0, nNext - nNow);
        sub = Math.max(0, sub - deltaN / yieldFactor);
        logN = Math.min(g.carryingLog10, logN + dLogN * hStep);
        curT += hStep;
      }

      const gFinal = computeGrowthRates(logN, sub, nextHr, params);
      const lagHr = Number(params.lagDurationHr) || 1.0;
      const phaseState =
        nextHr < lagHr
          ? 'Lag Phase'
          : logN >= gFinal.carryingLog10 - 0.15 || sub <= 0.05
          ? 'Stationary Phase'
          : 'Exponential (Log) Phase';

      return {
        stepIndex: snapshot.stepIndex + 1,
        simTime: nextHr,
        timeUnit: 'h',
        completed: nextHr >= maxHr,
        phaseLabel: phaseState,
        state: { log10N: logN, substrateGL: sub },
        metrics: {
          log10Viable: logN,
          specificRate: `${gFinal.growthRatePerHr.toFixed(2)} h⁻¹`,
          secondaryMetric: `${sub.toFixed(2)} g/L`,
          doublingOrSal: Number.isFinite(gFinal.doublingTimeMin) ? `${gFinal.doublingTimeMin.toFixed(1)} min` : 'Stationary',
          phaseState
        },
        seriesHistory: {
          log10_viable: [...(snapshot.seriesHistory.log10_viable || []), { x: nextHr, y: logN }],
          secondary_trace: [...(snapshot.seriesHistory.secondary_trace || []), { x: nextHr, y: sub }]
        },
        visualState: {
          mode,
          log10N: logN,
          substrateRatio: sub / Math.max(0.1, Number(params.substrateInitialGL) || 5.0),
          tempC: Number(params.tempC) || 37,
          ph: Number(params.mediumPh) || 7
        },
        warnings: buildMicrobialWarnings(mode, Number(params.tempC) || 37, logN, 0),
        summaryInterpretation: `At ${nextHr.toFixed(1)} h (${phaseState}): log10 N = ${logN.toFixed(2)}, remaining glucose = ${sub.toFixed(2)} g/L.`
      };
    }
  },
  observationPrompts: [
    'Measure the doubling time td during exponential growth at 37 °C vs. 25 °C.',
    'In Autoclave mode, record the exact time required to drop from 10⁶ CFU/mL to 10⁻⁶ CFU/mL at 121.1 °C vs. 115 °C.'
  ],
  defaultConclusionTemplate:
    'Culture density followed Monod–logistic dynamics bounded by substrate availability and thermal/pH optima. Thermal sterilization followed first-order log reduction with temperature sensitivity governed by the z-value.'
};
