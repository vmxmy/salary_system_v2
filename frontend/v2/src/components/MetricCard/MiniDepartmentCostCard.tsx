import React from 'react';
import { Typography, Spin } from 'antd';
import { 
  DollarOutlined,
  BankOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DepartmentCostData } from './index';
import './MetricCard.less';

const { Text } = Typography;

export interface MiniDepartmentCostCardProps {
  data: DepartmentCostData[];
  totalCost: number;
  totalDeductions: number;
  totalNetPay: number;
  loading?: boolean;
  onDepartmentClick?: (department: DepartmentCostData) => void;
}

export const MiniDepartmentCostCard: React.FC<MiniDepartmentCostCardProps> = ({
  data,
  totalCost,
  totalDeductions,
  totalNetPay,
  loading = false,
  onDepartmentClick
}) => {
  console.log('🚨🚨🚨 ======= MINI DEPARTMENT CARD RENDER ======= 🚨🚨🚨');
  console.log('🏢 [MiniDepartmentCostCard] 组件渲染开始');
  console.log('🏢 [MiniDepartmentCostCard] 输入数据:', { data, totalCost, loading });
  // 数据安全处理
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // 格式化金额（紧凑显示）
  const formatAmount = (amount: any, withSymbol: boolean = false): string => {
    const num = safeNumber(amount, 0);
    const symbol = withSymbol ? '¥' : '';
    
    if (num >= 100000000) {
      return `${symbol}${(num / 100000000).toFixed(1)}亿`;
    }
    if (num >= 10000) {
      return `${symbol}${(num / 10000).toFixed(1)}万`;
    }
    return `${symbol}${Math.round(num).toLocaleString('zh-CN')}`;
  };

  // 准备图表数据（显示所有部门）
  const chartData = data
    .sort((a, b) => b.currentCost - a.currentCost) 
    .map((item, index) => {
      // 数据清洗：确保关键字段不为null/undefined
      const safeDepartmentName = item.departmentName || '未知部门';
      const processedItem = {
        department: safeDepartmentName.length > 3 ? safeDepartmentName.slice(0, 3) + '...' : safeDepartmentName,
        fullName: safeDepartmentName,
        value: safeNumber(item.currentCost, 0),
        employeeCount: safeNumber(item.employeeCount, 0),
        netPay: safeNumber((item as any).currentNetPay, 0),
        deductions: safeNumber((item as any).currentDeductions, 0),
        color: item.color || `hsl(${(index * 137.5) % 360}, 70%, 60%)`, // 自动配色
        originalData: item
      };
      
      console.log(`🏢 [MiniDepartmentCostCard] 原始数据 ${index}:`, item);
      console.log(`🏢 [MiniDepartmentCostCard] 处理后数据 ${index}:`, processedItem);
      
      return processedItem;
    });

  console.log('🏢 [MiniDepartmentCostCard] 最终chartData:', chartData);

  // 自定义Tooltip
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.fullName}</p>
          <p className="tooltip-item">
            <span>成本: </span>
            <span className="tooltip-value">{formatAmount(data.value, true)}</span>
          </p>
          <p className="tooltip-item">
            <span>人数: </span>
            <span className="tooltip-value">{data.employeeCount}人</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // 自定义柱形组件
  const CustomBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload.color}
        rx={2}
        style={{ cursor: onDepartmentClick ? 'pointer' : 'default' }}
        onClick={() => onDepartmentClick?.(payload.originalData)}
      />
    );
  };

  if (loading) {
    return (
      <div className="mini-metric-card mini-department-cost">
        <div className="mini-card-loading">
          <Spin size="small" />
          <Text type="secondary">加载中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-metric-card mini-department-cost">
      {/* 头部图标信息 */}
      <div className="mini-card-header">
        <div className="icon-info primary">
          <div className="icon-wrapper">
            <DollarOutlined className="metric-icon" />
          </div>
          <div className="info-content">
            <div className="info-value">{formatAmount(totalCost, true)}</div>
            <div className="info-label">总成本</div>
          </div>
        </div>
        <div className="icon-info secondary">
          <div className="icon-wrapper">
            <BankOutlined className="metric-icon" />
          </div>
          <div className="info-content">
            <div className="info-value">{data.length}</div>
            <div className="info-label">部门</div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="mini-chart-container">
        {(() => {
          console.log('🏢 [MiniDepartmentCostCard] 图表渲染检查:', {
            chartDataLength: chartData.length,
            hasData: chartData.length > 0
          });
          
          if (chartData.length > 0) {
            console.log('🏢 [MiniDepartmentCostCard] 渲染Recharts BarChart');
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 20,
                  }}
                >
                  <XAxis 
                    dataKey="department" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    height={35}
                  />
                  <YAxis 
                    hide
                  />
                  <Tooltip content={renderTooltip} />
                  <Bar 
                    dataKey="value" 
                    shape={<CustomBar />}
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            );
          } else {
            console.log('🏢 [MiniDepartmentCostCard] 渲染空状态');
            return (
              <div className="empty-chart">
                <BarChartOutlined className="empty-icon" />
                <Text type="secondary">暂无数据</Text>
              </div>
            );
          }
        })()}
      </div>

      {/* 底部摘要 */}
      <div className="mini-card-summary">
        <div className="summary-item">
          <Text className="summary-label">实发</Text>
          <Text className="summary-value success">{formatAmount(totalNetPay, true)}</Text>
        </div>
        <div className="summary-item">
          <Text className="summary-label">扣发</Text>
          <Text className="summary-value error">{formatAmount(totalDeductions, true)}</Text>
        </div>
      </div>
    </div>
  );
};