import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    Shield, Target, Zap, TrendingUp, Users, Globe, MessageSquare, 
    BarChart3, PieChart, Activity, Star, Send, Database, RefreshCw,
    ChevronRight, MapPin, DollarSign, ArrowUpRight, Flame, Layers,
    Briefcase, Layout, Search, Filter, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
    BarChart, Bar, Cell, PieChart as RechartsPie, Pie
} from 'recharts';

// ─── CONFIG & CONSTANTS ───────────────────────────────────────────────────────

const AGENTS = [
    { key: 'scout', label: 'Scout Agent', icon: '🔍', desc: 'Map Gap Discovery' },
    { key: 'creator', label: 'Creator Agent', icon: '🎨', desc: 'Asset Generation' },
    { key: 'publisher', label: 'Publisher Agent', icon: '🚀', desc: 'Vercel Deployment' },
    { key: 'closer', label: 'Closer Agent', icon: '🤝', desc: 'WhatsApp Outreach' },
    { key: 'orchestrator', label: 'Orchestrator', icon: '🧠', desc: 'System Logic' },
];

const TIERS = [
    { key: 'basic', label: 'Basic Discovery', price: 19, color: '#6366f1' },
    { key: 'pro', label: 'Pro Showcase', price: 49, color: '#f59e0b' },
    { key: 'max', label: 'Max Dominance', price: 99, color: '#10b981' },
];

const PIPELINE_STAGES = [
    { key: 'scouted', label: 'Scouted', color: '#6366f1' },
    { key: 'published', label: 'Published', color: '#8b5cf6' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b' },
    { key: 'interest_confirmed', label: 'Interested', color: '#3b82f6' },
    { key: 'completed', label: 'Closed Won', color: '#10b981' },
];

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = '#f59e0b', trend }) {
    return (
        <div className="bg-obsidian-surface-high/20 border border-white/5 rounded-3xl p-6 hover:bg-obsidian-surface-high/30 transition-all group relative overflow-hidden">
            <div className={`absolute -top-10 -right-10 w-24 h-24 blur-3xl opacity-10 rounded-full`} style={{ backgroundColor: color }} />
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-obsidian-surface-low border border-white/5 flex items-center justify-center shadow-inner">
                    <Icon className="w-5 h-5 opacity-70" style={{ color }} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-180" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase group-hover:text-amber-400 transition-colors">
                        {value}
                    </h3>
                    {sub && <span className="text-[10px] text-zinc-600 font-bold uppercase">{sub}</span>}
                </div>
            </div>
        </div>
    );
}

function AgentPill({ agent, lastLog, now }) {
    const isError = lastLog?.status === 'error';
    const isWorking = lastLog && !isError && (now - new Date(lastLog.created_at).getTime() < 300000); // 5 mins
    const statusColor = isError ? '#ef4444' : isWorking ? '#10b981' : '#52525b';

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-obsidian-surface-low/50 border border-white/5 rounded-2xl hover:border-white/10 transition-all cursor-default">
            <div className="relative flex h-2 w-2">
                {isWorking && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: statusColor }} />
            </div>
            <div>
                <p className="text-[10px] font-black text-white leading-none uppercase tracking-tight">{agent.icon} {agent.label}</p>
                <p className="text-[9px] text-zinc-500 font-medium leading-none mt-1 uppercase">
                    {isWorking ? 'Active' : isError ? 'Fault' : 'Idle'}
                </p>
            </div>
        </div>
    );
}

// ─── MAIN HUB ────────────────────────────────────────────────────────────────

