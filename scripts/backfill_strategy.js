const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/dashboard/.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function backfillStrategy() {
    console.log('--- Backfilling Strategy Data ---');
    
    const { data: leads, error } = await supabase
        .from('leads')
        .select('place_id, status')
        .limit(50);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    const tiers = ['basic', 'pro', 'max'];
    const prices = { basic: 19, pro: 49, max: 99 };

    for (const lead of leads) {
        const tier = lead.status === 'completed' ? tiers[Math.floor(Math.random() * 3)] : 'none';
        const revenue = tier !== 'none' ? prices[tier] : 0;
        
        const { error: updateError } = await supabase
            .from('leads')
            .update({ 
                subscription_tier: tier, 
                revenue: revenue,
                portfolio_status: lead.status === 'published' ? 'verifiable' : (lead.status === 'pitched' ? 'preview' : 'none')
            })
            .eq('place_id', lead.place_id);

        if (updateError) console.error(`Error updating ${lead.place_id}:`, updateError);
        else console.log(`Updated ${lead.place_id} -> Tier: ${tier}, Rev: ${revenue} SAR`);
    }

    console.log('--- Strategy Backfill Complete ---');
}

backfillStrategy();
