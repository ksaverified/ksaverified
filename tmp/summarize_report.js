import fs from 'fs';

const report = JSON.parse(fs.readFileSync('c:/dev/Internet Presence/tmp/broken_images_report.json', 'utf8'));

const urlCounts = {};
const statusCounts = {};
const siteCounts = new Set();

report.forEach(item => {
    urlCounts[item.url] = (urlCounts[item.url] || 0) + 1;
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    siteCounts.add(item.place_id);
});

console.log("### Image Audit Summary");
console.log(`- **Total Affected Sites**: ${siteCounts.size}`);
console.log(`- **Total Broken Instances**: ${report.length}`);
console.log("\n#### Status Breakdown");
Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`- **${status}**: ${count}`);
});

console.log("\n#### Top Broken URLs");
Object.entries(urlCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([url, count]) => {
        console.log(`- ${count} hits: ${url}`);
    });
