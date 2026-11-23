/// <reference lib="webworker" />

export {};

const PYODIDE_VERSION = '0.27.5';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const SCIENTIFIC_PACKAGES = new Set(['numpy', 'pandas', 'matplotlib', 'scipy', 'sympy']);

interface WorkerFileEntry {
  path: string;
  content: string;
}

type DebugPlanAction = 'entry' | 'into' | 'over' | 'out' | 'continue';

interface DebugConfigPayload {
  breakpointsByFile: Record<string, number[]>;
  stepPlan: DebugPlanAction[];
  watchExprs: string[];
}

type WorkerRequest =
  | { id: string; type: 'init'; interruptBuffer?: Uint8Array }
  | { id: string; type: 'load_packages'; packages: string[] }
  | { id: string; type: 'install_custom_packages'; packages: string[] }
  | {
      id: string;
      type: 'execute';
      mode: 'file' | 'selection' | 'repl';
      code: string;
      filePath?: string;
      files: WorkerFileEntry[];
      stdinResponses?: string[];
      debugConfig?: DebugConfigPayload;
    }
  | { id: string; type: 'inspect_vars' }
  | { id: string; type: 'inspect_variable_detail'; name: string }
  | { id: string; type: 'check_diagnostics'; code: string; filePath: string }
  | { id: string; type: 'reset_session' };

let pyodide: any = null;
let loadedPackages = new Set<string>();
let customLoadedPackages = new Set<string>();
let micropipLoaded = false;
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
import math
import base64
import builtins
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

class _PharmLabNeedsInput(BaseException):
    def __init__(self, prompt_text):
        self.prompt_text = prompt_text

class _PharmLabDebugPause(BaseException):
    def __init__(self, snapshot):
        self.snapshot = snapshot

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

def _pharmlab_serialize_df(obj, title=None, max_rows=120, max_cols=24):
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

def _pharmlab_serialize_var_dict(mapping):
    items = []
    for name, val in mapping.items():
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
    return items

def _pharmlab_inspect_variables():
    return json.dumps(_pharmlab_serialize_var_dict(_pharmlab_ns))

def _pharmlab_inspect_variable_detail(name):
    if name not in _pharmlab_ns:
        return json.dumps({
            "name": name,
            "typeName": "None",
            "summary": "Variable not found in current namespace.",
            "kind": "text",
            "rawText": "Variable is not defined in __main__."
        })
    val = _pharmlab_ns[name]
    t_name = type(val).__name__
    shape = None
    dtype_str = None
    if hasattr(val, "shape"):
        try:
            shape = str(tuple(val.shape))
        except Exception:
            shape = None
    elif isinstance(val, (list, tuple, dict, set)):
        shape = f"len={len(val)}"
    if hasattr(val, "dtype"):
        try:
            dtype_str = str(val.dtype)
        except Exception:
            dtype_str = None

    tbl = _pharmlab_serialize_df(val, title=name, max_rows=200, max_cols=30)
    if tbl is not None:
        return json.dumps({
            "name": name,
            "typeName": t_name,
            "shape": shape,
            "dtype": dtype_str,
            "summary": f"{t_name} {shape or ''}".strip(),
            "kind": "table",
            "table": tbl,
        })

    # Check NumPy ndarray
    if "numpy" in sys.modules:
        np = sys.modules["numpy"]
        if isinstance(val, np.ndarray):
            flat = val.ravel()[:120].tolist()
            clean_preview = []
            for item in flat:
                if isinstance(item, float) and (item != item):
                    clean_preview.append(None)
                elif isinstance(item, (int, float, bool, str)) or item is None:
                    clean_preview.append(item)
                else:
                    clean_preview.append(str(item))
            stats_obj = None
            if np.issubdtype(val.dtype, np.number) and val.size > 0:
                try:
                    nan_cnt = int(np.isnan(val).sum()) if np.issubdtype(val.dtype, np.floating) else 0
                    finite = val[np.isfinite(val)] if np.issubdtype(val.dtype, np.floating) else val
                    if finite.size > 0:
                        stats_obj = {
                            "min": float(np.min(finite)),
                            "max": float(np.max(finite)),
                            "mean": float(np.mean(finite)),
                            "std": float(np.std(finite)),
                            "nanCount": nan_cnt,
                        }
                except Exception:
                    stats_obj = None
            return json.dumps({
                "name": name,
                "typeName": t_name,
                "shape": shape,
                "dtype": dtype_str,
                "summary": f"ndarray shape={shape} dtype={dtype_str}",
                "kind": "array",
                "arrayStats": stats_obj,
                "arrayPreview": clean_preview,
                "rawText": repr(val)[:6000],
            })

    if isinstance(val, (dict, list, tuple, set)):
        try:
            if isinstance(val, set):
                pretty = json.dumps(list(val)[:200], indent=2, default=str)
            else:
                pretty = json.dumps(val, indent=2, default=str)
            if len(pretty) > 8000:
                pretty = pretty[:8000] + "\\n... (truncated)"
            return json.dumps({
                "name": name,
                "typeName": t_name,
                "shape": shape,
                "summary": f"{t_name} ({shape})",
                "kind": "json",
                "rawText": pretty,
            })
        except Exception:
            pass

    rep = repr(val)
    if len(rep) > 8000:
        rep = rep[:8000] + "\\n... (truncated)"
    return json.dumps({
        "name": name,
        "typeName": t_name,
        "shape": shape,
        "dtype": dtype_str,
        "summary": rep[:90],
        "kind": "text",
        "rawText": rep,
    })

