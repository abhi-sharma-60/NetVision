import React, { useState, useEffect } from 'react';
import { Server, Monitor, Smartphone, Router, ShieldAlert, Cpu, HardDrive, Search } from 'lucide-react';

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

    if (lVendor.includes('apple') || lVendor.includes('samsung') || lName.includes('iphone') || lName.includes('ipad')) return <Smartphone className="w-8 h-8 text-blue-400" />;
    if (lVendor.includes('cisco') || lVendor.includes('netgear') || lName.includes('router') || lName.includes('gateway')) return <Router className="w-8 h-8 text-green-400" />;
    if (lName.includes('macbook') || lName.includes('pc') || lName.includes('desktop')) return <Monitor className="w-8 h-8 text-purple-400" />;
    if (lVendor.includes('private') || lVendor.includes('random')) return <ShieldAlert className="w-8 h-8 text-yellow-400" />;
    
    return <Server className="w-8 h-8 text-text-muted" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Network Devices</h2>
          <p className="text-sm text-text-muted mt-1">Real-time deep packet inspection & ARP mapping</p>
        </div>
        <button 
          onClick={fetchDevices}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Search className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning Subnet...' : 'Rescan Network'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="text-sm text-text-muted mb-2">Total Devices Discovered</div>
          <div className="text-3xl font-bold text-text-main">{devices.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="text-sm text-text-muted mb-2">Active Scanning Mode</div>
          <div className="text-lg font-medium text-green-400">DPI + Scapy ARP</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="text-sm text-text-muted mb-2">Last Scan</div>
          <div className="text-lg font-medium text-text-main">{lastScan || 'Pending'}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-xs uppercase tracking-wider text-text-muted font-semibold">
                <th className="px-6 py-4">Device Name</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">MAC Address</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {devices.map((device, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-lg border border-border group-hover:border-primary/30 transition-colors">
                        {getDeviceIcon(device.vendor, device.name)}
                      </div>
                      <span className="font-semibold text-text-main">{device.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-text-main">{device.ip}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-text-muted">{device.mac}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-muted">{device.vendor}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      Online
                    </span>
                  </td>
                </tr>
              ))}
              
              {devices.length === 0 && !isScanning && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted">
                    <Server className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No devices discovered. Click Rescan Network.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
