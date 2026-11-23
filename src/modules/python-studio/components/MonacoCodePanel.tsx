import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as MonacoNamespace from 'monaco-editor';
import {
  Code2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  IndentIncrease,
  Play,
  Redo2,
  Replace,
  Save,
  Search,
  Sparkles,
  Undo2,
  WrapText,
  X
} from 'lucide-react';
import { configureMonacoStudio } from '../monacoSetup';
import { extractPythonSymbols, getMonacoLanguage, inferFileKind } from '../studioUtils';
import { DiagnosticMarker, EditorPreferences, StudioNode } from '../types';

configureMonacoStudio();

interface MonacoCodePanelProps {
  openTabs: StudioNode[];
  activeFile: StudioNode | null;
  activeFilePath: string | null;
  dirtyFileIds: Set<string>;
  editorPrefs: EditorPreferences;
  diagnostics: DiagnosticMarker[];
  isExecuting: boolean;
  isCompactViewport: boolean;
  isCompactWidth?: boolean;
  jumpTarget: { filePath: string; line: number; nonce: number } | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onChangeContent: (fileId: string, content: string) => void;
  onSaveFile: (fileId: string) => void;
  onToggleWordWrap: () => void;
  onRunFile: () => void;
  onRunSelection: (selectedCode: string) => void;
  onSelectionChange: (selectedCode: string | null) => void;
  onCreateMainPy: () => void;
}

