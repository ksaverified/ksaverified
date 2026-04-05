import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LeadsMap from '../../components/management/LeadsMap';
import { Map as MapIcon } from 'lucide-react';

export default function GlobalSignalMap() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeads() {
            setLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) setLeads(data || []);
            setLoading(false);
        }
        fetchLeads();
    }, []);

    return (
        <div className="h-full flex flex-col pt-2 animate-in fade-in duration-700">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col flex-1 min-h-[85vh]">
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <MapIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Global Signal Scoping</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Real-time Topographic Distribution</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 mr-3 opacity-80">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-7 w-7 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-500">A{i}</div>
                            ))}
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-black/40 border border-zinc-800 text-xs font-mono text-emerald-400 shadow-inner">
                            Tracking {leads.length} Signals
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <LeadsMap leads={leads} loading={loading} />
                </div>
            </section>
        </div>
    );
}
