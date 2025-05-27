-- 修复 ANNUAL_FIXED_SALARY_TOTAL 组件类型
-- 将其从 STAT 类型更改为 EARNING 类型，因为它是收入项

UPDATE config.payroll_component_definitions 
SET 
    type = 'EARNING',
    is_taxable = true,
    display_order = 50
WHERE code = 'ANNUAL_FIXED_SALARY_TOTAL';

-- 验证更新结果
SELECT code, name, type, is_taxable, is_active 
FROM config.payroll_component_definitions 
WHERE code = 'ANNUAL_FIXED_SALARY_TOTAL'; 