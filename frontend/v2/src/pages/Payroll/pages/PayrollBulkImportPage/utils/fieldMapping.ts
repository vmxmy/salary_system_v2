import type { MappingRule } from '../types/index';
import { FIELD_DISPLAY_NAME_MAP } from '../types/constants';

// 字段显示名称获取函数
export const getFieldDisplayName = (fieldCode: string): string => {
  return FIELD_DISPLAY_NAME_MAP[fieldCode] || fieldCode;
};

// 正则表达式匹配规则
const REGEX_PATTERNS = {
  // 基础字段正则
  employeeName: /^(员工|人员)?(姓名|名字)$/,
  employeeCode: /^(员工|人员)?(工号|编号|代码|ID)$/,
  department: /^(部门|科室|单位)$/,
  idNumber: /^(身份证|证件)(号码?|号)?$/,
  rowNumber: /^(序号|行号|编号)$/,
  
  // 收入字段正则
  basicSalary: /^基本(工资|薪资|薪酬)$/,
  positionSalary: /^岗位(工资|薪资)$/,
  gradeSalary: /^级别工资$/,
  salaryGrade: /^薪级工资$/,
  performanceSalary: /^绩效工资$/,
  performanceBonus: /^(奖励性?)?绩效(奖金?|工资)$/,
  // 特殊津贴补贴（需要优先匹配）
  civilStandardAllowance: /^公务员规范性?津贴补贴|规范后津补贴$/,
  positionAllowance: /^岗位职务补贴|职务补贴$/,
  petitionAllowance: /^信访工作.*津贴|信访.*岗位.*津贴$/,
  onlyChildBonus: /^独生子女父母奖励金$/,
  reformAllowance: /^九三年工改保留津补贴|工改保留.*津补贴$/,
  
  // 一般津贴补贴
  allowance: /^(一般|普通)?津贴$/,
  subsidy: /^(一般|普通)?补助$/,
  trafficAllowance: /^(公务)?交通(补贴|津贴)$/,
  townshipAllowance: /^乡镇(工作)?补贴$/,
  positionTechGradeSalary: /^职务\/技术等级工资|职务技术等级工资$/,
  gradePositionLevelSalary: /^级别\/岗位级别工资|岗位级别工资$/,
  monthlyPerformanceBonus: /^月奖励绩效|月度奖励绩效$/,
  
  // 扣除字段正则
  personalTax: /^个人所得税|个税$/,
  housingFund: /^(个人缴?)?住房公积金$/,
  pension: /^(个人缴?)?养老保险$/,
  medical: /^(个人缴?)?医疗保险|医保$/,
  unemployment: /^(个人缴?)?失业保险$/,
  
  // 计算字段正则
  grossPay: /^(应发|总收入|合计收入)(工资|薪资)?$/,
  netPay: /^(实发|净收入|到手)(工资|薪资)?$/,
  totalDeductions: /^(扣发|扣除|总扣除)合计$/
};

