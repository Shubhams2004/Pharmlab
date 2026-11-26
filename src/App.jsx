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
import Assets3DModule from './modules/assets-3d/Assets3DModule';
import Academic3DExplorerModule from './modules/assets-3d/Academic3DExplorerModule';
import InteractiveExperimentsModule from './modules/interactive-experiments/InteractiveExperimentsModule';
import ReferenceCenterModule from './modules/reference-center/ReferenceCenterModule';
import ResourceHubModule from './modules/resource-hub/ResourceHubModule';
import StudyModeModule from './modules/study-mode/StudyModeModule';
import SyllabusModule from './modules/syllabus/SyllabusModule';
import VisualLibraryModule from './modules/visual-library/VisualLibraryModule';
import PythonStudioWorkspace from './modules/python-studio/PythonStudioWorkspace';
import CoverageAnalyzerModule from './modules/coverage-analyzer/CoverageAnalyzerModule';
import EnrichmentWorkspaceModule from './modules/enrichment-workspace/EnrichmentWorkspaceModule';
import { OfflineIndicator } from './components/PWAControls';
import { DEPARTMENT_WORKSPACES } from './types/academicArchitecture';
import {
  DEFAULT_TEXT_SIZE,
  applyStudyPreferencesToDom,
  clearRecentActivity,
  getRecentActivity,
  getStudyPreferences,
  recordRecentActivity,
  saveStudyPreferences,
  stepTextSize
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
  const [referenceJump, setReferenceJump] = useState({
    section: null,
    referenceId: null,
    query: null,
    nonce: 0
  });
  const [studyJump, setStudyJump] = useState({
    syllabusId: null,
    subjectCode: null,
    topicId: null,
    view: null,
    nonce: 0
  });
  const [asset3dJump, setAsset3dJump] = useState({
    tab: null,
    query: null,
    department: null,
    assetId: null,
    openUpload: false,
    nonce: 0
  });
  const [pythonStudioJump, setPythonStudioJump] = useState({
    scriptName: null,
    scriptContent: null,
    nonce: 0
  });
  const [studioReturnModule, setStudioReturnModule] = useState('dashboard');
  const [explorer3dJump, setExplorer3dJump] = useState({
    assetId: null,
    subjectCode: null,
    topicId: null,
    structureName: null,
    experimentId: null,
    experimentTitle: null,
    experimentTab: null,
    stepId: null,
    stepTitle: null,
    focusComponentName: null,
    returnTab: null,
    nonce: 0
  });
  const [experimentJump, setExperimentJump] = useState({
    experimentId: null,
    stage: null,
    department: null,
    nonce: 0
  });
  const [coverageJump, setCoverageJump] = useState({
    subjectCode: null,
    topicId: null,
    tab: null,
    nonce: 0
  });
  const [enrichmentJump, setEnrichmentJump] = useState({
    syllabusId: null,
    subjectCode: null,
    topicId: null,
    sectionKey: null,
    returnTo: null,
    nonce: 0
  });
  const [explorerReturnModule, setExplorerReturnModule] = useState('assets_3d');
  const [explorerReturnTab, setExplorerReturnTab] = useState(null);
  const explorerReturnScrollRef = React.useRef(0);
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

  const increaseTextSize = useCallback(() => {
    setPreferences((prev) =>
      saveStudyPreferences({ ...prev, textSize: stepTextSize(prev.textSize, 1) })
    );
  }, []);

  const decreaseTextSize = useCallback(() => {
    setPreferences((prev) =>
      saveStudyPreferences({ ...prev, textSize: stepTextSize(prev.textSize, -1) })
    );
  }, []);

  const resetTextSize = useCallback(() => {
    setPreferences((prev) =>
      saveStudyPreferences({ ...prev, textSize: DEFAULT_TEXT_SIZE })
    );
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
      if (moduleId === 'python_studio') {
        setActiveModule((prev) => {
          if (prev && prev !== 'python_studio') {
            setStudioReturnModule(prev);
          }
          return 'python_studio';
        });
        setWorkspaceSectionState({ section: null, detail: null });
        return;
      }

      if (moduleId === 'explorer_3d') {
        if (typeof window !== 'undefined') {
          explorerReturnScrollRef.current = window.scrollY || 0;
        }
        setActiveModule((prev) => {
          if (prev && prev !== 'explorer_3d') {
            setExplorerReturnModule(prev);
            const fallbackTab =
              opts?.returnTab ??
              opts?.experimentTab ??
              (navTarget.module === prev ? navTarget.tab : null);
            setExplorerReturnTab(fallbackTab ?? null);
          }
          return 'explorer_3d';
        });
        setWorkspaceSectionState({ section: null, detail: null });
        return;
      }

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
        moduleId !== 'study_mode' &&
        moduleId !== 'syllabus' &&
        moduleId !== 'knowledge_library' &&
        moduleId !== 'visual_library' &&
        moduleId !== 'assets_3d' &&
        moduleId !== 'explorer_3d' &&
        moduleId !== 'interactive_experiments' &&
        moduleId !== 'resource_hub' &&
        moduleId !== 'reference_center' &&
        moduleId !== 'python_studio' &&
        moduleId !== 'coverage_analyzer' &&
        moduleId !== 'enrichment_workspace'
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
    [preferences.reducedMotion, navTarget.module, navTarget.tab]
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

  const openReferenceCenter = useCallback(
    (opts = {}) => {
      setReferenceJump((prev) => ({
        section: opts.section ?? null,
        referenceId: opts.referenceId ?? null,
        query: opts.query ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('reference_center');
    },
    [navigateTo]
  );

  const openStudyMode = useCallback(
    (opts = {}) => {
      setStudyJump((prev) => ({
        syllabusId: opts.syllabusId ?? null,
        subjectCode: opts.subjectCode ?? null,
        topicId: opts.topicId ?? null,
        view: opts.view ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('study_mode');
    },
    [navigateTo]
  );

  const openAsset3DEngine = useCallback(
    (opts = {}) => {
      setAsset3dJump((prev) => ({
        tab: opts.tab ?? null,
        query: opts.query ?? null,
        department: opts.department ?? null,
        assetId: opts.assetId ?? null,
        openUpload: Boolean(opts.openUpload),
        nonce: prev.nonce + 1
      }));
      navigateTo('assets_3d');
    },
    [navigateTo]
  );

  const openPythonStudio = useCallback(
    (opts = {}) => {
      setPythonStudioJump((prev) => ({
        scriptName: opts.scriptName ?? null,
        scriptContent: opts.scriptContent ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('python_studio');
    },
    [navigateTo]
  );

  const openAcademicExplorer = useCallback(
    (opts = {}) => {
      setExplorer3dJump((prev) => ({
        assetId: opts.assetId ?? null,
        subjectCode: opts.subjectCode ?? null,
        topicId: opts.topicId ?? null,
        structureName: opts.structureName ?? null,
        experimentId: opts.experimentId ?? null,
        experimentTitle: opts.experimentTitle ?? null,
        experimentTab: opts.experimentTab ?? null,
        stepId: opts.stepId ?? null,
        stepTitle: opts.stepTitle ?? null,
        focusComponentName: opts.focusComponentName ?? null,
        returnTab: opts.returnTab ?? opts.experimentTab ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('explorer_3d', null, {
        returnTab: opts.returnTab ?? opts.experimentTab ?? null,
        experimentTab: opts.experimentTab ?? null
      });
    },
    [navigateTo]
  );

  const openInteractiveExperiments = useCallback(
    (opts = {}) => {
      setExperimentJump((prev) => ({
        experimentId: opts.experimentId ?? null,
        stage: opts.stage ?? null,
        department: opts.department ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('interactive_experiments');
    },
    [navigateTo]
  );

  const openCoverageAnalyzer = useCallback(
    (opts = {}) => {
      setCoverageJump((prev) => ({
        subjectCode: opts.subjectCode ?? null,
        topicId: opts.topicId ?? null,
        tab: opts.tab ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('coverage_analyzer');
    },
    [navigateTo]
  );

  const openEnrichmentWorkspace = useCallback(
    (opts = {}) => {
      setEnrichmentJump((prev) => ({
        syllabusId: opts.syllabusId ?? null,
        subjectCode: opts.subjectCode ?? null,
        topicId: opts.topicId ?? null,
        sectionKey: opts.sectionKey ?? null,
        returnTo: opts.returnTo ?? null,
        nonce: prev.nonce + 1
      }));
      navigateTo('enrichment_workspace');
    },
    [navigateTo]
  );

  const handleOpenRecentItem = useCallback(
    (item) => {
      if (item.kind === 'interactive_sim' && item.experimentSimId) {
        openInteractiveExperiments({ experimentId: item.experimentSimId });
        return;
      }
      if (item.kind === 'model_3d' && item.asset3dId) {
        if (item.moduleId === 'explorer_3d') {
          openAcademicExplorer({ assetId: item.asset3dId });
        } else {
          openAsset3DEngine({ assetId: item.asset3dId });
        }
        return;
      }
      if (item.kind === 'study_topic' && item.topicId) {
        openStudyMode({
          syllabusId: item.syllabusId ?? null,
          subjectCode: item.subjectCode ?? null,
          topicId: item.topicId
        });
        return;
      }
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
    [
      navigateTo,
      openKnowledgeLibrary,
      openVisualLibrary,
      openStudyMode,
      openAsset3DEngine,
      openAcademicExplorer,
      openInteractiveExperiments
    ]
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
      openReferenceCenter,
      openStudyMode,
      openAsset3DEngine,
      openAcademicExplorer,
      openInteractiveExperiments,
      openPythonStudio,
      openCoverageAnalyzer,
      openEnrichmentWorkspace,
      navigateToModule: navigateTo,
      setWorkspaceSection,
      recordActivity,
      preferences,
      increaseTextSize,
      decreaseTextSize,
      resetTextSize,
      openSettings: () => setSettingsOpen(true)
    }),
    [
      openKnowledgeLibrary,
      openVisualLibrary,
      openResourceHub,
      openReferenceCenter,
      openStudyMode,
      openAsset3DEngine,
      openAcademicExplorer,
      openInteractiveExperiments,
      openPythonStudio,
      openCoverageAnalyzer,
      openEnrichmentWorkspace,
      navigateTo,
      setWorkspaceSection,
      recordActivity,
      preferences,
      increaseTextSize,
      decreaseTextSize,
      resetTextSize
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

  if (activeModule === 'python_studio') {
    return (
      <LibraryNavigationContext.Provider value={libraryContextValue}>
        <PythonStudioWorkspace
          jumpTarget={pythonStudioJump}
          onExitStudio={() => setActiveModule(studioReturnModule || 'dashboard')}
        />
        <OfflineIndicator />
      </LibraryNavigationContext.Provider>
    );
  }

  if (activeModule === 'explorer_3d') {
    const returnLabels = {
      study_mode: 'Back to Study Mode',
      syllabus: 'Back to Syllabus',
      anatomy: 'Back to Anatomy',
      assets_3d: 'Back to 3D Library',
      interactive_experiments: 'Back to Interactive Simulation',
      reference_center: 'Back to References',
      resource_hub: 'Back to Resource Hub',
      inorganic: 'Back to Inorganic Lab',
      pharmacognosy: 'Back to Pharmacognosy',
      general_pharmacy: 'Back to Pharmaceutics',
      python: 'Back to Python Lab',
      pandas: 'Back to Data Science'
    };
    const explorerReturnLabel = explorer3dJump.experimentTitle
      ? `Back to ${explorer3dJump.experimentTitle}`
      : returnLabels[explorerReturnModule] || 'Back to Module';
    return (
      <LibraryNavigationContext.Provider value={libraryContextValue}>
        <Academic3DExplorerModule
          jumpTarget={explorer3dJump}
          returnLabel={explorerReturnLabel}
          onExitExplorer={() => {
            const targetScroll = explorerReturnScrollRef.current || 0;
            const targetMod = explorerReturnModule || 'assets_3d';
            const targetTab = explorerReturnTab;
            setActiveModule(targetMod);
            if (targetTab) {
              setNavTarget((prev) => ({
                module: targetMod,
                tab: targetTab,
                structureId: null,
                nonce: prev.nonce + 1
              }));
            }
            if (typeof window !== 'undefined') {
              requestAnimationFrame(() => {
                window.scrollTo({ top: targetScroll, behavior: 'auto' });
                setTimeout(() => {
                  window.scrollTo({ top: targetScroll, behavior: 'auto' });
                }, 60);
              });
            }
          }}
        />
        <OfflineIndicator />
      </LibraryNavigationContext.Provider>
    );
  }

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
        textSize={preferences.textSize}
        onIncreaseTextSize={increaseTextSize}
        onDecreaseTextSize={decreaseTextSize}
        onResetTextSize={resetTextSize}
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
        {activeModule === 'reference_center' && (
          <ReferenceCenterModule jumpTarget={referenceJump} />
        )}
        {activeModule === 'study_mode' && <StudyModeModule jumpTarget={studyJump} />}
        {activeModule === 'assets_3d' && <Assets3DModule jumpTarget={asset3dJump} />}
        {activeModule === 'interactive_experiments' && (
          <InteractiveExperimentsModule jumpTarget={experimentJump} />
        )}
        {activeModule === 'coverage_analyzer' && (
          <CoverageAnalyzerModule jumpTarget={coverageJump} />
        )}
        {activeModule === 'enrichment_workspace' && (
          <EnrichmentWorkspaceModule jumpTarget={enrichmentJump} />
        )}
        {activeModule === 'syllabus' && <SyllabusModule />}
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
      <OfflineIndicator />
    </LibraryNavigationContext.Provider>
  );
}
