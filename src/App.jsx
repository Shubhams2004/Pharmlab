import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LibraryNavigationContext } from './context/LibraryNavigationContext';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import CommandPalette from './components/CommandPalette';
import QuickGlossary from './components/QuickGlossary';
import SettingsModal from './components/SettingsModal';
import PandasModule from './modules/bp101t-python/PandasModule';
import PythonModule from './modules/bp101t-python/PythonModule';
import GeneralPharmacyModule from './modules/bp102t-general-pharmacy/GeneralPharmacyModule';
import PsychologyCommunicationModule from './modules/bp103t-psychology/PsychologyCommunicationModule';
import AnatomyModule from './modules/bp104t-anatomy/AnatomyModule';
import PharmacognosyModule from './modules/bp105t-pharmacognosy/PharmacognosyModule';
import InorganicModule from './modules/bp106t-inorganic/InorganicModule';
import KnowledgeLibraryModule from './modules/knowledge-library/KnowledgeLibraryModule';
import ResourceHubModule from './modules/resource-hub/ResourceHubModule';
import VisualLibraryModule from './modules/visual-library/VisualLibraryModule';
import { DEPARTMENT_WORKSPACES } from './types/academicArchitecture';
import {
  applyStudyPreferencesToDom,
  clearRecentActivity,
  getRecentActivity,
  getStudyPreferences,
  recordRecentActivity,
  saveStudyPreferences
} from './utils/studyWorkspace';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [navTarget, setNavTarget] = useState({
    module: 'dashboard',
    tab: null,
    structureId: null,
    nonce: 0
  });
  const [workspaceSection, setWorkspaceSectionState] = useState({
    section: null,
    detail: null
  });
  const [knowledgeJump, setKnowledgeJump] = useState({
    bookId: null,
    pageNumber: null,
    searchQuery: null,
    nonce: 0
  });
  const [visualJump, setVisualJump] = useState({
    department: null,
    category: null,
    query: null,
    visualId: null,
    annotationId: null,
    tab: null,
    openUpload: false,
    nonce: 0
  });
  const [resourceJump, setResourceJump] = useState({
    query: null,
    tab: null,
    resourceType: null,
    context: null,
    nonce: 0
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [recentActivity, setRecentActivity] = useState(() => getRecentActivity());
  const [preferences, setPreferences] = useState(() => getStudyPreferences());

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

  useEffect(() => {
    applyStudyPreferencesToDom(preferences);
  }, [preferences]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const updatePreferences = useCallback((next) => {
    setPreferences(saveStudyPreferences(next));
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

  const recordActivity = useCallback((item) => {
    setRecentActivity(recordRecentActivity(item));
  }, []);

  const setWorkspaceSection = useCallback((sectionLabel, detailLabel = null) => {
    setWorkspaceSectionState((prev) => {
      if (prev.section === sectionLabel && prev.detail === detailLabel) return prev;
      return { section: sectionLabel, detail: detailLabel };
    });
  }, []);

  const navigateTo = useCallback(
    (moduleId, tab = null, opts = {}) => {
      const nextStructureId = opts?.structureId ?? null;
      setActiveModule(moduleId);
      setNavTarget((prev) => ({
        module: moduleId,
        tab,
        structureId: nextStructureId,
        nonce: prev.nonce + 1
      }));
      setWorkspaceSectionState({ section: null, detail: null });
      window.scrollTo({
        top: 0,
        behavior: preferences.reducedMotion ? 'auto' : 'smooth'
      });

      if (
        moduleId !== 'dashboard' &&
        moduleId !== 'knowledge_library' &&
        moduleId !== 'visual_library' &&
        moduleId !== 'resource_hub'
      ) {
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

        const meta = DEPARTMENT_WORKSPACES[moduleId];
        if (meta) {
          const tabMeta = tab ? meta.tabs.find((t) => t.id === tab) : null;
          setRecentActivity(
            recordRecentActivity({
              key: `dept:${moduleId}:${tab || 'default'}`,
              kind: tab ? 'experiment' : 'department',
              title: tabMeta ? `${meta.shortLabel} · ${tabMeta.label}` : meta.shortLabel,
              subtitle: meta.code,
              moduleId,
              tab: tab || null
            })
          );
        }
      }
    },
    [preferences.reducedMotion]
  );

  const openKnowledgeLibrary = useCallback(
    (opts = {}) => {
      setKnowledgeJump((prev) => ({
        bookId: opts.bookId ?? null,
        pageNumber: opts.pageNumber ?? null,
        searchQuery: opts.searchQuery ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('knowledge_library');
    },
    [navigateTo]
  );

  const openVisualLibrary = useCallback(
    (opts = {}) => {
      setVisualJump((prev) => ({
        department: opts.department ?? null,
        category: opts.category ?? null,
        query: opts.query ?? null,
        visualId: opts.visualId ?? null,
        annotationId: opts.annotationId ?? null,
        tab: opts.tab ?? null,
        openUpload: Boolean(opts.openUpload),
        nonce: prev.nonce + 1
      }));
      if (opts.category === 'equipment') {
        setRecentActivity(
          recordRecentActivity({
            key: 'visual:category:equipment',
            kind: 'equipment',
            title: 'Equipment & Apparatus Directory',
            subtitle: 'Scientific Visual Library',
            moduleId: 'visual_library',
            category: 'equipment'
          })
        );
      }
      navigateTo('visual_library');
    },
    [navigateTo]
  );

  const openResourceHub = useCallback(
    (opts = {}) => {
      setResourceJump((prev) => ({
        query: opts.query ?? null,
        tab: opts.tab ?? null,
        resourceType: opts.resourceType ?? null,
        context: opts.context ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('resource_hub');
    },
    [navigateTo]
  );

  const handleOpenRecentItem = useCallback(
    (item) => {
      if (item.kind === 'book' && item.bookId) {
        openKnowledgeLibrary({ bookId: item.bookId, pageNumber: item.pageNumber ?? 1 });
        return;
      }
      if (item.kind === 'visual' && item.visualId) {
        openVisualLibrary({ visualId: item.visualId });
        return;
      }
      if (item.kind === 'equipment' && item.category) {
        openVisualLibrary({ category: item.category });
        return;
      }
      if (item.kind === 'structure' && item.structureId) {
        navigateTo('anatomy', 'explorer', { structureId: item.structureId });
        return;
      }
      navigateTo(item.moduleId, item.tab ?? null);
    },
    [navigateTo, openKnowledgeLibrary, openVisualLibrary]
  );

  const handleClearRecent = useCallback(() => {
    setRecentActivity(clearRecentActivity());
  }, []);

  const handleResetExplored = useCallback(() => {
    setVisitedModules([]);
    try {
      localStorage.removeItem('pharmlab_visited_modules');
    } catch {
      // ignore storage errors
    }
  }, []);

  const libraryContextValue = useMemo(
    () => ({
      openKnowledgeLibrary,
      openVisualLibrary,
      openResourceHub,
      navigateToModule: navigateTo,
      setWorkspaceSection,
      recordActivity,
      preferences,
      openSettings: () => setSettingsOpen(true)
    }),
    [
      openKnowledgeLibrary,
      openVisualLibrary,
      openResourceHub,
      navigateTo,
      setWorkspaceSection,
      recordActivity,
      preferences
    ]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlossaryOpen(false);
        setSettingsOpen(false);
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isEquipmentViewActive =
    activeModule === 'visual_library' &&
    visualJump.category === 'equipment' &&
    workspaceSection.section === 'Equipment & Apparatus';

  return (
    <LibraryNavigationContext.Provider value={libraryContextValue}>
      <DashboardLayout
        activeModule={activeModule}
        isEquipmentViewActive={isEquipmentViewActive}
        breadcrumbSection={workspaceSection.section}
        breadcrumbDetail={workspaceSection.detail}
        onSelectModule={navigateTo}
        onOpenEquipment={() => openVisualLibrary({ category: 'equipment' })}
        onOpenRecent={handleOpenRecentItem}
        recentActivity={recentActivity}
        visitedModules={visitedModules}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => {
          setGlossaryOpen(false);
          setSettingsOpen(false);
          setPaletteOpen(true);
        }}
        onOpenGlossary={() => {
          setPaletteOpen(false);
          setSettingsOpen(false);
          setGlossaryOpen(true);
        }}
        onOpenSettings={() => {
          setPaletteOpen(false);
          setGlossaryOpen(false);
          setSettingsOpen(true);
        }}
      >
        {activeModule === 'dashboard' && (
          <Dashboard
            onSelectModule={navigateTo}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenGlossary={() => setGlossaryOpen(true)}
            onOpenRecent={handleOpenRecentItem}
            recentActivity={recentActivity}
            visitedModules={visitedModules}
            lastModule={lastModule}
          />
        )}
        {activeModule === 'pandas' && <PandasModule />}
        {activeModule === 'python' && (
          <PythonModule
            initialTab={navTarget.module === 'python' ? navTarget.tab : null}
            navNonce={navTarget.nonce}
          />
        )}
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
            initialStructureId={navTarget.module === 'anatomy' ? navTarget.structureId : null}
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
        {activeModule === 'knowledge_library' && (
          <KnowledgeLibraryModule jumpTarget={knowledgeJump} />
        )}
        {activeModule === 'visual_library' && (
          <VisualLibraryModule
            initialDepartment={visualJump.department}
            initialCategory={visualJump.category}
            initialQuery={visualJump.query}
            initialVisualId={visualJump.visualId}
            initialAnnotationId={visualJump.annotationId}
            initialTab={visualJump.tab}
            initialOpenUpload={visualJump.openUpload}
            navNonce={visualJump.nonce}
          />
        )}
        {activeModule === 'resource_hub' && (
          <ResourceHubModule
            initialQuery={resourceJump.query}
            initialTab={resourceJump.tab}
            initialResourceType={resourceJump.resourceType}
            initialContext={resourceJump.context}
            navNonce={resourceJump.nonce}
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

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
        recentCount={recentActivity.length}
        exploredCount={visitedModules.length}
        onClearRecent={handleClearRecent}
        onResetExplored={handleResetExplored}
      />
    </LibraryNavigationContext.Provider>
  );
}
