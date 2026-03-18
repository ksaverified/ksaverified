const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const DatabaseService = require('../services/db');
require('dotenv').config();

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phone } = request.body;
        if (!phone) {
            return response.status(400).json({ error: 'Phone number is required.' });
        }

        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!adminKey) {
            console.error('[Client-Auth] Missing SUPABASE_SERVICE_ROLE_KEY in .env');
            return response.status(500).json({ error: 'System configuration error. Admin role key missing.' });
        }

        // 1. Verify that this phone number belongs to a known lead
        const db = new DatabaseService();
        const lead = await db.getLeadByPhone(phone);

        if (!lead) {
            return response.status(404).json({ error: 'This phone number is not registered in our system.' });
        }

        // 2. Generate a 6-digit PIN string
        const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const proxyEmail = `${phone.replace(/\D/g, '')}@client.ksaverified.com`;

        // 3. Initialize Supabase Admin client
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 4. Create or Update the user
        // We attempt to create the user first. If they exist, we catch the "already registered" error and update.
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: proxyEmail,
            password: generatedPassword,
            email_confirm: true,
            user_metadata: { phone: phone, name: lead.name }
        });

        if (createError) {
            // If the user already exists, we catch the "already registered" error and update.
            if (createError.message.includes('already been registered') || createError.status === 422) {
                console.log(`[Client-Auth] User ${proxyEmail} already exists, recovering ID...`);

                // Use generateLink as a direct way to get user object (failsafe against listUsers pagination)
                const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: proxyEmail
                });

                if (linkError || !linkData?.user) {
                    throw new Error(`User exists but recovery failed: ${linkError?.message || 'No user data'}`);
                }

                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    linkData.user.id,
                    { password: generatedPassword }
                );

                if (updateError) throw updateError;
                console.log(`[Client-Auth] Updated password for: ${phone} (UID: ${linkData.user.id})`);
            } else {
                throw createError;
            }
        } else {
            console.log(`[Client-Auth] Created new client: ${phone}`);
        }

        // 5. Send the password via Local WhatsApp Service
        // Prioritize WHATSAPP_SERVICE_URL from env, default to 127.0.0.1:8081 for Docker local
        const whatsappServiceUrl = process.env.WHATSAPP_SERVICE_URL || 'http://127.0.0.1:8081';
        const message = `Hello ${lead.name}! 💎\n\nYour temporary password for the KSA Verified Client Dashboard is: *${generatedPassword}*\n\nPlease log in using your phone number to manage your website.\n\nPortal: https://ksaverified.com/client-dashboard`;

        try {
            console.log(`[Client-Auth] Sending password to ${phone} via ${whatsappServiceUrl}`);
            const waResponse = await axios.post(`${whatsappServiceUrl}/send`, {
                to: phone,
                message: message
            });
            console.log(`[Client-Auth] Sent password via local service to ${phone}`, waResponse.data);
        } catch (waError) {
            console.error(`[Client-Auth] WhatsApp Service Connection Failed:`, {
                url: whatsappServiceUrl,
                error: waError.message,
                code: waError.code,
                response: waError.response?.data
            });
            const errorDetail = waError.response?.data?.error || waError.message;
            return response.status(500).json({ 
                error: `WhatsApp Error: ${errorDetail}`,
                help: `Ensure your local WhatsApp Docker container is running on port 8081.`
            });
        }

        return response.status(200).json({ success: true, message: 'Password sent successfully.' });

    } catch (error) {
        console.error('[Client-Auth Error]', error.message);
        return response.status(500).json({ success: false, error: error.message });
    }
}
