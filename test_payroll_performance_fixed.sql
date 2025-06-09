-- 📊 修复后的薪资查询性能测试脚本

\timing on

-- 1. 基础性能测试
\echo '🚀 =====  基础查询性能测试  ====='

-- 测试1: 简单的员工薪资查询（应该使用新索引）
\echo '📋 测试1: 按员工ID查询薪资记录'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    pe.id,
    pe.employee_id,
    pe.gross_pay,
    pe.net_pay,
    e.employee_code,
    e.first_name,
    e.last_name
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
WHERE pe.employee_id IN (SELECT id FROM hr.employees LIMIT 1)
LIMIT 10;

-- 测试4: JSONB字段查询（修复版）
\echo '📋 测试4: JSONB字段查询 - 基本工资'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    pe.id,
    pe.employee_id,
    (pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric as basic_salary
FROM payroll.payroll_entries pe
WHERE pe.earnings_details ? 'BASIC_SALARY'
LIMIT 20;

-- 测试7: 复杂JSONB查询
\echo '📋 测试7: 复杂JSONB查询 - 多个字段'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    pe.id,
    (pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric as basic_salary,
    (pe.earnings_details->'PERFORMANCE_BONUS'->>'amount')::numeric as performance_bonus,
    (pe.deductions_details->'PERSONAL_INCOME_TAX'->>'amount')::numeric as personal_income_tax
FROM payroll.payroll_entries pe
WHERE pe.earnings_details ? 'BASIC_SALARY'
    AND pe.deductions_details ? 'PERSONAL_INCOME_TAX'
LIMIT 30;

-- 2. 索引使用情况分析（修复版）
\echo '🚀 =====  索引使用情况分析  ====='

SELECT 
    schemaname as "模式",
    tablename as "表名",
    indexname as "索引名",
    idx_scan as "使用次数",
    idx_tup_read as "读取行数",
    idx_tup_fetch as "获取行数",
    CASE 
        WHEN idx_scan = 0 THEN '😴 未使用'
        WHEN idx_scan < 10 THEN '🟡 初步使用'  
        WHEN idx_scan < 50 THEN '🟠 正常使用'
        ELSE '🟢 频繁使用'
    END as "使用状态"
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_payroll%' OR indexname LIKE 'idx_employees%' OR indexname LIKE 'idx_personnel%'
ORDER BY idx_scan DESC;

-- 3. 性能基准测试（修复版）
\echo '🚀 =====  查询性能基准测试  ====='

DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time_ms numeric;
    row_count bigint;
BEGIN
    RAISE NOTICE '开始性能基准测试...';
    
    -- 测试1: 大量数据JOIN查询
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO row_count
    FROM payroll.payroll_entries pe
    LEFT JOIN hr.employees e ON pe.employee_id = e.id
    LEFT JOIN hr.departments d ON e.department_id = d.id
    WHERE pe.payroll_period_id IS NOT NULL;
    
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE '✅ JOIN查询测试: % 毫秒, 处理 % 行数据', 
        ROUND(execution_time_ms, 2), row_count;
    
    -- 测试2: JSONB字段查询（修复版）
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO row_count
    FROM payroll.payroll_entries pe
    WHERE pe.earnings_details ? 'BASIC_SALARY' 
        AND (pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric > 1000;
    
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE '✅ JSONB查询测试: % 毫秒, 处理 % 行数据', 
        ROUND(execution_time_ms, 2), row_count;
    
    -- 测试3: 复合索引查询
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO row_count
    FROM payroll.payroll_entries pe
    WHERE pe.payroll_period_id IS NOT NULL 
        AND pe.employee_id IS NOT NULL;
    
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE '✅ 复合索引查询测试: % 毫秒, 处理 % 行数据', 
        ROUND(execution_time_ms, 2), row_count;
    
    RAISE NOTICE '🎯 性能基准测试完成！';
END $$;

-- 4. 索引效果对比
\echo '🚀 =====  索引效果对比  ====='

-- 查看最常用的索引
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "使用次数",
    ROUND((idx_tup_read::numeric / GREATEST(idx_scan, 1)), 2) as "平均每次读取行数"
FROM pg_stat_user_indexes 
WHERE schemaname IN ('payroll', 'hr')
    AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 10;

-- 5. 查询计划分析 - 实际复杂查询
\echo '🚀 =====  实际复杂查询测试  ====='

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    pe.id AS "薪资条目id",
    pe.employee_id AS "员工id",
    e.employee_code AS "员工编号",
    COALESCE(e.last_name || e.first_name, e.first_name, '未知') AS "姓名",
    COALESCE(d.name, '未分配部门') AS "部门名称",
    COALESCE(pos.name, '未分配职位') AS "职位名称",
    COALESCE(pc.name, '未分类') AS "人员类别",
    COALESCE(pe.gross_pay, 0.00) AS "应发合计",
    COALESCE(pe.net_pay, 0.00) AS "实发合计",
    COALESCE((pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric, 0.00) AS "基本工资",
    COALESCE((pe.earnings_details->'PERFORMANCE_BONUS'->>'amount')::numeric, 0.00) AS "绩效奖金",
    COALESCE((pe.deductions_details->'PERSONAL_INCOME_TAX'->>'amount')::numeric, 0.00) AS "个人所得税"
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
WHERE pe.payroll_period_id IS NOT NULL
ORDER BY pe.payroll_period_id DESC, e.employee_code
LIMIT 50;

\echo '🎉 修复后的性能测试完成！' 