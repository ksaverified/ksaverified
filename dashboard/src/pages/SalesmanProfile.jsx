import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Wallet, ArrowLeft, History, 
    TrendingUp, CheckCircle2, AlertCircle, 
    ArrowUpRight, Clock, DollarSign,
    Milestone, Target, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalesmanProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [message, setMessage] = useState(null);

    // Mock/Hardcoded salesman_id for now - in production get from Auth
    const salesmanId = 'default'; 

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const resp = await fetch(`/api/sfa?action=get-profile&salesman_id=${salesmanId}`);
            const data = await resp.json();
            if (data.success) {
                setProfile(data.profile);
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
        
        setWithdrawing(true);
        try {
            const resp = await fetch('/api/sfa?action=request-withdrawal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    salesman_id: salesmanId,
                    amount: Number(withdrawAmount)
                })
            });
            const data = await resp.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Withdrawal request submitted!' });
                setWithdrawAmount('');
                fetchProfile();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit request' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Connection error' });
        } finally {
            setWithdrawing(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-[#09090b] text-zinc-400 flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-zinc-600" />
            <p>Profile data not found.</p>
            <button onClick={() => navigate('/sales')} className="text-amber-500 underline">Return to Dashboard</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 pb-20 font-sans selection:bg-amber-500/30">
            {/* Header */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate('/sales')}
                    className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                    My Performance
                </h1>
                <div className="w-9" /> {/* Spacer */}
            </div>

            <main className="max-w-4xl mx-auto space-y-6">
                {/* Profile Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <User className="w-32 h-32" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-amber-500/20">
                            {profile.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profile.name}</h2>
                            <p className="text-zinc-400 text-sm flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Joined {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Target} label="Claims" value={profile?.stats?.total_claims || 0} color="text-blue-400" />
                        <StatCard icon={CheckCircle2} label="Visits" value={profile?.stats?.total_visits || 0} color="text-green-400" />
                        <StatCard icon={Award} label="Earned" value={`${profile?.stats?.total_earned || 0} SAR`} color="text-amber-400" />
                        <StatCard icon={Milestone} label="Rating" value={profile?.rating || 0} color="text-purple-400" />
                    </div>
                </motion.div>

                {/* Wallet & Withdrawal */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Available Commission</h3>
                        </div>

                        <div className="mb-8">
                            <div className="text-sm text-zinc-400 mb-1">Current Balance</div>
                            <div className="text-5xl font-black text-white flex items-baseline gap-2">
                                {profile?.stats?.current_balance || 0}
                                <span className="text-xl font-medium text-zinc-500">SAR</span>
                            </div>
                        </div>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Withdrawal Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">SAR</span>
                                    <input 
                                        type="number" 
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4 pl-14 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-mono text-xl"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={withdrawing || !withdrawAmount}
                                className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#09090b] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                            >
                                {withdrawing ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        Withdraw to Wallet
                                        <ArrowUpRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            
                            {message && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                                >
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <p className="text-sm">{message.text}</p>
                                </motion.div>
                            )}
                        </form>
                    </motion.div>

                    {/* Withdrawal History */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400">
                                    <History className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold">Recent Requests</h3>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {(profile?.withdrawals || []).length > 0 ? (
                                profile.withdrawals.map(w => (
                                    <div key={w.id} className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${getStatusStyle(w.status)}`}>
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{w.amount} SAR</p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {new Date(w.created_at).toLocaleDateString()} at {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${getStatusStyle(w.status)} bg-opacity-10`}>
                                            {w.status}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-10">
                                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">No withdrawal history</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="p-3 rounded-2xl bg-zinc-800/30 border border-zinc-800/50">
        <Icon className={`w-4 h-4 mb-2 ${color}`} />
        <div className="text-lg font-bold truncate">{value}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
    </div>
);

const getStatusStyle = (status) => {
    switch (status) {
        case 'completed': return 'text-green-500 bg-green-500/10';
        case 'rejected': return 'text-red-500 bg-red-500/10';
        default: return 'text-amber-500 bg-amber-500/10';
    }
};

export default SalesmanProfile;
