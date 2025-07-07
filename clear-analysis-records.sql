-- Clear existing website analysis records to test with fresh data
-- This removes analysis records that may have been created with failed scraping

-- First, check existing analysis records
SELECT 
    'Current analysis records:' as info,
    id,
    website_url,
    status,
    core_offer,
    industry,
    confidence_score,
    created_at
FROM website_analysis 
ORDER BY created_at DESC;

-- Delete all existing analysis records
-- (You can modify this to only delete specific ones if needed)
DELETE FROM website_analysis;

-- Also clear related page analysis records if any exist
DELETE FROM page_analysis;

-- Verify deletion
SELECT 'After cleanup:' as info, count(*) as remaining_records FROM website_analysis; 