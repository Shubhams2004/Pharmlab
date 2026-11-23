import { STARTER_PROJECT_TEMPLATES, StarterProjectTemplate } from './starterProjects';
import {
  EditorPreferences,
  ExecutionRecord,
  StudioNode,
  StudioProject
} from './types';

const DB_NAME = 'pharmlab_python_studio_v1';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_NODES = 'nodes';
const STORE_HISTORY = 'history';
const STORE_META = 'meta';

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 14,
  theme: 'vs-dark',
  tabSize: 4,
  wordWrap: 'off',
  minimap: false
};

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function openStudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NODES)) {
        const nodeStore = db.createObjectStore(STORE_NODES, { keyPath: 'id' });
        nodeStore.createIndex('by_project', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const histStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        histStore.createIndex('by_project', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open Python Studio database.'));
  });
}

function txPromise<T>(tx: IDBTransaction, value?: T): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

function reqPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed.'));
  });
}

export async function getMetaValue<T>(key: string): Promise<T | null> {
  const db = await openStudioDb();
  const tx = db.transaction(STORE_META, 'readonly');
  const row = await reqPromise<{ key: string; value: T } | undefined>(
    tx.objectStore(STORE_META).get(key)
  );
  return row ? row.value : null;
}

export async function setMetaValue<T>(key: string, value: T): Promise<void> {
  const db = await openStudioDb();
  const tx = db.transaction(STORE_META, 'readwrite');
  tx.objectStore(STORE_META).put({ key, value });
  await txPromise(tx);
}

