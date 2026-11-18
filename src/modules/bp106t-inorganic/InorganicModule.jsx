import React, { useState } from 'react';
import { FlaskConical, Droplet, RefreshCcw, Sliders, Info, BookmarkCheck, ShieldCheck, Beaker, Scale } from 'lucide-react';

export default function InorganicModule() {
  const [activeTab, setActiveTab] = useState('titration');

  // Existing Burette Simulation State (preserved & extended for all 7 BP111P assays)
  const [selectedAssayId, setSelectedAssayId] = useState('hcl_naoh');
  const [titrantVolume, setTitrantVolume] = useState(0);
  const [trials, setTrials] = useState([]);

  // Assay % Purity Calculator State
  const [assaySampleWt, setAssaySampleWt] = useState(0.5);
  const [assayBuretteVol, setAssayBuretteVol] = useState(25.0);
  const [assayTitrantFactor, setAssayTitrantFactor] = useState(1.0);

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

  const bentoniteSwelling = bentoniteWtG > 0 ? bentoniteVolMl / bentoniteWtG : 0;
  const ancMeq = ancGelG > 0 ? ((ancBlankMl - ancBackMl) * ancNormality) / ancGelG : 0;
  const yieldPct = theoreticalYieldG > 0 ? (actualYieldG / theoreticalYieldG) * 100 : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider">
            BP106T / BP111P &bull; Practical Suite (18 Experiments)
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
          Pharmaceutical Inorganic &amp; Analytical Chemistry Lab
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl">
          Live volumetric titration &amp; assay simulator (Exp 4a–4g), IP Limit Tests (Exp 1a–1e), Inorganic Synthesis (Exp 2a–2d), and Tests for Purity (Exp 3a–3c).
        </p>
      </div>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'titration', label: '🧪 Volumetric Assays & Burette (Exp 4a–4g)' },
          { id: 'limit_tests', label: '🔍 Limit Tests Simulator (Exp 1a–1e)' },
          { id: 'preparations', label: '⚗️ Inorganic Preparations (Exp 2a–2d)' },
          { id: 'purity', label: '📊 Tests for Purity (Exp 3a–3c)' }
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

      {/* TAB 1: LIVE BURETTE & ALL 7 IP ASSAYS */}
      {activeTab === 'titration' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
              Select BP111P Volumetric Assay Method (Exp 4a–4g)
            </label>
            <select
              value={selectedAssayId}
              onChange={(e) => { setSelectedAssayId(e.target.value); setTitrantVolume(0); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(assayConfigs).map(([id, cfg]) => (
                <option key={id} value={id}>{cfg.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><strong>Titrant (Burette):</strong> {activeAssay.titrant}</div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><strong>Flask Contents:</strong> {activeAssay.analyte}</div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><strong>Indicator:</strong> {activeAssay.indicator}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 lg:col-span-1">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Burette Controls</h3>
                    <p className="text-xs text-slate-400">Target Endpoint: {equivalencePoint} mL</p>
                  </div>
                </div>
                <button onClick={resetTitration} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all" title="Reset Titration">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                    <span>Titrant Added:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{titrantVolume.toFixed(1)} mL</strong>
                  </div>
                  <input type="range" min="0" max="50" step="0.5" value={titrantVolume} onChange={(e) => setTitrantVolume(parseFloat(e.target.value))} className="w-full accent-emerald-500 bg-slate-950 cursor-pointer" />
                </div>

                <button onClick={addDrop} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 shadow">
                  <Droplet className="w-4 h-4 text-emerald-400" />
                  <span>Add 1 Drop (+0.1 mL)</span>
                </button>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Simulated pH</span>
                    <span className="text-xl font-extrabold text-white font-mono">{currentPH}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Endpoint Status</span>
                    <span className={`text-xs font-bold font-mono ${isEndpointReached ? 'text-emerald-400' : 'text-sky-400'}`}>
                      {isEndpointReached ? activeAssay.endLabel : isOverTitrated ? 'Over-titrated' : 'Pre-endpoint'}
                    </span>
                  </div>
                </div>

                <button onClick={saveTrial} disabled={trials.length >= 3} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Record Trial Result ({trials.length}/3)</span>
                </button>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Tip:</strong> Approach {equivalencePoint} mL and use "Add 1 Drop (+0.1 mL)" to capture the exact color transition.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl lg:col-span-2 flex flex-col items-center justify-between relative overflow-hidden">
              <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 z-10">
                <div className="flex items-center space-x-2">
                  <FlaskConical className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Live Virtual Lab Bench</h3>
                </div>
                <span className={`text-xs font-mono px-3 py-1 rounded-full border ${isEndpointReached ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {isEndpointReached ? 'Endpoint Reached (Stop!)' : isOverTitrated ? 'Over-titrated' : 'Titration in Progress'}
                </span>
              </div>

              <div className="my-6 flex flex-col items-center z-10 relative">
                <div className="w-6 h-36 bg-slate-950 border-2 border-slate-700 rounded-t-lg relative overflow-hidden flex flex-col justify-start">
                  <div className="w-full bg-emerald-400/30 border-b border-emerald-400/50 transition-all duration-200" style={{ height: `${buretteLevel}%` }}></div>
                </div>
                <div className="w-3 h-4 bg-slate-700"></div>
                {titrantVolume > 0 && titrantVolume < 50 && (
                  <div className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce my-1"></div>
                )}
                <div className="w-48 h-48 border-2 border-slate-600 rounded-b-[40px] rounded-t-lg relative flex flex-col justify-end p-3 overflow-hidden bg-slate-950/50 shadow-2xl">
                  <div className={`w-full transition-all duration-300 rounded-b-[36px] border-t-2 flex items-center justify-center ${getFlaskColor()}`} style={{ height: '70%' }}>
                    <div className="text-center px-2">
                      <span className="text-[11px] font-mono font-bold block">{activeAssay.titrant}</span>
                      <span className="text-[10px] font-mono opacity-90">Burette: {titrantVolume.toFixed(1)} mL</span>
                    </div>
                  </div>
                </div>
                <div className="w-56 h-3 bg-slate-800 rounded-full mt-2 shadow-lg"></div>
              </div>

              {trials.length > 0 && (
                <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 z-10 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Practical Journal Records</span>
                  <div className="grid grid-cols-3 gap-2">
                    {trials.map((t) => (
                      <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
                        <span className="text-[10px] text-slate-400 block">Trial {t.id}</span>
                        <strong className="text-xs font-mono text-emerald-400">{t.volume} mL</strong>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* IP % Assay Purity Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-emerald-400">IP Volumetric % Purity Assay Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Sample Weight (g)</label>
                <input type="number" step="0.01" value={assaySampleWt} onChange={(e) => setAssaySampleWt(parseFloat(e.target.value) || 0.01)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Concordant Burette Vol (mL)</label>
                <input type="number" step="0.1" value={assayBuretteVol} onChange={(e) => setAssayBuretteVol(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Titrant Molarity/Normality Factor</label>
                <input type="number" step="0.001" value={assayTitrantFactor} onChange={(e) => setAssayTitrantFactor(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3 text-center flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase">Eq. Factor: {activeAssay.eqFactor} g/mL</span>
                <strong className="text-lg font-mono text-emerald-400">{assayPurityPct.toFixed(2)}% w/w</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIMIT TESTS (Exp 1a - 1e) */}
      {activeTab === 'limit_tests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                  selectedLimitTest === lt.id ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {lt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="text-base font-bold text-emerald-400">{limitTests[selectedLimitTest].title}</h3>
              <p className="text-slate-300 leading-relaxed"><strong>Principle &amp; Reagents:</strong> {limitTests[selectedLimitTest].reagents}</p>
              <p className="text-slate-300 leading-relaxed"><strong>Special / Modified Considerations:</strong> {limitTests[selectedLimitTest].modified}</p>
              <p className="text-blue-300 leading-relaxed"><strong>IP Reference Standard:</strong> {limitTests[selectedLimitTest].standard}</p>
            </div>

            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider">Nessler / Stain Comparator</h4>
              <div>
                <label className="block text-slate-400 mb-1">Sample Weight (g)</label>
                <input type="number" step="0.1" value={limitSampleG} onChange={(e) => setLimitSampleG(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Standard Impurity Mass (mg)</label>
                <input type="number" step="0.01" value={limitStandardMg} onChange={(e) => setLimitStandardMg(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <select value={limitComparison} onChange={(e) => setLimitComparison(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white">
                <option value="pass">Test Opalescence / Color &lt; Standard (PASS)</option>
                <option value="fail">Test Opalescence / Color &gt; Standard (FAIL)</option>
              </select>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>Max Limit: <strong className="font-mono text-blue-400">{((limitStandardMg / (limitSampleG * 1000)) * 1e6).toFixed(0)} ppm</strong></span>
                <span className={`font-bold ${limitComparison === 'pass' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {limitComparison === 'pass' ? 'COMPLIES WITH IP' : 'NON-COMPLIANT'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INORGANIC PREPARATIONS (Exp 2a - 2d) */}
      {activeTab === 'preparations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                  selectedPrep === pr.id ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {pr.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="text-base font-bold text-white">{preparations[selectedPrep].title}</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-emerald-400">
                {preparations[selectedPrep].equation}
              </div>
              <p className="text-slate-300 leading-relaxed"><strong>Synthesis Procedure:</strong> {preparations[selectedPrep].procedure}</p>
              <p className="text-blue-300"><strong>Pharmaceutical Use:</strong> {preparations[selectedPrep].use}</p>
            </div>
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h4 className="font-bold text-emerald-400 uppercase tracking-wider">Percentage Yield Calculator</h4>
              <div>
                <label className="block text-slate-400 mb-1">Theoretical Yield (g)</label>
                <input type="number" step="0.1" value={theoreticalYieldG} onChange={(e) => setTheoreticalYieldG(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Practical / Actual Yield Obtained (g)</label>
                <input type="number" step="0.1" value={actualYieldG} onChange={(e) => setActualYieldG(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl text-center">
                <span className="text-slate-400 block">Percentage Yield:</span>
                <strong className="text-2xl font-mono text-emerald-400">{yieldPct.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TESTS FOR PURITY (Exp 3a - 3c) */}
      {activeTab === 'purity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* 3a: Bentonite Swelling Power */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-emerald-400">Exp 3(a). Swelling Power of Bentonite (IP)</h3>
            <p className="text-slate-400">Add 2.0 g bentonite in portions to 100 mL water in a graduated cylinder; read swollen gel volume after 24 h (IP limit: ≥ 24 mL).</p>
            <div>
              <label className="block text-slate-400 mb-1">Sample Weight (g)</label>
              <input type="number" step="0.1" value={bentoniteWtG} onChange={(e) => setBentoniteWtG(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Apparent Sediment Volume (mL)</label>
              <input type="number" step="0.5" value={bentoniteVolMl} onChange={(e) => setBentoniteVolMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
              <span>Swelling Power: <strong className="font-mono text-emerald-400">{bentoniteSwelling.toFixed(1)} mL/g</strong></span>
              <p className={`mt-1 font-bold ${bentoniteVolMl >= 24 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {bentoniteVolMl >= 24 ? 'PASS (≥ 24 mL IP Spec)' : 'FAIL (< 24 mL)'}
              </p>
            </div>
          </div>

          {/* 3b: Acid Neutralizing Capacity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-emerald-400">Exp 3(b). Acid Neutralizing Capacity (Al(OH)₃ Gel)</h3>
            <p className="text-slate-400">Digest sample with excess 0.5N HCl (37°C, 1h) and back-titrate excess acid with 0.5N NaOH.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">0.5N HCl Added (mL)</label>
                <input type="number" value={ancBlankMl} onChange={(e) => setAncBlankMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Back-titrated NaOH (mL)</label>
                <input type="number" step="0.1" value={ancBackMl} onChange={(e) => setAncBackMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Normality (N)</label>
                <input type="number" step="0.1" value={ancNormality} onChange={(e) => setAncNormality(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Gel Weight (g)</label>
                <input type="number" step="0.1" value={ancGelG} onChange={(e) => setAncGelG(parseFloat(e.target.value) || 0.1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
              </div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
              <span>Acid Neutralizing Capacity: <strong className="font-mono text-emerald-400 text-base">{ancMeq.toFixed(2)} mEq/g</strong></span>
            </div>
          </div>

          {/* 3c: Potassium Iodate & Iodine in KI */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-emerald-400">Exp 3(c). Iodate &amp; Free Iodine in Potassium Iodide</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 leading-relaxed text-slate-300">
              <p><strong>Test for Iodate (IO₃⁻):</strong> Dissolve 0.5 g KI in 10 mL freshly boiled &amp; cooled water, add 0.2 mL dil. H₂SO₄ and 1 mL starch solution. No blue colour should develop within 30 seconds (IO₃⁻ + 5I⁻ + 6H⁺ → 3I₂ + 3H₂O).</p>
              <p><strong>Test for Free Iodine (I₂):</strong> Dissolve 1.0 g KI in 10 mL water and add 1 mL starch; absence of blue colour confirms freedom from free elemental iodine impurity.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
