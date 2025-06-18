# 项目大文件检索报告

已成功查找并列出当前项目中所有行数超过 1000 行的代码文件。

**扫描结果总结：**
- **总扫描文件数**：958 个代码文件
- **超过 1000 行的文件数**：23 个

**行数超过 1000 行的代码文件列表（按行数降序排列）：**

1. **16,748 行** - `frontend/v2/package-lock.json` (依赖锁定文件)
2. **9,855 行** - `docs/openapi.md` (API 文档)
3. **3,450 行** - `webapp/v2/routers/simple_payroll.py` (简单工资路由)
4. **2,571 行** - `frontend/v2/src/pages/SimplePayroll/components/PayrollDataModal.tsx` (工资数据模态框组件)
5. **2,384 行** - `webapp/v2/routers/simple_payroll_backup.py` (简单工资路由备份)
6. **2,179 行** - `frontend/v2/src/pages/Admin/Configuration/ReportConfigManagement.tsx` (报表配置管理组件)
7. **1,797 行** - `frontend/v2/src/pages/SimplePayroll/components/EnhancedWorkflowGuide.tsx` (增强工作流指南组件)
8. **1,687 行** - `frontend/v2/src/pages/SimplePayroll/styles.less` (简单工资样式文件)
9. **1,605 行** - `frontend/v2/src/components/MetricCard/MetricCard.less` (指标卡片样式文件)
10. **1,511 行** - `webapp/v2/routers/config_backup_20250601_132007.py` (配置备份文件)
11. **1,501 行** - `frontend/v2/src/pages/Payroll/components/WorkflowSteps/DataReviewStep.tsx` (数据审核步骤组件)
12. **1,489 行** - `webapp/v2/routers/payroll.py` (工资路由)
13. **1,475 行** - `frontend/v2/src/pages/SimplePayroll/styles-modern.less` (现代简单工资样式)
14. **1,446 行** - `webapp/v2/routers/views.py` (视图路由)
15. **1,364 行** - `frontend/v2/src/pages/Payroll/components/PayrollEntryFormModal.tsx` (工资录入表单模态框)
16. **1,345 行** - `docs/flow/workflow_tech_stack.md` (工作流技术栈文档)
17. **1,304 行** - `frontend/package-lock.json` (前端依赖锁定文件)
18. **1,237 行** - `webapp/v2/routers/report_config_management.py` (报表配置管理路由)
19. **1,192 行** - `frontend/v2/src/pages/SimplePayroll/services/simplePayrollApi.ts` (简单工资 API 服务)
20. **1,134 行** - `webapp/v2/services/simple_payroll/employee_salary_config_service.py` (员工工资配置服务)
21. **1,043 行** - `webapp/v2/services/simple_payroll/payroll_audit_service.py` (工资审计服务)
22. **1,020 行** - `frontend/v2/src/pages/SimplePayroll/components/QuickActions.tsx` (快速操作组件)
23. **1,007 行** - `webapp/v2/crud/payroll/bulk_operations.py` (工资批量操作)

**文件类型分析：**
- **后端 Python 文件**：9 个（主要是路由、服务和 CRUD 操作）
- **前端 TypeScript/TSX 文件**：8 个（主要是页面组件和服务）
- **样式文件 (LESS)**：3 个
- **配置/依赖文件**：2 个 (package-lock.json)
- **文档文件**：2 个

**主要发现：**
1. 最大的文件是前端依赖锁定文件 (16,748 行)
2. 核心业务逻辑文件中，简单工资路由文件最大 (3,450 行)
3. 前端组件中，工资数据模态框组件最复杂 (2,571 行)
4. 多个文件超过 1,500 行，可能需要考虑重构以提高可维护性。