/// <reference lib="webworker" />

export {};

const PYODIDE_VERSION = '0.27.5';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const SCIENTIFIC_PACKAGES = new Set(['numpy', 'pandas', 'matplotlib', 'scipy', 'sympy']);

interface WorkerFileEntry {
  path: string;
  content: string;
}

type WorkerRequest =
  | { id: string; type: 'init'; interruptBuffer?: Uint8Array }
  | { id: string; type: 'load_packages'; packages: string[] }
  | {
      id: string;
      type: 'execute';
      mode: 'file' | 'selection' | 'repl';
      code: string;
      filePath?: string;
      files: WorkerFileEntry[];
    }
  | { id: string; type: 'inspect_vars' }
  | { id: string; type: 'reset_session' };

let pyodide: any = null;
let loadedPackages = new Set<string>();
let pythonVersion = '3.12.7';

function postMsg(payload: Record<string, unknown>) {
  self.postMessage(payload);
}

const PRELUDE_PYTHON = `
import os
import sys
import io
import ast
import json
import base64
import importlib
import traceback

os.environ["MPLBACKEND"] = "Agg"
os.makedirs("/workspace", exist_ok=True)
if "/workspace" not in sys.path:
    sys.path.insert(0, "/workspace")
os.chdir("/workspace")

if "_pharmlab_ns" not in globals():
    _pharmlab_ns = {"__name__": "__main__"}

_pharmlab_pending_tables = []

class _PharmLabStream:
    def __init__(self, stream_name, cb):
        self.stream_name = stream_name
        self.cb = cb
        self.buffer = io.StringIO()

    def write(self, text):
        if text:
            self.buffer.write(text)
            if self.cb is not None:
                try:
                    self.cb(self.stream_name, text)
                except Exception:
                    pass
        return len(text) if text else 0

    def flush(self):
        pass

    def isatty(self):
        return False

def _pharmlab_serialize_df(obj, title=None):
    try:
        import pandas as pd
    except Exception:
        return None

    if isinstance(obj, pd.Series):
        df = obj.to_frame(name=obj.name if obj.name is not None else "value")
        df = df.reset_index()
    elif isinstance(obj, pd.DataFrame):
        df = obj.copy()
        if not isinstance(df.index, pd.RangeIndex) or df.index.name is not None:
            df = df.reset_index()
    else:
        return None

    total_rows, total_cols = int(df.shape[0]), int(df.shape[1])
    max_rows, max_cols = 120, 24
    truncated = total_rows > max_rows or total_cols > max_cols
    sub = df.iloc[:max_rows, :max_cols]
    cols = [str(c) for c in sub.columns.tolist()]
    rows = []
    for _, row in sub.iterrows():
        out_row = []
        for val in row.tolist():
            if val is None:
                out_row.append(None)
            elif hasattr(val, "item") and callable(val.item):
                try:
                    v = val.item()
                    out_row.append(None if (isinstance(v, float) and v != v) else v)
                except Exception:
                    out_row.append(str(val))
            elif isinstance(val, float) and val != val:
                out_row.append(None)
            elif isinstance(val, (int, float, bool, str)):
                out_row.append(val)
            else:
                out_row.append(str(val))
        rows.append(out_row)

    return {
        "title": title or f"DataFrame ({total_rows} × {total_cols})",
        "columns": cols,
        "rows": rows,
        "shape": [total_rows, total_cols],
        "truncated": truncated,
    }

def _pharmlab_display(*objs, title=None):
    for obj in objs:
        tbl = _pharmlab_serialize_df(obj, title=title)
        if tbl is not None:
            _pharmlab_pending_tables.append(tbl)
        else:
            print(repr(obj) if not isinstance(obj, str) else obj)

_pharmlab_ns["display"] = _pharmlab_display

def _pharmlab_capture_figures():
    images = []
    if "matplotlib.pyplot" in sys.modules:
        plt = sys.modules["matplotlib.pyplot"]
        fignums = list(plt.get_fignums())
        for idx, num in enumerate(fignums, 1):
            fig = plt.figure(num)
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=140, bbox_inches="tight", facecolor="#ffffff")
            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode("ascii")
            caption = ""
            try:
                if fig._suptitle and fig._suptitle.get_text():
                    caption = fig._suptitle.get_text()
                elif fig.axes and fig.axes[0].get_title():
                    caption = fig.axes[0].get_title()
            except Exception:
                caption = ""
            images.append({
                "mimeType": "image/png",
                "dataUrl": f"data:image/png;base64,{b64}",
                "caption": caption or f"Figure {idx}",
            })
        if fignums:
            plt.close("all")
    return images

def _pharmlab_hook_matplotlib():
    if "matplotlib.pyplot" in sys.modules:
        plt = sys.modules["matplotlib.pyplot"]
        if not getattr(plt.show, "_pharmlab_hooked", False):
            def _noop_show(*args, **kwargs):
                pass
            _noop_show._pharmlab_hooked = True
            plt.show = _noop_show

def _pharmlab_invalidate_workspace_modules():
    to_drop = []
    for mod_name, mod in list(sys.modules.items()):
        mod_file = getattr(mod, "__file__", None)
        if isinstance(mod_file, str) and mod_file.startswith("/workspace/"):
            to_drop.append(mod_name)
    for mod_name in to_drop:
        sys.modules.pop(mod_name, None)
    importlib.invalidate_caches()

def _pharmlab_inspect_variables():
    items = []
    for name, val in _pharmlab_ns.items():
        if name.startswith("_") or name == "display":
            continue
        t_name = type(val).__name__
        if t_name in ("module", "function", "type", "builtin_function_or_method"):
            continue
        shape = None
        if hasattr(val, "shape"):
            try:
                shape = str(tuple(val.shape))
            except Exception:
                shape = None
        elif isinstance(val, (list, tuple, dict, set)):
            shape = f"len={len(val)}"
        try:
            rep = repr(val)
            if len(rep) > 90:
                rep = rep[:87] + "..."
        except Exception:
            rep = f"<{t_name}>"
        items.append({
            "name": name,
            "typeName": t_name,
            "summary": rep,
            "shape": shape,
        })
    return json.dumps(items)

def _pharmlab_run(code_str, mode, file_path, stream_cb):
    global _pharmlab_pending_tables
    _pharmlab_pending_tables = []

    old_stdout, old_stderr = sys.stdout, sys.stderr
    out_stream = _PharmLabStream("stdout", stream_cb)
    err_stream = _PharmLabStream("stderr", stream_cb)
    sys.stdout = out_stream
    sys.stderr = err_stream

    _pharmlab_invalidate_workspace_modules()

    virtual_name = f"/workspace/{file_path}" if file_path else "<workspace>"
    _pharmlab_ns["__name__"] = "__main__"
    _pharmlab_ns["__file__"] = virtual_name
    _pharmlab_ns["display"] = _pharmlab_display

    status = "success"
    repl_result = None
    tb_payload = None

    try:
        if mode == "repl":
            tree = ast.parse(code_str, "<repl>", "exec")
            if tree.body and isinstance(tree.body[-1], ast.Expr):
                lead = ast.Module(body=tree.body[:-1], type_ignores=[])
                tail = ast.Expression(body=tree.body[-1].value)
                if lead.body:
                    exec(compile(lead, "<repl>", "exec"), _pharmlab_ns, _pharmlab_ns)
                val = eval(compile(tail, "<repl>", "eval"), _pharmlab_ns, _pharmlab_ns)
                if val is not None:
                    tbl = _pharmlab_serialize_df(val)
                    if tbl is not None:
                        _pharmlab_pending_tables.append(tbl)
                    else:
                        repl_result = repr(val)
            else:
                exec(compile(tree, "<repl>", "exec"), _pharmlab_ns, _pharmlab_ns)
        else:
            compiled = compile(code_str, virtual_name, "exec")
            exec(compiled, _pharmlab_ns, _pharmlab_ns)
        _pharmlab_hook_matplotlib()
    except SyntaxError as exc:
        status = "error"
        raw_tb = traceback.format_exc()
        tb_payload = {
            "errorType": type(exc).__name__,
            "message": exc.msg or str(exc),
            "rawText": raw_tb,
            "frames": [{
                "filename": exc.filename or virtual_name,
                "line": int(exc.lineno or 1),
                "functionName": "<module>",
                "codeLine": (exc.text or "").rstrip("\\n"),
            }],
            "primaryFile": exc.filename or virtual_name,
            "primaryLine": int(exc.lineno or 1),
            "primaryColumn": int(exc.offset or 1),
        }
    except BaseException as exc:
        status = "error"
        raw_tb = traceback.format_exc()
        extracted = traceback.extract_tb(exc.__traceback__)
        frames = []
        primary_file = virtual_name
        primary_line = None
        for fr in extracted:
            if fr.filename == "<exec>" or "pyodide" in fr.filename:
                continue
            frames.append({
                "filename": fr.filename,
                "line": int(fr.lineno or 1),
                "functionName": fr.name,
                "codeLine": fr.line or "",
            })
            if fr.filename.startswith("/workspace/") or fr.filename in ("<repl>", "<workspace>"):
                primary_file = fr.filename
                primary_line = int(fr.lineno or 1)
        if primary_line is None and frames:
            primary_file = frames[-1]["filename"]
            primary_line = frames[-1]["line"]
        tb_payload = {
            "errorType": type(exc).__name__,
            "message": str(exc),
            "rawText": raw_tb,
            "frames": frames,
            "primaryFile": primary_file,
            "primaryLine": primary_line,
            "primaryColumn": 1,
        }
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    images = []
    try:
        images = _pharmlab_capture_figures()
    except Exception as cap_err:
        err_stream.buffer.write(f"\\n[Figure capture error: {cap_err}]\\n")

    return json.dumps({
        "status": status,
        "stdout": out_stream.buffer.getvalue(),
        "stderr": err_stream.buffer.getvalue(),
        "replResult": repl_result,
        "tables": _pharmlab_pending_tables,
        "images": images,
        "traceback": tb_payload,
    })
`;

