import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    Shield, LayoutDashboard, Users, Globe, MessageSquare,
    BarChart2, Map, BookOpen, Terminal, Settings, LogOut, ChevronLeft
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/admin-v2', label: 'Overview', icon: LayoutDashboard, exact: true },
    { path: '/admin-v2/pipeline', label: 'Pipeline', icon: Users },
    { path: '/admin-v2/websites', label: 'Websites', icon: Globe },
    { path: '/admin-v2/whatsapp', label: 'WhatsApp CX', icon: MessageSquare },
    { path: '/admin-v2/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/admin-v2/map', label: 'Map View', icon: Map },
    { path: '/admin-v2/answers', label: 'AI Answers', icon: BookOpen },
    { path: '/admin-v2/logs', label: 'System Logs', icon: Terminal },
    { path: '/admin-v2/settings', label: 'Settings', icon: Settings },
];

export default function V2Shell({ children }) {
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
        <div className="min-h-screen bg-[#080a0f] text-white font-['Inter',sans-serif] flex">
            {/* ── SIDEBAR ─────────────────────────────────────────────── */}
            <aside className="w-56 flex-shrink-0 border-r border-zinc-800/80 bg-[#080a0f] flex flex-col sticky top-0 h-screen">
                {/* Logo */}
                <div className="px-4 py-5 flex items-center gap-2.5 border-b border-zinc-800/60">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-none">KSA Verified</p>
                        <p className="text-[9px] text-amber-500 font-bold tracking-widest uppercase leading-none mt-0.5">Orchestrator</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(item => {
                        const active = isActive(item);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-sm
                                    ${active
                                        ? 'bg-amber-500/15 text-amber-400 font-semibold'
                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'}`}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User footer */}
                <div className="px-3 py-3 border-t border-zinc-800/60 space-y-1">
                    <button
                        onClick={() => navigate('/admin-v2')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 transition-all text-xs"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back to Overview
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {user?.email?.split('@')[0]} · Sign out
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
