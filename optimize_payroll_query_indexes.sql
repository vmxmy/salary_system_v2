-- 薪资查询优化索引
-- 执行前请先检查是否已存在这些索引

-- 1. 主要JOIN字段索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_entries_employee_id 
ON payroll.payroll_entries(employee_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_entries_period_id 
ON payroll.payroll_entries(payroll_period_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_entries_run_id 
ON payroll.payroll_entries(payroll_run_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department_id 
ON hr.employees(department_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_position_id 
ON hr.employees(actual_position_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_category_id 
ON hr.employees(personnel_category_id);

-- 2. 人员类别层级查询优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personnel_categories_parent 
ON hr.personnel_categories(parent_category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personnel_categories_tree 
ON hr.personnel_categories(parent_category_id, id);

-- 3. JSONB字段GIN索引（用于频繁访问的JSONB键）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_entries_earnings_gin 
ON payroll.payroll_entries USING GIN (earnings_details);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_entries_deductions_gin 
ON payroll.payroll_entries USING GIN (deductions_details);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_entries_calculation_gin 
ON payroll.payroll_entries USING GIN (calculation_inputs);

-- 4. 复合索引用于常见查询模式
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_entries_period_employee 
ON payroll.payroll_entries(payroll_period_id, employee_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active_dept 
ON hr.employees(is_active, department_id) WHERE is_active = true; 