function syncWorkspaceFiles(files: WorkerFileEntry[]) {
  if (!pyodide) return;
  const FS = pyodide.FS;
  const workspaceRoot = '/workspace';

  // Clean existing files inside /workspace cleanly
  const removeRecursive = (dirPath: string) => {
    let entries: string[] = [];
    try {
      entries = FS.readdir(dirPath);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === '.' || entry === '..') continue;
      const full = `${dirPath}/${entry}`;
      const stat = FS.stat(full);
      if (FS.isDir(stat.mode)) {
        removeRecursive(full);
        try {
          FS.rmdir(full);
        } catch {
          // ignore
        }
      } else {
        try {
          FS.unlink(full);
        } catch {
          // ignore
        }
      }
    }
  };

  try {
    FS.mkdirTree(workspaceRoot);
    removeRecursive(workspaceRoot);
  } catch {
    FS.mkdirTree(workspaceRoot);
  }

  for (const file of files) {
    const cleanRel = file.path.replace(/^\/+/, '');
    const fullPath = `${workspaceRoot}/${cleanRel}`;
    const lastSlash = fullPath.lastIndexOf('/');
    if (lastSlash > 0) {
      FS.mkdirTree(fullPath.slice(0, lastSlash));
    }
    FS.writeFile(fullPath, file.content ?? '');
  }
}

