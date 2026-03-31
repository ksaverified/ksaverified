require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugInterestConfirmedDetails() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- Simulating InterestConfirmed.jsx Thread Fetching ---');

    try {
        // 1. Logs
        const { data: warmingLogs, error: logError } = await supabase
            .from('logs')
            .select('place_id')
            .eq('action', 'warming_sent');

        if (logError) throw logError;
        const warmedPlaceIds = [...new Set((warmingLogs || []).map(l => l.place_id).filter(id => !!id))];
        console.log(`Warmed Place IDs found: ${warmedPlaceIds.length}`);

        if (warmedPlaceIds.length === 0) {
            console.log('No warmed leads found.');
            return;
        }

        // 2. Leads
        const { data: leads, error: leadError } = await supabase
            .from('leads')
            .select('place_id, name, phone, status')
            .in('place_id', warmedPlaceIds);

        if (leadError) throw leadError;
        console.log(`Leads found: ${leads.length}`);

        // 3. Threads
        const threadsWithLastMsg = await Promise.all(leads.map(async (lead) => {
            console.log(`Processing lead: ${lead.name} (${lead.place_id})`);

            const { data: lastChat, error: chatError } = await supabase
                .from('chat_logs')
                .select('message_in, message_out, created_at')
                .eq('place_id', lead.place_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (chatError && chatError.code !== 'PGRST116') {
                console.error(`Chat error for ${lead.name} (place_id):`, chatError.message);
            }

            let chatInfo = lastChat;
            if (!chatInfo && lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                console.log(`  Trying phone fallback for ${lead.name} (${cleanPhone})`);
                const { data: phoneChat, error: pChatError } = await supabase
                    .from('chat_logs')
                    .select('message_in, message_out, created_at')
                    .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.slice(-9)}%`)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (pChatError && pChatError.code !== 'PGRST116') {
                    console.error(`Chat error for ${lead.name} (phone):`, pChatError.message);
                }
                chatInfo = phoneChat;
            }

            return {
                phone: lead.phone,
                name: lead.name,
                place_id: lead.place_id,
                lastMessage: chatInfo ? (chatInfo.message_in || chatInfo.message_out || 'Interaction recorded') : 'Awaiting response...',
                lastTime: chatInfo ? chatInfo.created_at : lead.updated_at || new Date().toISOString(),
                isLastInbound: !!chatInfo?.message_in
            };
        }));

        console.log(`\nFinal Thread Count: ${threadsWithLastMsg.length}`);
        threadsWithLastMsg.forEach(t => {
            console.log(`- ${t.name}: ${t.lastMessage} (${t.lastTime})`);
        });

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

debugInterestConfirmedDetails();
