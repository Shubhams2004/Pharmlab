import React, { useState } from 'react';

export default function GeneralPharmacyModule() {
  const [higherStrength, setHigherStrength] = useState('');
  const [lowerStrength, setLowerStrength] = useState('');
  const [desiredStrength, setDesiredStrength] = useState('');
  const [totalVolume, setTotalVolume] = useState('');
  const [alligationResult, setAlligationResult] = useState(null);

  const [c1, setC1] = useState('');
  const [v1, setV1] = useState('');
  const [c2, setC2] = useState('');
  const [v2Result, setV2Result] = useState(null);

  const calculateAlligation = (e) => {
    e.preventDefault();
    const h = parseFloat(higherStrength);
    const l = parseFloat(lowerStrength);
    const d = parseFloat(desiredStrength);
    const v = parseFloat(totalVolume);

    if (h > d && d > l && v > 0) {
      const partsHigher = d - l;
      const partsLower = h - d;
      const totalParts = partsHigher + partsLower;
      const volumeHigher = (partsHigher / totalParts) * v;
      const volumeLower = (partsLower / totalParts) * v;

      setAlligationResult({
        partsHigher: partsHigher.toFixed(2),
        partsLower: partsLower.toFixed(2),
        volumeHigher: volumeHigher.toFixed(2),
        volumeLower: volumeLower.toFixed(2),
      });
    }
  };

  const calculateDilution = (e) => {
    e.preventDefault();
    const stockConc = parseFloat(c1);
    const stockVol = parseFloat(v1);
    const finalConc = parseFloat(c2);

    if (stockConc > 0 && stockVol > 0 && finalConc > 0) {
      const finalVol = (stockConc * stockVol) / finalConc;
      setV2Result(finalVol.toFixed(2));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP102T / BP107P Core Module</span>
        <h2 className="text-2xl font-bold mt-1 mb-2">General Pharmacy Calculation Engine</h2>
        <p className="text-slate-400 text-sm">
          Precision formulation tools for pharmaceutical calculations, alligation mixing, and stock solution dilutions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-4">1. Alligation Method Calculator</h3>
          <form onSubmit={calculateAlligation} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Higher Strength (%)</label>
              <input type="number" step="any" value={higherStrength} onChange={(e) => setHigherStrength(e.target.value)} placeholder="e.g., 10" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lower Strength (%)</label>
              <input type="number" step="any" value={lowerStrength} onChange={(e) => setLowerStrength(e.target.value)} placeholder="e.g., 2" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Desired Strength (%)</label>
              <input type="number" step="any" value={desiredStrength} onChange={(e) => setDesiredStrength(e.target.value)} placeholder="e.g., 5" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Total Desired Volume (ml)</label>
              <input type="number" step="any" value={totalVolume} onChange={(e) => setTotalVolume(e.target.value)} placeholder="e.g., 1000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">Calculate Alligation</button>
          </form>
          {alligationResult && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 space-y-2 text-sm">
              <p className="text-emerald-400 font-bold">Volumes required:</p>
              <p className="text-slate-300">Higher volume: {alligationResult.volumeHigher} ml</p>
              <p className="text-slate-300">Lower volume: {alligationResult.volumeLower} ml</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-4">2. Solution Dilution (C<sub>1</sub>V<sub>1</sub> = C<sub>2</sub>V<sub>2</sub>)</h3>
          <form onSubmit={calculateDilution} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Initial Concentration (C<sub>1</sub>, %)</label>
              <input type="number" step="any" value={c1} onChange={(e) => setC1(e.target.value)} placeholder="e.g., 20" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Initial Volume (V<sub>1</sub>, ml)</label>
              <input type="number" step="any" value={v1} onChange={(e) => setV1(e.target.value)} placeholder="e.g., 50" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Concentration (C<sub>2</sub>, %)</label>
              <input type="number" step="any" value={c2} onChange={(e) => setC2(e.target.value)} placeholder="e.g., 5" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500" required />
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">Calculate Final Volume</button>
          </form>
          {v2Result && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
              <span className="text-sm text-slate-400">Total Final Volume (V<sub>2</sub>): </span>
              <span className="text-xl font-bold text-emerald-400">{v2Result} ml</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
