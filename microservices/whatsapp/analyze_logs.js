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

    console.log(`Analyzing ${logs.length} log entries...`);

    // Sample a few logs to see the structure
    console.log('Sample Log Structure:');
    console.log(JSON.stringify(logs.slice(0, 2), null, 2));

    const allActions = new Set();
    logs.forEach(log => {
        if (log.jsonPayload && log.jsonPayload.action) {
            allActions.add(log.jsonPayload.action);
        }
        const text = log.textPayload || (log.jsonPayload && log.jsonPayload.message) || "";
        if (text.toLowerCase().includes('interest') || text.toLowerCase().includes('confirm') || text.toLowerCase().includes('warm')) {
            console.log('Match found in text:');
            console.log(JSON.stringify(log, null, 2));
        }
    });

    console.log('All unique actions found in jsonPayload:');
    console.log(Array.from(allActions));

} catch (err) {
    console.error('Error:', err);
}
