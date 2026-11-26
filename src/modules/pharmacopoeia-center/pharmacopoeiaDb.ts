import {
  EditionAmendmentRecord,
  OfficialSourceCheckRecord,
  PharmacopoeiaAcademicLink,
  PharmacopoeiaStudyCollection,
  PharmacopoeiaUserStore,
  UserSavedLink
} from './types';

const DB_NAME = 'pharmlab_pharmacopoeia_center_v1';
const DB_VERSION = 1;
const STORE_STATE = 'workspace_state';
const STATE_RECORD_ID = 'singleton';
const LOCAL_FALLBACK_KEY = 'pharmlab_pharmacopoeia_center_fallback_v1';

export const DEFAULT_PHARMACOPOEIA_USER_STORE: PharmacopoeiaUserStore = {
  bookmarkedIds: [],
  recentlyAccessed: [],
  notesByEntryId: {},
  comparisonNotesByKey: {},
  customLinks: [],
  collections: [
    {
      id: 'col_bpharm_core',
      name: 'B.Pharm Core Compendia',
      description: 'Primary pharmacopoeias studied in Pharmaceutics I, Analysis, and Quality Assurance.',
      entryIds: ['pc_ip', 'pc_bp', 'pc_usp_nf'],
      createdAt: 1,
      updatedAt: 1
    },
    {
      id: 'col_public_access',
      name: 'Openly Accessible Official Portals',
      description: 'Official pharmacopoeias with publicly viewable digital texts or official English PDFs.',
      entryIds: ['pc_who_int', 'pc_jp'],
      createdAt: 1,
      updatedAt: 1
    }
  ],
  editionRecords: [],
  academicLinks: [],
  sourceChecks: {}
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openPharmacopoeiaDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error || new Error('Failed to open Pharmacopoeia Center DB'));
    };
  });

  return dbPromise;
}

function readFallbackStore(): PharmacopoeiaUserStore {
  try {
    if (typeof localStorage === 'undefined') {
      return structuredClone(DEFAULT_PHARMACOPOEIA_USER_STORE);
    }
    const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
    if (!raw) return structuredClone(DEFAULT_PHARMACOPOEIA_USER_STORE);
    return normalizeUserStore(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_PHARMACOPOEIA_USER_STORE);
  }
}

function writeFallbackStore(store: PharmacopoeiaUserStore): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(store));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function normalizeUserStore(raw: Partial<PharmacopoeiaUserStore> | null | undefined): PharmacopoeiaUserStore {
  const base = DEFAULT_PHARMACOPOEIA_USER_STORE;
  if (!raw || typeof raw !== 'object') {
    return structuredClone(base);
  }
  return {
    bookmarkedIds: Array.isArray(raw.bookmarkedIds) ? raw.bookmarkedIds.filter(Boolean) : [...base.bookmarkedIds],
    recentlyAccessed: Array.isArray(raw.recentlyAccessed) ? raw.recentlyAccessed : [],
    notesByEntryId:
      raw.notesByEntryId && typeof raw.notesByEntryId === 'object' ? { ...raw.notesByEntryId } : {},
    comparisonNotesByKey:
      raw.comparisonNotesByKey && typeof raw.comparisonNotesByKey === 'object'
        ? { ...raw.comparisonNotesByKey }
        : {},
    customLinks: Array.isArray(raw.customLinks) ? raw.customLinks : [],
    collections:
      Array.isArray(raw.collections) && raw.collections.length > 0
        ? raw.collections
        : structuredClone(base.collections),
    editionRecords: Array.isArray(raw.editionRecords) ? raw.editionRecords : [],
    academicLinks: Array.isArray(raw.academicLinks) ? raw.academicLinks : [],
    sourceChecks:
      raw.sourceChecks && typeof raw.sourceChecks === 'object' ? { ...raw.sourceChecks } : {}
  };
}

export async function loadPharmacopoeiaUserStore(): Promise<PharmacopoeiaUserStore> {
  try {
    const db = await openPharmacopoeiaDb();
    const record = await new Promise<{ id: string; data: PharmacopoeiaUserStore } | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readonly');
      const req = tx.objectStore(STORE_STATE).get(STATE_RECORD_ID);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (record?.data) {
      const normalized = normalizeUserStore(record.data);
      writeFallbackStore(normalized);
      return normalized;
    }
    const fallback = readFallbackStore();
    await savePharmacopoeiaUserStore(fallback);
    return fallback;
  } catch {
    return readFallbackStore();
  }
}

