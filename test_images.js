const CreatorAgent = require('./agents/creator');
const RetoucherAgent = require('./agents/retoucher');
const AuditorAgent = require('./agents/auditor');
const DatabaseService = require('./services/db');
require('dotenv').config();

async function testImageLogic() {
    console.log('--- TESTING NEW IMAGE LOGIC ---');
    
    // Mock DatabaseService to avoid env issues in testing
    const mockDb = {
        getSetting: async () => ({
            system: "You are an expert web developer.",
            instructions: "Generate a modern landing page."
        })
    };

    const creator = new CreatorAgent();
    const retoucher = new RetoucherAgent();
    // Use dummy auditor for now if puppeteer is heavy or requires more env
    const auditor = new AuditorAgent();

    const mockBusiness = {
        name: "Al-Badr Luxury Bakery",
        phone: "966123456789",
        address: "King Fahd Rd, Riyadh",
        types: ["bakery", "cafe", "establishment"],
        photos: [] // No real photos to test stock fallback
    };

    try {
        // 1. Generate HTML with Semantic Tags
        console.log('1. Generating HTML with semantic tags...');
        const rawHtml = await creator.createWebsite(mockBusiness, mockDb);
        
        // 2. Retouch (This should trigger multiple localized Pexels queries)
        console.log('2. Retouching with localized queries...');
        const polishedHtml = await retoucher.retouchWebsite(rawHtml, mockBusiness, []);
        
        // 3. Audit
        console.log('3. Auditing for broken/duplicate images...');
        const auditResult = await auditor.audit(polishedHtml, 'test_bakery', false);
        
        console.log('RESULT:', JSON.stringify(auditResult, null, 2));

        if (auditResult.score === 100) {
            console.log('SUCCESS: Site passed with perfect score.');
        } else {
            console.log(`WARNING: Site score is ${auditResult.score}. Issues:`, auditResult.brokenImages, auditResult.duplicateImages);
        }

    } catch (e) {
        console.error('TEST FAILED:', e);
    }
}

testImageLogic();
