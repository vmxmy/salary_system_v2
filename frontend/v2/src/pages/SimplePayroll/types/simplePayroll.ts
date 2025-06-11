/**
 * 极简工资报表系统类型定义
 */

// 工资期间响应类型
export interface PayrollPeriodResponse {
  id: number;
  name: string;
  description?: string;
  frequency_id: number;
  frequency_name: string;
  status_id: number;
  status_name: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  runs_count: number;
  entries_count: number;
  created_at: string;
  updated_at: string;
}

// 工资期间类型
export interface PayrollPeriod {
  id: number;
  name: string;
  description?: string;
  frequency_id: number;
  frequency_name: string;
  status_id: number;
  status_name: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  runs_count: number;
  entries_count: number;
  created_at: string;
  updated_at: string;
}

// 工资运行版本响应类型
export interface PayrollRunResponse {
  id: number;
  period_id: number;
  period_name: string;
  version_number: number;
  status_id: number;
  status_name: string;
  total_entries: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  initiated_by_user_id: number;
  initiated_by_username: string;
  initiated_at: string;
  calculated_at?: string;
  approved_at?: string;
  description?: string;
}

// 工资运行版本类型
export interface PayrollRun {
  id: number;
  period_id: number;
  period_name: string;
  version_number: number;
  status_id: number;
  status_name: string;
  total_entries: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  initiated_by_user_id: number;
  initiated_by_username: string;
  initiated_at: string;
  calculated_at?: string;
  approved_at?: string;
  description?: string;
}

// 工资条目类型
export interface PayrollEntry {
  id: number;
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department_name: string;
  position_name: string;
  personnel_category_name: string;
  payroll_run_id: number;
  period_id: number;
  period_name: string;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  earnings_details: Record<string, number>;
  deductions_details: Record<string, number>;
  calculated_at?: string;
  updated_at: string;
}

// 审核异常类型
export interface AuditAnomaly {
  id: string;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  anomaly_type: 'minimum_wage' | 'tax_calculation' | 'social_security' | 'salary_variance' | 'missing_data';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details: string;
  suggested_action?: string;
  current_value?: number;
  expected_value?: number;
  can_auto_fix: boolean;
  is_ignored: boolean;
  ignore_reason?: string;
}

// 审核结果汇总
export interface AuditSummary {
  total_entries: number;
  total_anomalies: number;
  error_count: number;
  warning_count: number;
  auto_fixable_count: number;
  manually_ignored_count: number;
  anomalies_by_type: Record<string, number>;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  comparison_with_previous?: {
    gross_pay_variance: number;
    net_pay_variance: number;
    entries_count_variance: number;
  };
}

// 报表定义类型
export interface ReportDefinition {
  id: number;
  name: string;
  description?: string;
  category: string;
  template_type: 'table' | 'summary' | 'detailed';
  output_formats: string[];
  is_active: boolean;
  required_permissions: string[];
}

// 报表生成请求类型
export interface ReportGenerationRequest {
  report_ids: number[];
  period_id: number;
  payroll_run_id?: number;
  output_format: 'excel' | 'pdf' | 'csv';
  include_details: boolean;
  filters?: {
    department_ids?: number[];
    employee_ids?: number[];
    personnel_category_ids?: number[];
  };
}

// 工资生成请求类型
export interface PayrollGenerationRequest {
  period_id: number;
  generation_type: 'import' | 'copy_previous' | 'manual';
  source_data?: {
    // Excel导入时的文件信息
    file_data?: any[];
    // 复制上月时的源期间ID
    source_period_id?: number;
    // 手动创建时的初始数据
    initial_entries?: Partial<PayrollEntry>[];
  };
  description?: string;
}

// API响应通用类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

// 工资生成步骤状态
export interface GenerationProgress {
  step: 'uploading' | 'validating' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  errors?: string[];
  warnings?: string[];
}



// 导出状态
export interface ExportStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  file_url?: string;
  error_message?: string;
  created_at: string;
} 