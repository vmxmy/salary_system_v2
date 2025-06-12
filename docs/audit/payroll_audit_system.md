# 工资审核系统详细说明

## 📋 概述

工资审核系统提供了两个不同级别的审核功能，确保工资数据的准确性、完整性和合规性。系统采用分层审核设计，既保证了日常操作的效率，又提供了深度分析的能力。

## 🔍 审核功能架构

```
工资审核系统
├── 基础审核 (PayrollAuditService)
│   ├── 数据完整性检查
│   ├── 计算一致性检查
│   ├── 最低工资检查
│   ├── 个税计算检查
│   ├── 社保合规检查
│   └── 工资波动检查
└── 高级审核 (AdvancedAuditService)
    ├── 包含所有基础审核
    ├── 薪资合规性深度检查
    ├── 历史数据对比分析
    ├── 统计异常检测
    ├── 薪资结构一致性检查
    └── 个税计算深度验证
```

---

## 🔧 1. 基础审核功能

### 📍 **触发方式**
- **前端按钮**：`"运行审核"`（普通样式按钮）
- **API调用**：`POST /v2/simple-payroll/audit/check/{payroll_run_id}`
- **服务类**：`PayrollAuditService.run_audit_check()`

### 📊 **检查内容详解**

#### **1.1 数据完整性检查 (MISSING_DATA_CHECK)**
- ✅ **应发合计**：必须存在且大于0
- ✅ **扣发合计**：必须存在且不能为负数（可以为0）
- ✅ **实发合计**：必须存在且大于0
- ✅ **员工信息**：检查员工ID是否在员工表中存在

**异常示例**：
```json
{
  "id": "missing_data_123",
  "anomaly_type": "MISSING_DATA_CHECK",
  "severity": "error",
  "message": "应发合计字段缺失",
  "details": "工资条目中应发合计字段为空或无效"
}
```

#### **1.2 计算一致性检查 (CALCULATION_CONSISTENCY_CHECK)**
- ✅ **应发合计一致性**：`gross_pay` = 所有收入项明细之和
- ✅ **扣发合计一致性**：`total_deductions` = 所有扣除项明细之和
- ✅ **实发合计一致性**：`net_pay` = `gross_pay` - `total_deductions`
- ⚠️ **容差范围**：允许1分钱的计算误差

**异常示例**：
```json
{
  "id": "calc_gross_456",
  "anomaly_type": "CALCULATION_CONSISTENCY_CHECK",
  "severity": "error",
  "message": "应发合计与明细不一致",
  "details": "记录值 ¥5000.00，计算值 ¥4950.00，差额 ¥50.00",
  "current_value": 5000.00,
  "expected_value": 4950.00,
  "can_auto_fix": true,
  "suggested_action": "重新计算应发合计字段"
}
```

#### **1.3 最低工资检查 (MINIMUM_WAGE_CHECK)**
- ✅ **基本工资标准**：检查基本工资是否低于最低工资标准
- ✅ **系统参数**：从 `system_parameters` 表获取最低工资配置
- ✅ **默认值**：如果未配置，使用2000元作为默认最低工资
- ✅ **检查范围**：基本工资 + 岗位工资

**异常示例**：
```json
{
  "id": "min_wage_789",
  "anomaly_type": "MINIMUM_WAGE_CHECK",
  "severity": "error",
  "message": "基本工资低于最低标准",
  "details": "当前基本工资 1800 元，低于最低工资标准 2000 元",
  "current_value": 1800.00,
  "expected_value": 2000.00,
  "can_auto_fix": true,
  "suggested_action": "建议将基本工资调整为 2000 元"
}
```

#### **1.4 个税计算检查 (TAX_CALCULATION_CHECK)**
- ✅ **起征点**：5000元个税起征点
- ✅ **税率计算**：简化的累进税率计算
- ✅ **误差容忍**：允许1元的计算误差
- ✅ **税率档次**：
  - 0-3000元：3%
  - 3000-12000元：10%（速算扣除210元）
  - 12000-25000元：20%（速算扣除1410元）
  - 25000元以上：25%（速算扣除2660元）

**计算公式**：
```
应纳税所得额 = 应发工资 - 5000（起征点）- 社保个人部分
应纳税额 = 应纳税所得额 × 税率 - 速算扣除数
```

#### **1.5 社保合规检查 (SOCIAL_SECURITY_CHECK)**
- ✅ **养老保险**：个人缴费不能为负数
- ✅ **医疗保险**：个人缴费不能为负数
- ✅ **失业保险**：个人缴费不能为负数
- ✅ **住房公积金**：个人缴费不能为负数

