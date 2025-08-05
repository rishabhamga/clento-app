-- Test script for Smartlead integration schema
-- This script validates the schema changes and tests data insertion

-- Test 1: Verify new columns exist in users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'smartlead_org_id'
    ) THEN
        RAISE EXCEPTION 'Missing smartlead_org_id column in users table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'smartlead_org_name'
    ) THEN
        RAISE EXCEPTION 'Missing smartlead_org_name column in users table';
    END IF;
    
    RAISE NOTICE 'Users table columns validated successfully';
END
$$;

-- Test 2: Verify new columns exist in leads table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'smartlead_campaign_id'
    ) THEN
        RAISE EXCEPTION 'Missing smartlead_campaign_id column in leads table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'last_email_event'
    ) THEN
        RAISE EXCEPTION 'Missing last_email_event column in leads table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'last_event_timestamp'
    ) THEN
        RAISE EXCEPTION 'Missing last_event_timestamp column in leads table';
    END IF;
    
    RAISE NOTICE 'Leads table columns validated successfully';
END
$$;

-- Test 3: Verify email_events table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'email_events'
    ) THEN
        RAISE EXCEPTION 'Missing email_events table';
    END IF;
    
    RAISE NOTICE 'Email events table exists';
END
$$;

-- Test 4: Verify indexes exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_smartlead_org_id'
    ) THEN
        RAISE EXCEPTION 'Missing index idx_users_smartlead_org_id';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_email_events_user_id'
    ) THEN
        RAISE EXCEPTION 'Missing index idx_email_events_user_id';
    END IF;
    
    RAISE NOTICE 'Indexes validated successfully';
END
$$;

-- Test 5: Insert sample data to verify schema works
DO $$
DECLARE
    test_user_id UUID;
    test_lead_id UUID;
    test_event_id UUID;
BEGIN
    -- Insert test user with Smartlead org mapping
    INSERT INTO public.users (clerk_id, email, full_name, smartlead_org_id, smartlead_org_name)
    VALUES ('test_clerk_123', 'test@example.com', 'Test User', 'sl_org_456', 'Test Organization')
    RETURNING id INTO test_user_id;
    
    -- Insert test lead with Smartlead campaign data
    INSERT INTO public.leads (
        user_id, full_name, email, company, smartlead_campaign_id, 
        last_email_event, last_event_timestamp
    )
    VALUES (
        test_user_id, 'John Doe', 'john@testcompany.com', 'Test Company', 
        'sl_campaign_789', 'email_opened', NOW()
    )
    RETURNING id INTO test_lead_id;
    
    -- Insert test email event
    INSERT INTO public.email_events (
        user_id, campaign_id, message_id, event_type, email, lead_id,
        smartlead_org_id, event_data
    )
    VALUES (
        test_user_id, 'sl_campaign_789', 'msg_123', 'email_opened', 
        'john@testcompany.com', test_lead_id, 'sl_org_456',
        '{"ip_address": "192.168.1.1", "user_agent": "Mozilla/5.0"}'::jsonb
    )
    RETURNING id INTO test_event_id;
    
    RAISE NOTICE 'Sample data inserted successfully';
    RAISE NOTICE 'Test User ID: %', test_user_id;
    RAISE NOTICE 'Test Lead ID: %', test_lead_id;
    RAISE NOTICE 'Test Event ID: %', test_event_id;
    
    -- Clean up test data
    DELETE FROM public.email_events WHERE id = test_event_id;
    DELETE FROM public.leads WHERE id = test_lead_id;
    DELETE FROM public.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test data cleaned up successfully';
END
$$;

-- Test 6: Verify constraint works
DO $$
DECLARE
    error_caught BOOLEAN := FALSE;
BEGIN
    BEGIN
        -- Try to insert invalid event type (should fail)
        INSERT INTO public.email_events (
            user_id, campaign_id, message_id, event_type, email
        )
        VALUES (
            gen_random_uuid(), 'test_campaign', 'test_message', 
            'invalid_event_type', 'test@example.com'
        );
    EXCEPTION WHEN check_violation THEN
        error_caught := TRUE;
        RAISE NOTICE 'Constraint validation working - invalid event type correctly rejected';
    END;
    
    IF NOT error_caught THEN
        RAISE EXCEPTION 'Constraint validation failed - invalid event type was accepted';
    END IF;
END
$$;

-- Show summary of schema changes
SELECT 
    'Schema validation completed successfully' as status,
    NOW() as validated_at;

-- Show table sizes for monitoring
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    typname as data_type
FROM pg_attribute 
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
JOIN pg_type ON pg_attribute.atttypid = pg_type.oid
WHERE schemaname = 'public'
AND tablename IN ('users', 'leads', 'email_events')
AND attname LIKE '%smartlead%' OR attname LIKE '%email%' OR attname LIKE '%event%'
ORDER BY tablename, attname; 