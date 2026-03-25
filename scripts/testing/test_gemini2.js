
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

async function testGemini() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-1.0-pro'];

    for (const model of modelsToTest) {
        try {
            console.log(`Testing model: ${model}...`);
            const response = await ai.models.generateContent({
                model: model,
                contents: 'Say hello',
            });
            console.log(`Success! ${model} says:`, response.text);
            return; // We found one that works
        } catch (error) {
            console.error(`Failed ${model}:`, error.message);
        }
    }
}

testGemini();
