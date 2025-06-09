-- 创建薪资数据物化视图
-- 用于缓存复杂的JSONB解析和人员层级计算

-- 1. 首先创建人员层级物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS hr.mv_personnel_hierarchy AS
WITH RECURSIVE category_tree AS (
    SELECT 
        id,
        name,
        parent_category_id,
        id AS root_id,
        name AS root_name,
        0 AS level,
        ARRAY[id] AS path
    FROM hr.personnel_categories
    WHERE parent_category_id IS NULL
    
    UNION ALL
    
    SELECT 
        pc.id,
        pc.name,
        pc.parent_category_id,
        ct.root_id,
        ct.root_name,
        ct.level + 1,
        ct.path || pc.id
    FROM hr.personnel_categories pc
    JOIN category_tree ct ON pc.parent_category_id = ct.id
    WHERE NOT pc.id = ANY(ct.path) -- 防止循环引用
)
SELECT 
    id AS category_id,
    root_id,
    root_name,
    level,
    path
FROM category_tree;

-- 创建物化视图索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_personnel_hierarchy_category 
ON hr.mv_personnel_hierarchy(category_id);

CREATE INDEX IF NOT EXISTS idx_mv_personnel_hierarchy_root 
ON hr.mv_personnel_hierarchy(root_id);

-- 2. 创建薪资组件解析物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS payroll.mv_payroll_components_parsed AS
SELECT 
    pe.id,
    pe.employee_id,
    pe.payroll_period_id,
    pe.payroll_run_id,
    pe.gross_pay,
    pe.total_deductions,
    pe.net_pay,
    
    -- 应发项目（只解析常用的）
    COALESCE((pe.earnings_details->>'BASIC_SALARY')::numeric, 0.00) AS basic_salary,
    COALESCE((pe.earnings_details->>'PERFORMANCE_BONUS')::numeric, 0.00) AS performance_bonus,
    COALESCE((pe.earnings_details->>'TRAFFIC_ALLOWANCE')::numeric, 0.00) AS traffic_allowance,
    COALESCE((pe.earnings_details->>'MONTHLY_PERFORMANCE_BONUS')::numeric, 0.00) AS monthly_performance_bonus,
    
    -- 扣除项目（只解析常用的）
    COALESCE((pe.deductions_details->>'PERSONAL_INCOME_TAX')::numeric, 0.00) AS personal_income_tax,
    COALESCE((pe.deductions_details->>'PENSION_PERSONAL_AMOUNT')::numeric, 0.00) AS pension_personal_amount,
    COALESCE((pe.deductions_details->>'MEDICAL_INS_PERSONAL_AMOUNT')::numeric, 0.00) AS medical_ins_personal_amount,
    COALESCE((pe.deductions_details->>'HOUSING_FUND_PERSONAL')::numeric, 0.00) AS housing_fund_personal,
    
    -- 保留原始JSONB用于详细查询
    pe.earnings_details,
    pe.deductions_details,
    pe.calculation_inputs,
    
    pe.updated_at
FROM payroll.payroll_entries pe;

-- 创建物化视图索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_payroll_components_id 
ON payroll.mv_payroll_components_parsed(id);

CREATE INDEX IF NOT EXISTS idx_mv_payroll_components_employee 
ON payroll.mv_payroll_components_parsed(employee_id);

CREATE INDEX IF NOT EXISTS idx_mv_payroll_components_period 
ON payroll.mv_payroll_components_parsed(payroll_period_id);

-- 3. 创建主查询物化视图（简化版）
CREATE MATERIALIZED VIEW IF NOT EXISTS payroll.mv_payroll_report_summary AS
SELECT 
    pe.id AS payroll_entry_id,
    pe.employee_id,
    pe.payroll_period_id,
    pe.payroll_run_id,
    
    -- 员工基本信息
    e.employee_code,
    e.first_name,
    e.last_name,
    COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') AS full_name,
    e.id_number,
    e.phone_number,
    e.email,
    e.hire_date,
    COALESCE(e.is_active, false) AS is_active,
    
    -- 组织信息
    COALESCE(d.name, '未分配部门') AS department_name,
    COALESCE(pos.name, '未分配职位') AS position_name,
    COALESCE(pc.name, '未分类') AS category_name,
    COALESCE(ph.root_name, '未分类') AS root_category_name,
    
    -- 薪资期间信息
    COALESCE(pp.name, '未知期间') AS period_name,
    pp.start_date AS period_start_date,
    pp.end_date AS period_end_date,
    pp.pay_date AS period_pay_date,
    pr.run_date AS payroll_run_date,
    
    -- 薪资汇总
    COALESCE(pe.gross_pay, 0.00) AS gross_pay,
    COALESCE(pe.total_deductions, 0.00) AS total_deductions,
    COALESCE(pe.net_pay, 0.00) AS net_pay,
    
    -- 常用薪资组件
    pcp.basic_salary,
    pcp.performance_bonus,
    pcp.traffic_allowance,
    pcp.monthly_performance_bonus,
    pcp.personal_income_tax,
    pcp.pension_personal_amount,
    pcp.medical_ins_personal_amount,
    pcp.housing_fund_personal,
    
    -- 审计信息
    pe.audit_status,
    pe.audit_timestamp,
    pe.version,
    pe.updated_at
    
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
LEFT JOIN hr.mv_personnel_hierarchy ph ON pc.id = ph.category_id
LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
LEFT JOIN payroll.mv_payroll_components_parsed pcp ON pe.id = pcp.id;

-- 创建主视图索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_payroll_report_summary_id 
ON payroll.mv_payroll_report_summary(payroll_entry_id);

CREATE INDEX IF NOT EXISTS idx_mv_payroll_report_summary_employee 
ON payroll.mv_payroll_report_summary(employee_id);

CREATE INDEX IF NOT EXISTS idx_mv_payroll_report_summary_period 
ON payroll.mv_payroll_report_summary(payroll_period_id);

CREATE INDEX IF NOT EXISTS idx_mv_payroll_report_summary_dept 
ON payroll.mv_payroll_report_summary(department_name);

-- 刷新物化视图的函数
CREATE OR REPLACE FUNCTION refresh_payroll_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hr.mv_personnel_hierarchy;
    REFRESH MATERIALIZED VIEW CONCURRENTLY payroll.mv_payroll_components_parsed;
    REFRESH MATERIALIZED VIEW CONCURRENTLY payroll.mv_payroll_report_summary;
END;
$$ LANGUAGE plpgsql; 