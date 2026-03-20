const fs = require('fs');

let cleanedHtml = fs.readFileSync('tmp/lead.html', 'utf8');

const regexMap = /https:\/\/maps\.googleapis\.com\/maps\/api\/place\/photo\?[^"'\s)]+/g;
console.log("Before: Maps Googleapis found? ", cleanedHtml.includes("maps.googleapis.com"));

cleanedHtml = cleanedHtml.replace(regexMap, "https://images.unsplash.com/test");

console.log("After replace: Maps Googleapis found? ", cleanedHtml.includes("maps.googleapis.com"));
