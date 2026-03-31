import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        nav: {
            website: "My Website",
            profile: "Profile",
            payment: "Payment",
            signOut: "Sign Out",
            portal: "Client Portal",
            editor: "Edit Website",
            seo: "SEO & Analytics"
        },
        seo: {
            analytics: "Visitor Analytics",
            views: "Total Page Views",
            engaged: "Engaged Sessions",
            conversion: "Daily Reach Goal",
            indexing: "Instant Indexing",
            indexDesc: "Notify Google immediately of your latest website updates.",
            indexBtn: "Index My Site Now",
            indexing_active: "Indexing in progress...",
            indexed: "Indexing requested!",
            metrics: "Site Performance"
        },
        editor: {
            title: "Website Editor",
            subtitle: "Update your content and photos in both languages",
            save: "Save Changes",
            saving: "Saving...",
            saved: "Website updated! Changes will appear shortly.",
            tabs: {
                content: "Content",
                services: "Services",
                testimonials: "Testimonials",
                contact: "Contact",
                photos: "Photos"
            },
            fields: {
                title: "Website Title",
                subtitle: "Main Subtitle",
                hero: "Hero Section Text",
                about: "About Us Text",
                serviceTitle: "Service Name",
                serviceDesc: "Service Description",
                testiName: "Client Name",
                testiText: "Testimonial",
                phone: "Phone Numbers",
                email: "Email Address",
                address: "Physical Address",
                maps: "Google Maps Iframe (Embed)",
                heroPhoto: "Hero Photograph",
                aboutPhoto: "About Us Photo",
                servicePhoto: "Service Image"
            },
            actions: {
                addService: "Add Service",
                addTesti: "Add Testimonial",
                remove: "Remove",
                reset: "Reset Photo",
                maxReached: "Maximum limit reached"
            }
        },
        login: {
            title: "KSA Verified",
            subtitle: "Secure Client Portal",
            phoneLabel: "WhatsApp Number",
            phonePlaceholder: "+966...",
            requestCode: "Send Login Code via WhatsApp",
            codeLabel: "6-Digit Login Code",
            codePlaceholder: "000000",
            signIn: "Sign In",
            authenticating: "Authenticating...",
            phoneError: "Please enter your WhatsApp number.",
            codeSent: "Code sent! Please check your WhatsApp.",
            loginFailed: "Invalid code or phone number.",
            backToPhone: "Change Phone Number"
        },
        website: {
            title: "My Website",
            subtitle: "Preview and manage your live business site",
            openLive: "Open Live Site",
            status: "Status",
            businessName: "Business Name",
            plan: "Plan",
            starter: "Founding Member",
            loading: "Loading your website preview...",
            noWebsite: "No Website Found",
            noWebsiteDesc: "We couldn't find a website associated with your account yet. If you just registered, please wait a few minutes or contact support."
        },
        payment: {
            title: "Subscription & Payment",
            subtitle: "Manage your website subscription and billing",
            currentPlan: "Current Plan",
            active: "Founding Member Offer (Active)",
            starterPlan: "Founding Member Plan",
            monthly: "Monthly auto-renewal",
            sar: "SAR",
            perMo: "/mo",
            price: "19",
            features: [
                "Unlimited Edits",
                "Custom Domain (.com / .net)",
                "Ultra-Fast Hosting",
                "24/7 AI Support",
                "SSL Certificate included"
            ],
            onlineSoon: "We are currently upgrading our automated checkout system. Online payments will be available soon.",
            stcGateway: "STC Pay Gateway",
            manualPay: "Manual Payment",
            transferDesc: "Enjoy your 1-week free trial! To activate the Founding Member offer (19 SAR/mo for the first year), please transfer via STC Pay.",
            stcNumberLabel: "STC Pay Number",
            copy: "Copy",
            copied: "Copied",
            shareReceipt: "After transferring, please share the receipt here:",
            sendWhatsApp: "Send Screenshot to WhatsApp",
            comingSoon: "Coming Soon: Automatic Checkout",
            localSupport: "Local Support",
            supportDesc: "Our Riyadh-based team is here to help you 24/7",
            contactSupport: "CONTACT SUPPORT"
        },
        profile: {
            title: "Profile Settings",
            subtitle: "Manage your account information and security",
            fullName: "Full Name",
            email: "Email Address",
            phone: "Phone Number",
            newPass: "New Password (Leave blank to keep current)",
            save: "Save Changes",
            saving: "Saving...",
            updated: "Profile updated successfully!"
        }
    },
    ar: {
        nav: {
            website: "موقعي",
            profile: "الملف الشخصي",
            payment: "الدفع",
            signOut: "تسجيل الخروج",
            portal: "بوابة العملاء",
            editor: "تعديل الموقع",
            seo: "SEO والتحليلات"
        },
        seo: {
            analytics: "تحليلات الزوار",
            views: "إجمالي المشاهدات",
            engaged: "الجلسات المتفاعلة",
            conversion: "هدف الوصول اليومي",
            indexing: "الفهرسة الفورية",
            indexDesc: "أبلغ جوجل فوراً بأحدث تحديثات موقعك الإلكتروني.",
            indexBtn: "فهرس موقعي الآن",
            indexing_active: "جاري الفهرسة...",
            indexed: "تم طلب الفهرسة!",
            metrics: "أداء الموقع"
        },
        editor: {
            title: "محرر الموقع",
            subtitle: "تحديث المحتوى والصور باللغتين",
            save: "حفظ التغييرات",
            saving: "جاري الحفظ...",
            saved: "تم تحديث الموقع! ستظهر التغييرات قريباً.",
            tabs: {
                content: "المحتوى",
                services: "الخدمات",
                testimonials: "الآراء",
                contact: "الاتصال",
                photos: "الصور"
            },
            fields: {
                title: "عنوان الموقع",
                subtitle: "العنوان الفرعي الرئيسي",
                hero: "نص قسم الترحيب",
                about: "نص من نحن",
                serviceTitle: "اسم الخدمة",
                serviceDesc: "وصف الخدمة",
                testiName: "اسم العميل",
                testiText: "الرأي",
                phone: "أرقام الهاتف",
                email: "البريد الإلكتروني",
                address: "العنوان الفعلي",
                maps: "كود خريطة جوجل (Iframe)",
                heroPhoto: "صورة قسم الترحيب",
                aboutPhoto: "صورة من نحن",
                servicePhoto: "صورة الخدمة"
            },
            actions: {
                addService: "إضافة خدمة",
                addTesti: "إضافة رأي",
                remove: "إزالة",
                reset: "إعادة تعيين الصورة",
                maxReached: "تم الوصول للحد الأقصى"
            }
        },
        login: {
            title: "KSA Verified",
            subtitle: "بوابة العملاء الآمنة",
            phoneLabel: "رقم الواتساب",
            phonePlaceholder: "+966...",
            requestCode: "إرسال رمز الدخول عبر الواتساب",
            codeLabel: "رمز الدخول المكون من 6 أرقام",
            codePlaceholder: "000000",
            signIn: "تسجيل الدخول",
            authenticating: "جاري التحقق...",
            phoneError: "يرجى إدخال رقم الواتساب الخاص بك أولاً.",
            codeSent: "تم إرسال الرمز! يرجى التحقق من الواتساب الخاص بك.",
            loginFailed: "الرمز أو رقم الهاتف غير صالح.",
            backToPhone: "تغيير رقم الهاتف"
        },
        website: {
            title: "موقعي الإلكتروني",
            subtitle: "معاينة وإدارة موقع عملك المباشر",
            openLive: "فتح الموقع المباشر",
            status: "الحالة",
            businessName: "اسم العمل",
            plan: "الخطة",
            starter: "عضو مؤسس",
            loading: "جاري تحميل معاينة موقعك...",
            noWebsite: "لم يتم العثور على موقع",
            noWebsiteDesc: "لم نتمكن من العثور على موقع مرتبط بحسابك بعد. إذا كنت قد سجلت للتو، يرجى الانتظار بضع دقائق أو الاتصال بالدعم."
        },
        payment: {
            title: "الاشتراك والدفع",
            subtitle: "إدارة اشتراك موقعك وفواتيرك",
            currentPlan: "الخطة الحالية",
            active: "عرض العضو المؤسس (نشط)",
            starterPlan: "خطة العضو المؤسس",
            monthly: "تجديد شهري تلقائي",
            sar: "ريال",
            perMo: "/شهرياً",
            price: "19",
            features: [
                "تعديلات غير محدودة",
                "نطاق مخصص (.com / .net)",
                "استضافة فائقة السرعة",
                "دعم ذكاء اصطناعي 24/7",
                "شهادة SSL متضمنة"
            ],
            onlineSoon: "نحن نقوم حالياً بترقية نظام الدفع التلقائي الخاص بنا. ستكون المدفوعات عبر الإنترنت متاحة قريباً.",
            stcGateway: "بوابة STC Pay",
            manualPay: "الدفع اليدوي",
            transferDesc: "استمتع بتجربتك المجانية لمدة أسبوع! لتفعيل عرض العضو المؤسس (19 ريال/شهرياً للسنة الأولى)، يرجى التحويل عبر STC Pay.",
            stcNumberLabel: "رقم STC Pay",
            copy: "نسخ",
            copied: "تم النسخ",
            shareReceipt: "بعد التحويل، يرجى مشاركة الإيصال هنا:",
            sendWhatsApp: "إرسال لقطة شاشة للواتساب",
            comingSoon: "قريباً: الدفع التلقائي",
            localSupport: "الدعم المحلي",
            supportDesc: "فريقنا المتواجد في الرياض هنا لمساعدتك على مدار الساعة",
            contactSupport: "اتصل بالدعم"
        },
        profile: {
            title: "إعدادات الملف الشخصي",
            subtitle: "إدارة معلومات حسابك وأمانك",
            fullName: "الاسم الكامل",
            email: "البريد الإلكتروني",
            phone: "رقم الهاتف",
            newPass: "كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)",
            save: "حفظ التغييرات",
            saving: "جاري الحفظ...",
            updated: "تم تحديث الملف الشخصي بنجاح!"
        }
    }
};

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('ksaverified_lang') || 'ar');

    useEffect(() => {
        localStorage.setItem('ksaverified_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    const t = (path) => {
        const keys = path.split('.');
        let result = translations[lang];
        for (const key of keys) {
            result = result?.[key];
        }
        return result || path;
    };

    const toggleLanguage = () => {
        setLang(prev => prev === 'en' ? 'ar' : 'en');
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
