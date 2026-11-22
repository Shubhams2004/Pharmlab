import { ACADEMIC_SUBJECTS } from './academicRegistry';
import { BUILT_IN_VISUALS } from './builtInVisuals';
import {
  DepartmentId,
  OpenAccessCandidate,
  VisualCategory,
  VisualContextFilter,
  VisualMediaItem
} from './types';

const DB_NAME = 'pharmlab_visual_library';
const DB_VERSION = 1;

const STORE_VISUALS = 'visuals';
const STORE_BLOBS = 'imageBlobs';

let dbPromise: Promise<IDBDatabase> | null = null;
const objectUrlCache = new Map<string, string>();

function openVisualDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_VISUALS)) {
        const store = db.createObjectStore(STORE_VISUALS, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'visualId' });
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
      reject(req.error || new Error('Failed to open Scientific Visual Library database.'));
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
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function getAllVisuals(): Promise<VisualMediaItem[]> {
  let userItems: VisualMediaItem[] = [];
  try {
    const db = await openVisualDb();
    const tx = db.transaction(STORE_VISUALS, 'readonly');
    userItems = await wrapRequest(
      tx.objectStore(STORE_VISUALS).getAll() as IDBRequest<VisualMediaItem[]>
    );
  } catch {
    userItems = [];
  }

  const overridesById = new Map<string, VisualMediaItem>();
  const customItems: VisualMediaItem[] = [];

  for (const item of userItems) {
    if (item.sourceType === 'built-in') {
      overridesById.set(item.id, item);
    } else {
      customItems.push(item);
    }
  }

  const mergedBuiltIns = BUILT_IN_VISUALS.map((plate) => {
    const override = overridesById.get(plate.id);
    if (!override) return plate;
    return {
      ...plate,
      ...override,
      assetUrl: plate.assetUrl
    };
  });

  return [...customItems, ...mergedBuiltIns].sort(
    (a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt
  );
}

export async function resolveVisualImageSrc(item: VisualMediaItem): Promise<string | null> {
  if (item.assetUrl) return item.assetUrl;

  const cached = objectUrlCache.get(item.id);
  if (cached) return cached;

  if (item.hasLocalBlob) {
    try {
      const db = await openVisualDb();
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const record = await wrapRequest(
        tx.objectStore(STORE_BLOBS).get(item.id) as IDBRequest<
          { visualId: string; blob: Blob } | undefined
        >
      );
      if (record?.blob) {
        const url = URL.createObjectURL(record.blob);
        objectUrlCache.set(item.id, url);
        return url;
      }
    } catch {
      // fall through to remoteUrl if present
    }
  }

  return item.remoteUrl || null;
}

export async function getImageDimensionsFromBlob(
  blob: Blob
): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const dims = {
        width: img.naturalWidth || undefined,
        height: img.naturalHeight || undefined
      };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}

async function persistVisualWithBlob(
  item: VisualMediaItem,
  blob: Blob | null
): Promise<VisualMediaItem> {
  const db = await openVisualDb();
  const stores = blob ? [STORE_VISUALS, STORE_BLOBS] : [STORE_VISUALS];
  const tx = db.transaction(stores, 'readwrite');

  tx.objectStore(STORE_VISUALS).put(item);
  if (blob) {
    tx.objectStore(STORE_BLOBS).put({ visualId: item.id, blob });
  }

  try {
    await wrapTransaction(tx);
  } catch (err) {
    const record = err as { name?: string };
    if (record?.name === 'QuotaExceededError') {
      const quotaErr = new Error(
        'Browser storage quota exceeded while saving image. Delete unused files and try again.'
      );
      quotaErr.name = 'QuotaExceededError';
      throw quotaErr;
    }
    throw err;
  }

  return item;
}

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]);

