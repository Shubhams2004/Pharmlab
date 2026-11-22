import { ANATOMY_CATALOG } from '../data/anatomyCatalog';
import {
  ANATOMY_CATEGORIES,
  ENGINE_DEPARTMENTS,
  ENGINE_SUBJECTS,
  ENGINE_SUBTOPICS,
  ENGINE_TOPICS,
  TEXTBOOK_REFERENCES
} from '../data/academicEngineRegistry';
import { BookRecord } from '../modules/knowledge-library/types';
import { resolveAcademicContextForVisual } from '../modules/visual-library/academicRegistry';
import { InteractiveAnnotation } from '../modules/visual-library/academicTypes';
import { VisualMediaItem } from '../modules/visual-library/types';
import { DEPARTMENT_WORKSPACES } from '../types/academicArchitecture';
import {
  AnatomicalCategoryId,
  AnatomicalStructureEntity,
  AnatomyPracticeStats,
  EngineDepartment,
  EngineSubject,
  EngineSubtopic,
  EngineTopic,
  LocalTopicPdfLink,
  RecentStructureEntry,
  TextbookReferenceEntity,
  UnifiedEngineSearchResults
} from '../types/academicEngine';

const RECENT_STRUCTURES_KEY = 'pharmlab_anatomy_recent';
const PRACTICE_STATS_KEY = 'pharmlab_anatomy_id_practice';
const TOPIC_PDF_LINKS_KEY = 'pharmlab_topic_pdf_links';

const STRUCTURE_BY_ID = new Map<string, AnatomicalStructureEntity>(
  ANATOMY_CATALOG.map((item) => [item.id, item])
);

const CATEGORY_LABEL_MAP = new Map<AnatomicalCategoryId, string>(
  ANATOMY_CATEGORIES.map((c) => [c.id, c.label])
);

export function getCategoryLabel(categoryId: AnatomicalCategoryId): string {
  return CATEGORY_LABEL_MAP.get(categoryId) || categoryId;
}

export function getDepartments(): EngineDepartment[] {
  return Object.values(ENGINE_DEPARTMENTS);
}

export function getSubjectsForDepartment(departmentId: string): EngineSubject[] {
  const dept = ENGINE_DEPARTMENTS[departmentId];
  if (!dept) return [];
  return dept.subjectIds.map((id) => ENGINE_SUBJECTS[id]).filter(Boolean);
}

export function getTopicsForSubject(subjectId: string): EngineTopic[] {
  const subj = ENGINE_SUBJECTS[subjectId];
  if (!subj) return [];
  return subj.topicIds.map((id) => ENGINE_TOPICS[id]).filter(Boolean);
}

export function getSubtopicsForTopic(topicId: string): EngineSubtopic[] {
  const topic = ENGINE_TOPICS[topicId];
  if (!topic) return [];
  return topic.subtopicIds.map((id) => ENGINE_SUBTOPICS[id]).filter(Boolean);
}

export function getStructureById(id: string | null | undefined): AnatomicalStructureEntity | null {
  if (!id) return null;
  return STRUCTURE_BY_ID.get(id) || null;
}

export function getStructuresByCategory(
  categoryId: AnatomicalCategoryId | 'all'
): AnatomicalStructureEntity[] {
  if (categoryId === 'all') return ANATOMY_CATALOG;
  const seen = new Set<string>();
  const matches: AnatomicalStructureEntity[] = [];
  for (const item of ANATOMY_CATALOG) {
    if (item.categories.includes(categoryId) && !seen.has(item.id)) {
      seen.add(item.id);
      matches.push(item);
    }
  }
  return matches;
}

export function getCategoryCountMap(): Record<AnatomicalCategoryId | 'all', number> {
  const counts = { all: ANATOMY_CATALOG.length } as Record<AnatomicalCategoryId | 'all', number>;
  for (const cat of ANATOMY_CATEGORIES) {
    counts[cat.id] = getStructuresByCategory(cat.id).length;
  }
  return counts;
}

