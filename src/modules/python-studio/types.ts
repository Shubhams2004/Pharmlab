export type StudioFileKind = 'python' | 'csv' | 'json' | 'markdown' | 'text';

export type PackageId = 'numpy' | 'pandas' | 'matplotlib' | 'scipy' | 'sympy';

export type PackageLoadState = 'not_loaded' | 'loading' | 'loaded' | 'error';

export type PyodideRuntimeStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'loading_package'
  | 'executing'
  | 'error';

export interface StudioNode {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: 'folder' | 'file';
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudioProject {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  createdAt: number;
  updatedAt: number;
  activeFileId: string | null;
  openTabIds: string[];
}

export interface EditorPreferences {
  fontSize: number;
  theme: 'vs-dark' | 'vs' | 'hc-black';
  tabSize: 2 | 4;
  wordWrap: 'on' | 'off';
  minimap: boolean;
}

export interface TracebackFrame {
  filename: string;
  line: number;
  functionName: string;
  codeLine?: string;
}

export type OutputArtifact =
  | {
      id: string;
      kind: 'text';
      stream: 'stdout' | 'stderr' | 'system';
      text: string;
    }
  | {
      id: string;
      kind: 'traceback';
      errorType: string;
      message: string;
      rawText: string;
      frames: TracebackFrame[];
      primaryFile?: string;
      primaryLine?: number;
      primaryColumn?: number;
    }
  | {
      id: string;
      kind: 'image';
      mimeType: 'image/png';
      dataUrl: string;
      caption?: string;
    }
  | {
      id: string;
      kind: 'table';
      title?: string;
      columns: string[];
      rows: (string | number | boolean | null)[][];
      shape: [number, number];
      truncated?: boolean;
    };

export interface TerminalEntry {
  id: string;
  timestamp: number;
  kind: 'input' | 'stdout' | 'stderr' | 'result' | 'system' | 'error';
  text: string;
  executionMs?: number;
}

export interface ExecutionRecord {
  id: string;
  projectId: string;
  timestamp: number;
  mode: 'file' | 'selection' | 'repl';
  filePath?: string;
  codePreview: string;
  durationMs: number;
  status: 'success' | 'error' | 'interrupted';
  artifacts: OutputArtifact[];
}

export interface WorkspaceVariableInfo {
  name: string;
  typeName: string;
  summary: string;
  shape?: string;
}

export interface VariableDetail {
  name: string;
  typeName: string;
  shape?: string;
  dtype?: string;
  summary: string;
  kind: 'table' | 'array' | 'json' | 'text';
  table?: {
    title?: string;
    columns: string[];
    rows: (string | number | boolean | null)[][];
    shape: [number, number];
    truncated?: boolean;
  };
  arrayStats?: {
    min: number | null;
    max: number | null;
    mean: number | null;
    std: number | null;
    nanCount: number;
  };
  arrayPreview?: Array<string | number | boolean | null>;
  rawText?: string;
}

export interface DiagnosticMarker {
  filePath: string;
  line: number;
  column: number;
  endColumn: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface PackageStatusInfo {
  id: PackageId;
  label: string;
  description: string;
  version: string;
  status: PackageLoadState;
  error?: string;
}

export interface CustomPackageInfo {
  name: string;
  status: PackageLoadState;
  error?: string;
  source: 'micropip' | 'pyodide';
}

export interface DebugStackFrame {
  filePath: string;
  functionName: string;
  line: number;
  locals: WorkspaceVariableInfo[];
}

export type DebugStepMode = 'into' | 'over' | 'out' | 'continue';

export interface DebugWatchResult {
  expr: string;
  value?: string;
  error?: string;
}

export interface DebugSnapshot {
  paused: boolean;
  filePath: string;
  line: number;
  stepCount: number;
  callStack: DebugStackFrame[];
  locals: WorkspaceVariableInfo[];
  watches: DebugWatchResult[];
}

export interface CodeSymbolItem {
  name: string;
  kind: 'function' | 'class' | 'constant';
  line: number;
  detail?: string;
}

export interface WorkspaceContextSnapshot {
  projectId: string;
  projectName: string;
  activeFilePath: string | null;
  activeFileContent: string | null;
  selectionCode: string | null;
  filesSummary: Array<{
    path: string;
    kind: StudioFileKind;
    sizeBytes: number;
    lineCount: number;
  }>;
  runtimeStatus: PyodideRuntimeStatus;
  pythonVersion: string;
  loadedPackages: string[];
  variables: WorkspaceVariableInfo[];
  diagnostics: DiagnosticMarker[];
  recentErrors: string[];
}

export interface ProposedFilePatch {
  targetPath: string;
  description: string;
  newContent: string;
}

/**
 * Programmatic workspace adapter designed for future AI / Claude-Code-style assistant integration.
 * No AI agents or external LLM calls are implemented in this milestone.
 */
export interface StudioAssistantBridge {
  getWorkspaceSnapshot: () => WorkspaceContextSnapshot | null;
  readFile: (path: string) => string | null;
  listFilePaths: () => string[];
  getDiagnostics: () => DiagnosticMarker[];
  applyFilePatch: (patch: ProposedFilePatch) => Promise<boolean>;
  createFile: (path: string, content: string) => Promise<boolean>;
}
