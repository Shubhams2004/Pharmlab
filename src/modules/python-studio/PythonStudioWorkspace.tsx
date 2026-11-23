import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Code2,
  FolderTree,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Play,
  RefreshCw,
  Save,
  Settings2,
  Square,
  Terminal as TerminalIcon
} from 'lucide-react';
import { PythonStudioJumpTarget } from '../../context/LibraryNavigationContext';
import ContextInspectorPanel from './components/ContextInspectorPanel';
import MonacoCodePanel from './components/MonacoCodePanel';
import ProjectExplorerPanel from './components/ProjectExplorerPanel';
import TerminalOutputPanel, { BottomWorkbenchTab } from './components/TerminalOutputPanel';
import { getPyodideStudioRuntime, RuntimeSnapshot } from './pyodideRuntime';
import {
  appendExecutionHistory,
  clearProjectHistory,
  createNodeRecord,
  createProjectFromTemplate,
  DEFAULT_EDITOR_PREFERENCES,
  deleteNodesByIds,
  deleteProjectAndData,
  ensureInitialWorkspace,
  getProjectHistory,
  getProjectNodes,
  saveNode,
  saveProject,
  setMetaValue
} from './studioDb';
import {
  buildProjectTree,
  collectDescendantIds,
  inferFileKind,
  validateNodeName
} from './studioUtils';
import {
  EditorPreferences,
  ExecutionRecord,
  PackageId,
  ProposedFilePatch,
  StudioAssistantBridge,
  StudioNode,
  StudioProject,
  TerminalEntry,
  WorkspaceContextSnapshot
} from './types';

interface PythonStudioWorkspaceProps {
  jumpTarget?: PythonStudioJumpTarget | null;
  onExitStudio: () => void;
}

