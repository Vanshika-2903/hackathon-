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
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="border-b border-white/10 bg-black/30 px-5 py-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="mt-0.5 w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${theme.bright}22`, color: theme.bright }}
            >
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-[0.24em] opacity-60">
                  Gemini Inline Assist
                </span>
                {suggestion.intent && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                    {suggestion.intent}
                  </span>
                )}
                {activeFile && (
                  <span className="text-xs text-white/35 font-mono">{activeFile}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/90 leading-relaxed">
                {suggestion.inlineHint || suggestion.suggestion}
              </p>
              {suggestion.suggestion && suggestion.suggestion !== suggestion.inlineHint && (
                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                  {suggestion.suggestion}
                </p>
              )}
              {suggestion.suggestedCode && (
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/5 bg-black/35 p-3 text-xs leading-6 text-green-300 font-mono">
                  {suggestion.suggestedCode}
                </pre>
              )}
              {suggestion.developerMemory && (
                <p className="mt-3 text-xs text-white/45">{suggestion.developerMemory}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onApply}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black transition-all hover:brightness-110"
              style={{ backgroundColor: theme.bright }}
            >
              <Wand2 size={14} /> Insert
            </button>
            <button
              onClick={onDismiss}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition-colors hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
