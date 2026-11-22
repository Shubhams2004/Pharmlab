import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Search
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SubjectNavigation, { SUBJECT_NAV_ITEMS } from './SubjectNavigation';

export default function DashboardLayout({
  activeModule,
  onSelectModule,
  visitedModules,
  theme,
  onToggleTheme,
  onOpenPalette,
  onOpenGlossary,
  children
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pharmlab_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pharmlab_sidebar_collapsed', String(sidebarCollapsed));
    } catch {
      // ignore storage errors
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  const currentMeta =
    SUBJECT_NAV_ITEMS.find((item) => item.id === activeModule) || SUBJECT_NAV_ITEMS[0];

  const handleSelectModule = (moduleId, tab = null) => {
    setMobileNavOpen(false);
    onSelectModule(moduleId, tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Persistent Desktop Sidebar */}
      {!sidebarCollapsed && (
        <aside
          aria-label="Primary sidebar navigation"
          className="hidden md:flex md:w-64 lg:w-72 bg-white dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 p-5 flex-col sticky top-0 h-screen shrink-0 overflow-y-auto"
        >
          <SubjectNavigation
            activeModule={activeModule}
            onSelectModule={handleSelectModule}
            visitedModules={visitedModules}
            onOpenPalette={onOpenPalette}
            onOpenGlossary={onOpenGlossary}
          />
        </aside>
      )}

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true" aria-label="Subject navigation">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 h-full overflow-y-auto z-10 shadow-xl">
            <SubjectNavigation
              activeModule={activeModule}
              onSelectModule={handleSelectModule}
              visitedModules={visitedModules}
              onOpenPalette={() => {
                setMobileNavOpen(false);
                onOpenPalette();
              }}
              onOpenGlossary={() => {
                setMobileNavOpen(false);
                onOpenGlossary();
              }}
              onCloseMobile={() => setMobileNavOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Viewport Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Utility Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 -ml-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden md:inline-flex items-center justify-center w-9 h-9 -ml-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
              <button
                type="button"
                onClick={() => handleSelectModule('dashboard')}
                className={`font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeModule === 'dashboard'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                Semester I
              </button>
              {activeModule !== 'dashboard' && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                    {currentMeta.label}
                  </span>
                  <span className="hidden sm:inline text-slate-500 dark:text-slate-400 text-xs font-medium shrink-0">
                    · {currentMeta.code}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <button
              type="button"
              onClick={onOpenGlossary}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Quick Glossary</span>
              <span className="sm:hidden">Glossary</span>
            </button>

            <button
              type="button"
              onClick={onOpenPalette}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Search Labs</span>
              <span className="sm:hidden">Search</span>
              <span className="hidden md:inline text-xs text-slate-500 ml-0.5">⌘K</span>
            </button>
          </div>
        </header>

        {/* Main Laboratory Module Content */}
        <main className="flex-1 p-5 sm:p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>

        <footer className="px-5 sm:px-6 md:px-8 lg:px-10 py-4 border-t border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <span>PharmLab · B.Pharm Semester I Virtual Laboratory</span>
          <span>
            Curated by <strong className="font-medium text-slate-700 dark:text-slate-300">Shubham</strong> · Y. B. Chavan College of Pharmacy
          </span>
        </footer>
      </div>
    </div>
  );
}
