/**
 * In-Memory Session Store
 * Stores all session data using a Node.js Map.
 * Each session tracks: stress history, consecutive stress count,
 * bug history, last actions, developer memory (recurring mistakes),
 * dead zone timer, and calibration data.
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
      consecutiveHighStress: 0,   // Counts cycles where stress > threshold
      stressHistory: [],           // Array of { timestamp, score, state }
      currentState: 'idle',        // 'idle' | 'flow' | 'stressed' | 'dead_zone'

      // Adaptive threshold
      calibrationSamples: [],      // First 15 samples used to calibrate baseline
      isCalibrated: false,
      adaptiveThreshold: 75,       // Default, updated after calibration

      // Dead zone tracking
      lastTypingTimestamp: Date.now(),
      deadZoneTriggered: false,

      // Developer memory — tracks recurring mistake types
      mistakeLog: {},              // { 'Type Mismatch': 3, 'Null Reference': 1 }
      aiTriggerCount: 0,

      // Bug history this session
      bugHistory: [],              // Array of { timestamp, line, type, fixed }

      // All AI suggestions this session
      suggestionLog: [],           // Array of { timestamp, intent, suggestion, confidence }
    });
  }

  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

/**
 * Update session after telemetry is processed
 */
function updateSessionStress(sessionId, { stressScore, state }) {
  const session = getSession(sessionId);
  session.stressHistory.push({ timestamp: Date.now(), score: stressScore, state });
  session.currentState = state;

  // Keep history manageable (last 500 entries)
  if (session.stressHistory.length > 500) {
    session.stressHistory.shift();
  }

  return session;
}

/**
 * Log an AI suggestion to session memory
 */
function logSuggestion(sessionId, { intent, suggestion, confidence, bugType }) {
  const session = getSession(sessionId);

  session.suggestionLog.push({ timestamp: Date.now(), intent, suggestion, confidence });
  session.aiTriggerCount += 1;

  // Track recurring mistake types for developer memory
  if (bugType) {
    session.mistakeLog[bugType] = (session.mistakeLog[bugType] || 0) + 1;
  }
}

/**
 * Log a detected bug to session history
 */
function logBug(sessionId, bugs) {
  const session = getSession(sessionId);
  bugs.forEach(bug => {
    session.bugHistory.push({ timestamp: Date.now(), ...bug, fixed: false });
  });
}

/**
 * Get the top recurring mistake for developer memory hints
 */
function getTopMistake(sessionId) {
  const session = getSession(sessionId);
  const log = session.mistakeLog;
  const sorted = Object.entries(log).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? { type: sorted[0][0], count: sorted[0][1] } : null;
}

/**
 * Update the dead zone typing timestamp
 */
function updateTypingActivity(sessionId) {
  const session = getSession(sessionId);
  session.lastTypingTimestamp = Date.now();
  session.deadZoneTriggered = false;
}

/**
 * Get full session data for the report endpoint
 */
function getSessionReport(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Clean up sessions older than 2 hours (prevents memory leaks)
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

// Run cleanup every 30 minutes
setInterval(cleanupOldSessions, 30 * 60 * 1000);

module.exports = {
  getSession,
  updateSessionStress,
  logSuggestion,
  logBug,
  getTopMistake,
  updateTypingActivity,
  getSessionReport,
};
