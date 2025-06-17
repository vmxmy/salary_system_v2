import React from 'react';
import { Row, Col } from 'antd';
import { 
  DepartmentCostCard, 
  EmployeeTypeCard, 
  SalaryTrendCard,
  type DepartmentCostData,
  type EmployeeTypeData,
  type SalaryTrendDataPoint
} from './index';

// 模拟部门成本数据
const departmentCostData: DepartmentCostData[] = [
  {
    departmentName: '技术部',
    currentCost: 580000,
    previousCost: 520000,
    employeeCount: 25,
    avgCostPerEmployee: 23200,
    percentage: 35.2,
    color: '#3b82f6'
  },
  {
    departmentName: '销售部',
    currentCost: 420000,
    previousCost: 450000,
    employeeCount: 18,
    avgCostPerEmployee: 23333,
    percentage: 25.5,
    color: '#10b981'
  },
  {
    departmentName: '市场部',
    currentCost: 280000,
    previousCost: 260000,
    employeeCount: 12,
    avgCostPerEmployee: 23333,
    percentage: 17.0,
    color: '#f59e0b'
  },
  {
    departmentName: '人事部',
    currentCost: 180000,
    previousCost: 175000,
    employeeCount: 8,
    avgCostPerEmployee: 22500,
    percentage: 10.9,
    color: '#ef4444'
  },
  {
    departmentName: '财务部',
    currentCost: 120000,
    previousCost: 115000,
    employeeCount: 6,
    avgCostPerEmployee: 20000,
    percentage: 7.3,
    color: '#8b5cf6'
  },
  {
    departmentName: '行政部',
    currentCost: 80000,
    previousCost: 85000,
    employeeCount: 4,
    avgCostPerEmployee: 20000,
    percentage: 4.9,
    color: '#06b6d4'
  }
];

// 模拟员工类型数据
const employeeTypeData: EmployeeTypeData[] = [
  {
    type: 'regular',
    typeName: '正编',
    count: 45,
    percentage: 61.6,
    avgSalary: 25800,
    totalCost: 1161000,
    previousCount: 43,
    newHires: 3,
    departures: 1,
    color: '#3b82f6',
    details: {
      senior: 8,
      middle: 20,
      junior: 17
    }
  },
  {
    type: 'contract',
    typeName: '聘用',
    count: 28,
    percentage: 38.4,
    avgSalary: 18200,
    totalCost: 509600,
    previousCount: 30,
    newHires: 1,
    departures: 3,
    color: '#f59e0b',
    details: {
      senior: 3,
      middle: 12,
      junior: 13
    }
  }
];

