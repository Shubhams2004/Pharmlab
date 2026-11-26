import { ExperimentDefinition, ParameterValue, SimulationSnapshot } from '../types';

export function computeHemodynamics(
  tSec: number,
  params: Record<string, ParameterValue>
): {
  heartRateBpm: number;
  strokeVolumeMl: number;
  cardiacOutputLMin: number;
  mapMmHg: number;
  sbpMmHg: number;
  dbpMmHg: number;
  pulsePressureMmHg: number;
  arterialPressureAtT: number;
  rhythmClassification: string;
} {
  const heartRateBpm = Math.max(40, Math.min(180, Number(params.heartRateBpm) || 72));
  const preloadFactor = Math.max(0.5, Math.min(1.5, Number(params.preloadFactor) || 1.0));
  const contractility = Math.max(0.5, Math.min(1.6, Number(params.contractility) || 1.0));
  const tpr = Math.max(8, Math.min(35, Number(params.tprMmHgMinPerL) || 17.5));
  const compliance = Math.max(0.4, Math.min(1.8, Number(params.arterialCompliance) || 1.0));

  // Diastolic filling time drops at extreme HR, reducing EDV slightly above ~125 bpm
  const cycleSec = 60 / heartRateBpm;
  const fillingEfficiency = heartRateBpm > 125 ? Math.max(0.55, 1 - (heartRateBpm - 125) * 0.0065) : 1.0;

  // Saturating Frank-Starling Hill-type preload response + contractility minus modest afterload penalty
  const edvNormalized = preloadFactor * fillingEfficiency;
  const frankStarling = (1.38 * Math.pow(edvNormalized, 1.5)) / (0.38 + Math.pow(edvNormalized, 1.5));
  const afterloadFactor = Math.max(0.65, 1.15 - tpr * 0.01);
  const strokeVolumeMl = Math.max(25, Math.min(145, 70 * frankStarling * contractility * afterloadFactor));

  const cardiacOutputLMin = (heartRateBpm * strokeVolumeMl) / 1000;
  const cvp = 4.0;
  const mapMmHg = cardiacOutputLMin * tpr + cvp;

  // Pulse pressure PP = SV / arterial compliance (scaled so nominal SV=70, C=1 gives PP=40 mmHg)
  const pulsePressureMmHg = Math.max(15, Math.min(110, (strokeVolumeMl / 70) * (40 / compliance)));
  const dbpMmHg = Math.max(35, mapMmHg - pulsePressureMmHg / 3);
  const sbpMmHg = dbpMmHg + pulsePressureMmHg;

  // Periodic systolic/diastolic arterial waveform (dicrotic-like Windkessel decay)
  const phase = (tSec % cycleSec) / cycleSec;
  const systoleFrac = 0.34;
  let waveformNorm = 0;
  if (phase < systoleFrac) {
    waveformNorm = Math.sin((phase / systoleFrac) * Math.PI);
  } else {
    const dPhase = (phase - systoleFrac) / (1 - systoleFrac);
    const dicrotic = 0.14 * Math.exp(-Math.pow((dPhase - 0.12) / 0.07, 2));
    waveformNorm = Math.max(0, 0.38 * Math.exp(-2.6 * dPhase) + dicrotic);
  }
  const arterialPressureAtT = dbpMmHg + pulsePressureMmHg * waveformNorm;

  const rhythmClassification =
    heartRateBpm < 60
      ? 'Bradycardia (< 60 bpm)'
      : heartRateBpm > 100
      ? 'Tachycardia (> 100 bpm)'
      : sbpMmHg >= 140 || dbpMmHg >= 90
      ? 'Hypertensive Profile'
      : sbpMmHg < 90
      ? 'Hypotensive Profile'
      : 'Normotensive Sinus';

  return {
    heartRateBpm,
    strokeVolumeMl,
    cardiacOutputLMin,
    mapMmHg,
    sbpMmHg,
    dbpMmHg,
    pulsePressureMmHg,
    arterialPressureAtT,
    rhythmClassification
  };
}

