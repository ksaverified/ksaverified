import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
    const { user } = useAuth();
    const { lang, t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || '');
            setEmail(user.email || '');
            setPhone(user.user_metadata?.phone || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const updates = {
                data: { name, phone }
            };

            if (email !== user.email && !email.endsWith('.local')) {
                updates.email = email;
            }

            if (password) {
                updates.password = password;
            }

            const { error: updateError } = await supabase.auth.updateUser(updates);
            if (updateError) throw updateError;

            setMessage(t('profile.updated'));
            setPassword('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            <header className={`${lang === 'ar' ? 'text-right' : 'text-left'} flex items-center justify-between`}>
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 amber-glow">
                            <User className="h-8 w-8 text-amber-500" />
                        </div>
                        <span className="text-gradient-amber">{t('profile.title')}</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-bold tracking-[0.2em] uppercase text-[10px]">{t('profile.subtitle')}</p>
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[2rem] overflow-hidden border border-white/5 relative luminous-card"
            >
                <form onSubmit={handleUpdateProfile} className="p-10 space-y-8">
                    {message && (
                        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500 animate-in slide-in-from-top-4 duration-500">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-xs font-black uppercase tracking-widest">{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 animate-in slide-in-from-top-4 duration-500">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className={`text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] ${lang === 'ar' ? 'pr-2' : 'pl-2'} block flex items-center gap-2`}>
                                <User className="w-3 h-3" /> {t('profile.fullName')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full bg-obsidian-surface-highest/40 border border-white/5 rounded-2xl px-6 py-5 text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-surface-highest/60 transition-all font-bold text-sm tracking-wide ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className={`text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] ${lang === 'ar' ? 'pr-2' : 'pl-2'} block flex items-center gap-2`}>
                                <Mail className="w-3 h-3" /> {t('profile.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full bg-obsidian-surface-highest/40 border border-white/5 rounded-2xl px-6 py-5 text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-surface-highest/60 transition-all font-bold text-sm tracking-wide ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                placeholder="Email Address"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className={`text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] ${lang === 'ar' ? 'pr-2' : 'pl-2'} block flex items-center gap-2`}>
                                <Phone className="w-3 h-3" /> {t('profile.phone')}
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={`w-full bg-obsidian-surface-highest/40 border border-white/5 rounded-2xl px-6 py-5 text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-surface-highest/60 transition-all font-bold text-sm tracking-wide ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                placeholder="Phone Number"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className={`text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] ${lang === 'ar' ? 'pr-2' : 'pl-2'} block flex items-center gap-2`}>
                                <Lock className="w-3 h-3" /> {t('profile.newPass')}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full bg-obsidian-surface-highest/40 border border-white/5 rounded-2xl px-6 py-5 text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-surface-highest/60 transition-all font-bold text-sm tracking-wide ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                            />
                        </div>
                    </div>

                    <div className={`pt-10 border-t border-white/5 flex ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-3 px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 uppercase tracking-[0.2em] text-[11px] active:scale-95"
                        >
                            {loading ? t('profile.saving') : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {t('profile.save')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
