import React, { useState, useEffect } from 'react';
import { FlaskConical, Droplet, RefreshCcw, Sliders, Info, BookmarkCheck, ShieldCheck, Beaker, Scale } from 'lucide-react';
import InorganicDiagrams from './InorganicDiagrams';
import InorganicTheory from './InorganicTheory';
import ResourceConnector from '../../components/ResourceConnector';

export default function InorganicModule({ initialTab, navNonce }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'diagrams');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, navNonce]);

  // Existing Burette Simulation State (preserved & extended for all 7 BP111P assays)
  const [selectedAssayId, setSelectedAssayId] = useState('hcl_naoh');
  const [titrantVolume, setTitrantVolume] = useState(0);
  const [trials, setTrials] = useState([]);

  // Assay % Purity & Titrant Standardization State
  const [assaySampleWt, setAssaySampleWt] = useState(0.5);
  const [assayBuretteVol, setAssayBuretteVol] = useState(25.0);
  const [assayTitrantFactor, setAssayTitrantFactor] = useState(1.0);
  const [stdTitrantKey, setStdTitrantKey] = useState('naoh_khp');
  const [stdPrimaryWtG, setStdPrimaryWtG] = useState(0.51);
  const [stdBuretteMl, setStdBuretteMl] = useState(24.8);
  const [prepTargetG, setPrepTargetG] = useState(10.0);
  const [kiContamType, setKiContamType] = useState('iodate');
  const [kiAcidAdded, setKiAcidAdded] = useState(false);
  const [kiThioMl, setKiThioMl] = useState(1.2);
  const [kiSampleWtG, setKiSampleWtG] = useState(5.0);

  // Exp 1: Limit Tests State
  const [selectedLimitTest, setSelectedLimitTest] = useState('chloride');
  const [limitSampleG, setLimitSampleG] = useState(1.0);
  const [limitStandardMg, setLimitStandardMg] = useState(0.25);
  const [limitComparison, setLimitComparison] = useState('pass');

  // Exp 2: Inorganic Preparations State
  const [selectedPrep, setSelectedPrep] = useState('alum');
  const [actualYieldG, setActualYieldG] = useState(8.2);
  const [theoreticalYieldG, setTheoreticalYieldG] = useState(10.0);

  // Exp 3: Tests for Purity State
  const [bentoniteVolMl, setBentoniteVolMl] = useState(26.0);
  const [bentoniteWtG, setBentoniteWtG] = useState(2.0);
  const [ancBlankMl, setAncBlankMl] = useState(30.0);
  const [ancBackMl, setAncBackMl] = useState(14.5);
  const [ancNormality, setAncNormality] = useState(0.5);
  const [ancGelG, setAncGelG] = useState(1.0);

  const assayConfigs = {
    hcl_naoh: {
      name: 'Standardization / Acid-Base (HCl vs 0.1N NaOH)',
      titrant: '0.1N NaOH',
      analyte: 'HCl (25 mL) + Phenolphthalein',
      eqVol: 25.0,
      eqFactor: 0.003646,
      indicator: 'Phenolphthalein (Colorless → Pale Pink)',
      preColor: 'bg-sky-500/10 border-sky-400/30 text-sky-300',
      nearColor: 'bg-pink-400/15 border-pink-400/30 text-pink-200',
      endColor: 'bg-pink-500/30 border-pink-500/60 text-pink-100 shadow-[0_0_25px_rgba(236,72,153,0.4)]',
      overColor: 'bg-fuchsia-600/40 border-fuchsia-500/80 text-white shadow-[0_0_30px_rgba(217,70,239,0.6)]',
      endLabel: 'Optimal Pale Pink'
    },
    nh4cl: {
      name: 'Exp 4(a): Assay of Ammonium Chloride (Acid-Base / Formal Titration)',
      titrant: '0.1N NaOH',
      analyte: 'NH₄Cl + Neutralized Formaldehyde',
      eqVol: 22.4,
      eqFactor: 0.005349,
      indicator: 'Phenolphthalein (Colorless → Permanent Pink)',
      preColor: 'bg-sky-500/10 border-sky-400/30 text-sky-300',
      nearColor: 'bg-pink-400/15 border-pink-400/30 text-pink-200',
      endColor: 'bg-pink-500/30 border-pink-500/60 text-pink-100 shadow-[0_0_25px_rgba(236,72,153,0.4)]',
      overColor: 'bg-fuchsia-600/40 border-fuchsia-500/80 text-white',
      endLabel: 'Permanent Pink'
    },
    feso4: {
      name: 'Exp 4(b): Assay of Ferrous Sulphate (Cerimetry)',
      titrant: '0.1N Ceric Ammonium Sulphate',
      analyte: 'FeSO₄·7H₂O + H₂SO₄ + Ferroin',
      eqVol: 24.0,
      eqFactor: 0.02780,
      indicator: 'Ferroin (Red-Orange → Pale Blue)',
      preColor: 'bg-orange-500/25 border-orange-400/40 text-orange-200',
      nearColor: 'bg-amber-400/20 border-amber-400/40 text-amber-200',
      endColor: 'bg-sky-400/25 border-sky-400/60 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.4)]',
      overColor: 'bg-yellow-500/30 border-yellow-400/70 text-white',
      endLabel: 'Pale Blue (Endpoint)'
    },
    cuso4: {
      name: 'Exp 4(c): Assay of Copper Sulphate (Iodometry)',
      titrant: '0.1N Sodium Thiosulphate',
      analyte: 'CuSO₄ + Excess KI (Liberated I₂) + Starch',
      eqVol: 20.0,
      eqFactor: 0.02497,
      indicator: 'Starch Mucilage + KSCN (Blue-Black → Milky White)',
      preColor: 'bg-indigo-900/40 border-indigo-400/40 text-indigo-200',
      nearColor: 'bg-sky-800/30 border-sky-400/40 text-sky-200',
      endColor: 'bg-slate-200/25 border-slate-300/60 text-white shadow-[0_0_20px_rgba(255,255,255,0.25)]',
      overColor: 'bg-slate-100/30 border-white/70 text-white',
      endLabel: 'Milky White (CuI)'
    },
    cagluconate: {
      name: 'Exp 4(d): Assay of Calcium Gluconate (Complexometry)',
      titrant: '0.05M Disodium EDTA',
      analyte: 'Ca-Gluconate + MgSO₄ + NH₃ Buffer pH 10',
      eqVol: 22.0,
      eqFactor: 0.02242,
      indicator: 'Mordant Black II / EBT (Wine Red → Pure Blue)',
      preColor: 'bg-rose-700/35 border-rose-500/50 text-rose-200',
      nearColor: 'bg-purple-600/30 border-purple-400/50 text-purple-200',
      endColor: 'bg-blue-500/30 border-blue-400/70 text-blue-100 shadow-[0_0_25px_rgba(59,130,246,0.5)]',
      overColor: 'bg-blue-700/40 border-blue-500/80 text-white',
      endLabel: 'Pure Sky Blue'
    },
    h2o2: {
      name: 'Exp 4(e): Assay of Hydrogen Peroxide (Permanganometry)',
      titrant: '0.1N KMnO₄',
      analyte: 'H₂O₂ + Dilute H₂SO₄',
      eqVol: 25.5,
      eqFactor: 0.001701,
      indicator: 'Self-Indicator (Colorless → Faint Pink for 30s)',
      preColor: 'bg-sky-500/10 border-sky-400/30 text-sky-300',
      nearColor: 'bg-pink-400/15 border-pink-400/30 text-pink-200',
      endColor: 'bg-pink-500/30 border-pink-500/60 text-pink-100 shadow-[0_0_25px_rgba(236,72,153,0.4)]',
      overColor: 'bg-purple-700/50 border-purple-500/80 text-white',
      endLabel: 'Faint Persistent Pink'
    },
    nabenzoate: {
      name: 'Exp 4(f): Assay of Sodium Benzoate (Non-Aqueous Titration)',
      titrant: '0.1N Perchloric Acid (HClO₄)',
      analyte: 'Sodium Benzoate in Glacial Acetic Acid',
      eqVol: 21.0,
      eqFactor: 0.01441,
      indicator: 'Crystal Violet (Violet → Emerald Green)',
      preColor: 'bg-violet-600/35 border-violet-400/50 text-violet-200',
      nearColor: 'bg-blue-500/25 border-blue-400/40 text-blue-200',
      endColor: 'bg-emerald-500/30 border-emerald-400/70 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.5)]',
      overColor: 'bg-yellow-500/30 border-yellow-400/70 text-white',
      endLabel: 'Emerald Green'
    },
    nacl: {
      name: "Exp 4(g): Assay of Sodium Chloride (Modified Volhard's)",
      titrant: '0.1N Ammonium Thiocyanate',
      analyte: 'NaCl + Excess 0.1N AgNO₃ + Nitrobenzene',
      eqVol: 18.5,
      eqFactor: 0.005844,
      indicator: 'Ferric Ammonium Sulphate (Colorless → Reddish-Brown)',
      preColor: 'bg-slate-200/10 border-slate-400/30 text-slate-200',
      nearColor: 'bg-amber-400/15 border-amber-400/30 text-amber-200',
      endColor: 'bg-amber-700/40 border-amber-500/70 text-amber-100 shadow-[0_0_25px_rgba(217,119,6,0.5)]',
      overColor: 'bg-red-800/50 border-red-500/80 text-white',
      endLabel: 'Reddish-Brown [Fe(SCN)]²⁺'
    }
  };

  const activeAssay = assayConfigs[selectedAssayId];
  const equivalencePoint = activeAssay.eqVol;

  const calculatePH = (v) => {
    if (v === 0) return 1.0;
    if (v < equivalencePoint) {
      const unreacted = (equivalencePoint - v) * 0.1;
      const conc = unreacted / (25 + v);
      return Math.max(0, (-Math.log10(conc)).toFixed(2));
    } else if (Math.abs(v - equivalencePoint) < 0.05) {
      return 7.0;
    } else {
      const excess = (v - equivalencePoint) * 0.1;
      const pOH = -Math.log10(excess / (25 + v));
      return Math.min(14, (14 - pOH).toFixed(2));
    }
  };

  const currentPH = calculatePH(titrantVolume);
  const isEndpointReached = Math.abs(titrantVolume - equivalencePoint) <= 0.2;
  const isOverTitrated = titrantVolume > equivalencePoint + 0.2;

  const getFlaskColor = () => {
    if (titrantVolume < equivalencePoint - 1.0) return activeAssay.preColor;
    if (titrantVolume >= equivalencePoint - 1.0 && titrantVolume < equivalencePoint - 0.2) return activeAssay.nearColor;
    if (isEndpointReached) return activeAssay.endColor;
    return activeAssay.overColor;
  };

  const addDrop = () => {
    if (titrantVolume < 50) {
      setTitrantVolume((prev) => parseFloat(Math.min(50, prev + 0.1).toFixed(1)));
    }
  };

  const resetTitration = () => setTitrantVolume(0);

  const saveTrial = () => {
    if (trials.length >= 3) return;
    const newTrial = {
      id: trials.length + 1,
      assay: activeAssay.name.split(':')[0],
      volume: titrantVolume.toFixed(1),
      status: isEndpointReached ? 'Accurate Endpoint' : titrantVolume < equivalencePoint ? 'Under-titrated' : 'Over-titrated'
    };
    setTrials([...trials, newTrial]);
  };

  const buretteLevel = Math.max(0, 100 - (titrantVolume / 50) * 100);
  const assayPurityPct = assaySampleWt > 0 ? ((assayBuretteVol * assayTitrantFactor * activeAssay.eqFactor) / assaySampleWt) * 100 : 0;

  const limitTests = {
    chloride: {
      title: 'Exp 1(a): Limit Test & Modified Limit Test for Chloride (IP)',
      reagents: 'Dilute HNO₃ (10 mL) + 0.1M AgNO₃ (1 mL) → AgCl opalescence in Nessler cylinder (5 min)',
      modified: 'For colored/alkaline salts (e.g., KMnO₄ reduced with ethanol, or NaHCO₃ neutralized with excess HNO₃).',
      standard: '1.0 mL of 0.05845% w/v NaCl (25 ppm Cl⁻ equivalent).'
    },
    sulphate: {
      title: 'Exp 1(b): Limit Test & Modified Limit Test for Sulphate (IP)',
      reagents: 'Dilute HCl (2 mL) + Barium Sulphate Reagent (BaCl₂ + K₂SO₄ + alcohol) → BaSO₄ turbidity (5 min)',
      modified: 'K₂SO₄ acts as seeding agent to increase sensitivity; alcohol prevents supersaturation.',
      standard: '1.0 mL of 0.1089% w/v K₂SO₄ (0.6 mg SO₄²⁻).'
    },
    iron: {
      title: 'Exp 1(c): Limit Test for Iron (IP)',
      reagents: '20% w/v Citric Acid (2 mL) + Thioglycolic Acid (0.1 mL) + Ammonia solution → Purple Ferrous Thioglycolate.',
      modified: 'Citric acid complexes Fe³⁺/prevent hydroxide ppt; thioglycolic acid reduces Fe³⁺ → Fe²⁺ and forms purple complex in alkaline medium.',
      standard: '2.0 mL Standard Iron Solution (20 ppm Fe).'
    },
    lead: {
      title: 'Exp 1(d): Limit Test for Lead (IP — Dithizone Method)',
      reagents: 'Ammonium citrate, KCN, Hydroxylamine HCl, Phenol red (pH 9.5–10), Dithizone in CHCl₃ → Red Lead-Dithizonate.',
      modified: 'KCN & ammonium citrate mask Cu, Zn, Fe interferences; chloroform layer color compared against standard.',
      standard: 'Standard Lead Solution (20 ppm Pb).'
    },
    arsenic: {
      title: 'Exp 1(e): Limit Test for Arsenic (IP — Gutzeit Apparatus)',
      reagents: 'Granulated Zinc + HCl (10 mL Stannated HCl) + KI + SnCl₂ → Arsine gas (AsH₃) stains HgCl₂ paper yellow-brown.',
      modified: 'Cotton plug soaked in Lead Acetate traps interfering H₂S gas before reaching Mercuric Chloride paper.',
      standard: '1.0 mL Arsenic Standard Solution (10 ppm As).'
    }
  };

  const preparations = {
    aloh3: {
      title: 'Exp 2(a): Preparation of Aluminium Hydroxide Gel',
      equation: 'Al₂(SO₄)₃ + 3Na₂CO₃ + 3H₂O → 2Al(OH)₃↓ + 3Na₂SO₄ + 3CO₂↑',
      procedure: 'Dissolve potash alum/aluminium sulphate and sodium carbonate separately in hot water. Pour alum solution slowly into Na₂CO₃ with vigorous stirring, wash precipitate free of sulphate (check with BaCl₂), and suspend.',
      use: 'Non-systemic gastric antacid (does not cause systemic alkalosis or acid rebound).'
    },
    alum: {
      title: 'Exp 2(b): Preparation of Potash Alum [K₂SO₄·Al₂(SO₄)₃·24H₂O]',
      equation: 'K₂SO₄ + Al₂(SO₄)₃ + 24H₂O → K₂SO₄·Al₂(SO₄)₃·24H₂O',
      procedure: 'Dissolve equimolar quantities of Aluminium Sulphate and Potassium Sulphate in warm water with a drop of dil. H₂SO₄ (prevents hydrolysis). Filter hot, cool undisturbed to grow octahedral crystals, dry between filter paper.',
      use: 'Topical astringent, styptic (stops minor bleeding), and water purifier.'
    },
    feso4: {
      title: 'Exp 2(c): Preparation of Ferrous Sulphate (FeSO₄·7H₂O)',
      equation: 'Fe + H₂SO₄ → FeSO₄ + H₂↑',
      procedure: 'Warm clean iron filings with dilute H₂SO₄ until effervescence ceases (keep slight excess Fe to prevent oxidation to Fe³⁺). Filter hot into a basin containing a few drops of dil. H₂SO₄, cool to crystallize pale green monoclinic crystals.',
      use: 'Oral haematinic for iron-deficiency anaemia.'
    },
    mgso4: {
      title: 'Exp 2(d): Preparation of Magnesium Sulphate (Epsom Salt)',
      equation: 'MgCO₃ + H₂SO₄ → MgSO₄ + H₂O + CO₂↑  (or Mg(OH)₂ + H₂SO₄ → MgSO₄ + 2H₂O)',
      procedure: 'Add magnesium carbonate/hydroxide in small portions to dilute H₂SO₄ until effervescence stops and slight excess remains. Boil, filter off unreacted base, concentrate filtrate, and crystallize MgSO₄·7H₂O.',
      use: 'Saline osmotic purgative and parenteral anticonvulsant in eclampsia.'
    }
  };

  const standardizationMethods = {
    naoh_khp: { titrant: '0.1N NaOH', primary: 'Potassium Hydrogen Phthalate (KHP)', eqWt: 204.22, targetN: 0.1, indicator: 'Phenolphthalein (Colorless → Pale Pink)' },
    hcl_na2co3: { titrant: '0.1N HCl', primary: 'Anhydrous Sodium Carbonate (Na₂CO₃)', eqWt: 52.995, targetN: 0.1, indicator: 'Methyl Orange (Yellow → Peach-Orange)' },
    kmno4_oxalic: { titrant: '0.1N KMnO₄', primary: 'Oxalic Acid Dihydrate (60–70°C + H₂SO₄)', eqWt: 63.03, targetN: 0.1, indicator: 'Self-Indicator (Colorless → Faint Pink)' },
    ceric_arsenic: { titrant: '0.1N Ceric Ammonium Sulphate', primary: 'Arsenious Oxide (As₂O₃ + OsO₄ catalyst)', eqWt: 49.46, targetN: 0.1, indicator: 'Ferroin (Orange-Red → Pale Blue)' },
    thio_k2cr2o7: { titrant: '0.1N Sodium Thiosulphate', primary: 'Potassium Dichromate (K₂Cr₂O₇ + KI + HCl)', eqWt: 49.03, targetN: 0.1, indicator: 'Starch near endpoint (Blue → Light Green)' },
    edta_caco3: { titrant: '0.05M Disodium EDTA', primary: 'Calcium Carbonate (CaCO₃ in dil. HCl + NH₃ pH 10)', eqWt: 100.09, targetN: 0.05, indicator: 'Eriochrome Black T / Murexide' },
    hclo4_khp: { titrant: '0.1N Perchloric Acid (Non-Aqueous)', primary: 'KHP in Glacial Acetic Acid', eqWt: 204.22, targetN: 0.1, indicator: 'Crystal Violet (Violet → Emerald Green)' },
    nh4scn_agno3: { titrant: '0.1N Ammonium Thiocyanate', primary: 'Standard 0.1N AgNO₃ (25 mL) + HNO₃', eqWt: 169.87, targetN: 0.1, indicator: 'Ferric Alum (White ppt → Reddish-Brown)' }
  };

  const activeStd = standardizationMethods[stdTitrantKey];
  const standardizedStrength = stdBuretteMl > 0 ? (stdPrimaryWtG * 1000) / (activeStd.eqWt * stdBuretteMl) : 0;
  const standardizationFactor = activeStd.targetN > 0 ? standardizedStrength / activeStd.targetN : 1.0;

  const prepStoich = {
    aloh3: [
      { reagent: 'Aluminium Sulphate Al₂(SO₄)₃·16H₂O', ratio: 2.02 },
      { reagent: 'Anhydrous Sodium Carbonate Na₂CO₃', ratio: 2.04 }
    ],
    alum: [
      { reagent: 'Potassium Sulphate (K₂SO₄)', ratio: 0.183 },
      { reagent: 'Aluminium Sulphate Hydrate Al₂(SO₄)₃·16H₂O', ratio: 0.665 }
    ],
    feso4: [
      { reagent: 'Clean Iron Filings (Fe)', ratio: 0.201 },
      { reagent: 'Sulphuric Acid (100% H₂SO₄ basis, use dil.)', ratio: 0.353 }
    ],
    mgso4: [
      { reagent: 'Magnesium Carbonate (MgCO₃) or Mg(OH)₂ (×0.237)', ratio: 0.342 },
      { reagent: 'Sulphuric Acid (100% H₂SO₄ basis, use dil.)', ratio: 0.398 }
    ]
  };

  const bentoniteSwelling = bentoniteWtG > 0 ? bentoniteVolMl / bentoniteWtG : 0;
  const ancMeq = ancGelG > 0 ? ((ancBlankMl - ancBackMl) * ancNormality) / ancGelG : 0;
  const yieldPct = theoreticalYieldG > 0 ? (actualYieldG / theoreticalYieldG) * 100 : 0;
  // 1 mL of 0.01M Na2S2O3 ≡ 0.0003567 g KIO3 (IO3- + 5I- + 6H+ -> 3I2; 6 S2O3 2-)
  const iodatePpm = kiSampleWtG > 0 ? ((kiThioMl * 0.0003567) / kiSampleWtG) * 1e6 : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-wrap items-center gap-3 mb-2.5">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-full">
            BP106T / BP111P &bull; Practical Suite (18 Experiments)
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Pharmaceutical Inorganic &amp; Analytical Chemistry Lab
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          Live volumetric titration &amp; assay simulator (Exp 4a–4g), IP Limit Tests (Exp 1a–1e), Inorganic Synthesis (Exp 2a–2d), and Tests for Purity (Exp 3a–3c).
        </p>
      </div>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'diagrams', label: 'Annotated Apparatus & Concept Diagrams (2D/3D)' },
          { id: 'theory', label: 'BP106T Theory (Units I–V)' },
          { id: 'titration', label: 'Volumetric Assays & Burette (Exp 4a–4g)' },
          { id: 'limit_tests', label: 'Limit Tests Simulator (Exp 1a–1e)' },
          { id: 'preparations', label: 'Inorganic Preparations (Exp 2a–2d)' },
          { id: 'purity', label: 'Tests for Purity (Exp 3a–3c)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-lg'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'diagrams' && <InorganicDiagrams />}
      {activeTab === 'theory' && <InorganicTheory />}

      {/* TAB 1: LIVE BURETTE & ALL 7 IP ASSAYS */}
      {activeTab === 'titration' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-3">
            <label className="block text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Select BP111P Volumetric Assay Method (Exp 4a–4g)
            </label>
            <select
              value={selectedAssayId}
              onChange={(e) => { setSelectedAssayId(e.target.value); setTitrantVolume(0); }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(assayConfigs).map(([id, cfg]) => (
                <option key={id} value={id}>{cfg.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-300 pt-1">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"><strong>Titrant (Burette):</strong> {activeAssay.titrant}</div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"><strong>Flask Contents:</strong> {activeAssay.analyte}</div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"><strong>Indicator:</strong> {activeAssay.indicator}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 lg:col-span-1">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Burette Controls</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">Target Endpoint: {equivalencePoint} mL</p>
                  </div>
                </div>
                <button onClick={resetTitration} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all" title="Reset Titration">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    <span>Titrant Added:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-base tabular-nums">{titrantVolume.toFixed(1)} mL</strong>
                  </div>
                  <input type="range" min="0" max="50" step="0.5" value={titrantVolume} onChange={(e) => setTitrantVolume(parseFloat(e.target.value))} className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-950 cursor-pointer" />
                </div>

                <button onClick={addDrop} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm">
                  <Droplet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Add 1 Drop (+0.1 mL)</span>
                </button>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Simulated pH</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">{currentPH}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Endpoint Status</span>
                    <span className={`text-sm font-bold ${isEndpointReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                      {isEndpointReached ? activeAssay.endLabel : isOverTitrated ? 'Over-titrated' : 'Pre-endpoint'}
                    </span>
                  </div>
                </div>

                <button onClick={saveTrial} disabled={trials.length >= 3} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Record Trial Result ({trials.length}/3)</span>
                </button>
              </div>

              <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>Tip:</strong> Approach {equivalencePoint} mL and use &quot;Add 1 Drop (+0.1 mL)&quot; to capture the exact color transition.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-xl lg:col-span-2 flex flex-col items-center justify-between relative overflow-hidden">
              <div className="w-full flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 z-10">
                <div className="flex items-center space-x-2">
                  <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Virtual Lab Bench</h3>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full border ${isEndpointReached ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                  {isEndpointReached ? 'Endpoint Reached (Stop!)' : isOverTitrated ? 'Over-titrated' : 'Titration in Progress'}
                </span>
              </div>

              <div className="my-6 flex flex-col items-center z-10 relative">
                <div className="w-6 h-36 bg-slate-900 dark:bg-slate-950 border-2 border-slate-400 dark:border-slate-700 rounded-t-lg relative overflow-hidden flex flex-col justify-start">
                  <div className="w-full bg-emerald-400/30 border-b border-emerald-400/50 transition-all duration-200" style={{ height: `${buretteLevel}%` }}></div>
                </div>
                <div className="w-3 h-4 bg-slate-500 dark:bg-slate-700"></div>
                {titrantVolume > 0 && titrantVolume < 50 && (
                  <div className="w-1.5 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce my-1"></div>
                )}
                <div className="w-52 h-52 border-2 border-slate-400 dark:border-slate-600 rounded-b-[40px] rounded-t-lg relative flex flex-col justify-end p-3 overflow-hidden bg-slate-900 dark:bg-slate-950/50 shadow-xl dark:shadow-2xl">
                  <div className={`w-full transition-all duration-300 rounded-b-[36px] border-t-2 flex items-center justify-center ${getFlaskColor()}`} style={{ height: '70%' }}>
                    <div className="text-center px-2">
                      <span className="text-xs font-bold block">{activeAssay.titrant}</span>
                      <span className="text-xs opacity-90 tabular-nums">Burette: {titrantVolume.toFixed(1)} mL</span>
                    </div>
                  </div>
                </div>
                <div className="w-56 h-3 bg-slate-300 dark:bg-slate-800 rounded-full mt-2 shadow-md dark:shadow-lg"></div>
              </div>

              {trials.length > 0 && (
                <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 z-10 space-y-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Practical Journal Records</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {trials.map((t) => (
                      <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center">
                        <span className="text-xs text-slate-600 dark:text-slate-400 block">Trial {t.id}</span>
                        <strong className="text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">{t.volume} mL</strong>
                        <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Titrant Standardization (BP111P Exp 4 requirement) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Step 1: Standardization of Titrant Against Primary Standard (Exp 4)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Secondary standard titrants must be standardized before running sample % purity assays.</p>
              </div>
              <button
                onClick={() => setAssayTitrantFactor(parseFloat(standardizationFactor.toFixed(4)))}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 border border-blue-500/40 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-xl transition-all tabular-nums"
              >
                Apply Factor ({standardizationFactor.toFixed(4)}) to Assay &rarr;
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Titrant &amp; Primary Standard</label>
                <select value={stdTitrantKey} onChange={(e) => setStdTitrantKey(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white">
                  {Object.entries(standardizationMethods).map(([k, v]) => (
                    <option key={k} value={k}>{v.titrant} vs {v.primary.split('(')[0].trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Primary Standard Weight (g)</label>
                <input type="number" step="0.01" value={stdPrimaryWtG} onChange={(e) => setStdPrimaryWtG(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Burette Titre Volume (mL)</label>
                <input type="number" step="0.1" value={stdBuretteMl} onChange={(e) => setStdBuretteMl(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-blue-500/30 rounded-xl p-3 text-center flex flex-col justify-center">
                <span className="text-xs text-slate-600 dark:text-slate-400">Standardized Strength (Eq.Wt {activeStd.eqWt})</span>
                <strong className="text-base text-blue-600 dark:text-blue-400 tabular-nums">{standardizedStrength.toFixed(4)} N/M (f = {standardizationFactor.toFixed(4)})</strong>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Indicator: <strong className="text-slate-800 dark:text-slate-200">{activeStd.indicator}</strong> &bull; Primary Standard: <strong className="text-slate-800 dark:text-slate-200">{activeStd.primary}</strong></p>
          </div>

          {/* IP % Assay Purity Calculator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Step 2: IP Volumetric % Purity Assay Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Sample Weight (g)</label>
                <input type="number" step="0.01" value={assaySampleWt} onChange={(e) => setAssaySampleWt(parseFloat(e.target.value) || 0.01)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Concordant Burette Vol (mL)</label>
                <input type="number" step="0.1" value={assayBuretteVol} onChange={(e) => setAssayBuretteVol(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Titrant Molarity/Normality Factor</label>
                <input type="number" step="0.001" value={assayTitrantFactor} onChange={(e) => setAssayTitrantFactor(parseFloat(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-xl p-3 text-center flex flex-col justify-center">
                <span className="text-xs text-slate-600 dark:text-slate-400">Eq. Factor: {activeAssay.eqFactor} g/mL</span>
                <strong className="text-xl text-emerald-600 dark:text-emerald-400 tabular-nums">{assayPurityPct.toFixed(2)}% w/w</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIMIT TESTS (Exp 1a - 1e) */}
      {activeTab === 'limit_tests' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'chloride', label: '1a. Chloride (IP & Modified)' },
              { id: 'sulphate', label: '1b. Sulphate (IP & Modified)' },
              { id: 'iron', label: '1c. Iron' },
              { id: 'lead', label: '1d. Lead' },
              { id: 'arsenic', label: '1e. Arsenic (Gutzeit)' }
            ].map((lt) => (
              <button
                key={lt.id}
                onClick={() => setSelectedLimitTest(lt.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  selectedLimitTest === lt.id ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {lt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 text-sm leading-relaxed">
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{limitTests[selectedLimitTest].title}</h3>
              <p className="text-slate-700 dark:text-slate-300"><strong>Principle &amp; Reagents:</strong> {limitTests[selectedLimitTest].reagents}</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Special / Modified Considerations:</strong> {limitTests[selectedLimitTest].modified}</p>
              <p className="text-blue-700 dark:text-blue-300"><strong>IP Reference Standard:</strong> {limitTests[selectedLimitTest].standard}</p>
            </div>

            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3.5 text-sm">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Nessler / Stain Comparator</h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Sample Weight (g)</label>
                <input type="number" step="0.1" value={limitSampleG} onChange={(e) => setLimitSampleG(parseFloat(e.target.value) || 0.1)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Standard Impurity Mass (mg)</label>
                <input type="number" step="0.01" value={limitStandardMg} onChange={(e) => setLimitStandardMg(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <select value={limitComparison} onChange={(e) => setLimitComparison(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white">
                <option value="pass">Test Opalescence / Color &lt; Standard (PASS)</option>
                <option value="fail">Test Opalescence / Color &gt; Standard (FAIL)</option>
              </select>
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span>Max Limit: <strong className="text-blue-600 dark:text-blue-400 tabular-nums">{((limitStandardMg / (limitSampleG * 1000)) * 1e6).toFixed(0)} ppm</strong></span>
                <span className={`font-bold ${limitComparison === 'pass' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {limitComparison === 'pass' ? 'COMPLIES WITH IP' : 'NON-COMPLIANT'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INORGANIC PREPARATIONS (Exp 2a - 2d) */}
      {activeTab === 'preparations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'aloh3', label: '2a. Aluminium Hydroxide' },
              { id: 'alum', label: '2b. Potash Alum' },
              { id: 'feso4', label: '2c. Ferrous Sulphate' },
              { id: 'mgso4', label: '2d. Magnesium Sulphate' }
            ].map((pr) => (
              <button
                key={pr.id}
                onClick={() => setSelectedPrep(pr.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  selectedPrep === pr.id ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {pr.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3.5 text-sm leading-relaxed">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{preparations[selectedPrep].title}</h3>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 font-medium text-emerald-700 dark:text-emerald-400">
                {preparations[selectedPrep].equation}
              </div>
              <p className="text-slate-700 dark:text-slate-300"><strong>Synthesis Procedure:</strong> {preparations[selectedPrep].procedure}</p>
              <p className="text-blue-700 dark:text-blue-300"><strong>Pharmaceutical Use:</strong> {preparations[selectedPrep].use}</p>

              {/* Stoichiometric Reactant Batch Calculator */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 mt-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Stoichiometric Reactant Scaling</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Target Batch (g):</span>
                    <input type="number" step="1" value={prepTargetG} onChange={(e) => setPrepTargetG(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 dark:text-white tabular-nums" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {prepStoich[selectedPrep].map((r) => (
                    <div key={r.reagent} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">{r.reagent}</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{(prepTargetG * r.ratio).toFixed(2)} g</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 text-sm">
              <h4 className="font-bold text-base text-emerald-600 dark:text-emerald-400">Percentage Yield Calculator</h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Theoretical Yield (g)</label>
                <input type="number" step="0.1" value={theoreticalYieldG} onChange={(e) => setTheoreticalYieldG(parseFloat(e.target.value) || 0.1)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Practical / Actual Yield Obtained (g)</label>
                <input type="number" step="0.1" value={actualYieldG} onChange={(e) => setActualYieldG(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-xl text-center">
                <span className="text-slate-600 dark:text-slate-400 block text-sm">Percentage Yield:</span>
                <strong className="text-2xl text-emerald-600 dark:text-emerald-400 tabular-nums">{yieldPct.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TESTS FOR PURITY (Exp 3a - 3c) */}
      {activeTab === 'purity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
          {/* 3a: Bentonite Swelling Power */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-3.5">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Exp 3(a). Swelling Power of Bentonite (IP)</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Add 2.0 g bentonite in portions to 100 mL water in a graduated cylinder; read swollen gel volume after 24 h (IP limit: &ge; 24 mL).</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Sample Weight (g)</label>
              <input type="number" step="0.1" value={bentoniteWtG} onChange={(e) => setBentoniteWtG(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Apparent Sediment Volume (mL)</label>
              <input type="number" step="0.5" value={bentoniteVolMl} onChange={(e) => setBentoniteVolMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <span>Swelling Power: <strong className="text-emerald-600 dark:text-emerald-400 text-base tabular-nums">{bentoniteSwelling.toFixed(1)} mL/g</strong></span>
              <p className={`mt-1 text-xs font-bold ${bentoniteVolMl >= 24 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {bentoniteVolMl >= 24 ? 'PASS (≥ 24 mL IP Spec)' : 'FAIL (< 24 mL)'}
              </p>
            </div>
          </div>

          {/* 3b: Acid Neutralizing Capacity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-3.5">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Exp 3(b). Acid Neutralizing Capacity (Al(OH)₃ Gel)</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Digest sample with excess 0.5N HCl (37°C, 1h) and back-titrate excess acid with 0.5N NaOH.</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">0.5N HCl Added (mL)</label>
                <input type="number" value={ancBlankMl} onChange={(e) => setAncBlankMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Back-titrated NaOH (mL)</label>
                <input type="number" step="0.1" value={ancBackMl} onChange={(e) => setAncBackMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Normality (N)</label>
                <input type="number" step="0.1" value={ancNormality} onChange={(e) => setAncNormality(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Gel Weight (g)</label>
                <input type="number" step="0.1" value={ancGelG} onChange={(e) => setAncGelG(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <span>Acid Neutralizing Capacity: <strong className="text-emerald-600 dark:text-emerald-400 text-lg tabular-nums">{ancMeq.toFixed(2)} mEq/g</strong></span>
            </div>
          </div>

          {/* 3c: Potassium Iodate & Iodine in KI */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-3.5">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Exp 3(c). Iodate &amp; Free Iodine in Potassium Iodide</h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'pure', label: 'Pure IP Grade KI' },
                { id: 'iodate', label: 'Iodate Impurity (IO₃⁻)' },
                { id: 'free_i2', label: 'Free Iodine (I₂)' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setKiContamType(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    kiContamType === s.id ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setKiAcidAdded(!kiAcidAdded)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                kiAcidAdded ? 'bg-amber-50 dark:bg-amber-600/20 border-amber-500 text-amber-700 dark:text-amber-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {kiAcidAdded ? '✓ Dil. H₂SO₄ + Starch Added' : 'Add 0.2 mL Dil. H₂SO₄ + 1 mL Starch'}
            </button>
            <div className={`p-3.5 rounded-xl border text-center text-sm font-semibold ${
              (kiContamType === 'free_i2' || (kiContamType === 'iodate' && kiAcidAdded))
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-800 dark:text-indigo-200'
                : 'bg-emerald-50 dark:bg-slate-950 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
            }`}>
              {kiContamType === 'free_i2'
                ? 'Immediate Blue Starch-I₂ Color (Even without Acid!) → FAILS Free Iodine Test'
                : kiContamType === 'iodate' && kiAcidAdded
                ? 'Blue Color in <30s (IO₃⁻ + 5I⁻ + 6H⁺ → 3I₂) → FAILS Iodate Limit'
                : 'Colorless Solution for >30s → PASSES IP Purity Spec'}
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">KI Weight (g)</label>
                <input type="number" step="0.5" value={kiSampleWtG} onChange={(e) => setKiSampleWtG(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">0.01M Na₂S₂O₃ (mL)</label>
                <input type="number" step="0.1" value={kiThioMl} onChange={(e) => setKiThioMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <span>Quantified Iodate (KIO₃): <strong className="text-amber-600 dark:text-amber-400 text-base tabular-nums">{iodatePpm.toFixed(1)} ppm</strong></span>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'diagrams' && (
        <ResourceConnector
          department="inorganic"
          topic={activeTab === 'titration' ? 'burette' : 'nessler'}
          defaultSearchQuery={
            activeTab === 'titration'
              ? 'volumetric titration indicator'
              : activeTab === 'limit_tests'
                ? 'limit test chloride sulphate arsenic'
                : 'inorganic pharmaceutical chemistry'
          }
          title="BP106T / BP111P Linked Apparatus Visuals & Textbook Passages"
        />
      )}
    </div>
  );
}
