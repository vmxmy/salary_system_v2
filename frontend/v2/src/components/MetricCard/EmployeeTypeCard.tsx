import React, { useState } from 'react';
import { Card, Typography, Progress, Tooltip, Button, Space, Tag } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined,
  SwapOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './MetricCard.less';

const { Text, Title } = Typography;

export interface EmployeeTypeData {
  type: 'regular' | 'contract'; // 正编 | 聘用
  typeName: string;
  count: number;
  percentage: number;
  avgSalary: number;
  totalCost: number;
  previousCount: number;
  newHires: number; // 本月新入职
  departures: number; // 本月离职
  color: string;
  details?: {
    senior: number; // 高级职位
    middle: number; // 中级职位
    junior: number; // 初级职位
  };
}

export interface EmployeeTypeCardProps {
  title?: string;
  data: EmployeeTypeData[];
  totalEmployees: number;
  loading?: boolean;
  onTypeClick?: (type: EmployeeTypeData) => void;
  onViewDetails?: () => void;
}

export const EmployeeTypeCard: React.FC<EmployeeTypeCardProps> = ({
  title = "编制分布",
  data,
  totalEmployees,
  loading = false,
  onTypeClick,
  onViewDetails
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'comparison'>('overview');

  // 格式化金额
  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`;
    }
    return amount.toLocaleString();
  };

  // 计算变化
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: 'stable' as const };
    const change = current - previous;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const
    };
  };

  // 环形进度图
  const renderDonutChart = () => {
    const regularData = data.find(item => item.type === 'regular');
    const contractData = data.find(item => item.type === 'contract');
    
    if (!regularData || !contractData) return null;

    return (
      <div className="donut-chart-container">
        <div className="donut-chart">
          {/* 外环 - 正编 */}
          <div className="donut-ring outer-ring">
            <Progress
              type="circle"
              percent={regularData.percentage}
              width={140}
              strokeWidth={12}
              strokeColor={{
                '0%': regularData.color,
                '100%': regularData.color,
              }}
              trailColor="#f0f0f0"
              showInfo={false}
            />
          </div>
          
          {/* 内环 - 聘用 */}
          <div className="donut-ring inner-ring">
            <Progress
              type="circle"
              percent={contractData.percentage}
              width={100}
              strokeWidth={10}
              strokeColor={{
                '0%': contractData.color,
                '100%': contractData.color,
              }}
              trailColor="#f8f8f8"
              showInfo={false}
            />
          </div>
          
          {/* 中心数据 */}
          <div className="donut-center">
            <div className="total-count">{totalEmployees}</div>
            <div className="total-label">总人数</div>
          </div>
        </div>
        
        {/* 图例 */}
        <div className="chart-legend">
          {data.map((item) => (
            <div key={item.type} className="legend-item">
              <div 
                className="legend-color"
                style={{ backgroundColor: item.color }}
              />
              <div className="legend-info">
                <div className="legend-label">{item.typeName}</div>
                <div className="legend-value">
                  {item.count}人 ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 对比视图
  const renderComparisonView = () => {
    const regularData = data.find(item => item.type === 'regular');
    const contractData = data.find(item => item.type === 'contract');
    
    if (!regularData || !contractData) return null;

    const regularChange = calculateChange(regularData.count, regularData.previousCount);
    const contractChange = calculateChange(contractData.count, contractData.previousCount);

    return (
      <div className="comparison-view">
        {/* 正编数据 */}
        <div className="type-comparison-card" onClick={() => onTypeClick?.(regularData)}>
          <div className="type-header">
            <div className="type-info">
              <TrophyOutlined className="type-icon" style={{ color: regularData.color }} />
              <span className="type-name">{regularData.typeName}</span>
            </div>
            <div className={`change-badge ${regularChange.direction}`}>
              {regularChange.direction === 'up' ? '+' : regularChange.direction === 'down' ? '-' : ''}
              {regularChange.value}
            </div>
          </div>
          
          <div className="type-metrics">
            <div className="metric-row">
              <span className="metric-label">人数</span>
              <span className="metric-value">{regularData.count}人</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">平均薪资</span>
              <span className="metric-value">{formatAmount(regularData.avgSalary)}元</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">总成本</span>
              <span className="metric-value">{formatAmount(regularData.totalCost)}元</span>
            </div>
          </div>
          
          <div className="type-flow">
            <div className="flow-item positive">
              <span className="flow-label">新入职</span>
              <span className="flow-value">+{regularData.newHires}</span>
            </div>
            <div className="flow-item negative">
              <span className="flow-label">离职</span>
              <span className="flow-value">-{regularData.departures}</span>
            </div>
          </div>
        </div>

        {/* 聘用数据 */}
        <div className="type-comparison-card" onClick={() => onTypeClick?.(contractData)}>
          <div className="type-header">
            <div className="type-info">
              <ClockCircleOutlined className="type-icon" style={{ color: contractData.color }} />
              <span className="type-name">{contractData.typeName}</span>
            </div>
            <div className={`change-badge ${contractChange.direction}`}>
              {contractChange.direction === 'up' ? '+' : contractChange.direction === 'down' ? '-' : ''}
              {contractChange.value}
            </div>
          </div>
          
          <div className="type-metrics">
            <div className="metric-row">
              <span className="metric-label">人数</span>
              <span className="metric-value">{contractData.count}人</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">平均薪资</span>
              <span className="metric-value">{formatAmount(contractData.avgSalary)}元</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">总成本</span>
              <span className="metric-value">{formatAmount(contractData.totalCost)}元</span>
            </div>
          </div>
          
          <div className="type-flow">
            <div className="flow-item positive">
              <span className="flow-label">新入职</span>
              <span className="flow-value">+{contractData.newHires}</span>
            </div>
            <div className="flow-item negative">
              <span className="flow-label">离职</span>
              <span className="flow-value">-{contractData.departures}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 核心指标摘要
  const renderSummaryMetrics = () => {
    const regularData = data.find(item => item.type === 'regular');
    const contractData = data.find(item => item.type === 'contract');
    
    if (!regularData || !contractData) return null;

    const totalNewHires = regularData.newHires + contractData.newHires;
    const totalDepartures = regularData.departures + contractData.departures;
    const netChange = totalNewHires - totalDepartures;

    return (
      <div className="summary-metrics">
        <div className="summary-item">
          <div className="summary-icon positive">
            <UserOutlined />
          </div>
          <div className="summary-info">
            <div className="summary-value">+{totalNewHires}</div>
            <div className="summary-label">本月入职</div>
          </div>
        </div>
        
        <div className="summary-item">
          <div className="summary-icon negative">
            <SwapOutlined />
          </div>
          <div className="summary-info">
            <div className="summary-value">-{totalDepartures}</div>
            <div className="summary-label">本月离职</div>
          </div>
        </div>
        
        <div className="summary-item">
          <div className={`summary-icon ${netChange >= 0 ? 'positive' : 'negative'}`}>
            <TeamOutlined />
          </div>
          <div className="summary-info">
            <div className="summary-value">
              {netChange >= 0 ? '+' : ''}{netChange}
            </div>
            <div className="summary-label">净变化</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="modern-metric-card employee-type-card">
      {/* 卡片头部 */}
      <div className="metric-header">
        <div className="metric-title-wrapper">
          <UserOutlined className="metric-icon" />
          <Title level={5} className="metric-title">{title}</Title>
          <Tooltip title="查看正编和聘用人员分布详情">
            <Button type="text" icon={<BarChartOutlined />} onClick={onViewDetails} />
          </Tooltip>
        </div>
        <div className="view-controls">
          <Space>
            <Button
              type={viewMode === 'overview' ? 'primary' : 'text'}
              icon={<PieChartOutlined />}
              size="small"
              onClick={() => setViewMode('overview')}
            >
              总览
            </Button>
            <Button
              type={viewMode === 'comparison' ? 'primary' : 'text'}
              icon={<BarChartOutlined />}
              size="small"
              onClick={() => setViewMode('comparison')}
            >
              对比
            </Button>
          </Space>
        </div>
      </div>

      {/* 核心指标摘要 */}
      {renderSummaryMetrics()}

      {/* 主要内容区域 */}
      <div className="employee-type-content">
        {viewMode === 'overview' ? renderDonutChart() : renderComparisonView()}
      </div>

      {/* 详细分析 */}
      <div className="detailed-analysis">
        <div className="analysis-row">
          <Text className="analysis-label">编制比例</Text>
          <div className="analysis-value">
            {data.map((item, index) => (
              <Tag 
                key={item.type}
                color={item.type === 'regular' ? 'blue' : 'orange'}
              >
                {item.typeName}: {item.percentage.toFixed(1)}%
              </Tag>
            ))}
          </div>
        </div>
        
        <div className="analysis-row">
          <Text className="analysis-label">薪资水平</Text>
          <div className="analysis-value">
            {data.map((item) => (
              <span key={item.type} className="salary-comparison">
                {item.typeName}: {formatAmount(item.avgSalary)}元
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};