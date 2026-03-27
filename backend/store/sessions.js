/**
 * In-Memory Session Store
 * Stores all session data using a Node.js Map.
 */

const sessions = new Map();

/**
 * Get or create a session by ID
 */
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),

      // Stress tracking
      consecutiveHighStress: 0,
      stressHistory: [],
      currentState: 'idle',
      currentStress: 0,
      handPoseEMA: 0,

      // Adaptive threshold
      calibrationSamples: [],
      isCalibrated: false,
      adaptiveThreshold: 75,

      // Dead zone tracking
      lastTypingTimestamp: Date.now(),
      deadZoneTriggered: false,

      // Developer memory
      mistakeLog: {},
      aiTriggerCount: 0,
      bugHistory: [],
      suggestionLog: [],
    });
  }

  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

/**
 * Centralized Stress Calculation Logic
 */
function processTelemetry(sessionId, data) {
  const {
    mouseVelocity = 0,
    clickRate = 0,
    backspaceCount = 0,
    faceStressScore = 0,
    hasTyped = false,
    handVelocity = 0,
    fingerRatio = 1,
    handJitter = 0,
    isHandNearHead = false,
  } = data;

  const session = getSession(sessionId);

  // Update activity
  if (hasTyped) {
    session.lastTypingTimestamp = Date.now();
    session.deadZoneTriggered = false;
  }

  const idleMs = Date.now() - session.lastTypingTimestamp;
  const isDeadZone = idleMs > 60000 && faceStressScore > 40;

  // Calibration
  if (!session.isCalibrated) {
    session.calibrationSamples.push(faceStressScore);
    if (session.calibrationSamples.length >= 15) {
      const avg = session.calibrationSamples.reduce((a, b) => a + b, 0) / session.calibrationSamples.length;
      session.adaptiveThreshold = Math.min(85, Math.max(65, avg + 30));
      session.isCalibrated = true;
    }
  }

  // Normalization
  const normalizedVelocity = Math.min(mouseVelocity, 5000) / 5000 * 100;
  const normalizedClicks = Math.min(clickRate, 20) / 20 * 100;
  const normalizedBackspaces = Math.min(backspaceCount, 30) / 30 * 100;
  const normalizedFace = Math.min(faceStressScore, 100);
  const normalizedHandVel = Math.min(handVelocity, 400) / 400 * 100;
  const fistTension = (1 - Math.max(0, Math.min(1, fingerRatio))) * 100;
  const normalizedJitter = Math.min(handJitter, 60) / 60 * 100;

  // Weighting
  const physical = (normalizedVelocity * 0.4) + (normalizedClicks * 0.8) +
                   (normalizedBackspaces * 1.5) + (normalizedHandVel * 0.1) +
                   (fistTension * 0.05) + (normalizedJitter * 0.5);

  let instantaneousStress = Math.min(100, physical + (normalizedFace * 0.5));
  if (isHandNearHead) instantaneousStress = Math.min(100, instantaneousStress + 40);

  // Stickiness
  const prevScore = session.currentStress || 0;
  if (instantaneousStress > prevScore) {
    session.currentStress = prevScore * 0.5 + instantaneousStress * 0.5;
  } else {
    session.currentStress = prevScore;
  }

  const stressScore = Math.round(session.currentStress);

  // Unified States
  let state = 'idle';
  if (isDeadZone) {
    state = 'dead_zone';
  } else if (stressScore >= 95) {
    state = 'meltdown';
  } else if (stressScore >= 75) {
    state = 'crisis';
  } else if (stressScore >= 50) {
    state = 'warning';
  } else if (stressScore < 30 && hasTyped && backspaceCount < 3) {
    state = 'flow';
  }

  // Trigger Logic
  if (state === 'warning' || state === 'crisis' || state === 'meltdown') {
    if (session.consecutiveHighStress >= 0) {
      session.consecutiveHighStress += 1;
    } else {
      session.consecutiveHighStress += 1; // cooldown recovery
    }
  } else {
    session.consecutiveHighStress = 0;
  }

  const shouldTriggerAI = (state === 'warning' || state === 'crisis' || state === 'meltdown' || data.isRageBackspacing) && session.consecutiveHighStress >= 1;
  const shouldTriggerDeadZone = state === 'dead_zone' && !session.deadZoneTriggered;

  if (shouldTriggerAI || data.isRageBackspacing) session.consecutiveHighStress = -8; // Longer cooldown after trigger to prevent spam
  if (shouldTriggerDeadZone) session.deadZoneTriggered = true;

  // Persist
  session.stressHistory.push({ timestamp: Date.now(), score: stressScore, state });
  session.currentState = state;
  if (session.stressHistory.length > 500) session.stressHistory.shift();

  return {
    stressLevel: stressScore,
    state,
    shouldTriggerAI,
    shouldTriggerDeadZone,
    adaptiveThreshold: session.adaptiveThreshold,
    isCalibrated: session.isCalibrated
  };
}

/**
 * Reset session stress
 */
function resetSession(sessionId) {
  const session = getSession(sessionId);
  session.currentStress = 0;
  session.consecutiveHighStress = 0;
  session.handPoseEMA = 0;
  session.currentState = 'idle';
  session.deadZoneTriggered = false;
  session.stressHistory.push({ timestamp: Date.now(), score: 0, state: 'idle' });
  return session;
}

/**
 * Log an AI suggestion
 */
function logSuggestion(sessionId, { intent, suggestion, confidence, bugType }) {
  const session = getSession(sessionId);
  session.suggestionLog.push({ timestamp: Date.now(), intent, suggestion, confidence });
  session.aiTriggerCount += 1;
  if (bugType) {
    session.mistakeLog[bugType] = (session.mistakeLog[bugType] || 0) + 1;
  }
}

/**
 * Log a detected bug
 */
function logBug(sessionId, bugs) {
  const session = getSession(sessionId);
  bugs.forEach(bug => {
    session.bugHistory.push({ timestamp: Date.now(), ...bug, fixed: false });
  });
}

/**
 * Get top mistake
 */
function getTopMistake(sessionId) {
  const session = getSession(sessionId);
  const log = session.mistakeLog;
  const sorted = Object.entries(log).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? { type: sorted[0][0], count: sorted[0][1] } : null;
}

/**
 * Update typing activity
 */
function updateTypingActivity(sessionId) {
  const session = getSession(sessionId);
  session.lastTypingTimestamp = Date.now();
  session.deadZoneTriggered = false;
}

/**
 * Get full session data
 */
function getSessionReport(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Cleanup
 */
function cleanupOldSessions() {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > TWO_HOURS) {
      sessions.delete(id);
    }
  }
}
setInterval(cleanupOldSessions, 30 * 60 * 1000);

module.exports = {
  getSession,
  processTelemetry,
  resetSession,
  logSuggestion,
  logBug,
  getTopMistake,
  updateTypingActivity,
  getSessionReport,
};
