-- Add user_profile table for onboarding data
-- This migration adds the user_profile table for storing onboarding-specific data

CREATE TABLE user_profile (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  website_url TEXT,
  site_summary TEXT,
  icp JSONB DEFAULT '{}',
  linkedin_connected BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Enable Row Level Security (RLS) on user_profile table
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profile table
CREATE POLICY "Users can view own profile" ON user_profile FOR SELECT USING (
  user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "Users can insert own profile" ON user_profile FOR INSERT WITH CHECK (
  user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "Users can update own profile" ON user_profile FOR UPDATE USING (
  user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
);

-- Create trigger for updated_at column
CREATE TRIGGER update_user_profile_updated_at 
  BEFORE UPDATE ON user_profile 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_profile TO authenticated; 