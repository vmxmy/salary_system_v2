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

// Corresponds to the PayrollEntry Pydantic model/database table
export interface PayrollEntry {
  id: number;
  payroll_run_id: number;
  employee_id: number;
  employee_name?: string; // Denormalized for display, or fetch separately
  total_earnings: number;
  total_deductions: number;
  net_pay: number;
  status_lookup_value_id: number;
  status?: LookupValue; // Optional: if status details are fetched/included
  remarks?: string;
  earnings_details: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[];
  deductions_details: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[];
  created_at?: string;
  updated_at?: string;
  payroll_run?: PayrollRun; // Optional: if run details are fetched/included
  // employee?: Employee; // Optional: if employee details are fetched/included
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
  value_code: string;      // 例如：'ACTIVE', 'CLOSED'
  display_name: string;    // 显示名称，例如：'活动', '已关闭'
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
  is_enabled: boolean; // Is this component currently active/enabled? (replaces deprecated status field)
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
  _clientId?: string;
  employee_id: number;
  employee_name?: string;
  department_name?: string;
  position_name?: string;
  total_earnings: number;
  total_deductions: number;
  net_pay: number;
  status_lookup_value_id?: number;
  status_lookup_value_name?: string;
  remarks?: string;
  earnings_details: Record<string, { amount: number, name?: string }>;
  deductions_details?: Record<string, { amount: number, name?: string }>;
  validationErrors?: string[];
  originalIndex?: number;
}

// Interface for validated payroll entry data
export interface ValidatedPayrollEntryData extends RawPayrollEntryData {}

// Payload for creating payroll entries
export interface CreatePayrollEntryPayload {
  employee_id: number;
  payroll_run_id: number;
  total_earnings: number;
  total_deductions: number;
  net_pay: number;
  status_lookup_value_id: number;
  remarks?: string;
  earnings_details: Record<string, { amount: number, name?: string }>;
  deductions_details?: Record<string, { amount: number, name?: string }>;
}

// Payload for bulk creating payroll entries
export interface BulkCreatePayrollEntriesPayload {
  payroll_period_id: number;
  entries: CreatePayrollEntryPayload[];
  overwrite_mode?: boolean;
} 