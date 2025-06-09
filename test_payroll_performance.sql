-- 📊 薪资查询性能测试脚本
-- 测试索引优化后的性能提升效果

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
WHERE pe.employee_id = 1
LIMIT 10;

-- 测试2: 按薪资期间查询（应该使用新索引）
\echo '📋 测试2: 按薪资期间查询'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    pe.id,
    pe.employee_id,
    pe.gross_pay,
    COUNT(*) OVER() as total_count
FROM payroll.payroll_entries pe
WHERE pe.payroll_period_id IS NOT NULL
ORDER BY pe.payroll_period_id DESC
LIMIT 50;

-- 测试3: 部门员工查询（应该使用新索引）
\echo '📋 测试3: 按部门查询员工薪资'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    e.employee_code,
    d.name as department_name,
    pe.gross_pay,
    pe.net_pay
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
WHERE d.id = 1
LIMIT 20;

-- 测试4: JSONB字段查询（应该使用GIN索引）
\echo '📋 测试4: JSONB字段查询 - 基本工资'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    pe.id,
    pe.employee_id,
    (pe.earnings_details->>'BASIC_SALARY')::numeric as basic_salary
FROM payroll.payroll_entries pe
WHERE pe.earnings_details ? 'BASIC_SALARY'
LIMIT 20;

-- 测试5: 复合索引查询（薪资期间+员工）
\echo '📋 测试5: 复合索引查询 - 期间+员工'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    pe.id,
    pe.gross_pay,
    pe.net_pay
FROM payroll.payroll_entries pe
WHERE pe.payroll_period_id IS NOT NULL 
    AND pe.employee_id BETWEEN 1 AND 10
ORDER BY pe.payroll_period_id DESC, pe.employee_id
LIMIT 30;

-- 2. 复杂查询性能测试
\echo '🚀 =====  复杂查询性能测试  ====='

-- 测试6: 简化版的原始复杂查询
\echo '📋 测试6: 简化版复杂查询'
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
    COALESCE((pe.earnings_details->>'BASIC_SALARY')::numeric, 0.00) AS "基本工资",
    COALESCE((pe.earnings_details->>'PERFORMANCE_BONUS')::numeric, 0.00) AS "绩效奖金",
    COALESCE((pe.deductions_details->>'PERSONAL_INCOME_TAX')::numeric, 0.00) AS "个人所得税"
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
WHERE pe.payroll_period_id IS NOT NULL
ORDER BY pe.payroll_period_id DESC, e.employee_code
LIMIT 100;

-- 3. 索引使用情况分析
\echo '🚀 =====  索引使用情况分析  ====='

-- 查看新创建的索引使用统计
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

-- 4. 查询性能基准测试
\echo '🚀 =====  查询性能基准测试  ====='

-- 创建性能测试函数
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
    
    -- 测试2: JSONB字段聚合查询
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO row_count
    FROM payroll.payroll_entries pe
    WHERE pe.earnings_details ? 'BASIC_SALARY' 
        AND (pe.earnings_details->>'BASIC_SALARY')::numeric > 1000;
    
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE '✅ JSONB查询测试: % 毫秒, 处理 % 行数据', 
        ROUND(execution_time_ms, 2), row_count;
    
    RAISE NOTICE '🎯 性能基准测试完成！';
END $$;

-- 5. 数据库统计信息
\echo '🚀 =====  数据库统计信息  ====='

SELECT 
    'payroll_entries' as "表名",
    COUNT(*) as "总行数",
    COUNT(earnings_details) as "有应发明细行数",
    COUNT(deductions_details) as "有扣除明细行数",
    AVG(pg_column_size(earnings_details)) as "应发明细平均大小_字节",
    AVG(pg_column_size(deductions_details)) as "扣除明细平均大小_字节"
FROM payroll.payroll_entries;

-- 6. 查看表扫描情况
SELECT 
    schemaname,
    relname as "表名",
    seq_scan as "顺序扫描次数",
    seq_tup_read as "顺序读取行数",
    idx_scan as "索引扫描次数", 
    idx_tup_fetch as "索引获取行数",
    CASE 
        WHEN seq_scan = 0 THEN '🟢 仅索引扫描'
        WHEN idx_scan > seq_scan * 10 THEN '🟢 主要使用索引'
        WHEN idx_scan > seq_scan THEN '🟡 索引优于顺序扫描'
        ELSE '🔴 较多顺序扫描'
    END as "扫描模式评估"
FROM pg_stat_user_tables 
WHERE schemaname IN ('payroll', 'hr') 
    AND relname IN ('payroll_entries', 'employees', 'departments', 'positions', 'personnel_categories')
ORDER BY seq_scan DESC;

\echo '🎉 性能测试完成！请查看上述结果分析索引优化效果。' 