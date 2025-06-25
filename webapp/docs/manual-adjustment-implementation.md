# 手动调整功能实现说明

## 概述
已在工资记录编辑模态框中为五险一金字段添加了手动调整开关控件。

## 实现细节

### 1. 后端实现 (已完成)
- **文件**: `/webapp/v2/routers/simple_payroll.py`
  - 添加了 `/manual-adjustment/{entry_id}` API端点
  - 支持手动调整扣除项金额并保留调整历史

- **文件**: `/webapp/v2/payroll_engine/simple_calculator.py`
  - 添加了 `preserve_manual_adjustments` 参数
  - 计算引擎支持保护手动调整的值

### 2. 前端实现 (已完成)
- **文件**: `/frontend/v2/src/pages/Payroll/components/PayrollEntryFormModal.tsx`
  - 添加了手动调整复选框控件
  - 仅在五险一金字段旁显示"手调"复选框
  - 手动调整时显示锁定图标
  - 支持保存和恢复手动调整状态

- **文件**: `/frontend/v2/src/pages/Payroll/types/payrollTypes.ts`
  - 扩展了 `PayrollItemDetail` 接口，添加手动调整相关字段

- **文件**: `/frontend/v2/src/pages/SimplePayroll/services/simplePayrollApi.ts`
  - 添加了 `manuallyAdjustDeduction` API方法

### 3. 支持的五险一金字段
```typescript
const SOCIAL_INSURANCE_DEDUCTION_CODES = [
  'PENSION_PERSONAL_AMOUNT',           // 养老保险(个人)
  'MEDICAL_PERSONAL_AMOUNT',           // 医疗保险(个人)
  'UNEMPLOYMENT_PERSONAL_AMOUNT',      // 失业保险(个人)
  'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT', // 职业年金(个人)
  'HOUSING_FUND_PERSONAL'              // 住房公积金(个人)
];
```

### 4. 数据结构
手动调整信息存储在 JSONB 字段中：
```json
{
  "PENSION_PERSONAL_AMOUNT": {
    "amount": 500.00,
    "is_manual": true,
    "manual_at": "2025-01-24T15:30:00",
    "manual_by": "admin",
    "manual_reason": "特殊情况调整",
    "auto_calculated": 400.00
  }
}
```

### 5. 使用流程
1. 在工资编辑模态框中，五险一金字段旁会显示"手调"复选框
2. 勾选复选框后，该字段标记为手动调整状态
3. 手动修改金额值
4. 保存时，手动调整信息会被保存到数据库
5. 下次计算时，手动调整的值会被保留（如果 preserve_manual_adjustments=true）

## 后续优化建议
1. 添加手动调整历史记录查看功能
2. 批量手动调整功能
3. 手动调整审批流程
4. 手动调整原因的详细记录界面