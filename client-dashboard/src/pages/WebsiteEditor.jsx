import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { supabase } from '../lib/supabase';
import { 
    Save, 
    Type, 
    Layout, 
    Quote, 
    Contact, 
    Image as ImageIcon, 
    Plus, 
    Trash2, 
    RotateCcw, 
    Info, 
    CheckCircle2, 
    AlertCircle, 
    ChevronRight, 
    MessageCircle,
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_SERVICES = 6;

export default function WebsiteEditor() {
    const { user } = useAuth();
    const { lang, t } = useLanguage();
    const [lead, setLead] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const [activeLang, setActiveLang] = useState(lang);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        async function fetchConfig() {
            try {
                const phone = user?.user_metadata?.phone;
                if (!phone) return;

                const res = await fetch(`/api/portal?action=get-website-config&phone=${encodeURIComponent(phone)}`);
                const data = await res.json();

                if (data.success) {
                    setConfig(data.config);
                }
                
                // Also fetch lead info for context
                const searchPhone = phone.replace(/\D/g, '').slice(-9);
                const { data: leadData } = await supabase
                    .from('leads')
                    .select('*')
                    .ilike('phone', `%${searchPhone}`)
                    .single();
                setLead(leadData);

            } catch (err) {
                console.error('Error fetching config:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const phone = user?.user_metadata?.phone;
            const res = await fetch('/api/portal?action=update-website-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, config })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: t('editor.saved') });
            } else {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
            // Hide message after 5 seconds
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const updateNestedConfig = (path, value) => {
        const newConfig = { ...config };
        const keys = path.split('.');
        let current = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        setConfig(newConfig);
    };

    const addListItem = (type) => {
        if (type === 'services' && config[activeLang].services.length >= MAX_SERVICES) return;
        
        const newConfig = { ...config };
        const newItem = type === 'services' 
            ? { title: '', text: '', photo: '' }
            : { name: '', text: '' };
        
        // Add to both languages to keep structure in sync
        newConfig.en[type] = [...(newConfig.en[type] || []), { ...newItem }];
        newConfig.ar[type] = [...(newConfig.ar[type] || []), { ...newItem }];
        
        setConfig(newConfig);
    };

    const removeListItem = (type, index) => {
        const newConfig = { ...config };
        newConfig.en[type] = newConfig.en[type].filter((_, i) => i !== index);
        newConfig.ar[type] = newConfig.ar[type].filter((_, i) => i !== index);
        setConfig(newConfig);
    };

    const handleFileUpload = async (event, type, index = null) => {
        const file = event.target.files[0];
        if (!file) return;

        setSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('website-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('website-assets')
                .getPublicUrl(filePath);

            if (type === 'photos') {
                updateNestedConfig(`photos.${index}`, publicUrl);
            } else if (type === 'services') {
                const newSvcs = [...config[activeLang].services];
                newSvcs[index].photo = publicUrl;
                updateNestedConfig(`${activeLang}.services`, newSvcs);
            }

            setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
        } catch (err) {
            console.error('Upload error:', err);
            setMessage({ type: 'error', text: 'Upload failed: ' + err.message });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <RotateCcw className="h-10 w-10 text-blue-500 animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{t('website.loading')}</p>
            </div>
        );
    }

    if (!config) return null;

    const tabs = [
        { id: 'content', icon: Type, label: t('editor.tabs.content') },
        { id: 'services', icon: Layout, label: t('editor.tabs.services') },
        { id: 'testimonials', icon: Quote, label: t('editor.tabs.testimonials') },
        { id: 'contact', icon: Contact, label: t('editor.tabs.contact') },
        { id: 'photos', icon: ImageIcon, label: t('editor.tabs.photos') },
    ];

    return (
        <div className="h-full flex flex-col space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <Save className="h-8 w-8 text-blue-500" />
                        {t('editor.title')}
                    </h1>
                    <p className="text-zinc-500 mt-1 uppercase tracking-widest text-[10px] font-bold">{t('editor.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                            saving ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                        }`}
                    >
                        {saving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? t('editor.saving') : t('editor.save')}
                    </button>
                    {lead?.vercel_url && (
                        <a href={lead.vercel_url} target="_blank" className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors">
                            <Globe className="w-5 h-5" />
                        </a>
                    )}
                </div>
            </header>

            {/* Status Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-2xl border flex items-center gap-3 ${
                            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold">{message.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left: Tab Navigation */}
                <div className="lg:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-[#0a0c10]/50 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className="h-5 w-5" />
                            <span className="font-bold text-sm">{tab.label}</span>
                            {activeTab === tab.id && <ChevronRight className={`h-4 w-4 ml-auto ${lang === 'ar' ? 'rotate-180' : ''}`} />}
                        </button>
                    ))}

                    <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                        <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'دعم المصمم' : 'Retoucher Support'}
                        </h4>
                        <p className="text-zinc-500 text-[11px] leading-relaxed mb-4">
                            {lang === 'ar' ? 'هل تحتاج لمساعدة في إضافة صور أو تعديلات خاصة؟' : 'Need help with custom photos or special layout edits?'}
                        </p>
                        <a 
                            href="https://wa.me/966507913514?text=Hi! I need help retouching my website." 
                            target="_blank"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-colors text-[10px] font-black uppercase tracking-tighter"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {lang === 'ar' ? 'دردشة حية' : 'Live Chat'}
                        </a>
                    </div>
                </div>

                {/* Right: Content Area */}
                <div className="flex-1 bg-[#0a0c10]/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col min-h-0">
                    {/* Sub-header with Language Toggle */}
                    {['content', 'services', 'testimonials'].includes(activeTab) && (
                        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                {tabs.find(t => t.id === activeTab).label}
                            </h3>
                            <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
                                <button
                                    onClick={() => setActiveLang('en')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${activeLang === 'en' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setActiveLang('ar')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${activeLang === 'ar' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    العربية
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {/* TAB: CONTENT */}
                            {activeTab === 'content' && (
                                <motion.div 
                                    key={`content-${activeLang}`}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.title')}</label>
                                        <input 
                                            type="text" 
                                            value={config[activeLang].title} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.title`, e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors outline-none font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.subtitle')}</label>
                                        <input 
                                            type="text" 
                                            value={config[activeLang].subtitle} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.subtitle`, e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.hero')}</label>
                                        <textarea 
                                            rows="3"
                                            value={config[activeLang].hero_text} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.hero_text`, e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors outline-none resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.about')}</label>
                                        <textarea 
                                            rows="5"
                                            value={config[activeLang].about} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.about`, e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors outline-none resize-none"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: SERVICES */}
                            {activeTab === 'services' && (
                                <motion.div 
                                    key={`services-${activeLang}`}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    {config[activeLang].services.map((service, idx) => (
                                        <div key={idx} className="relative group bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                                            <button 
                                                onClick={() => removeListItem('services', idx)}
                                                className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.serviceTitle')}</label>
                                                        <input 
                                                            type="text" 
                                                            value={service.title} 
                                                            onChange={(e) => {
                                                                const newSvcs = [...config[activeLang].services];
                                                                newSvcs[idx].title = e.target.value;
                                                                updateNestedConfig(`${activeLang}.services`, newSvcs);
                                                            }}
                                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none text-sm font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.serviceDesc')}</label>
                                                        <textarea 
                                                            rows="2"
                                                            value={service.text} 
                                                            onChange={(e) => {
                                                                const newSvcs = [...config[activeLang].services];
                                                                newSvcs[idx].text = e.target.value;
                                                                updateNestedConfig(`${activeLang}.services`, newSvcs);
                                                            }}
                                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none text-xs resize-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-black/20 p-4 relative">
                                                    {service.photo ? (
                                                        <img src={service.photo} className="w-full h-32 object-cover rounded-lg mb-3" />
                                                    ) : (
                                                        <ImageIcon className="w-8 h-8 text-zinc-700 mb-2" />
                                                    )}
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">
                                                        {t('editor.fields.servicePhoto')} (600x400)
                                                    </p>
                                                    <input 
                                                        type="file" 
                                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                                        onChange={(e) => handleFileUpload(e, 'services', idx)}
                                                        accept="image/*"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button 
                                        disabled={config[activeLang].services.length >= MAX_SERVICES}
                                        onClick={() => addListItem('services')}
                                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-zinc-500 hover:text-blue-500 hover:border-blue-500 transition-all group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                        <span className="font-bold text-sm uppercase tracking-widest">{t('editor.actions.addService')}</span>
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded ml-2">
                                            {config[activeLang].services.length} / {MAX_SERVICES}
                                        </span>
                                    </button>
                                </motion.div>
                            )}

                            {/* TAB: TESTIMONIALS */}
                            {activeTab === 'testimonials' && (
                                <motion.div 
                                    key={`testimonials-${activeLang}`}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {config[activeLang].testimonials.map((testi, idx) => (
                                        <div key={idx} className="relative group bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex gap-6 items-start">
                                            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center flex-shrink-0 text-zinc-500 font-black text-xl italic uppercase">
                                                {testi.name ? testi.name.charAt(0) : '?'}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('editor.fields.testiName')}</label>
                                                    <input 
                                                        type="text" 
                                                        value={testi.name} 
                                                        onChange={(e) => {
                                                            const newTestis = [...config[activeLang].testimonials];
                                                            newTestis[idx].name = e.target.value;
                                                            updateNestedConfig(`${activeLang}.testimonials`, newTestis);
                                                        }}
                                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('editor.fields.testiText')}</label>
                                                    <textarea 
                                                        rows="2"
                                                        value={testi.text} 
                                                        onChange={(e) => {
                                                            const newTestis = [...config[activeLang].testimonials];
                                                            newTestis[idx].text = e.target.value;
                                                            updateNestedConfig(`${activeLang}.testimonials`, newTestis);
                                                        }}
                                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeListItem('testimonials', idx)}
                                                className="p-2 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={() => addListItem('testimonials')}
                                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-zinc-500 hover:text-blue-500 hover:border-blue-500 transition-all group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                        <span className="font-bold text-sm uppercase tracking-widest">{t('editor.actions.addTesti')}</span>
                                    </button>
                                </motion.div>
                            )}

                            {/* TAB: CONTACT */}
                            {activeTab === 'contact' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.phone')}</label>
                                            <input 
                                                type="text" 
                                                placeholder="+966..."
                                                value={config.contact.phone} 
                                                onChange={(e) => updateNestedConfig(`contact.phone`, e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none font-mono text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.email')}</label>
                                            <input 
                                                type="email" 
                                                placeholder="info@yourbrand.com"
                                                value={config.contact.email} 
                                                onChange={(e) => updateNestedConfig(`contact.email`, e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('editor.fields.address')}</label>
                                        <textarea 
                                            rows="2"
                                            value={config.contact.address} 
                                            onChange={(e) => updateNestedConfig(`contact.address`, e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">
                                            <Info className="w-3 h-3" />
                                            {t('editor.fields.maps')}
                                        </label>
                                        <textarea 
                                            rows="3"
                                            placeholder="<iframe src='...'></iframe>"
                                            value={config.contact.google_maps_iframe} 
                                            onChange={(e) => updateNestedConfig(`contact.google_maps_iframe`, e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-emerald-500/80 font-mono text-[10px] outline-none resize-none"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: PHOTOS */}
                            {activeTab === 'photos' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    {[
                                        { id: 'hero', label: t('editor.fields.heroPhoto'), dim: '1920x1080' },
                                        { id: 'about', label: t('editor.fields.aboutPhoto'), dim: '800x600' }
                                    ].map(item => (
                                        <div key={item.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{item.label}</label>
                                            <div className="aspect-video w-full rounded-2xl bg-black/40 border-2 border-dashed border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                                                {config.photos[item.id] ? (
                                                    <img src={config.photos[item.id]} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                ) : (
                                                    <ImageIcon className="w-10 h-10 text-zinc-800" />
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                                    <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs shadow-xl mb-4 relative overflow-hidden">
                                                        Upload File
                                                        <input 
                                                            type="file" 
                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                            onChange={(e) => handleFileUpload(e, 'photos', item.id)}
                                                            accept="image/*"
                                                        />
                                                    </button>
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">{item.dim} recommended</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-between items-center">
                                                <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{config.photos[item.id] || 'default.jpg'}</p>
                                                <button 
                                                    onClick={() => updateNestedConfig(`photos.${item.id}`, '')}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-white/5 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors text-[10px] font-bold uppercase"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    {t('editor.actions.reset')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
