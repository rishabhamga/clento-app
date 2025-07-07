-- Comprehensive query to verify website analysis data in Supabase
-- Run this in your Supabase SQL editor to check if data is being stored correctly

-- ========================================
-- 1. CHECK ALL USERS AND THEIR ONBOARDING STATUS
-- ========================================
SELECT 
  '🧑‍💼 USER OVERVIEW' as section,
  NULL as id,
  NULL as details,
  NULL as status,
  NULL as created_at
UNION ALL

SELECT 
  'User Details' as section,
  u.id::text,
  CONCAT(
    '📧 Email: ', COALESCE(u.email, 'No email'),
    ' | 🏢 Company: ', COALESCE(u.company_name, 'Not set'),
    ' | 🌐 Website: ', COALESCE(u.website_url, 'Not set')
  ) as details,
  CASE 
    WHEN up.completed = true THEN '✅ Completed'
    WHEN up.completed = false THEN '⏳ In Progress'
    ELSE '❌ Not Started'
  END as status,
  u.created_at
FROM users u
LEFT JOIN user_profile up ON u.id = up.user_id
ORDER BY u.created_at DESC;

-- ========================================
-- 2. CHECK WEBSITE ANALYSIS RECORDS
-- ========================================
SELECT 
  '📊 WEBSITE ANALYSIS OVERVIEW' as section,
  NULL as id,
  NULL as details,
  NULL as status,
  NULL as created_at
UNION ALL

SELECT 
  'Analysis Record' as section,
  wa.id::text,
  CONCAT(
    '🌐 URL: ', wa.website_url,
    ' | 🏭 Industry: ', COALESCE(wa.industry, 'Unknown'),
    ' | 📈 Confidence: ', ROUND(wa.confidence_score * 100)::text, '%',
    ' | 📄 Pages: ', COALESCE(wa.pages_analyzed::text, '0')
  ) as details,
  CASE 
    WHEN wa.status = 'completed' THEN '✅ Completed'
    WHEN wa.status = 'failed' THEN '❌ Failed'
    WHEN wa.status = 'in_progress' THEN '⏳ In Progress'
    ELSE CONCAT('❓ ', wa.status)
  END as status,
  wa.started_at as created_at
FROM website_analysis wa
JOIN users u ON wa.user_id = u.id
ORDER BY wa.started_at DESC;

-- ========================================
-- 3. CHECK USER PROFILES WITH ICP DATA
-- ========================================
SELECT 
  '🎯 ICP ANALYSIS DATA' as section,
  NULL as id,
  NULL as details,
  NULL as status,
  NULL as created_at
UNION ALL

SELECT 
  'Profile ICP' as section,
  up.user_id::text,
  CONCAT(
    '📧 User: ', COALESCE(u.email, 'Unknown'),
    ' | 🎯 Core Offer: ', 
    CASE 
      WHEN up.icp IS NOT NULL AND up.icp::text != 'null' 
      THEN LEFT(COALESCE(up.icp->>'core_offer', 'No core offer'), 100) || '...'
      ELSE 'No ICP data'
    END
  ) as details,
  CASE 
    WHEN up.icp IS NOT NULL AND up.icp::text != 'null' THEN '✅ Has ICP Data'
    ELSE '❌ No ICP Data'
  END as status,
  up.updated_at as created_at
FROM user_profile up
JOIN users u ON up.user_id = u.id
WHERE up.completed = true
ORDER BY up.updated_at DESC;

-- ========================================
-- 4. DETAILED ICP ANALYSIS FOR LATEST USER
-- ========================================
SELECT 
  '🔍 LATEST USER ICP DETAILS' as section,
  NULL as id,
  NULL as details,
  NULL as status,
  NULL as created_at
UNION ALL

SELECT 
  'ICP Detail' as section,
  up.user_id::text,
  CASE 
    WHEN field = 'core_offer' THEN CONCAT('🎯 Core Offer: ', value)
    WHEN field = 'industry' THEN CONCAT('🏭 Industry: ', value)
    WHEN field = 'business_model' THEN CONCAT('💼 Business Model: ', value)
    WHEN field = 'personas_count' THEN CONCAT('👥 Target Personas: ', value)
    WHEN field = 'competitive_advantages_count' THEN CONCAT('🏆 Competitive Advantages: ', value)
    WHEN field = 'case_studies_count' THEN CONCAT('📚 Case Studies: ', value)
    WHEN field = 'confidence_score' THEN CONCAT('📈 Confidence Score: ', value, '%')
  END as details,
  '📋 Data Field' as status,
  up.updated_at as created_at
FROM user_profile up
JOIN users u ON up.user_id = u.id
CROSS JOIN LATERAL (
  VALUES 
    ('core_offer', up.icp->>'core_offer'),
    ('industry', up.icp->>'industry'),
    ('business_model', up.icp->>'business_model'),
    ('personas_count', COALESCE(jsonb_array_length(up.icp->'target_personas'), 0)::text),
    ('competitive_advantages_count', COALESCE(jsonb_array_length(up.icp->'competitive_advantages'), 0)::text),
    ('case_studies_count', COALESCE(jsonb_array_length(up.icp->'case_studies'), 0)::text),
    ('confidence_score', ROUND((up.icp->>'confidence_score')::numeric * 100)::text)
) AS fields(field, value)
WHERE up.completed = true 
  AND up.icp IS NOT NULL 
  AND up.icp::text != 'null'
  AND value IS NOT NULL 
  AND value != ''
ORDER BY up.updated_at DESC, field
LIMIT 20;

-- ========================================
-- 5. QUICK SUMMARY STATS
-- ========================================
SELECT 
  '📊 SUMMARY STATISTICS' as section,
  NULL as id,
  NULL as details,
  NULL as status,
  NULL as created_at
UNION ALL

SELECT 
  'Summary' as section,
  NULL,
  CONCAT(
    '👥 Total Users: ', total_users, 
    ' | ✅ Completed Onboarding: ', completed_users,
    ' | 📊 Has Analysis: ', users_with_analysis,
    ' | 🎯 Has ICP Data: ', users_with_icp
  ) as details,
  '📈 Statistics' as status,
  NOW() as created_at
FROM (
  SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN up.completed = true THEN u.id END) as completed_users,
    COUNT(DISTINCT wa.user_id) as users_with_analysis,
    COUNT(DISTINCT CASE WHEN up.icp IS NOT NULL AND up.icp::text != 'null' THEN u.id END) as users_with_icp
  FROM users u
  LEFT JOIN user_profile up ON u.id = up.user_id
  LEFT JOIN website_analysis wa ON u.id = wa.user_id AND wa.status = 'completed'
) stats;

-- ========================================
-- INSTRUCTIONS:
-- ========================================
/*
🔍 HOW TO USE THIS QUERY:

1. Copy this entire query
2. Go to your Supabase dashboard → SQL Editor
3. Paste and run the query
4. Review the results to check:
   ✅ If users are being created properly
   ✅ If onboarding completion is working
   ✅ If website analysis is being stored
   ✅ If ICP data is being saved correctly

🚨 TROUBLESHOOTING:
- If no users appear: Check if authentication is working
- If users exist but no analysis: Check if website analysis API is working
- If analysis exists but no ICP data: Check if the analysis format is correct
- If onboarding shows incomplete: Check if the completion flow is working

📊 WHAT TO LOOK FOR:
- Users should have completed = true after onboarding
- Website analysis should have status = 'completed'
- ICP data should contain core_offer, industry, target_personas, etc.
- Confidence scores should be between 0 and 1 (shown as percentage)
*/ 