def _pharmlab_check_diagnostics(code_str, file_path):
    markers = []
    try:
        tree = ast.parse(code_str, file_path or "<file>")
    except SyntaxError as exc:
        markers.append({
            "filePath": file_path,
            "line": int(exc.lineno or 1),
            "column": int(exc.offset or 1),
            "endColumn": int((exc.offset or 1) + 12),
            "message": f"{type(exc).__name__}: {exc.msg or str(exc)}",
            "severity": "error",
        })
        return json.dumps(markers)

    builtin_names = set(dir(builtins)) | {"display", "__name__", "__file__", "__doc__", "__package__"}
    lines = code_str.split("\\n")

    class _LintVisitor(ast.NodeVisitor):
        def __init__(self):
            self.scopes = [set()]
            self.imports = []  # (name, lineno, col)
            self.used_names = set()

        def define(self, name):
            if name and name != "_":
                self.scopes[-1].add(name)

        def is_defined(self, name):
            if name in builtin_names:
                return True
            for scope in reversed(self.scopes):
                if name in scope:
                    return True
            return False

        def bind_target(self, target):
            if isinstance(target, ast.Name):
                self.define(target.id)
            elif isinstance(target, (ast.Tuple, ast.List)):
                for elt in target.elts:
                    self.bind_target(elt)
            elif isinstance(target, ast.Starred):
                self.bind_target(target.value)

        def visit_Import(self, node):
            for alias in node.names:
                bound = alias.asname or alias.name.split(".")[0]
                self.define(bound)
                self.imports.append((bound, node.lineno, node.col_offset + 1))

        def visit_ImportFrom(self, node):
            for alias in node.names:
                if alias.name == "*":
                    continue
                bound = alias.asname or alias.name
                self.define(bound)
                self.imports.append((bound, node.lineno, node.col_offset + 1))

        def visit_Assign(self, node):
            self.visit(node.value)
            for t in node.targets:
                if isinstance(t, ast.Name):
                    self.define(t.id)
                else:
                    self.bind_target(t)
                    self.visit(t)

        def visit_AugAssign(self, node):
            self.visit(node.value)
            if isinstance(node.target, ast.Name):
                if not self.is_defined(node.target.id):
                    markers.append({
                        "filePath": file_path,
                        "line": node.lineno,
                        "column": node.target.col_offset + 1,
                        "endColumn": node.target.col_offset + len(node.target.id) + 1,
                        "message": f"Undefined variable '{node.target.id}'",
                        "severity": "warning",
                    })
                self.define(node.target.id)
            else:
                self.visit(node.target)

        def visit_AnnAssign(self, node):
            if node.value:
                self.visit(node.value)
            if isinstance(node.target, ast.Name):
                self.define(node.target.id)

        def visit_For(self, node):
            self.visit(node.iter)
            self.bind_target(node.target)
            for stmt in node.body:
                self.visit(stmt)
            for stmt in node.orelse:
                self.visit(stmt)

        def visit_With(self, node):
            for item in node.items:
                self.visit(item.context_expr)
                if item.optional_vars:
                    self.bind_target(item.optional_vars)
            for stmt in node.body:
                self.visit(stmt)

        def visit_Try(self, node):
            for stmt in node.body:
                self.visit(stmt)
            for h in node.handlers:
                if h.type:
                    self.visit(h.type)
                if h.name:
                    self.define(h.name)
                for stmt in h.body:
                    self.visit(stmt)
            for stmt in node.orelse:
                self.visit(stmt)
            for stmt in node.finalbody:
                self.visit(stmt)

        def visit_FunctionDef(self, node):
            self.define(node.name)
            for d in node.decorator_list:
                self.visit(d)
            for d in node.args.defaults + [x for x in node.args.kw_defaults if x is not None]:
                self.visit(d)
            self.scopes.append(set())
            for arg in node.args.posonlyargs + node.args.args + node.args.kwonlyargs:
                self.define(arg.arg)
            if node.args.vararg:
                self.define(node.args.vararg.arg)
            if node.args.kwarg:
                self.define(node.args.kwarg.arg)
            for stmt in node.body:
                self.visit(stmt)
            self.scopes.pop()

        visit_AsyncFunctionDef = visit_FunctionDef

        def visit_ClassDef(self, node):
            self.define(node.name)
            for b in node.bases:
                self.visit(b)
            self.scopes.append(set())
            for stmt in node.body:
                self.visit(stmt)
            self.scopes.pop()

        def visit_Lambda(self, node):
            self.scopes.append(set())
            for arg in node.args.posonlyargs + node.args.args + node.args.kwonlyargs:
                self.define(arg.arg)
            if node.args.vararg:
                self.define(node.args.vararg.arg)
            if node.args.kwarg:
                self.define(node.args.kwarg.arg)
            self.visit(node.body)
            self.scopes.pop()

        def _visit_comp(self, generators, elt_fn):
            self.scopes.append(set())
            for gen in generators:
                self.visit(gen.iter)
                self.bind_target(gen.target)
                for cond in gen.ifs:
                    self.visit(cond)
            elt_fn()
            self.scopes.pop()

        def visit_ListComp(self, node):
            self._visit_comp(node.generators, lambda: self.visit(node.elt))

        def visit_SetComp(self, node):
            self._visit_comp(node.generators, lambda: self.visit(node.elt))

        def visit_GeneratorExp(self, node):
            self._visit_comp(node.generators, lambda: self.visit(node.elt))

        def visit_DictComp(self, node):
            self._visit_comp(node.generators, lambda: (self.visit(node.key), self.visit(node.value)))

        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Load):
                self.used_names.add(node.id)
                if not self.is_defined(node.id):
                    markers.append({
                        "filePath": file_path,
                        "line": node.lineno,
                        "column": node.col_offset + 1,
                        "endColumn": node.col_offset + len(node.id) + 1,
                        "message": f"Possible undefined name '{node.id}'",
                        "severity": "warning",
                    })
            elif isinstance(node.ctx, ast.Store):
                self.define(node.id)

    visitor = _LintVisitor()
    visitor.visit(tree)

    for imp_name, ln, col in visitor.imports:
        if imp_name not in visitor.used_names:
            line_len = len(lines[ln - 1]) if 0 <= ln - 1 < len(lines) else col + len(imp_name)
            markers.append({
                "filePath": file_path,
                "line": ln,
                "column": col,
                "endColumn": max(col + 2, line_len + 1),
                "message": f"Unused import '{imp_name}'",
                "severity": "warning",
            })

    return json.dumps(markers[:40])

