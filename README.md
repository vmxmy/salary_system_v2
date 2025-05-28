# 高新区工资信息管理系统 (Salary Information Management System)

## 项目概述

高新区工资信息管理系统是一个全面的薪资信息管理解决方案，为高新区提供员工信息管理、薪资数据导入、计算、审批、报表生成和工资单电子邮件分发等功能，从而提高薪资管理的效率和准确性。

系统目标是成为高新区乃至更广泛区域内一个高效、安全且用户友好的薪资信息管理平台，为企业和员工提供优质服务。

## 主要功能

- **员工信息管理**：管理员工基本信息、合同、职位历史和薪酬等
- **薪资数据处理**：支持导入、合并、计算各类薪资数据
- **薪资核算**：处理薪资周期、薪资计算、工资单生成和银行导出文件
- **休假管理**：管理休假类型、员工休假余额、休假申请和审批
- **系统配置**：管理查询值、系统参数、薪资字段定义、税率/社保费率
- **报表与分析**：提供数据报表和仪表板
- **角色与权限**：基于角色的权限管理系统

## 技术栈

### 后端

- **核心框架**：FastAPI, Python
- **数据库**：PostgreSQL
- **ORM**：SQLAlchemy
- **数据库迁移**：Alembic
- **身份验证**：JWT
- **API文档**：Swagger UI / ReDoc (FastAPI自动生成)

### 前端 (V2)

- **核心框架**：React 18
- **编程语言**：TypeScript
- **构建工具**：Vite
- **UI组件库**：Ant Design
- **状态管理**：Zustand / Redux Toolkit
- **路由**：React Router
- **HTTP客户端**：Axios
- **图表**：@ant-design/charts
- **表格处理**：xlsx

## 系统架构

### 后端架构

采用分层架构设计：
- **API层**：处理HTTP请求、请求验证、认证和路由
- **服务层**：封装核心业务逻辑，协调操作
- **数据访问层**：负责所有数据库交互
- **数据库层**：用于所有应用数据的持久存储

### 前端架构

基于组件化设计：
- **API服务层**：封装所有后端API调用
- **组件**：可复用UI组件，包括通用基础组件、布局组件、业务组件等
- **页面**：组合通用组件和业务组件，构成完整页面视图
- **状态管理**：使用Zustand/Redux Toolkit进行全局状态管理
- **路由管理**：集中管理应用路由，包含权限控制

## 开发环境设置

### 前提条件

- Python 3.9+
- PostgreSQL 13+
- Node.js 16+
- npm 8+ 或 Yarn


## 项目文档

详细的项目文档位于 `docs/` 目录：

- **通用文档**：`docs/common/`
- **后端文档**：`docs/backend/`
- **前端文档**：`docs/frontend/`

主要文档包括：
- 项目愿景与目标：`docs/common/0_Project_Vision_and_Goals.md`
- 后端架构：`docs/backend/1_Technical_Framework/1.1_Backend_Architecture.md`
- 前端架构：`docs/frontend/1_Technical_Framework/1.1_Frontend_Architecture.md`
- 技术栈和库：`docs/frontend/1_Technical_Framework/1.2_Technology_Stack_and_Libraries.md`

## 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件
