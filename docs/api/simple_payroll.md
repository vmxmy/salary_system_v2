# 简单薪资系统 API

简单薪资系统 API 是工资信息管理系统的核心功能模块，提供了工资期间管理、薪资生成、审核和报表等功能。

## 基础端点

所有简单薪资系统API都使用前缀：`/v2/simple-payroll`

## 工资期间管理

### 获取工资期间列表

```
GET /v2/simple-payroll/periods
```

**参数：**
- `year` (可选): 年份筛选
- `month` (可选): 月份筛选
- `is_active` (可选): 是否活跃
- `page` (默认: 1): 页码
- `size` (默认: 50, 最大: 200): 每页记录数

**返回：**
- 包含工资期间列表和分页元数据的对象

### 获取工资期间详情

```
GET /v2/simple-payroll/periods/{period_id}
```

**参数：**
- `period_id`: 工资期间ID

**权限：**
- `payroll_period:view`

## 工资运行管理

### 获取工资版本列表

```
GET /v2/simple-payroll/versions
```

**参数：**
- `period_id`: 工资期间ID
- `page` (默认: 1): 页码
- `size` (默认: 20, 最大: 100): 每页记录数

### 获取工资版本详情

```
GET /v2/simple-payroll/versions/{version_id}
```

**参数：**
- `version_id`: 工资版本ID 

## 薪资生成

### 生成工资数据

```
POST /v2/simple-payroll/generate
```

**请求体：**
```json
{
  "period_id": 123,
  "description": "2025年1月工资",
  "force_overwrite": false,
  "options": {
    "include_employees": [1, 2, 3],
    "exclude_employees": [],
    "department_ids": [],
    "personnel_category_ids": []
  }
}
```

**权限：**
- `payroll_run:manage`

### 复制上期工资数据

```
POST /v2/simple-payroll/copy-previous
```

**参数：**
- `target_period_id`: 目标期间ID
- `source_period_id`: 源期间ID
- `description` (可选): 描述
- `force_overwrite` (可选): 是否强制覆盖

**权限：**
- `payroll_run:manage`

### 检查现有数据

```
GET /v2/simple-payroll/check-existing-data/{period_id}
```

**参数：**
- `period_id`: 工资期间ID

**权限：**
- `payroll_run:view`