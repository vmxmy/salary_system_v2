// HRManagement Module Types

import type { Dayjs } from 'dayjs';

// Define LookupItem here if Department extends it, or import if it's a shared type.
export interface LookupItem {
  value: string | number; // Allow value to be string or number, as IDs are often numbers
  label: string;
  code?: string; // Optional: for string codes like 'active' if value becomes numeric ID
  id?: number; // Adding id to be consistent with API which often returns id
  name?: string; // Adding name as it's often used interchangeably with label or as primary text
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum EmploymentStatus {
  ACTIVE = 'active', // 在职
  PROBATION = 'probation', // 试用期
  LEAVE = 'leave', // 休假
  TERMINATED = 'terminated', // 离职
  PENDING = 'pending', // 待入职
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACTOR = 'contractor', // Changed from CONTRACT
  INTERN = 'intern',
}

export enum ContractStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  PENDING = 'pending',
}

export enum ContractType { // Added ContractType enum
  FIXED_TERM = 'fixed_term',
  PERMANENT = 'permanent',
  PROJECT_BASED = 'project_based',
  OTHER = 'other',
}

export enum PayFrequency {
  MONTHLY = 'monthly',
  BI_WEEKLY = 'bi_weekly',
  WEEKLY = 'weekly',
}

export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  DIPLOMA = 'diploma',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  DOCTORATE = 'doctorate',
  OTHER = 'other',
}

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  UNPAID = 'unpaid',
  OTHER = 'other',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  OTHER = 'other',
}

export enum PoliticalStatus {
  NONE = 'none',
  PARTY_MEMBER = 'party_member', // e.g. CPC Member
  LEAGUE_MEMBER = 'league_member', // e.g. Youth League Member
  OTHER = 'other',
}

export interface Employee {
  id: number; // Changed to number, assuming DB ID is numeric
  first_name: string; // Made non-optional as it's usually required
  last_name: string; // Made non-optional
  
  employee_code: string; 

  avatar?: string; 
  department_id?: number | null; // Changed to snake_case, number, and nullable
  job_title_id?: number | null; // Changed from positionId, to snake_case, number, and nullable
  
  status_lookup_value_id?: number; 
  employment_type_lookup_value_id?: number;
  gender_lookup_value_id?: number; 
  
  id_number?: string; 
  dob?: string | Dayjs; 
  hire_date: string | Dayjs; // Made non-optional

  nationality?: string;
  education_level_lookup_value_id?: number;
  
  personalEmail?: string;
  workEmail?: string; 
  workPhone?: string;
  mobilePhone?: string; 
  addressDetail?: string; 

  probationEndDate?: string | Dayjs; 
  reports_to_employee_id?: number | null; // Changed to snake_case, number, and nullable
  workLocation?: string;

  departmentName?: string;
  // positionName?: string; // Should be jobTitleName or similar if JobTitle is used
  job_title_name?: string; // Added to match job_title_id

  marital_status_lookup_value_id?: number;
  ethnicity?: string; 
  political_status_lookup_value_id?: number;
  
  bankName?: string;
  bankAccountName?: string; 
  bankAccountNumber?: string; 

  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  contract_type_lookup_value_id?: number; 
  initialContractStartDate?: string | Dayjs; 
  initialContractEndDate?: string | Dayjs; 
  notes?: string;

  // Sub-module arrays as per API schema
  job_history_records?: JobHistoryItem[];
  contracts?: ContractItem[];
  compensation_records?: CompensationItem[];
  leave_balances?: LeaveBalanceItem[];

  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
}

export interface EmployeeQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  employee_code?: string;
  department_id?: string;
  status_lookup_value_id?: number;
  gender_lookup_value_id?: number;
  education_level_lookup_value_id?: number;
  employment_type_lookup_value_id?: number;
  hireDateStart?: string;
  hireDateEnd?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Department {
  id: number; // Assuming id is number based on typical DB primary keys
  code?: string;
  name: string;
  parent_department_id?: number | null;
  effective_date?: string | Dayjs | null;
  end_date?: string | Dayjs | null;
  is_active?: boolean;
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
  children?: Department[]; // If API returns nested children directly
  // value and label for Select components, can be derived or added if directly from API
  value?: number; // For select options, usually id
  label?: string; // For select options, usually name
}

export interface JobTitle { // Renamed from PositionItem
  id: number; // Assuming id is number
  code?: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
  // value and label for Select components
  value?: number; // For select options, usually id
  label?: string; // For select options, usually name
}

