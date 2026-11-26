import {
  ALL_3D_CATEGORIES,
  Asset3DAnnotation,
  Asset3DBinaryRecord,
  Asset3DCategory,
  Asset3DDeleteImpact,
  Asset3DItem,
  Asset3DMeasurement,
  Asset3DStorageReport,
  BPharmDepartmentId,
  CATEGORY_3D_LABELS,
  Custom3DCategory,
  get3DCategoryLabel,
  ModelFormat,
  ModelScaleCalibration,
  normalizeCustomCategoryId,
  Predefined3DCategory,
  SavedCameraView,
  SyllabusAssociation
} from './types';
import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
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

export async function update3DAssetAnnotation(
  assetId: string,
  annotationId: string,
  patch: Partial<Pick<Asset3DAnnotation, 'label' | 'note'>>
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    annotations: (existing.annotations || []).map((a) =>
      a.id === annotationId ? { ...a, ...patch } : a
    )
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

export async function add3DSavedView(
  assetId: string,
  view: SavedCameraView
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    savedViews: [view, ...(existing.savedViews || [])]
  });
}

export async function remove3DSavedView(
  assetId: string,
  viewId: string
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    savedViews: (existing.savedViews || []).filter((v) => v.id !== viewId)
  });
}

export async function add3DMeasurement(
  assetId: string,
  measurement: Asset3DMeasurement
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    measurements: [measurement, ...(existing.measurements || [])]
  });
}

export async function toggle3DMeasurementVisible(
  assetId: string,
  measurementId: string
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    measurements: (existing.measurements || []).map((m) =>
      m.id === measurementId ? { ...m, visible: !m.visible } : m
    )
  });
}

export async function remove3DMeasurement(
  assetId: string,
  measurementId: string
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, {
    measurements: (existing.measurements || []).filter((m) => m.id !== measurementId)
  });
}

export async function clear3DMeasurements(assetId: string): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, { measurements: [] });
}

export async function save3DScaleCalibration(
  assetId: string,
  calibration: ModelScaleCalibration | undefined
): Promise<Asset3DItem | null> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return null;
  return update3DAssetMeta(assetId, { scaleCalibration: calibration });
}

function normAssocText(s?: string | null): string {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function sameAssocSlot(idA?: string, titleA?: string, idB?: string, titleB?: string): boolean {
  const aId = normAssocText(idA);
  const bId = normAssocText(idB);
  if (aId && bId) return aId === bId;
  const aTitle = normAssocText(titleA);
  const bTitle = normAssocText(titleB);
  if (!aId && !aTitle && !bId && !bTitle) return true;
  return (aId || aTitle) === (bId || bTitle);
}

function sameUnitSlot(a: SyllabusAssociation, b: SyllabusAssociation): boolean {
  const aId = normAssocText(a.unitId);
  const bId = normAssocText(b.unitId);
  if (aId && bId) return aId === bId;
  const aNo = normAssocText(a.unitNo);
  const bNo = normAssocText(b.unitNo);
  if (aNo && bNo) return aNo === bNo;
  return sameAssocSlot(a.unitId || a.unitNo, a.unitTitle, b.unitId || b.unitNo, b.unitTitle);
}

export function getSyllabusAssociationFingerprint(association: SyllabusAssociation): string {
  return [
    normAssocText(association.course) || 'b.pharm',
    normAssocText(association.departmentId),
    normAssocText(association.subjectCode) || normAssocText(association.subjectTitle),
    normAssocText(association.unitNo) || normAssocText(association.unitId) || normAssocText(association.unitTitle),
    normAssocText(association.topicId) || normAssocText(association.topicTitle),
    normAssocText(association.subtopicId) || normAssocText(association.subtopicTitle),
    normAssocText(association.learningObjective),
    normAssocText(association.experimentId) || normAssocText(association.experimentTitle),
    normAssocText(association.structureId) || normAssocText(association.structureName)
  ].join('|');
}

export function isSameSyllabusAssociation(
  a: SyllabusAssociation,
  b: SyllabusAssociation
): boolean {
  return (
    (normAssocText(a.course) || 'b.pharm') === (normAssocText(b.course) || 'b.pharm') &&
    normAssocText(a.departmentId) === normAssocText(b.departmentId) &&
    sameAssocSlot(a.subjectCode, a.subjectTitle, b.subjectCode, b.subjectTitle) &&
    sameUnitSlot(a, b) &&
    sameAssocSlot(a.topicId, a.topicTitle, b.topicId, b.topicTitle) &&
    sameAssocSlot(a.subtopicId, a.subtopicTitle, b.subtopicId, b.subtopicTitle) &&
    normAssocText(a.learningObjective) === normAssocText(b.learningObjective) &&
    sameAssocSlot(a.experimentId, a.experimentTitle, b.experimentId, b.experimentTitle) &&
    sameAssocSlot(a.structureId, a.structureName, b.structureId, b.structureName)
  );
}

export async function addSyllabusAssociationSafe(
  assetId: string,
  association: SyllabusAssociation
): Promise<{ asset: Asset3DItem | null; added: boolean; duplicate: boolean }> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return { asset: null, added: false, duplicate: false };

  const currentLinks = existing.syllabusLinks || [];
  const exactIdHit = currentLinks.find((l) => l.id === association.id);
  const semanticDup = currentLinks.find(
    (l) => l.id !== association.id && isSameSyllabusAssociation(l, association)
  );

  if (semanticDup) {
    return { asset: existing, added: false, duplicate: true };
  }

  const nextLinks = exactIdHit
    ? currentLinks.map((l) => (l.id === association.id ? association : l))
    : [association, ...currentLinks];

  const departments = Array.from(
    new Set<BPharmDepartmentId>([...(existing.departments || []), association.departmentId])
  );
  const updated = await update3DAssetMeta(assetId, {
    departments,
    syllabusLinks: nextLinks
  });

  return {
    asset: updated,
    added: !exactIdHit,
    duplicate: false
  };
}

