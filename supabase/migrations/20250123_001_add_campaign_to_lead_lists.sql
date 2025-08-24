-- Migration: Add campaign_id to lead_lists table
-- Date: 2025-01-23
-- Description: Add campaign_id column to lead_lists table to link lead lists with campaigns

-- Add campaign_id column to lead_lists table
ALTER TABLE public.lead_lists 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lead_lists_campaign_id ON public.lead_lists(campaign_id);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_lead_lists_account_campaign ON public.lead_lists(connected_account_id, campaign_id);

-- Add comment for documentation
COMMENT ON COLUMN public.lead_lists.campaign_id IS 'Optional campaign that this lead list is associated with for outreach';

-- Update the get_lead_list_stats function to include campaign information if needed
-- (This function already exists, no changes needed for now)
