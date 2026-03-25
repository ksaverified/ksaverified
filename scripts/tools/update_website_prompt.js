require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function updateSetting() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for updates
    const supabase = createClient(supabaseUrl, supabaseKey);

    const newValue = {
        system: "You are an expert web developer and copywriter specializing in high-conversion landing pages.",
        instructions: "Generate a modern, beautiful, fully responsive, single-file HTML landing page. Use Tailwind CSS via CDN. The website MUST be bilingual (English and Arabic) with full RTL support. Implement a functional hamburger menu for mobile devices. Use smooth transitions and ensure all sections stack correctly on small screens using Tailwind's responsive prefixes (sm:, md:, lg:, etc.)."
    };

    const { data, error } = await supabase
        .from('settings')
        .update({ value: newValue })
        .eq('key', 'website_prompt')
        .select();

    if (error) {
        console.error('Error updating setting:', error);
        return;
    }

    console.log('--- website_prompt updated successfully ---');
    console.log(JSON.stringify(data[0].value, null, 2));
}

updateSetting();
