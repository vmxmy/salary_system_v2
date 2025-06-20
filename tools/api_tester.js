// API 测试工具

// 配置选项
const API_BASE_URL = 'http://localhost:8080/v2';

// 测试人员身份分类统计 API
async function testPersonnelCategoryStats(periodId) {
  try {
    console.log(`正在测试 personnel-category-stats API，期间ID: ${periodId}`);
    const response = await fetch(`${API_BASE_URL}/simple-payroll/personnel-category-stats?period_id=${periodId}`);
    const data = await response.json();
    
    console.log('API 响应状态:', response.status);
    console.log('API 响应数据:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data && data.data.categories) {
      console.log(`分类数量: ${data.data.categories.length}`);
      data.data.categories.forEach((cat, i) => {
        console.log(`分类 ${i+1}: ${cat.personnel_category}, 人数: ${cat.employee_count}, 实发总额: ${cat.net_pay_total}`);
      });
    } else {
      console.log('API 返回没有分类数据');
    }
  } catch (error) {
    console.error('API 调用失败:', error);
  }
}

// 测试获取期间列表 API
async function testPayrollPeriods() {
  try {
    console.log('正在测试 periods API');
    const response = await fetch(`${API_BASE_URL}/simple-payroll/periods`);
    const data = await response.json();
    
    console.log('API 响应状态:', response.status);
    
    if (data.data && data.data.length > 0) {
      console.log(`期间数量: ${data.data.length}`);
      data.data.forEach((period, i) => {
        console.log(`期间 ${i+1}: ID=${period.id}, 名称=${period.name}, 活跃=${period.is_active}`);
      });
    } else {
      console.log('API 返回没有期间数据');
    }
  } catch (error) {
    console.error('API 调用失败:', error);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0] || 'help';

// 运行测试
async function runTests() {
  switch (command) {
    case 'personnel-stats':
      const periodId = args[1] || '87'; // 默认使用期间ID 87
      await testPersonnelCategoryStats(periodId);
      break;
    case 'periods':
      await testPayrollPeriods();
      break;
    case 'help':
    default:
      console.log(`
使用说明:
  node api_tester.js personnel-stats [期间ID]  - 测试人员身份分类统计API
  node api_tester.js periods                  - 测试获取期间列表API
  node api_tester.js help                     - 显示帮助信息
`);
      break;
  }
}

runTests(); 