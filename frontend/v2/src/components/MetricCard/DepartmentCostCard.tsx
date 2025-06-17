import React, { useState } from 'react';
import { Card, Typography, Tooltip, Button, Space } from 'antd';
import { 
  PieChartOutlined, 
  BarChartOutlined,
  ExpandOutlined,
  TeamOutlined 
} from '@ant-design/icons';
import './MetricCard.less';

const { Text, Title } = Typography;

export interface DepartmentCostData {
  departmentName: string;
  currentCost: number;
  previousCost: number;
  employeeCount: number;
  avgCostPerEmployee: number;
  percentage: number;
  color: string;
}

export interface DepartmentCostCardProps {
  title?: string;
  data: DepartmentCostData[];
  totalCost: number;
  loading?: boolean;
  onDepartmentClick?: (department: DepartmentCostData) => void;
  onViewDetails?: () => void;
}

export const DepartmentCostCard: React.FC<DepartmentCostCardProps> = ({
  title = "部门成本分布",
  data,
  totalCost,
  loading = false,
  onDepartmentClick,
  onViewDetails
}) => {
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');

  // 格式化金额
  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`;
    }
    return amount.toLocaleString();
  };

  // 计算环比变化
  const calculateChange = (current: number, previous: number): { percentage: number; direction: 'up' | 'down' | 'stable' } => {
    if (previous === 0) return { percentage: 0, direction: 'stable' };
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  // 饼图SVG组件
  const renderPieChart = () => {
    let currentAngle = 0;
    const radius = 80;
    const center = 90;
    
    return (
      <div className="pie-chart-container">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {data.map((item, index) => {
            const startAngle = currentAngle;
            const endAngle = currentAngle + (item.percentage / 100) * 360;
            currentAngle = endAngle;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const x1 = center + radius * Math.cos(startAngleRad);
            const y1 = center + radius * Math.sin(startAngleRad);
            const x2 = center + radius * Math.cos(endAngleRad);
            const y2 = center + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            
            const pathData = [
              `M ${center} ${center}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            return (
              <g key={item.departmentName}>
                <path
                  d={pathData}
                  fill={item.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="pie-slice"
                  onClick={() => onDepartmentClick?.(item)}
                  style={{ cursor: onDepartmentClick ? 'pointer' : 'default' }}
                />
                {/* 百分比标签 */}
                {item.percentage > 5 && (
                  <text
                    x={center + (radius * 0.7) * Math.cos((startAngleRad + endAngleRad) / 2)}
                    y={center + (radius * 0.7) * Math.sin((startAngleRad + endAngleRad) / 2)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {item.percentage.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
          {/* 中心圆 */}
          <circle
            cx={center}
            cy={center}
            r="30"
            fill="#ffffff"
            stroke="#f0f0f0"
            strokeWidth="2"
          />
          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="600"
            fill="#666"
          >
            总计
          </text>
          <text
            x={center}
            y={center + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="700"
            fill="#1890ff"
          >
            {formatAmount(totalCost)}
          </text>
        </svg>
      </div>
    );
  };

  // 柱状图组件
  const renderBarChart = () => {
    const maxCost = Math.max(...data.map(item => item.currentCost));
    
    return (
      <div className="bar-chart-container">
        {data.map((item, index) => {
          const barHeight = (item.currentCost / maxCost) * 100;
          const change = calculateChange(item.currentCost, item.previousCost);
          
          return (
            <div 
              key={item.departmentName} 
              className="bar-item"
              onClick={() => onDepartmentClick?.(item)}
              style={{ cursor: onDepartmentClick ? 'pointer' : 'default' }}
            >
              <div className="bar-wrapper">
                <div 
                  className="bar"
                  style={{ 
                    height: `${barHeight}%`,
                    backgroundColor: item.color
                  }}
                >
                  <div className="bar-value">
                    {formatAmount(item.currentCost)}
                  </div>
                </div>
              </div>
              <div className="bar-label">
                <div className="department-name">{item.departmentName}</div>
                <div className={`change-indicator ${change.direction}`}>
                  {change.direction === 'up' ? '↗' : change.direction === 'down' ? '↘' : '→'}
                  {change.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="modern-metric-card department-cost-card">
      {/* 卡片头部 */}
      <div className="metric-header">
        <div className="metric-title-wrapper">
          <TeamOutlined className="metric-icon" />
          <Title level={5} className="metric-title">{title}</Title>
          <Tooltip title="查看各部门人工成本分布情况">
            <Button type="text" icon={<ExpandOutlined />} onClick={onViewDetails} />
          </Tooltip>
        </div>
        <div className="chart-controls">
          <Space>
            <Button
              type={viewMode === 'pie' ? 'primary' : 'text'}
              icon={<PieChartOutlined />}
              size="small"
              onClick={() => setViewMode('pie')}
            >
              饼图
            </Button>
            <Button
              type={viewMode === 'bar' ? 'primary' : 'text'}
              icon={<BarChartOutlined />}
              size="small"
              onClick={() => setViewMode('bar')}
            >
              柱图
            </Button>
          </Space>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="metric-content">
        {/* 图表区域 */}
        <div className="chart-section">
          {viewMode === 'pie' ? renderPieChart() : renderBarChart()}
        </div>

        {/* 详细数据列表 */}
        <div className="department-list">
        {data.slice(0, 5).map((item, index) => {
          const change = calculateChange(item.currentCost, item.previousCost);
          
          return (
            <div 
              key={item.departmentName} 
              className="department-item"
              onClick={() => onDepartmentClick?.(item)}
            >
              <div className="department-info">
                <div 
                  className="color-indicator"
                  style={{ backgroundColor: item.color }}
                />
                <div className="department-details">
                  <div className="department-name">{item.departmentName}</div>
                  <div className="employee-count">{item.employeeCount}人</div>
                </div>
              </div>
              <div className="cost-info">
                <div className="current-cost">
                  {formatAmount(item.currentCost)}元
                </div>
                <div className={`cost-change ${change.direction}`}>
                  {change.direction === 'up' ? '+' : change.direction === 'down' ? '-' : ''}
                  {change.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="percentage">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          );
        })}
        
        {data.length > 5 && (
          <div className="more-departments" onClick={onViewDetails}>
            <Text type="secondary">查看全部 {data.length} 个部门 →</Text>
          </div>
        )}
        </div>
      </div>
    </Card>
  );
};