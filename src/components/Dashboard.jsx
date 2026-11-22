import React, { useState } from 'react';
import {
  Code,
  FlaskConical,
  Activity,
  Microscope,
  TestTube,
  ArrowRight,
  Search,
  MessageSquareHeart,
  Compass,
  BookOpen,
  Play
} from 'lucide-react';
import { QUICK_INDEX } from './CommandPalette';

export default function Dashboard({
  onSelectModule,
  onOpenPalette,
  visitedModules = [],
  lastModule = 'anatomy'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [spotlightId, setSpotlightId] = useState('anatomy_heart');

  const modules = [
    {
      id: 'anatomy',
      category: 'bio',
      title: 'Human Anatomy, Physiology & Pathophysiology I',
      code: 'BP104T / BP109P',
      meta: '17 Practicals · 7 Diagrams · Units I–V Theory',
      desc: 'Interactive annotated diagrams (Heart, Cell, Skin, Skeleton, Eye/Ear, Neuron), hemocytometry, DLC, RBC indices, ABO/Rh grouping, ECG & clinical case files.',
      icon: Activity,
      accent: 'text-amber-600 dark:text-amber-400',
      quickLinks: [
        { label: '2D/3D Diagrams', tab: 'diagrams' },
        { label: 'Theory', tab: 'theory' },
        { label: 'Hematology & ECG', tab: 'hematology' }
      ]
    },
    {
      id: 'inorganic',
      category: 'chem',
      title: 'Pharmaceutical Inorganic & Analytical Chemistry',
      code: 'BP106T / BP111P',
      meta: '18 Practicals · 6 Diagrams · Units I–V Theory',
      desc: 'Live burette titration simulator with primary standardization, Gutzeit & Nessler diagrams, IP Limit Tests, stoichiometric prep scaler, and KIO₃ purity assays.',
      icon: TestTube,
      accent: 'text-cyan-700 dark:text-cyan-400',
      quickLinks: [
        { label: 'Apparatus Diagrams', tab: 'diagrams' },
        { label: 'Live Burette', tab: 'titration' },
        { label: 'Limit Tests', tab: 'limit_tests' }
      ]
    },
    {
      id: 'general_pharmacy',
      category: 'chem',
      title: 'Pharmaceutics (General Pharmacy)',
      code: 'BP102T / BP107P',
      meta: '15 Formulations · 6 Calculators · Units I–V Theory',
      desc: 'Batch-scaled IP/BPC/WHO formulations (Solutions, Syrups, ORS, Suppositories, Semisolids, Gargles), Posology, Proof Spirit, Alligation & Isotonicity.',
      icon: FlaskConical,
      accent: 'text-emerald-600 dark:text-emerald-400',
      quickLinks: [
        { label: 'Wet-Lab Bench', tab: 'experiments' },
        { label: 'Posology & Proof', tab: 'posology_proof' },
        { label: 'Theory', tab: 'theory' }
      ]
    },
    {
      id: 'pharmacognosy',
      category: 'bio',
      title: 'Introduction to Pharmacognosy',
      code: 'BP105T / BP110P',
      meta: '14 Practicals · 20 Plants · Units I–V Theory',
      desc: 'Unit V phytopharmaceuticals, powder microscopy, stomatal index, vein-islet, eyepiece micrometry, Lycopodium spore purity, ash/swelling QC & voucher builder.',
      icon: Microscope,
      accent: 'text-purple-700 dark:text-purple-400',
      quickLinks: [
        { label: 'Micrometry & Index', tab: 'leaf_constants' },
        { label: 'Plant Morphology', tab: 'morphology' },
        { label: 'Theory', tab: 'theory' }
      ]
    },
    {
      id: 'psychology',
      category: 'humanities',
      title: 'Healthcare Psychology & Communication Skills',
      code: 'BP103T / BP108P',
      meta: '5 Practicals · Role-Plays · Units I–V Theory',
      desc: 'SPIKES bad-news delivery, chronic care counseling, crisis Psychological First Aid, primary-care case studies, SBAR handover, IEC builder & reflection logs.',
      icon: MessageSquareHeart,
      accent: 'text-rose-600 dark:text-rose-400',
      quickLinks: [
        { label: 'Role-Plays', tab: 'roleplay' },
        { label: 'SBAR Handover', tab: 'peer' },
        { label: 'Theory', tab: 'theory' }
      ]
    },
    {
      id: 'python',
      category: 'data',
      title: 'Python & Pharmaceutical Data Science',
      code: 'BP101T (Python + Pandas)',
      meta: 'Live Pyodide IDE · Units I–V · PK Visualization',
      desc: 'In-browser Python execution, BMI & pediatric dosing algorithms, NumPy QC arrays, Pandas DataFrames for PK/ADR datasets, and concentration-time plots.',
      icon: Code,
      accent: 'text-blue-600 dark:text-blue-400',
      quickLinks: [
        { label: 'Python IDE', tab: null, targetModule: 'python' },
        { label: 'Pandas & Plots', tab: null, targetModule: 'pandas' }
      ]
    }
  ];

  const spotlights = {
    anatomy_heart: {
      label: 'Anatomy Diagrams',
      title: 'Human Heart & Conduction System',
      detail: 'Inspect 9 numbered anatomical landmarks across chambers, valves, SA/AV nodes, and Purkinje fibers alongside 6 additional interactive organ and histology diagrams.',
      metricLabel: 'Interactive Diagrams',
      metricVal: '7 Modules · 50+ Markers',
      module: 'anatomy',
      tab: 'diagrams'
    },
    inorganic_burette: {
      label: 'Titration & Assays',
      title: 'Volumetric Burette & Standardization',
      detail: 'Simulate 0.1 mL drop-by-drop endpoints across Acid-Base, Cerimetry, Iodometry, EDTA, Permanganometry, Non-Aqueous, and Volhard assays with primary standard scaling.',
      metricLabel: 'Official Assays',
      metricVal: '7 Methods + Gutzeit & Nessler',
      module: 'inorganic',
      tab: 'titration'
    },
    general_compounding: {
      label: 'Compounding Bench',
      title: 'Batch Scaling & Posology Calculators',
      detail: 'Scale 15 official IP/BPC/WHO formulas from 0.5× to 5.0× batches with dispensing labels, displacement values, isotonicity, and pediatric dosing rules.',
      metricLabel: 'Formulations',
      metricVal: '15 IP / BPC / WHO Recipes',
      module: 'general_pharmacy',
      tab: 'experiments'
    },
    python_pk: {
      label: 'Data & PK Plots',
      title: 'In-Browser Python & Pharmacokinetics',
      detail: 'Inspect Oral vs IV plasma concentration curves, ADR reporting rates, dissolution profiles, and execute live pharmaceutical scripts without local setup.',
      metricLabel: 'Execution Engine',
      metricVal: 'Live Pyodide + Pandas',
      module: 'pandas',
      tab: null
    }
  };

  const activeSpotlight = spotlights[spotlightId] || spotlights.anatomy_heart;

  const filteredModules = modules.filter((mod) => {
    const matchesCat = categoryFilter === 'all' || mod.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      mod.title.toLowerCase().includes(q) ||
      mod.code.toLowerCase().includes(q) ||
      mod.desc.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const directHits = searchQuery.trim()
    ? QUICK_INDEX.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sub.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const lastMeta = modules.find((m) => m.id === lastModule) || modules[0];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 py-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              PCI B.Pharm Curriculum · Semester I Virtual Laboratory
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12] text-balance">
              Master Practical Pharmacy, Anatomy &amp; Chemistry in One Bench
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl leading-relaxed">
              Explore annotated anatomical and apparatus diagrams, run volumetric titrations and limit tests, scale compounding formulas, and verify Units I–V theory aligned cleanly with BP101T–BP111P.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onSelectModule(lastMeta.id)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Open {lastMeta.code.split(' ')[0]} Lab</span>
              </button>
              <button
                onClick={onOpenPalette}
                className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Browse Experiment Index (⌘K)</span>
              </button>
            </div>

            {/* Live Instant Search + Direct Hits */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter subjects or jump to an experiment (e.g. Gutzeit, Heart, EDTA, ORS)..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {directHits.length > 0 && (
                <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800/70 overflow-hidden shadow-lg">
                  {directHits.map((hit) => (
                    <button
                      key={hit.title}
                      onClick={() => onSelectModule(hit.module, hit.tab)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 truncate">{hit.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{hit.sub}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Lab Spotlight Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-sm dark:shadow-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Featured Lab Workbenches</span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Interactive Preview</span>
            </div>

            {/* Switcher Controls */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              {Object.entries(spotlights).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setSpotlightId(key)}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors truncate ${
                    spotlightId === key
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeSpotlight.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{activeSpotlight.detail}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{activeSpotlight.metricLabel}</span>
              <span className="text-base font-semibold text-slate-900 dark:text-white tabular-nums">
                {activeSpotlight.metricVal}
              </span>
            </div>
            <button
              onClick={() => onSelectModule(activeSpotlight.module, activeSpotlight.tab)}
              className="px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25 border border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Launch Workbench</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Curriculum Telemetry Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border-y border-slate-200 dark:border-slate-800 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {[
          { label: 'Core Curriculum', value: '6 Subjects', sub: 'BP101T to BP106T' },
          { label: 'Virtual Practicals', value: '64+ Labs', sub: 'BP107P to BP111P aligned' },
          { label: 'Visual Reference', value: '13 Diagrams', sub: 'Clickable anatomical & apparatus pins' },
          { label: 'Your Session Progress', value: `${visitedModules.length} / 7`, sub: 'Workspaces explored' }
        ].map((stat) => (
          <div key={stat.label} className="py-5 px-4 first:pl-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Subject Directory with Category Filter */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Semester I Subject Workspaces</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Select a module or jump straight into its diagrams, theory units, or lab bench.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            {[
              { id: 'all', label: 'All Subjects' },
              { id: 'bio', label: 'Anatomy & Pharmacognosy' },
              { id: 'chem', label: 'Chemistry & Pharmaceutics' },
              { id: 'humanities', label: 'Psychology' },
              { id: 'data', label: 'Python & Data' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === f.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModules.length > 0 ? (
            filteredModules.map((mod) => {
              const Icon = mod.icon;
              const explored = visitedModules.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => onSelectModule(mod.id)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between space-y-5 shadow-sm dark:shadow-none"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0">
                        <span className={`font-semibold ${mod.accent}`}>{mod.code}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{mod.meta}</span>
                      </div>
                      <Icon className={`w-5 h-5 shrink-0 ${mod.accent}`} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div
                      className="flex flex-wrap items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {mod.quickLinks.map((ql) => (
                        <button
                          key={ql.label}
                          onClick={() => onSelectModule(ql.targetModule || mod.id, ql.tab)}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
                        >
                          {ql.label}
                        </button>
                      ))}
                    </div>

                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                      <span>{explored ? 'Reopen Lab' : 'Open Lab'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-slate-600 dark:text-slate-400 text-base">
                No laboratory modules found matching "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
