-- HARDENED SUPABASE RLS CONFIGURATION FOR KSA VERIFIED (VERSION 2 - FIXED RECURSION)
-- This script prevents "infinite recursion" by using SECURITY DEFINER helper functions.

-- 1. SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_phone()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT phone FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_auth_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  phone TEXT,
  name TEXT,
  role TEXT DEFAULT 'client',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can maintain all profiles" ON public.profiles;
CREATE POLICY "Admins can maintain all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin());

-- 4. Automatic Sync Function and Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'name',
    CASE WHEN new.email LIKE '%@client.ksaverified.com' THEN 'client' ELSE 'admin' END
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Backfill existing users
INSERT INTO public.profiles (id, phone, name, role)
SELECT 
  id, 
  raw_user_meta_data->>'phone', 
  raw_user_meta_data->>'name', 
  CASE WHEN email LIKE '%@client.ksaverified.com' THEN 'client' ELSE 'admin' END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- 6. Hardened RLS for LEADS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on leads" ON leads;
CREATE POLICY "Admins can do everything on leads" 
ON leads FOR ALL 
TO authenticated 
USING (public.is_admin());

DROP POLICY IF EXISTS "Clients can view their own leads" ON leads;
CREATE POLICY "Clients can view their own leads" 
ON leads FOR SELECT 
TO authenticated 
USING (
  phone ILIKE '%' || RIGHT(REPLACE(public.get_auth_phone(), ' ', ''), 9) || '%'
);

-- 7. Hardened RLS for CHAT_LOGS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on chat_logs" ON chat_logs;
CREATE POLICY "Admins can do everything on chat_logs" 
ON chat_logs FOR ALL 
TO authenticated 
USING (public.is_admin());

DROP POLICY IF EXISTS "Clients can view their own chat_logs" ON chat_logs;
CREATE POLICY "Clients can view their own chat_logs" 
ON chat_logs FOR SELECT 
TO authenticated 
USING (
  phone ILIKE '%' || RIGHT(REPLACE(public.get_auth_phone(), ' ', ''), 9) || '%'
);

-- 8. Admin-only Tables
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins only access logs" ON logs;
CREATE POLICY "Admins only access logs" ON logs FOR ALL TO authenticated 
USING (public.is_admin());

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins only access settings" ON settings;
CREATE POLICY "Admins only access settings" ON settings FOR ALL TO authenticated 
USING (public.is_admin());
