# 上下文
文件名：hr_module_ui_design.md
创建于：{{NOW}}
创建者：AI Assistant
Yolo模式：false

# 任务描述
创建人事管理（顶级菜单）各界面设计。
我们将详细设计 HR 角色的功能模块界面。

14.1 员工档案管理模块界面
* 员工列表页面:
   * 布局: 页面主体是员工列表表格。上方是搜索和过滤区域，以及"新建员工"按钮。
   * 搜索/过滤区域: 使用 Ant Design Form, Input, Select, DatePicker 组件。过滤条件包括姓名、工号、部门（使用部门树选择组件）、状态（使用查找值下拉选择）、入职日期范围。
   * "新建员工"按钮: 可见性由权限 (employee:create) 控制。点击后弹出"新建员工"模态框或跳转到新建员工页面。
   * 员工列表表格: 使用 Ant Design Table。
      * 列: 显示关键员工信息，如姓名、工号、当前部门、当前职位、状态、入职日期。
      * 数据源: 从 GET /v2/employees API 获取数据，支持分页和排序。
      * 操作列: 包括"查看详情"、"编辑"、"删除"按钮。可见性由权限 (employee:view, employee:edit, employee:delete) 控制。
         * 点击"查看详情"导航到员工详情页面。
         * 点击"编辑"弹出编辑员工模态框或导航到编辑页面。
         * 点击"删除"弹出确认对话框。
   * 分页: 表格下方显示分页控件。
