import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { Globe, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyWebsite() {
    const { user } = useAuth();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeadData() {
            try {
                const phone = user?.user_metadata?.phone;
                if (!phone) {
                    setLoading(false);
                    return;
                }

                // Clean phone number - keep only last 9 digits for reliable match (avoids + prefix issues)
                const searchPhone = phone.replace(/\D/g, '').slice(-9);

                const { data, error } = await supabase
                    .from('leads')
                    .select('*')
                    .ilike('phone', `%${searchPhone}`)
                    .single();

                if (error) throw error;
                setLead(data);
            } catch (err) {
                console.error('Error fetching lead data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchLeadData();
    }, [user]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-zinc-500 font-medium animate-pulse tracking-wide uppercase text-xs">Loading your website preview...</p>
            </div>
        );
    }

    if (!lead || !lead.vercel_url) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-surface border border-zinc-800/60 rounded-3xl">
                <Globe className="h-16 w-16 text-zinc-700 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">No Website Found</h2>
                <p className="text-zinc-400 max-w-md">We couldn't find a website associated with your account yet. If you just registered, please wait a few minutes or contact support.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Globe className="h-8 w-8 text-blue-500" />
                        My Website
                    </h1>
                    <p className="text-zinc-500 mt-1">Preview and manage your live business site</p>
                </div>
                <a
                    href={lead.vercel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 group"
                >
                    <span>Open Live Site</span>
                    <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface border border-zinc-800/60 p-4 rounded-2xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Status</p>
                        <p className="text-lg font-bold text-emerald-100 italic capitalize">{lead.status}</p>
                    </div>
                </div>
                <div className="bg-surface border border-zinc-800/60 p-4 rounded-2xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Globe className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Business Name</p>
                        <p className="text-lg font-bold text-blue-100 truncate">{lead.name}</p>
                    </div>
                </div>
                <div className="bg-surface border border-zinc-800/60 p-4 rounded-2xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Zap className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Plan</p>
                        <p className="text-lg font-bold text-purple-100">Starter</p>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 min-h-[500px] bg-white rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative group"
            >
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <iframe
                    src={lead.vercel_url}
                    className="w-full h-full border-none"
                    title="Website Preview"
                />
            </motion.div>
        </div>
    );
}
