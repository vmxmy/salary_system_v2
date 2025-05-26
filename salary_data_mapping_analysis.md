# 工资数据映射分析与批量导入实现

## 1. 数据源分析

### 原始数据结构
基于提供的工资数据样例：
```json
{
  "序号": "1",
  "人员编号": "00003",
  "人员姓名": "汪琳",
  "身份证": "510103197108310040",
  "部门": "",
  "人员身份": "已登记公务员",
  "人员职级": "县处级正职",
  "工资统发": "是",
  "财政供养": "是",
  "应发工资": "20724",
  "实发工资": "14061.13",
  "扣发合计": "6662.87",
  "职务/技术等级 工资": "2410",
  "级别/岗位级别 工资": "3620",
  "基础绩效奖": "6920",
  "93年工改保留补贴": "116",
  "独生子女父母奖励金": "",
  "公务员规范性津贴补贴": "6618",
  "公务交通补贴": "1040",
  "岗位工资": "",
  "薪级工资": "",
  "见习试用期工资": "",
  "月基础绩效": "",
  "月奖励绩效": "",
  "岗位职务补贴": "",
  "信访工作人员岗位津贴": "",
  "补扣社保": "",
  "一次性补扣发": "",
  "绩效奖金补扣发": "",
  "奖励绩效补扣发": "",
  "个人缴养老保险费": "1599.92",
  "个人缴医疗保险费": "399.98",
  "个人缴职业年金": "799.96",
  "个人缴失业保险费": "",
  "个人缴住房公积金": "3318",
  "个人所得税": "545.01"
}
```

## 2. 字段映射规则

### 2.1 员工匹配字段
- **人员编号** → `employee_code` (可选字段)
- **人员姓名** → `employee_full_name` → 拆分为:
  - `last_name`: 第一个字符（姓）
  - `first_name`: 剩余字符（名）
- **身份证** → `id_number` (用于员工匹配)

### 2.2 忽略字段（非工资相关）
- 序号
- 部门
- 人员身份
- 人员职级
- 工资统发
- 财政供养

### 2.3 计算字段
- **应发工资** → `gross_pay`
- **实发工资** → `net_pay`
- **扣发合计** → `total_deductions`

### 2.4 收入项映射
- **职务/技术等级 工资** → `earnings_details.POSITION_SALARY.amount`
- **级别/岗位级别 工资** → `earnings_details.GRADE_SALARY.amount`
- **基础绩效奖** → `earnings_details.BASIC_PERFORMANCE_BONUS.amount`
- **93年工改保留补贴** → `earnings_details.REFORM_1993_SUBSIDY.amount`
- **独生子女父母奖励金** → `earnings_details.SINGLE_CHILD_ALLOWANCE.amount`
- **公务员规范性津贴补贴** → `earnings_details.CIVIL_SERVANT_ALLOWANCE.amount`
- **公务交通补贴** → `earnings_details.TRANSPORTATION_ALLOWANCE.amount`

### 2.5 扣除项映射
- **个人缴养老保险费** → `deductions_details.PENSION_PERSONAL.amount`
- **个人缴医疗保险费** → `deductions_details.MEDICAL_PERSONAL.amount`
- **个人缴职业年金** → `deductions_details.ANNUITY_PERSONAL.amount`
- **个人缴失业保险费** → `deductions_details.UNEMPLOYMENT_PERSONAL.amount`
- **个人缴住房公积金** → `deductions_details.HOUSING_FUND_PERSONAL.amount`
- **个人所得税** → `deductions_details.PERSONAL_INCOME_TAX.amount`

## 3. 实现方案

### 3.1 前端实现
1. **字段映射处理**：
   - 动态字段映射规则，避免硬编码
   - 支持中文姓名自动拆分
   - 自动计算汇总字段

2. **数据验证**：
   - 验证员工匹配信息完整性
   - 验证数值字段有效性
   - 验证计算字段一致性

3. **批量导入页面优化**：
   - 支持JSON和表格数据输入
   - 实时数据预览和验证
   - 错误信息详细展示

### 3.2 后端实现
1. **员工匹配逻辑**：
   - 优先使用employee_id匹配
   - 其次使用姓名+身份证号匹配
   - 新增`get_employee_by_name_and_id_number`函数

2. **批量导入API**：
   - 支持覆盖模式
   - 返回详细的成功/失败信息
   - 自动创建或关联PayrollRun

3. **数据模型扩展**：
   - PayrollEntryCreate添加employee_info字段
   - 支持灵活的员工匹配方式

## 4. 使用示例

### 4.1 API请求格式
```json
{
  "payroll_period_id": 1,
  "overwrite_mode": false,
  "entries": [
    {
      "employee_id": 0,
      "employee_info": {
        "last_name": "汪",
        "first_name": "琳",
        "id_number": "510103197108310040"
      },
      "gross_pay": 20724,
      "total_deductions": 6662.87,
      "net_pay": 14061.13,
      "earnings_details": {
        "POSITION_SALARY": { "amount": 2410 },
        "GRADE_SALARY": { "amount": 3620 },
        "BASIC_PERFORMANCE_BONUS": { "amount": 6920 }
      },
      "deductions_details": {
        "PENSION_PERSONAL": { "amount": 1599.92 },
        "MEDICAL_PERSONAL": { "amount": 399.98 }
      }
    }
  ]
}
```

### 4.2 响应格式
```json
{
  "success_count": 1,
  "error_count": 0,
  "errors": [],
  "created_entries": [
    {
      "id": 123,
      "employee_id": 456,
      "employee_name": "汪琳",
      "gross_pay": 20724,
      "net_pay": 14061.13
    }
  ]
}
```

## 5. 注意事项

1. **员工编号非必填**：系统支持通过姓名+身份证号匹配员工
2. **姓名拆分规则**：中文姓名第一个字符为姓，其余为名
3. **字段忽略**：非工资相关字段（如部门、人员身份等）会被忽略
4. **自动计算**：如果原始数据中的汇总字段为空，系统会自动计算
5. **动态组件**：收入和扣除项基于系统配置的薪资组件动态生成

## 6. 优势

1. **灵活性**：支持多种员工匹配方式
2. **容错性**：自动处理字段缺失和计算
3. **可扩展性**：基于动态组件定义，易于添加新的工资项
4. **用户友好**：减少必填字段，提高导入成功率
