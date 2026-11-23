import { runFastJsPythonLint } from './studioUtils';
import {
  CustomPackageInfo,
  DebugSnapshot,
  DiagnosticMarker,
  OutputArtifact,
  PackageId,
  PackageStatusInfo,
  PyodideRuntimeStatus,
  TracebackFrame,
  VariableDetail,
  WorkspaceVariableInfo
} from './types';

export interface StudioFileInput {
  path: string;
  content: string;
}

export type DebugStepPlanAction = 'entry' | 'into' | 'over' | 'out' | 'continue';

export interface DebugConfigInput {
  breakpointsByFile: Record<string, number[]>;
  stepPlan: DebugStepPlanAction[];
  watchExprs: string[];
}

export interface ExecutionResponse {
  status: 'success' | 'error' | 'interrupted' | 'awaiting_input' | 'paused';
  durationMs: number;
  stdout: string;
  stderr: string;
  replResult: string | null;
  artifacts: OutputArtifact[];
  variables: WorkspaceVariableInfo[];
  modifiedFiles: StudioFileInput[];
  diagnostics: DiagnosticMarker[];
  inputPrompt?: string | null;
  debugSnapshot?: DebugSnapshot | null;
  errorMessage?: string;
}

export interface RuntimeSnapshot {
  status: PyodideRuntimeStatus;
  pythonVersion: string;
  pyodideVersion: string;
  statusDetail: string;
  lastError: string | null;
  supportsSoftInterrupt: boolean;
  packages: PackageStatusInfo[];
  customPackages: CustomPackageInfo[];
  variables: WorkspaceVariableInfo[];
  diagnostics: DiagnosticMarker[];
}

const INITIAL_PACKAGES: PackageStatusInfo[] = [
  {
    id: 'numpy',
    label: 'NumPy',
    description: 'N-dimensional arrays, vectorized pharmacokinetics & linear algebra',
    version: '2.0.2',
    status: 'not_loaded'
  },
  {
    id: 'pandas',
    label: 'Pandas',
    description: 'DataFrames, clinical datasets, CSV parsing & grouped statistics',
    version: '2.2.3',
    status: 'not_loaded'
  },
  {
    id: 'matplotlib',
    label: 'Matplotlib',
    description: 'Publication-grade plots rendered inline via Agg PNG backend',
    version: '3.8.4',
    status: 'not_loaded'
  },
  {
    id: 'scipy',
    label: 'SciPy',
    description: 'Non-linear curve fitting, ODE solvers, statistical intervals & integration',
    version: '1.14.1',
    status: 'not_loaded'
  },
  {
    id: 'sympy',
    label: 'SymPy',
    description: 'Symbolic algebra, chemical equilibrium & differential equations',
    version: '1.13.3',
    status: 'not_loaded'
  }
];

const INITIAL_CUSTOM_PACKAGES: CustomPackageInfo[] = [
  { name: 'scikit-learn', status: 'not_loaded', source: 'micropip' },
  { name: 'statsmodels', status: 'not_loaded', source: 'micropip' },
  { name: 'seaborn', status: 'not_loaded', source: 'micropip' },
  { name: 'openpyxl', status: 'not_loaded', source: 'micropip' },
  { name: 'tabulate', status: 'not_loaded', source: 'micropip' }
];

function makeArtifactId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

