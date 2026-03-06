require('dotenv').config();
const CreatorAgent = require('../agents/creator');
const DatabaseService = require('../services/db');
const fs = require('fs');
const path = require('path');

async function testGeneration() {
    const db = new DatabaseService();
    const creator = new CreatorAgent();

    const testBusiness = {
        name: "AlAtlas Riyadh Branch",
        phone: "+966 50 123 4567",
        address: "King Fahd Road, Riyadh, Saudi Arabia",
        types: ["Restaurant", "Cafe"],
        photos: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5"],
        reviews: ["Best coffee in Riyadh!", "The atmosphere is amazing."]
    };

    try {
        const html = await creator.createWebsite(testBusiness, db);
        const outputPath = path.join(__dirname, 'test_responsive_website.html');
        fs.writeFileSync(outputPath, html);
        console.log(`--- Test website generated at: ${outputPath} ---`);
    } catch (error) {
        console.error('Error in test generation:', error);
    }
}

testGeneration();
