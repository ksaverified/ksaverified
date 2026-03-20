import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Terminal, Copy, Check, RefreshCw } from 'lucide-react';
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
            <div className="p-6 flex flex-col gap-4 h-full min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Terminal className="w-6 h-6 text-zinc-400" /> System Logs
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Live feed from all agents — auto-updates via realtime</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchLogs} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-all">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={handleCopy} disabled={!filteredLogs.length}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm rounded-lg transition-all disabled:opacity-40">
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Logs'}
                        </button>
                    </div>
                </div>

                {/* Agent pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedAgent('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedAgent === 'all' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                    >
                        All Agents · {logs.length}
                    </button>
                    {AGENTS.map(agent => {
                        const last = agentLastLogs[agent];
                        const isActive = last && (now - new Date(last.created_at).getTime()) < 300000;
                        const isError = last?.status === 'error';
                        const isSelected = selectedAgent === agent;
                        return (
                            <button key={agent} onClick={() => setSelectedAgent(agent)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize
                                    ${isSelected ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                        : isError ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                        : isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-300'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-500' : isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
                                {agent}
                                {last && <span className="opacity-60 hidden sm:inline">· {timeAgo(last.created_at)}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Terminal */}
                <div className="flex-1 bg-[#0d0f14] border border-zinc-800 rounded-xl overflow-hidden flex flex-col font-mono text-sm shadow-2xl min-h-[500px]">
                    {/* Terminal titlebar */}
                    <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-2.5 flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500/50" />
                        </div>
                        <span className="text-xs text-zinc-600">
                            {selectedAgent === 'all' ? 'all-agents' : selectedAgent}.log — {filteredLogs.length} entries
                        </span>
                    </div>

                    {/* Log entries */}
                    <div className="p-4 overflow-y-auto flex-1 flex flex-col-reverse gap-0.5">
                        {loading ? (
                            <div className="text-zinc-600 animate-pulse">Connecting to log stream...</div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-zinc-600">No logs for this agent yet.</div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} className="flex gap-3 hover:bg-white/[0.03] px-2 py-0.5 rounded -mx-2 group">
                                    <span className="text-zinc-600 flex-shrink-0 text-[11px] pt-0.5 w-20">
                                        {new Date(log.created_at).toLocaleTimeString()}
                                    </span>
                                    <span className={`flex-shrink-0 w-28 font-semibold capitalize text-[11px] pt-0.5 ${statusColor(log.status)}`}>
                                        [{log.agent}]
                                    </span>
                                    <span className="text-zinc-300 text-[11px] leading-relaxed">
                                        {log.action}
                                        {log.place_id && (
                                            <span className="text-zinc-600 ml-2">(…{log.place_id.slice(-8)})</span>
                                        )}
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <span className="text-zinc-600 block text-[10px] mt-0.5 ml-2 border-l-2 border-zinc-800 pl-2">
                                                {JSON.stringify(log.details)}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </V2Shell>
    );
}
