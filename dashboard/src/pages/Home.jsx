import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Globe2, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-surface p-6 rounded-2xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-colors"
    >
        <div className={`p-4 rounded-xl \${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 \${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-sm text-zinc-400 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1">{value}</h3>
        </div>
    </motion.div>
);

export default function Home() {
    const [stats, setStats] = useState({ scouted: 0, created: 0, published: 0, pitched: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        // Subscribe to realtime updates
        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchStats)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function fetchStats() {
        try {
            const { data, error } = await supabase.from('leads').select('status');
            if (error) throw error;

            const counts = data.reduce((acc, lead) => {
                acc[lead.status] = (acc[lead.status] || 0) + 1;
                return acc;
            }, { scouted: 0, created: 0, published: 0, pitched: 0, error: 0 });

            setStats(counts);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="text-zinc-400 animate-pulse">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-zinc-100">Overview</h1>
                <p className="text-zinc-400 mt-1">Real-time metrics for your drop servicing pipeline.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard delay={0.1} title="Leads Scouted" value={stats.scouted + stats.created + stats.published + stats.pitched} icon={Users} color="bg-blue-500" />
                <StatCard delay={0.2} title="Websites Created" value={stats.created + stats.published + stats.pitched} icon={Globe2} color="bg-purple-500" />
                <StatCard delay={0.3} title="Sites Published" value={stats.published + stats.pitched} icon={CheckCircle} color="bg-emerald-500" />
                <StatCard delay={0.4} title="Pitches Sent" value={stats.pitched} icon={Clock} color="bg-amber-500" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-8 bg-surface rounded-2xl border border-zinc-800 p-8 text-center"
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Globe2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">Pipeline Active</h2>
                <p className="text-zinc-400 max-w-lg mx-auto mt-2">
                    Your agents are currently monitoring Google Places, generating HTML via Gemini, deploying to Vercel, and closing clients via WhatsApp.
                </p>
            </motion.div>
        </div>
    );
}
