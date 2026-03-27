require('dotenv').config({ override: true }); // Loaded gemini-2.5-flash config (Forces override of stale terminal vars)
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
const { getSession, processTelemetry, resetSession, updateTypingActivity } = require('./store/sessions');

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
    const { sessionId, language = 'javascript' } = data;
    if (!sessionId) return;

    const result = processTelemetry(sessionId, data);
    const session = getSession(sessionId);
    session.language = language;

    console.log(`[Telemetry] Session: ${sessionId.slice(0,8)} | Stress: ${result.stressLevel} | State: ${result.state}`);

    // Push result back to this client
    socket.emit('telemetry_result', result);
  });

  socket.on('reset', (data) => {
    const { sessionId } = data;
    if (!sessionId) return;
    console.log(`[WS] Resetting session: ${sessionId.slice(0,8)}`);
    resetSession(sessionId);
    socket.emit('telemetry_result', {
      stressLevel: 0,
      state: 'idle',
      shouldTriggerAI: false,
      shouldTriggerDeadZone: false,
      isCalibrated: true
    });
  });

  socket.on('end_session', (data) => {
    const { sessionId } = data;
    if (!sessionId) return;
    console.log(`[WS] Ending session: ${sessionId.slice(0,8)}`);
    // Final state push before disconnect
    socket.emit('telemetry_result', { state: 'idle', stressLevel: 0 });
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