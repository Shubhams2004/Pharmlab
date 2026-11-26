import { buildOfficialBPharmSem1Profile, OFFICIAL_BPHARM_SEM1_SYLLABUS_ID } from './syllabusBridge';
import {
  AcquiredTopicResource,
  ExamQuestionItem,
  ExamQuestionPaper,
  SavedConceptNote,
  StudySectionKey,
  SyllabusProfile,
  TopicEnrichmentRecord,
  TopicStudyProgress
} from './types';

const DB_NAME = 'pharmlab_study_engine_v1';
const DB_VERSION = 2;

const STORE_SYLLABI = 'syllabi';
const STORE_RESOURCES = 'acquiredResources';
const STORE_PAPERS = 'questionPapers';
const STORE_QUESTIONS = 'examQuestions';
const STORE_PROGRESS = 'topicProgress';
const STORE_ENRICHMENTS = 'topicEnrichments';

const LAST_STUDY_TOPIC_KEY = 'pharmlab_p2_last_study_topic';
const ACTIVE_SYLLABUS_ID_KEY = 'pharmlab_p2_active_syllabus_id';
const ENRICHMENT_LOCAL_CACHE_KEY = 'pharmlab_enrichment_records_v1';

let dbPromise: Promise<IDBDatabase> | null = null;

function openStudyDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_SYLLABI)) {
        db.createObjectStore(STORE_SYLLABI, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RESOURCES)) {
        const resStore = db.createObjectStore(STORE_RESOURCES, { keyPath: 'id' });
        resStore.createIndex('byTopicId', 'topicId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PAPERS)) {
        db.createObjectStore(STORE_PAPERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUESTIONS)) {
        const qStore = db.createObjectStore(STORE_QUESTIONS, { keyPath: 'id' });
        qStore.createIndex('bySubjectCode', 'subjectCode', { unique: false });
        qStore.createIndex('byPaperId', 'paperId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        db.createObjectStore(STORE_PROGRESS, { keyPath: 'topicId' });
      }
      if (!db.objectStoreNames.contains(STORE_ENRICHMENTS)) {
        const enrichStore = db.createObjectStore(STORE_ENRICHMENTS, { keyPath: 'topicId' });
        enrichStore.createIndex('bySubjectCode', 'subjectCode', { unique: false });
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
      reject(req.error || new Error('Failed to open Study Engine database.'));
    };
  });

  return dbPromise;
}

function wrapReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function wrapTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Study database transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('Study database transaction aborted.'));
  });
}

export async function getAllSyllabi(): Promise<SyllabusProfile[]> {
  const official = buildOfficialBPharmSem1Profile();
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_SYLLABI, 'readwrite');
    const store = tx.objectStore(STORE_SYLLABI);
    const all = await wrapReq(store.getAll() as IDBRequest<SyllabusProfile[]>);
    const hasOfficial = all.some((s) => s.id === OFFICIAL_BPHARM_SEM1_SYLLABUS_ID);
    if (!hasOfficial) {
      store.put(official);
    }
    await wrapTx(tx);
    const merged = hasOfficial ? all : [official, ...all];
    return merged.sort((a, b) => (b.isSystemOfficial ? 1 : 0) - (a.isSystemOfficial ? 1 : 0) || b.updatedAt - a.updatedAt);
  } catch {
    return [official];
  }
}

export async function saveSyllabusProfile(profile: SyllabusProfile): Promise<SyllabusProfile> {
  const db = await openStudyDb();
  const tx = db.transaction(STORE_SYLLABI, 'readwrite');
  tx.objectStore(STORE_SYLLABI).put(profile);
  await wrapTx(tx);
  return profile;
}

export async function deleteSyllabusProfile(id: string): Promise<void> {
  if (id === OFFICIAL_BPHARM_SEM1_SYLLABUS_ID) return;
  const db = await openStudyDb();
  const tx = db.transaction(STORE_SYLLABI, 'readwrite');
  tx.objectStore(STORE_SYLLABI).delete(id);
  await wrapTx(tx);
}

export function getActiveSyllabusId(): string {
  try {
    return localStorage.getItem(ACTIVE_SYLLABUS_ID_KEY) || OFFICIAL_BPHARM_SEM1_SYLLABUS_ID;
  } catch {
    return OFFICIAL_BPHARM_SEM1_SYLLABUS_ID;
  }
}

export function setActiveSyllabusId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SYLLABUS_ID_KEY, id);
  } catch {
    // ignore storage errors
  }
}

export interface LastStudiedTopicSummary {
  syllabusId: string;
  subjectCode: string;
  topicId: string;
  topicTitle: string;
  readingProgressPct: number;
  timestamp: number;
}

