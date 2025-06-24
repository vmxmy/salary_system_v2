// 员工管理模块入口文件
export { default as EmployeeManagementPage } from './EmployeeManagementPage';
export { default as EmployeeDetailPage } from './EmployeeDetailPage';
export { default as CreateEmployeePage } from './CreateEmployeePage';
export { default as EditEmployeePage } from './EditEmployeePage';


// 导出组件
export { default as EmployeeForm } from './components/EmployeeForm';

// 导出Hook
export { useEmployeeManagement } from './hooks/useEmployeeManagement';

// 导出API服务
export { employeeManagementApi } from './services/employeeManagementApi';

// 导出类型
export type {
  EmployeeManagementItem,
  EmployeeManagementQuery,
  CreateEmployeeData,
  UpdateEmployeeData,
  EmployeeManagementPageResult,
  TableFilters,
  TableSorter,
  TableColumnConfig,
} from './types'; 