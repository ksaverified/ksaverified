
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkChat() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('--- LAST 5 MESSAGES: ---');
        console.log(JSON.stringify(data, null, 2));
    }
}
checkChat();
