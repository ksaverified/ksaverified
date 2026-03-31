-- Fix RLS policies for backend agent operations
-- Run this in the Supabase SQL Editor

-- Allow service role to insert/update logs
CREATE POLICY IF NOT EXISTS "Service role full access to logs" ON logs
  FOR ALL USING (true) WITH CHECK (true);

-- Allow service role to insert/update leads
CREATE POLICY IF NOT EXISTS "Service role full access to leads" ON leads
  FOR ALL USING (true) WITH CHECK (true);

-- Allow service role to insert/update chat_logs
CREATE POLICY IF NOT EXISTS "Service role full access to chat_logs" ON chat_logs
  FOR ALL USING (true) WITH CHECK (true);
