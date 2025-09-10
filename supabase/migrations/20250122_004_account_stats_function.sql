-- Migration: Add missing get_account_stats function
-- Date: 2025-01-22
-- Description: Create the get_account_stats function that was missing from the database

-- Create function to get account statistics
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

-- Add comment for documentation
COMMENT ON FUNCTION get_account_stats(UUID, UUID) IS 'Returns account statistics for a user, optionally filtered by organization';
