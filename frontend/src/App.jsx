import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import EditorPage from './pages/EditorPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NavBar from './components/NavBar.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ERROR BOUNDARY CAUGHT:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#3A0519', color: 'white', padding: '50px', fontSize: '18px', fontFamily: 'monospace', minHeight: '100vh', overflow: 'auto' }}>
          <h1 style={{color: '#EF88AD'}}>SYSTEM CRASH: Component Render Failure</h1>
          <p style={{background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px'}}>{this.state.error?.toString()}</p>
          <pre style={{fontSize: '12px', opacity: 0.7, whiteSpace: 'pre-wrap'}}>{this.state.error?.stack}</pre>
          <button 
            onClick={() => window.location.href = '/'}
            style={{marginTop: '20px', padding: '10px 20px', background: '#EF88AD', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer'}}
          >
            Reboot to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const showNavBar = location.pathname !== '/editor' && location.pathname !== '/';

  return (
    <div className={`min-h-screen ${showNavBar ? 'pt-20' : ''}`}>
      {showNavBar && <NavBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/report/:sessionId" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}