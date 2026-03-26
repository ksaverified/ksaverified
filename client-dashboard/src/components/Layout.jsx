import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { supabase } from '../lib/supabase';
import {
    User,
    CreditCard,
    LogOut,
    Menu,
    X,
    Globe,
    Languages,
    Search,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
    const { user } = useAuth();
    const { lang, toggleLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: t('nav.website'), href: '/my-website', icon: Globe },
        { name: t('nav.editor'), href: '/editor', icon: Menu }, // Using Menu icon for editor for now
        { name: t('nav.seo'), href: '/seo', icon: Search },
        { name: t('nav.profile'), href: '/profile', icon: User },
        { name: t('nav.payment'), href: '/payment', icon: CreditCard },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-obsidian-dark flex relative overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex w-72 flex-col glass-sidebar p-6 overflow-y-auto z-10">
                <Link to="/my-website" className="flex items-center gap-3 px-2 mb-10 transition-opacity hover:opacity-80">
                    <img src="/logo.png" alt="KSA Verified" className="h-9 w-9 object-contain mb-0.5" />
                    <div>
                        <h1 className="text-lg font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent leading-none">
                            KSA Verified
                        </h1>
                        <p className="text-[10px] text-amber-500/60 uppercase tracking-[0.3em] font-black mt-1">Portal</p>
                    </div>
                </Link>

                <nav className="flex-1 space-y-1.5">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black italic uppercase text-[11px] tracking-widest'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5 font-bold text-[11px] uppercase tracking-widest'
                                }`
                            }
                        >
                            <item.icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-amber-500'}`} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                    {/* Language Switcher */}
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Languages className="h-4 w-4 text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'English' : 'العربية'}</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {lang.toUpperCase()}
                        </span>
                    </button>

                    <div className="bg-obsidian-surface-highest/30 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                            <User className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{user?.email?.split('@')[0]}</p>
                            <p className="text-[9px] text-zinc-500 font-bold truncate tracking-tighter">{user?.email}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => window.location.href = '/admin-v2'}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-500 hover:text-amber-500 hover:bg-amber-500/5 transition-all text-[10px] font-black uppercase tracking-widest mt-auto mb-2 border border-dashed border-white/5"
                    >
                        <Shield className="w-3.5 h-3.5" /> Back to Admin
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-all duration-200 group border border-transparent hover:border-red-500/10"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.signOut')}</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0c10]/80 backdrop-blur-xl border-b border-white/5 z-50 px-4 flex items-center justify-between">
                <Link to="/my-website" className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="KSA Verified" className="h-7 w-7 object-contain mb-0.5" />
                    <div>
                        <span className="text-sm font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent leading-none">KSA Verified</span>
                    </div>
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleLanguage}
                        className="p-2 text-zinc-400 hover:text-white font-bold text-xs flex items-center gap-1.5"
                    >
                        <Languages className="h-4 w-4" />
                        {lang.toUpperCase()}
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: lang === 'ar' ? 100 : -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: lang === 'ar' ? 100 : -100 }}
                        className="lg:hidden fixed inset-0 top-16 bg-[#0a0c10]/95 backdrop-blur-2xl z-40 p-6 flex flex-col"
                    >
                        <nav className="space-y-2">
                            {navigation.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-zinc-400'
                                        }`
                                    }
                                >
                                    <item.icon className="h-6 w-6" />
                                    <span className="text-lg font-medium">{item.name}</span>
                                </NavLink>
                            ))}
                        </nav>
                        <button
                            onClick={handleLogout}
                            className="mt-auto flex items-center gap-3 px-4 py-4 rounded-xl text-zinc-400 border border-zinc-800"
                        >
                            <LogOut className="h-6 w-6" />
                            <span className="text-lg font-medium">{t('nav.signOut')}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0 overflow-hidden relative">
                <div className="flex-1 overflow-auto p-4 lg:p-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
