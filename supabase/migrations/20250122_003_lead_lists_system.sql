-- Migration: Lead Lists Management System
-- Date: 2025-01-22
-- Description: Add lead lists management with CSV upload, processing, and account integration

-- Create lead_lists table
CREATE TABLE IF NOT EXISTS public.lead_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connected_account_id UUID REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  
  -- List Details
  name TEXT NOT NULL,
  description TEXT,
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER DEFAULT 0,
  failed_leads INTEGER DEFAULT 0,
  
  -- File Information
  original_filename TEXT,
  csv_file_url TEXT, -- S3 URL for the uploaded CSV
  sample_csv_url TEXT, -- S3 URL for processed sample
  
  -- Status & Processing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add lead_list_id to existing leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_list_id UUID REFERENCES public.lead_lists(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_lists_user_id ON public.lead_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_lists_org_id ON public.lead_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_lists_account_id ON public.lead_lists(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_lead_lists_status ON public.lead_lists(status);
CREATE INDEX IF NOT EXISTS idx_lead_lists_created_at ON public.lead_lists(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_list_id ON public.leads(lead_list_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_lead_lists_user_status ON public.lead_lists(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_lists_org_status ON public.lead_lists(organization_id, status);

-- Add RLS policies
ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;

-- Users can view their own lead lists and organization lead lists they're members of
CREATE POLICY "Users can view their own lead lists" ON public.lead_lists
  FOR SELECT USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own lead lists
CREATE POLICY "Users can insert their own lead lists" ON public.lead_lists
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own lead lists and organization lead lists they admin
CREATE POLICY "Users can update their own lead lists" ON public.lead_lists
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete their own lead lists and organization lead lists they admin
CREATE POLICY "Users can delete their own lead lists" ON public.lead_lists
  FOR DELETE USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update lead list counts automatically
CREATE OR REPLACE FUNCTION update_lead_list_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.lead_list_id IS NOT NULL THEN
    UPDATE public.lead_lists 
    SET total_leads = total_leads + 1,
        processed_leads = processed_leads + 1,
        updated_at = NOW()
    WHERE id = NEW.lead_list_id;
  ELSIF TG_OP = 'DELETE' AND OLD.lead_list_id IS NOT NULL THEN
    UPDATE public.lead_lists 
    SET total_leads = GREATEST(total_leads - 1, 0),
        processed_leads = GREATEST(processed_leads - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.lead_list_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.lead_list_id != NEW.lead_list_id THEN
    -- Handle moving leads between lists
    IF OLD.lead_list_id IS NOT NULL THEN
      UPDATE public.lead_lists 
      SET total_leads = GREATEST(total_leads - 1, 0),
          processed_leads = GREATEST(processed_leads - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.lead_list_id;
    END IF;
    
    IF NEW.lead_list_id IS NOT NULL THEN
      UPDATE public.lead_lists 
      SET total_leads = total_leads + 1,
          processed_leads = processed_leads + 1,
          updated_at = NOW()
      WHERE id = NEW.lead_list_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update lead counts
CREATE TRIGGER trigger_update_lead_list_counts
  AFTER INSERT OR DELETE OR UPDATE OF lead_list_id ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_lead_list_counts();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_lead_lists_updated_at
  BEFORE UPDATE ON public.lead_lists
  FOR EACH ROW EXECUTE FUNCTION update_lead_lists_updated_at();

-- Create function to get lead list statistics
CREATE OR REPLACE FUNCTION get_lead_list_stats(p_user_id UUID, p_organization_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_lists INTEGER,
  total_leads BIGINT,
  processing_lists INTEGER,
  completed_lists INTEGER,
  failed_lists INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_lists,
    COALESCE(SUM(ll.total_leads), 0)::BIGINT as total_leads,
    COUNT(CASE WHEN ll.status = 'processing' THEN 1 END)::INTEGER as processing_lists,
    COUNT(CASE WHEN ll.status = 'completed' THEN 1 END)::INTEGER as completed_lists,
    COUNT(CASE WHEN ll.status = 'failed' THEN 1 END)::INTEGER as failed_lists
  FROM public.lead_lists ll
  WHERE 
    ll.user_id = p_user_id AND
    (p_organization_id IS NULL OR ll.organization_id = p_organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_lead_list_stats(UUID, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.lead_lists IS 'Stores lead lists with CSV upload and processing capabilities';
COMMENT ON COLUMN public.lead_lists.connected_account_id IS 'Optional connected social media account for outreach';
COMMENT ON COLUMN public.lead_lists.csv_file_url IS 'S3 URL for the original uploaded CSV file';
COMMENT ON COLUMN public.lead_lists.sample_csv_url IS 'S3 URL for processed sample data';
COMMENT ON COLUMN public.lead_lists.status IS 'Processing status: draft, processing, completed, failed';
COMMENT ON COLUMN public.leads.lead_list_id IS 'Reference to the lead list this lead belongs to';
