import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Images, Microscope } from 'lucide-react';
import { useLibraryNavigation } from '../context/LibraryNavigationContext';
import { DepartmentWorkspaceMeta } from '../types/academicArchitecture';

interface DepartmentHeaderProps {
  meta: DepartmentWorkspaceMeta;
  icon: React.ComponentType<{ className?: string }>;
  accentColorClass?: string;
  activeTabLabel?: string;
}

export function DepartmentHeader({
  meta,
  icon: Icon,
  accentColorClass = 'text-emerald-600 dark:text-emerald-400',
  activeTabLabel
}: DepartmentHeaderProps) {
  const { openVisualLibrary, openKnowledgeLibrary } = useLibraryNavigation();

  return (
    <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-none space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 mt-0.5">
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${accentColorClass}`} />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className={accentColorClass}>{meta.code}</span>
              <span aria-hidden="true"> · </span>
              <span>{meta.practicalCountLabel}</span>
              {activeTabLabel ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="text-slate-700 dark:text-slate-200">{activeTabLabel}</span>
                </>
              ) : null}
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
              {meta.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {meta.overview}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openVisualLibrary({ department: meta.visualDepartmentId })}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Images className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Subject Visuals</span>
          </button>

          {meta.equipment.length > 0 && (
            <button
              type="button"
              onClick={() => openVisualLibrary({ category: 'equipment' })}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Microscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Apparatus ({meta.equipment.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openKnowledgeLibrary()}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Textbooks</span>
          </button>
        </div>
      </div>
    </header>
  );
}

interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface WorkspaceTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
}

export function WorkspaceTabBar({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Department workspace sections'
}: WorkspaceTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 border-b border-slate-200 dark:border-slate-800/90"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-t-xl sm:rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 border ${
              isActive
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface CollapsibleTheorySectionProps {
  id?: string;
  unitLabel?: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleTheorySection({
  id,
  unitLabel,
  title,
  subtitle,
  defaultOpen = true,
  children
}: CollapsibleTheorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={id}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full min-h-[52px] px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="min-w-0 space-y-0.5">
          {unitLabel && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {unitLabel}
            </p>
          )}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {open ? (
          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-800 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 max-w-none space-y-4">
          {children}
        </div>
      )}
    </section>
  );
}

export function ResponsiveTableWrapper({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 ${className}`}
    >
      {children}
    </div>
  );
}
