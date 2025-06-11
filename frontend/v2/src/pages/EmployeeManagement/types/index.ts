// 员工管理类型定义
export interface EmployeeManagementItem {
  id: number;
  employee_code?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  id_number?: string;
  date_of_birth?: string;
  gender_lookup_value_id?: number;
  nationality?: string;
  ethnicity?: string;
  hire_date: string;
  first_work_date?: string;
  status_lookup_value_id: number;
  employment_type_lookup_value_id?: number;
  education_level_lookup_value_id?: number;
  marital_status_lookup_value_id?: number;
  political_status_lookup_value_id?: number;
  contract_type_lookup_value_id?: number;
  home_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  department_id?: number;
  department_name?: string;
  personnel_category_id?: number;
  personnel_category_name?: string;
  actual_position_id?: number;
  position_name?: string;
  career_position_level_date?: string;
  current_position_start_date?: string;
  salary_level_lookup_value_id?: number;
  salary_grade_lookup_value_id?: number;
  ref_salary_level_lookup_value_id?: number;
  job_position_level_lookup_value_id?: number;
  interrupted_service_years?: number;
  social_security_client_number?: string;
  housing_fund_client_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 员工查询参数
export interface EmployeeManagementQuery {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  full_name_contains?: string;
  employee_code_contains?: string;
  department_name_contains?: string;
  position_name_contains?: string;
  employee_status_equals?: string;
  department_id?: number;
  personnel_category_id?: number;
  is_active?: boolean;
}

// 创建员工数据
export interface CreateEmployeeData {
  employee_code?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  id_number?: string;
  date_of_birth?: string;
  gender_lookup_value_id?: number;
  nationality?: string;
  ethnicity?: string;
  hire_date: string;
  first_work_date?: string;
  status_lookup_value_id: number;
  employment_type_lookup_value_id?: number;
  education_level_lookup_value_id?: number;
  marital_status_lookup_value_id?: number;
  political_status_lookup_value_id?: number;
  contract_type_lookup_value_id?: number;
  home_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  department_id?: number;
  personnel_category_id?: number;
  actual_position_id?: number;
  career_position_level_date?: string;
  current_position_start_date?: string;
  salary_level_lookup_value_id?: number;
  salary_grade_lookup_value_id?: number;
  ref_salary_level_lookup_value_id?: number;
  job_position_level_lookup_value_id?: number;
  interrupted_service_years?: number;
  social_security_client_number?: string;
  housing_fund_client_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  is_active?: boolean;
}

// 更新员工数据
export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  id: number;
}

// 分页结果
export interface EmployeeManagementPageResult {
  data: EmployeeManagementItem[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

// 表格列配置
export interface TableColumnConfig {
  key: string;
  title: string;
  dataIndex: string;
  sorter?: boolean;
  filterable?: boolean;
  width?: number;
  fixed?: boolean | 'left' | 'right';
}

// 表格筛选器状态
export interface TableFilters {
  [key: string]: any;
}

// 表格排序状态
export interface TableSorter {
  field?: string;
  order?: 'ascend' | 'descend';
} 