import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, X } from 'lucide-react';

export default function InlineSuggestionPanel({ suggestion, activeFile, theme, onApply, onDismiss }) {
  if (!suggestion || (!suggestion.inlineHint && !suggestion.suggestion)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key={`${suggestion.intent}-${suggestion.suggestion}`}
        initial={{ opacity: 0, y: 20, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="absolute bottom-6 right-6 w-[420px] z-[100] rounded-[28px] border border-white/10 p-5 shadow-2xl backdrop-blur-3xl overflow-hidden"
        style={{ backgroundColor: `${theme.panel}ee` }}
      >
        {/* Glow accent */}
        <div 
          className="absolute -top-20 -right-20 w-40 h-40 blur-[60px] opacity-20 pointer-events-none"
          style={{ backgroundColor: theme.bright }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ backgroundColor: `${theme.bright}22`, color: theme.bright, border: `1px solid ${theme.bright}44` }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-40">AI Intervention</h4>
                <p className="text-sm font-bold text-white tracking-tight">{suggestion.intent || 'Potential Roadblock detected'}</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[13px] leading-relaxed text-white/90 font-medium italic">
                 "{suggestion.inlineHint || suggestion.suggestion}"
              </p>
              {suggestion.suggestion && suggestion.suggestion !== suggestion.inlineHint && (
                <p className="mt-2 text-[12px] text-white/50 leading-relaxed">
                  {suggestion.suggestion}
                </p>
              )}
            </div>

            {suggestion.suggestedCode && (
              <div className="relative group">
                <div className="absolute top-2 right-4 text-[9px] font-mono uppercase tracking-widest text-white/20 select-none">
                  Draft Patch
                </div>
                <pre className="max-h-[180px] overflow-y-auto rounded-2xl border border-white/5 bg-black/40 p-4 text-[12px] leading-6 text-[#98C379] font-mono custom-scrollbar">
                  {suggestion.suggestedCode}
                </pre>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onApply}
                className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-3 text-[13px] font-bold uppercase tracking-[0.1em] text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                style={{ backgroundColor: theme.bright }}
              >
                <Wand2 size={16} /> Accept & Patch
              </button>
              <button
                onClick={onDismiss}
                className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-[13px] font-bold uppercase tracking-[0.1em] text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
