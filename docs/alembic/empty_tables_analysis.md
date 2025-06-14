# 数据库空表分析报告

## 概述

**分析时间**: 2025-01-27  
**数据库**: salary_system_v2  
**总表数**: 60 个  
**空表数**: 25 个 (41.7%)  

## 空表列表 (按 Schema 分类)

### Config Schema 空表 (10/11 表为空)

| 表名 | 行数 | 状态 | 用途 |
|------|------|------|------|
| tax_brackets | 0 | 🔴 空表 | 税级配置 |
| social_security_rates | 0 | 🔴 空表 | 社保费率配置 |
| batch_report_tasks | 0 | 🔴 空表 | 批量报表任务 |
| batch_report_task_items | 0 | 🔴 空表 | 批量报表任务项 |
| report_calculated_fields | 0 | 🔴 空表 | 报表计算字段 |
| report_executions | 0 | 🔴 空表 | 报表执行记录 |
| report_data_source_access_logs | 0 | 🔴 空表 | 报表数据源访问日志 |
| report_permissions | 0 | 🔴 空表 | 报表权限 |
| report_user_preferences | 0 | 🔴 空表 | 报表用户偏好 |
| report_template_fields | 0 | 🔴 空表 | 报表模板字段 |
| report_templates | 0 | 🔴 空表 | 报表模板 |

### HR Schema 空表 (6/13 表为空)

| 表名 | 行数 | 状态 | 用途 |
|------|------|------|------|
| employee_appraisals | 0 | 🔴 空表 | 员工考核 |
| employee_compensation_history | 0 | 🔴 空表 | 员工薪酬历史 |
| employee_contracts | 0 | 🔴 空表 | 员工合同 |
| employee_leave_balances | 0 | 🔴 空表 | 员工假期余额 |
| employee_leave_requests | 0 | 🔴 空表 | 员工请假申请 |
| employee_payroll_components | 0 | 🔴 空表 | 员工薪资组件 |
| leave_types | 0 | 🔴 空表 | 假期类型 |

### Payroll Schema 空表 (4/12 表为空)

| 表名 | 行数 | 状态 | 用途 |
|------|------|------|------|
| calculation_rules | 0 | 🔴 空表 | 计算规则 |
| calculation_templates | 0 | 🔴 空表 | 计算模板 |
| calculation_audit_logs | 0 | 🔴 空表 | 计算审计日志 |
| payroll_component_configs | 0 | 🔴 空表 | 薪资组件配置 |
| monthly_payroll_snapshots | 0 | 🔴 空表 | 月度薪资快照 |

### Attendance Schema 空表 (2/4 表为空)

| 表名 | 行数 | 状态 | 用途 |
|------|------|------|------|
| attendance_rules | 0 | 🔴 空表 | 考勤规则 |
| daily_attendance_records | 0 | 🔴 空表 | 日常考勤记录 |

### Reports Schema 空表 (3/5 表为空)

| 表名 | 行数 | 状态 | 用途 |
|------|------|------|------|
| report_field_definitions | 0 | 🔴 空表 | 报表字段定义 |
| report_views | 0 | 🔴 空表 | 报表视图配置 |
| report_view_executions | 0 | 🔴 空表 | 报表视图执行记录 |

### Security Schema 空表 (0/5 表为空)

✅ **所有 Security Schema 表都有数据**

## 有数据的表统计

### Config Schema (1/11 表有数据)

| 表名 | 行数 | 状态 |
|------|------|------|
| lookup_types | 21 | ✅ 有数据 |
| lookup_values | 105 | ✅ 有数据 |
| payroll_component_definitions | 120 | ✅ 有数据 |
| system_parameters | 1 | ✅ 有数据 |
| report_file_manager | 8 | ✅ 有数据 |
| report_data_sources | 13 | ✅ 有数据 |

### HR Schema (7/13 表有数据)

| 表名 | 行数 | 状态 |
|------|------|------|
| employees | 82 | ✅ 有数据 |
| departments | 11 | ✅ 有数据 |
| personnel_categories | 18 | ✅ 有数据 |
| positions | 34 | ✅ 有数据 |
| employee_bank_accounts | 81 | ✅ 有数据 |
| employee_job_history | 82 | ✅ 有数据 |

### Payroll Schema (8/12 表有数据)

| 表名 | 行数 | 状态 |
|------|------|------|
| payroll_periods | 10 | ✅ 有数据 |
| payroll_runs | 10 | ✅ 有数据 |
| payroll_entries | 511 | ✅ 有数据 |
| calculation_rule_sets | 71 | ✅ 有数据 |
| calculation_logs | 9 | ✅ 有数据 |
| social_insurance_configs | 15 | ✅ 有数据 |
| tax_configs | 1 | ✅ 有数据 |
| employee_salary_configs | 511 | ✅ 有数据 |
| payroll_run_audit_summary | 2 | ✅ 有数据 |
| payroll_audit_anomalies | 15 | ✅ 有数据 |
| payroll_audit_history | 5 | ✅ 有数据 |
| audit_rule_configurations | 6 | ✅ 有数据 |

