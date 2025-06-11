/**
 * 员工个人信息相关类型定义
 */

// 我的员工信息类型
export interface MyEmployeeInfo {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  is_active?: boolean;
  
  // 基本信息
  id_number?: string;
  date_of_birth?: string;
  gender_lookup_value_id?: number;
  genderName?: string;
  nationality?: string;
  ethnicity?: string;
  
  // 联系信息
  email?: string;
  phone_number?: string;
  home_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // 工作信息
  department_id?: number;
  departmentName?: string;
  actual_position_id?: number;
  actual_position_name?: string;
  personnel_category_id?: number;
  personnelCategoryName?: string;
  employment_type_lookup_value_id?: number;
  employmentTypeName?: string;
  job_position_level_lookup_value_id?: number;
  jobPositionLevelName?: string;
  
  // 日期字段
  hire_date?: string;
  first_work_date?: string;
  current_position_start_date?: string;
  career_position_level_date?: string;
  interrupted_service_years?: number;
  
  // 教育背景
  education_level_lookup_value_id?: number;
  educationLevelName?: string;
  marital_status_lookup_value_id?: number;
  maritalStatusName?: string;
  political_status_lookup_value_id?: number;
  politicalStatusName?: string;
  
  // 薪资信息
  salary_level_lookup_value_id?: number;
  salaryLevelName?: string;
  salary_grade_lookup_value_id?: number;
  salaryGradeName?: string;
  ref_salary_level_lookup_value_id?: number;
  refSalaryLevelName?: string;
  
  // 社保信息
  social_security_client_number?: string;
  
  // 状态信息
  status_lookup_value_id?: number;
  
  // 时间戳
  created_at?: string;
  updated_at?: string;
}

// 员工信息编辑表单数据类型
export interface EmployeeEditFormData {
  // 基本信息
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender_lookup_value_id?: number;
  id_number?: string;
  nationality?: string;
  ethnicity?: string;
  
  // 联系信息
  email?: string;
  phone_number?: string;
  home_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // 工作信息
  department_id?: number;
  personnel_category_id?: number;
  actual_position_id?: number;
  employment_type_lookup_value_id?: number;
  job_position_level_lookup_value_id?: number;
  hire_date?: string;
  first_work_date?: string;
  current_position_start_date?: string;
  career_position_level_date?: string;
  interrupted_service_years?: number;
  
  // 教育背景
  education_level_lookup_value_id?: number;
  marital_status_lookup_value_id?: number;
  political_status_lookup_value_id?: number;
  
  // 薪资相关
  salary_level_lookup_value_id?: number;
  salary_grade_lookup_value_id?: number;
  ref_salary_level_lookup_value_id?: number;
  social_security_client_number?: string;
}

// 分步表单步骤类型
export type FormStep = 'basic' | 'contact' | 'work' | 'education';

// 表单步骤配置
export interface FormStepConfig {
  key: FormStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// 权限配置类型
export interface EmployeeInfoPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

// 编辑模式类型
export type EditMode = 'view' | 'edit';

// API响应类型
export interface EmployeeInfoResponse {
  success: boolean;
  data?: MyEmployeeInfo;
  message?: string;
  errors?: string[];
}

// 更新响应类型
export interface EmployeeUpdateResponse {
  success: boolean;
  data?: MyEmployeeInfo;
  message?: string;
  errors?: Record<string, string[]>;
} 