import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { Navigate } from 'react-router-dom';
import { Lock, Phone, MessageCircle, Languages, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
    const { user } = useAuth();
    const { lang, toggleLanguage, t } = useLanguage();
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const normalizePhone = (p) => {
        let cleaned = p.replace(/\D/g, '');
        if (cleaned.startsWith('05') && cleaned.length === 10) {
            cleaned = '966' + cleaned.substring(1);
        } else if (cleaned.length === 9 && (cleaned.startsWith('5'))) {
            cleaned = '966' + cleaned;
        }
        return cleaned;
    };

    const formatPhoneForEmail = (p) => {
        const clean = normalizePhone(p);
        return `${clean}@client.ksaverified.com`;
    };

    const handleRequestCode = async (e) => {
        e.preventDefault();
        if (!phone) {
            setError(t('login.phoneError'));
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const normalized = normalizePhone(phone);
            const response = await fetch('/api/portal?action=request-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: normalized }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to request login code');
            }

            setMessage(t('login.codeSent'));
            setStep(2);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const email = formatPhoneForEmail(phone);
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: code,
            });
            const normalized = normalizePhone(phone);

            if (signInError) throw signInError;

            // Record login event
            await fetch('/api/portal?action=record-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: normalized }),
            }).catch(err => console.error('Failed to record login event:', err));
        } catch (err) {
            setError(t('login.loginFailed'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setStep(1);
        setCode('');
        setError(null);
        setMessage(null);
    };

    return (
        <div className="min-h-screen bg-obsidian-dark flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Back to Home Button */}
            <div className={`absolute top-8 ${lang === 'ar' ? 'right-8' : 'left-8'} z-50`}>
                <a
                    href="https://ksaverified.com"
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:border-amber-500/30 transition-all backdrop-blur-md text-[10px] font-black uppercase tracking-widest"
                >
                    <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    <span>{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
                </a>
            </div>

            {/* Language Switcher Float */}
            <div className={`absolute top-8 ${lang === 'ar' ? 'left-8' : 'right-8'} z-50`}>
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:border-amber-500/30 transition-all backdrop-blur-md text-[10px] font-black uppercase tracking-widest"
                >
                    <Languages className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-card rounded-[2.5rem] p-12 border border-white/5 shadow-2xl relative luminous-card">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center mb-8 p-4 bg-white/5 rounded-3xl border border-white/5 amber-glow">
                            <img src="/logo.png" alt="KSA Verified" className="h-16 w-16 object-contain" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                            <span className="text-gradient-amber">{t('login.title')}</span>
                        </h1>
                        <p className="text-zinc-500 mt-3 uppercase tracking-[0.3em] text-[10px] font-black">{t('login.subtitle')}</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] text-red-500 text-center font-black uppercase tracking-widest leading-relaxed">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] text-emerald-500 text-center font-black uppercase tracking-widest leading-relaxed">{message}</p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleRequestCode}
                                className="space-y-8"
                            >
                                <div className="space-y-3">
                                    <label className={`text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] ${lang === 'ar' ? 'pr-2' : 'pl-2'} block flex items-center gap-2`}>
                                        <Phone className="w-3 h-3" /> {t('login.phoneLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder={t('login.phonePlaceholder')}
                                        className={`w-full bg-obsidian-surface-highest/40 border border-white/5 rounded-2xl px-6 py-5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-surface-highest/60 transition-all font-black text-xl tracking-widest ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !phone}
                                    className="w-full py-5 px-6 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                    {loading ? t('login.authenticating') : t('login.requestCode')}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleLogin}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> {t('login.codeLabel')}
                                        </label>
                                        <span className="text-[10px] text-amber-500/40 font-black tracking-widest">{phone}</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="••••••"
                                        className={`w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl py-6 text-emerald-400 placeholder-zinc-800 focus:outline-none focus:border-emerald-500 transition-all font-black tracking-[0.8em] text-3xl text-center`}
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || code.length !== 6}
                                    className="w-full py-5 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('login.signIn')}
                                </button>

                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="w-full py-3 text-zinc-500 hover:text-amber-500 font-black flex items-center justify-center gap-3 transition-colors text-[10px] uppercase tracking-widest"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t('login.backToPhone')}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
                
                <p className="text-center mt-10 text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] select-none">
                    Security Infrastructure &bull; KSA Verified &bull; 2026
                </p>
            </motion.div>
        </div>
    );
}

