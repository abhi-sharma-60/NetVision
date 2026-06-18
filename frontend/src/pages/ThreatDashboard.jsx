import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ShieldX, CheckCircle, Globe, Activity, XCircle } from 'lucide-react';
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
  const { threatAlerts } = useOutletContext();
  
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
      <div>
        <h2 className="text-2xl font-bold text-text-main mb-2">Security Center</h2>
        <p className="text-text-muted">Real-time threat timeline, severity distribution, and suspicious host tracking.</p>
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

        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-[300px]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-main">Threat Timeline</h3>
          </div>
          <div className="flex-1 w-full">
            {timelineData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">Waiting for threat data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="alerts" stroke="#ef4444" fillOpacity={1} fill="url(#colorAlerts)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        
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

        {/* Live Alerts Log */}
        <div className="bg-surface rounded-2xl border border-border shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-danger" />
            <h3 className="font-semibold text-text-main">Live Alert Log</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="p-4 space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                  <CheckCircle className="w-10 h-10 text-green-500/50 mb-3" />
                  <p>All systems secure.</p>
                </div>
              ) : (
                activeAlerts.map((alert) => {
                  const isBlocked = actionedAlerts[alert.originalIdx] === 'blocked';
                  
                  return (
                    <div 
                      key={alert.originalIdx} 
                      className={`group p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300 ${
                        isBlocked ? 'border-red-500/50 bg-red-500/5 opacity-60' : 'border-border bg-background/50 hover:border-danger/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            alert.severity === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="font-semibold text-text-main text-sm">{alert.type}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isBlocked && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleAction(alert.originalIdx, 'dismissed')}
                                className="px-2 py-1 rounded text-xs font-medium text-text-muted hover:text-text-main hover:bg-white/[0.05] flex items-center gap-1 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Dismiss
                              </button>
                              <button 
                                onClick={() => handleAction(alert.originalIdx, 'blocked')}
                                className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 flex items-center gap-1 transition-colors"
                              >
                                <ShieldX className="w-3.5 h-3.5" /> Block
                              </button>
                            </div>
                          )}
                          <span className="text-xs text-text-muted font-mono">
                            {alert.timestamp ? new Date(alert.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted">{alert.message}</p>
                      <div className="text-xs font-mono text-text-main mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ShieldX className="w-3.5 h-3.5 text-danger" />
                          Attacker: {alert.src_ip}
                        </div>
                        {isBlocked && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider border border-red-500/30 px-1.5 py-0.5 rounded">
                            IP Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
