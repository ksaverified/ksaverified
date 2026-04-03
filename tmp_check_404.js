require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function checkWebsites() {
  console.log('Fetching leads with vercel_url...');
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('place_id, name, vercel_url, status')
    .not('vercel_url', 'is', null);

  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }

  const deadLinks = [];
  const batchSize = 10;
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (lead) => {
      try {
        const res = await axios.head(lead.vercel_url, { timeout: 10000, validateStatus: () => true });
        if (res.status === 404 || res.status >= 500) {
          deadLinks.push(lead);
        }
      } catch (err) {
        deadLinks.push(lead);
      }
    }));
  }

  let outStr = `Total URLs Checked: ${leads.length}\n`;
  outStr += `Dead/404/Error: ${deadLinks.length}\n\nList of 404 / Dead URLs:\n`;
  deadLinks.forEach(l => {
    outStr += `- [${l.status}] ${l.name}: ${l.vercel_url}\n`;
  });
  
  fs.writeFileSync('dead_links.txt', outStr);
  console.log(`Finished checking. Found ${deadLinks.length} dead links. Check dead_links.txt.`);
}

checkWebsites();
