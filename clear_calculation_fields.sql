-- =====================================================
-- 清零工资条目计算字段脚本
-- 用途：重置所有计算字段，准备重新执行计算引擎测试
-- =====================================================

-- 1. 备份当前数据（可选，建议执行）
-- CREATE TABLE payroll.payroll_entries_backup_$(date +%Y%m%d_%H%M%S) AS 
-- SELECT * FROM payroll.payroll_entries;

-- 2. 清零所有计算字段
UPDATE payroll.payroll_entries 
SET 
    gross_pay = 0.0000,           -- 应发工资合计
    total_deductions = 0.0000,    -- 扣除合计  
    net_pay = 0.0000,             -- 实发工资合计
    updated_at = CURRENT_TIMESTAMP
WHERE 
    payroll_run_id IN (50, 51, 52, 53, 54, 55, 64);  -- 指定工资运行ID

-- 3. 验证清零结果
SELECT 
    payroll_run_id,
    COUNT(*) as total_entries,
    SUM(gross_pay) as total_gross_pay,
    SUM(total_deductions) as total_deductions_sum,
    SUM(net_pay) as total_net_pay,
    -- 检查明细数据是否还存在
    COUNT(CASE WHEN earnings_details IS NOT NULL AND earnings_details != '{}' THEN 1 END) as entries_with_earnings,
    COUNT(CASE WHEN deductions_details IS NOT NULL AND deductions_details != '{}' THEN 1 END) as entries_with_deductions
FROM payroll.payroll_entries 
WHERE payroll_run_id IN (50, 51, 52, 53, 54, 55, 64)
GROUP BY payroll_run_id
ORDER BY payroll_run_id;

-- 4. 查看具体示例（运行ID 54的前3条记录）
SELECT 
    id,
    employee_id,
    gross_pay,
    total_deductions, 
    net_pay,
    -- 显示明细数据是否完整
    CASE 
        WHEN earnings_details IS NOT NULL AND earnings_details != '{}' 
        THEN '有收入明细' 
        ELSE '无收入明细' 
    END as earnings_status,
    CASE 
        WHEN deductions_details IS NOT NULL AND deductions_details != '{}' 
        THEN '有扣除明细' 
        ELSE '无扣除明细' 
    END as deductions_status
FROM payroll.payroll_entries 
WHERE payroll_run_id = 54 
ORDER BY id 
LIMIT 3;

-- =====================================================
-- 执行说明：
-- 1. 先执行备份（可选但推荐）
-- 2. 执行UPDATE语句清零计算字段
-- 3. 执行验证查询确认清零成功
-- 4. 明细数据（earnings_details, deductions_details）保持不变
-- ===================================================== 