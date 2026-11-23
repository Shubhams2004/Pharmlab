import { CodeSymbolItem, StudioFileKind, StudioNode } from './types';

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
