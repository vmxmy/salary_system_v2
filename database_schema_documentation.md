# 高新区工资信息管理系统数据库架构文档

## 概述
本文档详细描述了高新区工资信息管理系统（salary_system_v2）的数据库架构，包括所有模式（Schema）、表结构、字段定义、约束关系和视图。

## 数据库信息
- **数据库名称**: salary_system_v2
- **数据库系统**: PostgreSQL
- **文档生成时间**: 2025-06-17

## 模式（Schemas）概览

数据库包含7个主要模式，每个模式负责不同的业务功能：

| 模式名称 | 描述 | 表数量 |
|---------|------|--------|
| `hr` | 人力资源管理 | 13张表 |
| `payroll` | 工资薪酬管理 | 18张表 |
| `config` | 系统配置和基础数据 | 17张表 |
| `security` | 安全认证和权限管理 | 5张表 |
| `reports` | 报表管理 | 5张表 |
| `attendance` | 考勤管理 | 4张表 |
| `public` | 默认公共模式 | 0张表 |

---

## 1. HR模式 (人力资源管理)

### 1.1 核心表

#### employees (员工基础信息表)
员工的核心信息表，存储所有员工的基本信息。

| 字段名 | 数据类型 | 可空 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| `id` | bigint | NOT NULL | IDENTITY | 主键，员工唯一标识 |
| `employee_code` | varchar(50) | NULL | | 员工编号 |
| `first_name` | varchar(100) | NOT NULL | | 姓 |
| `last_name` | varchar(100) | NOT NULL | | 名 |
| `date_of_birth` | date | NULL | | 出生日期 |
| `gender_lookup_value_id` | bigint | NULL | | 性别（关联lookup_values） |
| `id_number` | varchar(50) | NULL | | 身份证号 |
| `nationality` | varchar(100) | NULL | | 国籍 |
| `hire_date` | date | NOT NULL | | 入职日期 |
| `status_lookup_value_id` | bigint | NOT NULL | | 员工状态（关联lookup_values） |
| `email` | varchar(100) | NULL | | 邮箱 |
| `phone_number` | varchar(50) | NULL | | 电话号码 |
| `employment_type_lookup_value_id` | bigint | NULL | | 用工类型 |
| `education_level_lookup_value_id` | bigint | NULL | | 学历水平 |
| `marital_status_lookup_value_id` | bigint | NULL | | 婚姻状态 |
| `political_status_lookup_value_id` | bigint | NULL | | 政治面貌 |
| `contract_type_lookup_value_id` | bigint | NULL | | 合同类型 |
| `home_address` | text | NULL | | 家庭住址 |
| `emergency_contact_name` | varchar(255) | NULL | | 紧急联系人姓名 |
| `emergency_contact_phone` | varchar(50) | NULL | | 紧急联系人电话 |
| `department_id` | bigint | NULL | | 部门ID |
| `ethnicity` | varchar(100) | NULL | | 民族 |
| `first_work_date` | date | NULL | | 首次参加工作日期 |
| `interrupted_service_years` | numeric(4,2) | NULL | | 中断服务年限 |
| `personnel_category_id` | bigint | NULL | | 人员类别ID |
| `actual_position_id` | bigint | NULL | | 实际职位ID |
| `career_position_level_date` | date | NULL | | 职业生涯职位级别达到日期 |
| `current_position_start_date` | date | NULL | | 当前职位开始日期 |
| `salary_level_lookup_value_id` | bigint | NULL | | 工资级别 |
| `salary_grade_lookup_value_id` | bigint | NULL | | 工资档次 |
| `ref_salary_level_lookup_value_id` | bigint | NULL | | 参照正编薪级 |
| `job_position_level_lookup_value_id` | bigint | NULL | | 职务级别 |
| `is_active` | boolean | NOT NULL | | 员工是否激活 |
| `social_security_client_number` | varchar(50) | NULL | | 社保个人客户号 |
| `housing_fund_client_number` | varchar(50) | NULL | | 公积金个人客户号 |
| `created_at` | timestamptz | NOT NULL | now() | 创建时间 |
| `updated_at` | timestamptz | NOT NULL | now() | 更新时间 |

**索引**:
- 主键: `employees_pkey`
- 唯一约束: `employee_code`, `email`, `id_number`
- 复合索引: `idx_employees_active_dept`, `idx_employees_category_id` 等

**外键关系**:
- `department_id` → `hr.departments(id)`
- `personnel_category_id` → `hr.personnel_categories(id)`
- `actual_position_id` → `hr.positions(id)`
- 多个lookup字段 → `config.lookup_values(id)`

### 1.2 支持表

#### departments (部门表)
存储组织架构中的部门信息。

#### positions (职位表)
定义组织中的各种职位。

#### personnel_categories (人员类别表)
定义不同的人员分类，如正式员工、临时工等。

#### employee_job_history (员工职位历史表)
记录员工的职位变动历史。

