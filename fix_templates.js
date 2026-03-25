require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const newTemplates = {
        en: 'Hello {businessName}! 💎 We built a premium preview for your new website: {previewUrl}\n\nManage your site at your KSA Verified Portal: {portalUrl}\n\nYour Login Credentials:\nPhone: {phone}\nTemporary Password: *{password}*',
        ar: 'مرحباً {businessName}! 💎 لقد قمنا بإنشاء معاينة متميزة لموقعك الإلكتروني الجديد: {previewUrl}\n\nأدر موقعك من خلال بوابة KSA Verified: {portalUrl}\n\nبيانات تسجيل الدخول الخاصة بك:\nرقم الجوال: {phone}\nكلمة المرور المؤقتة: *{password}*',
        en_returning: 'Welcome back {businessName}! 💎 We updated your premium preview: {previewUrl}\n\nAccess your KSA Verified Portal with your new temporary password.\n\nPortal: {portalUrl}\nPhone: {phone}\nNew Password: *{password}*',
        ar_returning: 'مرحباً بعودتك {businessName}! 💎 لقد قمنا بتحديث معاينتك المتميزة: {previewUrl}\n\nيمكنك الوصول إلى بوابة KSA Verified بكلمة المرور المؤقتة الجديدة.\n\nالبوابة: {portalUrl}\nرقم الجوال: {phone}\nكلمة المرور الجديدة: *{password}*'
    };

    const { error } = await supabase
        .from('settings')
        .upsert({ key: 'whatsapp_template', value: newTemplates }, { onConflict: 'key' });

    if (error) console.error('Error:', error.message);
    else console.log('Templates updated successfully.');
}
run();