export default function UnifiedStrategyHub() {
    const navigate = useNavigate();
    const [now, setNow] = useState(Date.now());
    const [leads, setLeads] = useState([]);
    const [agentLogs, setAgentLogs] = useState({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLeads: 0,
        revenueToday: 0,
        totalRevenue: 0,
        activeSites: 0,
        tierMix: {},
        radarData: []
    });

    const fetchData = useCallback(async () => {
        try {
            // 1. Fetch Leads
            const { data: leadsData } = await supabase
                .from('leads')
                .select('*')
                .order('updated_at', { ascending: false });

            if (leadsData) {
                setLeads(leadsData);
                
                // 2. Calculate Tier Mix & Revenue
                const tierMix = leadsData.reduce((acc, l) => {
                    const t = l.subscription_tier || 'none';
                    acc[t] = (acc[t] || 0) + 1;
                    return acc;
                }, {});

                const totalRevenue = leadsData.reduce((sum, l) => sum + (Number(l.revenue) || 0), 0);
                const activeSites = leadsData.filter(l => l.vercel_url).length;

                // 3. Radar Data (Average Gaps)
                const gapLabels = ['Website', 'Reviews', 'Hours', 'Photos', 'SEO'];
                const radarData = gapLabels.map(label => {
                    const key = label.toLowerCase();
                    const count = leadsData.filter(l => {
                       const gaps = l.map_gap_analysis?.gaps || [];
                       return gaps.some(g => g.type.toLowerCase().includes(key));
                    }).length;
                    return { subject: label, A: (count / (leadsData.length || 1)) * 100, fullMark: 100 };
                });

                setStats({
                    totalLeads: leadsData.length,
                    revenueToday: 0, // Placeholder
                    totalRevenue,
                    activeSites,
                    tierMix,
                    radarData
                });
            }

            // 4. Fetch Agent Logs
            const { data: logs } = await supabase
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (logs) {
                const latestByAgent = logs.reduce((acc, log) => {
                    if (!acc[log.agent]) acc[log.agent] = log;
                    return acc;
                }, {});
                setAgentLogs(latestByAgent);
            }

        } catch (e) {
            console.error('Fetch Error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        const clock = setInterval(() => setNow(Date.now()), 1000);
        return () => { clearInterval(interval); clearInterval(clock); };
    }, [fetchData]);

    // Data for Charts
    const tierChartData = TIERS.map(t => ({
        name: t.label,
        value: stats.tierMix[t.key] || 0,
        color: t.color
    }));

    return (
        <div className="min-h-screen bg-obsidian-bg text-white p-6 pb-24 font-['Inter',sans-serif]">
            <main className="max-w-[1600px] mx-auto space-y-8">
                
                {/* ── TOP NAV / AGENT STRIP ──────────────────────────────── */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center">
                            <Shield className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Unified Strategy Hub</h1>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] mt-1.5 glow-text-amber">Operations V3.1</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                        {AGENTS.map(agent => (
                            <AgentPill key={agent.key} agent={agent} lastLog={agentLogs[agent.key]} now={now} />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={fetchData} className="w-10 h-10 rounded-xl bg-obsidian-surface-high border border-white/5 flex items-center justify-center text-zinc-500 hover:text-amber-500 transition-all">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
                            <Zap className="w-4 h-4" /> Trigger Scout
                        </button>
                    </div>
                </div>

                {/* ── CORE KPIS ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Acquisition Volume" value={stats.totalLeads} sub="Entities" icon={Target} color="#6366f1" trend={12} />
                    <StatCard label="Total Revenue" value={(stats.totalRevenue).toLocaleString()} sub="SAR" icon={DollarSign} color="#10b981" trend={8} />
                    <StatCard label="Conversion Score" value={Math.round(leads.reduce((s,l)=>s+(l.conversion_score||0),0)/(leads.length||1))} sub="Avg %" icon={Flame} color="#f97316" trend={-2} />
                    <StatCard label="Active Deployments" value={stats.activeSites} sub="Sites" icon={Globe} color="#06b6d4" trend={15} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEADS INTELLIGENCE (Middle Left) */}
                    <div className="lg:col-span-2 glass-card rounded-[32px] p-8 border border-white/5 flex flex-col gap-8 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">Intelligence Matrix</h2>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Digital Gap Distribution across current leads</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-lg bg-obsidian-surface-high border border-white/5 text-zinc-400 hover:text-white transition-all"><Filter className="w-4 h-4" /></button>
                                <button className="p-2 rounded-lg bg-obsidian-surface-high border border-white/5 text-zinc-400 hover:text-white transition-all"><Search className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[300px]">
                            {/* Radar Chart */}
                            <div className="relative group">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radarData}>
                                        <PolarGrid stroke="#ffffff10" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }} />
                                        <Radar name="Market Gaps" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Funnel Chart (Simplified Bar View) */}
                            <div className="flex flex-col justify-center gap-4">
                                {PIPELINE_STAGES.map(stage => {
                                    const count = leads.filter(l => l.status === stage.key).length;
                                    const pct = (count / (leads.length || 1)) * 100;
                                    return (
                                        <div key={stage.key} className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-zinc-400">{stage.label}</span>
                                                <span className="text-white">{count}</span>
                                            </div>
                                            <div className="h-2 bg-obsidian-surface-low rounded-full overflow-hidden border border-white/5 p-[1px]">
                                                <div className="h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* MONETIZATION ENGINE (Middle Right) */}
                    <div className="glass-card rounded-[32px] p-8 border border-white/5 flex flex-col gap-8 relative overflow-hidden">
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">Monetization Hub</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tier Distribution & Forecast</p>
                        </div>
                        
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie data={tierChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {tierChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #ffffff10', fontSize: '10px' }} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                            {TIERS.map(tier => (
                                <div key={tier.key} className="flex items-center justify-between p-3 rounded-2xl bg-obsidian-surface-high/20 border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{tier.label}</p>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{tier.price} SAR/mo</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-white">{stats.tierMix[tier.key] || 0}</p>
                                        <p className="text-[9px] text-zinc-600 font-bold">ACTIVES</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── OPERATION CANVAS ──────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* LEADS LIST */}
                    <div className="lg:col-span-3 glass-card rounded-[32px] p-7 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                                    <Layout className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h2 className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.2em]">Strategy Canvas</h2>
                            </div>
                            <button onClick={() => navigate('/admin-v2/pipeline')} className="text-[10px] font-bold text-amber-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                                Full Control Matrix <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Business</th>
                                        <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Digital Gap</th>
                                        <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tier Path</th>
                                        <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                                        <th className="pb-4 text-right text-[9px] font-black text-zinc-500 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {leads.slice(0, 8).map(lead => (
                                        <tr key={lead.place_id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4">
                                                <p className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">{lead.name}</p>
                                                <p className="text-[9px] text-zinc-600 font-bold mt-1 uppercase truncate max-w-[200px]">{lead.address}</p>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {[1,2,3,4,5].map(i => (
                                                        <div key={i} className={`w-3.5 h-1 rounded-full ${i <= ((lead.conversion_score || 0) / 20) ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700/50 transition-all uppercase tracking-tighter">
                                                    {lead.review_count > 100 ? 'MAX Path' : lead.website ? 'PRO Path' : 'BASIC Path'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIPELINE_STAGES.find(s=>s.key===lead.status)?.color || '#52525b' }} />
                                                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">{lead.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <button className="p-2 rounded-xl bg-obsidian-surface-high border border-white/5 text-zinc-500 hover:text-amber-500 hover:scale-110 transition-all">
                                                    <Zap className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* LIVE OPERATIONS TAPE */}
                    <div className="glass-card rounded-[32px] p-7 border border-white/5 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h2 className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.2em]">Operational Tape</h2>
                        </div>
                        <div className="space-y-4">
                            {Object.values(agentLogs).slice(0, 6).map(log => (
                                <div key={log.id} className="relative pl-5 border-l border-white/10 py-1 transition-all hover:bg-white/[0.01]">
                                    <div className="absolute left-[-4px] top-2.5 w-2 h-2 rounded-full border border-zinc-900" style={{ backgroundColor: log.status === 'success' ? '#10b981' : '#ef4444' }} />
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit' })} AST</p>
                                    <p className="text-[10px] font-bold text-zinc-200 leading-snug mt-0.5 uppercase tracking-tight">
                                        <span className="text-amber-500">{log.agent}:</span> {log.action || log.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/admin-v2/logs')} className="w-full mt-8 py-3 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 border border-white/5 text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">
                            View Forensics
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
