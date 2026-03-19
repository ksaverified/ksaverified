
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function resetDummyLead() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const html = '<html><body><h1>Bypassed Gemini Rate Limit Test</h1><img src="https://via.placeholder.com/0x0"></body></html>';
    const { data, error } = await supabase
        .from('leads')
        .update({ status: 'created', website_html: html, retry_count: 0, updated_at: '1999-01-01 00:00:00', phone: '966500000000' })
        .eq('place_id', 'dummy-test-lead');
        
    if (error) {
        console.error('Error updating lead:', error);
    } else {
        console.log('Successfully reset dummy-test-lead to CREATED status with pre-injected HTML.');
    }
}
resetDummyLead();