// From previous job history thoughts, refine as needed
export interface JobHistoryItem {
  id: number; // Changed to number
  employee_id: number; // Changed to snake_case and number
  effectiveDate: string | Dayjs; 
  department_id: number; 
  departmentName?: string; 
  job_title_id: number; 
  // positionName?: string; // Should be jobTitleName
  job_title_name?: string; // To match job_title_id
  employment_type_lookup_value_id?: number; 
  salary?: number; 
  remarks?: string;
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
}

// New Interfaces for Employee Detail Page Tabs

export interface ContractItem {
  id: number; // Changed to number
  employee_id: number; // Changed to snake_case and number
  contract_number: string; // Changed to snake_case
  contract_type_lookup_value_id: number; // Changed to match common pattern
  start_date: string | Dayjs; // Changed to snake_case
  end_date: string | Dayjs; // Changed to snake_case
  contract_status_lookup_value_id: number; // Changed to match common pattern
  // filePath?: string; 
  remarks?: string;
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
  // Remove enum types if backend expects lookup_value_id for contractType and status
  // contractType: ContractType; 
  // status: ContractStatus;
}

export interface CompensationItem {
  id: number; // Changed to number
  employee_id: number; // Changed to snake_case and number
  effective_date: string | Dayjs; // Changed to snake_case
  basic_salary: number; // Changed to snake_case
  allowances?: number; 
  total_salary?: number; // Calculated or stored, changed to snake_case
  pay_frequency_lookup_value_id: number; // Changed to match common pattern
  currency?: string; 
  change_reason?: string; // Changed to snake_case
  remarks?: string;
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
  // Remove enum type if backend expects lookup_value_id for payFrequency
  // payFrequency: PayFrequency;
}

export interface LeaveBalanceItem {
  id: number; // Changed to number
  employee_id: number; // Changed to snake_case and number
  leave_type_id: number; // Changed to snake_case and number (assuming FK to a leave_types table/lookup)
  leave_type_name?: string; // Changed to snake_case
  total_entitlement: number; 
  taken: number; 
  balance: number; 
  unit: 'days' | 'hours';
  validity_date?: string | Dayjs | null; // Changed to snake_case and nullable
  year?: number; 
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
}

// Paginated Base Response
export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta; // Changed to use PageMeta
  // Remove total, page, pageSize, totalPages if they are now in meta
}

// Specific Paginated Results
export interface EmployeePageResult extends PaginatedResponse<Employee> {}

export interface JobHistoryPageResult extends PaginatedResponse<JobHistoryItem> {}

export interface ContractPageResult extends PaginatedResponse<ContractItem> {}

export interface CompensationPageResult extends PaginatedResponse<CompensationItem> {}

export interface LeaveBalancePageResult extends PaginatedResponse<LeaveBalanceItem> {}

// Payloads for Create/Update operations

// For creating an employee, 'id' is typically generated by the backend.
// Other fields might be required or optional based on business logic.
export interface CreateEmployeePayload {
  employee_code: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  gender_lookup_value_id?: number | null;
  id_number: string;
  dob: string; // Expecting YYYY-MM-DD string format for API
  nationality?: string;
  education_level_lookup_value_id?: number | null;
  marital_status_lookup_value_id?: number | null;
  ethnicity?: string;
  political_status_lookup_value_id?: number | null;
  personalEmail?: string;
  workEmail?: string;
  workPhone?: string;
  mobilePhone?: string;
  addressDetail?: string;

  department_id: number; // Changed to snake_case and number
  job_title_id: number; // Changed from positionId, to snake_case and number
  hire_date: string; // Expecting YYYY-MM-DD string format for API
  probationEndDate?: string | null; // Expecting YYYY-MM-DD string format for API
  employment_type_lookup_value_id?: number | null;
  status_lookup_value_id: number; 
  workLocation?: string;
  reports_to_employee_id?: number | null; // Changed to snake_case and number

  contract_type_lookup_value_id?: number | null;
  initialContractStartDate?: string | null; // Expecting YYYY-MM-DD string format for API
  initialContractEndDate?: string | null; // Expecting YYYY-MM-DD string format for API

  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  notes?: string;

  // Allow passing initial sub-entity arrays
  job_history_records?: Omit<JobHistoryItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'departmentName' | 'job_title_name'>[];
  contracts?: Omit<ContractItem, 'id' | 'employee_id' | 'created_at' | 'updated_at'>[];
  compensation_records?: Omit<CompensationItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'total_salary'>[];
  leave_balances?: Omit<LeaveBalanceItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'balance' | 'leave_type_name'>[];
}

