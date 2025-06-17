import React, { useMemo } from 'react';
import { Button, Row, Col, Space, Divider } from 'antd';
import { StatisticCard } from '@ant-design/pro-components';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  DepartmentCostCard, 
  EmployeeTypeCard, 
  SalaryTrendCard,
  type DepartmentCostData,
  type EmployeeTypeData,
  type SalaryTrendDataPoint
} from '../../../components/MetricCard';
import type { PayrollPeriodResponse, PayrollRunResponse } from '../types/simplePayroll';
import type { PayrollStats, DataIntegrityStats } from '../hooks/usePayrollPageLogic';

interface EnhancedPayrollStatisticsProps {
  selectedVersionId?: number;
  currentPeriod?: PayrollPeriodResponse | null;
  currentVersion?: PayrollRunResponse | null;
  versions: PayrollRunResponse[];
  payrollStats: PayrollStats;
  dataIntegrityStats: DataIntegrityStats;
  auditSummary?: {
    total_anomalies: number;
    error_count: number;
    warning_count: number;
    auto_fixable_count: number;
    manually_ignored_count?: number;
  } | null;
  auditLoading: boolean;
  resetLoadingStates: () => void;
}

export const EnhancedPayrollStatistics: React.FC<EnhancedPayrollStatisticsProps> = ({
  selectedVersionId,
  currentPeriod,
  currentVersion,
  versions,
  payrollStats,
  dataIntegrityStats,
  auditSummary,
  auditLoading,
  resetLoadingStates
}) => {
  
  // 生成模拟的部门成本数据
  const departmentCostData: DepartmentCostData[] = useMemo(() => {
    // 使用真实数据或默认模拟数据
    const totalGrossPay = payrollStats.totalGrossPay || 1650000; // 默认165万
    const recordCount = payrollStats.recordCount || 73; // 默认73人
    
    if (!selectedVersionId) {
      return [];
    }

    // 模拟部门分布 - 实际应用中这些数据应该从API获取
    const departments = [
      { name: '技术部', ratio: 0.35, employeeRatio: 0.34, color: '#3b82f6' },
      { name: '销售部', ratio: 0.25, employeeRatio: 0.25, color: '#10b981' },
      { name: '市场部', ratio: 0.17, employeeRatio: 0.16, color: '#f59e0b' },
      { name: '人事部', ratio: 0.11, employeeRatio: 0.11, color: '#ef4444' },
      { name: '财务部', ratio: 0.08, employeeRatio: 0.09, color: '#8b5cf6' },
      { name: '行政部', ratio: 0.04, employeeRatio: 0.05, color: '#06b6d4' }
    ];

    return departments.map(dept => {
      const currentCost = totalGrossPay * dept.ratio;
      const employeeCount = Math.round(recordCount * dept.employeeRatio);
      const previousCost = currentCost * (0.95 + Math.random() * 0.1); // 模拟上月数据
      
      return {
        departmentName: dept.name,
        currentCost,
        previousCost,
        employeeCount,
        avgCostPerEmployee: employeeCount > 0 ? currentCost / employeeCount : 0,
        percentage: dept.ratio * 100,
        color: dept.color
      };
    });
  }, [payrollStats.totalGrossPay, payrollStats.recordCount, selectedVersionId]);

  // 生成模拟的员工类型数据
  const employeeTypeData: EmployeeTypeData[] = useMemo(() => {
    // 使用真实数据或默认模拟数据
    const totalGrossPay = payrollStats.totalGrossPay || 1650000; // 默认165万
    const recordCount = payrollStats.recordCount || 73; // 默认73人
    
    if (!selectedVersionId) {
      return [];
    }

    const regularCount = Math.round(recordCount * 0.62); // 62% 正编
    const contractCount = recordCount - regularCount;
    
    const regularCost = totalGrossPay * 0.68; // 正编占总成本68%
    const contractCost = totalGrossPay - regularCost;
    
    return [
      {
        type: 'regular',
        typeName: '正编',
        count: regularCount,
        percentage: (regularCount / recordCount) * 100,
        avgSalary: regularCount > 0 ? regularCost / regularCount : 0,
        totalCost: regularCost,
        previousCount: regularCount - Math.floor(Math.random() * 3) + 1, // 模拟上月人数
        newHires: Math.floor(Math.random() * 3) + 1,
        departures: Math.floor(Math.random() * 2),
        color: '#3b82f6',
        details: {
          senior: Math.round(regularCount * 0.2),
          middle: Math.round(regularCount * 0.5),
          junior: Math.round(regularCount * 0.3)
        }
      },
      {
        type: 'contract',
        typeName: '聘用',
        count: contractCount,
        percentage: (contractCount / recordCount) * 100,
        avgSalary: contractCount > 0 ? contractCost / contractCount : 0,
        totalCost: contractCost,
        previousCount: contractCount + Math.floor(Math.random() * 3) - 1,
        newHires: Math.floor(Math.random() * 2),
        departures: Math.floor(Math.random() * 3) + 1,
        color: '#f59e0b',
        details: {
          senior: Math.round(contractCount * 0.15),
          middle: Math.round(contractCount * 0.45),
          junior: Math.round(contractCount * 0.4)
        }
      }
    ];
  }, [payrollStats.recordCount, payrollStats.totalGrossPay, selectedVersionId]);

  // 生成模拟的工资趋势数据
  const salaryTrendData: SalaryTrendDataPoint[] = useMemo(() => {
    // 使用真实数据或默认模拟数据
    const totalGrossPay = payrollStats.totalGrossPay || 1650000; // 默认165万
    const totalDeductions = payrollStats.totalDeductions || 330000; // 默认33万
    const totalNetPay = payrollStats.totalNetPay || 1320000; // 默认132万
    const recordCount = payrollStats.recordCount || 73; // 默认73人
    
    const currentDate = dayjs();
    const data: SalaryTrendDataPoint[] = [];
    
    // 生成最近12个月的数据
    for (let i = 11; i >= 0; i--) {
      const date = currentDate.subtract(i, 'month');
      const monthFactor = 0.85 + (11 - i) * 0.015 + Math.random() * 0.1; // 模拟增长趋势
      
      const grossSalary = totalGrossPay * monthFactor;
      const deductions = totalDeductions * monthFactor;
      const netSalary = totalNetPay * monthFactor;
      
      data.push({
        month: date.format('YYYY-MM'),
        monthLabel: date.format('M月'),
        grossSalary,
        deductions,
        netSalary,
        employeeCount: Math.round(recordCount * (0.9 + Math.random() * 0.2)),
        avgGrossSalary: grossSalary / recordCount,
        avgNetSalary: netSalary / recordCount
      });
    }
    
    return data;
  }, [payrollStats.totalGrossPay, payrollStats.totalDeductions, payrollStats.totalNetPay, payrollStats.recordCount, selectedVersionId]);

  // 处理部门点击
  const handleDepartmentClick = (department: DepartmentCostData) => {
    console.log('查看部门详情:', department.departmentName);
    // TODO: 实现跳转到部门详情页面
  };

  // 处理员工类型点击
  const handleEmployeeTypeClick = (type: EmployeeTypeData) => {
    console.log('查看编制详情:', type.typeName);
    // TODO: 实现跳转到编制详情页面
  };

  // 处理查看详情
  const handleViewDetails = (cardType: string) => {
    console.log('查看详情:', cardType);
    // TODO: 实现全屏查看或跳转详情页面
  };

  // 处理数据导出
  const handleExport = () => {
    console.log('导出工资趋势数据');
    // TODO: 实现数据导出功能
  };

  // 处理时间范围变化
  const handleTimeRangeChange = (range: '6months' | '12months' | '24months') => {
    console.log('切换时间范围:', range);
    // TODO: 实现重新加载对应时间范围的数据
  };

  if (!selectedVersionId) {
    return null;
  }

  return (
    <div className="enhanced-payroll-statistics">
      {/* 原有的基础统计卡片 */}
      <StatisticCard.Group
        title={
          <Space>
            <DollarOutlined />
            <span className="typography-title-tertiary">{currentPeriod?.name || ''} 工资统计概览</span>
          </Space>
        }
        extra={
          process.env.NODE_ENV === 'development' && payrollStats.loading ? (
            <Button 
              size="small" 
              type="link" 
              onClick={resetLoadingStates}
              style={{ color: '#ff4d4f' }}
            >
              重置加载状态
            </Button>
          ) : null
        }
        loading={payrollStats.loading}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '工资条目',
                value: payrollStats.recordCount,
                suffix: '条',
                valueStyle: { color: '#1890ff' }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    期间: {currentPeriod?.name || '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    状态: <span style={{ color: '#52c41a' }}>{currentPeriod?.status_name || '-'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    版本: v{currentVersion?.version_number || '-'} ({versions.length}个)
                  </div>
                </div>
              }
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '数据完整性',
                value: (dataIntegrityStats?.socialInsuranceBaseCount || 0) + (dataIntegrityStats?.housingFundBaseCount || 0) + (dataIntegrityStats?.incomeTaxPositiveCount || 0),
                suffix: '条',
                valueStyle: { color: '#722ed1' }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    社保基数: <span style={{ color: (dataIntegrityStats?.socialInsuranceBaseCount || 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {dataIntegrityStats?.socialInsuranceBaseCount || 0} 条
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    公积金基数: <span style={{ color: (dataIntegrityStats?.housingFundBaseCount || 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {dataIntegrityStats?.housingFundBaseCount || 0} 条
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    个税&gt;0: <span style={{ color: (dataIntegrityStats?.incomeTaxPositiveCount || 0) > 0 ? '#52c41a' : '#fa8c16' }}>
                      {dataIntegrityStats?.incomeTaxPositiveCount || 0} 条
                    </span>
                  </div>
                </div>
              }
              loading={dataIntegrityStats?.loading || false}
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '财务信息',
                value: payrollStats.totalNetPay,
                precision: 2,
                prefix: '¥',
                valueStyle: { color: '#52c41a' }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    应发: <span style={{ color: '#52c41a' }}>¥{payrollStats.totalGrossPay.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    扣发: <span style={{ color: '#ff4d4f' }}>¥{payrollStats.totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    平均: ¥{payrollStats.recordCount > 0 ? (payrollStats.totalNetPay / payrollStats.recordCount).toFixed(0) : '0'}
                  </div>
                </div>
              }
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '版本状态',
                value: currentVersion?.status_name || '-',
                valueStyle: { 
                  color: 
                    currentVersion?.status_name === '草稿' ? '#fa8c16' :
                    currentVersion?.status_name === '已计算' ? '#1890ff' :
                    currentVersion?.status_name === '已审核' ? '#52c41a' :
                    currentVersion?.status_name === '已支付' ? '#722ed1' :
                    '#8c8c8c'
                }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    创建: {currentVersion ? dayjs(currentVersion.initiated_at).format('MM-DD HH:mm') : '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    创建人: {currentVersion?.initiated_by_username || '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    频率: {currentPeriod?.frequency_name || '-'}
                  </div>
                </div>
              }
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '审核状态',
                value: auditSummary ? (
                  (auditSummary.error_count - (auditSummary.manually_ignored_count || 0)) > 0 ? '有异常' : '通过'
                ) : (auditLoading ? '检查中' : '待审核'),
                valueStyle: { 
                  color: auditSummary ? (
                    (auditSummary.error_count - (auditSummary.manually_ignored_count || 0)) > 0 ? '#ff4d4f' : '#52c41a'
                  ) : (auditLoading ? '#1890ff' : '#fa8c16')
                }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    错误: <span style={{ color: (auditSummary?.error_count || 0) > 0 ? '#ff4d4f' : '#52c41a' }}>
                      {auditSummary?.error_count || 0} 个
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    警告: <span style={{ color: (auditSummary?.warning_count || 0) > 0 ? '#fa8c16' : '#52c41a' }}>
                      {auditSummary?.warning_count || 0} 个
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    可修复: <span style={{ color: (auditSummary?.auto_fixable_count || 0) > 0 ? '#1890ff' : '#52c41a' }}>
                      {auditSummary?.auto_fixable_count || 0} 个
                    </span>
                  </div>
                </div>
              }
            />
          </Col>
        </Row>
      </StatisticCard.Group>

      {/* 新增的高级指标卡片 */}
      {selectedVersionId && (
        <Row gutter={[24, 24]}>
          {/* 部门成本分布 */}
          <Col xs={24} lg={12}>
            <DepartmentCostCard
              title="部门成本分布"
              data={departmentCostData}
              totalCost={payrollStats.totalGrossPay || 1650000}
              onDepartmentClick={handleDepartmentClick}
              onViewDetails={() => handleViewDetails('部门成本')}
            />
          </Col>

          {/* 员工编制分布 */}
          <Col xs={24} lg={12}>
            <EmployeeTypeCard
              title="编制分布"
              data={employeeTypeData}
              totalEmployees={payrollStats.recordCount || 73}
              onTypeClick={handleEmployeeTypeClick}
              onViewDetails={() => handleViewDetails('编制分布')}
            />
          </Col>

          {/* 工资趋势分析 - 全宽 */}
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
      )}
    </div>
  );
};