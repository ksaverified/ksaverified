const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

// Standard CommonJS import of the class
const RetoucherAgent = require('../agents/retoucher');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const retoucher = new RetoucherAgent();

async function repair() {
    console.log("[Repair] Starting broken image repair using Pexels API...");
    
    let report;
    try {
        report = JSON.parse(fs.readFileSync('c:/dev/Internet Presence/tmp/broken_images_report.json', 'utf8'));
    } catch (e) {
        console.error("[Repair] No broken images report found. Run audit first.");
        return;
    }
    
    // Group by place_id
    const sites = {};
    report.forEach(err => {
        if (!sites[err.place_id]) sites[err.place_id] = [];
        sites[err.place_id].push(err.url);
    });

    const placeIds = Object.keys(sites);
    console.log(`[Repair] Handling ${placeIds.length} affected sites...`);

    for (const placeId of placeIds) {
        const brokenUrls = Array.from(new Set(sites[placeId])); // Unique broken urls per site
        
        // 1. Fetch current lead
        const { data: lead, error } = await supabase.from('leads').select('*').eq('place_id', placeId).single();
        if (error || !lead || !lead.website_html) {
            console.log(`[Repair] Skipping ${placeId} (Not found or no HTML)`);
            continue;
        }

        console.log(`[Repair] Processing ${lead.name} (${placeId}) - ${brokenUrls.length} broken imgs`);

        // 2. Determine category query (using same logic as retoucher.js)
        const businessTypesStr = ((lead.types || []).join(' ') + ' ' + (lead.name || '')).toLowerCase();
        let searchQuery = 'local business';
        
        if (businessTypesStr.includes('hair') || businessTypesStr.includes('barber') || businessTypesStr.includes('salon') || businessTypesStr.includes('حلاقة')) {
            searchQuery = 'barbershop hair salon';
        } else if (businessTypesStr.includes('repair') || businessTypesStr.includes('electronics') || businessTypesStr.includes('computer')) {
            searchQuery = 'electronics repair computer tech';
        } else if (businessTypesStr.includes('restaurant') || businessTypesStr.includes('cafe') || businessTypesStr.includes('food') || businessTypesStr.includes('مطعم')) {
            searchQuery = 'restaurant cafe food dining';
        } else if (businessTypesStr.includes('boutique') || businessTypesStr.includes('fashion') || businessTypesStr.includes('clothes') || businessTypesStr.includes('ملابس')) {
            searchQuery = 'fashion boutique clothing store';
        } else if (businessTypesStr.includes('clinic') || businessTypesStr.includes('medical') || businessTypesStr.includes('عيادة')) {
            searchQuery = 'medical clinic doctor hospital';
        } else if (businessTypesStr.includes('supermarket') || businessTypesStr.includes('grocery') || businessTypesStr.includes('بقالة')) {
            searchQuery = 'grocery store supermarket market';
        } else if (businessTypesStr.includes('carwash') || businessTypesStr.includes('car wash') || businessTypesStr.includes('غسيل')) {
            searchQuery = 'car wash detailing';
        } else if (businessTypesStr.includes('spa') || businessTypesStr.includes('massage') || businessTypesStr.includes('سبا')) {
            searchQuery = 'spa massage wellness';
        } else if (businessTypesStr.includes('gym') || businessTypesStr.includes('fitness') || businessTypesStr.includes('رياضة')) {
            searchQuery = 'gym fitness workout';
        } else if (businessTypesStr.includes('flower') || businessTypesStr.includes('gift') || businessTypesStr.includes('ورد')) {
            searchQuery = 'flower shop gift bouquet';
        } else if (businessTypesStr.includes('construct') || businessTypesStr.includes('contractor') || businessTypesStr.includes('بناء')) {
            searchQuery = 'construction building architecture';
        } else if (businessTypesStr.includes('optical') || businessTypesStr.includes('eye') || businessTypesStr.includes('بصريات')) {
            searchQuery = 'optician eye glasses store';
        }

        // 3. Fetch fresh Pexels photos (up to 12)
        const freshPhotos = await retoucher.fetchPexelsPhotos(searchQuery);
        if (freshPhotos.length === 0) {
            console.log(`[Repair] Failed to get fresh photos for ${placeId} (Query: ${searchQuery})`);
            continue;
        }

        // 4. Bulk Replace Broken URLs in HTML
        let html = lead.website_html;
        let replacedCount = 0;
        
        brokenUrls.forEach((brokenUrl, i) => {
            const replacement = freshPhotos[i % freshPhotos.length];
            if (html.includes(brokenUrl)) {
                // Using split/join for safe global string replacement
                const parts = html.split(brokenUrl);
                replacedCount += (parts.length - 1);
                html = parts.join(replacement);
            }
        });

        if (replacedCount > 0) {
            const { error: updateErr } = await supabase.from('leads').update({ website_html: html }).eq('place_id', placeId);
            if (updateErr) {
                console.error(`[Repair] Failed to update Supabase for ${placeId}:`, updateErr.message);
            } else {
                console.log(`[Repair] SUCCESS: Replaced ${replacedCount} instances for ${lead.name}`);
            }
        }
    }
    console.log("[Repair] FINISHED. All broken links processed.");
}

repair();
