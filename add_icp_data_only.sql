-- Add comprehensive ICP data to existing user_profile table
-- This script adds only the new ICP-related fields without affecting existing schema

-- First, let's add the new columns to user_profile table (if they don't exist)
DO $$
BEGIN
    -- Add core_offer column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'core_offer') THEN
        ALTER TABLE user_profile ADD COLUMN core_offer TEXT;
    END IF;
    
    -- Add icp_summary column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'icp_summary') THEN
        ALTER TABLE user_profile ADD COLUMN icp_summary TEXT;
    END IF;
    
    -- Add target_personas column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'target_personas') THEN
        ALTER TABLE user_profile ADD COLUMN target_personas JSONB;
    END IF;
    
    -- Add case_studies column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'case_studies') THEN
        ALTER TABLE user_profile ADD COLUMN case_studies JSONB;
    END IF;
    
    -- Add lead_magnets column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'lead_magnets') THEN
        ALTER TABLE user_profile ADD COLUMN lead_magnets JSONB;
    END IF;
    
    -- Add competitive_advantages column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'competitive_advantages') THEN
        ALTER TABLE user_profile ADD COLUMN competitive_advantages TEXT[];
    END IF;
    
    -- Add technology_stack column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'technology_stack') THEN
        ALTER TABLE user_profile ADD COLUMN technology_stack TEXT[];
    END IF;
    
    -- Add social_proof column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'social_proof') THEN
        ALTER TABLE user_profile ADD COLUMN social_proof JSONB;
    END IF;
    
    -- Add website_analyzed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'website_analyzed_at') THEN
        ALTER TABLE user_profile ADD COLUMN website_analyzed_at TIMESTAMPTZ;
    END IF;
    
    -- Add analysis_version column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profile' AND column_name = 'analysis_version') THEN
        ALTER TABLE user_profile ADD COLUMN analysis_version INTEGER DEFAULT 1;
    END IF;
END
$$;

-- Create website_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS website_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Analysis results
    core_offer TEXT,
    icp_summary TEXT,
    target_personas JSONB DEFAULT '[]'::jsonb,
    case_studies JSONB DEFAULT '[]'::jsonb,
    lead_magnets JSONB DEFAULT '[]'::jsonb,
    competitive_advantages TEXT[] DEFAULT '{}',
    technology_stack TEXT[] DEFAULT '{}',
    social_proof JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    pages_analyzed INTEGER DEFAULT 0,
    total_pages_found INTEGER DEFAULT 0,
    analysis_duration_seconds INTEGER,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create page_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS page_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_analysis_id UUID NOT NULL REFERENCES website_analysis(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    content_summary TEXT,
    key_insights JSONB DEFAULT '[]'::jsonb,
    page_type TEXT, -- 'homepage', 'about', 'services', 'case-study', 'blog', 'product', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_analysis_user_id ON website_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_website_analysis_status ON website_analysis(status);
CREATE INDEX IF NOT EXISTS idx_website_analysis_created_at ON website_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_page_analysis_website_analysis_id ON page_analysis(website_analysis_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_website_analyzed_at ON user_profile(website_analyzed_at);

-- Enable RLS on new tables
ALTER TABLE website_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for website_analysis
CREATE POLICY IF NOT EXISTS "Users can view their own website analysis" ON website_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own website analysis" ON website_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own website analysis" ON website_analysis
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own website analysis" ON website_analysis
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for page_analysis
CREATE POLICY IF NOT EXISTS "Users can view their own page analysis" ON page_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM website_analysis wa 
            WHERE wa.id = page_analysis.website_analysis_id 
            AND wa.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can insert their own page analysis" ON page_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM website_analysis wa 
            WHERE wa.id = page_analysis.website_analysis_id 
            AND wa.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update their own page analysis" ON page_analysis
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM website_analysis wa 
            WHERE wa.id = page_analysis.website_analysis_id 
            AND wa.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can delete their own page analysis" ON page_analysis
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM website_analysis wa 
            WHERE wa.id = page_analysis.website_analysis_id 
            AND wa.user_id = auth.uid()
        )
    );

-- Helper function to get latest ICP analysis for a user
CREATE OR REPLACE FUNCTION get_user_icp_analysis(user_uuid UUID)
RETURNS TABLE (
    core_offer TEXT,
    icp_summary TEXT,
    target_personas JSONB,
    case_studies JSONB,
    lead_magnets JSONB,
    competitive_advantages TEXT[],
    technology_stack TEXT[],
    social_proof JSONB,
    analyzed_at TIMESTAMPTZ,
    analysis_version INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.core_offer,
        up.icp_summary,
        up.target_personas,
        up.case_studies,
        up.lead_magnets,
        up.competitive_advantages,
        up.technology_stack,
        up.social_proof,
        up.website_analyzed_at,
        up.analysis_version
    FROM user_profile up
    WHERE up.user_id = user_uuid;
END;
$$;

-- Function to update user profile with ICP analysis results
CREATE OR REPLACE FUNCTION update_user_icp_from_analysis(
    user_uuid UUID,
    analysis_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profile 
    SET 
        core_offer = wa.core_offer,
        icp_summary = wa.icp_summary,
        target_personas = wa.target_personas,
        case_studies = wa.case_studies,
        lead_magnets = wa.lead_magnets,
        competitive_advantages = wa.competitive_advantages,
        technology_stack = wa.technology_stack,
        social_proof = wa.social_proof,
        website_analyzed_at = wa.completed_at,
        analysis_version = COALESCE(user_profile.analysis_version, 0) + 1,
        updated_at = NOW()
    FROM website_analysis wa
    WHERE user_profile.user_id = user_uuid
    AND wa.id = analysis_id
    AND wa.user_id = user_uuid
    AND wa.status = 'completed';
END;
$$; 