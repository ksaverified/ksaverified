import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { ExternalLink, Filter, Eye, MousePointer2, Map } from 'lucide-react';
import V2Shell from './V2Shell';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#080a0f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#080a0f' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2d3748' }, { weight: 0.5 }] },
];

const STATUS_COLORS = {
    created: '#6366f1',
    website_created: '#8b5cf6',
    pitched: '#f59e0b',
    replied: '#3b82f6',
    interested: '#10b981',
    closed: '#22c55e',
    error: '#ef4444',
};

function MapUpdater({ leads }) {
    const map = useMap();
    useEffect(() => {
        if (!map || leads.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        leads.forEach(l => { const lat = parseFloat(l.lat), lng = parseFloat(l.lng); if (!isNaN(lat) && !isNaN(lng)) bounds.extend({ lat, lng }); });
        map.fitBounds(bounds, { padding: 80 });
        window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => { if (map.getZoom() > 14) map.setZoom(14); });
    }, [map, leads]);
    return null;
}

export default function MapV2() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchLeads();
        const ch = supabase.channel('v2:map').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads).subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    async function fetchLeads() {
        try {
            const { data } = await supabase.from('leads').select('*').not('lat', 'is', null).not('lng', 'is', null);
            if (data) setLeads(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    const visibleLeads = leads.filter(l => {
        if (filter === 'viewed') return (l.views || 0) > 0;
        if (filter === 'engaged') return (l.login_count || 0) > 0;
        return true;
    });

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <V2Shell>
                <div className="p-6 flex items-center justify-center h-96">
                    <div className="text-center text-zinc-500">
                        <Map className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">Google Maps API key not configured</p>
                        <p className="text-sm mt-1">Add VITE_GOOGLE_PLACES_API_KEY to .env</p>
                    </div>
                </div>
            </V2Shell>
        );
    }

    return (
        <V2Shell>
            <div className="p-8 h-screen flex flex-col gap-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Map className="w-6 h-6 text-amber-500" /> Geospatial Intelligence
                        </h1>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 opacity-60">Mapping {leads.length} active leads across the Riyadh Metropolitan Area</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {[
                            { key: 'all', label: 'ALL SOURCES', icon: Filter },
                            { key: 'viewed', label: 'RETARGETED', icon: Eye },
                            { key: 'engaged', label: 'ACTIVE LOGIN', icon: MousePointer2 },
                        ].map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg
                                    ${filter === f.key ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/5' : 'bg-obsidian-surface-low border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'}`}>
                                <f.icon className="w-3.5 h-3.5" /> {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-inner bg-obsidian-dark">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-obsidian-dark/95 backdrop-blur-xl">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3 opacity-40" />
                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Compiling Spatial Data...</span>
                            </div>
                        </div>
                    )}
                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                        <GoogleMap
                            defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
                            defaultZoom={11}
                            mapId="ksa_verified_v2_map"
                            options={{ mapTypeControl: false, streetViewControl: false, styles: MAP_STYLES }}
                        >
                            <MapUpdater leads={visibleLeads} />
                            {visibleLeads.map(lead => {
                                const lat = parseFloat(lead.lat), lng = parseFloat(lead.lng);
                                if (isNaN(lat) || isNaN(lng)) return null;
                                const color = STATUS_COLORS[lead.status] || '#71717a';
                                return (
                                    <AdvancedMarker key={lead.place_id} position={{ lat, lng }} onClick={() => setSelected(lead)}>
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-transform"
                                            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
                                    </AdvancedMarker>
                                );
                            })}
                            {selected && (
                                <InfoWindow position={{ lat: parseFloat(selected.lat), lng: parseFloat(selected.lng) }} onCloseClick={() => setSelected(null)}>
                                    <div className="p-4 bg-obsidian-surface-high text-white min-w-[240px] rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] to-transparent pointer-events-none" />
                                        <h3 className="text-xs font-black uppercase tracking-tight mb-1 relative z-10">{selected.name}</h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4 truncate max-w-[240px] opacity-60 relative z-10">{selected.address}</p>
                                        
                                        <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
                                            <div className="bg-obsidian-dark/50 p-2.5 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Views</p>
                                                <p className="text-xs font-black text-amber-500">{selected.views || 0}</p>
                                            </div>
                                            <div className="bg-obsidian-dark/50 p-2.5 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Logins</p>
                                                <p className="text-xs font-black text-emerald-500">{selected.login_count || 0}</p>
                                            </div>
                                            <div className="bg-obsidian-dark/50 p-2.5 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Sync</p>
                                                <div className="flex justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 relative z-10">
                                            {selected.vercel_url && (
                                                <a href={selected.vercel_url} target="_blank" rel="noreferrer"
                                                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl w-full transition-all shadow-lg active:scale-95">
                                                    <ExternalLink className="w-3.5 h-3.5" /> Teleport to Site
                                                </a>
                                            )}
                                            <button onClick={() => navigate(`/admin-v2/pipeline/${selected.place_id}`)}
                                                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-obsidian-surface-highest border border-white/10 hover:border-amber-500/50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl w-full transition-all active:scale-95">
                                                <Eye className="w-3.5 h-3.5 text-amber-500" /> Deep Profile
                                            </button>
                                        </div>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </APIProvider>
                </div>
            </div>
        </V2Shell>
    );
}
