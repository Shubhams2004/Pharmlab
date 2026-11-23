import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Box,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  History,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Minimize2,
  Package,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Square,
  Table2,
  Terminal,
  Trash2,
  X,
  XCircle,
  ZoomIn
} from 'lucide-react';
import { RuntimeSnapshot } from '../pyodideRuntime';
import {
  DebugSnapshot,
  DebugStepMode,
  DiagnosticMarker,
  ExecutionRecord,
  OutputArtifact,
  PackageId,
  TerminalEntry,
  VariableDetail,
  WorkspaceVariableInfo
} from '../types';

export type BottomWorkbenchTab = 'output' | 'terminal' | 'debug' | 'packages' | 'variables';
type OutputFilterMode = 'all' | 'plots' | 'tables' | 'console';

interface TerminalOutputPanelProps {
  activeTab: BottomWorkbenchTab;
  onChangeTab: (tab: BottomWorkbenchTab) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCollapse: () => void;
  runtime: RuntimeSnapshot;
  liveDiagnostics: DiagnosticMarker[];
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
  onInstallCustomPackage: (pkgName: string) => Promise<void>;
  onInspectVariable: (varName: string) => Promise<VariableDetail>;
  pendingInputPrompt: { prompt: string; partialStdout: string } | null;
  onSubmitInputResponse: (value: string) => Promise<void>;
  onCancelInputPrompt: () => void;
  debugSnapshot: DebugSnapshot | null;
  breakpointsByFile: Record<string, number[]>;
  watchExprs: string[];
  onDebugStep: (mode: DebugStepMode) => Promise<void>;
  onStopDebug: () => void;
  onAddWatchExpr: (expr: string) => void;
  onRemoveWatchExpr: (expr: string) => void;
  onRemoveBreakpoint: (filePath: string, line: number) => void;
  onJumpToLine: (filePath: string, line: number) => void;
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function downloadTableCsv(
  columns: string[],
  rows: (string | number | boolean | null)[][],
  title: string
) {
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'table'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ArtifactRenderer({
  artifact,
  onJumpToLine,
  onExpandImage
}: {
  artifact: OutputArtifact;
  onJumpToLine?: (filePath: string, line: number) => void;
  onExpandImage: (img: { dataUrl: string; caption: string }) => void;
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
    const caption = artifact.caption || 'Matplotlib Figure';
    return (
      <figure className="rounded-xl border border-emerald-500/30 bg-slate-950 p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <figcaption className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{caption}</span>
          </figcaption>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onExpandImage({ dataUrl: artifact.dataUrl, caption })}
              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-[11px] font-medium text-emerald-200 inline-flex items-center gap-1"
            >
              <ZoomIn className="w-3 h-3" />
              <span>Expand</span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadDataUrl(
                  artifact.dataUrl,
                  `${caption.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`
                )
              }
              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200 inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>PNG</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onExpandImage({ dataUrl: artifact.dataUrl, caption })}
          className="w-full rounded-lg overflow-hidden bg-white p-1.5 sm:p-2 flex justify-center cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={`Expand ${caption}`}
        >
          <img
            src={artifact.dataUrl}
            alt={caption}
            className="w-full h-auto max-h-[300px] sm:max-h-[380px] object-contain"
          />
        </button>
      </figure>
    );
  }

  if (artifact.kind === 'table') {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/70">
          <div className="flex items-center gap-2 min-w-0">
            <Table2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">
              {artifact.title || 'DataFrame Table'}
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
              {artifact.shape[0]}×{artifact.shape[1]}
              {artifact.truncated ? ' (first 120)' : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadTableCsv(artifact.columns, artifact.rows, artifact.title || 'dataframe')
            }
            className="min-h-[30px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 inline-flex items-center gap-1 shrink-0"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
        <div className="overflow-x-auto max-h-56 overflow-y-auto">
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
                    <td key={cIdx} className="px-3 py-1.5 text-slate-200 whitespace-nowrap">
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

  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-rose-300">
              {artifact.errorType}: {artifact.message}
            </p>
            {artifact.primaryFile && artifact.primaryLine && onJumpToLine && (
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
              <div
                key={idx}
                className="text-[11px] font-code text-rose-200/90 flex flex-wrap items-center gap-1.5"
              >
                {isWorkspace && onJumpToLine ? (
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
                {fr.codeLine && (
                  <code className="text-rose-100 bg-rose-950/60 px-1 rounded">{fr.codeLine}</code>
                )}
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
  liveDiagnostics,
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
  onInstallCustomPackage,
  onInspectVariable,
  pendingInputPrompt,
  onSubmitInputResponse,
  onCancelInputPrompt,
  debugSnapshot,
  breakpointsByFile,
  watchExprs,
  onDebugStep,
  onStopDebug,
  onAddWatchExpr,
  onRemoveWatchExpr,
  onRemoveBreakpoint,
  onJumpToLine
}: TerminalOutputPanelProps) {
  const [replInput, setReplInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [outputFilter, setOutputFilter] = useState<OutputFilterMode>('all');
  const [lightboxImage, setLightboxImage] = useState<{
    dataUrl: string;
    caption: string;
  } | null>(null);

  // Interactive input() response state
  const [stdinDraft, setStdinDraft] = useState('');

  // micropip custom package state
  const [customPkgInput, setCustomPkgInput] = useState('');
  const [customPkgErr, setCustomPkgErr] = useState<string | null>(null);

  // Variable drill-down modal state
  const [varDetail, setVarDetail] = useState<VariableDetail | null>(null);
  const [varDetailBusy, setVarDetailBusy] = useState(false);
  const [varCopied, setVarCopied] = useState(false);

  // Debug watch expression input
  const [watchDraft, setWatchDraft] = useState('');

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [terminalEntries, activeTab]);

  const activeExecution =
    executionHistory.find((e) => e.id === selectedExecutionId) || executionHistory[0] || null;

  useEffect(() => {
    setOutputFilter('all');
  }, [activeExecution?.id]);

  const artifactCounts = useMemo(() => {
    const arts = activeExecution?.artifacts || [];
    const plots = arts.filter((a) => a.kind === 'image').length;
    const tables = arts.filter((a) => a.kind === 'table').length;
    const logs = arts.filter((a) => a.kind === 'text' || a.kind === 'traceback').length;
    return { plots, tables, logs, total: arts.length };
  }, [activeExecution]);

  const orderedArtifacts = useMemo(() => {
    const arts = activeExecution?.artifacts || [];
    if (outputFilter === 'plots') return arts.filter((a) => a.kind === 'image');
    if (outputFilter === 'tables') return arts.filter((a) => a.kind === 'table');
    if (outputFilter === 'console') {
      return arts.filter((a) => a.kind === 'text' || a.kind === 'traceback');
    }

    const tracebacks = arts.filter((a) => a.kind === 'traceback');
    const images = arts.filter((a) => a.kind === 'image');
    const texts = arts.filter((a) => a.kind === 'text');
    const tables = arts.filter((a) => a.kind === 'table');
    return [...tracebacks, ...images, ...texts, ...tables];
  }, [activeExecution, outputFilter]);

  const allBreakpoints = useMemo(() => {
    const list: Array<{ filePath: string; line: number }> = [];
    for (const [fp, lines] of Object.entries(breakpointsByFile)) {
      for (const ln of lines) {
        list.push({ filePath: fp, line: ln });
      }
    }
    return list;
  }, [breakpointsByFile]);

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

  const handleOpenVarDetail = async (name: string) => {
    setVarDetailBusy(true);
    try {
      const detail = await onInspectVariable(name);
      setVarDetail(detail);
    } finally {
      setVarDetailBusy(false);
    }
  };

  const handleInstallCustom = async (pkgName: string) => {
    const clean = pkgName.trim();
    if (!clean) return;
    setCustomPkgErr(null);
    try {
      await onInstallCustomPackage(clean);
      setCustomPkgInput('');
    } catch (err: any) {
      setCustomPkgErr(err?.message || `Failed to install ${clean}`);
    }
  };

  const loadedCount = runtime.packages.filter((p) => p.status === 'loaded').length;
  const problemsCount = liveDiagnostics.length;

  return (
    <section className="h-full w-full min-h-0 flex flex-col bg-slate-900 border-t border-slate-800 overflow-hidden">
      {/* Workbench Tab Header */}
      <div className="px-2 sm:px-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/70 shrink-0">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto min-w-0 no-scrollbar">
          {[
            {
              id: 'output' as const,
              label: `Output & Plots${artifactCounts.plots > 0 ? ` (${artifactCounts.plots})` : ''}`
            },
            {
              id: 'terminal' as const,
              label: 'REPL'
            },
            {
              id: 'debug' as const,
              label: debugSnapshot?.paused
                ? `Debug (L${debugSnapshot.line})`
                : `Debug${allBreakpoints.length > 0 ? ` (${allBreakpoints.length})` : ''}`
            },
            {
              id: 'packages' as const,
              label: `Packages (${loadedCount}/${runtime.packages.length})`
            },
            {
              id: 'variables' as const,
              label: `Vars (${runtime.variables.length})${problemsCount > 0 ? ` · ${problemsCount}` : ''}`
            }
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`min-h-[38px] px-2.5 sm:px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-emerald-500 text-white'
                    : tab.id === 'debug' && debugSnapshot?.paused
                    ? 'border-transparent text-amber-300'
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
                <span className="hidden sm:inline">Reset</span>
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
            className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white"
            title={isExpanded ? 'Restore split height' : 'Expand workbench full height'}
            aria-label={isExpanded ? 'Restore panel height' : 'Maximize workbench'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isExpanded ? 'Split' : 'Expand'}</span>
          </button>
          <button
            type="button"
            onClick={onCollapse}
            className="hidden md:inline-flex p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Hide panel"
            aria-label="Hide panel"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 ${
          activeTab === 'terminal' ? 'pb-3' : 'pb-8'
        }`}
      >
        {/* Interactive Python input() Prompt Banner */}
        {pendingInputPrompt && (
          <div className="mb-3 p-3 rounded-xl bg-sky-950/60 border border-sky-500/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Python input() waiting for your response</span>
              </span>
              <button
                type="button"
                onClick={onCancelInputPrompt}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            {pendingInputPrompt.partialStdout && (
              <pre className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs font-code text-emerald-200 whitespace-pre-wrap">
                {pendingInputPrompt.partialStdout}
              </pre>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const val = stdinDraft;
                setStdinDraft('');
                await onSubmitInputResponse(val);
              }}
              className="flex flex-wrap sm:flex-nowrap items-center gap-2"
            >
              {pendingInputPrompt.prompt && (
                <label className="text-xs font-code text-amber-200 shrink-0">
                  {pendingInputPrompt.prompt}
                </label>
              )}
              <input
                autoFocus
                type="text"
                value={stdinDraft}
                onChange={(e) => setStdinDraft(e.target.value)}
                placeholder="Type response and press Enter..."
                className="flex-1 min-w-[160px] min-h-[38px] bg-slate-950 border border-sky-500/60 rounded-lg px-3 py-1.5 text-xs font-code text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="space-y-3">
            {executionHistory.length > 0 && (
              <div className="space-y-2 pb-2 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5">
                    <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {executionHistory.slice(0, 8).map((rec, idx) => {
                      const isSelected = activeExecution?.id === rec.id;
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => onSelectExecution(rec.id)}
                          className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-code border transition-colors whitespace-nowrap tabular-nums shrink-0 ${
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
                      className={`text-[11px] font-medium tabular-nums shrink-0 ${
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

                {(artifactCounts.plots > 0 || artifactCounts.tables > 0) && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: 'all' as const, label: `All (${artifactCounts.total})` },
                      ...(artifactCounts.plots > 0
                        ? [{ id: 'plots' as const, label: `Plots (${artifactCounts.plots})` }]
                        : []),
                      ...(artifactCounts.tables > 0
                        ? [{ id: 'tables' as const, label: `Tables (${artifactCounts.tables})` }]
                        : []),
                      ...(artifactCounts.logs > 0
                        ? [{ id: 'console' as const, label: `Console (${artifactCounts.logs})` }]
                        : [])
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOutputFilter(f.id)}
                        className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-medium border whitespace-nowrap shrink-0 transition-colors ${
                          outputFilter === f.id
                            ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeExecution ? (
              orderedArtifacts.length > 0 ? (
                <div className="space-y-3">
                  {orderedArtifacts.map((art) => (
                    <ArtifactRenderer
                      key={art.id}
                      artifact={art}
                      onJumpToLine={onJumpToLine}
                      onExpandImage={setLightboxImage}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Execution completed in {activeExecution.durationMs} ms with no printed output or figures in this view.
                </div>
              )
            ) : !pendingInputPrompt ? (
              <div className="py-10 text-center space-y-2 text-slate-400">
                <p className="text-xs font-medium text-slate-300">
                  No script runs yet in this project
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tap Run File to execute your Python script and view console output, DataFrames, and Matplotlib plots.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full min-h-[180px] flex flex-col justify-between gap-2">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 font-code text-xs pr-1">
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
              <span className="font-code text-xs text-emerald-400 pt-2 select-none">&gt;&gt;&gt;</span>
              <textarea
                rows={1}
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                onKeyDown={handleReplKeyDown}
                placeholder="Evaluate Python command in persistent session..."
                className="flex-1 min-h-[38px] bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-2 text-xs font-code text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
              />
              <button
                type="button"
                disabled={!replInput.trim() || runtime.status === 'executing'}
                onClick={submitRepl}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-white shrink-0 inline-flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Eval</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-3">
            {/* Step Debugger Control Bar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Bug className={`w-4 h-4 ${debugSnapshot?.paused ? 'text-amber-400' : 'text-slate-400'}`} />
                {debugSnapshot?.paused ? (
                  <span className="font-semibold text-amber-200 font-code">
                    Paused at {debugSnapshot.filePath}:{debugSnapshot.line} (step #{debugSnapshot.stepCount})
                  </span>
                ) : (
                  <span className="text-slate-300">
                    Click gutter line numbers (or BP button) to toggle breakpoints, then press Debug.
                  </span>
                )}
              </div>

              {debugSnapshot?.paused && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onDebugStep('continue')}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Continue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDebugStep('over')}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3 text-sky-400" />
                    <span>Step Over</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDebugStep('into')}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1"
                  >
                    <ArrowDownToLine className="w-3 h-3 text-emerald-400" />
                    <span>Step Into</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDebugStep('out')}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1"
                  >
                    <ArrowUpFromLine className="w-3 h-3 text-amber-400" />
                    <span>Step Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={onStopDebug}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-semibold text-rose-300 inline-flex items-center gap-1"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Watch Expressions */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Watch Expressions</span>
                  </span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (watchDraft.trim()) {
                      onAddWatchExpr(watchDraft.trim());
                      setWatchDraft('');
                    }
                  }}
                  className="p-2 border-b border-slate-800/80 flex gap-1.5"
                >
                  <input
                    type="text"
                    value={watchDraft}
                    onChange={(e) => setWatchDraft(e.target.value)}
                    placeholder="e.g. round(auc_iv, 2)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-code text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs"
                    aria-label="Add watch expression"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
                <div className="divide-y divide-slate-800/70 max-h-48 overflow-y-auto">
                  {watchExprs.length > 0 ? (
                    watchExprs.map((expr) => {
                      const evaluated = debugSnapshot?.watches.find((w) => w.expr === expr);
                      return (
                        <div key={expr} className="px-3 py-2 text-xs font-code flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sky-300 truncate">{expr}</p>
                            {evaluated ? (
                              evaluated.error ? (
                                <p className="text-[11px] text-rose-400 truncate">{evaluated.error}</p>
                              ) : (
                                <p className="text-[11px] text-emerald-300 truncate">= {evaluated.value}</p>
                              )
                            ) : (
                              <p className="text-[11px] text-slate-500">Evaluated when paused</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveWatchExpr(expr)}
                            className="p-0.5 text-slate-500 hover:text-rose-400"
                            aria-label={`Remove watch ${expr}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="p-3 text-xs text-slate-500">No watch expressions added.</p>
                  )}
                </div>
              </div>

              {/* Call Stack */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Call Stack ({debugSnapshot?.callStack.length || 0})
                  </span>
                </div>
                <div className="divide-y divide-slate-800/70 max-h-56 overflow-y-auto">
                  {debugSnapshot?.callStack.length ? (
                    [...debugSnapshot.callStack].reverse().map((fr, idx) => (
                      <button
                        key={`${fr.filePath}_${fr.line}_${idx}`}
                        type="button"
                        onClick={() => onJumpToLine(fr.filePath, fr.line)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-900 text-xs font-code flex items-center justify-between gap-2"
                      >
                        <span className="text-emerald-300 truncate">{fr.functionName}</span>
                        <span className="text-slate-400 shrink-0">
                          {fr.filePath}:{fr.line}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="p-3 text-xs text-slate-500">Not paused in call stack.</p>
                  )}
                </div>
              </div>

              {/* Local Scope + Breakpoints */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    {debugSnapshot?.paused
                      ? `Frame Locals (${debugSnapshot.locals.length})`
                      : `Breakpoints (${allBreakpoints.length})`}
                  </span>
                </div>
                <div className="divide-y divide-slate-800/70 max-h-56 overflow-y-auto">
                  {debugSnapshot?.paused ? (
                    debugSnapshot.locals.length > 0 ? (
                      debugSnapshot.locals.map((v) => (
                        <div key={v.name} className="px-3 py-2 text-xs font-code">
                          <span className="text-emerald-300 font-semibold">{v.name}</span>
                          <span className="text-slate-500 ml-2">{v.typeName}</span>
                          <p className="text-[11px] text-slate-300 truncate">{v.summary}</p>
                        </div>
                      ))
                    ) : (
                      <p className="p-3 text-xs text-slate-500">No local variables in current frame.</p>
                    )
                  ) : allBreakpoints.length > 0 ? (
                    allBreakpoints.map((bp) => (
                      <div
                        key={`${bp.filePath}_${bp.line}`}
                        className="px-3 py-2 text-xs font-code flex items-center justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => onJumpToLine(bp.filePath, bp.line)}
                          className="text-rose-300 hover:underline truncate"
                        >
                          {bp.filePath}:{bp.line}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveBreakpoint(bp.filePath, bp.line)}
                          className="text-slate-500 hover:text-white"
                          aria-label="Remove breakpoint"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-xs text-slate-500">No breakpoints set.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">
                  Python {runtime.pythonVersion} · Pyodide v{runtime.pyodideVersion} (WebAssembly Worker)
                </p>
                <p className="text-[11px] text-slate-400">
                  Core scientific libraries load lazily or via buttons below; cached offline by the Service Worker once downloaded.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {runtime.status === 'idle' || runtime.status === 'error' ? (
                  <button
                    type="button"
                    onClick={onInitRuntime}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                  >
                    Initialize Python
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onResetGlobals}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    Clear Globals
                  </button>
                )}
              </div>
            </div>

            {/* Core Pyodide Scientific Stack */}
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
                    <p className="text-[11px] text-slate-400 leading-relaxed">{pkg.description}</p>
                    {pkg.error && (
                      <p className="text-[11px] text-rose-400 break-words">{pkg.error}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={pkg.status === 'loaded' || pkg.status === 'loading'}
                    onClick={() => onLoadPackage(pkg.id)}
                    className={`min-h-[34px] w-full py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
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

            {/* micropip Custom Package Installer */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    PyPI &amp; Extra Scientific Packages (micropip)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Install additional Pyodide wheels or pure-Python PyPI packages directly in your browser.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInstallCustom(customPkgInput);
                }}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2"
              >
                <input
                  type="text"
                  value={customPkgInput}
                  onChange={(e) => setCustomPkgInput(e.target.value)}
                  placeholder="Enter package name (e.g. scikit-learn, seaborn, openpyxl)..."
                  className="flex-1 min-w-[180px] min-h-[36px] bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs font-code text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!customPkgInput.trim() || runtime.status === 'loading_package'}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-white shrink-0"
                >
                  micropip.install()
                </button>
              </form>

              {customPkgErr && (
                <p className="text-xs text-rose-400 break-words">{customPkgErr}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {runtime.customPackages.map((cp) => (
                  <button
                    key={cp.name}
                    type="button"
                    disabled={cp.status === 'loaded' || cp.status === 'loading'}
                    onClick={() => handleInstallCustom(cp.name)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-code border inline-flex items-center gap-1.5 transition-colors ${
                      cp.status === 'loaded'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : cp.status === 'loading'
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                        : cp.status === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                    title={cp.error || `Install ${cp.name} via micropip`}
                  >
                    {cp.status === 'loading' ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : cp.status === 'loaded' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Plus className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{cp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                  <span>Session Globals ({runtime.variables.length})</span>
                </span>
                <span className="text-[11px] text-slate-500">Tap any variable to inspect</span>
              </div>
              {runtime.variables.length > 0 ? (
                <div className="divide-y divide-slate-800/70 max-h-60 overflow-y-auto">
                  {runtime.variables.map((v: WorkspaceVariableInfo) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => handleOpenVarDetail(v.name)}
                      className="w-full text-left px-3 py-2 text-xs font-code flex items-center justify-between gap-3 hover:bg-slate-900 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-emerald-300 font-semibold">{v.name}</span>
                        <span className="text-slate-500 ml-2">
                          {v.typeName}
                          {v.shape ? ` (${v.shape})` : ''}
                        </span>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{v.summary}</p>
                      </div>
                      <span className="text-[11px] text-sky-400 shrink-0 inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-xs text-slate-500">
                  Run a script or evaluate variables in the REPL to inspect live objects in memory.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Lint &amp; Diagnostics ({liveDiagnostics.length})</span>
                </span>
              </div>
              {liveDiagnostics.length > 0 ? (
                <div className="divide-y divide-slate-800/70 max-h-60 overflow-y-auto">
                  {liveDiagnostics.map((d: DiagnosticMarker, idx: number) => (
                    <button
                      key={`${d.filePath}_${d.line}_${idx}`}
                      type="button"
                      onClick={() => onJumpToLine(d.filePath, d.line)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-900 transition-colors space-y-0.5"
                    >
                      <p
                        className={`text-xs font-medium ${
                          d.severity === 'error' ? 'text-rose-300' : 'text-amber-300'
                        }`}
                      >
                        {d.message}
                      </p>
                      <p className="text-[11px] font-code text-slate-400">
                        {d.filePath} · Line {d.line}, Col {d.column}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-xs text-slate-500">
                  No syntax errors, undefined variables, or unused imports detected.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Variable Drill-Down Modal */}
      {(varDetail || varDetailBusy) && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => !varDetailBusy && setVarDetail(null)}
          role="dialog"
          aria-modal="true"
          aria-label={varDetail ? `Inspect variable ${varDetail.name}` : 'Loading variable'}
        >
          <div
            className="w-full max-w-3xl max-h-[85dvh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white font-code truncate">
                  {varDetailBusy ? 'Inspecting variable...' : `${varDetail?.name} : ${varDetail?.typeName}`}
                </h3>
                {varDetail && (
                  <p className="text-[11px] text-slate-400 font-code">
                    {varDetail.shape ? `Shape ${varDetail.shape}` : ''}
                    {varDetail.dtype ? ` · dtype ${varDetail.dtype}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {varDetail?.table && (
                  <button
                    type="button"
                    onClick={() =>
                      downloadTableCsv(
                        varDetail.table!.columns,
                        varDetail.table!.rows,
                        varDetail.name
                      )
                    }
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                )}
                {varDetail?.rawText && (
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(varDetail.rawText || '');
                      setVarCopied(true);
                      window.setTimeout(() => setVarCopied(false), 1500);
                    }}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 inline-flex items-center gap-1"
                  >
                    {varCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{varCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setVarDetail(null)}
                  className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                  aria-label="Close variable inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
              {varDetailBusy ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Serializing object from Python memory...</span>
                </div>
              ) : varDetail?.kind === 'table' && varDetail.table ? (
                <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 max-h-[62dvh]">
                  <table className="w-full text-left text-xs font-code tabular-nums">
                    <thead className="bg-slate-900 text-slate-300 sticky top-0 border-b border-slate-800">
                      <tr>
                        {varDetail.table.columns.map((col, idx) => (
                          <th key={`${col}_${idx}`} className="px-3 py-2 font-semibold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {varDetail.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/60">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 text-slate-200 whitespace-nowrap">
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
              ) : varDetail?.kind === 'array' ? (
                <div className="space-y-3">
                  {varDetail.arrayStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: 'Min', val: varDetail.arrayStats.min },
                        { label: 'Max', val: varDetail.arrayStats.max },
                        { label: 'Mean', val: varDetail.arrayStats.mean },
                        { label: 'Std Dev', val: varDetail.arrayStats.std },
                        { label: 'NaN Count', val: varDetail.arrayStats.nanCount }
                      ].map((s) => (
                        <div key={s.label} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[11px] text-slate-400">{s.label}</span>
                          <p className="text-xs font-code font-bold text-emerald-300 tabular-nums mt-0.5">
                            {s.val === null ? '—' : Number.isInteger(s.val) ? s.val : s.val.toFixed(4)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {varDetail.arrayPreview && varDetail.arrayPreview.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-[11px] text-slate-400 mb-2">
                        Elements Preview (first {varDetail.arrayPreview.length} flattened items)
                      </p>
                      <div className="flex flex-wrap gap-1.5 font-code text-xs">
                        {varDetail.arrayPreview.map((el, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 tabular-nums">
                            {el === null ? 'NaN' : typeof el === 'number' && !Number.isInteger(el) ? el.toFixed(4) : String(el)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-code text-emerald-200 whitespace-pre-wrap break-words overflow-auto max-h-[60dvh]">
                  {varDetail?.rawText || varDetail?.summary}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Chart Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col p-3 sm:p-6"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.caption}
        >
          <div
            className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white truncate">{lightboxImage.caption}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  downloadDataUrl(
                    lightboxImage.dataUrl,
                    `${lightboxImage.caption.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`
                  )
                }
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                aria-label="Close expanded plot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 min-h-0 flex items-center justify-center overflow-auto py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl p-2 sm:p-4 max-w-full max-h-full shadow-2xl">
              <img
                src={lightboxImage.dataUrl}
                alt={lightboxImage.caption}
                className="max-w-full max-h-[80dvh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
