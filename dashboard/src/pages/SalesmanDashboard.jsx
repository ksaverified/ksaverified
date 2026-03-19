import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Camera, CheckCircle2, XCircle, Clock, Award, Star } from 'lucide-react';

const SalesmanDashboard = () => {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [isVisiting, setIsVisiting] = useState(false);
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
            <div className="px-4 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Nearby Leads</h3>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        className="py-4 bg-white/5 rounded-2xl font-bold flex items-center justify-center gap-2"
                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedLead.address)}`)}
                                    >
                                        <Navigation className="w-5 h-5" />
                                        Navigate
                                    </button>
                                    <button 
                                        className="py-4 bg-brand rounded-2xl font-bold"
                                        onClick={() => handleClaim(selectedLead)}
                                    >
                                        Claim Lead
                                    </button>
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

export default SalesmanDashboard;