#### employee_bank_accounts (员工银行账户表)
存储员工的银行账户信息，用于工资发放。

#### employee_contracts (员工合同表)
管理员工合同信息。

#### employee_leave_balances (员工假期余额表)
跟踪员工各类假期的剩余天数。

#### employee_leave_requests (员工请假申请表)
管理员工的请假申请。

#### employee_payroll_components (员工工资组件表)
定义员工个性化的工资组件。

#### employee_compensation_history (员工薪酬历史表)
记录员工薪酬变动历史。

#### employee_appraisals (员工考核表)
存储员工绩效考核结果。

#### leave_types (假期类型表)
定义系统支持的假期类型。

---

## 2. PAYROLL模式 (工资薪酬管理)

### 2.1 核心表

#### payroll_entries (工资记录表)
存储每个员工每个工资期的详细工资计算结果。

| 字段名 | 数据类型 | 可空 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| `id` | bigint | NOT NULL | IDENTITY | 主键 |
| `employee_id` | bigint | NOT NULL | | 员工ID |
| `payroll_period_id` | bigint | NOT NULL | | 工资期ID |
| `payroll_run_id` | bigint | NOT NULL | | 工资运行ID |
| `gross_pay` | numeric(18,4) | NOT NULL | 0 | 应发工资 |
| `total_deductions` | numeric(18,4) | NOT NULL | 0 | 总扣除额 |
| `net_pay` | numeric(18,4) | NOT NULL | 0 | 实发工资 |
| `earnings_details` | jsonb | NOT NULL | {} | 收入明细（JSON格式） |
| `deductions_details` | jsonb | NOT NULL | {} | 扣除明细（JSON格式） |
| `calculation_inputs` | jsonb | NULL | | 计算输入参数 |
| `calculation_log` | jsonb | NULL | | 计算日志 |
| `status_lookup_value_id` | bigint | NOT NULL | | 状态 |
| `remarks` | text | NULL | | 备注 |
| `calculated_at` | timestamptz | NOT NULL | now() | 计算时间 |
| `updated_at` | timestamptz | NULL | now() | 更新时间 |
| `audit_status` | varchar(20) | NOT NULL | 'PENDING' | 审核状态 |
| `audit_timestamp` | timestamptz | NULL | | 审核时间 |
| `auditor_id` | bigint | NULL | | 审核人ID |
| `audit_notes` | text | NULL | | 审核备注 |
| `version` | integer | NOT NULL | 1 | 版本号 |

**索引**:
- 主键及多个GIN索引用于JSONB字段高效查询
- 复合唯一约束: `(employee_id, payroll_period_id, payroll_run_id)`

#### payroll_periods (工资期表)
定义工资计算的时间周期。

#### payroll_runs (工资运行表)
记录每次工资计算的执行情况。

### 2.2 配置表

#### employee_salary_configs (员工工资配置表)
存储每个员工的工资配置信息。

#### calculation_rule_sets (计算规则集表)
定义工资计算的规则集合。

#### calculation_rules (计算规则表)
具体的工资计算规则。

#### calculation_templates (计算模板表)
工资计算模板。

### 2.3 审计表

#### payroll_audit_history (工资审计历史表)
记录工资数据的审计历史。

#### payroll_audit_anomalies (工资审计异常表)
记录审计过程中发现的异常。

#### calculation_audit_logs (计算审计日志表)
详细的计算审计日志。

### 2.4 其他支持表

- `monthly_payroll_snapshots`: 月度工资快照
- `calculation_logs`: 计算日志
- `social_insurance_configs`: 社保配置
- `tax_configs`: 税务配置
- `payroll_component_configs`: 工资组件配置
- `audit_rule_configurations`: 审计规则配置
- `payroll_run_audit_summary`: 工资运行审计汇总
- `personnel_category_social_insurance_rules`: 人员类别社保规则

---

## 3. CONFIG模式 (系统配置和基础数据)

### 3.1 核心配置表

#### lookup_types (查找类型表)
定义系统中各种枚举类型的分类。

#### lookup_values (查找值表)
系统中所有枚举值的存储表，支持层级结构。

| 字段名 | 数据类型 | 可空 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| `id` | bigint | NOT NULL | IDENTITY | 主键 |
| `lookup_type_id` | bigint | NOT NULL | | 查找类型ID |
| `code` | varchar(50) | NOT NULL | | 代码 |
| `name` | varchar(100) | NOT NULL | | 名称 |
| `description` | text | NULL | | 描述 |
| `sort_order` | integer | NOT NULL | 0 | 排序顺序 |
| `is_active` | boolean | NOT NULL | true | 是否激活 |
| `parent_lookup_value_id` | bigint | NULL | | 父级查找值ID（支持层级） |

#### payroll_component_definitions (工资组件定义表)
定义系统中所有可能的工资组件。

#### system_parameters (系统参数表)
存储系统级别的配置参数。

### 3.2 报表配置表

