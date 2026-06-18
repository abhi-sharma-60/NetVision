import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 max-w-[1600px] mx-auto min-h-screen pb-32"
    >
      {/* Header Area */}
      <motion.div variants={item} className="mb-8">
        <h1 className="text-3xl font-light text-text-main tracking-tight">System <span className="font-semibold text-primary">Overview</span></h1>
        <p className="text-text-muted mt-1">Real-time network telemetry and intelligence.</p>
      </motion.div>

      {/* Recruiter Impact Stat Banner */}
      <motion.div variants={item} className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4 glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-r from-primary/5 via-transparent to-blue-600/5">
        <div className="flex flex-col items-center text-center px-2 md:border-r border-border/50 last:border-0">
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-text-main to-text-muted tracking-tight">
            {analytics?.total_packets > 1000 ? (analytics.total_packets / 1000).toFixed(1) + 'K+' : (analytics?.total_packets || 0)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold mt-2">Packets Analyzed</span>
        </div>
        <div className="flex flex-col items-center text-center px-2 md:border-r border-border/50 last:border-0">
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-text-main to-text-muted tracking-tight">
            {threatAlerts?.length || 0}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-danger font-bold mt-2">Threat Events</span>
        </div>
        <div className="flex flex-col items-center text-center px-2 md:border-r border-border/50 last:border-0">
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-text-main to-text-muted tracking-tight">
            {deviceCount || 0}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-secondary font-bold mt-2">Devices Monitored</span>
        </div>
        <div className="flex flex-col items-center text-center px-2 md:border-r border-border/50 last:border-0">
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-text-main to-text-muted tracking-tight">
            {livePackets.length > 0 ? '<200ms' : '-'}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mt-2">Alert Generation</span>
        </div>
        <div className="flex flex-col items-center text-center px-2 border-border/50 last:border-0">
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-text-main to-text-muted tracking-tight">
            {protocolData?.length || 0}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-purple-500 font-bold mt-2">Protocols Tracked</span>
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-[160px]">
        
        {/* Centerpiece Chart (Spans 8 columns, 2 rows) */}
        <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-8 row-span-2 glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-semibold text-text-main">Live Bandwidth</h2>
              <p className="text-xs text-text-muted">Real-time packet ingestion rate</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-xs font-medium">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              Streaming
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}B`} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface-glass)', backdropFilter: 'blur(10px)', borderColor: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-main)', boxShadow: '0 10px 25px -5px var(--shadow-color)' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="size"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 8, fill: 'var(--color-primary)', stroke: 'rgba(59,130,246,0.3)', strokeWidth: 4 }}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Health Score (Spans 4 columns, 1 row) */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-4 row-span-1 glass-panel rounded-3xl p-6 relative overflow-hidden flex items-center justify-between">
          <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${healthMetrics.bg.replace('/10', '')}`}></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className={`w-5 h-5 ${healthMetrics.iconColor}`} />
              <h3 className="font-semibold text-text-main text-lg">System Health</h3>
            </div>
            <div className={`text-sm font-bold ${healthMetrics.color} uppercase tracking-wide`}>
              {healthMetrics.status}
            </div>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="var(--border-glass)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="36" fill="transparent"
                stroke="currentColor" strokeWidth="6"
                strokeDasharray="226.2"
                strokeDashoffset={226.2 - (226.2 * healthMetrics.score) / 100}
                className={`transition-all duration-1000 ease-out ${healthMetrics.color}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-text-main drop-shadow-md">{healthMetrics.score}</span>
            </div>
          </div>
        </motion.div>

        {/* Active Threats Mini (Spans 2 columns, 1 row) */}
        <motion.div variants={item} className="col-span-1 md:col-span-1 lg:col-span-2 row-span-1 glass-panel rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <Shield className="text-orange-500 w-5 h-5 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-main">{(threatAlerts || []).length}</p>
              <h3 className="font-medium text-text-muted text-sm">Active Threats</h3>
            </div>
          </div>
        </motion.div>

        {/* Total Devices Mini (Spans 2 columns, 1 row) */}
        <motion.div variants={item} className="col-span-1 md:col-span-1 lg:col-span-2 row-span-1 glass-panel rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
              <Users className="text-secondary w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-main">{deviceCount}</p>
              <h3 className="font-medium text-text-muted text-sm">Devices</h3>
            </div>
          </div>
        </motion.div>

        {/* Protocol Distribution (Spans 4 columns, 2 rows) */}
        <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-4 row-span-2 glass-panel rounded-3xl p-6 flex flex-col relative">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="w-5 h-5 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
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
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  cornerRadius={4}
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROTOCOL_COLORS[entry.name] || '#6b7280'} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface-glass)', backdropFilter: 'blur(10px)', borderColor: 'var(--border-glass)', borderRadius: '12px', color: 'var(--text-main)', boxShadow: '0 10px 25px -5px var(--shadow-color)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-text-main">{protocolData.length}</span>
              <span className="text-xs text-text-muted">Protocols</span>
            </div>
          </div>
        </motion.div>

        {/* Live Packet Inspector Mini (Spans 4 columns, 2 rows) */}
        <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-4 row-span-2 glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <h3 className="font-semibold text-text-main">Packet Stream</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {livePackets.length === 0 && <p className="text-sm text-text-muted text-center mt-10">Intercepting packets...</p>}
              {livePackets.slice(-15).reverse().map((pkt, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs flex justify-between items-center p-3 rounded-xl bg-surface/50 border border-border hover:bg-primary/5 transition-colors backdrop-blur-sm"
                >
                  <span className="font-mono font-bold w-12" style={{ color: PROTOCOL_COLORS[pkt.protocol] || '#9ca3af' }}>
                    {pkt.protocol}
                  </span>
                  <div className="flex flex-col gap-1 w-[140px]">
                    <span className="text-text-main font-mono truncate">{pkt.src_ip}</span>
                    <span className="text-text-muted font-mono truncate">{pkt.dst_ip}</span>
                  </div>
                  <span className="text-primary font-medium w-14 text-right bg-primary/10 py-1 px-2 rounded-md">{pkt.size}B</span>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Fading edge at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg-surface-glass)] to-transparent pointer-events-none rounded-b-3xl"></div>
        </motion.div>

        {/* KPI: Processed Packets (Spans 4 columns, 1 row) */}
        <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-4 row-span-1 glass-panel rounded-3xl p-6 flex justify-between items-center group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-text-muted mb-1">Total Packets Analyzed</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-text-main tracking-tight">{analytics?.total_packets?.toLocaleString() || 0}</span>
              <span className="text-primary font-bold">pps: {analytics?.packets_per_second || 0}</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 relative z-10">
             <Wifi className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
          </div>
        </motion.div>

        {/* KPI: Total Traffic (Spans 4 columns, 1 row) */}
        <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-4 row-span-1 glass-panel rounded-3xl p-6 flex justify-between items-center group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-danger/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-text-muted mb-1">Total Traffic Volume</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-text-main tracking-tight">{((analytics?.total_bytes || 0) / 1024).toFixed(2)}</span>
              <span className="text-danger font-bold">KB</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center border border-danger/20 relative z-10">
             <Zap className="w-8 h-8 text-danger drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
