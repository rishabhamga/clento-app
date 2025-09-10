-- Migration: Accounts Integration with Unipile
-- Date: 2025-01-09
-- Description: Add user_accounts table for managing connected social media accounts via Unipile API

-- Create user_accounts table for managing connected social media accounts
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Unipile Integration Fields
  unipile_account_id TEXT UNIQUE, -- Unipile's account identifier
  provider TEXT NOT NULL CHECK (provider IN ('linkedin', 'email', 'twitter', 'facebook', 'instagram', 'whatsapp', 'telegram', 'messenger')),
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'business', 'page')) DEFAULT 'personal',
  
  -- Account Details
  display_name TEXT NOT NULL,
  username TEXT,
  email TEXT,
  profile_picture_url TEXT,
  
  -- Status & Health
  connection_status TEXT DEFAULT 'disconnected' CHECK (
    connection_status IN ('connected', 'disconnected', 'expired', 'error', 'pending', 'credentials')
  ),
  last_sync_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Unipile API Response Data
  unipile_data JSONB DEFAULT '{}'::jsonb,
  capabilities JSONB DEFAULT '[]'::jsonb, -- What actions this account supports (messaging, posting, etc.)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON public.user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_org_id ON public.user_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_unipile_id ON public.user_accounts(unipile_account_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_provider ON public.user_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_user_accounts_status ON public.user_accounts(connection_status);
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_provider ON public.user_accounts(user_id, provider);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_accounts_org_provider ON public.user_accounts(organization_id, provider) WHERE organization_id IS NOT NULL;

-- Add RLS policies
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own accounts and organization accounts they're members of
CREATE POLICY "Users can view their own accounts" ON public.user_accounts
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    ))
  );

-- Users can insert their own accounts
CREATE POLICY "Users can insert their own accounts" ON public.user_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own accounts and organization accounts they admin
CREATE POLICY "Users can update their own accounts" ON public.user_accounts
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- Users can delete their own accounts and organization accounts they admin
CREATE POLICY "Users can delete their own accounts" ON public.user_accounts
  FOR DELETE USING (
    user_id = auth.uid() OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_accounts_updated_at();

-- Create a function to get account statistics for a user/organization
CREATE OR REPLACE FUNCTION public.get_account_stats(p_user_id UUID, p_organization_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_accounts INTEGER,
  connected_accounts INTEGER,
  by_provider JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_accounts,
    COUNT(CASE WHEN connection_status = 'connected' THEN 1 END)::INTEGER as connected_accounts,
    jsonb_object_agg(provider, count) as by_provider
  FROM (
    SELECT 
      provider,
      COUNT(*)::INTEGER as count
    FROM public.user_accounts
    WHERE 
      (user_id = p_user_id) AND
      (p_organization_id IS NULL OR organization_id = p_organization_id)
    GROUP BY provider
  ) provider_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_account_stats(UUID, UUID) TO authenticated;
