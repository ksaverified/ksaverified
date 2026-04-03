require('dotenv').config();
const DatabaseService = require('./core/services/db');
const db = new DatabaseService();

const targetIds = [ 
    'ChIJrxDn1SsdLz4RLjKcG9GgbQs', 
    'ChIJEQ_TidoDLz4R005blMNH_jE', 
    'ChIJyYnNm8wdLz4RLYlXj_7CjFA', 
    'ChIJOZClVQABLz4ReBcwSGWfp0U', 
    'ChIJ228xVPEDLz4RGLFQzi2N_ug', 
    'ChIJjcWpaWkRLz4Rb-wXiV9X39Y', 
    'ChIJxY5908IBLz4RBUae4nebCMg', 
    'ChIJvX__tM3lLj4RDGao6omz7g0', 
    'ChIJ89LbpW5VLj4Re0NkjtCdMjw', 
    'ChIJKY8q7_flLj4Rpj3hP40QNJI', 
    'ChIJE3EI-QkHLz4RjojVaMuzOg8', 
    'ChIJYT2BrXkfLz4RsJgsN-neMeE', 
    'ChIJ3Xq_hkIDLz4RfCBFphtDSVM' 
];

async function checkPriority() {
    try {
        const { data, error } = await db.supabase
            .from('leads')
            .select('place_id, name, status')
            .in('place_id', targetIds);

        if (error) throw error;

        console.log("\n--- Priority Status Report ---");
        data.forEach(l => {
            console.log(`Lead: ${l.name.padEnd(40)} | Status: ${l.status}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkPriority();
