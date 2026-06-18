import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Globe, MapPin } from 'lucide-react';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function GeoMap() {
  const { livePackets } = useOutletContext();

  const markers = useMemo(() => {
    const locations = new Map();

    livePackets.forEach(p => {
      // Check both source and destination for geo data
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

  // Sort by count for table
  const sortedLocations = [...markers].sort((a, b) => b.count - a.count);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-text-main mb-2">Geo-IP Intelligence</h2>
        <p className="text-text-muted">Live physical origin tracking of external network traffic.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* The Map */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-md flex flex-col overflow-hidden relative group">
          <div className="p-4 border-b border-border bg-surface/50 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-text-main">Global Traffic Map</h3>
          </div>
          <div className="flex-1 bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background"></div>
            
            <ComposableMap 
              projection="geoMercator" 
              projectionConfig={{ scale: 120 }}
              className="w-full h-full opacity-90"
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1f2937"
                      stroke="#374151"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { fill: '#374151', outline: 'none' },
                        pressed: { fill: '#4b5563', outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>
              
              {markers.map((marker, i) => (
                <Marker key={i} coordinates={[marker.lon, marker.lat]}>
                  {/* Outer glowing pulse */}
                  <circle r={8 + Math.min(marker.count * 0.5, 20)} fill="#3b82f6" opacity="0.3" className="animate-ping" />
                  {/* Inner solid dot */}
                  <circle r={4} fill="#60a5fa" stroke="#fff" strokeWidth={1} />
                  <text
                    textAnchor="middle"
                    y={-10}
                    style={{ fill: "#9ca3af", fontSize: "10px", fontWeight: "bold" }}
                  >
                    {marker.country}
                  </text>
                </Marker>
              ))}
            </ComposableMap>
            
            {markers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-text-muted text-sm bg-surface/80 px-4 py-2 rounded-full border border-border/50 backdrop-blur-sm">
                  Awaiting external traffic...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Traffic Origins Table */}
        <div className="bg-surface rounded-2xl border border-border shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold text-text-main">Top Origins</h3>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-2">
             {sortedLocations.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-text-muted text-sm py-10">No geo-data yet.</div>
             ) : (
                <div className="space-y-2">
                    {sortedLocations.map((loc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-border transition-colors">
                            <div>
                                <div className="text-sm font-bold text-text-main">{loc.country}</div>
                                <div className="text-xs text-text-muted">{loc.city || 'Unknown City'}</div>
                            </div>
                            <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-bold border border-blue-500/20">
                                {loc.count} pkts
                            </div>
                        </div>
                    ))}
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
