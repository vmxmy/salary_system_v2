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

export interface EmployeeAppraisalFormData {
  id?: number; // For existing records being updated. Omit for new records.
  // employee_id is usually implicit from the parent Employee context, so not needed here for payload items.
  appraisal_year: number; // Should be required for a valid appraisal record
  appraisal_result_lookup_id: number; // Should be required
  appraisal_date?: string | Dayjs | null;
  remarks?: string | null;
}

export interface Employee {
  id: number; // Changed to number, assuming DB ID is numeric
  first_name: string; // Made non-optional as it's usually required
  last_name: string; // Made non-optional
  
  employee_code: string; 

  avatar?: string; 
  department_id?: number | null; 
  actual_position_id?: number | null; // ADDED/CONFIRMED - for current actual position
  
  status_lookup_value_id?: number; 
  employment_type_lookup_value_id?: number;
  gender_lookup_value_id?: number; 
  
  id_number?: string; 
  date_of_birth?: string | Dayjs; 
  hire_date: string | Dayjs; // This is 'onboarding date to current company'
  first_work_date?: string | Dayjs; // Added: 'Initial employment date in career'
  
  nationality?: string;
  ethnicity?: string; // Existed, confirmed for '民族'
  education_level_lookup_value_id?: number;
  
  email?: string;
  phone_number?: string;
  home_address?: string;

  probationEndDate?: string | Dayjs; 
  reports_to_employee_id?: number | null; 
  workLocation?: string;

  departmentName?: string;
  actual_position_name?: string; // ADDED/CONFIRMED - for current actual position name
  actualPositionName?: string; // 添加驼峰命名版本，匹配后端返回的字段名
  
  // Position timing fields
  career_position_level_date?: string | Dayjs; // Date when employee first reached this position level in their entire career
  current_position_start_date?: string | Dayjs; // Date when employee started this position in current organization

  marital_status_lookup_value_id?: number;
  political_status_lookup_value_id?: number;
  
  // 新增字段 - 工资级别、工资档次、参照正编薪级
  salary_level_lookup_value_id?: number;
  salary_level_lookup_value_name?: string;
  salary_grade_lookup_value_id?: number;
  salary_grade_lookup_value_name?: string;
  ref_salary_level_lookup_value_id?: number;
  ref_salary_level_lookup_value_name?: string;
  
  // 新增字段 - 职务级别
  job_position_level_lookup_value_id?: number;
  job_position_level_lookup_value_name?: string;
  jobPositionLevelName?: string; // 驼峰命名版本，匹配后端返回的字段名
  
  bank_name?: string;
  bank_account_number?: string;

  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergencyContactRelation?: string;

  contract_type_lookup_value_id?: number; 
  initialContractStartDate?: string | Dayjs; 
  initialContractEndDate?: string | Dayjs; 
  notes?: string;

  // New fields based on discussion
  interrupted_service_years?: number | null; // Added: '工龄间断年限'
  personnel_category_id?: number | null; // Modified: Made optional/nullable, matches CreateEmployeePayload
  personnelCategoryName?: string; // Standardized to camelCase to match backend computed field

  // Sub-module arrays as per API schema
  job_history_records?: JobHistoryItem[];
  contracts?: ContractItem[];
  compensation_records?: CompensationItem[];
  leave_balances?: LeaveBalanceItem[];
  appraisals?: EmployeeAppraisalFormData[]; // Added for employee data structure

  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;

  position_name?: string;
}

export interface EmployeeQuery {
  page?: number;
  size?: number; // Changed from pageSize to match backend expected param name 'size'
  name?: string;
  employee_code?: string;
  department_id?: string;
  status_lookup_value_id?: number;
  gender_lookup_value_id?: number;
  education_level_lookup_value_id?: number;
  employment_type_lookup_value_id?: number;
  hireDateStart?: string;
  hireDateEnd?: string;
  actual_position_id?: number;
  marital_status_lookup_value_id?: number;
  political_status_lookup_value_id?: number;
  contract_type_lookup_value_id?: number;
  job_position_level_lookup_value_id?: number;
  id_number?: string;
  firstWorkDateStart?: string; 
  firstWorkDateEnd?: string;
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

export interface PersonnelCategory { // MODIFIED from JobTitle, was Renamed from PositionItem
  id: number; // Assuming id is number
  code?: string;
  name: string;
  description?: string | null;
  parent_category_id?: number | null; // ADDED to match api/types.ts and backend model
  effective_date?: string | Dayjs;    // Ensure this matches api/types.ts if it uses string only
  end_date?: string | Dayjs | null;   // Ensure this matches api/types.ts if it uses string only
  is_active?: boolean;
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
  // value and label for Select components
  value?: number; // For select options, usually id
  label?: string; // For select options, usually name
  children?: PersonnelCategory[]; // ADDED to support tree structures if needed directly in this type
}

export interface Position { // ADDED for Actual Position
  id: number;
  code?: string;
  name: string;
  description?: string | null;
  parent_position_id?: number | null; // To match backend model hr.positions
  effective_date?: string | Dayjs;
  end_date?: string | Dayjs | null;
  is_active?: boolean;
  created_at?: string | Dayjs;
  updated_at?: string | Dayjs;
  // value and label for Select components
  value?: number; // For select options, usually id
  label?: string; // For select options, usually name
  children?: Position[]; // To support tree structures
}

// From previous job history thoughts, refine as needed
export interface JobHistoryItem {
  id: number; // Changed to number
  employee_id: number; // Changed to snake_case and number
  effectiveDate: string | Dayjs; 
  department_id: number; 
  departmentName?: string; 
  personnel_category_id: number; // RENAMED from job_title_id
  personnel_category_name?: string; // RENAMED from job_title_name
  position_id: number; // ADDED for actual position in history
  position_name?: string; // ADDED for actual position name in history
  employment_type_lookup_value_id?: number; // THIS IS THE ORIGINAL ONE, KEEP
  salary?: number; // THIS IS THE ORIGINAL ONE, KEEP
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
  // Core fields from EmployeeBase
  employee_code: string;
  first_name: string;
  last_name: string;
  id_number: string; 
  date_of_birth: string; // YYYY-MM-DD
  hire_date: string;     // YYYY-MM-DD
  first_work_date?: string | null;
  entry_date_to_current_organization?: string | null;
  
