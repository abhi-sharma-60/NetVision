import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Globe, MapPin, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function GeoMap() {
  const { livePackets } = useOutletContext();

  const markers = useMemo(() => {
    const locations = new Map();

    livePackets.forEach(p => {
      [p.src_geo, p.dst_geo].forEach(geo => {
        if (geo && geo.lat && geo.lon) {
          const key = `${geo.lat},${geo.lon}`;
          if (!locations.has(key)) {
            locations.set(key, { ...geo, count: 0 });
          }
          locations.get(key).count++;
        }
      });
    });

    return Array.from(locations.values());
  }, [livePackets]);

  const sortedLocations = [...markers].sort((a, b) => b.count - a.count);

  return (
    <div className="absolute inset-0 overflow-hidden bg-sky-100 dark:bg-slate-900 transition-colors duration-500">
      
      {/* Background Map Canvas */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none"></div>
        <ComposableMap 
          projection="geoMercator" 
          projectionConfig={{ scale: 140 }}
          className="w-full h-full text-green-800 dark:text-emerald-950 transition-colors duration-500"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="currentColor"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#166534', outline: 'none' }, // green-800
                    pressed: { fill: '#14532d', outline: 'none' }, // green-900
                  }}
                />
              ))
            }
          </Geographies>
          
          {markers.map((marker, i) => (
            <Marker key={i} coordinates={[marker.lon, marker.lat]}>
              <circle r={10 + Math.min(marker.count * 0.8, 30)} fill="var(--color-primary)" opacity="0.3" className="animate-ping" />
              <circle r={4} fill="#ffffff" stroke="var(--color-primary)" strokeWidth={1.5} />
              <text
                textAnchor="middle"
                y={-12}
                style={{ fill: "#ffffff", fontSize: "10px", fontWeight: "600", letterSpacing: "1px", textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
              >
                {marker.country}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* Floating Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-10 glass-panel px-6 py-4 rounded-2xl pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-light text-text-main tracking-tight">Global <span className="font-semibold text-primary">Intelligence</span></h2>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-semibold">Live Threat Origins</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Statistics Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 right-8 z-10 w-80 glass-panel rounded-3xl overflow-hidden flex flex-col max-h-[calc(100vh-160px)]"
      >
        <div className="p-5 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
          <div className="flex items-center gap-2 relative z-10">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-text-main text-sm uppercase tracking-wider">Active Sectors</h3>
          </div>
          <div className="flex items-center gap-2 relative z-10">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {sortedLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
               <Activity className="w-8 h-8 text-text-muted mb-2 animate-pulse" />
               <span className="text-xs text-text-muted uppercase tracking-widest">Scanning Grid...</span>
            </div>
          ) : (
            sortedLocations.map((loc, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-default group"
              >
                <div>
                  <div className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{loc.country}</div>
                  <div className="text-xs text-text-muted">{loc.city || 'Unknown Sector'}</div>
                </div>
                <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold border border-primary/20">
                  {loc.count} tx
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

    </div>
  );
}
