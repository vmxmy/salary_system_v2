# 薪资系统核心基础视图总览

## 📊 概述

本文档详细描述了薪资系统中的核心基础视图架构，这些视图为前端提供了高性能、结构化的数据接口，简化了API调用逻辑并提高了开发效率。

## 🏗️ 视图架构分层

薪资系统采用三层视图架构设计：

1. **基础信息视图层 (Basic Views)** - 提供基础数据和简单关联
2. **业务详情视图层 (Detail Views)** - 提供业务逻辑相关的详细信息
3. **高级分析视图层 (Analytical Views)** - 提供复杂分析和统计数据

---

## 1️⃣ 基础信息视图层 (Basic Views)

### 📁 `v_employees_basic` - 员工基础信息视图

**功能描述：**
- 员工基本信息与部门、职位、人员类别的关联
- 状态字典映射 (lookup_values)
- 用于员工列表、选择器等基础功能

**主要字段：**
```sql
id, employee_code, first_name, last_name, full_name
phone_number, email, hire_date
department_id, department_name
actual_position_id, position_name
personnel_category_id, personnel_category_name
employee_status
```

**API端点：** `/views/employees`

### 📁 `v_payroll_components_basic` - 薪资组件基础视图

**功能描述：**
- 薪资组件定义与使用统计
- 计算方法、参数配置信息
- 用于组件管理、配置界面

**主要字段：**
```sql
id, code, name, type
calculation_method, calculation_parameters
is_taxable, is_social_security_base, is_housing_fund_base
display_order, is_active, effective_date, end_date
employees_count
```

**API端点：** `/views/payroll-components`

### 📁 `v_payroll_entries_basic` - 薪资条目基础视图

**功能描述：**
- 薪资条目与员工、部门基础信息关联
- 包含原始JSONB字段
- 用于简单列表展示

**主要字段：**
```sql
id, employee_id, employee_code, employee_name
department_id, department_name, position_name
period_id, period_name
gross_pay, net_pay, total_deductions
earnings_details, deductions_details (JSONB)
created_at, updated_at
```

---

## 2️⃣ 业务详情视图层 (Detail Views)

### 📁 `v_payroll_periods_detail` - 薪资周期详情视图

**功能描述：**
- 周期信息与状态、频率字典映射
- 关联的运行次数、条目统计
- 用于周期管理、仪表板

**主要字段：**
```sql
id, name, start_date, end_date, pay_date
status_name, status_code
frequency_name, frequency_code
runs_count, entries_count
```

**API端点：** `/views/payroll-periods`

### 📁 `v_payroll_runs_detail` - 薪资运行详情视图

**功能描述：**
- 运行信息与周期关联及创建人信息
- 条目统计、金额汇总
- 用于运行管理、审批流程

**主要字段：**
```sql
id, payroll_period_id, run_date
period_name, period_start, period_end
status_name, status_code
initiated_by_username, initiated_by_name
entries_count, approved_entries_count
total_gross_pay, total_net_pay
```

**API端点：** `/views/payroll-runs`

---

## 3️⃣ 高级分析视图层 (Analytical Views)

### 📁 `v_payroll_entries_detailed` - 薪资条目详细视图 ⭐

**功能描述：**
- **JSONB字段完全展开** (收入/扣除明细)
- 包含所有计算衍生字段
- 员工、部门、职位、人员类别完整关联
- 用于详细报表、数据分析

**核心特性：**
- 动态薪资组件字段自动展开为结构化列
- 提供计算衍生字段（如各类合计）
- 保留原始JSONB数据用于参考

**基础字段：**
```sql
id, employee_id, employee_code, employee_name
department_id, department_name, position_name
actual_position_id, personnel_category_name
period_id, period_name
gross_pay, net_pay, total_deductions
calculated_at, updated_at
```

**API端点：** `/views/payroll-entries`

### 📁 `v_payroll_summary_analysis` - 薪资汇总分析视图

**功能描述：**
- 按部门/周期的统计汇总
- 主要收入/扣除项目分类汇总
- 用于管理仪表板、分析报告

**主要字段：**
```sql
period_id, period_name, department_id, department_name
employee_count, unique_employee_count
total_gross_pay, total_net_pay, total_deductions
avg_gross_pay, avg_net_pay, avg_deductions
total_basic_salary, total_performance_salary
total_allowance, total_subsidy
total_income_tax, total_pension_deduction
total_medical_deduction, total_housing_fund_deduction
first_entry_date, last_updated_date
```

**API端点：** `/views/analysis/payroll-summary`

### 📁 `v_payroll_component_usage` - 薪资组件使用统计视图

