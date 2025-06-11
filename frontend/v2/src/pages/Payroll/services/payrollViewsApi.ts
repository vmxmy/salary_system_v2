import apiClient from '../../../api/apiClient';
import type { PayrollPeriod, PayrollRun, PayrollEntry, LookupValue, ApiListResponse } from '../types/payrollTypes';

// 视图API的基础端点
const PAYROLL_VIEWS_ENDPOINT = '/views';
const PAYROLL_V2_ENDPOINT = '/v2/payroll';

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

// 扩展的视图类型定义
export interface PayrollPeriodDetailView extends PayrollPeriod {
  // 扩展字段，包含更多统计信息
  total_runs?: number;
  total_entries?: number;
  total_gross_pay?: number;
  total_net_pay?: number;
  total_deductions?: number;
  average_gross_pay?: number;
  average_net_pay?: number;
  department_count?: number;
  employee_count?: number;
  status_name?: string;
  frequency_name?: string;
}

export interface PayrollRunDetailView extends PayrollRun {
  // 扩展字段，包含更多详细信息
  period_name?: string;
  period_start_date?: string;
  period_end_date?: string;
  period_pay_date?: string;
  status_name?: string;
  total_entries?: number;
  total_gross_pay?: number;
  total_net_pay?: number;
  total_deductions?: number;
  average_gross_pay?: number;
  average_net_pay?: number;
  department_breakdown?: Record<string, {
    employee_count: number;
    total_gross_pay: number;
    total_net_pay: number;
    total_deductions: number;
  }>;
}

export interface PayrollEntryDetailedView extends PayrollEntry {
  // 扩展字段，包含展开的JSONB字段和关联信息
  period_name?: string;
  period_start_date?: string;
  period_end_date?: string;
  period_pay_date?: string;
  run_date?: string;
  status_name?: string;
  department_name?: string;
  position_name?: string;
  personnel_category_name?: string;
  
  // 展开的收入明细字段
  basic_salary?: number;
  performance_salary?: number;
  position_salary?: number;
  grade_salary?: number;
  allowance?: number;
  subsidy?: number;
  basic_performance_salary?: number;
  traffic_allowance?: number;
  only_child_bonus?: number;
  township_allowance?: number;
  position_allowance?: number;
  overtime_pay?: number;
  bonus?: number;
  
  // 展开的扣除明细字段
  personal_income_tax?: number;
  social_insurance_personal?: number;
  housing_fund_personal?: number;
  social_insurance_total?: number;
  housing_fund_total?: number;
  union_fee?: number;
  other_deductions?: number;
}

export interface PayrollComponentBasicView {
  id: number;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  sort_order?: number;
  usage_count?: number; // 使用次数统计
  total_amount?: number; // 总金额统计
}

export interface PayrollComponentUsageView {
  component_id: number;
  component_code: string;
  component_name: string;
  component_type: string;
  usage_count: number;
  total_amount: number;
  average_amount: number;
  min_amount: number;
  max_amount: number;
  period_id?: number;
  period_name?: string;
}

export interface PayrollSummaryAnalysisView {
  department_name: string;
  employee_count: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  avg_gross_pay: number;
  avg_net_pay: number;
  avg_deductions: number;
  period_id?: number;
  period_name?: string;
}

/**
 * 员工薪资历史视图类型定义
 */
export interface EmployeeSalaryHistoryView {
  id: number;
  employee_id: number;
  employee_code?: string;
  employee_name: string;
  department_name?: string;
  position_name?: string;
  personnel_category_name?: string;
  period_id: number;
  period_name: string;
  payroll_run_id: number;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  
  // 收入明细字段
  basic_salary: number;
  performance_salary: number;
  position_salary: number;
  grade_salary: number;
  allowance: number;
  subsidy: number;
  traffic_allowance: number;
  township_allowance: number;
  position_allowance: number;
  civil_servant_allowance: number;
  back_pay: number;
  
  // 扣除明细字段
  personal_income_tax: number;
  pension_personal: number;
  medical_personal: number;
  unemployment_personal: number;
  housing_fund_personal: number;
  annuity_personal: number;
  
  // 汇总字段
  basic_wage_total: number;
  performance_total: number;
  allowance_total: number;
  social_insurance_total: number;
  
