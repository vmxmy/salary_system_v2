# 薪资系统视图层设计

## 设计目标
1. 简化API调用逻辑，减少复杂JOIN操作
2. 统一数据格式，避免前端重复处理lookup映射
3. 提供业务友好的数据结构
4. 提高查询性能和开发效率

## 核心业务视图

### 1. 员工综合信息视图 (v_employees_detail)
```sql
CREATE VIEW v_employees_detail AS
SELECT 
  e.id,
  e.employee_number,
  e.first_name,
  e.last_name,
  e.first_name || ' ' || e.last_name AS full_name,
  e.email,
  e.phone,
  e.hire_date,
  
  -- 部门信息
  d.name as department_name,
  d.code as department_code,
  
  -- 职位信息
  p.title as position_title,
  p.level as position_level,
  
  -- 人员类别
  pc.name as personnel_category_name,
  
  -- 状态信息 (lookup映射)
  emp_status.name as employee_status,
  gender.name as gender,
  education.name as education_level,
  
  -- 薪资相关
  esc.base_salary,
  esc.effective_date as salary_effective_date
  
FROM hr.employees e
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions p ON e.actual_position_id = p.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
LEFT JOIN config.lookup_values emp_status ON e.status_lookup_value_id = emp_status.id
LEFT JOIN config.lookup_values gender ON e.gender_lookup_value_id = gender.id
LEFT JOIN config.lookup_values education ON e.education_lookup_value_id = education.id
LEFT JOIN payroll.employee_salary_configs esc ON e.id = esc.employee_id 
  AND esc.effective_date = (
    SELECT MAX(effective_date) 
    FROM payroll.employee_salary_configs esc2 
    WHERE esc2.employee_id = e.id
  );
```

### 2. 薪资周期详情视图 (v_payroll_periods_detail)
```sql
CREATE VIEW v_payroll_periods_detail AS
SELECT 
  pp.id,
  pp.name,
  pp.start_date,
  pp.end_date,
  pp.pay_date,
  
  -- 状态信息
  status.name as status_name,
  status.code as status_code,
  
  -- 频率信息
  freq.name as frequency_name,
  
  -- 统计信息
  (SELECT COUNT(*) FROM payroll.payroll_runs pr WHERE pr.payroll_period_id = pp.id) as runs_count,
  (SELECT COUNT(*) FROM payroll.payroll_entries pe 
   JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id 
   WHERE pr.payroll_period_id = pp.id) as entries_count
   
FROM payroll.payroll_periods pp
LEFT JOIN config.lookup_values status ON pp.status_lookup_value_id = status.id
LEFT JOIN config.lookup_values freq ON pp.frequency_lookup_value_id = freq.id;
```

### 3. 薪资运行详情视图 (v_payroll_runs_detail)
```sql
CREATE VIEW v_payroll_runs_detail AS
SELECT 
  pr.id,
  pr.run_date,
  pr.notes,
  
  -- 周期信息
  pp.name as period_name,
  pp.start_date as period_start,
  pp.end_date as period_end,
  
  -- 状态信息
  status.name as status_name,
  status.code as status_code,
  
  -- 创建人信息
  u.username as initiated_by_username,
  u.first_name || ' ' || u.last_name as initiated_by_name,
  
  -- 统计信息
  (SELECT COUNT(*) FROM payroll.payroll_entries pe WHERE pe.payroll_run_id = pr.id) as entries_count,
  (SELECT COUNT(*) FROM payroll.payroll_entries pe WHERE pe.payroll_run_id = pr.id AND pe.status_lookup_value_id = 65) as approved_entries_count
  
FROM payroll.payroll_runs pr
LEFT JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
LEFT JOIN config.lookup_values status ON pr.status_lookup_value_id = status.id
LEFT JOIN security.users u ON pr.initiated_by_user_id = u.id;
```

### 4. 薪资条目汇总视图 (v_payroll_entries_summary)
```sql
CREATE VIEW v_payroll_entries_summary AS
SELECT 
  pe.id,
  pe.payroll_run_id,
  
  -- 员工信息
  e.employee_number,
  e.first_name || ' ' || e.last_name as employee_name,
  d.name as department_name,
  p.title as position_title,
  
  -- 薪资汇总
  pe.gross_pay,
  pe.net_pay,
  pe.total_deductions,
  
  -- 状态信息
  status.name as status_name,
  status.code as status_code,
  
  -- 详细薪资组件（展开JSONB）
  pe.earnings_details,
  pe.deductions_details
  
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions p ON e.actual_position_id = p.id
LEFT JOIN config.lookup_values status ON pe.status_lookup_value_id = status.id;
```

### 5. 薪资组件配置视图 (v_payroll_components_detail)
```sql
CREATE VIEW v_payroll_components_detail AS
SELECT 
  pcd.id,
  pcd.component_name,
  pcd.component_code,
  pcd.description,
  pcd.calculation_formula,
  pcd.is_active,
  
  -- 类型信息
  type.name as component_type_name,
  type.code as component_type_code,
  
  -- 统计信息
  (SELECT COUNT(*) FROM hr.employee_payroll_components epc WHERE epc.component_definition_id = pcd.id) as employees_count
  
FROM config.payroll_component_definitions pcd
LEFT JOIN config.lookup_values type ON pcd.component_type_lookup_value_id = type.id;
```

## API简化效果示例

### 原有API调用（需要多次请求）
```javascript
// 需要3-4次API调用
const periods = await api.get('/payroll-periods');
const periodStatuses = await api.get('/lookup-values?type=PAYROLL_PERIOD_STATUS');
const frequencies = await api.get('/lookup-values?type=FREQUENCY');
// 前端需要手动映射和组合数据
```

### 使用视图后的API调用（单次请求）
```javascript
// 只需1次API调用，数据已经格式化
const periodsDetail = await api.get('/payroll-periods-detail');
// 直接使用 period.status_name, period.frequency_name
```

## 实施建议

### 阶段1：核心视图创建
1. 创建上述5个核心业务视图
2. 更新相应的API endpoints
3. 逐步迁移前端调用

### 阶段2：性能优化
1. 为视图创建必要的索引
2. 考虑物化视图（对于复杂计算）
3. 监控查询性能

### 阶段3：扩展视图
1. 报表专用视图
2. 统计分析视图
3. 审计追踪视图

## 注意事项
1. 视图不能直接DML操作，需要通过基础表
2. 复杂视图可能影响性能，需要适当优化
3. 维护视图与基础表schema的同步 