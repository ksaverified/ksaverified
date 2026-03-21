const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        // Use Service Role Key for server-side operations (bypasses RLS for backend agents)
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!this.supabaseUrl || !this.supabaseKey) {
            throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in environment variables.');
        }

        // Increase timeout for fetch to 60 seconds (Node 22 default is lower/stricter)
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
            auth: {
                persistSession: false
            },
            global: {
                fetch: (url, options) => {
                    return fetch(url, { 
                        ...options, 
                        signal: AbortSignal.timeout(60000) 
                    });
                }
            }
        });
    }

    /**
     * Helper to retry DB operations
     */
    async withRetry(operation, maxRetries = 3, delay = 2000) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (err) {
                lastError = err;
                const isNetworkError = err.message.includes('fetch failed') || 
                                     err.message.includes('Timeout') || 
                                     err.code === 'UND_ERR_HEADERS_TIMEOUT';
                
                if (isNetworkError && i < maxRetries - 1) {
                    console.warn(`[DB] Retry ${i+1}/${maxRetries} after error: ${err.message}`);
                    await new Promise(r => setTimeout(r, delay * (i + 1)));
                    continue;
                }
                throw err;
            }
        }
    }

    /**
     * Upsert a lead into the database. If it exists, it will be updated.
     * @param {Object} lead - The lead object (placeId, name, phone, address, location)
     */
    async upsertLead(lead) {
        return this.withRetry(async () => {
            let slug = lead.name ? lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'business';
            if (slug.endsWith('-')) slug = slug.slice(0, -1);
            if (slug.startsWith('-')) slug = slug.slice(1);
            
            // Append short Place ID to ensure uniqueness for common names
            const shortId = lead.placeId ? lead.placeId.slice(-6) : Math.random().toString(36).substring(7);
            slug = `${slug}-${shortId}`;

            const { data, error } = await this.supabase
                .from('leads')
                .upsert({
                    place_id: lead.placeId,
                    name: lead.name,
                    slug: slug,
                    phone: lead.phone,
                    address: lead.address,
                    lat: lead.location?.lat || null,
                    lng: lead.location?.lng || null,
                    photos: lead.photos || [],
                    updated_at: new Date().toISOString()
                }, { onConflict: 'place_id' })
                .select();

            if (error) {
                console.error(`[DB] Error upserting lead ${lead.placeId}:`, error.message);
                throw error;
            }
            return data[0];
        });
    }

    /**
     * Finds a lead by place_id
     * @param {string} placeId
     * @returns {Promise<Object|null>} The lead or null if not found
     */
    async getLead(placeId) {
        return this.withRetry(async () => {
            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .eq('place_id', placeId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is multiple/no rows returned (no rows in this case)
                console.error(`[DB] Error fetching lead ${placeId}:`, error.message);
                throw error;
            }
            return data || null;
        });
    }

    /**
     * Fetches the next available lead that needs processing.
     * Includes leads that are 'scouted' (new) or interrupted in intermediate states.
     */
    async getPendingLead() {
        return this.withRetry(async () => {
            const { data, error } = await this.supabase
                .from('leads')
                .select('place_id, name, phone, address, lat, lng, photos, website_html, vercel_url, status, retry_count, updated_at')
                .in('status', ['interest_confirmed', 'scouted', 'warming_sent', 'warmed', 'created', 'retouched'])
                .or('retry_count.lt.3,retry_count.is.null')
                .order('status', { ascending: true }) // 'interest_confirmed' comes before 'scouted' alphabetically/logically
                .order('updated_at', { ascending: true })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error(`[DB] Error fetching pending lead:`, error.message);
                throw error;
            }
            return data || null;
        });
    }

    /**
     * Updates the status of a lead and optionally attaches extra data (like HTML or URLs)
     * @param {string} placeId
     * @param {string} newStatus - The new status (scouted, created, published, pitched, error)
     * @param {Object} extraData - Optional. E.g. { website_html: '<html>...', vercel_url: 'https...' }
     */
    async updateLeadStatus(placeId, newStatus, extraData = {}) {
        return this.withRetry(async () => {
            const updatePayload = {
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...extraData
            };

            const { data, error } = await this.supabase
                .from('leads')
                .update(updatePayload)
                .eq('place_id', placeId)
                .select();

            if (error) {
                console.error(`[DB] Error updating status for lead ${placeId}:`, error.message);
                throw error;
            }

            return data[0];
        });
    }

    /**
     * Fetch a setting from the settings table
     * @param {string} key
     * @returns {Promise<any>} The parsed JSON value of the setting
     */
    async getSetting(key) {
        const { data, error } = await this.supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            console.error(`[DB] Error fetching setting ${key}:`, error.message);
            throw error;
        }
        return data.value;
    }

    /**
     * Insert a log entry into the logs table
     * @param {string} agent - The name of the agent (e.g., 'scout', 'creator')
     * @param {string} action - Action performed
     * @param {string|null} placeId - Optional place_id being worked on
     * @param {Object} details - Optional JSON object with details
     * @param {string} status - 'info', 'success', 'warning', 'error'
     */
    async addLog(agent, action, placeId = null, details = {}, status = 'info') {
        const payload = {
            agent,
            action,
            place_id: placeId,
            details,
            status
        };

        return this.withRetry(async () => {
            const { error } = await this.supabase
                .from('logs')
                .insert(payload);

            if (error) {
                console.error(`[DB] Failed to insert log for ${agent}:`, error.message);
                // Optionally throw or just fail silently to not block the pipeline
            }
        }).catch(() => {}); // Log errors shouldn't crash the app
    }

    /**
     * Deletes logs older than a specified number of days to prevent
     * the Supabase table from bloating and hitting the 500MB free tier limit.
     */
    async cleanupOldLogs(days = 14) {
        return this.withRetry(async () => {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - days);
            
            const { error } = await this.supabase
                .from('logs')
                .delete()
                .lt('created_at', targetDate.toISOString());

            if (error) {
                console.error(`[DB] Failed to clean up active logs:`, error.message);
            } else {
                console.log(`[DB] Successfully pruned logs older than ${days} days.`);
            }
        });
    }

    /**
     * Find a lead using an Ultramsg formatted phone number (e.g. 966501234567@c.us)
     */
    async getLeadByPhone(ultramsgPhone) {
        const cleanPhone = ultramsgPhone.replace(/\D/g, '');
        if (cleanPhone.length < 7) return null;

        const last7 = cleanPhone.slice(-7);

        // Use DB-side filtering: only pull rows where the phone column contains the last 7 digits.
        // This avoids a full table scan and is safe because 7 trailing digits uniquely identify
        // Saudi mobile numbers regardless of prefix formatting (+966 / 0 / bare).
        const { data, error } = await this.supabase
            .from('leads')
            .select('*')
            .ilike('phone', `%${last7}%`)
            .limit(5); // small safety cap

        if (error) {
            console.error('[DB] Error searching for lead by phone:', error.message);
            return null;
        }

        if (!data || data.length === 0) return null;

        // Do the precise in-memory check on the small result set
        for (const lead of data) {
            if (lead.phone) {
                const dbCleanPhone = lead.phone.replace(/\D/g, '');
                if (dbCleanPhone.includes(last7) || cleanPhone.includes(dbCleanPhone)) {
                    return lead;
                }
            }
        }

        return null;
    }

    /**
     * Save an inbound chat interaction
     */
    async saveChatLog(placeId, phone, messageIn, messageOut, status = 'pending', translatedMessage = null, whatsappMsgId = null) {
        const payload = {
            place_id: placeId,
            phone: phone,
            message_in: messageIn,
            message_out: messageOut,
            status: status,
            translated_message: translatedMessage,
            whatsapp_msg_id: whatsappMsgId
        };
        
        const { error } = await this.supabase
            .from('chat_logs')
            .upsert(payload, { onConflict: 'whatsapp_msg_id', ignoreDuplicates: true });

        if (error) {
            console.error('[DB] Error saving chat log:', error.message);
        }
    }

    /**
     * Save only an inbound message (used by webhook)
     */
    async saveInboundChatLog(placeId, phone, messageIn, translatedMessage = null, whatsappMsgId = null) {
        const payload = {
            place_id: placeId,
            phone: phone,
            message_in: messageIn,
            message_out: null,
            status: 'pending',
            translated_message: translatedMessage,
            whatsapp_msg_id: whatsappMsgId
        };

        const { error } = await this.supabase
            .from('chat_logs')
            .upsert(payload, { onConflict: 'whatsapp_msg_id', ignoreDuplicates: true });

        if (error) {
            console.error('[DB] Error saving inbound chat log:', error.message);
        }
    }

    /**
     * Get approved or corrected logs to train the AI
     */
    async getTrainingLogs() {
        const { data, error } = await this.supabase
            .from('chat_logs')
            .select('*')
            .in('status', ['approved', 'corrected'])
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) {
            console.error('[DB] Error fetching training logs:', error.message);
            return [];
        }
        return data;
    }

    /**
     * Fetch the most recent chat log for a given phone number.
     * Used for deduplication against webhook events.
     */
    async getLatestChatLog(phone) {
        const { data, error } = await this.supabase
            .from('chat_logs')
            .select('*')
            .eq('phone', phone)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[DB] Error fetching latest chat log:', error.message);
            return null;
        }
        return data || null;
    }

    /**
     * Save a unilateral outbound message (e.g. from manual admin typing or webhook)
     */
    async saveOutboundChatLog(placeId, phone, messageOut, whatsappMsgId = null) {
        const payload = {
            place_id: placeId,
            phone: phone,
            message_in: null,
            message_out: messageOut,
            status: 'approved', // Automatically "approved" so it bypasses AI Answers queue but shows in loop
            whatsapp_msg_id: whatsappMsgId
        };

        const { error } = await this.supabase
            .from('chat_logs')
            .upsert(payload, { onConflict: 'whatsapp_msg_id', ignoreDuplicates: true });

        if (error) {
            console.error('[DB] Error saving outbound chat log:', error.message);
        }
    }

    /**
     * Increment a numeric counter column on a lead
     */
    async incrementLeadMetric(placeId, column) {
        // Fetch current value first
        const { data: lead, error: fetchError } = await this.supabase
            .from('leads')
            .select(column)
            .eq('place_id', placeId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error(`[DB] Error fetching metric for increment:`, fetchError.message);
            return;
        }

        const currentValue = lead ? lead[column] : 0;
        const baseValue = typeof currentValue === 'number' ? currentValue : 0;

        const updatePayload = {};
        updatePayload[column] = baseValue + 1;

        const { error: updateError } = await this.supabase
            .from('leads')
            .update(updatePayload)
            .eq('place_id', placeId);

        if (updateError) {
            console.error(`[DB] Error incrementing metric:`, updateError.message);
        }
    }

    /**
     * Increments the retry count for a lead and logs the last error
     */
    async incrementRetryCount(placeId, errorMessage) {
        // Fetch current retry count
        const { data: lead, error: fetchError } = await this.supabase
            .from('leads')
            .select('retry_count')
            .eq('place_id', placeId)
            .single();

        const currentRetry = lead ? (lead.retry_count || 0) : 0;

        const { error: updateError } = await this.supabase
            .from('leads')
            .update({
                retry_count: currentRetry + 1,
                last_error: errorMessage,
                updated_at: new Date().toISOString()
            })
            .eq('place_id', placeId);

        if (updateError) {
            console.error(`[DB] Error incrementing retry count for ${placeId}:`, updateError.message);
        }
    }

    /**
     * Fetch leads in 'scouted' status that haven't been 'warmed' yet
     * We check the 'logs' table to see if a 'warming_sent' action exists for this place_id.
     */
    async getScoutedLeads(limit = 10) {
        // Single query: get scouted leads that have NO 'warming_sent' log entry.
        // Uses a Postgres NOT EXISTS subquery via PostgREST RPC to avoid N+1 round-trips.
        const { data, error } = await this.supabase.rpc('get_scouted_leads_without_warming', { p_limit: limit });

        if (error) {
            // Graceful fallback to the legacy approach if the RPC doesn't exist yet
            console.warn('[DB] RPC get_scouted_leads_without_warming failed, falling back:', error.message);
            return this._getScoutedLeadsFallback(limit);
        }
        return data || [];
    }

    /**
     * Record a login event for a lead by phone number
     */
    async recordLogin(phone) {
        // First get the current counts
        const { data: lead, error: fetchError } = await this.supabase
            .from('leads')
            .select('login_count')
            .eq('phone', phone)
            .single();

        if (fetchError) {
            console.error('[DB] Error fetching lead for login record:', fetchError.message);
            return;
        }

        const newCount = (lead.login_count || 0) + 1;

        const { error: updateError } = await this.supabase
            .from('leads')
            .update({
                login_count: newCount,
                last_login_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('phone', phone);

        if (updateError) {
            console.error('[DB] Error recording login for lead:', updateError.message);
        } else {
            console.log(`[DB] Recorded login for ${phone}. Total: ${newCount}`);
        }
    }

    /** Fallback N+1 approach (used only if RPC isn't deployed yet) */
    async _getScoutedLeadsFallback(limit = 10) {
        const { data: leads, error } = await this.supabase
            .from('leads')
            .select('place_id, name, phone, status, updated_at')
            .eq('status', 'scouted')
            .order('updated_at', { ascending: true })
            .limit(limit * 3); // over-fetch to compensate for filtering

        if (error) throw error;

        const finalLeads = [];
        for (const lead of leads || []) {
            const { data: logs } = await this.supabase
                .from('logs')
                .select('id')
                .eq('place_id', lead.place_id)
                .eq('action', 'warming_sent')
                .limit(1);

            if (!logs || logs.length === 0) {
                finalLeads.push(lead);
            }
            if (finalLeads.length >= limit) break;
        }
        return finalLeads;
    }

    /**
     * Fetch leads in 'pitched' status that haven't received the 19 SAR promo yet
     */
    async getPitchedLeads(limit = 10) {
        // Single query: get pitched leads that have NO 'promo_sent' log entry.
        const { data, error } = await this.supabase.rpc('get_pitched_leads_without_promo', { p_limit: limit });

        if (error) {
            console.warn('[DB] RPC get_pitched_leads_without_promo failed, falling back:', error.message);
            return this._getPitchedLeadsFallback(limit);
        }
        return data || [];
    }

    /** Fallback N+1 approach (used only if RPC isn't deployed yet) */
    async _getPitchedLeadsFallback(limit = 10) {
        const { data: leads, error } = await this.supabase
            .from('leads')
            .select('place_id, name, phone, status, vercel_url, updated_at')
            .eq('status', 'pitched')
            .order('updated_at', { ascending: true })
            .limit(limit * 3);

        if (error) throw error;

        const finalLeads = [];
        for (const lead of leads || []) {
            const { data: logs } = await this.supabase
                .from('logs')
                .select('id')
                .eq('place_id', lead.place_id)
                .eq('action', 'promo_sent')
                .limit(1);

            if (!logs || logs.length === 0) {
                finalLeads.push(lead);
            }
            if (finalLeads.length >= limit) break;
        }
        return finalLeads;
    }
}

module.exports = DatabaseService;
