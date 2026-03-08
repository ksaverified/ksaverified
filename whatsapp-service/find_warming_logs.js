const fs = require('fs');

try {
    let rawData = fs.readFileSync('logs_debug.json', 'utf8');
    if (rawData.charCodeAt(0) === 0xFEFF) {
        rawData = rawData.slice(1);
    }

    let logs;
    try {
        logs = JSON.parse(rawData);
    } catch (e) {
        console.log('JSON.parse failed, trying recovery...');
        const objects = rawData.match(/\{[\s\S]*?\}(?=,\n  \{|\])/g) || [];
        logs = objects.map(obj => {
            try { return JSON.parse(obj); } catch (err) { return null; }
        }).filter(l => l !== null);
    }

    console.log(`Searching through ${logs.length} log entries for "warming_sent"...`);
    const warmingLogs = logs.filter(log => {
        const text = log.textPayload || (log.jsonPayload && log.jsonPayload.message) || "";
        return text.includes('warming_sent') || (log.jsonPayload && log.jsonPayload.action === 'warming_sent');
    });

    console.log(`Found ${warmingLogs.length} warming_sent entries.`);
    warmingLogs.forEach(log => {
        console.log(JSON.stringify(log, null, 2));
    });

} catch (err) {
    console.error('Error:', err);
}
