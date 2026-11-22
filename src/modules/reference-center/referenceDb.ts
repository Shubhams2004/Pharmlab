import { getAllBooks } from '../knowledge-library/libraryDb';
import { LibraryBookMeta } from '../knowledge-library/types';
import {
  INITIAL_CUSTOM_COLLECTIONS,
  INITIAL_PHARMACOPOEIA_PROFILES,
  INITIAL_REFERENCE_CATALOG
} from './seedCatalog';
import {
  AcademicConnection,
  CustomCollection,
  PharmacopoeiaProfileMeta,
  PharmacopoeiaSectionLink,
  ReferenceCollectionType,
  ReferenceItem
} from './types';

const DB_NAME = 'pharmlab_reference_center';
const DB_VERSION = 1;

const STORE_REFERENCES = 'references';
const STORE_COLLECTIONS = 'collections';
const STORE_PHARMA_PROFILES = 'pharmacopoeiaProfiles';
const SEED_FLAG_KEY = 'pharmlab_refcenter_seeded_v1';

let dbPromise: Promise<IDBDatabase> | null = null;

function openReferenceDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_REFERENCES)) {
        const refStore = db.createObjectStore(STORE_REFERENCES, { keyPath: 'id' });
        refStore.createIndex('collectionType', 'collectionType', { unique: false });
        refStore.createIndex('linkedBookId', 'linkedBookId', { unique: false });
        refStore.createIndex('doi', 'doi', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_COLLECTIONS)) {
        db.createObjectStore(STORE_COLLECTIONS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_PHARMA_PROFILES)) {
        db.createObjectStore(STORE_PHARMA_PROFILES, { keyPath: 'referenceId' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open Pharmaceutical Reference Center database.'));
    };
  });

  return dbPromise;
}

function wrapRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function wrapTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Reference Center transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('Reference Center transaction aborted.'));
  });
}

