require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching all generated websites to check for HTML bloat and missing language scripts...");
    
    // We fetch all records that have website_html
    const { data: leads, error } = await supabase
        .from('leads')
        .select('place_id, name, website_html')
        .not('website_html', 'is', null);

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`Found ${leads.length} websites to check.`);
    let updatableLeads = [];

    const mobileStyles = `
        /* Global language toggle visibility */
        html[lang="ar"] .lang-en, html[lang="ar"] [data-lang="en"] { display: none !important; }
        html[lang="en"] .lang-ar, html[lang="en"] [data-lang="ar"] { display: none !important; }

        /* Mobile-only language toggle: show only the other language */
        @media (max-width: 768px) {
            html[lang="en"] .lang-en-btn { display: none !important; }
            html[lang="ar"] .lang-ar-btn { display: none !important; }
        }
        .mobile-menu-active { 
            display: flex !important; 
            flex-direction: column !important; 
            align-items: center !important; 
            justify-content: center !important; 
            position: fixed !important; 
            inset: 0 !important; 
            width: 100% !important; 
            height: 100vh !important; 
            background: rgba(17, 24, 39, 0.98) !important; 
            z-index: 100 !important; 
        }
        .mobile-menu-active li, .mobile-menu-active a {
            margin: 1.5rem 0 !important;
            font-size: 2.25rem !important; /* text-4xl */
            font-weight: 700 !important;
            text-align: center !important;
            display: block !important;
        }
        #mobile-menu-btn { z-index: 101; position: relative; }
        `;

    const mobileScript = `
        <script>
            window.toggleLanguage = function() {
                const html = document.documentElement;
                if (html.lang === 'en') {
                    html.lang = 'ar';
                    html.dir = 'rtl';
                } else {
                    html.lang = 'en';
                    html.dir = 'ltr';
                }
            };
            document.addEventListener('DOMContentLoaded', () => {
                const menuBtn = document.getElementById('mobile-menu-btn');
                const menu = document.getElementById('mobile-menu');
                if (menuBtn && menu) {
                    const toggleMenu = () => {
                        menu.classList.toggle('hidden');
                        menu.classList.toggle('mobile-menu-active');
                        document.body.style.overflow = menu.classList.contains('mobile-menu-active') ? 'hidden' : '';
                    };
                    menuBtn.addEventListener('click', toggleMenu);
                    // Close menu when a link is clicked
                    menu.querySelectorAll('a').forEach(link => {
                        link.addEventListener('click', () => {
                            if (menu.classList.contains('mobile-menu-active')) {
                                toggleMenu();
                            }
                        });
                    });
                }
            });
        </script>
        `;

    for (const lead of leads) {
        let cleanedHtml = lead.website_html;
        let originalHtml = cleanedHtml;

        // Clean CSS
        cleanedHtml = cleanedHtml.replace(/\/\* Global language toggle visibility \*\/[\s\S]*?#mobile-menu-btn \{[^\}]*\}(?:\s*)?/g, '');
        cleanedHtml = cleanedHtml.replace(/\/\* Mobile-only language toggle[\s\S]*?#mobile-menu-btn \{[^\}]*\}(?:\s*)?/g, '');
        cleanedHtml = cleanedHtml.replace(/\.mobile-menu-active \{ display: flex !important; flex-direction: column;[\s\S]*? \}(?:\s*)?/g, '');
        
        // Ensure one clean CSS block
        if (!cleanedHtml.includes('/* Mobile-only language toggle: show only the other language */')) {
             cleanedHtml = cleanedHtml.replace('</style>', `${mobileStyles}\n    </style>`);
        }

        // Clean JS
        cleanedHtml = cleanedHtml.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded', \(\) => \{\s*const menuBtn = document\.getElementById\('mobile-menu-btn'\);[\s\S]*?<\/script>\s*\n?/g, '');
        cleanedHtml = cleanedHtml.replace(/<script>\s*window\.toggleLanguage = function\(\) \{[\s\S]*?<\/script>\s*\n?/g, '');
        
        // Ensure new JS block
        if (!cleanedHtml.includes('window.toggleLanguage = function')) {
             cleanedHtml = cleanedHtml.replace('</body>', `${mobileScript}\n</body>`);
        }

        // Clean repeated Headers
        // Strip multiple identical empty headers from earlier bugs
        cleanedHtml = cleanedHtml.replace(/(<!-- Header -->\s*){2,}/gi, '<!-- Header -->\n    ');

        if (cleanedHtml !== originalHtml) {
            // Something was updated
            updatableLeads.push({
                place_id: lead.place_id,
                name: lead.name,
                html: cleanedHtml
            });
        }
    }

    console.log(`Requires HTML repair: ${updatableLeads.length} websites.`);

    for (const lead of updatableLeads) {
        process.stdout.write(`Repairing HTML for ${lead.name}... `);
        const { error } = await supabase.from('leads').update({ website_html: lead.html }).eq('place_id', lead.place_id);
        if (error) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log(`Done`);
        }
    }

    console.log("All done.");
}

run();
