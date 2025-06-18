# 高新区工资信息管理系统 - 后端API文档

## 项目概述

高新区工资信息管理系统是一个面向政府/公共部门组织的综合性企业薪资管理系统。它是一个全栈Web应用程序，具有现代化的React前端和FastAPI后端。

## 技术架构

### 后端技术栈
- **Web框架**: FastAPI (异步/await支持)
- **数据库**: PostgreSQL with SQLAlchemy 2.0+ ORM
- **数据库迁移**: Alembic用于数据库模式管理
- **身份验证**: 基于JWT的角色访问控制 (60+权限)
- **API设计**: RESTful APIs with OpenAPI/Swagger文档

### 架构模式
- **分层架构**: 清晰的关注点分离
- **模块化设计**: 按业务域组织的路由和服务
- **微服务理念**: 松耦合的功能模块
- **领域驱动设计**: 核心业务逻辑封装

## 数据库架构

### 数据库模式结构

系统采用PostgreSQL多模式架构，包含5个主要模式：

#### 1. HR模式 (`hr`)
**目的**: 人力资源和员工管理

**核心表**:
- `employees` - 核心员工信息，包含个人详情、雇佣信息、薪资等级、职位详情
- `departments` - 分层部门结构，支持父子部门关系
- `positions` - 工作职位，支持分层结构（父子职位）
- `personnel_categories` - 人员分类系统（从职位重命名）
- `employee_job_history` - 历史工作分配和职位变更
- `employee_contracts` - 雇佣合同，包含类型和日期
- `employee_compensation_history` - 薪资变更历史
- `employee_payroll_components` - 个人薪资组件分配
- `employee_bank_accounts` - 薪资发放银行信息
- `employee_appraisals` - 绩效考核记录

#### 2. Payroll模式 (`payroll`)
**目的**: 薪资处理和计算

**核心表**:
- `payroll_periods` - 薪资期间定义（月度、双周等）
- `payroll_runs` - 薪资执行记录，包含总计和状态
- `payroll_entries` - 每个员工每期的薪资计算
- `employee_salary_configs` - 员工特定薪资配置
- `payroll_component_configs` - 薪资组件计算规则
- `social_insurance_configs` - 社会保险缴费配置
- `tax_configs` - 税收计算配置
- `calculation_rule_sets` - 薪资计算规则集
- `payroll_run_audit_summary` - 薪资运行审计摘要
- `monthly_payroll_snapshots` - 月度薪资数据历史快照

#### 3. Config模式 (`config`)
**目的**: 系统配置和查找数据

**核心表**:
- `lookup_types` - 查找值的类别定义
- `lookup_values` - 分层查找数据（性别、状态、教育程度等）
- `system_parameters` - 全局系统配置参数
- `payroll_component_definitions` - 收入、扣除、福利的定义
- `tax_brackets` - 按地区划分的税收档次配置
- `social_security_rates` - 社会保险缴费费率
- `report_templates` - 报表模板配置
- `batch_report_tasks` - 批量报表生成任务

#### 4. Security模式 (`security`)
**目的**: 用户身份验证和授权

**核心表**:
- `users` - 系统用户和身份验证凭据
- `roles` - 用户角色定义
- `permissions` - 细粒度权限定义（60+权限）
- `user_roles` - 用户与角色的多对多关系
- `role_permissions` - 角色与权限的多对多关系

#### 5. Reports模式 (`reports`)
**目的**: 高级报表系统

**核心表**:
- `report_type_definitions` - 报表类型配置
- `report_field_definitions` - 报表类型的字段定义
- `report_config_presets` - 预定义报表配置

## API路由系统

### 主要API端点组织

#### 1. 身份验证 (`/api/v2/auth`)
```
POST /auth/token - JWT登录端点
```
- 处理用户身份验证
- 返回访问令牌和用户权限

#### 2. 员工管理 (`/api/v2/employees`)
```
GET    /employees           - 列出员工（分页、搜索、过滤）
GET    /employees/{id}      - 获取员工详情
POST   /employees           - 创建新员工
PUT    /employees/{id}      - 更新员工信息
DELETE /employees/{id}      - 删除员工
POST   /employees/bulk      - 批量操作
```

#### 3. 薪资系统 (`/api/v2/payroll-*`)
```
# 薪资期间
GET    /payroll-periods     - 管理薪资期间
POST   /payroll-periods     - 创建新薪资期间

# 薪资运行
GET    /payroll-runs        - 薪资执行管理
POST   /payroll-runs        - 启动薪资运行

# 薪资条目
GET    /payroll-entries     - 个人员工薪资条目
POST   /payroll-entries     - 创建薪资条目
```

#### 4. 简化薪资系统 (`/api/v2/simple-payroll`)
```
GET    /periods             - 简化薪资期间管理
POST   /generate            - 生成薪资
POST   /audit               - 审核薪资
POST   /reports             - 生成报表
```

#### 5. HR管理 (`/api/v2`)
```
# 部门管理
GET    /departments         - 部门管理
POST   /departments         - 创建部门

# 人员类别
GET    /personnel-categories - 员工分类
POST   /personnel-categories - 创建人员类别

# 职位
GET    /positions           - 工作职位管理
POST   /positions           - 创建职位
```

#### 6. 配置管理 (`/api/v2/config`)
```
# 查找值
GET    /lookup-types        - 系统字典管理
GET    /lookup-values       - 查找值
POST   /lookup-types        - 创建查找类型

# 薪资组件
GET    /payroll-component-types - 薪资字段配置
POST   /payroll-component-types - 创建组件类型

# 系统参数
GET    /system-parameters   - 各种系统配置端点
POST   /system-parameters   - 创建系统参数

# 社会保险费率
GET    /social-security-rates - 税收和保险费率配置
POST   /social-security-rates - 创建费率
```

