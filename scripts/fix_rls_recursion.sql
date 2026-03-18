-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- This script replaces recursive subqueries with SECURITY DEFINER functions.

-- 1. SECURITY DEFINER HELPERS
-- These functions run with the privileges of the creator (postgres) 
-- and can bypass RLS to check roles/phone numbers safely.

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_phone()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT phone FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_auth_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. UPDATE PROFILES POLICIES
DROP POLICY IF EXISTS "Admins can maintain all profiles" ON public.profiles;
CREATE POLICY "Admins can maintain all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin());

-- 3. UPDATE LEADS POLICIES
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

-- 4. UPDATE CHAT_LOGS POLICIES
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

-- 5. UPDATE OTHER TABLES
DROP POLICY IF EXISTS "Admins only access logs" ON logs;
CREATE POLICY "Admins only access logs" ON logs FOR ALL TO authenticated 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only access settings" ON settings;
CREATE POLICY "Admins only access settings" ON settings FOR ALL TO authenticated 
USING (public.is_admin());
