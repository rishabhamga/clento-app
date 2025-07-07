-- Add LinkedIn accounts table for storing user's connected LinkedIn accounts
-- Users can connect up to 10 LinkedIn accounts for outreach

CREATE TABLE IF NOT EXISTS linkedin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- LinkedIn OAuth data
  linkedin_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Profile information
  profile_data JSONB DEFAULT '{}'::jsonb,
  display_name VARCHAR(255),
  profile_picture_url TEXT,
  headline TEXT,
  industry VARCHAR(255),
  location VARCHAR(255),
  
  -- Account status and usage
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  daily_message_count INTEGER DEFAULT 0,
  daily_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Rate limiting and safety
  is_rate_limited BOOLEAN DEFAULT false,
  rate_limit_reset_at TIMESTAMPTZ,
  last_message_sent_at TIMESTAMPTZ,
  
  -- Account health
  connection_status VARCHAR(50) DEFAULT 'connected', -- 'connected', 'expired', 'revoked', 'error'
  last_error TEXT,
  health_check_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to limit users to maximum 10 LinkedIn accounts
CREATE OR REPLACE FUNCTION check_linkedin_account_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM linkedin_accounts WHERE user_id = NEW.user_id AND is_active = true) >= 10 THEN
    RAISE EXCEPTION 'User cannot have more than 10 active LinkedIn accounts';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_linkedin_account_limit
  BEFORE INSERT ON linkedin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION check_linkedin_account_limit();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_user_id ON linkedin_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_linkedin_id ON linkedin_accounts(linkedin_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_is_active ON linkedin_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_connection_status ON linkedin_accounts(connection_status);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_created_at ON linkedin_accounts(created_at DESC);

-- Add unique constraint to prevent duplicate LinkedIn accounts per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_linkedin 
  ON linkedin_accounts(user_id, linkedin_id) 
  WHERE is_active = true;

-- Enable RLS on new table
ALTER TABLE linkedin_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for linkedin_accounts
CREATE POLICY "Users can view their own LinkedIn accounts" ON linkedin_accounts
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own LinkedIn accounts" ON linkedin_accounts
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own LinkedIn accounts" ON linkedin_accounts
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete their own LinkedIn accounts" ON linkedin_accounts
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Add updated_at trigger
CREATE TRIGGER update_linkedin_accounts_updated_at 
  BEFORE UPDATE ON linkedin_accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get active LinkedIn accounts for a user
CREATE OR REPLACE FUNCTION get_user_linkedin_accounts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  linkedin_id VARCHAR(255),
  display_name VARCHAR(255),
  profile_picture_url TEXT,
  headline TEXT,
  industry VARCHAR(255),
  location VARCHAR(255),
  is_active BOOLEAN,
  connection_status VARCHAR(50),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER,
  daily_message_count INTEGER,
  connected_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.id,
    la.linkedin_id,
    la.display_name,
    la.profile_picture_url,
    la.headline,
    la.industry,
    la.location,
    la.is_active,
    la.connection_status,
    la.last_used_at,
    la.usage_count,
    la.daily_message_count,
    la.connected_at
  FROM linkedin_accounts la
  WHERE la.user_id = user_uuid 
    AND la.is_active = true
  ORDER BY la.connected_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily message count and reset if needed
CREATE OR REPLACE FUNCTION update_linkedin_daily_usage(
  account_id UUID,
  increment_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  account_exists BOOLEAN;
BEGIN
  -- Check if account exists and is active
  SELECT EXISTS(
    SELECT 1 FROM linkedin_accounts 
    WHERE id = account_id AND is_active = true
  ) INTO account_exists;
  
  IF NOT account_exists THEN
    RETURN FALSE;
  END IF;

  -- Update the account with daily reset logic
  UPDATE linkedin_accounts 
  SET 
    daily_message_count = CASE 
      WHEN daily_reset_date < current_date_val THEN increment_count
      ELSE daily_message_count + increment_count
    END,
    daily_reset_date = current_date_val,
    usage_count = usage_count + increment_count,
    last_used_at = NOW(),
    last_message_sent_at = NOW(),
    updated_at = NOW()
  WHERE id = account_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add to user_profile table to track onboarding completion
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step_completed JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS linkedin_accounts_connected INTEGER DEFAULT 0;

-- Comments for documentation
COMMENT ON TABLE linkedin_accounts IS 'Stores user LinkedIn account connections for outreach (max 10 per user)';
COMMENT ON FUNCTION get_user_linkedin_accounts IS 'Retrieves active LinkedIn accounts for a user';
COMMENT ON FUNCTION update_linkedin_daily_usage IS 'Updates daily message count with automatic reset logic';

-- Grant necessary permissions
GRANT ALL ON linkedin_accounts TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 