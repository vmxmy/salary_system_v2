import React from 'react';
import { Typography, Spin } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './MetricCard.less';

const { Text } = Typography;

// 定义接口，避免循环引用
export interface EmployeeTypeData {
  type?: 'regular' | 'contract';
  typeName: string;
  percentage: number;
  avgSalary: number;
  totalCost: number;
  newHires?: number; 
  departures?: number;
  color?: string;
  details?: {
    senior: number;
    middle: number;
    junior: number;
  };
}

export interface MiniEmployeeTypeCardProps {
  data: EmployeeTypeData[];
  totalEmployees: number;
  loading?: boolean;
  onTypeClick?: (type: EmployeeTypeData) => void;
}

export const MiniEmployeeTypeCard: React.FC<MiniEmployeeTypeCardProps> = ({
  data,
  totalEmployees,
  loading = false,
  onTypeClick
}) => {
  console.log('👥 [MiniEmployeeTypeCard] 组件渲染开始');
  console.log('👥 [MiniEmployeeTypeCard] 输入数据:', { data, totalEmployees, loading });
  console.log('👥 [MiniEmployeeTypeCard] 详细工资数据检查:', 
    data.map(item => ({
      typeName: item.typeName,
      avgSalary: item.avgSalary,
      totalCost: item.totalCost,
      employeeCount: (item as any).employeeCount
    }))
  );
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

  // 计算人员变化
  const calculateChange = () => {
    const totalNewHires = data.reduce((sum, item) => sum + safeNumber(item.newHires, 0), 0);
    const totalDepartures = data.reduce((sum, item) => sum + safeNumber(item.departures, 0), 0);
    const netChange = totalNewHires - totalDepartures;
    
    return {
      newHires: totalNewHires,
      departures: totalDepartures,
      netChange,
      direction: netChange > 0 ? 'up' : netChange < 0 ? 'down' : 'stable'
    };
  };

  const changeStats = calculateChange();

  // 准备饼图数据（显示所有编制类型）
  const preparePieData = () => {
    if (!data || data.length === 0) return [];
    
    // 编制类型颜色映射表
    const TYPE_COLORS = {
      '正编': '#1677ff', // 蓝色
      '聘用': '#52c41a', // 绿色
      '临聘': '#faad14', // 橙色
      '合同制': '#f5222d', // 红色
      '实习': '#722ed1', // 紫色
      '退休': '#13c2c2', // 青色
      '劳务': '#eb2f96', // 粉色
      '编外': '#fa8c16',  // 橙红色
      '兼职': '#08979c',  // 深青色
      '顾问': '#7cb305',  // 黄绿色
      '返聘': '#c41d7f',  // 洋红色
      '代理': '#2f54eb',  // 宝蓝色
      '见习': '#a0d911'   // 黄绿色
    };
    
    // 按人数排序，显示所有编制类型
    const pieData = [...data].sort((a, b) => (b as any).employeeCount - (a as any).employeeCount);

    return pieData.map((item, index) => {
      // 数据清洗：确保关键字段不为null/undefined，避免原生title="null"
      const safeTypeName = item.typeName || '未分类';
      
      // 根据类型名称查找颜色
      let typeColor = '#cccccc'; // 默认灰色
      
      // 遍历颜色映射表查找匹配的编制类型
      for (const [typeName, color] of Object.entries(TYPE_COLORS)) {
        if (safeTypeName.includes(typeName)) {
          typeColor = color;
          break;
        }
      }
      
      const processedItem = {
        type: safeTypeName.length > 4 ? safeTypeName.substring(0, 4) : safeTypeName,
        fullName: safeTypeName,
        value: Math.max(safeNumber((item as any).employeeCount, 0), 0),
        percentage: safeNumber(item.percentage, 0),
        color: typeColor, // 使用根据类型确定的颜色
        // 添加工资数据到饼图数据点
        avgSalary: safeNumber(item.avgSalary, 0),
        totalCost: safeNumber(item.totalCost, 0),
        typeId: (item as any).typeId || 'unknown',
        employeeCount: (item as any).employeeCount
      };
      
      console.log(`👥 [MiniEmployeeTypeCard] 原始数据 ${index}:`, item);
      console.log(`👥 [MiniEmployeeTypeCard] 处理后数据 ${index}:`, processedItem);
      
      return processedItem;
    });
  };

  const pieData = preparePieData();
  console.log('👥 [MiniEmployeeTypeCard] 最终pieData:', pieData);

  // 自定义Tooltip
  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.fullName}</p>
          <p className="tooltip-item">
            <span>人数: </span>
            <span className="tooltip-value">{data.value}人</span>
          </p>
          <p className="tooltip-item">
            <span>占比: </span>
            <span className="tooltip-value">{data.percentage.toFixed(1)}%</span>
          </p>
          <p className="tooltip-item">
            <span>平均薪资: </span>
            <span className="tooltip-value">{formatAmount(data.avgSalary, true)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="mini-metric-card mini-employee-type">
        <div className="mini-card-loading">
          <Spin size="small" />
          <Text type="secondary">加载中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-metric-card mini-employee-type">
      {/* 头部图标信息 */}
      <div className="mini-card-header">
        <div className="icon-info primary">
          <div className="icon-wrapper">
            <UserOutlined className="metric-icon" />
          </div>
          <div className="info-content">
            <div className="info-value">{totalEmployees}</div>
            <div className="info-label">总人数</div>
          </div>
        </div>
        <div className="icon-info secondary">
          <div className="icon-wrapper">
            <TeamOutlined className="metric-icon" />
          </div>
          <div className="info-content">
            <div className="info-value">{data.length}</div>
            <div className="info-label">编制类型</div>
          </div>
        </div>
      </div>

      {/* 饼图区域 */}
      <div className="mini-chart-container">
        {loading ? (
          <div className="empty-chart">
            <Spin size="small" />
            <Text type="secondary">加载中...</Text>
          </div>
        ) : pieData.length > 0 && pieData.some(item => item.value > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                onClick={(data) => {
                  const originalType = data.find((t: any) => t.typeName === data.fullName);
                  if (originalType && onTypeClick) {
                    onTypeClick(originalType);
                  }
                }}
                style={{ cursor: onTypeClick ? 'pointer' : 'default' }}
              >
                {pieData.map((entry, index) => {
                  // 定义固定的颜色数组
                  const COLORS = [
                    '#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', 
                    '#eb2f96', '#2f54eb', '#fa8c16', '#a0d911', '#1890ff', '#fa541c', 
                    '#08979c', '#531dab', '#7cb305', '#c41d7f'
                  ];
                  
                  console.log(`渲染饼图扇区 ${index}:`, {
                    typeName: entry.fullName,
                    assignedColor: entry.color,
                    fallbackColor: COLORS[index % COLORS.length]
                  });
                  
                  // 直接使用固定颜色数组，不依赖entry.color
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  );
                })}
              </Pie>
              <Tooltip content={renderTooltip} />
              
              {/* 在图表中心添加总人数 */}
              <text 
                x="50%" 
                y="48%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  fill: '#1677ff'
                }}
              >
                {totalEmployees}
              </text>
              <text 
                x="50%" 
                y="58%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                style={{
                  fontSize: '10px',
                  fill: '#8c8c8c'
                }}
              >
                总人数
              </text>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">
            <PieChartOutlined className="empty-icon" />
            <Text type="secondary">暂无数据</Text>
          </div>
        )}
      </div>

      {/* 底部摘要 */}
      <div className="mini-card-summary">
        <div className="summary-item">
          <div className="summary-row">
            <RiseOutlined className="change-icon positive" />
            <Text className="summary-label">入职</Text>
            <Text className="summary-value positive">+{changeStats.newHires}</Text>
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-row">
            <FallOutlined className="change-icon negative" />
            <Text className="summary-label">离职</Text>
            <Text className="summary-value negative">-{changeStats.departures}</Text>
          </div>
        </div>
      </div>
    </div>
  );
};