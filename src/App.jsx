import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import PythonModule from './modules/python/PythonModule';
import GeneralPharmacyModule from './modules/general-pharmacy/GeneralPharmacyModule';
import AnatomyModule from './modules/anatomy/AnatomyModule';

export default function App() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeModule !== null && (
          <button 
            onClick={() => setActiveModule(null)}
            className="mb-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-400 font-semibold rounded-xl transition-colors shadow-md flex items-center space-x-2"
          >
            <span>&larr; Back to Dashboard</span>
          </button>
        )}

        {activeModule === null ? (
          <Dashboard onSelectModule={(moduleId) => setActiveModule(moduleId)} />
        ) : activeModule === 'python' ? (
          <PythonModule />
        ) : activeModule === 'general-pharmacy' ? (
          <GeneralPharmacyModule />
        ) : activeModule === 'anatomy' ? (
          <AnatomyModule />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Module: {activeModule.toUpperCase()}
            </h2>
            <p className="text-slate-400">
              This laboratory module is currently under development. Stay tuned!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
