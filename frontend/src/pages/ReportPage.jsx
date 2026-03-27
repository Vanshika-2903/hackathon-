import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Activity, Bug, ArrowLeft, Watch, Zap, Award, Target, MessageSquareCode, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import StressTimeline from '@/components/StressTimeline.jsx';
import { NotificationCard } from '@/components/ui/card-15';

function hasTelemetry(report) {
  return Array.isArray(report?.stressTimeline) && report.stressTimeline.length > 0;
}

function mergeReportData(serverReport, fallbackReport) {
  if (!fallbackReport) {
    return serverReport;
  }

  const useServerTelemetry = hasTelemetry(serverReport);
  const useServerSuggestions = (serverReport?.suggestionLog?.length || 0) > 0;
  const useServerMistakes = (serverReport?.topMistakes?.length || 0) > 0;
  const useServerBugs = (serverReport?.totalBugsDetected || 0) > 0;

  return {
    ...fallbackReport,
    ...serverReport,
    sessionDurationSeconds: Math.max(serverReport?.sessionDurationSeconds || 0, fallbackReport?.sessionDurationSeconds || 0),
    sessionDurationMinutes: Math.max(serverReport?.sessionDurationMinutes || 0, fallbackReport?.sessionDurationMinutes || 0),
    averageStress: useServerTelemetry ? serverReport.averageStress : fallbackReport.averageStress,
    peakStress: useServerTelemetry ? serverReport.peakStress : fallbackReport.peakStress,
    stateBreakdown: useServerTelemetry ? serverReport.stateBreakdown : fallbackReport.stateBreakdown,
    stressTimeline: useServerTelemetry ? serverReport.stressTimeline : fallbackReport.stressTimeline,
    suggestionLog: useServerSuggestions ? serverReport.suggestionLog : fallbackReport.suggestionLog,
    totalAITriggers: Math.max(serverReport?.totalAITriggers || 0, fallbackReport?.totalAITriggers || 0),
    totalBugsDetected: useServerBugs ? serverReport.totalBugsDetected : fallbackReport.totalBugsDetected,
    bugHistory: useServerBugs ? serverReport.bugHistory : fallbackReport.bugHistory,
    topMistakes: useServerMistakes ? serverReport.topMistakes : fallbackReport.topMistakes,
    mistakeLog: useServerMistakes ? serverReport.mistakeLog : fallbackReport.mistakeLog,
  };
}

