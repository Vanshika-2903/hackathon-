# Frontend Product Requirements Document (PRD)
**Project**: Flux-State Cognitive Engine

## 1. Overview & Core Concept
**Goal**: Build a real-time, AI-driven coding assistant interface that monitors developer stress through physical telemetry (keystrokes, mouse movement) and facial expression analysis, natively intervening when frustration is detected.

**Vision — "Reactive Simplicity" & The "Calm Canvas"**:
The UI should feel like a calm, living organism. It is a single-page application (SPA) where every element is aware of the user's "Stress Score." The frontend acts as the *Senses* (collecting data) and the *Face* (showing the reaction). It needs to handle high-frequency mouse movements without lagging and animate UI changes smoothly to avoid startling the user.

---

## 2. Recommended Tech Stack
- **Framework**: Vite + React (or Next.js for fastest routing)
- **Styling**: Tailwind CSS (crucial for rapid UI changes)
- **Animation**: Framer Motion (best-in-class for layout transitions)
- **Icons**: Lucide-React (clean, consistent icons)
- **Code Editor**: `@monaco-editor/react` (or `react-codemirror`)
- **Face Tracking**: `face-api.js` (Runs completely locally in the browser; no video data is sent to the backend)
- **Network**: `socket.io-client` (for real-time server pushing) and `axios` / `fetch` (for REST)

---

## 3. The Component Architecture (Bento Box Layout)
Your React structure should utilize a sleek **Bento Grid** layout, looking something like this:

- **`App.js`**: Holds the global `stressLevel` state.
- **`TelemetryOverlay.js`**: An invisible layer that captures mouse/keyboard events.
- **`BentoGrid.js`**: The container that manages the 4 main widgets using CSS Grid.
- **`EditorWidget.js`**: The main code/text input area.
- **`SidebarWidget.js`**: The "distraction" (To-Do list/Files) that hides during stress.
- **`StatusWidget.js`**: The top bar with the Stress Meter and Clock.
- **`MagicFixModal.js`**: The AI-powered popup that appears when `stressLevel > 80`.

---

## 4. Core Frontend Features

### A. The Telemetry Hook (The Sensor)
A custom hook that tracks continuous telemetry every 2 seconds:
- **Velocity**: The distance the mouse moves between two points in time.
- **Click Density**: Number of clicks in a rolling 2-second window.
- **Error Patterns**: Watching for "Rage Backspacing" (deleting large chunks of text quickly).

### B. The Mutation Engine (The Reaction)
Using Tailwind CSS and Framer Motion, the UI reacts instantly to the `stressLevel` variable:
- **Visual Filter**: If Stress > 50, apply grayscale or sepia filters to the background to soften the "vibe."
- **Focus Zoom**: If Stress > 70, the sidebars move to `translateX(-100%)` and the Editor expands to `width: 100%`.
- **Breathing Animation**: The background color pulses slowly (like a heartbeat) to encourage the user to slow down.

---

## 5. The "Two-Mode" Design Strategy

| Feature | Flow State (Low Stress) | Crisis Mode (High Stress) |
|---|---|---|
| **Layout** | Multi-column, data-rich. | Single-column, minimalist. |
| **Typography** | Standard UI fonts. | Increased line-height and font-size. |
| **Navigation** | All menus visible. | Menus hidden; "Magic Fix" button visible. |
| **Sound (Optional)** | Silence or "Low-fi" beats. | Soft "Ocean Waves" or "Rain" white noise. |

---

## 6. Implementation Steps (Frontend Team)

- **Hour 0-4**: Set up the Bento Grid using CSS Grid. Make it look pretty with rounded corners and soft shadows.
- **Hour 4-8**: Drop in the editor setup (`react-codemirror` or Monaco). Build the Telemetry Hook to `console.log` "Stress detected!" when the mouse shakes.
- **Hour 8-12**: Integrate Framer Motion. Use the `<AnimatePresence>` component so sidebars slide in and out smoothly.
- **Hour 12-18**: Connect to the Backend HTTP/WebSocket endpoints (see Integration Contract below). Update the "Stress Meter" in real-time based on the API response.
- **Hour 18-24**: Final Polish. Add a "Reality-Sync" feature where the UI turns dark/warm if the user's local time is past 8 PM.

---

## 7. API & Integration Contract

The backend is completely ready and running locally at **`http://localhost:3000`**.

### A. Real-Time Telemetry (Call every 2s)
**Endpoint:** `POST /api/telemetry`
**Payload from Frontend:**
```json
{
  "sessionId": "unique-uuid-for-this-session",
  "mouseVelocity": 450,
  "clickRate": 2,
  "backspaceCount": 4,
  "faceStressScore": 65,  // Map from face-api.js expressions
  "hasTyped": true,
  "language": "javascript"
}
```
**Response from Backend:**
```json
{
  "stressLevel": 72,
  "state": "stressed",                 // "idle" | "flow" | "stressed" | "dead_zone"
  "shouldTriggerAI": true,           // If TRUE, call /api/predict-intent!
  "shouldTriggerDeadZone": false,    
  "adaptiveThreshold": 75,
  "isCalibrated": true,
  "message": "Stress threshold met. Monitoring..."
}
```
> *Hook integration: Take `stressLevel` and distribute it to Framer Motion to drive UI changes.*

### B. AI Predictions & Fixes (The Magic Fix)
Call this ONLY when `/api/telemetry` returns `shouldTriggerAI: true`.

**Endpoint:** `POST /api/predict-intent`
**Payload from Frontend:**
```json
{
  "sessionId": "unique-uuid-for-this-session",
  "currentCode": "function add(a, b) { retur a+b; }",
  "triggerReason": "stress", 
  "lastActions": ["typed quickly", "backspaced 5 times"]
}
```
**Response from Backend:**
```json
{
  "intent": "Trying to create an addition function",
  "suggestion": "Fix typo: 'retur' should be 'return'",
  "confidence": 0.98,
  "bugType": "Syntax Error",
  "contextMessage": "High stress detected. Here's what might be wrong:",
  "developerMemory": "You've hit 'Syntax Error' 3 times this session."
}
```
> *Action: Display the `suggestion` and `intent` in the `MagicFixModal`.*

### C. Final Session Report
Call this when the user leaves the editor or ends the session.

**Endpoint:** `GET /api/session/:sessionId`
**Response:** Returns a massive JSON object with `stressTimeline`, `averageStress`, `stateBreakdown`, `bugHistory`, and `suggestionLog`. Use this to plot graphs on the final dashboard.
