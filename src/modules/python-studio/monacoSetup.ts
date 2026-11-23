import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker.js?worker';
import { extractWorkspaceSymbols, WorkspaceSymbolEntry } from './studioUtils';

let isConfigured = false;

interface WorkspaceIntelliSenseState {
  symbols: WorkspaceSymbolEntry[];
  moduleToPath: Map<string, string>;
  csvPaths: string[];
  onOpenLocation?: (filePath: string, line: number) => void;
}

const workspaceIntelliSense: WorkspaceIntelliSenseState = {
  symbols: [],
  moduleToPath: new Map(),
  csvPaths: []
};

export function updateMonacoWorkspaceContext(params: {
  files: Array<{ path: string; content: string }>;
  onOpenLocation?: (filePath: string, line: number) => void;
}) {
  const { symbols, moduleToPath, csvPaths } = extractWorkspaceSymbols(params.files);
  workspaceIntelliSense.symbols = symbols;
  workspaceIntelliSense.moduleToPath = moduleToPath;
  workspaceIntelliSense.csvPaths = csvPaths;
  workspaceIntelliSense.onOpenLocation = params.onOpenLocation;
}

const PYTHON_KEYWORDS = [
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for',
  'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
  'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
  'while', 'with', 'yield'
];

const PYTHON_BUILTINS = [
  'abs', 'all', 'any', 'bin', 'bool', 'dict', 'display', 'enumerate',
  'filter', 'float', 'format', 'frozenset', 'getattr', 'hasattr', 'hex',
  'input', 'int', 'isinstance', 'len', 'list', 'map', 'max', 'min',
  'next', 'open', 'pow', 'print', 'range', 'repr', 'reversed', 'round',
  'set', 'slice', 'sorted', 'str', 'sum', 'tuple', 'type', 'zip'
];

const SCIENTIFIC_COMPLETIONS: Array<{
  label: string;
  insertText: string;
  detail: string;
  isSnippet?: boolean;
}> = [
  {
    label: 'import numpy as np',
    insertText: 'import numpy as np',
    detail: 'NumPy numerical array library'
  },
  {
    label: 'import pandas as pd',
    insertText: 'import pandas as pd',
    detail: 'Pandas DataFrame & CSV analysis'
  },
  {
    label: 'import matplotlib.pyplot as plt',
    insertText: 'import matplotlib.pyplot as plt',
    detail: 'Matplotlib plotting (inline Agg PNG)'
  },
  {
    label: 'from scipy import optimize, stats',
    insertText: 'from scipy import optimize, stats',
    detail: 'SciPy curve fitting & statistics'
  },
  {
    label: 'import sympy as sp',
    insertText: 'import sympy as sp',
    detail: 'SymPy symbolic mathematics'
  },
  {
    label: 'np.linspace',
    insertText: 'np.linspace(${1:0}, ${2:10}, ${3:100})',
    detail: 'Evenly spaced numbers over interval',
    isSnippet: true
  },
  {
    label: 'np.array',
    insertText: 'np.array([${1:1.0, 2.0, 3.0}])',
    detail: 'Create NumPy ndarray',
    isSnippet: true
  },
  {
    label: 'np.polyfit',
    insertText: 'np.polyfit(${1:x}, ${2:y}, ${3:1})',
    detail: 'Least squares polynomial fit',
    isSnippet: true
  },
  {
    label: 'pd.DataFrame',
    insertText: 'pd.DataFrame(${1:data})',
    detail: 'Construct Pandas DataFrame',
    isSnippet: true
  },
  {
    label: 'pd.read_csv',
    insertText: 'pd.read_csv("${1:data.csv}")',
    detail: 'Load CSV from workspace virtual filesystem',
    isSnippet: true
  },
  {
    label: 'plt.subplots',
    insertText:
      'fig, ax = plt.subplots(figsize=(${1:7.5}, ${2:4.2}))\nax.plot(${3:x}, ${4:y})\nax.set_title("${5:Title}")\nax.grid(True, alpha=0.35)\nplt.tight_layout()\nplt.show()',
    detail: 'Matplotlib figure & inline plot scaffold',
    isSnippet: true
  },
  {
    label: 'optimize.curve_fit',
    insertText: 'popt, pcov = optimize.curve_fit(${1:model_fn}, ${2:xdata}, ${3:ydata})',
    detail: 'Non-linear least squares fit',
    isSnippet: true
  },
  {
    label: 'display',
    insertText: 'display(${1:df})',
    detail: 'Render DataFrame as interactive table in Output panel',
    isSnippet: true
  },
  {
    label: 'def',
    insertText: 'def ${1:function_name}(${2:arg}):\n    ${3:pass}',
    detail: 'Define Python function',
    isSnippet: true
  }
];