* 员工详情页面:
   * 布局: 使用 Ant Design Tabs 组件在不同的员工信息类别之间切换。页面顶部区域可以突出显示员工姓名和工号。
   * 标签页:
      * 基本信息: 使用 Ant Design Descriptions 或只读 Form 字段展示个人和联系方式详情。字段包括姓名、工号、身份证号、出生日期、性别、国籍、文化程度、备注、地址、电话号码、电子邮箱。包含一个部分或链接用于管理银行账户信息。
      * 职务信息: 使用 Descriptions 或只读 Form 字段展示职务相关属性。字段包括入职日期、当前状态、编制类型、参加工作时间、工龄（计算得出）、人员身份。
      * 岗位历史: 展示员工岗位变动记录的表格 (hr.employee_job_history)。列包括部门、职位、汇报对象、地点、生效日期、结束日期。提供添加、编辑、删除历史记录条目的按钮（可见性由权限 employee:manage_job_history 控制）。
      * 合同信息: 展示员工合同记录的表格 (hr.employee_contracts)。列包括合同类型、开始日期、结束日期、签署日期、记录生效日期、记录结束日期。提供添加、编辑、删除合同条目的按钮（可见性由权限 employee:manage_contracts 控制）。
      * 薪酬历史: 展示员工薪酬变动记录的表格 (hr.employee_compensation_history)。列包括薪资金额、币种、支付频率、生效日期、结束日期。提供添加、编辑、删除薪酬条目的按钮（可见性由权限 employee:manage_compensation 控制）。
      * 假期余额: 展示员工各类假期当前余额的表格或列表 (hr.employee_leave_balances)。列包括假期类型、当前余额、最后更新日期。提供手动调整余额的按钮（可见性由权限 leave:adjust_balance 控制）。
      * 其他标签页（可选）: 教育经历、工作经历（外部）、证书资质等（如果这些信息需要管理）。
   * 编辑/保存按钮: 在每个可编辑的标签页或页面上，提供"编辑"和"保存"按钮。"编辑"切换显示为可编辑表单。"保存"通过相应的 API (PUT 或 PATCH 到 /v2/employees/{employeeId}、/v2/employee-job-history/{historyId} 等）提交更改。按钮可见性由权限控制。
* 新建/编辑员工模态框（或页面）:
   * 类型: 可以是模态框 (Modal) 或独立页面。考虑到信息量，独立页面可能更合适。
   * 表单: 使用 Ant Design Form。
      * 字段: 包括所有基本信息、联系方式以及初始职务/合同/薪酬详情的输入字段。使用适当的 Ant Design 控件（Input、DatePicker、用于查找值的 Select、用于部门/职位选择的自定义组件）。
      * 校验: 实现表单校验。
   * 按钮: "提交"（调用 POST /v2/employees 或 PUT /v2/employees/{employeeId} API）、"取消"。
* 删除员工确认对话框:
   * 使用 Ant Design Modal.confirm。警告删除将影响关联数据。确认后调用 DELETE /v2/employees/{employeeId} API。

# 项目概述
用户正在开发一个薪酬管理系统，当前任务是设计人事管理模块的前端界面。项目前端技术栈包含 React 和 Ant Design。

⚠️ 警告：切勿修改此部分 ⚠️
RIPER-5 + O1 THINKING + AGENT EXECUTION PROTOCOL (OPTIMIZED)
核心原则: 系统思维, 辩证思维, 创新思维, 批判思维.
模式: RESEARCH (信息收集) -> INNOVATE (头脑风暴) -> PLAN (详细规范) -> EXECUTE (实施) -> REVIEW (验证).
严格遵循模式流程和指南。自动模式转换。
在EXECUTE模式中精确执行计划。在REVIEW模式中标记任何偏差。
代码块格式: \`\`\`language:file_path
编辑指南: 仅显示必要修改，提供上下文。
禁止行为: 未验证依赖，不完整功能，未测试代码等。
任务文件用于跟踪。
⚠️ 警告：切勿修改此部分 ⚠️

# 分析
用户需求已在"任务描述"中详细列出。核心是为"员工档案管理"模块设计四个主要UI组件/页面：
1.  **员工列表页面**: 搜索、过滤、表格展示、操作（新建、查看、编辑、删除）。
2.  **员工详情页面**: Tabs结构，展示基本信息、职务信息、岗位历史、合同信息、薪酬历史、假期余额等。
3.  **新建/编辑员工页面/模态框**: 表单，用于创建和修改员工核心信息。
4.  **删除员工确认对话框**: 标准确认流程。

关键技术和组件包括：
*   Ant Design: Layout, Menu, Table, Form, Input, Select, DatePicker, Tabs, Descriptions, Modal, Button, Breadcrumb。
*   权限控制: 需要在多个操作点（按钮可见性、API调用权限）集成。
*   API 交互: 明确了多个API端点。
*   自定义组件可能需要：部门树选择器。
*   状态管理：用于查找值（如员工状态、合同类型等），可沿用`zustand`。
*   数据获取：可使用`axios`或`fetch`，考虑配合`react-query`或`SWR`进行优化。
*   路由: `react-router-dom`。

前端文件根路径: `/Users/xumingyang/app/高新区工资信息管理/salary_system/frontend/v2`
建议模块路径: `src/pages/HRManagement` 或 `src/modules/hr`

后续步骤将涉及为这些界面提出具体的设计方案和组件结构。

# 提议的解决方案
基于对需求的理解和现有技术栈，提议以下设计和实施方向：

**1. 整体模块结构与路由设计:**
   *   在 `frontend/v2/src/pages/`下创建新目录 `HRManagement` (或 `frontend/v2/src/modules/hr`，为保持一致性，若已有 `modules` 结构则优先使用，否则 `pages` 更常见)。
   *   **人事管理根路由**: `/hr` (或 `/personnel`)
   *   **员工档案子路由**:
        *   员工列表: `/hr/employees` (组件: `EmployeeListPage.tsx`)
        *   新建员工: `/hr/employees/new` (组件: `CreateEmployeePage.tsx`)
        *   员工详情: `/hr/employees/:employeeId` (组件: `EmployeeDetailPage.tsx`)
            *   详情页内可使用 Tabs，不一定需要子路由，但若信息模块非常复杂也可考虑。
        *   编辑员工: `/hr/employees/:employeeId/edit` (组件: `EditEmployeePage.tsx`)
   *   新的顶级菜单项 "人事管理" 将链接到 `/hr/employees`。

**2. 组件设计与技术选型:**
   *   **员工列表页面 (`EmployeeListPage.tsx`):**
        *   `EmployeeFilterForm.tsx`: Ant Design `Form` (layout="inline") 包含 `Input` (姓名, 工号), `TreeSelect` (部门, 自定义或 antd), `Select` (状态, 来源于 lookup/store), `DatePicker.RangePicker` (入职日期)。
        *   `EmployeeTable.tsx`: Ant Design `Table`，列定义如需求所述，操作列使用 `Space` 和 `Button` (根据权限 `usePermissions` 控制显隐)。数据通过 API (`GET /v2/employees`) 获取，支持分页和排序参数。
        *   "新建员工"按钮: `Button`，根据权限 (`employee:create`) 控制显隐，点击导航到 `/hr/employees/new`。
   *   **新建/编辑员工页面 (`CreateEmployeePage.tsx`, `EditEmployeePage.tsx`):**
        *   建议使用独立页面而非模态框。
        *   `EmployeeForm.tsx`: Ant Design `Form`，包含所有相关字段。部门、职位等使用 `TreeSelect`或级联`Select`。查找值使用 `Select`。实现表单校验。
        *   提交按钮调用相应 API (`POST /v2/employees` 或 `PUT /v2/employees/:employeeId`)。
   *   **员工详情页面 (`EmployeeDetailPage.tsx`):**
        *   顶部显示员工姓名、工号等。
        *   Ant Design `Tabs` 切换不同信息模块:
            *   **基本信息 (`BasicInfoTab.tsx`):** Ant Design `Descriptions` 或只读 `Form` 展示。
            *   **职务信息 (`JobInfoTab.tsx`):** 同上。
            *   **岗位历史 (`JobHistoryTab.tsx`):** Ant Design `Table` 展示历史记录，表格上方提供"添加记录"按钮 (权限 `employee:manage_job_history`) 打开模态框 `JobHistoryFormModal.tsx` (包含Form用于增改)。行操作包含编辑、删除按钮。
            *   **合同信息 (`ContractsTab.tsx`):** 类似岗位历史，使用 `Table` 和 `ContractFormModal.tsx` (权限 `employee:manage_contracts`)。
            *   **薪酬历史 (`CompensationHistoryTab.tsx`):** 类似岗位历史，使用 `Table` 和 `CompensationFormModal.tsx` (权限 `employee:manage_compensation`)。
            *   **假期余额 (`LeaveBalanceTab.tsx`):** `Table` 或 `List` 展示，"调整余额"按钮 (权限 `leave:adjust_balance`) 打开模态框 `AdjustLeaveBalanceModal.tsx`。
        *   每个可编辑的标签页或整个页面级别应有清晰的编辑入口，例如详情页顶部统一的"编辑此员工信息"按钮，点击后导航到 `/hr/employees/:employeeId/edit`，或者在各 Tab 内提供针对该部分信息的编辑功能（若API支持分块更新）。考虑到用户需求中"编辑/保存按钮: 在每个可编辑的标签页或页面上"，后者更灵活。如果各部分信息可以独立更新，则在各Tab内提供编辑入口，打开相应的编辑模态框或小表单。如果期望一次性编辑多项，则倾向于导航到统一的编辑页面。
   *   **删除确认**: Ant Design `Modal.confirm`。

**3. 权限集成:**
   *   使用 `usePermissions` hook (`hasPermission`, `hasRole`) 来控制按钮的显隐和路由的可访问性。
   *   API 调用层面后端会再次校验权限。

**4. 数据流与状态管理:**
   *   使用 `zustand` 或 `React Context` + `useState/useReducer` 管理局部UI状态和从API获取的查找代码等。
   *   推荐使用 `SWR` 或 `React Query` 进行 API 数据获取，简化缓存、轮询、依赖查询等。若项目已有成熟方案则沿用。

**5. 开发步骤建议:**
   *   a. 定义路由结构和创建页面/组件骨架文件。
   *   b. 实现员工列表页面 (过滤、表格、分页、基本操作按钮的显隐)。
   *   c. 实现新建员工页面与表单。
   *   d. 实现员工详情页面的基本布局和各只读信息标签页。
   *   e. 实现编辑员工页面与表单。
   *   f. 逐步为详情页的岗位历史、合同、薪酬、假期等模块添加增删改功能及对应的模态框表单。
   *   g. 完善所有权限控制逻辑。
   *   h. 编写单元/集成测试。

**6. 注意事项与潜在挑战:**
    *   部门树选择组件：可能需要一个良好交互的树形选择器，如果 Ant Design `TreeSelect` 不能完全满足层级展示或搜索需求，可能需要自定义或寻找第三方增强组件。
    *   复杂的表单校验逻辑。
    *   大量API接口的对接和管理。
    *   权限组合场景下的UI展示。

这个方案旨在提供一个清晰的起点和结构。具体实现时，可以根据开发过程中的实际情况进行调整。

**7. 实施检查清单 (Plan for EXECUTE phase):**
**前端文件根路径**: `/Users/xumingyang/app/高新区工资信息管理/salary_system/frontend/v2`
**模块路径**: `src/pages/HRManagement`

**阶段一：UI 骨架与 Mock 实现 (已完成)**
1.  **项目设置与目录结构** (已完成)
2.  **类型定义 (初步)** (已完成)
3.  **路由配置 (骨架)** (已完成)
4.  **员工列表页面 (骨架与Mock)** (已完成)
5.  **可复用员工表单 (骨架与Mock)** (已完成)
6.  **新建员工页面 (骨架与Mock)** (已完成)
7.  **编辑员工页面 (骨架与Mock)** (已完成)
8.  **员工详情页面 (骨架与Tabs)** (已完成)
9.  **员工详情 - 模块骨架 (各Tabs)** (已完成)

**阶段二：API 集成、权限与复杂控件 (进行中)**
1.  **服务层与类型扩展**: (已完成 ✅)
2.  **组件更新 - 员工列表页面**: (已完成 ✅)
3.  **组件更新 - 员工详情页面与标签页**:
    *   ✅ `EmployeeDetailPage.tsx`: 使用真实的 `employeeService.getEmployeeById`。对"编辑员工"按钮应用 `usePermissions`。
    *   ✅ `BasicInfoTab.tsx`: (主要是数据显示，确保从 `EmployeeDetailPage` 正确接收和展示数据)。
    *   ✅ `JobInfoTab.tsx`: (同上)。
    *   ✅ `JobHistoryTab.tsx`: 使用真实的 `employeeService.getEmployeeJobHistory`。对相关操作按钮应用 `usePermissions`。实现分页。
    *   ✅ `ContractInfoTab.tsx`: 使用真实的 `employeeService.getEmployeeContracts`。对相关操作按钮应用 `usePermissions`。实现分页。
    *   ✅ `CompensationHistoryTab.tsx`: 使用真实的 `employeeService.getEmployeeCompensationHistory`。对相关操作按钮应用 `usePermissions`。实现分页。
    *   ✅ `LeaveBalanceTab.tsx`: 使用真实的 `employeeService.getEmployeeLeaveBalances`。对相关操作按钮应用 `usePermissions`。实现分页。
4.  **组件更新 - 新建/编辑员工页面与表单**: (已完成 ✅)
5.  **权限细化**:
    *   全面审查并应用 `usePermissions` 到所有相关操作。
6.  **错误处理与用户反馈**:
    *   在 API 调用失败时，提供用户友好的错误消息。
    *   在数据加载时显示加载指示器。

**阶段三：高级功能与优化 (后续)**
*   实现员工详情页内各模块（岗位、合同等）的完整 CRUD 操作及模态框。
*   集成实际的部门/职位选择组件（如果 `TreeSelect` 不够用）。
*   实现更复杂的排序和过滤逻辑。
*   国际化/本地化支持。
*   性能优化 (代码分割、懒加载等)。
*   全面的单元和集成测试。

# 当前执行步骤："阶段三：高级功能与优化 - 1. 实现员工详情各 Tab 内 CRUD 操作"

# 任务进度
[{{NOW}}]
- 修改：`frontend/v2/src/pages/HRManagement/employees/EmployeeListPage.tsx`, `frontend/v2/src/pages/HRManagement/components/EmployeeTable.tsx`, `frontend/v2/src/pages/HRManagement/components/EmployeeFilterForm.tsx`, `frontend/v2/src/services/employeeService.ts`, `frontend/v2/src/pages/HRManagement/types.ts`
- 更改：1. 重构 `employeeService.ts` 以使用 `axios` 进行实际 API 调用，移除了所有 mock 数据。2. 扩展了 `types.ts` 以包含 `EmployeeQuery`, `*Payload`, 和 `*PageResult` 类型。3. 更新 `EmployeeListPage.tsx` 以使用重构后的 `employeeService`，实现实际数据获取、分页、筛选和加载/错误状态管理，并对"新建员工"按钮应用了 `usePermissions`。4. 更新 `EmployeeFilterForm.tsx` 以从 `lookupService` 获取部门（使用 `TreeSelect`）和状态（`Select`）的数据填充下拉选项。处理这些查找的加载状态。5. 更新 `EmployeeTable.tsx` 以使用 `usePermissions` 控制操作按钮的可见性，正确显示来自真实API（通过 `EmployeeListPage`）的数据和分页，并将状态显示为中文。
- 原因：实施计划中的API集成第一阶段，使员工列表功能连接到后端服务并实现权限控制和动态查找值。
- 阻碍：无。
- 状态：成功

[PREVIOUS_DATETIME_PLACEHOLDER]
- 修改：
  - `frontend/v2/src/pages/HRManagement/employees/EmployeeDetailPage.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTab.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractInfoTab.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/CompensationHistoryTab.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/LeaveBalanceTab.tsx`
- 更改：
  - `EmployeeDetailPage.tsx`: 集成了 `employeeService.getEmployeeById` 来获取真实的员工数据，处理了加载和错误状态，并对"编辑"按钮应用了权限控制。
  - 各标签页 (`JobHistoryTab`, `ContractInfoTab`, `CompensationHistoryTab`, `LeaveBalanceTab`): 分别集成了对应的 `employeeService` 方法来获取分页数据，实现了加载状态、错误处理和分页逻辑，并对内部操作按钮应用了权限控制（增删改的实际API调用仍为模拟）。
  - 确保了在API调用期间显示加载指示（`Spin`），并在发生错误时提供用户反馈（`message.error` 或 `Alert`）。
- 原因：完成员工详情页面及其所有标签页的数据获取和权限控制集成，作为阶段二的核心任务。
- 阻碍：处理了几个由 `InputNumber` 的 `formatter/parser` 和类型导入引起的 linter 错误。
- 状态：成功

[2024-07-27 10:00:00]
- 修改：Multiple files for Employee Detail Page UI skeletons.
- 更改：Created EmployeeDetailPage.tsx and its associated tab components (BasicInfoTab, JobInfoTab, JobHistoryTab, ContractInfoTab, CompensationHistoryTab, LeaveBalanceTab). Updated types.ts with new interfaces (ContractItem, CompensationItem, LeaveBalanceItem) and Employee interface. Added mock service functions in employeeService.ts for detail page data. Updated HRManagement/routes.ts to use the new EmployeeDetailPage.
- 原因：To implement the UI for viewing detailed employee information as per the plan.
- 阻碍：Encountered and resolved linter errors related to type imports (AppRouteObject, EmploymentStatus) and deprecated Ant Design components (PageHeader).
- 状态：成功

[2024-07-31 11:00:00]
- 修改：
  - `frontend/v2/src/pages/HRManagement/types.ts`
  - `frontend/v2/src/services/lookupService.ts`
  - `frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/CreateEmployeePage.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/EditEmployeePage.tsx`
- 更改：
  - 为员工实体添加了更详细的字段（婚姻状况、政治面貌、银行账户、紧急联系人、初始合同信息等）。
  - 扩展了 `lookupService` 以提供新的下拉选项数据（婚姻状况、政治面貌、职位）。更新了现有模拟数据以使用枚举并提供中文标签。
  - 重构了 `EmployeeForm` 以包含所有新字段，分为多个 `Card` 部分，从 `lookupService` 获取动态数据，处理头像上传，并正确处理创建和编辑模式下的数据提交和初始值填充。
  - 更新了 `CreateEmployeePage` 以使用重构后的 `EmployeeForm`，管理提交状态，调用 `employeeService.createEmployee`，并处理导航/消息。
  - 更新了 `EditEmployeePage` 以获取员工数据，将其作为 `initialValues` 传递给 `EmployeeForm`，处理编辑模式，调用 `employeeService.updateEmployee`，并管理加载/错误/提交状态和导航/消息。
- 原因：实现新建和编辑员工的核心表单功能，集成API所需的数据结构和选项。
- 阻碍：无。
- 状态：成功

# 最终审查
审查日期：{{NOW}}
审查员：AI Assistant

**总结：**
UI骨架已完成。
**阶段二进展：**
*   `lookupService.ts` 已创建并包含模拟查找功能。
*   `employeeService.ts` 已重构为使用实际 API 调用。
*   `types.ts` 已更新以支持 API 集成。
*   员工列表页面 (`EmployeeListPage.tsx`, `EmployeeFilterForm.tsx`, `EmployeeTable.tsx`) 已更新，使用真实服务进行数据获取、权限控制，并从 `lookupService` 加载动态表单选项。

**阶段三规划：实现员工详情各 Tab 内 CRUD 操作**

**核心目标：**
1.  在 `employeeService.ts` 中为每个子模块（岗位历史、合同等）添加真实的 CUD (Create, Update, Delete) API 调用函数。
2.  在 `types.ts` 中定义这些 CUD 操作所需的请求体 (payload) 类型和可能的特定响应类型。
3.  更新各标签页组件 (`JobHistoryTab.tsx`, `ContractInfoTab.tsx`, `CompensationHistoryTab.tsx`, `LeaveBalanceTab.tsx`) 中的模态框表单和处理逻辑：
    *   在提交表单或执行删除操作时，调用真实的 `employeeService` 函数。
    *   实现完善的加载状态（例如，在模态框的"保存"按钮上显示loading）。
    *   提供明确的用户反馈（成功/失败消息）。
    *   在操作成功后刷新对应标签页的数据列表。
    *   确保模态框内的表单控件（如下拉选择框）动态加载数据 (e.g., from `lookupService`)，并正确处理数据格式。
    *   仔细验证并应用 `usePermissions` Hook，确保按钮的可见性和操作权限与后端一致。

**详细规划与技术规范：**

**1. 类型定义 (`frontend/v2/src/pages/HRManagement/types.ts`)**
   *   **岗位历史 (Job History):**
        *   `CreateJobHistoryPayload`: 包含 `effectiveDate: string`, `departmentId: string`, `positionId: string`, `employmentType: EmploymentType`, `salary?: number`, `remarks?: string`。
        *   `UpdateJobHistoryPayload`: 同 `CreateJobHistoryPayload`。
   *   **合同信息 (Contract Info):**
        *   `CreateContractPayload`: 包含 `contractNumber: string`, `contractType: ContractType`, `startDate: string`, `endDate: string`, `status: ContractStatus`, `remarks?: string`。
        *   `UpdateContractPayload`: 同 `CreateContractPayload`。
   *   **薪酬历史 (Compensation History):**
        *   `CreateCompensationPayload`: 包含 `effectiveDate: string`, `basicSalary: number`, `allowances?: number`, `payFrequency: PayFrequency`, `currency?: string`, `changeReason?: string`, `remarks?: string`。
        *   `UpdateCompensationPayload`: 同 `CreateCompensationPayload`。
   *   **假期余额 (Leave Balance):**
        *   `AdjustLeaveBalancePayload`: 包含 `leaveTypeId: string`, `totalEntitlement?: number`, `adjustmentAmount?: number`, `unit: 'days' | 'hours'`, `year?: number`, `validityDate?: string`, `remarks?: string`。
        *   `UpdateLeaveBalancePayload`: (如果支持单独更新某个余额记录的属性，则定义此类型)。

**2. 服务层 (`frontend/v2/src/services/employeeService.ts`)**
   *   **岗位历史:**
        *   `createJobHistoryRecord(employeeId: string, payload: CreateJobHistoryPayload): Promise<JobHistoryItem>` (POST `/api/v2/employees/${employeeId}/job-history`)
        *   `updateJobHistoryRecord(employeeId: string, jobHistoryId: string, payload: UpdateJobHistoryPayload): Promise<JobHistoryItem>` (PUT `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
        *   `deleteJobHistoryRecord(employeeId: string, jobHistoryId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
   *   **合同信息:**
        *   `createContractRecord(employeeId: string, payload: CreateContractPayload): Promise<ContractItem>` (POST `/api/v2/employees/${employeeId}/contracts`)
        *   `updateContractRecord(employeeId: string, contractId: string, payload: UpdateContractPayload): Promise<ContractItem>` (PUT `/api/v2/employees/${employeeId}/contracts/${contractId}`)
        *   `deleteContractRecord(employeeId: string, contractId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/contracts/${contractId}`)
   *   **薪酬历史:**
        *   `createCompensationRecord(employeeId: string, payload: CreateCompensationPayload): Promise<CompensationItem>` (POST `/api/v2/employees/${employeeId}/compensations`)
        *   `updateCompensationRecord(employeeId: string, compensationId: string, payload: UpdateCompensationPayload): Promise<CompensationItem>` (PUT `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
        *   `deleteCompensationRecord(employeeId: string, compensationId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
   *   **假期余额:**
        *   `adjustLeaveBalance(employeeId: string, payload: AdjustLeaveBalancePayload): Promise<LeaveBalanceItem>` (POST `/api/v2/employees/${employeeId}/leave-balances` 或类似调整接口)
        *   `updateLeaveBalanceRecord(employeeId: string, leaveBalanceId: string, payload: UpdateLeaveBalancePayload): Promise<LeaveBalanceItem>` (PUT ... if applicable)
        *   `deleteLeaveBalanceRecord(employeeId: string, leaveBalanceId: string): Promise<void>` (DELETE ... if applicable)

**3. 组件更新 (各 `Tab.tsx` 文件)**
   *   **通用修改点：** (同上文PLAN部分)
   *   **`JobHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 更新部门/职位Select)
   *   **`ContractInfoTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签)
   *   **`CompensationHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签, InputNumber)
   *   **`LeaveBalanceTab.tsx` Specifics:** (同上文PLAN部分 - 假期类型Select)

