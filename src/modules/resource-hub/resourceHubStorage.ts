import { LibraryBookMeta } from '../knowledge-library/types';
import { VisualMediaItem } from '../visual-library/types';
import { getDefaultEnabledProviders } from './providers/registry';
import {
  AcademicContextRef,
  DuplicateDetectionResult,
  ImportStatus,
  ResourceProviderId,
  SavedResourceRecord,
  ScientificResourceItem
} from './types';
import { buildCanonicalResourceKey } from './utils';

const STORAGE_KEY = 'pharmlab_resource_hub_v1';

export interface ResourceHubPersistedState {
  savedRecords: SavedResourceRecord[];
  enabledProviders: Record<ResourceProviderId, boolean>;
  recentQueries: string[];
}

function getDefaultState(): ResourceHubPersistedState {
  return {
    savedRecords: [],
    enabledProviders: getDefaultEnabledProviders(),
    recentQueries: []
  };
}

export function loadResourceHubState(): ResourceHubPersistedState {
  if (typeof localStorage === 'undefined') return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<ResourceHubPersistedState>;
    return {
      savedRecords: Array.isArray(parsed.savedRecords) ? parsed.savedRecords : [],
      enabledProviders: {
        ...getDefaultEnabledProviders(),
        ...(parsed.enabledProviders || {})
      },
      recentQueries: Array.isArray(parsed.recentQueries) ? parsed.recentQueries : []
    };
  } catch {
    return getDefaultState();
  }
}

function persistState(state: ResourceHubPersistedState): ResourceHubPersistedState {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors on non-critical metadata
    }
  }
  return state;
}

export function setProviderEnabled(
  providerId: ResourceProviderId,
  enabled: boolean
): ResourceHubPersistedState {
  const current = loadResourceHubState();
  return persistState({
    ...current,
    enabledProviders: {
      ...current.enabledProviders,
      [providerId]: enabled
    }
  });
}

export function addRecentSearchQuery(query: string): ResourceHubPersistedState {
  const clean = query.trim();
  const current = loadResourceHubState();
  if (clean.length < 2) return current;
  const next = [clean, ...current.recentQueries.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
  return persistState({
    ...current,
    recentQueries: next
  });
}

function mergeContexts(
  existing: AcademicContextRef[],
  incoming: AcademicContextRef[]
): AcademicContextRef[] {
  const map = new Map<string, AcademicContextRef>();
  for (const c of existing) map.set(c.id, c);
  for (const c of incoming) map.set(c.id, c);
  return Array.from(map.values());
}

function mergeTopics(existing: string[], incoming: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...existing, ...incoming]) {
    const clean = item.trim();
    if (!clean) continue;
    const lower = clean.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(clean);
  }
  return out;
}

export function upsertSavedResourceRecord(
  item: ScientificResourceItem,
  opts: {
    status: ImportStatus;
    destination?: 'visual_library' | 'knowledge_library' | 'reference_list';
    linkedBookId?: string;
    linkedVisualId?: string;
    contexts?: AcademicContextRef[];
    topics?: string[];
    importNote?: string;
    lastError?: string;
  }
): { state: ResourceHubPersistedState; record: SavedResourceRecord } {
  const current = loadResourceHubState();
  const resourceKey = buildCanonicalResourceKey(item);
  const now = Date.now();
  const existingIdx = current.savedRecords.findIndex(
    (r) => r.resourceKey === resourceKey || r.resource.id === item.id
  );

  let record: SavedResourceRecord;
  const nextRecords = [...current.savedRecords];

  if (existingIdx >= 0) {
    const prev = current.savedRecords[existingIdx];
    record = {
      ...prev,
      resource: { ...prev.resource, ...item },
      status: opts.status,
      destination: opts.destination ?? prev.destination,
      linkedBookId: opts.linkedBookId ?? prev.linkedBookId,
      linkedVisualId: opts.linkedVisualId ?? prev.linkedVisualId,
      linkedContexts: mergeContexts(prev.linkedContexts, opts.contexts || []),
      linkedTopics: mergeTopics(prev.linkedTopics, opts.topics || []),
      importNote: opts.importNote ?? prev.importNote,
      lastError: opts.lastError,
      updatedAt: now
    };
    nextRecords[existingIdx] = record;
  } else {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `rh_${crypto.randomUUID()}`
        : `rh_${now}_${Math.random().toString(36).slice(2, 8)}`;
    record = {
      id,
      resourceKey,
      resource: item,
      status: opts.status,
      destination: opts.destination,
      linkedBookId: opts.linkedBookId,
      linkedVisualId: opts.linkedVisualId,
      linkedContexts: opts.contexts || [],
      linkedTopics: mergeTopics(item.topics, opts.topics || []),
      importNote: opts.importNote,
      lastError: opts.lastError,
      savedAt: now,
      updatedAt: now
    };
    nextRecords.unshift(record);
  }

  return {
    state: persistState({ ...current, savedRecords: nextRecords }),
    record
  };
}

