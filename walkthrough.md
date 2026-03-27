# 🚀 Flux-State Cognitive Engine — Full Website Walkthrough

## 🗺️ Pages Overview

| # | Page | Route | Purpose |
|---|---|---|---|
| 1 | **Landing Page** | `/` | Intro, features, CTA to launch editor |
| 2 | **Editor Page** | `/editor` | The main code editor workspace |
| 3 | **Session Report Page** | `/report` | Post-session AI stress + insight summary |
| 4 | **Settings Page** | `/settings` | Webcam, theme, editor preferences |

---

## 📄 Page 1 — Landing Page (`/`)

The first thing users see. Goal: Wow them and get them into the editor fast.

### Sections:
- **Navbar** — Logo ("Flux-State"), nav links (Features, How It Works, Launch Editor), dark/light toggle
- **Hero Section**
  - Headline: *"Your Code Editor That Knows When You're Stuck"*
  - Subtext explaining the dual-signal AI stress detection
  - CTA Button → `Launch Editor`
  - Animated stress meter graphic / webcam illustration
- **How It Works** (3-step visual flow)
  1. 🖱️ You code → telemetry is tracked silently
  2. 😤 You get frustrated → face + inputs signal stress
  3. 🤖 AI activates → gives you a targeted fix suggestion
- **Features Grid** (icon cards)
  - 🧠 Gemini AI suggestions
  - 👁️ Real-time face expression analysis
  - ⌨️ Keystroke & mouse pattern tracking
  - 🔒 All face data stays in your browser (privacy)
  - ⚡ 2-second polling loop
  - 🎨 Beautiful Monaco-powered code editor
- **Footer** — Links, hackathon badge

---

## 📄 Page 2 — Editor Page (`/editor`) ⭐ MAIN PAGE

The heart of the application. Everything happens here.

### Layout:
```
┌─────────────────────────────────────────────┐
│ TOPBAR: Logo | Language Selector | Run | Settings icon │
├───────────────┬─────────────────────────────┤
│               │                             │
│  SIDEBAR      │   MONACO CODE EDITOR        │
│  (file tree / │   (main editing area)       │
│   snippets)   │                             │
│               │                             │
├───────────────┴─────────────────────────────┤
│ STATUSBAR: Stress Meter | AI Status | Webcam indicator │
└─────────────────────────────────────────────┘
```

### Components & Features:

#### 🖥️ Monaco Code Editor
- Syntax highlighting for multiple languages (JS, Python, Java, C++, etc.)
- Language selector dropdown in topbar
- Line numbers, auto-indent, bracket matching
- Dark theme (VSCode-like)

#### 📊 Stress Meter (Status Bar)
- Live animated progress bar at the bottom
- Color changes: Green → Yellow → Orange → Red as stress rises
- Shows current score (e.g., `Stress: 67/100`)
- Webcam 🟢/🔴 indicator (active / not active)

#### 🤖 AI Suggestion Overlay (Popup Card)
- Slides up from bottom-right when stress > 75 for 4+ seconds
- Shows:
  - 🔍 **Detected Intent** — what it thinks you're trying to do
  - 💡 **Suggestion** — exact fix recommendation
  - 📈 **Confidence** — e.g., 95%
- Dismiss button (X)
- Auto-dismisses after 15 seconds
- 15-second cooldown before it can trigger again

#### 📷 Hidden Webcam Feed
- `<video>` element hidden via CSS
- face-api.js loads `TinyFaceDetector` + `FaceExpressionNet` models
- Reads expressions every 2 seconds silently
- User sees "👁️ AI Active" when models are loaded

#### ⚙️ Topbar
- Language selector (dropdown)
- `▶ Run` button (simulated output panel or real execution)
- Gear icon → links to Settings page

#### 📁 Sidebar (Optional / Collapsible)
- Code snippet library
- Save current session
- Load previous snippet

---

## 📄 Page 3 — Session Report Page (`/report`)

After a coding session, users can view an AI-generated summary.

### Features:
- **Session Timeline** — graph of stress levels over time
- **Peak Stress Moments** — timestamps where AI was triggered
- **AI Interventions Log** — list of all suggestions made during the session
- **Expression Breakdown** — pie/bar chart of detected emotions (angry, sad, fearful, etc.)
- **Overall Session Health Score** — e.g., "You were in flow state 60% of the session"
- Export as PDF / Share button

---

## 📄 Page 4 — Settings Page (`/settings`)

### Sections:
| Setting | Options |
|---|---|
| **Webcam** | Enable/Disable, test webcam preview |
| **Stress Threshold** | Slider to adjust trigger level (default: 75) |
| **AI Cooldown** | Slider (default: 15s, range: 5–60s) |
| **Editor Theme** | VSCode Dark, Monokai, Dracula, Light |
| **Font Size** | Slider (12px–24px) |
| **Language Default** | JavaScript, Python, Java, C++, etc. |
| **Notifications** | Sound alert when AI triggers (on/off) |

---

## 🔄 Full User Flow

```
Landing Page
    │
    ▼ Click "Launch Editor"
Editor Page
    │
    ├── [Silent] Webcam loads → face-api models initialize
    ├── [Silent] Mouse/keyboard listeners activate
    ├── [Every 2s] Telemetry sent to backend
    │
    ├── Stress < 75 → Keep coding, stress bar updates
    │
    └── Stress > 75 for 4s →
            AI Suggestion Popup appears
            User reads fix → dismisses
            15s cooldown begins
            │
            ▼
        Session ends → View Report Page
```

---

## 🛠️ Tech Stack (for reference)

| Layer | Tech |
|---|---|
| Frontend Framework | React + Vite |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Face Detection | face-api.js (browser, no cloud) |
| Styling | CSS (custom, dark theme) |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| AI | Gemini 1.5 Flash |
| State | In-memory (Node.js Map) |

---

> [!NOTE]
> All facial data is processed 100% in the browser. Nothing is sent to any external server. Only the stress **score** (a number) is sent to the backend.

> [!TIP]
> The Monaco Editor gives this a VSCode-like feel right in the browser — users will feel at home immediately.
