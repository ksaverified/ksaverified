
const AuditorAgent = require('./agents/auditor');
const fs = require('fs');

async function testAudit() {
    const auditor = new AuditorAgent();
    const testHtml = '<html><body><h1>Test</h1><img src="https://via.placeholder.com/150"></body></html>';
    
    try {
        console.log('Testing AuditorAgent...');
        const report = await auditor.audit(testHtml, 'test-audit-man');
        console.log('Audit Success!', JSON.stringify(report, null, 2));
    } catch (error) {
        console.error('Audit Failed:', error.message);
    }
}

testAudit();
