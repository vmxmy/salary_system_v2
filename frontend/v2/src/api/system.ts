/**
 * 系统管理相关API接口
 * 
 * 对应后端 V2 系统管理、调试工具和工具类接口
 */

import apiClient from './apiClient';

// 基础响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

// ==================== 系统信息类型定义 ====================

export interface SystemInfo {
  app_name: string;
  version: string;
  api_version: string;
  environment: string;
  uptime: string;
  startup_time: string;
  message: string;
}

export interface DatabaseStatus {
  status: string;
  connection_pool_size?: number;
  active_connections?: number;
  response_time_ms?: number;
}

export interface SystemMetrics {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  request_count?: number;
  error_count?: number;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  database: DatabaseStatus;
  version: string;
  uptime: string;
  metrics?: SystemMetrics;
  details?: Record<string, any>;
}

export interface VersionInfo {
  app_version: string;
  api_version: string;
  database_version?: string;
  python_version: string;
  build_date?: string;
  git_commit?: string;
  dependencies?: Record<string, string>;
}

// ==================== 调试相关类型 ====================

export interface DebugFieldConfig {
  employee_type_key: string;
  field_db_name: string;
  is_required: boolean;
  source_name?: string;
  target_name?: string;
}

export interface DatabaseDiagnostic {
  connection_status: string;
  pool_info: Record<string, any>;
  query_performance?: Record<string, any>;
  slow_queries?: Array<Record<string, any>>;
  table_stats?: Record<string, any>;
}

export interface PerformanceMetrics {
  response_times: Record<string, number>;
  request_counts: Record<string, number>;
  error_rates: Record<string, number>;
  memory_usage?: Record<string, any>;
  cpu_usage?: number;
}

export interface PermissionTest {
  user_id?: number;
  username?: string;
  roles: string[];
  permissions: string[];
  test_results: Record<string, boolean>;
}

// ==================== 工具类相关类型 ====================

export interface TemplateInfo {
  name: string;
  description: string;
  file_type: string;
  download_url: string;
  size?: number;
  last_modified?: string;
}

export interface ExcelConversionResult {
  success: boolean;
  message: string;
  output_file?: string;
  download_url?: string;
  records_count?: number;
}

// ==================== 系统管理API ====================

/**
 * 获取系统基本信息（替代原 GET /）
 */
export const getSystemInfo = async (): Promise<ApiResponse<SystemInfo>> => {
  const response = await apiClient.get<ApiResponse<SystemInfo>>('/system/info');
  return response.data;
};

/**
 * 系统健康检查（替代原 GET /health）
 */
export const getHealthCheck = async (): Promise<ApiResponse<HealthCheck>> => {
  const response = await apiClient.get<ApiResponse<HealthCheck>>('/system/health');
  return response.data;
};

/**
 * 获取详细版本信息
 */
export const getVersionInfo = async (): Promise<ApiResponse<VersionInfo>> => {
  const response = await apiClient.get<ApiResponse<VersionInfo>>('/system/version');
  return response.data;
};

/**
 * 获取系统运行指标
 */
export const getSystemMetrics = async (): Promise<ApiResponse<Record<string, any>>> => {
  const response = await apiClient.get<ApiResponse<Record<string, any>>>('/system/metrics');
  return response.data;
};

/**
 * 获取系统状态概览
 */
export const getSystemStatus = async (): Promise<ApiResponse<Record<string, any>>> => {
  const response = await apiClient.get<ApiResponse<Record<string, any>>>('/system/status');
  return response.data;
};

// ==================== 调试工具API ====================

/**
 * 获取员工类型字段配置（替代原 GET /api/debug/field-config/{key}）
 */
export const getFieldConfig = async (employeeTypeKey: string): Promise<ApiResponse<DebugFieldConfig[]>> => {
  const response = await apiClient.get<ApiResponse<DebugFieldConfig[]>>(`/debug/field-config/${employeeTypeKey}`);
  return response.data;
};

/**
 * 数据库诊断信息
 */
export const getDatabaseDiagnostic = async (): Promise<ApiResponse<DatabaseDiagnostic>> => {
  const response = await apiClient.get<ApiResponse<DatabaseDiagnostic>>('/debug/database');
  return response.data;
};

/**
 * 获取性能分析数据
 */
export const getPerformanceMetrics = async (timeRange: string = '1h'): Promise<ApiResponse<PerformanceMetrics>> => {
  const response = await apiClient.get<ApiResponse<PerformanceMetrics>>('/debug/performance', {
    params: { time_range: timeRange }
  });
  return response.data;
};

/**
 * 权限测试工具
 */
export const testPermissions = async (userId?: number): Promise<ApiResponse<PermissionTest>> => {
  const response = await apiClient.get<ApiResponse<PermissionTest>>('/debug/permissions', {
    params: userId ? { user_id: userId } : {}
  });
  return response.data;
};

