// 通用组件导出索引

// 薪资周期选择器
export { default as PayrollPeriodSelector } from './PayrollPeriodSelector';

// 查找值选择器
export { default as LookupSelect } from './LookupSelect';
export type { LookupType } from './LookupSelect';

// 员工选择器
export { default as EmployeeSelector } from './EmployeeSelector';

// 状态标签
export { default as StatusTag } from './StatusTag';
export type { StatusType } from './StatusTag';

// 日期范围选择器
export { default as DateRangePicker } from './DateRangePicker';
export type { PresetRange } from './DateRangePicker';

// 表单构建器
export { default as FormBuilder } from './FormBuilder';
export type { 
  FormBuilderProps, 
  FormBuilderRef, 
  FormFieldConfig, 
  FormLayoutConfig, 
  FormFieldType 
} from './FormBuilder';

// 数据表格
export { default as DataTable } from './DataTable';
export type { 
  DataTableProps, 
  DataTableColumn, 
  ToolbarConfig, 
  TableSize, 
  TableDensity, 
  ExportFormat 
} from './DataTable';

// 搜索表单
export { default as SearchForm } from './SearchForm';
export type { 
  SearchFormProps, 
  SearchFormRef, 
  SearchFormConfig 
} from './SearchForm';

// 模态框表单
export { default as ModalForm } from './ModalForm';
export type { 
  ModalFormProps, 
  ModalFormRef, 
  ModalFormConfig, 
  ModalFormMode 
} from './ModalForm';

// 列表页面
export { default as ListPage } from './ListPage';
export type { 
  ListPageProps, 
  ListPageRef, 
  ListPageConfig, 
  ListPagePermissions, 
  ListPageService, 
  ListPageRoutes, 
  ListPageMessages, 
  DeleteConfirmConfig 
} from './ListPage';

// 现代化设计系统组件
export { default as ModernPageTemplate } from './ModernPageTemplate';
export type { ModernPageTemplateProps } from './ModernPageTemplate';

export { default as ModernCard } from './ModernCard';
export type { ModernCardProps } from './ModernCard';

export { default as ModernButton } from './ModernButton';
export type { ModernButtonProps } from './ModernButton';

export { default as ModernButtonGroup } from './ModernButtonGroup';
export type { ModernButtonGroupProps } from './ModernButtonGroup';

// 现有组件（保持向后兼容）
export { default as TableTextConverter } from './TableTextConverter';
export { default as EmployeeName } from './EmployeeName';
export { default as EmployeeSelect } from './EmployeeSelect';
export { default as EnhancedProTable } from './EnhancedProTable'; 