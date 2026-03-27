const express = require('express');
const router = express.Router();
const { getSession, logBug } = require('../store/sessions');
const { checkBugs } = require('../services/gemini');

/**
 * POST /api/check-bugs
 * Proactively scans code for bugs every 5 seconds (debounced on frontend).
 * Returns a list of detected bugs with line numbers, types, and fixes.
 * Hooks directly into Monaco Editor's Markers API on the frontend.
 */
router.post('/', async (req, res) => {
  const {
    sessionId,
    code = '',
    language = 'javascript',
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // Don't scan extremely short code (less than 10 chars)
  if (!code || code.trim().length < 10) {
    return res.json({ hasBugs: false, bugs: [], complexityScore: 0 });
  }

  const session = getSession(sessionId);

  try {
    const result = await checkBugs({ code, language });

    // Log bugs to session history
    if (result.hasBugs && result.bugs.length > 0) {
      logBug(sessionId, result.bugs.map(b => ({
        line: b.line,
        type: b.type,
        description: b.description,
        severity: b.severity,
      })));
    }

    // --- Code Complexity Score (pure logic, no extra API call) ---
    const lines = code.split('\n');
    const nestingDepth = Math.max(...lines.map(l => (l.match(/^\s+/)?.[0]?.length || 0) / 2));
    const functionCount = (code.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || []).length;
    const complexityScore = Math.min(100, Math.round((lines.length * 0.3) + (nestingDepth * 5) + (functionCount * 3)));

    const complexityWarning = complexityScore > 70
      ? 'This code is getting complex. Consider breaking it into smaller functions.'
      : complexityScore > 50
      ? 'Moderate complexity. Keep an eye on function size.'
      : null;

    return res.json({
      hasBugs: result.hasBugs,
      bugs: result.bugs || [],
      complexityScore,
      complexityWarning,
      sessionBugCount: session.bugHistory.length,
    });
  } catch (err) {
    console.error('Bug check error:', err.message);
    return res.status(500).json({ error: 'Bug detection failed', details: err.message });
  }
});

module.exports = router;
