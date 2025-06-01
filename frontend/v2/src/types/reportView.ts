/**
 * 报表视图相关类型定义
 * @description 定义报表视图模块的所有TypeScript接口和类型
 */

// 基础报表视图接口
export interface ReportView {
  id: number;
  name: string;
  description?: string;
  view_name: string;
  sql_query: string;
  schema_name: string;
  is_active: boolean;
  is_public: boolean;
  category?: string;
  report_title?: string;
  description_lines?: string[];
  view_status: 'draft' | 'created' | 'error';
  last_sync_at?: string;
  sync_error?: string;
  usage_count: number;
  last_used_at?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

// 报表视图列表项（用于列表显示）
export interface ReportViewListItem {
  id: number;
  name: string;
  description?: string;
  category?: string;
  view_status: string;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  view_name?: string;
}

// 创建报表视图的表单数据
export interface ReportViewCreateForm {
  name: string;
  description?: string;
  view_name: string;
  sql_query: string;
  schema_name: string;
  is_active: boolean;
  is_public: boolean;
  category?: string;
  report_title?: string;
  description_lines?: string[];
}

// 更新报表视图的表单数据
export interface ReportViewUpdateForm {
  name?: string;
  description?: string;
  sql_query?: string;
  is_active?: boolean;
  is_public?: boolean;
  category?: string;
  report_title?: string;
  description_lines?: string[];
}

// 报表视图查询请求
export interface ReportViewQueryRequest {
  filters?: Record<string, any>;
  sorting?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  page: number;
  page_size: number;
}

// 报表视图查询响应
export interface ReportViewQueryResponse {
  columns: Array<{
    key: string;
    title: string;
    dataIndex: string;
    dataType?: string;
  }>;
  data: Record<string, any>[];
  total: number;
  page: number;
  page_size: number;
  execution_time?: number;
}

// SQL验证请求
export interface SqlValidationRequest {
  sql_query: string;
  schema_name: string;
}

// SQL验证响应
export interface SqlValidationResponse {
  is_valid: boolean;
  error_message?: string;
  columns?: Array<{
    name: string;
    type: string;
  }>;
  estimated_rows?: number;
}

// 视图同步请求
export interface ViewSyncRequest {
  force_recreate: boolean;
}

// 报表视图执行记录
export interface ReportViewExecution {
  id: number;
  report_view_id: number;
  execution_params?: Record<string, any>;
  result_count?: number;
  execution_time?: number;
  status: string;
  error_message?: string;
  export_format?: string;
  file_path?: string;
  file_size?: number;
  executed_by?: number;
  executed_at: string;
}

// 表格列配置
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  sorter?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

// 筛选器配置
export interface FilterConfig {
  field: string;
  label: string;
  type: 'input' | 'select' | 'date' | 'dateRange' | 'number';
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
}

// 导出配置
export interface ExportConfig {
  format: 'excel' | 'csv' | 'pdf';
  filename?: string;
  includeFilters?: boolean;
}

// API响应基础类型
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// 分页参数
export interface PaginationParams {
  page: number;
  page_size: number;
  total?: number;
}

// 搜索和筛选参数
export interface SearchParams {
  keyword?: string;
  category?: string;
  is_active?: boolean;
  view_status?: string;
}

// 数据源接口
export interface DataSource {
  id: number;
  name: string;
  type: string; // e.g., 'PostgreSQL', 'MySQL', 'CSV'
  connection_string: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fields?: DataSourceField[]; // Associated fields
  schema_name?: string; // 数据库schema名称
  table_name?: string; // 表名
  view_name?: string; // 视图名
  field_count?: number; // 字段数量
  sync_status?: 'success' | 'failed' | 'pending'; // 同步状态
  last_sync_at?: string; // 最后同步时间
}

// 创建数据源的表单数据
export interface DataSourceCreate {
  name: string;
  type: string;
  connection_string: string;
  description?: string;
  is_active?: boolean;
}

// 更新数据源的表单数据
export interface DataSourceUpdate {
  name?: string;
  type?: string;
  connection_string?: string;
  description?: string;
  is_active?: boolean;
}

// 数据源字段接口
export interface DataSourceField {
  id: number;
  data_source_id: number;
  field_name: string;
  data_type: string; // e.g., 'text', 'integer', 'timestamp'
  description?: string;
  is_filterable: boolean;
  is_sortable: boolean;
  created_at: string;
  updated_at: string;
  is_primary_key?: boolean; // 是否是主键
  length?: number; // 字段长度 (如 VARCHAR(255) 中的 255)
  precision?: number; // 数值精度 (如 DECIMAL(10,2) 中的 10)
  scale?: number; // 小数位数 (如 DECIMAL(10,2) 中的 2)
  is_nullable?: boolean; // 是否可为空
  default_value?: string; // 默认值
  comment?: string; // 字段注释
}

// 数据源字段检测请求
export interface DataSourceFieldDetection {
  data_source_id?: number;
  connection_string?: string;
  sql_query?: string; // Optional: for detecting fields from a specific query
}

// 数据源连接测试请求
export interface DataSourceConnectionTest {
  type: string;
  connection_string: string;
}

// 数据源连接测试响应
export interface DataSourceConnectionTestResponse {
  success: boolean;
  message: string;
  detail?: string;
}

// 报表数据源统计信息
export interface ReportDataSourceStatistics {
  total_records: number;
  last_synced_at?: string;
  sync_status: 'success' | 'failed' | 'in_progress';
  error_message?: string;
}

// 报表数据源访问日志
export interface ReportDataSourceAccessLog {
  id: number;
  data_source_id: number;
  accessed_by?: number; // User ID who accessed
  accessed_at: string;
  action: string; // e.g., 'query', 'export', 'sync'
  details?: Record<string, any>;
  ip_address?: string;
} 