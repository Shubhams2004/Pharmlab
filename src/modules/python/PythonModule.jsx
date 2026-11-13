import React, { useState } from 'react';
import { Code, Play, BookOpen, Terminal, CheckCircle2, Sparkles, Sliders, Layers, BarChart3, Database } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('unit4');

  // Unit I & II / III State variables...
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

  // Unit IV State (Pandas ADR Datasets)
  const [severityFilter, setSeverityFilter] = useState('All');
  const [minAgeFilter, setMinAgeFilter] = useState(18);
  const [selectedDrugFilter, setSelectedDrugFilter] = useState('All');
  const [pandasOutput, setPandasOutput] = useState(null);

  const [consoleOutput, setConsoleOutput] = useState([]);

  // Mock ADR dataset for interactive simulation
  const mockADRDatabase = [
    { id: 'ADR-101', drug: 'Paracetamol', age: 45, severity: 'Mild', reaction: 'Nausea', outcome: 'Recovered' },
    { id: 'ADR-102', drug: 'Amlodipine', age: 68, severity: 'Severe', reaction: 'Peripheral Edema', outcome: 'Hospitalized' },
    { id: 'ADR-103', drug: 'Metformin', age: 52, severity: 'Moderate', reaction: 'Gastric Distress', outcome: 'Recovered' },
    { id: 'ADR-104', drug: 'Amlodipine', age: 71, severity: 'Severe', reaction: 'Hypotension', outcome: 'Recovered' },
    { id: 'ADR-105', drug: 'Atorvastatin', age: 60, severity: 'Moderate', reaction: 'Myalgia', outcome: 'Recovered' },
    { id: 'ADR-106', drug: 'Paracetamol', age: 22, severity: 'Mild', reaction: 'Rash', outcome: 'Recovered' },
    { id: 'ADR-107', drug: 'Metformin', age: 65, severity: 'Severe', reaction: 'Lactic Acidosis', outcome: 'Critical' },
    { id: 'ADR-108', drug: 'Atorvastatin', age: 58, severity: 'Severe', reaction: 'Hepatic Enzyme Elevation', outcome: 'Recovered' }
  ];

  // Syntax & Concept Cards for Unit IV
  const pandasSyntaxCards = [
    {
      unit: 'Unit IV',
      title: 'Loading DataFrames & Inspection',
      code: `import pandas as pd

# Load CSV clinical dataset
df = pd.read_csv('adr_reports.csv')
print(df.head())
print(df.info())`,
      note: 'Pandas DataFrames organize tabular healthcare data into rows and named columns with built-in data type tracking.'
    },
    {
      unit: 'Unit IV',
      title: 'Conditional Boolean Filtering',
      code: `# Filter severe ADR cases in elderly patients
severe_elderly = df[(df['Severity'] == 'Severe') & (df['Age'] > 60)]
print(severe_elderly.describe())`,
      note: 'Combine multiple conditions using bitwise operators (& for AND, | for OR) to isolate clinical safety signals.'
    },
    {
      unit: 'Unit IV',
      title: 'Handling Missing Data (Nulls)',
      code: `# Check and clean missing lab values
missing_counts = df.isnull().sum()
df_clean = df.dropna(subset=['SerumCreatinine'])`,
      note: 'Crucial for cleaning messy real-world electronic health records (EHR) before statistical analysis.'
    },
    {
      unit: 'Unit IV',
      title: 'Groupby & Aggregation',
      code: `# Count total ADR reports grouped by drug
drug_summary = df.groupby('DrugName')['Reaction'].count()
print(drug_summary.sort_values(ascending=False))`,
      note: 'Enables quick epidemiological tabulation of adverse events across therapeutic drug classes.'
    }
  ];

  // Generate Python Code Preview for Unit IV
  const getPythonCode = () => {
    return `# BP101T Unit IV: Pandas ADR Dataset Management
import pandas as pd

# Load clinical Adverse Drug Reaction (ADR) dataset
data = {
    'ReportID': ['ADR-101', 'ADR-102', 'ADR-103', 'ADR-104', 'ADR-105', 'ADR-106', 'ADR-107', 'ADR-108'],
    'DrugName': ['Paracetamol', 'Amlodipine', 'Metformin', 'Amlodipine', 'Atorvastatin', 'Paracetamol', 'Metformin', 'Atorvastatin'],
    'Age': [45, 68, 52, 71, 60, 22, 65, 58],
    'Severity': ['Mild', 'Severe', 'Moderate', 'Severe', 'Moderate', 'Mild', 'Severe', 'Severe'],
    'Reaction': ['Nausea', 'Edema', 'Gastric', 'Hypotension', 'Myalgia', 'Rash', 'Acidosis', 'Hepatic']
}
df = pd.DataFrame(data)

# --- Apply User Filters ---
sev_filter = "${severityFilter}"
min_age = ${minAgeFilter}
drug_filter = "${selectedDrugFilter}"

# Filtering DataFrame
filtered_df = df[df['Age'] >= min_age]
if sev_filter != 'All':
    filtered_df = filtered_df[filtered_df['Severity'] == sev_filter]
if drug_filter != 'All':
    filtered_df = filtered_df[filtered_df['DrugName'] == drug_filter]

print(f"Total Records Matching Filter: {len(filtered_df)}")
print(filtered_df.to_string(index=False))

# Groupby Summary: ADR Count by Drug
summary = filtered_df.groupby('DrugName').size()
print("\n--- ADR Count by Drug Class ---")
print(summary)`;
  };

  // Run Pandas Script Simulation
  const runPythonScript = () => {
    const timestamp = new Date().toLocaleTimeString();
    
    let filtered = mockADRDatabase.filter(r => r.age >= parseInt(minAgeFilter));
    if (severityFilter !== 'All') {
      filtered = filtered.filter(r => r.severity === severityFilter);
    }
    if (selectedDrugFilter !== 'All') {
      filtered = filtered.filter(r => r.drug === selectedDrugFilter);
    }

    // Groupby summary
    const summaryMap = {};
    filtered.forEach(r => {
      summaryMap[r.drug] = (summaryMap[r.drug] || 0) + 1;
    });

    setPandasOutput(filtered);

    const logLines = [
      `>>> Executing pandas_adr_analysis.py at ${timestamp}...`,
      `Importing pandas as pd ... [OK]`,
      `Loaded ADR database: 8 total records.`,
      `Applied filters -> Min Age: ${minAgeFilter}, Severity: ${severityFilter}, Drug: ${selectedDrugFilter}`,
      `Total Records Matching Filter: ${filtered.length}`,
      `----------------------------------------------------------------`,
      `ReportID   | DrugName     | Age | Severity  | Reaction`,
      `----------------------------------------------------------------`
    ];

    filtered.forEach(r => {
      logLines.push(`${r.id.padEnd(10)} | ${r.drug.padEnd(12)} | ${String(r.age).padEnd(3)} | ${r.severity.padEnd(9)} | ${r.reaction}`);
    });

    logLines.push(`----------------------------------------------------------------`);
    logLines.push(`--- ADR Count by Drug Class (groupby result) ---`);
    Object.entries(summaryMap).forEach(([drug, count]) => {
      logLines.push(`${drug}: ${count} report(s)`);
    });
    logLines.push(`>>> Process finished with exit code 0`);

    setConsoleOutput(logLines);
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
          { id: 'unit4', label: 'Unit IV: Pandas & ADR Datasets' },
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

      {/* UNIT IV CONTENT */}
      {activeUnit === 'unit4' ? (
        <div className="space-y-8">
          {/* Section 1: Pandas Syntax Reference Cards */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                Unit IV: Pandas DataFrames & Clinical Filtering Reference
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pandasSyntaxCards.map((card, idx) => (
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

          {/* Section 2: Interactive Pandas ADR Scripting Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Pandas Clinical ADR Dataset Filter Studio</h3>
                  <p className="text-xs text-slate-400">
                    Query and filter patient adverse drug reaction logs using Pandas DataFrame Boolean indexing and groupby grouping.
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
                  <span>DataFrame Filter Parameters</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Filter by Severity (`Severity`)</label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="All">All Severities</option>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Minimum Patient Age (`Age &gt;= min`)</label>
                    <input
                      type="number"
                      value={minAgeFilter}
                      onChange={(e) => setMinAgeFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Filter by Drug (`DrugName`)</label>
                    <select
                      value={selectedDrugFilter}
                      onChange={(e) => setSelectedDrugFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="All">All Drugs</option>
                      <option value="Paracetamol">Paracetamol</option>
                      <option value="Amlodipine">Amlodipine</option>
                      <option value="Metformin">Metformin</option>
                      <option value="Atorvastatin">Atorvastatin</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={runPythonScript}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-950"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Pandas ADR Script</span>
                </button>
              </div>

              {/* Right Pane: Code + Terminal */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">pandas_adr_analysis.py</span>
                    <span className="text-[11px] text-blue-400 font-medium">Pandas DataFrame Indexing</span>
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
                        <div key={i} className={line.startsWith('>>>') ? 'text-slate-500' : line.includes('Severe') ? 'text-rose-400 font-semibold' : 'text-emerald-300'}>
                          {line || ' '}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 italic">
                      Click &ldquo;Run Pandas ADR Script&rdquo; to execute dataset filtering...
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
          <h3 className="text-xl font-bold text-white">Unit IV: Pandas Clinical Data Management</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Switch to Unit IV tab above to explore Pandas DataFrames and Adverse Drug Reaction datasets.
          </p>
          <button
            onClick={() => setActiveUnit('unit4')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Go to Unit IV Studio
          </button>
        </div>
      )}
    </div>
  );
}
