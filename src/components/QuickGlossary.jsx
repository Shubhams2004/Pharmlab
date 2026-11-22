import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, X, ArrowRight } from 'lucide-react';

export const GLOSSARY_TERMS = [
  // BP102T / BP107P — General Pharmacy
  {
    term: 'Alligation (Alternate & Medial)',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'alligation',
    formula: 'Parts High = |Target − Low| ; Parts Low = |High − Target|',
    definition: 'Arithmetical method for calculating exact proportions of two or more stock solutions or solids of different strengths to achieve a desired intermediate concentration.'
  },
  {
    term: 'Displacement Value (DV)',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'suppository',
    formula: 'Base Displaced (g) = Total Drug (g) / DV',
    definition: 'Number of parts by weight of medicament that displaces one part by weight of suppository base (usually theobroma oil). Essential when moulding dense solids like Zinc Oxide (DV ≈ 4.0).'
  },
  {
    term: 'Isotonicity & E-Value (NaCl Equivalent)',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'isotonicity',
    formula: 'Additional NaCl (g) = (0.009 × V_mL) − (Drug_g × E)',
    definition: 'Solutions matching osmotic pressure of blood plasma and lacrimal fluid (equivalent to 0.9% w/v NaCl, ΔTf = −0.52°C). The E-value represents grams of NaCl producing the same osmotic effect as 1 g of drug.'
  },
  {
    term: 'Proof Spirit (°O.P. / °U.P.)',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'posology_proof',
    formula: 'Proof Strength ≈ % v/v Ethanol × 1.753',
    definition: 'Historical excise benchmark equal to 57.1% v/v (49.28% w/w) ethanol in water (100° Proof). Strengths above 57.1% v/v are Over Proof (O.P.) and below are Under Proof (U.P.).'
  },
  {
    term: 'Geometric Dilution',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'experiments',
    formula: '1 : 1 stepwise equal-bulk blending',
    definition: 'Standard compounding technique where a small quantity of potent API is triturated with an equal weight of diluent, repeating by doubling the mixture size at each step to ensure uniform drug distribution.'
  },
  {
    term: 'Posology (Young, Dilling, Clark, Fried, BSA)',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'posology_proof',
    formula: 'Young: Dose × Age / (Age + 12) | Clark: Dose × Wt(lb) / 150',
    definition: 'Branch of pharmacy dealing with optimal drug dosage calculation based on patient age, body weight, or Body Surface Area (BSA, reference 1.73 m²).'
  },
  {
    term: 'Eutectic Mixture',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'theory',
    formula: 'e.g. Menthol + Camphor / Thymol',
    definition: 'Mixture of two or more crystalline solids whose combined melting point drops below room temperature, causing spontaneous liquefaction unless adsorbed with light MgCO₃ or kaolin.'
  },
  {
    term: 'Flocculated vs Deflocculated Suspension',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'theory',
    definition: 'Flocculated particles form loose, porous aggregates that settle rapidly yet redisperse easily without caking; deflocculated particles settle slowly as isolated units forming an irreversible hard cake.'
  },
  {
    term: 'Polymorphism (Cocoa Butter)',
    subject: 'general_pharmacy',
    subjectLabel: 'BP102T / BP107P',
    tab: 'experiments',
    formula: 'Stable β-form MP: 34–35°C (Do not heat > 36°C)',
    definition: 'Ability of theobroma oil to crystallize into α, β′, γ, or stable β forms. Overheating above 36°C yields low-melting α/γ polymorphs (~18–24°C) that fail to solidify at room temperature.'
  },

  // BP104T / BP109P — Human Anatomy, Physiology & Pathophysiology I
  {
    term: 'Homeostasis & Feedback Loops',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'theory',
    formula: 'Sensor → Control Center → Effector',
    definition: 'Dynamic maintenance of constant internal milieu. Negative feedback reverses deviations (baroreceptor BP reflex, insulin/glucagon); positive feedback amplifies change to completion (oxytocin, clotting cascade).'
  },
  {
    term: 'SA Node & AV Nodal Delay',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'diagrams',
    formula: 'SA Pace: 70–80 bpm | AV Delay: ~0.10 s',
    definition: 'Sinoatrial (SA) node in the right atrium initiates cardiac action potentials; the Atrioventricular (AV) node slows conduction briefly so atria empty completely into ventricles before systole.'
  },
  {
    term: 'Cardiac Output (CO) & Ejection Fraction (EF)',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'theory',
    formula: 'CO = HR × SV (~5.0 L/min) | EF = (EDV − ESV) / EDV',
    definition: 'Volume of blood pumped by each ventricle per minute (Heart Rate × Stroke Volume). Ejection Fraction (normal 55–70%) measures the percentage of end-diastolic blood ejected per beat.'
  },
  {
    term: 'Neubauer Hemocytometer Grid',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'diagrams',
    formula: 'Grid: 3 × 3 mm | Chamber Depth: 0.1 mm',
    definition: 'Precision etched glass counting chamber. Four 1 mm² corner squares are counted for WBC (1:20 dilution in Turk fluid), while 5 medium squares (0.2 mm²) in the central square are counted for RBC (1:200 in Hayem fluid).'
  },
  {
    term: 'Differential Leukocyte Count (DLC)',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'hematology',
    formula: 'Neutrophils 50–70% · Lymphocytes 20–40%',
    definition: 'Percentage distribution of the 5 white blood cell types (Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils) counted across 100 cells on a Leishman-stained peripheral smear.'
  },
  {
    term: 'Erythrocyte Sedimentation Rate (ESR)',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'hematology',
    formula: 'Westergren Normal: M 0–15 mm/hr | F 0–20 mm/hr',
    definition: 'Rate at which anticoagulated RBCs settle vertically in 1 hour due to rouleaux formation. Elevated in acute/chronic inflammation, infection, tuberculosis, and anaemia.'
  },
  {
    term: 'Agglutination (ABO & Rh Typing)',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'hematology',
    definition: 'Visible clumping of erythrocytes when surface antigens (A, B, or Rh-D) cross-link with corresponding monoclonal antisera (Anti-A, Anti-B, Anti-D) on a glass slide.'
  },
  {
    term: 'ECG Waveforms (P, QRS, T & ST Segment)',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'cardio',
    formula: 'PR: 0.12–0.20 s | QRS: 0.08–0.10 s',
    definition: 'P wave reflects atrial depolarization; QRS complex marks rapid ventricular depolarization; T wave shows ventricular repolarization. ST-segment elevation indicates acute myocardial injury/infarction.'
  },
  {
    term: 'Saltatory Conduction & NMJ',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'diagrams',
    definition: 'Rapid jumping of action potentials between unmyelinated Nodes of Ranvier along myelinated axons, culminating at the Neuromuscular Junction (NMJ) where Ca²⁺ triggers Acetylcholine (ACh) release onto skeletal muscle nicotinic receptors.'
  },
  {
    term: 'Cellular Adaptation (Metaplasia vs Hyperplasia)',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'theory',
    definition: 'Hyperplasia is increased cell number via mitosis; Hypertrophy is increased cell size; Atrophy is shrinkage; Metaplasia is reversible replacement of one mature adult cell type by another (e.g. bronchial squamous metaplasia in smokers).'
  },
  {
    term: 'Rheumatoid Arthritis vs Gout',
    subject: 'anatomy',
    subjectLabel: 'BP104T / BP109P',
    tab: 'theory',
    definition: 'RA is systemic autoimmune synovitis forming destructive vascular pannus across symmetric small joints; Gout is crystal arthropathy caused by monosodium urate deposition in the 1st MTP joint (podagra) from hyperuricemia.'
  },

  // BP106T / BP111P — Pharmaceutical Inorganic & Analytical Chemistry
  {
    term: 'Limit Test & Nessler Cylinder',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'limit_tests',
    formula: 'Pass if Test Opalescence/Color < Standard Control',
    definition: 'Semi-quantitative IP comparison in matched 50 mL flat-bottom borosilicate Nessler cylinders ensuring trace impurities (Cl⁻, SO₄²⁻, Fe, Pb) do not exceed pharmacopoeial tolerances.'
  },
  {
    term: 'Gutzeit Apparatus (Arsenic Limit Test)',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'diagrams',
    formula: 'As³⁺ + 3[H] → AsH₃↑ → Yellow-brown HgCl₂ stain',
    definition: 'Specialized 120 mL bottle and 200 mm × 6.5 mm vertical glass tube containing lead-acetate cotton wool (traps interfering H₂S) that directs arsine gas onto a mercuric chloride paper disc.'
  },
  {
    term: 'Primary vs Secondary Standard',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'titration',
    formula: 'KHP (204.22) · Anhydrous Na₂CO₃ (53.00) · Oxalic Acid',
    definition: 'Primary standards (≥99.9% pure, non-hygroscopic, stable) prepare exact solutions by direct weighing to standardize reactive secondary titrants like NaOH, HCl, KMnO₄, or EDTA.'
  },
  {
    term: 'Iodometry vs Iodimetry',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'titration',
    formula: 'Cu²⁺ + 4I⁻ → CuI↓ + I₂ ; titrated with Na₂S₂O₃',
    definition: 'Iodimetry uses standard I₂ directly to titrate reducing analytes; Iodometry is indirect titration where an oxidizing analyte (e.g., CuSO₄) liberates equivalent I₂ from excess KI, which is titrated against standard Sodium Thiosulphate.'
  },
  {
    term: 'Cerimetry (Ferrous Sulphate Assay)',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'titration',
    formula: 'Ce⁴⁺ + Fe²⁺ → Ce³⁺ + Fe³⁺ (Ferroin: Orange → Blue)',
    definition: 'Redox titration using Ceric Ammonium Sulphate as a strong one-electron oxidizing agent in H₂SO₄ medium with Ferroin indicator.'
  },
  {
    term: 'Modified Volhard’s Method',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'titration',
    formula: 'Back-titrate excess Ag⁺ with NH₄SCN + Ferric Alum',
    definition: 'Back-titration of chloride (NaCl) using excess standard 0.1N AgNO₃ followed by Nitrobenzene (coats AgCl precipitate to prevent exchange with thiocyanate) and titration with Ammonium Thiocyanate.'
  },
  {
    term: 'Non-Aqueous Titration & Leveling Effect',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'theory',
    formula: 'Sodium Benzoate in Glacial Acetic Acid vs 0.1N HClO₄',
    definition: 'Titration of very weak acids/bases or water-insoluble drugs in aprotic/protogenic/protophilic solvents (e.g., glacial acetic acid enhances basicity of sodium benzoate for sharp Crystal Violet endpoint).'
  },
  {
    term: 'Acid Neutralizing Capacity (ANC)',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'purity',
    formula: 'ANC (mEq/g) = [(V_HCl − V_NaOH) × N] / Sample_g',
    definition: 'Milliequivalents of 0.5N HCl neutralized by 1 g of antacid preparation (e.g., Aluminium Hydroxide Gel) digested at 37°C for 1 hour.'
  },
  {
    term: 'Henderson–Hasselbalch Equation',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'theory',
    formula: 'pH = pKa + log₁₀([Conjugate Base Salt] / [Weak Acid])',
    definition: 'Governs buffer pH calculation and selection of physiological buffers (blood bicarbonate H₂CO₃/HCO₃⁻ 1:20 maintaining pH 7.35–7.45).'
  },
  {
    term: 'ALARA & Radioisotope Half-Life',
    subject: 'inorganic',
    subjectLabel: 'BP106T / BP111P',
    tab: 'diagrams',
    formula: 'Time · Distance (1/d²) · Shielding (Al for β, Pb for γ)',
    definition: 'Radiation protection rule ("As Low As Reasonably Achievable") alongside decay-in-storage rules for Tc-99m (6.01h), I-131 (8.02d), P-32 (14.29d), and Co-60 (5.27y).'
  },

  // BP105T / BP110P — Pharmacognosy
  {
    term: 'Stomatal Index (SI)',
    subject: 'pharmacognosy',
    subjectLabel: 'BP105T / BP110P',
    tab: 'leaf_constants',
    formula: 'I = [S / (E + S)] × 100',
    definition: 'Percentage ratio of stomata (S) to total epidermal cells (E + S) in a leaf epidermis. Unlike stomatal number, SI remains remarkably constant regardless of plant age or climate.'
  },
  {
    term: 'Vein-Islet & Vein-let Termination Number',
    subject: 'pharmacognosy',
    subjectLabel: 'BP105T / BP110P',
    tab: 'leaf_constants',
    formula: 'Islets or Terminations per mm² of leaf lamina',
    definition: 'Quantitative microscopy leaf constants counting tiny photosynthetic tissue islands encircled by conducting veins (vein-islets) and ultimate free vein endings (vein-let terminations) per mm².'
  },
  {
    term: 'Lycopodium Spore Method',
    subject: 'pharmacognosy',
    subjectLabel: 'BP105T / BP110P',
    tab: 'leaf_constants',
    formula: '% Purity = (N × W × 94,000 × 100) / (S × M × P)',
    definition: 'Quantitative microscopy purity assay for powdered crude drugs lacking chemical assays, leveraging uniform Lycopodium clavatum spores (~94,000 spores/mg) as an internal count standard.'
  },
  {
    term: 'Eyepiece Micrometry',
    subject: 'pharmacognosy',
    subjectLabel: 'BP105T / BP110P',
    tab: 'leaf_constants',
    formula: '1 Ocular Div = (Stage Divs × 10 µm) / Ocular Divs',
    definition: 'Technique calibrating an ocular micrometer scale against a precision 0.01 mm (10 µm/division) stage micrometer to measure dimensions of starch grains, calcium oxalate crystals, and phloem fibers.'
  },
  {
    term: 'Swelling Index & Foaming Index',
    subject: 'pharmacognosy',
    subjectLabel: 'BP105T / BP110P',
    tab: 'physicochemical',
    formula: 'Foaming Index = 1000 / a (where 1 cm foam persists)',
    definition: 'WHO quality parameters measuring mucilage hydration volume per gram (e.g. Psyllium husk) and saponin glycoside surfactant persistence across serial decoction dilutions.'
  },
  {
    term: 'Voucher Specimen (Herbarium)',
    subject: 'pharmacognosy',
    subjectLabel: 'BP105T / BP110P',
    tab: 'voucher',
    definition: 'Pressed, dried, mounted botanical specimen permanently indexed with binomial name, family, locality, collector, and accession ID to authenticate crude drug taxonomy.'
  },

  // BP103T / BP108P — Healthcare Psychology & Communication
  {
    term: 'SPIKES Protocol',
    subject: 'psychology',
    subjectLabel: 'BP103T / BP108P',
    tab: 'roleplay',
    formula: 'Setting · Perception · Invitation · Knowledge · Empathy · Summary',
    definition: 'Structured 6-step clinical communication framework for delivering serious diagnoses or bad news with emotional safety and clear follow-up strategy.'
  },
  {
    term: 'SBAR Clinical Handover',
    subject: 'psychology',
    subjectLabel: 'BP103T / BP108P',
    tab: 'peer',
    formula: 'Situation · Background · Assessment · Recommendation',
    definition: 'Standardized interprofessional briefing protocol preventing LASA dispensing errors and miscommunication across pharmacists, nurses, and physicians.'
  },
  {
    term: 'Somatization',
    subject: 'psychology',
    subjectLabel: 'BP103T / BP108P',
    tab: 'cases',
    definition: 'Expression of underlying psychological stress, anxiety, or masked depression as persistent physical complaints (e.g., headaches, dyspepsia, fatigue) without sufficient organic pathology.'
  },
  {
    term: 'Transtheoretical Model (TTM) & HBM',
    subject: 'psychology',
    subjectLabel: 'BP103T / BP108P',
    tab: 'theory',
    definition: 'Behavioural change frameworks guiding patient medication adherence: TTM tracks readiness stages (Precontemplation → Maintenance), while the Health Belief Model evaluates perceived susceptibility, severity, barriers, and self-efficacy.'
  },

  // BP101T — Python & Data Science
  {
    term: 'Pandas DataFrame & Series',
    subject: 'python',
    subjectLabel: 'BP101T Data Science',
    tab: null,
    formula: 'df.head() · df.info() · df.describe() · df.groupby()',
    definition: 'Core 2D labeled table and 1D column structures in Python used to inspect, clean missing values, filter, and aggregate pharmacokinetic (PK) and Adverse Drug Reaction (ADR) datasets.'
  },
  {
    term: 'Pharmacokinetic Parameters (Cmax, Tmax, AUC)',
    subject: 'python',
    subjectLabel: 'BP101T Data Science',
    tab: null,
    definition: 'Key drug concentration-time descriptors: Cmax (peak plasma concentration), Tmax (time to reach peak), and AUC (Area Under the Curve measuring total systemic drug exposure).'
  }
];

