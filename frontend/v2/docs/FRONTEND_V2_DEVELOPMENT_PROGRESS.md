# 人事工资管理系统 v2 前端开发进度

**最后更新**: {{YYYY-MM-DD HH:MM}}

## 1. 项目基本设置与配置

- [X] **环境配置**: 创建 `.env` 文件并配置 `VITE_API_BASE_URL` (指向 `http://localhost:8000/v2` 或实际后端地址)。
- 用户已指定使用 `/Users/xumingyang/app/高新区工资信息管理/salary_system/.env`，并会手动确保 `frontend/v2/.env` 配置正确。
- [X] **状态管理 (Zustand)**: 安装 `zustand` 依赖。
- [X] **样式配置**:
    - [X] (可选) 将 `src/index.css` 迁移或重命名为 `src/styles/index.less`。
    - [X] 创建 `src/styles/theme.less` 用于 Ant Design 主题定制 (可先为空文件)。

## 2. API 服务层重构 (`src/api/`)

- [X] **`api/index.ts` (Axios 实例)**:
    - [X] 创建文件，迁移 Axios 实例配置。
    - [X] 修正 `baseURL` 读取和包含 `/v2`。
    - [X] 实现请求拦截器 (附加认证 Token)。
    - [X] 实现响应拦截器 (全局错误处理，如401跳转)。
- [X] **`api/types.ts`**: 创建文件，开始定义核心 API 数据类型 (e.g., `User`, `Role`, `LoginResponse`, `ApiResponse<T>`).
- [X] **`api/auth.ts`**:
    - [X] 创建文件，迁移 `login` 函数。
    - [X] 确保与 `api/index.ts` 中的 Axios 实例集成。
- [X] **`api/users.ts`**: 创建文件，迁移用户相关函数。
- [X] **`api/roles.ts`**: 创建文件，迁移角色相关函数。
- [ ] (后续) 根据模块开发进度，创建其他 service 文件 (e.g., `employees.ts`, `payroll.ts`).

## 3. 状态管理实现 (`src/store/`)

- [X] **`store/authStore.ts`**:
    - [X] 创建文件，定义 store 结构 (`authToken`, `currentUserNumericId`, `currentUser`, `isLoadingUser`, `loginError`, `fetchUserError` 等)。
    - [X] 实现 `loginAction`, `logoutAction`, `fetchCurrentUserDetails`, `initializeAuth`。
    - [X] 集成 `persist` 中间件进行 `localStorage` 持久化。
- [ ] **`store/userStore.ts` (可选)**: 根据需要创建。 (暂不执行，currentUser 在 authStore 中)

## 4. 路由系统重构 (`src/router/`)

- [X] **`router/ProtectedRoute.tsx`**:
    - [X] 将 `localStorage` 读取改为从 `authStore` 获取状态。
    - [X] 链接到实际的 `/unauthorized` 页面 (已创建 `UnauthorizedPage.tsx`)。
- [X] **`router/routes.ts` (或 `routes.tsx` 重构)**:
    - [ ] 确保 `meta.requiredRoles` 能正确与 `authStore` 中的用户角色比较 (后续RBAC任务)。
- [X] **`pages/UnauthorizedPage.tsx`**: 创建简单的无权限提示页面。
- [X] **路由配置入口**: 在 `AppWrapper.tsx` (替代 `App.tsx`) 和 `main.tsx` 中使用 `createBrowserRouter` 和 `RouterProvider` 集成 `routes.tsx` 中的路由定义。

## 5. 核心布局与认证流程

- [X] **`layouts/AuthLayout.tsx`**: (隐式存在或 LoginPage 自带布局) - 登录页已实现。
- [X] **`pages/Auth/LoginPage.tsx`** (实际为 `pages/LoginPage.tsx`):
    - [X] 完善 UI (Ant Design Form)。
    - [X] 集成 `api/auth.ts` 的 `login` 服务。
    - [X] 集成 `store/authStore.ts` 的 `loginAction`。
    - [X] 实现登录成功后的导航和错误提示。
- [ ] **`layouts/AdminLayout.tsx` (或 `MainLayout.tsx`)**:
    - [X] 创建基础布局 (Header, Sider, Content) (已有 `MainLayout.tsx`)。
    - [ ] Header: 实现用户信息展示和登出按钮 (调用 `authStore.logoutAction`)。
    - [ ] Sider: 实现动态菜单生成 (基于路由配置和 `authStore` 用户权限)。
