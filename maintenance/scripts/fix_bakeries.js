const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const PEXELS_KEY = process.env.VITE_PEXELS_API_KEY || process.env.PEXELS_API_KEY;

async function run() {
    console.log("Fetching all leads...");
    const { data: leads, error } = await supabase
        .from('leads')
        .select('place_id, name, website_html, vercel_url, status')
        .not('website_html', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    const bakeries = leads.filter(l => {
        const str = (l.name || '').toLowerCase();
        return str.includes('bakery') || 
               str.includes('patisserie') || 
               str.includes('pastry') || 
               str.includes('cake') ||
               str.includes('sweets') ||
               str.includes('مخبز') || 
               str.includes('حلويات') ||
               str.includes('مخبوزات');
    });

    console.log(`Found ${bakeries.length} bakeries/patisseries out of ${leads.length} total leads.`);

    if (bakeries.length === 0) return;

    for (const lead of bakeries) {
        console.log(`\n> Processing: ${lead.name} (${lead.status})`);
        
        let externalPhotos = [];
        try {
            // High quality queries for bakeries
            const pexelsRes = await axios.get(`https://api.pexels.com/v1/search?query=bakery%20pastries%20croissant%20cake&per_page=15&orientation=landscape`, {
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
            console.log(`  Replaced ${replacedCount} generic stock images with high-quality Bakery images.`);
            
            const { error: updateErr } = await supabase
                .from('leads')
                .update({ 
                    website_html: html,
                    status: (lead.status === 'published' || lead.status === 'retouched') ? 'created' : lead.status // Downgrade to created to republish/retouch
                })
                .eq('place_id', lead.place_id);
                
            if (updateErr) {
                console.error("  Error updating DB:", updateErr);
            } else {
                console.log(`  Successfully updated ${lead.name} in DB. Pipeline will pick it up from 'created'.`);
            }
        } else {
            console.log("  No stock images found to replace.");
        }
    }
}

run();
