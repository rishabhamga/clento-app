-- Lead Management Tables
-- This migration enhances the existing leads table and creates additional related tables

-- Add missing columns to existing leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS revenue BIGINT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS technologies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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

-- Lead search history - track all searches performed
CREATE TABLE lead_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  
  -- Search parameters (stored as JSONB for flexibility)
  filters JSONB NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'b2b-data', 'ecommerce', 'local-data'
  
  -- Search results
  total_results INTEGER NOT NULL,
  leads_found INTEGER NOT NULL,
  search_duration_ms INTEGER,
  
  -- Provider information
  primary_provider VARCHAR(50), -- Which provider was used
  fallback_used BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cost tracking (for future billing)
  estimated_cost DECIMAL(10,4) DEFAULT 0.00
);

-- Enhance existing campaign_leads table with additional columns
ALTER TABLE campaign_leads 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS emails_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_clicked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Update constraint to include new status values
ALTER TABLE campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_status_check;
ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_status_check 
CHECK (status IN ('active', 'paused', 'completed', 'opted_out', 'pending', 'contacted', 'replied', 'converted', 'bounced', 'unsubscribed'));

-- Lead enrichment history - track enrichment attempts
CREATE TABLE lead_enrichments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Enrichment details
  provider VARCHAR(50) NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  successful BOOLEAN NOT NULL,
  
  -- Data changes (before/after snapshots)
  fields_updated JSONB, -- Array of field names that were updated
  previous_data JSONB, -- Snapshot of lead data before enrichment
  new_data JSONB, -- New data from enrichment
  
  -- Error tracking
  error_message TEXT,
  
  -- Cost tracking
  cost DECIMAL(10,4) DEFAULT 0.00
);

-- Email verification history
CREATE TABLE email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  
  -- Verification results
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  provider VARCHAR(50) NOT NULL,
  is_valid BOOLEAN NOT NULL,
  is_deliverable BOOLEAN NOT NULL,
  verification_reason VARCHAR(255),
  
  -- Technical details
  mx_record_found BOOLEAN,
  smtp_check_passed BOOLEAN,
  disposable_email BOOLEAN DEFAULT false,
  
  -- Cost tracking
  cost DECIMAL(10,4) DEFAULT 0.00
);

-- Indexes for performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company ON leads(company);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_verified ON leads(verified);
CREATE INDEX idx_leads_external_id ON leads(external_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_last_searched ON leads(last_searched_at DESC);

CREATE INDEX idx_lead_searches_user_id ON lead_searches(user_id);
CREATE INDEX idx_lead_searches_created_at ON lead_searches(created_at DESC);
CREATE INDEX idx_lead_searches_source ON lead_searches(source);

CREATE INDEX idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_lead_id ON campaign_leads(lead_id);
CREATE INDEX idx_campaign_leads_status ON campaign_leads(status);
CREATE INDEX idx_campaign_leads_assigned_at ON campaign_leads(assigned_at DESC);

CREATE INDEX idx_lead_enrichments_lead_id ON lead_enrichments(lead_id);
CREATE INDEX idx_lead_enrichments_attempted_at ON lead_enrichments(attempted_at DESC);

CREATE INDEX idx_email_verifications_lead_id ON email_verifications(lead_id);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Note: Basic leads policies already exist from 001_init.sql
-- Skip creating additional conflicting policies for leads table

-- Lead searches policies
CREATE POLICY "Users can view their own searches" ON lead_searches
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own searches" ON lead_searches
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Note: Basic campaign_leads policies already exist from 001_init.sql
-- Skip creating additional conflicting policies for campaign_leads table

-- Lead enrichments policies
CREATE POLICY "Users can view enrichments for accessible leads" ON lead_enrichments
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads WHERE 
      external_id IN (
        SELECT DISTINCT jsonb_array_elements_text(
          jsonb_extract_path(filters, 'user_id')
        ) 
        FROM lead_searches 
        WHERE user_id = auth.jwt() ->> 'sub'
      )
      OR id IN (
        SELECT lead_id FROM campaign_leads 
        WHERE assigned_by = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can insert enrichments for accessible leads" ON lead_enrichments
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE 
      external_id IN (
        SELECT DISTINCT jsonb_array_elements_text(
          jsonb_extract_path(filters, 'user_id')
        ) 
        FROM lead_searches 
        WHERE user_id = auth.jwt() ->> 'sub'
      )
      OR id IN (
        SELECT lead_id FROM campaign_leads 
        WHERE assigned_by = auth.jwt() ->> 'sub'
      )
    )
  );

-- Email verifications policies
CREATE POLICY "Users can view verifications for accessible leads" ON email_verifications
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads WHERE 
      external_id IN (
        SELECT DISTINCT jsonb_array_elements_text(
          jsonb_extract_path(filters, 'user_id')
        ) 
        FROM lead_searches 
        WHERE user_id = auth.jwt() ->> 'sub'
      )
      OR id IN (
        SELECT lead_id FROM campaign_leads 
        WHERE assigned_by = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can insert verifications for accessible leads" ON email_verifications
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE 
      external_id IN (
        SELECT DISTINCT jsonb_array_elements_text(
          jsonb_extract_path(filters, 'user_id')
        ) 
        FROM lead_searches 
        WHERE user_id = auth.jwt() ->> 'sub'
      )
      OR id IN (
        SELECT lead_id FROM campaign_leads 
        WHERE assigned_by = auth.jwt() ->> 'sub'
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at (skip if already exists)
-- Note: update_leads_updated_at trigger already exists from 001_init.sql

-- Function to increment search count when lead is found again
CREATE OR REPLACE FUNCTION increment_lead_search_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads 
  SET 
    search_count = search_count + 1,
    last_searched_at = NOW()
  WHERE external_id = NEW.external_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for search count (will be triggered by application logic)

-- Comments for documentation
COMMENT ON TABLE leads IS 'Stores all discovered leads from various B2B data providers';
COMMENT ON TABLE lead_searches IS 'History of all lead searches performed by users';
COMMENT ON TABLE campaign_leads IS 'Junction table connecting leads to campaigns with outreach tracking';
COMMENT ON TABLE lead_enrichments IS 'History of lead data enrichment attempts';
COMMENT ON TABLE email_verifications IS 'Email verification results for leads';

COMMENT ON COLUMN leads.external_id IS 'Unique ID from data provider (e.g., zi_123, ap_456)';
COMMENT ON COLUMN leads.confidence IS 'Data quality confidence score from 0.00 to 1.00';
COMMENT ON COLUMN leads.technologies IS 'Array of technologies used by the lead''s company';
COMMENT ON COLUMN lead_searches.filters IS 'JSON object containing all search filters used';
COMMENT ON COLUMN campaign_leads.custom_fields IS 'User-defined custom data for this lead in this campaign'; 