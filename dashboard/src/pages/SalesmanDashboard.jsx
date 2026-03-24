import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Camera, CheckCircle2, XCircle, Clock, Award, Star, Map as MapIcon, List, PhoneCall, Mail } from 'lucide-react';
import { APIProvider, Map, Marker, useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1c' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];

// [MODERN] Migrated to Routes API (v1) to avoid 2026 deprecation.
// We now compute the route and render it manually via Polyline.
const Directions = ({ origin, destination, onRouteFound, onError }) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const geometryLibrary = useMapsLibrary('geometry');
    const coreLibrary = useMapsLibrary('core');
    const [polyline, setPolyline] = React.useState(null);

    React.useEffect(() => {
        // [STABLE] Avoid 'google is not defined' crash by checking libraries & globals
        if (!routesLibrary || !geometryLibrary || !coreLibrary || !map || !origin || !destination) return;
        if (typeof google === 'undefined') return;

        // Cleanup existing polyline
        if (polyline) polyline.setMap(null);

        // [STABLE] Use LatLng instances from the absolute global or library
        try {
            const originLatLng = new coreLibrary.LatLng(Number(origin.lat), Number(origin.lng));
            const destLatLng = new coreLibrary.LatLng(Number(destination.lat), Number(destination.lng));

            routesLibrary.Route.computeRoutes({
                origin: { 
                    location: { latLng: originLatLng } 
                },
                destination: { 
                    location: { latLng: destLatLng } 
                },
                travelMode: 'DRIVE',
                routingPreference: 'TRAFFIC_AWARE',
                polylineQuality: 'HIGH_QUALITY'
            }).then(response => {
            const route = response.routes[0];
            if (!route) return;

            // Extract path from the encoded polyline using geometry library
            const path = geometryLibrary.encoding.decodePath(route.polyline.encodedPolyline);
            
            const newPolyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#8b5cf6',
                strokeOpacity: 0.8,
                strokeWeight: 5,
                map: map
            });

            setPolyline(newPolyline);

            // Normalize for existing UI (which expects legacy structure)
            const durationSec = parseInt(route.duration);
            const durationMin = Math.ceil(durationSec / 60);

            const normalizedRoute = {
                legs: [{
                    distance: { text: (route.distanceMeters / 1000).toFixed(1) + ' km' },
                    duration: { text: durationMin + ' mins' }
                }]
            };

            if (onRouteFound) onRouteFound(normalizedRoute);
        }).catch(e => {
            console.warn('Routes API restricted or failed. Fallback active.', e);
            if (onError) onError(e);
        });
    } catch (err) {
        console.error('Fatal Routes API Error:', err);
    }

        return () => {
            if (polyline) polyline.setMap(null);
        };
    }, [routesLibrary, geometryLibrary, map, origin, destination]);

    return null;
};

// Custom Premium Marker Pin
const PinIcon = ({ color = '#8b5cf6' }) => (
    `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 2"/>
        <path d="M20 10C15.5817 10 12 13.5817 12 18C12 24 20 30 20 30C20 30 28 24 28 18C28 13.5817 24.4183 10 20 10Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="20" cy="18" r="3" fill="white"/>
    </svg>`
);

import { supabase } from '../lib/supabase';

