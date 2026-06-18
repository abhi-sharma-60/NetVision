import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, ShieldAlert, ArrowRightLeft, Clock, Database, Globe, Search, Filter } from 'lucide-react';
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

export default function TrafficMonitor() {
  const { livePackets, threatAlerts } = useOutletContext();
  const suspiciousIps = new Set(threatAlerts?.map(alert => alert.src_ip) || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredPackets = livePackets.filter(pkt => {
    if (searchTerm && !pkt.src_ip.toLowerCase().includes(searchTerm.toLowerCase()) && !pkt.dst_ip.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (protocolFilter !== 'All' && pkt.protocol !== protocolFilter) return false;
    
    const isSuspicious = suspiciousIps.has(pkt.src_ip);
    if (statusFilter === 'Suspicious' && !isSuspicious) return false;
    if (statusFilter === 'Safe' && isSuspicious) return false;
    
    return true;
  });

  const getProtocolColor = (protocol) => {
    switch(protocol) {
      case 'TCP': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'UDP': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'DNS': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'HTTPS': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'ICMP': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <motion.div 
      className="space-y-6 max-w-[1600px] mx-auto px-8 pt-8 pb-24 h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-light text-text-main tracking-tight">Traffic <span className="font-semibold text-primary">Monitor</span></h2>
        <p className="text-sm text-text-muted mt-1">Real-time deep packet inspection and bandwidth monitoring.</p>
      </motion.div>

      {/* Main Table Container */}
      <motion.div variants={itemVariants} className="glass-panel rounded-3xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
        
        {/* Table Header Area & Filters */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
               <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-main tracking-wide">Live Intercept Stream</h3>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-text-muted font-mono uppercase tracking-widest font-bold">Capturing</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search IPs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/50 border border-border focus:border-primary/50 text-sm text-text-main rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all placeholder:text-text-muted/50 focus:bg-background"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-3 border border-border bg-background/50 rounded-xl p-1.5 w-full sm:w-auto overflow-x-auto custom-scrollbar">
              <div className="flex items-center px-2">
                <Filter className="w-4 h-4 text-text-muted" />
              </div>
              <select 
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
                className="bg-transparent text-sm text-text-main py-1 px-2 outline-none cursor-pointer border-r border-border pr-4 appearance-none"
              >
                <option value="All">All Protocols</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="DNS">DNS</option>
                <option value="HTTPS">HTTPS</option>
                <option value="HTTP">HTTP</option>
                <option value="ICMP">ICMP</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-text-main py-1 px-2 outline-none cursor-pointer appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Safe">Safe</option>
                <option value="Suspicious">Suspicious</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-surface/80 backdrop-blur-md z-10 text-[10px] uppercase tracking-widest text-text-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> Timestamp</div></th>
                <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5"/> Source Origin</div></th>
                <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-2"><ArrowRightLeft className="w-3.5 h-3.5"/> Destination Target</div></th>
                <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5"/> Protocol</div></th>
                <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-2"><Database className="w-3.5 h-3.5"/> Payload Size</div></th>
                <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5"/> Security Status</div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted opacity-50">
                       <Filter className="w-12 h-12 mb-4" />
                       <span className="text-sm uppercase tracking-widest font-semibold">No packets match filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    key={`${pkt.timestamp}-${idx}`} 
                    className="group hover:bg-primary/5 transition-colors cursor-default"
                  >
                    <td className="px-6 py-4 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {new Date(pkt.timestamp * 1000).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text-main group-hover:text-primary transition-colors">
                      {pkt.src_ip} <span className="text-text-muted/40 ml-1">:{pkt.src_port || '*'}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text-main group-hover:text-purple-400 transition-colors">
                      {pkt.dst_ip} <span className="text-text-muted/40 ml-1">:{pkt.dst_port || '*'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getProtocolColor(pkt.protocol)}`}>
                        {pkt.protocol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted font-mono text-xs">
                      {pkt.size} B
                    </td>
                    <td className="px-6 py-4">
                      {suspiciousIps.has(pkt.src_ip) ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-widest border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                          Suspicious
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                          Safe
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border bg-surface/50 text-[10px] uppercase tracking-widest font-bold text-text-muted text-right">
          Displaying <span className="text-primary mx-1">{filteredPackets.length}</span> recent packets
        </div>

      </motion.div>
    </motion.div>
  );
}