export async function saveUploadedImage(
  file: File,
  meta: {
    title: string;
    caption: string;
    description: string;
    category: VisualCategory;
    departments: DepartmentId[];
    topics: string[];
    experiments: string[];
    equipment: string[];
    tags: string[];
    creator?: string;
    license?: string;
    sourceName?: string;
  }
): Promise<VisualMediaItem> {
  const extMatch = /\.(png|jpe?g|webp)$/i.test(file.name);
  if (!ALLOWED_IMAGE_MIME.has(file.type.toLowerCase()) && !extMatch) {
    throw new Error('Unsupported image format. Supported formats: PNG, JPG, JPEG, WEBP.');
  }

  if (file.size === 0) {
    throw new Error('The selected image file is empty (0 bytes).');
  }

  const dims = await getImageDimensionsFromBlob(file);
  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `vis_${crypto.randomUUID()}`
      : `vis_${now}_${Math.random().toString(36).slice(2, 8)}`;

  const item: VisualMediaItem = {
    id,
    title: meta.title.trim() || file.name.replace(/\.[^.]+$/, ''),
    caption: meta.caption.trim(),
    description: meta.description.trim(),
    category: meta.category,
    departments: meta.departments,
    topics: meta.topics,
    experiments: meta.experiments,
    equipment: meta.equipment,
    tags: meta.tags,
    sourceType: 'upload',
    sourceName: meta.sourceName?.trim() || 'Device Upload',
    creator: meta.creator?.trim() || 'Local User Upload',
    license: meta.license?.trim() || 'Personal Study / User Provided',
    mimeType: file.type || 'image/png',
    width: dims.width,
    height: dims.height,
    fileSize: file.size,
    hasLocalBlob: true,
    createdAt: now,
    updatedAt: now
  };

  return persistVisualWithBlob(item, file);
}

export async function saveCroppedTextbookDiagram(
  blob: Blob,
  meta: {
    title: string;
    caption: string;
    description: string;
    category: VisualCategory;
    departments: DepartmentId[];
    topics: string[];
    experiments: string[];
    equipment: string[];
    tags: string[];
    bookTitle: string;
    bookId: string;
    pageNumber: number;
  }
): Promise<VisualMediaItem> {
  const dims = await getImageDimensionsFromBlob(blob);
  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `crop_${crypto.randomUUID()}`
      : `crop_${now}_${Math.random().toString(36).slice(2, 8)}`;

  const item: VisualMediaItem = {
    id,
    title: meta.title.trim() || `${meta.bookTitle} (p. ${meta.pageNumber})`,
    caption: meta.caption.trim(),
    description: meta.description.trim(),
    category: meta.category,
    departments: meta.departments,
    topics: meta.topics,
    experiments: meta.experiments,
    equipment: meta.equipment,
    tags: meta.tags,
    sourceType: 'textbook-crop',
    sourceName: `${meta.bookTitle} · Page ${meta.pageNumber}`,
    creator: 'Extracted from Uploaded Textbook',
    license: 'Refer to Original Textbook License (Personal Study)',
    attribution: `Source: ${meta.bookTitle}, Page ${meta.pageNumber}`,
    mimeType: blob.type || 'image/png',
    width: dims.width,
    height: dims.height,
    fileSize: blob.size,
    linkedBookId: meta.bookId,
    linkedBookPage: meta.pageNumber,
    hasLocalBlob: true,
    createdAt: now,
    updatedAt: now
  };

  return persistVisualWithBlob(item, blob);
}

