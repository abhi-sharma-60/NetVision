import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Database, ShieldAlert, Settings, Share2, Map as MapIcon, Server } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Traffic Monitor', path: '/monitor', icon: Activity },
    { name: 'Network Topology', path: '/topology', icon: Share2 },
    { name: 'Geo-Intelligence', path: '/geo', icon: MapIcon },
    { name: 'Network Devices', path: '/devices', icon: Server },
    { name: 'Security Center', path: '/threats', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border h-full flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-border/50">
        <NavLink to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="p-2.5 bg-primary/20 rounded-xl group-hover:bg-primary/30 transition-colors">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main tracking-tight leading-none group-hover:text-primary transition-colors">NetVision AI</h1>
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">Enterprise</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 px-3">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-muted hover:bg-white/[0.03] dark:hover:bg-white/[0.03] hover:text-text-main'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-main'}`} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}
