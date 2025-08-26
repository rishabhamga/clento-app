-- Migration script to add workflow JSON storage to campaigns table
-- Run this in your Supabase SQL editor or via CLI
--
-- Prerequisites:
-- 1. Set up GOOGLE_CLOUD_FLOW_STORAGE_BUCKET environment variable
-- 2. Create 'campaign-flow' bucket in Google Cloud Storage
-- 3. Configure proper IAM permissions for the service account

BEGIN;

-- Add workflow_json_file column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS workflow_json_file text;

-- Add comment to document the column
COMMENT ON COLUMN public.campaigns.workflow_json_file IS 'Google Cloud Storage file path for the workflow JSON configuration (format: workflows/{flow-id}.json)';

-- Create index for faster lookups by workflow file
CREATE INDEX IF NOT EXISTS idx_campaigns_workflow_json_file 
ON public.campaigns(workflow_json_file) 
WHERE workflow_json_file IS NOT NULL;

-- Add constraint to ensure workflow_json_file follows naming convention
-- First check if constraint already exists, then add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_workflow_json_file_format' 
        AND table_name = 'campaigns'
    ) THEN
        ALTER TABLE public.campaigns 
        ADD CONSTRAINT chk_workflow_json_file_format 
        CHECK (workflow_json_file IS NULL OR workflow_json_file ~ '^workflows/[a-zA-Z0-9_-]+\.json$');
    END IF;
END $$;

-- Update any existing campaigns with sample workflow if needed (optional)
-- UPDATE public.campaigns 
-- SET workflow_json_file = 'workflows/sample-workflow-001.json'
-- WHERE workflow_json_file IS NULL AND status = 'draft';

COMMIT;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name = 'workflow_json_file';

-- Show sample of campaigns table structure
\d public.campaigns;
