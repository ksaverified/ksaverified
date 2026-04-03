import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Check, X } from 'lucide-react';

export default function LeadsMap({ leads, loading }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredLead, setHoveredLead] = useState(null);

  // Derive unique statuses for the filter
  const statuses = useMemo(() => {
    const s = new Set();
    leads.forEach(l => {
      if (l.status) s.add(l.status);
    });
    return ['all', ...Array.from(s).sort()];
  }, [leads]);

  // Filter leads handling coords
  const visibleLeads = useMemo(() => {
    return leads.filter(l => {
      if (!l.lat || !l.lng) return false;
      if (activeFilter !== 'all' && l.status !== activeFilter) return false;
      return true;
    });
  }, [leads, activeFilter]);

  const mapCenter = { lat: 24.7136, lng: 46.6753 }; // Riyadh default

  const getPinColor = (status) => {
    switch (status) {
      case 'published': return '#10B981'; // emerald
      case 'scouted': return '#6366F1'; // indigo
      case 'pitched': return '#F59E0B'; // amber
      case 'invalid': return '#EF4444'; // red
      case 'created':
      case 'retouched': return '#3B82F6'; // blue
      default: return '#71717A'; // zinc
    }
  };

  const safeParseJSON = (str) => {
    if (!str) return {};
    if (typeof str === 'object') return str;
    try { return JSON.parse(str); } catch (e) { return {}; }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col">
      {/* Filters Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
              activeFilter === status 
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={11}
            mapId="MANAGEMENT_MAP_ID"
            disableDefaultUI={true}
            className="w-full h-full"
          >
            {visibleLeads.map((lead) => {
              const color = getPinColor(lead.status);
              return (
                <AdvancedMarker
                  key={lead.place_id}
                  position={{ lat: parseFloat(lead.lat), lng: parseFloat(lead.lng) }}
                  onMouseEnter={() => setHoveredLead(lead)}
                  onMouseLeave={() => setHoveredLead(null)}
                  onClick={() => window.open(`/admin-v2/pipeline/${lead.place_id}`, '_blank')}
                >
                  <Pin background={color} borderColor="#000" glyphColor="#fff" scale={0.8} />
                </AdvancedMarker>
              );
            })}

            {/* Hover Tooltip via InfoWindow */}
            {hoveredLead && (
              <InfoWindow
                position={{ lat: parseFloat(hoveredLead.lat), lng: parseFloat(hoveredLead.lng) }}
                onCloseClick={() => setHoveredLead(null)}
                pixelOffset={[0, -30]}
              >
                <div className="w-64 bg-zinc-900 border border-zinc-700 p-3 rounded shadow-2xl z-50">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-sm font-bold text-white leading-tight truncate pr-2">{hoveredLead.name}</h3>
                     <span className="text-[10px] uppercase font-bold bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                       {hoveredLead.status}
                     </span>
                  </div>
                  
                  <p className="text-xs text-zinc-400 mb-3 truncate">
                    {hoveredLead.industry || (hoveredLead.types && hoveredLead.types[0]) || 'Business Sector'}
                  </p>

                  {/* Gap Analysis */}
                  <div className="space-y-1 mb-3">
                     <div className="text-[10px] font-semibold text-zinc-500 uppercase">Gap Analysis</div>
                     <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                       <div className="flex items-center gap-1">
                         <span className={hoveredLead.website ? "text-emerald-400" : "text-red-400"}>
                           {hoveredLead.website ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                         </span>
                         <span className="text-zinc-300">Website</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span className={hoveredLead.phone ? "text-emerald-400" : "text-red-400"}>
                           {hoveredLead.phone ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                         </span>
                         <span className="text-zinc-300">Phone</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span className={hoveredLead.rating >= 4.0 ? "text-emerald-400" : "text-red-400"}>
                           {hoveredLead.rating >= 4.0 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                         </span>
                         <span className="text-zinc-300">High Rating</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span className={safeParseJSON(hoveredLead.map_gap_analysis)?.photos_count > 5 ? "text-emerald-400" : "text-amber-400"}>
                           {safeParseJSON(hoveredLead.map_gap_analysis)?.photos_count > 5 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                         </span>
                         <span className="text-zinc-300">Photos &gt; 5</span>
                       </div>
                     </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Lead Score</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-indigo-400">
                        {hoveredLead.conversion_score || hoveredLead.audit_score || hoveredLead.seo_score || '--'}
                      </span>
                      <span className="text-xs text-zinc-500">/100</span>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      )}
    </div>
  );
}
