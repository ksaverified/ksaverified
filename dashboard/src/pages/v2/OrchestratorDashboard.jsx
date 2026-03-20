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
    { key: 'created', label: 'Scouted', color: '#6366f1' },
    { key: 'website_created', label: 'Site Created', color: '#8b5cf6' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b' },
    { key: 'replied', label: 'Replied', color: '#3b82f6' },
    { key: 'interested', label: 'Interested', color: '#10b981' },
    { key: 'closed', label: 'Closed', color: '#22c55e' },
];

// ─── Agent Pill ───────────────────────────────────────────────────────────────

function AgentPill({ agentKey, label, icon, lastLog, now, onClick }) {
    const isError = lastLog?.status === 'error';
    const isWorking = lastLog && !isError && (now - new Date(lastLog.created_at).getTime() < 3000000);
    const isIdle = !lastLog || (!isError && !isWorking);

    const statusColor = isError ? '#ef4444' : isWorking ? '#10b981' : '#52525b';
    const textColor = isError ? 'text-red-400' : isWorking ? 'text-emerald-400' : 'text-zinc-500';
    const bgColor = isError ? 'bg-red-500/10 border-red-500/20' : isWorking ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-900/60 border-zinc-800';

    // Calculate uptime from midnight
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const uptimeMs = lastLog ? Math.max(0, now - Math.max(new Date(lastLog.created_at).getTime(), midnight.getTime())) : 0;

    return (
        <button
            onClick={() => onClick(agentKey)}
            className={`flex flex-col items-start gap-1 px-3 py-2 rounded-lg border transition-all hover:scale-105 ${bgColor} cursor-pointer min-w-[100px]`}
            title={lastLog?.action || 'No recent activity'}
        >
            <div className="flex items-center gap-2 w-full">
                <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    {(isError || isWorking) && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                            style={{ backgroundColor: statusColor }} />
                    )}
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}80` }} />
                </div>
                <span className={`text-xs font-bold tracking-wide ${textColor}`}>{icon} {label}</span>
            </div>
            <div className="flex items-center gap-2 w-full justify-between">
                {lastLog ? (
                    <>
                        <span className="text-[10px] text-zinc-600">{isWorking ? `↑ ${formatUptime(uptimeMs)}` : `idle ${timeAgo(lastLog.created_at)}`}</span>
                        {isError && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1 rounded">ERR</span>}
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
        <div className={`flex flex-col gap-1 p-4 rounded-xl border ${highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/50'} transition-all hover:border-zinc-700`}>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
                <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
                {sub && <span className="text-xs text-zinc-500 mb-0.5">{sub}</span>}
            </div>
        </div>
    );
}

// ─── Pipeline Card ────────────────────────────────────────────────────────────

