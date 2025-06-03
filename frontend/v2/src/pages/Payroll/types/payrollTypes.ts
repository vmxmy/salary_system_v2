// payrollTypes.ts

// Generic type for API list responses metadata
export interface ApiListMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// Corresponds to the PayrollPeriod Pydantic model/database table
export interface PayrollPeriod {
  id: number;
  name: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  pay_date: string; // ISO date string
  frequency_lookup_value_id: number;
  status_lookup_value_id?: number; // 关联到lookup表的状态ID
  status_lookup?: LookupValue; // 状态的lookup值详情
  employee_count?: number; // 该期间的不重复员工数统计
  created_at?: string;
  updated_at?: string;
}

// Corresponds to the PayrollRun Pydantic model/database table
export interface PayrollRun {
  id: number;
  payroll_period_id: number;
  run_date: string; // ISO date string
  status_lookup_value_id: number;
  status?: LookupValue; // Optional: if status details are fetched/included
  employee_ids?: number[]; // List of employee IDs included in this run
  notes?: string;
  created_by_user_id?: number;
  paid_at?: string | null; // ISO date string or null
  created_at?: string;
  updated_at?: string;
  payroll_period?: PayrollPeriod; // Optional: if period details are fetched/included
  total_employees?: number; // Total number of employees in this run
  total_net_pay?: number; // 新增：薪资总额
}

// Payload for POST /v2/payroll-runs
export interface CreatePayrollRunPayload {
  payroll_period_id: number;
  run_date: string; // ISO date string, e.g., "YYYY-MM-DD"
  status_lookup_value_id: number;
  employee_ids?: number[]; // Optional: List of employee IDs
  notes?: string; // Optional
}

// Payload for PUT /v2/payroll-runs/{run_id}
export interface UpdatePayrollRunPayload {
  payroll_period_id?: number;
  run_date?: string; // ISO date string, e.g., "YYYY-MM-DD"
  status_lookup_value_id?: number;
  employee_ids?: number[]; // Optional: List of employee IDs
  notes?: string; // Optional
  paid_at?: string | null; // Optional: ISO date string or null, for marking as paid
}

// For PATCH /v2/payroll-runs/{runId} (e.g., mark as paid)
export interface PayrollRunPatch {
  status_lookup_value_id?: number;
  paid_at?: string | null;
  notes?: string;
  // Add other patchable fields as needed
}

// Structure for earnings_details and deductions_details (JSONB fields)
// This is a flexible example; adjust based on actual data structure
export interface PayrollItemDetail {
  name: string;        // e.g., "Basic Salary", "Overtime Pay", "Income Tax", "Social Security"
  amount: number;
  currency?: string;    // e.g., "CNY"
  description?: string; // Optional description for the item
  // Add other common fields if any, like type, category, etc.
}

// Import Employee type from HRManagement module
import type { Employee } from '../../HRManagement/types';

// Corresponds to the PayrollEntry Pydantic model/database table
export interface PayrollEntry {
  id: number;
  payroll_run_id: number;
  payroll_period_id: number;
  employee_id: number;
  employee?: Employee; // Embed the full Employee object
  employee_name?: string; // 员工姓名，用于表格显示
  employee_first_name?: string; // 新增：员工名
  employee_last_name?: string; // 新增：员工姓
  gross_pay: number; // 应发工资 - 数据库实际字段
  total_deductions: number;
  net_pay: number;
  total_earnings?: number; // 总收入，通常等于gross_pay，用于显示
  status_lookup_value_id: number;
  status?: LookupValue; // Optional: if status details are fetched/included
  remarks?: string;
  earnings_details: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[];
  deductions_details: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[];
  created_at?: string;
  updated_at?: string;
  payroll_run?: PayrollRun; // Optional: if run details are fetched/included
}

// For PATCH /v2/payroll-entries/{entryId} (e.g., manual adjustments)
export interface PayrollEntryPatch {
  employee_id?: number;
  payroll_period_id?: number;
  payroll_run_id?: number;
  status_lookup_value_id?: number;
  remarks?: string;
  gross_pay?: number;
  total_deductions?: number;
  net_pay?: number;
  earnings_details?: Record<string, { amount: number, name?: string }>;
  deductions_details?: Record<string, { amount: number, name?: string }>;
  // Add other patchable fields as needed
}

// Generic LookupValue type, assuming it's used for statuses etc.
// This might already exist in a global types file, if so, import it.
export interface LookupValue {
  id: number;
  lookup_type_id?: number;
  lookup_type_code?: string;
  code: string;            // 例如：'ACTIVE', 'CLOSED'
  name: string;            // 显示名称，例如：t('payroll:auto_text_e6b4bb'), t('payroll:auto_text_e5b7b2')
  display_name?: string;   // 显示名称，兼容性属性
  description?: string;    // 描述
  sort_order?: number;     // 排序顺序
  is_active?: boolean;     // 是否活动
}

