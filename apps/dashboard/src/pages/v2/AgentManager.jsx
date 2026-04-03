import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    CloudLightning, Search, Globe, Send, Terminal, 
    Play, Pause, RefreshCw, AlertCircle, CheckCircle2,
    Database, Activity, Zap
} from 'lucide-react';

const AGENTS = [
    { id: 'scout', name: 'Scout AI', desc: 'Google Maps Niche Sourcing', icon: Search, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'creator', name: 'Creator AI', desc: 'Auto-Web & SEO Generation', icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'closer', name: 'Closer AI', desc: 'WhatsApp Outreach & Closing', icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

export default function AgentManager() {
    const [logs, setLogs] = useState([]);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [scoutParams, setScoutParams] = useState({ niche: 'Barber Shop', city: 'Jeddah' });
    const [stats, setStats] = useState({ scouted: 0, published: 0, income: 0 });

    useEffect(() => {
        fetchLogs();
        fetchStats();
        const ch = supabase.channel('agent-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
                setLogs(prev => [payload.new, ...prev].slice(0, 50));
            })
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    async function fetchLogs() {
        const { data } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) setLogs(data);
    }

    async function fetchStats() {
        const { data: leads } = await supabase.from('leads').select('status, revenue');
        if (leads) {
            setStats({
                scouted: leads.length,
                published: leads.filter(l => l.status === 'published' || l.status === 'pitched').length,
                income: leads.reduce((acc, l) => acc + (l.revenue || 0), 0)
            });
        }
    }

    async function triggerAgent(agentId) {
        setIsGlobalLoading(true);
        try {
            const body = agentId === 'scout' ? scoutParams : {};
            const res = await fetch(`/api/agents?action=${agentId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                // Success log handled by agent
            } else {
                throw new Error(data.error || 'Trigger failed');
            }
        } catch (e) {
            alert(`Error triggering ${agentId}: ` + e.message);
        } finally {
            setIsGlobalLoading(false);
        }
    }

    return (
        <>
            <div className="p-8 space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                            <CloudLightning className="w-8 h-8 text-amber-500 animate-pulse" /> Agent Operations
                        </h1>
                        <p className="text-zinc-500 mt-1 font-medium">Coordinate the Unified Strategy through autonomous agent triggers.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none">System Status</span>
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 mt-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> OPERATIONAL
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tactical Triggers */}
                <div className="grid grid-cols-3 gap-6">
                    {AGENTS.map(agent => (
                        <div key={agent.id} className="glass-card rounded-2xl p-6 space-y-4 hover:border-amber-500/30 transition-all group overflow-hidden relative">
                            <div className="flex items-start justify-between relative z-10">
                                <div className={`p-3 rounded-xl ${agent.bg}`}>
                                    <agent.icon className={`w-6 h-6 ${agent.color}`} />
                                </div>
                                <button 
                                    onClick={() => triggerAgent(agent.id)}
                                    disabled={isGlobalLoading}
                                    className="p-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-white tracking-tight">{agent.name}</h3>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1">{agent.desc}</p>
                            </div>
                            
                            {/* Scout Specific Inputs */}
                            {agent.id === 'scout' && (
                                <div className="grid grid-cols-2 gap-3 mt-4 relative z-10 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Niche</label>
                                        <input 
                                            value={scoutParams.niche} onChange={e => setScoutParams({...scoutParams, niche: e.target.value})}
                                            className="w-full bg-obsidian-surface-lowest/50 border border-obsidian-surface-high/30 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">City</label>
                                        <input 
                                            value={scoutParams.city} onChange={e => setScoutParams({...scoutParams, city: e.target.value})}
                                            className="w-full bg-obsidian-surface-lowest/50 border border-obsidian-surface-high/30 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Decorative Background Icon */}
                            <agent.icon className="absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none" />
                        </div>
                    ))}
                </div>

                {/* Logs and Stats Section */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Activity Stream */}
                    <div className="col-span-8 glass-card rounded-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-obsidian-surface-high/20 flex items-center justify-between bg-obsidian-surface-low/30">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-amber-500" />
                                <h3 className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.2em]">Real-time Log Stream</h3>
                            </div>
                            <button onClick={fetchLogs} className="p-1.5 hover:bg-obsidian-surface-high rounded-lg text-zinc-500 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-obsidian-surface-lowest/50 p-4 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[400px] scrollbar-thin">
                            {logs.map((log, i) => (
                                <div key={log.id || i} className="py-1.5 border-b border-white/[0.03] flex items-start gap-3 group">
                                    <span className="text-zinc-600 flex-shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                    <span className={`flex-shrink-0 px-1.5 rounded uppercase text-[9px] font-bold ${
                                        log.level === 'error' ? 'bg-red-500/10 text-red-500' : 
                                        log.level === 'warn' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                        {log.level || 'info'}
                                    </span>
                                    <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">{log.message}</span>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="h-full flex items-center justify-center text-zinc-700 italic">Awaiting agent connection...</div>
                            )}
                        </div>
                    </div>

                    {/* Operational Stats */}
                    <div className="col-span-4 space-y-6">
                        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <Activity className="w-5 h-5 text-amber-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Efficiency</span>
                            </div>
                            <div className="space-y-6">
                                <StatRow label="Leads Scouted" value={stats.scouted} icon={Database} subValue="TOTAL" />
                                <StatRow label="Sites Live" value={stats.published} icon={Globe} subValue={`${((stats.published/stats.scouted)*100 || 0).toFixed(1)}% Conv.`} />
                                <StatRow label="Target Revenue" value={`${stats.income} SAR`} icon={Zap} subValue="3-TIER TOTAL" color="text-emerald-400" />
                            </div>
                            <div className="mt-8 pt-6 border-t border-obsidian-surface-high/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase">Pipeline Health</span>
                                        <span className="text-sm text-zinc-300 font-bold mt-1">Excellent</span>
                                    </div>
                                    <div className="h-10 w-24 bg-obsidian-surface-high/30 rounded-lg overflow-hidden flex items-end gap-1 p-1">
                                        {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                            <div key={i} className="flex-1 bg-amber-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatRow({ label, value, icon: Icon, subValue, color = "text-white" }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-obsidian-surface-high rounded-lg">
                    <Icon className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                    <span className={`text-lg font-black tracking-tight ${color}`}>{value}</span>
                </div>
            </div>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{subValue}</span>
        </div>
    );
}
