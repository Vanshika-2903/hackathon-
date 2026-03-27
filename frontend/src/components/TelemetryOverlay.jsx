import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { Camera, MousePointer2, Keyboard, Activity, Hand } from 'lucide-react';
import useHandTracking from '../hooks/useHandTracking.js';

/**
 * TelemetryOverlay is the "Sensor" of the app.
 * Tracks mouse, keystrokes, facial expressions (face-api.js),
 * and now hand motion (MediaPipe Hands) — all emitted to backend.
 */
export default function TelemetryOverlay({ socket, sessionId }) {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [debugData, setDebugData] = useState(null);

  // Hand tracking hook — consumes same videoRef as face-api
  const { handsDetected, handVelocity, fingerRatio, jitterScore, isHandNearHead } = useHandTracking(videoRef);
  const handDataRef = useRef({ handVelocity, fingerRatio, jitterScore, handsDetected, isHandNearHead });

  // Telemetry rolling window state
  const T = useRef({
    lastPos: null,
    totalDistance: 0,
    clicks: 0,
    keyPresses: 0,
    backspaces: 0,
    hasTyped: false,
    lastTick: Date.now()
  });

  // Sync hand data to ref for the emit loop to avoid re-triggering the interval
  useEffect(() => {
    handDataRef.current = { handVelocity, fingerRatio, jitterScore, handsDetected, isHandNearHead };
  }, [handVelocity, fingerRatio, jitterScore, handsDetected, isHandNearHead]);

  // 1. Mouse & Keyboard Tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (T.current.lastPos) {
        const dx = e.clientX - T.current.lastPos.x;
        const dy = e.clientY - T.current.lastPos.y;
        T.current.totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
      T.current.lastPos = { x: e.clientX, y: e.clientY };
    };
    const handleClick = () => T.current.clicks++;
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      T.current.hasTyped = true;
      T.current.keyPresses++;
      if (e.key === 'Backspace' || e.key === 'Delete') T.current.backspaces++;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 2. Face API Setup
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        console.log("Face models loaded");
        setModelsLoaded(true);
        startVideo();
      } catch (e) {
        console.error("Face API model load error:", e);
      }
    };

    const startVideo = () => {
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            if (videoRef.current) videoRef.current.srcObject = stream;
          })
          .catch(err => console.error("Webcam error:", err));
      }
    };

    loadModels();
  }, []);

  // 3. The 2-Second Emit Loop
  useEffect(() => {
    const interval = setInterval(async () => {
      let faceStressScore = 0;
      let expressions = null;

      if (modelsLoaded && videoRef.current && videoRef.current.videoWidth > 0) {
        try {
          const detections = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          if (detections) {
            expressions = detections.expressions;
            faceStressScore = (expressions.angry * 100) + (expressions.sad * 80) +
                              (expressions.disgusted * 60) + (expressions.fearful * 90);
          }
        } catch (err) {
          console.error("Face detection error:", err);
        }
      }

      const dt = Date.now() - T.current.lastTick;
      const velocity = T.current.totalDistance / (dt / 1000);
      const hData = handDataRef.current;

      const payload = {
        sessionId,
        mouseVelocity: velocity,
        clickRate: T.current.clicks,
        backspaceCount: T.current.backspaces,
        faceStressScore,
        hasTyped: T.current.hasTyped,
        handVelocity: hData.handVelocity,
        fingerRatio: hData.fingerRatio,
        handJitter: hData.jitterScore,
        handsDetected: hData.handsDetected,
        isHandNearHead: hData.isHandNearHead,
      };

      if (socket?.connected) {
        socket.emit('telemetry', payload);
      }

      setDebugData({
        velocity: Math.round(velocity),
        keys: T.current.keyPresses,
        backspaces: T.current.backspaces,
        faceScore: Math.round(faceStressScore),
        expressions,
        ...hData
      });

      T.current = {
        lastPos: T.current.lastPos,
        totalDistance: 0,
        clicks: 0,
        keyPresses: 0,
        backspaces: 0,
        hasTyped: false,
        lastTick: Date.now()
      };
    }, 2000);

    return () => clearInterval(interval);
  }, [modelsLoaded, socket, sessionId]);

  // Finger ratio label
  const fingerLabel = (ratio) => {
    if (ratio === 0) return '✊ Fist';
    if (ratio < 0.5) return '🤏 Partial';
    if (ratio < 1) return '🖐 Open';
    return '🖐 Open';
  };

  return (
    <>
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className="opacity-0 absolute pointer-events-none w-[640px] h-[480px]" 
      />

      <motion.div 
        drag 
        dragConstraints={{ left: -window.innerWidth + 400, right: 0, top: -window.innerHeight + 500, bottom: 0 }}
        dragMomentum={false}
        whileDrag={{ cursor: 'grabbing', scale: 1.02, zIndex: 10000 }}
        className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-auto cursor-grab"
      >
        <div className="glass-panel w-72 rounded-xl p-3 bg-[#0F0F0F]/95 backdrop-blur-3xl border border-white/10 shadow-2xl pointer-events-auto text-white">
          <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2 select-none">
            <Activity className="text-green-400" size={16} />
            <h3 className="font-bold text-sm tracking-wide">Telemetry Debug</h3>
          </div>

          <div className="relative rounded overflow-hidden bg-black aspect-video mb-3 border border-white/5 shadow-inner flex items-center justify-center">
            {!modelsLoaded && <div className="text-xs text-white/50 absolute z-10">Loading models...</div>}
            <VideoPreview videoRef={videoRef} />
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="bg-white/5 p-2 rounded flex flex-col gap-1">
              <div className="flex items-center gap-1 opacity-70">
                <MousePointer2 size={12} /> <span>Mouse</span>
              </div>
              <span className="font-mono font-bold text-blue-400">{debugData?.velocity ?? 0} px/s</span>
            </div>

            <div className="bg-white/5 p-2 rounded flex flex-col gap-1">
              <div className="flex items-center gap-1 opacity-70">
                <Keyboard size={12} /> <span>Input</span>
              </div>
              <span className="font-mono font-bold text-yellow-400">
                {debugData ? `${debugData.keys}k ${debugData.backspaces}⌫` : '0k'}
              </span>
            </div>

            <div className="bg-white/5 p-2 rounded flex flex-col gap-1">
              <div className="flex items-center gap-1 opacity-70">
                <Hand size={12} /> <span>Hand Speed</span>
              </div>
              <span className="font-mono font-bold text-purple-400">
                {debugData?.handsDetected > 0 ? `${debugData.handVelocity} px/s` : '–'}
              </span>
            </div>

            <div className="bg-white/5 p-2 rounded flex flex-col gap-1">
              <div className="flex items-center gap-1 opacity-70">
                <Hand size={12} /> <span>Hand Pose</span>
              </div>
              <span className={`font-mono font-bold ${debugData?.isHandNearHead ? 'text-red-400' : 'text-orange-400'}`}>
                {debugData?.handsDetected > 0 ? (debugData.isHandNearHead ? '🤯 Head Pose' : fingerLabel(debugData.fingerRatio)) : '–'}
              </span>
            </div>

            <div className="bg-white/5 p-2 rounded flex flex-col gap-1 col-span-2">
              <div className="flex items-center justify-between opacity-70 mb-1">
                <div className="flex items-center gap-1">
                  <Camera size={12} /> <span>Face Stress</span>
                </div>
                {debugData?.handsDetected > 0 && (
                  <span className="text-purple-400 text-[10px]">Jitter: {debugData.jitterScore}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (debugData?.faceScore || 0) / 2)}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-red-400 w-8 text-right">
                  {debugData?.faceScore ?? 0}
                </span>
              </div>
              {debugData?.expressions && (
                <div className="flex justify-between mt-1 opacity-60 text-[10px] uppercase font-bold text-white/80">
                  <span>Anger: {Math.round(debugData.expressions.angry * 100)}%</span>
                  <span>Sad: {Math.round(debugData.expressions.sad * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function VideoPreview({ videoRef }) {
  const previewRef = useRef(null);

  useEffect(() => {
    const sync = () => {
      if (previewRef.current && videoRef.current?.srcObject) {
        if (previewRef.current.srcObject !== videoRef.current.srcObject) {
          previewRef.current.srcObject = videoRef.current.srcObject;
        }
      }
    };
    const id = setInterval(sync, 100);
    return () => clearInterval(id);
  }, [videoRef]);

  return (
    <video
      ref={previewRef}
      autoPlay muted playsInline
      className="w-full h-full object-cover transform -scale-x-100"
    />
  );
}