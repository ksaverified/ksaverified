require('dotenv').config();

const CreatorAgent = require('./agents/creator');
const RetoucherAgent = require('./agents/retoucher');
const PublisherAgent = require('./agents/publisher');
const CloserAgent = require('./agents/closer');
const BillerAgent = require('./agents/biller');
const DatabaseService = require('./services/db');
const ScoutAgent = require('./agents/scout');
const AuditorAgent = require('./agents/auditor');
const CertifierAgent = require('./agents/certifier');
const MarketingAuditAgent = require('./agents/marketingAudit');
const systemApi = require('../api/system');
const express = require('express');
const app = express();

class Orchestrator {
  constructor() {
    this.scout = new ScoutAgent();
    this.creator = new CreatorAgent();
    this.retoucher = new RetoucherAgent();
    this.publisher = new PublisherAgent();
    this.closer = new CloserAgent();
    this.biller = new BillerAgent();
    this.auditor = new AuditorAgent();
    this.certifier = new CertifierAgent();
    this.marketingAudit = new MarketingAuditAgent();
    this.db = new DatabaseService();
    this.closer.setDatabase(this.db);
    this.isRunning = false;
    this.axios = require('axios');
  }

  /**
   * Executes a single pipeline run
   */
  /**
   * Circuit-breaker: checks if Supabase is reachable before running a cycle.
   * Returns true if healthy, false if the DB should be left alone.
   */
  async isSupabaseHealthy() {
    try {
      // Use the client to perform a small query instead of raw axios to ensure headers match
      const { data, error } = await this.db.supabase.from('settings').select('key').limit(1);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Orchestrator] 🔴 Supabase health check failed:', err.message);
      return false;
    }
  }

  /**
   * Pre-flight check for WhatsApp service.
   * Returns true if ready, false if waiting for authentication.
   */
  async checkWhatsAppHealth() {
    try {
      const response = await this.axios.get('http://localhost:8081/health');
      if (response.data.ready) return true;
      
      console.log('[Orchestrator] 🟡 WhatsApp service is active but WAITING for authentication (QR scan required).');
      return false;
    } catch (err) {
      console.warn('[Orchestrator] 🔴 WhatsApp microservice is DOWN or unreachable:', err.message);
      return false;
    }
  }

  async runPipeline() {
    if (this.isRunning) {
      console.log('[Orchestrator] Cycle already in progress. Skipping.');
      return;
    }

    // Circuit breaker: bail immediately if Supabase is unreachable
    if (!(await this.isSupabaseHealthy())) {
      console.warn('[Orchestrator] ⚠️ Supabase is down — skipping this cycle to avoid flooding.');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const promotionMode = process.env.PROMOTION_MODE === 'true';

    console.log('\n======================================================');
    console.log(`[Orchestrator] Starting cycle (Promotion Mode: ${promotionMode})`);
    console.log('======================================================');
    await this.db.addLog('orchestrator', 'cycle_start', null, { promotionMode }, 'info');
    await this.db.cleanupOldLogs(14); // Keep DB size in check

    // [Value-Led Refactor] Step 0: WhatsApp Pre-flight check
    // We only proceed if WhatsApp is ready OR if we are just scouting (which doesn't need WA)
    // However, since we often move straight from scout to pitch, it's safer to check here.
    const isWaReady = await this.checkWhatsAppHealth();
    if (!isWaReady) {
        console.log('[Orchestrator] Cycle deferred: WhatsApp service not authenticated.');
        await this.db.addLog('orchestrator', 'cycle_deferred', null, { reason: 'WhatsApp authentication required' }, 'info');
        this.isRunning = false;
        return;
    }

    try {
      // Step 0: Check Subscriptions
      await this.biller.checkExpiringSubscriptions();

      // Step 0.1: Google Compliance Notifications (48-hour rule)
      await this.runNotificationCycle();

      // Step 1: Scouting or Warming/Promotion
      if (!promotionMode) {
        let queries;
        try {
          queries = await this.db.getSetting('search_queries');
        } catch (e) {
          queries = ['restaurant in Riyadh', 'barbershop in Riyadh'];
        }
        try {
          const query = queries[Math.floor(Math.random() * queries.length)];
          console.log(`[Orchestrator] Scouting for leads matching "${query}"`);
          await this.db.addLog('scout', 'search_started', null, { query }, 'info');
          const leads = await this.scout.findLeads(query);
          for (const lead of leads) {
            await this.db.upsertLead(lead);
          }
          await this.db.addLog('scout', 'search_completed', null, { found: leads.length, query }, 'success');
        } catch (scoutError) {
          console.error(`[Orchestrator] Scouting failed (possibly API key issue): ${scoutError.message}`);
          await this.db.addLog('scout', 'search_failed', null, { error: scoutError.message }, 'warning');
        }
      } else {
        console.log('[Orchestrator] Scouting DISABLED in Promotion Mode (Cost Shield ACTIVE 🛡️)');
        // Prioritize already-pitched leads (who have a website) to use the 1 week free trial
        await this.runPromotionCycle();
        await this.runWarmingCycle();
        await this.runNudgeCycle();
        await this.runTrialReminderCycle();
        await this.runRetargetingCycle(); // NEW: Smart retargeting for conversions
      }

      // Step 2: Process intermediate leads (backlog)
      let activeDbLead = await this.db.getPendingLead();

      while (activeDbLead) {
        // If in promotion mode, we ONLY auto-generate for leads that confirmed interest.
        // This is our 'Cost Shield' - we don't build sites unless they say YES.
        if (promotionMode && (activeDbLead.status === 'scouted' || activeDbLead.status === 'warming_sent')) {
          console.log(`[Orchestrator] Skipping auto-generation for ${activeDbLead.name} (Waiting for confirmed interest)`);
          
          // Try to find an "Interest Confirmed" lead instead to jump the queue
          const { data: priorityLead } = await this.db.supabase
            .from('leads')
            .select('*')
            .in('status', ['interest_confirmed', 'strategic_seed', 'scouted', 'warming_sent', 'warmed', 'created', 'retouched', 'published'])
            .limit(1)
            .single();
            
          if (priorityLead) {
            console.log(`[Orchestrator] Jumped Queue: Processing Interest Confirmed lead ${priorityLead.name}`);
            activeDbLead = priorityLead;
          } else {
            break; // Exit queue processing for this cycle
          }
        }

        const elapsedSeconds = (Date.now() - startTime) / 1000;
        if (elapsedSeconds > 3000) break;

        const activeLead = {
          name: activeDbLead.name,
          phone: activeDbLead.phone,
          placeId: activeDbLead.place_id,
          address: activeDbLead.address,
          slug: activeDbLead.slug,
          location: { lat: activeDbLead.lat, lng: activeDbLead.lng },
          photos: activeDbLead.photos || []
        };

        console.log(`\n[Orchestrator] Selected lead: ${activeLead.name}`);

        try {
          // Pre-check phone validity to avoid wasting resources
          const formattedPhone = this.closer.formatPhoneNumber(activeLead.phone);
          if (!formattedPhone) {
            console.log(`[Orchestrator] Skipping ${activeLead.name}: Invalid or landline number.`);
            await this.db.updateLeadStatus(activeLead.placeId, 'invalid', { last_error: 'Invalid or landline number' });
            activeDbLead = await this.db.getPendingLead();
            continue;
          }


          let currentHtml = '';
          if (['created', 'retouched', 'published', 'pitched'].includes(activeDbLead.status)) {
              currentHtml = await this.db.getLeadHtml(activeLead.placeId) || '';
          }
          let vercelUrl = activeDbLead.vercel_url || '';

          // Self-Healing: If a lead slipped into advanced pipeline stages without HTML, roll it back
          if (!currentHtml && ['created', 'retouched', 'published', 'pitched'].includes(activeDbLead.status)) {
              console.warn(`[Orchestrator] 🛑 Lead ${activeLead.name} status is '${activeDbLead.status}' but missing HTML. Rolling back to 'scouted'.`);
              await this.db.addLog('orchestrator', 'rollback_to_scouted', activeLead.place_id, { reason: 'Missing HTML' }, 'warning');
              await this.db.updateLeadStatus(activeLead.place_id, 'scouted', { website_html: null, vercel_url: null, is_validated: false });
              activeDbLead.status = 'scouted';
          }

          if (activeDbLead.status === 'interest_confirmed' || activeDbLead.status === 'strategic_seed' || activeDbLead.status === 'scouted' || activeDbLead.status === 'warmed') {
            await this.db.addLog('creator', 'generation_started', activeLead.place_id, { name: activeLead.name }, 'info');
            currentHtml = await this.creator.createWebsite(activeLead, this.db);
            
            if (!currentHtml || currentHtml.length < 500) {
                 const errorMsg = `AI Generation Error: HTML response is empty or too short (${currentHtml?.length || 0} chars).`;
                 console.error(`[Orchestrator] 🛑 ${errorMsg} Aborting for ${activeLead.name}.`);
                 throw new Error(errorMsg);
            }
            
            await this.db.updateLeadStatus(activeLead.place_id, 'created', { website_html: currentHtml });
            activeDbLead.status = 'created';
          }

          if (activeDbLead.status === 'interest_confirmed' || activeDbLead.status === 'strategic_seed' || activeDbLead.status === 'scouted' || activeDbLead.status === 'warmed' || activeDbLead.status === 'created') {
            await this.db.addLog('retoucher', 'audit_started', activeLead.place_id, { name: activeLead.name }, 'info');
            const retouchedHtml = await this.retoucher.retouchWebsite(currentHtml, activeLead);
            
            if (!retouchedHtml || retouchedHtml.length < 500) {
                 const errorMsg = `Retouching Error: HTML response is empty or too short (${retouchedHtml?.length || 0} chars).`;
                 console.error(`[Orchestrator] 🛑 ${errorMsg} Aborting for ${activeLead.name}.`);
                 throw new Error(errorMsg);
            }
            
            currentHtml = retouchedHtml;
            await this.db.updateLeadStatus(activeLead.place_id, 'retouched', { website_html: currentHtml });
          }
          
          if (activeDbLead.status === 'interest_confirmed' || activeDbLead.status === 'strategic_seed' || activeDbLead.status === 'scouted' || activeDbLead.status === 'warmed' || activeDbLead.status === 'created' || activeDbLead.status === 'retouched') {
            // CRITICAL: Double check we have HTML content before marking as published
            if (!currentHtml || currentHtml.length < 500) {
               console.error(`[Orchestrator] 🛑 CRITICAL: HTML content for ${activeLead.name} is missing or too short (${currentHtml?.length || 0} chars). Aborting publication.`);
               throw new Error("Publication aborted: HTML content is missing or truncated. Resetting lead state.");
            }

            await this.db.addLog('publisher', 'deployment_started', activeLead.placeId, {}, 'info');
            vercelUrl = await this.publisher.handlePublish(activeLead.placeId, activeLead.slug);
            await this.db.updateLeadStatus(activeLead.placeId, 'published', { vercel_url: vercelUrl, indexing_status: 'pending' });
            
            // Step 2.1: [NEW] Live URL Audit
            // Now that it's live, we perform a final visual audit before pitching.
            await this.db.addLog('auditor', 'live_audit_started', activeLead.placeId, { url: vercelUrl }, 'info');
            const auditReport = await this.auditor.audit(vercelUrl, activeLead.slug, true);
            
            // Store audit metrics in the DB
            await this.db.updateLeadStatus(activeLead.placeId, 'published', {
               audit_score: auditReport.score,
               last_audit_error: auditReport.brokenImages.length > 0 ? `Broken images: ${auditReport.brokenImages.join(', ')}` : (auditReport.layoutIssues[0] || null),
               is_validated: auditReport.isValidated,
               validation_notes: `Auto-audit score: ${auditReport.score}/100. ${auditReport.isValidated ? 'PASSED' : 'FAILED - NEEDS MANUAL REVIEW'}`
            });
            
            await this.db.addLog('auditor', 'live_audit_completed', activeLead.placeId, { 
              score: auditReport.score, 
              isValidated: auditReport.isValidated,
              errors: auditReport.brokenImages.length + auditReport.layoutIssues.length
            }, auditReport.isValidated ? 'success' : 'warning');
            
            // Update the local state for the next step
            activeDbLead.is_validated = auditReport.isValidated;
          }

          if (activeDbLead.status !== 'pitched') {
            // HARD BLOCK: Never pitch a lead that has not passed the quality audit.
            // Promotion mode is NOT an exception — a broken link in promotion mode is still a broken link.
            if (!activeDbLead.is_validated) {
              console.log(`[Orchestrator] 🛑 Skipping pitch for ${activeLead.name}. Site has NOT passed quality audit (is_validated=false). Reset to scouted or fix manually.`);
              await this.db.addLog('orchestrator', 'pitch_aborted', activeLead.placeId, { reason: 'Failed quality audit — is_validated is false' }, 'warning');
              // Mark with a high retry count so it falls out of the pending queue and doesn't loop
              await this.db.incrementRetryCount(activeLead.placeId, 'Pitch aborted: site not validated');
              activeDbLead = await this.db.getPendingLead();
              continue;
            }
            await this.db.addLog('closer', 'pitch_started', activeLead.placeId, { phone: activeLead.phone }, 'info');
            await this.closer.pitchLead(activeLead.name, activeLead.phone, vercelUrl, this.db);
            await this.db.updateLeadStatus(activeLead.placeId, 'pitched');
            console.log('[Orchestrator] Throttling for 20s...');
            await new Promise(resolve => setTimeout(resolve, 20000));
          }

          await this.db.addLog('orchestrator', 'cycle_success', activeLead.placeId, { name: activeLead.name }, 'success');
        } catch (innerError) {
          const detail = innerError.response ? JSON.stringify(innerError.response.data) : innerError.message;
          console.error(`[Orchestrator] Failed lead ${activeLead.name}:`, detail);
          
          if (detail.includes('Number not on WhatsApp')) {
            console.log(`[Orchestrator] Marking ${activeLead.name} as invalid permanently: Number not on WhatsApp.`);
            await this.db.updateLeadStatus(activeLead.placeId, 'invalid', { last_error: 'Number not on WhatsApp' });
            await this.db.addLog('orchestrator', 'lead_invalidated', activeLead.placeId, { reason: 'Number not on WhatsApp' }, 'warning');
          } else {
            await this.db.addLog('orchestrator', 'lead_error', activeLead.placeId, { message: innerError.message }, 'error');
            await this.db.incrementRetryCount(activeLead.placeId, innerError.message);
          }
        }

        activeDbLead = await this.db.getPendingLead();
      }

      console.log('[Orchestrator] Cycle finished.');
    } catch (error) {
      console.error(`[Orchestrator] Cycle Aborted:`, error.stack || error.message);
      await this.db.addLog('orchestrator', 'cycle_error', null, { message: error.message }, 'error');
    } finally {
      this.isRunning = false;
    }
  }

  async runWarmingCycle() {
    console.log('[Orchestrator] Running Lead Warming Cycle with Map Gap Analysis...');
    try {
      const health = await this.axios.get(`${this.closer.baseURL}/health`);
      if (!health.data.ready) {
        console.warn('[Orchestrator] WhatsApp not ready for warming. Skipping cycle.');
        return;
      }
    } catch (e) {
      console.warn('[Orchestrator] WhatsApp health check failed for warming cycle:', e.message);
      return;
    }

    const leads = await this.db.getScoutedLeads(50);
    
    // Sort leads by Map Gap priority (hot leads first)
    const sortedLeads = leads.sort((a, b) => {
      const priorityOrder = { hot: 0, warm: 1, cold: 2 };
      const aPriority = a.map_gap_analysis?.priority_level || a.priority || 'warm';
      const bPriority = b.map_gap_analysis?.priority_level || b.priority || 'warm';
      return (priorityOrder[aPriority] || 1) - (priorityOrder[bPriority] || 1);
    });

    // Limit to top 20 per cycle to maintain quality
    const topLeads = sortedLeads.slice(0, 20);

    console.log(`[Orchestrator] Warming ${topLeads.length} leads (sorted by Map Gap priority)...`);

    for (const lead of topLeads) {
      try {
        // Parse map gap analysis if stored as JSON string
        if (typeof lead.map_gap_analysis === 'string') {
          try {
            lead.mapGapAnalysis = JSON.parse(lead.map_gap_analysis);
          } catch (e) {
            lead.mapGapAnalysis = {};
          }
        } else {
          lead.mapGapAnalysis = lead.map_gap_analysis || {};
        }

        // Generate Map Gap marketing audit for hot leads
        if (lead.mapGapAnalysis?.priorityLevel === 'hot' || lead.mapGapAnalysis?.gapCount >= 3) {
          console.log(`[Orchestrator] Generating Map Gap Audit for HOT lead: ${lead.name}`);
          try {
            const auditReport = await this.marketingAudit.generateAudit(lead, this.db);
            lead.auditReport = auditReport;
          } catch (auditErr) {
            console.warn(`[Orchestrator] Audit generation failed for ${lead.name}: ${auditErr.message}`);
          }
        }

        // Use Map Gap style warm message
        const result = await this.closer.warmLead(lead);
        if (result === 'local_sent' || result === true) {
          await this.db.addLog('closer', 'warming_sent_mapgap', lead.place_id, { 
            name: lead.name, 
            priority: lead.mapGapAnalysis?.priorityLevel || 'unknown',
            conversionScore: lead.mapGapAnalysis?.scores?.conversionScore || 0,
            gapCount: lead.mapGapAnalysis?.gapCount || 0
          }, 'success');
          await this.db.updateLeadStatus(lead.place_id, 'warming_sent');
        } else if (result === 'skipped_invalid') {
          console.log(`[Orchestrator] Marking ${lead.name} as invalid (landline).`);
          await this.db.updateLeadStatus(lead.place_id, 'invalid', { last_error: 'Landline detected during warming' });
        }
        await new Promise(r => setTimeout(r, 10000)); // 10s throttle for Map Gap quality approach
      } catch (e) {
        console.error(`[Orchestrator] Warming failed for ${lead.name}:`, e.message);
      }
    }
    
    console.log('[Orchestrator] Map Gap Warming Cycle complete.');
  }

  async runPromotionCycle() {
    console.log('[Orchestrator] Running 19 SAR Promotion Cycle...');
    try {
      const health = await this.axios.get(`${this.closer.baseURL}/health`);
      if (!health.data.ready) {
        console.warn('[Orchestrator] WhatsApp not ready for promotion. Skipping cycle.');
        return;
      }
    } catch (e) {
      console.warn('[Orchestrator] WhatsApp health check failed for promotion cycle:', e.message);
      return;
    }

    const leads = await this.db.getPitchedLeads(30);
    for (const lead of leads) {
      if (!lead.is_validated && !process.env.PROMOTION_MODE === 'true') {
        console.log(`[Orchestrator] Skipping promotion for ${lead.name} (Not Validated)`);
        continue;
      }
      try {
        const result = await this.closer.sendPromotion(lead.name, lead.phone, lead.vercel_url, this.db);
        if (result === 'local_sent' || result === true) {
          await this.db.addLog('closer', 'promo_sent', lead.place_id, { name: lead.name }, 'success');
        } else if (result === 'skipped_invalid') {
          console.log(`[Orchestrator] Marking ${lead.name} as invalid (landline) during promo.`);
          await this.db.updateLeadStatus(lead.place_id, 'invalid', { last_error: 'Landline detected during promotion' });
        }
        await new Promise(r => setTimeout(r, 8000));
      } catch (e) {
        console.error(`[Orchestrator] Promo failed for ${lead.name}:`, e.message);
      }
    }
  }

  async runNudgeCycle() {
    console.log('[Orchestrator] Running Nudge Cycle (Follow-ups)...');
    try {
      const health = await this.axios.get(`${this.closer.baseURL}/health`);
      if (!health.data.ready) return;
    } catch (e) { return; }

    // Follow up with leads pitched > 48h ago who haven't responded
    const twoDaysAgo = new Date(Date.now() - (48 * 60 * 60 * 1000)).toISOString();
    const { data: leads } = await this.db.supabase
      .from('leads')
      .select('*')
      .eq('status', 'pitched')
      .not('vercel_url', 'is', null)
      .lt('updated_at', twoDaysAgo)
      .limit(10);

    if (!leads) return;

    for (const lead of leads) {
      try {
        const result = await this.closer.sendNudge(lead);
        if (result === true) {
          await this.db.updateLeadStatus(lead.place_id, 'pitched', { updated_at: new Date().toISOString() }); // Reset timer
        }
        await new Promise(r => setTimeout(r, 8000));
      } catch (e) {
        console.error(`[Orchestrator] Nudge failed for ${lead.name}:`, e.message);
        if (e.message.includes('Number not on WhatsApp')) {
            console.log(`[Orchestrator] Marking ${lead.name} as invalid permanently: Number not on WhatsApp.`);
            await this.db.updateLeadStatus(lead.place_id, 'invalid', { last_error: 'Number not on WhatsApp' });
        }
      }
    }
  }

  async runTrialReminderCycle() {
    console.log('[Orchestrator] Running Trial Reminder Cycle...');
    try {
      const health = await this.axios.get(`${this.closer.baseURL}/health`);
      if (!health.data.ready) return;
    } catch (e) { return; }

    // Fetch leads with an active trial that haven't been reminded for 2d or 1d before finish
    const { data: leads, error } = await this.db.supabase
      .from('leads')
      .select('*')
      .not('trial_start_date', 'is', null)
      .not('vercel_url', 'is', null)
      .or('reminded_2d_before.eq.false,reminded_1d_before.eq.false')
      .limit(20);

    if (error || !leads) return;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const lead of leads) {
      try {
        const trialStart = new Date(lead.trial_start_date).getTime();
        const daysSinceStart = (now - trialStart) / oneDayMs;

        // Reminder 1: 5 days after start (2 days left)
        if (daysSinceStart >= 5 && daysSinceStart < 6 && !lead.reminded_2d_before) {
          console.log(`[Orchestrator] Sending 2-day pre-expiry reminder to ${lead.name}`);
          await this.closer.sendTrialReminder(lead, 2);
          await this.db.supabase.from('leads').update({ reminded_2d_before: true }).eq('place_id', lead.place_id);
          await this.db.addLog('closer', 'trial_reminder_2d', lead.place_id, { name: lead.name }, 'success');
        } 
        // Reminder 2: 6 days after start (1 day left)
        else if (daysSinceStart >= 6 && daysSinceStart < 7 && !lead.reminded_1d_before) {
          console.log(`[Orchestrator] Sending 1-day pre-expiry reminder to ${lead.name}`);
          await this.closer.sendTrialReminder(lead, 1);
          await this.db.supabase.from('leads').update({ reminded_1d_before: true }).eq('place_id', lead.place_id);
          await this.db.addLog('closer', 'trial_reminder_1d', lead.place_id, { name: lead.name }, 'success');
        }

        await new Promise(r => setTimeout(r, 8000));
      } catch (e) {
        console.error(`[Orchestrator] Trial reminder failed for ${lead.name}:`, e.message);
      }
    }
  }

  async runNotificationCycle() {
    console.log('[Orchestrator] Running Google Compliance Notification Cycle (48h Rule)...');
    try {
      const req = { method: 'POST', query: { action: 'notification-worker' } };
      const res = {
        json: (data) => console.log(`[Orchestrator] Notification Worker:`, data),
        status: (code) => ({ json: (data) => console.log(`[Orchestrator] Notification Worker Error (${code}):`, data) })
      };
      await systemApi(req, res);
    } catch (e) {
      console.error(`[Orchestrator] Notification Cycle failed:`, e.message);
    }
  }

  /**
   * RETARGETING ENGINE — The core conversion driver.
   * Segments all existing certified leads and contacts them with the right message.
   * 
   * Groups:
   * A — Certified but never pitched → PITCH NOW
   * B — Pitched 48h-7d ago, no response → NUDGE with link
   * C — Pitched 7+ days ago with no conversion → 19 SAR PROMO
   * D — Interest confirmed, no payment after 48h → URGENCY CLOSE
   */
  async runRetargetingCycle() {
    console.log('\n[Orchestrator] 🎯 Starting Retargeting Cycle...');
    
    try {
      const health = await this.axios.get(`${this.closer.baseURL}/health`);
      if (!health.data.ready) {
        console.warn('[Orchestrator] WhatsApp not ready for retargeting. Skipping.');
        return;
      }
    } catch (e) {
      console.warn('[Orchestrator] WhatsApp health check failed for retargeting:', e.message);
      return;
    }

    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const antiSpamCutoff = new Date(now - 24 * hourMs).toISOString(); // Min 24h between contacts

    // ─── GROUP A: Certified + Published but never pitched ───────────────────
    try {
      const { data: groupA } = await this.db.supabase
        .from('leads')
        .select('*')
        .eq('is_certified', true)
        .eq('is_validated', true)   // ← GUARD: never pitch unvalidated (potentially 404) sites
        .eq('status', 'published')
        .not('vercel_url', 'is', null)
        .or(`last_retargeted_at.is.null,last_retargeted_at.lt.${antiSpamCutoff}`)
        .limit(5); // Throttle: max 5 per cycle

      if (groupA && groupA.length > 0) {
        console.log(`[Retargeting] Group A: ${groupA.length} certified leads ready to pitch`);
        for (const lead of groupA) {
          try {
            await this.closer.pitchLead(lead.name, lead.phone, lead.vercel_url, this.db);
            await this.db.supabase.from('leads').update({
              status: 'pitched',
              last_retargeted_at: new Date().toISOString(),
              retarget_count: (lead.retarget_count || 0) + 1,
              retarget_group: 'A_initial_pitch'
            }).eq('place_id', lead.place_id);
            await this.db.addLog('orchestrator', 'retarget_pitch_A', lead.place_id, { name: lead.name }, 'success');
            await new Promise(r => setTimeout(r, 15000)); // 15s throttle
          } catch (e) {
            console.error(`[Retargeting] Group A pitch failed for ${lead.name}:`, e.message);
            if (e.message.includes('Number not on WhatsApp')) {
              await this.db.updateLeadStatus(lead.place_id, 'invalid', { last_error: 'Number not on WhatsApp' });
            }
          }
        }
      }
    } catch (e) {
      console.error('[Retargeting] Group A error:', e.message);
    }

    // ─── GROUP B: Pitched 48h–7 days ago, no response → NUDGE ──────────────
    try {
      const fortyEightHoursAgo = new Date(now - 48 * hourMs).toISOString();
      const sevenDaysAgo = new Date(now - 7 * 24 * hourMs).toISOString();

      const { data: groupB } = await this.db.supabase
        .from('leads')
        .select('*')
        .eq('status', 'pitched')
        .eq('is_certified', true)
        .eq('is_validated', true)   // ← GUARD: don't nudge leads with broken sites
        .not('vercel_url', 'is', null)
        .lt('updated_at', fortyEightHoursAgo)
        .gt('updated_at', sevenDaysAgo)
        .or(`last_retargeted_at.is.null,last_retargeted_at.lt.${antiSpamCutoff}`)
        .limit(8);

      if (groupB && groupB.length > 0) {
        console.log(`[Retargeting] Group B: ${groupB.length} pitched leads to nudge`);
        for (const lead of groupB) {
          try {
            const msgEn = `Hi ${lead.name}! 💎 Just a friendly reminder — your custom website is live and waiting for you!\n\n🌐 Check it out: ${lead.vercel_url}\n\nYour 1-week FREE trial is active. Reply with any questions — we're here to help! 🚀`;
            const msgAr = `مرحباً ${lead.name}! 💎 تذكير ودي فقط — موقعك الإلكتروني المخصص جاهز وينتظرك!\n\n🌐 شاهده الآن: ${lead.vercel_url}\n\nتجربتك المجانية لمدة أسبوع نشطة. راسلنا بأي سؤال — نحن هنا للمساعدة! 🚀`;
            await this.closer.sendMessage(this.closer.formatPhoneNumber(lead.phone), `${msgEn}\n\n---\n\n${msgAr}`);
            await this.db.supabase.from('leads').update({
              last_retargeted_at: new Date().toISOString(),
              retarget_count: (lead.retarget_count || 0) + 1,
              retarget_group: 'B_nudge'
            }).eq('place_id', lead.place_id);
            await this.db.addLog('orchestrator', 'retarget_nudge_B', lead.place_id, { name: lead.name }, 'success');
            await new Promise(r => setTimeout(r, 10000));
          } catch (e) {
            console.error(`[Retargeting] Group B nudge failed for ${lead.name}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error('[Retargeting] Group B error:', e.message);
    }

    // ─── GROUP C: Pitched 7+ days ago, cold → 19 SAR PROMO ─────────────────
    try {
      const sevenDaysAgo = new Date(now - 7 * 24 * hourMs).toISOString();

      const { data: groupC } = await this.db.supabase
        .from('leads')
        .select('*')
        .eq('status', 'pitched')
        .eq('is_certified', true)
        .eq('is_validated', true)   // ← GUARD: don't send promo for broken sites
        .not('vercel_url', 'is', null)
        .lt('updated_at', sevenDaysAgo)
        .or(`last_retargeted_at.is.null,last_retargeted_at.lt.${antiSpamCutoff}`)
        .limit(5);

      if (groupC && groupC.length > 0) {
        console.log(`[Retargeting] Group C: ${groupC.length} cold leads for 19 SAR promo`);
        for (const lead of groupC) {
          try {
            await this.closer.sendPromotion(lead.name, lead.phone, lead.vercel_url, this.db);
            await this.db.supabase.from('leads').update({
              last_retargeted_at: new Date().toISOString(),
              retarget_count: (lead.retarget_count || 0) + 1,
              retarget_group: 'C_promo'
            }).eq('place_id', lead.place_id);
            await this.db.addLog('orchestrator', 'retarget_promo_C', lead.place_id, { name: lead.name }, 'success');
            await new Promise(r => setTimeout(r, 10000));
          } catch (e) {
            console.error(`[Retargeting] Group C promo failed for ${lead.name}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error('[Retargeting] Group C error:', e.message);
    }

    // ─── GROUP D: Interest confirmed, no payment after 48h → URGENCY CLOSE ──
    try {
      const fortyEightHoursAgo = new Date(now - 48 * hourMs).toISOString();

      const { data: groupD } = await this.db.supabase
        .from('leads')
        .select('*')
        .eq('status', 'interest_confirmed')
        .eq('is_validated', true)   // ← GUARD: don't urgency-close leads with broken sites
        .not('vercel_url', 'is', null)
        .or(`last_retargeted_at.is.null,last_retargeted_at.lt.${antiSpamCutoff}`)
        .limit(5);

      if (groupD && groupD.length > 0) {
        console.log(`[Retargeting] Group D: ${groupD.length} interested leads to urgency-close`);
        const portalUrl = 'https://ksaverified.com/customers';
        const stcPay = '+966 50 791 3514';
        for (const lead of groupD) {
          try {
            await this.closer.sendUrgencyClose(lead);
            await this.db.supabase.from('leads').update({
              last_retargeted_at: new Date().toISOString(),
              retarget_count: (lead.retarget_count || 0) + 1,
              retarget_group: 'D_urgency_close'
            }).eq('place_id', lead.place_id);
            await this.db.addLog('orchestrator', 'retarget_urgency_D', lead.place_id, { name: lead.name }, 'success');
            await new Promise(r => setTimeout(r, 10000));
          } catch (e) {
            console.error(`[Retargeting] Group D close failed for ${lead.name}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error('[Retargeting] Group D error:', e.message);
    }

    console.log('[Orchestrator] 🎯 Retargeting Cycle complete.');
  }

  startLoop() {
    const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES || '60', 10);
    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`[Orchestrator] Initializing KSA Verified Pipeline...`);
    
    // Start local IPC server for PaperClip Dashboard
    const IPC_PORT = 5001; 
    app.get('/trigger', async (req, res) => {
        console.log('[Orchestrator] Trigger received from Dashboard.');
        this.runPipeline().catch(err => console.error('[Orchestrator Trigger Error]', err));
        res.json({ success: true, message: 'Pipeline triggered' });
    });
    
    app.get('/status', (req, res) => {
        res.json({ isRunning: this.isRunning });
    });

    try {
        app.listen(IPC_PORT, () => {
            console.log(`[Orchestrator] IPC Server listening on port ${IPC_PORT}`);
        });
    } catch (e) {
        console.warn('[Orchestrator] IPC Server already running or port blocked.');
    }

    this.runPipeline();
    setInterval(() => this.runPipeline(), intervalMs);
  }
}

module.exports = Orchestrator;

if (require.main === module) {
  const main = new Orchestrator();
  main.startLoop();
}
