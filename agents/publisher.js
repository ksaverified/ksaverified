/**
 * Publisher Agent
 * Generates dynamic URL for leads.
 * Injects checkout modals when rendering via the API.
 */
class PublisherAgent {
  constructor() {
    this.baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://ksaverified.com';
  }

  /**
   * Injects SEO tags (title and description) into the <head>
   * @param {string} htmlString 
   * @param {string} title 
   * @param {string} description 
   * @returns {string}
   */
  injectSEOTags(htmlString, title, description) {
    if (!htmlString) return '';
    let processedHtml = htmlString;

    if (title) {
      // Replace existing title or add new one
      if (/<title>.*<\/title>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<title>.*<\/title>/i, `<title>${title}</title>`);
      } else {
        processedHtml = processedHtml.replace(/<head[^>]*>/i, `$& \n<title>${title}</title>`);
      }
    }

    if (description) {
      // Replace existing meta description or add new one
      const descTag = `<meta name="description" content="${description}">`;
      if (/<meta[^>]*name=["']description["'][^>]*>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<meta[^>]*name=["']description["'][^>]*>/i, descTag);
      } else {
         // Fallback: Add to head
         const headMatch = processedHtml.match(/<head[^>]*>/i);
         if (headMatch) {
            const index = processedHtml.indexOf(headMatch[0]) + headMatch[0].length;
            processedHtml = processedHtml.substring(0, index) + '\n' + descTag + processedHtml.substring(index);
         }
      }
    }

    return processedHtml;
  }

  /**
   * Injects the payment modal snippet at the start of the <body>
   * @param {string} htmlString - Original website HTML
   * @param {string} placeId - The ID of the lead for tracking
   * @param {string} status - The status of the site ('lead', 'completed', etc.)
   * @returns {string} Modified HTML
   */
  injectModal(htmlString, placeId, status = 'lead') {
    if (!htmlString) return '';
    let cleanedHtml = htmlString;

    // 1. Robust HTML Closing Check
    // If the HTML is truncated (common in AI generation), we MUST close it before injection.
    const hasClosingHtml = /<\/html>/i.test(cleanedHtml);
    const hasClosingBody = /<\/body>/i.test(cleanedHtml);
    
    if (!hasClosingHtml || !hasClosingBody) {
        console.log(`[Publisher] Detected truncated HTML for lead ${placeId}, auto-closing...`);
        if (!hasClosingBody) cleanedHtml += '\n<!-- Auto-closed body by PublisherAgent -->\n</body>';
        if (!hasClosingHtml) cleanedHtml += '\n<!-- Auto-closed html by PublisherAgent -->\n</html>';
    }

    const modalSnippet = this.getModalSnippet(placeId, status);

    // 2. Inject right after <body> tag
    // This avoids being trapped inside fixed/relative containers at the end of the file.
    // We use a case-insensitive regex for the body tag.
    const bodyMatch = cleanedHtml.match(/<body[^>]*>/i);
    if (bodyMatch) {
      const tag = bodyMatch[0];
      const index = cleanedHtml.indexOf(tag) + tag.length;
      return cleanedHtml.substring(0, index) + '\n' + modalSnippet + cleanedHtml.substring(index);
    }

    // Fallback: If <body> is missing entirely, prepend it so it's at least visible.
    return modalSnippet + '\n' + cleanedHtml;
  }

