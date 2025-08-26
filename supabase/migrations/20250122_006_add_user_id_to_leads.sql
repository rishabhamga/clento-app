-- Migration: Add user_id column to leads table
-- Date: 2025-01-22
-- Description: Add missing user_id column to leads table for proper user association

-- Add user_id column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.leads.user_id IS 'User who owns this lead record';

-- Update existing leads to have user_id based on organization membership
-- This is a one-time data migration for existing records
UPDATE public.leads 
SET user_id = (
  SELECT om.user_id 
  FROM public.organization_members om 
  WHERE om.organization_id = leads.organization_id 
  AND om.role = 'owner'
  LIMIT 1
)
WHERE user_id IS NULL AND organization_id IS NOT NULL;

-- For any remaining leads without user_id, try to find any organization member
UPDATE public.leads 
SET user_id = (
  SELECT om.user_id 
  FROM public.organization_members om 
  WHERE om.organization_id = leads.organization_id 
  LIMIT 1
)
WHERE user_id IS NULL AND organization_id IS NOT NULL;
