require('dotenv').config({ override: true });
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('\n[WARN] GEMINI_API_KEY is missing from environment variables.');
  console.warn('AI features will be disabled. Set it in backend/.env to enable.\n');
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
}) : null;

// Helper: parse JSON from the model's response safely
function parseJSON(text) {
  try {
    // Strip ```json fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON response: ${e.message} | Raw: ${text.substring(0, 200)}`);
  }
}

/**
 * Predict developer intent and suggest a fix when stress is high
 */
/**
 * Build a smart, token-efficient context window from a large file.
 *
 * Strategy (3 layers):
 *   1. FILE OVERVIEW  — first ~30 lines (imports, class defs, top-level functions)
 *   2. LOCAL BLOCK    — ~80 lines around the cursor (the function/scope being edited)
 *   3. CURSOR WINDOW  — the precise cursorPrefix/cursorSuffix already extracted by Monaco
 *
 * Total sent to Gemini: ~110 lines of code + metadata, regardless of file size.
 * This keeps the AI focused on what matters and avoids wasting tokens on unrelated code.
 */
function buildSmartContext({ currentCode, cursorOffset, cursorPrefix, cursorSuffix, language }) {
  if (!currentCode || currentCode.length === 0) {
    return { contextCode: '(empty)', strategy: 'empty', totalLines: 0 };
  }

  const lines = currentCode.split('\n');
  const totalLines = lines.length;
  const totalChars = currentCode.length;

  // For small files (≤150 lines) — just send everything, no windowing needed
  if (totalLines <= 150) {
    return { contextCode: currentCode, strategy: 'full_file', totalLines };
  }

  // Find which line the cursor is on
  const charsBeforeCursor = currentCode.slice(0, cursorOffset || currentCode.length);
  const cursorLine = charsBeforeCursor.split('\n').length - 1; // 0-indexed

  // Layer 1: File overview — first 25 lines (imports, declarations)
  const overviewLines = lines.slice(0, Math.min(25, totalLines));

  // Layer 2: Local window — 60 lines centred on cursor line  
  const windowStart = Math.max(26, cursorLine - 30);
  const windowEnd   = Math.min(totalLines - 1, cursorLine + 30);
  const localLines  = lines.slice(windowStart, windowEnd + 1);

  // Build annotated context
  const overviewBlock = overviewLines.join('\n');
  const localBlock    = localLines.join('\n');

  // Stats for the prompt
  const strategy = `windowed (cursor @ line ${cursorLine + 1}/${totalLines}, showing lines 1-${overviewLines.length} + ${windowStart + 1}-${windowEnd + 1})`;

  const contextCode = [
    `// === FILE OVERVIEW (lines 1-${overviewLines.length} of ${totalLines}) ===`,
    overviewBlock,
    ``,
    `// === ACTIVE REGION (lines ${windowStart + 1}-${windowEnd + 1}, cursor @ line ${cursorLine + 1}) ===`,
    localBlock,
  ].join('\n');

  return { contextCode, strategy, totalLines, cursorLine };
}
async function predictIntent({
  currentCode,
  lastActions,
  topMistake,
  language = 'unknown',
  activeFile = null,
  cursorOffset = null,
  cursorPrefix = '',
  cursorSuffix = '',
}) {
  if (!model) {
    return {
      intent: "Gemini AI is not configured",
      inlineHint: "Set GEMINI_API_KEY to enable AI coaching.",
      suggestion: "Create a .env file in the backend folder.",
      suggestedCode: "",
      confidence: 0,
      bugType: ""
    };
  }

  const memoryHint = topMistake
    ? `Note: This developer has made "${topMistake.type}" errors ${topMistake.count} times this session. Factor this in.`
    : '';
  const hasCursorContext = Number.isInteger(cursorOffset);

  // Build smart context — never blindly dump the whole file
  const { contextCode, strategy, totalLines } = buildSmartContext({
    currentCode,
    cursorOffset,
    cursorPrefix,
    cursorSuffix,
    language,
  });

  // Cursor window is already extracted by Monaco (400 chars before, 240 after)
  // Use this as the highest-precision signal for inline code suggestions
  const cursorWindowSection = hasCursorContext ? `
## Precise cursor window (highest priority — this is WHERE the developer is right now)
Text immediately before cursor:
\`\`\`${language}
${cursorPrefix || '(start of file)'}
\`\`\`
Text immediately after cursor:
\`\`\`${language}
${cursorSuffix || '(end of file)'}
\`\`\`
Cursor character offset: ${cursorOffset} (line ~${Math.round((cursorOffset / (currentCode?.length || 1)) * totalLines) + 1} of ${totalLines})` : '';

  const prompt = `You are an expert coding assistant embedded in a smart IDE called Flux-State. 
A developer is showing HIGH STRESS signals while coding — they need focused, actionable help RIGHT NOW.

## Session context
- Language: ${language}
- Active file: ${activeFile || 'unknown'} (${totalLines} lines total)
- Recent signals: ${(lastActions || []).join(', ')}
- Context strategy: ${strategy}
${memoryHint ? `- Developer pattern: ${memoryHint}` : ''}

## Code context (smart-windowed, not the full file)
\`\`\`${language}
${contextCode}
\`\`\`
${cursorWindowSection}

## Your task
Based on the code context and cursor position above:
1. PROPHETICALLY predict exactly what the developer is struggling to implement.
2. Provide a PRECISE, HIGH-FIDELITY code block that implements the functionality or fixes the likely logic error.
3. Be their "Flow Partner" — don't just give a hint, provide the SOLUTION that keeps their momentum alive.
4. Ensure the suggestedCode is substantive. If it's a new function, provide the logic. If it's a loop, provide the body. Avoid low-value comments.

IMPORTANT: The suggestedCode must be valid ${language} that can be inserted at the cursor position. 
If the developer is in the middle of a line, only provide the CONTINUATION.
If the developer is at a new line, provide the full NEXT BLOCK.
Do NOT repeat code that already exists before the cursor.

Respond ONLY with a valid JSON object (no markdown fences):
{
  "intent": "What they are trying to achieve (concise)",
  "inlineHint": "Crucial coaching tip/warning about the code (max 1 sentence)",
  "suggestion": "Clear explanation of how your code solves the frustration",
  "suggestedCode": "The completion/fix code (HIGH PRIORITY — MUST BE ACTIONABLE)",
  "confidence": 0.95,
  "bugType": "Logic Error | Performance | Predicted Pattern"
}
`;

  console.log(`[Gemini] predictIntent: file=${totalLines} lines, strategy=${strategy}, prompt_size=~${Math.round(prompt.length/4)} tokens`);

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

/**
 * Scan code for bugs and return a list with fixes
 */
async function checkBugs({ code, language = 'javascript' }) {
  if (!code || code.trim().length < 5) {
    return { hasBugs: false, bugs: [] };
  }

  const prompt = `You are an expert code reviewer. Analyze the following ${language} code for bugs, errors, and issues.
Look for: syntax errors, type mismatches, logic errors, null references, off-by-one errors, missing returns, etc.

Code:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with a valid JSON object (no markdown fences):
{
  "hasBugs": true,
  "bugs": [
    {
      "line": 5,
      "type": "Syntax Error",
      "description": "clear explanation",
      "fix": "exact fix instruction",
      "severity": "error",
      "confidence": 0.95
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

/**
 * Answer a plain English question about the user's code
 */
async function askQuestion({ code, question, language = 'javascript' }) {
  const prompt = `You are a helpful coding assistant. A developer has a question about their code.

Language: ${language}
Code:
\`\`\`${language}
${code || '(no code provided)'}
\`\`\`

Question: "${question}"

Respond ONLY with a valid JSON object (no markdown fences):
{
  "answer": "clear, concise answer",
  "codeExample": "optional short code snippet or empty string",
  "confidence": 0.9
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJSON(text);
}

module.exports = { predictIntent, checkBugs, askQuestion };
