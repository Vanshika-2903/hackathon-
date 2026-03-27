const express = require('express');
const router = express.Router();
const { getSessionReport } = require('../store/sessions');

/**
 * GET /api/session/:id
 * Returns the full session report for the Session Report page.
 * Includes stress history, bug history, developer memory, and computed stats.
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const session = getSessionReport(id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // --- Compute session stats ---
  const stressReadings = session.stressHistory.map(h => h.score);
  const avgStress = stressReadings.length
    ? Math.round(stressReadings.reduce((a, b) => a + b, 0) / stressReadings.length)
    : 0;
  const peakStress = stressReadings.length ? Math.max(...stressReadings) : 0;

  const stateCounts = session.stressHistory.reduce((acc, h) => {
    acc[h.state] = (acc[h.state] || 0) + 1;
    return acc;
  }, {});

  const total = session.stressHistory.length || 1;
  const flowPercent = Math.round(((stateCounts.flow || 0) / total) * 100);
  const stressedPercent = Math.round(((stateCounts.stressed || 0) / total) * 100);
  const deadZonePercent = Math.round(((stateCounts.dead_zone || 0) / total) * 100);

  // Top recurring mistakes
  const topMistakes = Object.entries(session.mistakeLog)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  const sessionDurationMs = Date.now() - session.createdAt;
  const sessionDurationMin = Math.round(sessionDurationMs / 60000);

  return res.json({
    sessionId: id,
    sessionDurationMinutes: sessionDurationMin,
    createdAt: session.createdAt,
    language: session.language || 'unknown',

    // Stress overview
    averageStress: avgStress,
    peakStress,
    adaptiveThreshold: session.adaptiveThreshold,
    isCalibrated: session.isCalibrated,

    // State breakdown (%)
    stateBreakdown: {
      flow: flowPercent,
      stressed: stressedPercent,
      dead_zone: deadZonePercent,
      idle: Math.max(0, 100 - flowPercent - stressedPercent - deadZonePercent),
    },

    // Timeline for graph
    stressTimeline: session.stressHistory,

    // Bug report
    totalBugsDetected: session.bugHistory.length,
    bugHistory: session.bugHistory,

    // AI interventions
    totalAITriggers: session.aiTriggerCount,
    suggestionLog: session.suggestionLog,

    // Developer memory
    topMistakes,

    // Raw mistake log
    mistakeLog: session.mistakeLog,
  });
});

module.exports = router;
