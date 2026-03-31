const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        console.log(JSON.stringify(response.data.models.map(m => m.name), null, 2));
    } catch (err) {
        console.error(err.response?.data?.error?.message || err.message);
    }
}

listModels();
