import React, { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  FilePlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Check,
  X
} from 'lucide-react';
import { STARTER_PROJECT_TEMPLATES } from '../starterProjects';
import { buildProjectTree, inferFileKind, TreeBranch, validateNodeName } from '../studioUtils';
import { StudioNode, StudioProject } from '../types';

interface ProjectExplorerPanelProps {
  projects: StudioProject[];
  activeProject: StudioProject | null;
  nodes: StudioNode[];
  activeFileId: string | null;
  dirtyFileIds: Set<string>;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (templateId: string, name: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenFile: (fileId: string) => void;
  onCreateNode: (params: {
    parentId: string | null;
    name: string;
    type: 'file' | 'folder';
    content?: string;
  }) => Promise<string | null>;
  onRenameNode: (nodeId: string, newName: string) => Promise<string | null>;
  onDeleteNode: (nodeId: string) => Promise<void>;
}

function FileIcon({ name }: { name: string }) {
  const kind = inferFileKind(name);
  if (kind === 'python') {
    return <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (kind === 'csv') {
    return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

export default function ProjectExplorerPanel({
  projects,
  activeProject,
  nodes,
  activeFileId,
  dirtyFileIds,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onOpenFile,
  onCreateNode,
  onRenameNode,
  onDeleteNode
}: ProjectExplorerPanelProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [creatingState, setCreatingState] = useState<{
    parentId: string | null;
    type: 'file' | 'folder';
  } | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const [confirmDeleteNodeId, setConfirmDeleteNodeId] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectTemplate, setNewProjectTemplate] = useState(STARTER_PROJECT_TEMPLATES[0].id);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProjectBusy, setCreatingProjectBusy] = useState(false);

  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  const { roots } = useMemo(() => buildProjectTree(nodes), [nodes]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !(prev[folderId] ?? true)
    }));
  };

  const getSiblingNames = (parentId: string | null, excludeId?: string) =>
    nodes
      .filter((n) => (n.parentId ?? null) === parentId && n.id !== excludeId)
      .map((n) => n.name);

  const startCreate = (parentId: string | null, type: 'file' | 'folder') => {
    if (parentId) {
      setExpandedFolders((prev) => ({ ...prev, [parentId]: true }));
    }
    setCreatingState({ parentId, type });
    setNewNameInput(type === 'file' ? 'untitled.py' : 'utils');
    setCreateError(null);
    setRenamingId(null);
    setConfirmDeleteNodeId(null);
  };

  const submitCreate = async () => {
    if (!creatingState) return;
    const err = validateNodeName(
      newNameInput,
      getSiblingNames(creatingState.parentId)
    );
    if (err) {
      setCreateError(err);
      return;
    }
    const serverErr = await onCreateNode({
      parentId: creatingState.parentId,
      name: newNameInput.trim(),
      type: creatingState.type
    });
    if (serverErr) {
      setCreateError(serverErr);
      return;
    }
    setCreatingState(null);
    setCreateError(null);
  };

  const startRename = (node: StudioNode) => {
    setRenamingId(node.id);
    setRenameValue(node.name);
    setRenameError(null);
    setCreatingState(null);
    setConfirmDeleteNodeId(null);
  };

  const submitRename = async (node: StudioNode) => {
    const trimmed = renameValue.trim();
    if (trimmed === node.name) {
      setRenamingId(null);
      return;
    }
    const err = validateNodeName(trimmed, getSiblingNames(node.parentId, node.id));
    if (err) {
      setRenameError(err);
      return;
    }
    const serverErr = await onRenameNode(node.id, trimmed);
    if (serverErr) {
      setRenameError(serverErr);
      return;
    }
    setRenamingId(null);
    setRenameError(null);
  };

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const content = await file.text();
    const siblingNames = getSiblingNames(null);
    let finalName = file.name;
    if (siblingNames.some((s) => s.toLowerCase() === finalName.toLowerCase())) {
      const dot = finalName.lastIndexOf('.');
      const stem = dot > 0 ? finalName.slice(0, dot) : finalName;
      const ext = dot > 0 ? finalName.slice(dot) : '';
      finalName = `${stem}_${Date.now().toString().slice(-4)}${ext}`;
    }
    await onCreateNode({
      parentId: null,
      name: finalName,
      type: 'file',
      content
    });
  };

  const renderBranch = (branch: TreeBranch, depth: number) => {
    const { node, children } = branch;
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[node.id] ?? true;
    const isActive = node.id === activeFileId;
    const isDirty = dirtyFileIds.has(node.id);
    const isRenaming = renamingId === node.id;
    const isConfirmDelete = confirmDeleteNodeId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center justify-between gap-1.5 pr-2 py-1 text-xs rounded-md mx-1.5 transition-colors ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-200 font-medium'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          {isRenaming ? (
            <div className="flex-1 min-w-0 space-y-1 py-0.5">
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    setRenameError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(node);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => submitRename(node)}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                  aria-label="Confirm rename"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingId(null)}
                  className="p-1 text-slate-400 hover:text-white"
                  aria-label="Cancel rename"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {renameError && <p className="text-[11px] text-rose-400">{renameError}</p>}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (isFolder ? toggleFolder(node.id) : onOpenFile(node.id))}
                className="flex items-center gap-1.5 min-w-0 flex-1 text-left py-0.5"
              >
                {isFolder ? (
                  <>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-3.5 shrink-0" />
                    <FileIcon name={node.name} />
                  </>
                )}
                <span className="truncate">{node.name}</span>
                {isDirty && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                    title="Unsaved edits"
                  />
                )}
              </button>

              {isConfirmDelete ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteNode(node.id);
                      setConfirmDeleteNodeId(null);
                    }}
                    className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-medium"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteNodeId(null)}
                    className="p-0.5 text-slate-400 hover:text-white"
                    aria-label="Cancel delete"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex md:hidden md:group-hover:flex items-center gap-0.5 shrink-0">
                  {isFolder && (
                    <>
                      <button
                        type="button"
                        onClick={() => startCreate(node.id, 'file')}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                        title="New file in folder"
                        aria-label={`New file in ${node.name}`}
                      >
                        <FilePlus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startCreate(node.id, 'folder')}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                        title="New subfolder"
                        aria-label={`New subfolder in ${node.name}`}
                      >
                        <FolderPlus className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => startRename(node)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Rename"
                    aria-label={`Rename ${node.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteNodeId(node.id)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400"
                    title="Delete"
                    aria-label={`Delete ${node.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {isFolder && isExpanded && (
          <div>
            {creatingState && creatingState.parentId === node.id && (
              <div
                className="mx-1.5 my-1 space-y-1"
                style={{ paddingLeft: `${22 + depth * 14}px` }}
              >
                <div className="flex items-center gap-1 pr-2">
                  <input
                    autoFocus
                    type="text"
                    value={newNameInput}
                    onChange={(e) => {
                      setNewNameInput(e.target.value);
                      setCreateError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitCreate();
                      if (e.key === 'Escape') setCreatingState(null);
                    }}
                    placeholder={creatingState.type === 'file' ? 'module.py' : 'folder_name'}
                    className="w-full bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={submitCreate}
                    className="p-1 text-emerald-400 hover:text-emerald-300"
                    aria-label="Create"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatingState(null)}
                    className="p-1 text-slate-400 hover:text-white"
                    aria-label="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {createError && <p className="text-[11px] text-rose-400">{createError}</p>}
              </div>
            )}
            {children.map((child) => renderBranch(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="h-full w-full min-h-0 overflow-hidden flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 select-none">
      {/* Project Switcher Header */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Project Workspace
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const tpl = STARTER_PROJECT_TEMPLATES[0];
                setNewProjectTemplate(tpl.id);
                setNewProjectName('');
                setShowNewProjectModal(true);
              }}
              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 inline-flex items-center gap-1 transition-colors"
              title="Create new project"
            >
              <Plus className="w-3 h-3" />
              <span>Project</span>
            </button>
            {projects.length > 1 && activeProject && (
              <button
                type="button"
                onClick={() => setConfirmDeleteProject((v) => !v)}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Delete active project"
                aria-label="Delete active project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <select
          value={activeProject?.id || ''}
          onChange={(e) => {
            setConfirmDeleteProject(false);
            onSelectProject(e.target.value);
          }}
          aria-label="Select active Python project"
          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {confirmDeleteProject && activeProject && (
          <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-500/40 space-y-1.5">
            <p className="text-[11px] text-rose-200">
              Delete "{activeProject.name}" and all its files?
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  await onDeleteProject(activeProject.id);
                  setConfirmDeleteProject(false);
                }}
                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteProject(false)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Explorer Toolbar */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800/80">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Files
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => startCreate(null, 'file')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="New File"
            aria-label="New file"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => startCreate(null, 'folder')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="New Folder"
            aria-label="New folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fileUploadRef.current?.click()}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Import local .py / .csv file"
            aria-label="Import local file"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileUploadRef}
            type="file"
            accept=".py,.csv,.tsv,.json,.txt,.md"
            onChange={handleLocalFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1.5 space-y-0.5">
        {creatingState && creatingState.parentId === null && (
          <div className="mx-2 my-1 space-y-1">
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={newNameInput}
                onChange={(e) => {
                  setNewNameInput(e.target.value);
                  setCreateError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCreate();
                  if (e.key === 'Escape') setCreatingState(null);
                }}
                placeholder={creatingState.type === 'file' ? 'script.py' : 'folder_name'}
                className="w-full bg-slate-950 border border-emerald-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={submitCreate}
                className="p-1 text-emerald-400 hover:text-emerald-300"
                aria-label="Create item"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCreatingState(null)}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="Cancel create"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {createError && <p className="text-[11px] text-rose-400">{createError}</p>}
          </div>
        )}

        {roots.length > 0 ? (
          roots.map((branch) => renderBranch(branch, 0))
        ) : (
          <div className="px-4 py-8 text-center space-y-2">
            <p className="text-xs text-slate-500">Project has no files yet.</p>
            <button
              type="button"
              onClick={() => startCreate(null, 'file')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300"
            >
              Create main.py
            </button>
          </div>
        )}
      </div>

      {/* Project Summary Footer */}
      {activeProject && (
        <div className="px-3 py-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between tabular-nums">
          <span>{nodes.filter((n) => n.type === 'file').length} files</span>
          <span>IndexedDB local</span>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNewProjectModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Create Python Studio project"
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Create Python Studio Project</h2>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={
                  STARTER_PROJECT_TEMPLATES.find((t) => t.id === newProjectTemplate)?.name ||
                  'My Pharma Analysis'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-slate-300">Starter Template</span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {STARTER_PROJECT_TEMPLATES.map((tpl) => {
                  const selected = tpl.id === newProjectTemplate;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setNewProjectTemplate(tpl.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selected
                          ? 'bg-emerald-500/10 border-emerald-500/60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{tpl.name}</span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {tpl.files.length} {tpl.files.length === 1 ? 'file' : 'files'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                      {tpl.recommendedPackages.length > 0 && (
                        <p className="text-[11px] text-emerald-400 mt-1.5">
                          Packages: {tpl.recommendedPackages.join(' · ')}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creatingProjectBusy}
                onClick={async () => {
                  setCreatingProjectBusy(true);
                  try {
                    await onCreateProject(newProjectTemplate, newProjectName);
                    setShowNewProjectModal(false);
                  } finally {
                    setCreatingProjectBusy(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white"
              >
                {creatingProjectBusy ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
