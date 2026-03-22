import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Activity, AlertTriangle, CheckCircle, Clock, TrendingUp,
    MessageSquare, Users, Globe, Send, Flame, Star,
    ChevronRight, RefreshCw, Bell, LogOut, BarChart2,
    ArrowRight, Zap, Shield, Settings
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUptime(ms) {
    if (!ms || ms < 0) return '—';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const AGENTS = [
    { key: 'scout', label: 'Scout', icon: '🔍' },
    { key: 'creator', label: 'Creator', icon: '🎨' },
    { key: 'publisher', label: 'Publisher', icon: '🚀' },
    { key: 'chatbot', label: 'Chatbot', icon: '💬' },
    { key: 'closer', label: 'Closer', icon: '🤝' },
    { key: 'orchestrator', label: 'Orchestrator', icon: '🧠' },
];

const PIPELINE_STAGES = [
    { key: 'scouted', label: 'Scouted', color: '#6366f1' },
    { key: 'published', label: 'Published', color: '#8b5cf6' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b' },
    { key: 'warmed', label: 'Warmed', color: '#3b82f6' },
    { key: 'interest_confirmed', label: 'Interested', color: '#10b981' },
    { key: 'completed', label: 'Closed', color: '#22c55e' },
];

// ─── Agent Pill ───────────────────────────────────────────────────────────────

function AgentPill({ agentKey, label, icon, lastLog, now, onClick }) {
    const isError = lastLog?.status === 'error';
    const isWorking = lastLog && !isError && (now - new Date(lastLog.created_at).getTime() < 3000000);
    const isIdle = !lastLog || (!isError && !isWorking);

    const statusColor = isError ? '#ef4444' : isWorking ? '#f59e0b' : '#52525b';
    const textColor = isError ? 'text-red-400' : isWorking ? 'text-amber-400' : 'text-zinc-500';
    const bgColor = isError ? 'bg-red-500/10 border-red-500/20' : isWorking ? 'bg-amber-500/5 border-amber-500/20' : 'bg-obsidian-surface-high/30 border-white/5';

    // Calculate uptime from midnight
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const uptimeMs = lastLog ? Math.max(0, now - Math.max(new Date(lastLog.created_at).getTime(), midnight.getTime())) : 0;

    return (
        <button
            onClick={() => onClick(agentKey)}
            className={`flex flex-col items-start gap-1 px-4 py-2.5 rounded-xl border transition-all hover:bg-obsidian-surface-high group cursor-pointer min-w-[120px] ${bgColor}`}
            title={lastLog?.action || 'No recent activity'}
        >
            <div className="flex items-center gap-2 w-full">
                <div className="relative flex h-2 w-2 flex-shrink-0">
                    {(isError || isWorking) && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                            style={{ backgroundColor: statusColor }} />
                    )}
                    <span className="relative inline-flex rounded-full h-2 w-2 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        style={{ backgroundColor: statusColor }} />
                </div>
                <span className={`text-[10px] font-bold tracking-[0.1em] uppercase ${textColor} group-hover:text-white transition-colors`}>{icon} {label}</span>
            </div>
            <div className="flex items-center gap-2 w-full justify-between">
                {lastLog ? (
                    <>
                        <span className="text-[10px] text-zinc-500 font-medium">{isWorking ? `↑ ${formatUptime(uptimeMs)}` : `idle ${timeAgo(lastLog.created_at)}`}</span>
                        {isError && <span className="text-[9px] font-black text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Alert</span>}
                    </>
                ) : (
                    <span className="text-[10px] text-zinc-700">No data</span>
                )}
            </div>
        </button>
    );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color = '#f59e0b', icon: Icon, highlight }) {
    return (
        <div className={`flex flex-col gap-2 p-5 rounded-2xl border transition-all group ${highlight ? 'bg-amber-500/5 border-amber-500/30' : 'bg-obsidian-surface-high/20 border-white/5 hover:border-white/10 hover:bg-obsidian-surface-high/30'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-obsidian-surface-low shadow-inner border border-white/5`}>
                    {Icon && <Icon className="w-4 h-4 opacity-70" style={{ color }} />}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white tracking-tighter group-hover:text-amber-400 transition-colors uppercase">{value ?? '—'}</span>
                {sub && <span className="text-[10px] text-zinc-500 font-bold uppercase opacity-60">{sub}</span>}
            </div>
        </div>
    );
}

// ─── Pipeline Card ────────────────────────────────────────────────────────────

function PipelineColumn({ stage, leads }) {
    return (
        <div className="flex flex-col gap-3 min-w-[180px] max-w-[200px]">
            <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stage.label}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/5 bg-obsidian-surface-low text-zinc-300">
                    {leads.length}
                </span>
            </div>
            <div className="h-1 rounded-full bg-obsidian-surface-lowest overflow-hidden border border-white/5">
                <div className="h-full rounded-full transition-all" style={{ backgroundColor: stage.color, width: leads.length > 0 ? '100%' : '0%' }} />
            </div>
            <div className="flex flex-col gap-2.5">
                {leads.slice(0, 3).map(lead => (
                    <div key={lead.place_id}
                        className="p-3 rounded-xl bg-obsidian-surface-high/20 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all cursor-default group shadow-sm">
                        <p className="text-xs font-bold text-zinc-200 truncate group-hover:text-amber-400 transition-colors uppercase tracking-tight">{lead.name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium mt-1">
                            {lead.phone ? `+966 *** ${lead.phone.slice(-4)}` : 'No contact'}
                        </p>
                    </div>
                ))}
                {leads.length > 3 && (
                    <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center py-1 opacity-50">+{leads.length - 3} additional</div>
                )}
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function OrchestratorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [now, setNow] = useState(Date.now());
    const [agentLogs, setAgentLogs] = useState({});
    const [stats, setStats] = useState({});
    const [leads, setLeads] = useState([]);
    const [briefing, setBriefing] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            // Agent last logs
            const { data: logs } = await supabase
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (logs) {
                const last = logs.reduce((acc, log) => {
                    if (!acc[log.agent] || new Date(log.created_at) > new Date(acc[log.agent].created_at)) {
                        acc[log.agent] = log;
                    }
                    return acc;
                }, {});
                setAgentLogs(last);

                // Build briefing from today's logs
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const todayLogs = logs.filter(l => new Date(l.created_at) >= today);
                const errors = todayLogs.filter(l => l.status === 'error');
                const scoutCount = todayLogs.filter(l => l.agent === 'scout' && l.status === 'success').length;
                const publisherErrors = errors.filter(l => l.agent === 'publisher').length;
                const chatReplies = todayLogs.filter(l => l.agent === 'chatbot' && l.status === 'success').length;

                let msg = [];
                if (scoutCount > 0) msg.push(`${scoutCount} leads scouted today`);
                if (publisherErrors > 0) msg.push(`Publisher failed ${publisherErrors}x — retry recommended`);
                if (chatReplies > 0) msg.push(`${chatReplies} AI conversations handled`);
                if (errors.length > 0 && publisherErrors === 0) msg.push(`${errors.length} system errors detected`);
                if (msg.length === 0) msg.push('All systems nominal. No critical actions required.');

                setBriefing(msg.join('. ') + '.');
            }

            // Leads data
            const { data: leadsData } = await supabase
                .from('leads')
                .select('place_id, name, phone, status, created_at')
                .order('created_at', { ascending: false })
                .limit(200);
            if (leadsData) setLeads(leadsData);

            // Stats
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const todayLeads = leadsData?.filter(l => new Date(l.created_at) >= today) || [];

            const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
            const { count: chatCount } = await supabase.from('chat_logs').select('*', { count: 'exact', head: true });
            const { count: websiteCount } = await supabase.from('leads')
                .select('*', { count: 'exact', head: true }).not('vercel_url', 'is', null);

            setStats({
                newLeadsToday: todayLeads.length,
                totalLeads,
                websiteCount,
                chatCount,
                hotLeads: leadsData?.filter(l => l.status === 'interest_confirmed').length || 0,
                closedLeads: leadsData?.filter(l => l.status === 'completed').length || 0,
            });

        } catch (e) {
            console.error('[OrchestratorDashboard]', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const poll = setInterval(fetchData, 30000);
        const clock = setInterval(() => setNow(Date.now()), 2000);
        return () => { clearInterval(poll); clearInterval(clock); };
    }, [fetchData]);

    // Realtime subscription
    useEffect(() => {
        const ch = supabase.channel('v2:logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, [fetchData]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login-v2');
    };

    const goToLogs = (agent) => navigate(`/admin-v2/logs?agent=${agent}`);

    const pipelineByStage = PIPELINE_STAGES.reduce((acc, s) => {
        acc[s.key] = leads.filter(l => l.status === s.key);
        return acc;
    }, {});

    const errors = Object.values(agentLogs).filter(l => l.status === 'error');

    return (
        <div className="min-h-screen bg-obsidian-dark text-white font-['Inter',sans-serif]">
            {/* ── TOP BAR ──────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-obsidian-dark/80 backdrop-blur-2xl">
                <div className="px-6 py-4 flex items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mr-4 flex-shrink-0 cursor-pointer group" onClick={() => navigate('/admin-v2')}>
                        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform">
                            <Shield className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white leading-none tracking-tight uppercase">Dashboard</p>
                            <p className="text-[10px] text-amber-500 font-bold tracking-[0.2em] uppercase leading-none mt-1.5 glow-text-amber">V2 Orchestrator</p>
                        </div>
                    </div>

                    {/* Agent Pills */}
                    <div className="flex items-center gap-3 flex-1 overflow-x-auto no-scrollbar scroll-smooth">
                        {AGENTS.map(a => (
                            <AgentPill
                                key={a.key}
                                agentKey={a.key}
                                label={a.label}
                                icon={a.icon}
                                lastLog={agentLogs[a.key]}
                                now={now}
                                onClick={goToLogs}
                            />
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">
                            {new Date().toLocaleDateString('en-SA', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        {errors.length > 0 && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter">{errors.length} Faults</span>
                            </div>
                        )}
                        <div className="h-6 w-px bg-white/5 mx-1" />
                        <button onClick={fetchData} className="w-9 h-9 rounded-xl text-zinc-500 hover:text-amber-500 hover:bg-obsidian-surface-high border border-transparent hover:border-white/5 transition-all flex items-center justify-center">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => navigate('/admin-v2/settings')} className="w-9 h-9 rounded-xl text-zinc-500 hover:text-white hover:bg-obsidian-surface-high border border-transparent hover:border-white/5 transition-all flex items-center justify-center">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-obsidian-surface-high/50 hover:bg-obsidian-surface-highest border border-white/5 hover:border-white/10 transition-all">
                            <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase text-zinc-400">
                                {user?.email?.[0]}
                            </div>
                            <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-tighter">{user?.email?.split('@')[0]}</span>
                            <LogOut className="w-3.5 h-3.5 text-zinc-600" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6 max-w-[1600px] mx-auto">

                {/* ── ORCHESTRATOR BRIEFING ─────────────────────────────── */}
                <div className="relative rounded-3xl border border-amber-500/30 bg-obsidian-surface-low p-6 overflow-hidden luminous-card shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(245,158,11,0.15),transparent_60%)]" />
                    <div className="relative flex items-start gap-6">
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-obsidian-surface-high border border-amber-500/30 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            🧠
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <p className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] glow-text-amber">Entity Engine Summary</p>
                                <div className="h-4 w-px bg-white/10" />
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date().toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit' })} AST</span>
                            </div>
                            <p className="text-lg font-bold text-zinc-100 tracking-tight leading-snug max-w-4xl">
                                {loading ? 'Synthesizing local intelligence data...' : briefing}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 mt-2">
                            <button onClick={() => navigate('/admin-v2/logs?agent=publisher')}
                                className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/20 px-5 py-3 rounded-xl transition-all shadow-inner">
                                <RefreshCw className="w-4 h-4" /> Hard Reset Publisher
                            </button>
                            <button onClick={() => navigate('/admin-v2/whatsapp')}
                                className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border border-white/5 bg-obsidian-surface-high/50 hover:bg-obsidian-surface-highest px-5 py-3 rounded-xl transition-all">
                                <MessageSquare className="w-4 h-4 opacity-60" /> Comms Hub
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── COMMAND CENTER (3 COLUMNS) ────────────────────────── */}
                <div className="grid grid-cols-3 gap-6">

                    {/* ACQUISITION */}
                    <div className="glass-card rounded-3xl p-6 space-y-5 border-t border-white/5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-all" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                <TrendingUp className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h2 className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.2em]">Acquisition Layer</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard label="Incoming Today" value={stats.newLeadsToday} icon={Zap} color="#6366f1" />
                            <MetricCard label="Total Repository" value={stats.totalLeads} icon={Users} color="#8b5cf6" />
                            <MetricCard label="Web Instances" value={stats.websiteCount} icon={Globe} color="#6366f1" />
                            <MetricCard label="Active Pitches" value={leads.filter(l => l.status === 'pitched').length} icon={Send} color="#8b5cf6" />
                        </div>
                        <div className="pt-2">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 opacity-60">
                                <span>Pipeline Utilization</span>
                                <span className="text-zinc-300">{stats.totalLeads ? Math.round((stats.websiteCount / stats.totalLeads) * 100) : 0}%</span>
                            </div>
                            <div className="h-2 bg-obsidian-surface-lowest rounded-full overflow-hidden border border-white/5 shadow-inner p-[1px]">
                                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                    style={{ width: `${stats.totalLeads ? Math.round((stats.websiteCount / stats.totalLeads) * 100) : 0}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* CONVERSION */}
                    <div className="glass-card rounded-3xl p-6 space-y-5 border-t border-white/5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <Flame className="w-4 h-4 text-amber-500" />
                            </div>
                            <h2 className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.2em]">Conversion Core</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard label="Comms Response" value={leads.filter(l => l.status === 'replied').length} icon={MessageSquare} color="#f59e0b" />
                            <MetricCard label="High Interest" value={stats.hotLeads} icon={Flame} color="#f59e0b" highlight />
                            <MetricCard label="Closed Won" value={stats.closedLeads} icon={CheckCircle} color="#10b981" />
                            <MetricCard label="AI Interaction" value={stats.chatCount} icon={BarChart2} color="#f59e0b" />
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-inner group-hover:bg-amber-500/10 transition-colors">
                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Critical Action
                            </p>
                            <p className="text-xs font-bold text-zinc-300 uppercase tracking-tight leading-tight">
                                {stats.hotLeads > 0 ? `${stats.hotLeads} High-intent opportunities detected — verify status` : 'Strategic balance maintained'}
                            </p>
                        </div>
                    </div>

                    {/* RETENTION */}
                    <div className="glass-card rounded-3xl p-6 space-y-5 border-t border-white/5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <Star className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h2 className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.2em]">System Integrity</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard label="Comms Feed" value={stats.chatCount} icon={MessageSquare} color="#10b981" />
                            <MetricCard label="Bot Status" value={agentLogs['chatbot'] ? 'ACTIVE' : 'IDLE'} icon={Activity} color="#10b981" />
                            <MetricCard label="Live Agents" value={Object.values(agentLogs).filter(l => (Date.now() - new Date(l.created_at).getTime()) < 3000000 && l.status !== 'error').length} icon={Shield} color="#10b981" />
                            <MetricCard label="Fault Logs" value={errors.length} icon={AlertTriangle} color={errors.length > 0 ? '#ef4444' : '#10b981'} />
                        </div>
                        <button onClick={() => navigate('/admin-v2/logs')}
                            className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 px-4 py-3 rounded-xl transition-all shadow-inner">
                            Audit System Logs <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── PIPELINE KANBAN ───────────────────────────────────── */}
                <div className="glass-card rounded-3xl p-7 border-t border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-xl bg-obsidian-surface-high flex items-center justify-center border border-white/10 shadow-inner">
                            <BarChart2 className="w-4 h-4 text-amber-500/60" />
                        </div>
                        <div>
                            <h2 className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.2em]">Live Pipeline Visualization</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60 mt-1">{leads.length} Entities in Synchronized Queue</p>
                        </div>
                        <button onClick={() => navigate('/admin-v2/pipeline')}
                            className="ml-auto flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] hover:text-white transition-colors bg-amber-500/5 hover:bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                            Full Control Matrix <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                        {PIPELINE_STAGES.map(stage => (
                            <PipelineColumn key={stage.key} stage={stage} leads={pipelineByStage[stage.key] || []} />
                        ))}
                    </div>
                </div>

                {/* ── DEPT NAVIGATION ───────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-4 pb-8">
                    {[
                        { label: 'Intelligence & Pipeline', icon: '🔍', path: '/admin-v2/pipeline', desc: 'Leads & Acquisitions' },
                        { label: 'Published Assets', icon: '🌐', path: '/admin-v2/websites', desc: 'Website Deployments' },
                        { label: 'Communications', icon: '💬', path: '/admin-v2/whatsapp', desc: 'WhatsApp CX Matrix' },
                        { label: 'System Analytics', icon: '📊', path: '/admin-v2/analytics', desc: 'Performance Metrics' },
                        { label: 'Geospatial Map', icon: '🗺️', path: '/admin-v2/map', desc: 'Visual Scouting' },
                        { label: 'Knowledge Base', icon: '🤖', path: '/admin-v2/answers', desc: 'AI Instruction Set' },
                        { label: 'Audit Logs', icon: '📋', path: '/admin-v2/logs', desc: 'Process Forensics' },
                        { label: 'Matrix Control', icon: '⚙️', path: '/admin-v2/settings', desc: 'Core Configuration' },
                    ].map(item => (
                        <button key={item.path} onClick={() => navigate(item.path)}
                            className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-obsidian-surface-high/30 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-left group shadow-lg">
                            <div className="w-12 h-12 rounded-xl bg-obsidian-surface-low border border-white/5 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-obsidian-surface-high transition-all shadow-inner">
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.15em] group-hover:text-amber-400 transition-colors">{item.label}</p>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 opacity-60">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
}
