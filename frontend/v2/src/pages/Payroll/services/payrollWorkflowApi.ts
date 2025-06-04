import apiClient from '../../../api/apiClient';
import type {
  PayrollPeriod,
  PayrollRun,
  PayrollEntry,
  ApiListResponse,
  ApiSingleResponse,
  CreatePayrollRunPayload,
  PayrollComponentDefinition
} from '../types/payrollTypes';
import type {
  CalculationRequest,
  CalculationResult,
  CalculationTaskStatus,
  CalculationSummary,
  ApiResponse
} from '../types/calculationConfig';

// 工作流相关的API接口
export interface WorkflowStepData {
  stepKey: string;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: Record<string, any>;
  timestamp?: string;
}

export interface PayrollWorkflowStatus {
  payroll_run_id: number;
  current_step: string;
  steps: WorkflowStepData[];
  overall_status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DataInitializationResult {
  success: boolean;
  message: string;
  entries_created?: number;
  errors?: string[];
}

export interface PayrollCalculationProgress {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  current_employee?: string;
  total_employees: number;
  processed_employees: number;
  estimated_remaining_time?: number;
  error_message?: string;
}

export interface PayrollSummaryStats {
  total_employees: number;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  total_tax: number;
  average_gross_pay: number;
  average_net_pay: number;
  calculation_date: string;
}

export interface PayrollApprovalData {
  payroll_run_id: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  approval_comments?: string;
  final_amount: number;
  employee_count: number;
}

export interface PayrollDistributionStatus {
  payroll_run_id: number;
  bank_file_status: 'not_generated' | 'generated' | 'sent' | 'processed';
  payment_status: 'pending' | 'initiated' | 'completed' | 'failed';
  payslip_status: 'not_sent' | 'sending' | 'sent' | 'failed';
  archive_status: 'pending' | 'completed';
  actual_payment_date?: string;
  bank_batch_reference?: string;
}

/**
 * 工资计算工作流API服务
 */
export const payrollWorkflowApi = {
  // ===== 第一步：薪资数据审核 =====
  
  /**
   * 获取可用的薪资周期列表
   */
  getAvailablePayrollPeriods: async (): Promise<ApiListResponse<PayrollPeriod>> => {
    const response = await apiClient.get<ApiListResponse<PayrollPeriod>>('/payroll-periods', {
      params: {
        page: 1,
        size: 100,
        // 只获取活跃状态的周期
        status_lookup_value_id: 1 // 假设1是活跃状态
      }
    });
    return response.data;
  },

  /**
   * 检查指定薪资周期是否已有数据
   */
  checkPayrollPeriodData: async (periodId: number): Promise<{ hasData: boolean; entryCount: number }> => {
    try {
      const response = await apiClient.get<ApiListResponse<PayrollEntry>>('/payroll-entries', {
        params: {
          period_id: periodId,
          page: 1,
          size: 1
        }
      });
      return {
        hasData: response.data.data.length > 0,
        entryCount: response.data.meta?.total || 0
      };
    } catch (error) {
      console.error('检查薪资周期数据失败:', error);
      return { hasData: false, entryCount: 0 };
    }
  },

  /**
   * 复制上月薪资数据到当前周期
   */
  copyLastMonthData: async (targetPeriodId: number, sourcePeriodId?: number): Promise<DataInitializationResult> => {
    try {
      const response = await apiClient.post<DataInitializationResult>('/payroll-entries/copy-from-period', {
        target_period_id: targetPeriodId,
        source_period_id: sourcePeriodId // 如果不提供，后端自动选择上一个周期
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.detail?.message || '复制数据失败',
        errors: [error.message]
      };
    }
  },

  /**
   * 获取薪资组件定义（用于数据审核）
   */
  getPayrollComponents: async (): Promise<ApiListResponse<PayrollComponentDefinition>> => {
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>('/config/payroll-component-definitions', {
      params: {
        is_active: true,
        size: 100
      }
    });
    return response.data;
  },

  // ===== 第二步：工资自动计算 =====

  /**
   * 创建薪资运行批次
   */
  createPayrollRun: async (data: CreatePayrollRunPayload): Promise<ApiSingleResponse<PayrollRun>> => {
    const response = await apiClient.post<ApiSingleResponse<PayrollRun>>('/payroll-runs', data);
    return response.data;
  },

  /**
   * 触发薪资计算
   */
  triggerPayrollCalculation: async (payrollRunId: number, calculationConfig?: Record<string, any>): Promise<{ task_id: string }> => {
    const response = await apiClient.post<{ task_id: string }>('/payroll/calculation/trigger', {
      payroll_run_id: payrollRunId,
      calculation_config: calculationConfig || {}
    });
    return response.data;
  },

  /**
   * 查询计算进度
   */
  getCalculationProgress: async (taskId: string): Promise<PayrollCalculationProgress> => {
    const response = await apiClient.get<PayrollCalculationProgress>(`/payroll/calculation/status/${taskId}`);
    return response.data;
  },

  /**
   * 预览计算结果（不保存）
   */
  previewCalculation: async (payrollRunId: number): Promise<CalculationResult[]> => {
    const response = await apiClient.post<ApiResponse<CalculationResult[]>>('/payroll/calculation/preview', {
      payroll_run_id: payrollRunId,
      is_preview: true
    });
    return response.data.data || [];
  },

  // ===== 第三步：工资周期复核 =====

  /**
   * 获取计算结果汇总
   */
  getCalculationSummary: async (payrollRunId: number): Promise<PayrollSummaryStats> => {
    const response = await apiClient.get<ApiResponse<CalculationSummary>>(`/payroll/calculation/summary/${payrollRunId}`);
    const summary = response.data.data;
    
    return {
      total_employees: summary?.total_employees || 0,
      total_gross_pay: summary?.total_gross_salary || 0,
      total_deductions: summary?.total_social_insurance_employee + summary?.total_housing_fund_employee + summary?.total_tax || 0,
      total_net_pay: summary?.total_net_salary || 0,
      total_tax: summary?.total_tax || 0,
      average_gross_pay: summary?.total_employees ? (summary?.total_gross_salary || 0) / summary.total_employees : 0,
      average_net_pay: summary?.total_employees ? (summary?.total_net_salary || 0) / summary.total_employees : 0,
      calculation_date: summary?.calculation_date || new Date().toISOString()
    };
  },

  /**
   * 获取详细的薪资条目列表
   */
  getPayrollEntries: async (payrollRunId: number, params?: Record<string, any>): Promise<ApiListResponse<PayrollEntry>> => {
    const response = await apiClient.get<ApiListResponse<PayrollEntry>>('/payroll-entries', {
      params: {
        payroll_run_id: payrollRunId,
        include_employee_details: true,
        ...params
      }
    });
    return response.data;
  },

  /**
   * 导出薪资报表
   */
  exportPayrollReport: async (payrollRunId: number, reportType: 'detail' | 'summary' | 'bank'): Promise<Blob> => {
    const response = await apiClient.get(`/payroll-runs/${payrollRunId}/export/${reportType}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ===== 第四步：工资周期批准 =====

  /**
   * 提交复核结果
   */
  submitReviewResult: async (payrollRunId: number, reviewData: {
    review_comments: string;
    review_result: 'pass' | 'reject';
    reviewer_id?: number;
  }): Promise<ApiSingleResponse<PayrollRun>> => {
    const response = await apiClient.patch<ApiSingleResponse<PayrollRun>>(`/payroll-runs/${payrollRunId}`, {
      review_status: reviewData.review_result,
      review_comments: reviewData.review_comments,
      reviewed_by: reviewData.reviewer_id,
      reviewed_at: new Date().toISOString()
    });
    return response.data;
  },

  /**
   * 批准薪资发放
   */
  approvePayrollDistribution: async (payrollRunId: number, approvalData: {
    approval_comments?: string;
    approver_id?: number;
  }): Promise<PayrollApprovalData> => {
    const response = await apiClient.post<PayrollApprovalData>(`/payroll-runs/${payrollRunId}/approve`, {
      approval_comments: approvalData.approval_comments,
      approved_by: approvalData.approver_id,
      approved_at: new Date().toISOString()
    });
    return response.data;
  },

  // ===== 第五步：工资发放与归档 =====

  /**
   * 生成银行转账文件
   */
  generateBankFile: async (payrollRunId: number): Promise<{ file_url: string; file_name: string }> => {
    const response = await apiClient.post<{ file_url: string; file_name: string }>(`/payroll-runs/${payrollRunId}/generate-bank-file`);
    return response.data;
  },

  /**
   * 获取发放状态
   */
  getDistributionStatus: async (payrollRunId: number): Promise<PayrollDistributionStatus> => {
    const response = await apiClient.get<PayrollDistributionStatus>(`/payroll-runs/${payrollRunId}/distribution-status`);
    return response.data;
  },

  /**
   * 更新发放状态
   */
  updateDistributionStatus: async (payrollRunId: number, statusData: {
    actual_payment_date?: string;
    bank_batch_reference?: string;
    payment_status?: 'initiated' | 'completed' | 'failed';
    archive_completed?: boolean;
  }): Promise<PayrollDistributionStatus> => {
    const response = await apiClient.patch<PayrollDistributionStatus>(`/payroll-runs/${payrollRunId}/distribution-status`, statusData);
    return response.data;
  },

  /**
   * 标记为已支付
   */
  markAsPaid: async (payrollRunId: number, paidAt?: string): Promise<ApiSingleResponse<PayrollRun>> => {
    const response = await apiClient.patch<ApiSingleResponse<PayrollRun>>(`/payroll-runs/${payrollRunId}`, {
      paid_at: paidAt || new Date().toISOString(),
      status_lookup_value_id: 4 // 假设4是已支付状态
    });
    return response.data;
  },

  /**
   * 发送工资条
   */
  sendPayslips: async (payrollRunId: number, employeeIds?: number[]): Promise<{ sent_count: number; failed_count: number }> => {
    const response = await apiClient.post<{ sent_count: number; failed_count: number }>(`/payroll-runs/${payrollRunId}/send-payslips`, {
      employee_ids: employeeIds
    });
    return response.data;
  },

  // ===== 工作流状态管理 =====

  /**
   * 获取工作流状态
   */
  getWorkflowStatus: async (payrollRunId: number): Promise<PayrollWorkflowStatus> => {
    try {
      const response = await apiClient.get<PayrollWorkflowStatus>(`/payroll-runs/${payrollRunId}/workflow-status`);
      return response.data;
    } catch (error) {
      // 如果后端还没有这个接口，返回默认状态
      return {
        payroll_run_id: payrollRunId,
        current_step: 'salaryReview',
        steps: [
          { stepKey: 'salaryReview', stepName: '薪资数据审核', status: 'pending', data: {} },
          { stepKey: 'salaryCalculation', stepName: '工资自动计算', status: 'pending', data: {} },
          { stepKey: 'periodReview', stepName: '工资周期复核', status: 'pending', data: {} },
          { stepKey: 'periodApproval', stepName: '工资周期批准', status: 'pending', data: {} },
          { stepKey: 'payrollDistribution', stepName: '工资发放与归档', status: 'pending', data: {} }
        ],
        overall_status: 'not_started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },

  /**
   * 更新工作流步骤状态
   */
  updateWorkflowStep: async (payrollRunId: number, stepKey: string, stepData: Partial<WorkflowStepData>): Promise<PayrollWorkflowStatus> => {
    try {
      const response = await apiClient.patch<PayrollWorkflowStatus>(`/payroll-runs/${payrollRunId}/workflow-status`, {
        step_key: stepKey,
        step_data: stepData
      });
      return response.data;
    } catch (error) {
      // 如果后端还没有这个接口，返回模拟数据
      console.warn('工作流状态更新接口暂未实现，使用本地状态管理');
      throw error;
    }
  }
};

export default payrollWorkflowApi; 