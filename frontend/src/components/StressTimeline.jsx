import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-3 bg-black/80 border border-white/10 rounded-xl text-xs font-mono shadow-2xl">
        <p className="text-white/40 mb-1">{new Date(label).toLocaleTimeString()}</p>
        <p className="font-bold flex items-center gap-2">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: payload[0].color }} 
          />
          Stress: <span className="text-white">{data.score}%</span>
        </p>
        <p className="text-white/60 mt-1 uppercase tracking-widest text-[10px]">State: {data.state}</p>
      </div>
    );
  }
  return null;
};

export default function StressTimeline({ data, brightColor }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={brightColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={brightColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          
          <XAxis 
            dataKey="timestamp" 
            hide 
          />
          
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Stress Zones */}
          <ReferenceArea y1={75} y2={100} fill="rgba(239, 68, 68, 0.05)" stroke="none" />
          <ReferenceArea y1={50} y2={75} fill="rgba(168, 85, 247, 0.05)" stroke="none" />

          <Area
            type="monotone"
            dataKey="score"
            stroke={brightColor}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorStress)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
