-- Add workflow_json_file column to campaigns table
-- This will store the GCS file path/name for the workflow JSON

ALTER TABLE public.campaigns 
ADD COLUMN workflow_json_file text;

-- Add comment to document the column
COMMENT ON COLUMN public.campaigns.workflow_json_file IS 'Google Cloud Storage file path for the workflow JSON configuration';

-- Create index for faster lookups by workflow file
CREATE INDEX IF NOT EXISTS idx_campaigns_workflow_json_file ON public.campaigns(workflow_json_file) WHERE workflow_json_file IS NOT NULL;

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