// 智能字段映射生成器（支持正则表达式）
export const generateSmartMapping = (headers: string[]): MappingRule[] => {
  return headers.map((header: string) => {
    const fieldLower = header.toLowerCase().trim();
    
    // 使用正则表达式进行精确匹配
    
    // 基础字段映射
    if (REGEX_PATTERNS.employeeName.test(fieldLower)) {
      return { sourceField: header, targetField: 'employee_full_name', confidence: 0.98, category: 'base', required: true };
    }
    if (REGEX_PATTERNS.employeeCode.test(fieldLower)) {
      return { sourceField: header, targetField: 'employee_code', confidence: 0.95, category: 'base', required: false };
    }
    if (REGEX_PATTERNS.department.test(fieldLower)) {
      return { sourceField: header, targetField: 'department', confidence: 0.92, category: 'base', required: false };
    }
    if (REGEX_PATTERNS.idNumber.test(fieldLower)) {
      return { sourceField: header, targetField: 'id_number', confidence: 0.90, category: 'base', required: false };
    }
    if (REGEX_PATTERNS.rowNumber.test(fieldLower)) {
      return { sourceField: header, targetField: '__ROW_NUMBER__', confidence: 0.85, category: 'ignore', required: false };
    }
    
    // 收入字段映射（使用正则表达式）
    if (REGEX_PATTERNS.basicSalary.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.BASIC_SALARY.amount', confidence: 0.98, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.positionSalary.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.POSITION_SALARY_GENERAL.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.gradeSalary.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.GRADE_SALARY.amount', confidence: 0.92, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.salaryGrade.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.SALARY_GRADE.amount', confidence: 0.90, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.performanceSalary.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.performanceBonus.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.85, category: 'earning', required: false };
    }
    
    // 特殊工资字段（优先匹配，避免被基础工资字段匹配）
    if (REGEX_PATTERNS.positionTechGradeSalary.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.gradePositionLevelSalary.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.monthlyPerformanceBonus.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.MONTHLY_PERFORMANCE_BONUS.amount', confidence: 0.95, category: 'earning', required: false };
    }
    
    // 特殊津贴补贴（优先匹配，避免被一般津贴匹配）
    if (REGEX_PATTERNS.civilStandardAllowance.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount', confidence: 0.98, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.positionAllowance.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.POSITION_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.petitionAllowance.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.PETITION_ALLOWANCE.amount', confidence: 0.98, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.onlyChildBonus.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount', confidence: 0.98, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.reformAllowance.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.REFORM_ALLOWANCE_1993.amount', confidence: 0.95, category: 'earning', required: false };
    }
    
    // 一般津贴补贴
    if (REGEX_PATTERNS.trafficAllowance.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.TRAFFIC_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (REGEX_PATTERNS.townshipAllowance.test(fieldLower)) {
      return { sourceField: header, targetField: 'earnings_details.TOWNSHIP_ALLOWANCE.amount', confidence: 0.92, category: 'earning', required: false };
    }
    
    // 扣除字段映射（使用正则表达式）
    if (REGEX_PATTERNS.personalTax.test(fieldLower)) {
      return { sourceField: header, targetField: 'deductions_details.PERSONAL_INCOME_TAX.amount', confidence: 0.98, category: 'deduction', required: false };
    }
    if (REGEX_PATTERNS.housingFund.test(fieldLower)) {
      return { sourceField: header, targetField: 'deductions_details.HOUSING_FUND_PERSONAL.amount', confidence: 0.95, category: 'deduction', required: false };
    }
    if (REGEX_PATTERNS.pension.test(fieldLower)) {
      return { sourceField: header, targetField: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
    }
    if (REGEX_PATTERNS.medical.test(fieldLower)) {
      return { sourceField: header, targetField: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
    }
    if (REGEX_PATTERNS.unemployment.test(fieldLower)) {
      return { sourceField: header, targetField: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount', confidence: 0.88, category: 'deduction', required: false };
    }
    
    // 计算结果字段（使用正则表达式）
    if (REGEX_PATTERNS.grossPay.test(fieldLower)) {
      return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.85, category: 'calculated', required: false };
    }
    if (REGEX_PATTERNS.netPay.test(fieldLower)) {
      return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.85, category: 'calculated', required: false };
    }
    if (REGEX_PATTERNS.totalDeductions.test(fieldLower)) {
      return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.80, category: 'calculated', required: false };
    }
    
    // 回退到原有的包含匹配逻辑（兼容性保证）
    if (fieldLower.includes('部门')) {
      return { sourceField: header, targetField: 'department', confidence: 0.85, category: 'base', required: false };
    }
    if (fieldLower.includes('身份证')) {
      return { sourceField: header, targetField: 'id_number', confidence: 0.88, category: 'base', required: false };
    }
    if (fieldLower.includes('序号')) {
      return { sourceField: header, targetField: '__ROW_NUMBER__', confidence: 0.70, category: 'ignore', required: false };
    }
    
    // 收入字段映射 (基于真实数据库组件)
    if (fieldLower.includes('基本工资') || fieldLower === '基本薪资') {
      return { sourceField: header, targetField: 'earnings_details.BASIC_SALARY.amount', confidence: 0.98, category: 'earning', required: false };
    }
    if (fieldLower.includes('岗位工资')) {
      return { sourceField: header, targetField: 'earnings_details.POSITION_SALARY_GENERAL.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (fieldLower.includes('级别工资')) {
      return { sourceField: header, targetField: 'earnings_details.GRADE_SALARY.amount', confidence: 0.92, category: 'earning', required: false };
    }
    if (fieldLower.includes('薪级工资')) {
      return { sourceField: header, targetField: 'earnings_details.SALARY_GRADE.amount', confidence: 0.90, category: 'earning', required: false };
    }
    if (fieldLower.includes('绩效工资') && !fieldLower.includes('基础')) {
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
    }
    if (fieldLower.includes('奖金') || fieldLower.includes('绩效奖')) {
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.85, category: 'earning', required: false };
    }
    if (fieldLower.includes('津贴') && !fieldLower.includes('信访') && !fieldLower.includes('岗位')) {
      return { sourceField: header, targetField: 'earnings_details.GENERAL_ALLOWANCE.amount', confidence: 0.82, category: 'earning', required: false };
    }
    if (fieldLower.includes('补助')) {
      return { sourceField: header, targetField: 'earnings_details.ALLOWANCE_GENERAL.amount', confidence: 0.80, category: 'earning', required: false };
    }
    if (fieldLower.includes('交通补贴') || fieldLower.includes('公务交通')) {
      return { sourceField: header, targetField: 'earnings_details.TRAFFIC_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (fieldLower.includes('乡镇补贴') || fieldLower.includes('乡镇工作补贴')) {
      return { sourceField: header, targetField: 'earnings_details.TOWNSHIP_ALLOWANCE.amount', confidence: 0.92, category: 'earning', required: false };
    }
    if (fieldLower.includes('基础绩效工资') || fieldLower.includes('基础性绩效')) {
      return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
    }
    if (fieldLower.includes('基础绩效奖')) {
      return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount', confidence: 0.88, category: 'earning', required: false };
    }
    if (fieldLower.includes('基础绩效') && !fieldLower.includes('工资') && !fieldLower.includes('奖')) {
      return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE.amount', confidence: 0.86, category: 'earning', required: false };
    }
    if (fieldLower.includes('奖励性绩效工资')) {
      return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (fieldLower.includes('独生子女') || fieldLower.includes('父母奖励金')) {
      return { sourceField: header, targetField: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount', confidence: 0.93, category: 'earning', required: false };
    }
    if (fieldLower.includes('公务员规范性津贴补贴') || fieldLower.includes('规范后津补贴')) {
      return { sourceField: header, targetField: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount', confidence: 0.90, category: 'earning', required: false };
    }
    if (fieldLower.includes('岗位职务补贴') || fieldLower.includes('职务补贴')) {
      return { sourceField: header, targetField: 'earnings_details.POSITION_ALLOWANCE.amount', confidence: 0.88, category: 'earning', required: false };
    }
    if (fieldLower.includes('信访工作') || fieldLower.includes('信访津贴') || fieldLower.includes('信访岗位津贴')) {
      return { sourceField: header, targetField: 'earnings_details.PETITION_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (fieldLower.includes('季度绩效') || fieldLower.includes('季度考核') || fieldLower.includes('季度绩效考核薪酬')) {
      return { sourceField: header, targetField: 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount', confidence: 0.95, category: 'earning', required: false };
    }
    if (fieldLower.includes('试用期工资')) {
      return { sourceField: header, targetField: 'earnings_details.PROBATION_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
    }
    if (fieldLower.includes('补发工资') || fieldLower.includes('工资补发')) {
      return { sourceField: header, targetField: 'earnings_details.BACK_PAY.amount', confidence: 0.88, category: 'earning', required: false };
    }
    if (fieldLower.includes('职务等级工资') || fieldLower.includes('技术等级工资') || fieldLower.includes('职务/技术等级')) {
      return { sourceField: header, targetField: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount', confidence: 0.86, category: 'earning', required: false };
    }
    if (fieldLower.includes('级别/岗位级别') || fieldLower.includes('岗位级别工资')) {
      return { sourceField: header, targetField: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
    }
    if (fieldLower.includes('月奖励绩效') || fieldLower.includes('月度奖励绩效')) {
      return { sourceField: header, targetField: 'earnings_details.MONTHLY_PERFORMANCE_BONUS.amount', confidence: 0.90, category: 'earning', required: false };
    }
    if (fieldLower.includes('工改保留') || fieldLower.includes('九三年')) {
      return { sourceField: header, targetField: 'earnings_details.REFORM_ALLOWANCE_1993.amount', confidence: 0.84, category: 'earning', required: false };
    }
    if (fieldLower.includes('事业单位') && fieldLower.includes('薪级')) {
      return { sourceField: header, targetField: 'earnings_details.STAFF_SALARY_GRADE.amount', confidence: 0.82, category: 'earning', required: false };
    }
    
    // 扣除字段映射 (基于真实数据库组件)
    if (fieldLower.includes('个人所得税') || fieldLower.includes('个税')) {
      return { sourceField: header, targetField: 'deductions_details.PERSONAL_INCOME_TAX.amount', confidence: 0.95, category: 'deduction', required: false };
    }
    if (fieldLower.includes('住房公积金') || (fieldLower.includes('公积金') && fieldLower.includes('个人'))) {
      return { sourceField: header, targetField: 'deductions_details.HOUSING_FUND_PERSONAL.amount', confidence: 0.90, category: 'deduction', required: false };
    }
    if (fieldLower.includes('养老保险') || (fieldLower.includes('养老') && fieldLower.includes('个人'))) {
      return { sourceField: header, targetField: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
    }
    if (fieldLower.includes('医疗保险') || (fieldLower.includes('医保') && fieldLower.includes('个人'))) {
      return { sourceField: header, targetField: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
    }
    if (fieldLower.includes('失业保险') || (fieldLower.includes('失业') && fieldLower.includes('个人'))) {
      return { sourceField: header, targetField: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount', confidence: 0.88, category: 'deduction', required: false };
    }
    if (fieldLower.includes('职业年金')) {
      return { sourceField: header, targetField: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
    }
    if (fieldLower.includes('补扣') && (fieldLower.includes('社保') || fieldLower.includes('保险'))) {
      return { sourceField: header, targetField: 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
    }
    if (fieldLower.includes('2022') && fieldLower.includes('医保')) {
      return { sourceField: header, targetField: 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount', confidence: 0.88, category: 'deduction', required: false };
    }
    if (fieldLower.includes('绩效奖金') && fieldLower.includes('补扣')) {
      return { sourceField: header, targetField: 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount', confidence: 0.86, category: 'deduction', required: false };
    }
    if (fieldLower.includes('奖励绩效') && fieldLower.includes('补扣')) {
      return { sourceField: header, targetField: 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount', confidence: 0.84, category: 'deduction', required: false };
    }
    if (fieldLower.includes('一次性') && fieldLower.includes('补扣')) {
      return { sourceField: header, targetField: 'deductions_details.ONE_TIME_ADJUSTMENT.amount', confidence: 0.82, category: 'deduction', required: false };
    }
    if (fieldLower.includes('补扣') && (fieldLower.includes('退') || fieldLower.includes('款'))) {
      return { sourceField: header, targetField: 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
    }
    
    // 计算结果字段识别
    if (fieldLower.includes('应发') || fieldLower.includes('总收入') || fieldLower.includes('合计收入') || fieldLower.includes('应发工资')) {
      return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
    }
    if (fieldLower.includes('实发') || fieldLower.includes('净收入') || fieldLower.includes('到手') || fieldLower.includes('实发工资')) {
      return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
    }
    if (fieldLower.includes('扣发合计') || fieldLower.includes('扣除合计') || fieldLower.includes('总扣除')) {
      return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
    }
    
    // 统计和标识字段
    if (fieldLower.includes('固定薪酬全年应发数') || fieldLower.includes('年度固定薪酬')) {
      return { sourceField: header, targetField: 'stats.ANNUAL_FIXED_SALARY_TOTAL.amount', confidence: 0.95, category: 'stat', required: false };
    }
    if (fieldLower.includes('工资统发')) {
      return { sourceField: header, targetField: 'other_fields.UNIFIED_PAYROLL_FLAG', confidence: 0.90, category: 'other', required: false };
    }
    if (fieldLower.includes('财政供养')) {
      return { sourceField: header, targetField: 'other_fields.FISCAL_SUPPORT_FLAG', confidence: 0.90, category: 'other', required: false };
    }
    if (fieldLower.includes('人员身份') || fieldLower.includes('员工身份')) {
      return { sourceField: header, targetField: 'employee_category', confidence: 0.85, category: 'base', required: false };
    }
    if (fieldLower.includes('人员职级') || fieldLower.includes('职级')) {
      return { sourceField: header, targetField: 'job_level', confidence: 0.85, category: 'base', required: false };
    }
    
    // 社保组合处理
    if (fieldLower.includes('社保') && !fieldLower.includes('个人') && !fieldLower.includes('补扣')) {
      return { sourceField: header, targetField: '__SOCIAL_INSURANCE_GROUP__', confidence: 0.60, category: 'ignore', required: false };
    }
    
    // 默认处理 - 确保不丢弃任何字段
    const category = fieldLower.includes('工资') || fieldLower.includes('薪') || fieldLower.includes('奖') || fieldLower.includes('津贴') || fieldLower.includes('补助') ? 'earning' : 
                    fieldLower.includes('税') || fieldLower.includes('扣') || fieldLower.includes('保险') || fieldLower.includes('公积金') ? 'deduction' : 
                    fieldLower.includes('应发') || fieldLower.includes('实发') || fieldLower.includes('合计') ? 'calculated' :
                    'base';
    
    return {
      sourceField: header,
      targetField: category === 'earning' ? `earnings_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
                  category === 'deduction' ? `deductions_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
                  category === 'calculated' ? '__CALCULATED_FIELD__' :
                  `__UNMAPPED_${header.toUpperCase().replace(/[^\w]/g, '_')}__`,
      confidence: 0.40,
      category,
      required: false
    };
  });
}; 