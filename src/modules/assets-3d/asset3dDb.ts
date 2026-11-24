import {
  ALL_3D_CATEGORIES,
  Asset3DAnnotation,
  Asset3DBinaryRecord,
  Asset3DCategory,
  Asset3DDeleteImpact,
  Asset3DItem,
  Asset3DStorageReport,
  BPharmDepartmentId,
  CATEGORY_3D_LABELS,
  Custom3DCategory,
  get3DCategoryLabel,
  ModelFormat,
  normalizeCustomCategoryId,
  Predefined3DCategory,
  SyllabusAssociation
} from './types';
import { MAX_DIRECT_IMPORT_BYTES } from './providers/utils';

const DB_NAME = 'pharmlab_3d_assets_v1';
const DB_VERSION = 1;
const STORE_ASSETS = 'assets';
const STORE_BINARIES = 'binaries';
const CUSTOM_CATEGORIES_KEY = 'pharmlab_custom_3d_categories_v1';

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

export function getCustom3DCategories(): Custom3DCategory[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Custom3DCategory =>
        Boolean(c && typeof c.id === 'string' && typeof c.label === 'string')
    );
  } catch {
    return [];
  }
}

export function saveCustom3DCategory(labelInput: string): Custom3DCategory {
  const cleanLabel = labelInput.trim();
  if (!cleanLabel) {
    throw new Error('Custom category name cannot be empty.');
  }
  const existing = getCustom3DCategories();
  const id = normalizeCustomCategoryId(cleanLabel);

  // Return predefined category id if label matches a predefined category directly
  const predefinedHit = ALL_3D_CATEGORIES.find(
    (catId) => CATEGORY_3D_LABELS[catId].toLowerCase() === cleanLabel.toLowerCase()
  );
  if (predefinedHit) {
    return {
      id: predefinedHit,
      label: CATEGORY_3D_LABELS[predefinedHit],
      createdAt: Date.now()
    };
  }

  const dup = existing.find(
    (c) => c.id === id || c.label.toLowerCase() === cleanLabel.toLowerCase()
  );
  if (dup) return dup;

  const entry: Custom3DCategory = {
    id,
    label: cleanLabel,
    createdAt: Date.now()
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify([...existing, entry]));
  }
  return entry;
}

export function getMerged3DCategoryOptions(
  assets: Asset3DItem[] = [],
  customCategories: Custom3DCategory[] = getCustom3DCategories()
): Array<{ id: Asset3DCategory; label: string; isCustom: boolean }> {
  const seen = new Set<string>();
  const options: Array<{ id: Asset3DCategory; label: string; isCustom: boolean }> = [];

  for (const preId of ALL_3D_CATEGORIES) {
    seen.add(preId);
    options.push({
      id: preId,
      label: CATEGORY_3D_LABELS[preId as Predefined3DCategory],
      isCustom: false
    });
  }

  for (const custom of customCategories) {
    if (seen.has(custom.id)) continue;
    seen.add(custom.id);
    options.push({
      id: custom.id,
      label: custom.label,
      isCustom: true
    });
  }

  for (const item of assets) {
    if (!item.category || seen.has(item.category)) continue;
    seen.add(item.category);
    options.push({
      id: item.category,
      label: get3DCategoryLabel(item.category, customCategories),
      isCustom: true
    });
  }

  return options;
}

export async function check3DStorageCapacity(additionalBytes: number): Promise<{
  ok: boolean;
  warning?: string;
  reason?: string;
  quotaBytes?: number;
  usageBytes?: number;
}> {
  if (additionalBytes > MAX_DIRECT_IMPORT_BYTES) {
    return {
      ok: false,
      reason: `File size (${(additionalBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the ${(
        MAX_DIRECT_IMPORT_BYTES /
        (1024 * 1024)
      ).toFixed(0)} MB per-asset browser storage cap.`
    };
  }

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const quota = est.quota;
      const usage = est.usage;
      if (typeof quota === 'number' && typeof usage === 'number') {
        const remaining = quota - usage;
        if (additionalBytes > remaining) {
          return {
            ok: false,
            quotaBytes: quota,
            usageBytes: usage,
            reason: `Insufficient browser IndexedDB quota remaining (${Math.max(
              0,
              remaining / (1024 * 1024)
            ).toFixed(1)} MB free). Remove unused 3D binaries before saving.`
          };
        }
        if (remaining - additionalBytes < 25 * 1024 * 1024) {
          return {
            ok: true,
            quotaBytes: quota,
            usageBytes: usage,
            warning: 'Browser IndexedDB free space is running low (< 25 MB left after this save).'
          };
        }
        return { ok: true, quotaBytes: quota, usageBytes: usage };
      }
    } catch {
      // ignore unsupported estimate errors
    }
  }
  return { ok: true };
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
  if (fileBuffer && fileBuffer.byteLength > 0) {
    const cap = await check3DStorageCapacity(fileBuffer.byteLength);
    if (!cap.ok) {
      throw new Error(cap.reason || 'Insufficient IndexedDB storage capacity.');
    }
  }

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

