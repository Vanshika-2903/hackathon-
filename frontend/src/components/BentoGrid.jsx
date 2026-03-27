import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, X, Terminal as TerminalIcon, Download, FileArchive, Loader2, ChevronDown } from 'lucide-react';
import JSZip from 'jszip';
import EditorWidget from './EditorWidget.jsx';
import InlineSuggestionPanel from './InlineSuggestionPanel.jsx';
import SidebarWidget from './SidebarWidget.jsx';
import StatusWidget from './StatusWidget.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileLanguage(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'js' || ext === 'jsx') return 'javascript';
  if (ext === 'ts' || ext === 'tsx') return 'typescript';
  if (ext === 'py') return 'python';
  if (ext === 'c') return 'c';
  if (ext === 'cpp' || ext === 'h' || ext === 'cc') return 'cpp';
  if (ext === 'java') return 'java';
  if (ext === 'go') return 'go';
  if (ext === 'rs') return 'rust';
  if (ext === 'rb') return 'ruby';
  if (ext === 'sh') return 'bash';
  if (ext === 'css') return 'css';
  if (ext === 'json') return 'json';
  if (ext === 'html') return 'html';
  if (ext === 'md') return 'markdown';
  return 'plaintext';
}

const RUNNABLE_LANGUAGES = new Set(['javascript', 'typescript', 'python', 'c', 'cpp', 'java', 'go', 'rust', 'ruby', 'bash']);

function getExecutionDetails(filename) {
  const lang = getFileLanguage(filename);
  const labels = {
    javascript: { buttonLabel: 'Run JS',   runtime: 'JavaScript (Node.js · Wandbox)' },
    typescript: { buttonLabel: 'Run TS',   runtime: 'TypeScript (Wandbox)' },
    python:     { buttonLabel: 'Run Py',   runtime: 'Python 3 (Wandbox)' },
    c:          { buttonLabel: 'Run C',    runtime: 'GCC C (Wandbox)' },
    cpp:        { buttonLabel: 'Run C++',  runtime: 'G++ C++ (Wandbox)' },
    java:       { buttonLabel: 'Run Java', runtime: 'Java OpenJDK (Wandbox)' },
    go:         { buttonLabel: 'Run Go',   runtime: 'Go (Wandbox)' },
    rust:       { buttonLabel: 'Run Rust', runtime: 'Rust (Wandbox)' },
    ruby:       { buttonLabel: 'Run Ruby', runtime: 'Ruby (Wandbox)' },
    bash:       { buttonLabel: 'Run Bash', runtime: 'Bash (Wandbox)' },
  };
  return {
    language: lang,
    supported: RUNNABLE_LANGUAGES.has(lang),
    ...(labels[lang] || { buttonLabel: 'Run Code', runtime: 'Read Only' }),
  };
}

function getSuffixPrefixOverlap(source, suggestion) {
  const sourceTail = source.slice(-Math.min(source.length, suggestion.length));
  const maxOverlap = Math.min(sourceTail.length, suggestion.length);

  for (let size = maxOverlap; size > 0; size -= 1) {
    if (sourceTail.endsWith(suggestion.slice(0, size))) {
      return size;
    }
  }

  return 0;
}

function buildSuggestionInsertion(filename, suggestion, currentContent = '', cursorOffset = null) {
  const snippet = suggestion?.suggestedCode;
  if (!snippet) {
    const body = [suggestion?.inlineHint, suggestion?.suggestion].filter(Boolean).join('\n').trim();
    if (!body) return '';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'py' || ext === 'sh') return body.split('\n').map(l => `# ${l}`).join('\n');
    if (ext === 'html') return `<!--\n${body}\n-->`;
    return `/*\n${body}\n*/`;
  }

  // If we have a cursor offset, try to handle overlap
  if (Number.isInteger(cursorOffset) && cursorOffset >= 0) {
    const textBeforeCursor = currentContent.slice(0, cursorOffset);
    const overlap = getSuffixPrefixOverlap(textBeforeCursor, snippet);
    return snippet.slice(overlap);
  }

  return snippet;
}

// ---------------------------------------------------------------------------
// Default starter files
// ---------------------------------------------------------------------------

