import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { io } from 'socket.io-client';

import FloatingDock from './components/FloatingDock';
import Dashboard from './pages/Dashboard';
import TrafficMonitor from './pages/TrafficMonitor';
import ThreatDashboard from './pages/ThreatDashboard';
import TopologyMap from './pages/TopologyMap';
import GeoMap from './pages/GeoMap';
import DeviceDiscovery from './pages/DeviceDiscovery';
import CopilotWidget from './components/CopilotWidget';
function Layout({ isDark, setIsDark, isConnected }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden mesh-bg transition-colors duration-500">
      
      {/* Premium Glass Pill for Status & Controls */}
      <div className="absolute bottom-8 left-8 z-50 flex items-center gap-4 glass-panel px-4 py-2 rounded-full shadow-2xl">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`}></div>
          <span className="text-xs font-semibold text-text-main tracking-wider uppercase">{isConnected ? 'System Online' : 'Disconnected'}</span>
        </div>
        
        <div className="w-px h-4 bg-border"></div>

        <button
          onClick={() => setIsDark(!isDark)}
          className="p-1.5 rounded-full hover:bg-white/[0.05] text-text-muted hover:text-text-main transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Full-Screen Workspace */}
      <main className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <FloatingDock />

      {/* Global AI Copilot */}
      <CopilotWidget />
    </div>
  );
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [analytics, setAnalytics] = useState({
    total_packets: 0,
    total_bytes: 0,
    packets_per_second: 0,
    protocols: {}
  });

  const [livePackets, setLivePackets] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [threatAlerts, setThreatAlerts] = useState([]);
  const [threatIntel, setThreatIntel] = useState({});

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

  // Socket.IO for live packets and alerts
  useEffect(() => {
    const socket = io('http://localhost:8000');

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('live_packet', (packet) => {
      setLivePackets(prev => [packet, ...prev].slice(0, 50)); // Keep last 50 for the big table

      setChartData(prev => {
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        let last = prev.length > 0 ? prev[prev.length - 1] : null;

        if (last && last.time === now) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, size: last.size + packet.size };
          return updated;
        } else {
          return [...prev, { time: now, size: packet.size }].slice(-20);
        }
      });
    });

    socket.on('threat_alert', (alert) => {
      setThreatAlerts(prev => [alert, ...prev]);
    });

    socket.on('intel_update', (intel) => {
      setThreatIntel(prev => ({ ...prev, [intel.ip]: intel }));
    });

    return () => socket.disconnect();
  }, []);

  // Theme logic
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout isDark={isDark} setIsDark={setIsDark} isConnected={isConnected} />}>
          <Route path="/" element={<Outlet context={{ analytics, livePackets, chartData, threatAlerts, threatIntel }} />}>
            <Route index element={<Dashboard />} />
            <Route path="monitor" element={<TrafficMonitor />} />
            <Route path="topology" element={<TopologyMap />} />
            <Route path="geo" element={<GeoMap />} />
            <Route path="devices" element={<DeviceDiscovery />} />
            <Route path="threats" element={<ThreatDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