export async function addSyllabusAssociation(
  assetId: string,
  association: SyllabusAssociation
): Promise<Asset3DItem | null> {
  const res = await addSyllabusAssociationSafe(assetId, association);
  return res.asset;
}

export async function updateSyllabusAssociation(
  assetId: string,
  associationId: string,
  patch: Partial<SyllabusAssociation>
): Promise<{ asset: Asset3DItem | null; updated: boolean; duplicate: boolean }> {
  const existing = await get3DAssetById(assetId);
  if (!existing) return { asset: null, updated: false, duplicate: false };

  const currentLinks = existing.syllabusLinks || [];
  const target = currentLinks.find((l) => l.id === associationId);
  if (!target) return { asset: existing, updated: false, duplicate: false };

  const nextLink: SyllabusAssociation = {
    ...target,
    ...patch,
    id: target.id
  };

  const semanticDup = currentLinks.find(
    (l) => l.id !== associationId && isSameSyllabusAssociation(l, nextLink)
  );
  if (semanticDup) {
    return { asset: existing, updated: false, duplicate: true };
  }

  const nextLinks = currentLinks.map((l) => (l.id === associationId ? nextLink : l));
  const departments = Array.from(
    new Set<BPharmDepartmentId>([...(existing.departments || []), nextLink.departmentId])
  );
  const saved = await update3DAssetMeta(assetId, {
    departments,
    syllabusLinks: nextLinks
  });

  return { asset: saved, updated: Boolean(saved), duplicate: false };
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

export type CurriculumMatchLevel =
  | 'subtopic'
  | 'objective'
  | 'topic'
  | 'unit'
  | 'experiment'
  | 'structure'
  | 'subject';

export interface Curriculum3DContextQuery {
  course?: string;
  departmentId?: BPharmDepartmentId;
  syllabusId?: string;
  subjectCode?: string;
  subjectTitle?: string;
  unitId?: string;
  unitNo?: string;
  unitTitle?: string;
  topicId?: string;
  topicTitle?: string;
  subtopicId?: string;
  subtopicTitle?: string;
  learningObjective?: string;
  experimentId?: string;
  experimentTitle?: string;
  structureId?: string;
  linkedStructureIds?: string[];
  query?: string;
  strictDirectOnly?: boolean;
}

export interface Curriculum3DMatch {
  asset: Asset3DItem;
  matchSource: 'direct_link' | 'verified_context';
  matchLevel: CurriculumMatchLevel;
  matchingLinkIds: string[];
  matchedSubtopics: string[];
  matchReasons: string[];
  score: number;
}

export interface Related3DModelMatch {
  asset: Asset3DItem;
  reasons: string[];
  primaryReason: string;
  score: number;
}

export function matchCurriculumAssetsSync(
  allAssets: Asset3DItem[],
  ctx: Curriculum3DContextQuery
): {
  directLinks: Curriculum3DMatch[];
  verifiedContextualMatches: Curriculum3DMatch[];
} {
  if (!allAssets.length) return { directLinks: [], verifiedContextualMatches: [] };

  const normSubjectCode = normAssocText(ctx.subjectCode);
  const normUnitId = normAssocText(ctx.unitId);
  const normUnitNo = normAssocText(ctx.unitNo);
  const normTopicId = normAssocText(ctx.topicId);
  const normTopicTitle = normAssocText(ctx.topicTitle);
  const normSubtopicId = normAssocText(ctx.subtopicId);
  const normSubtopicTitle = normAssocText(ctx.subtopicTitle);
  const normObjective = normAssocText(ctx.learningObjective);
  const normExpId = normAssocText(ctx.experimentId);
  const normExpTitle = normAssocText(ctx.experimentTitle);
  const normStructureId = normAssocText(ctx.structureId);
  const linkedStructSet = new Set(
    (ctx.linkedStructureIds || []).map((id) => normAssocText(id)).filter(Boolean)
  );

  const isTopicScopedQuery = Boolean(normTopicId || normTopicTitle);
  const isUnitScopedQuery = Boolean((normUnitId || normUnitNo) && !isTopicScopedQuery);
  const isSubjectOnlyQuery = Boolean(
    normSubjectCode && !isTopicScopedQuery && !isUnitScopedQuery && !normExpId && !normExpTitle
  );

  const directLinks: Curriculum3DMatch[] = [];
  const verifiedContextualMatches: Curriculum3DMatch[] = [];

  for (const asset of allAssets) {
    let directScore = 0;
    let contextualScore = 0;
    let bestDirectLevel: CurriculumMatchLevel | null = null;
    let bestContextLevel: CurriculumMatchLevel | null = null;
    const directLinkIds: string[] = [];
    const contextLinkIds: string[] = [];
    const matchedSubtopics = new Set<string>();
    const directReasons: string[] = [];
    const contextReasons: string[] = [];

    for (const lnk of asset.syllabusLinks || []) {
      const lnkSubject = normAssocText(lnk.subjectCode);
      const subjectMatches = Boolean(normSubjectCode && lnkSubject === normSubjectCode);
      const subjectCompatible = !lnkSubject || !normSubjectCode || lnkSubject === normSubjectCode;

      const lnkStructure = normAssocText(lnk.structureId);
      const structureDirectHit = Boolean(normStructureId && lnkStructure === normStructureId);
      const linkedStructContextHit = Boolean(
        !ctx.strictDirectOnly && lnkStructure && linkedStructSet.has(lnkStructure)
      );

      const lnkExpId = normAssocText(lnk.experimentId);
      const lnkExpTitle = normAssocText(lnk.experimentTitle);
      const expDirectHit = Boolean(
        (normExpId && lnkExpId === normExpId) ||
          (normExpTitle && lnkExpTitle && lnkExpTitle === normExpTitle)
      );

      const lnkTopicId = normAssocText(lnk.topicId);
      const lnkTopicTitle = normAssocText(lnk.topicTitle);
      const topicDirectHit = Boolean(
        subjectCompatible &&
          ((normTopicId && lnkTopicId === normTopicId) ||
            (normTopicTitle && lnkTopicTitle && lnkTopicTitle === normTopicTitle))
      );

      const lnkSubId = normAssocText(lnk.subtopicId);
      const lnkSubTitle = normAssocText(lnk.subtopicTitle);
      const subtopicDirectHit = Boolean(
        subjectCompatible &&
          (normSubtopicId || normSubtopicTitle) &&
          ((normSubtopicId && lnkSubId === normSubtopicId) ||
            (normSubtopicTitle && lnkSubTitle && lnkSubTitle === normSubtopicTitle))
      );

      const lnkObjective = normAssocText(lnk.learningObjective);
      const objectiveDirectHit = Boolean(
        subjectCompatible && normObjective && lnkObjective === normObjective
      );

      const lnkUnitId = normAssocText(lnk.unitId);
      const lnkUnitNo = normAssocText(lnk.unitNo);
      const unitMatches = Boolean(
        subjectCompatible &&
          ((normUnitId && lnkUnitId === normUnitId) ||
            (normUnitNo && lnkUnitNo && lnkUnitNo === normUnitNo))
      );

      // Guard: if querying a specific topic and the link explicitly specifies a DIFFERENT topic, do not match by unit/subject
      const pointsToDifferentTopic = Boolean(
        isTopicScopedQuery &&
          (lnkTopicId || lnkTopicTitle) &&
          !topicDirectHit
      );

      if (subtopicDirectHit) {
        directScore = Math.max(directScore, 100);
        bestDirectLevel = 'subtopic';
        directLinkIds.push(lnk.id);
        if (lnk.subtopicTitle) matchedSubtopics.add(lnk.subtopicTitle);
        directReasons.push(`Linked to subtopic: ${lnk.subtopicTitle || lnk.subtopicId}`);
      } else if (objectiveDirectHit) {
        directScore = Math.max(directScore, 95);
        if (!bestDirectLevel) bestDirectLevel = 'objective';
        directLinkIds.push(lnk.id);
        directReasons.push(`Linked to objective: ${lnk.learningObjective}`);
      } else if (structureDirectHit) {
        directScore = Math.max(directScore, 92);
        if (!bestDirectLevel) bestDirectLevel = 'structure';
        directLinkIds.push(lnk.id);
        if (lnk.subtopicTitle) matchedSubtopics.add(lnk.subtopicTitle);
        directReasons.push(`Linked to structure: ${lnk.structureName || lnk.structureId}`);
      } else if (topicDirectHit) {
        directScore = Math.max(directScore, 88);
        if (!bestDirectLevel) bestDirectLevel = 'topic';
        directLinkIds.push(lnk.id);
        if (lnk.subtopicTitle) matchedSubtopics.add(lnk.subtopicTitle);
        directReasons.push(
          lnk.subtopicTitle
            ? `Linked to topic (${lnk.subtopicTitle})`
            : `Linked to topic: ${lnk.topicTitle || lnk.topicId}`
        );
      } else if (expDirectHit) {
        directScore = Math.max(directScore, 84);
        if (!bestDirectLevel) bestDirectLevel = 'experiment';
        directLinkIds.push(lnk.id);
        directReasons.push(`Linked to experiment: ${lnk.experimentTitle || lnk.experimentId}`);
      } else if (unitMatches && isUnitScopedQuery) {
        directScore = Math.max(directScore, 76);
        if (!bestDirectLevel) bestDirectLevel = 'unit';
        directLinkIds.push(lnk.id);
        if (lnk.subtopicTitle) matchedSubtopics.add(lnk.subtopicTitle);
        directReasons.push(
          lnk.topicTitle
            ? `Linked in ${lnk.unitNo || 'Unit'}: ${lnk.topicTitle}`
            : `Linked to ${lnk.unitNo || lnk.unitTitle || 'Unit'}`
        );
      } else if (subjectMatches && isSubjectOnlyQuery) {
        directScore = Math.max(directScore, 68);
        if (!bestDirectLevel) bestDirectLevel = 'subject';
        directLinkIds.push(lnk.id);
        if (lnk.subtopicTitle) matchedSubtopics.add(lnk.subtopicTitle);
        directReasons.push(
          lnk.topicTitle
            ? `Linked in ${lnk.subjectCode}: ${lnk.topicTitle}`
            : `Linked to ${lnk.subjectCode}`
        );
      } else if (!ctx.strictDirectOnly && !pointsToDifferentTopic) {
        if (linkedStructContextHit) {
          const catEntity = ANATOMY_CATALOG.find((e) => normAssocText(e.id) === lnkStructure);
          contextualScore = Math.max(contextualScore, 62);
          if (!bestContextLevel) bestContextLevel = 'structure';
          contextLinkIds.push(lnk.id);
          contextReasons.push(
            `Syllabus anatomical structure: ${catEntity?.name || lnk.structureName || lnk.structureId}`
          );
        } else if (unitMatches && !lnkTopicId && !lnkTopicTitle && isTopicScopedQuery) {
          contextualScore = Math.max(contextualScore, 52);
          if (!bestContextLevel) bestContextLevel = 'unit';
          contextLinkIds.push(lnk.id);
          contextReasons.push(`Unit-level asset for ${lnk.unitNo || lnk.unitTitle || 'this unit'}`);
        }
      }
    }

    if (directScore > 0 && bestDirectLevel) {
      directLinks.push({
        asset,
        matchSource: 'direct_link',
        matchLevel: bestDirectLevel,
        matchingLinkIds: Array.from(new Set(directLinkIds)),
        matchedSubtopics: Array.from(matchedSubtopics),
        matchReasons: Array.from(new Set(directReasons)),
        score: directScore
      });
    } else if (contextualScore > 0 && bestContextLevel) {
      verifiedContextualMatches.push({
        asset,
        matchSource: 'verified_context',
        matchLevel: bestContextLevel,
        matchingLinkIds: Array.from(new Set(contextLinkIds)),
        matchedSubtopics: Array.from(matchedSubtopics),
        matchReasons: Array.from(new Set(contextReasons)),
        score: contextualScore
      });
    }
  }

  directLinks.sort((a, b) => b.score - a.score || (b.asset.updatedAt || 0) - (a.asset.updatedAt || 0));
  verifiedContextualMatches.sort(
    (a, b) => b.score - a.score || (b.asset.updatedAt || 0) - (a.asset.updatedAt || 0)
  );

  return { directLinks, verifiedContextualMatches };
}

export async function getCurriculum3DMatches(ctx: Curriculum3DContextQuery): Promise<{
  directLinks: Curriculum3DMatch[];
  verifiedContextualMatches: Curriculum3DMatch[];
}> {
  const all = await getAll3DAssets();
  return matchCurriculumAssetsSync(all, ctx);
}

export function getRelated3DModels(
  asset: Asset3DItem,
  allAssets: Asset3DItem[],
  maxResults = 6
): Related3DModelMatch[] {
  const targetLinks = asset.syllabusLinks || [];
  const targetSubjects = new Set(
    targetLinks.map((l) => normAssocText(l.subjectCode)).filter(Boolean)
  );
  const targetTopics = new Set(
    targetLinks.map((l) => normAssocText(l.topicId || l.topicTitle)).filter(Boolean)
  );
  const targetUnits = new Set(
    targetLinks
      .map((l) =>
        l.subjectCode && (l.unitId || l.unitNo)
          ? `${normAssocText(l.subjectCode)}::${normAssocText(l.unitId || l.unitNo)}`
          : ''
      )
      .filter(Boolean)
  );
  const targetExperiments = new Set(
    targetLinks.map((l) => normAssocText(l.experimentId || l.experimentTitle)).filter(Boolean)
  );
  const targetStructIds = new Set(
    targetLinks.map((l) => normAssocText(l.structureId)).filter(Boolean)
  );

  const relatedStructMap = new Map<string, string>();
  for (const sId of targetStructIds) {
    const entity = ANATOMY_CATALOG.find((e) => normAssocText(e.id) === sId);
    if (entity) {
      for (const relId of entity.relatedStructureIds || []) {
        relatedStructMap.set(normAssocText(relId), entity.name);
      }
    }
  }

  const results: Related3DModelMatch[] = [];

  for (const other of allAssets) {
    if (other.id === asset.id) continue;
    let score = 0;
    const reasons: string[] = [];

    for (const lnk of other.syllabusLinks || []) {
      const tKey = normAssocText(lnk.topicId || lnk.topicTitle);
      if (tKey && targetTopics.has(tKey)) {
        score += 32;
        reasons.push(`Same syllabus topic: ${lnk.topicTitle || lnk.topicId}`);
      }

      const sKey = normAssocText(lnk.subjectCode);
      const uKey =
        lnk.subjectCode && (lnk.unitId || lnk.unitNo)
          ? `${normAssocText(lnk.subjectCode)}::${normAssocText(lnk.unitId || lnk.unitNo)}`
          : '';
      if (uKey && targetUnits.has(uKey)) {
        score += 22;
        reasons.push(`Same curriculum unit: ${lnk.subjectCode} ${lnk.unitNo || ''}`.trim());
      } else if (sKey && targetSubjects.has(sKey)) {
        score += 14;
        reasons.push(`Same subject: ${lnk.subjectCode}`);
      }

      const oStruct = normAssocText(lnk.structureId);
      if (oStruct && targetStructIds.has(oStruct)) {
        score += 28;
        reasons.push(`Same anatomical structure: ${lnk.structureName || lnk.structureId}`);
      } else if (oStruct && relatedStructMap.has(oStruct)) {
        score += 22;
        reasons.push(`Anatomically related to ${relatedStructMap.get(oStruct)}`);
      }

      const oExp = normAssocText(lnk.experimentId || lnk.experimentTitle);
      if (oExp && targetExperiments.has(oExp)) {
        score += 24;
        reasons.push(`Same practical: ${lnk.experimentTitle || lnk.experimentId}`);
      }
    }

    if (other.category === asset.category && asset.category !== 'other') {
      score += 6;
      reasons.push(`Same category: ${get3DCategoryLabel(asset.category)}`);
    }

    const dedupedReasons = Array.from(new Set(reasons));
    if (score > 0 && dedupedReasons.length > 0) {
      results.push({
        asset: other,
        reasons: dedupedReasons,
        primaryReason: dedupedReasons[0],
        score
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || (b.asset.updatedAt || 0) - (a.asset.updatedAt || 0))
    .slice(0, maxResults);
}

export async function get3DAssetsForContext(
  ctx: Curriculum3DContextQuery
): Promise<Asset3DItem[]> {
  const all = await getAll3DAssets();
  if (all.length === 0) return [];

  const { directLinks, verifiedContextualMatches } = matchCurriculumAssetsSync(all, ctx);
  const mergedMap = new Map<string, { asset: Asset3DItem; score: number }>();

  for (const m of directLinks) {
    mergedMap.set(m.asset.id, { asset: m.asset, score: m.score });
  }
  for (const m of verifiedContextualMatches) {
    if (!mergedMap.has(m.asset.id)) {
      mergedMap.set(m.asset.id, { asset: m.asset, score: m.score });
    }
  }

  const qTokens = (ctx.query || '')
    .toLowerCase()
    .split(/[\s,/()-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);

  if (qTokens.length > 0 && !ctx.strictDirectOnly) {
    for (const asset of all) {
      if (mergedMap.has(asset.id)) continue;
      if (
        ctx.subjectCode &&
        asset.syllabusLinks.length > 0 &&
        !asset.syllabusLinks.some(
          (l) => !l.subjectCode || normAssocText(l.subjectCode) === normAssocText(ctx.subjectCode)
        )
      ) {
        continue;
      }
      const hay = `${asset.name} ${asset.tags.join(' ')} ${asset.syllabusLinks
        .map((l) => `${l.topicTitle || ''} ${l.subtopicTitle || ''} ${l.structureName || ''} ${l.experimentTitle || ''}`)
        .join(' ')}`.toLowerCase();
      let tokenHits = 0;
      for (const tok of qTokens) {
        if (hay.includes(tok)) tokenHits += 1;
      }
      if (tokenHits >= 2 || (qTokens.length === 1 && tokenHits === 1)) {
        mergedMap.set(asset.id, { asset, score: tokenHits * 6 });
      }
    }
  }

  return Array.from(mergedMap.values())
    .sort((a, b) => b.score - a.score || (b.asset.updatedAt || 0) - (a.asset.updatedAt || 0))
    .map((entry) => entry.asset);
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
