# 工资项目定义（payroll-components）字段说明

> 本文档用于说明 config.payroll_component_definitions 表的结构及各字段业务含义，便于前端开发和后续维护。

## 1. 表结构

| 字段名                    | 类型                | 是否可为空 | 默认值   | 说明（用途）                   |
|---------------------------|---------------------|------------|----------|-------------------------------|
| id                        | bigint              | 否         |          | 主键，自增                     |
| code                      | varchar             | 否         |          | 工资项目编码（唯一）           |
| name                      | varchar             | 否         |          | 工资项目名称                   |
| type                      | varchar             | 否         |          | 项目类型（EARNING/DEDUCTION/EMPLOYER_DEDUCTION/PERSONAL_DEDUCTION/STAT/OTHER等）|
| calculation_method        | varchar             | 是         |          | 计算方法（可选）               |
| calculation_parameters    | jsonb               | 是         |          | 计算参数（可选，JSON）         |
| is_taxable                | boolean             | 否         | true     | 是否计入个税                   |
| is_social_security_base   | boolean             | 否         | false    | 是否为社保基数                 |
| is_housing_fund_base      | boolean             | 否         | false    | 是否为公积金基数               |
| display_order             | integer             | 否         | 0        | 显示顺序                       |
| is_active                 | boolean             | 否         | true     | 是否启用                       |
| effective_date            | date                | 否         |          | 生效日期                       |
| end_date                  | date                | 是         |          | 失效日期（可选）               |

## 2. 字段业务含义

- **code**：工资项目的唯一英文编码，建议全大写+下划线风格，便于前后端数据映射。
- **name**：工资项目中文名称，前端展示用。
- **type**：工资项目类型，常见值：
  - `EARNING`：收入项（如基本工资、绩效奖金等）
  - `PERSONAL_DEDUCTION`：个人扣款项（如个人社保、个税等）
  - `EMPLOYER_DEDUCTION`：单位扣款项（如单位社保等）
  - `DEDUCTION`：通用扣款项
  - `STAT`：统计/辅助项（如基数、比例等，仅用于计算或展示）
  - `OTHER`：其他类型
- **calculation_method/calculation_parameters**：如有自动计算需求，可配置计算方式及参数。
- **is_taxable**：该项是否计入个税计税基数。
- **is_social_security_base**：该项是否计入社保基数。
- **is_housing_fund_base**：该项是否计入公积金基数。
- **display_order**：前端展示顺序，数字越小越靠前。
- **is_active**：是否启用，禁用后不参与工资计算。
- **effective_date/end_date**：工资项目定义的生效/失效时间，支持历史变更。

---

> 如需查看所有已导入工资项目明细，请联系管理员导出 config.payroll_component_definitions 表数据。 