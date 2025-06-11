-- 添加薪资合计组件定义
-- 执行前请确保 "公务员规范后津补贴" 已经修改为 CALCULATION_RESULT 类型

-- 1. 应发合计
INSERT INTO config.payroll_component_definitions (
    code, name, type, calculation_method, calculation_parameters,
    is_taxable, is_social_security_base, is_housing_fund_base,
    display_order, is_active, effective_date
) VALUES (
    'GROSS_PAY_TOTAL',
    '应发合计',
    'CALCULATION_RESULT',
    'FORMULA',
    '{"formula": "sum_by_type(''EARNING'')", "description": "所有收入项目的总和"}',
    true, false, false,
    9000, true, '2024-01-01'
) ON CONFLICT (code) DO UPDATE SET
    type = EXCLUDED.type,
    calculation_method = EXCLUDED.calculation_method,
    calculation_parameters = EXCLUDED.calculation_parameters,
    display_order = EXCLUDED.display_order;

-- 2. 扣发合计
INSERT INTO config.payroll_component_definitions (
    code, name, type, calculation_method, calculation_parameters,
    is_taxable, is_social_security_base, is_housing_fund_base,
    display_order, is_active, effective_date
) VALUES (
    'TOTAL_DEDUCTIONS',
    '扣发合计',
    'CALCULATION_RESULT',
    'FORMULA',
    '{"formula": "sum_by_type(''PERSONAL_DEDUCTION'') + sum_by_type(''DEDUCTION'')", "description": "所有扣减项目的总和"}',
    false, false, false,
    9001, true, '2024-01-01'
) ON CONFLICT (code) DO UPDATE SET
    type = EXCLUDED.type,
    calculation_method = EXCLUDED.calculation_method,
    calculation_parameters = EXCLUDED.calculation_parameters,
    display_order = EXCLUDED.display_order;

-- 3. 实发合计
INSERT INTO config.payroll_component_definitions (
    code, name, type, calculation_method, calculation_parameters,
    is_taxable, is_social_security_base, is_housing_fund_base,
    display_order, is_active, effective_date
) VALUES (
    'NET_PAY_TOTAL',
    '实发合计',
    'CALCULATION_RESULT',
    'FORMULA',
    '{"formula": "calc_GROSS_PAY_TOTAL - calc_TOTAL_DEDUCTIONS", "description": "应发合计减去扣发合计"}',
    false, false, false,
    9002, true, '2024-01-01'
) ON CONFLICT (code) DO UPDATE SET
    type = EXCLUDED.type,
    calculation_method = EXCLUDED.calculation_method,
    calculation_parameters = EXCLUDED.calculation_parameters,
    display_order = EXCLUDED.display_order;

-- 验证结果
SELECT 
    code, 
    name, 
    type, 
    calculation_method, 
    calculation_parameters,
    display_order,
    is_active
FROM config.payroll_component_definitions 
WHERE code IN ('GROSS_PAY_TOTAL', 'TOTAL_DEDUCTIONS', 'NET_PAY_TOTAL', 'CIVIL_STANDARD_ALLOWANCE')
ORDER BY display_order; 