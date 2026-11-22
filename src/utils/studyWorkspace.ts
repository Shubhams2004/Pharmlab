export type StudyActivityKind = 'department' | 'experiment' | 'book' | 'visual' | 'equipment';

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
  category?: string | null;
  timestamp: number;
}

export interface StudyPreferences {
  density: 'comfortable' | 'compact';
  reducedMotion: boolean;
  defaultPdfFit: 'width' | 'page';
}

const RECENT_STORAGE_KEY = 'pharmlab_recent_activity';
const PREFS_STORAGE_KEY = 'pharmlab_preferences';
const MAX_RECENT_ITEMS = 12;

export const DEFAULT_STUDY_PREFERENCES: StudyPreferences = {
  density: 'comfortable',
  reducedMotion: false,
  defaultPdfFit: 'width'
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
      defaultPdfFit: parsed?.defaultPdfFit === 'page' ? 'page' : 'width'
    };
  } catch {
    return { ...DEFAULT_STUDY_PREFERENCES };
  }
}

export function applyStudyPreferencesToDom(prefs: StudyPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-density', prefs.density);
  root.setAttribute('data-reduced-motion', prefs.reducedMotion ? 'true' : 'false');
}

export function saveStudyPreferences(prefs: StudyPreferences): StudyPreferences {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
  applyStudyPreferencesToDom(prefs);
  return prefs;
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
