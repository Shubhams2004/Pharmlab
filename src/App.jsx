import React, { useState } from 'react';
import PandasModule from './modules/bp101t-python/PandasModule';

export default function App() {
  const [activeTab, setActiveTab] = useState('pandas');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Pharmlab
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">B.Pharm Semester I Portal</p>
          </div>

          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 pb-1">BP101T Computer Applications</div>
            <button
              onClick={() => setActiveTab('pandas')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'pandas' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Unit IV: Data Handling (Pandas)
            </button>
            
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 pt-4 pb-1">Other Modules</div>
            <button
              onClick={() => setActiveTab('pharmacognosy')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'pharmacognosy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              BP105T Pharmacognosy
            </button>
            <button
              onClick={() => setActiveTab('python_basics')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'python_basics' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Python Basics & Syntax
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400">
          Shubham Sonale &bull; Y. B. Chavan College of Pharmacy
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'pandas' && <PandasModule />}
        {activeTab === 'pharmacognosy' && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">BP105T - Pharmacognosy & Phytochemistry I</h2>
            <p className="text-slate-400 text-sm">Study of crude drugs, classification, evaluation, and plant tissue culture.</p>
          </div>
        )}
        {activeTab === 'python_basics' && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">BP101T - Python Fundamentals</h2>
            <p className="text-slate-400 text-sm">Variables, control structures, functions, and pharmaceutical scripting.</p>
          </div>
        )}
      </main>
    </div>
  );
}