function collectModifiedFiles(originalFiles: WorkerFileEntry[]): WorkerFileEntry[] {
  if (!pyodide) return [];
  const FS = pyodide.FS;
  const origMap = new Map<string, string>();
  for (const f of originalFiles) origMap.set(f.path.replace(/^\/+/, ''), f.content ?? '');

  const discovered: WorkerFileEntry[] = [];
  const walk = (dirPath: string, relPrefix: string) => {
    let entries: string[] = [];
    try {
      entries = FS.readdir(dirPath);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === '.' || entry === '..' || entry === '__pycache__') continue;
      const full = `${dirPath}/${entry}`;
      const rel = relPrefix ? `${relPrefix}/${entry}` : entry;
      const stat = FS.stat(full);
      if (FS.isDir(stat.mode)) {
        walk(full, rel);
      } else {
        // Only capture readable text outputs created or updated by Python scripts
        if (/\.(py|csv|json|txt|md|tsv)$/i.test(entry)) {
          try {
            const content = FS.readFile(full, { encoding: 'utf8' });
            const prev = origMap.get(rel);
            if (prev === undefined || prev !== content) {
              discovered.push({ path: rel, content });
            }
          } catch {
            // skip binary or unreadable files
          }
        }
      }
    }
  };

  walk('/workspace', '');
  return discovered;
}

function detectScientificImports(code: string): string[] {
  const found = new Set<string>();
  const lines = code.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;
    const mImport = trimmed.match(/^import\s+(.+)$/);
    if (mImport) {
      const parts = mImport[1].split(',');
      for (const p of parts) {
        const root = p.trim().split(/\s+as\s+/)[0].split('.')[0].trim();
        if (SCIENTIFIC_PACKAGES.has(root)) found.add(root);
      }
    }
    const mFrom = trimmed.match(/^from\s+([A-Za-z0-9_.]+)\s+import\s+/);
    if (mFrom) {
      const root = mFrom[1].split('.')[0].trim();
      if (SCIENTIFIC_PACKAGES.has(root)) found.add(root);
    }
  }
  return Array.from(found);
}