export function getRelatedStructures(
  structure: AnatomicalStructureEntity
): AnatomicalStructureEntity[] {
  const seen = new Set<string>([structure.id]);
  const list: AnatomicalStructureEntity[] = [];
  for (const relId of structure.relatedStructureIds) {
    const found = STRUCTURE_BY_ID.get(relId);
    if (found && !seen.has(found.id)) {
      seen.add(found.id);
      list.push(found);
    }
  }
  return list;
}

export function getSubtopicsForStructure(structure: AnatomicalStructureEntity): EngineSubtopic[] {
  const seen = new Set<string>();
  const list: EngineSubtopic[] = [];
  for (const id of structure.subtopicIds) {
    const sub = ENGINE_SUBTOPICS[id];
    if (sub && !seen.has(sub.id)) {
      seen.add(sub.id);
      list.push(sub);
    }
  }
  for (const sub of Object.values(ENGINE_SUBTOPICS)) {
    if (sub.structureId === structure.id && !seen.has(sub.id)) {
      seen.add(sub.id);
      list.push(sub);
    }
  }
  return list;
}

export function getTextbookRefsForStructure(
  structure: AnatomicalStructureEntity
): TextbookReferenceEntity[] {
  return structure.textbookRefIds.map((id) => TEXTBOOK_REFERENCES[id]).filter(Boolean);
}

function containsWholeTerm(haystack: string, needle: string): boolean {
  const clean = needle.trim().toLowerCase();
  if (clean.length < 3) return false;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(haystack);
}

export function getVisualsForStructure(
  structure: AnatomicalStructureEntity,
  allVisuals: VisualMediaItem[]
): VisualMediaItem[] {
  const seen = new Set<string>();
  const matched: VisualMediaItem[] = [];

  for (const visId of structure.visualIds) {
    const exact = allVisuals.find((v) => v.id === visId);
    if (exact && !seen.has(exact.id)) {
      seen.add(exact.id);
      matched.push(exact);
    }
  }

  // Match any user-uploaded, textbook-cropped, or open-access images tagged with this structure
  const needles = [
    structure.name.toLowerCase(),
    ...structure.alternateNames.map((a) => a.toLowerCase())
  ].filter((n) => n.length >= 4);

  for (const visual of allVisuals) {
    if (seen.has(visual.id)) continue;
    // Do not duplicate unrelated built-in plates via loose substring matches
    if (visual.sourceType === 'built-in') continue;

    const hay = [
      visual.title,
      visual.caption,
      visual.description,
      ...visual.topics,
      ...visual.tags
    ]
      .join(' ')
      .toLowerCase();

    if (needles.some((needle) => containsWholeTerm(hay, needle))) {
      seen.add(visual.id);
      matched.push(visual);
    }
  }

  return matched;
}

export function getCurriculumBreadcrumbsForStructure(structure: AnatomicalStructureEntity) {
  const dept = ENGINE_DEPARTMENTS.dept_anatomy;
  const subj = ENGINE_SUBJECTS[structure.subjectId] || ENGINE_SUBJECTS.subj_body_systems;
  const topic = ENGINE_TOPICS[structure.topicId];
  return {
    department: dept,
    subject: subj,
    topic,
    structure
  };
}

export function findStructureForVisual(visual: VisualMediaItem): AnatomicalStructureEntity | null {
  const direct = ANATOMY_CATALOG.find((s) => s.visualIds.includes(visual.id));
  if (direct) return direct;

  const hay = [visual.title, ...visual.topics, ...visual.tags].join(' ').toLowerCase();

  // Explicit kidney/heart fallbacks for custom/imported diagrams of paired/sub-organs
  if (containsWholeTerm(hay, 'right kidney')) return STRUCTURE_BY_ID.get('anat_11_right_kidney') || null;
  if (containsWholeTerm(hay, 'left kidney')) return STRUCTURE_BY_ID.get('anat_12_left_kidney') || null;
  if (containsWholeTerm(hay, 'kidney') || containsWholeTerm(hay, 'nephron') || containsWholeTerm(hay, 'renal')) {
    return STRUCTURE_BY_ID.get('anat_11_right_kidney') || null;
  }
  if (containsWholeTerm(hay, 'heart valve') || containsWholeTerm(hay, 'heart valves')) {
    return STRUCTURE_BY_ID.get('anat_60_heart_valves') || null;
  }
  if (containsWholeTerm(hay, 'heart') || containsWholeTerm(hay, 'cardiac')) {
    return STRUCTURE_BY_ID.get('anat_03_heart') || null;
  }

  return (
    ANATOMY_CATALOG.find(
      (s) =>
        containsWholeTerm(hay, s.name) ||
        s.alternateNames.some((alt) => alt.length >= 4 && containsWholeTerm(hay, alt))
    ) || null
  );
}

