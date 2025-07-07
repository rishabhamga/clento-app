-- Fix leads table schema issues
-- This migration addresses:
-- 1. Missing confidence column issue
-- 2. ON CONFLICT constraint issues
-- 3. UUID handling improvements

-- First, check if confidence column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'confidence'
    ) THEN
        ALTER TABLE leads ADD COLUMN confidence DECIMAL(3,2) DEFAULT 1.0;
    END IF;
END $$;

-- Ensure external_id has proper unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'leads' AND constraint_name = 'leads_external_id_key'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT leads_external_id_key UNIQUE (external_id);
    END IF;
END $$;

-- Add unique constraint for campaign_leads if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'campaign_leads' AND constraint_name = 'campaign_leads_campaign_id_lead_id_key'
    ) THEN
        ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_campaign_id_lead_id_key UNIQUE (campaign_id, lead_id);
    END IF;
END $$;

-- Add email+source unique index for better duplicate handling
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_source_key ON leads (email, source) 
WHERE email IS NOT NULL AND email != '';

-- Add sequence_steps table if it doesn't exist (referenced in campaign creation)
CREATE TABLE IF NOT EXISTS sequence_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    step_number INTEGER NOT NULL,
    channel VARCHAR(50) DEFAULT 'email',
    status VARCHAR(50) DEFAULT 'pending',
    send_time TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints safely for sequence_steps
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sequence_steps' AND constraint_name = 'sequence_steps_lead_id_fkey'
    ) THEN
        ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_lead_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint for sequence steps
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sequence_steps' AND constraint_name = 'sequence_steps_campaign_lead_step_key'
    ) THEN
        ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_campaign_lead_step_key 
        UNIQUE(campaign_id, lead_id, step_number);
    END IF;
END $$;

-- Add indexes for sequence_steps
CREATE INDEX IF NOT EXISTS idx_sequence_steps_campaign_id ON sequence_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_lead_id ON sequence_steps(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_status ON sequence_steps(status);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_send_time ON sequence_steps(send_time);

-- Add messages table for tracking sent messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    sequence_step_id UUID,
    
    -- Message details
    channel VARCHAR(50) DEFAULT 'email',
    subject TEXT,
    body TEXT,
    template_id VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    
    -- Tracking
    tracking_id VARCHAR(255),
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing messages table if they don't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sequence_step_id UUID,
ADD COLUMN IF NOT EXISTS template_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add foreign key constraints for messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'messages' AND constraint_name = 'messages_sequence_step_id_fkey'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT messages_sequence_step_id_fkey 
        FOREIGN KEY (sequence_step_id) REFERENCES sequence_steps(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_tracking_id ON messages(tracking_id);

-- Enable RLS on new tables
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for sequence_steps
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view sequence steps for their campaigns' AND tablename = 'sequence_steps'
    ) THEN
        CREATE POLICY "Users can view sequence steps for their campaigns" ON sequence_steps
          FOR SELECT USING (
            campaign_id IN (
              SELECT id FROM campaigns WHERE user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
              )
            )
          );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can insert sequence steps for their campaigns' AND tablename = 'sequence_steps'
    ) THEN
        CREATE POLICY "Users can insert sequence steps for their campaigns" ON sequence_steps
          FOR INSERT WITH CHECK (
            campaign_id IN (
              SELECT id FROM campaigns WHERE user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
              )
            )
          );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update sequence steps for their campaigns' AND tablename = 'sequence_steps'
    ) THEN
        CREATE POLICY "Users can update sequence steps for their campaigns" ON sequence_steps
          FOR UPDATE USING (
            campaign_id IN (
              SELECT id FROM campaigns WHERE user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
              )
            )
          );
    END IF;
END $$;

-- RLS policies for messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view messages for their campaigns' AND tablename = 'messages'
    ) THEN
        CREATE POLICY "Users can view messages for their campaigns" ON messages
          FOR SELECT USING (
            campaign_id IN (
              SELECT id FROM campaigns WHERE user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
              )
            )
          );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can insert messages for their campaigns' AND tablename = 'messages'
    ) THEN
        CREATE POLICY "Users can insert messages for their campaigns" ON messages
          FOR INSERT WITH CHECK (
            campaign_id IN (
              SELECT id FROM campaigns WHERE user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
              )
            )
          );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update messages for their campaigns' AND tablename = 'messages'
    ) THEN
        CREATE POLICY "Users can update messages for their campaigns" ON messages
          FOR UPDATE USING (
            campaign_id IN (
              SELECT id FROM campaigns WHERE user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
              )
            )
          );
    END IF;
