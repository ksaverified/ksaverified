require('dotenv').config();

const CreatorAgent = require('./agents/creator');
const RetoucherAgent = require('./agents/retoucher');
const PublisherAgent = require('./agents/publisher');
const CloserAgent = require('./agents/closer');
const BillerAgent = require('./agents/biller');
const DatabaseService = require('./services/db');
const ScoutAgent = require('./agents/scout');
const AuditorAgent = require('./agents/auditor');
const systemApi = require('./api/system');

class Orchestrator {
  constructor() {
    this.scout = new ScoutAgent();
    this.creator = new CreatorAgent();
    this.retoucher = new RetoucherAgent();
    this.publisher = new PublisherAgent();
    this.closer = new CloserAgent();
    this.biller = new BillerAgent();
    this.auditor = new AuditorAgent();
    this.db = new DatabaseService();
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

    try {
      // Step 0: Check Subscriptions
      await this.biller.checkSubscriptions();

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
            .in('status', ['interest_confirmed', 'scouted', 'warming_sent', 'warmed', 'created', 'retouched', 'published'])
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
          // 3. Health Check
          if (activeDbLead.status !== 'pitched') {
            const health = await this.axios.get('http://localhost:8081/health');
            if (!health.data.ready) throw new Error('WhatsApp not ready');
          }

          let currentHtml = activeDbLead.website_html || '';
          let vercelUrl = activeDbLead.vercel_url || '';

          // Self-Healing: If a lead slipped into advanced pipeline stages without HTML, roll it back
          if (!currentHtml && ['created', 'retouched', 'published', 'pitched'].includes(activeDbLead.status)) {
              console.warn(`[Orchestrator] 🛑 Lead ${activeLead.name} status is '${activeDbLead.status}' but missing HTML. Rolling back to 'scouted'.`);
              await this.db.addLog('orchestrator', 'rollback_to_scouted', activeLead.place_id, { reason: 'Missing HTML' }, 'warning');
              await this.db.updateLeadStatus(activeLead.place_id, 'scouted', { website_html: null, vercel_url: null, is_validated: false });
              activeDbLead.status = 'scouted';
          }

          if (activeDbLead.status === 'scouted' || activeDbLead.status === 'warmed') {
            await this.db.addLog('creator', 'generation_started', activeLead.place_id, { name: activeLead.name }, 'info');
            currentHtml = await this.creator.createWebsite(activeLead, this.db);
            
            if (!currentHtml || currentHtml.length < 500) {
                 throw new Error("Generated HTML is empty or dangerously short");
            }
            
            await this.db.updateLeadStatus(activeLead.place_id, 'created', { website_html: currentHtml });
            activeDbLead.status = 'created';
          }

          if (activeDbLead.status === 'scouted' || activeDbLead.status === 'warmed' || activeDbLead.status === 'created') {
            await this.db.addLog('retoucher', 'audit_started', activeLead.place_id, { name: activeLead.name }, 'info');
            currentHtml = await this.retoucher.retouchWebsite(currentHtml, activeLead);
            await this.db.updateLeadStatus(activeLead.place_id, 'retouched', { website_html: currentHtml });
          }
          
          if (activeDbLead.status === 'scouted' || activeDbLead.status === 'warmed' || activeDbLead.status === 'created' || activeDbLead.status === 'retouched') {
            await this.db.addLog('auditor', 'visual_audit_started', activeLead.place_id, { name: activeLead.name }, 'info');
            const auditReport = await this.auditor.audit(currentHtml, activeLead.slug);
            await this.db.addLog('auditor', 'visual_audit_completed', activeLead.place_id, auditReport, 'info');
            
            if (auditReport.brokenImages.length > 0) {
              console.log(`[Orchestrator] Auditor found ${auditReport.brokenImages.length} broken images. Requiring additional retouching...`);
              // Mark for more retouching if needed, but for now we just log it.
            }
          }

          if (activeDbLead.status === 'scouted' || activeDbLead.status === 'warmed' || activeDbLead.status === 'created' || activeDbLead.status === 'retouched') {
            await this.db.addLog('publisher', 'deployment_started', activeLead.placeId, {}, 'info');
            vercelUrl = await this.publisher.handlePublish(activeLead.placeId, activeLead.slug);
            await this.db.updateLeadStatus(activeLead.placeId, 'published', { vercel_url: vercelUrl });
          }

          if (activeDbLead.status !== 'pitched') {
            if (!activeDbLead.is_validated) {
              console.log(`[Orchestrator] 🛑 Skipping pitch for ${activeLead.name}. Status: Published but NOT VALIDATED.`);
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
    console.log('[Orchestrator] Running Lead Warming Cycle...');
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

    const leads = await this.db.getScoutedLeads(30);
    for (const lead of leads) {
      if (!lead.is_validated) {
        console.log(`[Orchestrator] Skipping warming for ${lead.name} (Not Validated)`);
        continue;
      }
      try {
        const result = await this.closer.warmLead(lead.name, lead.phone);
        if (result === 'local_sent' || result === true) {
          await this.db.addLog('closer', 'warming_sent', lead.place_id, { name: lead.name }, 'success');
          await this.db.updateLeadStatus(lead.place_id, 'warming_sent');
        } else if (result === 'skipped_invalid') {
          console.log(`[Orchestrator] Marking ${lead.name} as invalid (landline).`);
          await this.db.updateLeadStatus(lead.place_id, 'invalid', { last_error: 'Landline detected during warming' });
        }
        await new Promise(r => setTimeout(r, 8000));
      } catch (e) {
        console.error(`[Orchestrator] Warming failed for ${lead.name}:`, e.message);
      }
    }
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
      if (!lead.is_validated) {
        console.log(`[Orchestrator] Skipping promotion for ${lead.name} (Not Validated)`);
        continue;
      }
      try {
        const result = await this.closer.sendPromotion(lead.name, lead.phone, lead.vercel_url);
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
      .lt('updated_at', twoDaysAgo)
      .limit(10);

    if (!leads) return;

    for (const lead of leads) {
      try {
        const message = `Hi ${lead.name}! 💎 Just checking in—did you have a chance to look at your new website preview? {previewUrl}\n\nYour 1-week FREE trial is running! Let me know if you have any questions.`.replace('{previewUrl}', lead.vercel_url);
        await this.closer.sendMessage(lead.phone, message);
        await this.db.saveOutboundChatLog(lead.place_id, lead.phone, message);
        await this.db.updateLeadStatus(lead.place_id, 'pitched', { updated_at: new Date().toISOString() }); // Reset timer
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
      // Create a mock req/res for the API handler
      const req = { query: { action: 'notification-worker' } };
      const res = {
        json: (data) => console.log(`[Orchestrator] Notification Worker:`, data),
        status: (code) => ({ json: (data) => console.log(`[Orchestrator] Notification Worker Error (${code}):`, data) })
      };
      await systemApi(req, res);
    } catch (e) {
      console.error(`[Orchestrator] Notification Cycle failed:`, e.message);
    }
  }

  startLoop() {
    const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES || '60', 10);
    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`[Orchestrator] Initializing KSA Verified Pipeline...`);
    this.runPipeline();
    setInterval(() => this.runPipeline(), intervalMs);
  }
}

module.exports = Orchestrator;

if (require.main === module) {
  const main = new Orchestrator();
  main.startLoop();
}
