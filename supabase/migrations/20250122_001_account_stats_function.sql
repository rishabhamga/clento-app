-- Create function to get account statistics
CREATE OR REPLACE FUNCTION get_account_stats(org_id UUID)
RETURNS TABLE (
    total_accounts BIGINT,
    connected_accounts BIGINT,
    by_provider JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN connection_status = 'connected' THEN 1 END) as connected,
            jsonb_object_agg(
                provider, 
                COUNT(*)
            ) as providers
        FROM public.user_accounts 
        WHERE organization_id = org_id
    )
    SELECT 
        stats.total::BIGINT as total_accounts,
        stats.connected::BIGINT as connected_accounts,
        COALESCE(stats.providers, '{}'::jsonb) as by_provider
    FROM stats;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_account_stats(UUID) TO authenticated;
