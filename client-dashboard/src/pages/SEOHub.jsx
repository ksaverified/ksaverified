import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { 
    Search, Layout, CheckCircle, AlertCircle, 
    ArrowRight, Globe, Save, RefreshCw, BarChart2,
    Eye, Info, HelpingHand
} from 'lucide-react';

export default function SEOHub() {
    const { user } = useAuth();
    const { t, lang } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [seoData, setSeoData] = useState({
        seo_title: '',
        seo_description: '',
        seo_score: 0,
        indexing_status: 'not_indexed',
        seo_metadata: {
            on_page_checklist: { h1: false, alt_text: false, google_business_profile: false },
            last_audit_at: null
        }
    });

    useEffect(() => {
        fetchSEO();
    }, [user]);

    const fetchSEO = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // In the customer portal, we fetch by the user's linked lead
            // The user metadata or a separate profile table usually stores the place_id
            const { data: profile } = await user.aud === 'authenticated' ? { data: { place_id: user.user_metadata?.place_id } } : { data: null };
            const placeId = user.user_metadata?.place_id;
            
            if (placeId) {
                const response = await fetch(`/api/seo?action=details&id=${placeId}`);
                const result = await response.json();
                if (result.success) {
                    setSeoData(result.data);
                }
            }
        } catch (error) {
            console.error('[SEO Hub] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const placeId = user.user_metadata?.place_id;
        if (!placeId) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/seo?action=update&id=${placeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seo_title: seoData.seo_title,
                    seo_description: seoData.seo_description,
                    seo_metadata: seoData.seo_metadata
                })
            });
            if (response.ok) {
                // Refresh audit after save
                await fetch(`/api/seo?action=audit&id=${placeId}`, { method: 'POST' });
                fetchSEO();
            }
        } catch (error) {
            console.error('[SEO Hub] Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const checklist = seoData.seo_metadata?.on_page_checklist || {};

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <Search className="w-8 h-8 text-blue-500" />
                        {lang === 'ar' ? 'مركز تحسين محركات البحث' : 'SEO Optimization Hub'}
                    </h1>
                    <p className="text-zinc-500 mt-1 font-medium">
                        {lang === 'ar' ? 'قم بتحسين ظهور موقعك على جوجل' : 'Increase your visibility on Google Search and Maps.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lang === 'ar' ? 'صحة SEO' : 'SEO Health'}</p>
                            <p className={`text-xl font-black ${seoData.seo_score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{seoData.seo_score}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                             <svg className="w-full h-full -rotate-90">
                                <circle 
                                    cx="24" cy="24" r="20" 
                                    fill="transparent" 
                                    stroke="currentColor" 
                                    strokeWidth="4" 
                                    className="text-white/5"
                                />
                                <circle 
                                    cx="24" cy="24" r="20" 
                                    fill="transparent" 
                                    stroke="currentColor" 
                                    strokeWidth="4" 
                                    strokeDasharray={125.6}
                                    strokeDashoffset={125.6 - (125.6 * seoData.seo_score) / 100}
                                    className={seoData.seo_score >= 80 ? 'text-emerald-500' : 'text-amber-500'}
                                />
                             </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Meta Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#12141c] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Layout className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">{lang === 'ar' ? 'محرر الميتا داتا' : 'Meta Data Editor'}</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                    {lang === 'ar' ? 'عنوان الصفحة (Title Tag)' : 'Page Title (Title Tag)'}
                                </label>
                                <input 
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                    value={seoData.seo_title || ''}
                                    onChange={(e) => setSeoData({...seoData, seo_title: e.target.value})}
                                    placeholder={lang === 'ar' ? 'العنوان الذي يظهر في نتائج البحث' : 'The headine shown in search results'}
                                />
                                <div className="flex justify-between mt-1.5 px-1">
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase">{lang === 'ar' ? 'المثالي: 50-60 حرف' : 'Ideal: 50-60 chars'}</span>
                                    <span className={`text-[10px] font-bold ${seoData.seo_title?.length > 60 ? 'text-amber-500' : 'text-zinc-500'}`}>{seoData.seo_title?.length || 0}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                    {lang === 'ar' ? 'وصف الميتا (Meta Description)' : 'Meta Description'}
                                </label>
                                <textarea 
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                                    value={seoData.seo_description || ''}
                                    onChange={(e) => setSeoData({...seoData, seo_description: e.target.value})}
                                    placeholder={lang === 'ar' ? 'ملخص قصير عن عملك' : 'A short summary of your business for search engines'}
                                />
                                <div className="flex justify-between mt-1.5 px-1">
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase">{lang === 'ar' ? 'المثالي: 150-160 حرف' : 'Ideal: 150-160 chars'}</span>
                                    <span className={`text-[10px] font-bold ${seoData.seo_description?.length > 160 ? 'text-amber-500' : 'text-zinc-500'}`}>{seoData.seo_description?.length || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                            >
                                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Google Preview */}
                    <div className="bg-[#12141c] rounded-3xl p-8 border border-white/5 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Eye className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">{lang === 'ar' ? 'معاينة جوجل' : 'Google Search Preview'}</h2>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-inner overflow-hidden">
                            <div className="max-w-md space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400">G</div>
                                    <div className="text-[11px] text-[#202124]">
                                        <p className="leading-none font-medium">Google</p>
                                        <p className="leading-none text-[#4d5156] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">https://ksaverified.com › site › ...</p>
                                    </div>
                                </div>
                                <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium leading-tight">
                                    {seoData.seo_title || (lang === 'ar' ? 'أضف عنواناً لموقعك' : 'Your Business Name - Top Rated Services')}
                                </h3>
                                <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                                    {seoData.seo_description || (lang === 'ar' ? 'يرجى كتابة وصف جذاب ليظهر هنا في نتائج بحث جوجل ويزيد من الزيارات لموقعك.' : 'Please add a meta description to see how your site will appear in Google search results and attract more customers.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Checklist */}
                <div className="space-y-6">
                    <div className="bg-[#12141c] rounded-3xl p-6 border border-white/5 shadow-xl space-y-6">
                        <div className="flex items-center gap-3">
                            <BarChart2 className="w-5 h-5 text-blue-500" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">{lang === 'ar' ? 'قائمة التحقق' : 'Optimization Checklist'}</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { id: 'title', label: lang === 'ar' ? 'عنوان الصفحة' : 'SEO Title Set', active: !!seoData.seo_title },
                                { id: 'desc', label: lang === 'ar' ? 'وصف الميتا' : 'Meta Description Set', active: !!seoData.seo_description },
                                { id: 'h1', label: lang === 'ar' ? 'ترويسة H1' : 'H1 Header Present', active: checklist.h1 },
                                { id: 'alt', label: lang === 'ar' ? 'وصف الصور' : 'Image Alt Text', active: checklist.alt_text },
                                { id: 'gbp', label: lang === 'ar' ? 'نشاطي التجاري' : 'Google Map Linked', active: checklist.google_business_profile },
                            ].map(item => (
                                <div key={item.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        {item.active ? (
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                            </div>
                                        )}
                                        <span className={`text-xs font-bold ${item.active ? 'text-zinc-200' : 'text-zinc-500'}`}>{item.label}</span>
                                    </div>
                                    {!item.active && <Info className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mt-6">
                             <div className="flex items-center gap-2 mb-2 text-blue-400">
                                <HelpingHand className="w-4 h-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'نصيحة ذكية' : 'Smart Tip'}</p>
                             </div>
                             <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                {lang === 'ar' 
                                    ? 'استخدم الكلمات المفتاحية التي يبحث عنها عملاؤك في العنوان والوصف لزيادة الترتيب.'
                                    : 'Include your city and primary service in the title to rank better for local searches.'}
                             </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group border border-white/10">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                        <h3 className="text-xl font-black italic tracking-tighter mb-1">{lang === 'ar' ? 'تحتاج مساعدة؟' : 'Need Expert Help?'}</h3>
                        <p className="text-xs text-white/80 font-medium leading-relaxed mb-4">
                            {lang === 'ar' 
                                ? 'فريقنا متاح لمساعدتك في تحسين موقعك بشكل احترافي.'
                                : 'Our SEO experts can handle advanced indexing and configuration for you.'}
                        </p>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-blue-600 px-4 py-2.5 rounded-xl hover:scale-105 transition-transform active:scale-95">
                            {lang === 'ar' ? 'تحدث معنا' : 'Chat with Support'} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
