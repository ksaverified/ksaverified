const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to load vercel-style functions
const registerApiRoute = (routePath, filePath) => {
    const handler = require(filePath);
    app.all(routePath, async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            console.error(`Error in ${routePath}:`, err);
            res.status(500).json({ error: err.message });
        }
    });
};

// Register all JS files in /api
const apiDir = path.join(__dirname, 'api');
if (fs.existsSync(apiDir)) {
    fs.readdirSync(apiDir).forEach(file => {
        if (file.endsWith('.js')) {
            const routeName = `/api/${file.replace('.js', '')}`;
            registerApiRoute(routeName, path.join(apiDir, file));
            console.log(`Registered API route: ${routeName}`);
        }
    });
}

app.listen(port, () => {
    console.log(`Dev API server running at http://localhost:${port}`);
});
