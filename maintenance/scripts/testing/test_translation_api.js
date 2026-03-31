require('dotenv').config();
const axios = require('axios');

async function testTranslation() {
    console.log('--- Testing Translation API ---');
    try {
        const response = await axios.post('http://localhost:3000/api/translate', {
            text: 'Hello, how can I help you today?',
            targetLang: 'Arabic'
        });
        console.log('Result:', response.data.translatedText);

        if (response.data.translatedText.includes('مرحبا') || response.data.translatedText.includes('خدمتكم')) {
            console.log('✅ Translation looks correct (Arabic detected).');
        } else {
            console.warn('❌ Translation might be incorrect.');
        }
    } catch (err) {
        console.error('❌ API Test Failed:', err.response?.data || err.message);
    }
}

testTranslation();
