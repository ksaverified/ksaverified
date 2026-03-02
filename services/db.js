const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!this.supabaseUrl || !this.supabaseKey) {
            throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY missing in environment variables.');
        }

        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }

    /**
     * Upsert a lead into the database. If it exists, it will be updated.
     * @param {Object} lead - The lead object (placeId, name, phone, address, location)
     */
    async upsertLead(lead) {
        const { data, error } = await this.supabase
            .from('leads')
            .upsert({
                place_id: lead.placeId,
                name: lead.name,
                phone: lead.phone,
                address: lead.address,
                updated_at: new Date().toISOString()
            }, { onConflict: 'place_id' })
            .select();

        if (error) {
            console.error(`[DB] Error upserting lead ${lead.placeId}:`, error.message);
            throw error;
        }
        return data[0];
    }

    /**
     * Finds a lead by place_id
     * @param {string} placeId
     * @returns {Promise<Object|null>} The lead or null if not found
     */
    async getLead(placeId) {
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
    }

    /**
     * Updates the status of a lead and optionally attaches extra data (like HTML or URLs)
     * @param {string} placeId
     * @param {string} newStatus - The new status (scouted, created, published, pitched, error)
     * @param {Object} extraData - Optional. E.g. { website_html: '<html>...', vercel_url: 'https...' }
     */
    async updateLeadStatus(placeId, newStatus, extraData = {}) {
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

        const { error } = await this.supabase
            .from('logs')
            .insert(payload);

        if (error) {
            console.error(`[DB] Failed to insert log for ${agent}:`, error.message);
            // Optionally throw or just fail silently to not block the pipeline
        }
    }
}

module.exports = DatabaseService;
