import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard, Radio, Map as MapIcon, Globe,
    MessageCircle, UserCheck, MessageSquare,
    BarChart3, Activity, Settings, Zap, LogOut,
    ChevronDown, Search
} from 'lucide-react';
import GlobalStatusBar from './GlobalStatusBar';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const NAV_SECTIONS = [
    {
        label: null,
        items: [
            { to: '/boss', icon: Zap, label: 'Boss Command', exact: true },
        ]
    },
    {
        label: 'Intelligence',
        color: 'text-emerald-400',
        items: [
            { to: '/boss/intelligence', icon: Radio, label: 'Gap Intelligence Hub' },
            { to: '/boss/analysis', icon: Search, label: 'Lead Analysis' },
            { to: '/boss/scorecards', icon: Activity, label: 'Lead Scorecards' },
            { to: '/boss/map', icon: MapIcon, label: 'Global Signal Scoping' },
            { to: '/boss/pipeline', icon: UserCheck, label: 'Lead Pipeline' },
        ]
    },
    {
        label: 'Assets',
        color: 'text-blue-400',
        items: [
            { to: '/boss/websites', icon: Globe, label: 'Web Assets' },
        ]
    },
    {
        label: 'System',
        color: 'text-purple-400',
        items: [
            { to: '/boss/logs', icon: Activity, label: 'Neural Diagnostics' },
        ]
    },
];

const NavItem = ({ to, icon: Icon, label, exact }) => (
    <NavLink
        to={to}
        end={exact}
        className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${isActive
                ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-sm shadow-primary/10'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`
        }
    >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
    </NavLink>
);

const Layout = () => {
    const { user } = useAuth();
    const [triggering, setTriggering] = useState(false);
    const [navCollapsed, setNavCollapsed] = useState({});

    const handleTrigger = async () => {
        if (triggering) return;
        setTriggering(true);
        try {
            const res = await fetch('/api/system?action=trigger', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to trigger');
            alert('🚀 Pipeline cycle launched! Check Live Logs for progress.');
        } catch (e) {
            console.error(e);
            alert('❌ Failed to trigger pipeline. Ensure the backend is running.');
        } finally {
            setTriggering(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const toggleSection = (label) => {
        setNavCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <aside className="w-60 bg-surface border-r border-zinc-800/80 flex flex-col shrink-0">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-zinc-800/80">
                    <Link to="/boss" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-emerald-400 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">
                                KSAV Boss
                            </h1>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-semibold">Vision Console</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {NAV_SECTIONS.map((section, si) => (
                        <div key={si} className={si > 0 ? 'pt-2' : ''}>
                            {section.label && (
                                <button
                                    onClick={() => toggleSection(section.label)}
                                    className="w-full flex items-center justify-between px-3 py-1.5 mb-1 group"
                                >
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${section.color}`}>
                                        {section.label}
                                    </span>
                                    <ChevronDown className={`h-3 w-3 text-zinc-600 transition-transform ${navCollapsed[section.label] ? '-rotate-90' : ''}`} />
                                </button>
                            )}
                            {!navCollapsed[section.label] && (
                                <div className="space-y-0.5">
                                    {section.items.map((item) => (
                                        <NavItem key={item.to} {...item} />
                                    ))}
                                </div>
                            )}
                            {si < NAV_SECTIONS.length - 1 && section.label && (
                                <div className="mt-2 border-t border-zinc-800/50" />
                            )}
                        </div>
                    ))}
                </nav>

                {/* Bottom actions */}
                <div className="px-3 pb-4 pt-2 border-t border-zinc-800/80 space-y-3">
                    <button
                        onClick={handleTrigger}
                        disabled={triggering}
                        className={`w-full py-2.5 px-4 ${triggering ? 'bg-primary/40 cursor-not-allowed' : 'bg-primary hover:bg-blue-500'} text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20`}
                    >
                        <Zap className={`h-4 w-4 fill-current ${triggering ? 'animate-pulse' : ''}`} />
                        {triggering ? 'Running...' : 'Trigger Pipeline'}
                    </button>

                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-purple-500/40 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 shrink-0">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-100 truncate">{user?.email}</p>
                            <p className="text-[10px] text-zinc-500">Administrator</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sign out"
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[#080809] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] flex flex-col">
                <GlobalStatusBar />
                <div className="p-6 flex-1 w-full max-w-screen-2xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
