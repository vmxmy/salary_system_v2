// 计算规则集类型
export interface CalculationRuleSet {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  effective_date: string;
  expiry_date?: string;
  rules: CalculationRule[];
  created_at: string;
  updated_at: string;
}

// 计算规则类型
export interface CalculationRule {
  id: number;
  rule_set_id: number;
  component_type: 'EARNING' | 'DEDUCTION' | 'PERSONAL_DEDUCTION' | 'EMPLOYER_DEDUCTION';
  component_code: string;
  calculation_method: 'FIXED' | 'PERCENTAGE' | 'FORMULA' | 'PROGRESSIVE';
  calculation_config: Record<string, any>;
  priority: number;
  is_active: boolean;
  conditions?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 社保配置类型
export interface SocialInsuranceConfig {
  id: number;
  name: string;
  region: string;
  effective_date: string;
  expiry_date?: string;
  pension_employee_rate: number;
  pension_employer_rate: number;
  occupational_pension_employee_rate?: number;
  occupational_pension_employer_rate?: number;
  medical_employee_rate: number;
  medical_employer_rate: number;
  serious_illness_employee_rate?: number;
  serious_illness_employer_rate?: number;
  unemployment_employee_rate: number;
  unemployment_employer_rate: number;
  injury_employer_rate: number;
  maternity_employer_rate: number;
  housing_fund_employee_rate: number;
  housing_fund_employer_rate: number;
  pension_base_min: number;
  pension_base_max: number;
  medical_base_min: number;
  medical_base_max: number;
  unemployment_base_min: number;
  unemployment_base_max: number;
  housing_fund_base_min: number;
  housing_fund_base_max: number;
  base_calculation_method: 'BASIC_SALARY' | 'GROSS_SALARY' | 'TOTAL_SALARY' | 'CUSTOM';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 税务配置类型
export interface TaxConfig {
  id: number;
  name: string;
  tax_year: number;
  effective_date: string;
  expiry_date?: string;
  tax_brackets: TaxBracket[];
  standard_deduction: number;
  additional_deduction_child: number;
  additional_deduction_elderly: number;
  additional_deduction_education: number;
  additional_deduction_housing: number;
  additional_deduction_medical: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 税率档次类型
export interface TaxBracket {
  min_amount: number;
  max_amount?: number;
  tax_rate: number;
  quick_deduction: number;
}

// 创建/更新请求类型
export interface CreateCalculationRuleSetRequest {
  name: string;
  description?: string;
  effective_date: string;
  expiry_date?: string;
  rules?: Partial<CalculationRule>[];
}

export interface UpdateCalculationRuleSetRequest extends Partial<CreateCalculationRuleSetRequest> {
  is_active?: boolean;
}

export interface CreateSocialInsuranceConfigRequest {
  name: string;
  region: string;
  effective_date: string;
  expiry_date?: string;
  pension_employee_rate: number;
  pension_employer_rate: number;
  occupational_pension_employee_rate?: number;
  occupational_pension_employer_rate?: number;
  medical_employee_rate: number;
  medical_employer_rate: number;
  serious_illness_employee_rate?: number;
  serious_illness_employer_rate?: number;
  unemployment_employee_rate: number;
  unemployment_employer_rate: number;
  injury_employer_rate: number;
  maternity_employer_rate: number;
  housing_fund_employee_rate: number;
  housing_fund_employer_rate: number;
  pension_base_min: number;
  pension_base_max: number;
  medical_base_min: number;
  medical_base_max: number;
  unemployment_base_min: number;
  unemployment_base_max: number;
  housing_fund_base_min: number;
  housing_fund_base_max: number;
  base_calculation_method: 'BASIC_SALARY' | 'GROSS_SALARY' | 'TOTAL_SALARY' | 'CUSTOM';
}

export interface UpdateSocialInsuranceConfigRequest extends Partial<CreateSocialInsuranceConfigRequest> {
  is_active?: boolean;
}

export interface CreateTaxConfigRequest {
  name: string;
  tax_year: number;
  effective_date: string;
  expiry_date?: string;
  tax_brackets: TaxBracket[];
  standard_deduction: number;
  additional_deduction_child: number;
  additional_deduction_elderly: number;
  additional_deduction_education: number;
  additional_deduction_housing: number;
  additional_deduction_medical: number;
}

export interface UpdateTaxConfigRequest extends Partial<CreateTaxConfigRequest> {
  is_active?: boolean;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// 计算相关类型
export interface CalculationRequest {
  payroll_period_id: number;
  employee_ids?: number[];
  rule_set_id?: number;
  is_preview?: boolean;
  async_mode?: boolean;
}

export interface CalculationResult {
  employee_id: number;
  employee_name: string;
  basic_salary: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  gross_salary: number;
  net_salary: number;
  tax_amount: number;
  social_insurance_employee: number;
  social_insurance_employer: number;
  housing_fund_employee: number;
  housing_fund_employer: number;
  calculation_details: Record<string, any>;
}

export interface CalculationTaskStatus {
  task_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message?: string;
  result?: CalculationResult[];
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface CalculationSummary {
  payroll_run_id: number;
  total_employees: number;
  total_gross_salary: number;
  total_net_salary: number;
  total_tax: number;
  total_social_insurance_employee: number;
  total_social_insurance_employer: number;
  total_housing_fund_employee: number;
  total_housing_fund_employer: number;
  calculation_date: string;
  rule_set_name: string;
} 