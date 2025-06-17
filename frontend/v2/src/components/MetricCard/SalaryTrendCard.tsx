import React, { useState, useMemo } from 'react';
import { Card, Typography, Button, Space, Select, Tooltip, Tag } from 'antd';
import { 
  LineChartOutlined, 
  FullscreenOutlined,
  CalendarOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import './MetricCard.less';

const { Text, Title } = Typography;
const { Option } = Select;

export interface SalaryTrendDataPoint {
  month: string; // 格式: "2024-01"
  monthLabel: string; // 格式: "1月"
  grossSalary: number; // 应发合计
  deductions: number; // 扣发合计
  netSalary: number; // 实发合计
  employeeCount?: number; // 当月员工数
  avgGrossSalary?: number; // 平均应发
  avgNetSalary?: number; // 平均实发
}

export interface SalaryTrendCardProps {
  title?: string;
  data: SalaryTrendDataPoint[];
  loading?: boolean;
  timeRange?: '6months' | '12months' | '24months';
  onTimeRangeChange?: (range: '6months' | '12months' | '24months') => void;
  onViewDetails?: () => void;
  onExport?: () => void;
}

export const SalaryTrendCard: React.FC<SalaryTrendCardProps> = ({
  title = "工资趋势分析",
  data,
  loading = false,
  timeRange = '12months',
  onTimeRangeChange,
  onViewDetails,
  onExport
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['grossSalary', 'netSalary', 'deductions']);
  const [showDataPoints, setShowDataPoints] = useState(true);

  // 格式化金额显示
  const formatAmount = (amount: number, compact = false): string => {
    if (compact && amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`;
    }
    return amount.toLocaleString();
  };

  // 计算趋势数据
  const trendAnalysis = useMemo(() => {
    if (data.length < 2) return null;
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const calculateTrend = (current: number, prev: number) => {
      const change = current - prev;
      const percentage = prev === 0 ? 0 : (change / prev) * 100;
      return {
        change,
        percentage,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    };

    return {
      grossSalary: calculateTrend(latest.grossSalary, previous.grossSalary),
      deductions: calculateTrend(latest.deductions, previous.deductions),
      netSalary: calculateTrend(latest.netSalary, previous.netSalary)
    };
  }, [data]);

  // 图表配置
  const chartConfig = {
    grossSalary: { 
      color: '#3b82f6', 
      label: '应发合计',
      strokeWidth: 3,
      dotColor: '#2563eb'
    },
    deductions: { 
      color: '#ef4444', 
      label: '扣发合计',
      strokeWidth: 2,
      dotColor: '#dc2626'
    },
    netSalary: { 
      color: '#10b981', 
      label: '实发合计',
      strokeWidth: 3,
      dotColor: '#059669'
    }
  };

  // 生成SVG路径
  const generatePath = (dataKey: keyof SalaryTrendDataPoint, width: number, height: number) => {
    if (data.length < 2) return '';
    
    const values = data.map(d => d[dataKey] as number);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((item[dataKey] as number - minValue) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  // 渲染线性图表
  const renderLineChart = () => {
    const chartWidth = 100;
    const chartHeight = 60;
    
    return (
      <div className="line-chart-container">
        <svg 
          width="100%" 
          height="240" 
          viewBox={`0 0 ${chartWidth} 80`}
          className="salary-trend-chart"
        >
          {/* 背景网格 */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>
          
          {/* 渲染各条趋势线 */}
          {selectedMetrics.map((metric) => {
            const config = chartConfig[metric as keyof typeof chartConfig];
            if (!config) return null;
            
            const path = generatePath(metric as keyof SalaryTrendDataPoint, chartWidth, chartHeight);
            
            return (
              <g key={metric}>
                {/* 渐变填充 */}
                <defs>
                  <linearGradient id={`gradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={config.color} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={config.color} stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                
                {/* 填充区域 */}
                <path
                  d={`${path} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
                  fill={`url(#gradient-${metric})`}
                />
                
                {/* 趋势线 */}
                <path
                  d={path}
                  fill="none"
                  stroke={config.color}
                  strokeWidth={config.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* 数据点 */}
                {showDataPoints && data.map((item, index) => {
                  const values = data.map(d => d[metric as keyof SalaryTrendDataPoint] as number);
                  const maxValue = Math.max(...values);
                  const minValue = Math.min(...values);
                  const range = maxValue - minValue || 1;
                  
                  const x = (index / (data.length - 1)) * chartWidth;
                  const y = chartHeight - ((item[metric as keyof SalaryTrendDataPoint] as number - minValue) / range) * chartHeight;
                  
                  return (
                    <circle
                      key={`${metric}-${index}`}
                      cx={x}
                      cy={y}
                      r="1.5"
                      fill={config.dotColor}
                      stroke="white"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
            );
          })}
          
          {/* X轴标签 */}
          {data.map((item, index) => {
            if (index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) {
              const x = (index / (data.length - 1)) * chartWidth;
              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y={chartHeight + 15}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#666"
                >
                  {item.monthLabel}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    );
  };

  // 渲染图例
  const renderLegend = () => (
    <div className="chart-legend">
      {Object.entries(chartConfig).map(([key, config]) => (
        <div 
          key={key}
          className={`legend-item ${selectedMetrics.includes(key) ? 'active' : 'inactive'}`}
          onClick={() => {
            if (selectedMetrics.includes(key)) {
              setSelectedMetrics(prev => prev.filter(m => m !== key));
            } else {
              setSelectedMetrics(prev => [...prev, key]);
            }
          }}
        >
          <div 
            className="legend-color"
            style={{ backgroundColor: config.color }}
          />
          <span className="legend-label">{config.label}</span>
          {trendAnalysis && (
            <div className={`trend-indicator ${trendAnalysis[key as keyof typeof trendAnalysis]?.direction}`}>
              {trendAnalysis[key as keyof typeof trendAnalysis]?.direction === 'up' ? (
                <TrendingUpOutlined />
              ) : trendAnalysis[key as keyof typeof trendAnalysis]?.direction === 'down' ? (
                <TrendingDownOutlined />
              ) : null}
              <span className="trend-percentage">
                {Math.abs(trendAnalysis[key as keyof typeof trendAnalysis]?.percentage || 0).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // 渲染关键指标
  const renderKeyMetrics = () => {
    if (!data.length) return null;
    
    const latest = data[data.length - 1];
    
    return (
      <div className="key-metrics">
        <div className="metric-item">
          <div className="metric-label">当月应发</div>
          <div className="metric-value primary">
            {formatAmount(latest.grossSalary, true)}元
          </div>
          {trendAnalysis && (
            <div className={`metric-change ${trendAnalysis.grossSalary.direction}`}>
              {trendAnalysis.grossSalary.direction === 'up' ? '+' : trendAnalysis.grossSalary.direction === 'down' ? '-' : ''}
              {formatAmount(Math.abs(trendAnalysis.grossSalary.change), true)}
            </div>
          )}
        </div>
        
        <div className="metric-item">
          <div className="metric-label">当月实发</div>
          <div className="metric-value success">
            {formatAmount(latest.netSalary, true)}元
          </div>
          {trendAnalysis && (
            <div className={`metric-change ${trendAnalysis.netSalary.direction}`}>
              {trendAnalysis.netSalary.direction === 'up' ? '+' : trendAnalysis.netSalary.direction === 'down' ? '-' : ''}
              {formatAmount(Math.abs(trendAnalysis.netSalary.change), true)}
            </div>
          )}
        </div>
        
        <div className="metric-item">
          <div className="metric-label">扣发比例</div>
          <div className="metric-value warning">
            {((latest.deductions / latest.grossSalary) * 100).toFixed(1)}%
          </div>
          <div className="metric-change neutral">
            {formatAmount(latest.deductions, true)}元
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="modern-metric-card salary-trend-card">
      {/* 卡片头部 */}
      <div className="metric-header">
        <div className="metric-title-wrapper">
          <LineChartOutlined className="metric-icon" />
          <Title level={5} className="metric-title">{title}</Title>
          <Tooltip title="查看工资发放趋势分析">
            <InfoCircleOutlined className="info-icon" />
          </Tooltip>
        </div>
        <div className="chart-controls">
          <Space>
            <Select
              value={timeRange}
              onChange={onTimeRangeChange}
              size="small"
              style={{ width: 100 }}
            >
              <Option value="6months">6个月</Option>
              <Option value="12months">12个月</Option>
              <Option value="24months">24个月</Option>
            </Select>
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => setShowDataPoints(!showDataPoints)}
              title={showDataPoints ? '隐藏数据点' : '显示数据点'}
            />
            <Button
              type="text"
              icon={<DownloadOutlined />}
              size="small"
              onClick={onExport}
              title="导出数据"
            />
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              size="small"
              onClick={onViewDetails}
              title="查看详情"
            />
          </Space>
        </div>
      </div>

      {/* 关键指标 */}
      {renderKeyMetrics()}

      {/* 图表区域 */}
      {renderLineChart()}

      {/* 图例 */}
      {renderLegend()}

      {/* 数据洞察 */}
      <div className="data-insights">
        <div className="insight-row">
          <CalendarOutlined className="insight-icon" />
          <Text className="insight-text">
            数据范围: {data[0]?.monthLabel} - {data[data.length - 1]?.monthLabel}
            （共 {data.length} 个月）
          </Text>
        </div>
        
        {trendAnalysis && (
          <div className="insight-row">
            <TrendingUpOutlined className="insight-icon" />
            <Text className="insight-text">
              环比变化: 应发
              <Tag color={trendAnalysis.grossSalary.direction === 'up' ? 'green' : trendAnalysis.grossSalary.direction === 'down' ? 'red' : 'default'}>
                {trendAnalysis.grossSalary.direction === 'up' ? '+' : trendAnalysis.grossSalary.direction === 'down' ? '-' : ''}
                {trendAnalysis.grossSalary.percentage.toFixed(1)}%
              </Tag>
              ，实发
              <Tag color={trendAnalysis.netSalary.direction === 'up' ? 'green' : trendAnalysis.netSalary.direction === 'down' ? 'red' : 'default'}>
                {trendAnalysis.netSalary.direction === 'up' ? '+' : trendAnalysis.netSalary.direction === 'down' ? '-' : ''}
                {trendAnalysis.netSalary.percentage.toFixed(1)}%
              </Tag>
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};