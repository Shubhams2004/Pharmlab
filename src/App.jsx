import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Menu,
  X,
  ChevronRight,
  LayoutGrid,
  Code,
  Database,
  FlaskConical,
  MessageSquareHeart,
  Activity,
  Microscope,
  TestTube,
  BookOpen
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import CommandPalette from './components/CommandPalette';
import QuickGlossary from './components/QuickGlossary';
import ThemeToggle from './components/ThemeToggle';
import PandasModule from './modules/bp101t-python/PandasModule';
import PythonModule from './modules/bp101t-python/PythonModule';
import GeneralPharmacyModule from './modules/bp102t-general-pharmacy/GeneralPharmacyModule';
import PsychologyCommunicationModule from './modules/bp103t-psychology/PsychologyCommunicationModule';
import AnatomyModule from './modules/bp104t-anatomy/AnatomyModule';
import PharmacognosyModule from './modules/bp105t-pharmacognosy/PharmacognosyModule';
import InorganicModule from './modules/bp106t-inorganic/InorganicModule';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview & Hub', group: 'Workspace', icon: LayoutGrid, code: 'Home' },
  { id: 'python', label: 'Python Fundamentals', group: 'BP101T Data Science', icon: Code, code: 'BP101T' },
  { id: 'pandas', label: 'Pandas & PK Plots', group: 'BP101T Data Science', icon: Database, code: 'Unit IV–V' },
  { id: 'general_pharmacy', label: 'General Pharmacy', group: 'Core Subjects', icon: FlaskConical, code: 'BP102T / BP107P' },
  { id: 'psychology', label: 'Psychology & Comm.', group: 'Core Subjects', icon: MessageSquareHeart, code: 'BP103T / BP108P' },
  { id: 'anatomy', label: 'Human Anatomy & Path.', group: 'Core Subjects', icon: Activity, code: 'BP104T / BP109P' },
  { id: 'pharmacognosy', label: 'Pharmacognosy', group: 'Core Subjects', icon: Microscope, code: 'BP105T / BP110P' },
  { id: 'inorganic', label: 'Inorganic Chemistry', group: 'Core Subjects', icon: TestTube, code: 'BP106T / BP111P' }
];

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [navTarget, setNavTarget] = useState({ module: 'dashboard', tab: null, nonce: 0 });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('pharmlab_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('pharmlab_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const [visitedModules, setVisitedModules] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmlab_visited_modules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastModule, setLastModule] = useState(() => {
    try {
      return localStorage.getItem('pharmlab_last_module') || 'anatomy';
    } catch {
      return 'anatomy';
    }
  });

  const navigateTo = useCallback((moduleId, tab = null) => {
    setActiveModule(moduleId);
    setNavTarget((prev) => ({ module: moduleId, tab, nonce: prev.nonce + 1 }));
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (moduleId !== 'dashboard') {
      setLastModule(moduleId);
      try {
        localStorage.setItem('pharmlab_last_module', moduleId);
      } catch {
        // ignore storage errors
      }
      setVisitedModules((prev) => {
        if (prev.includes(moduleId)) return prev;
        const next = [...prev, moduleId];
        try {
          localStorage.setItem('pharmlab_visited_modules', JSON.stringify(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlossaryOpen(false);
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const currentMeta = NAV_ITEMS.find((n) => n.id === activeModule) || NAV_ITEMS[0];
  const groups = ['BP101T Data Science', 'Core Subjects'];

  const renderNavContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('dashboard')}
            className="text-left focus:outline-none group"
          >
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block">
              PharmLab Studio
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
              B.Pharm Semester I
            </span>
          </button>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              setMobileNavOpen(false);
              setGlossaryOpen(false);
              setPaletteOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Quick Jump...</span>
            </span>
            <span className="text-xs font-medium text-slate-500 shrink-0">⌘K</span>
          </button>

          <button
            onClick={() => {
              setMobileNavOpen(false);
              setPaletteOpen(false);
              setGlossaryOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Quick Glossary</span>
            </span>
            <span className="text-xs font-medium tabular-nums text-slate-500 shrink-0">42</span>
          </button>
        </div>

        <nav className="space-y-1 text-sm font-medium" aria-label="Primary subject navigation">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors whitespace-nowrap ${
              activeModule === 'dashboard'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="truncate">Overview &amp; Hub</span>
            </span>
          </button>

          {groups.map((grp) => (
            <div key={grp} className="pt-4 space-y-1">
              <div className="text-xs font-semibold text-slate-500 px-3 pb-1">
                {grp}
              </div>
              {NAV_ITEMS.filter((item) => item.group === grp).map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                const isVisited = visitedModules.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {isVisited && !isActive && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500/80 shrink-0" title="Explored">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="pt-5 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between tabular-nums">
          <span>Labs Explored</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{visitedModules.length} / 7</span>
        </div>
        <p className="text-slate-500 truncate">
          Y. B. Chavan College of Pharmacy
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop Sticky Rail */}
      <aside className="hidden md:flex md:w-64 bg-white dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 p-5 flex-col sticky top-0 h-screen shrink-0 overflow-y-auto">
        {renderNavContent()}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 h-full overflow-y-auto z-10">
            {renderNavContent()}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Sticky Utility Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <button
                onClick={() => navigateTo('dashboard')}
                className={`font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeModule === 'dashboard' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                Semester I
              </button>
              {activeModule !== 'dashboard' && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">{currentMeta.label}</span>
                  <span className="hidden sm:inline text-slate-500 text-xs font-medium shrink-0">
                    · {currentMeta.code}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            <button
              onClick={() => {
                setPaletteOpen(false);
                setGlossaryOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Quick Glossary</span>
              <span className="sm:hidden">Glossary</span>
            </button>

            <button
              onClick={() => {
                setGlossaryOpen(false);
                setPaletteOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Search Labs &amp; Diagrams</span>
              <span className="sm:hidden">Search</span>
              <span className="hidden md:inline text-xs text-slate-500 ml-1">⌘K</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6 md:p-10 max-w-7xl w-full mx-auto">
          {activeModule === 'dashboard' && (
            <Dashboard
              onSelectModule={navigateTo}
              onOpenPalette={() => setPaletteOpen(true)}
              visitedModules={visitedModules}
              lastModule={lastModule}
            />
          )}
          {activeModule === 'pandas' && <PandasModule />}
          {activeModule === 'python' && <PythonModule />}
          {activeModule === 'general_pharmacy' && (
            <GeneralPharmacyModule
              initialTab={navTarget.module === 'general_pharmacy' ? navTarget.tab : null}
              navNonce={navTarget.nonce}
            />
          )}
          {activeModule === 'psychology' && (
            <PsychologyCommunicationModule
              initialTab={navTarget.module === 'psychology' ? navTarget.tab : null}
              navNonce={navTarget.nonce}
            />
          )}
          {activeModule === 'anatomy' && (
            <AnatomyModule
              initialTab={navTarget.module === 'anatomy' ? navTarget.tab : null}
              navNonce={navTarget.nonce}
            />
          )}
          {activeModule === 'pharmacognosy' && (
            <PharmacognosyModule
              initialTab={navTarget.module === 'pharmacognosy' ? navTarget.tab : null}
              navNonce={navTarget.nonce}
            />
          )}
          {activeModule === 'inorganic' && (
            <InorganicModule
              initialTab={navTarget.module === 'inorganic' ? navTarget.tab : null}
              navNonce={navTarget.nonce}
            />
          )}
        </main>
      </div>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigateTo}
      />

      <QuickGlossary
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        activeModule={activeModule}
        onNavigate={navigateTo}
      />
    </div>
  );
}
