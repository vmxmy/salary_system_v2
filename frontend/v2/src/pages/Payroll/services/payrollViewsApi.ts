import apiClient from '../../../api/apiClient';
import type { PayrollPeriod, PayrollRun, PayrollEntry, LookupValue, ApiListResponse } from '../types/payrollTypes';

// 视图API的基础端点
const PAYROLL_VIEWS_ENDPOINT = '/views';
const PAYROLL_V2_ENDPOINT = '/v2/payroll';

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

// 扩展的视图类型定义
export interface PayrollPeriodDetailView extends PayrollPeriod {
  // 扩展字段，包含更多统计信息
  total_runs?: number;
  total_entries?: number;
  total_gross_pay?: number;
  total_net_pay?: number;
  total_deductions?: number;
  average_gross_pay?: number;
  average_net_pay?: number;
  department_count?: number;
  employee_count?: number;
  status_name?: string;
  frequency_name?: string;
}

export interface PayrollRunDetailView extends PayrollRun {
  // 扩展字段，包含更多详细信息
  period_name?: string;
  period_start_date?: string;
  period_end_date?: string;
  period_pay_date?: string;
  status_name?: string;
  total_entries?: number;
  total_gross_pay?: number;
  total_net_pay?: number;
  total_deductions?: number;
  average_gross_pay?: number;
  average_net_pay?: number;
  department_breakdown?: Record<string, {
    employee_count: number;
    total_gross_pay: number;
    total_net_pay: number;
    total_deductions: number;
  }>;
}

export interface PayrollEntryDetailedView extends PayrollEntry {
  // 扩展字段，包含展开的JSONB字段和关联信息
  period_name?: string;
  period_start_date?: string;
  period_end_date?: string;
  period_pay_date?: string;
  run_date?: string;
  status_name?: string;
  department_name?: string;
  position_name?: string;
  personnel_category_name?: string;
  
  // 展开的收入明细字段
  basic_salary?: number;
  performance_salary?: number;
  position_salary?: number;
  grade_salary?: number;
  allowance?: number;
  subsidy?: number;
  basic_performance_salary?: number;
  traffic_allowance?: number;
  only_child_bonus?: number;
  township_allowance?: number;
  position_allowance?: number;
  overtime_pay?: number;
  bonus?: number;
  
  // 展开的扣除明细字段
  personal_income_tax?: number;
  social_insurance_personal?: number;
  housing_fund_personal?: number;
  social_insurance_total?: number;
  housing_fund_total?: number;
  union_fee?: number;
  other_deductions?: number;
}

export interface PayrollComponentBasicView {
  id: number;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  sort_order?: number;
  usage_count?: number; // 使用次数统计
  total_amount?: number; // 总金额统计
}

export interface PayrollComponentUsageView {
  component_id: number;
  component_code: string;
  component_name: string;
  component_type: string;
  usage_count: number;
  total_amount: number;
  average_amount: number;
  min_amount: number;
  max_amount: number;
  period_id?: number;
  period_name?: string;
}

export interface PayrollSummaryAnalysisView {
  department_name: string;
  employee_count: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
  avg_gross_pay: number;
  avg_net_pay: number;
  avg_deductions: number;
  period_id?: number;
  period_name?: string;
}

/**
 * 员工薪资历史视图类型定义
 */
export interface EmployeeSalaryHistoryView {
  id: number;
  employee_id: number;
  employee_code?: string;
  employee_name: string;
  department_name?: string;
  position_name?: string;
  personnel_category_name?: string;
  period_id: number;
  period_name: string;
  payroll_run_id: number;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  
  // 收入明细字段
  basic_salary: number;
  performance_salary: number;
  position_salary: number;
  grade_salary: number;
  allowance: number;
  subsidy: number;
  traffic_allowance: number;
  township_allowance: number;
  position_allowance: number;
  civil_servant_allowance: number;
  back_pay: number;
  
  // 扣除明细字段
  personal_income_tax: number;
  pension_personal: number;
  medical_personal: number;
  unemployment_personal: number;
  housing_fund_personal: number;
  annuity_personal: number;
  
  // 汇总字段
  basic_wage_total: number;
  performance_total: number;
  allowance_total: number;
  social_insurance_total: number;
  
  // 排名和统计字段
  salary_rank_in_period?: number;
  salary_rank_in_department?: number;
  