export function getLastStudiedTopicSummary(): LastStudiedTopicSummary | null {
  try {
    const raw = localStorage.getItem(LAST_STUDY_TOPIC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastStudiedTopicSummary>;
    if (!parsed.topicId || !parsed.topicTitle) return null;
    return {
      syllabusId: parsed.syllabusId || OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
      subjectCode: parsed.subjectCode || '',
      topicId: parsed.topicId,
      topicTitle: parsed.topicTitle,
      readingProgressPct: typeof parsed.readingProgressPct === 'number' ? parsed.readingProgressPct : 0,
      timestamp: parsed.timestamp || Date.now()
    };
  } catch {
    return null;
  }
}

function saveLastStudiedTopicSummary(summary: LastStudiedTopicSummary): void {
  try {
    localStorage.setItem(LAST_STUDY_TOPIC_KEY, JSON.stringify(summary));
  } catch {
    // ignore storage errors
  }
}

export async function getAcquiredResourcesForTopic(
  topicId: string
): Promise<AcquiredTopicResource[]> {
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_RESOURCES, 'readonly');
    const idx = tx.objectStore(STORE_RESOURCES).index('byTopicId');
    const items = await wrapReq(
      idx.getAll(IDBKeyRange.only(topicId)) as IDBRequest<AcquiredTopicResource[]>
    );
    return items.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export async function getAllAcquiredResources(): Promise<AcquiredTopicResource[]> {
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_RESOURCES, 'readonly');
    const items = await wrapReq(
      tx.objectStore(STORE_RESOURCES).getAll() as IDBRequest<AcquiredTopicResource[]>
    );
    return items.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export async function saveAcquiredResourcesForTopic(
  items: AcquiredTopicResource[]
): Promise<void> {
  if (items.length === 0) return;
  const db = await openStudyDb();
  const tx = db.transaction(STORE_RESOURCES, 'readwrite');
  const store = tx.objectStore(STORE_RESOURCES);
  for (const item of items) {
    store.put(item);
  }
  await wrapTx(tx);
}

export async function removeAcquiredResource(id: string): Promise<void> {
  const db = await openStudyDb();
  const tx = db.transaction(STORE_RESOURCES, 'readwrite');
  tx.objectStore(STORE_RESOURCES).delete(id);
  await wrapTx(tx);
}

export async function getAllTopicProgress(): Promise<Record<string, TopicStudyProgress>> {
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_PROGRESS, 'readonly');
    const items = await wrapReq(
      tx.objectStore(STORE_PROGRESS).getAll() as IDBRequest<TopicStudyProgress[]>
    );
    const map: Record<string, TopicStudyProgress> = {};
    for (const item of items) {
      map[item.topicId] = item;
    }
    return map;
  } catch {
    return {};
  }
}

export async function saveTopicStudyProgress(
  progress: TopicStudyProgress
): Promise<TopicStudyProgress> {
  const updated: TopicStudyProgress = {
    ...progress,
    lastStudiedAt: Date.now()
  };
  saveLastStudiedTopicSummary({
    syllabusId: updated.syllabusId,
    subjectCode: updated.subjectCode,
    topicId: updated.topicId,
    topicTitle: updated.topicTitle,
    readingProgressPct: updated.readingProgressPct,
    timestamp: updated.lastStudiedAt
  });
  const db = await openStudyDb();
  const tx = db.transaction(STORE_PROGRESS, 'readwrite');
  tx.objectStore(STORE_PROGRESS).put(updated);
  await wrapTx(tx);
  return updated;
}

export function createEmptyTopicProgress(opts: {
  topicId: string;
  syllabusId: string;
  subjectCode: string;
  topicTitle: string;
}): TopicStudyProgress {
  return {
    topicId: opts.topicId,
    syllabusId: opts.syllabusId,
    subjectCode: opts.subjectCode,
    topicTitle: opts.topicTitle,
    completed: false,
    bookmarked: false,
    readingProgressPct: 0,
    sectionsVisited: [],
    personalNotes: '',
    savedConcepts: [],
    lastStudiedAt: Date.now()
  };
}

export function computeReadingProgress(
  visited: StudySectionKey[],
  totalRecommendedCount: number,
  completed: boolean
): number {
  if (completed) return 100;
  if (totalRecommendedCount <= 0) return 0;
  return Math.min(95, Math.round((visited.length / totalRecommendedCount) * 100));
}

