# KSA Verified - Control Dashboard

Quick commands to control all operations. Run these from the project root.

---

## 🌐 Web Dashboard

**Open the visual dashboard:**
```bash
npm start
```
Then open http://localhost:3001 in your browser

Features:
- Real-time GPU monitoring
- Ollama model status
- Business overview
- Memory system status
- Active projects
- Quick action buttons

---

## System Status

```bash
# Check GPU status (AI workloads)
nvidia-smi

# Check Ollama running models
ollama list

# Check PaperClip config
cat paperclip.json | jq .
```

---

## Memory Operations

```bash
# Create today's daily note
node scripts/para-memory-files.js daily-note --date $(date +%Y-%m-%d)

# Store a fact
node scripts/para-memory-files.js store "Customer signed: Al-Rajhi Trading" --entity "ksa-verified" --type "business"

# Recall facts
node scripts/para-memory-files.js recall "customer" --days 30

# List all entities
node scripts/para-memory-files.js list-entities
```

---

## Business Operations

### View Configuration
```bash
# Financial model
cat life/Areas/Business/financial-model.md

# Cultural guidelines
cat life/Areas/Business/cultural-guidelines.md

# Current projects
cat life/Projects/*.md
```

### Update Business State
```bash
# Edit today's plan
code memory/$(date +%Y-%m-%d).md
```

---

## Agent Commands

### Start CEO Agent Loop
```bash
# Set environment
export PAPERCLIP_CONFIG_PATH="./paperclip.json"
export AGENT_HOME="./life"

# Run heartbeat manually
node scripts/para-memory-files.js daily-note
```

### Check Agent Status
```bash
# Current agent config
cat paperclip.json | jq .agent

# Memory folder structure
tree life -L 2
```

---

## Project Commands

### Google Maps Extraction
```bash
# View project spec
cat life/Projects/google-maps-extraction.md

# Target cities
cat paperclip.json | jq .projects.google-maps-extraction.cities
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `nvidia-smi` | Check GPU utilization |
| `ollama run <model>` | Run local AI model |
| `node scripts/para-memory-files.js daily-note` | Create daily note |
| `code .` | Open project in VS Code |

---

## Files Structure

```
KSAVerified-PaperClip/
├── CONTROL.md              # This file - quick commands
├── paperclip.json          # Main configuration
├── AGENTS.md               # CEO role definition
├── SOUL.md                 # Business persona
├── HEARTBEAT.md            # Daily checklist
├── memory/
│   └── YYYY-MM-DD.md       # Daily notes
├── life/
│   ├── Areas/              # Ongoing responsibilities
│   │   └── Business/
│   │       ├── ksa-verified.md
│   │       ├── financial-model.md
│   │       └── cultural-guidelines.md
│   ├── Projects/           # Time-bound initiatives
│   │   └── google-maps-extraction.md
│   ├── Resources/          # Reference material
│   └── Archives/           # Completed items
└── scripts/
    └── para-memory-files.js  # Memory management skill
```

---

## Next Steps

1. **Set up PaperClip API backend** (if not already running)
2. **Build Google Maps scraper** for Saudi cities
3. **Create site generator template** (bilingual catalog)
4. **Define first customer acquisition campaign**
