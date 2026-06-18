import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Activity, Network, Map, MonitorSmartphone, ShieldAlert } from 'lucide-react';

export default function FloatingDock() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Monitor', path: '/monitor', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Topology', path: '/topology', icon: Network, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { name: 'Geo Map', path: '/geo', icon: Map, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { name: 'Devices', path: '/devices', icon: MonitorSmartphone, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Threats', path: '/threats', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.nav 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="glass-dock rounded-full px-4 py-3 flex items-center gap-2"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `relative group p-3 rounded-full transition-colors ${isActive ? item.color : `text-text-muted hover:${item.color} hover:bg-surface/50`}`
            }
          >
            {({ isActive }) => (
              <>
                <motion.div whileHover={{ scale: 1.2, y: -5 }} whileTap={{ scale: 0.9 }}>
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? '' : `group-hover:${item.color}`}`} />
                </motion.div>
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="dock-active"
                    className={`absolute inset-0 ${item.bg} rounded-full z-0`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  {item.name}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </motion.nav>
    </div>
  );
}
