import React, { useEffect, useState } from 'react';
import {
  Check,
  HardDrive,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Trash2,
  X
} from 'lucide-react';
import { getAllBooks, getStorageSummary } from '../modules/knowledge-library/libraryDb';
import { getAllVisuals } from '../modules/visual-library/visualDb';
import {
  DEFAULT_TEXT_SIZE,
  MAX_TEXT_SIZE,
  MIN_TEXT_SIZE,
  StudyPreferences,
  stepTextSize
} from '../utils/studyWorkspace';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  preferences: StudyPreferences;
  onUpdatePreferences: (next: StudyPreferences) => void;
  recentCount: number;
  exploredCount: number;
  onClearRecent: () => void;
  onResetExplored: () => void;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'Unavailable';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  preferences,
  onUpdatePreferences,
  recentCount,
  exploredCount,
  onClearRecent,
  onResetExplored
}: SettingsModalProps) {
  const [bookCount, setBookCount] = useState<number>(0);
  const [visualCount, setVisualCount] = useState<number>(0);
  const [usageBytes, setUsageBytes] = useState<number | null>(null);
  const [confirmResetHistory, setConfirmResetHistory] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmResetHistory(false);
      return;
    }

    let cancelled = false;
    Promise.all([getAllBooks(), getAllVisuals(), getStorageSummary()])
      .then(([books, visuals, storage]) => {
        if (cancelled) return;
        setBookCount(books.length);
        setVisualCount(visuals.length);
        setUsageBytes(storage.usageBytes);
      })
      .catch(() => {
        // ignore storage inspection error
      });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Workspace settings"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Workspace Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto text-sm">
          {/* Appearance */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Appearance &amp; Reading
            </h3>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Color Theme</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between clean daylight and dark laboratory surfaces.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2 shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-emerald-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Text Size</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Increase or decrease text scale across the workspace ({Math.round((16 * preferences.textSize) / 10) / 10}px base).
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      textSize: stepTextSize(preferences.textSize, -1)
                    })
                  }
                  disabled={preferences.textSize <= MIN_TEXT_SIZE}
                  className="w-9 h-8 rounded-lg inline-flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                  aria-label="Decrease text size"
                  title="Decrease text size"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      textSize: DEFAULT_TEXT_SIZE
                    })
                  }
                  className="min-w-[52px] h-8 px-2 rounded-lg text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={`Reset text size to ${DEFAULT_TEXT_SIZE}%`}
                >
                  {preferences.textSize}%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      textSize: stepTextSize(preferences.textSize, 1)
                    })
                  }
                  disabled={preferences.textSize >= MAX_TEXT_SIZE}
                  className="w-9 h-8 rounded-lg inline-flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                  aria-label="Increase text size"
                  title="Increase text size"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Layout Density</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust spacing across workbenches and study panels.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                {(['comfortable', 'compact'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdatePreferences({ ...preferences, density: mode })}
                    className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      preferences.density === mode
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Default PDF Fit</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Initial page sizing when opening books in Knowledge Library.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                {[
                  { id: 'width' as const, label: 'Fit Width' },
                  { id: 'page' as const, label: 'Fit Page' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onUpdatePreferences({ ...preferences, defaultPdfFit: opt.id })
                    }
                    className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      preferences.defaultPdfFit === opt.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onUpdatePreferences({
                  ...preferences,
                  reducedMotion: !preferences.reducedMotion
                })
              }
              className="w-full flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Reduced Motion</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimize interface transitions and smooth scrolling animations.
                </p>
              </div>
              <span
                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                  preferences.reducedMotion
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                }`}
              >
                {preferences.reducedMotion && <Check className="w-3.5 h-3.5" />}
              </span>
            </button>
          </section>

          {/* Local Browser Data */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Browser-Local Study Storage
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 tabular-nums">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  IndexedDB Storage Used
                </span>
                <span className="font-semibold">{formatBytes(usageBytes)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 tabular-nums">
                <span>Saved PDF Textbooks</span>
                <span>{bookCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 tabular-nums">
                <span>Scientific Visual Plates</span>
                <span>{visualCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 tabular-nums">
                <span>Recent Activity · Explored Labs</span>
                <span>
                  {recentCount} items · {exploredCount} labs
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClearRecent}
                disabled={recentCount === 0}
                className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Recent Activity</span>
              </button>

              {!confirmResetHistory ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetHistory(true)}
                  disabled={exploredCount === 0}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Explored Labs</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onResetExplored();
                    setConfirmResetHistory(false);
                  }}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white inline-flex items-center gap-1.5"
                >
                  <span>Confirm Reset ({exploredCount})</span>
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
