# 手动调整问题逐步调试指南

## 当前状况
- 后端日志显示：`✅ [手动调整] 保存后 is_manual 状态: NOT_FOUND`
- 说明数据在数据库保存时就丢失了

## 逐步调试步骤

### 步骤1：重启后端并开始调试
```bash
cd /Users/xumingyang/app/高新区工资信息管理/salary_system/webapp
./start-dev.sh
```

### 步骤2：测试手动调整API

1. **打开浏览器开发者工具**
2. **进入工资记录编辑页面**（还没有手动调整的记录）
3. **查看后端日志中的原始数据**：
   ```
   🔍 [手动调整] 原始扣除详情类型: <class 'dict'>
   🔍 [手动调整] 原始扣除详情内容: {...}
   🔍 [手动调整] 组件 HOUSING_FUND_PERSONAL 原始数据: {...}
   ```

4. **勾选住房公积金的手动调整复选框**
5. **查看后端日志**：
   ```
   💾 [手动调整] 准备保存到数据库: entry_id=3471
   💾 [手动调整] 扣除项 HOUSING_FUND_PERSONAL 更新后数据: {...}
   ✅ [手动调整] 数据库保存后验证: HOUSING_FUND_PERSONAL = {...}
   ✅ [手动调整] 保存后 is_manual 状态: ???
   ```

### 步骤3：分析问题

#### 如果看到 `is_manual 状态: NOT_FOUND`
说明问题在于：
1. **SQLAlchemy的JSONB保存有问题**
2. **数据库的JSONB字段有约束或触发器**
3. **CustomJSONB类型转换有问题**

#### 如果看到 `is_manual 状态: True`
说明保存是正确的，问题在于：
1. **CRUD读取时的数据处理**
2. **API序列化时的字段丢失**

### 步骤4：数据库直接验证

无论上述结果如何，都要验证数据库中的实际存储：

```sql
-- 在数据库中直接查询
SELECT id, employee_id, deductions_details 
FROM payroll.payroll_entries 
WHERE id = 3471;

-- 专门查看住房公积金字段
SELECT 
    id, 
    deductions_details->'HOUSING_FUND_PERSONAL' as housing_fund_data,
    deductions_details->'HOUSING_FUND_PERSONAL'->>'is_manual' as is_manual_value
FROM payroll.payroll_entries 
WHERE id = 3471;
```

### 步骤5：根据结果采取行动

#### 情况A：数据库中没有 is_manual 字段
**原因**：保存时数据丢失
**解决**：检查CustomJSONB类型转换逻辑

#### 情况B：数据库中有 is_manual: true
**原因**：CRUD读取或API序列化问题
**解决**：检查get_payroll_entry函数的数据处理

#### 情况C：数据库中有 is_manual: false
**原因**：保存逻辑有问题，True被转换为False
**解决**：检查手动调整API的数据构造逻辑

## 立即行动

请重启后端，按照上述步骤进行测试，并报告：

1. **后端日志中看到的原始数据内容**
2. **保存后验证的 is_manual 状态**
3. **数据库直接查询的结果**

这样我们就能精确定位问题出现在哪个环节。