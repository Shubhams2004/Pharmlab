import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PythonModule from './modules/python/PythonModule';
import GeneralPharmacyModule from './modules/general-pharmacy/GeneralPharmacyModule';
import AnatomyModule from './modules/anatomy/AnatomyModule';
import PharmacognosyModule from './modules/pharmacognosy/PharmacognosyModule';
import { ArrowLeft, Beaker } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveModule('dashboard')}>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">PharmLab</h1>
            <p className="text-xs text-slate-400">B.Pharm Virtual Laboratory Platform</p>
          </div>
        </div>
        {activeModule !== 'dashboard' && (
          <button
            onClick={() => setActiveModule('dashboard')}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {activeModule === 'dashboard' && <Dashboard setActiveModule={setActiveModule} />}
        {activeModule === 'python' && <PythonModule />}
        {activeModule === 'general-pharmacy' && <GeneralPharmacyModule />}
        {activeModule === 'anatomy' && <AnatomyModule />}
        {activeModule === 'pharmacognosy' && <PharmacognosyModule />}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        PharmLab &bull; Academic Virtual Laboratory Suite for B.Pharm Semester I
      </footer>
    </div>
  );
}
