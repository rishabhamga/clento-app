/**
 * Database Constraints Fix Script
 * This script fixes the constraint violations in campaign_leads and sequence_steps tables
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixConstraints() {
  console.log('🔧 Fixing database constraints...')

  try {
    // 1. Fix campaign_leads status constraint
    console.log('1. Fixing campaign_leads status constraint...')
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_status_check;
        ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_status_check 
        CHECK (status IN ('pending', 'active', 'contacted', 'replied', 'converted', 'bounced', 'unsubscribed', 'paused', 'completed', 'opted_out'));
      `
    })

    // 2. Fix sequence_steps channel constraint
    console.log('2. Fixing sequence_steps channel constraint...')
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_channel_check;
        ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_channel_check 
        CHECK (channel IN ('email', 'linkedin', 'linkedin_invite', 'linkedin_message'));
      `
    })

    // 3. Fix sequence_steps status constraint
    console.log('3. Fixing sequence_steps status constraint...')
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_status_check;
        ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_status_check 
        CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'skipped', 'delivered', 'opened', 'clicked', 'replied', 'bounced'));
      `
    })

    // 4. Update associate_lead_with_campaign function
    console.log('4. Updating associate_lead_with_campaign function...')
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION associate_lead_with_campaign(
            p_campaign_id UUID,
            p_lead_id UUID,
            p_assigned_by VARCHAR(255)
        ) RETURNS UUID AS $$
        DECLARE
            campaign_lead_id UUID;
        BEGIN
            INSERT INTO campaign_leads (campaign_id, lead_id, assigned_by, status)
            VALUES (p_campaign_id, p_lead_id, p_assigned_by, 'pending')
            ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
                assigned_by = EXCLUDED.assigned_by,
                assigned_at = NOW(),
                status = EXCLUDED.status
            RETURNING id INTO campaign_lead_id;
            
            RETURN campaign_lead_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    console.log('✅ Database constraints fixed successfully!')
    console.log('✅ You can now create campaigns without constraint violations.')

  } catch (error) {
    console.error('❌ Error fixing constraints:', error)
    console.log('\n📋 Manual SQL to run in Supabase Dashboard:')
    console.log(`
-- 1. Fix campaign_leads status constraint
ALTER TABLE campaign_leads DROP CONSTRAINT IF EXISTS campaign_leads_status_check;
ALTER TABLE campaign_leads ADD CONSTRAINT campaign_leads_status_check 
CHECK (status IN ('pending', 'active', 'contacted', 'replied', 'converted', 'bounced', 'unsubscribed', 'paused', 'completed', 'opted_out'));

-- 2. Fix sequence_steps channel constraint
ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_channel_check;
ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_channel_check 
CHECK (channel IN ('email', 'linkedin', 'linkedin_invite', 'linkedin_message'));

-- 3. Fix sequence_steps status constraint
ALTER TABLE sequence_steps DROP CONSTRAINT IF EXISTS sequence_steps_status_check;
ALTER TABLE sequence_steps ADD CONSTRAINT sequence_steps_status_check 
CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'skipped', 'delivered', 'opened', 'clicked', 'replied', 'bounced'));

-- 4. Update associate_lead_with_campaign function
CREATE OR REPLACE FUNCTION associate_lead_with_campaign(
    p_campaign_id UUID,
    p_lead_id UUID,
    p_assigned_by VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
    campaign_lead_id UUID;
BEGIN
    INSERT INTO campaign_leads (campaign_id, lead_id, assigned_by, status)
    VALUES (p_campaign_id, p_lead_id, p_assigned_by, 'pending')
    ON CONFLICT (campaign_id, lead_id) DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = NOW(),
        status = EXCLUDED.status
    RETURNING id INTO campaign_lead_id;
    
    RETURN campaign_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
    process.exit(1)
  }
}

fixConstraints() 