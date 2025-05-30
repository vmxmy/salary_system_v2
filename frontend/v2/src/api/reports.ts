import apiClient from './apiClient';

// 数据源字段接口
export interface DataSourceField {
  id: number;
  data_source_id: number;
  field_name: string;
  field_alias?: string;
  field_type: string;
  data_type?: string;
  
  // 显示配置
  display_name_zh?: string;
  display_name_en?: string;
  description?: string;
  
  // 字段属性
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  is_indexed: boolean;
  
  // 显示和权限控制
  is_visible: boolean;
  is_searchable: boolean;
  is_sortable: boolean;
  is_filterable: boolean;
  is_exportable: boolean;
  
  // 分组和分类
  field_group?: string;
  field_category?: string;
  sort_order: number;
  
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
  enable_aggregation: boolean;
  aggregation_functions?: string[];
  
  created_at: string;
  updated_at: string;
}

// 数据源接口
export interface DataSource {
  id: number;
  
  // 基础信息
  name: string;
  code: string;
  description?: string;
  category?: string;
  
  // 数据库连接信息
  connection_type: string;
  schema_name: string;
  table_name?: string;
  view_name?: string;
  custom_query?: string;
  
  // 数据源类型
  source_type: 'table' | 'view' | 'query' | 'procedure';
  
  // 连接配置
  connection_config?: Record<string, any>;
  
  // 字段映射和配置
  field_mapping?: Record<string, any>;
  default_filters?: Record<string, any>;
  sort_config?: Record<string, any>;
  
  // 权限和访问控制
  access_level: 'public' | 'private' | 'restricted';
  allowed_roles?: string[];
  allowed_users?: number[];
  
  // 缓存和性能配置
  cache_enabled: boolean;
  cache_duration: number;
  max_rows: number;
  
  // 状态和显示
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  tags?: string[];
  
  // 统计信息
  field_count: number;
  usage_count: number;
  last_used_at?: string;
  last_sync_at?: string;
  
  // 审计字段
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  fields?: DataSourceField[];
}

// 数据源创建请求
export interface DataSourceCreateRequest {
  name: string;
  code: string;
  description?: string;
  category?: string;
  connection_type?: string;
  schema_name?: string;
  table_name?: string;
  view_name?: string;
  custom_query?: string;
  source_type?: 'table' | 'view' | 'query' | 'procedure';
  connection_config?: Record<string, any>;
  field_mapping?: Record<string, any>;
  default_filters?: Record<string, any>;
  sort_config?: Record<string, any>;
  access_level?: 'public' | 'private' | 'restricted';
  allowed_roles?: string[];
  allowed_users?: number[];
  cache_enabled?: boolean;
  cache_duration?: number;
  max_rows?: number;
  is_active?: boolean;
  sort_order?: number;
  tags?: string[];
  fields?: Partial<DataSourceField>[];
}

// 数据源更新请求
export interface DataSourceUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  connection_type?: string;
  schema_name?: string;
  table_name?: string;
  view_name?: string;
  custom_query?: string;
  source_type?: 'table' | 'view' | 'query' | 'procedure';
  connection_config?: Record<string, any>;
  field_mapping?: Record<string, any>;
  default_filters?: Record<string, any>;
  sort_config?: Record<string, any>;
  access_level?: 'public' | 'private' | 'restricted';
  allowed_roles?: string[];
  allowed_users?: number[];
  cache_enabled?: boolean;
  cache_duration?: number;
  max_rows?: number;
  is_active?: boolean;
  sort_order?: number;
  tags?: string[];
}

// 字段检测相关
export interface DetectedField {
  field_name: string;
  field_type: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  is_indexed: boolean;
  comment?: string;
  max_length?: number;
  default_value?: string;
}

export interface FieldDetectionRequest {
  schema_name?: string;
  table_name?: string;
  view_name?: string;
  custom_query?: string;
  connection_config?: Record<string, any>;
}

export interface FieldDetectionResponse {
  fields: DetectedField[];
  total_count: number;
  table_info?: Record<string, any>;
}

// 连接测试相关
export interface ConnectionTestRequest {
  connection_type: string;
  connection_config: Record<string, any>;
  schema_name?: string;
  table_name?: string;
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  response_time?: number;
  table_count?: number;
  error_details?: string;
}

// 数据源统计
export interface DataSourceStatistics {
  data_source_id: number;
  total_records?: number;
  last_record_time?: string;
  data_size?: string;
  index_count?: number;
  field_statistics?: Record<string, any>;
}

