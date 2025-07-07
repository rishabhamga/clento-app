-- Create campaign_drafts table for saving campaign drafts
CREATE TABLE IF NOT EXISTS campaign_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT 'Untitled Campaign',
  website_url TEXT,
  website_analysis JSONB,
  offering_description TEXT,
  pain_points JSONB DEFAULT '[]'::jsonb,
  proof_points JSONB DEFAULT '[]'::jsonb,
  coaching_points JSONB DEFAULT '[]'::jsonb,
  email_body_coaching JSONB DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  selected_leads JSONB DEFAULT '[]'::jsonb,
  current_step TEXT DEFAULT 'targeting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_drafts_user_id ON campaign_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_drafts_updated_at ON campaign_drafts(updated_at);
CREATE INDEX IF NOT EXISTS idx_campaign_drafts_user_campaign ON campaign_drafts(user_id, campaign_name);

-- Enable RLS
ALTER TABLE campaign_drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own campaign drafts" ON campaign_drafts
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own campaign drafts" ON campaign_drafts
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own campaign drafts" ON campaign_drafts
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own campaign drafts" ON campaign_drafts
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaign_drafts_updated_at 
  BEFORE UPDATE ON campaign_drafts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 