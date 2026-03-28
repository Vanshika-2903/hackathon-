# Flux-State Privacy & Ethical Statement

Flux-State is built on the principle of **Zero-Knowledge Telemetry**. We believe that your biometric data is yours alone, and our AI should only serve as a supportive co-pilot, not a surveillance tool.

## 1. Zero-Video Policy
The most important technical feature of Flux-State is that **your video stream never leaves your browser**. 
- The camera feed is used exclusively for local, in-memory inference.
- Frames are processed by `face-api.js` and `MediaPipe Hands` entirely on your CPU/GPU.
- No sequence of images is ever stored, buffered, or transmitted to any server.

## 2. Metadata Anonymization
When you see a "Stress Score" or an "AI Intervention," our servers only receive numeric values:
- **What we see**: `faceStressScore: 0.85`, `handVelocity: 140`.
- **What we NEVER see**: Your face, your hands, your room, or any identifying visual data.

## 3. Local-Only Learning
Any calibration data (e.g., your "relaxed" vs. "stressed" thresholds) is stored in your browser's `localStorage`. Flux-State servers have no memory of your physical characteristics between sessions.

## 4. Optical Opt-Out ("Phantom Mode")
If you find the presence of a camera feed distracting, you can enable **Phantom Mode**. This mode kills the local video preview and replaces it with an abstract, non-human representation of your sensor data, while maintaining the same level of AI assistance.

## 5. Ethical AI Guidelines
- **Non-Coercion**: Flux-State will never share your stress data with employers or third parties.
- **Agency**: AI suggestions can always be ignored, muted, or disabled.
- **Transparency**: Every AI intervention includes a "Why?" button that explains the biometric triggers that led to the suggestion.

---
*Flux-State: Because elite coding shouldn't cost you your privacy.*