// 访问日志
export interface DataSourceAccessLog {
  id: number;
  data_source_id: number;
  user_id: number;
  access_type: string;
  access_result: string;
  query_params?: Record<string, any>;
  result_count?: number;
  execution_time?: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

// 数据源API
export const dataSourceAPI = {
  // 获取数据源列表
  getDataSources: (params?: { 
    skip?: number; 
    limit?: number;
    category?: string;
    source_type?: string;
    is_active?: boolean;
    search?: string;
  }) =>
    apiClient.get<DataSource[]>('/reports/data-sources', { params }),

  // 获取数据源详情
  getDataSource: (id: number) =>
    apiClient.get<DataSource>(`/reports/data-sources/${id}`),

  // 创建数据源
  createDataSource: (data: DataSourceCreateRequest) =>
    apiClient.post<DataSource>('/reports/data-sources', data),

  // 更新数据源
  updateDataSource: (id: number, data: DataSourceUpdateRequest) =>
    apiClient.put<DataSource>(`/reports/data-sources/${id}`, data),

  // 删除数据源
  deleteDataSource: (id: number) =>
    apiClient.delete(`/reports/data-sources/${id}`),

  // 测试连接
  testConnection: (data: ConnectionTestRequest) =>
    apiClient.post<ConnectionTestResponse>('/reports/data-sources/test-connection', data),

  // 检测字段
  detectFields: (data: FieldDetectionRequest) =>
    apiClient.post<FieldDetectionResponse>('/reports/data-sources/detect-fields', data),

  // 同步字段
  syncFields: (id: number) =>
    apiClient.post(`/reports/data-sources/${id}/sync-fields`),

  // 获取数据源字段
  getDataSourceFields: (dataSourceId: number) =>
    apiClient.get<DataSourceField[]>(`/reports/data-sources/${dataSourceId}/fields`),

  // 更新字段配置
  updateField: (fieldId: number, data: Partial<DataSourceField>) =>
    apiClient.put<DataSourceField>(`/reports/data-source-fields/${fieldId}`, data),

  // 批量更新字段
  batchUpdateFields: (dataSourceId: number, fields: Partial<DataSourceField>[]) =>
    apiClient.put(`/reports/data-sources/${dataSourceId}/fields/batch`, { fields }),

  // 获取数据源统计
  getStatistics: (id: number) =>
    apiClient.get<DataSourceStatistics>(`/reports/data-sources/${id}/statistics`),

  // 获取访问日志
  getAccessLogs: (id: number, params?: { skip?: number; limit?: number }) =>
    apiClient.get<DataSourceAccessLog[]>(`/reports/data-sources/${id}/access-logs`, { params }),

  // 预览数据
  previewData: (id: number, params?: { limit?: number; filters?: Record<string, any> }) =>
    apiClient.get(`/reports/data-sources/${id}/preview`, { params }),
};

// 计算字段相关接口
export interface CalculatedField {
  id: number;
  name: string;
  alias: string;
  formula: string;
  return_type: string;
  description?: string;
  display_name_zh?: string;
  display_name_en?: string;
  is_global: boolean;
  is_active: boolean;
  category?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export const calculatedFieldAPI = {
  getCalculatedFields: (params?: { skip?: number; limit?: number; category?: string; is_global?: boolean }) =>
    apiClient.get<CalculatedField[]>('/reports/calculated-fields', { params }),

  getCalculatedField: (id: number) =>
    apiClient.get<CalculatedField>(`/reports/calculated-fields/${id}`),

  createCalculatedField: (data: Partial<CalculatedField>) =>
    apiClient.post<CalculatedField>('/reports/calculated-fields', data),

  updateCalculatedField: (id: number, data: Partial<CalculatedField>) =>
    apiClient.put<CalculatedField>(`/reports/calculated-fields/${id}`, data),

  deleteCalculatedField: (id: number) =>
    apiClient.delete(`/reports/calculated-fields/${id}`),

  validateFormula: (formula: string, dataSourceId?: number) =>
    apiClient.post('/reports/calculated-fields/validate-formula', { formula, data_source_id: dataSourceId }),
};

// 报表模板相关接口
export interface ReportTemplate {
  id: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  data_source_id?: number;
  template_config?: Record<string, any>;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  usage_count: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  fields?: ReportTemplateField[];
}

export interface ReportTemplateField {
  id: number;
  template_id: number;
  field_name: string;
  field_alias?: string;
  data_source: string;
  field_type: string;
  display_order: number;
  is_visible: boolean;
  is_sortable: boolean;
  is_filterable: boolean;
  width?: number;
  formatting_config?: Record<string, any>;
  calculation_formula?: string;
}

// 报表执行相关接口
export interface ReportExecution {
  id: number;
  template_id: number;
  execution_params?: Record<string, any>;
  status: string;
  result_count?: number;
  execution_time?: number;
  error_message?: string;
  file_path?: string;
  executed_by?: number;
  executed_at: string;
}

export const reportTemplateAPI = {
  getTemplates: (params?: { skip?: number; limit?: number; category?: string; is_public?: boolean }) =>
    apiClient.get<ReportTemplate[]>('/reports/templates', { params }),

  getTemplate: (id: number) =>
    apiClient.get<ReportTemplate>(`/reports/templates/${id}`),

  createTemplate: (data: Partial<ReportTemplate>) =>
    apiClient.post<ReportTemplate>('/reports/templates', data),

  updateTemplate: (id: number, data: Partial<ReportTemplate>) =>
    apiClient.put<ReportTemplate>(`/reports/templates/${id}`, data),

  deleteTemplate: (id: number) =>
    apiClient.delete(`/reports/templates/${id}`),

  executeTemplate: (id: number, params?: Record<string, any>) =>
    apiClient.post(`/reports/templates/${id}/execute`, params),

  exportTemplate: (id: number, format: 'excel' | 'csv' | 'pdf', params?: Record<string, any>) =>
    apiClient.post(`/reports/templates/${id}/export/${format}`, params, { responseType: 'blob' }),
};

// 报表执行API
export const reportExecutionAPI = {
  // 获取执行记录列表
  getExecutions: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<ReportExecution[]>('/reports/executions', { params }),

  // 获取执行记录详情
  getExecution: (id: number) =>
    apiClient.get<ReportExecution>(`/reports/executions/${id}`),

  // 执行报表
  executeReport: (data: { template_id: number; execution_params?: any }) =>
    apiClient.post<ReportExecution>('/reports/executions', data),

  // 查询报表数据
  queryReportData: (data: {
    template_id: number;
    filters?: any;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }) =>
    apiClient.post('/reports/query', data),
}; 