import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={!isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="hidden lg:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="hidden lg:inline">Dark</span>
        </>
      )}
    </button>
  );
}
