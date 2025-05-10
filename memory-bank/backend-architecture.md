# 高新区工资信息管理系统 - 后端架构文档

## 1. 概述

本项目后端基于FastAPI框架构建，采用模块化设计，核心功能包括用户认证授权、员工管理、组织结构管理（单位、部门）、薪资数据管理、工资计算引擎以及文件转换等。数据存储使用PostgreSQL数据库，并通过SQLAlchemy ORM进行访问。

## 2. 技术栈

- **框架**: FastAPI
- **语言**: Python 3.10+
- **数据库**: PostgreSQL 14+
- **ORM**: SQLAlchemy 2.0+
- **认证**: JWT (JSON Web Token)
- **密码哈希**: Passlib (bcrypt)
- **数据转换**: Pandas (用于文件转换)
- **数据转换工具**: dbt (用于数据模型转换和构建)
- **环境管理**: Conda

## 3. 目录结构 (`webapp/`)

- `auth.py`: 用户认证和授权逻辑。
- `crud.py`: 数据库CRUD操作函数（主要针对计算规则和公式）。
- `database.py`: 数据库连接和会话管理。
- `file_converter.py`: 文件格式转换逻辑（例如Excel转CSV）。
- `main.py`: FastAPI应用入口，注册路由器、配置中间件。
- `models.py`: SQLAlchemy ORM模型定义。
- `models_db.py`: 数据库操作函数（主要针对核心业务实体如员工、部门、单位等）。
- `schemas.py`: Pydantic数据模型定义（用于请求/响应验证和数据序列化）。
- `core/`: 核心业务逻辑模块。
  - `calculation_engine.py`: 工资计算引擎，根据规则和公式计算工资。
  - `config.py`: 应用配置加载。
  - `salary_writer.py`: 将计算结果写入数据库。
- `pydantic_models/`: 细分的Pydantic模型定义。
- `routers/`: API路由定义模块。
  - `auth_management.py`: 认证相关API（如获取token）。
  - `calculation_rules_admin.py`: 计算规则和公式管理API。
  - `config_management.py`: 配置管理API（如字段映射）。
  - `departments.py`: 部门管理API。
  - `employees.py`: 员工管理API。
  - `file_conversion.py`: 文件转换API。
  - `report_links.py`: 报表链接管理API。
  - `salary_calculation.py`: 工资计算触发API。
  - `salary_data.py`: 薪资数据查询API。
  - `table_configs.py`: 表格配置API。
  - `units.py`: 单位管理API。
  - `user_management.py`: 用户管理API。
- `scripts/`: 后端初始化脚本。
- `utils/`: 工具函数。
  - `formula_parser.py`: 用于安全地解析和评估计算公式。

## 4. API端点结构

API端点通过 `webapp/routers/` 目录下的各个模块进行组织。`main.py` 负责将这些路由器包含到主应用中。

主要API前缀和功能：

- `/token`: 认证，获取JWT。
- `/api/users`: 用户管理。
- `/api/employees`: 员工管理。
- `/api/units`: 单位管理。
- `/api/departments`: 部门管理。
- `/api/report-links`: 报表链接管理。
- `/api/salary_data`: 薪资数据查询、发薪期列表、字段定义等。
- `/api/config`: 配置管理（字段映射、工作表映射等）。
- `/api/file-conversion`: 文件转换。
- `/api/v1/calculation-rules`: 计算规则管理。
- `/api/v1/calculation-formulas`: 计算公式管理。
- `/api/v1/salary-calculation`: 触发工资计算。
- `/api/table-configs`: 表格配置管理。
- `/api/dbt/trigger-run`: 手动触发dbt构建。
- `/api/debug/field-config/{employee_type_key}`: 调试端点，获取字段配置。
- `/api/email-configs`: 邮件服务器配置管理。
- `/api/email-tasks`: 邮件发送任务管理。

FastAPI自动生成OpenAPI文档，可通过 `/docs` (Swagger UI) 和 `/redoc` (ReDoc) 访问。

## 5. 核心数据流

1. **数据导入**: 原始薪资数据（Excel/CSV）通过文件转换API (`/api/file-conversion`) 上传和处理，转换为标准格式并存储到 `staging` 模式下的暂存表（如 `raw_salary_data_staging`）。
2. **数据整合**: dbt工具负责将来自不同暂存表的数据进行整合和转换，生成 `staging.consolidated_data` 表。这个过程通过手动触发 (`/api/dbt/trigger-run`) 或其他自动化方式启动。
3. **工资计算**:
   - 用户通过API (`/api/v1/salary-calculation`) 触发单个员工或批量员工的工资计算。
   - `calculation_engine.py` 获取员工信息、组织结构、编制类型等上下文数据。
   - 从数据库加载激活的计算规则 (`payroll.calculation_rules`) 和公式 (`payroll.calculation_formulas`)。
   - 遍历规则，检查条件 (`payroll.calculation_rule_conditions`)，如果满足则应用公式或固定值计算目标字段。
   - 计算结果由 `salary_writer.py` 写入 `payroll.calculated_salary_records` 表。
