import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import {
  CodeSymbolItem,
  DiagnosticMarker,
  ExecutionRecord,
  StudioFileKind,
  StudioNode
} from './types';

export interface TreeBranch {
  node: StudioNode;
  path: string;
  children: TreeBranch[];
}

export function inferFileKind(fileName: string): StudioFileKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) return 'csv';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  return 'text';
}

export function getMonacoLanguage(fileName: string): string {
  const kind = inferFileKind(fileName);
  if (kind === 'python') return 'python';
  if (kind === 'json') return 'json';
  if (kind === 'markdown') return 'markdown';
  return 'plaintext';
}

export function validateNodeName(rawName: string, siblingNames: string[]): string | null {
  const trimmed = rawName.trim();
  if (!trimmed) return 'Name cannot be empty.';
  if (trimmed === '.' || trimmed === '..') return 'Invalid name.';
  if (/[\\/:*?"<>|]/.test(trimmed)) return 'Name cannot contain \\ / : * ? " < > | characters.';
  if (siblingNames.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
    return `"${trimmed}" already exists in this folder.`;
  }
  return null;
}

export function getNodePath(nodeId: string, nodeMap: Map<string, StudioNode>): string {
  const parts: string[] = [];
  let cursor = nodeMap.get(nodeId);
  const guard = new Set<string>();
  while (cursor && !guard.has(cursor.id)) {
    guard.add(cursor.id);
    parts.unshift(cursor.name);
    cursor = cursor.parentId ? nodeMap.get(cursor.parentId) : undefined;
  }
  return parts.join('/');
}

export function buildProjectTree(nodes: StudioNode[]): {
  roots: TreeBranch[];
  pathById: Map<string, string>;
  idByPath: Map<string, string>;
} {
  const nodeMap = new Map<string, StudioNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const pathById = new Map<string, string>();
  const idByPath = new Map<string, string>();
  for (const n of nodes) {
    const p = getNodePath(n.id, nodeMap);
    pathById.set(n.id, p);
    idByPath.set(p, n.id);
  }

  const childrenMap = new Map<string | null, StudioNode[]>();
  for (const n of nodes) {
    const key = n.parentId ?? null;
    const arr = childrenMap.get(key) || [];
    arr.push(n);
    childrenMap.set(key, arr);
  }

  const sortNodes = (list: StudioNode[]) =>
    [...list].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const buildBranch = (parentId: string | null): TreeBranch[] => {
    const raw = sortNodes(childrenMap.get(parentId) || []);
    return raw.map((node) => ({
      node,
      path: pathById.get(node.id) || node.name,
      children: node.type === 'folder' ? buildBranch(node.id) : []
    }));
  };

  return {
    roots: buildBranch(null),
    pathById,
    idByPath
  };
}

export function collectDescendantIds(rootId: string, nodes: StudioNode[]): string[] {
  const result = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of nodes) {
      if (n.parentId && result.has(n.parentId) && !result.has(n.id)) {
        result.add(n.id);
        changed = true;
      }
    }
  }
  return Array.from(result);
}

export function extractPythonSymbols(code: string): CodeSymbolItem[] {
  const lines = code.split('\n');
  const items: CodeSymbolItem[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const lineText = lines[i];
    const fnMatch = lineText.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/);
    if (fnMatch) {
      items.push({
        name: fnMatch[1],
        kind: 'function',
        line: i + 1,
        detail: `(${fnMatch[2].trim()})`
      });
      continue;
    }
    const clsMatch = lineText.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (clsMatch) {
      items.push({
        name: clsMatch[1],
        kind: 'class',
        line: i + 1
      });
      continue;
    }
    const constMatch = lineText.match(/^([A-Z][A-Z0-9_]{2,})\s*=/);
    if (constMatch) {
      items.push({
        name: constMatch[1],
        kind: 'constant',
        line: i + 1
      });
    }
  }
  return items;
}

export interface WorkspaceSymbolEntry extends CodeSymbolItem {
  filePath: string;
  moduleName: string;
}

export function extractWorkspaceSymbols(
  files: Array<{ path: string; content: string }>
): {
  symbols: WorkspaceSymbolEntry[];
  moduleToPath: Map<string, string>;
  csvPaths: string[];
} {
  const symbols: WorkspaceSymbolEntry[] = [];
  const moduleToPath = new Map<string, string>();
  const csvPaths: string[] = [];

  for (const f of files) {
    const lower = f.path.toLowerCase();
    if (lower.endsWith('.csv') || lower.endsWith('.tsv')) {
      csvPaths.push(f.path);
      continue;
    }
    if (!lower.endsWith('.py')) continue;
    const modName = f.path.replace(/\.py$/i, '').replace(/\//g, '.');
    moduleToPath.set(modName, f.path);
    const shortName = modName.split('.').pop();
    if (shortName && !moduleToPath.has(shortName)) {
      moduleToPath.set(shortName, f.path);
    }

    for (const sym of extractPythonSymbols(f.content || '')) {
      symbols.push({
        ...sym,
        filePath: f.path,
        moduleName: modName
      });
    }
  }

  return { symbols, moduleToPath, csvPaths };
}

export function parseCsvData(
  content: string,
  isTsv = false
): { headers: string[]; rows: string[][] } {
  const delimiter = isTsv ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };
  const headers = nonEmpty[0];
  const body = nonEmpty.slice(1).map((r) => {
    if (r.length >= headers.length) return r;
    return [...r, ...Array(headers.length - r.length).fill('')];
  });
  return { headers, rows: body };
}