export function searchAnatomyCatalog(
  rawQuery: string,
  categoryFilter: AnatomicalCategoryId | 'all' = 'all'
): AnatomicalStructureEntity[] {
  const pool = getStructuresByCategory(categoryFilter);
  const q = rawQuery.trim().toLowerCase();
  if (!q) return pool;

  const numMatch = q.match(/^#?(\d{1,2})$/);
  const exactNum = numMatch ? Number(numMatch[1]) : null;

  const scored: Array<{ item: AnatomicalStructureEntity; score: number }> = [];
  for (const item of pool) {
    let score = 0;
    if (exactNum !== null && item.catalogNumber === exactNum) score += 100;
    const nameL = item.name.toLowerCase();
    if (nameL === q) score += 90;
    else if (nameL.startsWith(q)) score += 60;
    else if (nameL.includes(q)) score += 40;

    if (item.scientificName?.toLowerCase().includes(q)) score += 30;
    if (item.alternateNames.some((a) => a.toLowerCase().includes(q))) score += 35;
    if (item.searchKeywords.some((k) => k.toLowerCase().includes(q))) score += 25;
    if (item.overview?.toLowerCase().includes(q)) score += 10;
    if (item.definition?.toLowerCase().includes(q)) score += 10;
    if (item.pharmaceuticalRelevance?.some((p) => p.toLowerCase().includes(q))) score += 10;

    if (score > 0) scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.item.catalogNumber - b.item.catalogNumber)
    .map((s) => s.item);
}

export function searchAcademicEngine(
  rawQuery: string,
  opts: { visuals?: VisualMediaItem[]; books?: BookRecord[] } = {}
): UnifiedEngineSearchResults {
  const q = rawQuery.trim().toLowerCase();
  const empty: UnifiedEngineSearchResults = {
    departments: [],
    topics: [],
    subtopics: [],
    structures: [],
    visuals: [],
    structurePins: [],
    equipment: [],
    experiments: [],
    books: []
  };

  if (!q) return empty;

  const visuals = opts.visuals || [];
  const books = opts.books || [];

  // 1. Departments
  for (const dept of Object.values(ENGINE_DEPARTMENTS)) {
    const hay = `${dept.code} ${dept.title} ${dept.shortLabel} ${dept.overview}`.toLowerCase();
    if (hay.includes(q)) {
      empty.departments.push({
        id: dept.id,
        kind: 'department',
        typeLabel: 'Department',
        title: dept.title,
        subtitle: `${dept.code} · ${dept.overview}`,
        payload: dept,
        score: dept.title.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q) ? 50 : 20
      });
    }
  }

  // 2. Topics
  for (const topic of Object.values(ENGINE_TOPICS)) {
    const hay = `${topic.title} ${topic.unitLabel} ${topic.summary}`.toLowerCase();
    if (hay.includes(q)) {
      const dept = ENGINE_DEPARTMENTS[topic.departmentId];
      empty.topics.push({
        id: topic.id,
        kind: 'topic',
        typeLabel: 'Topic',
        title: topic.title,
        subtitle: `${dept?.shortLabel || 'Curriculum'} · ${topic.unitLabel}`,
        payload: topic,
        score: topic.title.toLowerCase().includes(q) ? 55 : 25
      });
    }
  }

  // 3. Subtopics
  for (const sub of Object.values(ENGINE_SUBTOPICS)) {
    const hay = `${sub.title} ${sub.summary} ${sub.anatomyNotes || ''} ${sub.physiologyNotes || ''}`.toLowerCase();
    if (hay.includes(q)) {
      const topic = ENGINE_TOPICS[sub.topicId];
      empty.subtopics.push({
        id: sub.id,
        kind: 'subtopic',
        typeLabel: 'Subtopic',
        title: sub.title,
        subtitle: `${topic?.title || 'Body Systems'} · ${sub.summary}`,
        payload: sub,
        score: sub.title.toLowerCase().includes(q) ? 60 : 30
      });
    }
  }

  // 4. Anatomical Structures (60 Catalog)
  const structureMatches = searchAnatomyCatalog(q, 'all').slice(0, 8);
  empty.structures = structureMatches.map((s, idx) => ({
    id: s.id,
    kind: 'structure',
    typeLabel: 'Anatomical Structure',
    title: `#${s.catalogNumber} ${s.name}`,
    subtitle: `${getCategoryLabel(s.primaryCategory)}${s.scientificName ? ` · ${s.scientificName}` : ''}`,
    payload: s,
    score: 100 - idx
  }));

  // 5. Visuals & Visual Pins
  for (const visual of visuals) {
    const ctx = resolveAcademicContextForVisual(visual);
    const visualHay = [
      visual.title,
      visual.caption,
      visual.description,
      ...visual.topics,
      ...visual.tags,
      ...(ctx.subject?.searchKeywords || [])
    ]
      .join(' ')
      .toLowerCase();

    if (visualHay.includes(q)) {
      empty.visuals.push({
        id: visual.id,
        kind: 'visual',
        typeLabel: 'Scientific Visual',
        title: visual.title,
        subtitle: `${visual.sourceName} · ${ctx.annotations.length} interactive pins`,
        payload: visual,
        score: visual.title.toLowerCase().includes(q) ? 70 : 35
      });
    }

    for (const annotation of ctx.annotations) {
      const pinHay = `${annotation.label} ${annotation.definition} ${annotation.functionRole}`.toLowerCase();
      if (pinHay.includes(q)) {
        empty.structurePins.push({
          id: `${visual.id}:${annotation.id}`,
          kind: 'structure_pin',
          typeLabel: 'Visual Pin',
          title: annotation.label,
          subtitle: `${visual.title} · ${annotation.functionRole}`,
          payload: { visual, annotation },
          score: annotation.label.toLowerCase().includes(q) ? 65 : 30
        });
      }
    }
  }

  // 6. Equipment & Experiments across workspaces
  for (const ws of Object.values(DEPARTMENT_WORKSPACES)) {
    for (const eq of ws.equipment) {
      const hay = `${eq.name} ${eq.purpose}`.toLowerCase();
      if (hay.includes(q)) {
        empty.equipment.push({
          id: eq.id,
          kind: 'equipment',
          typeLabel: 'Equipment',
          title: eq.name,
          subtitle: `${ws.shortLabel} · ${eq.purpose}`,
          payload: { ...eq, departmentTitle: ws.shortLabel },
          score: eq.name.toLowerCase().includes(q) ? 55 : 25
        });
      }
    }

    for (const exp of ws.experiments) {
      const hay = `${exp.code} ${exp.title} ${ws.shortLabel}`.toLowerCase();
      if (hay.includes(q)) {
        empty.experiments.push({
          id: exp.id,
          kind: 'experiment',
          typeLabel: 'Experiment',
          title: `${exp.code} · ${exp.title}`,
          subtitle: `${ws.code} ${ws.shortLabel}`,
          payload: { ...exp, moduleId: ws.id, departmentTitle: ws.shortLabel },
          score: exp.title.toLowerCase().includes(q) ? 50 : 25
        });
      }
    }
  }

  // 7. PDF Textbooks
  for (const book of books) {
    const hay = `${book.title} ${book.fileName}`.toLowerCase();
    if (hay.includes(q)) {
      empty.books.push({
        id: book.id,
        kind: 'book',
        typeLabel: 'PDF Textbook',
        title: book.title,
        subtitle: `Page ${book.lastReadPage || 1} of ${book.pageCount} · IndexedDB`,
        payload: book,
        score: 50
      });
    }
  }

  empty.visuals = empty.visuals.slice(0, 6);
  empty.structurePins = empty.structurePins.slice(0, 6);
  empty.equipment = empty.equipment.slice(0, 4);
  empty.experiments = empty.experiments.slice(0, 5);
  empty.books = empty.books.slice(0, 4);

  return empty;
}

