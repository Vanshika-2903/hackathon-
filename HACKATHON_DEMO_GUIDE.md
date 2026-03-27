# 🚀 Flux-State Cognitive Engine - Hackathon Pitch Guide

**Flux-State** is a real-time, AI-driven IDE extension (demonstrated as a standalone web app) that monitors developer stress through physical telemetry and facial expressions to provide proactive, context-aware coding assistance precisely when the developer is stuck.

---

## 🏗️ The Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 8 | Performance-first, modern UI architecture |
| **Logic** | JavaScript (ESM) | Core application logic |
| **Styling** | Tailwind CSS 4 + Lucide Icons | Premium, responsive, and consistent design |
| **Animations** | Framer Motion | Smooth transitions and interactive micro-animations |
| **Editor Core** | Monaco Editor | VS Code-grade code editing experience |
| **Computer Vision** | `face-api.js` + `MediaPipe` | Local, real-time facial expression & hand tracking |
| **Real-time Sync** | Socket.IO | Ultra-low latency telemetry data flow |
| **Backend** | Node.js + Express | Telemetry aggregation & AI orchestration |
| **AI Brain** | **Google Gemini 2.0 Flash** | Intent prediction & cognitive load analysis |

---

## 📱 Pages & User Flow

### 1. **The Launchpad (Landing Page)**
- **Objective**: Immediate "Wow" factor and clear value proposition.
- **Features**: Animated hero section, feature cards with glassmorphism, and a high-conversion "Launch Editor" CTA.

### 2. **The Nerve Center (Editor Workspace)**
- **Objective**: A professional-grade coding environment with hidden "superpowers."
- **Features**: 
    - **Monaco Editor**: Full syntax highlighting and multi-language support.
    - **Live Stress Meter**: Real-time visual feedback on developer's cognitive state.
    - **Dynamic Suggestion Overlay**: AI "nudges" that provide code fixes only when stress exceeds a defined threshold (e.g., >85%).
    - **Webcam Integration**: Silently monitors "frustration" cues without recording or storing video.

### 3. **The Mirror (Session Report)**
- **Objective**: Retrospective analytics to improve developer productivity.
- **Features**: Stress-over-time graphs, "Peak Frustration" timestamps, and an AI-generated session health score.

---

## 🔥 Key Innovation Features

### 🧠 **Proactive Cognitive Assistance**
Unlike standard AI copilots that wait for a command, Flux-State **detects** when you need help. It measures "Stuckness" by merging:
- **Biometric Signals**: Facial expressions (angry, sad, fearful).
- **Behavioral Signals**: Idle time vs. type speed, delete-key frequency, and mouse jitter.

### 🔒 **Privacy-by-Design**
- **No Cloud Face Data**: All AI models for face/hand detection run locally in the browser. 
- **Ephemeral Telemetry**: Only numeric scores are sent to the backend; zero personal identifiers are stored.

### 🎨 **Flux-State Design System**
- **Bento Box Layout**: Organized, modular UI that feels modern and premium.
- **Adaptive Themes**: UI colors shift subtlely as stress levels change (Green = Flow, Red = Deep Stress).

---

## 🛠️ Tools & Models Used

- **Gemini 2.0 Flash**: Chosen for its incredible speed (near-instant responses) and high reasoning capabilities for code repair.
- **face-api.js**: Utilizes a pre-trained `TinyFaceDetector` and `FaceExpressionNet` for high-accuracy emotion detection in the browser.
- **MediaPipe Hands**: Used for non-touch interaction controls.
- **Concurrent.js**: Manages the dual-process (Frontend/Backend) architecture for a seamless dev experience.

---

> [!TIP]
> **Pitch Tip for Mentors:** Emphasize that "Developer Burnout is an $8.5 Trillion problem." Flux-State isn't just an editor; it's a **wellness and productivity companion** that keeps you in the 'Flow State' longer.