**4. `lookupService.ts` (`frontend/v2/src/services/lookupService.ts`)**
    *   确保已提供获取以下查找数据的方法，并返回包含 `label` (中文) 和 `value` 的 `LookupItem[]`：
        *   `getDepartmentsLookup()`
        *   `getPositionsLookup()`
        *   `getEmploymentTypesLookup()`
        *   `getContractTypesLookup()`
        *   `getContractStatusesLookup()`
        *   `getPayFrequenciesLookup()`
        *   `getLeaveTypesLookup()`

**实施检查清单 (阶段三):**
1.  **类型定义 (`types.ts`)**:
    *   [ ] 定义岗位历史、合同、薪酬、假期余额模块的 CUD `*Payload` 类型。
2.  **服务层更新 (`employeeService.ts`)**:
    *   [ ] 实现岗位历史的 `create/update/delete` 服务函数。
    *   [ ] 实现合同信息的 `create/update/delete` 服务函数。
    *   [ ] 实现薪酬历史的 `create/update/delete` 服务函数。
    *   [ ] 实现假期余额的 `adjust/update/delete` 服务函数。
3.  **`lookupService.ts` 增强**:
    *   [ ] 确认或实现 `getDepartmentsLookup` (支持树形或扁平列表)。
    *   [ ] 确认或实现 `getPositionsLookup`。
    *   [ ] 确认所有枚举类型查找函数提供中文标签。
