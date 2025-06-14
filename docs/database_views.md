# 数据库结构与视图说明文档

本文档描述了系统的数据库结构、主要表及视图的功能和用途。

## 数据库模式与表结构

系统数据库采用 PostgreSQL 实现，分为以下几个主要模式（schema）：

1. `hr`: 人力资源相关表
2. `payroll`: 薪资计算相关表
3. `config`: 系统配置相关表
4. `security`: 安全与权限相关表
5. `public`: 公共表

### HR模式主要表

#### employees 表（员工信息）

存储员工的基本信息，是系统的核心表之一。

**主要字段**:
- `id`: 主键
- `employee_code`: 员工编号
- `first_name`: 名
- `last_name`: 姓
- `date_of_birth`: 出生日期
- `gender_lookup_value_id`: 性别（引用lookup_values表）
- `id_number`: 身份证号
- `nationality`: 国籍
- `hire_date`: 入职日期
- `status_lookup_value_id`: 状态（引用lookup_values表）
- `email`: 电子邮箱
- `phone_number`: 电话号码
- `employment_type_lookup_value_id`: 雇佣类型（引用lookup_values表）
- `education_level_lookup_value_id`: 教育水平（引用lookup_values表）
- `marital_status_lookup_value_id`: 婚姻状况（引用lookup_values表）
- `political_status_lookup_value_id`: 政治面貌（引用lookup_values表）
- `contract_type_lookup_value_id`: 合同类型（引用lookup_values表）
- `home_address`: 家庭住址
- `emergency_contact_name`: 紧急联系人姓名
- `emergency_contact_phone`: 紧急联系人电话
- `department_id`: 部门ID（引用departments表）
- `job_title_id`: 职务ID
- `ethnicity`: 民族
- `first_work_date`: 首次工作日期
- `personnel_category_id`: 人员类别（引用personnel_categories表）
- `actual_position_id`: 实际职位（引用positions表）

#### departments 表（部门信息）

存储组织架构中的部门信息。

**主要字段**:
- `id`: 主键
- `code`: 部门编码
- `name`: 部门名称
- `parent_department_id`: 上级部门ID，自引用关系
- `effective_date`: 生效日期
- `end_date`: 结束日期
- `is_active`: 是否活跃

#### positions 表（职位信息）

存储职位相关信息。

**主要字段**:
- `id`: 主键
- `code`: 职位编码
- `name`: 职位名称
- `description`: 职位描述
- `parent_position_id`: 上级职位ID，自引用关系
- `effective_date`: 生效日期
- `end_date`: 结束日期
- `is_active`: 是否活跃

#### personnel_categories 表（人员类别）

存储人员分类信息。

#### employee_contracts 表（员工合同）

存储员工合同相关信息。

#### employee_bank_accounts 表（员工银行账户）

存储员工银行账户信息，用于工资发放。

#### employee_compensation_history 表（员工薪酬历史）

记录员工薪酬变更历史。

#### employee_payroll_components 表（员工薪资字段）

存储分配给员工的薪资字段信息。

### Payroll模式主要表

#### payroll_runs 表（薪资审核）

记录薪资计算批次信息。

**主要字段**:
- `id`: 主键
- `payroll_period_id`: 薪酬周期ID
- `run_date`: 运行日期
- `status_lookup_value_id`: 状态（引用lookup_values表）
- `initiated_by_user_id`: 发起用户ID
- `total_employees`: 总员工数
- `total_net_pay`: 总净发金额

#### payroll_entries 表（薪资条目）

存储每个员工每个薪酬周期的详细薪资计算数据。

**主要字段**:
- `id`: 主键
- `employee_id`: 员工ID
- `payroll_period_id`: 薪酬周期ID
- `payroll_run_id`: 薪资审核ID
- `gross_pay`: 总收入
- `total_deductions`: 总扣除
- `net_pay`: 净发工资
- `earnings_details`: 收入细节（JSONB类型）
- `deductions_details`: 扣除细节（JSONB类型）
- `calculation_inputs`: 计算输入数据（JSONB类型）
- `calculation_log`: 计算日志（JSONB类型）
- `status_lookup_value_id`: 状态（引用lookup_values表）
- `remarks`: 备注
- `calculated_at`: 计算时间
- `updated_at`: 更新时间

#### payroll_periods 表（薪酬周期）

定义薪资计算和发放的周期。

### Config模式主要表

#### lookup_types 表（查找类型）

系统中使用的各种枚举类型的定义。

#### lookup_values 表（查找值）

系统中使用的各种枚举值，关联到lookup_types表。

#### payroll_component_definitions 表（薪资字段定义）

定义系统中使用的各种薪资字段（如基本工资、津贴、奖金等）。

#### social_security_rates 表（社保费率）

存储社会保险费率的配置。

#### tax_brackets 表（税率表）

存储个人所得税计算的税率表。

#### system_parameters 表（系统参数）

存储系统运行所需的各种参数设置。

### Security模式主要表

#### users 表（用户）

存储系统用户信息。

#### roles 表（角色）

定义系统中的角色。

#### permissions 表（权限）

定义系统中的权限项。

#### role_permissions 表（角色权限）

角色与权限的多对多关系映射表。

#### user_roles 表（用户角色）

用户与角色的多对多关系映射表。

## 数据库关系图

主要表之间的关系如下：

```
employees (hr.employees)
 ↓ department_id
departments (hr.departments)

employees (hr.employees)
 ↓ actual_position_id
positions (hr.positions)

payroll_entries (payroll.payroll_entries)
 ↓ employee_id
employees (hr.employees)

payroll_entries (payroll.payroll_entries)
 ↓ payroll_run_id
payroll_runs (payroll.payroll_runs)

payroll_runs (payroll.payroll_runs)
 ↓ payroll_period_id
payroll_periods (payroll.payroll_periods)
```

