const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    console.log('--- KSAVerified DB Migration Utility ---');
    
    const tables = ['profiles', 'leads', 'chat_logs'];
    const exportData = {};

    for (const table of tables) {
        console.log(`Exporting table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error exporting ${table}:`, error.message);
            continue;
        }
        exportData[table] = data;
        console.log(`Successfully exported ${data.length} rows from ${table}.`);
    }

    const fileName = `migration_export_${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    
    console.log(`--- Migration Export Complete: ${fileName} ---`);
    console.log('You can now use this file to import data into your new Saudi-hosted database.');
}

migrate();
