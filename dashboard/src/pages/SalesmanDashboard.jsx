import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Camera, CheckCircle2, XCircle, Clock, Award, Star, Map as MapIcon, List } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1c' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];

const Directions = ({ origin, destination, onRouteFound, onError }) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = React.useState();
    const [directionsRenderer, setDirectionsRenderer] = React.useState();

    React.useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map, suppressMarkers: true }));
    }, [routesLibrary, map]);

    React.useEffect(() => {
        if (!directionsService || !directionsRenderer || !origin || !destination || !routesLibrary) return;

        directionsService.route({
            origin: origin,
            destination: destination,
            travelMode: routesLibrary.TravelMode.DRIVING,
        }).then(response => {
            directionsRenderer.setDirections(response);
            if (onRouteFound) onRouteFound(response.routes[0]);
        }).catch(e => {
            console.error('Directions request failed', e);
            if (onError) onError(e);
        });

        return () => directionsRenderer.setMap(null);
    }, [directionsService, directionsRenderer, origin, destination, routesLibrary]);

    return null;
};

const SalesmanDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [isVisiting, setIsVisiting] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [routeInfo, setRouteInfo] = useState(null);
    const [directionsError, setDirectionsError] = useState(false);
    const [statData] = useState({ visits: 0, pending: 0, earned: 0 });

    useEffect(() => {
        document.title = 'Field Dashboard | KSA Verified';
        fetchLeads();
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const resp = await fetch('/api/sfa?action=get-leads');
            const data = await resp.json();
            if (data.success) {
                setLeads(data.leads || []);
            }
        } catch (e) {
            console.error('Failed to fetch leads', e);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (lead) => {
        try {
            const resp = await fetch('/api/sfa?action=claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    place_id: lead.place_id, 
                    salesman_id: 'default' // In real app, get from auth 
                })
            });
            const data = await resp.json();
            if (data.success) {
                setSelectedLead({...lead, claimed: true});
                fetchLeads();
            } else {
                alert(data.message || 'Failed to claim lead');
            }
        } catch (e) {
            alert('Connection error');
        }
    };

    const handleReport = async (result) => {
        try {
            const resp = await fetch('/api/sfa?action=log-visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    place_id: selectedLead.place_id,
                    salesman_id: 'default',
                    result: result,
                    lat: userLocation?.lat,
                    lng: userLocation?.lng
                })
            });
            const data = await resp.json();
            if (data.success) {
                setIsVisiting(false);
                setSelectedLead(null);
                fetchLeads();
            }
        } catch (e) {
            alert('Failed to log visit');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans pb-24">
            {/* Top Bar */}
            <header className="p-4 flex justify-between items-center sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <h1 className="font-bold text-lg">Riyadh Field</h1>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Commission</p>
                        <p className="text-sm font-bold text-gold">{statData.earned} SAR</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Sales+Agent&background=8b5cf6&color=fff" alt="Avatar" />
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="p-4 grid grid-cols-3 gap-2">
                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl text-center">
                    <Clock className="w-4 h-4 text-brand mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Claimed</p>
                    <p className="font-bold">4</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl text-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Visited</p>
                    <p className="font-bold">12</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl text-center">
                    <Star className="w-4 h-4 text-gold mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Rating</p>
                    <p className="font-bold">4.9</p>
                </div>
            </div>

            {/* Main Feed */}
            <div className="px-4 pb-4">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nearby Leads</h3>
                    <button 
                        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-brand"
                    >
                        {viewMode === 'list' ? <><MapIcon className="w-3 h-3" /> Map View</> : <><List className="w-3 h-3" /> List View</>}
                    </button>
                </div>

                {viewMode === 'list' ? (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin" /></div>
                        ) : (
                            leads.map(lead => (
                                <motion.div 
                                    key={lead.place_id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedLead(lead)}
                                    className="bg-white/[0.05] border border-white/10 p-5 rounded-3xl relative overflow-hidden group"
                                >
                                    {lead.status === 'invalid' && (
                                        <div className="absolute top-4 right-4 bg-orange-500/10 text-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/20">
                                            LANDLINE GAP
                                        </div>
                                    )}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            <Award className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg leading-tight">{lead.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{lead.address}</p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <div className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-md">
                                                    50 SAR Potential
                                                </div>
                                                <span className="text-[10px] text-gray-600">•</span>
                                                <span className="text-[10px] text-gray-500 font-medium">{lead.distance || 'Calculated...'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="h-[60vh] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-inner relative group">
                        <Map
                            defaultCenter={userLocation || { lat: 24.7136, lng: 46.6753 }}
                            defaultZoom={13}
                            options={{ disableDefaultUI: true, styles: MAP_STYLES }}
                        >
                            {userLocation && (
                                <AdvancedMarker position={userLocation}>
                                    <div className="relative">
                                        <div className="w-4 h-4 bg-brand rounded-full border-2 border-white shadow-lg animate-pulse" />
                                        <div className="absolute inset-0 w-4 h-4 bg-brand rounded-full animate-ping opacity-50" />
                                    </div>
                                </AdvancedMarker>
                            )}

                            {leads.map(lead => {
                                const lat = parseFloat(lead.lat), lng = parseFloat(lead.lng);
                                if (isNaN(lat) || isNaN(lng)) return null;
                                return (
                                    <AdvancedMarker 
                                        key={lead.place_id} 
                                        position={{ lat, lng }}
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        <div className={`w-3 h-3 rounded-full border border-white/50 shadow-md transition-all duration-300 ${selectedLead?.place_id === lead.place_id ? 'scale-150 bg-brand ring-4 ring-brand/20' : 'bg-gray-400 opacity-60'}`} />
                                    </AdvancedMarker>
                                );
                            })}

                            {selectedLead && userLocation && (
                                <Directions 
                                    origin={userLocation}
                                    destination={{ lat: parseFloat(selectedLead.lat), lng: parseFloat(selectedLead.lng) }}
                                    onRouteFound={(route) => {
                                        setRouteInfo(route);
                                        setDirectionsError(false);
                                    }}
                                    onError={() => setDirectionsError(true)}
                                />
                            )}
                        </Map>
                        
                        {!userLocation && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-center p-8">
                                <p className="text-sm text-gray-400">Waiting for GPS location...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lead Selection / Action Modal */}
            <AnimatePresence>
                {selectedLead && (
                    <motion.div 
                        initial={{ y: 500 }}
                        animate={{ y: 0 }}
                        exit={{ y: 500 }}
                        className="fixed inset-x-0 bottom-0 z-50 bg-[#121215] border-t border-white/10 rounded-t-[40px] p-8 shadow-2xl"
                    >
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" onClick={() => setSelectedLead(null)} />
                        
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedLead.name}</h2>
                                <p className="text-gray-500">{selectedLead.address}</p>
                            </div>

                            {!selectedLead.claimed ? (
                                <div className="space-y-4">
                                    {routeInfo && (
                                        <div className="flex justify-between items-center px-2 py-3 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="flex items-center gap-2">
                                                <Navigation className="w-4 h-4 text-brand" />
                                                <span className="text-sm font-bold">{routeInfo.legs[0].distance.text}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">{routeInfo.legs[0].duration.text} away</span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border ${directionsError ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-white/5 border-white/10'}`}
                                            onClick={() => {
                                                if (directionsError) {
                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedLead.address)}&travelmode=driving`, '_blank');
                                                } else {
                                                    setViewMode('map');
                                                }
                                            }}
                                        >
                                            {directionsError ? <Navigation className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
                                            {directionsError ? 'External Nav' : 'View Map'}
                                        </button>
                                        <button 
                                            className="py-4 bg-brand rounded-2xl font-bold shadow-lg shadow-brand/20"
                                            onClick={() => handleClaim(selectedLead)}
                                        >
                                            Claim Lead
                                        </button>
                                    </div>
                                    {directionsError && (
                                        <p className="text-[10px] text-gray-600 text-center uppercase tracking-widest mt-2">
                                            In-App Directions Restricted. Using External Fallback.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Active Claim: 23:59 remaining</p>
                                    </div>
                                    <button 
                                        className="w-full py-5 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 text-lg"
                                        onClick={() => setIsVisiting(true)}
                                    >
                                        <Camera className="w-6 h-6" />
                                        I am at the location
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visit flow overlay */}
            <AnimatePresence>
                {isVisiting && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black p-8 flex flex-col justify-between"
                    >
                        <header className="flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold">Verifying Visit...</h2>
                            <XCircle className="w-8 h-8 opacity-50" onClick={() => setIsVisiting(false)} />
                        </header>

                        <div className="space-y-12">
                            <div className="text-center space-y-4">
                                <div className="w-32 h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-[40px] mx-auto flex items-center justify-center">
                                    <Camera className="w-12 h-12 text-gray-600" />
                                </div>
                                <p className="text-gray-400 font-medium">Please take a photo of the storefront</p>
                            </div>

                            <div className="grid gap-3">
                                <button onClick={() => handleReport('success')} className="py-5 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                    Pitch Successful
                                </button>
                                <button onClick={() => handleReport('followup')} className="py-5 bg-brand-light text-white font-bold rounded-2xl">
                                    Owner Not Present (Follow up)
                                </button>
                                <button onClick={() => handleReport('rejected')} className="py-5 bg-white/10 text-white font-bold rounded-2xl">
                                    Rejected
                                </button>
                            </div>
                        </div>

                        <div className="text-center pb-8">
                            <p className="text-[10px] text-gray-700 uppercase tracking-widest">GPS SECURED: {userLocation?.lat?.toFixed(4)}, {userLocation?.lng?.toFixed(4)}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function SalesmanDashboardWrapper() {
    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <SalesmanDashboard />
        </APIProvider>
    );
};
