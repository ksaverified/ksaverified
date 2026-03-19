require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_DELAY_MS = 2000; // 2 seconds between table batches
const USER_DELAY_MS = 500;   // 0.5 seconds between users
const STORAGE_DELAY_MS = 500; // 0.5 seconds between storage files

console.log(`\n--- MIGRATION MODE: ${DRY_RUN ? 'DRY RUN (No changes will be made)' : 'LIVE (Changes will be applied!!)'} ---\n`);

// Old Supabase Credentials
const OLD_SUPABASE_URL = 'https://ozkmsuodpghtsqcmpsmk.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a21zdW9kcGdodHNxY21wc21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2MjgzNCwiZXhwIjoyMDg4MDM4ODM0fQ.5SuOB9t6zsGgfIk7IL8IKvG-izsDU5RdkSLGVOPmBBA';

// New Supabase Credentials
const NEW_SUPABASE_URL = process.env.SUPABASE_URL;
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oldDb = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(60000) }) }
});
const newDb = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Table Column Definitions (to ensure we don't try to insert columns that don't exist in the new DB)
const TABLE_COLUMNS = {
    leads: [
        'place_id', 'name', 'phone', 'address', 'lat', 'lng', 'status', 
        'photos', 'website_html', 'vercel_url', 'subscription_tier', 
        'payment_date', 'reminded_5d', 'reminded_3d', 'reminded_1d', 
        'retry_count', 'last_error', 'created_at', 'updated_at'
    ],
    chat_logs: [
        'id', 'place_id', 'phone', 'message_in', 'message_out', 'status', 
        'translated_message', 'created_at'
    ],
    settings: ['key', 'value', 'description', 'updated_at'],
    logs: ['id', 'agent', 'action', 'place_id', 'details', 'status', 'created_at']
};

async function migrateTable(tableName, orderByCol = 'created_at') {
    console.log(`\n--- Migrating table: ${tableName} ---`);
    let hasMore = true;
    let start = 0;
    const limit = 500;
    let totalMigrated = 0;

    while (hasMore) {
        // Fetch from old db
        const { data: rows, error: fetchError } = await oldDb
            .from(tableName)
            .select('*')
            .order(orderByCol, { ascending: true })
            .range(start, start + limit - 1);

        if (fetchError) {
            console.error(`[Error] Failed to fetch ${tableName}:`, fetchError);
            break;
        }

        if (!rows || rows.length === 0) {
            hasMore = false;
            break;
        }

        if (DRY_RUN) {
            console.log(`[DRY RUN] Would upsert ${rows.length} rows into ${tableName}.`);
        } else {
            // Filter columns
            const filteredRows = rows.map(r => {
                const filtered = {};
                const cols = TABLE_COLUMNS[tableName];
                if (cols) {
                    cols.forEach(c => { if (c in r) filtered[c] = r[c]; });
                } else {
                    return r; // no filtering if not specified
                }
                return filtered;
            });

            const { error: insertError } = await newDb
                .from(tableName)
                .upsert(filteredRows);

            if (insertError) {
                console.error(`[Error] Failed to insert into ${tableName}:`, insertError.message);
                break;
            }
        }

        totalMigrated += rows.length;
        console.log(`Processed ${totalMigrated} rows so far...`);
        start += limit;

        if (rows.length < limit) {
            hasMore = false;
        } else {
            console.log(`Waiting ${BATCH_DELAY_MS}ms before next batch...`);
            await sleep(BATCH_DELAY_MS);
        }
    }
    console.log(`Finished processing ${tableName}. Total rows: ${totalMigrated}`);
    return totalMigrated;
}

