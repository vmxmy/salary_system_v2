// 调试计算逻辑
const testData = {
  "employee_full_name": "汪琳",
  "total_deductions": 6290.58,
  "deductions_details": {
    "SOCIAL_INSURANCE_ADJUSTMENT": { "amount": 9.22, "name": "补扣社保" },
    "PENSION_PERSONAL_AMOUNT": { "amount": 1613.76, "name": "个人缴养老保险费" },
    "MEDICAL_INS_PERSONAL_AMOUNT": { "amount": 403.44, "name": "个人缴医疗保险费" },
    "OCCUPATIONAL_PENSION_PERSONAL_AMOUNT": { "amount": 806.88, "name": "个人缴职业年金" },
    "HOUSING_FUND_PERSONAL": { "amount": 3303.00, "name": "个人缴住房公积金" },
    "PERSONAL_INCOME_TAX": { "amount": 163.50, "name": "个人所得税" }
  }
};

// 模拟前端验证逻辑
function validateDeductions(record) {
  let standardDeductionsSum = 0;
  let adjustmentSum = 0;
  const standardDeductionsBreakdown = [];
  const adjustmentBreakdown = [];
  
  // 定义标准扣发项（五险一金 + 个税）
  const standardDeductionComponents = [
    'PENSION_PERSONAL_AMOUNT',
    'MEDICAL_INS_PERSONAL_AMOUNT', 
    'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT',
    'UNEMPLOYMENT_PERSONAL_AMOUNT',
    'HOUSING_FUND_PERSONAL',
    'PERSONAL_INCOME_TAX'
  ];
  
  Object.entries(record.deductions_details).forEach(([key, item]) => {
    const amount = item.amount;
    
    // 判断是否为标准扣发项
    const isStandardDeduction = standardDeductionComponents.includes(key) ||
                              key.includes('PENSION') ||
                              key.includes('MEDICAL') ||
                              key.includes('UNEMPLOYMENT') ||
                              key.includes('HOUSING_FUND') ||
                              key.includes('PERSONAL_INCOME_TAX') ||
                              key.includes('养老') ||
                              key.includes('医疗') ||
                              key.includes('失业') ||
                              key.includes('公积金') ||
                              key.includes('个人所得税');
    
    if (isStandardDeduction) {
      standardDeductionsSum += amount;
      standardDeductionsBreakdown.push(`${key}: ${amount} (五险一金+个税)`);
    } else {
      adjustmentSum += amount;
      adjustmentBreakdown.push(`${key}: ${amount} (补扣项)`);
    }
  });
  
  console.log('=== 调试计算结果 ===');
  console.log('原始扣发合计:', record.total_deductions);
  console.log('五险一金+个税明细:', standardDeductionsBreakdown);
  console.log('补扣项明细:', adjustmentBreakdown);
  console.log('五险一金+个税总和:', standardDeductionsSum);
  console.log('补扣项总和:', adjustmentSum);
  console.log('差异:', Math.abs(standardDeductionsSum - record.total_deductions));
  console.log('验证结果:', Math.abs(standardDeductionsSum - record.total_deductions) <= 0.01 ? '✅ 通过' : '❌ 失败');
  
  return Math.abs(standardDeductionsSum - record.total_deductions) <= 0.01;
}

// 执行验证
validateDeductions(testData);

// 测试可能的数据格式问题
console.log('\n=== 测试数据格式问题 ===');
const testWithCommas = {
  ...testData,
  total_deductions: "6,290.58", // 带逗号的字符串
  deductions_details: {
    ...testData.deductions_details,
    "PENSION_PERSONAL_AMOUNT": { "amount": "1,613.76", "name": "个人缴养老保险费" }
  }
};

// 数值转换函数
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // 移除逗号和空格
    const cleanValue = value.replace(/[,\s]/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

console.log('原始值:', "1,613.76");
console.log('转换后:', toNumber("1,613.76"));
console.log('原始值:', "6,290.58");
console.log('转换后:', toNumber("6,290.58")); 