# Flux-State: The World's First Cognitive IDE 🧠💻

**Code at the speed of thought. Flux-State is an AI-driven development environment that monitors your cognitive load and intervenes before you burn out.**

![Flux-State Hero](https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2070)

## 🚀 The Vision
Development friction is invisible. We write code with 10% of our brain while battling 90% of the distractions. Flux-State uses real-time biometric telemetry—hand motion analysis, facial expression tracking, and mouse velocity—to detect when a developer is in a **Flow State**, **Stressed**, or experiencing a **Mental Block**.

### Core Features:
*   **Cognitive Telemetry Engine**: Tracks hand speed, pose, and facial expressions via webcam to calculate a real-time stress score.
*   **Predictive AI Interventions**: When stress peaks or a long pause is detected, Flux-State's Gemini-powered brain predicts your intent and surfaces solutions *before* you search for them.
*   **Dynamic Theme Shifting**: The UI physically reacts to your state. It dims distractions in Flow State and alerts you with "Cognitive Pulses" during mental blocks.
*   **Executive Dashboard**: A "Bento Box" UI that consolidates telemetry, terminal logs, and system status into a single, high-fidelity HUD.

## 🛠️ Technology Stack
### Frontend:
*   **React 19 / Vite**: For modern, lightning-fast rendering.
*   **Tailwind CSS 4**: For the "Glassmorphism" high-tech aesthetic.
*   **Framer Motion**: For fluid, state-driven UI transitions.
*   **Lucide React**: For sleek, high-visibility iconography.
*   **Monaco Editor**: The powerful engine behind VS Code, integrated for a professional coding feel.
*   **face-api.js**: For localized facial expression analysis.
*   **MediaPipe Hands**: For high-precision hand tracking and gesture analysis.

### Backend:
*   **Node.js / Express**: Handling the high-performance telemetry pipeline.
*   **Socket.IO**: For real-time, low-latency data sync between the browser and sensors.
*   **Google Gemini AI**: Powering the intent prediction and cognitive intervention logic.

## 📦 Getting Started

### Prerequisites:
*   Node.js (v18 or higher)
*   NPM or Yarn
*   A webcam (required for biometric tracking)

### Installation:
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Vanshika-2903/hackathon-.git
    cd hackathon-
    ```
2.  **Install Dependencies**:
    *   **Root**: `npm install`
    *   **Frontend**: `cd frontend && npm install`
    *   **Backend**: `cd backend && npm install`
3.  **Environment Setup**:
    *   Create a `.env` in the `backend/` folder and add your `GEMINI_API_KEY`.
4.  **Run Development Environment**:
    ```bash
    # From the root directory
    npm run dev
    ```

## 🧠 Behind the Scenes: The State Engine
Flux-State interprets your physical actions into cognitive states:
*   **Idle**: No activity for >10 seconds.
*   **Flow State**: Consistent mouse velocity, low backspace frequency, and calm facial markers.
*   **Stressed**: High hand velocity, rapid clicking, and detected frustration markers.
*   **Dead Zone**: Long pauses accompanied by "hand-to-head" poses or high-jitter movements.

---
*Built for the 24-hour hackathon by developers, for developers.*