-- 📊 索引性能对比演示

-- 1. 模拟无索引查询（全表扫描）
-- 假设表中有10万条记录，查找employee_id=12345的记录

/*
无索引情况：
- 数据库需要检查每一行的employee_id字段
- 最坏情况：检查全部10万行
- 时间复杂度：O(n) 线性增长

┌─── 扫描方向 ───┐
│ 检查行1: employee_id=1     ❌ 不匹配，继续
│ 检查行2: employee_id=2     ❌ 不匹配，继续  
│ 检查行3: employee_id=3     ❌ 不匹配，继续
│ ...
│ 检查行12345: employee_id=12345 ✅ 找到了！
│ 总共检查了12,345行
└─────────────────────────────────────────
*/

-- 2. 有索引查询（索引扫描）
/*
有索引情况：
- 数据库使用B-Tree索引快速定位
- 最多检查log₂(100000) ≈ 17次比较
- 时间复杂度：O(log n) 对数增长

B-Tree索引查找过程：
            [50000]         ← 根节点
           /       \
      [25000]      [75000]   ← 中间节点
      /     \      /     \
 [12500] [37500] [62500] [87500] ← 叶子节点
    |
    └── 快速定位到employee_id=12345的位置
    
总共只需要3-4次比较就能找到！
*/

-- 3. 实际测试脚本
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time_ms numeric;
BEGIN
    -- 测试有索引的查询
    start_time := clock_timestamp();
    
    PERFORM * FROM payroll.payroll_entries 
    WHERE employee_id = 1 
    LIMIT 1;
    
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RAISE NOTICE '有索引查询耗时: % 毫秒', execution_time_ms;
    
    -- 如果要测试无索引，需要先删除索引（不推荐在生产环境）
    -- DROP INDEX IF EXISTS idx_payroll_entries_employee_id;
    -- 然后重新测试相同查询
    
END $$;

-- 4. 查看查询执行计划
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM payroll.payroll_entries 
WHERE employee_id = 1;

/*
执行计划解读：
有索引：
Index Scan using idx_payroll_entries_employee_id on payroll_entries
  Index Cond: (employee_id = 1)
  Planning Time: 0.123 ms
  Execution Time: 0.045 ms

无索引：
Seq Scan on payroll_entries
  Filter: (employee_id = 1)
  Rows Removed by Filter: 50999
  Planning Time: 0.087 ms  
  Execution Time: 15.234 ms
*/

-- 5. 监控索引效果
SELECT 
    schemaname as "模式",
    tablename as "表名", 
    indexname as "索引名",
    idx_scan as "索引使用次数",
    CASE 
        WHEN idx_scan = 0 THEN '😴 未使用'
        WHEN idx_scan < 100 THEN '🟡 较少使用'  
        WHEN idx_scan < 1000 THEN '🟠 中等使用'
        ELSE '🟢 频繁使用'
    END as "使用状态"
FROM pg_stat_user_indexes 
WHERE schemaname IN ('payroll', 'hr')
ORDER BY idx_scan DESC; 