function PipelineColumn({ stage, leads }) {
    return (
        <div className="flex flex-col gap-2 min-w-[160px] max-w-[180px]">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-zinc-400">{stage.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: stage.color + '30', color: stage.color }}>
                    {leads.length}
                </span>
            </div>
            <div className="h-0.5 rounded-full" style={{ backgroundColor: stage.color + '60' }} />
            <div className="flex flex-col gap-2">
                {leads.slice(0, 3).map(lead => (
                    <div key={lead.place_id}
                        className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all cursor-default group">
                        <p className="text-xs font-semibold text-zinc-300 truncate group-hover:text-white">{lead.name}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                            {lead.phone ? `+966 *** ${lead.phone.slice(-4)}` : 'No phone'}
                        </p>
                    </div>
                ))}
                {leads.length > 3 && (
                    <div className="text-[10px] text-zinc-600 text-center py-1">+{leads.length - 3} more</div>
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
                hotLeads: leadsData?.filter(l => l.status === 'interested').length || 0,
                closedLeads: leadsData?.filter(l => l.status === 'closed').length || 0,
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
        <div className="min-h-screen bg-[#080a0f] text-white font-['Inter',sans-serif]">
            {/* ── TOP BAR ──────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#080a0f]/95 backdrop-blur-xl">
                <div className="px-6 py-3 flex items-center gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mr-4 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-black" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-none">KSA Verified</p>
                            <p className="text-[9px] text-amber-500 font-bold tracking-widest uppercase leading-none mt-0.5">Orchestrator</p>
                        </div>
                    </div>

                    {/* Agent Pills */}
                    <div className="flex items-center gap-2 flex-1 overflow-x-auto pb-0.5">
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
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-zinc-500">{new Date().toLocaleDateString('en-SA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        {errors.length > 0 && (
                            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-1">
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                                <span className="text-[10px] text-red-400 font-bold">{errors.length} error{errors.length > 1 ? 's' : ''}</span>
                            </div>
                        )}
                        <button onClick={fetchData} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate('/admin-v2/settings')} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800">
                            <LogOut className="w-3.5 h-3.5" />
                            {user?.email?.split('@')[0]}
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6 max-w-[1600px] mx-auto">

                {/* ── ORCHESTRATOR BRIEFING ─────────────────────────────── */}
                <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent p-5 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)]" />
                    <div className="relative flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                            🧠
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-bold text-amber-400">Orchestrator Summary</p>
                                <span className="text-[10px] text-zinc-600">{new Date().toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                {loading ? 'Loading briefing...' : briefing}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => navigate('/admin-v2/logs?agent=publisher')}
                                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-all">
                                <RefreshCw className="w-3 h-3" /> Retry Publisher
                            </button>
                            <button onClick={() => navigate('/admin-v2/whatsapp')}
                                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-all">
                                <MessageSquare className="w-3 h-3" /> Conversations
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── COMMAND CENTER (3 COLUMNS) ────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">

                    {/* ACQUISITION */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <h2 className="text-sm font-bold text-zinc-300">Acquisition</h2>
                            <span className="text-[10px] text-zinc-600 ml-auto">Scout · Creator · Publisher</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="New Today" value={stats.newLeadsToday} icon={Zap} color="#6366f1" />
                            <MetricCard label="Total Leads" value={stats.totalLeads} icon={Users} color="#8b5cf6" />
                            <MetricCard label="Sites Created" value={stats.websiteCount} icon={Globe} color="#6366f1" />
                            <MetricCard label="Pitched" value={leads.filter(l => l.status === 'pitched').length} icon={Send} color="#8b5cf6" />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
                                <span>Pipeline fill rate</span>
                                <span>{stats.totalLeads ? Math.round((stats.websiteCount / stats.totalLeads) * 100) : 0}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                    style={{ width: `${stats.totalLeads ? Math.round((stats.websiteCount / stats.totalLeads) * 100) : 0}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* CONVERSION */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Flame className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <h2 className="text-sm font-bold text-zinc-300">Conversion</h2>
                            <span className="text-[10px] text-zinc-600 ml-auto">Closer · Sales</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="Replied" value={leads.filter(l => l.status === 'replied').length} icon={MessageSquare} color="#f59e0b" />
                            <MetricCard label="Interested" value={stats.hotLeads} icon={Flame} color="#f59e0b" highlight />
                            <MetricCard label="Closed" value={stats.closedLeads} icon={CheckCircle} color="#22c55e" />
                            <MetricCard label="AI Chats" value={stats.chatCount} icon={BarChart2} color="#f59e0b" />
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">🔥 Action Needed</p>
                            <p className="text-xs text-zinc-400">
                                {stats.hotLeads > 0 ? `${stats.hotLeads} lead${stats.hotLeads > 1 ? 's' : ''} interested — follow up now` : 'No urgent actions'}
                            </p>
                        </div>
                    </div>

                    {/* RETENTION */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Star className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <h2 className="text-sm font-bold text-zinc-300">Retention</h2>
                            <span className="text-[10px] text-zinc-600 ml-auto">Chatbot CX</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="Total Chats" value={stats.chatCount} icon={MessageSquare} color="#10b981" />
                            <MetricCard label="Chatbot" value={agentLogs['chatbot'] ? '🟢 ON' : '⚫ OFF'} icon={Activity} color="#10b981" />
                            <MetricCard label="Active Agents" value={Object.values(agentLogs).filter(l => (Date.now() - new Date(l.created_at).getTime()) < 3000000 && l.status !== 'error').length} icon={Shield} color="#10b981" />
                            <MetricCard label="Errors Today" value={errors.length} icon={AlertTriangle} color={errors.length > 0 ? '#ef4444' : '#10b981'} />
                        </div>
                        <button onClick={() => navigate('/admin-v2/logs')}
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 px-3 py-2 rounded-lg transition-all">
                            View System Logs <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* ── PIPELINE KANBAN ───────────────────────────────────── */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart2 className="w-4 h-4 text-zinc-500" />
                        <h2 className="text-sm font-bold text-zinc-300">Lead Pipeline</h2>
                        <span className="text-xs text-zinc-600 ml-1">— {leads.length} total leads tracked</span>
                        <button onClick={() => navigate('/admin-v2/pipeline')}
                            className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors">
                            Full View <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {PIPELINE_STAGES.map(stage => (
                            <PipelineColumn key={stage.key} stage={stage} leads={pipelineByStage[stage.key] || []} />
                        ))}
                    </div>
                </div>

                {/* ── DEPT NAVIGATION ───────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Leads & Pipeline', icon: '🔍', path: '/admin-v2/pipeline', desc: 'Scout & Creator' },
                        { label: 'Websites', icon: '🌐', path: '/admin-v2/websites', desc: 'Publisher' },
                        { label: 'WhatsApp CX', icon: '💬', path: '/admin-v2/whatsapp', desc: 'Chatbot' },
                        { label: 'Analytics', icon: '📊', path: '/admin-v2/analytics', desc: 'Performance' },
                        { label: 'Map View', icon: '🗺️', path: '/admin-v2/map', desc: 'Geographic' },
                        { label: 'AI Answers', icon: '🤖', path: '/admin-v2/answers', desc: 'Responses' },
                        { label: 'System Logs', icon: '📋', path: '/admin-v2/logs', desc: 'All agents' },
                        { label: 'Settings', icon: '⚙️', path: '/admin-v2/settings', desc: 'Configuration' },
                    ].map(item => (
                        <button key={item.path} onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all text-left group">
                            <span className="text-xl">{item.icon}</span>
                            <div>
                                <p className="text-xs font-semibold text-zinc-300 group-hover:text-white">{item.label}</p>
                                <p className="text-[10px] text-zinc-600">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 ml-auto" />
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
}
