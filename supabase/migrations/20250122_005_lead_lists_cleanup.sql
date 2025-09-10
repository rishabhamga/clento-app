-- Migration: Clean up lead lists system - only add missing components
-- Date: 2025-01-22
-- Description: Add only the missing functions and policies for lead lists

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own lead lists" ON public.lead_lists;
DROP POLICY IF EXISTS "Users can insert their own lead lists" ON public.lead_lists;
DROP POLICY IF EXISTS "Users can update their own lead lists" ON public.lead_lists;
DROP POLICY IF EXISTS "Users can delete their own lead lists" ON public.lead_lists;

-- Ensure RLS is enabled
ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can view their own lead lists" ON public.lead_lists
  FOR SELECT USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own lead lists" ON public.lead_lists
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lead lists" ON public.lead_lists
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_lead_list_counts ON public.leads;

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_lead_lists_updated_at ON public.lead_lists;

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

-- Create the fixed account stats function
CREATE OR REPLACE FUNCTION get_account_stats(p_user_id UUID, p_organization_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_accounts INTEGER,
  connected_accounts INTEGER,
  by_provider JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH account_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_count,
      COUNT(CASE WHEN ua.connection_status = 'connected' THEN 1 END)::INTEGER as connected_count
    FROM public.user_accounts ua
    WHERE 
      ua.user_id = p_user_id AND
      (p_organization_id IS NULL OR ua.organization_id = p_organization_id)
  ),
  provider_stats AS (
    SELECT 
      ua.provider,
      COUNT(*)::INTEGER as provider_total,
      COUNT(CASE WHEN ua.connection_status = 'connected' THEN 1 END)::INTEGER as provider_connected
    FROM public.user_accounts ua
    WHERE 
      ua.user_id = p_user_id AND
      (p_organization_id IS NULL OR ua.organization_id = p_organization_id)
    GROUP BY ua.provider
  )
  SELECT 
    COALESCE(ast.total_count, 0) as total_accounts,
    COALESCE(ast.connected_count, 0) as connected_accounts,
    COALESCE(
      jsonb_object_agg(
        ps.provider, 
        jsonb_build_object(
          'total', ps.provider_total,
          'connected', ps.provider_connected
        )
      ) FILTER (WHERE ps.provider IS NOT NULL),
      '{}'::jsonb
    ) as by_provider
  FROM account_stats ast
  LEFT JOIN provider_stats ps ON true
  GROUP BY ast.total_count, ast.connected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_account_stats(UUID, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.lead_lists IS 'Stores lead lists with CSV upload and processing capabilities';
COMMENT ON COLUMN public.lead_lists.connected_account_id IS 'Optional connected social media account for outreach';
COMMENT ON COLUMN public.lead_lists.csv_file_url IS 'S3 URL for the original uploaded CSV file';
COMMENT ON COLUMN public.lead_lists.sample_csv_url IS 'S3 URL for processed sample data';
COMMENT ON COLUMN public.lead_lists.status IS 'Processing status: draft, processing, completed, failed';
COMMENT ON COLUMN public.leads.lead_list_id IS 'Reference to the lead list this lead belongs to';
COMMENT ON FUNCTION get_lead_list_stats(UUID, UUID) IS 'Returns lead list statistics for a user, optionally filtered by organization';
COMMENT ON FUNCTION get_account_stats(UUID, UUID) IS 'Returns account statistics for a user, optionally filtered by organization';
