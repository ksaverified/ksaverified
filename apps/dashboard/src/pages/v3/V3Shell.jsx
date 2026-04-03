import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    Map, Target, Bot, Activity, LogOut, ChevronLeft, Shield, Radar, ListTree
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/admin-v3', label: 'Map Radar', icon: Radar, exact: true },
    { path: '/admin-v3/scores', label: 'Leads & Scores', icon: ListTree },
    { path: '/admin-v3/fleet', label: 'Agent Fleet', icon: Bot },
    { path: '/admin-v3/ecosystem', label: 'Ecosystem', icon: Activity },
];

export default function V3Shell() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login-v2');
    };

    return (
        <div className="min-h-screen bg-obsidian-bg text-white font-['Inter',sans-serif] flex">
            {/* ── SIDEBAR ─────────────────────────────────────────────── */}
            <aside className="w-64 flex-shrink-0 glass-sidebar flex flex-col sticky top-0 h-screen z-50">
                {/* Logo */}
                <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20">
                        <Map className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-base font-black text-white leading-none tracking-tight">Strategy V3</p>
                        <p className="text-[10px] text-indigo-400 font-black tracking-[0.2em] uppercase leading-none mt-1.5">Map & Gap Core</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map(item => {
                        const active = isActive(item);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all text-sm group
                                    ${active
                                        ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20'
                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'}`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-indigo-400' : 'group-hover:text-indigo-300'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User footer */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={() => navigate('/admin-v2')}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all text-xs font-semibold"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Legacy Dashboard
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-semibold"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 h-screen overflow-hidden bg-obsidian-surface-highest">
                <Outlet />
            </main>
        </div>
    );
}
