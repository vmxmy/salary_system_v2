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
} from '../types/reportView';

const API_BASE = '/reports/views';

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
}

// 导出默认实例
export const reportViewAPI = ReportViewAPI; 