const express = require('express');
const router = express.Router();
const { getSession, logSuggestion, getTopMistake } = require('../store/sessions');
const { predictIntent } = require('../services/gemini');

/**
 * POST /api/predict-intent
 * Called when shouldTriggerAI or shouldTriggerDeadZone is true.
 * Sends code + context to Gemini and returns intent + suggestion.
 */
router.post('/', async (req, res) => {
  const {
    sessionId,
    currentCode = '',
    lastActions = [],
    triggerReason = 'stress', // 'stress' | 'dead_zone'
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = getSession(sessionId);
  const topMistake = getTopMistake(sessionId);
  const language = session.language || 'javascript';

  // Enrich lastActions with trigger reason
  const enrichedActions = [
    ...lastActions,
    triggerReason === 'dead_zone' ? 'idle_for_60s' : 'high_stress_detected',
    topMistake ? `recurring_${topMistake.type.replace(/\s/g, '_').toLowerCase()}` : null,
  ].filter(Boolean);

  try {
    const result = await predictIntent({
      currentCode,
      lastActions: enrichedActions,
      topMistake,
      language,
    });

    // Log to developer memory
    logSuggestion(sessionId, {
      intent: result.intent,
      suggestion: result.suggestion,
      confidence: result.confidence,
      bugType: result.bugType,
    });

    // Customize message tone for dead zone vs stress
    const contextMessage = triggerReason === 'dead_zone'
      ? "You've been stuck for a while. Here's where to start:"
      : "High stress detected. Here's what might be wrong:";

    return res.json({
      intent: result.intent,
      suggestion: result.suggestion,
      confidence: result.confidence,
      bugType: result.bugType || null,
      contextMessage,
      developerMemory: topMistake
        ? `You've hit "${topMistake.type}" ${topMistake.count} times this session.`
        : null,
      sessionStats: {
        aiTriggerCount: session.aiTriggerCount,
        totalBugsFound: session.bugHistory.length,
      },
    });
  } catch (err) {
    console.error('Gemini predict-intent error:', err.message);
    return res.status(500).json({ error: 'AI prediction failed', details: err.message });
  }
});

module.exports = router;
