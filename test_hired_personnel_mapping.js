// 聘用人员工资字段映射测试脚本
// 用于验证批量导入功能是否能正确处理聘用人员的表格数据

const hiredPersonnelTestData = {
  // 聘用人员工资明细表头
  headers: [
    '序号', '人员编号', '人员姓名', '身份证', '部门', '人员身份', '人员职级',
    '工资统发', '财政供养', '应发工资', '实发工资', '扣发合计',
    '基本工资', '岗位工资', '绩效工资', '补助', '信访岗位津贴', '基础绩效',
    '津贴', '季度绩效考核薪酬', '固定薪酬全年应发数', '补扣社保',
    '一次性补扣发', '绩效奖金补扣发', '奖励绩效补扣发',
    '个人缴养老保险费', '个人缴医疗保险费', '个人缴失业保险费',
    '个人缴住房公积金', '补扣（退）款', '补扣2022年医保款', '个人所得税'
  ],
  
  // 测试数据行
  sampleRow: [
    '1', 'HP001', '张三', '123456789012345678', '办公室', '聘用人员', '初级',
    '是', '否', '8500.00', '7200.00', '1300.00',
    '3000.00', '2000.00', '1500.00', '500.00', '200.00', '800.00',
    '300.00', '1000.00', '36000.00', '150.00',
    '0.00', '0.00', '0.00',
    '240.00', '60.00', '8.50', '340.00', '0.00', '0.00', '501.50'
  ],
  
  // 期望的映射结果
  expectedMapping: {
    // 基础信息字段
    'employee_code': 'HP001',
    'employee_full_name': '张三',
    'id_number': '123456789012345678',
    'gross_pay': 8500.00,
    'net_pay': 7200.00,
    'total_deductions': 1300.00,
    
    // 收入项详情
    'earnings_details': {
      'BASIC_SALARY': { amount: 3000.00, name: '基本工资' },
      'POSITION_SALARY_GENERAL': { amount: 2000.00, name: '岗位工资' },
      'PERFORMANCE_SALARY': { amount: 1500.00, name: '绩效工资' },
      'ALLOWANCE_GENERAL': { amount: 500.00, name: '补助' },
      'PETITION_ALLOWANCE': { amount: 200.00, name: '信访岗位津贴' },
      'BASIC_PERFORMANCE': { amount: 800.00, name: '基础绩效' },
      'GENERAL_ALLOWANCE': { amount: 300.00, name: '津贴' },
      'QUARTERLY_PERFORMANCE_ASSESSMENT': { amount: 1000.00, name: '季度绩效考核薪酬' },
      'ANNUAL_FIXED_SALARY_TOTAL': { amount: 36000.00, name: '固定薪酬全年应发数' }
    },
    
    // 扣除项详情
    'deductions_details': {
      'SOCIAL_INSURANCE_ADJUSTMENT': { amount: 150.00, name: '补扣社保' },
      'ONE_TIME_DEDUCTION_ADJUSTMENT': { amount: 0.00, name: '一次性补扣发' },
      'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT': { amount: 0.00, name: '绩效奖金补扣发' },
      'REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT': { amount: 0.00, name: '奖励绩效补扣发' },
      'PENSION_PERSONAL_AMOUNT': { amount: 240.00, name: '个人缴养老保险费' },
      'MEDICAL_INS_PERSONAL_AMOUNT': { amount: 60.00, name: '个人缴医疗保险费' },
      'UNEMPLOYMENT_PERSONAL_AMOUNT': { amount: 8.50, name: '个人缴失业保险费' },
      'HOUSING_FUND_PERSONAL': { amount: 340.00, name: '个人缴住房公积金' },
      'REFUND_DEDUCTION_ADJUSTMENT': { amount: 0.00, name: '补扣（退）款' },
      'MEDICAL_2022_DEDUCTION_ADJUSTMENT': { amount: 0.00, name: '补扣2022年医保款' },
      'PERSONAL_INCOME_TAX': { amount: 501.50, name: '个人所得税' }
    }
  }
};

