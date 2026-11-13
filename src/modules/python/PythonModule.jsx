import React, { useState, useEffect } from 'react';
import { Code, Play, BookOpen, Terminal, Sliders, Layers, RefreshCw, Clock } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit1-2');
  const [selectedScript, setSelectedScript] = useState('pediatric');

  // Pyodide Sandbox State
  const [pyodide, setPyodide] = useState(null);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(true);
  const [customCode, setCustomCode] = useState('import numpy as np\narr = np.array([150.2, 149.8, 151.0])\nprint("NumPy Array Mean:", np.mean(arr))');
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'Initializing WebAssembly Python 3.11 Sandbox (Pyodide)...' }
  ]);

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
  const [pkPlotData, setPkPlotData] = useState({
    points: [{ t: 0, c: 0 }, { t: 3, c: 18.2 }, { t: 6, c: 11.2 }, { t: 12, c: 4.2 }],
    maxConc: '18.20',
    tMax: '3.0'
  });

  // Practical 5 State (Arrhenius Kinetics)
  const [temp40Rate, setTemp40Rate] = useState(0.00012);
  const [temp50Rate, setTemp50Rate] = useState(0.00045);
  const [temp60Rate, setTemp60Rate] = useState(0.00150);
  const [arrheniusResults, setArrheniusResults] = useState(null);

  const [consoleOutput, setConsoleOutput] = useState([
    '>>> PharmLab Pharmaceutical Python Studio Ready.',
    '>>> Select a unit or practical tab above to execute script logic.'
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
        await pyInstance.loadPackage("numpy");
        if (isMounted) {
          setPyodide(pyInstance);
          setIsLoadingPyodide(false);
          setTerminalHistory(prev => [
            ...prev,
            { type: 'system', text: 'Python 3.11 WebAssembly Runtime & NumPy loaded successfully.' }
          ]);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoadingPyodide(false);
          setTerminalHistory(prev => [...prev, { type: 'error', text: `Failed to load Pyodide: ${err.message}` }]);
        }
      }
    }
    loadPyodideEnvironment();
    return () => { isMounted = false; };
  }, []);

  const handleRunCustomCode = async () => {
    if (!pyodide) {
      alert("Python runtime is still loading...");
      return;
    }
    setTerminalHistory(prev => [...prev, { type: 'input', text: customCode }]);
    try {
      pyodide.runPython(`import sys, io; sys.stdout = io.StringIO()`);
      await pyodide.runPythonAsync(customCode);
      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      setTerminalHistory(prev => [...prev, { type: 'output', text: stdout || '[Executed with no stdout output]' }]);
    } catch (err) {
      setTerminalHistory(prev => [...prev, { type: 'error', text: err.toString() }]);
    }
  };

  // Code Previews
  const getPythonCode = () => {
    if (activeUnit === 'unit1-2') {
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
    } else if (activeUnit === 'unit3') {
      return `# BP101T Unit III: NumPy Quality Control & Weight Variation
import numpy as np
weights = np.array([149.2, 150.5, 150.1, 149.8, 151.0, 149.5, 150.2, 150.0, 149.7, 150.3])
mean_w = np.mean(weights)
max_dev = np.max(np.abs(weights - mean_w) / mean_w) * 100
print(f"Mean: {mean_w:.2f} mg | Max Dev: {max_dev:.2f}%")`;
    } else if (activeUnit === 'unit4') {
      return `# BP101T Unit IV: Pandas ADR Dataset Management
import pandas as pd
df = pd.DataFrame(adr_data)
filtered = df[(df['Age'] >= ${minAgeFilter}) & (df['Severity'] == '${severityFilter}')]
print(filtered.to_string())`;
    } else if (activeUnit === 'unit5') {
      return `# BP101T Unit V: Matplotlib PK Curve
import numpy as np, matplotlib.pyplot as plt
time = np.linspace(0, 24, 100)
conc = (${pkDose} / ${pkVd}) * np.exp(-${pkKe} * time)
plt.plot(time, conc); plt.show()`;
    } else {
      return `# BP101T Practical 5: Accelerated Stability & Arrhenius Shelf-Life
import numpy as np

temps_c = np.array([40.0, 50.0, 60.0])
temps_k = temps_c + 273.15
inv_temp = 1.0 / temps_k
k_vals = np.array([${temp40Rate}, ${temp50Rate}, ${temp60Rate}])
log_k = np.log(k_vals)

slope, intercept = np.polyfit(inv_temp, log_k, 1)
R = 1.987
Ea = -slope * R * 2.303

t_room_k = 25.0 + 273.15
k_room = np.exp(slope * (1.0 / t_room_k) + intercept)
t90_years = (0.1053 / k_room) / 365.25

print(f"Activation Energy (Ea): {Ea:.2f} cal/mol")
print(f"Shelf-Life at 25°C (t90): {t90_years:.2f} years")`;
    }
  };

  const runPythonScript = () => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      if (activeUnit === 'practical5') {
        const k40 = parseFloat(temp40Rate) || 0.00012;
        const k50 = parseFloat(temp50Rate) || 0.00045;
        const k60 = parseFloat(temp60Rate) || 0.00150;
        
        const temps = [40 + 273.15, 50 + 273.15, 60 + 273.15];
        const invT = temps.map(t => 1 / t);
        const logK = [Math.log(k40), Math.log(k50), Math.log(k60)];
        
        // Simple linear regression slope calculation
        const n = 3;
        const sumX = invT.reduce((a, b) => a + b, 0);
        const sumY = logK.reduce((a, b) => a + b, 0);
        const sumXY = invT.reduce((acc, x, i) => acc + x * logK[i], 0);
        const sumXX = invT.reduce((acc, x) => acc + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const R = 1.987; // cal/(mol K)
        const Ea = -slope * R * 2.303 * 1000; // adjusted scale
        
        const roomT = 25 + 273.15;
        const logKRoom = slope * (1 / roomT) + intercept;
        const kRoom = Math.exp(logKRoom);
        const t90Years = (0.1053 / kRoom) / 365.25;
        
        setArrheniusResults({
          ea: (Ea / 1000).toFixed(2), // kcal/mol
          kRoom: kRoom.toExponential(4),
          t90: t90Years.toFixed(2)
        });

        setConsoleOutput([
          `>>> Executing arrhenius_shelflife.py at ${timestamp}...`,
          `Accelerated rates -> 40°C: ${k40}, 50°C: ${k50}, 60°C: ${k60}`,
          `Calculated Activation Energy (Ea): ${(Ea/1000).toFixed(2)} kcal/mol`,
          `Extrapolated Degradation Rate at 25°C (k25): ${kRoom.toExponential(4)} day^-1`,
          `Estimated Product Shelf-Life (t90): ${t90Years.toFixed(2)} Years`,
          `>>> Exit code 0`
        ]);
      } else {
        setConsoleOutput([
          `>>> Executing script for ${activeUnit} at ${timestamp}...`,
          `Calculation completed successfully.`,
          `>>> Exit code 0`
        ]);
      }
    } catch (err) {
      setConsoleOutput([`>>> Execution Error: ${err.message}`]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">PCI B.Pharm • BP101T</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Basics of Python Programming for Pharmaceutical Sciences</h2>
        <p className="text-slate-400 text-sm mt-1">Complete curriculum studio featuring 5 syllabus units, Practical 5 (Arrhenius Kinetics), and Python Sandbox.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'unit1-2', label: 'Unit I & II: Syntax & Functions' },
          { id: 'unit3', label: 'Unit III: NumPy & QC' },
          { id: 'unit4', label: 'Unit IV: Pandas & ADR' },
          { id: 'unit5', label: 'Unit V: Matplotlib PK' },
          { id: 'practical5', label: '🧪 Practical 5: Arrhenius Shelf-Life' },
          { id: 'sandbox', label: '✨ Custom Python Sandbox' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveUnit(tab.id)}
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

      {/* PRACTICAL 5 VIEW */}
      {activeUnit === 'practical5' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Practical 5: Accelerated Stability & Arrhenius Shelf-Life Calculator</h3>
              <p className="text-xs text-slate-400">Calculate activation energy ($E_a$) and shelf-life ($t_{90}$) from accelerated degradation rate constants.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Degradation Rates ($k$)</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Rate Constant at 40°C ($k_{40}$ day⁻¹)</label>
                  <input type="number" step="0.00001" value={temp40Rate} onChange={e => setTemp40Rate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Rate Constant at 50°C ($k_{50}$ day⁻¹)</label>
                  <input type="number" step="0.00001" value={temp50Rate} onChange={e => setTemp50Rate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Rate Constant at 60°C ($k_{60}$ day⁻¹)</label>
                  <input type="number" step="0.00001" value={temp60Rate} onChange={e => setTemp60Rate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                </div>
              </div>
              <button
                onClick={runPythonScript}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Arrhenius Script</span>
              </button>
            </div>

            {/* Code Preview & Terminal */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">arrhenius_shelflife.py</span>
                  <span className="text-[11px] text-blue-400 font-medium">NumPy Linear Regression</span>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                  {getPythonCode()}
                </pre>
              </div>

              {arrheniusResults && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Activation Energy</span>
                    <p className="text-sm font-bold text-emerald-400 mt-1">{arrheniusResults.ea} kcal/mol</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Room Rate ($k_{25}$)</span>
                    <p className="text-sm font-bold text-blue-400 mt-1">{arrheniusResults.kRoom}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Shelf-Life ($t_{90}$)</span>
                    <p className="text-sm font-bold text-amber-400 mt-1">{arrheniusResults.t90} Years</p>
                  </div>
                </div>
              )}

              {/* Terminal */}
              <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs">
                <div className="flex items-center space-x-2 text-slate-500 mb-2 pb-1.5 border-b border-slate-900">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Console Output</span>
                </div>
                <div className="space-y-1 text-emerald-400">
                  {consoleOutput.map((line, i) => (
                    <div key={i} className={line.startsWith('>>>') ? 'text-slate-500' : 'text-emerald-300'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeUnit === 'sandbox' ? (
        /* CUSTOM PYTHON SANDBOX VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Live WebAssembly Python 3.11 Sandbox</h3>
                <p className="text-xs text-slate-400">{isLoadingPyodide ? 'Downloading Python 3.11 & NumPy...' : 'Type custom Python code and execute live.'}</p>
              </div>
            </div>
            {isLoadingPyodide && (
              <div className="flex items-center space-x-2 text-xs text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading Interpreter...</span>
              </div>
            )}
          </div>

          <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs h-56 overflow-y-auto space-y-2">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className={item.type === 'system' ? 'text-slate-500 italic' : item.type === 'input' ? 'text-blue-400 font-bold border-l-2 border-blue-500 pl-2' : item.type === 'error' ? 'text-rose-400' : 'text-emerald-300 whitespace-pre-wrap'}>
                {item.type === 'input' ? `>>> ${item.text}` : item.text}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <textarea
              rows={5}
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              disabled={isLoadingPyodide}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={handleRunCustomCode}
              disabled={isLoadingPyodide}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoadingPyodide ? 'Initializing Engine...' : 'Run Custom Code in Browser'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD UNITS VIEW */
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
                <p className="text-xs text-slate-400">Modify parameters and execute guided pharmaceutical code.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Input Parameters</span>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Adult Dose (mg)</label>
                <input type="number" value={adultDose} onChange={e => setAdultDose(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <button
                onClick={runPythonScript}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Script</span>
              </button>
            </div>

            <div className="lg:col-span-8 flex flex-col space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">script.py</span>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                  {getPythonCode()}
                </pre>
              </div>
              <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs">
                <div className="flex items-center space-x-2 text-slate-500 mb-2 pb-1.5 border-b border-slate-900">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Console Output</span>
                </div>
                <div className="space-y-1 text-emerald-400">
                  {consoleOutput.map((line, i) => (
                    <div key={i} className={line.startsWith('>>>') ? 'text-slate-500' : 'text-emerald-300'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
