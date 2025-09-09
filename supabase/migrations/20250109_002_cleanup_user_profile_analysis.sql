-- Migration: Clean up user_profile table by removing redundant analysis fields
-- Date: 2025-01-09
-- Description: Remove analysis-related fields from user_profile table as they duplicate website_analysis table data

-- Remove redundant analysis fields from user_profile table
-- Keep only actual profile/onboarding data
ALTER TABLE public.user_profile 
DROP COLUMN IF EXISTS icp,
DROP COLUMN IF EXISTS core_offer,
DROP COLUMN IF EXISTS icp_summary,
DROP COLUMN IF EXISTS target_personas,
DROP COLUMN IF EXISTS case_studies,
DROP COLUMN IF EXISTS lead_magnets,
DROP COLUMN IF EXISTS competitive_advantages,
DROP COLUMN IF EXISTS technology_stack,
DROP COLUMN IF EXISTS social_proof,
DROP COLUMN IF EXISTS website_analyzed_at,
DROP COLUMN IF EXISTS analysis_version;

-- Add comment explaining the cleanup
COMMENT ON TABLE public.user_profile IS 'User profile and onboarding data only. Website analysis data is stored in website_analysis table.';

-- Ensure website_analysis table is the single source of truth for analysis data
COMMENT ON TABLE public.website_analysis IS 'Single source of truth for all website analysis data. Replaces redundant fields that were previously in user_profile table.';
