import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Star, TrendingUp, Search, Store, Globe, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import './index.css';

const translations = {
  en: {
    home: "Home",
    products: "Digital Products",
    services: "Partner Services",
    vendorLogin: "Vendor Login",
    heroBadge: "The Premium Saudi Digital Market",
    heroTitle: "Discover vetted digital services and platforms.",
    heroSub: "Purchase premium KSAVerified subscriptions, unlock exclusive templates, or hire services from our verified network of businesses.",
    searchPlaceholder: "Search products or services...",
    searchBtn: "Search",
    cat1Title: "Platform Products",
    cat1Desc: "Unlock premium capabilities for your KSAVerified website, including custom domains and advanced AI tools.",
    cat1Btn: "Browse Products",
    cat2Title: "Partner Services",
    cat2Desc: "Hire vetted KSAVerified customers directly. From legal consultants to graphic designers.",
    cat2Btn: "Explore Services",
    trendingTitle: "Trending Subscriptions",
    byKsa: "By KSAVerified",
    digital: "Digital",
    service: "Service",
    loading: "Loading Items...",
    syncing: "Our catalog is currently syncing with the database.",
    aboutPartner: "Hire trusted professionals from our verified business network.",
    aboutProduct: "Official KSAVerified platform upgrades and add-ons.",
    viewSite: "Visit Website",
    verified: "Verified",
    lastUpdated: "Last Updated",
    copyright: `© ${new Date().getFullYear()} KSAVerified Marketplace. All rights reserved.`,
    privacy: "Privacy",
    terms: "Terms",
    currency: "SAR"
  },
  ar: {
    home: "الرئيسية",
    products: "منتجات رقمية",
    services: "خدمات الشركاء",
    vendorLogin: "دخول التجار",
    heroBadge: "السوق الرقمي السعودي المتميز",
    heroTitle: "اكتشف الخدمات والمنصات الرقمية المعتمدة.",
    heroSub: "اشترِ اشتراكات KSAVerified المميزة، أو اطلب قوالب حصرية، أو وظف خدمات من شبكتنا الموثقة من الأعمال.",
    searchPlaceholder: "ابحث عن منتجات أو خدمات...",
    searchBtn: "بحث",
    cat1Title: "منتجات المنصة",
    cat1Desc: "افتح قوالب إضافية لموقعك، بما في ذلك النطاقات المخصصة وأدوات الذكاء الاصطناعي المتقدمة.",
    cat1Btn: "تصفح المنتجات",
    cat2Title: "خدمات الشركاء",
    cat2Desc: "استأجر خدمات عملاء KSAVerified المعتمدين مباشرة. من المستشارين القانونيين إلى المصممين.",
    cat2Btn: "استكشف الخدمات",
    trendingTitle: "الاشتراكات الأكثر طلبًا",
    byKsa: "بواسطة KSAVerified",
    digital: "رقمي",
    service: "خدمة",
    loading: "جاري التحميل...",
    syncing: "يتم مزامنة الكتالوج الخاص بنا حاليًا مع قاعدة البيانات.",
    aboutPartner: "وظف محترفين موثوقين من شبكة أعمالنا الموثقة.",
    aboutProduct: "ترقيات وإضافات رسمية لمنصة KSAVerified.",
    viewSite: "زيارة الموقع",
    verified: "موثق",
    lastUpdated: "آخر تحديث",
    copyright: `© ${new Date().getFullYear()} سوق KSAVerified. جميع الحقوق محفوظة.`,
    privacy: "الخصوصية",
    terms: "الشروط",
    currency: "ريال"
  }
};

const internalProducts = [
    { id: 'p1', name_en: 'Premium Website Unlock', name_ar: 'فتح الموقع المميز', price: 500, type: 'digital', desc_en: 'Permanent access to your AI-generated website with custom CSS control.', desc_ar: 'وصول دائم لموقعك المنشأ بالذكاء الاصطناعي مع تحكم كامل.' },
    { id: 'p2', name_en: 'Professional SEO Setup', name_ar: 'إعداد SEO احترافي', price: 250, type: 'digital', desc_en: 'Complete indexation of your site on Google Search Console.', desc_ar: 'فهرسة كاملة لموقعك على محركات بحث جوجل.' },
    { id: 'p3', name_en: 'Custom Domain Mapping', name_ar: 'ربط نطاق مخصص', price: 150, type: 'digital', desc_en: 'Connect your .com, .sa or .info domain directly.', desc_ar: 'ربط نطاقك المخصص (.com، .sa، أو .info) مباشرة بموقعك.' },
];

