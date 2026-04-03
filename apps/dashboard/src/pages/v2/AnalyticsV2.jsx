import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart2, Activity, CheckCircle, XCircle, RefreshCw, Zap, Database, AlertTriangle, TrendingUp } from 'lucide-react';

const AGENT_ORDER = ['orchestrator', 'scout', 'creator', 'publisher', 'closer', 'chatbot', 'biller'];
const AGENT_ICONS = { orchestrator: '🧠', scout: '🔍', creator: '🎨', publisher: '🚀', closer: '🤝', chatbot: '💬', biller: '💳' };

export default function AnalyticsV2() {
    const [metrics, setMetrics] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            const [metricsRes, healthRes] = await Promise.all([
                supabase.rpc('get_agent_metrics'),
                supabase.rpc('get_system_health'),
            ]);

            if (metricsRes.data) {
                const sorted = [...metricsRes.data].sort((a, b) => AGENT_ORDER.indexOf(a.agent) - AGENT_ORDER.indexOf(b.agent));
                const withRate = sorted.map(m => {
                    const total = Number(m.completions) + Number(m.failures);
                    return { ...m, successRate: total > 0 ? Math.round((m.completions / total) * 100) : 0, total };
                });
                setMetrics(withRate);
            }

            if (healthRes.data) setHealth(healthRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 60000); return () => clearInterval(t); }, [fetchAll]);

    const HEALTH_CARDS = [
        { label: 'Total Leads', value: health?.table_counts?.leads, icon: Database, color: '#6366f1' },
        { label: 'System Events', value: health?.table_counts?.logs, icon: Zap, color: '#8b5cf6' },
        { label: 'Ops (24h)', value: health?.recent_activity, icon: Activity, color: '#10b981' },
        { label: 'Errors (24h)', value: health?.errors_24h, icon: AlertTriangle, color: health?.errors_24h > 10 ? '#ef4444' : '#10b981' },
    ];

    return (
        <>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                            <BarChart2 className="w-6 h-6 text-amber-500" /> System Analytics
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">Agent performance & system health metrics</p>
                    </div>
                    <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-surface-high hover:bg-obsidian-surface-highest text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : 'text-amber-500/60'}`} />
                        Refresh
                    </button>
                </div>

                {/* Health cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {HEALTH_CARDS.map(c => (
                        <div key={c.label} className="glass-card rounded-2xl p-6 border-t border-white/5 relative overflow-hidden luminous-card">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-obsidian-surface-high/50 border border-white/5 shadow-inner">
                                    <c.icon className="w-4 h-4" style={{ color: c.color }} />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{c.label}</span>
                            </div>
                            <p className="text-3xl font-black text-white tracking-tighter">{loading ? '—' : (c.value ?? 0).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Agent Performance Table */}
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-obsidian-surface-high/20 bg-obsidian-surface-low/30 flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-amber-500/60" />
                        <div className="flex items-center gap-2">
                            <h2 className="text-[11px] font-bold text-zinc-200 uppercase tracking-[0.2em]">Agent Performance</h2>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest opacity-60">— Cumulative</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-obsidian-surface-high/10 bg-obsidian-surface-low/10">
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Agent Entity</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-center">Score</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-center">Success</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-center">Faults</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-center">Recovered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-surface-high/10">
                                {loading && metrics.length === 0 ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}><td colSpan={5} className="px-6 py-6"><div className="h-4 bg-obsidian-surface-high/20 rounded-lg animate-pulse" /></td></tr>
                                    ))
                                ) : metrics.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-600 text-xs font-bold uppercase tracking-[0.2em] italic opacity-40">No agent metrics available</td></tr>
                                ) : (
                                    metrics.map(agent => (
                                        <tr key={agent.agent} className="hover:bg-obsidian-surface-high/20 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-obsidian-surface-low flex items-center justify-center text-xl shadow-inner border border-white/5">
                                                        {AGENT_ICONS[agent.agent] || '🤖'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-100 capitalize group-hover:text-amber-300 transition-colors">{agent.agent}</p>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{agent.total} Attempts</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`text-xl font-black tracking-tighter ${agent.successRate >= 90 ? 'text-emerald-400' : agent.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                                        {agent.successRate}%
                                                    </span>
                                                    <div className="w-24 h-1.5 bg-obsidian-surface-lowest rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                        <div className={`h-full rounded-full transition-all shadow-[0_0_8px_rgba(0,0,0,0.5)] ${agent.successRate >= 90 ? 'bg-emerald-500' : agent.successRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${agent.successRate}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs">
                                                    <CheckCircle className="w-3.5 h-3.5" /> {agent.completions}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 font-black text-xs">
                                                    <XCircle className="w-3.5 h-3.5" /> {agent.failures}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black text-xs">
                                                    <Zap className="w-3.5 h-3.5" /> {agent.rectified_failures}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