4.  **`JobHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取部门和职位数据。
    *   [ ] 验证权限。
5.  **`ContractInfoTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签。
    *   [ ] 验证权限。
6.  **`CompensationHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签，尝试修复 `InputNumber`。
    *   [ ] 验证权限。
7.  **`LeaveBalanceTab.tsx` CRUD (调整) 实现**:
    *   [ ] 实现调整/创建的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取假期类型。
    *   [ ] 验证权限。

**后续步骤：**
阶段三完成后，可继续进行权限细化（如果上述步骤未完全覆盖）、更全面的错误处理、以及阶段三计划中的其他高级功能与优化点。

**结论：实施与计划基本匹配。** API 集成阶段已基本完成，准备进入各子模块内部CRUD的实现。 

[行动计划]
- Implement UI for Employee List (Filters, Table, Pagination) - COMPLETED
- Implement UI for Create Employee Page (Form) - COMPLETED
- Implement UI for Edit Employee Page (Form with prefill) - COMPLETED
- Implement UI for Employee Detail Page (Basic layout, tabs) - COMPLETED
- Implement CUD (Create, Update, Delete) operations for sub-sections within Employee Detail Page tabs (Job History, Contracts, Compensation, Leave Balances). This includes:
    - Creating/updating tab-specific components (e.g., `JobHistoryTab.tsx`).
    - Creating table components for each sub-section (e.g., `JobHistoryTable.tsx`).
    - Creating modal components for Add/Edit operations (e.g., `JobHistoryModal.tsx`).
    - Implementing mock API service functions for CUD operations.
    - Managing state and handlers within tab components.
    - Integrating permission checks for CUD actions.
- Integrate with actual backend APIs.
- Implement advanced features (e.g., file uploads for contracts, dynamic lookups for department/position).
- Comprehensive testing.
- Documentation.

# 当前执行步骤："[步骤编号和名称]"
- 例如："2. 创建任务文件"
- Current: "Implement CUD operations for Employee Detail Page sub-sections, starting with Job History." 

# 任务进度
[日期时间]
- 修改：
  - `frontend/v2/src/pages/HRManagement/types.ts`
  - `frontend/v2/src/services/employeeService.ts`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryModal.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTable.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTab.tsx`
- 更改：为"岗位历史"标签页实现CUD操作和UI组件。定义了相关类型、mock服务、Modal和Table组件，并重构了Tab页以集成它们。
- 原因：实现员工详情页中岗位历史的完整管理功能。
- 阻碍：无。
- 状态：成功