function Layout({ children, lang, toggleLang, t }) {
  useEffect(() => {
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <div className={`min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-300 ${lang === 'ar' ? 'font-arabic' : ''}`}>
      <header className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black text-white tracking-tighter">
              KSA<span className="text-amber-500">Verified</span>
            </span>
            <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 rounded-full font-black ml-2 uppercase tracking-widest">Store</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/products" className="hidden sm:block hover:text-white transition-colors">{t.products}</Link>
            <Link to="/services" className="hidden sm:block hover:text-white transition-colors">{t.services}</Link>
            
            <button onClick={toggleLang} className="flex items-center gap-2 text-[10px] font-black text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-full hover:bg-amber-500/10 transition-all uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5" />
                {lang === 'en' ? 'العربية' : 'EN'}
            </button>

            <a href="https://ksaverified.com" className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors">
              {t.vendorLogin}
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-zinc-950/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500 gap-4">
          <p>{t.copyright}</p>
          <div className="flex space-x-6">
            <a href="https://ksaverified.info/privacy" target="_blank" className="hover:text-zinc-300">{t.privacy}</a>
            <a href="https://ksaverified.info/terms" target="_blank" className="hover:text-zinc-300">{t.terms}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ item, lang, t }) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 hover:border-amber-500/30 transition-all cursor-pointer group animate-in slide-in-from-bottom-2 duration-500">
            <div className="aspect-square bg-black/50 rounded-xl mb-6 flex flex-col items-center justify-center p-8 text-center border border-white/5 group-hover:bg-amber-500/5 transition-all">
                <ShoppingBag className="w-12 h-12 text-zinc-700 group-hover:text-amber-500/40 transition-colors mb-4" />
                <span className="text-[10px] font-black text-zinc-600 group-hover:text-amber-500/60 uppercase tracking-widest">Internal Asset</span>
            </div>
            <h4 className="text-white font-bold text-lg mb-1">{lang === 'en' ? item.name_en : item.name_ar}</h4>
            <p className="text-zinc-500 text-xs mb-4 font-medium">{t.byKsa}</p>
            <p className="text-zinc-400 text-sm mb-6 line-clamp-2 h-10">{lang === 'en' ? item.desc_en : item.desc_ar}</p>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">{item.price}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{t.currency}</span>
                </div>
                <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg border border-amber-500/20 tracking-widest uppercase">{t.digital}</span>
            </div>
        </div>
    );
}

function ServiceCard({ lead, lang, t }) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-500/20 transition-all cursor-pointer group animate-in slide-in-from-bottom-2 duration-500">
            <div className="aspect-video bg-black/50 rounded-xl mb-6 overflow-hidden relative border border-white/5 group-hover:border-emerald-500/20 transition-all">
                {lead.photos && lead.photos[0] ? (
                    <img src={lead.photos[0]} alt={lead.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                        <Store className="w-10 h-10 text-zinc-700 mb-2" />
                    </div>
                )}
                <div className="absolute top-4 right-4">
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-black text-emerald-400 tracking-widest uppercase">
                        <ShieldCheck className="w-3 h-3" /> {t.verified}
                    </span>
                </div>
            </div>
            
            <h4 className="text-white font-bold text-lg mb-1 line-clamp-1">{lead.name}</h4>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{lead.area || 'Saudi Arabia'}</span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <a href={lead.vercel_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors text-[11px] font-black uppercase tracking-widest">
                    {t.viewSite} <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 tracking-widest uppercase">{t.service}</span>
            </div>
        </div>
    );
}

