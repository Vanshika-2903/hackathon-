import { motion } from 'framer-motion';
import { Activity, BrainCircuit, Watch } from 'lucide-react';

export default function StatusWidget({ sessionData, setSessionData, theme, isDevMode, setIsDevMode, setAlert }) {
  const { stressLevel, state } = sessionData;
  const isStressed = state === 'stressed' || state === 'dead_zone';

  // Format state for display
  const stateLabels = {
    idle: 'Idle',
    flow: 'Flow State',
    stressed: 'Elevated Stress',
    dead_zone: 'Mental Block / Dead Zone'
  };

  return (
    <motion.div 
      layout
      transition={{ type: "spring", stiffness: 100 }}
      className="glass-panel w-full rounded-2xl p-3 md:px-7 flex flex-col md:row justify-between items-center gap-4 z-10 border-white/5 shadow-2xl backdrop-blur-3xl"
      style={{ backgroundColor: `${theme.panel}dd`, borderColor: `${theme.bright}44` }}
    >
      {/* Left: Branding & Status */}
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

      {/* Middle: Stress Meter */}
      <div className="flex-1 w-full max-w-xl md:mx-8 flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <span className="text-xs uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
            <Activity size={12} /> {isDevMode ? 'Override Load' : 'Cognitive Load'}
          </span>
          <span className="font-mono text-sm font-bold" style={{ color: isDevMode ? '#EAB308' : theme.bright }}>
            {sessionData.stressLevel}/100
          </span>
        </div>

        {isDevMode ? (
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sessionData.stressLevel}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              let newState = 'idle';
              if (val > 75) newState = 'dead_zone';
              else if (val > 50) newState = 'stressed';
              else if (val > 25) newState = 'flow';
              
              if (val >= 75 && sessionData.stressLevel < 75) {
                setAlert({ type: 'crisis', message: 'CRITICAL STRESS (TEST)' });
                setTimeout(() => setAlert(null), 3000);
              }

              setSessionData(prev => ({
                ...prev,
                stressLevel: val,
                state: newState
              }));
            }}
            className="w-full accent-yellow-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
        ) : (
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden shrink-0 border border-white/5 relative">
            <motion.div 
              className="h-full rounded-full"
              style={{ backgroundColor: theme.accent, boxShadow: `0 0 15px ${theme.accent}` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, sessionData.stressLevel)}%` }}
              transition={{ type: "spring", bounce: 0, duration: 1.5 }}
            />
          </div>
        )}
      </div>

      {/* Right: Metrics & Time */}
      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto text-xs font-mono font-bold tracking-wider">
        <button 
          onClick={() => setIsDevMode(!isDevMode)}
          className={`px-4 py-1.5 rounded-full transition-all border shadow-sm flex items-center gap-2 ${
            isDevMode ? 'bg-yellow-500 text-black border-yellow-400 opacity-100' : 'bg-black/40 text-white/40 border-white/10 opacity-60 hover:opacity-100'
          }`}
        >
          {isDevMode ? '🛠️ DEV ON' : '🛠️ DEV MODE'}
        </button>
        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap opacity-40">
          <Watch size={14} /> ID: {sessionData.sessionId?.slice(0, 8)}
        </div>
        {isStressed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1 rounded-full border animate-pulse bg-black/40"
            style={{ borderColor: theme.bright, color: theme.bright, boxShadow: `0 0 10px ${theme.bright}44` }}
          >
            CRITICAL
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
