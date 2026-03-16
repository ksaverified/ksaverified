import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, CheckCircle, XCircle, RefreshCcw, BarChart3, Database, Zap, AlertTriangle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export default function Analytics() {
    const [metrics, setMetrics] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAll();

        // Refresh every minute
        const interval = setInterval(fetchAll, 60000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const fetchAll = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        await Promise.all([fetchMetrics(), fetchHealth()]);
        if (showLoading) setLoading(false);
    }, []);

    async function fetchMetrics() {
        try {
            const { data, error } = await supabase.rpc('get_agent_metrics');
            if (error) throw error;

            const formattedData = data.map(agentData => {
                const totalAttempts = Number(agentData.completions) + Number(agentData.failures);
                const successRate = totalAttempts > 0
                    ? Math.round((Number(agentData.completions) / totalAttempts) * 100)
                    : 0;

                return { ...agentData, successRate };
            });

            const order = ['orchestrator', 'scout', 'creator', 'publisher', 'closer', 'chatbot', 'biller'];
            formattedData.sort((a, b) => order.indexOf(a.agent) - order.indexOf(b.agent));
            setMetrics(formattedData || []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    }

    async function fetchHealth() {
        try {
            const { data, error } = await supabase.rpc('get_system_health');
            if (error) throw error;
            setHealth(data);
        } catch (error) {
            console.error('Error fetching system health:', error);
        }
    }

    if (loading && metrics.length === 0) {
        return <div className="text-zinc-400 animate-pulse">Calculating Agent Metrics...</div>;
    }

    return (
        <div className="space-y-8 pb-10">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        System Intelligence
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Real-time resource monitoring and autonomous agent performance oversight.
                    </p>
                </div>
                <button
                    onClick={fetchAll}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700"
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Dash
                </button>
            </header>

            {/* System Health Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Database className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-500/20">Db Rows</span>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-black text-white">{health?.table_counts?.leads || 0}</h4>
                        <p className="text-xs text-zinc-500 font-medium">Total Active Leads</p>
                    </div>
                </div>

                <div className="bg-surface border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <Zap className="h-5 w-5 text-purple-500" />
                        </div>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-purple-500/20">Active logs</span>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-black text-white">{health?.table_counts?.logs || 0}</h4>
                        <p className="text-xs text-zinc-500 font-medium">System Events Count</p>
                    </div>
                </div>

                <div className="bg-surface border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Activity className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-emerald-500/20">24h Thrpt</span>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-black text-white">{health?.recent_activity || 0}</h4>
                        <p className="text-xs text-zinc-500 font-medium">Ops Last 24 Hours</p>
                    </div>
                </div>

                <div className="bg-surface border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-red-500/20">Errors</span>
                    </div>
                    <div className="space-y-1">
                        <h4 className={`text-2xl font-black ${health?.errors_24h > 10 ? 'text-red-400' : 'text-zinc-100'}`}>
                            {health?.errors_24h || 0}
                        </h4>
                        <p className="text-xs text-zinc-500 font-medium">Errors Last 24 Hours</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-800">
                                <th className="px-8 py-6 text-sm font-bold text-zinc-100 uppercase tracking-tight">Agent Name</th>
                                <th className="px-8 py-6 text-sm font-bold text-zinc-100 uppercase tracking-tight text-center">Success Rate</th>
                                <th className="px-8 py-6 text-sm font-bold text-zinc-100 uppercase tracking-tight text-center">Completions</th>
                                <th className="px-8 py-6 text-sm font-bold text-zinc-100 uppercase tracking-tight text-center">Failures</th>
                                <th className="px-8 py-6 text-sm font-bold text-zinc-100 uppercase tracking-tight text-center">Rectified</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map((agent, index) => (
                                <motion.tr
                                    key={agent.agent}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group hover:bg-white/[0.02] transition-colors border-b border-zinc-800/50 last:border-0"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <Activity className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-zinc-100 capitalize">{agent.agent} Agent</p>
                                                <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Core System</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className={`text-xl font-black ${agent.successRate >= 90 ? 'text-emerald-400' : agent.successRate >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {agent.successRate}%
                                            </span>
                                            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${agent.successRate}%` }}
                                                    transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                                                    className={`h-full rounded-full ${agent.successRate >= 90 ? 'bg-emerald-500' : agent.successRate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            <span className="text-lg font-bold text-emerald-100">{agent.completions}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-lg font-bold text-red-100">{agent.failures}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center text-zinc-400">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                            <RefreshCcw className="h-4 w-4 text-amber-500" />
                                            <span className="text-lg font-bold text-amber-100">{agent.rectified_failures}</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {metrics.length === 0 && !loading && (
                <div className="text-center py-20 bg-surface rounded-3xl border border-zinc-800">
                    <BarChart3 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-zinc-300">No Analytics Available</h3>
                    <p className="text-zinc-500 mt-2">The agents haven't generated any logs yet.</p>
                </div>
            )}
        </div>
    );
}
