# 所有空表完整列表

**检查时间**: 2025-01-27  
**总空表数**: 25 个  

## Config Schema 空表 (10个)

```sql
-- 税务和社保配置
config.tax_brackets                    -- 税级配置
config.social_security_rates           -- 社保费率配置

-- 批量报表功能
config.batch_report_tasks              -- 批量报表任务
config.batch_report_task_items         -- 批量报表任务项

-- 报表管理功能
config.report_calculated_fields        -- 报表计算字段
config.report_executions               -- 报表执行记录
config.report_data_source_access_logs  -- 报表数据源访问日志
config.report_permissions              -- 报表权限
config.report_user_preferences         -- 报表用户偏好
config.report_template_fields          -- 报表模板字段
config.report_templates                -- 报表模板
```

## HR Schema 空表 (6个)

```sql
-- 员工管理高级功能
hr.employee_appraisals                 -- 员工考核
hr.employee_compensation_history       -- 员工薪酬历史
hr.employee_contracts                  -- 员工合同

-- 假期管理功能
hr.employee_leave_balances             -- 员工假期余额
hr.employee_leave_requests             -- 员工请假申请
hr.leave_types                         -- 假期类型

-- 员工薪资组件
hr.employee_payroll_components         -- 员工薪资组件
```

## Payroll Schema 空表 (5个)

```sql
-- 计算引擎功能
payroll.calculation_rules              -- 计算规则
payroll.calculation_templates          -- 计算模板
payroll.calculation_audit_logs         -- 计算审计日志

-- 薪资配置
payroll.payroll_component_configs      -- 薪资组件配置

-- 快照功能
payroll.monthly_payroll_snapshots      -- 月度薪资快照
```

## Attendance Schema 空表 (2个)

```sql
-- 考勤管理功能
attendance.attendance_rules            -- 考勤规则
attendance.daily_attendance_records    -- 日常考勤记录
```

## Reports Schema 空表 (3个)

```sql
-- 报表配置功能
reports.report_field_definitions       -- 报表字段定义
reports.report_views                   -- 报表视图配置
reports.report_view_executions         -- 报表视图执行记录
```

## 按功能分类的空表

### 🔴 重要配置表 (需要立即关注)
```sql
config.tax_brackets                    -- 税级配置 (影响薪资计算)
config.social_security_rates           -- 社保费率配置 (影响薪资计算)
```

### 🟡 功能模块表 (按需启用)

**假期管理模块**:
```sql
hr.leave_types                         -- 假期类型配置
hr.employee_leave_balances             -- 员工假期余额
hr.employee_leave_requests             -- 员工请假申请
```

**员工管理高级功能**:
```sql
hr.employee_appraisals                 -- 员工考核
hr.employee_contracts                  -- 员工合同
hr.employee_compensation_history       -- 员工薪酬历史
hr.employee_payroll_components         -- 员工薪资组件
```

**考勤管理模块**:
```sql
attendance.attendance_rules            -- 考勤规则
attendance.daily_attendance_records    -- 日常考勤记录
```

**薪资计算高级功能**:
```sql
payroll.calculation_rules              -- 计算规则
payroll.calculation_templates          -- 计算模板
payroll.payroll_component_configs      -- 薪资组件配置
```

**报表管理模块**:
```sql
config.batch_report_tasks              -- 批量报表任务
config.batch_report_task_items         -- 批量报表任务项
config.report_calculated_fields        -- 报表计算字段
config.report_template_fields          -- 报表模板字段
config.report_templates                -- 报表模板
config.report_permissions              -- 报表权限
config.report_user_preferences         -- 报表用户偏好
reports.report_field_definitions       -- 报表字段定义
reports.report_views                   -- 报表视图配置
reports.report_view_executions         -- 报表视图执行记录
```

### 🟢 日志和审计表 (正常为空)
```sql
config.report_executions               -- 报表执行记录
config.report_data_source_access_logs  -- 报表数据源访问日志
payroll.calculation_audit_logs         -- 计算审计日志
payroll.monthly_payroll_snapshots      -- 月度薪资快照
```

## 快速检查命令

