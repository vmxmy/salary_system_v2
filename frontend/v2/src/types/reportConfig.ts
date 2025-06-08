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