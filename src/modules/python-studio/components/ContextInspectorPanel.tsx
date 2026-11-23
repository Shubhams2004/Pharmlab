import React, { useMemo, useState } from 'react';
import { Braces, Check, Code2, Copy, Layers, X } from 'lucide-react';
import { extractPythonSymbols, inferFileKind } from '../studioUtils';
import { StudioNode, WorkspaceContextSnapshot } from '../types';

interface ContextInspectorPanelProps {
  activeFile: StudioNode | null;
  snapshot: WorkspaceContextSnapshot | null;
  onJumpToLine: (filePath: string, line: number) => void;
  onClose: () => void;
}

export default function ContextInspectorPanel({
  activeFile,
  snapshot,
  onJumpToLine,
  onClose
}: ContextInspectorPanelProps) {
  const [subTab, setSubTab] = useState<'outline' | 'bridge'>('outline');
  const [copied, setCopied] = useState(false);

  const symbols = useMemo(() => {
    if (!activeFile || inferFileKind(activeFile.name) !== 'python') return [];
    return extractPythonSymbols(activeFile.content || '');
  }, [activeFile]);

  const handleCopyContext = async () => {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <aside className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 select-none">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSubTab('outline')}
            className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${
              subTab === 'outline'
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Outline</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('bridge')}
            className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${
              subTab === 'bridge'
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Workspace Context</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close inspector panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {subTab === 'outline' ? (
          symbols.length > 0 && snapshot?.activeFilePath ? (
            <div className="space-y-1">
              {symbols.map((sym) => (
                <button
                  key={`${sym.name}_${sym.line}`}
                  type="button"
                  onClick={() => onJumpToLine(snapshot.activeFilePath!, sym.line)}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 text-left flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-code px-1.5 py-0.5 rounded ${
                        sym.kind === 'function'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : sym.kind === 'class'
                          ? 'bg-sky-500/15 text-sky-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {sym.kind === 'function' ? 'def' : sym.kind === 'class' ? 'cls' : 'const'}
                    </span>
                    <span className="text-xs font-code text-slate-200 truncate">{sym.name}</span>
                  </div>
                  <span className="text-[11px] font-code text-slate-500 tabular-nums shrink-0">
                    :{sym.line}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-1.5 text-slate-500">
              <Braces className="w-6 h-6 mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">No Python symbols detected</p>
              <p className="text-[11px]">
                Functions, classes, and module constants in the active `.py` file appear here.
              </p>
            </div>
          )
        ) : snapshot ? (
          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">StudioAssistantBridge</span>
                <button
                  type="button"
                  onClick={handleCopyContext}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 inline-flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Structured workspace state snapshot exposed for future AI assistant tools. No AI agent is active.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Active File</span>
                <span className="font-code text-slate-200 truncate max-w-[150px]">
                  {snapshot.activeFilePath || 'None'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Loaded Packages</span>
                <span className="font-code text-emerald-300">
                  {snapshot.loadedPackages.length > 0 ? snapshot.loadedPackages.join(', ') : 'Core only'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] tabular-nums">
                <span className="text-slate-400">Project Files</span>
                <span className="font-code text-slate-200">{snapshot.filesSummary.length}</span>
              </div>
              <div className="flex justify-between text-[11px] tabular-nums">
                <span className="text-slate-400">Variables</span>
                <span className="font-code text-slate-200">{snapshot.variables.length}</span>
              </div>
              <div className="flex justify-between text-[11px] tabular-nums">
                <span className="text-slate-400">Diagnostics</span>
                <span
                  className={`font-code ${
                    snapshot.diagnostics.length > 0 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {snapshot.diagnostics.length}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Indexed Files
              </span>
              <div className="rounded-lg bg-slate-950 border border-slate-800 divide-y divide-slate-800/80">
                {snapshot.filesSummary.map((f) => (
                  <div
                    key={f.path}
                    className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px] font-code"
                  >
                    <span className="text-slate-300 truncate">{f.path}</span>
                    <span className="text-slate-500 tabular-nums shrink-0">{f.lineCount}L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
