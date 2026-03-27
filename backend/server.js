require('dotenv').config(); // Loaded gemini-2.5-flash config
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Routes
const telemetryRouter = require('./routes/telemetry');
const predictRouter = require('./routes/predict');
const bugsRouter = require('./routes/bugs');
const askRouter = require('./routes/ask');
const sessionRouter = require('./routes/session');
const runRouter = require('./routes/run');

// Store
const { getSession, updateSessionStress, updateTypingActivity } = require('./store/sessions');

const app = express();
const httpServer = http.createServer(app);

// --- Socket.io (Real-time WebSocket) ---
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Flux-State Cognitive Engine is running',
    timestamp: new Date().toISOString(),
  });
});

// --- REST API Routes ---
app.use('/api/telemetry', telemetryRouter);
app.use('/api/predict-intent', predictRouter);
app.use('/api/check-bugs', bugsRouter);
app.use('/api/ask', askRouter);
app.use('/api/session', sessionRouter);
app.use('/api/run', runRouter);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ============================================================
// WebSocket — Real-time telemetry (alternative to REST polling)
// ============================================================
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('telemetry', (data) => {
    const {
      sessionId,
      mouseVelocity = 0,
      clickRate = 0,
      backspaceCount = 0,
      faceStressScore = 0,
      hasTyped = false,
      language = 'javascript',
      // Hand signals from MediaPipe
      handVelocity = 0,
      fingerRatio = 1,    // 1 = open hand (calm), 0 = closed fist (tense)
      handJitter = 0,
      isHandNearHead = false,
    } = data;

    if (!sessionId) return;

    const session = getSession(sessionId);

    // Dead zone tracking
    if (hasTyped) updateTypingActivity(sessionId);
    const idleMs = Date.now() - session.lastTypingTimestamp;
    const isDeadZone = idleMs > 60000 && faceStressScore > 40;

    // Calibration phase
    if (!session.isCalibrated) {
      session.calibrationSamples.push(faceStressScore);
      if (session.calibrationSamples.length >= 15) {
        const avg = session.calibrationSamples.reduce((a, b) => a + b, 0) / session.calibrationSamples.length;
        session.adaptiveThreshold = Math.min(85, Math.max(65, avg + 30));
        session.isCalibrated = true;
      }
    }

    // Stress formula — extreme sensitivity for Hackathon demo
    const normalizedVelocity   = Math.min(mouseVelocity, 1000) / 1000 * 100; // Cap at 1000px/s
    const normalizedClicks     = Math.min(clickRate, 5) / 5 * 100;           // Clicks are VERY impactful now
    const normalizedBackspaces = Math.min(backspaceCount, 10) / 10 * 100;
    const normalizedFace       = Math.min(faceStressScore, 100);

    // Hand signals: fast hands + clenched fist + jitter all increase stress
    const normalizedHandVel    = Math.min(handVelocity, 400) / 400 * 100;
    const fistTension          = (1 - Math.max(0, Math.min(1, fingerRatio))) * 100; 
    const normalizedJitter     = Math.min(handJitter, 60) / 60 * 100;

    // Weighting: Mouse (30%), Clicks (15%), Backspaces (15%), Hands (20%), Face (20%)
    const physical = (normalizedVelocity * 0.30) + (normalizedClicks * 0.15) +
                     (normalizedBackspaces * 0.15) + (normalizedHandVel * 0.1) +
                     (fistTension * 0.05) + (normalizedJitter * 0.05);

    let stressScore = Math.round(Math.min(100, (physical * 100 / 80 * 0.80) + (normalizedFace * 0.20)));

    // Apply specific boost for "Hand on Head" pose
    if (isHandNearHead) {
      stressScore = Math.min(100, stressScore + 40);
    }

    // --- STICKINESS LOGIC ---
    const lastEntry = session.stressHistory[session.stressHistory.length - 1];
    const prevScore = lastEntry ? lastEntry.score : 0;
    const prevState = session.currentState || 'idle';

    // Slow decay: Don't let stress drop more than 10 points per tick (2s)
    if (stressScore < prevScore) {
      stressScore = Math.max(stressScore, prevScore - 10);
    }

    // State determination with Hysteresis
    const threshold = session.adaptiveThreshold;
    let state = prevState;

    if (isDeadZone) {
      state = 'dead_zone';
    } else if (stressScore > threshold) {
      state = 'stressed';
    } else if (prevState === 'stressed' || prevState === 'dead_zone') {
      // Hysteresis: Must drop 15 points below threshold to exit "Stressed"
      if (stressScore < (threshold - 15)) {
        state = (stressScore < 30) ? 'flow' : 'idle';
      }
    } else if (stressScore < 30 && hasTyped && backspaceCount < 3) {
      state = 'flow';
    } else if (stressScore < 45) {
      state = 'idle';
    }

    // Track consecutive cycles for AI triggering
    if (state === 'stressed') {
      session.consecutiveHighStress += 1;
    } else {
      session.consecutiveHighStress = 0;
    }

    const shouldTriggerAI = state === 'stressed' && session.consecutiveHighStress >= 2;
    const shouldTriggerDeadZone = state === 'dead_zone' && !session.deadZoneTriggered;
    if (shouldTriggerDeadZone) session.deadZoneTriggered = true;
    if (shouldTriggerAI) session.consecutiveHighStress = 0;

    session.language = language;
    updateSessionStress(sessionId, { stressScore, state });

    console.log(`[Telemetry] Session: ${sessionId.slice(0,8)} | Stress: ${stressScore} | State: ${state} ${isHandNearHead ? '(POSE)' : ''}`);

    // Push result back to this client
    socket.emit('telemetry_result', {
      stressLevel: stressScore,
      state,
      shouldTriggerAI,
      shouldTriggerDeadZone,
      adaptiveThreshold: session.adaptiveThreshold,
      isCalibrated: session.isCalibrated,
    });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log('\n Flux-State Cognitive Engine');
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket ready at ws://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log('  POST  /api/telemetry');
  console.log('  POST  /api/predict-intent');
  console.log('  POST  /api/check-bugs');
  console.log('  POST  /api/ask');
  console.log('  POST  /api/run');
  console.log('  GET   /api/session/:id');
  console.log('  GET   /health\n');
});

module.exports = { app, io };