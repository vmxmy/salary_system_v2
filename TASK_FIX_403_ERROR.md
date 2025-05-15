# 上下文
文件名：TASK_FIX_403_ERROR.md
创建于：2024-07-30T10:00:00Z
创建者：AI Assistant
Yolo模式：False

# 任务描述
用户在尝试创建新员工时遇到 `POST http://localhost:8080/v2/employees/ 403 (Forbidden)` 错误。需要诊断并解决此问题。

# 项目概述
这是一个基于React (Vite) 的前端应用程序，使用TypeScript和Zustand进行状态管理，Axios (`apiClient`) 进行API调用。后端API部署在 `http://localhost:8080`。

⚠️ 警告：切勿修改此部分 ⚠️
RIPER-5 协议规则摘要：
1.  始终在响应开始时声明模式: `[MODE: MODE_NAME]`
2.  RESEARCH: 收集信息，理解代码，不提建议或实现。
3.  INNOVATE: 头脑风暴多种解决方案，评估优缺点，不具体规划或编码。
4.  PLAN: 创建详细的技术规范和有序检查清单，不实现。
5.  EXECUTE: 严格按照计划实施，标记检查清单，更新任务进度。
6.  REVIEW: 验证实施与计划的一致性，报告偏差。
7.  自动模式转换。
8.  代码块格式: ```language:file_path
    // ... existing code ...
    {{ modifications }}
    // ... existing code ...
    ```
9.  任务文件用于跟踪。
⚠️ 警告：切勿修改此部分 ⚠️

# 分析
- ~~错误: `403 Forbidden` on `POST /v2/employees/`.~~ (已解决)
- **错误**: `422 Unprocessable Entity` on `POST /v2/employees/`.
- **根本原因**: 前端提交的员工数据字段名、结构或值类型与后端 Pydantic 模型 (`EmployeeCreate`) 的期望不一致。
- **解决策略**: 统一前端数据模型 (`types.ts`)、表单字段 (`EmployeeForm.tsx`) 及提交逻辑，严格与后端期望的蛇形命名 (`snake_case`) 和数字ID对齐。

# 提议的解决方案
- **前端调整以匹配后端期望 (已执行)**:
    1.  **类型定义 (`types.ts`)**:
        - `Employee` 接口更新：使用 `first_name`, `last_name`, `employee_code`, `hire_date`, `gender_lookup_value_id`, `status_lookup_value_id` 等蛇形或ID字段。添加了对旧驼峰字段 (如 `name`, `hireDate`, `gender`) 的可选支持，以便在 `initialValues` 映射时兼容。
        - `CreateEmployeePayload` 和 `UpdateEmployeePayload` 接口严格使用后端期望的蛇形字段名和数字ID。
    2.  **表单控件 (`EmployeeForm.tsx`)**:
        - `Form.Item` 的 `name` 属性全面更新为蛇形命名 (e.g., `last_name`, `employee_code`, `gender_lookup_value_id`, `hire_date`, `status_lookup_value_id`)。
    3.  **`useEffect` (处理 `initialValues`)**:
        - 逻辑调整为：将 `initialValues` (可能包含旧的驼峰名或文本代码) 映射到 `processedValues` (表单期望的蛇形键和数字ID)。
        - 优先使用 `initialValues` 中已有的 `_lookup_value_id` (数字ID)。
        - 若无ID，则从 `initialValues` 中的相应文本代码字段 (`_code` 或旧的文本字段如 `status`, `gender`) 结合 `Options` 数据（如 `genderOptions`, `statusOptions`）查找并映射到数字ID。
        - 清理 `processedValues` 中不再需要的旧驼峰键。
    4.  **`handleFormSubmit` (构建 `payload`)**:
        - `payload` 直接基于从表单获取的 `values` (其键已是蛇形)。
        - 对日期字段进行 `YYYY-MM-DD` 格式化。
        - 确保所有 `_lookup_value_id` 字段作为数字提交。
        - 移除了因字段名不匹配而引入的额外 `delete` 操作。
    5.  **Linter错误已解决**: 通过上述类型和逻辑调整，之前因字段不匹配导致的TypeScript linter错误已解决。
- **下一步**: 用户测试创建和编辑员工功能。

# 当前执行步骤："[步骤编号和名称]"
- "7. 整体回归测试员工创建/编辑功能，等待用户反馈"

# 任务进度
[带时间戳的更改历史]
- [2024-05-16 12:30:00] (AI) 修改：`frontend/v2/src/pages/HRManagement/types.ts`, `frontend/v2/src/services/lookupService.ts`, `frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx`.
    - 更改 (`types.ts`): `CreateEmployeePayload.status_lookup_value_id` 改为 `number`. `LookupItem` 允许 `value` 为 `number` 并添加 `code?: string`.
    - 更改 (`lookupService.ts`): `mockEmployeeStatuses` 更新，使 `value` 为数字ID, `code` 为文本状态.
    - 更改 (`EmployeeForm.tsx`): 
        - `useEffect` (for `initialValues`) 更新，以从状态文本映射到数字ID for `status_lookup_value_id`.
        - `handleFormSubmit` 确保 `status_lookup_value_id` 作为数字提交.
    - 原因：解决后端要求 `status_lookup_value_id` 为整数而前端发送字符串的问题。
    - 状态：已应用。
