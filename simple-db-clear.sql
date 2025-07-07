-- Simple Database Clear - Just the essentials
-- Copy and paste these queries one by one in Supabase SQL Editor

-- Delete child tables first to avoid foreign key constraints
DELETE FROM sequence_steps;
DELETE FROM messages;
DELETE FROM campaign_leads;
DELETE FROM campaign_drafts;

-- Delete main tables
DELETE FROM leads;
DELETE FROM campaigns;
DELETE FROM user_profiles;

-- Check that everything is cleared
SELECT COUNT(*) FROM campaigns;
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM campaign_leads;
SELECT COUNT(*) FROM user_profiles; 