export async function importOpenAccessImage(
  candidate: OpenAccessCandidate,
  overrides?: {
    title?: string;
    caption?: string;
    category?: VisualCategory;
    departments?: DepartmentId[];
    topics?: string[];
    experiments?: string[];
    equipment?: string[];
    tags?: string[];
  }
): Promise<VisualMediaItem> {
  let downloadedBlob: Blob | null = null;
  let dims: { width?: number; height?: number } = {
    width: candidate.width,
    height: candidate.height
  };

  // Explicit user-initiated download into local IndexedDB
  try {
    const res = await fetch(candidate.fullUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0 && blob.type.startsWith('image/')) {
        downloadedBlob = blob;
        const measured = await getImageDimensionsFromBlob(blob);
        dims = {
          width: measured.width || candidate.width,
          height: measured.height || candidate.height
        };
      }
    }
  } catch {
    // Fallback to previewUrl if fullUrl was blocked by CORS
    try {
      const resPreview = await fetch(candidate.previewUrl, { mode: 'cors' });
      if (resPreview.ok) {
        const blob = await resPreview.blob();
        if (blob.size > 0 && blob.type.startsWith('image/')) {
          downloadedBlob = blob;
        }
      }
    } catch {
      downloadedBlob = null;
    }
  }

  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `oa_${crypto.randomUUID()}`
      : `oa_${now}_${Math.random().toString(36).slice(2, 8)}`;

  const item: VisualMediaItem = {
    id,
    title: overrides?.title?.trim() || candidate.title,
    caption: overrides?.caption?.trim() || candidate.description,
    description: candidate.description,
    category: overrides?.category || candidate.suggestedCategory,
    departments: overrides?.departments || candidate.suggestedDepartments,
    topics: overrides?.topics || [],
    experiments: overrides?.experiments || [],
    equipment: overrides?.equipment || [],
    tags: overrides?.tags || [candidate.repository],
    sourceType: 'open-access',
    sourceName: candidate.repository,
    sourceUrl: candidate.sourceUrl,
    creator: candidate.creator,
    license: candidate.license,
    attribution: candidate.attribution,
    mimeType: downloadedBlob?.type || candidate.mimeType || 'image/png',
    width: dims.width,
    height: dims.height,
    fileSize: downloadedBlob?.size || 0,
    remoteUrl: candidate.fullUrl || candidate.previewUrl,
    hasLocalBlob: Boolean(downloadedBlob),
    createdAt: now,
    updatedAt: now
  };

  return persistVisualWithBlob(item, downloadedBlob);
}

export async function updateVisualMetadata(
  id: string,
  patch: Partial<
    Pick<
      VisualMediaItem,
      | 'title'
      | 'caption'
      | 'description'
      | 'category'
      | 'departments'
      | 'topics'
      | 'experiments'
      | 'equipment'
      | 'tags'
      | 'sourceName'
      | 'creator'
      | 'license'
      | 'attribution'
      | 'subjectId'
      | 'academicDomain'
      | 'academicData'
      | 'annotations'
    >
  >
): Promise<VisualMediaItem | null> {
  const all = await getAllVisuals();
  const existing = all.find((item) => item.id === id);
  if (!existing) return null;

  const updated: VisualMediaItem = {
    ...existing,
    ...patch,
    updatedAt: Date.now()
  };

  const db = await openVisualDb();
  const tx = db.transaction(STORE_VISUALS, 'readwrite');
  tx.objectStore(STORE_VISUALS).put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function deleteVisual(id: string): Promise<void> {
  const cachedUrl = objectUrlCache.get(id);
  if (cachedUrl) {
    URL.revokeObjectURL(cachedUrl);
    objectUrlCache.delete(id);
  }

  const db = await openVisualDb();
  const tx = db.transaction([STORE_VISUALS, STORE_BLOBS], 'readwrite');
  tx.objectStore(STORE_VISUALS).delete(id);
  tx.objectStore(STORE_BLOBS).delete(id);
  await wrapTransaction(tx);
}

export async function getVisualsForContext(
  filter: VisualContextFilter
): Promise<VisualMediaItem[]> {
  const all = await getAllVisuals();
  const topicNeedle = filter.topic?.trim().toLowerCase();
  const expNeedle = filter.experiment?.trim().toLowerCase();
  const equipNeedle = filter.equipment?.trim().toLowerCase();

  const scored = all
    .map((item) => {
      let score = 0;

      if (filter.department && item.departments.includes(filter.department)) {
        score += 10;
      }

      const subj = item.subjectId ? ACADEMIC_SUBJECTS[item.subjectId] : undefined;
      const haystack = [
        item.title,
        item.caption,
        item.description,
        ...item.topics,
        ...item.tags,
        ...item.experiments,
        ...item.equipment,
        ...(subj
          ? [
              subj.identification.primaryName,
              subj.identification.scientificOrChemicalName || '',
              ...subj.searchKeywords,
              ...subj.textbookKeywords,
              ...(subj.drugNames || []),
              ...(subj.diseaseNames || [])
            ]
          : [])
      ]
        .join(' ')
        .toLowerCase();

      if (topicNeedle && haystack.includes(topicNeedle)) {
        score += 25;
      }
      if (expNeedle && haystack.includes(expNeedle)) {
        score += 20;
      }
      if (equipNeedle && haystack.includes(equipNeedle)) {
        score += 18;
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.item.updatedAt - a.item.updatedAt);

  return scored.map((entry) => entry.item);
}