- [X] **`pages/DashboardPage.tsx`**: 确保在 `AdminLayout` (即 `MainLayout.tsx`) 中正确渲染，作为登录后默认页之一。
- [X] **核心认证流程调试与验证**:
    - [X] 解决 "Maximum update depth exceeded" 无限循环错误 (通过优化Zustand selector和`authStore`逻辑)。
    - [X] 详细测试并验证四种关键认证场景（首次空缓存加载、用户登录、已登录刷新、用户登出），确认行为符合预期。
    - [X] 完善 `AppWrapper.tsx` 进行全局认证状态初始化。

## 6. 系统管理员模块 (初步)

- [ ] **用户管理 (`src/pages/Admin/Users/`)**:
    - [ ] `UserListPage.tsx` (已有 `UserListPage` 在 `routes.tsx` 中引用，需创建或完善文件):
        - [ ] 使用 `react-query` 调用 `api/users.ts` 中的 `getUsers` (待实现) 获取用户列表。
        - [ ] 使用 Ant Design `Table` 展示用户数据。
        - [ ] 实现分页 (如果 API 支持)。
        - [ ] 添加"创建用户"按钮 (功能后续实现)。
- [ ] **角色管理 (`src/pages/Admin/Roles/`)**:
    - [ ] `RoleListPage.tsx` (已有 `RoleListPage` 在 `routes.tsx` 中引用，需创建或完善文件):
        - [ ] 使用 `react-query` 调用 `api/roles.ts` 中的 `getRoles` (待实现) 获取角色列表。
        - [ ] 使用 Ant Design `Table` 展示。

## 7. v1 组件复用调研

- [ ] (持续性任务) 在开发各模块时，主动查找 `frontend/v1/salary-viewer` 下可复用的通用组件，并尝试迁移适配。

## 任务执行记录

*   {{YYYY-MM-DD HH:MM}} - [MODE: PLAN] - 任务: 初始化前端开发计划和进度管理文件。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 创建 `frontend/v2/docs/FRONTEND_V2_DEVELOPMENT_PROGRESS.md`。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.1 配置 `.env` 文件。 - 状态: 用户代为完成
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.2 安装 `zustand` 依赖。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.3.2 创建 `src/styles/theme.less`。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 安装 `less` 依赖。 - 状态: 成功 (用户已确认安装)
*   {{YYYY-MM-DD HH:MESS}} - [MODE: EXECUTE] - 任务: 2.3.1 迁移 `index.css` 到 `styles/index.less` 并更新导入。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.1.1, 2.1.2 创建 `api/index.ts` 并配置 Axios 实例及 baseURL。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.1.3 在 `api/index.ts` 实现请求拦截器。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.1.4 在 `api/index.ts` 实现响应拦截器。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.2 创建 `api/types.ts` 并定义基础 API 类型。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.3 创建 `api/auth.ts` 并迁移 `login` 函数。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.4 创建 `api/users.ts` 并迁移用户相关函数。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.5 创建 `api/roles.ts` 并迁移角色相关函数。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 2.6 删除已清空的 `api/api.ts` 文件。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 3.1 创建 `store/authStore.ts` 并实现基础认证状态和Action。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 3.2 `store/userStore.ts` (可选)。 - 状态: 暂不执行
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 4.1 创建 `router/ProtectedRoute.tsx` 并集成 `authStore`。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 调整 `LoginPage.tsx` UI以匹配截图。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 修正 `styles/index.less` 中的全局 `body` 和 `#root` 样式以解决登录页布局问题。 - 状态: 成功
*   {{YYYY-MM-DD HH:MM}} - [MODE: EXECUTE] - 任务: 核心认证流程全面调试与验证。对`authStore.ts` (`initializeAuth`, `loginAction`, `logoutAction`, `fetchCurrentUserDetails`), `LoginPage.tsx`, `ProtectedRoute.tsx`, `AppWrapper.tsx` 进行日志添加、逻辑梳理和问题修复。成功解决了 "Maximum update depth exceeded" 无限循环错误。详细测试并验证了四种关键认证场景（首次空缓存加载、用户登录、已登录刷新、用户登出），确认其行为均符合预期。为后续RBAC和功能开发奠定了坚实的认证基础。 - 状态: 成功

--- 