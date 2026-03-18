import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle2, ChevronRight, Zap, XCircle, User } from 'lucide-react';

const LandingPage = () => {
    const [lang, setLang] = useState('en');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Phone, 2: Confirm/Manual, 3: Building, 4: Success
    const [phone, setPhone] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [manualData, setManualData] = useState({ name: '', category: '', description: '' });

    const handleLookup = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`/api/lookup?phone=${encodeURIComponent(phone)}`);
            if (resp.ok) {
                const result = await resp.json();
                setLookupResult(result.data);
                setStep(2);
            } else {
                setLookupResult(null);
                setStep(2);
            }
        } catch (err) {
            console.error('Lookup failed', err);
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (businessData) => {
        setLoading(true);
        setStep(3);
        try {
            await fetch('/api/register-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessData })
            });
            setTimeout(() => setStep(4), 3000); // Simulate build progress for UX
        } catch (err) {
            console.error('Registration failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    const toggleLang = () => setLang(prev => (prev === 'en' ? 'ar' : 'en'));

    // Translation mapping for dynamic text
    const t = {
        en: {
            home: "Home",
            solutions: "Solutions",
            pricing: "Pricing",
            clientLogin: "Client Login",
            vision: "Saudi Vision 2030 Ready",
            heroTitle: <>Your Premium Digital Presence, <br/><span className="text-gradient">100% Free.</span></>,
            heroSub: "AI-powered business websites specifically engineered for Saudi entrepreneurs. Professional, lightning-fast, and deeply localized.",
            getStarted: "Get Started",
            viewShowcase: "View Showcase",
            offerTitle: <>GET YOUR WEBSITE <br/><span className="text-gold">100% FREE</span></>,
            offerSub: "No hidden fees. No setup costs. Start your Saudi business journey with zero risk.",
            feature1: "1 Week Full Access Free Trial",
            feature2: "19 SAR/month for the first year",
            feature3: "No Long-term Commitment",
            regularPrice: "Regularly 199 SAR",
            claimOffer: "Claim My Free Site",
            foundingMember: "Founding Member Offer",
            enterpriseTitle: "Enterprise Features for Local Growth",
            enterpriseSub: "Everything you need to run your business in the Kingdom.",
            srv1Title: "Automatic Website Generation",
            srv1Desc: "Our AI creates a high-converting site based on your industry in seconds.",
            srv2Title: "WhatsApp Lead Integration",
            srv2Desc: "Direct connection to your customers where they prefer to chat most.",
            srv3Title: "Analytics Dashboard",
            srv3Desc: "Understand your traffic and conversions with simplified local data insights.",
            srv4Title: "Business Growth Tools",
            srv4Desc: "Integrated SEO and marketing modules to scale beyond the neighborhood.",
            showcaseTitle: "Sample Masterpieces",
            showcaseSub: "See what Saudi businesses are building with KSA Verified.",
            viewAll: "View All Templates",
            poweredBy: "Powered by",
            companyDesc: "Empowering the next generation of Saudi digital commerce. High-performance websites built for the local market.",
            copyright: "© 2026 KSA Verified. A KSA Intelligence Ops Venture."
        },
        ar: {
            home: "الرئيسية",
            solutions: "الحلول",
            pricing: "الأسعار",
            clientLogin: "دخول العميل",
            vision: "جاهز لرؤية السعودية 2030",
            heroTitle: <>تواجدك الرقمي المتميز، <br/><span className="text-gradient">مجاني 100%.</span></>,
            heroSub: "مواقع أعمال مدعومة بالذكاء الاصطناعي مصممة خصيصاً لرواد الأعمال السعوديين. احترافية، سريعة البرق، ومحلية بعمق.",
            getStarted: "ابدأ الآن",
            viewShowcase: "عرض النماذج",
            offerTitle: <>احصل على موقعك <br/><span className="text-gold">مجاناً 100%</span></>,
            offerSub: "لا توجد رسوم خفية. لا توجد تكاليف إعداد. ابدأ رحلتك التجارية في السعودية بدون مخاطر.",
            feature1: "تجربة مجانية كاملة لمدة أسبوع",
            feature2: "19 ريال/شهرياً للسنة الأولى",
            feature3: "بدون التزام طويل الأمد",
            regularPrice: "السعر الأصلي 199 ريال",
            claimOffer: "احصل على موقعي المجاني",
            foundingMember: "عرض العضو المؤسس",
            enterpriseTitle: "ميزات احترافية للنمو المحلي",
            enterpriseSub: "كل ما تحتاجه لإدارة عملك في المملكة.",
            srv1Title: "إنشاء تلقائي للمواقع",
            srv1Desc: "يقوم ذكاؤنا الاصطناعي بإنشاء موقع عالي التحويل بناءً على مجالك في ثوانٍ.",
            srv2Title: "تكامل مع واتساب",
            srv2Desc: "اتصال مباشر مع عملائك حيث يفضلون الدردشة أكثر.",
            srv3Title: "لوحة تحليلات",
            srv3Desc: "افهم حركة مرور موقعك وتحويلاتك من خلال رؤى بيانات محلية مبسطة.",
            srv4Title: "أدوات نمو الأعمال",
            srv4Desc: "وحدات تحسين محركات البحث والتسويق المتكاملة للتوسع خارج الحي.",
            showcaseTitle: "روائع من أعمالنا",
            showcaseSub: "شاهد ما تبنيه الشركات السعودية مع KSA Verified.",
            viewAll: "عرض جميع القوالب",
            poweredBy: "بدعم من",
            companyDesc: "تمكين الجيل القادم من التجارة الرقمية السعودية. مواقع عالية الأداء صممت للسوق المحلي.",
            copyright: "© 2026 KSA Verified. مشروع من KSA Intelligence Ops."
        }
    };

    const currentT = t[lang];

    return (
        <div className={`font-sans antialiased text-[#f8f9fa] bg-[#0a0a0c] ${lang === 'ar' ? 'font-arabic' : ''}`}>
            {/* Onboarding Modal Overlay */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-[#121215] border border-white/10 p-8 rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
                            
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>

                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 mb-4">
                                            <Smartphone className="h-8 w-8 text-brand" />
                                        </div>
                                        <h2 className="text-2xl font-heading font-bold">{lang === 'en' ? 'Build My Website' : 'ابنِ موقعي'}</h2>
                                        <p className="text-gray-400 mt-2">{lang === 'en' ? 'Enter your WhatsApp number to start.' : 'أدخل رقم الواتساب الخاص بك للبدء.'}</p>
                                    </div>
                                    <div className="space-y-4">
                                        <input 
                                            type="tel"
                                            placeholder="966 5X XXX XXXX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-mono"
                                        />
                                        <button 
                                            onClick={handleLookup}
                                            disabled={!phone || loading}
                                            className="w-full py-4 bg-brand hover:brightness-110 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>{lang === 'en' ? 'CONTINUE' : 'استمرار'}</span>
                                                    <ChevronRight className="h-5 w-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    {lookupResult ? (
                                        <>
                                            <div className="text-center">
                                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                </div>
                                                <h2 className="text-xl font-heading font-bold">{lang === 'en' ? 'Is this your business?' : 'هل هذا هو عملك؟'}</h2>
                                                <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                    <p className="text-lg font-bold text-white leading-tight">{lookupResult.name}</p>
                                                    <p className="text-sm text-gray-500 mt-1">{lookupResult.address}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => setLookupResult(null)}
                                                    className="py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                                                >
                                                    {lang === 'en' ? 'Not me' : 'ليس أنا'}
                                                </button>
                                                <button 
                                                    onClick={() => handleRegister(lookupResult)}
                                                    className="py-3 bg-brand text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-brand/20"
                                                >
                                                    {lang === 'en' ? 'Yes, build it!' : 'نعم، ابنهِ!'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-center">
                                                <h2 className="text-xl font-heading font-bold">{lang === 'en' ? 'Tell us about your business' : 'أخبرنا عن عملك'}</h2>
                                                <p className="text-gray-500 text-sm mt-1">{lang === 'en' ? "We couldn't find you on Maps. Please fill in the details." : "لم نجدك على الخرائط. يرجى ملء التفاصيل."}</p>
                                            </div>
                                            <div className="space-y-3">
                                                <input 
                                                    placeholder={lang === 'en' ? 'Business Name' : 'اسم العمل'}
                                                    value={manualData.name}
                                                    onChange={(e) => setManualData({...manualData, name: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                                />
                                                <input 
                                                    placeholder={lang === 'en' ? 'Category (e.g. Restaurant, Cafe)' : 'الفئة (مثلاً مطعم، مقهى)'}
                                                    value={manualData.category}
                                                    onChange={(e) => setManualData({...manualData, category: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                                />
                                                <textarea 
                                                    placeholder={lang === 'en' ? 'Short description of your services' : 'وصف قصير لخدماتك'}
                                                    value={manualData.description}
                                                    onChange={(e) => setManualData({...manualData, description: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white h-24"
                                                />
                                                <button 
                                                    onClick={() => handleRegister({ ...manualData, phone, types: [manualData.category] })}
                                                    disabled={!manualData.name || !manualData.category}
                                                    className="w-full py-4 bg-brand text-white font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-brand/20"
                                                >
                                                    {lang === 'en' ? 'BUILD MY SITE' : 'ابنِ موقعي'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="text-center py-8 space-y-6">
                                    <div className="relative h-24 w-24 mx-auto">
                                        <div className="absolute inset-0 border-4 border-brand/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                                        <Zap className="absolute inset-0 m-auto h-12 w-12 text-brand animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-heading font-bold">{lang === 'en' ? 'Building Your Site...' : 'جاري بناء موقعك...'}</h2>
                                        <p className="text-gray-400 mt-2">{lang === 'en' ? 'Gemini AI is crafting your professional design.' : 'يقوم Gemini AI بصياغة تصميمك الاحترافي.'}</p>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 10, ease: "linear" }}
                                            className="h-full bg-brand shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="text-center space-y-6">
                                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4 animate-bounce">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-heading font-bold tracking-tight">{lang === 'en' ? 'Almost Ready!' : 'جاهز تقريباً!'}</h2>
                                        <p className="text-gray-400 mt-3 leading-relaxed">
                                            {lang === 'en' 
                                            ? "Great! We're finishing the touch-ups. You will receive a WhatsApp message with your preview link in a few minutes." 
                                            : "رائع! نحن ننهي اللمسات الأخيرة. ستتلقى رسالة واتساب تحتوي على رابط المعاينة خلال بضع دقائق."}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        {lang === 'en' ? 'BACK TO HOME' : 'العودة للرئيسية'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* BEGIN: Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center glow-gold">
                                <img src="/logo.png" alt="KSA Verified Logo" className="w-full h-full object-contain rounded-twelve" />
                            </div>
                            <span className="font-heading font-bold text-2xl tracking-tight">KSA <span className="text-brand">Verified</span></span>
                        </div>
                        {/* Mobile & Desktop Actions (Always visible) */}
                        <div className="flex items-center gap-4">
                            {/* Client Login (Hidden on small mobile if it feels too cramped, but let's try keeping it) */}
                            <a href="/client-dashboard/login" className="hidden sm:block px-5 py-2 rounded-twelve border border-white/20 hover:bg-white/5 transition-all text-sm font-medium">
                                {currentT.clientLogin}
                            </a>
                            
                            {/* Language Toggle */}
                            <button 
                                onClick={toggleLang}
                                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gold border border-gold/30 px-3 py-1.5 rounded-full hover:bg-gold/10 transition-all uppercase"
                            >
                                {lang === 'en' ? 'EN | العربية' : 'AR | English'}
                            </button>
                        </div>

                        {/* Desktop-only Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-8 mr-4 rtl:mr-0 rtl:ml-4">
                            <a className="text-gray-300 hover:text-white transition-colors text-sm" href="#">{currentT.home}</a>
                            <a className="text-gray-300 hover:text-white transition-colors text-sm" href="#services">{currentT.solutions}</a>
                            <a className="text-gray-300 hover:text-white transition-colors text-sm" href="#pricing">{currentT.pricing}</a>
                        </div>
                    </div>
                </div>
            </nav>
            {/* END: Navigation */}

            <main>
                {/* BEGIN: Hero Section */}
                <section className="relative pt-40 pb-20 px-4 overflow-hidden">
                    <div className="hero-glow -top-24 -left-24"></div>
                    <div className="hero-glow -right-24 top-48 left-auto bg-gradient-radial from-electric/10 to-transparent"></div>
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="inline-block px-4 py-1.5 mb-6 border border-brand/50 bg-brand/10 rounded-full text-brand-light text-sm font-semibold tracking-wide uppercase">
                            {currentT.vision}
                        </div>
                        <h1 className="font-heading text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                            {currentT.heroTitle}
                        </h1>
                        <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-10 leading-relaxed">
                            {currentT.heroSub}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button 
                                onClick={() => { setIsModalOpen(true); setStep(1); }}
                                className="px-10 py-4 bg-brand hover:brightness-110 text-white font-bold rounded-twelve shadow-lg glow-purple transition-all text-lg min-w-[200px] flex items-center justify-center"
                            >
                                {currentT.getStarted}
                            </button>
                            <a href="#showcase" className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-twelve transition-all text-lg min-w-[200px] flex items-center justify-center">
                                {currentT.viewShowcase}
                            </a>
                        </div>
                    </div>
                </section>
                {/* END: Hero Section */}

                {/* BEGIN: Offer Section (Trial) */}
                <section className="py-20 px-4" id="pricing">
                    <div className="max-w-5xl mx-auto">
                        <div className="glass-card rounded-[24px] p-8 md:p-12 relative overflow-hidden border-2 border-brand/20">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <svg className="w-32 h-32 text-brand" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"></path></svg>
                            </div>
                            <div className="grid md:grid-cols-2 gap-12 items-center text-left rtl:text-right">
                                <div>
                                    <h2 className="text-3xl font-heading font-bold mb-4">{currentT.offerTitle}</h2>
                                    <p className="text-gray-400 mb-8">{currentT.offerSub}</p>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3">
                                            <div className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shrink-0">✓</div>
                                            <span>{currentT.feature1}</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shrink-0">✓</div>
                                            <span>{currentT.feature2}</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shrink-0">✓</div>
                                            <span>{currentT.feature3}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="bg-black/40 rounded-twelve p-8 text-center border border-white/5">
                                    <span className="block text-gray-500 line-through text-lg">{currentT.regularPrice}</span>
                                    <div className="text-6xl font-extrabold my-2 text-white">0 <span className="text-xl font-normal text-gray-400">SAR</span></div>
                                    <p className="text-sm text-brand-light font-bold tracking-widest uppercase mb-6">{currentT.foundingMember}</p>
                                    <a href="/client-dashboard/login" className="w-full py-4 bg-white text-black font-bold rounded-twelve hover:bg-gray-200 transition-all block text-center">
                                        {currentT.claimOffer}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* END: Offer Section --> */}

                {/* BEGIN: Services Section */}
                <section className="py-24 px-4 bg-[#0d0d10]" id="services">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-heading font-bold mb-4">{currentT.enterpriseTitle}</h2>
                            <p className="text-gray-400">{currentT.enterpriseSub}</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left rtl:text-right">
                            {/* Card 1 */}
                            <div className="glass-card p-8 rounded-twelve hover:border-brand/40 transition-all group">
                                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{currentT.srv1Title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{currentT.srv1Desc}</p>
                            </div>
                            {/* Card 2 */}
                            <div className="glass-card p-8 rounded-twelve hover:border-electric/40 transition-all group">
                                <div className="w-12 h-12 bg-electric/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-electric" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{currentT.srv2Title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{currentT.srv2Desc}</p>
                            </div>
                            {/* Card 3 */}
                            <div className="glass-card p-8 rounded-twelve hover:border-brand/40 transition-all group">
                                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{currentT.srv3Title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{currentT.srv3Desc}</p>
                            </div>
                            {/* Card 4 --> */}
                            <div className="glass-card p-8 rounded-twelve hover:border-electric/40 transition-all group">
                                <div className="w-12 h-12 bg-electric/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-electric" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{currentT.srv4Title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{currentT.srv4Desc}</p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* END: Services Section --> */}

                {/* BEGIN: Showcase Section */}
                <section className="py-24 px-4 overflow-hidden" id="showcase">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 text-left rtl:text-right">
                            <div>
                                <h2 className="text-4xl font-heading font-bold mb-4">{currentT.showcaseTitle}</h2>
                                <p className="text-gray-400">{currentT.showcaseSub}</p>
                            </div>
                            <a className="text-brand-light font-bold flex items-center gap-2 hover:gap-4 transition-all" href="#">
                                {currentT.viewAll} <span>{lang === 'ar' ? '←' : '→'}</span>
                            </a>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 text-left rtl:text-right">
                            {/* Item 1 */}
                            <div className="group relative overflow-hidden rounded-twelve">
                                <img alt="Mauve Roses Template" className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANC0NZvWh1aNf5OcXD_FuTKLrby7eSD7ZmhgG12pfZ9gYiYGw0iopZjST4GyxX2UBxNegVGkZN08mxsw7AK7Bie0zK1PYlu3riWNUgB5MtHNYYKNhow92ch6mTSL_Ub1X2X7UFJ0OQTNJAkwrlz3vSZtG4PKW6J9BYjgTfexsFvL7VtBZuLQO4ARljCr1996MppvWHL1s7fc45wbkfC-S_JXv-iRhRJVNMVGfKoUUy9ab2j79TsZBmm4vF5KN24umix93QS73wcEg"/>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                                    <span className="text-xs font-bold text-brand-light tracking-widest uppercase mb-2">Luxury Florist</span>
                                    <h3 className="text-2xl font-bold">Mauve Roses</h3>
                                </div>
                            </div>
                            {/* Item 2 */}
                            <div className="group relative overflow-hidden rounded-twelve">
                                <img alt="Local Barber Template" className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBd57AfzCiDHasq4-Tjrn4QpaP7742FvdBe4C4BcNsTixsgJLcFCJWGhadsEJeqAZH73gt3ok-vBiOefbjf7zhd9eIshw9NrYUd6Eh97lsv0zogbjKp3cWGR2Pqdm5mHGEWptHo_vLdhqg4GBvXYtUdcu6BdzB4rx5w2paPS23QPlkP850xCg5QBSqmVlAyrMeocXfaxnk0Kbn5QJL0aYfJWGKY2uP8q-OdYkHx6FfBEE9EgljhatB7dPxDdCoXxAQ-BVMa7Hiecgg"/>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                                    <span className="text-xs font-bold text-electric tracking-widest uppercase mb-2">Service Business</span>
                                    <h3 className="text-2xl font-bold">The Local Barber</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* END: Showcase Section --> */}

                {/* BEGIN: Trust Banner */}
                <section className="py-12 border-y border-white/5 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-gray-500 font-medium tracking-widest uppercase text-sm mb-0">
                            {currentT.poweredBy} <span className="text-white font-bold px-2 py-1 bg-brand/20 rounded ml-2 mr-2">KSA Intelligence Ops</span>
                        </p>
                    </div>
                </section>
                {/* END: Trust Banner --> */}
            </main>

            {/* BEGIN: Footer */}
            <footer className="pt-20 pb-10 px-4 bg-[#050507]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-16 text-left rtl:text-right">
                        <div className="col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <img src="/logo.png" alt="KSA Verified Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="font-heading font-bold text-xl">KSA Verified</span>
                            </div>
                            <p className="text-gray-500 max-w-sm mb-6">
                                {currentT.companyDesc}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">{currentT.solutions}</h4>
                            <ul className="space-y-4 text-gray-500 text-sm">
                                <li><a className="hover:text-brand-light transition-colors" href="#">E-commerce</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="#">Service Booking</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="#">Local Retail</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="#">Consulting</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">{lang === 'en' ? 'Company' : 'الشركة'}</h4>
                            <ul className="space-y-4 text-gray-500 text-sm">
                                <li><a className="hover:text-brand-light transition-colors" href="#">About Us</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="#">Terms of Service</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="#">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-gray-600">{currentT.copyright}</p>
                        <div className="flex gap-6 opacity-50 grayscale">
                            {/* Placeholder for payment logos using text for now if images fail */}
                            <span className="text-[10px] font-bold tracking-tighter">VISA</span>
                            <span className="text-[10px] font-bold tracking-tighter">MADA</span>
                            <span className="text-[10px] font-bold tracking-tighter">APPLE PAY</span>
                        </div>
                    </div>
                </div>
            </footer>
            {/* END: Footer --> */}
        </div>
    );
};

export default LandingPage;
