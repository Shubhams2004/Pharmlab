import React, { useState } from 'react';

export default function AnatomyModule() {
  // State for Hemocytometry WBC Calculation
  // Formula: Total WBC = (Counted Cells * Dilution Factor * Depth) / (Area Counted)
  const [cellsCounted, setCellsCounted] = useState('');
  const [wbcResult, setWbcResult] = useState(null);

  // State for Hemoglobin Interpretation
  const [hbValue, setHbValue] = useState('');
  const [gender, setGender] = useState('male');
  const [hbStatus, setHbStatus] = useState(null);

  const calculateWBC = (e) => {
    e.preventDefault();
    const count = parseFloat(cellsCounted);
    if (count > 0) {
      // Standard Neubauer chamber calculation: Count * 20 (dilution) * 10 (depth factor) / 4 (squares) -> count * 50
      const totalWBC = count * 50;
      setWbcResult(totalWBC.toLocaleString());
    }
  };

  const evaluateHb = (e) => {
    e.preventDefault();
    const hb = parseFloat(hbValue);
    if (hb > 0) {
      if (gender === 'male') {
        if (hb < 13.0) setHbStatus({ status: 'Low (Indicative of Anemia)', color: 'text-rose-400' });
        else if (hb > 17.5) setHbStatus({ status: 'High (Polycythemia)', color: 'text-amber-400' });
        else setHbStatus({ status: 'Normal Range (13.0 - 17.5 g/dL)', color: 'text-emerald-400' });
      } else {
        if (hb < 12.0) setHbStatus({ status: 'Low (Indicative of Anemia)', color: 'text-rose-400' });
        else if (hb > 15.5) setHbStatus({ status: 'High (Polycythemia)', color: 'text-amber-400' });
        else setHbStatus({ status: 'Normal Range (12.0 - 15.5 g/dL)', color: 'text-emerald-400' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-rose-400 uppercase">BP104T / BP109P Core Module</span>
        <h2 className="text-2xl font-bold mt-1 mb-2">Human Anatomy, Physiology & Pathology Lab</h2>
        <p className="text-slate-400 text-sm">
          Digital simulation tools for hemocytometry calculations, blood cell enumerations, and clinical parameter interpretations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hemocytometry WBC Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-rose-300 mb-4">1. Hemocytometry: WBC Enumeration</h3>
          <p className="text-xs text-slate-400 mb-4">
            Calculate total leukocyte count per cubic millimeter using standard Neubauer chamber dilution factors.
          </p>
          <form onSubmit={calculateWBC} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Total Cells Counted in 4 Corner Squares</label>
              <input
                type="number"
                value={cellsCounted}
                onChange={(e) => setCellsCounted(e.target.value)}
                placeholder="e.g., 160"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors">
              Calculate Total WBC
            </button>
          </form>
          {wbcResult && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-rose-900/50 text-center">
              <span className="text-sm text-slate-400">Estimated Total WBC: </span>
              <span className="text-xl font-bold text-rose-400">{wbcResult} cells/cu.mm</span>
              <p className="text-xs text-slate-500 mt-1">Normal Reference: 4,000 - 11,000 cells/cu.mm</p>
            </div>
          )}
        </div>

        {/* Hemoglobin Estimation & Interpretation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-rose-300 mb-4">2. Hemoglobin (Hb) Interpretation</h3>
          <p className="text-xs text-slate-400 mb-4">
            Evaluate clinical hemoglobin levels against standard pathological thresholds for anemia diagnostics[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span).
          </p>
          <form onSubmit={evaluateHb} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Measured Hemoglobin (g/dL)</label>
              <input
                type="number"
                step="any"
                value={hbValue}
                onChange={(e) => setHbValue(e.target.value)}
                placeholder="e.g., 11.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Patient Demographic</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="male">Male Adult</option>
                <option value="female">Female Adult</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors">
              Evaluate Clinical Status
            </button>
          </form>
          {hbStatus && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-rose-900/50 text-center">
              <span className="text-sm text-slate-400">Diagnostic Finding: </span>
              <p className={`text-lg font-bold mt-1 ${hbStatus.color}`}>{hbStatus.status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
