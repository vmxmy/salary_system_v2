# 手动调整功能问题排查

## 问题描述
API调用成功但前端界面状态未更新

## 已修复的问题

### 1. API参数格式错误
- **问题**: 422 Unprocessable Entity 错误
- **原因**: 前端将参数作为请求体发送，但后端期望Query参数
- **修复**: 修改API调用为 `post(url, null, { params: {...} })`

### 2. 响应数据处理错误
- **问题**: API返回200但界面未更新
- **原因**: 前端检查 `response.success` 但API返回的是 `response.data`
- **修复**: 将条件判断改为 `if (response.data)`

### 3. 字段映射问题
- **API返回字段**:
  - `original_amount` - 原始金额
  - `adjusted_amount` - 调整后金额
  - `new_total_deductions` - 新的扣除总额
  - `new_net_pay` - 新的实发工资

- **前端期望字段**:
  - `auto_calculated` - 自动计算值（映射自 `original_amount`）
  - `is_manual` - 手动调整标记（前端自行设置）
  - `manual_at` - 调整时间（前端生成）

## 调试步骤

1. **检查控制台日志**
   ```
   [手动调整] 加载扣除项 HOUSING_FUND_PERSONAL: {
     is_manual: true,
     amount: 3376,
     auto_calculated: 3376,
     manual_at: "2025-01-24T15:30:00"
   }
   ```

2. **验证API响应**
   - 检查Network标签页中的API响应
   - 确认返回的data结构

3. **确认状态更新**
   - 复选框应该被勾选
   - 字段标签旁应显示锁定图标
   - 鼠标悬停应显示调整时间

## 注意事项
1. 新创建的条目（无entry.id）只更新本地状态
2. 手动调整信息存储在JSONB字段中
3. 页面刷新后应保持手动调整状态