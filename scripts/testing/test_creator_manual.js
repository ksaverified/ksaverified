require('dotenv').config();
const DatabaseService = require('../services/db');
const CreatorAgent = require('../agents/creator');

async function test() {
    const db = new DatabaseService();
    const creator = new CreatorAgent();
    
    try {
        const { data: lead, error } = await db.supabase
            .from('leads')
            .select('*')
            .eq('place_id', 'ChIJf0dAioz7Lj4RKMV1zymNhdE')
            .single();
            
        if (error) throw error;
        
        console.log(`[Test] Generating website for ${lead.name}...`);
        const html = await creator.createWebsite(lead, db);
        console.log(`[Test] Website length: ${html.length}`);
        
        // Save to a temp file to preview
        const fs = require('fs');
        fs.writeFileSync('tmp/test_website.html', html);
        console.log(`[Test] Website saved to tmp/test_website.html`);
        
    } catch (e) {
        console.error(e);
    }
}

test();
