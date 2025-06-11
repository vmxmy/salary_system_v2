-- 添加缺失的保险费率组件到薪资组件定义表
-- 执行日期: 2025年1月
-- 目的: 完善薪资批量导入功能，支持失业保险和工伤保险费率字段

-- 1. 失业保险单位缴费费率
INSERT INTO config.payroll_component_definitions 
(
    code, 
    name, 
    type, 
    calculation_method, 
    calculation_parameters,
    is_taxable, 
    is_social_security_base, 
    is_housing_fund_base, 
    display_order, 
    is_active, 
    effective_date,
    end_date
) 
VALUES 
(
    'UNEMPLOYMENT_EMPLOYER_RATE', 
    '失业保险单位缴费费率', 
    'CALCULATION_RATE',
    'FixedPercentage',
    '{"default_rate": 0.005, "min_rate": 0.0, "max_rate": 0.02}',
    false, 
    false, 
    false, 
    0, 
    true, 
    '2025-01-01',
    NULL
);

-- 2. 失业保险个人缴费费率
INSERT INTO config.payroll_component_definitions 
(
    code, 
    name, 
    type, 
    calculation_method, 
    calculation_parameters,
    is_taxable, 
    is_social_security_base, 
    is_housing_fund_base, 
    display_order, 
    is_active, 
    effective_date,
    end_date
) 
VALUES 
(
    'UNEMPLOYMENT_PERSONAL_RATE', 
    '失业保险个人缴费费率', 
    'CALCULATION_RATE',
    'FixedPercentage',
    '{"default_rate": 0.005, "min_rate": 0.0, "max_rate": 0.02}',
    false, 
    false, 
    false, 
    0, 
    true, 
    '2025-01-01',
    NULL
);

-- 3. 工伤保险单位缴费费率
INSERT INTO config.payroll_component_definitions 
(
    code, 
    name, 
    type, 
    calculation_method, 
    calculation_parameters,
    is_taxable, 
    is_social_security_base, 
    is_housing_fund_base, 
    display_order, 
    is_active, 
    effective_date,
    end_date
) 
VALUES 
(
    'INJURY_EMPLOYER_RATE', 
    '工伤保险单位缴费费率', 
    'CALCULATION_RATE',
    'FixedPercentage',
    '{"default_rate": 0.002, "min_rate": 0.0, "max_rate": 0.01}',
    false, 
    false, 
    false, 
    0, 
    true, 
    '2025-01-01',
    NULL
);

-- 验证插入结果
SELECT 
    id,
    code, 
    name, 
    type,
    is_active,
    effective_date
FROM config.payroll_component_definitions 
WHERE code IN (
    'UNEMPLOYMENT_EMPLOYER_RATE', 
    'UNEMPLOYMENT_PERSONAL_RATE', 
    'INJURY_EMPLOYER_RATE'
)
ORDER BY code; 