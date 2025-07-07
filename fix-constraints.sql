-- Database Constraints Fix
-- Run this SQL in your Supabase Dashboard > SQL Editor to fix constraint violations

-- 1. Fix campaign_leads status constraint
-- Allow 'pending' status which is used by the application
ALTER TABLE campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_status_check;
ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_status_check 
CHECK (status IN ('pending', 'active', 'contacted', 'replied', 'converted', 'bounced', 'unsubscribed', 'paused', 'completed', 'opted_out'));

-- 2. Fix sequence_steps channel constraint  
-- Allow 'linkedin' as a channel which is used by the workflow
ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_channel_check;
ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_channel_check 
CHECK (channel IN ('email', 'linkedin', 'linkedin_invite', 'linkedin_message'));

-- 3. Fix sequence_steps status constraint
-- Add more status values that might be needed
ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_status_check;
ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_status_check 
CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'skipped', 'delivered', 'opened', 'clicked', 'replied', 'bounced'));

-- 4. Update the associate_lead_with_campaign function to use correct default status
CREATE OR REPLACE FUNCTION associate_lead_with_campaign(
    p_campaign_id UUID,
    p_lead_id UUID,
    p_assigned_by VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
    campaign_lead_id UUID;
BEGIN
    INSERT INTO campaign_leads (campaign_id, lead_id, assigned_by, status)
    VALUES (p_campaign_id, p_lead_id, p_assigned_by, 'pending')
    ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = NOW(),
        status = EXCLUDED.status
    RETURNING id INTO campaign_lead_id;
    
    RETURN campaign_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 