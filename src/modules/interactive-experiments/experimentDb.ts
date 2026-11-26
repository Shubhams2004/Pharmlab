import { SavedExperimentRun } from './types';

const DB_NAME = 'pharmlab_interactive_experiments_v1';
const DB_VERSION = 1;
const STORE_RUNS = 'experiment_runs';

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryFallbackRuns = new Map<string, SavedExperimentRun>();

function openExperimentDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable in this environment.'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_RUNS)) {
        const store = db.createObjectStore(STORE_RUNS, { keyPath: 'id' });
        store.createIndex('byExperimentId', 'experimentId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error || new Error('Failed to open experiment notebook database.'));
    };
  });

  return dbPromise;
}

function reqPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed.'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function getAllSavedRuns(): Promise<SavedExperimentRun[]> {
  try {
    const db = await openExperimentDb();
    const tx = db.transaction(STORE_RUNS, 'readonly');
    const items = await reqPromise<SavedExperimentRun[]>(tx.objectStore(STORE_RUNS).getAll());
    return (items || []).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return Array.from(memoryFallbackRuns.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function getRunsForExperiment(experimentId: string): Promise<SavedExperimentRun[]> {
  try {
    const db = await openExperimentDb();
    const tx = db.transaction(STORE_RUNS, 'readonly');
    const idx = tx.objectStore(STORE_RUNS).index('byExperimentId');
    const items = await reqPromise<SavedExperimentRun[]>(idx.getAll(experimentId));
    return (items || []).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return Array.from(memoryFallbackRuns.values())
      .filter((r) => r.experimentId === experimentId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function saveExperimentRun(run: SavedExperimentRun): Promise<SavedExperimentRun> {
  const stamped: SavedExperimentRun = {
    ...run,
    createdAt: run.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  try {
    const db = await openExperimentDb();
    const tx = db.transaction(STORE_RUNS, 'readwrite');
    tx.objectStore(STORE_RUNS).put(stamped);
    await txDone(tx);
    return stamped;
  } catch {
    memoryFallbackRuns.set(stamped.id, stamped);
    return stamped;
  }
}

export async function updateExperimentRun(
  runId: string,
  patch: Partial<SavedExperimentRun>
): Promise<SavedExperimentRun | null> {
  const all = await getAllSavedRuns();
  const target = all.find((r) => r.id === runId);
  if (!target) return null;
  const updated: SavedExperimentRun = {
    ...target,
    ...patch,
    id: target.id,
    updatedAt: Date.now()
  };
  return saveExperimentRun(updated);
}

export async function deleteExperimentRun(runId: string): Promise<void> {
  try {
    const db = await openExperimentDb();
    const tx = db.transaction(STORE_RUNS, 'readwrite');
    tx.objectStore(STORE_RUNS).delete(runId);
    await txDone(tx);
  } catch {
    memoryFallbackRuns.delete(runId);
  }
}

export async function getExperimentRunCountsById(): Promise<Record<string, number>> {
  const all = await getAllSavedRuns();
  const counts: Record<string, number> = {};
  for (const r of all) {
    counts[r.experimentId] = (counts[r.experimentId] || 0) + 1;
  }
  return counts;
}
