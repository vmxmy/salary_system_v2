/**
 * 报表视图API服务
 * @description 处理报表视图相关的所有API请求
 */

import apiClient from './apiClient';
import type {
  ReportView,
  ReportViewListItem,
  ReportViewCreateForm,
  ReportViewUpdateForm,
  ReportViewQueryRequest,
  ReportViewQueryResponse,
  SqlValidationRequest,
  SqlValidationResponse,
  ViewSyncRequest,
  ReportViewExecution,
  ApiResponse,
  PaginationParams,
  SearchParams,
  DataSource,
  DataSourceCreate,
  DataSourceUpdate,
  DataSourceField,
  DataSourceFieldDetection,
  DataSourceConnectionTest,
  DataSourceConnectionTestResponse,
  ReportDataSourceStatistics,
  ReportDataSourceAccessLog,
} from '../types/reportView';

const API_BASE = '/reports/views';
const API_BASE_DATASOURCES = '/reports/data-sources';

/**
 * 报表视图API类
 */
export class ReportViewAPI {
  /**
   * 获取报表视图列表
   */
  static async getReportViews(params: PaginationParams & SearchParams): Promise<ReportViewListItem[]> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('skip', String((params.page - 1) * params.page_size));
    if (params.page_size) queryParams.append('limit', String(params.page_size));
    if (params.category) queryParams.append('category', params.category);
    if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));

    const response = await apiClient.get(`${API_BASE}?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * 根据ID获取报表视图详情
   */
  static async getReportView(id: number): Promise<ReportView> {
    const response = await apiClient.get(`${API_BASE}/${id}`);
    return response.data;
  }

  /**
   * 创建新的报表视图
   */
  static async createReportView(data: ReportViewCreateForm): Promise<ReportView> {
    const response = await apiClient.post(API_BASE, data);
    return response.data;
  }

  /**
   * 更新报表视图
   */
  static async updateReportView(id: number, data: ReportViewUpdateForm): Promise<ReportView> {
    const response = await apiClient.put(`${API_BASE}/${id}`, data);
    return response.data;
  }

  /**
   * 删除报表视图
   */
  static async deleteReportView(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${API_BASE}/${id}`);
    return response.data;
  }

  /**
   * 同步报表视图到数据库
   */
  static async syncReportView(id: number, data: ViewSyncRequest): Promise<{ message: string }> {
    const response = await apiClient.post(`${API_BASE}/${id}/sync`, data);
    return response.data;
  }

  /**
   * 验证SQL查询语句
   */
  static async validateSql(data: SqlValidationRequest): Promise<SqlValidationResponse> {
    const response = await apiClient.post(`${API_BASE}/validate-sql`, data);
    return response.data;
  }

  /**
   * 查询报表视图数据
   */
  static async queryReportViewData(id: number, params: ReportViewQueryRequest): Promise<ReportViewQueryResponse> {
    const response = await apiClient.post(`${API_BASE}/${id}/query`, params);
    return response.data;
  }

  /**
   * 获取报表视图执行记录
   */
  static async getExecutions(id: number, params: PaginationParams): Promise<ReportViewExecution[]> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('skip', String((params.page - 1) * params.page_size));
    if (params.page_size) queryParams.append('limit', String(params.page_size));

    const response = await apiClient.get(`${API_BASE}/${id}/executions?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * 导出报表视图数据
   */
  static async exportReportViewData(
    id: number, 
    params: ReportViewQueryRequest, 
    format: 'excel' | 'csv' | 'pdf' = 'excel'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('export_format', format);

    const response = await apiClient.post(
      `${API_BASE}/${id}/export?${queryParams.toString()}`, 
      params,
      {
        responseType: 'blob',
      }
    );
    
    return response.data;
  }

  /**
   * 批量删除报表视图
   */
  static async batchDeleteReportViews(ids: number[]): Promise<{ message: string }> {
    const response = await apiClient.post(`${API_BASE}/batch-delete`, { ids });
    return response.data;
  }

  /**
   * 获取报表视图分类列表
   */
  static async getCategories(): Promise<string[]> {
    const response = await apiClient.get(`${API_BASE}/categories`);
    return response.data;
  }

  /**
   * 复制报表视图
   */
  static async duplicateReportView(id: number, newName: string): Promise<ReportView> {
    const response = await apiClient.post(`${API_BASE}/${id}/duplicate`, { name: newName });
    return response.data;
  }

  /**
   * 获取数据源列表
   */
  static async getDataSources(params: PaginationParams & SearchParams): Promise<DataSource[]> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('skip', String((params.page - 1) * params.page_size));
    if (params.page_size) queryParams.append('limit', String(params.page_size));
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));

    const response = await apiClient.get(`${API_BASE_DATASOURCES}?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * 根据ID获取数据源详情
   */
  static async getDataSource(id: number): Promise<DataSource> {
    const response = await apiClient.get(`${API_BASE_DATASOURCES}/${id}`);
    return response.data;
  }

  /**
   * 创建新的数据源
   */
  static async createDataSource(data: DataSourceCreate): Promise<DataSource> {
    const response = await apiClient.post(API_BASE_DATASOURCES, data);
    return response.data;
  }

  /**
   * 更新数据源
   */
  static async updateDataSource(id: number, data: DataSourceUpdate): Promise<DataSource> {
    const response = await apiClient.put(`${API_BASE_DATASOURCES}/${id}`, data);
    return response.data;
  }

  /**
   * 删除数据源
   */
  static async deleteDataSource(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`${API_BASE_DATASOURCES}/${id}`);
    return response.data;
  }

  /**
   * 测试数据源连接
   */
  static async testConnection(data: DataSourceConnectionTest): Promise<DataSourceConnectionTestResponse> {
    const response = await apiClient.post(`${API_BASE_DATASOURCES}/test-connection`, data);
    return response.data;
  }

  /**
   * 检测数据源字段
   */
  static async detectFields(data: DataSourceFieldDetection): Promise<DataSourceField[]> {
    const response = await apiClient.post(`${API_BASE_DATASOURCES}/detect-fields`, data);
    return response.data;
  }

  /**
   * 同步数据源字段
   */
  static async syncFields(id: number): Promise<{ message: string; synced_count: number; fields: DataSourceField[] }> {
    const response = await apiClient.post(`${API_BASE_DATASOURCES}/${id}/sync-fields`);
    return response.data;
  }

  /**
   * 获取数据源字段列表
   */
  static async getDataSourceFields(id: number): Promise<DataSourceField[]> {
    const response = await apiClient.get(`${API_BASE_DATASOURCES}/${id}/fields`);
    return response.data;
  }

  /**
   * 获取数据源统计信息
   */
  static async getDataSourceStatistics(id: number): Promise<ReportDataSourceStatistics> {
    const response = await apiClient.get(`${API_BASE_DATASOURCES}/${id}/statistics`);
    return response.data;
  }

  /**
   * 预览数据源数据
   */
  static async previewDataSourceData(
    id: number,
    limit: number = 10,
    filters?: string
  ): Promise<{ columns: any[]; data: any[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', String(limit));
    if (filters) queryParams.append('filters', filters);
    const response = await apiClient.get(`${API_BASE_DATASOURCES}/${id}/preview?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * 获取数据源访问日志
   */
  static async getDataSourceAccessLogs(
    id: number,
    params: PaginationParams
  ): Promise<ReportDataSourceAccessLog[]> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('skip', String((params.page - 1) * params.page_size));
    if (params.page_size) queryParams.append('limit', String(params.page_size));
    const response = await apiClient.get(`${API_BASE_DATASOURCES}/${id}/access-logs?${queryParams.toString()}`);
    return response.data;
  }
}

// 导出默认实例
export const reportViewAPI = ReportViewAPI; 