/**
 * mockAI.js - Simulation Mode Data
 * Provides realistic AI responses for Flux-State hackathon demos 
 * when the Gemini API is unavailable.
 */

const SCENARIOS = [
  {
    trigger: "useEffect",
    id: "react_infinity",
    intent: "Fixing Infinite Re-render Loop",
    inlineHint: "Add 'telemetry' to your dependency array to stop the loop.",
    suggestion: "Your useEffect triggers a state update that in turn re-triggers the effect. Adding the proper dependency or using a ref for transient data will break the cycle.",
    suggestedCode: "useEffect(() => {\n  const result = process(data);\n  setResult(result);\n}, [data]); // Added missing dependency",
    bugType: "Logic Error (Infinite Loop)"
  },
  {
    trigger: "flex",
    id: "centering_struggle",
    intent: "Centering UI Elements with Flexbox",
    inlineHint: "Use 'display: flex' and 'place-items: center' for a perfect center.",
    suggestion: "Centering in CSS is famously frustrating. Using Flexbox with 'justify-content' and 'align-items' is the robust modern standard.",
    suggestedCode: ".container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}",
    bugType: "CSS / Layout"
  },
  {
    trigger: "fetch",
    id: "async_nightmare",
    intent: "Implementing Robust Error Handling for API Calls",
    inlineHint: "Wrap your fetch in a try/catch block to prevent UI crashes.",
    suggestion: "Network requests fail silently or crash the component if unhandled. Always use a try/catch and update a 'loading' or 'error' state.",
    suggestedCode: "const fetchData = async () => {\n  try {\n    const res = await fetch('/api/data');\n    const data = await res.json();\n    setData(data);\n  } catch (err) {\n    console.error('Fetch failed:', err);\n    setError(true);\n  }\n};",
    bugType: "Async Logic"
  },
  {
    trigger: "Scene",
    id: "threejs_setup",
    intent: "Boilerplate for Three.js 3D Scene",
    inlineHint: "Initialize your Scene, Camera, and WebGLRenderer to start rendering.",
    suggestion: "Setting up a 3D environment requires several boilerplate objects. Here is the standard initialization for a responsive canvas.",
    suggestedCode: "const scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);\nconst renderer = new THREE.WebGLRenderer({ antialias: true });\nrenderer.setSize(window.innerWidth, window.innerHeight);\ndocument.body.appendChild(renderer.domElement);",
    bugType: "Predicted Pattern"
  },
  {
    trigger: "user",
    id: "auth_maze",
    intent: "Safe Null-Checking for Auth Context",
    inlineHint: "Use optional chaining (user?.id) to avoid 'Cannot read property of null' errors.",
    suggestion: "Auth states are often null on initial load. Optional chaining or early returns are essential to prevent the app from crashing during the transition.",
    suggestedCode: "const UserName = ({ user }) => {\n  if (!user) return <span>Loading...</span>;\n  return <h1>Welcome, {user.name}</h1>;\n};",
    bugType: "Safety / Null Check"
  }
];

function getMockResponse(context) {
  const { currentCode = "", language = "javascript", lastActions = [] } = context;
  
  // Try to find a scenario that matches the code or triggered state
  let match = SCENARIOS.find(s => {
    const regex = new RegExp(`\\b${s.trigger}\\b`, 'i');
    return regex.test(currentCode) || (lastActions || []).some(a => regex.test(a));
  });

  // Fallback to random if no match found
  if (!match) {
    match = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  }

  return {
    ...match,
    confidence: 0.98,
    isMock: true
  };
}

module.exports = { getMockResponse };
