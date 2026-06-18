import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Globe, Map, ShieldAlert, Cpu } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: <Activity className="w-6 h-6 text-blue-500" />, title: "Traffic Monitoring", desc: "Real-time analysis of packet flow and bandwidth utilization." },
    { icon: <ShieldAlert className="w-6 h-6 text-red-500" />, title: "Threat Intelligence", desc: "AI-driven detection of malicious activities and anomalies." },
    { icon: <Map className="w-6 h-6 text-green-500" />, title: "Topology Mapping", desc: "Interactive visualization of your network infrastructure." },
    { icon: <Globe className="w-6 h-6 text-emerald-500" />, title: "Global Intelligence", desc: "Geospatial tracking of traffic origins and threats." },
    { icon: <Cpu className="w-6 h-6 text-purple-500" />, title: "Device Discovery", desc: "Automated identification and profiling of connected assets." }
  ];

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-20 px-4 relative z-10 mt-10">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto mb-20 mt-10"
      >
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          Next-Generation Security Platform
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-main via-primary to-blue-600 mb-6 tracking-tighter drop-shadow-sm">
          NetVision AI
        </h1>
        <p className="text-lg md:text-2xl text-text-muted font-light max-w-2xl mx-auto leading-relaxed">
          Intelligent Network Monitoring & Threat Detection Platform built for the modern infrastructure.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="mt-12 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-lg flex items-center gap-3 mx-auto shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_40px_rgba(59,130,246,0.6)] transition-all group"
        >
          Enter Dashboard 
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full pb-32">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (idx * 0.1) }}
            className="glass-panel p-6 rounded-3xl group hover:bg-white/5 transition-colors border border-transparent hover:border-border"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-text-main mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-text-muted leading-relaxed font-light">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
