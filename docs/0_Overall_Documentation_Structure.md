# 项目文档结构概览

本文档概述了 `docs/` 目录下各项文档的组织结构和主要内容。

## `/docs/` (根目录)

存放项目所有核心文档的顶层目录。

*   `CLEANUP_GUIDE.md`: 项目清理相关的指南。
*   `database_views.md`: 关于数据库视图的说明文档。
*   `docs_v2_backup_20250517_165421.tar.gz`: `docs/v2/` 旧版本文档的备份压缩包。
*   `ENV_VARIABLES.md`: 项目环境变量的说明文档。
*   `0_Overall_Documentation_Structure.md`: (本文档) 本项目整体文档结构的说明。
*   `openapi.json`: API接口的OpenAPI规范文档。
*   `common/`: 通用项目文档，适用于前后端或整个项目。
*   `backend/`: 后端相关的所有文档。
*   `frontend/`: 前端相关的所有文档。

## `/docs/common/`

存放项目通用的文档，如项目愿景、整体规范等。

*   `0_Project_Vision_and_Goals.md`: 项目的总体愿景、目标和核心信息。
*   `1_Documentation_Guide.md`: 项目本文档编写和管理的规范指南。
*   `2_Decision_Log.md`: 项目关键技术选型和决策的记录。

## `/docs/backend/`

存放所有与后端开发相关的文档。

*   `0_Overview_and_Roadmap.md`: 后端开发的总体概览、目标和路线图。
*   `1_Technical_Framework/`: 后端技术架构和核心技术细节。
*   `2_Development_Tasks_and_Phases/`: 后端开发任务、计划和阶段管理。
*   `3_Progress_Management/`: 后端开发进度跟踪和管理。

### `/docs/backend/1_Technical_Framework/`

详细定义后端的各项技术规范和设计。

*   `1.1_Backend_Architecture.md`: 后端整体架构设计、模块划分、核心组件等。
*   **数据库设计**: 数据库表结构、字段定义和关系在根目录的 `database_views.md` 文件中进行描述，该文件包含了系统中的主要数据库视图和其用途。
*   `1.4_Technology_Stack_and_Libraries.md`: 后端使用的主要技术栈、框架和关键库。
*   `1.5_Coding_Standards_and_Guidelines.md`: 后端代码编写规范、命名约定、最佳实践等。
*   `1.5_Environment_Setup_and_Deployment.md`: 环境设置和部署相关信息。
*   `1.6_Development_Environment_Setup.md`: 后端开发环境搭建指南、依赖安装、部署流程等。
*   `1.7_Payroll_System_Design.md`: 薪资系统设计文档，包括数据库结构、API设计和开发路线图。

### `/docs/backend/2_Development_Tasks_and_Phases/`

管理后端的开发任务和迭代计划。

*   `2.1_Current_Development_Plan.md`: 当前后端开发阶段的详细计划和任务分配。
*   `2.2_Feature_Backlog.md`: 后端功能需求列表和待办事项。
*   `2.3_Phase_Archive/`: (目录) 过往开发阶段的计划和任务归档。

### `/docs/backend/3_Progress_Management/`

跟踪和报告后端开发进度。

*   `3.1_Periodic_Status_Reports/`: (目录) 定期的后端开发状态报告。
*   `3.2_Meeting_Notes/`: (目录) 后端相关的会议纪要。

## `/docs/frontend/`

存放所有与前端开发相关的文档。

*   `0_Overview_and_Roadmap.md`: 前端开发的总体概览、目标和路线图。
*   `1_Technical_Framework/`: 前端技术架构和核心技术细节。
*   `2_Development_Tasks_and_Phases/`: 前端开发任务、计划和阶段管理。
*   `3_Progress_Management/`: 前端开发进度跟踪和管理。

### `/docs/frontend/1_Technical_Framework/`

详细定义前端的各项技术规范和设计。

*   `1.1_Frontend_Architecture.md`: 前端整体架构设计、项目结构、组件化策略等。
*   `1.2_Technology_Stack_and_Libraries.md`: 前端使用的主要技术栈、框架（React, Vite）和关键库。
*   `1.3_Coding_Standards_and_Guidelines.md`: 前端代码编写规范、TypeScript 使用、组件命名等。
*   `1.4_Development_Environment_Setup.md`: 前端开发环境配置、Node.js 版本、Vite 构建流程等。
*   `1.5_UI_Design_and_Guidelines.md`: UI 设计原则、组件库使用、整体视觉风格指南。
*   `1.6_Routing_and_Authorization.md`: 前端路由配置、页面导航、权限控制机制。
*   `1.7_State_Management.md`: 状态管理方案的设计和使用。
*   `1.8_API_Integration.md`: 前端与后端 API 的集成方式、数据获取和提交策略。
*   `1.9_Styling_and_Theming.md`: CSS 模块化、预处理器使用、主题化方案。
*   `1.10_Data_Visualization.md`: 图表库选择和使用、数据可视化组件规范。
*   `1.11_Performance_Optimization.md`: 前端性能优化策略。
*   `1.12_Error_Handling_and_Logging.md`: 前端错误捕获、处理机制及日志记录方案。
*   `1.13_Security_Considerations.md`: 前端安全措施。
*   `1.14_Testing_Strategy.md`: 前端测试策略和工具。
*   `1.15_Deployment_Process.md`: 前端应用的构建和部署流程。
*   `1.16_Internationalization.md`: 国际化（i18n）方案和实现。

### `/docs/frontend/2_Development_Tasks_and_Phases/`

管理前端的开发任务和迭代计划。

*   `2.1_Current_Development_Plan.md`: 当前前端开发阶段的详细计划和任务分配。
*   `2.2_Feature_Backlog.md`: 前端功能需求列表和待办事项。
*   `2.2_Module_Completion_Status.md`: 模块完成状态跟踪。
*   `2.3_Phase_Archive/`: (目录) 过往开发阶段的计划和任务归档。

### `/docs/frontend/3_Progress_Management/`

跟踪和报告前端开发进度。

*   `3.1_Periodic_Status_Reports/`: (目录) 定期的前端开发状态报告。
*   `3.2_Meeting_Notes/`: (目录) 前端相关的会议纪要。 