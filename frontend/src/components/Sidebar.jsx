import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Database, ShieldAlert, Settings, Share2, Map as MapIcon } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Traffic Monitor', path: '/monitor', icon: Activity },
    { name: 'Network Topology', path: '/topology', icon: Share2 },
    { name: 'Geo-Intelligence', path: '/geo', icon: MapIcon },
    { name: 'Database', path: '/database', icon: Database },
    { name: 'Security Center', path: '/threats', icon: ShieldAlert },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border h-full flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/20 rounded-xl">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main tracking-tight leading-none">NetVision AI</h1>
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">Enterprise</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 px-3">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
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

      {/* Profile / Bottom */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-main truncate">Admin User</p>
            <p className="text-xs text-text-muted truncate">Security Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
