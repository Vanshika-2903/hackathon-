import { useEffect, useRef, useState } from 'react';

/**
 * useHandTracking
 * Attaches MediaPipe Hands to an existing video element ref.
 * Returns derived stress signals from hand landmarks.
 */
export default function useHandTracking(videoRef, threshold = 0.4) {
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const prevWristRef = useRef(null);
  const jitterWindowRef = useRef([]);

  const [handData, setHandData] = useState({
    handsDetected: 0,
    handVelocity: 0,
    fingerRatio: 1,
    jitterScore: 0,
    isHandNearHead: false,
  });

  useEffect(() => {
    let active = true;
    let handsInstance = null;
    let lastTime = performance.now();

    const initHands = async () => {
      try {
        const HandsModule = await import('@mediapipe/hands');
        const HandsConstructor = HandsModule.Hands || 
                                 (HandsModule.default && HandsModule.default.Hands) || 
                                 window.Hands;

        if (!HandsConstructor) {
          console.error("Could not find Hands constructor");
          return;
        }

        handsInstance = new HandsConstructor({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });

        handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });

        handsInstance.onResults((results) => {
          if (!active) return;
          
          const now = performance.now();
          const dt = (now - lastTime) / 1000;
          lastTime = now;

          const numHands = results.multiHandLandmarks?.length || 0;

          if (numHands === 0) {
            prevWristRef.current = null;
            setHandData(prev => ({ ...prev, handsDetected: 0, handVelocity: 0, isHandNearHead: false }));
            return;
          }

          const landmarks = results.multiHandLandmarks[0];
          
          // 1. Wrist velocity
          const wrist = landmarks[0];
          let velocity = 0;
          if (prevWristRef.current && dt > 0) {
            const dx = (wrist.x - prevWristRef.current.x) * 640;
            const dy = (wrist.y - prevWristRef.current.y) * 480;
            velocity = Math.sqrt(dx * dx + dy * dy) / dt;
          }
          prevWristRef.current = { x: wrist.x, y: wrist.y };

          // 2. Finger ratio
          const tipIds = [8, 12, 16, 20];
          const pipIds = [6, 10, 14, 18];
          let extended = 0;
          for (let i = 0; i < tipIds.length; i++) {
            if (landmarks[tipIds[i]].y < landmarks[pipIds[i]].y) extended++;
          }
          const fingerRatio = extended / 4;

          // 3. Jitter
          jitterWindowRef.current.push(wrist.x);
          if (jitterWindowRef.current.length > 10) jitterWindowRef.current.shift();
          const mean = jitterWindowRef.current.reduce((a, b) => a + b, 0) / jitterWindowRef.current.length;
          const variance = jitterWindowRef.current.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / jitterWindowRef.current.length;
          const jitterScore = Math.min(100, Math.round(variance * 100000));

          // 4. Hand on Head Pose (normalized Y comparison)
          const avgY = landmarks.reduce((sum, lm) => sum + lm.y, 0) / landmarks.length;
          const isHandNearHead = avgY < threshold; 

          setHandData({
            handsDetected: numHands,
            handVelocity: Math.round(velocity),
            fingerRatio: Math.round(fingerRatio * 100) / 100,
            jitterScore,
            isHandNearHead,
          });
        });

        handsRef.current = handsInstance;
        
        const processFrame = async () => {
          if (!active || !handsRef.current) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            try {
              await handsRef.current.send({ image: video });
            } catch (e) {}
          }
          rafRef.current = requestAnimationFrame(processFrame);
        };
        rafRef.current = requestAnimationFrame(processFrame);

      } catch (err) {
        console.error("Hands tracking init error:", err);
      }
    };

    initHands();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (handsInstance) handsInstance.close();
    };
  }, [videoRef, threshold]);

  return handData;
}