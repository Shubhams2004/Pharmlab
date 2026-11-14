import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PandasModule from './modules/bp101t-python/PandasModule';
import PythonModule from './modules/bp101t-python/PythonModule';
import PharmacognosyModule from './modules/bp105t-pharmacognosy/PharmacognosyModule';
import AnatomyModule from './modules/bp104t-anatomy/AnatomyModule';
import GeneralPharmacyModule from './modules/bp102t-general-pharmacy/GeneralPharmacyModule';
import InorganicChemistryModule from './modules/bp106t-inorganic-analysis/InorganicChemistryModule';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent cursor-pointer" onClick={() => setActiveModule('dashboard')}>
              Pharmlab
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">B.Pharm Semester I Portal</p>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveModule('dashboard')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                activeModule === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Dashboard Home
            </button>

            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 pt-4 pb-1">BP101T Computer Applications</div>
            <button
              onClick={() => setActiveModule('pandas')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                activeModule === 'pandas' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Unit IV: Data Handling (Pandas)
            </button>
            <button
              onClick={() => setActiveModule('python')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                activeModule === 'python' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Python Fundamentals
            </button>

            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 pt-4 pb-1">Core B.Pharm Subjects</div>
            <button
              onClick={() => setActiveModule('pharmacognosy')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                activeModule === 'pharmacognosy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              BP105T Pharmacognosy
            </button>
            <button
              onClick={() => setActiveModule('anatomy')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                activeModule === 'anatomy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              BP104T Human Anatomy & Physiology
            </button>
            <button
              onClick={() => setActiveModule('general_pharmacy')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                activeModule === 'general_pharmacy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              BP102T General Pharmacy
            </button>
            <button
              onClick={() => setActiveModule('inorganic')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all ${
                activeModule === 'inorganic' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              BP106T Inorganic Chemistry
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400">
          Shubham Sonale &bull; Y. B. Chavan College of Pharmacy
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeModule === 'dashboard' && <Dashboard onSelectModule={setActiveModule} />}
        {activeModule === 'pandas' && <PandasModule />}
        {activeModule === 'python' && <PythonModule />}
        {activeModule === 'pharmacognosy' && <PharmacognosyModule />}
        {activeModule === 'anatomy' && <AnatomyModule />}
        {activeModule === 'general_pharmacy' && <GeneralPharmacyModule />}
        {activeModule === 'inorganic' && <InorganicChemistryModule />}
      </main>
    </div>
  );
}
