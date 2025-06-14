import React, { useState } from 'react';
import { Card, Space, Button, message } from 'antd';
import DynamicMappingTable from './frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/DynamicMappingTable';
import type { MappingRule } from './frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/types/index';

/**
 * 🧪 动态映射表测试页面
 */
const TestDynamicMappingTable: React.FC = () => {
  // 模拟映射规则数据
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([
    {
      sourceField: '姓名',
      targetField: 'employee_full_name',
      confidence: 0.98,
      category: 'base',
      required: true
    },
    {
      sourceField: '基本工资',
      targetField: 'earnings_details.BASIC_SALARY.amount',
      confidence: 0.95,
      category: 'earning',
      required: false
    },
    {
      sourceField: '岗位工资',
      targetField: 'earnings_details.POSITION_SALARY_GENERAL.amount',
      confidence: 0.95,
      category: 'earning',
      required: false
    },
    {
      sourceField: '绩效工资',
      targetField: 'earnings_details.PERFORMANCE_SALARY.amount',
      confidence: 0.90,
      category: 'earning',
      required: false
    },
    {
      sourceField: '个人所得税',
      targetField: 'deductions_details.PERSONAL_INCOME_TAX.amount',
      confidence: 0.98,
      category: 'deduction',
      required: false
    },
    {
      sourceField: '住房公积金个人',
      targetField: 'deductions_details.HOUSING_FUND_PERSONAL.amount',
      confidence: 0.90,
      category: 'deduction',
      required: false
    },
    {
      sourceField: '职业年金缴费基数',
      targetField: 'stats.OCCUPATIONAL_PENSION_BASE.amount',
      confidence: 0.85,
      category: 'stat',
      required: false
    },
    {
      sourceField: '应发合计',
      targetField: '__CALCULATED_FIELD__',
      confidence: 0.80,
      category: 'calculated',
      required: false
    },
    {
      sourceField: '序号',
      targetField: '__ROW_NUMBER__',
      confidence: 0.75,
      category: 'ignore',
      required: false
    }
  ]);

  const handleMappingRulesChange = (newRules: MappingRule[]) => {
    console.log('📝 [TestDynamicMappingTable] 映射规则变更:', newRules);
    setMappingRules(newRules);
    message.success(`映射规则已更新 (${newRules.length} 条)`);
  };

  const handleAddTestRule = () => {
    const newRule: MappingRule = {
      sourceField: `测试字段_${Date.now()}`,
      targetField: '__UNMAPPED_FIELD__',
      confidence: 0.50,
      category: 'other',
      required: false
    };
    
    setMappingRules(prev => [...prev, newRule]);
    message.info('已添加测试规则');
  };

  const handleClearRules = () => {
    setMappingRules([]);
    message.info('已清空所有映射规则');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="🧪 动态映射表测试页面" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleAddTestRule}>
            添加测试规则
          </Button>
          <Button onClick={handleClearRules}>
            清空规则
          </Button>
          <span style={{ color: '#666' }}>
            当前规则数量: {mappingRules.length}
          </span>
        </Space>
        
        <p style={{ color: '#666', marginBottom: 16 }}>
          💡 这个测试页面将验证动态映射表组件是否能正确：
        </p>
        <ul style={{ color: '#666', marginBottom: 16 }}>
          <li>从数据库获取工资组件定义数据</li>
          <li>使用组件定义中的中文名称作为下拉选项</li>
          <li>按照组件类型正确分组显示</li>
          <li>支持搜索和筛选功能</li>
          <li>正确处理映射规则的变更</li>
        </ul>
      </Card>

      <DynamicMappingTable
        mappingRules={mappingRules}
        onMappingRulesChange={handleMappingRulesChange}
      />
    </div>
  );
};

export default TestDynamicMappingTable; 