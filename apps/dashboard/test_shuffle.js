const fetch = require('node-fetch');
const http = require('http');

async function test_pexels() {
    const key = process.env.VITE_PEXELS_API_KEY || '8R08X8ugOZjkX43GEeZG8akPTcrDq8tL8gdvXbsamEThjMsv7iMYK6UX'; // User's key
    const res = await fetch('https://api.pexels.com/v1/search?query=preschool&per_page=3', {
        headers: { Authorization: key }
    });
    console.log("Status:", res.status);
    if(res.ok) {
        const body = await res.json();
        console.log("Photos:", body.photos.map(p => p.src.large));
    } else {
        console.log("Error:", await res.text());
    }
}

function test_regex() {
    let html = `<img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000" />`;
    const GENERIC_IDS = ['1497366216548-37526070297c'];
    GENERIC_IDS.forEach(id => {
        const regex = new RegExp(`https://images\\.unsplash\\.com/photo-${id}[^"']*`, 'g');
        console.log("Regex:", regex);
        console.log("Before:", html);
        html = html.replace(regex, 'SUCCESS');
        console.log("After:", html);
    });
}

test_regex();
test_pexels().catch(console.error);
