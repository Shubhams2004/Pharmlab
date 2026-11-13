import React, { useState } from 'react';
import { Code, Play, BookOpen, Terminal, CheckCircle2, Sparkles, Sliders, Layers, BarChart3, Database, LineChart } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit5');

  // State variables for previous units...
  const [childAge, setChildAge] = useState(6);
  const [childWeight, setChildWeight] = useState(20);
  const [adultDose, setAdultDose] = useState(500);
  const [dosingRule, setDosingRule] = useState('youngs');
  const [stockConc, setStockConc] = useState(100);
  const [dilutionFactor, setDilutionFactor] = useState(2);
  const [numTubes, setNumTubes] = useState(5);
  const [patientAge, setPatientAge] = useState(65);
  const [patientWeight, setPatientWeight] = useState(70);
  const [serumCreatinine, setSerumCreatinine] = useState(1.8);
  const [isFemale, setIsFemale] = useState(false);
  const [avgTabWeight, setAvgTabWeight] = useState(150);
  const [batchQuality, setBatchQuality] = useState('normal');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [minAgeFilter, setMinAgeFilter] = useState(18);
  const [selectedDrugFilter, setSelectedDrugFilter] = useState('All');

  // Unit V State (Matplotlib PK Curves)
  const [pkDose, setPkDose] = useState(500); // mg
  const [pkVd, setPkVd] = useState(25); // L (Volume of distribution)
  const [pkKe, setPkKe] = useState(0.15); // hr^-1 (Elimination rate constant)
  const [pkRoute, setPkRoute] = useState('oral'); // oral vs iv
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [pkPlotData, setPkPlotData] = useState(null);

  // Syntax & Concept Cards for Unit V
  const matplotlibSyntaxCards = [
    {
      unit: 'Unit V',
      title: 'Basic Line Plots & Axes',
      code: `import matplotlib.pyplot as plt

# Plot time vs plasma concentration
plt.plot(time_hrs, conc_mgL, color='b', label='Oral Dose')
plt.xlabel('Time (Hours)')
plt.ylabel('Plasma Concentration (mg/L)')`,
      note: 'Essential for visualizing drug absorption, distribution, metabolism, and excretion (ADME) profiles.'
    },
    {
      unit: 'Unit V',
      title: 'Customizing Grids & Legends',
      code: `plt.title('Plasma Concentration vs Time Curve')
plt.legend(loc='upper right')
plt.grid(True, linestyle='--', alpha=0.6)
plt.axhline(y=10.0, color='r', linestyle=':', label='MTC')`,
      note: 'Adding Minimum Toxic Concentration (MTC) and Minimum Effective Concentration (MEC) threshold lines.'
    },
    {
      unit: 'Unit V',
      title: 'Multiple Subplots for Comparison',
      code: `fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.plot(t, oral_conc)
ax2.plot(t, iv_conc)`,
      note: 'Allows side-by-side comparison of different administration routes or patient clearance rates.'
    },
    {
      unit: 'Unit V',
      title: 'Saving Publication-Quality Figures',
      code: `# Save high-res plot for reports
plt.savefig('pharmacokinetics_curve.png', dpi=300, bbox_inches='tight')
plt.show()`,
      note: 'Exports clean vector or rasterized graphics for laboratory research notebooks and project presentations.'
    }
  ];

  // Generate Python Code Preview for Unit V
  const getPythonCode = () => {
    return `# BP101T Unit V: Pharmacokinetic Curve with Matplotlib
import numpy as np
import matplotlib.pyplot as plt

# PK Parameters
dose = ${pkDose}       # mg
vd = ${pkVd}          # L (Volume of Distribution)
ke = ${pkKe}          # hr^-1 (Elimination rate)
route = "${pkRoute}"

# Time vector from 0 to 24 hours
time = np.linspace(0, 24, 100)

if route == 'iv':
    # IV Bolus: C(t) = (Dose / Vd) * exp(-ke * t)
    conc = (dose / vd) * np.exp(-ke * time)
else:
    # Oral Absorption (One-compartment): ka = 1.2
    ka = 1.2
    conc = (dose / vd) * (ka / (ka - ke)) * (np.exp(-ke * time) - np.exp(-ka * time))

# Matplotlib plotting commands
plt.figure(figsize=(8, 4))
plt.plot(time, conc, color='emerald', linewidth=2.5, label=f'{route.upper()} Administration')
plt.title('Plasma Concentration - Time Curve (BP101T PK Model)')
plt.xlabel('Time (Hours)')
plt.ylabel('Plasma Concentration (mg/L)')
plt.grid(True, linestyle='--', alpha=0.5)
plt.legend()
plt.savefig('pk_curve.png', dpi=300)
plt.show()`;
  };

  // Run PK Simulation & Generate Curve Data
  const runPythonScript = () => {
    const timestamp = new Date().toLocaleTimeString();
    const dose = parseFloat(pkDose) || 500;
    const vd = parseFloat(pkVd) || 25;
    const ke = parseFloat(pkKe) || 0.15;

    const points = [];
    let maxConc = 0;
    let tMax = 0;

    for (let t = 0; t <= 24; t += 1.5) {
      let c = 0;
      if (pkRoute === 'iv') {
        c = (dose / vd) * Math.exp(-ke * t);
      } else {
        const ka = 1.2;
        c = (dose / vd) * (ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
      }
      if (c > maxConc) {
        maxConc = c;
        tMax = t;
      }
      points.push({ t, c: Math.max(0, c) });
    }

    setPkPlotData({ points, maxConc: maxConc.toFixed(2), tMax: tMax.toFixed(1) });

    setConsoleOutput([
      `>>> Executing matplotlib_pk_curve.py at ${timestamp}...`,
      `Importing numpy as np ... [OK]`,
      `Importing matplotlib.pyplot as plt ... [OK]`,
      `Route: ${pkRoute.toUpperCase()} | Dose: ${dose} mg | Vd: ${vd} L | ke: ${ke} hr^-1`,
      `Peak Plasma Concentration (Cmax) : ${maxConc.toFixed(2)} mg/L`,
      `Time of Peak Concentration (Tmax): ${tMax.toFixed(1)} hours`,
      `Figure successfully rendered and saved to 'pk_curve.png' (300 DPI).`,
      `>>> Process finished with exit code 0`
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
              PCI B.Pharm Syllabus • BP101T
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">
              Basics of Python Programming for Pharmaceutical Sciences
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Interactive 5-unit coding laboratory transitioning from fundamental Python syntax to pharmaceutical data science.
            </p>
          </div>
          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-300 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4" />
            <span>NEP 2020 Compliant</span>
          </div>
        </div>
      </div>

      {/* 5-Unit PCI Syllabus Navigation Bar */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'unit1-2', label: 'Unit I & II: Syntax & Functions' },
          { id: 'unit3', label: 'Unit III: NumPy & QC' },
          { id: 'unit4', label: 'Unit IV: Pandas & ADR' },
          { id: 'unit5', label: 'Unit V: Matplotlib PK Curves' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveUnit(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              activeUnit === tab.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-950/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* UNIT V CONTENT */}
      {activeUnit === 'unit5' ? (
        <div className="space-y-8">
          {/* Section 1: Matplotlib Syntax Reference Cards */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                Unit V: Matplotlib Data Visualization Reference
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matplotlibSyntaxCards.map((card, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                        {card.unit}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">{card.title}</span>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed my-2">
                      {card.code}
                    </pre>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-start space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{card.note}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Interactive Matplotlib PK Curve Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <LineChart className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Pharmacokinetic Concentration-Time Curve Generator</h3>
                  <p className="text-xs text-slate-400">
                    Simulate drug absorption and elimination kinetics using NumPy calculations rendered via Matplotlib script logic.
                  </p>
                </div>
              </div>
            </div>

            {/* Split-Pane Studio */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Pane: Variables */}
              <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>PK Model Parameters</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Administration Route (`route`)</label>
                    <select
                      value={pkRoute}
                      onChange={(e) => setPkRoute(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="oral">Oral Administration (Absorption Phase)</option>
                      <option value="iv">Intravenous (IV) Bolus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Administered Dose (`dose` mg)</label>
                    <input
                      type="number"
                      value={pkDose}
                      onChange={(e) => setPkDose(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Volume of Distribution (`Vd` L)</label>
                    <input
                      type="number"
                      value={pkVd}
                      onChange={(e) => setPkVd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Elimination Rate Constant (`ke` hr⁻¹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pkKe}
                      onChange={(e) => setPkKe(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={runPythonScript}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-950"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Matplotlib Script</span>
                </button>
              </div>

              {/* Right Pane: Code + Terminal + Visual Plot Preview */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">matplotlib_pk_curve.py</span>
                    <span className="text-[11px] text-blue-400 font-medium">Matplotlib ADME Visualization</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    {getPythonCode()}
                  </pre>
                </div>

                {/* Simulated Curve Visualization Box */}
                {pkPlotData && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>Matplotlib Figure Render (pk_curve.png)</span>
                      <span className="text-emerald-400">Cmax: {pkPlotData.maxConc} mg/L at Tmax: {pkPlotData.tMax}h</span>
                    </div>
                    <div className="h-40 bg-slate-900 rounded-lg p-3 flex items-end justify-between gap-1 border border-slate-800">
                      {pkPlotData.points.map((pt, idx) => {
                        const heightPct = Math.min(100, (pt.c / parseFloat(pkPlotData.maxConc)) * 100);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            <div
                              style={{ height: `${Math.max(4, heightPct)}%` }}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all"
                            />
                            {idx % 4 === 0 && (
                              <span className="text-[9px] text-slate-500 mt-1">{pt.t}h</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Console Output */}
                <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-slate-500 mb-2 pb-1.5 border-b border-slate-900">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Interactive Console Output</span>
                  </div>
                  {consoleOutput.length > 0 ? (
                    <div className="space-y-1 text-emerald-400">
                      {consoleOutput.map((line, i) => (
                        <div key={i} className={line.startsWith('>>>') ? 'text-slate-500' : 'text-emerald-300'}>
                          {line || ' '}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 italic">
                      Click &ldquo;Run Matplotlib Script&rdquo; to generate the pharmacokinetic curve...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Layers className="w-10 h-10 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Unit V: Matplotlib Pharmacokinetic Curves</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Switch to Unit V tab above to explore Matplotlib visualization and pharmacokinetic curves.
          </p>
          <button
            onClick={() => setActiveUnit('unit5')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Go to Unit V Studio
          </button>
        </div>
      )}
    </div>
  );
}