export function updateSavedResourceAttachments(
  recordId: string,
  contexts: AcademicContextRef[],
  topics: string[]
): ResourceHubPersistedState {
  const current = loadResourceHubState();
  const next = current.savedRecords.map((rec) =>
    rec.id === recordId
      ? {
          ...rec,
          linkedContexts: contexts,
          linkedTopics: mergeTopics([], topics),
          updatedAt: Date.now()
        }
      : rec
  );
  return persistState({ ...current, savedRecords: next });
}

export function removeSavedResourceRecord(recordId: string): ResourceHubPersistedState {
  const current = loadResourceHubState();
  return persistState({
    ...current,
    savedRecords: current.savedRecords.filter((r) => r.id !== recordId)
  });
}

export function getAttachedResourcesForContext(filter: {
  structureId?: string;
  departmentId?: string;
  topicLabel?: string;
  experiment?: string;
  equipment?: string;
}): SavedResourceRecord[] {
  const { savedRecords } = loadResourceHubState();
  const topicLower = filter.topicLabel?.trim().toLowerCase();
  const expLower = filter.experiment?.trim().toLowerCase();
  const equipLower = filter.equipment?.trim().toLowerCase();

  return savedRecords.filter((rec) => {
    if (filter.structureId) {
      if (rec.linkedContexts.some((c) => c.structureId === filter.structureId)) {
        return true;
      }
    }
    if (filter.departmentId) {
      if (
        rec.linkedContexts.some((c) => c.departmentId === filter.departmentId) ||
        rec.resource.suggestedDepartments.includes(filter.departmentId as never)
      ) {
        if (
          rec.linkedContexts.some((c) => c.departmentId === filter.departmentId)
        ) {
          return true;
        }
      }
    }
    const haystack = [
      rec.resource.title,
      ...rec.linkedTopics,
      ...rec.linkedContexts.map((c) => c.label)
    ]
      .join(' ')
      .toLowerCase();
    if (topicLower && haystack.includes(topicLower)) return true;
    if (expLower && haystack.includes(expLower)) return true;
    if (equipLower && haystack.includes(equipLower)) return true;
    return false;
  });
}

function normalizeTitleForCompare(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectDuplicateResource(
  item: ScientificResourceItem,
  existingBooks: LibraryBookMeta[],
  existingVisuals: VisualMediaItem[],
  savedRecords: SavedResourceRecord[]
): DuplicateDetectionResult {
  const key = buildCanonicalResourceKey(item);
  const normTitle = normalizeTitleForCompare(item.title);

  const savedRecord = savedRecords.find(
    (rec) => rec.resourceKey === key || rec.resource.id === item.id
  );

  const existingVisual = existingVisuals.find((v) => {
    if (savedRecord?.linkedVisualId && v.id === savedRecord.linkedVisualId) return true;
    if (item.sourceUrl && v.sourceUrl && v.sourceUrl === item.sourceUrl) return true;
    if (item.imageUrl && v.remoteUrl && v.remoteUrl === item.imageUrl) return true;
    return normalizeTitleForCompare(v.title) === normTitle && normTitle.length > 6;
  });

  const existingBook = existingBooks.find((b) => {
    if (savedRecord?.linkedBookId && b.id === savedRecord.linkedBookId) return true;
    return normalizeTitleForCompare(b.title) === normTitle && normTitle.length > 6;
  });

  if (existingBook) {
    return {
      isDuplicate: true,
      reason: `Already imported into PDF Knowledge Library ("${existingBook.title}").`,
      savedRecord,
      existingBookId: existingBook.id,
      existingBookTitle: existingBook.title
    };
  }

  if (existingVisual) {
    return {
      isDuplicate: true,
      reason: `Already exists in Scientific Visual Library ("${existingVisual.title}").`,
      savedRecord,
      existingVisualId: existingVisual.id,
      existingVisualTitle: existingVisual.title
    };
  }

  if (savedRecord) {
    return {
      isDuplicate: true,
      reason:
        savedRecord.status === 'imported'
          ? 'Already imported and tracked in Resource Hub.'
          : 'Already saved in your Resource Hub reference list.',
      savedRecord
    };
  }

  return { isDuplicate: false };
}