END $$;

-- Add updated_at triggers for new tables (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_sequence_steps_updated_at'
    ) THEN
        CREATE TRIGGER update_sequence_steps_updated_at 
        BEFORE UPDATE ON sequence_steps 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_messages_updated_at'
    ) THEN
        CREATE TRIGGER update_messages_updated_at 
        BEFORE UPDATE ON messages 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add a function to safely upsert leads
CREATE OR REPLACE FUNCTION upsert_lead(
    p_external_id VARCHAR(255),
    p_first_name VARCHAR(255) DEFAULT NULL,
    p_last_name VARCHAR(255) DEFAULT NULL,
    p_full_name VARCHAR(255) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(50) DEFAULT NULL,
    p_title VARCHAR(255) DEFAULT NULL,
    p_company VARCHAR(255) DEFAULT NULL,
    p_industry VARCHAR(255) DEFAULT NULL,
    p_location VARCHAR(255) DEFAULT NULL,
    p_linkedin_url TEXT DEFAULT NULL,
    p_employee_count INTEGER DEFAULT NULL,
    p_revenue BIGINT DEFAULT NULL,
    p_source VARCHAR(50) DEFAULT 'manual',
    p_verified BOOLEAN DEFAULT FALSE,
    p_confidence DECIMAL(3,2) DEFAULT 1.0,
    p_technologies JSONB DEFAULT '[]'::jsonb
) RETURNS UUID AS $$
DECLARE
    lead_id UUID;
    current_user_id UUID;
BEGIN
    -- Get the current user's ID from the users table
    SELECT id INTO current_user_id 
    FROM users 
    WHERE clerk_id = auth.jwt() ->> 'sub';
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found or not authenticated';
    END IF;
    
    -- Try to insert, if conflict then update
    INSERT INTO leads (
        user_id, external_id, first_name, last_name, full_name, email, phone, title,
        company, industry, location, linkedin_url, employee_count, revenue,
        source, verified, confidence, technologies
    ) VALUES (
        current_user_id, p_external_id, p_first_name, p_last_name, p_full_name, p_email, p_phone, p_title,
        p_company, p_industry, p_location, p_linkedin_url, p_employee_count, p_revenue,
        p_source, p_verified, p_confidence, p_technologies
    ) ON CONFLICT (external_id) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, leads.first_name),
        last_name = COALESCE(EXCLUDED.last_name, leads.last_name),
        full_name = COALESCE(EXCLUDED.full_name, leads.full_name),
        email = COALESCE(EXCLUDED.email, leads.email),
        phone = COALESCE(EXCLUDED.phone, leads.phone),
        title = COALESCE(EXCLUDED.title, leads.title),
        company = COALESCE(EXCLUDED.company, leads.company),
        industry = COALESCE(EXCLUDED.industry, leads.industry),
        location = COALESCE(EXCLUDED.location, leads.location),
        linkedin_url = COALESCE(EXCLUDED.linkedin_url, leads.linkedin_url),
        employee_count = COALESCE(EXCLUDED.employee_count, leads.employee_count),
        revenue = COALESCE(EXCLUDED.revenue, leads.revenue),
        verified = COALESCE(EXCLUDED.verified, leads.verified),
        confidence = COALESCE(EXCLUDED.confidence, leads.confidence),
        technologies = COALESCE(EXCLUDED.technologies, leads.technologies),
        updated_at = NOW()
    RETURNING id INTO lead_id;
    
    RETURN lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to safely associate leads with campaigns
CREATE OR REPLACE FUNCTION associate_lead_with_campaign(
    p_campaign_id UUID,
    p_lead_id UUID,
    p_assigned_by VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
    campaign_lead_id UUID;
BEGIN
    INSERT INTO campaign_leads (campaign_id, lead_id, assigned_by)
    VALUES (p_campaign_id, p_lead_id, p_assigned_by)
    ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = NOW()
    RETURNING id INTO campaign_lead_id;
    
    RETURN campaign_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 