**检查项目**：
```json
{
  "social_security_items": [
    {"key": "pension_personal", "name": "养老保险"},
    {"key": "medical_personal", "name": "医疗保险"},
    {"key": "unemployment_personal", "name": "失业保险"},
    {"key": "housing_fund_personal", "name": "住房公积金"}
  ]
}
```

#### **1.6 工资波动检查 (SALARY_VARIANCE_CHECK)**
- ✅ **异常工资**：检查工资是否为0或负数
- ✅ **历史对比**：与历史工资数据进行对比（简化版本）
- ✅ **波动阈值**：检测异常的工资变动

### 📈 **审核结果统计**

#### **汇总信息**：
- 📊 **检查条目总数**：`total_entries`
- ❌ **发现异常总数**：`total_anomalies`
- 🔴 **错误数量**：`error_count`（严重问题，必须修复）
- 🟡 **警告数量**：`warning_count`（轻微问题，可忽略）
- ℹ️ **信息数量**：`info_count`（提示信息）
- 🔧 **可自动修复**：`auto_fixable_count`
- 💰 **财务汇总**：总应发、总扣发、总实发

#### **异常分类**：
- **错误级别**：数据缺失、计算错误、负数异常
- **警告级别**：个税计算偏差、工资波动异常
- **信息级别**：提示性信息

### 🔧 **自动修复功能**
- ✅ **计算一致性**：可自动重新计算汇总字段
- ✅ **最低工资**：可自动调整到最低标准
- ✅ **个税计算**：可自动重新计算个税
- ✅ **社保异常**：可自动修正负数为0

### 💾 **数据缓存机制**
- ✅ **审核汇总**：缓存到 `payroll_run_audit_summary` 表
- ✅ **异常详情**：缓存到 `payroll_audit_anomaly` 表
- ✅ **忽略记录**：支持手动忽略特定异常
- ✅ **性能优化**：避免重复计算，提高审核效率

---

## 🔬 2. 高级审核功能

### 📍 **触发方式**
- **前端按钮**：`"高级审核"`（虚线边框按钮）
- **API调用**：`POST /v2/simple-payroll/audit/advanced-check/{payroll_run_id}`
- **服务类**：`AdvancedAuditService.run_advanced_audit_check()`
- **继承关系**：继承自 `PayrollAuditService`，包含所有基础审核功能

### 🎯 **高级检查内容**

#### **2.1 薪资合规性深度检查 (Compliance Check)**

**检查项目**：
- ✅ **最低工资标准检查（更严格）**：
  - 实发工资不低于2320元（地方最低工资标准）
  - 基本工资占比不低于60%
  
- ✅ **工资组成合理性检查**：
  ```json
  {
    "basic_salary_ratio_check": {
      "threshold": 0.6,
      "description": "基本工资占总收入比例应不低于60%",
      "severity": "warning"
    }
  }
  ```

- ✅ **社保缴费基数检查**：
  ```json
  {
    "social_security_base_check": {
      "min_base": 3500,
      "max_base": 28000,
      "personal_rate": 0.105,
      "tolerance": 50
    }
  }
  ```

- ✅ **个税计算合理性检查**：
  - 更精确的个税计算验证
  - 专项扣除项目检查
  - 累计预扣预缴验证

**异常示例**：
```json
{
  "type": "basic_salary_ratio_low",
  "severity": "warning",
  "message": "基本工资占比 45.2% 过低，建议不低于60%",
  "suggested_action": "调整工资结构，提高基本工资占比"
}
```

#### **2.2 历史数据对比分析 (Historical Comparison)**

**对比维度**：
- ✅ **个人工资趋势分析**：
  - 与前3个月工资对比
  - 工资变动幅度检测
  - 异常波动识别

- ✅ **整体工资水平变化**：
  - 部门平均工资变化
  - 总体工资成本变化
  - 人员结构变化影响

**分析结果示例**：
```json
{
  "employee_trends": {
    "employee_code": "EMP001",
    "current_gross": 8000.00,
    "previous_average": 7500.00,
    "variance_percentage": 6.67,
    "trend": "increasing",
    "is_anomaly": false
  },
  "overall_trends": {
    "total_gross_variance": 15000.00,
    "average_salary_change": 2.3,
    "employee_count_change": 2
  }
}
```

#### **2.3 统计异常检测 (Statistical Analysis)**

**检测方法**：
- ✅ **工资分布异常检测**：
  - 使用统计学方法识别异常值
  - Z-score 计算（标准差倍数）
  - 四分位数范围（IQR）检测

