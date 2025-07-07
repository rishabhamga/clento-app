-- Clear Database Script
-- Run this SQL in your Supabase Dashboard > SQL Editor to delete all data
-- This will give you a fresh start for testing campaigns and user signups

-- IMPORTANT: This will delete ALL data from your database
-- Make sure you have backups if you need to restore any data

-- Disable triggers temporarily (optional, for faster deletion)
SET session_replication_role = replica;

-- Delete in order to avoid foreign key constraint violations
-- Delete child tables first, then parent tables

-- 1. Delete sequence steps (references campaigns and leads)
DELETE FROM sequence_steps;

-- 2. Delete messages (references campaigns and leads)
DELETE FROM messages;

-- 3. Delete campaign leads (references campaigns and leads)  
DELETE FROM campaign_leads;

-- 4. Delete campaign drafts (references campaigns)
DELETE FROM campaign_drafts;

-- 5. Delete leads (no foreign key dependencies)
DELETE FROM leads;

-- 6. Delete campaigns (references user profiles)
DELETE FROM campaigns;

-- 7. Delete user profiles (references auth.users)
DELETE FROM user_profiles;

-- 8. Delete auth users (Clerk manages this, but if you have test users)
-- Note: If you're using Clerk, you might want to skip this and delete users from Clerk dashboard instead
-- DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences to start from 1 (optional)
-- This will reset auto-increment IDs back to 1
ALTER SEQUENCE campaigns_id_seq RESTART WITH 1;
ALTER SEQUENCE leads_id_seq RESTART WITH 1;
ALTER SEQUENCE sequence_steps_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE campaign_leads_id_seq RESTART WITH 1;
ALTER SEQUENCE campaign_drafts_id_seq RESTART WITH 1;
ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 'campaigns' as table_name, COUNT(*) as count FROM campaigns
UNION ALL
SELECT 'leads' as table_name, COUNT(*) as count FROM leads  
UNION ALL
SELECT 'campaign_leads' as table_name, COUNT(*) as count FROM campaign_leads
UNION ALL
SELECT 'sequence_steps' as table_name, COUNT(*) as count FROM sequence_steps
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM messages
UNION ALL
SELECT 'campaign_drafts' as table_name, COUNT(*) as count FROM campaign_drafts
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles;

-- Success message
SELECT 'Database cleared successfully! All tables are now empty.' as status; 