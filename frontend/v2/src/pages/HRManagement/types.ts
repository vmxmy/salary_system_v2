// HRManagement Module Types

import type { Dayjs } from 'dayjs';

// Define LookupItem here if Department extends it, or import if it's a shared type.
export interface LookupItem {
  value: string | number; // Allow value to be string or number, as IDs are often numbers
  label: string;
  code?: string; // Optional: for string codes like 'active' if value becomes numeric ID
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
  id: string; // Primary DB ID
  first_name?: string;
  last_name?: string;
  
  employee_code: string; // Changed from employeeId, made mandatory for display and consistency

  avatar?: string; // URL to avatar image
  departmentId?: string; // This would be department_id if it's a foreign key in the payload and DB
  positionId?: string; // This would be position_id if it's a foreign key
  
  status_lookup_value_id?: number; // For form submission and storing numeric ID
  
  employment_type_lookup_value_id?: number;
  
  gender_lookup_value_id?: number; // For form submission and storing numeric ID
  
  id_number?: string; // Changed from idCardNumber to id_number
  dob?: string | Dayjs; 
  hire_date?: string | Dayjs; // Consistent with form, was hireDate

  nationality?: string;
  education_level_lookup_value_id?: number;
  
  // Contact Info
  personalEmail?: string;
  workEmail?: string; // If different from personal
  workPhone?: string;
  mobilePhone?: string; 
  addressDetail?: string; // Full residential address

  // Job Information
  probationEndDate?: string | Dayjs; 
  reportsToEmployeeId?: string; // This might need to be reports_to_employee_id or similar if it's a FK
  workLocation?: string;

  // Derived or joined fields (mainly for display)
  departmentName?: string;
  positionName?: string; 

  // New fields
  marital_status_lookup_value_id?: number;
  ethnicity?: string; 
  political_status_lookup_value_id?: number;
  
  bankName?: string;
  bankAccountName?: string; // Name of the account holder
  bankAccountNumber?: string; // Actual account number (replaces generic bankAccount)

  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Initial contract details (can be part of CreateEmployeePayload, for simplicity)
  contract_type_lookup_value_id?: number; 
  initialContractStartDate?: string | Dayjs; // UNCOMMENTED
  initialContractEndDate?: string | Dayjs; // UNCOMMENTED
  notes?: string; // General notes
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

export interface Department extends LookupItem { // Department now correctly extends LookupItem
  id: string; // Redundant if LookupItem has value as id, but explicit for clarity
  name: string; // Redundant if LookupItem has label as name
  children?: Department[];
  // any other properties from backend for department
}

export interface PositionItem { // Renamed from Position to PositionItem for clarity
  id: string;
  name: string;
  departmentId?: string; // Optional: if positions are tied to departments
  value?: string; 
  label?: string; 
  children?: PositionItem[]; 
}

// From previous job history thoughts, refine as needed
export interface JobHistoryItem {
  id: string;
  employeeId: string;
  effectiveDate: string | Dayjs; // Date string or Dayjs object
  departmentId: string;
  departmentName?: string; // Denormalized or fetched
  positionId: string;
  positionName?: string; // Denormalized or fetched
  employmentType: EmploymentType; // e.g., Promotion, Transfer, New Hire
  salary?: number; // Optional, if tracking salary changes with job history
  remarks?: string;
}

// New Interfaces for Employee Detail Page Tabs

export interface ContractItem {
  id: string;
  employeeId: string;
  contractNumber: string;
  contractType: ContractType; 
  startDate: string | Dayjs; 
  endDate: string | Dayjs; 
  status: ContractStatus;
  // filePath?: string; // Link to scanned contract
  remarks?: string;
}

export interface CompensationItem {
  id: string;
  employeeId: string;
  effectiveDate: string | Dayjs; 
  basicSalary: number;
  allowances?: number; 
  totalSalary?: number; // Calculated or stored
  payFrequency: PayFrequency;
  currency?: string; // e.g., CNY, USD
  changeReason?: string;
  remarks?: string;
}

export interface LeaveBalanceItem {
  id: string; // Could be leaveTypeId if unique per employee-leaveType
  employeeId: string;
  leaveTypeId: string; // FK to a LeaveType definition table
  leaveTypeName?: string; // Denormalized
  totalEntitlement: number; // Total days/hours accrued or granted for the period
  taken: number; // Total days/hours used
  balance: number; // Calculated: totalEntitlement - taken
  unit: 'days' | 'hours';
  validityDate?: string | Dayjs; // Expiry date for this balance, if applicable
  year?: number; // For balances specific to a year
}

// Paginated Base Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number; // Optional
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
  gender_lookup_value_id?: number; // Added, assuming backend expects numeric ID. Make non-optional if required.
  id_number: string; // Changed from idCardNumber to id_number
  dob: string;
  nationality?: string;
  education_level_lookup_value_id?: number;
  marital_status_lookup_value_id?: number;
  ethnicity?: string;
  political_status_lookup_value_id?: number;
  personalEmail?: string;
  workEmail?: string;
  workPhone?: string;
  mobilePhone?: string;
  addressDetail?: string;

