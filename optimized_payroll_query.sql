-- 优化版本1: 使用物化视图（推荐用于报表）
SELECT 
    payroll_entry_id AS "薪资条目id",
    employee_id AS "员工id",
    payroll_period_id AS "薪资期间id",
    payroll_run_id AS "薪资运行id",
    employee_code AS "员工编号",
    first_name AS "名",
    last_name AS "姓",
    full_name AS "姓名",
    id_number AS "身份证号",
    phone_number AS "电话",
    email AS "邮箱",
    hire_date AS "入职日期",
    is_active AS "员工状态",
    department_name AS "部门名称",
    position_name AS "职位名称",
    category_name AS "人员类别",
    root_category_name AS "根人员类别",
    period_name AS "薪资期间名称",
    period_start_date AS "薪资期间开始日期",
    period_end_date AS "薪资期间结束日期",
    period_pay_date AS "薪资发放日期",
    payroll_run_date AS "薪资运行日期",
    gross_pay AS "应发合计",
    total_deductions AS "扣除合计",
    net_pay AS "实发合计",
    basic_salary AS "基本工资",
    performance_bonus AS "奖励性绩效工资",
    traffic_allowance AS "公务交通补贴",
    monthly_performance_bonus AS "月奖励绩效",
    personal_income_tax AS "个人所得税",
    pension_personal_amount AS "养老保险个人应缴金额",
    medical_ins_personal_amount AS "医疗保险个人缴纳金额",
    housing_fund_personal AS "个人缴住房公积金",
    audit_status AS "审计状态",
    audit_timestamp AS "审计时间",
    version AS "版本号",
    updated_at AS "更新时间"
FROM payroll.mv_payroll_report_summary
WHERE 1=1
    -- 添加过滤条件示例:
    -- AND payroll_period_id = $1
    -- AND department_name = $2
    -- AND is_active = true
ORDER BY payroll_period_id DESC, employee_code
LIMIT 1000; -- 建议添加LIMIT避免全表扫描

-- 优化版本2: 原查询结构优化（如果不能使用物化视图）
WITH personnel_hierarchy AS (
    -- 使用物化视图代替递归CTE
    SELECT category_id, root_id, root_name 
    FROM hr.mv_personnel_hierarchy
),
-- 预先提取JSONB字段以减少重复计算
payroll_with_components AS (
    SELECT 
        pe.*,
        -- 应发组件
        COALESCE((pe.earnings_details->>'BASIC_SALARY')::numeric, 0.00) AS basic_salary,
        COALESCE((pe.earnings_details->>'PERFORMANCE_BONUS')::numeric, 0.00) AS performance_bonus,
        COALESCE((pe.earnings_details->>'TRAFFIC_ALLOWANCE')::numeric, 0.00) AS traffic_allowance,
        COALESCE((pe.earnings_details->>'MONTHLY_PERFORMANCE_BONUS')::numeric, 0.00) AS monthly_performance_bonus,
        -- 扣除组件
        COALESCE((pe.deductions_details->>'PERSONAL_INCOME_TAX')::numeric, 0.00) AS personal_income_tax,
        COALESCE((pe.deductions_details->>'PENSION_PERSONAL_AMOUNT')::numeric, 0.00) AS pension_personal_amount,
        COALESCE((pe.deductions_details->>'MEDICAL_INS_PERSONAL_AMOUNT')::numeric, 0.00) AS medical_ins_personal_amount,
        COALESCE((pe.deductions_details->>'HOUSING_FUND_PERSONAL')::numeric, 0.00) AS housing_fund_personal
    FROM payroll.payroll_entries pe
    WHERE 1=1
        -- 在CTE中添加过滤条件可以减少后续JOIN的数据量
        -- AND pe.payroll_period_id = $1
)
SELECT 
    pwc.id AS "薪资条目id",
    pwc.employee_id AS "员工id",
    pwc.payroll_period_id AS "薪资期间id",
    pwc.payroll_run_id AS "薪资运行id",
    e.employee_code AS "员工编号",
    e.first_name AS "名",
    e.last_name AS "姓",
    COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') AS "姓名",
    e.id_number AS "身份证号",
    COALESCE(d.name, '未分配部门') AS "部门名称",
    COALESCE(pos.name, '未分配职位') AS "职位名称",
    COALESCE(pc.name, '未分类') AS "人员类别",
    COALESCE(ph.root_name, '未分类') AS "根人员类别",
    COALESCE(pp.name, '未知期间') AS "薪资期间名称",
    pp.start_date AS "薪资期间开始日期",
    pp.end_date AS "薪资期间结束日期",
    pp.pay_date AS "薪资发放日期",
    pr.run_date AS "薪资运行日期",
    COALESCE(pwc.gross_pay, 0.00) AS "应发合计",
    COALESCE(pwc.total_deductions, 0.00) AS "扣除合计",
    COALESCE(pwc.net_pay, 0.00) AS "实发合计",
    pwc.basic_salary AS "基本工资",
    pwc.performance_bonus AS "奖励性绩效工资",
    pwc.traffic_allowance AS "公务交通补贴",
    pwc.monthly_performance_bonus AS "月奖励绩效",
    pwc.personal_income_tax AS "个人所得税",
    pwc.pension_personal_amount AS "养老保险个人应缴金额",
    pwc.medical_ins_personal_amount AS "医疗保险个人缴纳金额",
    pwc.housing_fund_personal AS "个人缴住房公积金",
    pwc.audit_status AS "审计状态",
    pwc.audit_timestamp AS "审计时间",
    pwc.version AS "版本号",
    pwc.updated_at AS "更新时间"
FROM payroll_with_components pwc
LEFT JOIN hr.employees e ON pwc.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
LEFT JOIN personnel_hierarchy ph ON pc.id = ph.category_id
LEFT JOIN payroll.payroll_periods pp ON pwc.payroll_period_id = pp.id
LEFT JOIN payroll.payroll_runs pr ON pwc.payroll_run_id = pr.id
WHERE 1=1
    -- 在主查询中添加过滤条件
    -- AND e.is_active = true
    -- AND d.name = $2
ORDER BY pwc.payroll_period_id DESC, e.employee_code
LIMIT 1000;

-- 优化版本3: 分页查询模板
WITH filtered_entries AS (
    SELECT pe.id
    FROM payroll.payroll_entries pe
    LEFT JOIN hr.employees e ON pe.employee_id = e.id
    WHERE 1=1
        -- 添加具体的过滤条件
        -- AND pe.payroll_period_id = $1
        -- AND e.department_id = $2
        -- AND e.is_active = true
    ORDER BY pe.payroll_period_id DESC, pe.id
    LIMIT 100 OFFSET 0  -- 分页参数
)
SELECT 
    pe.id AS "薪资条目id",
    e.employee_code AS "员工编号",
    COALESCE(e.last_name || e.first_name, e.first_name, '未知') AS "姓名",
    COALESCE(d.name, '未分配部门') AS "部门名称",
    COALESCE(pe.gross_pay, 0.00) AS "应发合计",
    COALESCE(pe.net_pay, 0.00) AS "实发合计",
    -- 只选择需要的字段
    COALESCE((pe.earnings_details->>'BASIC_SALARY')::numeric, 0.00) AS "基本工资"
FROM filtered_entries fe
JOIN payroll.payroll_entries pe ON fe.id = pe.id
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
ORDER BY pe.payroll_period_id DESC, pe.id; 