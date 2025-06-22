import React, { useState, useEffect } from 'react';
import { Typography, Spin, Button, Tooltip, message } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  DollarCircleOutlined,
  InfoCircleOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
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
        deductions_total: number;  // 添加扣除总额字段
        net_pay_total: number;
        avg_gross_pay: number;
        avg_deductions: number;  // 添加平均扣除字段
        avg_net_pay: number;
        percentage_of_total_employees?: number;
        percentage_of_total_cost?: number;
      }>;
      summary: {
        total_employees: number;
        total_gross_pay: number;
        total_deductions: number;  // 添加总扣除字段
        total_net_pay: number;
        avg_gross_pay_overall?: number;
        avg_deductions_overall?: number;
        avg_net_pay_overall?: number;
      };
      period_id?: number;
      period_name?: string;
      generated_at?: string;
    } | null;
  }>({
    loading: false,
    data: null
  });

  // 获取人员身份统计数据
  useEffect(() => {
    const fetchPersonnelStats = async () => {
      console.log('🔍 [MiniEmployeeTypeCard] 开始获取人员身份统计数据:', { periodId });
      
      if (!periodId) {
        console.warn('⚠️ [MiniEmployeeTypeCard] 缺少periodId，无法获取人员身份统计');
        setPersonnelStats({ loading: false, data: null });
        return;
      }
      
      try {
        setPersonnelStats(prev => ({ ...prev, loading: true }));
        console.log('🔄 [MiniEmployeeTypeCard] 调用API中...', { periodId });
        
        const response = await simplePayrollApi.getPersonnelCategoryStats(periodId);
        console.log('📊 [MiniEmployeeTypeCard] API响应:', response);
        console.log('📊 [MiniEmployeeTypeCard] 完整API响应数据:', JSON.stringify(response));
        
        if (response && response.data) {
          console.log('✅ [MiniEmployeeTypeCard] 数据获取成功:', {
            categories: response.data.categories,
            categoriesLength: response.data.categories?.length,
            summary: response.data.summary
          });
          
          console.log('💰 [MiniEmployeeTypeCard] 完整分类数据对象结构:', JSON.stringify(response.data.categories[0]));
          
          // 详细输出分类数据
          if (response.data.categories && response.data.categories.length > 0) {
            response.data.categories.forEach((cat, index) => {
              console.log(`✅ [MiniEmployeeTypeCard] 分类 ${index+1}:`, {
                name: cat.personnel_category,
                count: cat.employee_count,
                grossPayTotal: cat.gross_pay_total,
                deductionsTotal: cat.deductions_total,
                netPayTotal: cat.net_pay_total,
                fullObject: JSON.stringify(cat)
              });
            });
          } else {
            console.warn('⚠️ [MiniEmployeeTypeCard] API返回了数据但没有分类数据');
          }
          
          setPersonnelStats({
            loading: false,
            data: response.data
          });
        } else {
          console.warn('⚠️ [MiniEmployeeTypeCard] API响应无效:', { 
            hasData: !!response?.data 
          });
          setPersonnelStats({ loading: false, data: null });
        }
      } catch (error) {
        console.error('❌ [MiniEmployeeTypeCard] 获取人员身份统计失败:', error);
        setPersonnelStats({ loading: false, data: null });
      }
    };

    // 只有在有periodId时才调用API
    console.log('🎯 [MiniEmployeeTypeCard] useEffect触发:', { periodId, shouldFetch: !!periodId });
    if (periodId) {
      fetchPersonnelStats();
    } else {
      console.warn('⚠️ [MiniEmployeeTypeCard] 未提供periodId，跳过API调用');
      setPersonnelStats({ loading: false, data: null });
    }
    
    // 将测试函数暴露到全局对象，方便调试
    if (typeof window !== 'undefined') {
      (window as any).testPersonnelStats = async (testPeriodId: number) => {
        console.log(`📣 [DEBUG] 测试人员身份统计 API，期间ID: ${testPeriodId}`);
        try {
          const response = await simplePayrollApi.getPersonnelCategoryStats(testPeriodId);
          console.log('📣 [DEBUG] API响应:', response);
          console.log('📣 [DEBUG] API响应结构:', {
            isObject: typeof response === 'object',
            hasDataProperty: response && 'data' in response,
            dataType: response?.data ? typeof response.data : 'undefined',
            dataIsObject: response?.data ? typeof response.data === 'object' : false,
            dataHasCategories: response?.data?.categories ? Array.isArray(response.data.categories) : false,
            categoriesLength: response?.data?.categories?.length
          });
          
          if (response?.data?.categories?.length > 0) {
            console.log('📣 [DEBUG] 分类数据示例:', response.data.categories[0]);
          }
          
          return response;
        } catch (error) {
          console.error('📣 [DEBUG] API调用失败:', error);
          return null;
        }
      };
      
      // 添加解析并显示函数
      (window as any).parsePersonnelStats = (response: any) => {
        console.log('🔍 [DEBUG] 解析响应:', response);
        
        try {
          const data = response?.data;
          if (!data) {
            console.error('❌ [DEBUG] 响应中没有data字段');
            return;
          }
          
          console.log('✅ [DEBUG] 数据总览:', {
            periodId: data.period_id,
            periodName: data.period_name,
            totalEmployees: data.summary?.total_employees,
            totalNetPay: data.summary?.total_net_pay,
            categories: data.categories?.length
          });
          
          if (data.categories && data.categories.length > 0) {
            data.categories.forEach((cat: any, index: number) => {
              console.log(`👤 [DEBUG] 分类 ${index+1}:`, {
                name: cat.personnel_category,
                count: cat.employee_count,
                netPayTotal: cat.net_pay_total,
                percentage: cat.percentage_of_total_employees
              });
            });
          }
        } catch (err) {
          console.error('❌ [DEBUG] 解析出错:', err);
        }
      };
      
      // 添加调试帮助信息
      console.log('🛠️ [MiniEmployeeTypeCard] 调试辅助函数已注册到全局:');
      console.log('- window.testPersonnelStats(期间ID): 测试API并返回结果');
      console.log('- window.parsePersonnelStats(response): 解析API响应并显示结构');
    }
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

  // 格式化金额，添加千位分隔符
  const formatAmount = (amount: number | string, useShortFormat: boolean = false): string => {
    if (amount === undefined || amount === null) return '0.00';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return '0.00';
    
    // 对于特别大的数值使用万元作为单位（如果useShortFormat为true）
    if (useShortFormat && numAmount >= 10000) {
      return (numAmount / 10000).toFixed(2) + '万';
    }
    
    // 完整显示带千位分隔符的数字
    return numAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
          <div className="chart-with-stats">
            {/* 左侧：正编 */}
            {personnelStats.data && Array.isArray(personnelStats.data.categories) && personnelStats.data.categories.length > 0 && (() => {
              const regular = personnelStats.data.categories.find(cat => cat.personnel_category === '正编');
              return regular ? (
                <div className="personnel-stat-item left">
                  <div className="stat-header">
                    <BankOutlined className="stat-icon primary" />
                    <Text className="stat-label">正编 {regular.employee_count}人</Text>
                  </div>
                  <div className="stat-details">
                    <Text className="detail-text">应发:{formatAmount(regular.gross_pay_total, false)}</Text>
                    <Text className="detail-text">实发:{formatAmount(regular.net_pay_total, false)}</Text>                     
                  </div>
                </div>
              ) : null;
            })()}
            
            {/* 中间：饼图 */}
            <ResponsiveContainer width="60%" height="100%" aspect={1}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  innerRadius="55%"
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
                    
                    // 直接使用固定颜色数组，不依赖entry.color
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    );
                  })}
                </Pie>
                <RechartsTooltip content={renderTooltip} />
                
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
            
            {/* 右侧：聘用 */}
            {personnelStats.data && Array.isArray(personnelStats.data.categories) && personnelStats.data.categories.length > 0 && (() => {
              const contract = personnelStats.data.categories.find(cat => cat.personnel_category === '聘用');
              return contract ? (
                <div className="personnel-stat-item right">
                  <div className="stat-header">
                    <TeamOutlined className="stat-icon secondary" />
                    <Text className="stat-label">聘用 {contract.employee_count}人</Text>
                  </div>
                  <div className="stat-details">
                    <Text className="detail-text">应发:{formatAmount(contract.gross_pay_total, false)}</Text>
                    <Text className="detail-text">实发:{formatAmount(contract.net_pay_total, false)}</Text>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="empty-chart">
            <PieChartOutlined className="empty-icon" />
            <Text type="secondary">暂无数据</Text>
          </div>
        )}
      </div>

      {/* 人员身份统计信息 - 已移至图表两侧 */}
      {!personnelStats.data && (
        <div className="mini-card-summary">
          {personnelStats.loading ? (
            <div className="summary-loading">
              <Spin size="small" />
              <Text type="secondary">加载统计中...</Text>
            </div>
          ) : (
            <div className="personnel-stats-empty">
              <UserOutlined className="empty-icon" />
              <Text type="secondary">暂无编制统计数据</Text>
              <Tooltip title="数据获取情况">
                <Button 
                  type="text" 
                  icon={<InfoCircleOutlined />} 
                  size="small" 
                  onClick={() => {
                    message.info(`期间ID: ${periodId || '未设置'}`);
                  }}
                />
              </Tooltip>
            </div>
          )}
        </div>
      )}

      {/* 总薪资摘要栏 */}
      {personnelStats.data && personnelStats.data.summary && (
        <div className="mini-card-summary">
          <div className="personnel-stats-row">
            {/* 左侧：总应发 */}
            <div className="personnel-stat-item left">
              <div className="stat-header">
                <DollarCircleOutlined className="stat-icon primary" />
                <Text className="stat-label">总应发</Text>
              </div>
              <div className="stat-details">
                <Text className="detail-text">{formatAmount(personnelStats.data.summary.total_gross_pay, false)}</Text>
              </div>
            </div>

            {/* 右侧：总实发 */}
            <div className="personnel-stat-item right">
              <div className="stat-header">
                <DollarCircleOutlined className="stat-icon secondary" />
                <Text className="stat-label">总实发</Text>
              </div>
              <div className="stat-details">
                <Text className="detail-text">{formatAmount(personnelStats.data.summary.total_net_pay, false)}</Text>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};