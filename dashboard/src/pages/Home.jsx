import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import {
    Users, Globe2, MessageSquare, TrendingUp,
    MessageCircle, Activity, ChevronRight,
    Radio, Zap, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// ─── Sub-components ──────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const KpiCard = ({ title, value, icon: CardIcon, accent, sub, delay, linkTo }) => {
    const card = (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35 }}
            className={`relative bg-surface rounded-2xl border border-zinc-800 p-5 flex flex-col gap-3 hover:border-zinc-700 transition-all duration-200 shadow-lg hover:shadow-xl group overflow-hidden ${linkTo ? 'cursor-pointer' : ''}`}
        >
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-60`} />
            <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accent} bg-opacity-10 border border-white/5 flex items-center justify-center`}>
                    <CardIcon className="h-5 w-5 text-white" />
                </div>
                {linkTo && <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />}
            </div>
            <div>
                <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-zinc-100 leading-none">{value}</h3>
                {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
    return linkTo ? <Link to={linkTo}>{card}</Link> : card;
};

const FunnelBar = ({ label, count, total, color }) => {
    const pct = total > 0 ? Math.max(4, Math.round((count / total) * 100)) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-right">
                <span className="text-xs text-zinc-400 font-medium capitalize">{label}</span>
            </div>
            <div className="flex-1 bg-zinc-900 rounded-full h-6 overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-full rounded-full ${color} flex items-center justify-end pr-2`}
                >
                    {count > 0 && <span className="text-[10px] font-bold text-white/90 leading-none">{count}</span>}
                </motion.div>
            </div>
            <div className="w-8 text-right">
                <span className="text-xs font-bold text-zinc-300">{count}</span>
            </div>
        </div>
    );
};