function Home({ lang, t, services }) {
  return (
    <div className={`space-y-16 animate-in fade-in duration-500 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      {/* Hero */}
      <div className="space-y-6 max-w-4xl pt-10">
        <div className={`inline-flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/20 ${lang === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <Star className="w-3.5 h-3.5" /> <span>{t.heroBadge}</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">
          {t.heroTitle}
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl font-medium">
          {t.heroSub}
        </p>
        
        <div className={`flex items-center gap-4 pt-4 max-w-2xl ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="relative flex-grow">
            <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500`} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              className={`w-full bg-white/5 border border-white/10 rounded-xl ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium`}
            />
          </div>
          <button className="bg-amber-500 text-black px-8 py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
            {t.searchBtn}
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
        <Link to="/products" className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900 to-black p-10 hover:border-amber-500/30 transition-all shadow-2xl">
          <div className={`absolute top-0 ${lang === 'ar' ? 'left-0' : 'right-0'} p-10 opacity-5 group-hover:opacity-10 transition-opacity`}>
            <ShoppingBag className="w-48 h-48 text-amber-500 translate-x-12 translate-y--12 rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-8 border border-amber-500/20 shadow-lg">
              <ShoppingBag className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{t.cat1Title}</h2>
            <p className="text-zinc-400 max-w-sm mb-12 text-lg font-medium leading-relaxed">{t.cat1Desc}</p>
            <div className="mt-auto">
                <span className="text-amber-500 font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2 group-hover:gap-4 transition-all">
                    {t.cat1Btn} {lang === 'ar' ? '←' : '→'}
                </span>
            </div>
          </div>
        </Link>
        
        <Link to="/services" className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900 to-black p-10 hover:border-emerald-500/30 transition-all shadow-2xl">
          <div className={`absolute top-0 ${lang === 'ar' ? 'left-0' : 'right-0'} p-10 opacity-5 group-hover:opacity-10 transition-opacity`}>
            <Store className="w-48 h-48 text-emerald-500 translate-x-12 translate-y--12 rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/20 shadow-lg">
              <Store className="w-7 h-7 text-emerald-500" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{t.cat2Title}</h2>
            <p className="text-zinc-400 max-w-sm mb-12 text-lg font-medium leading-relaxed">{t.cat2Desc}</p>
            <div className="mt-auto">
                <span className="text-emerald-400 font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2 group-hover:gap-4 transition-all">
                    {t.cat2Btn} {lang === 'ar' ? '←' : '→'}
                </span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Trending */}
      <div className="pt-10">
        <h3 className="text-2xl font-black text-white flex items-center mb-8 tracking-tight uppercase">
          <TrendingUp className={`w-6 h-6 ${lang === 'ar' ? 'ml-3' : 'mr-3'} text-amber-500`} /> {t.trendingTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {internalProducts.concat(services.slice(0, 1)).map(item => (
                item.price ? (
                    <ProductCard key={item.id} item={item} lang={lang} t={t} />
                ) : (
                    <ServiceCard key={item.place_id} lead={item} lang={lang} t={t} />
                )
           ))}
        </div>
      </div>
    </div>
  );
}

function Products({ lang, t }) {
  return (
    <div className={`animate-in fade-in duration-500 pt-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      <div className="mb-12">
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight uppercase">{t.products}</h1>
        <p className="text-xl text-zinc-500 font-medium">{t.aboutProduct}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {internalProducts.map(item => (
            <ProductCard key={item.id} item={item} lang={lang} t={t} />
        ))}
      </div>
    </div>
  );
}

function Services({ lang, t, items, loading }) {
  return (
    <div className={`animate-in fade-in duration-500 pt-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      <div className="mb-12">
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight uppercase">{t.services}</h1>
        <p className="text-xl text-zinc-500 font-medium">{t.aboutPartner}</p>
      </div>
      
      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center py-32 animate-pulse">
            <Store className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
            <h3 className="text-2xl text-white font-black mb-3 uppercase tracking-tight">{t.loading}</h3>
            <p className="text-zinc-500 font-medium">{t.syncing}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map(lead => (
                <ServiceCard key={lead.place_id} lead={lead} lang={lang} t={t} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
        try {
            // Fetch verified leads (those with a vercel_url)
            const { data } = await supabase
                .from('leads')
                .select('*')
                .not('vercel_url', 'is', null)
                .order('created_at', { ascending: false });
            
            if (data) setServices(data);
        } catch (e) {
            console.error("Error fetching services:", e);
        } finally {
            setLoading(false);
        }
    }
    fetchServices();
  }, []);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'ar' : 'en');
  const t = translations[lang];

  return (
    <BrowserRouter>
      <Layout lang={lang} toggleLang={toggleLang} t={t}>
        <Routes>
          <Route path="/" element={<Home lang={lang} t={t} services={services} />} />
          <Route path="/products" element={<Products lang={lang} t={t} />} />
          <Route path="/services" element={<Services lang={lang} t={t} items={services} loading={loading} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
