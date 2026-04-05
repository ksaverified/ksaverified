require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function fixDeadLinks() {
  console.log('Reading dead_links.txt...');
  const lines = fs.readFileSync('dead_links.txt', 'utf8').split('\n');
  const urlsToFix = [];
  
  lines.forEach(line => {
    if (line.startsWith('- [')) {
      const parts = line.split(': http');
      if (parts.length > 1) {
         const url = 'http' + parts[1].trim();
         urlsToFix.push(url);
      }
    }
  });

  console.log(`Found ${urlsToFix.length} dead URLs to fix.`);
  
  if (urlsToFix.length === 0) {
      console.log('No URLs to fix.');
      return;
  }

  // Update in batches
  const batchSize = 50;
  let totalFixed = 0;
  
  for (let i = 0; i < urlsToFix.length; i += batchSize) {
    const batch = urlsToFix.slice(i, i + batchSize);
    
    // We will roll them back to 'scouted' so the AI entirely regenerates them.
    const { data, error } = await supabase
      .from('leads')
      .update({ 
         status: 'scouted', 
         vercel_url: null, 
         website_html: null,
         is_validated: false,
         updated_at: new Date().toISOString()
      })
      .in('vercel_url', batch);
      
    if (error) {
       console.error('Error updating batch:', error);
    } else {
       totalFixed += batch.length;
       console.log(`Batch processed. Total updated so far: ${totalFixed}`);
    }
  }

  console.log(`\nSuccess! Reset ${totalFixed} leads. The Orchestrator will now auto-regenerate them for free.`);
}

fixDeadLinks();
