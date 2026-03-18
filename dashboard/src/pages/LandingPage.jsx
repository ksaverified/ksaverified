import React, { useState, useEffect } from 'react';

const translations = {
    en: {
        title: "KSA Verified",
        subtitle: "Premium AI-powered business websites for Saudi entrepreneurs. Professional, fast, and local.",
        adminAccess: "Admin Access",
        clientLogin: "Client Login",
        offerTitle: "Launch Your Presence for FREE",
        trial: "1 Week Free Trial",
        whatsapp: "Automatic WhatsApp Lead Sync",
        analytics: "Professional Analytics",
        pricing: "19 SAR/mo (First Year)",
        noCommitment: "No commitment. Cancel anytime.",
        getStarted: "Get Started Now"
    },
    ar: {
        title: "KSA Verified",
        subtitle: "مواقع أعمال متميزة مدعومة بالذكاء الاصطناعي لرواد الأعمال السعوديين. احترافية وسريعة ومحلية.",
        adminAccess: "دخول المسؤول",
        clientLogin: "دخول العميل",
        offerTitle: "أطلق تواجدك مجانًا",
        trial: "تجربة مجانية لمدة أسبوع",
        whatsapp: "مزامنة تلقائية لعملاء واتساب",
        analytics: "تحليلات احترافية",
        pricing: "19 ريال/شهر (السنة الأولى)",
        noCommitment: "بدون التزام. يمكنك الإلغاء في أي وقت.",
        getStarted: "ابدأ الآن"
    }
};

const LandingPage = () => {
    const [lang, setLang] = useState('en');
    const t = translations[lang];

    useEffect(() => {
        document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    return (
        <div className={`min-h-screen bg-[#080809] text-white flex flex-col items-center justify-center p-6 text-center transition-all duration-500 font-sans ${lang === 'ar' ? 'font-arabic' : ''}`}>
            {/* Lang Switcher */}
            <div className="absolute top-6 right-6">
                <button 
                    onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-bold border border-zinc-700 transition-all"
                >
                    {lang === 'en' ? 'Arabic / العربية' : 'English / الإنجليزية'}
                </button>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
                {t.title}
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mb-8 leading-relaxed">
                {t.subtitle}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
                <a href="/admin" className="px-8 py-3 bg-primary hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                    {t.adminAccess}
                </a>
                <a href="/client-dashboard/login" className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all border border-zinc-700">
                    {t.clientLogin}
                </a>
            </div>
            
            <div className="mt-20 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 max-w-lg backdrop-blur-md">
                <h2 className="text-2xl font-bold mb-6 text-blue-400">{t.offerTitle}</h2>
                <ul className={`text-left space-y-4 mb-8 ${lang === 'ar' ? 'text-right' : ''}`}>
                    <li className="flex items-center gap-3">
                        <span className="text-emerald-400 text-xl">✓</span> {t.trial}
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-emerald-400 text-xl">✓</span> {t.whatsapp}
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-emerald-400 text-xl">✓</span> {t.analytics}
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-emerald-400 text-xl">✓</span> {t.pricing}
                    </li>
                </ul>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold border-t border-zinc-800 pt-6">
                    {t.noCommitment}
                </p>
            </div>
        </div>
    );
};

export default LandingPage;