  // Position timing fields
  career_position_level_date?: string | null; // Date when employee first reached this position level in their entire career
  current_position_start_date?: string | null; // Date when employee started this position in current organization
  
  nationality?: string | null;
  ethnicity?: string | null;
  interrupted_service_years?: number | null;
  email?: string | null;
  phone_number?: string | null;
  home_address?: string | null;
  avatar?: string | null;

  // Direct ID fields that should be part of the payload
  gender_lookup_value_id?: number | null;
  status_lookup_value_id: number; // This is required for creation
  employment_type_lookup_value_id?: number | null;
  education_level_lookup_value_id?: number | null;
  marital_status_lookup_value_id?: number | null;
  political_status_lookup_value_id?: number | null;
  contract_type_lookup_value_id?: number | null;
  department_id?: number | null; 
  personnel_category_id?: number | null; 
  actual_position_id?: number | null;
  
  // 新增字段 - 工资级别、工资档次、参照正编薪级
  salary_level_lookup_value_id?: number | null;
  salary_grade_lookup_value_id?: number | null;
  ref_salary_level_lookup_value_id?: number | null;
  
  // 新增字段 - 职务级别
  job_position_level_lookup_value_id?: number | null;

  // Fields for resolving lookups by name (can be optional if ID is provided)
  gender_lookup_value_name?: string | null;
  status_lookup_value_name?: string | null; // Made optional as ID is primary
  employment_type_lookup_value_name?: string | null;
  education_level_lookup_value_name?: string | null;
  marital_status_lookup_value_name?: string | null;
  political_status_lookup_value_name?: string | null;
  contract_type_lookup_value_name?: string | null;
  
  // 新增字段名称 - 工资级别、工资档次、参照正编薪级
  salary_level_lookup_value_name?: string | null;
  salary_grade_lookup_value_name?: string | null;
  ref_salary_level_lookup_value_name?: string | null;
  
  // 新增字段名称 - 职务级别
  job_position_level_lookup_value_name?: string | null;
  
  // Fields for resolving department, personnel_category and position by name (can be optional if ID is provided)
  department_name?: string | null;
  personnel_category_name?: string | null;
  position_name?: string | null;

  // Additional fields not directly part of the Employee object
  bank_name?: string | null;
  bank_account_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
}

// For updating an employee, most fields are optional (Partial)
// 'id' or 'employeeId' would be used to identify the record, but not usually part of the updatable payload itself (passed in URL or separate param)
export interface UpdateEmployeePayload extends Partial<Omit<CreateEmployeePayload, 'employee_code' | 'appraisals'>> {
  appraisals?: EmployeeAppraisalFormData[];
}

// Job History Payloads
// For CreateJobHistoryPayload, we omit fields that are auto-generated or derived.
// employee_id will be part of the URL path or main employee object context, not this payload.
export interface CreateJobHistoryPayload extends Omit<JobHistoryItem, 'id' | 'employee_id' | 'created_at' | 'updated_at' | 'departmentName' | 'personnel_category_name' | 'position_name'> { // Added position_name to Omit
  effectiveDate: string; // Ensure this is string for API, Dayjs for form is fine
  // departmentName and personnel_category_name are typically derived/joined, not part of create payload
  // position_name is also typically derived/joined
}
// For UpdateJobHistoryPayload, typically all fields are optional, and 'id' identifies the record.
// However, if updates happen via PUT on the parent Employee, this specific type might be less used directly with an API client.
export interface UpdateJobHistoryPayload extends Partial<Omit<JobHistoryItem, 'employee_id' | 'created_at' | 'updated_at' | 'departmentName' | 'personnel_category_name' | 'position_name'> > { // Added position_name to Omit
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
  page: number; // Changed from current_page
  size: number; // Changed from per_page
  total: number;
  totalPages: number; // Changed from total_pages
  // total_items is removed as 'total' is confirmed from backend
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