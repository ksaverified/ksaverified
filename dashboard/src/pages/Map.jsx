import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { ExternalLink, Users } from 'lucide-react';

// Using the same Google Places API key from the backend environment
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

// Component to auto-fit map bounds
const MapUpdater = ({ leads }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || leads.length === 0) return;

        // Calculate bounds to fit all markers
        const bounds = new window.google.maps.LatLngBounds();
        leads.forEach(lead => {
            const lat = parseFloat(lead.lat);
            const lng = parseFloat(lead.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                bounds.extend({ lat, lng });
            }
        });

        map.fitBounds(bounds, { padding: 80 });

        // Add semantic listener to enforce a sensible max zoom
        // If there's only 1 dot, fitBounds will zoom in extremely close.
        window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            if (map.getZoom() > 14) {
                map.setZoom(14);
            }
        });

    }, [map, leads]);

    return null;
};

export default function MapView() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);

    // Default center to Riyadh, Saudi Arabia
    const defaultCenter = { lat: 24.7136, lng: 46.6753 };

    useEffect(() => {
        fetchLeads();

        const channel = supabase
            .channel('public:leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function fetchLeads() {
        try {
            // We only need leads that have lat/lng
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .not('lat', 'is', null)
                .not('lng', 'is', null);

            if (error) throw error;
            setLeads(data);
        } catch (error) {
            console.error('Error fetching leads for map:', error);
        } finally {
            setLoading(false);
        }
    }

    const getMarkerColor = (status) => {
        // Tailwind hex codes matching the Pipeline colors
        const colors = {
            scouted: '#3b82f6', // blue-500
            created: '#a855f7', // purple-500
            published: '#f59e0b', // amber-500
            pitched: '#10b981', // emerald-500
            completed: '#6366f1', // indigo-500
            error: '#ef4444', // red-500
        };
        return colors[status] || '#71717a'; // zinc-500
    };

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="flex h-full items-center justify-center p-8 bg-surface border border-zinc-800 rounded-2xl">
                <div className="text-center text-zinc-500">
                    <p className="mb-2">Google Maps API Key missing.</p>
                    <p className="text-sm">Please add VITE_GOOGLE_PLACES_API_KEY to your dashboard/.env file.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] min-h-[600px] flex flex-col space-y-6">
            <header className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100">Global Pipeline</h1>
                    <p className="text-zinc-400 mt-1">Geographic overview of all scaffolded leads.</p>
                </div>
                <div className="flex bg-surface border border-zinc-800 rounded-lg p-2 gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Scouted
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                        <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div> Created
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div> Published
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Pitched
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div> Completed
                    </div>
                </div>
            </header>

            <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-800 shrink-0 shadow-xl relative bg-zinc-900/50">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
                        <div className="animate-pulse text-zinc-400 font-medium">Loading map data...</div>
                    </div>
                )}
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        defaultCenter={defaultCenter}
                        defaultZoom={6}
                        mapId="drop_servicing_pipeline_map"
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true,
                            styles: [
                                // Standard dark theme colors
                                { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
                                { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
                                { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },

                                // Hide ALL Points of Interest (Clutter)
                                { "featureType": "poi", "stylers": [{ "visibility": "off" }] },

                                // Hide ALL transit lines/stations (Clutter)
                                { "featureType": "transit", "stylers": [{ "visibility": "off" }] },

                                // Clean up Administrative boundaries / localities
                                { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#d59563" }, { "weight": 0.5 }] },

                                // Keep roads visible but very subtle
                                { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
                                { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
                                { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
                                { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
                                { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
                                { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },

                                { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
                                { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
                                { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
                            ]
                        }}
                    >
                        <MapUpdater leads={leads} />

                        {leads.map(lead => {
                            const lat = parseFloat(lead.lat);
                            const lng = parseFloat(lead.lng);
                            if (isNaN(lat) || isNaN(lng)) return null;

                            return (
                                <AdvancedMarker
                                    key={lead.place_id}
                                    position={{ lat, lng }}
                                    onClick={() => setSelectedLead(lead)}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                                        style={{
                                            backgroundColor: getMarkerColor(lead.status),
                                            boxShadow: `0 0 10px ${getMarkerColor(lead.status)}80`
                                        }}
                                    />
                                </AdvancedMarker>
                            );
                        })}

                        {selectedLead && (
                            <InfoWindow
                                position={{ lat: selectedLead.lat, lng: selectedLead.lng }}
                                onCloseClick={() => setSelectedLead(null)}
                                className="!p-0 !bg-surface"
                            >
                                <div className="p-4 bg-surface text-zinc-200 border border-zinc-800 rounded-lg min-w-[200px] shadow-2xl">
                                    <h3 className="font-bold text-lg mb-1">{selectedLead.name}</h3>
                                    <div className="text-xs text-zinc-400 mb-2 truncate max-w-[250px]">{selectedLead.address}</div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: getMarkerColor(selectedLead.status) }}></span>
                                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-300">{selectedLead.status}</span>
                                    </div>

                                    {selectedLead.vercel_url && (
                                        <a
                                            href={selectedLead.vercel_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" /> View Site
                                        </a>
                                    )}
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </APIProvider>
            </div>
        </div >
    );
}
