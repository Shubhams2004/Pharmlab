import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={onToggle}
      aria-label={isDark ? 'Dark mode enabled. Switch to light mode' : 'Light mode enabled. Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group inline-flex items-center gap-2.5 h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
          isDark
            ? 'bg-slate-800 border-slate-700'
            : 'bg-slate-200 border-slate-300'
        }`}
      >
        <Sun
          className={`absolute left-1.5 w-3 h-3 transition-opacity duration-200 ${
            isDark ? 'opacity-40 text-slate-400' : 'opacity-0'
          }`}
        />
        <Moon
          className={`absolute right-1.5 w-3 h-3 transition-opacity duration-200 ${
            isDark ? 'opacity-0' : 'opacity-40 text-slate-500'
          }`}
        />
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-emerald-500 shadow-sm transition-transform duration-200 ${
            isDark ? 'translate-x-5' : 'translate-x-1'
          }`}
        >
          {isDark ? (
            <Moon className="w-2.5 h-2.5 text-slate-950" />
          ) : (
            <Sun className="w-2.5 h-2.5 text-amber-500" />
          )}
        </span>
      </span>

      <span className="hidden lg:inline font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
