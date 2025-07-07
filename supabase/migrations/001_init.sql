-- Initial database schema for AI SDR Platform
-- This migration creates the core tables for users, leads, campaigns, sequences, and messages

-- Create users table (extends Clerk auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  company TEXT,
  title TEXT,
  industry TEXT,
  location TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'positive', 'neutral', 'negative', 'unsubscribed')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'zoominfo', 'apollo', 'clearbit', 'website_visitor')),
  enrichment_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on email to prevent duplicates per user
CREATE UNIQUE INDEX leads_user_email_unique ON leads(user_id, email) WHERE email IS NOT NULL;

-- Create campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  sequence_template TEXT DEFAULT 'email_first',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sequence_steps table for campaign automation
CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin_invite', 'linkedin_message')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'skipped')),
  send_time TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying of due sequence steps
CREATE INDEX sequence_steps_send_time_idx ON sequence_steps(send_time) WHERE status IN ('pending', 'scheduled');
CREATE INDEX sequence_steps_campaign_lead_idx ON sequence_steps(campaign_id, lead_id);

-- Create messages table for conversation history
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'phone', 'other')),
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'replied', 'bounced')),
  external_id TEXT, -- for tracking email/LinkedIn message IDs
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient message querying
CREATE INDEX messages_lead_id_idx ON messages(lead_id);
CREATE INDEX messages_campaign_id_idx ON messages(campaign_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);

-- Create campaign_leads junction table for many-to-many relationship
CREATE TABLE campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'opted_out')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- Create integration_credentials table for storing encrypted API keys
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'linkedin', 'phantombuster', 'zoominfo', 'apollo')),
  credentials JSONB NOT NULL, -- encrypted credentials
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- Create RLS policies for leads table
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Create RLS policies for campaigns table
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Create RLS policies for sequence_steps table
CREATE POLICY "Users can view own sequence steps" ON sequence_steps FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can insert own sequence steps" ON sequence_steps FOR INSERT WITH CHECK (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can update own sequence steps" ON sequence_steps FOR UPDATE USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can delete own sequence steps" ON sequence_steps FOR DELETE USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);

-- Create RLS policies for messages table
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  lead_id IN (SELECT id FROM leads WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
  lead_id IN (SELECT id FROM leads WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (
  lead_id IN (SELECT id FROM leads WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);

-- Create RLS policies for campaign_leads table
CREATE POLICY "Users can view own campaign leads" ON campaign_leads FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can insert own campaign leads" ON campaign_leads FOR INSERT WITH CHECK (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can update own campaign leads" ON campaign_leads FOR UPDATE USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can delete own campaign leads" ON campaign_leads FOR DELETE USING (
  campaign_id IN (SELECT id FROM campaigns WHERE user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'))
);

-- Create RLS policies for integration_credentials table
CREATE POLICY "Users can view own credentials" ON integration_credentials FOR SELECT USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own credentials" ON integration_credentials FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own credentials" ON integration_credentials FOR UPDATE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete own credentials" ON integration_credentials FOR DELETE USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sequence_steps_updated_at BEFORE UPDATE ON sequence_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_credentials_updated_at BEFORE UPDATE ON integration_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create some useful functions for analytics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_leads BIGINT,
  total_campaigns BIGINT,
  active_campaigns BIGINT,
  messages_sent BIGINT,
  replies_received BIGINT,
  positive_replies BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM leads WHERE leads.user_id = user_uuid),
    (SELECT COUNT(*) FROM campaigns WHERE campaigns.user_id = user_uuid),
    (SELECT COUNT(*) FROM campaigns WHERE campaigns.user_id = user_uuid AND status = 'active'),
    (SELECT COUNT(*) FROM messages 
     WHERE messages.lead_id IN (SELECT id FROM leads WHERE leads.user_id = user_uuid) 
     AND direction = 'outbound'),
    (SELECT COUNT(*) FROM messages 
     WHERE messages.lead_id IN (SELECT id FROM leads WHERE leads.user_id = user_uuid) 
     AND direction = 'inbound'),
    (SELECT COUNT(*) FROM leads WHERE leads.user_id = user_uuid AND status = 'positive');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 