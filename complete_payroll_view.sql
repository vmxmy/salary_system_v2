
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
    pe.id as payroll_entry_id,
    pe.employee_id,
    pe.payroll_period_id,
    pe.payroll_run_id,
    
    -- 员工基本信息
    e.employee_code,
    e.first_name,
    e.last_name,
    COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') as full_name,
    e.id_number,
    e.phone_number as phone,
    e.email,
    e.hire_date,
    COALESCE(e.is_active, false) as employee_is_active,
    
    -- 部门和职位信息
    COALESCE(d.name, '未分配部门') as department_name,
    COALESCE(pos.name, '未分配职位') as position_name,
    
    -- 人员身份分类信息
    COALESCE(pc.name, '未分类') as personnel_category_name,
    COALESCE(ph.root_name, '未分类') as root_personnel_category_name,
    
    -- 薪资期间信息
    COALESCE(pp.name, '未知期间') as payroll_period_name,
    pp.start_date as payroll_period_start_date,
    pp.end_date as payroll_period_end_date,
    pp.pay_date as payroll_period_pay_date,
    
    -- 薪资运行信息
    pr.run_date as payroll_run_date,
    
    -- 薪资汇总信息
    COALESCE(pe.gross_pay, 0.00) as gross_pay,
    COALESCE(pe.total_deductions, 0.00) as total_deductions,
    COALESCE(pe.net_pay, 0.00) as net_pay,
    
        -- 应发项目（EARNING类型）- 展开为标准字段
        COALESCE((pe.earnings_details->>'MONTHLY_PERFORMANCE_BONUS')::numeric, 0.00) as monthly_performance_bonus, -- 月奖励绩效
        COALESCE((pe.earnings_details->>'BASIC_SALARY')::numeric, 0.00) as basic_salary, -- 基本工资
        COALESCE((pe.earnings_details->>'ONLY_CHILD_PARENT_BONUS')::numeric, 0.00) as only_child_parent_bonus, -- 独生子女父母奖励金
        COALESCE((pe.earnings_details->>'POSITION_TECH_GRADE_SALARY')::numeric, 0.00) as position_tech_grade_salary, -- 职务/技术等级工资
        COALESCE((pe.earnings_details->>'TRAFFIC_ALLOWANCE')::numeric, 0.00) as traffic_allowance, -- 公务交通补贴
        COALESCE((pe.earnings_details->>'GRADE_POSITION_LEVEL_SALARY')::numeric, 0.00) as grade_position_level_salary, -- 级别/岗位级别工资
        COALESCE((pe.earnings_details->>'PERFORMANCE_BONUS')::numeric, 0.00) as performance_bonus, -- 奖励性绩效工资
        COALESCE((pe.earnings_details->>'BASIC_PERFORMANCE_AWARD')::numeric, 0.00) as basic_performance_award, -- 基础绩效奖
        COALESCE((pe.earnings_details->>'POSITION_SALARY_GENERAL')::numeric, 0.00) as position_salary_general, -- 岗位工资
        COALESCE((pe.earnings_details->>'BASIC_PERFORMANCE_SALARY')::numeric, 0.00) as basic_performance_salary, -- 基础性绩效工资
        COALESCE((pe.earnings_details->>'BACK_PAY')::numeric, 0.00) as back_pay, -- 补发工资
        COALESCE((pe.earnings_details->>'GRADE_SALARY')::numeric, 0.00) as grade_salary, -- 级别工资
        COALESCE((pe.earnings_details->>'PERFORMANCE_SALARY')::numeric, 0.00) as performance_salary, -- 绩效工资
        COALESCE((pe.earnings_details->>'POSITION_ALLOWANCE')::numeric, 0.00) as position_allowance, -- 岗位职务补贴
        COALESCE((pe.earnings_details->>'ALLOWANCE_GENERAL')::numeric, 0.00) as allowance_general, -- 补助
        COALESCE((pe.earnings_details->>'SALARY_GRADE')::numeric, 0.00) as salary_grade, -- 薪级工资
        COALESCE((pe.earnings_details->>'BASIC_PERFORMANCE')::numeric, 0.00) as basic_performance, -- 月基础绩效
        COALESCE((pe.earnings_details->>'GENERAL_ALLOWANCE')::numeric, 0.00) as general_allowance, -- 津贴
        COALESCE((pe.earnings_details->>'PETITION_ALLOWANCE')::numeric, 0.00) as petition_allowance, -- 信访工作人员岗位工作津贴
        COALESCE((pe.earnings_details->>'QUARTERLY_PERFORMANCE_ASSESSMENT')::numeric, 0.00) as quarterly_performance_assessment, -- 季度绩效考核薪酬
        COALESCE((pe.earnings_details->>'PERFORMANCE_BONUS_BACK_PAY')::numeric, 0.00) as performance_bonus_back_pay, -- 奖励绩效补发
        COALESCE((pe.earnings_details->>'REFORM_ALLOWANCE_1993')::numeric, 0.00) as reform_allowance_1993, -- 九三年工改保留津补贴
        COALESCE((pe.earnings_details->>'CIVIL_STANDARD_ALLOWANCE')::numeric, 0.00) as civil_standard_allowance, -- 公务员规范后津补贴
        COALESCE((pe.earnings_details->>'PROBATION_SALARY')::numeric, 0.00) as probation_salary, -- 试用期工资
        COALESCE((pe.earnings_details->>'STAFF_SALARY_GRADE')::numeric, 0.00) as staff_salary_grade, -- 事业单位人员薪级工资
        COALESCE((pe.earnings_details->>'TOWNSHIP_ALLOWANCE')::numeric, 0.00) as township_allowance, -- 乡镇工作补贴
        COALESCE((pe.earnings_details->>'QUARTERLY_PERFORMANCE_Q1')::numeric, 0.00) as quarterly_performance_q1, -- 1季度绩效考核薪酬

        -- 个人扣除项目（PERSONAL_DEDUCTION类型）- 展开为标准字段
        COALESCE((pe.deductions_details->>'MEDICAL_INS_PERSONAL_AMOUNT')::numeric, 0.00) as medical_ins_personal_amount, -- 医疗保险个人缴纳金额
        COALESCE((pe.deductions_details->>'MEDICAL_INS_PERSONAL_TOTAL')::numeric, 0.00) as medical_ins_personal_total, -- 医疗保险个人应缴总额
        COALESCE((pe.deductions_details->>'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT')::numeric, 0.00) as occupational_pension_personal_amount, -- 职业年金个人应缴费额
        COALESCE((pe.deductions_details->>'PENSION_PERSONAL_AMOUNT')::numeric, 0.00) as pension_personal_amount, -- 养老保险个人应缴金额
        COALESCE((pe.deductions_details->>'PERSONAL_INCOME_TAX')::numeric, 0.00) as personal_income_tax, -- 个人所得税
        COALESCE((pe.deductions_details->>'UNEMPLOYMENT_PERSONAL_AMOUNT')::numeric, 0.00) as unemployment_personal_amount, -- 失业保险个人应缴金额
        COALESCE((pe.deductions_details->>'ONE_TIME_ADJUSTMENT')::numeric, 0.00) as one_time_adjustment, -- 一次性补扣发
        COALESCE((pe.deductions_details->>'PERFORMANCE_BONUS_ADJUSTMENT')::numeric, 0.00) as performance_bonus_adjustment, -- 绩效奖金补扣发
        COALESCE((pe.deductions_details->>'REWARD_PERFORMANCE_ADJUSTMENT')::numeric, 0.00) as reward_performance_adjustment, -- 奖励绩效补扣发
        COALESCE((pe.deductions_details->>'HOUSING_FUND_PERSONAL')::numeric, 0.00) as housing_fund_personal, -- 个人缴住房公积金
        COALESCE((pe.deductions_details->>'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT')::numeric, 0.00) as performance_bonus_deduction_adjustment, -- 绩效奖金补扣发
        COALESCE((pe.deductions_details->>'SOCIAL_INSURANCE_ADJUSTMENT')::numeric, 0.00) as social_insurance_adjustment, -- 补扣社保
        COALESCE((pe.deductions_details->>'REFUND_DEDUCTION_ADJUSTMENT')::numeric, 0.00) as refund_deduction_adjustment, -- 补扣（退）款
        COALESCE((pe.deductions_details->>'MEDICAL_2022_DEDUCTION_ADJUSTMENT')::numeric, 0.00) as medical_2022_deduction_adjustment, -- 补扣2022年医保款

        -- 单位扣除项目（EMPLOYER_DEDUCTION类型）- 展开为标准字段
        COALESCE((pe.deductions_details->>'INJURY_EMPLOYER_AMOUNT')::numeric, 0.00) as injury_employer_amount, -- 工伤单位应缴金额
        COALESCE((pe.deductions_details->>'MEDICAL_INS_EMPLOYER_AMOUNT')::numeric, 0.00) as medical_ins_employer_amount, -- 医疗保险单位缴纳金额
        COALESCE((pe.deductions_details->>'MEDICAL_INS_EMPLOYER_TOTAL')::numeric, 0.00) as medical_ins_employer_total, -- 医疗保险单位应缴总额
        COALESCE((pe.deductions_details->>'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT')::numeric, 0.00) as occupational_pension_employer_amount, -- 职业年金单位应缴费额
        COALESCE((pe.deductions_details->>'PENSION_EMPLOYER_AMOUNT')::numeric, 0.00) as pension_employer_amount, -- 养老保险单位应缴金额
        COALESCE((pe.deductions_details->>'SERIOUS_ILLNESS_EMPLOYER_AMOUNT')::numeric, 0.00) as serious_illness_employer_amount, -- 大病医疗单位缴纳
        COALESCE((pe.deductions_details->>'UNEMPLOYMENT_EMPLOYER_AMOUNT')::numeric, 0.00) as unemployment_employer_amount, -- 失业保险单位应缴金额
        COALESCE((pe.deductions_details->>'HOUSING_FUND_EMPLOYER')::numeric, 0.00) as housing_fund_employer, -- 单位缴住房公积金

        -- 计算基数（CALCULATION_BASE类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'MEDICAL_INS_BASE')::numeric, 0.00) as medical_ins_base, -- 医疗保险缴费基数
        COALESCE((pe.calculation_inputs->>'MEDICAL_INS_BASE_SALARY')::numeric, 0.00) as medical_ins_base_salary, -- 医疗保险缴费工资
        COALESCE((pe.calculation_inputs->>'MEDICAL_INS_PAY_SALARY')::numeric, 0.00) as medical_ins_pay_salary, -- 医疗保险缴费工资
        COALESCE((pe.calculation_inputs->>'OCCUPATIONAL_PENSION_BASE')::numeric, 0.00) as occupational_pension_base, -- 职业年金缴费基数
        COALESCE((pe.calculation_inputs->>'OCCUPATIONAL_PENSION_PAY_SALARY')::numeric, 0.00) as occupational_pension_pay_salary, -- 职业年金缴费工资
        COALESCE((pe.calculation_inputs->>'PENSION_BASE')::numeric, 0.00) as pension_base, -- 养老缴费基数
        COALESCE((pe.calculation_inputs->>'TAX_BASE')::numeric, 0.00) as tax_base, -- 计税基数
        COALESCE((pe.calculation_inputs->>'HOUSING_FUND_BASE')::numeric, 0.00) as housing_fund_base, -- 住房公积金缴费基数

        -- 计算费率（CALCULATION_RATE类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'MEDICAL_INS_EMPLOYER_RATE')::numeric, 0.00) as medical_ins_employer_rate, -- 医疗保险单位缴纳费率
        COALESCE((pe.calculation_inputs->>'MEDICAL_INS_PERSONAL_RATE')::numeric, 0.00) as medical_ins_personal_rate, -- 医疗保险个人缴纳费率
        COALESCE((pe.calculation_inputs->>'OCCUPATIONAL_PENSION_EMPLOYER_RATE')::numeric, 0.00) as occupational_pension_employer_rate, -- 职业年金单位缴费费率
        COALESCE((pe.calculation_inputs->>'OCCUPATIONAL_PENSION_PERSONAL_RATE')::numeric, 0.00) as occupational_pension_personal_rate, -- 职业年金个人费率
        COALESCE((pe.calculation_inputs->>'PENSION_EMPLOYER_RATE')::numeric, 0.00) as pension_employer_rate, -- 养老单位缴费比例
        COALESCE((pe.calculation_inputs->>'PENSION_PERSONAL_RATE')::numeric, 0.00) as pension_personal_rate, -- 养老个人缴费比例
        COALESCE((pe.calculation_inputs->>'SERIOUS_ILLNESS_EMPLOYER_RATE')::numeric, 0.00) as serious_illness_employer_rate, -- 大病医疗单位缴纳费率
        COALESCE((pe.calculation_inputs->>'TAX_RATE')::numeric, 0.00) as tax_rate, -- 适用税率
        COALESCE((pe.calculation_inputs->>'HOUSING_FUND_PERSONAL_RATE')::numeric, 0.00) as housing_fund_personal_rate, -- 住房公积金个人缴费比例
        COALESCE((pe.calculation_inputs->>'HOUSING_FUND_EMPLOYER_RATE')::numeric, 0.00) as housing_fund_employer_rate, -- 住房公积金单位缴费比例

        -- 计算结果（CALCULATION_RESULT类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'AFTER_TAX_SALARY')::numeric, 0.00) as after_tax_salary, -- 税后工资
        COALESCE((pe.calculation_inputs->>'QUICK_DEDUCTION')::numeric, 0.00) as quick_deduction, -- 速算扣除数
        COALESCE((pe.calculation_inputs->>'TAXABLE_INCOME')::numeric, 0.00) as taxable_income, -- 应纳税所得额
        COALESCE((pe.calculation_inputs->>'TAX_DEDUCTION_AMOUNT')::numeric, 0.00) as tax_deduction_amount, -- 扣除额
        COALESCE((pe.calculation_inputs->>'TAX_EXEMPT_AMOUNT')::numeric, 0.00) as tax_exempt_amount, -- 免税额

        -- 其他字段（OTHER类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'UNIFIED_PAYROLL_FLAG')::boolean, false) as unified_payroll_flag, -- 工资统发
        COALESCE((pe.calculation_inputs->>'FISCAL_SUPPORT_FLAG')::boolean, false) as fiscal_support_flag, -- 财政供养
        COALESCE((pe.calculation_inputs->>'ANNUAL_FIXED_SALARY_TOTAL')::numeric, 0.00) as annual_fixed_salary_total, -- 固定薪酬全年应发数
    
    -- 状态信息 - 提供默认值避免NULL
    COALESCE(pe.status_lookup_value_id, 1) as status_lookup_value_id,
    COALESCE(pe.remarks, '') as remarks,
    
    -- 审计信息
    pe.audit_status,
    pe.audit_timestamp,
    pe.auditor_id,
    pe.audit_notes,
    pe.version,
    
    -- 时间字段
    COALESCE(pe.calculated_at, pe.updated_at, NOW()) as calculated_at,
    pe.updated_at,
    
    -- 原始JSONB数据（保留用于调试和向后兼容）
    pe.earnings_details as raw_earnings_details,
    pe.deductions_details as raw_deductions_details,
    pe.calculation_inputs as raw_calculation_inputs,
    pe.calculation_log as raw_calculation_log
    
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
LEFT JOIN personnel_hierarchy ph ON pc.id = ph.category_id
LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id;
