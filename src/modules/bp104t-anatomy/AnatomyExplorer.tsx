import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  LayoutGrid,
  List,
  Search,
  X
} from 'lucide-react';
import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import {
  ANATOMY_CATEGORIES,
  ENGINE_DEPARTMENTS,
  ENGINE_SUBTOPICS,
  ENGINE_TOPICS
} from '../../data/academicEngineRegistry';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { getAll3DAssets } from '../assets-3d/asset3dDb';
import { Asset3DItem } from '../assets-3d/types';
import {
  AnatomicalCategoryId,
  AnatomicalStructureEntity,
  AnatomyDiagramKey,
  RecentStructureEntry
} from '../../types/academicEngine';
import {
  getCategoryCountMap,
  getCategoryLabel,
  getRecentStructures,
  getStructureById,
  getSubjectsForDepartment,
  getTopicsForSubject,
  recordRecentStructure,
  searchAnatomyCatalog
} from '../../utils/academicEngineUtils';
import AnatomyStructureDetail from './AnatomyStructureDetail';

interface AnatomyExplorerProps {
  initialStructureId?: string | null;
  navNonce?: number;
  onClearInitialStructure?: () => void;
  onOpenDiagramSchematic?: (diagramKey: AnatomyDiagramKey) => void;
  onStartPracticeForCategory?: (categoryId: AnatomicalCategoryId) => void;
  onActiveStructureChange?: (structure: AnatomicalStructureEntity | null) => void;
}

