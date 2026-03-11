require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('leads').select('*').eq('place_id', 'ChIJAxhceSEDLz4RF7ribj5-dyU').single();
    console.log(JSON.stringify(Object.keys(data), null, 2));
    console.log("NAME:", data.name);
    console.log("CATEGORY:", data.category);
    console.log("INDUSTRY:", data.industry);
    console.log("TYPES:", data.types);
}
check();
