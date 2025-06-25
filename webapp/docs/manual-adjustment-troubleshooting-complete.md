# 手动调整功能完整排查指南

## 问题描述
用户反馈：打开页面时，手动调整的复选框控件显示 `is_manual` 始终为 `false`，但手动调整后能正确变为 `true`。

## 完整排查流程

### 阶段1：验证数据库存储是否正确

#### 1.1 使用数据库验证工具
```bash
# 进入webapp目录
cd /Users/xumingyang/app/高新区工资信息管理/salary_system/webapp

# 查找所有包含手动调整的条目
python v2/scripts/verify_manual_adjustment_data.py --list-all

# 验证具体条目（假设找到条目ID为3540）
python v2/scripts/verify_manual_adjustment_data.py --entry-id 3540
```

#### 1.2 检查后端日志
在进行手动调整操作时，后端会输出以下日志：
```
💾 [手动调整] 准备保存到数据库: entry_id=3540
💾 [手动调整] 扣除项 HOUSING_FUND_PERSONAL 更新后数据: {'name': 'HOUSING_FUND_PERSONAL', 'amount': 3376.0, 'is_manual': True, 'manual_at': '2025-01-24T...', 'manual_by': 'admin', 'manual_reason': '手动调整', 'auto_calculated': 3300}
✅ [手动调整] 数据库保存后验证: HOUSING_FUND_PERSONAL = {'name': 'HOUSING_FUND_PERSONAL', 'amount': 3376.0, 'is_manual': True, ...}
✅ [手动调整] 保存后 is_manual 状态: True
```

**预期结果**: 如果数据库保存正确，应该看到 `is_manual: True`

### 阶段2：验证API数据读取是否正确

#### 2.1 检查数据获取日志
当打开工资记录编辑页面时，后端会输出：
```
🔍 [get_payroll_entry] 获取条目 3540 的原始数据
💰 [后端原始数据] HOUSING_FUND_PERSONAL: {'amount': 3376, 'is_manual': True, 'manual_at': '2025-01-24T...', 'manual_by': 'admin', 'manual_reason': '手动调整测试'}
```

#### 2.2 检查API响应日志
前端浏览器控制台会显示：
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

**预期结果**: API响应应包含 `is_manual: true`

### 阶段3：验证前端数据解析是否正确

#### 3.1 检查原始数据加载
浏览器控制台会显示：
```
🎯 [数据加载] 原始扣除项数据: {
  type: "object",
  isArray: false,
  keys: ["HOUSING_FUND_PERSONAL", ...],
  raw_data: {
    HOUSING_FUND_PERSONAL: {
      amount: 3376,
      is_manual: true,
      manual_at: "2025-01-24T15:30:00"
    }
  }
}
```

#### 3.2 检查数据处理过程
```
[手动调整] 加载扣除项 HOUSING_FUND_PERSONAL: {
  raw_value: {...},
  is_manual_raw: true,
  is_manual_type: "boolean",
  is_manual_converted: true,
  amount: 3376,
  manual_at: "2025-01-24T15:30:00"
}
```

#### 3.3 检查第二次数据处理
```
🔄 [第二次处理] 数组格式扣除项: [
  {
    name: "HOUSING_FUND_PERSONAL",
    is_manual: true,
    amount: 3376
  }
]
```

#### 3.4 检查复选框渲染状态
```
🔲 [复选框渲染] 住房公积金(个人): {
  index: 4,
  is_manual: true,
  is_manual_type: "boolean",
  checked_value: true,
  amount: 3376,
  manual_at: "2025-01-24T15:30:00"
}
```

**预期结果**: 所有环节都应该显示 `is_manual: true`

### 阶段4：验证复选框控件状态

#### 4.1 检查控件渲染
在浏览器中打开开发者工具，查找住房公积金字段的复选框：
```html
<input type="checkbox" checked="true" />
```

#### 4.2 验证手动调整操作
进行手动调整时，控制台应显示：
```
📤 [手动调整] 发送请求: {
  entry_id: 3540,
  component_code: "HOUSING_FUND_PERSONAL",
  amount: 3376,
  current_is_manual: true,
  timestamp: "2025-01-24T..."
}

📥 [手动调整] API响应完整数据: {
  status: "success",
  data: {
    is_manual: true,
    manual_at: "2025-01-24T...",
    manual_by: "admin"
  }
}
```

## 常见问题及解决方案

### 问题1：数据库保存失败
**症状**: 后端日志显示保存前有数据，保存后 `is_manual` 为 `false` 或 `undefined`
**解决**: 检查数据库JSONB字段权限和数据格式

### 问题2：API响应缺少字段
**症状**: 前端API响应中没有 `is_manual` 字段
**解决**: 检查后端序列化是否正确返回所有JSONB字段

### 问题3：第二次数据处理覆盖
**症状**: 第一次处理有 `is_manual: true`，第二次处理变为 `false`
**解决**: 已修复数组格式数据处理逻辑，确保保留手动调整信息

### 问题4：类型转换问题
**症状**: `is_manual` 值为字符串而非布尔值
**解决**: 使用 `Boolean()` 函数确保类型转换正确

## 完整验证检查单

- [ ] 数据库验证工具显示 `is_manual: true`
- [ ] 后端获取数据日志显示 `is_manual: true`
- [ ] 前端API响应包含 `is_manual: true`
- [ ] 第一次数据处理保留 `is_manual: true`
- [ ] 第二次数据处理保留 `is_manual: true`
- [ ] 复选框渲染日志显示 `checked_value: true`
- [ ] 页面上复选框实际显示为选中状态
- [ ] 手动调整操作正常工作
- [ ] 页面刷新后状态保持

## 日志位置总结

1. **后端日志**: 在webapp目录运行时的终端输出
2. **前端日志**: 浏览器开发者工具 > Console 选项卡
3. **数据库验证**: 运行验证脚本的输出
4. **API网络**: 浏览器开发者工具 > Network 选项卡

通过以上完整的排查流程，应该能够准确定位手动调整状态加载问题的根本原因。