export async function toggle3DAssetFavorite(id: string): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(id);
  if (!existing) return null;
  return update3DAssetMeta(id, { isFavorite: !existing.isFavorite });
}

/**
 * Duplicates asset metadata as an independent library entry while referencing the same
 * stored binary blob key in IndexedDB (`binaryRefAssetId`), avoiding duplicate large GLB storage.
 */
export async function duplicate3DAssetReference(id: string): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(id);
  if (!existing) return null;
  const now = Date.now();
  const cloneId = `3d_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const sharedBinaryKey = existing.hasBinaryBlob
    ? existing.binaryRefAssetId || existing.id
    : undefined;

  const clone: Asset3DItem = {
    ...existing,
    id: cloneId,
    name: `${existing.name} (Reference Copy)`,
    isFavorite: false,
    syllabusLinks: [],
    annotations: existing.annotations.map((ann) => ({
      ...ann,
      id: `pin_${now}_${Math.random().toString(36).slice(2, 6)}`
    })),
    binaryRefAssetId: sharedBinaryKey,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: undefined
  };

  const db = await open3DDatabase();
  const tx = db.transaction(STORE_ASSETS, 'readwrite');
  tx.objectStore(STORE_ASSETS).put(clone);
  await transactionDone(tx);
  return clone;
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

export async function get3DModelObjectUrl(
  assetId: string,
  binaryRefAssetId?: string
): Promise<{
  url: string;
  format: ModelFormat;
  fileName: string;
  byteSize: number;
  revoke: () => void;
} | null> {
  const resolvedBinaryId =
    binaryRefAssetId || (await get3DAssetById(assetId))?.binaryRefAssetId || assetId;

  const db = await open3DDatabase();
  const tx = db.transaction(STORE_BINARIES, 'readonly');
  const bin = await requestToPromise<Asset3DBinaryRecord | undefined>(
    tx.objectStore(STORE_BINARIES).get(resolvedBinaryId)
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

export async function inspect3DAssetDeleteImpact(
  assetId: string
): Promise<Asset3DDeleteImpact | null> {
  const all = await getAll3DAssets();
  const asset = all.find((a) => a.id === assetId);
  if (!asset) return null;

  const binaryKey = asset.binaryRefAssetId || asset.id;
  const otherSharers = all.filter(
    (other) =>
      other.id !== asset.id &&
      other.hasBinaryBlob &&
      (other.binaryRefAssetId || other.id) === binaryKey
  );

  const affectedSubjects = Array.from(
    new Set(
      asset.syllabusLinks
        .map((l) =>
          l.subjectCode && l.subjectTitle
            ? `${l.subjectCode} · ${l.subjectTitle}`
            : l.subjectCode || l.subjectTitle
        )
        .filter((v): v is string => Boolean(v))
    )
  );

  const affectedTopics = Array.from(
    new Set(
      asset.syllabusLinks
        .map((l) =>
          [l.unitNo, l.topicTitle, l.subtopicTitle].filter(Boolean).join(' · ')
        )
        .filter(Boolean)
    )
  );

  const affectedExperiments = Array.from(
    new Set(
      asset.syllabusLinks
        .map((l) => l.experimentTitle)
        .filter((v): v is string => Boolean(v))
    )
  );

  const affectedStructures = Array.from(
    new Set(
      asset.syllabusLinks
        .map((l) => l.structureName)
        .filter((v): v is string => Boolean(v))
    )
  );

  const binaryBytesFreed =
    asset.hasBinaryBlob && otherSharers.length === 0 ? asset.byteSize || 0 : 0;

  return {
    asset,
    syllabusLinks: asset.syllabusLinks,
    affectedSubjects,
    affectedTopics,
    affectedExperiments,
    affectedStructures,
    annotationCount: asset.annotations.length,
    dependentAssetNames: otherSharers.map((d) => d.name),
    binaryBytesFreed,
    willTransferBinaryOwnership: Boolean(
      asset.hasBinaryBlob && !asset.binaryRefAssetId && otherSharers.length > 0
    )
  };
}

/**
 * Safely deletes an asset record and cleans up its binary blob ONLY when no remaining
 * metadata reference copies depend on that binary key. If the primary binary owner is
 * deleted while reference copies still exist, binary ownership is transferred cleanly
 * to one of the remaining references before deletion.
 */
export async function delete3DAsset(assetId: string): Promise<void> {
  const all = await getAll3DAssets();
  const target = all.find((a) => a.id === assetId);
  if (!target) return;

  const binaryKey = target.binaryRefAssetId || target.id;
  const remainingDependents = all.filter(
    (other) =>
      other.id !== assetId &&
      other.hasBinaryBlob &&
      (other.binaryRefAssetId || other.id) === binaryKey
  );

  const db = await open3DDatabase();

  let originalBin: Asset3DBinaryRecord | undefined;
  if (remainingDependents.length > 0 && !target.binaryRefAssetId) {
    const readTx = db.transaction(STORE_BINARIES, 'readonly');
    originalBin = await requestToPromise<Asset3DBinaryRecord | undefined>(
      readTx.objectStore(STORE_BINARIES).get(assetId)
    );
  }

  const tx = db.transaction([STORE_ASSETS, STORE_BINARIES], 'readwrite');
  const assetStore = tx.objectStore(STORE_ASSETS);
  const binStore = tx.objectStore(STORE_BINARIES);

  if (remainingDependents.length === 0) {
    assetStore.delete(assetId);
    if (!target.binaryRefAssetId) {
      binStore.delete(assetId);
    }
    await transactionDone(tx);
    return;
  }

  // If the deleted record owned the underlying binary row, promote the first dependent
  if (!target.binaryRefAssetId && originalBin) {
    const [newOwner, ...restDependents] = remainingDependents;
    const migratedBin: Asset3DBinaryRecord = {
      ...originalBin,
      assetId: newOwner.id
    };
    binStore.put(migratedBin);
    binStore.delete(assetId);

    const nextOwnerMeta: Asset3DItem = { ...newOwner };
    delete nextOwnerMeta.binaryRefAssetId;
    assetStore.put(nextOwnerMeta);

    for (const dep of restDependents) {
      assetStore.put({
        ...dep,
        binaryRefAssetId: newOwner.id
      });
    }
  }

  assetStore.delete(assetId);
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

export async function get3DStorageReport(): Promise<Asset3DStorageReport> {
  let allAssets: Asset3DItem[] = [];
  let storedBinaryCount = 0;
  let actualBinaryBytes = 0;

  try {
    const db = await open3DDatabase();
    const tx = db.transaction([STORE_ASSETS, STORE_BINARIES], 'readonly');
    const [assetsRes, binKeys] = await Promise.all([
      requestToPromise<Asset3DItem[]>(tx.objectStore(STORE_ASSETS).getAll()),
      requestToPromise<IDBValidKey[]>(tx.objectStore(STORE_BINARIES).getAllKeys())
    ]);
    allAssets = assetsRes || [];
    storedBinaryCount = (binKeys || []).length;

    // Sum actual binary sizes without loading full ArrayBuffers unnecessarily when byteSize is stored,
    // or fallback to asset records owning each binary key.
    for (const key of binKeys || []) {
      const keyStr = String(key);
      const owner = allAssets.find((a) => a.id === keyStr);
      if (owner?.byteSize) {
        actualBinaryBytes += owner.byteSize;
      } else {
        const binRec = await requestToPromise<Asset3DBinaryRecord | undefined>(
          tx.objectStore(STORE_BINARIES).get(key)
        );
        actualBinaryBytes += binRec?.byteSize || binRec?.buffer?.byteLength || 0;
      }
    }
  } catch {
    // ignore storage read error
  }

  let quotaBytes: number | undefined;
  let usageBytes: number | undefined;
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      quotaBytes = est.quota;
      usageBytes = est.usage;
    } catch {
      // ignore estimate failure
    }
  }

  const sharedReferenceCount = allAssets.filter((a) => Boolean(a.binaryRefAssetId)).length;
  const logicalBinaryBytes = allAssets.reduce((sum, a) => sum + (a.byteSize || 0), 0);
  const metadataBytesEstimate = allAssets.reduce((sum, a) => {
    try {
      return sum + JSON.stringify(a).length;
    } catch {
      return sum;
    }
  }, 0);

  return {
    totalAssets: allAssets.length,
    storedBinaryCount,
    sharedReferenceCount,
    actualBinaryBytes,
    logicalBinaryBytes,
    metadataBytesEstimate,
    quotaBytes,
    usageBytes,
    maxSingleAssetBytes: MAX_DIRECT_IMPORT_BYTES
  };
}

export async function get3DLibraryStats(): Promise<{
  totalAssets: number;
  offlineBinaryCount: number;
  totalBytes: number;
}> {
  const report = await get3DStorageReport();
  return {
    totalAssets: report.totalAssets,
    offlineBinaryCount: report.storedBinaryCount,
    totalBytes: report.actualBinaryBytes
  };
}
