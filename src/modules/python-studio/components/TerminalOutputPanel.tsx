import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChevronDown,
  Download,
  History,
  Maximize2,
  Minimize2,
  Package,
  RefreshCw,
  RotateCcw,
  Terminal,
  Trash2,
  XCircle
} from 'lucide-react';
import { RuntimeSnapshot } from '../pyodideRuntime';
import {
  DiagnosticMarker,
  ExecutionRecord,
  OutputArtifact,
  PackageId,
  TerminalEntry,
  WorkspaceVariableInfo
} from '../types';

export type BottomWorkbenchTab = 'output' | 'terminal' | 'packages' | 'variables';

interface TerminalOutputPanelProps {
  activeTab: BottomWorkbenchTab;
  onChangeTab: (tab: BottomWorkbenchTab) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCollapse: () => void;
  runtime: RuntimeSnapshot;
  terminalEntries: TerminalEntry[];
  executionHistory: ExecutionRecord[];
  selectedExecutionId: string | null;
  onSelectExecution: (id: string) => void;
  onClearOutput: () => void;
  onClearTerminal: () => void;
  onRunReplCommand: (cmd: string) => Promise<void>;
  onResetGlobals: () => Promise<void>;
  onInitRuntime: () => Promise<void>;
  onLoadPackage: (pkg: PackageId) => Promise<void>;
  onJumpToLine: (filePath: string, line: number) => void;
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function downloadTableCsv(columns: string[], rows: (string | number | boolean | null)[][], title: string) {
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'table'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ArtifactRenderer({
  artifact,
  onJumpToLine
}: {
  artifact: OutputArtifact;
  onJumpToLine: (filePath: string, line: number) => void;
}) {
  const [showRawTb, setShowRawTb] = useState(false);

  if (artifact.kind === 'text') {
    const colorClass =
      artifact.stream === 'stderr'
        ? 'text-rose-300 bg-rose-950/30 border-rose-500/30'
        : artifact.stream === 'system'
        ? 'text-sky-300 bg-sky-950/30 border-sky-500/30'
        : 'text-emerald-200 bg-slate-950 border-slate-800';
    return (
      <pre
        className={`rounded-lg border px-3 py-2.5 text-xs font-code whitespace-pre-wrap break-words leading-relaxed ${colorClass}`}
      >
        {artifact.text}
      </pre>
    );
  }

  if (artifact.kind === 'image') {
    return (
      <figure className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <figcaption className="text-xs font-semibold text-slate-200 truncate">
            {artifact.caption || 'Matplotlib Figure'}
          </figcaption>
          <button
            type="button"
            onClick={() =>
              downloadDataUrl(
                artifact.dataUrl,
                `${(artifact.caption || 'figure').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200 inline-flex items-center gap-1 shrink-0"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>PNG</span>
          </button>
        </div>
        <div className="rounded-lg overflow-hidden bg-white p-2 flex justify-center">
          <img
            src={artifact.dataUrl}
            alt={artifact.caption || 'Generated Matplotlib chart'}
            className="max-w-full max-h-[420px] object-contain"
          />
        </div>
      </figure>
    );
  }

  if (artifact.kind === 'table') {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/70">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {artifact.title || 'DataFrame Table'}
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {artifact.shape[0]} rows × {artifact.shape[1]} cols
              {artifact.truncated ? ' (showing first 120)' : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadTableCsv(artifact.columns, artifact.rows, artifact.title || 'dataframe')
            }
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 inline-flex items-center gap-1 shrink-0"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs font-code tabular-nums">
            <thead className="bg-slate-900 text-slate-300 sticky top-0 border-b border-slate-800">
              <tr>
                {artifact.columns.map((col, idx) => (
                  <th key={`${col}_${idx}`} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {artifact.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/60">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3 py-1.5 text-slate-200 whitespace-nowrap"
                    >
                      {cell === null ? (
                        <span className="text-slate-500 italic">NaN</span>
                      ) : typeof cell === 'number' ? (
                        Number.isInteger(cell) ? cell : Number(cell.toFixed(6)).toString()
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // traceback
  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-rose-300">
              {artifact.errorType}: {artifact.message}
            </p>
            {artifact.primaryFile && artifact.primaryLine && (
              <button
                type="button"
                onClick={() =>
                  onJumpToLine(
                    artifact.primaryFile!.replace(/^\/workspace\//, ''),
                    artifact.primaryLine!
                  )
                }
                className="text-[11px] text-amber-300 hover:underline font-code mt-0.5"
              >
                Jump to {artifact.primaryFile.replace(/^\/workspace\//, '')}:{artifact.primaryLine}
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowRawTb((v) => !v)}
          className="text-[11px] text-slate-300 hover:text-white underline shrink-0"
        >
          {showRawTb ? 'Hide raw' : 'Raw traceback'}
        </button>
      </div>

      {artifact.frames.length > 0 && !showRawTb && (
        <div className="space-y-1 border-t border-rose-500/20 pt-2">
          {artifact.frames.map((fr, idx) => {
            const cleanFile = fr.filename.replace(/^\/workspace\//, '');
            const isWorkspace = fr.filename.startsWith('/workspace/');
            return (
              <div key={idx} className="text-[11px] font-code text-rose-200/90 flex flex-wrap items-center gap-1.5">
                {isWorkspace ? (
                  <button
                    type="button"
                    onClick={() => onJumpToLine(cleanFile, fr.line)}
                    className="text-amber-300 hover:underline"
                  >
                    {cleanFile}:{fr.line}
                  </button>
                ) : (
                  <span className="text-slate-400">
                    {cleanFile}:{fr.line}
                  </span>
                )}
                <span className="text-slate-400">in {fr.functionName}</span>
                {fr.codeLine && <code className="text-rose-100 bg-rose-950/60 px-1 rounded">{fr.codeLine}</code>}
              </div>
            );
          })}
        </div>
      )}

      {showRawTb && (
        <pre className="text-[11px] font-code text-rose-200 whitespace-pre-wrap overflow-x-auto bg-slate-950/80 p-2.5 rounded-lg border border-rose-500/20">
          {artifact.rawText}
        </pre>
      )}
    </div>
  );
}

export default function TerminalOutputPanel({
  activeTab,
  onChangeTab,
  isExpanded,
  onToggleExpand,
  onCollapse,
  runtime,
  terminalEntries,
  executionHistory,
  selectedExecutionId,
  onSelectExecution,
  onClearOutput,
  onClearTerminal,
  onRunReplCommand,
  onResetGlobals,
  onInitRuntime,
  onLoadPackage,
  onJumpToLine
}: TerminalOutputPanelProps) {
  const [replInput, setReplInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [terminalEntries, activeTab]);

  const activeExecution =
    executionHistory.find((e) => e.id === selectedExecutionId) || executionHistory[0] || null;

  const submitRepl = async () => {
    const cmd = replInput.trim();
    if (!cmd) return;
    setCmdHistory((prev) => [cmd, ...prev.slice(0, 49)]);
    setHistoryCursor(-1);
    setReplInput('');
    await onRunReplCommand(cmd);
  };

  const handleReplKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitRepl();
    } else if (e.key === 'ArrowUp' && !replInput.includes('\n')) {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = Math.min(cmdHistory.length - 1, historyCursor + 1);
        setHistoryCursor(nextIdx);
        setReplInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown' && !replInput.includes('\n')) {
      e.preventDefault();
      if (historyCursor <= 0) {
        setHistoryCursor(-1);
        setReplInput('');
      } else {
        const nextIdx = historyCursor - 1;
        setHistoryCursor(nextIdx);
        setReplInput(cmdHistory[nextIdx]);
      }
    }
  };

  const loadedCount = runtime.packages.filter((p) => p.status === 'loaded').length;
  const problemsCount = runtime.diagnostics.length;

  return (
    <section className="h-full flex flex-col bg-slate-900 border-t border-slate-800 min-h-0">
      {/* Workbench Tab Header */}
      <div className="px-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1">
          {[
            {
              id: 'output' as const,
              label: 'Output & Plots',
              count: activeExecution?.artifacts.length || 0
            },
            {
              id: 'terminal' as const,
              label: 'Terminal (REPL)',
              count: null
            },
            {
              id: 'packages' as const,
              label: `Packages (${loadedCount}/${runtime.packages.length})`,
              count: null
            },
            {
              id: 'variables' as const,
              label: `Variables (${runtime.variables.length})${problemsCount > 0 ? ` · ${problemsCount} Err` : ''}`,
              count: null
            }
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeTab === 'output' && executionHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearOutput}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Clear output history"
              aria-label="Clear output history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {activeTab === 'terminal' && (
            <>
              <button
                type="button"
                onClick={onResetGlobals}
                className="px-2 py-1 rounded hover:bg-slate-800 text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
                title="Clear Python __main__ globals"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Session</span>
              </button>
              <button
                type="button"
                onClick={onClearTerminal}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Clear terminal log"
                aria-label="Clear terminal log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title={isExpanded ? 'Restore panel height' : 'Maximize workbench'}
            aria-label={isExpanded ? 'Restore panel height' : 'Maximize workbench'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onCollapse}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Hide panel"
            aria-label="Hide panel"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {activeTab === 'output' && (
          <div className="space-y-3">
            {executionHistory.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                  <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {executionHistory.slice(0, 8).map((rec, idx) => {
                    const isSelected = activeExecution?.id === rec.id;
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => onSelectExecution(rec.id)}
                        className={`px-2 py-1 rounded-md text-[11px] font-code border transition-colors whitespace-nowrap tabular-nums ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        #{executionHistory.length - idx} · {rec.filePath || rec.mode} ({rec.durationMs}ms)
                      </button>
                    );
                  })}
                </div>
                {activeExecution && (
                  <span
                    className={`text-[11px] font-medium tabular-nums ${
                      activeExecution.status === 'success'
                        ? 'text-emerald-400'
                        : activeExecution.status === 'interrupted'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {activeExecution.status.toUpperCase()} · {activeExecution.durationMs} ms
                  </span>
                )}
              </div>
            )}

            {activeExecution ? (
              activeExecution.artifacts.length > 0 ? (
                <div className="space-y-3">
                  {activeExecution.artifacts.map((art) => (
                    <ArtifactRenderer
                      key={art.id}
                      artifact={art}
                      onJumpToLine={onJumpToLine}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Execution completed in {activeExecution.durationMs} ms with no printed output or figures.
                </div>
              )
            ) : (
              <div className="py-10 text-center space-y-2 text-slate-400">
                <p className="text-xs font-medium text-slate-300">
                  No script runs yet in this project
                </p>
                <p className="text-xs text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-code">Ctrl+Enter</kbd> or click Run to execute your Python script and view stdout, DataFrames, and Matplotlib plots.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col justify-between gap-2 min-h-[160px]">
            <div className="flex-1 overflow-y-auto space-y-1.5 font-code text-xs pr-1">
              {terminalEntries.map((entry) => {
                const cls =
                  entry.kind === 'input'
                    ? 'text-sky-300 font-medium'
                    : entry.kind === 'stderr' || entry.kind === 'error'
                    ? 'text-rose-300'
                    : entry.kind === 'system'
                    ? 'text-slate-400'
                    : entry.kind === 'result'
                    ? 'text-amber-300'
                    : 'text-emerald-200';
                return (
                  <pre key={entry.id} className={`whitespace-pre-wrap break-words leading-relaxed ${cls}`}>
                    {entry.text}
                  </pre>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-slate-800 shrink-0">
              <span className="font-code text-xs text-emerald-400 pt-1.5 select-none">&gt;&gt;&gt;</span>
              <textarea
                rows={1}
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                onKeyDown={handleReplKeyDown}
                placeholder="Evaluate Python expression or statement in persistent session (Enter to run, Shift+Enter newline)..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs font-code text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
              />
              <button
                type="button"
                disabled={!replInput.trim() || runtime.status === 'executing'}
                onClick={submitRepl}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-white shrink-0 inline-flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Eval</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">
                  Python {runtime.pythonVersion} · Pyodide v{runtime.pyodideVersion} (WebAssembly Worker)
                </p>
                <p className="text-[11px] text-slate-400">
                  {runtime.supportsSoftInterrupt
                    ? 'Cross-origin isolated: soft SIGINT interrupt preserves variables.'
                    : 'Standard browser/GitHub Pages mode: Stop restarts the Web Worker cleanly to abort loops.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {runtime.status === 'idle' || runtime.status === 'error' ? (
                  <button
                    type="button"
                    onClick={onInitRuntime}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                  >
                    Initialize Python
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onResetGlobals}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    Clear Globals
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {runtime.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{pkg.label}</span>
                        <span className="text-[11px] font-normal text-slate-400 font-code">
                          {pkg.version}
                        </span>
                      </span>
                      {pkg.status === 'loaded' && (
                        <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Loaded
                        </span>
                      )}
                      {pkg.status === 'loading' && (
                        <span className="text-[11px] text-sky-400 inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Loading
                        </span>
                      )}
                      {pkg.status === 'error' && (
                        <span className="text-[11px] text-rose-400">Failed</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {pkg.description}
                    </p>
                    {pkg.error && (
                      <p className="text-[11px] text-rose-400 break-words">{pkg.error}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={pkg.status === 'loaded' || pkg.status === 'loading'}
                    onClick={() => onLoadPackage(pkg.id)}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      pkg.status === 'loaded'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200'
                    }`}
                  >
                    {pkg.status === 'loaded'
                      ? 'Ready in Session'
                      : pkg.status === 'loading'
                      ? 'Downloading Wheel...'
                      : `Load ${pkg.label}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Active Variables */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                  <span>Session Globals ({runtime.variables.length})</span>
                </span>
              </div>
              {runtime.variables.length > 0 ? (
                <div className="divide-y divide-slate-800/70 max-h-56 overflow-y-auto">
                  {runtime.variables.map((v: WorkspaceVariableInfo) => (
                    <div
                      key={v.name}
                      className="px-3 py-2 text-xs font-code flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-emerald-300 font-semibold">{v.name}</span>
                        <span className="text-slate-500 ml-2">
                          {v.typeName}
                          {v.shape ? ` (${v.shape})` : ''}
                        </span>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{v.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-xs text-slate-500">
                  Run a script or evaluate variables in the Terminal to inspect live objects in memory.
                </p>
              )}
            </div>

            {/* Active Diagnostics */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Diagnostics ({runtime.diagnostics.length})</span>
                </span>
              </div>
              {runtime.diagnostics.length > 0 ? (
                <div className="divide-y divide-slate-800/70 max-h-56 overflow-y-auto">
                  {runtime.diagnostics.map((d: DiagnosticMarker, idx: number) => (
                    <button
                      key={`${d.filePath}_${d.line}_${idx}`}
                      type="button"
                      onClick={() => onJumpToLine(d.filePath, d.line)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-900 transition-colors space-y-0.5"
                    >
                      <p className="text-xs font-medium text-rose-300">{d.message}</p>
                      <p className="text-[11px] font-code text-slate-400">
                        {d.filePath} · Line {d.line}, Col {d.column}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-xs text-slate-500">
                  No syntax or runtime diagnostics detected in the last run.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
