import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Terminal as TerminalIcon } from 'lucide-react';
import EditorWidget from './EditorWidget.jsx';
import SidebarWidget from './SidebarWidget.jsx';
import StatusWidget from './StatusWidget.jsx';

export default function BentoGrid({ sessionData, setSessionData, theme, isDevMode, setIsDevMode, setAlert }) {
  const isCrisis = sessionData.state === 'stressed' || sessionData.state === 'dead_zone';
  
  const [activeFile, setActiveFile] = useState('main.js');
  const [files, setFiles] = useState([
    { name: 'main.js', content: `// Flux-State Cognitive Engine - Main Workspace\n// Write some JS below. If you get stuck, we'll notice.\n\nfunction calculateStressScore() {\n  console.log("Processing telemetry...");\n  return 42;\n}\n\nconsole.log("Calculated Score:", calculateStressScore());` },
    { name: 'script.py', content: `print("Hello from Python Runtime!")\n\ndef analyze_stress():\n    print("Analyzing face metrics...")\n    return 100\n\nanalyze_stress()` },
    { name: 'utils.css', content: `body {\n  margin: 0;\n  display: flex;\n}` },
  ]);

  // Terminal State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const terminalRef = useRef(null);

  useEffect(() => {
    // Auto scroll terminal to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);


  const handleUpdateFile = (filename, newContent) => {
    setFiles(prev => prev.map(f => f.name === filename ? { ...f, content: newContent } : f));
    // Provide the modified content back into the global registry the legacy backend uses
    window.__currentCode = newContent; 
  };

  const handleCreateFile = () => {
    const fileName = window.prompt("Enter file name (e.g. script.py, main.c, notes.txt):", "untitled.txt");
    if (!fileName || fileName.trim() === '') return;

    if (files.find(f => f.name === fileName)) {
      alert("A file with that name already exists in the workspace!");
      return;
    }
    
    // Add file and automatically open it
    setFiles(prev => [...prev, { name: fileName, content: `` }]);
    setActiveFile(fileName);
  };

  const handleRunCode = () => {
    setIsTerminalOpen(true);
    setTerminalLogs([{ type: 'info', message: `> Starting execution environment for ${activeFile}...` }]);

    const fileToRun = files.find(f => f.name === activeFile);
    if (!fileToRun) {
      setTerminalLogs(prev => [...prev, { type: 'error', message: 'File not found in workspace.' }]);
      return;
    }

    if (activeFile.endsWith('.js')) {
      // Map global console to our terminal temporarily
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const logs = [];

      console.log = (...args) => {
        logs.push({ type: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        originalConsoleLog(...args); // keep in real browser console too
      };
      
      console.error = (...args) => {
        logs.push({ type: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        originalConsoleError(...args);
      };

      try {
        // Evaluate the JS Code string securely inside a function wrapper
        const fn = new Function(fileToRun.content);
        fn();
      } catch (err) {
        logs.push({ type: 'error', message: err.toString() });
      } finally {
        // Restore console and commit state
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        setTerminalLogs(prev => [...prev, ...logs, { type: 'success', message: `> Process exited with code 0` }]);
      }
    } else {
      // API call to public execution service (Piston API)
      setTerminalLogs(prev => [...prev, { type: 'info', message: `> Compiling and sending ${activeFile} to Piston execution engine...` }]);
      
      const languageMap = {
        'py': 'python',
        'c': 'c',
        'cpp': 'cpp',
        'java': 'java'
      };
      const extension = activeFile.split('.').pop();
      const pistonLang = languageMap[extension];

      if (!pistonLang) {
         setTerminalLogs(prev => [...prev, { type: 'error', message: `Execution for .${extension} natively is not currently supported.` }]);
         return;
      }

      // We wrap the Local Native call in an async IIFE to await execution
      (async () => {
        try {
          const res = await fetch('http://localhost:3000/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: pistonLang,
              version: '*', // Selects latest runtime version available
              files: [{ content: fileToRun.content }]
            })
          });

          const data = await res.json();

          if (res.status !== 200 || data.message) {
             setTerminalLogs(prev => [...prev, { type: 'error', message: `Local Compiler Error: ${data.message || 'Failed execution request.'}` }]);
             return;
          }

          if (data.compile && data.compile.stderr) {
            setTerminalLogs(prev => [...prev, { type: 'error', message: data.compile.stderr }]);
          }

          if (data.run) {
            if (data.run.stdout) {
              // split newlines and render
              const lines = data.run.stdout.split('\n').filter(Boolean);
              const formattedLogs = lines.map(l => ({ type: 'log', message: l }));
              setTerminalLogs(prev => [...prev, ...formattedLogs]);
            }
            if (data.run.stderr) {
              setTerminalLogs(prev => [...prev, { type: 'error', message: data.run.stderr }]);
            }
            setTerminalLogs(prev => [...prev, { type: 'success', message: `> Process exited with code ${data.run.code}` }]);
          } else {
            setTerminalLogs(prev => [...prev, { type: 'error', message: 'Failed to retrieve execution context.' }]);
          }

        } catch (err) {
          setTerminalLogs(prev => [...prev, { type: 'error', message: `Network Error: Could not reach execution engine. (${err.message})` }]);
        }
      })();
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 relative max-w-[1600px] mx-auto w-full z-10 pointer-events-auto h-screen overflow-hidden font-inter">
      {/* Top Section: Status Bar */}
      <div className="shrink-0">
        <StatusWidget 
          sessionData={sessionData} 
          setSessionData={setSessionData}
          theme={theme} 
          isDevMode={isDevMode}
          setIsDevMode={setIsDevMode}
          setAlert={setAlert}
        />
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Editor Area (Left 8 or 12 columns) */}
        <motion.div 
          layout
          className={`${isCrisis ? 'col-span-12' : 'col-span-12 lg:col-span-9'} flex flex-col gap-4 min-h-0 overflow-hidden`}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          {/* Editor Panel */}
          <div className="glass-panel flex-1 rounded-3xl overflow-hidden flex flex-col relative bg-black/40 border-white/5 shadow-2xl">
            {/* Header of Editor */}
            <div className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/20"></div>
                </div>
                <span className="ml-4 text-xs font-mono font-bold tracking-widest uppercase opacity-40">Workspace / {activeFile}</span>
              </div>
              
              {/* RUN BUTTON */}
              <button 
                onClick={handleRunCode}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-500 text-black hover:bg-green-400 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] text-[13px] font-bold uppercase tracking-widest"
              >
                <Play size={14} fill="currentColor" /> Run Code
              </button>
            </div>
            
            <div className="flex-1 relative min-h-0">
              <EditorWidget 
                activeFile={activeFile} 
                files={files}
                onUpdateFile={handleUpdateFile}
              />
            </div>
          </div>

          {/* Terminal Panel */}
          <AnimatePresence>
            {isTerminalOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "30%", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="glass-panel rounded-3xl flex flex-col overflow-hidden shrink-0 border border-white/5 bg-[#0F0F0F]/90 backdrop-blur-3xl shadow-2xl"
              >
                <div className="h-12 border-b border-white/10 px-6 flex items-center justify-between bg-white/[0.02] shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#EFB6AD]">
                    <TerminalIcon size={16} /> Output Console
                  </div>
                  <button onClick={() => setIsTerminalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                    <X size={16} />
                  </button>
                </div>
                <div ref={terminalRef} className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed custom-scrollbar">
                  {terminalLogs.map((log, i) => (
                    <div key={i} className={`mb-2 ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'info' ? 'text-blue-400 opacity-70' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-slate-400'
                    }`}>
                      <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                      {log.message}
                    </div>
                  ))}
                  <div className="mt-2 flex items-center gap-2 opacity-50 text-sm">
                    <span className="w-2 h-4 bg-white/20 animate-pulse inline-block" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar (Right 3 columns) */}
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual background pulse effect if stressed */}
      <AnimatePresence>
        {isCrisis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none rounded-full blur-[180px] mix-blend-screen -z-10"
            style={{ backgroundColor: theme.bright }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