def _pharmlab_collect_workspace_frames(frame):
    frames = []
    cur = frame
    while cur is not None:
        fn = cur.f_code.co_filename
        if isinstance(fn, str) and fn.startswith("/workspace/"):
            frames.append(cur)
        cur = cur.f_back
    frames.reverse()
    return frames

def _pharmlab_run(code_str, mode, file_path, stream_cb, stdin_json="[]", debug_json=""):
    global _pharmlab_pending_tables
    _pharmlab_pending_tables = []

    stdin_queue = json.loads(stdin_json) if stdin_json else []
    debug_cfg = json.loads(debug_json) if debug_json else None

    old_stdout, old_stderr = sys.stdout, sys.stderr
    old_builtin_input = builtins.input
    out_stream = _PharmLabStream("stdout", stream_cb)
    err_stream = _PharmLabStream("stderr", stream_cb)
    sys.stdout = out_stream
    sys.stderr = err_stream

    def _pharmlab_input(prompt=""):
        p_str = "" if prompt is None else str(prompt)
        if stdin_queue:
            val = str(stdin_queue.pop(0))
            out_stream.write(f"{p_str}{val}\\n")
            return val
        raise _PharmLabNeedsInput(p_str)

    builtins.input = _pharmlab_input
    _pharmlab_ns["input"] = _pharmlab_input

    _pharmlab_invalidate_workspace_modules()

    virtual_name = f"/workspace/{file_path}" if file_path else "<workspace>"
    _pharmlab_ns["__name__"] = "__main__"
    _pharmlab_ns["__file__"] = virtual_name
    _pharmlab_ns["display"] = _pharmlab_display

    status = "success"
    repl_result = None
    tb_payload = None
    input_prompt = None
    debug_snapshot = None

    # Deterministic step debugger trace engine
    trace_fn = None
    if debug_cfg and mode != "repl":
        bp_map = {}
        raw_bps = debug_cfg.get("breakpointsByFile") or {}
        for rel_p, line_list in raw_bps.items():
            bp_map[f"/workspace/{rel_p}"] = set(int(x) for x in (line_list or []))
        step_plan = list(debug_cfg.get("stepPlan") or ["entry"])
        watch_exprs = list(debug_cfg.get("watchExprs") or [])

        state = {
            "pause_idx": 0,
            "step_counter": 0,
            "prev_depth": 1,
            "last_paused_step": -1,
        }

        def _make_snapshot(frame, ws_frames):
            stack_out = []
            for wf in ws_frames:
                loc_map = _pharmlab_serialize_var_dict(wf.f_locals)
                stack_out.append({
                    "filePath": wf.f_code.co_filename.replace("/workspace/", "", 1),
                    "functionName": wf.f_code.co_name,
                    "line": int(wf.f_lineno),
                    "locals": loc_map,
                })
            watches_out = []
            for expr in watch_exprs:
                clean_e = str(expr).strip()
                if not clean_e:
                    continue
                try:
                    val = eval(clean_e, frame.f_globals, frame.f_locals)
                    r = repr(val)
                    if len(r) > 120:
                        r = r[:117] + "..."
                    watches_out.append({"expr": clean_e, "value": r})
                except Exception as w_err:
                    watches_out.append({"expr": clean_e, "error": f"{type(w_err).__name__}: {w_err}"})

            top_locals = stack_out[-1]["locals"] if stack_out else []
            return {
                "paused": True,
                "filePath": frame.f_code.co_filename.replace("/workspace/", "", 1),
                "line": int(frame.f_lineno),
                "stepCount": state["step_counter"],
                "callStack": stack_out,
                "locals": top_locals,
                "watches": watches_out,
            }

        def _debugger_trace(frame, event, arg):
            if event != "line":
                return _debugger_trace
            fn = frame.f_code.co_filename
            if not isinstance(fn, str) or not fn.startswith("/workspace/"):
                return _debugger_trace

            state["step_counter"] += 1
            if state["step_counter"] > 200000:
                return None

            ws_frames = _pharmlab_collect_workspace_frames(frame)
            depth = max(1, len(ws_frames))
            is_bp = int(frame.f_lineno) in bp_map.get(fn, set())
            action = step_plan[state["pause_idx"]] if state["pause_idx"] < len(step_plan) else None
            if action is None:
                return _debugger_trace

            should_pause = False
            if state["pause_idx"] == 0:
                has_any_bps = any(len(v) > 0 for v in bp_map.values())
                if action == "entry":
                    should_pause = is_bp or not has_any_bps or state["step_counter"] == 1
                elif action == "continue":
                    should_pause = is_bp
                else:
                    should_pause = True
            else:
                if state["step_counter"] > state["last_paused_step"]:
                    if action == "into":
                        should_pause = True
                    elif action == "over":
                        should_pause = is_bp or (depth <= state["prev_depth"])
                    elif action == "out":
                        should_pause = is_bp or (depth < state["prev_depth"])
                    elif action == "continue":
                        should_pause = is_bp

            if should_pause:
                state["last_paused_step"] = state["step_counter"]
                state["prev_depth"] = depth
                state["pause_idx"] += 1
                if state["pause_idx"] >= len(step_plan):
                    snap = _make_snapshot(frame, ws_frames)
                    raise _PharmLabDebugPause(snap)

            return _debugger_trace

        trace_fn = _debugger_trace

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
            if trace_fn is not None:
                sys.settrace(trace_fn)
            exec(compiled, _pharmlab_ns, _pharmlab_ns)
        _pharmlab_hook_matplotlib()
    except _PharmLabNeedsInput as inp_exc:
        status = "awaiting_input"
        input_prompt = inp_exc.prompt_text
    except _PharmLabDebugPause as dbg_exc:
        status = "paused"
        debug_snapshot = dbg_exc.snapshot
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
        sys.settrace(None)
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        builtins.input = old_builtin_input

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
        "inputPrompt": input_prompt,
        "debugSnapshot": debug_snapshot,
    })
