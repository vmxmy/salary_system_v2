import type { ProColumns } from '@ant-design/pro-components';
import type { MenuProps } from 'antd';

// 报表模板接口
export interface ReportTemplate {
  id: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  is_favorite?: boolean;
  last_run_at?: string;
  run_count?: number;
}

// 报表数据接口
export interface ReportData {
  columns: ProColumns<any>[];
  data: any[];
  total: number;
  summary?: {
    [key: string]: number | string;
  };
}

// 报表筛选条件接口
export interface ReportFilter {
  dateRange?: [string, string];
  department?: string;
  employee?: string;
  [key: string]: any;
}

// 布局配置接口
export interface LayoutConfig {
  templateSpan: number;
  contentSpan: number;
  direction: 'horizontal' | 'vertical';
}

// 报表模板选择器Props
export interface ReportTemplateSelectorProps {
  templates: ReportTemplate[];
  searchText: string;
  selectedCategory: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTemplateSelect: (template: ReportTemplate) => void;
  onToggleFavorite: (template: ReportTemplate) => void;
  onRefresh: () => void;
  isMobile?: boolean;
}

// 报表数据展示Props
export interface ReportDataDisplayProps {
  reportData: ReportData | null;
  selectedTemplate: ReportTemplate | null;
  loading: boolean;
  isMobile?: boolean;
  onReload?: () => void;
}

// 报表操作工具栏Props
export interface ReportActionToolbarProps {
  selectedTemplate: ReportTemplate | null;
  reportData: ReportData | null;
  onFilter: () => void;
  onExport: (format: string) => void;
  onPrint: () => void;
  onShare: () => void;
  isMobile?: boolean;
}

// 报表统计信息Props
export interface ReportStatisticsProps {
  summary: { [key: string]: number | string };
}

// 报表筛选对话框Props
export interface ReportFilterModalProps {
  visible: boolean;
  filters: ReportFilter;
  onCancel: () => void;
  onConfirm: (filters: ReportFilter) => void;
  isMobile?: boolean;
}

// 导出菜单项类型
export interface ExportMenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
} 