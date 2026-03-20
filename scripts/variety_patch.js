const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchPexelsPhotos(query) {
    try {
        const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=40&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        if (res.data && res.data.photos) {
            return res.data.photos.map(p => p.src.large2x || p.src.large).sort(() => Math.random() - 0.5);
        }
        return [];
    } catch (e) {
        console.error(`[Pexels Error] ${query}:`, e.message);
        return [];
    }
}

async function runVarietyPatch() {
    console.log("[VarietyPatch] Fetching all leads...");
    const { data: leads, error } = await supabase.from('leads').select('place_id, name, website_html');
    
    if (error) {
        console.error("[VarietyPatch] Failed to fetch leads:", error.message);
        return;
    }

    console.log(`[VarietyPatch] Processing ${leads.length} websites...`);

    for (const lead of leads) {
        if (!lead.website_html) continue;

        const name = (lead.name || '').toLowerCase();
        let searchQuery = 'local business';

        // Enhanced Categorization logic with Arabic keywords
        if (name.includes('hair') || name.includes('barber') || name.includes('salon') || name.includes('حلاقة') || name.includes('صالون') || name.includes('تجميل')) {
            searchQuery = 'barbershop beauty hair salon';
        } else if (name.includes('repair') || name.includes('electronics') || name.includes('computer') || name.includes('برمجة') || name.includes('تصليح')) {
            searchQuery = 'electronics repair computer tech';
        } else if (name.includes('restaurant') || name.includes('cafe') || name.includes('food') || name.includes('مطعم') || name.includes('مقهى') || name.includes('مخبز')) {
            searchQuery = 'restaurant cafe food dining';
        } else if (name.includes('boutique') || name.includes('fashion') || name.includes('clothes') || name.includes('ملابس') || name.includes('ازياء')) {
            searchQuery = 'fashion boutique clothing store';
        } else if (name.includes('clinic') || name.includes('medical') || name.includes('doctor') || name.includes('عيادة') || name.includes('طبيب')) {
            searchQuery = 'medical clinic doctor hospital';
        } else if (name.includes('supermarket') || name.includes('grocery') || name.includes('بقالة') || name.includes('تموينات')) {
            searchQuery = 'grocery store supermarket market';
        } else if (name.includes('carwash') || name.includes('car wash') || name.includes('غسيل') || name.includes('تلميع')) {
            searchQuery = 'car wash detailing';
        } else if (name.includes('spa') || name.includes('massage') || name.includes('سبا') || name.includes('مساج')) {
            searchQuery = 'spa massage wellness';
        } else if (name.includes('gym') || name.includes('fitness') || name.includes('رياضة') || name.includes('لياقة')) {
            searchQuery = 'gym fitness workout';
        } else if (name.includes('flower') || name.includes('gift') || name.includes('ورد') || name.includes('هدايا')) {
            searchQuery = 'flower shop gift bouquet';
        } else if (name.includes('construct') || name.includes('contractor') || name.includes('بناء') || name.includes('مقاولات')) {
            searchQuery = 'construction building architecture';
        } else if (name.includes('optical') || name.includes('eye') || name.includes('بصريات') || name.includes('نظارات')) {
            searchQuery = 'optician eye glasses store';
        }

        // Only re-process if we found a better query OR if it's the specific site reported by user
        // Actually, let's just re-process everything that was "local business" before, or just re-patch all for safety.
        // To be safe and fast, I'll re-patch all.
        
        const images = await fetchPexelsPhotos(searchQuery);
        if (images.length === 0) continue;

        let imgIndex = 0;
        const getNextImage = () => images[imgIndex++ % images.length];

        let html = lead.website_html;
        
        // Refresh images
        html = html.replace(/https:\/\/images\.pexels\.com\/photos\/[^"'\s)]+/g, () => getNextImage());

        if (html !== lead.website_html) {
            const { error: updateErr } = await supabase.from('leads').update({ website_html: html }).eq('place_id', lead.place_id);
            if (!updateErr) {
                console.log(`[VarietyPatch] RE-DONE: ${lead.name} -> ${searchQuery}`);
            }
        }
    }
    console.log("[VarietyPatch] DONE.");
}

runVarietyPatch();
