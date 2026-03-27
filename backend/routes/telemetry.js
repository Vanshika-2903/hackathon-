const express = require('express');
const router = express.Router();
const { processTelemetry, resetSession, updateTypingActivity } = require('../store/sessions');

/**
 * POST /api/telemetry
 */
router.post('/', (req, res) => {
  const { sessionId, language = 'javascript' } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const result = processTelemetry(sessionId, req.body);
  
  const stateMessages = {
    flow: 'You are in flow state. Keep going! 🔥',
    warning: 'Elevated stress detected.',
    crisis: 'High stress detected. Gemini is monitoring...',
    meltdown: 'CRITICAL STRESS. Intervention recommended.',
    dead_zone: 'You seem stuck. Consider taking a breath.',
    idle: 'All calm.',
  };

  return res.json({
    ...result,
    message: stateMessages[result.state] || 'Monitoring.',
  });
});

/**
 * POST /api/telemetry/reset
 */
router.post('/reset', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  resetSession(sessionId);
  return res.json({ success: true, message: 'Stress reset.' });
});

module.exports = router;