  calculated_at: string;
  updated_at: string;
}

/**
 * 员工薪资趋势数据类型
 */
export interface EmployeeSalaryTrendData {
  period_name: string;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  basic_salary: number;
  performance_salary: number;
  calculated_at: string;
}

/**
 * 薪资统计数据类型
 */
export interface SalaryStatistics {
  total_entries: number;
  unique_employees: number;
  unique_periods: number;
  unique_departments: number;
  avg_gross_pay: number;
  min_gross_pay: number;
  max_gross_pay: number;
  total_gross_pay: number;
  avg_net_pay: number;
  total_net_pay: number;
  avg_deductions: number;
  total_deductions: number;
}

/**
 * 核心工资数据视图类型 - 基于 reports.v_comprehensive_employee_payroll 视图
 *
 * @description 该接口定义了从后端综合工资视图获取的数据结构。
 * 它包含了员工基本信息、核心工资汇总，以及所有根据薪资组件定义动态生成的工资明细项。
 * 字段名使用中文，与数据库视图的列名保持一致。
 */
export interface ComprehensivePayrollDataView {
  // 核心基础信息
  '薪资条目id'?: number;
  '员工id'?: number;
  '薪资期间id'?: number;
  '薪资运行id'?: number;
  '员工编号'?: string;
  '名'?: string;
  '姓'?: string;
  '姓名'?: string;
  '身份证号'?: string;
  '电话'?: string;
  '邮箱'?: string;
  '入职日期'?: string; // date
  '员工状态'?: string;
  '部门名称'?: string;
  '职位名称'?: string;
  '人员类别'?: string;
  '根人员类别'?: string;
  '编制'?: string;
  '部门id'?: number;
  '实际职位id'?: number;
  '人员类别id'?: number;
  '社保客户号'?: string;
  '住房公积金客户号'?: string;
  '薪资期间名称'?: string;
  '薪资期间开始日期'?: string; // date
  '薪资期间结束日期'?: string; // date
  '薪资发放日期'?: string; // date
  '薪资运行日期'?: string; // date-time

  // 员工详细信息 - 联系信息
  '家庭住址'?: string;
  '紧急联系人'?: string;
  '紧急联系电话'?: string;
  
  // 员工详细信息 - 个人信息
  '出生日期'?: string;
  '性别'?: string;
  '民族'?: string;
  '民族详情'?: string;
  '婚姻状况'?: string;
  '学历'?: string;
  '政治面貌'?: string;
  
  // 员工详细信息 - 工作信息
  '首次工作日期'?: string;
  '现职位开始日期'?: string;
  '中断服务年限'?: string;
  '用工类型'?: string;
  '合同类型'?: string;
  '薪级'?: string;
  '薪档'?: string;
  '职位等级'?: string;
  
  // 员工详细信息 - 银行账号信息
  '开户银行'?: string;
  '账户持有人'?: string;
  '银行账号'?: string;
  '开户支行'?: string;
  '银行代码'?: string;
  '账户类型'?: string;

  // 核心汇总字段
  '应发合计'?: number;
  '扣除合计'?: number;
  '实发合计'?: number;

  // 动态生成的工资明细字段 (基于 config.payroll_component_definitions)
  