  // 排名和统计字段
  salary_rank_in_period?: number;
  salary_rank_in_department?: number;
  
  calculated_at: string;
  updated_at: string;
}

/**
 * 员工薪资趋势数据类型
 */
export interface EmployeeSalaryTrendData {
  period_name: string;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  basic_salary: number;
  performance_salary: number;
  calculated_at: string;
}

/**
 * 薪资统计数据类型
 */
export interface SalaryStatistics {
  total_entries: number;
  unique_employees: number;
  unique_periods: number;
  unique_departments: number;
  avg_gross_pay: number;
  min_gross_pay: number;
  max_gross_pay: number;
  total_gross_pay: number;
  avg_net_pay: number;
  total_net_pay: number;
  avg_deductions: number;
  total_deductions: number;
}

// API 函数定义
export const payrollViewsApi = {
  /**
   * 获取薪资周期详细视图
   */
  getPayrollPeriodsDetail: async (params?: {
    is_active?: boolean;
    year?: number;
    month?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollPeriodDetailView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollPeriodDetailView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/periods-detail`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll periods detail:', error);
      throw error;
    }
  },

  /**
   * 获取薪资运行详细视图
   */
  getPayrollRunsDetail: async (params?: {
    period_id?: number;
    status_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollRunDetailView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollRunDetailView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/runs-detail`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll runs detail:', error);
      throw error;
    }
  },

  /**
   * 获取薪资条目详细视图
   */
  getPayrollEntriesDetailed: async (params?: {
    period_id?: number;
    employee_id?: number;
    department_id?: number;
    run_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollEntryDetailedView[]> => {
    try {
      const response = await apiClient.get<PayrollEntryDetailedView[]>(
        `${PAYROLL_VIEWS_ENDPOINT}/payroll-entries`,
        { params }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching payroll entries detailed:', error);
      throw error;
    }
  },

  /**
   * 获取薪资组件基础视图
   */
  getPayrollComponentsBasic: async (params?: {
    type?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PayrollComponentBasicView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollComponentBasicView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/components-basic`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll components basic:', error);
      throw error;
    }
  },

  /**
   * 获取薪资组件使用情况视图
   */
  getPayrollComponentsUsage: async (params?: {
    period_id?: number;
    component_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<PayrollComponentUsageView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollComponentUsageView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/components-usage`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll components usage:', error);
      throw error;
    }
  },

  /**
   * 获取薪资汇总分析视图
   */
  getPayrollSummaryAnalysis: async (params?: {
    period_id?: number;
    department_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollSummaryAnalysisView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollSummaryAnalysisView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/summary-analysis`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll summary analysis:', error);
      throw error;
    }
  },

  /**
   * 获取员工薪资历史
   */
  getEmployeeSalaryHistory: async (params?: {
    employee_id?: number;
    period_id?: number;
    department_id?: number;
    start_date?: string;
    end_date?: string;
    min_gross_pay?: number;
    max_gross_pay?: number;
    page?: number;
    size?: number;
    order_by?: string;
  }): Promise<PaginatedResponse<EmployeeSalaryHistoryView>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<EmployeeSalaryHistoryView>>(
        `${PAYROLL_V2_ENDPOINT}/employee-salary-history`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching employee salary history:', error);
      throw error;
    }
  },

  /**
   * 获取员工薪资趋势
   */
  getEmployeeSalaryTrend: async (
    employeeId: number,
    limit: number = 12
  ): Promise<EmployeeSalaryTrendData[]> => {
    try {
      const response = await apiClient.get<{ data: EmployeeSalaryTrendData[] }>(
        `${PAYROLL_V2_ENDPOINT}/employee-salary-trend/${employeeId}`,
        { params: { limit } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching employee salary trend:', error);
      throw error;
    }
  },

  /**
   * 获取薪资统计数据
   */
  getSalaryStatistics: async (params?: {
    period_id?: number;
    department_id?: number;
  }): Promise<SalaryStatistics> => {
    try {
      const response = await apiClient.get<{ data: SalaryStatistics }>(
        `${PAYROLL_V2_ENDPOINT}/salary-statistics`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching salary statistics:', error);
      throw error;
    }
  },
};

// 默认导出
export default payrollViewsApi; 