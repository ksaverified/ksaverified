-- SUPABASE RLS CONFIGURATION FOR KSA VERIFIED

-- 1. Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies for LEADS
DROP POLICY IF EXISTS "Admins can do everything on leads" ON leads;
CREATE POLICY "Admins can do everything on leads" 
ON leads FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' NOT LIKE '%@client.ksaverified.com');

DROP POLICY IF EXISTS "Clients can view their own leads" ON leads;
CREATE POLICY "Clients can view their own leads" 
ON leads FOR SELECT 
TO authenticated 
USING (
  -- Match based on the phone number stored in user metadata
  phone ILIKE '%' || RIGHT(REPLACE(auth.jwt() -> 'user_metadata' ->> 'phone', ' ', ''), 9) || '%'
);

-- 3. Define Policies for CHAT_LOGS
DROP POLICY IF EXISTS "Admins can do everything on chat_logs" ON chat_logs;
CREATE POLICY "Admins can do everything on chat_logs" 
ON chat_logs FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' NOT LIKE '%@client.ksaverified.com');

DROP POLICY IF EXISTS "Clients can view their own chat_logs" ON chat_logs;
CREATE POLICY "Clients can view their own chat_logs" 
ON chat_logs FOR SELECT 
TO authenticated 
USING (
  phone ILIKE '%' || RIGHT(REPLACE(auth.jwt() -> 'user_metadata' ->> 'phone', ' ', ''), 9) || '%'
);

-- 4. Define Policies for LOGS (Admin only)
DROP POLICY IF EXISTS "Admins can do everything on logs" ON logs;
CREATE POLICY "Admins can do everything on logs" 
ON logs FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' NOT LIKE '%@client.ksaverified.com');

-- 5. Define Policies for SETTINGS (Admin only)
DROP POLICY IF EXISTS "Admins can do everything on settings" ON settings;
CREATE POLICY "Admins can do everything on settings" 
ON settings FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' NOT LIKE '%@client.ksaverified.com');
