import apiClient from './apiClient';

export interface BatchReportGenerationRequest {
  task_name: string;
  description?: string;
  period_id: number;
  department_ids?: number[];
  employee_ids?: number[];
  report_types: string[];
  export_format?: string;
  include_archive?: boolean;
  auto_cleanup_hours?: number;
}

export interface BatchReportTask {
  id: number;
  task_name: string;
  description?: string;
  task_type: string;
  status: string;
  progress: number;
  total_reports: number;
  completed_reports: number;
  failed_reports: number;
  started_at?: string;
  completed_at?: string;
  execution_time?: number;
  output_directory?: string;
  archive_file_path?: string;
  archive_file_size?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface BatchReportTaskItem {
  id: number;
  task_id: number;
  report_type: string;
  report_name: string;
  report_config: Record<string, any>;
  status: string;
  execution_order: number;
  started_at?: string;
  completed_at?: string;
  result_count?: number;
  file_path?: string;
  file_size?: number;
  file_format?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface BatchReportProgressResponse {
  task_id: number;
  status: string;
  progress: number;
  total_reports: number;
  completed_reports: number;
  failed_reports: number;
  estimated_remaining_time?: number;
  current_item?: string;
}

export interface BatchReportDownloadResponse {
  download_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
  file_count: number;
}

export interface ReportType {
  code: string;
  name: string;
  description: string;
  category: string;
}

export interface ReportTypesResponse {
  report_types: ReportType[];
  total_count: number;
}

export const batchReportsApi = {
  // 创建批量报表任务
  createTask: async (request: BatchReportGenerationRequest) => {
    const response = await apiClient.post('/batch-reports/generate', request);
    return response.data;
  },

  // 获取批量报表任务列表
  getTasks: async (params?: {
    status?: string;
    task_type?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/batch-reports/tasks', { params });
    return response.data;
  },

  // 获取批量报表任务详情
  getTask: async (taskId: number): Promise<BatchReportTask> => {
    const response = await apiClient.get(`/batch-reports/tasks/${taskId}`);
    return response.data;
  },

  // 获取批量报表任务进度
  getTaskProgress: async (taskId: number): Promise<BatchReportProgressResponse> => {
    const response = await apiClient.get(`/batch-reports/tasks/${taskId}/progress`);
    return response.data;
  },

  // 获取批量报表任务项列表
  getTaskItems: async (taskId: number, status?: string): Promise<BatchReportTaskItem[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/batch-reports/tasks/${taskId}/items`, { params });
    return response.data;
  },

  // 获取批量报表下载信息
  getTaskDownloadInfo: async (taskId: number): Promise<BatchReportDownloadResponse> => {
    const response = await apiClient.get(`/batch-reports/tasks/${taskId}/download`);
    return response.data;
  },

  // 下载批量报表文件
  downloadTask: async (taskId: number) => {
    const response = await apiClient.get(`/batch-reports/tasks/${taskId}/download-file`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // 删除批量报表任务
  deleteTask: async (taskId: number) => {
    const response = await apiClient.delete(`/batch-reports/tasks/${taskId}`);
    return response.data;
  },

  // 清理过期文件
  cleanupExpiredFiles: async () => {
    const response = await apiClient.post('/batch-reports/cleanup-expired');
    return response.data;
  },

  // 获取报表文件列表
  getFiles: async (params?: {
    file_type?: string;
    source_type?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/batch-reports/files', { params });
    return response.data;
  },

  // 获取可用报表类型
  getReportTypes: async (): Promise<ReportTypesResponse> => {
    const response = await apiClient.get('/batch-reports/report-types');
    return response.data;
  },
}; 