import React, { useState, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { simplePayrollApi } from '../../pages/SimplePayroll/services/simplePayrollApi';
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
  periodId?: number; // 添加期间ID，用于获取人员身份统计
}

export const MiniEmployeeTypeCard: React.FC<MiniEmployeeTypeCardProps> = ({
  data,
  totalEmployees,
  loading = false,
  onTypeClick,
  periodId
}) => {
  // 人员身份统计数据状态
  const [personnelStats, setPersonnelStats] = useState<{
    loading: boolean;
    data: {
      categories: Array<{
        personnel_category: string;
        employee_count: number;
        gross_pay_total: number;
        net_pay_total: number;
        avg_gross_pay: number;
        avg_net_pay: number;
      }>;
      summary: {
        total_employees: number;
        total_gross_pay: number;
        total_net_pay: number;
      };
    } | null;
  }>({
    loading: false,
    data: null
  });

  // 获取人员身份统计数据
  useEffect(() => {
    const fetchPersonnelStats = async () => {
      console.log('🔍 [MiniEmployeeTypeCard] 开始获取人员身份统计数据:', { periodId });
      
      try {
        setPersonnelStats(prev => ({ ...prev, loading: true }));
        console.log('🔄 [MiniEmployeeTypeCard] 调用API中...', { periodId });
        
        const response = await simplePayrollApi.getPersonnelCategoryStats(periodId);
        console.log('📊 [MiniEmployeeTypeCard] API响应:', response);
        
        if (response.success && response.data) {
          console.log('✅ [MiniEmployeeTypeCard] 数据获取成功:', {
            categories: response.data.categories,
            categoriesLength: response.data.categories?.length,
            summary: response.data.summary
          });
          
          setPersonnelStats({
            loading: false,
            data: response.data
          });
        } else {
          console.warn('⚠️ [MiniEmployeeTypeCard] API响应无效:', { 
            success: response.success, 
            hasData: !!response.data 
          });
          setPersonnelStats({ loading: false, data: null });
        }
      } catch (error) {
        console.error('❌ [MiniEmployeeTypeCard] 获取人员身份统计失败:', error);
        setPersonnelStats({ loading: false, data: null });
      }
    };

    // 只有在有periodId或者需要获取全部数据时才调用API
    console.log('🎯 [MiniEmployeeTypeCard] useEffect触发:', { periodId, shouldFetch: true });
    fetchPersonnelStats();
  }, [periodId]);
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

      {/* 人员身份统计信息 */}
      <div className="mini-card-summary">
        {personnelStats.loading ? (
          <div className="summary-loading">
            <Spin size="small" />
            <Text type="secondary">加载统计中...</Text>
          </div>
        ) : personnelStats.data && personnelStats.data.categories.length > 0 ? (
          <div className="personnel-stats-row">
            {/* 确保正编显示在左边，聘用显示在右边 */}
            {(() => {
              const regular = personnelStats.data.categories.find(cat => cat.personnel_category === '正编');
              const contract = personnelStats.data.categories.find(cat => cat.personnel_category === '聘用');
              
              return (
                <>
                  {/* 左侧：正编 */}
                  <div className="personnel-stat-item left">
                    {regular ? (
                      <>
                        <div className="stat-header">
                          <BankOutlined className="stat-icon primary" />
                          <Text className="stat-label">正编</Text>
                        </div>
                        <div className="stat-value">
                          <Text className="main-value primary">{formatAmount(regular.net_pay_total, true)}</Text>
                        </div>
                        <div className="stat-details">
                          <Text className="detail-text">{regular.employee_count}人 · 人均{formatAmount(regular.avg_net_pay, true)}</Text>
                        </div>
                      </>
                    ) : (
                      <div className="stat-empty">
                        <Text type="secondary">正编数据</Text>
                        <Text type="secondary">暂无</Text>
                      </div>
                    )}
                  </div>

                  {/* 右侧：聘用 */}
                  <div className="personnel-stat-item right">
                    {contract ? (
                      <>
                        <div className="stat-header">
                          <TeamOutlined className="stat-icon secondary" />
                          <Text className="stat-label">聘用</Text>
                        </div>
                        <div className="stat-value">
                          <Text className="main-value secondary">{formatAmount(contract.net_pay_total, true)}</Text>
                        </div>
                        <div className="stat-details">
                          <Text className="detail-text">{contract.employee_count}人 · 人均{formatAmount(contract.avg_net_pay, true)}</Text>
                        </div>
                      </>
                    ) : (
                      <div className="stat-empty">
                        <Text type="secondary">聘用数据</Text>
                        <Text type="secondary">暂无</Text>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="personnel-stats-empty">
            <UserOutlined className="empty-icon" />
            <Text type="secondary">暂无编制统计数据</Text>
          </div>
        )}
      </div>
    </div>
  );
};