import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  Compass,
  BookOpen,
  FlaskConical,
  Activity,
  Microscope,
  Code,
  MessageSquareHeart,
  Library,
  Images,
  FileText,
  MapPin,
  Globe,
  Scale,
  GraduationCap,
  Box,
  Terminal
} from 'lucide-react';
import { useLibraryNavigation } from '../context/LibraryNavigationContext';
import { getAll3DAssets } from '../modules/assets-3d/asset3dDb';
import { getAllBooks } from '../modules/knowledge-library/libraryDb';
import { getAllReferences } from '../modules/reference-center/referenceDb';
import { getAllVisuals } from '../modules/visual-library/visualDb';
import { searchAcademicEngine } from '../utils/academicEngineUtils';
import { ENGINE_DEPARTMENTS } from '../data/academicEngineRegistry';

export const QUICK_INDEX = [
  // Study Mode & Anatomy Explorer & Libraries
  { title: 'Study Mode & Academic Content Engine', sub: 'Syllabus-Driven Learning, Auto-Sourced References, Personal Notes & Bookmarks', module: 'study_mode', studyView: 'study', cat: 'Study Mode', icon: GraduationCap },
  { title: 'Exam Prep & Previous-Year Question Paper Intelligence', sub: '9 Question Formats, Paper PDF Importer & Evidence-Based Unit Analysis', module: 'study_mode', studyView: 'exam', cat: 'Exam Prep', icon: GraduationCap },
  { title: 'Anatomy Explorer (60 Cataloged Organs, Parts & Tissues)', sub: 'BP104T · Search, Filter 10 Body Systems, View Plates & Textbook Links', module: 'anatomy', tab: 'explorer', cat: 'Explorer', icon: Activity },
  { title: 'Anatomy Identification Practice', sub: 'BP104T · Structure & Function MCQs and Calibrated Visual Pin Quiz', module: 'anatomy', tab: 'practice', cat: 'Practice', icon: Compass },
  { title: 'Official B.Pharm Semester I Syllabus (PDF Pages 38–65)', sub: 'Verbatim Scheme, Objectives, Outcomes, Units I–V, Practicals & References (BP101T–BP111P)', module: 'syllabus', tab: null, cat: 'Syllabus', icon: FileText },
  { title: 'Pharmaceutical Reference Center (Pharmacopoeias, Textbooks & Standards)', sub: 'IP, BP, USP–NF, Ph. Eur., WHO Ph. Int., Textbooks, Handbooks & Guidelines', referenceSection: 'overview', cat: 'Reference Center', icon: Scale },
  { title: 'Knowledge Library (PDF Textbook Reader & Search)', sub: 'Offline IndexedDB PDF Repository · Full-Book Search, Notes & Diagram Crop', module: 'knowledge_library', tab: null, cat: 'Library', icon: Library },
  { title: 'Scientific Resource Hub (PubMed, Europe PMC, OpenStax, Wikimedia)', sub: 'Discover Open-Access Papers, Textbooks, Reference Chapters & Scientific Visuals', module: 'resource_hub', tab: null, cat: 'Resource Hub', icon: Globe },
  { title: 'Academic Visual Learning Library & Atlas', sub: 'Interactive Diagrams, Structure Labels, Mechanisms, MCQs & Open-Access Search', module: 'visual_library', tab: null, cat: 'Media', icon: Images },
  { title: 'Universal Scientific 3D Asset Engine', sub: 'Interactive GLB / glTF / STL Viewer, Part Isolation & Scientific 3D Repository Discovery', asset3dTab: 'library', cat: '3D Engine', icon: Box },
  { title: 'Academic 3D Explorer (Interactive Scientific Workbench)', sub: 'Structure Inspection, X-Ray Mode, Camera Presets, Labels & Syllabus Context', module: 'explorer_3d', explorer3d: true, cat: '3D Explorer', icon: Compass },
  { title: 'Equipment & Apparatus Directory', sub: 'Compound Microscope, Gutzeit Apparatus, Nessler Cylinders & Lab Glassware', module: 'visual_library', category: 'equipment', tab: null, cat: 'Equipment', icon: Microscope },
  { title: 'Human Nephron & Glomerular Filtration (Visual Plate)', sub: 'Interactive Pins: Glomerulus, PCT, Loop of Henle, DCT & Collecting Duct', module: 'visual_library', visualId: 'builtin_nephron_anatomy', tab: null, cat: 'Anatomy', icon: Activity },
  { title: 'Diuretic Sites of Action Along the Nephron (Visual Plate)', sub: 'Pharmacology · Loop Diuretics, Thiazides, Acetazolamide & Spironolactone', module: 'visual_library', visualId: 'builtin_diuretic_pharmacology', tab: null, cat: 'Pharmacology', icon: FlaskConical },
  { title: 'Aspirin (Acetylsalicylic Acid) Structure & COX Acetylation', sub: 'Medicinal Chemistry · Functional Groups, Esterification & Antiplatelet Mechanism', module: 'visual_library', visualId: 'builtin_aspirin_molecule', tab: null, cat: 'Chemistry', icon: FlaskConical },
  { title: 'Gram-Positive vs Gram-Negative Bacterial Cell Envelope', sub: 'Microbiology · Peptidoglycan, LPS Endotoxin & Beta-Lactam Targets', module: 'visual_library', visualId: 'builtin_bacterial_cell_wall', tab: null, cat: 'Microbiology', icon: Microscope },

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
  { title: 'Python Studio (Full-Screen IDE)', sub: 'Monaco Editor, Project Explorer, Pyodide REPL, Matplotlib Plots & SciPy/SymPy', module: 'python_studio', pythonStudio: true, tab: null, cat: 'Studio IDE', icon: Terminal },
  { title: 'Live Browser Python IDE & Dosage / BMI Runner', sub: 'BP101T · Units I–V + Pyodide Interactive Console', module: 'python', tab: null, cat: 'IDE', icon: Code },
  { title: 'Pandas PK / ADR Analyzer & Matplotlib Plots', sub: 'BP101T · Units IV–V Oral vs IV Curves & Dissolution', module: 'pandas', tab: null, cat: 'Analytics', icon: Code }
];

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const {
    openVisualLibrary,
    openKnowledgeLibrary,
    openResourceHub,
    openReferenceCenter,
    openStudyMode,
    openAsset3DEngine,
    openAcademicExplorer,
    openPythonStudio
  } = useLibraryNavigation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [books, setBooks] = useState([]);
  const [visuals, setVisuals] = useState([]);
  const [references, setReferences] = useState([]);
  const [assets3d, setAssets3d] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 20);

    let cancelled = false;
    Promise.all([getAllBooks(), getAllVisuals(), getAllReferences(), getAll3DAssets()])
      .then(([loadedBooks, loadedVisuals, loadedRefs, loaded3d]) => {
        if (cancelled) return;
        setBooks(loadedBooks);
        setVisuals(loadedVisuals);
        setReferences(loadedRefs);
        setAssets3d(loaded3d);
      })
      .catch(() => {
        // ignore IndexedDB error inside palette
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const indexHits = QUICK_INDEX.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.cat.toLowerCase().includes(q)
      );
    });

    if (!q) return indexHits;

    const unified = searchAcademicEngine(q, { visuals, books });

    const structureResults = unified.structures.slice(0, 6).map((hit) => ({
      title: hit.title,
      sub: hit.subtitle,
      module: 'anatomy',
      tab: 'explorer',
      structureId: hit.payload.id,
      cat: hit.typeLabel,
      icon: Activity
    }));

    const subtopicResults = unified.subtopics.slice(0, 3).map((hit) => ({
      title: hit.title,
      sub: hit.subtitle,
      module: ENGINE_DEPARTMENTS[hit.payload.departmentId]?.moduleId || 'anatomy',
      tab: 'explorer',
      structureId: hit.payload.structureId || null,
      cat: hit.typeLabel,
      icon: BookOpen
    }));

    const topicResults = unified.topics.slice(0, 3).map((hit) => ({
      title: hit.title,
      sub: hit.subtitle,
      module: ENGINE_DEPARTMENTS[hit.payload.departmentId]?.moduleId || 'anatomy',
      tab: hit.payload.linkedTab || null,
      cat: hit.typeLabel,
      icon: Compass
    }));

    const visualResults = unified.visuals.slice(0, 3).map((hit) => ({
      title: hit.title,
      sub: hit.subtitle,
      visualId: hit.payload.id,
      cat: hit.typeLabel,
      icon: Images
    }));

    const pinResults = unified.structurePins.slice(0, 3).map((hit) => ({
      title: hit.title,
      sub: hit.subtitle,
      visualId: hit.payload.visual.id,
      annotationId: hit.payload.annotation.id,
      cat: hit.typeLabel,
      icon: MapPin
    }));

    const bookResults = unified.books.slice(0, 3).map((hit) => ({
      title: hit.title,
      sub: hit.subtitle,
      bookId: hit.payload.id,
      pageNumber: hit.payload.lastReadPage || 1,
      cat: hit.typeLabel,
      icon: FileText
    }));

    const refHits = references
      .filter((ref) => {
        const hay = `${ref.title} ${ref.shortTitle || ''} ${ref.authors || ''} ${ref.subject} ${ref.tags.join(' ')}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 4)
      .map((ref) => ({
        title: ref.title,
        sub: `${ref.subject}${ref.authors ? ` · ${ref.authors}` : ''}`,
        referenceId: ref.id,
        cat: 'Reference Center',
        icon: Scale
      }));

    const model3dHits = assets3d
      .filter((m) => {
        const hay = `${m.name} ${m.description} ${m.creator} ${m.tags.join(' ')}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 4)
      .map((m) => ({
        title: m.name,
        sub: `${m.format.toUpperCase()} · ${m.creator}`,
        asset3dId: m.id,
        cat: '3D Model',
        icon: Box
      }));

    const externalAction = {
      title: `Search Scientific Resource Hub for "${query.trim()}"`,
      sub: 'Live Open-Access Search · PubMed, Europe PMC, PMC, NCBI Bookshelf, OpenStax & Wikimedia',
      resourceHubQuery: query.trim(),
      cat: 'External Search',
      icon: Globe
    };

    return [
      ...model3dHits,
      ...refHits,
      ...structureResults,
      ...subtopicResults,
      ...topicResults,
      ...visualResults,
      ...pinResults,
      ...indexHits.slice(0, 5),
      ...bookResults,
      externalAction
    ];
  }, [query, books, visuals, references, assets3d]);

  const launchPick = (pick) => {
    if (pick.pythonStudio) {
      openPythonStudio();
    } else if (pick.explorer3d) {
      openAcademicExplorer();
    } else if (pick.asset3dId) {
      openAcademicExplorer({ assetId: pick.asset3dId });
    } else if (pick.asset3dTab) {
      openAsset3DEngine({ tab: pick.asset3dTab });
    } else if (pick.studyView) {
      openStudyMode({ view: pick.studyView });
    } else if (pick.referenceId) {
      openReferenceCenter({ referenceId: pick.referenceId });
    } else if (pick.referenceSection) {
      openReferenceCenter({ section: pick.referenceSection });
    } else if (pick.resourceHubQuery) {
      openResourceHub({ query: pick.resourceHubQuery });
    } else if (pick.bookId) {
      openKnowledgeLibrary({ bookId: pick.bookId, pageNumber: pick.pageNumber || 1 });
    } else if (pick.visualId) {
      openVisualLibrary({ visualId: pick.visualId, annotationId: pick.annotationId || null });
    } else if (pick.category) {
      openVisualLibrary({ category: pick.category });
    } else if (pick.structureId) {
      onNavigate(pick.module || 'anatomy', pick.tab || 'explorer', { structureId: pick.structureId });
    } else {
      onNavigate(pick.module, pick.tab);
    }
    onClose();
  };

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
        launchPick(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global workspace finder"
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
            placeholder="Search labs, structures ('glomerulus'), equipment, or uploaded PDFs..."
            className="flex-1 bg-transparent text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close finder"
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
                  key={`${item.module || item.bookId || item.visualId}-${item.title}-${idx}`}
                  type="button"
                  onClick={() => launchPick(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isSelected
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.cat}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 ${
                        isSelected
                          ? 'text-emerald-600 dark:text-emerald-400 translate-x-0.5'
                          : 'text-slate-400 dark:text-slate-600'
                      } transition-transform`}
                    />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching labs, visuals, structures, or PDFs found for "{query}".
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Use ↑ ↓ arrows and Enter to open</span>
          <span className="font-medium">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
