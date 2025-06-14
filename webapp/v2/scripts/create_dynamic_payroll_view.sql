-- 基于薪资组件定义表动态生成综合薪资视图
-- 此脚本会根据 config.payroll_component_definitions 表中的标准定义自动生成所有字段

-- 1. 先删除现有视图
DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll;

-- 2. 动态生成视图的SQL构建
DO $$
DECLARE
    sql_text TEXT := '';
    earning_fields TEXT := '';
    personal_deduction_fields TEXT := '';
    employer_deduction_fields TEXT := '';
    calculation_base_fields TEXT := '';
    calculation_rate_fields TEXT := '';
    calculation_result_fields TEXT := '';
    other_fields TEXT := '';
    component_record RECORD;
    field_source TEXT;
    field_alias TEXT;
    actual_field_code TEXT;
BEGIN
    -- 基础视图开始部分
    sql_text := 'CREATE VIEW reports.v_comprehensive_employee_payroll AS
SELECT 
    pe.id AS "薪资条目id",
    pe.employee_id AS "员工id",
    pe.payroll_period_id AS "薪资期间id",
    pe.payroll_run_id AS "薪资运行id",
    eb.employee_code AS "员工编号",
    eb.first_name AS "名",
    eb.last_name AS "姓",
    eb.full_name AS "姓名",
    eb.id_number AS "身份证号",
    eb.phone_number AS "电话",
    eb.email AS "邮箱",
    eb.hire_date AS "入职日期",
    eb.employee_status AS "员工状态",
    eb.department_name AS "部门名称",
    eb.position_name AS "职位名称",
    eb.personnel_category_name AS "人员类别",
    eb.root_personnel_category_name AS "根人员类别",
    eb.department_id AS "部门id",
    eb.actual_position_id AS "实际职位id",
    eb.personnel_category_id AS "人员类别id",
    eb.social_security_client_number AS "社保客户号",
    eb.housing_fund_client_number AS "住房公积金客户号",
    COALESCE(pp.name, ''未知期间''::character varying) AS "薪资期间名称",
    pp.start_date AS "薪资期间开始日期",
    pp.end_date AS "薪资期间结束日期",
    pp.pay_date AS "薪资发放日期",
    pr.run_date AS "薪资运行日期",
    COALESCE(pe.gross_pay, 0.00) AS "应发合计",
    COALESCE(pe.total_deductions, 0.00) AS "扣除合计",
    COALESCE(pe.net_pay, 0.00) AS "实发合计"';

    -- 遍历所有活跃的薪资组件定义，按类型和显示顺序生成字段
    -- 排除与基础字段重复的汇总字段
    FOR component_record IN 
        SELECT code, name, type, display_order
        FROM config.payroll_component_definitions 
        WHERE is_active = true 
        AND code NOT IN ('GROSS_PAY_TOTAL', 'TOTAL_DEDUCTIONS', 'NET_PAY_TOTAL')
        ORDER BY 
            CASE type 
                WHEN 'EARNING' THEN 1
                WHEN 'PERSONAL_DEDUCTION' THEN 2
                WHEN 'EMPLOYER_DEDUCTION' THEN 3
                WHEN 'CALCULATION_BASE' THEN 4
                WHEN 'CALCULATION_RATE' THEN 5
                WHEN 'CALCULATION_RESULT' THEN 6
                WHEN 'OTHER' THEN 7
                ELSE 8
            END,
            display_order, 
            name
    LOOP
        -- 根据组件类型确定数据源字段
        CASE component_record.type
            WHEN 'EARNING' THEN
                field_source := 'pe.earnings_details';
            WHEN 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION' THEN
                field_source := 'pe.deductions_details';
            WHEN 'CALCULATION_BASE', 'CALCULATION_RATE', 'CALCULATION_RESULT', 'OTHER' THEN
                field_source := 'pe.calculation_inputs';
            ELSE
                field_source := 'pe.deductions_details'; -- 默认
        END CASE;

        -- 生成字段定义，处理字段名映射
        -- 对于医疗保险字段，需要映射到实际存储的字段名
        actual_field_code := CASE 
            WHEN component_record.code = 'MEDICAL_INS_PERSONAL_AMOUNT' THEN 'MEDICAL_PERSONAL_AMOUNT'
            WHEN component_record.code = 'MEDICAL_INS_EMPLOYER_AMOUNT' THEN 'MEDICAL_EMPLOYER_AMOUNT'
            WHEN component_record.code = 'HOUSING_FUND_PERSONAL' THEN 'HOUSING_FUND_PERSONAL'
            WHEN component_record.code = 'HOUSING_FUND_EMPLOYER' THEN 'HOUSING_FUND_EMPLOYER'
            ELSE component_record.code
        END;
        
        field_alias := ',
    COALESCE(((' || field_source || ' -> ''' || actual_field_code || '''::text) ->> ''amount''::text)::numeric, 0.00) AS "' || component_record.name || '"';

        -- 添加到相应的字段组
        CASE component_record.type
            WHEN 'EARNING' THEN
                earning_fields := earning_fields || field_alias;
            WHEN 'PERSONAL_DEDUCTION' THEN
                personal_deduction_fields := personal_deduction_fields || field_alias;
            WHEN 'EMPLOYER_DEDUCTION' THEN
                employer_deduction_fields := employer_deduction_fields || field_alias;
            WHEN 'CALCULATION_BASE' THEN
                calculation_base_fields := calculation_base_fields || field_alias;
            WHEN 'CALCULATION_RATE' THEN
                calculation_rate_fields := calculation_rate_fields || field_alias;
            WHEN 'CALCULATION_RESULT' THEN
                calculation_result_fields := calculation_result_fields || field_alias;
            WHEN 'OTHER' THEN
                -- OTHER类型字段可能是布尔类型，需要特殊处理
                IF component_record.code IN ('UNIFIED_PAYROLL_FLAG', 'FISCAL_SUPPORT_FLAG') THEN
                    other_fields := other_fields || ',
    COALESCE(((' || field_source || ' -> ''' || component_record.code || '''::text) ->> ''amount''::text)::boolean, true) AS "' || component_record.name || '"';
                ELSE
                    other_fields := other_fields || field_alias;
                END IF;
        END CASE;
    END LOOP;

    -- 组装完整的SQL
    sql_text := sql_text || 

    -- 应发项目（按显示顺序）
    earning_fields ||

    -- 个人扣除项目（按显示顺序）
    personal_deduction_fields ||

    -- 单位扣除项目（按显示顺序）
    employer_deduction_fields ||

    -- 计算基数（按显示顺序）
    calculation_base_fields ||

    -- 计算费率（按显示顺序）
    calculation_rate_fields ||

    -- 计算结果（按显示顺序）
    calculation_result_fields ||

    -- 其他字段（按显示顺序）
    other_fields ||

    -- 状态和元数据字段
    ',
    COALESCE(pe.status_lookup_value_id, (1)::bigint) AS "状态id",
    COALESCE(pe.remarks, ''''::text) AS "备注",
    pe.audit_status AS "审计状态",
    pe.audit_timestamp AS "审计时间",
    pe.auditor_id AS "审计员id",
    pe.audit_notes AS "审计备注",
    pe.version AS "版本号",
    COALESCE(pe.calculated_at, pe.updated_at, now()) AS "计算时间",
    pe.updated_at AS "更新时间",
    pe.earnings_details AS "原始应发明细",
    pe.deductions_details AS "原始扣除明细",
    pe.calculation_inputs AS "原始计算输入",
    pe.calculation_log AS "原始计算日志"
    
FROM (((payroll.payroll_entries pe
     LEFT JOIN reports.v_employees_basic eb ON ((pe.employee_id = eb.id)))
     LEFT JOIN payroll.payroll_periods pp ON ((pe.payroll_period_id = pp.id)))
     LEFT JOIN payroll.payroll_runs pr ON ((pe.payroll_run_id = pr.id)));';

    -- 执行生成的SQL
    EXECUTE sql_text;
    
    RAISE NOTICE '视图 reports.v_comprehensive_employee_payroll 已成功创建，包含 % 个动态字段', 
        (SELECT COUNT(*) FROM config.payroll_component_definitions WHERE is_active = true AND code NOT IN ('GROSS_PAY_TOTAL', 'TOTAL_DEDUCTIONS', 'NET_PAY_TOTAL'));
        
END $$; 