async function ensurePyodideLoaded(interruptBuffer?: Uint8Array) {
  if (pyodide) return;
  const mod = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
  pyodide = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  if (interruptBuffer && typeof pyodide.setInterruptBuffer === 'function') {
    pyodide.setInterruptBuffer(interruptBuffer);
  }
  await pyodide.runPythonAsync(PRELUDE_PYTHON);
  pythonVersion = pyodide.runPython(
    '".".join(map(str, __import__("sys").version_info[:3]))'
  );
  loadedPackages = new Set<string>();
}

async function loadSpecificPackages(packages: string[]) {
  if (!pyodide) throw new Error('Pyodide runtime not initialized.');
  const needed = packages.filter((p) => !loadedPackages.has(p));
  if (needed.length === 0) return;

  for (const pkg of needed) {
    postMsg({ type: 'package_status', packageId: pkg, status: 'loading' });
  }

  for (const pkg of needed) {
    try {
      await pyodide.loadPackage([pkg]);
      // Pre-configure Agg backend if matplotlib was just loaded
      if (pkg === 'matplotlib') {
        await pyodide.runPythonAsync(`
import os
os.environ["MPLBACKEND"] = "Agg"
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
_pharmlab_hook_matplotlib()
`);
      }
      loadedPackages.add(pkg);
      postMsg({ type: 'package_status', packageId: pkg, status: 'loaded' });
    } catch (err: any) {
      postMsg({
        type: 'package_status',
        packageId: pkg,
        status: 'error',
        error: err?.message || String(err)
      });
      throw err;
    }
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    if (req.type === 'init') {
      await ensurePyodideLoaded(req.interruptBuffer);
      postMsg({
        id: req.id,
        type: 'ready',
        pythonVersion,
        pyodideVersion: PYODIDE_VERSION,
        loadedPackages: Array.from(loadedPackages)
      });
      return;
    }

    if (req.type === 'load_packages') {
      await ensurePyodideLoaded();
      await loadSpecificPackages(req.packages);
      postMsg({
        id: req.id,
        type: 'packages_loaded',
        loadedPackages: Array.from(loadedPackages)
      });
      return;
    }

    if (req.type === 'reset_session') {
      await ensurePyodideLoaded();
      await pyodide.runPythonAsync(`
_pharmlab_ns.clear()
_pharmlab_ns["__name__"] = "__main__"
_pharmlab_ns["display"] = _pharmlab_display
`);
      postMsg({ id: req.id, type: 'session_reset' });
      return;
    }

    if (req.type === 'inspect_vars') {
      await ensurePyodideLoaded();
      const varsJson = pyodide.runPython('_pharmlab_inspect_variables()');
      postMsg({
        id: req.id,
        type: 'vars',
        variables: JSON.parse(varsJson)
      });
      return;
    }

    if (req.type === 'execute') {
      await ensurePyodideLoaded();
      syncWorkspaceFiles(req.files || []);

      // Detect and lazily load needed scientific packages from active code + sibling .py files
      const detected = new Set<string>(detectScientificImports(req.code));
      for (const f of req.files || []) {
        if (f.path.endsWith('.py')) {
          for (const pkg of detectScientificImports(f.content || '')) {
            detected.add(pkg);
          }
        }
      }
      if (detected.size > 0) {
        await loadSpecificPackages(Array.from(detected));
      }

      // Let Pyodide also resolve any bundled stdlib/pure wheels if present
      try {
        await pyodide.loadPackagesFromImports(req.code);
      } catch {
        // Non-fatal: local workspace modules trigger no-op or missing external packages will surface cleanly in traceback
      }

      const streamCb = (stream: string, text: string) => {
        postMsg({ type: 'stream', runId: req.id, stream, text });
      };

      const runFn = pyodide.globals.get('_pharmlab_run');
      const resultJson: string = runFn(req.code, req.mode, req.filePath || '', streamCb);
      const parsed = JSON.parse(resultJson);
      const varsJson: string = pyodide.runPython('_pharmlab_inspect_variables()');
      const variables = JSON.parse(varsJson);
      const modifiedFiles =
        req.mode !== 'repl' ? collectModifiedFiles(req.files || []) : [];

      postMsg({
        id: req.id,
        type: 'execution_result',
        result: {
          ...parsed,
          variables,
          modifiedFiles,
          loadedPackages: Array.from(loadedPackages)
        }
      });
    }
  } catch (err: any) {
    postMsg({
      id: req.id,
      type: 'worker_error',
      error: err?.message || String(err)
    });
  }
};
