import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ShieldX, CheckCircle, Globe, Activity, Download, Crosshair, Radar } from 'lucide-react';
import { generateSecurityReport } from '../utils/reportGenerator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'framer-motion';

const SEVERITY_COLORS = {
  High: '#ef4444',   // red-500
  Medium: '#f97316', // orange-500
  Low: '#eab308'     // yellow-500
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

export default function ThreatDashboard() {
  const { threatAlerts, livePackets, analytics } = useOutletContext();
  const [actionedAlerts, setActionedAlerts] = useState({});

  const handleAction = (idx, action) => {
    setActionedAlerts(prev => ({ ...prev, [idx]: action }));
  };

  const activeAlerts = useMemo(() => {
    return threatAlerts
      .map((alert, idx) => ({ ...alert, originalIdx: idx }))
      .filter(a => actionedAlerts[a.originalIdx] !== 'dismissed');
  }, [threatAlerts, actionedAlerts]);

  // 1. Severity Data
  const severityData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    activeAlerts.forEach(a => {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
      else counts[a.severity] = 1;
    });
    return Object.keys(counts).filter(k => counts[k] > 0).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [activeAlerts]);

  // 2. Suspicious Hosts Data
  const hostsData = useMemo(() => {
    const hosts = {};
    activeAlerts.forEach(a => {
      if (!hosts[a.src_ip]) hosts[a.src_ip] = { count: 0, types: new Set() };
      hosts[a.src_ip].count++;
      hosts[a.src_ip].types.add(a.type);
    });
    return Object.keys(hosts).map(ip => ({
      ip,
      count: hosts[ip].count,
      types: Array.from(hosts[ip].types).join(', ')
    })).sort((a, b) => b.count - a.count);
  }, [activeAlerts]);

  return (
    <motion.div 
      className="space-y-6 max-w-[1600px] mx-auto px-8 pt-8 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light text-text-main tracking-tight">Threat <span className="font-semibold text-red-500">Intelligence</span></h2>
          <p className="text-sm text-text-muted mt-1">Real-time threat timeline, severity distribution, and suspicious host tracking.</p>
        </div>
        <button
          onClick={() => generateSecurityReport(threatAlerts, livePackets, analytics)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-xl transition-all font-medium text-sm shadow-[0_0_20px_rgba(239,68,68,0.15)] group"
        >
          <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          Export Security Report
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Vertical Threat Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col h-[400px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                <Radar className="w-5 h-5 animate-[spin_4s_linear_infinite]" />
              </div>
              <h3 className="text-lg font-semibold text-text-main tracking-wide">Threat Timeline</h3>
            </div>
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">{activeAlerts.length} Active</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative z-10">
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                <span className="text-sm">No threat events recorded yet.</span>
              </div>
            ) : (
              <div className="relative border-l border-border/50 ml-3 space-y-6 pb-4">
                {activeAlerts.slice().reverse().map((alert, idx) => {
                  const timeStr = alert.timestamp ? new Date(alert.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const color = alert.severity === 'High' ? 'bg-red-500' : (alert.severity === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500');
                  const shadow = alert.severity === 'High' ? 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' : '';

                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx} 
                      className="relative pl-8 group/item"
                    >
                      <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ${color} ${shadow} ring-4 ring-background transition-transform group-hover/item:scale-150`}></div>
                      
                      <div className="flex flex-col bg-surface/50 p-4 rounded-2xl border border-border transition-all duration-300 hover:bg-surface hover:border-border hover:-translate-y-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[10px] font-bold text-text-muted tracking-wider">{timeStr}</span>
                          <span className={`text-sm font-bold ${alert.severity === 'High' ? 'text-red-400' : 'text-text-main'}`}>{alert.type}</span>
                          {alert.confidence && (
                            <span className="ml-auto text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                              {alert.confidence}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                          {alert.message}
                        </p>
                        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                           <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
                              <Crosshair className="w-3 h-3" />
                              {alert.src_ip}
                           </div>
                           <button
                              onClick={() => handleAction(alert.originalIdx, 'blocked')}
                              className="opacity-0 group-hover/item:opacity-100 px-3 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all uppercase tracking-wider"
                            >
                              Block Source
                            </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Severity Chart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
               <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-text-main tracking-wide">Severity Matrix</h3>
          </div>
          {severityData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
              <CheckCircle className="w-12 h-12 mb-4 text-green-500/30" />
              <span className="text-sm">No active threats detected</span>
            </div>
          ) : (
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface-glass)', backdropFilter: 'blur(12px)', borderColor: 'var(--border-subtle)', borderRadius: '12px', color: 'var(--text-main)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-light text-text-main">{activeAlerts.length}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">Total Threats</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Live Attack Simulation Card */}
      <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
             <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-text-main tracking-wide">Live Attack Simulation Mode</h3>
          <span className="px-2 py-0.5 ml-2 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase tracking-widest border border-blue-500/30">Training</span>
        </div>
        <p className="text-sm text-text-muted mb-6 max-w-2xl relative z-10 leading-relaxed">
          Inject synthetic attack vectors directly into the deep packet inspection pipeline. Watch the Threat Timeline, Topology Map, and AI Engine react in real-time to simulated incursions.
        </p>
        <div className="flex flex-wrap gap-4 relative z-10">
          <button
            onClick={() => fetch('http://localhost:8000/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attack_type: 'DNS Flood' }) })}
            className="flex-1 min-w-[200px] px-5 py-4 bg-surface/50 border border-border hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] rounded-2xl transition-all text-text-main font-medium text-sm flex items-center justify-between group"
          >
            <span className="tracking-wide">Launch DNS Flood</span>
            <ShieldX className="w-5 h-5 text-red-500 opacity-30 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => fetch('http://localhost:8000/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attack_type: 'Port Scan' }) })}
            className="flex-1 min-w-[200px] px-5 py-4 bg-surface/50 border border-border hover:border-orange-500/50 hover:bg-orange-500/10 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] rounded-2xl transition-all text-text-main font-medium text-sm flex items-center justify-between group"
          >
            <span className="tracking-wide">Execute Port Scan</span>
            <Activity className="w-5 h-5 text-orange-500 opacity-30 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => fetch('http://localhost:8000/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attack_type: 'ICMP Flood' }) })}
            className="flex-1 min-w-[200px] px-5 py-4 bg-surface/50 border border-border hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] rounded-2xl transition-all text-text-main font-medium text-sm flex items-center justify-between group"
          >
            <span className="tracking-wide">Deploy ICMP Flood</span>
            <ShieldAlert className="w-5 h-5 text-yellow-500 opacity-30 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">

        {/* Suspicious Hosts Table */}
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-surface/50 flex items-center gap-3">
             <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
               <Crosshair className="w-4 h-4" />
             </div>
            <h3 className="text-sm font-semibold text-text-main uppercase tracking-wider">Suspicious Origins</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface/80 backdrop-blur-md z-10 text-[10px] uppercase tracking-widest text-text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">IP Address</th>
                  <th className="px-6 py-4 font-semibold">Violations</th>
                  <th className="px-6 py-4 font-semibold">Threat Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {hostsData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-text-muted">No suspicious hosts tracked.</td>
                  </tr>
                ) : (
                  hostsData.map((host, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 font-mono text-text-main group-hover:text-primary transition-colors">{host.ip}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          {host.count} Alerts
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-xs truncate max-w-[200px]">{host.types}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Live Alerts Table */}
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-surface/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-text-main uppercase tracking-wider">Alert Log</h3>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="sticky top-0 bg-surface/80 backdrop-blur-md z-10 text-[10px] uppercase tracking-widest text-text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Time</th>
                  <th className="px-6 py-4 font-semibold">Type & Severity</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {activeAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-text-muted">
                        <CheckCircle className="w-8 h-8 text-green-500/30 mb-3" />
                        <span className="text-xs uppercase tracking-widest">All systems secure</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeAlerts.map((alert) => {
                    const isBlocked = actionedAlerts[alert.originalIdx] === 'blocked';

                    return (
                      <tr
                        key={alert.originalIdx}
                        className={`group hover:bg-primary/5 transition-colors ${isBlocked ? 'opacity-30' : ''}`}
                      >
                        <td className="px-6 py-4 text-[10px] font-mono text-text-muted tracking-wider">
                          {alert.timestamp ? new Date(alert.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                               <span className="font-semibold text-text-main text-sm">{alert.type}</span>
                               <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${alert.severity === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                 {alert.severity}
                               </span>
                            </div>
                            <span className="font-mono text-xs text-text-muted">{alert.src_ip}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right align-middle">
                          {!isBlocked ? (
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleAction(alert.originalIdx, 'dismissed')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-white/10 transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest font-bold text-red-500/50 pr-2">Blocked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
