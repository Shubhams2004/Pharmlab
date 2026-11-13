import React, { useState } from 'react';

export default function AnatomyModule() {
  const [dilution, setDilution] = useState('20');
  const [depth, setDepth] = useState('0.1');
  const [squaresCounted, setSquaresCounted] = useState('');
  const [wbcResult, setWbcResult] = useState(null);

  const [hbValue, setHbValue] = useState('');
  const [gender, setGender] = useState('male');
  const [hbResult, setHbResult] = useState(null);

  const calculateWbc = (e) => {
    e.preventDefault();
    const cells = parseFloat(squaresCounted);
    const d = parseFloat(dilution);
    const dep = parseFloat(depth);

    if (cells >= 0 && d > 0 && dep > 0) {
      // Formula: WBC count / cu.mm = (Cells * Dilution * Depth) / Area counted
      const totalWbc = (cells * d) / (0.1 * 4 * dep); // standard hemocytometry estimation
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP104T / BP109P Core Module</span>
        <h2 className="text-2xl font-bold mt-1 mb-2">Human Anatomy & Physiology Laboratory</h2>
        <p className="text-slate-400 text-sm">
          Clinical diagnostic analyzers for hemocytometry blood cell enumeration and hemoglobin evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-2">1. Hemocytometry WBC Enumeration</h3>
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
              <label className="block text-xs font-medium text-slate-400 mb-1">Dilution Factor</label>
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
          <h3 className="text-lg font-bold text-emerald-300 mb-2">2. Hemoglobin Diagnostic Analyzer</h3>
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
    </div>
  );
}