[日期时间]
- 修改：
  - `frontend/v2/src/pages/HRManagement/types.ts` (添加 CreateJobHistoryPayload, UpdateJobHistoryPayload, CreateContractPayload, UpdateContractPayload)
  - `frontend/v2/src/services/employeeService.ts` (添加合同相关的mock数据、查找函数和CUD服务: mockContractsDb, getContractTypesLookup, getContractStatusesLookup, getEmployeeContracts, addContractItem, updateContractItem, deleteContractItem)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractModal.tsx` (新建)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractTable.tsx` (新建并修复linting)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractInfoTab.tsx` (重构以使用新的Modal和Table, 实现CUD逻辑)
  - `frontend/v2/src/pages/HRManagement/employees/EmployeeDetailPage.tsx` (验证ContractInfoTab集成)
- 更改：为"合同信息"标签页实现CUD操作和UI组件。定义了相关类型、mock服务、Modal和Table组件，并重构/创建了Tab页以集成它们。验证了在详情页的集成情况。
- 原因：实现员工详情页中合同信息的完整管理功能。
- 阻碍：无。
- 状态：成功

# 最终审查
审查日期：{{NOW}}
审查员：AI Assistant

**总结：**
UI骨架已完成。
**阶段二进展：**
*   `lookupService.ts` 已创建并包含模拟查找功能。
*   `employeeService.ts` 已重构为使用实际 API 调用。
*   `types.ts` 已更新以支持 API 集成。
*   员工列表页面 (`EmployeeListPage.tsx`, `EmployeeFilterForm.tsx`, `EmployeeTable.tsx`) 已更新，使用真实服务进行数据获取、权限控制，并从 `lookupService` 加载动态表单选项。

**阶段三规划：实现员工详情各 Tab 内 CRUD 操作**

**核心目标：**
1.  在 `employeeService.ts` 中为每个子模块（岗位历史、合同等）添加真实的 CUD (Create, Update, Delete) API 调用函数。
2.  在 `types.ts` 中定义这些 CUD 操作所需的请求体 (payload) 类型和可能的特定响应类型。
3.  更新各标签页组件 (`JobHistoryTab.tsx`, `ContractInfoTab.tsx`, `CompensationHistoryTab.tsx`, `LeaveBalanceTab.tsx`) 中的模态框表单和处理逻辑：
    *   在提交表单或执行删除操作时，调用真实的 `employeeService` 函数。
    *   实现完善的加载状态（例如，在模态框的"保存"按钮上显示loading）。
    *   提供明确的用户反馈（成功/失败消息）。
    *   在操作成功后刷新对应标签页的数据列表。
    *   确保模态框内的表单控件（如下拉选择框）动态加载数据 (e.g., from `lookupService`)，并正确处理数据格式。
    *   仔细验证并应用 `usePermissions` Hook，确保按钮的可见性和操作权限与后端一致。

**详细规划与技术规范：**

**1. 类型定义 (`frontend/v2/src/pages/HRManagement/types.ts`)**
   *   **岗位历史 (Job History):**
        *   `CreateJobHistoryPayload`: 包含 `effectiveDate: string`, `departmentId: string`, `positionId: string`, `employmentType: EmploymentType`, `salary?: number`, `remarks?: string`。
        *   `UpdateJobHistoryPayload`: 同 `CreateJobHistoryPayload`。
   *   **合同信息 (Contract Info):**
        *   `CreateContractPayload`: 包含 `contractNumber: string`, `contractType: ContractType`, `startDate: string`, `endDate: string`, `status: ContractStatus`, `remarks?: string`。
        *   `UpdateContractPayload`: 同 `CreateContractPayload`。
   *   **薪酬历史 (Compensation History):**
        *   `CreateCompensationPayload`: 包含 `effectiveDate: string`, `basicSalary: number`, `allowances?: number`, `payFrequency: PayFrequency`, `currency?: string`, `changeReason?: string`, `remarks?: string`。
        *   `UpdateCompensationPayload`: 同 `CreateCompensationPayload`。
   *   **假期余额 (Leave Balance):**
        *   `AdjustLeaveBalancePayload`: 包含 `leaveTypeId: string`, `totalEntitlement?: number`, `adjustmentAmount?: number`, `unit: 'days' | 'hours'`, `year?: number`, `validityDate?: string`, `remarks?: string`。
        *   `UpdateLeaveBalancePayload`: (如果支持单独更新某个余额记录的属性，则定义此类型)。

**2. 服务层 (`frontend/v2/src/services/employeeService.ts`)**
   *   **岗位历史:**
        *   `createJobHistoryRecord(employeeId: string, payload: CreateJobHistoryPayload): Promise<JobHistoryItem>` (POST `/api/v2/employees/${employeeId}/job-history`)
        *   `updateJobHistoryRecord(employeeId: string, jobHistoryId: string, payload: UpdateJobHistoryPayload): Promise<JobHistoryItem>` (PUT `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
        *   `deleteJobHistoryRecord(employeeId: string, jobHistoryId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
   *   **合同信息:**
        *   `createContractRecord(employeeId: string, payload: CreateContractPayload): Promise<ContractItem>` (POST `/api/v2/employees/${employeeId}/contracts`)
        *   `updateContractRecord(employeeId: string, contractId: string, payload: UpdateContractPayload): Promise<ContractItem>` (PUT `/api/v2/employees/${employeeId}/contracts/${contractId}`)
        *   `deleteContractRecord(employeeId: string, contractId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/contracts/${contractId}`)
   *   **薪酬历史:**
        *   `createCompensationRecord(employeeId: string, payload: CreateCompensationPayload): Promise<CompensationItem>` (POST `/api/v2/employees/${employeeId}/compensations`)
        *   `updateCompensationRecord(employeeId: string, compensationId: string, payload: UpdateCompensationPayload): Promise<CompensationItem>` (PUT `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
        *   `deleteCompensationRecord(employeeId: string, compensationId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
   *   **假期余额:**
        *   `adjustLeaveBalance(employeeId: string, payload: AdjustLeaveBalancePayload): Promise<LeaveBalanceItem>` (POST `/api/v2/employees/${employeeId}/leave-balances` 或类似调整接口)
        *   `updateLeaveBalanceRecord(employeeId: string, leaveBalanceId: string, payload: UpdateLeaveBalancePayload): Promise<LeaveBalanceItem>` (PUT ... if applicable)
        *   `deleteLeaveBalanceRecord(employeeId: string, leaveBalanceId: string): Promise<void>` (DELETE ... if applicable)

**3. 组件更新 (各 `Tab.tsx` 文件)**
   *   **通用修改点：** (同上文PLAN部分)
   *   **`JobHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 更新部门/职位Select)
   *   **`ContractInfoTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签)
   *   **`CompensationHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签, InputNumber)
   *   **`LeaveBalanceTab.tsx` Specifics:** (同上文PLAN部分 - 假期类型Select)

**4. `lookupService.ts` (`frontend/v2/src/services/lookupService.ts`)**
    *   确保已提供获取以下查找数据的方法，并返回包含 `label` (中文) 和 `value` 的 `LookupItem[]`：
        *   `getDepartmentsLookup()`
        *   `getPositionsLookup()`
        *   `getEmploymentTypesLookup()`
        *   `getContractTypesLookup()`
        *   `getContractStatusesLookup()`
        *   `getPayFrequenciesLookup()`
        *   `getLeaveTypesLookup()`

**实施检查清单 (阶段三):**
1.  **类型定义 (`types.ts`)**:
    *   [ ] 定义岗位历史、合同、薪酬、假期余额模块的 CUD `*Payload` 类型。
2.  **服务层更新 (`employeeService.ts`)**:
    *   [ ] 实现岗位历史的 `create/update/delete` 服务函数。
    *   [ ] 实现合同信息的 `create/update/delete` 服务函数。
    *   [ ] 实现薪酬历史的 `create/update/delete` 服务函数。
    *   [ ] 实现假期余额的 `adjust/update/delete` 服务函数。
3.  **`lookupService.ts` 增强**:
    *   [ ] 确认或实现 `getDepartmentsLookup` (支持树形或扁平列表)。
    *   [ ] 确认或实现 `getPositionsLookup`。
    *   [ ] 确认所有枚举类型查找函数提供中文标签。
4.  **`JobHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取部门和职位数据。
    *   [ ] 验证权限。
5.  **`ContractInfoTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签。
    *   [ ] 验证权限。