4. **数据查询**: 前端通过 `/api/salary_data` 等端点查询整合后的原始数据 (`staging.consolidated_data`) 或计算后的工资数据 (`payroll.calculated_salary_records`)。查询支持分页、过滤等。

## 6. 数据库访问模式

- 使用SQLAlchemy ORM进行数据库交互。
- `database.py` 提供 `get_db` 依赖项，用于在每个请求中获取独立的数据库会话。
- `crud.py` 和 `models_db.py` 封装了具体的数据库操作逻辑，供路由器调用。
- 使用了SQLAlchemy的关系特性 (`relationship`) 进行模型关联查询（例如在获取员工时加载部门信息）。
- 在需要高性能的场景（如获取发薪期列表），使用了 `sqlalchemy.text` 执行原始SQL查询。
- 写入计算结果时，使用了PostgreSQL的UPSERT (`INSERT ... ON CONFLICT DO UPDATE`) 机制，确保幂等性。

## 7. 认证授权机制

- **认证**: 基于JWT。用户通过 `/token` 端点使用用户名和密码获取访问令牌。令牌包含用户ID、用户名和角色信息。
- **授权**:
  - 使用 `auth.get_current_user` 依赖项验证请求的JWT，并加载当前用户对象。
  - 使用 `auth.require_role` 依赖项工厂，根据端点需求检查当前用户的角色是否在允许的角色列表中。如果用户没有所需角色，返回403 Forbidden错误。
  - 角色信息存储在数据库的 `core.roles` 表中，用户与角色通过 `core.users` 表关联。

## 8. 异常处理

- 应用中广泛使用 `try...except` 块捕获数据库错误 (`SQLAlchemyError`, `IntegrityError`) 和其他潜在异常。
- 捕获到的错误通常会转换为 `fastapi.HTTPException` 并返回给客户端，包含适当的状态码和详细信息。
- 使用Python的 `logging` 模块记录错误和关键事件。
- 对于关键操作，使用事务确保数据一致性，在出错时回滚。

## 9. 核心业务逻辑 (工资计算)

工资计算是后端的关键业务逻辑，主要在 `webapp/core/calculation_engine.py` 中实现。

- **规则驱动**: 计算过程完全由数据库中配置的计算规则 (`payroll.calculation_rules`) 驱动。
- **优先级**: 规则按优先级 (`priority` 字段) 从低到高执行，确保依赖关系的正确处理（例如，先计算基本工资，再计算基于基本工资的社保）。
- **条件判断**: 每个规则可以有一组条件 (`payroll.calculation_rule_conditions`)。只有当所有条件都满足时，规则才会被触发。条件判断基于员工上下文数据（包括已计算出的中间结果）。
- **公式评估**: 使用 `utils.formula_parser.safe_evaluate_formula` 安全地评估规则中定义的公式表达式。公式可以使用上下文中的字段名作为变量。
- **上下文更新**: 每个规则计算出的结果会立即更新到计算上下文中，供后续规则使用。
- **可配置性**: 计算规则、公式和字段映射都存储在数据库中，可以通过API进行管理，提高了系统的灵活性和可配置性。

## 10. API文档生成

FastAPI自动生成符合OpenAPI规范的交互式API文档：

- Swagger UI: `/docs`

- ReDoc: `/redoc`

这些文档详细列出了所有API端点、参数、响应模型、认证要求等。

## 11. 邮件服务

- **邮件服务器配置**: 通过 `core.email_server_configs` 表存储SMTP服务器配置，支持多个服务器配置。
- **密码加密**: 使用Fernet对称加密存储SMTP服务器密码，确保安全性。
- **邮件发送任务**: 通过 `core.email_sending_tasks` 表管理邮件发送任务，支持批量发送和模板替换。
- **邮件日志**: 通过 `core.email_logs` 表记录邮件发送历史，包括发送状态和错误信息。
  - 日志记录字段包括：发送者邮箱、收件人邮箱列表、主题、内容、发送状态、发送时间、错误信息等
  - 支持通过任务UUID查询特定任务的邮件发送日志
  - 提供分页API接口，支持按时间倒序排列
  - 支持从邮件主题中提取收件人姓名，便于前端展示
- **后台任务**: 使用FastAPI的BackgroundTasks处理邮件发送，避免阻塞API响应。
- **邮件模板**: 支持使用变量替换的邮件模板，如 `{pay_period}` 和 `{employee_name}`。
- **错误处理**: 完善的错误处理机制，记录发送失败原因，支持跳过无邮箱的员工。

## 12. 总结

后端架构采用标准的FastAPI项目结构，通过路由器组织API，使用SQLAlchemy ORM访问PostgreSQL数据库。核心业务逻辑（工资计算）通过可配置的规则引擎实现，提高了系统的灵活性。认证授权机制基于JWT和角色控制。异常处理通过捕获并返回HTTPException实现。dbt用于数据整合和转换。系统还提供了邮件服务功能，支持工资条发送等业务场景。
