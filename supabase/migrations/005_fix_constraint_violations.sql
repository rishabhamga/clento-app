-- Fix constraint violations in campaign_leads and sequence_steps tables
-- This migration addresses the constraint violations reported in the logs

-- 1. Fix campaign_leads status constraint
-- The associate_lead_with_campaign function uses 'pending' as default status
-- but the original constraint only allows 'active', 'paused', 'completed', 'opted_out'
-- We need to align with the later migration that uses different statuses

-- Drop the old constraint and add the new one
ALTER TABLE campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_status_check;
ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_status_check 
CHECK (status IN ('pending', 'active', 'contacted', 'replied', 'converted', 'bounced', 'unsubscribed', 'paused', 'completed', 'opted_out'));

-- 2. Fix sequence_steps channel constraint
-- The application is using 'linkedin' but the database only allows 'email', 'linkedin_invite', 'linkedin_message'
-- We need to expand the allowed values to include 'linkedin' as a generic channel

-- Drop the old constraint and add the new one
ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_channel_check;
ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_channel_check 
CHECK (channel IN ('email', 'linkedin', 'linkedin_invite', 'linkedin_message'));

-- 3. Update the associate_lead_with_campaign function to use the correct default status
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

-- 4. Ensure sequence_steps status allows all needed values
ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_status_check;
ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_status_check 
CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'skipped', 'delivered', 'opened', 'clicked', 'replied', 'bounced'));

-- 5. Add a function to map workflow channels to database channels
CREATE OR REPLACE FUNCTION map_workflow_channel_to_db(
    p_workflow_channel VARCHAR(50),
    p_action_type VARCHAR(50) DEFAULT 'email'
) RETURNS VARCHAR(50) AS $$
BEGIN
    CASE p_workflow_channel
        WHEN 'email' THEN RETURN 'email';
        WHEN 'linkedin' THEN
            CASE p_action_type
                WHEN 'connect' THEN RETURN 'linkedin_invite';
                WHEN 'message' THEN RETURN 'linkedin_message';
                ELSE RETURN 'linkedin';
            END CASE;
        ELSE RETURN p_workflow_channel;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 6. Comments for documentation
COMMENT ON FUNCTION map_workflow_channel_to_db IS 'Maps workflow channel values to database-allowed channel values';
COMMENT ON FUNCTION associate_lead_with_campaign IS 'Associates a lead with a campaign using proper status values'; 