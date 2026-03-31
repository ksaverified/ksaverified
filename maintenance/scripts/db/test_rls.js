import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
    console.log("Testing RLS with anon key...");

    // Test leads table (should fail or return empty if not logged in)
    const { data: leads, error: leadsError } = await supabase.from('leads').select('*').limit(1);
    console.log("Leads accessed:", leads ? leads.length : 0);
    if (leadsError) console.error("Leads error:", leadsError.message);

    // Test settings table (public read allowed)
    const { data: settings, error: settingsError } = await supabase.from('settings').select('*').limit(1);
    console.log("Settings accessed:", settings ? settings.length : 0);
    if (settingsError) console.error("Settings error:", settingsError.message);

    console.log("RLS test complete.");
}

testRLS();
