-- 批量创建聘用人员扣除调整项工资组件
-- 解决"无效的扣除项代码"错误

INSERT INTO payroll_component_definitions (code, name, type, calculation_method, is_taxable, is_social_security_base, is_housing_fund_base, display_order, is_active, effective_date)
VALUES 
    ('ONE_TIME_DEDUCTION_ADJUSTMENT', '一次性补扣发', 'PERSONAL_DEDUCTION', 'FIXED_AMOUNT', false, false, false, 100, true, CURRENT_DATE),
    ('PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT', '绩效奖金补扣发', 'PERSONAL_DEDUCTION', 'FIXED_AMOUNT', false, false, false, 101, true, CURRENT_DATE),
    ('REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT', '奖励绩效补扣发', 'PERSONAL_DEDUCTION', 'FIXED_AMOUNT', false, false, false, 102, true, CURRENT_DATE),
    ('REFUND_DEDUCTION_ADJUSTMENT', '补扣（退）款', 'PERSONAL_DEDUCTION', 'FIXED_AMOUNT', false, false, false, 103, true, CURRENT_DATE),
    ('MEDICAL_2022_DEDUCTION_ADJUSTMENT', '补扣2022年医保款', 'PERSONAL_DEDUCTION', 'FIXED_AMOUNT', false, false, false, 104, true, CURRENT_DATE)
ON CONFLICT (code) DO NOTHING; 