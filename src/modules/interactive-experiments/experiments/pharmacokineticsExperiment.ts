import { ExperimentDefinition, ParameterValue, SimulationSnapshot } from '../types';

export function evaluateOneCompartmentPk(
  tHours: number,
  params: Record<string, ParameterValue>
): {
  plasmaConcMgL: number;
  gutDepotMg: number;
  ke: number;
  halfLifeHr: number;
  cMaxTheoretical: number;
  tMaxTheoretical: number;
  auc0Inf: number;
  windowStatus: string;
} {
  const route = String(params.route || 'oral_single');
  const doseMg = Math.max(10, Number(params.doseMg) || 500);
  const fBio = route === 'iv_bolus' ? 1.0 : Math.max(0.05, Math.min(1, Number(params.bioavailability) || 0.85));
  const ka = Math.max(0.05, Number(params.kaPerHr) || 1.4);
  const vd = Math.max(5, Number(params.vdLiters) || 35);
  const cl = Math.max(0.5, Number(params.clLitersPerHr) || 5.0);
  const tau = Math.max(2, Number(params.dosingIntervalHr) || 8);
  const mec = Math.max(0.1, Number(params.mecMgL) || 4.0);
  const mtc = Math.max(mec + 1, Number(params.mtcMgL) || 18.0);

  const ke = cl / vd;
  const halfLifeHr = Math.LN2 / ke;
  const auc0Inf = (fBio * doseMg) / cl;

  const singleDoseConc = (elapsed: number): { c: number; depot: number } => {
    if (elapsed < 0) return { c: 0, depot: 0 };
    if (route === 'iv_bolus') {
      return {
        c: (doseMg / vd) * Math.exp(-ke * elapsed),
        depot: 0
      };
    }
    const depot = fBio * doseMg * Math.exp(-ka * elapsed);
    if (Math.abs(ka - ke) < 1e-4) {
      return {
        c: ((fBio * doseMg * ke * elapsed) / vd) * Math.exp(-ke * elapsed),
        depot
      };
    }
    const c =
      ((fBio * doseMg * ka) / (vd * (ka - ke))) *
      (Math.exp(-ke * elapsed) - Math.exp(-ka * elapsed));
    return { c: Math.max(0, c), depot };
  };

  let plasmaConcMgL = 0;
  let gutDepotMg = 0;

  if (route === 'oral_repeated') {
    const numDoses = Math.floor(tHours / tau) + 1;
    for (let n = 0; n < numDoses; n++) {
      const res = singleDoseConc(tHours - n * tau);
      plasmaConcMgL += res.c;
      gutDepotMg += res.depot;
    }
  } else {
    const res = singleDoseConc(tHours);
    plasmaConcMgL = res.c;
    gutDepotMg = res.depot;
  }

  let tMaxTheoretical = 0;
  let cMaxTheoretical = doseMg / vd;
  if (route !== 'iv_bolus') {
    tMaxTheoretical =
      Math.abs(ka - ke) < 1e-4 ? 1 / ke : Math.log(ka / ke) / (ka - ke);
    cMaxTheoretical = singleDoseConc(tMaxTheoretical).c;
  }

  const windowStatus =
    plasmaConcMgL > mtc
      ? 'Above MTC (Toxicity Risk)'
      : plasmaConcMgL >= mec
      ? 'Therapeutic Window'
      : 'Below MEC (Subtherapeutic)';

  return {
    plasmaConcMgL,
    gutDepotMg,
    ke,
    halfLifeHr,
    cMaxTheoretical,
    tMaxTheoretical,
    auc0Inf,
    windowStatus
  };
}

function buildPkWarnings(
  plasmaConc: number,
  mec: number,
  mtc: number,
  cMaxPeak: number,
  ka: number,
  ke: number
): SimulationSnapshot['warnings'] {
  const warnings: SimulationSnapshot['warnings'] = [];
  if (plasmaConc > mtc || cMaxPeak > mtc) {
    warnings.push({
      severity: 'error',
      code: 'EXCEEDS_MTC',
      message: `Peak concentration exceeds Minimum Toxic Concentration (MTC = ${mtc.toFixed(1)} mg/L). Reduce dose or extend interval τ.`
    });
  } else if (cMaxPeak < mec) {
    warnings.push({
      severity: 'warning',
      code: 'SUBTHERAPEUTIC_PEAK',
      message: `Plasma peak (${cMaxPeak.toFixed(2)} mg/L) remains below MEC (${mec.toFixed(1)} mg/L).`
    });
  }
  if (ka <= ke) {
    warnings.push({
      severity: 'info',
      code: 'FLIP_FLOP_KINETICS',
      message: `Absorption rate ka (${ka.toFixed(2)}/h) ≤ elimination rate ke (${ke.toFixed(2)}/h): flip-flop kinetics applies.`
    });
  }
  return warnings;
}

