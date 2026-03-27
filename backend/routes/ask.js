const express = require('express');
const router = express.Router();
const { getSession } = require('../store/sessions');
const { askQuestion } = require('../services/gemini');

/**
 * POST /api/ask
 * Natural language Q&A about the user's code.
 * Triggered via Command Palette (Ctrl+Shift+P) on the frontend.
 */
router.post('/', async (req, res) => {
  const {
    sessionId,
    code = '',
    question = '',
    language = 'javascript',
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!question.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  const session = getSession(sessionId);

  try {
    const result = await askQuestion({
      code,
      question,
      language: session.language || language,
    });

    return res.json({
      question,
      answer: result.answer,
      codeExample: result.codeExample || null,
      confidence: result.confidence,
    });
  } catch (err) {
    console.error('Ask route error:', err.message);
    return res.status(500).json({ error: 'AI query failed', details: err.message });
  }
});

module.exports = router;