- ✅ **部门间工资差异分析**：
  - 同职级工资差异检测
  - 部门内工资分布分析
  - 性别薪酬差异检测

**统计参数**：
```json
{
  "statistical_thresholds": {
    "z_score_threshold": 2.5,
    "iqr_multiplier": 1.5,
    "variance_threshold": 0.3
  }
}
```

**异常检测示例**：
```json
{
  "anomaly_type": "statistical_outlier",
  "employee_code": "EMP123",
  "gross_pay": 25000.00,
  "department_average": 8000.00,
  "z_score": 3.2,
  "severity": "warning",
  "message": "工资水平显著高于部门平均值"
}
```

#### **2.4 薪资结构一致性检查 (Structure Consistency)**

**检查内容**：
- ✅ **同部门员工薪资结构对比**：
  - 薪资组件配置一致性
  - 津贴补贴标准一致性
  - 扣除项目配置一致性

- ✅ **薪资组件完整性检查**：
  - 必要组件缺失检测
  - 异常组件识别
  - 组件金额合理性

**一致性分析示例**：
```json
{
  "department_analysis": {
    "department_name": "技术部",
    "total_employees": 15,
    "component_consistency": {
      "basic_salary": {"consistent": true, "variance": 0.05},
      "performance_bonus": {"consistent": false, "variance": 0.45},
      "transport_allowance": {"consistent": true, "variance": 0.0}
    },
    "missing_components": ["overtime_pay"],
    "unexpected_components": ["special_allowance"]
  }
}
```

#### **2.5 个税计算深度验证 (Deep Tax Validation)**

**验证内容**：
- ✅ **累计预扣预缴检查**：
  - 年度累计应纳税所得额
  - 累计已预扣税额
  - 本期应预扣税额

- ✅ **专项扣除验证**：
  - 子女教育扣除
  - 继续教育扣除
  - 大病医疗扣除
  - 住房贷款利息扣除
  - 住房租金扣除
  - 赡养老人扣除

- ✅ **税率档次验证**：
  - 精确的税率计算
  - 速算扣除数验证
  - 税负合理性检查

**深度验证示例**：
```json
{
  "tax_validation": {
    "employee_code": "EMP456",
    "gross_pay": 12000.00,
    "cumulative_taxable_income": 84000.00,
    "cumulative_tax_paid": 8400.00,
    "current_tax_calculated": 1200.00,
    "current_tax_recorded": 1150.00,
    "variance": 50.00,
    "special_deductions": {
      "children_education": 1000.00,
      "housing_loan": 1000.00,
      "elderly_support": 2000.00
    },
    "validation_result": "minor_variance"
  }
}
```

### 📊 **高级审核结果结构**

```json
{
  "basic_audit": {
    // 包含所有基础审核结果
  },
  "advanced_checks": [
    {
      "type": "compliance",
      "name": "薪资合规性检查",
      "results": {
        "total_checked": 150,
        "issues_found": 12,
        "compliance_issues": [...],
        "summary": {
          "error_count": 3,
          "warning_count": 9
        }
      }
    },
    {
      "type": "historical_comparison",
      "name": "历史数据对比",
      "results": {
        "comparison_period": "2024-01 to 2024-03",
        "employee_trends": [...],
        "overall_trends": {...}
      }
    },
    {
      "type": "statistical_analysis",
      "name": "统计异常检测",
      "results": {
        "outliers_detected": 5,
        "statistical_anomalies": [...],
        "distribution_analysis": {...}
      }
    },
    {
      "type": "structure_consistency",
      "name": "薪资结构一致性",
      "results": {
        "departments_analyzed": 8,
        "consistency_issues": [...],
        "component_analysis": {...}
      }
    },
    {
      "type": "tax_validation",
      "name": "个税计算深度验证",
      "results": {
        "validation_summary": {...},
        "tax_discrepancies": [...],
        "special_deduction_issues": [...]
      }
    }
  ]
}
```

---

## 📊 3. 功能对比表

| 特性 | 基础审核 | 高级审核 |
|------|----------|----------|
| **检查深度** | 基础数据验证 | 深度合规性分析 |
| **执行时间** | 较快（1-3秒） | 较慢（5-15秒） |
| **历史对比** | ❌ 无 | ✅ 前3个月对比 |
| **统计分析** | ❌ 无 | ✅ 异常值检测 |
| **合规检查** | 基础合规 | 深度合规验证 |
| **薪资结构分析** | ❌ 无 | ✅ 部门一致性检查 |
| **个税深度验证** | 简化计算 | ✅ 累计预扣预缴 |
| **专项扣除检查** | ❌ 无 | ✅ 六项专项扣除 |
| **适用场景** | 日常检查 | 重要审核节点 |
| **返回结果** | 基础审核汇总 | 基础+高级检查结果 |
| **自动修复** | ✅ 支持 | ✅ 支持（更智能） |
| **缓存机制** | ✅ 支持 | ✅ 支持 |

