import React, { useState, useEffect } from 'react';
import { Code, Play, Terminal, RefreshCw, BarChart3, Calculator, Activity } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit1-2');

  // Pyodide Runtime State
  const [pyodide, setPyodide] = useState(null);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(true);
  const [runtimeStatus, setRuntimeStatus] = useState('Initializing Python 3.11 WebAssembly...');

  // Interactive Unit V Matplotlib-style Plotter State
  const [plotType, setPlotType] = useState('pk_curve');
  const [oralDose, setOralDose] = useState(500);
  const [kaRate, setKaRate] = useState(1.1);
  const [keRate, setKeRate] = useState(0.18);

  // Interactive Unit II BMI & Dosage State
  const [bmiWeight, setBmiWeight] = useState(68);
  const [bmiHeightCm, setBmiHeightCm] = useState(172);
  const [childAge, setChildAge] = useState(6);
  const [adultDoseMg, setAdultDoseMg] = useState(500);

  // Editable Code States for Each Unit
  const [codeUnit12, setCodeUnit12] = useState(`# BP101T Unit I & II: Modular Dosage & BMI Calculation (Control Structures & Functions)
def calculate_bmi(weight_kg, height_cm):
    height_m = height_cm / 100.0
    bmi = weight_kg / (height_m ** 2)
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal weight"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"
    return round(bmi, 2), category

def calculate_pediatric_dose(age_yrs, adult_mg):
    # Young's Rule for Children (1-12 years)
    dose = (age_yrs / (age_yrs + 12)) * adult_mg
    return round(dose, 2)

bmi_val, bmi_cat = calculate_bmi(68, 172)
print(f"Patient BMI: {bmi_val} kg/m^2 ({bmi_cat})")
print("Calculated Pediatric Dose (Young's Rule):", calculate_pediatric_dose(6, 500), "mg")

# Loop with break/continue: Half-life elimination tracking
conc = 100.0
for hr in range(1, 20):
    conc *= 0.75
    if conc < 10.0:
        print(f"Hour {hr}: Concentration {conc:.2f} mg/L below therapeutic threshold -> Stop")
        break
    print(f"Hour {hr}: Plasma Conc = {conc:.2f} mg/L")`);

  const [codeUnit3, setCodeUnit3] = useState(`# BP101T Unit III: Data Structures, CSV Parsing & NumPy QC
import numpy as np
import csv, io

# 1. Lists, Tuples, Dictionaries for Crude & Finished Drugs
drug_inventory = [
    {"name": "Paracetamol", "strength_mg": 500, "batch": "B101"},
    {"name": "Amoxicillin", "strength_mg": 250, "batch": "B102"},
    {"name": "Metformin", "strength_mg": 500, "batch": "B103"}
]
print("Drug Dictionary Lookup:", [d["name"].upper() for d in drug_inventory])

# 2. Reading & Writing CSV Healthcare Dataset
csv_buffer = io.StringIO()
writer = csv.writer(csv_buffer)
writer.writerow(["Batch", "Weight_mg"])
for i, w in enumerate([149.2, 150.5, 150.1, 149.8, 151.0, 149.5, 150.2, 150.0, 149.7, 150.3], 1):
    writer.writerow([f"T-{i:02d}", w])

# 3. NumPy Tablet Weight Variation QC (IP Limit: +/- 7.5%)
weights = np.array([149.2, 150.5, 150.1, 149.8, 151.0, 149.5, 150.2, 150.0, 149.7, 150.3])
mean_w = np.mean(weights)
max_dev = np.max(np.abs(weights - mean_w) / mean_w) * 100
print(f"Batch Mean Weight: {mean_w:.2f} mg | Max Deviation: {max_dev:.2f}%")
print("Quality Control Status: PASS" if max_dev <= 7.5 else "Quality Control Status: FAIL")`);

  const [codeUnit4, setCodeUnit4] = useState(`# BP101T Unit IV: Pandas PK & ADR Clinical Dataset Management
import pandas as pd

adr_data = {
    'ID': ['ADR-101', 'ADR-102', 'ADR-103', 'ADR-104', 'ADR-105'],
    'Drug': ['Paracetamol', 'Amlodipine', 'Metformin', 'Amlodipine', 'Ibuprofen'],
    'Age': [45, 68, 52, 71, 64],
    'Severity': ['Mild', 'Severe', 'Moderate', 'Severe', 'Severe'],
    'Reaction': ['Nausea', 'Edema', 'Gastric Distress', 'Hypotension', 'GI Bleed']
}

df = pd.DataFrame(adr_data)
print("=== df.head(3) ===")
print(df.head(3).to_string(index=False))
print("\\n=== df.describe() ===")
print(df.describe().round(2))
print("\\n=== Grouped by Drug (Count) ===")
print(df.groupby('Drug')['ID'].count())`);

  const [codeUnit5, setCodeUnit5] = useState(`# BP101T Unit V: Matplotlib Pharmaceutical Data Profiles (Oral vs IV & Dissolution)
import numpy as np

time_hrs = np.array([0, 0.5, 1, 2, 4, 6, 8, 12])
dose, vd, ke, ka = 500.0, 25.0, 0.18, 1.1

# IV Bolus: C(t) = (Dose/Vd) * exp(-ke * t)
conc_iv = (dose / vd) * np.exp(-ke * time_hrs)

# Oral One-Compartment: C(t) = (Dose*ka / (Vd*(ka-ke))) * (exp(-ke*t) - exp(-ka*t))
conc_oral = (dose * ka / (vd * (ka - ke))) * (np.exp(-ke * time_hrs) - np.exp(-ka * time_hrs))

print("Time(h) | IV Conc (mg/L) | Oral Conc (mg/L)")
for t, c_iv, c_or in zip(time_hrs, conc_iv, conc_oral):
    print(f"{t:6.1f}  | {c_iv:14.2f} | {max(0, c_or):16.2f}")`);

  const [codePractical5, setCodePractical5] = useState(`# BP101T Practical 5: Accelerated Stability & Arrhenius Shelf-Life
import numpy as np

temps_c = np.array([40.0, 50.0, 60.0])
temps_k = temps_c + 273.15
inv_temp = 1.0 / temps_k
k_vals = np.array([0.00012, 0.00045, 0.00150])
log_k = np.log(k_vals)

slope, intercept = np.polyfit(inv_temp, log_k, 1)
R = 1.987
Ea_kcal = (-slope * R * 2.303 * 1000) / 1000.0

room_k = np.exp(slope * (1.0 / (25.0 + 273.15)) + intercept)
t90_years = (0.1053 / room_k) / 365.25

print(f"Activation Energy (Ea): {Ea_kcal:.2f} kcal/mol")
print(f"Shelf-Life at 25°C (t90): {t90_years:.2f} years")`);

  const [codeSandbox, setCodeSandbox] = useState(`# Custom Python Sandbox
import numpy as np
print("NumPy version:", np.__version__)
arr = np.linspace(0, 10, 5)
print("Generated Array:", arr)`);

  const [consoleOutput, setConsoleOutput] = useState([
    '>>> PharmLab WebAssembly Python 3.11 Environment Loading...'
  ]);

  useEffect(() => {
    let isMounted = true;
    async function loadPyodideEnvironment() {
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }
        const pyInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        await pyInstance.loadPackage(["numpy", "pandas"]);
        if (isMounted) {
          setPyodide(pyInstance);
          setIsLoadingPyodide(false);
          setRuntimeStatus('Python 3.11 + NumPy + Pandas Ready.');
          setConsoleOutput([
            '>>> Python 3.11 WebAssembly Runtime Initialized Successfully.',
            '>>> Select any unit tab, edit code freely, and click "Run in Browser".'
          ]);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoadingPyodide(false);
          setRuntimeStatus('Failed to load Python runtime.');
          setConsoleOutput([
            '>>> Runtime Error:',
            `> ${err.message}`
          ]);
        }
      }
    }
    loadPyodideEnvironment();
    return () => { isMounted = false; };
  }, []);

  const executeCode = async (codeToRun) => {
    if (!pyodide) {
      setConsoleOutput(['>>> Python runtime is still initializing. Please wait a moment and try again.']);
      return;
    }

    setConsoleOutput([`>>> Executing script in browser...`, `----------------------------------------`]);

    try {
      pyodide.runPython(`
        import sys
        import io
        sys.stdout = io.StringIO()
      `);

      await pyodide.runPythonAsync(codeToRun);

      const stdout = pyodide.runPython("sys.stdout.getvalue()");

      setConsoleOutput([
        `>>> Execution Successful:`,
        `----------------------------------------`,
        stdout || '[Code executed with no stdout output]'
      ]);
    } catch (err) {
      setConsoleOutput([
        `>>> Python Execution Error:`,
        `----------------------------------------`,
        err.toString()
      ]);
    }
  };

  const getCurrentCode = () => {
    if (activeUnit === 'unit1-2') return codeUnit12;
    if (activeUnit === 'unit3') return codeUnit3;
    if (activeUnit === 'unit4') return codeUnit4;
    if (activeUnit === 'unit5') return codeUnit5;
    if (activeUnit === 'practical5') return codePractical5;
    return codeSandbox;
  };

  const setCurrentCode = (val) => {
    if (activeUnit === 'unit1-2') setCodeUnit12(val);
    else if (activeUnit === 'unit3') setCodeUnit3(val);
    else if (activeUnit === 'unit4') setCodeUnit4(val);
    else if (activeUnit === 'unit5') setCodeUnit5(val);
    else if (activeUnit === 'practical5') setCodePractical5(val);
    else setCodeSandbox(val);
  };

  // Unit II Live Calculator Values
  const bmiVal = bmiHeightCm > 0 ? bmiWeight / Math.pow(bmiHeightCm / 100, 2) : 0;
  const bmiCategory = bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese';
  const youngsDose = (childAge / (childAge + 12)) * adultDoseMg;
  const dillingDose = (childAge / 20) * adultDoseMg;

  // Unit V SVG Plot Data
  const pkTimes = [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 10, 12];
  const vd = 25;
  const safeKa = Math.abs(kaRate - keRate) < 0.05 ? keRate + 0.2 : kaRate;
  const pkPoints = pkTimes.map((t) => {
    const cIv = (oralDose / vd) * Math.exp(-keRate * t);
    const cOral = Math.max(0, ((oralDose * safeKa) / (vd * (safeKa - keRate))) * (Math.exp(-keRate * t) - Math.exp(-safeKa * t)));
    return { t, cIv, cOral };
  });
  const maxConc = Math.max(25, ...pkPoints.map((p) => Math.max(p.cIv, p.cOral)));

  const adrPlotData = [
    { drug: 'Paracetamol', rate: 12, color: '#10b981' },
    { drug: 'Amoxicillin', rate: 28, color: '#3b82f6' },
    { drug: 'Ibuprofen', rate: 41, color: '#f59e0b' },
    { drug: 'Metformin', rate: 19, color: '#a855f7' },
    { drug: 'Aspirin', rate: 34, color: '#ec4899' }
  ];

  const dissolutionData = [
    { t: 0, ir: 0, sr: 0 },
    { t: 15, ir: 52, sr: 18 },
    { t: 30, ir: 81, sr: 32 },
    { t: 45, ir: 94, sr: 48 },
    { t: 60, ir: 98, sr: 61 },
    { t: 90, ir: 99, sr: 79 },
    { t: 120, ir: 100, sr: 91 }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">PCI B.Pharm · BP101T</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 dark:text-white">Basics of Python Programming for Pharmaceutical Sciences</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">Interactive curriculum studio with live WebAssembly Python execution across all 5 syllabus units.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'unit1-2', label: 'Unit I & II: Syntax, BMI & Dosage' },
          { id: 'unit3', label: 'Unit III: Data Structures, CSV & NumPy' },
          { id: 'unit4', label: 'Unit IV: Pandas ADR & PK' },
          { id: 'unit5', label: 'Unit V: Matplotlib Pharma Plots' },
          { id: 'practical5', label: 'Practical 5: Arrhenius Shelf-Life' },
          { id: 'sandbox', label: 'Custom Python Sandbox' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveUnit(tab.id); setConsoleOutput([`>>> Switched to ${tab.label}. Click "Run in Browser".`]); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              activeUnit === tab.id
                ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm dark:shadow-lg'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Unit II Interactive BMI & Dosage Verification Tool */}
      {activeUnit === 'unit1-2' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <Calculator className="w-5 h-5" />
            <h3 className="text-base font-bold">Unit II Interactive Lab: Dosage & BMI Calculator</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">BMI Classification Logic (if-elif-else)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Weight (kg)</label>
                  <input type="number" value={bmiWeight} onChange={(e) => setBmiWeight(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Height (cm)</label>
                  <input type="number" value={bmiHeightCm} onChange={(e) => setBmiHeightCm(parseFloat(e.target.value) || 1)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                <span className="text-slate-600 dark:text-slate-400">Computed BMI: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{bmiVal.toFixed(2)} kg/m²</strong></span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold text-xs">{bmiCategory}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Modular Pediatric Dosage Rules</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Child Age (yrs)</label>
                  <input type="number" value={childAge} onChange={(e) => setChildAge(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Adult Dose (mg)</label>
                  <input type="number" value={adultDoseMg} onChange={(e) => setAdultDoseMg(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                <span className="text-slate-600 dark:text-slate-400">Young's Rule: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{youngsDose.toFixed(1)} mg</strong></span>
                <span className="text-slate-600 dark:text-slate-400">Dilling's Rule: <strong className="text-blue-600 dark:text-blue-400 tabular-nums">{dillingDose.toFixed(1)} mg</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unit V Interactive Matplotlib-style Pharmaceutical Plotter */}
      {activeUnit === 'unit5' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-5 h-5" />
              <div>
                <h3 className="text-base font-bold">Unit V: Pharmaceutical Data Visualization Lab (Matplotlib Studio)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Concentration-time curves (Oral vs IV), ADR reporting rates, dissolution profiles &amp; scientific interpretation.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'pk_curve', label: 'Line Plot: Oral vs IV PK Curve' },
                { id: 'adr_bar', label: 'Histogram/Bar: ADR Rates' },
                { id: 'dissolution', label: 'Scatter/Line: Dissolution Profile' },
                { id: 'boxplot', label: 'Box Plot: Batch Assay Spread' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlotType(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    plotType === p.id ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {plotType === 'pk_curve' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                    <span>Dose (mg)</span>
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{oralDose} mg</span>
                  </div>
                  <input type="range" min="100" max="1000" step="50" value={oralDose} onChange={(e) => setOralDose(Number(e.target.value))} className="w-full accent-emerald-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                    <span>Absorption Rate (ka /hr)</span>
                    <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">{kaRate.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.4" max="2.5" step="0.1" value={kaRate} onChange={(e) => setKaRate(Number(e.target.value))} className="w-full accent-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                    <span>Elimination Rate (ke /hr)</span>
                    <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{keRate.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.05" max="0.45" step="0.01" value={keRate} onChange={(e) => setKeRate(Number(e.target.value))} className="w-full accent-amber-500" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">Scientific Interpretation:</p>
                  <p className="leading-relaxed">IV Bolus exhibits immediate peak concentration (C₀ = {(oralDose / vd).toFixed(1)} mg/L) followed by mono-exponential decay. Oral curve shows an absorption phase rising to Cmax before elimination dominates (t₁/₂ = {(0.693 / keRate).toFixed(2)} h).</p>
                </div>
              </div>
              <div className="lg:col-span-8 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <svg viewBox="0 0 560 260" className="w-full h-64">
                  <text x="280" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">Plasma Concentration vs Time (Oral vs IV Bolus)</text>
                  <line x1="60" y1="30" x2="60" y2="215" stroke="#475569" strokeWidth="1.5" />
                  <line x1="60" y1="215" x2="530" y2="215" stroke="#475569" strokeWidth="1.5" />
                  <text x="18" y="125" textAnchor="middle" fill="#94a3b8" fontSize="10" transform="rotate(-90 18 125)">Conc (mg/L)</text>
                  <text x="295" y="245" textAnchor="middle" fill="#94a3b8" fontSize="10">Time (Hours)</text>
                  {[0, 3, 6, 9, 12].map((hr) => {
                    const x = 60 + (hr / 12) * 460;
                    return <text key={hr} x={x} y="230" textAnchor="middle" fill="#64748b" fontSize="9">{hr}h</text>;
                  })}
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    points={pkPoints.map((p) => `${60 + (p.t / 12) * 460},${215 - (p.cIv / maxConc) * 170}`).join(' ')}
                  />
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    points={pkPoints.map((p) => `${60 + (p.t / 12) * 460},${215 - (p.cOral / maxConc) * 170}`).join(' ')}
                  />
                  <rect x="370" y="34" width="150" height="40" rx="6" fill="#0f172a" stroke="#334155" />
                  <line x1="382" y1="48" x2="402" y2="48" stroke="#38bdf8" strokeWidth="2.5" />
                  <text x="410" y="51" fill="#cbd5e1" fontSize="10">IV Bolus</text>
                  <line x1="382" y1="64" x2="402" y2="64" stroke="#10b981" strokeWidth="2.5" />
                  <text x="410" y="67" fill="#cbd5e1" fontSize="10">Oral Absorption</text>
                </svg>
              </div>
            </div>
          )}

          {plotType === 'adr_bar' && (
            <div className="bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <svg viewBox="0 0 560 250" className="w-full h-60">
                <text x="280" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">ADR Reporting Rates Across Drugs (per 1,000 Prescriptions)</text>
                <line x1="60" y1="30" x2="60" y2="205" stroke="#475569" strokeWidth="1.5" />
                <line x1="60" y1="205" x2="530" y2="205" stroke="#475569" strokeWidth="1.5" />
                {adrPlotData.map((d, i) => {
                  const barW = 55;
                  const x = 90 + i * 88;
                  const h = (d.rate / 50) * 160;
                  return (
                    <g key={d.drug}>
                      <rect x={x} y={205 - h} width={barW} height={h} rx="4" fill={d.color} opacity="0.85" />
                      <text x={x + barW / 2} y={200 - h} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">{d.rate}</text>
                      <text x={x + barW / 2} y="222" textAnchor="middle" fill="#94a3b8" fontSize="10">{d.drug}</text>
                    </g>
                  );
                })}
              </svg>
              <p className="text-sm text-slate-300 mt-2"><strong>Interpretation:</strong> NSAIDs (Ibuprofen, Aspirin) show elevated ADR reporting rates requiring gastro-protective co-therapy monitoring.</p>
            </div>
          )}

          {plotType === 'dissolution' && (
            <div className="bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <svg viewBox="0 0 560 250" className="w-full h-60">
                <text x="280" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">In-Vitro Drug Dissolution Profile (% Drug Released vs Time)</text>
                <line x1="60" y1="30" x2="60" y2="205" stroke="#475569" strokeWidth="1.5" />
                <line x1="60" y1="205" x2="530" y2="205" stroke="#475569" strokeWidth="1.5" />
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  points={dissolutionData.map((d) => `${60 + (d.t / 120) * 450},${205 - (d.ir / 100) * 160}`).join(' ')}
                />
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="5,4"
                  points={dissolutionData.map((d) => `${60 + (d.t / 120) * 450},${205 - (d.sr / 100) * 160}`).join(' ')}
                />
                {dissolutionData.map((d) => (
                  <g key={d.t}>
                    <circle cx={60 + (d.t / 120) * 450} cy={205 - (d.ir / 100) * 160} r="3.5" fill="#10b981" />
                    <circle cx={60 + (d.t / 120) * 450} cy={205 - (d.sr / 100) * 160} r="3.5" fill="#f59e0b" />
                    <text x={60 + (d.t / 120) * 450} y="222" textAnchor="middle" fill="#94a3b8" fontSize="9">{d.t}m</text>
                  </g>
                ))}
                <text x="410" y="55" fill="#10b981" fontSize="10">● Immediate Release (IR)</text>
                <text x="410" y="72" fill="#f59e0b" fontSize="10">● Sustained Release (SR)</text>
              </svg>
              <p className="text-sm text-slate-300 mt-2"><strong>Interpretation:</strong> Immediate release achieves &gt;80% dissolution within 30 min (IP Q-spec), whereas Sustained Release follows zero/first-order extended release over 120+ min.</p>
            </div>
          )}

          {plotType === 'boxplot' && (
            <div className="bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <svg viewBox="0 0 560 240" className="w-full h-56">
                <text x="280" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">Box Plot: Tablet Assay (% Label Claim) Across 3 Batches</text>
                <line x1="60" y1="30" x2="60" y2="205" stroke="#475569" strokeWidth="1.5" />
                <line x1="60" y1="205" x2="530" y2="205" stroke="#475569" strokeWidth="1.5" />
                {[
                  { name: 'Batch A', minY: 145, q1Y: 120, medY: 105, q3Y: 90, maxY: 70, color: '#10b981', x: 150 },
                  { name: 'Batch B', minY: 165, q1Y: 140, medY: 118, q3Y: 96, maxY: 62, color: '#3b82f6', x: 280 },
                  { name: 'Batch C', minY: 135, q1Y: 112, medY: 102, q3Y: 92, maxY: 76, color: '#a855f7', x: 410 }
                ].map((b) => (
                  <g key={b.name}>
                    <line x1={b.x} y1={b.maxY} x2={b.x} y2={b.minY} stroke={b.color} strokeWidth="2" />
                    <line x1={b.x - 15} y1={b.maxY} x2={b.x + 15} y2={b.maxY} stroke={b.color} strokeWidth="2" />
                    <line x1={b.x - 15} y1={b.minY} x2={b.x + 15} y2={b.minY} stroke={b.color} strokeWidth="2" />
                    <rect x={b.x - 25} y={b.q3Y} width="50" height={b.q1Y - b.q3Y} fill={b.color} fillOpacity="0.25" stroke={b.color} strokeWidth="2" />
                    <line x1={b.x - 25} y1={b.medY} x2={b.x + 25} y2={b.medY} stroke="#ffffff" strokeWidth="2.5" />
                    <text x={b.x} y="222" textAnchor="middle" fill="#cbd5e1" fontSize="10">{b.name}</text>
                  </g>
                ))}
              </svg>
              <p className="text-sm text-slate-300 mt-2"><strong>Interpretation:</strong> Narrow interquartile range (IQR) in Batch C demonstrates superior content uniformity and process control compared to Batch B.</p>
            </div>
          )}
        </div>
      )}

      {/* Live Python Editor & Console */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <Code className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeUnit === 'unit1-2' && 'Unit I & II: Pharmaceutical Scripting, BMI & Dosage Functions'}
                {activeUnit === 'unit3' && 'Unit III: Data Structures, CSV & NumPy Tablet QC'}
                {activeUnit === 'unit4' && 'Unit IV: Pandas ADR Clinical Dataset & Grouping'}
                {activeUnit === 'unit5' && 'Unit V: Oral vs IV Pharmacokinetic Simulation'}
                {activeUnit === 'practical5' && 'Practical 5: Accelerated Stability & Arrhenius Kinetics'}
                {activeUnit === 'sandbox' && 'Custom Python 3.11 Sandbox Environment'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isLoadingPyodide ? runtimeStatus : 'Edit code below and execute live in your browser.'}
              </p>
            </div>
          </div>
          {isLoadingPyodide && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading Pyodide...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Live Python Code Editor</span>
              </span>
              <span className="text-xs text-slate-500">Python 3.11 WebAssembly</span>
            </div>
            <textarea
              rows={14}
              value={getCurrentCode()}
              onChange={(e) => setCurrentCode(e.target.value)}
              disabled={isLoadingPyodide}
              className="w-full bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-code text-emerald-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50 leading-relaxed resize-y"
            />
            <button
              onClick={() => executeCode(getCurrentCode())}
              disabled={isLoadingPyodide}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-sm dark:shadow-lg dark:shadow-emerald-950 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoadingPyodide ? 'Initializing Python Engine...' : 'Run in Browser'}</span>
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col space-y-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Console Output
            </span>
            <div className="bg-slate-950 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-code text-sm h-[360px] overflow-y-auto space-y-1">
              {consoleOutput.map((line, i) => (
                <div key={i} className={line.includes('Error') || line.includes('FAIL') ? 'text-rose-400 font-bold' : line.startsWith('>>>') ? 'text-slate-400' : 'text-emerald-300 whitespace-pre-wrap'}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}