### 验证空表状态
```sql
-- 检查所有空表
SELECT 
    schemaname || '.' || tablename as full_table_name,
    'SELECT COUNT(*) FROM ' || schemaname || '.' || tablename || ';' as check_sql
FROM pg_tables 
WHERE schemaname IN ('config', 'hr', 'payroll', 'attendance', 'reports')
    AND tablename IN (
        -- Config Schema
        'tax_brackets', 'social_security_rates', 'batch_report_tasks', 
        'batch_report_task_items', 'report_calculated_fields', 'report_executions',
        'report_data_source_access_logs', 'report_permissions', 'report_user_preferences',
        'report_template_fields', 'report_templates',
        -- HR Schema  
        'employee_appraisals', 'employee_compensation_history', 'employee_contracts',
        'employee_leave_balances', 'employee_leave_requests', 'leave_types',
        'employee_payroll_components',
        -- Payroll Schema
        'calculation_rules', 'calculation_templates', 'calculation_audit_logs',
        'payroll_component_configs', 'monthly_payroll_snapshots',
        -- Attendance Schema
        'attendance_rules', 'daily_attendance_records',
        -- Reports Schema
        'report_field_definitions', 'report_views', 'report_view_executions'
    )
ORDER BY schemaname, tablename;
```

### 批量检查空表行数
```sql
-- 一次性检查所有空表的行数
SELECT 'config.tax_brackets' as table_name, COUNT(*) as row_count FROM config.tax_brackets
UNION ALL SELECT 'config.social_security_rates', COUNT(*) FROM config.social_security_rates
UNION ALL SELECT 'config.batch_report_tasks', COUNT(*) FROM config.batch_report_tasks
UNION ALL SELECT 'config.batch_report_task_items', COUNT(*) FROM config.batch_report_task_items
UNION ALL SELECT 'config.report_calculated_fields', COUNT(*) FROM config.report_calculated_fields
UNION ALL SELECT 'config.report_executions', COUNT(*) FROM config.report_executions
UNION ALL SELECT 'config.report_data_source_access_logs', COUNT(*) FROM config.report_data_source_access_logs
UNION ALL SELECT 'config.report_permissions', COUNT(*) FROM config.report_permissions
UNION ALL SELECT 'config.report_user_preferences', COUNT(*) FROM config.report_user_preferences
UNION ALL SELECT 'config.report_template_fields', COUNT(*) FROM config.report_template_fields
UNION ALL SELECT 'config.report_templates', COUNT(*) FROM config.report_templates
UNION ALL SELECT 'hr.employee_appraisals', COUNT(*) FROM hr.employee_appraisals
UNION ALL SELECT 'hr.employee_compensation_history', COUNT(*) FROM hr.employee_compensation_history
UNION ALL SELECT 'hr.employee_contracts', COUNT(*) FROM hr.employee_contracts
UNION ALL SELECT 'hr.employee_leave_balances', COUNT(*) FROM hr.employee_leave_balances
UNION ALL SELECT 'hr.employee_leave_requests', COUNT(*) FROM hr.employee_leave_requests
UNION ALL SELECT 'hr.leave_types', COUNT(*) FROM hr.leave_types
UNION ALL SELECT 'hr.employee_payroll_components', COUNT(*) FROM hr.employee_payroll_components
UNION ALL SELECT 'payroll.calculation_rules', COUNT(*) FROM payroll.calculation_rules
UNION ALL SELECT 'payroll.calculation_templates', COUNT(*) FROM payroll.calculation_templates
UNION ALL SELECT 'payroll.calculation_audit_logs', COUNT(*) FROM payroll.calculation_audit_logs
UNION ALL SELECT 'payroll.payroll_component_configs', COUNT(*) FROM payroll.payroll_component_configs
UNION ALL SELECT 'payroll.monthly_payroll_snapshots', COUNT(*) FROM payroll.monthly_payroll_snapshots
UNION ALL SELECT 'attendance.attendance_rules', COUNT(*) FROM attendance.attendance_rules
UNION ALL SELECT 'attendance.daily_attendance_records', COUNT(*) FROM attendance.daily_attendance_records
UNION ALL SELECT 'reports.report_field_definitions', COUNT(*) FROM reports.report_field_definitions
UNION ALL SELECT 'reports.report_views', COUNT(*) FROM reports.report_views
UNION ALL SELECT 'reports.report_view_executions', COUNT(*) FROM reports.report_view_executions
ORDER BY table_name;
```

---

**总计**: 25 个空表  
**重点关注**: `config.tax_brackets` 和 `config.social_security_rates`  
**建议**: 按功能模块逐步启用相关表 