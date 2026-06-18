import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Shield, Wifi, Zap, Eye, AlertTriangle, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const PROTOCOL_COLORS = {
  TCP: '#3b82f6', // blue-500
  UDP: '#f97316', // orange-500
  DNS: '#22c55e', // green-500
  HTTPS: '#a855f7', // purple-500
  ICMP: '#ec4899', // pink-500
  HTTP: '#eab308'  // yellow-500
};

export default function Dashboard() {
  const { analytics, livePackets, chartData } = useOutletContext();

  const protocolData = useMemo(() => {
    if (!analytics || !analytics.protocols) return [];
    return Object.keys(analytics.protocols).map(key => ({
      name: key,
      value: analytics.protocols[key]
    })).sort((a, b) => b.value - a.value); // Sort highest first
  }, [analytics]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
      
      {/* Left Column - Key Metrics */}
      <div className="xl:col-span-1 space-y-6 flex flex-col">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md transition-colors duration-300 hover:border-primary/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Wifi className="text-secondary w-5 h-5" />
            </div>
            <h3 className="font-semibold text-text-main">Total Packets</h3>
          </div>
          <p className="text-4xl font-bold text-text-main">{analytics?.total_packets?.toLocaleString() || 0}</p>
          <p className="text-xs text-text-muted mt-2">At {analytics?.packets_per_second || 0} packets/sec</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md transition-colors duration-300 hover:border-danger/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-danger/20 rounded-lg">
              <Shield className="text-danger w-5 h-5" />
            </div>
            <h3 className="font-semibold text-text-main">Total Traffic</h3>
          </div>
          <p className="text-4xl font-bold text-text-main">{((analytics?.total_bytes || 0) / 1024).toFixed(2)}</p>
          <p className="text-xs text-text-muted mt-2">Kilobytes Processed</p>
        </div>
        
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex-1 min-h-[200px] flex flex-col relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-main">Protocol Distribution</h3>
          </div>
          <div className="flex-1 w-full min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROTOCOL_COLORS[entry.name] || '#6b7280'} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Center & Right Columns */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Main Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md min-h-[350px] relative overflow-hidden group">
          <h2 className="text-xl font-medium text-text-main mb-6">Live Network Bandwidth</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}B`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="size" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'var(--color-primary)' }} 
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row - Additional Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Protocol Frequency Bar Chart */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-72 overflow-hidden">
             <div className="flex items-center gap-2 mb-4">
               <BarChart2 className="w-5 h-5 text-secondary" />
               <h3 className="font-semibold text-text-main">Protocol Frequency</h3>
             </div>
             <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={protocolData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'var(--border-subtle)', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)' }} 
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {protocolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PROTOCOL_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Deep Packet Inspector Mini */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-72 overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Eye className="w-5 h-5 text-primary" />
                 <h3 className="font-semibold text-text-main">Live Packets</h3>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-medium px-2 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  LIVE
               </div>
             </div>
             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               <div className="space-y-2">
                 {livePackets.length === 0 && <p className="text-sm text-text-muted">Waiting for packets...</p>}
                 {livePackets.map((pkt, idx) => (
                   <div key={idx} className="text-xs flex justify-between items-center p-2.5 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors">
                     <span className="font-mono font-bold w-12" style={{ color: PROTOCOL_COLORS[pkt.protocol] || '#9ca3af' }}>
                       {pkt.protocol}
                     </span>
                     <span className="text-text-muted font-mono truncate max-w-[90px]">{pkt.src_ip}</span>
                     <span className="text-text-muted">→</span>
                     <span className="text-text-muted font-mono truncate max-w-[90px]">{pkt.dst_ip}</span>
                     <span className="text-text-main font-medium w-10 text-right">{pkt.size}B</span>
                   </div>
                 ))}
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
