import { motion } from 'framer-motion';
import { X, Sparkles, AlertTriangle } from 'lucide-react';

export default function MagicFixModal({ suggestion, onDismiss, theme }) {
  if (!suggestion || (!suggestion.intent && !suggestion.suggestion)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-10 right-10 w-96 glass-panel rounded-2xl shadow-2xl overflow-hidden z-50 border-t-4"
      style={{ borderTopColor: theme.bright, backgroundColor: theme.panel }}
    >
      <div className="p-4 flex justify-between items-start border-b border-white/10">
        <div className="flex items-center gap-3">
          <Sparkles className="animate-pulse" size={24} style={{ color: theme.bright }} />
          <h2 className="font-bold text-lg">AI Cognitive Fix</h2>
        </div>
        <button 
          onClick={onDismiss}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {suggestion.contextMessage && (
          <p className="text-sm opacity-80 italic flex gap-2">
            <AlertTriangle size={16} style={{ color: theme.bright }}/>
            {suggestion.contextMessage}
          </p>
        )}
        
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-60 mb-1">Intent Detected</h3>
          <p className="font-semibold text-white/90">{suggestion.intent || 'Unknown task'}</p>
        </div>

        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-60 mb-1">Suggested Fix</h3>
          <div className="p-3 bg-black/40 rounded-lg border border-white/5 mt-1 font-mono text-sm leading-relaxed text-green-300 shadow-inner">
            {suggestion.suggestion}
          </div>
        </div>

        {suggestion.developerMemory && (
          <div className="mt-2 text-xs opacity-70 border-l-2 pl-3 py-1" style={{ borderColor: theme.bright }}>
            🧠 {suggestion.developerMemory}
          </div>
        )}
      </div>

      <div className="p-3 bg-black/20 border-t border-white/5 flex justify-end gap-3">
        <button 
          className="px-4 py-2 rounded-lg text-sm font-bold opacity-80 hover:opacity-100 hover:bg-white/10 transition-colors"
          onClick={onDismiss}
        >
          Dismiss
        </button>
        <button 
          className="px-4 py-2 rounded-lg text-sm font-bold text-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
          style={{ backgroundColor: theme.bright }}
          onClick={onDismiss} // In a real app, this might apply the code fix
        >
          Acknowledge
        </button>
      </div>
    </motion.div>
  );
}
