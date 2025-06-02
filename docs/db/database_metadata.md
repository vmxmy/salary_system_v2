# 数据库元数据文档

## 模式概览
数据库包含以下6个模式：
1. **config** - 系统配置表
2. **hr** - 人力资源相关表
3. **payroll** - 薪资计算相关表
4. **reports** - 报表相关表
5. **security** - 权限管理表
6. **public** - 公共表（仅包含alembic_version）

---

## config 模式
### 字典表
1. **lookup_types**
   - id (bigint, NOT NULL)
   - code (character varying, NOT NULL) - 类型代码
   - name (character varying, NOT NULL) - 类型名称
   - description (text, NULLABLE) - 类型描述

2. **lookup_values**
   - id (bigint, NOT NULL)
   - lookup_type_id (bigint, NOT NULL) - 关联lookup_types
   - code (character varying, NOT NULL) - 值代码
   - name (character varying, NOT NULL) - 值名称
   - description (text, NULLABLE) - 值描述
   - sort_order (integer, NOT NULL) - 排序顺序
   - is_active (boolean, NOT NULL) - 是否激活
   - parent_lookup_value_id (bigint, NULLABLE) - 父级值ID

### 薪资组件定义
3. **payroll_component_definitions**
   - id (bigint, NOT NULL)
   - code (character varying, NOT NULL) - 组件代码
   - name (character varying, NOT NULL) - 组件名称
   - type (character varying, NOT NULL) - 组件类型
   - calculation_method (character varying, NULLABLE) - 计算方法
   - **calculation_parameters (jsonb, NULLABLE)** - 计算参数（JSONB动态字段）
   - is_taxable (boolean, NOT NULL) - 是否应税
   - is_social_security_base (boolean, NOT NULL) - 是否社保基数
   - is_housing_fund_base (boolean, NOT NULL) - 是否公积金基数
   - display_order (integer, NOT NULL) - 显示顺序
   - is_active (boolean, NOT NULL) - 是否激活
   - effective_date (date, NOT NULL) - 生效日期
   - end_date (date, NULLABLE) - 失效日期

### 社保与税率
4. **social_security_rates**
   - id (bigint, NOT NULL)
   - region_code (character varying, NOT NULL) - 地区代码
   - contribution_type (character varying, NOT NULL) - 缴纳类型
   - participant_type (character varying, NOT NULL) - 参与方类型
   - rate (numeric, NOT NULL) - 费率
   - base_min (numeric, NULLABLE) - 基数下限
   - base_max (numeric, NULLABLE) - 基数上限
   - fixed_amount (numeric, NOT NULL) - 固定金额
   - effective_date (date, NOT NULL) - 生效日期
   - end_date (date, NULLABLE) - 失效日期

5. **tax_brackets**
   - id (bigint, NOT NULL)
   - region_code (character varying, NOT NULL) - 地区代码
   - tax_type (character varying, NOT NULL) - 税种
   - income_range_start (numeric, NOT NULL) - 收入区间起点
   - income_range_end (numeric, NULLABLE) - 收入区间终点
   - tax_rate (numeric, NOT NULL) - 税率
   - quick_deduction (numeric, NOT NULL) - 速算扣除数
   - effective_date (date, NOT NULL) - 生效日期
   - end_date (date, NULLABLE) - 失效日期

### 系统参数
6. **system_parameters**
   - id (bigint, NOT NULL)
   - key (character varying, NOT NULL) - 参数键
   - value (text, NOT NULL) - 参数值
   - description (text, NULLABLE) - 参数描述

---

## hr 模式
### 组织架构
1. **departments**
   - id (bigint, NOT NULL)
   - code (character varying, NOT NULL) - 部门代码
   - name (character varying, NOT NULL) - 部门名称
   - parent_department_id (bigint, NULLABLE) - 上级部门ID
   - effective_date (date, NOT NULL) - 生效日期
   - end_date (date, NULLABLE) - 失效日期
   - is_active (boolean, NOT NULL) - 是否激活

2. **positions**
   - id (bigint, NOT NULL)
   - code (character varying, NULLABLE) - 职位代码
   - name (character varying, NOT NULL) - 职位名称
   - description (text, NULLABLE) - 职位描述
   - parent_position_id (bigint, NULLABLE) - 上级职位ID
   - effective_date (date, NOT NULL) - 生效日期
   - end_date (date, NULLABLE) - 失效日期
   - is_active (boolean, NOT NULL) - 是否激活

3. **personnel_categories**
   - id (bigint, NOT NULL)
   - code (character varying, NOT NULL) - 人员类别代码
   - name (character varying, NOT NULL) - 人员类别名称
   - description (text, NULLABLE) - 类别描述
   - effective_date (date, NOT NULL) - 生效日期
   - end_date (date, NULLABLE) - 失效日期
   - is_active (boolean, NOT NULL) - 是否激活
   - parent_category_id (bigint, NULLABLE) - 父级类别ID