const DEFAULT_FILES = [
  {
    name: 'main.js',
    content: `// Flux-State Cognitive Engine — Main Workspace
// Write your code below. Stress detected → AI assistance triggered.

function greet(name) {
  return \`Hello, \${name}! Welcome to Flux-State.\`;
}

console.log(greet("Developer"));
console.log("System ready. Start coding.");`,
  },
  {
    name: 'script.py',
    content: `# Python 3 — Flux-State Runtime
def analyze_stress(score):
    if score > 75:
        return "CRITICAL"
    elif score > 50:
        return "ELEVATED"
    return "FLOW"

stress = 82
print(f"Score: {stress} | State: {analyze_stress(stress)}")`,
  },
  {
    name: 'utils.css',
    content: `body {\n  margin: 0;\n  display: flex;\n  font-family: 'Inter', sans-serif;\n}`,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BentoGrid({
  sessionData,
  setSessionData,
  theme,
  isDevMode,
  setAlert,
  onActiveLanguageChange,
  extraActions, // New prop
}) {
  const isCrisis = ['warning', 'crisis', 'meltdown', 'dead_zone'].includes(sessionData.state);

  const [activeFile, setActiveFile] = useState('main.js');
  const [files, setFiles] = useState(DEFAULT_FILES);

  // Terminal
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Sync active language to parent
  useEffect(() => {
    onActiveLanguageChange?.(getFileLanguage(activeFile));
  }, [activeFile, onActiveLanguageChange]);

  // Clear AI suggestion when switching files to avoid applying to wrong file
  useEffect(() => {
    if (sessionData.aiSuggestion && sessionData.aiSuggestion.activeFile !== activeFile) {
      setSessionData(prev => ({ ...prev, aiSuggestion: null }));
    }
  }, [activeFile, sessionData.aiSuggestion, setSessionData]);

  // -------------------------------------------------------------------------
  // File management
  // -------------------------------------------------------------------------

  const handleUpdateFile = (filename, newContent) => {
    setFiles(prev => prev.map(f => f.name === filename ? { ...f, content: newContent } : f));
    window.__currentCode = newContent;
  };

  const handleCreateFile = () => {
    const fileName = window.prompt('Enter file name (e.g. helper.py, utils.c, App.tsx):', 'untitled.txt');
    if (!fileName || !fileName.trim()) return;
    const name = fileName.trim();

    if (files.find(f => f.name === name)) {
      alert(`A file named "${name}" already exists.`);
      return;
    }

    setFiles(prev => [...prev, { name, content: '' }]);
    setActiveFile(name);
  };

  const handleCloseFile = (filename, e) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert('You must keep at least one file in the workspace.');
      return;
    }

    setFiles(prev => {
      const next = prev.filter(f => f.name !== filename);
      // Switch to nearest file if closing the active one
      if (activeFile === filename) {
        const closedIdx = prev.findIndex(f => f.name === filename);
        const nextFile = next[Math.max(0, closedIdx - 1)];
        setActiveFile(nextFile?.name || next[0]?.name);
      }
      return next;
    });
  };

  // -------------------------------------------------------------------------
  // ZIP Export (client-side, no backend)
  // -------------------------------------------------------------------------

  const handleExportZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder('workspace');
    files.forEach(f => folder.file(f.name, f.content));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTerminalLogs(prev => [...prev, {
      type: 'success',
      message: `> Downloaded workspace.zip (${files.length} file${files.length !== 1 ? 's' : ''})`,
    }]);
    setIsTerminalOpen(true);
  };

  // -------------------------------------------------------------------------
  // AI suggestion apply
  // -------------------------------------------------------------------------

  const handleApplySuggestion = () => {
    const suggestion = sessionData.aiSuggestion;
    if (!suggestion) return;

    // Safety check: Don't apply if the file has changed since the suggestion was made
    if (suggestion.activeFile && suggestion.activeFile !== activeFile) {
      setSessionData(prev => ({ ...prev, aiSuggestion: null }));
      return;
    }

    setFiles(prev => prev.map(file => {
      if (file.name !== activeFile) return file;
      
      const insertion = buildSuggestionInsertion(
        activeFile, 
        suggestion, 
        file.content, 
        suggestion.cursorOffset
      );
      
      if (!insertion) return file;

      let nextContent;
      const offset = suggestion.cursorOffset;

      if (Number.isInteger(offset) && offset >= 0 && offset <= file.content.length) {
        // Precise insertion at cursor position
        nextContent = file.content.slice(0, offset) + insertion + file.content.slice(offset);
      } else {
        // Fallback: append to end
        nextContent = file.content.trimEnd()
          ? `${file.content.trimEnd()}\n\n${insertion}\n`
          : `${insertion}\n`;
      }
      
      window.__currentCode = nextContent;
      return { ...file, content: nextContent };
    }));

    setSessionData(prev => ({ ...prev, aiSuggestion: null }));
  };

  // -------------------------------------------------------------------------
  // Code execution — Wandbox API (free, no key) proxied through backend
  // Falls back to browser eval for JavaScript if backend is unreachable
  // -------------------------------------------------------------------------

  const handleRunCode = async () => {
    const execution = getExecutionDetails(activeFile);

    setIsTerminalOpen(true);
    setIsRunning(true);
    setTerminalLogs([{
      type: 'info',
      message: `> Sending ${activeFile} to Wandbox online execution engine...`,
    }]);

    const activeFileObj = files.find(f => f.name === activeFile);
    if (!activeFileObj) {
      setTerminalLogs(prev => [...prev, { type: 'error', message: 'Active file not found in workspace.' }]);
      setIsRunning(false);
      return;
    }

    if (!execution.supported) {
      setTerminalLogs(prev => [
        ...prev,
        { type: 'error', message: `Execution for .${activeFile.split('.').pop()} files is not supported.` },
        { type: 'info', message: '> Supported: JS, TS, Python, C, C++, Java, Go, Rust, Ruby, Bash' },
      ]);
      setIsRunning(false);
      return;
    }

    // Build the files array: active file first (entry point), then all others
    const otherFiles = files.filter(f => f.name !== activeFile && RUNNABLE_LANGUAGES.has(getFileLanguage(f.name)));
    const pistonFiles = [
      { name: activeFile, content: activeFileObj.content },
      ...otherFiles.map(f => ({ name: f.name, content: f.content })),
    ];

    if (pistonFiles.length > 1) {
      setTerminalLogs(prev => [
        ...prev,
        { type: 'info', message: `> Including ${pistonFiles.length} file(s): ${pistonFiles.map(f => f.name).join(', ')}` },
      ]);
    }

    try {
      const res = await fetch('http://localhost:3000/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: execution.language,
          files: pistonFiles,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.message) {
        setTerminalLogs(prev => [...prev, {
          type: 'error',
          message: `Execution Engine Error: ${data.message || 'Unknown error.'}`,
        }]);
        setIsRunning(false);
        return;
      }

      // Show compile step (if exists — C, C++, Java, Go, Rust, TypeScript)
      if (data.compile) {
        if (data.compile.stderr) {
          data.compile.stderr.split('\n').filter(Boolean).forEach(line => {
            setTerminalLogs(prev => [...prev, { type: 'error', message: `[compile] ${line}` }]);
          });
        }
        if (data.compile.code !== 0) {
          setTerminalLogs(prev => [...prev, {
            type: 'error',
            message: `> Compilation failed (exit code ${data.compile.code})`,
          }]);
          setIsRunning(false);
          return;
        } else if (data.compile.stderr === '' && data.compile.code === 0) {
          setTerminalLogs(prev => [...prev, { type: 'success', message: '> Compilation successful ✓' }]);
        }
      }

      // Show stdout
      if (data.run?.stdout) {
        data.run.stdout.split('\n').filter(l => l !== '').forEach(line => {
          setTerminalLogs(prev => [...prev, { type: 'log', message: line }]);
        });
      }

      // Show stderr
      if (data.run?.stderr) {
        data.run.stderr.split('\n').filter(Boolean).forEach(line => {
          setTerminalLogs(prev => [...prev, { type: 'error', message: line }]);
        });
      }

      // Exit code
      const exitCode = data.run?.code ?? 1;
      setTerminalLogs(prev => [...prev, {
        type: exitCode === 0 ? 'success' : 'error',
        message: `> Process exited with code ${exitCode}`,
      }]);

    } catch (err) {
      // ── Browser-side JS eval fallback ──────────────────────────────────────
      // If the backend is unreachable AND the file is JavaScript, run it
      // directly in the browser using a sandboxed Function constructor.
      if (execution.language === 'javascript') {
        setTerminalLogs(prev => [...prev, {
          type: 'info',
          message: '> Backend unreachable — falling back to browser eval (console output only)',
        }]);

        const activeFileObj = files.find(f => f.name === activeFile);
        const logs = [];
        const fakeConsole = {
          log:   (...a) => logs.push({ type: 'log',     message: a.map(String).join(' ') }),
          warn:  (...a) => logs.push({ type: 'info',    message: '[warn] ' + a.map(String).join(' ') }),
          error: (...a) => logs.push({ type: 'error',   message: '[error] ' + a.map(String).join(' ') }),
          info:  (...a) => logs.push({ type: 'info',    message: '[info] ' + a.map(String).join(' ') }),
        };

        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function('console', activeFileObj?.content || '');
          fn(fakeConsole);
          setTerminalLogs(prev => [
            ...prev,
            ...logs,
            { type: 'success', message: '> Process exited with code 0 (browser eval)' },
          ]);
        } catch (evalErr) {
          setTerminalLogs(prev => [
            ...prev,
            ...logs,
            { type: 'error', message: `RuntimeError: ${evalErr.message}` },
            { type: 'error', message: '> Process exited with code 1 (browser eval)' },
          ]);
        }
      } else {
        setTerminalLogs(prev => [...prev, {
          type: 'error',
          message: `Network Error: Could not reach backend. Make sure the backend is running on localhost:3000. (${err.message})`,
        }, {
          type: 'info',
          message: '> Tip: run \'npm run dev\' in the project root to start both servers.',
        }]);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const execution = getExecutionDetails(activeFile);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 relative max-w-[1600px] mx-auto w-full z-10 pointer-events-auto h-screen overflow-hidden font-inter">
      {/* Status Bar */}
      <div className="shrink-0">
        <StatusWidget
          sessionData={sessionData}
          setSessionData={setSessionData}
          theme={theme}
          isDevMode={isDevMode}
          setAlert={setAlert}
        />
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">

        {/* Editor Area */}
        <motion.div
          layout
          className={`${isCrisis ? 'col-span-12' : 'col-span-12 lg:col-span-9'} flex flex-col gap-4 min-h-0 overflow-hidden`}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          {/* Editor Panel */}
          <div className="glass-panel flex-1 rounded-3xl overflow-hidden flex flex-col relative bg-black/40 border-white/5 shadow-2xl">

            {/* Editor Header */}
            <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-black/40 shrink-0">
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/20" />
                </div>
                <span className="ml-3 text-xs font-mono font-bold tracking-widest uppercase opacity-40">
                  Workspace / {activeFile}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Extra Actions from Parent (Finish/Settings) */}
                {extraActions}

                {/* New File */}
                <button
                  onClick={handleCreateFile}
                  title="New File"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-200 border border-white/10 text-[11px] font-bold uppercase tracking-widest"
                >
                  <Plus size={12} /> New
                </button>

                {/* Export ZIP */}
                <button
                  onClick={handleExportZip}
                  title="Download all files as ZIP"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all duration-200 border border-blue-500/30 text-[11px] font-bold uppercase tracking-widest"
                >
                  <Download size={12} /> Export ZIP
                </button>

                {/* Run Button */}
                <button
                  onClick={handleRunCode}
                  disabled={!execution.supported || isRunning}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 text-[13px] font-bold uppercase tracking-widest ${
                    !execution.supported
                      ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                      : isRunning
                        ? 'bg-green-700/60 text-white/70 cursor-wait border border-green-500/20'
                        : 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.35)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                  }`}
                >
                  {isRunning
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Play size={14} fill="currentColor" />
                  }
                  {isRunning ? 'Running…' : execution.buttonLabel}
                </button>
              </div>
            </div>

            {/* File Tabs */}
            <div className="h-11 border-b border-white/10 bg-[#181818] flex items-end overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
              {files.map((file) => (
                <div
                  key={file.name}
                  onClick={() => setActiveFile(file.name)}
                  className={`group relative flex items-center gap-2 min-w-fit px-4 h-full border-r border-white/5 text-xs font-mono tracking-wide transition-colors cursor-pointer select-none ${
                    activeFile === file.name
                      ? 'bg-[#1e1e1e] text-white'
                      : 'bg-[#181818] text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{file.name}</span>
                  {/* Close (×) button */}
                  <button
                    onClick={(e) => handleCloseFile(file.name, e)}
                    title={`Close ${file.name}`}
                    className={`opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 ${
                      activeFile === file.name ? 'opacity-30' : ''
                    }`}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {/* Inline "+" tab button */}
              <button
                onClick={handleCreateFile}
                title="Add new file"
                className="h-full px-3 text-white/20 hover:text-white/60 hover:bg-white/[0.03] transition-colors text-lg leading-none"
              >
                +
              </button>
            </div>

            {/* Runtime breadcrumb */}
            <div className="h-9 border-b border-white/5 px-4 flex items-center justify-between bg-[#1a1a1a] text-[11px] font-mono uppercase tracking-[0.18em] text-white/45 shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${execution.supported ? 'bg-green-400' : 'bg-white/20'}`}
                />
                <span>{execution.runtime}</span>
                {files.length > 1 && execution.supported && (
                  <span className="text-white/25 normal-case ml-2">
                    · {files.length} files in workspace
                  </span>
                )}
              </div>
              <span className="text-white/20 normal-case text-[10px]">
                Powered by Wandbox · Free · No API Key
              </span>
            </div>

            {/* Inline AI Suggestion Panel */}
            {sessionData.aiSuggestion && sessionData.aiSuggestion.activeFile === activeFile && (
              <InlineSuggestionPanel
                suggestion={sessionData.aiSuggestion}
                activeFile={activeFile}
                theme={theme}
                onApply={handleApplySuggestion}
                onDismiss={() => setSessionData(prev => ({ ...prev, aiSuggestion: null }))}
              />
            )}

            {/* Monaco Editor */}
            <div className="flex-1 relative min-h-0">
              <EditorWidget
                activeFile={activeFile}
                files={files}
                onUpdateFile={handleUpdateFile}
                aiSuggestion={sessionData.aiSuggestion}
                onAcceptSuggestion={() => setSessionData(prev => ({ ...prev, aiSuggestion: null }))}
                theme={theme}
              />
            </div>
          </div>

          {/* Terminal / Output Console */}
          <AnimatePresence>
            {isTerminalOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: '32%', 
                  opacity: 1,
                  boxShadow: sessionData.aiSuggestion ? `0 0 40px ${theme.bright}44` : '0 0 0px transparent'
                }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                className="glass-panel rounded-3xl flex flex-col overflow-hidden shrink-0 border border-white/5 bg-[#0A0A0A]/95 backdrop-blur-3xl shadow-2xl relative"
              >
                {/* Cognitive Pulse overlay for terminal */}
                <AnimatePresence>
                  {sessionData.aiSuggestion && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 pointer-events-none z-0"
                      style={{ backgroundColor: theme.bright }}
                    />
                  )}
                </AnimatePresence>

                {/* Terminal Header */}
                <div className="h-11 border-b border-white/10 px-5 flex items-center justify-between bg-white/[0.02] shrink-0 relative z-10">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#EFB6AD]">
                    <TerminalIcon size={14} />
                    <span>Output Console</span>
                    {isRunning && (
                      <span className="flex items-center gap-1 text-green-400 ml-3">
                        <Loader2 size={10} className="animate-spin" /> Running
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTerminalLogs([])}
                      className="text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setIsTerminalOpen(false)}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Terminal Body */}
                <div
                  ref={terminalRef}
                  className="flex-1 overflow-y-auto p-5 font-mono text-sm leading-relaxed custom-scrollbar"
                >
                  {terminalLogs.length === 0 && (
                    <div className="text-white/20 text-xs">No output yet. Run your code to see results.</div>
                  )}
                  {terminalLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`mb-1 ${
                        log.type === 'error'   ? 'text-red-400' :
                        log.type === 'info'    ? 'text-sky-400 opacity-70' :
                        log.type === 'success' ? 'text-green-400' :
                                                 'text-slate-300'
                      }`}
                    >
                      <span className="opacity-25 mr-2 text-[10px]">
                        {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="whitespace-pre-wrap">{log.message}</span>
                    </div>
                  ))}
                  {/* Blinking cursor */}
                  {isRunning && (
                    <div className="mt-1 flex items-center gap-1 text-green-400/60 text-xs">
                      <span className="w-2 h-3.5 bg-green-400/40 animate-pulse inline-block" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar */}
        <AnimatePresence>
          {!isCrisis && (
            <motion.div
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden lg:flex col-span-3 glass-panel rounded-3xl flex-col overflow-hidden bg-white/[0.01] border-white/5"
            >
              <SidebarWidget
                activeFile={activeFile}
                setActiveFile={setActiveFile}
                files={files}
                onCreateFile={handleCreateFile}
                onDeleteFile={(filename) => {
                  // Reuse the same close logic (maintains at-least-1-file guard)
                  const syntheticEvent = { stopPropagation: () => {} };
                  handleCloseFile(filename, syntheticEvent);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background breathing pulse */}
      <AnimatePresence>
        {isCrisis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.1, 0.25, 0.1],
              scale: [1, 1.05, 1]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 pointer-events-none rounded-full blur-[180px] mix-blend-screen -z-10"
            style={{ backgroundColor: theme.bright }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
