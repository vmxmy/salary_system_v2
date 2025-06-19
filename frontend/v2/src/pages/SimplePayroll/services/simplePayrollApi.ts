/**
 * 极简工资报表系统API服务
 */
import type {
  PayrollPeriod,
  PayrollRun,
  PayrollEntry,
  // BatchAdjustment, // 移除不存在的导入
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
  // 只在开发环境中记录响应
  if (import.meta.env.DEV) {
    try {
      const url = response?.config?.url || 'unknown';
      const method = response?.config?.method?.toUpperCase() || 'GET';
      const status = response?.status || 'unknown';
      const dataType = typeof response?.data;
      
      let dataInfo: any = {
        status,
        url,
        dataType,
        hasData: !!response?.data,
        dataCount: 'N/A',
        responseData: response?.data,
        responseHeaders: response?.headers
      };
      
      // 分析数据结构和数量
      if (response?.data) {
        if (Array.isArray(response.data.data)) {
          dataInfo.dataCount = response.data.data.length;
        } else if (typeof response.data.data === 'object' && response.data.data !== null) {
          dataInfo.dataType = 'object';
          if (Array.isArray(response.data.data.items)) {
            dataInfo.dataCount = response.data.data.items.length;
          }
        }
      }
      
      console.log('✅ [simplePayrollApi] 响应成功:', dataInfo);
    } catch (error) {
      console.error('记录响应时出错:', error);
    }
  }
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

  // ===================== 工资运行管理 =====================

  /**
   * 获取工资运行列表
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
   * 删除工资运行
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
   * 检查期间是否已有数据
   */
  checkExistingData: async (periodId: number): Promise<ApiResponse<any>> => {
    console.log('🔍 [simplePayrollApi.checkExistingData] 检查现有数据:', {
      url: `${API_BASE}/check-existing-data/${periodId}`,
      periodId: periodId
    });
    
    const response = await apiClient.get(`${API_BASE}/check-existing-data/${periodId}`);
    
    console.log('✅ [simplePayrollApi.checkExistingData] 检查完成:', {
      status: response.status,
      hasAnyData: response.data?.data?.has_any_data,
      summary: response.data?.data?.summary
    });
    
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
    force_overwrite?: boolean;
  }): Promise<ApiResponse<PayrollRun>> => {
    console.log('🚀 [simplePayrollApi.copyPreviousPayroll] 发起复制请求:', {
      url: `${API_BASE}/copy-previous`,
      params: params,
      forceOverwrite: params.force_overwrite
    });
    
    // 修改为查询参数格式（后端已更改为query参数）
    const response = await apiClient.post(`${API_BASE}/copy-previous`, null, {
      params: {
        target_period_id: params.target_period_id,
        source_period_id: params.source_period_id,
        description: params.description,
        force_overwrite: params.force_overwrite
      }
    });
    
    console.log('✅ [simplePayrollApi.copyPreviousPayroll] 复制成功:', {
      status: response.status,
      runId: response.data?.data?.id,
      periodName: response.data?.data?.period_name
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 批量调整工资数据
   */
  batchAdjustPayroll: async (params: {
    payroll_run_id: number;
    adjustments: any[]; // 临时使用any类型
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
      status_lookup_value_id: 134 // 134 = "活动" 状态（薪资周期）
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
   * 计算五险一金 - 🚀 包含五险一金完整计算
   */
  runIntegratedCalculationEngine: async (params: {
    payroll_run_id: number;
    calculation_period?: string; // YYYY-MM-DD 格式
    recalculate_all?: boolean;
    employee_ids?: number[];
    include_social_insurance?: boolean;
    async_mode?: boolean; // 🎯 异步模式控制
  }): Promise<ApiResponse<{
    total_processed: number;
    success_count: number;
    error_count: number;
    calculation_summary: {
      total_employees: number;
      successful_count: number;
      failed_count: number;
    };
    payroll_totals: {
      total_gross_pay: number;           // 应发合计
      total_deductions: number;          // 扣发合计（含个人五险一金）
      total_net_pay: number;            // 实发合计
      total_employer_cost: number;       // 单位总成本
    };
    social_insurance_breakdown: {
      employee_totals: {
        social_insurance: number;        // 个人社保合计
        housing_fund: number;           // 个人公积金合计
        total: number;                  // 个人五险一金合计
      };
      employer_totals: {
        social_insurance: number;        // 单位社保合计
        housing_fund: number;           // 单位公积金合计
        total: number;                  // 单位五险一金合计
      };
    };
    cost_analysis: {
      employee_take_home: number;        // 员工实得
      employee_social_cost: number;     // 员工社保成本
      employer_salary_cost: number;     // 单位工资成本
      employer_social_cost: number;     // 单位社保成本
      total_cost: number;               // 单位总成本
      social_cost_ratio: number;        // 社保成本比例
    };
    calculation_metadata: {
      calculation_date: string;
      engine_version: string;
      calculation_order: string;
    };
    payroll_run_updated: boolean;
    status_info?: {
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
    const response = await apiClient.post(`${API_BASE}/calculation-engine/integrated-run`, params, {
      timeout: 180000 // 3分钟超时，集成计算更复杂
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

  // ===================== 薪资配置管理功能 =====================

  /**
   * 🎯 复制工资配置（基本工资和专项扣除，不包括社保和公积金基数）
   */
  copySalaryConfigs: async (params: {
    source_period_id: number;
    target_period_id: number;
  }): Promise<ApiResponse<{
    success: boolean;
    copied_count: number;
    updated_count: number;
    skipped_count: number;
    total_processed: number;
    message: string;
  }>> => {
    console.log('🚀 [simplePayrollApi.copySalaryConfigs] 发起请求:', {
      url: `${API_BASE}/salary-configs/copy`,
      params: params
    });
    
    const response = await apiClient.post(`${API_BASE}/salary-configs/copy`, null, { 
      params: params 
    });
    
    console.log('✅ [simplePayrollApi.copySalaryConfigs] 请求成功:', {
      status: response.status,
      responseData: response.data
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 🎯 检查指定期间是否已有缴费基数配置
   */
  checkExistingInsuranceBase: async (periodId: number): Promise<ApiResponse<{
    target_period_id: number;
    target_period_name: string;
    period_date_range: {
      start_date: string;
      end_date: string;
    };
    has_insurance_base_data: boolean;
    base_configs: {
      has_base_data: boolean;
      total_configs: number;
      employees_with_social_base: number;
      employees_with_housing_base: number;
      unique_employees: number;
      configs_detail: Array<{
        employee_id: number;
        employee_name: string;
        social_insurance_base: number;
        housing_fund_base: number;
        effective_date: string | null;
        end_date: string | null;
      }>;
    };
    summary: {
      '检查类型': string;
      '总配置数': number;
      '有社保基数员工': number;
      '有公积金基数员工': number;
      '涉及员工总数': number;
    };
    recommendation: {
      can_copy: boolean;
      message: string;
    };
  }>> => {
    console.log('🔍 [simplePayrollApi.checkExistingInsuranceBase] 发起请求:', {
      url: `${API_BASE}/check-existing-insurance-base/${periodId}`,
      periodId: periodId
    });
    
    const response = await apiClient.get(`${API_BASE}/check-existing-insurance-base/${periodId}`);
    
    console.log('✅ [simplePayrollApi.checkExistingInsuranceBase] 请求成功:', {
      status: response.status,
      hasBaseData: response.data?.data?.has_insurance_base_data,
      canCopy: response.data?.data?.recommendation?.can_copy,
      uniqueEmployees: response.data?.data?.base_configs?.unique_employees
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 🎯 专门复制社保和公积金缴费基数（不复制基本工资和专项扣除）
   */
  copyInsuranceBaseAmounts: async (params: {
    source_period_id: number;
    target_period_id: number;
  }): Promise<ApiResponse<{
    success: boolean;
    copied_count: number;
    updated_count: number;
    skipped_count: number;
    total_processed: number;
    message: string;
  }>> => {
    console.log('🏦 [simplePayrollApi.copyInsuranceBaseAmounts] 发起请求:', {
      url: `${API_BASE}/salary-configs/copy-insurance-base`,
      params: params
    });
    
    const response = await apiClient.post(`${API_BASE}/salary-configs/copy-insurance-base`, null, { 
      params: params 
    });
    
    console.log('✅ [simplePayrollApi.copyInsuranceBaseAmounts] 请求成功:', {
      status: response.status,
      responseData: response.data,
      copied: response.data?.data?.copied_count,
      updated: response.data?.data?.updated_count,
      skipped: response.data?.data?.skipped_count
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 🗑️ 删除指定期间的所有缴费基数配置
   */
  deleteInsuranceBaseForPeriod: async (periodId: number): Promise<ApiResponse<{
    success: boolean;
    deleted_count: number;
    message: string;
  }>> => {
    console.log('🗑️ [simplePayrollApi.deleteInsuranceBaseForPeriod] 发起请求:', {
      url: `${API_BASE}/salary-configs/delete-insurance-base/${periodId}`,
      periodId: periodId
    });
    
    const response = await apiClient.delete(`${API_BASE}/salary-configs/delete-insurance-base/${periodId}`);
    
    console.log('✅ [simplePayrollApi.deleteInsuranceBaseForPeriod] 请求成功:', {
      status: response.status,
      responseData: response.data,
      deleted: response.data?.data?.deleted_count
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 📋 获取员工在指定期间的缴费基数
   */
  getEmployeeInsuranceBase: async (employeeId: number, periodId: number): Promise<ApiResponse<{
    employee_id: number;
    period_id: number;
    social_insurance_base: number;
    housing_fund_base: number;
    occupational_pension_base?: number;
    effective_date: string;
    end_date?: string;
  }>> => {
    console.log('📋 [simplePayrollApi.getEmployeeInsuranceBase] 发起请求:', {
      url: `${API_BASE}/salary-configs/employee/${employeeId}/period/${periodId}`,
      employeeId: employeeId,
      periodId: periodId
    });
    
    const response = await apiClient.get(`${API_BASE}/salary-configs/employee/${employeeId}/period/${periodId}`);
    
    console.log('✅ [simplePayrollApi.getEmployeeInsuranceBase] 请求成功:', {
      status: response.status,
      socialBase: response.data?.data?.social_insurance_base,
      housingBase: response.data?.data?.housing_fund_base
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 💾 更新员工在指定期间的缴费基数
   */
  updateEmployeeInsuranceBase: async (employeeId: number, periodId: number, params: {
    social_insurance_base: number;
    housing_fund_base: number;
    occupational_pension_base?: number;
  }): Promise<ApiResponse<{
    success: boolean;
    employee_id: number;
    period_id: number;
    social_insurance_base: number;
    housing_fund_base: number;
    occupational_pension_base?: number;
    message: string;
  }>> => {
    console.log('💾 [simplePayrollApi.updateEmployeeInsuranceBase] 发起请求:', {
      url: `${API_BASE}/salary-configs/employee/${employeeId}/period/${periodId}`,
      employeeId: employeeId,
      periodId: periodId,
      params: params
    });
    
    const response = await apiClient.put(`${API_BASE}/salary-configs/employee/${employeeId}/period/${periodId}`, params);
    
    console.log('✅ [simplePayrollApi.updateEmployeeInsuranceBase] 请求成功:', {
      status: response.status,
      responseData: response.data
    });
    
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
  },

  // ===================== 计算进度查询功能 =====================

  /**
   * 🎯 获取数据完整性统计
   */
  getDataIntegrityStats: async (periodId: number): Promise<ApiResponse<{
    period_id: number;
    period_name: string;
    period_date_range: {
      start_date: string;
      end_date: string;
    };
    data_integrity: {
      social_insurance_base_count: number;
      housing_fund_base_count: number;
      income_tax_positive_count: number;
    };
    summary: {
      '统计类型': string;
      '社保基数记录数': number;
      '公积金基数记录数': number;
      '个税大于0记录数': number;
    };
  }>> => {
    console.log('📊 [simplePayrollApi.getDataIntegrityStats] 发起请求:', {
      url: `${API_BASE}/data-integrity-stats/${periodId}`,
      periodId: periodId
    });
    
    const response = await apiClient.get(`${API_BASE}/data-integrity-stats/${periodId}`);
    
    console.log('✅ [simplePayrollApi.getDataIntegrityStats] 请求成功:', {
      status: response.status,
      socialInsuranceBaseCount: response.data?.data?.data_integrity?.social_insurance_base_count,
      housingFundBaseCount: response.data?.data?.data_integrity?.housing_fund_base_count,
      incomeTaxPositiveCount: response.data?.data?.data_integrity?.income_tax_positive_count
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 查询计算进度
   */
  getCalculationProgress: async (taskId: string): Promise<ApiResponse<{
    task_id: string;
    status: 'PREPARING' | 'CALCULATING' | 'COMPLETED' | 'FAILED' | 'NOT_FOUND';
    total: number;
    processed: number;
    current_employee?: {
      id: number;
      name: string;
      department: string;
      position: string;
    };
    stage: string;
    start_time: string;
    estimated_remaining_time?: number;
    last_updated: string;
    success_count?: number;
    error_count?: number;
    payroll_totals?: {
      total_gross_pay: number;
      total_deductions: number;
      total_net_pay: number;
    };
    social_insurance_breakdown?: {
      total_social_insurance: number;
      total_housing_fund: number;
    };
    cost_analysis?: {
      total_cost: number;
      average_cost_per_employee: number;
    };
    errors?: Array<{
      employee_id: number;
      employee_name: string;
      error_message: string;
    }>;
    duration?: number;
    end_time?: string;
  }>> => {
    console.log('🔍 [simplePayrollApi.getCalculationProgress] 查询进度:', {
      url: `${API_BASE}/calculation-engine/progress/${taskId}`,
      taskId: taskId
    });
    
    const response = await apiClient.get(`${API_BASE}/calculation-engine/progress/${taskId}`);
    
    console.log('✅ [simplePayrollApi.getCalculationProgress] 查询成功:', {
      status: response.status,
      progressStatus: response.data?.data?.status,
      processed: response.data?.data?.processed,
      total: response.data?.data?.total,
      stage: response.data?.data?.stage
    });
    
    logResponse(response);
    return response.data;
  },

  // =============================================================================
  // 统计分析 API
  // =============================================================================

  /**
   * 获取部门成本分析
   */
  getDepartmentCostAnalysis: async (periodId: number): Promise<ApiResponse<{
    period_id: number;
    period_name: string;
    total_cost: number;
    total_employees: number;
    departments: Array<{
      department_id?: number;
      department_name: string;
      current_cost: number;
      previous_cost?: number;
      employee_count: number;
      avg_cost_per_employee: number;
      percentage: number;
      cost_change?: number;
      cost_change_rate?: number;
    }>;
  }>> => {
    console.log('🏢 [simplePayrollApi.getDepartmentCostAnalysis] 获取部门成本分析:', { periodId });
    
    const response = await apiClient.get(`${API_BASE}/analytics/department-costs/${periodId}`);
    
    console.log('✅ [simplePayrollApi.getDepartmentCostAnalysis] 获取成功:', {
      status: response.status,
      departmentCount: response.data?.data?.departments?.length,
      totalCost: response.data?.data?.total_cost
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 获取员工编制分析
   */
  getEmployeeTypeAnalysis: async (periodId: number): Promise<ApiResponse<{
    period_id: number;
    period_name: string;
    total_employees: number;
    total_cost: number;
    employee_types: Array<{
      personnel_category_id: number;
      type_name: string;
      employee_count: number;
      percentage: number;
      avg_salary: number;
      total_cost: number;
      previous_count?: number;
      count_change?: number;
      new_hires?: number;
      departures?: number;
    }>;
  }>> => {
    console.log('👥 [simplePayrollApi.getEmployeeTypeAnalysis] 获取员工编制分析:', { periodId });
    
    const response = await apiClient.get(`${API_BASE}/analytics/employee-types/${periodId}`);
    
    console.log('✅ [simplePayrollApi.getEmployeeTypeAnalysis] 获取成功:', {
      status: response.status,
      typeCount: response.data?.data?.employee_types?.length,
      totalEmployees: response.data?.data?.total_employees
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 获取工资趋势分析
   */
  getSalaryTrendAnalysis: async (months: number = 12): Promise<ApiResponse<{
    time_range: string;
    data_points: Array<{
      period_id: number;
      period_name: string;
      year_month: string;
      employee_count: number;
      gross_salary: number;
      deductions: number;
      net_salary: number;
      avg_gross_salary: number;
      avg_net_salary: number;
    }>;
    trend_summary: {
      period_count: number;
      start_period: string;
      end_period: string;
      gross_salary_trend: {
        start_value: number;
        end_value: number;
        change: number;
        change_rate: number;
      };
      net_salary_trend: {
        start_value: number;
        end_value: number;
        change: number;
        change_rate: number;
      };
      employee_count_trend: {
        start_value: number;
        end_value: number;
        change: number;
        change_rate: number;
      };
    };
  }>> => {
    console.log('📈 [simplePayrollApi.getSalaryTrendAnalysis] 获取工资趋势分析:', { months });
    
    const response = await apiClient.get(`${API_BASE}/analytics/salary-trends`, {
      params: { months }
    });
    
    console.log('✅ [simplePayrollApi.getSalaryTrendAnalysis] 获取成功:', {
      status: response.status,
      dataPointCount: response.data?.data?.data_points?.length,
      timeRange: response.data?.data?.time_range
    });
    
    logResponse(response);
    return response.data;
  },

  /**
   * 获取月度薪资状态概览
   */
  getMonthlySummary: async (start_year: number, end_year: number): Promise<ApiResponse<any>> => {
    console.log('🚀 [simplePayrollApi.getMonthlySummary] 发起请求:', { start_year, end_year });
    const response = await apiClient.get(`${API_BASE}/monthly-summary`, {
      params: { start_year, end_year }
    });
    logResponse(response);
    return response.data;
  },
}; 