# 配置管理 API

配置管理API用于管理系统各种参数、定义和配置项，包括系统参数、薪资组件定义、税率配置等。

## 基础端点

配置相关API使用前缀：`/v2/config`

## 系统参数

### 获取系统参数列表

```
GET /v2/config/system-parameters
```

**参数：**
- `page` (默认: 1): 页码
- `size` (默认: 50): 每页记录数
- `is_active` (可选): 是否活跃

**权限：**
- `config:view`

### 获取系统参数详情

```
GET /v2/config/system-parameters/{parameter_id}
```

**参数：**
- `parameter_id`: 系统参数ID

**权限：**
- `config:view`

### 创建系统参数

```
POST /v2/config/system-parameters
```

**请求体：**
```json
{
  "parameter_name": "tax_year",
  "parameter_value": "2025",
  "description": "当前税收年度",
  "is_active": true
}
```

**权限：**
- `config:manage`

### 更新系统参数

```
PUT /v2/config/system-parameters/{parameter_id}
```

**请求体：**
```json
{
  "parameter_value": "2026",
  "description": "更新后的税收年度",
  "is_active": true
}
```

**权限：**
- `config:manage`

## 薪资组件定义

### 获取薪资组件定义列表

```
GET /v2/config/payroll-component-definitions
```

**参数：**
- `page` (默认: 1): 页码
- `size` (默认: 50, 最大: 100): 每页记录数
- `is_active` (可选): 是否活跃

**权限：**
- `config:view`

### 获取薪资组件定义详情

```
GET /v2/config/payroll-component-definitions/{definition_id}
```

**参数：**
- `definition_id`: 薪资组件定义ID

**权限：**
- `config:view`

### 创建薪资组件定义

```
POST /v2/config/payroll-component-definitions
```

**请求体：**
```json
{
  "component_code": "base_salary",
  "component_name": "基本工资",
  "component_type": "income",
  "is_taxable": true,
  "calculation_order": 10,
  "is_active": true
}
```

**权限：**
- `config:manage`

### 更新薪资组件定义

```
PUT /v2/config/payroll-component-definitions/{definition_id}
```

**请求体：**
```json
{
  "component_name": "基本工资",
  "is_taxable": true,
  "calculation_order": 15,
  "is_active": true
}
```

**权限：**
- `config:manage`

## 税率配置

### 获取税率配置列表

```
GET /v2/config/tax-brackets
```

**参数：**
- `page` (默认: 1): 页码
- `size` (默认: 50): 每页记录数
- `tax_year` (可选): 税收年度
- `tax_type` (可选): 税种类型

**权限：**
- `config:view`

### 获取税率配置详情

```
GET /v2/config/tax-brackets/{bracket_id}
```

**参数：**
- `bracket_id`: 税率配置ID

**权限：**
- `config:view`

### 创建税率配置

```
POST /v2/config/tax-brackets
```

**请求体：**
```json
{
  "tax_year": 2025,
  "tax_type": "personal_income",
  "lower_bound": 0,
  "upper_bound": 5000,
  "rate": 0.03,
  "quick_deduction": 0
}
```

**权限：**
- `config:manage`

## 社保费率

### 获取社保费率列表

```
GET /v2/config/social-security-rates
```

**参数：**
- `page` (默认: 1): 页码
- `size` (默认: 50): 每页记录数
- `effective_year` (可选): 生效年份
- `region_code` (可选): 地区编码

**权限：**
- `config:view`

### 获取社保费率详情

```
GET /v2/config/social-security-rates/{rate_id}
```

**参数：**
- `rate_id`: 社保费率ID

**权限：**
- `config:view`

### 创建社保费率

```
POST /v2/config/social-security-rates
```

**请求体：**
```json
{
  "effective_year": 2025,
  "region_code": "110000",
  "insurance_type": "pension",
  "employee_ratio": 0.08,
  "employer_ratio": 0.16,
  "min_base": 3000,
  "max_base": 30000
}
```

**权限：**
- `config:manage`

## 查询值配置

### 获取查询类型列表

```
GET /v2/config/lookup-types
```

**参数：**
- `page` (默认: 1): 页码
- `size` (默认: 50): 每页记录数

**权限：**
- `config:view`

### 获取查询值列表

```
GET /v2/config/lookup-values
```

**参数：**
- `lookup_type_code` (必填): 查询类型编码
- `page` (默认: 1): 页码
- `size` (默认: 50): 每页记录数

**权限：**
- `config:view`

### 公开查询值列表

```
GET /v2/config/lookup-values-public
```

**参数：**
- `lookup_type_code` (必填): 查询类型编码

**说明：**
该接口为公开接口，无需认证即可访问，主要提供给前端使用。 