# 手动调整功能API集成实现

## 功能概述
已完成前端手动调整功能与后端API的完整集成，实现了五险一金字段的手动调整控制。

## 实现细节

### 1. API集成点
- **勾选"手调"复选框时**：立即调用 `/api/v2/simple-payroll/manual-adjustment/{entry_id}` API
- **修改手动调整金额时**：使用防抖（500ms）调用API更新金额
- **取消手动调整时**：调用API恢复自动计算值

### 2. 前端状态管理
```typescript
// 添加的状态
const [adjustingItems, setAdjustingItems] = useState<Set<string>>(new Set()); // 正在调整的项目

// 防抖的API调用
const debouncedManualAdjustment = useRef(
  debounce(async (entryId, componentCode, amount, reason) => {
    // API调用逻辑
  }, 500)
).current;
```

### 3. 用户交互流程

#### 标记为手动调整
1. 用户勾选"手调"复选框
2. 系统调用API标记该项为手动调整
3. 保存当前值为 `auto_calculated`
4. 显示成功提示"已标记为手动调整"
5. 在字段标签旁显示锁定图标

#### 修改手动调整金额
1. 用户修改金额输入框的值
2. 系统使用防抖（500ms）调用API
3. 避免频繁API调用
4. 后台静默更新，不显示提示

#### 取消手动调整
1. 用户取消勾选"手调"复选框
2. 系统调用API恢复自动计算值
3. 金额恢复为 `auto_calculated` 的值
4. 显示成功提示"已恢复为自动计算值"
5. 移除锁定图标

### 4. 视觉反馈
- **锁定图标**：手动调整的字段在标签旁显示蓝色锁定图标
- **工具提示**：鼠标悬停显示"手动调整于 [时间]"
- **复选框禁用**：API调用期间禁用复选框，防止重复点击
- **加载状态**：使用 `adjustingItems` Set 管理各项的加载状态

### 5. 错误处理
- API调用失败时显示错误提示
- 保持本地状态不变，允许用户重试
- 所有错误信息记录到控制台

### 6. 性能优化
- 使用防抖减少金额修改时的API调用
- 使用 Set 管理加载状态，提高查找效率
- 仅对五险一金字段显示手动调整控件

## API响应格式
```json
{
  "success": true,
  "data": {
    "entry_id": 12345,
    "component_code": "PENSION_PERSONAL_AMOUNT",
    "previous_amount": 400.00,
    "new_amount": 500.00,
    "is_manual": true,
    "manual_at": "2025-01-24T15:30:00",
    "manual_by": "admin"
  }
}
```

## 注意事项
1. 仅对已保存的工资条目（有entry.id）调用API
2. 新创建的条目仅更新本地状态
3. 防抖延迟设置为500ms，可根据需要调整
4. 手动调整信息会在表单提交时一并保存到数据库