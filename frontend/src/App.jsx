import React, { useState, useEffect } from 'react';
import { Activity, Shield, Wifi, Server, Moon, Sun, AlertTriangle, Eye, Zap } from 'lucide-react';

function App() {
  const [isDark, setIsDark] = useState(false); // Default to light mode
  const [analytics, setAnalytics] = useState({
    total_packets: 0,
    total_bytes: 0,
    packets_per_second: 0,
    protocols: {}
  });

  // Fetch analytics overview periodically
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/analytics/overview');
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics. Make sure the backend is running.", error);
      }
    };

    // Poll every 2 seconds
    const intervalId = setInterval(fetchAnalytics, 2000);
    return () => clearInterval(intervalId);
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
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-text-main">System Online</span>
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
          
          {/* Future Feature: AI Insights (Placeholder) */}
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
          
          {/* Main Chart Placeholder */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-md min-h-[350px] flex items-center justify-center relative overflow-hidden group">
            {/* Subtle grid background pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-main) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="text-center relative z-10">
              <Activity className="w-16 h-16 text-text-muted mx-auto mb-4 group-hover:text-primary transition-colors duration-500" />
              <h2 className="text-xl font-medium text-text-main">Live Network Traffic</h2>
              <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
                Waiting for Socket.IO connection... The backend sniffer data will be visualized here in real-time.
              </p>
            </div>
          </div>

          {/* Bottom Row - Additional Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Future Feature: Threat Map */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col justify-center items-center text-center h-48 transition-all hover:shadow-lg">
               <AlertTriangle className="w-8 h-8 text-danger/70 mb-3" />
               <h3 className="font-semibold text-text-main">Global Threat Map</h3>
               <p className="text-xs text-text-muted mt-1">Coming in Stage 4</p>
            </div>

            {/* Future Feature: Live Packet Log */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-md flex flex-col justify-center items-center text-center h-48 transition-all hover:shadow-lg">
               <Eye className="w-8 h-8 text-secondary/70 mb-3" />
               <h3 className="font-semibold text-text-main">Deep Packet Inspector</h3>
               <p className="text-xs text-text-muted mt-1">Real-time table coming in Stage 2</p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