#### 7. 报表系统 (`/api/v2/reports`)
```
# 数据源
GET    /data-sources        - 报表数据源管理
POST   /data-sources        - 创建数据源

# 模板
GET    /templates           - 报表模板管理
POST   /templates           - 创建模板

# 计算字段
GET    /calculated-fields   - 自定义字段定义
POST   /calculated-fields   - 创建计算字段

# 查询
GET    /queries             - 报表查询管理
POST   /queries             - 创建查询

# 批量报表
POST   /batch-reports       - 批量报表生成
```

#### 8. 视图系统 (`/api/v2/views`)
```
GET    /employee-details    - 高性能员工详情视图
GET    /payroll-summary     - 薪资汇总视图
GET    /period-details      - 期间详情视图
```

## 服务层架构

### 服务层组织结构

#### 基础服务类 (`services/base.py`)
- **BaseService**: 提供通用工具的抽象基础（分页、过滤）
- **BaseViewService**: 基于数据库视图的查询，内置分页和过滤
- **BaseCRUDService**: 基于ORM模型的CRUD操作
- **BusinessService**: 协调视图和CRUD服务以实现完整的业务逻辑

#### 领域特定服务
- **HR服务** (`services/hr.py`): 员工、部门、职位、人员类别管理
- **薪资服务** (`services/payroll.py`): 薪资期间、运行、条目、组件
- **配置服务** (`services/config.py`): 系统配置、查找值、参数
- **简化薪资服务** (`services/simple_payroll/`): 简化薪资流程
- **报表服务** (`services/report_generators/`): 自动化报表生成

### 薪资计算引擎

#### 集成计算引擎 (`payroll_engine/`)

**核心计算器**: `IntegratedPayrollCalculator`
- **多步骤计算过程**: 社会保险 → 税收 → 净薪资
- **基于组件的架构**: 模块化薪资组件
- **错误处理和验证**: 每步全面验证
- **审计跟踪生成**: 完整的计算日志

#### 计算流程
1. **社会保险计算**: 五险一金 + 住房公积金
2. **税收计算**: 累进税制，包含扣除
3. **净薪资计算**: 总薪资减去所有扣除
4. **雇主成本计算**: 包含雇主缴费的总成本

#### 业务规则实现
- **社会保险费率**: 按地区和期间可配置
- **税收档次**: 累进税制，自动更新
- **津贴和扣除**: 灵活的组件定义
- **舍入规则**: 一致的财务舍入政策

## 权限系统

### 权限模型
- **基于角色的访问控制**: 超过60个细粒度权限
- **分层权限结构**: 角色 → 权限映射
- **动态权限检查**: API级别和UI级别权限验证

### 权限类别
1. **员工管理权限**: CRUD操作权限
2. **薪资管理权限**: 薪资生成、审核、修改权限
3. **报表权限**: 报表查看、生成、导出权限
4. **系统配置权限**: 系统参数修改权限
5. **用户管理权限**: 用户和角色管理权限

## 报表生成系统

### 生成器注册模式 (`report_generator_registry.py`)
- **自动检测**: 智能报表类型推断
- **插件架构**: 可扩展的生成器系统
- **模板匹配**: 基于报表需求的自动生成器选择

### 内置报表生成器
- **PayrollSummaryGenerator**: 部门级薪资汇总
- **PayrollDetailGenerator**: 个人员工薪资详情
- **TaxDeclarationGenerator**: 税务合规报表
- **SocialInsuranceGenerator**: 社会保险缴费报表

## 开发和部署

### 开发命令
```bash
# 后端开发
cd webapp/v2
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080

# 数据库迁移
alembic upgrade head
alembic revision --autogenerate -m "description"

# 运行测试
python -m pytest
```

### Docker开发
```bash
cd docker
docker-compose up -d    # 启动所有服务
docker-compose down     # 停止所有服务
```

## API设计原则

### RESTful设计
- 遵循REST约定
- 使用标准HTTP状态码
- 清晰的资源命名

### 响应格式
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功",
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

### 错误处理
```json
{
  "success": false,
  "error": "错误描述",
  "detail": "详细错误信息",
  "code": "ERROR_CODE"
}
```

## 性能优化

### 数据库优化
- **数据库视图**: 高性能的复杂查询
- **适当索引**: 关键字段优化
- **查询优化**: SQL查询性能监控

### API优化
- **分页支持**: 所有列表API支持分页
- **字段选择**: 支持字段过滤以减少数据传输
- **缓存策略**: 适当的查询结果缓存

## 安全特性

### 身份验证
- **JWT令牌**: 无状态身份验证
- **令牌刷新**: 自动令牌续期
- **密码加密**: bcrypt哈希加密

### 数据保护
- **SQL注入防护**: 参数化查询
- **XSS防护**: 输入验证和输出编码
- **CORS配置**: 跨域资源共享控制

## 监控和日志

### 日志系统
- **结构化日志**: JSON格式日志输出
- **日志级别**: DEBUG、INFO、WARNING、ERROR
- **请求跟踪**: 完整的请求-响应日志

### 性能监控
- **SQL查询监控**: 慢查询检测
- **API响应时间**: 端点性能跟踪
- **错误率监控**: 系统健康状况跟踪

---

此文档提供了高新区工资信息管理系统后端API的全面概述。系统采用现代化的架构设计，提供了完整的企业级薪资管理功能，包括员工管理、薪资计算、报表生成、权限控制等核心功能。