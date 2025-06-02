import apiClient from '../../../api/apiClient';
import type {
  CalculationRequest,
  CalculationResult,
  CalculationTaskStatus,
  CalculationSummary,
  ApiResponse
} from '../types/calculationConfig';

const BASE_URL = '/payroll/calculation';

export const payrollCalculationApi = {
  // 触发薪资计算
  triggerCalculation: (data: CalculationRequest): Promise<ApiResponse<{ task_id?: string; results?: CalculationResult[] }>> => {
    return apiClient.post(`${BASE_URL}/trigger`, data);
  },

  // 预览薪资计算
  previewCalculation: (data: CalculationRequest): Promise<ApiResponse<CalculationResult[]>> => {
    return apiClient.post(`${BASE_URL}/preview`, { ...data, is_preview: true });
  },

  // 查询计算任务状态
  getCalculationStatus: (taskId: string): Promise<ApiResponse<CalculationTaskStatus>> => {
    return apiClient.get(`${BASE_URL}/status/${taskId}`);
  },

  // 获取计算汇总
  getCalculationSummary: (payrollRunId: number): Promise<ApiResponse<CalculationSummary>> => {
    return apiClient.get(`${BASE_URL}/summary/${payrollRunId}`);
  },

  // 获取员工薪资计算详情
  getEmployeeCalculationDetail: (payrollRunId: number, employeeId: number): Promise<ApiResponse<CalculationResult>> => {
    return apiClient.get(`${BASE_URL}/detail/${payrollRunId}/${employeeId}`);
  },

  // 重新计算指定员工薪资
  recalculateEmployee: (payrollRunId: number, employeeId: number, ruleSetId?: number): Promise<ApiResponse<CalculationResult>> => {
    return apiClient.post(`${BASE_URL}/recalculate`, {
      payroll_run_id: payrollRunId,
      employee_id: employeeId,
      rule_set_id: ruleSetId
    });
  },

  // 批量重新计算
  batchRecalculate: (payrollRunId: number, employeeIds: number[], ruleSetId?: number): Promise<ApiResponse<{ task_id: string }>> => {
    return apiClient.post(`${BASE_URL}/batch-recalculate`, {
      payroll_run_id: payrollRunId,
      employee_ids: employeeIds,
      rule_set_id: ruleSetId
    });
  },

  // 确认计算结果
  confirmCalculation: (payrollRunId: number): Promise<ApiResponse<void>> => {
    return apiClient.post(`${BASE_URL}/confirm/${payrollRunId}`);
  },

  // 取消计算
  cancelCalculation: (taskId: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`${BASE_URL}/cancel/${taskId}`);
  }
}; 