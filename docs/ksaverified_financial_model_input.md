# Financial Model Input Summary: KSA Verified

**Context & Status**
*   **Operating Status:** Lean startup phase, operating in Riyadh, Saudi Arabia.
*   **Legal Status:** Freelance developer (no Commercial Registration / CR yet). Pre-revenue. 
*   **Core Entity Name:** KSA Verified (Replacing legacy names: ALATLAS, drop-servicing).
*   **Domain Assets:** `ksaverified.com` (Main SaaS Application), `ksaverified.info` (Compliance & Technical Standards Portfolio), `ksaverified.store`, `ksaverified.online`.

**Value Proposition & Structure**
The business operates an automated pipeline that finds local businesses (leads) without an internet presence, generates a premium AI-powered website preview for them, hosts it, and reaches out via WhatsApp with a pitch.
*   **Main Application (`ksaverified.com`):** The core SaaS pipeline and client dashboard. Clients log in here to manage their generated sites.
*   **Authority Strategy (`ksaverified.info`):** "The Digital Standards Project." A technical portfolio demonstrating that the developed systems are designed for Saudi regulations (e.g., following principles of the Saudi Personal Data Protection Law - PDPL). This builds trust through technical transparency rather than claiming official corporate compliance.
*   **Marketplace Strategy (`ksaverified.store`):** Framed as a marketplace for templates and development packages ("Store-in-a-box"), sold as freelance digital products rather than corporate B2B services.

**Customer Journey & Pricing Strategy**
1.  **Lead Generation (Scout):** Automated discovery of target businesses in Riyadh via Google Maps/Places API.
2.  **Creation (Creator/Retoucher):** Automated generation of a custom website using LLMs, stored and hosted.
3.  **Promotion (Closer):** Automated WhatsApp outreach.
    *   *Initial Hook:* A free preview of the generated site.
    *   *Promotion/Conversion:* "1 Week FREE trial, then pay only 19 SAR for the first month! (Normal price 99 SAR)."
4.  **Retention:** Subscription model (99 SAR/month standard pricing after the promotional period).

**Key Cost Drivers (Variables to Model)**
*   **Infrastructure & Hosting:**
    *   Supabase (Database, Auth, Storage) - Currently migrating to a new Free Tier project, scaling to Pro ($25/mo) as bandwidth/usage requires.
    *   Vercel (Frontend & Generated Site Hosting) - Assume Free/Pro tier costs.
*   **API Usage:**
    *   Google Maps/Places API (for scaffolding leads).
    *   LLM Providers (for AI website generation and chatbot translation). 
    *   WhatsApp Messaging (Using a local/puppeteer microservice currently, effectively free messaging, but consider server running costs if deployed).
*   **Domain Renewals:** Annual costs for 4 domains (.com, .info, .store, .online).

**Revenue Drivers**
*   **Conversion Rate:** Percentage of pitched leads that accept the 19 SAR trial.
*   **Retention/Churn Rate:** Percentage of trial users that convert to the 99 SAR/mo standard subscription.
*   **Total Addressable Market (TAM) Penetration:** Volume of leads processed per day/month by the automated orchestrator.

**Modeling Scenarios to Consider**
*   **Base Case:** Conservative conversion rates on the 19 SAR promo.
*   **Optimistic Case:** High retention after the first month of standard pricing.
*   **Worst Case:** High infrastructure (API/Egress) costs without corresponding revenue conversions.
