import React, { useState } from 'react';

export default function PharmacognosyModule() {
  const [stomataCount, setStomataCount] = useState('');
  const [epidermalCount, setEpidermalCount] = useState('');
  const [stomatalIndexResult, setStomatalIndexResult] = useState(null);

  const [veinCount, setVeinCount] = useState('');
  const [areaCount, setAreaCount] = useState('');
  const [veinletResult, setVeinletResult] = useState(null);

  const calculateStomatalIndex = (e) => {
    e.preventDefault();
    const s = parseFloat(stomataCount);
    const eCells = parseFloat(epidermalCount);
    if (s >= 0 && eCells > 0) {
      const index = (s / (eCells + s)) * 100;
      setStomatalIndexResult(index.toFixed(2));
    }
  };

  const calculateVeinlet = (e) => {
    e.preventDefault();
    const v = parseFloat(veinCount);
    const a = parseFloat(areaCount);
    if (v >= 0 && a > 0) {
      const ratio = v / a;
      setVeinletResult(ratio.toFixed(2));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP105T / BP110P Core Module</span>
        <h2 className="text-2xl font-bold mt-1 mb-2">Pharmacognosy & Phytochemistry Laboratory</h2>
        <p className="text-slate-400 text-sm">
          Quantitative microscopy evaluation tools for crude drug authentication, stomatal index determination, and leaf constant analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-2">1. Stomatal Index Calculator</h3>
          <form onSubmit={calculateStomatalIndex} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Number of Stomata (S)</label>
              <input
                type="number"
                step="any"
                value={stomataCount}
                onChange={(e) => setStomataCount(e.target.value)}
                placeholder="e.g., 15"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Number of Epidermal Cells (E)</label>
              <input
                type="number"
                step="any"
                value={epidermalCount}
                onChange={(e) => setEpidermalCount(e.target.value)}
                placeholder="e.g., 45"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
              Calculate Stomatal Index
            </button>
          </form>
          {stomatalIndexResult !== null && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
              <span className="text-sm text-slate-400">Stomatal Index (I): </span>
              <span className="text-xl font-bold text-emerald-400">{stomatalIndexResult}%</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-2">2. Vein-let Termination Number</h3>
          <form onSubmit={calculateVeinlet} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Vein-let Terminations Counted</label>
              <input
                type="number"
                step="any"
                value={veinCount}
                onChange={(e) => setVeinCount(e.target.value)}
                placeholder="e.g., 22"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Area Examined (mm²)</label>
              <input
                type="number"
                step="any"
                value={areaCount}
                onChange={(e) => setAreaCount(e.target.value)}
                placeholder="e.g., 4"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
              Calculate Vein-let Number
            </button>
          </form>
          {veinletResult !== null && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
              <span className="text-sm text-slate-400">Vein-let Termination Number: </span>
              <span className="text-xl font-bold text-emerald-400">{veinletResult} per mm²</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
