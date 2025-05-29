import apiClient from './apiClient';

// 数据源相关接口
export interface DataSource {
  id: number;
  name: string;
  table_name: string;
  schema_name: string;
  description?: string;
  connection_config?: any;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
  fields: DataSourceField[];
}

export interface DataSourceField {
  id: number;
  data_source_id: number;
  field_name: string;
  field_type: string;
  is_nullable: boolean;
  comment?: string;
  display_name_zh?: string;
  display_name_en?: string;
  is_visible: boolean;
  sort_order: number;
}

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

export interface ReportTemplate {
  id: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  data_source_id?: number;
  template_config?: any;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  usage_count: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  fields: TemplateField[];
}

export interface TemplateField {
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
  formatting_config?: any;
  calculation_formula?: string;
}

export interface ReportExecution {
  id: number;
  template_id: number;
  execution_params?: any;
  status: string;
  result_count?: number;
  execution_time?: number;
  error_message?: string;
  file_path?: string;
  executed_by?: number;
  executed_at: string;
}

// 数据源API
export const dataSourceAPI = {
  // 获取数据源列表
  getDataSources: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<DataSource[]>('/reports/data-sources', { params }),

  // 获取数据源详情
  getDataSource: (id: number) =>
    apiClient.get<DataSource>(`/reports/data-sources/${id}`),

  // 创建数据源
  createDataSource: (data: Partial<DataSource>) =>
    apiClient.post<DataSource>('/reports/data-sources', data),

  // 更新数据源
  updateDataSource: (id: number, data: Partial<DataSource>) =>
    apiClient.put<DataSource>(`/reports/data-sources/${id}`, data),

  // 删除数据源
  deleteDataSource: (id: number) =>
    apiClient.delete(`/reports/data-sources/${id}`),

  // 检测数据源字段
  detectFields: (data: { table_name: string; schema_name?: string }) =>
    apiClient.post('/reports/data-sources/detect-fields', data),

  // 获取数据源字段
  getDataSourceFields: (dataSourceId: number) =>
    apiClient.get<DataSourceField[]>(`/reports/data-sources/${dataSourceId}/fields`),
};

// 计算字段API
export const calculatedFieldAPI = {
  // 获取计算字段列表
  getCalculatedFields: (params?: { skip?: number; limit?: number; is_global?: boolean }) =>
    apiClient.get<CalculatedField[]>('/reports/calculated-fields', { params }),

  // 获取计算字段详情
  getCalculatedField: (id: number) =>
    apiClient.get<CalculatedField>(`/reports/calculated-fields/${id}`),

  // 创建计算字段
  createCalculatedField: (data: Partial<CalculatedField>) =>
    apiClient.post<CalculatedField>('/reports/calculated-fields', data),

  // 更新计算字段
  updateCalculatedField: (id: number, data: Partial<CalculatedField>) =>
    apiClient.put<CalculatedField>(`/reports/calculated-fields/${id}`, data),

  // 删除计算字段
  deleteCalculatedField: (id: number) =>
    apiClient.delete(`/reports/calculated-fields/${id}`),

  // 测试公式
  testFormula: (formula: string, dataSourceId?: number) =>
    apiClient.post('/reports/calculated-fields/test-formula', { formula, data_source_id: dataSourceId }),
};

// 报表模板API
export const reportTemplateAPI = {
  // 获取报表模板列表
  getTemplates: (params?: { skip?: number; limit?: number; is_public?: boolean }) =>
    apiClient.get<ReportTemplate[]>('/reports/templates', { params }),

  // 获取报表模板详情
  getTemplate: (id: number) =>
    apiClient.get<ReportTemplate>(`/reports/templates/${id}`),

  // 创建报表模板
  createTemplate: (data: Partial<ReportTemplate>) =>
    apiClient.post<ReportTemplate>('/reports/templates', data),

  // 更新报表模板
  updateTemplate: (id: number, data: Partial<ReportTemplate>) =>
    apiClient.put<ReportTemplate>(`/reports/templates/${id}`, data),

  // 删除报表模板
  deleteTemplate: (id: number) =>
    apiClient.delete(`/reports/templates/${id}`),

  // 获取模板字段
  getTemplateFields: (templateId: number) =>
    apiClient.get<TemplateField[]>(`/reports/templates/${templateId}/fields`),
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