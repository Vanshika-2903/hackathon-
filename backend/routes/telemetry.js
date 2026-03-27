const express = require('express');
const router = express.Router();
const { getSession, updateSessionStress, updateTypingActivity } = require('../store/sessions');

/**
 * POST /api/telemetry
 * Receives raw telemetry signals every 2 seconds from the frontend.
 * Calculates stress score, determines developer state, and decides
 * whether to trigger AI intervention.
 */
router.post('/', (req, res) => {
  const {
    sessionId,
    mouseVelocity = 0,
    clickRate = 0,
    backspaceCount = 0,
    faceStressScore = 0,
    hasTyped = false,      // frontend sends true if user typed in last 2s
    language = 'javascript',
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = getSession(sessionId);

  // --- Update dead zone tracking ---
  if (hasTyped) updateTypingActivity(sessionId);
  const idleMs = Date.now() - session.lastTypingTimestamp;
  const isDeadZone = idleMs > 60000 && faceStressScore > 40; // 60s idle + some face stress

  // --- Calibration Phase (first 15 cycles = ~30 seconds) ---
  if (!session.isCalibrated) {
    session.calibrationSamples.push(faceStressScore);
    if (session.calibrationSamples.length >= 15) {
      const avg = session.calibrationSamples.reduce((a, b) => a + b, 0) / session.calibrationSamples.length;
      // Set adaptive threshold: baseline + 30 points (min 65, max 85)
      session.adaptiveThreshold = Math.min(85, Math.max(65, avg + 30));
      session.isCalibrated = true;
    }
  }

  // --- Stress Formula ---
  // Normalize inputs (cap velocity at 5000, clicks at 20, backspaces at 30)
  const normalizedVelocity = Math.min(mouseVelocity, 5000) / 5000 * 100;
  const normalizedClicks = Math.min(clickRate, 20) / 20 * 100;
  const normalizedBackspaces = Math.min(backspaceCount, 30) / 30 * 100;
  const normalizedFace = Math.min(faceStressScore, 100);

  const physical = (normalizedVelocity * 0.2) + (normalizedClicks * 0.2) + (normalizedBackspaces * 0.2);
  const stressScore = Math.round(Math.min(100, physical + (normalizedFace * 0.4)));

  // --- Determine Developer State ---
  const threshold = session.adaptiveThreshold;
  let state = 'idle';

  if (isDeadZone) {
    state = 'dead_zone';
    session.consecutiveHighStress = 0;
  } else if (stressScore > threshold) {
    state = 'stressed';
    session.consecutiveHighStress += 1;
  } else if (stressScore < 30 && hasTyped && backspaceCount < 3) {
    state = 'flow';
    session.consecutiveHighStress = 0;
  } else {
    state = 'idle';
    session.consecutiveHighStress = 0;
  }

  // --- Threshold Gate: trigger AI after 2 consecutive high-stress cycles ---
  const shouldTriggerAI = state === 'stressed' && session.consecutiveHighStress >= 2;
  const shouldTriggerDeadZone = state === 'dead_zone' && !session.deadZoneTriggered;

  if (shouldTriggerDeadZone) {
    session.deadZoneTriggered = true;
  }

  if (shouldTriggerAI) {
    session.consecutiveHighStress = 0; // Reset after triggering
  }

  // --- Persist to session ---
  updateSessionStress(sessionId, { stressScore, state });
  session.language = language;

  // --- Response ---
  const stateMessages = {
    flow: 'You are in flow state. Keep going! 🔥',
    stressed: session.consecutiveHighStress >= 1
      ? 'Stress threshold met. Monitoring...'
      : 'Elevated stress detected.',
    dead_zone: 'You seem stuck. Consider taking a breath.',
    idle: 'All calm.',
  };

  return res.json({
    stressLevel: stressScore,
    state,
    shouldTriggerAI,
    shouldTriggerDeadZone,
    adaptiveThreshold: session.adaptiveThreshold,
    isCalibrated: session.isCalibrated,
    message: stateMessages[state] || 'Monitoring.',
  });
});

module.exports = router;