**功能描述：**
- 组件使用频次、金额统计
- 平均值、总计等分析数据
- 用于组件效果分析

**主要字段：**
```sql
id, code, name, component_type, is_active
earnings_usage_count, deductions_usage_count
total_amount, average_amount
display_order, effective_date, end_date
```

**API端点：** `/views/payroll-components-usage`

---

## 🔧 JSONB字段展开能力

### 收入明细展开字段

`v_payroll_entries_detailed` 视图将 `earnings_details` JSONB字段展开为以下结构化列：

```sql
basic_salary              -- 基本工资
performance_salary        -- 绩效工资  
position_salary          -- 岗位工资
grade_salary             -- 级别工资
allowance                -- 综合津补贴
subsidy                  -- 补贴
basic_performance_salary -- 基础绩效
performance_wage         -- 绩效工资
traffic_allowance        -- 交通补贴
only_child_bonus         -- 独生子女父母奖励费
township_allowance       -- 乡镇工作补贴
position_allowance       -- 岗位津贴
civil_servant_allowance  -- 公务员规范津补贴
back_pay                 -- 补发工资
```

### 扣除明细展开字段

`v_payroll_entries_detailed` 视图将 `deductions_details` JSONB字段展开为以下结构化列：

```sql
personal_income_tax      -- 个人所得税
pension_personal         -- 养老保险个人
medical_personal         -- 医疗保险个人
unemployment_personal    -- 失业保险个人
housing_fund_personal    -- 住房公积金个人
annuity_personal         -- 职业年金个人
adjustment_deduction     -- 调整扣款
social_security_adjustment -- 社保调整
```

### 计算衍生字段

视图还提供以下计算衍生字段：

```sql
basic_wage_total         -- 基本工资合计 (基本+岗位+级别)
performance_total        -- 绩效合计 (绩效+基础绩效+绩效工资)
allowance_total          -- 津补贴合计 (综合津补贴+补贴+交通+岗位津贴)
social_insurance_total   -- 社保合计 (养老+医疗+失业+公积金+年金)
```

### 原始数据保留字段

视图保留原始JSONB数据用于参考：

```sql
raw_earnings_details     -- 原始收入明细JSONB
raw_deductions_details   -- 原始扣除明细JSONB
calculated_at           -- 计算时间
```

---

## 🚀 API端点映射表

| 视图名称 | API端点 | 主要用途 | 数据特点 |
|---------|---------|----------|----------|
| `v_payroll_periods_detail` | `/views/payroll-periods` | 周期管理 | 包含统计信息 |
| `v_payroll_runs_detail` | `/views/payroll-runs` | 运行管理 | 包含金额汇总 |
| `v_employees_basic` | `/views/employees` | 员工信息 | 基础关联信息 |
| `v_payroll_components_basic` | `/views/payroll-components` | 组件管理 | 配置和统计 |
| `v_payroll_entries_detailed` | `/views/payroll-entries` | 详细条目 | **JSONB完全展开** |
| `v_payroll_component_usage` | `/views/payroll-components-usage` | 使用统计 | 分析数据 |
| `v_payroll_summary_analysis` | `/views/analysis/payroll-summary` | 汇总分析 | 部门级统计 |

---

## 💡 核心优势

### 1. **性能优化**
- ✅ 减少复杂JOIN操作，单次查询获取完整数据
- ✅ 预计算统计字段，避免实时聚合计算
- ✅ 优化的索引策略支持

### 2. **数据一致性**
- ✅ 统一的字典映射和格式化逻辑
- ✅ 标准化的数据结构和命名规范
- ✅ 集中的业务规则处理

### 3. **开发效率**
- ✅ 前端无需复杂的数据组装逻辑
- ✅ 减少API调用次数和数据传输量
- ✅ 类型安全的数据结构定义

### 4. **JSONB展开能力**
- ✅ 动态薪资组件字段自动展开为结构化列
- ✅ 支持复杂的薪资计算逻辑
- ✅ 保持数据灵活性的同时提供结构化访问

### 5. **业务友好**
- ✅ 直接提供业务所需的数据结构
- ✅ 支持多维度的数据分析和报表
- ✅ 易于理解和维护的视图设计

---

## 📋 使用建议

### 前端开发
- 优先使用视图API而非直接表API
- 利用展开的JSONB字段进行数据展示
- 使用统计字段进行仪表板开发

### 性能考虑
- 大数据量查询时注意使用分页参数
- 合理使用过滤条件减少数据传输
- 监控视图查询性能并优化索引

### 扩展开发
- 新增薪资组件时确保视图展开逻辑同步更新
- 遵循现有命名规范添加新字段
- 考虑向后兼容性进行视图结构调整

---

*最后更新：2025年1月* 