### 员工信息
4. **employees**
   - id (bigint, NOT NULL)
   - employee_code (character varying, NULLABLE) - 员工编号
   - first_name (character varying, NOT NULL) - 名
   - last_name (character varying, NOT NULL) - 姓
   - date_of_birth (date, NULLABLE) - 出生日期
   - gender_lookup_value_id (bigint, NULLABLE) - 性别字典ID
   - id_number (character varying, NULLABLE) - 身份证号
   - nationality (character varying, NULLABLE) - 国籍
   - hire_date (date, NOT NULL) - 入职日期
   - status_lookup_value_id (bigint, NOT NULL) - 状态字典ID
   - email (character varying, NULLABLE) - 邮箱
   - phone_number (character varying, NULLABLE) - 电话
   - created_at (timestamp with time zone, NOT NULL) - 创建时间
   - updated_at (timestamp with time zone, NOT NULL) - 更新时间
   - employment_type_lookup_value_id (bigint, NULLABLE) - 雇佣类型
   - education_level_lookup_value_id (bigint, NULLABLE) - 教育程度
   - marital_status_lookup_value_id (bigint, NULLABLE) - 婚姻状况
   - political_status_lookup_value_id (bigint, NULLABLE) - 政治面貌
   - contract_type_lookup_value_id (bigint, NULLABLE) - 合同类型
   - home_address (text, NULLABLE) - 家庭地址
   - emergency_contact_name (character varying, NULLABLE) - 紧急联系人
   - emergency_contact_phone (character varying, NULLABLE) - 紧急联系人电话
   - department_id (bigint, NULLABLE) - 所属部门
   - ethnicity (character varying, NULLABLE) - 民族
   - first_work_date (date, NULLABLE) - 首次工作日期
   - interrupted_service_years (numeric, NULLABLE) - 中断服务年限
   - personnel_category_id (bigint, NULLABLE) - 人员类别
   - actual_position_id (bigint, NULLABLE) - 实际职位
   - career_position_level_date (date, NULLABLE) - 职级评定日期
   - current_position_start_date (date, NULLABLE) - 当前职位开始日期
   - salary_level_lookup_value_id (bigint, NULLABLE) - 薪资等级
   - salary_grade_lookup_value_id (bigint, NULLABLE) - 薪资档次
   - ref_salary_level_lookup_value_id (bigint, NULLABLE) - 参考薪资等级
   - job_position_level_lookup_value_id (bigint, NULLABLE) - 职位等级

### 员工附属信息
5. **employee_appraisals** - 员工考核
6. **employee_bank_accounts** - 员工银行账户
7. **employee_compensation_history** - 薪酬历史
8. **employee_contracts** - 员工合同
9. **employee_job_history** - 工作历史
10. **employee_leave_balances** - 假期余额
11. **employee_leave_requests** - 请假申请
12. **employee_payroll_components** 
    - **parameters (jsonb, NULLABLE)** - 薪资组件参数（JSONB动态字段）

### 其他
13. **leave_types**
    - **accrual_rule_definition (jsonb, NULLABLE)** - 假期累计规则（JSONB动态字段）

---

## payroll 模式
1. **payroll_entries**
   - **earnings_details (jsonb, NOT NULL)** - 收入明细（JSONB动态字段）
   - **deductions_details (jsonb, NOT NULL)** - 扣款明细（JSONB动态字段）
   - **calculation_inputs (jsonb, NULLABLE)** - 计算输入（JSONB动态字段）
   - **calculation_log (jsonb, NULLABLE)** - 计算日志（JSONB动态字段）

2. **payroll_periods** - 薪资周期
3. **payroll_runs** - 薪资审核记录

---

## reports 模式
1. **employee_salary_details_view** - 员工薪资明细视图
   - **raw_calculation_inputs (jsonb, NULLABLE)** - 原始计算输入（JSONB动态字段）
   - **raw_calculation_log (jsonb, NULLABLE)** - 原始计算日志（JSONB动态字段）

2. **report_calculated_fields** - 报表计算字段
3. **report_template_fields** - 报表模板字段
4. **report_view_executions** - 报表执行记录
5. **report_views** - 报表视图
   - **description_lines (jsonb, NULLABLE)** - 描述行（JSONB动态字段）

6. **view_payroll_entries_jsonb_zhan_kai_zhong_wen_bie_ming_biao** - 薪资条目JSONB展开视图
7. **view_payroll_entries_zhan_kai_jsonb** - 薪资条目JSONB展开视图

---

## security 模式
1. **permissions** - 权限表
2. **role_permissions** - 角色权限关联
3. **roles** - 角色表
4. **user_roles** - 用户角色关联
5. **users** - 用户表

---

## public 模式
1. **alembic_version** - 数据库迁移版本
   - version_num (character varying, NOT NULL)