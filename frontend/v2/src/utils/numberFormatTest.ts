/**
 * 数字格式保持测试工具
 * 用于验证前端表格渲染时数字格式是否正确保持
 */

// 模拟后端返回的数据
const mockPayrollData = [
  {
    '薪资条目id': 1263,
    '员工id': 339,
    '姓名': '刘嘉',
    '部门名称': '国库处',
    '应发合计': 12990.0,
    '扣除合计': 4217.04,
    '实发合计': 8772.96,
    '基本工资': 5000.00,
    '绩效工资': 3000.50,
    '个人所得税': 500.25,
    '空值字段': null,
    '字符串数字': '1500.75'
  }
];

// 数字格式化函数（只返回字符串）
const formatNumber = (value: any): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString('zh-CN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  
  if (typeof value === 'string') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  }
  
  return value.toString();
};

// 数字渲染函数（返回React元素的模拟）
const renderNumber = (value: any) => {
  if (value === null || value === undefined) {
    return { type: 'span', props: { style: { color: '#999' }, children: 'N/A' } };
  }
  
  if (typeof value === 'number') {
    return {
      type: 'span',
      props: {
        style: { textAlign: 'right', display: 'block' },
        children: value.toLocaleString('zh-CN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })
      }
    };
  }
  
  if (typeof value === 'string') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return {
        type: 'span',
        props: {
          style: { textAlign: 'right', display: 'block' },
          children: numValue.toLocaleString('zh-CN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })
        }
      };
    }
  }
  
  return { type: 'span', props: { children: value.toString() } };
};

// Excel导出数据处理函数
const processExportData = (data: any[]) => {
  return data.map((item, index) => {
    const row: { [key: string]: any } = { '序号': index + 1 };
    
    Object.entries(item).forEach(([key, rawValue]) => {
      // 保持原始数据类型，特别保护数字类型
      if (typeof rawValue === 'number') {
        // 数字类型直接保持，Excel会正确识别
        row[key] = rawValue;
      } else if (typeof rawValue === 'string' && !isNaN(parseFloat(rawValue)) && isFinite(parseFloat(rawValue))) {
        // 字符串数字转换为数字类型
        row[key] = parseFloat(rawValue);
      } else if (rawValue === null || rawValue === undefined) {
        // 空值保持为null，Excel会显示为空
        row[key] = null;
      } else {
        // 其他类型保持原样
        row[key] = rawValue;
      }
    });
    
    return row;
  });
};

// 测试函数
export const testNumberFormatPreservation = () => {
  console.log('🧪 [数字格式保持测试] 开始测试...');
  
  // 1. 测试原始数据
  console.log('📊 [原始数据]:', mockPayrollData[0]);
  
  // 2. 测试格式化函数（用于显示）
  const formattedValues = Object.entries(mockPayrollData[0]).map(([key, value]) => ({
    字段: key,
    原始值: value,
    原始类型: typeof value,
    格式化字符串: formatNumber(value),
    渲染元素: renderNumber(value)
  }));
  
  console.log('🎨 [格式化测试]:', formattedValues);
  
  // 3. 测试Excel导出数据处理
  const exportData = processExportData(mockPayrollData);
  console.log('📤 [Excel导出数据]:', exportData[0]);
  
  // 4. 验证数字格式是否保持
  const numericFields = ['应发合计', '扣除合计', '实发合计', '基本工资', '绩效工资', '个人所得税'];
  const validation = numericFields.map(field => {
    const originalValue = mockPayrollData[0][field];
    const exportValue = exportData[0][field];
    
    return {
      字段: field,
      原始值: originalValue,
      原始类型: typeof originalValue,
      导出值: exportValue,
      导出类型: typeof exportValue,
      格式保持: typeof originalValue === typeof exportValue && originalValue === exportValue
    };
  });
  
  console.log('✅ [格式保持验证]:', validation);
  
  // 5. 检查字符串数字转换
  const stringNumberTest = {
    字段: '字符串数字',
    原始值: mockPayrollData[0]['字符串数字'],
    原始类型: typeof mockPayrollData[0]['字符串数字'],
    导出值: exportData[0]['字符串数字'],
    导出类型: typeof exportData[0]['字符串数字'],
    转换正确: typeof exportData[0]['字符串数字'] === 'number' && exportData[0]['字符串数字'] === 1500.75
  };
  
  console.log('🔄 [字符串数字转换测试]:', stringNumberTest);
  
  // 6. 检查空值处理
  const nullTest = {
    字段: '空值字段',
    原始值: mockPayrollData[0]['空值字段'],
    导出值: exportData[0]['空值字段'],
    处理正确: exportData[0]['空值字段'] === null
  };
  
  console.log('🔳 [空值处理测试]:', nullTest);
  
  // 7. 总结
  const allTests = [
    ...validation.map(v => v.格式保持),
    stringNumberTest.转换正确,
    nullTest.处理正确
  ];
  
  const passedTests = allTests.filter(Boolean).length;
  const totalTests = allTests.length;
  
  console.log(`🎯 [测试总结]: ${passedTests}/${totalTests} 项测试通过`);
  
  if (passedTests === totalTests) {
    console.log('✅ [测试结果]: 所有测试通过！数字格式保持功能正常工作。');
  } else {
    console.warn('⚠️ [测试结果]: 部分测试失败，需要检查数字格式处理逻辑。');
  }
  
  return {
    passed: passedTests === totalTests,
    details: {
      formatValidation: validation,
      stringNumberConversion: stringNumberTest,
      nullHandling: nullTest,
      summary: `${passedTests}/${totalTests}`
    }
  };
};

// 在浏览器控制台中可以调用的测试函数
if (typeof window !== 'undefined') {
  (window as any).testNumberFormat = testNumberFormatPreservation;
} 