async function migrateUsers() {
    console.log(`\n--- Migrating Auth Users ---`);
    let hasMore = true;
    let page = 1;
    const limit = 100; // Smaller chunks for user listing too
    let totalProcessed = 0;
    let totalCreated = 0;

    while (hasMore) {
        const { data: { users }, error } = await oldDb.auth.admin.listUsers({
            page: page,
            perPage: limit
        });

        if (error) {
            console.error('[Error] Failed to fetch users:', error);
            break;
        }

        if (!users || users.length === 0) {
            hasMore = false;
            break;
        }

        for (const user of users) {
            totalProcessed++;
            if (DRY_RUN) {
                console.log(`[DRY RUN] Would migrate user: ${user.email} (Phone: ${user.phone || 'none'})`);
            } else {
                // Attempt to recreate user
                const userData = {
                    email: user.email.replace('ksaverified.local', 'ksaverified.com'),
                    email_confirm: true,
                    phone: user.phone,
                    phone_confirm: !!user.phone_confirmed_at,
                    user_metadata: {
                        ...user.user_metadata,
                        migrated_from_old: true,
                        old_id: user.id
                    }
                };

                const { error: createError } = await newDb.auth.admin.createUser(userData);

                if (createError) {
                    if (createError.message.includes('already been registered')) {
                        console.log(`[Skip] User ${user.email} already exists.`);
                    } else if (createError.message.includes('Phone number already exists')) {
                        console.log(`[Skip] User with phone ${user.phone} already exists.`);
                    } else {
                        console.error(`[Error] Failed to create user ${user.email}:`, createError.message);
                    }
                } else {
                    totalCreated++;
                    console.log(`[Success] Created user: ${user.email}`);
                }
            }
            await sleep(USER_DELAY_MS);
        }
        
        console.log(`Processed ${totalProcessed} auth users so far...`);
        page++;
        if (users.length < limit) hasMore = false;
    }

    console.log(`Finished processing users. Total processed: ${totalProcessed}, Successfully created: ${totalCreated}`);
}

async function migrateStorage(bucketName = 'whatsapp_sessions') {
    console.log(`\n--- Migrating Storage: ${bucketName} ---`);
    
    // 1. List files in old bucket
    const { data: files, error: listError } = await oldDb.storage.from(bucketName).list();
    
    if (listError) {
        console.error(`[Error] Could not list files in bucket ${bucketName}:`, listError);
        return;
    }

    console.log(`Found ${files.length} files to migrate.`);

    for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;

        if (DRY_RUN) {
            console.log(`[DRY RUN] Would migrate file: ${file.name}`);
        } else {
            console.log(`Migrating ${file.name}...`);
            
            // Download from old
            const { data, error: downError } = await oldDb.storage.from(bucketName).download(file.name);
            if (downError) {
                console.error(`[Error] Failed to download ${file.name}:`, downError);
                continue;
            }

            // Upload to new
            const { error: upError } = await newDb.storage.from(bucketName).upload(file.name, data, {
                upsert: true,
                contentType: 'application/octet-stream' // generic or detect?
            });

            if (upError) {
                console.error(`[Error] Failed to upload ${file.name}:`, upError);
            } else {
                console.log(`[Success] Migrated ${file.name}`);
            }
        }
        await sleep(STORAGE_DELAY_MS);
    }
}

async function runMigration() {
    try {
        console.log('Starting Supabase Database Migration with Throttling...');
        
        // 1. Tables migration
        const tables = [
            { name: 'settings', id: 'key' },
            { name: 'leads', id: 'created_at' },
            { name: 'logs', id: 'created_at' },
            { name: 'chat_logs', id: 'created_at' }
        ];

        for (const table of tables) {
            await migrateTable(table.name, table.id);
            await sleep(BATCH_DELAY_MS * 2); // Extra rest between tables
        }

        // 2. Storage migration
        await migrateStorage();

        // 3. Auth Users migration
        console.log('\nAll tables and storage items processed. Attempting to migrate Auth Users...');
        await migrateUsers();

        console.log('\nMigration process complete! 🎉');

    } catch (e) {
        console.error('Migration failed with an exception:', e);
    }
}

runMigration();
