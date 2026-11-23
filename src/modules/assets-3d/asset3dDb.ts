import {
  Asset3DAnnotation,
  Asset3DBinaryRecord,
  Asset3DItem,
  BPharmDepartmentId,
  ModelFormat,
  SyllabusAssociation
} from './types';

const DB_NAME = 'pharmlab_3d_assets_v1';
const DB_VERSION = 1;
const STORE_ASSETS = 'assets';
const STORE_BINARIES = 'binaries';

let dbPromise: Promise<IDBDatabase> | null = null;

function open3DDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable in this browser environment.'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        const assetStore = db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
        assetStore.createIndex('category', 'category', { unique: false });
        assetStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_BINARIES)) {
        db.createObjectStore(STORE_BINARIES, { keyPath: 'assetId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error || new Error('Failed to open 3D Asset IndexedDB database.'));
    };
  });

  return dbPromise;
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB operation failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function getAll3DAssets(): Promise<Asset3DItem[]> {
  try {
    const db = await open3DDatabase();
    const tx = db.transaction(STORE_ASSETS, 'readonly');
    const items = await requestToPromise<Asset3DItem[]>(tx.objectStore(STORE_ASSETS).getAll());
    return (items || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return [];
  }
}

export async function get3DAssetById(id: string): Promise<Asset3DItem | null> {
  try {
    const db = await open3DDatabase();
    const tx = db.transaction(STORE_ASSETS, 'readonly');
    const item = await requestToPromise<Asset3DItem | undefined>(
      tx.objectStore(STORE_ASSETS).get(id)
    );
    return item || null;
  } catch {
    return null;
  }
}

export async function save3DAssetWithFile(
  meta: Asset3DItem,
  fileBuffer?: ArrayBuffer,
  mimeType = 'model/gltf-binary'
): Promise<Asset3DItem> {
  const db = await open3DDatabase();
  const now = Date.now();
  const record: Asset3DItem = {
    ...meta,
    hasBinaryBlob: Boolean(fileBuffer && fileBuffer.byteLength > 0) || meta.hasBinaryBlob,
    byteSize: fileBuffer ? fileBuffer.byteLength : meta.byteSize,
    createdAt: meta.createdAt || now,
    updatedAt: now
  };

  const storeNames = fileBuffer ? [STORE_ASSETS, STORE_BINARIES] : [STORE_ASSETS];
  const tx = db.transaction(storeNames, 'readwrite');
  tx.objectStore(STORE_ASSETS).put(record);

  if (fileBuffer) {
    const binRecord: Asset3DBinaryRecord = {
      assetId: record.id,
      fileName: record.fileName,
      format: record.format,
      mimeType,
      byteSize: fileBuffer.byteLength,
      buffer: fileBuffer,
      savedAt: now
    };
    tx.objectStore(STORE_BINARIES).put(binRecord);
  }

  await transactionDone(tx);
  return record;
}

export async function update3DAssetMeta(
  id: string,
  patch: Partial<Asset3DItem>
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(id);
  if (!existing) return null;
  const updated: Asset3DItem = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: Date.now()
  };
  const db = await open3DDatabase();
  const tx = db.transaction(STORE_ASSETS, 'readwrite');
  tx.objectStore(STORE_ASSETS).put(updated);
  await transactionDone(tx);
  return updated;
}

export async function save3DAssetThumbnail(
  id: string,
  thumbnailDataUrl: string
): Promise<Asset3DItem | null> {
  return update3DAssetMeta(id, { thumbnailDataUrl });
}

export async function mark3DAssetOpened(id: string): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(id);
  if (!existing) return null;
  const updated: Asset3DItem = {
    ...existing,
    lastOpenedAt: Date.now()
  };
  const db = await open3DDatabase();
  const tx = db.transaction(STORE_ASSETS, 'readwrite');
  tx.objectStore(STORE_ASSETS).put(updated);
  await transactionDone(tx);
  return updated;
}

export async function add3DAssetAnnotation(
  assetId: string,
  annotation: Asset3DAnnotation
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    annotations: [annotation, ...(existing.annotations || [])]
  });
}

export async function remove3DAssetAnnotation(
  assetId: string,
  annotationId: string
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    annotations: (existing.annotations || []).filter((a) => a.id !== annotationId)
  });
}

