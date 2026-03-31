require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Old Supabase Credentials
const OLD_SUPABASE_URL = 'https://ozkmsuodpghtsqcmpsmk.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a21zdW9kcGdodHNxY21wc21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2MjgzNCwiZXhwIjoyMDg4MDM4ODM0fQ.5SuOB9t6zsGgfIk7IL8IKvG-izsDU5RdkSLGVOPmBBA';

const oldDb = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

async function testConnection() {
    console.log('Testing connection to old Supabase...');
    try {
        const { data, count, error } = await oldDb
            .from('leads')
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error('Connection Error:', error);
        } else {
            console.log('Connection Successful! Lead count:', count);
        }

        console.log('Testing Auth API...');
        const { data: { users }, error: authError } = await oldDb.auth.admin.listUsers();
        if (authError) {
            console.error('Auth API Error:', authError);
        } else {
            console.log('Auth API Successful! User count:', users.length);
        }
    } catch (e) {
        console.error('Exception during test:', e);
    }
}

testConnection();
