const express = require('express');
const router = express.Router();
const { getSession, logSuggestion, getTopMistake } = require('../store/sessions');
const { predictIntent } = require('../services/gemini');

// Simple in-memory rate limiter to protect Gemini API quotas
const rateLimits = {};
const MIN_COOLDOWN_MS = 15000;

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
    language: requestedLanguage = '',
    activeFile = null,
    cursorOffset = null,
    cursorPrefix = '',
    cursorSuffix = '',
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = getSession(sessionId);
  const topMistake = getTopMistake(sessionId);
  const language = requestedLanguage || session.language || 'javascript';
  session.language = language;

  // Enforce Rate Limit globally per session
  const now = Date.now();
  const lastRequestTime = rateLimits[sessionId] || 0;
  if (now - lastRequestTime < MIN_COOLDOWN_MS) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded.', 
      details: 'Please wait 15 seconds before requesting another AI prediction.' 
    });
  }
  rateLimits[sessionId] = now;

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
      activeFile,
      cursorOffset,
      cursorPrefix,
      cursorSuffix,
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
      inlineHint: result.inlineHint,
      suggestion: result.suggestion,
      suggestedCode: result.suggestedCode || null,
      confidence: result.confidence,
      bugType: result.bugType || null,
      activeFile,
      cursorOffset,
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
