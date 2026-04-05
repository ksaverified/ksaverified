# KSA Verified - PaperClip Command Center

Your central hub for controlling KSA Verified operations via AI agents.

---

## Quick Start

```bash
# 1. Verify GPU is ready (for local AI workloads)
nvidia-smi

# 2. Open the web dashboard
npm start
# Then open http://localhost:3001 in your browser

# 3. Or open text control panel
code CONTROL.md
```

---

## What You Control

| Area | What It Does |
|------|--------------|
| **Memory System** | PARA-based knowledge storage (facts, daily notes, synthesis) |
| **Business Config** | Financial model, staffing costs, pricing |
| **Projects** | Google Maps extraction, site generator |
| **Agents** | AI CEO + future team members |

---

## Key Files

| File | Purpose |
|------|---------|
| `CONTROL.md` | Quick commands dashboard |
| `paperclip.json` | Main configuration |
| `SOUL.md` | Your CEO persona |
| `HEARTBEAT.md` | Daily execution checklist |
| `memory/YYYY-MM-DD.md` | Daily planning |
| `life/Areas/Business/` | Business knowledge |

---

## Daily Workflow

1. **Morning**: Read/update `memory/today.md` - set priorities
2. **Work**: Run extraction/generation tasks
3. **Evening**: Extract facts to `life/` folder, note progress

---

## GPU Status

Your NVIDIA GeForce MX250 is configured and ready for:
- Ollama local AI models
- Data processing workloads

---

## Need Help?

1. Check `CONTROL.md` for commands
2. Read `HEARTBEAT.md` for CEO responsibilities
3. Review `life/Areas/Business/` for business context
