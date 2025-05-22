# 0. 项目文档结构总览

本文档提供高新区工资信息管理系统项目文档的总体结构和导航指南。项目文档分为三大类：通用文档、后端文档和前端文档。

## 文档组织结构

```
docs/
├── 0_Overall_Documentation_Structure.md  # 本文件：文档结构总览
├── ENV_VARIABLES.md                      # 环境变量配置说明
├── CLEANUP_GUIDE.md                      # 代码清理指南
├── database_views.md                     # 数据库视图说明
├── openapi.md                            # API文档
├── common/                               # 通用文档
│   ├── 0_Project_Vision_and_Goals.md     # 项目愿景与目标
│   ├── 1_Documentation_Guide.md          # 文档编写指南
│   └── 2_Decision_Log.md                 # 关键决策记录
├── backend/                              # 后端文档
│   ├── 0_Overview_and_Roadmap.md         # 后端概述与路线图
│   ├── 1_Technical_Framework/            # 技术框架文档
│   │   ├── 1.1_Backend_Architecture.md   # 后端架构
│   │   ├── 1.4_Technology_Stack_and_Libraries.md # 技术栈与库
│   │   ├── 1.5_Coding_Standards_and_Guidelines.md # 编码标准
│   │   ├── 1.5_Environment_Setup_and_Deployment.md # 环境设置与部署
│   │   ├── 1.6_Development_Environment_Setup.md # 开发环境设置
│   │   └── 1.7_Payroll_System_Design.md # 薪资系统设计
│   ├── 2_Development_Tasks_and_Phases/   # 开发任务与阶段
│   │   └── 2.3_Phase_Archive/           # 历史阶段存档
│   └── 3_Progress_Management/            # 进度管理
│       ├── 3.1_Periodic_Status_Reports/  # 定期状态报告
│       └── 3.2_Meeting_Notes/            # 会议记录
└── frontend/                            # 前端文档
    ├── 0_Overview_and_Roadmap.md         # 前端概述与路线图
    ├── 1_Technical_Framework/            # 技术框架文档
    │   ├── 1.1_Frontend_Architecture.md  # 前端架构
    │   ├── 1.2_Technology_Stack_and_Libraries.md # 技术栈与库
    │   ├── 1.3_Coding_Standards_and_Guidelines.md # 编码标准
    │   ├── 1.4_Development_Environment_Setup.md # 开发环境设置
    │   ├── 1.5_UI_Design_and_Guidelines.md # UI设计与指南
    │   ├── 1.6_Routing_and_Authorization.md # 路由与授权
    │   ├── 1.7_State_Management.md       # 状态管理
    │   ├── 1.8_API_Integration.md        # API集成
    │   ├── 1.9_Styling_and_Theming.md    # 样式与主题
    │   ├── 1.10_Data_Visualization.md    # 数据可视化
    │   ├── 1.11_Performance_Optimization.md # 性能优化
    │   ├── 1.12_Error_Handling_and_Logging.md # 错误处理与日志
    │   ├── 1.13_Security_Considerations.md # 安全考虑
    │   ├── 1.14_Testing_Strategy.md      # 测试策略
    │   ├── 1.15_Deployment_Process.md    # 部署流程
    │   ├── 1.16_Internationalization.md  # 国际化
    │   └── 5_UI_Components_Guide.md      # UI组件指南
    ├── 2_Development_Tasks_and_Phases/   # 开发任务与阶段
    │   └── 2.3_Phase_Archive/            # 历史阶段存档
    └── 3_Progress_Management/            # 进度管理
        ├── 3.1_Periodic_Status_Reports/  # 定期状态报告
        └── 3.2_Meeting_Notes/            # 会议记录
```

## 如何使用本文档库

1. **新团队成员入职**：首先阅读 `common/0_Project_Vision_and_Goals.md` 了解项目愿景，然后查看各自领域的概述与路线图文档。

2. **开发人员日常参考**：
   - 后端开发人员：主要参考 `backend/1_Technical_Framework/` 下的技术文档
   - 前端开发人员：主要参考 `frontend/1_Technical_Framework/` 下的技术文档

3. **项目管理与进度跟踪**：查看 `backend/3_Progress_Management/` 和 `frontend/3_Progress_Management/` 下的进度报告和会议记录

4. **技术决策参考**：查看 `common/2_Decision_Log.md` 了解项目关键技术决策及其理由

## 文档维护原则

1. 所有文档应遵循 `common/1_Documentation_Guide.md` 中规定的格式和标准

2. 文档更新应与代码更新同步，确保文档始终反映当前系统状态

3. 重大变更应同时更新相关文档并在 `common/2_Decision_Log.md` 中记录决策过程

4. 定期（建议每季度）审查文档以确保其准确性和完整性

## 缺失文档清单

以下是当前需要补充的关键文档：

1. 后端数据库设计文档 (`backend/1_Technical_Framework/1.2_Database_Design.md`)
2. API设计与规范文档 (`backend/1_Technical_Framework/1.3_API_Design.md`)
3. 后端测试策略文档 (`backend/1_Technical_Framework/1.8_Testing_Strategy.md`)