  // EARNING - 收入项
  '月奖励绩效'?: number;
  '基本工资'?: number;
  '独生子女父母奖励金'?: number;
  '公务交通补贴'?: number;
  '职务/技术等级工资'?: number;
  '奖励性绩效工资'?: number;
  '级别/岗位级别工资'?: number;
  '基础绩效奖'?: number;
  '岗位工资'?: number;
  '基础性绩效工资'?: number;
  '补发工资'?: number;
  '岗位职务补贴'?: number;
  '级别工资'?: number;
  '绩效工资'?: number;
  '薪级工资'?: number;
  '补助'?: number;
  '基础绩效'?: number;
  '信访工作人员岗位工作津贴'?: number;
  '津贴'?: number;
  '季度绩效考核薪酬'?: number;
  '九三年工改保留津补贴'?: number;
  '奖励绩效补发'?: number;
  '公务员规范后津补贴'?: number;
  '试用期工资'?: number;
  '事业单位人员薪级工资'?: number;
  '乡镇工作补贴'?: number;
  '一次性补扣发'?: number;
  '中小学教师或护士保留原额百分之十工资'?: number;
  '中小学教师或护士提高百分之十'?: number;
  '人民警察值勤岗位津贴'?: number;
  '人民警察加班补贴'?: number;
  '住房补贴'?: number;
  '公务员十三月奖励工资'?: number;
  '公安岗位津贴'?: number;
  '公安执勤津贴'?: number;
  '公安法定工作日之外加班补贴'?: number;
  '公检法艰苦边远地区津贴'?: number;
  '卫生九三年工改保留津补贴'?: number;
  '卫生援藏津贴'?: number;
  '卫生独生子女费'?: number;
  '回民补贴'?: number;
  '国家规定的其他津补贴项目'?: number;
  '工作性津贴'?: number;
  '年度考核奖'?: number;
  '护龄津贴'?: number;
  '援藏津贴'?: number;
  '政法委机关工作津贴'?: number;
  '教龄津贴'?: number;
  '月奖励绩效津贴'?: number;
  '法医毒物化验人员保健津贴'?: number;
  '法检基础性绩效津补贴'?: number;
  '法院检察院工改保留津贴'?: number;
  '法院检察院执勤津贴'?: number;
  '法院检察院规范津补贴'?: number;
  '特级教师津贴'?: number;
  '特殊岗位津贴'?: number;
  '生活性津贴'?: number;
  '老粮贴'?: number;
  '纪检津贴'?: number;
  '纪委监委机构改革保留补贴'?: number;
  '绩效奖'?: number;
  '绩效工资补发'?: number;
  '补发津贴'?: number;
  '警衔津贴'?: number;
  '艰苦边远地区津贴'?: number;
  '1季度绩效考核薪酬'?: number;

  // PERSONAL_DEDUCTION - 个人扣除项
  '个人所得税'?: number;
  '养老保险个人应缴费额'?: number;
  '医疗保险个人应缴费额'?: number;
  '失业保险个人应缴费额'?: number;
  '职业年金个人应缴费额'?: number;
  '住房公积金个人应缴费额'?: number;
  '奖励绩效补扣发'?: number;
  '绩效奖金补扣发'?: number;
  '补扣社保'?: number;
  '补扣（退）款'?: number;
  '补扣2022年医保款'?: number;
  
  // EMPLOYER_DEDUCTION - 单位扣除项
  '养老保险单位应缴费额'?: number;
  '医疗保险单位应缴总额'?: number;
  '医疗保险单位应缴费额'?: number;
  '大病医疗单位应缴费额'?: number;
  '失业保险单位应缴费额'?: number;
  '工伤保险单位应缴费额'?: number;
  '职业年金单位应缴费额'?: number;
  '住房公积金单位应缴费额'?: number;

  // CALCULATION_BASE - 计算基数
  '养老保险缴费基数'?: number;
  '医疗保险缴费基数'?: number;
  '医疗保险缴费工资'?: number;
  '职业年金缴费基数'?: number;
  '职业年金缴费工资'?: number;
  '计税基数'?: number;
  '住房公积金缴费基数'?: number;

  // CALCULATION_RATE - 计算费率
  '养老保险个人缴费费率'?: number;
  '养老保险单位缴费费率'?: number;
  '医疗保险个人缴费费率'?: number;
  '医疗保险单位缴纳费率'?: number;
  '大病医疗单位缴费费率'?: number;
  '失业保险个人缴费费率'?: number;
  '失业保险单位缴费费率'?: number;
  '工伤保险单位缴费费率'?: number;
  '职业年金个人费率'?: number;
  '职业年金单位缴费费率'?: number;
  '适用税率'?: number;
  '住房公积金个人缴费比例'?: number;
  '住房公积金单位缴费比例'?: number;

  // CALCULATION_RESULT - 计算结果
  '免税额'?: number;
  '应纳税所得额'?: number;
  '扣除额'?: number;
  '税后工资'?: number;
  '速算扣除数'?: number;
  
  // OTHER - 其他
  '工资统发'?: boolean;
  '财政供养'?: boolean;
  '固定薪酬全年应发数'?: number;

  // 核心元数据
  '状态id'?: number;
  '备注'?: string;
  '审计状态'?: string;
  '审计时间'?: string; // date-time
  '审计员id'?: number;
  '审计备注'?: string;
  '版本号'?: number;
  '计算时间'?: string; // date-time
  '更新时间'?: string; // date-time
  '原始应发明细'?: object; // jsonb
  '原始扣除明细'?: object; // jsonb
  '原始计算输入'?: object; // jsonb
  '原始计算日志'?: object; // jsonb
}

