const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: './dashboard/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const PEXELS_KEY = process.env.VITE_PEXELS_API_KEY || process.env.PEXELS_API_KEY;

async function run() {
    console.log("Fetching all leads...");
    const { data: leads, error } = await supabase
        .from('leads')
        .select('place_id, name, types, website_html, vercel_url, status')
        .not('website_html', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    const bookstores = leads.filter(l => {
        const str = ((l.types || []).join(' ') + ' ' + (l.name || '')).toLowerCase();
        return str.includes('book') || str.includes('library') || str.includes('stationery') || str.includes('مكتبة') || str.includes('قرطاسية');
    });

    console.log(`Found ${bookstores.length} bookstores out of ${leads.length} total leads.`);

    if (bookstores.length === 0) return;

    for (const lead of bookstores) {
        console.log(`\n> Processing: ${lead.name} (${lead.status})`);
        
        let externalPhotos = [];
        try {
            const pexelsRes = await axios.get(`https://api.pexels.com/v1/search?query=bookstore%20library&per_page=15&orientation=landscape`, {
                headers: { Authorization: PEXELS_KEY }
            });
            externalPhotos = pexelsRes.data.photos.map(p => p.src.large2x || p.src.large).sort(() => Math.random() - 0.5);
        } catch (e) {
            console.error("Pexels error:", e.response?.data || e.message);
            continue;
        }

        let html = lead.website_html;
        
        // Regex to match generic Unsplash, Pexels, or Picsum placeholders
        const regex = /https:\/\/(?:images\.unsplash\.com\/photo-[^"'\s)]+|source\.unsplash\.com\/[^"'\s)]+|loremflickr\.com\/[^"'\s)]+|images\.pexels\.com\/photos\/[^"'\s)]+|picsum\.photos\/[^"'\s)]+)/g;
        
        let replacedCount = 0;
        let photoIndex = 0;

        html = html.replace(regex, (match) => {
             replacedCount++;
             const r = externalPhotos[photoIndex % externalPhotos.length];
             photoIndex++;
             return r;
        });

        if (replacedCount > 0) {
            console.log(`  Replaced ${replacedCount} generic stock images with Bookstore specific images.`);
            
            const { error: updateErr } = await supabase
                .from('leads')
                .update({ 
                    website_html: html,
                    status: (lead.status === 'published' || lead.status === 'retouched') ? 'created' : lead.status // Downgrade to created so Retoucher/Publisher handles it again
                })
                .eq('place_id', lead.place_id);
                
            if (updateErr) {
                console.error("  Error updating DB:", updateErr);
            } else {
                console.log(`  Successfully updated ${lead.name} in DB. Restarting pipeline from 'created'.`);
            }
        } else {
            console.log("  No stock images found to replace.");
        }
    }
}

run();
