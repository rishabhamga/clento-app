-- Add organization support to the database
-- This migration adds organization tables and updates existing tables to support multi-tenancy

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_org_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  industry TEXT,
  company_size VARCHAR(50),
  
  -- Billing and limits
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  billing_email TEXT,
  subscription_status VARCHAR(50) DEFAULT 'active',
  
  -- Usage limits
  monthly_campaign_limit INTEGER DEFAULT 5,
  monthly_lead_limit INTEGER DEFAULT 1000,
  user_limit INTEGER DEFAULT 5,
  
  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization members table (maps Clerk users to organizations)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role information
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE campaign_leads 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE linkedin_accounts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization context to campaign_drafts
ALTER TABLE campaign_drafts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations (FIXED)
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
      AND om.status = 'active'
    )
  );

CREATE POLICY "Organization admins can update organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view organization members of their orgs" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT om2.organization_id FROM organization_members om2
      JOIN users u ON u.id = om2.user_id
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
      AND om2.status = 'active'
    )
  );

-- Update existing RLS policies to include organization context
-- Campaigns policy update
DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
CREATE POLICY "Users can view organization campaigns" ON campaigns
  FOR SELECT USING (
    -- Personal campaigns (backward compatibility)
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    OR
    -- Organization campaigns
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
      AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
CREATE POLICY "Users can insert organization campaigns" ON campaigns
  FOR INSERT WITH CHECK (
    -- Personal campaigns (backward compatibility)
    (user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub') AND organization_id IS NULL)
    OR
    -- Organization campaigns
    (organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
      AND om.status = 'active'
      AND om.role IN ('admin', 'member')
    ))
  );

-- Leads policy update
DROP POLICY IF EXISTS "Users can view leads they discovered" ON leads;
CREATE POLICY "Users can view organization leads" ON leads
  FOR SELECT USING (
    -- Personal leads (backward compatibility)
    (organization_id IS NULL AND (
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
    ))
    OR
    -- Organization leads
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
      AND om.status = 'active'
    )
  );

-- Helper functions for organization management
CREATE OR REPLACE FUNCTION get_user_organizations(user_clerk_id TEXT)
RETURNS TABLE (
  id UUID,
  clerk_org_id TEXT,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  role VARCHAR(50),
  status VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.clerk_org_id,
    o.name,
    o.slug,
    o.logo_url,
    om.role,
    om.status
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  JOIN users u ON u.id = om.user_id
  WHERE u.clerk_id = user_clerk_id
    AND om.status = 'active'
  ORDER BY om.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create organization and add creator as admin
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  p_clerk_org_id TEXT,
  p_name TEXT,
  p_slug TEXT,
  p_user_clerk_id TEXT,
  p_logo_url TEXT DEFAULT NULL,
  p_website_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
  user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM users WHERE clerk_id = p_user_clerk_id;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Create organization
  INSERT INTO organizations (clerk_org_id, name, slug, logo_url, website_url)
  VALUES (p_clerk_org_id, p_name, p_slug, p_logo_url, p_website_url)
  RETURNING id INTO org_id;
  
  -- Add creator as admin
  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (org_id, user_id, 'admin', 'active');
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization context for campaigns
CREATE OR REPLACE FUNCTION get_organization_campaigns(p_organization_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  creator_name TEXT,
  total_leads BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.status,
    c.created_at,
    c.updated_at,
    u.full_name as creator_name,
    COUNT(cl.id) as total_leads
  FROM campaigns c
  LEFT JOIN users u ON u.id = c.user_id
  LEFT JOIN campaign_leads cl ON cl.campaign_id = c.id
  WHERE c.organization_id = p_organization_id
  GROUP BY c.id, c.name, c.description, c.status, c.created_at, c.updated_at, u.full_name
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at 
  BEFORE UPDATE ON organization_members 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE organizations IS 'Organizations for multi-tenant B2B functionality';
COMMENT ON TABLE organization_members IS 'Maps users to organizations with roles and permissions';
COMMENT ON COLUMN organizations.plan IS 'Billing plan: free, starter, pro, enterprise';
COMMENT ON COLUMN organization_members.role IS 'User role within organization: admin, member, viewer'; 