import React, { useState, useEffect } from 'react';
import { Activity, Shield, Wifi, Server, Moon, Sun, AlertTriangle, Eye, Zap } from 'lucide-react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [analytics, setAnalytics] = useState({
    total_packets: 0,
    total_bytes: 0,
    packets_per_second: 0,
    protocols: {}
  });

  const [livePackets, setLivePackets] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch analytics overview periodically
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/analytics/overview');
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics.");
      }
    };
    const intervalId = setInterval(fetchAnalytics, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Socket.IO for live packets
  useEffect(() => {
    const socket = io('http://localhost:8000');
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('live_packet', (packet) => {
      // Update Live Table
      setLivePackets(prev => [packet, ...prev].slice(0, 10));

      // Update Live Chart
      setChartData(prev => {
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        let last = prev.length > 0 ? prev[prev.length - 1] : null;
        
        if (last && last.time === now) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, size: last.size + packet.size };
          return updated;
        } else {
          return [...prev, { time: now, size: packet.size }].slice(-15);
        }
      });
    });

    return () => socket.disconnect();
  }, []);

  // Apply theme class to HTML root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background p-6 transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">NetVision AI</h1>
            <p className="text-sm text-text-muted">Intelligent Network Monitoring & Threat Detection</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full bg-surface border border-border text-text-muted hover:text-text-main transition-colors shadow-sm cursor-pointer"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-border shadow-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-danger'}`}></div>
            <span className="text-sm font-medium text-text-main">{isConnected ? 'Live Stream Active' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column - Key Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-md transition-colors duration-300 hover:border-primary/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Wifi className="text-secondary w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-main">Total Packets</h3>
            </div>
            <p className="text-4xl font-bold text-text-main">{analytics.total_packets.toLocaleString()}</p>
            <p className="text-xs text-text-muted mt-2">At {analytics.packets_per_second} packets/sec</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-md transition-colors duration-300 hover:border-danger/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-danger/20 rounded-lg">
                <Shield className="text-danger w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-main">Total Traffic</h3>
            </div>
            <p className="text-4xl font-bold text-text-main">{(analytics.total_bytes / 1024).toFixed(2)}</p>
            <p className="text-xs text-text-muted mt-2">Kilobytes Processed</p>
          </div>
          
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-md bg-gradient-to-br from-surface to-primary/5 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Zap className="text-primary w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-main">AI Insights</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Analyzing traffic patterns to detect DDoS and Port Scan anomalies.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Model Training Pending
            </div>
          </div>
        </div>

        {/* Center & Right Columns */}
        <div className="lg:col-span-3 space-y-6">
          
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
            
            {/* Deep Packet Inspector */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col h-64 overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                 <Eye className="w-5 h-5 text-secondary" />
                 <h3 className="font-semibold text-text-main">Live Packet Inspector</h3>
               </div>
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <div className="space-y-2">
                   {livePackets.length === 0 && <p className="text-sm text-text-muted">Waiting for packets...</p>}
                   {livePackets.map((pkt, idx) => (
                     <div key={idx} className="text-xs flex justify-between items-center p-2 rounded-lg bg-background border border-border/50">
                       <span className={`font-mono font-medium px-2 py-0.5 rounded ${pkt.protocol === 'TCP' ? 'bg-blue-500/10 text-blue-500' : pkt.protocol === 'UDP' ? 'bg-orange-500/10 text-orange-500' : 'bg-gray-500/10 text-gray-500'}`}>
                         {pkt.protocol}
                       </span>
                       <span className="text-text-muted font-mono truncate max-w-[120px]">{pkt.src_ip}</span>
                       <span className="text-text-muted">→</span>
                       <span className="text-text-muted font-mono truncate max-w-[120px]">{pkt.dst_ip}</span>
                       <span className="text-text-main font-medium">{pkt.size}B</span>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            {/* Future Feature: Threat Map */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col justify-center items-center text-center h-64 transition-all hover:shadow-lg">
               <AlertTriangle className="w-8 h-8 text-danger/70 mb-3" />
               <h3 className="font-semibold text-text-main">Global Threat Map</h3>
               <p className="text-xs text-text-muted mt-1">Coming in Stage 4</p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
