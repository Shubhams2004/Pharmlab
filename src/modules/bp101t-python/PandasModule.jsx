import React, { useState } from 'react';
import { Database, Filter, RefreshCw, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export default function PandasModule() {
  const [datasetType, setDatasetType] = useState('pk');
  const [missingAction, setMissingAction] = useState('drop');
  const [cleanedRowsCount, setCleanedRowsCount] = useState(6);

  const pkData = [
    { id: 1, patient: 'P-001', time_hr: 0.5, conc_mcg_ml: 14.2, status: 'Completed' },
    { id: 2, patient: 'P-002', time_hr: 1.0, conc_mcg_ml: null, status: 'Pending' },
    { id: 3, patient: 'P-003', time_hr: 2.0, conc_mcg_ml: 22.1, status: 'Completed' },
    { id: 4, patient: 'P-004', time_hr: 4.0, conc_mcg_ml: 12.4, status: 'Completed' },
    { id: 5, patient: 'P-005', time_hr: 6.0, conc_mcg_ml: 6.8, status: 'Completed' },
    { id: 6, patient: 'P-006', time_hr: 8.0, conc_mcg_ml: 3.1, status: 'Completed' },
  ];

  const adrData = [
    { report_id: 'ADR-101', drug: 'Paracetamol', severity: 'Mild', reporter: 'Nurse A' },
    { report_id: 'ADR-102', drug: 'Amoxicillin', severity: 'Moderate', reporter: 'Dr. Smith' },
    { report_id: 'ADR-103', drug: 'Ibuprofen', severity: 'Severe', reporter: 'Pharmacist B' },
    { report_id: 'ADR-104', drug: 'Metformin', severity: 'Mild', reporter: 'Dr. Jones' },
  ];

  const handleDataClean = (action) => {
    setMissingAction(action);
    if (action === 'drop') {
      setCleanedRowsCount(5);
    } else {
      setCleanedRowsCount(6);
    }
  };

  const activeData = datasetType === 'pk' ? pkData : adrData;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP101T - Unit IV - Data Handling with Pandas</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Pharmaceutical Dataset & ADR Report Analyzer</h2>
        <p className="text-slate-400 text-sm mt-1">Master Pandas DataFrames, data cleaning, filtering, and aggregation for pharmacokinetic studies and clinical trial reports.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDatasetType('pk')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            datasetType === 'pk' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          PK Study Concentration Dataset
        </button>
        <button
          onClick={() => setDatasetType('adr')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            datasetType === 'adr' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ADR Safety Reports Dataset
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Pandas Data Cleaning Operations (.dropna() / .fillna())</span>
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDataClean('drop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              missingAction === 'drop' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            df.dropna() [Drop Null Rows]
          </button>
          <button
            onClick={() => handleDataClean('fill')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              missingAction === 'fill' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            df.fillna(mean) [Impute Missing Values]
          </button>
        </div>
        <p className="text-xs text-slate-400 font-mono">
          Resulting DataFrame Shape: ({cleanedRowsCount} rows, {Object.keys(activeData[0]).length} columns)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">DataFrame Inspector (.head())</h3>
              <p className="text-xs text-slate-400">Inspecting records after cleaning operations.</p>
            </div>
          </div>
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
              {activeData.map((row, idx) => {
                if (missingAction === 'drop' && row.conc_mcg_ml === null) return null;
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    {Object.entries(row).map(([k, val], i) => (
                      <td key={i} className="py-3 px-3 text-slate-300">
                        {val === null ? <span className="text-rose-400 font-bold">NaN (Missing)</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