function makeUiId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function PythonStudioWorkspace({
  jumpTarget,
  onExitStudio
}: PythonStudioWorkspaceProps) {
  const runtimeManager = useMemo(() => getPyodideStudioRuntime(), []);
  const [runtime, setRuntime] = useState<RuntimeSnapshot>(() => runtimeManager.getSnapshot());

  // Workspace Data State
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<StudioNode[]>([]);
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());
  const [editorPrefs, setEditorPrefs] = useState<EditorPreferences>(DEFAULT_EDITOR_PREFERENCES);
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  // Terminal & Selection State
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    {
      id: 'welcome',
      timestamp: Date.now(),
      kind: 'system',
      text: 'Python Studio REPL ready. Variables defined when running scripts remain inspectable here.'
    }
  ]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [editorJump, setEditorJump] = useState<{
    filePath: string;
    line: number;
    nonce: number;
  } | null>(null);

  // Layout & Resizing State
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  }));
  const isDesktop = viewport.width >= 768;
  const isCompactEditor = viewport.width < 1024;

  const [showExplorer, setShowExplorer] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true
  );
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomWorkbenchTab>('output');
  const [bottomExpanded, setBottomExpanded] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [mobilePane, setMobilePane] = useState<'explorer' | 'editor' | 'output' | 'terminal'>('editor');

  const [explorerWidth, setExplorerWidth] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 1100 ? 200 : 250
  );
  const [bottomHeight, setBottomHeight] = useState(() => {
    if (typeof window === 'undefined') return 340;
    return Math.min(440, Math.max(300, Math.round(window.innerHeight * 0.44)));
  });

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const dragStateRef = useRef<{
    kind: 'explorer' | 'bottom' | null;
    startPos: number;
    startSize: number;
  }>({ kind: null, startPos: 0, startSize: 0 });

  const saveTimersRef = useRef<Map<string, number>>(new Map());
  const nodesRef = useRef<StudioNode[]>(nodes);
  nodesRef.current = nodes;
  const activeProjectRef = useRef<StudioProject | null>(null);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );
  activeProjectRef.current = activeProject;

  const { pathById, idByPath } = useMemo(() => buildProjectTree(nodes), [nodes]);

  const openTabs = useMemo(() => {
    if (!activeProject) return [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return activeProject.openTabIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is StudioNode => Boolean(n && n.type === 'file'));
  }, [activeProject, nodes]);

  const activeFile = useMemo(() => {
    if (!activeProject?.activeFileId) return null;
    return nodes.find((n) => n.id === activeProject.activeFileId && n.type === 'file') || null;
  }, [activeProject, nodes]);

  const activeFilePath = activeFile ? pathById.get(activeFile.id) || activeFile.name : null;

  // Subscribe to persistent Pyodide runtime singleton
  useEffect(() => {
    const unsub = runtimeManager.subscribe((snap) => setRuntime(snap));
    // Warm up core Pyodide runtime in background worker on mount
    if (runtimeManager.getSnapshot().status === 'idle') {
      runtimeManager.ensureInitialized().catch(() => {
        // Offline/error details are captured inside RuntimeSnapshot
      });
    }
    return unsub;
  }, [runtimeManager]);

  // Load workspace from IndexedDB
  const loadProjectIntoView = useCallback(async (projectId: string) => {
    const [projNodes, projHist] = await Promise.all([
      getProjectNodes(projectId),
      getProjectHistory(projectId)
    ]);
    setNodes(projNodes);
    setExecutionHistory(projHist);
    setSelectedExecutionId(projHist[0]?.id || null);
    setDirtyFileIds(new Set());
    await setMetaValue('activeProjectId', projectId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { projects: loadedProjects, activeProjectId: initialId, editorPrefs: prefs } =
        await ensureInitialWorkspace();
      if (cancelled) return;
      setProjects(loadedProjects);
      setActiveProjectId(initialId);
      setEditorPrefs(prefs);
      await loadProjectIntoView(initialId);
      if (!cancelled) setWorkspaceReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProjectIntoView]);

  // Handle incoming script handoff from PythonModule / PandasModule
  const handledJumpNonceRef = useRef<number>(0);
  useEffect(() => {
    if (!workspaceReady || !jumpTarget?.nonce || jumpTarget.nonce === handledJumpNonceRef.current) {
      return;
    }
    handledJumpNonceRef.current = jumpTarget.nonce;

    (async () => {
      if (jumpTarget.scriptContent && activeProjectRef.current) {
        const proj = activeProjectRef.current;
        const targetName = jumpTarget.scriptName || 'imported_lab_script.py';
        const existing = nodesRef.current.find(
          (n) => n.type === 'file' && n.parentId === null && n.name === targetName
        );
        let fileId: string;
        if (existing) {
          const updated: StudioNode = {
            ...existing,
            content: jumpTarget.scriptContent,
            updatedAt: Date.now()
          };
          await saveNode(updated);
          setNodes((prev) => prev.map((n) => (n.id === existing.id ? updated : n)));
          fileId = existing.id;
        } else {
          const created = createNodeRecord({
            projectId: proj.id,
            parentId: null,
            name: targetName,
            type: 'file',
            content: jumpTarget.scriptContent
          });
          await saveNode(created);
          setNodes((prev) => [...prev, created]);
          fileId = created.id;
        }
        const nextOpen = proj.openTabIds.includes(fileId)
          ? proj.openTabIds
          : [...proj.openTabIds, fileId];
        const nextProj: StudioProject = {
          ...proj,
          activeFileId: fileId,
          openTabIds: nextOpen,
          updatedAt: Date.now()
        };
        await saveProject(nextProj);
        setProjects((prev) => prev.map((p) => (p.id === nextProj.id ? nextProj : p)));
      }
    })();
  }, [jumpTarget, workspaceReady]);

  // Cleanup pending debounce timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of saveTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      saveTimersRef.current.clear();
    };
  }, []);

  // Mouse/pointer drag handlers for resizable panels
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.kind) return;
      if (drag.kind === 'explorer') {
        const next = Math.min(420, Math.max(190, drag.startSize + (e.clientX - drag.startPos)));
        setExplorerWidth(next);
      } else if (drag.kind === 'bottom') {
        const maxH = Math.max(240, window.innerHeight - 220);
        const next = Math.min(maxH, Math.max(140, drag.startSize - (e.clientY - drag.startPos)));
        setBottomHeight(next);
      }
    };
    const onPointerUp = () => {
      dragStateRef.current.kind = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const startDrag = (kind: 'explorer' | 'bottom', e: React.PointerEvent) => {
    dragStateRef.current = {
      kind,
      startPos: kind === 'explorer' ? e.clientX : e.clientY,
      startSize: kind === 'explorer' ? explorerWidth : bottomHeight
    };
    document.body.style.cursor = kind === 'explorer' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  // Project & File Actions
  const updateActiveProjectMeta = useCallback(async (patch: Partial<StudioProject>) => {
    const current = activeProjectRef.current;
    if (!current) return;
    const next: StudioProject = { ...current, ...patch, updatedAt: Date.now() };
    setProjects((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    await saveProject(next);
  }, []);

  const handleSelectProject = async (projectId: string) => {
    if (projectId === activeProjectId) return;
    // Flush dirty files before switching
    for (const fileId of dirtyFileIds) {
      const node = nodesRef.current.find((n) => n.id === fileId);
      if (node) await saveNode(node);
    }
    setActiveProjectId(projectId);
    await loadProjectIntoView(projectId);
  };

  const handleCreateProject = async (templateId: string, name: string) => {
    const { project } = await createProjectFromTemplate(templateId, name || undefined);
    setProjects((prev) => [project, ...prev]);
    setActiveProjectId(project.id);
    await loadProjectIntoView(project.id);
  };

  const handleDeleteProject = async (projectId: string) => {
    const remaining = projects.filter((p) => p.id !== projectId);
    if (remaining.length === 0) return;
    await deleteProjectAndData(projectId);
    setProjects(remaining);
    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0].id);
      await loadProjectIntoView(remaining[0].id);
    }
  };

  const handleOpenFile = useCallback(
    async (fileId: string) => {
      const current = activeProjectRef.current;
      if (!current) return;
      const nextOpen = current.openTabIds.includes(fileId)
        ? current.openTabIds
        : [...current.openTabIds, fileId];
      await updateActiveProjectMeta({
        activeFileId: fileId,
        openTabIds: nextOpen
      });
      setMobilePane('editor');
    },
    [updateActiveProjectMeta]
  );

  const handleCloseTab = async (fileId: string) => {
    if (!activeProject) return;
    if (dirtyFileIds.has(fileId)) {
      const node = nodes.find((n) => n.id === fileId);
      if (node) await saveNode(node);
      setDirtyFileIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
    const nextTabs = activeProject.openTabIds.filter((id) => id !== fileId);
    let nextActive = activeProject.activeFileId;
    if (nextActive === fileId) {
      const closedIdx = activeProject.openTabIds.indexOf(fileId);
      nextActive = nextTabs[Math.max(0, closedIdx - 1)] || nextTabs[0] || null;
    }
    await updateActiveProjectMeta({ openTabIds: nextTabs, activeFileId: nextActive });
  };

  const handleSaveFile = useCallback(async (fileId: string) => {
    const pendingTimer = saveTimersRef.current.get(fileId);
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      saveTimersRef.current.delete(fileId);
    }
    const target = nodesRef.current.find((n) => n.id === fileId);
    if (!target) return;
    await saveNode({ ...target, updatedAt: Date.now() });
    setDirtyFileIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  const handleChangeContent = useCallback(
    (fileId: string, content: string) => {
      const now = Date.now();
      setNodes((prev) =>
        prev.map((n) => (n.id === fileId ? { ...n, content, updatedAt: now } : n))
      );
      setDirtyFileIds((prev) => {
        const next = new Set(prev);
        next.add(fileId);
        return next;
      });

      const oldTimer = saveTimersRef.current.get(fileId);
      if (oldTimer) window.clearTimeout(oldTimer);
      const timer = window.setTimeout(() => {
        handleSaveFile(fileId);
      }, 650);
      saveTimersRef.current.set(fileId, timer);
    },
    [handleSaveFile]
  );

  const handleCreateNode = useCallback(
    async (params: {
      parentId: string | null;
      name: string;
      type: 'file' | 'folder';
      content?: string;
    }): Promise<string | null> => {
      const current = activeProjectRef.current;
      if (!current) return 'No active project.';
      const siblings = nodesRef.current
        .filter((n) => (n.parentId ?? null) === params.parentId)
        .map((n) => n.name);
      const err = validateNodeName(params.name, siblings);
      if (err) return err;

      const defaultContent =
        params.type === 'file'
          ? params.content ??
            (params.name.endsWith('.py') ? `# ${params.name}\n\n` : '')
          : undefined;
      const created = createNodeRecord({
        projectId: current.id,
        parentId: params.parentId,
        name: params.name,
        type: params.type,
        content: defaultContent
      });
      await saveNode(created);
      setNodes((prev) => [...prev, created]);
      if (created.type === 'file') {
        await updateActiveProjectMeta({
          activeFileId: created.id,
          openTabIds: [...current.openTabIds, created.id]
        });
        setMobilePane('editor');
      }
      return null;
    },
    [updateActiveProjectMeta]
  );

  const handleRenameNode = async (nodeId: string, newName: string): Promise<string | null> => {
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return 'Item not found.';
    const siblings = nodes
      .filter((n) => (n.parentId ?? null) === (target.parentId ?? null) && n.id !== nodeId)
      .map((n) => n.name);
    const err = validateNodeName(newName, siblings);
    if (err) return err;

    const updated: StudioNode = { ...target, name: newName.trim(), updatedAt: Date.now() };
    await saveNode(updated);
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? updated : n)));
    return null;
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!activeProject) return;
    const idsToDelete = collectDescendantIds(nodeId, nodes);
    const deleteSet = new Set(idsToDelete);
    await deleteNodesByIds(idsToDelete);
    setNodes((prev) => prev.filter((n) => !deleteSet.has(n.id)));

    const nextTabs = activeProject.openTabIds.filter((id) => !deleteSet.has(id));
    const nextActive =
      activeProject.activeFileId && deleteSet.has(activeProject.activeFileId)
        ? nextTabs[0] || null
        : activeProject.activeFileId;
    await updateActiveProjectMeta({ openTabIds: nextTabs, activeFileId: nextActive });
  };

  // Sync any files created/updated by Python script execution back into the project
  const syncModifiedFilesFromRuntime = useCallback(
    async (modified: Array<{ path: string; content: string }>) => {
      const proj = activeProjectRef.current;
      if (!proj || modified.length === 0) return;

      let currentNodes = [...nodesRef.current];
      const ensureFolderChain = async (parts: string[]): Promise<string | null> => {
        let parentId: string | null = null;
        for (const folderName of parts) {
          const existing = currentNodes.find(
            (n) =>
              n.type === 'folder' &&
              (n.parentId ?? null) === parentId &&
              n.name === folderName
          );
          if (existing) {
            parentId = existing.id;
          } else {
            const folder = createNodeRecord({
              projectId: proj.id,
              parentId,
              name: folderName,
              type: 'folder'
            });
            await saveNode(folder);
            currentNodes.push(folder);
            parentId = folder.id;
          }
        }
        return parentId;
      };

      const { idByPath: latestIdByPath } = buildProjectTree(currentNodes);
      for (const file of modified) {
        const existingId = latestIdByPath.get(file.path);
        if (existingId) {
          const existing = currentNodes.find((n) => n.id === existingId);
          if (existing && existing.content !== file.content) {
            const updated: StudioNode = {
              ...existing,
              content: file.content,
              updatedAt: Date.now()
            };
            await saveNode(updated);
            currentNodes = currentNodes.map((n) => (n.id === existingId ? updated : n));
          }
        } else {
          const segs = file.path.split('/').filter(Boolean);
          const fileName = segs.pop() || 'output.txt';
          const parentId = await ensureFolderChain(segs);
          const created = createNodeRecord({
            projectId: proj.id,
            parentId,
            name: fileName,
            type: 'file',
            content: file.content
          });
          await saveNode(created);
          currentNodes.push(created);
        }
      }
      setNodes(currentNodes);
    },
    []
  );

  // Build flat file array from current project tree
  const collectWorkspaceFilesForRuntime = useCallback(() => {
    const { pathById: map } = buildProjectTree(nodesRef.current);
    return nodesRef.current
      .filter((n) => n.type === 'file')
      .map((n) => ({
        path: map.get(n.id) || n.name,
        content: n.content ?? ''
      }));
  }, []);

  const appendTerminal = useCallback((entry: Omit<TerminalEntry, 'id' | 'timestamp'>) => {
    setTerminalEntries((prev) => [
      ...prev.slice(-240),
      { ...entry, id: makeUiId('term'), timestamp: Date.now() }
    ]);
  }, []);

  // Execution Handlers
  const runCodeInWorkspace = useCallback(
    async (mode: 'file' | 'selection', codeOverride?: string) => {
      const proj = activeProjectRef.current;
      const file = activeFile;
      if (!proj) return;
      if (mode === 'file' && (!file || inferFileKind(file.name) !== 'python')) return;

      const codeToRun = mode === 'selection' ? codeOverride || '' : file?.content || '';
      if (!codeToRun.trim()) return;

      const filePath = file ? pathById.get(file.id) || file.name : 'selection.py';
      if (mode === 'file' && file && dirtyFileIds.has(file.id)) {
        await handleSaveFile(file.id);
      }

      setShowBottomPanel(true);
      setBottomTab('output');
      setMobilePane('output');

      appendTerminal({
        kind: 'system',
        text: `$ python ${mode === 'selection' ? `<selection from ${filePath}>` : filePath}`
      });

      const res = await runtimeManager.execute({
        mode,
        code: codeToRun,
        filePath,
        files: collectWorkspaceFilesForRuntime(),
        onStream: (stream, text) => {
          appendTerminal({ kind: stream, text: text.replace(/\n$/, '') });
        }
      });

      await syncModifiedFilesFromRuntime(res.modifiedFiles);

      const record: ExecutionRecord = {
        id: makeUiId('exec'),
        projectId: proj.id,
        timestamp: Date.now(),
        mode,
        filePath,
        codePreview: codeToRun.slice(0, 120),
        durationMs: res.durationMs,
        status: res.status,
        artifacts: res.artifacts
      };
      const nextHist = await appendExecutionHistory(record);
      setExecutionHistory(nextHist);
      setSelectedExecutionId(record.id);

      if (res.status === 'error') {
        const tbArt = res.artifacts.find((a) => a.kind === 'traceback');
        if (tbArt && tbArt.kind === 'traceback') {
          appendTerminal({ kind: 'error', text: tbArt.rawText.trim() });
        }
      }
    },
    [
      activeFile,
      appendTerminal,
      collectWorkspaceFilesForRuntime,
      dirtyFileIds,
      handleSaveFile,
      pathById,
      runtimeManager,
      syncModifiedFilesFromRuntime
    ]
  );

  const handleRunReplCommand = useCallback(
    async (cmd: string) => {
      appendTerminal({ kind: 'input', text: `>>> ${cmd}` });
      const res = await runtimeManager.execute({
        mode: 'repl',
        code: cmd,
        filePath: '<repl>',
        files: collectWorkspaceFilesForRuntime(),
        onStream: (stream, text) => {
          appendTerminal({ kind: stream, text: text.replace(/\n$/, '') });
        }
      });

      if (res.replResult !== null) {
        appendTerminal({ kind: 'result', text: res.replResult });
      }
      if (res.status === 'error') {
        const tbArt = res.artifacts.find((a) => a.kind === 'traceback');
        if (tbArt && tbArt.kind === 'traceback') {
          appendTerminal({ kind: 'error', text: tbArt.rawText.trim() });
        } else if (res.stderr) {
          appendTerminal({ kind: 'error', text: res.stderr.trim() });
        }
      }

      // If REPL created tables or plots, surface them in Output & Plots automatically!
      const hasRichArtifacts = res.artifacts.some(
        (a) => a.kind === 'image' || a.kind === 'table'
      );
      if (hasRichArtifacts && activeProjectRef.current) {
        const record: ExecutionRecord = {
          id: makeUiId('exec'),
          projectId: activeProjectRef.current.id,
          timestamp: Date.now(),
          mode: 'repl',
          filePath: '<repl>',
          codePreview: cmd.slice(0, 120),
          durationMs: res.durationMs,
          status: res.status,
          artifacts: res.artifacts
        };
        const nextHist = await appendExecutionHistory(record);
        setExecutionHistory(nextHist);
        setSelectedExecutionId(record.id);
        setBottomTab('output');
      }
    },
    [appendTerminal, collectWorkspaceFilesForRuntime, runtimeManager]
  );

  const handleJumpToLine = useCallback(
    async (targetPath: string, line: number) => {
      const normalized = targetPath.replace(/^\/workspace\//, '');
      const nodeId = idByPath.get(normalized);
      if (nodeId && activeProject?.activeFileId !== nodeId) {
        await handleOpenFile(nodeId);
      }
      setEditorJump({ filePath: normalized, line, nonce: Date.now() });
      setMobilePane('editor');
    },
    [activeProject?.activeFileId, handleOpenFile, idByPath]
  );

  const updateEditorPref = async <K extends keyof EditorPreferences>(
    key: K,
    val: EditorPreferences[K]
  ) => {
    const next = { ...editorPrefs, [key]: val };
    setEditorPrefs(next);
    await setMetaValue('editorPrefs', next);
  };

  // Future AI-Ready Context Snapshot & StudioAssistantBridge
  const contextSnapshot: WorkspaceContextSnapshot | null = useMemo(() => {
    if (!activeProject) return null;
    const filesSummary = nodes
      .filter((n) => n.type === 'file')
      .map((n) => {
        const content = n.content || '';
        return {
          path: pathById.get(n.id) || n.name,
          kind: inferFileKind(n.name),
          sizeBytes: new Blob([content]).size,
          lineCount: content ? content.split('\n').length : 0
        };
      });

    return {
      projectId: activeProject.id,
      projectName: activeProject.name,
      activeFilePath,
      activeFileContent: activeFile?.content ?? null,
      selectionCode: selectedCode,
      filesSummary,
      runtimeStatus: runtime.status,
      pythonVersion: runtime.pythonVersion,
      loadedPackages: runtime.packages.filter((p) => p.status === 'loaded').map((p) => p.id),
      variables: runtime.variables,
      diagnostics: runtime.diagnostics,
      recentErrors: runtime.diagnostics.map((d) => `${d.filePath}:${d.line} ${d.message}`)
    };
  }, [activeProject, activeFile, activeFilePath, nodes, pathById, runtime, selectedCode]);

  const assistantBridge: StudioAssistantBridge = useMemo(
    () => ({
      getWorkspaceSnapshot: () => contextSnapshot,
      readFile: (path: string) => {
        const id = idByPath.get(path);
        return id ? nodesRef.current.find((n) => n.id === id)?.content ?? null : null;
      },
      listFilePaths: () =>
        nodesRef.current.filter((n) => n.type === 'file').map((n) => pathById.get(n.id) || n.name),
      getDiagnostics: () => runtime.diagnostics,
      applyFilePatch: async (patch: ProposedFilePatch) => {
        const id = idByPath.get(patch.targetPath);
        if (!id) return false;
        handleChangeContent(id, patch.newContent);
        await handleSaveFile(id);
        return true;
      },
      createFile: async (path: string, content: string) => {
        const segs = path.split('/').filter(Boolean);
        const name = segs.pop();
        if (!name) return false;
        const err = await handleCreateNode({
          parentId: null,
          name,
          type: 'file',
          content
        });
        return err === null;
      }
    }),
    [contextSnapshot, handleChangeContent, handleCreateNode, handleSaveFile, idByPath, pathById, runtime.diagnostics]
  );

  // Expose bridge cleanly on global window for future integration hooks without requiring any AI runtime
  useEffect(() => {
    (window as unknown as { __PHARMLAB_STUDIO_BRIDGE__?: StudioAssistantBridge }).__PHARMLAB_STUDIO_BRIDGE__ =
      assistantBridge;
    return () => {
      delete (window as unknown as { __PHARMLAB_STUDIO_BRIDGE__?: StudioAssistantBridge })
        .__PHARMLAB_STUDIO_BRIDGE__;
    };
  }, [assistantBridge]);

  const isBusy = runtime.status === 'executing' || runtime.status === 'loading_package';
  const canRunActive = Boolean(activeFile && inferFileKind(activeFile.name) === 'python');
  const latestPlotCount =
    executionHistory[0]?.artifacts.filter((a) => a.kind === 'image').length || 0;

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* Top IDE Workspace Header */}
      <header className="h-12 px-2.5 sm:px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
        {/* Left: Exit + Brand + Project Name */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onExitStudio}
            className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exit to PharmaLab</span>
            <span className="sm:hidden">Exit</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 min-w-0 pl-1 border-l border-slate-800">
            <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-display text-sm font-bold text-white whitespace-nowrap">
              Python Studio
            </span>
            {activeProject && (
              <span className="text-xs text-slate-400 truncate">
                · {activeProject.name}
              </span>
            )}
          </div>
        </div>

        {/* Center/Right: Runtime Status & Execution Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 max-w-xs truncate">
            {(runtime.status === 'initializing' || isBusy) && (
              <RefreshCw className="w-3 h-3 text-sky-400 animate-spin shrink-0" />
            )}
            <span className="truncate font-code text-[11px]">{runtime.statusDetail}</span>
          </div>

          {dirtyFileIds.size > 0 && activeFile && (
            <button
              type="button"
              onClick={() => handleSaveFile(activeFile.id)}
              className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-sky-300 inline-flex items-center gap-1 whitespace-nowrap"
              title="Save active file (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}

          {isBusy ? (
            <button
              type="button"
              onClick={() => runtimeManager.interruptExecution()}
              className="min-h-[34px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 whitespace-nowrap"
              title="Stop execution"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!canRunActive}
              onClick={() => runCodeInWorkspace('file')}
              className="min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-white inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              title="Run Active File (Ctrl+Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run File</span>
            </button>
          )}

          {/* Desktop Panel Toggles */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={() => setShowExplorer((v) => !v)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showExplorer
                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Project Explorer"
              aria-label="Toggle Project Explorer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowBottomPanel((v) => !v)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showBottomPanel
                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Terminal & Output Panel"
              aria-label="Toggle Terminal and Output Panel"
            >
              <PanelBottom className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowInspector((v) => !v)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showInspector
                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Outline & Context Inspector"
              aria-label="Toggle Outline and Context Inspector"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>

          {/* Editor Settings Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsPopover((v) => !v)}
              className={`min-h-[34px] min-w-[34px] inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors ${
                showSettingsPopover
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Editor settings"
              aria-label="Editor settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {showSettingsPopover && (
              <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Editor Settings</span>
                  <button
                    type="button"
                    onClick={() => setShowSettingsPopover(false)}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    Done
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Font Size</span>
                    <span className="font-code tabular-nums">{editorPrefs.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    step="1"
                    value={editorPrefs.fontSize}
                    onChange={(e) => updateEditorPref('fontSize', Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300">Color Theme</label>
                  <select
                    value={editorPrefs.theme}
                    onChange={(e) =>
                      updateEditorPref(
                        'theme',
                        e.target.value as EditorPreferences['theme']
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="vs-dark">PharmLab Slate Dark</option>
                    <option value="hc-black">High Contrast Dark</option>
                    <option value="vs">Light Paper IDE</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Indentation</span>
                  <div className="flex gap-1">
                    {([2, 4] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => updateEditorPref('tabSize', sz)}
                        className={`px-2 py-1 rounded text-[11px] font-code ${
                          editorPrefs.tabSize === sz
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {sz} spaces
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between cursor-pointer text-slate-300">
                  <span>Word Wrap</span>
                  <input
                    type="checkbox"
                    checked={editorPrefs.wordWrap === 'on'}
                    onChange={(e) =>
                      updateEditorPref('wordWrap', e.target.checked ? 'on' : 'off')
                    }
                    className="accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer text-slate-300">
                  <span>Show Minimap</span>
                  <input
                    type="checkbox"
                    checked={editorPrefs.minimap}
                    onChange={(e) => updateEditorPref('minimap', e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile View Switcher (< md) */}
      <div className="md:hidden grid grid-cols-4 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
        {[
          { id: 'explorer' as const, label: 'Files', icon: FolderTree },
          { id: 'editor' as const, label: 'Editor', icon: Code2 },
          {
            id: 'output' as const,
            label: latestPlotCount > 0 ? `Output (${latestPlotCount})` : 'Output',
            icon: PanelBottom
          },
          { id: 'terminal' as const, label: 'REPL', icon: TerminalIcon }
        ].map((pane) => {
          const Icon = pane.icon;
          const active = mobilePane === pane.id;
          return (
            <button
              key={pane.id}
              type="button"
              onClick={() => {
                setMobilePane(pane.id);
                if (pane.id === 'output') setBottomTab('output');
                if (pane.id === 'terminal') setBottomTab('terminal');
              }}
              className={`min-h-[42px] py-2 px-1 flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-emerald-500 text-emerald-300 font-semibold'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{pane.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main IDE Workbench Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Project Explorer */}
        <div
          className={`${
            mobilePane === 'explorer' ? 'flex w-full md:w-auto' : 'hidden'
          } ${showExplorer ? 'md:flex' : 'md:hidden'} shrink-0 h-full min-h-0 overflow-hidden`}
          style={{ width: isDesktop && showExplorer ? explorerWidth : undefined }}
        >
          <div className="w-full h-full min-h-0 overflow-hidden">
            <ProjectExplorerPanel
              projects={projects}
              activeProject={activeProject}
              nodes={nodes}
              activeFileId={activeProject?.activeFileId || null}
              dirtyFileIds={dirtyFileIds}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onOpenFile={handleOpenFile}
              onCreateNode={handleCreateNode}
              onRenameNode={handleRenameNode}
              onDeleteNode={handleDeleteNode}
            />
          </div>
        </div>

        {/* Explorer Drag Handle */}
        {showExplorer && (
          <div
            role="separator"
            aria-orientation="vertical"
            onPointerDown={(e) => startDrag('explorer', e)}
            className="hidden md:block w-1 bg-slate-800/70 hover:bg-emerald-500/70 cursor-col-resize transition-colors shrink-0"
          />
        )}

        {/* Center: Editor + Bottom Terminal/Output */}
        <div
          className={`flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col ${
            mobilePane === 'explorer' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Monaco Code Editor Region */}
          <div
            className={`min-h-0 min-w-0 overflow-hidden flex-1 ${
              mobilePane === 'output' || mobilePane === 'terminal'
                ? 'hidden md:block'
                : bottomExpanded && showBottomPanel
                ? 'hidden'
                : 'block'
            }`}
          >
            <MonacoCodePanel
              openTabs={openTabs}
              activeFile={activeFile}
              activeFilePath={activeFilePath}
              dirtyFileIds={dirtyFileIds}
              editorPrefs={editorPrefs}
              diagnostics={runtime.diagnostics}
              isExecuting={isBusy}
              isCompactViewport={!isDesktop}
              isCompactWidth={isCompactEditor}
              jumpTarget={editorJump}
              onSelectTab={(fileId) => handleOpenFile(fileId)}
              onCloseTab={handleCloseTab}
              onChangeContent={handleChangeContent}
              onSaveFile={handleSaveFile}
              onToggleWordWrap={() =>
                updateEditorPref('wordWrap', editorPrefs.wordWrap === 'on' ? 'off' : 'on')
              }
              onRunFile={() => runCodeInWorkspace('file')}
              onRunSelection={(sel) => runCodeInWorkspace('selection', sel)}
              onSelectionChange={setSelectedCode}
              onCreateMainPy={() =>
                handleCreateNode({ parentId: null, name: 'main.py', type: 'file' })
              }
            />
          </div>

          {/* Horizontal Drag Handle */}
          {showBottomPanel && !bottomExpanded && (
            <div
              role="separator"
              aria-orientation="horizontal"
              onPointerDown={(e) => startDrag('bottom', e)}
              className="hidden md:block h-1.5 bg-slate-800/80 hover:bg-emerald-500/70 cursor-row-resize transition-colors shrink-0"
            />
          )}

          {/* Bottom Output & Terminal Workbench */}
          <div
            className={`${
              bottomExpanded
                ? 'flex flex-col flex-1 min-h-0 overflow-hidden'
                : mobilePane === 'output' || mobilePane === 'terminal'
                ? 'flex flex-col flex-1 min-h-0 overflow-hidden md:block md:flex-none md:shrink-0 md:overflow-hidden'
                : 'hidden md:block md:shrink-0 md:overflow-hidden'
            } ${showBottomPanel ? '' : 'md:hidden'}`}
            style={{
              height:
                isDesktop && !bottomExpanded && showBottomPanel ? bottomHeight : undefined
            }}
          >
            <TerminalOutputPanel
              activeTab={bottomTab}
              onChangeTab={setBottomTab}
              isExpanded={bottomExpanded}
              onToggleExpand={() => setBottomExpanded((v) => !v)}
              onCollapse={() => {
                setBottomExpanded(false);
                setShowBottomPanel(false);
                setMobilePane('editor');
              }}
              runtime={runtime}
              terminalEntries={terminalEntries}
              executionHistory={executionHistory}
              selectedExecutionId={selectedExecutionId}
              onSelectExecution={setSelectedExecutionId}
              onClearOutput={async () => {
                if (!activeProject) return;
                await clearProjectHistory(activeProject.id);
                setExecutionHistory([]);
                setSelectedExecutionId(null);
              }}
              onClearTerminal={() => setTerminalEntries([])}
              onRunReplCommand={handleRunReplCommand}
              onResetGlobals={() => runtimeManager.resetSession()}
              onInitRuntime={() => runtimeManager.ensureInitialized()}
              onLoadPackage={(pkg: PackageId) => runtimeManager.loadPackages([pkg])}
              onJumpToLine={handleJumpToLine}
            />
          </div>
        </div>

        {/* Optional Right Context & Outline Inspector */}
        {showInspector && (
          <div className="hidden lg:block w-72 shrink-0 h-full">
            <ContextInspectorPanel
              activeFile={activeFile}
              snapshot={contextSnapshot}
              onJumpToLine={handleJumpToLine}
              onClose={() => setShowInspector(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