  departmentId: string;
  positionId: string;
  hire_date: string;
  probationEndDate?: string;
  employment_type_lookup_value_id?: number;
  status_lookup_value_id: number; // Changed to number
  workLocation?: string;
  reportsToEmployeeId?: string;

  contract_type_lookup_value_id?: number;
  initialContractStartDate?: string;
  initialContractEndDate?: string;

  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  notes?: string;
}

// For updating an employee, most fields are optional (Partial)
// 'id' or 'employeeId' would be used to identify the record, but not usually part of the updatable payload itself (passed in URL or separate param)
export interface UpdateEmployeePayload extends Partial<Omit<CreateEmployeePayload, 'employee_code'>> { // employee_code usually not updatable
  id: string; // Record ID for update
  // Ensure gender_lookup_value_id is also optional here if it's in CreateEmployeePayload
}

// Job History Payloads
export interface CreateJobHistoryPayload extends Omit<JobHistoryItem, 'id' | 'employeeId' | 'departmentName' | 'positionName' | 'effectiveDate'> {
  effectiveDate: string; // YYYY-MM-DD
}
export interface UpdateJobHistoryPayload extends Partial<CreateJobHistoryPayload> {}

// Contract Payloads
export interface CreateContractPayload extends Omit<ContractItem, 'id' | 'employeeId' | 'startDate' | 'endDate'> {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
export interface UpdateContractPayload extends Partial<CreateContractPayload> {}

// Compensation Payloads
export interface CreateCompensationPayload extends Omit<CompensationItem, 'id' | 'employeeId' | 'totalSalary' | 'effectiveDate'> {
  effectiveDate: string; // YYYY-MM-DD
  // totalSalary is usually calculated, not directly input during creation/update
}
export interface UpdateCompensationPayload extends Partial<CreateCompensationPayload> {}

// Leave Balance Payloads
export interface CreateLeaveBalancePayload extends Omit<LeaveBalanceItem, 'id' | 'employeeId' | 'leaveTypeName' | 'balance' | 'validityDate'> {
  validityDate?: string; // YYYY-MM-DD, optional
  // 'balance' is calculated, 'leaveTypeName' is denormalized
}

export interface UpdateLeaveBalancePayload extends Partial<Omit<CreateLeaveBalancePayload, 'leaveTypeId'>> {
  // leaveTypeId is usually the key and not updatable directly in an 'update' operation for a specific balance record.
  // If adjusting entitlement or taken days for an *existing* leave type balance, this is appropriate.
  // If changing the leave type itself, it might be a delete + create new one.
}

// You might also want types for form values if they differ from the main types
// e.g. CreateEmployeeFormValues, EditEmployeeFormValues 