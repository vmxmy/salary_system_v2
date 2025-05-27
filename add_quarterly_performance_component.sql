-- 添加1季度绩效考核薪酬组件 (STAT类型)
-- 这是一个统计字段，用于记录员工季度绩效考核薪酬，不参与实际收入计算

-- 先检查是否已存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM config.payroll_component_definitions 
        WHERE code = 'QUARTERLY_PERFORMANCE_Q1'
    ) THEN
        INSERT INTO config.payroll_component_definitions (
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
        ) VALUES (
            'QUARTERLY_PERFORMANCE_Q1',
            '1季度绩效考核薪酬',
            'STAT',
            NULL,
            NULL,
            false,
            false,
            false,
            1010,
            true,
            CURRENT_DATE,
            NULL
        );
        RAISE NOTICE '已添加新组件: QUARTERLY_PERFORMANCE_Q1';
    ELSE
        UPDATE config.payroll_component_definitions SET
            name = '1季度绩效考核薪酬',
            type = 'STAT',
            is_taxable = false,
            is_social_security_base = false,
            is_housing_fund_base = false,
            display_order = 1010,
            is_active = true,
            effective_date = CURRENT_DATE
        WHERE code = 'QUARTERLY_PERFORMANCE_Q1';
        RAISE NOTICE '已更新现有组件: QUARTERLY_PERFORMANCE_Q1';
    END IF;
END $$;

-- 验证插入结果
SELECT 
    code,
    name,
    type,
    is_taxable,
    is_social_security_base,
    is_housing_fund_base,
    display_order,
    is_active,
    effective_date
FROM config.payroll_component_definitions 
WHERE code = 'QUARTERLY_PERFORMANCE_Q1'; 