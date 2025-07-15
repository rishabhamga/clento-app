-- Add ICP Filter Profiles table for storing structured ICP filters
-- This migration creates tables to store user-defined ICP filter profiles for reuse

-- Create ICP filter profiles table
CREATE TABLE IF NOT EXISTS icp_filter_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Profile metadata
  profile_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Structured filter data (stored as JSON for flexibility)
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Search configuration
  search_type VARCHAR(50) DEFAULT 'people', -- 'people', 'companies', or 'both'
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create saved searches table for storing search results
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  icp_profile_id UUID REFERENCES icp_filter_profiles(id) ON DELETE CASCADE,
  
  -- Search metadata
  search_name VARCHAR(255) NOT NULL,
  total_results_count INTEGER DEFAULT 0,
  
  -- Search execution details
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  execution_time_ms INTEGER,
  
  -- Results summary (for quick preview)
  results_summary JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_icp_filter_profiles_user_id ON icp_filter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_icp_filter_profiles_organization_id ON icp_filter_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_icp_filter_profiles_created_at ON icp_filter_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_icp_filter_profiles_last_used ON icp_filter_profiles(last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_icp_profile_id ON saved_searches(icp_profile_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_executed_at ON saved_searches(executed_at DESC);

-- Enable RLS on new tables
ALTER TABLE icp_filter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies for icp_filter_profiles
CREATE POLICY "Users can view their own ICP filter profiles" ON icp_filter_profiles
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own ICP filter profiles" ON icp_filter_profiles
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own ICP filter profiles" ON icp_filter_profiles
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete their own ICP filter profiles" ON icp_filter_profiles
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- RLS policies for saved_searches
CREATE POLICY "Users can view their own saved searches" ON saved_searches
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own saved searches" ON saved_searches
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own saved searches" ON saved_searches
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete their own saved searches" ON saved_searches
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Add updated_at triggers
CREATE TRIGGER update_icp_filter_profiles_updated_at 
  BEFORE UPDATE ON icp_filter_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage count when a profile is used
CREATE OR REPLACE FUNCTION increment_profile_usage(profile_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE icp_filter_profiles 
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular ICP profiles for a user
CREATE OR REPLACE FUNCTION get_popular_icp_profiles(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  profile_name VARCHAR(255),
  description TEXT,
  filters JSONB,
  search_type VARCHAR(50),
  usage_count INTEGER,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ifp.id,
    ifp.profile_name,
    ifp.description,
    ifp.filters,
    ifp.search_type,
    ifp.usage_count,
    ifp.last_used_at,
    ifp.created_at
  FROM icp_filter_profiles ifp
  WHERE ifp.user_id = user_uuid
  ORDER BY ifp.usage_count DESC, ifp.last_used_at DESC NULLS LAST, ifp.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE icp_filter_profiles IS 'Stores user-defined ICP filter profiles for reuse across campaigns';
COMMENT ON TABLE saved_searches IS 'Stores search execution results and metadata for ICP profiles';
COMMENT ON FUNCTION increment_profile_usage IS 'Increments usage count and updates last_used_at for an ICP profile';
COMMENT ON FUNCTION get_popular_icp_profiles IS 'Retrieves most used ICP profiles for a user';

-- Grant necessary permissions
GRANT ALL ON icp_filter_profiles TO authenticated;
GRANT ALL ON saved_searches TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 