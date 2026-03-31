-- Migration script to add Map Gap System columns
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS map_gap_analysis JSONB,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'warm',
ADD COLUMN IF NOT EXISTS conversion_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gap_count INTEGER DEFAULT 0;

-- Create index for priority filtering
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);

-- Create index for conversion score sorting
CREATE INDEX IF NOT EXISTS idx_leads_conversion_score ON leads(conversion_score);

-- Create index for gap count filtering
CREATE INDEX IF NOT EXISTS idx_leads_gap_count ON leads(gap_count);
