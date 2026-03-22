import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Terminal, Copy, Check, RefreshCw, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import V2Shell from './V2Shell';

const AGENTS = ['orchestrator', 'scout', 'creator', 'retoucher', 'publisher', 'closer', 'chatbot', 'biller', 'auditor'];

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 2) return 'just now';
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function statusColor(status) {
    if (status === 'error') return 'text-red-400';
    if (status === 'warning') return 'text-amber-400';
    if (status === 'success') return 'text-emerald-400';
    return 'text-blue-400';
}

export default function LogsV2() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(Date.now());
    const [copied, setCopied] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(searchParams.get('agent') || 'all');

    const fetchLogs = useCallback(async () => {
        try {
            const { data } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(200);
            if (data) setLogs(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchLogs();
        const ch = supabase.channel('v2:logs-page')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, payload => {
                setLogs(prev => [payload.new, ...prev].slice(0, 200));
            }).subscribe();
        const tick = setInterval(() => setNow(Date.now()), 5000);
        return () => { supabase.removeChannel(ch); clearInterval(tick); };
    }, [fetchLogs]);

    useEffect(() => {
        if (selectedAgent !== 'all') {
            setSearchParams({ agent: selectedAgent });
        } else {
            setSearchParams({});
        }
    }, [selectedAgent, setSearchParams]);

    const agentLastLogs = logs.reduce((acc, log) => {
        if (!acc[log.agent] || new Date(log.created_at) > new Date(acc[log.agent].created_at)) {
            acc[log.agent] = log;
        }
        return acc;
    }, {});

    const filteredLogs = selectedAgent === 'all' ? logs : logs.filter(l => l.agent === selectedAgent);

    const handleCopy = () => {
        const text = filteredLogs.map(l =>
            `[${new Date(l.created_at).toLocaleTimeString()}] [${l.agent}] ${l.action}${l.place_id ? ` (${l.place_id.slice(-8)})` : ''}${l.details && Object.keys(l.details).length ? ` — ${JSON.stringify(l.details)}` : ''}`
        ).join('\n');
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };

    return (
        <V2Shell>
            <div className="p-8 space-y-8 max-w-7xl mx-auto h-full min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Terminal className="w-6 h-6 text-amber-500" /> Neural Diagnostic Console
                        </h1>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 opacity-60">
                            Live Telemetry Stream — Real-time Latent State Synchronization Across All Agent Clusters
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchLogs} className="p-2.5 rounded-xl bg-obsidian-surface-high border border-white/5 text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all active:scale-95 shadow-lg">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={handleCopy} disabled={!filteredLogs.length}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-obsidian-surface-high border border-white/5 hover:border-white/10 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 active:scale-95 shadow-lg">
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-500/70" />}
                            {copied ? 'Buffer Cached' : 'Dump Sequence'}
                        </button>
                    </div>
                </div>

                {/* Agent pills */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setSelectedAgent('all')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-md active:scale-95 ${selectedAgent === 'all' ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-obsidian-surface-high/50 border-white/5 text-zinc-600 hover:text-zinc-300 hover:border-white/10'}`}
                    >
                        Master Stream [{logs.length}]
                    </button>
                    {AGENTS.map(agent => {
                        const last = agentLastLogs[agent];
                        const isActive = last && (now - new Date(last.created_at).getTime()) < 300000;
                        const isError = last?.status === 'error';
                        const isSelected = selectedAgent === agent;
                        return (
                            <button key={agent} onClick={() => setSelectedAgent(agent)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-md active:scale-95
                                    ${isSelected ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                                        : isError ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                        : isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                        : 'bg-obsidian-surface-high/50 border-white/5 text-zinc-700 hover:text-zinc-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-800'}`} />
                                {agent}
                                {last && <span className="opacity-40 hidden sm:inline font-bold ml-1.5">{timeAgo(last.created_at)}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Terminal */}
                <div className="flex-1 glass-card border-t border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col font-mono shadow-2xl min-h-[600px] relative group/terminal">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.01] to-transparent pointer-events-none" />
                    
                    {/* Terminal titlebar */}
                    <div className="bg-obsidian-surface-highest border-b border-white/5 px-8 py-4 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/30" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                            </div>
                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-4">
                                diagnostics:/{selectedAgent === 'all' ? 'global' : selectedAgent}.trace
                            </span>
                        </div>
                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest opacity-60">
                            {filteredLogs.length} Frames Cached
                        </span>
                    </div>

                    {/* Log entries */}
                    <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-1.5 relative z-10 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                                <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Awaiting Upstream Synchronization...</span>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-[10px] text-zinc-700 font-black uppercase tracking-widest opacity-40 italic">Null state detected. No telemetry data in current buffer.</div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} className="flex gap-4 hover:bg-white/[0.02] px-4 py-1.5 rounded-xl -mx-4 group/entry transition-colors items-start">
                                    <span className="text-zinc-600 flex-shrink-0 text-[10px] font-bold w-20 pt-0.5 opacity-40 group-hover/entry:opacity-100 transition-opacity">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                    <div className="w-[120px] flex-shrink-0 text-[10px] font-black tracking-widest uppercase items-center flex">
                                        {log.details?.phone ? (
                                            <Link to={`/admin-v2/whatsapp?phone=${log.details.phone}`} 
                                                className={`hover:text-amber-500 transition-colors flex items-center gap-2 group/link ${statusColor(log.status)}`}>
                                                <span className="opacity-80">[{log.agent}]</span>
                                                <MessageSquare className="w-2.5 h-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                            </Link>
                                        ) : (
                                            <span className={`${statusColor(log.status)} opacity-80`}>[{log.agent}]</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-3 group-hover/entry:translate-x-1 transition-transform">
                                            <span className="text-[11px] text-zinc-100 font-medium leading-relaxed tracking-tight group-hover/entry:text-white transition-colors">
                                                {log.action}
                                            </span>
                                            {log.place_id && (
                                                <span className="text-[9px] text-amber-500/40 font-black uppercase tracking-widest">
                                                    ID: {log.place_id.slice(-8)}
                                                </span>
                                            )}
                                        </div>
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <div className="text-[10px] text-zinc-600 font-bold bg-obsidian-surface-high/30 border-l border-white/5 py-2 px-3 rounded-lg overflow-x-auto custom-scrollbar-mini">
                                                <span className="text-amber-500/30 mr-2 font-black tracking-widest">DETAILS</span>
                                                {JSON.stringify(log.details)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </V2Shell>
    );
}
