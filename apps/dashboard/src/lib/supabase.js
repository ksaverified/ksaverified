import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing credentials — check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const customFetch = async (url, options) => {
    try {
        const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(60000)
        });
        if (!response.ok && response.status >= 500) {
            console.warn(`[Supabase] Server error ${response.status} on ${url}`);
        }
        return response;
    } catch (err) {
        if (err.name === 'TimeoutError') {
            console.error(`[Supabase] Request timed out for ${url}`);
        } else {
            console.error(`[Supabase] Network error for ${url}:`, err.message);
        }
        throw err;
    }
};

// ── Singleton: anon/user client ───────────────────────────────────────────────
// Stored at module level so every import shares the EXACT same instance,
// preventing the "Multiple GoTrueClient instances detected" browser warning.
let _supabase = null;
function getSupabaseClient() {
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'sb-hopuephsxsmegznvrzgv-auth-token',
                storage: window.localStorage
            },
            global: { fetch: customFetch }
        });
    }
    return _supabase;
}

export const supabase = getSupabaseClient();

// ── Singleton: service-role admin client ──────────────────────────────────────
// Uses a distinct storage key and has auth management fully disabled so it does
// NOT interact with the browser session — no conflicting GoTrueClient instance.
let _supabaseAdmin = null;
function getSupabaseAdminClient() {
    if (!_supabaseAdmin) {
        if (supabaseServiceKey) {
            _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    storageKey: 'sb-hopuephsxsmegznvrzgv-admin-token'
                },
                global: { fetch: customFetch }
            });
        } else {
            // Graceful fallback: reuse the anon singleton if no service key
            _supabaseAdmin = supabase;
        }
    }
    return _supabaseAdmin;
}

export const supabaseAdmin = getSupabaseAdminClient();