// 字段映射规则（从前端代码中提取）
const fieldMappingRules = {
  // 基础字段
  '人员编号': 'employee_code',
  '人员姓名': 'employee_full_name',
  '身份证': 'id_number',
  '应发工资': 'gross_pay',
  '实发工资': 'net_pay',
  '扣发合计': 'total_deductions',
  
  // 收入项
  '基本工资': 'earnings_details.BASIC_SALARY.amount',
  '岗位工资': 'earnings_details.POSITION_SALARY_GENERAL.amount',
  '绩效工资': 'earnings_details.PERFORMANCE_SALARY.amount',
  '补助': 'earnings_details.ALLOWANCE_GENERAL.amount',
  '信访岗位津贴': 'earnings_details.PETITION_ALLOWANCE.amount',
  '基础绩效': 'earnings_details.BASIC_PERFORMANCE.amount',
  '津贴': 'earnings_details.GENERAL_ALLOWANCE.amount',
  '季度绩效考核薪酬': 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount',
  '固定薪酬全年应发数': 'earnings_details.ANNUAL_FIXED_SALARY_TOTAL.amount',
  
  // 扣除项
  '补扣社保': 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount',
  '一次性补扣发': 'deductions_details.ONE_TIME_DEDUCTION_ADJUSTMENT.amount',
  '绩效奖金补扣发': 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount',
  '奖励绩效补扣发': 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount',
  '个人缴养老保险费': 'deductions_details.PENSION_PERSONAL_AMOUNT.amount',
  '个人缴医疗保险费': 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount',
  '个人缴失业保险费': 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount',
  '个人缴住房公积金': 'deductions_details.HOUSING_FUND_PERSONAL.amount',
  '补扣（退）款': 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount',
  '补扣2022年医保款': 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount',
  '个人所得税': 'deductions_details.PERSONAL_INCOME_TAX.amount',
  
  // 忽略的标识字段
  '序号': '',
  '部门': '',
  '人员身份': '',
  '人员职级': '',
  '工资统发': '',
  '财政供养': ''
};

// 测试函数：模拟表格数据转换
function testHiredPersonnelMapping() {
  console.log('🧪 开始测试聘用人员字段映射...\n');
  
  const { headers, sampleRow } = hiredPersonnelTestData;
  const result = {
    earnings_details: {},
    deductions_details: {}
  };
  
  // 模拟字段映射过程
  headers.forEach((header, index) => {
    const value = sampleRow[index];
    const mappingPath = fieldMappingRules[header];
    
    if (!mappingPath) {
      console.log(`⚠️  未找到字段映射: ${header} = ${value}`);
      return;
    }
    
    if (mappingPath === '') {
      console.log(`🚫 忽略字段: ${header} = ${value}`);
      return;
    }
    
    // 处理嵌套字段
    if (mappingPath.includes('.')) {
      const [category, itemType, property] = mappingPath.split('.');
      
      if (!result[category]) {
        result[category] = {};
      }
      
      if (!result[category][itemType]) {
        result[category][itemType] = {};
      }
      
      // 转换数值
      const numValue = parseFloat(value) || 0;
      result[category][itemType][property] = numValue;
      result[category][itemType].name = header;
      
      console.log(`✅ 映射成功: ${header} -> ${mappingPath} = ${numValue}`);
    } else {
      // 处理普通字段
      const numValue = ['gross_pay', 'net_pay', 'total_deductions'].includes(mappingPath) 
        ? parseFloat(value) || 0 
        : value;
      result[mappingPath] = numValue;
      
      console.log(`✅ 映射成功: ${header} -> ${mappingPath} = ${numValue}`);
    }
  });
  
  console.log('\n📊 映射结果:');
  console.log(JSON.stringify(result, null, 2));
  
  // 验证关键字段
  console.log('\n🔍 验证关键字段:');
  console.log(`员工姓名: ${result.employee_full_name}`);
  console.log(`应发工资: ${result.gross_pay}`);
  console.log(`实发工资: ${result.net_pay}`);
  console.log(`基本工资: ${result.earnings_details.BASIC_SALARY?.amount}`);
  console.log(`绩效工资: ${result.earnings_details.PERFORMANCE_SALARY?.amount}`);
  console.log(`个人所得税: ${result.deductions_details.PERSONAL_INCOME_TAX?.amount}`);
  
  console.log('\n✅ 聘用人员字段映射测试完成！');
  return result;
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testHiredPersonnelMapping, hiredPersonnelTestData, fieldMappingRules };
} else {
  // 在浏览器中运行
  testHiredPersonnelMapping();
} 