// ============================================================================
// LOCAL STORAGE PERSISTENCE HELPERS (Recent Structures, Practice, PDF Links)
// ============================================================================

export function getRecentStructures(): RecentStructureEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_STRUCTURES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.structureId === 'string' && STRUCTURE_BY_ID.has(e.structureId));
  } catch {
    return [];
  }
}

export function recordRecentStructure(structureId: string): RecentStructureEntry[] {
  if (!STRUCTURE_BY_ID.has(structureId)) return getRecentStructures();
  const prev = getRecentStructures().filter((e) => e.structureId !== structureId);
  const next = [{ structureId, timestamp: Date.now() }, ...prev].slice(0, 8);
  try {
    localStorage.setItem(RECENT_STRUCTURES_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

const DEFAULT_PRACTICE_STATS: AnatomyPracticeStats = {
  totalAttempts: 0,
  totalCorrect: 0,
  byCategory: {},
  recentMissedIds: [],
  lastPracticedAt: null
};

export function getAnatomyPracticeStats(): AnatomyPracticeStats {
  try {
    const raw = localStorage.getItem(PRACTICE_STATS_KEY);
    if (!raw) return DEFAULT_PRACTICE_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PRACTICE_STATS,
      ...parsed,
      byCategory: parsed?.byCategory || {},
      recentMissedIds: Array.isArray(parsed?.recentMissedIds) ? parsed.recentMissedIds : []
    };
  } catch {
    return DEFAULT_PRACTICE_STATS;
  }
}

export function recordAnatomyPracticeAttempt(
  categoryKey: string,
  correct: boolean,
  missedItemId?: string
): AnatomyPracticeStats {
  const prev = getAnatomyPracticeStats();
  const catPrev = prev.byCategory[categoryKey] || { attempts: 0, correct: 0 };
  const nextMissed = correct
    ? prev.recentMissedIds.filter((id) => id !== missedItemId)
    : missedItemId
    ? [missedItemId, ...prev.recentMissedIds.filter((id) => id !== missedItemId)].slice(0, 12)
    : prev.recentMissedIds;

  const next: AnatomyPracticeStats = {
    totalAttempts: prev.totalAttempts + 1,
    totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
    byCategory: {
      ...prev.byCategory,
      [categoryKey]: {
        attempts: catPrev.attempts + 1,
        correct: catPrev.correct + (correct ? 1 : 0)
      }
    },
    recentMissedIds: nextMissed,
    lastPracticedAt: Date.now()
  };

  try {
    localStorage.setItem(PRACTICE_STATS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

export function resetAnatomyPracticeStats(): AnatomyPracticeStats {
  try {
    localStorage.removeItem(PRACTICE_STATS_KEY);
  } catch {
    // ignore
  }
  return DEFAULT_PRACTICE_STATS;
}

export function getLocalTopicPdfLinks(structureId?: string): LocalTopicPdfLink[] {
  try {
    const raw = localStorage.getItem(TOPIC_PDF_LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return structureId ? parsed.filter((l) => l.structureId === structureId) : parsed;
  } catch {
    return [];
  }
}

export function saveLocalTopicPdfLink(
  input: Omit<LocalTopicPdfLink, 'id' | 'createdAt'>
): LocalTopicPdfLink[] {
  const all = getLocalTopicPdfLinks();
  const entry: LocalTopicPdfLink = {
    ...input,
    id: `pdflink_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now()
  };
  const next = [entry, ...all.filter((l) => !(l.structureId === input.structureId && l.bookId === input.bookId && l.pageNumber === input.pageNumber))];
  try {
    localStorage.setItem(TOPIC_PDF_LINKS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next.filter((l) => l.structureId === input.structureId);
}

export function removeLocalTopicPdfLink(linkId: string, structureId: string): LocalTopicPdfLink[] {
  const next = getLocalTopicPdfLinks().filter((l) => l.id !== linkId);
  try {
    localStorage.setItem(TOPIC_PDF_LINKS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next.filter((l) => l.structureId === structureId);
}
