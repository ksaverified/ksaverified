require('dotenv').config();
const DatabaseService = require('../../core/services/db');

async function run() {
    const db = new DatabaseService();
    console.log('Fetching leads with low SEO scores...');
    const { data: leads, error } = await db.supabase
        .from('leads')
        .select('*')
        .lt('seo_score', 100);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${leads.length} leads to improve. Starting...`);
    let count = 0;

    for (const lead of leads) {
        count++;
        // Categorize based on name keywords
        let category = 'Business';
        const name = lead.name || '';
        if (name.includes('مغسلة') || name.includes('Car Wash') || name.includes('غسيل')) category = 'Car Wash';
        else if (name.includes('مطعم') || name.includes('Restaurant') || name.includes('Cafe') || name.includes('كافيه')) category = 'Restaurant';
        else if (name.includes('خياط') || name.includes('Tailor')) category = 'Tailoring';
        else if (name.includes('صالون') || name.includes('Salon') || name.includes('حلاق') || name.includes('Barber')) category = 'Salon & Spa';
        else if (name.includes('مشتل') || name.includes('Garden') || name.includes('نسيق')) category = 'Landscaping';
        else if (name.includes('صيانة') || name.includes('Maintenance') || name.includes('تصليح')) category = 'Maintenance Services';
        else if (name.includes('عيادة') || name.includes('Clinic') || name.includes('طبي')) category = 'Medical Clinic';
        else if (name.includes('مكتب') || name.includes('Office') || name.includes('عقارات')) category = 'Real Estate & Offices';

        const location = lead.neighborhood || lead.area || 'Riyadh';
        
        // Generate Title (target 30-60 chars)
        let title = `${name} - Top Rated ${category} in ${location}, Riyadh`;
        if (title.length < 30) title = `${name} | The Best ${category} in ${location}, Riyadh`;
        if (title.length > 60) title = title.substring(0, 57) + '...';

        // Generate Description (target 70-160 chars)
        let description = `Looking for the best ${category} at ${name}? Located in ${lead.address || location}, we offer premium services tailored to your needs. Visit us today in Riyadh!`;
        if (description.length < 70) description = `${description} We are committed to excellence and customer satisfaction in every ${category} service we provide.`;
        if (description.length > 160) description = description.substring(0, 157) + '...';

        process.stdout.write(`(${count}/${leads.length}) Updating ${name}... `);

        const { error: updateError } = await db.supabase
            .from('leads')
            .update({
                seo_title: title,
                seo_description: description,
                updated_at: new Date().toISOString()
            })
            .eq('place_id', lead.place_id);

        if (updateError) {
            console.log(`Failed: ${updateError.message}`);
        } else {
            console.log(`Updated!`);
        }
    }

    console.log('\nMetadata generation complete. Now re-running audit to update scores...');
    // We can call our previous audit script logic or just execute the audit script
}

run();
