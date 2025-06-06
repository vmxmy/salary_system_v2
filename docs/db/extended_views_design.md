# 薪资系统扩展视图设计方案

## 📊 概述

基于已有的7个核心视图，本文档设计了三个优先级层次的扩展视图，以满足更深层次的业务分析需求。

---

## 🎯 优先级1：历史分析视图

### 📈 `v_employee_salary_history` - 员工薪资历史趋势视图

**业务目标：**
- 跟踪员工薪资变化趋势
- 支持薪资调整分析和决策
- 提供员工薪资成长轨迹

**主要字段：**
```sql
employee_id, employee_code, employee_name
department_name, position_name
period_name, period_start_date, period_end_date
gross_pay, net_pay, total_deductions
basic_salary, performance_salary, allowance_total
-- 计算字段
previous_gross_pay, gross_pay_change, gross_pay_change_pct
ytd_gross_pay, ytd_average_gross_pay
salary_rank_in_department, salary_rank_in_position
```

**API端点：** `/views/employee-salary-history`

### 🏢 `v_department_cost_analysis` - 部门成本分析视图

**业务目标：**
- 部门人力成本统计和对比
- 支持预算制定和成本控制
- 提供部门效率分析数据

**主要字段：**
```sql
department_id, department_name, department_code
period_name, period_start_date
employee_count, active_employee_count
total_gross_pay, total_net_pay, total_deductions
avg_gross_pay, median_gross_pay
total_basic_salary, total_performance_salary
total_allowance, total_social_insurance
-- 对比字段
previous_period_total_cost, cost_change_pct
budget_amount, budget_variance_pct
cost_per_employee, efficiency_ratio
```

**API端点：** `/views/department-cost-analysis`

### 📊 `v_payroll_period_comparison` - 薪资周期对比分析视图

**业务目标：**
- 不同薪资周期的横向对比
- 识别薪资发放趋势和异常
- 支持管理层决策分析

**主要字段：**
```sql
period_id, period_name, period_start_date, period_end_date
total_employees, total_gross_pay, total_net_pay
avg_gross_pay, median_gross_pay
total_basic_salary, total_performance_salary
total_income_tax, total_social_insurance
-- 对比计算字段
previous_period_employees, employee_change
previous_period_gross_pay, gross_pay_change_pct
yoy_gross_pay, yoy_change_pct
seasonal_index, trend_indicator
```

**API端点：** `/views/payroll-period-comparison`

---

## 🎯 优先级2：业务专用视图

### 💰 `v_tax_calculation_detail` - 个税计算明细视图

**业务目标：**
- 详细的个税计算过程展示
- 支持税务合规和审计
- 提供个税优化建议数据

**主要字段：**
```sql
employee_id, employee_code, employee_name
period_name, taxable_income, tax_free_allowance
tax_brackets_detail, calculated_tax, actual_tax
tax_deductions_detail, special_deductions
cumulative_taxable_income, cumulative_tax
tax_rate_applied, effective_tax_rate
```

### 🛡️ `v_social_security_summary` - 社保汇总统计视图

**业务目标：**
- 社保缴费统计和分析
- 支持社保合规管理
- 提供社保成本控制数据

**主要字段：**
```sql
period_name, department_name
total_pension_personal, total_pension_employer
total_medical_personal, total_medical_employer
total_unemployment_personal, total_unemployment_employer
total_housing_fund_personal, total_housing_fund_employer
total_annuity_personal, total_annuity_employer
social_security_base_total, compliance_rate
```

### 📋 `v_payroll_audit_trail` - 薪资审计跟踪视图

**业务目标：**
- 薪资处理过程的完整审计轨迹
- 支持内控和合规要求
- 提供变更历史和责任追踪

**主要字段：**
```sql
payroll_run_id, employee_id, operation_type
operation_timestamp, operator_id, operator_name
before_values, after_values, change_reason
approval_status, approver_id, approver_name
audit_notes, compliance_flags
```

---

## 🎯 优先级3：管理决策视图

### 💼 `v_salary_budget_analysis` - 薪资预算分析视图

**业务目标：**
- 薪资预算执行情况分析
- 支持预算调整和规划
- 提供成本控制决策数据

### 🏆 `v_employee_cost_ranking` - 员工成本排名视图

**业务目标：**
- 员工成本排名和分析
- 支持人才价值评估
- 提供薪酬调整参考

### ⚡ `v_payroll_efficiency_metrics` - 薪资处理效率指标视图

**业务目标：**
- 薪资处理流程效率分析
- 支持流程优化和改进
- 提供运营效率指标

---

## 🔧 实施计划

### 第一步：创建优先级1视图（本周）
1. 创建Alembic迁移文件
2. 实现三个历史分析视图
3. 添加相应的API端点
4. 创建前端集成示例

### 第二步：性能测试和优化（下周）
1. 对新视图进行性能测试
2. 优化查询和索引
3. 集成到现有监控系统

### 第三步：业务专用视图（后续）
1. 根据用户反馈调整优先级
2. 逐步实现优先级2和3的视图
3. 完善文档和使用指南

---

## 💡 技术考虑

### 性能优化
- 使用物化视图处理大数据量历史分析
- 合理设置刷新策略和索引
- 考虑分区表支持

### 数据一致性
- 确保历史数据的准确性和完整性
- 处理数据变更对历史视图的影响
- 建立数据质量监控机制

### 扩展性设计
- 预留字段支持未来业务需求
- 模块化设计便于维护和扩展
- 统一的命名规范和文档标准

---

*设计文档版本：v1.0 - 2025年1月* 