- [2024-05-16 12:00:00] (AI) 修改：`frontend/v2/src/pages/HRManagement/types.ts` 和 `frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx`.
    - 更改 (`types.ts`): `CreateEmployeePayload` 和 `UpdateEmployeePayload` 更新为使用 `employee_code`, `first_name`, `last_name`, `hire_date`, `status_lookup_value_id` (当时为string).
- [2024-05-16 11:15:00] (AI) 分析：用户提供的 `response.data.detail` 表明有5个必填字段 (`employee_code`, `first_name`, `last_name`, `hire_date`, `status_lookup_value_id`) 缺失或不匹配。 `departmentId` 空格问题已处理。
- [2024-05-16 11:00:00] (AI) 修改：`frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx`。更改：在 `handleFormSubmit` 中对 `departmentId` 和 `positionId` 应用 `trim()` 方法。原因：解决因 `departmentId` 前导空格可能导致的422错误。状态：已应用。
- [2024-05-17 10:XX:XX] (AI) 修改：`frontend/v2/src/pages/HRManagement/types.ts` 和 `frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx`。
    - 更改：遵循"路径 A"策略，回溯了用户之前对 `EmployeeForm.tsx` 的修改。统一了 `Form.Item` 的 `name` 属性为蛇形命名。调整了 `useEffect` 中对 `initialValues` 的处理逻辑，确保将驼峰或文本代码映射为表单期望的蛇形键和数字ID。调整了 `handleFormSubmit` 以直接使用表单的蛇形键构建 payload。更新了 `Employee` 类型定义以兼容映射并解决 linter 错误。
    - 原因：确保前端数据结构和提交逻辑与后端期望（蛇形命名、数字ID）完全一致，从根本上解决422错误。
    - 状态：成功。

# 最终审查
- 前端代码修改（日志增强和特定403错误提示）已按计划完成。
- `apiClient.ts` 已添加令牌日志。
- `employeeService.ts` 已添加后端响应数据日志。
- `CreateEmployeePage.tsx` 已添加针对403状态的特定用户错误消息。
- 所有修改均与计划一致。
- 后端 `webapp/v2/routers/employees.py` 中的角色代码已按用户要求的 `SNAKE_CASE` 规范更新 (e.g., `SUPER_ADMIN`, `HR_ADMIN`)。
- 此更改要求用户的实际角色数据（数据库/令牌）以及 `require_role` 函数的内部逻辑也与 `SNAKE_CASE` 格式兼容，用户需确认这一点。

# 提议的解决方案
[行动计划]
- 修复 `lookupService.ts` 中 API 调用 URL 不正确导致的 404 错误。
- 等待用户提供创建员工时返回 422 错误的详细 `error.response.data.detail` 内容。

# 当前执行步骤："[步骤编号和名称]"
- 例如："4. 修复 lookupService.ts 中的 404 错误并等待用户测试和提供422错误详情"

# 任务进度
[带时间戳的更改历史]
- [2024-05-16 10:00:00] (AI) 修改：`frontend/v2/src/services/lookupService.ts`。更改：将 `getDepartmentsLookup` 和 `getPositionsLookup` 中的 API 调用路径从 `'/v2/departments'` 和 `'/v2/job-titles'` 分别修正为 `'/departments'` 和 `'/job-titles'`。原因：修复因 `apiClient` 的 `baseURL` 已包含 `/v2` 而导致的 URL `/v2/v2/...` 路径重复和 404 错误。状态：成功。
- [2024-05-15 XX:XX:XX] (AI) 修改：`frontend/v2/src/services/lookupService.ts`。更改：实现从API获取部门和职位数据，替换mock数据，增加 `buildDepartmentTree` 辅助函数。原因：用户要求动态加载部门和职位选项。状态：部分成功（引入了404错误，现已修复）。

# ——— Lookup 数据源迁移 (从 Mock 到 API) ———

## 迁移目标
将 `lookupService.ts` 中所有使用 mock 数据的 lookup 方法，逐步替换为调用真实的后端 API。

## 当前状态 (Lookup 迁移)

### 1. Gender Lookup (`getGenderLookup`)
- **API 端点假设**: `/v2/lookups?type=GENDER` 或 `/v2/genders` (具体URL待确认)
- **API 响应结构假设**: `ApiGenderItem { id: string (e.g., "male"), name: string (e.g., "男"), code?: string }`
- **`lookupService.ts` 修改**: 
    - 已修改 `getGenderLookup` 以模拟API调用结构。
    - 返回的 `LookupItem.value` 是文本代码 (如 "male")，与现有 `Gender` 枚举和 `CreateEmployeePayload.gender` 兼容。
    - 包含注释掉的真实 `apiClient.get()` 调用和错误处理框架。
- **`types.ts` 和 `EmployeeForm.tsx`**: 基于上述假设，预计无需更改。
- **状态**: 结构性修改完成，等待真实API信息进行对接。


# —————————————————————————————————————————




- [2024-05-16 12:00:00] (AI) 修改：`frontend/v2/src/pages/HRManagement/types.ts` 和 `frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx`.
    - 更改 (`types.ts`): `CreateEmployeePayload` 和 `UpdateEmployeePayload` 更新为使用 `employee_code`, `first_name`, `last_name`, `hire_date`, `status_lookup_value_id` (当时为string).
- [2024-05-16 11:00:00] (AI) 修改：`frontend/v2/src/pages/HRManagement/components/EmployeeForm.tsx`。更改：在 `handleFormSubmit` 中对 `departmentId` 和 `positionId` 应用 `trim()` 方法。原因：解决因 `departmentId` 前导空格可能导致的422错误。状态：已应用。 