class PyodideStudioRuntimeManager {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (val: any) => void;
      reject: (err: Error) => void;
      onStream?: (stream: 'stdout' | 'stderr', text: string) => void;
      activeFilePath?: string;
      startedAt: number;
    }
  >();

  private interruptBuffer: SharedArrayBuffer | null = null;
  private interruptView: Uint8Array | null = null;

  private listeners = new Set<(snapshot: RuntimeSnapshot) => void>();

  private state: RuntimeSnapshot = {
    status: 'idle',
    pythonVersion: '3.12.7',
    pyodideVersion: '0.27.5',
    statusDetail: 'Click Run or initialize runtime to load Python WebAssembly',
    lastError: null,
    supportsSoftInterrupt:
      typeof SharedArrayBuffer !== 'undefined' &&
      Boolean((globalThis as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated),
    packages: INITIAL_PACKAGES.map((p) => ({ ...p })),
    customPackages: INITIAL_CUSTOM_PACKAGES.map((p) => ({ ...p })),
    variables: [],
    diagnostics: []
  };

  getSnapshot(): RuntimeSnapshot {
    return this.state;
  }

  subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(patch: Partial<RuntimeSnapshot>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private updatePackageState(
    packageId: string,
    status: PackageStatusInfo['status'],
    error?: string
  ) {
    const nextPackages = this.state.packages.map((pkg) =>
      pkg.id === packageId ? { ...pkg, status, error } : pkg
    );
    const loadingPkg = nextPackages.find((p) => p.status === 'loading');
    this.emit({
      packages: nextPackages,
      status: loadingPkg
        ? 'loading_package'
        : this.state.status === 'loading_package'
        ? 'executing'
        : this.state.status,
      statusDetail: loadingPkg
        ? `Loading ${loadingPkg.label} (${loadingPkg.version}) from Pyodide CDN...`
        : this.state.statusDetail
    });
  }

  private updateCustomPackageState(
    name: string,
    status: CustomPackageInfo['status'],
    error?: string
  ) {
    const exists = this.state.customPackages.some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    const nextCustom = exists
      ? this.state.customPackages.map((p) =>
          p.name.toLowerCase() === name.toLowerCase() ? { ...p, status, error } : p
        )
      : [...this.state.customPackages, { name, status, error, source: 'micropip' as const }];

    this.emit({
      customPackages: nextCustom,
      status: status === 'loading' ? 'loading_package' : this.state.status,
      statusDetail:
        status === 'loading' ? `Installing ${name} via micropip...` : this.state.statusDetail
    });
  }

  private spawnWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (
      typeof SharedArrayBuffer !== 'undefined' &&
      Boolean((globalThis as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated)
    ) {
      this.interruptBuffer = new SharedArrayBuffer(4);
      this.interruptView = new Uint8Array(this.interruptBuffer);
    } else {
      this.interruptBuffer = null;
      this.interruptView = null;
    }

    this.worker = new Worker(new URL('./pyodideWorker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (event: MessageEvent<any>) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'package_status') {
        this.updatePackageState(msg.packageId, msg.status, msg.error);
        return;
      }

      if (msg.type === 'custom_package_status') {
        this.updateCustomPackageState(msg.name, msg.status, msg.error);
        return;
      }

      if (msg.type === 'stream') {
        const pending = this.pendingRequests.get(msg.runId);
        pending?.onStream?.(msg.stream, msg.text);
        return;
      }

      const pending = msg.id ? this.pendingRequests.get(msg.id) : undefined;
      if (!pending) return;
      this.pendingRequests.delete(msg.id);

      if (msg.type === 'worker_error') {
        pending.reject(new Error(msg.error || 'Worker execution failed.'));
        return;
      }

      pending.resolve(msg);
    };

    this.worker.onerror = (err) => {
      const message = err.message || 'Pyodide Web Worker crashed or failed to load.';
      for (const [, pending] of this.pendingRequests) {
        pending.reject(new Error(message));
      }
      this.pendingRequests.clear();
      this.initPromise = null;
      this.emit({
        status: 'error',
        lastError: message,
        statusDetail: 'Worker error — check network connection or restart runtime'
      });
    };
  }

  private sendWorkerRequest(
    payload: Record<string, unknown>,
    onStream?: (stream: 'stdout' | 'stderr', text: string) => void
  ): Promise<any> {
    if (!this.worker) {
      this.spawnWorker();
    }
    const id = makeArtifactId('req');
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve,
        reject,
        onStream,
        startedAt: performance.now()
      });
      this.worker!.postMessage({ ...payload, id });
    });
  }

  async ensureInitialized(): Promise<void> {
    if (
      this.worker &&
      this.state.status !== 'idle' &&
      this.state.status !== 'error' &&
      !this.initPromise
    ) {
      return;
    }
    if (this.initPromise) return this.initPromise;

    this.emit({
      status: 'initializing',
      lastError: null,
      statusDetail: 'Downloading Python 3.12 WebAssembly runtime...'
    });

    this.initPromise = (async () => {
      try {
        if (!this.worker) {
          this.spawnWorker();
        }
        const res = await this.sendWorkerRequest({
          type: 'init',
          interruptBuffer: this.interruptView || undefined
        });
        this.emit({
          status: 'ready',
          pythonVersion: res.pythonVersion || '3.12.7',
          pyodideVersion: res.pyodideVersion || '0.27.5',
          statusDetail: `Python ${res.pythonVersion || '3.12.7'} WebAssembly Ready`,
          lastError: null
        });
      } catch (err: any) {
        this.initPromise = null;
        this.emit({
          status: 'error',
          lastError: err?.message || 'Failed to load Pyodide WebAssembly CDN.',
          statusDetail: 'Pyodide CDN unreachable — offline or blocked by network'
        });
        throw err;
      }
    })();

    return this.initPromise;
  }

  async loadPackages(packageIds: PackageId[]): Promise<void> {
    await this.ensureInitialized();
    const prevDetail = this.state.statusDetail;
    this.emit({
      status: 'loading_package',
      statusDetail: `Installing ${packageIds.join(', ')}...`
    });
    try {
      await this.sendWorkerRequest({ type: 'load_packages', packages: packageIds });
      this.emit({
        status: 'ready',
        statusDetail: `Python ${this.state.pythonVersion} WebAssembly Ready`
      });
    } catch (err: any) {
      this.emit({
        status: 'ready',
        statusDetail: prevDetail,
        lastError: err?.message || String(err)
      });
      throw err;
    }
  }

  async installCustomPackages(packageNames: string[]): Promise<void> {
    const clean = packageNames.map((p) => p.trim()).filter(Boolean);
    if (clean.length === 0) return;
    await this.ensureInitialized();
    const prevDetail = this.state.statusDetail;
    this.emit({
      status: 'loading_package',
      statusDetail: `micropip.install(${clean.join(', ')})...`
    });
    try {
      await this.sendWorkerRequest({
        type: 'install_custom_packages',
        packages: clean
      });
      this.emit({
        status: 'ready',
        statusDetail: `Installed ${clean.join(', ')} via micropip`
      });
    } catch (err: any) {
      this.emit({
        status: 'ready',
        statusDetail: prevDetail,
        lastError: err?.message || String(err)
      });
      throw err;
    }
  }

  async inspectVariableDetail(name: string): Promise<VariableDetail> {
    await this.ensureInitialized();
    const msg = await this.sendWorkerRequest({
      type: 'inspect_variable_detail',
      name
    });
    return msg.detail as VariableDetail;
  }

  async checkLiveDiagnostics(code: string, filePath: string): Promise<DiagnosticMarker[]> {
    const jsMarkers = runFastJsPythonLint(code, filePath);
    if (!this.worker || this.state.status !== 'ready') {
      return jsMarkers;
    }
    try {
      const res = await this.sendWorkerRequest({
        type: 'check_diagnostics',
        code,
        filePath
      });
      const pyMarkers: DiagnosticMarker[] = Array.isArray(res.diagnostics) ? res.diagnostics : [];
      return [...pyMarkers, ...jsMarkers];
    } catch {
      return jsMarkers;
    }
  }

  async execute(params: {
    mode: 'file' | 'selection' | 'repl';
    code: string;
    filePath?: string;
    files: StudioFileInput[];
    stdinResponses?: string[];
    debugConfig?: DebugConfigInput;
    onStream?: (stream: 'stdout' | 'stderr', text: string) => void;
  }): Promise<ExecutionResponse> {
    const startedAt = performance.now();
    await this.ensureInitialized();

    if (this.interruptView) {
      this.interruptView[0] = 0;
    }

    this.emit({
      status: 'executing',
      statusDetail:
        params.mode === 'repl'
          ? 'Evaluating interactive command...'
          : params.debugConfig
          ? `Debugging ${params.filePath || 'script'}...`
          : `Running ${params.filePath || 'selection'}...`,
      lastError: null
    });

    try {
      const msg = await this.sendWorkerRequest(
        {
          type: 'execute',
          mode: params.mode,
          code: params.code,
          filePath: params.filePath,
          files: params.files,
          stdinResponses: params.stdinResponses,
          debugConfig: params.debugConfig
        },
        params.onStream
      );

      const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
      const raw = msg.result;
      const artifacts: OutputArtifact[] = [];

      if (raw.stdout && raw.stdout.trim().length > 0) {
        artifacts.push({
          id: makeArtifactId('out'),
          kind: 'text',
          stream: 'stdout',
          text: raw.stdout
        });
      }

      if (raw.replResult !== null && raw.replResult !== undefined) {
        artifacts.push({
          id: makeArtifactId('res'),
          kind: 'text',
          stream: 'stdout',
          text: raw.replResult
        });
      }

      if (Array.isArray(raw.tables)) {
        for (const tbl of raw.tables) {
          artifacts.push({
            id: makeArtifactId('tbl'),
            kind: 'table',
            title: tbl.title,
            columns: tbl.columns,
            rows: tbl.rows,
            shape: tbl.shape,
            truncated: tbl.truncated
          });
        }
      }

      if (Array.isArray(raw.images)) {
        for (const img of raw.images) {
          artifacts.push({
            id: makeArtifactId('img'),
            kind: 'image',
            mimeType: 'image/png',
            dataUrl: img.dataUrl,
            caption: img.caption
          });
        }
      }

      if (raw.stderr && raw.stderr.trim().length > 0) {
        artifacts.push({
          id: makeArtifactId('err'),
          kind: 'text',
          stream: 'stderr',
          text: raw.stderr
        });
      }

      const diagnostics: DiagnosticMarker[] = [];
      if (raw.traceback) {
        const tb = raw.traceback;
        artifacts.push({
          id: makeArtifactId('tb'),
          kind: 'traceback',
          errorType: tb.errorType || 'Error',
          message: tb.message || 'Execution error',
          rawText: tb.rawText || '',
          frames: (tb.frames || []) as TracebackFrame[],
          primaryFile: tb.primaryFile,
          primaryLine: tb.primaryLine,
          primaryColumn: tb.primaryColumn
        });

        if (tb.primaryLine && typeof tb.primaryFile === 'string') {
          const cleanPath = tb.primaryFile.startsWith('/workspace/')
            ? tb.primaryFile.slice('/workspace/'.length)
            : params.filePath || tb.primaryFile;
          diagnostics.push({
            filePath: cleanPath,
            line: Math.max(1, Number(tb.primaryLine)),
            column: Math.max(1, Number(tb.primaryColumn || 1)),
            endColumn: Math.max(2, Number(tb.primaryColumn || 1) + 20),
            message: `${tb.errorType || 'Error'}: ${tb.message || 'Execution error'}`,
            severity: 'error'
          });
        }
      }

      const loadedSet = new Set<string>(raw.loadedPackages || []);
      const nextPackages = this.state.packages.map((p) => ({
        ...p,
        status: loadedSet.has(p.id) ? ('loaded' as const) : p.status === 'error' ? 'error' : 'not_loaded'
      }));

      const customSet = new Set<string>(raw.customPackages || []);
      const nextCustom = this.state.customPackages.map((cp) =>
        customSet.has(cp.name) ? { ...cp, status: 'loaded' as const } : cp
      );

      const finalStatus: ExecutionResponse['status'] =
        raw.status === 'awaiting_input'
          ? 'awaiting_input'
          : raw.status === 'paused'
          ? 'paused'
          : raw.status === 'error'
          ? 'error'
          : 'success';

      this.emit({
        status: 'ready',
        statusDetail:
          finalStatus === 'awaiting_input'
            ? 'Waiting for Python input()...'
            : finalStatus === 'paused'
            ? `Paused at line ${raw.debugSnapshot?.line ?? '?'}`
            : finalStatus === 'error'
            ? `Completed with ${raw.traceback?.errorType || 'error'} (${durationMs} ms)`
            : `Completed in ${durationMs} ms`,
        packages: nextPackages,
        customPackages: nextCustom,
        variables: raw.variables || [],
        diagnostics
      });

      return {
        status: finalStatus,
        durationMs,
        stdout: raw.stdout || '',
        stderr: raw.stderr || '',
        replResult: raw.replResult ?? null,
        artifacts,
        variables: raw.variables || [],
        modifiedFiles: raw.modifiedFiles || [],
        diagnostics,
        inputPrompt: raw.inputPrompt ?? null,
        debugSnapshot: raw.debugSnapshot ?? null
      };
    } catch (err: any) {
      const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
      if (err?.message === '__PHARMLAB_INTERRUPTED__') {
        return {
          status: 'interrupted',
          durationMs,
          stdout: '',
          stderr: 'Execution stopped by user.',
          replResult: null,
          artifacts: [
            {
              id: makeArtifactId('int'),
              kind: 'text',
              stream: 'system',
              text: 'Execution stopped. WebAssembly worker was restarted cleanly.'
            }
          ],
          variables: this.state.variables,
          modifiedFiles: [],
          diagnostics: []
        };
      }

      const msgText = err?.message || String(err);
      this.emit({
        status: 'ready',
        statusDetail: `Execution failed (${durationMs} ms)`,
        lastError: msgText
      });

      return {
        status: 'error',
        durationMs,
        stdout: '',
        stderr: msgText,
        replResult: null,
        artifacts: [
          {
            id: makeArtifactId('sys_err'),
            kind: 'text',
            stream: 'stderr',
            text: msgText
          }
        ],
        variables: this.state.variables,
        modifiedFiles: [],
        diagnostics: [],
        errorMessage: msgText
      };
    }
  }

  async interruptExecution(): Promise<'sigint' | 'worker_restarted'> {
    if (this.interruptView && this.state.supportsSoftInterrupt) {
      this.interruptView[0] = 2; // SIGINT
      return 'sigint';
    }

    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error('__PHARMLAB_INTERRUPTED__'));
    }
    this.pendingRequests.clear();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initPromise = null;
    this.emit({
      status: 'initializing',
      packages: INITIAL_PACKAGES.map((p) => ({ ...p })),
      customPackages: INITIAL_CUSTOM_PACKAGES.map((p) => ({ ...p })),
      variables: [],
      diagnostics: [],
      statusDetail: 'Restarting Python WebAssembly runtime after stop...'
    });
    await this.ensureInitialized();
    return 'worker_restarted';
  }

  async resetSession(): Promise<void> {
    await this.ensureInitialized();
    await this.sendWorkerRequest({ type: 'reset_session' });
    this.emit({
      variables: [],
      diagnostics: [],
      statusDetail: 'Python globals namespace cleared'
    });
  }
}

let singletonRuntime: PyodideStudioRuntimeManager | null = null;

export function getPyodideStudioRuntime(): PyodideStudioRuntimeManager {
  if (!singletonRuntime) {
    singletonRuntime = new PyodideStudioRuntimeManager();
  }
  return singletonRuntime;
}
