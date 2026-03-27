const express = require('express');
const router = express.Router();

// ---------------------------------------------------------------------------
// Code Execution Backend — Wandbox (primary, free, no API key)
//                        + JDoodle  (optional upgrade via env vars)
//
// Wandbox: https://wandbox.org
//   - Japanese OSS competitive-programming judge; completely free, no key needed
//   - Supports: Python, C, C++, Java, Go, Rust, Ruby, JavaScript (Node), TypeScript, Bash
//
// JDoodle (optional quality-of-life upgrade):
//   - 200 free runs/day with a free account at https://www.jdoodle.com/compiler-api/
//   - Set env vars: JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET
//   - Used as primary if credentials are present; Wandbox is fallback
// ---------------------------------------------------------------------------

const WANDBOX_API  = 'https://wandbox.org/api/compile.json';
const JDOODLE_API  = 'https://api.jdoodle.com/v1/execute';

// Wandbox compiler IDs (from https://wandbox.org/api/list.json)
const WANDBOX_MAP = {
  python:     { compiler: 'cpython-head'       },
  javascript: { compiler: 'nodejs-20.17.0'     },
  typescript: { compiler: 'typescript-5.6.2'   },
  c:          { compiler: 'gcc-head-c'         },
  cpp:        { compiler: 'gcc-head'           },
  java:       { compiler: 'openjdk-jdk-22+36'  },
  go:         { compiler: 'go-1.23.2'          },
  rust:       { compiler: 'rust-1.82.0'        },
  ruby:       { compiler: 'ruby-3.4.1'         },
  bash:       { compiler: 'bash'               },
};

// JDoodle language IDs + versionIndex
const JDOODLE_MAP = {
  python:     { language: 'python3',    versionIndex: '4' },
  javascript: { language: 'nodejs',     versionIndex: '4' },
  typescript: { language: 'typescript', versionIndex: '3' },
  c:          { language: 'c',          versionIndex: '5' },
  cpp:        { language: 'cpp17',      versionIndex: '0' },
  java:       { language: 'java',       versionIndex: '4' },
  go:         { language: 'go',         versionIndex: '4' },
  rust:       { language: 'rust',       versionIndex: '4' },
  ruby:       { language: 'ruby',       versionIndex: '4' },
  bash:       { language: 'bash',       versionIndex: '4' },
};

/**
 * POST /api/run
 *
 * Body:
 *   language  — "python" | "c" | "cpp" | "java" | "javascript" | "typescript" | "go" | "rust" | "ruby" | "bash"
 *   files     — array of { name?, content } — first file is the entry point
 *   stdin     — optional stdin string
 *
 * Response:
 *   { run: { stdout, stderr, code, output }, provider, language, version }
 */
