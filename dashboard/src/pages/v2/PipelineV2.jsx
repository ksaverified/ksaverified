import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Phone, MapPin, Eye, CheckCircle, X, Search, ArrowRight } from 'lucide-react';
import V2Shell from './V2Shell';

const STAGES = [
    { key: 'created', label: 'Scouted', color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    { key: 'website_created', label: 'Site Created', color: '#8b5cf6', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    { key: 'replied', label: 'Replied', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    { key: 'interested', label: 'Interested', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { key: 'closed', label: 'Closed', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
];

const ALL_STATUSES = STAGES.map(s => s.key);

function getStage(key) {
    return STAGES.find(s => s.key === key) || { color: '#52525b', bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-400', label: key };
}

export default function PipelineV2() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modal, setModal] = useState(null); // { lead }
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
        <V2Shell>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-400" /> Lead Pipeline
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{leads.length} total leads across {STAGES.length} stages</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search leads..."
                                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-56"
                            />
                        </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
                            <option value="all">All Stages</option>
                            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Kanban View */}
                {loading ? (
                    <div className="h-96 flex items-center justify-center text-zinc-500 animate-pulse">Loading pipeline...</div>
                ) : statusFilter !== 'all' ? (
                    /* Table view for filtered */
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                    <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Business</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Phone</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {filtered.map(lead => {
                                    const stage = getStage(lead.status);
                                    return (
                                        <tr key={lead.place_id} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-zinc-200">{lead.name}</p>
                                                <p className="text-[11px] text-zinc-600 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3" />{lead.address?.slice(0, 40) || '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-zinc-400 flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-zinc-600" />{lead.phone || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${stage.bg} ${stage.border} ${stage.text}`}>
                                                    {stage.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {lead.status === 'pitched' && (
                                                        <button onClick={() => { setUnlockModal(lead); setUnlockDate(new Date().toISOString().split('T')[0]); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded-lg transition-all">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Verify Payment
                                                        </button>
                                                    )}
                                                    {lead.vercel_url && (
                                                        <a href={lead.vercel_url} target="_blank" rel="noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-all">
                                                            <Eye className="w-3.5 h-3.5" /> Live Site
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
                            <div className="py-16 text-center text-zinc-500">No leads in this stage</div>
                        )}
                    </div>
                ) : (
                    /* Kanban board */
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {STAGES.map(stage => {
                            const stageLeads = byStage[stage.key] || [];
                            return (
                                <div key={stage.key} className="flex-shrink-0 w-[220px]">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <span className="text-xs font-bold text-zinc-400">{stage.label}</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: stage.color + '20', color: stage.color }}>
                                            {stageLeads.length}
                                        </span>
                                    </div>
                                    <div className="h-0.5 rounded-full mb-3" style={{ backgroundColor: stage.color + '50' }} />
                                    <div className="space-y-2">
                                        {stageLeads.slice(0, 10).map(lead => (
                                            <div key={lead.place_id}
                                                className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group"
                                                onClick={() => setModal(lead)}>
                                                <p className="text-xs font-semibold text-zinc-300 group-hover:text-white truncate">{lead.name}</p>
                                                <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                                                    <Phone className="w-2.5 h-2.5" />
                                                    {lead.phone ? `${lead.phone.slice(-4)}` : 'No phone'}
                                                </p>
                                                {lead.vercel_url && (
                                                    <span className="text-[9px] text-indigo-400 mt-1 block truncate">{lead.vercel_url.replace('https://', '')}</span>
                                                )}
                                            </div>
                                        ))}
                                        {stageLeads.length > 10 && (
                                            <div className="text-[10px] text-zinc-600 text-center py-1">+{stageLeads.length - 10} more</div>
                                        )}
                                        {stageLeads.length === 0 && (
                                            <div className="py-6 text-center text-[11px] text-zinc-700 border border-dashed border-zinc-800 rounded-lg">
                                                Empty
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lead Detail Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setModal(null)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">{modal.name}</h3>
                                <p className="text-sm text-zinc-500 mt-0.5">{modal.address}</p>
                            </div>
                            <button onClick={() => setModal(null)} className="text-zinc-500 hover:text-white transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                <span className="text-xs text-zinc-500">Phone</span>
                                <span className="text-sm text-zinc-200">{modal.phone || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                <span className="text-xs text-zinc-500">Status</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStage(modal.status).bg} ${getStage(modal.status).text} ${getStage(modal.status).border} border`}>
                                    {getStage(modal.status).label}
                                </span>
                            </div>
                            {modal.vercel_url && (
                                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                    <span className="text-xs text-zinc-500">Live Site</span>
                                    <a href={modal.vercel_url} target="_blank" rel="noreferrer"
                                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                                        View <ArrowRight className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                            {modal.login_count > 0 && (
                                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                    <span className="text-xs text-zinc-500">Client Logins</span>
                                    <span className="text-xs text-emerald-400 font-bold">{modal.login_count} logins</span>
                                </div>
                            )}
                        </div>
                        {modal.status === 'pitched' && (
                            <button onClick={() => { setUnlockModal(modal); setModal(null); setUnlockDate(new Date().toISOString().split('T')[0]); }}
                                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-all">
                                <CheckCircle className="w-4 h-4" /> Verify Payment & Unlock
                            </button>
                        )}
                    </div>
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
        </V2Shell>
    );
}
