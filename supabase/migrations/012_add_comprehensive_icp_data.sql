-- Add comprehensive ICP data to user_profile table
-- This migration extends the user_profile table to store detailed ICP analysis from AI web scraping

-- Add comprehensive ICP fields to user_profile table
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS core_offer TEXT,
ADD COLUMN IF NOT EXISTS industry_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS target_personas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS case_studies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lead_magnets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitive_advantages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_proof JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_pages_analyzed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_analysis_metadata JSONB DEFAULT '{}'::jsonb;

-- Add comprehensive website analysis table for storing detailed page analysis
CREATE TABLE IF NOT EXISTS website_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  
  -- Analysis details
  analysis_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'analyzing', 'completed', 'failed'
  total_pages_found INTEGER DEFAULT 0,
  pages_analyzed INTEGER DEFAULT 0,
  
  -- Core business intelligence
  core_offer TEXT,
  industry VARCHAR(255),
  business_model VARCHAR(255),
  target_market_summary TEXT,
  
  -- ICP Analysis Results
  icp_summary TEXT,
  target_personas JSONB DEFAULT '[]'::jsonb,
  case_studies JSONB DEFAULT '[]'::jsonb,
  lead_magnets JSONB DEFAULT '[]'::jsonb,
  competitive_advantages JSONB DEFAULT '[]'::jsonb,
  
  -- Technical and social proof
  tech_stack JSONB DEFAULT '[]'::jsonb,
  social_proof JSONB DEFAULT '[]'::jsonb,
  
  -- Analysis metadata
  pages_discovered JSONB DEFAULT '[]'::jsonb,
  analysis_duration_seconds INTEGER,
  ai_model_used VARCHAR(100),
  confidence_score DECIMAL(3,2),
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create page analysis details table for storing individual page analysis
CREATE TABLE IF NOT EXISTS page_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_analysis_id UUID REFERENCES website_analysis(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  page_type VARCHAR(100), -- 'homepage', 'about', 'services', 'pricing', 'case-study', 'blog', 'contact', 'other'
  
  -- Content analysis
  content_summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  
  -- ICP relevant data extracted
  personas_mentioned JSONB DEFAULT '[]'::jsonb,
  pain_points_identified JSONB DEFAULT '[]'::jsonb,
  solutions_offered JSONB DEFAULT '[]'::jsonb,
  case_studies_found JSONB DEFAULT '[]'::jsonb,
  testimonials JSONB DEFAULT '[]'::jsonb,
  
  -- Technical details
  load_time_ms INTEGER,
  content_length INTEGER,
  images_count INTEGER,
  
  -- Analysis metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  ai_confidence DECIMAL(3,2),
  processing_time_ms INTEGER
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_analysis_user_id ON website_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_website_analysis_organization_id ON website_analysis(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_analysis_status ON website_analysis(analysis_status);
CREATE INDEX IF NOT EXISTS idx_website_analysis_created_at ON website_analysis(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_analysis_website_id ON page_analysis(website_analysis_id);
CREATE INDEX IF NOT EXISTS idx_page_analysis_page_type ON page_analysis(page_type);
CREATE INDEX IF NOT EXISTS idx_page_analysis_analyzed_at ON page_analysis(analyzed_at DESC);

-- Enable RLS on new tables
ALTER TABLE website_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for website_analysis
CREATE POLICY "Users can view their own website analysis" ON website_analysis
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own website analysis" ON website_analysis
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own website analysis" ON website_analysis
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- RLS policies for page_analysis
CREATE POLICY "Users can view page analysis for their website analysis" ON page_analysis
  FOR SELECT USING (
    website_analysis_id IN (
      SELECT id FROM website_analysis WHERE user_id = (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can insert page analysis for their website analysis" ON page_analysis
  FOR INSERT WITH CHECK (
    website_analysis_id IN (
      SELECT id FROM website_analysis WHERE user_id = (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can update page analysis for their website analysis" ON page_analysis
  FOR UPDATE USING (
    website_analysis_id IN (
      SELECT id FROM website_analysis WHERE user_id = (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_website_analysis_updated_at 
  BEFORE UPDATE ON website_analysis 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get comprehensive ICP analysis for a user
CREATE OR REPLACE FUNCTION get_user_icp_analysis(user_uuid UUID)
RETURNS TABLE (
  website_url TEXT,
  core_offer TEXT,
  industry VARCHAR(255),
  icp_summary TEXT,
  target_personas JSONB,
  case_studies JSONB,
  lead_magnets JSONB,
  competitive_advantages JSONB,
  tech_stack JSONB,
  social_proof JSONB,
  confidence_score DECIMAL(3,2),
  analysis_completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa.website_url,
    wa.core_offer,
    wa.industry,
    wa.icp_summary,
    wa.target_personas,
    wa.case_studies,
    wa.lead_magnets,
    wa.competitive_advantages,
    wa.tech_stack,
    wa.social_proof,
    wa.confidence_score,
    wa.completed_at
  FROM website_analysis wa
  WHERE wa.user_id = user_uuid 
    AND wa.analysis_status = 'completed'
  ORDER BY wa.completed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE website_analysis IS 'Stores comprehensive AI-powered website analysis and ICP data';
COMMENT ON TABLE page_analysis IS 'Stores detailed analysis of individual pages during website scraping';
COMMENT ON FUNCTION get_user_icp_analysis IS 'Retrieves the latest completed ICP analysis for a user';

-- Grant necessary permissions
GRANT ALL ON website_analysis TO authenticated;
GRANT ALL ON page_analysis TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 