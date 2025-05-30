// frontend/v2/src/pages/Admin/ReportManagement/types.ts

/**
 * Props for the DataSourceEdit component.
 */
export interface DataSourceEditProps {
  mode?: 'create' | 'edit';
}

/**
 * 报表数据源接口 - 与后端模型保持一致
 */
export interface ReportDataSource {
  id?: number;
  
  // 基础信息
  code: string;
  name: string;
  description?: string;
  category?: string;
  
  // 连接配置
  connection_type: string;
  schema_name: string;
  table_name?: string;
  view_name?: string;
  custom_query?: string;
  source_type: 'table' | 'view' | 'query' | 'procedure';
  
  // 高级配置
  connection_config?: Record<string, any>;
  field_mapping?: Record<string, any>;
  default_filters?: Record<string, any>;
  sort_config?: Record<string, any>;
  
  // 权限控制
  access_level?: 'public' | 'private' | 'restricted';
  allowed_roles?: string[];
  allowed_users?: number[];
  
  // 性能配置
  cache_enabled?: boolean;
  cache_duration?: number;
  max_rows?: number;
  
  // 状态和显示
  is_active?: boolean;
  is_system?: boolean;
  sort_order?: number;
  tags?: string[];
  
  // 统计信息
  field_count?: number;
  usage_count?: number;
  last_used_at?: string;
  last_sync_at?: string;
  
  // 审计字段
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  
  // 关联数据
  fields?: DataSourceField[];
}

/**
 * 数据源字段接口 - 增强版
 */
export interface DataSourceField {
  id?: number;
  data_source_id?: number;
  
  // 基础字段信息
  field_name: string;
  field_alias?: string;
  field_type: string; // text, number, date, boolean, json, array, object, datetime
  data_type?: string; // 原始数据库类型
  
  // 显示配置
  display_name_zh?: string;
  display_name_en?: string;
  description?: string;
  
  // 字段属性
  is_nullable?: boolean;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  is_indexed?: boolean;
  
  // 显示和权限控制
  is_visible?: boolean;
  is_searchable?: boolean;
  is_sortable?: boolean;
  is_filterable?: boolean;
  is_exportable?: boolean;
  
  // 分组和分类
  field_group?: string;
  field_category?: string;
  sort_order?: number;
  
  // 格式化配置
  format_config?: {
    format_type?: 'number' | 'currency' | 'percentage' | 'date' | 'text';
    decimal_places?: number;
    prefix?: string;
    suffix?: string;
    date_format?: string;
    thousand_separator?: boolean;
  };
  validation_rules?: Record<string, any>;
  lookup_config?: Record<string, any>;
  
  // 统计配置
  enable_aggregation?: boolean;
  aggregation_functions?: string[];
  
  // 审计字段
  created_at?: string;
  updated_at?: string;
}

/**
 * 报表模板接口
 */
export interface ReportTemplate {
  id?: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  data_source_id?: number;
  template_config?: Record<string, any>;
  is_active?: boolean;
  is_public?: boolean;
  sort_order?: number;
  usage_count?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  
  // 关联数据
  data_source?: ReportDataSource;
  fields?: ReportTemplateField[];
  executions?: ReportExecution[];
}

/**
 * 报表模板字段接口
 */
export interface ReportTemplateField {
  id?: number;
  template_id: number;
  field_name: string;
  field_alias?: string;
  data_source: string;
  field_type: string;
  display_order?: number;
  is_visible?: boolean;
  is_sortable?: boolean;
  is_filterable?: boolean;
  width?: number;
  formatting_config?: Record<string, any>;
  calculation_formula?: string;
}

/**
 * 报表执行记录接口
 */
export interface ReportExecution {
  id?: number;
  template_id: number;
  execution_params?: Record<string, any>;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  result_count?: number;
  execution_time?: number;
  error_message?: string;
  file_path?: string;
  file_size?: number;
  file_format?: 'xlsx' | 'csv' | 'pdf';
  executed_by?: number;
  executed_at?: string;
}

/**
 * 计算字段接口
 */
export interface ReportCalculatedField {
  id?: number;
  name: string;
  alias: string;
  formula: string;
  return_type: string;
  description?: string;
  display_name_zh?: string;
  display_name_en?: string;
  is_global?: boolean;
  is_active?: boolean;
  category?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 报表权限接口
 */
export interface ReportPermission {
  id?: number;
  subject_type: 'user' | 'role' | 'department';
  subject_id: number;
  object_type: 'data_source' | 'template' | 'field';
  object_id: number;
  permission_type: 'read' | 'write' | 'execute' | 'export' | 'admin';
  is_granted?: boolean;
  conditions?: Record<string, any>;
  granted_by?: number;
  granted_at?: string;
  expires_at?: string;
}

/**
 * 用户偏好设置接口
 */
export interface ReportUserPreference {
  id?: number;
  user_id: number;
  preference_type: 'layout' | 'filter' | 'sort' | 'export';
  object_type?: 'template' | 'data_source';
  object_id?: number;
  preference_config: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * 数据源访问日志接口
 */
export interface ReportDataSourceAccessLog {
  id?: number;
  data_source_id: number;
  user_id: number;
  access_type: 'view' | 'query' | 'export' | 'test';
  access_result: 'success' | 'failed' | 'denied';
  query_params?: Record<string, any>;
  result_count?: number;
  execution_time?: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  accessed_at?: string;
}

// 兼容性类型定义 - 保持向后兼容
export interface DataSourceConfig extends Record<string, any> {
  fields?: DataSourceField[];
}

export interface DetectedField {
  field_name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  is_indexed: boolean;
  comment?: string;
  field_type: string;
}

export type APIConnectionParams = DataSourceConfig;
export type PreviewData = Record<string, any>[];

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  response_time?: number;
  table_count?: number;
  error_details?: string;
}