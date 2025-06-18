// 工资数据模态框预设配置类型定义

export interface ColumnFilterConfig {
  hideJsonbColumns: boolean;
  hideZeroColumns: boolean;
  hideEmptyColumns: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  minValueThreshold: number;
  maxValueThreshold: number;
  showOnlyNumericColumns: boolean;
}

export interface ColumnSettings {
  [key: string]: {
    show: boolean;
    order?: number;
    width?: number;
    fixed?: 'left' | 'right' | false;
  };
}

// 新增：表头筛选状态
export interface TableFilterState {
  filters?: Record<string, any>; // ProTable的filters状态
  sorter?: {
    field?: string;
    order?: 'ascend' | 'descend';
    column?: any;
    columnKey?: string;
  } | Array<{
    field?: string;
    order?: 'ascend' | 'descend';
    column?: any;
    columnKey?: string;
  }>; // ProTable的sorter状态
  pagination?: {
    current?: number;
    pageSize?: number;
    total?: number;
  }; // 分页状态
  searchQuery?: string; // 全局搜索查询
  searchMode?: 'fuzzy' | 'exact' | 'regex'; // 搜索模式
}

export interface PayrollDataModalPreset {
  id?: number;
  name: string;
  description?: string;
  category?: string; // 新增：预设分组
  filterConfig: ColumnFilterConfig;
  columnSettings: ColumnSettings;
  tableFilterState?: TableFilterState; // 新增：表头筛选状态
  isDefault?: boolean;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  usageCount?: number;
  lastUsedAt?: string;
}

export interface PresetSaveRequest {
  name: string;
  description?: string;
  category?: string; // 新增：预设分组
  filterConfig: ColumnFilterConfig;
  columnSettings: ColumnSettings;
  tableFilterState?: TableFilterState; // 新增：表头筛选状态
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface PresetListResponse {
  presets: PayrollDataModalPreset[];
  total: number;
}

export interface PresetCategory {
  key: string;
  label: string;
  presets: PayrollDataModalPreset[];
}

// 预设分组管理接口
export interface PresetGroup {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
} 