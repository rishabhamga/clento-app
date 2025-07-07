-- Fix lead saving issues
-- This migration addresses:
-- 1. Missing assigned_by column in campaign_leads table
-- 2. Missing upsert_lead function (create simplified version)
-- 3. Missing associate_lead_with_campaign function

-- Add missing assigned_by column to campaign_leads table
ALTER TABLE campaign_leads 
ADD COLUMN IF NOT EXISTS assigned_by text,
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone DEFAULT now();

-- Update the constraint to include all needed status values
ALTER TABLE campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_status_check;
ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_status_check 
CHECK (status IN ('pending', 'active', 'contacted', 'replied', 'converted', 'bounced', 'unsubscribed', 'paused', 'completed', 'opted_out'));

-- Create simplified upsert_lead function for campaign creation
-- This is a simpler version that works with the basic fields needed for campaigns
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
  p_source VARCHAR(50) DEFAULT 'campaign',
  p_verified BOOLEAN DEFAULT FALSE,
  p_confidence DECIMAL(3,2) DEFAULT 1.0,
  p_technologies JSONB DEFAULT '[]'::jsonb
) RETURNS UUID AS $$
DECLARE
  lead_id UUID;
  current_user_id UUID;
  current_org_id UUID;
BEGIN
  -- Get the current user's ID from the users table
  SELECT id INTO current_user_id 
  FROM users 
  WHERE clerk_id = auth.jwt() ->> 'sub';
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not authenticated';
  END IF;

  -- Get user's organization (if any)
  SELECT organization_id INTO current_org_id
  FROM user_profile
  WHERE user_id = current_user_id;
  
  -- Try to insert, if conflict then update
  INSERT INTO leads (
    user_id, organization_id, external_id, first_name, last_name, full_name, email, phone, title,
    company, industry, location, linkedin_url, employee_count, revenue,
    source, verified, confidence, technologies
  ) VALUES (
    current_user_id, current_org_id, p_external_id, p_first_name, p_last_name, p_full_name, p_email, p_phone, p_title,
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

-- Create associate_lead_with_campaign function
CREATE OR REPLACE FUNCTION associate_lead_with_campaign(
  p_campaign_id UUID,
  p_lead_id UUID,
  p_assigned_by TEXT
) RETURNS UUID AS $$
DECLARE
  campaign_lead_id UUID;
  current_org_id UUID;
BEGIN
  -- Get organization from campaign
  SELECT organization_id INTO current_org_id
  FROM campaigns
  WHERE id = p_campaign_id;

  INSERT INTO campaign_leads (campaign_id, lead_id, assigned_by, assigned_at, status, organization_id)
  VALUES (p_campaign_id, p_lead_id, p_assigned_by, NOW(), 'pending', current_org_id)
  ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = NOW(),
    status = EXCLUDED.status
  RETURNING id INTO campaign_lead_id;
  
  RETURN campaign_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add external_id column to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- Add unique constraint on external_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'leads' AND constraint_name = 'leads_external_id_key'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_external_id_key UNIQUE (external_id);
  END IF;
END $$;

-- Add missing columns to leads table for full Apollo compatibility
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS technologies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS revenue BIGINT;

-- Update RLS policies for campaign_leads to handle assigned_by properly
DROP POLICY IF EXISTS "Users can view campaign leads they assigned" ON campaign_leads;
CREATE POLICY "Users can view campaign leads they assigned" ON campaign_leads
  FOR SELECT USING (
    assigned_by = auth.jwt() ->> 'sub'
    OR 
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
      AND om.status = 'active'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_leads_assigned_by ON campaign_leads(assigned_by);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_assigned_at ON campaign_leads(assigned_at);
CREATE INDEX IF NOT EXISTS idx_leads_external_id ON leads(external_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 