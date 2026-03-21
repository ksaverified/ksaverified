import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';
import { Globe, ExternalLink, ShieldCheck, Zap, Calendar, MapPin, Eye, MousePointerClick, Smartphone, Clock, CreditCard, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="h-full flex flex-col space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <Globe className="h-8 w-8 text-blue-500" />
                        {lead.name}
                    </h1>
                    <p className="text-zinc-500 mt-1 uppercase tracking-widest text-[10px] font-bold">{t('website.title')}</p>
                </div>
                <a
                    href={lead.vercel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 group text-xs"
                >
                    <span>{t('website.openLive')}</span>
                    <ExternalLink className={`h-4 w-4 transition-transform group-hover:scale-110`} />
                </a>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* LEFT COLUMN: Iframe Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-[#0a0c10]/80 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden flex flex-col relative group h-[600px] lg:h-auto shadow-2xl"
                >
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
                    <div className="h-10 border-b border-white/5 bg-[#11141b]/80 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="flex-1 text-center font-mono text-[10px] text-zinc-500 font-bold truncate px-4">
                            {lead.vercel_url}
                        </div>
                    </div>
                    <iframe
                        src={`${lead.vercel_url}${lead.vercel_url.includes('?') ? '&' : '?'}dashboard=true`}
                        className="w-full flex-1 border-none bg-white"
                        title="Website Preview"
                    />
                </motion.div>

                {/* RIGHT COLUMN: Data Cards */}
                <div className="space-y-6 overflow-y-auto pr-2 pb-6 custom-scrollbar">
                    
                    {/* Access & Subscription Profile */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#0a0c10]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2 rounded-xl flex items-center justify-center ${isUnlocked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} border`}>
                                {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-white font-bold">{lang === 'ar' ? 'حالة البوابة' : 'Portal Status'}</h3>
                                <p className={`text-[10px] uppercase tracking-widest font-black ${isUnlocked ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isUnlocked ? (lang === 'ar' ? 'مفتوح' : 'UNLOCKED') : (lang === 'ar' ? 'مقفل' : 'LOCKED')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{t('website.plan')}</p>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-bold text-white">{t('website.starter')}</span>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{lang === 'ar' ? 'تم الإنشاء' : 'Created'}</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-bold text-white">{formatDate(lead.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Business Profile */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#0a0c10]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">{lang === 'ar' ? 'ملف العمل' : 'Business Profile'}</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 mt-0.5">
                                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">{t('website.status')}</p>
                                    <p className="text-sm font-bold text-zinc-200 capitalize">{lead.status}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-0.5">
                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">{lang === 'ar' ? 'المنطقة' : 'Area'}</p>
                                    <p className="text-sm font-bold text-zinc-200">{lead.area || 'Riyadh, KSA'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-0.5">
                                    <Globe className="w-4 h-4 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">{t('website.businessName')}</p>
                                    <p className="text-sm font-bold text-zinc-200 truncate">{lead.name}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Real-time Analytics */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-[#0a0c10]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {lang === 'ar' ? 'التحليلات الحية' : 'Live Analytics'}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lang === 'ar' ? 'الزيارات' : 'Total Visits'}</span>
                                </div>
                                <p className="text-2xl font-black text-white">{lead.visits || 0}</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MousePointerClick className="w-4 h-4 text-amber-400" />
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lang === 'ar' ? 'النقرات' : 'Clicks'}</span>
                                </div>
                                <p className="text-2xl font-black text-white">{(lead.visits || 0) * 2}</p>
                            </div>
                        </div>

                        {/* Recent Visitors Table */}
                        {pageViews.length > 0 && (
                            <div className="space-y-3 mt-6">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">{lang === 'ar' ? 'الزوار الأخيرين' : 'Recent Visitors'}</p>
                                {pageViews.map((view, index) => (
                                    <div key={view.id || index} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                                                <Smartphone className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-300">{view.city || 'Private User'}</p>
                                                <p className="text-[10px] text-zinc-500 font-mono">
                                                    {view.user_agent?.substring(0, 15) || 'Web Browser'}...
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px] font-mono">{formatDate(view.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {pageViews.length === 0 && (
                            <div className="text-center p-6 border border-dashed border-white/5 rounded-2xl">
                                <p className="text-xs text-zinc-500 font-bold">{lang === 'ar' ? 'في انتظار الزوار الجدد...' : 'Awaiting new visitors...'}</p>
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
