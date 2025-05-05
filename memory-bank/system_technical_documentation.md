# 高新区工资信息管理系统 - 技术文档

*最后更新日期: 2024-06-07*

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [前端功能](#3-前端功能)
4. [后端功能](#4-后端功能)
5. [数据库表结构](#5-数据库表结构)
6. [API接口](#6-api接口)
7. [数据流程](#7-数据流程)
8. [安全与权限](#8-安全与权限)
9. [部署与维护](#9-部署与维护)
10. [待开发功能](#10-待开发功能)

## 1. 项目概述

### 1.1 项目目标

高新区工资信息管理系统旨在建立一个集中化的平台，用于管理和报告来自多个 Excel 文件的工资记录。系统需要提供结构化的数据存储、数据转换能力、商业智能(BI)分析以及一个具有角色权限控制的 Web 界面，供不同用户（财务、部门主管、员工）访问其授权范围内的工资报告。

### 1.2 解决的问题

目前通过多个 Excel 文件管理人事和工资数据的方式复杂且容易出错，特别是考虑到不同编制类型（如专项、专技、区聘等）的员工有不同的薪资结构。系统需要解决以下问题：

- 数据碎片化和一致性问题
- 手动处理多Excel文件的效率低下
- 不同编制类型员工薪资结构差异管理
- 报表生成过程繁琐
- 缺乏统一的数据访问控制机制

### 1.3 主要功能概述

- 从Excel导入工资数据并标准化
- 对不同编制类型员工薪资进行差异化计算
- 员工信息管理
- 部门和单位管理
- 工资数据浏览和报表
- 字段映射配置
- 基于角色的访问控制

## 2. 系统架构

### 2.1 整体架构

系统采用现代化的三层架构设计：

1. **数据层**：PostgreSQL数据库存储所有数据
2. **应用层**：Python FastAPI后端提供RESTful API
3. **表示层**：React前端提供用户界面

同时，系统还包含以下关键组件：

- **ETL流程**：Python脚本和dbt转换处理数据导入和转换
- **BI分析**：Metabase提供报表和分析功能
- **认证授权**：JWT实现的认证和基于角色的访问控制

### 2.2 技术栈详情

#### 2.2.1 前端技术

- **框架**：React (使用Vite构建工具)
- **组件库**：Ant Design
- **状态管理**：React Context API
- **HTTP客户端**：Axios
- **国际化**：i18next
- **类型系统**：TypeScript
- **路由**：React Router

#### 2.2.2 后端技术

- **框架**：FastAPI
- **ORM**：SQLAlchemy
- **数据库迁移**：Alembic
- **认证**：JWT (使用python-jose)
- **密码哈希**：Passlib (bcrypt)
- **数据处理**：Pandas, Openpyxl
- **数据验证**：Pydantic

#### 2.2.3 数据库与ETL

- **数据库**：PostgreSQL (v14+)
- **ETL**: Python Scripts (for preprocessing)
- **数据转换**：dbt Core
- **BI工具**：Jimu Reports
- **Excel处理**：Python (pandas, openpyxl)

#### 2.2.4 部署与容器化

- **容器化**: Docker
- **编排**: Docker Compose
- **镜像仓库**: Aliyun Container Registry (ACR)
- **Web服务器 (前端)**: Nginx (within Docker)
- **构建环境 (前端)**: Node.js (v18+)

### 2.3 系统组件关系图

```
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Excel文件    │───>│  Python脚本   │───>│ 标准化CSV文件  │
└───────────────┘    └───────────────┘    └───────┬───────┘
                                                  │
                                                  ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Jimu Reports  │<───│ dbt计算视图   │<───│ 暂存表/源表   │
└───────────────┘    └───────────────┘    └───────┬───────┘
       ▲                                          │
       │                                          │
┌──────┴────────┐    ┌───────────────┐    ┌───────────────┐
│  Web前端(React) │<───│ FastAPI后端   │<───│ 核心表/维度表 │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 2.4 部署架构

系统可以部署在单一服务器上，也可以采用更复杂的微服务架构：

- **单服务器部署**：Web服务器(Nginx) + FastAPI(Uvicorn) + PostgreSQL + dbt + Jimu Reports
- **容器化部署**：可使用Docker/Docker Compose部署各组件 (推荐，见9.2.1)

## 3. 前端功能

### 3.1 整体结构

前端采用React+TypeScript技术栈，使用Vite作为构建工具，主要文件结构如下：

```
salary_system/frontend/salary-viewer/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── App.tsx          # 主应用组件，路由和布局
│   ├── main.tsx         # 入口点
│   ├── assets/          # 静态资源
│   ├── components/      # React组件
│   ├── context/         # React上下文，如AuthContext
│   ├── hooks/           # 自定义钩子
│   ├── locales/         # 国际化语言文件
│   ├── pages/           # 页面组件
│   └── services/        # API服务调用
```

### 3.2 主要页面和组件

#### 3.2.1 认证相关

- **LoginPage.tsx**：用户登录页面，包含用户名和密码输入表单
- **RegisterPage.tsx**：用户注册页面，新用户创建账号
- **UserProfilePage.tsx**：用户个人中心，显示用户信息、修改邮箱和密码

#### 3.2.2 数据管理模块

- **SalaryDataViewer.tsx**：工资数据查看组件，表格显示工资记录，支持分页和过滤
- **EmployeeManager.tsx**：员工管理组件，用于创建、编辑、删除员工信息
- **DepartmentManager.tsx**：部门管理组件，管理部门信息
- **FileConverter.tsx**：Excel文件转换器组件，用于上传Excel并转换为CSV，可选导入数据库

#### 3.2.3 配置与报表

- **MappingConfigurator.tsx**：字段映射配置组件，管理字段映射信息
- **UserManager.tsx**：(新增) 用户账号管理组件。提供以下功能：
    - 使用 Ant Design 表格展示用户列表（ID, 用户名, 邮箱, 角色, 状态）。
    - 支持分页、按列排序、按角色和状态筛选。
    - 提供 "添加用户" 按钮，弹出模态框。
    - 提供行内 "编辑" 按钮，弹出模态框预填用户信息。
    - 提供行内 "删除" 按钮，通过 `Popconfirm` 弹窗进行二次确认。
    - 添加用户模态框包含用户名、邮箱、密码、确认密码、角色选择、状态开关等字段及校验。
    - 编辑用户模态框包含邮箱、角色选择、状态开关等字段及校验（用户名不可编辑）。
    - 集成后端 API 进行用户数据的增删改查。
- **MonthlySalaryReport.tsx**：月度薪资报表组件，展示报表数据
- **JimuReportViewer.tsx**：Jimu报表查看组件，通过iframe嵌入Jimu报表
- **ReportLinkManager.tsx**：(管理员) 报表链接管理组件，用于创建、编辑、删除和管理在侧边栏显示的报表链接。
- **ReportViewer.tsx**：通用报表查看器组件，根据传入的 `reportId` 加载并显示相应的报表（目前可能是嵌入 Metabase 或 Jimu 的 iframe，或未来其他报表类型）。

#### 3.2.4 通用组件

- **ProtectedRoute.tsx**：保护路由组件，确保需要认证的路由只对已登录用户可用
- **App.tsx**：主应用组件，包含全局布局和路由定义

### 3.3 状态管理与上下文

- **AuthContext.tsx**：认证上下文，管理用户登录状态、JWT令牌存储和认证相关操作
- **useAuth.tsx**：认证钩子，简化在组件中使用认证上下文

### 3.4 路由结构

```
/ (根路由)
├── /login                     # 登录页面
├── /register                  # 注册页面
├── /viewer                    # 工资数据查看
├── /data-import/converter     # Excel转换器
├── /admin/employees           # 员工管理
├── /admin/departments         # 部门管理
├── /config/mappings           # 字段映射配置
├── /reports/monthly-salary    # 月度薪资报表
├── /reports/jimu              # Jimu报表集成页面
+├── /report-links              # (管理员) 报表链接管理页面
+├── /reports/:reportId         # 动态报表查看页面
+├── /config/users              # 用户账号管理
└── /profile                   # 用户个人中心
```

### 3.5 国际化支持

系统支持中文和英文两种语言，使用i18next实现国际化：

- **i18n.ts**：国际化配置和初始化
- **locales/en/translation.json**：英文翻译文件
- **locales/zh/translation.json**：中文翻译文件

### 3.6 API服务调用

- **api.ts**：封装Axios API客户端，处理API请求、错误处理和认证Token管理
- **reportLinksApi.ts**：封装与后端报表链接管理API交互的函数。

### 3.7 用户界面特点

- 使用Ant Design组件库，提供现代化和统一的UI体验
- 响应式设计，适应不同屏幕尺寸
- 侧边栏导航菜单，根据用户角色动态显示。**新增**：包含一个动态的"报表"菜单项，其子项根据从后端获取的活动报表链接动态生成。管理员角色会额外看到"报表链接管理"菜单项。
- 表格组件支持分页、排序和过滤功能
- 模态对话框用于表单输入和确认操作
+ **新增**：面包屑导航现在可以动态生成，正确显示当前所在的报表页面名称。

## 4. 后端功能

### 4.1 项目结构

后端代码位于 `salary_system/webapp` 目录，主要文件和目录结构如下：

```
salary_system/webapp/
├── main.py                # 主应用程序入口和API定义
├── auth.py                # 认证相关功能
├── database.py            # 数据库连接和配置
├── models.py              # SQLAlchemy ORM 模型定义
├── models_db.py           # 数据库操作函数
├── schemas.py             # Pydantic 请求和响应模型
├── file_converter.py      # Excel文件转换功能
├── requirements.txt       # Python依赖项
├── routers/               # 模块化的API路由
│   ├── units.py           # 单位管理路由
│   ├── departments.py     # 部门管理路由
│   ├── report_links.py    # 报表链接管理路由
+│   ├── user_management.py # 用户管理路由 (已切换至 ORM)
│   └── config/            # 配置文件
```

### 4.2 核心功能模块

#### 4.2.1 认证与授权 (auth.py)

- JWT令牌生成和验证
- 密码哈希和验证
- 基于角色的访问控制 (RBAC)
- 用户认证流程管理

主要函数:
- `create_access_token` - 创建JWT访问令牌
- `authenticate_user` - 验证用户凭证
- `get_current_user` - 从请求中获取当前认证用户
- `require_role` - 创建检查用户角色的依赖

#### 4.2.2 数据库连接 (database.py)

- SQLAlchemy引擎和会话管理
- 数据库连接配置
- 会话依赖提供

主要函数:
- `get_db` - FastAPI依赖函数，提供数据库会话

#### 4.2.3 数据模型 (models.py, models_db.py)

- SQLAlchemy ORM模型定义
- 模型关系和约束
- 数据库查询和操作函数

主要模型:
- `User` - 用户信息
- `Role` - 用户角色
- `Unit` - 单位信息
- `Department` - 部门信息
- `Employee` - 员工信息
- `EstablishmentType` - 编制类型
- `FieldMapping` - 字段映射配置
- `SalaryRecord` - 薪资记录

#### 4.2.4 API模式 (schemas.py)

- Pydantic模型定义
- 请求和响应验证
- 数据转换和序列化

主要模式:
- 用户相关 (`UserCreate`, `UserResponse`, `Token`)
- 员工相关 (`EmployeeCreate`, `EmployeeResponse`) 
- 工资相关 (`SalaryRecord`, `PaginatedSalaryResponse`)
- 辅助数据 (`DepartmentInfo`, `EstablishmentTypeInfo`)

#### 4.2.5 文件转换 (file_converter.py)

- Excel文件到CSV的转换
- 数据预处理和清洗
- 数据导入到数据库

主要功能:
- Excel文件解析
- 列映射和标准化
- CSV生成和处理
- 数据库导入

#### 4.2.x 报表链接管理 (routers/report_links.py)

此模块负责管理侧边栏菜单中显示的报表链接。
- 提供API以获取活动报表链接列表供前端菜单使用。
- 提供CRUD操作（创建、读取、更新、删除）以管理报表链接（通常仅限管理员）。
- 存储报表链接的元数据，如名称、目标URL/路径、描述、激活状态、排序等。

### 4.3 API端点

主要API端点已在第6节详细描述，主要包括:

- 认证相关端点 (`/token`, `/register`)
- 用户管理端点 (`/api/users/*`)
- 员工管理端点 (`/api/employees/*`)
- 部门和单位管理端点 (`/api/departments-*`, `/api/units-*`)
- 工资数据端点 (`/api/salary_data/*`)
- 配置管理端点 (`/api/config/*`)
- 数据导入和处理端点 (`/api/convert/*`, `/api/dbt/*`)

### 4.4 数据转换与处理

#### 4.4.1 Python预处理脚本

位于 `salary_system/scripts/` 目录中，负责Excel文件初步处理:

- `preprocess_salary_data_parameterized.py` - 将Excel转换为标准化的中文头部CSV
- `rename_csv_headers.py` - 将中文列头转换为英文代码

#### 4.4.2 dbt转换

位于 `salary_system/salary_dbt_transforms/` 目录，负责:

- 从暂存表读取数据
- 执行数据清洗和标准化
- 创建事实表和维度表
- 生成计算视图

主要模型:
- **Staging Models** - 标准化源数据
- **Marts** - 创建事实表和维度表
- **Views** - 创建计算视图 (`view_base_data`, `view_level1_calculations`)

## 5. 数据库表结构

系统使用PostgreSQL数据库，通过SQLAlchemy ORM模型定义数据结构。以下是主要表结构和关系。

### 5.1 认证与授权

#### 5.1.1 users 表

| 字段名          | 类型            | 约束               | 描述                    |
|-----------------|-----------------|--------------------|-----------------------|
| id              | UUID            | PK                 | 用户唯一标识           |
| username        | VARCHAR(255)    | UNIQUE, NOT NULL   | 用户名                |
| email           | VARCHAR(255)    | UNIQUE, NOT NULL   | 电子邮箱              |
| hashed_password | VARCHAR(255)    | NOT NULL           | 密码哈希(bcrypt)      |
| is_active       | BOOLEAN         | DEFAULT TRUE       | 用户是否激活           |
| created_at      | TIMESTAMP       | DEFAULT now()      | 创建时间              |
| updated_at      | TIMESTAMP       | DEFAULT now()      | 更新时间              |

#### 5.1.2 roles 表

| 字段名          | 类型            | 约束               | 描述                    |
|-----------------|-----------------|--------------------|-----------------------|
| id              | UUID            | PK                 | 角色唯一标识           |
| name            | VARCHAR(50)     | UNIQUE, NOT NULL   | 角色名称              |
| description     | TEXT            |                    | 角色描述              |

#### 5.1.3 user_roles 表 (关联表)

| 字段名          | 类型            | 约束               | 描述                    |
|-----------------|-----------------|--------------------|-----------------------|
| user_id         | UUID            | FK(users.id)       | 用户ID                |
| role_id         | UUID            | FK(roles.id)       | 角色ID                |

### 5.2 组织结构

#### 5.2.1 units 表

| 字段名          | 类型            | 约束               | 描述                    |
|-----------------|-----------------|--------------------|-----------------------|
| id              | UUID            | PK                 | 单位唯一标识           |
| name            | VARCHAR(100)    | NOT NULL           | 单位名称              |
| code            | VARCHAR(20)     | UNIQUE             | 单位代码              |
| description     | TEXT            |                    | 单位描述              |
| parent_id       | UUID            | FK(units.id)       | 父单位ID (自引用)      |
| is_active       | BOOLEAN         | DEFAULT TRUE       | 是否有效              |

#### 5.2.2 departments 表

| 字段名          | 类型            | 约束               | 描述                    |
|-----------------|-----------------|--------------------|-----------------------|
| id              | UUID            | PK                 | 部门唯一标识           |
| name            | VARCHAR(100)    | NOT NULL           | 部门名称              |
| code            | VARCHAR(20)     |                    | 部门代码              |
| unit_id         | UUID            | FK(units.id)       | 所属单位ID            |
| manager_id      | UUID            | FK(employees.id)   | 部门负责人ID          |
| is_active       | BOOLEAN         | DEFAULT TRUE       | 是否有效              |

### 5.3 人员信息

#### 5.3.1 establishment_types 表 (编制类型)

| 字段名          | 类型            | 约束               | 描述                    |
|-----------------|-----------------|--------------------|-----------------------|
| id              | UUID            | PK                 | 编制类型唯一标识        |
| name            | VARCHAR(50)     | NOT NULL           | 编制类型名称(如专项、专技、区聘) |
| code            | VARCHAR(20)     | UNIQUE             | 编制类型代码           |
| description     | TEXT            |                    | 描述                  |

#### 5.3.2 employees 表

| 字段名             | 类型            | 约束               | 描述                    |
|-------------------|-----------------|--------------------|-----------------------|
| id                | UUID            | PK                 | 员工唯一标识           |
| name              | VARCHAR(100)    | NOT NULL           | 员工姓名              |
| employee_code     | VARCHAR(50)     | UNIQUE             | 工号                  |
| id_number         | VARCHAR(18)     | UNIQUE             | 身份证号              |
| gender            | VARCHAR(10)     |                    | 性别                  |
| birth_date        | DATE            |                    | 出生日期              |
| department_id     | UUID            | FK(departments.id) | 部门ID                |
| establishment_type_id | UUID        | FK(establishment_types.id) | 编制类型ID      |
| position          | VARCHAR(100)    |                    | 职位                  |
| job_title         | VARCHAR(100)    |                    | 职称                  |
| join_date         | DATE            |                    | 入职日期              |
| leave_date        | DATE            |                    | 离职日期              |
| is_active         | BOOLEAN         | DEFAULT TRUE       | 是否在职              |
| user_id           | UUID            | FK(users.id)       | 关联用户ID (可选)      |

### 5.4 工资数据

#### 5.4.1 salary_records 表

| 字段名               | 类型            | 约束               | 描述                    |
|---------------------|-----------------|--------------------|-----------------------|
| id                  | UUID            | PK                 | 记录唯一标识           |
| employee_id         | UUID            | FK(employees.id)   | 员工ID                |
| year                | INTEGER         | NOT NULL           | 年份                  |
| month               | INTEGER         | NOT NULL           | 月份                  |
| record_type         | VARCHAR(50)     |                    | 记录类型              |
| establishment_type_id | UUID          | FK(establishment_types.id) | 编制类型      |
| base_salary         | DECIMAL(12,2)   |                    | 基本工资              |
| position_salary     | DECIMAL(12,2)   |                    | 职务工资              |
| performance_salary  | DECIMAL(12,2)   |                    | 绩效工资              |
| allowance           | DECIMAL(12,2)   |                    | 津贴                  |
| deduction           | DECIMAL(12,2)   |                    | 扣除                  |
| tax                 | DECIMAL(12,2)   |                    | 个税                  |
| social_security     | DECIMAL(12,2)   |                    | 社保                  |
| housing_fund        | DECIMAL(12,2)   |                    | 住房公积金            |
| net_salary          | DECIMAL(12,2)   |                    | 实发工资              |
| remarks             | TEXT            |                    | 备注                  |
| created_at          | TIMESTAMP       | DEFAULT now()      | 创建时间              |
| updated_at          | TIMESTAMP       | DEFAULT now()      | 更新时间              |

### 5.5 配置数据

#### 5.5.1 field_mappings 表

| 字段名               | 类型            | 约束               | 描述                    |
|---------------------|-----------------|--------------------|-----------------------|
| id                  | UUID            | PK                 | 映射唯一标识           |
| source_field        | VARCHAR(100)    | NOT NULL           | 源字段名称 (Excel中的列名) |
| target_field        | VARCHAR(100)    | NOT NULL           | 目标字段名称 (数据库中的列名) |
| establishment_type_id | UUID          | FK(establishment_types.id) | 适用的编制类型   |
| data_type           | VARCHAR(50)     |                    | 数据类型 (如NUMBER, TEXT) |
| is_required         | BOOLEAN         | DEFAULT FALSE      | 是否必填              |
| default_value       | TEXT            |                    | 默认值                |
| is_active           | BOOLEAN         | DEFAULT TRUE       | 是否激活              |

### 5.6 系统审计

#### 5.6.1 activity_logs 表

| 字段名               | 类型            | 约束               | 描述                    |
|---------------------|-----------------|--------------------|-----------------------|
| id                  | UUID            | PK                 | 日志唯一标识           |
| user_id             | UUID            | FK(users.id)       | 用户ID                |
| action              | VARCHAR(50)     | NOT NULL           | 操作类型(如CREATE, UPDATE) |
| entity_type         | VARCHAR(50)     | NOT NULL           | 实体类型(如Employee, SalaryRecord) |
| entity_id           | UUID            |                    | 实体ID                |
| details             | JSONB           |                    | 操作详情 (JSON格式)     |
| ip_address          | VARCHAR(50)     |                    | IP地址                |
| created_at          | TIMESTAMP       | DEFAULT now()      | 创建时间              |

### 5.7 数据库关系图

```
users <--1:N--> user_roles <--N:1--> roles
     |
     1
     |
     N
employees <--N:1--> departments <--N:1--> units
     |                                     |
     |                                     1
     |                                     |
     N                                     N
     |                                     |
salary_records                            units
     |
     N
     |
     1
establishment_types <--1:N--> field_mappings
```

### 5.8 dbt生成的视图

#### 5.8.1 view_base_data

包含基础工资数据，标准化后的形式，应用了字段映射和基本转换。

#### 5.8.2 view_level1_calculations

在base_data基础上进行了一阶计算，如汇总、合计等操作，应用了不同编制类型的计算规则。

### 5.x 报表链接表 (`report_links`)

此表存储在前端侧边栏动态显示的报表链接信息。

| 列名          | 类型          | 约束/描述                                  |
|---------------|---------------|--------------------------------------------|
| `id`          | INTEGER       | 主键, 自增                                 |
| `name`        | VARCHAR       | 报表链接名称 (在菜单中显示)                  |
| `url`         | VARCHAR       | 报表的实际URL或内部路由路径                |
| `description` | TEXT          | (可选) 报表描述                            |
| `is_active`   | BOOLEAN       | 是否在菜单中显示                           |
| `order`       | INTEGER       | (可选) 用于排序菜单项                      |
| `required_role`| VARCHAR       | (可选) 访问此报表所需的最低角色          |
| `created_at`  | TIMESTAMP     | 创建时间戳                                 |
| `updated_at`  | TIMESTAMP     | 最后更新时间戳                             |

## 6. API接口

系统基于FastAPI构建了完整的RESTful API接口，以下列出主要接口。

### 6.1 认证与用户管理接口

#### 6.1.1 认证 (Authentication)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| POST   | `/token`            | 获取访问令牌                | 公开           | `username`, `password`               | `access_token`, `token_type`|
| POST   | `/register`         | 注册新用户                  | 公开           | `username`, `email`, `password`      | 新创建的用户信息             |

#### 6.1.2 用户管理 (User Management)

| 方法   | 端点                   | 描述                        | 权限            | 主要请求体/参数                       | 主要返回值                   |
|--------|------------------------|-----------------------------|-----------------|---------------------------------------|----------------------------|
| GET    | `/api/users/me`        | 获取当前用户信息            | 已认证用户      | 无                                    | `UserResponse`             |
| PUT    | `/api/users/me`        | 更新当前用户信息(邮箱)    | 已认证用户      | `UserUpdate` (仅 email)               | `UserResponse`             |
| PUT    | `/api/users/me/password` | 修改当前用户密码            | 已认证用户      | `PasswordUpdate`                      | 204 No Content             |
| GET    | `/api/users`           | 获取用户列表 (分页)         | Super Admin     | `skip`, `limit` (查询参数)            | `UserListResponse`         |
| POST   | `/api/users`           | 创建新用户                  | Super Admin     | `UserCreate` (含 password, role_id) | `UserResponse`             |
| GET    | `/api/users/{user_id}` | 获取指定用户信息            | Super Admin     | `user_id` (路径参数)                  | `UserResponse`             |
| PUT    | `/api/users/{user_id}` | 更新指定用户信息          | Super Admin     | `user_id` (路径), `UserUpdate` (email, role_id, is_active) | `UserResponse` |
| DELETE | `/api/users/{user_id}` | 删除指定用户                | Super Admin     | `user_id` (路径参数)                  | 204 No Content             |
| GET    | `/api/users/roles/list`| 获取所有可用角色列表        | Super Admin     | 无                                    | `List[RoleResponse]`       |

### 6.2 员工与组织架构接口

#### 6.2.1 单位管理 (Units)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/units/`       | 获取单位列表                | 已认证用户     | `skip`, `limit`, `is_active`          | 单位列表                     |
| POST   | `/api/units/`       | 创建新单位                  | 管理员        | 单位信息                              | 新创建的单位信息             |
| GET    | `/api/units/{id}`   | 获取指定单位信息            | 已认证用户     | `id` (路径参数)                      | 单位信息                     |
| PUT    | `/api/units/{id}`   | 更新单位信息                | 管理员        | `id` (路径参数), 单位信息            | 更新后的单位信息             |
| DELETE | `/api/units/{id}`   | 删除单位                    | 管理员        | `id` (路径参数)                      | 操作状态                     |
| GET    | `/api/units/hierarchy`| 获取单位层级结构           | 已认证用户     | 无                                    | 树形结构的单位列表           |

#### 6.2.2 部门管理 (Departments)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/departments/` | 获取部门列表                | 已认证用户     | `skip`, `limit`, `unit_id`, `is_active`| 部门列表                     |
| POST   | `/api/departments/` | 创建新部门                  | 管理员        | 部门信息                              | 新创建的部门信息             |
| GET    | `/api/departments/{id}`| 获取指定部门信息          | 已认证用户     | `id` (路径参数)                      | 部门信息                     |
| PUT    | `/api/departments/{id}`| 更新部门信息              | 管理员        | `id` (路径参数), 部门信息            | 更新后的部门信息             |
| DELETE | `/api/departments/{id}`| 删除部门                  | 管理员        | `id` (路径参数)                      | 操作状态                     |

#### 6.2.3 员工管理 (Employees)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/employees/`   | 获取员工列表                | 已认证用户     | `skip`, `limit`, `department_id`, `establishment_type_id`等 | 员工列表 |
| POST   | `/api/employees/`   | 创建新员工                  | 管理员        | 员工信息                              | 新创建的员工信息             |
| GET    | `/api/employees/{id}`| 获取指定员工信息            | 已认证用户     | `id` (路径参数)                      | 员工信息                     |
| PUT    | `/api/employees/{id}`| 更新员工信息                | 管理员        | `id` (路径参数), 员工信息            | 更新后的员工信息             |
| DELETE | `/api/employees/{id}`| 删除员工                    | 管理员        | `id` (路径参数)                      | 操作状态                     |
| GET    | `/api/employees/by-id-number/{id_number}`| 通过身份证号查询员工 | 已认证用户 | `id_number` (路径参数)          | 员工信息                     |
| GET    | `/api/employees/by-code/{code}`| 通过工号查询员工   | 已认证用户     | `code` (路径参数)                    | 员工信息                     |

### 6.3 工资数据接口

#### 6.3.1 工资记录管理 (Salary Records)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/salary_records/`| 获取工资记录列表           | 已认证用户     | `skip`, `limit`, `year`, `month`, `employee_id`等 | 工资记录列表 |
| POST   | `/api/salary_records/`| 创建新工资记录             | 财务管理员   | 工资记录信息                          | 新创建的工资记录信息         |
| GET    | `/api/salary_records/{id}`| 获取指定工资记录       | 已认证用户     | `id` (路径参数)                      | 工资记录信息                 |
| PUT    | `/api/salary_records/{id}`| 更新工资记录            | 财务管理员   | `id` (路径参数), 工资记录信息        | 更新后的工资记录信息         |
| DELETE | `/api/salary_records/{id}`| 删除工资记录            | 财务管理员   | `id` (路径参数)                      | 操作状态                     |
| GET    | `/api/salary_records/employee/{employee_id}`| 获取指定员工的工资记录 | 已认证用户 | `employee_id`, `year`, `month` | 工资记录列表 |
| GET    | `/api/salary_records/summary/by-department`| 按部门汇总工资记录 | 部门主管     | `year`, `month`, `department_id`   | 汇总工资数据                 |
| GET    | `/api/salary_records/summary/by-unit`| 按单位汇总工资记录 | 单位负责人   | `year`, `month`, `unit_id`          | 汇总工资数据                 |

#### 6.3.2 导入与转换 (Import and Conversion)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| POST   | `/api/convert/excel-to-csv`| Excel文件转CSV         | 财务管理员   | `file` (Excel文件)                    | 转换状态和CSV文件URL         |
| POST   | `/api/convert/csv-to-db`| 将CSV导入数据库           | 财务管理员   | `file` (CSV文件), `establishment_type_id`, `year`, `month` | 导入状态和结果 |
| GET    | `/api/convert/templates`| 获取可用的Excel模板       | 已认证用户     | `establishment_type_id`               | 模板列表                     |
| POST   | `/api/convert/validate-excel`| 验证Excel文件格式     | 财务管理员   | `file` (Excel文件)                    | 验证结果                     |

### 6.4 配置管理接口

#### 6.4.1 字段映射 (Field Mappings)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/field_mappings/`| 获取字段映射列表           | 已认证用户     | `skip`, `limit`, `establishment_type_id` | 字段映射列表                 |
| POST   | `/api/field_mappings/`| 创建新字段映射             | 管理员        | 字段映射信息                          | 新创建的字段映射信息         |
| GET    | `/api/field_mappings/{id}`| 获取指定字段映射       | 已认证用户     | `id` (路径参数)                      | 字段映射信息                 |
| PUT    | `/api/field_mappings/{id}`| 更新字段映射            | 管理员        | `id` (路径参数), 字段映射信息        | 更新后的字段映射信息         |
| DELETE | `/api/field_mappings/{id}`| 删除字段映射            | 管理员        | `id` (路径参数)                      | 操作状态                     |
| GET    | `/api/field_mappings/by-type/{establishment_type_id}`| 获取指定编制类型的字段映射 | 已认证用户 | `establishment_type_id` | 字段映射列表 |

#### 6.4.2 编制类型 (Establishment Types)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/establishment_types/`| 获取编制类型列表      | 已认证用户     | `skip`, `limit`                       | 编制类型列表                 |
| POST   | `/api/establishment_types/`| 创建新编制类型        | 管理员        | 编制类型信息                          | 新创建的编制类型信息         |
| GET    | `/api/establishment_types/{id}`| 获取指定编制类型  | 已认证用户     | `id` (路径参数)                      | 编制类型信息                 |
| PUT    | `/api/establishment_types/{id}`| 更新编制类型      | 管理员        | `id` (路径参数), 编制类型信息        | 更新后的编制类型信息         |
| DELETE | `/api/establishment_types/{id}`| 删除编制类型      | 管理员        | `id` (路径参数)                      | 操作状态                     |

### 6.5 报表接口

#### 6.5.1 基础报表 (Basic Reports)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/reports/monthly-summary`| 月度工资汇总报表   | 财务管理员   | `year`, `month`, `unit_id`           | 汇总报表数据                 |
| GET    | `/api/reports/employee-history`| 员工历史工资报表  | 部门主管     | `employee_id`, `start_date`, `end_date` | 员工历史工资数据           |
| GET    | `/api/reports/department-comparison`| 部门间工资比较 | 单位负责人   | `year`, `month`, `unit_id`           | 部门比较数据                 |
| GET    | `/api/reports/establishment-type-summary`| 按编制类型汇总 | 财务管理员 | `year`, `month`                     | 按编制类型汇总的工资数据     |
| GET    | `/api/reports/jimu-auth`| 获取Jimu报表认证令牌     | 已认证用户   | 无                                    | 包含令牌的URL                |

#### 6.5.2 导出接口 (Exports)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/exports/salary-excel`| 导出工资数据为Excel   | 财务管理员   | `year`, `month`, `department_id`等   | Excel文件                   |
| GET    | `/api/exports/employee-pdf`| 导出员工工资单为PDF   | 已认证用户     | `employee_id`, `year`, `month`        | PDF文件                     |
| GET    | `/api/exports/department-summary`| 导出部门汇总表  | 部门主管     | `department_id`, `year`, `month`      | Excel文件                   |

### 6.6 系统管理接口

#### 6.6.1 数据处理 (Data Processing)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| POST   | `/api/dbt/run-model`| 手动运行dbt模型             | 管理员        | `model_name`                          | 运行状态和结果              |
| GET    | `/api/dbt/model-status`| 获取dbt模型状态           | 管理员        | 无                                    | 模型状态列表                |
| POST   | `/api/system/refresh-views`| 刷新数据库视图        | 管理员        | 无                                    | 操作状态                    |

#### 6.6.2 系统日志 (Logs)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/logs/activity`| 获取系统活动日志            | 管理员        | `skip`, `limit`, `start_date`, `end_date`, `user_id`等 | 日志列表 |
| GET    | `/api/logs/error`   | 获取系统错误日志            | 管理员        | `skip`, `limit`, `start_date`, `end_date` | 错误日志列表             |

### 6.7 辅助接口

#### 6.7.1 元数据 (Metadata)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/metadata/salary-fields`| 获取工资字段列表    | 已认证用户     | `establishment_type_id`               | 字段列表和描述              |
| GET    | `/api/metadata/roles`| 获取系统角色列表            | 管理员        | 无                                    | 角色列表                    |

#### 6.7.2 健康检查 (Health Checks)

| 方法   | 端点                | 描述                        | 权限            | 参数                                  | 返回值                       |
|--------|---------------------|----------------------------|----------------|---------------------------------------|----------------------------|
| GET    | `/api/health`       | 系统健康检查                | 公开           | 无                                    | 健康状态                    |
| GET    | `/api/health/db`    | 数据库连接检查              | 管理员        | 无                                    | 数据库连接状态              |
| GET    | `/api/version`      | 获取API版本信息             | 公开           | 无                                    | 版本信息                    |

### 6.x 报表链接管理API (`/api/v1/report-links`)

+- **GET `/active`**: 获取所有活动的报表链接列表，供前端菜单使用。
+  - 响应: `List[ReportLinkRead]`
+- **GET `/`**: (管理员) 获取所有报表链接（包括非活动的）。
+  - 响应: `List[ReportLinkRead]`
+- **POST `/`**: (管理员) 创建一个新的报表链接。
+  - 请求体: `ReportLinkCreate` (包含 name, url, description, is_active, order 等)
+  - 响应: `ReportLinkRead`
+- **GET `/{report_link_id}`**: (管理员) 获取单个报表链接的详细信息。
+  - 响应: `ReportLinkRead`
+- **PUT `/{report_link_id}`**: (管理员) 更新一个已存在的报表链接。
+  - 请求体: `ReportLinkUpdate`
+  - 响应: `ReportLinkRead`
+- **DELETE `/{report_link_id}`**: (管理员) 删除一个报表链接。
+  - 响应: `{ "message": "Report link deleted successfully" }`

## 7. 数据流程

### 7.1 Excel数据导入流程

1. **数据收集阶段**：
   - 从人事部门收集原始Excel工资表
   - 按照编制类型分类（专项、专技、区聘等）
   - 验证Excel表格式与预期模板是否匹配

2. **预处理阶段**：
   - 使用`preprocess_salary_data_parameterized.py`脚本处理Excel
   - 标准化列名和数据格式
   - 清理无效数据和格式问题
   - 生成带中文表头的中间CSV文件

3. **列头转换阶段**：
   - 使用`rename_csv_headers.py`将中文列名转为英文代码
   - 应用编制类型特定的字段映射规则
   - 生成带英文表头的标准CSV文件

4. **数据导入阶段**：
   - 通过API上传标准CSV
   - 检验数据完整性和格式
   - 导入PostgreSQL中的暂存表

流程示意图：
```
原始Excel文件 → 预处理脚本 → 中文头CSV → 列头转换 → 英文头CSV → API导入 → 暂存表
```

### 7.2 dbt转换流程

1. **数据标准化**：
   - 使用`staging`模型标准化源数据
   - 应用数据类型转换和基本清洗
   - 处理缺失值和异常值

2. **维度/事实表构建**：
   - 构建员工维度表 (`dim_employees`)
   - 构建部门维度表 (`dim_departments`)
   - 构建工资事实表 (`fact_salary_records`)
   - 建立各表之间的关系

3. **计算视图生成**：
   - 创建`view_base_data`基础视图
   - 创建`view_level1_calculations`一级计算视图
   - 针对不同编制类型应用特定计算规则
   - 生成汇总指标和分析字段

4. **模型运行**：
   - 定时自动运行dbt模型（每日凌晨）
   - 支持手动触发模型运行
   - 记录模型运行状态和日志

流程示意图：
```
暂存表 → staging模型 → 维度/事实表 → 计算视图 → 报表数据
```

### 7.3 数据访问与展示流程

1. **数据查询**：
   - 通过FastAPI端点查询相关数据
   - 应用权限过滤（基于用户角色和部门）
   - 支持分页、排序和过滤条件
   - 对大数据集进行优化查询

2. **前端展示**：
   - React组件接收并处理API数据
   - 使用Ant Design表格组件展示数据
   - 支持客户端排序、筛选和搜索
   - 提供数据可视化图表

3. **报表生成**：
   - 基于视图数据生成报表
   - 支持导出为Excel、PDF等格式
   - 提供预定义报表模板
   - 支持自定义报表配置
   - 通过iframe集成Jimu报表系统

4. **数据刷新**：
   - 用户可手动刷新数据
   - 定时自动刷新缓存数据
   - 监控数据更新状态

流程示意图：
```
数据库视图 → FastAPI查询 → 权限过滤 → 序列化 → React前端 → 用户界面/Jimu报表
```

### 7.4 完整数据流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  原始Excel   │ → │  Python脚本  │ → │ 标准化CSV   │ → │ 数据库暂存表 │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 用户界面    │ ← │  前端应用    │ ← │  API服务    │ ← │  计算视图    │
└─────┬───────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
      │                                                             │
      ▼                                                             ▼
┌─────────────┐     ┌─────────────┐                         ┌─────────────┐
│ Jimu报表    │     │  导出报表   │ ←                       │  dbt模型    │
└─────────────┘     └─────────────┘                         └─────────────┘
```

### 7.5 数据处理优化

1. **性能优化**：
   - 使用数据库索引加速查询
   - 实现查询结果缓存
   - 大型数据集分页处理
   - 异步处理长时间运行的操作

2. **数据质量保障**：
   - 输入数据验证和清洗
   - 数据完整性检查
   - 异常检测和报告
   - 定期数据质量审计

3. **可拓展性考虑**：
   - 模块化的数据处理流程
   - 可配置的字段映射
   - 支持新编制类型的灵活扩展
   - 处理不同格式Excel的适配器

## 8. 安全与权限

### 8.1 认证机制

系统采用现代化的认证和授权机制，确保数据安全和访问控制：

#### 8.1.1 JWT认证

- 使用JWT (JSON Web Token) 实现无状态认证
- 令牌生成使用Python-Jose库，采用HS256算法签名
- 令牌包含用户ID、角色和过期时间信息
- 默认访问令牌有效期为30分钟
- 支持令牌刷新机制，刷新令牌有效期为7天

实现逻辑：
```python
# JWT令牌创建 (auth.py)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

#### 8.1.2 密码安全

- 使用Passlib库进行密码哈希处理
- 采用Bcrypt算法进行密码哈希
- 盐值随机生成并与哈希一起存储
- 密码策略要求：最小8位，包含大小写字母和数字
- 支持密码重置功能，通过邮件验证

#### 8.1.3 HTTP安全设置

- 全站启用HTTPS协议
- 设置安全相关的HTTP头部
  - X-XSS-Protection
  - X-Content-Type-Options
  - Content-Security-Policy
  - X-Frame-Options
- CORS设置控制跨域访问
- 启用CSRF保护

### 8.2 授权与访问控制

#### 8.2.1 角色设计

系统实现了细粒度的基于角色的访问控制(RBAC)，主要角色包括：

| 角色ID | 角色名称 | 权限范围 |
|--------|---------|----------|
| 1 | admin | 系统管理员，拥有所有权限 |
| 2 | financial_admin | 财务管理员，可以上传和管理所有工资数据 |
| 3 | unit_manager | 单位负责人，可以查看其单位下所有部门的工资数据 |
| 4 | department_manager | 部门经理，只能查看其部门的工资数据 |
| 5 | employee | 普通员工，只能查看自己的工资数据 |

#### 8.2.2 权限控制实现

1. **API层权限**：
   - 使用FastAPI的依赖注入机制实现权限检查
   - 每个端点定义所需的最小权限级别
   - 通过装饰器模式应用权限验证

   ```python
   # 权限检查依赖 (auth.py)
   def require_role(allowed_roles: List[str]):
       def dependency(current_user: User = Depends(get_current_user)):
           user_roles = [role.name for role in current_user.roles]
           for role in allowed_roles:
               if role in user_roles:
                   return current_user
           raise HTTPException(status_code=403, detail="Permission denied")
       return dependency
   ```

2. **数据访问控制**：
   - 实现行级别访问控制
   - 部门经理只能查看其部门的数据
   - 单位负责人只能查看其单位下的数据
   - 员工只能查看自己的数据

3. **前端权限控制**：
   - 基于用户角色动态生成菜单
   - 隐藏没有权限访问的功能按钮
   - 路由级别的权限检查（ProtectedRoute组件）

   ```tsx
   // 前端权限检查 (ProtectedRoute.tsx)
   const ProtectedRoute = ({ requiredRoles, children }: ProtectedRouteProps) => {
     const { user, isAuthenticated } = useAuth();
     const navigate = useNavigate();
     
     useEffect(() => {
       if (!isAuthenticated) {
         navigate('/login');
       } else if (requiredRoles && user) {
         const hasRequiredRole = user.roles.some(role => 
           requiredRoles.includes(role)
         );
         if (!hasRequiredRole) {
           navigate('/unauthorized');
         }
       }
     }, [isAuthenticated, user, requiredRoles, navigate]);
     
     return children;
   };
   ```

### 8.3 数据防护措施

1. **数据加密**：
   - 敏感个人信息（如身份证号）在数据库中加密存储
   - 传输层使用TLS/SSL加密
   - 数据库备份文件加密

2. **访问审计**：
   - 记录所有关键操作的日志
   - 包括用户登录、数据修改、权限变更等
   - 日志包含操作类型、操作人、操作时间、IP地址等信息

3. **防注入措施**：
   - 使用SQLAlchemy ORM防止SQL注入
   - 使用Pydantic模型验证输入数据
   - 对所有用户输入进行适当转义

4. **防暴力破解**：
   - 登录失败次数限制
   - 账户临时锁定机制
   - IP限流机制

## 9. 部署与维护

### 9.1 系统环境要求

#### 9.1.1 硬件需求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2核心 | 4核心及以上 |
| 内存 | 4GB | 8GB及以上 |
| 存储 | 50GB SSD | 100GB SSD及以上 |
| 网络 | 10Mbps | 100Mbps及以上 |

#### 9.1.2 软件需求

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| 操作系统 | Ubuntu 20.04 LTS 或更高 | 也支持其他Linux发行版 |
| Python | 3.10 或更高 | 后端开发语言 |
| Node.js | 18.x 或更高 | 前端构建工具 |
| PostgreSQL | 14.x 或更高 | 主数据库 |
| Docker | 20.10.x 或更高 | 容器化部署（推荐） |
| Nginx | 1.18.0 或更高 | Web服务器 |
| dbt-core | 1.3.x 或更高 | 数据转换工具 |
| Jimu Reports | latest | BI报表工具 |

### 9.2 部署方案

系统推荐使用**Docker Compose**进行部署，以简化环境配置、依赖管理和部署流程。

#### 9.2.1 Docker Compose部署 (推荐)

此方案将所有服务容器化，并通过`docker-compose.yml`文件进行编排。

**配置文件位置:** `salary_system/docker/`

**核心文件:**
- `docker-compose.yml`: 定义所有服务及其关系。
- `.env` / `.env.template`: 存储环境变量（端口、凭证、数据库连接等）。
- `backend/Dockerfile`: 构建后端FastAPI镜像。
- `frontend/Dockerfile`: 构建前端React镜像（使用Nginx服务）。
- `frontend/nginx.conf`: Nginx配置文件，用于服务前端静态文件和API代理。
- `jimu/Dockerfile` (可选): 构建Jimu Reports镜像。
- `../webapp/scripts/init_app.py`: 后端初始化脚本。

**服务概览 (`docker-compose.yml`):**

1.  **`db` (PostgreSQL):**
    *   使用官方 `postgres:14-alpine` 镜像。
    *   使用命名卷 `postgres_data` 持久化数据库文件。
    *   通过 `.env` 文件配置数据库名、用户、密码。
    *   端口映射由 `.env` 控制 (e.g., `${DB_HOST_PORT:-5432}:5432`)。
    *   加入 `salary-network` 网络。
2.  **`backend-init` (一次性初始化服务):**
    *   使用与 `backend` 服务相同的镜像构建。
    *   **目的**: 在主后端启动前执行初始化任务。
    *   **命令**: `python /app/scripts/init_app.py`。
    *   **功能**: 检查数据库连接、运行Alembic数据库迁移、创建初始管理员账户 (依赖`.env`中的`ADMIN_USER`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`)。
    *   依赖 `db` 服务 (`depends_on: db`)。
    *   连接数据库使用环境变量 `DATABASE_URL`。
3.  **`backend` (FastAPI应用):**
    *   **构建**: 使用 `docker/backend/Dockerfile`，构建上下文为项目根目录 (`..`)。
    *   **依赖**: 依赖 `backend-init` 成功完成 (`depends_on: backend-init: condition: service_completed_successfully`)。
    *   端口映射由 `.env` 控制 (e.g., `${BACKEND_HOST_PORT:-8000}:8000`)。
    *   连接数据库使用环境变量 `DATABASE_URL`。
    *   加入 `salary-network` 网络。
4.  **`frontend` (React + Nginx):**
    *   **构建**: 使用 `docker/frontend/Dockerfile` (Node 18构建阶段 + Nginx服务阶段)，构建上下文为项目根目录 (`..`)。
    *   **配置**: 将 `docker/frontend/nginx.conf` 文件挂载到容器内的 Nginx 配置目录。
    *   端口映射由 `.env` 控制 (e.g., `${FRONTEND_HOST_PORT:-80}:80`)。
    *   加入 `salary-network` 网络。
    *   依赖 `backend` 服务 (确保后端API可用)。
5.  **`jimu` (Jimu Reports - 如果使用):**
    *   使用官方或自定义的 Jimu Reports 镜像。
    *   配置数据库连接等环境变量。
    *   端口映射由 `.env` 控制 (e.g., `${JIMU_HOST_PORT:-8080}:8080`)。
    *   加入 `salary-network` 网络。
6.  **`db-backup` (数据库备份服务):**
    *   使用 `postgres:14-alpine` 镜像 (包含`pg_dump`工具)。
    *   **目的**: 定期执行数据库备份。
    *   **命令**: 包含一个循环 (`while true; do ... sleep 1d; done`)，定期执行 `pg_dump` 命令将数据库备份到挂载的卷中。
    *   使用命名卷 `db_backups` 存储备份文件。
    *   环境变量配置数据库连接信息 (`PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`)。
    *   依赖 `db` 服务。

**网络:**
- 所有服务共享一个名为 `salary-network` 的桥接网络，允许它们通过服务名相互访问。

**卷:**
- `postgres_data`: 持久化存储 PostgreSQL 数据。
- `db_backups`: 持久化存储数据库备份文件。

**运行方式:**
1.  确保 Docker 和 Docker Compose 已安装。
2.  导航到 `salary_system/docker/` 目录。
3.  复制 `.env.template` 为 `.env` 并填入所需的环境变量。
4.  运行 `docker compose up --build -d` 启动所有服务 (首次运行或代码/配置更改时使用 `--build`)。
5.  访问前端: `http://localhost:${FRONTEND_HOST_PORT}` (根据 `.env` 配置的端口)。
6.  停止服务: `docker compose down`。

#### 9.2.2 单服务器部署 (备选)

// ... (可以保留旧的单服务器描述作为备选，但标记为非推荐) ...
适用于中小规模部署...

#### 9.2.3 云平台部署 (高级)

// ... (可以保留云平台描述) ...
适用于需要高可用性和弹性扩展的部署...

### 9.3 CI/CD流程

使用GitHub Actions或GitLab CI实现持续集成和部署：

```yaml
# GitHub Actions 工作流示例
name: Salary System CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          pip install -r salary_system/webapp/requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: pytest salary_system/webapp/tests/ --cov=salary_system/webapp

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: |
          cd salary_system/frontend/salary-viewer
          npm install
      - name: Build frontend
        run: |
          cd salary_system/frontend/salary-viewer
          npm run build
```

### 9.4 数据备份与恢复

#### 9.4.1 备份策略 (Docker Compose)

- **数据库备份 (由 `db-backup` 服务自动执行):**
  - **方式**: 使用 `pg_dump` 创建数据库的逻辑备份。
  - **频率**: 默认每天执行一次 (可通过修改 `db-backup` 服务的 `command` 中的 `sleep` 值调整)。
  - **存储**: 备份文件 (带时间戳) 存储在名为 `db_backups` 的 Docker 命名卷中。
  - **备份内容**: 包含数据库结构和数据。
  - **注意**: 需要定期将 `db_backups` 卷中的文件复制到安全的外部存储 (如 S3, NAS, 异地服务器) 以遵循 3-2-1 备份原则。
- **应用代码备份**: 通过版本控制系统 (如 Git) 管理。
- **配置文件备份**: `.env`, `docker-compose.yml`, `nginx.conf`, Dockerfiles 等应纳入版本控制。
- **持久化卷备份**: 除了 `db-backup` 创建的备份文件，`postgres_data` 卷本身也可以进行快照或文件级备份，但这通常更复杂且可能需要停止数据库。

#### 9.4.2 恢复流程 (Docker Compose)

1.  **准备**: 确保拥有要恢复的 `.sql` 或 `.dump` 备份文件 (从 `db_backups` 卷或其他外部存储获取)。
2.  **停止相关服务**: `docker compose stop db backend backend-init` (如果正在运行)。
3.  **(可选) 清理现有数据**: 如果要完全覆盖，可以删除 `postgres_data` 卷 (`docker volume rm postgres_data`)。**请极其谨慎操作！**
4.  **启动数据库服务**: `docker compose up -d db`。
5.  **执行恢复**: 使用 `docker cp` 将备份文件复制到 `db` 容器内，然后使用 `docker exec` 在容器内执行 `psql` 或 `pg_restore` 命令。
    ```bash
    # 示例: 将备份文件复制到容器内
    docker cp /path/to/your/backup.sql salary_db:/tmp/backup.sql 
    # 示例: 在容器内执行恢复 (纯SQL备份)
    docker exec -i salary_db psql -U ${POSTGRES_USER:-user} -d ${POSTGRES_DB:-salary_system} < /path/to/your/backup.sql 
    # 或者 (如果使用 pg_dump -Fc 格式备份)
    # docker exec -i salary_db pg_restore -U ${POSTGRES_USER:-user} -d ${POSTGRES_DB:-salary_system} -v "/tmp/backup.dump"
    ```
    *(请根据实际备份文件格式和`.env`中的用户/数据库名调整命令)*
6.  **验证**: 连接数据库检查数据是否已恢复。
7.  **启动其他服务**: `docker compose up -d backend frontend jimu` (或其他依赖服务)。

### 9.5 监控与日志

#### 9.5.1 系统监控

- **服务器监控**：
  - CPU、内存、磁盘使用率
  - 网络流量和连接状态
  - 使用Prometheus + Grafana构建监控面板

- **应用监控**：
  - API响应时间和错误率
  - 数据库查询性能
  - 用户活跃度和系统负载

- **告警机制**：
  - 关键指标阈值告警
  - 错误率突增告警
  - 系统可用性监控

#### 9.5.2 日志管理

- **日志类型**：
  - 应用日志 (FastAPI)
  - 数据库日志 (PostgreSQL)
  - Web服务器日志 (Nginx)
  - 系统操作日志
  - 安全审计日志

- **日志聚合**：
  - 使用ELK Stack (Elasticsearch + Logstash + Kibana)
  - 或使用Graylog进行日志集中管理
  - 实现日志搜索和分析

### 9.6 系统升级流程

1. **升级准备**：
   - 创建完整系统备份
   - 准备回滚计划
   - 通知用户计划维护时间

2. **开发环境测试**：
   - 在开发环境完整测试新版本
   - 解决发现的问题
   - 准备升级脚本

3. **生产环境升级**：
   - 在低峰期执行升级
   - 执行数据库迁移脚本
   - 部署新版本应用
   - 执行冒烟测试

4. **验证与监控**：
   - 验证关键功能正常
   - 监控系统性能和错误日志
   - 用户反馈收集

5. **问题处理**：
   - 如发现严重问题，执行回滚
   - 记录问题并在后续版本修复

## 10. 待开发功能

系统当前已实现核心功能，但还有多项功能需要在后续迭代中开发。以下是规划的待开发功能列表及其优先级。

### 10.1 高优先级功能

#### 10.1.1 多编制类型工资计算引擎

- **描述**：开发灵活的计算引擎，能适应各种编制类型的工资计算规则
- **技术要点**：
  - 基于规则引擎实现可配置的计算逻辑
  - 支持公式定义和配置
  - 提供计算规则管理界面
- **工作量估计**：3-4周
- **技术负责人**：待定
- **相关文件**：`salary_system/webapp/calculation_engine.py`

#### 10.1.2 报表生成系统增强

- **描述**：扩展现有报表功能，支持更多报表类型和格式，增强Jimu报表集成
- **技术要点**：
  - 添加新的报表模板
  - 实现报表参数配置
  - 提供PDF、Excel等多种导出格式
  - 支持定时生成和发送报表
  - 优化Jimu报表单点登录集成
  - 增加Jimu报表参数传递功能
- **工作量估计**：2-3周
- **技术负责人**：待定
- **相关文件**：`salary_system/webapp/reports/`和`salary_system/frontend/salary-viewer/src/components/reports/JimuReportViewer.tsx`

#### 10.1.3 数据导入优化

- **描述**：优化Excel导入流程，提高容错性和处理速度
- **技术要点**：
  - 改进字段映射算法
  - 添加Excel数据预览功能
  - 实现数据验证和错误标记
  - 支持批量导入多个文件
- **工作量估计**：2周
- **技术负责人**：待定
- **相关文件**：`salary_system/webapp/file_converter.py`

### 10.2 中优先级功能

#### 10.2.1 数据分析和可视化

- **描述**：集成高级数据分析和可视化功能
- **技术要点**：
  - 集成或开发轻量级BI组件
  - 提供常见图表类型(柱状图、折线图、饼图等)
  - 支持自定义仪表盘
  - 添加数据下钻功能
- **工作量估计**：4-5周
- **技术负责人**：待定
- **相关文件**：`salary_system/frontend/salary-viewer/src/components/charts/`

#### 10.2.2 通知和提醒系统

- **描述**：实现系统通知和提醒功能
- **技术要点**：
  - 邮件通知系统
  - 站内消息
  - 工资单发布提醒
  - 任务和审批提醒
- **工作量估计**：2周
- **技术负责人**：待定
- **相关文件**：`salary_system/webapp/notification.py`

#### 10.2.3 审批工作流

- **描述**：增加工资数据和报表的审批流程
- **技术要点**：
  - 可配置的工作流引擎
  - 审批界面和状态管理
  - 审批历史记录
  - 多级审批支持
- **工作量估计**：3-4周
- **技术负责人**：待定
- **相关文件**：`salary_system/webapp/workflow/`

### 10.3 低优先级功能

#### 10.3.1 移动端应用

- **描述**：开发移动端应用，提供主要功能的移动访问
- **技术要点**：
  - React Native或Flutter应用
  - 响应式设计
  - 移动端认证
  - 离线数据支持
- **工作量估计**：6-8周
- **技术负责人**：待定
- **相关文件**：`salary_system/mobile_app/`

#### 10.3.2 高级用户个性化

- **描述**：提供更多用户个性化选项
- **技术要点**：
  - 自定义主题和布局
  - 用户偏好设置
  - 个性化仪表盘
  - 收藏和快速访问
- **工作量估计**：2-3周
- **技术负责人**：待定
- **相关文件**：`salary_system/frontend/salary-viewer/src/context/PreferencesContext.tsx`

#### 10.3.3 第三方系统集成

- **描述**：提供与人力资源系统、财务系统等第三方系统的集成
- **技术要点**：
  - 开发API集成接口
  - 数据同步机制
  - 认证集成(SSO)
  - 文件交换格式转换
- **工作量估计**：4-5周
- **技术负责人**：待定
- **相关文件**：`salary_system/webapp/integrations/`

### 10.4 开发路线图

```
Q3 2024 ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
         │ 多编制类型计算引擎  │ │ 报表生成系统增强    │ │ 数据导入优化        │
         └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                     │                     │                      │
                     ▼                     ▼                      ▼
Q4 2024 ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
         │ 数据分析和可视化    │ │ 通知和提醒系统      │ │ 审批工作流          │
         └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                     │                     │                      │
                     ▼                     ▼                      ▼
Q1 2025 ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
         │ 移动端应用         │ │ 高级用户个性化      │ │ 第三方系统集成      │
         └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### 10.5 技术债务

以下是需要在后续迭代中解决的技术债务：

1. **代码重构**：
   - 优化API结构，增加更多模块化路由
   - 重构前端状态管理，考虑使用Redux
   - 优化数据库查询性能

2. **测试覆盖率提升**：
   - 增加单元测试覆盖率(当前<40%)
   - 添加集成测试
   - 实现端到端测试

3. **文档完善**：
   - 完善API文档(使用Swagger)
   - 更新开发者文档
   - 编写用户操作手册

4. **安全加固**：
   - 进行全面安全审计
   - 实施更严格的输入验证
   - 增强敏感数据保护

### 10.6 Jimu报表集成详情

#### 10.6.1 Jimu报表概述

Jimu Reports 是一个开源的报表工具，提供丰富的报表设计和展示功能。在本系统中，我们通过iframe方式集成了Jimu报表，为用户提供强大的报表设计和查看能力。

#### 10.6.2 集成方式

- **认证集成**：通过JWT单点登录机制，实现系统与Jimu报表的无缝认证
- **嵌入方式**：使用iframe在前端页面中嵌入Jimu报表
- **数据连接**：Jimu报表直接连接系统数据库的视图

#### 10.6.3 主要功能

- 工资明细报表
- 部门汇总报表
- 趋势分析报表
- 自定义报表设计器(管理员使用)

#### 10.6.4 相关代码文件

- 前端集成：`salary_system/frontend/salary-viewer/src/components/reports/JimuReportViewer.tsx`
- 认证API：`salary_system/webapp/routers/jimu.py`

#### 10.6.5 待优化事项

- 提升iframe内报表加载速度
- 增强参数传递机制
- 实现报表预览图生成
- 添加报表权限细分控制

## 10.6 Jimu Reports 集成

系统通过 iframe 嵌入方式集成了 Jimu Reports 报表系统，用于提供各种格式的报表和数据可视化功能。

### 10.6.1 报表链接管理功能

系统新增了报表链接管理功能，允许管理员动态维护和配置可用的报表。此功能包括：

1. **报表链接数据库表**：
   - `report_links` 表存储所有报表的链接和元数据
   - 支持设置报表名称、URL、描述、分类、显示顺序和所需角色

2. **API端点**：
   - `/api/report-links/` - 创建、获取和管理报表链接
   - `/api/report-links/active` - 获取活跃的报表链接用于菜单显示
   - `/api/report-links/{report_link_id}` - 获取、更新和删除特定报表链接

3. **前端组件**：
   - `ReportLinkManager.tsx` - 报表链接管理界面，支持CRUD操作
   - `ReportViewer.tsx` - 动态报表查看器，根据ID查询链接并通过iframe显示报表
   - 基于用户角色的报表菜单生成

4. **权限控制**：
   - 报表链接管理仅对具有"Super Admin"角色的用户可用
   - 每个报表可以设置所需角色，只有符合角色要求的用户才能查看

5. **技术架构**：
   - 后端: FastAPI + SQLAlchemy ORM
   - 前端: React + Ant Design
   - 数据存储: PostgreSQL

这种设计允许系统灵活管理报表，无需在代码中硬编码iframe URL，同时提供了基于角色的访问控制。

### 10.6.2 Jimu Reports认证集成

// ... existing content ...

---

*文档最后更新时间：2024-06-07*

*文档维护人员：系统开发团队*

---
