import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Bug, ArrowLeft, Watch } from 'lucide-react';

export default function ReportPage() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/api/session/${sessionId || 'test'}`)
      .then(res => res.json())
      .then(data => setReport(data))
      .catch(console.error);
  }, [sessionId]);

  if (!report) return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
      <div className="animate-pulse">Loading Cognitive Report...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-10 font-sans">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-6xl font-bold mb-4 tracking-tight">Cognitive Session Report</h1>
          <p className="text-slate-400 text-lg flex items-center gap-3">
            <Watch size={20} /> Session: {report.sessionId} | Duration: {report.sessionDurationMinutes || 0} minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#232D3F]">
            <h3 className="text-base uppercase tracking-widest opacity-60 mb-6 flex items-center gap-3">
              <Activity size={20} className="text-green-400"/> Flow State
            </h3>
            <p className="text-7xl font-bold">{report.stateBreakdown?.flow || 0}%</p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#232D3F]">
            <h3 className="text-base uppercase tracking-widest opacity-60 mb-6 flex items-center gap-3">
              <Activity size={20} className="text-red-400"/> High Stress / Blocked
            </h3>
            <p className="text-7xl font-bold">{
              (report.stateBreakdown?.stressed || 0) + (report.stateBreakdown?.dead_zone || 0)
            }%</p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#232D3F]">
            <h3 className="text-base uppercase tracking-widest opacity-60 mb-6 flex items-center gap-3">
              <Bug size={20} className="text-purple-400"/> Bugs Detected
            </h3>
            <p className="text-7xl font-bold">{report.totalBugsDetected || 0}</p>
          </div>
        </div>

        {/* Developer Memory & Interventions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#232D3F]">
            <h3 className="font-bold text-lg mb-4">AI Interventions</h3>
            <div className="space-y-4">
              {report.suggestionLog && report.suggestionLog.length > 0 ? (
                report.suggestionLog.map((log, i) => (
                  <div key={i} className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <p className="text-xs opacity-50 font-mono mb-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p className="font-semibold">{log.intent}</p>
                    <p className="text-sm text-green-300 font-mono mt-2">{log.suggestion}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No AI interventions triggered. Your stress stayed low!</p>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#232D3F]">
            <h3 className="font-bold text-lg mb-4">Recurring Mistakes</h3>
            <ul className="space-y-3">
              {report.topMistakes && report.topMistakes.length > 0 ? (
                report.topMistakes.map((mistake, i) => (
                  <li key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                    <span className="font-mono text-sm">{mistake.type}</span>
                    <span className="bg-white/10 px-2 py-1 rounded text-xs">{mistake.count} times</span>
                  </li>
                ))
              ) : (
                <p className="text-slate-400 italic">No major recurring mistakes typed.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