/**
 * 获取环境变量和配置信息
 */
export const getEnvironmentInfo = async (): Promise<ApiResponse<Record<string, any>>> => {
  const response = await apiClient.get<ApiResponse<Record<string, any>>>('/debug/environment');
  return response.data;
};

/**
 * 获取最近的系统日志
 */
export const getRecentLogs = async (level: string = 'ERROR', lines: number = 50): Promise<ApiResponse<any[]>> => {
  const response = await apiClient.get<ApiResponse<any[]>>('/debug/logs', {
    params: { level, lines }
  });
  return response.data;
};

/**
 * 清理系统缓存
 */
export const clearCache = async (cacheType: string = 'all'): Promise<ApiResponse<Record<string, any>>> => {
  const response = await apiClient.post<ApiResponse<Record<string, any>>>('/debug/cache/clear', null, {
    params: { cache_type: cacheType }
  });
  return response.data;
};

// ==================== 工具类API ====================

/**
 * 获取Excel转换器页面（替代原 GET /converter）
 * 注意：这个接口返回HTML，不是JSON
 */
export const getConverterPage = async (): Promise<string> => {
  const response = await apiClient.get<string>('/utilities/converter', {
    headers: { 'Accept': 'text/html' }
  });
  return response.data;
};

/**
 * Excel文件转CSV格式
 */
export const convertExcelToCsv = async (
  file: File, 
  options: {
    sheet_name?: string;
    include_headers?: boolean;
  } = {}
): Promise<ApiResponse<ExcelConversionResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const params = new URLSearchParams();
  if (options.sheet_name) params.append('sheet_name', options.sheet_name);
  if (options.include_headers !== undefined) params.append('include_headers', String(options.include_headers));
  
  const response = await apiClient.post<ApiResponse<ExcelConversionResult>>(
    `/utilities/excel-to-csv?${params.toString()}`, 
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data;
};

/**
 * 获取可用模板列表
 */
export const getTemplates = async (category?: string): Promise<ApiResponse<TemplateInfo[]>> => {
  const response = await apiClient.get<ApiResponse<TemplateInfo[]>>('/utilities/templates', {
    params: category ? { category } : {}
  });
  return response.data;
};

/**
 * 下载文件
 */
export const downloadFile = async (filename: string): Promise<Blob> => {
  const response = await apiClient.get(`/utilities/download/${filename}`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * 数据导出工具
 */
export const exportData = async (
  exportType: string, 
  format: string = 'xlsx', 
  filters?: string
): Promise<ApiResponse<Record<string, any>>> => {
  const response = await apiClient.post<ApiResponse<Record<string, any>>>('/utilities/export', null, {
    params: { export_type: exportType, format, filters }
  });
  return response.data;
};

/**
 * 获取文件信息
 */
export const getFileInfo = async (filename: string): Promise<ApiResponse<Record<string, any>>> => {
  const response = await apiClient.get<ApiResponse<Record<string, any>>>(`/utilities/file-info/${filename}`);
  return response.data;
};

// ==================== 便捷方法 ====================

/**
 * 检查系统整体状态
 */
export const checkSystemOverallStatus = async () => {
  try {
    const [systemInfo, healthCheck] = await Promise.all([
      getSystemInfo(),
      getHealthCheck()
    ]);
    
    return {
      isHealthy: healthCheck.data.status === 'healthy',
      systemInfo: systemInfo.data,
      healthCheck: healthCheck.data
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error
    };
  }
};

/**
 * 获取完整的系统诊断信息（仅管理员）
 */
export const getFullSystemDiagnostic = async () => {
  try {
    const [systemInfo, healthCheck, versionInfo, performanceMetrics, dbDiagnostic] = await Promise.all([
      getSystemInfo(),
      getHealthCheck(),
      getVersionInfo(),
      getPerformanceMetrics(),
      getDatabaseDiagnostic()
    ]);
    
    return {
      systemInfo: systemInfo.data,
      healthCheck: healthCheck.data,
      versionInfo: versionInfo.data,
      performanceMetrics: performanceMetrics.data,
      dbDiagnostic: dbDiagnostic.data
    };
  } catch (error) {
    throw error;
  }
};

// ==================== 导出API对象 ====================

export const systemApi = {
  // 系统管理
  getSystemInfo,
  getHealthCheck,
  getVersionInfo,
  getSystemMetrics,
  getSystemStatus,
  
  // 调试工具
  getFieldConfig,
  getDatabaseDiagnostic,
  getPerformanceMetrics,
  testPermissions,
  getEnvironmentInfo,
  getRecentLogs,
  clearCache,
  
  // 工具类
  getConverterPage,
  convertExcelToCsv,
  getTemplates,
  downloadFile,
  exportData,
  getFileInfo,
  
  // 便捷方法
  checkSystemOverallStatus,
  getFullSystemDiagnostic
};

export default systemApi;