const SUBJECT_FILTERS = [
  { id: 'all', label: 'All Terms' },
  { id: 'general_pharmacy', label: 'Pharmaceutics' },
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'inorganic', label: 'Inorganic Chem' },
  { id: 'pharmacognosy', label: 'Pharmacognosy' },
  { id: 'psychology', label: 'Psychology' },
  { id: 'python', label: 'Python & PK' }
];

export default function QuickGlossary({
  isOpen,
  onClose,
  activeModule,
  onNavigate
}) {
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const inputRef = useRef(null);

  // Contextual default filter when opened inside a specific subject
  useEffect(() => {
    if (isOpen) {
      if (activeModule === 'pandas' || activeModule === 'python') {
        setSubjectFilter('python');
      } else if (
        ['general_pharmacy', 'anatomy', 'inorganic', 'pharmacognosy', 'psychology'].includes(activeModule)
      ) {
        setSubjectFilter(activeModule);
      } else {
        setSubjectFilter('all');
      }
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen, activeModule]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTerms = GLOSSARY_TERMS.filter((item) => {
    const matchesSubject = subjectFilter === 'all' || item.subject === subjectFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      (item.formula && item.formula.toLowerCase().includes(q));
    return matchesSubject && matchesQuery;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-slate-950/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Pharmaceutical Glossary"
    >
      <aside
        className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">Quick Glossary</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {filteredTerms.length} of {GLOSSARY_TERMS.length} technical terms across BP101T–BP111P
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close Quick Glossary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Subject Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search definitions, formulas, or laws (e.g. Nessler, SPIKES, DV)..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Clear glossary search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUBJECT_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSubjectFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  subjectFilter === f.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terms List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 dark:divide-slate-800/70">
          {filteredTerms.length > 0 ? (
            filteredTerms.map((item) => (
              <div key={item.term} className="p-5 space-y-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {item.subjectLabel}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{item.term}</h3>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate(item.subject, item.tab);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <span>Open Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {item.formula && (
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 bg-slate-50 dark:bg-slate-950/90 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800/80 tabular-nums">
                    {item.formula}
                  </p>
                )}

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.definition}</p>
              </div>
            ))
          ) : (
            <div className="py-16 px-6 text-center space-y-2">
              <p className="text-base font-medium text-slate-700 dark:text-slate-300">No matching terms found</p>
              <p className="text-sm text-slate-500">
                Try switching to "All Terms" or searching a broader keyword.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