export function buildProjectZipBytes(
  nodes: StudioNode[]
): Uint8Array {
  const { pathById } = buildProjectTree(nodes);
  const zipEntries: Record<string, Uint8Array> = {};
  for (const node of nodes) {
    if (node.type !== 'file') continue;
    const relPath = pathById.get(node.id) || node.name;
    zipEntries[relPath] = strToU8(node.content ?? '');
  }
  return zipSync(zipEntries, { level: 6 });
}

export function parseZipToProjectFiles(
  bytes: Uint8Array
): Array<{ path: string; content: string }> {
  const raw = unzipSync(bytes);
  const entries = Object.entries(raw).filter(([name]) => {
    if (name.endsWith('/')) return false;
    if (name.includes('__MACOSX') || name.includes('__pycache__')) return false;
    return /\.(py|csv|tsv|json|txt|md|markdown)$/i.test(name);
  });

  if (entries.length === 0) return [];

  // Strip shared top-level wrapper folder if all entries sit under it
  const splitPaths = entries.map(([p]) => p.replace(/^\/+/, '').split('/').filter(Boolean));
  const firstDir = splitPaths[0]?.[0];
  const hasCommonWrapper =
    splitPaths.length > 1 &&
    Boolean(firstDir) &&
    splitPaths.every((parts) => parts.length > 1 && parts[0] === firstDir);

  return entries.map(([name, data]) => {
    const parts = name.replace(/^\/+/, '').split('/').filter(Boolean);
    const normalized = (hasCommonWrapper ? parts.slice(1) : parts).join('/');
    return {
      path: normalized || name,
      content: strFromU8(data)
    };
  });
}

export function pythonFileToIpynbJson(
  fileName: string,
  code: string,
  latestRecord?: ExecutionRecord | null
): string {
  const rawChunks = code.split(/^# %%.*$/m).map((s) => s.trimEnd());
  const codeCells = (rawChunks.length > 0 ? rawChunks : [code]).filter((c, idx) => idx === 0 || c.trim() !== '');

  const cells = codeCells.map((cellCode, idx) => {
    const isLast = idx === codeCells.length - 1;
    const outputs: Array<Record<string, unknown>> = [];

    if (isLast && latestRecord) {
      for (const art of latestRecord.artifacts) {
        if (art.kind === 'text') {
          outputs.push({
            output_type: 'stream',
            name: art.stream === 'stderr' ? 'stderr' : 'stdout',
            text: art.text.split('\n').map((l, i, arr) => (i < arr.length - 1 ? `${l}\n` : l))
          });
        } else if (art.kind === 'image') {
          const base64 = art.dataUrl.replace(/^data:image\/png;base64,/, '');
          outputs.push({
            output_type: 'display_data',
            data: {
              'image/png': base64,
              'text/plain': [`<Figure: ${art.caption || 'Plot'}>`]
            },
            metadata: {}
          });
        } else if (art.kind === 'traceback') {
          outputs.push({
            output_type: 'error',
            ename: art.errorType,
            evalue: art.message,
            traceback: art.rawText.split('\n')
          });
        }
      }
    }

    return {
      cell_type: 'code',
      execution_count: isLast && latestRecord ? 1 : null,
      metadata: {},
      outputs,
      source: cellCode.split('\n').map((l, i, arr) => (i < arr.length - 1 ? `${l}\n` : l))
    };
  });

  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: 'Python 3 (PharmLab Pyodide)',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        name: 'python',
        version: '3.12.7'
      },
      pharmlab_source: fileName
    },
    cells
  };

  return JSON.stringify(notebook, null, 2);
}

export function ipynbJsonToPythonScript(
  jsonText: string,
  fallbackName: string
): { fileName: string; content: string } | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !Array.isArray(parsed.cells)) return null;

    const blocks: string[] = [];
    for (const cell of parsed.cells) {
      const src = Array.isArray(cell.source)
        ? cell.source.join('')
        : typeof cell.source === 'string'
        ? cell.source
        : '';
      if (!src.trim()) continue;
      if (cell.cell_type === 'markdown') {
        const commented = src
          .split('\n')
          .map((line: string) => `# ${line}`)
          .join('\n');
        blocks.push(`# %% [markdown]\n${commented}`);
      } else if (cell.cell_type === 'code') {
        blocks.push(`# %%\n${src.replace(/\s+$/, '')}`);
      }
    }

    const base = fallbackName.replace(/\.ipynb$/i, '') || 'imported_notebook';
    return {
      fileName: `${base}.py`,
      content: `${blocks.join('\n\n')}\n`
    };
  } catch {
    return null;
  }
}

export function runFastJsPythonLint(code: string, filePath: string): DiagnosticMarker[] {
  const markers: DiagnosticMarker[] = [];
  const lines = code.split('\n');
  let sawSpaceIndent = false;
  let sawTabIndent = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\t+/.test(line)) sawTabIndent = true;
    if (/^ +/.test(line)) sawSpaceIndent = true;
    if (sawSpaceIndent && sawTabIndent && /^\t+ |^ +\t/.test(line)) {
      markers.push({
        filePath,
        line: i + 1,
        column: 1,
        endColumn: line.length + 1,
        message: 'TabError: Inconsistent mix of tabs and spaces in indentation.',
        severity: 'error'
      });
    }
  }

  return markers;
}
