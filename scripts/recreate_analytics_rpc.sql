-- RECREATE AGENT METRICS RPC FOR KSA VERIFIED

CREATE OR REPLACE FUNCTION get_agent_metrics()
RETURNS TABLE (
    agent TEXT,
    completions BIGINT,
    failures BIGINT,
    rectified_failures BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH agent_list AS (
        SELECT unnest(ARRAY['orchestrator', 'scout', 'creator', 'retoucher', 'publisher', 'closer', 'biller']) as a
    )
    SELECT 
        al.a as agent,
        COUNT(l.id) FILTER (WHERE l.status = 'success') as completions,
        COUNT(l.id) FILTER (WHERE l.status = 'error') as failures,
        -- Rectified failures: assuming it counts cases where an error was followed by corrective action or successful retry
        -- For now, let's map it to specific 'rectified' actions if they exist, or keep as 0 if not tracked yet.
        -- Looking at current logs, we can count 'cycle_success' for orchestrator or similar.
        -- For a simple direct mapping:
        COUNT(l.id) FILTER (WHERE l.details->>'rectified' = 'true') as rectified_failures
    FROM agent_list al
    LEFT JOIN logs l ON l.agent = al.a
    GROUP BY al.a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CREATE SYSTEM HEALTH RPC
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'table_counts', json_build_object(
            'leads', (SELECT count(*) FROM leads),
            'logs', (SELECT count(*) FROM logs),
            'chat_logs', (SELECT count(*) FROM chat_logs)
        ),
        'recent_activity', (
            SELECT count(*) FROM logs 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        'errors_24h', (
            SELECT count(*) FROM logs 
            WHERE status = 'error' AND created_at > NOW() - INTERVAL '24 hours'
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
