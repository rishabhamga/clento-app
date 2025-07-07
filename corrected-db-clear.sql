-- Corrected Database Clear Script
-- Based on your actual database schema from the screenshot

-- Delete child tables first to avoid foreign key constraints
DELETE FROM sequence_steps;
DELETE FROM messages;
DELETE FROM campaign_leads;

-- Delete main tables
DELETE FROM leads;
DELETE FROM campaigns;

-- Delete user profile (singular, not plural)
DELETE FROM user_profile;

-- Delete integration credentials if needed
DELETE FROM integration_credentials;

-- Check that everything is cleared
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
SELECT 'user_profile' as table_name, COUNT(*) as count FROM user_profile
UNION ALL
SELECT 'integration_credentials' as table_name, COUNT(*) as count FROM integration_credentials; 