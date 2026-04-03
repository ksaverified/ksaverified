import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    Shield, LayoutDashboard, Users, Globe, MessageSquare,
    BarChart2, Map, BookOpen, Terminal, Settings, LogOut, ChevronLeft, Bot, Award, Search, CloudLightning
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/admin-v2', label: 'Strategy Hub', icon: LayoutDashboard, exact: true },
    { path: '/admin-v2/pipeline', label: 'Pipeline', icon: Users },
    { path: '/admin-v2/agents', label: 'Agent Operations', icon: CloudLightning },
    { path: '/admin-v2/websites', label: 'Websites', icon: Globe },
    { path: '/admin-v2/seo', label: 'Global SEO', icon: Search },
    { path: '/admin-v2/whatsapp', label: 'WhatsApp CX', icon: MessageSquare },
    { path: '/admin-v2/sales', label: 'Sales Force', icon: Award },
    { path: '/admin-v2/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/admin-v2/map', label: 'Map View', icon: Map },
    { path: '/admin-v2/answers', label: 'AI Answers', icon: BookOpen },
    { path: '/admin-v2/assistant', label: 'Admin Assistant', icon: Bot },
    { path: '/admin-v2/logs', label: 'System Logs', icon: Terminal },
    { path: '/admin-v2/settings', label: 'Settings', icon: Settings },
];

export default function V2Shell() {
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
            <aside className="w-56 flex-shrink-0 glass-sidebar flex flex-col sticky top-0 h-screen">
                {/* Logo */}
                <div className="px-4 py-5 flex items-center gap-2.5 border-b border-obsidian-surface-high/20">
                    <div className="w-8 h-8 rounded-lg bg-obsidian-surface-highest flex items-center justify-center flex-shrink-0 amber-glow border border-amber-500/30">
                        <Shield className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-none tracking-tight">KSA Verified</p>
                        <p className="text-[9px] text-amber-500/80 font-bold tracking-[0.2em] uppercase leading-none mt-1">Orchestrator</p>
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
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all text-sm group
                                    ${active
                                        ? 'bg-amber-500/10 text-amber-400 font-semibold'
                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-obsidian-surface-high/40'}`}
                            >
                                <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-amber-500' : 'group-hover:text-amber-400'}`} />
                                {item.label}
                                {active && <div className="ml-auto w-1 h-4 bg-amber-500/80 rounded-full" />}
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
                <Outlet />
            </main>
        </div>
    );
}
