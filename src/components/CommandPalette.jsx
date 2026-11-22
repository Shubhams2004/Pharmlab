import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Compass, BookOpen, FlaskConical, Activity, Microscope, Code, MessageSquareHeart, Library, Images } from 'lucide-react';

export const QUICK_INDEX = [
  // Knowledge & Visual Libraries
  { title: 'Knowledge Library (PDF Textbook Reader & Search)', sub: 'Offline IndexedDB PDF Repository · Full-Book Search, Notes & Diagram Crop', module: 'knowledge_library', tab: null, cat: 'Library', icon: Library },
  { title: 'Scientific Visual Library & Open-Access Atlas', sub: 'Anatomical Plates, Microscopy, Apparatus & Open-Access Discovery', module: 'visual_library', tab: null, cat: 'Media', icon: Images },

  // Anatomy & Diagrams
  { title: 'Heart, Valves & Conduction Diagram', sub: 'BP104T · Interactive Annotated 2D/3D Diagram', module: 'anatomy', tab: 'diagrams', cat: 'Diagram', icon: Activity },
  { title: 'Eukaryotic Cell Organelles Diagram', sub: 'BP104T · Unit I Cell Membrane & Organelles', module: 'anatomy', tab: 'diagrams', cat: 'Diagram', icon: Activity },
  { title: 'Human Skeleton (Axial 80 & Appendicular 126)', sub: 'BP109P · Exp 4 & 5 Osteology Explorer', module: 'anatomy', tab: 'bones', cat: 'Practical', icon: Activity },
  { title: 'Skin Cross-Section & Eye / Ear Special Senses', sub: 'BP104T · Unit II & IV Annotated Diagrams', module: 'anatomy', tab: 'diagrams', cat: 'Diagram', icon: Activity },
  { title: 'Hemocytometry: WBC, DLC, RBC & Hemoglobin', sub: 'BP109P · Exp 6–13 Hematology Bench', module: 'anatomy', tab: 'hematology', cat: 'Practical', icon: Activity },
  { title: 'ECG Rhythm & Blood Pressure Analyzer', sub: 'BP109P · Exp 14–15 Sinus / Brady / Tachy / STEMI', module: 'anatomy', tab: 'cardio', cat: 'Simulator', icon: Activity },
  { title: 'BP104T Anatomy & Pathophysiology Theory', sub: 'Units I–V · Cardiac Output Calculator & 12 Cranial Nerves', module: 'anatomy', tab: 'theory', cat: 'Theory', icon: BookOpen },

  // Inorganic Chemistry
  { title: 'Gutzeit Arsenic Apparatus & Nessler Comparator', sub: 'BP111P · Exp 1a–1e Limit Test Diagrams', module: 'inorganic', tab: 'diagrams', cat: 'Diagram', icon: Compass },
  { title: 'Neutralization Curves & Radiation Shielding Diagrams', sub: 'BP106T · Units I, III & IV Annotated Visuals', module: 'inorganic', tab: 'diagrams', cat: 'Diagram', icon: Compass },
  { title: 'Live Burette Assays & Titrant Standardization', sub: 'BP111P · Exp 4a–4g (HCl, Cerimetry, EDTA, Volhard)', module: 'inorganic', tab: 'titration', cat: 'Simulator', icon: FlaskConical },
  { title: 'IP Limit Tests Simulator (Cl⁻, SO₄²⁻, Fe, Pb, As)', sub: 'BP111P · Exp 1a–1e + ppm Comparator', module: 'inorganic', tab: 'limit_tests', cat: 'Practical', icon: FlaskConical },
  { title: 'Inorganic Preparations & Stoichiometric Scaler', sub: 'BP111P · Exp 2a–2d Al(OH)₃, Alum, FeSO₄, MgSO₄', module: 'inorganic', tab: 'preparations', cat: 'Practical', icon: FlaskConical },
  { title: 'Bentonite Swelling, ANC & Potassium Iodate Test', sub: 'BP111P · Exp 3a–3c Purity Tests', module: 'inorganic', tab: 'purity', cat: 'Practical', icon: FlaskConical },
  { title: 'BP106T Inorganic Chemistry Theory', sub: 'Units I–V · Solution Converter, Buffer pH & Isotope Decay', module: 'inorganic', tab: 'theory', cat: 'Theory', icon: BookOpen },

  // General Pharmacy
  { title: '15 IP/BPC/WHO Compounding Formulations', sub: 'BP107P · Solutions, Syrups, ORS, Suppositories, Ointments', module: 'general_pharmacy', tab: 'experiments', cat: 'Practical', icon: FlaskConical },
  { title: 'Posology (Pediatric Dosing) & Proof Spirit Calculator', sub: 'BP102T · Young, Dilling, Clark, Fried, BSA & °Proof', module: 'general_pharmacy', tab: 'posology_proof', cat: 'Calculator', icon: FlaskConical },
  { title: 'Alligation, Alcohol Dilution, Suppository & Isotonicity', sub: 'BP107P · Exp 1 Pharmaceutical Calculations', module: 'general_pharmacy', tab: 'alligation', cat: 'Calculator', icon: FlaskConical },
  { title: 'BP102T General Pharmacy Theory', sub: 'Units I–V · Pharmacopoeias, Powders, Tablets, Emulsions', module: 'general_pharmacy', tab: 'theory', cat: 'Theory', icon: BookOpen },

  // Pharmacognosy
  { title: 'Stomatal Index, Vein-Islet, Micrometry & Lycopodium', sub: 'BP110P · Exp 8, 9, 12, 13 Quantitative Microscopy', module: 'pharmacognosy', tab: 'leaf_constants', cat: 'Calculator', icon: Microscope },
  { title: '20 Unit V Medicinal Plants & Powder Microscopy', sub: 'BP110P · Exp 1–5 (Tulsi, Ashwagandha, Amla, Arjuna)', module: 'pharmacognosy', tab: 'morphology', cat: 'Practical', icon: Microscope },
  { title: 'Crude Drug QC: Moisture, Swelling, Ash & Extractive', sub: 'BP110P · Exp 6, 7, 10, 11 + Voucher Label Builder', module: 'pharmacognosy', tab: 'physicochemical', cat: 'Practical', icon: Microscope },
  { title: 'BP105T Pharmacognosy Theory', sub: 'Units I–IV · Crude Drug Systems, GACP & AYUSH/TCM', module: 'pharmacognosy', tab: 'theory', cat: 'Theory', icon: BookOpen },

  // Psychology & Communication
  { title: 'Clinical Role-Plays (SPIKES, Chronic Care, Crisis PFA)', sub: 'BP108P · Practical 1–5 Empathy & SBAR Handover', module: 'psychology', tab: 'roleplay', cat: 'Simulator', icon: MessageSquareHeart },
  { title: 'BP103T Healthcare Psychology Theory', sub: 'Units I–V · Health Belief Model, CBT, TTM & Ethics', module: 'psychology', tab: 'theory', cat: 'Theory', icon: BookOpen },

  // Python & Data Science
  { title: 'Live Browser Python IDE & Dosage / BMI Runner', sub: 'BP101T · Units I–V + Pyodide Interactive Console', module: 'python', tab: null, cat: 'IDE', icon: Code },
  { title: 'Pandas PK / ADR Analyzer & Matplotlib Plots', sub: 'BP101T · Units IV–V Oral vs IV Curves & Dissolution', module: 'pandas', tab: null, cat: 'Analytics', icon: Code }
];

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const results = QUICK_INDEX.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.sub.toLowerCase().includes(q) ||
      item.cat.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        const pick = results[selectedIndex];
        onNavigate(pick.module, pick.tab);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, results, selectedIndex, onClose, onNavigate]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick experiment and syllabus finder"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to any experiment, diagram, calculator, or unit (e.g. Gutzeit, Heart, EDTA, ORS)..."
            className="flex-1 bg-transparent text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close quick finder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-200/80 dark:divide-slate-800/60">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.module}-${item.title}`}
                  onClick={() => {
                    onNavigate(item.module, item.tab);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.cat}</span>
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600 dark:text-emerald-400 translate-x-0.5' : 'text-slate-400 dark:text-slate-600'} transition-transform`} />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching experiments or diagrams found for "{query}".
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Use ↑ ↓ arrows and Enter to launch</span>
          <span className="font-medium">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
