import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, BookOpen, FileText, ChevronRight, Globe } from 'lucide-react';
import './index.css';

import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

const translations = {
  en: {
    home: "Home",
    about: "About Us",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    goToApp: "Go to Dashboard",
    heroTitle: <>Trust & Transparency <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Built for Business.</span></>,
    heroSub: "Welcome to the corporate portal for KSAVerified. Review our regulatory compliances, terms of operation, and structural frameworks tailored for the Kingdom of Saudi Arabia.",
    card1Title: "About the Company",
    card1Desc: "Our mission to verify and operationalize local businesses.",
    card2Title: "Privacy & Data",
    card2Desc: "How we protect consumer and business information under the PDPL.",
    card3Title: "Terms of Service",
    card3Desc: "The legal framework for utilizing our platform.",
    readDoc: "Read Document",
    copyright: `© ${new Date().getFullYear()} KSAVerified. A KSA Intelligence Ops Venture. All rights reserved.`,
    lastUpdated: "Last Updated",
    backToHome: "Back to Home",
    
    // Privacy
    privacyTitle: "Privacy Policy",
    priv1Title: "1. Data Collection & PDPL Compliance",
    priv1Desc: "At KSAVerified, we place the highest priority on data sovereignty. We are fully compliant with the Saudi Personal Data Protection Law (PDPL). All consumer data and WhatsApp interaction logs are securely stored and processed within the Kingdom of Saudi Arabia.",
    priv2Title: "2. Information We Collect",
    priv2Point1: "Business registration details (CR, Identifications) for validation.",
    priv2Point2: "Anonymized analytics from customer interactions via the unified platform.",
    priv2Point3: "WhatsApp routing metadata, which is encrypted and never sold to third parties.",
    priv3Title: "3. Consumer Rights",
    priv3Desc: "Under the PDPL, consumers have the right to access, correct, or request the deletion of their personal data. KSAVerified provides automated workflows to fulfill these rights instantly.",
    priv4Title: "4. Infrastructure Security",
    priv4Desc: "Our infrastructure relies on NCA-certified local cloud providers, ensuring maximum encryption at rest and in transit.",
    
    // Terms
    termsTitle: "Terms of Service",
    term1Title: "1. Acceptance of Terms",
    term1Desc: "By operating your digital storefront under the KSAVerified umbrella, your business agrees to abide by our fair usage models and content policies aligned with the Ministry of Commerce regulations.",
    term2Title: "2. Platform Provisioning",
    term2Desc: "KSAVerified grants you a non-exclusive, revocable license to use our AI-generated websites and WhatsApp communication layers for legitimate business operations within Saudi Arabia.",
    term3Title: "3. User Conduct",
    term3Desc: "Businesses must accurately represent their services. Misrepresentation or engaging in prohibited commercial activities will result in immediate termination of the Verified status.",
    term4Title: "4. Limitation of Liability",
    term4Desc: "While we ensure 99.9% uptime on our local infrastructure, KSAVerified is not liable for indirect losses related to third-party telecommunications (e.g., WhatsApp outages).",
    
    // About
    aboutTitle: "About KSAVerified",
    aboutIntro: "KSAVerified is a premier digital infrastructure provider dedicated to unlocking the ultimate local marketplace for Saudi businesses.",
    aboutMissionTitle: "Our Mission",
    aboutMissionDesc: "We believe every business deserves an incredible online presence. We streamline discovery, aesthetic presentation, and lead funnel tracking into a single seamless offering that requires zero technical knowledge.",
    aboutVisionTitle: "The Vision",
    aboutVisionDesc: "Aligning deeply with the Kingdom's digital transformation initiatives, we aim to map and digitize 100,000 local businesses by bridging the gap between traditional commerce and global tech standards.",
    aboutSaudiTitle: "Vision 2030 Aligned",
    aboutSaudiDesc: "100% locally developed and hosted, supporting the growth of domestic digital capabilities and securing the Saudi data economy."
  },
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    goToApp: "لوحة التحكم",
    heroTitle: <>الثقة والشفافية <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">صُممت للأعمال.</span></>,
    heroSub: "مرحباً بكم في البوابة الرسمية لـ KSAVerified. راجع الامتثال التنظيمي وشروط التشغيل والأطر الهيكلية المصممة خصيصاً للمملكة العربية السعودية.",
    card1Title: "عن الشركة",
    card1Desc: "مهمتنا في التحقق من الشركات المحلية وتشغيلها رقمياً.",
    card2Title: "الخصوصية والبيانات",
    card2Desc: "كيف نحمي معلومات المستهلكين والشركات وفقاً لنظام حماية البيانات الشخصية.",
    card3Title: "شروط الخدمة",
    card3Desc: "الإطار القانوني لاستخدام منصتنا.",
    readDoc: "قراءة الوثيقة",
    copyright: `© ${new Date().getFullYear()} KSAVerified. مشروع من KSA Intelligence Ops. جميع الحقوق محفوظة.`,
    lastUpdated: "آخر تحديث",
    backToHome: "العودة للرئيسية",
    
    // Privacy
    privacyTitle: "سياسة الخصوصية",
    priv1Title: "1. جمع البيانات والامتثال لنظام حماية البيانات الشخصية (PDPL)",
    priv1Desc: "في KSAVerified، نضع سيادة البيانات في أعلى أولوياتنا. نحن ملتزمون بالكامل بنظام حماية البيانات الشخصية السعودي (PDPL). يتم تخزين جميع بيانات المستهلكين وسجلات تفاعلات واتساب ومعالجتها بشكل آمن داخل المملكة العربية السعودية.",
    priv2Title: "2. المعلومات التي نجمعها",
    priv2Point1: "تفاصيل تسجيل الأعمال (السجل التجاري، الهويات) بغرض التحقق.",
    priv2Point2: "تحليلات مجهولة الهوية لتفاعلات العملاء عبر المنصة الموحدة.",
    priv2Point3: "بيانات توجيه واتساب الوصفية، وهي مشفرة ولا يتم بيعها لأطراف ثالثة أبداً.",
    priv3Title: "3. حقوق المستهلك",
    priv3Desc: "بموجب نظام حماية البيانات الشخصية، للمستهلكين الحق في الوصول إلى بياناتهم الشخصية أو تصحيحها أو طلب حذفها. توفر KSAVerified مسارات عمل آلية لتلبية هذه الحقوق فوراً.",
    priv4Title: "4. أمن البنية التحتية",
    priv4Desc: "تعتمد بنيتنا التحتية على مزودي خدمات سحابية محليين معتمدين من الهيئة الوطنية للأمن السيبراني، مما يضمن أقصى درجات التشفير أثناء التخزين والنقل.",
    
    // Terms
    termsTitle: "شروط الخدمة",
    term1Title: "1. قبول الشروط",
    term1Desc: "من خلال تشغيل متجرك الرقمي تحت مظلة KSAVerified، يوافق عملك على الالتزام بنماذج الاستخدام العادل وسياسات المحتوى الخاصة بنا والمتوافقة مع لوائح وزارة التجارة.",
    term2Title: "2. توفير المنصة",
    term2Desc: "تمنحك KSAVerified ترخيصاً غير حصري وقابل للإلغاء لاستخدام مواقعنا المنشأة بالذكاء الاصطناعي وطبقات اتصال واتساب لعمليات تجارية مشروعة داخل السعودية.",
    term3Title: "3. سلوك المستخدم",
    term3Desc: "يجب على الشركات تمثيل خدماتها بدقة. سيؤدي التحريف أو الانخراط في أنشطة تجارية محظورة إلى الإنهاء الفوري لحالة \"التحقق\".",
    term4Title: "4. حدود المسؤولية",
    term4Desc: "بينما نضمن وقت تشغيل بنسبة 99.9% على بنيتنا التحتية المحلية، فإن KSAVerified ليست مسؤولة عن الخسائر غير المباشرة المتعلقة باتصالات الأطراف الثالثة (مثل انقطاع واتساب).",
    
    // About
    aboutTitle: "عن KSAVerified",
    aboutIntro: "KSAVerified هو مزود رائد للبنية التحتية الرقمية، مكرس لإطلاق السوق المحلي النهائي للشركات السعودية.",
    aboutMissionTitle: "مهمتنا",
    aboutMissionDesc: "نؤمن بأن كل عمل يستحق تواجدًا مذهلاً على الإنترنت. نحن نسهل الاكتشاف، العرض الجمالي، وتتبع مسار العملاء المحتملين في عرض سلس واحد لا يتطلب أي معرفة تقنية.",
    aboutVisionTitle: "الرؤية",
    aboutVisionDesc: "تماشياً بعمق مع مبادرات التحول الرقمي في المملكة، نهدف إلى رقمنة 100,000 شركة محلية من خلال سد الفجوة بين التجارة التقليدية ومعايير التكنولوجيا العالمية.",
    aboutSaudiTitle: "متوافق مع رؤية 2030",
    aboutSaudiDesc: "مطوّر ومستضاف محلياً 100%، لدعم نمو القدرات الرقمية المحلية وتأمين اقتصاد البيانات السعودي."
  }
};

