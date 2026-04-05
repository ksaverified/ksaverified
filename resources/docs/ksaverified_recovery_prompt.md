# KSA Verified: Project Resume & Recovery Prompt

*Use the text below as a prompt for any LLM to accurately recover, reconstruct, or deeply understand the structure and mechanics of the KSA Verified system.*

---

## 🔒 SYSTEM CONTEXT & IDENTITY
You are recovering **"KSA Verified"**, an autonomous, AI-driven B2B SaaS platform specifically built for the Saudi Arabian market. The system acts as a fully automated digital agency. Its primary directive is to automatically scout small/medium businesses (leads) via Google Places, generate stunning, conversion-optimized responsive websites for them using AI, publish those sites to a live Vercel environment, and pitch the completed websites directly to the business owners via a WhatsApp microservice with a free trial and automated billing urgency loops.

## 🏗️ ARCHITECTURE & TECH STACK
The platform is a JavaScript/Node.js monorepo structured around a long-running background orchestrator and serverless frontends/APIs.

### Core Stack:
- **Backend/Orchestrator:** Node.js (Express, Mongoose).
- **Frontend SPA (x2):** React 19, Vite, Tailwind CSS (v4 in client, v3 in admin), Framer Motion, Lucide React.
- **Database / Auth / Storage:** Supabase (Postgres).
- **Deployment:** Vercel (for frontend & Serverless APIs), Docker (for WhatsApp Microservice).
- **AI/LLM Routing:** Cerebras Inference API (Priority 1) -> OpenRouter Free (Priority 2) -> Vercel AI Gateway (Fallback).

## 📂 DIRECTORY STRUCTURE
```text
/
├── apps/
│   ├── dashboard/           # Admin React SPA (Analytics, Map integration, Lead management)
│   ├── client-dashboard/    # Customer React SPA (Portal for lead to manage their new site)
│   ├── corporate-site/      # Landing page for KSA Verified
│   └── marketplace/         # Future extension
├── api/                     # Vercel Serverless Functions
│   ├── admin-chat.js, leads.js, portal.js, preview.js, seo.js, webhook.js, system.js
├── core/                    # The Brain: Node.js Automated Pipeline
│   ├── orchestrator.js      # The main infinite loop / cron daemon
│   ├── agents/              # The AI workforce (Scout, auditor, biller, certifier, chatbot, closer, creator, publisher, retoucher, marketingAudit)
│   └── services/            # Shared utilities (db.js, ai.js, auth.js)
├── microservices/
│   └── whatsapp/            # Dockerized Node.js service using whatsapp-web.js for messaging
├── maintenance/             # Archiving, logs, tests, backups
├── scripts/                 # One-off DB backfills and seed scripts
└── package.json             # Root monorepo scripts ("npm run build" triggers Vite builds)
```

## 🧠 THE ORCHESTRATOR LIFECYCLE (`core/orchestrator.js`)
The beating heart of the system is a continuous loop pipeline running staggered operations, gated by health checks on Supabase and the WhatsApp microservice. 

1. **Pre-Flight:** Checks Database connectivity and WhatsApp Auth readiness. Evaluates active subscriptions & expiring trials.
2. **Scout Phase (`scout.js`):** Queries Google APIs for businesses (e.g., "restaurants in Riyadh"). Saves new leads to Supabase.
3. **Generation Phase (`creator.js` & `retoucher.js`):** Uses AI to generate raw HTML/Tailwind for the business based on their specific niche, then refines/retouches the layout and copy.
4. **Publishing & Audit (`publisher.js` & `auditor.js`):** Deploys the static HTML. The Auditor agent then executes a visual/link check (Map Gap analysis) on the live URL. If it fails validation, it gets rolled back.
5. **Pitching (`closer.js` & WhatsApp bot):** Sends a direct WhatsApp message to the business owner containing the live link to their tailored website. 
6. **Retargeting & Warming Loops:** Periodically nudges leads (e.g., 24h, 48h drops). Handles specific cohorts (Group A: Certified, Group B: Nudge, Group C: 19 SAR Promo, Group D: Urgency Close).

## 🤖 AI ROUTING MECHANISM (`core/services/ai.js`)
The system employs a "Cost Shield" strict fallback strategy:
1. Try **Cerebras** (`llama3.1-8b`) for ultra-fast, cheap inference.
2. Fallback to **OpenRouter** free tier models (`gemini-2.0-flash-lite:free`, `qwen-2.5-72b`).
3. Last resort **Vercel AI Gateway**.

## 📞 WHATSAPP MICROSERVICE (`microservices/whatsapp/index.js`)
- Runs as a standalone express server (Port 8081).
- Wraps `whatsapp-web.js` with Puppeteer.
- Acts as both a sender for the Orchestrator's pitches and a receiver/webhook proxy for the `chatbot.js` agent interpreting customer replies.

## 🔐 CRITICAL ENVIRONMENT VARIABLES (`.env` Contract)
To recover this system, you must supply these variables mapping:
- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **AI Keys:** `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`, `VERCEL_AI_KEY`
- **Google:** `GOOGLE_PLACES_API_KEY`
- **Vercel:** `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`
- **Toggles:** `PROMOTION_MODE=true/false` (Locks pipeline to only process pre-warmed/interested leads).

## 🚀 RECOVERY INSTRUCTIONS FOR AI
When asked to add a feature, debug, or rebuild a module for this project:
1. Always maintain the strict Agent separation of concerns (e.g., `creator.js` makes code, `auditor.js` tests code).
2. Adhere to the fallback mechanism in `ai.js` to ensure zero/low cost.
3. When touching frontends, ensure Vercel build compatibility (the monorepo doesn't use Turborepo, just standard concurrent `npm install && npm run build` via root).
4. Respect `PROMOTION_MODE` logic in the Orchestrator to prevent unwanted mass WhatsApp blasting.
