-- Syndie Integration Database Migration
-- Add new columns to existing leads table for Syndie automation tracking
-- Migration: 20250107_002_syndie_integration.sql

-- Add Syndie-specific columns to the leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS syndie_lead_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS linkedin_connection_status TEXT DEFAULT 'not_connected' CHECK (
    linkedin_connection_status IN (
        'not_connected', 
        'pending', 
        'connected', 
        'replied', 
        'bounced', 
        'not_interested'
    )
),
ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS campaign_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS seat_info JSONB DEFAULT '{}'::jsonb;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_leads_syndie_lead_id ON public.leads(syndie_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_connection_status ON public.leads(linkedin_connection_status);
CREATE INDEX IF NOT EXISTS idx_leads_steps_gin ON public.leads USING GIN(steps);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_info_gin ON public.leads USING GIN(campaign_info);

-- Add comments for documentation
COMMENT ON COLUMN public.leads.syndie_lead_id IS 'Unique identifier from Syndie automation system';
COMMENT ON COLUMN public.leads.linkedin_connection_status IS 'Current LinkedIn connection status from Syndie automation';
COMMENT ON COLUMN public.leads.steps IS 'Array of automation steps with timestamps and status from Syndie';
COMMENT ON COLUMN public.leads.campaign_info IS 'Campaign details from Syndie automation system';
COMMENT ON COLUMN public.leads.seat_info IS 'LinkedIn seat/account information used in Syndie automation';

-- Create a function to validate steps JSONB structure
CREATE OR REPLACE FUNCTION validate_syndie_steps(steps_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate that steps is an array
    IF jsonb_typeof(steps_data) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Additional validation can be added here for step structure
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for steps validation
ALTER TABLE public.leads 
ADD CONSTRAINT check_syndie_steps_format 
CHECK (validate_syndie_steps(steps));

-- Update the source enum to include 'syndie'
-- Note: This will require manual update if source is using enum type
-- For now, assuming source is TEXT with application-level validation

-- Enable RLS if not already enabled (should already be enabled)
-- ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Example RLS policy updates would go here if needed
-- Assuming existing RLS policies will handle the new columns appropriately