`;

function syncWorkspaceFiles(files: WorkerFileEntry[]) {
  if (!pyodide) return;
  const FS = pyodide.FS;
  const workspaceRoot = '/workspace';

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
  customLoadedPackages = new Set<string>();
  micropipLoaded = false;
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

async function installViaMicropip(packages: string[]) {
  if (!pyodide) throw new Error('Pyodide runtime not initialized.');
  const cleanNames = packages
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (cleanNames.length === 0) return;

  for (const pkg of cleanNames) {
    postMsg({ type: 'custom_package_status', name: pkg, status: 'loading' });
  }

  if (!micropipLoaded) {
    await pyodide.loadPackage('micropip');
    micropipLoaded = true;
  }

  const micropip = pyodide.pyimport('micropip');
  for (const pkg of cleanNames) {
    try {
      await micropip.install(pkg);
      customLoadedPackages.add(pkg);
      if (SCIENTIFIC_PACKAGES.has(pkg)) {
        loadedPackages.add(pkg);
        postMsg({ type: 'package_status', packageId: pkg, status: 'loaded' });
      }
      postMsg({ type: 'custom_package_status', name: pkg, status: 'loaded' });
    } catch (err: any) {
      postMsg({
        type: 'custom_package_status',
        name: pkg,
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
        loadedPackages: Array.from(loadedPackages),
        customPackages: Array.from(customLoadedPackages)
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

    if (req.type === 'install_custom_packages') {
      await ensurePyodideLoaded();
      await installViaMicropip(req.packages);
      postMsg({
        id: req.id,
        type: 'custom_packages_loaded',
        customPackages: Array.from(customLoadedPackages)
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

    if (req.type === 'inspect_variable_detail') {
      await ensurePyodideLoaded();
      const inspectFn = pyodide.globals.get('_pharmlab_inspect_variable_detail');
      const detailJson: string = inspectFn(req.name);
      postMsg({
        id: req.id,
        type: 'variable_detail',
        detail: JSON.parse(detailJson)
      });
      return;
    }

    if (req.type === 'check_diagnostics') {
      await ensurePyodideLoaded();
      const checkFn = pyodide.globals.get('_pharmlab_check_diagnostics');
      const diagJson: string = checkFn(req.code, req.filePath);
      postMsg({
        id: req.id,
        type: 'diagnostics',
        diagnostics: JSON.parse(diagJson)
      });
      return;
    }

    if (req.type === 'execute') {
      await ensurePyodideLoaded();
      syncWorkspaceFiles(req.files || []);

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

      try {
        await pyodide.loadPackagesFromImports(req.code);
      } catch {
        // Non-fatal: local modules or custom micropip packages handle resolution
      }

      const streamCb = (stream: string, text: string) => {
        postMsg({ type: 'stream', runId: req.id, stream, text });
      };

      const runFn = pyodide.globals.get('_pharmlab_run');
      const resultJson: string = runFn(
        req.code,
        req.mode,
        req.filePath || '',
        streamCb,
        JSON.stringify(req.stdinResponses || []),
        req.debugConfig ? JSON.stringify(req.debugConfig) : ''
      );
      const parsed = JSON.parse(resultJson);
      const varsJson: string = pyodide.runPython('_pharmlab_inspect_variables()');
      const variables = JSON.parse(varsJson);
      const modifiedFiles =
        req.mode !== 'repl' && parsed.status !== 'paused' && parsed.status !== 'awaiting_input'
          ? collectModifiedFiles(req.files || [])
          : [];

      postMsg({
        id: req.id,
        type: 'execution_result',
        result: {
          ...parsed,
          variables,
          modifiedFiles,
          loadedPackages: Array.from(loadedPackages),
          customPackages: Array.from(customLoadedPackages)
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
