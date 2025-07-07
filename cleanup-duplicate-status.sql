-- Clean up duplicate status columns in website_analysis table
-- This script removes the redundant 'analysis_status' column since 'status' already serves this purpose

-- 1. First, check if both columns exist and their current values
SELECT 
    'Current column status' as info,
    status,
    analysis_status,
    count(*) as record_count
FROM website_analysis 
GROUP BY status, analysis_status
ORDER BY status, analysis_status;

-- 2. Ensure status column has the values from analysis_status if they differ
-- Update status column to match analysis_status where they might differ
UPDATE website_analysis 
SET status = analysis_status 
WHERE status != analysis_status AND analysis_status IS NOT NULL;

-- 3. Drop the redundant analysis_status column
ALTER TABLE website_analysis DROP COLUMN IF EXISTS analysis_status;

-- 4. Verify the cleanup
SELECT 'After cleanup - distinct status values' as info, status, count(*) 
FROM website_analysis 
GROUP BY status 
ORDER BY status;

-- 5. Show the current schema for website_analysis table (key columns)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'website_analysis' 
    AND column_name IN ('id', 'user_id', 'website_url', 'status')
ORDER BY ordinal_position; 