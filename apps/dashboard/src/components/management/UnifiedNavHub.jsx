import React from 'react';
import { Link } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Target, 
    History, 
    Users, 
    ShoppingCart, 
    Globe, 
    ExternalLink 
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Boss Command', icon: LayoutDashboard, to: '/boss', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Pipeline (V3)', icon: Target, to: '/admin-v3', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Legacy Ops (V2)', icon: History, to: '/admin-v2', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Sales Force', icon: Users, to: '/sales', color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

const EXTERNAL_ITEMS = [
    { label: 'Customer Portal', icon: ShoppingCart, href: '/customers', color: 'text-zinc-400' },
    { label: 'Corporate Site', icon: Globe, href: 'https://ksaverified.com', color: 'text-zinc-400' },
];

export default function UnifiedNavHub() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {NAV_ITEMS.map((item) => (
                <Link 
                    key={item.to} 
                    to={item.to}
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-800/50 transition-all duration-300"
                >
                    <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-zinc-100">{item.label}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Switch Console</p>
                    </div>
                </Link>
            ))}

            <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                {EXTERNAL_ITEMS.map((item) => (
                    <a 
                        key={item.label} 
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800/30 hover:bg-zinc-800/30 transition-all text-center group"
                    >
                        <item.icon className={`w-5 h-5 ${item.color} group-hover:text-white transition-colors`} />
                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300">{item.label}</span>
                    </a>
                ))}
            </div>
        </section>
    );
}
