import React, { useState } from 'react';
import { Code, FlaskConical, Activity, Microscope, TestTube, ArrowRight, Search } from 'lucide-react';

export default function Dashboard({ setActiveModule }) {
  const [searchQuery, setSearchQuery] = useState('');

  const modules = [
    {
      id: 'python',
      title: 'Python Programming',
      code: 'BP101T',
      desc: 'BMI calculator and Young\'s Rule pediatric dosage computational tools.',
      icon: Code,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'general-pharmacy',
      title: 'General Pharmacy',
      code: 'BP102T / BP107P',
      desc: 'Alligation method calculations and C1V1 = C2V2 solution dilution engine.',
      icon: FlaskConical,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'anatomy',
      title: 'Human Anatomy & Physiology',
      code: 'BP104T / BP109P',
      desc: 'Hemocytometry WBC count analyzer and Hemoglobin clinical diagnostic evaluator.',
      icon: Activity,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'pharmacognosy',
      title: 'Pharmacognosy & Phytochemistry',
      code: 'BP105T / BP110P',
      desc: 'Crude drug quantitative microscopy, stomatal index, and leaf constant tools.',
      icon: Microscope,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'inorganic-chemistry',
      title: 'Inorganic & Analytical Chemistry',
      code: 'BP106T / BP111P',
      desc: 'Acid-base titration stoichiometry and limit test protocol checklists.',
      icon: TestTube,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    }
  ];

  const filteredModules = modules.filter((mod) => 
    mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mod.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider">
          Semester I Virtual Lab
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4 mb-3">
          Welcome to PharmLab Studio
        </h2>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base mb-6">
          Select an interactive laboratory module below to execute pharmaceutical calculations, analyze diagnostic metrics, and explore curriculum-aligned practical workflows.
        </p>

        {/* Global Search Bar */}
        <div className="relative max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by module name, subject code, or keyword (e.g., BP101T, BMI, Titration)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner transition-colors"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredModules.length > 0 ? (
          filteredModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl border ${mod.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                      {mod.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">
                    {mod.desc}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm font-semibold text-emerald-400 mt-6 pt-4 border-t border-slate-800/60 group-hover:translate-x-1 transition-transform">
                  <span>Launch Laboratory Module</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">No laboratory modules found matching "{searchQuery}".</p>
          </div>
        )}
      </div>
    </div>
  );
}
