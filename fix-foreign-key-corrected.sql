-- CORRECTED: Fix foreign key constraint issues
-- This script checks and fixes the foreign key constraint on website_analysis table

-- 1. Check current foreign key constraint details (corrected query)
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    
    -- Check the data types of both columns separately
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'website_analysis' AND column_name = 'user_id') as wa_user_id_type,
     
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'users' AND column_name = 'id') as users_id_type

FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'website_analysis';

-- 2. Check the exact column definitions for both tables
SELECT 
    'users.id' as column_identifier,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id'

UNION ALL

SELECT 
    'website_analysis.user_id' as column_identifier,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'website_analysis' AND column_name = 'user_id';

-- 3. Check table contents to ensure they exist
SELECT 'Users count' as info, count(*) as count FROM users
UNION ALL
SELECT 'Website analysis count' as info, count(*) as count FROM website_analysis;

-- 4. Show existing users for reference
SELECT 'Sample user data:' as info, id::text as data FROM users LIMIT 3;

-- 5. Drop and recreate the foreign key constraint properly
DO $$
BEGIN
    -- First, drop the existing constraint
    ALTER TABLE website_analysis DROP CONSTRAINT IF EXISTS website_analysis_user_id_fkey;
    RAISE NOTICE 'Dropped existing foreign key constraint';
    
    -- Ensure both columns are UUID type before creating the constraint
    -- Check if user_id is not UUID and convert if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'website_analysis' 
        AND column_name = 'user_id' 
        AND data_type != 'uuid'
    ) THEN
        -- Convert user_id column to UUID if it's not already
        ALTER TABLE website_analysis ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
        RAISE NOTICE 'Converted website_analysis.user_id to UUID type';
    END IF;
    
    -- Now recreate the foreign key constraint
    ALTER TABLE website_analysis 
    ADD CONSTRAINT website_analysis_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint recreated successfully';
    
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to recreate foreign key constraint: %', SQLERRM;
END $$;

-- 6. Test the foreign key constraint with existing user data
DO $$
DECLARE
    test_user_id uuid;
    test_analysis_id uuid;
BEGIN
    -- Get an existing user ID from the users table
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in database - please check users table';
    END IF;
    
    RAISE NOTICE 'Testing foreign key constraint with user ID: %', test_user_id;
    
    -- Try to insert a test analysis record
    INSERT INTO website_analysis (user_id, website_url, analysis_status, started_at, created_at)
    VALUES (test_user_id, 'https://test-constraint.example.com', 'analyzing', NOW(), NOW())
    RETURNING id INTO test_analysis_id;
    
    RAISE NOTICE 'SUCCESS: Test analysis created with ID: %', test_analysis_id;
    
    -- Verify the record was created and can be found
    IF EXISTS (SELECT 1 FROM website_analysis WHERE id = test_analysis_id) THEN
        RAISE NOTICE 'SUCCESS: Test record verified in database';
    ELSE
        RAISE EXCEPTION 'FAILED: Test record not found after creation';
    END IF;
    
    -- Clean up test data
    DELETE FROM website_analysis WHERE id = test_analysis_id;
    RAISE NOTICE 'Test data cleaned up successfully';
    
    RAISE NOTICE '✅ FOREIGN KEY CONSTRAINT TEST PASSED - Everything is working correctly!';
    
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION '❌ FOREIGN KEY CONSTRAINT TEST FAILED: %', SQLERRM;
END $$; 