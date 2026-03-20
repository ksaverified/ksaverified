require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function list() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const models = await genAI.listModels();
        console.log('Available models:', JSON.stringify(models, null, 2));
    } catch (e) {
        console.error('Error listing models:', e);
    }
}

list();
