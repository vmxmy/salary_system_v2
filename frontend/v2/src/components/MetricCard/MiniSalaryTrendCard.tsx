import React, { useMemo } from 'react';
import { Typography, Spin } from 'antd';
import { 
  LineChartOutlined,
  AreaChartOutlined,
  ExportOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  DollarOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';
import './MetricCard.less';

const { Text } = Typography;

// 定义SalaryTrendDataPoint类型，避免循环引用
export interface SalaryTrendDataPoint {
  month: string;
  monthLabel?: string;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  employeeCount: number;
}

export interface MiniSalaryTrendCardProps {
  data: SalaryTrendDataPoint[];
  loading?: boolean;
  onExport?: () => void;
}

export const MiniSalaryTrendCard: React.FC<MiniSalaryTrendCardProps> = ({
  data,
  loading = false,
  onExport
}) => {
  console.log('🎯🎯🎯 [MiniSalaryTrendCard-UPDATED] 组件渲染开始 - 这是修改后的版本！');
  console.log('📈 [MiniSalaryTrendCard] 输入数据:', { data, loading });
  
  // 调试输出最新月份数据
  if (data.length > 0) {
    const latestData = data[data.length - 1];
    console.log('🔍 [MiniSalaryTrendCard] 最新月份数据:', {
      month: latestData.month,
      monthLabel: latestData.monthLabel,
      grossSalary: latestData.grossSalary,
      grossSalaryType: typeof latestData.grossSalary,
      netSalary: latestData.netSalary,
      deductions: latestData.deductions
    });
  } else {
    console.log('⚠️ [MiniSalaryTrendCard] 没有数据点');
  }
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

  // 计算趋势分析
  const trendAnalysis = useMemo(() => {
    if (data.length < 1) {
      return {
        direction: 'stable' as const,
        percentage: 0,
        currentMonth: 0,
        previousMonth: 0,
        change: 0
      };
    }
    
    // 查找有效的数据点（应发工资大于0）
    const validDataPoints = data.filter(item => safeNumber(item.grossSalary) > 0);
    
    if (validDataPoints.length === 0) {
      return {
        direction: 'stable' as const,
        percentage: 0,
        currentMonth: 0,
        previousMonth: 0,
        change: 0
      };
    }
    
    // 获取最新的有效月份数据
    const latest = validDataPoints[validDataPoints.length - 1];
    // 获取前一个有效月份数据（如果存在）
    const previous = validDataPoints.length > 1 ? validDataPoints[validDataPoints.length - 2] : null;
    
    // 当月应发总额
    const currentGross = safeNumber(latest.grossSalary, 0);
    // 上月应发总额
    const previousGross = previous ? safeNumber(previous.grossSalary, 0) : 0;
    
    const change = currentGross - previousGross;
    const percentage = previousGross === 0 ? 0 : (change / previousGross) * 100;
    
    return {
      direction: change > 0.01 ? 'up' as const : change < -0.01 ? 'down' as const : 'stable' as const,
      percentage: Math.abs(percentage),
      currentMonth: currentGross,
      previousMonth: previousGross,
      change: Math.abs(change)
    };
  }, [data]);

  // 准备图表数据（最近6个月，Recharts 格式）
  const chartData = data
    // 确保数据按月份排序（从旧到新）
    .sort((a, b) => {
      const dateA = a.month ? new Date(a.month) : new Date(0);
      const dateB = b.month ? new Date(b.month) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-6) // 取最近6个月
    .filter(item => item && item.month) // 过滤无效数据
    .map(item => {
      const month = item.monthLabel || dayjs(item.month).format('M月');
      const grossSalary = safeNumber(item.grossSalary, 0);
      const netSalary = safeNumber(item.netSalary, 0);
      const deductions = safeNumber(item.deductions, 0);
      const employeeCount = safeNumber(item.employeeCount, 0);
      
      // 调试日志
      console.log('🔍 [MiniSalaryTrendCard] 原始数据:', item);
      console.log('🔍 [MiniSalaryTrendCard] 提取的金额:', { grossSalary, netSalary, deductions });
      
      // 转换为 Recharts 需要的格式（每个月一条记录，多个数值字段）
      return {
        month,
        grossSalary,
        netSalary,
        deductions,
        employeeCount
      };
    });

  console.log('📈 [MiniSalaryTrendCard] 最终chartData:', chartData);
  console.log('📈 [MiniSalaryTrendCard] chartData长度:', chartData.length);
  console.log('📈 [MiniSalaryTrendCard] chartData前3条:', chartData.slice(0, 3));
  console.log('📊 [MiniSalaryTrendCard] 趋势分析结果:', trendAnalysis);
  console.log('💰 [MiniSalaryTrendCard] 当月应发金额:', trendAnalysis.currentMonth);
  
  // 获取当前年份
  const currentYear = new Date().getFullYear();
  
  // 筛选本年度的数据
  const currentYearData = data.filter(item => {
    // 从 year_month 格式 "YYYY-MM" 中提取年份
    const year = item.month?.substring(0, 4) || 
                (item.monthLabel ? currentYear.toString() : "");
    return year === currentYear.toString();
  });
  
  // 计算本年度所有月份应发金额之和
  const totalGrossSalary = currentYearData.reduce((sum, item) => {
    return sum + safeNumber(item.grossSalary, 0);
  }, 0);
  
  console.log('📅 [MiniSalaryTrendCard] 当前年份:', currentYear);
  console.log('📊 [MiniSalaryTrendCard] 本年度数据点:', currentYearData);
  console.log('💰 [MiniSalaryTrendCard] 本年度应发总额:', totalGrossSalary);
  console.log('💰 [MiniSalaryTrendCard] 本年度应发总额(万元):', totalGrossSalary / 10000);
  
  // 获取上一年份
  const previousYear = currentYear - 1;
  
  // 筛选上一年度的数据
  const previousYearData = data.filter(item => {
    const year = item.month?.substring(0, 4) || "";
    return year === previousYear.toString();
  });
  
  // 计算上一年度所有月份应发金额之和
  const previousYearGrossSalary = previousYearData.reduce((sum, item) => {
    return sum + safeNumber(item.grossSalary, 0);
  }, 0);
  
  console.log('📅 [MiniSalaryTrendCard] 上一年份:', previousYear);
  console.log('📊 [MiniSalaryTrendCard] 上一年度数据点:', previousYearData);
  console.log('💰 [MiniSalaryTrendCard] 上一年度应发总额:', previousYearGrossSalary);
  console.log('💰 [MiniSalaryTrendCard] 上一年度应发总额(万元):', previousYearGrossSalary / 10000);
  
  // 计算同比增长率
  const yearOverYearGrowthRate = previousYearGrossSalary > 0 ? 
    ((totalGrossSalary - previousYearGrossSalary) / previousYearGrossSalary) * 100 : 0;
  console.log('📈 [MiniSalaryTrendCard] 同比增长率:', yearOverYearGrowthRate.toFixed(1) + '%');

  // 自定义Tooltip
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{label}</p>
          <p className="tooltip-item">
            <span style={{ color: '#1677ff' }}>应发合计: </span>
            <span className="tooltip-value">{formatAmount(data.grossSalary, true)}</span>
          </p>
          <p className="tooltip-item">
            <span style={{ color: '#52c41a' }}>实发合计: </span>
            <span className="tooltip-value">{formatAmount(data.netSalary, true)}</span>
          </p>
          <p className="tooltip-item">
            <span style={{ color: '#ff7875' }}>扣发合计: </span>
            <span className="tooltip-value">{formatAmount(data.deductions, true)}</span>
          </p>
          {data.employeeCount > 0 && (
            <p className="tooltip-item">
              <span>人数: </span>
              <span className="tooltip-value">{data.employeeCount}人</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // 获取趋势图标和颜色
  const getTrendIcon = () => {
    switch (trendAnalysis.direction) {
      case 'up':
        return <RiseOutlined className="trend-icon up" />;
      case 'down':
        return <FallOutlined className="trend-icon down" />;
      default:
        return <MinusOutlined className="trend-icon stable" />;
    }
  };

  const getTrendColor = () => {
    switch (trendAnalysis.direction) {
      case 'up':
        return '#52c41a';
      case 'down':
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  if (loading) {
    return (
      <div className="mini-metric-card mini-salary-trend">
        <div className="mini-card-loading">
          <Spin size="small" />
          <Text type="secondary">加载中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-metric-card mini-salary-trend">
      {/* 头部图标信息 */}
      <div className="mini-card-header">
        <div className="icon-info primary">
          <div className="icon-wrapper">
            <DollarOutlined className="metric-icon" />
          </div>
          <div className="info-content">
            <div className="info-value">
              {(() => {
                // 获取当前年份
                const currentYear = new Date().getFullYear();
                
                // 筛选本年度的数据
                const currentYearData = data.filter(item => {
                  // 从 year_month 格式 "YYYY-MM" 中提取年份
                  const year = item.month?.substring(0, 4) || 
                               (item.monthLabel ? currentYear.toString() : "");
                  return year === currentYear.toString();
                });
                
                // 计算本年度所有月份应发金额之和
                const totalGrossSalary = currentYearData.reduce((sum, item) => {
                  return sum + safeNumber(item.grossSalary, 0);
                }, 0);
                
                // 直接以万元为单位显示
                const amountInTenThousand = totalGrossSalary / 10000;
                return `¥${amountInTenThousand.toFixed(1)}万`;
              })()}
            </div>
            <div className="info-label">本年应发</div>
          </div>
        </div>
        <div className="icon-info secondary">
          <div className="icon-wrapper" style={{ color: getTrendColor() }}>
            {getTrendIcon()}
          </div>
          <div className="info-content">
            <div className="info-value" style={{ color: '#8c8c8c' }}>
              {(() => {
                // 获取上一年份
                const previousYear = currentYear - 1;
                
                // 筛选上一年度的数据
                const previousYearData = data.filter(item => {
                  const year = item.month?.substring(0, 4) || "";
                  return year === previousYear.toString();
                });
                
                // 计算上一年度所有月份应发金额之和
                const previousYearGrossSalary = previousYearData.reduce((sum, item) => {
                  return sum + safeNumber(item.grossSalary, 0);
                }, 0);
                
                // 如果没有上一年度数据，则显示 "-"
                if (previousYearData.length === 0 || previousYearGrossSalary === 0) {
                  return '-';
                }
                
                // 计算同比增长率
                const growthRate = ((totalGrossSalary - previousYearGrossSalary) / previousYearGrossSalary) * 100;
                return `${growthRate.toFixed(1)}%`;
              })()}
            </div>
            <div className="info-label">同比</div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="mini-chart-container">
        {loading ? (
          <div className="empty-chart">
            <Spin size="small" />
            <Text type="secondary">加载中...</Text>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#666' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#666' }}
                tickFormatter={(value) => formatAmount(value, false)}
              />
              <Tooltip content={renderTooltip} />
              <Line
                type="monotone"
                dataKey="grossSalary"
                stroke="#1677ff"
                strokeWidth={1.5}
                dot={{ r: 2, fill: '#1677ff' }}
                activeDot={{ r: 4, fill: '#1677ff' }}
              />
              <Line
                type="monotone"
                dataKey="netSalary"
                stroke="#52c41a"
                strokeWidth={1.5}
                dot={{ r: 2, fill: '#52c41a' }}
                activeDot={{ r: 4, fill: '#52c41a' }}
              />
              <Line
                type="monotone"
                dataKey="deductions"
                stroke="#ff7875"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: '#ff7875' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">
            <LineChartOutlined className="empty-icon" />
            <Text type="secondary">暂无数据</Text>
          </div>
        )}
      </div>

      {/* 底部摘要 */}
      <div className="mini-card-summary">
        <div className="summary-item">
          <Text className="summary-label">范围</Text>
          <Text className="summary-value">
            {currentYearData.length > 0 ? `${currentYear}年${currentYearData.length}个月` : '-'}
          </Text>
        </div>
        <div className="summary-item">
          <button
            type="button"
            className="export-button"
            onClick={onExport}
            title="导出数据"
          >
            <DownloadOutlined className="export-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};