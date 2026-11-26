import { ExperimentDefinition, ParameterValue, SimulationSnapshot } from '../types';

const KW = 1e-14;

/**
 * Exact monoprotic charge-balance solver via bisection on pH in [0, 14].
 * Handles both strong acid (completely dissociated) and weak acid (Ka = 10^-pKa)
 * titrated with strong monoprotic base (NaOH).
 * Charge balance: [H+] + [Na+] - [OH-] - [A-] = 0
 */
export function solveMonoproticAcidTitrationPh(opts: {
  acidMode: 'strong' | 'weak';
  pKa: number;
  acidMolarity: number;
  acidVolMl: number;
  baseMolarity: number;
  baseVolMl: number;
}): {
  ph: number;
  poh: number;
  equivalenceVolMl: number;
  bufferCapacity: number;
  fractionTitrated: number;
} {
  const { acidMode, pKa, acidMolarity, acidVolMl, baseMolarity, baseVolMl } = opts;
  const totalVol = Math.max(1e-6, acidVolMl + baseVolMl);
  const caDil = (acidMolarity * acidVolMl) / totalVol;
  const cbDil = (baseMolarity * baseVolMl) / totalVol;
  const equivalenceVolMl = baseMolarity > 0 ? (acidMolarity * acidVolMl) / baseMolarity : 0;
  const ka = Math.pow(10, -pKa);

  const chargeError = (ph: number): number => {
    const h = Math.pow(10, -ph);
    const oh = KW / h;
    const aMinus = acidMode === 'strong' ? caDil : caDil * (ka / (h + ka));
    return h + cbDil - oh - aMinus;
  };

  let lo = 0.0;
  let hi = 14.0;
  for (let i = 0; i < 64; i++) {
    const mid = 0.5 * (lo + hi);
    // chargeError is strictly monotonically decreasing with pH
    if (chargeError(mid) > 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const ph = 0.5 * (lo + hi);
  const hFinal = Math.pow(10, -ph);
  const ohFinal = KW / hFinal;
  const bufferTerm =
    acidMode === 'weak' ? (caDil * ka * hFinal) / Math.pow(ka + hFinal, 2) : 0;
  const bufferCapacity = 2.302585 * (bufferTerm + hFinal + ohFinal);

  return {
    ph,
    poh: 14 - ph,
    equivalenceVolMl,
    bufferCapacity,
    fractionTitrated: equivalenceVolMl > 0 ? baseVolMl / equivalenceVolMl : 0
  };
}

function resolveAcidSettings(params: Record<string, ParameterValue>): {
  acidMode: 'strong' | 'weak';
  pKa: number;
  acidLabel: string;
} {
  const preset = String(params.acidSystem || 'acetic');
  if (preset === 'hcl') return { acidMode: 'strong', pKa: -6.3, acidLabel: 'HCl (Strong Acid)' };
  if (preset === 'aspirin') return { acidMode: 'weak', pKa: 3.5, acidLabel: 'Acetylsalicylic Acid (pKa 3.50)' };
  if (preset === 'benzoic') return { acidMode: 'weak', pKa: 4.2, acidLabel: 'Benzoic Acid (pKa 4.20)' };
  if (preset === 'acetic') return { acidMode: 'weak', pKa: 4.76, acidLabel: 'Acetic Acid (pKa 4.76)' };
  return {
    acidMode: 'weak',
    pKa: Math.max(1.5, Math.min(10.5, Number(params.customPka) || 4.76)),
    acidLabel: `Weak Acid (pKa ${(Number(params.customPka) || 4.76).toFixed(2)})`
  };
}

function evaluateIndicatorColor(ph: number, indicator: string): {
  stateLabel: string;
  hexColor: string;
  suitableNote: string;
} {
  if (indicator === 'methyl_orange') {
    if (ph < 3.1) return { stateLabel: 'Red (Acidic Form)', hexColor: '#ef4444', suitableNote: 'Transition pH 3.1–4.4' };
    if (ph <= 4.4) return { stateLabel: 'Orange Transition Endpoint', hexColor: '#f97316', suitableNote: 'In transition range 3.1–4.4' };
    return { stateLabel: 'Yellow (Alkaline Form)', hexColor: '#eab308', suitableNote: 'Transition pH 3.1–4.4' };
  }
  if (indicator === 'bromothymol_blue') {
    if (ph < 6.0) return { stateLabel: 'Yellow (Acidic Form)', hexColor: '#eab308', suitableNote: 'Transition pH 6.0–7.6' };
    if (ph <= 7.6) return { stateLabel: 'Emerald Green (Neutral Transition)', hexColor: '#10b981', suitableNote: 'In transition range 6.0–7.6' };
    return { stateLabel: 'Deep Blue (Alkaline Form)', hexColor: '#2563eb', suitableNote: 'Transition pH 6.0–7.6' };
  }
  // phenolphthalein default
  if (ph < 8.2) return { stateLabel: 'Colorless (Acidic/Neutral)', hexColor: '#bae6fd', suitableNote: 'Transition pH 8.2–10.0' };
  if (ph <= 9.6) return { stateLabel: 'Pale Pink Endpoint', hexColor: '#f472b6', suitableNote: 'In transition range 8.2–10.0' };
  return { stateLabel: 'Deep Magenta (Over-titrated)', hexColor: '#db2777', suitableNote: 'Past transition > 10.0' };
}

function buildTitrationState(volMl: number, prevPh: number | null, prevVol: number | null, params: Record<string, ParameterValue>) {
  const { acidMode, pKa } = resolveAcidSettings(params);
  const acidMolarity = Math.max(0.02, Number(params.acidMolarity) || 0.1);
  const acidVolMl = Math.max(10, Number(params.acidVolMl) || 25);
  const baseMolarity = Math.max(0.02, Number(params.baseMolarity) || 0.1);
  const indicator = String(params.indicator || 'phenolphthalein');

  const solved = solveMonoproticAcidTitrationPh({
    acidMode,
    pKa,
    acidMolarity,
    acidVolMl,
    baseMolarity,
    baseVolMl: volMl
  });

  const dPhDv =
    prevPh !== null && prevVol !== null && volMl > prevVol
      ? (solved.ph - prevPh) / (volMl - prevVol)
      : 0;

  const ind = evaluateIndicatorColor(solved.ph, indicator);

  const warnings: SimulationSnapshot['warnings'] = [];
  if (acidMode === 'weak' && indicator === 'methyl_orange' && solved.equivalenceVolMl > 0) {
    warnings.push({
      severity: 'warning',
      code: 'INDICATOR_MISMATCH',
      message:
        'Methyl Orange (pH 3.1–4.4) changes before the weak-acid equivalence point (~pH 8.5–9.0). Use Phenolphthalein for accurate endpoint detection.'
    });
  }
  if (solved.equivalenceVolMl > 50) {
    warnings.push({
      severity: 'info',
      code: 'EXCEEDS_50ML_BURETTE',
      message: `Theoretical equivalence volume (${solved.equivalenceVolMl.toFixed(2)} mL) exceeds a standard 50 mL burette; refill or increase titrant molarity.`
    });
  }

  const regionLabel =
    Math.abs(volMl - solved.equivalenceVolMl) <= 0.35
      ? 'Equivalence Point Region'
      : volMl < solved.equivalenceVolMl
      ? acidMode === 'weak' && Math.abs(volMl - 0.5 * solved.equivalenceVolMl) <= 1.2
        ? 'Half-Equivalence Buffer Zone (pH ≈ pKa)'
        : 'Pre-Equivalence Acidic/Buffer Region'
      : 'Post-Equivalence Alkaline Excess';

  return {
    ...solved,
    dPhDv,
    ind,
    acidMode,
    pKa,
    acidVolMl,
    regionLabel,
    warnings
  };
}

export const titrationExperiment: ExperimentDefinition = {
  id: 'exp_acid_base_titration',
  code: 'SIM-AN-02',
  title: 'Acid–Base Volumetric Titration & Buffer Curve Engine',
  shortTitle: 'pH Titration & Buffer Curve',
  department: 'pharmaceutical_analysis',
  difficulty: 'Foundational',
  estimatedMinutes: 12,
  requires3D: false,
  visualizerKind: 'titration_burette',
  description:
    'Perform a quantitative acid–base titration from a 50 mL graduated burette using exact proton-charge balance equilibria across strong and weak pharmaceutical acids (HCl, Acetic Acid, Aspirin, Benzoic Acid).',
  scientificPrinciple:
    'Solution pH throughout volumetric neutralization follows electroneutrality ([H⁺] + [Na⁺] = [OH⁻] + [A⁻]). Weak acids exhibit maximum buffer capacity β at the half-equivalence point where pH = pKa and [HA] = [A⁻], followed by a sharp equivalence jump at Ve = (Ca·Va)/Cb whose inflection pH exceeds 7.0.',
  objectives: [
    'Contrast strong-acid vs. weak-acid neutralization curves, initial pH, and equivalence inflection sharpness.',
    'Observe the Henderson–Hasselbalch buffer plateau and peak buffer capacity β near V = ½ Ve (pH = pKa).',
    'Select an indicator whose transition interval aligns with the steep equivalence pH jump.'
  ],
  apparatus: [
    {
      name: '50 mL Class A Graduated Burette',
      specification: 'Borosilicate PTFE stopcock, ±0.05 mL tolerance',
      role: 'Delivers standardized NaOH titrant accurately in 0.5 mL increments'
    },
    {
      name: '250 mL Erlenmeyer Titration Flask',
      specification: 'Conical neck for swirl mixing without splashing',
      role: 'Holds measured analyte acid aliquot and colorimetric indicator'
    },
    {
      name: 'Calibrated Glass Electrode pH Meter',
      specification: 'Two-point standardized (pH 4.00 / 7.00 / 10.00)',
      role: 'Monitors electromotive potential / pH continuously across titration'
    }
  ],
  asset3dBindings: [
    {
      slotId: 'titration_glassware',
      roleLabel: 'Volumetric Burette & Titration Glassware',
      description: 'Inspect 3D volumetric glassware or chemistry apparatus models linked in your library.',
      optional: true,
      categoryHints: ['apparatus', 'chemistry', 'instrument'],
      departmentHints: ['pharmaceutical_analysis', 'pharmaceutical_chemistry'],
      matchKeywords: ['burette', 'titration', 'flask', 'glassware', 'beaker', 'ph'],
      recommendedExperimentId: 'bp111p_tit',
      recommendedSubjectCode: 'BP106T',
      fallbackVisualId: 'builtin_chemistry_apparatus'
    }
  ],
  safetyNotes: [
    'Standardize NaOH against primary-standard KHP before assaying pharmaceutical acids.',
    'Wear safety goggles when handling corrosive acids and caustic alkali titrants.',
    'Rinse the pH electrode gently with distilled water when transferring between buffers.'
  ],
  procedureSteps: [
    'Choose an acid system (e.g., Acetic Acid pKa 4.76 or Aspirin pKa 3.50), molarities, and indicator.',
    'Press Run to add NaOH titrant continuously from 0 to 50 mL, or Step in 0.5 mL aliquots.',
    'Inspect the live pH and buffer capacity β peak at half-equivalence (V = ½ Ve) and the equivalence jump at Ve.',
    'Save runs for Strong Acid (HCl) and Weak Acid (Acetic Acid) and overlay them in Compare.'
  ],
  fidelity: {
    level: 'scientifically_based_calculation',
    label: 'Scientifically Based Calculation (Exact Charge Balance)',
    justification:
      'Solves the exact monoprotic electroneutrality equation [H⁺] + [Na⁺] = Kw/[H⁺] + Ca·Ka/([H⁺]+Ka) by 64-step bisection without piecewise approximations.',
    equations: [
      {
        title: 'Exact Electroneutrality Balance',
        formula: '[H⁺] + C_b,dil = K_w / [H⁺] + C_a,dil · (K_a / ([H⁺] + K_a))',
        variables: 'C_a,dil = Ca·Va/(Va+Vb), C_b,dil = Cb·Vb/(Va+Vb), K_a = 10^(−pKa), K_w = 10⁻¹⁴ at 25 °C'
      },
      {
        title: 'Buffer Capacity (Van Slyke)',
        formula: 'β = 2.303 · ( (C_a,dil · K_a · [H⁺]) / (K_a + [H⁺])² + [H⁺] + [OH⁻] )',
        variables: 'β = moles of strong base required per liter to shift pH by 1 unit'
      },
      {
        title: 'Equivalence Volume',
        formula: 'V_e = (C_a · V_a) / C_b',
        variables: 'V_e in mL when stoichiometrically neutralized'
      }
    ],
    assumptions: [
      'Assumes 25 °C aqueous activity coefficients γ ≈ 1 (concentration ≈ activity) and negligible CO₂ absorption.',
      'Models monoprotic dissociation; polyprotic acids (e.g., phosphoric acid) require multi-Ka terms.'
    ],
    limitations: [
      'Volumetric burette span is capped at 50.0 mL per titration run.',
      'Aspirin (acetylsalicylic acid) is modeled purely in aqueous solution without accounting for ester hydrolysis over long durations.'
    ]
  },
  academicContext: {
    course: 'B.Pharm',
    subjectCode: 'BP106T / BP111P',
    subjectTitle: 'Pharmaceutical Inorganic & Analytical Chemistry',
    unit: 'Unit II–III',
    topic: 'Acid–Base Equilibria, Buffers & Neutralization Titrations',
    subtopic: 'Titration Curves, pKa Half-Equivalence & Indicator Selection',
    workspaceModuleId: 'inorganic',
    workspaceTab: 'titration',
    studyModeSubjectCode: 'BP106T',
    references: [
      'Indian Pharmacopoeia (IP) — Volumetric Glassware & Acid-Base Assays',
      'Beckett, A. H., & Stenlake, J. B. — Practical Pharmaceutical Chemistry, Vol. I',
      'Skoog, D. A., West, D. M., & Holler, F. J. — Fundamentals of Analytical Chemistry'
    ]
  },
  parameters: [
    {
      key: 'acidSystem',
      label: 'Analyte Acid System',
      symbol: 'HA',
      unit: '',
      type: 'select',
      options: [
        { value: 'acetic', label: 'Acetic Acid (CH₃COOH, pKa 4.76)' },
        { value: 'aspirin', label: 'Aspirin (Acetylsalicylic Acid, pKa 3.50)' },
        { value: 'benzoic', label: 'Benzoic Acid (pKa 4.20)' },
        { value: 'hcl', label: 'Hydrochloric Acid (HCl, Strong Acid)' },
        { value: 'custom_weak', label: 'Custom Monoprotic Weak Acid' }
      ],
      defaultValue: 'acetic',
      group: 'Analyte Flask',
      description: 'Acid species inside the titration flask.'
    },
    {
      key: 'customPka',
      label: 'Custom Acid pKa',
      symbol: 'pKa',
      unit: '',
      type: 'number',
      min: 1.5,
      max: 10.5,
      step: 0.1,
      precision: 2,
      defaultValue: 4.76,
      group: 'Analyte Flask',
      description: 'Acid dissociation constant pKa (used when Custom Weak Acid is selected).',
      visibleWhen: (p) => p.acidSystem === 'custom_weak'
    },
    {
      key: 'acidMolarity',
      label: 'Analyte Concentration (Ca)',
      symbol: 'Ca',
      unit: 'M',
      type: 'number',
      min: 0.02,
      max: 0.3,
      step: 0.01,
      precision: 2,
      defaultValue: 0.1,
      group: 'Analyte Flask',
      description: 'Initial molar concentration of analyte acid.'
    },
    {
      key: 'acidVolMl',
      label: 'Analyte Aliquot Volume (Va)',
      symbol: 'Va',
      unit: 'mL',
      type: 'number',
      min: 10,
      max: 40,
      step: 5,
      precision: 0,
      defaultValue: 25,
      group: 'Analyte Flask',
      description: 'Pipetted volume of analyte placed into the Erlenmeyer flask.'
    },
    {
      key: 'baseMolarity',
      label: 'Titrant NaOH Concentration (Cb)',
      symbol: 'Cb',
      unit: 'M',
      type: 'number',
      min: 0.05,
      max: 0.3,
      step: 0.01,
      precision: 2,
      defaultValue: 0.1,
      group: 'Burette Titrant',
      description: 'Standardized sodium hydroxide molarity in the burette.'
    },
    {
      key: 'indicator',
      label: 'Visual Indicator',
      symbol: 'Ind',
      unit: '',
      type: 'select',
      options: [
        { value: 'phenolphthalein', label: 'Phenolphthalein (pH 8.2–10.0)' },
        { value: 'bromothymol_blue', label: 'Bromothymol Blue (pH 6.0–7.6)' },
        { value: 'methyl_orange', label: 'Methyl Orange (pH 3.1–4.4)' }
      ],
      defaultValue: 'phenolphthalein',
      group: 'Detection',
      description: 'Colorimetric acid–base indicator added to the titration flask.'
    }
  ],
  presets: [
    {
      id: 'weak_acetic_std',
      label: '0.1M Acetic Acid vs 0.1M NaOH',
      description: 'Classic weak-acid curve with pH = 4.76 at 12.5 mL and equivalence ~pH 8.72 at 25.0 mL.',
      parameters: {
        acidSystem: 'acetic',
        acidMolarity: 0.1,
        acidVolMl: 25,
        baseMolarity: 0.1,
        indicator: 'phenolphthalein'
      }
    },
    {
      id: 'strong_hcl_std',
      label: '0.1M HCl vs 0.1M NaOH',
      description: 'Strong acid–strong base curve starting near pH 1.0 with equivalence strictly at pH 7.00.',
      parameters: {
        acidSystem: 'hcl',
        acidMolarity: 0.1,
        acidVolMl: 25,
        baseMolarity: 0.1,
        indicator: 'bromothymol_blue'
      }
    },
    {
      id: 'aspirin_assay',
      label: 'Aspirin Assay (pKa 3.50)',
      description: 'Assay profile of acetylsalicylic acid with phenolphthalein endpoint.',
      parameters: {
        acidSystem: 'aspirin',
        acidMolarity: 0.08,
        acidVolMl: 25,
        baseMolarity: 0.1,
        indicator: 'phenolphthalein'
      }
    }
  ],
  simulation: {
    mode: 'sweep_and_step',
    timeUnit: 'mL NaOH',
    dt: 0.5,
    maxTime: 50,
    defaultSpeed: 1,
    xAxisLabel: 'NaOH Volume Added',
    xAxisUnit: 'mL',
    yAxisLabel: 'Solution pH',
    yAxisUnit: 'pH',
    yDomain: [0, 14],
    series: [
      {
        id: 'ph_curve',
        label: 'Measured pH',
        unit: 'pH',
        colorHex: '#06b6d4',
        referenceLines: [{ value: 7.0, label: 'Neutral pH 7.0', colorHex: '#64748b' }]
      },
      {
        id: 'buffer_capacity_scaled',
        label: 'Buffer Capacity β (×100 mmol/L)',
        unit: 'mmol/L',
        colorHex: '#f59e0b'
      }
    ],
    metrics: [
      { key: 'ph', label: 'Current Solution pH', unit: '', precision: 2, highlightTone: 'nominal' },
      { key: 'equivalenceVolMl', label: 'Equivalence Vol (Ve)', unit: 'mL', precision: 2 },
      { key: 'dPhDv', label: 'Slope ΔpH / ΔV', unit: 'pH/mL', precision: 2 },
      { key: 'bufferCapacityMmol', label: 'Buffer Capacity β', unit: 'mmol/L', precision: 1 },
      { key: 'indicatorState', label: 'Flask Indicator', unit: '' },
      { key: 'poh', label: 'Solution pOH', unit: '', precision: 2 }
    ],
    init: (params) => {
      const s = buildTitrationState(0, null, null, params);
      return {
        stepIndex: 0,
        simTime: 0,
        timeUnit: 'mL NaOH',
        completed: false,
        phaseLabel: s.regionLabel,
        state: { prevPh: s.ph, prevVol: 0 },
        metrics: {
          ph: s.ph,
          equivalenceVolMl: s.equivalenceVolMl,
          dPhDv: 0,
          bufferCapacityMmol: s.bufferCapacity * 1000,
          indicatorState: s.ind.stateLabel,
          poh: s.poh
        },
        seriesHistory: {
          ph_curve: [{ x: 0, y: s.ph }],
          buffer_capacity_scaled: [{ x: 0, y: Math.min(14, s.bufferCapacity * 100) }]
        },
        visualState: {
          buretteVolMl: 0,
          maxBuretteMl: 50,
          ph: s.ph,
          flaskHexColor: s.ind.hexColor,
          indicatorLabel: s.ind.stateLabel,
          equivalenceVolMl: s.equivalenceVolMl
        },
        warnings: s.warnings,
        summaryInterpretation: `Initial analyte pH = ${s.ph.toFixed(2)}. Theoretical equivalence at Ve = ${s.equivalenceVolMl.toFixed(2)} mL NaOH.`
      };
    },
    step: (snapshot, params, dtOverride) => {
      const dv = dtOverride ?? 0.5;
      const maxVol = 50;
      const nextVol = Math.min(maxVol, snapshot.simTime + dv);
      const prevPh = Number(snapshot.state.prevPh);
      const prevVol = Number(snapshot.state.prevVol);
      const s = buildTitrationState(nextVol, prevPh, prevVol, params);

      return {
        stepIndex: snapshot.stepIndex + 1,
        simTime: nextVol,
        timeUnit: 'mL NaOH',
        completed: nextVol >= maxVol,
        phaseLabel: s.regionLabel,
        state: { prevPh: s.ph, prevVol: nextVol },
        metrics: {
          ph: s.ph,
          equivalenceVolMl: s.equivalenceVolMl,
          dPhDv: s.dPhDv,
          bufferCapacityMmol: s.bufferCapacity * 1000,
          indicatorState: s.ind.stateLabel,
          poh: s.poh
        },
        seriesHistory: {
          ph_curve: [...(snapshot.seriesHistory.ph_curve || []), { x: nextVol, y: s.ph }],
          buffer_capacity_scaled: [
            ...(snapshot.seriesHistory.buffer_capacity_scaled || []),
            { x: nextVol, y: Math.min(14, s.bufferCapacity * 100) }
          ]
        },
        visualState: {
          buretteVolMl: nextVol,
          maxBuretteMl: maxVol,
          ph: s.ph,
          flaskHexColor: s.ind.hexColor,
          indicatorLabel: s.ind.stateLabel,
          equivalenceVolMl: s.equivalenceVolMl
        },
        warnings: s.warnings,
        summaryInterpretation: `Added ${nextVol.toFixed(1)} mL NaOH → pH ${s.ph.toFixed(2)} (${s.ind.stateLabel}; Ve = ${s.equivalenceVolMl.toFixed(2)} mL).`
      };
    }
  },
  observationPrompts: [
    'Identify the initial pH before adding NaOH and explain why weak acids start higher than equimolar strong acids.',
    'Record the pH at exactly half-equivalence (V = ½ Ve) and verify pH ≈ pKa for the weak acid.',
    'Compare ΔpH/ΔV slope sharpness around Ve and evaluate which indicator turns within the steep jump.'
  ],
  defaultConclusionTemplate:
    'The charge-balance titration model accurately reproduced initial acid dissociation, the Henderson–Hasselbalch buffering zone around V = ½ Ve (peak β), and the equivalence inflection at Ve = (Ca·Va)/Cb.'
};