router.post('/', async (req, res) => {
  const { language, files, stdin = '' } = req.body;

  if (!language || !files || files.length === 0) {
    return res.status(400).json({ message: 'language and files[] are required.' });
  }

  const lang = language.toLowerCase();
  if (!WANDBOX_MAP[lang]) {
    return res.status(400).json({
      message: `Language "${language}" is not supported. Supported: ${Object.keys(WANDBOX_MAP).join(', ')}`,
    });
  }

  // Merge all files into a single source string for single-file executors.
  // For multi-file workspaces, Wandbox accepts an `options` + `codes` array.
  const mainCode = files[0]?.content || '';
  const extraFiles = files.slice(1).map(f => ({
    file: f.name || `file.txt`,
    code: f.content || '',
  }));

  // ─── Primary: JDoodle (if credentials present) ───────────────────────────
  const jdoodleId = process.env.JDOODLE_CLIENT_ID;
  const jdoodleSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (jdoodleId && jdoodleSecret) {
    try {
      const result = await runJDoodle(lang, mainCode, stdin, jdoodleId, jdoodleSecret);
      console.log(`[EXEC] ✓ JDoodle — ${lang}`);
      return res.json({ ...result, provider: 'jdoodle' });
    } catch (err) {
      console.warn(`[EXEC] JDoodle failed (${err.message}) — falling back to Wandbox`);
    }
  }

  // ─── Primary / Fallback: Wandbox (free, no key) ──────────────────────────
  try {
    const result = await runWandbox(lang, mainCode, extraFiles, stdin);
    console.log(`[EXEC] ✓ Wandbox — ${lang}`);
    return res.json({ ...result, provider: 'wandbox' });
  } catch (err) {
    console.error(`[EXEC] Wandbox failed: ${err.message}`);
    return res.status(502).json({
      message: `Code execution failed: ${err.message}`,
      tip: 'For more reliable execution add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET env vars (free at jdoodle.com/compiler-api).',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Wandbox runner
// ─────────────────────────────────────────────────────────────────────────────
async function runWandbox(lang, code, extraFiles, stdin) {
  const { compiler } = WANDBOX_MAP[lang];

  const payload = {
    compiler,
    code,
    stdin,
    'compiler-option-raw': '',
    'runtime-option-raw': '',
  };

  if (extraFiles.length > 0) {
    payload.codes = extraFiles; // { file, code }[]
  }

  const response = await fetch(WANDBOX_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wandbox HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  // Wandbox response shape:
  //   { status, signal, compiler_output, compiler_error, program_output, program_error, permlink, url }
  // status "0" = success

  const stdout         = data.program_output  || '';
  const runtimeErr     = data.program_error   || '';
  const compileOut     = data.compiler_output || '';
  const compileErr     = data.compiler_error  || '';
  const exitCode       = parseInt(data.status ?? '0', 10);
  const hasCompileErr  = !!compileErr;
  const hasRuntimeErr  = exitCode !== 0 && !hasCompileErr;

  return {
    language: lang,
    version: WANDBOX_MAP[lang].compiler,
    run: {
      stdout,
      stderr: runtimeErr,
      code: exitCode,
      output: stdout || runtimeErr,
    },
    ...(hasCompileErr && {
      compile: {
        stdout: compileOut,
        stderr: compileErr,
        code: 1,
      },
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// JDoodle runner
// ─────────────────────────────────────────────────────────────────────────────
async function runJDoodle(lang, script, stdin, clientId, clientSecret) {
  const runtime = JDOODLE_MAP[lang];

  const response = await fetch(JDOODLE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, stdin, language: runtime.language, versionIndex: runtime.versionIndex, clientId, clientSecret }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`JDoodle HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  // JDoodle response: { output, statusCode, memory, cpuTime, isError }
  const isError = data.isError || data.statusCode !== 200;
  const output  = data.output || '';

  return {
    language: lang,
    version: runtime.versionIndex,
    run: {
      stdout: isError ? '' : output,
      stderr: isError ? output : '',
      code:   isError ? 1 : 0,
      output,
    },
    info: data.cpuTime ? `${data.cpuTime}s | ${data.memory}KB` : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/run/runtimes — UI language list
// ─────────────────────────────────────────────────────────────────────────────
router.get('/runtimes', (req, res) => {
  const hasJDoodle = !!(process.env.JDOODLE_CLIENT_ID);
  return res.json({
    provider: hasJDoodle ? 'jdoodle (primary) + wandbox (fallback)' : 'wandbox (free, no key)',
    languages: Object.keys(WANDBOX_MAP).map(key => ({
      language: key,
      compiler: WANDBOX_MAP[key].compiler,
      display:  DISPLAY_NAMES[key] || key,
    })),
  });
});

const DISPLAY_NAMES = {
  python: 'Python 3', javascript: 'JavaScript (Node.js)',
  typescript: 'TypeScript', c: 'C (GCC)', cpp: 'C++ (GCC)',
  java: 'Java (OpenJDK)', go: 'Go', rust: 'Rust', ruby: 'Ruby', bash: 'Bash',
};

module.exports = router;
