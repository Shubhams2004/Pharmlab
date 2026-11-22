import React, { useState } from 'react';
import { Calculator, Atom, ShieldAlert, Beaker, BookOpen } from 'lucide-react';
import { WorkspaceTabBar } from '../../components/WorkspacePrimitives';

export default function InorganicTheory() {
  const [unit, setUnit] = useState('unit1');

  // Unit I: Solution Strength Converter
  const [solGrams, setSolGrams] = useState(5.85);
  const [solMolWt, setSolMolWt] = useState(58.44);
  const [solValency, setSolValency] = useState(1);
  const [solVolMl, setSolVolMl] = useState(1000);

  // Unit II: Henderson-Hasselbalch Buffer pH Calculator
  const [pka, setPka] = useState(4.76);
  const [saltConc, setSaltConc] = useState(0.1);
  const [acidConc, setAcidConc] = useState(0.1);

  // Unit IV: Radioisotope Half-life Decay Calculator
  const [selectedIsotope, setSelectedIsotope] = useState('tc99m');
  const [initialActivity, setInitialActivity] = useState(100);
  const [elapsedHours, setElapsedHours] = useState(6);

  const volL = solVolMl > 0 ? solVolMl / 1000 : 1;
  const molarity = solMolWt > 0 ? (solGrams / solMolWt) / volL : 0;
  const eqWt = solValency > 0 ? solMolWt / solValency : solMolWt;
  const normality = eqWt > 0 ? (solGrams / eqWt) / volL : 0;
  const pctWv = solVolMl > 0 ? (solGrams / solVolMl) * 100 : 0;
  const ppmVal = solVolMl > 0 ? (solGrams * 1000 / solVolMl) * 1000 : 0;

  const bufferPh = acidConc > 0 && saltConc > 0 ? pka + Math.log10(saltConc / acidConc) : pka;

  const isotopes = {
    tc99m: { name: 'Technetium-99m (⁹⁹ᵐTc)', halfLifeHrs: 6.01, emission: 'Gamma (140 keV)', app: 'Diagnostic SPECT imaging (bone, renal, cardiac, brain scans); generator-produced from ⁹⁹Mo.' },
    i131: { name: 'Sodium Iodide I-131 (¹³¹I)', halfLifeHrs: 192.48, emission: 'Beta⁻ & Gamma', app: 'Thyroid uptake imaging, hyperthyroidism & thyroid carcinoma ablation (t₁/₂ = 8.02 days).' },
    p32: { name: 'Phosphorus-32 (³²P)', halfLifeHrs: 342.96, emission: 'Pure Beta⁻', app: 'Treatment of Polycythemia vera & chronic leukemia (t₁/₂ = 14.29 days; plastic shielding).' },
    co60: { name: 'Cobalt-60 (⁶⁰Co)', halfLifeHrs: 46194, emission: 'High-energy Gamma', app: 'External beam radiotherapy & sterilization of surgical/medical devices (t₁/₂ = 5.27 years).' }
  };

  const activeIso = isotopes[selectedIsotope];
  const remainingActivity = initialActivity * Math.pow(0.5, elapsedHours / activeIso.halfLifeHrs);

  const unitTabs = [
    { id: 'unit1', label: 'Unit I: Solutions, Errors & Impurities' },
    { id: 'unit2', label: 'Unit II: Buffers, Isotonicity & Electrolytes' },
    { id: 'unit3', label: 'Unit III: Titrimetry & Gravimetry' },
    { id: 'unit4', label: 'Unit IV: GI Agents & Radiopharma' },
    { id: 'unit5', label: 'Unit V: Expectorants, Haematinics & Antidotes' }
  ];

  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <WorkspaceTabBar
        tabs={unitTabs}
        activeTab={unit}
        onChange={setUnit}
        ariaLabel="BP106T Inorganic Chemistry Theory Units"
      />

      {/* UNIT I */}
      {unit === 'unit1' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Solution Strength Converter (M, N, % w/v, ppm)</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Solute Mass (g)</label>
                <input type="number" step="0.01" value={solGrams} onChange={(e) => setSolGrams(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Molecular Weight (g/mol)</label>
                <input type="number" step="0.01" value={solMolWt} onChange={(e) => setSolMolWt(parseFloat(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">n-Factor (Valency/Acidity)</label>
                <input type="number" min="1" value={solValency} onChange={(e) => setSolValency(parseFloat(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Solution Volume (mL)</label>
                <input type="number" value={solVolMl} onChange={(e) => setSolVolMl(parseFloat(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-xl p-3 text-center">
              <div><span className="text-xs text-slate-500 dark:text-slate-400 block">Molarity</span><strong className="text-base text-emerald-600 dark:text-emerald-400 tabular-nums">{molarity.toFixed(3)} M</strong></div>
              <div><span className="text-xs text-slate-500 dark:text-slate-400 block">Normality</span><strong className="text-base text-blue-600 dark:text-blue-400 tabular-nums">{normality.toFixed(3)} N</strong></div>
              <div><span className="text-xs text-slate-500 dark:text-slate-400 block">% w/v</span><strong className="text-base text-amber-600 dark:text-amber-400 tabular-nums">{pctWv.toFixed(2)}%</strong></div>
              <div><span className="text-xs text-slate-500 dark:text-slate-400 block">ppm</span><strong className="text-base text-purple-700 dark:text-purple-400 tabular-nums">{ppmVal.toFixed(0)}</strong></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Primary Standards &amp; Sources of Impurities</h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1 text-slate-700 dark:text-slate-300">
              <p><strong className="text-blue-600 dark:text-blue-400">Primary Standards (≥99.9% pure, non-hygroscopic, high Eq.Wt):</strong> Potassium Hydrogen Phthalate (KHP), Anhydrous Na₂CO₃, Oxalic acid, K₂Cr₂O₇, NaCl, CaCO₃.</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Secondary Standards (require standardization):</strong> NaOH (deliquescent, absorbs CO₂), HCl, KMnO₄, Na₂S₂O₃, EDTA.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1 text-slate-700 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white">Sources of Impurities in Pharmaceuticals:</p>
              <p>Raw materials, manufacturing process/reagents (Pb/As from H₂SO₄ lead chambers), reaction vessels (Fe/Cu corrosion), solvents, atmospheric CO₂/moisture, packaging leachables, and chemical decomposition during storage.</p>
            </div>
          </div>
        </div>
      )}

      {/* UNIT II */}
      {unit === 'unit2' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Henderson-Hasselbalch Buffer pH Calculator</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Weak Acid pKa</label>
                <input type="number" step="0.01" value={pka} onChange={(e) => setPka(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">[Salt] (M)</label>
                <input type="number" step="0.01" value={saltConc} onChange={(e) => setSaltConc(parseFloat(e.target.value) || 0.001)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">[Acid] (M)</label>
                <input type="number" step="0.01" value={acidConc} onChange={(e) => setAcidConc(parseFloat(e.target.value) || 0.001)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-xl p-4 text-center">
              <span className="text-slate-600 dark:text-slate-400">pH = pKa + log([Salt]/[Acid]) &rarr; </span>
              <strong className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">pH {bufferPh.toFixed(2)}</strong>
            </div>
            <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <strong>Physiological Acid-Base Buffers (Blood pH 7.35–7.45):</strong> Bicarbonate buffer (H₂CO₃/HCO₃⁻ 1:20 ratio), Phosphate buffer (H₂PO₄⁻/HPO₄²⁻), and Plasma Protein / Hemoglobin buffer systems.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Major Extra- &amp; Intracellular Electrolytes</h3>
            <div className="space-y-2">
              {[
                { ion: 'Na⁺ (ECF: 135–145 mEq/L | ICF: 10)', role: 'Primary extracellular cation regulating osmotic pressure, water balance, and nerve action potentials. Therapy: Sodium Chloride* (0.9% isotonic).' },
                { ion: 'K⁺ (ICF: 150 mEq/L | ECF: 3.5–5.0)', role: 'Primary intracellular cation maintaining resting membrane potential & cardiac rhythm. Therapy: Potassium Chloride.' },
                { ion: 'Ca²⁺ (ECF: 4.5–5.5 mEq/L)', role: 'Bone mineralization, blood clotting Factor IV, neurotransmitter release & muscle contraction. Therapy: Calcium Chloride / Gluconate.' },
                { ion: 'HCO₃⁻ & Cl⁻ + ORS', role: 'HCO₃⁻ maintains blood pH; Cl⁻ maintains gastric HCl & electroneutrality. WHO ORS restores Na⁺/K⁺/Citrate/Glucose via SGLT-1 cotransport.' }
              ].map((el) => (
                <div key={el.ion} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <strong className="text-blue-600 dark:text-blue-400 block">{el.ion}</strong>
                  <span className="text-slate-700 dark:text-slate-300">{el.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UNIT III */}
      {unit === 'unit3' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Non-Aqueous, Precipitation &amp; Complexometric Titrations</h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5 text-slate-700 dark:text-slate-300">
              <p><strong className="text-blue-600 dark:text-blue-400">Non-Aqueous Titrations:</strong> Used for water-insoluble or very weak acids/bases. Solvents: Protogenic (Glacial Acetic Acid), Protophilic (DMF, Pyridine), Amphiprotic (Alcohols), Aprotic (Benzene/CCl₄). Titrant for weak bases (Sodium benzoate): 0.1N Perchloric acid (HClO₄) + Crystal Violet.</p>
              <p><strong className="text-blue-600 dark:text-blue-400">Precipitation Methods:</strong> <em>Mohr's</em> (K₂CrO₄ → brick-red Ag₂CrO₄ at pH 6.5–9), <em>Volhard's</em> (back-titration with SCN⁻ using Ferric alum → red [Fe(SCN)]²⁺; Modified adds nitrobenzene for NaCl), <em>Fajans</em> (Adsorption indicator: Fluorescein).</p>
              <p><strong className="text-blue-600 dark:text-blue-400">Complexometry (EDTA):</strong> Metal ion indicators (EBT, Murexide), Masking agents (KCN, Triethanolamine, BAL) &amp; Demasking (Formaldehyde/Chloral hydrate). Assay of MgSO₄ &amp; Calcium Gluconate*.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Gravimetry &amp; Redox Titration Types</h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5 text-slate-700 dark:text-slate-300">
              <p><strong className="text-amber-600 dark:text-amber-400">Gravimetric Steps (BaSO₄ Estimation):</strong> Preparation of solution → Precipitation (hot BaCl₂) → Digestion (Ostwald ripening) → Filtration (ashless filter paper) → Washing → Drying/Ignition to constant weight → Weighing.</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Permanganometry:</strong> Strong oxidant KMnO₄ in H₂SO₄ (self-indicator; assay of H₂O₂).</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Cerimetry:</strong> Ceric ammonium sulphate (Ce⁴⁺ → Ce³⁺) with Ferroin (assay of FeSO₄).</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Iodimetry vs Iodometry:</strong> Direct titration using standard I₂ vs Indirect titration of I₂ liberated from KI by oxidants (CuSO₄) with Na₂S₂O₃.</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Potassium Iodate (KIO₃):</strong> Andrews titration in strong HCl (ICl endpoint with CHCl₃).</p>
            </div>
          </div>
        </div>
      )}

      {/* UNIT IV */}
      {unit === 'unit4' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Gastrointestinal Agents &amp; Inorganic Antimicrobials</h3>
            {[
              { cat: 'Acidifiers', body: 'Sodium acid phosphate, Dilute HCl (treats achlorhydria/hypochlorhydria).' },
              { cat: 'Antacids', body: 'Sodium bicarbonate* (systemic, rapid CO₂), Aluminium hydroxide gel* (non-systemic, constipating), combined with Mg(OH)₂ (laxative) to balance bowel motility.' },
              { cat: 'Cathartics / Laxatives', body: 'Magnesium hydroxide, Sodium orthophosphate, Sodium potassium tartrate (Rochelle salt), Magnesium trisilicate.' },
              { cat: 'Antimicrobials', body: 'Oxidation (KMnO₄, H₂O₂*), Halogenation (Chlorinated lime*, Iodine/Lugol\'s/Povidone), Protein precipitation/Bacteriostatic (Boric acid).' }
            ].map((g) => (
              <div key={g.cat} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <strong className="text-blue-600 dark:text-blue-400">{g.cat}: </strong>
                <span className="text-slate-700 dark:text-slate-300">{g.body}</span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <Atom className="w-5 h-5" />
              <span>Radiopharmaceuticals &amp; Decay Calculator (N = N₀ e⁻λᵗ)</span>
            </h3>
            <select value={selectedIsotope} onChange={(e) => setSelectedIsotope(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              {Object.entries(isotopes).map(([k, v]) => (
                <option key={k} value={k}>{v.name} — {v.emission}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Initial Activity (mCi)</label>
                <input type="number" value={initialActivity} onChange={(e) => setInitialActivity(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Elapsed Time (Hours)</label>
                <input type="number" value={elapsedHours} onChange={(e) => setElapsedHours(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-xl p-3.5 text-center">
              <span className="text-slate-600 dark:text-slate-400">Remaining Activity: </span>
              <strong className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{remainingActivity.toFixed(2)} mCi</strong>
              <p className="text-slate-700 dark:text-slate-300 mt-1 text-left">{activeIso.app}</p>
            </div>
          </div>
        </div>
      )}

      {/* UNIT V */}
      {unit === 'unit5' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Expectorants', detail: 'Potassium iodide (KI) & Ammonium chloride* — decrease sputum viscosity and reflexively stimulate bronchial secretions.' },
            { title: 'Emetics', detail: 'Copper sulphate* (irritates gastric mucosa to induce emesis; also phosphorus poisoning antidote) & Sodium potassium tartrate.' },
            { title: 'Haematinics', detail: 'Ferrous sulphate* & Ferrous gluconate — replenish Fe²⁺ for hemoglobin synthesis in iron-deficiency anaemia (Ferrous gluconate causes less GI irritation).' },
            { title: 'Poison & Antidotes (Sodium Thiosulphate)', detail: 'Classification: Physiological (Atropine for organophosphates), Mechanical (Activated charcoal), Chemical (Chelators/Sodium thiosulphate). Sodium thiosulphate (Na₂S₂O₃) donates sulfur via mitochondrial rhodanese converting lethal Cyanide (CN⁻) into harmless Thiocyanate (SCN⁻) excreted renally.' }
          ].map((m) => (
            <div key={m.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2 shadow-sm dark:shadow-none">
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">{m.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{m.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