// 模拟工资趋势数据
const salaryTrendData: SalaryTrendDataPoint[] = [
  {
    month: '2024-01',
    monthLabel: '1月',
    grossSalary: 1450000,
    deductions: 280000,
    netSalary: 1170000,
    employeeCount: 70,
    avgGrossSalary: 20714,
    avgNetSalary: 16714
  },
  {
    month: '2024-02',
    monthLabel: '2月',
    grossSalary: 1520000,
    deductions: 295000,
    netSalary: 1225000,
    employeeCount: 71,
    avgGrossSalary: 21408,
    avgNetSalary: 17254
  },
  {
    month: '2024-03',
    monthLabel: '3月',
    grossSalary: 1580000,
    deductions: 310000,
    netSalary: 1270000,
    employeeCount: 72,
    avgGrossSalary: 21944,
    avgNetSalary: 17639
  },
  {
    month: '2024-04',
    monthLabel: '4月',
    grossSalary: 1620000,
    deductions: 320000,
    netSalary: 1300000,
    employeeCount: 73,
    avgGrossSalary: 22192,
    avgNetSalary: 17808
  },
  {
    month: '2024-05',
    monthLabel: '5月',
    grossSalary: 1680000,
    deductions: 335000,
    netSalary: 1345000,
    employeeCount: 73,
    avgGrossSalary: 23014,
    avgNetSalary: 18425
  },
  {
    month: '2024-06',
    monthLabel: '6月',
    grossSalary: 1720000,
    deductions: 345000,
    netSalary: 1375000,
    employeeCount: 74,
    avgGrossSalary: 23243,
    avgNetSalary: 18581
  },
  {
    month: '2024-07',
    monthLabel: '7月',
    grossSalary: 1750000,
    deductions: 355000,
    netSalary: 1395000,
    employeeCount: 74,
    avgGrossSalary: 23649,
    avgNetSalary: 18851
  },
  {
    month: '2024-08',
    monthLabel: '8月',
    grossSalary: 1780000,
    deductions: 360000,
    netSalary: 1420000,
    employeeCount: 75,
    avgGrossSalary: 23733,
    avgNetSalary: 18933
  },
  {
    month: '2024-09',
    monthLabel: '9月',
    grossSalary: 1820000,
    deductions: 370000,
    netSalary: 1450000,
    employeeCount: 75,
    avgGrossSalary: 24267,
    avgNetSalary: 19333
  },
  {
    month: '2024-10',
    monthLabel: '10月',
    grossSalary: 1850000,
    deductions: 380000,
    netSalary: 1470000,
    employeeCount: 76,
    avgGrossSalary: 24342,
    avgNetSalary: 19342
  },
  {
    month: '2024-11',
    monthLabel: '11月',
    grossSalary: 1880000,
    deductions: 385000,
    netSalary: 1495000,
    employeeCount: 76,
    avgGrossSalary: 24737,
    avgNetSalary: 19671
  },
  {
    month: '2024-12',
    monthLabel: '12月',
    grossSalary: 1920000,
    deductions: 395000,
    netSalary: 1525000,
    employeeCount: 73,
    avgGrossSalary: 26301,
    avgNetSalary: 20890
  }
];

export const MetricCardsDemo: React.FC = () => {
  
  // 处理部门点击
  const handleDepartmentClick = (department: DepartmentCostData) => {
    console.log('点击部门:', department.departmentName);
    // 这里可以跳转到部门详情页面或打开模态框
  };

  // 处理员工类型点击
  const handleEmployeeTypeClick = (type: EmployeeTypeData) => {
    console.log('点击员工类型:', type.typeName);
    // 这里可以跳转到员工类型详情页面
  };

  // 处理查看详情
  const handleViewDetails = (cardType: string) => {
    console.log('查看详情:', cardType);
    // 这里可以跳转到详情页面或打开全屏视图
  };

  // 处理导出数据
  const handleExport = () => {
    console.log('导出工资趋势数据');
    // 这里可以触发数据导出功能
  };

  // 处理时间范围变化
  const handleTimeRangeChange = (range: '6months' | '12months' | '24months') => {
    console.log('时间范围变化:', range);
    // 这里可以重新加载对应时间范围的数据
  };

  return (
    <div style={{ padding: '24px', background: '#f9fafb' }}>
      <Row gutter={[24, 24]}>
        {/* 部门成本分布卡片 */}
        <Col xs={24} lg={12}>
          <DepartmentCostCard
            title="部门成本分布"
            data={departmentCostData}
            totalCost={departmentCostData.reduce((sum, dept) => sum + dept.currentCost, 0)}
            onDepartmentClick={handleDepartmentClick}
            onViewDetails={() => handleViewDetails('部门成本')}
          />
        </Col>

        {/* 员工编制分布卡片 */}
        <Col xs={24} lg={12}>
          <EmployeeTypeCard
            title="编制分布"
            data={employeeTypeData}
            totalEmployees={employeeTypeData.reduce((sum, type) => sum + type.count, 0)}
            onTypeClick={handleEmployeeTypeClick}
            onViewDetails={() => handleViewDetails('编制分布')}
          />
        </Col>

        {/* 工资趋势分析卡片 - 全宽 */}
        <Col span={24}>
          <SalaryTrendCard
            title="工资趋势分析"
            data={salaryTrendData}
            timeRange="12months"
            onTimeRangeChange={handleTimeRangeChange}
            onViewDetails={() => handleViewDetails('工资趋势')}
            onExport={handleExport}
          />
        </Col>
      </Row>
    </div>
  );
};