export async function getAllProjects(): Promise<StudioProject[]> {
  const db = await openStudioDb();
  const tx = db.transaction(STORE_PROJECTS, 'readonly');
  const rows = await reqPromise<StudioProject[]>(tx.objectStore(STORE_PROJECTS).getAll());
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProjectNodes(projectId: string): Promise<StudioNode[]> {
  const db = await openStudioDb();
  const tx = db.transaction(STORE_NODES, 'readonly');
  const index = tx.objectStore(STORE_NODES).index('by_project');
  return reqPromise<StudioNode[]>(index.getAll(projectId));
}

export async function saveProject(project: StudioProject): Promise<void> {
  const db = await openStudioDb();
  const tx = db.transaction(STORE_PROJECTS, 'readwrite');
  tx.objectStore(STORE_PROJECTS).put(project);
  await txPromise(tx);
}

export async function saveNode(node: StudioNode): Promise<void> {
  const db = await openStudioDb();
  const tx = db.transaction(STORE_NODES, 'readwrite');
  tx.objectStore(STORE_NODES).put(node);
  await txPromise(tx);
}

export async function saveNodes(nodes: StudioNode[]): Promise<void> {
  if (nodes.length === 0) return;
  const db = await openStudioDb();
  const tx = db.transaction(STORE_NODES, 'readwrite');
  const store = tx.objectStore(STORE_NODES);
  for (const node of nodes) {
    store.put(node);
  }
  await txPromise(tx);
}

export async function deleteNodesByIds(nodeIds: string[]): Promise<void> {
  if (nodeIds.length === 0) return;
  const db = await openStudioDb();
  const tx = db.transaction(STORE_NODES, 'readwrite');
  const store = tx.objectStore(STORE_NODES);
  for (const id of nodeIds) {
    store.delete(id);
  }
  await txPromise(tx);
}

export async function deleteProjectAndData(projectId: string): Promise<void> {
  const db = await openStudioDb();
  const nodes = await getProjectNodes(projectId);
  const history = await getProjectHistory(projectId);

  const tx = db.transaction([STORE_PROJECTS, STORE_NODES, STORE_HISTORY], 'readwrite');
  tx.objectStore(STORE_PROJECTS).delete(projectId);
  const nodeStore = tx.objectStore(STORE_NODES);
  for (const n of nodes) nodeStore.delete(n.id);
  const histStore = tx.objectStore(STORE_HISTORY);
  for (const h of history) histStore.delete(h.id);
  await txPromise(tx);
}

export async function getProjectHistory(projectId: string): Promise<ExecutionRecord[]> {
  const db = await openStudioDb();
  const tx = db.transaction(STORE_HISTORY, 'readonly');
  const index = tx.objectStore(STORE_HISTORY).index('by_project');
  const list = await reqPromise<ExecutionRecord[]>(index.getAll(projectId));
  return list.sort((a, b) => b.timestamp - a.timestamp);
}

export async function appendExecutionHistory(record: ExecutionRecord): Promise<ExecutionRecord[]> {
  const db = await openStudioDb();
  const existing = await getProjectHistory(record.projectId);
  const toDelete = existing.slice(29);

  const tx = db.transaction(STORE_HISTORY, 'readwrite');
  const store = tx.objectStore(STORE_HISTORY);
  store.put(record);
  for (const old of toDelete) {
    store.delete(old.id);
  }
  await txPromise(tx);
  return getProjectHistory(record.projectId);
}

export async function clearProjectHistory(projectId: string): Promise<void> {
  const existing = await getProjectHistory(projectId);
  if (existing.length === 0) return;
  const db = await openStudioDb();
  const tx = db.transaction(STORE_HISTORY, 'readwrite');
  const store = tx.objectStore(STORE_HISTORY);
  for (const h of existing) store.delete(h.id);
  await txPromise(tx);
}

function materializeTemplateNodes(
  projectId: string,
  template: StarterProjectTemplate,
  now: number
): { nodes: StudioNode[]; defaultActiveId: string | null } {
  const nodes: StudioNode[] = [];
  const folderIdByPath = new Map<string, string>();
  let defaultActiveId: string | null = null;

  const ensureFolder = (parts: string[]): string | null => {
    if (parts.length === 0) return null;
    let parentId: string | null = null;
    const acc: string[] = [];
    for (const part of parts) {
      acc.push(part);
      const pathKey = acc.join('/');
      const existing = folderIdByPath.get(pathKey);
      if (existing) {
        parentId = existing;
      } else {
        const folderId = makeId('fld');
        nodes.push({
          id: folderId,
          projectId,
          parentId,
          name: part,
          type: 'folder',
          createdAt: now,
          updatedAt: now
        });
        folderIdByPath.set(pathKey, folderId);
        parentId = folderId;
      }
    }
    return parentId;
  };

  for (const fileSpec of template.files) {
    const segments = fileSpec.path.split('/').filter(Boolean);
    const fileName = segments.pop() || 'script.py';
    const parentId = ensureFolder(segments);
    const fileId = makeId('file');
    nodes.push({
      id: fileId,
      projectId,
      parentId,
      name: fileName,
      type: 'file',
      content: fileSpec.content,
      createdAt: now,
      updatedAt: now
    });
    if (fileSpec.path === template.defaultActiveFile || !defaultActiveId) {
      defaultActiveId = fileId;
    }
  }

  return { nodes, defaultActiveId };
}

export async function createProjectFromTemplate(
  templateId: string,
  customName?: string
): Promise<{ project: StudioProject; nodes: StudioNode[] }> {
  const template =
    STARTER_PROJECT_TEMPLATES.find((t) => t.id === templateId) ||
    STARTER_PROJECT_TEMPLATES[STARTER_PROJECT_TEMPLATES.length - 1];
  const now = Date.now();
  const projectId = makeId('proj');
  const { nodes, defaultActiveId } = materializeTemplateNodes(projectId, template, now);
  const project: StudioProject = {
    id: projectId,
    name: (customName || template.name).trim(),
    description: template.description,
    templateId: template.id,
    createdAt: now,
    updatedAt: now,
    activeFileId: defaultActiveId,
    openTabIds: defaultActiveId ? [defaultActiveId] : []
  };

  await saveProject(project);
  await saveNodes(nodes);
  return { project, nodes };
}

export async function ensureInitialWorkspace(): Promise<{
  projects: StudioProject[];
  activeProjectId: string;
  editorPrefs: EditorPreferences;
}> {
  const existingProjects = await getAllProjects();
  const savedPrefs =
    (await getMetaValue<EditorPreferences>('editorPrefs')) || DEFAULT_EDITOR_PREFERENCES;

  if (existingProjects.length > 0) {
    const savedActiveId = await getMetaValue<string>('activeProjectId');
    const activeProjectId =
      existingProjects.find((p) => p.id === savedActiveId)?.id || existingProjects[0].id;
    return {
      projects: existingProjects,
      activeProjectId,
      editorPrefs: { ...DEFAULT_EDITOR_PREFERENCES, ...savedPrefs }
    };
  }

  // Seed initial curated B.Pharm scientific projects on first open
  const seeded: StudioProject[] = [];
  for (const tplId of ['pk-modeling', 'tablet-qc', 'equilibrium-sympy']) {
    const { project } = await createProjectFromTemplate(tplId);
    seeded.push(project);
  }
  const activeProjectId = seeded[0].id;
  await setMetaValue('activeProjectId', activeProjectId);
  await setMetaValue('editorPrefs', DEFAULT_EDITOR_PREFERENCES);
  return {
    projects: seeded,
    activeProjectId,
    editorPrefs: DEFAULT_EDITOR_PREFERENCES
  };
}

export function createNodeRecord(params: {
  projectId: string;
  parentId: string | null;
  name: string;
  type: 'folder' | 'file';
  content?: string;
}): StudioNode {
  const now = Date.now();
  return {
    id: makeId(params.type === 'folder' ? 'fld' : 'file'),
    projectId: params.projectId,
    parentId: params.parentId,
    name: params.name.trim(),
    type: params.type,
    content: params.type === 'file' ? params.content ?? '' : undefined,
    createdAt: now,
    updatedAt: now
  };
}
