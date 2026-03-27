const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateObject } = require('ai');
const { z } = require('zod');

// Map the user's existing GEMINI_API_KEY strictly to the Vercel SDK provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Predict developer intent and suggest a fix when stress is high
 */
async function predictIntent({ currentCode, lastActions, topMistake, language = 'unknown' }) {
  const memoryHint = topMistake
    ? `Note: This developer has made "${topMistake.type}" errors ${topMistake.count} times this session. Factor this in.`
    : '';

  const prompt = `
You are an expert coding assistant embedded in a smart IDE. A developer is showing high stress signals.
Language: ${language}
Recent actions: ${lastActions.join(', ')}
${memoryHint}

Their current code:
\`\`\`
${currentCode || '(empty)'}
\`\`\`
`;

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      intent: z.string().describe('short description of what the developer is trying to do'),
      suggestion: z.string().describe('a clear, actionable fix or next step'),
      confidence: z.number().min(0).max(1),
      bugType: z.string().nullable().describe('category of the issue if any, e.g. Type Mismatch, Logic Error, Syntax Error, or null')
    }),
    prompt
  });

  return object;
}

/**
 * Scan code for bugs and return a list with fixes
 */
async function checkBugs({ code, language = 'javascript' }) {
  if (!code || code.trim().length < 5) {
    return { hasBugs: false, bugs: [] };
  }

  const prompt = `
You are an expert code reviewer. Analyze the following ${language} code for bugs, errors, and issues.
Look for: syntax errors, type mismatches, logic errors, null references, off-by-one errors, missing returns, etc.

Code:
\`\`\`${language}
${code}
\`\`\`
`;

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      hasBugs: z.boolean(),
      bugs: z.array(z.object({
        line: z.number(),
        type: z.string().describe('category e.g. Syntax Error, Type Mismatch, Logic Error'),
        description: z.string().describe('clear explanation of the bug'),
        fix: z.string().describe('exact fix instruction'),
        severity: z.enum(['error', 'warning', 'info']),
        confidence: z.number().min(0).max(1)
      }))
    }),
    prompt
  });

  return object;
}

/**
 * Answer a plain English question about the user's code
 */
async function askQuestion({ code, question, language = 'javascript' }) {
  const prompt = `
You are a helpful coding assistant. A developer has asked a question about their code.

Language: ${language}
Code:
\`\`\`${language}
${code || '(no code provided)'}
\`\`\`

Question: "${question}"
`;

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      answer: z.string().describe('clear, concise answer to the question'),
      codeExample: z.string().nullable().describe('optional short code snippet if relevant, or null'),
      confidence: z.number().min(0).max(1)
    }),
    prompt
  });

  return object;
}

module.exports = { predictIntent, checkBugs, askQuestion };
