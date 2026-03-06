require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function updateQueries() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const newQueries = [
        "restaurant in Olaya Riyadh",
        "cafe in Tahlia Street Riyadh",
        "gym in Malaz Riyadh",
        "dental clinic in Riyadh",
        "barbershop in Hittin Riyadh",
        "flower shop in Riyadh",
        "boutique in Riyadh",
        "bakery in Riyadh",
        "electronics repair in Riyadh",
        "car wash Riyadh",
        "coffee roastery Riyadh",
        "furniture store Riyadh",
        "spa in Al Mohammadiyyah Riyadh",
        "optician in Riyadh",
        "bookstore in Riyadh"
    ];

    const { data, error } = await supabase
        .from('settings')
        .update({ value: newQueries })
        .eq('key', 'search_queries')
        .select();

    if (error) {
        console.error('Error updating queries:', error);
        return;
    }

    console.log('--- Search Queries updated successfully ---');
    console.log(JSON.stringify(data[0].value, null, 2));
}

updateQueries();
