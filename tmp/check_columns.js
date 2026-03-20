const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .limit(1);
    
    if (error) console.error(error);
    else console.log(Object.keys(leads[0]));
}
check();
