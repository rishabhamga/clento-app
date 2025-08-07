-- Sample leads data for testing Syndie integration
-- Run this in your Supabase SQL editor to create test data

-- First, let's get a user ID from the existing users table
-- Replace 'your-clerk-user-id' with an actual clerk_id from your users table
-- You can find this by running: SELECT clerk_id FROM public.users LIMIT 1;

-- Insert sample leads with Syndie data
INSERT INTO public.leads (
    user_id,
    full_name,
    first_name,
    last_name,
    email,
    phone,
    title,
    headline,
    company,
    industry,
    location,
    linkedin_url,
    status,
    source,
    syndie_lead_id,
    linkedin_connection_status,
    steps,
    campaign_info,
    seat_info,
    created_at,
    updated_at
) VALUES 
(
    -- Replace this with an actual user ID from your users table
    (SELECT id FROM public.users LIMIT 1),
    'John Smith',
    'John',
    'Smith',
    'john.smith@techcorp.com',
    '+1-555-0123',
    'VP of Engineering',
    'VP Engineering at TechCorp | Building scalable solutions',
    'TechCorp Inc',
    'Technology',
    'San Francisco, CA',
    'https://linkedin.com/in/johnsmith',
    'contacted',
    'syndie',
    'syndie_lead_001',
    'connected',
    '[
        {
            "stepNodeId": "step_1",
            "timestamp": "2024-01-15T10:00:00Z",
            "success": true,
            "stepType": "linkedin_invite",
            "action": "linkedin_invite",
            "response": "Connection request sent successfully",
            "details": {
                "message": "Hi John, I noticed we both work in the tech industry. Would love to connect!"
            }
        },
        {
            "stepNodeId": "step_2",
            "timestamp": "2024-01-16T14:30:00Z",
            "success": true,
            "stepType": "linkedin_message",
            "action": "linkedin_message",
            "response": "Message sent successfully",
            "details": {
                "message": "Thanks for connecting, John! I''d love to learn more about your work at TechCorp."
            }
        },
        {
            "stepNodeId": "step_3",
            "timestamp": "2024-01-17T09:15:00Z",
            "success": true,
            "stepType": "follow_up",
            "action": "follow_up",
            "response": "Follow-up completed",
            "details": {
                "message": "Hope you had a great weekend! Did you get a chance to review our solution?"
            }
        }
    ]'::jsonb,
    '{
        "id": "campaign_123",
        "name": "Q1 Outreach Campaign",
        "description": "Targeting VP level executives in tech",
        "status": "active"
    }'::jsonb,
    '{
        "id": "seat_456",
        "providerId": "linkedin_789",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "publicIdentifier": "sarah-johnson-sales",
        "accountType": "premium",
        "isActive": true
    }'::jsonb,
    NOW() - INTERVAL '3 days',
    NOW()
),
(
    (SELECT id FROM public.users LIMIT 1),
    'Emily Chen',
    'Emily',
    'Chen',
    'emily.chen@innovatetech.com',
    '+1-555-0456',
    'CTO',
    'Chief Technology Officer at InnovateTech | AI & Machine Learning Expert',
    'InnovateTech',
    'Artificial Intelligence',
    'Austin, TX',
    'https://linkedin.com/in/emilychen',
    'replied',
    'syndie',
    'syndie_lead_002',
    'replied',
    '[
        {
            "stepNodeId": "step_1",
            "timestamp": "2024-01-14T11:00:00Z",
            "success": true,
            "stepType": "linkedin_invite",
            "action": "linkedin_invite",
            "response": "Connection request accepted",
            "details": {
                "message": "Hi Emily, impressed by your work in AI. Would love to connect!"
            }
        },
        {
            "stepNodeId": "step_2",
            "timestamp": "2024-01-15T16:45:00Z",
            "success": true,
            "stepType": "linkedin_message",
            "action": "linkedin_message",
            "response": "Positive reply received",
            "details": {
                "message": "Thanks for connecting! What specific AI challenges are you tackling at InnovateTech?",
                "reply": "Thanks for reaching out! We''re working on some interesting NLP projects. Always happy to discuss AI trends."
            }
        }
    ]'::jsonb,
    '{
        "id": "campaign_124",
        "name": "AI Leaders Outreach",
        "description": "Targeting CTOs and AI leaders",
        "status": "active"
    }'::jsonb,
    '{
        "id": "seat_456",
        "providerId": "linkedin_789",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "publicIdentifier": "sarah-johnson-sales",
        "accountType": "premium",
        "isActive": true
    }'::jsonb,
    NOW() - INTERVAL '2 days',
    NOW()
),
(
    (SELECT id FROM public.users LIMIT 1),
    'Michael Rodriguez',
    'Michael',
    'Rodriguez',
    'michael.r@datastream.com',
    '+1-555-0789',
    'Head of Data Science',
    'Head of Data Science at DataStream | Building data-driven solutions',
    'DataStream Analytics',
    'Data Analytics',
    'Seattle, WA',
    'https://linkedin.com/in/michaelrodriguez',
    'pending',
    'syndie',
    'syndie_lead_003',
    'pending',
    '[
        {
            "stepNodeId": "step_1",
            "timestamp": "2024-01-16T13:20:00Z",
            "success": true,
            "stepType": "linkedin_invite",
            "action": "linkedin_invite",
            "response": "Connection request sent",
            "details": {
                "message": "Hi Michael, I see you''re doing amazing work in data science. Would love to connect!"
            }
        }
    ]'::jsonb,
    '{
        "id": "campaign_125",
        "name": "Data Science Leaders",
        "description": "Targeting data science professionals",
        "status": "active"
    }'::jsonb,
    '{
        "id": "seat_456",
        "providerId": "linkedin_789",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "publicIdentifier": "sarah-johnson-sales",
        "accountType": "premium",
        "isActive": true
    }'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW()
),
(
    (SELECT id FROM public.users LIMIT 1),
    'Lisa Wang',
    'Lisa',
    'Wang',
    'lisa.wang@cloudnative.io',
    '+1-555-0321',
    'DevOps Manager',
    'DevOps Manager at CloudNative | Kubernetes & Infrastructure Expert',
    'CloudNative Solutions',
    'Cloud Computing',
    'Denver, CO',
    'https://linkedin.com/in/lisawang',
    'new',
    'syndie',
    'syndie_lead_004',
    'not_connected',
    '[]'::jsonb,
    '{
        "id": "campaign_126",
        "name": "DevOps Professionals",
        "description": "Targeting DevOps and infrastructure professionals",
        "status": "active"
    }'::jsonb,
    '{
        "id": "seat_456",
        "providerId": "linkedin_789",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "publicIdentifier": "sarah-johnson-sales",
        "accountType": "premium",
        "isActive": true
    }'::jsonb,
    NOW(),
    NOW()
),
(
    (SELECT id FROM public.users LIMIT 1),
    'David Kim',
    'David',
    'Kim',
    'david.kim@securetech.com',
    '+1-555-0654',
    'CISO',
    'Chief Information Security Officer at SecureTech | Cybersecurity Expert',
    'SecureTech Inc',
    'Cybersecurity',
    'Boston, MA',
    'https://linkedin.com/in/davidkim',
    'negative',
    'syndie',
    'syndie_lead_005',
    'not_interested',
    '[
        {
            "stepNodeId": "step_1",
            "timestamp": "2024-01-13T15:30:00Z",
            "success": false,
            "stepType": "linkedin_invite",
            "action": "linkedin_invite",
            "response": "Connection request declined",
            "errorMessage": "User is not interested in connecting at this time",
            "details": {
                "message": "Hi David, interested in discussing cybersecurity trends. Would love to connect!"
            }
        }
    ]'::jsonb,
    '{
        "id": "campaign_127",
        "name": "Security Leaders Outreach",
        "description": "Targeting CISOs and security professionals",
        "status": "paused"
    }'::jsonb,
    '{
        "id": "seat_456",
        "providerId": "linkedin_789",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "publicIdentifier": "sarah-johnson-sales",
        "accountType": "premium",
        "isActive": true
    }'::jsonb,
    NOW() - INTERVAL '4 days',
    NOW()
);

-- Verify the data was inserted
SELECT 
    full_name,
    company,
    linkedin_connection_status,
    jsonb_array_length(steps) as step_count,
    source,
    created_at
FROM public.leads 
WHERE source = 'syndie'
ORDER BY created_at DESC;