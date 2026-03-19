import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, CheckCircle2, ChevronRight, BookOpen, Award, Zap, ShieldCheck } from 'lucide-react';

const SalesmanOnboarding = () => {
    const [lang, setLang] = useState('en');
    const [step, setStep] = useState(1); // 1: Intro, 2: Reg, 3: IE, 4: Training, 5: Quiz, 6: Success
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});

    useEffect(() => {
        document.title = lang === 'en' ? 'Join the Sales Force | KSA Verified' : 'انضم لفريق المبيعات | KSA Verified';
        document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    const t = {
        en: {
            title: "Join the KSA Verified Sales Force",
            subtitle: "Earn competitive commissions by helping Riyadh businesses go digital.",
            benefit1: "High Commissions: 50 SAR per subscription + bonuses.",
            benefit2: "Flexible Hours: You are your own boss.",
            benefit3: "AI Powered: We provide the leads, you close them.",
            getStarted: "Apply Now",
            step1Title: "Tell us about yourself",
            fullName: "Full Name",
            phone: "WhatsApp Number",
            next: "Next",
            interviewTitle: "AI Interview",
            interviewSub: "Our AI coordinator will ask you a few questions to see if you're a good fit.",
            trainingTitle: "Sales Masterclass",
            trainingSub: "Learn how to pitch KSA Verified to local business owners.",
            quizTitle: "Certification Quiz",
            quizSub: "Pass this simple quiz to unlock your field dashboard.",
            successTitle: "Welcome to the Team!",
            successSub: "Your account is active. You can now start visiting businesses on the map.",
            openDashboard: "Enter Field Dashboard"
        },
        ar: {
            title: "انضم لفريق مبيعات KSA Verified",
            subtitle: "اربح عمولات مجزية من خلال مساعدة الشركات في الرياض على التحول الرقمي.",
            benefit1: "عمولات عالية: 50 ريال لكل اشتراك + مكافآت.",
            benefit2: "ساعات مرنة: أنت مدير نفسك.",
            benefit3: "مدعوم بالذكاء الاصطناعي: نحن نوفر لك العملاء، وأنت تغلق الصفقات.",
            getStarted: "قدم الآن",
            step1Title: "أخبرنا عن نفسك",
            fullName: "الاسم الكامل",
            phone: "رقم الواتساب",
            next: "التالي",
            interviewTitle: "مقابلة الذكاء الاصطناعي",
            interviewSub: "سيقوم منسق الذكاء الاصطناعي لدينا بطرح بعض الأسئلة عليك لمعرفة ما إذا كنت مناسباً.",
            trainingTitle: "دورة المبيعات المكثفة",
            trainingSub: "تعلم كيفية عرض KSA Verified على أصحاب الأعمال المحليين.",
            quizTitle: "اختبار الشهادة",
            quizSub: "اجتز هذا الاختبار البسيط لفتح لوحة التحكم الميدانية الخاصة بك.",
            successTitle: "مرحباً بك في الفريق!",
            successSub: "حسابك نشط الآن. يمكنك البدء في زيارة الشركات عبر الخريطة.",
            openDashboard: "دخول لوحة التحكم الميدانية"
        }
    };

    const currentT = t[lang];

    const handleRegister = async () => {
        setLoading(true);
        try {
            const resp = await fetch('/api/join-sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone
                })
            });
            const data = await resp.json();
            if (data.success) {
                setStep(3); // Go to interview
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (e) {
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleQuizSubmit = () => {
        setStep(6);
    };

    return (
        <div className={`min-h-screen bg-[#0a0a0c] text-white font-sans antialiased ${lang === 'ar' ? 'font-arabic' : ''}`}>
            {/* Header */}
            <nav className="p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" className="w-8 h-8 rounded-lg" alt="Logo" />
                    <span className="font-bold text-xl tracking-tight">KSA Verified <span className="text-brand">Sales</span></span>
                </div>
                <button 
                    onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}
                    className="px-4 py-1.5 rounded-full border border-gold/30 text-gold text-xs font-bold uppercase hover:bg-gold/10 transition-all"
                >
                    {lang === 'en' ? 'العربية' : 'English'}
                </button>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center space-y-12"
                        >
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                                    {currentT.title}
                                </h1>
                                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                                    {currentT.subtitle}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    { icon: Award, text: currentT.benefit1, color: "text-gold", bg: "bg-gold/10" },
                                    { icon: Zap, text: currentT.benefit2, color: "text-brand", bg: "bg-brand/10" },
                                    { icon: ShieldCheck, text: currentT.benefit3, color: "text-emerald-400", bg: "bg-emerald-400/10" }
                                ].map((b, i) => (
                                    <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center gap-4 text-center">
                                        <div className={`w-12 h-12 rounded-xl ${b.bg} flex items-center justify-center`}>
                                            <b.icon className={`w-6 h-6 ${b.color}`} />
                                        </div>
                                        <p className="font-medium text-sm leading-relaxed">{b.text}</p>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setStep(2)}
                                className="px-12 py-5 bg-brand text-white font-bold rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 transition-all text-xl"
                            >
                                {currentT.getStarted}
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-md mx-auto space-y-8"
                        >
                            <div className="text-center">
                                <h2 className="text-3xl font-bold">{currentT.step1Title}</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">{currentT.fullName}</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input 
                                            placeholder="Ahmed Al-Fulan"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-brand/50 transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">{currentT.phone}</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input 
                                            placeholder="966 5X XXX XXXX"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-brand/50 transition-all font-mono"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleRegister}
                                    disabled={!formData.name || !formData.phone || loading}
                                    className="w-full py-5 bg-brand text-white font-bold rounded-xl shadow-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : currentT.next}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 md:p-12 space-y-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-brand" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{currentT.interviewTitle}</h2>
                                    <p className="text-gray-500 text-sm">{currentT.interviewSub}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-brand/10 border-l-4 border-brand rounded-r-2xl">
                                    <p className="text-sm italic">"Ahmed, nice to meet you. Tell me about a time you had to convince a local merchant to try a new digital tool."</p>
                                </div>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 h-40 focus:ring-2 focus:ring-brand/50 transition-all"
                                    placeholder={lang === 'en' ? "Type your answer here..." : "اكتب إجابتك هنا..."}
                                />
                                <button onClick={() => setStep(4)} className="w-full py-4 bg-brand text-white font-bold rounded-xl">{currentT.next}</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div key="step4" className="space-y-8">
                           <div className="text-center">
                                <h2 className="text-3xl font-bold">{currentT.trainingTitle}</h2>
                                <p className="text-gray-400 mt-2">{currentT.trainingSub}</p>
                           </div>
                           <div className="grid gap-4">
                               {[
                                   { title: "The Hook", desc: "Show them the website we already built for them. It's free and personalized." },
                                   { title: "The Trust", desc: "Explain that we are part of Saudi Vision 2030's digital enablement wave." },
                                   { title: "The Close", desc: "Get them to login to their portal. Once they see the views, they are sold." }
                               ].map((m, i) => (
                                   <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex gap-4">
                                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs">{i+1}</div>
                                       <div>
                                           <h4 className="font-bold">{m.title}</h4>
                                           <p className="text-sm text-gray-500">{m.desc}</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                           <button onClick={() => setStep(5)} className="w-full py-5 bg-brand text-white font-bold rounded-xl">{currentT.next}</button>
                        </motion.div>
                    )}

                    {step === 6 && (
                        <motion.div key="step6" className="text-center space-y-8 py-12">
                            <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold">{currentT.successTitle}</h2>
                                <p className="text-xl text-gray-400">{currentT.successSub}</p>
                            </div>
                            <a 
                                href="/admin/sales"
                                className="inline-block px-12 py-5 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all text-xl"
                            >
                                {currentT.openDashboard}
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default SalesmanOnboarding;
