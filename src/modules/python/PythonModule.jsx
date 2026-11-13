import React, { useState } from 'react';
import { Code, Play, BookOpen, Terminal, CheckCircle2, Sparkles, Sliders, Layers, BarChart3, Database, LineChart } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit1-2');
  const [selectedScript, setSelectedScript] = useState('pediatric');

  // Unit I & II State
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

  // Unit III State (NumPy QC)
  const [avgTabWeight, setAvgTabWeight] = useState(150);
  const [batchQuality, setBatchQuality] = useState('normal');

  // Unit IV State (Pandas ADR)
  const [severityFilter, setSeverityFilter] = useState('All');
  const [minAgeFilter, setMinAgeFilter] = useState(18);
  const [selectedDrugFilter, setSelectedDrugFilter] = useState('All');

  // Unit V State (Matplotlib PK)
  const [pkDose, setPkDose] = useState(500);
  const [pkVd, setPkVd] = useState(25);
  const [pkKe, setPkKe] = useState(0.15);
  const [pkRoute, setPkRoute] = useState('oral');
  const [pkPlotData, setPkPlotData] = useState(null);

  const [consoleOutput, setConsoleOutput] = useState([]);

  // Mock ADR Dataset for Unit IV
  const mockADRDatabase = [
    { id: 'ADR-101', drug: 'Paracetamol', age: 45, severity: 'Mild', reaction: 'Nausea' },
    { id: 'ADR-102', drug: 'Amlodipine', age: 68, severity: 'Severe', reaction: 'Peripheral Edema' },
    { id: 'ADR-103', drug: 'Metformin', age: 52, severity: 'Moderate', reaction: 'Gastric Distress' },
    { id: 'ADR-104', drug: 'Amlodipine', age: 71, severity: 'Severe', reaction: 'Hypotension' },
    { id: 'ADR-105', drug: 'Atorvastatin', age: 60, severity: 'Moderate', reaction: 'Myalgia' },
    { id: 'ADR-106', drug: 'Paracetamol', age: 22, severity: 'Mild', reaction: 'Rash' },
    { id: 'ADR-107', drug: 'Metformin', age: 65, severity: 'Severe', reaction: 'Lactic Acidosis' },
    { id: 'ADR-108', drug: 'Atorvastatin', age: 58, severity: 'Severe', reaction: 'Hepatic Enzyme Elevation' }
  ];

  // Code Previews
  const getPythonCode = () => {
    if (activeUnit === 'unit1-2') {
      if (selectedScript === 'pediatric') {
        return `# BP101T Unit II: Modular Pediatric Dosing Function
def calculate_pediatric_dose(rule, age_yrs, weight_kg, adult_mg):
    if rule == "youngs":
        return (age_yrs / (age_yrs + 12)) * adult_mg
    elif rule == "dillings":
        return (age_yrs / 20) * adult_mg
    elif rule == "clarks":
        return (weight_kg / 70) * adult_mg
    return 0

result = calculate_pediatric_dose("${dosingRule}", ${childAge}, ${childWeight}, ${adultDose})
print(f"Pediatric Dose: {round(result, 2)} mg")`;
      } else if (selectedScript === 'dilution') {
        return `# BP101T Unit II: Serial Dilution Generator
stock_conc = ${stockConc}
for tube in range(1, ${numTubes} + 1):
    stock_conc /= ${dilutionFactor}
    print(f"Tube #{tube}: {round(stock_conc, 4)} mg/mL")`;
      } else {
        return `# BP101T Unit II: Cockcroft-Gault Renal Triage
crcl = ((140 - ${patientAge}) * ${patientWeight}) / (72 * ${serumCreatinine})
${isFemale ? 'crcl *= 0.85' : '# Male patient'}
print(f"CrCl: {round(crcl, 2)} mL/min")`;
      }
    } else if (activeUnit === 'unit3') {
      return `# BP101T Unit III: NumPy Quality Control & Weight Variation
import numpy as np
weights = np.array([149.2, 150.5, 150.1, 149.8, 151.0, 149.5, 150.2, 150.0, 149.7, 150.3])
mean_w = np.mean(weights)
max_dev = np.max(np.abs(weights - mean_w) / mean_w) * 100
print(f"Mean: {mean_w:.2f} mg | Max Dev: {max_dev:.2f}%")
print("Status: PASS" if max_dev <= 7.5 else "Status: FAIL")`;
    } else if (activeUnit === 'unit4') {
      return `# BP101T Unit IV: Pandas ADR Dataset Management
import pandas as pd
df = pd.DataFrame(adr_data)
filtered = df[(df['Age'] >= ${minAgeFilter}) & (df['Severity'] == '${severityFilter}')]
print(filtered.to_string())`;
    } else {
      return `# BP101T Unit V: Matplotlib PK Curve
import numpy as np, matplotlib.pyplot as plt
time = np.linspace(0, 24, 100)
conc = (${pkDose} / ${pkVd}) * np.exp(-${pkKe} * time)
plt.plot(time, conc); plt.show()`;
    }
  };

  // Run Scripts
  const runPythonScript = () => {
    const timestamp = new Date().toLocaleTimeString();
    if (activeUnit === 'unit1-2') {
      if (selectedScript === 'pediatric') {
        const a = parseFloat(childAge) || 0;
        const w = parseFloat(childWeight) || 0;
        const d = parseFloat(adultDose) || 0;
        let res = dosingRule === 'youngs' ? (a / (a + 12)) * d : dosingRule === 'dillings' ? (a / 20) * d : (w / 70) * d;
        setConsoleOutput([
          `>>> Executing at ${timestamp}...`,
          `Rule: ${dosingRule.toUpperCase()} | Age: ${a} yrs | Weight: ${w} kg`,
          `Calculated Pediatric Dose: ${res.toFixed(2)} mg`,
          `>>> Exit code 0`
        ]);
      } else if (selectedScript === 'dilution') {
        let conc = parseFloat(stockConc) || 0;
        const lines = [`>>> Executing serial_dilution.py at ${timestamp}...`];
        for (let i = 1; i <= Math.min(numTubes, 12); i++) {
          conc /= dilutionFactor;
          lines.push(`Tube #${i}: Concentration = ${conc.toFixed(4)} mg/mL`);
        }
        lines.push(`>>> Exit code 0`);
        setConsoleOutput(lines);
      } else {
        const a = parseFloat(patientAge) || 0;
        const w = parseFloat(patientWeight) || 0;
        const scr = parseFloat(serumCreatinine) || 1;
        let crcl = ((140 - a) * w) / (72 * scr);
        if (isFemale) crcl *= 0.85;
        let action = crcl >= 60 ? 'Standard Dose' : crcl >= 30 ? 'Reduce Dose by 25-50%' : 'Contraindicated';
        setConsoleOutput([
          `>>> Executing renal_triage.py at ${timestamp}...`,
          `Calculated CrCl: ${crcl.toFixed(2)} mL/min`,
          `Clinical Recommendation: ${action}`,
          `>>> Exit code 0`
        ]);
      }
    } else if (activeUnit === 'unit3') {
      const weights = batchQuality === 'outlier' ? [148, 150, 152, 130, 175] : [149.2, 150.5, 150.1, 149.8, 151.0];
      const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
      const maxDev = Math.max(...weights.map(w => Math.abs(w - mean) / mean * 100));
      const passed = maxDev <= 7.5;
      setConsoleOutput([
        `>>> Executing numpy_qc.py at ${timestamp}...`,
        `Mean Weight: ${mean.toFixed(2)} mg`,
        `Max % Deviation: ${maxDev.toFixed(2)}%`,
        passed ? `QC Status: PASS (Within ±7.5% IP Limit)` : `QC Status: FAIL (Exceeds IP Limit)`,
        `>>> Exit code 0`
      ]);
    } else if (activeUnit === 'unit4') {
      const filtered = mockADRDatabase.filter(r => {
        if (r.age < minAgeFilter) return false;
        if (severityFilter !== 'All' && r.severity !== severityFilter) return false;
        if (selectedDrugFilter !== 'All' && r.drug !== selectedDrugFilter) return false;
        return true;
      });
      const lines = [
        `>>> Executing pandas_adr.py at ${timestamp}...`,
        `Total Matches: ${filtered.length}`,
        `----------------------------------------`
      ];
      filtered.forEach(r => lines.push(`${r.id} | ${r.drug} | Age ${r.age} | ${r.severity} | ${r.reaction}`));
      lines.push(`>>> Exit code 0`);
      setConsoleOutput(lines);
    } else {
      const dose = parseFloat(pkDose) || 500;
      const vd = parseFloat(pkVd) || 25;
      const ke = parseFloat(pkKe) || 0.15;
      const points = [];
      let maxC = 0, tMax = 0;
      for (let t = 0; t <= 24; t += 1.5) {
        let c = pkRoute === 'iv' ? (dose / vd) * Math.exp(-ke * t) : (dose / vd) * (1.2 / (1.2 - ke)) * (Math.exp(-ke * t) - Math.exp(-1.2 * t));
        if (c > maxC) { maxC = c; tMax = t; }
        points.push({ t, c: Math.max(0, c) });
      }
      setPkPlotData({ points, maxConc: maxC.toFixed(2), tMax: tMax.toFixed(1) });
      setConsoleOutput([
        `>>> Executing matplotlib_pk.py at ${timestamp}...`,
        `Route: ${pkRoute.toUpperCase()} | Dose: ${dose} mg | Vd: ${vd} L`,
        `Cmax: ${maxC.toFixed(2)} mg/L at Tmax: ${tMax.toFixed(1)}h`,
        `Figure saved successfully.`,
        `>>> Exit code 0`
      ]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">PCI B.Pharm • BP101T</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Basics of Python Programming for Pharmaceutical Sciences</h2>
        <p className="text-slate-400 text-sm mt-1">Interactive 5-Unit curriculum studio from fundamentals to pharmaceutical data science.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'unit1-2', label: 'Unit I & II: Syntax & Functions' },
          { id: 'unit3', label: 'Unit III: NumPy & QC' },
          { id: 'unit4', label: 'Unit IV: Pandas & ADR' },
          { id: 'unit5', label: 'Unit V: Matplotlib PK Curves' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveUnit(tab.id); setConsoleOutput([]); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              activeUnit === tab.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACTIVE UNIT CONTENT CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <Code className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                {activeUnit === 'unit1-2' && 'Unit I & II: Pharmaceutical Scripting Playground'}
                {activeUnit === 'unit3' && 'Unit III: NumPy Tablet Weight Variation QC'}
                {activeUnit === 'unit4' && 'Unit IV: Pandas ADR Clinical Dataset Filter'}
                {activeUnit === 'unit5' && 'Unit V: Matplotlib PK Concentration-Time Curves'}
              </h3>
              <p className="text-xs text-slate-400">Modify parameters and execute python script logic live.</p>
            </div>
          </div>

          {activeUnit === 'unit1-2' && (
            <div className="flex gap-2">
              {[
                { id: 'pediatric', label: 'Pediatric Dosing' },
                { id: 'dilution', label: 'Serial Dilutions' },
                { id: 'renal', label: 'Renal CrCl' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScript(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${selectedScript === s.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Split Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Input Parameters</span>
            </div>

            {activeUnit === 'unit1-2' && selectedScript === 'pediatric' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Dosing Rule</label>
                  <select value={dosingRule} onChange={e => setDosingRule(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="youngs">Young&apos;s Rule (1–12 yrs)</option>
                    <option value="dillings">Dilling&apos;s Rule (4–20 yrs)</option>
                    <option value="clarks">Clark&apos;s Rule (Weight-based)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Child Age (yrs)</label>
                  <input type="number" value={childAge} onChange={e => setChildAge(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Child Weight (kg)</label>
                  <input type="number" value={childWeight} onChange={e => setChildWeight(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Adult Dose (mg)</label>
                  <input type="number" value={adultDose} onChange={e => setAdultDose(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>
            )}

            {activeUnit === 'unit1-2' && selectedScript === 'dilution' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stock Conc (mg/mL)</label>
                  <input type="number" value={stockConc} onChange={e => setStockConc(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Dilution Factor</label>
                  <input type="number" value={dilutionFactor} onChange={e => setDilutionFactor(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Number of Tubes</label>
                  <input type="number" min="1" max="12" value={numTubes} onChange={e => setNumTubes(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>
            )}

            {activeUnit === 'unit1-2' && selectedScript === 'renal' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Patient Age</label>
                  <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                  <input type="number" value={patientWeight} onChange={e => setPatientWeight(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Serum Creatinine (mg/dL)</label>
                  <input type="number" step="0.1" value={serumCreatinine} onChange={e => setSerumCreatinine(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input type="checkbox" checked={isFemale} onChange={e => setIsFemale(e.target.checked)} className="rounded bg-slate-900 text-emerald-500" />
                  <span className="text-xs text-slate-300">Female (&times;0.85 factor)</span>
                </div>
              </div>
            )}

            {activeUnit === 'unit3' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Batch Scenario</label>
                  <select value={batchQuality} onChange={e => setBatchQuality(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="normal">Standard Compliant Batch</option>
                    <option value="outlier">Batch with Outliers (Fail)</option>
                  </select>
                </div>
              </div>
            )}

            {activeUnit === 'unit4' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Severity Filter</label>
                  <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="All">All Severities</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Minimum Age</label>
                  <input type="number" value={minAgeFilter} onChange={e => setMinAgeFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Drug Filter</label>
                  <select value={selectedDrugFilter} onChange={e => setSelectedDrugFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="All">All Drugs</option>
                    <option value="Paracetamol">Paracetamol</option>
                    <option value="Amlodipine">Amlodipine</option>
                    <option value="Metformin">Metformin</option>
                    <option value="Atorvastatin">Atorvastatin</option>
                  </select>
                </div>
              </div>
            )}

            {activeUnit === 'unit5' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Route</label>
                  <select value={pkRoute} onChange={e => setPkRoute(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="oral">Oral Administration</option>
                    <option value="iv">Intravenous (IV) Bolus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Dose (mg)</label>
                  <input type="number" value={pkDose} onChange={e => setPkDose(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Volume of Distribution (Vd L)</label>
                  <input type="number" value={pkVd} onChange={e => setPkVd(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Elimination Constant (ke hr⁻¹)</label>
                  <input type="number" step="0.01" value={pkKe} onChange={e => setPkKe(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>
            )}

            <button
              onClick={runPythonScript}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-950"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Python Script</span>
            </button>
          </div>

          {/* Code & Terminal */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">script.py</span>
                <span className="text-[11px] text-blue-400 font-medium">Python 3.11 Studio</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {getPythonCode()}
              </pre>
            </div>

            {activeUnit === 'unit5' && pkPlotData && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Matplotlib Figure Render</span>
                  <span className="text-emerald-400">Cmax: {pkPlotData.maxConc} mg/L at {pkPlotData.tMax}h</span>
                </div>
                <div className="h-36 bg-slate-900 rounded-lg p-3 flex items-end justify-between gap-1 border border-slate-800">
                  {pkPlotData.points.map((pt, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div style={{ height: `${Math.min(100, (pt.c / parseFloat(pkPlotData.maxConc)) * 100)}%` }} className="w-full bg-emerald-500 rounded-t" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal */}
            <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center space-x-2 text-slate-500 mb-2 pb-1.5 border-b border-slate-900">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Console Output</span>
              </div>
              {consoleOutput.length > 0 ? (
                <div className="space-y-1 text-emerald-400">
                  {consoleOutput.map((line, i) => (
                    <div key={i} className={line.includes('FAIL') ? 'text-rose-400 font-bold' : line.startsWith('>>>') ? 'text-slate-500' : 'text-emerald-300'}>
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 italic">Click &ldquo;Run Python Script&rdquo; above...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