export function createSavedConcept(
  title: string,
  note: string,
  sourceLabel?: string
): SavedConceptNote {
  return {
    id: `concept_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: title.trim(),
    note: note.trim(),
    sourceLabel,
    createdAt: Date.now()
  };
}

export async function getAllQuestionPapers(): Promise<ExamQuestionPaper[]> {
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_PAPERS, 'readonly');
    const items = await wrapReq(
      tx.objectStore(STORE_PAPERS).getAll() as IDBRequest<ExamQuestionPaper[]>
    );
    return items.sort((a, b) => b.importedAt - a.importedAt);
  } catch {
    return [];
  }
}

export async function saveQuestionPaper(paper: ExamQuestionPaper): Promise<void> {
  const db = await openStudyDb();
  const tx = db.transaction(STORE_PAPERS, 'readwrite');
  tx.objectStore(STORE_PAPERS).put(paper);
  await wrapTx(tx);
}

export async function deleteQuestionPaperAndQuestions(paperId: string): Promise<void> {
  const db = await openStudyDb();
  const tx = db.transaction([STORE_PAPERS, STORE_QUESTIONS], 'readwrite');
  tx.objectStore(STORE_PAPERS).delete(paperId);
  const qStore = tx.objectStore(STORE_QUESTIONS);
  const idx = qStore.index('byPaperId');
  const req = idx.openKeyCursor(IDBKeyRange.only(paperId));
  req.onsuccess = () => {
    const cursor = req.result;
    if (cursor) {
      qStore.delete(cursor.primaryKey);
      cursor.continue();
    }
  };
  await wrapTx(tx);
}

export async function getAllStoredQuestions(): Promise<ExamQuestionItem[]> {
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_QUESTIONS, 'readonly');
    const items = await wrapReq(
      tx.objectStore(STORE_QUESTIONS).getAll() as IDBRequest<ExamQuestionItem[]>
    );
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveExamQuestions(questions: ExamQuestionItem[]): Promise<void> {
  if (questions.length === 0) return;
  const db = await openStudyDb();
  const tx = db.transaction(STORE_QUESTIONS, 'readwrite');
  const store = tx.objectStore(STORE_QUESTIONS);
  for (const q of questions) {
    store.put(q);
  }
  await wrapTx(tx);
}

function readLocalEnrichmentCache(): Record<string, TopicEnrichmentRecord> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(ENRICHMENT_LOCAL_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TopicEnrichmentRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalEnrichmentCache(map: Record<string, TopicEnrichmentRecord>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(ENRICHMENT_LOCAL_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function getAllTopicEnrichmentsSync(): Record<string, TopicEnrichmentRecord> {
  return readLocalEnrichmentCache();
}

export async function getAllTopicEnrichments(): Promise<Record<string, TopicEnrichmentRecord>> {
  const localCache = readLocalEnrichmentCache();
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_ENRICHMENTS, 'readonly');
    const items = await wrapReq(
      tx.objectStore(STORE_ENRICHMENTS).getAll() as IDBRequest<TopicEnrichmentRecord[]>
    );
    const merged: Record<string, TopicEnrichmentRecord> = { ...localCache };
    for (const item of items) {
      const cached = merged[item.topicId];
      if (!cached || item.updatedAt >= cached.updatedAt) {
        merged[item.topicId] = item;
      }
    }
    writeLocalEnrichmentCache(merged);
    return merged;
  } catch {
    return localCache;
  }
}

export async function getTopicEnrichment(topicId: string): Promise<TopicEnrichmentRecord | null> {
  const localCache = readLocalEnrichmentCache();
  const localItem = localCache[topicId] || null;
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_ENRICHMENTS, 'readonly');
    const item = await wrapReq(
      tx.objectStore(STORE_ENRICHMENTS).get(topicId) as IDBRequest<TopicEnrichmentRecord | undefined>
    );
    if (item && (!localItem || item.updatedAt >= localItem.updatedAt)) {
      return item;
    }
    return localItem;
  } catch {
    return localItem;
  }
}

export async function saveTopicEnrichment(
  record: TopicEnrichmentRecord
): Promise<TopicEnrichmentRecord> {
  const nextRecord: TopicEnrichmentRecord = {
    ...record,
    updatedAt: Date.now()
  };
  const cache = readLocalEnrichmentCache();
  cache[nextRecord.topicId] = nextRecord;
  writeLocalEnrichmentCache(cache);
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_ENRICHMENTS, 'readwrite');
    tx.objectStore(STORE_ENRICHMENTS).put(nextRecord);
    await wrapTx(tx);
  } catch {
    // localStorage cache still preserves the enrichment record safely
  }
  return nextRecord;
}

export async function deleteTopicEnrichment(topicId: string): Promise<void> {
  const cache = readLocalEnrichmentCache();
  if (cache[topicId]) {
    delete cache[topicId];
    writeLocalEnrichmentCache(cache);
  }
  try {
    const db = await openStudyDb();
    const tx = db.transaction(STORE_ENRICHMENTS, 'readwrite');
    tx.objectStore(STORE_ENRICHMENTS).delete(topicId);
    await wrapTx(tx);
  } catch {
    // ignore IndexedDB unavailable
  }
}

