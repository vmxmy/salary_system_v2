# 一键复制功能优化方案

## 当前问题
1. **工资条目**：不覆盖，但创建多版本可能混乱
2. **薪资配置**：直接覆盖，存在数据丢失风险

## 优化建议

### 方案一：智能检查 + 用户确认（推荐）

```python
def copy_previous_payroll_with_check(self, target_period_id, source_period_id, user_id, force_overwrite=False):
    """带检查的复制功能"""
    
    # 1. 检查目标期间是否已有数据
    existing_data = self._check_existing_data(target_period_id)
    
    if existing_data['has_payroll_data'] or existing_data['has_salary_configs']:
        if not force_overwrite:
            return {
                "needs_confirmation": True,
                "existing_data": existing_data,
                "message": "目标期间已有数据，需要确认是否覆盖"
            }
    
    # 2. 根据用户选择执行不同策略
    if force_overwrite:
        # 先删除或归档现有数据，再创建新数据
        pass
    else:
        # 创建新版本（工资条目）+ 智能合并（薪资配置）
        pass
```

### 方案二：配置版本化

```python
def copy_salary_configs_with_versioning(self, source_period_id, target_period_id, user_id):
    """版本化的薪资配置复制"""
    
    for source_config in source_configs:
        existing_config = self._find_existing_config(source_config.employee_id, target_period)
        
        if existing_config:
            # 选项1：创建历史版本
            self._archive_existing_config(existing_config)
            # 选项2：智能合并（只更新null或零值字段）
            self._smart_merge_config(existing_config, source_config)
        else:
            # 创建新配置
            self._create_new_config(source_config, target_period)
```

### 方案三：操作日志 + 回滚机制

```python
def copy_with_audit_trail(self, target_period_id, source_period_id, user_id):
    """带审计日志的复制功能"""
    
    # 1. 记录操作前状态
    operation_log = self._create_operation_log(target_period_id, user_id)
    
    # 2. 执行复制操作
    result = self._execute_copy_operation(...)
    
    # 3. 记录操作后状态
    self._complete_operation_log(operation_log, result)
    
    # 4. 提供回滚接口
    return {
        "operation_id": operation_log.id,
        "rollback_available": True,
        "result": result
    }
```

## 前端UI改进建议

### 1. 复制前确认对话框
```javascript
const copyConfirmDialog = {
  title: "确认复制操作",
  content: `
    检测到目标期间已有以下数据：
    • 工资记录：53条（将创建新版本）
    • 薪资配置：81条（将更新现有配置）
    
    是否继续执行复制操作？
  `,
  buttons: [
    { text: "取消", type: "default" },
    { text: "创建新版本", type: "primary" },
    { text: "覆盖替换", type: "danger" }
  ]
}
```

### 2. 操作历史记录
```javascript
const operationHistory = {
  title: "复制操作历史",
  columns: [
    "操作时间", "操作用户", "源期间", "目标期间", 
    "影响记录数", "操作状态", "回滚"
  ],
  actions: ["查看详情", "回滚操作"]
}
```

## 实施优先级
1. **高优先级**：添加确认对话框，防止意外覆盖
2. **中优先级**：实现薪资配置的智能合并
3. **低优先级**：完整的版本控制和回滚机制 