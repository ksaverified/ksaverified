require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    console.log("Querying leads...");
    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, place_id, website_html, vercel_url')
        .neq('website_html', null)
        .like('website_html', '%maps.googleapis.com%');

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    console.log(`Found ${leads ? leads.length : 0} affected websites.`);
    if (!leads || leads.length === 0) return;

    let urls = new Set();
    let urlToLeadMap = {};

    leads.forEach(l => {
        const matches = l.website_html.match(/https?:\/\/(maps\.googleapis\.com|maps\.google\.com)[^"'\s\)<]+/g);
        if (matches) {
            matches.forEach(m => {
                urls.add(m);
                if (!urlToLeadMap[m]) urlToLeadMap[m] = [];
                urlToLeadMap[m].push(l.name);
            });
        }
    });

    console.log("\nAffected URL patterns found:");
    Array.from(urls).slice(0, 5).forEach(u => console.log(u));
    
    console.log("\nAffected Businesses (first 20):");
    leads.slice(0, 20).forEach(l => console.log(`- ${l.name}: ${l.vercel_url || "No URL"}`));
}

check();