### Attendance Schema (2/4 表有数据)

| 表名 | 行数 | 状态 |
|------|------|------|
| attendance_periods | 59 | ✅ 有数据 |
| attendance_records | 5 | ✅ 有数据 |

### Reports Schema (2/5 表有数据)

| 表名 | 行数 | 状态 |
|------|------|------|
| report_type_definitions | 6 | ✅ 有数据 |
| report_config_presets | 3 | ✅ 有数据 |

### Security Schema (5/5 表有数据)

| 表名 | 行数 | 状态 |
|------|------|------|
| users | 3 | ✅ 有数据 |
| roles | 5 | ✅ 有数据 |
| permissions | 163 | ✅ 有数据 |
| user_roles | 3 | ✅ 有数据 |
| role_permissions | 229 | ✅ 有数据 |

## 分析结论

### 🔍 空表分布分析

1. **Config Schema 最多空表**: 11 个表中有 10 个为空 (90.9%)
   - 主要是报表相关功能表未使用
   - 税级和社保费率配置表为空

2. **HR Schema 部分空表**: 13 个表中有 6 个为空 (46.2%)
   - 员工相关高级功能未启用
   - 假期管理功能未使用

3. **Payroll Schema 少量空表**: 12 个表中有 4 个为空 (33.3%)
   - 核心薪资功能正常使用
   - 高级计算功能部分未启用

4. **Security Schema 全部使用**: 5 个表全部有数据 (0% 空表)
   - 用户权限系统完全启用

### 📊 使用率统计

| Schema | 总表数 | 有数据表数 | 使用率 |
|--------|--------|------------|--------|
| security | 5 | 5 | 100% |
| payroll | 12 | 8 | 66.7% |
| attendance | 4 | 2 | 50% |
| hr | 13 | 7 | 53.8% |
| reports | 5 | 2 | 40% |
| config | 11 | 6 | 54.5% |
| **总计** | **60** | **35** | **58.3%** |

## 空表分类

### 🟡 预期为空的表 (功能未启用)

**报表管理功能**:
- `config.batch_report_tasks` - 批量报表功能
- `config.batch_report_task_items`
- `config.report_templates` - 报表模板功能
- `config.report_template_fields`
- `reports.report_views` - 报表视图功能
- `reports.report_view_executions`

**员工管理高级功能**:
- `hr.employee_appraisals` - 员工考核功能
- `hr.employee_contracts` - 合同管理功能
- `hr.employee_compensation_history` - 薪酬历史功能

**假期管理功能**:
- `hr.leave_types` - 假期类型配置
- `hr.employee_leave_balances` - 假期余额
- `hr.employee_leave_requests` - 请假申请

**考勤管理功能**:
- `attendance.attendance_rules` - 考勤规则
- `attendance.daily_attendance_records` - 日常考勤

### 🔴 可能需要配置的表

**税务和社保配置**:
- `config.tax_brackets` - 税级配置 (重要)
- `config.social_security_rates` - 社保费率配置 (重要)

**薪资计算功能**:
- `payroll.calculation_rules` - 计算规则
- `payroll.calculation_templates` - 计算模板
- `payroll.payroll_component_configs` - 薪资组件配置

### 🟢 正常为空的表 (日志类)

**审计和日志表**:
- `config.report_data_source_access_logs` - 访问日志
- `config.report_executions` - 执行记录
- `payroll.calculation_audit_logs` - 计算审计日志
- `payroll.monthly_payroll_snapshots` - 月度快照

## 建议和行动计划

### 🔧 立即需要关注的表

1. **税务配置** (高优先级)
   ```sql
   -- 需要配置税级数据
   INSERT INTO config.tax_brackets (...);
   ```

2. **社保费率配置** (高优先级)
   ```sql
   -- 需要配置社保费率数据
   INSERT INTO config.social_security_rates (...);
   ```

### 📋 功能启用建议

1. **假期管理系统**
   - 配置 `hr.leave_types` 假期类型
   - 启用假期余额和申请功能

2. **员工合同管理**
   - 启用 `hr.employee_contracts` 合同管理
   - 配置 `hr.employee_compensation_history` 薪酬历史

3. **考勤管理系统**
   - 配置 `attendance.attendance_rules` 考勤规则
   - 启用日常考勤记录功能

### 🗑️ 可考虑清理的表

**未使用的报表功能表** (如果确定不使用):
- `config.report_permissions`
- `config.report_user_preferences`
- `reports.report_field_definitions`

**注意**: 清理前需要确认这些功能确实不会使用

### 🚀 优化建议

1. **数据库性能优化**
   - 对空表暂停不必要的索引维护
   - 考虑延迟加载未使用的功能模块

2. **功能模块化**
   - 将未使用的功能模块标记为可选
   - 按需启用相关表和功能

3. **监控和维护**
   - 定期检查表使用情况
   - 建立表使用率监控机制

---

**分析完成时间**: 2025-01-27  
**下次检查建议**: 1个月后  
**重点关注**: 税务和社保配置表的数据填充 