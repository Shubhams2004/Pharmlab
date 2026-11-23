export type StudyActivityKind =
  | 'department'
  | 'experiment'
  | 'book'
  | 'visual'
  | 'equipment'
  | 'structure'
  | 'study_topic'
  | 'model_3d';

export interface RecentStudyItem {
  key: string;
  kind: StudyActivityKind;
  title: string;
  subtitle: string;
  moduleId: string;
  tab?: string | null;
  bookId?: string | null;
  pageNumber?: number | null;
  visualId?: string | null;
  asset3dId?: string | null;
  structureId?: string | null;
  category?: string | null;
  syllabusId?: string | null;
  subjectCode?: string | null;
  topicId?: string | null;
  timestamp: number;
}

export interface StudyPreferences {
  density: 'comfortable' | 'compact';
  reducedMotion: boolean;
  defaultPdfFit: 'width' | 'page';
  textSize: number;
}

const RECENT_STORAGE_KEY = 'pharmlab_recent_activity';
const PREFS_STORAGE_KEY = 'pharmlab_preferences';
const MAX_RECENT_ITEMS = 12;

export const MIN_TEXT_SIZE = 90;
export const MAX_TEXT_SIZE = 140;
export const TEXT_SIZE_STEP = 5;
export const DEFAULT_TEXT_SIZE = 110;

export function clampTextSize(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return DEFAULT_TEXT_SIZE;
  const rounded = Math.round(num / TEXT_SIZE_STEP) * TEXT_SIZE_STEP;
  return Math.max(MIN_TEXT_SIZE, Math.min(MAX_TEXT_SIZE, rounded));
}

export function stepTextSize(current: number, delta: -1 | 1): number {
  return clampTextSize(current + delta * TEXT_SIZE_STEP);
}

export const DEFAULT_STUDY_PREFERENCES: StudyPreferences = {
  density: 'comfortable',
  reducedMotion: false,
  defaultPdfFit: 'width',
  textSize: DEFAULT_TEXT_SIZE
};

export function getRecentActivity(): RecentStudyItem[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.key === 'string' && typeof item.title === 'string')
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

export function recordRecentActivity(
  item: Omit<RecentStudyItem, 'timestamp'> & { timestamp?: number }
): RecentStudyItem[] {
  const entry: RecentStudyItem = {
    ...item,
    timestamp: item.timestamp ?? Date.now()
  };
  const existing = getRecentActivity().filter((r) => r.key !== entry.key);
  const next = [entry, ...existing].slice(0, MAX_RECENT_ITEMS);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

export function clearRecentActivity(): RecentStudyItem[] {
  try {
    localStorage.removeItem(RECENT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  return [];
}

export function getStudyPreferences(): StudyPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STUDY_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      density: parsed?.density === 'compact' ? 'compact' : 'comfortable',
      reducedMotion: Boolean(parsed?.reducedMotion),
      defaultPdfFit: parsed?.defaultPdfFit === 'page' ? 'page' : 'width',
      textSize:
        typeof parsed?.textSize === 'number'
          ? clampTextSize(parsed.textSize)
          : DEFAULT_TEXT_SIZE
    };
  } catch {
    return { ...DEFAULT_STUDY_PREFERENCES };
  }
}

export function applyStudyPreferencesToDom(prefs: StudyPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const textSize = clampTextSize(prefs.textSize);
  root.setAttribute('data-density', prefs.density);
  root.setAttribute('data-reduced-motion', prefs.reducedMotion ? 'true' : 'false');
  root.setAttribute('data-text-size', String(textSize));
  root.style.setProperty('--app-text-scale', String(textSize / 100));
}

export function saveStudyPreferences(prefs: StudyPreferences): StudyPreferences {
  const normalized: StudyPreferences = {
    ...prefs,
    textSize: clampTextSize(prefs.textSize)
  };
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore storage errors
  }
  applyStudyPreferencesToDom(normalized);
  return normalized;
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
      new Date(timestamp)
    );
  } catch {
    return '';
  }
}
