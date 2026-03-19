-- KSA Verified Backend Schema

DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS chat_logs CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
-- 1. Create LEADS table
CREATE TABLE leads (
    place_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    lat NUMERIC,
    lng NUMERIC,
    status TEXT DEFAULT 'scouted'::text,
    photos JSONB DEFAULT '[]'::jsonb,
    website_html TEXT,
    vercel_url TEXT,
    subscription_tier TEXT DEFAULT 'None'::text,
    payment_date TIMESTAMP WITH TIME ZONE,
    reminded_5d BOOLEAN DEFAULT false,
    reminded_3d BOOLEAN DEFAULT false,
    reminded_1d BOOLEAN DEFAULT false,
    trial_start_date TIMESTAMP WITH TIME ZONE,
    reminded_2d_before BOOLEAN DEFAULT false,
    reminded_1d_before BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    claimed_by UUID, -- Reference to salesmen table
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: In a production environment with sensitive data, you would enable RLS here.
-- For a local script driven pipeline, it's often disabled or bypassed via Service Role Key.
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 2. Create LOGS table
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    place_id TEXT,
    details JSONB,
    status TEXT DEFAULT 'info'::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create CHAT_LOGS table (Used for Dashboard AI training)
CREATE TABLE chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT REFERENCES leads(place_id) ON DELETE CASCADE,
    phone TEXT,
    message_in TEXT,
    message_out TEXT,
    status TEXT DEFAULT 'pending'::text,
    translated_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create SETTINGS table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Settings
INSERT INTO settings (key, value, description) VALUES (
    'whatsapp_template', 
    '{"ar": "مرحباً {businessName}! 💎 لقد قمنا بإنشاء معاينة متميزة لموقعك الإلكتروني الجديد: {previewUrl}\\n\\nأدر موقعك من خلال بوابة KSA Verified: {portalUrl}\\n\\nبيانات تسجيل الدخول الخاصة بك:\\nرقم الجوال: {phone}\\nكلمة المرور المؤقتة: *{password}*", "en": "Hello {businessName}! 💎 We built a premium preview for your new website: {previewUrl}\\n\\nManage your site at your KSA Verified Portal: {portalUrl}\\n\\nYour Login Credentials:\\nPhone: {phone}\\nTemporary Password: *{password}*"}'::jsonb, 
    'WhatsApp outreach templates'
);

INSERT INTO settings (key, value, description) VALUES (
    'search_queries', 
    '["restaurant in Riyadh", "cafe in Riyadh", "barbershop in Riyadh", "gym in Riyadh", "salon in Riyadh"]'::jsonb, 
    'Google Maps Search Queries for leads'
);

-- 5. Create SALESMEN table
CREATE TABLE IF NOT EXISTS salesmen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    status TEXT DEFAULT 'active'::text,
    rating NUMERIC DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create VISITS table
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT REFERENCES leads(place_id),
    salesman_id UUID REFERENCES salesmen(id),
    photo_url TEXT,
    result TEXT,
    notes TEXT,
    lat NUMERIC,
    lng NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (key, value, description) VALUES (
    'commission_rates', 
    '{"trial_conversion_sar": 10, "subscription_conversion_sar": 50}'::jsonb, 
    'Commission structure for sales agents'
);
