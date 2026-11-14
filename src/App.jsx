import React from 'react';
import PandasModule from './modules/bp101t-python/PandasModule';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Pharmlab - B.Pharm Semester I (BP101T)
        </h1>
      </header>
      <main>
        <PandasModule />
      </main>
    </div>
  );
}
