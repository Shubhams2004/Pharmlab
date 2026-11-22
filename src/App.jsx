import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import CommandPalette from './components/CommandPalette';
import QuickGlossary from './components/QuickGlossary';
import PandasModule from './modules/bp101t-python/PandasModule';
import PythonModule from './modules/bp101t-python/PythonModule';
import GeneralPharmacyModule from './modules/bp102t-general-pharmacy/GeneralPharmacyModule';
import PsychologyCommunicationModule from './modules/bp103t-psychology/PsychologyCommunicationModule';
import AnatomyModule from './modules/bp104t-anatomy/AnatomyModule';
import PharmacognosyModule from './modules/bp105t-pharmacognosy/PharmacognosyModule';
import InorganicModule from './modules/bp106t-inorganic/InorganicModule';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [navTarget, setNavTarget] = useState({ module: 'dashboard', tab: null, nonce: 0 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmlab_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = theme;
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

  return (
    <>
      <DashboardLayout
        activeModule={activeModule}
        onSelectModule={navigateTo}
        visitedModules={visitedModules}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => {
          setGlossaryOpen(false);
          setPaletteOpen(true);
        }}
        onOpenGlossary={() => {
          setPaletteOpen(false);
          setGlossaryOpen(true);
        }}
      >
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
      </DashboardLayout>

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
    </>
  );
}
