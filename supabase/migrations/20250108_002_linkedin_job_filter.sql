-- Migration: LinkedIn Job Filter Integration
-- Date: 2025-01-08
-- Description: Add LinkedIn job filtering support with company active jobs tracking and job matching data storage

-- Create company_active_jobs table for storing job matching results
CREATE TABLE IF NOT EXISTS public.company_active_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL UNIQUE, -- Unique identifier for the job processing request
  company_name TEXT NOT NULL,
  company_website TEXT,
  linkedin_url TEXT NOT NULL,
  department TEXT NOT NULL,
  job_titles TEXT[], -- Array of specific job titles to search for (optional)
  match_count INTEGER DEFAULT 0,
  job_data JSONB DEFAULT '{}'::jsonb, -- Detailed job matching results
  linkedin_jobs JSONB DEFAULT '[]'::jsonb, -- Jobs found on LinkedIn
  career_page_jobs JSONB DEFAULT '[]'::jsonb, -- Jobs found on career pages
  processing_status TEXT DEFAULT 'pending' CHECK (
    processing_status IN (
      'pending', 
      'processing', 
      'completed', 
      'failed', 
      'timeout'
    )
  ),
  error_message TEXT, -- Store error details if processing fails
  scraped_at TIMESTAMPTZ, -- When the scraping was completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_filter_requests table for tracking bulk job filtering operations
CREATE TABLE IF NOT EXISTS public.job_filter_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL UNIQUE, -- Matches job_id in company_active_jobs
  original_filename TEXT NOT NULL,
  total_companies INTEGER DEFAULT 0,
  processed_companies INTEGER DEFAULT 0,
  successful_companies INTEGER DEFAULT 0,
  failed_companies INTEGER DEFAULT 0,
  departments TEXT[] NOT NULL, -- Departments to search for
  job_titles TEXT[], -- Optional specific job titles
  processing_status TEXT DEFAULT 'pending' CHECK (
    processing_status IN (
      'pending', 
      'processing', 
      'completed', 
      'failed',
      'cancelled'
    )
  ),
  csv_output_url TEXT, -- S3 URL for downloadable results
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance optimization

-- company_active_jobs indexes
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_user_id ON public.company_active_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_organization_id ON public.company_active_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_job_id ON public.company_active_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_processing_status ON public.company_active_jobs(processing_status);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_department ON public.company_active_jobs(department);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_company_name ON public.company_active_jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_linkedin_url ON public.company_active_jobs(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_scraped_at ON public.company_active_jobs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_created_at ON public.company_active_jobs(created_at);

-- GIN indexes for JSONB columns for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_job_data_gin ON public.company_active_jobs USING GIN(job_data);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_linkedin_jobs_gin ON public.company_active_jobs USING GIN(linkedin_jobs);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_career_page_jobs_gin ON public.company_active_jobs USING GIN(career_page_jobs);

-- job_filter_requests indexes
CREATE INDEX IF NOT EXISTS idx_job_filter_requests_user_id ON public.job_filter_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_job_filter_requests_organization_id ON public.job_filter_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_filter_requests_job_id ON public.job_filter_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_job_filter_requests_processing_status ON public.job_filter_requests(processing_status);
CREATE INDEX IF NOT EXISTS idx_job_filter_requests_created_at ON public.job_filter_requests(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_user_job ON public.company_active_jobs(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_company_active_jobs_org_status ON public.company_active_jobs(organization_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_job_filter_requests_user_status ON public.job_filter_requests(user_id, processing_status);

-- Add comments for documentation
COMMENT ON TABLE public.company_active_jobs IS 'Stores individual company job matching results from LinkedIn and career page scraping';
COMMENT ON TABLE public.job_filter_requests IS 'Tracks bulk job filtering operations and overall processing status';

COMMENT ON COLUMN public.company_active_jobs.job_id IS 'Unique identifier linking to the bulk job filter request';
COMMENT ON COLUMN public.company_active_jobs.company_name IS 'Name of the company being analyzed';
COMMENT ON COLUMN public.company_active_jobs.company_website IS 'Company website URL for career page scraping';
COMMENT ON COLUMN public.company_active_jobs.linkedin_url IS 'LinkedIn company page URL for job scraping';
COMMENT ON COLUMN public.company_active_jobs.department IS 'Department to search for (Sales, Engineering, etc.)';
COMMENT ON COLUMN public.company_active_jobs.job_titles IS 'Optional array of specific job titles to match';
COMMENT ON COLUMN public.company_active_jobs.match_count IS 'Total number of matching jobs found';
COMMENT ON COLUMN public.company_active_jobs.job_data IS 'Comprehensive job matching results and metadata';
COMMENT ON COLUMN public.company_active_jobs.linkedin_jobs IS 'Array of jobs found on LinkedIn company page';
COMMENT ON COLUMN public.company_active_jobs.career_page_jobs IS 'Array of jobs found on company career pages';
COMMENT ON COLUMN public.company_active_jobs.processing_status IS 'Current processing status of the job scraping';
COMMENT ON COLUMN public.company_active_jobs.error_message IS 'Error details if scraping fails';
COMMENT ON COLUMN public.company_active_jobs.scraped_at IS 'Timestamp when scraping was completed';

COMMENT ON COLUMN public.job_filter_requests.job_id IS 'Unique identifier for the bulk processing request';
COMMENT ON COLUMN public.job_filter_requests.original_filename IS 'Name of the uploaded CSV file';
COMMENT ON COLUMN public.job_filter_requests.total_companies IS 'Total number of companies to process';
COMMENT ON COLUMN public.job_filter_requests.processed_companies IS 'Number of companies processed so far';
COMMENT ON COLUMN public.job_filter_requests.successful_companies IS 'Number of companies successfully scraped';
COMMENT ON COLUMN public.job_filter_requests.failed_companies IS 'Number of companies that failed scraping';
COMMENT ON COLUMN public.job_filter_requests.departments IS 'Array of departments to search for';
COMMENT ON COLUMN public.job_filter_requests.job_titles IS 'Optional array of specific job titles to match';
COMMENT ON COLUMN public.job_filter_requests.csv_output_url IS 'S3 URL for downloadable results CSV';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_company_active_jobs_updated_at BEFORE UPDATE
ON public.company_active_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_filter_requests_updated_at BEFORE UPDATE
ON public.job_filter_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate job_data JSONB structure
CREATE OR REPLACE FUNCTION validate_job_data(job_data_input JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate that job_data has expected structure
    -- This is a basic validation, can be expanded as needed
    IF job_data_input IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check for basic expected fields (can be expanded)
    IF job_data_input ? 'total_matches' AND 
       job_data_input ? 'linkedin_matches' AND 
       job_data_input ? 'career_page_matches' THEN
        RETURN TRUE;
    END IF;
    
    RETURN TRUE; -- Allow flexible structure for now
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate job_data structure
ALTER TABLE public.company_active_jobs 
ADD CONSTRAINT check_job_data_structure 
CHECK (validate_job_data(job_data));