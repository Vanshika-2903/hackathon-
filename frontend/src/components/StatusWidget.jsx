import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BrainCircuit, Watch } from 'lucide-react';

export default function StatusWidget({ sessionData, setSessionData, theme, isDevMode, setAlert }) {
  const { state } = sessionData;
  const isStressed = ['warning', 'crisis', 'meltdown', 'dead_zone'].includes(state);

  const stateLabels = {
    idle: 'Idle (Calm)',
    flow: 'Flow State (Focus)',
    warning: 'Elevated Stress (Warning)',
    crisis: 'High Stress (Crisis)',
    meltdown: 'Critical Meltdown (Intervention)',
    dead_zone: 'Mental Block / Dead Zone'
  };

  const handleForceAI = () => {
    // Manually push stress to meltdown to trigger AI suggestion
    setSessionData(prev => ({
      ...prev,
      stressLevel: 98,
      state: 'meltdown',
    }));
    setAlert({ type: 'crisis', message: 'MANUAL AI INTERVENTION' });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 100 }}
      className="glass-panel w-full rounded-2xl p-3 md:px-7 flex flex-col md:row justify-between items-center gap-4 z-10 border-white/5 shadow-2xl backdrop-blur-3xl"
      style={{ backgroundColor: `${theme.panel}dd`, borderColor: `${theme.bright}44` }}
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <BrainCircuit size={28} style={{ color: theme.bright }} />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">Flux-State Editor</h1>
          <p className="text-xs font-mono opacity-50 tracking-[0.2em] uppercase mt-1">
            {stateLabels[state]}
          </p>
        </div>
      </div>

      <div className="flex-1 w-full max-w-xl md:mx-8 flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <span className="text-xs uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
            <Activity size={12} /> {isDevMode ? 'Override Load' : 'Cognitive Load'}
          </span>
          <span className="font-mono text-sm font-bold" style={{ color: isDevMode ? '#EAB308' : theme.bright }}>
            {sessionData.stressLevel}/100
          </span>
        </div>

        <AnimatePresence mode="wait">
          {state === 'flow' && !isDevMode ? (
            <motion.div 
              key="flow-msg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-2 flex items-center justify-center"
            >
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#EF88AD] animate-pulse">
                ✨ Transcendent Flow State — Keep Building. You've got this. ✨
              </p>
            </motion.div>
          ) : isDevMode ? (
            <motion.div key="dev-slider" className="flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={sessionData.stressLevel}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  let newState = 'idle';

                  if (val >= 95) newState = 'meltdown';
                  else if (val >= 75) newState = 'crisis';
                  else if (val >= 50) newState = 'warning';
                  else if (val >= 30) newState = 'flow';

                  if (val >= 75 && sessionData.stressLevel < 75) {
                    setAlert({ type: 'crisis', message: 'CRITICAL STRESS (TEST)' });
                    setTimeout(() => setAlert(null), 3000);
                  }

                  setSessionData((prev) => ({
                    ...prev,
                    stressLevel: val,
                    state: newState
                  }));
                }}
                className="w-full accent-yellow-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">0%</span>
                <button 
                  onClick={handleForceAI}
                  className="text-[10px] px-3 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-200 font-bold uppercase tracking-widest rounded-md transition-all"
                >
                  Force AI Suggestion
                </button>
                <span className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">100%</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="stress-bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-2 w-full rounded-full bg-white/5 overflow-hidden shrink-0 border border-white/5 relative"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: theme.accent, boxShadow: `0 0 15px ${theme.accent}` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, sessionData.stressLevel)}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 1.2 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto text-xs font-mono font-bold tracking-wider">
        {isDevMode && (
          <div className="px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-2 bg-yellow-500 text-black border-yellow-400">
            DEV MODE
          </div>
        )}
        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap opacity-40">
          <Watch size={14} /> ID: {sessionData.sessionId?.slice(0, 8)}
        </div>
        {isStressed && (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await fetch('http://localhost:3000/api/telemetry/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: sessionData.sessionId })
                  });
                  setSessionData(prev => ({ ...prev, stressLevel: 0, state: 'idle' }));
                  setAlert({ type: 'warning', message: 'Override applied. State reset.' });
                  setTimeout(() => setAlert(null), 3000);
                } catch (e) {}
              }}
              className="px-3 py-1 rounded-full border bg-black/40 hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
              style={{ borderColor: theme.bright, color: theme.bright }}
            >
              Force Calm (Go Back)
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full border animate-pulse bg-black/40 pointer-events-none"
              style={{ borderColor: theme.bright, color: theme.bright, boxShadow: `0 0 10px ${theme.bright}44` }}
            >
              CRITICAL
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
