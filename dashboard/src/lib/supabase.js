import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-ozkmsuodpghtsqcmpsmk-auth-token', // Explicitly set storage key to help with lock contention
        storage: window.localStorage
    },
    global: {
        fetch: async (url, options) => {
            try {
                const response = await fetch(url, { 
                    ...options, 
                    signal: AbortSignal.timeout(60000) 
                });
                
                if (!response.ok && response.status >= 500) {
                    console.warn(`[Supabase Fetch] Server error ${response.status} on ${url}`);
                }
                
                return response;
            } catch (err) {
                if (err.name === 'TimeoutError') {
                    console.error(`[Supabase Fetch] Request timed out for ${url}`);
                } else {
                    console.error(`[Supabase Fetch] Network error for ${url}:`, err.message);
                }
                throw err;
            }
        }
    }
});