export default function AnatomyExplorer({
  initialStructureId = null,
  navNonce = 0,
  onClearInitialStructure,
  onOpenDiagramSchematic,
  onStartPracticeForCategory,
  onActiveStructureChange
}: AnatomyExplorerProps) {
  const { recordActivity } = useLibraryNavigation();

  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(
    initialStructureId
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AnatomicalCategoryId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'catalog' | 'alpha'>('catalog');
  const [viewMode, setViewMode] = useState<'directory' | 'grid'>('directory');
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [recentEntries, setRecentEntries] = useState<RecentStructureEntry[]>(() =>
    getRecentStructures()
  );
  const [assets3d, setAssets3d] = useState<Asset3DItem[]>([]);

  useEffect(() => {
    getAll3DAssets()
      .then((list) => setAssets3d(list))
      .catch(() => {});
  }, []);

  const linked3dCountByStructure = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of assets3d) {
      const seen = new Set<string>();
      for (const l of a.syllabusLinks) {
        if (l.structureId && !seen.has(l.structureId)) {
          seen.add(l.structureId);
          map[l.structureId] = (map[l.structureId] || 0) + 1;
        }
      }
    }
    return map;
  }, [assets3d]);

  useEffect(() => {
    if (initialStructureId) {
      setSelectedStructureId(initialStructureId);
    }
  }, [initialStructureId, navNonce]);

  const activeStructure = useMemo(
    () => getStructureById(selectedStructureId),
    [selectedStructureId]
  );

  useEffect(() => {
    onActiveStructureChange?.(activeStructure);
    if (!activeStructure) return;
    setRecentEntries(recordRecentStructure(activeStructure.id));
    recordActivity({
      key: `structure:${activeStructure.id}`,
      kind: 'structure',
      title: `#${activeStructure.catalogNumber} ${activeStructure.name}`,
      subtitle: `${getCategoryLabel(activeStructure.primaryCategory)} · Anatomy Explorer`,
      moduleId: 'anatomy',
      tab: 'explorer',
      structureId: activeStructure.id
    });
  }, [activeStructure, onActiveStructureChange, recordActivity]);

  const categoryCounts = useMemo(() => getCategoryCountMap(), []);

  const filteredStructures = useMemo(() => {
    const matched = searchAnatomyCatalog(searchQuery, categoryFilter);
    const copy = [...matched];
    if (sortBy === 'alpha') {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else if (!searchQuery.trim()) {
      copy.sort((a, b) => a.catalogNumber - b.catalogNumber);
    }
    return copy;
  }, [searchQuery, categoryFilter, sortBy]);

  const anatomySubjects = useMemo(() => getSubjectsForDepartment('dept_anatomy'), []);

  const recentStructures = useMemo(
    () =>
      recentEntries
        .map((entry) => getStructureById(entry.structureId))
        .filter((s): s is AnatomicalStructureEntity => Boolean(s))
        .slice(0, 5),
    [recentEntries]
  );

  const handleOpenStructure = (id: string) => {
    setSelectedStructureId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (activeStructure) {
    return (
      <AnatomyStructureDetail
        structure={activeStructure}
        onBackToDirectory={() => {
          setSelectedStructureId(null);
          onClearInitialStructure?.();
        }}
        onSelectStructure={handleOpenStructure}
        onFilterByCategory={(catId) => {
          setCategoryFilter(catId);
          setSelectedStructureId(null);
          onClearInitialStructure?.();
        }}
        onOpenDiagramSchematic={onOpenDiagramSchematic}
        onStartPracticeForCategory={onStartPracticeForCategory}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Directory Header & Curriculum Hierarchy Toggle */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {ENGINE_DEPARTMENTS.dept_anatomy.code} · Academic Topic Engine
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Anatomical Catalog &amp; Structure Explorer ({ANATOMY_CATALOG.length} Structures)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Browse all 60 cataloged organs, regions, and tissues across 10 body systems—cross-tagged without duplicate records and linked to Visual Plates and PDF textbooks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowHierarchy((prev) => !prev)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 self-start md:self-auto whitespace-nowrap"
          >
            <span>Curriculum Hierarchy</span>
            {showHierarchy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Normalized Curriculum Tree (Department -> Subject -> Topic -> Subtopic) */}
        {showHierarchy && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            {anatomySubjects.map((subj) => {
              const topics = getTopicsForSubject(subj.id);
              return (
                <div key={subj.id} className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {subj.title}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {topics.length} {topics.length === 1 ? 'system topic' : 'system topics'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (topic.categoryId) setCategoryFilter(topic.categoryId);
                          }}
                          className="text-left w-full group"
                        >
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {topic.unitLabel}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {topic.title}
                          </p>
                        </button>
                        {topic.subtopicIds.length > 0 && (
                          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-1">
                            {topic.subtopicIds.map((subId) => {
                              const sub = ENGINE_SUBTOPICS[subId];
                              if (!sub) return null;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => {
                                    if (sub.structureId) handleOpenStructure(sub.structureId);
                                  }}
                                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 block text-left truncate w-full"
                                >
                                  ↳ {sub.title}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search, Sort & View Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organs, tissues, alternate names, #number (e.g. 'Kidney', 'Ren', 'Nephron', '#32')..."
              className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Clear directory search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'catalog' | 'alpha')}
              aria-label="Sort anatomical catalog"
              className="min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="catalog">Sort: Catalog #1–60</option>
              <option value="alpha">Sort: Alphabetical A–Z</option>
            </select>

            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('directory')}
                aria-label="Directory list view"
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'directory'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Compact grid view"
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs (All + 10 Anatomical Systems) */}
        <div
          role="tablist"
          aria-label="Anatomical system categories"
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors tabular-nums ${
              categoryFilter === 'all'
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
            }`}
          >
            All Systems ({categoryCounts.all})
          </button>

          {ANATOMY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={categoryFilter === cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors tabular-nums ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
              }`}
            >
              {cat.shortLabel} ({categoryCounts[cat.id] || 0})
            </button>
          ))}
        </div>
      </section>

      {/* Recently Explored Structures (shown only when real local history exists) */}
      {recentStructures.length > 0 && !searchQuery.trim() && categoryFilter === 'all' && (
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Recently Explored Structures</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentStructures.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleOpenStructure(s.id)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-2 transition-colors"
              >
                <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                  #{s.catalogNumber}
                </span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Results Summary Line */}
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 tabular-nums">
          Showing <strong className="text-slate-900 dark:text-white">{filteredStructures.length}</strong>{' '}
          {filteredStructures.length === 1 ? 'structure' : 'structures'}
          {categoryFilter !== 'all' ? ` in ${getCategoryLabel(categoryFilter)}` : ''}
          {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
        </p>
        {(categoryFilter !== 'all' || searchQuery.trim()) && (
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Directory List or Compact Grid */}
      {filteredStructures.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No anatomical structures matched "{searchQuery}".
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try searching by organ name, Latin scientific term, or catalog number (#1–#60).
          </p>
        </div>
      ) : viewMode === 'directory' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
          {filteredStructures.map((item) => {
            const hasVisual = item.visualIds.length > 0 || Boolean(item.anatomyDiagramKey);
            const count3d = linked3dCountByStructure[item.id] || 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenStructure(item.id)}
                className="w-full px-4 sm:px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-4 transition-colors group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums w-8 shrink-0 pt-0.5">
                    #{String(item.catalogNumber).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {item.name}
                      </span>
                      {item.scientificName && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                          {item.scientificName}
                        </span>
                      )}
                    </div>
                    {item.overview && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                        {item.overview}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {item.categories.map((c) => getCategoryLabel(c)).join(' · ')}
                      {hasVisual ? ' · Diagram / Plate linked' : ''}
                      {count3d > 0 ? ` · ${count3d} 3D model${count3d === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStructures.map((item) => {
            const count3d = linked3dCountByStructure[item.id] || 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenStructure(item.id)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left flex flex-col justify-between space-y-3 transition-colors group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      #{String(item.catalogNumber).padStart(2, '0')}
                    </span>
                    <span className="truncate">{getCategoryLabel(item.primaryCategory)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {item.name}
                  </h3>
                  {item.overview && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.overview}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate">
                    {count3d > 0
                      ? `${count3d} 3D linked`
                      : item.categories.length > 1
                      ? `+${item.categories.length - 1} cross-system`
                      : 'View details'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
