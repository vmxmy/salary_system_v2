import apiClient from './apiClient';
import type {
  ReportTypeDefinition,
  ReportTypeDefinitionCreate,
  ReportTypeDefinitionUpdate,
  ReportConfigPreset,
  ReportConfigPresetCreate,
  ReportConfigPresetUpdate,
  ReportFieldDefinition,
  ReportFieldDefinitionCreate,
  ReportFieldDefinitionUpdate,
  DataSource,
  DataSourceField,
} from '../types/reportConfig';

// Re-export types for convenience
export type { DataSource, DataSourceField } from '../types/reportConfig';

// Define and export interfaces for better type safety across the app

// 报表类型定义相关API
export const reportConfigApi = {
  // ==================== 报表类型定义 ====================
  
  /**
   * 获取报表类型定义列表
   */
  getReportTypes: async (params: { search?: string }): Promise<ReportTypeDefinition[]> => {
    const response = await apiClient.get('/report-config/types', { params });
    return response.data;
  },

  /**
   * 获取报表类型定义详情
   */
  getReportType: async (id: number): Promise<ReportTypeDefinition> => {
    const response = await apiClient.get(`/report-config/types/${id}`);
    return response.data;
  },

  /**
   * 创建报表类型定义
   */
  createReportType: async (data: ReportTypeDefinitionCreate): Promise<ReportTypeDefinition> => {
    const response = await apiClient.post('/report-config/types', data);
    return response.data;
  },

  /**
   * 更新报表类型定义
   */
  updateReportType: async (id: number, data: ReportTypeDefinitionUpdate): Promise<ReportTypeDefinition> => {
    const response = await apiClient.put(`/report-config/types/${id}`, data);
    return response.data;
  },

  /**
   * 删除报表类型定义
   */
  deleteReportType: async (id: number): Promise<void> => {
    await apiClient.delete(`/report-config/types/${id}`);
  },

  // ==================== 报表字段定义 ====================

  /**
   * 获取报表字段定义列表
   */
  getReportFields: async (typeId: number, params?: {
    skip?: number;
    limit?: number;
    is_visible?: boolean;
    field_type?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<ReportFieldDefinition[]> => {
    const response = await apiClient.get(`/report-config/types/${typeId}/fields`, { params });
    return response.data;
  },

  /**
   * 创建报表字段定义
   */
  createReportField: async (typeId: number, data: ReportFieldDefinitionCreate): Promise<ReportFieldDefinition> => {
    const response = await apiClient.post(`/report-config/types/${typeId}/fields`, data);
    return response.data;
  },

  /**
   * 更新报表字段定义
   */
  updateReportField: async (fieldId: number, data: ReportFieldDefinitionUpdate): Promise<ReportFieldDefinition> => {
    const response = await apiClient.put(`/report-config/fields/${fieldId}`, data);
    return response.data;
  },

  /**
   * 删除报表字段定义
   */
  deleteReportField: async (fieldId: number): Promise<void> => {
    await apiClient.delete(`/report-config/fields/${fieldId}`);
  },

  /**
   * 获取报表类型数据预览
   */
  getReportTypePreview: async (typeId: number, params?: {
    skip?: number;
    limit?: number;
    [key: string]: any;
  }): Promise<{ items: any[]; total: number; fields: ReportFieldDefinition[] }> => {
    const response = await apiClient.get(`/report-config/types/${typeId}/preview`, { params });
    return response.data;
  },

  /**
   * 获取报表类型可用字段列表（基于报表类型配置的data_source_id和fields）
   */
  getReportTypeAvailableFields: async (typeId: number): Promise<{
    report_type_id: number;
    report_type_name: string;
    data_source_id: number;
    configured_fields: string;
    total_available_fields: number;
    total_selected_fields: number;
    fields: DataSourceField[];
  }> => {
    const response = await apiClient.get(`/report-config/types/${typeId}/available-fields`);
    return response.data;
  },

  // ==================== 数据源管理 ====================

  /**
   * 动态扫描数据源（扫描数据库中的视图和表）
   */
  scanDynamicDataSources: async (params?: {
    schema_name?: string;
    view_pattern?: string;
  }): Promise<any[]> => {
    const response = await apiClient.get('/report-config/data-sources/dynamic-scan', { params });
    return response.data;
  },

  /**
   * 获取数据源列表（包含动态扫描）
   */
  getDataSources: async (params?: {
    is_active?: boolean;
    schema_name?: string;
    search?: string;
    include_dynamic?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<DataSource[]> => {
    // 🚀 性能优化：默认关闭动态扫描以提升加载速度
    const optimizedParams = {
      include_dynamic: false, // 默认关闭动态扫描
      ...params
    };
    
    const response = await apiClient.get('/report-config/data-sources', { params: optimizedParams });
    return response.data;
  },

  /**
   * 获取数据源详情
   */
  getDataSource: async (id: number): Promise<DataSource> => {
    const response = await apiClient.get(`/report-config/data-sources/${id}`);
    return response.data;
  },

  /**
   * 获取数据源字段列表
   */
  getDataSourceFields: async (dataSourceId: number): Promise<DataSourceField[]> => {
    const response = await apiClient.get(`/report-config/data-sources/${dataSourceId}/fields`);
    return response.data;
  },

  getDataSourcePreview: async (dataSourceId: number, params: { skip?: number; limit?: number; [key: string]: any }): Promise<{ items: any[]; total: number }> => {
    const response = await apiClient.get(`/report-config/data-sources/${dataSourceId}/preview`, { params });
    return response.data;
  },

  /**
   * 创建数据源
   */
  createDataSource: async (data: any): Promise<DataSource> => {
    const response = await apiClient.post('/report-config/data-sources', data);
    return response.data;
  },

  /**
   * 更新数据源
   */
  updateDataSource: async (id: number, data: any): Promise<DataSource> => {
    const response = await apiClient.put(`/report-config/data-sources/${id}`, data);
    return response.data;
  },

  /**
   * 删除数据源
   */
  deleteDataSource: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/report-config/data-sources/${id}`);
    return response.data;
  },

  /**
   * 同步数据源字段
   */
  syncDataSourceFields: async (dataSourceId: number): Promise<DataSourceField[]> => {
    const response = await apiClient.post(`/report-config/data-sources/${dataSourceId}/sync-fields`);
    return response.data;
  },

  // ==================== 报表配置预设 ====================

  /**
   * 获取报表配置预设列表
   */
  getReportPresets: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    is_active?: boolean;
    is_public?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<ReportConfigPreset[]> => {
    const response = await apiClient.get('/report-config/presets', { params });
    return response.data;
  },

  /**
   * 获取报表配置预设详情
   */
  getReportPreset: async (id: number): Promise<ReportConfigPreset> => {
    const response = await apiClient.get(`/report-config/presets/${id}`);
    return response.data;
  },

  /**
   * 创建报表配置预设
   */
  createReportPreset: async (data: ReportConfigPresetCreate): Promise<ReportConfigPreset> => {
    const response = await apiClient.post('/report-config/presets', data);
    return response.data;
  },

  /**
   * 更新报表配置预设
   */
  updateReportPreset: async (id: number, data: ReportConfigPresetUpdate): Promise<ReportConfigPreset> => {
    const response = await apiClient.put(`/report-config/presets/${id}`, data);
    return response.data;
  },

  /**
   * 删除报表配置预设
   */
  deleteReportPreset: async (id: number): Promise<void> => {
    await apiClient.delete(`/report-config/presets/${id}`);
  },

  // ==================== 批量报表集成 ====================

  /**
   * 获取可用于批量报表的报表类型
   */
  getBatchReportTypes: async (): Promise<{
    report_types: Array<{
      code: string;
      name: string;
      description?: string;
      category?: string;
      default_config?: any;
      required_permissions?: string[];
      allowed_roles?: string[];
    }>;
    total_count: number;
  }> => {
    const response = await apiClient.get('/report-config/batch-report-types');
    return response.data;
  },

  /**
   * 获取可用于批量报表的配置预设
   */
  getBatchReportPresets: async (): Promise<{
    presets: Array<{
      id: number;
      name: string;
      description?: string;
      category?: string;
      report_types: string[];
      default_config?: any;
      filter_config?: any;
      export_config?: any;
    }>;
    total_count: number;
  }> => {
    const response = await apiClient.get('/report-config/batch-report-presets');
    return response.data;
  },

  /**
   * 更新报表类型使用统计
   */
  updateReportTypeUsage: async (definitionId: number): Promise<void> => {
    await apiClient.post(`/report-config/usage/type/${definitionId}`);
  },

  /**
   * 更新配置预设使用统计
   */
  updatePresetUsage: async (presetId: number): Promise<void> => {
    await apiClient.post(`/report-config/usage/preset/${presetId}`);
  },
}; 