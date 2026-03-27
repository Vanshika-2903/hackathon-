import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = function(message, source, lineno, colno, error) {
  console.error("GLOBAL ERROR:", message, "at", source, ":", lineno, ":", colno, error);
};

window.onunhandledrejection = function(event) {
  console.error("UNHANDLED REJECTION:", event.reason);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  createRoot(rootElement).render(
    <App />,
  )
}