function normalizeStr(val?: string | null): string {
  return (val || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findDuplicateReference(
  candidate: Partial<ReferenceItem>,
  existingList: ReferenceItem[]
): ReferenceItem | null {
  const candDoi = normalizeStr(candidate.doi);
  const candUrl = normalizeStr(candidate.externalUrl);
  const candBookId = (candidate.linkedBookId || '').trim();
  const candTitle = normalizeStr(candidate.title);
  const candAuthors = normalizeStr(candidate.authors);

  for (const item of existingList) {
    if (candidate.id && item.id === candidate.id) continue;
    if (candDoi && normalizeStr(item.doi) === candDoi) return item;
    if (candBookId && item.linkedBookId === candBookId) return item;
    if (candUrl && normalizeStr(item.externalUrl) === candUrl && normalizeStr(item.title) === candTitle) {
      return item;
    }
    if (
      candTitle &&
      normalizeStr(item.title) === candTitle &&
      (!candAuthors || normalizeStr(item.authors) === candAuthors) &&
      (!candidate.collectionType || item.collectionType === candidate.collectionType)
    ) {
      return item;
    }
  }
  return null;
}

export async function ensureSeeded(): Promise<void> {
  const db = await openReferenceDb();
  const tx = db.transaction(
    [STORE_REFERENCES, STORE_COLLECTIONS, STORE_PHARMA_PROFILES],
    'readonly'
  );

  const [existingRefs, existingCols, existingProfiles] = await Promise.all([
    wrapRequest(tx.objectStore(STORE_REFERENCES).getAll() as IDBRequest<ReferenceItem[]>),
    wrapRequest(tx.objectStore(STORE_COLLECTIONS).getAll() as IDBRequest<CustomCollection[]>),
    wrapRequest(
      tx.objectStore(STORE_PHARMA_PROFILES).getAll() as IDBRequest<PharmacopoeiaProfileMeta[]>
    )
  ]);

  let alreadySeededFlag = false;
  try {
    alreadySeededFlag = localStorage.getItem(SEED_FLAG_KEY) === '1';
  } catch {
    alreadySeededFlag = false;
  }

  const existingRefIds = new Set(existingRefs.map((r) => r.id));
  const existingColIds = new Set(existingCols.map((c) => c.id));
  const existingProfileIds = new Set(existingProfiles.map((p) => p.referenceId));

  // Always ensure the 5 core Pharmacopoeia profiles exist; seed full catalog on first boot.
  const refsToInsert = INITIAL_REFERENCE_CATALOG.filter((item) => {
    if (existingRefIds.has(item.id)) return false;
    if (!alreadySeededFlag || existingRefs.length === 0) return true;
    return item.collectionType === 'pharmacopoeia';
  });

  const colsToInsert =
    !alreadySeededFlag || existingCols.length === 0
      ? INITIAL_CUSTOM_COLLECTIONS.filter((c) => !existingColIds.has(c.id))
      : [];

  const profilesToInsert = INITIAL_PHARMACOPOEIA_PROFILES.filter(
    (p) => !existingProfileIds.has(p.referenceId)
  );

  if (refsToInsert.length > 0 || colsToInsert.length > 0 || profilesToInsert.length > 0) {
    const writeTx = db.transaction(
      [STORE_REFERENCES, STORE_COLLECTIONS, STORE_PHARMA_PROFILES],
      'readwrite'
    );
    const refStore = writeTx.objectStore(STORE_REFERENCES);
    const colStore = writeTx.objectStore(STORE_COLLECTIONS);
    const profileStore = writeTx.objectStore(STORE_PHARMA_PROFILES);

    for (const ref of refsToInsert) refStore.put(ref);
    for (const col of colsToInsert) colStore.put(col);
    for (const prof of profilesToInsert) profileStore.put(prof);

    await wrapTransaction(writeTx);
  }

  try {
    localStorage.setItem(SEED_FLAG_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

export async function getAllReferences(
  collectionType?: ReferenceCollectionType
): Promise<ReferenceItem[]> {
  await ensureSeeded();
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readonly');
  const all = await wrapRequest(
    tx.objectStore(STORE_REFERENCES).getAll() as IDBRequest<ReferenceItem[]>
  );
  const filtered = collectionType
    ? all.filter((r) => r.collectionType === collectionType)
    : all;
  return filtered.sort(
    (a, b) =>
      (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0) ||
      (b.linkedBookId ? 1 : 0) - (a.linkedBookId ? 1 : 0) ||
      a.createdAt - b.createdAt
  );
}

export async function upsertReference(item: ReferenceItem): Promise<{
  saved: ReferenceItem;
  duplicateOf: ReferenceItem | null;
}> {
  await ensureSeeded();
  const existing = await getAllReferences();
  const duplicate = findDuplicateReference(item, existing);
  if (duplicate) {
    return { saved: duplicate, duplicateOf: duplicate };
  }

  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const record: ReferenceItem = {
    ...item,
    updatedAt: Date.now()
  };
  tx.objectStore(STORE_REFERENCES).put(record);
  await wrapTransaction(tx);
  return { saved: record, duplicateOf: null };
}

export async function updateReference(
  id: string,
  patch: Partial<ReferenceItem>
): Promise<ReferenceItem | null> {
  await ensureSeeded();
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const store = tx.objectStore(STORE_REFERENCES);
  const current = await wrapRequest(store.get(id) as IDBRequest<ReferenceItem | undefined>);
  if (!current) return null;

  const updated: ReferenceItem = {
    ...current,
    ...patch,
    id: current.id,
    updatedAt: Date.now()
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function deleteReference(id: string): Promise<void> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  tx.objectStore(STORE_REFERENCES).delete(id);
  await wrapTransaction(tx);
}

export async function toggleBookmark(id: string): Promise<ReferenceItem | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const store = tx.objectStore(STORE_REFERENCES);
  const current = await wrapRequest(store.get(id) as IDBRequest<ReferenceItem | undefined>);
  if (!current) return null;

  const updated: ReferenceItem = {
    ...current,
    bookmarked: !current.bookmarked,
    updatedAt: Date.now()
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function markReferenceOpened(id: string): Promise<ReferenceItem | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const store = tx.objectStore(STORE_REFERENCES);
  const current = await wrapRequest(store.get(id) as IDBRequest<ReferenceItem | undefined>);
  if (!current) return null;

  const updated: ReferenceItem = {
    ...current,
    lastOpenedAt: Date.now()
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function linkPdfToReference(
  referenceId: string,
  bookId: string
): Promise<ReferenceItem | null> {
  return updateReference(referenceId, {
    linkedBookId: bookId,
    accessStatus: 'imported_local'
  });
}

export async function unlinkPdfFromReference(referenceId: string): Promise<ReferenceItem | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const store = tx.objectStore(STORE_REFERENCES);
  const current = await wrapRequest(store.get(referenceId) as IDBRequest<ReferenceItem | undefined>);
  if (!current) return null;

  const fallbackStatus = current.externalUrl
    ? current.licenseInfo.toLowerCase().includes('open') ||
      current.sourceName.toLowerCase().includes('who') ||
      current.collectionType === 'standard'
      ? 'open_access_portal'
      : 'licensed_external'
    : 'metadata_only';

  const updated: ReferenceItem = {
    ...current,
    linkedBookId: undefined,
    accessStatus: fallbackStatus,
    updatedAt: Date.now()
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function findExistingLibraryBookForFile(
  file: File
): Promise<LibraryBookMeta | null> {
  const books = await getAllBooks();
  const normalizedName = file.name.trim().toLowerCase();
  return (
    books.find(
      (b) => b.fileName.trim().toLowerCase() === normalizedName && b.fileSize === file.size
    ) || null
  );
}

export async function addAcademicConnection(
  referenceId: string,
  connection: AcademicConnection
): Promise<ReferenceItem | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const store = tx.objectStore(STORE_REFERENCES);
  const current = await wrapRequest(store.get(referenceId) as IDBRequest<ReferenceItem | undefined>);
  if (!current) return null;

  const exists = current.academicConnections.some(
    (c) =>
      (c.topicId && connection.topicId && c.topicId === connection.topicId) ||
      (normalizeStr(c.label) === normalizeStr(connection.label) &&
        c.entityType === connection.entityType)
  );
  if (exists) return current;

  const updated: ReferenceItem = {
    ...current,
    academicConnections: [...current.academicConnections, connection],
    updatedAt: Date.now()
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function removeAcademicConnection(
  referenceId: string,
  connectionId: string
): Promise<ReferenceItem | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const store = tx.objectStore(STORE_REFERENCES);
  const current = await wrapRequest(store.get(referenceId) as IDBRequest<ReferenceItem | undefined>);
  if (!current) return null;

  const updated: ReferenceItem = {
    ...current,
    academicConnections: current.academicConnections.filter((c) => c.id !== connectionId),
    updatedAt: Date.now()
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

// Custom Collections CRUD
export async function getAllCollections(): Promise<CustomCollection[]> {
  await ensureSeeded();
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_COLLECTIONS, 'readonly');
  const list = await wrapRequest(
    tx.objectStore(STORE_COLLECTIONS).getAll() as IDBRequest<CustomCollection[]>
  );
  return list.sort((a, b) => a.createdAt - b.createdAt);
}

export async function createCollection(
  name: string,
  description = ''
): Promise<CustomCollection> {
  await ensureSeeded();
  const col: CustomCollection = {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    description: description.trim(),
    createdAt: Date.now(),
    isDefault: false
  };
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_COLLECTIONS, 'readwrite');
  tx.objectStore(STORE_COLLECTIONS).put(col);
  await wrapTransaction(tx);
  return col;
}

export async function renameCollection(
  collectionId: string,
  name: string,
  description?: string
): Promise<CustomCollection | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_COLLECTIONS, 'readwrite');
  const store = tx.objectStore(STORE_COLLECTIONS);
  const current = await wrapRequest(
    store.get(collectionId) as IDBRequest<CustomCollection | undefined>
  );
  if (!current) return null;

  const updated: CustomCollection = {
    ...current,
    name: name.trim() || current.name,
    description: typeof description === 'string' ? description.trim() : current.description
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const db = await openReferenceDb();
  const tx = db.transaction([STORE_COLLECTIONS, STORE_REFERENCES], 'readwrite');
  tx.objectStore(STORE_COLLECTIONS).delete(collectionId);

  const refStore = tx.objectStore(STORE_REFERENCES);
  const allRefs = await wrapRequest(refStore.getAll() as IDBRequest<ReferenceItem[]>);
  for (const ref of allRefs) {
    if (ref.customCollectionIds.includes(collectionId)) {
      refStore.put({
        ...ref,
        customCollectionIds: ref.customCollectionIds.filter((id) => id !== collectionId),
        updatedAt: Date.now()
      });
    }
  }
  await wrapTransaction(tx);
}

export async function toggleCollectionMembership(
  referenceId: string,
  collectionId: string
): Promise<ReferenceItem | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_REFERENCES, 'readwrite');
  const store = tx.objectStore(STORE_REFERENCES);
  const current = await wrapRequest(
    store.get(referenceId) as IDBRequest<ReferenceItem | undefined>
  );
  if (!current) return null;

  const exists = current.customCollectionIds.includes(collectionId);
  const updated: ReferenceItem = {
    ...current,
    customCollectionIds: exists
      ? current.customCollectionIds.filter((id) => id !== collectionId)
      : [...current.customCollectionIds, collectionId],
    updatedAt: Date.now()
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

// Pharmacopoeia Workspace Section Links
export async function getAllPharmacopoeiaProfiles(): Promise<PharmacopoeiaProfileMeta[]> {
  await ensureSeeded();
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_PHARMA_PROFILES, 'readonly');
  return wrapRequest(
    tx.objectStore(STORE_PHARMA_PROFILES).getAll() as IDBRequest<PharmacopoeiaProfileMeta[]>
  );
}

export async function getPharmacopoeiaProfile(
  referenceId: string
): Promise<PharmacopoeiaProfileMeta | null> {
  await ensureSeeded();
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_PHARMA_PROFILES, 'readonly');
  const res = await wrapRequest(
    tx.objectStore(STORE_PHARMA_PROFILES).get(referenceId) as IDBRequest<
      PharmacopoeiaProfileMeta | undefined
    >
  );
  return res ?? null;
}

export async function addPharmacopoeiaSectionLink(
  referenceId: string,
  link: PharmacopoeiaSectionLink
): Promise<PharmacopoeiaProfileMeta | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_PHARMA_PROFILES, 'readwrite');
  const store = tx.objectStore(STORE_PHARMA_PROFILES);
  const current = await wrapRequest(
    store.get(referenceId) as IDBRequest<PharmacopoeiaProfileMeta | undefined>
  );
  if (!current) return null;

  const updated: PharmacopoeiaProfileMeta = {
    ...current,
    sectionLinks: [...current.sectionLinks, link]
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function removePharmacopoeiaSectionLink(
  referenceId: string,
  linkId: string
): Promise<PharmacopoeiaProfileMeta | null> {
  const db = await openReferenceDb();
  const tx = db.transaction(STORE_PHARMA_PROFILES, 'readwrite');
  const store = tx.objectStore(STORE_PHARMA_PROFILES);
  const current = await wrapRequest(
    store.get(referenceId) as IDBRequest<PharmacopoeiaProfileMeta | undefined>
  );
  if (!current) return null;

  const updated: PharmacopoeiaProfileMeta = {
    ...current,
    sectionLinks: current.sectionLinks.filter((l) => l.id !== linkId)
  };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}
