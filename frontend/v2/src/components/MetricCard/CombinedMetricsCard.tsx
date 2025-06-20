import React, { useState } from 'react';
import { Card, Typography, Space, Modal } from 'antd';
import { 
  DashboardOutlined,
  ExpandOutlined,
  CompressOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { MiniDepartmentCostCard } from './MiniDepartmentCostCard';
import { MiniEmployeeTypeCard } from './MiniEmployeeTypeCard';
import { MiniSalaryTrendCard } from './MiniSalaryTrendCard';
import { MetricCardErrorBoundary } from './MetricCardErrorBoundary';
import type { 
  DepartmentCostData,
  EmployeeTypeData,
  SalaryTrendDataPoint
} from './index';
import './MetricCard.less';

const { Title } = Typography;

export interface CombinedMetricsCardProps {
  title?: string;
  
  // 期间数据
  periodId?: number; // 新增：当前选择的薪资期间ID
  
  // 部门成本数据
  departmentCostData: DepartmentCostData[];
  totalCost: number;
  totalDeductions: number;
  totalNetPay: number;
  departmentCostLoading?: boolean;
  
  // 编制分布数据
  employeeTypeData: EmployeeTypeData[];
  totalEmployees: number;
  employeeTypeLoading?: boolean;
  
  // 工资趋势数据
  salaryTrendData: SalaryTrendDataPoint[];
  salaryTrendLoading?: boolean;
  
  // 事件处理
  onViewDetails?: () => void;
  onDepartmentClick?: (department: DepartmentCostData) => void;
  onEmployeeTypeClick?: (type: EmployeeTypeData) => void;
  onExportTrend?: () => void;
}

export const CombinedMetricsCard: React.FC<CombinedMetricsCardProps> = ({
  title = "关键指标概览",
  periodId,
  departmentCostData = [],
  totalCost = 0,
  totalDeductions = 0,
  totalNetPay = 0,
  departmentCostLoading = false,
  employeeTypeData = [],
  totalEmployees = 0,
  employeeTypeLoading = false,
  salaryTrendData = [],
  salaryTrendLoading = false,
  onViewDetails,
  onDepartmentClick,
  onEmployeeTypeClick,
  onExportTrend
}) => {
  console.log('🔴🔴🔴 [CombinedMetricsCard] 组件渲柕开始 🔴🔴🔴');
  console.log('🔴 [CombinedMetricsCard] title:', title);
  console.log('🔴 [CombinedMetricsCard] periodId:', periodId);
  console.log('🔴 [CombinedMetricsCard] props:', { 
    periodId, 
    totalEmployees, 
    employeeTypeLoading,
    employeeTypeDataLength: employeeTypeData.length 
  });
  // 状态管理
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 弹出/收起处理函数
  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCloseModal = () => {
    setIsExpanded(false);
  };

  // 数据安全处理
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // 安全的事件处理器
  const handleViewDetails = () => {
    try {
      onViewDetails?.();
    } catch (error) {
      console.warn('查看详情事件处理错误:', error);
    }
  };

  const handleDepartmentClick = (department: DepartmentCostData) => {
    try {
      onDepartmentClick?.(department);
    } catch (error) {
      console.warn('部门点击事件处理错误:', error);
    }
  };

  const handleEmployeeTypeClick = (type: EmployeeTypeData) => {
    try {
      onEmployeeTypeClick?.(type);
    } catch (error) {
      console.warn('员工类型点击事件处理错误:', error);
    }
  };

  const handleExportTrend = () => {
    try {
      onExportTrend?.();
    } catch (error) {
      console.warn('导出趋势事件处理错误:', error);
    }
  };

  // 使用传入的真实API数据（已删除测试数据）

  const renderMetricsContent = () => {
    console.log('🎯 [CombinedMetricsCard] 渲染指标内容');
    console.log('🎯 [CombinedMetricsCard] API部门数据:', departmentCostData);
    console.log('🎯 [CombinedMetricsCard] API员工数据:', employeeTypeData);
    console.log('🎯 [CombinedMetricsCard] API趋势数据:', salaryTrendData);
    console.log('🎯 [CombinedMetricsCard] 使用真实API数据');
    
    return (
    <div className="metrics-container">
      {/* 部门成本 Mini Card */}
      <div className="metric-column">
        <MetricCardErrorBoundary>
          <MiniDepartmentCostCard
            data={departmentCostData}
            totalCost={safeNumber(totalCost, 0)}
            totalDeductions={safeNumber(totalDeductions, 0)}
            totalNetPay={safeNumber(totalNetPay, 0)}
            loading={departmentCostLoading}
            onDepartmentClick={handleDepartmentClick}
          />
        </MetricCardErrorBoundary>
      </div>

      {/* 编制分布 Mini Card */}
      <div className="metric-column">
        <MetricCardErrorBoundary>
          <MiniEmployeeTypeCard
            data={employeeTypeData}
            totalEmployees={safeNumber(totalEmployees, 0)}
            loading={employeeTypeLoading}
            periodId={periodId}
            onTypeClick={handleEmployeeTypeClick}
          />
        </MetricCardErrorBoundary>
      </div>

      {/* 工资趋势 Mini Card */}
      <div className="metric-column">
        <MetricCardErrorBoundary>
          <MiniSalaryTrendCard
            data={salaryTrendData}
            loading={salaryTrendLoading}
            onExport={handleExportTrend}
          />
        </MetricCardErrorBoundary>
      </div>
    </div>
    );
  };

  return (
    <>
      <Card className="combined-metrics-card">
        {/* 卡片头部 */}
        <div className="metrics-header">
          <div className="metrics-title-wrapper">
            <DashboardOutlined className="metrics-icon" />
            <Title level={5} className="metrics-title">{title}</Title>
          </div>
          <div className="metrics-controls">
            <Space>
              <button
                type="button"
                className="control-button"
                onClick={handleCollapse}
                title={isCollapsed ? "展开" : "收起"}
              >
                {isCollapsed ? <ExpandOutlined /> : <CompressOutlined />}
              </button>
              <button
                type="button"
                className="control-button"
                onClick={handleExpand}
                title="弹出查看"
              >
                <FullscreenOutlined />
              </button>
              <button
                type="button"
                className="control-button"
                onClick={handleViewDetails}
                title="查看详情"
              >
                <ExpandOutlined />
              </button>
            </Space>
          </div>
        </div>

        {/* 指标卡片容器 */}
        {!isCollapsed && renderMetricsContent()}
      </Card>

      {/* 弹出模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DashboardOutlined />
            <span>{title}</span>
          </div>
        }
        open={isExpanded}
        onCancel={handleCloseModal}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        styles={{ body: { padding: '16px' } }}
        destroyOnClose
      >
        <div style={{ minHeight: '30vh' }}>
          {renderMetricsContent()}
        </div>
      </Modal>
    </>
  );
};