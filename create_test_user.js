require('dotenv').config();
const auth = require('./core/services/auth');

async function create() {
    try {
        const lead = { name: 'Fitness Days', phone: '966599999999' };
        // Fixed PIN for easier recording
        const pin = '123456';
        
        const proxyEmail = auth.getProxyEmail(lead.phone);
        console.log(`Creating user with email: ${proxyEmail}`);
        
        // List user to check existence
        const { data: { users }, error: listError } = await auth.admin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existing = users.find(u => u.email === proxyEmail);
        let userId;
        
        if (existing) {
            console.log(`User already exists. Updating password to 123456...`);
            const { error: updateError } = await auth.admin.auth.admin.updateUserById(
                existing.id,
                { password: pin }
            );
            if (updateError) throw updateError;
            userId = existing.id;
        } else {
            console.log(`Creating new user...`);
            const { data: newUser, error: createError } = await auth.admin.auth.admin.createUser({
                email: proxyEmail,
                password: pin,
                email_confirm: true,
                user_metadata: { phone: lead.phone, name: lead.name }
            });
            if (createError) throw createError;
            userId = newUser.user.id;
        }
        
        console.log(`Success! Fixed PIN: ${pin}, User ID: ${userId}`);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

create();
