const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listBuckets() {
    console.log("Listing buckets...");
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Error listing buckets:", error);
        return;
    }
    console.log("Buckets:", data.map(b => b.name));

    for (let b of data) {
        const { data: files, error: filesError } = await supabase.storage.from(b.name).list();
        if (filesError) {
            console.error(`Error listing files in ${b.name}:`, filesError);
        } else {
            console.log(`Bucket ${b.name} has ${files.length} files. Total size: ${files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0)} bytes`);
        }
    }
}

listBuckets();
