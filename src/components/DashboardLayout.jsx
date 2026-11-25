import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SlidersHorizontal,
  MoreVertical,
  Sun,
  Moon
} from 'lucide-react';
import {
  DEFAULT_TEXT_SIZE,
  MAX_TEXT_SIZE,
  MIN_TEXT_SIZE
} from '../utils/studyWorkspace';
import SubjectNavigation, { SUBJECT_NAV_ITEMS } from './SubjectNavigation';
import { PWAInstallButton } from './PWAControls';

export default function DashboardLayout({
  activeModule,
  isEquipmentViewActive = false,
  breadcrumbSection = null,
  breadcrumbDetail = null,
  onSelectModule,
  onOpenEquipment,
  onOpenRecent,
  recentActivity = [],
  visitedModules,
  theme,
  onToggleTheme,
  textSize = DEFAULT_TEXT_SIZE,
  onIncreaseTextSize,
  onDecreaseTextSize,
  onResetTextSize,
  onOpenPalette,
  onOpenGlossary,
  onOpenSettings,
  children
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [textMenuOpen, setTextMenuOpen] = useState(false);
  const textMenuRef = useRef(null);
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

  useEffect(() => {
    if (!textMenuOpen) return;
    const onPointerDown = (e) => {
      if (textMenuRef.current && !textMenuRef.current.contains(e.target)) {
        setTextMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setTextMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [textMenuOpen]);

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
            isEquipmentViewActive={isEquipmentViewActive}
            onSelectModule={handleSelectModule}
            onOpenEquipment={() => {
              setMobileNavOpen(false);
              onOpenEquipment();
            }}
            onOpenRecent={(item) => {
              setMobileNavOpen(false);
              onOpenRecent(item);
            }}
            recentActivity={recentActivity}
            visitedModules={visitedModules}
            onOpenGlossary={onOpenGlossary}
            onOpenSettings={onOpenSettings}
          />
        </aside>
      )}

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Subject navigation"
        >
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 h-full overflow-y-auto z-10 shadow-xl">
            <SubjectNavigation
              activeModule={activeModule}
              isEquipmentViewActive={isEquipmentViewActive}
              onSelectModule={handleSelectModule}
              onOpenEquipment={() => {
                setMobileNavOpen(false);
                onOpenEquipment();
              }}
              onOpenRecent={(item) => {
                setMobileNavOpen(false);
                onOpenRecent(item);
              }}
              recentActivity={recentActivity}
              visitedModules={visitedModules}
              onOpenGlossary={() => {
                setMobileNavOpen(false);
                onOpenGlossary();
              }}
              onOpenSettings={() => {
                setMobileNavOpen(false);
                onOpenSettings();
              }}
              onCloseMobile={() => setMobileNavOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Viewport Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Sticky Utility Header (56px) */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
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

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
              <button
                type="button"
                onClick={() => handleSelectModule('dashboard')}
                className={`font-medium transition-colors truncate ${
                  activeModule === 'dashboard'
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0'
                }`}
              >
                Semester I
              </button>

              {activeModule !== 'dashboard' && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleSelectModule(activeModule)}
                    className={`truncate transition-colors ${
                      breadcrumbSection
                        ? 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium max-w-[120px] sm:max-w-[200px]'
                        : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    }`}
                  >
                    {currentMeta.label}
                  </button>
                </>
              )}

              {activeModule !== 'dashboard' && breadcrumbSection && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0 hidden sm:inline" />
                  <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[160px] md:max-w-[220px]">
                    {breadcrumbSection}
                  </span>
                </>
              )}

              {activeModule !== 'dashboard' && breadcrumbDetail && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0 hidden lg:inline" />
                  <span className="hidden lg:inline text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[160px] tabular-nums">
                    {breadcrumbDetail}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={onOpenPalette}
              className="inline-flex items-center justify-center sm:justify-start gap-2 h-9 sm:h-10 w-9 sm:w-auto sm:px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
              aria-label="Open global search"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Search</span>
              <span className="hidden md:inline text-xs text-slate-500 ml-0.5">⌘K</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center justify-center w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
              aria-label="Open workspace settings"
              title="Settings"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Three-dot Menu (Theme & Text Size Controls) */}
            <div className="relative" ref={textMenuRef}>
              <button
                type="button"
                onClick={() => setTextMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                aria-label="More options, theme and text size"
                aria-expanded={textMenuOpen}
                title="Theme & text size options"
              >
                <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>

              {textMenuOpen && (
                <div
                  role="menu"
                  aria-label="Display, theme and text size options"
                  className="absolute right-0 top-full mt-2 z-50 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Appearance
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {theme === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </div>
                    <div
                      role="group"
                      aria-label="Color theme"
                      className="grid grid-cols-2 gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (theme === 'dark') onToggleTheme?.();
                        }}
                        aria-pressed={theme !== 'dark'}
                        className={`min-h-[36px] px-2.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                          theme !== 'dark'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== 'dark') onToggleTheme?.();
                        }}
                        aria-pressed={theme === 'dark'}
                        className={`min-h-[36px] px-2.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                          theme === 'dark'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Text Size
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {textSize}%
                    </span>
                  </div>

                  <div
                    role="group"
                    aria-label="Adjust text size"
                    className="grid grid-cols-3 gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={onDecreaseTextSize}
                      disabled={textSize <= MIN_TEXT_SIZE}
                      className="min-h-[36px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                      aria-label="Decrease text size"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={onResetTextSize}
                      disabled={textSize === DEFAULT_TEXT_SIZE}
                      className="min-h-[36px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      aria-label="Reset text size to default"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={onIncreaseTextSize}
                      disabled={textSize >= MAX_TEXT_SIZE}
                      className="min-h-[36px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                      aria-label="Increase text size"
                    >
                      A+
                    </button>
                  </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Laboratory Module Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>

        <footer className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 border-t border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <span>PharmLab · B.Pharm Semester I Virtual Laboratory</span>
          <span>
            Curated by <strong className="font-medium text-slate-700 dark:text-slate-300">Shubham</strong> · Y. B. Chavan College of Pharmacy
          </span>
        </footer>
      </div>
    </div>
  );
}
