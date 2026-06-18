import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, ShieldAlert, ArrowRightLeft, Clock, Database, Globe, Search, Filter } from 'lucide-react';

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
      case 'TCP': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'UDP': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'DNS': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'HTTPS': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'ICMP': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-main mb-2">Live Traffic Monitor</h2>
        <p className="text-text-muted">Real-time deep packet inspection and bandwidth monitoring across all network interfaces.</p>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface border border-border shadow-lg rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        
        {/* Table Header Area & Filters */}
        <div className="p-4 border-b border-border bg-surface/50 flex flex-col md:flex-row justify-between gap-4 items-center">
          <div className="flex items-center gap-3 text-sm font-medium text-text-main">
            <Activity className="w-5 h-5 text-primary" />
            <span>Intercepted Packets stream</span>
            <div className="flex items-center gap-2 text-xs ml-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-text-muted">Capturing Live</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search IPs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary/50 text-sm text-text-main rounded-lg pl-9 pr-4 py-2 outline-none transition-colors"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 border border-border bg-background rounded-lg p-1">
              <Filter className="w-4 h-4 text-text-muted ml-2" />
              <select 
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
                className="bg-transparent text-sm text-text-main py-1 px-2 outline-none cursor-pointer"
              >
                <option value="All">All Protocols</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="DNS">DNS</option>
                <option value="HTTPS">HTTPS</option>
                <option value="HTTP">HTTP</option>
                <option value="ICMP">ICMP</option>
              </select>
              <div className="w-px h-4 bg-border"></div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-text-main py-1 px-2 outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Safe">Safe</option>
                <option value="Suspicious">Suspicious</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-background/30">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface/90 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-text-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><Clock className="w-4 h-4"/> Time</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><Globe className="w-4 h-4"/> Source</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4"/> Destination</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><Activity className="w-4 h-4"/> Protocol</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><Database className="w-4 h-4"/> Size</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Status</div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-text-muted">
                    No packets match the current filters.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt, idx) => (
                  <tr 
                    key={idx} 
                    className="group hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-text-muted whitespace-nowrap">
                      {new Date(pkt.timestamp * 1000).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                    </td>
                    <td className="px-6 py-4 font-mono text-text-main">
                      {pkt.src_ip} <span className="text-text-muted/50 text-xs ml-1">:{pkt.src_port || '*'}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-text-main">
                      {pkt.dst_ip} <span className="text-text-muted/50 text-xs ml-1">:{pkt.dst_port || '*'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getProtocolColor(pkt.protocol)}`}>
                        {pkt.protocol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted font-medium">
                      {pkt.size} B
                    </td>
                    <td className="px-6 py-4">
                      {suspiciousIps.has(pkt.src_ip) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          Suspicious
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          Safe
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-border bg-surface/50 text-xs text-text-muted text-right">
          Displaying {filteredPackets.length} recent packets
        </div>

      </div>
    </div>
  );
}
