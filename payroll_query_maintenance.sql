-- 薪资查询性能监控和维护脚本

-- 1. 检查当前索引状态
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname IN ('payroll', 'hr', 'config')
    AND (tablename LIKE '%payroll%' OR tablename LIKE '%employee%' OR tablename LIKE '%personnel%')
ORDER BY schemaname, tablename, indexname;

-- 2. 查看表统计信息
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname IN ('payroll', 'hr')
ORDER BY n_live_tup DESC;

-- 3. 检查JSONB字段使用情况
SELECT 
    'earnings_details' as field_type,
    COUNT(*) as total_records,
    COUNT(earnings_details) as non_null_records,
    AVG(pg_column_size(earnings_details)) as avg_size_bytes
FROM payroll.payroll_entries
UNION ALL
SELECT 
    'deductions_details' as field_type,
    COUNT(*) as total_records,
    COUNT(deductions_details) as non_null_records,
    AVG(pg_column_size(deductions_details)) as avg_size_bytes
FROM payroll.payroll_entries;

-- 4. 物化视图刷新状态检查
SELECT 
    schemaname,
    matviewname,
    hasindexes,
    ispopulated,
    definition
FROM pg_matviews 
WHERE schemaname IN ('payroll', 'hr')
ORDER BY schemaname, matviewname;

-- 5. 创建定期维护任务
CREATE OR REPLACE FUNCTION maintain_payroll_performance()
RETURNS text AS $$
DECLARE
    result text := '';
BEGIN
    -- 更新表统计信息
    ANALYZE payroll.payroll_entries;
    ANALYZE hr.employees;
    ANALYZE hr.departments;
    ANALYZE hr.positions;
    ANALYZE hr.personnel_categories;
    
    result := result || 'Table statistics updated. ';
    
    -- 刷新物化视图（如果存在且有数据变化）
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_personnel_hierarchy') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY hr.mv_personnel_hierarchy;
        result := result || 'Personnel hierarchy refreshed. ';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_payroll_components_parsed') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY payroll.mv_payroll_components_parsed;
        result := result || 'Payroll components refreshed. ';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_payroll_report_summary') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY payroll.mv_payroll_report_summary;
        result := result || 'Payroll report summary refreshed. ';
    END IF;
    
    -- 清理死元组（如果需要）
    -- VACUUM ANALYZE payroll.payroll_entries;
    
    RETURN result || 'Maintenance completed at ' || now();
END;
$$ LANGUAGE plpgsql;

-- 6. 性能测试脚本
CREATE OR REPLACE FUNCTION test_payroll_query_performance()
RETURNS TABLE(
    query_type text,
    execution_time_ms numeric,
    rows_returned bigint
) AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    row_count bigint;
BEGIN
    -- 测试原始查询（简化版）
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO row_count
    FROM payroll.payroll_entries pe
    LEFT JOIN hr.employees e ON pe.employee_id = e.id
    LEFT JOIN hr.departments d ON e.department_id = d.id
    WHERE pe.payroll_period_id IS NOT NULL;
    
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Original Query'::text,
        EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
        row_count;
    
    -- 测试物化视图查询（如果存在）
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_payroll_report_summary') THEN
        start_time := clock_timestamp();
        
        SELECT COUNT(*) INTO row_count
        FROM payroll.mv_payroll_report_summary
        WHERE payroll_period_id IS NOT NULL;
        
        end_time := clock_timestamp();
        
        RETURN QUERY SELECT 
            'Materialized View Query'::text,
            EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
            row_count;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 7. 自动化维护调度（示例）
-- 创建每日维护任务（需要pg_cron扩展）
/*
SELECT cron.schedule('payroll-maintenance', '0 2 * * *', 'SELECT maintain_payroll_performance();');
*/

-- 8. 查询计划分析助手
CREATE OR REPLACE FUNCTION analyze_payroll_query_plan(query_text text)
RETURNS TABLE(plan_line text) AS $$
BEGIN
    RETURN QUERY EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ' || query_text;
END;
$$ LANGUAGE plpgsql;

-- 使用示例:
-- SELECT * FROM analyze_payroll_query_plan('SELECT * FROM payroll.mv_payroll_report_summary LIMIT 10');

-- 9. 索引使用率监控
CREATE OR REPLACE VIEW payroll_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as index_tuples_read,
    idx_tup_fetch as index_tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname IN ('payroll', 'hr')
ORDER BY idx_scan DESC; 