// API 函数定义
export const payrollViewsApi = {
  /**
   * 获取薪资周期详细视图
   */
  getPayrollPeriodsDetail: async (params?: {
    is_active?: boolean;
    year?: number;
    month?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollPeriodDetailView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollPeriodDetailView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/periods-detail`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll periods detail:', error);
      throw error;
    }
  },

  /**
   * 获取薪资运行详细视图
   */
  getPayrollRunsDetail: async (params?: {
    period_id?: number;
    status_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollRunDetailView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollRunDetailView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/runs-detail`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll runs detail:', error);
      throw error;
    }
  },

  /**
   * 获取薪资条目详细视图
   */
  getPayrollEntriesDetailed: async (params?: {
    period_id?: number;
    employee_id?: number;
    department_id?: number;
    run_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollEntryDetailedView[]> => {
    try {
      const response = await apiClient.get<PayrollEntryDetailedView[]>(
        `${PAYROLL_VIEWS_ENDPOINT}/payroll-entries`,
        { params }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching payroll entries detailed:', error);
      throw error;
    }
  },

  /**
   * 获取薪资组件基础视图
   */
  getPayrollComponentsBasic: async (params?: {
    type?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PayrollComponentBasicView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollComponentBasicView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/components-basic`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll components basic:', error);
      throw error;
    }
  },

  /**
   * 获取薪资组件使用情况视图
   */
  getPayrollComponentsUsage: async (params?: {
    period_id?: number;
    component_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<PayrollComponentUsageView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollComponentUsageView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/components-usage`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll components usage:', error);
      throw error;
    }
  },

  /**
   * 获取薪资汇总分析视图
   */
  getPayrollSummaryAnalysis: async (params?: {
    period_id?: number;
    department_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PayrollSummaryAnalysisView[]> => {
    try {
      const response = await apiClient.get<{ data: PayrollSummaryAnalysisView[] }>(
        `${PAYROLL_VIEWS_ENDPOINT}/summary-analysis`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payroll summary analysis:', error);
      throw error;
    }
  },

  /**
   * 获取员工薪资历史
   */
  getEmployeeSalaryHistory: async (params?: {
    employee_id?: number;
    period_id?: number;
    department_id?: number;
    start_date?: string;
    end_date?: string;
    min_gross_pay?: number;
    max_gross_pay?: number;
    page?: number;
    size?: number;
    order_by?: string;
  }): Promise<PaginatedResponse<EmployeeSalaryHistoryView>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<EmployeeSalaryHistoryView>>(
        `${PAYROLL_V2_ENDPOINT}/employee-salary-history`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching employee salary history:', error);
      throw error;
    }
  },

  /**
   * 获取员工薪资趋势
   */
  getEmployeeSalaryTrend: async (
    employeeId: number,
    limit: number = 12
  ): Promise<EmployeeSalaryTrendData[]> => {
    try {
      const response = await apiClient.get<{ data: EmployeeSalaryTrendData[] }>(
        `${PAYROLL_V2_ENDPOINT}/employee-salary-trend/${employeeId}`,
        { params: { limit } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching employee salary trend:', error);
      throw error;
    }
  },

  /**
   * 获取薪资统计数据
   */
  getSalaryStatistics: async (params?: {
    period_id?: number;
    department_id?: number;
  }): Promise<SalaryStatistics> => {
    try {
      const response = await apiClient.get<{ data: SalaryStatistics }>(
        `${PAYROLL_V2_ENDPOINT}/salary-statistics`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching salary statistics:', error);
      throw error;
    }
  },

  /**
   * 获取核心工资数据 - 用于快捷操作浏览工资数据
   */
  getComprehensivePayrollData: async (params?: {
    period_id?: number;
    employee_id?: number;
    department_name?: string;
    limit?: number;
    offset?: number;
  }): Promise<ComprehensivePayrollDataView[]> => {
    try {
      const response = await apiClient.get<ComprehensivePayrollDataView[]>(
        `${PAYROLL_VIEWS_ENDPOINT}/comprehensive-payroll-data`,
        { params }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching comprehensive payroll data:', error);
      throw error;
    }
  }
};

// 默认导出
export default payrollViewsApi; 