export function configureMonacoStudio(): typeof monaco {
  if (isConfigured) return monaco;
  isConfigured = true;

  (globalThis as unknown as { MonacoEnvironment?: unknown }).MonacoEnvironment = {
    getWorker(_moduleId: string, label: string) {
      if (label === 'json') {
        return new jsonWorker();
      }
      return new editorWorker();
    }
  };

  loader.config({ monaco });

  monaco.editor.defineTheme('pharmlab-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'keyword', foreground: '34D399' },
      { token: 'string', foreground: 'FBBF24' },
      { token: 'number', foreground: '38BDF8' },
      { token: 'type', foreground: 'A78BFA' }
    ],
    colors: {
      'editor.background': '#0B1120',
      'editor.foreground': '#E2E8F0',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#94A3B8',
      'editor.lineHighlightBackground': '#131C31',
      'editor.selectionBackground': '#10B98133',
      'editorCursor.foreground': '#34D399',
      'editorWidget.background': '#0F172A',
      'editorWidget.border': '#1E293B',
      'input.background': '#020617',
      'input.border': '#334155'
    }
  });

  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', ' ', '"', "'"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions: monaco.languages.CompletionItem[] = [];

      // CSV path autocomplete inside read_csv("...") or open("...")
      if (/['"][^'"]*$/.test(linePrefix)) {
        for (const csvPath of workspaceIntelliSense.csvPaths) {
          suggestions.push({
            label: csvPath,
            kind: monaco.languages.CompletionItemKind.File,
            detail: 'Workspace CSV/TSV dataset',
            insertText: csvPath,
            range
          });
        }
      }

      // Dot-completion on sibling Python module (e.g. pk_utils.)
      const dotModMatch = linePrefix.match(/([A-Za-z_][A-Za-z0-9_]*)\.$/);
      if (dotModMatch) {
        const modName = dotModMatch[1];
        const matchingModuleSyms = workspaceIntelliSense.symbols.filter(
          (s) => s.moduleName === modName || s.moduleName.endsWith(`.${modName}`)
        );
        for (const sym of matchingModuleSyms) {
          suggestions.push({
            label: sym.name,
            kind:
              sym.kind === 'function'
                ? monaco.languages.CompletionItemKind.Function
                : sym.kind === 'class'
                ? monaco.languages.CompletionItemKind.Class
                : monaco.languages.CompletionItemKind.Constant,
            detail: `${sym.filePath}:${sym.line}${sym.detail ? ` ${sym.detail}` : ''}`,
            insertText: sym.kind === 'function' ? `${sym.name}($1)` : sym.name,
            insertTextRules:
              sym.kind === 'function'
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
            range
          });
        }
      }

      for (const kw of PYTHON_KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range
        });
      }

      for (const fn of PYTHON_BUILTINS) {
        suggestions.push({
          label: fn,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: fn,
          range
        });
      }

      for (const item of SCIENTIFIC_COMPLETIONS) {
        suggestions.push({
          label: item.label,
          kind: item.isSnippet
            ? monaco.languages.CompletionItemKind.Snippet
            : monaco.languages.CompletionItemKind.Module,
          detail: item.detail,
          insertText: item.insertText,
          insertTextRules: item.isSnippet
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          range
        });
      }

      // Cross-file workspace symbols & local module names
      for (const [modName, filePath] of workspaceIntelliSense.moduleToPath.entries()) {
        suggestions.push({
          label: modName,
          kind: monaco.languages.CompletionItemKind.Module,
          detail: `Workspace module (${filePath})`,
          insertText: modName,
          range
        });
      }

      const seenWorkspaceSym = new Set<string>();
      for (const sym of workspaceIntelliSense.symbols) {
        const key = `${sym.filePath}:${sym.name}`;
        if (seenWorkspaceSym.has(key)) continue;
        seenWorkspaceSym.add(key);
        suggestions.push({
          label: sym.name,
          kind:
            sym.kind === 'function'
              ? monaco.languages.CompletionItemKind.Function
              : sym.kind === 'class'
              ? monaco.languages.CompletionItemKind.Class
              : monaco.languages.CompletionItemKind.Constant,
          detail: `${sym.filePath}:${sym.line}`,
          insertText: sym.name,
          range
        });
      }

      // Current file local identifiers
      const text = model.getValue();
      const seenLocal = new Set<string>();
      const matches = text.matchAll(
        /(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)|^([A-Za-z_][A-Za-z0-9_]*)\s*=/gm
      );
      for (const m of matches) {
        const sym = m[1] || m[2];
        if (sym && !seenLocal.has(sym)) {
          seenLocal.add(sym);
          suggestions.push({
            label: sym,
            kind: m[1]
              ? monaco.languages.CompletionItemKind.Function
              : monaco.languages.CompletionItemKind.Variable,
            detail: 'Current file symbol',
            insertText: sym,
            range
          });
        }
      }

      return { suggestions };
    }
  });

  // Cross-file Go-to-Definition (Ctrl+Click / F12)
  monaco.languages.registerDefinitionProvider('python', {
    provideDefinition(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const ident = word.word;

      // 1. Match cross-file module name
      const modPath = workspaceIntelliSense.moduleToPath.get(ident);
      if (modPath) {
        return {
          uri: monaco.Uri.parse(`file:///${modPath}`),
          range: new monaco.Range(1, 1, 1, 1)
        };
      }

      // 2. Match cross-file function / class / constant
      const currentPath = model.uri.path.replace(/^\/+/, '');
      const sym =
        workspaceIntelliSense.symbols.find(
          (s) => s.name === ident && s.filePath !== currentPath
        ) || workspaceIntelliSense.symbols.find((s) => s.name === ident);

      if (sym) {
        return {
          uri: monaco.Uri.parse(`file:///${sym.filePath}`),
          range: new monaco.Range(sym.line, 1, sym.line, 1)
        };
      }
      return null;
    }
  });

  monaco.editor.registerEditorOpener({
    openCodeEditor(_source, resource, selectionOrPosition) {
      const targetPath = resource.path.replace(/^\/+/, '');
      const line =
        selectionOrPosition && 'startLineNumber' in selectionOrPosition
          ? selectionOrPosition.startLineNumber
          : selectionOrPosition && 'lineNumber' in selectionOrPosition
          ? selectionOrPosition.lineNumber
          : 1;
      if (targetPath && workspaceIntelliSense.onOpenLocation) {
        workspaceIntelliSense.onOpenLocation(targetPath, line);
        return true;
      }
      return false;
    }
  });

  return monaco;
}
