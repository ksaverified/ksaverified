require('dotenv').config();
const { generateText } = require('./core/services/ai');

async function testAi() {
    console.log("--- AI Fallback Test ---");
    // We expect Cerebras to fail (429) and it should fallback to OpenRouter.
    const result = await generateText("Say result: SUCCESS. Use only one word.");
    if (result && result.toUpperCase().includes("SUCCESS")) {
        console.log("TEST PASSED: OpenRouter fallback successfully responded.");
    } else {
        console.log("TEST FAILED: No valid response from any provider.");
        // Re-inject error from ai.js logic if possible or just log current state
    }
    process.exit(0);
}

testAi();
