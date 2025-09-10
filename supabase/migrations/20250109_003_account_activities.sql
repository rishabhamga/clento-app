-- Migration: Account Activities Tracking
-- Date: 2025-01-09
-- Description: Add account_activities table for tracking account actions and outreach activities

-- Create account_activities table for tracking account actions and outreach activities
CREATE TABLE IF NOT EXISTS public.account_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'test_message', 'profile_visit', 'connection_request', 'message_sent', 
    'comment_post', 'like_post', 'share_post', 'follow_user', 'unfollow_user',
    'campaign_start', 'campaign_end', 'webhook_notification', 'sync_data'
  )),
  activity_data JSONB DEFAULT '{}'::jsonb, -- Flexible data storage for different activity types
  
  -- Status & Results
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  error_message TEXT, -- Store error details if activity failed
  
  -- External References
  external_id TEXT, -- ID from external service (Unipile, LinkedIn, etc.)
  target_profile_id TEXT, -- LinkedIn profile ID or other platform identifier
  campaign_id UUID, -- Reference to campaign if part of outreach sequence
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_activities_account_id ON public.account_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_account_activities_type ON public.account_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_account_activities_status ON public.account_activities(status);
CREATE INDEX IF NOT EXISTS idx_account_activities_created_at ON public.account_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_activities_campaign ON public.account_activities(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_activities_target ON public.account_activities(target_profile_id) WHERE target_profile_id IS NOT NULL;

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_account_activities_account_type ON public.account_activities(account_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_account_activities_account_date ON public.account_activities(account_id, created_at DESC);

-- Add RLS policies
ALTER TABLE public.account_activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities for their own accounts and organization accounts they're members of
CREATE POLICY "Users can view their account activities" ON public.account_activities
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.user_accounts
      WHERE user_id = auth.uid() OR 
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ))
    )
  );

-- Users can insert activities for their own accounts
CREATE POLICY "Users can insert their account activities" ON public.account_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM public.user_accounts
      WHERE user_id = auth.uid() OR 
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'member')
      ))
    )
  );

-- Users can update activities for their own accounts
CREATE POLICY "Users can update their account activities" ON public.account_activities
  FOR UPDATE USING (
    account_id IN (
      SELECT id FROM public.user_accounts
      WHERE user_id = auth.uid() OR 
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'member')
      ))
    )
  );

-- Users can delete activities for their own accounts (admin only for org accounts)
CREATE POLICY "Users can delete their account activities" ON public.account_activities
  FOR DELETE USING (
    account_id IN (
      SELECT id FROM public.user_accounts
      WHERE user_id = auth.uid() OR 
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_account_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_activities_updated_at
  BEFORE UPDATE ON public.account_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_activities_updated_at();

-- Create a function to get activity statistics for an account
CREATE OR REPLACE FUNCTION public.get_activity_stats(p_account_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_activities INTEGER,
  by_type JSONB,
  by_status JSONB,
  recent_activities JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_activities,
    jsonb_object_agg(activity_type, type_count) as by_type,
    jsonb_object_agg(status, status_count) as by_status,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'activity_type', activity_type,
        'status', status,
        'created_at', created_at,
        'activity_data', activity_data
      ) ORDER BY created_at DESC
    ) FILTER (WHERE row_number() OVER (ORDER BY created_at DESC) <= 10) as recent_activities
  FROM (
    SELECT 
      id,
      activity_type,
      status,
      created_at,
      activity_data,
      COUNT(*) OVER (PARTITION BY activity_type) as type_count,
      COUNT(*) OVER (PARTITION BY status) as status_count
    FROM public.account_activities
    WHERE 
      account_id = p_account_id AND
      created_at >= NOW() - INTERVAL '1 day' * p_days
  ) activities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_activity_stats(UUID, INTEGER) TO authenticated;

-- Create a function to clean up old activities (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_activities(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.account_activities
  WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins can call this)
GRANT EXECUTE ON FUNCTION public.cleanup_old_activities(INTEGER) TO authenticated;
