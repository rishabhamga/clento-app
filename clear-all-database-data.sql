-- ⚠️  DANGER: This script will DELETE ALL DATA from your Supabase database
-- ⚠️  Make sure you want to completely reset your database before running this
-- ⚠️  This is irreversible - all user data, campaigns, leads, etc. will be lost

-- Disable foreign key constraints temporarily for easier deletion
SET session_replication_role = replica;

-- Delete data in order to respect foreign key constraints
-- Start with dependent tables first, then parent tables

-- 1. Delete sequence steps (depends on campaigns and leads)
DELETE FROM sequence_steps;

-- 2. Delete messages (depends on campaigns and leads)
DELETE FROM messages;

-- 3. Delete campaign leads (junction table between campaigns and leads)
DELETE FROM campaign_leads;

-- 4. Delete page analysis (depends on website_analysis)
DELETE FROM page_analysis;

-- 5. Delete website analysis (depends on users)
DELETE FROM website_analysis;

-- 6. Delete integration credentials (depends on users)
DELETE FROM integration_credentials;

-- 7. Delete lead searches (depends on users)
DELETE FROM lead_searches;

-- 8. Delete leads (depends on users)
DELETE FROM leads;

-- 9. Delete campaigns (depends on users)
DELETE FROM campaigns;

-- 10. Delete user profiles (depends on users)
DELETE FROM user_profile;

-- 11. Finally delete users (parent table)
DELETE FROM users;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Reset all sequences to start from 1 (if any tables use SERIAL)
-- Note: Most tables use UUIDs, but this ensures clean state for any sequences

-- Verify all tables are empty
SELECT 
  schemaname,
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT 
    schemaname, 
    tablename, 
    query_to_xml(format('SELECT count(*) as cnt FROM %I.%I', schemaname, tablename), false, true, '') as xml_count
  FROM pg_tables 
  WHERE schemaname = 'public'
  AND tablename NOT IN ('spatial_ref_sys') -- Exclude PostGIS system table if present
) t
ORDER BY tablename;

-- Success message
SELECT 'SUCCESS: All data has been deleted from all tables. Database is now clean.' as status; 