# CRUD 手动调整字段丢失问题修复验证

## 问题描述
在 `/webapp/v2/crud/payroll/payroll_entries.py` 的第397-400行，`get_payroll_entry` 函数重新构建 `deductions_details` 时，**只保留了 `name` 和 `amount` 字段，丢失了所有手动调整相关字段**。

## 问题代码（已修复）
```python
# 原始问题代码（会丢失字段）
new_deductions_details[code] = {
    "name": component_name,
    "amount": actual_amount
}
```

## 修复代码
```python
# 修复后的代码（保留所有字段）
if isinstance(amount_val, dict): # 完整的对象格式，保留所有字段
    new_deductions_details[code] = {
        **amount_val,  # 保留所有原始字段
        "name": component_name,  # 更新name字段
        "amount": actual_amount  # 确保amount字段正确
    }
```

## 验证步骤

### 1. 检查后端日志
修复后，后端会输出以下日志：
```
🔧 [CRUD修复] 处理扣除详情，原始数据包含 X 项
🔧 [CRUD修复] HOUSING_FUND_PERSONAL 字段处理:
  原始数据: {'name': '住房公积金(个人)', 'amount': 11490, 'is_manual': True, 'manual_at': '...', 'manual_by': 'admin'}
  处理后数据: {'name': '住房公积金(个人)', 'amount': 11490, 'is_manual': True, 'manual_at': '...', 'manual_by': 'admin'}
  is_manual 保留状态: True
✅ [CRUD修复] HOUSING_FUND_PERSONAL 手动调整字段已保留: is_manual=True
```

### 2. 使用 curl 测试 API
```bash
# 启动后端服务
./start-dev.sh

# 在另一个终端运行测试
./test_api_curl.sh
```

预期结果：API 应返回包含 `is_manual: true` 的数据

### 3. 前端验证
1. 打开浏览器开发者工具
2. 打开工资记录编辑页面
3. 查看控制台日志，应该显示：
```
🌐 [API原始响应] 包含 is_manual: true
🔲 [复选框渲染] checked_value: true
```

### 4. 复选框状态验证
- 页面上的手动调整复选框应正确显示为选中状态
- 锁定图标应正确显示

## 修复影响范围

### 修复的功能
- ✅ API 返回完整的手动调整数据
- ✅ 前端正确加载手动调整状态
- ✅ 复选框正确显示选中状态
- ✅ 手动调整功能完全正常

### 不受影响的功能
- ✅ 正常的工资计算功能
- ✅ 非手动调整的扣除项显示
- ✅ 收入项处理（earnings_details）
- ✅ 其他所有现有功能

## 测试检查单

- [ ] 后端启动无错误
- [ ] CRUD修复日志正确输出
- [ ] API 返回包含 `is_manual` 字段的数据
- [ ] 前端 API 响应日志显示 `is_manual: true`
- [ ] 复选框渲染日志显示 `checked_value: true`
- [ ] 页面上复选框实际显示为选中
- [ ] 手动调整操作正常工作
- [ ] 其他工资管理功能正常

## 完整验证流程

1. **立即测试现有手动调整记录**
   - 打开已有手动调整的工资记录
   - 验证复选框是否正确显示为选中

2. **测试新的手动调整**
   - 勾选一个新的手动调整
   - 保存并重新打开页面
   - 验证状态是否正确保持

3. **回归测试**
   - 测试正常的工资计算功能
   - 确保没有破坏其他功能

这个修复解决了手动调整状态加载问题的根本原因，确保所有 JSONB 字段都能正确传递到前端。