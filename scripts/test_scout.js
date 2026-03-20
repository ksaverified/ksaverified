require('dotenv').config();
const ScoutAgent = require('../agents/scout');

async function testScout() {
    const scout = new ScoutAgent();
    const query = "restaurant in Riyadh";
    console.log("Testing ScoutAgent.findLeads with query:", query);
    
    try {
        const leads = await scout.findLeads(query);
        console.log("Scouting finished. Found:", leads.length, "leads.");
        leads.slice(0, 2).forEach(l => console.log("-", l.name, l.phone));
    } catch (e) {
        console.error("Scouting EXCEPTION:", e.message);
    }
}

testScout();
