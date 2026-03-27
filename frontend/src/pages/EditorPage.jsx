import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import TelemetryOverlay from '../components/TelemetryOverlay.jsx';
import BentoGrid from '../components/BentoGrid.jsx';
import MagicFixModal from '../components/MagicFixModal.jsx';
import { Link } from 'react-router-dom';
import { CheckSquare, AlertTriangle, Zap } from 'lucide-react';

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
  crisis: { bg: '#3A0519', panel: '#670D2F', accent: '#A53860', bright: '#EF88AD' }
};

export default function EditorPage() {
  const [isDevMode, setIsDevMode] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'warning' | 'crisis', message: string }
  const [sessionData, setSessionData] = useState({
    sessionId: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    stressLevel: 0,
    state: 'idle',
    shouldTriggerAI: false,
    aiSuggestion: null,
  });

  // Keep dev mode state accessible to the socket listener
  useEffect(() => {
    window.__IS_DEV_MODE__ = isDevMode;
  }, [isDevMode]);

  useEffect(() => {
    socket.on('telemetry_result', (data) => {
      if (window.__IS_DEV_MODE__) return;

      console.log("Telemetry Result received:", data);

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

      // Trigger AI via REST if threshold met
      if (data.shouldTriggerAI || data.shouldTriggerDeadZone) {
        fetch('http://localhost:3000/api/predict-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            triggerReason: data.shouldTriggerDeadZone ? 'dead_zone' : 'stress',
            currentCode: window.__currentCode || '', 
            lastActions: []
          })
        })
        .then(res => res.json())
        .then(aiRes => {
          setSessionData(prev => ({ ...prev, aiSuggestion: aiRes }));
        })
        .catch(console.error);
      }
    });

    return () => socket.off('telemetry_result');
  }, [sessionData.sessionId]);

  let currentThemeName = 'flow';
  if (sessionData.stressLevel > 75 || sessionData.state === 'dead_zone') {
    currentThemeName = 'crisis';
  } else if (sessionData.stressLevel > 50) {
    currentThemeName = 'warning';
  }
  const theme = THEMES[currentThemeName];

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
      <TelemetryOverlay socket={socket} sessionId={sessionData.sessionId} />
      <BentoGrid 
        sessionData={sessionData} 
        setSessionData={setSessionData}
        theme={theme} 
        isDevMode={isDevMode}
        setIsDevMode={setIsDevMode}
        setAlert={setAlert}
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



      {/* Floating Action Button purely for Hackathon routing back and to reports */}
      <div className="absolute bottom-8 left-8 z-[999] flex gap-4 pointer-events-auto">
        <Link 
          to={`/report/${sessionData.sessionId}`} 
          className="glass-panel px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest bg-black/60 hover:bg-black text-white border border-white/10 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-2xl"
        >
          <CheckSquare size={14}/> Finish Session
        </Link>
        <Link 
          to="/settings" 
          className="glass-panel px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest bg-black/60 hover:bg-black text-white opacity-60 hover:opacity-100 flex items-center gap-2 transition-all hover:scale-105 shadow-2xl"
        >
          Settings
        </Link>
      </div>

      {sessionData.aiSuggestion && (
        <MagicFixModal 
          suggestion={sessionData.aiSuggestion} 
          onDismiss={() => setSessionData(prev => ({ ...prev, aiSuggestion: null }))}
          theme={theme}
        />
      )}
    </div>
  );
}