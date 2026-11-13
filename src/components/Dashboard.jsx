import React from 'react';
import { Code, FlaskConical, Activity, Leaf, Atom, ArrowRight } from 'lucide-react';

export default function Dashboard({ onSelectModule }) {
  const modules = [
    {
      id: 'python',
      code: 'BP101T',
      title: 'Python for Pharmaceutical Sciences',
      desc: 'Interactive Python playground, NumPy/Pandas data handlers, and concentration-time curve plotter.',
      icon: Code,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'general-pharmacy',
      code: 'BP102T / BP107P',
      title: 'General Pharmacy & Compounding',
      desc: 'Pharmaceutical calculation engine for alligation, proof spirit, isotonicity, and dosage forms.',
      icon: FlaskConical,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'anatomy',
      code: 'BP104T / BP109P',
      title: 'Human Anatomy & Physiology I',
      desc: 'Hemocytometry calculator, blood cell differential analyzer, and physiological parameter tracker.',
      icon: Activity,
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'pharmacognosy',
      code: 'BP105T / BP110P',
      title: 'Introduction to Pharmacognosy',
      desc: 'Crude drug powder microscopy database, stomatal index calculator, and morphological guides.',
      icon: Leaf,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'chemistry',
      code: 'BP106T / BP111P',
      title: 'Inorganic & Analytical Chemistry',
      desc: 'Volumetric titration simulators, limit test protocols (Chloride, Sulphate, Iron), and assay calculators.',
      icon: Atom,
      color: 'from-purple-500 to-violet-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-12">
        <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-teal-400 uppercase bg-teal-950/50 border border-teal-800/50 rounded-full">
          B.Pharm Semester I Virtual Laboratory
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          PharmLab Studio
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Your integrated computational and practical laboratory platform aligned with curriculum guidelines. Select a module below to begin.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              onClick={() => onSelectModule(m.id)}
              className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">
                  {m.code}
                </span>
                <h3 className="text-xl font-bold text-white mt-1 mb-3 group-hover:text-teal-300 transition-colors">
                  {m.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {m.desc}
                </p>
              </div>
              <div className="flex items-center text-sm font-semibold text-teal-400 group-hover:text-teal-300">
                <span>Launch Laboratory</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
