import React, { useState } from 'react';
import { Code, Play, BookOpen, Terminal, CheckCircle2, Sparkles, Sliders, Layers } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit1-2');
  const [selectedScript, setSelectedScript] = useState('pediatric');

  // Interactive Playground Parameters
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

  const [consoleOutput, setConsoleOutput] = useState([]);

  // Syntax & Concept Cards for Unit I & II
  const syntaxCards = [
    {
      unit: 'Unit I',
      title: 'Variables & Data Types',
      code: `drug_name = "Paracetamol"   # str (String)
strength_mg = 500           # int (Integer)
bioavailability = 0.88      # float (Decimal)
is_otc = True               # bool (Boolean)`,
      note: 'Use type() to inspect data types and float() or int() for type casting user inputs.'
    },
    {
      unit: 'Unit I',
      title: 'Arithmetic & Comparison Operators',
      code: `total_dose = dose_per_kg * weight_kg
# Operators: +  -  *  /  ** (power)  % (modulo)
is_toxic = plasma_conc > 20.0  # Returns True/False`,
      note: 'Essential for pharmacokinetic unit conversions and therapeutic window checks.'
    },
    {
      unit: 'Unit II',
      title: 'Conditional Branching (if / elif / else)',
      code: `if bmi < 18.5:
    status = "Underweight"
elif bmi < 25.0:
    status = "Normal Weight"
else:
    status = "Overweight"`,
      note: 'Indentation (4 spaces) defines code blocks in Python—never omit colons (:).'
    },
    {
      unit: 'Unit II',
      title: 'Loops & Modular Functions (def)',
      code: `def calc_youngs_dose(age, adult_dose):
    dose = (age / (age + 12)) * adult_dose
    return round(dose, 2)`,
      note: 'Functions let you reuse standard pharmaceutical formulas across patient datasets.'
    }
  ];

  // Generate Dynamic Python Code Preview based on selected script
  const getPythonCode = () => {
    if (selectedScript === 'pediatric') {
      return `# BP101T Unit II: Modular Pediatric Dosing Function
def calculate_pediatric_dose(rule, age_yrs, weight_kg, adult_mg):
    if rule == "youngs":
        # Young's Rule: [Age / (Age + 12)] * Adult Dose
        dose = (age_yrs / (age_yrs + 12)) * adult_mg
    elif rule == "dillings":
        # Dilling's Rule: (Age / 20) * Adult Dose
        dose = (age_yrs / 20) * adult_mg
    elif rule == "clarks":
        # Clark's Rule: (Weight in kg / 70) * Adult Dose
        dose = (weight_kg / 70) * adult_mg
    else:
        return "Invalid Rule Selected"
    
    return round(dose, 2)

# --- Execute Function with Current Parameters ---
rule_selected = "${dosingRule}"
age = ${childAge}
weight = ${childWeight}
adult_dose = ${adultDose}

result = calculate_pediatric_dose(rule_selected, age, weight, adult_dose)
print(f"Rule Applied : {rule_selected.upper()}")
print(f"Patient Info : {age} yrs | {weight} kg")
print(f"Pediatric Dose: {result} mg")`;
    }

    if (selectedScript === 'dilution') {
      return `# BP101T Unit II: Serial Dilution Generator using 'for' Loop
stock_conc = ${stockConc}      # mg/mL
dilution_factor = ${dilutionFactor}
tubes = ${numTubes}

print(f"Starting Stock Concentration: {stock_conc} mg/mL\n")
current_conc = float(stock_conc)

for tube_num in range(1, tubes + 1):
    current_conc = current_conc / dilution_factor
    print(f"Tube #{tube_num}: Concentration = {round(current_conc, 4)} mg/mL")`;
    }

    return `# BP101T Unit II: Cockcroft-Gault Creatinine Clearance (CrCl)
def assess_renal_dosing(age, weight_kg, scr, female=False):
    # Cockcroft-Gault Equation
    crcl = ((140 - age) * weight_kg) / (72 * scr)
    if female:
        crcl = crcl * 0.85
    
    crcl = round(crcl, 2)
    
    # Clinical Triage Decision
    if crcl >= 60:
        action = "Standard Dose (Normal Renal Function)"
    elif crcl >= 30:
        action = "Reduce Dose by 25-50% (Moderate Impairment)"
    else:
        action = "Contraindicated / Extend Interval (Severe Impairment)"
        
    return crcl, action

clearance, recommendation = assess_renal_dosing(
    age=${patientAge}, weight_kg=${patientWeight}, scr=${serumCreatinine}, female=${isFemale ? 'True' : 'False'}
)
print(f"Calculated CrCl : {clearance} mL/min")
print(f"Clinical Action : {recommendation}")`;
  };

  // Run Simulated Python Interpreter Output
  const runPythonScript = () => {
    const timestamp = new Date().toLocaleTimeString();
    if (selectedScript === 'pediatric') {
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
    } else if (selectedScript === 'dilution') {
      let conc = parseFloat(stockConc) || 0;
      const df = parseFloat(dilutionFactor) || 1;
      const count = Math.min(Math.max(parseInt(numTubes) || 1, 1), 12);
      const lines = [
        `>>> Executing serial_dilution.py at ${timestamp}...`,
        `Starting Stock Concentration: ${conc} mg/mL`,
        ``
      ];
      for (let i = 1; i <= count; i++) {
        conc = conc / df;
        lines.push(`Tube #${i}: Concentration = ${Number(conc.toFixed(4))} mg/mL`);
      }
      lines.push(`>>> Process finished with exit code 0`);
      setConsoleOutput(lines);
    } else {
      const a = parseFloat(patientAge) || 0;
      const w = parseFloat(patientWeight) || 0;
      const scr = parseFloat(serumCreatinine) || 1;
      let crcl = ((140 - a) * w) / (72 * scr);
      if (isFemale) crcl *= 0.85;

      let action = 'Standard Dose (Normal Renal Function)';
      if (crcl < 30) action = 'Contraindicated / Extend Interval (Severe Impairment)';
      else if (crcl < 60) action = 'Reduce Dose by 25-50% (Moderate Impairment)';

      setConsoleOutput([
        `>>> Executing renal_triage.py at ${timestamp}...`,
        `Calculated CrCl : ${crcl.toFixed(2)} mL/min`,
        `Clinical Action : ${action}`,
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
          { id: 'unit1-2', label: 'Unit I & II: Syntax & Pharma Functions', active: true },
          { id: 'unit3', label: 'Unit III: NumPy & Quality Control (Next)', active: false },
          { id: 'unit4', label: 'Unit IV: Pandas & ADR Datasets', active: false },
          { id: 'unit5', label: 'Unit V: Matplotlib PK Curves', active: false }
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

      {/* UNIT I & II CONTENT */}
      {activeUnit === 'unit1-2' ? (
        <div className="space-y-8">
          {/* Section 1: Interactive Syntax & Concept Cards */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                Unit I & II Core Syntax Reference
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syntaxCards.map((card, idx) => (
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

          {/* Section 2: Interactive Pharmaceutical Scripting Playground */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <Code className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Pharmaceutical Python Scripting Playground</h3>
                  <p className="text-xs text-slate-400">
                    Select a syllabus experiment, adjust input variables, and run the live Python script.
                  </p>
                </div>
              </div>

              {/* Script Selector Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'pediatric', label: '1. Pediatric Dosing (def & elif)' },
                  { id: 'dilution', label: '2. Serial Dilutions (for loop)' },
                  { id: 'renal', label: '3. Renal CrCl Triage (if/else)' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScript(s.id);
                      setConsoleOutput([]);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      selectedScript === s.id
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split-Pane Studio: Parameter Controls + Live Python Code */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Pane: Variable Controls (4 cols) */}
              <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Script Input Variables</span>
                </div>

                {selectedScript === 'pediatric' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Dosing Rule (`rule`)</label>
                      <select
                        value={dosingRule}
                        onChange={(e) => setDosingRule(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        <option value="youngs">Young&apos;s Rule (Age 1–12 yrs)</option>
                        <option value="dillings">Dilling&apos;s Rule (Age 4–20 yrs)</option>
                        <option value="clarks">Clark&apos;s Rule (Weight-based)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Child Age (`age_yrs`)</label>
                      <input
                        type="number"
                        value={childAge}
                        onChange={(e) => setChildAge(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Child Weight (`weight_kg`)</label>
                      <input
                        type="number"
                        value={childWeight}
                        onChange={(e) => setChildWeight(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Adult Dose in mg (`adult_mg`)</label>
                      <input
                        type="number"
                        value={adultDose}
                        onChange={(e) => setAdultDose(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {selectedScript === 'dilution' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Stock Conc. mg/mL (`stock_conc`)</label>
                      <input
                        type="number"
                        value={stockConc}
                        onChange={(e) => setStockConc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Dilution Factor (`dilution_factor`)</label>
                      <input
                        type="number"
                        value={dilutionFactor}
                        onChange={(e) => setDilutionFactor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Number of Tubes (`tubes`, max 12)</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={numTubes}
                        onChange={(e) => setNumTubes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {selectedScript === 'renal' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Patient Age (`age`)</label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Weight in kg (`weight_kg`)</label>
                      <input
                        type="number"
                        value={patientWeight}
                        onChange={(e) => setPatientWeight(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Serum Creatinine mg/dL (`scr`)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={serumCreatinine}
                        onChange={(e) => setSerumCreatinine(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        id="femaleCheck"
                        type="checkbox"
                        checked={isFemale}
                        onChange={(e) => setIsFemale(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                      />
                      <label htmlFor="femaleCheck" className="text-xs text-slate-300">
                        Female Patient (`female=True`, &times;0.85 factor)
                      </label>
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

              {/* Right Pane: Python Source Code + Live Terminal (8 cols) */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">script.py (Python 3.11)</span>
                    <span className="text-[11px] text-blue-400 font-medium">Auto-updates with your inputs</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    {getPythonCode()}
                  </pre>
                </div>

                {/* Live Output Terminal */}
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
                      Click &ldquo;Run Python Script&rdquo; to execute the pharmaceutical code above...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Placeholder Banner for Units III, IV, V (Ready for next build steps) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Layers className="w-10 h-10 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">
            {activeUnit === 'unit3' && 'Unit III: Data Structures, File Handling & NumPy'}
            {activeUnit === 'unit4' && 'Unit IV: Pharmaceutical Data Handling with Pandas'}
            {activeUnit === 'unit5' && 'Unit V: Pharmacokinetic Visualization with Matplotlib'}
          </h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Unit I &amp; II are live! Say the word whenever you are ready to build out this next unit with interactive NumPy quality-control arrays, Pandas ADR DataFrames, and Matplotlib concentration-time curves.
          </p>
        </div>
      )}
    </div>
  );
}
