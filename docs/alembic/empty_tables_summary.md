# 空表分析摘要

## 快速概览

**检查时间**: 2025-01-27  
**总表数**: 60 个  
**空表数**: 25 个 (41.7%)  
**有数据表数**: 35 个 (58.3%)  

## Schema 使用率

| Schema | 使用率 | 状态 |
|--------|--------|------|
| security | 100% | ✅ 完全使用 |
| payroll | 66.7% | ✅ 主要功能使用 |
| hr | 53.8% | 🟡 部分功能使用 |
| config | 54.5% | 🟡 部分功能使用 |
| attendance | 50% | 🟡 基础功能使用 |
| reports | 40% | 🔴 大部分未使用 |

## 关键空表

### 🔴 需要立即关注
- `config.tax_brackets` - 税级配置
- `config.social_security_rates` - 社保费率配置

### 🟡 功能未启用
- **假期管理**: `hr.leave_types`, `hr.employee_leave_balances`
- **合同管理**: `hr.employee_contracts`
- **考勤规则**: `attendance.attendance_rules`
- **报表功能**: 多个报表相关表

### 🟢 正常为空 (日志类)
- `config.report_data_source_access_logs`
- `payroll.calculation_audit_logs`
- `payroll.monthly_payroll_snapshots`

## 建议

1. **立即配置**: 税务和社保费率数据
2. **按需启用**: 假期管理、合同管理等功能
3. **定期检查**: 建立表使用率监控

---
详细分析请参考: [empty_tables_analysis.md](./empty_tables_analysis.md) 