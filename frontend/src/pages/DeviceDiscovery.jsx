import React, { useState, useEffect } from 'react';
import { Server, Monitor, Smartphone, Router, ShieldAlert, Cpu, HardDrive, Search, Activity, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function DeviceDiscovery() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  const fetchDevices = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('http://localhost:8000/api/devices/rescan');
      const data = await res.json();
      setDevices(data);
      setLastScan(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch devices", error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = (vendor, name) => {
    const lVendor = vendor.toLowerCase();
    const lName = name.toLowerCase();

    if (lVendor.includes('apple') || lVendor.includes('samsung') || lName.includes('iphone') || lName.includes('ipad')) return <Smartphone className="w-6 h-6 text-blue-400" />;
    if (lVendor.includes('cisco') || lVendor.includes('netgear') || lName.includes('router') || lName.includes('gateway')) return <Router className="w-6 h-6 text-purple-400" />;
    if (lName.includes('macbook') || lName.includes('pc') || lName.includes('desktop')) return <Monitor className="w-6 h-6 text-primary" />;
    if (lVendor.includes('private') || lVendor.includes('random')) return <ShieldAlert className="w-6 h-6 text-warning" />;
    
    return <Server className="w-6 h-6 text-text-muted" />;
  };

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
          <h2 className="text-3xl font-light text-text-main tracking-tight">Device <span className="font-semibold text-primary">Discovery</span></h2>
          <p className="text-sm text-text-muted mt-1">Real-time deep packet inspection & ARP mapping.</p>
        </div>
        <button 
          onClick={fetchDevices}
          disabled={isScanning}
          className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/30 rounded-xl transition-all font-medium text-sm shadow-[0_0_20px_rgba(59,130,246,0.15)] disabled:opacity-50 group"
        >
          <Search className={`w-4 h-4 ${isScanning ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
          {isScanning ? 'Scanning Subnet...' : 'Rescan Network'}
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
               <Cpu className="w-5 h-5" />
             </div>
             <div className="text-sm text-text-muted font-medium tracking-wide uppercase">Discovered Entities</div>
          </div>
          <div className="text-4xl font-light text-text-main tracking-tight">
            {devices.length}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500"></div>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
               <Activity className="w-5 h-5" />
             </div>
             <div className="text-sm text-text-muted font-medium tracking-wide uppercase">Scanning Engine</div>
          </div>
          <div className="text-xl font-medium text-purple-400">
            DPI + Scapy ARP
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-green-500/20 transition-colors duration-500"></div>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
               <Wifi className="w-5 h-5" />
             </div>
             <div className="text-sm text-text-muted font-medium tracking-wide uppercase">Last Sweep</div>
          </div>
          <div className="text-xl font-medium text-green-400 font-mono">
            {lastScan || 'Pending...'}
          </div>
        </motion.div>
      </div>

      {/* Main Table */}
      <motion.div variants={itemVariants} className="glass-panel rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border bg-surface/50 flex items-center justify-between">
           <h3 className="text-sm font-semibold text-text-main uppercase tracking-widest">Active Device Directory</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface/50 backdrop-blur-md text-[10px] uppercase tracking-widest text-text-muted border-b border-border">
              <tr>
                <th className="px-8 py-5 font-semibold">Device Identity</th>
                <th className="px-8 py-5 font-semibold">IP Address</th>
                <th className="px-8 py-5 font-semibold">Hardware MAC</th>
                <th className="px-8 py-5 font-semibold">Vendor Signature</th>
                <th className="px-8 py-5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {devices.map((device, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="hover:bg-primary/5 transition-colors group cursor-default"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-surface rounded-xl border border-border group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                        {getDeviceIcon(device.vendor, device.name)}
                      </div>
                      <span className="font-bold text-text-main tracking-wide group-hover:text-primary transition-colors">{device.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="font-mono text-text-main px-2 py-1 bg-surface rounded-md border border-border">{device.ip}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="font-mono text-xs text-text-muted">{device.mac}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-text-muted text-xs uppercase tracking-wider font-semibold">{device.vendor}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Online
                    </span>
                  </td>
                </motion.tr>
              ))}
              
              {devices.length === 0 && !isScanning && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <Server className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-sm uppercase tracking-widest font-semibold">No devices discovered. Initiate a network scan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
