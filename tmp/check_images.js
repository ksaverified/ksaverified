import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'c:/dev/Internet Presence/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllSites() {
  console.log("Fetching established websites from Supabase...");
  const { data, error } = await supabase
    .from('leads')
    .select('place_id, name, website_html')
    .not('website_html', 'is', null);

  if (error) {
    console.error("Error fetching leads:", error);
    return;
  }

  let totalSites = data.length;
  console.log(`Extracting images from ${totalSites} websites...`);

  // Map to store which sites use which images: { imageUrl: [ {place_id, name} ] }
  const urlToSites = new Map();

  for (const lead of data) {
    const html = lead.website_html;
    if (!html) continue;

    const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (!urlToSites.has(url)) urlToSites.set(url, []);
      urlToSites.get(url).push({ place_id: lead.place_id, name: lead.name });
    }
    
    const bgRegex = /background-image:\s*url\(['"]?(https?:\/\/[^'"\)]+)['"]?\)/g;
    while ((match = bgRegex.exec(html)) !== null) {
      const url = match[1];
      if (!urlToSites.has(url)) urlToSites.set(url, []);
      urlToSites.get(url).push({ place_id: lead.place_id, name: lead.name });
    }
  }

  // Filter out maps icons and streetview
  const uniqueUrls = Array.from(urlToSites.keys()).filter(url => 
    !url.includes('maps/vt/icon') && !url.includes('maps.googleapis.com/maps/api/streetview') && !url.includes('data:')
  );

  console.log(`Found ${uniqueUrls.length} unique images to check. Processing in batches of 50...`);

  const report = [];
  let brokenImagesCount = 0;
  
  // Checking in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.all(batch.map(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
        return { url, ok: res.ok, status: res.status };
      } catch (e) {
        return { url, ok: false, status: e.message.includes('timeout') ? 'TIMEOUT' : 'EXCEPTION' };
      }
    }));

    for (const res of results) {
       if (!res.ok) {
         brokenImagesCount++;
         const affectedSites = urlToSites.get(res.url) || [];
         for (const site of affectedSites) {
            report.push({
               place_id: site.place_id,
               name: site.name,
               url: res.url,
               status: res.status
            });
         }
       }
    }
    process.stdout.write(`.` );
  }

  console.log("\n--- REPORT ---");
  console.log(`Total Sites Scanned: ${totalSites}`);
  console.log(`Total Unique Images Checked: ${uniqueUrls.length}`);
  console.log(`Total Broken Unique Images: ${brokenImagesCount}`);
  
  // Aggregate broken sites
  const brokenSites = new Set(report.map(r => r.place_id));
  console.log(`Sites Affected by Broken Images: ${brokenSites.size}`);

  fs.writeFileSync('c:/dev/Internet Presence/tmp/broken_images_report.json', JSON.stringify(report, null, 2));
  console.log("Report saved to tmp/broken_images_report.json");
}

checkAllSites();
