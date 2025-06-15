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

export interface PayrollDataModalPreset {
  id?: number;
  name: string;
  description?: string;
  filterConfig: ColumnFilterConfig;
  columnSettings: ColumnSettings;
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
  filterConfig: ColumnFilterConfig;
  columnSettings: ColumnSettings;
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