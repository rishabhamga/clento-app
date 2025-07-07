# Quick Database Fix Guide - Supabase Compatible

## The Issues We're Fixing

1. **Missing `confidence` column** in the `leads` table
2. **Missing unique constraints** causing ON CONFLICT errors  
3. **UUID handling errors** in API routes
4. **Missing helper functions** for robust database operations

## Manual Fix Steps

### Step 1: Open Supabase SQL Editor

Go to your Supabase dashboard → SQL Editor → New query

### Step 2: Add Missing Confidence Column

```sql
-- Add confidence column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'leads' AND column_name = 'confidence') 
    THEN
        ALTER TABLE leads ADD COLUMN confidence DECIMAL(3,2) DEFAULT 1.0;
    END IF;
END $$;
```

### Step 3: Fix Unique Constraints (PostgreSQL Compatible)

```sql
-- Add unique constraint for external_id if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'leads_external_id_key' 
                  AND table_name = 'leads') 
    THEN
        ALTER TABLE leads ADD CONSTRAINT leads_external_id_key UNIQUE (external_id);
    END IF;
END $$;

-- Add unique constraint for campaign_leads if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'campaign_leads_campaign_id_lead_id_key' 
                  AND table_name = 'campaign_leads') 
    THEN
        ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_campaign_id_lead_id_key UNIQUE (campaign_id, lead_id);
    END IF;
END $$;

-- Add email+source unique index for better duplicate handling  
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_source_key ON leads (email, source) 
WHERE email IS NOT NULL AND email != '';
```

### Step 4: Add Missing Tables

```sql
-- Add sequence_steps table if it doesn't exist
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

-- Add foreign key constraints safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'sequence_steps_lead_id_fkey' 
                  AND table_name = 'sequence_steps') 
    THEN
        ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_lead_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint for sequence steps
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'sequence_steps_campaign_lead_step_key' 
                  AND table_name = 'sequence_steps') 
    THEN
        ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_campaign_lead_step_key 
        UNIQUE(campaign_id, lead_id, step_number);
    END IF;
END $$;

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
    status VARCHAR(50) DEFAULT 'draft',
    
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

-- Add foreign key constraints for messages table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'messages_lead_id_fkey' 
                  AND table_name = 'messages') 
    THEN
        ALTER TABLE messages ADD CONSTRAINT messages_lead_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'messages_sequence_step_id_fkey' 
                  AND table_name = 'messages') 
    THEN
        ALTER TABLE messages ADD CONSTRAINT messages_sequence_step_id_fkey 
        FOREIGN KEY (sequence_step_id) REFERENCES sequence_steps(id) ON DELETE CASCADE;
    END IF;
END $$;
```

### Step 5: Add Helper Functions

```sql
-- Function to safely upsert leads
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

-- Function to safely associate leads with campaigns
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
```

### Step 6: Enable RLS and Add Indexes

```sql
-- Enable RLS on new tables
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sequence_steps_campaign_id ON sequence_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_lead_id ON sequence_steps(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_send_time ON sequence_steps(send_time) WHERE status IN ('pending', 'scheduled');
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_leads_confidence ON leads(confidence);
```

### Step 7: Add RLS Policies

```sql
-- RLS policies for sequence_steps
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view sequence steps for their campaigns' AND tablename = 'sequence_steps') THEN
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert sequence steps for their campaigns' AND tablename = 'sequence_steps') THEN
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update sequence steps for their campaigns' AND tablename = 'sequence_steps') THEN
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view messages for their campaigns' AND tablename = 'messages') THEN
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert messages for their campaigns' AND tablename = 'messages') THEN
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
```

## Test the Fix

After running the above SQL, test your application:

1. Try uploading leads in the targeting section
2. Move to the pitch section
3. Check if leads are saved properly

## Alternative: Use the Migration File

You can also apply the complete migration file we created:

```bash
# Copy the 004_fix_leads_schema.sql to Supabase SQL Editor and run it
```

## What's Been Fixed

✅ **PostgreSQL Syntax** - Fixed all syntax errors for Supabase compatibility  
✅ **Missing confidence column** - Added with proper default value  
✅ **Unique constraints** - Added proper constraints using DO blocks  
✅ **Database functions** - Added `upsert_lead` and `associate_lead_with_campaign` functions  
✅ **API routes** - Updated to use new functions and proper UUID validation  
✅ **Missing tables** - Added `sequence_steps` and `messages` tables  
✅ **Error handling** - Improved error handling and validation in API routes  
✅ **RLS Policies** - Added proper Row Level Security policies  

The refactored code is now PostgreSQL/Supabase compatible and should work without syntax errors! 