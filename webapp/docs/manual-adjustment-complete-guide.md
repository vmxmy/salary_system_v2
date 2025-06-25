# 手动调整功能完整实现指南

## 功能概述
实现了工资记录中五险一金字段的手动调整功能，支持标记、修改和恢复自动计算值。

## 实现细节

### 1. 支持的字段
```typescript
const SOCIAL_INSURANCE_DEDUCTION_CODES = [
  'PENSION_PERSONAL_AMOUNT',           // 养老保险(个人)
  'MEDICAL_PERSONAL_AMOUNT',           // 医疗保险(个人)
  'UNEMPLOYMENT_PERSONAL_AMOUNT',      // 失业保险(个人)
  'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT', // 职业年金(个人)
  'HOUSING_FUND_PERSONAL'              // 住房公积金(个人)
];
```

### 2. 数据结构
手动调整信息存储在 `deductions_details` JSONB 字段中：
```json
{
  "HOUSING_FUND_PERSONAL": {
    "name": "住房公积金个人应缴费额",
    "amount": 3376,
    "is_manual": true,
    "manual_at": "2025-01-24T15:30:00",
    "manual_by": "admin",
    "manual_reason": "手动调整",
    "auto_calculated": 3300
  }
}
```

### 3. 用户界面
- **手调复选框**：五险一金字段旁显示"手调"复选框
- **锁定图标**：手动调整的字段显示蓝色锁定图标
- **工具提示**：鼠标悬停显示调整时间
- **加载状态**：API调用期间禁用复选框

### 4. API集成
- **端点**: `POST /v2/simple-payroll/manual-adjustment/{entry_id}`
- **参数**: Query参数 - `component_code`, `amount`, `reason`
- **响应**: 包含原始金额、调整后金额等信息

### 5. 功能流程

#### 页面加载
1. 加载工资条目数据
2. 解析 `deductions_details` 中的手动调整信息
3. 为有 `is_manual=true` 的字段显示勾选状态和锁定图标
4. 保存 `auto_calculated` 值用于恢复

#### 标记手动调整
1. 用户勾选"手调"复选框
2. 调用API保存当前值为手动调整值
3. 记录调整时间、调整人等信息
4. 显示成功提示

#### 修改金额
1. 用户修改金额输入框
2. 使用防抖（500ms）调用API
3. 后台静默更新，避免频繁提示

#### 取消手动调整
1. 用户取消勾选"手调"复选框
2. 调用API恢复 `auto_calculated` 的值
3. 清除手动调整标记
4. 显示成功提示

### 6. 调试日志
```javascript
// 页面加载时
console.log('🔍 [手动调整] 五险一金状态:', socialInsuranceStatus);

// 加载扣除项时
console.log(`[手动调整] 加载扣除项 ${key}:`, {
  is_manual: itemData.is_manual,
  amount: itemData.amount,
  auto_calculated: itemData.auto_calculated,
  manual_at: itemData.manual_at
});

// 所有扣除项状态
console.log('📋 [手动调整] 所有扣除项状态:', validDeductions);
```

### 7. 注意事项
1. 仅对已保存的工资条目（有entry.id）调用API
2. 新创建的条目仅更新本地状态
3. 页面刷新后手动调整状态会保持
4. 手动调整信息会在表单提交时一并保存

## 使用示例
1. 打开工资记录编辑模态框
2. 找到五险一金字段（如住房公积金）
3. 如果该字段已被手动调整，会显示：
   - "手调"复选框已勾选
   - 字段标签旁有锁定图标
   - 鼠标悬停显示调整时间
4. 可以修改金额或取消手动调整

## 后续优化建议
1. 添加手动调整历史记录
2. 批量手动调整功能
3. 手动调整原因的详细输入界面
4. 手动调整的审批流程