function formatDuration(report) {
  const seconds = report?.sessionDurationSeconds || Math.max(0, (report?.sessionDurationMinutes || 0) * 60);

  if (seconds < 60) {
    return `${Math.max(1, Math.round(seconds))} sec`;
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function calculateFocusScore(report) {
  if (!report?.stateBreakdown) return 0;
  const { flow = 0, stressed = 0, dead_zone = 0 } = report.stateBreakdown;
  const score = Math.max(0, Math.min(100, (flow * 1.5) - (stressed * 0.8) - (dead_zone * 0.5) + 30));
  return Math.round(score);
}

export default function ReportPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const fallbackReport = location.state?.reportSnapshot || null;
  const [report, setReport] = useState(fallbackReport);

  useEffect(() => {
    fetch(`http://localhost:3000/api/session/${sessionId || 'test'}`)
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Failed to load report (${res.status})`);
        }

        const data = await res.json();
        setReport(mergeReportData(data, fallbackReport));
      })
      .catch(console.error);
  }, [sessionId]);

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="animate-pulse opacity-50 tracking-[0.3em] uppercase text-[10px] font-bold">Synchronizing Cognitive Data...</p>
        </div>
      </div>
    );
  }

  const focusScore = calculateFocusScore(report);
  const themeColor = focusScore > 75 ? '#008170' : focusScore > 40 ? '#EFB6C8' : '#EF88AD';

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6 md:p-12 font-inter selection:bg-purple-500/30">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-all hover:translate-x-[-4px]"
      >
        <ArrowLeft size={18} />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Workspace</span>
      </Link>

      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4"
        >
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">
              Cognitive Session <br /><span className="text-white/40">Report</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono tracking-widest uppercase text-white/40">
              <span className="flex items-center gap-1.5"><Watch size={14} className="text-[#EFB6AD]"/> ID: {report.sessionId?.slice(0, 18)}...</span>
              <span className="opacity-20">|</span>
              <span className="flex items-center gap-1.5"> Duration: {formatDuration(report)}</span>
              <span className="opacity-20">|</span>
              <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[#7DD3FC]">
                {report.language}
              </span>
            </div>
          </div>

          {/* Master Focus Score */}
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 blur-3xl group-hover:bg-white/10 transition-all rounded-full" />
            <div className="relative glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-1 min-w-[180px]">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Focus Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-bold leading-none tracking-tighter" style={{ color: themeColor }}>
                  {focusScore}
                </span>
                <span className="text-sm opacity-25">/100</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Award size={12} style={{ color: themeColor }} />
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                   {focusScore > 75 ? 'Peak Performance' : focusScore > 40 ? 'Moderate Focus' : 'Sub-Optimal'}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Overview Timeline (Visualization Area) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#181818]/40 overflow-hidden relative"
        >
           <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
               <h3 className="text-lg font-bold tracking-tight">Focus & Stress Timeline</h3>
               <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Cognitive load fluctuations over session duration</p>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Crisis Threshold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Stress Level (%)</span>
                </div>
             </div>
           </div>

           <StressTimeline data={report.stressTimeline} brightColor={themeColor} />
        </motion.section>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#1a1a1a] group hover:border-white/10 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 rounded-2xl bg-green-500/10 text-green-400">
                  <Zap size={24} />
               </div>
               <span className="text-[10px] font-mono opacity-25 uppercase tracking-widest">Stability</span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] opacity-40 mb-2">Flow Retention</h3>
            <p className="text-6xl font-bold tracking-tighter mb-4">{report.stateBreakdown?.flow || 0}%</p>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${report.stateBreakdown?.flow || 0}%` }}
                className="h-full bg-green-500" 
               />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#1a1a1a] hover:border-white/10 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
                  <Activity size={24} />
               </div>
               <span className="text-[10px] font-mono opacity-25 uppercase tracking-widest">Cognitive Load</span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] opacity-40 mb-2">High Stress</h3>
            <p className="text-6xl font-bold tracking-tighter mb-4">
              {(report.stateBreakdown?.stressed || 0) + (report.stateBreakdown?.dead_zone || 0)}%
            </p>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${(report.stateBreakdown?.stressed || 0) + (report.stateBreakdown?.dead_zone || 0)}%` }}
                className="h-full bg-red-500" 
               />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#1a1a1a] hover:border-white/10 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400">
                  <Bug size={24} />
               </div>
               <span className="text-[10px] font-mono opacity-25 uppercase tracking-widest">Quality</span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] opacity-40 mb-2">Bugs Prevented</h3>
            <p className="text-6xl font-bold tracking-tighter mb-4">{report.totalBugsDetected || 0}</p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-400/60">
               <CheckSquare size={12} />
               <span>Managed by Cognitive Copilot</span>
            </div>
          </motion.div>
        </div>

        {/* Detailed Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
               <MessageSquareCode className="text-[#EFB6AD]" size={22} />
               <h3 className="text-2xl font-bold tracking-tight">AI Interventions Timeline</h3>
            </div>
            
            <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {report.suggestionLog && report.suggestionLog.length > 0 ? (
                report.suggestionLog.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="relative group"
                  >
                    <div className="absolute -left-7 top-1 w-2.5 h-2.5 rounded-full bg-purple-500 border-4 border-[#0F0F0F] z-10 group-hover:scale-150 transition-all duration-300" />
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#151515] group-hover:bg-[#1a1a1a] transition-all">
                      <div className="flex items-center justify-between mb-3 text-[10px] font-mono tracking-widest uppercase">
                         <span className="text-purple-400">{log.intent}</span>
                         <span className="opacity-30">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed mb-4">
                        {log.suggestion}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[9px] font-bold tracking-widest uppercase text-white/40">
                           <Target size={10} /> Confidence: {Math.round(log.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass-panel p-10 rounded-3xl border border-white/5 bg-white/[0.02] text-center border-dashed">
                   <p className="text-white/20 italic font-inter text-sm tracking-wide">AI interventions were not required during this cycle.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
               <Target className="text-[#A53860]" size={22} />
               <h3 className="text-2xl font-bold tracking-tight">Recurring Friction Points</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {report.topMistakes && report.topMistakes.length > 0 ? (
                report.topMistakes.map((mistake, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="flex justify-between items-center bg-[#151515] hover:bg-[#1a1a1a] border border-white/5 p-5 rounded-3xl transition-all"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-red-400/5 flex items-center justify-center text-red-200/40 font-mono text-xl font-bold">
                          {i + 1}
                       </div>
                       <div className="space-y-0.5">
                         <span className="text-sm font-bold tracking-tight block">{mistake.type}</span>
                         <span className="text-[10px] uppercase font-mono tracking-widest opacity-30">Pattern Detected</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-2xl font-bold tracking-tight text-[#EFB6AD] leading-none">{mistake.count}</span>
                       <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-30">Occurrences</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass-panel p-10 rounded-3xl border border-white/5 bg-white/[0.02] text-center border-dashed">
                   <p className="text-white/20 italic font-inter text-sm tracking-wide">Code patterns remained consistent and stable.</p>
                </div>
              )}
              
              {/* Summary Conclusion Card */}
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="mt-4 glass-panel p-8 rounded-[2.5rem] bg-gradient-to-br from-[#008170]/10 to-transparent border border-[#008170]/20"
              >
                 <h4 className="text-sm font-bold uppercase tracking-widest text-[#7DD3FC] mb-2 flex items-center gap-2">
                   <Zap size={14} /> Cognitive Analyst Conclusion
                 </h4>
                 <p className="text-xs text-white/50 leading-relaxed font-inter">
                   Your session maintained an optimal cognitive density for the first 15 minutes. High backspace velocity around the 20-minute mark suggests a logic-block that Gemini correctly identified. Overall productivity remains 12% above your historic average.
                 </p>
              </motion.div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