const statusConfig = {
    scouted:            { label: 'Scouted',           color: 'bg-blue-500',    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    warming_sent:       { label: 'Warming Sent',       color: 'bg-sky-400',     badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    warmed:             { label: 'Warmed',             color: 'bg-amber-400',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    created:            { label: 'Site Created',       color: 'bg-violet-500',  badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
    retouched:          { label: 'Retouched',          color: 'bg-purple-400',  badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    published:          { label: 'Published',          color: 'bg-cyan-500',    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
    pitched:            { label: 'Pitched',            color: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    interest_confirmed: { label: 'Hot Lead',           color: 'bg-orange-400',  badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    completed:          { label: 'Customer',           color: 'bg-indigo-400',  badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
    invalid:            { label: 'Invalid',            color: 'bg-zinc-600',    badge: 'bg-zinc-700 text-zinc-400 border-zinc-600' },
};

const FUNNEL_STAGES = [
    { key: 'scouted',            label: 'Scouted',    color: 'bg-blue-500' },
    { key: 'warming_sent',       label: 'Warming',    color: 'bg-sky-400' },
    { key: 'pitched',            label: 'Pitched',    color: 'bg-emerald-500' },
    { key: 'interest_confirmed', label: 'Interested', color: 'bg-orange-400' },
    { key: 'completed',          label: 'Customer',   color: 'bg-indigo-400' },
];

// ─── Main Component ──────────────────────────────────────────────

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [recentLeads, setRecentLeads] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [pendingAnswers, setPendingAnswers] = useState(0);
    const [recentLogs, setRecentLogs] = useState([]);
    const [queueSizes, setQueueSizes] = useState({ warming: 0, pitchBacklog: 0, promoBacklog: 0 });
    const [totalLeads, setTotalLeads] = useState(0);

    useEffect(() => {
        fetchAll(true);

        const leadsSub = supabase.channel('home_leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                fetchLeads();
                fetchQueueSizes();
            }).subscribe();

        const chatSub = supabase.channel('home_chats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_logs' }, () => {
                fetchRecentChats();
                fetchPendingAnswers();
            }).subscribe();

        const logsSub = supabase.channel('home_logs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => {
                fetchRecentLogs();
            }).subscribe();

        return () => {
            supabase.removeChannel(leadsSub);
            supabase.removeChannel(chatSub);
            supabase.removeChannel(logsSub);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchAll(showLoading = false) {
        if (showLoading) setLoading(true);
        await Promise.all([fetchLeads(), fetchRecentChats(), fetchPendingAnswers(), fetchRecentLogs(), fetchQueueSizes()]);
        if (showLoading) setLoading(false);
    }

    async function fetchLeads() {
        try {
            const { data, error } = await supabase.from('leads').select('*').order('updated_at', { ascending: false });
            if (error) throw error;
            const counts = data.reduce((acc, lead) => {
                const s = lead.status || 'unknown';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {});
            setStats(counts);
            setTotalLeads(data.length);
            setRecentLeads(data.filter(l => l.status !== 'invalid').slice(0, 7));
        } catch (e) { console.error(e); }
    }

    async function fetchRecentChats() {
        try {
            const { data, error } = await supabase
                .from('chat_logs')
                .select('id, phone, message_in, message_out, created_at')
                .order('created_at', { ascending: false })
                .limit(6);
            if (!error) setRecentChats(data || []);
        } catch (e) { console.error(e); }
    }

    async function fetchPendingAnswers() {
        try {
            const { count, error } = await supabase
                .from('chat_logs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
                .not('message_out', 'is', null); // Only count records with an actual AI reply to review
            if (!error) setPendingAnswers(count || 0);
        } catch (e) { console.error(e); }
    }

    async function fetchRecentLogs() {
        try {
            const { data, error } = await supabase
                .from('logs').select('*').order('created_at', { ascending: false }).limit(8);
            if (!error) setRecentLogs(data || []);
        } catch (e) { console.error(e); }
    }

    async function fetchQueueSizes() {
        try {
            const [{ count: scoutedCount }, { count: publishedCount }, { count: pitchedCount }, { count: promoLogs }] = await Promise.all([
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'scouted'),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'published'),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'pitched'),
                supabase.from('logs').select('*', { count: 'exact', head: true }).eq('action', 'promo_sent'),
            ]);
            setQueueSizes({
                warming: scoutedCount || 0,
                pitchBacklog: publishedCount || 0,
                promoBacklog: Math.max(0, (pitchedCount || 0) - (promoLogs || 0)),
            });
        } catch (e) { console.error(e); }
    }

    const activeConversions = (stats['interest_confirmed'] || 0) + (stats['pitched'] || 0);
    const customers = stats['completed'] || 0;
    const funnelMax = stats['scouted'] || 1;

    const logColor = (status) => {
        if (status === 'error') return 'text-red-400 bg-red-500/10';
        if (status === 'success') return 'text-emerald-400 bg-emerald-500/10';
        if (status === 'warning') return 'text-amber-400 bg-amber-500/10';
        return 'text-blue-400 bg-blue-500/10';
    };

    if (loading && totalLeads === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-500 text-sm">Loading Command Center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">

            {/* ── Zone 1: Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Command Center
                    </h1>
                    <p className="text-zinc-500 text-sm mt-0.5">Real-time view of your entire sales pipeline</p>
                </div>
                <div className="text-xs text-zinc-600 font-mono hidden lg:block">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* ── Zone 1: KPI Bar ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    delay={0.05} title="Total Leads" value={totalLeads}
                    icon={Radio} accent="from-blue-600 to-blue-400"
                    sub={`${stats['invalid'] || 0} invalid filtered`}
                    linkTo="/pipeline"
                />
                <KpiCard
                    delay={0.1} title="Active Conversions" value={activeConversions}
                    icon={TrendingUp} accent="from-emerald-600 to-emerald-400"
                    sub={`${stats['interest_confirmed'] || 0} confirmed + ${stats['pitched'] || 0} pitched`}
                    linkTo="/interest-confirmed"
                />
                <KpiCard
                    delay={0.15} title="Paying Customers" value={customers}
                    icon={CheckCircle} accent="from-indigo-600 to-purple-400"
                    sub="status: completed"
                    linkTo="/analytics"
                />
                <KpiCard
                    delay={0.2} title="Pending AI Replies" value={pendingAnswers}
                    icon={pendingAnswers > 0 ? AlertTriangle : MessageSquare}
                    accent={pendingAnswers > 0 ? "from-amber-600 to-amber-400" : "from-zinc-600 to-zinc-400"}
                    sub={pendingAnswers > 0 ? "Action required" : "All caught up"}
                    linkTo="/answers"
                />
            </div>

            {/* ── Zone 2: Funnel + Chat Feed ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Sales Funnel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="lg:col-span-3 bg-surface rounded-2xl border border-zinc-800 p-6 shadow-xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> Sales Funnel
                            </h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Lead progression across all pipeline stages</p>
                        </div>
                        <Link to="/pipeline" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                            Details <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {FUNNEL_STAGES.map((stage) => (
                            <FunnelBar
                                key={stage.key}
                                label={stage.label}
                                count={stats[stage.key] || 0}
                                total={funnelMax}
                                color={stage.color}
                            />
                        ))}
                    </div>

                    {/* Pipeline Queues */}
                    <div className="mt-6 pt-5 border-t border-zinc-800/50 grid grid-cols-3 gap-3">
                        {[
                            { label: 'Warming Queue', value: queueSizes.warming, color: 'text-blue-400', Icon: Radio },
                            { label: 'Pitch Backlog', value: queueSizes.pitchBacklog, color: 'text-cyan-400', Icon: Globe2 },
                            { label: 'Promo Backlog', value: queueSizes.promoBacklog, color: 'text-emerald-400', Icon: Zap },
                        // eslint-disable-next-line no-unused-vars
                        ].map(({ label, value, color, Icon: QueueIcon }) => (
                            <div key={label} className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50 text-center">
                                <QueueIcon className={`h-4 w-4 ${color} mx-auto mb-1`} />
                                <p className={`text-xl font-black ${color}`}>{value}</p>
                                <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Live Conversation Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-surface rounded-2xl border border-zinc-800 p-5 shadow-xl flex flex-col"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-emerald-500" /> Live Conversations
                        </h2>
                        <Link to="/whatsapp" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                            Inbox <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex-1 space-y-2 overflow-hidden">
                        {recentChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
                                <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-xs">No recent messages</p>
                            </div>
                        ) : (
                            recentChats.map(chat => (
                                <div key={chat.id} className="flex gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                    <div className={`w-1.5 h-auto rounded-full shrink-0 ${chat.message_in ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className="text-xs font-semibold text-zinc-200 truncate">
                                                {chat.phone?.replace('@c.us', '') || 'Unknown'}
                                            </span>
                                            <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                                                {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 truncate leading-relaxed">
                                            <span className={`font-medium mr-1 ${chat.message_in ? 'text-emerald-500/80' : 'text-blue-400/80'}`}>
                                                {chat.message_in ? 'In:' : 'Out:'}
                                            </span>
                                            {chat.message_in || chat.message_out}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {pendingAnswers > 0 && (
                        <Link to="/answers" className="mt-4 flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <span className="text-xs font-semibold text-amber-300">{pendingAnswers} AI replies need review</span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
                        </Link>
                    )}
                </motion.div>
            </div>

            {/* ── Zone 3: Recent Leads + System Logs ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Recent Leads */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="lg:col-span-3 bg-surface rounded-2xl border border-zinc-800 shadow-xl overflow-hidden"
                >
                    <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800/60">
                        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" /> Recent Lead Activity
                        </h2>
                        <Link to="/pipeline" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-zinc-800/40">
                                    <th className="px-6 py-3">Business</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Website</th>
                                    <th className="px-4 py-3 text-right">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeads.map((lead) => {
                                    const cfg = statusConfig[lead.status] || { label: lead.status, badge: 'bg-zinc-700 text-zinc-400 border-zinc-600' };
                                    return (
                                        <tr key={lead.place_id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-3 font-medium text-zinc-200 max-w-[180px] truncate">{lead.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.badge}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {lead.vercel_url ? (
                                                    <a href={lead.vercel_url} target="_blank" rel="noreferrer"
                                                        className="text-xs text-blue-400 hover:underline truncate max-w-[120px] inline-block">
                                                        {lead.vercel_url.replace('https://', '')}
                                                    </a>
                                                ) : <span className="text-zinc-700 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-zinc-600 text-[11px]">
                                                {new Date(lead.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {recentLeads.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-600 text-xs">No leads found in pipeline.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* System Live Log */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="lg:col-span-2 bg-surface rounded-2xl border border-zinc-800 shadow-xl flex flex-col overflow-hidden"
                >
                    <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800/60">
                        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-400" /> System Logs
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </h2>
                        <Link to="/logs" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                            Full log <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-hidden px-4 py-3 space-y-2 font-mono text-xs relative">
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface to-transparent z-10 pointer-events-none" />
                        {recentLogs.length === 0 ? (
                            <div className="text-zinc-600 text-center py-6 font-sans">No recent system activity.</div>
                        ) : (
                            recentLogs.map(log => (
                                <div key={log.id} className="flex gap-2 items-start text-zinc-400 leading-relaxed">
                                    <span className="text-zinc-700 shrink-0 text-[10px] mt-0.5">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${logColor(log.status)}`}>
                                        {log.agent}
                                    </span>
                                    <span className="truncate text-[11px]">{log.action}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Status card: Pipeline Timing */}
                    <div className="px-4 py-3 border-t border-zinc-800/60 bg-zinc-900/40">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Clock className="h-3.5 w-3.5 text-zinc-600" />
                            <span>Pipeline runs automatically every 60 min</span>
                        </div>
                    </div>
                </motion.div>
            </div>

        </div>
    );
}
