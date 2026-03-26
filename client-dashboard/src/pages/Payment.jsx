import { CreditCard, AlertCircle, Copy, Check, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { motion } from 'framer-motion';

export default function Payment() {
    const { lang, t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const stcNumber = "966507913514";

    const handleCopy = () => {
        navigator.clipboard.writeText(stcNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className={lang === 'ar' ? 'text-right' : 'text-left'}>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 amber-glow">
                        <CreditCard className="h-8 w-8 text-amber-500" />
                    </div>
                    <span className="text-gradient-amber">{t('payment.title')}</span>
                </h1>
                <p className="text-zinc-500 mt-2 font-bold tracking-[0.2em] uppercase text-[10px]">{t('payment.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div
                    initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card rounded-[2rem] p-10 border border-white/5 h-fit relative luminous-card"
                >
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">{t('payment.currentPlan')}</h2>
                        <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                            {t('payment.active')}
                        </div>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div className={`flex justify-between items-end border-b border-white/5 pb-6 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                                <p className="text-3xl font-black text-white tracking-tighter italic uppercase">{t('payment.starterPlan')}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{t('payment.monthly')}</p>
                            </div>
                            <div className={lang === 'ar' ? 'text-left' : 'text-right'}>
                                <p className="text-3xl font-black text-amber-500 leading-none tracking-tighter italic">
                                    {t('payment.sar')} {t('payment.price')}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{t('payment.perMo')}</p>
                            </div>
                        </div>
                    </div>

                    <ul className="space-y-5 mb-10">
                        {t('payment.features').map((feature, i) => (
                            <li key={i} className={`flex items-center gap-4 text-zinc-400 text-[11px] font-black uppercase tracking-widest ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 amber-glow flex-shrink-0" />
                                <span className={lang === 'ar' ? 'text-right' : 'text-left'}>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <div className={`p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className={`text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-widest ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                            {t('payment.onlineSoon')}
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: lang === 'ar' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative group"
                >
                    <div className="absolute inset-x-4 -top-4 bottom-4 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="glass-card border border-white/5 rounded-[2rem] p-10 relative z-10 luminous-card">
                        <div className={`flex items-center gap-5 mb-8 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div className="h-16 w-16 rounded-2xl bg-obsidain-surface-highest/60 border border-white/10 flex items-center justify-center shadow-lg shadow-black/40">
                                <span className="text-white font-black text-2xl italic uppercase font-serif tracking-tighter leading-none select-none text-gradient-amber">STC</span>
                            </div>
                            <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] opacity-50">{t('payment.stcGateway')}</p>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">{t('payment.manualPay')}</h2>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                                {t('payment.transferDesc')}
                            </p>

                            <div className="bg-black/20 border border-white/5 p-8 rounded-3xl space-y-4">
                                <p className={`text-[10px] text-zinc-500 font-black uppercase tracking-widest ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t('payment.stcNumberLabel')}</p>
                                <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 ${lang === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
                                    <span className="text-3xl font-black text-white tracking-[0.2em] italic">{stcNumber}</span>
                                    <button
                                        onClick={handleCopy}
                                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${copied
                                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                            : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/5'
                                            }`}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? t('payment.copied') : t('payment.copy')}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <p className={`text-[10px] text-zinc-500 font-black uppercase tracking-widest ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t('payment.shareReceipt')}</p>
                                <button
                                    onClick={() => {
                                        const msg = lang === 'ar'
                                            ? "لقد قمت للتو بالدفع لخطة KSA Verified الخاصة بي، إليكم لقطة الشاشة"
                                            : "I just paid for my KSA Verified plan, here is the screenshot";
                                        window.open(`https://wa.me/${stcNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="w-full flex items-center justify-center gap-4 py-5 bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#25D366]/20 group px-6 active:scale-95 uppercase tracking-[0.2em] text-[11px]"
                                >
                                    <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
                                    {t('payment.sendWhatsApp')}
                                </button>
                            </div>

                            <div className="text-center pt-4">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] animate-pulse">{t('payment.comingSoon')}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className={`glass-card p-10 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl border-dashed border-white/10 ${lang === 'ar' ? 'lg:flex-row-reverse' : ''} relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <div className={`flex items-center gap-8 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center text-5xl shadow-inner border border-amber-500/20 amber-glow">
                        🇸🇦
                    </div>
                    <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{t('payment.localSupport')}</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">{t('payment.supportDesc')}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const msg = lang === 'ar'
                            ? "أحتاج إلى دعم بخصوص حسابي"
                            : "I need support with my account";
                        window.open(`https://wa.me/${stcNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/5 uppercase tracking-[0.3em] text-[10px] active:scale-95"
                >
                    {t('payment.contactSupport')}
                </button>
            </div>
        </div>
    );
}
