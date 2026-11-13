import React, { useState } from 'react';
import { Database, Filter, RefreshCw, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export default function PandasModule() {
  const [datasetType, setDatasetType] = useState('pk');
  const [filterThreshold, setFilterThreshold] = useState(10);
  const [missingValueAction, setMissingValueAction] = useState('drop');

  // Sample PK dataset simulation
  const pkData = [
    { id: 1, patient: 'P-001', time_hr: 0.5, conc_mcg_ml: 14.2, status: 'Completed' },
    { id: 2, patient: 'P-002', time_hr: 1.0, conc_mcg_ml: 28.5, status: 'Completed' },
    { id: 3, patient: 'P-003', time_hr: 2.0, conc_mcg_ml: 22.1, status: 'Completed' },
    { id: 4, patient: 'P-004', time_hr: 4.0, conc_mcg_ml: 12.4, status: 'Pending' },
    { id: 5, patient: 'P-005', time_hr: 6.0, conc_mcg_ml: 6.8, status: 'Completed' },
    { id: 6, patient: 'P-006', time_hr: 8.0, conc_mcg_ml: 3.1, status: 'Completed' },
  ];

  const adrData = [
    { report_id: 'ADR-101', drug: 'Paracetamol', severity: 'Mild', reporter: 'Nurse A' },
    { report_id: 'ADR-102', drug: 'Amoxicillin', severity: 'Moderate', reporter: 'Dr. Smith' },
    { report_id: 'ADR-103', drug: 'Ibuprofen', severity: 'Severe', reporter: 'Pharmacist B' },
    { report_id: 'ADR-104', drug: 'Metformin', severity: 'Mild', reporter: 'Dr. Jones' },
  ];

  const activeData = datasetType === 'pk' ? pkData : adrData;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP101T • Unit IV • Data Handling with Pandas</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Pharmaceutical Dataset & ADR Report Analyzer</h2>
        <p className="text-slate-400 text-sm mt-1">Master Pandas DataFrames, data cleaning, filtering, and aggregation for pharmacokinetic studies and clinical trial reports.</p>
      </div>

      {/* Dataset Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDatasetType('pk')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            datasetType === 'pk' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          📈 PK Study Concentration Dataset
        </button>
        <button
          onClick={() => setDatasetType('adr')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            datasetType === 'adr' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          📋 ADR Safety Reports Dataset
        </button>
      </div>

      {/* DataFrame Inspector Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">DataFrame Inspector (.head() & .describe())</h3>
              <p className="text-xs text-slate-400">Inspecting rows, columns, and structural summaries of loaded clinical datasets.</p>
            </div>
          </div>
          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300 font-mono">
            Shape: ({activeData.length}, {Object.keys(activeData[0]).length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                {Object.keys(activeData[0]).map(key => (
                  <th key={key} className="pb-3 px-3 uppercase">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="py-3 px-3 text-slate-300">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 flex items-center space-x-3 text-xs text-emerald-300">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>Aligned with BP101T Unit IV curriculum objectives for processing structured healthcare and clinical datasets using Pandas.</span>
      </div>
    </div>
  );
}
