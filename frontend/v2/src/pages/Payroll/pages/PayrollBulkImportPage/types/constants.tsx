import React from 'react';
import {
  CloudUploadOutlined,
  SettingOutlined,
  EyeOutlined,
  RocketOutlined
} from '@ant-design/icons';
import type { StepConfig } from './index';

// 步骤配置
export const STEPS_CONFIG: StepConfig[] = [
  {
    title: '数据准备',
    description: '上传或输入薪资数据',
    icon: <CloudUploadOutlined />,
    content: 'upload'
  },
  {
    title: '智能映射',
    description: '自动匹配字段映射',
    icon: <SettingOutlined />,
    content: 'mapping'
  },
  {
    title: '数据预览',
    description: '预览和验证数据',
    icon: <EyeOutlined />,
    content: 'preview'
  },
  {
    title: '执行导入',
    description: '完成数据导入',
    icon: <RocketOutlined />,
    content: 'execute'
  }
];

// 字段名称映射配置
export const FIELD_DISPLAY_NAME_MAP: Record<string, string> = {
  // 基础字段
  'employee_full_name': '员工姓名',
  'employee_code': '员工工号', 
  'department': '部门',
  'id_number': '身份证号码',
  'employee_category': '人员身份',
  'job_level': '人员职级',
  
  // 收入字段
  'earnings_details.BASIC_SALARY.amount': '基本工资',
  'earnings_details.POSITION_SALARY_GENERAL.amount': '岗位工资',
  'earnings_details.GRADE_SALARY.amount': '级别工资',
  'earnings_details.SALARY_GRADE.amount': '薪级工资',
  'earnings_details.PERFORMANCE_SALARY.amount': '绩效工资',
  'earnings_details.PERFORMANCE_BONUS.amount': '奖励性绩效工资',
  'earnings_details.BASIC_PERFORMANCE_SALARY.amount': '基础性绩效工资',
  'earnings_details.BASIC_PERFORMANCE.amount': '基础绩效',
  'earnings_details.BASIC_PERFORMANCE_AWARD.amount': '基础绩效奖',
  'earnings_details.GENERAL_ALLOWANCE.amount': '津贴',
  'earnings_details.ALLOWANCE_GENERAL.amount': '补助',
  'earnings_details.TRAFFIC_ALLOWANCE.amount': '公务交通补贴',
  'earnings_details.TOWNSHIP_ALLOWANCE.amount': '乡镇工作补贴',
  'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount': '公务员规范后津补贴',
  'earnings_details.POSITION_ALLOWANCE.amount': '岗位职务补贴',
  'earnings_details.PETITION_ALLOWANCE.amount': '信访工作人员岗位工作津贴',
  'earnings_details.ONLY_CHILD_PARENT_BONUS.amount': '独生子女父母奖励金',
  'earnings_details.REFORM_ALLOWANCE_1993.amount': '九三年工改保留津补贴',
  'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount': '季度绩效考核薪酬',
  'earnings_details.PROBATION_SALARY.amount': '试用期工资',
  'earnings_details.BACK_PAY.amount': '补发工资',
  'earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount': '奖励绩效补发',
  'earnings_details.POSITION_TECH_GRADE_SALARY.amount': '职务/技术等级工资',
  'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount': '级别/岗位级别工资',
  'earnings_details.MONTHLY_PERFORMANCE_BONUS.amount': '月奖励绩效',
  'earnings_details.STAFF_SALARY_GRADE.amount': '事业单位人员薪级工资',

  // 个人扣除字段
  'deductions_details.PERSONAL_INCOME_TAX.amount': '个人所得税',
  'deductions_details.HOUSING_FUND_PERSONAL.amount': '个人缴住房公积金',
  'deductions_details.PENSION_PERSONAL_AMOUNT.amount': '养老保险个人应缴金额',
  'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount': '医疗保险个人缴纳金额',
  'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount': '失业个人应缴金额',
  'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount': '职业年金个人应缴费额',
  'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount': '补扣（退）款',
  'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount': '补扣社保',
  'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount': '补扣2022年医保款',
  'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount': '绩效奖金补扣发',
  'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount': '奖励绩效补扣发',
  'deductions_details.ONE_TIME_ADJUSTMENT.amount': '一次性补扣发',

  // 单位缴费字段
  'employer_deductions.HOUSING_FUND_EMPLOYER.amount': '单位缴住房公积金',
  'employer_deductions.PENSION_EMPLOYER_AMOUNT.amount': '养老保险单位应缴金额',
  'employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount': '医疗保险单位缴纳金额',
  'employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount': '失业单位应缴金额',
  'employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount': '职业年金单位应缴费额',
  'employer_deductions.INJURY_EMPLOYER_AMOUNT.amount': '工伤单位应缴金额',
  'employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount': '大病医疗单位缴纳',

  // 计算结果字段
  'calculation_results.TAXABLE_INCOME.amount': '应纳税所得额',
  'calculation_results.TAX_DEDUCTION_AMOUNT.amount': '扣除额',
  'calculation_results.TAX_EXEMPT_AMOUNT.amount': '免税额',
  'calculation_results.QUICK_DEDUCTION.amount': '速算扣除数',
  'calculation_results.AFTER_TAX_SALARY.amount': '税后工资',

  // 统计字段
  'stats.ANNUAL_FIXED_SALARY_TOTAL.amount': '固定薪酬全年应发数',
  'stats.QUARTERLY_PERFORMANCE_Q1.amount': '1季度绩效考核薪酬',

  // 其他字段
  'other_fields.UNIFIED_PAYROLL_FLAG': '工资统发标记',
  'other_fields.FISCAL_SUPPORT_FLAG': '财政供养标记',

  // 特殊字段
  '__CALCULATED_FIELD__': '【计算字段】由系统自动计算',
  '__SOCIAL_INSURANCE_GROUP__': '【社保组合】建议拆分为具体险种', 
  '__IGNORE_FIELD__': '【忽略】不导入此字段',
  '__ROW_NUMBER__': '【行号】用于标识记录序号'
};

// 文件类型配置
export const VALID_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv' // .csv
];

// 默认导入设置
export const DEFAULT_IMPORT_SETTINGS = {
  skipInvalidRecords: true,
  overwriteExisting: false,
  sendNotification: true
};

// 字段类型配置
export const FIELD_TYPE_CONFIG = {
  base: { color: 'blue', text: '基础' },
  earning: { color: 'green', text: '收入' },
  deduction: { color: 'orange', text: '扣除' },
  calculated: { color: 'purple', text: '计算' },
  ignore: { color: 'default', text: '忽略' },
  stat: { color: '#1890ff', text: '统计' },
  other: { color: '#fa8c16', text: '其他' }
} as const; 