-- Migration: Smartlead Integration Schema Changes
-- Date: 2025-01-08
-- Description: Add Smartlead integration support with customer mapping, email events tracking, and enhanced lead management

-- Add Smartlead organization mapping to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS smartlead_org_id TEXT,
ADD COLUMN IF NOT EXISTS smartlead_org_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_smartlead_org_id ON public.users(smartlead_org_id);

-- Add Smartlead campaign tracking and email activity to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS smartlead_campaign_id TEXT,
ADD COLUMN IF NOT EXISTS last_email_event TEXT,
ADD COLUMN IF NOT EXISTS last_event_timestamp TIMESTAMPTZ;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_leads_smartlead_campaign_id ON public.leads(smartlead_campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_last_event_timestamp ON public.leads(last_event_timestamp);

-- Create email_events table for tracking Smartlead webhook events
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  email TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  smartlead_org_id TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for email_events table performance
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON public.email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON public.email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_message_id ON public.email_events(message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON public.email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_lead_id ON public.email_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_events_smartlead_org_id ON public.email_events(smartlead_org_id);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON public.email_events(timestamp);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_email_events_user_campaign ON public.email_events(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email_event_type ON public.email_events(email, event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_lead_timestamp ON public.email_events(lead_id, timestamp DESC);

-- Add check constraints for data validity
ALTER TABLE public.email_events
ADD CONSTRAINT chk_email_events_event_type CHECK (
  event_type IN (
    'email_opened', 'email_clicked', 'email_replied', 'email_bounced',
    'email_delivered', 'email_sent', 'email_unsubscribed', 'email_spam_reported',
    'email_follow_up_opened', 'email_follow_up_clicked', 'email_follow_up_replied'
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_events_updated_at
    BEFORE UPDATE ON public.email_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update integration_credentials to include smartlead
ALTER TABLE public.integration_credentials
DROP CONSTRAINT IF EXISTS integration_credentials_provider_check;

ALTER TABLE public.integration_credentials
ADD CONSTRAINT integration_credentials_provider_check CHECK (
  provider IN ('gmail', 'outlook', 'linkedin', 'phantombuster', 'zoominfo', 'apollo', 'smartlead')
);

-- Add comments for documentation
COMMENT ON TABLE public.email_events IS 'Stores email events received from Smartlead webhooks for campaign tracking and analytics';
COMMENT ON COLUMN public.users.smartlead_org_id IS 'Smartlead organization ID associated with this user/customer';
COMMENT ON COLUMN public.users.smartlead_org_name IS 'Human-readable name of the Smartlead organization';
COMMENT ON COLUMN public.leads.smartlead_campaign_id IS 'Smartlead campaign ID this lead is associated with';
COMMENT ON COLUMN public.leads.last_email_event IS 'Last email event type received for this lead';
COMMENT ON COLUMN public.leads.last_event_timestamp IS 'Timestamp of the last email event for this lead'; 