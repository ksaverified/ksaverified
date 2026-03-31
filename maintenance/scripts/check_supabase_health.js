const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options) => {
      return fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
    }
  }
});

async function checkHealth() {
  console.log(`Checking Supabase health at ${supabaseUrl}...`);
  const start = Date.now();
  
  try {
    // Try simple select from settings
    const { data, error, status } = await supabase
      .from('settings')
      .select('key')
      .limit(1);

    const duration = Date.now() - start;
    if (error) {
      console.error(`[FAIL] Error querying 'settings' after ${duration}ms:`, error.message);
      console.error(`HTTP Status: ${status}`);
    } else {
      console.log(`[SUCCESS] Query 'settings' took ${duration}ms. Data retrieved.`);
    }

    // Try a different table
    const leadCheck = await supabase.from('leads').select('id').limit(1);
    if (leadCheck.error) {
      console.error(`[FAIL] Error querying 'leads':`, leadCheck.error.message);
    } else {
      console.log(`[SUCCESS] Query 'leads' succeeded.`);
    }

  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[CRITICAL] Connection failed after ${duration}ms:`, err.message);
  }
}

checkHealth();
