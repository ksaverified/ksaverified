import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../../../../core/db/supabase'; // Adjust based on your setup or use the local lib/supabase
import { AlertTriangle, CheckCircle2, MapPin, Globe, Clock, MessageSquare, Phone, TrendingUp, Info } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';

export default function GapAudit() {
    const { user } = useAuth();
    const { lang } = useLanguage();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLead = async () => {
            if (!user?.phone) return;
            try {
                // Remove + from phone if it exists
                const formattedPhone = user.phone.replace('+', '');
                const { data, error } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('phone', formattedPhone)
                    .single();
                
                if (data && !error) {
                    setLead(data);
                }
            } catch (err) {
                console.error("Error fetching lead:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLead();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500">
                No gap analysis data found for your account.
            </div>
        );
    }

    const isRtl = lang === 'ar';
    const hasWebsite = lead.website && lead.website !== '';
    const hasPhone = lead.phone && lead.phone !== '';
    const hasReviews = lead.rating > 0 && lead.reviews > 0;
    const score = lead.conversion_score || 0;

    return (
        <div className={`max-w-4xl mx-auto space-y-6 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-8 h-8 text-amber-500" />
                    <h1 className="text-3xl font-black text-white">{lead.name}</h1>
                </div>
                <p className="text-zinc-400">{lead.address}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-bold text-zinc-500 mb-2 uppercase tracking-widest">
                        {isRtl ? 'نقاط الملف الشخصي' : 'Profile Score'}
                    </span>
                    <span className={`text-4xl font-black ${score > 70 ? 'text-emerald-500' : score > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {score}/100
                    </span>
                    <TrendingUp className="w-5 h-5 text-zinc-600 mt-2" />
                </div>
                
                <div className="md:col-span-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 rounded-2xl flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-amber-500 mb-2">
                        {isRtl ? 'ما يعنيه هذا؟' : 'What does this mean?'}
                    </h3>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                        {isRtl 
                            ? 'تشير التقديرات إلى أن عملك من المحتمل أن يفقد عملاء لصالح المنافسين بسبب عدم اكتمال المعلومات على خرائط جوجل. من خلال العمل معنا، يمكننا تحسين ملفك الشخصي وزيادة معدل التحويل بشكل كبير.'
                            : 'Estimates indicate your business is potentially losing customers to competitors due to incomplete information on Google Maps. By working with us, we can optimize your profile and significantly increase your conversion rate.'}
                    </p>
                </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">
                {isRtl ? 'تحليل النواقص التفصيلي' : 'Detailed Gap Analysis'}
            </h2>

            <div className="space-y-4">
                {/* Website Gap */}
                <div className={`p-5 rounded-2xl border ${hasWebsite ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'} flex items-start gap-4`}>
                    <div className="mt-1">
                        {hasWebsite ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-zinc-400" />
                            {isRtl ? 'الموقع الإلكتروني' : 'Website Presence'}
                        </h4>
                        {hasWebsite ? (
                            <p className="text-zinc-400 text-sm mt-1">{isRtl ? 'رابط الموقع موجود.' : 'Website link is present.'}</p>
                        ) : (
                            <p className="text-red-400/80 text-sm mt-1">{isRtl ? 'لا يوجد موقع إلكتروني. هذا يقلل من الثقة ويمنع العملاء من التعرف على خدماتك بالتفصيل.' : 'No website link found. This lowers trust and prevents customers from learning about your services in detail.'}</p>
                        )}
                    </div>
                </div>

                {/* Reviews Gap */}
                <div className={`p-5 rounded-2xl border ${hasReviews ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'} flex items-start gap-4`}>
                    <div className="mt-1">
                        {hasReviews ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Info className="w-6 h-6 text-amber-500" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-zinc-400" />
                            {isRtl ? 'التقييمات والمراجعات' : 'Ratings & Reviews'}
                        </h4>
                        {hasReviews ? (
                            <p className="text-zinc-400 text-sm mt-1">
                                {isRtl ? `لديك ${lead.reviews} مراجعات بتقييم ${lead.rating}.` : `You have ${lead.reviews} reviews with a ${lead.rating} rating.`}
                            </p>
                        ) : (
                            <p className="text-amber-400/80 text-sm mt-1">
                                {isRtl ? 'لا توجد تقييمات كافية أو التقييم منخفض. التقييمات العالية ضرورية لجذب العملاء الجدد.' : 'Insufficient reviews or rating is low. High ratings are crucial for attracting new customers.'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Phone Gap */}
                <div className={`p-5 rounded-2xl border ${hasPhone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'} flex items-start gap-4`}>
                    <div className="mt-1">
                        {hasPhone ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <Phone className="w-4 h-4 text-zinc-400" />
                            {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                        </h4>
                        {hasPhone ? (
                            <p className="text-zinc-400 text-sm mt-1">{isRtl ? 'الرقم متوفر للاتصال.' : 'Contact number is available.'}</p>
                        ) : (
                            <p className="text-red-400/80 text-sm mt-1">{isRtl ? 'رقم الهاتف مفقود غير موجود. العملاء لا يمكنهم التواصل معك مباشرة من الخريطة.' : 'Phone number is missing. Customers cannot contact you directly from the map.'}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-12 bg-zinc-900 border border-white/10 p-8 rounded-3xl text-center">
                <h3 className="text-2xl font-black text-amber-500 mb-4 uppercase tracking-wider">
                    {isRtl ? 'اختر الباقة المناسبة لإصلاح هذه النواقص' : 'Choose a plan to fix these gaps'}
                </h3>
                <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
                    {isRtl ? 'قم بترقية حضورك الرقمي الآن. جميع الباقات مرنة وبدون التزام.' : 'Upgrade your digital presence now. All plans are flexible with no commitment.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                    {/* Basic Plan */}
                    <div className="bg-zinc-800/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-amber-500/50 transition-colors">
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2">{isRtl ? 'الباقة الأساسية' : 'Basic Plan'}</h4>
                            <div className="text-amber-500 font-black text-2xl mb-4">19 <span className="text-sm text-zinc-500 font-normal">{isRtl ? 'ريال/شهر' : 'SAR/mo'}</span></div>
                            <ul className="space-y-3 text-sm text-zinc-300">
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> {isRtl ? 'إصلاح جميع معلومات الخريطة' : 'Fix all map information gaps'}</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> {isRtl ? 'تحديث أوقات العمل' : 'Update business hours'}</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> {isRtl ? 'الرد الأولي على التقييمات' : 'Initial review responses'}</li>
                            </ul>
                        </div>
                        <button className="mt-6 w-full bg-zinc-700 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-lg font-bold transition-colors">
                            {isRtl ? 'اشترك الآن' : 'Subscribe'}
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gradient-to-b from-amber-500/10 to-zinc-900 border border-amber-500/50 p-6 rounded-2xl flex flex-col justify-between transform scale-105 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative z-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                            {isRtl ? 'الأكثر شعبية' : 'Most Popular'}
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2">{isRtl ? 'باقة برو' : 'Pro Plan'}</h4>
                            <div className="text-amber-500 font-black text-2xl mb-4">49 <span className="text-sm text-zinc-500 font-normal">{isRtl ? 'ريال/شهر' : 'SAR/mo'}</span></div>
                            <ul className="space-y-3 text-sm text-zinc-300">
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> <span className="font-bold text-white">{isRtl ? 'موقع إلكتروني مخصص' : 'Custom Built Website'}</span></li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> <span className="font-bold text-white">{isRtl ? 'أداة تعديل الموقع' : 'Website Editor Tool'}</span></li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> {isRtl ? 'كل ما في الباقة الأساسية' : 'Everything in Basic'}</li>
                            </ul>
                        </div>
                        <button className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-black px-4 py-3 rounded-lg font-black transition-colors shadow-lg">
                            {isRtl ? 'اشترك الآن' : 'Subscribe Now'}
                        </button>
                    </div>

                    {/* Max Plan */}
                    <div className="bg-zinc-800/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-amber-500/50 transition-colors">
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2">{isRtl ? 'باقة ماكس' : 'Max Plan'}</h4>
                            <div className="text-amber-500 font-black text-2xl mb-4">99 <span className="text-sm text-zinc-500 font-normal">{isRtl ? 'ريال/شهر' : 'SAR/mo'}</span></div>
                            <ul className="space-y-3 text-sm text-zinc-300">
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> <span className="font-bold text-white">{isRtl ? 'تحليلات أداء متقدمة' : 'Advanced Analytics'}</span></li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> <span className="font-bold text-white">{isRtl ? 'إدارة وتحسين SEO' : 'SEO Management'}</span></li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" shrink-0 /> {isRtl ? 'كل ما في باقة برو' : 'Everything in Pro'}</li>
                            </ul>
                        </div>
                        <button className="mt-6 w-full bg-zinc-700 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-lg font-bold transition-colors">
                            {isRtl ? 'اشترك الآن' : 'Subscribe'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
