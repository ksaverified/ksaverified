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
        <div className="h-full flex flex-col space-y-8 max-w-5xl mx-auto font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-4 uppercase leading-tight">
                        <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 amber-glow">
                            <Save className="h-7 w-7 text-amber-500" />
                        </div>
                        <span className="text-gradient-amber">{t('editor.title')}</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 uppercase tracking-[0.3em] text-[10px] font-black">{t('editor.subtitle')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-lg active:scale-95 ${
                            saving ? 'bg-obsidian-surface-highest/40 text-zinc-500' : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                        }`}
                    >
                        {saving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? t('editor.saving') : t('editor.save')}
                    </button>
                    {lead?.vercel_url && (
                        <a href={lead.vercel_url} target="_blank" className="p-4 bg-white/5 border border-white/5 rounded-2xl text-zinc-400 hover:text-amber-500 hover:border-amber-500/30 transition-all backdrop-blur-md">
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
                        className={`p-5 rounded-2xl border flex items-center gap-4 ${
                            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">{message.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                {/* Left: Tab Navigation */}
                <div className="lg:w-72 space-y-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] border transition-all active:scale-95 ${
                                activeTab === tab.id
                                    ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20'
                                    : 'glass-card border-white/5 text-zinc-500 hover:text-white hover:border-amber-500/30'
                            }`}
                        >
                            <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-black' : 'text-amber-500/60'}`} />
                            <span className="font-black text-[11px] uppercase tracking-widest">{tab.label}</span>
                            {activeTab === tab.id && <ChevronRight className={`h-4 w-4 ml-auto ${lang === 'ar' ? 'rotate-180' : ''}`} />}
                        </button>
                    ))}

                    <div className="mt-10 p-8 glass-card rounded-[2rem] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[40px] rounded-full pointer-events-none" />
                        <h4 className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                            <span className="w-4 h-[1px] bg-amber-500/40" />
                            {lang === 'ar' ? 'دعم المصمم' : 'Designer Hub'}
                        </h4>
                        <p className="text-zinc-500 text-[11px] leading-relaxed mb-6 font-black uppercase tracking-widest flex flex-col gap-1">
                            <span>{lang === 'ar' ? 'تحتاج تعديلات' : 'Custom edit'}</span>
                            <span className="text-zinc-600 font-bold normal-case opacity-60 tracking-normal">{lang === 'ar' ? 'تواصل مع خبير التصميم لدينا' : 'Connect with our design crew.'}</span>
                        </p>
                        <a 
                            href="https://wa.me/966507913514?text=Hi! I need help retouching my website." 
                            target="_blank"
                            className="w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all text-[10px] font-black uppercase tracking-widest amber-glow"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {lang === 'ar' ? 'دردشة حية' : 'Live Chat'}
                        </a>
                    </div>
                </div>

                {/* Right: Content Area */}
                <div className="flex-1 glass-card rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col min-h-0 relative shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1 text-gradient-amber opacity-30" />
                    
                    {/* Sub-header with Language Toggle */}
                    {['content', 'services', 'testimonials'].includes(activeTab) && (
                        <div className="px-8 py-5 border-b border-white/5 bg-obsidian-surface-highest/20 flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                                {tabs.find(t => t.id === activeTab).label}
                            </h3>
                            <div className="flex bg-obsidian-dark/40 rounded-xl p-1.5 border border-white/5">
                                <button
                                    onClick={() => setActiveLang('en')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeLang === 'en' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setActiveLang('ar')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeLang === 'ar' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    العربية
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {/* TAB: CONTENT */}
                            {activeTab === 'content' && (
                                <motion.div 
                                    key={`content-${activeLang}`}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] px-2">{t('editor.fields.title')}</label>
                                        <input 
                                            type="text" 
                                            value={config[activeLang].title} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.title`, e.target.value)}
                                            className="w-full bg-obsidian-surface-highest/20 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-amber-500/50 outline-none font-black text-lg transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] px-2">{t('editor.fields.subtitle')}</label>
                                        <input 
                                            type="text" 
                                            value={config[activeLang].subtitle} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.subtitle`, e.target.value)}
                                            className="w-full bg-obsidian-surface-highest/20 border border-white/5 rounded-2xl px-6 py-4 text-zinc-300 focus:border-amber-500/50 outline-none font-bold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] px-2">{t('editor.fields.hero')}</label>
                                        <textarea 
                                            rows="3"
                                            value={config[activeLang].hero_text} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.hero_text`, e.target.value)}
                                            className="w-full bg-obsidian-surface-highest/20 border border-white/5 rounded-2xl px-6 py-4 text-zinc-400 focus:border-amber-500/50 outline-none resize-none font-medium leading-relaxed transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] px-2">{t('editor.fields.about')}</label>
                                        <textarea 
                                            rows="6"
                                            value={config[activeLang].about} 
                                            onChange={(e) => updateNestedConfig(`${activeLang}.about`, e.target.value)}
                                            className="w-full bg-obsidian-surface-highest/20 border border-white/5 rounded-2xl px-6 py-4 text-zinc-400 focus:border-amber-500/50 outline-none resize-none font-medium leading-relaxed transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: SERVICES */}
                            {activeTab === 'services' && (
                                <motion.div 
                                    key={`services-${activeLang}`}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    {config[activeLang].services.map((service, idx) => (
                                        <div key={idx} className="relative group glass-card border border-white/5 p-8 rounded-[2rem] hover:border-amber-500/20 transition-all">
                                            <button 
                                                onClick={() => removeListItem('services', idx)}
                                                className="absolute -top-3 -right-3 p-2.5 bg-red-500 text-black rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="block text-[9px] font-black text-amber-500/50 uppercase tracking-[0.2em]">{t('editor.fields.serviceTitle')}</label>
                                                        <input 
                                                            type="text" 
                                                            value={service.title} 
                                                            onChange={(e) => {
                                                                const newSvcs = [...config[activeLang].services];
                                                                newSvcs[idx].title = e.target.value;
                                                                updateNestedConfig(`${activeLang}.services`, newSvcs);
                                                            }}
                                                            className="w-full bg-obsidian-surface-highest/10 border border-white/5 rounded-xl px-5 py-3 text-white focus:border-amber-500/40 outline-none text-[13px] font-black tracking-wide"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="block text-[9px] font-black text-amber-500/50 uppercase tracking-[0.2em]">{t('editor.fields.serviceDesc')}</label>
                                                        <textarea 
                                                            rows="3"
                                                            value={service.text} 
                                                            onChange={(e) => {
                                                                const newSvcs = [...config[activeLang].services];
                                                                newSvcs[idx].text = e.target.value;
                                                                updateNestedConfig(`${activeLang}.services`, newSvcs);
                                                            }}
                                                            className="w-full bg-obsidian-surface-highest/10 border border-white/5 rounded-xl px-5 py-3 text-zinc-400 focus:border-amber-500/40 outline-none text-xs leading-relaxed resize-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-black/20 p-6 relative group/upload hover:border-amber-500/30 transition-all">
                                                    {service.photo ? (
                                                        <img src={service.photo} className="w-full h-40 object-cover rounded-xl mb-4 grayscale group-hover/upload:grayscale-0 transition-all duration-500 shadow-xl" />
                                                    ) : (
                                                        <ImageIcon className="w-10 h-10 text-zinc-800 mb-3 group-hover/upload:text-amber-500/40 transition-colors" />
                                                    )}
                                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em] text-center max-w-[150px] leading-relaxed">
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
                                        className="w-full py-6 border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center gap-4 text-zinc-600 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                        <span className="font-black text-[12px] uppercase tracking-[0.3em]">{t('editor.actions.addService')}</span>
                                        <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-lg ml-2 opacity-40">
                                            {config[activeLang].services.length} / {MAX_SERVICES}
                                        </span>
                                    </button>
                                </motion.div>
                            )}

                            {/* TAB: TESTIMONIALS */}
                            {activeTab === 'testimonials' && (
                                <motion.div 
                                    key={`testimonials-${activeLang}`}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {config[activeLang].testimonials.map((testi, idx) => (
                                        <div key={idx} className="relative group glass-card border border-white/5 p-8 rounded-[2rem] flex gap-8 items-start hover:border-amber-500/20 transition-all">
                                            <div className="w-16 h-16 rounded-2xl bg-amber-500/5 border border-white/5 flex items-center justify-center flex-shrink-0 text-amber-500 font-black text-2xl italic uppercase amber-glow">
                                                {testi.name ? testi.name.charAt(0) : '?'}
                                            </div>
                                            <div className="flex-1 space-y-6">
                                                <div className="space-y-3">
                                                    <label className="block text-[9px] font-black text-amber-500/50 uppercase tracking-[0.2em]">{t('editor.fields.testiName')}</label>
                                                    <input 
                                                        type="text" 
                                                        value={testi.name} 
                                                        onChange={(e) => {
                                                            const newTestis = [...config[activeLang].testimonials];
                                                            newTestis[idx].name = e.target.value;
                                                            updateNestedConfig(`${activeLang}.testimonials`, newTestis);
                                                        }}
                                                        className="w-full bg-obsidian-surface-highest/10 border border-white/5 rounded-xl px-5 py-3 text-white focus:border-amber-500/40 outline-none text-[13px] font-black tracking-wide"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="block text-[9px] font-black text-amber-500/50 uppercase tracking-[0.2em]">{t('editor.fields.testiText')}</label>
                                                    <textarea 
                                                        rows="3"
                                                        value={testi.text} 
                                                        onChange={(e) => {
                                                            const newTestis = [...config[activeLang].testimonials];
                                                            newTestis[idx].text = e.target.value;
                                                            updateNestedConfig(`${activeLang}.testimonials`, newTestis);
                                                        }}
                                                        className="w-full bg-obsidian-surface-highest/10 border border-white/5 rounded-xl px-5 py-3 text-zinc-400 focus:border-amber-500/40 outline-none text-xs leading-relaxed resize-none"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeListItem('testimonials', idx)}
                                                className="p-2.5 bg-red-500 text-black rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={() => addListItem('testimonials')}
                                        className="w-full py-6 border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center gap-4 text-zinc-600 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group active:scale-[0.99]"
                                    >
                                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                        <span className="font-black text-[12px] uppercase tracking-[0.3em]">{t('editor.actions.addTesti')}</span>
                                    </button>
                                </motion.div>
                            )}

                            {/* TAB: CONTACT */}
                            {activeTab === 'contact' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="space-y-10"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] px-2">{t('editor.fields.phone')}</label>
                                            <input 
                                                type="text" 
                                                placeholder="+966..."
                                                value={config.contact.phone} 
                                                onChange={(e) => updateNestedConfig(`contact.phone`, e.target.value)}
                                                className="w-full bg-obsidian-surface-highest/20 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-amber-500/50 outline-none font-black text-[13px] tracking-widest transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] px-2">{t('editor.fields.email')}</label>
                                            <input 
                                                type="email" 
                                                placeholder="info@yourbrand.com"
                                                value={config.contact.email} 
                                                onChange={(e) => updateNestedConfig(`contact.email`, e.target.value)}
                                                className="w-full bg-obsidian-surface-highest/20 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-amber-500/50 outline-none font-bold text-[13px] transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] px-2">{t('editor.fields.address')}</label>
                                        <textarea 
                                            rows="3"
                                            value={config.contact.address} 
                                            onChange={(e) => updateNestedConfig(`contact.address`, e.target.value)}
                                            className="w-full bg-obsidian-surface-highest/20 border border-white/5 rounded-2xl px-6 py-4 text-zinc-400 focus:border-amber-500/50 outline-none resize-none font-medium leading-relaxed transition-all"
                                        />
                                    </div>
                                    <div className="p-8 glass-card border border-amber-500/20 rounded-[2.5rem] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />
                                        <label className="flex items-center gap-3 text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6">
                                            <Info className="w-4 h-4" />
                                            {t('editor.fields.maps')}
                                        </label>
                                        <textarea 
                                            rows="4"
                                            placeholder="<iframe src='...'></iframe>"
                                            value={config.contact.google_maps_iframe} 
                                            onChange={(e) => updateNestedConfig(`contact.google_maps_iframe`, e.target.value)}
                                            className="w-full bg-obsidian-dark/60 border border-white/5 rounded-2xl px-6 py-5 text-amber-200/40 font-mono text-[10px] outline-none resize-none leading-relaxed transition-all focus:border-amber-500/30"
                                        />
                                        <p className="mt-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-1 italic">
                                            {lang === 'ar' ? 'الصق كود iframe من خرائط جوجل هنا' : 'Paste the Google Maps iframe code here for active location tracking.'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB: PHOTOS */}
                            {activeTab === 'photos' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-10"
                                >
                                    {[
                                        { id: 'hero', label: t('editor.fields.heroPhoto'), dim: '1920x1080' },
                                        { id: 'about', label: t('editor.fields.aboutPhoto'), dim: '800x600' }
                                    ].map(item => (
                                        <div key={item.id} className="glass-card border border-white/5 p-8 rounded-[2.5rem] group hover:border-amber-500/20 transition-all flex flex-col h-full">
                                            <label className="block text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-6">{item.label}</label>
                                            <div className="aspect-video w-full rounded-[1.5rem] bg-black/40 border-2 border-dashed border-white/5 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-amber-500/20 transition-all">
                                                {config.photos[item.id] ? (
                                                    <img src={config.photos[item.id]} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" />
                                                ) : (
                                                    <ImageIcon className="w-12 h-12 text-zinc-800" />
                                                )}
                                                <div className="absolute inset-0 bg-obsidian-dark/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                                                    <button className="px-8 py-4 bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-2xl mb-5 relative overflow-hidden active:scale-95 transition-transform">
                                                        {lang === 'ar' ? 'رفع صورة' : 'Upload Asset'}
                                                        <input 
                                                            type="file" 
                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                            onChange={(e) => handleFileUpload(e, 'photos', item.id)}
                                                            accept="image/*"
                                                        />
                                                    </button>
                                                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-60">{item.dim} OPTIMIZED</p>
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center mt-auto">
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest leading-none mb-1">Source Path</p>
                                                    <p className="text-[10px] text-zinc-400 font-black tracking-tighter truncate max-w-[140px] lowercase">{config.photos[item.id] ? config.photos[item.id].split('/').pop() : 'default_v2.png'}</p>
                                                </div>
                                                <button 
                                                    onClick={() => updateNestedConfig(`photos.${item.id}`, '')}
                                                    className="inline-flex items-center gap-2.5 px-4 py-2.5 glass-card border border-white/5 rounded-xl text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all text-[9px] font-black uppercase tracking-widest"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
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
