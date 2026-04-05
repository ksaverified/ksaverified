import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Bot, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function AgentFleet() {
    const [agentLogs, setAgentLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(50);
            if (data) setAgentLogs(data);
        };
        fetchLogs();
    }, []);

    const agents = [
        { name: 'Scout Agent', status: 'Online', role: 'Finds Map Gaps' },
        { name: 'Creator Agent', status: 'Online', role: 'Generates Content' },
        { name: 'Publisher Agent', status: 'Online', role: 'Deploys to Vercel' },
        { name: 'Closer Agent', status: 'Online', role: 'WhatsApp Outreach' },
    ];

    return (
        <div className="p-8 h-full">
            <div className="max-w-[1200px] mx-auto space-y-10">
                
                <section>
                    <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2"><Bot className="text-indigo-400" /> Fleet Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {agents.map((agent, idx) => (
                            <div key={idx} className="glass-card rounded-2xl p-5 border border-white/5 bg-obsidian-surface-high">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                </div>
                                <h3 className="font-black text-lg">{agent.name}</h3>
                                <p className="text-xs text-zinc-500 font-bold uppercase mt-1">{agent.role}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2"><Activity className="text-emerald-400" /> Recent Operations</h2>
                    <div className="glass-card rounded-[24px] overflow-hidden border border-white/5">
                        <table className="w-full text-left">
                            <thead className="bg-obsidian-surface-high">
                                <tr>
                                    <th className="p-4 text-[10px] uppercase font-black tracking-widest text-zinc-500">Time</th>
                                    <th className="p-4 text-[10px] uppercase font-black tracking-widest text-zinc-500">Agent</th>
                                    <th className="p-4 text-[10px] uppercase font-black tracking-widest text-zinc-500">Action</th>
                                    <th className="p-4 text-[10px] uppercase font-black tracking-widest text-zinc-500 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {agentLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-xs font-bold text-zinc-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                                        <td className="p-4 text-xs font-black text-indigo-400 uppercase">{log.agent}</td>
                                        <td className="p-4 text-xs text-zinc-300">{log.action || log.message}</td>
                                        <td className="p-4 text-center flex justify-center">
                                            {log.status === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
