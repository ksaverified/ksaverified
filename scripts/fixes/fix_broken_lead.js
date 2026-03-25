require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const CreatorAgent = require('./agents/creator');
const RetoucherAgent = require('./agents/retoucher');
const PublisherAgent = require('./agents/publisher');
const DatabaseService = require('./services/db');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const placeId = 'ChIJTZMJpcHjLj4RAhjYZNOfC64';

    const { data: lead } = await supabase.from('leads').select('*').eq('place_id', placeId).single();
    console.log('Lead:', lead.name, '| Phone:', lead.phone);

    const db = new DatabaseService();
    const creator = new CreatorAgent();
    const retoucher = new RetoucherAgent();
    const publisher = new PublisherAgent();

    // Step 1: Generate website
    console.log('Generating website...');
    const business = {
        name: lead.name,
        phone: lead.phone,
        address: lead.address || 'Riyadh, Saudi Arabia',
        types: lead.types || ['electronics', 'electronics_store'],
        photos: lead.photos || [],
        reviews: lead.reviews || []
    };
    const rawHtml = await creator.createWebsite(business, db);
    console.log('Website generated, length:', rawHtml.length);

    // Step 2: Retouch
    console.log('Retouching...');
    const polishedHtml = await retoucher.retouchWebsite(rawHtml, business, lead.photos || []);
    console.log('Retouched, length:', polishedHtml.length);

    // Step 3: Save to DB
    await supabase.from('leads').update({ website_html: polishedHtml, status: 'retouched' }).eq('place_id', placeId);
    console.log('Saved to DB.');

    // Step 4: Deploy
    console.log('Deploying...');
    const deployedUrl = await publisher.handlePublish(placeId, lead.slug || 'electronic-store-riyadh');
    console.log('Deployed to:', deployedUrl);

    // Update status to published
    await supabase.from('leads').update({ status: 'published', vercel_url: deployedUrl }).eq('place_id', placeId);

    // Step 5: Verify it loads
    console.log('Verifying URL...');
    try {
        const check = await axios.get(deployedUrl, { timeout: 10000 });
        console.log('Site status:', check.status, '- OK!');
    } catch (e) {
        console.warn('URL check warning:', e.message);
    }

    // Step 6: Send apology + correct link
    const siteUrl = 'https://ksaverified.com/site/' + placeId;
    const msg = `Hello ${lead.name}! 💎 We sincerely apologize for the inconvenience — there was a technical issue with your website link earlier.\n\nYour website is now fully ready and live! Please visit it here:\n${siteUrl}\n\nWe hope you love it! Feel free to reply if you have any questions or would like any adjustments.\n\n---\n\nمرحباً ${lead.name}! 💎 نعتذر بصدق عن الإزعاج — كان هناك مشكلة تقنية في رابط موقعك في وقت سابق.\n\nموقعك الإلكتروني الآن جاهز تمامًا وشغّال! يرجى زيارته هنا:\n${siteUrl}\n\nنأمل أن يعجبك! لا تتردد في الرد إذا كان لديك أي أسئلة أو ترغب في أي تعديلات.`;

    const waUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:8081';
    await axios.post(waUrl + '/send', { to: lead.phone, message: msg });
    console.log('Apology sent to', lead.phone);
}

run().catch(e => console.error('FATAL:', e.message));