function buildCardiacWarnings(h: ReturnType<typeof computeHemodynamics>): SimulationSnapshot['warnings'] {
  const warnings: SimulationSnapshot['warnings'] = [];
  if (h.sbpMmHg >= 160 || h.mapMmHg >= 120) {
    warnings.push({
      severity: 'error',
      code: 'SEVERE_HYPERTENSION',
      message: `Systolic BP (${h.sbpMmHg.toFixed(0)} mmHg) indicates marked hypertensive load; elevated TPR increases myocardial afterload.`
    });
  } else if (h.sbpMmHg < 90 || h.mapMmHg < 65) {
    warnings.push({
      severity: 'warning',
      code: 'HYPOTENSION_RISK',
      message: `Mean arterial pressure (${h.mapMmHg.toFixed(0)} mmHg) is low (< 65 mmHg), risking inadequate organ perfusion.`
    });
  }
  if (h.heartRateBpm > 140) {
    warnings.push({
      severity: 'info',
      code: 'SHORTENED_DIASTOLE',
      message: 'Extreme tachycardia shortens ventricular diastolic filling time, blunting stroke volume via Frank–Starling limits.'
    });
  }
  return warnings;
}

export const cardiacHemodynamicsExperiment: ExperimentDefinition = {
  id: 'exp_cardiac_hemodynamics',
  code: 'SIM-AP-04',
  title: 'Cardiovascular Hemodynamics, Frank–Starling & Windkessel Pressure',
  shortTitle: 'Cardiac Output & BP Model',
  department: 'anatomy',
  difficulty: 'Intermediate',
  estimatedMinutes: 12,
  requires3D: true,
  visualizerKind: 'cardiac_hemodynamics',
  description:
    'Explore how heart rate, venous preload (Frank–Starling mechanism), myocardial contractility, vascular resistance (TPR), and arterial compliance interact to determine cardiac output and systolic/diastolic arterial blood pressure.',
  scientificPrinciple:
    'Mean arterial pressure depends on the product of Cardiac Output (CO = HR × SV) and Total Peripheral Resistance (MAP ≈ CO × TPR + CVP). Ventricular stroke volume rises smoothly with venous preload up to a physiological Frank–Starling plateau, while pulse pressure (SBP − DBP) widens when arterial compliance falls (e.g., vascular stiffness).',
  objectives: [
    'Observe the interplay between Heart Rate (HR) and Stroke Volume (SV) in maintaining Cardiac Output (L/min).',
    'Demonstrate how vasoconstriction (elevated TPR) raises DBP and MAP while increasing afterload.',
    'Connect anatomical heart chambers/valves (in the 3D viewport) to systolic ejection and pulse pressure.'
  ],
  apparatus: [
    {
      name: 'Sphygmomanometer & Arterial Pressure Transducer',
      specification: 'Oscillometric / Windkessel pressure waveform monitor (mmHg)',
      role: 'Captures systolic peak, dicrotic notch, and diastolic runoff pressure'
    },
    {
      name: '3-Lead ECG Telemetry & Echocardiography Reference',
      specification: '60–100 bpm resting sinus rhythm reference',
      role: 'Tracks ventricular cycle timing and stroke volume ejection'
    }
  ],
  asset3dBindings: [
    {
      slotId: 'heart_anatomy_model',
      roleLabel: 'Human Heart & Valve Anatomy (3D)',
      description: 'Inspect cardiac chambers, valves, and great vessels alongside hemodynamic telemetry.',
      optional: true,
      categoryHints: ['organ', 'anatomy'],
      departmentHints: ['anatomy', 'pharmacology', 'clinical_pharmacy'],
      matchKeywords: ['heart', 'cardiac', 'valve', 'ventricle', 'aorta'],
      recommendedSubjectCode: 'BP104T',
      fallbackVisualId: 'builtin_heart_anatomy'
    }
  ],
  safetyNotes: [
    'This educational Windkessel model simplifies autonomic baroreceptor feedback; do not use it for clinical patient dosing.'
  ],
  procedureSteps: [
    'Inspect the 3D Heart model (or built-in cardiac conduction diagram) in the Apparatus & 3D stage.',
    'Start from Resting Sinus Baseline (HR 72 bpm, Preload 1.0, TPR 17.5) and press Run to record 10 seconds of arterial pulse waves.',
    'Switch to Exercise or Vasoconstriction Hypertension presets and compare CO, MAP, SBP, and DBP in Compare.'
  ],
  fidelity: {
    level: 'simplified_educational_simulation',
    label: 'Simplified Educational Simulation (Lumped Windkessel)',
    justification:
      'Combines a saturating Frank–Starling stroke-volume curve, Ohm’s law for circulation (MAP = CO·TPR + CVP), and a periodic systolic/diastolic Windkessel pressure waveform.',
    equations: [
      {
        title: 'Cardiac Output & Ohm’s Law of Circulation',
        formula: 'CO = (HR · SV) / 1000 ,   MAP = CO · TPR + CVP',
        variables: 'HR (bpm), SV (mL/beat), CO (L/min), TPR (mmHg·min/L), CVP ≈ 4 mmHg'
      },
      {
        title: 'Pulse Pressure & Arterial Compliance',
        formula: 'PP = SBP − DBP ∝ SV / C_arterial',
        variables: 'C_arterial = normalized large-artery compliance factor'
      }
    ],
    assumptions: [
      'Open-loop parameters: baroreceptor reflex compensation is held constant so students can isolate single-variable effects.',
      'Central venous pressure (CVP) is fixed at 4 mmHg.'
    ],
    limitations: [
      'Does not simulate valvular stenosis/regurgitation backflow or beat-to-beat respiratory sinus arrhythmia.'
    ]
  },
  academicContext: {
    course: 'B.Pharm',
    subjectCode: 'BP104T / BP109P',
    subjectTitle: 'Human Anatomy, Physiology & Pathophysiology I',
    unit: 'Unit V',
    topic: 'Cardiovascular Physiology, Cardiac Cycle & Blood Pressure',
    subtopic: 'Cardiac Output, Frank–Starling Law & Peripheral Resistance',
    workspaceModuleId: 'anatomy',
    workspaceTab: 'cardio',
    studyModeSubjectCode: 'BP104T',
    references: [
      'Tortora, G. J., & Derrickson, B. — Principles of Anatomy and Physiology (Cardiovascular System)',
      'Hall, J. E. — Guyton and Hall Textbook of Medical Physiology: Cardiac Output & Vascular Control',
      'BP109P Exp 14–15: ECG Rhythm & Blood Pressure Recording'
    ]
  },
  parameters: [
    {
      key: 'heartRateBpm',
      label: 'Heart Rate (HR)',
      symbol: 'HR',
      unit: 'bpm',
      type: 'number',
      min: 40,
      max: 180,
      step: 2,
      precision: 0,
      defaultValue: 72,
      group: 'Cardiac Pump',
      description: 'Sinoatrial pacemaker firing rate.'
    },
    {
      key: 'preloadFactor',
      label: 'Venous Return / Preload',
      symbol: 'EDV*',
      unit: '×norm',
      type: 'number',
      min: 0.5,
      max: 1.5,
      step: 0.05,
      precision: 2,
      defaultValue: 1.0,
      group: 'Cardiac Pump',
      description: 'Relative end-diastolic ventricular filling index.'
    },
    {
      key: 'contractility',
      label: 'Inotropic Contractility',
      symbol: 'Inotropy',
      unit: '×norm',
      type: 'number',
      min: 0.5,
      max: 1.6,
      step: 0.05,
      precision: 2,
      defaultValue: 1.0,
      group: 'Cardiac Pump',
      description: 'Myocardial contractile force (elevated by sympathetic β1 tone).'
    },
    {
      key: 'tprMmHgMinPerL',
      label: 'Peripheral Resistance (TPR)',
      symbol: 'TPR',
      unit: 'mmHg·min/L',
      type: 'number',
      min: 8,
      max: 35,
      step: 0.5,
      precision: 1,
      defaultValue: 17.5,
      group: 'Vasculature',
      description: 'Arteriolar systemic vascular resistance.'
    },
    {
      key: 'arterialCompliance',
      label: 'Arterial Compliance',
      symbol: 'C_art',
      unit: '×norm',
      type: 'number',
      min: 0.4,
      max: 1.8,
      step: 0.1,
      precision: 1,
      defaultValue: 1.0,
      group: 'Vasculature',
      description: 'Aortic elastic distensibility (lower values model arterial stiffness).'
    }
  ],
  presets: [
    {
      id: 'resting_normal',
      label: 'Resting Normal Sinus',
      description: '72 bpm, SV ~70 mL, CO ~5.0 L/min, BP ~120/80 mmHg.',
      parameters: {
        heartRateBpm: 72,
        preloadFactor: 1.0,
        contractility: 1.0,
        tprMmHgMinPerL: 17.5,
        arterialCompliance: 1.0
      }
    },
    {
      id: 'sympathetic_exercise',
      label: 'Aerobic Exercise Response',
      description: 'Higher HR (130 bpm), contractility (1.35×), preload (1.2×), and skeletal muscle vasodilation (TPR 10).',
      parameters: {
        heartRateBpm: 130,
        preloadFactor: 1.2,
        contractility: 1.35,
        tprMmHgMinPerL: 10.0,
        arterialCompliance: 1.0
      }
    },
    {
      id: 'essential_hypertension',
      label: 'High-TPR Arterial Stiffness',
      description: 'Elevated TPR (26 mmHg·min/L) + reduced compliance (0.65×) widening pulse pressure.',
      parameters: {
        heartRateBpm: 78,
        preloadFactor: 1.0,
        contractility: 1.05,
        tprMmHgMinPerL: 26.0,
        arterialCompliance: 0.65
      }
    }
  ],
  simulation: {
    mode: 'time_series',
    timeUnit: 's',
    dt: 0.05,
    maxTime: 10,
    defaultSpeed: 1,
    xAxisLabel: 'Elapsed Time',
    xAxisUnit: 's',
    yAxisLabel: 'Arterial Blood Pressure',
    yAxisUnit: 'mmHg',
    yDomain: [30, 220],
    series: [
      {
        id: 'arterial_pressure',
        label: 'Arterial Pulse Waveform',
        unit: 'mmHg',
        colorHex: '#ef4444',
        referenceLines: [
          { value: 120, label: 'Normotensive SBP (120)', colorHex: '#10b981' },
          { value: 80, label: 'Normotensive DBP (80)', colorHex: '#06b6d4' }
        ]
      }
    ],
    metrics: [
      { key: 'cardiacOutput', label: 'Cardiac Output (CO)', unit: 'L/min', precision: 2, highlightTone: 'nominal' },
      { key: 'strokeVolume', label: 'Stroke Volume (SV)', unit: 'mL', precision: 1 },
      { key: 'sbpDbp', label: 'Blood Pressure (SBP/DBP)', unit: 'mmHg' },
      { key: 'mapMmHg', label: 'Mean Arterial (MAP)', unit: 'mmHg', precision: 0 },
      { key: 'pulsePressure', label: 'Pulse Pressure', unit: 'mmHg', precision: 0 },
      { key: 'rhythmClass', label: 'Hemodynamic Status', unit: '' }
    ],
    init: (params) => {
      const h = computeHemodynamics(0, params);
      return {
        stepIndex: 0,
        simTime: 0,
        timeUnit: 's',
        completed: false,
        phaseLabel: h.rhythmClassification,
        state: {},
        metrics: {
          cardiacOutput: h.cardiacOutputLMin,
          strokeVolume: h.strokeVolumeMl,
          sbpDbp: `${h.sbpMmHg.toFixed(0)} / ${h.dbpMmHg.toFixed(0)}`,
          mapMmHg: h.mapMmHg,
          pulsePressure: h.pulsePressureMmHg,
          rhythmClass: h.rhythmClassification
        },
        seriesHistory: {
          arterial_pressure: [{ x: 0, y: h.arterialPressureAtT }]
        },
        visualState: {
          heartRateBpm: h.heartRateBpm,
          strokeVolumeMl: h.strokeVolumeMl,
          cardiacOutputLMin: h.cardiacOutputLMin,
          sbpMmHg: h.sbpMmHg,
          dbpMmHg: h.dbpMmHg,
          mapMmHg: h.mapMmHg,
          tpr: Number(params.tprMmHgMinPerL) || 17.5,
          instantPressure: h.arterialPressureAtT
        },
        warnings: buildCardiacWarnings(h),
        summaryInterpretation: `CO = ${h.cardiacOutputLMin.toFixed(2)} L/min, BP = ${h.sbpMmHg.toFixed(0)}/${h.dbpMmHg.toFixed(0)} mmHg (MAP ${h.mapMmHg.toFixed(0)} mmHg).`
      };
    },
    step: (snapshot, params, dtOverride) => {
      const dt = dtOverride ?? 0.05;
      const maxTime = 10;
      const nextTime = Math.min(maxTime, snapshot.simTime + dt);
      const h = computeHemodynamics(nextTime, params);

      return {
        stepIndex: snapshot.stepIndex + 1,
        simTime: nextTime,
        timeUnit: 's',
        completed: nextTime >= maxTime,
        phaseLabel: h.rhythmClassification,
        state: {},
        metrics: {
          cardiacOutput: h.cardiacOutputLMin,
          strokeVolume: h.strokeVolumeMl,
          sbpDbp: `${h.sbpMmHg.toFixed(0)} / ${h.dbpMmHg.toFixed(0)}`,
          mapMmHg: h.mapMmHg,
          pulsePressure: h.pulsePressureMmHg,
          rhythmClass: h.rhythmClassification
        },
        seriesHistory: {
          arterial_pressure: [
            ...(snapshot.seriesHistory.arterial_pressure || []),
            { x: nextTime, y: h.arterialPressureAtT }
          ]
        },
        visualState: {
          heartRateBpm: h.heartRateBpm,
          strokeVolumeMl: h.strokeVolumeMl,
          cardiacOutputLMin: h.cardiacOutputLMin,
          sbpMmHg: h.sbpMmHg,
          dbpMmHg: h.dbpMmHg,
          mapMmHg: h.mapMmHg,
          tpr: Number(params.tprMmHgMinPerL) || 17.5,
          instantPressure: h.arterialPressureAtT
        },
        warnings: buildCardiacWarnings(h),
        summaryInterpretation: `CO = ${h.cardiacOutputLMin.toFixed(2)} L/min (HR ${h.heartRateBpm} bpm × SV ${h.strokeVolumeMl.toFixed(1)} mL), BP = ${h.sbpMmHg.toFixed(0)}/${h.dbpMmHg.toFixed(0)} mmHg.`
      };
    }
  },
  observationPrompts: [
    'Record CO, SV, MAP, and SBP/DBP at resting baseline vs. exercise vasodilation.',
    'Observe how lowering arterial compliance widens pulse pressure even at the same MAP.'
  ],
  defaultConclusionTemplate:
    'Mean arterial pressure varied proportionally with CO × TPR, while reduced arterial compliance amplified systolic-diastolic pulse pressure excursions.'
};
