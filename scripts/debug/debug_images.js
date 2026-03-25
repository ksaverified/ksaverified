require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const placeId = 'ChIJY1-YF44DLz4RQZFZAGcnrog';

async function debug() {
    const { data, error } = await supabase.from('leads').select('website_html').ilike('place_id', placeId).single();
    if (error) {
        console.error('DB Error:', error.message);
        return;
    }
    const html = data.website_html;
    fs.writeFileSync('debug_wooden.html', html);
    
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    const bgRegex = /url\(["']?([^"'\)]+)["']?\)/g;
    
    console.log('--- Image Tags ---');
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        console.log(match[1]);
    }
    
    console.log('\n--- Background Images ---');
    while ((match = bgRegex.exec(html)) !== null) {
        console.log(match[1]);
    }
}

debug();
