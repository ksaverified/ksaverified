import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart2, Activity, CheckCircle, XCircle, RefreshCw, Zap, Database, AlertTriangle, TrendingUp } from 'lucide-react';
import V2Shell from './V2Shell';

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
        <V2Shell>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BarChart2 className="w-6 h-6 text-amber-400" /> System Analytics
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Agent performance & system health metrics</p>
                    </div>
                    <button onClick={fetchAll} className={`flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm rounded-lg transition-all`}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Health cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {HEALTH_CARDS.map(c => (
                        <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>
                                    <c.icon className="w-4 h-4" style={{ color: c.color }} />
                                </div>
                                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{c.label}</span>
                            </div>
                            <p className="text-3xl font-black text-white">{loading ? '—' : (c.value ?? 0).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Agent Performance Table */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-zinc-500" />
                        <h2 className="text-sm font-bold text-zinc-300">Agent Performance</h2>
                        <span className="text-xs text-zinc-600 ml-1">— All-time stats</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800/60">
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Agent</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Success Rate</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Completions</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Failures</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Rectified</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {loading && metrics.length === 0 ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
                                    ))
                                ) : metrics.length === 0 ? (
                                    <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-500 text-sm">No agent data yet</td></tr>
                                ) : (
                                    metrics.map(agent => (
                                        <tr key={agent.agent} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{AGENT_ICONS[agent.agent] || '🤖'}</span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-200 capitalize">{agent.agent}</p>
                                                        <p className="text-[10px] text-zinc-600">{agent.total} total attempts</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className={`text-lg font-black ${agent.successRate >= 90 ? 'text-emerald-400' : agent.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                                        {agent.successRate}%
                                                    </span>
                                                    <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${agent.successRate >= 90 ? 'bg-emerald-500' : agent.successRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${agent.successRate}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                                                    <CheckCircle className="w-3.5 h-3.5" /> {agent.completions}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
                                                    <XCircle className="w-3.5 h-3.5" /> {agent.failures}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm">
                                                    {agent.rectified_failures}
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
        </V2Shell>
    );
}
