/**
 * 极简工资报表系统API服务
 */
import type {
  PayrollPeriod,
  PayrollRun,
  PayrollEntry,
  BatchAdjustment,
  AuditAnomaly,
  AuditSummary,
  ReportDefinition,
  ReportGenerationRequest,
  PayrollGenerationRequest,
  GenerationProgress,
  ExportStatus,
  ApiResponse,
  PaginatedResponse
} from '../types/simplePayroll';

// 使用主 API 客户端而不是创建新的实例
import apiClient from '../../../api/apiClient';

const API_BASE = '/simple-payroll';

// 响应拦截器 - 统一错误处理（仅用于调试日志）
const logResponse = (response: any) => {
  console.log('✅ [simplePayrollApi] 响应成功:', {
    status: response.status,
    url: response.config.url,
    dataType: typeof response.data,
    hasData: !!response.data?.data,
    dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
    responseData: response.data,
    responseHeaders: response.headers
  });
  return response;
};

const logError = (error: any) => {
  console.error('❌ [simplePayrollApi] 响应错误:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    data: error.response?.data,
    message: error.message
  });
  return Promise.reject(error);
};

export const simplePayrollApi = {
  // ===================== 工资期间管理 =====================
  
  /**
   * 获取工资期间列表
   */
  getPayrollPeriods: async (params: {
    year?: number;
    month?: number;
    is_active?: boolean;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<PayrollPeriod>> => {
    console.log('🚀 [simplePayrollApi.getPayrollPeriods] 发起请求:', {
      url: `${API_BASE}/periods`,
      params: params
    });
    
    const response = await apiClient.get(`${API_BASE}/periods`, { params });
    
    console.log('✅ [simplePayrollApi.getPayrollPeriods] 请求成功:', {
      status: response.status,
      totalCount: response.data?.meta?.total,
      periodsCount: response.data?.data?.length,
      periods: response.data?.data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status_name,
        runs_count: p.runs_count
      }))
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 获取指定期间详情
   */
  getPayrollPeriod: async (periodId: number): Promise<ApiResponse<PayrollPeriod>> => {
    const response = await apiClient.get(`${API_BASE}/periods/${periodId}`);
    logResponse(response);
    return response.data;
  },

  // ===================== 工资版本管理 =====================

  /**
   * 获取工资版本列表
   */
  getPayrollVersions: async (params: {
    period_id: number;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<PayrollRun>> => {
    const response = await apiClient.get(`${API_BASE}/versions`, { params });
    logResponse(response);
    return response.data;
  },

  /**
   * 获取指定版本详情
   */
  getPayrollVersion: async (versionId: number): Promise<ApiResponse<PayrollRun>> => {
    const response = await apiClient.get(`${API_BASE}/versions/${versionId}`);
    logResponse(response);
    return response.data;
  },

  /**
   * 删除工资版本
   */
  deletePayrollRun: async (versionId: number): Promise<void> => {
    const response = await apiClient.delete(`/payroll-runs/${versionId}`);
    logResponse(response);
  },

  // ===================== 工资生成功能 =====================

  /**
   * 生成工资数据
   */
  generatePayroll: async (request: PayrollGenerationRequest): Promise<ApiResponse<PayrollRun>> => {
    console.log('🚀 [simplePayrollApi.generatePayroll] 发起请求:', {
      url: `${API_BASE}/generate`,
      request: request,
      generationType: request.generation_type,
      periodId: request.period_id,
      sourceData: request.source_data,
      description: request.description
    });
    
    const response = await apiClient.post(`${API_BASE}/generate`, request);
    
    console.log('✅ [simplePayrollApi.generatePayroll] 请求成功:', {
      status: response.status,
      responseData: response.data,
      generatedRunId: response.data?.data?.id,
      generatedRunPeriod: response.data?.data?.period_name
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 获取工资生成进度
   */
  getGenerationProgress: async (taskId: string): Promise<ApiResponse<GenerationProgress>> => {
    const response = await apiClient.get(`${API_BASE}/generate/progress/${taskId}`);
    logResponse(response);
    return response.data;
  },

  /**
   * 复制上月工资数据
   */
  copyPreviousPayroll: async (params: {
    target_period_id: number;
    source_period_id: number;
    description?: string;
  }): Promise<ApiResponse<PayrollRun>> => {
    const response = await apiClient.post(`${API_BASE}/copy-previous`, params);
    logResponse(response);
    return response.data;
  },

  /**
   * 批量调整工资数据
   */
  batchAdjustPayroll: async (params: {
    payroll_run_id: number;
    adjustments: BatchAdjustment[];
  }): Promise<ApiResponse<{ affected_count: number; updated_entries: PayrollEntry[] }>> => {
    const response = await apiClient.post(`${API_BASE}/batch-adjust`, params);
    logResponse(response);
    return response.data;
  },

  /**
   * 获取工资条目列表
   */
  getPayrollEntries: async (params: {
    payroll_run_id?: number;
    period_id?: number;
    department_ids?: number[];
    personnel_category_ids?: number[];
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<PayrollEntry>> => {
    const response = await apiClient.get(`${API_BASE}/entries`, { params });
    logResponse(response);
    return response.data;
  },

  // ===================== 工资审核功能 =====================

  /**
   * 获取审核汇总信息
   */
  getAuditSummary: async (payrollRunId: number): Promise<ApiResponse<AuditSummary>> => {
    const response = await apiClient.get(`${API_BASE}/audit/summary/${payrollRunId}`);
    logResponse(response);
    return response.data;
  },

  /**
   * 获取审核异常列表
   */
  getAuditAnomalies: async (params: {
    payroll_run_id: number;
    anomaly_types?: string[];
    severity?: string[];
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<AuditAnomaly>> => {
    const { payroll_run_id, ...queryParams } = params;
    const response = await apiClient.get(`${API_BASE}/audit/${payroll_run_id}/anomalies`, { 
      params: queryParams 
    });
    logResponse(response);
    return response.data;
  },

  /**
   * 执行审核检查
   */
  runAuditCheck: async (payrollRunId: number): Promise<ApiResponse<AuditSummary>> => {
    const response = await apiClient.post(`${API_BASE}/audit/check/${payrollRunId}`);
    logResponse(response);
    return response.data;
  },

  /**
   * 自动修复异常
   */
  autoFixAnomalies: async (params: {
    payroll_run_id: number;
    anomaly_ids: string[];
  }): Promise<ApiResponse<{ fixed_count: number; failed_count: number }>> => {
    const response = await apiClient.post(`${API_BASE}/audit/auto-fix`, params);
    logResponse(response);
    return response.data;
  },

  /**
   * 忽略异常
   */
  ignoreAnomalies: async (params: {
    anomaly_ids: string[];
    reason: string;
  }): Promise<ApiResponse<{ ignored_count: number }>> => {
    const response = await apiClient.post(`${API_BASE}/audit/ignore`, params);
    logResponse(response);
    return response.data;
  },

  /**
   * 更新审核状态
   */
  updateAuditStatus: async (params: {
    payroll_run_id: number;
    status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
    comment?: string;
  }): Promise<ApiResponse<PayrollRun>> => {
    const response = await apiClient.post(`${API_BASE}/audit/update-status`, params);
    logResponse(response);
    return response.data;
  },

  // ===================== 报表生成功能 =====================

  /**
   * 获取可用报表列表
   */
  getAvailableReports: async (): Promise<ApiResponse<ReportDefinition[]>> => {
    const response = await apiClient.get(`${API_BASE}/reports/available`);
    logResponse(response);
    return response.data;
  },

  /**
   * 生成报表
   */
  generateReports: async (request: ReportGenerationRequest): Promise<ApiResponse<{ task_id: string }>> => {
    const response = await apiClient.post(`${API_BASE}/reports/generate`, request);
    logResponse(response);
    return response.data;
  },

  /**
   * 获取报表生成状态
   */
  getReportStatus: async (taskId: string): Promise<ApiResponse<ExportStatus>> => {
    const response = await apiClient.get(`${API_BASE}/reports/status/${taskId}`);
    logResponse(response);
    return response.data;
  },

  /**
   * 下载报表文件
   */
  downloadReport: async (taskId: string): Promise<Blob> => {
    const response = await apiClient.get(`${API_BASE}/reports/download/${taskId}`, {
      responseType: 'blob'
    });
    logResponse(response);
    return response.data;
  },

  // ===================== 通用功能 =====================

  /**
   * 获取部门列表 - 🚀 使用优化接口
   */
  getDepartments: async (): Promise<ApiResponse<Array<{id: number; name: string; code: string}>>> => {
    try {
      // 🚀 优先使用高性能优化接口
      const response = await apiClient.get(`/views-optimized/departments`);
      logResponse(response);
      return response.data;
    } catch (error) {
      console.warn('⚠️ 优化部门接口失败，降级到原接口:', error);
      // 降级到原接口
      const response = await apiClient.get(`${API_BASE}/departments`);
      logResponse(response);
      return response.data;
    }
  },

  /**
   * 创建工资期间
   */
  createPayrollPeriod: async (params: {
    name: string;
    start_date: string;
    end_date: string;
    pay_date: string;
    frequency_lookup_value_id?: number;
  }): Promise<ApiResponse<PayrollPeriod>> => {
    // 准备创建工资期间的请求数据，确保包含必需字段
    const createData = {
      name: params.name,
      start_date: params.start_date,
      end_date: params.end_date,
      pay_date: params.pay_date,
      frequency_lookup_value_id: params.frequency_lookup_value_id || 117, // 117 = 月度频率
      status_lookup_value_id: 115 // 115 = "活动" 状态
    };

    console.log('🚀 [simplePayrollApi.createPayrollPeriod] 发起请求:', {
      url: '/payroll-periods',
      params: params,
      createData: createData
    });
    
    const response = await apiClient.post('/payroll-periods', createData);
    
    console.log('✅ [simplePayrollApi.createPayrollPeriod] 请求成功:', {
      status: response.status,
      responseData: response.data,
      createdPeriodId: response.data?.data?.id,
      createdPeriodName: response.data?.data?.name
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 创建工资运行
   */
  createPayrollRun: async (params: {
    payroll_period_id: number;
    description?: string;
  }): Promise<ApiResponse<PayrollRun>> => {
    // 准备创建工资运行的请求数据，包含必需的status_lookup_value_id
    const createData = {
      payroll_period_id: params.payroll_period_id,
      status_lookup_value_id: 60, // 60 = "待计算" 状态
      initiated_by_user_id: null, // 可选字段
      total_employees: null, // 可选字段
      total_net_pay: null // 可选字段
    };

    console.log('🚀 [simplePayrollApi.createPayrollRun] 发起请求:', {
      url: '/payroll-runs',
      params: params,
      createData: createData
    });
    
    const response = await apiClient.post('/payroll-runs', createData);
    
    console.log('✅ [simplePayrollApi.createPayrollRun] 请求成功:', {
      status: response.status,
      responseData: response.data,
      createdRunId: response.data?.data?.id,
      createdRunPeriod: response.data?.data?.period_name
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 获取人员类别列表 - 🚀 使用优化接口
   */
  getPersonnelCategories: async (): Promise<ApiResponse<Array<{id: number; name: string; code: string}>>> => {
    try {
      // 🚀 优先使用高性能优化接口
      const response = await apiClient.get(`/views-optimized/personnel-categories`);
      logResponse(response);
      return response.data;
    } catch (error) {
      console.warn('⚠️ 优化人员类别接口失败，降级到原接口:', error);
      // 降级到原接口
      const response = await apiClient.get(`${API_BASE}/personnel-categories`);
      logResponse(response);
      return response.data;
    }
  },

  /**
   * 获取薪资组件定义列表
   */
  getPayrollComponents: async (params?: {
    type?: 'EARNING' | 'DEDUCTION';
    is_active?: boolean;
  }): Promise<ApiResponse<Array<{id: number; code: string; name: string; type: string}>>> => {
    const response = await apiClient.get(`${API_BASE}/components`, { params });
    logResponse(response);
    return response.data;
  },

  // ===================== 批量调整功能 =====================

  /**
   * 预览批量调整结果
   */
  previewBatchAdjustment: async (params: {
    payroll_run_id: number;
    employee_codes: string[];
    adjustment_rules: Array<{
      component: string;
      operation: 'add' | 'subtract' | 'multiply' | 'set';
      value: number;
      description?: string;
    }>;
  }): Promise<ApiResponse<{
    affected_entries: Array<{
      employee_code: string;
      employee_name: string;
      component_code: string;
      component_name: string;
      old_value: number;
      new_value: number;
      difference: number;
    }>;
  }>> => {
    const response = await apiClient.post(`${API_BASE}/batch-adjustment/preview`, params);
    logResponse(response);
    return response.data;
  },

  /**
   * 执行批量调整
   */
  executeBatchAdjustment: async (params: {
    payroll_run_id: number;
    employee_codes: string[];
    adjustment_rules: Array<{
      component: string;
      operation: 'add' | 'subtract' | 'multiply' | 'set';
      value: number;
      description?: string;
    }>;
    description?: string;
  }): Promise<ApiResponse<{
    affected_count: number;
    task_id?: string;
  }>> => {
    const response = await apiClient.post(`${API_BASE}/batch-adjustment/execute`, params);
    logResponse(response);
    return response.data;
  },

  // ===================== 高级审核功能 =====================

  /**
   * 执行高级审核检查
   */
  runAdvancedAuditCheck: async (payrollRunId: number): Promise<ApiResponse<{
    basic_audit: any;
    advanced_checks: Array<{
      type: string;
      name: string;
      results: any;
    }>;
  }>> => {
    const response = await apiClient.post(`${API_BASE}/audit/advanced-check/${payrollRunId}`);
    logResponse(response);
    return response.data;
  },

  // ===================== 计算引擎功能 =====================

  /**
   * 运行简化版计算引擎
   */
  runSimpleCalculationEngine: async (params: {
    payroll_run_id: number;
    recalculate_all?: boolean;
    employee_ids?: number[];
  }): Promise<ApiResponse<{
    total_processed: number;
    success_count: number;
    error_count: number;
    calculation_summary: {
      total_gross_pay: number;
      total_deductions: number;
      total_net_pay: number;
    };
    payroll_run_updated: boolean;
    status_info: {
      previous_status: string;
      previous_status_code: string;
      new_status: string;
      new_status_code: string;
    };
    warning?: string;
    errors?: Array<{
      employee_id: number;
      employee_name: string;
      error_message: string;
    }>;
  }>> => {
    const response = await apiClient.post(`${API_BASE}/calculation-engine/run`, params, {
      timeout: 120000 // 2分钟超时
    });
    logResponse(response);
    return response.data;
  },

  /**
   * 测试计算引擎
   */
  testCalculationEngine: async (params: {
    employee_id?: number;
    payroll_run_id?: number;
    import_data?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`${API_BASE}/test-calculation`, params);
    logResponse(response);
    return response.data;
  },

  // ===================== 银行文件生成功能 =====================

  /**
   * 生成银行代发文件
   */
  generateBankFile: async (params: {
    payroll_run_id: number;
    bank_type?: 'ICBC' | 'CCB' | 'ABC' | 'BOC' | 'CMB' | 'GENERIC';
    file_format?: 'txt' | 'csv' | 'excel';
    include_summary?: boolean;
  }): Promise<ApiResponse<{
    file_name: string;
    file_content: string;
    file_format: string;
    bank_type: string;
    total_records: number;
    total_amount: number;
    summary: {
      payroll_run_id: number;
      period_name: string;
      generated_at: string;
      generated_by: string;
      records_count: number;
      total_amount: string;
    };
  }>> => {
    const response = await apiClient.post(`${API_BASE}/bank-file/generate`, params);
    logResponse(response);
    return response.data;
  },

  /**
   * 下载银行文件
   */
  downloadBankFile: async (params: {
    payroll_run_id: number;
    bank_type?: string;
    file_format?: string;
  }): Promise<Blob> => {
    const response = await apiClient.post(`${API_BASE}/bank-file/generate`, params, {
      responseType: 'blob'
    });
    logResponse(response);
    return response.data;
  }
}; 