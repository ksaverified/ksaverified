const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Dynamic routing for /api/* to files in api/*.js
app.all('/api/:file', async (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, '..', 'api', `${fileName}.js`);
    
    try {
        // Clear cache for hot reloading if needed, but for start it's fine
        delete require.cache[require.resolve(filePath)];
        const handler = require(filePath);
        
        // Mocking Vercel's req/res behavior
        // Vercel handlers are usually module.exports = async function handler(req, res)
        await handler(req, res);
    } catch (err) {
        console.error(`[API Server Error] ${fileName}:`, err.message);
        res.status(404).send(`API file /api/${fileName} not found or error occurred.`);
    }
});

app.listen(port, () => {
    console.log(`[API Server] Fallback API running at http://localhost:${port}`);
});
