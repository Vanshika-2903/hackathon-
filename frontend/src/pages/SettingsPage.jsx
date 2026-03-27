import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft, Camera, Bell, Hand, ShieldCheck, RefreshCw, Smartphone, Monitor, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useHandTracking from '../hooks/useHandTracking';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    enableFaceTracking: true,
    enableHandTracking: true,
    stressThreshold: 75,
    privacyMode: false,
    sensitivity: 50
  });

  const [saved, setSaved] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const videoRef = useRef(null);

  // Hook into the hand tracking with current threshold
  const { isHandNearHead, handsDetected } = useHandTracking(videoRef, (settings.poseThreshold || 40) / 100);

  useEffect(() => {
    if (isCalibrating) {
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            if (videoRef.current) videoRef.current.srcObject = stream;
          })
          .catch(err => {
            console.error("Webcam error:", err);
            setIsCalibrating(false);
          });
      }
    } else {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isCalibrating]);

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

          {/* New Calibration Section */}
          <div className="lg:col-span-2 glass-panel p-8 rounded-3xl bg-[#3A0519]/10 border-white/5 space-y-8 overflow-hidden relative">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-4 opacity-80">
              <Hand size={20} className="text-[#EF88AD]"/> Sensor Calibration
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-4 lg:col-span-1">
                <p className="font-bold text-lg">Hand-on-Head Calibration</p>
                <p className="text-sm text-white/40 leading-relaxed">
                  Flux-State detects when you rest your head in your hands. Strike the pose while testing to find your ideal threshold.
                </p>
                <div className="flex flex-col gap-4 mt-6">
                   <button 
                    onClick={() => setIsCalibrating(!isCalibrating)}
                    className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 ${
                      isCalibrating 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-[#A53860] hover:bg-[#A53860]/80 text-white shadow-[0_0_20px_rgba(165,56,96,0.3)]'
                    }`}
                   >
                     {isCalibrating ? <RefreshCw size={18} className="animate-spin-slow" /> : <Hand size={18} />}
                     {isCalibrating ? 'STOP TEST' : 'START POSÉ TEST'}
                   </button>
                   <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-white/5 border border-white/5">
                      <div className={`w-2 h-2 rounded-full ${isCalibrating ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                      <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
                        {isCalibrating ? 'Sensor Active' : 'Sensor Hibernating'}
                      </span>
                   </div>
                </div>
              </div>

              <div className="space-y-8 lg:col-span-2">
                 <div className="relative group">
                    <SliderRow 
                        label="Pose Sensitivity" 
                        desc="Y-Coordinate threshold for head-near-hand detection."
                        val={settings.poseThreshold || 40}
                        min={20}
                        max={60}
                        unit="%"
                        onChange={(v) => handleSlider('poseThreshold', v)}
                    />
                    
                    <AnimatePresence>
                      {isCalibrating && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-8 space-y-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Calibration Feed</span>
                             {handsDetected > 0 ? (
                               <span className="flex items-center gap-2 text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                                 <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> HAND TRACKED
                               </span>
                             ) : (
                               <span className="text-xs font-bold text-white/20 px-3 py-1 bg-white/5 rounded-full">NO HANDS DETECTED</span>
                             )}
                          </div>
                          
                          <div className="flex gap-4 items-end">
                            <div className="relative w-48 aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                               <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                               <div className="absolute inset-x-0 top-0 h-[1px] bg-[#A53860]/50 shadow-[0_0_10px_rgba(165,56,96,1)]" style={{ top: `${settings.poseThreshold || 40}%` }} />
                            </div>

                            <motion.div 
                              animate={{ 
                                backgroundColor: isHandNearHead ? 'rgba(165, 56, 96, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                borderColor: isHandNearHead ? 'rgba(165, 56, 96, 0.6)' : 'rgba(255, 255, 255, 0.1)',
                                scale: isHandNearHead ? 1.05 : 1
                              }}
                              className="flex-1 h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-colors"
                            >
                              <p className={`text-xs font-bold tracking-widest uppercase ${isHandNearHead ? 'text-white' : 'text-white/20'}`}>
                                {isHandNearHead ? '🤯 POSE DETECTED' : 'Awaiting Pose...'}
                              </p>
                              {isHandNearHead && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-[10px] bg-white text-[#A53860] px-2 py-0.5 rounded font-black"
                                >
                                  STRESS SIGNALED
                                </motion.div>
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
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