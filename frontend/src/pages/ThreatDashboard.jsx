import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ShieldX, CheckCircle, Globe, Activity, XCircle, Download } from 'lucide-react';
import { generateSecurityReport } from '../utils/reportGenerator';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const SEVERITY_COLORS = {
  High: '#ef4444',   // red-500
  Medium: '#f97316', // orange-500
  Low: '#eab308'     // yellow-500
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

  // 2. Timeline Data
  const timelineData = useMemo(() => {
    const buckets = {};
    const sorted = [...activeAlerts].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    sorted.forEach(a => {
      const ts = a.timestamp ? a.timestamp * 1000 : Date.now();
      const timeStr = new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      buckets[timeStr] = (buckets[timeStr] || 0) + 1;
    });

    return Object.keys(buckets).map(time => ({
      time,
      alerts: buckets[time]
    })).slice(-20);
  }, [activeAlerts]);

  // 3. Suspicious Hosts Data
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
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Security Center</h2>
          <p className="text-text-muted">Real-time threat timeline, severity distribution, and suspicious host tracking.</p>
        </div>
        <button
          onClick={() => generateSecurityReport(threatAlerts, livePackets, analytics)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 rounded-xl transition-all font-medium text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)]"
        >
          <Download className="w-4 h-4" />
          Generate Security Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Severity Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-[300px]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-text-main">Severity Distribution</h3>
          </div>
          {severityData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">No active threats detected</div>
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
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-text-main">{activeAlerts.length}</span>
                <span className="text-xs text-text-muted uppercase">Total</span>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Threat Timeline */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-[300px]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-main">Threat Timeline</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {activeAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">No threat events recorded yet.</div>
            ) : (
              <div className="relative border-l-2 border-border/50 ml-3 space-y-6">
                {activeAlerts.slice().reverse().map((alert, idx) => {
                  const timeStr = alert.timestamp ? new Date(alert.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const color = alert.severity === 'High' ? 'bg-red-500' : (alert.severity === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500');
                  const glow = alert.severity === 'High' ? 'shadow-[0_0_8px_rgba(239,68,68,0.5)]' : '';

                  return (
                    <div key={idx} className="relative pl-6 group">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-surface ${color} ${glow} transition-transform group-hover:scale-125`}></div>

                      {/* Content */}
                      <div className="flex flex-col bg-background/50 p-3 rounded-xl border border-border/50 transition-colors group-hover:border-primary/30">
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="font-mono text-xs font-bold text-text-muted">{timeStr}</span>
                          <span className="font-bold text-text-main text-sm">{alert.type}</span>
                          {alert.confidence && (
                            <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              {alert.confidence}% Conf
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {alert.message} <span className="font-mono text-text-main ml-1">({alert.src_ip})</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Attack Simulation Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-text-main">Live Attack Simulation Mode</h3>
          <span className="px-2 py-0.5 ml-2 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded uppercase tracking-widest border border-blue-500/20">Demo</span>
        </div>
        <p className="text-sm text-text-muted mb-4">Inject synthetic attack vectors directly into the deep packet inspection pipeline. Watch the Threat Timeline, Topology Map, and AI Engine react in real-time.</p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => fetch('http://localhost:8000/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attack_type: 'DNS Flood' }) })}
            className="flex-1 min-w-[200px] px-4 py-3 bg-background border border-border hover:border-red-500/50 hover:bg-red-500/5 rounded-xl transition-all text-text-main font-medium text-sm flex items-center justify-between group"
          >
            <span>Generate DNS Flood</span>
            <ShieldX className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => fetch('http://localhost:8000/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attack_type: 'Port Scan' }) })}
            className="flex-1 min-w-[200px] px-4 py-3 bg-background border border-border hover:border-orange-500/50 hover:bg-orange-500/5 rounded-xl transition-all text-text-main font-medium text-sm flex items-center justify-between group"
          >
            <span>Generate Port Scan</span>
            <AlertTriangle className="w-4 h-4 text-orange-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => fetch('http://localhost:8000/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attack_type: 'ICMP Flood' }) })}
            className="flex-1 min-w-[200px] px-4 py-3 bg-background border border-border hover:border-yellow-500/50 hover:bg-yellow-500/5 rounded-xl transition-all text-text-main font-medium text-sm flex items-center justify-between group"
          >
            <span>Generate ICMP Flood</span>
            <ShieldAlert className="w-4 h-4 text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">

        {/* Suspicious Hosts Table */}
        <div className="bg-surface rounded-2xl border border-border shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-text-main">Suspicious Hosts</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface/90 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Source IP</th>
                  <th className="px-6 py-3 font-medium">Violations</th>
                  <th className="px-6 py-3 font-medium">Threat Types</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {hostsData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-text-muted">No suspicious hosts tracked.</td>
                  </tr>
                ) : (
                  hostsData.map((host, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 font-mono text-text-main">{host.ip}</td>
                      <td className="px-6 py-3">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-danger/10 text-danger border border-danger/20">
                          {host.count} Alerts
                        </span>
                      </td>
                      <td className="px-6 py-3 text-text-muted text-xs truncate max-w-[150px]">{host.types}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Alerts Table */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-danger" />
            <h3 className="font-semibold text-text-main">Live Alerts</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 bg-surface/90 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-text-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Source IP</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {activeAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-text-muted">
                        <CheckCircle className="w-10 h-10 text-green-500/50 mb-3" />
                        <p>All systems secure.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeAlerts.map((alert) => {
                    const isBlocked = actionedAlerts[alert.originalIdx] === 'blocked';

                    return (
                      <tr
                        key={alert.originalIdx}
                        className={`group hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors ${isBlocked ? 'opacity-50 bg-red-500/5' : ''
                          }`}
                      >
                        <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                          {alert.timestamp ? new Date(alert.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${alert.severity === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                            }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-main text-xs">{alert.type}</span>
                            {alert.confidence && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                                {alert.confidence}% Conf
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-main">
                          {alert.src_ip}
                          {isBlocked && (
                            <span className="ml-2 text-[9px] font-bold text-red-500 uppercase tracking-wider border border-red-500/30 px-1 rounded">
                              Blocked
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted max-w-[200px] truncate" title={alert.message}>
                          {alert.message}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isBlocked ? (
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleAction(alert.originalIdx, 'dismissed')}
                                className="px-2 py-1 rounded text-xs font-medium text-text-muted hover:text-text-main hover:bg-white/[0.05] transition-colors"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleAction(alert.originalIdx, 'blocked')}
                                className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors"
                              >
                                Block
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic pr-2">Actioned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
