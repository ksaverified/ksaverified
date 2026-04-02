import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle2, ChevronRight, Zap, XCircle, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

const LandingPage = () => {
    const [lang, setLang] = useState('en');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Phone, 2: Confirm/Manual, 3: Building, 4: Success
    const [phone, setPhone] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [manualData, setManualData] = useState({ name: '', category: '', description: '' });
    
    const { user } = useAuth();
    const isAdmin = user?.email?.toLowerCase() === 'cupido1romeo@gmail.com';

    const handleLookup = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`/api/leads?action=lookup&phone=${encodeURIComponent(phone)}`);
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
            await fetch('/api/leads?action=register-lead', {
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

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    useEffect(() => {
        const path = location.pathname;
        if (path === '/pricing') {
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        } else if (path === '/showcase') {
            document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
        } else if (path === '/solutions') {
            document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [location]);

    const toggleLang = () => setLang(prev => (prev === 'en' ? 'ar' : 'en'));

    // Translation mapping for dynamic text
    const t = {
        en: {
            home: "Home",
            solutions: "Solutions",
            pricing: "Pricing",
            clientLogin: "Client Login",
            vision: "Saudi Vision 2030 Ready",
            heroTitle: <>The Ultimate Local Presence <br/><span className="text-gradient">for Saudi Success.</span></>,
            heroSub: "Professional, AI-optimized business presence specifically engineered for the Kingdom. Join the verified network of top-performing Saudi brands.",
            getStarted: "Get Started",
            viewShowcase: "View Showcase",
            pricingTitle: "Flexible Growth Plans",
            pricingSub: "Choose the perfect tier to elevate your business presence in the Kingdom.",
            
            planBasic: "Basic",
            planBasicPrice: "19",
            planBasicDesc: "Essential Presence",
            planBasicFeatures: [
                "Map Information Optimization",
                "Operating Hours Update",
                "Review Monitoring",
                "KSA Verified Badge"
            ],

            planPro: "Pro",
            planProPrice: "49",
            planProDesc: "Professional Growth",
            planProFeatures: [
                "Everything in Basic",
                "AI-Generated Website",
                "Advanced Website Editor",
                "Custom Domain Support"
            ],

            planMax: "Max",
            planMaxPrice: "99",
            planMaxDesc: "Market Leadership",
            planMaxFeatures: [
                "Everything in Pro",
                "SEO Management",
                "Advanced Analytics",
                "WhatsApp Lead Integration"
            ],

            mostPopular: "Most Popular",
            trialText: "1-Week Free Trial on All Plans",
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
            showcaseTitle: "Masterpieces Built by AI",
            showcaseSub: "Discover how we turn vision into reality for KSA entrepreneurs.",
            viewAll: "View All Templates",
            poweredBy: "Powered by",
            whyTitle: "Why KSA Verified?",
            whySub: "The smart bridge between your visionary business and the global market.",
            whyHeroTitle: "Elevate Your Digital Presence",
            whyHeroDesc: "Empowering Saudi business owners with a premium digital presence, KSA Verified is the smart bridge between your vision and the global market. Our platform crafts world-class experiences for your business in seconds—deeply localized and lightning-fast.",
            whyPoint1: "Vision 2030 Ready",
            whyPoint1Desc: "Built specifically for the Kingdom's unique market and ambitious goals.",
            whyPoint2: "AI-Driven Localization",
            whyPoint2Desc: "Deeply customized content that speaks your customers' language natively.",
            whyPoint3: "Verified Status",
            whyPoint3Desc: "Join a trusted network of validated Saudi businesses and lead the digital economy.",
            companyDesc: "Empowering the next generation of Saudi digital commerce. High-performance identities built for the local market.",
            copyright: "© 2026 KSA Verified. A KSA Intelligence Ops Venture."
        },
        ar: {
            home: "الرئيسية",
            solutions: "الحلول",
            pricing: "الأسعار",
            clientLogin: "دخول العميل",
            vision: "جاهز لرؤية السعودية 2030",
            heroTitle: <>التواجد الرقمي الأقوى <br/><span className="text-gradient">لنجاح الأعمال السعودية.</span></>,
            heroSub: "هوية تجارية احترافية محسنة بالذكاء الاصطناعي، صُممت خصيصاً للمملكة. انضم إلى شبكة العلامات التجارية السعودية الموثوقة والمتميزة.",
            getStarted: "ابدأ الآن",
            viewShowcase: "عرض النماذج",
            pricingTitle: "خطط نمو مرنة",
            pricingSub: "اختر الباقة المثالية لتعزيز تواجد عملك في المملكة.",

            planBasic: "الأساسية",
            planBasicPrice: "19",
            planBasicDesc: "التواجد الضروري",
            planBasicFeatures: [
                "تحسين معلومات الخرائط",
                "تحديث ساعات العمل",
                "مراقبة المراجعات",
                "شارة KSA Verified"
            ],

            planPro: "المتقدمة",
            planProPrice: "49",
            planProDesc: "النمو الاحترافي",
            planProFeatures: [
                "كل ما في الباقة الأساسية",
                "موقع إلكتروني بالذكاء الاصطناعي",
                "محرر مواقع متقدم",
                "دعم النطاق المخصص"
            ],

            planMax: "القصوى",
            planMaxPrice: "99",
            planMaxDesc: "ريادة السوق",
            planMaxFeatures: [
                "كل ما في الباقة المتقدمة",
                "إدارة محركات البحث (SEO)",
                "تحليلات متقدمة",
                "تكامل واتساب لجذب العملاء"
            ],

            mostPopular: "الأكثر شعبية",
            trialText: "تجربة مجانية لمدة أسبوع لجميع الباقات",
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
            showcaseTitle: "روائع صُنعت بالذكاء الاصطناعي",
            showcaseSub: "اكتشف كيف نحول الرؤية إلى حقيقة لرواد الأعمال السعوديين.",
            viewAll: "عرض جميع القوالب",
            poweredBy: "بدعم من",
            whyTitle: "لماذا KSA Verified؟",
            whySub: "الجسر الذكي بين عملك الطموح والسوق العالمي.",
            whyHeroTitle: "ارتقِ بتواجدك الرقمي",
            whyHeroDesc: "تمكين أصحاب الأعمال في السعودية من خلال حضور رقمي متميز؛ 'KSA Verified' هي الجسر الذكي بين رؤيتك والسوق العالمي. تقوم منصتنا بإنشاء تجارب عالمية المستوى لعملك في ثوانٍ معدودة—مخصصة محلياً بعمق وسريعة البرق.",
            whyPoint1: "جاهزية لرؤية 2030",
            whyPoint1Desc: "مصممة خصيصاً لسوق المملكة الطموح وأهدافه المستقبلية.",
            whyPoint2: "تخصيص ذكي",
            whyPoint2Desc: "محتوى مخصص بعمق يخاطب عملائك بلغتهم الأم وثقافتهم.",
            whyPoint3: "حالة التحقق",
            whyPoint3Desc: "انضم إلى شبكة موثوقة من الشركات السعودية المعتمدة وتقدّم في الاقتصاد الرقمي.",
            companyDesc: "تمكين الجيل القادم من التجارة الرقمية السعودية. هويات رقمية عالية الأداء صممت للسوق المحلي.",
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
                        <div className="flex items-center gap-3">
                            <a 
                                href="/client-dashboard/login" 
                                className="px-3 sm:px-5 py-2 rounded-twelve border border-white/20 hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
                                title={currentT.clientLogin}
                            >
                                <User className="w-4 h-4" />
                                <span className="hidden xs:inline">{currentT.clientLogin}</span>
                            </a>

                            {isAdmin && (
                                <button 
                                    onClick={() => navigate('/admin')}
                                    className="px-3 sm:px-5 py-2 rounded-twelve bg-brand/20 border border-brand/50 hover:bg-brand/30 transition-all text-sm font-bold flex items-center gap-2 text-brand-light"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="hidden xs:inline">Admin</span>
                                </button>
                            )}
                            
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
                            <button onClick={() => navigate('/')} className="text-gray-300 hover:text-white transition-colors text-sm">{currentT.home}</button>
                            <button onClick={() => navigate('/solutions')} className="text-gray-300 hover:text-white transition-colors text-sm">{currentT.solutions}</button>
                            <button onClick={() => navigate('/showcase')} className="text-gray-300 hover:text-white transition-colors text-sm">{currentT.viewShowcase}</button>
                            <button onClick={() => navigate('/pricing')} className="text-gray-300 hover:text-white transition-colors text-sm">{currentT.pricing}</button>
                            <a className="text-gold hover:text-white transition-colors text-sm font-semibold" href="https://ksaverified.store" target="_blank" rel="noopener noreferrer">{lang === 'en' ? 'Store' : 'المتجر'}</a>
                            <a className="text-gray-300 hover:text-white transition-colors text-sm" href="https://ksaverified.info" target="_blank" rel="noopener noreferrer">{lang === 'en' ? 'Corporate' : 'الشركة'}</a>
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

                {/* BEGIN: Why Section (Bilingual Ad Copy) */}
                <section className="py-24 px-4 bg-gradient-to-b from-[#0a0a0c] to-[#121215] border-y border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-brand/5 blur-[120px] rounded-full translate-x-1/2" />
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div 
                                initial={{ opacity: 0, x: lang === 'en' ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="text-left rtl:text-right"
                            >
                                <div className="inline-block px-4 py-1.5 mb-6 border border-gold/30 bg-gold/5 rounded-full text-gold text-xs font-bold tracking-widest uppercase">
                                    {currentT.whyTitle}
                                </div>
                                <h2 className="text-4xl md:text-5xl font-heading font-extrabold mb-6 leading-tight">
                                    {currentT.whyHeroTitle}
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                    {currentT.whyHeroDesc}
                                </p>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">{currentT.whyPoint1}</h4>
                                            <p className="text-gray-500 text-sm">{currentT.whyPoint1Desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-brand" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">{currentT.whyPoint2}</h4>
                                            <p className="text-gray-500 text-sm">{currentT.whyPoint2Desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">{currentT.whyPoint3}</h4>
                                            <p className="text-gray-500 text-sm">{currentT.whyPoint3Desc}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                                <img 
                                    src="https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=800" 
                                    alt="Saudi Business Digital Hub" 
                                    className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute bottom-8 left-8 right-8 z-20 text-left rtl:text-right">
                                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-gold font-bold mb-1">{currentT.regularPrice}</p>
                                        <h4 className="text-2xl font-bold text-white leading-tight">{currentT.foundingMember}</h4>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* BEGIN: Pricing Section (3-Tier) */}
                <section className="py-24 px-4 bg-[#0a0a0c]" id="pricing">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">{currentT.pricingTitle}</h2>
                            <p className="text-gray-400 text-lg">{currentT.pricingSub}</p>
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 rounded-full text-brand-light text-sm font-bold">
                                <Zap className="w-4 h-4" /> {currentT.trialText}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Basic Plan */}
                            <div className="glass-card p-8 rounded-[32px] border border-white/5 flex flex-col hover:border-brand/30 transition-all group relative overflow-hidden">
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-gray-400 mb-2">{currentT.planBasic}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-extrabold text-white">{currentT.planBasicPrice}</span>
                                        <span className="text-gray-500 font-bold uppercase text-sm">SAR/mo</span>
                                    </div>
                                    <p className="text-gray-500 mt-4 text-sm">{currentT.planBasicDesc}</p>
                                </div>
                                <ul className="space-y-4 mb-10 flex-grow">
                                    {currentT.planBasicFeatures.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => setIsModalOpen(true)} className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-sm">
                                    {currentT.getStarted}
                                </button>
                            </div>

                            {/* Pro Plan (Featured) */}
                            <div className="glass-card p-8 rounded-[32px] border-2 border-brand bg-brand/5 flex flex-col transform md:-translate-y-4 shadow-2xl shadow-brand/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 px-4 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-tighter rounded-bl-xl">{currentT.mostPopular}</div>
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-brand-light mb-2">{currentT.planPro}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-extrabold text-white">{currentT.planProPrice}</span>
                                        <span className="text-gray-500 font-bold uppercase text-sm">SAR/mo</span>
                                    </div>
                                    <p className="text-gray-300 mt-4 text-sm">{currentT.planProDesc}</p>
                                </div>
                                <ul className="space-y-4 mb-10 flex-grow">
                                    {currentT.planProFeatures.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-white">
                                            <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => setIsModalOpen(true)} className="w-full py-4 bg-brand text-white font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-brand/20 uppercase tracking-widest text-sm">
                                    {currentT.getStarted}
                                </button>
                            </div>

                            {/* Max Plan */}
                            <div className="glass-card p-8 rounded-[32px] border border-white/5 flex flex-col hover:border-brand/30 transition-all group">
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-gold mb-2">{currentT.planMax}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-extrabold text-white">{currentT.planMaxPrice}</span>
                                        <span className="text-gray-500 font-bold uppercase text-sm">SAR/mo</span>
                                    </div>
                                    <p className="text-gray-500 mt-4 text-sm">{currentT.planMaxDesc}</p>
                                </div>
                                <ul className="space-y-4 mb-10 flex-grow">
                                    {currentT.planMaxFeatures.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => setIsModalOpen(true)} className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-sm">
                                    {currentT.getStarted}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                {/* END: Pricing Section */}

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
                <section className="py-24 px-4 bg-[#0d0d10]" id="showcase">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-heading font-bold mb-4">{currentT.showcaseTitle}</h2>
                            <p className="text-gray-400 text-lg">{currentT.showcaseSub}</p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8 text-left rtl:text-right">
                            {/* Item 1: Cafe */}
                            <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#121215]">
                                <div className="aspect-[4/5] overflow-hidden">
                                    <img alt="Modern Cafe" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="/cafe.png"/>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent flex flex-col justify-end p-8">
                                    <span className="text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mb-2">Modern Cafe</span>
                                    <h3 className="text-2xl font-bold text-white mb-2">{lang === 'en' ? 'Saffron & Bean' : 'زعفران وبن'}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2">{lang === 'en' ? 'Premium culinary experience in the heart of Riyadh.' : 'تجربة طهي متميزة في قلب الرياض.'}</p>
                                </div>
                            </div>

                            {/* Item 2: Florist */}
                            <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#121215]">
                                <div className="aspect-[4/5] overflow-hidden">
                                    <img alt="Luxury Florist" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="/florist.png"/>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent flex flex-col justify-end p-8">
                                    <span className="text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mb-2">Luxury Florist</span>
                                    <h3 className="text-2xl font-bold text-white mb-2">{lang === 'en' ? 'The Royal Petal' : 'البتلة الملكية'}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2">{lang === 'en' ? 'Artisanal flower arrangements for Saudis elite.' : 'تنسيقات زهور حرفية لنخبة المجتمع السعودي.'}</p>
                                </div>
                            </div>

                            {/* Item 3: Barber */}
                            <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#121215]">
                                <div className="aspect-[4/5] overflow-hidden">
                                    <img alt="Premium Barber" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="/barber.png"/>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent flex flex-col justify-end p-8">
                                    <span className="text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mb-2">Premium Barber</span>
                                    <h3 className="text-2xl font-bold text-white mb-2">{lang === 'en' ? 'Groomed Excellence' : 'الرجل الأنيق'}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2">{lang === 'en' ? 'The finest grooming services in Jeddah.' : 'أرقى خدمات الحلاقة والعناية في جدة.'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-16 text-center">
                            <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white font-bold hover:bg-white/10 transition-all">
                                {currentT.viewAll}
                            </button>
                        </div>
                    </div>
                </section>
                {/* END: Showcase Section */}

                {/* BEGIN: Trust Banner */}
                <section className="py-12 border-y border-white/5 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-gray-500 font-medium tracking-widest uppercase text-xs mb-0 flex items-center justify-center gap-4">
                            {currentT.poweredBy} <span className="text-white font-bold px-3 py-1 bg-brand/20 rounded-full">KSA Intelligence Ops</span>
                        </p>
                    </div>
                </section>
                {/* END: Trust Banner */}
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
                                <li><a className="hover:text-brand-light transition-colors" href="https://ksaverified.store" target="_blank" rel="noopener noreferrer">Marketplace Store</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">{lang === 'en' ? 'Company' : 'الشركة'}</h4>
                            <ul className="space-y-4 text-gray-500 text-sm">
                                <li><a className="hover:text-brand-light transition-colors" href="https://ksaverified.info/about" target="_blank" rel="noopener noreferrer">About Us</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="https://ksaverified.info/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="https://ksaverified.info/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a></li>
                                <li><a className="hover:text-brand-light transition-colors" href="https://ksaverified.info" target="_blank" rel="noopener noreferrer">Corporate Hub</a></li>
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
