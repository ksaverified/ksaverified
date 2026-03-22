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
        <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
            {/* Back to Home Button */}
            <div className={`absolute top-8 ${lang === 'ar' ? 'right-8' : 'left-8'} z-50`}>
                <a
                    href="https://ksaverified.com"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all backdrop-blur-md"
                >
                    <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    <span className="text-sm font-bold uppercase">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
                </a>
            </div>

            {/* Language Switcher Float */}
            <div className={`absolute top-8 ${lang === 'ar' ? 'left-8' : 'right-8'} z-50`}>
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all backdrop-blur-md"
                >
                    <Languages className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase">{lang === 'ar' ? 'English' : 'العربية'}</span>
                </button>
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-surface border border-zinc-800/60 p-8 rounded-3xl shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center mb-6">
                            <img src="/logo.png" alt="KSA Verified" className="h-20 w-20 object-contain drop-shadow-2xl" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter">{t('login.title')}</h1>
                        <p className="text-zinc-500 mt-2 uppercase tracking-widest text-[10px] font-bold">{t('login.subtitle')}</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-sm text-red-500 text-center font-bold">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-sm text-emerald-500 text-center font-bold">{message}</p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleRequestCode}
                                className="space-y-6"
                            >
                                <div className="space-y-1.5">
                                    <label className={`text-sm font-medium text-zinc-400 ${lang === 'ar' ? 'pr-1 text-right' : 'pl-1 text-left'} block`}>
                                        {t('login.phoneLabel')}
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                                            <Phone className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder={t('login.phonePlaceholder')}
                                            className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-4 ${lang === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold text-lg`}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !phone}
                                    className={`w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${loading || !phone ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-blue-500/25'}`}
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    {loading ? t('login.authenticating') : t('login.requestCode')}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleLogin}
                                className="space-y-6"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className={`text-sm font-medium text-zinc-400 ${lang === 'ar' ? 'pr-1 text-right' : 'pl-1 text-left'} block`}>
                                            {t('login.codeLabel')}
                                        </label>
                                        <span className="text-xs text-blue-400 font-bold">{phone}</span>
                                    </div>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                                            <Lock className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder={t('login.codePlaceholder')}
                                            className={`w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl py-4 ${lang === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-emerald-400 placeholder-zinc-700/50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-black tracking-widest text-2xl text-center`}
                                            maxLength={6}
                                            autoComplete="one-time-code"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || code.length !== 6}
                                    className={`w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl transition-all ${loading || code.length !== 6 ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-emerald-500/25'}`}
                                >
                                    {loading ? t('login.authenticating') : t('login.signIn')}
                                </button>

                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="w-full py-3 text-zinc-500 hover:text-zinc-300 font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {t('login.backToPhone')}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

