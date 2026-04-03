const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const LEADS = [
  {
    place_id: 'seed_najla_bridal',
    name: 'Najla Bridal Boutique',
    phone: '+966551002030',
    address: 'Olaya St, Riyadh',
    website: 'https://najlabridal.sa',
    types: ['Bridal', 'Luxury'],
    status: 'strategic_seed',
    retry_count: 0,
    map_gap_analysis: {
      gaps: [
        { type: 'mobile_health', severity: 'high', description: 'Site not responsive' },
        { type: 'visuals', severity: 'medium', description: 'Photos 2+ years old' },
        { type: 'seo', severity: 'high', description: 'Missing Arabic metadata' }
      ],
      scores: { conversionScore: 42, seo: 30, visuals: 50, trust: 60, mobile: 20 },
      priorityLevel: 'high'
    },
    subscription_tier: '99',
    revenue: 99
  },
  {
    place_id: 'seed_riyadh_blossom',
    name: 'Riyadh Blossom Florals',
    phone: '+966503445566',
    address: 'Tahlia St, Riyadh',
    website: 'https://riyadhblossom.com',
    types: ['Florist', 'Gifts'],
    status: 'strategic_seed',
    retry_count: 0,
    map_gap_analysis: {
      gaps: [
        { type: 'trust', severity: 'high', description: 'No recent Google reviews' },
        { type: 'whatsapp_missing', severity: 'high', description: 'No direct chat link' }
      ],
      scores: { conversionScore: 65, seo: 70, visuals: 80, trust: 30, mobile: 80 },
      priorityLevel: 'warm'
    },
    subscription_tier: '19',
    revenue: 19
  },
  {
    place_id: 'seed_al_majd',
    name: 'Al-Majd Modern Tailors',
    phone: '+966589991122',
    address: 'Diriyah, Riyadh',
    website: null,
    types: ['Tailoring', 'Traditional'],
    status: 'strategic_seed',
    retry_count: 0,
    map_gap_analysis: {
      gaps: [
        { type: 'discovery', severity: 'critical', description: 'No digital presence at all' }
      ],
      scores: { conversionScore: 88, seo: 0, visuals: 0, trust: 10, mobile: 0 },
      priorityLevel: 'urgent'
    },
    subscription_tier: '49',
    revenue: 49
  }
];

async function seed() {
  console.log('🌱 Seeding Strategic Prospect List...');
  try {
    const { data, error } = await supabase.from('leads').upsert(
      LEADS.map(l => ({
        ...l,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })),
      { onConflict: 'place_id' }
    );

    if (error) {
      console.error('❌ Seeding Failed:', error.message);
    } else {
      console.log('✅ Successfully seeded 3 high-priority prospects.');
    }
  } catch (err) {
    console.error('❌ Integration Error:', err.message);
  }
}

seed();
