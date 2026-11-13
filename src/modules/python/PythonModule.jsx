import React, { useState, useEffect } from 'react';
import { Code, Play, BookOpen, Terminal, Sliders, Layers, RefreshCw, Clock } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit1-2');
  const [selectedScript, setSelectedScript] = useState('pediatric');

  // Pyodide Runtime State
  const [pyodide, setPyodide] = useState(null);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(true);
  const [runtimeStatus, setRuntimeStatus] = useState('Initializing Python 3.11 WebAssembly...');

  // Editable Code States for Each Unit
  const [codeUnit12, setCodeUnit12] = useState(`# BP101T Unit II: Modular Pediatric Dosing Function
def calculate_pediatric_dose(age_yrs, weight_kg, adult_mg):
    # Young's Rule for Children (1-12 years)
    dose = (age_yrs / (age_yrs + 12)) * adult_mg
    return round(dose, 2)

print("Calculated Pediatric Dose:", calculate_pediatric_dose(6, 20, 500), "mg")`);

  const [codeUnit3, setCodeUnit3] = useState(`# BP101T Unit III: NumPy Tablet Weight Variation QC
import numpy as np

# Tablet batch weights in mg (IP Limit: +/- 7.5%)
weights = np.array([149.2, 150.5, 150.1, 149.8, 151.0, 149.5, 150.2, 150.0, 149.7, 150.3])
mean_w = np.mean(weights)
max_dev = np.max(np.abs(weights - mean_w) / mean_w) * 100

print(f"Batch Mean Weight: {mean_w:.2f} mg")
print(f"Maximum Deviation: {max_dev:.2f}%")
print("Quality Control Status: PASS" if max_dev <= 7.5 else "Quality Control Status: FAIL")`);

  const [codeUnit4, setCodeUnit4] = useState(`# BP101T Unit IV: Pandas ADR Clinical Dataset Management
import pandas as pd

adr_data = {
    'ID': ['ADR-101', 'ADR-102', 'ADR-103', 'ADR-104'],
    'Drug': ['Paracetamol', 'Amlodipine', 'Metformin', 'Amlodipine'],
    'Age': [45, 68, 52, 71],
    'Severity': ['Mild', 'Severe', 'Moderate', 'Severe'],
    'Reaction': ['Nausea', 'Edema', 'Gastric Distress', 'Hypotension']
}

df = pd.DataFrame(adr_data)
severe_cases = df[df['Severity'] == 'Severe']
print("Severe ADR Cases:\n", severe_cases.to_string(index=False))`);

  const [codeUnit5, setCodeUnit5] = useState(`# BP101T Unit V: Pharmacokinetic Plasma Concentration Profile
import numpy as np

time_hrs = np.linspace(0, 24, 10)
dose = 500
vd = 25
ke = 0.15

# One-compartment oral absorption model approximation
conc = (dose / vd) * np.exp(-ke * time_hrs)
for t, c in zip(time_hrs, conc):
    print(f"Time: {t:4.1f}h | Plasma Conc: {max(0, c):6.2f} mg/L")`);

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

  // Active Terminal Output State
  const [consoleOutput, setConsoleOutput] = useState([
    '>>> PharmLab WebAssembly Python 3.11 Environment Loading...'
  ]);

  // Load Pyodide on mount
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

  // Generic Runner for any code snippet using Pyodide
  const executeCode = async (codeToRun) => {
    if (!pyodide) {
      alert("Python runtime is still initializing. Please wait a moment.");
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

  // Helper to get current active code
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">PCI B.Pharm • BP101T</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Basics of Python Programming for Pharmaceutical Sciences</h2>
        <p className="text-slate-400 text-sm mt-1">Interactive curriculum studio with live WebAssembly Python execution across all units.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'unit1-2', label: 'Unit I & II: Syntax & Functions' },
          { id: 'unit3', label: 'Unit III: NumPy QC' },
          { id: 'unit4', label: 'Unit IV: Pandas ADR' },
          { id: 'unit5', label: 'Unit V: Matplotlib PK' },
          { id: 'practical5', label: '🧪 Practical 5: Arrhenius Shelf-Life' },
          { id: 'sandbox', label: '✨ Custom Python Sandbox' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveUnit(tab.id); setConsoleOutput([`>>> Switched to ${tab.label}. Click "Run in Browser".`]); }}
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

      {/* ACTIVE WORKSPACE CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <Code className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                {activeUnit === 'unit1-2' && 'Unit I & II: Pharmaceutical Scripting & Functions'}
                {activeUnit === 'unit3' && 'Unit III: NumPy Tablet Weight Variation QC'}
                {activeUnit === 'unit4' && 'Unit IV: Pandas ADR Clinical Dataset Filter'}
                {activeUnit === 'unit5' && 'Unit V: Pharmacokinetic Plasma Concentration Profile'}
                {activeUnit === 'practical5' && 'Practical 5: Accelerated Stability & Arrhenius Kinetics'}
                {activeUnit === 'sandbox' && 'Custom Python 3.11 Sandbox Environment'}
              </h3>
              <p className="text-xs text-slate-400">
                {isLoadingPyodide ? runtimeStatus : 'Edit code below and execute live in your browser.'}
              </p>
            </div>
          </div>
          {isLoadingPyodide && (
            <div className="flex items-center space-x-2 text-xs text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading Pyodide...</span>
            </div>
          )}
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Editable Code Editor */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Live Python Code Editor</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Python 3.11 WebAssembly</span>
            </div>
            <textarea
              rows={14}
              value={getCurrentCode()}
              onChange={(e) => setCurrentCode(e.target.value)}
              disabled={isLoadingPyodide}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50 leading-relaxed resize-y"
            />
            <button
              onClick={() => executeCode(getCurrentCode())}
              disabled={isLoadingPyodide}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoadingPyodide ? 'Initializing Python Engine...' : 'Run in Browser'}</span>
            </button>
          </div>

          {/* Terminal Console Output */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Console Output
            </span>
            <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs h-[360px] overflow-y-auto space-y-1">
              {consoleOutput.map((line, i) => (
                <div key={i} className={line.includes('Error') || line.includes('FAIL') ? 'text-rose-400 font-bold' : line.startsWith('>>>') ? 'text-slate-500' : 'text-emerald-300 whitespace-pre-wrap'}>
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