// Example for API responses that return a single item
export interface ApiSingleResponse<T> {
  data: T;
}

// Example for API responses that return a list of items
export interface ApiListResponse<T> {
  data: T[];
  meta: ApiListMeta;
} 

// Corresponds to the PayrollComponentDefinition Pydantic model/database table
export interface PayrollComponentDefinition {
  id: number;
  code: string; // Unique code for the component, e.g., "BASIC_SALARY", "HOUSING_ALLOWANCE"
  name: string; // Display name, e.g., "Basic Salary", "Housing Allowance"
  type: 'Earning' | 'Deduction' | 'EARNING' | 'DEDUCTION' | 'PERSONAL_DEDUCTION' | 'EMPLOYER_DEDUCTION' | 'BENEFIT' | 'STATUTORY' | 'STAT' | 'OTHER'; // Component type
  data_type?: 'numeric' | 'percentage' | 'boolean' | 'string'; // Data type of the component's value
  is_fixed?: boolean; // Is the value fixed system-wide or employee-specific/variable?
  is_employee_specific?: boolean; // Does this component apply to specific employees only?
  is_active: boolean; // Is this component currently active/enabled? (replaces deprecated status field)
  is_taxable?: boolean; // 是否计税
  is_social_security_base?: boolean; // 是否为社保基数项
  is_housing_fund_base?: boolean; // 是否为公积金基数项
  sort_order?: number; // For ordering in UI if needed
  description?: string; // Optional detailed description
  calculation_logic?: string; // Optional: if there's specific logic tied to it (e.g., formula placeholder)
  created_at?: string;
  updated_at?: string;
} 

// Raw payroll entry data for bulk import
export interface RawPayrollEntryData {
  _clientId?: string; // 唯一客户端ID，用于表格行的key
  originalIndex?: number; // 原始数据中的索引
  employee_id?: number | null;
  employee_code?: string | null;
  employee_name?: string; // 将用于显示的员工姓名
  employee_full_name?: string; // 原始导入的员工全名
  last_name?: string; // 拆分后的姓
  first_name?: string; // 拆分后的名
  id_number?: string;
  department_name?: string; 
  position_name?: string;
  gross_pay: number; // 应发工资
  total_deductions: number; // 扣发合计
  net_pay: number; // 实发工资
  earnings_details: Record<string, { amount: number; name?: string }>; // 收入明细
  deductions_details: Record<string, { amount: number; name?: string }>; // 扣除明细
  status_lookup_value_id?: number | null;
  status_lookup_value_name?: string;
  remarks?: string;
  payroll_period_id?: number;
  payroll_run_id?: number;
  total_earnings?: number; // 用于表格显示的总收入，通常等于gross_pay
  employee_info?: { // 用于后端匹配员工
    last_name: string;
    first_name: string;
    id_number: string;
  };
  personnel_type?: 'REGULAR' | 'HIRED' | 'UNKNOWN'; // 新增：标准化的人员类型
  raw_personnel_identity?: string; // 新增：原始的人员身份文本，用于processPayrollRecord
  __isHiredPersonnel?: boolean; // 前端处理使用：标记是否为聘用人员
}

// Interface for validated payroll entry data
export interface ValidatedPayrollEntryData extends RawPayrollEntryData {
  validationErrors?: string[]; // 添加可选的验证错误数组
  __isValid: boolean; // 前端处理使用：标记记录是否有效
  __errors: string[]; // 验证错误信息
  __rowId: string; // 唯一行ID
  __isNew: boolean; // 是否为新记录
}

// Payload for creating payroll entries
export interface CreatePayrollEntryPayload {
  employee_id?: number; // 改为可选，用于批量导入时的自动匹配
  payroll_period_id: number; // 添加必需的payroll_period_id字段
  payroll_run_id: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status_lookup_value_id: number;
  remarks?: string;
  earnings_details: Record<string, { amount: number, name?: string }>;
  deductions_details?: Record<string, { amount: number, name?: string }>;
  // 可选的员工匹配信息，用于批量导入时根据姓名+身份证匹配员工
  employee_info?: {
    last_name: string;
    first_name: string;
    id_number: string;
  };
}

// Payload for bulk creating payroll entries
export interface BulkCreatePayrollEntriesPayload {
  payroll_period_id: number;
  entries: CreatePayrollEntryPayload[];
  overwrite_mode?: boolean;
}

// Result for bulk creating payroll entries
export interface BulkCreatePayrollEntriesResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    index: number;
    employee_id?: number;
    error: string;
  }>;
  created_entries: PayrollEntry[];
} 