## 数据库视图

以下是系统中定义的主要数据库视图：

## 正编人员工资信息表

### 描述

`正编人员工资信息表` 视图包含正编人员（公务员、参公和事业编制）的薪资信息。正编人员通过 `sal_employee_type_key` 字段识别，包括公务员(gwy)、参公(cg)和事业编制(sy)。

### 主要字段

#### 基本信息
- `薪酬周期`: 薪资发放的周期标识，通常为年月格式（如 "2023-12"）
- `姓名`: 员工姓名
- `编制`: 员工编制类型，通过关联 `establishment_types` 表获取
- `人员身份`: 员工的人员身份
- `职务级别`: 员工的职务级别
- `是否领导`: 是否为领导职务

#### 薪资信息
- `职务/岗位工资`: 基于职务或岗位的基本工资
- `级别/薪级工资`: 基于级别或薪级的工资
- `试用期工资`: 试用期期间的工资
- `93年工改保留补贴`: 1993年工资改革后保留的补贴
- `独生子女父母奖励金`: 独生子女父母的奖励金
- `岗位职务津贴`: 特定岗位或职务的津贴
- `信访工作人员岗位津贴`: 信访工作人员的特殊岗位津贴
- `基础绩效奖`: 基础绩效奖金
- `公务员规范性津贴补贴`: 公务员的规范性津贴
- `公务交通补贴`: 交通相关的补贴

#### 社保信息
- `医疗保险个人应缴总额`: 个人应缴纳的医疗保险总额
- `养老保险个人应缴金额`: 个人应缴纳的养老保险金额
- `职业年金个人应缴费额`: 个人应缴纳的职业年金金额
- `住房公积金个人应缴费额`: 个人应缴纳的住房公积金金额
- `其他扣款`: 其他各类扣款

#### 统计字段
- `应发合计`: 所有薪资项目的总和
- `扣发合计`: 所有扣除项目的总和
- `实发合计`: 应发合计减去扣发合计

### 使用示例

```sql
-- 查看特定薪酬周期的正编人员工资信息
SELECT * FROM public.正编人员工资信息表 
WHERE "薪酬周期" = '2023-12'
ORDER BY "姓名";

-- 按编制类型分组统计
SELECT 
    "编制",
    COUNT(*) AS "人数",
    AVG("应发合计") AS "平均应发合计",
    AVG("实发合计") AS "平均实发合计"
FROM 
    public.正编人员工资信息表
WHERE 
    "薪酬周期" = '2023-12'
GROUP BY 
    "编制"
ORDER BY 
    "平均应发合计" DESC;
```

## 聘用人员工资信息表

### 描述

`聘用人员工资信息表` 视图包含非正编人员的薪资信息。聘用人员通过排除 `sal_employee_type_key` 字段中的正编人员类型（gwy、cg、sy）来识别。

### 主要字段

#### 基本信息
- `薪酬周期`: 薪资发放的周期标识，通常为年月格式（如 "2023-12"）
- `姓名`: 员工姓名
- `编制`: 员工编制类型，通过关联 `establishment_types` 表获取

#### 人员信息
- `岗位类别`: 员工的岗位类别
- `工资级别`: 员工的工资级别
- `工资档次`: 员工的工资档次
- `参照正编薪级工资级次`: 参照正编人员的薪级工资级次

#### 薪资信息
- `基本工资`: 员工的基本工资
- `岗位工资`: 基于岗位的工资
- `绩效工资`: 绩效相关的工资
- `补助`: 各类补助
- `信访岗位津贴`: 信访岗位的特殊津贴
- `基础绩效奖`: 基础绩效奖金

#### 社保信息
- `医疗保险个人应缴总额`: 个人应缴纳的医疗保险总额
- `养老保险个人应缴金额`: 个人应缴纳的养老保险金额
- `职业年金个人应缴费额`: 个人应缴纳的职业年金金额
- `住房公积金个人应缴费额`: 个人应缴纳的住房公积金金额
- `其他扣款`: 其他各类扣款

#### 统计字段
- `工资小计`: 基本工资、岗位工资、绩效工资、信访岗位津贴和基础绩效奖的总和
- `发放合计`: 工资小计加上补助
- `扣发合计`: 所有扣除项目的总和
- `实发合计`: 发放合计减去扣发合计

### 使用示例

```sql
-- 查看特定薪酬周期的聘用人员工资信息
SELECT * FROM public.聘用人员工资信息表 
WHERE "薪酬周期" = '2023-12'
ORDER BY "姓名";

-- 按岗位类别分组统计
SELECT 
    "岗位类别",
    COUNT(*) AS "人数",
    AVG("工资小计") AS "平均工资小计",
    AVG("发放合计") AS "平均发放合计",
    AVG("实发合计") AS "平均实发合计"
FROM 
    public.聘用人员工资信息表
WHERE 
    "薪酬周期" = '2023-12'
GROUP BY 
    "岗位类别"
ORDER BY 
    "平均工资小计" DESC;
```

## 字段命名规则

系统中的字段命名遵循以下规则：

1. 原始导入表中的字段使用原始名称，如 `raw_medical_staging` 表中的 `medical_total_employee_contribution`

2. 合并表 `consolidated_data` 中的字段添加来源表前缀，如：
   - `med_` 前缀表示来自医疗保险数据
   - `pen_` 前缀表示来自养老保险数据
   - `hf_` 前缀表示来自住房公积金数据
   - `ann_` 前缀表示来自年金数据
   - `sal_` 前缀表示来自薪资数据
   - `tax_` 前缀表示来自税务数据

3. 视图中的字段使用中文名称，便于用户理解和使用
