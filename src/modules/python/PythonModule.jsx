import React, { useState } from 'react';
import { Code, Play, BookOpen, Terminal, CheckCircle2, Sparkles, Sliders, Layers, BarChart3, AlertCircle } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit3');
  const [selectedScript, setSelectedScript] = useState('numpy_qc');

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

  // Unit III State (NumPy QC & Weight Variation)
  const [avgTabWeight, setAvgTabWeight] = useState(150); // mg
  const [batchQuality, setBatchQuality] = useState('normal'); // normal, outlier, substandard
  const [qcResults, setQcResults] = useState(null);

  const [consoleOutput, setConsoleOutput] = useState([]);

  // Syntax & Concept Cards for Unit III
  const numpySyntaxCards = [
    {
      unit: 'Unit III',
      title: 'NumPy Array Creation & Slicing',
      code: `import numpy as np

# Convert list of tablet weights to NumPy array
weights = np.array([148.2, 151.0, 149.5, 150.1, 152.0])
print(weights[0:3])  # Slicing first 3 weights`,
      note: 'NumPy arrays are vectorized, highly optimized, and consume less memory than standard Python lists.'
    },
    {
      unit: 'Unit III',
      title: 'Statistical QC Functions',
      code: `mean_wt = np.mean(weights)
std_dev = np.std(weights)
min_val = np.min(weights)
max_val = np.max(weights)`,
      note: 'Essential for evaluating batch uniformity and standard deviation across manufacturing runs.'
    },
    {
      unit: 'Unit III',
      title: 'Boolean Masking & Filtering',
      code: `# Find tablets violating ±7.5% IP limit
limit_upper = mean_wt * 1.075
limit_lower = mean_wt * 0.925
failures = weights[(weights > limit_upper) | (weights < limit_lower)]`,
      note: 'Boolean masks allow lightning-fast filtering of out-of-specification (OOS) clinical or QC records.'
    },
    {
      unit: 'Unit III',
      title: 'CSV File Handling with Python',
      code: `import csv

with open('batch_log.csv', mode='r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row['BatchID'], row['Status'])`,
      note: 'Built-in file input/output for parsing raw laboratory and instrument log files.'
    }
  ];

  // Generate Dynamic Python Code Preview for Unit III
  const getPythonCode = () => {
    if (activeUnit === 'unit1-2') {
      return `# BP101T Unit I & II Script Template
rule_selected = "${dosingRule}"
age = ${childAge}
weight = ${childWeight}
adult_dose = ${adultDose}
print(f"Rule: {rule_selected}, Dose: {adult_dose} mg")`;
    }

    return `# BP101T Unit III: NumPy Quality Control & Weight Variation
import numpy as np

# Simulate 10 tablet weights (mg) for the batch
target_avg = ${avgTagWeight || avgTabWeight}
np.random.seed(42)
if "${batchQuality}" == "outlier":
    weights = np.array([148, 150, 152, 149, 130, 151, 148, 175, 150, 149]) # Has outliers
elif "${batchQuality}" == "substandard":
    weights = np.array([135, 138, 140, 136, 139, 137, 138, 140, 136, 139]) # Consistently low
else:
    weights = np.array([149.2, 150.5, 150.1, 149.8, 151.0, 149.5, 150.2, 150.0, 149.7, 150.3])

# Statistical Analysis via NumPy
mean_weight = np.mean(weights)
std_dev = np.std(weights, ddof=1)
max_dev_pct = np.max(np.abs(weights - mean_weight) / mean_weight) * 100

print(f"Batch Sample Size : {len(weights)} tablets")
print(f"Mean Weight       : {round(mean_weight, 2)} mg")
print(f"Standard Dev (SD) : {round(std_dev, 2)} mg")
print(f"Max % Deviation   : {round(max_dev_pct, 2)}%")

# Indian Pharmacopoeia (IP) Compliance Check (For 80mg - 250mg tablets: ±7.5%)
if max_dev_pct <= 7.5:
    print("QC Status: PASS (Complies with IP Weight Variation Limits)")
else:
    print("QC Status: FAIL (Exceeds ±7.5% IP Limit - Batch Rejected)")`;
  };

  // Run NumPy QC Simulation
  const runPythonScript = () => {
    const timestamp = new Date().toLocaleTimeString();
    if (activeUnit === 'unit1-2') {
      const a = parseFloat(childAge) || 0;
      const w = parseFloat(childWeight) || 0;
      const d = parseFloat(adultDose) || 0;
      let res = 0;
      if (dosingRule === 'youngs') res = (a / (a + 12)) * d;
      else if (dosingRule === 'dillings') res = (a / 20) * d;
      else if (dosingRule === 'clarks') res = (w / 70) * d;

      setConsoleOutput([
        `>>> Executing pediatric_dosing.py at ${timestamp}...`,
        `Rule Applied  : ${dosingRule.toUpperCase()}`,
        `Patient Info  : ${a} yrs | ${w} kg`,
        `Pediatric Dose: ${res.toFixed(2)} mg`,
        `>>> Process finished with exit code 0`
      ]);
    } else {
      // NumPy QC simulation logic
      let weights = [149.2, 150.5, 150.1, 149.8, 151.0, 149.5, 150.2, 150.0, 149.7, 150.3];
      if (batchQuality === 'outlier') {
        weights = [148, 150, 152, 149, 130, 151, 148, 175, 150, 149];
      } else if (batchQuality === 'substandard') {
        weights = [135, 138, 140, 136, 139, 137, 138, 140, 136, 139];
      }

      const n = weights.length;
      const mean = weights.reduce((a, b) => a + b, 0) / n;
      const variance = weights.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
      const sd = Math.sqrt(variance);
      
      let maxDev = 0;
      weights.forEach(w => {
        const dev = Math.abs(w - mean) / mean * 100;
        if (dev > maxDev) maxDev = dev;
      });

      const passed = maxDev <= 7.5;

      setQcResults({
        weights,
        mean: mean.toFixed(2),
        sd: sd.toFixed(2),
        maxDev: maxDev.toFixed(2),
        passed
      });

      setConsoleOutput([
        `>>> Executing numpy_qc_batch.py at ${timestamp}...`,
        `Importing numpy as np ... [OK]`,
        `Batch Sample Size : ${n} tablets`,
        `Mean Weight       : ${mean.toFixed(2)} mg`,
        `Standard Dev (SD) : ${sd.toFixed(2)} mg`,
        `Max % Deviation   : ${maxDev.toFixed(2)}%`,
        `----------------------------------------`,
        passed 
          ? `QC Status: PASS (Complies with IP ±7.5% Weight Variation Limit)` 
          : `QC Status: FAIL (Exceeds ±7.5% IP Limit - Batch Rejected)`,
        `>>> Process finished with exit code 0`
      ]);
    }
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
          { id: 'unit1-2', label: 'Unit I & II: Syntax & Pharma Functions' },
          { id: 'unit3', label: 'Unit III: NumPy & IP Quality Control' },
          { id: 'unit4', label: 'Unit IV: Pandas & ADR Datasets (Next)' },
          { id: 'unit5', label: 'Unit V: Matplotlib PK Curves (Next)' }
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

      {/* UNIT III CONTENT */}
      {activeUnit === 'unit3' ? (
        <div className="space-y-8">
          {/* Section 1: NumPy Syntax Reference Cards */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                Unit III: NumPy Arrays & Statistical QC Reference
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {numpySyntaxCards.map((card, idx) => (
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

          {/* Section 2: Interactive NumPy QC Scripting Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">NumPy Tablet Weight Variation QC Simulator</h3>
                  <p className="text-xs text-slate-400">
                    Test manufacturing batch compliance against Indian Pharmacopoeia (IP) standards using NumPy array statistics.
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
                  <span>Batch Simulation Parameters</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Batch Profile / Quality Scenario</label>
                    <select
                      value={batchQuality}
                      onChange={(e) => setBatchQuality(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="normal">Standard Compliant Batch (Uniform)</option>
                      <option value="outlier">Batch with Weight Outliers (Contains 130mg & 175mg)</option>
                      <option value="substandard">Substandard Batch (Consistently Underweight)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Mean Weight (`target_avg` mg)</label>
                    <input
                      type="number"
                      value={avgTabWeight}
                      onChange={(e) => setAvgTabWeight(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>IP Standard Rule</span>
                  </div>
                  <p className="text-[11px] text-blue-200">
                    For tablets weighing between 80mg and 250mg, the maximum permitted percentage deviation is &plusmn;7.5%.
                  </p>
                </div>

                <button
                  onClick={runPythonScript}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-950"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run NumPy QC Script</span>
                </button>
              </div>

              {/* Right Pane: Code + Terminal */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">numpy_qc_batch.py</span>
                    <span className="text-[11px] text-blue-400 font-medium">NumPy Vectorized Statistics</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    {getPythonCode()}
                  </pre>
                </div>

                {/* Console Output */}
                <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-slate-500 mb-2 pb-1.5 border-b border-slate-900">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Interactive Console Output</span>
                  </div>
                  {consoleOutput.length > 0 ? (
                    <div className="space-y-1 text-emerald-400">
                      {consoleOutput.map((line, i) => (
                        <div key={i} className={line.includes('FAIL') ? 'text-rose-400 font-bold' : line.includes('PASS') ? 'text-emerald-400 font-bold' : line.startsWith('>>>') ? 'text-slate-500' : 'text-emerald-300'}>
                          {line || ' '}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 italic">
                      Click &ldquo;Run NumPy QC Script&rdquo; to execute batch statistical analysis...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback for other units */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Layers className="w-10 h-10 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Unit I &amp; II Syntax & Pharma Functions</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Switch to Unit III tab above to explore NumPy arrays and quality control statistics.
          </p>
          <button
            onClick={() => setActiveUnit('unit3')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Go to Unit III Studio
          </button>
        </div>
      )}
    </div>
  );
}
