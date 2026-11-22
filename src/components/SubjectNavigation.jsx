import React from 'react';
import {
  X,
  LayoutGrid,
  Code,
  Database,
  FlaskConical,
  MessageSquareHeart,
  Activity,
  Microscope,
  TestTube,
  BookOpen,
  Check,
  Library,
  Images,
  SlidersHorizontal,
  Clock,
  Wrench
} from 'lucide-react';

export const SUBJECT_NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview & Hub', group: 'Workspace', icon: LayoutGrid, code: 'Workspace' },
  { id: 'knowledge_library', label: 'Knowledge Library', group: 'Workspace', icon: Library, code: 'PDF Library' },
  { id: 'visual_library', label: 'Visual Library', group: 'Workspace', icon: Images, code: 'Scientific Atlas' },
  { id: 'general_pharmacy', label: 'Pharmaceutics', group: 'Departments', icon: FlaskConical, code: 'BP102T / BP107P' },
  { id: 'anatomy', label: 'Anatomy & Physiology', group: 'Departments', icon: Activity, code: 'BP104T / BP109P' },
  { id: 'pharmacognosy', label: 'Pharmacognosy', group: 'Departments', icon: Microscope, code: 'BP105T / BP110P' },
  { id: 'inorganic', label: 'Inorganic Chemistry', group: 'Departments', icon: TestTube, code: 'BP106T / BP111P' },
  { id: 'psychology', label: 'Psychology & Comm.', group: 'Departments', icon: MessageSquareHeart, code: 'BP103T / BP108P' },
  { id: 'python', label: 'Python Fundamentals', group: 'Data Science', icon: Code, code: 'BP101T' },
  { id: 'pandas', label: 'Pandas & PK Plots', group: 'Data Science', icon: Database, code: 'BP101T Unit IV–V' }
];

const NAV_GROUPS = ['Departments', 'Data Science'];

export default function SubjectNavigation({
  activeModule,
  isEquipmentViewActive = false,
  onSelectModule,
  onOpenEquipment,
  onOpenRecent,
  recentActivity = [],
  visitedModules = [],
  onOpenGlossary,
  onOpenSettings,
  onCloseMobile
}) {
  const labItems = SUBJECT_NAV_ITEMS.filter((item) => NAV_GROUPS.includes(item.group));
  const totalSubjects = labItems.length;
  const exploredCount = visitedModules.filter((id) =>
    labItems.some((item) => item.id === id)
  ).length;
  const progressPct = Math.min(100, Math.round((exploredCount / totalSubjects) * 100));

  const visibleRecent = recentActivity.slice(0, 3);

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectModule('dashboard')}
            className="text-left focus:outline-none group min-w-0"
          >
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block truncate">
              PharmLab Studio
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
              B.Pharm Semester I
            </span>
          </button>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1 text-sm font-medium" aria-label="Primary workspace and subjects">
          <button
            type="button"
            onClick={() => onSelectModule('dashboard')}
            aria-current={activeModule === 'dashboard' ? 'page' : undefined}
            className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeModule === 'dashboard'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="truncate">Overview &amp; Hub</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectModule('knowledge_library')}
            aria-current={activeModule === 'knowledge_library' ? 'page' : undefined}
            className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeModule === 'knowledge_library'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Library className="w-4 h-4 shrink-0" />
              <span className="truncate">PDF Knowledge Library</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectModule('visual_library')}
            aria-current={activeModule === 'visual_library' && !isEquipmentViewActive ? 'page' : undefined}
            className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeModule === 'visual_library' && !isEquipmentViewActive
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Images className="w-4 h-4 shrink-0" />
              <span className="truncate">Visual Library</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenEquipment}
            aria-current={isEquipmentViewActive ? 'page' : undefined}
            className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
              isEquipmentViewActive
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Wrench className="w-4 h-4 shrink-0" />
              <span className="truncate">Equipment &amp; Apparatus</span>
            </span>
          </button>

          {NAV_GROUPS.map((groupName) => (
            <div key={groupName} className="pt-3.5 space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 pb-1">
                {groupName}
              </div>
              {SUBJECT_NAV_ITEMS.filter((item) => item.group === groupName).map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                const isVisited = visitedModules.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectModule(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-colors text-left ${
                      isActive
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 truncate">
                          {item.code}
                        </span>
                      </span>
                    </span>
                    {isVisited && !isActive && (
                      <Check
                        className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-label="Explored"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {visibleRecent.length > 0 && (
            <div className="pt-3.5 space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 pb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Recently Accessed</span>
              </div>
              {visibleRecent.map((recent) => (
                <button
                  key={recent.key}
                  type="button"
                  onClick={() => onOpenRecent && onOpenRecent(recent)}
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-xl text-left text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="block font-medium text-slate-800 dark:text-slate-200 truncate">
                    {recent.title}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                    {recent.subtitle}
                  </span>
                </button>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="pt-4 mt-5 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between tabular-nums">
            <span>Workspaces Explored</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {exploredCount} / {totalSubjects}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenGlossary}
            className="min-h-[40px] px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Glossary</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[40px] px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
