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
  status_lookup_value_id?: number; // Assuming status is a lookup
  status?: LookupValue; // Optional: if status details are fetched/included
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
  earnings_details: PayrollItemDetail[]; // JSONB field
  deductions_details: PayrollItemDetail[]; // JSONB field
  created_at?: string;
  updated_at?: string;
  payroll_run?: PayrollRun; // Optional: if run details are fetched/included
  // employee?: Employee; // Optional: if employee details are fetched/included
}

// For PATCH /v2/payroll-entries/{entryId} (e.g., manual adjustments)
export interface PayrollEntryPatch {
  status_lookup_value_id?: number;
  remarks?: string;
  earnings_details?: PayrollItemDetail[];
  deductions_details?: PayrollItemDetail[];
  // Add other patchable fields as needed
}

// Generic LookupValue type, assuming it's used for statuses etc.
// This might already exist in a global types file, if so, import it.
export interface LookupValue {
  id: number;
  lookup_type_code: string;
  value_code: string;
  display_name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
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