const SalesmanDashboard = () => {
    const navigate = useNavigate();
    const markerLibrary = useMapsLibrary('marker');
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [isVisiting, setIsVisiting] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' or 'followups'
    const [followups, setFollowups] = useState([]);
    const [isReportingPayment, setIsReportingPayment] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [directionsError, setDirectionsError] = useState(false);
    const [amountPaid, setAmountPaid] = useState('');
    const [statData] = useState({ visits: 0, pending: 0, earned: 0 });
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        document.title = 'Field Dashboard | KSA Verified';
        
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                fetchFollowups(session.user.id);
            }
        };

        const fetchFollowups = async (id) => {
            try {
                const resp = await fetch(`/api/sfa?action=get-followups&salesman_id=${id}`);
                const data = await resp.json();
                if (data.success) {
                    setFollowups(data.leads || []);
                }
            } catch (e) {
                console.error('Failed to fetch followups', e);
            }
        };
        
        initAuth();
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
        if (!userId) return;
        try {
            const resp = await fetch('/api/sfa?action=claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    place_id: lead.place_id, 
                    salesman_id: userId
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

    const handleRemotePayment = async () => {
        if (!amountPaid || Number(amountPaid) <= 0) return;
        try {
            const resp = await fetch('/api/sfa?action=report-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    place_id: selectedLead.place_id,
                    salesman_id: userId,
                    amount_paid: amountPaid
                })
            });
            const data = await resp.json();
            if (data.success) {
                setIsReportingPayment(false);
                setAmountPaid('');
                setSelectedLead(null);
                fetchFollowups(userId);
            } else {
                alert(data.error || 'Failed to report payment');
            }
        } catch(e) {
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
                    salesman_id: userId || 'default',
                    result: result,
                    amount_paid: amountPaid || 0, // Include amount_paid
                    lat: userLocation?.lat,
                    lng: userLocation?.lng
                })
            });
            const data = await resp.json();
            if (data.success) {
                setIsVisiting(false);
                setAmountPaid(''); // Reset amount
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
                    <button 
                        onClick={() => navigate('/sales/profile')}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:border-amber-500 transition-colors"
                        title="My Profile"
                    >
                        <img src="https://ui-avatars.com/api/?name=Sales+Agent&background=f59e0b&color=000" alt="Avatar" />
                    </button>
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

            {/* Tabs */}
            <div className="flex px-4 mt-2 mb-4 space-x-2">
                <button 
                    onClick={() => setActiveTab('nearby')}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'nearby' ? 'bg-brand text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    Nearby
                </button>
                <button 
                    onClick={() => setActiveTab('followups')}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'followups' ? 'bg-brand text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    Follow-Ups ({followups.length})
                </button>
            </div>

            {/* Main Feed */}
            {activeTab === 'nearby' && (
            <>
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
                                                    50% Commission
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
                            mapId="ksaverified_field_map" // Style must be controlled via Cloud Console
                            options={{ disableDefaultUI: true }}
                        >
                            {markerLibrary && userLocation && (
                                <AdvancedMarker position={userLocation} />
                            )}
 
                            {markerLibrary && leads.map(lead => {
                                const lat = parseFloat(lead.lat), lng = parseFloat(lead.lng);
                                if (isNaN(lat) || isNaN(lng)) return null;
                                return (
                                    <AdvancedMarker 
                                        key={lead.place_id} 
                                        position={{ lat, lng }}
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        <div 
                                            dangerouslySetInnerHTML={{ 
                                                __html: PinIcon({ color: '#f59e0b' }) 
                                            }} 
                                            style={{ transform: 'translate(-50%, -100%)' }}
                                        />
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
                                                    // Trigger a local retry by resetting state and switching to map
                                                    setDirectionsError(false);
                                                    setViewMode('map');
                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedLead.address)}&travelmode=driving`, '_blank');
                                                } else {
                                                    setViewMode('map');
                                                }
                                            }}
                                        >
                                            {directionsError ? <Navigation className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
                                            {directionsError ? 'Open Google Maps' : 'View Map'}
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
            </>
            )}

            {activeTab === 'followups' && (

                <div className="px-4 pb-4 space-y-4">
                    {followups.map(lead => (
                        <div key={lead.place_id} className="bg-white/[0.05] border border-white/10 p-5 rounded-3xl space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg leading-tight">{lead.name}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{lead.address}</p>
                                    <span className="inline-block px-2 py-0.5 mt-2 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider rounded-md border border-yellow-500/20">
                                        {lead.status === 'warmed' ? 'Follow Up Needed' : 'Scouted'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-3 mt-3 border-t border-white/5">
                                {lead.phone && (
                                    <a href={`tel:${lead.phone}`} className="flex-1 py-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                                        <PhoneCall className="w-4 h-4 text-brand" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Call</span>
                                    </a>
                                )}
                                <button 
                                    onClick={() => { setSelectedLead(lead); setIsReportingPayment(true); }}
                                    className="flex-[2] py-3 bg-brand/20 text-brand rounded-xl flex items-center justify-center gap-2 hover:bg-brand/30 transition-colors font-bold uppercase tracking-widest text-xs"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Customer Paid
                                </button>
                            </div>
                        </div>
                    ))}
                    {followups.length === 0 && (
                        <div className="text-center py-20 text-gray-500 text-sm">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            No follow-ups pending.
                        </div>
                    )}
                </div>
            )}

            {/* Remote Payment Modal */}
            <AnimatePresence>
                {isReportingPayment && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black p-8 flex flex-col justify-center"
                    >
                        <header className="flex justify-between items-center text-white mb-8">
                            <h2 className="text-xl font-bold">Report Payment</h2>
                            <XCircle className="w-8 h-8 opacity-50" onClick={() => setIsReportingPayment(false)} />
                        </header>

                        <div className="space-y-8 bg-zinc-900 border border-white/10 p-6 rounded-3xl">
                            <div className="text-center space-y-4">
                                <p className="text-gray-400 font-medium text-sm">Enter the amount the customer agreed to pay.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Subscription Amount (SAR)</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold text-center text-xl outline-none focus:border-brand transition-colors"
                                />
                                <p className="text-[10px] text-brand text-center mt-2 font-bold tracking-tight">Agent Commission: {amountPaid ? (Number(amountPaid) * 0.5).toFixed(2) : '0.00'} SAR</p>
                            </div>

                            <button onClick={handleRemotePayment} className="w-full py-5 bg-brand text-black font-bold rounded-2xl flex items-center justify-center gap-3">
                                <CheckCircle2 className="w-6 h-6" />
                                Submit for Verification
                            </button>
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
                            <div className="space-y-4">
                                <div className="text-center space-y-4">
                                    <div className="w-32 h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-[40px] mx-auto flex items-center justify-center">
                                        <Camera className="w-12 h-12 text-gray-600" />
                                    </div>
                                    <p className="text-gray-400 font-medium">Please take a photo of the storefront</p>
                                </div>

                                <div className="px-4">
                                    <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Subscription Amount Paid (SAR)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-white font-bold text-center text-xl outline-none focus:border-amber-500 transition-colors"
                                    />
                                    <p className="text-[10px] text-amber-500/60 text-center mt-2 font-bold tracking-tight">Agent Commission: {amountPaid ? (Number(amountPaid) * 0.5).toFixed(2) : '0.00'} SAR (50%)</p>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <button onClick={() => handleReport('success')} className="py-5 bg-emerald-500 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-6 h-6" />
                                        Pitch Successful
                                    </div>
                                    <span className="text-[10px] opacity-70 font-normal">Requires Admin Verification</span>
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
