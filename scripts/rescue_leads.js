require('dotenv').config();

const PublisherAgent = require('../agents/publisher');
const CloserAgent = require('../agents/closer');
const DatabaseService = require('../services/db');

async function rescueLeads() {
    const db = new DatabaseService();
    const publisher = new PublisherAgent();
    const closer = new CloserAgent();

    console.log('Fetching leads stuck in "created" status...');

    try {
        const { data: leads, error } = await db.supabase
            .from('leads')
            .select('*')
            .eq('status', 'created');

        if (error) throw error;

        if (!leads || leads.length === 0) {
            console.log('No leads found stuck in "created" status.');
            return;
        }

        console.log(`Found ${leads.length} leads to rescue. Starting deployment and pitching...`);

        for (const lead of leads) {
            console.log(`\n==============================================`);
            console.log(`Rescuing Lead: ${lead.name}`);

            try {
                // 2. Publish (deploy to Vercel dynamically)
                console.log(`[Rescue] Publishing site for ${lead.name}...`);
                const liveUrl = await publisher.handlePublish(lead.place_id);
                console.log(`[Rescue] Site Link Generated: ${liveUrl}`);

                // 3. Update Status
                await db.updateLeadStatus(lead.place_id, 'published', { vercel_url: liveUrl });

                // Step 2: Pitch with Ultramsg
                console.log(`Pitching to ${lead.phone} via Ultramsg...`);
                await closer.pitchLead(lead.name, lead.phone, liveUrl, db);
                await db.updateLeadStatus(lead.place_id, 'pitched');

                console.log(`Successfully rescued ${lead.name}!`);
            } catch (err) {
                console.error(`Failed to rescue ${lead.name}:`, err.message);
            }
        }

        console.log('\n==============================================');
        console.log('Rescue operation completed!');

    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

rescueLeads();