6.  **`CompensationHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签，尝试修复 `InputNumber`。
    *   [ ] 验证权限。
7.  **`LeaveBalanceTab.tsx` CRUD (调整) 实现**:
    *   [ ] 实现调整/创建的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取假期类型。
    *   [ ] 验证权限。

**后续步骤：**
阶段三完成后，可继续进行权限细化（如果上述步骤未完全覆盖）、更全面的错误处理、以及阶段三计划中的其他高级功能与优化点。

**结论：实施与计划基本匹配。** API 集成阶段已基本完成，准备进入各子模块内部CRUD的实现。 

[行动计划]
- Implement UI for Employee List (Filters, Table, Pagination) - COMPLETED
- Implement UI for Create Employee Page (Form) - COMPLETED
- Implement UI for Edit Employee Page (Form with prefill) - COMPLETED
- Implement UI for Employee Detail Page (Basic layout, tabs) - COMPLETED
- Implement CUD (Create, Update, Delete) operations for sub-sections within Employee Detail Page tabs (Job History, Contracts, Compensation, Leave Balances). This includes:
    - Creating/updating tab-specific components (e.g., `JobHistoryTab.tsx`).
    - Creating table components for each sub-section (e.g., `JobHistoryTable.tsx`).
    - Creating modal components for Add/Edit operations (e.g., `JobHistoryModal.tsx`).
    - Implementing mock API service functions for CUD operations.
    - Managing state and handlers within tab components.
    - Integrating permission checks for CUD actions.
- Integrate with actual backend APIs.
- Implement advanced features (e.g., file uploads for contracts, dynamic lookups for department/position).
- Comprehensive testing.
- Documentation.

# 当前执行步骤："[步骤编号和名称]"
- 例如："2. 创建任务文件"
- Current: "Implement CUD operations for Employee Detail Page sub-sections, starting with Job History." 

# 任务进度
[日期时间]
- 修改：
  - `frontend/v2/src/pages/HRManagement/types.ts`
  - `frontend/v2/src/services/employeeService.ts`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryModal.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTable.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTab.tsx`
- 更改：为"岗位历史"标签页实现CUD操作和UI组件。定义了相关类型、mock服务、Modal和Table组件，并重构了Tab页以集成它们。
- 原因：实现员工详情页中岗位历史的完整管理功能。
- 阻碍：无。
- 状态：成功

[日期时间]
- 修改：
  - `frontend/v2/src/pages/HRManagement/types.ts` (添加 CreateJobHistoryPayload, UpdateJobHistoryPayload, CreateContractPayload, UpdateContractPayload)
  - `frontend/v2/src/services/employeeService.ts` (添加合同相关的mock数据、查找函数和CUD服务: mockContractsDb, getContractTypesLookup, getContractStatusesLookup, getEmployeeContracts, addContractItem, updateContractItem, deleteContractItem)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractModal.tsx` (新建)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractTable.tsx` (新建并修复linting)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractInfoTab.tsx` (重构以使用新的Modal和Table, 实现CUD逻辑)
  - `frontend/v2/src/pages/HRManagement/employees/EmployeeDetailPage.tsx` (验证ContractInfoTab集成)
- 更改：为"合同信息"标签页实现CUD操作和UI组件。定义了相关类型、mock服务、Modal和Table组件，并重构/创建了Tab页以集成它们。验证了在详情页的集成情况。
- 原因：实现员工详情页中合同信息的完整管理功能。
- 阻碍：无。
- 状态：成功

# 最终审查
审查日期：{{NOW}}
审查员：AI Assistant

**总结：**
UI骨架已完成。
**阶段二进展：**
*   `lookupService.ts` 已创建并包含模拟查找功能。
*   `employeeService.ts` 已重构为使用实际 API 调用。
*   `types.ts` 已更新以支持 API 集成。
*   员工列表页面 (`EmployeeListPage.tsx`, `EmployeeFilterForm.tsx`, `EmployeeTable.tsx`) 已更新，使用真实服务进行数据获取、权限控制，并从 `lookupService` 加载动态表单选项。

**阶段三规划：实现员工详情各 Tab 内 CRUD 操作**

**核心目标：**
1.  在 `employeeService.ts` 中为每个子模块（岗位历史、合同等）添加真实的 CUD (Create, Update, Delete) API 调用函数。
2.  在 `types.ts` 中定义这些 CUD 操作所需的请求体 (payload) 类型和可能的特定响应类型。
3.  更新各标签页组件 (`JobHistoryTab.tsx`, `ContractInfoTab.tsx`, `CompensationHistoryTab.tsx`, `LeaveBalanceTab.tsx`) 中的模态框表单和处理逻辑：
    *   在提交表单或执行删除操作时，调用真实的 `employeeService` 函数。
    *   实现完善的加载状态（例如，在模态框的"保存"按钮上显示loading）。
    *   提供明确的用户反馈（成功/失败消息）。
    *   在操作成功后刷新对应标签页的数据列表。
    *   确保模态框内的表单控件（如下拉选择框）动态加载数据 (e.g., from `lookupService`)，并正确处理数据格式。
    *   仔细验证并应用 `usePermissions` Hook，确保按钮的可见性和操作权限与后端一致。

**详细规划与技术规范：**

**1. 类型定义 (`frontend/v2/src/pages/HRManagement/types.ts`)**
   *   **岗位历史 (Job History):**
        *   `CreateJobHistoryPayload`: 包含 `effectiveDate: string`, `departmentId: string`, `positionId: string`, `employmentType: EmploymentType`, `salary?: number`, `remarks?: string`。
        *   `UpdateJobHistoryPayload`: 同 `CreateJobHistoryPayload`。
   *   **合同信息 (Contract Info):**
        *   `CreateContractPayload`: 包含 `contractNumber: string`, `contractType: ContractType`, `startDate: string`, `endDate: string`, `status: ContractStatus`, `remarks?: string`。
        *   `UpdateContractPayload`: 同 `CreateContractPayload`。
   *   **薪酬历史 (Compensation History):**
        *   `CreateCompensationPayload`: 包含 `effectiveDate: string`, `basicSalary: number`, `allowances?: number`, `payFrequency: PayFrequency`, `currency?: string`, `changeReason?: string`, `remarks?: string`。
        *   `UpdateCompensationPayload`: 同 `CreateCompensationPayload`。
   *   **假期余额 (Leave Balance):**
        *   `AdjustLeaveBalancePayload`: 包含 `leaveTypeId: string`, `totalEntitlement?: number`, `adjustmentAmount?: number`, `unit: 'days' | 'hours'`, `year?: number`, `validityDate?: string`, `remarks?: string`。
        *   `UpdateLeaveBalancePayload`: (如果支持单独更新某个余额记录的属性，则定义此类型)。

**2. 服务层 (`frontend/v2/src/services/employeeService.ts`)**
   *   **岗位历史:**
        *   `createJobHistoryRecord(employeeId: string, payload: CreateJobHistoryPayload): Promise<JobHistoryItem>` (POST `/api/v2/employees/${employeeId}/job-history`)
        *   `updateJobHistoryRecord(employeeId: string, jobHistoryId: string, payload: UpdateJobHistoryPayload): Promise<JobHistoryItem>` (PUT `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
        *   `deleteJobHistoryRecord(employeeId: string, jobHistoryId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
   *   **合同信息:**
        *   `createContractRecord(employeeId: string, payload: CreateContractPayload): Promise<ContractItem>` (POST `/api/v2/employees/${employeeId}/contracts`)
        *   `updateContractRecord(employeeId: string, contractId: string, payload: UpdateContractPayload): Promise<ContractItem>` (PUT `/api/v2/employees/${employeeId}/contracts/${contractId}`)
        *   `deleteContractRecord(employeeId: string, contractId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/contracts/${contractId}`)
   *   **薪酬历史:**
        *   `createCompensationRecord(employeeId: string, payload: CreateCompensationPayload): Promise<CompensationItem>` (POST `/api/v2/employees/${employeeId}/compensations`)
        *   `updateCompensationRecord(employeeId: string, compensationId: string, payload: UpdateCompensationPayload): Promise<CompensationItem>` (PUT `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
        *   `deleteCompensationRecord(employeeId: string, compensationId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
   *   **假期余额:**
        *   `adjustLeaveBalance(employeeId: string, payload: AdjustLeaveBalancePayload): Promise<LeaveBalanceItem>` (POST `/api/v2/employees/${employeeId}/leave-balances` 或类似调整接口)
        *   `updateLeaveBalanceRecord(employeeId: string, leaveBalanceId: string, payload: UpdateLeaveBalancePayload): Promise<LeaveBalanceItem>` (PUT ... if applicable)
        *   `deleteLeaveBalanceRecord(employeeId: string, leaveBalanceId: string): Promise<void>` (DELETE ... if applicable)

**3. 组件更新 (各 `Tab.tsx` 文件)**
   *   **通用修改点：** (同上文PLAN部分)
   *   **`JobHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 更新部门/职位Select)
   *   **`ContractInfoTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签)
   *   **`CompensationHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签, InputNumber)
   *   **`LeaveBalanceTab.tsx` Specifics:** (同上文PLAN部分 - 假期类型Select)

