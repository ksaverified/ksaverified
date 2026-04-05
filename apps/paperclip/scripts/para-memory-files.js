#!/usr/bin/env node
/**
 * para-memory-files - PaperClip Memory Management Skill
 *
 * Usage:
 *   node scripts/para-memory-files.js <action> [options]
 *
 * Actions:
 *   store <fact> --entity <entity> --type <type>
 *   recall <query> [--days <n>]
 *   daily-note --date <YYYY-MM-DD>
 *   synthesize --period <weekly|monthly>
 *   list-entities
 *   get-entity <name>
 */

const fs = require('fs');
const path = require('path');

const LIFE_DIR = path.join(__dirname, '..', 'life');
const MEMORY_DIR = path.join(__dirname, '..', 'memory');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function findEntity(name) {
  const searchDir = (dir) => {
    if (!fs.existsSync(dir)) return null;
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const found = searchDir(filePath);
        if (found) return found;
      } else if (file.toLowerCase() === `${name.toLowerCase()}.md`) {
        return filePath;
      }
    }
    return null;
  };
  return searchDir(LIFE_DIR);
}

function storeFact(fact, entity, type) {
  let entityPath = findEntity(entity);
  if (!entityPath) {
    const entityDir = path.join(LIFE_DIR, 'Resources', 'Entities');
    ensureDir(entityDir);
    entityPath = path.join(entityDir, `${entity}.md`);
    fs.writeFileSync(entityPath, `---\nname: ${entity}\ntype: ${type || 'resource'}\ncreated: ${new Date().toISOString().split('T')[0]}\n---\n\n# ${entity}\n\n`);
  }

  const content = fs.readFileSync(entityPath, 'utf8');
  const factSection = '\n## Facts\n\n';
  const factEntry = `- [${new Date().toISOString().split('T')[0]}] ${fact}\n`;

  if (content.includes(factSection)) {
    const newContent = content.replace(factSection, factSection + factEntry);
    fs.writeFileSync(entityPath, newContent);
  } else {
    fs.appendFileSync(entityPath, factSection + factEntry);
  }

  console.log(`Stored fact in ${entityPath}`);
}

function recallFacts(query, days = 30) {
  const results = [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const searchDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        searchDir(filePath);
      } else if (file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ file: filePath, content });
        }
      }
    }
  };

  searchDir(LIFE_DIR);
  searchDir(MEMORY_DIR);

  console.log(`Found ${results.length} matches for "${query}":`);
  results.forEach(r => console.log(`  - ${r.file}`));
  return results;
}

function createDailyNote(date) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const notePath = path.join(MEMORY_DIR, `${dateStr}.md`);

  if (fs.existsSync(notePath)) {
    console.log(`Daily note exists: ${notePath}`);
    return notePath;
  }

  const dayOfWeek = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  const weekNumber = Math.ceil((((new Date(dateStr)) - new Date(new Date(dateStr).getFullYear(), 0, 1)) / 86400000) + 1) / 7;

  const content = `---
date: ${dateStr}
day_of_week: ${dayOfWeek}
week_number: ${Math.floor(weekNumber)}
---

# Daily Note: ${dateStr}

## Today's Plan

- [ ]

## Notes


## Facts Extracted


## Timeline

`;

  fs.writeFileSync(notePath, content);
  console.log(`Created daily note: ${notePath}`);
  return notePath;
}

function listEntities() {
  const entities = [];
  const searchDir = (dir, category) => {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        searchDir(filePath, file);
      } else if (file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const nameMatch = content.match(/name:\s*(.+)/);
        entities.push({
          name: nameMatch ? nameMatch[1].trim() : file.replace('.md', ''),
          category,
          path: filePath
        });
      }
    }
  };

  searchDir(LIFE_DIR, 'root');

  console.log('Entities:');
  entities.forEach(e => console.log(`  - ${e.name} (${e.category})`));
  return entities;
}

// Main
const args = process.argv.slice(2);
const action = args[0];

switch (action) {
  case 'store':
    const fact = args[1];
    const entity = args[args.indexOf('--entity') + 1];
    const type = args[args.indexOf('--type') + 1];
    storeFact(fact, entity, type);
    break;
  case 'recall':
    const query = args[1];
    const days = parseInt(args[args.indexOf('--days') + 1]) || 30;
    recallFacts(query, days);
    break;
  case 'daily-note':
    const date = args[args.indexOf('--date') + 1];
    createDailyNote(date);
    break;
  case 'list-entities':
    listEntities();
    break;
  default:
    console.log('Usage: node scripts/para-memory-files.js <action> [options]');
    console.log('Actions: store, recall, daily-note, list-entities');
}