---

## 🎯 4. 使用指南

### 📋 **使用场景建议**

#### **基础审核适用场景**：
- ✅ **日常工资计算后**：验证基本计算准确性
- ✅ **数据导入后**：检查导入数据完整性
- ✅ **快速验证**：需要快速获得审核结果
- ✅ **批量处理**：处理大量工资数据时的初步检查

#### **高级审核适用场景**：
- ✅ **月末审核**：月度工资发放前的全面检查
- ✅ **年度审计**：年度薪酬审计和合规检查
- ✅ **政策变更后**：税法或社保政策变更后的验证
- ✅ **异常排查**：发现问题后的深度分析
- ✅ **合规要求**：有严格合规要求的企业

### 🔄 **操作流程建议**

#### **标准审核流程**：
1. **数据准备** → 完成工资计算
2. **基础审核** → 运行基础审核检查
3. **问题处理** → 修复或忽略发现的异常
4. **高级审核** → 运行高级审核（可选）
5. **最终确认** → 确认所有问题已处理
6. **提交审批** → 进入下一工作流步骤

#### **问题处理优先级**：
1. **🔴 错误级别**：必须修复，否则无法继续
2. **🟡 警告级别**：建议修复，可以忽略
3. **ℹ️ 信息级别**：仅供参考，无需处理

---

## 🔧 5. 技术实现细节

### 📁 **文件结构**

```
webapp/v2/
├── routers/
│   └── simple_payroll.py              # 审核API路由
├── services/simple_payroll/
│   ├── payroll_audit_service.py       # 基础审核服务
│   └── advanced_audit_service.py      # 高级审核服务
├── models/
│   └── audit.py                       # 审核相关数据模型
└── pydantic_models/
    └── audit_models.py                # 审核响应模型

frontend/v2/src/
├── pages/SimplePayroll/
│   ├── components/
│   │   └── EnhancedWorkflowGuide.tsx  # 工作流组件
│   └── services/
│       └── simplePayrollApi.ts        # 审核API调用
└── types/
    └── auditTypes.ts                  # 审核类型定义
```

### 🗄️ **数据库表结构**

#### **审核汇总表**：
```sql
CREATE TABLE payroll_run_audit_summary (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER NOT NULL,
    total_entries INTEGER NOT NULL,
    total_anomalies INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    warning_count INTEGER NOT NULL,
    info_count INTEGER NOT NULL,
    auto_fixable_count INTEGER NOT NULL,
    audit_status VARCHAR(50) NOT NULL,
    audit_type VARCHAR(50) NOT NULL,
    audit_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **审核异常表**：
```sql
CREATE TABLE payroll_audit_anomaly (
    id VARCHAR(255) PRIMARY KEY,
    payroll_entry_id INTEGER,
    payroll_run_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    employee_code VARCHAR(50),
    employee_name VARCHAR(100),
    anomaly_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    current_value DECIMAL(15,2),
    expected_value DECIMAL(15,2),
    can_auto_fix BOOLEAN DEFAULT FALSE,
    is_ignored BOOLEAN DEFAULT FALSE,
    ignore_reason TEXT,
    ignored_by_user_id INTEGER,
    ignored_at TIMESTAMP,
    fix_applied BOOLEAN DEFAULT FALSE,
    suggested_action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📚 6. 常见问题与解决方案

### ❓ **常见问题**

#### **Q1: 基础审核和高级审核应该如何选择？**
**A1**: 
- 日常使用建议先运行基础审核
- 发现异常或重要节点时运行高级审核
- 高级审核包含基础审核的所有功能

#### **Q2: 审核发现的异常是否必须全部修复？**
**A2**: 
- 🔴 错误级别：必须修复或合理解释
- 🟡 警告级别：建议修复，可以忽略
- ℹ️ 信息级别：仅供参考

#### **Q3: 自动修复功能是否安全？**
**A3**: 
- 自动修复只处理明确的计算错误
- 不会修改原始业务数据
- 所有修复操作都有审计记录

---

*文档版本：v1.0*  
*最后更新：2024年12月*  
*维护团队：工资系统开发组* 