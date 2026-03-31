-- Migration script to add trial tracking columns
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminded_2d_before BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminded_1d_before BOOLEAN DEFAULT false;
