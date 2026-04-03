import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Phone, MapPin, Eye, CheckCircle, X, Search, ArrowRight } from 'lucide-react';

const STAGES = [
    { key: 'scouted', label: 'Scouted', color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    { key: 'published', label: 'Published', color: '#8b5cf6', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    { key: 'warmed', label: 'Warmed', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    { key: 'interest_confirmed', label: 'Interested', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { key: 'completed', label: 'Closed', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
];

const ALL_STATUSES = STAGES.map(s => s.key);

function getStage(key) {
    return STAGES.find(s => s.key === key) || { color: '#52525b', bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-400', label: key };
}

export default function PipelineV2() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [unlockModal, setUnlockModal] = useState(null);
    const [unlockDate, setUnlockDate] = useState('');
    const [unlockTier, setUnlockTier] = useState('monthly');

    useEffect(() => {
        fetchLeads();
        const ch = supabase.channel('v2:pipeline')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    async function fetchLeads() {
        try {
            const { data } = await supabase.from('leads').select('*').order('updated_at', { ascending: false }).limit(300);
            if (data) setLeads(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const filtered = leads.filter(l => {
        const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.address?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || l.status === statusFilter || (!ALL_STATUSES.includes(l.status) && statusFilter === 'other');
        return matchSearch && matchStatus;
    });

    const byStage = STAGES.reduce((acc, s) => {
        acc[s.key] = filtered.filter(l => l.status === s.key);
        return acc;
    }, {});

    const handleUnlock = async () => {
        if (!unlockDate) return;
        try {
            const res = await fetch('/api/portal?action=unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: unlockModal.place_id, payment_date: unlockDate, tier: unlockTier })
            });
            if (!res.ok) throw new Error('Failed');
            setUnlockModal(null);
            fetchLeads();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    return (
        <>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                            <Users className="w-6 h-6 text-amber-500" /> Lead Pipeline
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">{leads.length} total leads across {STAGES.length} stages</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search leads..."
                                className="pl-9 pr-4 py-2 bg-obsidian-surface-low border border-obsidian-surface-high/30 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 w-64 transition-all"
                            />
                        </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-obsidian-surface-low border border-obsidian-surface-high/30 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 transition-all">
                            <option value="all">All Stages</option>
                            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main View */}
                {loading ? (
                    <div className="h-96 flex items-center justify-center text-zinc-500 animate-pulse">Loading pipeline...</div>
                ) : statusFilter !== 'all' ? (
                    /* Table view for filtered */
                    <div className="rounded-2xl border border-obsidian-surface-high/20 bg-obsidian-surface-lowest/40 overflow-hidden glass-card">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-obsidian-surface-high/20 bg-obsidian-surface-low/50">
                                    <th className="px-6 py-4 text-xs font-bold text-amber-500/80 uppercase tracking-[0.15em]">Business</th>
                                    <th className="px-6 py-4 text-xs font-bold text-amber-500/80 uppercase tracking-[0.15em]">Phone</th>
                                    <th className="px-6 py-4 text-xs font-bold text-amber-500/80 uppercase tracking-[0.15em]">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-amber-500/80 uppercase tracking-[0.15em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-surface-high/10">
                                {filtered.map(lead => {
                                    const stage = getStage(lead.status);
                                    return (
                                        <tr key={lead.place_id} className="hover:bg-obsidian-surface-high/30 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/admin-v2/pipeline/${lead.place_id}`)}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-zinc-100 group-hover:text-amber-200 transition-colors">{lead.name}</p>
                                                <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-amber-500/40" />{lead.address?.slice(0, 40) || '—'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-zinc-400 flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-obsidian-surface-highest" />{lead.phone || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stage.bg} ${stage.border} ${stage.text} uppercase tracking-wider`}>
                                                    {stage.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    {lead.status === 'pitched' && (
                                                        <button onClick={(e) => { e.stopPropagation(); setUnlockModal(lead); setUnlockDate(new Date().toISOString().split('T')[0]); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wide">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Verify
                                                        </button>
                                                    )}
                                                    {lead.vercel_url && (
                                                        <a href={lead.vercel_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-surface-high hover:bg-obsidian-surface-highest text-zinc-200 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wide">
                                                            <Eye className="w-3.5 h-3.5" /> Live
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="py-16 text-center text-zinc-500">No leads match your filter</div>
                        )}
                    </div>
                ) : (
                    /* Kanban board */
                    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
                        {STAGES.map(stage => {
                            const stageLeads = byStage[stage.key] || [];
                            return (
                                <div key={stage.key} className="flex-shrink-0 w-[260px] flex flex-col">
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{stage.label}</span>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-obsidian-surface-high/40 text-zinc-400">
                                            {stageLeads.length}
                                        </span>
                                    </div>
                                    <div className="flex-1 space-y-3 min-h-[500px] p-2 rounded-2xl bg-obsidian-surface-low/20 border border-obsidian-surface-high/5">
                                        {stageLeads.slice(0, 15).map(lead => (
                                            <div key={lead.place_id}
                                                className="p-4 rounded-xl bg-obsidian-surface-low/50 border border-obsidian-surface-high/10 hover:border-amber-500/30 hover:bg-obsidian-surface-high/40 transition-all cursor-pointer group shadow-lg"
                                                onClick={() => navigate(`/admin-v2/pipeline/${lead.place_id}`)}>
                                                <p className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors truncate">{lead.name}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3 text-obsidian-surface-highest" />
                                                        {lead.phone ? `${lead.phone.slice(-4)}` : 'N/A'}
                                                    </p>
                                                    {lead.vercel_url && (
                                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Site Published" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {stageLeads.length > 15 && (
                                            <div className="text-[10px] text-zinc-600 text-center py-2 font-bold uppercase tracking-tight">
                                                + {stageLeads.length - 15} more in stack
                                            </div>
                                        )}
                                        {stageLeads.length === 0 && (
                                            <div className="py-12 flex flex-col items-center justify-center text-[10px] text-zinc-700 font-bold uppercase tracking-widest border border-dashed border-obsidian-surface-high/20 rounded-xl space-y-2">
                                                <Users className="w-4 h-4 opacity-20" />
                                                <span>No Leads</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Unlock Modal */}
                {unlockModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Verify Payment</h3>
                                <button onClick={() => setUnlockModal(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-zinc-400 mb-4">Confirming payment for: <span className="text-emerald-400 font-medium">{unlockModal.name}</span></p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-zinc-400 block mb-1">Payment Date</label>
                                    <input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400 block mb-1">Subscription Tier</label>
                                    <select value={unlockTier} onChange={e => setUnlockTier(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                                        <option value="monthly">Monthly — 99 SAR / 30 Days</option>
                                        <option value="yearly">Yearly — 990 SAR / 365 Days</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => setUnlockModal(null)} className="flex-1 py-2.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-xl transition-all">Cancel</button>
                                <button onClick={handleUnlock} className="flex-1 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all">
                                    Confirm & Unlock
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