**4. `lookupService.ts` (`frontend/v2/src/services/lookupService.ts`)**
    *   确保已提供获取以下查找数据的方法，并返回包含 `label` (中文) 和 `value` 的 `LookupItem[]`：
        *   `getDepartmentsLookup()`
        *   `getPositionsLookup()`
        *   `getEmploymentTypesLookup()`
        *   `getContractTypesLookup()`
        *   `getContractStatusesLookup()`
        *   `getPayFrequenciesLookup()`
        *   `getLeaveTypesLookup()`

**实施检查清单 (阶段三):**
1.  **类型定义 (`types.ts`)**:
    *   [ ] 定义岗位历史、合同、薪酬、假期余额模块的 CUD `*Payload` 类型。
2.  **服务层更新 (`employeeService.ts`)**:
    *   [ ] 实现岗位历史的 `create/update/delete` 服务函数。
    *   [ ] 实现合同信息的 `create/update/delete` 服务函数。
    *   [ ] 实现薪酬历史的 `create/update/delete` 服务函数。
    *   [ ] 实现假期余额的 `adjust/update/delete` 服务函数。
3.  **`lookupService.ts` 增强**:
    *   [ ] 确认或实现 `getDepartmentsLookup` (支持树形或扁平列表)。
    *   [ ] 确认或实现 `getPositionsLookup`。
    *   [ ] 确认所有枚举类型查找函数提供中文标签。
4.  **`JobHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取部门和职位数据。
    *   [ ] 验证权限。
5.  **`ContractInfoTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签。
    *   [ ] 验证权限。
6.  **`CompensationHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签，尝试修复 `InputNumber`。
    *   [ ] 验证权限。
7.  **`LeaveBalanceTab.tsx` CRUD (调整) 实现**:
    *   [ ] 实现调整/创建的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取假期类型。
    *   [ ] 验证权限。

**后续步骤：**
阶段三完成后，可继续进行权限细化（如果上述步骤未完全覆盖）、更全面的错误处理、以及阶段三计划中的其他高级功能与优化点。

**结论：实施与计划基本匹配。** API 集成阶段已基本完成，准备进入各子模块内部CRUD的实现。 

[行动计划]
- Implement UI for Employee List (Filters, Table, Pagination) - COMPLETED
- Implement UI for Create Employee Page (Form) - COMPLETED
- Implement UI for Edit Employee Page (Form with prefill) - COMPLETED
- Implement UI for Employee Detail Page (Basic layout, tabs) - COMPLETED
- Implement CUD (Create, Update, Delete) operations for sub-sections within Employee Detail Page tabs (Job History, Contracts, Compensation, Leave Balances). This includes:
    - Creating/updating tab-specific components (e.g., `JobHistoryTab.tsx`).
    - Creating table components for each sub-section (e.g., `JobHistoryTable.tsx`).
    - Creating modal components for Add/Edit operations (e.g., `JobHistoryModal.tsx`).
    - Implementing mock API service functions for CUD operations.
    - Managing state and handlers within tab components.
    - Integrating permission checks for CUD actions.
- Integrate with actual backend APIs.
- Implement advanced features (e.g., file uploads for contracts, dynamic lookups for department/position).
- Comprehensive testing.
- Documentation.

# 当前执行步骤："[步骤编号和名称]"
- 例如："2. 创建任务文件"
- Current: "Implement CUD operations for Employee Detail Page sub-sections, starting with Job History." 

# 任务进度
[日期时间]
- 修改：
  - `frontend/v2/src/pages/HRManagement/types.ts`
  - `frontend/v2/src/services/employeeService.ts`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryModal.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTable.tsx`
  - `frontend/v2/src/pages/HRManagement/employees/partials/JobHistoryTab.tsx`
- 更改：为"岗位历史"标签页实现CUD操作和UI组件。定义了相关类型、mock服务、Modal和Table组件，并重构了Tab页以集成它们。
- 原因：实现员工详情页中岗位历史的完整管理功能。
- 阻碍：无。
- 状态：成功

[日期时间]
- 修改：
  - `frontend/v2/src/pages/HRManagement/types.ts` (添加 CreateJobHistoryPayload, UpdateJobHistoryPayload, CreateContractPayload, UpdateContractPayload)
  - `frontend/v2/src/services/employeeService.ts` (添加合同相关的mock数据、查找函数和CUD服务: mockContractsDb, getContractTypesLookup, getContractStatusesLookup, getEmployeeContracts, addContractItem, updateContractItem, deleteContractItem)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractModal.tsx` (新建)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractTable.tsx` (新建并修复linting)
  - `frontend/v2/src/pages/HRManagement/employees/partials/ContractInfoTab.tsx` (重构以使用新的Modal和Table, 实现CUD逻辑)
  - `frontend/v2/src/pages/HRManagement/employees/EmployeeDetailPage.tsx` (验证ContractInfoTab集成)
- 更改：为"合同信息"标签页实现CUD操作和UI组件。定义了相关类型、mock服务、Modal和Table组件，并重构/创建了Tab页以集成它们。验证了在详情页的集成情况。
- 原因：实现员工详情页中合同信息的完整管理功能。
- 阻碍：无。
- 状态：成功

# 最终审查
审查日期：{{NOW}}
审查员：AI Assistant

**总结：**
UI骨架已完成。
**阶段二进展：**
*   `lookupService.ts` 已创建并包含模拟查找功能。
*   `employeeService.ts` 已重构为使用实际 API 调用。
*   `types.ts` 已更新以支持 API 集成。
*   员工列表页面 (`EmployeeListPage.tsx`, `EmployeeFilterForm.tsx`, `EmployeeTable.tsx`) 已更新，使用真实服务进行数据获取、权限控制，并从 `lookupService` 加载动态表单选项。

**阶段三规划：实现员工详情各 Tab 内 CRUD 操作**

**核心目标：**
1.  在 `employeeService.ts` 中为每个子模块（岗位历史、合同等）添加真实的 CUD (Create, Update, Delete) API 调用函数。
2.  在 `types.ts` 中定义这些 CUD 操作所需的请求体 (payload) 类型和可能的特定响应类型。
3.  更新各标签页组件 (`JobHistoryTab.tsx`, `ContractInfoTab.tsx`, `CompensationHistoryTab.tsx`, `LeaveBalanceTab.tsx`) 中的模态框表单和处理逻辑：
    *   在提交表单或执行删除操作时，调用真实的 `employeeService` 函数。
    *   实现完善的加载状态（例如，在模态框的"保存"按钮上显示loading）。
    *   提供明确的用户反馈（成功/失败消息）。
    *   在操作成功后刷新对应标签页的数据列表。
    *   确保模态框内的表单控件（如下拉选择框）动态加载数据 (e.g., from `lookupService`)，并正确处理数据格式。
    *   仔细验证并应用 `usePermissions` Hook，确保按钮的可见性和操作权限与后端一致。

**详细规划与技术规范：**

