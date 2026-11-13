import React, { useState } from 'react';

export default function InorganicChemistryModule() {
  // Titration Calculator state
  const [normalityA, setNormalityA] = useState('');
  const [volumeA, setVolumeA] = useState('');
  const [volumeB, setVolumeB] = useState('');
  const [normalityBResult, setNormalityBResult] = useState(null);

  // Limit Test state
  const [testSubstance, setTestSubstance] = useState('Sodium Chloride');
  const [sampleWeight, setSampleWeight] = useState('');
  const [turbidityChecked, setTurbidityChecked] = useState(false);

  const calculateTitration = (e) => {
    e.preventDefault();
    const na = parseFloat(normalityA);
    const va = parseFloat(volumeA);
    const vb = parseFloat(volumeB);

    if (na > 0 && va > 0 && vb > 0) {
      // Formula: N_a * V_a = N_b * V_b => N_b = (N_a * V_a) / V_b
      const nb = (na * va) / vb;
      setNormalityBResult(nb.toFixed(4));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP106T / BP111P Core Module</span>
        <h2 className="text-2xl font-bold mt-1 mb-2">Pharmaceutical Inorganic & Analytical Chemistry</h2>
        <p className="text-slate-400 text-sm">
          Volumetric titration stoichiometry calculators and limit test evaluation protocols for purity assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Titration Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-2">1. Acid-Base Titration (N<sub>1</sub>V<sub>1</sub> = N<sub>2</sub>V<sub>2</sub>)</h3>
          <p className="text-xs text-slate-400 mb-4">Determine unknown normality or molarity of titrand solutions.</p>
          <form onSubmit={calculateTitration} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Normality of Known Solution (N<sub>1</sub>)</label>
              <input
                type="number"
                step="any"
                value={normalityA}
                onChange={(e) => setNormalityA(e.target.value)}
                placeholder="e.g., 0.1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Volume of Known Solution (V<sub>1</sub>, ml)</label>
              <input
                type="number"
                step="any"
                value={volumeA}
                onChange={(e) => setVolumeA(e.target.value)}
                placeholder="e.g., 25"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Volume of Unknown Solution (V<sub>2</sub>, ml)</label>
              <input
                type="number"
                step="any"
                value={volumeB}
                onChange={(e) => setVolumeB(e.target.value)}
                placeholder="e.g., 24.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
              Calculate Normality (N<sub>2</sub>)
            </button>
          </form>
          {normalityBResult !== null && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
              <span className="text-sm text-slate-400">Calculated Normality (N<sub>2</sub>): </span>
              <span className="text-xl font-bold text-emerald-400">{normalityBResult} N</span>
            </div>
          )}
        </div>

        {/* Limit Test Protocol Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-2">2. Limit Test Protocol Assistant</h3>
          <p className="text-xs text-slate-400 mb-4">Standard protocol checklist for Chloride / Sulfate limit tests.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Test Substance</label>
              <select
                value={testSubstance}
                onChange={(e) => setTestSubstance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Sodium Chloride">Limit Test for Chloride</option>
                <option value="Sodium Sulfate">Limit Test for Sulfate</option>
                <option value="Iron">Limit Test for Iron</option>
              </select>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-emerald-400">Standard Procedure Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Dilute nitric acid / hydrochloric acid addition to prevent precipitation of other salts.</li>
                <li>Addition of silver nitrate solution (for chloride) or barium chloride (for sulfate).</li>
                <li>5-minute standing period for opalescence / turbidity comparison against standard control tube.</li>
              </ul>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 text-center">
              Protocol Ready: Ensure Nessler cylinders are clean and matched.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