function Layout({ children, lang, toggleLang, t }) {
  const location = useLocation();

  useEffect(() => {
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <div className={`min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-300 ${lang === 'ar' ? 'font-arabic' : ''}`}>
      <header className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="KSA Verified" className="h-8 w-8 object-contain mb-0.5" />
            <div>
                <h1 className="text-base font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent leading-none">
                    KSA Verified
                </h1>
                <p className="text-[9px] text-amber-500/60 uppercase tracking-[0.3em] font-black mt-1">Corporate</p>
            </div>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/about" className="hidden sm:block hover:text-white transition-colors">{t.about}</Link>
            <Link to="/privacy" className="hidden sm:block hover:text-white transition-colors">{t.privacy}</Link>
            <Link to="/terms" className="hidden sm:block hover:text-white transition-colors">{t.terms}</Link>
            
            {/* Language Toggle */}
            <button 
                onClick={toggleLang}
                className="flex items-center gap-2 text-xs font-semibold text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-full hover:bg-amber-500/10 transition-all uppercase"
            >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'العربية' : 'EN'}
            </button>

            <a href="https://ksaverified.com" className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors">
              {t.goToApp}
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {location.pathname !== '/' && (
          <Link to="/" className="text-amber-500 hover:text-amber-400 flex items-center mb-6 text-sm font-medium transition-colors">
            {lang === 'ar' ? (
              <><ChevronRight className="w-4 h-4 ml-1" /> {t.backToHome}</>
            ) : (
              <><ChevronRight className="w-4 h-4 rotate-180 mr-1" /> {t.backToHome}</>
            )}
          </Link>
        )}
        {children}
      </main>

      <footer className="border-t border-white/5 bg-zinc-950/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500 gap-4">
          <p>{t.copyright}</p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-zinc-300">{t.privacy}</Link>
            <Link to="/terms" className="hover:text-zinc-300">{t.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Home({ lang, t }) {
  return (
    <div className={`space-y-16 animate-in fade-in duration-500 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
          {t.heroTitle}
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
          {t.heroSub}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: BookOpen, title: t.card1Title, desc: t.card1Desc, to: '/about' },
          { icon: Shield, title: t.card2Title, desc: t.card2Desc, to: '/privacy' },
          { icon: FileText, title: t.card3Title, desc: t.card3Desc, to: '/terms' },
        ].map((item) => (
          <Link key={item.title} to={item.to} className="group block p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-amber-500/50 transition-all">
            <item.icon className={`w-8 h-8 text-amber-500 mb-6 group-hover:scale-110 transition-transform ${lang === 'ar' ? 'ml-auto' : ''}`} />
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{item.desc}</p>
            <div className={`flex items-center text-amber-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity ${lang === 'ar' ? 'justify-end' : ''}`}>
              {lang === 'ar' ? (
                 <>{t.readDoc} <ChevronRight className="w-4 h-4 mr-1 rotate-180" /></>
              ) : (
                 <>{t.readDoc} <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = translations[lang];

  return (
    <BrowserRouter>
      <Layout lang={lang} toggleLang={toggleLang} t={t}>
        <Routes>
          <Route path="/" element={<Home lang={lang} t={t} />} />
          <Route path="/about" element={<About lang={lang} t={t} />} />
          <Route path="/privacy" element={<Privacy lang={lang} t={t} />} />
          <Route path="/terms" element={<Terms lang={lang} t={t} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
