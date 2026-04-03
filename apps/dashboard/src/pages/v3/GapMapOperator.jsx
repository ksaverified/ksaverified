import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Globe, Star, MapPin, Activity, Navigation } from 'lucide-react';

const MAP_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

export default function GapMapOperator() {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);

    // Default center to Riyadh, KSA
    const defaultCenter = { lat: 24.7136, lng: 46.6753 };

    useEffect(() => {
        const fetchLeads = async () => {
            const { data } = await supabase.from('leads').select('*');
            if (data) {
                // Filter leads that have lat/lng
                const validLeads = data.filter(l => l.metadata && l.metadata.location && l.metadata.location.lat && l.metadata.location.lng);
                setLeads(validLeads);
            }
            setLoading(false);
        };
        fetchLeads();
    }, []);

    // Helper to calculate a rough score based on missing items to colorize pins
    const calculateGapScore = (lead) => {
        let score = 100;
        if (!lead.website) score -= 30;
        if ((lead.rating || 0) < 4.0) score -= 20;
        if ((lead.review_count || 0) < 10) score -= 20;
        if (!lead.phone_number) score -= 30;
        return score;
    };

    const getPinColor = (score) => {
        if (score >= 80) return '#10b981'; // Green (Good)
        if (score >= 50) return '#f59e0b'; // Yellow (Needs Work)
        return '#ef4444'; // Red (High Gap - Prime Target!)
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-zinc-500 animate-pulse font-bold tracking-widest uppercase">Loading Map Radar...</div>
            </div>
        );
    }

    if (!MAP_API_KEY) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-red-500 font-bold uppercase p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                    Map API Key Missing
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            <APIProvider apiKey={MAP_API_KEY}>
                <Map
                    defaultCenter={leads.length > 0 ? { lat: leads[0].metadata.location.lat, lng: leads[0].metadata.location.lng } : defaultCenter}
                    defaultZoom={11}
                    mapId="KSA_VERIFIED_MAP_ID"
                    disableDefaultUI={true}
                    className="w-full h-full"
                >
                    {leads.map(lead => {
                        const score = calculateGapScore(lead);
                        const pos = { lat: lead.metadata.location.lat, lng: lead.metadata.location.lng };
                        return (
                            <AdvancedMarker
                                key={lead.place_id}
                                position={pos}
                                onClick={() => setSelectedLead(lead)}
                            >
                                <Pin 
                                    background={getPinColor(score)} 
                                    borderColor="#000000" 
                                    glyphColor="#ffffff" 
                                />
                            </AdvancedMarker>
                        );
                    })}
                </Map>
            </APIProvider>

            {/* Floating UI overlay for the selected lead */}
            {selectedLead && (
                <div className="absolute top-6 left-6 w-96 glass-card rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl bg-[#0a0a0c]/80 animate-in fade-in slide-in-from-left-4 duration-300">
                    <button 
                        onClick={() => setSelectedLead(null)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                    
                    <div className="mb-4">
                        <h2 className="text-xl font-black text-white leading-tight">{selectedLead.name}</h2>
                        <p className="text-xs text-zinc-400 mt-1">{selectedLead.address}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <Globe className={`w-4 h-4 ${selectedLead.website ? 'text-emerald-500' : 'text-red-500'}`} />
                                <span className="text-xs font-bold text-zinc-200">Website</span>
                            </div>
                            <span className="text-xs font-bold">{selectedLead.website ? 'Present' : 'Missing'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <Star className={`w-4 h-4 ${selectedLead.rating >= 4.0 ? 'text-amber-500' : 'text-red-500'}`} />
                                <span className="text-xs font-bold text-zinc-200">Reviews & Rating</span>
                            </div>
                            <span className="text-xs font-bold">{selectedLead.rating || 'N/A'} ({selectedLead.review_count || 0})</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <Activity className={`w-4 h-4 ${calculateGapScore(selectedLead) < 60 ? 'text-red-500' : 'text-emerald-500'}`} />
                                <span className="text-xs font-bold text-zinc-200">Digital Grade</span>
                            </div>
                            <span className="text-xs font-black text-indigo-400">{calculateGapScore(selectedLead)}/100</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                            Pitch Upgrade
                        </button>
                        <button className="flex-1 py-3 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors border border-white/5">
                            View Website
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
