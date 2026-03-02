import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Terminal } from 'lucide-react';

export default function Logs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();

        // Subscribe to new log insertions
        const channel = supabase
            .channel('public:logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
                setLogs(prev => [payload.new, ...prev].slice(0, 500)); // Keep last 500
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function fetchLogs() {
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const getLogColor = (status) => {
        switch (status) {
            case 'error': return 'text-red-400';
            case 'warning': return 'text-amber-400';
            case 'success': return 'text-emerald-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="h-full flex flex-col max-h-[calc(100vh-4rem)]">
            <header className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                    <Terminal className="h-7 w-7" /> Live Logs
                </h1>
                <p className="text-zinc-400 mt-1">Real-time terminal output from the backend orchestration.</p>
            </header>

            <div className="flex-1 bg-[#1e1e1e] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col relative font-mono text-sm leading-relaxed shadow-2xl">
                {/* Terminal Header Bar */}
                <div className="bg-zinc-900 border-b border-zinc-800 p-3 flex gap-2 w-full flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                </div>

                {/* Terminal Body */}
                <div className="p-4 overflow-y-auto flex-1 flex flex-col-reverse space-y-reverse space-y-1">
                    {loading ? (
                        <div className="text-zinc-500 animate-pulse">Connecting to log stream...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-zinc-500">No logs generated yet.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="flex gap-4 hover:bg-white/5 px-2 rounded -mx-2 transition-colors">
                                <span className="text-zinc-600 flex-shrink-0 w-24">
                                    {new Date(log.created_at).toLocaleTimeString()}
                                </span>
                                <span className={`flex-shrink-0 w-32 font-medium capitalize \${getLogColor(log.status)}`}>
                                    [{log.agent}]
                                </span>
                                <span className="text-zinc-300">
                                    {log.action}
                                    {log.place_id ? <span className="text-zinc-500 ml-2">(Lead: {log.place_id.slice(-8)})</span> : null}
                                    {log.details && Object.keys(log.details).length > 0 && (
                                        <span className="text-zinc-500 block text-xs mt-0.5 ml-4 border-l-2 border-zinc-700 pl-2">
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
    );
}