function TabIcon({ name }: { name: string }) {
  const kind = inferFileKind(name);
  if (kind === 'python') return <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  if (kind === 'csv') return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

export default function MonacoCodePanel({
  openTabs,
  activeFile,
  activeFilePath,
  dirtyFileIds,
  editorPrefs,
  diagnostics,
  isExecuting,
  isCompactViewport,
  isCompactWidth = false,
  jumpTarget,
  onSelectTab,
  onCloseTab,
  onChangeContent,
  onSaveFile,
  onToggleWordWrap,
  onRunFile,
  onRunSelection,
  onSelectionChange,
  onCreateMainPy
}: MonacoCodePanelProps) {
  const editorRef = useRef<MonacoNamespace.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoNamespace | null>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [selectedText, setSelectedText] = useState('');
  const [symbolsOpen, setSymbolsOpen] = useState(false);

  const runFileRef = useRef(onRunFile);
  runFileRef.current = onRunFile;
  const runSelectionRef = useRef(onRunSelection);
  runSelectionRef.current = onRunSelection;
  const saveFileRef = useRef(onSaveFile);
  saveFileRef.current = onSaveFile;
  const activeFileIdRef = useRef(activeFile?.id || null);
  activeFileIdRef.current = activeFile?.id || null;

  const symbols = useMemo(() => {
    if (!activeFile || inferFileKind(activeFile.name) !== 'python') return [];
    return extractPythonSymbols(activeFile.content || '');
  }, [activeFile]);

  const resolvedMonacoTheme =
    editorPrefs.theme === 'vs-dark' ? 'pharmlab-dark' : editorPrefs.theme;

  const effectiveCompactGutter = isCompactViewport || isCompactWidth;
  const effectiveWordWrap = isCompactViewport ? 'on' : editorPrefs.wordWrap;

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.setScrollLeft(0);
    requestAnimationFrame(() => {
      editor.setScrollLeft(0);
      editor.layout();
    });

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, column: e.position.column });
    });

    editor.onDidChangeCursorSelection(() => {
      const model = editor.getModel();
      const sel = editor.getSelection();
      if (!model || !sel || sel.isEmpty()) {
        setSelectedText('');
        onSelectionChange(null);
        return;
      }
      const value = model.getValueInRange(sel);
      setSelectedText(value);
      onSelectionChange(value);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runFileRef.current();
    });

    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      const model = editor.getModel();
      const sel = editor.getSelection();
      if (model && sel && !sel.isEmpty()) {
        runSelectionRef.current(model.getValueInRange(sel));
      } else if (model) {
        const line = editor.getPosition()?.lineNumber || 1;
        runSelectionRef.current(model.getLineContent(line));
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeFileIdRef.current) {
        saveFileRef.current(activeFileIdRef.current);
      }
    });
  };

  // Keep horizontal scroll reset cleanly when switching files or viewport modes
  useEffect(() => {
    editorRef.current?.setScrollLeft(0);
    editorRef.current?.layout();
  }, [activeFile?.id, isCompactViewport, effectiveCompactGutter, effectiveWordWrap]);

  // Sync error markers to active Monaco model
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;

    const matching = diagnostics.filter(
      (d) =>
        !activeFilePath ||
        d.filePath === activeFilePath ||
        d.filePath.endsWith(`/${activeFilePath}`)
    );

    const markers: MonacoNamespace.editor.IMarkerData[] = matching.map((d) => ({
      severity:
        d.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Error,
      startLineNumber: Math.max(1, d.line),
      startColumn: Math.max(1, d.column),
      endLineNumber: Math.max(1, d.line),
      endColumn: Math.max(2, d.endColumn),
      message: d.message
    }));

    monaco.editor.setModelMarkers(model, 'pyodide-diagnostics', markers);
  }, [diagnostics, activeFilePath, activeFile?.id]);

  // Jump to line when triggered from Traceback or Outline
  useEffect(() => {
    if (!jumpTarget || !editorRef.current) return;
    if (
      activeFilePath &&
      jumpTarget.filePath !== activeFilePath &&
      !jumpTarget.filePath.endsWith(`/${activeFilePath}`)
    ) {
      return;
    }
    const line = Math.max(1, jumpTarget.line);
    editorRef.current.revealLineInCenter(line);
    editorRef.current.setPosition({ lineNumber: line, column: 1 });
    editorRef.current.focus();
  }, [jumpTarget, activeFilePath]);

  const triggerMonacoAction = (actionId: string) => {
    editorRef.current?.focus();
    editorRef.current?.getAction(actionId)?.run();
  };

  const triggerMonacoCommand = (commandId: string) => {
    editorRef.current?.focus();
    editorRef.current?.trigger('toolbar', commandId, null);
  };

  const insertIndent = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    editor.trigger('toolbar', 'tab', null);
  };

  const jumpToLine = (line: number) => {
    setSymbolsOpen(false);
    editorRef.current?.revealLineInCenter(line);
    editorRef.current?.setPosition({ lineNumber: line, column: 1 });
    editorRef.current?.focus();
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0B1120] min-w-0 min-h-0 overflow-hidden">
      {/* Open Tabs Bar */}
      <div className="flex items-center bg-slate-900 border-b border-slate-800 overflow-x-auto shrink-0">
        {openTabs.map((tab) => {
          const isActive = tab.id === activeFile?.id;
          const isDirty = dirtyFileIds.has(tab.id);
          return (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 px-3 py-2 text-xs border-r border-slate-800 shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#0B1120] text-white border-t-2 border-t-emerald-500 font-medium'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border-t-2 border-t-transparent'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className="flex items-center gap-1.5 min-h-[24px]"
              >
                <TabIcon name={tab.name} />
                <span>{tab.name}</span>
                {isDirty && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    title="Unsaved changes"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-1 rounded opacity-75 hover:opacity-100 hover:bg-slate-700 text-slate-400 hover:text-white"
                aria-label={`Close ${tab.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Breadcrumb & Quick Actions Bar */}
      {activeFile && (
        <div className="px-2.5 sm:px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 font-code truncate max-w-[170px] sm:max-w-xs">
              {activeFilePath || activeFile.name}
            </span>
            {symbols.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSymbolsOpen((v) => !v)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 inline-flex items-center gap-1"
                >
                  <Code2 className="w-3 h-3 text-emerald-400" />
                  <span>Symbols ({symbols.length})</span>
                </button>
                {symbolsOpen && (
                  <div className="absolute left-0 top-full mt-1 z-30 w-64 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-800">
                    {symbols.map((sym) => (
                      <button
                        key={`${sym.name}_${sym.line}`}
                        type="button"
                        onClick={() => jumpToLine(sym.line)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-code text-slate-200 truncate">
                          {sym.name}
                          {sym.detail ? (
                            <span className="text-slate-500">{sym.detail}</span>
                          ) : null}
                        </span>
                        <span className="text-[11px] text-emerald-400 tabular-nums shrink-0">
                          L{sym.line}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => triggerMonacoCommand('undo')}
              className="md:hidden p-1.5 rounded hover:bg-slate-800 text-slate-300"
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => triggerMonacoCommand('redo')}
              className="md:hidden p-1.5 rounded hover:bg-slate-800 text-slate-300"
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={insertIndent}
              className="md:hidden p-1.5 rounded hover:bg-slate-800 text-slate-300"
              title="Indent"
              aria-label="Indent line"
            >
              <IndentIncrease className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggleWordWrap}
              className={`hidden md:inline-flex px-2 py-1 rounded items-center gap-1 transition-colors ${
                editorPrefs.wordWrap === 'on'
                  ? 'bg-slate-800 text-emerald-300'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Word Wrap"
            >
              <WrapText className="w-3 h-3" />
              <span className="hidden lg:inline">Wrap</span>
            </button>
            <button
              type="button"
              onClick={() => triggerMonacoAction('actions.find')}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white inline-flex items-center gap-1"
              title="Find (Ctrl+F)"
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Find</span>
            </button>
            <button
              type="button"
              onClick={() => triggerMonacoAction('editor.action.startFindReplaceAction')}
              className="hidden sm:inline-flex px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white items-center gap-1"
              title="Replace (Ctrl+H)"
            >
              <Replace className="w-3 h-3" />
              <span className="hidden lg:inline">Replace</span>
            </button>
            <button
              type="button"
              onClick={() => onSaveFile(activeFile.id)}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white inline-flex items-center gap-1"
              title="Save File (Ctrl+S)"
            >
              <Save className="w-3 h-3 text-sky-400" />
              <span>Save</span>
            </button>

            {selectedText.trim().length > 0 &&
              inferFileKind(activeFile.name) === 'python' && (
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={() => onRunSelection(selectedText)}
                  className="px-2.5 py-1 rounded bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 disabled:opacity-50 text-sky-200 font-medium inline-flex items-center gap-1"
                  title="Run selected code (Shift+Enter)"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Run Selection</span>
                </button>
              )}

            {inferFileKind(activeFile.name) === 'python' && (
              <button
                type="button"
                disabled={isExecuting}
                onClick={onRunFile}
                className="hidden md:inline-flex px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold items-center gap-1 transition-colors"
                title="Run Active Python File (Ctrl+Enter)"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run</span>
              </button>
            )}

            <span className="hidden lg:inline text-[11px] text-slate-500 font-code tabular-nums pl-1">
              Ln {cursorPos.line}, Col {cursorPos.column}
            </span>
          </div>
        </div>
      )}

      {/* Monaco Editor Canvas */}
      <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
        {activeFile ? (
          <Editor
            height="100%"
            path={activeFilePath || activeFile.name}
            language={getMonacoLanguage(activeFile.name)}
            value={activeFile.content ?? ''}
            theme={resolvedMonacoTheme}
            onMount={handleMount}
            onChange={(val) => onChangeContent(activeFile.id, val ?? '')}
            options={{
              fontSize: isCompactViewport ? Math.min(editorPrefs.fontSize, 13) : editorPrefs.fontSize,
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontLigatures: false,
              tabSize: editorPrefs.tabSize,
              insertSpaces: true,
              wordWrap: effectiveWordWrap,
              minimap: { enabled: !effectiveCompactGutter && editorPrefs.minimap },
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              lineDecorationsWidth: effectiveCompactGutter ? 4 : 8,
              glyphMargin: false,
              folding: !isCompactViewport,
              overviewRulerLanes: effectiveCompactGutter ? 0 : 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              suggestOnTriggerCharacters: true,
              quickSuggestions: { other: true, comments: false, strings: false },
              padding: { top: 8, bottom: 12 }
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 text-slate-400">
            <FileCode2 className="w-10 h-10 text-slate-600" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">No File Open</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a file from the Project Explorer or create a new Python script to begin coding.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateMainPy}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
            >
              Create New Python File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