// For updating an employee, most fields are optional (Partial)
// 'id' or 'employeeId' would be used to identify the record, but not usually part of the updatable payload itself (passed in URL or separate param)
export interface UpdateEmployeePayload extends Partial<Omit<CreateEmployeePayload, 'employee_code'>> {
  // id is passed in URL, not payload for employee update
  // job_history_records, contracts, etc. can be updated by passing the full modified array.
  // Ensure sub-entity payloads within these arrays for update operations correctly omit read-only fields
  // and include their own IDs if individual items within the array are being updated.
  // For simplicity here, we assume the API replaces the entire collection for a sub-entity if provided.
  // If the API supports partial updates to sub-entities (e.g., add one, update one, delete one in a single PUT Employee call),
  // the payload structure for these arrays might need to be more complex (e.g. items with an 'operation' flag).
  // Based on typical REST patterns with nested resources, often the entire sub-collection is replaced.
}

// Job History Payloads
// For CreateJobHistoryPayload, we omit fields that are auto-generated or derived.
// employee_id will be part of the URL path or main employee object context, not this payload.
export interface CreateJobHistoryPayload extends Omit<JobHistoryItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'departmentName' | 'job_title_name'> {
  effectiveDate: string; // Ensure this is string for API, Dayjs for form is fine
  // departmentName and job_title_name are typically derived/joined, not part of create payload
}
// For UpdateJobHistoryPayload, typically all fields are optional, and 'id' identifies the record.
// However, if updates happen via PUT on the parent Employee, this specific type might be less used directly with an API client.
export interface UpdateJobHistoryPayload extends Partial<Omit<JobHistoryItem, 'employee_id' | 'created_at' | 'updated_at' | 'departmentName' | 'job_title_name'>> {
  id: number; // ID of the specific job history record to update is required
  effectiveDate?: string;
}

// Contract Payloads
// Similar logic: omit auto-generated/derived fields for Create.
export interface CreateContractPayload extends Omit<ContractItem, 'id' | 'employee_id' | 'created_at' | 'updated_at'> {
  start_date: string; 
  end_date: string; 
}
// For UpdateContractPayload, 'id' of the contract is needed.
export interface UpdateContractPayload extends Partial<Omit<ContractItem, 'employee_id' | 'created_at' | 'updated_at'>> {
  id: number; // ID of the specific contract to update is required
  start_date?: string;
  end_date?: string;
}

// Compensation Payloads
// total_salary is often calculated, so omit for create.
export interface CreateCompensationPayload extends Omit<CompensationItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'total_salary'> {
  effective_date: string; 
}
// For UpdateCompensationPayload, 'id' is needed.
export interface UpdateCompensationPayload extends Partial<Omit<CompensationItem, 'employee_id' | 'created_at' | 'updated_at' | 'total_salary'> > {
  id: number; // ID of the specific compensation record to update is required
  effective_date?: string;
}

// Leave Balance Payloads
// balance is calculated, leave_type_name is derived.
export interface CreateLeaveBalancePayload extends Omit<LeaveBalanceItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'balance' | 'leave_type_name'> {
  validity_date?: string | null; 
}
// For UpdateLeaveBalancePayload, 'id' is needed.
// leave_type_id is usually part of the key, so might not be updatable without delete/create.
export interface UpdateLeaveBalancePayload extends Partial<Omit<LeaveBalanceItem, 'employee_id' | 'created_at' | 'updated_at' | 'balance' | 'leave_type_name' | 'leave_type_id'>> {
  id: number; // ID of the specific leave balance record to update is required
  validity_date?: string | null;
}

// You might also want types for form values if they differ from the main types
// e.g. CreateEmployeeFormValues, EditEmployeeFormValues 

export interface PageMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  // Add other fields if your API returns them, e.g., from, to, last_page, etc.
}

export interface SubEntityQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Add other common filter fields if applicable across sub-entities
  // e.g., effectiveDateStart?: string; effectiveDateEnd?: string;
}

// Generic LookupValue from /v2/lookup/values API
export interface LookupValue {
  id: number;
  lookup_type_id: number;
  lookup_type_code: string;
  value: string; // The actual value/code stored, e.g., "MALE", "FULL_TIME"
  label: string; // The human-readable label, e.g., "Male", "Full Time"
  display_order?: number;
  is_active?: boolean;
  // include other fields if API returns them, e.g. description, parent_id etc.
} 