  /**
   * Returns the full HTML/CSS/JS snippet for the payment modal.
   * @param {string} placeId 
   * @param {string} status 
   * @returns {string}
   */
  getModalSnippet(placeId, status = 'lead') {
    return `
      <!-- STC Pay Modal (Injected by PublisherAgent) -->
      <style>
        #publisher-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          z-index: 2147483647 !important; /* Maximum possible Z-index */
          display: none;
          justify-content: center !important;
          align-items: center !important;
          opacity: 0;
          transition: opacity 0.4s ease;
          margin: 0 !important;
          padding: 0 !important;
          overflow-y: auto !important; /* Allow scrolling on small screens */
        }
        #publisher-modal-overlay.show {
          display: flex !important;
          opacity: 1 !important;
        }
        #publisher-modal-overlay.show #publisher-modal-box {
          transform: translateY(0) !important;
        }
        #publisher-modal-box {
          background: white !important;
          width: 90% !important;
          max-width: 450px !important;
          padding: 2.5rem !important;
          border-radius: 1.5rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          position: relative !important;
          transform: translateY(20px) !important;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          color: #1f2937 !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        }
        .publisher-btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-top: 1.5rem !important;
          background: linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%) !important;
          color: white !important;
          padding: 0.875rem 1.5rem !important;
          font-weight: 700 !important;
          font-size: 1.1rem !important;
          border-radius: 0.75rem !important;
          text-decoration: none !important;
          transition: all 0.2s !important;
          border: none !important;
          cursor: pointer !important;
        }
        .publisher-btn:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4) !important;
        }
        body.modal-open {
          overflow: hidden !important;
          height: 100vh !important;
        }
        
        /* Bilingual CSS for modal */
        .mod-lang-en, .mod-lang-ar { display: none; }
        
        /* If html lang is AR, show AR and hide EN */
        html[lang="ar"] .mod-lang-ar { display: block !important; }
        html[lang="ar"] span.mod-lang-ar { display: inline-block !important; }
        html[lang="ar"] #publisher-modal-box { text-align: right !important; direction: rtl !important; }
        
        /* If html lang is EN or MISSING, show EN and hide AR */
        html:not([lang="ar"]) .mod-lang-en { display: block !important; }
        html:not([lang="ar"]) span.mod-lang-en { display: inline-block !important; }
        html:not([lang="ar"]) #publisher-modal-box { text-align: left !important; direction: ltr !important; }

        .mod-ltr { direction: ltr !important; display: inline-block !important; }
        
        .mod-lang-toggle {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          padding: 0.4rem 0.8rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 700;
          color: #4b5563;
          font-size: 0.75rem;
          z-index: 10;
        }
        html[lang="ar"] .mod-lang-toggle { left: 1rem; right: auto; }

        /* Pricing Toggle Switch */
        .billing-toggle {
          display: flex !important;
          background: #f3f4f6 !important;
          border-radius: 999px !important;
          padding: 0.3rem !important;
          margin: 1.5rem auto !important;
          position: relative !important;
          width: fit-content !important;
          border: 1px solid #e5e7eb !important;
        }
        .billing-toggle button {
          background: transparent !important;
          border: none !important;
          padding: 0.5rem 1.25rem !important;
          border-radius: 999px !important;
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          color: #6b7280 !important;
          cursor: pointer !important;
          position: relative !important;
          z-index: 2 !important;
          transition: color 0.3s !important;
        }
        .billing-toggle button.active {
          color: #111827 !important;
        }
        #toggle-bg {
          position: absolute !important;
          top: 0.3rem !important;
          bottom: 0.3rem !important;
          left: 0.3rem !important;
          width: calc(50% - 0.3rem) !important;
          background: white !important;
          border-radius: 999px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          z-index: 1 !important;
        }
        .billing-yearly-active #toggle-bg {
          transform: translateX(100%) !important;
        }
        html[lang="ar"] .billing-yearly-active #toggle-bg {
          transform: translateX(-100%) !important;
        }
        .badge-rec {
          position: absolute !important;
          top: -12px !important;
          right: -8px !important;
          background: #10b981 !important;
          color: white !important;
          font-size: 0.6rem !important;
          padding: 2px 8px !important;
          border-radius: 999px !important;
          font-weight: 800 !important;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4) !important;
        }
        .free-preview-btn {
          display: block !important;
          margin-top: 1rem !important;
          background: #ffffff !important;
          color: #4b5563 !important;
          border: 1.5px solid #d1d5db !important;
          padding: 0.75rem !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          border-radius: 0.75rem !important;
          cursor: pointer !important;
          width: 100% !important;
          transition: all 0.2s !important;
        }
        .free-preview-btn:hover {
          background: #f9fafb !important;
          border-color: #9ca3af !important;
          color: #111827 !important;
        }
      </style>
      
      <div id="publisher-modal-overlay">
        <div id="publisher-modal-box">
          <button class="mod-lang-toggle" onclick="toggleModalLang()">
             <span class="mod-lang-en">عربي</span>
             <span class="mod-lang-ar">English</span>
          </button>
          
          <!-- Dynamic Headers -->
          <h2 class="mod-lang-en" id="header-en" style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem; margin-top: 1rem;">
            Save big with Yearly
          </h2>
          <h2 class="mod-lang-ar" id="header-ar" style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem; margin-top: 1rem;">
            وفر الكثير مع السنوي
          </h2>
          
          <p class="mod-lang-en" id="desc-en" style="color: #4b5563; line-height: 1.5; font-size: 1rem; margin-bottom: 0;">
            Pay for 10 months, get 12 months of premium features.
          </p>
          <p class="mod-lang-ar" id="desc-ar" style="color: #4b5563; line-height: 1.5; font-size: 1rem; margin-bottom: 0;">
            ادفع لـ 10 أشهر، واحصل على 12 شهراً من الميزات الفاخرة.
          </p>
          
          <!-- Toggle -->
          <div class="billing-toggle billing-yearly-active" id="billing-switcher">
            <div id="toggle-bg"></div>
            <button id="btn-monthly" onclick="setBilling('monthly')">
               <span class="mod-lang-en">Monthly</span>
               <span class="mod-lang-ar">شهري</span>
            </button>
            <button id="btn-yearly" class="active" onclick="setBilling('yearly')">
               <span class="mod-lang-en">Yearly</span>
               <span class="mod-lang-ar">سنوي</span>
               <span class="badge-rec">
                 <span class="mod-lang-en">Save 17%</span>
                 <span class="mod-lang-ar">توفير ١٧٪</span>
               </span>
            </button>
          </div>

          <div class="price-display" style="margin-bottom: 1.5rem !important; text-align: center !important;">
            <div id="price-old" style="text-decoration: line-through !important; color: #9ca3af !important; font-size: 1rem !important; height: 1.5rem !important; font-weight: 500 !important;">
              <span class="mod-ltr">1188 SAR</span>
            </div>
            <div style="display: flex !important; align-items: baseline !important; justify-content: center !important; gap: 6px !important; margin-top: -4px !important;">
                <span id="price-current" style="font-size: 3rem !important; font-weight: 900 !important; color: #111827 !important; letter-spacing: -1px !important;">990</span>
                <span style="font-size: 1.1rem !important; color: #6b7280 !important; font-weight: 600 !important;">
                  SAR / 
                  <span class="mod-lang-en" id="price-period-en" style="display: inline !important;">year</span>
                  <span class="mod-lang-ar" id="price-period-ar" style="display: inline !important;">سنة</span>
                </span>
            </div>
            <div id="savings-badge" style="color: #059669 !important; background: #ecfdf5 !important; display: inline-block !important; padding: 4px 12px !important; border-radius: 999px !important; font-size: 0.8rem !important; font-weight: 800 !important; margin-top: 8px !important; border: 1px solid #10b98133 !important;">
                <span class="mod-lang-en">Save 198 annually</span>
                <span class="mod-lang-ar">وفر 198 سنوياً</span>
            </div>
          </div>

          <div style="background: #f3f4f6; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
            <p class="mod-lang-en" style="color: #374151; font-weight: 600; font-size: 0.875rem; margin: 0 0 0.5rem 0; text-transform: uppercase;">Payment Instructions:</p>
            <p class="mod-lang-ar" style="color: #374151; font-weight: 600; font-size: 0.875rem; margin: 0 0 0.5rem 0; text-transform: uppercase;">تعليمات الدفع:</p>
            
            <p class="mod-lang-en" style="color: #1f2937; margin: 0;">1. Open your <b>STC Pay</b> App.</p>
            <p class="mod-lang-ar" style="color: #1f2937; margin: 0;">1. افتح تطبيق <b>STC Pay</b> الخاص بك.</p>
            
            <p class="mod-lang-en" style="color: #1f2937; margin: 0.5rem 0;">2. Transfer exactly <b id="transfer-amt-en">990</b> SAR to:</p>
            <p class="mod-lang-ar" style="color: #1f2937; margin: 0.5rem 0;">2. قم بتحويل <b id="transfer-amt-ar">990</b> ريال سعودي بالضبط إلى:</p>
            
            <div dir="ltr" style="background: transparent; border: 2px dashed #3B82F6; color: #3B82F6; font-size: 1.25rem; font-weight: bold; letter-spacing: 1px; padding: 0.8rem; border-radius: 0.5rem; text-align: center; cursor: pointer; user-select: text; margin: 0.5rem 0;">
              +966 50 791 3514
            </div>
            
            <p class="mod-lang-en" style="color: #6b7280; font-size: 0.75rem; margin-top: 0.5rem; text-align: center;">Wait for the transfer to complete successfully.</p>
            <p class="mod-lang-ar" style="color: #6b7280; font-size: 0.75rem; margin-top: 0.5rem; text-align: center;">انتظر حتى تكتمل عملية التحويل بنجاح.</p>
          </div>

          <a id="whatsapp-btn" href="#" target="_blank" class="publisher-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none !important;">
            <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.012c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            <span class="mod-lang-en" id="cta-text-en">Get Yearly - 990 SAR</span>
            <span class="mod-lang-ar" id="cta-text-ar">اشترك سنوياً - 990 ريال</span>
          </a>
          
          <button id="free-preview-btn" class="free-preview-btn" onclick="startFreePreview()">
            <span class="mod-lang-en">Free 1-Hour Preview</span>
            <span class="mod-lang-ar">معاينة مجانية لمدة ساعة</span>
          </button>
          
          <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 1rem; text-align: center;">
            <svg style="width: 12px; height: 12px; display: inline; vertical-align: middle; margin-right: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="mod-lang-en" id="footer-text-en">You can use your 1-hour free preview once a day.</span>
            <span class="mod-lang-ar" id="footer-text-ar">يمكنك استخدام المعاينة المجانية لمدة ساعة مرة واحدة يومياً.</span>
          </p>
        </div>
      </div>

      <script>
        (function() {
          let currentPlan = 'yearly';
          const placeId = '${placeId}';

          window.toggleModalLang = function() {
             const html = document.documentElement;
             const currentLang = html.lang || 'en';
             if (currentLang === 'en') {
                 html.lang = 'ar';
                 html.dir = 'rtl';
             } else {
                 html.lang = 'en';
                 html.dir = 'ltr';
             }
          }

          window.setBilling = function(plan) {
            currentPlan = plan;
            const switcher = document.getElementById('billing-switcher');
            const btnMonthly = document.getElementById('btn-monthly');
            const btnYearly = document.getElementById('btn-yearly');
            const priceOld = document.getElementById('price-old');
            const currentPrice = document.getElementById('price-current');
            const periodEn = document.getElementById('price-period-en');
            const periodAr = document.getElementById('price-period-ar');
            const savingsBadge = document.getElementById('savings-badge');
            const headerEn = document.getElementById('header-en');
            const headerAr = document.getElementById('header-ar');
            const descEn = document.getElementById('desc-en');
            const descAr = document.getElementById('desc-ar');
            const transferEn = document.getElementById('transfer-amt-en');
            const transferAr = document.getElementById('transfer-amt-ar');
            const ctaEn = document.getElementById('cta-text-en');
            const ctaAr = document.getElementById('cta-text-ar');
            const whatsappBtn = document.getElementById('whatsapp-btn');

            if (plan === 'yearly') {
                if (switcher) switcher.classList.add('billing-yearly-active');
                if (btnYearly) btnYearly.classList.add('active');
                if (btnMonthly) btnMonthly.classList.remove('active');
                if (priceOld) priceOld.style.display = 'block';
                if (currentPrice) currentPrice.innerText = '990';
                if (periodEn) periodEn.innerText = 'year';
                if (periodAr) periodAr.innerText = 'سنة';
                if (savingsBadge) savingsBadge.style.display = 'inline-block';
                if (headerEn) headerEn.innerText = 'Save big with Yearly';
                if (headerAr) headerAr.innerText = 'وفر الكثير مع السنوي';
                if (descEn) descEn.innerText = 'Pay for 10 months, get 12 months of premium features.';
                if (descAr) descAr.innerText = 'ادفع لـ 10 أشهر، واحصل على 12 شهراً من الميزات الفاخرة.';
                if (transferEn) transferEn.innerText = '990';
                if (transferAr) transferAr.innerText = '990';
                if (ctaEn) ctaEn.innerText = 'Get Yearly - 990 SAR';
                if (ctaAr) ctaAr.innerText = 'اشترك سنوياً - 990 ريال';
                if (whatsappBtn) whatsappBtn.href = "https://wa.me/966507913514?text=Hi!%20I%20just%20transferred%20990%20SAR%20via%20STC%20Pay%20for%20a%20YEARLY%20subscription%20to%20my%20generated%20website.%20Here%20is%20my%20receipt%20screenshot:";
            } else {
                if (switcher) switcher.classList.remove('billing-yearly-active');
                if (btnMonthly) btnMonthly.classList.add('active');
                if (btnYearly) btnYearly.classList.remove('active');
                if (priceOld) priceOld.style.display = 'none';
                if (currentPrice) currentPrice.innerText = '99';
                if (periodEn) periodEn.innerText = 'month';
                if (periodAr) periodAr.innerText = 'شهر';
                if (savingsBadge) savingsBadge.style.display = 'none';
                if (headerEn) headerEn.innerText = 'Your Live Preview is Ready!';
                if (headerAr) headerAr.innerText = 'معاينتك المباشرة جاهزة!';
                if (descEn) descEn.innerText = 'Like what you see? You can keep it live forever for just 99 SAR / Month.';
                if (descAr) descAr.innerText = 'هل أعجبك ما تراه؟ يمكنك إبقاء الموقع يعمل للأبد مقابل 99 ريال سعودي / شهر.';
                if (transferEn) transferEn.innerText = '99';
                if (transferAr) transferAr.innerText = '99';
                if (ctaEn) ctaEn.innerText = 'Subscribe Monthly - 99 SAR';
                if (ctaAr) ctaAr.innerText = 'اشترك شهرياً - 99 ريال';
                if (whatsappBtn) whatsappBtn.href = "https://wa.me/966507913514?text=Hi!%20I%20just%20transferred%2099%20SAR%20via%20STC%20Pay%20for%20a%20MONTHLY%20subscription%20to%20my%20generated%20website.%20Here%20is%20my%20receipt%20screenshot:";
            }
          }

          window.startFreePreview = function() {
            const STORAGE_KEY_FREE = \`free_preview_used_\${placeId}\`;
            localStorage.setItem(STORAGE_KEY_FREE, Date.now().toString());
            const overlay = document.getElementById('publisher-modal-overlay');
            if (overlay) overlay.classList.remove('show');
            document.body.classList.remove('modal-open');
            fetch(\`/api/system?action=track&id=\${placeId}&event=free_preview_started\`).catch(e => console.error(e));
          }

          // INIT
          // Delay initialization to ensure DOM is ready
          setTimeout(() => {
            setBilling('yearly'); 
            
            function trackMetric(action) {
               if (!placeId || placeId === 'undefined') return;
               fetch(\`/api/system?action=track&id=\${placeId}&event=\${action}\`).catch(e => console.error(e));
            }
            trackMetric('view');

            const ONE_HOUR = 60 * 60 * 1000;
            const ONE_DAY = 24 * ONE_HOUR;
            const ONE_MINUTE = 60 * 1000;
            const STORAGE_KEY = \`modal_last_shown_\${placeId}\`;
            const STORAGE_KEY_FREE = \`free_preview_used_\${placeId}\`;
            
            let delay = ONE_MINUTE;
            let showFreePreviewBtn = true;
            let skipModal = false;
            
            const lastFreePreviewStr = localStorage.getItem(STORAGE_KEY_FREE);
            if (lastFreePreviewStr) {
               const timeSinceFreePreview = Date.now() - parseInt(lastFreePreviewStr, 10);
               if (timeSinceFreePreview < ONE_HOUR) {
                   skipModal = true;
               } else if (timeSinceFreePreview < ONE_DAY) {
                   delay = 0;
                   showFreePreviewBtn = false;
               }
            }

            if (!skipModal) {
              if (delay !== 0) { 
                  const lastShownStr = localStorage.getItem(STORAGE_KEY);
                  if (lastShownStr) {
                      const timeSinceLastShown = Date.now() - parseInt(lastShownStr, 10);
                      if (timeSinceLastShown < ONE_HOUR) delay = 0; 
                  }
              }

              setTimeout(() => {
                  document.body.classList.add('modal-open');
                  const overlay = document.getElementById('publisher-modal-overlay');
                  if (overlay) overlay.classList.add('show');
                  localStorage.setItem(STORAGE_KEY, Date.now().toString());
                  
                  if (!showFreePreviewBtn) {
                      const fpBtn = document.getElementById('free-preview-btn');
                      if (fpBtn) fpBtn.style.display = 'none';
                      const ften = document.getElementById('footer-text-en');
                      const ftar = document.getElementById('footer-text-ar');
                      if (ften) ften.innerText = 'You have used your free preview for today.';
                      if (ftar) ftar.innerText = 'لقد استخدمت المعاينة المجانية لليوم.';
                  }
              }, delay);
            }
          }, 500);
        })();
      </script>
    `;
  }

  /**
   * Generates the dynamic URL for the site instead of deploying it
   * @param {string} placeId - The unique lead / place ID
   * @param {string} slug - Optional vanity slug
   * @returns {string} The dynamic Vercel URL
   */
  async handlePublish(placeId, slug = null) {
    if (!placeId) return null;

    // Use slug if available for the new vanity URLs, fallback to /site/id
    const liveUrl = slug ? `${this.baseUrl}/${slug}` : `${this.baseUrl}/site/${placeId}`;
    console.log(`[Publisher] Generated dynamic site link: ${liveUrl}`);
    return liveUrl;
  }
}

module.exports = PublisherAgent;
