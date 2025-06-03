// 测试正则表达式匹配
const REGEX_PATTERNS = {
  // 特殊津贴补贴（需要优先匹配）
  civilStandardAllowance: /^公务员规范性?津贴补贴|规范后津补贴$/,
  positionAllowance: /^岗位职务补贴|职务补贴$/,
  petitionAllowance: /^信访工作.*津贴|信访.*岗位.*津贴$/,
  onlyChildBonus: /^独生子女父母奖励金$/,
  reformAllowance: /^九三年工改保留津补贴|工改保留.*津补贴$/,
  
  // 一般津贴补贴
  allowance: /^(一般|普通)?津贴$/,
  subsidy: /^(一般|普通)?补助$/,
};

// 添加工资字段的正则
const SALARY_PATTERNS = {
  positionTechGradeSalary: /^职务\/技术等级工资|职务技术等级工资$/,
  gradePositionLevelSalary: /^级别\/岗位级别工资|岗位级别工资$/,
  monthlyPerformanceBonus: /^月奖励绩效|月度奖励绩效$/,
  basicSalary: /^基本(工资|薪资|薪酬)$/,
  gradeSalary: /^级别工资$/,
};

// 测试字段
const testFields = [
  "公务员规范性津贴补贴",
  "规范后津补贴", 
  "岗位职务补贴",
  "信访工作人员岗位工作津贴",
  "独生子女父母奖励金",
  "九三年工改保留津补贴",
  "津贴",
  "普通津贴",
  // 新增工资字段测试
  "职务/技术等级工资",
  "级别/岗位级别工资", 
  "月奖励绩效",
  "基本工资",
  "级别工资"
];

console.log("=== 正则表达式匹配测试 ===");

testFields.forEach(field => {
  const fieldLower = field.toLowerCase();
  let matched = false;
  
  // 按优先级测试匹配（特殊工资字段优先）
  if (SALARY_PATTERNS.positionTechGradeSalary.test(fieldLower)) {
    console.log(`✅ "${field}" -> POSITION_TECH_GRADE_SALARY (置信度: 0.95)`);
    matched = true;
  } else if (SALARY_PATTERNS.gradePositionLevelSalary.test(fieldLower)) {
    console.log(`✅ "${field}" -> GRADE_POSITION_LEVEL_SALARY (置信度: 0.95)`);
    matched = true;
  } else if (SALARY_PATTERNS.monthlyPerformanceBonus.test(fieldLower)) {
    console.log(`✅ "${field}" -> MONTHLY_PERFORMANCE_BONUS (置信度: 0.95)`);
    matched = true;
  } else if (SALARY_PATTERNS.basicSalary.test(fieldLower)) {
    console.log(`✅ "${field}" -> BASIC_SALARY (置信度: 0.98)`);
    matched = true;
  } else if (SALARY_PATTERNS.gradeSalary.test(fieldLower)) {
    console.log(`✅ "${field}" -> GRADE_SALARY (置信度: 0.92)`);
    matched = true;
  } else if (REGEX_PATTERNS.civilStandardAllowance.test(fieldLower)) {
    console.log(`✅ "${field}" -> CIVIL_STANDARD_ALLOWANCE (置信度: 0.98)`);
    matched = true;
  } else if (REGEX_PATTERNS.positionAllowance.test(fieldLower)) {
    console.log(`✅ "${field}" -> POSITION_ALLOWANCE (置信度: 0.95)`);
    matched = true;
  } else if (REGEX_PATTERNS.petitionAllowance.test(fieldLower)) {
    console.log(`✅ "${field}" -> PETITION_ALLOWANCE (置信度: 0.98)`);
    matched = true;
  } else if (REGEX_PATTERNS.onlyChildBonus.test(fieldLower)) {
    console.log(`✅ "${field}" -> ONLY_CHILD_PARENT_BONUS (置信度: 0.98)`);
    matched = true;
  } else if (REGEX_PATTERNS.reformAllowance.test(fieldLower)) {
    console.log(`✅ "${field}" -> REFORM_ALLOWANCE_1993 (置信度: 0.95)`);
    matched = true;
  } else if (REGEX_PATTERNS.allowance.test(fieldLower)) {
    console.log(`⚠️ "${field}" -> GENERAL_ALLOWANCE (置信度: 0.82)`);
    matched = true;
  }
  
  if (!matched) {
    console.log(`❌ "${field}" -> 未匹配`);
  }
}); 