**1. 类型定义 (`frontend/v2/src/pages/HRManagement/types.ts`)**
   *   **岗位历史 (Job History):**
        *   `CreateJobHistoryPayload`: 包含 `effectiveDate: string`, `departmentId: string`, `positionId: string`, `employmentType: EmploymentType`, `salary?: number`, `remarks?: string`。
        *   `UpdateJobHistoryPayload`: 同 `CreateJobHistoryPayload`。
   *   **合同信息 (Contract Info):**
        *   `CreateContractPayload`: 包含 `contractNumber: string`, `contractType: ContractType`, `startDate: string`, `endDate: string`, `status: ContractStatus`, `remarks?: string`。
        *   `UpdateContractPayload`: 同 `CreateContractPayload`。
   *   **薪酬历史 (Compensation History):**
        *   `CreateCompensationPayload`: 包含 `effectiveDate: string`, `basicSalary: number`, `allowances?: number`, `payFrequency: PayFrequency`, `currency?: string`, `changeReason?: string`, `remarks?: string`。
        *   `UpdateCompensationPayload`: 同 `CreateCompensationPayload`。
   *   **假期余额 (Leave Balance):**
        *   `AdjustLeaveBalancePayload`: 包含 `leaveTypeId: string`, `totalEntitlement?: number`, `adjustmentAmount?: number`, `unit: 'days' | 'hours'`, `year?: number`, `validityDate?: string`, `remarks?: string`。
        *   `UpdateLeaveBalancePayload`: (如果支持单独更新某个余额记录的属性，则定义此类型)。

**2. 服务层 (`frontend/v2/src/services/employeeService.ts`)**
   *   **岗位历史:**
        *   `createJobHistoryRecord(employeeId: string, payload: CreateJobHistoryPayload): Promise<JobHistoryItem>` (POST `/api/v2/employees/${employeeId}/job-history`)
        *   `updateJobHistoryRecord(employeeId: string, jobHistoryId: string, payload: UpdateJobHistoryPayload): Promise<JobHistoryItem>` (PUT `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
        *   `deleteJobHistoryRecord(employeeId: string, jobHistoryId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/job-history/${jobHistoryId}`)
   *   **合同信息:**
        *   `createContractRecord(employeeId: string, payload: CreateContractPayload): Promise<ContractItem>` (POST `/api/v2/employees/${employeeId}/contracts`)
        *   `updateContractRecord(employeeId: string, contractId: string, payload: UpdateContractPayload): Promise<ContractItem>` (PUT `/api/v2/employees/${employeeId}/contracts/${contractId}`)
        *   `deleteContractRecord(employeeId: string, contractId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/contracts/${contractId}`)
   *   **薪酬历史:**
        *   `createCompensationRecord(employeeId: string, payload: CreateCompensationPayload): Promise<CompensationItem>` (POST `/api/v2/employees/${employeeId}/compensations`)
        *   `updateCompensationRecord(employeeId: string, compensationId: string, payload: UpdateCompensationPayload): Promise<CompensationItem>` (PUT `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
        *   `deleteCompensationRecord(employeeId: string, compensationId: string): Promise<void>` (DELETE `/api/v2/employees/${employeeId}/compensations/${compensationId}`)
   *   **假期余额:**
        *   `adjustLeaveBalance(employeeId: string, payload: AdjustLeaveBalancePayload): Promise<LeaveBalanceItem>` (POST `/api/v2/employees/${employeeId}/leave-balances` 或类似调整接口)
        *   `updateLeaveBalanceRecord(employeeId: string, leaveBalanceId: string, payload: UpdateLeaveBalancePayload): Promise<LeaveBalanceItem>` (PUT ... if applicable)
        *   `deleteLeaveBalanceRecord(employeeId: string, leaveBalanceId: string): Promise<void>` (DELETE ... if applicable)

**3. 组件更新 (各 `Tab.tsx` 文件)**
   *   **通用修改点：** (同上文PLAN部分)
   *   **`JobHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 更新部门/职位Select)
   *   **`ContractInfoTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签)
   *   **`CompensationHistoryTab.tsx` Specifics:** (同上文PLAN部分 - 中文标签, InputNumber)
   *   **`LeaveBalanceTab.tsx` Specifics:** (同上文PLAN部分 - 假期类型Select)

**4. `lookupService.ts` (`frontend/v2/src/services/lookupService.ts`)**
    *   确保已提供获取以下查找数据的方法，并返回包含 `label` (中文) 和 `value` 的 `LookupItem[]`：
        *   `getDepartmentsLookup()`
        *   `getPositionsLookup()`
        *   `getEmploymentTypesLookup()`
        *   `getContractTypesLookup()`
        *   `getContractStatusesLookup()`
        *   `getPayFrequenciesLookup()`
        *   `getLeaveTypesLookup()`

**实施检查清单 (阶段三):**
1.  **类型定义 (`types.ts`)**:
    *   [ ] 定义岗位历史、合同、薪酬、假期余额模块的 CUD `*Payload` 类型。
2.  **服务层更新 (`employeeService.ts`)**:
    *   [ ] 实现岗位历史的 `create/update/delete` 服务函数。
    *   [ ] 实现合同信息的 `create/update/delete` 服务函数。
    *   [ ] 实现薪酬历史的 `create/update/delete` 服务函数。
    *   [ ] 实现假期余额的 `adjust/update/delete` 服务函数。
3.  **`lookupService.ts` 增强**:
    *   [ ] 确认或实现 `getDepartmentsLookup` (支持树形或扁平列表)。
    *   [ ] 确认或实现 `getPositionsLookup`。
    *   [ ] 确认所有枚举类型查找函数提供中文标签。
4.  **`JobHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取部门和职位数据。
    *   [ ] 验证权限。
5.  **`ContractInfoTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签。
    *   [ ] 验证权限。
6.  **`CompensationHistoryTab.tsx` CRUD 实现**:
    *   [ ] 实现创建/更新/删除的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单下拉选项使用中文标签，尝试修复 `InputNumber`。
    *   [ ] 验证权限。
7.  **`LeaveBalanceTab.tsx` CRUD (调整) 实现**:
    *   [ ] 实现调整/创建的真实 API 调用、加载状态、用户反馈。
    *   [ ] 模态框表单使用 `lookupService` 获取假期类型。
    *   [ ] 验证权限。

**后续步骤：**
阶段三完成后，可继续进行权限细化（如果上述步骤未完全覆盖）、更全面的错误处理、以及阶段三计划中的其他高级功能与优化点。

**结论：实施与计划基本匹配。** API 集成阶段已基本完成，准备进入各子模块内部CRUD的实现。 

[行动计划]
- Implement UI for Employee List (Filters, Table, Pagination) - COMPLETED
- Implement UI for Create Employee Page (Form) - COMPLETED
- Implement UI for Edit Employee Page (Form with prefill) - COMPLETED
- Implement UI for Employee Detail Page (Basic layout, tabs) - COMPLETED
- Implement CUD (Create, Update, Delete) operations for sub-sections within Employee Detail Page tabs (Job History, Contracts, Compensation, Leave Balances). This includes:
    - Creating/updating tab-specific components (e.g., `JobHistoryTab.tsx`).
    - Creating table components for each sub-section (e.g., `JobHistoryTable.tsx`).
    - Creating modal components for Add/Edit operations (e.g., `JobHistoryModal.tsx`).
    - Implementing mock API service functions for CUD operations.
    - Managing state and handlers within tab components.
    - Integrating permission checks for CUD actions.
- Integrate with actual backend APIs.
- Implement advanced features (e.g., file uploads for contracts, dynamic lookups for department/position).
- Comprehensive testing.
- Documentation.

# 当前执行步骤："[步骤编号和名称]"
- 例如："2. 创建任务文件"
- Current: "Implement CUD operations for Employee Detail Page sub-sections, starting with Job History." 