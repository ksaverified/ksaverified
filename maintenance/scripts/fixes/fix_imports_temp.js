const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

const baseDir = 'c:\\dev\\Internet Presence\\maintenance\\scripts';

walk(baseDir, (filePath) => {
    if (filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let relativePathFromBase = path.relative(baseDir, filePath);
        let relativeDir = path.dirname(relativePathFromBase);
        
        // Scripts at root of maintenance/scripts need ../../core
        // Scripts in subdirectories need ../../../core
        let depth = (relativeDir === '.' || relativeDir === '') ? 0 : 1;
        let prefix = depth === 0 ? '../../core/' : '../../../core/';
        
        let newContent = content.replace(/require\(['"]\.\.\/services\//g, `require('${prefix}services/`);
        newContent = newContent.replace(/require\(['"]\.\.\/agents\//g, `require('${prefix}agents/`);
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated: ${filePath}`);
        }
    }
});

const whatsappPath = 'c:\\dev\\Internet Presence\\microservices\\whatsapp\\index.js';
if (fs.existsSync(whatsappPath)) {
    let content = fs.readFileSync(whatsappPath, 'utf8');
    let newContent = content.replace(/require\(['"]\.\.\/services\//g, "require('../../core/services/");
    newContent = newContent.replace(/require\(['"]\.\.\/agents\//g, "require('../../core/agents/");
    if (content !== newContent) {
        fs.writeFileSync(whatsappPath, newContent);
        console.log(`Updated: ${whatsappPath}`);
    }
}

console.log('--- REPLACEMENT COMPLETE ---');
