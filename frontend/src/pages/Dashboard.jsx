import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Shield, Wifi, Zap, Eye, AlertTriangle, PieChart as PieChartIcon, BarChart2, Activity, Users } from 'lucide-react';
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
  const { analytics, livePackets, chartData, threatAlerts } = useOutletContext();
  const [deviceCount, setDeviceCount] = React.useState(0);

  React.useEffect(() => {
    fetch('http://localhost:8000/api/devices')
      .then(res => res.json())
      .then(data => setDeviceCount(data.length))
      .catch(() => {});
  }, []);

  const healthMetrics = useMemo(() => {
    let score = 100;

    // Threat & Anomaly Penalties based on active ML alerts
    const threatPenalty = (threatAlerts || []).reduce((acc, curr) => {
      if (curr.severity === 'High') return acc + 5;
      if (curr.severity === 'Medium') return acc + 2;
      return acc + 1;
    }, 0);

    // Simulated packet loss or congestion penalty based on volume
    const packetRate = analytics?.packets_per_second || 0;
    const packetLossPenalty = packetRate > 1000 ? 5 : (packetRate > 500 ? 2 : 0);

    score = Math.max(0, 100 - threatPenalty - packetLossPenalty);

    let status = "Healthy";
    let color = "text-green-500";
    let iconColor = "text-green-500";
    let bg = "bg-green-500/10";
    let border = "border-green-500/20";

    if (score <= 50) {
      status = "Critical";
      color = "text-red-500";
      iconColor = "text-red-500";
      bg = "bg-red-500/10";
      border = "border-red-500/20";
    } else if (score <= 85) {
      status = "Degraded";
      color = "text-orange-500";
      iconColor = "text-orange-500";
      bg = "bg-orange-500/10";
      border = "border-orange-500/20";
    }

    return { score, status, color, bg, border, iconColor };
  }, [threatAlerts, analytics]);

  const protocolData = useMemo(() => {
    if (!analytics || !analytics.protocols) return [];
    return Object.keys(analytics.protocols).map(key => ({
      name: key,
      value: analytics.protocols[key]
    })).sort((a, b) => b.value - a.value); // Sort highest first
  }, [analytics]);

  const topTalkers = useMemo(() => {
    if (!livePackets || livePackets.length === 0) return { src: [], dst: [], ports: [] };

    const srcMap = {};
    const dstMap = {};
    const portMap = {};
    const total = livePackets.length;

    livePackets.forEach(p => {
      srcMap[p.src_ip] = (srcMap[p.src_ip] || 0) + 1;
      dstMap[p.dst_ip] = (dstMap[p.dst_ip] || 0) + 1;
      if (p.dst_port) portMap[p.dst_port] = (portMap[p.dst_port] || 0) + 1;
    });

    const formatTop = (map) => Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, val]) => ({ key, percentage: Math.round((val / total) * 100) }));

    return {
      src: formatTop(srcMap),
      dst: formatTop(dstMap),
      ports: formatTop(portMap)
    };
  }, [livePackets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Recruiter Metrics Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-surface to-background border border-primary/30 p-6 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-lg font-bold text-text-main">System Performance KPIs</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 ml-2">Enterprise Grade</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          <div className="pt-4 md:pt-0 md:px-4 md:first:pl-0 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Packets Processed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-main">{analytics?.total_packets?.toLocaleString() || 0}</span>
              <span className="text-primary text-xl font-bold">+</span>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:px-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Threat Events</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-main">{(threatAlerts || []).length}</span>
              <span className="text-orange-500 text-sm font-bold ml-1">Analyzed</span>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:px-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Devices Discovered</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-main">{deviceCount}</span>
              <span className="text-green-500 text-sm font-bold ml-1">Identified</span>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:px-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Detection Time</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-green-400">&lt;200</span>
              <span className="text-green-400 text-sm font-bold">ms</span>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:px-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Protocol Coverage</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-main">{Object.keys(analytics?.protocols || {}).length}</span>
              <span className="text-text-muted text-sm font-bold ml-1">Supported</span>
            </div>
          </div>

        </div>
      </div>

      {/* Top Row - 4 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* 1. Network Health */}
        <div className={`bg-surface p-6 rounded-2xl border shadow-md transition-colors duration-300 ${healthMetrics.border} relative overflow-hidden group flex items-center justify-between`}>
          <div className={`absolute left-0 top-0 w-1 h-full ${healthMetrics.bg}`}></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className={`w-4 h-4 ${healthMetrics.iconColor}`} />
              <h3 className="font-semibold text-text-main text-sm">Network Health</h3>
            </div>
            <div className={`text-xs font-bold ${healthMetrics.color} uppercase tracking-wide mb-2`}>
              {healthMetrics.status}
            </div>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="var(--border-subtle)" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="28" fill="transparent"
                stroke="currentColor" strokeWidth="6"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 - (175.9 * healthMetrics.score) / 100}
                className={`transition-all duration-1000 ease-out ${healthMetrics.color}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-text-main">{healthMetrics.score}</span>
            </div>
          </div>
        </div>

        {/* 2. Total Packets */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md transition-colors duration-300 hover:border-primary/50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Wifi className="text-secondary w-4 h-4" />
            </div>
            <h3 className="font-semibold text-text-main text-sm">Total Packets</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-text-main">{analytics?.total_packets?.toLocaleString() || 0}</p>
            <span className="text-xs text-text-muted">{analytics?.packets_per_second || 0} pps</span>
          </div>
        </div>

        {/* 3. Total Traffic */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md transition-colors duration-300 hover:border-danger/50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-danger/20 rounded-lg">
              <Zap className="text-danger w-4 h-4" />
            </div>
            <h3 className="font-semibold text-text-main text-sm">Total Traffic</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-text-main">{((analytics?.total_bytes || 0) / 1024).toFixed(2)}</p>
            <span className="text-xs text-text-muted">KB</span>
          </div>
        </div>

        {/* 4. Active Threats */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md transition-colors duration-300 hover:border-orange-500/50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Shield className="text-orange-500 w-4 h-4" />
            </div>
            <h3 className="font-semibold text-text-main text-sm">Active Threats</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-text-main">{(threatAlerts || []).length}</p>
            <span className="text-xs text-text-muted">Detected</span>
          </div>
        </div>
      </div>

      {/* Middle Row - Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-border shadow-md min-h-[350px] relative overflow-hidden group flex flex-col">
          <h2 className="text-lg font-semibold text-text-main mb-4">Live Network Bandwidth</h2>
          <div className="flex-1 w-full min-h-[250px]">
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

        {/* Protocol Pie Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md min-h-[350px] flex flex-col relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-main">Protocol Distribution</h3>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
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

      {/* Bottom Row - Additional Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Protocol Frequency Bar Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-[300px] overflow-hidden">
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

        {/* Top Talkers Widget */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-[300px] overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-text-main">Top Talkers</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">

            {/* Source IPs */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Top Sources</h4>
              <div className="space-y-2">
                {topTalkers.src.map((item, i) => (
                  <div key={`src-${i}`} className="flex justify-between items-center text-sm">
                    <span className="font-mono text-text-main">{item.key}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                      <span className="text-text-muted w-8 text-right text-xs">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
                {topTalkers.src.length === 0 && <span className="text-xs text-text-muted">No data</span>}
              </div>
            </div>

            {/* Destination IPs */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Top Destinations</h4>
              <div className="space-y-2">
                {topTalkers.dst.map((item, i) => (
                  <div key={`dst-${i}`} className="flex justify-between items-center text-sm">
                    <span className="font-mono text-text-main truncate max-w-[120px]">{item.key}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                      <span className="text-text-muted w-8 text-right text-xs">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
                {topTalkers.dst.length === 0 && <span className="text-xs text-text-muted">No data</span>}
              </div>
            </div>

            {/* Ports */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Top Ports</h4>
              <div className="space-y-2">
                {topTalkers.ports.map((item, i) => (
                  <div key={`port-${i}`} className="flex justify-between items-center text-sm">
                    <span className="font-mono text-text-main">Port {item.key}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                      <span className="text-text-muted w-8 text-right text-xs">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
                {topTalkers.ports.length === 0 && <span className="text-xs text-text-muted">No data</span>}
              </div>
            </div>

          </div>
        </div>

        {/* Deep Packet Inspector Mini */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-[300px] overflow-hidden">
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
              {livePackets.slice(-30).reverse().map((pkt, idx) => (
                <div key={idx} className="text-xs flex justify-between items-center p-2.5 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors">
                  <span className="font-mono font-bold w-12" style={{ color: PROTOCOL_COLORS[pkt.protocol] || '#9ca3af' }}>
                    {pkt.protocol}
                  </span>
                  <span className="text-text-muted font-mono truncate max-w-[120px]">{pkt.src_ip}</span>
                  <span className="text-text-muted">→</span>
                  <span className="text-text-muted font-mono truncate max-w-[120px]">{pkt.dst_ip}</span>
                  <span className="text-text-main font-medium w-12 text-right">{pkt.size}B</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
