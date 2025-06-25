# 手动调整状态加载问题调试日志配置

## 问题描述
用户报告打开页面时，手动调整的复选框控件没有正确加载已保存的状态。控制台日志显示 `is_manual` 始终为 `false`。

## 调试日志添加位置

### 1. 前端 - API响应日志
**文件**: `/frontend/v2/src/pages/Payroll/services/payrollApi.ts`
**位置**: `getPayrollEntryById` 函数

添加了原始API响应日志，包括：
- 完整的响应数据
- 扣除项详情的原始数据
- 五险一金字段的手动调整信息

### 2. 前端 - 数据加载日志
**文件**: `/frontend/v2/src/pages/Payroll/components/PayrollEntryFormModal.tsx`
**位置**: 第一个 `useEffect` 中处理扣除项数据时

添加了数据加载时的原始数据日志：
```javascript
console.log('🎯 [数据加载] 原始扣除项数据:', {
  type: typeof entry.deductions_details,
  isArray: Array.isArray(entry.deductions_details),
  keys: !Array.isArray(entry.deductions_details) ? Object.keys(entry.deductions_details) : null,
  raw_data: entry.deductions_details
});
```

### 3. 前端 - 第二次数据处理修复
**文件**: `/frontend/v2/src/pages/Payroll/components/PayrollEntryFormModal.tsx`
**位置**: 第二个 `useEffect` 中重新过滤数据时

修复了数组格式扣除项的手动调整信息丢失问题：
```javascript
if (Array.isArray(entry.deductions_details)) {
  // 确保数组格式也保留手动调整信息
  deductionsArray = entry.deductions_details.map(item => ({
    name: item.name,
    amount: item.amount || 0,
    description: item.description || payrollConfig.componentDefinitions.find(c => c.code === item.name)?.description || '',
    is_manual: Boolean(item.is_manual),
    manual_at: item.manual_at,
    manual_by: item.manual_by,
    manual_reason: item.manual_reason,
    auto_calculated: item.auto_calculated,
    allowNegative: item.allowNegative
  }));
}
```

### 4. 后端 - 原始数据日志
**文件**: `/webapp/v2/crud/payroll/payroll_entries.py`
**位置**: `get_payroll_entry` 函数

添加了后端原始数据日志：
```python
logger.info(f"🔍 [get_payroll_entry] 获取条目 {entry_id} 的原始数据")
if entry.deductions_details:
    # 检查五险一金的手动调整信息
    social_insurance_codes = [
        'PENSION_PERSONAL_AMOUNT',
        'MEDICAL_PERSONAL_AMOUNT',
        'UNEMPLOYMENT_PERSONAL_AMOUNT',
        'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT',
        'HOUSING_FUND_PERSONAL'
    ]
    
    for code in social_insurance_codes:
        if code in entry.deductions_details:
            field_data = entry.deductions_details[code]
            logger.info(f"💰 [后端原始数据] {code}: {field_data}")
```

## 预期日志输出

1. **后端日志** (Python)：
```
🔍 [get_payroll_entry] 获取条目 3540 的原始数据
💰 [后端原始数据] HOUSING_FUND_PERSONAL: {'amount': 3376, 'is_manual': True, 'manual_at': '2025-01-24T15:30:00', 'manual_by': 'admin', 'manual_reason': '手动调整测试'}
```

2. **前端API响应日志** (浏览器控制台)：
```
🌐 [API原始响应] getPayrollEntryById: {
  entryId: 3540,
  deductions_details_raw: {
    HOUSING_FUND_PERSONAL: {
      amount: 3376,
      is_manual: true,
      manual_at: "2025-01-24T15:30:00",
      manual_by: "admin"
    }
  }
}
```

3. **前端数据加载日志**：
```
🎯 [数据加载] 原始扣除项数据: {
  type: "object",
  isArray: false,
  keys: ["HOUSING_FUND_PERSONAL", ...],
  raw_data: {...}
}
```

## 问题排查步骤

1. 查看后端日志，确认数据库中是否有 `is_manual` 字段
2. 查看前端API响应日志，确认API是否返回了 `is_manual` 字段
3. 查看数据加载日志，确认数据处理过程中是否丢失了 `is_manual` 字段
4. 检查第二次数据处理时是否正确保留了手动调整信息

## 可能的问题原因

1. **数据库存储问题**：`deductions_details` JSONB字段中没有存储 `is_manual` 信息
2. **API序列化问题**：后端API在序列化时丢失了部分字段
3. **前端数据处理问题**：前端在处理数据时没有正确解析手动调整字段
4. **第二次数据处理覆盖**：组件定义加载后的重新过滤覆盖了手动调整信息

## 下一步行动

根据日志输出结果：
- 如果后端日志显示没有 `is_manual` 字段，需要检查手动调整API是否正确保存数据
- 如果前端API响应没有 `is_manual` 字段，需要检查后端序列化逻辑
- 如果数据在前端处理过程中丢失，需要进一步优化数据处理逻辑