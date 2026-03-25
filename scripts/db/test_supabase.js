
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

async function testSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('Testing Supabase Connection...');
    const supabase = createClient(url, key);
    
    try {
        const { data, error } = await supabase.from('settings').select('*').limit(1);
        if (error) throw error;
        console.log('Supabase Success! Data:', data);
    } catch (error) {
        console.error('Supabase Failed:', error.message);
    }
}

testSupabase();
