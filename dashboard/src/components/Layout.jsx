import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Settings, Zap } from 'lucide-react';

const Layout = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Overview' },
        { to: '/pipeline', icon: Users, label: 'Pipeline' },
        { to: '/logs', icon: Activity, label: 'Live Logs' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    const handleTrigger = async () => {
        try {
            // In production, this would call our /api/trigger endpoint or a Supabase Edge Function
            alert('Manually triggered agent cycle. Check Live Logs tab to monitor progress!');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-zinc-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Drop Servicing
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">SaaS Pipeline Dashboard</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={handleTrigger}
                        className="w-full py-3 px-4 bg-primary hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Zap className="h-4 w-4 fill-current" />
                        Trigger Pipeline
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[#0a0a0b] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))]">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
