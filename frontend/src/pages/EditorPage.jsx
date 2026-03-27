import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import TelemetryOverlay from '../components/TelemetryOverlay.jsx';
import BentoGrid from '../components/BentoGrid.jsx';
import { Link } from 'react-router-dom';
import { CheckSquare, AlertTriangle, Zap } from 'lucide-react';
import { isDevModeEnabled } from '../config/devMode.js';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log("CONNECTED TO BACKEND WS:", socket.id);
});

socket.on('connect_error', (err) => {
  console.error("SOCKET CONNECTION ERROR:", err);
});

const THEMES = {
  flow: { bg: '#0F0F0F', panel: '#232D3F', accent: '#005B41', bright: '#008170' },
  warning: { bg: '#441752', panel: '#8174A0', accent: '#A888B5', bright: '#EFB6C8' },
  crisis: { bg: '#3A0519', panel: '#670D2F', accent: '#A53860', bright: '#EF88AD' },
  meltdown: { bg: '#100000', panel: '#4A0000', accent: '#FF0000', bright: '#FF3333' }
};

function computeStateBreakdown(stressTimeline = [], fallbackState = 'idle') {
  if (!stressTimeline.length) {
    return {
      flow: fallbackState === 'flow' ? 100 : 0,
      stressed: ['warning', 'crisis', 'meltdown'].includes(fallbackState) ? 100 : 0,
      dead_zone: fallbackState === 'dead_zone' ? 100 : 0,
      idle: fallbackState === 'idle' ? 100 : 0,
    };
  }

  const stateCounts = stressTimeline.reduce((acc, entry) => {
    let category = entry.state;
    if (['warning', 'crisis', 'meltdown'].includes(entry.state)) {
      category = 'stressed';
    }
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const total = stressTimeline.length;
  const flow = Math.round(((stateCounts.flow || 0) / total) * 100);
  const stressed = Math.round(((stateCounts.stressed || 0) / total) * 100);
  const deadZone = Math.round(((stateCounts.dead_zone || 0) / total) * 100);

  return {
    flow,
    stressed,
    dead_zone: deadZone,
    idle: Math.max(0, 100 - flow - stressed - deadZone),
  };
}

export default function EditorPage() {
  const [isDevMode, setIsDevMode] = useState(isDevModeEnabled);
  const suggestionRequestRef = useRef({
    inFlight: false,
    lastSignature: '',
    lastRequestedAt: 0,
  });
  const [sessionStartedAt] = useState(() => Date.now());
  const [stressTimeline, setStressTimeline] = useState(() => ([
    { timestamp: Date.now(), score: 0, state: 'idle' }
  ]));
  const [suggestionLog, setSuggestionLog] = useState([]);
  const [alert, setAlert] = useState(null); // { type: 'warning' | 'crisis', message: string }
  const [sessionData, setSessionData] = useState({
    sessionId: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    stressLevel: 0,
    state: 'idle',
    activeLanguage: 'javascript',
    shouldTriggerAI: false,
    aiSuggestion: null,
  });

  const handleResetStress = () => {
    socket.emit('reset', { sessionId: sessionData.sessionId });
    setAlert(null);
    setSessionData(prev => ({
      ...prev,
      stressLevel: 0,
      state: 'idle',
      shouldTriggerAI: false,
      aiSuggestion: null
    }));
  };

  // Keep dev mode state accessible to the socket listener
  useEffect(() => {
    window.__IS_DEV_MODE__ = isDevMode;
  }, [isDevMode]);

  const appendStressSample = (score, state) => {
    setStressTimeline(prev => {
      const nextEntry = { timestamp: Date.now(), score, state };
      const lastEntry = prev[prev.length - 1];

      if (
        lastEntry &&
        lastEntry.score === nextEntry.score &&
        lastEntry.state === nextEntry.state &&
        nextEntry.timestamp - lastEntry.timestamp < 1500
      ) {
        return prev;
      }

      return [...prev.slice(-499), nextEntry];
    });
  };

  const requestInlineSuggestion = ({ triggerReason, stressLevel, state }) => {
    const now = Date.now();
    const code = window.__currentCode || '';
    const language = sessionData.activeLanguage || 'javascript';
    const editorContext = window.__editorContext || {};
    const requestContext = {
      activeFile: editorContext.activeFile || null,
      cursorOffset: Number.isInteger(editorContext.cursorOffset) ? editorContext.cursorOffset : code.length,
      cursorPrefix: editorContext.cursorPrefix || '',
      cursorSuffix: editorContext.cursorSuffix || '',
    };
    const codeSignature = code.slice(-240);
    const signature = [
      triggerReason,
      state,
      stressLevel,
      language,
      requestContext.activeFile,
      requestContext.cursorOffset,
      requestContext.cursorPrefix.slice(-120),
      codeSignature,
    ].join('|');

    if (suggestionRequestRef.current.inFlight) {
      return;
    }

    // STRICT GLOBAL THROTTLE: Never fire AI requests faster than 15 seconds
    // to prevent burning through Gemini free tier quotas.
    if (now - suggestionRequestRef.current.lastRequestedAt < 15000) {
      return;
    }

    suggestionRequestRef.current.inFlight = true;
    suggestionRequestRef.current.lastSignature = signature;
    suggestionRequestRef.current.lastRequestedAt = now;

    fetch('http://localhost:3000/api/predict-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        triggerReason,
        currentCode: code,
        language,
        activeFile: requestContext.activeFile,
        cursorOffset: requestContext.cursorOffset,
        cursorPrefix: requestContext.cursorPrefix,
        cursorSuffix: requestContext.cursorSuffix,
        lastActions: [
          `state_${state}`,
          `stress_${stressLevel}`,
        ],
      })
    })
      .then((res) => res.json())
      .then((aiRes) => {
        const anchoredSuggestion = {
          ...aiRes,
          triggerReason,
          activeFile: requestContext.activeFile,
          cursorOffset: requestContext.cursorOffset,
        };

        setSuggestionLog((prev) => [...prev, {
          timestamp: Date.now(),
          intent: aiRes.intent,
          inlineHint: aiRes.inlineHint,
          suggestion: aiRes.suggestion,
          suggestedCode: aiRes.suggestedCode,
          confidence: aiRes.confidence,
          triggerReason,
          activeFile: requestContext.activeFile,
          cursorOffset: requestContext.cursorOffset,
        }]);
        setSessionData((prev) => ({ ...prev, aiSuggestion: anchoredSuggestion }));
      })
      .catch(console.error)
      .finally(() => {
        suggestionRequestRef.current.inFlight = false;
      });
  };

  useEffect(() => {
    socket.on('telemetry_result', (data) => {
      if (window.__IS_DEV_MODE__) return;

      console.log("Telemetry Result received:", data);
      window.__lastState = data.state; // Sync to window for TelemetryOverlay audio
      appendStressSample(data.stressLevel, data.state);

      setSessionData(prev => {
        // Trigger alerts when crossing thresholds
        if (data.stressLevel >= 75 && prev.stressLevel < 75) {
          setAlert({ type: 'crisis', message: 'CRITICAL STRESS DETECTED' });
          setTimeout(() => setAlert(null), 5000);
        } else if (data.stressLevel >= 50 && prev.stressLevel < 50) {
          setAlert({ type: 'warning', message: 'ELEVATED STRESS DETECTED' });
          setTimeout(() => setAlert(null), 4000);
        }

        return {
          ...prev,
          stressLevel: data.stressLevel,
          state: data.state,
        };
      });

      const shouldOfferInlineAssist =
        data.shouldTriggerAI ||
        data.state === 'crisis' || 
        data.state === 'meltdown';

      if (shouldOfferInlineAssist) {
        requestInlineSuggestion({
          triggerReason: data.shouldTriggerDeadZone ? 'dead_zone' : 'stress',
          stressLevel: data.stressLevel,
          state: data.state,
        });
      }
    });

    return () => socket.off('telemetry_result');
  }, [sessionData.sessionId, sessionData.activeLanguage]);

  useEffect(() => {
    if (isDevMode) {
      appendStressSample(sessionData.stressLevel, sessionData.state);
    }
  }, [isDevMode, sessionData.stressLevel, sessionData.state]);

  useEffect(() => {
    if (!isDevMode) {
      return;
    }

    if (sessionData.state === 'dead_zone') {
      requestInlineSuggestion({
        triggerReason: 'dead_zone',
        stressLevel: sessionData.stressLevel,
        state: sessionData.state,
      });
      return;
    }

    if (sessionData.state === 'warning' || sessionData.state === 'crisis' || sessionData.state === 'meltdown' || sessionData.stressLevel >= 50) {
      requestInlineSuggestion({
        triggerReason: 'stress',
        stressLevel: sessionData.stressLevel,
        state: sessionData.state,
      });
    }
  }, [isDevMode, sessionData.state, sessionData.stressLevel, sessionData.activeLanguage]);

  let currentThemeName = 'flow';
  if (sessionData.stressLevel >= 95) {
    currentThemeName = 'meltdown';
  } else if (sessionData.stressLevel > 75 || sessionData.state === 'dead_zone') {
    currentThemeName = 'crisis';
  } else if (sessionData.stressLevel > 50) {
    currentThemeName = 'warning';
  }

  // Reality-Sync: If it's after 8 PM, shift the 'flow' theme to a warmer 'night' mode
  const isNightTime = new Date().getHours() >= 20 || new Date().getHours() < 6;
  let theme = { ...THEMES[currentThemeName] };
  
  if (currentThemeName === 'flow' && isNightTime) {
    theme = {
      ...theme,
      bg: '#0A0500',      // Warmer, deep charcoal
      panel: '#1A0F0A',   // Hint of amber in panels
      accent: '#4A2B10',  // Warm amber accent
      bright: '#D4883C',  // Soft candle-light glow
    };
  }

  const stateBreakdown = computeStateBreakdown(stressTimeline, sessionData.state);
  const stressReadings = stressTimeline.map(entry => entry.score);
  const reportSnapshot = {
    sessionId: sessionData.sessionId,
    sessionDurationMinutes: Math.round((Date.now() - sessionStartedAt) / 60000),
    sessionDurationSeconds: Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000)),
    createdAt: sessionStartedAt,
    averageStress: stressReadings.length
      ? Math.round(stressReadings.reduce((sum, score) => sum + score, 0) / stressReadings.length)
      : 0,
    peakStress: stressReadings.length ? Math.max(...stressReadings) : sessionData.stressLevel,
    stateBreakdown,
    stressTimeline,
    totalBugsDetected: 0,
    bugHistory: [],
    totalAITriggers: suggestionLog.length,
    suggestionLog,
    topMistakes: [],
    mistakeLog: {},
  };

  return (
    <div 
      className="min-h-screen w-full flex overflow-hidden transition-colors duration-1000 relative"
      style={{
        backgroundColor: theme.bg,
        color: '#ffffff',
        '--color-panel': theme.panel,
        '--color-accent': theme.accent,
        '--color-bright': theme.bright,
      }}
    >
      <TelemetryOverlay
        socket={socket}
        sessionId={sessionData.sessionId}
        isDevMode={isDevMode}
        language={sessionData.activeLanguage}
      />
      <BentoGrid 
        sessionData={sessionData} 
        setSessionData={setSessionData}
        theme={theme} 
        isDevMode={isDevMode}
        setAlert={setAlert}
        onActiveLanguageChange={(language) => {
          setSessionData((prev) => (
            prev.activeLanguage === language ? prev : { ...prev, activeLanguage: language }
          ));
        }}
        // Pass these down so we can render them in the header area
        extraActions={(
          <div className="flex items-center gap-2 mr-2">
            <button 
              onClick={() => setIsDevMode(!isDevMode)}
              title={isDevMode ? "Turn Off Dev Mode" : "Turn On Dev Mode"}
              className={`px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 border ${
                isDevMode 
                  ? 'bg-yellow-500 text-black border-yellow-400' 
                  : 'bg-white/5 text-white/40 hover:text-white border-white/10'
              }`}
            >
              {isDevMode ? "Dev Mode: ON" : "Dev Mode: OFF"}
            </button>
            <button 
              onClick={handleResetStress}
              title="Reset Stress Score"
              className="px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
            >
              Reset Stress
            </button>
            <Link 
              to={`/report/${sessionData.sessionId}`} 
              state={{ reportSnapshot }}
              onClick={() => socket.emit('end_session', { sessionId: sessionData.sessionId })}
              title="Finish Session"
              className="px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckSquare size={12}/> Finish
            </Link>
            <Link 
              to="/settings" 
              title="Settings"
              className="px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
            >
              Settings
            </Link>
          </div>
        )}
      />

      {/* Stress Alert Popup */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 rounded-2xl border-2 flex items-center gap-4 shadow-2xl backdrop-blur-2xl ${
              alert.type === 'crisis' ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-purple-500/20 border-purple-500 text-purple-200'
            }`}
          >
            <div className={`p-2 rounded-full ${alert.type === 'crisis' ? 'bg-red-500' : 'bg-purple-500'} text-white`}>
              {alert.type === 'crisis' ? <Zap size={20} fill="currentColor" /> : <AlertTriangle size={20} />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">Cognitive Alert</span>
              <span className="font-bold text-lg">{alert.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
