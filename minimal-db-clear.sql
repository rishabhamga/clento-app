-- Minimal Database Clear - Just the essentials
-- Run these queries one by one in Supabase SQL Editor

-- Delete child tables first
DELETE FROM sequence_steps;
DELETE FROM messages;
DELETE FROM campaign_leads;

-- Delete main tables
DELETE FROM leads;
DELETE FROM campaigns;
DELETE FROM user_profile;

-- Quick verification
SELECT COUNT(*) FROM campaigns;
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM campaign_leads; 