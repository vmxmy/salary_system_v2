-- 📚 数据库索引解释示例

-- 1. 首先看看当前的表结构（不是创建新表）
\d payroll.payroll_entries

-- 2. 查看当前已有的索引
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'payroll_entries' AND schemaname = 'payroll';

-- 3. 示例：没有索引时的查询（慢）
-- 假设查询某个员工的薪资记录
EXPLAIN ANALYZE 
SELECT * FROM payroll.payroll_entries 
WHERE employee_id = 123;
-- 结果可能是：Seq Scan（全表扫描）花费很长时间

-- 4. 创建索引（不是创建表！）
CREATE INDEX IF NOT EXISTS idx_payroll_entries_employee_id 
ON payroll.payroll_entries(employee_id);

-- 5. 有索引后的同样查询（快）
EXPLAIN ANALYZE 
SELECT * FROM payroll.payroll_entries 
WHERE employee_id = 123;
-- 结果变成：Index Scan（索引扫描）速度很快

-- 6. 索引的存储结构示例（概念图）
/*
原始表数据 (payroll_entries)：
┌────┬─────────────┬──────────┬─────────┐
│ id │ employee_id │ gross_pay│ net_pay │
├────┼─────────────┼──────────┼─────────┤
│ 1  │     456     │  5000.00 │ 4000.00 │
│ 2  │     123     │  6000.00 │ 4800.00 │
│ 3  │     789     │  5500.00 │ 4400.00 │
│ 4  │     123     │  6100.00 │ 4900.00 │
└────┴─────────────┴──────────┴─────────┘

索引数据结构 (idx_payroll_entries_employee_id)：
┌─────────────┬──────────────────┐
│ employee_id │ 指向表中行的位置  │
├─────────────┼──────────────────┤
│     123     │ → 第2行, 第4行   │
│     456     │ → 第1行          │
│     789     │ → 第3行          │
└─────────────┴──────────────────┘
*/

-- 7. 不同类型索引的创建示例

-- 普通B-Tree索引（用于等值查询和范围查询）
CREATE INDEX IF NOT EXISTS idx_employees_hire_date 
ON hr.employees(hire_date);

-- 复合索引（多个字段组合）
CREATE INDEX IF NOT EXISTS idx_payroll_period_employee 
ON payroll.payroll_entries(payroll_period_id, employee_id);

-- JSONB字段的GIN索引（用于JSON查询）
CREATE INDEX IF NOT EXISTS idx_payroll_earnings_gin 
ON payroll.payroll_entries USING GIN (earnings_details);

-- 8. 索引使用的查询示例

-- 使用普通索引
SELECT * FROM hr.employees 
WHERE hire_date >= '2020-01-01';

-- 使用复合索引
SELECT * FROM payroll.payroll_entries 
WHERE payroll_period_id = 202401 AND employee_id = 123;

-- 使用JSONB索引
SELECT * FROM payroll.payroll_entries 
WHERE earnings_details ? 'BASIC_SALARY';

-- 9. 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "索引被使用次数",
    idx_tup_read as "通过索引读取的行数"
FROM pg_stat_user_indexes 
WHERE tablename = 'payroll_entries'
ORDER BY idx_scan DESC; 