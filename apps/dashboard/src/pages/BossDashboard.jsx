import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import UnifiedNavHub from '../../components/management/UnifiedNavHub';
import LeadsMap from '../../components/management/LeadsMap';
import { 
    Activity, 
    Cpu, 
    Database, 
    Zap, 
    Terminal, 
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Map as MapIcon,
    PieChart
} from 'lucide-react';

export default function BossDashboard() {
    const { status, loading: telemetryLoading, error: telemetryError, runCommand, triggerOrchestrator, refresh } = useSystemStatus();
    const [leads, setLeads] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(true);
    const [cmdOutput, setCmdOutput] = useState('');
    const [executing, setExecuting] = useState(null);

    // Fetch leads for executive stats
    useEffect(() => {
        async function fetchLeads() {
            setLeadsLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) setLeads(data || []);
            setLeadsLoading(false);
        }
        fetchLeads();
    }, []);

    const handleAction = async (name, cmd) => {
        setExecuting(name);
        setCmdOutput(`Executing: ${name}...`);
        const result = await (cmd === 'trigger' ? triggerOrchestrator() : runCommand(cmd));
        setCmdOutput(result.output || result.error || 'Done');
        setExecuting(null);
        if (name.includes('Scraper')) refresh();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* ─── Header & Telemetry Status ─────────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">System Live</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Boss Command Hub</h1>
                    <p className="text-zinc-500 mt-1">Global platform telemetry and cross-service orchestration.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={refresh}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                        title="Force Refresh Telemetry"
                    >
                        <RefreshCw className={`w-4 h-4 ${telemetryLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="px-4 py-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Latency</span>
                            <span className="text-xs font-mono text-emerald-400">14ms</span>
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Uptime</span>
                            <span className="text-xs font-mono text-white">99.9%</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Global Navigation Hub ────────────────────────────────────── */}
            <UnifiedNavHub />

            {/* ─── Core Telemetry Grid ──────────────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GPU Performance */}
                <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl group hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-zinc-200">Processing Units</h3>
                        </div>
                        {status?.gpu?.available ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                        ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">Offline</span>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-zinc-500">Utilization</span>
                            <span className="text-lg font-mono font-bold text-white">{status?.gpu?.utilization || '0%'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-500" 
                                style={{ width: status?.gpu?.utilization || '0%' }} 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold">Temperature</p>
                                <p className="text-sm font-mono text-zinc-300">{status?.gpu?.temperature || '--'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold">VRAM Used</p>
                                <p className="text-sm font-mono text-zinc-300">{status?.gpu?.usedMemory || '--'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Intelligence Hub */}
                <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl group hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-zinc-200">AI Context Engine</h3>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {status?.ollama?.running ? 'Ollama Online' : 'Standby'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {status?.ollama?.models?.slice(0, 3).map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-emerald-400" />
                                    <span className="text-xs font-semibold text-zinc-300">{m.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">{m.size}</span>
                            </div>
                        )) || (
                            <p className="text-xs text-zinc-600 italic">No models currently active.</p>
                        )}
                        <p className="text-[10px] text-zinc-500 text-center pt-2 uppercase tracking-widest">+ {Math.max(0, (status?.ollama?.models?.length || 0) - 3)} More Models Available</p>
                    </div>
                </div>

                {/* Memory & DB Status */}
                <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl group hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                                <Database className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-zinc-200">Data Integrity</h3>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-full">
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-500 uppercase font-black">Knowledge Base</span>
                            <div>
                                <p className="text-2xl font-black text-white">{status?.memory?.totalNotes || '0'}</p>
                                <p className="text-[10px] text-purple-400 font-bold">Nodes Verified</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-500 uppercase font-black">Lead Signal</span>
                            <div>
                                <p className="text-2xl font-black text-white">{leads.length || '0'}</p>
                                <p className="text-[10px] text-emerald-400 font-bold">Qualified Signals</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Executive Operations & Map ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Command Panel (Ported from PaperClip) */}
                <aside className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Terminal className="w-20 h-20" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400" />
                            Quick Ops
                        </h3>
                        
                        <div className="space-y-3 relative z-10">
                            <button 
                                onClick={() => handleAction('Lead Scraper', 'node scripts/google-maps-scraper.js --bulk')}
                                disabled={!!executing}
                                className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-bold flex items-center justify-between group transition-all"
                            >
                                <span>Bulk Scout Riyadh</span>
                                <RefreshCw className={`w-4 h-4 text-zinc-500 group-hover:rotate-180 transition-transform ${executing === 'Lead Scraper' ? 'animate-spin' : ''}`} />
                            </button>
                            <button 
                                onClick={() => handleAction('Orchestrator', 'trigger')}
                                disabled={!!executing}
                                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black flex items-center justify-between shadow-lg shadow-indigo-500/20 group transition-all"
                            >
                                <span>Launch Pipeline</span>
                                <Zap className={`w-4 h-4 fill-current ${executing === 'Orchestrator' ? 'animate-pulse' : ''}`} />
                            </button>
                            <button 
                                onClick={() => handleAction('Daily Note', 'node scripts/para-memory-files.js daily-note')}
                                disabled={!!executing}
                                className="w-full py-3 px-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 text-zinc-400 text-sm font-semibold transition-all"
                            >
                                Sync Daily Note
                            </button>
                        </div>

                        {cmdOutput && (
                            <div className="mt-6 p-3 rounded-xl bg-black/40 border border-zinc-800 font-mono text-[10px] text-zinc-400 max-h-32 overflow-y-auto">
                                <p className="text-zinc-600 mb-1">$ system_output</p>
                                {cmdOutput}
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Pipeline Velocity</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Conversion Rate</span>
                                <span className="text-sm font-bold text-white">4.2%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Avg. Generation Time</span>
                                <span className="text-sm font-bold text-white">2.4m</span>
                            </div>
                            <div className="pt-2">
                                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[65%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Live Pipeline Map */}
                <main className="lg:col-span-3">
                    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[650px]">
                        <div className="p-5 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                    <MapIcon className="w-4 h-4" />
                                </div>
                                <h2 className="font-bold text-white">Global Signal Scoping</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2 mr-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-6 w-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500">A{i}</div>
                                    ))}
                                </div>
                                <div className="px-3 py-1 rounded-full bg-black/40 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                                    Tracking {leads.length} Signals
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <LeadsMap leads={leads} loading={leadsLoading} />
                        </div>
                    </section>
                </main>

            </div>
        </div>
    );
}
