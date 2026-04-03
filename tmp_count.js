const fs = require('fs');
const lines = fs.readFileSync('dead_links.txt', 'utf8').split('\n');
const counts = {};
lines.forEach(l => {
  if (l.startsWith('- [')) {
     const match = l.match(/\[(.*?)\]/);
     if (match) {
        const stat = match[1];
        counts[stat] = (counts[stat] || 0) + 1;
     }
  }
});
console.log(counts);
