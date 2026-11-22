import React, { useState } from 'react';
import { Database, Filter, RefreshCw, CheckCircle2, FileSpreadsheet, BarChart3, Terminal } from 'lucide-react';

export default function PandasModule() {
  const [datasetType, setDatasetType] = useState('pk');
  const [missingAction, setMissingAction] = useState('raw');
  const [inspectMethod, setInspectMethod] = useState('head');
  const [filterMode, setFilterMode] = useState('all');

  const pkData = [
    { id: 1, patient: 'P-001', drug: 'Amoxicillin', time_hr: 0.5, conc_mcg_ml: 14.2, status: 'Completed' },
    { id: 2, patient: 'P-002', drug: 'Amoxicillin', time_hr: 1.0, conc_mcg_ml: null, status: 'Pending' },
    { id: 3, patient: 'P-003', drug: 'Amoxicillin', time_hr: 2.0, conc_mcg_ml: 22.1, status: 'Completed' },
    { id: 4, patient: 'P-004', drug: 'Ciprofloxacin', time_hr: 4.0, conc_mcg_ml: 12.4, status: 'Completed' },
    { id: 5, patient: 'P-005', drug: 'Ciprofloxacin', time_hr: 6.0, conc_mcg_ml: 6.8, status: 'Completed' },
    { id: 6, patient: 'P-006', drug: 'Ciprofloxacin', time_hr: 8.0, conc_mcg_ml: 3.1, status: 'Completed' },
  ];

  const adrData = [
    { report_id: 'ADR-101', drug: 'Paracetamol', age: 42, severity: 'Mild', reaction: 'Nausea', reporter: 'Nurse A' },
    { report_id: 'ADR-102', drug: 'Amoxicillin', age: 58, severity: 'Moderate', reaction: 'Rash', reporter: 'Dr. Smith' },
    { report_id: 'ADR-103', drug: 'Ibuprofen', age: 67, severity: 'Severe', reaction: 'GI Bleed', reporter: 'Pharmacist B' },
    { report_id: 'ADR-104', drug: 'Metformin', age: 51, severity: 'Mild', reaction: 'Dyspepsia', reporter: 'Dr. Jones' },
    { report_id: 'ADR-105', drug: 'Ibuprofen', age: 71, severity: 'Severe', reaction: 'Renal Impairment', reporter: 'Dr. Patel' },
    { report_id: 'ADR-106', drug: 'Amoxicillin', age: 34, severity: 'Mild', reaction: 'Urticaria', reporter: 'Pharmacist C' },
  ];

  const baseData = datasetType === 'pk' ? pkData : adrData;

  const pkMeanConc = 11.72;
  const cleanedData = baseData
    .map((row) => {
      if (datasetType === 'pk' && missingAction === 'fill' && row.conc_mcg_ml === null) {
        return { ...row, conc_mcg_ml: pkMeanConc, status: 'Imputed (Mean)' };
      }
      return row;
    })
    .filter((row) => {
      if (datasetType === 'pk' && missingAction === 'drop' && row.conc_mcg_ml === null) return false;
      if (datasetType === 'pk' && filterMode === 'high_conc') return (row.conc_mcg_ml ?? 0) >= 10;
      if (datasetType === 'adr' && filterMode === 'severe') return row.severity === 'Severe';
      return true;
    });

  const displayedRows =
    inspectMethod === 'head'
      ? cleanedData.slice(0, 5)
      : inspectMethod === 'tail'
      ? cleanedData.slice(-3)
      : cleanedData;

  const numericValues =
    datasetType === 'pk'
      ? cleanedData.map((r) => r.conc_mcg_ml).filter((v) => v !== null)
      : cleanedData.map((r) => r.age);

  const count = numericValues.length;
  const mean = count > 0 ? numericValues.reduce((a, b) => a + b, 0) / count : 0;
  const minVal = count > 0 ? Math.min(...numericValues) : 0;
  const maxVal = count > 0 ? Math.max(...numericValues) : 0;
  const variance =
    count > 1 ? numericValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count - 1) : 0;
  const std = Math.sqrt(variance);

  // Groupby computation
  const groupedSummary =
    datasetType === 'pk'
      ? ['Amoxicillin', 'Ciprofloxacin'].map((drug) => {
          const rows = cleanedData.filter((r) => r.drug === drug && r.conc_mcg_ml !== null);
          const avg = rows.length ? rows.reduce((s, r) => s + r.conc_mcg_ml, 0) / rows.length : 0;
          return { group: drug, count: rows.length, metricLabel: 'Mean Conc (mcg/mL)', value: avg.toFixed(2) };
        })
      : ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Metformin'].map((drug) => {
          const rows = cleanedData.filter((r) => r.drug === drug);
          const severeCount = rows.filter((r) => r.severity === 'Severe').length;
          return { group: drug, count: rows.length, metricLabel: 'Severe Reports', value: severeCount };
        });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">BP101T · Unit IV · Data Handling with Pandas</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 dark:text-white">Pharmaceutical Dataset & ADR Report Analyzer</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1 leading-relaxed">
          Master Pandas DataFrames, Series, CSV/Excel ingestion, inspection (head, tail, info, describe), missing value handling, conditional filtering, and groupby aggregation.
        </p>
      </div>

      {/* Dataset Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setDatasetType('pk'); setFilterMode('all'); }}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            datasetType === 'pk' ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          PK Study Concentration Dataset (CSV)
        </button>
        <button
          onClick={() => { setDatasetType('adr'); setFilterMode('all'); }}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            datasetType === 'adr' ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          ADR Safety Reports Dataset (Excel)
        </button>
      </div>

      {/* Operations Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Data Cleaning & Conditional Filtering</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMissingAction('raw')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                missingAction === 'raw' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Raw DataFrame
            </button>
            <button
              onClick={() => setMissingAction('drop')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                missingAction === 'drop' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              df.dropna()
            </button>
            <button
              onClick={() => setMissingAction('fill')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                missingAction === 'fill' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              df.fillna(mean)
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border ${
                filterMode === 'all' ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Rows
            </button>
            {datasetType === 'pk' ? (
              <button
                onClick={() => setFilterMode('high_conc')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border ${
                  filterMode === 'high_conc' ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                df[df['conc_mcg_ml'] &gt;= 10]
              </button>
            ) : (
              <button
                onClick={() => setFilterMode('severe')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border ${
                  filterMode === 'severe' ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                df[df['severity'] == 'Severe']
              </button>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
            df.shape → ({cleanedData.length} rows, {Object.keys(baseData[0]).length} columns)
          </p>
        </div>

        {/* Inspection Method Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-2">
            <Terminal className="w-4 h-4" />
            <span>DataFrame Inspection Methods</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'head', label: 'df.head(5)' },
              { id: 'tail', label: 'df.tail(3)' },
              { id: 'info', label: 'df.info()' },
              { id: 'describe', label: 'df.describe()' },
              { id: 'groupby', label: "df.groupby('drug')" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setInspectMethod(m.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  inspectMethod === m.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-code text-xs text-emerald-700 dark:text-emerald-300">
            {datasetType === 'pk'
              ? `> df = pd.read_csv('pk_study_dataset.csv')`
              : `> df = pd.read_excel('adr_safety_reports.xlsx')`}
          </div>
        </div>
      </div>

      {/* Main Inspector Output */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {inspectMethod === 'head' && 'DataFrame Inspector — df.head(5)'}
                {inspectMethod === 'tail' && 'DataFrame Inspector — df.tail(3)'}
                {inspectMethod === 'info' && 'Schema & Null Audit — df.info()'}
                {inspectMethod === 'describe' && 'Summary Statistics — df.describe()'}
                {inspectMethod === 'groupby' && "Grouped Aggregation — df.groupby('drug')"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Live output reflecting cleaning and filtering operations.</p>
            </div>
          </div>
        </div>

        {(inspectMethod === 'head' || inspectMethod === 'tail') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  {Object.keys(baseData[0]).map((key) => (
                    <th key={key} className="pb-3 px-3">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {displayedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {Object.entries(row).map(([, val], i) => (
                      <td key={i} className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {val === null ? <span className="text-rose-600 dark:text-rose-400 font-bold">NaN (Missing)</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {inspectMethod === 'info' && (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-code text-sm space-y-2 text-slate-700 dark:text-slate-300">
            <p className="text-emerald-700 dark:text-emerald-400">&lt;class 'pandas.core.frame.DataFrame'&gt;</p>
            <p>RangeIndex: {cleanedData.length} entries</p>
            <p>Data columns (total {Object.keys(baseData[0]).length} columns):</p>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1">
              {Object.keys(baseData[0]).map((col, idx) => {
                const nonNull = cleanedData.filter((r) => r[col] !== null && r[col] !== undefined).length;
                const sampleVal = baseData[0][col];
                const dtype = typeof sampleVal === 'number' ? (Number.isInteger(sampleVal) ? 'int64' : 'float64') : 'object';
                return (
                  <div key={col} className="grid grid-cols-4 text-slate-700 dark:text-slate-300">
                    <span>{idx}  {col}</span>
                    <span>{nonNull} non-null</span>
                    <span className="text-blue-600 dark:text-blue-400">{dtype}</span>
                    <span className="text-slate-500">{nonNull < cleanedData.length ? 'Has NaN' : 'Complete'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {inspectMethod === 'describe' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Count', val: count },
              { label: 'Mean', val: mean.toFixed(2) },
              { label: 'Std Dev', val: std.toFixed(2) },
              { label: 'Min', val: minVal.toFixed(2) },
              { label: 'Max', val: maxVal.toFixed(2) }
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{stat.val}</p>
              </div>
            ))}
          </div>
        )}

        {inspectMethod === 'groupby' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupedSummary.map((g) => (
              <div key={g.group} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{g.group}</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">Records: <strong className="text-slate-900 dark:text-white tabular-nums">{g.count}</strong></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{g.metricLabel}: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{g.value}</strong></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
