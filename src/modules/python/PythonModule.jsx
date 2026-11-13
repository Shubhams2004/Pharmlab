import React, { useState, useEffect, useRef } from 'react';
import { Code, Play, BookOpen, Terminal, Sparkles, Layers, RefreshCw } from 'lucide-react';

export default function PythonModule() {
  const [activeUnit, setActiveUnit] = useState('terminal');
  const [pyodide, setPyodide] = useState(null);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(true);
  const [inputCode, setInputCode] = useState('print("Hello from PharmLab Python 3.11!")\nimport numpy as np\narr = np.array([150, 151, 149])\nprint("Mean weight:", np.mean(arr))');
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'Initializing WebAssembly Python 3.11 Environment (Pyodide)...' }
  ]);
  const terminalEndRef = useRef(null);

  // Load Pyodide from CDN on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPyodideEnvironment() {
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
          script.async = true;
          document.body.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        const pyInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        
        // Load numpy package pre-installed via micropip or pyodide packages
        await pyInstance.loadPackage("numpy");

        if (isMounted) {
          setPyodide(pyInstance);
          setIsLoadingPyodide(false);
          setTerminalHistory(prev => [
            ...prev,
            { type: 'system', text: 'Python 3.11.2 (WebAssembly Runtime) Ready. NumPy pre-loaded.' }
          ]);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoadingPyodide(false);
          setTerminalHistory(prev => [
            ...prev,
            { type: 'error', text: `Failed to load Pyodide runtime: ${err.message}` }
          ]);
        }
      }
    }

    loadPyodideEnvironment();
    return () => { isMounted = false; };
  }, []);

  // Execute custom user code
  const handleRunCode = async () => {
    if (!pyodide) {
      alert("Python runtime is still loading. Please wait a second.");
      return;
    }

    const codeToRun = inputCode;
    setTerminalHistory(prev => [...prev, { type: 'input', text: codeToRun }]);

    try {
      // Capture stdout
      pyodide.runPython(`
        import sys
        import io
        sys.stdout = io.StringIO()
      `);

      await pyodide.runPythonAsync(codeToRun);

      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      
      setTerminalHistory(prev => [
        ...prev,
        { type: 'output', text: stdout || '[No output returned]' }
      ]);
    } catch (err) {
      setTerminalHistory(prev => [
        ...prev,
        { type: 'error', text: err.toString() }
      ]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">PCI B.Pharm • BP101T</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Basics of Python Programming for Pharmaceutical Sciences</h2>
        <p className="text-slate-400 text-sm mt-1">True browser-based Python 3.11 execution engine powered by WebAssembly.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'terminal', label: 'Interactive Python REPL Terminal' },
          { id: 'syntax', label: 'BP101T Syllabus & Concepts' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveUnit(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              activeUnit === tab.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeUnit === 'terminal' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Live Python 3.11 Console</h3>
                <p className="text-xs text-slate-400">
                  {isLoadingPyodide ? 'Downloading & initializing WebAssembly runtime...' : 'Ready for custom Python code execution.'}
                </p>
              </div>
            </div>
            {isLoadingPyodide && (
              <div className="flex items-center space-x-2 text-xs text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading Interpreter...</span>
              </div>
            )}
          </div>

          {/* Terminal Output History Box */}
          <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs h-64 overflow-y-auto space-y-2">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className={
                item.type === 'system' ? 'text-slate-500 italic' :
                item.type === 'input' ? 'text-blue-400 font-bold border-l-2 border-blue-500 pl-2 py-0.5' :
                item.type === 'error' ? 'text-rose-400 font-semibold' : 'text-emerald-300 whitespace-pre-wrap'
              }>
                {item.type === 'input' ? `>>> ${item.text}` : item.text}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Code Input Area */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Write Custom Python Code:
            </label>
            <textarea
              rows={5}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              disabled={isLoadingPyodide}
              placeholder="Type any Python code here (e.g., import numpy as np; print(np.arange(5)))"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={handleRunCode}
              disabled={isLoadingPyodide}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoadingPyodide ? 'Initializing Python Engine...' : 'Execute Code in Browser'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Syllabus Concepts View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>BP101T Syllabus & Quick Reference</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="font-bold text-blue-400">Unit I & II: Fundamentals</span>
              <p className="text-slate-400">Variables, data types, conditional branching (`if/elif/else`), `for`/`while` loops, and modular function definitions (`def`).</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <span className="font-bold text-blue-400">Unit III: NumPy & Quality Control</span>
              <p className="text-slate-400">Vectorized arrays, statistical functions (`np.mean`, `np.std`), and Indian Pharmacopoeia tablet weight variation testing.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
