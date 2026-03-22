import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Shield, Eye, EyeOff, ArrowRight, Zap, Users, MessageSquare } from 'lucide-react';

const ROLE_PILLS = [
    { label: 'Admin', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { label: 'Sales Agent', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { label: 'Client', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
];

const PREVIEW_STATS = [
    { label: 'Total Leads', value: '497', icon: Users, color: '#6366f1' },
    { label: 'AI Conversations', value: '1,085', icon: MessageSquare, color: '#10b981' },
    { label: 'Agents Active', value: '4', icon: Zap, color: '#f59e0b' },
];

export default function LoginV2() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;

            // Role-based routing
            const role = data.user?.user_metadata?.role;
            if (role === 'sales') {
                navigate('/sales');
            } else if (role === 'client') {
                navigate('/portal');
            } else {
                // Default: admin → new orchestrator dashboard
                navigate('/admin-v2');
            }
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian-dark flex font-['Inter',sans-serif] relative overflow-hidden">
            {/* Grain/Noise overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-50 transition-opacity duration-1000" />
            
            {/* ── LEFT: LOGIN FORM ──────────────────────────────────────── */}
            <div className="flex flex-col justify-center px-16 w-full max-w-xl relative z-10 bg-obsidian-dark/50 backdrop-blur-3xl border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
                {/* Subtle background glow */}
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />

                {/* Logo */}
                <div className="flex items-center gap-4 mb-16 group cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-500 transform group-hover:rotate-6">
                        <Shield className="w-7 h-7 text-black stroke-[2.5]" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white leading-tight tracking-tighter uppercase italic">KSA Verified</p>
                        <p className="text-[10px] text-amber-500 font-black tracking-[0.4em] uppercase opacity-80">Latent Command Center</p>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Identity Verification</h1>
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">Initialize secure session to access the neural cloud</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-6 max-w-sm">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Access Principal</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="OPERATOR ID..."
                            required
                            className="w-full bg-obsidian-surface-medium/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 transition-all uppercase tracking-widest"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Cryptographic Key</label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-obsidian-surface-medium/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder-zinc-800 focus:outline-none focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 transition-all pr-12"
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-amber-500 transition-colors">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-4 animate-shake">
                            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-black text-[11px] uppercase tracking-[0.2em] py-4.5 rounded-2xl transition-all shadow-xl shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95 group/btn"
                    >
                        {loading ? 'Decrypting...' : (<>Initialize Sequence <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>)}
                    </button>
                </form>

                {/* Role pills */}
                <div className="mt-16 pt-8 border-t border-white/5 max-w-sm">
                    <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.3em] mb-4 opacity-50 text-center">Protocol Permissions Matrix</p>
                    <div className="flex justify-center gap-3">
                        {ROLE_PILLS.map(r => (
                            <span key={r.label} className={`text-[9px] font-black uppercase tracking-widest border rounded-full px-4 py-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default ${r.color}`}>
                                {r.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT: PREVIEW PANEL ─────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden bg-obsidian-dark">
                {/* Background effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(245,158,11,0.08),transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.05),transparent_70%)]" />
                
                {/* Visual mesh */}
                <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />

                <div className="relative h-full flex flex-col justify-center items-center px-12 py-12">
                    <div className="w-full max-w-2xl space-y-12">
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.5em] mb-4 opacity-60 text-center">Live System Telemetry</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter text-center uppercase leading-none">The Future of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Enterprise AI</span></h2>
                        </div>

                        {/* Floating glass cards */}
                        <div className="grid grid-cols-3 gap-6">
                            {PREVIEW_STATS.map((stat, i) => (
                                <div key={stat.label}
                                    className="glass-card border-t border-white/10 p-6 rounded-[2rem] flex flex-col items-center text-center group/stat hover:translate-y-[-8px] transition-all duration-500 shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover/stat:rotate-12 duration-500"
                                        style={{ backgroundColor: stat.color + '15', border: `1px solid ${stat.color}40` }}>
                                        <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                                    </div>
                                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 opacity-60">{stat.label}</p>
                                    <p className="text-2xl font-black text-white tracking-tight leading-none italic uppercase">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* High-end agent status console */}
                        <div className="glass-card border-t border-white/5 p-8 rounded-[3rem] shadow-3xl bg-obsidian-surface-medium/30 relative overflow-hidden group/console">
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Cluster Monitoring
                                </p>
                                <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">v2.4.9-Stable</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                {[{ name: 'Scout', active: true }, { name: 'Creator', active: true }, { name: 'Publisher', active: false, error: true }, { name: 'Chatbot', active: true }].map(a => (
                                    <div key={a.name} className="flex items-center gap-4 group/agent">
                                        <div className={`w-2 h-2 rounded-full shadow-lg transition-all duration-500 group-hover/agent:scale-125 ${a.error ? 'bg-rose-500 shadow-rose-500/50' : a.active ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-800 shadow-transparent'}`} />
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${a.error ? 'text-rose-500' : a.active ? 'text-zinc-400' : 'text-zinc-800'}`}>{a.name}</span>
                                        <div className="flex-1 h-[1px] bg-white/5 mx-2" />
                                        <span className={`text-[10px] font-bold ${a.error ? 'text-rose-600' : a.active ? 'text-emerald-600' : 'text-zinc-900'} uppercase tracking-tighter italic`}>
                                            {a.error ? 'CRITICAL_FAIL' : a.active ? 'SYNCHRONIZED' : 'STANDBY'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
