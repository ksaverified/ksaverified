require('dotenv').config();
const ScoutAgent = require('./agents/scout');

async function test() {
  const scout = new ScoutAgent();
  const phones = ['966508178242', '0533444632'];
  
  for (const p of phones) {
    console.log(`\n--- Testing Phone: ${p} ---`);
    const place = await scout.findPlaceByPhone(p);
    if (place) {
      console.log(`SUCCESS: Found "${place.name}"`);
    } else {
      console.log(`FAILED: No place found for ${p}`);
    }
  }
}

test();
