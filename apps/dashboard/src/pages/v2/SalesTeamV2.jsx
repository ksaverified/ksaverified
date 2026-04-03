import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Wallet, History, Search, 
    Filter, ArrowUpRight, CheckCircle2, 
    XCircle, Clock, DollarSign,
    MoreHorizontal, Shield, ChevronRight,
    TrendingUp, Award, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalesTeamV2 = () => {
    const navigate = useNavigate();
    const [team, setTeam] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('team'); // 'team', 'withdrawals', 'verifications'
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [respTeam, respWithdrawals, respVerifications] = await Promise.all([
                fetch('/api/sfa?action=get-sales-team'),
                fetch('/api/sfa?action=get-withdrawals'),
                fetch('/api/sfa?action=get-payment-verifications')
            ]);
            const dataTeam = await respTeam.json();
            const dataWithdrawals = await respWithdrawals.json();
            const dataVerifications = await respVerifications.json();
            
            setTeam(dataTeam.team || []);
            setWithdrawals(dataWithdrawals.withdrawals || []);
            setVerifications(dataVerifications.verifications || []);
        } catch (e) {
            console.error('Failed to fetch admin sfa data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessWithdrawal = async (id, status) => {
        setProcessingId(id);
        try {
            const resp = await fetch('/api/sfa?action=process-withdrawal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const data = await resp.json();
            if (data.success) {
                fetchData();
            }
        } catch (e) {
            console.error('Failed to process withdrawal', e);
        } finally {
            setProcessingId(null);
        }
    };

    const handleProcessVerification = async (id, status) => {
        setProcessingId(`v_${id}`);
        try {
            const resp = await fetch('/api/sfa?action=process-payment-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const data = await resp.json();
            if (data.success) {
                fetchData();
            }
        } catch (e) {
            console.error('Failed to process verification', e);
        } finally {
            setProcessingId(null);
        }
    };

    const stats = {
        totalReps: team.length,
        pendingPayouts: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0),
        payoutCount: withdrawals.filter(w => w.status === 'pending').length,
        pendingVerifications: verifications.filter(v => v.status === 'pending').length,
        totalEarned: team.reduce((sum, s) => sum + (Number(s.total_earned) || 0), 0)
    };

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-obsidian-bg/80 backdrop-blur-2xl flex-shrink-0">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <Shield className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white leading-none tracking-tight uppercase">Sales Force</p>
                            <p className="text-[10px] text-amber-500 font-bold tracking-[0.2em] uppercase leading-none mt-1.5">Management Matrix</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={fetchData}
                            className="p-2 rounded-xl bg-obsidian-surface-high border border-white/5 hover:bg-obsidian-surface-highest transition-all"
                        >
                            <History className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-6 py-8 max-w-[1600px] mx-auto space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard label="Active Representatives" value={stats.totalReps} icon={Users} color="#f59e0b" />
                    <MetricCard label="Pending Payouts" value={stats.pendingPayouts} sub="SAR" icon={Wallet} color="#6366f1" highlight={stats.pendingPayouts > 0} />
                    <MetricCard label="Request Queue" value={stats.payoutCount} sub="PENDING" icon={Clock} color="#8b5cf6" />
                    <MetricCard label="Total Commission" value={stats.totalEarned} sub="SAR" icon={Award} color="#10b981" />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-obsidian-surface-lov rounded-2xl p-1 border border-white/5 w-fit">
                    <button 
                        onClick={() => setActiveTab('team')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'team' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Sales Team
                    </button>
                    <button 
                        onClick={() => setActiveTab('withdrawals')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'withdrawals' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Payout Queue {stats.payoutCount > 0 && `(${stats.payoutCount})`}
                    </button>
                    <button 
                        onClick={() => setActiveTab('verifications')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'verifications' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Verifications {stats.pendingVerifications > 0 && `(${stats.pendingVerifications})`}
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                            <div className="w-12 h-12 rounded-full border-t-2 border-amber-500 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Workforce Data</p>
                        </div>
                    ) : activeTab === 'team' ? (
                        <motion.div 
                            key="team"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-obsidian-surface-high/30">
                                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Representative</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Claims</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Visits</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Earned</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Balance</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {team.map(s => (
                                            <tr key={s.id} className="hover:bg-white/5 transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-black uppercase shadow-inner border border-white/5">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{s.name}</p>
                                                            <p className="text-[10px] text-zinc-500 font-medium">+{s.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-black font-mono text-zinc-400 px-2 py-1 rounded-lg bg-obsidian-surface-high border border-white/5">{s?.stats?.claims || 0}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-black font-mono text-zinc-400 px-2 py-1 rounded-lg bg-obsidian-surface-high border border-white/5">{s?.stats?.visits || 0}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-black text-zinc-100 uppercase tracking-tighter">{s.total_earned} <span className="text-[10px] text-zinc-500">SAR</span></p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-black text-amber-500 uppercase tracking-tighter glow-text-amber">{s.balance} <span className="text-[10px] text-zinc-500">SAR</span></p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-600 hover:text-zinc-300 transition-all">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : activeTab === 'withdrawals' ? (
                        <motion.div 
                            key="withdrawals"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            {withdrawals.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {withdrawals.map(w => (
                                        <div key={w.id} className="glass-card rounded-3xl p-6 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${w.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : w.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} border border-white/5`}>
                                                    <DollarSign className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-lg font-black text-white uppercase tracking-tighter">{w.amount} SAR</p>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${w.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                                            {w.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                        Request by <span className="text-zinc-300">{w.salesmen?.name}</span> • {new Date(w.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {w.status === 'pending' && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleProcessWithdrawal(w.id, 'completed')}
                                                        disabled={processingId === w.id}
                                                        className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-500/20"
                                                    >
                                                        Confirm Payout
                                                    </button>
                                                    <button 
                                                        onClick={() => handleProcessWithdrawal(w.id, 'rejected')}
                                                        disabled={processingId === w.id}
                                                        className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                                    <Clock className="w-12 h-12" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Queue Empty — No Active Requests</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="verifications"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            {verifications.length > 0 ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {verifications.map(v => (
                                        <div key={v.id} className="glass-card rounded-3xl p-6 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group bg-obsidian-surface-high/30">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${v.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : v.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-lg font-black text-white leading-none tracking-tight">{v.leads?.name || 'Unknown Lead'}</p>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${v.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-zinc-500'}`}>
                                                            {v.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 flex gap-4">
                                                        <span>Claimed: <strong className="text-white">{v.amount_claimed} SAR</strong></span>
                                                        <span>Comm: <strong className="text-amber-500">{v.commission_amount} SAR</strong></span>
                                                    </p>
                                                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">
                                                        By <strong className="text-zinc-400">{v.salesmen?.name}</strong> • {new Date(v.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {v.status === 'pending' && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleProcessVerification(v.id, 'approved')}
                                                        disabled={processingId === `v_${v.id}`}
                                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleProcessVerification(v.id, 'rejected')}
                                                        disabled={processingId === `v_${v.id}`}
                                                        className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                        title="Reject & Revert to Warmed"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                                    <CheckCircle2 className="w-12 h-12" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Queue Empty — No Active Verifications</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
};

const MetricCard = ({ label, value, sub, color = '#f59e0b', icon: Icon, highlight }) => (
    <div className={`flex flex-col gap-2 p-5 rounded-3xl border transition-all group ${highlight ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'bg-obsidian-surface-high/30 border-white/5 hover:border-white/10'}`}>
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-obsidian-surface-low shadow-inner border border-white/5`}>
                <Icon className="w-4 h-4 opacity-70" style={{ color }} />
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white tracking-tighter group-hover:text-amber-400 transition-colors uppercase">{value ?? '—'}</span>
            {sub && <span className="text-[10px] text-zinc-500 font-bold uppercase opacity-60">{sub}</span>}
        </div>
    </div>
);

export default SalesTeamV2;
