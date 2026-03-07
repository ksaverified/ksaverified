const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { text, targetLang } = request.body;

    if (!text || !targetLang) {
        return response.status(400).json({ error: 'Missing text or targetLang' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    try {
        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Translate the following text to ${targetLang}. 
        Return ONLY the translated text. 
        Do not add quotes, explanations, or conversational filler. 
        If the text is already in ${targetLang}, return it as is.
        
        Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();

        return response.status(200).json({ translatedText });
    } catch (error) {
        console.error('[Translation API Error]', error.message);
        return response.status(500).json({ error: 'Translation failed', details: error.message });
    }
};
