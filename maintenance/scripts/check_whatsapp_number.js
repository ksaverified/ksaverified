const axios = require('axios');

async function checkMe() {
    try {
        const response = await axios.post('http://localhost:8081/execute', {
            code: 'client.info.wid.user'
        });
        console.log('Current WhatsApp Number:', response.data.result);
    } catch (err) {
        console.error('Error fetching WhatsApp number:', err.message);
    }
}

checkMe();
