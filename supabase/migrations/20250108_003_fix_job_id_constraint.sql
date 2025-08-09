-- Migration: Fix job_id constraint in company_active_jobs
-- Date: 2025-01-08
-- Description: Remove unique constraint from job_id in company_active_jobs table to allow multiple companies per job

-- Drop the unique constraint on job_id in company_active_jobs
ALTER TABLE public.company_active_jobs DROP CONSTRAINT IF EXISTS company_active_jobs_job_id_key;

-- Add a composite unique constraint to prevent duplicate company entries for the same job
ALTER TABLE public.company_active_jobs ADD CONSTRAINT company_active_jobs_job_linkedin_unique 
  UNIQUE (job_id, linkedin_url);

-- Add index for better performance on job_id queries
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_job_id ON public.company_active_jobs(job_id);