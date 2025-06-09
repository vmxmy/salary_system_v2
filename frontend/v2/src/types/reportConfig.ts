// 报表类型定义相关类型
export interface ReportTypeDefinitionBase {
  code: string;
  name: string;
  description?: string;
  category?: string;
  generator_class?: string;
  generator_module?: string;
  template_config?: any;
  default_config?: any;
  validation_rules?: any;
  required_permissions?: string[];
  allowed_roles?: string[];
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
}

export interface ReportTypeDefinitionCreate extends ReportTypeDefinitionBase {}

export interface ReportTypeDefinitionUpdate extends Partial<Omit<ReportTypeDefinitionBase, 'code'>> {}

export interface ReportTypeDefinition extends ReportTypeDefinitionBase {
  id: number;
  usage_count: number;
  last_used_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  data_source_id?: number;
  data_source_name?: string;
  fields?: string | number[];
}

export interface ReportTypeDefinitionListItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  is_system: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

// 报表字段定义相关类型
export interface ReportFieldDefinitionBase {
  field_name: string;
  field_alias?: string;
  field_type: string;
  data_source?: string;
  source_column?: string;
  display_name?: string;
  display_order: number;
  is_visible: boolean;
  is_required: boolean;
  is_sortable: boolean;
  is_filterable: boolean;
  format_config?: any;
  validation_rules?: any;
  default_value?: string;
  calculation_formula?: string;
  width?: number;
  alignment?: string;
  style_config?: any;
}

export interface ReportFieldDefinitionCreate extends ReportFieldDefinitionBase {
  report_type_id: number;
}

export interface ReportFieldDefinitionUpdate extends Partial<Omit<ReportFieldDefinitionBase, 'field_name'>> {}

export interface ReportFieldDefinition extends ReportFieldDefinitionBase {
  id: number;
  report_type_id: number;
  created_at: string;
  updated_at: string;
}

// 报表配置预设相关类型
export interface ReportConfigPresetBase {
  name: string;
  description?: string;
  category?: string;
  report_types: string[];
  default_config?: any;
  filter_config?: any;
  export_config?: any;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
}

export interface ReportConfigPresetCreate extends ReportConfigPresetBase {}

export interface ReportConfigPresetUpdate extends Partial<ReportConfigPresetBase> {}

export interface ReportConfigPreset extends ReportConfigPresetBase {
  id: number;
  usage_count: number;
  last_used_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ReportConfigPresetListItem {
  id: number;
  name: string;
  description?: string;
  category?: string;
  report_types: string[];
  is_active: boolean;
  is_public: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

// 批量报表相关类型
export interface BatchReportType {
  id: number; // 添加id字段
  code: string;
  name: string;
  description?: string;
  category?: string;
  default_config?: any;
  required_permissions?: string[];
  allowed_roles?: string[];
}

export interface BatchReportPreset {
  id: number;
  name: string;
  description?: string;
  category?: string;
  report_types: string[];
  default_config?: any;
  filter_config?: any;
  export_config?: any;
}

// API响应类型
export interface BatchReportTypesResponse {
  report_types: BatchReportType[];
  total_count: number;
}

export interface BatchReportPresetsResponse {
  presets: BatchReportPreset[];
  total_count: number;
}

// =================================================================
// Filter Configuration Types - ADDED
// =================================================================

// 筛选条件操作符
export type FilterOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'greater_than_or_equal'
  | 'less_than' | 'less_than_or_equal'
  | 'between' | 'not_between'
  | 'in' | 'not_in'
  | 'is_null' | 'is_not_null'
  | 'date_range' | 'date_equals'
  | 'date_before' | 'date_after';

// 单个筛选条件
export interface FilterCondition {
  id?: string; // 用于前端管理
  field_name: string; // 字段名
  field_display_name?: string; // 字段显示名称
  operator: FilterOperator; // 操作符
  value?: any; // 筛选值
  value_type?: 'static' | 'dynamic' | 'user_input'; // 值类型：静态值、动态值、用户输入
  is_required?: boolean; // 是否必填
  is_visible?: boolean; // 是否在用户界面显示
  description?: string; // 条件描述
}

// 筛选条件组（支持AND/OR逻辑）
export interface FilterGroup {
  id?: string;
  logic_operator: 'AND' | 'OR'; // 逻辑操作符
  conditions: FilterCondition[]; // 条件列表
  groups?: FilterGroup[]; // 嵌套的条件组
}

// 报表筛选配置
export interface ReportFilterConfig {
  enabled: boolean; // 是否启用筛选
  default_filters: FilterGroup; // 默认筛选条件
  user_configurable_filters: FilterCondition[]; // 用户可配置的筛选条件
  quick_filters?: { // 快速筛选选项
    [key: string]: {
      label: string;
      filters: FilterGroup;
    };
  };
}

// =================================================================
// Data Source and Data Source Field definitions - ADDED
// =================================================================

// The definition for a data source
export interface DataSource {
  id: number;
  code: string;
  name: string;
  description?: string;
  source_type: string; // e.g., 'view', 'table', 'custom_sql'
  source_details: any; // e.g., { "view_name": "v_employee_details" }
  schema_name: string;
  table_name?: string;
  view_name?: string;
  type?: string; // 兼容字段，映射到 source_type
  is_active: boolean;
  is_system: boolean;
  field_count?: number; // 字段数量
  last_sync_at?: string; // 最后同步时间
  sync_status?: string; // 同步状态
  connection_type?: string; // 连接类型
  fields?: DataSourceField[];
  created_at: string;
  updated_at: string;
}

// The definition for a field within a data source
export interface DataSourceField {
  id: number;
  data_source_id: number;
  field_name: string;
  field_alias?: string;
  field_type: string;
  data_type: string; // e.g., 'TEXT', 'INTEGER', 'TIMESTAMP'
  display_name_zh?: string;
  display_name_en?: string;
  description?: string;
  is_primary_key: boolean;
  is_visible: boolean;
  is_sortable: boolean;
  is_filterable: boolean;
  is_nullable?: boolean; // 是否可为空
  length?: number; // 字段长度
  precision?: number; // 精度
  scale?: number; // 小数位数
  display_order: number;
} 