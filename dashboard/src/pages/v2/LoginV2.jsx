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
        <div className="min-h-screen bg-[#080a0f] flex font-['Inter',sans-serif]">
            {/* ── LEFT: LOGIN FORM ──────────────────────────────────────── */}
            <div className="flex flex-col justify-center px-12 w-full max-w-md relative z-10">
                {/* Subtle background glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04),transparent_70%)] pointer-events-none" />

                {/* Logo */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Shield className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-white leading-tight">KSA Verified</p>
                        <p className="text-[10px] text-amber-500 font-bold tracking-[0.2em] uppercase">AI Command Center</p>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                    <p className="text-sm text-zinc-500">Sign in to access your workspace</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Work Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@ksaverified.com"
                            required
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all pr-10"
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                    >
                        {loading ? 'Signing in...' : (<>Sign in to Workspace <ArrowRight className="w-4 h-4" /></>)}
                    </button>
                </form>

                {/* Role pills */}
                <div className="mt-8">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-2">Supported Access Roles</p>
                    <div className="flex gap-2">
                        {ROLE_PILLS.map(r => (
                            <span key={r.label} className={`text-[11px] font-semibold border rounded-full px-2.5 py-1 ${r.color}`}>
                                {r.label}
                            </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-700 mt-3">
                        Access is role-based. You'll be directed to your workspace automatically.
                    </p>
                </div>
            </div>

            {/* ── RIGHT: PREVIEW PANEL ─────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden border-l border-zinc-800/60">
                {/* Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.06),transparent_50%)]" />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative h-full flex flex-col justify-center px-12 py-12">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-8">Live System Preview</p>

                    {/* Floating stat cards */}
                    <div className="space-y-4 mb-8">
                        {PREVIEW_STATS.map((stat, i) => (
                            <div key={stat.label}
                                className={`flex items-center gap-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm shadow-lg ${i === 1 ? 'ml-8' : i === 2 ? 'ml-4' : ''} max-w-xs`}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: stat.color + '20' }}>
                                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-xl font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mini agent status preview */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm max-w-xs">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Agent Status</p>
                        <div className="space-y-2">
                            {[{ name: 'Scout', active: true }, { name: 'Creator', active: true }, { name: 'Publisher', active: false, error: true }, { name: 'Chatbot', active: true }].map(a => (
                                <div key={a.name} className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${a.error ? 'bg-red-500' : a.active ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                                    <span className={`text-xs ${a.error ? 'text-red-400' : a.active ? 'text-zinc-300' : 'text-zinc-600'}`}>{a.name}</span>
                                    <span className={`ml-auto text-[10px] ${a.error ? 'text-red-500' : a.active ? 'text-emerald-500' : 'text-zinc-700'}`}>
                                        {a.error ? 'ERROR' : a.active ? 'ACTIVE' : 'IDLE'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
