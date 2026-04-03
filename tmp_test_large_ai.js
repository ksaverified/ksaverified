require('dotenv').config();
const { generateText } = require('./core/services/ai');

async function testLargeAi() {
    console.log("--- AI Large Prompt Fallback Test ---");
    // Generate a ~2000 token prompt
    const longPrompt = "Generate a very detailed description of a pet care business. Writing a full 1000-word essay about cats and dogs. ".repeat(10);
    
    console.log(`Sending prompt of length: ${longPrompt.length}`);
    const result = await generateText(longPrompt, { maxOutputTokens: 2048 });
    
    if (result && result.length > 500) {
        console.log(`TEST PASSED: Received ${result.length} chars from fallback.`);
    } else {
        console.log("TEST FAILED: No valid response for large prompt.");
    }
    process.exit(0);
}

testLargeAi();
