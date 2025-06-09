-- 创建使用中文字段别名的 v_comprehensive_employee_payroll 视图
-- 包含所有薪资组件的中文映射和两个新增字段

CREATE OR REPLACE VIEW reports.v_comprehensive_employee_payroll AS
WITH personnel_hierarchy AS (
    -- 递归CTE获取人员身份的顶级分类
    WITH RECURSIVE category_tree AS (
        -- 基础查询：顶级分类
        SELECT 
            id,
            name,
            parent_category_id,
            id as root_id,
            name as root_name,
            0 as level
        FROM hr.personnel_categories 
        WHERE parent_category_id IS NULL
        
        UNION ALL
        
        -- 递归查询：子分类
        SELECT 
            pc.id,
            pc.name,
            pc.parent_category_id,
            ct.root_id,
            ct.root_name,
            ct.level + 1
        FROM hr.personnel_categories pc
        INNER JOIN category_tree ct ON pc.parent_category_id = ct.id
    )
    SELECT 
        id as category_id,
        root_id,
        root_name
    FROM category_tree
)
SELECT 
    -- 基本标识信息
    pe.id as 薪资条目ID,
    pe.employee_id as 员工ID,
    pe.payroll_period_id as 薪资期间ID,
    pe.payroll_run_id as 薪资运行ID,
    
    -- 员工基本信息
    e.employee_code as 员工编号,
    e.first_name as 名,
    e.last_name as 姓,
    COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') as 姓名,
    e.id_number as 身份证号,
    e.phone_number as 电话,
    e.email as 邮箱,
    e.hire_date as 入职日期,
    COALESCE(e.is_active, false) as 员工状态,
    
    -- 部门和职位信息
    COALESCE(d.name, '未分配部门') as 部门名称,
    COALESCE(pos.name, '未分配职位') as 职位名称,
    
    -- 人员身份分类信息
    COALESCE(pc.name, '未分类') as 人员类别,
    COALESCE(ph.root_name, '未分类') as 根人员类别,
    
    -- 薪资期间信息
    COALESCE(pp.name, '未知期间') as 薪资期间名称,
    pp.start_date as 薪资期间开始日期,
    pp.end_date as 薪资期间结束日期,
    pp.pay_date as 薪资发放日期,
    
    -- 薪资运行信息
    pr.run_date as 薪资运行日期,
    
    -- 薪资汇总信息
    COALESCE(pe.gross_pay, 0.00) as 应发合计,
    COALESCE(pe.total_deductions, 0.00) as 扣除合计,
    COALESCE(pe.net_pay, 0.00) as 实发合计,
    
    -- 应发项目（EARNING类型）- 使用中文别名
    COALESCE((pe.earnings_details->'MONTHLY_PERFORMANCE_BONUS'->>'amount')::numeric, 0.00) as 月奖励绩效,
    COALESCE((pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric, 0.00) as 基本工资,
    COALESCE((pe.earnings_details->'ONLY_CHILD_PARENT_BONUS'->>'amount')::numeric, 0.00) as 独生子女父母奖励金,
    COALESCE((pe.earnings_details->'POSITION_TECH_GRADE_SALARY'->>'amount')::numeric, 0.00) as 职务技术等级工资,
    COALESCE((pe.earnings_details->'TRAFFIC_ALLOWANCE'->>'amount')::numeric, 0.00) as 公务交通补贴,
    COALESCE((pe.earnings_details->'GRADE_POSITION_LEVEL_SALARY'->>'amount')::numeric, 0.00) as 级别岗位级别工资,
    COALESCE((pe.earnings_details->'PERFORMANCE_BONUS'->>'amount')::numeric, 0.00) as 奖励性绩效工资,
    COALESCE((pe.earnings_details->'BASIC_PERFORMANCE_AWARD'->>'amount')::numeric, 0.00) as 基础绩效奖,
    COALESCE((pe.earnings_details->'POSITION_SALARY_GENERAL'->>'amount')::numeric, 0.00) as 岗位工资,
    COALESCE((pe.earnings_details->'BASIC_PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) as 基础性绩效工资,
    COALESCE((pe.earnings_details->'BACK_PAY'->>'amount')::numeric, 0.00) as 补发工资,
    COALESCE((pe.earnings_details->'GRADE_SALARY'->>'amount')::numeric, 0.00) as 级别工资,
    COALESCE((pe.earnings_details->'PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) as 绩效工资,
    COALESCE((pe.earnings_details->'POSITION_ALLOWANCE'->>'amount')::numeric, 0.00) as 岗位职务补贴,
    COALESCE((pe.earnings_details->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0.00) as 补助,
    COALESCE((pe.earnings_details->'SALARY_GRADE'->>'amount')::numeric, 0.00) as 薪级工资,
    COALESCE((pe.earnings_details->'BASIC_PERFORMANCE'->>'amount')::numeric, 0.00) as 月基础绩效,
    COALESCE((pe.earnings_details->'GENERAL_ALLOWANCE'->>'amount')::numeric, 0.00) as 津贴,
    COALESCE((pe.earnings_details->'PETITION_ALLOWANCE'->>'amount')::numeric, 0.00) as 信访工作人员岗位工作津贴,
    COALESCE((pe.earnings_details->'QUARTERLY_PERFORMANCE_ASSESSMENT'->>'amount')::numeric, 0.00) as 季度绩效考核薪酬,
    COALESCE((pe.earnings_details->'PERFORMANCE_BONUS_BACK_PAY'->>'amount')::numeric, 0.00) as 奖励绩效补发,
    COALESCE((pe.earnings_details->'REFORM_ALLOWANCE_1993'->>'amount')::numeric, 0.00) as 九三年工改保留津补贴,
    COALESCE((pe.earnings_details->'CIVIL_STANDARD_ALLOWANCE'->>'amount')::numeric, 0.00) as 公务员规范后津补贴,
    COALESCE((pe.earnings_details->'PROBATION_SALARY'->>'amount')::numeric, 0.00) as 试用期工资,
    COALESCE((pe.earnings_details->'STAFF_SALARY_GRADE'->>'amount')::numeric, 0.00) as 事业单位人员薪级工资,
    COALESCE((pe.earnings_details->'TOWNSHIP_ALLOWANCE'->>'amount')::numeric, 0.00) as 乡镇工作补贴,
    COALESCE((pe.earnings_details->'QUARTERLY_PERFORMANCE_Q1'->>'amount')::numeric, 0.00) as 一季度绩效考核薪酬,

    -- 个人扣除项目（PERSONAL_DEDUCTION类型）- 使用中文别名
    COALESCE((pe.deductions_details->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as 医疗保险个人缴纳金额,
    COALESCE((pe.deductions_details->'MEDICAL_INS_PERSONAL_TOTAL'->>'amount')::numeric, 0.00) as 医疗保险个人应缴总额,
    COALESCE((pe.deductions_details->'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as 职业年金个人应缴费额,
    COALESCE((pe.deductions_details->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as 养老保险个人应缴金额,
    COALESCE((pe.deductions_details->'PERSONAL_INCOME_TAX'->>'amount')::numeric, 0.00) as 个人所得税,
    COALESCE((pe.deductions_details->'UNEMPLOYMENT_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as 失业保险个人应缴金额,
    COALESCE((pe.deductions_details->'ONE_TIME_ADJUSTMENT'->>'amount')::numeric, 0.00) as 一次性补扣发,
    COALESCE((pe.deductions_details->'PERFORMANCE_BONUS_ADJUSTMENT'->>'amount')::numeric, 0.00) as 绩效奖金补扣发,
    COALESCE((pe.deductions_details->'REWARD_PERFORMANCE_ADJUSTMENT'->>'amount')::numeric, 0.00) as 奖励绩效补扣发,
    COALESCE((pe.deductions_details->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0.00) as 个人缴住房公积金,
    COALESCE((pe.deductions_details->'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT'->>'amount')::numeric, 0.00) as 绩效奖金补扣发2,
    COALESCE((pe.deductions_details->'SOCIAL_INSURANCE_ADJUSTMENT'->>'amount')::numeric, 0.00) as 补扣社保,
    COALESCE((pe.deductions_details->'REFUND_DEDUCTION_ADJUSTMENT'->>'amount')::numeric, 0.00) as 补扣退款,
    COALESCE((pe.deductions_details->'MEDICAL_2022_DEDUCTION_ADJUSTMENT'->>'amount')::numeric, 0.00) as 补扣2022年医保款,

    -- 单位扣除项目（EMPLOYER_DEDUCTION类型）- 使用中文别名
    COALESCE((pe.deductions_details->'INJURY_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as 工伤单位应缴金额,
    COALESCE((pe.deductions_details->'MEDICAL_INS_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as 医疗保险单位缴纳金额,
    COALESCE((pe.deductions_details->'MEDICAL_INS_EMPLOYER_TOTAL'->>'amount')::numeric, 0.00) as 医疗保险单位应缴总额,
    COALESCE((pe.deductions_details->'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as 职业年金单位应缴费额,
    COALESCE((pe.deductions_details->'PENSION_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as 养老保险单位应缴金额,
    COALESCE((pe.deductions_details->'SERIOUS_ILLNESS_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as 大病医疗单位缴纳,
    COALESCE((pe.deductions_details->'UNEMPLOYMENT_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as 失业保险单位应缴金额,
    COALESCE((pe.deductions_details->'HOUSING_FUND_EMPLOYER'->>'amount')::numeric, 0.00) as 单位缴住房公积金,

    -- 计算基数（CALCULATION_BASE类型）- 使用中文别名
    COALESCE((pe.calculation_inputs->'MEDICAL_INS_BASE'->>'amount')::numeric, 0.00) as 医疗保险缴费基数,
    COALESCE((pe.calculation_inputs->'MEDICAL_INS_BASE_SALARY'->>'amount')::numeric, 0.00) as 医疗保险缴费工资,
    COALESCE((pe.calculation_inputs->'MEDICAL_INS_PAY_SALARY'->>'amount')::numeric, 0.00) as 医疗保险缴费工资2,
    COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_BASE'->>'amount')::numeric, 0.00) as 职业年金缴费基数,
    COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_PAY_SALARY'->>'amount')::numeric, 0.00) as 职业年金缴费工资,
    COALESCE((pe.calculation_inputs->'PENSION_BASE'->>'amount')::numeric, 0.00) as 养老缴费基数,
    COALESCE((pe.calculation_inputs->'TAX_BASE'->>'amount')::numeric, 0.00) as 计税基数,
    COALESCE((pe.calculation_inputs->'HOUSING_FUND_BASE'->>'amount')::numeric, 0.00) as 住房公积金缴费基数,

    -- 计算费率（CALCULATION_RATE类型）- 使用中文别名
    COALESCE((pe.calculation_inputs->'MEDICAL_INS_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as 医疗保险单位缴纳费率,
    COALESCE((pe.calculation_inputs->'MEDICAL_INS_PERSONAL_RATE'->>'amount')::numeric, 0.00) as 医疗保险个人缴纳费率,
    COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as 职业年金单位缴费费率,
    COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_PERSONAL_RATE'->>'amount')::numeric, 0.00) as 职业年金个人费率,
    COALESCE((pe.calculation_inputs->'PENSION_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as 养老单位缴费比例,
    COALESCE((pe.calculation_inputs->'PENSION_PERSONAL_RATE'->>'amount')::numeric, 0.00) as 养老个人缴费比例,
    COALESCE((pe.calculation_inputs->'SERIOUS_ILLNESS_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as 大病医疗单位缴纳费率,
    COALESCE((pe.calculation_inputs->'TAX_RATE'->>'amount')::numeric, 0.00) as 适用税率,
    COALESCE((pe.calculation_inputs->'HOUSING_FUND_PERSONAL_RATE'->>'amount')::numeric, 0.00) as 住房公积金个人缴费比例,
    COALESCE((pe.calculation_inputs->'HOUSING_FUND_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as 住房公积金单位缴费比例,

    -- 计算结果（CALCULATION_RESULT类型）- 使用中文别名
    COALESCE((pe.calculation_inputs->'AFTER_TAX_SALARY'->>'amount')::numeric, 0.00) as 税后工资,
    COALESCE((pe.calculation_inputs->'QUICK_DEDUCTION'->>'amount')::numeric, 0.00) as 速算扣除数,
    COALESCE((pe.calculation_inputs->'TAXABLE_INCOME'->>'amount')::numeric, 0.00) as 应纳税所得额,
    COALESCE((pe.calculation_inputs->'TAX_DEDUCTION_AMOUNT'->>'amount')::numeric, 0.00) as 扣除额,
    COALESCE((pe.calculation_inputs->'TAX_EXEMPT_AMOUNT'->>'amount')::numeric, 0.00) as 免税额,

    -- 其他字段（OTHER类型）- 使用中文别名，包含新增的两个字段
    COALESCE((pe.calculation_inputs->'UNIFIED_PAYROLL_FLAG'->>'amount')::boolean, true) as 工资统发,
    COALESCE((pe.calculation_inputs->'FISCAL_SUPPORT_FLAG'->>'amount')::boolean, true) as 财政供养,
    COALESCE((pe.calculation_inputs->'ANNUAL_FIXED_SALARY_TOTAL'->>'amount')::numeric, 0.00) as 固定薪酬全年应发数,
    
    -- 状态信息 - 使用中文别名
    COALESCE(pe.status_lookup_value_id, 1) as 状态ID,
    COALESCE(pe.remarks, '') as 备注,
    
    -- 审计信息 - 使用中文别名
    pe.audit_status as 审计状态,
    pe.audit_timestamp as 审计时间,
    pe.auditor_id as 审计员ID,
    pe.audit_notes as 审计备注,
    pe.version as 版本号,
    
    -- 时间字段 - 使用中文别名
    COALESCE(pe.calculated_at, pe.updated_at, NOW()) as 计算时间,
    pe.updated_at as 更新时间,
    
    -- 原始JSONB数据（保留用于调试和向后兼容）
    pe.earnings_details as 原始应发明细,
    pe.deductions_details as 原始扣除明细,
    pe.calculation_inputs as 原始计算输入,
    pe.calculation_log as 原始计算日志
    
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
LEFT JOIN personnel_hierarchy ph ON pc.id = ph.category_id
LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id; 