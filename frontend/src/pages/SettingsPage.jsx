import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft, Camera, Bell, Hand, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    enableFaceTracking: true,
    enableHandTracking: true,
    stressThreshold: 75,
    privacyMode: false,
    sensitivity: 50
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('flux_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse settings");
      }
    }
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('flux_settings', JSON.stringify(newSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSetting = (key) => {
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSlider = (key, val) => {
    saveSettings({ ...settings, [key]: parseInt(val) });
  };

  const resetDefaults = () => {
    const defaults = {
      enableFaceTracking: true,
      enableHandTracking: true,
      stressThreshold: 75,
      privacyMode: false,
      sensitivity: 50
    };
    saveSettings(defaults);
  };

  return (
    <div className="min-h-screen bg-[#050103] text-[#f0e6ea] p-6 md:p-12 font-sans selection:bg-[#A53860]/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-[#EF88AD]/60 hover:text-[#EF88AD] transition-colors mb-4 group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="text-base font-semibold uppercase tracking-wider">Back to Home</span>
            </Link>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight flex items-center gap-6">
              <Settings className="text-[#A53860]" size={56}/> Settings
            </h1>
            <p className="text-white/60 text-lg max-w-xl leading-relaxed">Configure your Flux-State Cognitive limits, biometrics, and privacy preferences.</p>
          </div>

          {saved && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
            >
              <ShieldCheck size={14} /> CHANGES SAVED
            </motion.div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tracking Controls */}
          <div className="glass-panel p-8 rounded-3xl bg-[#3A0519]/10 border-white/5 space-y-8">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-4 opacity-80">
              <Camera size={20} className="text-[#EF88AD]"/> Biometric Sensors
            </h2>
            
            <div className="space-y-6">
              <ToggleRow 
                label="Face Expression Tracking" 
                desc="Uses face-api.js to detect emotion locally." 
                active={settings.enableFaceTracking}
                onClick={() => toggleSetting('enableFaceTracking')}
              />
              <ToggleRow 
                label="Hand Motion Analysis" 
                desc="Detects stress poses and velocity via MediaPipe." 
                active={settings.enableHandTracking}
                onClick={() => toggleSetting('enableHandTracking')}
              />
              <ToggleRow 
                label="Privacy Mode" 
                desc="Blur video feeds and minimize data collection." 
                active={settings.privacyMode}
                onClick={() => toggleSetting('privacyMode')}
              />
            </div>
          </div>

          {/* Threshold Controls */}
          <div className="glass-panel p-8 rounded-3xl bg-[#3A0519]/10 border-white/5 space-y-8">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-4 opacity-80">
              <Bell size={20} className="text-[#EF88AD]"/> Intervention Logic
            </h2>

            <div className="space-y-10">
              <SliderRow 
                label="Stress Threshold" 
                desc="Base score required to trigger AI support."
                val={settings.stressThreshold}
                min={50}
                max={95}
                unit="pts"
                onChange={(v) => handleSlider('stressThreshold', v)}
              />
              <SliderRow 
                label="Sensor Sensitivity" 
                desc="How quickly the engine reacts to rapid motion."
                val={settings.sensitivity}
                min={10}
                max={100}
                unit="%"
                onChange={(v) => handleSlider('sensitivity', v)}
              />
            </div>
          </div>
        </div>

        <footer className="mt-16 flex justify-between items-center opacity-40">
          <p className="text-sm font-mono">Flux-State v1.0.4 — Build Stable</p>
          <button 
            onClick={resetDefaults}
            className="flex items-center gap-2 text-sm font-bold hover:text-[#EF88AD] transition-colors"
          >
            <RefreshCw size={18} /> RESET TO DEFAULTS
          </button>
        </footer>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, active, onClick }) {
  return (
    <div className="flex justify-between items-center gap-6">
      <div className="space-y-2">
        <p className="font-bold text-lg">{label}</p>
        <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
      </div>
      <button 
        onClick={onClick}
        className={`w-12 h-6 shrink-0 rounded-full transition-all flex items-center px-1 ${
          active ? 'bg-[#A53860]' : 'bg-white/10'
        }`}
      >
        <motion.div 
          animate={{ x: active ? 24 : 0 }}
          className="w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

function SliderRow({ label, desc, val, min, max, unit, onChange }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <p className="font-bold text-lg">{label}</p>
          <p className="text-sm text-white/40">{desc}</p>
        </div>
        <span className="font-mono text-base text-[#EF88AD] bg-[#A53860]/10 px-3 py-1 rounded border border-[#A53860]/20">
          {val}{unit}
        </span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={val} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-[#A53860] h-1.5 bg-white/5 rounded-lg cursor-pointer" 
      />
    </div>
  );
}