- `report_templates`: 报表模板
- `report_template_fields`: 报表模板字段
- `report_data_sources`: 报表数据源
- `report_calculated_fields`: 报表计算字段
- `report_permissions`: 报表权限
- `report_executions`: 报表执行记录
- `report_file_manager`: 报表文件管理
- `report_user_preferences`: 报表用户偏好
- `report_data_source_access_logs`: 报表数据源访问日志

### 3.3 批量任务表

- `batch_report_tasks`: 批量报表任务
- `batch_report_task_items`: 批量报表任务项

### 3.4 财税配置表

- `social_security_rates`: 社保费率
- `tax_brackets`: 税率级距

---

## 4. SECURITY模式 (安全认证和权限管理)

### 4.1 用户认证表

#### users (用户表)
系统用户账户信息。

#### roles (角色表)
定义系统中的各种角色。

#### permissions (权限表)
定义系统中的所有权限点。

### 4.2 权限关联表

#### user_roles (用户角色关联表)
用户与角色的多对多关系。

#### role_permissions (角色权限关联表)
角色与权限的多对多关系。

---

## 5. REPORTS模式 (报表管理)

### 5.1 报表定义表

#### report_views (报表视图表)
定义报表的视图配置。

#### report_type_definitions (报表类型定义表)
定义不同类型的报表。

#### report_field_definitions (报表字段定义表)
定义报表中的字段。

### 5.2 报表执行表

#### report_view_executions (报表视图执行表)
记录报表视图的执行历史。

#### report_config_presets (报表配置预设表)
预设的报表配置。

---

## 6. ATTENDANCE模式 (考勤管理)

### 6.1 考勤表

#### attendance_records (考勤记录表)
员工考勤记录。

#### daily_attendance_records (每日考勤记录表)
每日考勤汇总记录。

#### attendance_periods (考勤期间表)
定义考勤统计的时间期间。

#### attendance_rules (考勤规则表)
考勤计算规则。

---

## 7. 数据库视图 (Views)

系统包含18个视图，主要分布在`payroll`和`reports`模式中：

### 7.1 PAYROLL模式视图

- `audit_anomalies_detail`: 审计异常详情视图
- `audit_overview`: 审计概览视图

### 7.2 REPORTS模式视图

- `v_comprehensive_employee_payroll`: 员工工资综合视图
- `v_comprehensive_employee_payroll_optimized`: 优化的员工工资综合视图
- `v_employee_salary_history`: 员工工资历史视图
- `v_employees_basic`: 员工基础信息视图
- `v_payroll_basic`: 工资基础视图
- `v_payroll_calculations`: 工资计算视图
- `v_payroll_component_usage`: 工资组件使用情况视图
- `v_payroll_components_basic`: 工资组件基础视图
- `v_payroll_deductions`: 工资扣除视图
- `v_payroll_earnings`: 工资收入视图
- `v_payroll_entries_basic`: 工资记录基础视图
- `v_payroll_entries_detailed`: 工资记录详细视图
- `v_payroll_periods_detail`: 工资期详情视图
- `v_payroll_runs_detail`: 工资运行详情视图
- `v_payroll_summary_analysis`: 工资汇总分析视图
- `v_personnel_hierarchy_simple`: 人员层级简单视图

---

## 8. 关键设计特点

### 8.1 数据类型使用
- **JSONB**: 广泛用于存储灵活的结构化数据（工资计算详情、配置参数等）
- **numeric(18,4)**: 用于金额字段，确保精度
- **timestamptz**: 时间戳带时区，确保时间准确性
- **bigint**: 主键和外键，支持大数据量

### 8.2 索引策略
- **GIN索引**: 用于JSONB字段的高效查询
- **复合索引**: 优化常用查询组合
- **唯一约束**: 确保数据完整性

### 8.3 外键约束
- **CASCADE**: 用于紧密关联的数据（如员工删除时删除相关记录）
- **SET NULL**: 用于可选关联（如部门删除时员工department_id设为NULL）
- **RESTRICT**: 用于关键引用（防止删除被引用的数据）

### 8.4 审计追踪
- 大多数表包含`created_at`和`updated_at`字段
- 工资相关表有详细的审计字段和版本控制
- 审计日志表记录关键操作历史

### 8.5 软删除和状态管理
- 使用`is_active`字段实现软删除
- 通过`status_lookup_value_id`管理实体状态
- 支持数据的生命周期管理

---

## 9. 总结

该数据库设计采用了现代企业应用的最佳实践：

1. **模块化设计**: 通过schema分离不同业务领域
2. **灵活配置**: 使用lookup表和JSONB字段支持灵活配置
3. **审计完整**: 完整的审计追踪机制
4. **性能优化**: 合理的索引设计和视图优化
5. **数据完整性**: 完善的约束和外键关系
6. **扩展性**: 支持层级结构和灵活的数据模型

该架构能够很好地支持复杂的企业工资管理需求，包括多种人员类别、复杂的工资计算规则、完整的审计要求等。