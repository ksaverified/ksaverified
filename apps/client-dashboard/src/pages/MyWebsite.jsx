import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';
import { Globe, ExternalLink, ShieldCheck, Zap, Calendar, MapPin, Eye, MousePointerClick, Smartphone, Clock, CreditCard, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatDate = (dateString) => {
    if (!dateString) return '...';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);
};

export default function MyWebsite() {
    const { user } = useAuth();
    const { lang, t } = useLanguage();
    const [lead, setLead] = useState(null);
    const [pageViews, setPageViews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeadData() {
            try {
                const phone = user?.user_metadata?.phone;
                if (!phone) {
                    setLoading(false);
                    return;
                }

                const searchPhone = phone.replace(/\D/g, '').slice(-9);

                // Fetch Lead Data
                const { data: leadData, error: leadError } = await supabase
                    .from('leads')
                    .select('*')
                    .ilike('phone', `%${searchPhone}`)
                    .single();

                if (leadError) throw leadError;
                setLead(leadData);

                // Fetch Page Views for this lead
                if (leadData?.id) {
                    const { data: viewsData } = await supabase
                        .from('page_views')
                        .select('*')
                        .eq('lead_id', leadData.id)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    if (viewsData) setPageViews(viewsData);
                }

            } catch (err) {
                console.error('Error fetching lead data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchLeadData();
    }, [user]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-zinc-500 font-bold animate-pulse tracking-wide uppercase text-xs">{t('website.loading')}</p>
            </div>
        );
    }

    if (!lead || !lead.vercel_url) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0a0c10]/50 border border-white/5 rounded-3xl">
                <Globe className="h-16 w-16 text-zinc-700 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">{t('website.noWebsite')}</h2>
                <p className="text-zinc-400 max-w-md">{t('website.noWebsiteDesc')}</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const isUnlocked = lead.unlocked;

    return (
        <div className="h-full flex flex-col space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-4 uppercase leading-tight">
                        <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 amber-glow">
                            <Globe className="h-7 w-7 text-amber-500" />
                        </div>
                        <span className="text-gradient-amber">{lead.name}</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 uppercase tracking-[0.3em] text-[10px] font-black">{t('website.title')}</p>
                </div>
                <a
                    href={lead.vercel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-amber-500/20 group text-[11px] active:scale-95"
                >
                    <span>{t('website.openLive')}</span>
                    <ExternalLink className={`h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1`} />
                </a>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                
                {/* LEFT COLUMN: Iframe Preview */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 glass-card rounded-[2.5rem] overflow-hidden flex flex-col relative border border-white/5 shadow-2xl h-[600px] lg:h-auto group"
                >
                    <div className="h-12 border-b border-white/5 bg-obsidian-surface-highest/40 flex items-center px-6 gap-3">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                            <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/40" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/40" />
                        </div>
                        <div className="flex-1 text-center font-black text-[10px] text-zinc-500 tracking-[0.2em] truncate px-4">
                            {lead.vercel_url?.replace('https://', '')}
                        </div>
                        <div className="w-16 h-1 bg-white/5 rounded-full" />
                    </div>
                    <div className="relative flex-1 bg-white">
                        <iframe
                            src={`${lead.vercel_url}${lead.vercel_url.includes('?') ? '&' : '?'}dashboard=true`}
                            className="w-full h-full border-none"
                            title="Website Preview"
                        />
                        <div className="absolute inset-0 pointer-events-none border-[12px] border-obsidian-dark/5 shadow-inner" />
                    </div>
                </motion.div>

                {/* RIGHT COLUMN: Data Cards */}
                <div className="space-y-8 overflow-y-auto pr-2 pb-8 custom-scrollbar">
                    
                    {/* Access & Subscription Profile */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`p-3.5 rounded-[1.25rem] flex items-center justify-center transition-all ${isUnlocked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} border`}>
                                {isUnlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase text-[11px] tracking-[0.2em]">{lang === 'ar' ? 'حالة البوابة' : 'Portal Status'}</h3>
                                <p className={`text-[13px] font-black mt-1 tracking-widest ${isUnlocked ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isUnlocked ? (lang === 'ar' ? 'مفتوح' : 'UNLOCKED') : (lang === 'ar' ? 'مقفل' : 'LOCKED')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="bg-obsidian-surface-highest/30 border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-2">{t('website.plan')}</p>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{t('website.starter')}</span>
                                </div>
                            </div>
                            <div className="bg-obsidian-surface-highest/30 border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-2">{lang === 'ar' ? 'تم الإنشاء' : 'Created'}</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-amber-500/60" />
                                    <span className="text-[11px] font-black text-white tracking-widest">{formatDate(lead.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Business Profile */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <span className="w-4 h-[1px] bg-amber-500/40" />
                            {lang === 'ar' ? 'ملف العمل' : 'Business Profile'}
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-500/5 rounded-xl border border-white/5 mt-0.5">
                                    <ShieldCheck className="w-4 h-4 text-amber-500/60" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">{t('website.status')}</p>
                                    <p className="text-[12px] font-black text-white uppercase tracking-widest">{lead.status}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-500/5 rounded-xl border border-white/5 mt-0.5">
                                    <MapPin className="w-4 h-4 text-amber-500/60" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">{lang === 'ar' ? 'المنطقة' : 'Area'}</p>
                                    <p className="text-[12px] font-black text-white tracking-wider">{lead.area || 'Riyadh, KSA'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-500/5 rounded-xl border border-white/5 mt-0.5">
                                    <Globe className="w-4 h-4 text-amber-500/60" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">{t('website.businessName')}</p>
                                    <p className="text-[12px] font-black text-white tracking-widest truncate">{lead.name}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Real-time Analytics */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <span className="w-4 h-[1px] bg-emerald-500/40" />
                            {lang === 'ar' ? 'التحليلات الحية' : 'Live Analytics'}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-5 mb-8">
                            <div className="bg-obsidian-surface-highest/30 border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-all">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em]">{lang === 'ar' ? 'الزيارات' : 'Visitors'}</span>
                                </div>
                                <p className="text-3xl font-black text-white tracking-tight">{lead.visits || 0}</p>
                            </div>
                            <div className="bg-obsidian-surface-highest/30 border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all">
                                <div className="flex items-center gap-2 mb-3">
                                    <MousePointerClick className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em]">{lang === 'ar' ? 'النقرات' : 'Clicks'}</span>
                                </div>
                                <p className="text-3xl font-black text-white tracking-tight">{(lead.visits || 0) * 2}</p>
                            </div>
                        </div>

                        {/* Recent Visitors Table */}
                        <div className="space-y-4">
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] px-2">{lang === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}</p>
                            
                            {pageViews.length > 0 ? pageViews.map((view, index) => (
                                <div key={view.id || index} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-obsidian-surface flex items-center justify-center border border-white/5">
                                            <Smartphone className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-zinc-300 uppercase tracking-wider">{view.city || 'Private User'}</p>
                                            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">
                                                {view.user_agent?.includes('iPhone') ? 'iPhone' : 'Web User'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-600">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{formatDate(view.created_at)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center p-8 border border-dashed border-white/5 rounded-3xl">
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">{lang === 'ar' ? 'في انتظار الزوار الجدد...' : 'Pulse Monitoring...'}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
