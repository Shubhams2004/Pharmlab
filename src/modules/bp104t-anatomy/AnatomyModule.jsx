import React, { useState } from 'react';
import { Activity, Microscope, Bone, Droplet, HeartPulse, FileText, CheckCircle2, RefreshCcw } from 'lucide-react';

export default function AnatomyModule() {
  const [activeTab, setActiveTab] = useState('hematology');

  // Existing Exp 8 & 11 States
  const [dilution, setDilution] = useState('20');
  const [depth] = useState('0.1');
  const [squaresCounted, setSquaresCounted] = useState('');
  const [wbcResult, setWbcResult] = useState(null);

  const [hbValue, setHbValue] = useState('');
  const [gender, setGender] = useState('male');
  const [hbResult, setHbResult] = useState(null);

  // Exp 1: Compound Microscope Magnification
  const [eyepiece, setEyepiece] = useState(10);
  const [objective, setObjective] = useState(40);
  const [selectedScopePart, setSelectedScopePart] = useState('Objective Lens');

  // Exp 2 & 3: Histology
  const [selectedTissue, setSelectedTissue] = useState('Epithelial');

  // Exp 4 & 5: Axial & Appendicular Bones
  const [boneDivision, setBoneDivision] = useState('axial');

  // Exp 7: Cell Analyser CBC Simulator
  const [cbcPreset, setCbcPreset] = useState('normal');

  // Exp 8b: Differential Leukocyte Count (DLC) 100-cell counter
  const [dlc, setDlc] = useState({ Neutrophils: 60, Lymphocytes: 30, Monocytes: 6, Eosinophils: 3, Basophils: 1 });

  // Exp 9: RBC Count
  const [rbcCells, setRbcCells] = useState(480);
  const [rbcDilution, setRbcDilution] = useState(200);

  // Exp 10: BT & CT
  const [btMin, setBtMin] = useState(2.5);
  const [ctMin, setCtMin] = useState(5.5);

  // Exp 12: Blood Grouping (ABO & Rh)
  const [antiA, setAntiA] = useState(true);
  const [antiB, setAntiB] = useState(false);
  const [antiD, setAntiD] = useState(true);

  // Exp 13: ESR
  const [esrMm, setEsrMm] = useState(12);

  // Exp 14: BP & Pulse
  const [sbp, setSbp] = useState(120);
  const [dbp, setDbp] = useState(80);
  const [pulseRate, setPulseRate] = useState(72);

  // Exp 15: ECG Simulator
  const [ecgRhythm, setEcgRhythm] = useState('normal');

  // Exp 17: Case Studies
  const [selectedCase, setSelectedCase] = useState('Anaemia');

  const calculateWbc = (e) => {
    e.preventDefault();
    const cells = parseFloat(squaresCounted);
    const d = parseFloat(dilution);
    const dep = parseFloat(depth);
    if (cells >= 0 && d > 0 && dep > 0) {
      const totalWbc = (cells * d) / (0.1 * 4 * dep);
      setWbcResult(Math.round(totalWbc));
    }
  };

  const analyzeHb = (e) => {
    e.preventDefault();
    const hb = parseFloat(hbValue);
    if (hb > 0) {
      let status = 'Normal';
      if (gender === 'male' && hb < 13.0) status = 'Anemic (Low Hemoglobin)';
      else if (gender === 'female' && hb < 12.0) status = 'Anemic (Low Hemoglobin)';
      else if (hb > 17.5) status = 'High (Polycythemia)';
      setHbResult({ status, value: hb });
    }
  };

  // RBC Count calculation: (N * Dilution) / (Area 1/5 mm² * Depth 0.1 mm) = N * Dilution * 50
  const rbcTotal = (rbcCells * rbcDilution) / (0.2 * 0.1);
  const dlcTotal = Object.values(dlc).reduce((a, b) => a + b, 0);

  const getBloodGroup = () => {
    const abo = antiA && antiB ? 'AB' : antiA ? 'A' : antiB ? 'B' : 'O';
    const rh = antiD ? '+' : '-';
    return `${abo}${rh}`;
  };

  const pulsePressure = sbp - dbp;
  const mapVal = dbp + pulsePressure / 3;
  const bpClass =
    sbp < 120 && dbp < 80
      ? 'Normal'
      : sbp < 130 && dbp < 80
      ? 'Elevated'
      : sbp < 140 || dbp < 90
      ? 'Stage 1 Hypertension'
      : 'Stage 2 Hypertension';

  const microscopeParts = {
    'Eyepiece (Ocular)': 'Magnifies the primary real image formed by the objective (typically 10× or 15×).',
    'Objective Lens': '4× (Scanning), 10× (Low Power), 40× (High Dry), 100× (Oil Immersion — uses cedarwood oil to match glass refractive index 1.515).',
    'Abbe Condenser & Iris Diaphragm': 'Focuses light cone onto specimen and regulates contrast/numerical aperture.',
    'Fine & Coarse Adjustment': 'Coarse knob for rapid stage movement under low power; fine knob for crisp focus under 40×/100×.'
  };

  const tissues = {
    Epithelial: {
      subtypes: 'Simple squamous (alveoli), Cuboidal (renal tubules), Columnar (GI tract), Stratified squamous (skin/esophagus), Transitional (urinary bladder).',
      features: 'Closely packed cells, basement membrane, avascular, rapid regeneration.'
    },
    Connective: {
      subtypes: 'Areolar, Adipose, Dense regular (tendons/ligaments), Cartilage (hyaline/elastic/fibro), Bone (osteons/Haversian canals), Blood.',
      features: 'Abundant extracellular matrix (collagen/elastic fibers) with scattered cells (fibroblasts, chondrocytes, osteocytes).'
    },
    Muscular: {
      subtypes: 'Skeletal (striated, multinucleated, voluntary), Cardiac (striated, intercalated discs, involuntary), Smooth (spindle-shaped, non-striated, involuntary).',
      features: 'Contractile actin and myosin myofilaments.'
    },
    Nervous: {
      subtypes: 'Multipolar/Bipolar/Unipolar Neurons (soma, dendrites, myelinated axon, Nodes of Ranvier) & Neuroglia (astrocytes, oligodendrocytes, Schwann cells, microglia).',
      features: 'Excitable membrane conducting action potentials via saltatory conduction.'
    }
  };

  const axialBones = [
    { group: 'Skull (Cranium + Face)', count: 22, details: '8 Cranial (Frontal, Parietal×2, Temporal×2, Occipital, Sphenoid, Ethmoid) + 14 Facial (Maxilla, Mandible, Zygomatic, Nasal, etc.)' },
    { group: 'Auditory Ossicles + Hyoid', count: 7, details: 'Malleus×2, Incus×2, Stapes×2 (6) + Hyoid U-shaped neck bone (1)' },
    { group: 'Vertebral Column', count: 26, details: '7 Cervical (C1 Atlas, C2 Axis), 12 Thoracic, 5 Lumbar, 1 Sacrum (5 fused), 1 Coccyx (4 fused)' },
    { group: 'Thoracic Cage', count: 25, details: 'Sternum (1: Manubrium, Body, Xiphoid) + 24 Ribs (7 pairs True, 3 pairs False, 2 pairs Floating)' }
  ];

  const appendicularBones = [
    { group: 'Pectoral Girdle', count: 4, details: 'Clavicle (Collarbone ×2) + Scapula (Shoulder blade ×2)' },
    { group: 'Upper Limbs', count: 60, details: 'Humerus (2), Radius (2), Ulna (2), Carpals (16), Metacarpals (10), Phalanges (28)' },
    { group: 'Pelvic Girdle', count: 2, details: '2 Coxal (Hip) bones formed by fusion of Ilium, Ischium, and Pubis' },
    { group: 'Lower Limbs', count: 60, details: 'Femur (2), Patella (2), Tibia (2), Fibula (2), Tarsals (14), Metatarsals (10), Phalanges (28)' }
  ];

  const cbcPresets = {
    normal: { label: 'Normal Adult', wbc: '7,400 /µL', rbc: '4.9 M/µL', hb: '14.6 g/dL', hct: '43.5%', mcv: '88.8 fL', plt: '245,000 /µL', flag: 'Within Reference Limits' },
    ida: { label: 'Iron Deficiency Anaemia', wbc: '6,800 /µL', rbc: '3.6 M/µL', hb: '8.4 g/dL ↓', hct: '27.0% ↓', mcv: '72.0 fL ↓ (Microcytic)', plt: '380,000 /µL', flag: 'Microcytic Hypochromic Anaemia' },
    infection: { label: 'Acute Bacterial Infection', wbc: '16,900 /µL ↑', rbc: '4.7 M/µL', hb: '13.8 g/dL', hct: '41.0%', mcv: '87.2 fL', plt: '290,000 /µL', flag: 'Leukocytosis (Neutrophilia)' }
  };

  const caseFiles = {
    Anaemia: {
      patient: '24F presenting with pallor, koilonychia, fatigue, Hb 8.2 g/dL, MCV 70 fL.',
      etiology: 'Iron deficiency (chronic menorrhagia/poor intake), Vitamin B12/folate deficiency (megaloblastic), or HbS point mutation (sickle cell).',
      management: 'Oral ferrous sulphate + Vitamin C; B12/folic acid supplementation in megaloblastic anaemia.'
    },
    Thalassemia: {
      patient: '8M with hepatosplenomegaly, chipmunk facies, microcytic anemia, target cells on smear, elevated HbF/HbA2.',
      etiology: 'Autosomal recessive defect in α- or β-globin chain synthesis causing ineffective erythropoiesis & hemolysis.',
      management: 'Regular packed RBC transfusions + iron chelation (Deferasirox / Deferoxamine).'
    },
    Haemophilia: {
      patient: '12M with spontaneous hemarthrosis (knee swelling) and prolonged bleeding after dental extraction; normal PT, prolonged aPTT.',
      etiology: 'X-linked recessive deficiency of Clotting Factor VIII (Haemophilia A) or Factor IX (Haemophilia B).',
      management: 'Recombinant Factor VIII/IX concentrate replacement; avoid aspirin/NSAIDs.'
    },
    Leprosy: {
      patient: '35M with hypopigmented anesthetic skin patches and thickened ulnar nerve.',
      etiology: 'Chronic granulomatous infection caused by Mycobacterium leprae affecting skin and peripheral Schwann cells.',
      management: 'WHO Multi-Drug Therapy (MDT): Rifampicin, Dapsone, and Clofazimine.'
    },
    Gout: {
      patient: '52M with acute nocturnal severe pain, erythema, and swelling of the 1st metatarsophalangeal joint (podagra); serum uric acid 9.8 mg/dL.',
      etiology: 'Deposition of monosodium urate monohydrate crystals in synovial joints triggering neutrophil inflammation.',
      management: 'Acute: Colchicine / NSAIDs. Chronic prophylaxis: Allopurinol or Febuxostat (xanthine oxidase inhibitors).'
    },
    Hypertension: {
      patient: '58M asymptomatic, BP 156/96 mmHg recorded on 3 separate visits; mild LVH on ECG.',
      etiology: 'Primary (essential) multifactorial RAAS/sympathetic dysregulation or secondary renal/endocrine causes.',
      management: 'DASH diet, Na⁺ restriction, ACE inhibitors / ARBs / CCBs / Thiazide diuretics.'
    },
    'Ischemic Heart Disease': {
      patient: '62M with substernal crushing chest pain radiating to left arm, diaphoresis, ST-segment elevation in leads V1–V4, Troponin-I elevated.',
      etiology: 'Coronary artery atherosclerosis plaque rupture and thrombosis causing myocardial ischemia/infarction.',
      management: 'MONA (Morphine, O₂, Nitroglycerin, Aspirin) + dual antiplatelet + thrombolysis / PCI.'
    }
  };

  // ECG waveform path generator
  const getEcgPath = () => {
    if (ecgRhythm === 'bradycardia') {
      return 'M 0 65 L 40 65 Q 50 53 60 65 L 85 65 L 92 73 L 100 18 L 108 82 L 116 65 L 145 65 Q 165 44 185 65 L 300 65 Q 310 53 320 65 L 345 65 L 352 73 L 360 18 L 368 82 L 376 65 L 405 65 Q 425 44 445 65 L 540 65';
    }
    if (ecgRhythm === 'tachycardia') {
      return 'M 0 65 L 18 65 Q 24 55 30 65 L 42 65 L 46 72 L 52 20 L 58 80 L 64 65 L 78 65 Q 90 46 102 65 L 130 65 Q 136 55 142 65 L 154 65 L 158 72 L 164 20 L 170 80 L 176 65 L 190 65 Q 202 46 214 65 L 250 65 Q 256 55 262 65 L 274 65 L 278 72 L 284 20 L 290 80 L 296 65 L 310 65 Q 322 46 334 65 L 370 65 Q 376 55 382 65 L 394 65 L 398 72 L 404 20 L 410 80 L 416 65 L 430 65 Q 442 46 454 65 L 540 65';
    }
    if (ecgRhythm === 'st_elevation') {
      return 'M 0 65 L 35 65 Q 43 54 51 65 L 70 65 L 76 72 L 84 18 L 92 76 L 98 46 L 130 44 Q 152 30 175 65 L 255 65 Q 263 54 271 65 L 290 65 L 296 72 L 304 18 L 312 76 L 318 46 L 350 44 Q 372 30 395 65 L 540 65';
    }
    // normal sinus
    return 'M 0 65 L 35 65 Q 43 54 51 65 L 70 65 L 76 72 L 84 18 L 92 82 L 99 65 L 122 65 Q 140 44 158 65 L 215 65 Q 223 54 231 65 L 250 65 L 256 72 L 264 18 L 272 82 L 279 65 L 302 65 Q 320 44 338 65 L 395 65 Q 403 54 411 65 L 430 65 L 436 72 L 444 18 L 452 82 L 459 65 L 482 65 Q 500 44 518 65 L 540 65';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP104T / BP109P Core Practical Suite (17 Experiments)</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 mb-1 text-white">Human Anatomy, Physiology &amp; Pathophysiology I Lab</h2>
        <p className="text-slate-400 text-sm">
          Complete BP109P virtual laboratory: Microscopy, Histology, Axial/Appendicular Osteology, Hemocytometry, Cell Analyser, DLC, RBC, BT/CT, Hb, Blood Grouping, ESR, BP, ECG, CVS/Skin &amp; Case Files.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'hematology', label: '🩸 Hematology & Blood Group (Exp 6–13)' },
          { id: 'microscopy', label: '🔬 Microscopy & Histology (Exp 1–3)' },
          { id: 'bones', label: '🦴 Axial & Appendicular Bones (Exp 4–5)' },
          { id: 'cardio', label: '❤️ Vitals, ECG & CVS/Skin (Exp 14–16)' },
          { id: 'cases', label: '📋 Clinical Case Files (Exp 17)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HEMATOLOGY (Exp 6 - 13) */}
      {activeTab === 'hematology' && (
        <div className="space-y-6">
          {/* Existing Exp 8 & 11 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-emerald-300 mb-2">Exp 8. Hemocytometry WBC Enumeration</h3>
              <form onSubmit={calculateWbc} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Total Cells Counted in 4 Corner Squares</label>
                  <input
                    type="number"
                    step="any"
                    value={squaresCounted}
                    onChange={(e) => setSquaresCounted(e.target.value)}
                    placeholder="e.g., 160"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dilution Factor (Turk's Fluid, 1:20)</label>
                  <input
                    type="number"
                    value={dilution}
                    onChange={(e) => setDilution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
                  Calculate WBC Count
                </button>
              </form>
              {wbcResult !== null && (
                <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
                  <span className="text-sm text-slate-400">Total Leukocyte Count: </span>
                  <span className="text-xl font-bold text-emerald-400">{wbcResult} cells/cu.mm</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-emerald-300 mb-2">Exp 11. Hemoglobin Diagnostic Analyzer (Sahli's)</h3>
              <form onSubmit={analyzeHb} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Hemoglobin Value (g/dL)</label>
                  <input
                    type="number"
                    step="any"
                    value={hbValue}
                    onChange={(e) => setHbValue(e.target.value)}
                    placeholder="e.g., 13.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Patient Demographic</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="male">Male (Normal: 13.5 - 17.5 g/dL)</option>
                    <option value="female">Female (Normal: 12.0 - 15.5 g/dL)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
                  Evaluate Hemoglobin
                </button>
              </form>
              {hbResult && (
                <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
                  <span className="text-sm text-slate-400">Status: </span>
                  <span className="block text-lg font-bold text-emerald-400 mt-1">{hbResult.status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Exp 8b & 9: DLC Counter & RBC Enumeration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Exp 8(b). Differential Leukocyte Count (DLC)</h3>
                <button onClick={() => setDlc({ Neutrophils: 0, Lymphocytes: 0, Monocytes: 0, Eosinophils: 0, Basophils: 0 })} className="text-xs text-slate-400 hover:text-white flex items-center space-x-1">
                  <RefreshCcw className="w-3.5 h-3.5" /><span>Reset</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">Click cell types on Leishman-stained smear (Target: 100 cells | Total: <strong className="text-emerald-400">{dlcTotal}</strong>)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(dlc).map(([cell, count]) => (
                  <button
                    key={cell}
                    onClick={() => setDlc({ ...dlc, [cell]: count + 1 })}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl p-3 text-left transition-all"
                  >
                    <span className="text-[11px] text-slate-400 block">{cell}</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">{dlcTotal > 0 ? ((count / dlcTotal) * 100).toFixed(0) : 0}%</span>
                    <span className="text-[10px] text-slate-500 block">({count} cells)</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Exp 9. Total RBC Count (Hayem's Fluid)</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">RBCs in 5 Central Squares (N)</label>
                  <input type="number" value={rbcCells} onChange={(e) => setRbcCells(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dilution Factor</label>
                  <input type="number" value={rbcDilution} onChange={(e) => setRbcDilution(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <span className="text-xs text-slate-400 block">Total RBC Count = (N × Dilution) / (0.2 × 0.1)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{(rbcTotal / 1e6).toFixed(2)} million / cu.mm</span>
                <span className="text-[11px] text-slate-400 block mt-1">Normal: Male 4.5–6.0 M | Female 4.0–5.5 M/cu.mm</span>
              </div>
            </div>
          </div>

          {/* Exp 12: Blood Grouping + Exp 10 & 13: BT/CT & ESR + Exp 7: Cell Analyser */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exp 12 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Exp 12. ABO &amp; Rh Blood Grouping</h3>
              <p className="text-xs text-slate-400">Toggle slide agglutination (clumping) observed with antisera:</p>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Anti-A Serum (Blue)', state: antiA, set: setAntiA },
                  { label: 'Anti-B Serum (Yellow)', state: antiB, set: setAntiB },
                  { label: 'Anti-D / Rh Serum (Colorless)', state: antiD, set: setAntiD }
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => s.set(!s.state)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl border ${
                      s.state ? 'bg-rose-500/15 border-rose-500 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="font-mono font-bold">{s.state ? 'Agglutination (+)' : 'No Clumping (-)'}</span>
                  </button>
                ))}
              </div>
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 text-center">
                <span className="text-xs text-slate-400">Identified Blood Group:</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{getBloodGroup()}</p>
              </div>
            </div>

            {/* Exp 10 & 13 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Exp 10 &amp; 13. BT, CT &amp; ESR Analyzer</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Bleeding Time — Duke's Method (min) [Normal: 1–5 min]</label>
                  <input type="number" step="0.5" value={btMin} onChange={(e) => setBtMin(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Clotting Time — Capillary Tube (min) [Normal: 3–8 min]</label>
                  <input type="number" step="0.5" value={ctMin} onChange={(e) => setCtMin(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ESR — Westergren Method (mm/1st hr)</label>
                  <input type="number" value={esrMm} onChange={(e) => setEsrMm(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <p>BT/CT Status: <strong className={btMin > 5 || ctMin > 8 ? 'text-rose-400' : 'text-emerald-400'}>{btMin > 5 || ctMin > 8 ? 'Prolonged Hemostasis' : 'Normal Hemostasis'}</strong></p>
                <p>ESR Interpretation: <strong className={esrMm > 20 ? 'text-amber-400' : 'text-emerald-400'}>{esrMm > 20 ? 'Elevated (Inflammation / Infection / Anaemia)' : 'Normal Sedimentation'}</strong></p>
              </div>
            </div>

            {/* Exp 6 & 7: Cell Analyser & Hemocytometry Intro */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Exp 6 &amp; 7. Cell Analyser CBC Demo</h3>
              <select value={cbcPreset} onChange={(e) => setCbcPreset(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                <option value="normal">Normal Adult CBC Profile</option>
                <option value="ida">Iron Deficiency Anaemia Profile</option>
                <option value="infection">Acute Bacterial Infection Profile</option>
              </select>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between"><span className="text-slate-400">WBC:</span><span className="text-white">{cbcPresets[cbcPreset].wbc}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">RBC:</span><span className="text-white">{cbcPresets[cbcPreset].rbc}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Hb / Hct:</span><span className="text-white">{cbcPresets[cbcPreset].hb} / {cbcPresets[cbcPreset].hct}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">MCV:</span><span className="text-white">{cbcPresets[cbcPreset].mcv}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Platelets:</span><span className="text-white">{cbcPresets[cbcPreset].plt}</span></div>
                <div className="pt-2 border-t border-slate-800 text-emerald-400 font-sans font-bold">{cbcPresets[cbcPreset].flag}</div>
              </div>
              <p className="text-[11px] text-slate-400">Exp 6 Neubauer Grid: 3×3 mm total area, 0.1 mm depth; corner 4 squares (1 mm² each) for WBC, central 5 small squares (0.2 mm²) for RBC.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MICROSCOPY & HISTOLOGY (Exp 1 - 3) */}
      {activeTab === 'microscopy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Microscope className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Exp 1. Study of Compound Microscopes</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Eyepiece Magnification</label>
                <select value={eyepiece} onChange={(e) => setEyepiece(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white">
                  <option value={5}>5×</option>
                  <option value={10}>10×</option>
                  <option value={15}>15×</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Objective Lens</label>
                <select value={objective} onChange={(e) => setObjective(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white">
                  <option value={4}>4× (Scanning)</option>
                  <option value={10}>10× (Low Power)</option>
                  <option value={40}>40× (High Power)</option>
                  <option value={100}>100× (Oil Immersion)</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 text-center">
              <span className="text-xs text-slate-400">Total Magnification = Eyepiece × Objective</span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{eyepiece * objective}×</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(microscopeParts).map((part) => (
                <button
                  key={part}
                  onClick={() => setSelectedScopePart(part)}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    selectedScopePart === part ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">{microscopeParts[selectedScopePart]}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Exp 2 &amp; 3. Microscopic Study of Four Primary Tissues</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(tissues).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTissue(t)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                    selectedTissue === t ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {t} Tissue
                </button>
              ))}
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h4 className="text-sm font-bold text-emerald-400">{selectedTissue} Tissue Histology</h4>
              <p className="text-slate-300 leading-relaxed"><strong>Classification &amp; Locations:</strong> {tissues[selectedTissue].subtypes}</p>
              <p className="text-slate-300 leading-relaxed"><strong>Key Diagnostic Features:</strong> {tissues[selectedTissue].features}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AXIAL & APPENDICULAR BONES (Exp 4 - 5) */}
      {activeTab === 'bones' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Bone className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Exp 4 &amp; 5. Human Skeleton Identification (206 Bones)</h3>
                <p className="text-xs text-slate-400">Axial Skeleton (80 bones) vs Appendicular Skeleton (126 bones).</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBoneDivision('axial')} className={`px-4 py-2 rounded-xl text-xs font-semibold border ${boneDivision === 'axial' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                Exp 4: Axial Bones (80)
              </button>
              <button onClick={() => setBoneDivision('appendicular')} className={`px-4 py-2 rounded-xl text-xs font-semibold border ${boneDivision === 'appendicular' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                Exp 5: Appendicular Bones (126)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(boneDivision === 'axial' ? axialBones : appendicularBones).map((b) => (
              <div key={b.group} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-400">{b.group}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 font-mono text-xs text-white">{b.count} bones</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{b.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VITALS, ECG, CVS & INTEGUMENTARY (Exp 14 - 16) */}
      {activeTab === 'cardio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Exp 14: BP & Pulse */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Exp 14. Pulse Rate, Heart Rate &amp; Blood Pressure</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Systolic BP (mmHg)</label>
                  <input type="number" value={sbp} onChange={(e) => setSbp(Number(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Diastolic BP (mmHg)</label>
                  <input type="number" value={dbp} onChange={(e) => setDbp(Number(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Radial Pulse / Heart Rate (bpm)</label>
                  <input type="number" value={pulseRate} onChange={(e) => setPulseRate(Number(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-1">
                <p>BP Category: <strong className="text-emerald-400">{bpClass}</strong></p>
                <p>Pulse Pressure (SBP − DBP): <strong className="font-mono text-blue-400">{pulsePressure} mmHg</strong></p>
                <p>Mean Arterial Pressure (MAP): <strong className="font-mono text-amber-400">{mapVal.toFixed(1)} mmHg</strong></p>
                <p>Rate Status: <strong className="text-slate-200">{pulseRate < 60 ? 'Bradycardia' : pulseRate > 100 ? 'Tachycardia' : 'Normal Sinus (60–100 bpm)'}</strong></p>
              </div>
            </div>

            {/* Exp 15: ECG */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                  <span>Exp 15. ECG Recording &amp; Interpretation</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'normal', label: 'Normal Sinus' },
                    { id: 'bradycardia', label: 'Bradycardia' },
                    { id: 'tachycardia', label: 'Tachycardia' },
                    { id: 'st_elevation', label: 'ST Elevation (MI)' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setEcgRhythm(r.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                        ecgRhythm === r.id ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-black border border-slate-800 rounded-xl p-4">
                <svg viewBox="0 0 540 100" className="w-full h-32">
                  <path d={getEcgPath()} fill="none" stroke="#10b981" strokeWidth="2.5" />
                </svg>
              </div>
              <p className="text-xs text-slate-300">
                <strong>Waves:</strong> P wave (Atrial depolarization) &bull; QRS complex (Ventricular depolarization, 0.08–0.10 s) &bull; T wave (Ventricular repolarization). PR interval: 0.12–0.20 s.
              </p>
            </div>
          </div>

          {/* Exp 16: CVS & Integumentary System */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2 text-xs">
              <h3 className="text-base font-bold text-emerald-400">Exp 16(a). Cardiovascular System &amp; Conduction</h3>
              <p className="text-slate-300 leading-relaxed">
                <strong>Conduction Pathway:</strong> SA Node (Pacemaker, 70–80 bpm) → Internodal tracts → AV Node (0.1s delay) → Bundle of His → Left &amp; Right Bundle Branches → Purkinje Fibers.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong>Cardiac Cycle (0.8 s):</strong> Atrial Systole (0.1 s) → Ventricular Systole (0.3 s, S1 "Lubb" AV valve closure) → Complete Cardiac Diastole (0.4 s, S2 "Dupp" semilunar valve closure).
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2 text-xs">
              <h3 className="text-base font-bold text-emerald-400">Exp 16(b). Integumentary System &amp; Wound Healing</h3>
              <p className="text-slate-300 leading-relaxed">
                <strong>Skin Layers:</strong> Epidermis (Stratum corneum, lucidum, granulosum, spinosum, basale with melanocytes) → Dermis (collagen, hair follicles, sebaceous/sweat glands, Meissner/Pacinian corpuscles) → Hypodermis (subcutaneous adipose).
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong>Wound Healing Phases:</strong> Hemostasis → Inflammation → Proliferation (granulation &amp; angiogenesis) → Maturation/Remodeling.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CASE STUDIES (Exp 17) */}
      {activeTab === 'cases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5" />
            <div>
              <h3 className="text-lg font-bold text-white">Exp 17. Clinical Patient Case Files (7 Core Disorders)</h3>
              <p className="text-xs text-slate-400">Anaemia, Thalassemia, Haemophilia, Leprosy, Gout, Hypertension, and Ischemic Heart Disease.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(caseFiles).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCase(c)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                  selectedCase === c ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
            <h4 className="text-base font-bold text-white">{selectedCase} — Clinical Case File</h4>
            <p className="text-slate-200 bg-slate-900 p-3.5 rounded-lg border border-slate-800"><strong>Clinical Presentation:</strong> {caseFiles[selectedCase].patient}</p>
            <p className="text-slate-300 leading-relaxed"><strong>Etiology &amp; Pathogenesis:</strong> {caseFiles[selectedCase].etiology}</p>
            <p className="text-emerald-300 leading-relaxed"><strong>Pharmacotherapy &amp; Management:</strong> {caseFiles[selectedCase].management}</p>
          </div>
        </div>
      )}
    </div>
  );
}
