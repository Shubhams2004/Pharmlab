import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker.js?worker';

let isConfigured = false;

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
    insertText: 'fig, ax = plt.subplots(figsize=(${1:7.5}, ${2:4.2}))\nax.plot(${3:x}, ${4:y})\nax.set_title("${5:Title}")\nax.grid(True, alpha=0.35)\nplt.tight_layout()\nplt.show()',
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
    triggerCharacters: ['.', ' '],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions: monaco.languages.CompletionItem[] = [];

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

      // Extract local identifiers from current file for quick variable/function autocomplete
      const text = model.getValue();
      const seenLocal = new Set<string>();
      const matches = text.matchAll(/(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)|^([A-Za-z_][A-Za-z0-9_]*)\s*=/gm);
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

  return monaco;
}
