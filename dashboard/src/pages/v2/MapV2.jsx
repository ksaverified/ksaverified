import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { ExternalLink, Filter, Eye, MousePointer2, Map } from 'lucide-react';
import V2Shell from './V2Shell';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7a7a8a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2e' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3240' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a4155' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#4a5568' }, { weight: 0.5 }] },
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
            <div className="p-6 h-screen flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Map className="w-6 h-6 text-indigo-400" /> Map View
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{leads.length} leads plotted across Riyadh</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[
                            { key: 'all', label: 'All', icon: Filter },
                            { key: 'viewed', label: 'Viewed', icon: Eye },
                            { key: 'engaged', label: 'Engaged', icon: MousePointer2 },
                        ].map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all
                                    ${filter === f.key ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                                <f.icon className="w-3.5 h-3.5" /> {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 rounded-xl overflow-hidden border border-zinc-800 relative min-h-[500px]">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
                            <span className="text-zinc-400 animate-pulse text-sm">Loading map data...</span>
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
                                    <div className="p-3 bg-zinc-900 text-zinc-200 min-w-[200px] rounded-lg border border-zinc-700">
                                        <h3 className="font-bold text-sm mb-1">{selected.name}</h3>
                                        <p className="text-xs text-zinc-500 mb-3 truncate max-w-[240px]">{selected.address}</p>
                                        <div className="flex gap-4 mb-3 bg-zinc-800/60 p-2 rounded-lg">
                                            <div className="text-center">
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Views</p>
                                                <p className="text-sm font-black text-blue-400">{selected.views || 0}</p>
                                            </div>
                                            <div className="w-px bg-zinc-700" />
                                            <div className="text-center">
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Logins</p>
                                                <p className="text-sm font-black text-emerald-400">{selected.login_count || 0}</p>
                                            </div>
                                            <div className="w-px bg-zinc-700" />
                                            <div className="text-center">
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Status</p>
                                                <p className="text-[10px] font-bold text-zinc-300 uppercase">{selected.status}</p>
                                            </div>
                                        </div>
                                        {selected.vercel_url && (
                                            <a href={selected.vercel_url} target="_blank" rel="noreferrer"
                                                className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg w-full transition-all">
                                                <ExternalLink className="w-3.5 h-3.5" /> View Site
                                            </a>
                                        )}
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
