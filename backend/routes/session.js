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
  let session = getSessionReport(id);
  
  // --- MOCK DATA FOR DEMO ---
  if (id === 'test' && !session) {
    const now = Date.now();
    const startTime = now - (25 * 60 * 1000); // 25 mins ago
    
    // Generate 300 points of fluctuating stress
    const mockTimeline = Array.from({ length: 300 }).map((_, i) => {
      const t = startTime + (i * 5000);
      const base = 20 + Math.sin(i / 10) * 15;
      const spike = (i > 180 && i < 220) ? 50 : 0; // Crisis spike
      const score = Math.min(100, Math.max(0, Math.round(base + spike + Math.random() * 10)));
      
      let state = 'flow';
      if (score > 85) state = 'meltdown';
      else if (score > 70) state = 'crisis';
      else if (score > 45) state = 'warning';
      else if (score < 25) state = 'flow';
      else state = 'idle';

      return { timestamp: t, score, state };
    });

    session = {
      sessionId: 'test-cognitive-demo',
      createdAt: startTime,
      lastActivity: now,
      language: 'javascript',
      stressHistory: mockTimeline,
      aiTriggerCount: 12,
      suggestionLog: [
        { timestamp: startTime + 500000, intent: 'Fixing async loop', suggestion: 'Use Promise.all instead of sequential await.', confidence: 0.95 },
        { timestamp: startTime + 800000, intent: 'Memory leak detected', suggestion: 'Cleanup the socket listener in useEffect return.', confidence: 0.88 },
        { timestamp: startTime + 1200000, intent: 'Optimization', suggestion: 'Memoize the BentoGrid component to avoid re-renders.', confidence: 0.92 }
      ],
      bugHistory: [
        { line: 42, type: 'Logic Error', description: 'Infinite loop in telemetry sync.', severity: 'critical' },
        { line: 115, type: 'Syntax Error', description: 'Missing closing brace in EditorWidget.', severity: 'error' }
      ],
      mistakeLog: {
        'Missing Dependencies': 4,
        'Async Race Condition': 3,
        'CSS Overlap': 2
      }
    };
  }

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

  const sessionDurationMs = Math.max(0, (session.lastActivity || Date.now()) - session.createdAt);
  const sessionDurationSeconds = Math.max(1, Math.round(sessionDurationMs / 1000));
  const sessionDurationMin = Math.round(sessionDurationMs / 60000);

  return res.json({
    sessionId: id,
    sessionDurationMinutes: sessionDurationMin,
    sessionDurationSeconds,
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
