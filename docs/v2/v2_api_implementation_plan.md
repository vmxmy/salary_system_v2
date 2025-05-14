# 基于数据库2.0架构的v2 API实施计划

本文档详细描述了基于数据库2.0架构开发v2 API接口的实施计划。所有API接口均使用`/v2/`前缀，遵循RESTful设计原则。

## 目标

1. 创建一个完全独立的v2 API模块，包含自己的数据库连接、路由、模型和业务逻辑
2. 确保所有API接口遵循RESTful设计原则
3. 实现统一的响应格式和错误处理
4. 复用现有的认证和授权机制

## 实施步骤

### 1. 创建基础目录结构 ✅

```
webapp/
└── v2/
    ├── __init__.py
    ├── database.py
    ├── models/
    │   ├── __init__.py
    │   ├── config.py
    │   ├── hr.py
    │   ├── payroll.py
    │   └── security.py
    ├── pydantic_models/
    │   ├── __init__.py
    │   ├── config.py
    │   ├── hr.py
    │   ├── payroll.py
    │   └── security.py
    ├── routers/
    │   ├── __init__.py
    │   ├── config.py
    │   ├── employees.py
    │   ├── departments.py
    │   ├── job_titles.py
    │   ├── payroll.py
    │   └── lookup.py
    ├── crud/
    │   ├── __init__.py
    │   ├── config.py
    │   ├── hr.py
    │   ├── payroll.py
    │   └── security.py
    └── utils.py
```

### 2. 创建数据库连接模块 ✅

创建`webapp/v2/database.py`文件，实现v2数据库的连接管理。

### 3. 创建ORM模型 ✅

根据数据库架构2.0.json文件，创建对应的SQLAlchemy ORM模型：

1. `webapp/v2/models/config.py`: 配置相关模型 ✅
2. `webapp/v2/models/hr.py`: 人事相关模型 ✅
3. `webapp/v2/models/payroll.py`: 工资相关模型 ✅
4. `webapp/v2/models/security.py`: 安全相关模型 ✅

### 4. 创建Pydantic模型 ✅

为API请求和响应创建Pydantic模型：

1. `webapp/v2/pydantic_models/config.py`: 配置相关Pydantic模型 ✅
2. `webapp/v2/pydantic_models/hr.py`: 人事相关Pydantic模型 ✅
3. `webapp/v2/pydantic_models/payroll.py`: 工资相关Pydantic模型 ✅
4. `webapp/v2/pydantic_models/security.py`: 安全相关Pydantic模型 ✅

### 5. 创建CRUD操作 ✅

实现数据库CRUD操作：

1. `webapp/v2/crud/config.py`: 配置相关CRUD操作 ✅
2. `webapp/v2/crud/hr.py`: 人事相关CRUD操作 ✅
3. `webapp/v2/crud/payroll.py`: 工资相关CRUD操作 ✅
4. `webapp/v2/crud/security.py`: 安全相关CRUD操作 ✅

### 6. 创建API路由 ✅

实现API路由：

1. `webapp/v2/routers/employees.py`: 员工相关API路由 ✅
2. `webapp/v2/routers/departments.py`: 部门相关API路由 ✅
3. `webapp/v2/routers/job_titles.py`: 职位相关API路由 ✅
4. `webapp/v2/routers/lookup.py`: 查找值相关API路由 ✅
5. `webapp/v2/routers/config.py`: 配置相关API路由 ✅
6. `webapp/v2/routers/payroll.py`: 工资相关API路由 ❌

### 7. 集成到主应用 ✅

在`webapp/main.py`中集成v2 API路由。

### 8. 测试API接口 ✅

测试所有API接口的功能和性能。

#### 测试工具

我们创建了一个灵活的API测试脚本，可以通过命令行参数指定要测试的API接口，支持所有v2版本的接口测试。

测试脚本位于 `webapp/v2/scripts/api_tester.py`，使用方法详见 `webapp/v2/scripts/README.md`。

#### 运行测试

可以使用以下命令运行测试：

```bash
# 进入脚本目录
cd webapp/v2/scripts

# 列出所有可用的API端点
python api_tester.py --list-endpoints

# 测试所有API端点
python api_tester.py --test-all

# 测试特定分类的API端点
python api_tester.py --test-all --categories employees,departments

# 测试单个API端点
python api_tester.py --endpoint /v2/employees --method GET
```

也可以使用提供的Shell脚本运行测试并生成报告：

```bash
cd webapp/v2/scripts
./run_api_tests.sh
```

#### 测试报告

测试报告以JSON格式保存在 `api_test_reports` 目录中，包含以下信息：

- 测试时间戳
- 基础URL
- 总测试数
- 通过测试数
- 详细测试结果，包括每个端点的请求和响应信息

## 实施进度

### 已完成

1. ✅ 创建基础目录结构
2. ✅ 创建数据库连接模块
3. ✅ 创建ORM模型
4. ✅ 创建Pydantic模型
5. ✅ 创建CRUD操作
6. ✅ 创建核心API路由（员工、部门、职位、查找值）
7. ✅ 创建配置相关API路由（系统参数）
8. ✅ 集成到主应用

### 待完成

1. ✅ 完成配置相关API路由
   - ✅ 系统参数API路由
   - ✅ 工资组件定义API路由
   - ✅ 税率档位API路由
   - ✅ 社保费率API路由
2. ✅ 创建工资相关API路由
   - ✅ 工资周期API路由
   - ✅ 工资运行批次API路由
   - ✅ 工资明细API路由
3. ✅ 创建安全相关API路由
   - ✅ 用户API路由
   - ✅ 角色API路由
   - ✅ 权限API路由
4. ❌ 测试API接口
5. ❌ 编写API文档
6. ❌ 部署到生产环境

## 使用说明

### 环境变量配置

在`.env`文件中添加以下环境变量：

```
# v2数据库连接字符串
DATABASE_URL_V2=postgresql://user:password@host:port/salary_system_v2
```

如果未设置`DATABASE_URL_V2`，系统将使用`DATABASE_URL`作为备用。

### API端点

所有v2 API端点均使用`/v2/`前缀，例如：

- `/v2/employees`: 获取员工列表
- `/v2/employees/{employee_id}`: 获取单个员工
- `/v2/departments`: 获取部门列表
- `/v2/departments/{department_id}`: 获取单个部门
- `/v2/job-titles`: 获取职位列表
- `/v2/job-titles/{job_title_id}`: 获取单个职位
- `/v2/lookup/types`: 获取查找类型列表
- `/v2/lookup/values`: 获取查找值列表

### 响应格式

所有API响应均使用统一的格式：

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "size": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

或者单个资源：

```json
{
  "data": {...}
}
```

### 错误响应格式

所有错误响应均使用统一的格式：

```json
{
  "error": {
    "code": 400,
    "message": "Bad Request",
    "details": "Detailed error message",
    "errors": [
      {
        "field": "fieldName",
        "message": "Specific error for this field"
      }
    ]
  }
}
```

## 后续工作

1. 完成配置相关API路由
2. 完成工资相关API路由
3. 编写API文档
4. 编写单元测试
5. 进行性能测试
6. 部署到生产环境