export async function savePharmacopoeiaUserStore(store: PharmacopoeiaUserStore): Promise<PharmacopoeiaUserStore> {
  const normalized = normalizeUserStore(store);
  writeFallbackStore(normalized);
  try {
    const db = await openPharmacopoeiaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_STATE, 'readwrite');
      tx.objectStore(STORE_STATE).put({ id: STATE_RECORD_ID, data: normalized });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // fallback already saved to localStorage
  }
  return normalized;
}

export function toggleBookmarkInStore(store: PharmacopoeiaUserStore, entryId: string): PharmacopoeiaUserStore {
  const exists = store.bookmarkedIds.includes(entryId);
  return {
    ...store,
    bookmarkedIds: exists
      ? store.bookmarkedIds.filter((id) => id !== entryId)
      : [entryId, ...store.bookmarkedIds]
  };
}

export function recordAccessInStore(
  store: PharmacopoeiaUserStore,
  entryId: string,
  now = Date.now()
): PharmacopoeiaUserStore {
  const filtered = store.recentlyAccessed.filter((item) => item.entryId !== entryId);
  return {
    ...store,
    recentlyAccessed: [{ entryId, accessedAt: now }, ...filtered].slice(0, 12)
  };
}

export function upsertCustomLinkInStore(
  store: PharmacopoeiaUserStore,
  link: UserSavedLink
): PharmacopoeiaUserStore {
  return {
    ...store,
    customLinks: [link, ...store.customLinks.filter((l) => l.id !== link.id)]
  };
}

export function deleteCustomLinkInStore(
  store: PharmacopoeiaUserStore,
  linkId: string
): PharmacopoeiaUserStore {
  return {
    ...store,
    customLinks: store.customLinks.filter((l) => l.id !== linkId)
  };
}

export function upsertEditionRecordInStore(
  store: PharmacopoeiaUserStore,
  record: EditionAmendmentRecord
): PharmacopoeiaUserStore {
  return {
    ...store,
    editionRecords: [record, ...store.editionRecords.filter((r) => r.id !== record.id)]
  };
}

export function deleteEditionRecordInStore(
  store: PharmacopoeiaUserStore,
  recordId: string
): PharmacopoeiaUserStore {
  return {
    ...store,
    editionRecords: store.editionRecords.filter((r) => r.id !== recordId)
  };
}

export function upsertCollectionInStore(
  store: PharmacopoeiaUserStore,
  col: PharmacopoeiaStudyCollection
): PharmacopoeiaUserStore {
  const exists = store.collections.some((c) => c.id === col.id);
  return {
    ...store,
    collections: exists
      ? store.collections.map((c) => (c.id === col.id ? col : c))
      : [col, ...store.collections]
  };
}

export function toggleEntryInCollectionStore(
  store: PharmacopoeiaUserStore,
  collectionId: string,
  entryId: string,
  now = Date.now()
): PharmacopoeiaUserStore {
  return {
    ...store,
    collections: store.collections.map((col) => {
      if (col.id !== collectionId) return col;
      const has = col.entryIds.includes(entryId);
      return {
        ...col,
        entryIds: has ? col.entryIds.filter((id) => id !== entryId) : [...col.entryIds, entryId],
        updatedAt: now
      };
    })
  };
}

export function deleteCollectionInStore(
  store: PharmacopoeiaUserStore,
  collectionId: string
): PharmacopoeiaUserStore {
  return {
    ...store,
    collections: store.collections.filter((c) => c.id !== collectionId)
  };
}

export function upsertAcademicLinkInStore(
  store: PharmacopoeiaUserStore,
  link: PharmacopoeiaAcademicLink
): PharmacopoeiaUserStore {
  return {
    ...store,
    academicLinks: [link, ...store.academicLinks.filter((l) => l.id !== link.id)]
  };
}

export function deleteAcademicLinkInStore(
  store: PharmacopoeiaUserStore,
  linkId: string
): PharmacopoeiaUserStore {
  return {
    ...store,
    academicLinks: store.academicLinks.filter((l) => l.id !== linkId)
  };
}

export function recordSourceCheckInStore(
  store: PharmacopoeiaUserStore,
  check: OfficialSourceCheckRecord
): PharmacopoeiaUserStore {
  return {
    ...store,
    sourceChecks: {
      ...store.sourceChecks,
      [check.entryId]: check
    }
  };
}