export const pharmacokineticsExperiment: ExperimentDefinition = {
  id: 'exp_one_compartment_pk',
  code: 'SIM-PK-03',
  title: 'One-Compartment Pharmacokinetics & Therapeutic Window',
  shortTitle: '1-Compartment PK Simulator',
  department: 'pharmacology',
  difficulty: 'Intermediate',
  estimatedMinutes: 15,
  requires3D: false,
  visualizerKind: 'pk_compartment',
  description:
    'Model plasma drug concentration–time profiles C(t) for single oral doses, IV bolus injections, and repeated qτ dosing against Minimum Effective (MEC) and Minimum Toxic (MTC) thresholds.',
  scientificPrinciple:
    'In a linear one-compartment open model, the body behaves as a single kinetically homogeneous volume Vd cleared at first-order rate ke = CL/Vd. Oral administration adds a first-order GI absorption depot (ka, F), yielding the Bateman curve whose peak occurs when absorption rate equals elimination rate.',
  objectives: [
    'Determine how Clearance (CL) and Volume of Distribution (Vd) govern elimination half-life t1/2 and AUC.',
    'Differentiate IV bolus from first-order oral absorption (Cmax, Tmax, bioavailability F).',
    'Design a repeated oral regimen (Dose, τ) that remains inside the MEC–MTC therapeutic window at steady state.'
  ],
  apparatus: [
    {
      name: 'Clinical Blood Sampling & Heparinized Tubes',
      specification: 'Serial plasma collection across 0–36 h',
      role: 'Captures absorption rise, Cmax peak, and log-linear elimination phase'
    },
    {
      name: 'LC-MS/MS or HPLC Bioanalytical Assay',
      specification: 'Validated plasma calibration curve (mg/L)',
      role: 'Quantifies unbound/total plasma drug concentration C(t) over time'
    }
  ],
  asset3dBindings: [
    {
      slotId: 'pk_target_organ_or_drug',
      roleLabel: 'Drug Molecule or Organ System',
      description: 'Optionally inspect a 3D drug structure or renal/hepatic organ model linked to PK clearance.',
      optional: true,
      categoryHints: ['molecule', 'organ', 'anatomy'],
      departmentHints: ['pharmacology', 'anatomy', 'pharmaceutical_chemistry'],
      matchKeywords: ['kidney', 'liver', 'nephron', 'aspirin', 'paracetamol', 'molecule'],
      recommendedSubjectCode: 'BP101T',
      fallbackVisualId: 'builtin_nephron_anatomy'
    }
  ],
  safetyNotes: [
    'Narrow therapeutic index drugs require maintaining trough > MEC and peak < MTC.',
    'Renal or hepatic impairment reduces CL and prolongs half-life t1/2, risking accumulation during repeated dosing.'
  ],
  procedureSteps: [
    'Select a dosing route (Oral Single, Oral Repeated qτ, or IV Bolus) and physiological Vd / CL.',
    'Run the simulation over 36 h and watch GI depot transfer into central plasma Vd.',
    'Track cumulative AUC0–t via trapezoidal integration and time spent inside the MEC–MTC window.',
    'Save Single Oral vs. Repeated q8h runs and compare steady-state peak/trough levels in Compare.'
  ],
  fidelity: {
    level: 'scientifically_based_calculation',
    label: 'Scientifically Based Calculation (Exact Bateman Superposition)',
    justification:
      'Uses exact analytical solutions to the 1-compartment linear first-order differential equations (Bateman equation and linear superposition for multiple dosing) plus numerical trapezoidal AUC0–t.',
    equations: [
      {
        title: 'Bateman Equation (First-Order Oral)',
        formula: 'C(t) = [F·D·ka / (Vd·(ka − ke))] · (e^(−ke·t) − e^(−ka·t))',
        variables: 'F = bioavailability, D = dose (mg), ka = absorption constant (/h), ke = CL/Vd (/h)'
      },
      {
        title: 'Elimination Half-Life & Total Exposure',
        formula: 't₁/₂ = ln(2) / ke ,   AUC₀→∞ = (F · D) / CL',
        variables: 'CL = total clearance (L/h), Vd = apparent volume of distribution (L)'
      }
    ],
    assumptions: [
      'Linear, dose-independent first-order absorption and elimination without saturable Michaelis–Menten enzymes.',
      'Instantaneous distribution within central compartment (1-compartment approximation).'
    ],
    limitations: [
      'Does not represent two-compartment alpha distribution phase seen immediately post-IV injection.',
      'Assumes 100% patient adherence at exact dosing intervals τ during repeated-dose runs.'
    ]
  },
  academicContext: {
    course: 'B.Pharm',
    subjectCode: 'BP101T / Clinical PK',
    subjectTitle: 'Pharmaceutical Data Science & Biopharmaceutics',
    unit: 'Unit V',
    topic: 'Pharmacokinetic Curves & Bioavailability',
    subtopic: 'Oral vs. IV Bolus Cmax, Tmax, Half-Life & AUC',
    workspaceModuleId: 'pandas',
    workspaceTab: 'pk',
    studyModeSubjectCode: 'BP101T',
    references: [
      'Shargel, L., Yu, A. B. C., & Wu-Pong, S. — Applied Biopharmaceutics & Pharmacokinetics',
      'Rowland, M., & Tozer, T. N. — Clinical Pharmacokinetics and Pharmacodynamics',
      'BP101T Unit V Syllabus: Pharmacokinetic & Dissolution Visualization'
    ]
  },
  parameters: [
    {
      key: 'route',
      label: 'Administration Regimen',
      symbol: 'Route',
      unit: '',
      type: 'select',
      options: [
        { value: 'oral_single', label: 'Oral Single Dose' },
        { value: 'oral_repeated', label: 'Oral Repeated Dosing (qτ)' },
        { value: 'iv_bolus', label: 'IV Bolus Injection (F = 1.0)' }
      ],
      defaultValue: 'oral_single',
      group: 'Dosing Regimen',
      description: 'Route and dosing schedule.'
    },
    {
      key: 'doseMg',
      label: 'Dose (D)',
      symbol: 'D',
      unit: 'mg',
      type: 'number',
      min: 50,
      max: 1500,
      step: 25,
      precision: 0,
      defaultValue: 500,
      group: 'Dosing Regimen',
      description: 'Administered drug dose.'
    },
    {
      key: 'dosingIntervalHr',
      label: 'Dosing Interval (τ)',
      symbol: 'τ',
      unit: 'h',
      type: 'number',
      min: 4,
      max: 24,
      step: 2,
      precision: 0,
      defaultValue: 8,
      group: 'Dosing Regimen',
      description: 'Interval between consecutive oral doses.',
      visibleWhen: (p) => p.route === 'oral_repeated'
    },
    {
      key: 'bioavailability',
      label: 'Oral Bioavailability (F)',
      symbol: 'F',
      unit: '',
      type: 'number',
      min: 0.1,
      max: 1.0,
      step: 0.05,
      precision: 2,
      defaultValue: 0.85,
      group: 'Absorption',
      description: 'Fraction of oral dose reaching systemic circulation.',
      visibleWhen: (p) => p.route !== 'iv_bolus'
    },
    {
      key: 'kaPerHr',
      label: 'Absorption Rate (kₐ)',
      symbol: 'kₐ',
      unit: 'h⁻¹',
      type: 'number',
      min: 0.15,
      max: 4.0,
      step: 0.1,
      precision: 2,
      defaultValue: 1.4,
      group: 'Absorption',
      description: 'First-order GI absorption rate constant.',
      visibleWhen: (p) => p.route !== 'iv_bolus'
    },
    {
      key: 'vdLiters',
      label: 'Volume of Distribution (Vd)',
      symbol: 'Vd',
      unit: 'L',
      type: 'number',
      min: 10,
      max: 120,
      step: 2,
      precision: 0,
      defaultValue: 35,
      group: 'Distribution & Clearance',
      description: 'Apparent central distribution volume (70 kg adult).'
    },
    {
      key: 'clLitersPerHr',
      label: 'Clearance (CL)',
      symbol: 'CL',
      unit: 'L/h',
      type: 'number',
      min: 1,
      max: 25,
      step: 0.5,
      precision: 1,
      defaultValue: 5.0,
      group: 'Distribution & Clearance',
      description: 'Total systemic renal + hepatic clearance.'
    },
    {
      key: 'mecMgL',
      label: 'Min Effective Conc. (MEC)',
      symbol: 'MEC',
      unit: 'mg/L',
      type: 'number',
      min: 0.5,
      max: 15,
      step: 0.5,
      precision: 1,
      defaultValue: 4.0,
      group: 'Therapeutic Window',
      description: 'Minimum plasma concentration required for efficacy.'
    },
    {
      key: 'mtcMgL',
      label: 'Min Toxic Conc. (MTC)',
      symbol: 'MTC',
      unit: 'mg/L',
      type: 'number',
      min: 5,
      max: 40,
      step: 1,
      precision: 1,
      defaultValue: 18.0,
      group: 'Therapeutic Window',
      description: 'Concentration threshold above which adverse toxicity increases.'
    }
  ],
  presets: [
    {
      id: 'oral_single_std',
      label: 'Oral Single 500 mg (F=0.85)',
      description: 'Standard immediate-release oral dose entering therapeutic window cleanly.',
      parameters: {
        route: 'oral_single',
        doseMg: 500,
        bioavailability: 0.85,
        kaPerHr: 1.4,
        vdLiters: 35,
        clLitersPerHr: 5.0,
        mecMgL: 4.0,
        mtcMgL: 18.0
      }
    },
    {
      id: 'oral_q8h_maintenance',
      label: 'Oral q8h Maintenance (400 mg)',
      description: 'Multiple-dose steady-state accumulation inside MEC–MTC window.',
      parameters: {
        route: 'oral_repeated',
        doseMg: 400,
        dosingIntervalHr: 8,
        bioavailability: 0.85,
        kaPerHr: 1.4,
        vdLiters: 35,
        clLitersPerHr: 5.0,
        mecMgL: 4.0,
        mtcMgL: 18.0
      }
    },
    {
      id: 'renal_impairment_risk',
      label: 'Low Clearance Risk (CL=2.0 L/h)',
      description: 'Impaired elimination causing prolonged half-life and accumulation above MTC on q8h.',
      parameters: {
        route: 'oral_repeated',
        doseMg: 400,
        dosingIntervalHr: 8,
        bioavailability: 0.85,
        kaPerHr: 1.4,
        vdLiters: 35,
        clLitersPerHr: 2.0,
        mecMgL: 4.0,
        mtcMgL: 18.0
      }
    }
  ],
  simulation: {
    mode: 'time_series',
    timeUnit: 'h',
    dt: 0.5,
    maxTime: 36,
    defaultSpeed: 1,
    xAxisLabel: 'Time Post-Dose',
    xAxisUnit: 'h',
    yAxisLabel: 'Plasma Concentration',
    yAxisUnit: 'mg/L',
    series: [
      {
        id: 'plasma_conc',
        label: 'Plasma Conc. C(t)',
        unit: 'mg/L',
        colorHex: '#2563eb'
      }
    ],
    metrics: [
      { key: 'plasmaConc', label: 'Current C(t)', unit: 'mg/L', precision: 2, highlightTone: 'nominal' },
      { key: 'cMaxObserved', label: 'Peak Cmax', unit: 'mg/L', precision: 2 },
      { key: 'tMaxObserved', label: 'Time to Peak Tmax', unit: 'h', precision: 2 },
      { key: 'halfLifeHr', label: 'Half-Life t₁/₂', unit: 'h', precision: 2 },
      { key: 'auc0T', label: 'Cumulative AUC₀₋ₜ', unit: 'mg·h/L', precision: 1 },
      { key: 'windowStatus', label: 'Therapeutic Status', unit: '' }
    ],
    init: (params) => {
      const pk = evaluateOneCompartmentPk(0, params);
      const mec = Number(params.mecMgL) || 4;
      const mtc = Number(params.mtcMgL) || 18;
      const ka = Number(params.kaPerHr) || 1.4;
      return {
        stepIndex: 0,
        simTime: 0,
        timeUnit: 'h',
        completed: false,
        phaseLabel: pk.windowStatus,
        state: {
          cMaxObserved: pk.plasmaConcMgL,
          tMaxObserved: 0,
          auc0T: 0,
          prevConc: pk.plasmaConcMgL
        },
        metrics: {
          plasmaConc: pk.plasmaConcMgL,
          cMaxObserved: pk.plasmaConcMgL,
          tMaxObserved: 0,
          halfLifeHr: pk.halfLifeHr,
          auc0T: 0,
          windowStatus: pk.windowStatus
        },
        seriesHistory: {
          plasma_conc: [{ x: 0, y: pk.plasmaConcMgL }]
        },
        visualState: {
          plasmaConc: pk.plasmaConcMgL,
          gutDepotMg: pk.gutDepotMg,
          doseMg: Number(params.doseMg) || 500,
          mec,
          mtc,
          ke: pk.ke,
          ka,
          route: String(params.route || 'oral_single')
        },
        warnings: buildPkWarnings(pk.plasmaConcMgL, mec, mtc, pk.cMaxTheoretical, ka, pk.ke),
        summaryInterpretation: `Half-life t1/2 = ${pk.halfLifeHr.toFixed(2)} h (ke = ${pk.ke.toFixed(3)} /h); theoretical single-dose AUC0-∞ = ${pk.auc0Inf.toFixed(1)} mg·h/L.`
      };
    },
    step: (snapshot, params, dtOverride) => {
      const dt = dtOverride ?? 0.5;
      const maxTime = 36;
      const nextTime = Math.min(maxTime, snapshot.simTime + dt);
      const actualDt = nextTime - snapshot.simTime;
      const pk = evaluateOneCompartmentPk(nextTime, params);
      const mec = Number(params.mecMgL) || 4;
      const mtc = Number(params.mtcMgL) || 18;
      const ka = Number(params.kaPerHr) || 1.4;

      const prevConc = Number(snapshot.state.prevConc) || 0;
      const prevAuc = Number(snapshot.state.auc0T) || 0;
      const auc0T = prevAuc + 0.5 * (prevConc + pk.plasmaConcMgL) * actualDt;

      let cMaxObserved = Number(snapshot.state.cMaxObserved) || 0;
      let tMaxObserved = Number(snapshot.state.tMaxObserved) || 0;
      if (pk.plasmaConcMgL > cMaxObserved) {
        cMaxObserved = pk.plasmaConcMgL;
        tMaxObserved = nextTime;
      }

      return {
        stepIndex: snapshot.stepIndex + 1,
        simTime: nextTime,
        timeUnit: 'h',
        completed: nextTime >= maxTime,
        phaseLabel: pk.windowStatus,
        state: {
          cMaxObserved,
          tMaxObserved,
          auc0T,
          prevConc: pk.plasmaConcMgL
        },
        metrics: {
          plasmaConc: pk.plasmaConcMgL,
          cMaxObserved,
          tMaxObserved,
          halfLifeHr: pk.halfLifeHr,
          auc0T,
          windowStatus: pk.windowStatus
        },
        seriesHistory: {
          plasma_conc: [
            ...(snapshot.seriesHistory.plasma_conc || []),
            { x: nextTime, y: pk.plasmaConcMgL }
          ]
        },
        visualState: {
          plasmaConc: pk.plasmaConcMgL,
          gutDepotMg: pk.gutDepotMg,
          doseMg: Number(params.doseMg) || 500,
          mec,
          mtc,
          ke: pk.ke,
          ka,
          route: String(params.route || 'oral_single')
        },
        warnings: buildPkWarnings(pk.plasmaConcMgL, mec, mtc, cMaxObserved, ka, pk.ke),
        summaryInterpretation: `At ${nextTime.toFixed(1)} h: C(t) = ${pk.plasmaConcMgL.toFixed(2)} mg/L (${pk.windowStatus}); cumulative AUC0-t = ${auc0T.toFixed(1)} mg·h/L.`
      };
    }
  },
  observationPrompts: [
    'Record Cmax, Tmax, t1/2, and AUC0-36h for your baseline oral dose.',
    'Explain why halving Clearance (CL) doubles AUC and half-life without shifting immediate Cmax proportionally.',
    'Observe whether repeated q8h dosing keeps trough concentration above MEC without crossing MTC.'
  ],
  defaultConclusionTemplate:
    'Plasma concentration followed linear one-compartment kinetics with t1/2 = ln(2)·Vd/CL and AUC = F·D/CL. Clearance reductions caused proportional increases in steady-state accumulation during repeated dosing.'
};