export async function addSyllabusAssociation(
  assetId: string,
  association: SyllabusAssociation
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  const deduped = (existing.syllabusLinks || []).filter((l) => l.id !== association.id);
  const departments = Array.from(
    new Set<BPharmDepartmentId>([...(existing.departments || []), association.departmentId])
  );
  return update3DAssetMeta(assetId, {
    departments,
    syllabusLinks: [association, ...deduped]
  });
}

export async function removeSyllabusAssociation(
  assetId: string,
  associationId: string
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    syllabusLinks: (existing.syllabusLinks || []).filter((l) => l.id !== associationId)
  });
}

export async function get3DModelObjectUrl(assetId: string): Promise<{
  url: string;
  format: ModelFormat;
  fileName: string;
  byteSize: number;
  revoke: () => void;
} | null> {
  const db = await open3DDatabase();
  const tx = db.transaction(STORE_BINARIES, 'readonly');
  const bin = await requestToPromise<Asset3DBinaryRecord | undefined>(
    tx.objectStore(STORE_BINARIES).get(assetId)
  );
  if (!bin || !bin.buffer) return null;

  const blob = new Blob([bin.buffer], {
    type: bin.mimeType || 'application/octet-stream'
  });
  const url = URL.createObjectURL(blob);
  return {
    url,
    format: bin.format,
    fileName: bin.fileName,
    byteSize: bin.byteSize,
    revoke: () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore revoke errors
      }
    }
  };
}

export async function delete3DAsset(assetId: string): Promise<void> {
  const db = await open3DDatabase();
  const tx = db.transaction([STORE_ASSETS, STORE_BINARIES], 'readwrite');
  tx.objectStore(STORE_ASSETS).delete(assetId);
  tx.objectStore(STORE_BINARIES).delete(assetId);
  await transactionDone(tx);
}

export async function get3DAssetsForContext(ctx: {
  departmentId?: BPharmDepartmentId;
  subjectCode?: string;
  topicId?: string;
  structureId?: string;
  experimentId?: string;
  query?: string;
}): Promise<Asset3DItem[]> {
  const all = await getAll3DAssets();
  if (all.length === 0) return [];

  const qTokens = (ctx.query || '')
    .toLowerCase()
    .split(/[\s,/()-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);

  const scored = all
    .map((asset) => {
      let score = 0;

      if (ctx.structureId) {
        if (asset.syllabusLinks.some((l) => l.structureId === ctx.structureId)) score += 20;
      }
      if (ctx.topicId) {
        if (asset.syllabusLinks.some((l) => l.topicId === ctx.topicId)) score += 18;
      }
      if (ctx.experimentId) {
        if (asset.syllabusLinks.some((l) => l.experimentId === ctx.experimentId)) score += 16;
      }
      if (ctx.subjectCode) {
        if (
          asset.syllabusLinks.some(
            (l) => l.subjectCode?.toLowerCase() === ctx.subjectCode?.toLowerCase()
          )
        ) {
          score += 10;
        }
      }
      if (ctx.departmentId) {
        if (
          asset.departments.includes(ctx.departmentId) ||
          asset.syllabusLinks.some((l) => l.departmentId === ctx.departmentId)
        ) {
          score += 5;
        }
      }

      if (qTokens.length > 0) {
        const hay = `${asset.name} ${asset.description} ${asset.tags.join(' ')} ${asset.syllabusLinks
          .map((l) => `${l.topicTitle || ''} ${l.structureName || ''} ${l.experimentTitle || ''}`)
          .join(' ')}`.toLowerCase();
        for (const tok of qTokens) {
          if (hay.includes(tok)) score += 4;
        }
      }

      return { asset, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((entry) => entry.asset);
}

export async function get3DLibraryStats(): Promise<{
  totalAssets: number;
  offlineBinaryCount: number;
  totalBytes: number;
}> {
  const all = await getAll3DAssets();
  return {
    totalAssets: all.length,
    offlineBinaryCount: all.filter((a) => a.hasBinaryBlob).length,
    totalBytes: all.reduce((sum, a) => sum + (a.byteSize || 0), 0)
  };
}
